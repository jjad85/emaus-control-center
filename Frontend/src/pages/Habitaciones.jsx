import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  EditRounded,
  ExpandMoreRounded,
  HotelRounded,
  PersonAddAltRounded,
} from '@mui/icons-material';
import {
  useMemo,
  useState,
} from 'react';

import {
  obtenerHabitaciones,
} from '../api/habitacionesApi';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import ProtectedButton from '../components/ProtectedButton';
import AvatarServidor from '../components/servidores/AvatarServidor';
import EditarHabitacionDialog from '../components/habitaciones/EditarHabitacionDialog';
import AsignarPersonaHabitacionDialog from '../components/habitaciones/AsignarPersonaHabitacionDialog';

function compararTextoNumerico(
  a,
  b
) {
  return String(a).localeCompare(
    String(b),
    'es',
    {
      numeric: true,
      sensitivity: 'base',
    }
  );
}

function colorTipo(tipo) {
  if (tipo === 'Servidor') {
    return 'primary';
  }

  if (tipo === 'Caminante') {
    return 'success';
  }

  if (tipo === 'Mixta') {
    return 'error';
  }

  return 'default';
}

function detallePersona(persona) {
  if (
    persona?.tipoPersona ===
    'Servidor'
  ) {
    return [
      persona.equipo,
      persona.rol,
      persona.mesa
        ? `Mesa ${persona.mesa}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  if (
    persona?.tipoPersona ===
    'Caminante'
  ) {
    return persona.mesa
      ? `Mesa ${persona.mesa}`
      : 'Sin mesa';
  }

  return '';
}

export default function Habitaciones() {
  const { token } = useAuth();

  const api = useApi(
    () => obtenerHabitaciones(),
    []
  );

  const [selected, setSelected] =
    useState(null);

  const [editar, setEditar] =
    useState(null);

  const [asignar, setAsignar] =
    useState(null);

  const habitaciones =
    api.data?.items || [];

  const bloques = useMemo(() => {
    const mapa = {};

    habitaciones.forEach(
      (habitacion) => {
        const bloque =
          habitacion.bloque ||
          'Sin bloque';

        const piso =
          habitacion.piso ||
          'Sin piso';

        if (!mapa[bloque]) {
          mapa[bloque] = {};
        }

        if (!mapa[bloque][piso]) {
          mapa[bloque][piso] = [];
        }

        mapa[bloque][piso].push(
          habitacion
        );
      }
    );

    return Object.entries(mapa)
      .sort(([a], [b]) =>
        compararTextoNumerico(a, b)
      )
      .map(([bloque, pisos]) => ({
        bloque,
        pisos:
          Object.entries(pisos)
            .sort(([a], [b]) =>
              compararTextoNumerico(
                a,
                b
              )
            )
            .map(
              ([
                piso,
                lista,
              ]) => ({
                piso,
                habitaciones:
                  lista.sort(
                    (a, b) =>
                      compararTextoNumerico(
                        a.habitacion,
                        b.habitacion
                      )
                  ),
              })
            ),
      }));
  }, [habitaciones]);

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
        eyebrow="Alojamiento"
        title="Habitaciones"
        subtitle={`${habitaciones.length} habitaciones organizadas por bloque y piso`}
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2}>
        {bloques.map((grupoBloque) => (
          <Accordion
            key={grupoBloque.bloque}
            defaultExpanded
            disableGutters
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px !important',
              overflow: 'hidden',
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreRounded />
              }
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <HotelRounded
                  color="primary"
                />

                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                  >
                    {grupoBloque.bloque}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {
                      grupoBloque.pisos
                        .length
                    }{' '}
                    {grupoBloque.pisos
                      .length === 1
                      ? 'piso'
                      : 'pisos'}
                  </Typography>
                </Box>
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Stack spacing={1.5}>
                {grupoBloque.pisos.map(
                  (grupoPiso) => (
                    <Accordion
                      key={`${grupoBloque.bloque}-${grupoPiso.piso}`}
                      defaultExpanded
                      disableGutters
                      variant="outlined"
                      sx={{
                        borderRadius:
                          '12px !important',
                        '&:before': {
                          display: 'none',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <ExpandMoreRounded />
                        }
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          width="100%"
                          pr={1}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={850}
                          >
                            Piso{' '}
                            {grupoPiso.piso}
                          </Typography>

                          <Chip
                            size="small"
                            label={`${grupoPiso.habitaciones.length} habitaciones`}
                          />
                        </Stack>
                      </AccordionSummary>

                      <AccordionDetails>
                        <Grid
                          container
                          spacing={2}
                        >
                          {grupoPiso.habitaciones.map(
                            (habitacion) => (
                              <Grid
                                key={
                                  habitacion.id ||
                                  habitacion.habitacion
                                }
                                size={{
                                  xs: 12,
                                  sm: 6,
                                  lg: 4,
                                }}
                              >
                                <Card
                                  variant="outlined"
                                  sx={{
                                    height:
                                      '100%',
                                    display:
                                      'flex',
                                    flexDirection:
                                      'column',
                                    opacity:
                                      habitacion.activo
                                        ? 1
                                        : 0.65,
                                  }}
                                >
                                  <CardActionArea
                                    onClick={() =>
                                      setSelected(
                                        habitacion
                                      )
                                    }
                                    sx={{
                                      flex: 1,
                                    }}
                                  >
                                    <CardContent>
                                      <Stack spacing={1.5}>
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="flex-start"
                                          gap={1}
                                        >
                                          <Box>
                                            <Typography
                                              variant="h5"
                                              fontWeight={900}
                                            >
                                              Habitación{' '}
                                              {
                                                habitacion.habitacion
                                              }
                                            </Typography>

                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              Piso{' '}
                                              {
                                                habitacion.piso
                                              }
                                            </Typography>
                                          </Box>

                                          <Chip
                                            size="small"
                                            color={
                                              habitacion.activo
                                                ? 'success'
                                                : 'default'
                                            }
                                            variant="outlined"
                                            label={
                                              habitacion.estado
                                            }
                                          />
                                        </Stack>

                                        <Stack
                                          direction="row"
                                          gap={0.75}
                                          flexWrap="wrap"
                                        >
                                          <Chip
                                            size="small"
                                            color={colorTipo(
                                              habitacion.tipo
                                            )}
                                            label={
                                              habitacion.tipo
                                            }
                                          />

                                          <Chip
                                            size="small"
                                            variant="outlined"
                                            label={`${habitacion.ocupantes}/${habitacion.capacidad} personas`}
                                          />
                                        </Stack>

                                        <LinearProgress
                                          variant="determinate"
                                          value={
                                            habitacion.porcentajeOcupacion
                                          }
                                          sx={{
                                            height: 8,
                                            borderRadius:
                                              999,
                                          }}
                                        />

                                        <Stack spacing={1}>
                                          {habitacion.personas
                                            .length ? (
                                            habitacion.personas.map(
                                              (
                                                persona,
                                                indice
                                              ) => (
                                                <Stack
                                                  key={`${persona.tipoPersona}-${persona.id || persona.nombre}-${indice}`}
                                                  direction="row"
                                                  spacing={1}
                                                  alignItems="center"
                                                >
                                                  <AvatarServidor
                                                    servidor={
                                                      persona.tipoPersona ===
                                                      'Servidor'
                                                        ? persona
                                                        : undefined
                                                    }
                                                    nombre={
                                                      persona.nombre
                                                    }
                                                    fotoPerfilUrl={
                                                      persona.fotoPerfilUrl
                                                    }
                                                    size={40}
                                                  />

                                                  <Box
                                                    sx={{
                                                      minWidth:
                                                        0,
                                                    }}
                                                  >
                                                    <Typography
                                                      fontWeight={800}
                                                      noWrap
                                                    >
                                                      {
                                                        persona.nombre
                                                      }
                                                    </Typography>

                                                    <Typography
                                                      variant="caption"
                                                      color="text.secondary"
                                                    >
                                                      {
                                                        persona.tipoPersona
                                                      }
                                                      {detallePersona(
                                                        persona
                                                      )
                                                        ? ` · ${detallePersona(
                                                            persona
                                                          )}`
                                                        : ''}
                                                    </Typography>
                                                  </Box>
                                                </Stack>
                                              )
                                            )
                                          ) : (
                                            <Typography
                                              color="text.secondary"
                                            >
                                              Sin personas asignadas
                                            </Typography>
                                          )}
                                        </Stack>

                                        {habitacion.observaciones && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {
                                              habitacion.observaciones
                                            }
                                          </Typography>
                                        )}

                                        {habitacion.conflictoAsignacion && (
                                          <Alert severity="error">
                                            Revise la ocupación o el tipo de personas asignadas.
                                          </Alert>
                                        )}
                                      </Stack>
                                    </CardContent>
                                  </CardActionArea>

                                  <CardActions
                                    sx={{
                                      px: 2,
                                      pb: 2,
                                      pt: 0,
                                      gap: 1,
                                      flexWrap:
                                        'wrap',
                                    }}
                                  >
                                    <ProtectedButton
                                      permiso="ASIGNAR_HABITACION"
                                      size="small"
                                      variant="outlined"
                                      startIcon={
                                        <EditRounded />
                                      }
                                      onClick={() =>
                                        setEditar(
                                          habitacion
                                        )
                                      }
                                    >
                                      Editar
                                    </ProtectedButton>

                                    <ProtectedButton
                                      permiso="ASIGNAR_HABITACION"
                                      size="small"
                                      variant="contained"
                                      startIcon={
                                        <PersonAddAltRounded />
                                      }
                                      onClick={() =>
                                        setAsignar(
                                          habitacion
                                        )
                                      }
                                      disabled={
                                        !habitacion.activo ||
                                        habitacion.cuposDisponibles <=
                                          0
                                      }
                                    >
                                      Asignar persona
                                    </ProtectedButton>
                                  </CardActions>
                                </Card>
                              </Grid>
                            )
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      <Dialog
        open={Boolean(selected)}
        onClose={() =>
          setSelected(null)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Habitación{' '}
          {selected?.habitacion}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack
              direction="row"
              gap={0.75}
              flexWrap="wrap"
            >
              <Chip
                label={`Bloque: ${selected?.bloque}`}
              />
              <Chip
                label={`Piso: ${selected?.piso}`}
              />
              <Chip
                color={colorTipo(
                  selected?.tipo
                )}
                label={`Tipo: ${selected?.tipo}`}
              />
              <Chip
                variant="outlined"
                label={`Capacidad: ${selected?.capacidad}`}
              />
            </Stack>

            {selected?.personas?.length ? (
              selected.personas.map(
                (persona, indice) => (
                  <Stack
                    key={`detalle-${persona.tipoPersona}-${persona.id || persona.nombre}-${indice}`}
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor:
                        'divider',
                      borderRadius: 2,
                    }}
                  >
                    <AvatarServidor
                      servidor={
                        persona.tipoPersona ===
                        'Servidor'
                          ? persona
                          : undefined
                      }
                      nombre={
                        persona.nombre
                      }
                      fotoPerfilUrl={
                        persona.fotoPerfilUrl
                      }
                      size={52}
                    />

                    <Box>
                      <Typography
                        fontWeight={850}
                      >
                        {persona.nombre}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {persona.tipoPersona}
                        {detallePersona(
                          persona
                        )
                          ? ` · ${detallePersona(
                              persona
                            )}`
                          : ''}
                      </Typography>
                    </Box>
                  </Stack>
                )
              )
            ) : (
              <Alert severity="info">
                Esta habitación todavía
                no tiene personas asignadas.
              </Alert>
            )}

            {selected?.observaciones && (
              <Alert severity="info">
                {selected.observaciones}
              </Alert>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      <EditarHabitacionDialog
        open={Boolean(editar)}
        habitacion={editar}
        token={token}
        onClose={() =>
          setEditar(null)
        }
        onSaved={async () => {
          setEditar(null);
          await api.reload();
        }}
      />

      <AsignarPersonaHabitacionDialog
        open={Boolean(asignar)}
        habitacion={asignar}
        token={token}
        onClose={() =>
          setAsignar(null)
        }
        onSaved={async () => {
          setAsignar(null);
          await api.reload();
        }}
      />
    </>
  );
}
