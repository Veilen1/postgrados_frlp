import React, { useState } from 'react';
import './App.css';

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
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //  NUEVO ESTADO DE NAVEGACIÓN //
  const [vista, setVista] = useState('inscripciones');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <>
      {/* NAVBAR SUPERIOR */}
      <nav className="demo-nav">
        <button className={vista === 'preinscripcion' ? 'active' : ''} onClick={() => setVista('preinscripcion')}>Preinscripcion</button>
        <button className={vista === 'docente' ? 'active' : ''} onClick={() => setVista('docente')}>Docente</button>
        <button className={vista !== 'preinscripcion' && vista !== 'docente' ? 'active' : ''} onClick={() => setVista('inscripciones')}>Equipo de Conducción</button>
        <button style={{background: '#dc3545', marginLeft: '20px'}} onClick={() => setIsLoggedIn(false)}>Cerrar Sesión</button>
      </nav>
      
      <div style={{padding: '50px', textAlign: 'center'}}>
        {vista === 'preinscripcion' && <h2>[Componente Preinscripcion - Valen]</h2>}
        {vista === 'docente' && <h2>[Componente PanelDocente - Lucio]</h2>}
        {vista !== 'preinscripcion' && vista !== 'docente' && <h2>[Panel Conducción en progreso...]</h2>}
      </div>
    </>
  );
}