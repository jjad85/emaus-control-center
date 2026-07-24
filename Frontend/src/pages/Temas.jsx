import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, Grid, InputAdornment, MenuItem,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ToggleOffRounded from '@mui/icons-material/ToggleOffRounded';
import ToggleOnRounded from '@mui/icons-material/ToggleOnRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  cambiarEstadoTema, editarTema, obtenerTemas, registrarTema,
} from '../api/temasApi';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

const FORMULARIO_INICIAL = {
  nombre: '', descripcion: '', duracionMinutos: '', diaDelTema: 'Sin definir',
  horaPropuesta: '', servidorId: '', requierePresentacion: 'Pendiente',
  requiereTestimonio: false, requiereMusica: 'Pendiente', observaciones: '',
};

const OPCIONES_SI_NO_PENDIENTE = ['Pendiente', 'Sí', 'No'];
const DIAS_BASE = ['Viernes', 'Sábado', 'Domingo', 'Sin definir'];

function normalizar(valor) {
  return String(valor || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function colorEstado(estado) {
  const valor = normalizar(estado);
  if (valor.includes('aprobada') || valor.includes('lista') || valor.includes('configurado')) return 'success';
  if (valor.includes('ajuste') || valor.includes('revision')) return 'warning';
  if (valor.includes('pendiente')) return 'info';
  return 'default';
}

function tieneServidorAsignado(item) {
  return Boolean(
    String(item?.servidorId || '').trim() ||
    String(item?.servidorNombre || '').trim()
  );
}

function obtenerEstadoVisible(item) {
  const presentacion = normalizar(item?.requierePresentacion);

  if (!tieneServidorAsignado(item)) {
    return 'Pendiente asignar servidor';
  }

  if (presentacion === 'pendiente') {
    return 'Pendiente definir presentación';
  }

  if (presentacion === 'si') {
    const estado = normalizar(item?.estadoPreparacion);
    if (estado.includes('aprobada') || estado.includes('lista')) return item.estadoPreparacion;
    if (estado.includes('ajuste') || estado.includes('revision')) return item.estadoPreparacion;
    return 'Pendiente cargar presentación';
  }

  if (presentacion === 'no') {
    return 'Tema configurado';
  }

  return item?.estadoPreparacion || 'Tema configurado';
}

function compararTemas(a, b) {
  const horaA = String(a.horaPropuesta || '99:99');
  const horaB = String(b.horaPropuesta || '99:99');
  return horaA.localeCompare(horaB) || String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
}

export default function Temas() {
  const { token, tienePermiso } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [temaEditando, setTemaEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  const api = useApi(() => obtenerTemas(token, { incluirInactivos }), [token, incluirInactivos]);
  const items = api.data?.items || [];

  const servidores = useMemo(() => {
    const origen = api.data?.servidores || [];
    const vistos = new Set();
    return origen.filter((servidor, indice) => {
      const id = String(servidor?.id || servidor?.servidorId || '').trim();
      const nombre = String(servidor?.nombre || servidor?.servidorNombre || '').trim();
      const clave = id || `sin-id:${nombre}:${indice}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return Boolean(id || nombre);
    });
  }, [api.data?.servidores]);

  const dias = useMemo(() => {
    const disponibles = api.data?.dias || [];
    return Array.from(new Set([...DIAS_BASE, ...disponibles]));
  }, [api.data?.dias]);

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda);
    const resultado = texto
      ? items.filter((item) => [item.nombre, item.servidorNombre, item.diaDelTema, item.estadoPreparacion]
        .some((valor) => normalizar(valor).includes(texto)))
      : items;
    return [...resultado].sort(compararTemas);
  }, [items, busqueda]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    filtrados.forEach((item) => {
      const dia = item.diaDelTema || 'Sin definir';
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia).push(item);
    });

    const prioridad = new Map(DIAS_BASE.map((dia, indice) => [normalizar(dia), indice]));
    return Array.from(mapa.entries())
      .map(([dia, temas]) => ({ dia, temas: [...temas].sort(compararTemas) }))
      .sort((a, b) => {
        const pa = prioridad.has(normalizar(a.dia)) ? prioridad.get(normalizar(a.dia)) : 999;
        const pb = prioridad.has(normalizar(b.dia)) ? prioridad.get(normalizar(b.dia)) : 999;
        return pa - pb || a.dia.localeCompare(b.dia, 'es');
      });
  }, [filtrados]);

  const resumen = useMemo(() => ({
    activos: items.filter((item) => item.activo).length,
    sinAsignar: items.filter((item) => item.activo && !tieneServidorAsignado(item)).length,
    pendientes: items.filter((item) => item.activo && normalizar(obtenerEstadoVisible(item)).includes('pendiente')).length,
    inactivos: items.filter((item) => !item.activo).length,
  }), [items]);

  useEffect(() => {
    if (!dialogoAbierto) setErrorAccion('');
  }, [dialogoAbierto]);

  const puedeVer = tienePermiso('TEMAS_VER_DETALLE');
  const puedeCrear = tienePermiso('TEMAS_CREAR');
  const puedeEditar = tienePermiso('TEMAS_EDITAR');
  const puedeCambiarEstado = tienePermiso('TEMAS_DESACTIVAR');

  if (!puedeVer) return <Alert severity="error">No tienes permisos para consultar los temas.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function abrirNuevo() {
    setTemaEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setErrorAccion('');
    setDialogoAbierto(true);
  }

  function abrirEdicion(item) {
    setTemaEditando(item);
    setFormulario({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      duracionMinutos: item.duracionMinutos || '',
      diaDelTema: item.diaDelTema || 'Sin definir',
      horaPropuesta: item.horaPropuesta || '',
      servidorId: item.servidorId || '',
      requierePresentacion: item.requierePresentacion || 'Pendiente',
      requiereTestimonio: Boolean(item.requiereTestimonio),
      requiereMusica: item.requiereMusica || 'Pendiente',
      observaciones: item.observaciones || '',
    });
    setErrorAccion('');
    setDialogoAbierto(true);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function cerrarDialogo() {
    if (!guardando) setDialogoAbierto(false);
  }

  async function guardar() {
    if (!formulario.nombre.trim()) return setErrorAccion('El nombre del tema es obligatorio.');
    if (formulario.duracionMinutos !== '' && Number(formulario.duracionMinutos) <= 0) {
      return setErrorAccion('La duración debe ser mayor que cero.');
    }

    setGuardando(true);
    setErrorAccion('');
    try {
      if (temaEditando) await editarTema(token, temaEditando.id, formulario);
      else await registrarTema(token, formulario);
      setDialogoAbierto(false);
      await api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible guardar el tema.');
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(item) {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Confirma que desea ${accion} el tema “${item.nombre}”?`)) return;
    try {
      await cambiarEstadoTema(token, item.id, !item.activo);
      await api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible cambiar el estado.');
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Gestión de temas"
        subtitle="Crea y asigna los temas del retiro, agrupados por día"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
        <TextField
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por tema, servidor, día o estado"
          size="small"
          sx={{ width: { xs: '100%', md: 430 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControlLabel control={<Switch checked={incluirInactivos} onChange={(event) => setIncluirInactivos(event.target.checked)} />} label="Mostrar inactivos" />
          {puedeCrear && (
            <Button variant="contained" startIcon={<AddRounded />} onClick={abrirNuevo}>Nuevo tema</Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`${resumen.activos} activos`} color="success" variant="outlined" />
        <Chip label={`${resumen.sinAsignar} sin servidor`} color={resumen.sinAsignar ? 'warning' : 'default'} variant="outlined" />
        <Chip label={`${resumen.pendientes} pendientes`} color={resumen.pendientes ? 'info' : 'default'} variant="outlined" />
        {incluirInactivos && <Chip label={`${resumen.inactivos} inactivos`} variant="outlined" />}
      </Stack>

      {errorAccion && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

      <Stack spacing={1.5}>
        {grupos.map(({ dia, temas }, indiceGrupo) => {
          const activosDia = temas.filter((tema) => tema.activo).length;
          const pendientesDia = temas.filter((tema) => tema.activo && normalizar(obtenerEstadoVisible(tema)).includes('pendiente')).length;
          const sinServidorDia = temas.filter((tema) => tema.activo && !tieneServidorAsignado(tema)).length;

          return (
            <Accordion
              key={dia}
              defaultExpanded={indiceGrupo === 0 || Boolean(busqueda.trim())}
              disableGutters
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: '16px !important',
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRounded />}
                sx={{
                  px: { xs: 2, sm: 2.5 },
                  py: 0.75,
                  bgcolor: 'action.hover',
                  '& .MuiAccordionSummary-content': { my: 1.25 },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 2 }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  sx={{ width: '100%', pr: 1 }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        flexShrink: 0,
                      }}
                    >
                      <EventRounded />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={900}>{dia}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {temas.length} {temas.length === 1 ? 'tema registrado' : 'temas registrados'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={`${activosDia} activos`} color="success" variant="outlined" />
                    {pendientesDia > 0 && <Chip size="small" label={`${pendientesDia} pendientes`} color="info" variant="outlined" />}
                    {sinServidorDia > 0 && <Chip size="small" label={`${sinServidorDia} sin servidor`} color="warning" variant="outlined" />}
                  </Stack>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: 'background.paper' }}>
                <Grid container spacing={2}>
                  {temas.map((item, indice) => (
                    <Grid size={{ xs: 12, md: 6, xl: 4 }} key={`tema-${String(item.id || indice)}`}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          opacity: item.activo ? 1 : 0.68,
                          borderRadius: 3,
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Stack spacing={1.75}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                              <Typography variant="h6" fontWeight={900}>{item.nombre}</Typography>
                              <Chip size="small" label={item.activo ? 'Activo' : 'Inactivo'} color={item.activo ? 'success' : 'default'} />
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <ScheduleRounded fontSize="small" color="action" />
                              <Typography variant="body2">
                                {item.horaPropuesta ? item.horaPropuesta : 'Sin hora definida'}
                                {item.duracionMinutos ? ` · ${item.duracionMinutos} min` : ''}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <PersonRounded fontSize="small" color={tieneServidorAsignado(item) ? 'primary' : 'disabled'} />
                              <Typography variant="body2" fontWeight={700}>{item.servidorNombre || 'Sin servidor asignado'}</Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip size="small" icon={<SlideshowRounded />} label={`Presentación: ${item.requierePresentacion}`} variant="outlined" />
                              <Chip size="small" icon={<MusicNoteRounded />} label={`Música: ${item.requiereMusica}`} variant="outlined" />
                              {item.requiereTestimonio && <Chip size="small" label="Requiere testimonio" color="secondary" variant="outlined" />}
                            </Stack>

                            <Chip
                              size="small"
                              label={obtenerEstadoVisible(item)}
                              color={colorEstado(obtenerEstadoVisible(item))}
                              sx={{ alignSelf: 'flex-start' }}
                            />
                          </Stack>
                        </CardContent>

                        <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-end' }}>
                          {puedeEditar && (
                            <Button size="small" startIcon={<EditRounded />} onClick={() => abrirEdicion(item)}>Editar</Button>
                          )}
                          {puedeCambiarEstado && (
                            <Button size="small" color={item.activo ? 'warning' : 'success'} startIcon={item.activo ? <ToggleOnRounded /> : <ToggleOffRounded />} onClick={() => alternarEstado(item)}>
                              {item.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      {!filtrados.length && <Alert severity="info" sx={{ mt: 2 }}>{busqueda ? 'No se encontraron temas.' : 'No hay temas registrados.'}</Alert>}

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="md">
        <DialogTitle>{temaEditando ? 'Editar tema' : 'Nuevo tema'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {errorAccion && <Alert severity="error">{errorAccion}</Alert>}
            <TextField label="Nombre" value={formulario.nombre} onChange={(event) => cambiarCampo('nombre', event.target.value)} required fullWidth inputProps={{ maxLength: 150 }} />
            <TextField label="Descripción" value={formulario.descripcion} onChange={(event) => cambiarCampo('descripcion', event.target.value)} multiline minRows={2} fullWidth />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Duración (minutos)" type="number" value={formulario.duracionMinutos} onChange={(event) => cambiarCampo('duracionMinutos', event.target.value)} fullWidth inputProps={{ min: 1 }} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField select label="Día del tema" value={formulario.diaDelTema} onChange={(event) => cambiarCampo('diaDelTema', event.target.value)} fullWidth>{dias.map((dia) => <MenuItem key={dia} value={dia}>{dia}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Hora propuesta" type="time" value={formulario.horaPropuesta} onChange={(event) => cambiarCampo('horaPropuesta', event.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <TextField select label="Servidor asignado" value={formulario.servidorId} onChange={(event) => cambiarCampo('servidorId', event.target.value)} fullWidth helperText="Solo se permite un servidor por tema.">
              <MenuItem value="">Sin servidor asignado</MenuItem>
              {servidores.map((servidor, indice) => {
                const id = String(servidor?.id || servidor?.servidorId || '').trim();
                const nombre = servidor?.nombre || servidor?.servidorNombre || 'Servidor sin nombre';
                return <MenuItem key={id ? `servidor-${id}` : `servidor-${indice}-${nombre}`} value={id} disabled={!id}>{nombre}</MenuItem>;
              })}
            </TextField>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField select label="Requiere presentación" value={formulario.requierePresentacion} onChange={(event) => cambiarCampo('requierePresentacion', event.target.value)} fullWidth>{OPCIONES_SI_NO_PENDIENTE.map((valor) => <MenuItem key={valor} value={valor}>{valor}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField select label="Requiere música" value={formulario.requiereMusica} onChange={(event) => cambiarCampo('requiereMusica', event.target.value)} fullWidth>{OPCIONES_SI_NO_PENDIENTE.map((valor) => <MenuItem key={valor} value={valor}>{valor}</MenuItem>)}</TextField></Grid>
            </Grid>
            <FormControlLabel control={<Switch checked={formulario.requiereTestimonio} onChange={(event) => cambiarCampo('requiereTestimonio', event.target.checked)} />} label="Requiere testimonio" />
            <TextField label="Observaciones" value={formulario.observaciones} onChange={(event) => cambiarCampo('observaciones', event.target.value)} multiline minRows={3} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
