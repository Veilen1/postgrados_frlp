# Plan de Gestión y Matriz de Riesgos de Proyecto
**Proyecto:** Sistema de Gestión Académica de Posgrado (UTN-FRLP)  
**Cátedra:** Desarrollo de Software 2026  
**Documento:** `docs/GESTION_RIESGOS.md`  
**Versión:** 1.0 (Plan de Contingencia y Estabilización Metodológica)  
**Fecha:** 28 de Octubre de 2026  
**Estado:** Aprobado para Ejecución Inmediata  
**Responsables:** Lucio (Arquitectura, Backend, Infraestructura), Valen (Tech Lead, Backend), Emilio (Frontend)  

---

## 1. Diagnóstico Situacional y Racional de Contingencia

### 1.1 Estado del Equipo y Desfasaje de Cronograma
El proyecto experimentó un estancamiento inicial y un desfasaje acumulado en el cronograma respecto a la planificación teórica de la cátedra:
- **Disponibilidad heterogénea y deuda de coordinación grupal:** Durante las primeras etapas se registró baja cadencia de trabajo global, dificultades de articulación y dispersión de esfuerzos en el equipo general. Para revertir esta inercia y reactivar el ritmo del proyecto, se establece un núcleo activo de estabilización metodológica y técnica:
  - **Valen:** Tech Lead / Backend
  - **Emilio:** Frontend (React 19 / TypeScript)
  - **Lucio:** Backend, Arquitectura, Infraestructura Docker y Documentación técnica
  *(El objetivo operativo es consolidar el flujo base para facilitar la reincorporación progresiva y sincronizada del resto de los integrantes).*
- **Curva de Aprendizaje y Brecha de Seniority:** Los roles fueron asignados para dar cumplimiento a la estructura organizativa requerida, asumiendo el desafío de que los miembros se encuentran en etapa formativa y sin experiencia sénior previa en sus respectivas áreas.
- **Consecuencia directa:** El margen para sobreingeniería, experimentación paralela o dispersión de esfuerzo es nulo. Se requiere un enfoque pragmático para recuperar el tiempo perdido y asegurar la entrega en término.

### 1.2 Diagnóstico de la Base de Código y Repositorio
- **Anarquía en control de versiones:** Existencia de ramas huérfanas y desactualizadas (`feature/daraceli-...`, `feature/login-emilio-y-mas`, `feature/perfil-estudiante`), merges directos sobre `main` sin validación cruzada y ausencia de convención uniforme de commits.
- **Divergencia entre Stack Canónico y Plantillas:** El archivo `docker-compose.yml` base mantenía configuraciones heredadas orientadas a un backend Node.js/npm, mientras que el stack canónico definitivo establecido para el proyecto es **FastAPI (Python 3.12+)**, PostgreSQL y React 19.
- **Ausencia de pipeline de backend integrado:** La rama principal contiene avances de frontend y documentación de cátedra, pero carece de la estructura backend canónica operativa bajo *Screaming Architecture*.

---

## 2. Estrategia de Descopeo Radical (Scope Freeze: Enfoque 100% Módulo Core)

Para garantizar la entrega en tiempo y forma con los estándares de calidad exigidos, se decreta el **congelamiento total de los módulos no esenciales** y la concentración absoluta en el **Módulo Core**.

### 2.1 Módulos Descopeados (Congelamiento Funcional)
Los siguientes módulos quedan formalmente fuera del alcance de implementación activa para la entrega del MVP académico:

| Módulo Descopeado | Alcance Original (PRD) | Decisión de Arquitectura / Rescate |
|---|---|---|
| **Módulo B: Carga Académica y Planilla Docente** | Planilla inline de asistencia, carga masiva de notas, tokens opacos para docentes. | **Congelado.** No se construirán endpoints ni vistas de carga docente en esta etapa. Se preservan únicamente los contratos de interfaz si fueran requeridos para documentación. |
| **Módulo C: Seguimiento de Graduación y Semáforo** | Seguimiento de TFI/Tesis, cálculo diario automatizado con scheduler (2 AM), clasificación de estudiantes en riesgo. | **Congelado a nivel integración.** Se mantiene el algoritmo puro `calcular_semaforo()` en su archivo de dominio como activo de testing unitario puro de la cátedra, pero se desactiva el worker en segundo plano y las pantallas asociadas. |
| **Módulo D: Analytics y Reportes de Conducción** | Métricas de retención, desgranamiento, gráficos de cohortes y exportación en streaming a Excel. | **Congelado.** Fuera del MVP. Se sustituye por consultas directas a base de datos para auditorías puntuales si el jurado lo requiere. |

### 2.2 Alcance Certificable: Módulo Core (100% Prioridad)
El esfuerzo del equipo se canaliza exclusivamente en el flujo vital del estudiante y la administración académica:

1. **Preinscripción Pública de Aspirantes:** Formulario de registro, validación sintáctica de DNI y correo electrónico institucional/personal, vinculación a cohorte abierta.
2. **Gestión y Almacenamiento Seguro de Documentación:** Subida de documentación obligatoria en formato PDF, validación de cabeceras binarias (magic bytes `%PDF`), cuota máxima de 5 MB por archivo y aislamiento en volumen persistente de Docker.
3. **Workflow de Auditoría y Legajo Digital:** Panel de administración para `ADMIN_POSGRADO` con máquina de estados estricta (`BORRADOR` $\rightarrow$ `ENVIADO` $\rightarrow$ `EN_REVISION` $\rightarrow$ `OBSERVADO` / `APROBADO` / `RECHAZADO`).
4. **Matriculación y Asignación de Legajo:** Al momento de la aprobación, generación automática del identificador único de legajo académico y transición del usuario a rol `ALUMNO`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ALCANCE CONGELADO                             │
│   [Módulo B: Docente]    [Módulo C: Semáforo]    [Módulo D: Analytics] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ (Descopeo radical)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MÓDULO CORE (OBJETIVO ÚNICO)                    │
│  ┌──────────────────┐   ┌───────────────────┐   ┌───────────────────┐  │
│  │  Preinscripción  │──▶│ Carga Documental  │──▶│ Revisión y Legajo │  │
│  │   (Aspirante)    │   │  (PDFs Validados) │   │ (ADMIN_POSGRADO)  │  │
│  └──────────────────┘   └───────────────────┘   └───────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Metodología de Ponderación de Riesgos

La cuantificación de los riesgos se efectúa mediante una matriz matricial bidimensional de **Probabilidad $\times$ Impacto**, en una escala discreta del 1 al 5:

### 3.1 Criterios de Escala

| Nivel | Probabilidad ($P$) | Impacto ($I$) |
|:---:|---|---|
| **1** | **Rara:** Ocurrencia improbable (< 10%). | **Insignificante:** Desvío menor sin impacto en plazos ni arquitectura. |
| **2** | **Improbable:** Podría ocurrir en circunstancias excepcionales (10% - 30%). | **Menor:** Impacto absorbible en la misma iteración con esfuerzo marginal. |
| **3** | **Posible:** Probabilidad moderada de ocurrencia (31% - 60%). | **Moderado:** Requiere refactorización parcial o retrabajo de 1 a 2 días. |
| **4** | **Probable:** Alta probabilidad de manifestación (61% - 85%). | **Crítico:** Bloquea componentes clave, retrasa entregas o viola requisitos no funcionales. |
| **5** | **Casi Segura:** Certeza operativa si no se interviene (> 85%). | **Catastrófico:** Imposibilidad de entrega, pérdida de integridad del sistema o reprobación. |

### 3.2 Clasificación de Severidad ($S = P \times I$)
- **Crítico (15 - 25):** Requiere intervención arquitectónica y metodológica inmediata. Detiene desarrollos no alineados.
- **Alto (10 - 14):** Mitigación preventiva obligatoria dentro de la iteración en curso.
- **Medio (5 - 9):** Monitoreo periódico en revisiones de pares y syncs semanales.
- **Bajo (1 - 4):** Riesgo aceptado con procedimiento de contingencia estándar.

---

## 4. Matriz Formal de Riesgos de Proyecto

| ID | Riesgo Identificado | $P$ | $I$ | Severidad Inicial | Estrategia | $P_{res}$ | $I_{res}$ | Severidad Residual | Responsable |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **RSK-01** | **Sobrecarga operativa por desfasaje acumulado, disponibilidad variable y brecha de experiencia** | 5 | 5 | **25 (Crítico)** | Mitigar | 2 | 3 | **6 (Medio)** | Valen / Lucio |
| **RSK-02** | **Dispersión de esfuerzo por desborde de alcance (*Scope Creep* multi-módulo)** | 5 | 4 | **20 (Crítico)** | Evitar | 1 | 3 | **3 (Bajo)** | Lucio |
| **RSK-03** | **Bloqueo del Frontend por contratos de API inestables o inexistentes** | 4 | 4 | **16 (Crítico)** | Mitigar | 2 | 2 | **4 (Bajo)** | Emilio / Valen |
| **RSK-04** | **Divergencia de stack e infraestructura Docker rota/desactualizada** | 4 | 3 | **12 (Alto)** | Evitar | 1 | 2 | **2 (Bajo)** | Lucio |
| **RSK-05** | **Vulnerabilidades y fallas de integridad en almacenamiento de PDFs** | 3 | 4 | **12 (Alto)** | Mitigar | 1 | 3 | **3 (Bajo)** | Lucio / Valen |
| **RSK-06** | **Corrupción de ramas y falta de trazabilidad por flujo Git desordenado** | 4 | 4 | **16 (Crítico)** | Evitar | 1 | 2 | **2 (Bajo)** | Todos |
| **RSK-07** | **Regresiones funcionales y fallos en demos por ausencia de testing** | 4 | 3 | **12 (Alto)** | Mitigar | 2 | 2 | **4 (Bajo)** | Valen / Lucio |

---

## 5. Fichas de Detalle y Planes de Mitigación

### RSK-01: Sobrecarga operativa por desfasaje acumulado y disponibilidad variable
- **Descripción:** El retraso inicial acumulado, sumado a la disponibilidad horaria dispar y la falta de trayectoria sénior en el equipo, expone al proyecto a demoras críticas ante bloqueos técnicos y fatiga cognitiva.
- **Disparador:** Tareas de un ticket abiertas por más de 48 horas sin progreso reportable en el repositorio.
- **Plan de Mitigación Preventiva:**
  1. Adopción de patrones de diseño canónicos y directos: evitar sobreingeniería, microservicios prematuros o capas de abstracción innecesarias.
  2. Implementación de sesiones cortas de pair-programming asíncrono para destrabar tickets complejos de backend/frontend.
  3. Descopeo radical (congelar módulos B, C y D).
- **Plan de Contingencia:** Reasignación inmediata de tareas de backend entre Lucio y Valen si un componente se traba; simplificación de vistas en frontend reduciendo librerías externas superfluas.

### RSK-02: Dispersión de esfuerzo por desborde de alcance (*Scope Creep*)
- **Descripción:** Intentar abarcar los 4 módulos de la cátedra con los plazos remanentes derivaría en un sistema a medio terminar, sin funcionalidad punta a punta confiable.
- **Disparador:** Apertura de PRs, ramas o discusiones orientadas a seminarios, asistencia docente o dashboards estadísticos.
- **Plan de Mitigación Preventiva:**
  1. Formalización del congelamiento funcional en este documento (`docs/GESTION_RIESGOS.md`).
  2. Criterio de rechazo automático en code review para cualquier código que no tribute al Módulo Core.
- **Plan de Contingencia:** Aislar código periférico en ramas archivadas sin mergear a `dev`.

### RSK-03: Bloqueo de Frontend por falta de especificación y mocks
- **Descripción:** Emilio (Frontend) depende de la disponibilidad de endpoints backend para avanzar. Si el backend demora su implementación, el frontend queda paralizado.
- **Disparador:** Frontend inactivo o forzado a adivinar la forma de los payloads JSON.
- **Plan de Mitigación Preventiva:**
  1. Congelamiento de contratos OpenAPI y especificación RBAC en `docs/ARQUITECTURA_RBAC.md` previo a codear.
  2. Uso riguroso de `docs/SEED_DATA.json` para que el frontend trabaje con mocks tipados en TypeScript desde el día cero.
- **Plan de Contingencia:** Publicación de endpoints mockeados en FastAPI que retornen datos fijos inmediatos para desacoplar el consumo de la lógica de persistencia.

### RSK-04: Divergencia de stack y deuda técnica en Docker Compose
- **Descripción:** Archivos de infraestructura con referencias cruzadas a Node.js/Prisma que provocan fallos de compilación local y discrepancias de entorno.
- **Disparador:** Errores de ejecución en `docker compose up` o comandos `npm` intentando correr sobre servicios de Python.
- **Plan de Mitigación Preventiva:**
  1. Reescritura integral de `docker-compose.yml` apuntando estrictamente a: `postgrado-db` (Postgres 15), `postgrado-backend` (FastAPI / Uvicorn / Python 3.12) y `postgrado-frontend` (Vite / React 19).
  2. Definición de `.env.example` saneado y validado en local.
- **Plan de Contingencia:** Verificación periódica de reproducibilidad mediante comando de saneamiento `docker compose down -v && docker compose up --build`.

### RSK-05: Vulnerabilidades de seguridad en almacenamiento de PDFs
- **Descripción:** Aceptación de archivos maliciosos, sobrecarga de disco por archivos desmedidos o acceso público no autenticado a documentos sensibles (DNI, títulos de grado).
- **Disparador:** Uploads de archivos sin control de cabeceras o errores de permisos en rutas de descarga.
- **Plan de Mitigación Preventiva:**
  1. Validación en dos fases en la capa de infraestructura del backend: verificación del MIME type declarado y lectura de los primeros 4 bytes del binario (`%PDF` / `0x25 0x50 0x44 0x46`).
  2. Límite físico estricto de 5 MB por archivo.
  3. Nombres de archivo aleatorizados (UUID v4) en almacenamiento, desvinculados del nombre original provisto por el usuario para evitar Directory Traversal.
  4. Descarga restringida mediante endpoint autenticado con RBAC que valida titularidad o rol de auditoría.
- **Plan de Contingencia:** Purga manual y script de cuarentena para cualquier documento no conforme a las firmas binarias.

### RSK-06: Corrupción de ramas y descontrol de versiones
- **Descripción:** Commits desordenados directamente en `main`, conflictos de merge destructivos y falta de trazabilidad en correcciones.
- **Disparador:** Commits registrados en `main` sin pasar por Pull Request.
- **Plan de Mitigación Preventiva:**
  1. Aplicación estricta de GitHub Flow: `main` protegida, `dev` como integradora, ramas de ticket `ticket/T...` o documentación `docs/...`.
  2. Revisión de pares obligatoria antes de autorizar cualquier merge.
  3. Convención de Conventional Commits requerida en cada commit.
- **Plan de Contingencia:** Revert inmediato de cualquier commit accidental directo sobre ramas base mediante `git revert`.

### RSK-07: Regresiones funcionales por déficit de pruebas automatizadas
- **Descripción:** Modificaciones en capas transversales (autenticación o entidades) que rompen flujos existentes sin ser advertidas hasta la instancia de presentación.
- **Disparador:** Fallos en vivo durante pruebas manuales o demostraciones.
- **Plan de Mitigación Preventiva:**
  1. Adopción de Screaming Architecture para aislar la lógica de dominio pura (sin base de datos ni HTTP).
  2. Priorización de tests unitarios rápidos sobre reglas de negocio (máquina de estados de legajo, validadores).
  3. Tests de integración focalizados en la matriz RBAC de FastAPI.
- **Plan de Contingencia:** Congelamiento de código 48 horas antes de cualquier entrega formal para dedicación exclusiva a estabilización y smoke tests.

---

## 6. Estrategia de Testing y Aseguramiento de Calidad Pragmático

Dado el tiempo remanente y para optimizar el esfuerzo del equipo, se descarta una suite pesada de pruebas End-to-End (E2E) con Selenium o Cypress, priorizando la **Pirámide de Testing Pragmática**:

```
             / \
            /   \
           /     \
          /  E2E  \       ◄── Manual / Smoke test guiado (0% automatizado para evitar fragilidad)
         /─────────\
        /           \
       / Integración \    ◄── FastAPI TestClient + Postgres (Endpoints Core + RBAC) [30%]
      /───────────────\
     /                 \
    /   Unitarios de    \ ◄── Pytest: Dominio puro, Validadores, PDFs, Máquina de Estados [70%]
   /    Dominio Puro     \    (Sin dependencias externas, ejecución instantánea < 1 seg)
  /───────────────────────\
```

### 6.1 Niveles de Verificación Automatizada

1. **Pruebas Unitarias de Dominio (Python / Pytest):**
   - **Objetivo:** Garantizar que las reglas de negocio nunca fallen, independientemente de la base de datos o el framework web.
   - **Alcance:**
     - Transiciones permitidas y prohibidas de `EstadoLegajo`.
     - Value Objects (`DNI`, `Email`).
     - Función de validación de firma binaria de PDFs.
     - Función de negocio `calcular_semaforo()` (preservada para evaluación de cátedra).
   - **Restricción de arquitectura:** Cero imports de `fastapi`, `sqlalchemy` o `pydantic` dentro de los módulos de dominio bajo prueba.

2. **Pruebas de Integración de API y Seguridad (FastAPI TestClient):**
   - **Objetivo:** Verificar la consistencia de contratos HTTP y la estanqueidad de la matriz de autorización.
   - **Alcance:**
     - Respuestas correctas `401 Unauthorized` ante ausencia o expiración de tokens JWT.
     - Respuestas correctas `403 Forbidden` cuando un rol no autorizado intenta invocar endpoints protegidos (ej. un `ASPIRANTE` intentando aprobar un legajo).
     - Validación de esquemas Pydantic y serialización de respuestas de error unificadas.

3. **Verificación en Frontend (TypeScript + React 19):**
   - Validación temprana en cliente con esquemas de validación (Zod o schemas equivalentes) para evitar el envío de payloads corruptos a la API.
   - Tipado estricto compartido alineado con las definiciones de los DTOs del backend.

---

## 7. Protocolo de Integración y Flujo Git (GitHub Flow Rescate)

Para restaurar la disciplina metodológica en el repositorio, rige de manera obligatoria el siguiente protocolo:

### 7.1 Jerarquía de Ramas
- **`main` (Rama de Release):**
  - Contiene exclusivamente software verificado y listo para entrega.
  - Se encuentra **bloqueada** para commits directos.
  - Cada actualización sobre `main` debe corresponder a un merge proveniente de `dev` con un tag anotado semántico (`vX.Y.Z`).
- **`dev` (Rama de Integración Diaria):**
  - Es la rama base de trabajo continuo.
  - Recibe integración exclusivamente mediante Pull Requests aprobados.
- **Ramas Efímeras de Trabajo:**
  - Nomenclatura estricta:
    - `ticket/T<n>-<descripcion-corta>`: Para tareas de funcionalidad o corrección (ej. `ticket/T01-alta-legajo`).
    - `docs/<descripcion-corta>`: Para documentación técnica y arquitectura (ej. `docs/gestion-riesgos-rbac`).
  - Vida útil máxima de una rama: 48 a 72 horas. Se eliminan al mergearse.

### 7.2 Convención de Commits (Conventional Commits)
Todo commit debe seguir el formato estándar:
`<tipo>(<alcance>): <descripción imperativa en minúsculas>`

Tipos permitidos:
- `feat`: Nueva funcionalidad para el usuario.
- `fix`: Corrección de un defecto o bug.
- `docs`: Modificaciones exclusivamente en documentación.
- `refactor`: Cambio de código que no altera funcionalidad ni arregla bugs.
- `test`: Incorporación o corrección de pruebas automatizadas.
- `chore`: Tareas de mantenimiento, dependencias o configuración de build.

### 7.3 Protocolo de Pull Request y Code Review
1. Ningún desarrollador mergea su propio PR sin al menos una aprobación explícita de revisión de pares.
2. Todo PR debe incluir una descripción clara que resuma: contexto del cambio, verificación ejecutada en local (captura o log de tests) y enlaces a tickets vinculados.
3. El revisor debe certificar:
   - Que no se importen dependencias de framework en capas de dominio puro.
   - Que los endpoints nuevos cuenten con su dependencia de rol RBAC correspondiente.
   - Que no existan credenciales, secretos ni archivos `.env` en el diff.

---

## 8. Tablero de Control de Rescate (Métricas de Seguimiento)

| Indicador | Meta / Límite de Control | Mecanismo de Medición |
|---|---|---|
| **Commits directos en `main` / `dev`** | **0** (Tolerancia Cero) | Auditoría de log en GitHub |
| **Tiempo de vida de ramas efímeras** | $\le 72$ horas | Inspección visual de PRs |
| **Tiempo de respuesta en Code Review** | $\le 24$ horas | Notificaciones en canal del equipo |
| **Ejecución de suite unitaria local** | $< 5$ segundos, 100% verde | Hook pre-push / Pytest local |
| **Desvío del alcance del Core** | **0 tareas activas de módulos B, C, D** | Backlog semanal |

