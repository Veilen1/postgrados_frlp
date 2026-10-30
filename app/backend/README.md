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
python -m pytest --cov=src.auth --cov=src.shared.auth --cov=src.shared.api --cov-report=term-missing
```

## Endpoints implementados

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/v1/auth/registro-aspirante` | Crea una cuenta activa con rol `ASPIRANTE`; no crea un legajo ni inicia sesión |
| `POST` | `/api/v1/auth/login` | Valida email/contraseña y entrega access token y refresh token |
| `POST` | `/api/v1/auth/refresh` | Rota el refresh token de un solo uso y emite una nueva pareja de tokens |
| `GET` | `/api/v1/auth/me` | Devuelve el perfil activo asociado al access token Bearer |
| `GET` | `/api/v1/cohortes` | Lista cohortes abiertas públicamente y todas las cohortes para usuarios autenticados |
| `POST` | `/api/v1/cohortes` | Crea una cohorte; requiere rol `ADMIN_POSGRADO` o `SUPERADMIN` |
| `PATCH` | `/api/v1/cohortes/{cohort_id}/estado` | Abre/cierra inscripciones; requiere rol `ADMIN_POSGRADO` o `SUPERADMIN` |
| `GET` | `/api/v1/health` | Healthcheck de la API y PostgreSQL |
| `GET` | `/api/v1/health/ready` | Readiness de la API y PostgreSQL |
| `GET` | `/api/v1/health/live` | Liveness de la API |

### Contratos de cohortes

La creación recibe `anio`, `nombre`, `carrera`, `tipo_carrera` (`Especializacion`,
`Maestria` o `Doctorado`) y opcionalmente `abierta` (por defecto `false`) y `fecha_inicio`.
El nombre es único. El listado público solo expone cohortes con inscripción abierta;
cualquier usuario autenticado puede consultar también las cerradas. Un token Bearer
inválido se rechaza incluso en el listado público. La tabla `cohortes` ya forma parte del
bootstrap `init.sql`, por lo que este módulo no requiere una migración nueva.

### Contratos de autenticación

El registro recibe `email`, `password`, `nombre` y `apellido`. El email se normaliza a
minúsculas, y la contraseña debe tener entre 12 y 72 bytes UTF-8. El login recibe `email` y
`password`; el refresh recibe `refresh_token`. Las respuestas de login y refresh incluyen
`access_token`, `refresh_token`, `token_type`, `expires_in` y el perfil `user`.

Los access tokens usan HS256 y vencen en 8 horas por defecto. Los refresh tokens son
opacos, vencen en 7 días y se rotan al usarse; la base persiste únicamente su hash. La
cuenta se consulta al autenticar cada request, por lo que cuentas inactivas o eliminadas
no pueden seguir usando un access token vigente. Las respuestas de autenticación y
autorización siguen el formato de error de
[`docs/ARQUITECTURA_RBAC.md`](../../docs/ARQUITECTURA_RBAC.md).

La variable `JWT_SECRET` debe tener al menos 32 bytes. El secreto de desarrollo incluido
en Compose/`.env.example` no debe usarse fuera de desarrollo; en otros entornos la API
rechaza el valor de desarrollo por defecto.

Todavía no están implementados legajos ni documentos. Sus reglas y endpoints se encuentran
en [`docs/ARQUITECTURA_RBAC.md`](../../docs/ARQUITECTURA_RBAC.md).
