import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';

import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from './AuthContext';

export default function PrivateRoute({
  children,
  permitirCambioPassword = false,
  permiso = '',
}) {
  const {
    autenticado,
    loading,
    debeCambiarPassword,
    tienePermiso,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (
    debeCambiarPassword &&
    !permitirCambioPassword
  ) {
    return (
      <Navigate
        to="/cambiar-password-inicial"
        replace
      />
    );
  }

  if (
    !debeCambiarPassword &&
    permitirCambioPassword
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  if (permiso && !tienePermiso(permiso)) {
    return (
      <Box
        sx={{
          minHeight: '55vh',
          display: 'grid',
          placeItems: 'center',
          px: 2,
        }}
      >
        <Stack
          spacing={2}
          sx={{ width: '100%', maxWidth: 560 }}
        >
          <Alert severity="warning">
            No tienes permiso para ingresar a esta pantalla.
          </Alert>

          <Button
            variant="contained"
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Volver al Dashboard
          </Button>
        </Stack>
      </Box>
    );
  }

  return children;
}
