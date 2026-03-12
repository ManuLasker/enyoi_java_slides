# HU1 — Registrar Producto: Diseño Arquitectónico

## Resumen

El registro de productos utiliza una **Saga por coreografía** entre `ms-catalog` y `ms-inventory`. El producto nace con estado `EN_CREACION` y solo se hace visible para los clientes cuando `ms-inventory` confirma la inicialización del stock, cambiando al estado `CONFIRMADO`. Los reintentos son **automáticos** con backoff exponencial; la intervención manual es solo un último recurso.

---

## Flujo de la Saga

```mermaid
sequenceDiagram
    participant Admin as 👤 Admin
    participant GW as API Gateway
    participant CAT as ms-catalog (MongoDB)
    participant OBX as Outbox Poller
    participant KP as Kafka: producto-eventos
    participant PROV as ms-provider (PostgreSQL)
    participant KProv as Kafka: provider-eventos
    participant INV as ms-inventory (PostgreSQL)
    participant KI as Kafka: inventario-eventos
    participant REP as ms-reporter (PostgreSQL)

    Admin->>GW: POST /api/v1/products
    Note right of Admin: { name, description, price,<br/>category, initialStock, threshold }
    GW->>CAT: Forward request

    CAT->>CAT: Validar datos del producto

    Note over CAT: 🔒 OUTBOX PATTERN<br/>Transacción atómica en MongoDB
    CAT->>CAT: 1. Guardar Producto (status=EN_CREACION)<br/>2. Guardar evento en colección "outbox"<br/>⬆️ Misma transacción MongoDB
    CAT-->>Admin: 201 Created { productId, status: EN_CREACION }

    Note over OBX: Proceso que lee el outbox<br/>cada N ms (polling) o<br/>con Change Streams de MongoDB
    OBX->>CAT: Leer eventos pendientes del outbox
    OBX->>KP: Publicar "ProductoRegistrado"
    OBX->>CAT: Marcar evento como publicado ✅

    KP->>PROV: Consume "ProductoRegistrado"
    KP->>REP: Consume "ProductoRegistrado"
    REP->>REP: Registro inmutable (Event Sourcing)

    Note over PROV: 1. Validar Proveedor
    PROV->>PROV: DB: Buscar provider_id
    alt ✅ Proveedor Existe
        PROV->>KProv: Emitir "ProveedorValidado"
    else ❌ Proveedor No Existe
        PROV->>KProv: Emitir "ProveedorInvalido"
    end

    Note over KProv: Topic: provider-eventos

    Note over INV: 2. Inicializar Stock (Condicionado)
    KProv->>INV: Consume "ProveedorValidado"
    
    Note over INV: 🛡️ IDEMPOTENCIA<br/>Verificar si ya existe stock_record
    
    alt ✅ No existe → Crear stock
        INV->>INV: INSERT stock_record<br/>(productId, stock, threshold)
        INV->>KI: Emitir "InventarioInicializado" ✅
        KI->>CAT: Consume "InventarioInicializado"
        CAT->>CAT: Actualizar status = CONFIRMADO ✅
        Note over CAT: Ahora visible para clientes
        KI->>REP: Consume "InventarioInicializado"
        REP->>REP: Registro inmutable
    else ⚠️ Ya existe (evento duplicado)
        INV->>INV: Ignorar (ya procesado)
    else ❌ Falla temporal (BD down, timeout)
        Note over INV: REINTENTOS AUTOMÁTICOS
        INV-->>KP: Retry con backoff
        alt ❌ Todos los reintentos agotados
            INV->>KI: Emitir "InventarioFallido" al DLQ ☠️
            KI->>CAT: Consume "InventarioFallido"
            CAT->>CAT: Actualizar status = FALLIDO ❌
        end
    end

    Note over KI: Topic: inventario-eventos
    
    Note over KProv: Topic: provider-eventos
    KProv->>CAT: Consume "ProveedorInvalido"
    CAT->>CAT: Actualizar status = RECHAZADO ❌
```

---

## Outbox Pattern en Detalle

**Problema:** Si `ms-catalog` guarda el producto en MongoDB y luego publica a Kafka, puede fallar entre ambas operaciones (producto guardado pero evento nunca publicado = producto atrapado en `EN_CREACION` para siempre).

**Solución:** El Outbox Pattern garantiza que el producto y el evento se guardan en una **misma transacción atómica** en MongoDB.

```mermaid
flowchart LR
    subgraph "Transacción Atómica MongoDB"
        A[Guardar Producto<br/>status = EN_CREACION] --> B[Guardar evento<br/>en colección outbox]
    end
    B --> C[Outbox Poller<br/>lee eventos pendientes]
    C --> D[Publicar en Kafka]
    D --> E[Marcar evento<br/>como publicado]
```

### Colección `outbox` en MongoDB

```json
{
  "_id": "outbox-uuid",
  "aggregateId": "product-uuid",
  "aggregateType": "Producto",
  "eventType": "ProductoRegistrado",
  "payload": {
    "productId": "product-uuid",
    "name": "Teclado Mecánico RGB",
    "description": "Teclado mecánico con switches Cherry MX",
    "price": 89.99,
    "category": "PERIFERICOS",
    "providerId": "provider-uuid-5678",
    "initialStock": 100,
    "threshold": 20
  },
  "createdAt": "2026-03-11T08:49:00Z",
  "published": false
}
```

### ¿Cómo se publica?

Dos opciones para el Outbox Poller:

| Opción | Mecanismo | Pros | Contras |
|--------|-----------|------|---------|
| **Polling** | `@Scheduled` cada 500ms lee documentos con `published: false` | Simple, funciona con cualquier BD | Latencia mínima de polling |
| **Change Streams** | MongoDB Change Streams detecta inserciones en el outbox en tiempo real | Casi tiempo real, reactivo | Requiere replica set en MongoDB |

> [!NOTE]
> El Outbox Poller puede publicar el **mismo evento más de una vez** (at-least-once delivery). Por eso **la idempotencia en `ms-inventory` es esencial**.

---

## Idempotencia en Detalle

**Problema:** Con reintentos automáticos y Outbox Pattern, `ms-inventory` puede recibir el **mismo evento `ProductoRegistrado` múltiples veces**.

**Solución:** Antes de crear el `stock_record`, verificar si ya existe uno para ese `product_id`.

```java
public void inicializarStock(ProductoRegistradoEvent event) {
    // 🛡️ Verificación de idempotencia
    if (stockRepository.existsByProductId(event.getProductId())) {
        log.info("Stock ya inicializado para producto {}. Ignorando evento duplicado.",
                 event.getProductId());
        return; // No hacer nada, ya fue procesado
    }

    // Crear nuevo registro de stock
    StockRecord stock = StockRecord.builder()
        .productId(event.getProductId())
        .currentStock(event.getInitialStock())
        .threshold(event.getThreshold())
        .build();

    stockRepository.save(stock); // UNIQUE constraint en product_id como respaldo

    // Emitir evento de confirmación
    kafkaTemplate.send("inventario-eventos",
        new InventarioInicializadoEvent(event.getProductId(), stock));
}
```

**Doble protección:**
1. **Lógica de negocio:** `existsByProductId()` verifica antes de insertar
2. **Base de datos:** Constraint `UNIQUE` en `product_id` como respaldo — si por alguna race condition ambas verificaciones pasan, la BD rechaza el duplicado

---

## Máquina de Estados del Producto

```mermaid
stateDiagram-v2
    [*] --> EN_CREACION: Admin crea producto
    EN_CREACION --> VALIDANDO_PROVEEDOR: Esperando ms-provider
    VALIDANDO_PROVEEDOR --> RECHAZADO: ProveedorInvalido ❌
    VALIDANDO_PROVEEDOR --> EN_CREACION_STOCK: ProveedorValidado ✅
    
    EN_CREACION_STOCK --> EN_CREACION_STOCK: Reintentos automáticos (1s → 5s → 30s)
    EN_CREACION_STOCK --> CONFIRMADO: InventarioInicializado ✅
    EN_CREACION_STOCK --> FALLIDO: DLQ (reintentos agotados) ❌
    
    FALLIDO --> EN_CREACION: Admin reintenta
    RECHAZADO --> [*]
    CONFIRMADO --> INACTIVO: Admin desactiva
    INACTIVO --> CONFIRMADO: Admin reactiva
```

| Estado | Visible al Cliente | Descripción |
|--------|-------------------|-------------|
| `EN_CREACION` / `VALIDANDO_PROVEEDOR` | ❌ No | Producto registrado, en proceso de verificación de Integridad (Saga) |
| `CONFIRMADO` | ✅ Sí | Stock inicializado y proveedor verificado. Producto disponible |
| `RECHAZADO` | ❌ No | Proveedor inexistente en la base de datos B2B. Proceso abortado |
| `FALLIDO` | ❌ No | Error técnico (BD caída). Reintentos automáticos agotados |
| `INACTIVO` | ❌ No | Desactivado manualmente por el admin |

---

## Estrategia de Reintentos Automáticos

```java
@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 1000, multiplier = 5, maxDelay = 30000),
    dltStrategy = DltStrategy.FAIL_ON_ERROR
)
@KafkaListener(topics = "producto-eventos", groupId = "ms-inventory")
public void onProductoRegistrado(ProductoRegistradoEvent event) {
    stockService.inicializarStock(event);
}
```

| Intento | Delay | Acción |
|---------|-------|--------|
| 1 (original) | 0 | Procesamiento normal |
| 2 (retry) | 1s | Primer reintento automático |
| 3 (retry) | 5s | Segundo reintento |
| 4 (retry) | 30s | Último reintento |
| DLQ | — | Mensaje al Dead Letter Queue + alerta al admin |

---

## Modelos de Dominio

### ms-catalog (MongoDB)

**Colección `products`:**
```json
{
  "_id": "product-uuid",
  "name": "Teclado Mecánico RGB",
  "description": "Teclado mecánico con switches Cherry MX",
  "price": 89.99,
  "category": "PERIFERICOS",
  "providerId": "provider-uuid-5678",
  "status": "EN_CREACION",
  "createdAt": "2026-03-11T08:49:00Z",
  "updatedAt": "2026-03-11T08:49:00Z"
}
```

**Colección `outbox`:** (ver sección Outbox Pattern)

> [!IMPORTANT]
> `ms-catalog` **NO** almacena stock ni threshold. Esos datos viajan en el evento hacia `ms-inventory`.

### ms-inventory (PostgreSQL)

```sql
CREATE TABLE stock_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE,  -- 🛡️ Garantía de idempotencia
    current_stock INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### ms-reporter (PostgreSQL) — Event Store

```sql
CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

## Eventos de Dominio

### ProductoRegistrado

```json
{
  "eventId": "uuid",
  "eventType": "ProductoRegistrado",
  "timestamp": "2026-03-11T08:49:00Z",
  "aggregateId": "product-uuid",
  "aggregateType": "Producto",
  "payload": {
    "productId": "product-uuid",
    "name": "Teclado Mecánico RGB",
    "description": "Teclado mecánico con switches Cherry MX",
    "price": 89.99,
    "category": "PERIFERICOS",
    "providerId": "provider-uuid-5678",
    "initialStock": 100,
    "threshold": 20
  }
}
```

### InventarioInicializado

```json
{
  "eventId": "uuid",
  "eventType": "InventarioInicializado",
  "timestamp": "2026-03-11T08:49:01Z",
  "aggregateId": "product-uuid",
  "aggregateType": "StockRecord",
  "payload": {
    "productId": "product-uuid",
    "currentStock": 100,
    "threshold": 20
  }
}
```

### InventarioFallido (Compensación)

```json
{
  "eventId": "uuid",
  "eventType": "InventarioFallido",
  "timestamp": "2026-03-11T08:49:31Z",
  "aggregateId": "product-uuid",
  "aggregateType": "StockRecord",
  "payload": {
    "productId": "product-uuid",
    "reason": "Todos los reintentos automáticos agotados",
    "totalAttempts": 4
  }
}
```

---

## Tópicos de Kafka

| Tópico | Productor | Consumidores |
|--------|-----------|-------------|
| `producto-eventos` | Outbox Poller (`ms-catalog`) | `ms-inventory`, `ms-reporter` |
| `producto-eventos-retry-*` | Kafka (automático) | `ms-inventory` (reintentos) |
| `producto-eventos-dlt` | Kafka (automático) | Alertas / Admin |
| `inventario-eventos` | `ms-inventory` | `ms-catalog`, `ms-reporter` |

---

## Separación de Responsabilidades (DDD)

| Responsabilidad | Microservicio | Base de Datos |
|-----------------|---------------|---------------|
| Identidad del producto (qué es) | `ms-catalog` | MongoDB |
| Cantidad en stock (cuánto hay) | `ms-inventory` | PostgreSQL |
| Auditoría y trazabilidad | `ms-reporter` | PostgreSQL |

> [!IMPORTANT]
> **Regla de oro:** Cada microservicio es la **única fuente de verdad** para sus datos. Toda comunicación entre microservicios es vía **eventos en Kafka**.

---

## Resumen de Patrones de Resiliencia

```mermaid
flowchart TB
    subgraph "ms-catalog"
        A[Guardar Producto + Evento<br/>en misma transacción] -->|"🔒 OUTBOX PATTERN"| B[Colección outbox]
        B --> C[Outbox Poller publica a Kafka]
    end

    subgraph "Kafka"
        C --> D[producto-eventos]
        D -->|"falla"| E["Retry Topics (1s→5s→30s)<br/>🔄 REINTENTOS AUTOMÁTICOS"]
        E -->|"agotados"| F["DLQ ☠️"]
    end

    subgraph "ms-inventory"
        D --> G["¿Ya existe stock_record?<br/>🛡️ IDEMPOTENCIA"]
        G -->|"No → crear"| H[INSERT stock_record]
        G -->|"Sí → ignorar"| I[Log: evento duplicado]
        H --> J[Emitir InventarioInicializado]
    end
```
