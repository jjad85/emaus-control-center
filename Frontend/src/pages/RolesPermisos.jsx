import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import SelectAllRounded from '@mui/icons-material/SelectAllRounded';
import RemoveDoneRounded from '@mui/icons-material/RemoveDoneRounded';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { guardarPermisosRolSistemaApi, obtenerAdministracionSistemaApi } from '../api/administracionApi';

function normalizarPermiso(item) {
  if (typeof item === 'string') {
    return { codigo: item, modulo: 'Otros', pagina: 'Otros', accion: item };
  }
  return {
    codigo: item.codigo,
    modulo: item.modulo || 'Otros',
    pagina: item.pagina || 'Otros',
    accion: item.accion || item.codigo,
    descripcion: item.descripcion || '',
  };
}


function obtenerNombreVisibleRol(rol) {
  const codigo = String(rol || '').trim().toUpperCase();

  if (codigo === 'ANGELITOS') {
    return 'SERVICIO AL RETIRO';
  }

  return rol;
}

function obtenerDescripcionRolVisual(rol) {
  const codigo = String(rol || '').trim().toUpperCase();

  if (codigo === 'ANGELITOS') {
    return 'Angelitos y Serenata';
  }

  return '';
}

export default function RolesPermisos() {
  const { token, tienePermiso } = useAuth();
  const api = useApi(() => obtenerAdministracionSistemaApi(token), [token]);
  const theme = useTheme();
  const esMovil = useMediaQuery(theme.breakpoints.down('md'));

  const [matriz, setMatriz] = useState({});
  const [matrizInicial, setMatrizInicial] = useState({});
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [busquedaRol, setBusquedaRol] = useState('');
  const [busquedaPermiso, setBusquedaPermiso] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const datos = api.data || {};
  const roles = datos.roles || [];
  const catalogo = useMemo(() => (datos.permisos || []).map(normalizarPermiso), [datos.permisos]);

  useEffect(() => {
    if (!api.data) return;
    const inicial = {};
    roles.forEach((rol) => {
      inicial[rol.rol] = [...(datos.permisosPorRol?.[rol.rol] || [])];
    });
    setMatriz(inicial);
    setMatrizInicial(inicial);
    setRolSeleccionado((actual) => {
      if (actual && roles.some((rol) => rol.rol === actual)) return actual;
      return roles[0]?.rol || '';
    });
  }, [api.data]);

  const rolesFiltrados = useMemo(() => {
    const texto = busquedaRol.trim().toLowerCase();
    if (!texto) return roles;
    return roles.filter((rol) => String(rol.rol || '').toLowerCase().includes(texto));
  }, [roles, busquedaRol]);

  const permisosRol = matriz[rolSeleccionado] || [];
  const permisosInicialesRol = matrizInicial[rolSeleccionado] || [];

  const cambiosPendientes = useMemo(() => {
    const todosRoles = new Set([...Object.keys(matriz), ...Object.keys(matrizInicial)]);
    let total = 0;
    todosRoles.forEach((rol) => {
      const actual = new Set(matriz[rol] || []);
      const inicial = new Set(matrizInicial[rol] || []);
      actual.forEach((codigo) => { if (!inicial.has(codigo)) total += 1; });
      inicial.forEach((codigo) => { if (!actual.has(codigo)) total += 1; });
    });
    return total;
  }, [matriz, matrizInicial]);

  const cambiosRolSeleccionado = useMemo(() => {
    const actual = new Set(permisosRol);
    const inicial = new Set(permisosInicialesRol);
    let total = 0;
    actual.forEach((codigo) => { if (!inicial.has(codigo)) total += 1; });
    inicial.forEach((codigo) => { if (!actual.has(codigo)) total += 1; });
    return total;
  }, [permisosRol, permisosInicialesRol]);

  const grupos = useMemo(() => {
    const texto = busquedaPermiso.trim().toLowerCase();
    const asignados = new Set(permisosRol);
    const mapa = new Map();

    catalogo.forEach((permiso) => {
      const estaAsignado = asignados.has(permiso.codigo);
      if (filtro === 'asignados' && !estaAsignado) return;
      if (filtro === 'sinAsignar' && estaAsignado) return;

      const contenido = [permiso.modulo, permiso.pagina, permiso.accion, permiso.codigo, permiso.descripcion]
        .join(' ')
        .toLowerCase();
      if (texto && !contenido.includes(texto)) return;

      const clave = permiso.modulo || 'Otros';
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(permiso);
    });

    return Array.from(mapa.entries()).map(([modulo, permisos]) => ({ modulo, permisos }));
  }, [catalogo, permisosRol, busquedaPermiso, filtro]);

  if (!tienePermiso('SISTEMA_TODO')) return <Alert severity="error">No tiene permisos para administrar roles y permisos.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function cambiar(permiso) {
    if (!rolSeleccionado) return;
    setMensaje('');
    setError('');
    setMatriz((actual) => {
      const lista = actual[rolSeleccionado] || [];
      return {
        ...actual,
        [rolSeleccionado]: lista.includes(permiso)
          ? lista.filter((codigo) => codigo !== permiso)
          : [...lista, permiso],
      };
    });
  }

  function cambiarGrupo(permisos, asignar) {
    if (!rolSeleccionado) return;
    const codigos = permisos.map((permiso) => permiso.codigo);
    setMensaje('');
    setError('');
    setMatriz((actual) => {
      const lista = new Set(actual[rolSeleccionado] || []);
      codigos.forEach((codigo) => {
        if (asignar) lista.add(codigo);
        else lista.delete(codigo);
      });
      return { ...actual, [rolSeleccionado]: Array.from(lista) };
    });
  }

  function cancelarCambios() {
    setMatriz(Object.fromEntries(Object.entries(matrizInicial).map(([rol, permisos]) => [rol, [...permisos]])));
    setMensaje('');
    setError('');
  }

  async function guardarTodo() {
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      for (const rol of roles) {
        await guardarPermisosRolSistemaApi(token, rol.rol, matriz[rol.rol] || []);
      }
      setMensaje('Los permisos fueron actualizados correctamente. Cierre sesión e ingrese nuevamente para refrescarlos.');
      await api.reload();
    } catch (e) {
      setError(e.message || 'No fue posible guardar los permisos.');
    } finally {
      setProcesando(false);
    }
  }

  const selectorRoles = (
    <Paper variant="outlined" sx={{ p: 1.5, height: 'fit-content' }}>
      <Typography fontWeight={900} mb={1}>Roles</Typography>
      <TextField
        value={busquedaRol}
        onChange={(event) => setBusquedaRol(event.target.value)}
        placeholder="Buscar rol"
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
          ),
        }}
      />
      <List dense disablePadding sx={{ mt: 1, maxHeight: esMovil ? 220 : '64vh', overflowY: 'auto' }}>
        {rolesFiltrados.map((rol) => {
          const cantidad = (matriz[rol.rol] || []).length;
          const tieneCambios = (() => {
            const actual = new Set(matriz[rol.rol] || []);
            const inicial = new Set(matrizInicial[rol.rol] || []);
            return actual.size !== inicial.size || [...actual].some((codigo) => !inicial.has(codigo));
          })();
          return (
            <ListItemButton
              key={rol.rol}
              selected={rolSeleccionado === rol.rol}
              onClick={() => setRolSeleccionado(rol.rol)}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemText
                primary={
                  <Typography fontWeight={rolSeleccionado === rol.rol ? 900 : 600}>
                    {obtenerNombreVisibleRol(rol.rol)}
                  </Typography>
                }
                secondary={
                  obtenerDescripcionRolVisual(rol.rol)
                    ? `${obtenerDescripcionRolVisual(rol.rol)} · ${cantidad} permiso${cantidad === 1 ? '' : 's'}`
                    : `${cantidad} permiso${cantidad === 1 ? '' : 's'}`
                }
              />
              {tieneCambios && <Chip label="Sin guardar" size="small" color="warning" variant="outlined" />}
            </ListItemButton>
          );
        })}
        {!rolesFiltrados.length && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No se encontraron roles.
          </Typography>
        )}
      </List>
    </Paper>
  );

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Roles y permisos"
        subtitle="Seleccione un rol y administre sus permisos por módulo"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5} pb={cambiosPendientes ? 10 : 2}>
        {mensaje && <Alert severity="success">{mensaje}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          {selectorRoles}

          <Paper sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0 }}>
            {!rolSeleccionado ? (
              <Alert severity="info">No hay roles disponibles para configurar.</Alert>
            ) : (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
                  <Box>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="h6" fontWeight={900}>
                        {obtenerNombreVisibleRol(rolSeleccionado)}
                      </Typography>
                      {String(rolSeleccionado || '').trim().toUpperCase() === 'ANGELITOS' && (
                        <Chip
                          label="Rol interno: ANGELITOS"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      )}
                      {cambiosRolSeleccionado > 0 && (
                        <Chip label={`${cambiosRolSeleccionado} cambio${cambiosRolSeleccionado === 1 ? '' : 's'}`} size="small" color="warning" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {permisosRol.length} de {catalogo.length} permisos asignados
                    </Typography>
                    {String(rolSeleccionado || '').trim().toUpperCase() === 'ANGELITOS' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
                        Este perfil administra el módulo Servicio al retiro. El código ANGELITOS se conserva por compatibilidad.
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    icon={<SecurityRounded />}
                    label={`${grupos.length} módulo${grupos.length === 1 ? '' : 's'} visibles`}
                    variant="outlined"
                  />
                </Stack>

                <Divider />

                <Stack direction={{ xs: 'column', lg: 'row' }} gap={1.5} justifyContent="space-between">
                  <TextField
                    value={busquedaPermiso}
                    onChange={(event) => setBusquedaPermiso(event.target.value)}
                    placeholder="Buscar permiso, página o módulo"
                    size="small"
                    sx={{ width: { xs: '100%', lg: 420 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
                      ),
                    }}
                  />
                  <ToggleButtonGroup
                    value={filtro}
                    exclusive
                    onChange={(_, valor) => valor && setFiltro(valor)}
                    size="small"
                    sx={{ alignSelf: { xs: 'stretch', lg: 'center' }, '& .MuiToggleButton-root': { flex: { xs: 1, lg: 'initial' } } }}
                  >
                    <ToggleButton value="todos">Todos</ToggleButton>
                    <ToggleButton value="asignados">Asignados</ToggleButton>
                    <ToggleButton value="sinAsignar">Sin asignar</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                <Box>
                  {grupos.map((grupo, indice) => {
                    const asignadosGrupo = grupo.permisos.filter((permiso) => permisosRol.includes(permiso.codigo)).length;
                    const todosAsignados = asignadosGrupo === grupo.permisos.length && grupo.permisos.length > 0;
                    return (
                      <Accordion
                        key={grupo.modulo}
                        defaultExpanded={indice === 0 && !busquedaPermiso}
                        disableGutters
                        elevation={0}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: '12px !important',
                          mb: 1.25,
                          overflow: 'hidden',
                          '&:before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" pr={1} gap={1}>
                            <Box minWidth={0}>
                              <Typography fontWeight={900} noWrap>{grupo.modulo}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asignadosGrupo} de {grupo.permisos.length} asignados
                              </Typography>
                            </Box>
                            <Chip
                              label={todosAsignados ? 'Completo' : `${asignadosGrupo}/${grupo.permisos.length}`}
                              size="small"
                              color={todosAsignados ? 'success' : 'default'}
                              variant={todosAsignados ? 'filled' : 'outlined'}
                            />
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mb={1.5}>
                            <Button
                              size="small"
                              startIcon={<SelectAllRounded />}
                              onClick={() => cambiarGrupo(grupo.permisos, true)}
                            >
                              Seleccionar todos
                            </Button>
                            <Button
                              size="small"
                              color="inherit"
                              startIcon={<RemoveDoneRounded />}
                              onClick={() => cambiarGrupo(grupo.permisos, false)}
                            >
                              Quitar todos
                            </Button>
                          </Stack>

                          <Stack divider={<Divider flexItem />}>
                            {grupo.permisos.map((permiso) => {
                              const activo = permisosRol.includes(permiso.codigo);
                              return (
                                <Box
                                  key={permiso.codigo}
                                  onClick={() => cambiar(permiso.codigo)}
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                                    gap: 1.25,
                                    alignItems: 'start',
                                    py: 1.25,
                                    cursor: 'pointer',
                                    borderRadius: 1.5,
                                    px: 0.75,
                                    '&:hover': { bgcolor: 'action.hover' },
                                  }}
                                >
                                  <Checkbox
                                    checked={activo}
                                    onChange={() => cambiar(permiso.codigo)}
                                    onClick={(event) => event.stopPropagation()}
                                    sx={{ p: 0.5 }}
                                  />
                                  <Box minWidth={0}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.25, sm: 1 }} alignItems={{ sm: 'center' }}>
                                      <Typography fontWeight={800}>{permiso.accion}</Typography>
                                      <Typography variant="caption" color="text.secondary">{permiso.pagina}</Typography>
                                    </Stack>
                                    {permiso.descripcion && (
                                      <Typography variant="body2" color="text.secondary" mt={0.25}>{permiso.descripcion}</Typography>
                                    )}
                                    <Typography variant="caption" color="text.disabled" sx={{ overflowWrap: 'anywhere' }}>
                                      {permiso.codigo}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}

                  {!grupos.length && (
                    <Alert severity="info">No hay permisos que coincidan con la búsqueda o el filtro seleccionado.</Alert>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>
        </Box>
      </Stack>

      {cambiosPendientes > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: { xs: 12, md: 'calc(280px + 24px)' },
            right: { xs: 12, md: 24 },
            bottom: 16,
            zIndex: theme.zIndex.appBar + 1,
            p: 1.5,
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5}>
            <Box>
              <Typography fontWeight={900}>
                {cambiosPendientes} cambio{cambiosPendientes === 1 ? '' : 's'} sin guardar
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Se conservarán mientras cambias entre roles.
              </Typography>
            </Box>
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button color="inherit" disabled={procesando} onClick={cancelarCambios}>Cancelar</Button>
              <Button
                variant="contained"
                startIcon={procesando ? <CircularProgress size={18} color="inherit" /> : <SecurityRounded />}
                disabled={procesando}
                onClick={guardarTodo}
              >
                Guardar permisos
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
