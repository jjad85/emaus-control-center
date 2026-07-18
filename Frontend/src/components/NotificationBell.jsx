import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import AssignmentIndRounded from '@mui/icons-material/AssignmentIndRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { obtenerNotificaciones } from '../api/notificacionesApi';

const INTERVALO_ACTUALIZACION = 60000;

export default function NotificationBell({ modo = 'desktop' }) {
  const navigate = useNavigate();

  const {
    token,
    autenticado,
    loading: authLoading,
    tienePermiso,
  } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [datos, setDatos] = useState({
    total: 0,
    totalPendientes: 0,
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const puedeConsultar =
    !authLoading &&
    autenticado &&
    tienePermiso('CONVERTIR_ASPIRANTE');

  const cargar = useCallback(async () => {
    if (!puedeConsultar || !token) {
      setDatos({ total: 0, totalPendientes: 0, items: [] });
      setError('');
      return;
    }

    setLoading(true);

    try {
      const resultado = await obtenerNotificaciones(token);

      setDatos({
        total: Number(resultado?.total || 0),
        totalPendientes: Number(resultado?.totalPendientes || 0),
        items: Array.isArray(resultado?.items) ? resultado.items : [],
      });
      setError('');
    } catch (e) {
      setError(
        e?.message ||
          'No fue posible consultar las notificaciones.'
      );
    } finally {
      setLoading(false);
    }
  }, [puedeConsultar, token]);

  useEffect(() => {
    cargar();

    if (!puedeConsultar) {
      return undefined;
    }

    const intervalo = window.setInterval(
      cargar,
      INTERVALO_ACTUALIZACION
    );

    function alCambiarVisibilidad() {
      if (document.visibilityState === 'visible') {
        cargar();
      }
    }

    function alActualizarNotificaciones() {
      cargar();
    }

    document.addEventListener(
      'visibilitychange',
      alCambiarVisibilidad
    );
    window.addEventListener(
      'emaus:notificaciones-actualizar',
      alActualizarNotificaciones
    );

    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener(
        'visibilitychange',
        alCambiarVisibilidad
      );
      window.removeEventListener(
        'emaus:notificaciones-actualizar',
        alActualizarNotificaciones
      );
    };
  }, [cargar, puedeConsultar]);

  if (!puedeConsultar) {
    return null;
  }

  const abierto = Boolean(anchorEl);
  const cantidad = datos.totalPendientes || 0;
  const esMovil = modo === 'mobile';

  function abrir(event) {
    setAnchorEl(event.currentTarget);
    cargar();
  }

  function cerrar() {
    setAnchorEl(null);
  }

  function abrirNotificacion(item) {
    cerrar();
    if (item?.ruta) {
      navigate(item.ruta);
    }
  }

  return (
    <>
      <Tooltip title="Notificaciones" arrow>
        <IconButton
          aria-label={
            cantidad > 0
              ? `${cantidad} aspirantes pendientes`
              : 'Sin notificaciones pendientes'
          }
          onClick={abrir}
          sx={{
            width: esMovil ? 40 : 44,
            height: esMovil ? 40 : 44,
            bgcolor: esMovil
              ? 'rgba(255,255,255,.12)'
              : '#ffffff',
            color: esMovil ? '#ffffff' : '#173b34',
            border: esMovil
              ? '1px solid rgba(255,255,255,.22)'
              : '1px solid rgba(23,59,52,.16)',
            boxShadow: esMovil ? 'none' : 2,
            '&:hover': {
              bgcolor: esMovil
                ? 'rgba(255,255,255,.20)'
                : '#f5f8f7',
            },
          }}
        >
          <Badge
            color="error"
            badgeContent={cantidad}
            max={99}
            invisible={cantidad === 0}
          >
            <NotificationsRounded />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={abierto}
        anchorEl={anchorEl}
        onClose={cerrar}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: 'calc(100vw - 24px)',
                sm: 390,
              },
              maxWidth: 420,
              mt: 1,
              borderRadius: 3,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Paper elevation={0}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            <Box>
              <Typography fontWeight={900}>
                Notificaciones
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendientes que requieren tu atención
              </Typography>
            </Box>

            <Tooltip title="Actualizar" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={cargar}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <RefreshRounded fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Divider />

          {error && (
            <Alert
              severity="warning"
              sx={{ m: 1.5, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {!error && !loading && datos.items.length === 0 && (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography fontWeight={800}>
                No tienes pendientes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No hay aspirantes que requieran gestión.
              </Typography>
            </Box>
          )}

          {!error && datos.items.length > 0 && (
            <List disablePadding>
              {datos.items.map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => abrirNotificacion(item)}
                  sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 38, color: 'warning.main', mt: 0.25 }}
                  >
                    <AssignmentIndRounded />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.titulo}
                    secondary={item.mensaje}
                    primaryTypographyProps={{ fontWeight: 900 }}
                    secondaryTypographyProps={{ mt: 0.4 }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>
      </Popover>
    </>
  );
}
