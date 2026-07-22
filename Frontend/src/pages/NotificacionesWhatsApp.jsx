import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import BlockRounded from '@mui/icons-material/BlockRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';

import { useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  obtenerNotificacionesWhatsapp,
  omitirNotificacionWhatsapp,
} from '../api/whatsappApi';

import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import WhatsAppNotifyButton from '../components/WhatsAppNotifyButton';

function etiquetaTipo(tipo) {
  const valores = {
    INSCRIPCION: 'Confirmación de inscripción',
    APROBACION: 'Aprobación como caminante',
    CANCELACION: 'Cancelación de participación',
    PAGO_RECHAZADO: 'Pago rechazado',
  };

  return valores[String(tipo || '').toUpperCase()] || tipo || 'Sin definir';
}

function colorEstado(estado) {
  const valor = String(estado || '').toLowerCase();

  if (valor === 'confirmada') return 'success';
  if (valor === 'omitida') return 'default';
  if (valor === 'abierta') return 'warning';
  return 'info';
}

export default function NotificacionesWhatsApp() {
  const { token } = useAuth();
  const [vista, setVista] = useState('pendientes');
  const [omitirDialog, setOmitirDialog] = useState({
    open: false,
    item: null,
    motivo: '',
    loading: false,
    error: '',
  });

  const api = useApi(
    () => obtenerNotificacionesWhatsapp(token, {
      incluirGestionadas: vista === 'historial',
    }),
    [token, vista]
  );

  const items = useMemo(() => {
    const todos = api.data?.items || [];

    if (vista === 'historial') {
      return todos.filter((item) =>
        ['Confirmada', 'Omitida'].includes(item.estado)
      );
    }

    return todos.filter((item) =>
      !['Confirmada', 'Omitida'].includes(item.estado)
    );
  }, [api.data, vista]);

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

  function abrirOmitir(item) {
    setOmitirDialog({
      open: true,
      item,
      motivo: '',
      loading: false,
      error: '',
    });
  }

  function cerrarOmitir() {
    if (omitirDialog.loading) return;

    setOmitirDialog({
      open: false,
      item: null,
      motivo: '',
      loading: false,
      error: '',
    });
  }

  async function confirmarOmitir() {
    if (!omitirDialog.item?.id) return;

    setOmitirDialog((actual) => ({
      ...actual,
      loading: true,
      error: '',
    }));

    try {
      await omitirNotificacionWhatsapp(
        token,
        omitirDialog.item.id,
        omitirDialog.motivo
      );

      cerrarOmitir();

      window.dispatchEvent(
        new CustomEvent('emaus:notificaciones-actualizar')
      );

      await api.reload();
    } catch (error) {
      setOmitirDialog((actual) => ({
        ...actual,
        loading: false,
        error: String(
          error?.message ||
          error?.mensaje ||
          'No fue posible omitir la notificación.'
        ),
      }));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Mensajería"
        title="Notificaciones de WhatsApp"
        subtitle="Control de mensajes pendientes y gestionados desde la sesión institucional activa"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        El sistema abre WhatsApp con el mensaje preparado. Después puedes
        confirmar que lo enviaste o marcar que no se notificará.
      </Alert>

      <Tabs
        value={vista}
        onChange={(_, valor) => setVista(valor)}
        sx={{ mb: 2 }}
      >
        <Tab
          value="pendientes"
          label={`Pendientes (${api.data?.pendientesGestion || 0})`}
        />
        <Tab
          value="historial"
          label="Historial"
        />
      </Tabs>

      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.id}>
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
                    <Typography variant="body2" color="text.secondary">
                      {item.telefono || 'Sin celular'}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={item.estado}
                    color={colorEstado(item.estado)}
                  />
                </Stack>

                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={800}
                    display="block"
                  >
                    TIPO DE NOTIFICACIÓN
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <WhatsApp color="success" fontSize="small" />
                    <Typography fontWeight={800}>
                      {etiquetaTipo(item.tipo)}
                    </Typography>
                  </Stack>
                </Box>

                {item.motivo && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, whiteSpace: 'pre-wrap' }}
                  >
                    <strong>Motivo:</strong> {item.motivo}
                  </Typography>
                )}

                {item.estado === 'Omitida' && item.motivoOmitision && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, whiteSpace: 'pre-wrap' }}
                  >
                    <strong>Razón para no notificar:</strong>{' '}
                    {item.motivoOmitision}
                  </Typography>
                )}

                {['Confirmada', 'Omitida'].includes(item.estado) && (
                  <Stack spacing={0.5} mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Gestionada por:{' '}
                      {item.confirmadoPor || item.omitidoPor || 'Sin dato'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fecha:{' '}
                      {item.fechaConfirmacion || item.fechaOmitision || 'Sin dato'}
                    </Typography>
                  </Stack>
                )}
              </CardContent>

              {vista === 'pendientes' && (
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Stack spacing={1} width="100%">
                    <WhatsAppNotifyButton
                      token={token}
                      notificacion={item}
                      onCompleted={api.reload}
                      fullWidth
                    />

                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<BlockRounded />}
                      onClick={() => abrirOmitir(item)}
                      fullWidth
                    >
                      No notificar
                    </Button>
                  </Stack>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {items.length === 0 && (
        <Alert severity={vista === 'pendientes' ? 'success' : 'info'}>
          {vista === 'pendientes'
            ? 'No hay mensajes de WhatsApp pendientes.'
            : 'Todavía no hay notificaciones gestionadas.'}
        </Alert>
      )}

      <Dialog
        open={omitirDialog.open}
        onClose={cerrarOmitir}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <BlockRounded />
            <Typography component="span" fontWeight={900}>
              No notificar
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <DialogContentText>
              Esta notificación desaparecerá de los pendientes y quedará
              registrada en el historial como omitida.
            </DialogContentText>

            <TextField
              label="Motivo"
              placeholder="Ej.: Ya fue contactado por llamada, mensaje duplicado, no requiere envío..."
              value={omitirDialog.motivo}
              onChange={(event) => setOmitirDialog((actual) => ({
                ...actual,
                motivo: event.target.value,
                error: '',
              }))}
              multiline
              minRows={3}
              required
              fullWidth
            />

            {omitirDialog.error && (
              <Alert severity="error">{omitirDialog.error}</Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={cerrarOmitir}
            disabled={omitirDialog.loading}
          >
            Cancelar
          </Button>

          <Button
            onClick={confirmarOmitir}
            disabled={
              omitirDialog.loading ||
              !omitirDialog.motivo.trim()
            }
            variant="contained"
            color="inherit"
            startIcon={<CheckCircleOutlineRounded />}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
