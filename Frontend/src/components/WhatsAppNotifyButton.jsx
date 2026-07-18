import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';

import { useState } from 'react';

import {
  prepararNotificacionWhatsapp,
  confirmarNotificacionWhatsapp,
} from '../api/whatsappApi';

function obtenerMensajeError(error) {
  return String(
    error?.message ||
    error?.mensaje ||
    'No fue posible preparar la notificación de WhatsApp.'
  );
}

function esTelefonoInvalido(error) {
  const mensaje = obtenerMensajeError(error).toLowerCase();

  return (
    mensaje.includes('celular no es válido') ||
    mensaje.includes('telefono no es valido') ||
    mensaje.includes('teléfono no es válido') ||
    mensaje.includes('telefono whatsapp invalido') ||
    mensaje.includes('telefono_whatsapp_invalido')
  );
}

export default function WhatsAppNotifyButton({
  token,
  notificacion,
  onCompleted,
  size = 'small',
  fullWidth = false,
  label,
}) {
  const [loading, setLoading] = useState(false);

  const [errorDialog, setErrorDialog] = useState({
    open: false,
    telefonoInvalido: false,
    ventanaBloqueada: false,
    mensaje: '',
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    id: '',
  });

  if (!notificacion?.id) {
    return null;
  }

  function cerrarError() {
    setErrorDialog({
      open: false,
      telefonoInvalido: false,
      ventanaBloqueada: false,
      mensaje: '',
    });
  }

  function cerrarConfirmacion() {
    setConfirmDialog({
      open: false,
      id: '',
    });
  }

  async function notificar() {
    /*
     * La ventana se abre inmediatamente durante el clic.
     * Esto evita que el navegador la bloquee mientras esperamos la API.
     *
     * Nunca se usa window.location.href, porque eso sacaría al usuario
     * del Centro de Control y cargaría WhatsApp en la pestaña del portal.
     */
    const ventanaWhatsapp = window.open(
      '',
      '_blank'
    );

    if (!ventanaWhatsapp) {
      setErrorDialog({
        open: true,
        telefonoInvalido: false,
        ventanaBloqueada: true,
        mensaje:
          'El navegador bloqueó la nueva pestaña de WhatsApp.',
      });

      return;
    }

    try {
      ventanaWhatsapp.document.title =
        'Preparando WhatsApp…';

      ventanaWhatsapp.document.body.innerHTML = `
        <div style="
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:Arial,Helvetica,sans-serif;
          background:#f5f7f6;
          color:#173b34;
          text-align:center;
          padding:24px;
          box-sizing:border-box;
        ">
          <div>
            <div style="font-size:42px;margin-bottom:12px;">💬</div>
            <strong>Preparando mensaje de WhatsApp…</strong>
          </div>
        </div>
      `;
    } catch {
      // Algunos navegadores no permiten modificar la pestaña temporal.
    }

    setLoading(true);

    try {
      const preparada =
        await prepararNotificacionWhatsapp(
          token,
          notificacion.id
        );

      /*
       * WhatsApp se carga exclusivamente en la pestaña nueva.
       * El portal permanece abierto en su pestaña original.
       */
      ventanaWhatsapp.location.replace(
        preparada.url
      );

      setConfirmDialog({
        open: true,
        id: notificacion.id,
      });
    } catch (error) {
      try {
        ventanaWhatsapp.close();
      } catch {
        // La ventana puede haber sido cerrada manualmente.
      }

      const telefonoInvalido = esTelefonoInvalido(error);

      setErrorDialog({
        open: true,
        telefonoInvalido,
        ventanaBloqueada: false,
        mensaje: obtenerMensajeError(error),
      });
    } finally {
      setLoading(false);
    }
  }

  async function confirmarEnvio() {
    if (!confirmDialog.id) {
      return;
    }

    setLoading(true);

    try {
      await confirmarNotificacionWhatsapp(
        token,
        confirmDialog.id
      );

      cerrarConfirmacion();

      window.dispatchEvent(
        new CustomEvent(
          'emaus:notificaciones-actualizar'
        )
      );

      await onCompleted?.();
    } catch (error) {
      cerrarConfirmacion();

      setErrorDialog({
        open: true,
        telefonoInvalido: false,
        ventanaBloqueada: false,
        mensaje: obtenerMensajeError(error),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size={size}
        variant="contained"
        color="success"
        startIcon={
          loading
            ? <CircularProgress size={16} color="inherit" />
            : <WhatsApp />
        }
        onClick={notificar}
        disabled={loading}
        fullWidth={fullWidth}
      >
        {label || (
          notificacion.estado === 'Abierta'
            ? 'Confirmar / reenviar'
            : 'Notificar'
        )}
      </Button>

      <Dialog
        open={confirmDialog.open}
        onClose={cerrarConfirmacion}
        fullWidth
        maxWidth="xs"
        aria-labelledby="whatsapp-confirm-title"
      >
        <DialogTitle id="whatsapp-confirm-title">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <WhatsApp color="success" />

            <Typography
              component="span"
              fontWeight={900}
            >
              WhatsApp abierto
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <Alert
              severity="info"
              icon={<OpenInNewRounded />}
            >
              El mensaje se abrió en una pestaña nueva. Este portal seguirá
              abierto en la pestaña actual.
            </Alert>

            <DialogContentText>
              Regresa a esta pestaña después de presionar
              <strong> Enviar </strong>
              en WhatsApp.
            </DialogContentText>

            <DialogContentText sx={{ fontWeight: 700 }}>
              ¿Confirmas que el mensaje fue enviado?
            </DialogContentText>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1,
          }}
        >
          <Button
            onClick={cerrarConfirmacion}
            disabled={loading}
          >
            Aún no
          </Button>

          <Button
            onClick={confirmarEnvio}
            variant="contained"
            color="success"
            startIcon={
              loading
                ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                )
                : <CheckCircleOutlineRounded />
            }
            disabled={loading}
          >
            Sí, ya lo envié
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={errorDialog.open}
        onClose={cerrarError}
        fullWidth
        maxWidth="xs"
        aria-labelledby="whatsapp-error-title"
      >
        <DialogTitle id="whatsapp-error-title">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <ErrorOutlineRounded color="error" />

            <Typography
              component="span"
              fontWeight={900}
            >
              {errorDialog.telefonoInvalido
                ? 'Número de celular inválido'
                : errorDialog.ventanaBloqueada
                  ? 'Ventana de WhatsApp bloqueada'
                  : 'No fue posible abrir WhatsApp'}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {errorDialog.telefonoInvalido ? (
            <Stack spacing={2}>
              <Alert severity="error">
                El número de celular registrado no es válido para WhatsApp.
              </Alert>

              <DialogContentText>
                Revisa y corrige el celular del aspirante antes de volver a
                intentarlo. Si no cuentas con otro número, debes buscar otra
                forma de contactarlo para informarle sobre su proceso en el
                retiro.
              </DialogContentText>

              <DialogContentText sx={{ fontWeight: 700 }}>
                Esta notificación continuará pendiente hasta que pueda ser
                gestionada.
              </DialogContentText>
            </Stack>
          ) : errorDialog.ventanaBloqueada ? (
            <Stack spacing={2}>
              <Alert severity="warning">
                El navegador impidió abrir WhatsApp en una pestaña nueva.
              </Alert>

              <DialogContentText>
                Habilita las ventanas emergentes para este sitio y vuelve a
                presionar el botón de notificación.
              </DialogContentText>

              <DialogContentText sx={{ fontWeight: 700 }}>
                El portal no será reemplazado ni cerrado.
              </DialogContentText>
            </Stack>
          ) : (
            <Alert severity="error">
              {errorDialog.mensaje}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={cerrarError}
            variant="contained"
            autoFocus
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
