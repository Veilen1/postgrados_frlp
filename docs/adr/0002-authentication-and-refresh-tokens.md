# ADR 0002: Autenticación Core con JWT y refresh tokens rotativos

- Estado: Aceptado
- Fecha: 2026-10-30

## Contexto

Los endpoints de cohorte, legajo y documentación dependen de una identidad autenticada y
de claims de rol. La especificación RBAC define JWT HS256 con expiración de ocho horas,
refresh tokens opacos con expiración de siete días, persistencia de su hash, y rutas
públicas para registro y login.

## Decisión

- El autorregistro crea únicamente usuarios activos con rol `ASPIRANTE`; la creación del
  legajo pertenece al flujo de inscripción y no ocurre como efecto implícito del registro.
- Las contraseñas se hashean con bcrypt (12 rounds). Se exige un mínimo de 12 caracteres y
  se limita a 72 bytes UTF-8 para respetar el límite del algoritmo.
- Los access tokens son JWT HS256 con `sub`, `email`, `rol`, `nombre`, `iss`, `iat` y `exp`.
  La clave se configura mediante `JWT_SECRET` y debe tener al menos 32 bytes. El secreto
  predeterminado solo se permite en `development`, `dev` o `test`.
- El refresh token se genera con un CSPRNG, se devuelve una sola vez y solo se persiste su
  hash SHA-256. Cada renovación revoca el anterior y crea uno nuevo dentro de la misma
  transacción; tokens expirados, revocados o desconocidos se rechazan.
- Cada request autenticado vuelve a consultar el usuario para respetar desactivaciones y
  cambios de rol durante la vigencia del access token.
- Los errores 401/403 usan el formato uniforme documentado en RBAC y no exponen si una
  cuenta existe ni detalles criptográficos.

## Consecuencias

- El registro, login, refresh y `/me` son la primera porción vertical del Core; no implica
  que cohortes, legajos y documentos estén implementados.
- El refresh token actual debe conservarse en el cliente y reemplazarse en cada refresh.
- La tabla `refresh_sessions` se agrega mediante la revisión Alembic `0001_refresh_sessions`.
- Para producción, el secreto debe ser único, aleatorio y gestionado fuera del repositorio.
