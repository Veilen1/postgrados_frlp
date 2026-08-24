import React, { useState, useMemo } from 'react';

/**
 * Datos simulados (Mock Data) fuera del componente para evitar recargar la memoria en cada actualización.
 */
const MOCK_INSCRIPCIONES = [
  { id: 1, alumno: 'María González', legajo: 'POS-2024-01', posgrado: 'Maestría en Ciencia de Datos', cohorte: '2024-1', estado: 'Aprobada', fecha: '2024-03-15' },
  { id: 2, alumno: 'Lucas Benítez', legajo: 'POS-2024-02', posgrado: 'Especialización en Software', cohorte: '2024-1', estado: 'Pendiente', fecha: '2024-03-18' },
  { id: 3, alumno: 'Carla Ruiz', legajo: 'POS-2023-89', posgrado: 'Doctorado en Informática', cohorte: '2023-2', estado: 'Rechazada', fecha: '2024-03-10' },
  { id: 4, alumno: 'Javier Martínez', legajo: 'POS-2024-05', posgrado: 'Maestría en Ciencia de Datos', cohorte: '2024-1', estado: 'Aprobada', fecha: '2024-03-20' },
  { id: 5, alumno: 'Sofía Rossi', legajo: 'POS-2024-12', posgrado: 'Especialización en Software', cohorte: '2024-1', estado: 'Pendiente', fecha: '2024-03-21' },
];

export const PanelConduccionInscripciones = () => {
  // ---------------------------------------------------------------------------
  // ESTADOS (State Management)
  // ---------------------------------------------------------------------------
  const [busqueda, setBusqueda] = useState('');
  const [filtroPosgrado, setFiltroPosgrado] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

// ---------------------------------------------------------------------------
// FILTRADO INTELIGENTE (Para que la app vaya más rápido)
// useMemo guarda el resultado de la búsqueda y solo vuelve a buscar 
// si cambias los filtros (como el texto o las opciones seleccionadas).
// ---------------------------------------------------------------------------
  const inscripcionesFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return MOCK_INSCRIPCIONES.filter((item) => {
    // Búsqueda flexible por nombre de alumno o número de legajo (encuentra coincidencias aunque haya pequeños errores al escribir)      const coincideTexto =
        query === '' ||
        item.alumno.toLowerCase().includes(query) ||
        item.legajo.toLowerCase().includes(query);

      // Filtros categóricos por valor exacto
      const coincidePosgrado = filtroPosgrado === 'Todos' || item.posgrado === filtroPosgrado;
      const coincideEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;

      return coincideTexto && coincidePosgrado && coincideEstado;
    });
  }, [busqueda, filtroPosgrado, filtroEstado]);

  // Handler para limpiar los filtros con un solo click
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroPosgrado('Todos');
    setFiltroEstado('Todos');
  };

  return (
    <div className="panel-container">
      <header className="panel-header">
        <h2>Gestión de Inscripciones - Conducción</h2>
        <span className="badge-count">
          {inscripcionesFiltradas.length} resultados
        </span>
      </header>
      
      {/* --------------------------------------------------------------------- */}
      /* BARRA DE FILTROS CRUZADOS                                             */
      {/* --------------------------------------------------------------------- */}
      <div className="filtros-bar" role="search" aria-label="Filtros de inscripciones">
        <input
          type="text"
          className="input-search"
          placeholder="Buscar por alumno o legajo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar alumno o legajo"
        />

        <select 
          className="select-filter"
          value={filtroPosgrado} 
          onChange={(e) => setFiltroPosgrado(e.target.value)}
          aria-label="Filtrar por posgrado"
        >
          <option value="Todos">Todos los Posgrados</option>
          <option value="Maestría en Ciencia de Datos">Maestría en Ciencia de Datos</option>
          <option value="Especialización en Software">Especialización en Software</option>
          <option value="Doctorado en Informática">Doctorado en Informática</option>
        </select>

        <select 
          className="select-filter"
          value={filtroEstado} 
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Aprobada">Aprobadas</option>
          <option value="Pendiente">Pendientes</option>
          <option value="Rechazada">Rechazadas</option>
        </select>

        <button 
          type="button" 
          className="btn-reset" 
          onClick={handleLimpiarFiltros}
          disabled={!busqueda && filtroPosgrado === 'Todos' && filtroEstado === 'Todos'}
        >
          Resetear
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      /* TABLA DE RESULTADOS                                                   */
      {/* --------------------------------------------------------------------- */}
      <div className="table-responsive">
        <table className="tabla-custom">
          <thead>
            <tr>
              <th scope="col">Legajo</th>
              <th scope="col">Alumno</th>
              <th scope="col">Posgrado</th>
              <th scope="col">Cohorte</th>
              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {inscripcionesFiltradas.length > 0 ? (
              inscripcionesFiltradas.map((row) => (
                // La propiedad key es requerida por el Reconciliador de React
                <tr key={row.id}>
                  <td className="font-mono">{row.legajo}</td>
                  <td className="font-semibold">{row.alumno}</td>
                  <td>{row.posgrado}</td>
                  <td>{row.cohorte}</td>
                  <td>{row.fecha}</td>
                  <td>
                    {/* Interpolación dinámica de clases CSS según el dominio del estado */}
                    <span className={`badge badge-${row.estado.toLowerCase()}`}>
                      {row.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              /* Fallback en caso de búsquedas sin coincidencias */
              <tr>
                <td colSpan="6" className="text-center empty-state">
                  No se encontraron inscripciones que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};