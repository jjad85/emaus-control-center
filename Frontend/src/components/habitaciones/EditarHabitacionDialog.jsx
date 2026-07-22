import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  useEffect,
  useState,
} from 'react';
import { editarHabitacion } from '../../api/habitacionesApi';

export default function EditarHabitacionDialog({
  open,
  habitacion,
  token,
  onClose,
  onSaved,
}) {
  const [form, setForm] =
    useState({
      habitacion: '',
      capacidad: 1,
      bloque: '',
      piso: '',
      observaciones: '',
      activo: true,
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open || !habitacion) {
      return;
    }

    setError('');

    setForm({
      habitacion:
        habitacion.habitacion || '',
      capacidad:
        Number(
          habitacion.capacidad || 1
        ),
      bloque:
        habitacion.bloque || '',
      piso:
        habitacion.piso || '',
      observaciones:
        habitacion.observaciones ||
        '',
      activo:
        habitacion.activo !== false,
    });
  }, [open, habitacion]);

  async function guardar() {
    const capacidad =
      Number(form.capacidad);

    if (!form.habitacion.trim()) {
      setError(
        'El número de habitación es obligatorio.'
      );
      return;
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad < 1 ||
      capacidad > 2
    ) {
      setError(
        'La capacidad debe ser 1 o 2.'
      );
      return;
    }

    if (!form.bloque.trim()) {
      setError(
        'El bloque es obligatorio.'
      );
      return;
    }

    if (!String(form.piso).trim()) {
      setError(
        'El piso es obligatorio.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const respuesta =
        await editarHabitacion(
          token,
          habitacion.id,
          {
            ...form,
            capacidad,
          }
        );

      if (onSaved) {
        await onSaved(respuesta);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible guardar la habitación.'
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
        Editar habitación
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Habitación"
            value={form.habitacion}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                habitacion:
                  event.target.value,
              }))
            }
            required
          />

          <TextField
            label="Tipo"
            value={
              habitacion?.tipo ||
              'Sin asignar'
            }
            disabled
            helperText="Se determina automáticamente según las personas asignadas."
          />

          <TextField
            label="Capacidad"
            type="number"
            value={form.capacidad}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                capacidad:
                  event.target.value,
              }))
            }
            inputProps={{
              min: 1,
              max: 2,
              step: 1,
            }}
            helperText="Mínimo 1, máximo 2 personas."
            required
          />

          <TextField
            label="Bloque"
            value={form.bloque}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                bloque:
                  event.target.value,
              }))
            }
            required
          />

          <TextField
            label="Piso"
            type="number"
            value={form.piso}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                piso:
                  event.target.value,
              }))
            }
            required
          />

          <TextField
            label="Observaciones"
            value={form.observaciones}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                observaciones:
                  event.target.value,
              }))
            }
            multiline
            minRows={3}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.activo}
                onChange={(event) =>
                  setForm((actual) => ({
                    ...actual,
                    activo:
                      event.target.checked,
                  }))
                }
              />
            }
            label={
              form.activo
                ? 'Habitación activa'
                : 'Habitación inactiva'
            }
          />

          {habitacion?.ocupantes >
            form.capacidad && (
            <Alert severity="warning">
              La capacidad no puede ser
              menor que la ocupación actual.
            </Alert>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Ocupación actual:{' '}
            {habitacion?.ocupantes || 0}
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
          variant="contained"
          onClick={guardar}
          disabled={saving}
        >
          {saving
            ? 'Guardando...'
            : 'Guardar habitación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
