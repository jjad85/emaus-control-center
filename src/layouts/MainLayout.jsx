import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
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

const width = 260;

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

  async function handleLogout() {
    await logout();
    setLogoutMessageOpen(true);
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
        minHeight: '100vh',
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width,
          display: {
            xs: 'none',
            md: 'block',
          },
          '& .MuiDrawer-paper': {
            width,
            bgcolor: '#173b34',
            color: '#fff',
          },
        }}
      >
        <Toolbar
          sx={{
            alignItems:
              'flex-start',
            flexDirection:
              'column',
            py: 2,
          }}
        >
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
                  navigate(path)
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

        <Box sx={{ p: 2 }}>
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
                onClick={() =>
                  solicitarAutenticacion()
                }
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
          p: {
            xs: 2,
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
