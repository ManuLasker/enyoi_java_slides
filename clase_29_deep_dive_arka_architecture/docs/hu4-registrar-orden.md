# HU4 — Registrar Orden de Compra: Diseño Arquitectónico (Core Transaccional)

## Resumen

La creación de una orden de compra es el proceso más complejo del sistema porque involucra múltiples contextos (Órdenes, Inventario y Catálogo). Para garantizar la integridad de los datos sin afectar el rendimiento ni bloquear la base de datos, se utiliza el **Patrón Saga por Coreografía** impulsado por Kafka.

---

## Flujo de la Saga (Creación de Orden)

```mermaid
sequenceDiagram
    participant CART as ms-cart (MongoDB)
    participant KCart as Kafka: cart-eventos
    participant ORD as ms-order (PostgreSQL)
    participant KOrd as Kafka: orden-eventos
    participant INV as ms-inventory (PostgreSQL)
    participant KInv as Kafka: inventario-eventos
    participant CAT as ms-catalog (MongoDB)
    participant KProd as Kafka: producto-eventos
    participant PAY as ms-payment (PostgreSQL)
    participant KPay as Kafka: pago-eventos
    participant NOTIF as ms-notifications
    participant REP as ms-reporter (PostgreSQL)

    Note over CART, KCart: HU8: Cliente hizo click en Checkout
    
    CART->>KCart: Emitir "CheckoutSolicitado"<br/>(Incluye items y precios)
    KCart->>ORD: Consume "CheckoutSolicitado"
    
    Note over ORD: 1. Crear Orden PENDIENTE
    ORD->>ORD: Guardar Order (status=PENDIENTE)<br/>vinculada al cartId

    Note over ORD: 🔒 Outbox Pattern
    ORD->>KOrd: Emitir "OrdenCreada"

    KOrd->>CAT: Consume "OrdenCreada"
    KOrd->>REP: Consume "OrdenCreada"
    REP->>REP: Registro inmutable (Event Sourcing)

    Note over CAT: ✅ FASE 1: Camino Feliz (Happy Path)
    alt Todo Fluye Sin Errores
        
        Note over CAT: 1. Validar Catálogo (Precios/Existencia)
        CAT->>KProd: Emitir "CatalogoValidado"
        
        Note over INV: 2. Reservar Inventario
        KProd->>INV: Consume "CatalogoValidado"
        INV->>INV: DB: SELECT ... FOR UPDATE
        INV->>INV: UPDATE stock (Resta stock_records)
        INV->>KInv: Emitir "StockReservado"

        Note over PAY: 3. Validar Pago (Gateway Externo)
        KInv->>PAY: Consume "StockReservado"
        PAY->>KPay: Emitir "PagoAprobado"
        
        Note over ORD: 🔄 Resolución Exitosa de la Saga
        ORD->>KPay: Consume "PagoAprobado"
        ORD->>ORD: Actualizar Order status = CONFIRMADA
        ORD->>KOrd: Emitir "OrdenConfirmada" (Activa notificaciones)
        
        par Secundarios (Notificaciones y Log)
            KOrd->>NOTIF: Consume "OrdenConfirmada"
            NOTIF-->>Cliente: Email "¡Tu orden ha sido confirmada!"
            KOrd->>REP: Consume "OrdenConfirmada"
            REP->>REP: Registro inmutable (Event Sourcing)
        end

    else ❌ FASE 2: Caminos de Fallo y Compensaciones
        
        Note over CAT: Fallo 1: Catálogo Inválido
        CAT->>KProd: Emitir "ProductoInvalido"
        
        Note over INV: Fallo 2: Sin Stock
        INV->>KInv: Emitir "StockInsuficiente"
        
        Note over PAY: Fallo 3: Pago Rechazado
        PAY->>KPay: Emitir "PagoRechazado"

        Note over INV: ⏪ Compensación Secuencial (Por Fallo 3)
        KPay->>INV: Consume "PagoRechazado"
        INV->>INV: UPDATE stock (Devuelve stock_records)
        INV->>KInv: Emitir "StockReleased"

        Note over ORD: 🔄 Resolución Fallida de la Saga
        KProd->>ORD: Consume "ProductoInvalido"
        KInv->>ORD: Consume "StockInsuficiente" o "StockReleased"
        
        ORD->>ORD: Actualizar Order status = FALLIDA / CANCELADA
        ORD->>KOrd: Emitir "OrdenCancelada"
        
        par Notificación y Auditoría de Fallo
            KOrd->>NOTIF: Consume "OrdenCancelada"
            NOTIF-->>Cliente: Email "Orden cancelada (Detalle en el perfil)"
            KOrd->>REP: Consume "OrdenCancelada" (Registro inmutable)
        end
    end
```

---

## Máquina de Estados de la Orden

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE: Orden creada
    PENDIENTE --> VALIDANDO_CATALOGO: ms-catalog verificando
    VALIDANDO_CATALOGO --> RESERVANDO_STOCK: Catalogo OK
    RESERVANDO_STOCK --> COBRANDO: Stock OK
    COBRANDO --> CONFIRMADA: Pago OK
    
    PENDIENTE --> CANCELADA: ProductoInvalido
    VALIDANDO_CATALOGO --> CANCELADA: StockInsuficiente
    COBRANDO --> COMPENSANDO_STOCK: PagoRechazado
    COMPENSANDO_STOCK --> CANCELADA: StockReleased
    
    CONFIRMADA --> EN_DESPACHO: Empaquetada
    EN_DESPACHO --> ENTREGADA: Finalizada
    CANCELADA --> [*]
```

| Estado | Significado para el Negocio |
|--------|-----------------------------|
| `PENDIENTE` | Recibida, pero aún no se ha garantizado el inventario. |
| `CONFIRMADA` | Stock garantizado e inventario descontado. Lista para envío. |
| `CANCELADA` | No se pudo procesar (Ej: se intentó comprar más de lo que había). |
| `EN_DESPACHO`| Entregada al transportista. |
| `ENTREGADA` | Cliente recibió la mercancía. |

---

## Manejo de Concurrencia (El Problema de la Sobreventa)

El problema principal de ARKA se soluciona en la interacción entre Kafka y `ms-inventory`.

1. Cuando llegan 1000 órdenes al mismo tiempo, **Kafka actúa como un amortiguador (buffer)**. Las órdenes no tumban la base de datos, se encolan en el tópico `orden-eventos`.
2. `ms-inventory` consume estos eventos a su propio ritmo.
3. Para evaluar cada evento, usa **Pessimistic Locking** en PostgreSQL (`SELECT FOR UPDATE`).

```sql
-- Operación atómica en ms-inventory por cada item de la orden
UPDATE stock_records 
SET current_stock = current_stock - 5,
    updated_at = NOW()
WHERE product_id = '1234-uuid' 
  AND current_stock >= 5; -- 🛡️ Esta condición es vital
```
Si la actualización retorna `0 filas afectadas` (porque el stock era menor a 5), `ms-inventory` sabe que debe emitir `ReservaInventarioRechazada`, evitando la sobreventa.

---

## Flujo de Cancelación Manual (Compensación Post-Confirmación)

Cuando un administrador anula una orden que ya estaba **CONFIRMADA** (ej. cliente llamó para cancelar antes del despacho), debemos ejecutar una **Saga de Compensación Pura** para revertir todo lo asíncronamente hecho.

La cancelación manual opera como un efecto dominó en reversa.

```mermaid
sequenceDiagram
    participant ADM as Admin (Frontend)
    participant GW as API Gateway
    participant ORD as ms-order (PostgreSQL)
    participant KOrd as Kafka: orden-eventos
    participant PAY as ms-payment (PostgreSQL)
    participant KPay as Kafka: pago-eventos
    participant INV as ms-inventory (PostgreSQL)
    participant KInv as Kafka: inventario-eventos
    participant NOTIF as ms-notifications

    ADM->>GW: POST /api/v1/orders/{id}/cancel
    GW->>ORD: Forward
    
    Note over ORD: 1. Iniciar Cancelación
    ORD->>ORD: Validar que no esté DESPACHADA
    ORD->>ORD: Actualizar Order status = CANCELADA
    ORD->>KOrd: Emitir "OrdenCanceladaManualmente"

    Note over PAY: 2. Reversar el Dinero
    KOrd->>PAY: Consume "OrdenCanceladaManualmente"
    PAY->>PAY: Disparar Refund en Stripe API
    PAY->>KPay: Emitir "ReembolsoCompletado"
    
    Note over INV: 3. Reversar el Inventario
    KPay->>INV: Consume "ReembolsoCompletado"
    INV->>INV: UPDATE stock (Devolver stock_records)
    INV->>KInv: Emitir "StockRestauradoManualmente"
    
    Note over NOTIF: 4. Avisar al Cliente
    KInv->>NOTIF: Consume "StockRestauradoManualmente"
    NOTIF-->>Cliente: Email "Tu orden ha sido anulada y tu dinero fue reembolsado."
```

### Explicación Dinámica (Coreografía del Rollback)

A diferencia de un fallo técnico silencioso, una Orden `CONFIRMADA` tiene implicaciones fiscales y financieras reales (Dinero en banco, mercancía separada). Por ello, cada microservicio ejecuta una compensación explícita:

1. **`ms-order` (Iniciador):** Actúa como la puerta de entrada para la intervención humana. Valida que la caja aún no haya salido en el camión (`!= EN_DESPACHO`). Al cancelar, emite la intención de reversa.
2. **`ms-payment` (Reembolso Financiero):** Escucha la cancelación y asume la responsabilidad más crítica: ejecutar un **Refund API Call** contra la pasarela (ej. Stripe/MercadoPago). Este paso asegura que el cliente reciba su dinero de vuelta, cuadrando la contabilidad B2B y evitando contracargos. Una vez aprobado por el banco, emite éxito.
3. **`ms-inventory` (Restauración de Activos):** Escucha que el dinero ya fue devuelto. Toma los ítems físicos apartados y los suma de nuevo al `current_stock` disponible para venta utilizando un `INSERT INTO stock_history` clasificado formalmente como "Devolución por Cancelación". No hay fuga de inventario.
4. **`ms-notifications` (Cierre del Ciclo):** Avisa al cliente final que el proceso burocrático de anulación ha concluido a su favor.

---

## Estructura de Eventos Core

### OrdenCreada
```json
{
  "eventId": "uuid",
  "eventType": "OrdenCreada",
  "aggregateId": "order-123",
  "aggregateType": "Order",
  "payload": {
    "orderId": "order-123",
    "customerId": "cust-888",
    "totalValue": 4499.50,
    "paymentToken": "tok_visa_123",
    "items": [
      { "productId": "prod-1", "quantity": 5 },
      { "productId": "prod-2", "quantity": 1 }
    ]
  }
}
```

### ReservaInventarioAprobada / Rechazada
```json
{
  "eventId": "uuid",
  "eventType": "ReservaInventarioAprobada", /* o ReservaInventarioRechazada */
  "aggregateId": "order-123", /* Se correlaciona con el ID de la orden */
  "aggregateType": "OrderProcess",
  "payload": {
    "orderId": "order-123",
    "reason": "Stock verificado exitosamente" /* O la razón del rechazo */
  }
}
```

---

## Consideraciones Adicionales

1. **API 100% Asíncrona (Event-Driven):** `ms-order` **no expone un endpoint POST** para crear órdenes. La creación es un proceso reactivo que inicia exclusivamente al consumir `CheckoutSolicitado` proveniente de `ms-cart`. Para que el frontend (cliente final) conozca si su orden pasó a `CONFIRMADA` o fue `CANCELADA`, debe hacer *Polling* (ej. `GET /api/v1/orders/by-cart/{cartId}`) o utilizar Server-Sent Events (SSE) / WebSockets desde un BFF.
2. **Máquina de Estados Secuencial:** En lugar de acumular respuestas en paralelo, la saga viaja a través de los servicios en un orden estricto de menor a mayor riesgo financiero (`Catálogo` -> `Inventario` -> `Pago`). Si uno de los microservicios se cae, un proceso `@Scheduled` (Cronjob) en `ms-order` busca órdenes atascadas en `PENDIENTE` por más de 5 minutos, las marca como `CANCELADA` (por timeout) y emite el evento de cancelación para obligar a los demás a hacer rollback funcional.
3. **Idempotencia en Inventario:** Qué pasa si Kafka entrega el evento `CatalogoValidado` dos veces a `ms-inventory`? `ms-inventory` debe llevar una tabla de `processed_orders` para garantizar que no descuenta el stock dos veces para la misma orden.
4. **Patrón Outbox:** Al igual que en todos los microservicios core, cualquier cambio de estado (ej. cambiar a `CONFIRMADA`) y la emisión de su evento respectivo (`OrdenConfirmada`) se persisten en la misma transacción SQL local antes de llegar a Kafka.
