import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import WhatsApp from '@mui/icons-material/WhatsApp';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  obtenerNotificacionesWhatsapp,
} from '../api/whatsappApi';

import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import WhatsAppNotifyButton from '../components/WhatsAppNotifyButton';

function etiquetaTipo(tipo) {
  const valores = {
    INSCRIPCION: 'Inscripción',
    APROBACION: 'Aprobación',
    CANCELACION: 'Cancelación',
  };

  return valores[tipo] || tipo;
}

export default function NotificacionesWhatsApp() {
  const { token } = useAuth();

  const api = useApi(
    () => obtenerNotificacionesWhatsapp(token),
    [token]
  );

  if (api.loading && !api.data) {
    return <LoadingState />;
  }

  if (api.error) {
    return (
      <ErrorState
        message={api.error}
        onRetry={api.reload}
      />
    );
  }

  const items = api.data?.items || [];

  return (
    <>
      <PageHeader
        eyebrow="Mensajería"
        title="Notificaciones de WhatsApp"
        subtitle="Mensajes pendientes que se enviarán desde la sesión institucional activa"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        El sistema abre WhatsApp con el mensaje preparado.
        El envío se realiza desde la cuenta activa en este dispositivo.
      </Alert>

      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap={1}
                >
                  <Box>
                    <Typography fontWeight={900}>
                      {item.nombre || 'Sin nombre'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.telefono || 'Sin celular'}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={item.estado}
                    color={
                      item.estado === 'Abierta'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Stack>

                <Stack direction="row" spacing={1} mt={2}>
                  <Chip
                    size="small"
                    icon={<WhatsApp />}
                    label={etiquetaTipo(item.tipo)}
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                {item.motivo && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, whiteSpace: 'pre-wrap' }}
                  >
                    <strong>Motivo:</strong> {item.motivo}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <WhatsAppNotifyButton
                  token={token}
                  notificacion={item}
                  onCompleted={api.reload}
                  fullWidth
                />
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {items.length === 0 && (
        <Alert severity="success">
          No hay mensajes de WhatsApp pendientes.
        </Alert>
      )}
    </>
  );
}
