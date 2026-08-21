import React, { useState } from 'react';
import './App.css';

// --- VISTA DE LOGIN ---
function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'utn2026') {
      onLogin(); 
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>UTN FRLP</h1>
        <h2>Sistema de Posgrado</h2>
        <form onSubmit={handleSubmit}>
          {error && <p style={{color: '#dc3545', fontWeight: 'bold', marginBottom: '15px'}}>{error}</p>}
          <input type="text" placeholder="Usuario / Legajo" className="form-control" style={{marginBottom: '15px'}} value={user} onChange={(e) => {setUser(e.target.value); setError('');}} />
          <input type="password" placeholder="Contraseña" className="form-control" style={{marginBottom: '25px'}} value={pass} onChange={(e) => {setPass(e.target.value); setError('');}} />
          <button type="submit" className="btn-primary">Iniciar Sesión</button>
        </form>
        <p style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
          ¿Olvidó su contraseña? Contacte a soporte de Conducción.
        </p>
      </div>
    </div>
  );
}

// --- VISTA 1: PREINSCRIPCION ---
function Preinscripcion() {
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState({
    nombre: 'Lucas', apellido: 'Martinez', nacionalidad: 'Argentina', dni: '38123456', email: 'lmartinez@gmail.com', 
    titulo: 'Ingeniería en Sistemas de Información', universidad: 'UTN FRLP', anioEgreso: '2024', posgrado: 'Maestría en Ingeniería'
  });

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const renderPaso = () => {
    switch(paso) {
      case 1:
        return (
          <>
            <div className="form-grid">
              <div className="form-group"><label>Apellido</label><input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="form-control" /></div>
              <div className="form-group"><label>Nombre</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-control" /></div>
              <div className="form-group"><label>Nacionalidad</label><input type="text" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="form-control" /></div>
              <div className="form-group"><label>DNI/Pasaporte</label><input type="text" name="dni" value={formData.dni} onChange={handleChange} className="form-control" /></div>
              <div className="form-group full-width"><label>Correo Electrónico</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" /></div>
              <div className="form-group full-width"><label>Domicilio</label><input type="text" className="form-control" /></div>
            </div>
            <button className="btn-primary" style={{marginTop: '20px'}} onClick={() => setPaso(2)}>Continuar a Datos Académicos</button>
          </>
        );
      case 2:
        return (
          <>
            <div className="form-grid">
              <div className="form-group"><label>Título de Grado</label><input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="form-control" /></div>
              <div className="form-group"><label>Universidad de Origen</label><input type="text" name="universidad" value={formData.universidad} onChange={handleChange} className="form-control" /></div>
              <div className="form-group"><label>Año de Egreso</label><input type="number" name="anioEgreso" value={formData.anioEgreso} onChange={handleChange} className="form-control" /></div>
              <div className="form-group">
                <label>Carrera a la que se postula</label>
                <select name="posgrado" value={formData.posgrado} onChange={handleChange} className="form-control" style={{background: 'white'}}>
                  <option>Maestría en Ingeniería</option>
                  <option>Especialización en Sistemas</option>
                  <option>Doctorado</option>
                </select>
              </div>
            </div>
            <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
              <button className="btn-secondary" style={{flex: 1}} onClick={() => setPaso(1)}>Volver</button>
              <button className="btn-primary" style={{flex: 2}} onClick={() => setPaso(3)}>Continuar a Documentación</button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div style={{background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #ffc107'}}>
               <strong>Atención:</strong> Según el reglamento vigente, todos los archivos adjuntos deben estar exclusivamente en formato PDF.
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Copia de Título Universitario (.pdf)</label><input type="file" accept=".pdf" className="form-control" /></div>
              <div className="form-group"><label>Certificado Analítico (.pdf)</label><input type="file" accept=".pdf" className="form-control" /></div>
              <div className="form-group"><label>Curriculum Vitae (CV) (.pdf)</label><input type="file" accept=".pdf" className="form-control" /></div>
              <div className="form-group"><label>Copia de DNI (.pdf)</label><input type="file" accept=".pdf" className="form-control" /></div>
            </div>
            <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
              <button className="btn-secondary" style={{flex: 1}} onClick={() => setPaso(2)}>Volver</button>
              <button className="btn-primary" style={{flex: 2}} onClick={() => setPaso(4)}>Generar Resumen de Legajo</button>
            </div>
          </>
        );
      case 4:
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
                <div className="resumen-item"><span>Universidad</span><p>{formData.universidad || '-'} ({formData.anioEgreso})</p></div>
              </div>
            </div>
            <div className="resumen-box">
              <h3>3. Documentación Digital</h3>
              <p style={{color: '#28a745', margin: 0}}><strong>✔️ Archivos PDF adjuntos correctamente</strong></p>
            </div>
            <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
              <button className="btn-secondary" style={{flex: 1}} onClick={() => setPaso(3)}>Modificar Datos</button>
              <button className="btn-primary" style={{flex: 2}} onClick={() => { alert('¡Preinscripción enviada con éxito!'); setPaso(1); setFormData({nombre: '', apellido: '', nacionalidad: '', dni: '', email: '', titulo: '', universidad: '', anioEgreso: '', posgrado: 'Maestría en Ingeniería'}); }}>Confirmar y Enviar</button>
            </div>
          </>
        );
      default: return null;
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
        {renderPaso()}
      </div>
    </div>
  );
}

// --- VISTA 2: PANEL DOCENTE ---
function PanelDocente() {
  const [fechas, setFechas] = useState(['2026-05-10', '2026-05-17', '2026-05-24']);
  const alumnos = [
    { apellido: 'Altamirano', nombre: 'Florencia', correo: 'aFlorencia@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: false, a3: true, nota: '8' },
    { apellido: 'Altamirano', nombre: 'Agustin', correo: 'aAgustin@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: true, a3: true, nota: '9' },
    { apellido: 'Garcia', nombre: 'Cesar', correo: 'gCesar@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: true, a3: false, nota: '7' },
    { apellido: 'Suarez', nombre: 'Valentin', correo: 'sValentin@ejemplo.com', titulo: 'Ingeniería', a1: false, a2: false, a3: true, nota: 'Libre' },
    { apellido: 'Pueblas', nombre: 'Tomas', correo: 'pTomas@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: true, a3: true, nota: '10' }
  ];

  const updateFecha = (index, value) => {
    const newFechas = [...fechas];
    newFechas[index] = value;
    setFechas(newFechas);
  };

  return (
    <div>
      <header className="utn-header">
        <h1>UTN</h1><h2>Panel DOCENTE</h2>
      </header>
      <div className="docente-container">
        <h2>Planilla de Carga de Asistencia y Calificaciones</h2>
        <p>Metodología de la Investigación - Cohorte 2026</p>

        <table>
          <thead>
            <tr>
              <th>Apellido</th><th>Nombre</th><th>Correo Electrónico</th><th>Título de Grado</th>
              <th className="checkbox-cell">
                Asistencia<br/>
                <input type="date" className="date-input-header" value={fechas[0]} onChange={(e) => updateFecha(0, e.target.value)} />
              </th>
              <th className="checkbox-cell">
                Asistencia<br/>
                <input type="date" className="date-input-header" value={fechas[1]} onChange={(e) => updateFecha(1, e.target.value)} />
              </th>
              <th className="checkbox-cell">
                Asistencia<br/>
                <input type="date" className="date-input-header" value={fechas[2]} onChange={(e) => updateFecha(2, e.target.value)} />
              </th>
              <th className="checkbox-cell">Calificación Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a, i) => (
              <tr key={i}>
                <td style={{height: '40px'}}>{a.apellido}</td><td>{a.nombre}</td><td>{a.correo}</td><td>{a.titulo}</td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a1} style={{transform:'scale(1.5)'}}/></td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a2} style={{transform:'scale(1.5)'}}/></td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a3} style={{transform:'scale(1.5)'}}/></td>
                <td className="checkbox-cell">
                  {a.nota === 'Libre' ? 
                    <span className="badge badge-danger" style={{background: '#dc3545'}}>LIBRE</span> : 
                    <input type="text" defaultValue={a.nota} className="calif-input" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="docente-actions">
           <button className="btn-secondary" style={{width: 'auto'}} onClick={() => alert('Generando PDF...')}>Descargar Plantilla (PDF)</button>
           <button className="btn-primary" style={{width: 'auto'}} onClick={() => alert('Sincronizando...')}>Guardar y Sincronizar</button>
        </div>
      </div>
    </div>
  );
}

// --- VISTA 3: PERFIL ESTUDIANTE (CON BUSCADOR) ---
function PanelConduccionEstudiante() {
  const [tab, setTab] = useState('seminarios');
  const [busqueda, setBusqueda] = useState('');
  
  // Base de datos hardcodeada de estudiantes
  const bdEstudiantes = [
    {
      legajo: "12345",
      nombre: "Almiron Guadalupe",
      cohorte: "2026",
      carrera: "Maestría en Ingeniería",
      estadoColor: "green",
      estadoTexto: "VERDE",
      alerta: "Alerta: Plazo de Seminario 'Tesis I' por vencer en 15 días",
      legajoPorcentaje: "100%",
      seminarios: [
        { sem: "1° Sem", nombre: "Estadistica Avanzada", asis: "92% (Min 80%)", nota: "9 (Nueve)", acta: "ACTA-2026-A", fecha: "29/5/2026" },
        { sem: "1° Sem", nombre: "Fisica Avanzada", asis: "86% (Min 80%)", nota: "7 (Nueve)", acta: "ACTA-2026-B", fecha: "22/5/2026" },
        { sem: "2° Sem", nombre: "Seminario de Tesis I", asis: "75% (PENDIENTE)", nota: "En Cursada", acta: "---------------", fecha: "---------" }
      ],
      tesis: {
        tema: "Optimización de algoritmos en GIS",
        resolucion: "RES-CPR-2026-45",
        director: "Dr. Roberto Sanchez",
        codirector: "Ing. Maria Lopez",
        estado: "En proceso de investigación (Aprobación pendiente de lectura final)."
      }
    },
    {
      legajo: "54321",
      nombre: "Garcia Cesar",
      cohorte: "2024",
      carrera: "Maestría en Ingeniería",
      estadoColor: "green",
      estadoTexto: "VERDE",
      alerta: "Sin alertas pendientes.",
      legajoPorcentaje: "100%",
      seminarios: [
        { sem: "1° Sem", nombre: "Sistemas Operativos Avanzados", asis: "100%", nota: "10 (Diez)", acta: "ACTA-2024-X", fecha: "10/12/2024" }
      ],
      tesis: {
        tema: "Implementación de microservicios",
        resolucion: "RES-CPR-2024-88",
        director: "Dra. Laura Campos",
        codirector: "-",
        estado: "Defendida y Aprobada."
      }
    },
    {
      legajo: "11111",
      nombre: "Altamirano Florencia",
      cohorte: "2026",
      carrera: "Especialización en Sistemas",
      estadoColor: "yellow",
      estadoTexto: "REGULAR",
      alerta: "Alerta: Falta entregar documentación de título previo.",
      legajoPorcentaje: "80%",
      seminarios: [
        { sem: "1° Sem", nombre: "Bases de Datos Distribuidas", asis: "80%", nota: "8 (Ocho)", acta: "ACTA-2026-F", fecha: "01/06/2026" }
      ],
      tesis: {
        tema: "Migración a NoSQL",
        resolucion: "RES-CPR-2026-12",
        director: "Ing. Martin Gomez",
        codirector: "-",
        estado: "Aprobada."
      }
    }
  ];

  const [estudianteActual, setEstudianteActual] = useState(bdEstudiantes[0]);

  const handleSearch = () => {
    const encontrado = bdEstudiantes.find(e => e.legajo === busqueda);
    if (encontrado) {
      setEstudianteActual(encontrado);
      setTab('seminarios');
    } else {
      alert(`No se encontró ningún estudiante con el legajo: ${busqueda}`);
    }
  };

  return (
    <div>
      {/* Buscador */}
      <div style={{marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', background: '#e9ecef', padding: '15px', borderRadius: '8px'}}>
         <label style={{fontWeight: 'bold'}}>Buscar Estudiante:</label>
         <input 
            type="text" 
            placeholder="Ingrese N° de Legajo..." 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
            className="form-control" 
            style={{maxWidth: '300px', background: 'white'}} 
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
         />
         <button className="btn-primary" style={{width: 'auto'}} onClick={handleSearch}>🔍 Buscar</button>
      </div>

      <div className="profile-header">
        <div className="profile-info">
          <div className="avatar">👤</div>
          <div>
            <h3 style={{fontSize: '1.5rem', marginBottom: '5px'}}>{estudianteActual.nombre}</h3>
            <p style={{color: '#666', margin: '5px 0'}}>Legajo {estudianteActual.legajo} &nbsp;&nbsp; Cohorte {estudianteActual.cohorte}</p>
            <p style={{color: '#666'}}>{estudianteActual.carrera}</p>
          </div>
        </div>
        <div className="status-indicators">
          <div>
            <p><strong>TIPOS DE ESTADO</strong></p>
            <p style={{fontSize: '0.7rem', color: '#666', marginTop: '2px'}}>En Plazo Limite</p>
            <div style={{display: 'flex', gap: '15px', marginTop: '5px', justifyContent: 'center'}}>
              <div><div className="circle-status green"></div><span style={{fontSize: '11px'}}>Vigente</span></div>
              <div><div className="circle-status yellow"></div></div>
              <div><div className="circle-status red"></div><span style={{fontSize: '11px'}}>Excedido</span></div>
            </div>
          </div>
          <div style={{background: '#e0e0e0', padding: '15px 30px', borderRadius: '5px', textAlign: 'center'}}>
            <p><strong>ESTADO DE AVANCE</strong></p>
            <div className={`circle-status ${estudianteActual.estadoColor}`} style={{margin: '10px auto', width: '40px', height: '40px'}}></div>
            <strong style={{color: estudianteActual.estadoColor === 'green' ? '#28a745' : '#ffc107', fontSize: '1.2rem'}}>{estudianteActual.estadoTexto}</strong><br/>
          </div>
        </div>
      </div>
      
      <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
        <div style={{flex: 2, background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc'}}>
          <h3 style={{marginBottom: '10px', fontSize: '1.2rem'}}>Alertas Académicas</h3>
          {estudianteActual.alerta.includes("Sin alertas") ? (
             <div className="alerta-box" style={{background: '#28a745'}}>{estudianteActual.alerta}</div>
          ) : (
             <div className="alerta-box">{estudianteActual.alerta}</div>
          )}
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold'}}>
            <span>Estado de legajo</span>
            <strong style={{color: estudianteActual.legajoPorcentaje === '100%' ? '#28a745' : '#ffc107'}}>{estudianteActual.legajoPorcentaje === '100%' ? 'COMPLETO (100%)' : `INCOMPLETO (${estudianteActual.legajoPorcentaje})`}</strong>
          </div>
          <div style={{height: '15px', background: '#ccc', borderRadius: '10px', width: '100%'}}>
             <div style={{height: '15px', background: estudianteActual.legajoPorcentaje === '100%' ? '#28a745' : '#ffc107', borderRadius: '10px', width: estudianteActual.legajoPorcentaje}}></div>
          </div>
        </div>
      </div>
      
      <div style={{marginTop: '20px'}}>
        <div className="tabs">
          <div className={`tab ${tab === 'seminarios' ? 'active' : ''}`} onClick={() => setTab('seminarios')}>Seminarios</div>
          <div className={`tab ${tab === 'tesis' ? 'active' : ''}`} onClick={() => setTab('tesis')}>Tutorias/Tesis</div>
        </div>
        
        {tab === 'seminarios' ? (
          <table style={{background: '#f9f9f9', border: '1px solid #ccc', borderTop: 'none'}}>
            <thead style={{background: '#e0e0e0'}}>
              <tr><th>Semestre</th><th>Seminario</th><th>% Asistencia</th><th>Calif. Final</th><th>Acta Examen</th><th>Fecha Acta</th></tr>
            </thead>
            <tbody>
              {estudianteActual.seminarios.map((sem, idx) => (
                <tr key={idx}>
                  <td>{sem.sem}</td><td>{sem.nombre}</td><td>{sem.asis}</td><td>{sem.nota}</td><td>{sem.acta}</td><td>{sem.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ background: 'white', padding: '30px', border: '1px solid #ccc', borderTop: 'none' }}>
            <h3 style={{marginBottom: '20px', color: '#00539C'}}>Avance de Tesis / Trabajo Final</h3>
            <div className="form-grid">
              <div className="form-group"><label>Tema Registrado</label><input type="text" className="form-control" defaultValue={estudianteActual.tesis.tema} readOnly /></div>
              <div className="form-group"><label>Resolución CPR</label><input type="text" className="form-control" defaultValue={estudianteActual.tesis.resolucion} readOnly /></div>
              <div className="form-group"><label>Director</label><input type="text" className="form-control" defaultValue={estudianteActual.tesis.director} readOnly /></div>
              <div className="form-group"><label>Co-Director</label><input type="text" className="form-control" defaultValue={estudianteActual.tesis.codirector} readOnly /></div>
            </div>
            <div style={{background: '#fff3cd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ffc107', marginTop: '20px'}}>
              <strong>Estado actual:</strong> {estudianteActual.tesis.estado}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- VISTA 4: DASHBOARD INSCRIPCIONES ---
function PanelConduccionInscripciones() {
  const handleAction = (action, nombre) => {
    if (action === 'doc') alert(`Abriendo legajo de ${nombre}...`);
    if (action === 'edit') alert(`Editando a ${nombre}.`);
    if (action === 'approve') alert(`Legajo de ${nombre} aprobado exitosamente.`);
    if (action === 'mail') alert(`Redactando correo a ${nombre}...`);
  };

  return (
    <div>
      <h3 style={{margin: '0 0 20px 0', fontSize: '1.5rem'}}>Gestión de Inscripciones</h3>
      
      <div className="dashboard-stats">
        <div className="stat-card" style={{borderBottom: '4px solid #ccc'}}>
          <h3>Aspirantes activos</h3>
          <div className="value">210</div>
        </div>
        <div className="stat-card" style={{borderBottom: '4px solid #ccc'}}>
          <h3>Legajos Completos</h3>
          <div className="value">85%</div>
        </div>
        <div className="stat-card" style={{borderBottom: '4px solid #ccc'}}>
          <h3>Aspirantes Pendientes</h3>
          <div className="value">32</div>
        </div>
        <div className="stat-card" style={{borderBottom: '4px solid #ccc'}}>
          <h3>Nuevas inscripciones<br/><span style={{fontSize: '0.8rem', fontWeight: 'normal'}}>(ultimos 7 dias)</span></h3>
          <div className="value">18</div>
        </div>
      </div>
      
      <div className="filters-bar">
        <div className="form-group" style={{minWidth: '200px'}}>
          <label>Cohorte</label>
          <select className="form-control" style={{background: 'white'}}><option>2024, 2025, TODAS</option></select>
        </div>
        <div className="form-group" style={{minWidth: '200px'}}>
          <label>Estado de legajo</label>
          <select className="form-control" style={{background: 'white'}}><option>Completo</option></select>
        </div>
        <div className="form-group" style={{flex: 1}}>
          <label>Nombre del Aspirante / DNI</label>
          <input type="text" className="form-control" placeholder="🔍 Buscar..." style={{background: 'white'}}/>
        </div>
      </div>
      
      <div style={{background: '#888', borderRadius: '8px 8px 0 0', overflow: 'hidden'}}>
        <table>
          <thead>
            <tr style={{color: 'white', background: '#ccc'}}>
              <th>Aspirante</th>
              <th>Carrera Elegida</th>
              <th>Cohorte</th>
              <th>Estado de Legajo</th>
              <th>Fecha de Solicitud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody style={{background: '#e0e0e0', color: '#333'}}>
            {[
              { n: 'ALTAMIRANO, Florencia', c: 'Maestria en Ing.', y: '2026', e: 'COMPLETO', d: '29/5/2026' },
              { n: 'ALTAMIRANO, Agustin', c: 'Maestria en Ing.', y: '2026', e: 'COMPLETO', d: '22/5/2026' },
              { n: 'GARCIA, Cesar', c: 'Maestria en Ing.', y: '2024', e: 'COMPLETO', d: '22/5/2026' },
              { n: 'SUAREZ, Valentin', c: 'Maestria en Ing.', y: '2026', e: 'COMPLETO', d: '21/5/2026' }
            ].map((a, i) => (
              <tr key={i} style={{borderBottom: '1px solid #ccc', background: '#f9f9f9'}}>
                <td>{a.n}</td><td>{a.c}</td><td>{a.y}</td><td><span className="badge completo">{a.e}</span></td><td>{a.d}</td>
                <td>
                  <span className="action-icon" onClick={() => handleAction('doc', a.n)}>📄</span>
                  <span className="action-icon" onClick={() => handleAction('edit', a.n)}>📝</span>
                  <span className="action-icon" onClick={() => handleAction('approve', a.n)}>✔️</span>
                  <span className="action-icon" onClick={() => handleAction('mail', a.n)}>✉️</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- VISTA 5: AUDITORIA CPR (Tesis / TFI) ---
function VistaTesis() {
  return (
    <div>
      <h3 style={{margin: '0 0 20px 0', fontSize: '1.5rem'}}>Auditoría CPR - Tesis y TFI</h3>
      <div style={{background: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        <span>ℹ️</span> <em>Registro protegido por la Comisión de Posgrado Regional (CPR). Modificaciones restringidas.</em>
      </div>
      <table style={{background: 'white', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden'}}>
        <thead style={{background: '#00539C', color: 'white'}}>
          <tr><th>Estudiante</th><th>Cohorte</th><th>Resolución CPR</th><th>Director Asignado</th><th>Estado Tesis</th></tr>
        </thead>
        <tbody>
          <tr><td>Almiron Guadalupe</td><td>2026</td><td>RES-CPR-2026-45</td><td>Dr. Roberto Sanchez</td><td><span className="badge badge-warning">En Progreso</span></td></tr>
          <tr><td>Altamirano Florencia</td><td>2026</td><td>RES-CPR-2026-12</td><td>Ing. Martin Gomez</td><td><span className="badge completo">Aprobada</span></td></tr>
          <tr><td>Garcia Cesar</td><td>2024</td><td>RES-CPR-2024-88</td><td>Dra. Laura Campos</td><td><span className="badge completo">Defendida</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}

// --- VISTA 6: ESTADÍSTICAS (CON GRÁFICO INTERACTIVO) ---
function VistaEstadisticas() {
  const [cohorte, setCohorte] = useState('2026');
  
  const metricas = {
    '2026': { retencion: '92%', tesis: 12, desgranamiento: '8%', libres: 4, label: 'Cohorte Actual' },
    '2025': { retencion: '85%', tesis: 38, desgranamiento: '15%', libres: 12, label: 'Cohorte Anterior' },
    '2024': { retencion: '78%', tesis: 54, desgranamiento: '22%', libres: 19, label: 'Cohorte Histórica' }
  };
  const current = metricas[cohorte];

  // Datos para el grafico
  const chartData = [
    { label: '2024', inscritos: 140, tesis: 54 },
    { label: '2025', inscritos: 180, tesis: 38 },
    { label: '2026', inscritos: 210, tesis: 12 }
  ];

  const maxVal = 250;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h3 style={{fontSize: '1.5rem', margin: 0}}>Métricas y Reportes Académicos</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <label style={{fontWeight: 'bold'}}>Filtrar Datos por Cohorte:</label>
          <select className="form-control" style={{width: '150px', background: 'white'}} value={cohorte} onChange={(e) => setCohorte(e.target.value)}>
            <option value="2026">2026 (Actual)</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>
      
      <div style={{background: '#cce0ff', color: '#004080', padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold'}}>
        Viendo estadísticas de: {current.label}
      </div>

      <div className="dashboard-stats">
        <div className="stat-card" style={{borderBottom: '4px solid #00539C', background: 'white'}}>
          <h3 style={{color: '#666'}}>Tasa de Retención</h3>
          <div className="value" style={{color: '#00539C'}}>{current.retencion}</div>
        </div>
        <div className="stat-card" style={{borderBottom: '4px solid #28a745', background: 'white'}}>
          <h3 style={{color: '#666'}}>Tesis Aprobadas</h3>
          <div className="value" style={{color: '#28a745'}}>{current.tesis}</div>
        </div>
        <div className="stat-card" style={{borderBottom: '4px solid #ffc107', background: 'white'}}>
          <h3 style={{color: '#666'}}>Desgranamiento / Deserción</h3>
          <div className="value" style={{color: '#ffc107'}}>{current.desgranamiento}</div>
        </div>
        <div className="stat-card" style={{borderBottom: '4px solid #dc3545', background: 'white'}}>
          <h3 style={{color: '#666'}}>Alumnos Libres</h3>
          <div className="value" style={{color: '#dc3545'}}>{current.libres}</div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h3 style={{marginBottom: '10px'}}>Inscritos vs Tesis Aprobadas (Evolución)</h3>
        
        {/* GRAFICO CSS CUSTOM */}
        <div className="chart-container">
          {chartData.map((d) => (
            <div className="chart-column" key={d.label}>
              <div className="chart-label">{d.label}</div>
              <div className="chart-bar" style={{height: `${(d.inscritos / maxVal) * 100}%`}}>
                <span className="chart-bar-value">{d.inscritos}</span>
              </div>
              <div className="chart-bar secondary" style={{height: `${(d.tesis / maxVal) * 100}%`}}>
                <span className="chart-bar-value">{d.tesis}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item"><div className="legend-color" style={{background: '#00539C'}}></div> Inscritos</div>
          <div className="legend-item"><div className="legend-color" style={{background: '#28a745'}}></div> Tesis Aprobadas</div>
        </div>

      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <h3 style={{marginBottom: '15px'}}>Acciones de Exportación</h3>
        <p style={{color: '#666', marginBottom: '15px'}}>Descargue los reportes consolidados de la cohorte {cohorte} para auditoría institucional.</p>
        <button className="btn-primary" style={{width: '100%', marginBottom: '10px'}} onClick={() => alert(`Generando Reporte Académico ${cohorte} en PDF...`)}>📄 Descargar Reporte General (PDF)</button>
        <button className="btn-secondary" style={{width: '100%', background: '#28a745', color: 'white'}} onClick={() => alert(`Generando planilla Excel ${cohorte}...`)}>📊 Exportar Dataset a Excel</button>
      </div>
    </div>
  );
}

// --- CONTENEDOR PRINCIPAL ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [vista, setVista] = useState('inscripciones');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  if (vista === 'preinscripcion') {
    return (
      <>
        <nav className="demo-nav">
          <button className="active" onClick={() => setVista('preinscripcion')}>Preinscripcion</button>
          <button onClick={() => setVista('docente')}>Docente</button>
          <button onClick={() => setVista('inscripciones')}>Equipo de Conducción</button>
          <button style={{background: '#dc3545', marginLeft: '20px'}} onClick={() => setIsLoggedIn(false)}>Cerrar Sesión</button>
        </nav>
        <Preinscripcion />
      </>
    );
  }

  if (vista === 'docente') {
    return (
      <>
        <nav className="demo-nav">
          <button onClick={() => setVista('preinscripcion')}>Preinscripcion</button>
          <button className="active" onClick={() => setVista('docente')}>Docente</button>
          <button onClick={() => setVista('inscripciones')}>Equipo de Conducción</button>
          <button style={{background: '#dc3545', marginLeft: '20px'}} onClick={() => setIsLoggedIn(false)}>Cerrar Sesión</button>
        </nav>
        <PanelDocente />
      </>
    );
  }

  // Layout de conduccion
  return (
    <>
      <nav className="demo-nav">
        <button onClick={() => setVista('preinscripcion')}>Preinscripcion</button>
        <button onClick={() => setVista('docente')}>Docente</button>
        <button className="active" onClick={() => setVista('inscripciones')}>Equipo de Conducción</button>
        <button style={{background: '#dc3545', marginLeft: '20px'}} onClick={() => setIsLoggedIn(false)}>Cerrar Sesión</button>
      </nav>
      
      <div className="conduccion-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">UTN</div>
          <ul>
            <li className={vista === 'inscripciones' ? 'active' : ''} onClick={() => setVista('inscripciones')}><span className="sidebar-icon">📋</span> Inscripciones</li>
            <li className={vista === 'estudiante' ? 'active' : ''} onClick={() => setVista('estudiante')}><span className="sidebar-icon">👥</span> Estudiantes</li>
            <li className={vista === 'tesis' ? 'active' : ''} onClick={() => setVista('tesis')}><span className="sidebar-icon">📄</span> Tesis/TFI</li>
            <li className={vista === 'estadisticas' ? 'active' : ''} onClick={() => setVista('estadisticas')}><span className="sidebar-icon">📊</span> Estadisticas</li>
          </ul>
        </aside>
        <main className="main-content">
           <div className="panel-header">Panel de Equipo de conducción</div>
           {vista === 'estudiante' && <PanelConduccionEstudiante />}
           {vista === 'inscripciones' && <PanelConduccionInscripciones />}
           {vista === 'tesis' && <VistaTesis />}
           {vista === 'estadisticas' && <VistaEstadisticas />}
        </main>
      </div>
    </>
  );
}
