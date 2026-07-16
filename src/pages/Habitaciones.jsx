import {
  Alert,
  Card,
  CardActionArea,
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

import { useMemo, useState } from 'react';

import { obtenerHabitaciones } from '../api/habitacionesApi';
import { useApi } from '../hooks/useApi';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';

function obtenerPiso(habitacion) {
  const piso = String(
    habitacion?.piso ?? ''
  ).trim();

  return piso || 'Sin piso';
}

function compararPisos(a, b) {
  const numeroA = Number(a);
  const numeroB = Number(b);

  if (
    Number.isFinite(numeroA) &&
    Number.isFinite(numeroB)
  ) {
    return numeroA - numeroB;
  }

  return String(a).localeCompare(
    String(b),
    'es'
  );
}

function compararHabitaciones(a, b) {
  const numeroA = Number(a.habitacion);
  const numeroB = Number(b.habitacion);

  if (
    Number.isFinite(numeroA) &&
    Number.isFinite(numeroB)
  ) {
    return numeroA - numeroB;
  }

  return String(
    a.habitacion || ''
  ).localeCompare(
    String(b.habitacion || ''),
    'es'
  );
}

function obtenerDetallePersona(persona) {
  if (!persona) {
    return 'Sin asignar';
  }

  if (persona.tipoPersona === 'Servidor') {
    const detalleServidor = [
      persona.equipo,
      persona.rol,
    ]
      .filter(Boolean)
      .join(' ');

    return `Servidor - ${persona.equipo || 'Sin equipo'} ${persona.rol || 'Sin rol'}`;
  }

  if (persona.tipoPersona === 'Caminante') {
    return persona.mesa
      ? `Caminante - Mesa ${persona.mesa}`
      : 'Caminante - Sin mesa';
  }

  return persona.tipoPersona || 'Sin definir';
}

function colorPersona(persona) {
  if (!persona) {
    return 'default';
  }

  if (persona.tipoPersona === 'Servidor') {
    return 'primary';
  }

  if (persona.tipoPersona === 'Caminante') {
    return 'success';
  }

  return 'default';
}

export default function Habitaciones() {
  const api = useApi(
    () => obtenerHabitaciones(),
    []
  );

  const [selected, setSelected] =
    useState(null);

  const habitaciones =
    api.data?.items || [];

  const habitacionesPorPiso =
    useMemo(() => {
      const grupos = {};

      habitaciones.forEach(
        (habitacion) => {
          const piso =
            obtenerPiso(habitacion);

          if (!grupos[piso]) {
            grupos[piso] = [];
          }

          grupos[piso].push(
            habitacion
          );
        }
      );

      return Object.entries(grupos)
        .sort(([pisoA], [pisoB]) =>
          compararPisos(
            pisoA,
            pisoB
          )
        )
        .map(
          ([
            piso,
            listaHabitaciones,
          ]) => ({
            piso,
            habitaciones:
              listaHabitaciones.sort(
                compararHabitaciones
              ),
          })
        );
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
        subtitle="Asignación de caminantes y servidores"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={4}>
        {habitacionesPorPiso.map(
          (grupo) => (
            <Stack
              key={grupo.piso}
              spacing={2}
            >
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                justifyContent="space-between"
                alignItems={{
                  xs: 'flex-start',
                  sm: 'center',
                }}
                gap={1}
              >
                <Typography
                  variant="h5"
                  fontWeight={900}
                >
                  Piso {grupo.piso}
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {
                    grupo.habitaciones
                      .length
                  }{' '}
                  {grupo.habitaciones
                    .length === 1
                    ? 'habitación'
                    : 'habitaciones'}
                </Typography>
              </Stack>

              <Grid
                container
                spacing={2}
              >
                {grupo.habitaciones.map(
                  (habitacion) => {
                    const persona =
                      habitacion.persona ||
                      habitacion.personas?.[0] ||
                      null;

                    const asignada =
                      Boolean(persona);

                    return (
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
                          sx={{
                            height: '100%',
                          }}
                        >
                          <CardActionArea
                            onClick={() =>
                              setSelected(
                                habitacion
                              )
                            }
                            sx={{
                              height: '100%',
                            }}
                          >
                            <CardContent>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                gap={2}
                              >
                                <div>
                                  <Typography
                                    variant="h5"
                                    fontWeight={900}
                                  >
                                    {
                                      habitacion.habitacion
                                    }
                                  </Typography>

                                  <Typography
                                    color="text.secondary"
                                  >
                                    Piso{' '}
                                    {
                                      habitacion.piso
                                    }
                                  </Typography>
                                </div>

                                <Chip
                                  size="small"
                                  color={
                                    asignada
                                      ? colorPersona(
                                          persona
                                        )
                                      : 'default'
                                  }
                                  label={
                                    asignada
                                      ? 'Asignada'
                                      : 'Disponible'
                                  }
                                  variant={
                                    asignada
                                      ? 'filled'
                                      : 'outlined'
                                  }
                                />
                              </Stack>

                              <LinearProgress
                                variant="determinate"
                                value={
                                  asignada
                                    ? 100
                                    : 0
                                }
                                sx={{
                                  my: 2,
                                  height: 8,
                                  borderRadius: 999,
                                }}
                              />

                              <Typography
                                fontWeight={
                                  asignada
                                    ? 850
                                    : 600
                                }
                                color={
                                  asignada
                                    ? 'text.primary'
                                    : 'text.secondary'
                                }
                              >
                                {persona?.nombre ||
                                  'Sin asignar'}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                mt={0.5}
                              >
                                {obtenerDetallePersona(
                                  persona
                                )}
                              </Typography>

                              {habitacion
                                .conflictoAsignacion && (
                                <Alert
                                  severity="error"
                                  sx={{ mt: 2 }}
                                >
                                  Hay más de una
                                  persona asignada a
                                  esta habitación.
                                </Alert>
                              )}
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  }
                )}
              </Grid>
            </Stack>
          )
        )}
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

        <DialogContent>
          {(() => {
            const persona =
              selected?.persona ||
              selected?.personas?.[0] ||
              null;

            if (!persona) {
              return (
                <Alert severity="info">
                  Esta habitación aún no
                  tiene una persona
                  asignada.
                </Alert>
              );
            }

            return (
              <Stack spacing={1.5}>
                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  {persona.nombre}
                </Typography>

                <Chip
                  color={colorPersona(
                    persona
                  )}
                  label={obtenerDetallePersona(
                    persona
                  )}
                  sx={{
                    alignSelf:
                      'flex-start',
                  }}
                />

                <Typography
                  color="text.secondary"
                >
                  Piso:{' '}
                  {selected?.piso ||
                    'Sin definir'}
                </Typography>

                {selected
                  ?.conflictoAsignacion && (
                  <Alert severity="error">
                    La API encontró{' '}
                    {
                      selected
                        .cantidadAsignados
                    }{' '}
                    personas asignadas a
                    esta habitación. La
                    capacidad permitida es
                    una persona.
                  </Alert>
                )}
              </Stack>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
