import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  AuthProvider,
} from './auth/AuthContext';

import SessionAlert from './auth/SessionAlert';
import PrivateRoute from './auth/PrivateRoute';

import MainLayout from './layouts/MainLayout';
import PublicHome from './pages/PublicHome';
import RegistroAspirante from './pages/RegistroAspirante';
import Dashboard from './pages/Dashboard';
import Aspirantes from './pages/Aspirantes';
import Equipos from './pages/Equipos';
import Servidores from './pages/Servidores';
import Caminantes from './pages/Caminantes';
import Mesas from './pages/Mesas';
import Presentaciones from './pages/Presentaciones';
import Habitaciones from './pages/Habitaciones';
import Minutograma from './pages/Minutograma';
import Configuracion from './pages/Configuracion';

export default function App() {
  return (
    <AuthProvider>
      <SessionAlert />

      <Routes>
        <Route
          path="/"
          element={<PublicHome />}
        />

        <Route
          path="/registro"
          element={
            <RegistroAspirante />
          }
        />

        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/aspirantes"
            element={<Aspirantes />}
          />

          <Route
            path="/equipos"
            element={<Equipos />}
          />

          <Route
            path="/servidores"
            element={<Servidores />}
          />

          <Route
            path="/caminantes"
            element={<Caminantes />}
          />

          <Route
            path="/mesas"
            element={<Mesas />}
          />

          <Route
            path="/presentaciones"
            element={<Presentaciones />}
          />

          <Route
            path="/habitaciones"
            element={<Habitaciones />}
          />

          <Route
            path="/minutograma"
            element={<Minutograma />}
          />

          <Route
            path="/configuracion"
            element={<Configuracion />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}
