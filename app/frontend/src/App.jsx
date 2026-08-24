import React, { useState } from 'react';
import './App.css';
import Preinscripcion from './components/preinscripcion';

function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin') {
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [vista, setVista] = useState('inscripciones');
  const [legajoBuscado, setLegajoBuscado] = useState(null);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const handleIrAEstudiante = (legajo) => {
    setLegajoBuscado(legajo);
    setVista('estudiante');
  };

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
        <div style={{padding: '30px', textAlign: 'center'}}>
          <h2>[Aquí va el Componente PanelDocente de Lucio]</h2>
        </div>
      </>
    );
  }

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
            <li className={vista === 'posgrados' ? 'active' : ''} onClick={() => setVista('posgrados')}><span className="sidebar-icon">🎓</span> Posgrados</li>
            <li className={vista === 'estadisticas' ? 'active' : ''} onClick={() => setVista('estadisticas')}><span className="sidebar-icon">📊</span> Estadisticas</li>
          </ul>
        </aside>

        <main className="main-content">
           <div className="panel-header">Panel de Equipo de conducción</div>
           <div style={{background: 'white', padding: '30px', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center'}}>
             {vista === 'estudiante' && <h3>[Componente PanelConduccionEstudiante - Luciano]</h3>}
             {vista === 'inscripciones' && <h3>[Componente PanelConduccionInscripciones - Araceli]</h3>}
             {vista === 'posgrados' && <h3>[Componente VistaPosgrados - Lautaro]</h3>}
             {vista === 'estadisticas' && <h3>[Componente VistaEstadisticas - Araceli]</h3>}
           </div>
        </main>
      </div>
    </>
  );
}