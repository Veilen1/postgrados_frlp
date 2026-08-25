import React, { useState, useEffect } from 'react';

export default function PanelConduccionEstudiante({ legajoInicial }) {
  const [tab, setTab] = useState('seminarios');
  const [busqueda, setBusqueda] = useState(legajoInicial || '');
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const bdEstudiantes = [
    {
      legajo: "12345", nombre: "Almiron Guadalupe", cohorte: "2026", carrera: "Maestría en Ingeniería",
      estadoColor: "green", estadoTexto: "VERDE", alerta: "Alerta: Plazo de Seminario 'Tesis I' por vencer en 15 días",
      legajoPorcentaje: "100%",
      seminarios: [
        { sem: "1° Sem", nombre: "Estadistica Avanzada", asis: "92% (Min 80%)", nota: "9 (Nueve)", acta: "ACTA-2026-A", fecha: "29/5/2026" },
        { sem: "2° Sem", nombre: "Seminario de Tesis I", asis: "75% (PENDIENTE)", nota: "En Cursada", acta: "---------------", fecha: "---------" }
      ],
      tesis: { tema: "Optimización de algoritmos en GIS", resolucion: "RES-CPR-2026-45", director: "Dr. Roberto Sanchez", codirector: "Ing. Maria Lopez", estado: "En proceso de investigación." }
    },
    {
      legajo: "54321", nombre: "Garcia Cesar", cohorte: "2024", carrera: "Maestría en Ingeniería",
      estadoColor: "green", estadoTexto: "VERDE", alerta: "Sin alertas pendientes.", legajoPorcentaje: "100%",
      seminarios: [{ sem: "1° Sem", nombre: "Sistemas Operativos", asis: "100%", nota: "10 (Diez)", acta: "ACTA-2024-X", fecha: "10/12/2024" }],
      tesis: { tema: "Microservicios", resolucion: "RES-CPR-2024-88", director: "Dra. Laura Campos", codirector: "-", estado: "Defendida y Aprobada." }
    },
    {
      legajo: "11111", nombre: "Altamirano Florencia", cohorte: "2026", carrera: "Especialización en Sistemas",
      estadoColor: "yellow", estadoTexto: "REGULAR", alerta: "Alerta: Falta entregar documentación de título previo.", legajoPorcentaje: "80%",
      seminarios: [{ sem: "1° Sem", nombre: "Bases de Datos", asis: "80%", nota: "8", acta: "ACTA-2026-F", fecha: "01/06/2026" }],
      tesis: { tema: "Migración a NoSQL", resolucion: "RES-CPR-2026-12", director: "Ing. Martin Gomez", codirector: "-", estado: "Aprobada." }
    }
  ];

  const [estudianteActual, setEstudianteActual] = useState(bdEstudiantes[0]);

  useEffect(() => {
    if (legajoInicial) {
      setBusqueda(legajoInicial);
      const enc = bdEstudiantes.find(e => e.legajo === legajoInicial);
      if (enc) {
        setEstudianteActual(enc);
        setErrorBusqueda('');
      }
    }
  }, [legajoInicial]);

  const handleSearch = () => {
    const encontrado = bdEstudiantes.find(e => e.legajo === busqueda);
    if (encontrado) {
      setEstudianteActual(encontrado);
      setTab('seminarios');
      setErrorBusqueda('');
    } else {
      setErrorBusqueda(`No se encontró el legajo: ${busqueda}`);
    }
  };

  return (
    <div>
      <div style={{marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', background: '#e9ecef', padding: '15px', borderRadius: '8px'}}>
         <label style={{fontWeight: 'bold'}}>Buscar Estudiante:</label>
         <input 
           type="text" 
           placeholder="Ingrese N° de Legajo..." 
           value={busqueda} 
           onChange={e => {setBusqueda(e.target.value); setErrorBusqueda('');}} 
           className={`form-control ${errorBusqueda ? 'error' : ''}`} 
           style={{maxWidth: '300px', background: 'white'}} 
           onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
         />
         <button className="btn-primary" style={{width: 'auto'}} onClick={handleSearch}>🔍 Buscar</button>
         {errorBusqueda && <span className="error-text" style={{marginLeft: '10px'}}>{errorBusqueda}</span>}
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
              <div><div className="circle-status green"></div><span style={{fontSize: '11px', fontWeight: 'bold'}}>Vigente</span></div>
              <div><div className="circle-status yellow"></div><span style={{fontSize: '11px', fontWeight: 'bold'}}>Regular</span></div>
              <div><div className="circle-status red"></div><span style={{fontSize: '11px', fontWeight: 'bold'}}>Excedido</span></div>
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
          <div className="alerta-box" style={{background: estudianteActual.alerta.includes("Sin alertas") ? '#28a745' : '#ff3b3b'}}>{estudianteActual.alerta}</div>
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
            <thead style={{background: '#e0e0e0'}}><tr><th>Semestre</th><th>Seminario</th><th>% Asistencia</th><th>Calif. Final</th><th>Acta</th></tr></thead>
            <tbody>
              {estudianteActual.seminarios.map((sem, idx) => (
                <tr key={idx}><td>{sem.sem}</td><td>{sem.nombre}</td><td>{sem.asis}</td><td>{sem.nota}</td><td>{sem.acta}</td></tr>
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
