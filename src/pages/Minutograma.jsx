import {
  AddRounded,
  CalendarMonthRounded,
  EditRounded,
  LocationOnRounded,
  PersonRounded,
  PlayArrowRounded,
  ScheduleRounded,
  StopCircleRounded,
  TimelineRounded,
  ViewListRounded,
} from '@mui/icons-material';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  actualizarEstadoMinutogramaApi,
  desactivarActividadMinutogramaApi,
  editarActividadMinutogramaApi,
  obtenerMinutograma,
  registrarActividadMinutogramaApi,
} from '../api/minutogramaApi';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';

import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const DIAS = [
  'Viernes',
  'Sábado',
  'Domingo',
];

const ESTADOS = [
  'Pendiente',
  'En curso',
  'Finalizada',
  'Cancelada',
];

const PRIORIDADES = [
  'Alta',
  'Media',
  'Baja',
];

const FORM_INICIAL = {
  orden: '',
  dia: 'Viernes',
  horaInicio: '13:00',
  duracionMinutos: 30,
  actividad: '',
  responsable: '',
  equipo: '',
  lugar: '',
  estado: 'Pendiente',
  prioridad: 'Media',
  observaciones: '',
};

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}

function minutosDesdeHora(hora) {
  const partes =
    String(hora || '')
      .split(':')
      .map(Number);

  if (
    partes.length !== 2 ||
    partes.some(Number.isNaN)
  ) {
    return 0;
  }

  return (
    partes[0] * 60 +
    partes[1]
  );
}

function formatoHora(hora) {
  if (!hora) {
    return '';
  }

  const [
    horaNumero,
    minutoNumero,
  ] = String(hora)
    .split(':')
    .map(Number);

  const fecha = new Date();
  fecha.setHours(
    horaNumero,
    minutoNumero,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    'es-CO',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  ).format(fecha);
}

function nombreDiaActual() {
  const dias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  return dias[
    new Date().getDay()
  ];
}

function EstadoChip({
  estado,
}) {
  const valor =
    normalizar(estado);

  const color =
    valor === 'finalizada'
      ? 'success'
      : valor === 'en curso'
        ? 'warning'
        : valor === 'cancelada'
          ? 'error'
          : 'default';

  return (
    <Chip
      size="small"
      color={color}
      label={
        estado ||
        'Pendiente'
      }
    />
  );
}

function ActividadDialog({
  open,
  onClose,
  onSubmit,
  actividad,
  loading,
}) {
  const [form, setForm] =
    useState(FORM_INICIAL);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      actividad
        ? {
            ...FORM_INICIAL,
            ...actividad,
          }
        : FORM_INICIAL
    );

    setError('');
  }, [
    open,
    actividad,
  ]);

  function cambiar(
    campo,
    valor
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardar(
    event
  ) {
    event.preventDefault();

    if (
      !form.actividad.trim() ||
      !form.responsable.trim() ||
      !form.lugar.trim()
    ) {
      setError(
        'Actividad, responsable y lugar son obligatorios.'
      );
      return;
    }

    if (
      Number(
        form.duracionMinutos
      ) <= 0
    ) {
      setError(
        'La duración debe ser mayor que cero.'
      );
      return;
    }

    setError('');

    try {
      await onSubmit({
        ...form,
        duracionMinutos:
          Number(
            form.duracionMinutos
          ),
        orden:
          form.orden === ''
            ? ''
            : Number(
                form.orden
              ),
      });
    } catch (err) {
      setError(
        err.message ||
          'No fue posible guardar.'
      );
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="md"
      fullScreen={
        window.innerWidth < 600
      }
      component="form"
      onSubmit={guardar}
    >
      <DialogTitle>
        {actividad
          ? 'Editar actividad'
          : 'Registrar actividad'}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          mt={1}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Grid
            container
            spacing={2}
          >
            <Grid
              size={{
                xs: 12,
                sm: 4,
              }}
            >
              <TextField
                select
                label="Día"
                value={form.dia}
                onChange={(event) =>
                  cambiar(
                    'dia',
                    event.target.value
                  )
                }
                fullWidth
              >
                {DIAS.map(
                  (dia) => (
                    <MenuItem
                      key={dia}
                      value={dia}
                    >
                      {dia}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 6,
                sm: 4,
              }}
            >
              <TextField
                label="Hora inicio"
                type="time"
                value={
                  form.horaInicio
                }
                onChange={(event) =>
                  cambiar(
                    'horaInicio',
                    event.target.value
                  )
                }
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid
              size={{
                xs: 6,
                sm: 4,
              }}
            >
              <TextField
                label="Duración (min)"
                type="number"
                value={
                  form.duracionMinutos
                }
                onChange={(event) =>
                  cambiar(
                    'duracionMinutos',
                    event.target.value
                  )
                }
                inputProps={{
                  min: 1,
                }}
                fullWidth
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 8,
              }}
            >
              <TextField
                label="Actividad"
                value={
                  form.actividad
                }
                onChange={(event) =>
                  cambiar(
                    'actividad',
                    event.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 4,
              }}
            >
              <TextField
                label="Orden"
                type="number"
                value={form.orden}
                onChange={(event) =>
                  cambiar(
                    'orden',
                    event.target.value
                  )
                }
                fullWidth
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <TextField
                label="Responsable"
                value={
                  form.responsable
                }
                onChange={(event) =>
                  cambiar(
                    'responsable',
                    event.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <TextField
                label="Equipo"
                value={form.equipo}
                onChange={(event) =>
                  cambiar(
                    'equipo',
                    event.target.value
                  )
                }
                fullWidth
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <TextField
                label="Lugar"
                value={form.lugar}
                onChange={(event) =>
                  cambiar(
                    'lugar',
                    event.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>

            <Grid
              size={{
                xs: 6,
                sm: 3,
              }}
            >
              <TextField
                select
                label="Estado"
                value={form.estado}
                onChange={(event) =>
                  cambiar(
                    'estado',
                    event.target.value
                  )
                }
                fullWidth
              >
                {ESTADOS.map(
                  (estado) => (
                    <MenuItem
                      key={estado}
                      value={estado}
                    >
                      {estado}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 6,
                sm: 3,
              }}
            >
              <TextField
                select
                label="Prioridad"
                value={
                  form.prioridad
                }
                onChange={(event) =>
                  cambiar(
                    'prioridad',
                    event.target.value
                  )
                }
                fullWidth
              >
                {PRIORIDADES.map(
                  (prioridad) => (
                    <MenuItem
                      key={prioridad}
                      value={prioridad}
                    >
                      {prioridad}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            <Grid size={12}>
              <TextField
                label="Observaciones"
                value={
                  form.observaciones
                }
                onChange={(event) =>
                  cambiar(
                    'observaciones',
                    event.target.value
                  )
                }
                multiline
                minRows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={
            loading
              ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              )
              : null
          }
        >
          {loading
            ? 'Guardando...'
            : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function VistaTabla({
  actividades,
  puedeEditar,
  puedeEstado,
  onEditar,
  onEstado,
}) {
  return (
    <Stack spacing={1.5}>
      {actividades.map(
        (actividad) => (
          <Paper
            key={actividad.id}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2.5,
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
                    fontWeight={850}
                  >
                    {actividad.actividad}
                  </Typography>

                  <EstadoChip
                    estado={
                      actividad.estado
                    }
                  />

                  <Chip
                    size="small"
                    label={
                      actividad.dia
                    }
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  gap={{
                    xs: 0.5,
                    sm: 2,
                  }}
                  mt={1}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <ScheduleRounded
                      sx={{
                        fontSize: 17,
                        verticalAlign:
                          'middle',
                        mr: 0.5,
                      }}
                    />
                    {formatoHora(
                      actividad.horaInicio
                    )}{' '}
                    –{' '}
                    {formatoHora(
                      actividad.horaFin
                    )}
                    {' · '}
                    {
                      actividad.duracionMinutos
                    }{' '}
                    min
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <PersonRounded
                      sx={{
                        fontSize: 17,
                        verticalAlign:
                          'middle',
                        mr: 0.5,
                      }}
                    />
                    {
                      actividad.responsable
                    }
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <LocationOnRounded
                      sx={{
                        fontSize: 17,
                        verticalAlign:
                          'middle',
                        mr: 0.5,
                      }}
                    />
                    {actividad.lugar}
                  </Typography>
                </Stack>

                {actividad.observaciones && (
                  <Typography
                    variant="body2"
                    mt={1}
                  >
                    {
                      actividad.observaciones
                    }
                  </Typography>
                )}
              </Box>

              <Stack
                direction="row"
                gap={1}
                alignItems="flex-start"
                flexWrap="wrap"
              >
                {puedeEditar && (
                  <Button
                    size="small"
                    startIcon={
                      <EditRounded />
                    }
                    onClick={() =>
                      onEditar(
                        actividad
                      )
                    }
                  >
                    Editar
                  </Button>
                )}

                {puedeEstado &&
                  normalizar(
                    actividad.estado
                  ) !==
                    'en curso' && (
                    <Button
                      size="small"
                      color="warning"
                      startIcon={
                        <PlayArrowRounded />
                      }
                      onClick={() =>
                        onEstado(
                          actividad,
                          'En curso'
                        )
                      }
                    >
                      Iniciar
                    </Button>
                  )}

                {puedeEstado &&
                  normalizar(
                    actividad.estado
                  ) ===
                    'en curso' && (
                    <Button
                      size="small"
                      color="success"
                      startIcon={
                        <StopCircleRounded />
                      }
                      onClick={() =>
                        onEstado(
                          actividad,
                          'Finalizada'
                        )
                      }
                    >
                      Finalizar
                    </Button>
                  )}
              </Stack>
            </Stack>
          </Paper>
        )
      )}

      {actividades.length === 0 && (
        <Alert severity="info">
          No hay actividades para mostrar.
        </Alert>
      )}
    </Stack>
  );
}

function VistaGantt({
  actividades,
  dia,
}) {
  const actividadesDia =
    actividades.filter(
      (item) =>
        item.dia === dia
    );

  if (
    actividadesDia.length === 0
  ) {
    return (
      <Alert severity="info">
        No hay actividades programadas para {dia}.
      </Alert>
    );
  }

  const inicio =
    Math.min(
      ...actividadesDia.map(
        (item) =>
          minutosDesdeHora(
            item.horaInicio
          )
      )
    );

  const fin =
    Math.max(
      ...actividadesDia.map(
        (item) =>
          minutosDesdeHora(
            item.horaFin
          )
      )
    );

  const rango =
    Math.max(
      60,
      fin - inicio
    );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 1.5,
          md: 2.5,
        },
        borderRadius: 3,
        overflowX: 'auto',
      }}
    >
      <Box
        sx={{
          minWidth: 760,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={850}
          mb={2}
        >
          {dia}
        </Typography>

        <Stack spacing={1.25}>
          {actividadesDia.map(
            (actividad) => {
              const inicioActividad =
                minutosDesdeHora(
                  actividad.horaInicio
                );

              const ancho =
                (
                  Number(
                    actividad.duracionMinutos
                  ) /
                  rango
                ) *
                100;

              const izquierda =
                (
                  (
                    inicioActividad -
                    inicio
                  ) /
                  rango
                ) *
                100;

              return (
                <Box
                  key={actividad.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns:
                      '210px 1fr',
                    gap: 1.5,
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={750}
                      noWrap
                    >
                      {
                        actividad.actividad
                      }
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {
                        actividad.responsable
                      }
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      height: 38,
                      bgcolor:
                        'action.hover',
                      borderRadius: 2,
                      position:
                        'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position:
                          'absolute',
                        left:
                          `${izquierda}%`,
                        width:
                          `${Math.max(
                            ancho,
                            2
                          )}%`,
                        top: 4,
                        bottom: 4,
                        borderRadius: 1.5,
                        bgcolor:
                          normalizar(
                            actividad.estado
                          ) ===
                          'finalizada'
                            ? 'success.main'
                            : normalizar(
                                  actividad.estado
                                ) ===
                                'en curso'
                              ? 'warning.main'
                              : 'primary.main',
                        px: 1,
                        display: 'flex',
                        alignItems:
                          'center',
                        color:
                          'primary.contrastText',
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        noWrap
                      >
                        {formatoHora(
                          actividad.horaInicio
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            }
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

function VistaEnVivo({
  actividades,
  puedeEstado,
  onEstado,
}) {
  const ahora = new Date();

  const diaActual =
    nombreDiaActual();

  const minutosActuales =
    ahora.getHours() *
      60 +
    ahora.getMinutes();

  const actividadesDia =
    actividades
      .filter(
        (item) =>
          item.dia === diaActual &&
          normalizar(
            item.estado
          ) !== 'cancelada'
      )
      .sort(
        (a, b) =>
          minutosDesdeHora(
            a.horaInicio
          ) -
          minutosDesdeHora(
            b.horaInicio
          )
      );

  const actual =
    actividadesDia.find(
      (item) => {
        const inicio =
          minutosDesdeHora(
            item.horaInicio
          );

        const fin =
          minutosDesdeHora(
            item.horaFin
          );

        return (
          minutosActuales >=
            inicio &&
          minutosActuales <
            fin
        );
      }
    ) ||
    actividadesDia.find(
      (item) =>
        normalizar(
          item.estado
        ) === 'en curso'
    );

  const proxima =
    actividadesDia.find(
      (item) =>
        minutosDesdeHora(
          item.horaInicio
        ) >
        minutosActuales
    );

  if (!actual && !proxima) {
    return (
      <Alert severity="info">
        No hay una actividad actual ni próxima para {diaActual}.
      </Alert>
    );
  }

  const restantes =
    actual
      ? Math.max(
          0,
          minutosDesdeHora(
            actual.horaFin
          ) -
            minutosActuales
        )
      : 0;

  const avance =
    actual
      ? Math.min(
          100,
          Math.max(
            0,
            (
              (
                minutosActuales -
                minutosDesdeHora(
                  actual.horaInicio
                )
              ) /
              Number(
                actual.duracionMinutos
              )
            ) *
              100
          )
        )
      : 0;

  return (
    <Grid
      container
      spacing={2}
    >
      <Grid
        size={{
          xs: 12,
          lg: 8,
        }}
      >
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Typography
              variant="overline"
              color="success.main"
              fontWeight={900}
            >
              Actividad actual
            </Typography>

            {actual ? (
              <Stack
                spacing={2}
                mt={1}
              >
                <Typography
                  variant="h4"
                  fontWeight={900}
                >
                  {actual.actividad}
                </Typography>

                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  gap={2}
                >
                  <Typography>
                    <strong>
                      Responsable:
                    </strong>{' '}
                    {
                      actual.responsable
                    }
                  </Typography>

                  <Typography>
                    <strong>
                      Lugar:
                    </strong>{' '}
                    {actual.lugar}
                  </Typography>
                </Stack>

                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={0.75}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {
                        formatoHora(
                          actual.horaInicio
                        )
                      }{' '}
                      –{' '}
                      {
                        formatoHora(
                          actual.horaFin
                        )
                      }
                    </Typography>

                    <Typography
                      fontWeight={850}
                    >
                      {restantes} min restantes
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={avance}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                    }}
                  />
                </Box>

                {puedeEstado && (
                  <Stack
                    direction="row"
                    gap={1}
                  >
                    {normalizar(
                      actual.estado
                    ) !==
                      'en curso' && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={
                          <PlayArrowRounded />
                        }
                        onClick={() =>
                          onEstado(
                            actual,
                            'En curso'
                          )
                        }
                      >
                        Iniciar actividad
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={
                        <StopCircleRounded />
                      }
                      onClick={() =>
                        onEstado(
                          actual,
                          'Finalizada'
                        )
                      }
                    >
                      Finalizar
                    </Button>
                  </Stack>
                )}
              </Stack>
            ) : (
              <Alert
                severity="info"
                sx={{
                  mt: 1,
                }}
              >
                No hay una actividad en curso en este momento.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid
        size={{
          xs: 12,
          lg: 4,
        }}
      >
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Typography
              variant="overline"
              color="primary"
              fontWeight={900}
            >
              Próxima actividad
            </Typography>

            {proxima ? (
              <Stack
                spacing={1}
                mt={1}
              >
                <Typography
                  variant="h5"
                  fontWeight={850}
                >
                  {
                    proxima.actividad
                  }
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {
                    formatoHora(
                      proxima.horaInicio
                    )
                  }
                </Typography>

                <Divider />

                <Typography>
                  {
                    proxima.responsable
                  }
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {proxima.lugar}
                </Typography>
              </Stack>
            ) : (
              <Typography
                mt={1}
                color="text.secondary"
              >
                No hay más actividades programadas para hoy.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function Minutograma() {
  const api = useApi(
    () => obtenerMinutograma(),
    []
  );

  const {
    token,
    autenticado,
    loading: authLoading,
    tienePermiso,
  } = useAuth();

  const [vista, setVista] =
    useState('tabla');

  const [dia, setDia] =
    useState('Viernes');

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [seleccionada, setSeleccionada] =
    useState(null);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const actividades =
    api.data?.items || [];

  const filtradas =
    useMemo(
      () =>
        actividades.filter(
          (item) =>
            !dia ||
            item.dia === dia
        ),
      [
        actividades,
        dia,
      ]
    );

  function puede(permiso) {
    return (
      !authLoading &&
      autenticado &&
      tienePermiso(
        permiso
      )
    );
  }

  const puedeRegistrar =
    puede(
      'REGISTRAR_ACTIVIDAD_MINUTOGRAMA'
    );

  const puedeEditar =
    puede(
      'EDITAR_ACTIVIDAD_MINUTOGRAMA'
    );

  const puedeEstado =
    puede(
      'ACTUALIZAR_ESTADO_MINUTOGRAMA'
    );

  async function guardarActividad(
    datos
  ) {
    setGuardando(true);

    try {
      if (seleccionada) {
        await editarActividadMinutogramaApi(
          token,
          seleccionada.id,
          datos
        );

        setMensaje(
          'Actividad actualizada correctamente.'
        );
      } else {
        await registrarActividadMinutogramaApi(
          token,
          datos
        );

        setMensaje(
          'Actividad registrada correctamente.'
        );
      }

      setDialogOpen(false);
      setSeleccionada(null);
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(
    actividad,
    estado
  ) {
    setGuardando(true);

    try {
      await actualizarEstadoMinutogramaApi(
        token,
        actividad.id,
        estado
      );

      setMensaje(
        `Actividad marcada como ${estado}.`
      );

      await api.reload();
    } finally {
      setGuardando(false);
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
        eyebrow="Operación del retiro"
        title="Minutograma"
        subtitle="Programación, control y seguimiento en tiempo real"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          justifyContent="space-between"
          gap={2}
        >
          <Tabs
            value={vista}
            onChange={(
              _,
              valor
            ) =>
              setVista(valor)
            }
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              value="tabla"
              icon={<ViewListRounded />}
              iconPosition="start"
              label="Tabla"
            />

            <Tab
              value="gantt"
              icon={<TimelineRounded />}
              iconPosition="start"
              label="Cronograma"
            />

            <Tab
              value="vivo"
              icon={<PlayArrowRounded />}
              iconPosition="start"
              label="En vivo"
            />
          </Tabs>

          {puedeRegistrar && (
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => {
                setSeleccionada(null);
                setDialogOpen(true);
              }}
              sx={{
                alignSelf: {
                  xs: 'stretch',
                  md: 'center',
                },
                borderRadius: 2.5,
                minHeight: 42,
                textTransform: 'none',
                fontWeight: 800,
              }}
            >
              Registrar actividad
            </Button>
          )}
        </Stack>

        {vista !== 'vivo' && (
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
          >
            {DIAS.map(
              (item) => (
                <Chip
                  key={item}
                  icon={
                    <CalendarMonthRounded />
                  }
                  label={item}
                  color={
                    dia === item
                      ? 'primary'
                      : 'default'
                  }
                  variant={
                    dia === item
                      ? 'filled'
                      : 'outlined'
                  }
                  onClick={() =>
                    setDia(item)
                  }
                />
              )
            )}
          </Stack>
        )}

        {vista === 'tabla' && (
          <VistaTabla
            actividades={filtradas}
            puedeEditar={
              puedeEditar
            }
            puedeEstado={
              puedeEstado
            }
            onEditar={(
              actividad
            ) => {
              setSeleccionada(
                actividad
              );
              setDialogOpen(true);
            }}
            onEstado={
              cambiarEstado
            }
          />
        )}

        {vista === 'gantt' && (
          <VistaGantt
            actividades={
              actividades
            }
            dia={dia}
          />
        )}

        {vista === 'vivo' && (
          <VistaEnVivo
            actividades={
              actividades
            }
            puedeEstado={
              puedeEstado
            }
            onEstado={
              cambiarEstado
            }
          />
        )}
      </Stack>

      <ActividadDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSeleccionada(null);
        }}
        onSubmit={
          guardarActividad
        }
        actividad={
          seleccionada
        }
        loading={guardando}
      />

      <Snackbar
        open={Boolean(mensaje)}
        autoHideDuration={3500}
        onClose={() =>
          setMensaje('')
        }
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setMensaje('')
          }
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </>
  );
}
