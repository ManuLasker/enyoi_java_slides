# Ejercicio 4: PaymentProcessor
<!-- .element: class="r-fit-text" -->

--

## El Problema

```java
public class PaymentProcessor {
  // Historial de transacciones (debería estar en repositorio)
  private List<Map<String, Object>> transactionHistory = new ArrayList<>();
  private int transactionCounter = 1;
  
  /**
   * Procesa un pago según el método especificado.
   * 
   * PROBLEMAS:
   * - Switch gigante que viola OCP
   * - Cada rama tiene lógica completamente diferente (viola LSP)
   * - Imposible agregar nuevos métodos de pago sin modificar
   */
  public Map<String, Object> processPayment(String paymentMethod, double amount, 
                         Map<String, String> paymentDetails) {
    // Validación básica mezclada aquí
    if (amount <= 0) {
      return createErrorResult("Amount must be positive");
    }
    
    if (paymentDetails == null || paymentDetails.isEmpty()) {
      return createErrorResult("Payment details are required");
    }
    
    Map<String, Object> result;
    
    // VIOLA OCP: Switch gigante para cada método de pago
    switch (paymentMethod.toUpperCase()) {
      case "CREDIT_CARD":
        result = processCreditCard(amount, paymentDetails);
        break;
      case "DEBIT_CARD":
        result = processDebitCard(amount, paymentDetails);
        break;
      case "BANK_TRANSFER":
        result = processBankTransfer(amount, paymentDetails);
        break;
      case "CRYPTO":
        result = processCrypto(amount, paymentDetails);
        break;
      default:
        return createErrorResult("Unsupported payment method: " + paymentMethod);
    }
    
    // Log de transacción (debería estar separado)
    if ((boolean) result.get("success")) {
      logTransaction(paymentMethod, amount, result);
    }
    
    return result;
  }
  
  /**
   * Procesar tarjeta de crédito.
   * VIOLA LSP: Comportamiento específico no intercambiable.
   */
  private Map<String, Object> processCreditCard(double amount, Map<String, String> details) {
    // lógica acá
  }
  
  /**
   * Procesar tarjeta de débito.
   * VIOLA LSP: Comportamiento específico diferente.
   */
  private Map<String, Object> processDebitCard(double amount, Map<String, String> details) {
    // lógica acá
  }
  
  /**
   * Procesar transferencia bancaria.
   * VIOLA LSP: Comportamiento completamente diferente.
   */
  private Map<String, Object> processBankTransfer(double amount, Map<String, String> details) {
    // lógica acá
  }
  
  /**
   * Procesar pago con criptomonedas.
   * VIOLA LSP: Modelo completamente diferente.
   */
  private Map<String, Object> processCrypto(double amount, Map<String, String> details) {
    // lógica acá
  }
  
  // ========== MÉTODOS AUXILIARES ==========
  
  private boolean isValidExpiry(String expiry) {
    // lógica acá
  }
  
  private double getExchangeRate(String cryptoType) {
    // lógica acá
  }

  private String generateTransactionId() {
    // lógica acá
  }
  
  private Map<String, Object> createErrorResult(String message) {
    // lógica acá
  }
  
  private void logTransaction(String method, double amount, Map<String, Object> result) {
    // lógica acá
  }
  
  public List<Map<String, Object>> getTransactionHistory() {
    // lógca acá
  }
}
```
<!-- .element: style="font-size: 0.5em;" -->

--

## Violaciones Detectadas

| Principio | Problema |
|:---------:|:---------|
| **OCP** | El switch/case gigante para tipos de pago. Para agregar PayPal, Apple Pay hay que MODIFICAR la clase |
| **LSP** | Los métodos de pago NO son intercambiables (lógica hardcodeada) |
| **SRP** | La clase hace validación, procesamiento, logging y notificación |
| **DIP** | Dependencias concretas en lugar de abstracciones |
<!-- .element: style="font-size: 0.8em;" -->

--

## Sobre LSP (Liskov Substitution)

LSP dice: *"Los objetos de una clase derivada deben poder sustituir objetos de la clase base sin alterar el comportamiento del programa"*
<!-- .element: style="text-align: left; font-style: italic;" -->

**En este código se viola porque:**
<!-- .element: style="text-align: left;" -->

- Cada tipo de pago tiene validaciones diferentes hardcodeadas
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- No hay un contrato común que todos cumplan
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- El comportamiento cambia drásticamente según el tipo
<!-- .element: style="text-align: left; margin-left: 2em;" -->

--

## Solución LSP

Con el refactoring, todas las implementaciones de `PaymentMethod` deben:
<!-- .element: style="text-align: left;" -->

| Método | Responsabilidad |
|:------:|:----------------|
| `validatePaymentDetails()` | Validar datos de entrada |
| `process()` | Procesar el pago |
| `PaymentResult` | Retornar resultado consistente |
<!-- .element: style="font-size: 0.9em;" -->

Contrato común para todos los métodos de pago
<!-- .element: style="text-align: center; margin-top: 1em;" -->

--

## Patrones de Diseño Sugeridos

| Patrón | Propósito |
|:------:|:----------|
| **Strategy** | Cada método de pago como estrategia |
| **Factory** | Crear las estrategias de pago |
| **Template Method** | Flujo común de pagos (opcional) |
<!-- .element: style="font-size: 0.9em;" -->

--

## Estructura Refactorizada

```
exercise4_payments/refactored/
    ├── model/
    │   ├── PaymentRequest.java
    │   └── PaymentResult.java
    ├── method/
    │   ├── PaymentMethod.java          (Interface - Strategy)
    │   ├── CreditCardPayment.java
    │   ├── DebitCardPayment.java
    │   ├── BankTransferPayment.java
    │   └── CryptoPayment.java
    ├── factory/
    │   └── PaymentMethodFactory.java
    ├── validator/
    │   └── PaymentValidator.java
    └── PaymentService.java             (Orquestador)
```
<!-- .element: style="font-size: 0.5em;" -->

**Resultado**: Métodos de pago intercambiables y extensibles
<!-- .element: style="text-align: center; margin-top: 1em;" -->