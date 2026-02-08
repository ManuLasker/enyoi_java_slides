---
sidebar_position: 8
---

# Limpieza

Cuando termines el lab, ejecuta estos comandos para limpiar los recursos:

## Eliminar stacks de CloudFormation

```bash
awslocal cloudformation delete-stack --stack-name arka-infrastructure
```

## Detener Docker Compose

```bash
docker compose down -v
```

## Eliminar archivos locales (opcional)

```bash
rm -rf localstack-data
rm -rf lambda/*.zip
rm output.json
```

---

## Resumen del Lab

¡Felicitaciones! Has completado el lab. Aquí está lo que aprendiste:

| Servicio | Lo que hiciste |
|----------|----------------|
| **Docker Compose** | Configurar LocalStack y PostgreSQL |
| **S3** | Crear buckets con versionado y CORS |
| **SQS** | Configurar colas con dead letter queue |
| **Secrets Manager** | Almacenar credenciales de forma segura |
| **Lambda** | Crear y probar funciones Python |
| **API Gateway** | Exponer Lambda como REST API |
| **Cognito** | Configurar User Pool y autenticación |
| **CloudFormation** | Infrastructure as Code |

## Próximos Pasos

- Integrar estos servicios con tu aplicación Spring Boot
- Explorar más servicios de LocalStack
- Migrar a AWS real cuando estés listo

---

**¡Gracias por completar el lab!**
