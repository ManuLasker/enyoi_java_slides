<!-- .slide: class="center" -->
# I
## Interface Segregation Principle

*"Los clientes no deben ser forzados a depender de interfaces que no utilizan."*

--

### ❌ Violando ISP <!-- .element: class="bad" -->

```java
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
    void writeReport();
}

public class Robot implements Worker {
    public void work() { /* OK */ }

    // ¡Un robot no come!
    public void eat() {
        throw new UnsupportedOperationException();
    }

    // ¡Un robot no duerme!
    public void sleep() {
        throw new UnsupportedOperationException();
    }

    public void attendMeeting() { /* OK */ }
    public void writeReport() { /* OK */ }
}
```

`Robot` está forzado a implementar métodos que no le aplican.

--

### ✅ Aplicando ISP <!-- .element: class="good" -->

```java
// Interfaces segregadas y específicas
public interface Workable {
    void work();
}

public interface Feedable {
    void eat();
}

public interface Sleepable {
    void sleep();
}

public interface Meetable {
    void attendMeeting();
    void writeReport();
}
```

--

### Implementaciones limpias

```java
// Humano implementa todas las que necesita
public class Human implements Workable, Feedable, 
                              Sleepable, Meetable {
    public void work() { /* ... */ }
    public void eat() { /* ... */ }
    public void sleep() { /* ... */ }
    public void attendMeeting() { /* ... */ }
    public void writeReport() { /* ... */ }
}

// Robot solo implementa lo que puede hacer
public class Robot implements Workable, Meetable {
    public void work() { /* ... */ }
    public void attendMeeting() { /* ... */ }
    public void writeReport() { /* ... */ }
}
```

--

### Beneficios de ISP

- ✅ Interfaces pequeñas y cohesivas
- ✅ Clases no implementan métodos innecesarios
- ✅ Menor acoplamiento
- ✅ Más fácil de mockear en tests
- ✅ Cambios en una interfaz no afectan a clientes que no la usan
