import {
  Box,
  CircularProgress,
} from '@mui/material';

import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from './AuthContext';

export default function PrivateRoute({
  children,
}) {
  const {
    autenticado,
    loading,
  } = useAuth();

  const location =
    useLocation();

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
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return children;
}
