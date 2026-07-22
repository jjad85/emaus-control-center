import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  EditRounded,
  GroupsRounded,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  cambiarEstadoEquipoAdministrable,
  guardarEquipoAdministrable,
  listarEquiposAdministrables,
} from '../../api/equiposAdministracionApi';
import ProtectedButton from '../ProtectedButton';
import AvatarServidor from '../servidores/AvatarServidor';
import EquipoFormDialog from './EquipoFormDialog';

const FORM_INICIAL = {
  id: '',
  nombre: '',
  tipo: 'Principal',
  descripcion: '',
  orden: '',
  activo: true,
};

export default function AdministracionEquiposPanel({
  onChanged,
}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] =
    useState(false);
  const [equipos, setEquipos] =
    useState([]);
  const [form, setForm] =
    useState(FORM_INICIAL);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState('');
  const [mensaje, setMensaje] =
    useState('');

  async function cargar() {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      setEquipos(
        await listarEquiposAdministrables(
          token
        )
      );
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible consultar los equipos.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) cargar();
  }, [open]);

  const grupos = useMemo(
    () => ({
      Principal: equipos.filter(
        (equipo) =>
          equipo.tipo === 'Principal'
      ),
      Apoyo: equipos.filter(
        (equipo) =>
          equipo.tipo === 'Apoyo'
      ),
    }),
    [equipos]
  );

  function nuevo() {
    setError('');
    setMensaje('');
    setForm(FORM_INICIAL);
    setEditorOpen(true);
  }

  function editar(equipo) {
    setError('');
    setMensaje('');
    setForm({
      id: equipo.id,
      nombre: equipo.nombre || '',
      tipo: equipo.tipo || 'Principal',
      descripcion:
        equipo.descripcion || '',
      orden: equipo.orden || '',
      activo: equipo.activo !== false,
    });
    setEditorOpen(true);
  }

  async function cambiarEstado(equipo) {
    setError('');

    try {
      await cambiarEstadoEquipoAdministrable(
        token,
        equipo.id,
        !equipo.activo
      );

      await cargar();

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible cambiar el estado.'
      );
    }
  }

  return (
    <>
      <ProtectedButton
        permiso="EDITAR_EQUIPOS"
        variant="contained"
        startIcon={<GroupsRounded />}
        onClick={() => setOpen(true)}
      >
        Administrar equipos
      </ProtectedButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Stack
            direction={{
              xs: 'column',
              sm: 'row',
            }}
            justifyContent="space-between"
            alignItems={{
              xs: 'flex-start',
              sm: 'center',
            }}
            gap={1}
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
              >
                Administración de equipos
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Organiza los equipos permanentes del retiro y los apoyos para tareas específicas.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={nuevo}
            >
              Crear equipo
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>
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

            {loading && (
              <Alert severity="info">
                Consultando equipos...
              </Alert>
            )}

            {['Principal', 'Apoyo'].map(
              (tipo) => (
                <Stack
                  key={tipo}
                  spacing={1.5}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={900}
                    >
                      {tipo === 'Principal'
                        ? 'Equipos principales'
                        : 'Equipos de apoyo'}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        grupos[tipo].length
                      }
                    />
                  </Stack>

                  {grupos[tipo].length === 0 && (
                    <Alert severity="info">
                      {tipo === 'Principal'
                        ? 'No hay equipos principales registrados.'
                        : 'Todavía no hay equipos de apoyo. Crea el primero para una tarea específica.'}
                    </Alert>
                  )}

                  <Grid
                    container
                    spacing={2}
                  >
                    {grupos[tipo].map(
                      (equipo) => (
                        <Grid
                          key={`${tipo}-${equipo.id || equipo.nombre}`}
                          size={{
                            xs: 12,
                            md: 6,
                          }}
                        >
                          <Card
                            variant="outlined"
                            sx={{
                              height: '100%',
                              opacity:
                                equipo.activo
                                  ? 1
                                  : 0.65,
                              position: 'relative',
                            }}
                          >
                            <CardContent>
                              <Stack spacing={1.5}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                  gap={1}
                                >
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                      variant="h6"
                                      fontWeight={900}
                                      noWrap
                                    >
                                      {equipo.nombre}
                                    </Typography>

                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      mt={0.5}
                                      flexWrap="wrap"
                                    >
                                      <Chip
                                        size="small"
                                        color={
                                          tipo ===
                                          'Principal'
                                            ? 'primary'
                                            : 'secondary'
                                        }
                                        label={
                                          tipo ===
                                          'Principal'
                                            ? 'Principal'
                                            : 'Apoyo'
                                        }
                                      />

                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        color={
                                          equipo.activo
                                            ? 'success'
                                            : 'default'
                                        }
                                        label={
                                          equipo.activo
                                            ? 'Activo'
                                            : 'Inactivo'
                                        }
                                      />
                                    </Stack>
                                  </Box>

                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                  >
                                    <Tooltip title="Editar nombre, descripción y tipo">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={
                                          <EditRounded />
                                        }
                                        onClick={() =>
                                          editar(equipo)
                                        }
                                        sx={{
                                          whiteSpace: 'nowrap',
                                          textTransform: 'none',
                                          fontWeight: 800,
                                        }}
                                      >
                                        Editar
                                      </Button>
                                    </Tooltip>

                                    <Switch
                                      checked={
                                        equipo.activo
                                      }
                                      onChange={() =>
                                        cambiarEstado(
                                          equipo
                                        )
                                      }
                                      inputProps={{
                                        'aria-label':
                                          `Activar o desactivar ${equipo.nombre}`,
                                      }}
                                    />
                                  </Stack>
                                </Stack>

                                <Typography
                                  color="text.secondary"
                                  sx={{
                                    minHeight: 48,
                                  }}
                                >
                                  {equipo.descripcion ||
                                    'Sin descripción'}
                                </Typography>

                                <Divider />

                                <Typography
                                  fontWeight={800}
                                >
                                  {
                                    equipo.cantidadIntegrantes
                                  }{' '}
                                  {equipo.cantidadIntegrantes ===
                                  1
                                    ? 'integrante'
                                    : 'integrantes'}
                                </Typography>

                                <Stack
                                  direction="row"
                                  spacing={-0.75}
                                  flexWrap="wrap"
                                  minHeight={38}
                                >
                                  {(
                                    equipo.integrantes ||
                                    []
                                  )
                                    .slice(0, 8)
                                    .map(
                                      (
                                        integrante,
                                        indice
                                      ) => (
                                        <AvatarServidor
                                          key={`${equipo.id || equipo.nombre}-${integrante.id || integrante.nombre || indice}`}
                                          servidor={
                                            integrante
                                          }
                                          size={38}
                                        />
                                      )
                                    )}
                                </Stack>

                                <Button
                                  fullWidth
                                  variant="contained"
                                  startIcon={
                                    <EditRounded />
                                  }
                                  onClick={() =>
                                    editar(equipo)
                                  }
                                  sx={{
                                    mt: 'auto',
                                    textTransform: 'none',
                                    fontWeight: 850,
                                  }}
                                >
                                  Editar equipo
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Stack>
              )
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <EquipoFormDialog
        open={editorOpen}
        equipo={form.id ? form : null}
        token={token}
        onClose={() =>
          setEditorOpen(false)
        }
        onSaved={async (guardado) => {
          setMensaje(
            `${guardado?.nombre || form.nombre} quedó registrado en la hoja Equipos.`
          );
          await cargar();

          if (onChanged) {
            await onChanged();
          }
        }}
      />
    </>
  );
}
