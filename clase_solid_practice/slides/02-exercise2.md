# Ejercicio 2: OrderProcessor
<!-- .element: class="r-fit-text" -->

--

## El Problema

```java
public class OrderProcessor {
  public Map<String, Object> processOrder(String customerType, List<Map<String, Object>> items) {
    // ============ VALIDACIÓN (debería estar separada) ============
    if (items == null || items.isEmpty()) {
      throw new IllegalArgumentException("Order must have at least one item");
    }
    
    for (Map<String, Object> item : items) {
      if (!item.containsKey("name") || !item.containsKey("price") || !item.containsKey("quantity")) {
        throw new IllegalArgumentException("Each item must have name, price and quantity");
      }
      double price = ((Number) item.get("price")).doubleValue();
      int quantity = ((Number) item.get("quantity")).intValue();
      if (price <= 0 || quantity <= 0) {
        throw new IllegalArgumentException("Price and quantity must be positive");
      }
    }
    
    // ============ CÁLCULO DE SUBTOTAL ============
    double subtotal = 0;
    for (Map<String, Object> item : items) {
      double price = ((Number) item.get("price")).doubleValue();
      int quantity = ((Number) item.get("quantity")).intValue();
      subtotal += price * quantity;
    }
    
    // ============ CÁLCULO DE DESCUENTO (viola OCP - switch gigante) ============
    double discountPercentage = 0;
    switch (customerType.toUpperCase()) {
      case "REGULAR":
        discountPercentage = 0;
        break;
      case "PREMIUM":
        discountPercentage = 0.10; // 10%
        // Premium también tiene envío gratis si compra > $100
        break;
      case "VIP":
        discountPercentage = 0.20; // 20%
        // VIP tiene envío gratis siempre
        break;
      case "EMPLOYEE":
        discountPercentage = 0.30; // 30%
        break;
      default:
        discountPercentage = 0;
    }
    
    double discountAmount = subtotal * discountPercentage;
    double afterDiscount = subtotal - discountAmount;
    
    // ============ CÁLCULO DE IMPUESTOS (debería estar separado) ============
    double taxRate = 0.19; // 19% IVA
    double taxAmount = afterDiscount * taxRate;
    double total = afterDiscount + taxAmount;
    
    // ============ CÁLCULO DE ENVÍO (lógica compleja mezclada) ============
    double shippingCost = calculateShipping(customerType, subtotal);
    total += shippingCost;
    
    // ============ PERSISTENCIA (debería estar en Repository) ============
    String orderId = "ORD-" + String.format("%05d", orderIdCounter++);
    Map<String, Object> order = new HashMap<>();
    order.put("orderId", orderId);
    order.put("customerType", customerType);
    order.put("items", new ArrayList<>(items));
    order.put("subtotal", subtotal);
    order.put("discountPercentage", discountPercentage);
    order.put("discountAmount", discountAmount);
    order.put("taxAmount", taxAmount);
    order.put("shippingCost", shippingCost);
    order.put("total", total);
    order.put("status", "CREATED");
    order.put("createdAt", LocalDateTime.now().toString());
    
    ordersDatabase.put(orderId, order);
    
    return order;
  }

  private double calculateShipping(String customerType, double subtotal) {
    // Lógica acá
  }


  private Map<String, Object> getOrder(String orderId) {
    // lógica acá
  }


  public List<Map<String, Object>> getAllOrders() {
    // lógica acá
  }
}
```
<!-- .element: style="font-size: 0.45em;" -->

--

## Violaciones Detectadas

**SRP**: Esta clase hace DEMASIADAS cosas:
<!-- .element: style="text-align: left;" -->

- Calcula descuentos
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Valida pedidos
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Persiste en "base de datos"
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Envía notificaciones
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Calcula impuestos
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Genera facturas
<!-- .element: style="text-align: left; margin-left: 2em;" -->

--

## Más Violaciones

| Principio | Problema |
|:---------:|:---------|
| **OCP** | Para agregar nuevo tipo de descuento hay que MODIFICAR los switch/if-else |
| **LSP** | Los tipos de clientes no son intercambiables (comportamiento hardcodeado) |
| **DIP** | Dependencias concretas en lugar de abstracciones |
<!-- .element: style="font-size: 0.85em;" -->

--

## Patrones de Diseño Sugeridos

| Patrón | Propósito |
|:------:|:----------|
| **Strategy** | Diferentes algoritmos de descuento |
| **Repository** | Abstraer la persistencia |
| **Factory** | Crear las estrategias de descuento |
<!-- .element: style="font-size: 0.9em;" -->

Cada responsabilidad en su propia clase
<!-- .element: style="text-align: center; margin-top: 1em;" -->

--

## Estructura Refactorizada

```
exercise2_orders/refactored/
    ├── model/
    │   ├── Order.java
    │   ├── OrderItem.java
    │   ├── CustomerType.java
    │   ├── OrderStatus.java
    │   ├── ValidationResult.java
    │   └── Customer.java
    ├── discount/
    │   ├── DiscountStrategy.java          (Interface)
    │   ├── RegularCustomerDiscount.java   (Implementación)
    │   ├── PremiumCustomerDiscount.java   (Implementación)
    │   ├── VipCustomerDiscount.java       (Implementación)
    │   ├── EmployeeCustomerDiscount.java  (Implementación)
    │   └── DiscountStrategyFactory.java
    ├── repository/
    │   ├── OrderRepository.java           (Interface)
    │   └── InMemoryOrderRepository.java   (Implementación)
    ├── validator/
    │   └── OrderValidator.java
    ├── tax/
    │   ├── ShippingCalculator.java
    │   └── TaxCalculator.java
    └── OrderService.java                  (Orquestador limpio)
```
<!-- .element: style="font-size: 0.5em;" -->

**Resultado**: Separación clara de responsabilidades
<!-- .element: style="text-align: center; margin-top: 1em;" -->
