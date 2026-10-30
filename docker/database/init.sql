-- =============================================================================
-- Sistema de Gestión Académica de Posgrado — UTN FRLP
-- Script de Inicialización y Migración Base (Módulo Core)
-- Archivo: docker/database/init.sql
-- =============================================================================

-- 1. Habilitar extensiones criptográficas para UUIDs y Hashes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configuración de zona horaria canónica
SET timezone TO 'UTC';

-- -----------------------------------------------------------------------------
-- 2. TABLA: usuarios (Autenticación y RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100) NOT NULL,
    rol           VARCHAR(30) NOT NULL DEFAULT 'ASPIRANTE'
                  CONSTRAINT rol_valido CHECK (
                      rol IN ('ASPIRANTE', 'ALUMNO', 'DOCENTE', 'ADMIN_POSGRADO', 'SUPERADMIN')
                  ),
    activo        BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- -----------------------------------------------------------------------------
-- 3. TABLA: cohortes (Períodos académicos y oferta)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohortes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anio         INTEGER NOT NULL,
    nombre       VARCHAR(100) NOT NULL UNIQUE,
    carrera      VARCHAR(100) NOT NULL,
    tipo_carrera VARCHAR(30) NOT NULL
                 CONSTRAINT tipo_carrera_cohorte CHECK (
                     tipo_carrera IN ('Especializacion', 'Maestria', 'Doctorado')
                 ),
    abierta      BOOLEAN NOT NULL DEFAULT false,
    fecha_inicio DATE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cohortes_abierta ON cohortes(abierta);

-- -----------------------------------------------------------------------------
-- 4. TABLA: legajos (Módulo Core)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legajos (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_legajo      VARCHAR(30) UNIQUE, -- Formato: AÑO-COHORTE-SECUENCIAL (ej: 26-001-045)
    usuario_id         UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cohorte_id         UUID NOT NULL REFERENCES cohortes(id),
    dni                VARCHAR(20) NOT NULL,
    apellido           VARCHAR(100) NOT NULL,
    nombre             VARCHAR(100) NOT NULL,
    email              VARCHAR(255) NOT NULL,
    estado             VARCHAR(30) NOT NULL DEFAULT 'BORRADOR'
                       CONSTRAINT estado_legajo_valido CHECK (
                           estado IN ('BORRADOR', 'PENDIENTE', 'ENVIADO', 'EN_REVISION',
                                      'OBSERVADO', 'APROBADO', 'COMPLETADO', 'ACTIVO',
                                      'VENCIDO', 'RECHAZADO', 'BAJA', 'GRADUADO')
                       ),
    solicita_beca      BOOLEAN DEFAULT false,
    tipo_beca          VARCHAR(20),
    fecha_inscripcion  TIMESTAMP WITH TIME ZONE,
    fecha_aprobacion   TIMESTAMP WITH TIME ZONE,
    motivo_observacion TEXT,
    semaforo           VARCHAR(10) DEFAULT 'VERDE'
                       CONSTRAINT semaforo_valido CHECK (semaforo IN ('VERDE', 'AMARILLO', 'ROJO')),
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_legajo_cohorte_dni UNIQUE (cohorte_id, dni)
);

CREATE INDEX IF NOT EXISTS idx_legajos_dni ON legajos(dni);
CREATE INDEX IF NOT EXISTS idx_legajos_email ON legajos(email);
CREATE INDEX IF NOT EXISTS idx_legajos_cohorte_estado ON legajos(cohorte_id, estado);
CREATE INDEX IF NOT EXISTS idx_legajos_usuario ON legajos(usuario_id);

-- -----------------------------------------------------------------------------
-- 5. TABLA: documentos (Almacenamiento seguro de PDFs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legajo_id       UUID NOT NULL REFERENCES legajos(id) ON DELETE CASCADE,
    tipo            VARCHAR(50) NOT NULL
                    CONSTRAINT tipo_doc_valido CHECK (
                        tipo IN ('DNI', 'TITULO_GRADO', 'PARTIDA', 'CUIT_CUIL',
                                 'FORM_INSCRIPCION', 'FORM_BECA', 'TITULO_POSGRADO', 'CV')
                    ),
    path_storage    VARCHAR(500) NOT NULL, -- Ruta interna en volumen protegido
    nombre_original VARCHAR(255) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    tamanio_bytes   INTEGER NOT NULL,
    fecha_subida    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documentos_legajo ON documentos(legajo_id);

-- -----------------------------------------------------------------------------
-- 6. TABLA: auditoria_legajos (Trazabilidad estricta de cambios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_legajos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legajo_id       UUID NOT NULL REFERENCES legajos(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(30),
    estado_nuevo    VARCHAR(30) NOT NULL,
    comentario      TEXT,
    usuario_id      UUID REFERENCES usuarios(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_legajo ON auditoria_legajos(legajo_id);

-- -----------------------------------------------------------------------------
-- 7. SEED DATA INICIAL PARA DESARROLLO Y PRUEBAS
-- -----------------------------------------------------------------------------

-- 7.1 Cohorte 2026 Abierta para Pruebas
INSERT INTO cohortes (id, anio, nombre, carrera, tipo_carrera, abierta, fecha_inicio)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    2026,
    'Cohorte 2026 - Maestría en Ingeniería en Sistemas',
    'Maestría en Ingeniería en Sistemas de Información',
    'Maestria',
    true,
    '2026-04-01'
) ON CONFLICT (nombre) DO NOTHING;

-- 7.2 Usuario Administrador Inicial (Password: 'Admin123!')
INSERT INTO usuarios (id, email, password_hash, nombre, apellido, rol, activo)
VALUES (
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'admin@posgrado.frlp.utn.edu.ar',
    crypt('Admin123!', gen_salt('bf', 12)),
    'Administrador',
    'Posgrado',
    'ADMIN_POSGRADO',
    true
) ON CONFLICT (email) DO NOTHING;

-- 7.3 Usuario Aspirante de Prueba (Password: 'Aspirante123!')
INSERT INTO usuarios (id, email, password_hash, nombre, apellido, rol, activo)
VALUES (
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'aspirante.demo@posgrado.frlp.utn.edu.ar',
    crypt('Aspirante123!', gen_salt('bf', 12)),
    'Juan',
    'Pérez',
    'ASPIRANTE',
    true
) ON CONFLICT (email) DO NOTHING;

