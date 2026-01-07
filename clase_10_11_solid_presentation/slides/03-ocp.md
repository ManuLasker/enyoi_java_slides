<!-- .slide: class="center" -->
# O
## Open/Closed Principle

*"Las entidades de software deben estar abiertas para extensión, pero cerradas para modificación."*

--

### ❌ Violando OCP <!-- .element: class="bad" -->

```java
public class DiscountCalculator {
    public double calculate(String customerType, double amount) {
        // Cada nuevo tipo requiere MODIFICAR este método
        if (customerType.equals("REGULAR")) {
            return amount * 0.05;
        } else if (customerType.equals("PREMIUM")) {
            return amount * 0.10;
        } else if (customerType.equals("VIP")) {
            return amount * 0.20;
        }
        // ¿Nuevo tipo? Hay que modificar esta clase...
        return 0;
    }
}
```

Agregar "GOLD" requiere **modificar** código existente.

--

### ✅ Aplicando OCP <!-- .element: class="good" -->

```java
// Interfaz base
public interface DiscountStrategy {
    double calculate(double amount);
}

// Implementaciones - EXTENSIÓN sin modificación
public class RegularDiscount implements DiscountStrategy {
    public double calculate(double amount) {
        return amount * 0.05;
    }
}

public class PremiumDiscount implements DiscountStrategy {
    public double calculate(double amount) {
        return amount * 0.10;
    }
}

public class VIPDiscount implements DiscountStrategy {
    public double calculate(double amount) {
        return amount * 0.20;
    }
}
```

--

### Usando el patrón Strategy

```java
public class DiscountCalculator {
    private final DiscountStrategy strategy;

    public DiscountCalculator(DiscountStrategy strategy) {
        this.strategy = strategy;
    }

    public double calculate(double amount) {
        return strategy.calculate(amount);
    }
}

// Uso
DiscountCalculator calc = new DiscountCalculator(new VIPDiscount());
double discount = calc.calculate(1000); // 200
```

¿Nuevo tipo "GOLD"? Solo crea `GoldDiscount implements DiscountStrategy`.

--

### Beneficios de OCP

- ✅ Agregar funcionalidad sin modificar código existente
- ✅ Reduce riesgo de romper funcionalidad
- ✅ Código más estable en producción
- ✅ Facilita el testing (mockear estrategias)
