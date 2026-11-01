import React, { useState, useMemo, useEffect } from 'react';
import { legajoService } from '../services/legajoService';

export const PanelConduccionInscripciones = () => {
  // ---------------------------------------------------------------------------
  // ESTADOS (State Management)
  // ---------------------------------------------------------------------------
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroPosgrado, setFiltroPosgrado] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // ---------------------------------------------------------------------------
  // CARGA ASÍNCRONA DE DATOS (API REST)
  // Consume GET /api/v1/legajos extrayendo data.items
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let activo = true;

    async function cargarLegajos() {
      try {
        setCargando(true);
        setError(null);
        const data = await legajoService.obtenerLegajos({ pageSize: 100 });
        if (activo) {
          // Contrato de FastAPI: la lista de legajos viene dentro de data.items
          setInscripciones(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (activo) {
          setError(err.message || 'Error al conectar con el servicio de legajos.');
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarLegajos();

    return () => {
      activo = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // FILTRADO INTELIGENTE
  // ---------------------------------------------------------------------------
  const inscripcionesFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return inscripciones.filter((item) => {
      const nombreCompleto = `${item.nombre || ''} ${item.apellido || ''}`.trim().toLowerCase();
      const legajoTexto = (item.numero_legajo || '').toLowerCase();

      const coincideTexto =
        query === '' ||
        nombreCompleto.includes(query) ||
        legajoTexto.includes(query);

      const posgradoNombre = item.cohorte?.carrera || item.cohorte?.nombre || item.posgrado || '';
      const coincidePosgrado = filtroPosgrado === 'Todos' || posgradoNombre === filtroPosgrado;

      const coincideEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;

      return coincideTexto && coincidePosgrado && coincideEstado;
    });
  }, [inscripciones, busqueda, filtroPosgrado, filtroEstado]);

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
                <tr key={row.id}>
                  <td className="font-mono">{row.numero_legajo || 'Sin asignar'}</td>
                  <td className="font-semibold">{`${row.nombre || ''} ${row.apellido || ''}`.trim() || 'Sin nombre'}</td>
                  <td>{row.cohorte?.carrera || row.cohorte?.nombre || '-'}</td>
                  <td>{row.cohorte?.nombre || row.cohorte?.anio || '-'}</td>
                  <td>{row.fecha_inscripcion ? new Date(row.fecha_inscripcion).toLocaleDateString('es-AR') : '-'}</td>
                  <td>
                    <span className={`badge badge-${(row.estado || '').toLowerCase()}`}>
                      {row.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center empty-state">
                  No se encontraron inscripciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};