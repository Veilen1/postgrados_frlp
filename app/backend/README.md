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
python -m pytest --cov=src.auth --cov=src.legajos --cov=src.shared.auth --cov=src.shared.api --cov-report=term-missing
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
| `POST` | `/api/v1/legajos` | Crea el borrador de preinscripción del aspirante en una cohorte abierta |
| `GET` | `/api/v1/legajos/mi-legajo` | Consulta el legajo propio de un aspirante o alumno |
| `GET` | `/api/v1/legajos/{legajo_id}` | Consulta el legajo propio o, para administración, cualquier legajo |
| `GET` | `/api/v1/legajos` | Lista legajos paginados y filtrables; requiere rol administrativo |
| `PUT` | `/api/v1/legajos/{legajo_id}` | Edita datos del titular en estado `BORRADOR` u `OBSERVADO` |
| `POST` | `/api/v1/legajos/{legajo_id}/enviar` | Envía una preinscripción con documentos `DNI` y `TITULO_GRADO` cargados |
| `PATCH` | `/api/v1/legajos/{legajo_id}/estado` | Revisa, observa o rechaza; requiere rol administrativo |
| `GET` | `/api/v1/health` | Healthcheck de la API y PostgreSQL |
| `GET` | `/api/v1/health/ready` | Readiness de la API y PostgreSQL |
| `GET` | `/api/v1/health/live` | Liveness de la API |

### Contratos de legajos y preinscripción

Todos estos endpoints requieren un access token, salvo que se indique el rol administrativo.
El aspirante crea un borrador indicando una cohorte abierta y su DNI:

```json
{
  "cohorte_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "dni": "30123456",
  "solicita_beca": false,
  "tipo_beca": null
}
```

El backend toma `usuario_id`, nombre, apellido y email del perfil autenticado; no acepta
que el cliente suplante esos datos de identidad. Cada usuario puede crear un solo legajo.
`PUT /api/v1/legajos/{legajo_id}` recibe uno o más campos editables del legajo y solo
funciona para su titular mientras está en estado `BORRADOR` u `OBSERVADO`.

La consulta administrativa admite `page` (1 en adelante), `page_size` (máximo 100),
`cohorte_id` y `estado`. Para revisar un legajo, administración puede transicionar
`ENVIADO` a `EN_REVISION`, y luego a `OBSERVADO` o `RECHAZADO` (estos últimos requieren
`motivo_observacion`). `APROBADO` todavía no está habilitado porque falta acordar la regla
de generación de `numero_legajo`.

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

Cada aspirante puede tener un solo legajo. La creación copia nombre, apellido y email del
perfil autenticado; el cliente solo indica cohorte, DNI y datos de beca, y no puede asignar
el `usuario_id`. La lista administrativa acepta `page` (1 en adelante), `page_size` (1-100),
`cohorte_id` y `estado`. Los estados se registran en `auditoria_legajos`.

El envío valida la presencia de los documentos `DNI` y `TITULO_GRADO` en la tabla existente.
La carga/descarga de documentos aún no está implementada, por lo que un legajo sin ambos
archivos no se puede enviar desde la API. La aprobación también queda pendiente hasta definir
la generación del número de legajo `YY-NNN-CCC`; el endpoint devuelve un error explícito
mientras no exista esa regla. Los campos del formulario visual que no existen en el esquema
actual quedan fuera de esta API. Los contratos RBAC completos están en
[`docs/ARQUITECTURA_RBAC.md`](../../docs/ARQUITECTURA_RBAC.md).
