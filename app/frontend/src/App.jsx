import React, { useState } from 'react';
import './App.css';

 
 // AUTENTICACIÓN DE LOGIN //
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

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return <div>Bienvenido al sistema!</div>;
}