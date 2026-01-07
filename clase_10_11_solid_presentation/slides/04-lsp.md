<!-- .slide: class="center" -->
# L
## Liskov Substitution Principle

*"Los objetos de una clase derivada deben poder sustituir objetos de la clase base sin alterar el comportamiento del programa."*

--

### ❌ Violando LSP <!-- .element: class="bad" -->

```java
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public int getArea() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width; // ¡Cambia ambos!
    }

    @Override
    public void setHeight(int height) {
        this.width = height;
        this.height = height; // ¡Cambia ambos!
    }
}
```

--

### El problema

```java
public void testRectangle(Rectangle rect) {
    rect.setWidth(5);
    rect.setHeight(4);
    // Esperamos área = 20
    assert rect.getArea() == 20; // ¡FALLA con Square!
}

Rectangle rect = new Square();
testRectangle(rect); // ¡Comportamiento inesperado!
```

`Square` **no puede sustituir** a `Rectangle` correctamente.

--

### ✅ Aplicando LSP <!-- .element: class="good" -->

```java
public interface Shape {
    int getArea();
}

public class Rectangle implements Shape {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    public int getArea() { return width * height; }
}

public class Square implements Shape {
    private final int side;

    public Square(int side) { this.side = side; }

    public int getArea() { return side * side; }
}
```

Ahora ambos cumplen el contrato de `Shape` correctamente.

--

### Beneficios de LSP

- ✅ Herencia correcta y predecible
- ✅ Polimorfismo que funciona
- ✅ Código cliente no necesita conocer subtipos
- ✅ Tests unitarios válidos para toda la jerarquía
