import React from 'react';

/**
 * Datos para dibujar la gráfica.
 * Mantiene la información del gráfico separada del código del diseño.
 */
const METRICAS_BARRAS = [
  { id: 1, posgrado: 'Maestría en Ciencia de Datos', inscriptos: 120, maximo: 150, color: '#4a90e2' },
  { id: 2, posgrado: 'Especialización en Software', inscriptos: 85, maximo: 150, color: '#50e3c2' },
  { id: 3, posgrado: 'Doctorado en Informática', inscriptos: 45, maximo: 150, color: '#f5a623' },
  { id: 4, posgrado: 'Maestría en Inteligencia Artificial', inscriptos: 140, maximo: 150, color: '#bd10e0' },
];

export const VistaEstadisticas = () => {
  return (
    <div className="panel-container">
      <header className="panel-header">
        <h2>Métricas y Estadísticas Generales</h2>
      </header>
      <section className="metrics-grid" aria-label="Indicadores clave de rendimiento">
        <article className="metric-card">
          <span className="metric-title">Total Inscriptos</span>
          <span className="metric-value">390</span>
        </article>

        <article className="metric-card">
          <span className="metric-title">Tasa de Retención</span>
          <span className="metric-value">92%</span>
        </article>

        <article className="metric-card">
          <span className="metric-title">Aprobaciones Directas</span>
          <span className="metric-value">78%</span>
        </article>

        <article className="metric-card">
          <span className="metric-title">Cohortes Activas</span>
          <span className="metric-value">12</span>
        </article>
      </section>

      <section className="chart-section">
        <h3>Demanda por Programa Académico</h3>

        <div className="bar-chart-container" role="region" aria-label="Gráfico de barras de inscriptos">
          {METRICAS_BARRAS.map((item) => {
            // Cálculo del porcentaje dinámico
            const porcentaje = Math.min(
              100, 
              Math.max(0, Math.round((item.inscriptos / item.maximo) * 100))
            );

            return (
              <div key={item.id} className="bar-row">
                <div className="bar-label" title={item.posgrado}>
                  {item.posgrado}
                </div>

                {/* Track o carril contenedor del porcentaje */}
                <div 
                  className="bar-track" 
                  role="progressbar" 
                  aria-valuenow={item.inscriptos} 
                  aria-valuemin={0} 
                  aria-valuemax={item.maximo}
                  aria-label={`Inscriptos en ${item.posgrado}`}
                >
                  {/* Estilo inline reactivo basado en el porcentaje calculado */}
                  <div
                    className="bar-fill"
                    style={{
                      width: `${porcentaje}%`,
                      backgroundColor: item.color,
                    }}
                  >
                    {/* Renderizado condicional del texto para evitar desbordes visuales */}
                    <span className="bar-value">
                      {item.inscriptos} {porcentaje >= 15 ? `(${porcentaje}%)` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};