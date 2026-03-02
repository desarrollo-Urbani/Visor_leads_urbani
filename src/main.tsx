// Punto de entrada del frontend.
// Aquí React monta toda la aplicación dentro del div#root de index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode ayuda a detectar malas prácticas en desarrollo.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
