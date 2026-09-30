import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../features/auth/AuthProvider.jsx";
import {LoginView, RegisterView} from "../features/auth";
import MainView from "../app/App.jsx";

const AppRouter = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <BrowserRouter>
      {/** "element" define si una ruta es protegida o no
       * revisando si está autenticado redirecciona a un lado u otro.
       * Usar Link aplica la lógica implementada en la ruta correspondiente
       */}
      <Routes>
        {/** Ejemplo ruta no protegida */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterView />}
        />
          
        {/** Ejemplo ruta protegida */}
        <Route
          path="/"
          element={isAuthenticated ? <MainView /> : <Navigate to="/login" replace />}
        />
        {/** Esta ruta es para cualquiera no definida, redirige a "/" (ruta de arriba)
         * y redirecciona al la vista principal o al login de acuerdo a la autenticación
         */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;