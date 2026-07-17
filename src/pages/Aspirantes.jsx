import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';

import {
  useMemo,
  useState,
} from 'react';

import {
  actualizarEstadoAspiranteApi,
  convertirAspiranteEnCaminanteApi,
  obtenerAspirantes,
} from '../api/aspirantesApi';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';

import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const ESTADOS = [
  '',
  'Pendiente',
  'En revisión',
  'Aprobado',
  'Rechazado',
  'Convertido',
];

function colorEstado(estado) {
  const valor =
    String(estado || '')
      .toLowerCase();

  if (
    valor === 'aprobado' ||
    valor === 'convertido'
  ) {
    return 'success';
  }

  if (valor === 'rechazado') {
    return 'error';
  }

  if (valor === 'en revisión') {
    return 'warning';
  }

  return 'default';
}

export default function Aspirantes() {
  const {
    token,
    autenticado,
    loading: authLoading,
    tienePermiso,
  } = useAuth();

  const api = useApi(
    () =>
      obtenerAspirantes(
        token
      ),
    [
      token,
    ]
  );

  const [filtro, setFiltro] =
    useState('');

  const [seleccionado, setSeleccionado] =
    useState(null);

  const [procesando, setProcesando] =
    useState(false);

  const items =
    api.data?.items || [];

  const filtrados =
    useMemo(
      () =>
        filtro
          ? items.filter(
              (item) =>
                item.estadoSolicitud ===
                filtro
            )
          : items,
      [
        items,
        filtro,
      ]
    );

  function puede(permiso) {
    return (
      !authLoading &&
      autenticado &&
      tienePermiso(permiso)
    );
  }

  async function cambiarEstado(
    estado
  ) {
    setProcesando(true);

    try {
      await actualizarEstadoAspiranteApi(
        token,
        seleccionado.id,
        estado,
        seleccionado.observacionesGestion ||
          ''
      );

      setSeleccionado(null);
      await api.reload();
    } finally {
      setProcesando(false);
    }
  }

  async function convertir() {
    setProcesando(true);

    try {
      await convertirAspiranteEnCaminanteApi(
        token,
        seleccionado.id
      );

      setSeleccionado(null);
      await api.reload();
    } finally {
      setProcesando(false);
    }
  }

  if (
    api.loading &&
    !api.data
  ) {
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

  return (
    <>
      <PageHeader
        eyebrow="Admisiones"
        title="Aspirantes"
        subtitle="Solicitudes recibidas desde el portal público"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2}>
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          justifyContent="space-between"
          gap={1.5}
        >
          <TextField
            select
            size="small"
            label="Estado"
            value={filtro}
            onChange={(event) =>
              setFiltro(
                event.target.value
              )
            }
            sx={{
              minWidth: 220,
            }}
          >
            {ESTADOS.map(
              (item) => (
                <MenuItem
                  key={
                    item ||
                    'todos'
                  }
                  value={item}
                >
                  {item ||
                    'Todos'}
                </MenuItem>
              )
            )}
          </TextField>

          <Typography
            color="text.secondary"
          >
            {filtrados.length}{' '}
            registros
          </Typography>
        </Stack>

        {filtrados.map(
          (item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  md: 'row',
                }}
                justifyContent="space-between"
                gap={2}
              >
                <Box>
                  <Stack
                    direction="row"
                    gap={1}
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={900}
                    >
                      {
                        item.nombreCompleto
                      }
                    </Typography>

                    <Chip
                      size="small"
                      color={colorEstado(
                        item.estadoSolicitud
                      )}
                      label={
                        item.estadoSolicitud
                      }
                    />
                  </Stack>

                  <Typography
                    color="text.secondary"
                    mt={0.5}
                  >
                    {
                      item.numeroInscripcion
                    }{' '}
                    · {item.celular} ·{' '}
                    {
                      item.documentoIdentidad
                    }
                  </Typography>

                  <Typography
                    variant="body2"
                    mt={1}
                  >
                    Invitado por:{' '}
                    {item.nombrePersonaInvito ||
                      'No informado'}
                  </Typography>
                </Box>

                <Button
                  startIcon={
                    <VisibilityRounded />
                  }
                  onClick={() =>
                    setSeleccionado(
                      item
                    )
                  }
                >
                  Ver detalle
                </Button>
              </Stack>
            </Paper>
          )
        )}

        {filtrados.length ===
          0 && (
          <Alert severity="info">
            No hay aspirantes con el filtro seleccionado.
          </Alert>
        )}
      </Stack>

      <Dialog
        open={Boolean(
          seleccionado
        )}
        onClose={() =>
          !procesando &&
          setSeleccionado(null)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Detalle del aspirante
        </DialogTitle>

        <DialogContent>
          {seleccionado && (
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={900}
                >
                  {
                    seleccionado.nombreCompleto
                  }
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {
                    seleccionado.numeroInscripcion
                  }
                </Typography>
              </Box>

              <Divider />

              <Typography>
                <strong>
                  Documento:
                </strong>{' '}
                {
                  seleccionado.documentoIdentidad
                }
              </Typography>

              <Typography>
                <strong>
                  Celular:
                </strong>{' '}
                {
                  seleccionado.celular
                }
              </Typography>

              <Typography>
                <strong>
                  Dirección:
                </strong>{' '}
                {
                  seleccionado.direccionResidencia
                }
              </Typography>

              <Typography>
                <strong>
                  EPS:
                </strong>{' '}
                {seleccionado.eps}
              </Typography>

              <Typography>
                <strong>
                  Enfermedad:
                </strong>{' '}
                {
                  seleccionado.sufreEnfermedad
                }
                {seleccionado.enfermedadCual
                  ? ` - ${seleccionado.enfermedadCual}`
                  : ''}
              </Typography>

              <Typography>
                <strong>
                  Medicamentos:
                </strong>{' '}
                {
                  seleccionado.tomaMedicamento
                }
                {seleccionado.medicamentoCual
                  ? ` - ${seleccionado.medicamentoCual}`
                  : ''}
              </Typography>

              <Typography>
                <strong>
                  Limitación física:
                </strong>{' '}
                {
                  seleccionado.tieneLimitacionFisica
                }
                {seleccionado.limitacionCual
                  ? ` - ${seleccionado.limitacionCual}`
                  : ''}
              </Typography>

              <Typography>
                <strong>
                  Contacto:
                </strong>{' '}
                {
                  seleccionado.contacto1Nombre
                }{' '}
                -{' '}
                {
                  seleccionado.contacto1Celular
                }
              </Typography>

              <TextField
                label="Observaciones de gestión"
                value={
                  seleccionado.observacionesGestion ||
                  ''
                }
                onChange={(event) =>
                  setSeleccionado(
                    (actual) => ({
                      ...actual,
                      observacionesGestion:
                        event.target.value,
                    })
                  )
                }
                multiline
                minRows={3}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={() =>
              setSeleccionado(null)
            }
            disabled={procesando}
          >
            Cerrar
          </Button>

          {puede(
            'ACTUALIZAR_ESTADO_ASPIRANTE'
          ) && (
            <>
              <Button
                color="warning"
                onClick={() =>
                  cambiarEstado(
                    'En revisión'
                  )
                }
                disabled={procesando}
              >
                En revisión
              </Button>

              <Button
                color="error"
                startIcon={
                  <CloseRounded />
                }
                onClick={() =>
                  cambiarEstado(
                    'Rechazado'
                  )
                }
                disabled={procesando}
              >
                Rechazar
              </Button>

              <Button
                color="success"
                startIcon={
                  <CheckRounded />
                }
                onClick={() =>
                  cambiarEstado(
                    'Aprobado'
                  )
                }
                disabled={procesando}
              >
                Aprobar
              </Button>
            </>
          )}

          {puede(
            'CONVERTIR_ASPIRANTE'
          ) &&
            seleccionado?.estadoSolicitud ===
              'Aprobado' && (
              <Button
                variant="contained"
                startIcon={
                  <PersonAddRounded />
                }
                onClick={convertir}
                disabled={procesando}
              >
                Convertir en caminante
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </>
  );
}
