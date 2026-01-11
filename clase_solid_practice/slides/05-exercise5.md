# Ejercicio 5: EventManager
<!-- .element: class="r-fit-text" -->

--

## El Problema

```java
public class EventManager {
  // Logs de eventos (debería estar separado)
  private List<Map<String, Object>> eventLogs = new ArrayList<>();
  
  // Configuración hardcodeada (viola DIP)
  private String adminEmail = "admin@company.com";
  private String adminPhone = "+1234567890";
  private String slackWebhook = "https://hooks.slack.com/services/xxx";
  
  /**
   * Maneja un evento y realiza todas las notificaciones necesarias.
   * 
   * PROBLEMAS:
   * - Switch gigante para cada tipo de evento
   * - Cada rama hace múltiples cosas
   * - Imposible agregar nuevos listeners sin modificar
   * - Acoplamiento directo a métodos de notificación
   */
  public void handleEvent(String eventType, Map<String, Object> eventData) {
    // Log del evento (debería estar separado)
    logEvent(eventType, eventData);
    
    // Switch gigante - cada tipo de evento tiene lógica diferente
    switch (eventType.toUpperCase()) {
      case "USER_REGISTERED":
        handleUserRegistered(eventData);
        break;
      case "ORDER_PLACED":
        handleOrderPlaced(eventData);
        break;
      case "PAYMENT_RECEIVED":
        handlePaymentReceived(eventData);
        break;
      case "SYSTEM_ALERT":
        handleSystemAlert(eventData);
        break;
      default:
        System.out.println("⚠️ Unknown event type: " + eventType);
    }
  }
  
  /**
   * Manejo de registro de usuario.
   * Mezcla múltiples responsabilidades.
   */
  private void handleUserRegistered(Map<String, Object> data) {
    //lógica acá
  }
  
  /**
   * Manejo de pedido realizado.
   * Múltiples notificaciones hardcodeadas.
   */
  private void handleOrderPlaced(Map<String, Object> data) {
    // lógica acá
  }
  
  /**
   * Manejo de pago recibido.
   */
  private void handlePaymentReceived(Map<String, Object> data) {
    // lógica acá
  }
  
  /**
   * Manejo de alerta del sistema.
   * Notificaciones urgentes.
   */
  private void handleSystemAlert(Map<String, Object> data) {
    // lógica acá
  }
  
  // ========== MÉTODOS DE NOTIFICACIÓN (cada uno debería ser su propia clase) ==========
  
  private void sendWelcomeEmail(String email, String name) {
    // lógica acá
  }
  
  private void sendEmailToMarketing(String userName, String userEmail) {
    // lógica acá
  }
  
  private void sendOrderConfirmationEmail(String email, String orderId, Double amount) {
    // lógica acá
  }
  
  private void sendPaymentReceiptEmail(String email, String paymentId, Double amount) {
    // lógica acá
  }
  
  private void sendAlertEmail(String email, String level, String component, String message) {
    // lógica acá
  }
  
  private void sendOrderSms(String phone, String orderId) {
    // lógica acá
  }
  
  private void sendAlertSms(String phone, String component, String message) {
    // lógica acá
  }
  
  private void sendSlackNotification(String channel, String message) {
    // lógica acá
  }
  
  private void updateDashboard(String metric, int value) {
    // lógica acá
  }
  
  private void logEvent(String eventType, Map<String, Object> data) {
    // lógica acá
  }
  
  public List<Map<String, Object>> getEventLogs() {
    // lógica acá
  }
}
```
<!-- .element: style="font-size: 0.45em;" -->

--

## Violaciones Detectadas

**SRP**: El EventManager hace demasiadas cosas:
<!-- .element: style="text-align: left;" -->

- Maneja eventos
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Envía emails
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Envía SMS
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Actualiza dashboard
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Guarda logs
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Notifica a Slack
<!-- .element: style="text-align: left; margin-left: 2em;" -->

--

## Más Violaciones

| Principio | Problema |
|:---------:|:---------|
| **OCP** | Para agregar nuevo tipo de notificación hay que modificar el switch/case en `handleEvent()` |
| **DIP** | Acoplamiento directo a implementaciones concretas de notificación |
<!-- .element: style="font-size: 0.85em;" -->

--

## Patrón de Diseño Principal

**Observer Pattern**: Este es EL patrón para este problema
<!-- .element: style="text-align: center; font-size: 1.1em;" -->

El Observer Pattern permite:
<!-- .element: style="text-align: left;" -->

- Múltiples "observadores" se suscriben a eventos
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Cuando ocurre un evento, todos los observadores son notificados
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Agregar/quitar observadores sin modificar el EventManager
<!-- .element: style="text-align: left; margin-left: 2em;" -->

--

## Conceptos del Observer Pattern

| Concepto | Descripción |
|:--------:|:------------|
| **Subject** (Observable) | Quien publica eventos (`EventPublisher`) |
| **Observer** (Listener) | Quien escucha eventos (`EventListener`) |
| `subscribe()` | Registrar un observer |
| `unsubscribe()` | Quitar un observer |
| `notify()` | Avisar a todos los observers |
<!-- .element: style="font-size: 0.85em;" -->

--

## Estructura Refactorizada

```
exercise5_events/refactored/
    ├── event/
    │   ├── Event.java                  (Clase base o interface)
    │   ├── UserRegisteredEvent.java
    │   ├── OrderPlacedEvent.java
    │   ├── PaymentReceivedEvent.java
    │   └── SystemAlertEvent.java
    ├── listener/
    │   ├── EventListener.java          (Interface - Observer)
    │   ├── EmailNotificationListener.java
    │   ├── SmsNotificationListener.java
    │   ├── SlackNotificationListener.java
    │   ├── DashboardUpdateListener.java
    │   └── AuditLogListener.java
    ├── publisher/
    │   └── EventPublisher.java         (Observable/Subject)
    └── EventManager.java               (Facade/Orquestador)
```
<!-- .element: style="font-size: 0.45em;" -->

**Resultado**: Sistema de eventos desacoplado y extensible
<!-- .element: style="text-align: center; margin-top: 1em;" -->