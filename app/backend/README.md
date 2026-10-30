# Backend Core

El backend canónico usa Python 3.12, FastAPI y PostgreSQL. La estructura sigue Screaming
Architecture: las funcionalidades del dominio se incorporarán como módulos dentro de `src/`;
`src/shared/` contiene configuración e infraestructura transversal.

## Ejecutar localmente (PowerShell)

Desde la raíz del repositorio, primero levantá PostgreSQL:

```powershell
docker compose up -d db
Set-Location app/backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m alembic upgrade head
python -m uvicorn src.main:app --reload
```

La API queda disponible en `http://127.0.0.1:8000` y Swagger en
`http://127.0.0.1:8000/api/docs`.

Para ejecutar todo el entorno integrado en Docker, desde la raíz del repositorio:

```powershell
docker compose up -d --build
```

El servicio backend ejecuta `alembic upgrade head` antes de iniciar FastAPI. Esto aplica
las migraciones pendientes también sobre volúmenes PostgreSQL existentes. En ejecución
local fuera de Docker, aplicalas manualmente antes de iniciar Uvicorn:

```powershell
python -m alembic upgrade head
```

`docker/database/init.sql` sigue creando el esquema base al crear un volumen nuevo;
Alembic administra los cambios incrementales posteriores. No borres el volumen para
aplicar una migración.

El endpoint `/api/v1/health` comprueba la conexión a PostgreSQL y
`/api/v1/health/live` verifica que el proceso de API esté activo.

## Ejecutar pruebas

Desde `app/backend`:

```powershell
python -m pytest
```

## Endpoints implementados en esta base

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/v1/health` | Healthcheck de la API y PostgreSQL |
| `GET` | `/api/v1/health/ready` | Readiness de la API y PostgreSQL |
| `GET` | `/api/v1/health/live` | Liveness de la API |

Los endpoints de autenticación, cohortes, legajos y documentos se implementarán como casos
de uso del Core siguiendo la matriz y las reglas de autorización de
[`docs/ARQUITECTURA_RBAC.md`](../../docs/ARQUITECTURA_RBAC.md).
