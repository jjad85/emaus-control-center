import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  useEffect,
  useState,
} from 'react';

export default function CaminanteActionDialog({
  open,
  onClose,
  onSubmit,
  loading,
  titulo,
  descripcion,
  label,
  valorInicial = '',
  opciones = [],
}) {
  const [valor, setValor] =
    useState(valorInicial);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (open) {
      setValor(
        valorInicial || ''
      );
      setError('');
    }
  }, [
    open,
    valorInicial,
  ]);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    try {
      await onSubmit(valor);
    } catch (err) {
      setError(
        err.message ||
          'No fue posible guardar el cambio.'
      );
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        loading ? undefined : onClose
      }
      fullWidth
      maxWidth="xs"
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle>
        {titulo}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          mt={1}
        >
          {descripcion && (
            <Typography
              color="text.secondary"
            >
              {descripcion}
            </Typography>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            select
            label={label}
            value={valor}
            onChange={(e) =>
              setValor(
                e.target.value
              )
            }
            fullWidth
          >
            {opciones.map(
              (opcion) => (
                <MenuItem
                  key={
                    opcion.valor ??
                    opcion
                  }
                  value={
                    opcion.valor ??
                    opcion
                  }
                >
                  {opcion.etiqueta ??
                    opcion}
                </MenuItem>
              )
            )}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
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
                  color="inherit"
                />
              )
              : null
          }
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
