import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function CambiarPasswordInicial() {
  const navigate = useNavigate();

  const {
    completarCambioPassword,
    nombre,
  } = useAuth();

  const [passwordActual, setPasswordActual] =
    useState('');

  const [passwordNueva, setPasswordNueva] =
    useState('');

  const [confirmacion, setConfirmacion] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (
      !passwordActual ||
      !passwordNueva ||
      !confirmacion
    ) {
      setError(
        'Complete todos los campos.'
      );
      return;
    }

    if (
      passwordNueva !== confirmacion
    ) {
      setError(
        'La nueva contraseña y su confirmación no coinciden.'
      );
      return;
    }

    setLoading(true);

    try {
      await completarCambioPassword(
        passwordActual,
        passwordNueva
      );

      navigate(
        '/dashboard',
        { replace: true }
      );
    } catch (err) {
      setError(
        err.message ||
          'No fue posible actualizar la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={3}>
          <CardContent
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: { xs: 3, sm: 4 } }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="h5"
                  component="h1"
                  fontWeight={700}
                >
                  Cambia tu contraseña
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  mt={1}
                >
                  {nombre
                    ? `${nombre}, por seguridad debes crear una contraseña personal antes de continuar.`
                    : 'Por seguridad debes crear una contraseña personal antes de continuar.'}
                </Typography>
              </Box>

              <Alert severity="info">
                Este cambio se solicita únicamente en tu primer ingreso.
              </Alert>

              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <TextField
                autoFocus
                label="Contraseña actual"
                type="password"
                value={passwordActual}
                onChange={(event) =>
                  setPasswordActual(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                disabled={loading}
                fullWidth
              />

              <TextField
                label="Nueva contraseña"
                type="password"
                value={passwordNueva}
                onChange={(event) =>
                  setPasswordNueva(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                helperText="Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo."
                disabled={loading}
                fullWidth
              />

              <TextField
                label="Confirmar nueva contraseña"
                type="password"
                value={confirmacion}
                onChange={(event) =>
                  setConfirmacion(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                disabled={loading}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={
                  loading
                    ? <CircularProgress size={18} />
                    : null
                }
              >
                Guardar nueva contraseña
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
