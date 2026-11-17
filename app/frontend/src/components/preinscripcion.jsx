import React, { useState, useEffect, useCallback } from 'react';
import { inscripcionService } from '../services/inscripcionService';
import { authService } from '../services/authService';

function leerCabeceraPdf(file) {
  const slice = file.slice(0, 4);
  if (typeof slice?.text === 'function') {
    return slice.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(slice);
  });
}

function agruparDocumentos(documentos = []) {
  return documentos.reduce((resultado, documento) => {
    if (!documento?.id || !documento?.tipo) return resultado;
    const previo = resultado[documento.tipo] || { ids: [], nombres: [], sincronizado: true };
    resultado[documento.tipo] = {
      ids: [...previo.ids, documento.id],
      nombres: [...previo.nombres, documento.nombre_original].filter(Boolean),
      sincronizado: true,
    };
    return resultado;
  }, {});
}

const Paso1DatosPersonales = ({
  formData,
  handleChange,
  errores,
  requiereCuenta,
  identidadBloqueada,
  onNext,
}) => (
  <>
    {identidadBloqueada && (
      <p className="identity-readonly-note" role="note">
        El DNI, el nombre, el apellido y el correo están vinculados a tu cuenta y no se pueden editar desde este legajo.
        Si necesitás corregirlos, contactá a la Secretaría de Posgrado.
      </p>
    )}
    <div className="form-grid">
      <div className="form-group">
        <label>Apellido <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} readOnly={identidadBloqueada} className={`form-control ${errores.apellido ? 'error' : ''}`} />
        {errores.apellido && <span className="error-text">{errores.apellido}</span>}
      </div>
      <div className="form-group">
        <label>Nombre <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} readOnly={identidadBloqueada} className={`form-control ${errores.nombre ? 'error' : ''}`} />
        {errores.nombre && <span className="error-text">{errores.nombre}</span>}
      </div>
      <div className="form-group">
        <label>Nacionalidad</label>
        <input type="text" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="form-control" />
      </div>
      <div className="form-group">
        <label>DNI/Pasaporte <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="dni" value={formData.dni} onChange={handleChange} readOnly={identidadBloqueada} className={`form-control ${errores.dni ? 'error' : ''}`} />
        {errores.dni && <span className="error-text">{errores.dni}</span>}
      </div>
      <div className="form-group full-width">
        <label>Correo Electrónico <span style={{color: 'red'}}>*</span></label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} readOnly={identidadBloqueada} className={`form-control ${errores.email ? 'error' : ''}`} />
        {errores.email && <span className="error-text">{errores.email}</span>}
      </div>
      <div className="form-group full-width">
        <label>Domicilio</label>
        <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} className="form-control" />
      </div>
      {requiereCuenta && (
        <div className="form-group full-width">
          <label>Crear Contraseña de Acceso (mín. 12 caracteres) <span style={{color: 'red'}}>*</span></label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 12 caracteres para acceder a tu legajo"
            className={`form-control ${errores.password ? 'error' : ''}`}
          />
          {errores.password && <span className="error-text">{errores.password}</span>}
        </div>
      )}
    </div>
    <button className="btn-primary" style={{marginTop: '20px'}} onClick={onNext}>
      Continuar a Datos Académicos
    </button>
  </>
);

const Paso2DatosAcademicos = ({
  formData,
  handleChange,
  handleChangeCohorte,
  cohortes,
  cargandoCohortes,
  errorCohortes,
  onRecargarCohortes,
  errores,
  onPrev,
  onNext,
}) => (
  <>
    <div className="form-grid">
      <div className="form-group">
        <label>Título de Grado <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className={`form-control ${errores.titulo ? 'error' : ''}`} />
        {errores.titulo && <span className="error-text">{errores.titulo}</span>}
      </div>
      <div className="form-group">
        <label>Universidad de Origen <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="universidad" value={formData.universidad} onChange={handleChange} className={`form-control ${errores.universidad ? 'error' : ''}`} />
        {errores.universidad && <span className="error-text">{errores.universidad}</span>}
      </div>
      <div className="form-group">
        <label>Año de Egreso <span style={{color: 'red'}}>*</span></label>
        <input type="number" name="anioEgreso" value={formData.anioEgreso} onChange={handleChange} className={`form-control ${errores.anioEgreso ? 'error' : ''}`} />
        {errores.anioEgreso && <span className="error-text">{errores.anioEgreso}</span>}
      </div>
      <div className="form-group">
        <label>Carrera a la que se postula <span style={{color: 'red'}}>*</span></label>
        {cargandoCohortes ? (
          <select className="form-control" disabled style={{background: '#f8f9fa'}}>
            <option>Cargando carreras con inscripciones abiertas...</option>
          </select>
        ) : errorCohortes ? (
          <div>
            <div style={{color: '#dc3545', fontSize: '13px', marginBottom: '6px'}}>
              Error al consultar carreras: {errorCohortes}
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{fontSize: '12px', padding: '4px 10px'}}
              onClick={onRecargarCohortes}
            >
              Reintentar
            </button>
          </div>
        ) : !cohortes || cohortes.length === 0 ? (
          <div style={{backgroundColor: '#fff3cd', color: '#856404', padding: '10px 12px', borderRadius: '4px', fontSize: '13px', border: '1px solid #ffeeba'}}>
            No hay carreras con período de inscripción abierto actualmente.
          </div>
        ) : (
          <>
            <select
              name="cohorte_id"
              value={formData.cohorte_id || ''}
              onChange={handleChangeCohorte}
              className={`form-control ${errores.cohorte_id ? 'error' : ''}`}
              style={{background: 'white'}}
            >
              <option value="">-- Seleccione una carrera de posgrado --</option>
              {cohortes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || `${c.carrera} (${c.anio})`}
                </option>
              ))}
            </select>
            {errores.cohorte_id && <span className="error-text">{errores.cohorte_id}</span>}
          </>
        )}
      </div>
    </div>
    <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
      <button className="btn-secondary" style={{flex: 1}} onClick={onPrev}>Volver</button>
      <button
        className="btn-primary"
        style={{flex: 2}}
        onClick={onNext}
        disabled={cargandoCohortes || (!cohortes || cohortes.length === 0)}
      >
        Continuar a Documentación
      </button>
    </div>
  </>
);

const Paso3Documentacion = ({
  archivos,
  documentosPorTipo,
  erroresArchivos,
  validandoArchivos,
  onFileChange,
  onPrev,
  onNext,
}) => (
  <>
    <div style={{background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #ffc107'}}>
       <strong>Atención:</strong> Según el reglamento vigente, todos los archivos adjuntos deben estar exclusivamente en formato PDF y pesar menos de 5MB.
    </div>
    <div className="form-grid">
      <div className="form-group">
        <label>Copia de Título Universitario (.pdf) <span style={{color: 'red'}}>*</span></label>
        <input 
          type="file" 
          accept=".pdf,application/pdf" 
          className={`form-control ${erroresArchivos?.titulo ? 'error' : ''}`}
          onChange={(e) => onFileChange('titulo', e)} 
        />
        <EstadoDocumento archivo={archivos.titulo} documento={documentosPorTipo.TITULO_GRADO} />
        {erroresArchivos?.titulo && <span className="error-text">{erroresArchivos.titulo}</span>}
      </div>
      <div className="form-group">
        <label>Certificado Analítico (.pdf)</label>
        <input 
          type="file" 
          accept=".pdf,application/pdf" 
          className={`form-control ${erroresArchivos?.analitico ? 'error' : ''}`}
          onChange={(e) => onFileChange('analitico', e)} 
        />
        <EstadoDocumento archivo={archivos.analitico} documento={documentosPorTipo.ANALITICO} />
        {erroresArchivos?.analitico && <span className="error-text">{erroresArchivos.analitico}</span>}
      </div>
      <div className="form-group">
        <label>Curriculum Vitae (CV) (.pdf)</label>
        <input 
          type="file" 
          accept=".pdf,application/pdf" 
          className={`form-control ${erroresArchivos?.cv ? 'error' : ''}`}
          onChange={(e) => onFileChange('cv', e)} 
        />
        <EstadoDocumento archivo={archivos.cv} documento={documentosPorTipo.CV} />
        {erroresArchivos?.cv && <span className="error-text">{erroresArchivos.cv}</span>}
      </div>
      <div className="form-group">
        <label>Copia de DNI (.pdf) <span style={{color: 'red'}}>*</span></label>
        <input 
          type="file" 
          accept=".pdf,application/pdf" 
          className={`form-control ${erroresArchivos?.dni ? 'error' : ''}`}
          onChange={(e) => onFileChange('dni', e)} 
        />
        <EstadoDocumento archivo={archivos.dni} documento={documentosPorTipo.DNI} />
        {erroresArchivos?.dni && <span className="error-text">{erroresArchivos.dni}</span>}
      </div>
    </div>
    <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
      <button className="btn-secondary" style={{flex: 1}} onClick={onPrev}>Volver</button>
      <button
        className="btn-primary"
        style={{flex: 2, opacity: validandoArchivos ? 0.7 : 1, cursor: validandoArchivos ? 'wait' : 'pointer'}}
        onClick={onNext}
        disabled={validandoArchivos}
      >
        {validandoArchivos ? 'Verificando archivo PDF...' : 'Generar Resumen de Legajo'}
      </button>
    </div>
  </>
);

const EstadoDocumento = ({ archivo, documento }) => {
  if (archivo) {
    return (
      <span className="document-file-state document-file-state--selected">
        {documento?.nombres?.[0] ? 'Se reemplazará el archivo actual por:' : 'Archivo listo para cargar:'}
        {' '}{archivo.name}
      </span>
    );
  }

  if (documento?.nombres?.[0]) {
    return (
      <span className="document-file-state">
        Documento actual: {documento.nombres[0]}. Si no seleccionás otro PDF, se conserva.
      </span>
    );
  }

  return null;
};

const Paso4Resumen = ({
  formData,
  archivos,
  documentosPorTipo,
  cargando,
  errorEnvio,
  onPrev,
  onConfirm,
}) => {
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="resumen-box">
        <h3>1. Datos Personales</h3>
        <div className="resumen-grid">
          <div className="resumen-item"><span>Nombre Completo</span><p>{formData.nombre || '-'} {formData.apellido || '-'}</p></div>
          <div className="resumen-item"><span>DNI / Pasaporte</span><p>{formData.dni || '-'}</p></div>
          <div className="resumen-item"><span>Email</span><p>{formData.email || '-'}</p></div>
        </div>
      </div>
      <div className="resumen-box">
        <h3>2. Perfil Académico & Postulación</h3>
        <div className="resumen-grid">
          <div className="resumen-item"><span>Carrera Seleccionada</span><p><strong>{formData.nombreCohorte || formData.posgrado || 'No seleccionada'}</strong></p></div>
          <div className="resumen-item"><span>Título de Grado</span><p>{formData.titulo || '-'}</p></div>
          <div className="resumen-item"><span>Universidad</span><p>{formData.universidad || '-'} {formData.anioEgreso ? `(${formData.anioEgreso})` : ''}</p></div>
        </div>
      </div>
      <div className="resumen-box">
        <h3>3. Documentación Digital</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <li>
            <strong>Título de Grado:</strong>{' '}
            {archivos?.titulo ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.titulo.name} ({formatSize(archivos.titulo.size)})</span>
            ) : documentosPorTipo.TITULO_GRADO?.nombres?.[0] ? (
              <span style={{ color: '#28a745' }}>📄 {documentosPorTipo.TITULO_GRADO.nombres[0]} (ya cargado)</span>
            ) : (
              <span style={{ color: '#dc3545' }}>No adjuntado</span>
            )}
          </li>
          <li>
            <strong>Copia de DNI:</strong>{' '}
            {archivos?.dni ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.dni.name} ({formatSize(archivos.dni.size)})</span>
            ) : documentosPorTipo.DNI?.nombres?.[0] ? (
              <span style={{ color: '#28a745' }}>📄 {documentosPorTipo.DNI.nombres[0]} (ya cargado)</span>
            ) : (
              <span style={{ color: '#dc3545' }}>No adjuntado</span>
            )}
          </li>
          <li>
            <strong>Certificado Analítico:</strong>{' '}
            {archivos?.analitico ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.analitico.name} ({formatSize(archivos.analitico.size)})</span>
            ) : documentosPorTipo.ANALITICO?.nombres?.[0] ? (
              <span style={{ color: '#28a745' }}>📄 {documentosPorTipo.ANALITICO.nombres[0]} (ya cargado)</span>
            ) : (
              <span style={{ color: '#6c757d' }}>Opcional (no adjuntado)</span>
            )}
          </li>
          <li>
            <strong>Curriculum Vitae:</strong>{' '}
            {archivos?.cv ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.cv.name} ({formatSize(archivos.cv.size)})</span>
            ) : documentosPorTipo.CV?.nombres?.[0] ? (
              <span style={{ color: '#28a745' }}>📄 {documentosPorTipo.CV.nombres[0]} (ya cargado)</span>
            ) : (
              <span style={{ color: '#6c757d' }}>Opcional (no adjuntado)</span>
            )}
          </li>
        </ul>
      </div>

      {errorEnvio && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          marginTop: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>Error al enviar preinscripción:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{errorEnvio}</p>
          </div>
        </div>
      )}

      <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
        <button 
          className="btn-secondary" 
          style={{flex: 1, opacity: cargando ? 0.6 : 1, cursor: cargando ? 'not-allowed' : 'pointer'}} 
          onClick={onPrev}
          disabled={cargando}
        >
          Modificar Datos
        </button>
        <button 
          className="btn-primary" 
          style={{flex: 2, opacity: cargando ? 0.7 : 1, cursor: cargando ? 'not-allowed' : 'pointer'}} 
          onClick={onConfirm}
          disabled={cargando}
        >
          {cargando ? '⏳ Procesando y subiendo archivos...' : 'Confirmar y Enviar'}
        </button>
      </div>
    </>
  );
};

const Paso5Exito = ({ legajoConfirmado, onReset, onVolverAMiLegajo }) => (
  <div style={{ textAlign: 'center', padding: '30px 20px' }}>
    <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>✅</div>
    <h2 style={{ color: '#28a745', marginBottom: '10px' }}>¡Preinscripción Registrada con Éxito!</h2>
    <p style={{ color: '#555', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto 25px' }}>
      Tu solicitud y la documentación digital requerida fueron procesadas correctamente por el sistema de posgrado.
    </p>

    <div className="resumen-box" style={{ maxWidth: '540px', margin: '0 auto 25px', textAlign: 'left', borderLeft: '4px solid #28a745' }}>
      <div className="resumen-item" style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>IDENTIFICADOR DE TRÁMITE / LEGAJO</span>
        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1a1a1a', margin: '4px 0 0' }}>
          {legajoConfirmado?.id || 'Generado'}
        </p>
      </div>
      <div className="resumen-grid">
        <div className="resumen-item">
          <span>Aspirante</span>
          <p>{legajoConfirmado?.nombre || '-'}</p>
        </div>
        <div className="resumen-item">
          <span>Carrera</span>
          <p>{legajoConfirmado?.posgrado || '-'}</p>
        </div>
        <div className="resumen-item" style={{ gridColumn: '1 / -1' }}>
          <span>Notificaciones enviadas a</span>
          <p>{legajoConfirmado?.email || '-'}</p>
        </div>
      </div>
    </div>

    <div style={{ background: '#e8f4fd', color: '#0c5460', padding: '12px 18px', borderRadius: '8px', maxWidth: '540px', margin: '0 auto 25px', fontSize: '0.9rem' }}>
      ℹ️ La Secretaría de Posgrado auditará los documentos adjuntos y te notificará por correo electrónico ante cualquier novedad.
    </div>

    <button
      className="btn-primary"
      style={{ minWidth: '220px' }}
      onClick={onVolverAMiLegajo || onReset}
    >
      {onVolverAMiLegajo ? 'Volver a Mi Legajo' : 'Iniciar Nueva Preinscripción'}
    </button>
  </div>
);

export default function Preinscripcion({
  onVolverAlLogin,
  initialLegajo,
  onVolverAMiLegajo,
}) {
  const legajoPreexistente = initialLegajo?.legajo || null;
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [legajoConfirmado, setLegajoConfirmado] = useState(null);
  const [legajoIdEnCurso, setLegajoIdEnCurso] = useState(legajoPreexistente?.id || null);
  const [docsPorTipo, setDocsPorTipo] = useState(() => agruparDocumentos(initialLegajo?.documentos));
  const [validandoArchivos, setValidandoArchivos] = useState(0);
  const [sesionPublicaCreada, setSesionPublicaCreada] = useState(false);
  const [requiereCuenta, setRequiereCuenta] = useState(
    () => Boolean(onVolverAlLogin) || !authService.isAuthenticated()
  );

  useEffect(() => {
    if (onVolverAlLogin && !sesionPublicaCreada && authService.isAuthenticated()) {
      authService.logout();
    }
  }, [onVolverAlLogin, sesionPublicaCreada]);
  const [errores, setErrores] = useState({});
  const [erroresArchivos, setErroresArchivos] = useState({});

  // Listado de cohortes dinámicas de la API
  const [cohortes, setCohortes] = useState([]);
  const [cargandoCohortes, setCargandoCohortes] = useState(true);
  const [errorCohortes, setErrorCohortes] = useState(null);

  const usuarioInicial = onVolverAlLogin ? null : authService.getUser();
  const [formData, setFormData] = useState({
    nombre: legajoPreexistente?.nombre || usuarioInicial?.nombre || '',
    apellido: legajoPreexistente?.apellido || usuarioInicial?.apellido || '',
    nacionalidad: legajoPreexistente?.nacionalidad || '',
    dni: legajoPreexistente?.dni || '',
    email: legajoPreexistente?.email || usuarioInicial?.email || '',
    domicilio: legajoPreexistente?.domicilio || '',
    password: '',
    titulo: legajoPreexistente?.titulo || '',
    universidad: legajoPreexistente?.universidad || '',
    anioEgreso: legajoPreexistente?.anio_egreso || '',
    cohorte_id: legajoPreexistente?.cohorte_id || '',
    posgrado: legajoPreexistente?.cohorte?.carrera || '',
    nombreCohorte: legajoPreexistente?.cohorte?.nombre || '',
    solicitaBeca: Boolean(legajoPreexistente?.solicita_beca),
    tipoBeca: legajoPreexistente?.tipo_beca || '',
  });

  const cargarCohortes = useCallback(async () => {
    try {
      setCargandoCohortes(true);
      setErrorCohortes(null);
      const data = await inscripcionService.obtenerCohortes();
      const lista = Array.isArray(data) ? [...data] : [];
      const cohorteGuardada = legajoPreexistente?.cohorte;
      if (cohorteGuardada && !lista.some((cohorte) => cohorte.id === cohorteGuardada.id)) {
        lista.unshift(cohorteGuardada);
      }
      setCohortes(lista);
      if (lista.length > 0) {
        setFormData((prev) => {
          if (prev.cohorte_id) return prev;
          const primera = lista[0];
          return {
            ...prev,
            cohorte_id: primera.id,
            posgrado: primera.carrera || primera.nombre,
            nombreCohorte: primera.nombre,
          };
        });
      }
    } catch (err) {
      setErrorCohortes(err.message || 'Error al conectar con el servidor para obtener las carreras.');
    } finally {
      setCargandoCohortes(false);
    }
  }, [legajoPreexistente]);

  useEffect(() => {
    cargarCohortes();
  }, [cargarCohortes]);

  const handleChangeCohorte = (e) => {
    const selectedId = e.target.value;
    const cohorteEncontrada = cohortes.find((c) => String(c.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      cohorte_id: selectedId,
      posgrado: cohorteEncontrada ? (cohorteEncontrada.carrera || cohorteEncontrada.nombre) : '',
      nombreCohorte: cohorteEncontrada ? cohorteEncontrada.nombre : '',
    }));
    if (errores.cohorte_id) {
      setErrores((prev) => ({ ...prev, cohorte_id: '' }));
    }
  };
  // Estado para guardar los archivos PDF seleccionados
  const [archivos, setArchivos] = useState({
    titulo: null,
    analitico: null,
    cv: null,
    dni: null,
  });

  const handleFileChange = async (tipo, e) => {
    const inputEl = e.target;
    const file = inputEl.files[0] || null;

    if (!file) {
      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      setErroresArchivos((prev) => ({ ...prev, [tipo]: '' }));
      const tipoBackendMap = {
        titulo: 'TITULO_GRADO',
        dni: 'DNI',
        cv: 'CV',
        analitico: 'ANALITICO',
      };
      const tipoBackend = tipoBackendMap[tipo];
      if (tipoBackend) {
        setDocsPorTipo((prev) => {
          const actual = prev[tipoBackend];
          if (!actual) return prev;
          return { ...prev, [tipoBackend]: { ...actual, sincronizado: true } };
        });
      }
      return;
    }

    // Validación 1: Debe ser formato PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErroresArchivos((prev) => ({ ...prev, [tipo]: 'Solo se aceptan archivos en formato PDF' }));
      inputEl.value = '';
      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      return;
    }

    // Validación 2: Límite de 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setErroresArchivos((prev) => ({ ...prev, [tipo]: 'El archivo es demasiado grande. Máximo permitido: 5MB' }));
      inputEl.value = '';
      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      return;
    }

    // Validación 3: Firma binaria real %PDF (evita archivos renombrados que el backend rechaza con 415)
    if (typeof file.slice === 'function') {
      setValidandoArchivos((prev) => prev + 1);
      try {
        const header = await leerCabeceraPdf(file);
        if (header !== '%PDF') {
          setErroresArchivos((prev) => ({
            ...prev,
            [tipo]: 'El archivo no es un PDF válido o está dañado. Exportalo nuevamente en formato PDF.',
          }));
          inputEl.value = '';
          setArchivos((prev) => ({ ...prev, [tipo]: null }));
          return;
        }
      } catch {
        // Si el navegador no permite leer el slice, delegamos la validación al servidor
      } finally {
        setValidandoArchivos((prev) => Math.max(0, prev - 1));
      }
    }

    // Si el aspirante reemplaza un archivo ya subido en un intento previo, marcar para reemplazar en servidor
    const tipoBackendMap = {
      titulo: 'TITULO_GRADO',
      dni: 'DNI',
      cv: 'CV',
      analitico: 'ANALITICO',
    };
    const tipoBackend = tipoBackendMap[tipo];
    if (tipoBackend) {
      setDocsPorTipo((prev) => {
        const actual = prev[tipoBackend];
        if (!actual) return prev;
        return { ...prev, [tipoBackend]: { ...actual, sincronizado: false } };
      });
    }

    // Si es válido, limpiamos el error y guardamos el archivo
    setErroresArchivos((prev) => ({ ...prev, [tipo]: '' }));
    setArchivos((prev) => ({ ...prev, [tipo]: file }));
  };

  const handleChange = (e) => {
    if (legajoPreexistente && ['dni', 'nombre', 'apellido', 'email'].includes(e.target.name)) {
      return;
    }
    setFormData({...formData, [e.target.name]: e.target.value});
    if(errores[e.target.name]) {
      setErrores({...errores, [e.target.name]: ''});
    }
  };

  const validatePaso1 = () => {
    const nuevosErrores = {};
    if(!formData.apellido) nuevosErrores.apellido = 'El apellido es obligatorio';
    if(!formData.nombre) nuevosErrores.nombre = 'El nombre es obligatorio';
    if(!formData.dni) nuevosErrores.dni = 'El DNI es obligatorio';
    if(!formData.email) nuevosErrores.email = 'El email es obligatorio';
    if(requiereCuenta && (!formData.password || formData.password.length < 12)) {
      nuevosErrores.password = 'La contraseña debe tener al menos 12 caracteres';
    }

    if(Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
    } else {
      setErrores({});
      setPaso(2);
    }
  };

  const validatePaso2 = () => {
    const nuevosErrores = {};
    if(!formData.titulo) nuevosErrores.titulo = 'El título de grado es obligatorio';
    if(!formData.universidad) nuevosErrores.universidad = 'La universidad es obligatoria';
    if(!formData.anioEgreso || !Number.isInteger(Number(formData.anioEgreso))) {
      nuevosErrores.anioEgreso = 'Ingresá un año de egreso válido';
    }
    if(!formData.cohorte_id) nuevosErrores.cohorte_id = 'Debe seleccionar una carrera de posgrado';

    if(Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
    } else {
      setErrores({});
      setPaso(3);
    }
  };

  const validatePaso3 = () => {
    if (validandoArchivos > 0) return;

    const nuevosErrores = {};
    const tieneTitulo = Boolean(archivos.titulo || docsPorTipo.TITULO_GRADO?.sincronizado);
    const tieneDni = Boolean(archivos.dni || docsPorTipo.DNI?.sincronizado);
    if (!tieneTitulo) nuevosErrores.titulo = 'La copia del título universitario es obligatoria';
    if (!tieneDni) nuevosErrores.dni = 'La copia de DNI es obligatoria';

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresArchivos(nuevosErrores);
    } else {
      setErroresArchivos({});
      setPaso(4);
    }
  };

  const handleConfirm = async () => {
    setCargando(true);
    setErrorEnvio(null);
    let creoSesionAhora = false;
    try {
      // 0. Si el aspirante ingresó desde el acceso público sin sesión activa en este flujo, registrarlo y autenticarlo
      if (requiereCuenta || (onVolverAlLogin && !sesionPublicaCreada)) {
        authService.logout();
        await authService.registroAspirante({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          apellido: formData.apellido,
        });
        await authService.login(formData.email, formData.password);
        creoSesionAhora = true;
        setSesionPublicaCreada(true);
        setRequiereCuenta(false);
      }

      // 1. Crear el legajo o reutilizar y actualizar el existente en BORRADOR/OBSERVADO
      let legajoId = legajoIdEnCurso;
      let mapaDocs = { ...docsPorTipo };
      if (legajoId) {
        await inscripcionService.actualizarPreinscripcion(legajoId, formData);
      } else {
        try {
          const legajo = await inscripcionService.crearPreinscripcion(formData);
          legajoId = legajo?.id || legajo?.legajo_id;
        } catch (err) {
          if (err.status === 409) {
            const existente = await inscripcionService.obtenerMiLegajo();
            if (existente && ['BORRADOR', 'OBSERVADO'].includes(existente.estado)) {
              legajoId = existente.id;
              await inscripcionService.actualizarPreinscripcion(legajoId, formData);
              const docsPrevios = await inscripcionService.obtenerDocumentos(legajoId);
              if (!Array.isArray(docsPrevios)) {
                throw new Error('No se pudo recuperar la documentación del legajo existente.');
              }
              mapaDocs = { ...mapaDocs, ...agruparDocumentos(docsPrevios) };
              const archivosPorTipo = {
                TITULO_GRADO: archivos.titulo,
                DNI: archivos.dni,
                CV: archivos.cv,
                ANALITICO: archivos.analitico,
              };
              for (const [tipo, archivo] of Object.entries(archivosPorTipo)) {
                if (archivo && mapaDocs[tipo]) {
                  mapaDocs[tipo] = { ...mapaDocs[tipo], sincronizado: false };
                }
              }
              setDocsPorTipo(mapaDocs);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
        setLegajoIdEnCurso(legajoId);
      }
      console.log('Legajo listo para documentación. ID:', legajoId);

      // 2. Subir archivos pendientes eliminando reemplazos previos para no duplicar documentos
      const documentosAEnviar = [
        { archivo: archivos.titulo, tipo: 'TITULO_GRADO' },
        { archivo: archivos.dni, tipo: 'DNI' },
        { archivo: archivos.analitico, tipo: 'ANALITICO' },
        { archivo: archivos.cv, tipo: 'CV' },
      ];

      for (const doc of documentosAEnviar) {
        if (!doc.archivo) continue;
        const estadoDoc = mapaDocs[doc.tipo];
        if (estadoDoc?.sincronizado) continue;

        if (estadoDoc?.ids?.length) {
          for (const oldId of estadoDoc.ids) {
            await inscripcionService.eliminarDocumento(oldId);
          }
        }

        const creado = await inscripcionService.subirDocumento(legajoId, doc.tipo, doc.archivo);
        mapaDocs = {
          ...mapaDocs,
          [doc.tipo]: {
            ids: creado?.id ? [creado.id] : [],
            nombres: [creado?.nombre_original || doc.archivo.name],
            sincronizado: true,
          },
        };
        setDocsPorTipo(mapaDocs);
        console.log(`Documento subido: ${doc.tipo}`);
      }

      // 3. Enviar formalmente el legajo para que pase de BORRADOR a ENVIADO
      await inscripcionService.enviarLegajo(legajoId);

      // Si el alta se realizó desde el acceso público, limpiamos la sesión temporal al finalizar
      if (onVolverAlLogin && (sesionPublicaCreada || creoSesionAhora)) {
        authService.logout();
        setSesionPublicaCreada(false);
        setRequiereCuenta(true);
      }

      setLegajoConfirmado({
        id: legajoId,
        nombre: `${formData.nombre} ${formData.apellido}`,
        email: formData.email,
        posgrado: formData.nombreCohorte || formData.posgrado,
      });
      setLegajoIdEnCurso(null);
      setDocsPorTipo({});
      setPaso(5);
    } catch (error) {
      console.error('Error en el proceso de inscripción:', error);
      setErrorEnvio(error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleReset = () => {
    if (onVolverAlLogin && sesionPublicaCreada) {
      authService.logout();
      setSesionPublicaCreada(false);
    }
    if (onVolverAlLogin) {
      setRequiereCuenta(true);
    }
    setLegajoIdEnCurso(null);
    setDocsPorTipo({});
    setPaso(1);
    setLegajoConfirmado(null);
    setErrorEnvio(null);
    const primera = cohortes[0];
    const usuarioActual = !onVolverAlLogin ? authService.getUser() : null;
    setFormData({
      nombre: usuarioActual?.nombre || '',
      apellido: usuarioActual?.apellido || '',
      nacionalidad: '',
      dni: '',
      email: usuarioActual?.email || '',
      domicilio: '',
      password: '',
      titulo: '',
      universidad: '',
      anioEgreso: '',
      cohorte_id: primera?.id || '',
      posgrado: primera ? (primera.carrera || primera.nombre) : '',
      nombreCohorte: primera ? primera.nombre : '',
    });
    setArchivos({
      titulo: null,
      analitico: null,
      cv: null,
      dni: null,
    });
  };

  const handleVolverAlLogin = () => {
    if (sesionPublicaCreada) {
      authService.logout();
      setSesionPublicaCreada(false);
    }
    setLegajoIdEnCurso(null);
    setDocsPorTipo({});
    onVolverAlLogin();
  };

  return (
    <div>
      <header className="utn-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>UTN</h1><h2>{legajoPreexistente ? 'Completar mi legajo' : 'Sistema de Posgrado - Preinscripción'}</h2>
        </div>
          {(onVolverAlLogin || onVolverAMiLegajo) && (
          <button
            type="button"
            className="btn-secondary"
              onClick={onVolverAMiLegajo || handleVolverAlLogin}
            style={{
              fontSize: '13px',
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              color: '#002B49',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {onVolverAMiLegajo ? '← Volver a Mi Legajo' : '← Volver al Inicio de Sesión'}
          </button>
        )}
      </header>
      <div className="preinscripcion-container">
        {legajoPreexistente?.estado === 'OBSERVADO' && (
          <div
            role="alert"
            style={{
              background: '#fff3cd',
              color: '#664d03',
              padding: '14px 18px',
              borderRadius: '8px',
              border: '1px solid #ffecb5',
              marginBottom: '20px',
            }}
          >
            <strong>Subsaná las observaciones de tu legajo</strong>
            <p style={{ margin: '6px 0 0' }}>
              {legajoPreexistente.motivo_observacion || 'Revisá y completá los datos y documentos pendientes.'}
            </p>
            <p style={{ margin: '6px 0 0' }}>
              Podés corregir los datos y reemplazar únicamente los documentos observados; los demás se conservan.
            </p>
          </div>
        )}
        <div className="steps">
          <span className={`step ${paso === 1 ? 'active' : (paso > 1 ? 'completed' : '')}`}><span className="circle">{paso > 1 ? '✓' : '1'}</span> Datos Personales</span>
          <span className={`step ${paso === 2 ? 'active' : (paso > 2 ? 'completed' : '')}`}>— <span className="circle">{paso > 2 ? '✓' : '2'}</span> Datos Academicos</span>
          <span className={`step ${paso === 3 ? 'active' : (paso > 3 ? 'completed' : '')}`}>— <span className="circle">{paso > 3 ? '✓' : '3'}</span> Documentación</span>
          <span className={`step ${paso === 4 ? 'active' : (paso > 4 ? 'completed' : '')}`}>— <span className="circle">{paso > 4 ? '✓' : '4'}</span> Resumen</span>
          {paso === 5 && <span className="step active">— <span className="circle">✓</span> Confirmación</span>}
        </div>
        
        {paso === 1 && (
          <Paso1DatosPersonales
            formData={formData}
            handleChange={handleChange}
            errores={errores}
            requiereCuenta={requiereCuenta}
            identidadBloqueada={Boolean(legajoPreexistente)}
            onNext={validatePaso1}
          />
        )}
        
        {paso === 2 && (
          <Paso2DatosAcademicos
            formData={formData}
            handleChange={handleChange}
            handleChangeCohorte={handleChangeCohorte}
            cohortes={cohortes}
            cargandoCohortes={cargandoCohortes}
            errorCohortes={errorCohortes}
            onRecargarCohortes={cargarCohortes}
            errores={errores}
            onPrev={() => setPaso(1)}
            onNext={validatePaso2}
          />
        )}
        
        {paso === 3 && (
          <Paso3Documentacion
            archivos={archivos}
            documentosPorTipo={docsPorTipo}
            erroresArchivos={erroresArchivos}
            validandoArchivos={validandoArchivos > 0}
            onFileChange={handleFileChange}
            onPrev={() => setPaso(2)}
            onNext={validatePaso3}
          />
        )}
        
        {paso === 4 && (
          <Paso4Resumen
            formData={formData}
            archivos={archivos}
            documentosPorTipo={docsPorTipo}
            cargando={cargando}
            errorEnvio={errorEnvio}
            onPrev={() => { setErrorEnvio(null); setPaso(3); }}
            onConfirm={handleConfirm}
          />
        )}

        {paso === 5 && (
          <Paso5Exito
            legajoConfirmado={legajoConfirmado}
            onReset={handleReset}
            onVolverAMiLegajo={onVolverAMiLegajo}
          />
        )}
      </div>
    </div>
  );
}
