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
import { useEffect, useState } from 'react';
import {
  asignarServidoresAEquipo,
  obtenerCandidatosAsignacionEquipo,
} from '../../api/equiposAdministracionApi';
import AvatarServidor from '../servidores/AvatarServidor';


function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function AsignarServidorEquipoDialog({
  open,
  equipo,
  token,
  onClose,
  onSaved,
}) {
  const [datos, setDatos] =
    useState(null);
  const [seleccionados, setSeleccionados] =
    useState([]);
  const [rol, setRol] =
    useState('');
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open || !equipo?.id || !token) {
      return;
    }

    let activo = true;
    setLoading(true);
    setError('');
    setSeleccionados([]);
    setRol('');

    obtenerCandidatosAsignacionEquipo(
      token,
      equipo.id,
      equipo.nombre
    )
      .then((respuesta) => {
        if (activo) {
          setDatos(respuesta);
          setRol(
            respuesta?.rolesDisponibles?.[0] ||
            (
              normalizar(
                respuesta?.equipo?.tipo
              ) === 'apoyo'
                ? 'Apoyo'
                : ''
            )
          );
          setError('');
        }
      })
      .catch((err) => {
        if (activo) {
          setError(
            err?.message ||
              'No fue posible consultar los servidores disponibles.'
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
  }, [open, equipo?.id, token]);

  async function asignar() {
    if (!seleccionados.length) {
      setError(
        'Seleccione al menos un servidor.'
      );
      return;
    }

    if (!rol) {
      setError(
        'Seleccione el rol que tendrán los servidores.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const respuesta =
        await asignarServidoresAEquipo(
          token,
          datos?.equipo?.id || equipo.id,
          datos?.equipo?.nombre || equipo.nombre,
          rol,
          seleccionados.map(
            (servidor) => servidor.id
          )
        );

      setDatos(respuesta);
      setSeleccionados([]);

      if (onSaved) {
        await onSaved(respuesta);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible asignar los servidores.'
      );
    } finally {
      setSaving(false);
    }
  }

  const esPrincipal =
    normalizar(
      datos?.equipo?.tipo ||
      equipo?.tipo
    ) === 'principal';

  const nombreEquipo =
    normalizar(
      datos?.equipo?.nombre ||
      equipo?.nombre
    );

  const esEquipoDireccion = [
    'direccion',
    'equipo direccion',
    'equipo de direccion',
  ].includes(nombreEquipo);

  const esEquipoMesa = [
    'mesa',
    'mesas',
    'equipo mesa',
    'equipo de mesa',
  ].includes(nombreEquipo);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Asignar servidores a{' '}
        {equipo?.nombreVisible ||
          equipo?.nombre ||
          'equipo'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {loading ? (
            <Stack
              alignItems="center"
              py={4}
            >
              <CircularProgress />
            </Stack>
          ) : error ? null : (
            <>
              <Alert
                severity={
                  esPrincipal
                    ? 'info'
                    : 'success'
                }
              >
                {esPrincipal
                  ? 'Solo se muestran servidores que todavía no tienen equipo principal. Al asignarlos, dejarán de aparecer como disponibles en los demás equipos principales.'
                  : 'Solo se muestran servidores que todavía no pertenecen a este equipo de apoyo.'}
              </Alert>

              <TextField
                select
                label="Rol en el equipo"
                value={rol}
                onChange={(event) =>
                  setRol(event.target.value)
                }
                disabled={
                  esPrincipal
                    ? !(datos?.rolesDisponibles || []).length
                    : true
                }
                helperText={
                  esPrincipal
                    ? esEquipoMesa
                      ? 'Mesa conserva su lógica: puede tener varios líderes y varios colíderes.'
                      : esEquipoDireccion
                        ? 'Dirección solo permite un Líder y un Colíder.'
                        : 'Este equipo debe tener un Líder; los demás integrantes tendrán el rol Equipo.'
                    : 'Los equipos de apoyo siempre usan el rol Apoyo.'
                }
              >
                {(datos?.rolesDisponibles || []).map(
                  (opcionRol, indice) => (
                    <MenuItem
                      key={`rol-${opcionRol}-${indice}`}
                      value={opcionRol}
                    >
                      {opcionRol}
                    </MenuItem>
                  )
                )}
              </TextField>

              <Autocomplete
                multiple
                options={datos?.candidatos || []}
                value={seleccionados}
                onChange={(_, nuevos) =>
                  setSeleccionados(nuevos)
                }
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
                noOptionsText={
                  esPrincipal
                    ? 'No hay servidores sin equipo principal'
                    : 'Todos los servidores ya pertenecen a este equipo'
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
                      <AvatarServidor
                        servidor={opcion}
                        size={38}
                        mostrarTooltip={false}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={opcion.nombre}
                      secondary={
                        esPrincipal
                          ? 'Sin equipo principal'
                          : opcion.equipo
                            ? `Principal: ${opcion.equipo}`
                            : 'Sin equipo principal'
                      }
                    />
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Servidores disponibles"
                    placeholder="Buscar y seleccionar"
                  />
                )}
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Integrantes actuales:{' '}
                <strong>
                  {
                    (
                      datos?.integrantesActuales ||
                      []
                    ).length
                  }
                </strong>
              </Typography>

              {(datos?.candidatos || [])
                .length === 0 && (
                <Alert severity="warning">
                  No hay servidores disponibles
                  para esta asignación.
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
            !seleccionados.length ||
            !rol
          }
        >
          {saving
            ? 'Asignando...'
            : `Asignar ${
                seleccionados.length || ''
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
