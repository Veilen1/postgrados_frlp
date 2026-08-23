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
    </div>
  );
}