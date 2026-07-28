import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AddRounded from '@mui/icons-material/AddRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
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
  hora: '',
  descripcion: '',
};

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function crearFechaLocal(fecha) {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  const resultado = new Date(anio, mes - 1, dia);
  return Number.isNaN(resultado.getTime()) ? null : resultado;
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

function datosFecha(item) {
  const fecha = crearFechaLocal(item.fecha);
  if (!fecha) {
    return {
      dia: '--',
      mesCorto: '',
      grupo: 'Sin fecha',
      orden: Number.MAX_SAFE_INTEGER,
    };
  }

  return {
    dia: String(fecha.getDate()).padStart(2, '0'),
    mesCorto: fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').toUpperCase(),
    grupo: `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`,
    orden: fecha.getTime(),
  };
}

export default function FechasImportantes() {
  const { token, tienePermiso } = useAuth();
  const puedeGestionar = tienePermiso('FECHAS_IMPORTANTES_GESTIONAR');

  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('proximas');
  const [panelAbierto, setPanelAbierto] = useState(false);
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

    return items
      .filter((item) => {
        const coincideTexto = !termino || [item.descripcion, item.fechaTexto]
          .some((valor) => normalizar(valor).includes(termino));

        const coincideFiltro =
          filtro === 'todas' ||
          (filtro === 'proximas' && item.activo && item.diasRestantes >= 0) ||
          (filtro === 'cumplidas' && item.activo && item.diasRestantes < 0) ||
          (filtro === 'inactivas' && !item.activo);

        return coincideTexto && coincideFiltro;
      })
      .sort((a, b) => datosFecha(a).orden - datosFecha(b).orden);
  }, [items, busqueda, filtro]);

  const grupos = useMemo(() => {
    const resultado = [];
    const indicePorGrupo = new Map();

    filtrados.forEach((item) => {
      const fecha = datosFecha(item);
      if (!indicePorGrupo.has(fecha.grupo)) {
        indicePorGrupo.set(fecha.grupo, resultado.length);
        resultado.push({ nombre: fecha.grupo, items: [] });
      }
      resultado[indicePorGrupo.get(fecha.grupo)].items.push(item);
    });

    return resultado;
  }, [filtrados]);

  if (!puedeGestionar) {
    return <Alert severity="error">No tienes permisos para gestionar las fechas importantes.</Alert>;
  }

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function abrirNuevo() {
    setEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setErrorAccion('');
    setPanelAbierto(true);
  }

  function abrirEdicion(item) {
    setEditando(item);
    setFormulario({
      fecha: item.fecha || '',
      hora: item.hora || '',
      descripcion: item.descripcion || '',
    });
    setErrorAccion('');
    setPanelAbierto(true);
  }

  function cerrarPanel() {
    if (!guardando) setPanelAbierto(false);
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
        hora: formulario.hora,
        descripcion: formulario.descripcion.replace(/\s+/g, ' ').trim(),
      };
      if (editando) await editarFechaImportanteApi(token, editando.id, datos);
      else await registrarFechaImportanteApi(token, datos);
      setPanelAbierto(false);
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
        subtitle="Organiza cronológicamente los hitos que aparecen en la cuenta regresiva del dashboard"
        onRefresh={api.reload}
        loading={api.loading}
      />

      {mensaje && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}
      {errorAccion && !panelAbierto && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAccion('')}>
          {errorAccion}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
            <TextField
              size="small"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por descripción o fecha"
              sx={{ width: { xs: '100%', lg: 380 } }}
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
              control={(
                <Switch
                  checked={incluirInactivas}
                  onChange={(event) => {
                    setIncluirInactivas(event.target.checked);
                    if (!event.target.checked && filtro === 'inactivas') setFiltro('proximas');
                  }}
                />
              )}
              label="Ver eliminadas"
            />
            <Button variant="contained" startIcon={<AddRounded />} onClick={abrirNuevo}>
              Nueva fecha
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
        <Chip
          icon={<EventAvailableRounded />}
          label={`${api.data?.resumen?.proximas || 0} próximas`}
          color="success"
          variant="outlined"
        />
        <Chip
          icon={<HistoryRounded />}
          label={`${api.data?.resumen?.vencidas || 0} cumplidas`}
          variant="outlined"
        />
        {incluirInactivas && (
          <Chip label={`${api.data?.resumen?.inactivas || 0} eliminadas`} variant="outlined" />
        )}
      </Stack>

      {filtrados.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 7, px: 2, textAlign: 'center', borderRadius: 3 }}>
          <CalendarMonthRounded sx={{ fontSize: 54, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={800}>No hay fechas para mostrar</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Cambia los filtros o registra una nueva fecha.
          </Typography>
          <Button variant="contained" startIcon={<AddRounded />} onClick={abrirNuevo}>
            Registrar fecha
          </Button>
        </Paper>
      ) : (
        <Stack spacing={4}>
          {grupos.map((grupo) => (
            <Box key={grupo.nombre}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  sx={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}
                >
                  {grupo.nombre}
                </Typography>
                <Divider sx={{ flex: 1 }} />
                <Chip size="small" label={`${grupo.items.length} ${grupo.items.length === 1 ? 'fecha' : 'fechas'}`} />
              </Stack>

              <Box sx={{ position: 'relative' }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    left: { xs: 27, sm: 41 },
                    top: 34,
                    bottom: 34,
                    width: 2,
                    bgcolor: 'divider',
                  }}
                />

                <Stack spacing={1.5}>
                  {grupo.items.map((item) => {
                    const fecha = datosFecha(item);
                    return (
                      <Stack
                        key={item.id}
                        direction="row"
                        spacing={{ xs: 1.5, sm: 2 }}
                        alignItems="stretch"
                        sx={{ position: 'relative' }}
                      >
                        <Box
                          sx={{
                            width: { xs: 56, sm: 84 },
                            flexShrink: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            pt: 1,
                            zIndex: 1,
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              width: { xs: 50, sm: 64 },
                              py: 0.75,
                              textAlign: 'center',
                              border: 1,
                              borderColor: item.activo && item.diasRestantes === 0 ? 'primary.main' : 'divider',
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              opacity: item.activo ? 1 : 0.65,
                            }}
                          >
                            <Typography variant="h6" fontWeight={900} lineHeight={1.1}>
                              {fecha.dia}
                            </Typography>
                            <Typography variant="caption" fontWeight={800} color="text.secondary">
                              {fecha.mesCorto}
                            </Typography>
                          </Paper>
                        </Box>

                        <Paper
                          variant="outlined"
                          sx={{
                            flex: 1,
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 3,
                            opacity: item.activo ? 1 : 0.68,
                            borderColor:
                              item.activo && item.diasRestantes >= 0 && item.diasRestantes <= 7
                                ? 'warning.main'
                                : 'divider',
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'stretch', md: 'flex-start' }}
                            spacing={1.5}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                <Typography variant="h6" fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>
                                  {item.descripcion}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={etiquetaEstado(item)}
                                  color={colorEstado(item)}
                                  variant={item.activo ? 'filled' : 'outlined'}
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {item.fechaTexto}{item.horaTexto ? ` • ${item.horaTexto}` : ''}
                              </Typography>
                              <Typography
                                sx={{ mt: 1.25 }}
                                fontWeight={800}
                                color={item.activo && item.diasRestantes >= 0 ? 'primary.main' : 'text.secondary'}
                              >
                                {textoCuentaRegresiva(item)}
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                              {item.activo ? (
                                <>
                                  <Tooltip title="Editar fecha">
                                    <IconButton color="primary" onClick={() => abrirEdicion(item)} aria-label="Editar fecha">
                                      <EditRounded />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar fecha">
                                    <IconButton color="error" onClick={() => eliminar(item)} aria-label="Eliminar fecha">
                                      <DeleteOutlineRounded />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Button size="small" startIcon={<RestoreRounded />} onClick={() => restaurar(item)}>
                                  Restaurar
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Drawer
        anchor="right"
        open={panelAbierto}
        onClose={cerrarPanel}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 460 },
            maxWidth: '100vw',
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Sistema</Typography>
              <Typography variant="h6" fontWeight={900}>
                {editando ? 'Editar fecha importante' : 'Nueva fecha importante'}
              </Typography>
            </Box>
            <IconButton onClick={cerrarPanel} disabled={guardando} aria-label="Cerrar panel">
              <CloseRounded />
            </IconButton>
          </Stack>
          <Divider />

          <Stack spacing={2.25} sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
            {errorAccion && <Alert severity="error">{errorAccion}</Alert>}
            <TextField
              label="Fecha"
              type="date"
              required
              value={formulario.fecha}
              onChange={(event) => setFormulario((actual) => ({ ...actual, fecha: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: '2000-01-01', max: '2100-12-31' }}
              helperText="Se usará para ordenar el cronograma y calcular los días restantes."
              fullWidth
            />
            <TextField
              label="Hora (opcional)"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={formulario.hora}
              onChange={(event) => setFormulario((actual) => ({ ...actual, hora: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Descripción"
              required
              autoFocus
              value={formulario.descripcion}
              onChange={(event) => setFormulario((actual) => ({ ...actual, descripcion: event.target.value }))}
              multiline
              minRows={4}
              inputProps={{ maxLength: 160 }}
              helperText={`${formulario.descripcion.length}/160 caracteres`}
              placeholder="Ejemplo: Cierre de inscripciones"
              fullWidth
            />
          </Stack>

          <Divider />
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ p: 2 }}>
            <Button onClick={cerrarPanel} disabled={guardando}>Cancelar</Button>
            <Button variant="contained" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}
