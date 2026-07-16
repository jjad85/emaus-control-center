import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  AuthProvider,
} from './auth/AuthContext';

import SessionAlert from './auth/SessionAlert';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Equipos from './pages/Equipos';
import Servidores from './pages/Servidores';
import Caminantes from './pages/Caminantes';
import Mesas from './pages/Mesas';
import Presentaciones from './pages/Presentaciones';
import Habitaciones from './pages/Habitaciones';
import Configuracion from './pages/Configuracion';
import Minutograma from './pages/Minutograma';

export default function App() {
  return (
    <AuthProvider>
      <SessionAlert />

      <Routes>
        <Route
          element={<MainLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
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
            element={
              <Presentaciones />
            }
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
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}
