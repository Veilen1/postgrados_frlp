# ADR 0001: Migraciones incrementales con Alembic

- Estado: Aceptado
- Fecha: 2026-10-30

## Contexto

El esquema base de PostgreSQL se crea con `docker/database/init.sql`, que Docker ejecuta
únicamente al inicializar un volumen vacío. Editar ese archivo no actualiza las bases
existentes, por lo que no alcanza para evolucionar el esquema durante el desarrollo ni
para desplegar cambios de forma repetible.

Autenticación requiere persistir sesiones de refresh token para poder rotarlas y
revocarlas. La tabla nueva debe crearse tanto en una base existente como en una instalación
limpia, sin borrar datos ni recrear `usuarios`.

## Decisión

Adoptar Alembic para cambios incrementales y versionados. `init.sql` se conserva como
bootstrap del esquema base en bases nuevas; las migraciones describen los cambios
posteriores. La primera revisión agrega `refresh_sessions` y referencia la tabla `usuarios`
ya creada por el bootstrap.

El contenedor de desarrollo ejecuta `alembic upgrade head` antes de iniciar FastAPI. Para
ejecución local fuera de Docker, el mismo comando se ejecuta manualmente desde
`app/backend`. Así, las bases existentes reciben la migración sin eliminar su volumen.

## Consecuencias

- Los cambios de esquema posteriores se agregan como revisiones Alembic; no se editan
  scripts de inicialización para modificar una base existente.
- La comparación de Alembic solo incluye tablas representadas en el metadata de SQLAlchemy;
  las tablas del bootstrap todavía no mapeadas se conservan y no se proponen para borrado.
- Una base vacía requiere primero el bootstrap `init.sql`; luego Alembic aplica las
  migraciones incrementales.
- El historial de revisiones queda versionado junto al código y permite revisar y revertir
  cambios explícitamente.
- El despliegue productivo debe ejecutar `alembic upgrade head` como paso de release antes
  de arrancar la nueva versión de la API.
