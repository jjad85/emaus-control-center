import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  AddRounded,
  BedRounded,
  EditRounded,
  MailRounded,
  PaymentsRounded,
  PhotoRounded,
  SearchRounded,
  TableRestaurantRounded,
} from '@mui/icons-material';

import {
  useMemo,
  useState,
} from 'react';

import {
  asignarHabitacionCaminanteApi,
  asignarMesaCaminanteApi,
  actualizarCartaCaminanteApi,
  actualizarFotoCaminanteApi,
  actualizarPagoCaminanteApi,
  editarCaminanteApi,
  obtenerCaminantes,
  obtenerOpcionesRegistroCaminante,
  registrarCaminanteApi,
} from '../api/caminantesApi';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import ProtectedButton from '../components/ProtectedButton';

import CaminanteFormDialog from '../components/caminantes/CaminanteFormDialog';
import CaminanteActionDialog from '../components/caminantes/CaminanteActionDialog';

const ESTADOS_PAGO = [
  'Pendiente',
  'Pago Parcial',
  'Pago Total',
];

const ESTADOS_ENTREGABLES = [
  'Pendiente',
  'En Proceso',
  'Completado',
];

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

export default function Caminantes() {
  const api = useApi(
    () => obtenerCaminantes(),
    []
  );

  const {
    token,
    autenticado,
    loading: authLoading,
    tienePermiso,
  } = useAuth();

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroPago, setFiltroPago] =
    useState('');

  const [
    opciones,
    setOpciones,
  ] = useState(null);

  const [
    cargandoOpciones,
    setCargandoOpciones,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    modoForm,
    setModoForm,
  ] = useState('crear');

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    actionDialog,
    setActionDialog,
  ] = useState(null);

  const [
    mensaje,
    setMensaje,
  ] = useState('');

  const items =
    api.data?.items || [];

  const filtrados = useMemo(
    () =>
      items.filter(
        (item) => {
          const coincideBusqueda =
            !busqueda ||
            normalizar(
              item.nombre
            ).includes(
              normalizar(
                busqueda
              )
            ) ||
            String(
              item.telefono || ''
            ).includes(
              busqueda
            );

          const coincidePago =
            !filtroPago ||
            normalizar(
              item.estadoPago
            ) ===
              normalizar(
                filtroPago
              );

          return (
            coincideBusqueda &&
            coincidePago
          );
        }
      ),
    [
      items,
      busqueda,
      filtroPago,
    ]
  );

  function puede(permiso) {
    return (
      !authLoading &&
      autenticado &&
      tienePermiso(permiso)
    );
  }

  async function cargarOpciones() {
    if (!token) {
      return null;
    }

    setCargandoOpciones(true);

    try {
      const datos =
        await obtenerOpcionesRegistroCaminante(
          token
        );

      setOpciones(datos);
      return datos;
    } finally {
      setCargandoOpciones(false);
    }
  }

  async function abrirRegistro() {
    await cargarOpciones();
    setSelected(null);
    setModoForm('crear');
    setFormOpen(true);
  }

  async function abrirEdicion(
    caminante
  ) {
    await cargarOpciones();
    setSelected(caminante);
    setModoForm('editar');
    setFormOpen(true);
  }

  async function guardarFormulario(
    datos
  ) {
    setGuardando(true);

    try {
      if (
        modoForm === 'crear'
      ) {
        await registrarCaminanteApi(
          token,
          datos
        );

        setMensaje(
          'Caminante registrado correctamente.'
        );
      } else {
        await editarCaminanteApi(
          token,
          selected.id,
          datos
        );

        setMensaje(
          'Caminante actualizado correctamente.'
        );
      }

      setFormOpen(false);
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  function abrirAccion(
    tipo,
    caminante
  ) {
    setSelected(caminante);
    setActionDialog(tipo);
  }

  async function guardarAccion(
    valor
  ) {
    setGuardando(true);

    try {
      if (
        actionDialog === 'pago'
      ) {
        await actualizarPagoCaminanteApi(
          token,
          selected.id,
          valor
        );
      }

      if (
        actionDialog === 'mesa'
      ) {
        await asignarMesaCaminanteApi(
          token,
          selected.id,
          valor
        );
      }

      if (
        actionDialog === 'habitacion'
      ) {
        await asignarHabitacionCaminanteApi(
          token,
          selected.id,
          valor
        );
      }

      if (
        actionDialog === 'carta'
      ) {
        await actualizarCartaCaminanteApi(
          token,
          selected.id,
          valor
        );
      }

      if (
        actionDialog === 'foto'
      ) {
        await actualizarFotoCaminanteApi(
          token,
          selected.id,
          valor
        );
      }

      setActionDialog(null);
      setMensaje(
        'Cambio guardado correctamente.'
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

  const mesasOpciones = [
    {
      valor: '',
      etiqueta:
        'Pendiente por definir',
    },
    ...(opciones?.mesasDisponibles ||
      []).map((mesa) => ({
      valor:
        String(mesa.numero),
      etiqueta:
        mesa.etiqueta ||
        `Mesa ${mesa.numero}`,
    })),
  ];

  const habitacionesOpciones = [
    {
      valor: '',
      etiqueta:
        'Pendiente por definir',
    },
    ...(opciones
      ?.habitacionesDisponibles ||
      []).map((habitacion) => ({
      valor:
        String(
          habitacion.habitacion
        ),
      etiqueta:
        habitacion.etiqueta ||
        `Habitación ${habitacion.habitacion}`,
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Inscripciones"
        title="Caminantes"
        subtitle={`${items.length} registros`}
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
          <Stack
            direction={{
              xs: 'column',
              sm: 'row',
            }}
            gap={1.5}
            flex={1}
          >
            <TextField
              placeholder="Buscar por nombre o teléfono"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              sx={{
                minWidth: {
                  sm: 320,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Estado de pago"
              value={filtroPago}
              onChange={(e) =>
                setFiltroPago(
                  e.target.value
                )
              }
              sx={{
                minWidth: 190,
              }}
            >
              <MenuItem value="">
                Todos
              </MenuItem>

              {ESTADOS_PAGO.map(
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
          </Stack>

          <ProtectedButton
            permiso="REGISTRAR_CAMINANTE"
            variant="contained"
            startIcon={<AddRounded />}
            onClick={abrirRegistro}
            sx={{
              minHeight: 42,
              borderRadius: 2.5,
              px: 2.5,
              fontWeight: 800,
              textTransform: 'none',
            }}
          >
            Registrar caminante
          </ProtectedButton>
        </Stack>

        {!autenticado && (
          <Alert severity="info">
            Está en modo consulta. Inicie sesión para registrar o modificar información.
          </Alert>
        )}

        <Grid
          container
          spacing={2}
        >
          {filtrados.map(
            (caminante) => (
              <Grid
                key={caminante.id}
                size={{
                  xs: 12,
                  md: 6,
                  xl: 4,
                }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection:
                      'column',
                  }}
                >
                  <CardContent
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={850}
                        >
                          {caminante.nombre}
                        </Typography>

                        <Typography
                          color="text.secondary"
                        >
                          {caminante.telefono ||
                            'Sin teléfono'}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <StatusChip
                          value={
                            caminante.estadoPago
                          }
                        />

                        <Chip
                          size="small"
                          label={
                            caminante.mesa
                              ? `Mesa ${caminante.mesa}`
                              : 'Sin mesa'
                          }
                          variant="outlined"
                        />

                        <Chip
                          size="small"
                          label={
                            caminante.habitacion
                              ? `Hab. ${caminante.habitacion}`
                              : 'Sin habitación'
                          }
                          variant="outlined"
                        />
                      </Stack>

                      <Stack
                        direction="row"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <Chip
                          size="small"
                          icon={<MailRounded />}
                          label={`Carta: ${
                            caminante.entregables
                              ?.carta ||
                            'Pendiente'
                          }`}
                        />

                        <Chip
                          size="small"
                          icon={<PhotoRounded />}
                          label={`Foto: ${
                            caminante.entregables
                              ?.foto ||
                            'Pendiente'
                          }`}
                        />
                      </Stack>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Contacto
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={700}
                        >
                          {caminante.contacto
                            ?.nombre ||
                            'Sin contacto'}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {caminante.contacto
                            ?.telefono ||
                            ''}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <CardActions
                    sx={{
                      px: 2,
                      pb: 2,
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    {puede(
                      'EDITAR_CAMINANTE'
                    ) && (
                      <Button
                        size="small"
                        startIcon={
                          <EditRounded />
                        }
                        onClick={() =>
                          abrirEdicion(
                            caminante
                          )
                        }
                      >
                        Editar
                      </Button>
                    )}

                    {puede(
                      'ACTUALIZAR_PAGO'
                    ) && (
                      <Button
                        size="small"
                        startIcon={
                          <PaymentsRounded />
                        }
                        onClick={() =>
                          abrirAccion(
                            'pago',
                            caminante
                          )
                        }
                      >
                        Pago
                      </Button>
                    )}

                    {puede(
                      'ASIGNAR_MESA'
                    ) && (
                      <Button
                        size="small"
                        startIcon={
                          <TableRestaurantRounded />
                        }
                        onClick={async () => {
                          await cargarOpciones();
                          abrirAccion(
                            'mesa',
                            caminante
                          );
                        }}
                      >
                        Mesa
                      </Button>
                    )}

                    {puede(
                      'ASIGNAR_HABITACION'
                    ) && (
                      <Button
                        size="small"
                        startIcon={
                          <BedRounded />
                        }
                        onClick={async () => {
                          await cargarOpciones();
                          abrirAccion(
                            'habitacion',
                            caminante
                          );
                        }}
                      >
                        Habitación
                      </Button>
                    )}

                    {puede(
                      'ACTUALIZAR_CARTA'
                    ) && (
                      <Button
                        size="small"
                        startIcon={
                          <MailRounded />
                        }
                        onClick={() =>
                          abrirAccion(
                            'carta',
                            caminante
                          )
                        }
                      >
                        Carta
                      </Button>
                    )}

                    {puede(
                      'ACTUALIZAR_FOTO'
                    ) && (
                      <Button
                        size="small"
                        startIcon={
                          <PhotoRounded />
                        }
                        onClick={() =>
                          abrirAccion(
                            'foto',
                            caminante
                          )
                        }
                      >
                        Foto
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            )
          )}
        </Grid>

        {filtrados.length === 0 && (
          <Alert severity="info">
            No hay caminantes que coincidan con los filtros.
          </Alert>
        )}
      </Stack>

      <CaminanteFormDialog
        open={formOpen}
        onClose={() =>
          setFormOpen(false)
        }
        onSubmit={
          guardarFormulario
        }
        loading={
          guardando ||
          cargandoOpciones
        }
        opciones={opciones}
        caminante={selected}
        modo={modoForm}
      />

      <CaminanteActionDialog
        open={
          Boolean(actionDialog)
        }
        onClose={() =>
          setActionDialog(null)
        }
        onSubmit={guardarAccion}
        loading={guardando}
        titulo={
          actionDialog === 'pago'
            ? 'Actualizar pago'
            : actionDialog === 'mesa'
              ? 'Asignar mesa'
              : actionDialog ===
                  'habitacion'
                ? 'Asignar habitación'
                : actionDialog ===
                    'carta'
                  ? 'Actualizar carta'
                  : 'Actualizar foto'
        }
        descripcion={
          selected
            ? selected.nombre
            : ''
        }
        label={
          actionDialog === 'pago'
            ? 'Estado del pago'
            : actionDialog === 'mesa'
              ? 'Mesa'
              : actionDialog ===
                  'habitacion'
                ? 'Habitación'
                : actionDialog ===
                    'carta'
                  ? 'Estado de la carta'
                  : 'Estado de la foto'
        }
        valorInicial={
          actionDialog === 'pago'
            ? selected?.estadoPago
            : actionDialog === 'mesa'
              ? selected?.mesa
              : actionDialog ===
                  'habitacion'
                ? selected?.habitacion
                : actionDialog ===
                    'carta'
                  ? selected
                      ?.entregables?.carta
                  : selected
                      ?.entregables?.foto
        }
        opciones={
          actionDialog === 'pago'
            ? ESTADOS_PAGO
            : actionDialog === 'mesa'
              ? mesasOpciones
              : actionDialog ===
                  'habitacion'
                ? habitacionesOpciones
                : ESTADOS_ENTREGABLES
        }
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
