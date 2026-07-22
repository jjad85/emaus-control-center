import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { guardarEquipoAdministrable } from '../../api/equiposAdministracionApi';

const FORM_INICIAL = {
  id: '',
  nombre: '',
  tipo: 'Principal',
  descripcion: '',
  orden: '',
  activo: true,
};

export default function EquipoFormDialog({
  open,
  equipo,
  token,
  onClose,
  onSaved,
}) {
  const [form, setForm] =
    useState(FORM_INICIAL);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open) return;

    setError('');
    setForm(
      equipo
        ? {
            id: equipo.id || '',
            nombre: equipo.nombre || '',
            tipo: equipo.tipo || 'Principal',
            descripcion:
              equipo.descripcion || '',
            orden: equipo.orden || '',
            activo: equipo.activo !== false,
          }
        : FORM_INICIAL
    );
  }, [open, equipo]);

  async function guardar() {
    if (!form.nombre.trim()) {
      setError(
        'El nombre del equipo es obligatorio.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const guardado =
        await guardarEquipoAdministrable(
          token,
          form
        );

      if (onSaved) {
        await onSaved(guardado);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible guardar el equipo.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {form.id
          ? 'Editar equipo'
          : 'Crear equipo'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                nombre: event.target.value,
              }))
            }
            required
            autoFocus
          />

          <TextField
            select
            label="Tipo de equipo"
            value={form.tipo}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                tipo: event.target.value,
              }))
            }
          >
            <MenuItem value="Principal">
              Equipo principal
            </MenuItem>
            <MenuItem value="Apoyo">
              Equipo de apoyo
            </MenuItem>
          </TextField>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Los equipos principales son permanentes.
            Los equipos de apoyo se usan para tareas
            específicas.
          </Typography>

          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                descripcion:
                  event.target.value,
              }))
            }
            multiline
            minRows={3}
          />

          <TextField
            label="Orden"
            type="number"
            value={form.orden}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                orden: event.target.value,
              }))
            }
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
                ? 'Equipo activo'
                : 'Equipo inactivo'
            }
          />
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
            : 'Guardar equipo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
