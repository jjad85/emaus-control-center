import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useEffect,
  useState,
} from 'react';
import {
  asignarPersonasHabitacion,
  obtenerCandidatosHabitacion,
} from '../../api/habitacionesApi';
import AvatarServidor from '../servidores/AvatarServidor';

export default function AsignarPersonaHabitacionDialog({
  open,
  habitacion,
  token,
  onClose,
  onSaved,
}) {
  const [tipoPersona, setTipoPersona] =
    useState('');

  const [datos, setDatos] =
    useState(null);

  const [seleccionados, setSeleccionados] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setTipoPersona(
      ['Servidor', 'Caminante'].includes(
        habitacion?.tipo
      )
        ? habitacion.tipo
        : ''
    );

    setDatos(null);
    setSeleccionados([]);
    setError('');
  }, [open, habitacion]);

  useEffect(() => {
    if (
      !open ||
      !habitacion?.id ||
      !token ||
      !tipoPersona
    ) {
      return;
    }

    let activo = true;

    setLoading(true);
    setDatos(null);
    setSeleccionados([]);
    setError('');

    obtenerCandidatosHabitacion(
      token,
      habitacion.id,
      tipoPersona
    )
      .then((respuesta) => {
        if (activo) {
          setDatos(respuesta);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(
            err?.message ||
              'No fue posible consultar las personas disponibles.'
          );
        }
      })
      .finally(() => {
        if (activo) {
          setLoading(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [
    open,
    habitacion?.id,
    token,
    tipoPersona,
  ]);

  const cuposDisponibles =
    datos?.habitacion
      ?.cuposDisponibles ??
    habitacion?.cuposDisponibles ??
    0;

  async function asignar() {
    if (!tipoPersona) {
      setError(
        'Seleccione si va a asignar un servidor o un caminante.'
      );
      return;
    }

    if (!seleccionados.length) {
      setError(
        'Seleccione al menos una persona.'
      );
      return;
    }

    if (
      seleccionados.length >
      cuposDisponibles
    ) {
      setError(
        `Solo hay ${cuposDisponibles} cupo(s) disponible(s).`
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const respuesta =
        await asignarPersonasHabitacion(
          token,
          habitacion.id,
          tipoPersona,
          seleccionados.map(
            (persona) => persona.id
          )
        );

      if (onSaved) {
        await onSaved(respuesta);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible asignar las personas.'
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
        Asignar persona a habitación{' '}
        {habitacion?.habitacion}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            select
            label="Tipo de persona"
            value={tipoPersona}
            onChange={(event) =>
              setTipoPersona(
                event.target.value
              )
            }
            disabled={
              ['Servidor', 'Caminante']
                .includes(
                  habitacion?.tipo
                )
            }
            helperText={
              habitacion?.tipo ===
              'Sin asignar'
                ? 'Seleccione primero el tipo de persona.'
                : `La habitación ya está destinada a ${habitacion?.tipo.toLowerCase()}s.`
            }
          >
            <MenuItem value="Servidor">
              Servidor
            </MenuItem>
            <MenuItem value="Caminante">
              Caminante
            </MenuItem>
          </TextField>

          {tipoPersona && (
            <>
              <Alert severity="info">
                Capacidad:{' '}
                <strong>
                  {habitacion?.capacidad}
                </strong>
                {' · '}
                Ocupantes:{' '}
                <strong>
                  {habitacion?.ocupantes}
                </strong>
                {' · '}
                Cupos disponibles:{' '}
                <strong>
                  {cuposDisponibles}
                </strong>
              </Alert>

              {loading ? (
                <Stack
                  alignItems="center"
                  py={4}
                >
                  <CircularProgress />
                </Stack>
              ) : (
                <Autocomplete
                  multiple
                  options={
                    datos?.candidatos || []
                  }
                  value={seleccionados}
                  onChange={(_, nuevos) => {
                    if (
                      nuevos.length <=
                      cuposDisponibles
                    ) {
                      setSeleccionados(
                        nuevos
                      );
                    }
                  }}
                  getOptionLabel={(opcion) =>
                    opcion.nombre || ''
                  }
                  isOptionEqualToValue={(
                    opcion,
                    valor
                  ) =>
                    String(opcion.id) ===
                    String(valor.id)
                  }
                  getOptionDisabled={() =>
                    seleccionados.length >=
                    cuposDisponibles
                  }
                  noOptionsText={
                    tipoPersona ===
                    'Servidor'
                      ? 'No hay servidores sin habitación'
                      : 'No hay caminantes sin habitación'
                  }
                  renderOption={(
                    props,
                    opcion
                  ) => (
                    <li
                      {...props}
                      key={
                        opcion.id ||
                        opcion.nombre
                      }
                    >
                      <ListItemAvatar>
                        {tipoPersona ===
                        'Servidor' ? (
                          <AvatarServidor
                            servidor={opcion}
                            size={38}
                            mostrarTooltip={
                              false
                            }
                          />
                        ) : (
                          <AvatarServidor
                            nombre={
                              opcion.nombre
                            }
                            size={38}
                            mostrarTooltip={
                              false
                            }
                          />
                        )}
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          opcion.nombre
                        }
                        secondary={
                          tipoPersona ===
                          'Servidor'
                            ? [
                                opcion.equipo,
                                opcion.rol,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ' · '
                                ) ||
                              'Servidor'
                            : opcion.mesa
                              ? `Mesa ${opcion.mesa}`
                              : 'Caminante sin mesa'
                        }
                      />
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Personas disponibles"
                      placeholder="Buscar y seleccionar"
                    />
                  )}
                />
              )}

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Seleccionados:{' '}
                <strong>
                  {seleccionados.length}
                </strong>{' '}
                de{' '}
                <strong>
                  {cuposDisponibles}
                </strong>
              </Typography>

              {!loading &&
                tipoPersona &&
                (datos?.candidatos || [])
                  .length === 0 && (
                  <Alert severity="warning">
                    No hay personas de este
                    tipo sin habitación.
                  </Alert>
                )}
            </>
          )}
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
          onClick={asignar}
          disabled={
            loading ||
            saving ||
            !tipoPersona ||
            !seleccionados.length ||
            seleccionados.length >
              cuposDisponibles
          }
        >
          {saving
            ? 'Asignando...'
            : 'Asignar persona'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
