import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GestionarV3 from "./pages/GestionarV3";

function App() {
  // La sesión se persiste en localStorage tras el login.
  // Si existe visor_user, consideramos al usuario autenticado.
  const userStr = localStorage.getItem('visor_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!user;

  // Roles con acceso al dashboard administrativo global.
  const isAdmin = user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'subgerente';

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de autenticación */}
        <Route path="/login" element={<Login />} />

        {/*
          Ruta raíz:
          - Admin/Gerencia: Dashboard
          - Ejecutivo: Panel V3
          - Sin sesión: Login
        */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              isAdmin ? <Dashboard /> : <Navigate to="/v3" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Panel operativo principal (requiere sesión) */}
        <Route
          path="/v3"
          element={isAuthenticated ? <GestionarV3 /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
