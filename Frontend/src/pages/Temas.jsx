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
import AssignmentIndRounded from '@mui/icons-material/AssignmentIndRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import RecordVoiceOverRounded from '@mui/icons-material/RecordVoiceOverRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ToggleOffRounded from '@mui/icons-material/ToggleOffRounded';
import ToggleOnRounded from '@mui/icons-material/ToggleOnRounded';

import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  cambiarEstadoTema,
  editarTema,
  obtenerTemas,
  registrarTema,
} from '../api/temasApi';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

const FORMULARIO_INICIAL = {
  nombre: '',
  servidorId: '',
  requierePresentacion: false,
  requiereTestimonio: false,
};

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function esAdministrador(rol) {
  const valor = normalizar(rol);
  return valor === 'administrador' || valor === 'administradores';
}

export default function Temas() {
  const { token, rol } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [temaEditando, setTemaEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  const api = useApi(
    () => obtenerTemas(token, { incluirInactivos }),
    [token, incluirInactivos]
  );

  const items = api.data?.items || [];
  const servidores = api.data?.servidores || [];

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda);

    if (!texto) return items;

    return items.filter((item) => (
      normalizar(item.nombre).includes(texto) ||
      normalizar(item.servidorNombre).includes(texto)
    ));
  }, [items, busqueda]);

  const resumen = useMemo(() => ({
    activos: items.filter((item) => item.activo).length,
    sinAsignar: items.filter((item) => item.activo && !item.servidorId).length,
    inactivos: items.filter((item) => !item.activo).length,
  }), [items]);

  if (!esAdministrador(rol)) {
    return (
      <Alert severity="error">
        Esta funcionalidad es exclusiva para administradores.
      </Alert>
    );
  }

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
      servidorId: item.servidorId || '',
      requierePresentacion: Boolean(item.requierePresentacion),
      requiereTestimonio: Boolean(item.requiereTestimonio),
    });
    setErrorAccion('');
    setDialogoAbierto(true);
  }

  function cerrarDialogo() {
    if (guardando) return;
    setDialogoAbierto(false);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar() {
    if (!formulario.nombre.trim()) {
      setErrorAccion('El nombre del tema es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorAccion('');

    try {
      if (temaEditando) {
        await editarTema(token, temaEditando.id, formulario);
      } else {
        await registrarTema(token, formulario);
      }

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
    const confirmado = window.confirm(
      `¿Confirma que desea ${accion} el tema “${item.nombre}”?`
    );

    if (!confirmado) return;

    setErrorAccion('');

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
        title="Temas de servidores"
        subtitle="Define los temas del retiro y asígnalos cuando el servidor esté confirmado"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 2 }}
      >
        <TextField
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por tema o servidor"
          size="small"
          sx={{ width: { xs: '100%', md: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControlLabel
            control={(
              <Switch
                checked={incluirInactivos}
                onChange={(event) => setIncluirInactivos(event.target.checked)}
              />
            )}
            label="Mostrar inactivos"
          />

          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={abrirNuevo}
          >
            Nuevo tema
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`${resumen.activos} activos`} color="success" variant="outlined" />
        <Chip
          label={`${resumen.sinAsignar} sin servidor`}
          color={resumen.sinAsignar > 0 ? 'warning' : 'default'}
          variant="outlined"
        />
        {incluirInactivos && (
          <Chip label={`${resumen.inactivos} inactivos`} variant="outlined" />
        )}
      </Stack>

      {errorAccion && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAccion('')}>
          {errorAccion}
        </Alert>
      )}

      <Grid container spacing={2}>
        {filtrados.map((item) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.id}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: item.activo ? 1 : 0.72,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={900}>
                        {item.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.activo ? 'Tema vigente' : 'Tema inactivo'}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={item.activo ? 'Activo' : 'Inactivo'}
                      color={item.activo ? 'success' : 'default'}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <AssignmentIndRounded color={item.servidorId ? 'primary' : 'disabled'} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Servidor asignado
                      </Typography>
                      <Typography fontWeight={800}>
                        {item.servidorNombre || 'Pendiente por asignar'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      icon={<OndemandVideoRounded />}
                      label={item.requierePresentacion ? 'Requiere presentación' : 'Sin presentación'}
                      color={item.requierePresentacion ? 'primary' : 'default'}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      icon={<RecordVoiceOverRounded />}
                      label={item.requiereTestimonio ? 'Requiere testimonio' : 'Sin testimonio'}
                      color={item.requiereTestimonio ? 'secondary' : 'default'}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditRounded />}
                  onClick={() => abrirEdicion(item)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color={item.activo ? 'warning' : 'success'}
                  startIcon={item.activo ? <ToggleOnRounded /> : <ToggleOffRounded />}
                  onClick={() => alternarEstado(item)}
                >
                  {item.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtrados.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {busqueda
            ? 'No se encontraron temas con ese criterio de búsqueda.'
            : 'No hay temas registrados. Crea el primero para comenzar.'}
        </Alert>
      )}

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>
          {temaEditando ? 'Editar tema' : 'Nuevo tema'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {errorAccion && <Alert severity="error">{errorAccion}</Alert>}

            <TextField
              label="Nombre del tema"
              value={formulario.nombre}
              onChange={(event) => cambiarCampo('nombre', event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 150 }}
            />

            <TextField
              select
              label="Servidor asignado"
              value={formulario.servidorId}
              onChange={(event) => cambiarCampo('servidorId', event.target.value)}
              fullWidth
              helperText="Es opcional. Puedes crear el tema ahora y asignar el servidor después."
            >
              <MenuItem value="">Sin servidor asignado</MenuItem>
              {servidores.map((servidor) => (
                <MenuItem key={servidor.id} value={servidor.id}>
                  {servidor.nombre}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={(
                <Switch
                  checked={formulario.requierePresentacion}
                  onChange={(event) => cambiarCampo('requierePresentacion', event.target.checked)}
                />
              )}
              label="Este tema requiere presentación"
            />

            <FormControlLabel
              control={(
                <Switch
                  checked={formulario.requiereTestimonio}
                  onChange={(event) => cambiarCampo('requiereTestimonio', event.target.checked)}
                />
              )}
              label="Este tema requiere testimonio"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
