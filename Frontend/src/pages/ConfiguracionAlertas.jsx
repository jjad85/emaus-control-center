import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  guardarConfiguracionAlertasApi,
  obtenerConfiguracionAlertasApi,
} from '../api/configuracionAlertasApi';

const clonarMatriz = (valor = {}) =>
  Object.fromEntries(Object.entries(valor).map(([codigo, roles]) => [codigo, [...(roles || [])]]));

const normalizarMatriz = (valor = {}) =>
  Object.fromEntries(
    Object.entries(valor)
      .map(([codigo, roles]) => [codigo, [...new Set(roles || [])].sort()])
      .sort(([a], [b]) => a.localeCompare(b)),
  );

export default function ConfiguracionAlertas() {
  const { token, tienePermiso } = useAuth();
  const api = useApi(() => obtenerConfiguracionAlertasApi(token), [token]);
  const theme = useTheme();
  const esMovil = useMediaQuery(theme.breakpoints.down('md'));

  const [matriz, setMatriz] = useState({});
  const [matrizOriginal, setMatrizOriginal] = useState({});
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [busquedaRol, setBusquedaRol] = useState('');
  const [busquedaAlerta, setBusquedaAlerta] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [categoriasAbiertas, setCategoriasAbiertas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const datos = api.data || {};
  const roles = datos.roles || [];
  const alertas = datos.alertas || [];

  useEffect(() => {
    if (!api.data) return;
    const nuevaMatriz = clonarMatriz(api.data.rolesPorAlerta || {});
    setMatriz(nuevaMatriz);
    setMatrizOriginal(clonarMatriz(nuevaMatriz));
  }, [api.data]);

  useEffect(() => {
    if (!roles.length) return;
    const existe = roles.some((item) => item.rol === rolSeleccionado);
    if (!existe) setRolSeleccionado(roles[0].rol);
  }, [roles, rolSeleccionado]);

  const rolesFiltrados = useMemo(() => {
    const q = busquedaRol.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((item) => String(item.rol || '').toLowerCase().includes(q));
  }, [roles, busquedaRol]);

  const alertasFiltradas = useMemo(() => {
    const q = busquedaAlerta.trim().toLowerCase();
    return alertas.filter((alerta) => {
      const asignada = (matriz[alerta.codigo] || []).includes(rolSeleccionado);
      const coincideFiltro =
        filtro === 'todas' ||
        (filtro === 'asignadas' && asignada) ||
        (filtro === 'sinAsignar' && !asignada);
      const coincideBusqueda =
        !q ||
        `${alerta.nombre || ''} ${alerta.descripcion || ''} ${alerta.categoria || ''} ${alerta.codigo || ''}`
          .toLowerCase()
          .includes(q);
      return coincideFiltro && coincideBusqueda;
    });
  }, [alertas, matriz, rolSeleccionado, filtro, busquedaAlerta]);

  const alertasPorCategoria = useMemo(() => {
    return alertasFiltradas.reduce((acumulado, alerta) => {
      const categoria = alerta.categoria || 'Sin categoría';
      if (!acumulado[categoria]) acumulado[categoria] = [];
      acumulado[categoria].push(alerta);
      return acumulado;
    }, {});
  }, [alertasFiltradas]);

  const totalAsignadas = useMemo(
    () => alertas.filter((alerta) => (matriz[alerta.codigo] || []).includes(rolSeleccionado)).length,
    [alertas, matriz, rolSeleccionado],
  );

  const cambiosPendientes = useMemo(
    () => JSON.stringify(normalizarMatriz(matriz)) !== JSON.stringify(normalizarMatriz(matrizOriginal)),
    [matriz, matrizOriginal],
  );

  const cantidadCambios = useMemo(() => {
    return alertas.reduce((total, alerta) => {
      const actual = (matriz[alerta.codigo] || []).includes(rolSeleccionado);
      const original = (matrizOriginal[alerta.codigo] || []).includes(rolSeleccionado);
      return total + (actual !== original ? 1 : 0);
    }, 0);
  }, [alertas, matriz, matrizOriginal, rolSeleccionado]);

  if (!tienePermiso('SISTEMA_TODO')) {
    return <Alert severity="error">No tiene permisos para configurar alertas.</Alert>;
  }
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function cambiar(codigo, rol, valorForzado) {
    setMensaje('');
    setError('');
    setMatriz((actual) => {
      const lista = actual[codigo] || [];
      const activa = lista.includes(rol);
      const nuevoValor = typeof valorForzado === 'boolean' ? valorForzado : !activa;
      const nuevaLista = nuevoValor
        ? [...new Set([...lista, rol])]
        : lista.filter((item) => item !== rol);
      return { ...actual, [codigo]: nuevaLista };
    });
  }

  function cambiarCategoria(alertasCategoria, valor) {
    setMensaje('');
    setError('');
    setMatriz((actual) => {
      const siguiente = { ...actual };
      alertasCategoria.forEach((alerta) => {
        const lista = siguiente[alerta.codigo] || [];
        siguiente[alerta.codigo] = valor
          ? [...new Set([...lista, rolSeleccionado])]
          : lista.filter((item) => item !== rolSeleccionado);
      });
      return siguiente;
    });
  }

  function cancelarCambios() {
    setMatriz(clonarMatriz(matrizOriginal));
    setMensaje('');
    setError('');
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    setError('');
    try {
      const actualizado = await guardarConfiguracionAlertasApi(token, matriz);
      const nuevaMatriz = clonarMatriz(actualizado.rolesPorAlerta || matriz);
      setMatriz(nuevaMatriz);
      setMatrizOriginal(clonarMatriz(nuevaMatriz));
      setMensaje('La configuración de alertas fue actualizada. Los cambios aplican inmediatamente en la campana.');
    } catch (e) {
      setError(e.message || 'No fue posible guardar la configuración.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sistema · Administración"
        title="Alertas y notificaciones"
        subtitle="Defina qué alertas puede consultar cada rol sin depender de una matriz horizontal"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5} pb={cambiosPendientes ? 10 : 0}>
        {mensaje && <Alert severity="success">{mensaje}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} minHeight={{ md: 590 }}>
            <Box
              sx={{
                width: { xs: '100%', md: 285 },
                p: 2.5,
                borderRight: { md: 1 },
                borderBottom: { xs: 1, md: 0 },
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <NotificationsActiveRounded color="primary" />
                <Typography variant="h6" fontWeight={900}>Roles</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Seleccione un rol para administrar las alertas que verá en la campana.
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Buscar rol"
                value={busquedaRol}
                onChange={(event) => setBusquedaRol(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{ mb: 1.5 }}
              />

              <Stack spacing={0.75} maxHeight={{ md: 430 }} overflow="auto">
                {rolesFiltrados.map((item) => {
                  const seleccionado = item.rol === rolSeleccionado;
                  const cantidad = alertas.filter((alerta) => (matriz[alerta.codigo] || []).includes(item.rol)).length;
                  return (
                    <Button
                      key={item.rol}
                      onClick={() => setRolSeleccionado(item.rol)}
                      variant={seleccionado ? 'contained' : 'text'}
                      color={seleccionado ? 'primary' : 'inherit'}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        py: 1.1,
                        px: 1.5,
                        fontWeight: seleccionado ? 900 : 700,
                      }}
                    >
                      <Box component="span" textAlign="left">{item.rol}</Box>
                      <Chip
                        size="small"
                        label={cantidad}
                        color={seleccionado ? 'default' : 'primary'}
                        variant={seleccionado ? 'filled' : 'outlined'}
                        sx={{ ml: 1 }}
                      />
                    </Button>
                  );
                })}
              </Stack>

              {!rolesFiltrados.length && (
                <Alert severity="info" sx={{ mt: 1 }}>No se encontraron roles.</Alert>
              )}
            </Box>

            <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                justifyContent="space-between"
                gap={2}
                alignItems={{ lg: 'flex-start' }}
              >
                <Box>
                  <Typography variant="h5" fontWeight={950}>{rolSeleccionado || 'Seleccione un rol'}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {totalAsignadas} de {alertas.length} alertas asignadas
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip icon={<CheckCircleRounded />} label={`${totalAsignadas} asignadas`} color="success" variant="outlined" />
                  <Chip icon={<RadioButtonUncheckedRounded />} label={`${Math.max(alertas.length - totalAsignadas, 0)} sin asignar`} variant="outlined" />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Stack direction={{ xs: 'column', lg: 'row' }} gap={1.5} mb={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar alerta, descripción, categoría o código"
                  value={busquedaAlerta}
                  onChange={(event) => setBusquedaAlerta(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
                    ),
                  }}
                />
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={filtro}
                  onChange={(_, valor) => valor && setFiltro(valor)}
                  sx={{ flexShrink: 0 }}
                >
                  <ToggleButton value="todas">Todas</ToggleButton>
                  <ToggleButton value="asignadas">Asignadas</ToggleButton>
                  <ToggleButton value="sinAsignar">Sin asignar</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Stack spacing={1.25}>
                {Object.entries(alertasPorCategoria).map(([categoria, items]) => {
                  const asignadasCategoria = items.filter((alerta) => (matriz[alerta.codigo] || []).includes(rolSeleccionado)).length;
                  const todasAsignadas = items.length > 0 && asignadasCategoria === items.length;
                  const abierta = categoriasAbiertas[categoria] ?? Boolean(busquedaAlerta);
                  return (
                    <Accordion
                      key={categoria}
                      expanded={abierta}
                      onChange={(_, expandida) => setCategoriasAbiertas((actual) => ({ ...actual, [categoria]: expandida }))}
                      disableGutters
                      elevation={0}
                      sx={{ border: 1, borderColor: 'divider', borderRadius: '12px !important', overflow: 'hidden' }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 0.5, sm: 1.5 }}
                          alignItems={{ sm: 'center' }}
                          width="100%"
                          pr={1}
                        >
                          <Typography fontWeight={900} flex={1}>{categoria}</Typography>
                          <Chip size="small" label={`${asignadasCategoria} de ${items.length}`} color={todasAsignadas ? 'success' : 'default'} variant="outlined" />
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Stack direction="row" justifyContent="flex-end" spacing={1} mb={1.5}>
                          <Button size="small" onClick={() => cambiarCategoria(items, true)}>Asignar todas</Button>
                          <Button size="small" color="inherit" onClick={() => cambiarCategoria(items, false)}>Quitar todas</Button>
                        </Stack>
                        <Stack divider={<Divider flexItem />}>
                          {items.map((alerta) => {
                            const activa = (matriz[alerta.codigo] || []).includes(rolSeleccionado);
                            return (
                              <Stack
                                key={alerta.codigo}
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ sm: 'center' }}
                                gap={1.5}
                                py={1.5}
                              >
                                <Box minWidth={0}>
                                  <Typography fontWeight={850}>{alerta.nombre}</Typography>
                                  <Typography variant="body2" color="text.secondary" mt={0.25}>
                                    {alerta.descripcion}
                                  </Typography>
                                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                    {alerta.codigo}
                                  </Typography>
                                </Box>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={activa}
                                      onChange={(_, checked) => cambiar(alerta.codigo, rolSeleccionado, checked)}
                                      inputProps={{ 'aria-label': `${alerta.nombre} para ${rolSeleccionado}` }}
                                    />
                                  }
                                  label={activa ? 'Activa' : 'Inactiva'}
                                  labelPlacement={esMovil ? 'end' : 'start'}
                                  sx={{ m: 0, flexShrink: 0 }}
                                />
                              </Stack>
                            );
                          })}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>

              {!Object.keys(alertasPorCategoria).length && (
                <Alert severity="info">No se encontraron alertas con los filtros seleccionados.</Alert>
              )}
            </Box>
          </Stack>
        </Paper>
      </Stack>

      {cambiosPendientes && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: { xs: 12, md: 280 },
            right: 12,
            bottom: 12,
            zIndex: (tema) => tema.zIndex.snackbar,
            p: 1.5,
            border: 1,
            borderColor: 'warning.light',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5}>
            <Box>
              <Typography fontWeight={900}>Cambios pendientes</Typography>
              <Typography variant="body2" color="text.secondary">
                {cantidadCambios
                  ? `${cantidadCambios} alerta${cantidadCambios === 1 ? '' : 's'} modificada${cantidadCambios === 1 ? '' : 's'} para ${rolSeleccionado}.`
                  : 'Hay cambios sin guardar en otros roles.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button startIcon={<RestartAltRounded />} color="inherit" onClick={cancelarCambios} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
                disabled={guardando}
                onClick={guardar}
              >
                Guardar cambios
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
