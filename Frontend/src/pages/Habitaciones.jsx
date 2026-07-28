import {
  Alert,
  Box,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BedRounded,
  CloseRounded,
  EditRounded,
  GroupsRounded,
  HotelRounded,
  MeetingRoomRounded,
  PersonAddAltRounded,
  PersonRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';

import { obtenerHabitaciones } from '../api/habitacionesApi';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import ProtectedButton from '../components/ProtectedButton';
import AvatarServidor from '../components/servidores/AvatarServidor';
import EditarHabitacionDialog from '../components/habitaciones/EditarHabitacionDialog';
import AsignarPersonaHabitacionDialog from '../components/habitaciones/AsignarPersonaHabitacionDialog';

function compararTextoNumerico(a, b) {
  return String(a).localeCompare(String(b), 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

function colorTipo(tipo) {
  if (tipo === 'Servidor') return 'primary';
  if (tipo === 'Caminante') return 'success';
  if (tipo === 'Mixta') return 'error';
  return 'default';
}

function detallePersona(persona) {
  if (persona?.tipoPersona === 'Servidor') {
    return [
      persona.equipo,
      persona.rol,
      persona.mesa ? `Mesa ${persona.mesa}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  if (persona?.tipoPersona === 'Caminante') {
    return persona.mesa ? `Mesa ${persona.mesa}` : 'Sin mesa';
  }

  return '';
}

function estadoVisual(habitacion) {
  if (!habitacion.activo) {
    return {
      label: 'Inactiva',
      color: 'default',
      border: 'divider',
      background: 'action.hover',
    };
  }

  if (habitacion.conflictoAsignacion) {
    return {
      label: 'Revisar',
      color: 'error',
      border: 'error.main',
      background: 'error.lighter',
    };
  }

  if (habitacion.cuposDisponibles <= 0) {
    return {
      label: 'Completa',
      color: 'success',
      border: 'success.main',
      background: 'success.lighter',
    };
  }

  if (habitacion.ocupantes > 0) {
    return {
      label: 'En ocupación',
      color: 'warning',
      border: 'warning.main',
      background: 'warning.lighter',
    };
  }

  return {
    label: 'Disponible',
    color: 'info',
    border: 'info.main',
    background: 'info.lighter',
  };
}

function CuposHabitacion({ habitacion }) {
  const capacidad = Math.max(Number(habitacion.capacidad) || 0, 0);
  const personas = habitacion.personas || [];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(58px, 1fr))',
        gap: 0.75,
      }}
    >
      {Array.from({ length: capacidad }).map((_, indice) => {
        const persona = personas[indice];

        return (
          <Tooltip
            key={`${habitacion.id || habitacion.habitacion}-cupo-${indice}`}
            title={persona ? `${persona.nombre} · ${persona.tipoPersona}` : 'Cupo disponible'}
            arrow
          >
            <Box
              sx={{
                minHeight: 52,
                px: 0.75,
                py: 0.6,
                border: '1px solid',
                borderColor: persona ? 'divider' : 'success.main',
                borderStyle: persona ? 'solid' : 'dashed',
                borderRadius: 1.25,
                bgcolor: persona ? 'background.paper' : 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                overflow: 'hidden',
              }}
            >
              {persona ? (
                <>
                  <PersonRounded sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                  <Typography variant="caption" fontWeight={800} noWrap>
                    {persona.nombre?.split(' ')[0] || 'Asignado'}
                  </Typography>
                </>
              ) : (
                <>
                  <BedRounded sx={{ fontSize: 17, color: 'success.main' }} />
                  <Typography variant="caption" fontWeight={800} color="success.main">
                    Libre
                  </Typography>
                </>
              )}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

export default function Habitaciones() {
  const { token } = useAuth();
  const api = useApi(() => obtenerHabitaciones(), []);

  const [selected, setSelected] = useState(null);
  const [editar, setEditar] = useState(null);
  const [asignar, setAsignar] = useState(null);

  const habitaciones = api.data?.items || [];

  const bloques = useMemo(() => {
    const mapa = {};

    habitaciones.forEach((habitacion) => {
      const bloque = habitacion.bloque || 'Sin bloque';
      const piso = habitacion.piso || 'Sin piso';

      if (!mapa[bloque]) mapa[bloque] = {};
      if (!mapa[bloque][piso]) mapa[bloque][piso] = [];

      mapa[bloque][piso].push(habitacion);
    });

    return Object.entries(mapa)
      .sort(([a], [b]) => compararTextoNumerico(a, b))
      .map(([bloque, pisos]) => ({
        bloque,
        pisos: Object.entries(pisos)
          .sort(([a], [b]) => compararTextoNumerico(a, b))
          .map(([piso, lista]) => ({
            piso,
            habitaciones: lista.sort((a, b) =>
              compararTextoNumerico(a.habitacion, b.habitacion)
            ),
          })),
      }));
  }, [habitaciones]);

  const resumen = useMemo(() => {
    const capacidad = habitaciones.reduce(
      (total, habitacion) => total + (Number(habitacion.capacidad) || 0),
      0
    );
    const ocupantes = habitaciones.reduce(
      (total, habitacion) => total + (Number(habitacion.ocupantes) || 0),
      0
    );
    const completas = habitaciones.filter(
      (habitacion) => habitacion.activo && habitacion.cuposDisponibles <= 0
    ).length;
    const conflictos = habitaciones.filter(
      (habitacion) => habitacion.conflictoAsignacion
    ).length;

    return {
      capacidad,
      ocupantes,
      disponibles: Math.max(capacidad - ocupantes, 0),
      completas,
      conflictos,
      porcentaje: capacidad ? Math.round((ocupantes / capacidad) * 100) : 0,
    };
  }, [habitaciones]);

  if (api.loading && !api.data) return <LoadingState />;

  if (api.error) {
    return <ErrorState message={api.error} onRetry={api.reload} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Alojamiento"
        title="Plano de habitaciones"
        subtitle="Vista espacial por bloque, piso y capacidad"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: { xs: 1.5, md: 2 },
          borderRadius: 2,
          background:
            'linear-gradient(135deg, rgba(25,118,210,0.06), rgba(255,255,255,0))',
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          {[
            ['Habitaciones', habitaciones.length, <MeetingRoomRounded />],
            ['Ocupación', `${resumen.ocupantes}/${resumen.capacidad}`, <GroupsRounded />],
            ['Cupos libres', resumen.disponibles, <BedRounded />],
            ['Completas', resumen.completas, <HotelRounded />],
          ].map(([label, value, icon]) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
                <Box>
                  <Typography variant="h6" fontWeight={900} lineHeight={1}>
                    {value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" spacing={1.5} alignItems="center" mt={1.5}>
          <LinearProgress
            variant="determinate"
            value={resumen.porcentaje}
            sx={{ flex: 1, height: 7, borderRadius: 999 }}
          />
          <Typography variant="body2" fontWeight={850}>
            {resumen.porcentaje}% ocupado
          </Typography>
        </Stack>

        {resumen.conflictos > 0 && (
          <Alert severity="warning" icon={<WarningAmberRounded />} sx={{ mt: 1.5 }}>
            {resumen.conflictos} habitación{resumen.conflictos === 1 ? '' : 'es'} requieren revisión.
          </Alert>
        )}
      </Paper>

      <Stack spacing={2.5}>
        {bloques.map((grupoBloque) => (
          <Box key={grupoBloque.bloque}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <HotelRounded color="primary" />
              <Typography variant="h5" fontWeight={900}>
                {grupoBloque.bloque}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`${grupoBloque.pisos.length} ${grupoBloque.pisos.length === 1 ? 'piso' : 'pisos'}`}
              />
            </Stack>

            <Stack spacing={2}>
              {grupoBloque.pisos.map((grupoPiso) => (
                <Paper
                  key={`${grupoBloque.bloque}-${grupoPiso.piso}`}
                  variant="outlined"
                  sx={{ p: { xs: 1.25, md: 1.75 }, borderRadius: 2 }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    gap={0.75}
                    mb={1.25}
                  >
                    <Box>
                      <Typography variant="overline" color="text.secondary" fontWeight={800}>
                        Nivel
                      </Typography>
                      <Typography variant="h6" fontWeight={900} lineHeight={1.1}>
                        Piso {grupoPiso.piso}
                      </Typography>
                    </Box>
                    <Chip size="small" label={`${grupoPiso.habitaciones.length} habitaciones`} />
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        lg: 'repeat(3, minmax(0, 1fr))',
                      },
                      gap: 1.25,
                    }}
                  >
                    {grupoPiso.habitaciones.map((habitacion) => {
                      const visual = estadoVisual(habitacion);

                      return (
                        <Paper
                          key={habitacion.id || habitacion.habitacion}
                          variant="outlined"
                          onClick={() => setSelected(habitacion)}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            borderColor: visual.border,
                            bgcolor: visual.background,
                            opacity: habitacion.activo ? 1 : 0.68,
                            cursor: 'pointer',
                            transition: 'transform .15s ease, box-shadow .15s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                            },
                          }}
                        >
                          <Stack spacing={1.1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                              <Box>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>
                                  Habitación
                                </Typography>
                                <Typography variant="h5" fontWeight={950} lineHeight={1}>
                                  {habitacion.habitacion}
                                </Typography>
                              </Box>
                              <Chip size="small" color={visual.color} label={visual.label} />
                            </Stack>

                            <Stack direction="row" gap={0.6} flexWrap="wrap">
                              <Chip size="small" color={colorTipo(habitacion.tipo)} label={habitacion.tipo} />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`${habitacion.ocupantes}/${habitacion.capacidad}`}
                              />
                            </Stack>

                            <CuposHabitacion habitacion={habitacion} />

                            <Divider />

                            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                              <Typography variant="caption" color="text.secondary">
                                {habitacion.cuposDisponibles > 0
                                  ? `${habitacion.cuposDisponibles} cupos disponibles`
                                  : 'Sin cupos disponibles'}
                              </Typography>

                              <Stack direction="row" spacing={0.5} onClick={(event) => event.stopPropagation()}>
                                <ProtectedButton
                                  permiso="HABITACIONES_ASIGNAR_PERSONA"
                                  size="small"
                                  variant="text"
                                  startIcon={<EditRounded />}
                                  onClick={() => setEditar(habitacion)}
                                >
                                  Editar
                                </ProtectedButton>
                                <ProtectedButton
                                  permiso="HABITACIONES_ASIGNAR_PERSONA"
                                  size="small"
                                  variant="contained"
                                  startIcon={<PersonAddAltRounded />}
                                  onClick={() => setAsignar(habitacion)}
                                  disabled={!habitacion.activo || habitacion.cuposDisponibles <= 0}
                                >
                                  Asignar
                                </ProtectedButton>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 430 },
            p: 0,
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Detalle de alojamiento
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                Habitación {selected?.habitacion}
              </Typography>
            </Box>
            <IconButton onClick={() => setSelected(null)} aria-label="Cerrar detalle">
              <CloseRounded />
            </IconButton>
          </Stack>

          <Divider />

          <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
            <Stack spacing={2}>
              <Stack direction="row" gap={0.75} flexWrap="wrap">
                <Chip label={`Bloque: ${selected?.bloque}`} />
                <Chip label={`Piso: ${selected?.piso}`} />
                <Chip color={colorTipo(selected?.tipo)} label={`Tipo: ${selected?.tipo}`} />
                <Chip variant="outlined" label={`Capacidad: ${selected?.capacidad}`} />
              </Stack>

              {selected && <CuposHabitacion habitacion={selected} />}

              <Divider />

              <Typography variant="subtitle1" fontWeight={900}>
                Personas asignadas
              </Typography>

              {selected?.personas?.length ? (
                selected.personas.map((persona, indice) => (
                  <Stack
                    key={`detalle-${persona.tipoPersona}-${persona.id || persona.nombre}-${indice}`}
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{
                      p: 1.25,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                    }}
                  >
                    <AvatarServidor
                      servidor={persona.tipoPersona === 'Servidor' ? persona : undefined}
                      nombre={persona.nombre}
                      fotoPerfilUrl={persona.fotoPerfilUrl}
                      size={48}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={850} noWrap>
                        {persona.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {persona.tipoPersona}
                        {detallePersona(persona) ? ` · ${detallePersona(persona)}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                ))
              ) : (
                <Alert severity="info">Esta habitación todavía no tiene personas asignadas.</Alert>
              )}

              {selected?.observaciones && <Alert severity="info">{selected.observaciones}</Alert>}
              {selected?.conflictoAsignacion && (
                <Alert severity="error">
                  Revise la ocupación o el tipo de personas asignadas.
                </Alert>
              )}
            </Stack>
          </Box>

          <Divider />

          <Stack direction="row" spacing={1} p={2}>
            <ProtectedButton
              permiso="HABITACIONES_ASIGNAR_PERSONA"
              fullWidth
              variant="outlined"
              startIcon={<EditRounded />}
              onClick={() => {
                setEditar(selected);
                setSelected(null);
              }}
            >
              Editar
            </ProtectedButton>
            <ProtectedButton
              permiso="HABITACIONES_ASIGNAR_PERSONA"
              fullWidth
              variant="contained"
              startIcon={<PersonAddAltRounded />}
              onClick={() => {
                setAsignar(selected);
                setSelected(null);
              }}
              disabled={!selected?.activo || selected?.cuposDisponibles <= 0}
            >
              Asignar persona
            </ProtectedButton>
          </Stack>
        </Stack>
      </Drawer>


      <EditarHabitacionDialog
        open={Boolean(editar)}
        habitacion={editar}
        token={token}
        onClose={() => setEditar(null)}
        onSaved={async () => {
          setEditar(null);
          await api.reload();
        }}
      />

      <AsignarPersonaHabitacionDialog
        open={Boolean(asignar)}
        habitacion={asignar}
        token={token}
        onClose={() => setAsignar(null)}
        onSaved={async () => {
          setAsignar(null);
          await api.reload();
        }}
      />
    </>
  );
}
