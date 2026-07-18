import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
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
import AssignmentIndRounded from '@mui/icons-material/AssignmentIndRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import HotelRounded from '@mui/icons-material/HotelRounded';
import ConstructionRounded from '@mui/icons-material/ConstructionRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import LoginRounded from '@mui/icons-material/LoginRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';

import {
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';

import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { useApi } from '../hooks/useApi';

const drawerWidth = 260;

const dashboardItem = {
  label: 'Dashboard',
  path: '/dashboard',
  icon: <DashboardRounded />,
};

const menuGroups = [
  {
    id: 'personas',
    label: 'Personas',
    icon: <GroupsRounded />,
    items: [
      {
        label: 'Aspirantes',
        path: '/aspirantes',
        icon: <AssignmentIndRounded />,
      },
      {
        label: 'Caminantes',
        path: '/caminantes',
        icon: <GroupsRounded />,
      },
      {
        label: 'Servidores',
        path: '/servidores',
        icon: <PersonRounded />,
      },
      {
        label: 'Equipos',
        path: '/equipos',
        icon: <GroupsRounded />,
      },
    ],
  },
  {
    id: 'logistica',
    label: 'Logística',
    icon: <ConstructionRounded />,
    items: [
      {
        label: 'Habitaciones',
        path: '/habitaciones',
        icon: <HotelRounded />,
      },
      {
        label: 'Mesas',
        path: '/mesas',
        icon: <TableRestaurantRounded />,
      },
      {
        label: 'Presentaciones',
        path: '/presentaciones',
        icon: <SlideshowRounded />,
      },
    ],
  },
  {
    id: 'operacion',
    label: 'Operación del retiro',
    icon: <AccessTimeRounded />,
    items: [
      {
        label: 'Minutograma',
        path: '/minutograma',
        icon: <AccessTimeRounded />,
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: <SettingsRounded />,
    items: [
      {
        label: 'Configuración',
        path: '/configuracion',
        icon: <SettingsRounded />,
      },
    ],
  },
];

function rutaActiva(pathname, path) {
  return (
    pathname === path ||
    pathname.startsWith(`${path}/`)
  );
}

function obtenerGrupoActivo(pathname) {
  return menuGroups.find((grupo) =>
    grupo.items.some((item) =>
      rutaActiva(pathname, item.path)
    )
  )?.id;
}

function MenuLateral({
  location,
  navegar,
  autenticado,
  nombre,
  rol,
  inicial,
  handleLogin,
  handleLogout,
  tituloRetiro,
  cerrarMenuMovil,
  mostrarCerrar = false,
}) {
  const grupoActivo = useMemo(
    () => obtenerGrupoActivo(location.pathname),
    [location.pathname]
  );

  const [grupoAbierto, setGrupoAbierto] =
    useState(grupoActivo || null);

  useEffect(() => {
    if (grupoActivo) {
      setGrupoAbierto(grupoActivo);
    }
  }, [grupoActivo]);

  function alternarGrupo(id) {
    setGrupoAbierto((actual) =>
      actual === id ? null : id
    );
  }

  return (
    <>
      <Toolbar
        sx={{
          position: 'relative',
          alignItems: 'flex-start',
          flexDirection: 'column',
          py: 2,
          pt: {
            xs:
              'calc(16px + env(safe-area-inset-top))',
            md: 2,
          },
        }}
      >
        {mostrarCerrar && (
          <IconButton
            aria-label="Cerrar menú"
            onClick={cerrarMenuMovil}
            sx={{
              position: 'absolute',
              top:
                'calc(8px + env(safe-area-inset-top))',
              right: 8,
              color: '#fff',
            }}
          >
            <CloseRounded />
          </IconButton>
        )}

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
            pr: mostrarCerrar ? 4 : 0,
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
        component="nav"
        aria-label="Menú principal"
        sx={{
          px: 1.25,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <ListItemButton
          selected={rutaActiva(
            location.pathname,
            dashboardItem.path
          )}
          onClick={() =>
            navegar(dashboardItem.path)
          }
          sx={{
            borderRadius: 2.5,
            mb: 1.25,
            minHeight: 48,
            '&.Mui-selected': {
              bgcolor:
                'rgba(255,255,255,.16)',
            },
            '&.Mui-selected:hover': {
              bgcolor:
                'rgba(255,255,255,.20)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: 'inherit',
              minWidth: 42,
            }}
          >
            {dashboardItem.icon}
          </ListItemIcon>

          <ListItemText
            primary={dashboardItem.label}
            primaryTypographyProps={{
              fontWeight: rutaActiva(
                location.pathname,
                dashboardItem.path
              )
                ? 850
                : 600,
            }}
          />
        </ListItemButton>

        {menuGroups.map((grupo) => {
          const abierto = grupoAbierto === grupo.id;

          const contieneRutaActiva =
            grupo.items.some((item) =>
              rutaActiva(
                location.pathname,
                item.path
              )
            );

          return (
            <Box
              key={grupo.id}
              sx={{ mb: 0.75 }}
            >
              <ListItemButton
                onClick={() =>
                  alternarGrupo(grupo.id)
                }
                aria-expanded={abierto}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  color: contieneRutaActiva
                    ? '#fff'
                    : 'rgba(255,255,255,.88)',
                  bgcolor: contieneRutaActiva
                    ? 'rgba(159,208,195,.10)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor:
                      'rgba(255,255,255,.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: contieneRutaActiva
                      ? '#9fd0c3'
                      : 'inherit',
                    minWidth: 42,
                  }}
                >
                  {grupo.icon}
                </ListItemIcon>

                <ListItemText
                  primary={grupo.label}
                  primaryTypographyProps={{
                    fontWeight: 800,
                    fontSize: 14.5,
                  }}
                />

                {abierto ? (
                  <ExpandLessRounded
                    fontSize="small"
                  />
                ) : (
                  <ExpandMoreRounded
                    fontSize="small"
                  />
                )}
              </ListItemButton>

              <Collapse
                in={abierto}
                timeout="auto"
                unmountOnExit
              >
                <List
                  component="div"
                  disablePadding
                  sx={{
                    mt: 0.25,
                    ml: 1,
                    pl: 0.5,
                  }}
                >
                  {grupo.items.map((item) => {
                    const seleccionado =
                      rutaActiva(
                        location.pathname,
                        item.path
                      );

                    return (
                      <ListItemButton
                        key={item.path}
                        selected={seleccionado}
                        onClick={() =>
                          navegar(item.path)
                        }
                        sx={{
                          minHeight: 42,
                          borderRadius: 2,
                          mb: 0.25,
                          pl: 1,
                          '&.Mui-selected': {
                            bgcolor:
                              'rgba(255,255,255,.14)',
                          },
                          '&.Mui-selected:hover': {
                            bgcolor:
                              'rgba(255,255,255,.18)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: seleccionado
                              ? '#9fd0c3'
                              : 'rgba(255,255,255,.82)',
                            minWidth: 36,
                            '& .MuiSvgIcon-root': {
                              fontSize: 20,
                            },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>

                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: 14.5,
                            fontWeight: seleccionado
                              ? 850
                              : 500,
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
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
                  bgcolor: '#9fd0c3',
                  color: '#173b34',
                }}
              >
                {inicial}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  fontWeight={800}
                  noWrap
                >
                  {nombre}
                </Typography>

                <Chip
                  size="small"
                  label={rol || 'Sin rol'}
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
              startIcon={<LogoutRounded />}
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
              startIcon={<LoginRounded />}
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
    </>
  );
}

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

  const inicial = String(nombre || 'I')
    .trim()
    .charAt(0)
    .toUpperCase();

  const menuProps = {
    location,
    navegar,
    autenticado,
    nombre,
    rol,
    inicial,
    handleLogin,
    handleLogout,
    tituloRetiro,
    cerrarMenuMovil,
  };

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
        <MenuLateral
          {...menuProps}
          mostrarCerrar
        />
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
        <MenuLateral {...menuProps} />
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
            xs: 1.5,
            sm: 2,
            md: 4,
          },
          pb: {
            xs:
              'calc(24px + env(safe-area-inset-bottom))',
            md: 4,
          },
        }}
      >
        {configuracionApi.error && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
          >
            No fue posible cargar la configuración del retiro.
          </Alert>
        )}

        <Outlet />
      </Box>

      <LoginDialog />

      <Snackbar
        open={logoutMessageOpen}
        autoHideDuration={3500}
        onClose={() =>
          setLogoutMessageOpen(false)
        }
        message="Sesión cerrada correctamente"
      />
    </Box>
  );
}
