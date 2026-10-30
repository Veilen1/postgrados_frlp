# Especificación de Arquitectura de Autorización y Control de Acceso Basado en Roles (RBAC)
**Proyecto:** Sistema de Gestión Académica de Posgrado (UTN-FRLP)  
**Cátedra:** Desarrollo de Software 2026  
**Documento:** `docs/ARQUITECTURA_RBAC.md`  
**Versión:** 1.0 (Canónica - Módulo Core)  
**Fecha:** 28 de Octubre de 2026  
**Estado:** Especificación Formal Aprobada para Desarrollo  
**Responsables:** Lucio (Arquitectura, Backend), Valen (Tech Lead, Backend), Emilio (Frontend)  

---

## 1. Introducción y Principios de Diseño

Este documento establece la especificación formal del modelo de **Control de Acceso Basado en Roles (RBAC)** y seguridad de API para el **Sistema de Posgrado UTN-FRLP**.

### Principios Rectores:
1. **Mínimo Privilegio (Least Privilege):** Ningún rol posee más permisos que los estrictamente necesarios para cumplir su función operativa.
2. **Defensa en Profundidad (Defense in Depth):**
   - **Nivel Perimetral/HTTP:** Validación de token JWT y chequeo de roles gruesos mediante dependencias de FastAPI (`require_roles`).
   - **Nivel de Aplicación:** Validación de propiedad o titularidad (*ownership check*: ej. un aspirante solo accede a sus propios recursos).
   - **Nivel de Dominio:** Lógica de negocio y transiciones de estado puras protegidas por invariantes que no dependen de frameworks.
3. **Explícito sobre Implícito:** Toda ruta protegida debe declarar de forma explícita los roles admitidos. No se permiten rutas privadas con validación diferida o implícita.

---

## 2. Taxonomía Formal de Roles

El sistema define **5 roles canónicos** con responsabilidades disjuntas:

```
                  ┌─────────────────────────────────┐
                  │           SUPERADMIN            │
                  └────────────────┬────────────────┘
                                   │ Control de configuración y usuarios
                                   ▼
                  ┌─────────────────────────────────┐
                  │         ADMIN_POSGRADO          │
                  └────────────────┬────────────────┘
                                   │ Gestión de legajos y cohortes
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
  ┌─────────────────────────────┐     ┌─────────────────────────────┐
  │           ALUMNO            │     │           DOCENTE           │
  │ (Estudiante matriculado)    │     │ (Gestión académica - B)     │
  └──────────────▲──────────────┘     └─────────────────────────────┘
                 │ (Promoción al aprobar legajo)
  ┌──────────────┴──────────────┐
  │          ASPIRANTE          │
  │ (Preinscripción y carga)    │
  └─────────────────────────────┘
```

### 2.1 Definición y Alcance de Cada Rol

| Rol | Identificador Enum | Ámbito y Responsabilidades | Origen de Creación / Asignación |
|---|---|---|---|
| **Aspirante** | `ASPIRANTE` | Usuario registrado en proceso de admisión. Puede gestionar y editar exclusivamente su formulario de preinscripción y cargar/reemplazar su documentación requerida mientras el legajo esté en estado editable. | Autorregistro público (`POST /api/v1/auth/registro-aspirante` o preinscripción). |
| **Alumno** | `ALUMNO` | Estudiante formalmente admitido y matriculado en una cohorte. Posee número de legajo universitario (`numero_legajo`). Puede consultar su legajo histórico, constancias y documentación validada. | Transición automática cuando `ADMIN_POSGRADO` aprueba el legajo. |
| **Docente** | `DOCENTE` | Cuerpo académico de posgrado. Acceso restringido a los cursos/seminarios donde figura asignado para consulta de nómina y registro de regularidad. | Alta por `ADMIN_POSGRADO` o invitación institucional. |
| **Administrador de Posgrado** | `ADMIN_POSGRADO` | Personal de la Secretaría de Posgrado y directores de carrera. Audita documentación, ejecuta transiciones de estado de legajos (`OBSERVADO`, `APROBADO`, `RECHAZADO`), matricula estudiantes y administra apertura/cierre de cohortes. | Asignado por `SUPERADMIN`. |
| **Super Administrador** | `SUPERADMIN` | Rol de administración técnica y de infraestructura. Gestión global de cuentas de usuario, asignación de roles administrativos, parametrización del sistema y auditoría de seguridad. | Seed inicial en base de datos / provisioning de infraestructura. |

---

## 3. Especificación del Token de Autenticación (JWT)

La autenticación se realiza mediante **JSON Web Tokens (JWT)** transmitidos en la cabecera HTTP estándar:  
`Authorization: Bearer <access_token>`

### 3.1 Estructura del Payload (Claims Canónicos)

```json
{
  "sub": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "email": "aspirante.ejemplo@gmail.com",
  "rol": "ASPIRANTE",
  "nombre": "Juan Pérez",
  "iss": "utn-frlp-posgrado-auth",
  "iat": 1793198400,
  "exp": 1793227200
}
```

### 3.2 Parámetros Operativos de Sesión

| Parámetro | Valor Canónico | Justificación |
|---|---|---|
| **Algoritmo de Firma** | `HS256` (HMAC con SHA-256) | Clave simétrica compartida `JWT_SECRET` ($\ge 256$ bits) gestionada vía variables de entorno. |
| **Expiración Access Token** | 8 horas (`28800` segundos) | Cubre una jornada operativa típica reduciendo la fricción de re-autenticación en desarrollo y uso administrativo. |
| **Expiración Refresh Token** | 7 días (`604800` segundos) | Almacenado como token opaco con hash en base de datos para rotación segura y revocación de sesión. |

---

## 4. Implementación en FastAPI (Screaming Architecture)

La arquitectura respeta la separación de capas: el framework HTTP se limita a autenticar y verificar roles perimetrales; la lógica de negocio y permisos sobre recursos específicos reside en los casos de uso.

### 4.1 Dependencias Reutilizables (`app/backend/src/shared/auth/dependencies.py`)

```python
"""
app/backend/src/shared/auth/dependencies.py
Dependencias de seguridad perimetral de FastAPI.
"""
from typing import Annotated, Sequence
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

security = HTTPBearer(auto_error=True)

class TokenPayload(BaseModel):
    sub: UUID
    email: str
    rol: str
    nombre: str

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> TokenPayload:
    """
    Decodifica el JWT, verifica firma criptográfica y expiración.
    Lanza 401 si el token es inválido o expiró.
    """
    token = credentials.credentials
    try:
        # decode_jwt encapsula jwt.decode con JWT_SECRET y algorithms=["HS256"]
        payload_data = decode_jwt(token)
        return TokenPayload(**payload_data)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de autenticación ha expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no válidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(*roles_permitidos: str):
    """
    Fabrica una dependencia de FastAPI que valida que el usuario actual
    posea al menos uno de los roles autorizados.
    Lanza 403 Forbidden si el rol no coincide.
    """
    async def role_checker(
        current_user: Annotated[TokenPayload, Depends(get_current_user)]
    ) -> TokenPayload:
        if current_user.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Requiere uno de: {list(roles_permitidos)}"
            )
        return current_user

    return role_checker
```

### 4.2 Control de Titularidad (*Ownership Check*)

En operaciones donde un `ASPIRANTE` o `ALUMNO` interactúa con su propio legajo o documento, no basta con validar el rol; debe validarse que el recurso le pertenece:

```python
# Regla de aplicación en el Caso de Uso (o dependencia de ruta):
def validar_titularidad_o_admin(usuario_actual: TokenPayload, legajo_usuario_id: UUID) -> None:
    """
    Permite acceso si el usuario es el dueño legítimo del legajo
    o si pertenece al cuerpo de gestión administrativa.
    """
    if usuario_actual.rol in ("ADMIN_POSGRADO", "SUPERADMIN"):
        return
    if usuario_actual.sub != legajo_usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: no tiene titularidad sobre el legajo solicitado"
        )
```

---

## 5. Matriz de Permisos por Endpoint — Módulo Core

A continuación se detalla la matriz canónica de autorización para los endpoints que componen el **Módulo Core** del sistema:

### 5.1 Autenticación y Cuentas (`/api/v1/auth`)

| Endpoint | Método | Roles Permitidos | Regla de Titularidad | Códigos HTTP | Propósito |
|---|:---:|---|---|:---:|---|
| `/api/v1/auth/login` | `POST` | *Público* | N/A | `200`, `401`, `422` | Autenticación con email/password. Retorna JWT de acceso y refresh token. |
| `/api/v1/auth/registro-aspirante` | `POST` | *Público* | N/A | `201`, `400`, `422` | Creación de cuenta base con rol `ASPIRANTE`. |
| `/api/v1/auth/refresh` | `POST` | *Público (con Refresh)* | N/A | `200`, `401` | Renovación del token de acceso expirado. |
| `/api/v1/auth/me` | `GET` | `ASPIRANTE`, `ALUMNO`, `DOCENTE`, `ADMIN_POSGRADO`, `SUPERADMIN` | Retorna los datos del usuario autenticado. | `200`, `401` | Perfil del usuario activo y rol para el frontend. |

### 5.2 Gestión de Cohortes (`/api/v1/cohortes`)

| Endpoint | Método | Roles Permitidos | Regla de Titularidad | Códigos HTTP | Propósito |
|---|:---:|---|---|:---:|---|
| `/api/v1/cohortes` | `GET` | *Público* (solo abiertas) / Todos | N/A | `200` | Listado de carreras y cohortes con inscripción vigente. |
| `/api/v1/cohortes` | `POST` | `ADMIN_POSGRADO`, `SUPERADMIN` | N/A | `201`, `400`, `401`, `403`, `409` | Apertura de una cohorte con código de carrera y ordinal anual. |
| `/api/v1/cohortes/{id}/estado` | `PATCH` | `ADMIN_POSGRADO`, `SUPERADMIN` | N/A | `200`, `404`, `401`, `403` | Cierre o apertura del período de inscripción. |
| `/api/v1/cohortes/{id}/identificador` | `PATCH` | `ADMIN_POSGRADO`, `SUPERADMIN` | Puede completar cohortes heredadas; no permite cambiar el identificador después de emitir un número descriptivo. | `200`, `400`, `401`, `403`, `404`, `409` | Completa o corrige el código y ordinal de una cohorte existente. |

El código identifica de forma estable a la carrera: no puede reutilizarse para otra carrera
ni cambiarse entre cohortes de la misma carrera. El ordinal (1-99) distingue cohortes de una
carrera dentro del año. Las cohortes heredadas pueden completar estos datos antes de emitir
números; después, el identificador queda bloqueado para preservar la trazabilidad.

### 5.3 Legajos y Preinscripción (`/api/v1/legajos`)

| Endpoint | Método | Roles Permitidos | Regla de Titularidad | Códigos HTTP | Propósito |
|---|:---:|---|---|:---:|---|
| `/api/v1/legajos` | `POST` | `ASPIRANTE` | El `usuario_id` del legajo debe coincidir con `token.sub`. | `201`, `400`, `401`, `403`, `409` | Creación del legajo inicial en estado `BORRADOR`. |
| `/api/v1/legajos` | `GET` | `ADMIN_POSGRADO`, `SUPERADMIN` | Solo administradores pueden listar el universo de legajos. | `200`, `401`, `403` | Listado paginado de legajos con filtros de cohorte y estado. |
| `/api/v1/legajos/mi-legajo` | `GET` | `ASPIRANTE`, `ALUMNO` | Busca el legajo asociado al `token.sub`. | `200`, `404`, `401` | Vista del legajo propio del estudiante o aspirante. |
| `/api/v1/legajos/{id}` | `GET` | `ASPIRANTE`, `ALUMNO`, `ADMIN_POSGRADO`, `SUPERADMIN` | Aspirante/Alumno solo si es titular; Admin acceso irrestricto. | `200`, `403`, `404`, `401` | Detalle completo de un legajo y su historial de estados. |
| `/api/v1/legajos/{id}` | `PUT` | `ASPIRANTE` | Solo titular y únicamente si estado es `BORRADOR` u `OBSERVADO`. | `200`, `400`, `403`, `404` | Actualización de datos personales y académicos previos al envío. |
| `/api/v1/legajos/{id}/enviar` | `POST` | `ASPIRANTE` | Solo titular. Transiciona de `BORRADOR` u `OBSERVADO` a `ENVIADO`. | `200`, `400`, `403`, `404` | Envío formal de la postulación para auditoría administrativa. |
| `/api/v1/legajos/{id}/estado` | `PATCH` | `ADMIN_POSGRADO`, `SUPERADMIN` | Exclusivo administradores. | `200`, `400`, `401`, `403`, `404` | Transición de estado (`EN_REVISION`, `OBSERVADO`, `APROBADO`, `RECHAZADO`). |

**Estado de implementación del Core:** cada usuario puede tener un único legajo. La creación
usa el perfil autenticado y una cohorte abierta; los datos no presentes en la tabla actual
(nacionalidad, domicilio y antecedentes académicos del formulario visual) quedan fuera de
este contrato hasta acordar una migración. La API documental acepta PDF de hasta 5 MB,
valida la firma `%PDF` y almacena el archivo fuera del directorio público usando nombres
generados por el servidor. El envío exige documentos `DNI` y `TITULO_GRADO`. Al aprobar se
genera `numero_legajo` con el formato descriptivo `YY-CCCC-CC-NNN`; su justificación y las
reglas de asignación están en [`DECISION_FORMATO_NUMERO_LEGAJO.md`](DECISION_FORMATO_NUMERO_LEGAJO.md).
La respuesta del legajo incorpora el nombre oficial del posgrado y de la cohorte junto con
el identificador, para que el operador no dependa de memorizar el código abreviado.

### 5.4 Gestión Documental (`/api/v1/legajos/{id}/documentos` y `/api/v1/documentos`)

| Endpoint | Método | Roles Permitidos | Regla de Titularidad | Códigos HTTP | Propósito |
|---|:---:|---|---|:---:|---|
| `/api/v1/legajos/{id}/documentos` | `POST` | `ASPIRANTE` | Solo titular y con legajo en estado `BORRADOR` u `OBSERVADO`. | `201`, `400`, `403`, `413`, `415` | Carga de archivo PDF (DNI, Título, CV). Valida magic bytes `%PDF` y tamaño $\le 5\text{ MB}$. |
| `/api/v1/legajos/{id}/documentos` | `GET` | `ASPIRANTE`, `ALUMNO`, `ADMIN_POSGRADO`, `SUPERADMIN` | Solo titular o administrador. | `200`, `401`, `403`, `404` | Listado de metadatos de documentos cargados en el legajo. |
| `/api/v1/documentos/{doc_id}/download` | `GET` | `ASPIRANTE`, `ALUMNO`, `ADMIN_POSGRADO`, `SUPERADMIN` | Solo titular del legajo padre o administrador. | `200` (Stream), `401`, `403`, `404` | Descarga segura del binario PDF almacenado. |
| `/api/v1/documentos/{doc_id}` | `DELETE` | `ASPIRANTE` | Solo titular y con legajo en estado `BORRADOR` u `OBSERVADO`. | `204`, `401`, `403`, `404` | Eliminación/reemplazo de documento antes de la aprobación. |

---

## 6. Máquina de Estados del Legajo y Permisos de Transición

Las transiciones de estado son atómicas y están gobernadas por reglas de negocio puras en el dominio (`app/backend/src/inscripcion/domain/estados.py`):

```
                        ┌─────────────┐
                        │  BORRADOR   │ ◄── Creado por ASPIRANTE
                        └──────┬──────┘
                               │ ASPIRANTE: enviar()
                               ▼
                        ┌─────────────┐
                        │   ENVIADO   │
                        └──────┬──────┘
                               │ ADMIN_POSGRADO: iniciar_revision()
                               ▼
                        ┌─────────────┐
        ┌───────────────┤ EN_REVISION ├────────────────┐
        │               └──────┬──────┘                │
        │ ADMIN: observar()    │ ADMIN: aprobar()      │ ADMIN: rechazar()
        ▼                      ▼                       ▼
 ┌─────────────┐        ┌─────────────┐         ┌─────────────┐
 │  OBSERVADO  │        │  APROBADO   │         │  RECHAZADO  │ (Fin)
 └──────┬──────┘        └─────────────┘         └─────────────┘
        │                      │
        │ ASPIRANTE: corregir()│ Transición automática:
        └──────────────────────┘ 1. Emite `numero_legajo`
                                 2. Promociona a rol `ALUMNO`
```

### 6.1 Matriz de Transiciones Permitidas

| Estado Actual | Estado Destino | Rol que puede ejecutar la acción | Efecto Colateral / Regla de Dominio |
|---|---|:---:|---|
| *Ninguno* | `BORRADOR` | `ASPIRANTE` | Se crea la entidad `Legajo` vinculada al usuario y cohorte. |
| `BORRADOR` | `ENVIADO` | `ASPIRANTE` | Requiere que todos los tipos documentales obligatorios (DNI, Título) estén subidos. |
| `ENVIADO` | `EN_REVISION` | `ADMIN_POSGRADO`, `SUPERADMIN` | Bloquea modificaciones y asigna auditor. |
| `EN_REVISION` | `OBSERVADO` | `ADMIN_POSGRADO`, `SUPERADMIN` | Requiere ingresar `motivo_observacion`. Habilita al `ASPIRANTE` a reemplazar documentos o corregir datos. |
| `OBSERVADO` | `ENVIADO` | `ASPIRANTE` | Re-envío tras subsanar las observaciones señaladas. |
| `EN_REVISION` | `APROBADO` | `ADMIN_POSGRADO`, `SUPERADMIN` | **Acción irreversible:** Genera `numero_legajo` único (`YY-CCCC-CC-NNN`), actualiza rol de usuario a `ALUMNO` y bloquea modificaciones futuras. |
| `EN_REVISION` | `RECHAZADO` | `ADMIN_POSGRADO`, `SUPERADMIN` | **Acción irreversible:** Requiere motivo formal de rechazo. Cierra el legajo. |

---

## 7. Formato Uniforme de Respuestas de Error de Seguridad

Para evitar fuga de información y facilitar la integración con el cliente React 19, todos los rechazos de seguridad respetan una estructura uniforme:

### 7.1 Autenticación Errónea (`401 Unauthorized`)
```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Token de autenticación expirado o inválido",
  "timestamp": "2026-10-28T12:00:00Z"
}
```

### 7.2 Permiso Insuficiente o Titularidad Inválida (`403 Forbidden`)
```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Permisos insuficientes. Requiere uno de: ['ADMIN_POSGRADO', 'SUPERADMIN']",
  "timestamp": "2026-10-28T12:00:00Z"
}
```

### 7.3 Archivo Inválido o Supera Cuota (`413` / `415`)
```json
{
  "statusCode": 415,
  "error": "UNSUPPORTED_MEDIA_TYPE",
  "message": "El archivo proporcionado no posee una firma válida de documento PDF (%PDF)",
  "field": "archivo",
  "timestamp": "2026-10-28T12:00:00Z"
}
```
