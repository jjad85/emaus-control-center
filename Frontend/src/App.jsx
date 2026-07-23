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
import ReportarPago from './pages/ReportarPago';
import Pagos from './pages/Pagos';
import Dashboard from './pages/Dashboard';
import Aspirantes from './pages/Aspirantes';
import Equipos from './pages/Equipos';
import Servidores from './pages/Servidores';
import Caminantes from './pages/Caminantes';
import Mesas from './pages/Mesas';
import Presentaciones from './pages/Presentaciones';
import Habitaciones from './pages/Habitaciones';
import Minutograma from './pages/Minutograma';
import Campanero from './pages/Campanero';
import PantallaPublica from './pages/PantallaPublica';
import Configuracion from './pages/Configuracion';
import Administracion from './pages/Administracion';
import NotificacionesWhatsApp from './pages/NotificacionesWhatsApp';
import Temas from './pages/Temas';
import MisTemas from './pages/MisTemas';
import MiCuenta from './pages/MiCuenta';
import CodigoVestuario from './pages/CodigoVestuario';
import CambiarPasswordInicial from './pages/CambiarPasswordInicial';
import AutorizacionesCaminante from './pages/AutorizacionesCaminante';
import Auditoria from './pages/Auditoria';

export default function App() {
  return (
    <AuthProvider>
      <SessionAlert />

      <Routes>
        <Route
          path="/"
          element={<PublicHome />}
        />

        <Route path="/registro" element={<RegistroAspirante />} />
        <Route path="/reportar-pago" element={<ReportarPago />} />
        <Route path="/autorizaciones" element={<AutorizacionesCaminante />} />

        {/* Pantalla pública sin menú lateral ni autenticación */}
        <Route
          path="/pantalla-publica"
          element={<PantallaPublica />}
        />

        <Route
          path="/cambiar-password-inicial"
          element={
            <PrivateRoute permitirCambioPassword>
              <CambiarPasswordInicial />
            </PrivateRoute>
          }
        />

        {/* Rutas privadas dentro del layout principal */}
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

          <Route path="/caminantes" element={<Caminantes />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route
            path="/tesoreria/reportar-pago"
            element={<ReportarPago />}
          />

          <Route
            path="/mi-cuenta/reportar-pago"
            element={<ReportarPago />}
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
            path="/paso-a-paso"
            element={<Minutograma />}
          />

          <Route
            path="/minutograma"
            element={<Navigate to="/paso-a-paso" replace />}
          />

          <Route
            path="/campanero"
            element={<Campanero />}
          />

          <Route
            path="/temas"
            element={<Temas />}
          />

          <Route
            path="/mis-temas"
            element={<MisTemas />}
          />

          <Route
            path="/administracion"
            element={<Administracion />}
          />

          <Route
            path="/configuracion"
            element={<Configuracion />}
          />

          <Route
            path="/auditoria"
            element={<Auditoria />}
          />

          <Route path="/mi-cuenta" element={<MiCuenta />} />
          <Route path="/codigo-vestuario" element={<CodigoVestuario />} />

          <Route
            path="/notificaciones-whatsapp"
            element={<NotificacionesWhatsApp />}
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