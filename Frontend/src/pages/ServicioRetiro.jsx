import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DirectionsCarRounded from '@mui/icons-material/DirectionsCarRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import TwoWheelerRounded from '@mui/icons-material/TwoWheelerRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';

import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  obtenerAdministracionServicioRetiro,
  resolverInscripcionServicioRetiro,
} from '../api/servicioRetiroApi';

function fechaTexto(valor) {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha);
}

function estadoColor(estado) {
  const valor = String(estado || '').toLowerCase();
  if (valor === 'aprobado') return { bg: '#edf8f3', fg: '#176b58' };
  if (valor === 'rechazado') return { bg: '#fff1f1', fg: '#b54747' };
  return { bg: '#fff8e8', fg: '#9a6a08' };
}

function Dato({ etiqueta, valor }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
      <Typography fontWeight={850}>{valor || 'No informado'}</Typography>
    </Box>
  );
}

export default function ServicioRetiro({ tipo }) {
  const { token, tienePermiso } = useAuth();
  const esAngelitos = tipo === 'ANGELITOS';
  const titulo = esAngelitos ? 'Angelitos' : 'Serenata';
  const permisoGestion = esAngelitos
    ? 'SERVICIO_ANGELITOS_GESTIONAR'
    : 'SERVICIO_SERENATA_GESTIONAR';
  const permisoNotificar = esAngelitos
    ? 'SERVICIO_ANGELITOS_NOTIFICAR'
    : 'SERVICIO_SERENATA_NOTIFICAR';

  const api = useApi(
    () => obtenerAdministracionServicioRetiro(token, tipo),
    [token, tipo]
  );

  const [estado, setEstado] = useState('Pendiente');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('antiguos');
  const [filtroTransporte, setFiltroTransporte] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const [decision, setDecision] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [mensaje, setMensaje] = useState('');

  const items = api.data?.items || [];
  const indicadores = api.data?.indicadores || {};
  const hojaOrigen = api.data?.hojaOrigen || '';

  /*
   * La movilidad se calcula directamente desde los registros visibles
   * devueltos por la API. Así el resumen siempre coincide con las tarjetas
   * y no depende de un agregado separado del backend que puede quedar
   * desactualizado o provenir de una versión anterior de Apps Script.
   */
  const transporte = useMemo(() => {
    return items.reduce(
      (acumulado, item) => {
        const tipo = String(item.tipoTransporte || '').trim().toLowerCase();
        const deseaLlevar = String(item.deseaLlevarAlguien || '').trim().toLowerCase();
        const cupos = Math.max(0, Number(item.cuposDisponibles || 0) || 0);

        if (tipo === 'carro') {
          acumulado.carro += 1;
        } else if (tipo === 'moto') {
          acumulado.moto += 1;
        } else if (
          tipo === 'sin vehículo' ||
          tipo === 'sin vehiculo' ||
          tipo === ''
        ) {
          acumulado.sinVehiculo += 1;
        }

        if (
          deseaLlevar === 'sí' ||
          deseaLlevar === 'si'
        ) {
          acumulado.ofrecenCupos += 1;
          acumulado.cuposTotales += cupos;
        }

        return acumulado;
      },
      {
        carro: 0,
        moto: 0,
        sinVehiculo: 0,
        ofrecenCupos: 0,
        cuposTotales: 0,
      }
    );
  }, [items]);
  const puedeGestionar = Boolean(tienePermiso?.(permisoGestion));
  const puedeNotificar = Boolean(tienePermiso?.(permisoNotificar));
  const whatsappActivo = Boolean(api.data?.whatsappActivo) && puedeNotificar;

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const lista = items.filter(item => {
      if (estado !== 'Todos' && String(item.estadoInscripcion || 'Pendiente') !== estado) return false;
      if (
        filtroTransporte !== 'Todos' &&
        String(item.tipoTransporte || '') !== filtroTransporte
      ) return false;
      if (!termino) return true;
      return [item.nombreCompleto, item.documento, item.celular, item.parroquiaEmaus, item.ciudadEmaus]
        .filter(Boolean)
        .some(valor => String(valor).toLowerCase().includes(termino));
    });

    return [...lista].sort((a, b) => {
      const ta = new Date(a.fechaRegistro || 0).getTime() || 0;
      const tb = new Date(b.fechaRegistro || 0).getTime() || 0;
      return orden === 'antiguos' ? ta - tb : tb - ta;
    });
  }, [items, estado, busqueda, orden, filtroTransporte]);

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error && !api.data) return <ErrorState message={api.error} onRetry={api.reload} />;

  function abrirDecision(item, nuevaDecision) {
    setSeleccionado(item);
    setDecision(nuevaDecision);
    setObservaciones('');
    setErrorAccion('');
  }

  function cerrarDecision() {
    if (guardando) return;
    setSeleccionado(null);
    setDecision('');
    setObservaciones('');
    setErrorAccion('');
  }

  async function confirmarDecision() {
    if (!seleccionado || !decision) return;
    if (decision === 'Rechazado' && !observaciones.trim()) {
      setErrorAccion('Indica el motivo del rechazo antes de continuar.');
      return;
    }

    let ventanaWhatsapp = null;
    if (whatsappActivo) {
      ventanaWhatsapp = window.open('', '_blank');
    }

    setGuardando(true);
    setErrorAccion('');
    try {
      const resultado = await resolverInscripcionServicioRetiro(
        token,
        tipo,
        seleccionado.id,
        decision,
        observaciones.trim()
      );

      if (resultado?.whatsapp?.activo && resultado.whatsapp.url) {
        if (ventanaWhatsapp) {
          ventanaWhatsapp.location.href = resultado.whatsapp.url;
        } else {
          window.open(resultado.whatsapp.url, '_blank', 'noopener,noreferrer');
        }
        setMensaje(`${decision === 'Aprobado' ? 'Aprobación' : 'Rechazo'} registrado. Se abrió WhatsApp con el mensaje listo para enviar.`);
      } else {
        if (ventanaWhatsapp) ventanaWhatsapp.close();
        setMensaje(`${decision === 'Aprobado' ? 'Aprobación' : 'Rechazo'} registrado correctamente.`);
      }

      cerrarDecision();
      await api.reload();
      window.dispatchEvent(new Event('emaus:notificaciones-actualizar'));
    } catch (error) {
      if (ventanaWhatsapp) ventanaWhatsapp.close();
      setErrorAccion(error?.message || 'No fue posible actualizar la inscripción.');
    } finally {
      setGuardando(false);
    }
  }

  const iconoHero = esAngelitos ? <VolunteerActivismRounded /> : <MusicNoteRounded />;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={titulo}
        subtitle={esAngelitos
          ? 'Control de personas inscritas para servir como Angelitos'
          : 'Control interno de personas inscritas para apoyar la Serenata'}
        actions={
          <Button variant="contained" startIcon={<RefreshRounded />} onClick={api.reload}>
            Actualizar
          </Button>
        }
      />

      {api.error && <Alert severity="warning">{api.error.message || String(api.error)}</Alert>}
      {mensaje && <Alert severity="success" onClose={() => setMensaje('')}>{mensaje}</Alert>}

      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 5,
          color: '#fff',
          background: esAngelitos
            ? 'linear-gradient(135deg, #113f35 0%, #176b58 58%, #2b8b72 100%)'
            : 'linear-gradient(135deg, #173b4f 0%, #315f78 58%, #5f8296 100%)',
          boxShadow: '0 22px 55px rgba(17,48,41,.16)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 62, height: 62, bgcolor: 'rgba(255,255,255,.13)' }}>{iconoHero}</Avatar>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 950, letterSpacing: '.14em', color: 'rgba(255,255,255,.72)' }}>
                SERVICIO AL RETIRO
              </Typography>
              <Typography variant="h4" fontWeight={950}>Gestiona cada inscripción desde un solo lugar</Typography>
              <Typography sx={{ mt: .6, color: 'rgba(255,255,255,.75)' }}>
                Revisa la experiencia en Emaús, transporte y disponibilidad antes de tomar una decisión.
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<WhatsApp />}
            label={whatsappActivo ? 'WhatsApp habilitado' : 'WhatsApp deshabilitado'}
            sx={{ bgcolor: whatsappActivo ? '#dff7ea' : 'rgba(255,255,255,.13)', color: whatsappActivo ? '#176b58' : '#fff', fontWeight: 900 }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={1.5}>
        {[
          ['Pendiente', indicadores.pendientes || 0, <ScheduleRounded />, '#9a6a08', '#fff8e8'],
          ['Aprobado', indicadores.aprobados || 0, <CheckCircleRounded />, '#176b58', '#edf8f3'],
          ['Rechazado', indicadores.rechazados || 0, <CloseRounded />, '#b54747', '#fff1f1'],
          ['Todos', indicadores.total || 0, <GroupsRounded />, '#315f78', '#eef6fa'],
        ].map(([nombre, cantidad, icono, color, fondo]) => (
          <Grid key={nombre} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper
              variant="outlined"
              onClick={() => setEstado(nombre)}
              sx={{
                p: 2,
                borderRadius: 4,
                cursor: 'pointer',
                borderColor: estado === nombre ? color : 'divider',
                borderWidth: estado === nombre ? 2 : 1,
                bgcolor: estado === nombre ? fondo : '#fff',
                boxShadow: estado === nombre ? `0 12px 28px ${color}20` : 'none',
                transition: 'all .18s ease',
                '&:hover': { transform: 'translateY(-2px)', borderColor: color },
              }}
            >
              <Stack direction="row" spacing={1.4} alignItems="center">
                <Avatar sx={{ bgcolor: fondo, color }}>{icono}</Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={950} color={color}>{cantidad}</Typography>
                  <Typography fontWeight={900}>{nombre === 'Todos' ? 'Total inscritos' : nombre + (cantidad === 1 ? '' : 's')}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.4 },
          borderRadius: 4,
          borderColor: 'rgba(20,75,62,.11)',
          background: 'linear-gradient(135deg, rgba(237,248,243,.72) 0%, #fff 68%)',
        }}
      >
        <Stack spacing={1.7}>
          <Box>
            <Typography variant="overline" sx={{ color: '#176b58', fontWeight: 950, letterSpacing: '.12em' }}>
              MOVILIDAD
            </Typography>
            <Typography variant="h6" fontWeight={950}>
              ¿Cómo se desplazarán los inscritos?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Identifica rápidamente quién lleva vehículo y cuántos cupos hay disponibles para apoyar a otras personas.
            </Typography>
          </Box>

          <Grid container spacing={1.2}>
            {[
              ['Carro', transporte.carro || 0, <DirectionsCarRounded />, '#176b58', '#edf8f3'],
              ['Moto', transporte.moto || 0, <TwoWheelerRounded />, '#315f78', '#eef6fa'],
              ['Sin vehículo', transporte.sinVehiculo || 0, <PersonRounded />, '#8a6a21', '#fff8e8'],
              ['Cupos disponibles', transporte.cuposTotales || 0, <GroupsRounded />, '#6f4c8b', '#f6effa'],
            ].map(([label, value, icon, color, fondo]) => (
              <Grid key={label} size={{ xs: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: fondo,
                    border: '1px solid rgba(20,75,62,.08)',
                    height: '100%',
                  }}
                >
                  <Stack direction="row" spacing={1.1} alignItems="center">
                    <Avatar sx={{ width: 38, height: 38, bgcolor: '#fff', color }}>
                      {icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={950} color={color}>
                        {value}
                      </Typography>
                      <Typography variant="caption" fontWeight={850} color="text.secondary">
                        {label}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ md: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre, documento, celular o comunidad"
            value={busqueda}
            onChange={event => setBusqueda(event.target.value)}
            InputProps={{ startAdornment: <SearchRounded sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <TextField
            select
            size="small"
            label="Transporte"
            value={filtroTransporte}
            onChange={event => setFiltroTransporte(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="Carro">Carro</MenuItem>
            <MenuItem value="Moto">Moto</MenuItem>
            <MenuItem value="Sin vehículo">Sin vehículo</MenuItem>
          </TextField>

          <TextField select size="small" label="Orden" value={orden} onChange={event => setOrden(event.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="antiguos">Antiguos primero</MenuItem>
            <MenuItem value="recientes">Recientes primero</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {!filtrados.length ? (
        <Alert severity="info">No hay inscripciones para los filtros seleccionados.</Alert>
      ) : (
        <Stack spacing={1.35}>
          {filtrados.map(item => {
            const ec = estadoColor(item.estadoInscripcion);
            return (
              <Paper key={item.id} variant="outlined" sx={{ p: 2.25, borderRadius: 4, borderColor: 'rgba(20,75,62,.11)', transition: 'all .18s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 30px rgba(17,48,41,.08)' } }}>
                <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
                  <Box flex={1}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h6" fontWeight={950}>{item.nombreCompleto}</Typography>
                      <Chip size="small" label={item.estadoInscripcion || 'Pendiente'} sx={{ bgcolor: ec.bg, color: ec.fg, fontWeight: 900 }} />
                      <Chip size="small" variant="outlined" label={`Emaús: ${item.validacionEmaus || 'Declarado'}`} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={.5}>
                      {item.documento} · {item.celular} · Registrado {fechaTexto(item.fechaRegistro)}
                    </Typography>
                    <Typography variant="body2" mt={1.1}>
                      <strong>Emaús:</strong> {item.parroquiaEmaus || 'Sin comunidad'} · {item.ciudadEmaus || 'Sin ciudad'} {item.anioEmaus ? `· ${item.anioEmaus}` : ''}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1.4,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor:
                          item.tipoTransporte === 'Carro'
                            ? '#edf8f3'
                            : item.tipoTransporte === 'Moto'
                              ? '#eef6fa'
                              : '#fff8e8',
                        border: '1px solid rgba(20,75,62,.09)',
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ md: 'center' }}
                        justifyContent="space-between"
                        gap={1.2}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: '#fff',
                              color:
                                item.tipoTransporte === 'Carro'
                                  ? '#176b58'
                                  : item.tipoTransporte === 'Moto'
                                    ? '#315f78'
                                    : '#9a6a08',
                            }}
                          >
                            {item.tipoTransporte === 'Carro'
                              ? <DirectionsCarRounded />
                              : item.tipoTransporte === 'Moto'
                                ? <TwoWheelerRounded />
                                : <PersonRounded />}
                          </Avatar>

                          <Box>
                            <Typography fontWeight={950}>
                              {item.tipoTransporte === 'Carro'
                                ? 'Va en carro'
                                : item.tipoTransporte === 'Moto'
                                  ? 'Va en moto'
                                  : 'Va sin vehículo'}
                            </Typography>

                            {item.tipoTransporte !== 'Sin vehículo' && (
                              <Typography variant="body2" color="text.secondary">
                                {item.lugarSalida || 'Punto de salida no informado'}
                                {item.horaSalida ? ` · ${item.horaSalida}` : ''}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        {item.tipoTransporte !== 'Sin vehículo' ? (
                          item.deseaLlevarAlguien === 'Sí' && Number(item.cuposDisponibles || 0) > 0 ? (
                            <Chip
                              icon={<GroupsRounded />}
                              color="success"
                              label={`Ofrece ${item.cuposDisponibles} ${Number(item.cuposDisponibles) === 1 ? 'cupo' : 'cupos'}`}
                              sx={{ fontWeight: 950 }}
                            />
                          ) : (
                            <Chip
                              label="No ofrece cupos"
                              variant="outlined"
                              sx={{ fontWeight: 850, bgcolor: '#fff' }}
                            />
                          )
                        ) : (
                          <Chip
                            label="Sin vehículo propio"
                            variant="outlined"
                            sx={{ fontWeight: 850, bgcolor: '#fff' }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} justifyContent="center" minWidth={{ lg: 180 }}>
                    <Button variant="outlined" onClick={() => setSeleccionado({ ...item, modoDetalle: true })}>Ver detalle</Button>
                    {puedeGestionar && item.estadoInscripcion !== 'Aprobado' && (
                      <Button color="success" variant="contained" startIcon={<CheckCircleRounded />} onClick={() => abrirDecision(item, 'Aprobado')}>Aprobar</Button>
                    )}
                    {puedeGestionar && item.estadoInscripcion !== 'Rechazado' && (
                      <Button color="error" variant="outlined" startIcon={<CloseRounded />} onClick={() => abrirDecision(item, 'Rechazado')}>Rechazar</Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog open={Boolean(seleccionado?.modoDetalle)} onClose={() => setSeleccionado(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle><Typography variant="h5" fontWeight={950}>Detalle de la inscripción</Typography></DialogTitle>
        <DialogContent>
          {seleccionado && (
            <Stack spacing={2.2} pt={1}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="Nombre" valor={seleccionado.nombreCompleto} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="Documento" valor={seleccionado.documento} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="Celular" valor={seleccionado.celular} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="Correo" valor={seleccionado.correo} /></Grid>
              </Grid>
              <Divider />
              <Typography variant="h6" fontWeight={900}>Experiencia en Emaús</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="Parroquia / comunidad" valor={seleccionado.parroquiaEmaus} /></Grid>
                <Grid size={{ xs: 12, sm: 3 }}><Dato etiqueta="Ciudad" valor={seleccionado.ciudadEmaus} /></Grid>
                <Grid size={{ xs: 12, sm: 3 }}><Dato etiqueta="Año aproximado" valor={seleccionado.anioEmaus} /></Grid>
              </Grid>
              <Divider />
              <Typography variant="h6" fontWeight={900}>Transporte</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}><Dato etiqueta="Medio" valor={seleccionado.tipoTransporte} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Dato etiqueta="Punto de salida" valor={seleccionado.lugarSalida} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Dato etiqueta="Hora de salida" valor={seleccionado.horaSalida} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="¿Puede llevar a otras personas?" valor={seleccionado.deseaLlevarAlguien} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Dato etiqueta="Cupos disponibles" valor={seleccionado.deseaLlevarAlguien === 'Sí' ? seleccionado.cuposDisponibles : 'No ofrece cupos'} /></Grid>
              </Grid>
              {seleccionado.observaciones && <Alert severity="info">{seleccionado.observaciones}</Alert>}
              {seleccionado.observacionesGestion && <Alert severity="warning"><strong>Observaciones de gestión:</strong> {seleccionado.observacionesGestion}</Alert>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setSeleccionado(null)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(seleccionado && !seleccionado.modoDetalle && decision)} onClose={cerrarDecision} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle>
          <Typography variant="overline" sx={{ color: decision === 'Aprobado' ? 'success.main' : 'error.main', fontWeight: 950 }}>{decision === 'Aprobado' ? 'APROBAR INSCRIPCIÓN' : 'RECHAZAR INSCRIPCIÓN'}</Typography>
          <Typography variant="h5" fontWeight={950}>{seleccionado?.nombreCompleto}</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            {errorAccion && <Alert severity="error">{errorAccion}</Alert>}
            <Alert severity={whatsappActivo ? 'info' : 'warning'} icon={whatsappActivo ? <WhatsApp /> : undefined}>
              {whatsappActivo
                ? 'Al confirmar, se abrirá WhatsApp con el mensaje parametrizado listo para que lo envíes desde tu sesión.'
                : 'La notificación por WhatsApp está deshabilitada en Configuración. La decisión se guardará sin abrir WhatsApp.'}
            </Alert>
            <TextField
              fullWidth
              multiline
              minRows={3}
              required={decision === 'Rechazado'}
              label={decision === 'Rechazado' ? 'Motivo del rechazo *' : 'Observaciones de la aprobación'}
              value={observaciones}
              onChange={event => setObservaciones(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={cerrarDecision} disabled={guardando}>Cancelar</Button>
          <Button
            variant="contained"
            color={decision === 'Aprobado' ? 'success' : 'error'}
            onClick={confirmarDecision}
            disabled={guardando}
            endIcon={whatsappActivo ? <WhatsApp /> : <ArrowForwardRounded />}
          >
            {guardando
              ? 'Guardando...'
              : whatsappActivo
                ? `${decision === 'Aprobado' ? 'Aprobar' : 'Rechazar'} y notificar`
                : decision === 'Aprobado' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
