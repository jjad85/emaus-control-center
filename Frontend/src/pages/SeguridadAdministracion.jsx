import { Alert, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { desbloquearUsuarioSistemaApi, obtenerAdministracionSistemaApi } from '../api/administracionApi';

export default function SeguridadAdministracion() {
  const { token, tienePermiso } = useAuth();
  const api = useApi(() => obtenerAdministracionSistemaApi(token), [token]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const usuariosBloqueados = (api.data?.usuarios || []).filter((usuario) => usuario.bloqueado);

  if (!tienePermiso('SISTEMA_TODO')) return <Alert severity="error">No tiene permisos para administrar la seguridad.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  async function desbloquear(usuario) {
    setProcesando(true);
    setError('');
    try {
      await desbloquearUsuarioSistemaApi(token, usuario);
      await api.reload();
    } catch (e) {
      setError(e.message || 'No fue posible desbloquear el usuario.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Seguridad"
        subtitle="Gestión de cuentas bloqueadas y controles de acceso"
        onRefresh={api.reload}
        loading={api.loading}
      />
      <Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={900}>Usuarios bloqueados</Typography>
          <Typography variant="body2" color="text.secondary">
            Desbloquee cuentas que superaron el número permitido de intentos fallidos.
          </Typography>
          <Divider sx={{ my: 2 }} />
          {!usuariosBloqueados.length ? (
            <Alert severity="success">No hay usuarios bloqueados.</Alert>
          ) : usuariosBloqueados.map((usuario) => (
            <Stack
              key={usuario.usuario}
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              gap={1.5}
              sx={{ py: 1.25 }}
            >
              <Box>
                <Typography fontWeight={800}>{usuario.nombre || usuario.usuario}</Typography>
                <Typography variant="body2" color="text.secondary">{usuario.usuario}</Typography>
              </Box>
              <Button
                startIcon={<LockOpenRounded />}
                disabled={procesando}
                onClick={() => desbloquear(usuario.usuario)}
              >
                Desbloquear
              </Button>
            </Stack>
          ))}
        </Paper>
      </Stack>
    </>
  );
}
