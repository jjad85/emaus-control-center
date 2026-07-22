import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';

import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

import {
  desbloquearUsuarioSistemaApi,
  guardarPermisosRolSistemaApi,
  obtenerAdministracionSistemaApi,
} from '../api/administracionApi';


const ETIQUETAS_PERMISOS = {
  IMPORTAR_ACTIVIDADES_PASO_A_PASO: 'Importar actividades del paso a paso',
  CREAR_ACTIVIDADES_PASO_A_PASO: 'Crear actividades del paso a paso',
  EXPORTAR_ACTIVIDADES_PASO_A_PASO: 'Exportar tabla y cronograma del paso a paso',
  MOVER_ACTIVIDADES_PASO_A_PASO: 'Mover actividades en modo acordeón',
};

function etiquetaPermiso(permiso) {
  return ETIQUETAS_PERMISOS[permiso] || permiso;
}

function esAdministrador(
  rol
) {
  const normalizado =
    String(
      rol || ''
    )
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );

  return (
    normalizado ===
      'administrador' ||
    normalizado ===
      'administradores'
  );
}

function fechaVisible(
  valor
) {
  if (!valor) {
    return '—';
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return String(valor);
  }

  return new Intl.DateTimeFormat(
    'es-CO',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(fecha);
}

export default function Administracion() {
  const {
    token,
    rol,
  } = useAuth();

  const api = useApi(
    () =>
      obtenerAdministracionSistemaApi(
        token
      ),
    [token]
  );

  const [rolSeleccionado, setRolSeleccionado] =
    useState('');

  const [permisosSeleccionados, setPermisosSeleccionados] =
    useState([]);

  const [procesando, setProcesando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  const datos =
    api.data || {};

  const roles =
    datos.roles || [];

  const catalogoPermisos =
    datos.permisos || [];

  const permisosPorRol =
    datos.permisosPorRol || {};

  useEffect(() => {
    if (
      !rolSeleccionado &&
      roles.length
    ) {
      setRolSeleccionado(
        roles[0].rol
      );
    }
  }, [
    roles,
    rolSeleccionado,
  ]);

  useEffect(() => {
    if (!rolSeleccionado) {
      setPermisosSeleccionados([]);
      return;
    }

    setPermisosSeleccionados(
      permisosPorRol[
        rolSeleccionado
      ] || []
    );
  }, [
    rolSeleccionado,
    permisosPorRol,
  ]);

  const usuariosBloqueados =
    useMemo(
      () =>
        (
          datos.usuarios || []
        ).filter(
          (usuario) =>
            usuario.bloqueado
        ),
      [datos.usuarios]
    );

  if (!esAdministrador(rol)) {
    return (
      <Alert severity="error">
        Esta página es exclusiva para administradores.
      </Alert>
    );
  }

  if (
    api.loading &&
    !api.data
  ) {
    return <LoadingState />;
  }

  if (api.error) {
    return (
      <ErrorState
        message={api.error}
        onRetry={api.reload}
      />
    );
  }

  async function desbloquear(
    usuario
  ) {
    setProcesando(true);
    setError('');
    setMensaje('');

    try {
      await desbloquearUsuarioSistemaApi(
        token,
        usuario
      );

      setMensaje(
        `El usuario ${usuario} fue desbloqueado.`
      );

      await api.reload();
    } catch (err) {
      setError(
        err.message ||
          'No fue posible desbloquear el usuario.'
      );
    } finally {
      setProcesando(false);
    }
  }

  function cambiarPermiso(
    permiso
  ) {
    setPermisosSeleccionados(
      (actuales) =>
        actuales.includes(
          permiso
        )
          ? actuales.filter(
              (item) =>
                item !== permiso
            )
          : [
              ...actuales,
              permiso,
            ]
    );
  }

  async function guardarPermisos() {
    if (!rolSeleccionado) {
      return;
    }

    setProcesando(true);
    setError('');
    setMensaje('');

    try {
      await guardarPermisosRolSistemaApi(
        token,
        rolSeleccionado,
        permisosSeleccionados
      );

      setMensaje(
        `Los permisos de ${rolSeleccionado} fueron actualizados.`
      );

      await api.reload();
    } catch (err) {
      setError(
        err.message ||
          'No fue posible actualizar los permisos.'
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Administración"
        subtitle="Seguridad de usuarios, roles y permisos"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        {mensaje && (
          <Alert severity="success">
            {mensaje}
          </Alert>
        )}

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="h6"
                fontWeight={900}
              >
                Usuarios bloqueados
              </Typography>

              <Typography
                color="text.secondary"
                variant="body2"
              >
                Desbloqueo manual de cuentas bloqueadas por intentos fallidos.
              </Typography>
            </Box>

            <Divider />

            {!usuariosBloqueados.length ? (
              <Alert severity="info">
                No hay usuarios bloqueados actualmente.
              </Alert>
            ) : (
              <Stack spacing={1.5}>
                {usuariosBloqueados.map(
                  (usuario) => (
                    <Paper
                      key={usuario.id || usuario.usuario}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 3,
                      }}
                    >
                      <Stack
                        direction={{
                          xs: 'column',
                          md: 'row',
                        }}
                        justifyContent="space-between"
                        alignItems={{
                          xs: 'stretch',
                          md: 'center',
                        }}
                        gap={2}
                      >
                        <Box>
                          <Typography
                            fontWeight={850}
                          >
                            {usuario.nombre ||
                              usuario.usuario}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Usuario: {usuario.usuario}
                          </Typography>

                          <Stack
                            direction="row"
                            gap={1}
                            mt={1}
                            flexWrap="wrap"
                          >
                            <Chip
                              size="small"
                              color="error"
                              label={`${usuario.intentosFallidos} intentos`}
                            />

                            <Chip
                              size="small"
                              label={`Bloqueado hasta: ${fechaVisible(
                                usuario.bloqueadoHasta
                              )}`}
                            />
                          </Stack>
                        </Box>

                        <Button
                          variant="contained"
                          startIcon={<LockOpenRounded />}
                          onClick={() =>
                            desbloquear(
                              usuario.usuario
                            )
                          }
                          disabled={procesando}
                        >
                          Desbloquear
                        </Button>
                      </Stack>
                    </Paper>
                  )
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="h6"
                fontWeight={900}
              >
                Roles y permisos
              </Typography>

              <Typography
                color="text.secondary"
                variant="body2"
              >
                Seleccione un rol y determine sus permisos activos.
              </Typography>
            </Box>

            <Divider />

            <TextField
              select
              label="Rol"
              value={rolSeleccionado}
              onChange={(event) =>
                setRolSeleccionado(
                  event.target.value
                )
              }
              sx={{
                maxWidth: 420,
              }}
            >
              {roles.map(
                (item) => (
                  <MenuItem
                    key={item.rol}
                    value={item.rol}
                  >
                    {item.rol}
                  </MenuItem>
                )
              )}
            </TextField>

            <Grid
              container
              spacing={1}
            >
              {catalogoPermisos.map(
                (permiso) => (
                  <Grid
                    key={permiso}
                    size={{
                      xs: 12,
                      sm: 6,
                      lg: 4,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            permisosSeleccionados.includes(
                              permiso
                            )
                          }
                          onChange={() =>
                            cambiarPermiso(
                              permiso
                            )
                          }
                        />
                      }
                      label={etiquetaPermiso(permiso)}
                    />
                  </Grid>
                )
              )}
            </Grid>

            <Button
              variant="contained"
              startIcon={
                procesando
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : <SecurityRounded />
              }
              onClick={guardarPermisos}
              disabled={
                procesando ||
                !rolSeleccionado
              }
              sx={{
                alignSelf: 'flex-start',
              }}
            >
              Guardar permisos
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </>
  );
}
