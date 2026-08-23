import React from 'react';
import './App.css';

function PanelDocente() {
  const alumnos = [
    { apellido: 'Altamirano', nombre: 'Florencia', correo: 'aFlorencia@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: false, a3: true, nota: '8' },
    { apellido: 'Altamirano', nombre: 'Agustin', correo: 'aAgustin@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: true, a3: true, nota: '9' },
    { apellido: 'Garcia', nombre: 'Cesar', correo: 'gCesar@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: true, a3: false, nota: '7' },
    { apellido: 'Suarez', nombre: 'Valentin', correo: 'sValentin@ejemplo.com', titulo: 'Ingeniería', a1: false, a2: false, a3: true, nota: 'Libre' },
    { apellido: 'Pueblas', nombre: 'Tomas', correo: 'pTomas@ejemplo.com', titulo: 'Ingeniería', a1: true, a2: true, a3: true, nota: '10' }
  ];

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
              <th>Asistencia Clase 1</th>
              <th>Asistencia Clase 2</th>
              <th>Asistencia Clase 3</th>
              <th>Calificación Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a, i) => (
              <tr key={i}>
                <td>{a.apellido}</td>
                <td>{a.nombre}</td>
                <td>{a.correo}</td>
                <td>{a.titulo}</td>
                <td><input type="checkbox" defaultChecked={a.a1} /></td>
                <td><input type="checkbox" defaultChecked={a.a2} /></td>
                <td><input type="checkbox" defaultChecked={a.a3} /></td>
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