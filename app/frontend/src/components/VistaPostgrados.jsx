import { useState } from 'react';

export default function VistaPostgrados() {
  const [programas, setProgramas] = useState([
    {
      id: 1, nombre: 'Especialización en Sistemas', desc: 'Profundización en desarrollo y arquitecturas de software.',
      cohortes: [
        { id: 'es-2024', nombre: 'Cohorte 2024 - Especialización', abierta: true },
        { id: 'es-2025', nombre: 'Cohorte 2025 - Especialización', abierta: true }
      ]
    },
    {
      id: 2, nombre: 'Maestría en Ingeniería', desc: 'Formación avanzada en investigación y gestión tecnológica.',
      cohortes: [
        { id: 'm-2024', nombre: 'Cohorte 2024 - Maestría', abierta: true },
        { id: 'm-2025', nombre: 'Cohorte 2025 - Maestría', abierta: true }
      ]
    }
  ]);

  const [nuevoProg, setNuevoProg] = useState({ nombre: '', desc: '' });
  const [errorProg, setErrorProg] = useState('');

  // Estados de Edicion de Programa
  const [editProgId, setEditProgId] = useState(null);
  const [editProgData, setEditProgData] = useState({ nombre: '', desc: '' });

  // Estados de Edicion de Cohorte
  const [editCohorteId, setEditCohorteId] = useState(null);
  const [editCohorteData, setEditCohorteData] = useState({ id: '', nombre: '', abierta: true });

  const [nuevasCohortes, setNuevasCohortes] = useState({});
  const [erroresCohorte, setErroresCohorte] = useState({});

  // NUEVO: Estados aislados para la confirmación en línea (Solo afecta a Lautaro)
  const [confirmDeleteProg, setConfirmDeleteProg] = useState(null);
  const [confirmDeleteCohorte, setConfirmDeleteCohorte] = useState(null);

  const handleAgregarPrograma = () => {
    if (!nuevoProg.nombre) {
      setErrorProg('El nombre del programa es obligatorio');
      return;
    }
    setProgramas([...programas, { id: Date.now(), nombre: nuevoProg.nombre, desc: nuevoProg.desc, cohortes: [] }]);
    setNuevoProg({ nombre: '', desc: '' });
    setErrorProg('');
  };

  const handleBorrarPrograma = (id) => {
    setProgramas(programas.filter((p) => p.id !== id));
    setConfirmDeleteProg(null);
  };

  const guardarEdicionProg = (id) => {
    setProgramas(programas.map((p) => (p.id === id ? { ...p, nombre: editProgData.nombre, desc: editProgData.desc } : p)));
    setEditProgId(null);
  };

  const handleAddCohorte = (progId) => {
    const nc = nuevasCohortes[progId];
    if (!nc || !nc.nombre) {
      setErroresCohorte({ ...erroresCohorte, [progId]: 'El nombre de la cohorte es obligatorio' });
      return;
    }
    setProgramas(programas.map((p) => {
      if (p.id === progId) {
        return {
          ...p,
          cohortes: [...p.cohortes, { id: nc.id || `c-${Date.now()}`, nombre: nc.nombre, abierta: nc.abierta !== false }]
        };
      }
      return p;
    }));
    setNuevasCohortes({ ...nuevasCohortes, [progId]: { id: '', nombre: '', abierta: true } });
    setErroresCohorte({ ...erroresCohorte, [progId]: '' });
  };

  const handleBorrarCohorte = (progId, cohorteId) => {
    setProgramas(programas.map((p) => {
      if (p.id === progId) {
        return { ...p, cohortes: p.cohortes.filter((c) => c.id !== cohorteId) };
      }
      return p;
    }));
    setConfirmDeleteCohorte(null);
  };

  const iniciarEdicionCohorte = (cohorte) => {
    setEditCohorteId(cohorte.id);
    setEditCohorteData({ id: cohorte.id, nombre: cohorte.nombre, abierta: cohorte.abierta });
  };

  const guardarEdicionCohorte = (progId, oldCohorteId) => {
    setProgramas(programas.map((p) => {
      if (p.id === progId) {
        return {
          ...p,
          cohortes: p.cohortes.map((c) => (c.id === oldCohorteId ? { ...c, id: editCohorteData.id, nombre: editCohorteData.nombre, abierta: editCohorteData.abierta } : c))
        };
      }
      return p;
    }));
    setEditCohorteId(null);
  };

  const toggleCohorteAbierta = (progId, cohorteId) => {
    setProgramas(programas.map((p) => {
      if (p.id === progId) {
        return {
          ...p,
          cohortes: p.cohortes.map((c) => (c.id === cohorteId ? { ...c, abierta: !c.abierta } : c))
        };
      }
      return p;
    }));
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>Gestión de Posgrados y Cohortes</h3>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '30px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Agregar Posgrado</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <input type="text" placeholder="Nombre" className={`form-control ${errorProg ? 'error' : ''}`} value={nuevoProg.nombre} onChange={(e) => { setNuevoProg({ ...nuevoProg, nombre: e.target.value }); setErrorProg(''); }} />
            {errorProg && <div className="error-text">{errorProg}</div>}
          </div>
          <input type="text" placeholder="Descripción" className="form-control" style={{ flex: 2 }} value={nuevoProg.desc} onChange={(e) => setNuevoProg({ ...nuevoProg, desc: e.target.value })} />
          <button className="btn-primary" style={{ width: 'auto', height: 'fit-content' }} onClick={handleAgregarPrograma}>AGREGAR PROGRAMA</button>
        </div>
      </div>

      {programas.map((prog) => (
        <div key={prog.id} className="posgrado-card">
          <div className="posgrado-header">
            {editProgId === prog.id ? (
              <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
                <input className="form-control" value={editProgData.nombre} onChange={(e) => setEditProgData({ ...editProgData, nombre: e.target.value })} />
                <input className="form-control" value={editProgData.desc} onChange={(e) => setEditProgData({ ...editProgData, desc: e.target.value })} />
                <button className="btn-primary" style={{ padding: '8px 15px' }} onClick={() => guardarEdicionProg(prog.id)}>Guardar</button>
                <button className="btn-secondary" style={{ padding: '8px 15px' }} onClick={() => setEditProgId(null)}>Cancelar</button>
              </div>
            ) : (
              <>
                <div>
                  <h3>{prog.nombre}</h3>
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>{prog.desc}</p>
                </div>
                <div className="posgrado-actions">
                  {confirmDeleteProg === prog.id ? (
                    <div className="confirm-delete-box">
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>¿Desea eliminarlo?</span>
                      <button className="btn-danger-sm" onClick={() => handleBorrarPrograma(prog.id)}>Aceptar</button>
                      <button className="btn-cancel-sm" onClick={() => setConfirmDeleteProg(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <span title="Editar Programa" onClick={() => { setEditProgId(prog.id); setEditProgData({ nombre: prog.nombre, desc: prog.desc }); }}>✏️ EDITAR</span>
                      <span title="Eliminar Programa" onClick={() => setConfirmDeleteProg(prog.id)}>🗑️ ELIMINAR</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <table style={{ width: '100%', marginBottom: '10px', fontSize: '14px' }}>
            <thead style={{ color: '#666' }}>
              <tr><th style={{ padding: '5px 0' }}>Cohortes</th><th>ID</th><th>Abierta</th><th style={{ textAlign: 'right' }}>Acciones</th></tr>
            </thead>
            <tbody>
              {prog.cohortes.map((c, i) => (
                editCohorteId === c.id ? (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', background: '#f0f8ff' }}>
                    <td style={{ padding: '5px 0' }}><input className="form-control" style={{ padding: '5px' }} value={editCohorteData.nombre} onChange={(e) => setEditCohorteData({ ...editCohorteData, nombre: e.target.value })} /></td>
                    <td><input className="form-control" style={{ padding: '5px', width: '100px' }} value={editCohorteData.id} onChange={(e) => setEditCohorteData({ ...editCohorteData, id: e.target.value })} /></td>
                    <td><input type="checkbox" checked={editCohorteData.abierta} onChange={(e) => setEditCohorteData({ ...editCohorteData, abierta: e.target.checked })} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: '#28a745', fontWeight: 'bold', cursor: 'pointer', marginRight: '15px' }} onClick={() => guardarEdicionCohorte(prog.id, c.id)}>GUARDAR</span>
                      <span style={{ color: '#dc3545', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setEditCohorteId(null)}>CANCELAR</span>
                    </td>
                  </tr>
                ) : (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 0' }}>{c.nombre}</td>
                    <td>{c.id}</td>
                    <td><input type="checkbox" checked={c.abierta} onChange={() => toggleCohorteAbierta(prog.id, c.id)} /></td>
                    <td style={{ textAlign: 'right' }}>
                      {confirmDeleteCohorte === c.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>¿Eliminar?</span>
                          <button className="btn-danger-sm" onClick={() => handleBorrarCohorte(prog.id, c.id)}>Aceptar</button>
                          <button className="btn-cancel-sm" onClick={() => setConfirmDeleteCohorte(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ color: '#00539C', fontWeight: 'bold', cursor: 'pointer', marginRight: '15px' }} onClick={() => iniciarEdicionCohorte(c)}>✏️ EDITAR</span>
                          <span style={{ cursor: 'pointer', color: '#666' }} onClick={() => setConfirmDeleteCohorte(c.id)}>🗑️ ELIMINAR</span>
                        </>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          <div className="add-cohorte-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input type="text" placeholder="ID (opcional)" className="form-control"
                value={nuevasCohortes[prog.id]?.id || ''}
                onChange={(e) => setNuevasCohortes({ ...nuevasCohortes, [prog.id]: { ...nuevasCohortes[prog.id], id: e.target.value } })} />
            </div>
            <div style={{ flex: 2 }}>
              <input type="text" placeholder="Nombre de la nueva cohorte" className={`form-control ${erroresCohorte[prog.id] ? 'error' : ''}`}
                value={nuevasCohortes[prog.id]?.nombre || ''}
                onChange={(e) => {
                  setNuevasCohortes({ ...nuevasCohortes, [prog.id]: { ...nuevasCohortes[prog.id], nombre: e.target.value } });
                  setErroresCohorte({ ...erroresCohorte, [prog.id]: '' });
                }} />
              {erroresCohorte[prog.id] && <div className="error-text">{erroresCohorte[prog.id]}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: '#666', marginTop: '10px' }}>
              <input type="checkbox"
                checked={nuevasCohortes[prog.id]?.abierta !== false}
                onChange={(e) => setNuevasCohortes({ ...nuevasCohortes, [prog.id]: { ...nuevasCohortes[prog.id], abierta: e.target.checked } })} /> Abierta
            </div>
            <button style={{ background: 'none', border: 'none', color: '#00539C', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
              onClick={() => handleAddCohorte(prog.id)}>
              AGREGAR COHORTE
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
