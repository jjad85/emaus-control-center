import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import LockResetRounded from '@mui/icons-material/LockResetRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PasswordRecoveryDialog from '../auth/PasswordRecoveryDialog';
import { obtenerMiCuentaServidorApi } from '../api/servidoresApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';

function Dato({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>
        {label}
      </Typography>
      <Typography fontWeight={700}>{value || 'Sin información'}</Typography>
    </Box>
  );
}

export default function MiCuenta() {
  const { token, usuario } = useAuth();
  const api = useApi(() => obtenerMiCuentaServidorApi(token), [token]);
  const [cambiarClave, setCambiarClave] = useState(false);

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  const servidor = api.data || {};

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Mi cuenta"
        subtitle="Consulta la información registrada para tu servicio en el retiro."
      />

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <PersonRounded sx={{ fontSize: 36 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={900}>{servidor.nombre}</Typography>
                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                  <Chip label={servidor.activo === false ? 'Inactivo' : 'Activo'} color={servidor.activo === false ? 'default' : 'success'} size="small" />
                  <Chip label={servidor.estadoPago || 'Pago pendiente'} variant="outlined" size="small" />
                </Stack>
              </Box>
              <Button variant="outlined" startIcon={<LockResetRounded />} onClick={() => setCambiarClave(true)}>
                Cambiar contraseña
              </Button>
            </Stack>

            <Divider />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Correo" value={servidor.correo} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Celular" value={servidor.celular} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Contacto" value={servidor.contacto} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Equipo" value={servidor.equipo} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Rol" value={servidor.rolEquipo || servidor.rolMesa || servidor.rol} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Mesa" value={servidor.mesa} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Dato label="Habitación" value={servidor.habitacion} /></Grid>
              <Grid size={12}><Dato label="Temas asignados" value={(servidor.temas || []).join(' · ')} /></Grid>
            </Grid>

            <Alert severity="info">Los cambios sobre esta información deben ser realizados por el equipo administrador.</Alert>
          </Stack>
        </CardContent>
      </Card>

      <PasswordRecoveryDialog
        open={cambiarClave}
        onClose={() => setCambiarClave(false)}
        onSuccess={() => setCambiarClave(false)}
        initialUsuario={usuario || ''}
        initialCorreo={servidor.correo || ''}
      />
    </Stack>
  );
}
