import { useEffect, useState } from 'react';
import { inscripcionService } from '../services/inscripcionService';

const ESTADOS = {
  BORRADOR: 'Borrador',
  PENDIENTE: 'Pendiente',
  ENVIADO: 'Enviado',
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  APROBADO: 'Aprobado',
  COMPLETADO: 'Completado',
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  RECHAZADO: 'Rechazado',
  BAJA: 'Baja',
  GRADUADO: 'Graduado',
};

const TIPOS_DOCUMENTO = {
  DNI: 'DNI',
  TITULO_GRADO: 'Título de grado',
  CV: 'Curriculum vitae',
  ANALITICO: 'Certificado analítico',
};

const CAMPOS = [
  ['DNI / Pasaporte', 'dni', true],
  ['Correo electrónico', 'email', true],
  ['Nacionalidad', 'nacionalidad', false],
  ['Domicilio', 'domicilio', false],
  ['Título de grado', 'titulo', true],
  ['Universidad', 'universidad', true],
  ['Año de egreso', 'anio_egreso', true],
];

export default function MiLegajo({
  onIniciarPreinscripcion,
  onCompletarLegajo,
  puedeIniciarPreinscripcion = true,
  puedeEditar = true,
}) {
  const [legajo, setLegajo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    const cargarLegajo = async () => {
      try {
        const resultado = await inscripcionService.obtenerMiLegajo();
        const archivos = await inscripcionService.obtenerDocumentos(resultado.id);
        if (!activo) return;
        setLegajo(resultado);
        setDocumentos(archivos);
      } catch (err) {
        if (activo && err.status !== 404) {
          setError(err.message || 'No se pudo cargar tu legajo.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarLegajo();
    return () => {
      activo = false;
    };
  }, [intento]);

  if (cargando) {
    return (
      <main className="panel-container" aria-busy="true">
        <h2>Mi legajo</h2>
        <p>Cargando tu postulación...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="panel-container">
        <h2>Mi legajo</h2>
        <div role="alert" style={{ color: '#842029', margin: '20px 0' }}>{error}</div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setCargando(true);
            setError(null);
            setIntento((value) => value + 1);
          }}
        >
          Reintentar
        </button>
      </main>
    );
  }

  if (!legajo) {
    return (
      <main className="panel-container">
        <header className="panel-header">
          <div>
            <h2>Mi legajo</h2>
            <p>
              {puedeIniciarPreinscripcion
                ? 'Todavía no tenés una postulación iniciada.'
                : 'No encontramos un legajo asociado a tu usuario. Contactá a la Secretaría de Posgrado.'}
            </p>
          </div>
        </header>
        {puedeIniciarPreinscripcion && (
          <section className="resumen-box">
            <h3>¿Querés postularte a una carrera de posgrado?</h3>
            <p>Iniciá tu preinscripción para crear tu legajo y cargar la documentación requerida.</p>
            <button type="button" className="btn-primary" onClick={onIniciarPreinscripcion}>
              Iniciar preinscripción
            </button>
          </section>
        )}
      </main>
    );
  }

  const editable = puedeEditar && ['BORRADOR', 'OBSERVADO'].includes(legajo.estado);
  const estadoVisible = ESTADOS[legajo.estado] || legajo.estado;

  return (
    <main className="panel-container">
      <header className="panel-header">
        <div>
          <h2>Mi legajo</h2>
          <p>Consultá el estado de tu postulación y los datos que presentaste.</p>
        </div>
        {legajo.numero_legajo && (
          <strong aria-label="Número de legajo">{legajo.numero_legajo}</strong>
        )}
      </header>

      <section className="resumen-box" aria-labelledby="estado-legajo">
        <h3 id="estado-legajo">Estado de la postulación</h3>
        <p><strong>{estadoVisible}</strong></p>
        {legajo.estado === 'OBSERVADO' && legajo.motivo_observacion && (
          <div role="alert">
            <strong>Observación de la Secretaría:</strong>
            <p>{legajo.motivo_observacion}</p>
          </div>
        )}
        {legajo.estado === 'RECHAZADO' && legajo.motivo_observacion && (
          <div role="alert">
            <strong>Motivo del rechazo:</strong>
            <p>{legajo.motivo_observacion}</p>
          </div>
        )}
        {legajo.cohorte && (
          <p>
            Carrera / cohorte: <strong>{legajo.cohorte.nombre}</strong>
          </p>
        )}
        {legajo.fecha_inscripcion && (
          <p>Enviado el: {new Date(legajo.fecha_inscripcion).toLocaleDateString()}</p>
        )}
      </section>

      <section className="resumen-box" aria-labelledby="datos-legajo">
        <h3 id="datos-legajo">Tus datos</h3>
        <dl className="resumen-grid">
          {CAMPOS.map(([label, key, requerido]) => (
            <div className="resumen-item" key={key}>
              <dt>{label}</dt>
              <dd>{legajo[key] || (requerido ? 'Pendiente de completar' : 'No informado')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="resumen-box" aria-labelledby="documentos-legajo">
        <h3 id="documentos-legajo">Documentación presentada</h3>
        {documentos.length === 0 ? (
          <p>No hay documentos cargados.</p>
        ) : (
          <ul>
            {documentos.map((documento) => (
              <li key={documento.id}>
                {TIPOS_DOCUMENTO[documento.tipo] || documento.tipo}: {documento.nombre_original}
              </li>
            ))}
          </ul>
        )}
      </section>

      {editable && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => onCompletarLegajo({ legajo, documentos })}
        >
          {legajo.estado === 'OBSERVADO' ? 'Corregir y reenviar' : 'Completar mi legajo'}
        </button>
      )}
    </main>
  );
}
