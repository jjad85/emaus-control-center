import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import AddRounded from '@mui/icons-material/AddRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import RestoreRounded from '@mui/icons-material/RestoreRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';

import { useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  editarFechaImportanteApi,
  eliminarFechaImportanteApi,
  obtenerFechasImportantesApi,
  registrarFechaImportanteApi,
  restaurarFechaImportanteApi,
} from '../api/fechasImportantesApi';

import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

const FORMULARIO_INICIAL = {
  fecha: '',
  descripcion: '',
};

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function textoCuentaRegresiva(item) {
  if (!item.activo) return 'No visible en el dashboard';
  if (item.diasRestantes === 0) return 'Se cumple hoy';
  if (item.diasRestantes === 1) return 'Se cumple mañana';
  if (item.diasRestantes > 1) return `Faltan ${item.diasRestantes} días`;
  if (item.diasRestantes === -1) return 'Se cumplió ayer';
  return `Se cumplió hace ${Math.abs(item.diasRestantes)} días`;
}

function colorEstado(item) {
  if (!item.activo) return 'default';
  if (item.diasRestantes < 0) return 'default';
  if (item.diasRestantes <= 3) return 'error';
  if (item.diasRestantes <= 7) return 'warning';
  return 'success';
}

function etiquetaEstado(item) {
  if (!item.activo) return 'Inactiva';
  if (item.diasRestantes < 0) return 'Cumplida';
  if (item.diasRestantes === 0) return 'Hoy';
  return 'Próxima';
}

export default function FechasImportantes() {
  const { token, tienePermiso } = useAuth();
  const puedeGestionar = tienePermiso('FECHAS_IMPORTANTES_GESTIONAR');

  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('proximas');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [mensaje, setMensaje] = useState('');

  const api = useApi(
    () => obtenerFechasImportantesApi(token, { incluirInactivas }),
    [token, incluirInactivas]
  );

  const items = api.data?.items || [];

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    return items.filter((item) => {
      const coincideTexto = !termino || [item.descripcion, item.fechaTexto]
        .some((valor) => normalizar(valor).includes(termino));

      const coincideFiltro =
        filtro === 'todas' ||
        (filtro === 'proximas' && item.activo && item.diasRestantes >= 0) ||
        (filtro === 'cumplidas' && item.activo && item.diasRestantes < 0) ||
        (filtro === 'inactivas' && !item.activo);

      return coincideTexto && coincideFiltro;
    });
  }, [items, busqueda, filtro]);

  if (!puedeGestionar) {
    return <Alert severity="error">No tienes permisos para gestionar las fechas importantes.</Alert>;
  }

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function abrirNuevo() {
    setEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setErrorAccion('');
    setDialogoAbierto(true);
  }

  function abrirEdicion(item) {
    setEditando(item);
    setFormulario({ fecha: item.fecha || '', descripcion: item.descripcion || '' });
    setErrorAccion('');
    setDialogoAbierto(true);
  }

  function cerrarDialogo() {
    if (!guardando) setDialogoAbierto(false);
  }

  function validarFormulario() {
    if (!formulario.fecha) return 'La fecha es obligatoria.';
    const fecha = new Date(`${formulario.fecha}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return 'Ingrese una fecha válida.';
    const descripcion = formulario.descripcion.replace(/\s+/g, ' ').trim();
    if (!descripcion) return 'La descripción es obligatoria.';
    if (descripcion.length < 3) return 'La descripción debe tener al menos 3 caracteres.';
    if (descripcion.length > 160) return 'La descripción no puede superar los 160 caracteres.';
    return '';
  }

  async function guardar() {
    const validacion = validarFormulario();
    if (validacion) {
      setErrorAccion(validacion);
      return;
    }

    setGuardando(true);
    setErrorAccion('');
    setMensaje('');
    try {
      const datos = {
        fecha: formulario.fecha,
        descripcion: formulario.descripcion.replace(/\s+/g, ' ').trim(),
      };
      if (editando) await editarFechaImportanteApi(token, editando.id, datos);
      else await registrarFechaImportanteApi(token, datos);
      setDialogoAbierto(false);
      setMensaje(editando ? 'Fecha actualizada correctamente.' : 'Fecha creada correctamente.');
      await api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible guardar la fecha.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(item) {
    if (!window.confirm(`¿Eliminar “${item.descripcion}” del dashboard?`)) return;
    setMensaje('');
    setErrorAccion('');
    try {
      await eliminarFechaImportanteApi(token, item.id);
      setMensaje('Fecha eliminada correctamente.');
      await api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible eliminar la fecha.');
    }
  }

  async function restaurar(item) {
    setMensaje('');
    setErrorAccion('');
    try {
      await restaurarFechaImportanteApi(token, item.id);
      setMensaje('Fecha restaurada correctamente.');
      await api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible restaurar la fecha.');
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Fechas importantes"
        subtitle="Administra las fechas que aparecen en la cuenta regresiva del dashboard"
        onRefresh={api.reload}
        loading={api.loading}
      />

      {mensaje && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>{mensaje}</Alert>}
      {errorAccion && !dialogoAbierto && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
          <TextField
            size="small"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por descripción o fecha"
            sx={{ width: { xs: '100%', md: 360 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }}
          />
          <TextField
            select
            size="small"
            label="Mostrar"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            sx={{ minWidth: 155 }}
          >
            <MenuItem value="proximas">Próximas</MenuItem>
            <MenuItem value="cumplidas">Cumplidas</MenuItem>
            <MenuItem value="inactivas" disabled={!incluirInactivas}>Inactivas</MenuItem>
            <MenuItem value="todas">Todas</MenuItem>
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <FormControlLabel
            control={<Switch checked={incluirInactivas} onChange={(event) => {
              setIncluirInactivas(event.target.checked);
              if (!event.target.checked && filtro === 'inactivas') setFiltro('proximas');
            }} />}
            label="Ver eliminadas"
          />
          <Button variant="contained" startIcon={<AddRounded />} onClick={abrirNuevo}>
            Nueva fecha
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip icon={<EventAvailableRounded />} label={`${api.data?.resumen?.proximas || 0} próximas`} color="success" variant="outlined" />
        <Chip icon={<HistoryRounded />} label={`${api.data?.resumen?.vencidas || 0} cumplidas`} variant="outlined" />
        {incluirInactivas && <Chip label={`${api.data?.resumen?.inactivas || 0} eliminadas`} variant="outlined" />}
      </Stack>

      {filtrados.length === 0 ? (
        <Box sx={{ py: 7, textAlign: 'center' }}>
          <CalendarMonthRounded sx={{ fontSize: 54, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={800}>No hay fechas para mostrar</Typography>
          <Typography color="text.secondary">Cambia los filtros o registra una nueva fecha.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtrados.map((item) => (
            <Grid item xs={12} md={6} xl={4} key={item.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderColor: item.activo && item.diasRestantes >= 0 && item.diasRestantes <= 7 ? 'warning.main' : 'divider',
                  opacity: item.activo ? 1 : 0.68,
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="overline" color="text.secondary">{item.fechaTexto}</Typography>
                      <Typography variant="h6" fontWeight={850} sx={{ mt: -0.25 }}>{item.descripcion}</Typography>
                    </Box>
                    <Chip size="small" label={etiquetaEstado(item)} color={colorEstado(item)} variant={item.activo ? 'filled' : 'outlined'} />
                  </Stack>
                  <Typography sx={{ mt: 2 }} fontWeight={800} color={item.activo && item.diasRestantes >= 0 ? 'primary.main' : 'text.secondary'}>
                    {textoCuentaRegresiva(item)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  {item.activo ? (
                    <>
                      <Button size="small" startIcon={<EditRounded />} onClick={() => abrirEdicion(item)}>Editar</Button>
                      <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => eliminar(item)}>Eliminar</Button>
                    </>
                  ) : (
                    <Button size="small" startIcon={<RestoreRounded />} onClick={() => restaurar(item)}>Restaurar</Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar fecha importante' : 'Nueva fecha importante'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorAccion && <Alert severity="error">{errorAccion}</Alert>}
            <TextField
              label="Fecha"
              type="date"
              required
              value={formulario.fecha}
              onChange={(event) => setFormulario((actual) => ({ ...actual, fecha: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: '2000-01-01', max: '2100-12-31' }}
              helperText="Esta fecha se usará para calcular los días restantes en el dashboard."
            />
            <TextField
              label="Descripción"
              required
              autoFocus
              value={formulario.descripcion}
              onChange={(event) => setFormulario((actual) => ({ ...actual, descripcion: event.target.value }))}
              multiline
              minRows={3}
              inputProps={{ maxLength: 160 }}
              helperText={`${formulario.descripcion.length}/160 caracteres`}
              placeholder="Ejemplo: Cierre de inscripciones"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
