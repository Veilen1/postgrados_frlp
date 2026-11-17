# Changelog — Sistema de Posgrado (SGAP)

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [Unreleased]

### Added
- **Módulo Core end-to-end integrado con PostgreSQL y FastAPI:**
  - Registro y auto-login de aspirantes desde el acceso público, flujo de preinscripción conectado a cohortes abiertas dinámicas y envío formal de legajos (`POST /api/v1/legajos/{id}/enviar`).
  - Vista `MiLegajo.jsx` para aspirantes y alumnos, con visualización de estado, observaciones y edición/reenvío de legajos en `BORRADOR` u `OBSERVADO` (`PUT /api/v1/legajos/{id}`).
  - Migraciones Alembic `0004_legajo_applicant_profile` (perfil personal/académico en legajo) y `0005_analitico_document_type` (soporte para documento `ANALITICO`).
  - Panel de Conducción completo (`PanelConduccionInscripciones.jsx`): visor/descarga de PDFs adjuntos y acciones alineadas a la máquina de estados (`ENVIADO → EN_REVISION → APROBADO / OBSERVADO / RECHAZADO`), con motivo obligatorio y emisión transaccional de número descriptivo (`AA-COD-CC-NNN`).
  - Expediente individual de estudiantes (`PanelConduccionEstudiante.jsx`), gestión real de posgrados/cohortes (`VistaPostgrados.jsx` + `cohorteService.js`) y métricas/estadísticas dinámicas (`VistaEstadisticas.jsx`).
  - Usuario demo `docente.demo@posgrado.frlp.utn.edu.ar` en `docker/database/init.sql`.
- **Testing & CI/CD:**
  - Suite frontend con Vitest + React Testing Library (`services.test.js`, `Preinscripcion.test.jsx`, `MiLegajo.test.jsx`, `PanelConduccionInscripciones.test.jsx`, `PanelConduccionEstudiante.test.jsx`, `VistaPostgrados.test.jsx`, `VistaEstadisticas.test.jsx` y `flujoCompletoE2E.test.jsx`) integrada en `.github/workflows/ci.yml`.
  - Pruebas backend ampliadas para orden de foreign keys en `create_legajo`, perfil de aspirante y documentos `ANALITICO`.

### Fixed
- Orden correcto de `await db.flush()` dentro de `try/except IntegrityError` en `create_legajo()` para respetar la FK de `auditoria_legajos` en PostgreSQL.
- Orden de middlewares en `app/backend/src/main.py` (`DocumentUploadLimitMiddleware` antes de `CORSMiddleware`) y manejo descriptivo de errores de red/descarga en `apiClient.js` y `legajoService.js`.
- Sincronización inmediata de sesión y rol en `App.jsx` al iniciar/cerrar sesión y restricción de vistas RBAC (`ASPIRANTE`, `DOCENTE`, `ADMIN_POSGRADO`, `SUPERADMIN`).
- Validación temprana de archivos PDF válidos en cliente, reutilización/actualización de legajos en reintentos, limpieza de documentos previos al reemplazarlos (`DELETE /api/v1/documentos/{id}`) y omisión de tokens vencidos en `GET /cohortes`.

---

## [v0.1.0-alpha] — Base Inicial & Infraestructura

### Added
- Estructura inicial del repositorio y documentación base (`SRS`, `PRD`, `BFD`, `ARQUITECTURA`, `ARQUITECTURA_RBAC`, `CRONOGRAMA`).
- Autenticación JWT con refresh tokens rotativos (`0001_refresh_sessions`), modelo de base de datos inicial y `docker-compose.yml` hardened.
- Pipeline base de CI/CD en GitHub Actions.
