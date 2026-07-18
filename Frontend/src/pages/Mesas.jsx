import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useState } from 'react';

import { obtenerMesas } from '../api/mesasApi';
import { useApi } from '../hooks/useApi';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';

function normalizar(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function contarEstados(items, obtenerValor) {
  return items.reduce((resultado, item) => {
    const estado = normalizar(obtenerValor(item)).replace(/\s+/g, '');
    const clave = estado || 'sindefinir';
    resultado[clave] = (resultado[clave] || 0) + 1;
    return resultado;
  }, {});
}

function obtenerCantidad(estados, ...claves) {
  return claves.reduce(
    (total, clave) => total + Number(estados[clave] || 0),
    0
  );
}

function obtenerTelefonoContacto(caminante) {
  return (
    caminante?.contacto?.telefono ||
    caminante?.telefonoContacto ||
    caminante?.contactoTelefono ||
    '—'
  );
}

function ResumenEstado({ titulo, estados, total }) {
  const pendientes = obtenerCantidad(
    estados,
    'pendiente',
    'nosolicitada',
    'sindefinir'
  );

  const enProceso = obtenerCantidad(
    estados,
    'enproceso',
    'solicitada',
    'parcial',
    'pagoparcial'
  );

  const completados = obtenerCantidad(
    estados,
    'entregado',
    'entregada',
    'completado',
    'aprobado',
    'recibido',
    'recibida',
    'pagado',
    'pagototal',
    'total'
  );

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, height: '100%', borderRadius: 2.5 }}
    >
      <Typography fontWeight={850} mb={1.5}>
        {titulo}
      </Typography>

      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Pendientes
          </Typography>
          <Typography fontWeight={800}>{pendientes}</Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            En proceso / parcial
          </Typography>
          <Typography fontWeight={800}>{enProceso}</Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Completados
          </Typography>
          <Typography fontWeight={800}>{completados}</Typography>
        </Stack>

        <Divider sx={{ my: 0.5 }} />

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" fontWeight={700}>
            Total
          </Typography>
          <Typography fontWeight={850}>{total}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function Mesas() {
  const api = useApi(() => obtenerMesas(), []);
  const [selected, setSelected] = useState(null);

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

  const mesas = api.data?.items || [];
  const caminantesSeleccionados = selected?.caminantes || [];

  const estadosPago = contarEstados(
    caminantesSeleccionados,
    (caminante) => caminante.estadoPago
  );

  const estadosCarta = contarEstados(
    caminantesSeleccionados,
    (caminante) => caminante.entregables?.carta
  );

  const estadosFoto = contarEstados(
    caminantesSeleccionados,
    (caminante) => caminante.entregables?.foto
  );

  return (
    <>
      <PageHeader
        eyebrow="Distribución"
        title="Mesas"
        subtitle="Mapa general de mesas"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Grid container spacing={2}>
        {mesas.map((mesa) => (
          <Grid
            key={mesa.numero}
            size={{ xs: 12, sm: 6, lg: 4 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => setSelected(mesa)}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight={850}>
                    Mesa {mesa.numero}
                  </Typography>

                  <Typography>
                    Líder: {mesa.lider?.nombre || 'Sin asignar'}
                  </Typography>

                  <Typography>
                    Colíder: {mesa.colider?.nombre || 'Sin asignar'}
                  </Typography>

                  <Typography mt={2}>
                    {mesa.cantidadCaminantes} de {mesa.capacidad} caminantes
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      Number(mesa.porcentajeOcupacion || 0),
                      100
                    )}
                    sx={{ my: 1, height: 9, borderRadius: 999 }}
                  />

                  <Typography variant="body2" color="text.secondary">
                    Cartas: {mesa.cartas?.porcentajeCumplimiento || 0}% · Fotos:{' '}
                    {mesa.fotos?.porcentajeCumplimiento || 0}%
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={900}>
              Mesa {selected?.numero}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Líder: {selected?.lider?.nombre || 'Sin asignar'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Colíder: {selected?.colider?.nombre || 'Sin asignar'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {selected?.cantidadCaminantes || 0} de {selected?.capacidad || 0}{' '}
              caminantes
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 980 }}>
              <Grid
                container
                spacing={1}
                sx={{
                  px: 1.5,
                  py: 1.25,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  mb: 0.5,
                }}
              >
                <Grid size={3}>
                  <Typography variant="body2" fontWeight={850}>
                    Caminante
                  </Typography>
                </Grid>

                <Grid size={1.5}>
                  <Typography variant="body2" fontWeight={850}>
                    Habitación
                  </Typography>
                </Grid>

                <Grid size={1.75}>
                  <Typography variant="body2" fontWeight={850}>
                    Pago
                  </Typography>
                </Grid>

                <Grid size={1.75}>
                  <Typography variant="body2" fontWeight={850}>
                    Carta
                  </Typography>
                </Grid>

                <Grid size={1.75}>
                  <Typography variant="body2" fontWeight={850}>
                    Foto
                  </Typography>
                </Grid>

                <Grid size={2.25}>
                  <Typography variant="body2" fontWeight={850}>
                    Contacto
                  </Typography>
                </Grid>
              </Grid>

              <Stack spacing={0}>
                {caminantesSeleccionados.map((caminante) => (
                  <Grid
                    container
                    spacing={1}
                    alignItems="center"
                    key={caminante.id}
                    sx={{
                      px: 1.5,
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Grid size={3}>
                      <Typography fontWeight={800}>
                        {caminante.nombre}
                      </Typography>
                    </Grid>

                    <Grid size={1.5}>
                      <Typography>
                        {caminante.habitacion || '—'}
                      </Typography>
                    </Grid>

                    <Grid size={1.75}>
                      <StatusChip value={caminante.estadoPago} />
                    </Grid>

                    <Grid size={1.75}>
                      <StatusChip value={caminante.entregables?.carta} />
                    </Grid>

                    <Grid size={1.75}>
                      <StatusChip value={caminante.entregables?.foto} />
                    </Grid>

                    <Grid size={2.25}>
                      <Typography>
                        {obtenerTelefonoContacto(caminante)}
                      </Typography>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          </Box>

          <Typography variant="h6" fontWeight={900} mt={3} mb={1.5}>
            Resumen de la mesa
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ResumenEstado
                titulo="Pagos"
                estados={estadosPago}
                total={caminantesSeleccionados.length}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <ResumenEstado
                titulo="Cartas"
                estados={estadosCarta}
                total={caminantesSeleccionados.length}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <ResumenEstado
                titulo="Fotos"
                estados={estadosFoto}
                total={caminantesSeleccionados.length}
              />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}
