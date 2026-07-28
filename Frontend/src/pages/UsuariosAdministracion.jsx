import { Alert, Stack } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { obtenerAdministracionSistemaApi } from '../api/administracionApi';
import UsuariosSistema from '../components/administracion/UsuariosSistema';

export default function UsuariosAdministracion() {
  const { token, tienePermiso } = useAuth();
  const api = useApi(() => obtenerAdministracionSistemaApi(token), [token]);
  const datos = api.data || {};

  if (!tienePermiso('SISTEMA_TODO')) return <Alert severity="error">No tiene permisos para administrar los usuarios.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Usuarios"
        subtitle="Creación, asociación, edición y activación de cuentas del sistema"
        onRefresh={api.reload}
        loading={api.loading}
      />
      <Stack spacing={2.5}>
        <UsuariosSistema
          usuarios={datos.usuarios || []}
          servidores={datos.servidores || []}
          roles={datos.roles || []}
          token={token}
          onActualizado={api.reload}
        />
      </Stack>
    </>
  );
}
