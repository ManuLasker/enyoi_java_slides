<!-- .slide: class="center" -->
# D
## Dependency Inversion Principle

*"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."*

--

### ❌ Violando DIP <!-- .element: class="bad" -->

```java
// Módulo de bajo nivel
public class MySQLDatabase {
    public void save(String data) {
        System.out.println("Guardando en MySQL: " + data);
    }
}

// Módulo de alto nivel - DEPENDE de implementación concreta
public class UserService {
    private MySQLDatabase database = new MySQLDatabase();

    public void createUser(String name) {
        database.save(name);
    }
}
```

¿Cambiar a PostgreSQL? Hay que **modificar** `UserService`.

--

### ✅ Aplicando DIP <!-- .element: class="good" -->

```java
// Abstracción (interfaz)
public interface Database {
    void save(String data);
}

// Implementaciones de bajo nivel
public class MySQLDatabase implements Database {
    public void save(String data) {
        System.out.println("MySQL: " + data);
    }
}

public class PostgreSQLDatabase implements Database {
    public void save(String data) {
        System.out.println("PostgreSQL: " + data);
    }
}

public class MongoDatabase implements Database {
    public void save(String data) {
        System.out.println("MongoDB: " + data);
    }
}
```

--

### Alto nivel depende de abstracción

```java
public class UserService {
    private final Database database;

    // Inyección de dependencia
    public UserService(Database database) {
        this.database = database;
    }

    public void createUser(String name) {
        database.save(name);
    }
}

// Uso - fácil cambiar implementación
UserService service1 = new UserService(new MySQLDatabase());
UserService service2 = new UserService(new PostgreSQLDatabase());
UserService service3 = new UserService(new MongoDatabase());
```

--

### DIP con Spring Framework

```java
@Service
public class UserService {
    private final Database database;

    @Autowired
    public UserService(Database database) {
        this.database = database;
    }

    public void createUser(String name) {
        database.save(name);
    }
}

@Repository
public class MySQLDatabase implements Database {
    // Spring inyecta automáticamente
}
```

--

### Beneficios de DIP

- ✅ Desacoplamiento total entre módulos
- ✅ Fácil cambiar implementaciones
- ✅ Testing con mocks/stubs trivial
- ✅ Base para Inyección de Dependencias
- ✅ Arquitectura flexible y extensible
