# 🎓 SGAP - Demo Frontend (React)

Repositorio central para la demo del prototipo frontend del Sistema de Gestión Académica para Posgrado (SGAP). Este documento establece la división de componentes, normas de convivencia, flujo de trabajo y buenas prácticas del equipo.

## 👥 Asignación de Tareas (Componentes React)

Cada integrante es responsable de desarrollar, testear y pushear su componente específico de la demo:

| Integrante | Componente / Tarea Asignada | Detalle técnico a implementar |
| :--- | :--- | :--- |
| **Emilio Rivero** | **Estructura Base y Login** | Componente `<Login/>` con validación hardcodeada. Layout principal en `App.jsx`, Navbar y navegación centralizada (estado `vista`). |
| **Valen Garcia** | **Vista: Preinscripción** | Componente `<Preinscripcion/>`. Lógica del formulario multi-paso, manejo del estado `formData` y validaciones estrictas (campos obligatorios). |
| **Lucio Angel** | **Vista: Panel Docente** | Componente `<PanelDocente/>`. Tabla de asistencia con inputs de fechas dinámicas y selectores (`<select>`) editables para calificaciones finales y estado "Libre". |
| **Luciano Privitera** | **Vista: Perfil Estudiante** | Componente `<PanelConduccionEstudiante/>`. Buscador dinámico por legajo/nombre, renderizado condicional de alertas y barra de progreso. |
| **Lautaro Reduello** | **Vista: Gestión de Posgrados** | Componente `<VistaPosgrados/>`. Lógica interactiva completa para agregar programas, y editar/eliminar cohortes en tiempo real. |
| **Davila Araceli** | **Vista: Inscripciones y Estadísticas** | Componentes `<PanelConduccionInscripciones/>` y `<VistaEstadisticas/>`. Tablas con filtros cruzados, métricas y gráfico de barras dinámico en CSS puro. |

---

## 🌳 Flujo de Trabajo (Git Flow)

**Regla de oro:** 🚫 **Nadie commitea directamente a la rama `main`.**

1. El `main` debe ser siempre la versión estable que se va a mostrar en la exposición.
2. Para trabajar en tu componente, creá una rama nueva desde `main` usando tu inicial y la vista.
   * *Ejemplo:* `feature/va-preinscripcion` (Valen Garcia - Preinscripcion)

---

## 📝 Nomenclatura de Commits

Utilizamos una convención estricta para saber exactamente qué se hizo en cada archivo de React.

**Formato obligatorio:** `tipo(vista): descripción en imperativo`

### Tipos permitidos:
* `feat`: Nueva funcionalidad, botón o estructura en el componente.
* `fix`: Corrección de un bug (ej: el buscador no filtraba bien).
* `style`: Cambios en `App.css` o estilos en línea.
* `chore`: Instalación de dependencias (npm/pnpm).

### Ejemplos prácticos:
* ✅ `feat(estudiante): agregar buscador dinámico por legajo`
* ✅ `fix(docente): corregir desalineación en los inputs de fecha`
* ✅ `style(estadisticas): ajustar colores del gráfico de retención`
* ❌ `termine mi parte` (Mal formato)
* ❌ `fix: error arreglado` (Falta especificar el componente)

---

## 🔀 Reglas para Pull Requests (PR)

Para que el componente de uno pase a `main`, se debe abrir un Pull Request en GitHub cumpliendo estos pasos:

1. **Actualizar local antes de subir:** Siempre ejecutar `git pull origin main` en tu rama local para traer lo que subieron los demás y resolver conflictos en tu editor.
2. **Revisión (Code Review):** Todo PR requiere al menos **1 aprobación (Approve)** de otro miembro del equipo para asegurar que la interfaz no se rompió.
3. **Merge:** Una vez aprobado y sin conflictos, el autor de la revisión o el autor del PR presiona "Merge".

---

## 📱 Protocolo de Comunicación (WhatsApp)

* 🟢 **Aviso de PR Abierto:** *"Chicos, subí la tabla de Tesis. Link del PR. ¿Alguien me lo aprueba?"*
* 🔴 **Bloqueos:** *"Me está tirando conflicto el `App.jsx` al intentar juntar el Login con la Preinscripción, ¿alguien se suma a un Discord 5 min y lo destrabamos?"*
* 🔵 **Aviso de Merge:** *"Metí la vista Docente al main. Acuérdense de tirar `git pull origin main` antes de seguir codeando."*
* ⚠️ **Prohibido pasar código por WhatsApp:** Si hay un error, se pasa una captura clara o se sube a la rama para mirarlo desde GitHub.
