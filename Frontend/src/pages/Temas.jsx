import {
  Alert, Box, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, InputAdornment,
  MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ToggleOffRounded from '@mui/icons-material/ToggleOffRounded';
import ToggleOnRounded from '@mui/icons-material/ToggleOnRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  cambiarEstadoTema, editarTema, moverTema, obtenerTemas, registrarTema,
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
const DIAS_BASE = ['Sin definir', 'Viernes', 'Sábado', 'Domingo'];

function normalizar(valor) {
  return String(valor || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function esAdministrador(rol) {
  const valor = normalizar(rol);
  return valor === 'administrador' || valor === 'administradores';
}
function colorEstado(estado) {
  const valor = normalizar(estado);
  if (valor.includes('aprobada') || valor.includes('lista')) return 'success';
  if (valor.includes('ajuste') || valor.includes('revision')) return 'warning';
  if (valor.includes('pendiente')) return 'info';
  return 'default';
}

export default function Temas() {
  const { token, rol } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [temaEditando, setTemaEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [moviendoId, setMoviendoId] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  const api = useApi(() => obtenerTemas(token, { incluirInactivos }), [token, incluirInactivos]);
  const items = api.data?.items || [];
  const servidores = useMemo(() => {
    const origen = api.data?.servidores || [];
    const vistos = new Set();

    return origen.filter((servidor, indice) => {
      const id = String(
        servidor?.id ||
        servidor?.servidorId ||
        ''
      ).trim();
      const nombre = String(
        servidor?.nombre ||
        servidor?.servidorNombre ||
        ''
      ).trim();
      const clave = id || `sin-id:${nombre}:${indice}`;

      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return Boolean(id || nombre);
    });
  }, [api.data?.servidores]);
  const dias = useMemo(() => Array.from(new Set([...DIAS_BASE, ...(api.data?.dias || [])])), [api.data?.dias]);

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda);
    if (!texto) return items;
    return items.filter((item) => [item.nombre, item.servidorNombre, item.diaDelTema, item.estadoPreparacion].some((v) => normalizar(v).includes(texto)));
  }, [items, busqueda]);

  const resumen = useMemo(() => ({
    activos: items.filter((i) => i.activo).length,
    sinAsignar: items.filter((i) => i.activo && !i.servidorId).length,
    pendientes: items.filter((i) => i.activo && normalizar(i.estadoPreparacion).includes('pendiente')).length,
    inactivos: items.filter((i) => !i.activo).length,
  }), [items]);

  if (!esAdministrador(rol)) return <Alert severity="error">No tienes permisos para administrar temas.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function abrirNuevo() {
    setTemaEditando(null); setFormulario(FORMULARIO_INICIAL); setErrorAccion(''); setDialogoAbierto(true);
  }
  function abrirEdicion(item) {
    setTemaEditando(item);
    setFormulario({
      nombre: item.nombre || '', descripcion: item.descripcion || '', duracionMinutos: item.duracionMinutos || '',
      diaDelTema: item.diaDelTema || 'Sin definir', horaPropuesta: item.horaPropuesta || '', servidorId: item.servidorId || '',
      requierePresentacion: item.requierePresentacion || 'Pendiente', requiereTestimonio: Boolean(item.requiereTestimonio),
      requiereMusica: item.requiereMusica || 'Pendiente', observaciones: item.observaciones || '',
    });
    setErrorAccion(''); setDialogoAbierto(true);
  }
  function cambiarCampo(campo, valor) { setFormulario((actual) => ({ ...actual, [campo]: valor })); }
  function cerrarDialogo() { if (!guardando) setDialogoAbierto(false); }

  async function guardar() {
    if (!formulario.nombre.trim()) return setErrorAccion('El nombre del tema es obligatorio.');
    if (formulario.duracionMinutos !== '' && Number(formulario.duracionMinutos) <= 0) return setErrorAccion('La duración debe ser mayor que cero.');
    setGuardando(true); setErrorAccion('');
    try {
      if (temaEditando) await editarTema(token, temaEditando.id, formulario);
      else await registrarTema(token, formulario);
      setDialogoAbierto(false); await api.reload();
    } catch (error) { setErrorAccion(error?.message || 'No fue posible guardar el tema.'); }
    finally { setGuardando(false); }
  }

  async function alternarEstado(item) {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Confirma que desea ${accion} el tema “${item.nombre}”?`)) return;
    try { await cambiarEstadoTema(token, item.id, !item.activo); await api.reload(); }
    catch (error) { setErrorAccion(error?.message || 'No fue posible cambiar el estado.'); }
  }

  async function cambiarOrden(item, direccion) {
    setMoviendoId(item.id); setErrorAccion('');
    try { await moverTema(token, item.id, direccion); await api.reload(); }
    catch (error) { setErrorAccion(error?.message || 'No fue posible cambiar el orden.'); }
    finally { setMoviendoId(''); }
  }

  return (
    <>
      <PageHeader eyebrow="Administración" title="Gestión de temas" subtitle="Crea, asigna y organiza la secuencia oficial de los temas del retiro" onRefresh={api.reload} loading={api.loading} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
        <TextField value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por tema, servidor, día o estado" size="small" sx={{ width: { xs: '100%', md: 430 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControlLabel control={<Switch checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />} label="Mostrar inactivos" />
          <Button variant="contained" startIcon={<AddRounded />} onClick={abrirNuevo}>Nuevo tema</Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`${resumen.activos} activos`} color="success" variant="outlined" />
        <Chip label={`${resumen.sinAsignar} sin conferencista`} color={resumen.sinAsignar ? 'warning' : 'default'} variant="outlined" />
        <Chip label={`${resumen.pendientes} pendientes`} color={resumen.pendientes ? 'info' : 'default'} variant="outlined" />
        {incluirInactivos && <Chip label={`${resumen.inactivos} inactivos`} variant="outlined" />}
      </Stack>

      {errorAccion && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

      <Grid container spacing={2}>
        {filtrados.map((item, indice) => (
          <Grid size={{ xs: 12, md: 6, xl: 4 }} key={`tema-${String(item.id || 'sin-id')}-${item.ordenGeneral || indice}-${indice}`}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: item.activo ? 1 : 0.68 }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={1.75}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="overline" color="text.secondary">Tema {item.ordenGeneral || '—'} de {item.totalTemas || resumen.activos}</Typography>
                      <Typography variant="h6" fontWeight={900}>{item.nombre}</Typography>
                    </Box>
                    <Chip size="small" label={item.activo ? 'Activo' : 'Inactivo'} color={item.activo ? 'success' : 'default'} />
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center"><ScheduleRounded fontSize="small" color="action" /><Typography variant="body2"><b>{item.diaDelTema}</b>{item.horaPropuesta ? ` · ${item.horaPropuesta}` : ''}{item.duracionMinutos ? ` · ${item.duracionMinutos} min` : ''}</Typography></Stack>
                  <Stack direction="row" spacing={1} alignItems="center"><PersonRounded fontSize="small" color={item.servidorId ? 'primary' : 'disabled'} /><Typography variant="body2" fontWeight={700}>{item.servidorNombre || 'Sin conferencista asignado'}</Typography></Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" icon={<SlideshowRounded />} label={`Presentación: ${item.requierePresentacion}`} variant="outlined" />
                    <Chip size="small" icon={<MusicNoteRounded />} label={`Música: ${item.requiereMusica}`} variant="outlined" />
                    {item.requiereTestimonio && <Chip size="small" label="Requiere testimonio" color="secondary" variant="outlined" />}
                  </Stack>
                  <Chip size="small" label={item.estadoPreparacion} color={colorEstado(item.estadoPreparacion)} sx={{ alignSelf: 'flex-start' }} />

                  {item.activo && (
                    <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.25 }}>
                      <Typography variant="caption" display="block"><b>Anterior:</b> {item.temaAnterior || 'Inicio del retiro'}</Typography>
                      <Typography variant="caption" display="block"><b>Siguiente:</b> {item.temaSiguiente || 'Fin del retiro'}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Subir una posición"><span><IconButton size="small" disabled={!item.activo || indice === 0 || moviendoId === item.id} onClick={() => cambiarOrden(item, 'subir')}><ArrowUpwardRounded /></IconButton></span></Tooltip>
                  <Tooltip title="Bajar una posición"><span><IconButton size="small" disabled={!item.activo || indice === filtrados.length - 1 || moviendoId === item.id} onClick={() => cambiarOrden(item, 'bajar')}><ArrowDownwardRounded /></IconButton></span></Tooltip>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" startIcon={<EditRounded />} onClick={() => abrirEdicion(item)}>Editar</Button>
                  <Button size="small" color={item.activo ? 'warning' : 'success'} startIcon={item.activo ? <ToggleOnRounded /> : <ToggleOffRounded />} onClick={() => alternarEstado(item)}>{item.activo ? 'Desactivar' : 'Activar'}</Button>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {!filtrados.length && <Alert severity="info" sx={{ mt: 2 }}>{busqueda ? 'No se encontraron temas.' : 'No hay temas registrados.'}</Alert>}

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="md">
        <DialogTitle>{temaEditando ? 'Editar tema' : 'Nuevo tema'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {errorAccion && <Alert severity="error">{errorAccion}</Alert>}
            <TextField label="Nombre" value={formulario.nombre} onChange={(e) => cambiarCampo('nombre', e.target.value)} required fullWidth inputProps={{ maxLength: 150 }} />
            <TextField label="Descripción" value={formulario.descripcion} onChange={(e) => cambiarCampo('descripcion', e.target.value)} multiline minRows={2} fullWidth />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Duración (minutos)" type="number" value={formulario.duracionMinutos} onChange={(e) => cambiarCampo('duracionMinutos', e.target.value)} fullWidth inputProps={{ min: 1 }} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField select label="Día del tema" value={formulario.diaDelTema} onChange={(e) => cambiarCampo('diaDelTema', e.target.value)} fullWidth>{dias.map((dia) => <MenuItem key={dia} value={dia}>{dia}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Hora propuesta" type="time" value={formulario.horaPropuesta} onChange={(e) => cambiarCampo('horaPropuesta', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <TextField select label="Servidor asignado" value={formulario.servidorId} onChange={(e) => cambiarCampo('servidorId', e.target.value)} fullWidth helperText="Solo se permite un conferencista por tema.">
              <MenuItem key="sin-servidor" value="">Sin servidor asignado</MenuItem>
              {servidores.map((servidor, indice) => {
                const id = String(servidor?.id || servidor?.servidorId || '').trim();
                const nombre = servidor?.nombre || servidor?.servidorNombre || 'Servidor sin nombre';
                return (
                  <MenuItem
                    key={id ? `servidor-${id}` : `servidor-${indice}-${nombre}`}
                    value={id}
                    disabled={!id}
                  >
                    {nombre}
                  </MenuItem>
                );
              })}
            </TextField>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField select label="Requiere presentación" value={formulario.requierePresentacion} onChange={(e) => cambiarCampo('requierePresentacion', e.target.value)} fullWidth>{OPCIONES_SI_NO_PENDIENTE.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField select label="Requiere música" value={formulario.requiereMusica} onChange={(e) => cambiarCampo('requiereMusica', e.target.value)} fullWidth>{OPCIONES_SI_NO_PENDIENTE.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
            </Grid>
            <FormControlLabel control={<Switch checked={formulario.requiereTestimonio} onChange={(e) => cambiarCampo('requiereTestimonio', e.target.checked)} />} label="Requiere testimonio" />
            <TextField label="Observaciones" value={formulario.observaciones} onChange={(e) => cambiarCampo('observaciones', e.target.value)} multiline minRows={3} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button><Button variant="contained" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button></DialogActions>
      </Dialog>
    </>
  );
}
