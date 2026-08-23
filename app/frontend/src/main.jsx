import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PanelDocente from './components/panelDocente.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PanelDocente />
  </StrictMode>,
)