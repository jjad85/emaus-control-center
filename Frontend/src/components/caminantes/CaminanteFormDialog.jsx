import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

const FORM_INICIAL = {
  nombre: '',
  telefono: '',
  tallaCamiseta: '',
  estadoPago: 'Pendiente',
  mesa: '',
  habitacion: '',
  contacto: '',
  telefonoContacto: '',
  carta: 'Pendiente',
  foto: 'Pendiente',
};

export default function CaminanteFormDialog({
  open,
  onClose,
  onSubmit,
  loading,
  opciones,
  caminante = null,
  modo = 'crear',
}) {
  const [form, setForm] =
    useState(FORM_INICIAL);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      modo === 'editar' &&
      caminante
    ) {
      setForm({
        nombre:
          caminante.nombre || '',
        telefono:
          caminante.telefono || '',
        tallaCamiseta:
          caminante.tallaCamiseta || '',
        estadoPago:
          caminante.estadoPago ||
          'Pendiente',
        mesa:
          caminante.mesa || '',
        habitacion:
          caminante.habitacion || '',
        contacto:
          caminante.contacto?.nombre ||
          caminante.contacto ||
          '',
        telefonoContacto:
          caminante.contacto?.telefono ||
          caminante.telefonoContacto ||
          '',
        carta:
          caminante.entregables?.carta ||
          caminante.carta ||
          'Pendiente',
        foto:
          caminante.entregables?.foto ||
          caminante.foto ||
          'Pendiente',
      });
    } else {
      setForm(FORM_INICIAL);
    }

    setError('');
  }, [
    open,
    modo,
    caminante,
  ]);

  const estadosPago =
    opciones?.estadosPago || [
      'Pendiente',
      'Pago Parcial',
      'Pago Total',
    ];

  const estadosEntregables =
    opciones?.estadosEntregables || [
      'Pendiente',
      'En Proceso',
      'Completado',
    ];

  const mesas =
    opciones?.mesasDisponibles || [];

  const habitaciones =
    opciones?.habitacionesDisponibles ||
    [];

  const titulo =
    modo === 'editar'
      ? 'Editar caminante'
      : 'Registrar caminante';

  const textoBoton =
    modo === 'editar'
      ? 'Guardar cambios'
      : 'Registrar caminante';

  const puedeEnviar = useMemo(
    () =>
      Boolean(
        form.nombre.trim() &&
        form.telefono.trim() &&
        form.contacto.trim() &&
        form.telefonoContacto.trim()
      ),
    [form]
  );

  function actualizarCampo(
    campo,
    valor
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();
    setError('');

    if (!puedeEnviar) {
      setError(
        'Complete nombre, teléfono y datos del contacto.'
      );
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(
        err.message ||
          'No fue posible guardar el caminante.'
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
      maxWidth="md"
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle>
        {titulo}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2.5}
          mt={1}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Typography
            variant="overline"
            color="primary"
            fontWeight={800}
          >
            Datos básicos
          </Typography>

          <Grid
            container
            spacing={2}
          >
            <Grid
              size={{
                xs: 12,
                md: 8,
              }}
            >
              <TextField
                label="Nombre completo"
                value={form.nombre}
                onChange={(e) =>
                  actualizarCampo(
                    'nombre',
                    e.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                label="Teléfono"
                value={form.telefono}
                onChange={(e) =>
                  actualizarCampo(
                    'telefono',
                    e.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                select
                label="Talla de camiseta"
                value={form.tallaCamiseta}
                onChange={(e) =>
                  actualizarCampo(
                    'tallaCamiseta',
                    e.target.value
                  )
                }
                fullWidth
              >
                <MenuItem value="">
                  Sin definir
                </MenuItem>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(
                  (talla) => (
                    <MenuItem
                      key={talla}
                      value={talla}
                    >
                      {talla}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                select
                label="Estado del pago"
                value={
                  form.estadoPago
                }
                onChange={(e) =>
                  actualizarCampo(
                    'estadoPago',
                    e.target.value
                  )
                }
                fullWidth
              >
                {estadosPago.map(
                  (estado) => (
                    <MenuItem
                      key={estado}
                      value={estado}
                    >
                      {estado}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                select
                label="Mesa"
                value={form.mesa}
                onChange={(e) =>
                  actualizarCampo(
                    'mesa',
                    e.target.value
                  )
                }
                fullWidth
              >
                <MenuItem value="">
                  Pendiente por definir
                </MenuItem>

                {mesas.map((mesa) => (
                  <MenuItem
                    key={mesa.numero}
                    value={String(
                      mesa.numero
                    )}
                  >
                    {mesa.etiqueta ||
                      `Mesa ${mesa.numero}`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                select
                label="Habitación"
                value={
                  form.habitacion
                }
                onChange={(e) =>
                  actualizarCampo(
                    'habitacion',
                    e.target.value
                  )
                }
                fullWidth
              >
                <MenuItem value="">
                  Pendiente por definir
                </MenuItem>

                {habitaciones.map(
                  (habitacion) => (
                    <MenuItem
                      key={
                        habitacion.habitacion
                      }
                      value={String(
                        habitacion.habitacion
                      )}
                    >
                      {habitacion.etiqueta ||
                        `Habitación ${habitacion.habitacion}`}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
          </Grid>

          <Typography
            variant="overline"
            color="primary"
            fontWeight={800}
          >
            Contacto
          </Typography>

          <Grid
            container
            spacing={2}
          >
            <Grid
              size={{
                xs: 12,
                md: 8,
              }}
            >
              <TextField
                label="Nombre del contacto"
                value={form.contacto}
                onChange={(e) =>
                  actualizarCampo(
                    'contacto',
                    e.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                label="Teléfono del contacto"
                value={
                  form.telefonoContacto
                }
                onChange={(e) =>
                  actualizarCampo(
                    'telefonoContacto',
                    e.target.value
                  )
                }
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Typography
            variant="overline"
            color="primary"
            fontWeight={800}
          >
            Entregables
          </Typography>

          <Grid
            container
            spacing={2}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                select
                label="Carta"
                value={form.carta}
                onChange={(e) =>
                  actualizarCampo(
                    'carta',
                    e.target.value
                  )
                }
                fullWidth
              >
                {estadosEntregables.map(
                  (estado) => (
                    <MenuItem
                      key={estado}
                      value={estado}
                    >
                      {estado}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                select
                label="Foto"
                value={form.foto}
                onChange={(e) =>
                  actualizarCampo(
                    'foto',
                    e.target.value
                  )
                }
                fullWidth
              >
                {estadosEntregables.map(
                  (estado) => (
                    <MenuItem
                      key={estado}
                      value={estado}
                    >
                      {estado}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
          </Grid>
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
          disabled={
            loading ||
            !puedeEnviar
          }
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
          {loading
            ? 'Guardando...'
            : textoBoton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
