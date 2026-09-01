import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  Snackbar,
} from '@mui/material';
import { useState } from 'react';
import PersonAddAltRounded from '@mui/icons-material/PersonAddAltRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import Groups2Rounded from '@mui/icons-material/Groups2Rounded';
import EventSeatRounded from '@mui/icons-material/EventSeatRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import AssignmentTurnedInRounded from '@mui/icons-material/AssignmentTurnedInRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { obtenerMesas, exportarCaminantesMesaApi, desasignarCaminanteMesa } from '../api/mesasApi';
import { useAuth } from '../auth/AuthContext';
import ProtectedButton from '../components/ProtectedButton';
import AsignarCaminantesMesaDialog from '../components/mesas/AsignarCaminantesMesaDialog';
import LiberarMesaDialog from '../components/mesas/LiberarMesaDialog';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import AvatarServidor from '../components/servidores/AvatarServidor';
import CaminanteDetalleDialog from '../components/caminantes/CaminanteDetalleDialog';
import { descargarCaminantesMesaExcel } from '../utils/excelMesas';

function ServidorMesa({ etiqueta, servidor, compact = false }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
      <AvatarServidor servidor={servidor} size={compact ? 34 : 44} />
      <Box minWidth={0}>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          {etiqueta}
        </Typography>
        <Typography fontWeight={850} noWrap variant={compact ? 'body2' : 'body1'}>
          {servidor?.nombre || 'Sin asignar'}
        </Typography>
      </Box>
    </Stack>
  );
}

function PersonaFueraDeRango({ persona }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <AvatarServidor
        servidor={persona.tipoPersona === 'Servidor' ? persona : undefined}
        nombre={persona.nombre}
        fotoPerfilUrl={persona.fotoPerfilUrl}
        size={34}
      />
      <Box>
        <Typography variant="body2" fontWeight={800}>{persona.nombre}</Typography>
        <Typography variant="caption" color="text.secondary">
          {persona.tipoPersona}{persona.rol ? ` · ${persona.rol}` : ''}
        </Typography>
      </Box>
    </Stack>
  );
}

function MetricStrip({ items }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        mb: 2.5,
      }}
    >
      {items.map((item, index) => (
        <Stack
          key={item.label}
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            p: 1.6,
            borderRight: { xs: index % 2 === 0 ? '1px solid' : 'none', md: index < items.length - 1 ? '1px solid' : 'none' },
            borderBottom: { xs: index < 2 ? '1px solid' : 'none', md: 'none' },
            borderColor: 'divider',
          }}
        >
          <Box sx={{ color: item.color || 'primary.main', display: 'grid', placeItems: 'center' }}>{item.icon}</Box>
          <Box>
            <Typography fontWeight={950} fontSize="1.15rem" lineHeight={1}>{item.value}</Typography>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
          </Box>
        </Stack>
      ))}
    </Box>
  );
}

function MesaVisual({ mesa, onOpen, onAssign }) {
  const capacidad = Number(mesa.capacidad || 0);
  const caminantes = mesa.caminantes || [];
  const puestosVisibles = Math.max(4, Math.min(capacidad || 8, 10));
  const ocupacion = Math.min(Number(mesa.porcentajeOcupacion || 0), 100);
  const completa = capacidad > 0 && caminantes.length >= capacidad;
  const sinLiderazgo = !mesa.lider || !mesa.colider;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(mesa)}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(mesa); }}
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 390,
        border: '1px solid',
        borderColor: completa ? 'success.main' : sinLiderazgo ? 'warning.main' : 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: '160ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4, borderColor: 'primary.main' },
        '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.light' },
      }}
    >
      <Box sx={{ p: 1.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={900}>SALÓN · MESA</Typography>
          <Typography variant="h5" fontWeight={950}>Mesa {mesa.numero}</Typography>
        </Box>
        <Chip
          size="small"
          label={`${mesa.cantidadCaminantes || caminantes.length}/${capacidad}`}
          color={completa ? 'success' : 'default'}
          variant={completa ? 'filled' : 'outlined'}
        />
      </Box>

      <Box sx={{ px: 2, pt: 1.5 }}>
        <Stack direction="row" spacing={1.5} justifyContent="space-between">
          <Box minWidth={0} flex={1}><ServidorMesa compact etiqueta="Líder" servidor={mesa.lider} /></Box>
          <Box minWidth={0} flex={1}><ServidorMesa compact etiqueta="Colíder" servidor={mesa.colider} /></Box>
        </Stack>
      </Box>

      <Box sx={{ position: 'relative', height: 205, mt: 1 }}>
        <Box
          sx={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: 140, height: 140, borderRadius: '50%',
            display: 'grid', placeItems: 'center', textAlign: 'center',
            border: '2px solid', borderColor: completa ? 'success.main' : 'primary.main',
            bgcolor: 'action.hover',
            boxShadow: 'inset 0 0 0 8px rgba(127,127,127,.05)',
          }}
        >
          <Box>
            <TableRestaurantRounded color="primary" />
            <Typography fontWeight={950}>{ocupacion}%</Typography>
            <Typography variant="caption" color="text.secondary">ocupación</Typography>
          </Box>
        </Box>

        {Array.from({ length: puestosVisibles }).map((_, index) => {
          const angle = (360 / puestosVisibles) * index - 90;
          const radius = 92;
          const x = 50 + (radius / 2.05) * Math.cos((angle * Math.PI) / 180);
          const y = 50 + (radius / 2.05) * Math.sin((angle * Math.PI) / 180);
          const caminante = caminantes[index];
          return (
            <Tooltip key={index} title={caminante?.nombre || 'Cupo disponible'} arrow>
              <Avatar
                src={caminante?.fotoPerfilUrl || caminante?.fotoUrl || undefined}
                sx={{
                  position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
                  width: 38, height: 38, fontSize: '.72rem', fontWeight: 900,
                  bgcolor: caminante ? 'primary.main' : 'background.paper',
                  color: caminante ? 'primary.contrastText' : 'text.disabled',
                  border: '2px solid', borderColor: caminante ? 'background.paper' : 'divider',
                  boxShadow: 1,
                }}
              >
                {caminante ? caminante.nombre?.split(' ').slice(0, 2).map((p) => p[0]).join('') : '○'}
              </Avatar>
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1.5} mb={1.4}>
          <Box flex={1}>
            <Stack direction="row" justifyContent="space-between"><Typography variant="caption">Cartas</Typography><Typography variant="caption" fontWeight={900}>{mesa.cartas?.porcentajeCumplimiento || 0}%</Typography></Stack>
            <LinearProgress variant="determinate" value={Math.min(mesa.cartas?.porcentajeCumplimiento || 0, 100)} sx={{ mt: .5, height: 5, borderRadius: 5 }} />
          </Box>
          <Box flex={1}>
            <Stack direction="row" justifyContent="space-between"><Typography variant="caption">Fotos</Typography><Typography variant="caption" fontWeight={900}>{mesa.fotos?.porcentajeCumplimiento || 0}%</Typography></Stack>
            <LinearProgress variant="determinate" value={Math.min(mesa.fotos?.porcentajeCumplimiento || 0, 100)} sx={{ mt: .5, height: 5, borderRadius: 5 }} />
          </Box>
        </Stack>

        <ProtectedButton
          permiso="MESAS_ASIGNAR_CAMINANTE"
          size="small"
          variant="contained"
          fullWidth
          startIcon={<PersonAddAltRounded />}
          onClick={(event) => { event.stopPropagation(); onAssign(mesa); }}
          disabled={mesa.cuposDisponibles <= 0}
        >
          {mesa.cuposDisponibles > 0 ? `Asignar · ${mesa.cuposDisponibles} cupos` : 'Mesa completa'}
        </ProtectedButton>
      </Box>
    </Box>
  );
}


function estiloEstadoEntregableMesa(estado) {
  const colores = {
    "Pendiente": "#d32f2f",
    "Solicitada": "#b23a48",
    "Entregada": "#1976d2",
    "Empaquetada": "#168c91",
    "Entregada a Logística": "#2e7d32",
  };

  const color = colores[estado] || "#6b7280";

  return {
    color,
    borderColor: color,
    bgcolor: "transparent",
    fontWeight: 700,
    "& .MuiChip-icon": {
      color,
    },
  };
}

function estiloEstadoLlamadaMesa(estado) {
  const colores = {
    "Pendiente": "#ed6c02",
    "En Proceso": "#0288d1",
    "Realizado": "#2e7d32",
  };

  const color = colores[estado] || "#6b7280";

  return {
    color,
    borderColor: color,
    bgcolor: "transparent",
    fontWeight: 700,
    "& .MuiChip-icon": {
      color,
    },
  };
}

export default function Mesas() {
  const [desasignar, setDesasignar] = useState(null);
  const [desasignando, setDesasignando] = useState(false);
  const [errorDesasignar, setErrorDesasignar] = useState('');
  const [desasignacionExitosa, setDesasignacionExitosa] = useState(null);
  const [detalleCaminante, setDetalleCaminante] = useState(null);

  const {
    token,
    tienePermiso,
    sesion,
  } = useAuth();

  const rolActual = String(
    sesion?.rol || ''
  )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  const rolPuedeExportarMesa = [
    'admin',
    'administrador',
    'administrador sistema',
    'administrador del sistema',
    'lider retiro',
    'lider del retiro',
    'lider mesa',
    'lider de mesa',
  ].includes(rolActual);

  const puedeExportarMesa =
    tienePermiso(
      'MESAS_EXPORTAR_CAMINANTES'
    ) ||
    rolPuedeExportarMesa;
  const api = useApi(() => obtenerMesas(), []);
  const [selected, setSelected] = useState(null);
  const [mesaAsignar, setMesaAsignar] = useState(null);
  const [mesaLiberar, setMesaLiberar] = useState(null);
  const [exportandoMesa, setExportandoMesa] = useState(false);
  const [avisoExportacion, setAvisoExportacion] = useState('');

  async function exportarMesa(mesa) {
    if (!mesa) return;

    setExportandoMesa(true);

    try {
      const datos =
        await exportarCaminantesMesaApi(
          token,
          mesa.numero
        );

      await descargarCaminantesMesaExcel(
        datos
      );

      setAvisoExportacion(
        `Se exportaron ${datos.cantidadCaminantes || 0} caminantes de la Mesa ${mesa.numero}.`
      );
    } catch (error) {
      setAvisoExportacion(
        error?.message ||
        'No fue posible exportar la mesa.'
      );
    } finally {
      setExportandoMesa(false);
    }
  }

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  const items = api.data?.items || [];
  const sincronizacion = api.data?.sincronizacion;

  const capacidad = items.reduce((acc, mesa) => acc + Number(mesa.capacidad || 0), 0);
  const asignados = items.reduce((acc, mesa) => acc + Number(mesa.cantidadCaminantes || mesa.caminantes?.length || 0), 0);
  const resumen = {
    capacidad,
    asignados,
    disponibles: Math.max(capacidad - asignados, 0),
    completas: items.filter((mesa) => Number(mesa.capacidad || 0) > 0 && Number(mesa.cantidadCaminantes || mesa.caminantes?.length || 0) >= Number(mesa.capacidad || 0)).length,
    sinLider: items.filter((mesa) => !mesa.lider || !mesa.colider).length,
  };

  async function confirmarDesasignacionMesa() {
    if (!desasignar?.caminante?.id || !desasignar?.mesa?.numero) return;

    setDesasignando(true);
    setErrorDesasignar('');

    try {
      const nombreCaminante = desasignar.caminante.nombre;
      const numeroMesa = desasignar.mesa.numero;

      const mesaActualizada = await desasignarCaminanteMesa(
        token,
        numeroMesa,
        desasignar.caminante.id
      );

      setDesasignar(null);
      setSelected(mesaActualizada);
      await api.reload();

      setDesasignacionExitosa({
        nombre: nombreCaminante,
        mesa: numeroMesa,
      });
    } catch (err) {
      setErrorDesasignar(
        err?.message || 'No fue posible desasignar el caminante de la mesa.'
      );
    } finally {
      setDesasignando(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Distribución del salón" title="Mesas" subtitle="Vista espacial de ocupación, liderazgo y entregables" onRefresh={api.reload} loading={api.loading} />

      <MetricStrip items={[
        { label: 'Mesas configuradas', value: items.length, icon: <TableRestaurantRounded /> },
        { label: 'Caminantes ubicados', value: `${resumen.asignados}/${resumen.capacidad}`, icon: <Groups2Rounded /> },
        { label: 'Cupos disponibles', value: resumen.disponibles, icon: <EventSeatRounded />, color: resumen.disponibles ? 'warning.main' : 'success.main' },
        { label: 'Mesas completas', value: resumen.completas, icon: <AssignmentTurnedInRounded />, color: 'success.main' },
      ]} />

      {resumen.sinLider > 0 && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          Hay <strong>{resumen.sinLider} mesas</strong> sin líder o colíder completo.
        </Alert>
      )}

      {sincronizacion?.requiereReubicacion && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Existen mesas fuera del rango configurado</AlertTitle>
          <Typography mb={1.5}>Reubica las personas asignadas a mesas posteriores a la {sincronizacion.numeroMesasConfigurado}.</Typography>
          <Stack spacing={1}>
            {sincronizacion.mesasFueraDeRango.map((mesa) => (
              <Box key={mesa.numero} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={1}>
                  <Typography fontWeight={900}>Mesa {mesa.numero} · {mesa.cantidadPersonas} personas</Typography>
                  <ProtectedButton permiso="MESAS_ASIGNAR_CAMINANTE" size="small" color="error" variant="outlined" startIcon={<DeleteOutlineRounded />} onClick={() => setMesaLiberar(mesa)}>Eliminar mesa</ProtectedButton>
                </Stack>
                <Grid container spacing={1}>{[...mesa.servidores, ...mesa.caminantes].map((persona, indice) => <Grid key={`${persona.tipoPersona}-${persona.id || persona.nombre}-${indice}`} size={{ xs: 12, sm: 6 }}><PersonaFueraDeRango persona={persona} /></Grid>)}</Grid>
              </Box>
            ))}
          </Stack>
        </Alert>
      )}

      {sincronizacion?.sincronizada && <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>La cantidad de mesas está sincronizada con el parámetro del retiro.</Alert>}

      <Grid container spacing={2}>
        {items.map((mesa) => (
          <Grid key={mesa.numero} size={{ xs: 12, md: 6, xl: 4 }}>
            <MesaVisual mesa={mesa} onOpen={setSelected} onAssign={setMesaAsignar} />
          </Grid>
        ))}
      </Grid>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 0 } }}>
        {selected && (
          <Box>
            <Box sx={{ p: 2.2, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={900}>DETALLE DE DISTRIBUCIÓN</Typography>
                  <Typography variant="h5" fontWeight={950}>Mesa {selected.numero}</Typography>
                  <Typography variant="body2" color="text.secondary">{selected.cantidadCaminantes || selected.caminantes?.length || 0} de {selected.capacidad} caminantes</Typography>
                </Box>
                <IconButton onClick={() => setSelected(null)}><CloseRounded /></IconButton>
              </Stack>
              <LinearProgress variant="determinate" value={Math.min(selected.porcentajeOcupacion || 0, 100)} sx={{ mt: 1.5, height: 7, borderRadius: 5 }} />
            </Box>

            <Box sx={{ p: 2.2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} mb={2.5}>
                <Box flex={1}><ServidorMesa etiqueta="Líder" servidor={selected.lider} /></Box>
                <Box flex={1}><ServidorMesa etiqueta="Colíder" servidor={selected.colider} /></Box>
              </Stack>

              <Divider sx={{ mb: 2 }} />
              <Typography fontWeight={900} mb={1.5}>Caminantes asignados</Typography>
              <Stack spacing={1}>
                {selected.caminantes?.length ? selected.caminantes.map((caminante, index) => (
                  <Box
                    key={caminante.id || index}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetalleCaminante(caminante)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setDetalleCaminante(caminante);
                      }
                    }}
                    sx={{
                      p: 1.4,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      transition: '150ms ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                        boxShadow: 1,
                      },
                      '&:focus-visible': {
                        outline: '3px solid',
                        outlineColor: 'primary.light',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                      <Avatar src={caminante.fotoPerfilUrl || caminante.fotoUrl || undefined} sx={{ width: 38, height: 38 }}>{caminante.nombre?.[0]}</Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography fontWeight={850} noWrap>{caminante.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">Habitación: {caminante.habitacion || 'Sin asignar'}</Typography>
                      </Box>
                      <Stack direction="row" spacing={.5} alignItems="center">
                        <Tooltip title="Ver inscripción completa" arrow>
                          <VisibilityRounded
                            color="action"
                            sx={{ fontSize: 19 }}
                          />
                        </Tooltip>
                        <StatusChip value={caminante.estadoPago} />
                      </Stack>
                    </Stack>

                    <Typography
                      variant="caption"
                      color="primary.main"
                      fontWeight={800}
                    >
                      Toca el caminante para ver la inscripción completa
                    </Typography>

                    <Stack spacing={1} sx={{ mt: .8, mb: 1.2 }}>
                      <Box
                        sx={{
                          p: 1.1,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(17,48,41,.025)',
                          border: '1px solid',
                          borderColor: 'rgba(20,75,62,.08)',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={900}
                          sx={{
                            display: 'block',
                            mb: .8,
                            letterSpacing: '.04em',
                          }}
                        >
                          ENTREGABLES
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Carta: ${caminante.entregables?.carta || 'Pendiente'}`}
                            sx={estiloEstadoEntregableMesa(
                              caminante.entregables?.carta || 'Pendiente'
                            )}
                          />

                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Foto: ${caminante.entregables?.foto || 'Pendiente'}`}
                            sx={estiloEstadoEntregableMesa(
                              caminante.entregables?.foto || 'Pendiente'
                            )}
                          />
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          p: 1.1,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(17,48,41,.025)',
                          border: '1px solid',
                          borderColor: 'rgba(20,75,62,.08)',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={900}
                          sx={{
                            display: 'block',
                            mb: .8,
                            letterSpacing: '.04em',
                          }}
                        >
                          LLAMADAS
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Caminante: ${caminante.seguimiento?.llamadaCaminante || 'Pendiente'}`}
                            sx={estiloEstadoLlamadaMesa(
                              caminante.seguimiento?.llamadaCaminante || 'Pendiente'
                            )}
                          />

                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Contactos: ${caminante.seguimiento?.llamadaContactos || 'Pendiente'}`}
                            sx={estiloEstadoLlamadaMesa(
                              caminante.seguimiento?.llamadaContactos || 'Pendiente'
                            )}
                          />
                        </Stack>
                      </Box>
                    </Stack>

                    <ProtectedButton
                      permiso="MESAS_DESASIGNAR_CAMINANTE"
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<PersonRemoveRounded />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setErrorDesasignar('');
                        setDesasignar({
                          mesa: selected,
                          caminante,
                        });
                      }}
                      sx={{
                        fontWeight: 850,
                        mt: .2,
                      }}
                    >
                      Desasignar de la mesa
                    </ProtectedButton>
                  </Box>
                )) : <Alert severity="info">Esta mesa todavía no tiene caminantes asignados.</Alert>}
              </Stack>

              <Stack spacing={1.2} sx={{ mt: 2.5 }}>
                {puedeExportarMesa && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DownloadRounded />}
                    disabled={
                      exportandoMesa ||
                      !(selected.caminantes?.length)
                    }
                    onClick={() =>
                      exportarMesa(selected)
                    }
                    sx={{
                      fontWeight: 850,
                      borderWidth: 1.5,
                    }}
                  >
                    {exportandoMesa
                      ? 'Generando archivo...'
                      : 'Exportar listado de caminantes'}
                  </Button>
                )}

                <ProtectedButton
                  permiso="MESAS_ASIGNAR_CAMINANTE"
                  fullWidth
                  variant="contained"
                  startIcon={<PersonAddAltRounded />}
                  disabled={selected.cuposDisponibles <= 0}
                  onClick={() => setMesaAsignar(selected)}
                >
                  Asignar caminantes
                </ProtectedButton>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      <CaminanteDetalleDialog
        open={Boolean(detalleCaminante)}
        caminante={detalleCaminante}
        token={token}
        tienePermiso={tienePermiso}
        onUpdated={api.reload}
        onClose={() => setDetalleCaminante(null)}
      />

      <Dialog
        open={Boolean(desasignar)}
        onClose={desasignando ? undefined : () => setDesasignar(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Desasignar caminante</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {errorDesasignar && (
              <Alert severity="error">{errorDesasignar}</Alert>
            )}

            <Alert severity="warning">
              Esta acción únicamente libera la asignación de mesa.
              La habitación y los demás datos del caminante no se modifican.
            </Alert>

            <Typography>
              ¿Deseas desasignar a{' '}
              <strong>{desasignar?.caminante?.nombre}</strong>{' '}
              de la <strong>Mesa {desasignar?.mesa?.numero}</strong>?
            </Typography>

            <Typography variant="body2" color="text.secondary">
              El caminante volverá inmediatamente al listado de personas
              disponibles para asignar a otra mesa.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDesasignar(null)}
            disabled={desasignando}
          >
            Cancelar
          </Button>

          <Button
            color="error"
            variant="contained"
            startIcon={<PersonRemoveRounded />}
            disabled={desasignando}
            onClick={confirmarDesasignacionMesa}
          >
            {desasignando ? 'Desasignando...' : 'Sí, desasignar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(desasignacionExitosa)}
        onClose={() => setDesasignacionExitosa(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogContent>
          <Stack
            spacing={2}
            alignItems="center"
            textAlign="center"
            sx={{ py: 2 }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#edf8f3',
                color: '#176b58',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CheckCircleRounded sx={{ fontSize: 38 }} />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={950}>
                Caminante desasignado
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: .6 }}
              >
                <strong>{desasignacionExitosa?.nombre}</strong>{' '}
                fue desasignado correctamente de la{' '}
                <strong>Mesa {desasignacionExitosa?.mesa}</strong>.
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: .8 }}
              >
                El cupo quedó disponible y el caminante puede asignarse a otra mesa.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setDesasignacionExitosa(null)}
            sx={{ minWidth: 120, fontWeight: 900 }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      <AsignarCaminantesMesaDialog open={Boolean(mesaAsignar)} mesa={mesaAsignar} token={token} onClose={() => setMesaAsignar(null)} onSaved={async () => { setMesaAsignar(null); await api.reload(); }} />
      <LiberarMesaDialog open={Boolean(mesaLiberar)} mesa={mesaLiberar} token={token} onClose={() => setMesaLiberar(null)} onSaved={async () => { setMesaLiberar(null); await api.reload(); }} />
      <Snackbar
        open={Boolean(avisoExportacion)}
        autoHideDuration={4500}
        onClose={() => setAvisoExportacion('')}
        message={avisoExportacion}
      />
    </>
  );
}
