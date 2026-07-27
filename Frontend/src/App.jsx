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
import FechasImportantes from './pages/FechasImportantes';
import Documentos from './pages/Documentos';

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
            element={<PrivateRoute permiso="ASPIRANTES_VER_DETALLE"><Aspirantes /></PrivateRoute>}
          />

          <Route
            path="/aspirantes/nuevo"
            element={<PrivateRoute permiso="ASPIRANTES_REGISTRAR"><RegistroAspirante registroInterno /></PrivateRoute>}
          />

          <Route
            path="/equipos"
            element={<PrivateRoute permiso="EQUIPOS_VER_DETALLE"><Equipos /></PrivateRoute>}
          />

          <Route
            path="/servidores"
            element={<PrivateRoute permiso="SERVIDORES_VER_DETALLE"><Servidores /></PrivateRoute>}
          />

          <Route path="/caminantes" element={<PrivateRoute permiso="CAMINANTES_VER_DETALLE"><Caminantes /></PrivateRoute>} />
          <Route path="/pagos" element={<PrivateRoute permiso="PAGOS_VER_ESTADOS_CUENTA"><Pagos /></PrivateRoute>} />
          <Route
            path="/tesoreria/reportar-pago"
            element={<PrivateRoute permiso="REPORTAR_PAGO_REGISTRAR"><ReportarPago /></PrivateRoute>}
          />

          <Route
            path="/mi-cuenta/reportar-pago"
            element={<ReportarPago />}
          />

          <Route
            path="/mesas"
            element={<PrivateRoute permiso="MESAS_VER_DETALLE"><Mesas /></PrivateRoute>}
          />

          <Route
            path="/presentaciones"
            element={
              <PrivateRoute permiso="PRESENTACIONES_TODO">
                <Presentaciones />
              </PrivateRoute>
            }
          />

          <Route
            path="/documentos"
            element={<PrivateRoute permiso="DOCUMENTOS_CONSULTAR"><Documentos /></PrivateRoute>}
          />

          <Route
            path="/habitaciones"
            element={<PrivateRoute permiso="HABITACIONES_VER_DETALLE"><Habitaciones /></PrivateRoute>}
          />

          <Route
            path="/paso-a-paso"
            element={<PrivateRoute permiso="PASO_A_PASO_VER_DETALLE"><Minutograma /></PrivateRoute>}
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
            element={<PrivateRoute permiso="TEMAS_VER_DETALLE"><Temas /></PrivateRoute>}
          />

          <Route
            path="/mis-temas"
            element={<PrivateRoute permiso="MIS_TEMAS_VER"><MisTemas /></PrivateRoute>}
          />

          <Route
            path="/administracion"
            element={<PrivateRoute permiso="SISTEMA_TODO"><Administracion /></PrivateRoute>}
          />

          <Route
            path="/configuracion"
            element={<PrivateRoute permiso="SISTEMA_TODO"><Configuracion /></PrivateRoute>}
          />

          <Route
            path="/auditoria"
            element={<PrivateRoute permiso="SISTEMA_TODO"><Auditoria /></PrivateRoute>}
          />

          <Route
            path="/fechas-importantes"
            element={<PrivateRoute permiso="FECHAS_IMPORTANTES_GESTIONAR"><FechasImportantes /></PrivateRoute>}
          />

          <Route path="/mi-cuenta" element={<PrivateRoute permiso="MI_CUENTA_VER"><MiCuenta /></PrivateRoute>} />
          <Route path="/codigo-vestuario" element={<PrivateRoute permiso="CODIGO_VESTUARIO_VER"><CodigoVestuario /></PrivateRoute>} />

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