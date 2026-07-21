import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  restablecerClaveConCodigoApi,
  solicitarRecuperacionClaveApi,
} from '../api/authApi';

function evaluarClave(clave) {
  return {
    longitud:
      clave.length >= 10,
    minuscula:
      /[a-z]/.test(clave),
    mayuscula:
      /[A-Z]/.test(clave),
    numero:
      /\d/.test(clave),
    simbolo:
      /[^A-Za-z0-9]/.test(clave),
  };
}

export default function PasswordRecoveryDialog({
  open,
  onClose,
  onSuccess,
  initialUsuario = '',
  initialCorreo = '',
}) {
  const [paso, setPaso] =
    useState(1);

  const [usuario, setUsuario] =
    useState('');

  const [correo, setCorreo] =
    useState('');

  const [codigo, setCodigo] =
    useState('');

  const [nuevaClave, setNuevaClave] =
    useState('');

  const [
    confirmarClave,
    setConfirmarClave,
  ] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  useEffect(() => {
    if (!open) return;
    setPaso(1);
    setUsuario(initialUsuario || '');
    setCorreo(initialCorreo || '');
    setCodigo('');
    setNuevaClave('');
    setConfirmarClave('');
    setError('');
    setMensaje('');
  }, [open, initialUsuario, initialCorreo]);

  const reglas = useMemo(
    () =>
      evaluarClave(
        nuevaClave
      ),
    [nuevaClave]
  );

  const porcentaje =
    Object.values(reglas)
      .filter(Boolean)
      .length * 20;

  function limpiar() {
    setPaso(1);
    setUsuario('');
    setCorreo('');
    setCodigo('');
    setNuevaClave('');
    setConfirmarClave('');
    setError('');
    setMensaje('');
  }

  function cerrar() {
    if (loading) {
      return;
    }

    limpiar();
    onClose();
  }

  async function solicitarCodigo() {
    setError('');
    setMensaje('');

    if (!usuario.trim()) {
      setError(
        'Ingrese su usuario.'
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correo.trim()
      )
    ) {
      setError(
        'Ingrese un correo electrónico válido.'
      );
      return;
    }

    setLoading(true);

    try {
      const respuesta =
        await solicitarRecuperacionClaveApi(
          usuario.trim(),
          correo.trim()
        );

      setMensaje(
        respuesta?.mensaje ||
          'Si el correo está registrado, recibirá un código.'
      );

      setPaso(2);
    } catch (err) {
      setError(
        err.message ||
          'No fue posible solicitar el código.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function restablecer() {
    setError('');
    setMensaje('');

    if (!/^\d{6}$/.test(codigo)) {
      setError(
        'El código debe tener 6 dígitos.'
      );
      return;
    }

    if (
      !Object.values(reglas)
        .every(Boolean)
    ) {
      setError(
        'La nueva contraseña no cumple todas las reglas.'
      );
      return;
    }

    if (
      nuevaClave !==
      confirmarClave
    ) {
      setError(
        'Las contraseñas no coinciden.'
      );
      return;
    }

    setLoading(true);

    try {
      await restablecerClaveConCodigoApi(
        usuario.trim(),
        correo.trim(),
        codigo,
        nuevaClave
      );

      limpiar();

      onSuccess?.(
        'Contraseña restablecida. Ya puede iniciar sesión.'
      );

      onClose();
    } catch (err) {
      setError(
        err.message ||
          'No fue posible restablecer la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        Recuperar contraseña
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          mt={1}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {mensaje && (
            <Alert severity="info">
              {mensaje}
            </Alert>
          )}

          {paso === 1 ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Ingrese el usuario y el correo
                registrados en su cuenta. El
                código solo se enviará cuando
                ambos datos correspondan.
              </Typography>

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
                label="Correo electrónico"
                type="email"
                value={correo}
                onChange={(event) =>
                  setCorreo(
                    event.target.value
                  )
                }
                autoComplete="email"
                disabled={loading}
                fullWidth
              />
            </>
          ) : (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Ingrese el código enviado al
                correo registrado para el usuario
                <strong>
                  {' '}
                  {usuario}
                </strong>
                .
              </Typography>

              <TextField
                autoFocus
                label="Código de 6 dígitos"
                value={codigo}
                onChange={(event) =>
                  setCodigo(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                }
                inputProps={{
                  inputMode: 'numeric',
                  maxLength: 6,
                }}
                disabled={loading}
                fullWidth
              />

              <TextField
                label="Nueva contraseña"
                type="password"
                value={nuevaClave}
                onChange={(event) =>
                  setNuevaClave(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                disabled={loading}
                fullWidth
              />

              <LinearProgress
                variant="determinate"
                value={porcentaje}
              />

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Mínimo 10 caracteres,
                mayúscula, minúscula,
                número y símbolo.
              </Typography>

              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmarClave}
                onChange={(event) =>
                  setConfirmarClave(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                disabled={loading}
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={cerrar}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={
            paso === 1
              ? solicitarCodigo
              : restablecer
          }
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
          {paso === 1
            ? 'Enviar código'
            : 'Cambiar contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
