import {
  Alert,
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
  Typography,
} from '@mui/material';

import DashboardRounded from '@mui/icons-material/DashboardRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import HotelRounded from '@mui/icons-material/HotelRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import LoginRounded from '@mui/icons-material/LoginRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';

import {
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';

import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { useApi } from '../hooks/useApi';

const drawerWidth = 260;

const items = [
  [
    'Dashboard',
    '/dashboard',
    <DashboardRounded />,
  ],
  [
    'Equipos',
    '/equipos',
    <GroupsRounded />,
  ],
  [
    'Servidores',
    '/servidores',
    <PersonRounded />,
  ],
  [
    'Caminantes',
    '/caminantes',
    <GroupsRounded />,
  ],
  [
    'Mesas',
    '/mesas',
    <TableRestaurantRounded />,
  ],
  [
    'Presentaciones',
    '/presentaciones',
    <SlideshowRounded />,
  ],
  [
    'Habitaciones',
    '/habitaciones',
    <HotelRounded />,
  ],
  [
    'Minutograma',
    '/minutograma',
    <AccessTimeRounded />,
  ],
  [
    'Configuración',
    '/configuracion',
    <SettingsRounded />,
  ],
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    autenticado,
    nombre,
    rol,
    logout,
    solicitarAutenticacion,
  } = useAuth();

  const configuracionApi = useApi(
    () => obtenerConfiguraciones(),
    []
  );

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [logoutMessageOpen, setLogoutMessageOpen] =
    useState(false);

  const configuracion =
    configuracionApi.data || {};

  const tituloRetiro = [
    configuracion.tipoRetiro
      ? `Retiro ${configuracion.tipoRetiro}`
      : 'Retiro',
    configuracion.anioRetiro,
  ]
    .filter(Boolean)
    .join(' - ');

  function abrirMenuMovil() {
    setMobileOpen(true);
  }

  function cerrarMenuMovil() {
    setMobileOpen(false);
  }

  function navegar(path) {
    navigate(path);
    cerrarMenuMovil();
  }

  async function handleLogout() {
    cerrarMenuMovil();
    await logout();
    setLogoutMessageOpen(true);
  }

  function handleLogin() {
    cerrarMenuMovil();
    solicitarAutenticacion();
  }

  const inicial =
    String(nombre || 'I')
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: {
            xs: 'block',
            md: 'none',
          },
          bgcolor: '#173b34',
          color: '#fff',
          pt: 'env(safe-area-inset-top)',
          zIndex: (theme) =>
            theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 58,
            px: 1.25,
          }}
        >
          <IconButton
            aria-label="Abrir menú"
            onClick={abrirMenuMovil}
            edge="start"
            sx={{
              color: '#fff',
              mr: 1,
            }}
          >
            <MenuRounded />
          </IconButton>

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={850}
              noWrap
            >
              {[
                'EMAÚS',
                configuracion.tipoRetiro,
                configuracion.anioRetiro,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color:
                  'rgba(255,255,255,.72)',
                lineHeight: 1.1,
              }}
            >
              Centro de Control
            </Typography>
          </Box>

          {autenticado && (
            <Avatar
              sx={{
                width: 34,
                height: 34,
                ml: 1,
                bgcolor: '#9fd0c3',
                color: '#173b34',
                fontSize: 15,
                fontWeight: 850,
              }}
            >
              {inicial}
            </Avatar>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={cerrarMenuMovil}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: 'block',
            md: 'none',
          },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            maxWidth: '86vw',
            bgcolor: '#173b34',
            color: '#fff',
          },
        }}
      >

        <Toolbar
          sx={{
            position: 'relative',
            alignItems:
              'flex-start',
            flexDirection:
              'column',
            py: 2,
            pt: {
              xs:
                'calc(16px + env(safe-area-inset-top))',
              md: 2,
            },
          }}
        >
          <IconButton
            aria-label="Cerrar menú"
            onClick={cerrarMenuMovil}
            sx={{
              display: {
                xs: 'inline-flex',
                md: 'none',
              },
              position: 'absolute',
              top:
                'calc(8px + env(safe-area-inset-top))',
              right: 8,
              color: '#fff',
            }}
          >
            <CloseRounded />
          </IconButton>
          <Typography
            variant="overline"
            sx={{
              color: '#9fd0c3',
              letterSpacing: 1.15,
            }}
          >
            EMAÚS
          </Typography>

          <Typography
            variant="h6"
            fontWeight={850}
            sx={{
              lineHeight: 1.2,
            }}
          >
            {tituloRetiro}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: 'rgba(255,255,255,.72)',
            }}
          >
            Centro de Control
          </Typography>
        </Toolbar>

        <List
          sx={{
            px: 1.5,
            flex: 1,
          }}
        >
          {items.map(
            ([
              label,
              path,
              icon,
            ]) => (
              <ListItemButton
                key={path}
                selected={
                  location.pathname ===
                  path
                }
                onClick={() =>
                  navegar(path)
                }
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor:
                      'rgba(255,255,255,.13)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 42,
                  }}
                >
                  {icon}
                </ListItemIcon>

                <ListItemText
                  primary={label}
                />
              </ListItemButton>
            )
          )}
        </List>

        <Box
          sx={{
            p: 2,
            pb: {
              xs:
                'calc(16px + env(safe-area-inset-bottom))',
              md: 2,
            },
          }}
        >
          <Divider
            sx={{
              mb: 2,
              borderColor:
                'rgba(255,255,255,.15)',
            }}
          />

          {autenticado ? (
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    bgcolor:
                      '#9fd0c3',
                    color:
                      '#173b34',
                  }}
                >
                  {inicial}
                </Avatar>

                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Typography
                    fontWeight={800}
                    noWrap
                  >
                    {nombre}
                  </Typography>

                  <Chip
                    size="small"
                    label={
                      rol ||
                      'Sin rol'
                    }
                    sx={{
                      mt: 0.5,
                      bgcolor:
                        'rgba(255,255,255,.12)',
                      color: '#fff',
                    }}
                  />
                </Box>
              </Stack>

              <Button
                color="inherit"
                variant="outlined"
                startIcon={
                  <LogoutRounded />
                }
                onClick={handleLogout}
                fullWidth
                sx={{
                  borderColor:
                    'rgba(255,255,255,.35)',
                }}
              >
                Cerrar sesión
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Typography
                variant="body2"
                sx={{
                  color:
                    'rgba(255,255,255,.72)',
                }}
              >
                Modo consulta
              </Typography>

              <Button
                color="inherit"
                variant="outlined"
                startIcon={
                  <LoginRounded />
                }
                onClick={handleLogin}
                fullWidth
                sx={{
                  borderColor:
                    'rgba(255,255,255,.35)',
                }}
              >
                Iniciar sesión
              </Button>
            </Stack>
          )}
        </Box>

      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: {
            xs: 'none',
            md: 'block',
          },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#173b34',
            color: '#fff',
          },
        }}
      >

        <Toolbar
          sx={{
            position: 'relative',
            alignItems:
              'flex-start',
            flexDirection:
              'column',
            py: 2,
            pt: {
              xs:
                'calc(16px + env(safe-area-inset-top))',
              md: 2,
            },
          }}
        >
          <IconButton
            aria-label="Cerrar menú"
            onClick={cerrarMenuMovil}
            sx={{
              display: {
                xs: 'inline-flex',
                md: 'none',
              },
              position: 'absolute',
              top:
                'calc(8px + env(safe-area-inset-top))',
              right: 8,
              color: '#fff',
            }}
          >
            <CloseRounded />
          </IconButton>
          <Typography
            variant="overline"
            sx={{
              color: '#9fd0c3',
              letterSpacing: 1.15,
            }}
          >
            EMAÚS
          </Typography>

          <Typography
            variant="h6"
            fontWeight={850}
            sx={{
              lineHeight: 1.2,
            }}
          >
            {tituloRetiro}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: 'rgba(255,255,255,.72)',
            }}
          >
            Centro de Control
          </Typography>
        </Toolbar>

        <List
          sx={{
            px: 1.5,
            flex: 1,
          }}
        >
          {items.map(
            ([
              label,
              path,
              icon,
            ]) => (
              <ListItemButton
                key={path}
                selected={
                  location.pathname ===
                  path
                }
                onClick={() =>
                  navegar(path)
                }
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor:
                      'rgba(255,255,255,.13)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 42,
                  }}
                >
                  {icon}
                </ListItemIcon>

                <ListItemText
                  primary={label}
                />
              </ListItemButton>
            )
          )}
        </List>

        <Box
          sx={{
            p: 2,
            pb: {
              xs:
                'calc(16px + env(safe-area-inset-bottom))',
              md: 2,
            },
          }}
        >
          <Divider
            sx={{
              mb: 2,
              borderColor:
                'rgba(255,255,255,.15)',
            }}
          />

          {autenticado ? (
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    bgcolor:
                      '#9fd0c3',
                    color:
                      '#173b34',
                  }}
                >
                  {inicial}
                </Avatar>

                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Typography
                    fontWeight={800}
                    noWrap
                  >
                    {nombre}
                  </Typography>

                  <Chip
                    size="small"
                    label={
                      rol ||
                      'Sin rol'
                    }
                    sx={{
                      mt: 0.5,
                      bgcolor:
                        'rgba(255,255,255,.12)',
                      color: '#fff',
                    }}
                  />
                </Box>
              </Stack>

              <Button
                color="inherit"
                variant="outlined"
                startIcon={
                  <LogoutRounded />
                }
                onClick={handleLogout}
                fullWidth
                sx={{
                  borderColor:
                    'rgba(255,255,255,.35)',
                }}
              >
                Cerrar sesión
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Typography
                variant="body2"
                sx={{
                  color:
                    'rgba(255,255,255,.72)',
                }}
              >
                Modo consulta
              </Typography>

              <Button
                color="inherit"
                variant="outlined"
                startIcon={
                  <LoginRounded />
                }
                onClick={handleLogin}
                fullWidth
                sx={{
                  borderColor:
                    'rgba(255,255,255,.35)',
                }}
              >
                Iniciar sesión
              </Button>
            </Stack>
          )}
        </Box>

      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          width: {
            xs: '100%',
            md:
              `calc(100% - ${drawerWidth}px)`,
          },
          pt: {
            xs:
              'calc(74px + env(safe-area-inset-top))',
            md: 4,
          },
          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          pb: {
            xs:
              'calc(24px + env(safe-area-inset-bottom))',
            md: 4,
          },
        }}
      >
        <Outlet />
      </Box>

      <LoginDialog />

      <Snackbar
        open={logoutMessageOpen}
        autoHideDuration={3500}
        onClose={() =>
          setLogoutMessageOpen(false)
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setLogoutMessageOpen(false)
          }
        >
          Sesión cerrada correctamente.
        </Alert>
      </Snackbar>
    </Box>
  );
}
