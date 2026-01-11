# Ejercicio 3: ReportGenerator
<!-- .element: class="r-fit-text" -->

--

## El Problema

```java
public class ReportGenerator {
  public String generateReport(String format, String title, List<Map<String, Object>> data) {
    String content;
    
    switch (format.toUpperCase()) {
      case "HTML":
        content = generateHtmlReport(title, data);
        break;
      case "CSV":
        content = generateCsvReport(title, data);
        break;
      case "PDF":
        content = generatePdfReport(title, data);
        break;
      case "EXCEL":
        content = generateExcelReport(title, data);
        break;
      default:
        throw new IllegalArgumentException("Unsupported format: " + format);
    }
    
    return content;
  }
  
  /**
   * Genera y envía el reporte (mezcla generación con envío - viola SRP)
   */
  public void generateAndSendReport(String format, String title, 
                     List<Map<String, Object>> data, String email) {
    // lógica acá
  }
  
  /**
   * Genera y guarda el reporte (mezcla generación con I/O - viola SRP)
   */
  public void generateAndSaveReport(String format, String title,
                     List<Map<String, Object>> data, String filePath) {
    // Lógica acá
  }
  
  // ========== GENERADORES DE FORMATO (cada uno debería ser su propia clase) ==========
  
  private String generateHtmlReport(String title, List<Map<String, Object>> data) {
    // lógica acá
  }
  
  private String generateCsvReport(String title, List<Map<String, Object>> data) {
    // lógica acá
  }
  
  private String generatePdfReport(String title, List<Map<String, Object>> data) {
    // lógica acá
  }
  
  private String generateExcelReport(String title, List<Map<String, Object>> data) {
    // lógica acá
  }
  
  // ========== EXPORTADORES (deberían estar separados - viola SRP) ==========
  
  private void sendByEmail(String content, String email, String title) {
    // lógica acá
  }
  
  private void saveToFile(String content, String filePath) {
    // Lógica acá
  }
  
  // ========== MÉTODOS ADICIONALES QUE AGREGAN MÁS RESPONSABILIDADES ==========
  
  /**
   * Método para obtener formatos soportados.
   * Hardcodeado aquí (debería venir de la configuración o del factory).
   */
  public List<String> getSupportedFormats() {
    // lógica acá
  }
  
  /**
   * Método para validar datos.
   * También debería estar separado.
   */
  public boolean validateReportData(List<Map<String, Object>> data) {
    // lógica acá
  }
}
```
<!-- .element: style="font-size: 0.42em;" -->

--

## Violaciones Detectadas

**SRP**: Esta clase hace TODO lo relacionado con reportes:
<!-- .element: style="text-align: left;" -->

- Genera PDF
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Genera Excel
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Genera HTML
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Genera CSV
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Envía por email
<!-- .element: style="text-align: left; margin-left: 2em;" -->
- Guarda en disco
<!-- .element: style="text-align: left; margin-left: 2em;" -->

--

## Más Violaciones

| Principio | Problema |
|:---------:|:---------|
| **ISP** | Una interfaz gigante obligaría a implementar TODOS los métodos aunque solo necesites uno |
| **OCP** | Para agregar nuevo formato (JSON, XML) hay que modificar la clase |
| **DIP** | Dependencias concretas de I/O y formatos |
<!-- .element: style="font-size: 0.85em;" -->

Un generador de PDF no necesita saber de Excel
<!-- .element: style="text-align: center; font-style: italic; margin-top: 1em;" -->

--

## Patrones de Diseño Sugeridos

| Patrón | Propósito |
|:------:|:----------|
| **Adapter** | Adaptar diferentes formatos de salida |
| **Factory** | Crear los adaptadores de formato |
| **Strategy** | Diferentes estrategias de exportación |
<!-- .element: style="font-size: 0.9em;" -->

--

## Estructura Refactorizada

```
exercise3_reports/refactored/
    ├── model/
    │   ├── ReportData.java
    │   └── ReportConfig.java
    ├── formatter/
    │   ├── ReportFormatter.java        (Interface segregada)
    │   ├── HtmlReportFormatter.java
    │   ├── CsvReportFormatter.java
    │   ├── PdfReportFormatter.java
    │   └── ExcelReportFormatter.java
    ├── exporter/
    │   ├── ReportExporter.java         (Interface segregada)
    │   ├── FileReportExporter.java
    │   └── EmailReportExporter.java
    ├── factory/
    │   └── ReportFormatterFactory.java
    └── ReportService.java              (Orquestador limpio)
```
<!-- .element: style="font-size: 0.5em;" -->

--

## Nota sobre ISP

En lugar de una interfaz gigante `IReportGenerator` con todos los métodos, separa en interfaces pequeñas y cohesivas:
<!-- .element: style="text-align: left;" -->

| Interface | Responsabilidad |
|:---------:|:----------------|
| `ReportFormatter` | Solo formateo - `toFormat()` |
| `ReportExporter` | Solo exportación - `export()` |
<!-- .element: style="font-size: 0.9em;" -->

**Resultado**: Interfaces cohesivas y específicas
<!-- .element: style="text-align: center; margin-top: 1em;" -->