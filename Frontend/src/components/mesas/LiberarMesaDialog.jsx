import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  useState,
} from 'react';
import {
  liberarMesaFueraDeRango,
} from '../../api/mesasApi';

export default function LiberarMesaDialog({
  open,
  mesa,
  token,
  onClose,
  onSaved,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  async function confirmar() {
    setSaving(true);
    setError('');

    try {
      const respuesta =
        await liberarMesaFueraDeRango(
          token,
          mesa.numero
        );

      if (onSaved) {
        await onSaved(respuesta);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible liberar la mesa.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        saving ? undefined : onClose
      }
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Eliminar Mesa {mesa?.numero}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Alert severity="warning">
            Esta acción liberará a{' '}
            <strong>
              {mesa?.cantidadPersonas || 0}{' '}
              personas
            </strong>{' '}
            asignadas a la Mesa{' '}
            {mesa?.numero}.
          </Alert>

          <Typography>
            Los servidores y caminantes quedarán
            sin mesa y deberán ser reubicados.
          </Typography>

          <Typography fontWeight={850}>
            ¿Está seguro de continuar?
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={confirmar}
          disabled={saving}
        >
          {saving
            ? 'Liberando...'
            : 'Sí, eliminar mesa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
