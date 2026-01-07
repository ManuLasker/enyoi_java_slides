<!-- .slide: class="center" -->
# S
## Single Responsibility Principle

*"Una clase debe tener una, y solo una, razón para cambiar."*

--

### ❌ Violando SRP <!-- .element: class="bad" -->

```java
public class Employee {
    private String name;
    private double salary;

    // Lógica de negocio
    public double calculateBonus() {
        return salary * 0.1;
    }

    // Persistencia - ¡OTRA RESPONSABILIDAD!
    public void saveToDatabase() {
        // Código SQL para guardar...
    }

    // Presentación - ¡OTRA RESPONSABILIDAD!
    public String generateReport() {
        return "Employee: " + name + ", Salary: " + salary;
    }
}
```

Esta clase tiene **3 razones para cambiar**: reglas de negocio, base de datos, formato de reporte.

--

### ✅ Aplicando SRP <!-- .element: class="good" -->

```java
// Clase 1: Solo datos y lógica de negocio
public class Employee {
    private String name;
    private double salary;

    public double calculateBonus() {
        return salary * 0.1;
    }
    // Getters y setters...
}

// Clase 2: Solo persistencia
public class EmployeeRepository {
    public void save(Employee employee) {
        // Código SQL...
    }
    public Employee findById(Long id) { /* ... */ }
}

// Clase 3: Solo presentación
public class EmployeeReportGenerator {
    public String generate(Employee employee) {
        return "Employee: " + employee.getName();
    }
}
```

--

### Beneficios de SRP

- ✅ Clases más pequeñas y enfocadas
- ✅ Más fáciles de entender
- ✅ Más fáciles de testear
- ✅ Cambios no afectan otras partes
- ✅ Mejor reutilización de código
