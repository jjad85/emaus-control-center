import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginDialog() {
  const {
    loginOpen,
    cerrarLogin,
    login,
    mensajeSesion,
  } = useAuth();

  const [usuario, setUsuario] =
    useState('');

  const [clave, setClave] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError('');

    if (
      !usuario.trim() ||
      !clave
    ) {
      setError(
        'Ingrese usuario y contraseña.'
      );

      return;
    }

    setLoading(true);

    try {
      await login(
        usuario.trim(),
        clave
      );

      setUsuario('');
      setClave('');
    } catch (err) {
      setError(
        err.message ||
          'No fue posible iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) {
      return;
    }

    setError('');
    setClave('');
    cerrarLogin();
  }

  return (
    <Dialog
      open={loginOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle>
        Iniciar sesión
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          mt={1}
        >
          {mensajeSesion ? (
            <Alert severity="warning">
              {mensajeSesion}
            </Alert>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Inicie sesión para realizar
              acciones de registro o
              actualización.
            </Typography>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            label="Usuario"
            value={usuario}
            onChange={(event) =>
              setUsuario(
                event.target.value
              )
            }
            autoComplete="username"
            disabled={loading}
            fullWidth
          />

          <TextField
            label="Contraseña"
            type="password"
            value={clave}
            onChange={(event) =>
              setClave(
                event.target.value
              )
            }
            autoComplete="current-password"
            disabled={loading}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={
            loading
              ? (
                <CircularProgress
                  size={18}
                />
              )
              : null
          }
        >
          Iniciar sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}
