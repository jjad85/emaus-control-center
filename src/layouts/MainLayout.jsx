import {
  Alert,
  alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import DashboardRounded from '@mui/icons-material/DashboardRounded';
import AssignmentIndRounded from '@mui/icons-material/AssignmentIndRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import HotelRounded from '@mui/icons-material/HotelRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';
import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { useApi } from '../hooks/useApi';
import { normalizarConfiguracionTema } from '../theme/themeConfig';

const drawerWidth = 260;

const ITEMS = [
  ['Dashboard', '/dashboard', <DashboardRounded />],
  ['Aspirantes', '/aspirantes', <AssignmentIndRounded />],
  ['Equipos', '/equipos', <GroupsRounded />],
  ['Servidores', '/servidores', <PersonRounded />],
  ['Caminantes', '/caminantes', <GroupsRounded />],
  ['Mesas', '/mesas', <TableRestaurantRounded />],
  ['Presentaciones', '/presentaciones', <SlideshowRounded />],
  ['Habitaciones', '/habitaciones', <HotelRounded />],
  ['Minutograma', '/minutograma', <AccessTimeRounded />],
  ['Configuración', '/configuracion', <SettingsRounded />],
];

function LogoSistema({ configuracion, compacto = false }) {
  if (!configuracion.temaLogo) {
    return (
      <Typography
        variant={compacto ? 'subtitle1' : 'overline'}
        fontWeight={900}
        sx={{
          color: configuracion.temaColorSecundario,
          letterSpacing: 1.2,
        }}
      >
        EMAÚS
      </Typography>
    );
  }

  return (
    <Box
      component="img"
      src={configuracion.temaLogo}
      alt={configuracion.sistemaNombre}
      sx={{
        display: 'block',
        width: compacto ? 36 : 'auto',
        height: compacto ? 36 : 48,
        maxWidth: compacto ? 36 : 170,
        objectFit: 'contain',
      }}
    />
  );
}

function PieAutor({ configuracion, centrado = false }) {
  return (
    <Box
      sx={{
        mt: 2,
        textAlign: centrado ? 'center' : 'left',
        opacity: 0.68,
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: 'block', color: 'inherit', lineHeight: 1.3 }}
      >
        {configuracion.sistemaFooter}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.35,
          color: 'inherit',
          fontSize: '0.66rem',
          letterSpacing: 0.2,
        }}
      >
        Diseñado y desarrollado por{' '}
        <Box component="span" sx={{ fontWeight: 800 }}>
          {configuracion.sistemaAutor}
        </Box>
        {configuracion.sistemaVersion
          ? ` · ${configuracion.sistemaVersion}`
          : ''}
      </Typography>
    </Box>
  );
}

export default function MainLayout() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { autenticado, nombre, rol, logout } = useAuth();
  const configuracionApi = useApi(() => obtenerConfiguraciones(), []);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutMessageOpen, setLogoutMessageOpen] = useState(false);

  const configuracion = useMemo(
    () =>
      normalizarConfiguracionTema(
        configuracionApi.data || theme.emaus || {},
      ),
    [configuracionApi.data, theme.emaus],
  );

  const tituloRetiro = [
    configuracion.tipoRetiro
      ? `Retiro ${configuracion.tipoRetiro}`
      : 'Retiro',
    configuracion.anioRetiro,
  ]
    .filter(Boolean)
    .join(' - ');

  const inicial = String(nombre || 'I').trim().charAt(0).toUpperCase();

  function navegar(path) {
    navigate(path);
    setMobileOpen(false);
  }

  async function handleLogout() {
    setMobileOpen(false);
    await logout();
    setLogoutMessageOpen(true);
  }

  const colorMenu = configuracion.temaColorPrimario;
  const colorTextoMenu = configuracion.temaColorTextoMenu;
  const colorSecundario = configuracion.temaColorSecundario;

  const contenidoMenu = (
    <>
      <Toolbar
        sx={{
          alignItems: 'flex-start',
          flexDirection: 'column',
          py: 2,
          minHeight: 120,
        }}
      >
        <Box sx={{ width: '100%', pr: { xs: 4, md: 0 } }}>
          <LogoSistema configuracion={configuracion} />

          <Typography
            variant="h6"
            fontWeight={850}
            sx={{ mt: 0.65, lineHeight: 1.2 }}
          >
            {tituloRetiro}
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: alpha(colorTextoMenu, 0.72) }}
          >
            {configuracion.sistemaSubtitulo}
          </Typography>
        </Box>
      </Toolbar>

      <List sx={{ px: 1.5, flex: 1, overflowY: 'auto' }}>
        {ITEMS.map(([label, path, icon]) => (
          <ListItemButton
            key={path}
            selected={location.pathname === path}
            onClick={() => navegar(path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: colorTextoMenu,
              '& .MuiListItemIcon-root': {
                color: configuracion.temaColorIconosMenu,
              },
              '&.Mui-selected': {
                bgcolor: alpha(colorTextoMenu, 0.14),
              },
              '&.Mui-selected:hover': {
                bgcolor: alpha(colorTextoMenu, 0.2),
              },
              '&:hover': {
                bgcolor: alpha(colorTextoMenu, 0.09),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>

      <Box
        sx={{
          p: 2,
          pb: {
            xs: 'calc(16px + env(safe-area-inset-bottom))',
            md: 2,
          },
        }}
      >
        <Divider
          sx={{ mb: 2, borderColor: alpha(colorTextoMenu, 0.16) }}
        />

        {autenticado && (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: colorSecundario,
                  color: configuracion.temaColorPrimarioOscuro,
                  fontWeight: 850,
                }}
              >
                {inicial}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} noWrap>
                  {nombre}
                </Typography>

                <Chip
                  size="small"
                  label={rol || 'Sin rol'}
                  sx={{
                    mt: 0.5,
                    bgcolor: alpha(colorTextoMenu, 0.12),
                    color: colorTextoMenu,
                  }}
                />
              </Box>
            </Stack>

            <Button
              color="inherit"
              variant="outlined"
              startIcon={<LogoutRounded />}
              onClick={handleLogout}
              fullWidth
              sx={{
                borderColor: alpha(colorTextoMenu, 0.35),
                '&:hover': {
                  borderColor: alpha(colorTextoMenu, 0.75),
                  bgcolor: alpha(colorTextoMenu, 0.08),
                },
              }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        )}

        <PieAutor configuracion={configuracion} />
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: colorMenu,
          color: colorTextoMenu,
          pt: 'env(safe-area-inset-top)',
          zIndex: (muiTheme) => muiTheme.zIndex.drawer - 1,
          borderBottom: `1px solid ${alpha(colorTextoMenu, 0.12)}`,
        }}
      >
        <Toolbar sx={{ minHeight: 58, px: 1.25 }}>
          <IconButton
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
            edge="start"
            sx={{ color: colorTextoMenu, mr: 1 }}
          >
            <MenuRounded />
          </IconButton>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0, flex: 1 }}
          >
            <LogoSistema configuracion={configuracion} compacto />

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={850} noWrap>
                {configuracion.sistemaNombre}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: alpha(colorTextoMenu, 0.72),
                  lineHeight: 1.1,
                }}
              >
                {tituloRetiro}
              </Typography>
            </Box>
          </Stack>

          {autenticado && (
            <Tooltip title={nombre || ''}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  ml: 1,
                  bgcolor: colorSecundario,
                  color: configuracion.temaColorPrimarioOscuro,
                  fontSize: 15,
                  fontWeight: 850,
                }}
              >
                {inicial}
              </Avatar>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            maxWidth: '86vw',
            bgcolor: colorMenu,
            color: colorTextoMenu,
          },
        }}
      >
        <IconButton
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          sx={{
            position: 'absolute',
            zIndex: 2,
            top: 'calc(8px + env(safe-area-inset-top))',
            right: 8,
            color: colorTextoMenu,
          }}
        >
          <CloseRounded />
        </IconButton>

        {contenidoMenu}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: colorMenu,
            color: colorTextoMenu,
            borderRight: 'none',
          },
        }}
      >
        {contenidoMenu}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          width: {
            xs: '100%',
            md: `calc(100% - ${drawerWidth}px)`,
          },
          pt: {
            xs: 'calc(74px + env(safe-area-inset-top))',
            md: 4,
          },
          px: { xs: 2, sm: 3, md: 4 },
          pb: {
            xs: 'calc(24px + env(safe-area-inset-bottom))',
            md: 4,
          },
        }}
      >
        <Box
          sx={{
            minHeight: {
              xs: 'calc(100dvh - 140px)',
              md: 'calc(100dvh - 110px)',
            },
          }}
        >
          <Outlet />
        </Box>

        <Box
          component="footer"
          sx={{
            mt: 5,
            pt: 2,
            borderTop: `1px solid ${alpha(
              configuracion.temaColorTexto,
              0.1,
            )}`,
            color: 'text.secondary',
          }}
        >
          <PieAutor configuracion={configuracion} centrado />
        </Box>
      </Box>

      <LoginDialog />

      <Snackbar
        open={logoutMessageOpen}
        autoHideDuration={3500}
        onClose={() => setLogoutMessageOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setLogoutMessageOpen(false)}
        >
          Sesión cerrada correctamente.
        </Alert>
      </Snackbar>
    </Box>
  );
}
