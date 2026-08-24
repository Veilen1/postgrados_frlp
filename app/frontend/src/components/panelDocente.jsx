import React, { useState } from 'react';
import './panelDocente.css';

export default function PanelDocente() {
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
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a1} style={{transform:'scale(1.5)'}}/></td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a2} style={{transform:'scale(1.5)'}}/></td>
                <td className="checkbox-cell"><input type="checkbox" defaultChecked={a.a3} style={{transform:'scale(1.5)'}}/></td>
                <td className="checkbox-cell">
                  <select defaultValue={a.nota} className="form-control" style={{width: '90px', margin: '0 auto', textAlign: 'center', background: 'white'}}>
                    <option value="">-</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="Libre">Libre</option>
                  </select>
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