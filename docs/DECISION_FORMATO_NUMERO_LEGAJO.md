# Decisión: formato del número de legajo

**Estado:** adoptada

**Fecha:** 2026-10-30

## Contexto

La documentación anterior proponía `YY-NNN-CCC` y el ejemplo `26-001-045`. Aunque el
número era único, no permitía reconocer a simple vista la carrera o el posgrado. Para el
operador que revisa una preinscripción, aprueba una vacante o atiende una consulta, eso
obligaba a buscar el legajo por separado y aumentaba el riesgo de confundir cohortes.

El número identifica al legajo; no reemplaza el nombre oficial del posgrado ni de la
cohorte.

## Decisión

Se adopta el formato:

```text
YY-CCCC-CC-NNN
```

Ejemplo:

```text
26-MISI-01-045
```

| Segmento | Significado | Ejemplo |
|---|---|---|
| `YY` | Últimos dos dígitos del año de la cohorte | `26` = 2026 |
| `CCCC` | Código estable de cuatro letras o números de la carrera | `MISI` = Maestría en Ingeniería en Sistemas de Información |
| `CC` | Número de esa cohorte para la misma carrera y año | `01` = primera cohorte MISI de 2026 |
| `NNN` | Secuencia del alumno dentro de esa cohorte, asignada al aprobar | `045` = alumno número 45 |

El código de carrera y el número de cohorte se registran al crear la cohorte. Para cohortes
existentes que todavía no tengan esos datos, un administrador puede completarlos aunque
conserven números históricos; esos números no se reescriben y el contador continúa desde
la secuencia existente. Una vez emitido un número con el formato descriptivo, el
identificador ya no puede modificarse. La combinación año, código de carrera y número de
cohorte debe ser única. El mismo código de carrera se conserva en las cohortes de años
posteriores.

El sistema asigna el consecutivo del alumno al aprobar un legajo `EN_REVISION`. La asignación
y la transición a `APROBADO`, la fecha de aprobación y el cambio del usuario a `ALUMNO` se
guardan en una única transacción. El consecutivo es monotónico por cohorte, no se reutiliza y
está limitado a `001`–`999`; al agotarse, la aprobación se bloquea para que se defina otro
criterio, en lugar de cambiar silenciosamente el formato.

Los números históricos no se reescriben. La migración conserva los datos y prepara el
contador de cada cohorte a partir de los consecutivos existentes y de los legajos ya
aprobados. Si una cohorte histórica carece de código o número, se debe completar antes de
aprobar nuevos legajos.

## Presentación para el operador

En las pantallas, listados y documentos del legajo se debe mostrar el número junto al nombre
completo del posgrado y de la cohorte, por ejemplo:

> **26-MISI-01-045** — Maestría en Ingeniería en Sistemas de Información — Cohorte 2026

El código ayuda a identificar rápidamente la carrera, pero el nombre completo sigue visible
para evitar que el operador tenga que memorizar siglas. La respuesta de legajo de la API
incluye el resumen de la cohorte para facilitar esa presentación.

## Consecuencias

- Cohorte incorpora `codigo_carrera`, `numero_cohorte` y un contador interno de alumnos
  aprobados.
- El código y el número de cohorte se validan y su combinación anual no puede duplicarse.
- Los administradores pueden asignar el identificador faltante de una cohorte heredada antes
  de que esta emita números.
- La aprobación deja de estar bloqueada cuando la cohorte está identificada y el consecutivo
  está disponible.
- Las pantallas deben mostrar el número junto con el nombre completo de la carrera/cohorte,
  nunca como sustituto de esos nombres.
