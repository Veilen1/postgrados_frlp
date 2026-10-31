import React, { useState } from 'react';
import { inscripcionService } from '../services/inscripcionService';

const Paso1DatosPersonales = ({ formData, handleChange, errores, onNext }) => (
  <>
    <div className="form-grid">
      <div className="form-group">
        <label>Apellido <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className={`form-control ${errores.apellido ? 'error' : ''}`} />
        {errores.apellido && <span className="error-text">{errores.apellido}</span>}
      </div>
      <div className="form-group">
        <label>Nombre <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={`form-control ${errores.nombre ? 'error' : ''}`} />
        {errores.nombre && <span className="error-text">{errores.nombre}</span>}
      </div>
      <div className="form-group">
        <label>Nacionalidad</label>
        <input type="text" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="form-control" />
      </div>
      <div className="form-group">
        <label>DNI/Pasaporte <span style={{color: 'red'}}>*</span></label>
        <input type="text" name="dni" value={formData.dni} onChange={handleChange} className={`form-control ${errores.dni ? 'error' : ''}`} />
        {errores.dni && <span className="error-text">{errores.dni}</span>}
      </div>
      <div className="form-group full-width">
        <label>Correo Electrónico <span style={{color: 'red'}}>*</span></label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-control ${errores.email ? 'error' : ''}`} />
        {errores.email && <span className="error-text">{errores.email}</span>}
      </div>
      <div className="form-group full-width">
        <label>Domicilio</label>
        <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} className="form-control" />
      </div>
    </div>
    <button className="btn-primary" style={{marginTop: '20px'}} onClick={onNext}>
      Continuar a Datos Académicos
    </button>
  </>
);

const Paso2DatosAcademicos = ({ formData, handleChange, errores, onPrev, onNext }) => (
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
        <select name="posgrado" value={formData.posgrado} onChange={handleChange} className="form-control" style={{background: 'white'}}>
          <option>Maestría en Ingeniería</option>
          <option>Especialización en Sistemas</option>
          <option>Doctorado</option>
        </select>
      </div>
    </div>
    <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
      <button className="btn-secondary" style={{flex: 1}} onClick={onPrev}>Volver</button>
      <button className="btn-primary" style={{flex: 2}} onClick={onNext}>Continuar a Documentación</button>
    </div>
  </>
);

const Paso3Documentacion = ({ archivos, erroresArchivos, onFileChange, onPrev, onNext }) => (
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
        {erroresArchivos?.dni && <span className="error-text">{erroresArchivos.dni}</span>}
      </div>
    </div>
    <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
      <button className="btn-secondary" style={{flex: 1}} onClick={onPrev}>Volver</button>
      <button className="btn-primary" style={{flex: 2}} onClick={onNext}>Generar Resumen de Legajo</button>
    </div>
  </>
);

const Paso4Resumen = ({ formData, archivos, onPrev, onConfirm }) => {
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
          <div className="resumen-item"><span>Carrera Seleccionada</span><p><strong>{formData.posgrado}</strong></p></div>
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
            ) : (
              <span style={{ color: '#dc3545' }}>No adjuntado</span>
            )}
          </li>
          <li>
            <strong>Copia de DNI:</strong>{' '}
            {archivos?.dni ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.dni.name} ({formatSize(archivos.dni.size)})</span>
            ) : (
              <span style={{ color: '#dc3545' }}>No adjuntado</span>
            )}
          </li>
          <li>
            <strong>Certificado Analítico:</strong>{' '}
            {archivos?.analitico ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.analitico.name} ({formatSize(archivos.analitico.size)})</span>
            ) : (
              <span style={{ color: '#6c757d' }}>Opcional (no adjuntado)</span>
            )}
          </li>
          <li>
            <strong>Curriculum Vitae:</strong>{' '}
            {archivos?.cv ? (
              <span style={{ color: '#28a745' }}>📄 {archivos.cv.name} ({formatSize(archivos.cv.size)})</span>
            ) : (
              <span style={{ color: '#6c757d' }}>Opcional (no adjuntado)</span>
            )}
          </li>
        </ul>
      </div>
      <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
        <button className="btn-secondary" style={{flex: 1}} onClick={onPrev}>Modificar Datos</button>
        <button className="btn-primary" style={{flex: 2}} onClick={onConfirm}>Confirmar y Enviar</button>
      </div>
    </>
  );
};

export default function Preinscripcion() {
  const [paso, setPaso] = useState(1);
  const [errores, setErrores] = useState({});
  const [erroresArchivos, setErroresArchivos] = useState({});
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', nacionalidad: '', dni: '', email: '', domicilio: '',
    titulo: '', universidad: '', anioEgreso: '', posgrado: 'Maestría en Ingeniería'
  });
  // Estado para guardar los archivos PDF seleccionados
  const [archivos, setArchivos] = useState({
    titulo: null,
    analitico: null,
    cv: null,
    dni: null,
  });

  const handleFileChange = (tipo, e) => {
    const file = e.target.files[0] || null;

    if (!file) {
      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      return;
    }

    // Validación 1: Debe ser formato PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErroresArchivos((prev) => ({ ...prev, [tipo]: 'Solo se aceptan archivos en formato PDF' }));
      e.target.value = '';
      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      return;
    }

    // Validación 2: Límite de 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setErroresArchivos((prev) => ({ ...prev, [tipo]: 'El archivo es demasiado grande. Máximo permitido: 5MB' }));
      e.target.value = '';
      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      return;
    }

    // Si es válido, limpiamos el error y guardamos el archivo
    setErroresArchivos((prev) => ({ ...prev, [tipo]: '' }));
    setArchivos((prev) => ({ ...prev, [tipo]: file }));
  };

  const handleChange = (e) => {
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
    if(!formData.anioEgreso) nuevosErrores.anioEgreso = 'El año de egreso es obligatorio';

    if(Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
    } else {
      setErrores({});
      setPaso(3);
    }
  };

  const validatePaso3 = () => {
    const nuevosErrores = {};
    if (!archivos.titulo) nuevosErrores.titulo = 'La copia del título universitario es obligatoria';
    if (!archivos.dni) nuevosErrores.dni = 'La copia de DNI es obligatoria';

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresArchivos(nuevosErrores);
    } else {
      setErroresArchivos({});
      setPaso(4);
    }
  };
  
 const handleConfirm = async () => {
    try {
      // 1. Crear el legajo en el backend con los datos del aspirante
      const legajo = await inscripcionService.crearPreinscripcion(formData);
      const legajoId = legajo?.id || legajo?.legajo_id;
      console.log('Legajo creado exitosamente. ID:', legajoId);
      // 2. Subir los archivos PDF adjuntos asociados a este legajo
      const documentosAEnviar = [
        { archivo: archivos.titulo, tipo: 'TITULO_GRADO' },
        { archivo: archivos.dni, tipo: 'DNI' },
        { archivo: archivos.analitico, tipo: 'ANALITICO' },
        { archivo: archivos.cv, tipo: 'CV' },
      ];
      for (const doc of documentosAEnviar) {
        if (doc.archivo) {
          await inscripcionService.subirDocumento(legajoId, doc.tipo, doc.archivo);
          console.log(`Documento subido: ${doc.tipo}`);
        }
      }
      alert('¡Preinscripción y documentación enviadas con éxito!');
    } catch (error) {
      console.error('Error en el proceso de inscripción:', error);
      alert(`Error al procesar: ${error.message}`);
    }
  };
  

  return (
    <div>
      <header className="utn-header">
        <h1>UTN</h1><h2>Sistema de Posgrado - Preinscripción</h2>
      </header>
      <div className="preinscripcion-container">
        <div className="steps">
          <span className={`step ${paso === 1 ? 'active' : (paso > 1 ? 'completed' : '')}`}><span className="circle">{paso > 1 ? '✓' : '1'}</span> Datos Personales</span>
          <span className={`step ${paso === 2 ? 'active' : (paso > 2 ? 'completed' : '')}`}>— <span className="circle">{paso > 2 ? '✓' : '2'}</span> Datos Academicos</span>
          <span className={`step ${paso === 3 ? 'active' : (paso > 3 ? 'completed' : '')}`}>— <span className="circle">{paso > 3 ? '✓' : '3'}</span> Documentación</span>
          <span className={`step ${paso === 4 ? 'active' : ''}`}>— <span className="circle">4</span> Resumen</span>
        </div>
        
        {paso === 1 && (
          <Paso1DatosPersonales
            formData={formData}
            handleChange={handleChange}
            errores={errores}
            onNext={validatePaso1}
          />
        )}
        
        {paso === 2 && (
          <Paso2DatosAcademicos
            formData={formData}
            handleChange={handleChange}
            errores={errores}
            onPrev={() => setPaso(1)}
            onNext={validatePaso2}
          />
        )}
        
        {paso === 3 && (
          <Paso3Documentacion
            archivos={archivos}
            erroresArchivos={erroresArchivos}
            onFileChange={handleFileChange}
            onPrev={() => setPaso(2)}
            onNext={validatePaso3}
          />
        )}
        
        {paso === 4 && (
          <Paso4Resumen
            formData={formData}
            archivos={archivos}
            onPrev={() => setPaso(3)}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}
