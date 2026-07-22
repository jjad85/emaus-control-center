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
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import PasswordRecoveryDialog from './PasswordRecoveryDialog';

export default function LoginDialog() {
  const navigate = useNavigate();
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

  const [
    recoveryOpen,
    setRecoveryOpen,
  ] = useState('');

  const [
    mensajeRecuperacion,
    setMensajeRecuperacion,
  ] = useState('');

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
      const sesion = await login(
        usuario.trim(),
        clave
      );

      if (
        sesion.debeCambiarPassword
      ) {
        navigate(
          '/cambiar-password-inicial',
          { replace: true }
        );
      }

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

          {mensajeRecuperacion && (
            <Alert severity="success">
              {mensajeRecuperacion}
            </Alert>
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

          <Button
            type="button"
            variant="text"
            onClick={() => {
              setError('');
              setMensajeRecuperacion('');
              setRecoveryOpen(true);
            }}
            disabled={loading}
            sx={{
              alignSelf: 'flex-start',
              px: 0,
            }}
          >
            ¿Olvidaste tu contraseña?
          </Button>
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

      <PasswordRecoveryDialog
        open={Boolean(recoveryOpen)}
        onClose={() =>
          setRecoveryOpen(false)
        }
        onSuccess={(mensaje) =>
          setMensajeRecuperacion(
            mensaje
          )
        }
      />
    </Dialog>
  );
}
