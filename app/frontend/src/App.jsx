import React, { useState } from 'react';

export default function VistaPosgrados() {
  const [programas, setProgramas] = useState([
    {
      id: 1, nombre: 'Especialización en Sistemas', desc: 'Profundización en desarrollo y arquitecturas de software.',
      cohortes: [
        { id: 'es-2024', nombre: 'Cohorte 2024 - Especialización', abierta: true },
        { id: 'es-2025', nombre: 'Cohorte 2025 - Especialización', abierta: true }
      ]
    },
    {
      id: 2, nombre: 'Maestría en Ingeniería', desc: 'Formación avanzada en investigación y gestión tecnológica.',
      cohortes: [
        { id: 'm-2024', nombre: 'Cohorte 2024 - Maestría', abierta: true },
        { id: 'm-2025', nombre: 'Cohorte 2025 - Maestría', abierta: true }
      ]
    }
  ]);

  const [nuevoProg, setNuevoProg] = useState({ nombre: '', desc: '' });
  const [errorProg, setErrorProg] = useState('');

  const handleAgregarPrograma = () => {
    if(!nuevoProg.nombre) {
      setErrorProg('El nombre del programa es obligatorio');
      return;
    }
    setProgramas([...programas, { id: Date.now(), nombre: nuevoProg.nombre, desc: nuevoProg.desc, cohortes: [] }]);
    setNuevoProg({nombre: '', desc: ''});
    setErrorProg('');
  };

  return (
    <div style={{maxWidth: '1000px'}}>
      <h3 style={{margin: '0 0 20px 0', fontSize: '1.5rem'}}>Gestión de Posgrados y Cohortes</h3>
      
      <div style={{background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '30px'}}>
        <p style={{fontWeight: 'bold', marginBottom: '10px'}}>Agregar Posgrado</p>
        <div style={{display: 'flex', gap: '15px'}}>
          <div style={{flex: 1}}>
            <input type="text" placeholder="Nombre" className={`form-control ${errorProg ? 'error' : ''}`} value={nuevoProg.nombre} onChange={e => {setNuevoProg({...nuevoProg, nombre: e.target.value}); setErrorProg('');}}/>
            {errorProg && <div className="error-text">{errorProg}</div>}
          </div>
          <input type="text" placeholder="Descripción" className="form-control" style={{flex: 2}} value={nuevoProg.desc} onChange={e => setNuevoProg({...nuevoProg, desc: e.target.value})}/>
          <button className="btn-primary" style={{width: 'auto', height: 'fit-content'}} onClick={handleAgregarPrograma}>AGREGAR PROGRAMA</button>
        </div>
      </div>

      {programas.map((prog) => (
        <div key={prog.id} className="posgrado-card">
           <div className="posgrado-header">
             <div>
               <h3>{prog.nombre}</h3>
               <p style={{color: '#666', fontSize: '14px', marginTop: '5px'}}>{prog.desc}</p>
             </div>
           </div>
        </div>
      ))}
    </div>
  );
}
