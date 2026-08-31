import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import EditRounded from '@mui/icons-material/EditRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';

import {
  useMemo,
  useState,
} from 'react';

import {
  actualizarConfiguracionExistenteApi,
  obtenerConfiguracionesAdministracionApi,
} from '../api/configuracionesApi';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';

function normalizar(
  valor
) {
  return String(
    valor || ''
  )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}

function esBooleano(
  tipo
) {
  return [
    'booleano',
    'boolean',
  ].includes(
    normalizar(tipo)
  );
}

function esNumero(
  tipo
) {
  return [
    'numero',
    'numerico',
    'number',
  ].includes(
    normalizar(tipo)
  );
}

function esFecha(
  tipo
) {
  return [
    'fecha',
    'date',
  ].includes(
    normalizar(tipo)
  );
}

function esJson(
  tipo
) {
  return (
    normalizar(tipo) ===
    'json'
  );
}

function esTextoLargo(
  item
) {
  const clave =
    normalizar(
      item?.clave
    );

  return (
    esJson(item?.tipo) ||
    String(
      item?.valor || ''
    ).length > 100 ||
    clave.includes('html') ||
    clave.includes('contenido') ||
    clave.includes('texto')
  );
}

export default function Configuracion() {
  const {
    token,
  } = useAuth();

  const api = useApi(
    () =>
      obtenerConfiguracionesAdministracionApi(
        token
      ),
    [token]
  );

  const [busqueda, setBusqueda] =
    useState('');

  const [editando, setEditando] =
    useState(null);

  const [
    nombreVisible,
    setNombreVisible,
  ] = useState('');

  const [valor, setValor] =
    useState('');

  const [activo, setActivo] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  const items =
    api.data?.items || [];

  const filtrados =
    useMemo(
      () => {
        const termino =
          normalizar(
            busqueda
          );

        if (!termino) {
          return items;
        }

        return items.filter(
          (item) =>
            [
              item.nombreVisible,
              item.clave,
              item.valor,
              item.tipo,
              item.descripcion,
              item.agrupacion,
            ].some(
              (campo) =>
                normalizar(
                  campo
                ).includes(
                  termino
                )
            )
        );
      },
      [
        items,
        busqueda,
      ]
    );

  const grupos =
    useMemo(
      () => {
        const mapa =
          new Map();

        filtrados.forEach(
          (item) => {
            const nombre =
              String(
                item.agrupacion ||
                'Sin agrupar'
              ).trim() ||
              'Sin agrupar';

            if (
              !mapa.has(
                nombre
              )
            ) {
              mapa.set(
                nombre,
                []
              );
            }

            mapa
              .get(nombre)
              .push(item);
          }
        );

        return Array.from(
          mapa.entries()
        )
          .map(
            ([nombre, elementos]) => ({
              nombre,
              elementos,
            })
          )
          .sort(
            (a, b) =>
              a.nombre.localeCompare(
                b.nombre,
                'es'
              )
          );
      },
      [filtrados]
    );

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

  function abrirEdicion(
    item
  ) {
    setEditando(item);
    setNombreVisible(
      item.nombreVisible ||
      item.clave
    );
    setValor(
      item.valor ?? ''
    );
    setActivo(
      Boolean(
        item.activo
      )
    );
    setError('');
    setMensaje('');
  }

  function cerrarEdicion() {
    if (guardando) {
      return;
    }

    setEditando(null);
    setError('');
  }

  function validarValor() {
    if (!nombreVisible.trim()) {
      return 'Ingrese el nombre que se mostrará al usuario.';
    }

    if (
      esNumero(
        editando?.tipo
      ) &&
      (
        valor === '' ||
        !Number.isFinite(
          Number(
            String(valor)
              .replace(
                ',',
                '.'
              )
          )
        )
      )
    ) {
      return 'Ingrese un número válido.';
    }

    if (
      esJson(
        editando?.tipo
      )
    ) {
      try {
        JSON.parse(
          String(valor)
        );
      } catch {
        return 'El contenido no es un JSON válido.';
      }
    }

    return '';
  }

  async function guardar() {
    const errorValidacion =
      validarValor();

    if (errorValidacion) {
      setError(
        errorValidacion
      );
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const resultado =
        await actualizarConfiguracionExistenteApi(
          token,
          editando.clave,
          nombreVisible.trim(),
          valor,
          activo
        );

      setMensaje(
        `La configuración ${resultado.clave} fue actualizada y la caché fue limpiada.`
      );

      setEditando(null);

      /*
       * Vuelve a consultar la lista administrativa.
       * El backend ya limpió la caché antes de responder.
       */
      await api.reload();
    } catch (err) {
      setError(
        err.message ||
          'No fue posible actualizar la configuración.'
      );
    } finally {
      setGuardando(false);
    }
  }

  function campoValor() {
    if (
      esBooleano(
        editando?.tipo
      )
    ) {
      return (
        <TextField
          select
          label="Valor"
          value={
            normalizar(valor) ===
            'si'
              ? 'Sí'
              : normalizar(valor) ===
                  'true'
                ? 'Sí'
                : 'No'
          }
          onChange={(event) =>
            setValor(
              event.target.value
            )
          }
          fullWidth
        >
          <MenuItem value="Sí">
            Sí
          </MenuItem>

          <MenuItem value="No">
            No
          </MenuItem>
        </TextField>
      );
    }

    return (
      <TextField
        label="Valor"
        value={valor}
        onChange={(event) =>
          setValor(
            event.target.value
          )
        }
        type={
          esNumero(
            editando?.tipo
          )
            ? 'number'
            : esFecha(
                editando?.tipo
              )
              ? 'date'
              : 'text'
        }
        multiline={
          esTextoLargo(
            editando
          )
        }
        minRows={
          esTextoLargo(
            editando
          )
            ? 6
            : undefined
        }
        maxRows={
          esTextoLargo(
            editando
          )
            ? 18
            : undefined
        }
        InputLabelProps={
          esFecha(
            editando?.tipo
          )
            ? {
                shrink: true,
              }
            : undefined
        }
        fullWidth
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        subtitle="Modificación controlada de parámetros existentes"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        {mensaje && (
          <Alert severity="success">
            {mensaje}
          </Alert>
        )}

        <Alert severity="info">
          Esta pantalla solo permite modificar configuraciones existentes. No crea ni elimina parámetros. Cada guardado limpia inmediatamente la caché.
        </Alert>

        <TextField
          placeholder="Buscar por clave, descripción, tipo o valor"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(
              event.target.value
            )
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 680,
          }}
        />

        <Stack spacing={1.5}>
          {grupos.map(
            (
              grupo,
              indiceGrupo
            ) => (
              <Accordion
                key={grupo.nombre}
                defaultExpanded={
                  Boolean(
                    busqueda
                  ) ||
                  indiceGrupo === 0
                }
                disableGutters
                sx={{
                  border:
                    '1px solid',
                  borderColor:
                    'divider',
                  borderRadius:
                    '16px !important',
                  overflow:
                    'hidden',
                  boxShadow:
                    '0 8px 28px rgba(15,42,37,.06)',
                  '&:before': {
                    display:
                      'none',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreRounded />
                  }
                  sx={{
                    px: {
                      xs: 2,
                      md: 2.5,
                    },
                    minHeight: 68,
                    bgcolor:
                      'rgba(23,59,52,.035)',
                    '& .MuiAccordionSummary-content':
                      {
                        my: 1.4,
                      },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={1.2}
                    sx={{
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2.2,
                        display: 'grid',
                        placeItems:
                          'center',
                        bgcolor:
                          'primary.main',
                        color:
                          'primary.contrastText',
                        flexShrink: 0,
                      }}
                    >
                      <TuneRounded
                        fontSize="small"
                      />
                    </Box>

                    <Box
                      sx={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Typography
                        fontWeight={950}
                      >
                        {grupo.nombre}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {grupo.elementos.length}{' '}
                        {grupo.elementos.length ===
                        1
                          ? 'parámetro'
                          : 'parámetros'}
                      </Typography>
                    </Box>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails
                  sx={{
                    p: {
                      xs: 1.5,
                      md: 2,
                    },
                    bgcolor:
                      'background.paper',
                  }}
                >
                  <Stack spacing={1.25}>
                    {grupo.elementos.map(
                      (item) => (
                        <Paper
                          key={
                            item.clave
                          }
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius:
                              3,
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
                            <Box
                              sx={{
                                minWidth:
                                  0,
                                flex: 1,
                              }}
                            >
                              <Stack
                                direction="row"
                                gap={1}
                                flexWrap="wrap"
                                alignItems="center"
                              >
                                <Box>
                                  <Typography
                                    fontWeight={
                                      900
                                    }
                                    sx={{
                                      overflowWrap:
                                        'anywhere',
                                    }}
                                  >
                                    {item.nombreVisible ||
                                      item.clave}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      overflowWrap:
                                        'anywhere',
                                    }}
                                  >
                                    Clave técnica:{' '}
                                    {item.clave}
                                  </Typography>
                                </Box>

                                <Chip
                                  size="small"
                                  label={
                                    item.tipo
                                  }
                                  variant="outlined"
                                />

                                <Chip
                                  size="small"
                                  color={
                                    item.activo
                                      ? 'success'
                                      : 'default'
                                  }
                                  label={
                                    item.activo
                                      ? 'Activo'
                                      : 'Inactivo'
                                  }
                                />
                              </Stack>

                              {item.descripcion && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  mt={0.75}
                                >
                                  {
                                    item.descripcion
                                  }
                                </Typography>
                              )}

                              <Typography
                                variant="body2"
                                mt={1}
                                sx={{
                                  whiteSpace:
                                    'pre-wrap',
                                  overflowWrap:
                                    'anywhere',
                                  maxHeight:
                                    100,
                                  overflow:
                                    'hidden',
                                }}
                              >
                                {String(
                                  item.valor ??
                                    ''
                                ) ||
                                  '—'}
                              </Typography>
                            </Box>

                            <Button
                              variant="outlined"
                              startIcon={
                                <EditRounded />
                              }
                              onClick={() =>
                                abrirEdicion(
                                  item
                                )
                              }
                              sx={{
                                flexShrink:
                                  0,
                              }}
                            >
                              Editar
                            </Button>
                          </Stack>
                        </Paper>
                      )
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )
          )}

          {!filtrados.length && (
            <Alert severity="info">
              No se encontraron configuraciones.
            </Alert>
          )}
        </Stack>
      </Stack>

      <Dialog
        open={Boolean(editando)}
        onClose={cerrarEdicion}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Editar configuración
        </DialogTitle>

        <DialogContent dividers>
          {editando && (
            <Stack spacing={2.5}>
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <TextField
                label="Nombre visible"
                value={nombreVisible}
                onChange={(event) =>
                  setNombreVisible(
                    event.target.value
                  )
                }
                required
                helperText="Este es el nombre que verá el usuario en la página de configuraciones."
                fullWidth
              />

              <TextField
                label="Clave técnica"
                value={editando.clave}
                InputProps={{
                  readOnly: true,
                }}
                helperText="La clave es interna y no se puede modificar."
                fullWidth
              />

              <TextField
                label="Tipo"
                value={editando.tipo}
                InputProps={{
                  readOnly: true,
                }}
                fullWidth
              />

              {editando.descripcion && (
                <Alert severity="info">
                  {editando.descripcion}
                </Alert>
              )}

              {campoValor()}

              <FormControlLabel
                control={
                  <Switch
                    checked={activo}
                    onChange={(event) =>
                      setActivo(
                        event.target.checked
                      )
                    }
                  />
                }
                label={
                  activo
                    ? 'Configuración activa'
                    : 'Configuración inactiva'
                }
              />

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Al guardar, el backend actualizará Google Sheets, limpiará la caché y volverá a leer las configuraciones.
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={cerrarEdicion}
            disabled={guardando}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={
              <SaveRounded />
            }
            onClick={guardar}
            disabled={guardando}
          >
            {guardando
              ? 'Guardando...'
              : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
