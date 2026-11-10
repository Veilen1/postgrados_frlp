# Integración frontend: cohortes y número de legajo

**Audiencia:** equipo de Frontend y asistentes de IA que trabajen en la interfaz.
**Estado:** contrato implementado por Backend Core.
**Fuente de autorización:** [`ARQUITECTURA_RBAC.md`](./ARQUITECTURA_RBAC.md).
**Motivo y reglas del número:** [`DECISION_FORMATO_NUMERO_LEGAJO.md`](./DECISION_FORMATO_NUMERO_LEGAJO.md).

## Objetivo

Integrar en las pantallas de aspirantes y administración el identificador de legajo
`YY-CCCC-CC-NNN`, sin mostrarlo como sustituto del nombre oficial de la carrera o cohorte.
Esta guía comunica el contrato existente; no requiere cambios en el backend ni modifica
los permisos definidos en RBAC.

## Contrato de cohortes

Para crear una cohorte, `POST /api/v1/cohortes` requiere estos campos:

```json
{
  "anio": 2026,
  "nombre": "Cohorte 2026 - Maestría en Ingeniería en Sistemas",
  "carrera": "Maestría en Ingeniería en Sistemas de Información",
  "codigo_carrera": "MISI",
  "numero_cohorte": 1,
  "tipo_carrera": "Maestria",
  "abierta": true,
  "fecha_inicio": "2026-04-01"
}
```

- `codigo_carrera`: cuatro caracteres alfanuméricos en mayúsculas.
- `numero_cohorte`: entero de `1` a `99`, consecutivo de esa carrera para ese año.
- El código debe conservarse entre cohortes de la misma carrera y no puede asignarse a otra.
- La combinación de año, código y ordinal debe ser única.
- Las cohortes heredadas sin identificador pueden completarse con
  `PATCH /api/v1/cohortes/{cohort_id}/identificador`, con `codigo_carrera` y
  `numero_cohorte`. Una vez emitido un número descriptivo, no se puede cambiar.

La respuesta de `GET /api/v1/cohortes` contiene estos campos, además del resto del contrato:

```json
{
  "anio": 2026,
  "nombre": "Cohorte 2026 - Maestría en Ingeniería en Sistemas",
  "carrera": "Maestría en Ingeniería en Sistemas de Información",
  "codigo_carrera": "MISI",
  "numero_cohorte": 1
}
```

La API lista públicamente las cohortes abiertas; un usuario autenticado puede consultar
también las cerradas. Para la matriz de roles y permisos administrativos, consultar RBAC.

## Contrato de legajos

La respuesta de legajo incluye `numero_legajo` y el resumen `cohorte`. Antes de aprobar,
`numero_legajo` es `null`; el frontend debe representar ese estado como pendiente de
asignación, no construir un número provisional.

```json
{
  "numero_legajo": "26-MISI-01-045",
  "estado": "APROBADO",
  "fecha_aprobacion": "2026-10-30T12:00:00Z",
  "cohorte": {
    "anio": 2026,
    "nombre": "Cohorte 2026 - Maestría en Ingeniería en Sistemas",
    "carrera": "Maestría en Ingeniería en Sistemas de Información",
    "codigo_carrera": "MISI",
    "numero_cohorte": 1
  }
}
```

El número se genera en Backend únicamente cuando administración cambia el estado de
`EN_REVISION` a `APROBADO` mediante `PATCH /api/v1/legajos/{legajo_id}/estado`.
La respuesta actualizada devuelve el número, el estado, la fecha de aprobación y el resumen
de cohorte. Los listados administrativos están paginados y devuelven los legajos dentro de
`items`.

## Presentación requerida

- En el detalle, las tarjetas y las filas de administración, mostrar el número junto al
  nombre completo de carrera y cohorte. Ejemplo:
  **26-MISI-01-045 — Maestría en Ingeniería en Sistemas de Información — Cohorte 2026**.
- No mostrar solo `MISI`, ni exigir al operador que conozca el significado del código.
- Si `numero_legajo` es `null`, mostrar un texto de estado como **“Se asigna al aprobar”**;
  no fabricar secuencias ni inferirlas desde el contador de cohorte.
- Los códigos y ordinales de cohortes heredadas pueden ser `null` hasta que administración
  los complete. La interfaz debe tolerarlo y presentar los nombres oficiales.
- En el formulario administrativo de creación de cohortes, solicitar código de carrera y
  ordinal además de los campos ya existentes; validar el formato antes de enviar.

## Criterios de aceptación para el frontend

- Una cohorte nueva se crea enviando `codigo_carrera` y `numero_cohorte`.
- Los detalles y listados muestran el número solo cuando la API lo devuelve y conservan el
  contexto oficial de carrera y cohorte.
- Al aprobar, la vista refleja el número devuelto por la respuesta, sin requerir recarga
  manual ni generarlo en el cliente.
- Los estados sin número y las cohortes heredadas sin identificador se presentan sin errores
  ni valores inventados.
- Los endpoints, roles y reglas de titularidad siguen la matriz de
  [`ARQUITECTURA_RBAC.md`](./ARQUITECTURA_RBAC.md).
