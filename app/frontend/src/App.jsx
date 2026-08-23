import React, { useState } from 'react';
import './App.css';

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
        <h1>UTN</h1>
        <h2>Panel DOCENTE</h2>
      </header>
      <div className="docente-container">
        <h2>Planilla de Carga de Asistencia y Calificaciones</h2>
        <p>Metodología de la Investigación - Cohorte 2026</p>

        <table>
          <thead>
            <tr>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>Correo Electrónico</th>
              <th>Título de Grado</th>
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
                <td style={{height: '40px'}}>{a.apellido}</td>
                <td>{a.nombre}</td>
                <td>{a.correo}</td>
                <td>{a.titulo}</td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a1} /></td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a2} /></td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a3} /></td>
                <td>{a.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  return <PanelDocente />;
}