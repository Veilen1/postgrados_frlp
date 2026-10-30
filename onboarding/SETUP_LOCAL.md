# Setup del Entorno Local — Guía Paso a Paso

Esta guía te lleva desde cero hasta tener el sistema corriendo localmente. **Seguí cada paso en orden.** Si algo falla, hay una sección de Troubleshooting al final.

> **Antes de empezar:** Esta guía asume el **stack principal (FastAPI + Python)**. Si tu equipo eligió el stack alternativo (NestJS + TypeScript), los pasos del sistema son iguales pero los comandos de backend difieren — están indicados en cada sección con el bloque `── Si elegiste NestJS ──`.

---

## Requisitos Previos

Antes de empezar, verificá que tenés instalado:

```bash
git --version          # Necesitás 2.x o superior
docker --version       # Docker 24.x o superior
docker compose version # Compose 2.x (incluido en Docker Desktop)
```

Eso es todo. **Python y Node.js corren dentro de Docker**, no necesitás instalarlos en tu máquina para el flujo principal. Los únicos casos en que los necesitás localmente son:

- Si querés correr los tests fuera de Docker (más rápido para TDD)
- Si querés usar el linter integrado en el editor

**Instaladores:**
- Git: https://git-scm.com
- Docker Desktop: https://www.docker.com/products/docker-desktop

> En Windows: usá **PowerShell** o **Git Bash** para los comandos. El `cmd` clásico no interpreta correctamente algunos paths y variables de entorno.

---
## Paso 0: Fork del repositorio
El encargado del equipo hacer un fork del repositorio de la catedra.
Cada miembro se suma al repositorio como colaborador.

## Paso 1: Clonar el Repositorio

```bash
# Reemplazá [NOMBRE-EQUIPO] con el nombre de tu equipo (lo da el docente via GitHub Classroom)
git clone https://github.com/utn-frlp-dev2026/postgrado-[NOMBRE-EQUIPO].git

cd postgrado-[NOMBRE-EQUIPO]

# Verificar que estás en la rama principal
git branch
# Deberías ver: * main
```

---

## Paso 2: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo (nunca editarlo directamente)
cp .env.example .env
```

**Para desarrollo local el `.env.example` ya tiene valores funcionales.** No necesitás cambiar nada para empezar. Solo en producción deberás reemplazar contraseñas y secretos.

```bash
# Verificar que el archivo fue creado
ls -la .env      # Linux / Mac
dir .env         # Windows PowerShell
```

El `.env` nunca se commitea a Git (está en `.gitignore`). Si alguien del equipo agrega una variable nueva, debe actualizarla en `.env.example` con un valor de ejemplo.

---

## Paso 3: Levantar los Servicios con Docker

```bash
docker compose up -d
```

Este comando descarga las imágenes y levanta tres servicios:

```
postgrado-db        → PostgreSQL 16 (base de datos)
postgrado-backend   → FastAPI en Python
postgrado-frontend  → React 19 + Vite
```

La primera vez puede tardar 3–5 minutos según tu conexión. Las siguientes veces son casi instantáneas porque las imágenes quedan en caché.

**Verificar que todo levantó correctamente:**

```bash
docker compose ps
```

Deberías ver:

```
NAME              STATUS          PORTS
postgrado-db       Up (healthy)    127.0.0.1:5432->5432/tcp
postgrado-backend  Up (healthy)    0.0.0.0:8000->8000/tcp
postgrado-frontend Up              0.0.0.0:3000->3000/tcp
```

> El campo **STATUS** debe decir **Up**. Si dice **Restarting** o **Exit**, algo salió mal → ir a Troubleshooting.

---

## Paso 4: Inicialización de la Base de Datos

En este entorno, PostgreSQL ejecuta `docker/database/init.sql` automáticamente cuando
se crea el volumen por primera vez. El script crea el esquema Core y datos iniciales.
Si el volumen ya existía antes de agregar o modificar el script, Docker no lo vuelve a
ejecutar automáticamente. Al iniciar, el backend ejecuta `alembic upgrade head` y aplica
las migraciones versionadas pendientes sobre la base existente.

```bash
docker compose exec db psql -U postgrado_user -d postgrado_dev
```

---

## Paso 5: Verificar que Todo Funciona

Abrí estos URLs en tu navegador:

| URL | Qué deberías ver |
|-----|-----------------|
| `http://localhost:3000` | Pantalla de login del sistema Fenix |
| `http://localhost:3000/inscripcion` | Formulario público (sin login requerido) |
| `http://localhost:8000/api/docs` | Swagger UI — **stack FastAPI** (generado automáticamente) |
| `http://localhost:8000/api/v1/health` | Confirma disponibilidad de la API y conexión a PostgreSQL |

> **Tip:** Con FastAPI, el Swagger en `/api/docs` es la documentación viva de tu API. Podés probar los endpoints directamente desde ahí durante el desarrollo.

**Credenciales de prueba (cargadas por el seed):**

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador de Posgrado | `admin@posgrado.frlp.utn.edu.ar` | `Admin123!` |
| Aspirante | `aspirante.demo@posgrado.frlp.utn.edu.ar` | `Aspirante123!` |

---

## Paso 6: Configurar el Editor — VS Code

### Extensiones para el stack principal (FastAPI + Python)

```bash
code --install-extension ms-python.python           # Python oficial de Microsoft
code --install-extension ms-python.pylance           # IntelliSense y type checking
code --install-extension charliermarsh.ruff          # Linter + formatter (reemplaza flake8 + black)
code --install-extension ms-python.debugpy           # Debugger de Python
code --install-extension bradlc.vscode-tailwindcss   # Autocompletado de clases Tailwind
code --install-extension ms-azuretools.vscode-docker # Docker integrado
```

### Extensiones para el stack alternativo (NestJS + TypeScript)

```bash
code --install-extension dbaeumer.vscode-eslint      # ESLint
code --install-extension esbenp.prettier-vscode      # Prettier
code --install-extension prisma.prisma               # Syntax y format de schema.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-azuretools.vscode-docker
```

### Extensiones comunes a ambos stacks

```bash
code --install-extension eamodio.gitlens             # Historial de Git en el editor
code --install-extension streetsidesoftware.code-spell-checker  # Corrector ortográfico
code --install-extension humao.rest-client           # Probar APIs desde archivos .http
```

El proyecto incluye `.vscode/settings.json` con la configuración recomendada. El linter se aplica automáticamente al guardar.

---

## Comandos del Día a Día

### Gestión del ambiente Docker

```bash
# Levantar todo (hacé esto al empezar a trabajar)
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f backend      # Solo el backend
docker compose logs -f frontend     # Solo el frontend
docker compose logs -f              # Todos los servicios

# Reiniciar un servicio (útil después de cambiar variables de entorno)
docker compose restart backend

# Detener todo (al terminar de trabajar)
docker compose down
```

---

### Atajos de productividad con `make` (Opcional — Linux / Mac / WSL)

Para no tener que escribir comandos largos de Docker en cada iteración, el proyecto incluye un archivo `Makefile` en la raíz del repositorio. Funciona como una lista de atajos directos:

| Comando | Qué hace por detrás (Comando Docker nativo) | Para qué sirve |
|---|---|---|
| `make up` | `docker compose up -d` | Levanta todo el entorno en segundo plano. |
| `make down` | `docker compose down` | Apaga los contenedores liberando puertos y RAM. |
| `make status` | `docker compose ps` | Muestra qué servicios están corriendo y saludables (`healthy`). |
| `make test` | `docker compose exec backend pytest -v` | Corre la suite de tests automáticos en el backend. |
| `make logs` | `docker compose logs -f` | Monitorea los logs en tiempo real para ver errores o prints. |
| `make db-shell` | `docker compose exec db psql -U postgrado_user -d postgrado_dev` | Entra directo a la consola SQL de la base de datos. |
| `make clean` | `docker compose down -v` | Resetea la base de datos y volúmenes de cero si algo se rompe. |

> **Nota para Windows (PowerShell / CMD sin WSL):** La herramienta `make` es nativa de entornos Unix (Linux, Mac o WSL en Windows). Si usás la consola nativa de Windows y no tenés `make`, podés ejecutar directamente los comandos de `docker compose` de la segunda columna sin ningún problema.

---

### Tests y calidad de código — Stack FastAPI (principal)

```bash
# Correr todos los tests
docker compose exec backend pytest

# Con reporte de cobertura detallado
docker compose exec backend pytest --cov=src.auth --cov=src.shared.auth --cov=src.shared.api --cov-report=term-missing

# Solo tests de un módulo (más rápido durante desarrollo)
docker compose exec backend pytest tests/inscripcion/

# Solo tests de dominio (los más rápidos, sin BD)
docker compose exec backend pytest tests/inscripcion/test_domain.py

# Linter (Ruff — chequea estilo y errores comunes)
docker compose exec backend ruff check src/

# Formatter (Ruff — aplica formato automáticamente)
docker compose exec backend ruff format src/

# Type checking (opcional pero recomendado)
docker compose exec backend mypy src/
```

---

### Tests y calidad de código — Stack NestJS (alternativo)

```bash
# Correr todos los tests
docker exec postgrado-backend npm test

# Con cobertura
docker exec postgrado-backend npm run test:cov

# Solo tests de un módulo
docker exec postgrado-backend npm test -- --testPathPattern=inscripcion

# Linter
docker exec postgrado-backend npm run lint

# Formatter
docker exec postgrado-backend npm run format

# Verificar tipos TypeScript sin compilar
docker exec postgrado-backend npm run typecheck
```

---

### Esquema de base de datos

El esquema inicial se crea desde `docker/database/init.sql` cuando se inicializa el
volumen PostgreSQL. Los cambios incrementales se gestionan con migraciones versionadas de
Alembic, que el backend aplica automáticamente al iniciar en Docker. En ejecución local
fuera de Docker, aplicalas desde `app/backend` antes de arrancar la API:

```powershell
python -m alembic upgrade head
```

No es necesario borrar el volumen para aplicar una migración. El SQL inicial sigue siendo
el bootstrap de una base nueva; no se usa para modificar volúmenes ya inicializados.

---

### Acceso directo a la base de datos

```bash
# Conectarse con psql
docker exec -it postgrado-db psql -U postgrado_user -d postgrado_dev

# Comandos útiles dentro de psql:
#   \dt             → listar tablas
#   \d legajos      → describir la tabla legajos (columnas, tipos, constraints)
#   \x              → activar modo vertical (más legible para filas con muchas columnas)
#   \q              → salir

# Consulta rápida sin entrar al prompt interactivo:
docker exec postgrado-db psql -U postgrado_user -d postgrado_dev -c "SELECT id, dni, estado FROM legajos LIMIT 5;"
```

---

## Troubleshooting

### ❌ `docker compose up` falla con "port is already in use"

**Error:** `bind: address already in use` — algún puerto (5432, 3000, 8000) está ocupado.

```bash
# Ver qué proceso ocupa el puerto (Mac / Linux)
lsof -i :5432
lsof -i :8000

# En Windows PowerShell
netstat -ano | findstr :5432

# Solución A: detener el proceso que ocupa el puerto
# Solución B: cambiar el puerto en docker-compose.yml
# Ejemplo: "5433:5432" expone el 5432 interno en el 5433 del host
```

---

### ❌ `postgrado-backend` en estado "Restarting"

```bash
# Ver el error exacto
docker compose logs backend --tail=50

# Causas frecuentes:
# 1. La DB no terminó de iniciar → esperar 30 seg y correr: docker compose restart backend
# 2. Error de sintaxis en el código → el log muestra el traceback completo
# 3. Variable de entorno faltante → revisar que .env existe y tiene DATABASE_URL
# 4. Puerto 8000 ocupado por otra app → ver troubleshooting anterior
```

---

### ❌ El backend no puede conectarse a PostgreSQL

**Causa:** PostgreSQL todavía no está saludable, o la URL de conexión no coincide con
el entorno donde corre el backend.

```bash
# Verificar que postgrado-db está "healthy" (no solo "Up")
docker compose ps
# Si dice "starting" esperar 30 segundos

# Consultar los logs de ambos servicios
docker compose logs db --tail=50
docker compose logs backend --tail=50

# Si sigue fallando, verificar DATABASE_URL en .env:
# Debe ser: postgresql+asyncpg://postgrado_user:postgrado_dev_password@db:5432/postgrado_dev
# IMPORTANTE: el host es "db" (nombre del servicio en docker-compose), no "localhost"
```

---

### ❌ `npx prisma migrate dev` falla con "P1001: Can't reach database"

Misma causa que el punto anterior. El host en `DATABASE_URL` debe ser `db`, no `localhost`.

```bash
# Verificar en .env:
# DATABASE_URL="postgresql://postgrado_user:postgrado_dev_password@db:5432/postgrado_dev"
#                                                           ^^
#                                               Nombre del servicio Docker, no localhost
```

---

### ❌ La app levanta pero el frontend no puede conectar al backend (CORS / 404)

```bash
# Verificar que VITE_API_URL apunta al backend correcto
grep VITE_API_URL .env
# Debe decir: VITE_API_URL=http://localhost:8000/api/v1

# Verificar que el backend responde
curl http://localhost:8000/api/v1/health
# Debe indicar status "healthy" y database "connected"

# Si cambiaste VITE_API_URL, reiniciar el frontend para que tome el nuevo valor
docker compose restart frontend
```

---

### ❌ `pytest` falla con "ModuleNotFoundError"

**Causa:** El módulo no está instalado en el contenedor, o hay un problema con el `PYTHONPATH`.

```bash
# Reinstalar dependencias dentro del contenedor
docker compose build backend --no-cache
docker compose up -d backend

# Verificar que el módulo existe
docker exec postgrado-backend pip list | grep fastapi

# Si agregaste una dependencia nueva a requirements.txt:
# El contenedor debe reconstruirse para incluirla
docker compose build backend
docker compose up -d
```

---

### ❌ En Windows: "exec format error" o scripts que no se ejecutan

**Causa:** Saltos de línea CRLF (Windows) en scripts que esperan LF (Unix).

```bash
# Configurar Git para no convertir saltos de línea al clonar
git config core.autocrlf false

# Si ya clonaste con CRLF, corregirlo:
git rm --cached -r .
git reset --hard
```

---

### ❌ Todo está roto. Quiero empezar desde cero.

```bash
# ⚠️ Esto borra la base de datos y todos los datos locales
docker compose down -v      # -v elimina los volúmenes (base de datos incluida)
docker compose up -d

# El esquema inicial y los usuarios de prueba se crean al inicializar el volumen.
# Si el volumen ya existía, el script no se vuelve a ejecutar automáticamente.
```

---

### ❌ El Swagger de FastAPI (`/api/docs`) no muestra mis endpoints nuevos

**Causa:** FastAPI genera el Swagger en tiempo de ejecución, pero si el servidor tiene un error de importación, algunos routers no se cargan.

```bash
# Ver el error de carga
docker compose logs backend --tail=30

# El error más común: un import circular o un schema de Pydantic mal definido
# Buscar en el log: "ImportError" o "ValidationError"
```

---

## Checklist de Salida — Kickoff Semana 3

Antes de dar por terminado el kickoff, **todos los integrantes** del equipo deben poder completar esta lista de forma independiente:

```
AMBIENTE
[ ] git clone del repositorio del equipo funciona
[ ] docker compose up -d levanta los 3 servicios sin errores
[ ] docker compose ps muestra todos los servicios en estado "Up"

APLICACIÓN
[ ] http://localhost:3000 muestra la pantalla de login
[ ] http://localhost:3000/inscripcion muestra el formulario público
[ ] http://localhost:8000/api/docs muestra el Swagger de FastAPI
[ ] http://localhost:8000/api/v1/health confirma conexión a PostgreSQL

BASE DE DATOS
[ ] docker/database/init.sql creó el esquema en la primera inicialización del volumen
[ ] psql \dt muestra las tablas del sistema
[ ] Los datos del seed están cargados (hay legajos en la pantalla del coordinador)

TESTS
[ ] Stack FastAPI: docker compose exec backend pytest → todos pasan
[ ] El pipeline de CI está en verde en GitHub

GIT
[ ] Podés crear una rama, hacer un commit y abrir un Pull Request en GitHub
[ ] El PR dispara el pipeline de CI automáticamente
```

> Si algún integrante no puede completar este checklist, **el equipo resuelve el bloqueo antes de avanzar al Sprint 1.** Un ambiente roto en una sola máquina es un riesgo real para la integración continua.
