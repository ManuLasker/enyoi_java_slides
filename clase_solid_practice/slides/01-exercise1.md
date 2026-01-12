# Ejercicio 1: NotificationService 
<!-- .element: class="r-fit-text" -->

--

## El Problema

```java
public class NotificationService {
  // Almacén de logs (debería estar en otra clase - viola SRP)
  private List<String> notificationLogs = new ArrayList<>();
  
  /**
   * Método principal que envía notificaciones.
   *
   * PROBLEMAS:
   * - Switch/case gigante que viola OCP
   * - Múltiples responsabilidades mezcladas
   * - Difícil de testear unitariamente
   * - No permite mockear las dependencias
   */
  public boolean sendNotification(String type, String recipient, String message) {
    // Validación mezclada aquí (viola SRP)
    if (recipient == null || recipient.trim().isEmpty()) {
      logNotification("ERROR", type, recipient, "Recipient is empty");
      return false;
    }
    
    if (message == null || message.trim().isEmpty()) {
      logNotification("ERROR", type, recipient, "Message is empty");
      return false;
    }
    
    // Switch gigante - cada nuevo tipo requiere modificar esta clase (viola OCP)
    boolean success = false;
    switch (type.toUpperCase()) {
      case "EMAIL":
        success = sendEmail(recipient, message);
        break;
      case "SMS":
        success = sendSms(recipient, message);
        break;
      case "PUSH":
        success = sendPushNotification(recipient, message);
        break;
      default:
        logNotification("ERROR", type, recipient, "Unknown notification type: " + type);
        return false;
    }
    
    if (success) {
      logNotification("SUCCESS", type, recipient, message);
    } else {
      logNotification("FAILED", type, recipient, message);
    }
    
    return success;
  }
  
  /**
   * Envío de email - hardcodeado aquí (viola SRP y DIP)
   * Debería estar en su propia clase que implemente una interfaz.
   */
  private boolean sendEmail(String email, String message) {
    // lógica acá
  }
  
  /**
   * Envío de SMS - hardcodeado aquí (viola SRP y DIP)
   */
  private boolean sendSms(String phoneNumber, String message) {
    // lógica acá
  }
  
  /**
   * Envío de Push - hardcodeado aquí (viola SRP y DIP)
   */
  private boolean sendPushNotification(String deviceToken, String message) {
    // lógica acá
  }
  
  // ========== MÉTODOS DE FORMATEO (deberían estar separados - viola SRP) ==========
  
  private String formatEmailMessage(String message) {
    // lógica acá
  }
  
  private String formatSmsMessage(String message) {
    // lógica acá
  }
  
  private String formatPushMessage(String message) {
    // lógica acá
  }
  
  // ========== LOGGING (debería estar separado - viola SRP) ==========
  
  private void logNotification(String status, String type, String recipient, String message) {
    // lógica acá
  }
  
  public List<String> getNotificationLogs() {
    // lógica acá
  }
  
  public void clearLogs() {
    // lógica acá
  }
}
```
<!-- .element: style="font-size: 0.45em;" -->

--

## Violaciones Detectadas


1. **SRP (Single Responsibility):** Esta clase tiene MÚLTIPLES responsabilidades
  - Envía emails
  - Envía SMS
  - Envía Push notifications
  - Formatea mensajes
  - Guarda logs de notificaciones
  - Valida datos de entrada
2. **OCP (Open/Closed):** Para agregar un nuevo tipo de notificación (WhatsApp,
   Slack, etc.) hay que MODIFICAR esta clase en lugar de EXTENDERLA.
3. **DIP (Dependency Inversion):** La clase depende de implementaciones
    concretas (los métodos de envío) en lugar de abstracciones.

<!-- .slide: style="font-size: 0.85em;" -->
--

## Patrones de Diseño Sugeridos

Para refactorizar esta clase aplicaremos:

| Patrón | Propósito |
|:------:|:----------|
| **Strategy** | Encapsular cada tipo de envío de notificación |
| **Factory** | Crear las estrategias de notificación |
<!-- .element: style="font-size: 0.9em;" -->

Cada tipo de notificación será una **estrategia independiente**
<!-- .element: style="text-align: center; margin-top: 1em;" -->

--

## Estructura Refactorizada

```
exercise1_notifications/refactored/
    │
    ├── NotificationSender.java        (Interface - Strategy)
    ├── EmailNotificationSender.java   (Implementación concreta)
    ├── SmsNotificationSender.java     (Implementación concreta)
    ├── PushNotificationSender.java    (Implementación concreta)
    ├── NotificationResult.java        (Dto de Respuesta)
    │
    │
    ├── NotificationSenderFactory.java (Factory para crear senders)
    │
    ├── NotificationLogger.java        (Responsabilidad separada)
    ├── NotificationLogEntry.java      (Dto LogEntry)
    │
    └── NotificationService.java       (Orquestador limpio)
```
<!-- .element: style="font-size: 0.55em;" -->

**Resultado**: Una clase por responsabilidad
<!-- .element: style="text-align: center; margin-top: 1em;" -->
