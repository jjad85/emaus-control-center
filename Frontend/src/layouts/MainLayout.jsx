import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
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
  Menu,
  MenuItem,
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
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import LoginRounded from '@mui/icons-material/LoginRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import CheckroomRounded from '@mui/icons-material/CheckroomRounded';
import FactCheckRounded from '@mui/icons-material/FactCheckRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import TopicRounded from '@mui/icons-material/TopicRounded';
import EventNoteRounded from '@mui/icons-material/EventNoteRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';

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

import { useMediaQuery, useTheme } from '@mui/material';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';
import NotificationBell from '../components/NotificationBell';
import FooterSistema from '../components/FooterSistema';

import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { obtenerMiFotoPerfilServidor } from '../api/fotoPerfilServidorApi';
import { obtenerResumenMenu } from '../api/menuResumenApi';
import { useApi } from '../hooks/useApi';

import AvatarServidor from '../components/servidores/AvatarServidor';

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
        conteoKey: 'aspirantes',
        icon: <AssignmentIndRounded />,
        permiso: 'ASPIRANTES_VER_DETALLE',
      },
      {
        label: 'Caminantes',
        path: '/caminantes',
        conteoKey: 'caminantes',
        icon: <GroupsRounded />,
        permiso: 'CAMINANTES_VER_DETALLE',
      },
      {
        label: 'Servidores',
        path: '/servidores',
        conteoKey: 'servidores',
        icon: <PersonRounded />,
        permiso: 'SERVIDORES_VER_DETALLE',
      },
    ],
  },
  {
    id: 'servicio-retiro',
    label: 'Servicio al retiro',
    icon: <VolunteerActivismRounded />,
    items: [
      {
        label: 'Angelitos',
        path: '/servicio/angelitos',
        conteoKey: 'angelitos',
        icon: <VolunteerActivismRounded />,
        permiso: 'SERVICIO_ANGELITOS_VER',
      },
      {
        label: 'Serenata',
        path: '/servicio/serenata',
        conteoKey: 'serenata',
        icon: <MusicNoteRounded />,
        permiso: 'SERVICIO_SERENATA_VER',
      },
    ],
  },
  {
    id: 'logistica',
    label: 'Logística',
    icon: <ConstructionRounded />,
    items: [
      {
        label: 'Centro Logístico',
        path: '/centro-logistico',
        icon: <Inventory2Rounded />,
        permiso: 'CENTRO_LOGISTICO_VER',
      },
      {
        label: 'Equipos',
        path: '/equipos',
        icon: <GroupsRounded />,
        permiso: 'EQUIPOS_VER_DETALLE',
      },
      {
        label: 'Habitaciones',
        path: '/habitaciones',
        conteoKey: 'habitaciones',
        icon: <HotelRounded />,
        permiso: 'HABITACIONES_VER_DETALLE',
      },
      {
        label: 'Mesas',
        path: '/mesas',
        conteoKey: 'mesas',
        icon: <TableRestaurantRounded />,
        permiso: 'MESAS_VER_DETALLE',
      },
      {
        label: 'Presentaciones',
        path: '/presentaciones',
        icon: <SlideshowRounded />,
        permiso: 'PRESENTACIONES_TODO',
      },
      {
        label: 'Documentos',
        path: '/documentos',
        conteoKey: 'documentos',
        icon: <FolderRounded />,
        permiso: 'DOCUMENTOS_CONSULTAR',
      },
    ],
  },
  {
    id: 'tesoreria',
    label: 'Tesorería',
    icon: <PaymentsRounded />,
    items: [
      { label: 'Estados de cuenta', path: '/pagos', icon: <PaymentsRounded />, permiso: 'PAGOS_VER_ESTADOS_CUENTA' },
      { label: 'Reportar pagos', path: '/tesoreria/reportar-pago', icon: <FactCheckRounded />, permiso: 'REPORTAR_PAGO_REGISTRAR' },
      { label: 'Gastos', path: '/tesoreria/gastos', icon: <ReceiptLongRounded />, permiso: 'GASTOS_VER' },
    ],
  },
  {
    id: 'operacion',
    label: 'Operación del retiro',
    icon: <AccessTimeRounded />,
    items: [
      {
        label: 'Temas',
        path: '/temas',
        icon: <TopicRounded />,
        permiso: 'TEMAS_VER_DETALLE',
      },
      {
        label: 'Paso a paso',
        path: '/paso-a-paso',
        icon: <AccessTimeRounded />,
        permiso: 'PASO_A_PASO_VER_DETALLE',
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: <SettingsRounded />,
    items: [
      {
        label: 'Usuarios',
        path: '/sistema/usuarios',
        icon: <PeopleRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Roles y permisos',
        path: '/sistema/roles-permisos',
        icon: <SecurityRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Seguridad',
        path: '/sistema/seguridad',
        icon: <LockRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Alertas y notificaciones',
        path: '/sistema/alertas',
        icon: <NotificationsActiveRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Configuración',
        path: '/configuracion',
        icon: <SettingsRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Fechas importantes',
        path: '/fechas-importantes',
        icon: <EventNoteRounded />,
        permiso: 'FECHAS_IMPORTANTES_GESTIONAR',
      },
      {
        label: 'Estado de la aplicación',
        path: '/sistema/estado-aplicacion',
        icon: <MonitorHeartRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Datos para hotel',
        path: '/sistema/datos-hotel',
        icon: <HotelRounded />,
        permiso: 'SISTEMA_TODO',
      },
      {
        label: 'Auditoría',
        path: '/auditoria',
        icon: <FactCheckRounded />,
        permiso: 'SISTEMA_TODO',
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

function esRolAdministrador(rol) {
  const normalizado =
    String(rol || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );

  return (
    normalizado === 'administrador' ||
    normalizado === 'administradores'
  );
}

function obtenerGruposVisibles(rol, tienePermiso) {
  const rolNormalizado = String(rol || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esServidor = rolNormalizado === 'servidor' || rolNormalizado === 'servidores';
  return menuGroups
    .map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => {
        const cumpleRol =
          !item.soloServidor ||
          esServidor ||
          esRolAdministrador(rol);

        const cumplePermiso =
          !item.permiso ||
          Boolean(tienePermiso?.(item.permiso));

        return cumpleRol && cumplePermiso;
      }),
    }))
    .filter((grupo) => grupo.items.length > 0);
}

function obtenerGrupoActivo(pathname, rol, tienePermiso) {
  return obtenerGruposVisibles(rol, tienePermiso)
    .find((grupo) =>
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
  fotoPerfilUrl,
  inicial,
  handleLogin,
  handleLogout,
  tituloRetiro,
  cerrarMenuMovil,
  mostrarCerrar = false,
  tienePermiso,
  conteosMenu = {},
}) {
  const gruposVisibles =
    useMemo(
      () => obtenerGruposVisibles(rol, tienePermiso),
      [rol, tienePermiso]
    );

  const grupoActivo = useMemo(
    () =>
      obtenerGrupoActivo(
        location.pathname,
        rol,
        tienePermiso
      ),
    [
      location.pathname,
      rol,
      tienePermiso,
    ]
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

        {gruposVisibles.map((grupo) => {
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
                    mt: 0.5,
                    ml: 2.25,
                    pl: 1.25,
                    pr: 0.5,
                    py: 0.5,
                    borderLeft:
                      '2px solid rgba(159,208,195,.28)',
                    borderRadius: 1.5,
                    bgcolor:
                      'rgba(255,255,255,.025)',
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
                          minHeight: 40,
                          borderRadius: 1.75,
                          mb: 0.35,
                          pl: 1.25,
                          pr: 1,
                          color: seleccionado
                            ? '#fff'
                            : 'rgba(255,255,255,.76)',
                          transition:
                            'background-color .18s ease, transform .18s ease, color .18s ease',
                          '&:hover': {
                            bgcolor:
                              'rgba(255,255,255,.08)',
                            color: '#fff',
                            transform:
                              'translateX(2px)',
                          },
                          '&.Mui-selected': {
                            bgcolor:
                              'rgba(159,208,195,.18)',
                            boxShadow:
                              'inset 3px 0 0 #9fd0c3',
                          },
                          '&.Mui-selected:hover': {
                            bgcolor:
                              'rgba(159,208,195,.24)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: seleccionado
                              ? '#9fd0c3'
                              : 'rgba(255,255,255,.66)',
                            minWidth: 34,
                            '& .MuiSvgIcon-root': {
                              fontSize: 18,
                            },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>

                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                              sx={{ width: '100%' }}
                            >
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: 13.75,
                                  letterSpacing: 0.1,
                                  fontWeight: seleccionado ? 800 : 500,
                                }}
                              >
                                {item.label}
                              </Typography>

                              {item.conteoKey &&
                                Number.isFinite(
                                  Number(conteosMenu?.[item.conteoKey])
                                ) && (
                                  <Box
                                    component="span"
                                    sx={{
                                      minWidth: 27,
                                      height: 22,
                                      px: .7,
                                      borderRadius: 999,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      bgcolor: seleccionado
                                        ? 'rgba(159,208,195,.24)'
                                        : 'rgba(255,255,255,.10)',
                                      border: '1px solid',
                                      borderColor: seleccionado
                                        ? 'rgba(159,208,195,.48)'
                                        : 'rgba(255,255,255,.12)',
                                      color: seleccionado
                                        ? '#d9f5ed'
                                        : 'rgba(255,255,255,.84)',
                                      fontSize: 11.5,
                                      fontWeight: 850,
                                      lineHeight: 1,
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {Number(conteosMenu[item.conteoKey])}
                                  </Box>
                                )}
                            </Stack>
                          }
                          primaryTypographyProps={{
                            component: 'div',
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

      {!autenticado && (
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
        </Box>
      )}
    </>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const esEscritorio = useMediaQuery(
    theme.breakpoints.up('md')
  );

  const {
    token,
    autenticado,
    nombre,
    rol,
    fotoPerfilUrl,
    logout,
    solicitarAutenticacion,
    tienePermiso,
  } = useAuth();

  const [fotoPerfilMenu, setFotoPerfilMenu] =
    useState(fotoPerfilUrl || '');

  const [conteosMenu, setConteosMenu] =
    useState({});

  useEffect(() => {
    let activo = true;

    async function cargarFotoPerfilMenu() {
      if (!autenticado || !token) {
        setFotoPerfilMenu('');
        return;
      }

      try {
        const datos =
          await obtenerMiFotoPerfilServidor(token);

        if (activo) {
          setFotoPerfilMenu(
            datos?.fotoPerfilUrl || ''
          );
        }
      } catch {
        // Si no se puede consultar la foto, se conservan
        // las iniciales sin afectar el resto del menú.
      }
    }

    cargarFotoPerfilMenu();

    function actualizarFoto(event) {
      setFotoPerfilMenu(
        event?.detail?.fotoPerfilUrl || ''
      );
    }

    window.addEventListener(
      'foto-perfil-servidor-actualizada',
      actualizarFoto
    );

    return () => {
      activo = false;
      window.removeEventListener(
        'foto-perfil-servidor-actualizada',
        actualizarFoto
      );
    };
  }, [autenticado, token]);

  useEffect(() => {
    let activo = true;

    async function cargarConteosMenu() {
      if (!autenticado || !token) {
        if (activo) {
          setConteosMenu({});
        }
        return;
      }

      try {
        const datos = await obtenerResumenMenu(token);

        if (activo) {
          setConteosMenu(datos || {});
        }
      } catch {
        // Los conteos son informativos; si fallan, el menú
        // continúa funcionando normalmente sin badges.
        if (activo) {
          setConteosMenu({});
        }
      }
    }

    cargarConteosMenu();

    return () => {
      activo = false;
    };
  }, [autenticado, token, location.pathname]);

  const configuracionApi = useApi(
    () => obtenerConfiguraciones(),
    []
  );

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [logoutMessageOpen, setLogoutMessageOpen] =
    useState(false);

  const [menuUsuarioAnchor, setMenuUsuarioAnchor] =
    useState(null);

  const menuUsuarioAbierto =
    Boolean(menuUsuarioAnchor);

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

  function abrirMenuUsuario(event) {
    setMenuUsuarioAnchor(event.currentTarget);
  }

  function cerrarMenuUsuario() {
    setMenuUsuarioAnchor(null);
  }

  function navegarDesdeMenuUsuario(path) {
    cerrarMenuUsuario();
    navigate(path);
  }

  async function cerrarSesionDesdeMenuUsuario() {
    cerrarMenuUsuario();
    await handleLogout();
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
    fotoPerfilUrl,
    inicial,
    handleLogin,
    handleLogout,
    tituloRetiro,
    cerrarMenuMovil,
    tienePermiso,
    conteosMenu,
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

          {!esEscritorio && (
            <Box sx={{ mr: 0.5 }}>
              <NotificationBell modo="mobile" />
            </Box>
          )}

          {autenticado && (
            <IconButton
              aria-label="Abrir menú de usuario"
              aria-controls={
                menuUsuarioAbierto
                  ? 'menu-usuario'
                  : undefined
              }
              aria-haspopup="true"
              aria-expanded={
                menuUsuarioAbierto
                  ? 'true'
                  : undefined
              }
              onClick={abrirMenuUsuario}
              sx={{ ml: 0.5, p: 0.25 }}
            >
              <AvatarServidor
                nombre={nombre}
                fotoPerfilUrl={fotoPerfilMenu || fotoPerfilUrl || ''}
                size={36}
                mostrarTooltip={false}
                sx={{
                  bgcolor: '#9fd0c3',
                  color: '#173b34',
                }}
              />
            </IconButton>
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
          display: 'flex',
          flexDirection: 'column',
          width: {
            xs: '100%',
            md:
              `calc(100% - ${drawerWidth}px)`,
          },
          pt: {
            xs:
              'calc(74px + env(safe-area-inset-top))',
            md: 0,
          },
          px: {
            xs: 1.5,
            sm: 2,
            md: 0,
          },
          pb: {
            xs:
              'calc(24px + env(safe-area-inset-bottom))',
            md: 4,
          },
        }}
      >
        {esEscritorio && (
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: (theme) => theme.zIndex.appBar - 1,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              minHeight: 72,
              px: 4,
              bgcolor: 'background.default',
              borderBottom: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <NotificationBell modo="desktop" />

              {autenticado && (
                <IconButton
                  aria-label="Abrir menú de usuario"
                  aria-controls={
                    menuUsuarioAbierto
                      ? 'menu-usuario'
                      : undefined
                  }
                  aria-haspopup="true"
                  aria-expanded={
                    menuUsuarioAbierto
                      ? 'true'
                      : undefined
                  }
                  onClick={abrirMenuUsuario}
                  sx={{ p: 0.25 }}
                >
                  <AvatarServidor
                    nombre={nombre}
                    fotoPerfilUrl={fotoPerfilMenu || fotoPerfilUrl || ''}
                    size={42}
                    mostrarTooltip={false}
                  />
                </IconButton>
              )}
            </Stack>
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            width: '100%',
            px: { xs: 0, md: 4 },
            pb: { xs: 0, md: 4 },
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

        <FooterSistema
          autor={configuracion.sistemaAutor}
          version={configuracion.sistemaVersion}
          contacto={configuracion.sistemaContactoAutor}
          anio={configuracion.anioRetiro}
        />
      </Box>

      <Menu
        id="menu-usuario"
        anchorEl={menuUsuarioAnchor}
        open={menuUsuarioAbierto}
        onClose={cerrarMenuUsuario}
        onClick={cerrarMenuUsuario}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        slotProps={{
          paper: {
            elevation: 6,
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 2.5,
              overflow: 'visible',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <AvatarServidor
            nombre={nombre}
            fotoPerfilUrl={fotoPerfilMenu || fotoPerfilUrl || ''}
            size={46}
            mostrarTooltip={false}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={850} noWrap>
              {nombre || 'Servidor'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
            >
              {rol || 'Sin rol'}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <MenuItem
          onClick={() =>
            navegarDesdeMenuUsuario('/mi-cuenta')
          }
          sx={{ py: 1.15 }}
        >
          <ListItemIcon>
            <AccountCircleRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Mi cuenta" />
        </MenuItem>

        <MenuItem
          onClick={() =>
            navegarDesdeMenuUsuario('/mi-cuenta/reportar-pago')
          }
          sx={{ py: 1.15 }}
        >
          <ListItemIcon>
            <PaymentsRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Reportar pago" />
        </MenuItem>

        <MenuItem
          onClick={() =>
            navegarDesdeMenuUsuario('/codigo-vestuario')
          }
          sx={{ py: 1.15 }}
        >
          <ListItemIcon>
            <CheckroomRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Código de vestuario" />
        </MenuItem>

        <MenuItem
          onClick={() =>
            navegarDesdeMenuUsuario('/mis-temas')
          }
          sx={{ py: 1.15 }}
        >
          <ListItemIcon>
            <TopicRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Mis temas" />
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={cerrarSesionDesdeMenuUsuario}
          sx={{
            py: 1.15,
            color: 'error.main',
          }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </MenuItem>
      </Menu>

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
