<!-- .slide: class="center" -->
# Arquitectura SOLID
## Todos los principios juntos

--

### Ejemplo: Sistema de Notificaciones

```java
// ISP: Interfaces segregadas
public interface NotificationSender {
    void send(String message, String recipient);
}

public interface NotificationLogger {
    void log(String message);
}

// OCP: Extensible sin modificar
public class EmailSender implements NotificationSender {
    public void send(String message, String recipient) {
        // Enviar email
    }
}

public class SMSSender implements NotificationSender {
    public void send(String message, String recipient) {
        // Enviar SMS
    }
}
```

--

### Servicio con DIP y SRP

```java
// SRP: Solo orquesta notificaciones
// DIP: Depende de abstracciones
public class NotificationService {
    private final NotificationSender sender;
    private final NotificationLogger logger;

    public NotificationService(NotificationSender sender,
                               NotificationLogger logger) {
        this.sender = sender;
        this.logger = logger;
    }

    public void notify(String message, String recipient) {
        sender.send(message, recipient);
        logger.log("Notificación enviada a: " + recipient);
    }
}
```

--

### Uso flexible

```java
// Email
NotificationService emailService = new NotificationService(
    new EmailSender(),
    new FileLogger()
);

// SMS
NotificationService smsService = new NotificationService(
    new SMSSender(),
    new ConsoleLogger()
);

// Push (nuevo - OCP: solo agregar clase)
NotificationService pushService = new NotificationService(
    new PushSender(),
    new DatabaseLogger()
);
```

--

### Resumen SOLID

| Principio | Clave |
|-----------|-------|
| **S**RP | Una responsabilidad por clase |
| **O**CP | Extender sin modificar |
| **L**SP | Subtipos sustituibles |
| **I**SP | Interfaces pequeñas y específicas |
| **D**IP | Depender de abstracciones |

> **Resultado**: Código mantenible, testeable y extensible.
