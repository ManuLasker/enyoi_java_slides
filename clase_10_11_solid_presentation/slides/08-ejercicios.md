<!-- .slide: class="center" -->
# Ejercicios Prácticos

--

## Ejercicio 1: Identificar violaciones

Analiza este código y encuentra qué principios SOLID viola:

```java
public class OrderProcessor {
    public void process(Order order) {
        // Calcular total
        double total = 0;
        for (Item item : order.getItems()) {
            total += item.getPrice();
        }

        // Aplicar descuento
        if (order.getCustomer().getType().equals("VIP")) {
            total *= 0.8;
        }

        // Guardar en BD
        Connection conn = DriverManager.getConnection("...");
        // SQL...

        // Enviar email
        EmailClient client = new EmailClient();
        client.send(order.getCustomer().getEmail(), "Pedido procesado");
    }
}
```

--

## Ejercicio 2: Refactorizar

Aplica SOLID al código anterior:

1. **SRP**: Separar en `OrderCalculator`, `OrderRepository`, `OrderNotifier`
2. **OCP**: Crear `DiscountStrategy` para diferentes tipos de cliente
3. **DIP**: Inyectar dependencias vía constructor

--

## Ejercicio 3: Diseñar desde cero

Diseña un sistema de pagos que soporte:
- Tarjeta de crédito
- PayPal
- Transferencia bancaria
- (Fácil agregar nuevos métodos)

Aplica:
- **ISP**: `PaymentProcessor`, `Refundable`, `Recurring`
- **OCP**: Nuevos métodos sin modificar código existente
- **DIP**: `PaymentService` recibe `PaymentProcessor`

---

<!-- .slide: class="center" -->
# ¡Gracias!

### ¿Preguntas?

**Prof. Emanuel Afanador**
