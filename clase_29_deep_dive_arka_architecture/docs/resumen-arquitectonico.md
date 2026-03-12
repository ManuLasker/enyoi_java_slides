# Revisión Arquitectónica Final: Proyecto ARKA B2B

Como Arquitecto de Software, he realizado una revisión exhaustiva de los 9 documentos de diseño creados para el ecosistema microservicios de ARKA (`HU1`, `HU2`, `HU3`, `HU4`, `HU5`, `HU6`, `HU7`, `HU8`, `EXTRA-ms-payment`, `EXTRA-ms-provider`).

A continuación, presento mi evaluación crítica de la consistencia del diseño, los riesgos mitigados, y las recomendaciones para la fase de implementación.

---

## 1. Consistencia del Ecosistema (Hallazgos Positivos)

El sistema ha logrado una cohesión excepcional alrededor del modelo **Event-Driven Architecture (EDA)**.

1.  **Sagas Secuenciales Optimizadas:** La HU4 (Órdenes) fue promovida de un enfoque Paralelo a un enfoque **Secuencial (Catálogo -> Inventario -> Pago)**. Esto elimina drásticamente los riesgos financieros de los rollbacks bancarios, asegurando que el cobro solo ocurra cuando la mercancía está físicamente garantizada.
2.  **Anti-Corruption Layers (ACL):**
    *   `ms-payment` aísla al sistema de la latencia de las pasarelas bancarias (Stripe/Wompi).
    *   `ms-provider` actúa como barrera de seguridad recibiendo el webhook externo de recepción de mercancía para no exponer directamente a `ms-inventory`.
3.  **Trazabilidad y Resiliencia de Datos:**
    *   `ms-cart` transicionó correctamente a **MongoDB** (JSON Documents), optimizando la estructura anidada de un carrito.
    *   El patrón **Outbox (Transactional Outbox)** está documentado consistentemente en `ms-catalog`, `ms-inventory` y `ms-order` para prevenir la pérdida de eventos hacia Kafka en caso de fallos de red.
    *   **Historial Inmutable:** `ms-inventory` posee su propia tabla local de auditoría (`stock_history`) y `ms-reporter` centraliza la historia global mediante **Event Sourcing** (Append-Only Data).
4.  **Desacoplamiento Operacional (CQRS):** La arquitectura asíncrona de reportes pesados vía **AWS S3 + Notificaciones** (HU7) protege al servidor principal de caídas por *"Out of Memory"* durante la generación de excels de 500MB.
5.  **Seguridad y Zero Trust (Domain Filtering):** Delegación absoluta de la autenticación a **Microsoft Entra ID (Federated Identities)**. Mediante *Tenant Restrictions*, se bloquean correos públicos (`@gmail.com`) en el mismo portal de Microsoft. El **API Gateway** asume el rol de validador de JWT y propagador de identidad (`X-User-Email`), garantizando que los microservicios core se mantengan 100% *stateless* y agnósticos al proveedor de identidad.

---

## 2. Observaciones Críticas y Riesgos (Lo que el equipo de Dev debe cuidar)

Si bien el diseño en papel (MD) es sólido, la implementación de este ecosistema distribuido conlleva retos técnicos complejos que los desarrolladores deben vigilar de cerca:

### A. Consistencia Eventual y UX (Frontend)
*   **Riesgo:** Como casi todo es asíncrono (crear productos, cobrar pagos, reportes), el Usuario/Admin a menudo recibirá un HTTP `202 Accepted` en lugar de un `200 OK` inmediato.
*   **Mitigación recomendada para Frontend:** El frontend (React/Angular) deberá implementar estrategias de *Polling* ligero o *WebSockets* (SignalR/Socket.io) para avisarle al usuario cuando la saga termine en el backend, o usar UI optimista con mensajes claros ("Procesando tu pago...").

### B. Idempotencia Rigurosa en Consumidores (Kafka)
*   **Riesgo:** Kafka garantiza entrega "Al menos una vez" (At-least-once delivery). Esto significa que, por latencias de red, `ms-inventory` podría recibir dos veces el mismo evento de `OrdenCreada`. Si el log de negocio no es idempotente, se descontaría el stock dos veces para el mismo pedido.
*   **Mitigación (La Base de Datos como Escudo):** El equipo debe implementar una de estas 3 estrategias en cada `@KafkaListener` que modifique datos:
    1.  **Tabla de Eventos Procesados (Recomendada para `ms-inventory`):** Crear una tabla `processed_events (event_id UUID)`. Al consumir un evento, el código intenta hacer un `INSERT` del ID del evento antes de procesarlo. Si la BD rechaza el INSERT por llave duplicada, el evento ya se procesó en el pasado y se ignora de forma segura.
    2.  **Constraint Único Compuesto (Para `ms-payment`):** Crear un `UNIQUE INDEX` combinando `order_id` y `status`. Si llegan dos eventos para cobrar la orden #123, el primer guardado de `(123, 'APPROVED')` es exitoso. El segundo intento estallará en la BD, previniendo el cobro doble.
    3.  **CQS Relativo (Optimistic Locking):** Si se lanzan eventos de "sumar" o "restar", el evento debe incluir la `version` esperada de la fila, y el `UPDATE` SQL debe obligar el match (`WHERE id=? AND version=?`).

### C. Versionado de Eventos (Evolución de Contratos)
*   **Riesgo:** Hoy el evento `OrdenConfirmada` tiene 5 campos. En 6 meses, negocio pide agregar el campo "descuento". Si cambiamos el JSON abruptamente, `ms-reporter` y `ms-notifications` podrían romperse al intentar parsearlo.
*   **Mitigación:** Usar un Schema Registry (ej. Confluent Avro) o forzar al equipo a hacer cambios solo aditivos (nunca renombrar o borrar campos existentes en los JSON payloads compartidos por Kafka).

---

## 3. Topología de Red y Componentes (Visto Bueno Final)

La suite de microservicios quedó definida así:

| Microservicio | Base de Datos | Responsabilidad Principal | Dominio |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | - | Validación JWT (Entra ID), Enrutamiento, Rate Limiting, CORS | Edge / Security |
| **`ms-catalog`** | MongoDB | Dueño del producto base | OLTP Core |
| **`ms-inventory`** | PostgreSQL | Dueño transaccional de existencias | OLTP Core |
| **`ms-order`** | PostgreSQL | Máquina de estados de pedidos (Saga Orchestrator passivo) | OLTP Core |
| **`ms-cart`** | MongoDB | Manejo temporal y transitorio de sesiones | OLTP Edge |
| **`ms-payment`** | PostgreSQL | Transacciones, PCI-DSS, Interacciones con Banco | Integration |
| **`ms-provider`** | PostgreSQL | Catálogo de proveedores y reabastecimiento | Integration |
| **`ms-notifications`** | MongoDB | Envíos pasivos de Email/SMS. Log de envíos | Utility |
| **`ms-reporter`** | PostgreSQL | Data Lake, Event Sourcing, Consultas Analíticas (JSONB) | OLAP / CQRS |

### ¿Por qué estas Bases de Datos? (Decisión Arquitectónica)

La polarización entre SQL y NoSQL en ARKA no fue accidental, cada motor resuelve un requerimiento B2B específico que maximiza el rendimiento y la seguridad:

**PostgreSQL (Relacional y Transaccional):**
Se eligió como el guardián del núcleo financiero y logístico (`ms-inventory`, `ms-order`, `ms-payment`, `ms-provider`).
- **Bloqueos (Pessimistic Locking):** Inventario necesita ejecutar `SELECT FOR UPDATE` para encolar peticiones concurrentes y evitar vender stock ficticio. PostgreSQL es el rey indiscutible del control de concurrencia ACID.
- **Transacciones Locales (Outbox):** Garantiza que la orden y el evento de Kafka se guarden de forma atómica en la misma transacción SQL.
- **JSONB Híbrido:** Para `ms-reporter`, PostgreSQL permite guardar payloads crudos de eventos en formato `JSONB` pero también permite crear índices GIN para hacer analítica profunda (CQRS), ofreciendo lo mejor de ambos mundos (Esquema libre + Consulta Estructurada).

**MongoDB (Documentos NoSQL):**
Se eligió para los contextos donde la data se lee y guarda como un "Agregado Completo" (`ms-catalog`, `ms-cart`, `ms-notifications`).
- **Velocidad de Lectura:** El catálogo de productos es el servicio que más tráfico de lectura recibe. MongoDB brilla entregando documentos pre-ensamblados al frontend en milisegundos sin hacer costosos JOINs de 5 tablas.
- **Estructura Dinámica:** En `ms-catalog`, un teclado tiene atributos diferentes (switches) a un monitor (hercios). MongoDB permite que cada SKU tenga un perfil de propiedades distinto (Polimorfismo).
- **Mutaciones Atómicas (Arrays):** En `ms-cart`, un "Carrito" y sus 15 items son un solo documento JSON. Mongo permite agregar y sacar productos de ese array con un solo comando atómico (`$push` / `$pull`).

---

## Veredicto Arquitectónico

**APROBADO.** El diseño supera los estándares modernos para aplicaciones de alta concurrencia B2B. Los patrones seleccionados (Saga, Outbox, Event Sourcing, CQRS, ACL) atacan directamente los problemas de sobreventa, bloqueos síncronos y dependencia acoplada del monolito original.

### Siguientes Pasos (Fase de Implementación)
El equipo de ingeniería tiene luz verde para proceder con:
1.  **Infraestructura as Code:** Creación del `docker-compose.yml` que levante Kafka, PostgreSQL, MongoDB y LocalStack.
2.  **Scaffolding:** Generación de cascarones Spring Boot / Node con los conectores a Kafka.
3.  **Scripts DB:** Creación de las migraciones Flyway/Liquibase basándose en los schemas de `.md`.

---

## 6. Edge Cases y Recomendaciones Futuras para Implementación

La arquitectura está lista para producción, pero el equipo de desarrollo debe tener en cuenta dos escenarios límite (Edge Cases) durante la fase de codificación:

### Caso Borde 1: El Falso Positivo del Carrito Abandonado (HU8)
Actualmente, `ms-cart` evalúa si un carrito lleva 48 horas sin modificaciones (`updatedAt`) para declararlo `ABANDONADO`. 
*   **Escenario:** Si el cliente intenta pagar, la Saga (HU4) falla por falta de fondos bancarios, y el carrito vuelve al estado `ACTIVO`, el campo `updatedAt` se renovará hoy. Esto significa que el Cronjob esperará *nuevas* 48 horas desde el fallo para enviar el correo de rescate.
*   **Recomendación de Implementación:** Si el negocio B2B requiere inmediatez tras un pago fallido, el estado que retorna la saga compensatoria debería ser diferente (ej. `ERROR_PAGO`) para que un listener dispare el correo **de inmediato**, en lugar de depender del cronjob general de abandono pasivo.

### Caso Borde 2: Paginación Infinita en Historial de Órdenes (HU5)
En el diseño actual (HU5), el cliente B2B consulta `GET /orders/me` directamente contra `ms-order` (PostgreSQL).
*   **Escenario:** Tras años de operación, una empresa cliente podría tener decenas de miles de facturas y órdenes archivadas. Hacer consultas `ORDER BY created_at DESC` con paginación profunda será lento en una base transaccional que está intentando bloquear inventarios en paralelo.
*   **Recomendación de Crecimiento (Día 2):** Cuando ARKA escale masivamente, la responsabilidad de servir el historial histórico de órdenes debería migrarse hacia **`ms-reporter`**. Como `ms-reporter` utiliza Event Sourcing y CQRS, está naturalmente diseñado para indexar y servir listas masivas de lectura estática sin bloquear las inserciones del core de compras de `ms-order`.
