import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useEffect,
  useState,
} from 'react';
import {
  asignarCaminantesMesa,
  obtenerCandidatosMesaCaminantes,
} from '../../api/mesasApi';

export default function AsignarCaminantesMesaDialog({
  open,
  mesa,
  token,
  onClose,
  onSaved,
}) {
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
    if (
      !open ||
      !mesa?.numero ||
      !token
    ) {
      return;
    }

    let activo = true;

    setLoading(true);
    setDatos(null);
    setSeleccionados([]);
    setError('');

    obtenerCandidatosMesaCaminantes(
      token,
      mesa.numero
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
              'No fue posible consultar los caminantes disponibles.'
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
    mesa?.numero,
    token,
  ]);

  const cupos =
    datos?.cuposDisponibles ??
    mesa?.cuposDisponibles ??
    0;

  async function guardar() {
    if (!seleccionados.length) {
      setError(
        'Seleccione al menos un caminante.'
      );
      return;
    }

    if (
      seleccionados.length >
      cupos
    ) {
      setError(
        `La mesa solo tiene ${cupos} cupo(s) disponible(s).`
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const respuesta =
        await asignarCaminantesMesa(
          token,
          mesa.numero,
          seleccionados.map(
            (item) => item.id
          )
        );

      if (onSaved) {
        await onSaved(respuesta);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible asignar los caminantes.'
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
        Asignar caminantes a Mesa{' '}
        {mesa?.numero}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Alert severity="info">
            Capacidad:{' '}
            <strong>
              {mesa?.capacidad}
            </strong>
            {' · '}
            Asignados:{' '}
            <strong>
              {mesa?.cantidadCaminantes}
            </strong>
            {' · '}
            Cupos disponibles:{' '}
            <strong>{cupos}</strong>
          </Alert>

          {loading ? (
            <Stack
              alignItems="center"
              py={4}
            >
              <CircularProgress />
            </Stack>
          ) : (
            <>
              <Autocomplete
                multiple
                options={
                  datos?.candidatos || []
                }
                value={seleccionados}
                onChange={(_, nuevos) => {
                  if (
                    nuevos.length <=
                    cupos
                  ) {
                    setSeleccionados(
                      nuevos
                    );
                  }
                }}
                getOptionLabel={(item) =>
                  item.nombre || ''
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
                  cupos
                }
                noOptionsText="No hay caminantes sin mesa"
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
                    <ListItemText
                      primary={
                        opcion.nombre
                      }
                      secondary={[
                        opcion.documento
                          ? `Documento: ${opcion.documento}`
                          : '',
                        opcion.habitacion
                          ? `Habitación: ${opcion.habitacion}`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Caminantes sin mesa"
                    placeholder="Buscar y seleccionar"
                  />
                )}
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Seleccionados:{' '}
                <strong>
                  {seleccionados.length}
                </strong>{' '}
                de <strong>{cupos}</strong>
              </Typography>

              {(datos?.candidatos || [])
                .length === 0 && (
                <Alert severity="warning">
                  Todos los caminantes ya tienen mesa.
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
          onClick={guardar}
          disabled={
            loading ||
            saving ||
            !seleccionados.length ||
            seleccionados.length > cupos
          }
        >
          {saving
            ? 'Asignando...'
            : 'Asignar caminantes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
