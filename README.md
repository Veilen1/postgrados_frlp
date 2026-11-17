# 🎓 Sistema de Gestión Académica de Posgrado (SGAP)

### Cátedra Desarrollo de Software · UTN FRLP · 2026

[![Estado](https://img.shields.io/badge/estado-Core%20Funcional-brightgreen)](#estado-de-m%C3%B3dulos)
[![Cobertura objetivo](https://img.shields.io/badge/cobertura%20backend-%E2%89%A570%25-green)](#pruebas-y-calidad)
[![CI](https://img.shields.io/badge/CI-Pytest%20%7C%20Ruff%20%7C%20Vitest%20%7C%20Vite-blue)](#pruebas-y-calidad)

> **Proyecto integrador** de la cátedra **Desarrollo de Software** — 3° año · Turno Noche · Ingeniería en Sistemas de Información · UTN FRLP · 2026.

---

## ¿Qué es este proyecto?

**Sistema de Posgrado (SGAP)** reemplaza la gestión manual de posgrados de la UTN FRLP —originalmente basada en planillas Excel, carpetas físicas y correos— por una plataforma web centralizada con trazabilidad completa del legajo académico: desde el registro y preinscripción digital del aspirante con documentación en PDF hasta la auditoría, emisión de número de legajo oficial y seguimiento por parte del equipo de conducción.

---

## 👥 Equipo

### Integrantes activos

| Nombre | Rol | GitHub | Email |
| :--- | :--- | :--- | :--- |
| **Valentín García Devrient** | Líder / Desarrollador Full Stack | [@Veilen1](https://github.com/Veilen1) | devrientv@gmail.com |
| **Lucio Angel** | Desarrollador Backend / Integración & Infra | [@locckusdem](https://github.com/locckusdem) | lucio.angel@alu.frlp.utn.edu.ar |
| **Emilio Rivero** | Desarrollador Frontend / Integración API | [@EmiRM73](https://github.com/EmiRM73) | emiliorivero161@gmail.com |
| **Lautaro Redruello** | Desarrollador Frontend / Auth & RBAC | [@lauty04ARG](https://github.com/lauty04ARG) | lautaredruello@gmail.com |

### Colaboradores iniciales
Agradecemos también la participación inicial en el maquetado del prototipo frontend de **Araceli Melina Dávila** ([@davilaaraceli18](https://github.com/davilaaraceli18)) y **Luciano Privitera** ([@lucianoprivitera](https://github.com/lucianoprivitera)).

---

## 📊 Estado de Módulos

| Módulo | Alcance implementado | Estado |
| :--- | :--- | :--- |
| **CORE** *(Preinscripción, Legajos y Conducción)* | Auth JWT + RBAC por roles, registro/preinscripción pública y autenticada, vista `MiLegajo`, carga/validación de PDFs (`%PDF`, ≤ 5 MB), auditoría documental, máquina de estados (`BORRADOR → ENVIADO → EN_REVISION → APROBADO / OBSERVADO / RECHAZADO`), emisión transaccional de N° de legajo (`AA-COD-CC-NNN`), expediente de estudiante y gestión de cohortes. | 🟢 **Implementado (E2E con PostgreSQL)** |
| **Estadísticas Core** | KPIs en tiempo real, tasa de aprobación, solicitudes de beca, distribución por estado y gráfico de demanda por carrera sobre datos reales de la API. | 🟢 **Implementado** |
| **MOD-B** *(Gestión Docente)* | Interfaz de planilla de asistencia y calificaciones restringida al rol `DOCENTE` (maqueta UI; sin tablas/endpoints académicos en backend). | 🟡 **Maqueta UI (RBAC activo)** |
| **MOD-C** *(Seguimiento de Graduación)* | Reglas de semáforo de riesgo y seguimiento de TFI/Tesis. | 🔴 **Pendiente (fuera de alcance actual)** |

---

## 🚀 Quickstart — Levantá el entorno

> **Requisitos previos:** Git · Docker Engine / Docker Desktop (Compose v2) o Podman con `docker-compose`.

### 1. Levantar servicios con Docker Compose

```bash
# 1. Crear variables de entorno locales (solo la primera vez)
cp .env.example .env

# 2. Construir imágenes y levantar PostgreSQL 16 + FastAPI + React/Vite
docker compose up -d --build

# 3. Verificar estado y healthchecks
docker compose ps
```

Al iniciar:
* **PostgreSQL** ejecuta [`docker/database/init.sql`](docker/database/init.sql) cuando se crea el volumen inicial.
* **Backend** aplica automáticamente las migraciones pendientes con `alembic upgrade head` (`0001` a `0005`).

**URLs locales:**
* **Frontend UI:** `http://localhost:3000`
* **Backend Swagger / OpenAPI:** `http://localhost:8000/api/docs`
* **Healthcheck:** `http://localhost:8000/api/v1/health`

*(Para ejecutar el backend fuera de Docker, seguí [`app/backend/README.md`](app/backend/README.md)).*

### 2. Cuentas de prueba (Seed inicial)

El archivo [`docker/database/init.sql`](docker/database/init.sql) carga automáticamente estas cuentas para probar todos los roles del sistema:

| Rol | Email | Contraseña | Acceso principal |
| :--- | :--- | :--- | :--- |
| **ADMIN_POSGRADO** | `admin@posgrado.frlp.utn.edu.ar` | `Admin123!` | Panel de Conducción (Inscripciones, Estudiantes, Posgrados, Estadísticas) |
| **ASPIRANTE** | `aspirante.demo@posgrado.frlp.utn.edu.ar` | `Aspirante123!` | Preinscripción y vista `Mi Legajo` |
| **DOCENTE** | `docente.demo@posgrado.frlp.utn.edu.ar` | `Docente123!` | Panel Docente |

*(También podés registrar aspirantes nuevos directamente desde el botón **"Preinscribite acá como aspirante"** en la pantalla de Login).*

### 3. Atajos con `Makefile`

| Comando `make` | Equivalente Docker Compose | Descripción |
| :--- | :--- | :--- |
| `make up` | `docker compose up -d` | Levanta el entorno en segundo plano |
| `make status` | `docker compose ps` | Verifica estado y healthchecks |
| `make logs` | `docker compose logs -f` | Sigue logs en tiempo real |
| `make test` | `docker compose exec backend pytest -v` | Corre la suite Pytest del backend |
| `make test-cov` | `docker compose exec backend pytest --cov=src ...` | Corre Pytest con cobertura |
| `make db-shell` | `docker compose exec db psql ...` | Abre consola interactiva PostgreSQL |
| `make down` | `docker compose down` | Detiene contenedores |
| `make clean` | `docker compose down -v` | Resetea contenedores y volúmenes (DB + PDFs) |

> **Nota para Linux con Podman / SELinux (ej. Fedora):** habilitá el socket de usuario (`systemctl --user enable --now podman.socket`) y, si ves errores de permisos al montar archivos locales, aplicá contexto SELinux con `chcon -Rt svirt_sandbox_file_t ./docker ./app/backend/src ./app/backend/tests ./app/backend/pytest.ini ./app/frontend/src ./app/frontend/index.html`.

---

## 🧪 Pruebas y Calidad

Los workflows de CI en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) validan automáticamente cada PR con:

```bash
# Backend: tests unitarios/integración + cobertura >= 70% y linter Ruff
docker compose exec backend pytest --cov=src.auth --cov=src.legajos --cov=src.shared.auth --cov=src.shared.api --cov-report=term-missing --cov-fail-under=70
docker compose exec backend ruff check .

# Frontend: tests unitarios/E2E (Vitest + Testing Library) y build de producción
docker compose exec frontend npm test
docker compose exec frontend npm run build
```

---

## 🛠️ Stack Tecnológico Real

| Capa | Tecnología utilizada | Propósito |
| :--- | :--- | :--- |
| **Frontend** | **React 19 + Vite 8 + CSS** | SPA multi-rol (Login, Preinscripción, Mi Legajo, Panel Conducción, Panel Docente) |
| **Testing Frontend** | **Vitest 5 + Testing Library + jsdom** | Tests unitarios de servicios/componentes y flujo E2E de navegación RBAC |
| **Backend** | **FastAPI + Python 3.12 + Pydantic v2** | API REST (`/api/v1`) con validación estricta, JWT HS256 y Swagger automático |
| **Persistencia / ORM** | **SQLAlchemy 2.0 (async) + Alembic + PostgreSQL 16** | Modelos async, migraciones versionadas (`0001`–`0005`) y constraints transaccionales |
| **Testing & Lint Backend** | **Pytest + pytest-asyncio + HTTPX + Ruff** | Pruebas de auth, cohortes, legajos, documentos y chequeo estático de código |
| **Infraestructura** | **Docker Compose + GitHub Actions** | Entorno reproducible multi-contenedor y CI automático en `dev` / `main` |

---

## 📁 Estructura del Repositorio

```text
postgrados_frlp/
├── README.md                     ← Documentación principal
├── CHANGELOG.md                  ← Historial de cambios relevantes
├── CONTRIBUTING.md               ← Convenciones de ramas, commits y PRs
├── Makefile                      ← Atajos de desarrollo y testing
├── docker-compose.yml            ← Orquestación DB + Backend + Frontend
├── .env.example                  ← Variables de entorno de referencia
│
├── app/
│   ├── backend/                  ← API FastAPI (auth, cohortes, legajos, documentos, alembic, tests)
│   └── frontend/                 ← SPA React + Vite (componentes, servicios, tests Vitest)
│
├── docker/
│   └── database/init.sql         ← Esquema base y usuarios/cohorte seed
│
├── docs/                         ← Especificación y arquitectura (SRS, PRD, BFD, RBAC, ADRs)
├── onboarding/                   ← Guías de kickoff, setup local y team charter
├── adr/                          ← Registro inicial de decisiones de arquitectura
└── .github/workflows/ci.yml      ← Pipeline CI (Ruff, Pytest, Vitest, Vite build)
```

---

## 📚 Documentación de Referencia

* 📋 [`docs/SRS.md`](docs/SRS.md) — Especificación de Requisitos
* 📦 [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
* 🏗️ [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — Arquitectura del sistema
* 🔐 [`docs/ARQUITECTURA_RBAC.md`](docs/ARQUITECTURA_RBAC.md) — Especificación formal de roles, permisos y errores
* 🔢 [`docs/DECISION_FORMATO_NUMERO_LEGAJO.md`](docs/DECISION_FORMATO_NUMERO_LEGAJO.md) — Formato oficial `AA-COD-CC-NNN`
* 🤝 [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`onboarding/SETUP_LOCAL.md`](onboarding/SETUP_LOCAL.md) · [`onboarding/TEAM_CHARTER.md`](onboarding/TEAM_CHARTER.md)

---

## 🔀 Flujo de Trabajo del Equipo

1. **Nunca pushear directo a `main`**: todo cambio pasa por PR desde rama de trabajo hacia `dev`, y luego de `dev` hacia `main`.
2. **Conventional Commits**: `feat(...)`, `fix(...)`, `test(...)`, `docs(...)`, `chore(...)`.
3. **CI obligatorio**: no se mergea si fallan Ruff, Pytest, Vitest o el build de producción.
4. **Secretos fuera de Git**: nunca commitear `.env` ni claves reales.

---

*Proyecto académico · Cátedra Desarrollo de Software · UTN FRLP · 2026*
