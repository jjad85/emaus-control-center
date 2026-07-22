import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  GroupsRounded,
  StarRounded,
} from '@mui/icons-material';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  guardarAsignacionEquiposServidor,
  obtenerAsignacionEquiposServidor,
} from '../../api/equiposAdministracionApi';
import AvatarServidor from '../servidores/AvatarServidor';

function normalizarEquipos(equipos = []) {
  const vistos = new Set();

  return equipos
    .filter((equipo) => {
      const id = String(
        equipo?.id || ''
      ).trim();

      if (!id || vistos.has(id)) {
        return false;
      }

      vistos.add(id);
      return true;
    })
    .map((equipo) => ({
      ...equipo,
      id: String(equipo.id),
    }));
}

export default function GestionEquiposServidorDialog({
  open,
  servidor,
  token,
  onClose,
  onSaved,
}) {
  const [datos, setDatos] =
    useState(null);
  const [principalId, setPrincipalId] =
    useState('');
  const [rolPrincipal, setRolPrincipal] =
    useState('');
  const [mesaPrincipal, setMesaPrincipal] =
    useState('');
  const [apoyoIds, setApoyoIds] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open || !servidor?.id || !token) {
      return;
    }

    let activo = true;

    setDatos(null);
    setPrincipalId('');
    setRolPrincipal('');
    setMesaPrincipal('');
    setApoyoIds([]);
    setLoading(true);
    setError('');

    obtenerAsignacionEquiposServidor(
      token,
      servidor.id
    )
      .then((respuesta) => {
        if (!activo) return;

        const principales =
          normalizarEquipos(
            respuesta?.equiposPrincipales
          );

        const apoyos =
          normalizarEquipos(
            respuesta?.equiposApoyo
          );

        setDatos({
          ...respuesta,
          equiposPrincipales: principales,
          equiposApoyo: apoyos,
        });

        const principalSeleccionado =
          respuesta?.equipoPrincipalId
            ? String(
                respuesta.equipoPrincipalId
              )
            : '';

        setPrincipalId(
          principalSeleccionado
        );

        const equipoActual =
          principales.find(
            (equipo) =>
              String(equipo.id) ===
              principalSeleccionado
          );

        const rolActual =
          String(
            respuesta?.rolEquipoPrincipal ||
            ''
          );

        const rolActualDisponible =
          (
            equipoActual?.rolesDisponibles ||
            []
          ).some(
            (rol) =>
              rol
                .normalize('NFD')
                .replace(
                  /[\u0300-\u036f]/g,
                  ''
                )
                .toLowerCase() ===
              rolActual
                .normalize('NFD')
                .replace(
                  /[\u0300-\u036f]/g,
                  ''
                )
                .toLowerCase()
          );

        setRolPrincipal(
          rolActualDisponible
            ? rolActual
            : (
                equipoActual
                  ?.rolesDisponibles ||
                []
              )[0] || ''
        );

        setMesaPrincipal(
          respuesta?.mesaPrincipal
            ? String(respuesta.mesaPrincipal)
            : ''
        );

        setApoyoIds(
          Array.from(
            new Set(
              (
                respuesta?.equiposApoyoIds ||
                []
              )
                .map(String)
                .filter(Boolean)
            )
          )
        );
      })
      .catch((err) => {
        if (activo) {
          setError(
            err?.message ||
              'No fue posible consultar los equipos.'
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
  }, [open, servidor?.id, token]);

  const equipoPrincipalActual =
    useMemo(
      () =>
        (
          datos?.equiposPrincipales ||
          []
        ).find(
          (equipo) =>
            String(equipo.id) ===
            String(principalId)
        ) || null,
      [
        datos?.equiposPrincipales,
        principalId,
      ]
    );

  const rolesDisponiblesPrincipal =
    useMemo(
      () =>
        equipoPrincipalActual
          ?.rolesDisponibles || [],
      [equipoPrincipalActual]
    );

  const esEquipoMesa =
    useMemo(() => {
      const nombre = String(
        equipoPrincipalActual?.nombre || ''
      )
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return [
        'mesa',
        'mesas',
        'equipo mesa',
        'equipo de mesa',
      ].includes(nombre);
    }, [equipoPrincipalActual]);

  const mesasDisponiblesPorRol =
    useMemo(() => {
      if (!esEquipoMesa || !rolPrincipal) {
        return [];
      }

      return (datos?.mesasDisponibles || [])
        .filter((mesa) =>
          (mesa.rolesDisponibles || []).some(
            (rol) =>
              String(rol)
                .normalize('NFD')
                .replace(
                  /[\u0300-\u036f]/g,
                  ''
                )
                .toLowerCase() ===
              String(rolPrincipal)
                .normalize('NFD')
                .replace(
                  /[\u0300-\u036f]/g,
                  ''
                )
                .toLowerCase()
          )
        )
        .sort(
          (a, b) =>
            Number(a.numero) -
            Number(b.numero)
        );
    }, [
      datos?.mesasDisponibles,
      esEquipoMesa,
      rolPrincipal,
    ]);

  const apoyosSeleccionados =
    useMemo(
      () =>
        (datos?.equiposApoyo || []).filter(
          (equipo) =>
            apoyoIds.includes(
              String(equipo.id)
            )
        ),
      [datos?.equiposApoyo, apoyoIds]
    );

  function cambiarEquipoPrincipal(
    equipoId
  ) {
    const id = String(equipoId);
    setPrincipalId(id);

    const equipo = (
      datos?.equiposPrincipales || []
    ).find(
      (item) =>
        String(item.id) === id
    );

    setRolPrincipal(
      equipo?.rolesDisponibles?.[0] ||
      ''
    );
    setMesaPrincipal('');
  }

  function cambiarRolPrincipal(
    nuevoRol
  ) {
    setRolPrincipal(
      String(nuevoRol)
    );
    setMesaPrincipal('');
  }

  function cambiarEquipoApoyo(
    equipoId
  ) {
    const id = String(equipoId);

    setApoyoIds((actuales) =>
      actuales.includes(id)
        ? actuales.filter(
            (actual) => actual !== id
          )
        : [...actuales, id]
    );
  }

  async function guardar() {
    if (!principalId) {
      setError(
        'Debe seleccionar un equipo principal.'
      );
      return;
    }

    if (!rolPrincipal) {
      setError(
        'Debe seleccionar el rol dentro del equipo principal.'
      );
      return;
    }

    if (esEquipoMesa && !mesaPrincipal) {
      setError(
        'Debe seleccionar una mesa disponible para ese rol.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const respuesta =
        await guardarAsignacionEquiposServidor(
          token,
          servidor.id,
          principalId,
          equipoPrincipalActual?.nombre || '',
          rolPrincipal,
          mesaPrincipal,
          apoyoIds
        );

      if (onSaved) {
        await onSaved(respuesta);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'No fue posible guardar los equipos.'
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
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        Equipos del servidor
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <AvatarServidor
              servidor={servidor}
              size={66}
              mostrarTooltip={false}
            />

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight={900}
              >
                {servidor?.nombre}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Un equipo principal obligatorio y
                equipos de apoyo opcionales.
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {loading ? (
            <Stack
              alignItems="center"
              py={5}
              spacing={1.5}
            >
              <CircularProgress />
              <Typography
                color="text.secondary"
              >
                Consultando equipos...
              </Typography>
            </Stack>
          ) : (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                }}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <StarRounded
                      color="primary"
                    />
                    <Box>
                      <Typography
                        fontWeight={900}
                      >
                        Equipo principal
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Es el equipo permanente al
                        que pertenece el servidor.
                      </Typography>
                    </Box>
                  </Stack>

                  <FormControl
                    fullWidth
                    required
                    error={!principalId}
                  >
                    <InputLabel
                      id="equipo-principal-label"
                    >
                      Seleccione un equipo principal
                    </InputLabel>

                    <Select
                      labelId="equipo-principal-label"
                      value={principalId}
                      label="Seleccione un equipo principal"
                      onChange={(event) =>
                        cambiarEquipoPrincipal(
                          event.target.value
                        )
                      }
                    >
                      {(datos
                        ?.equiposPrincipales ||
                        []
                      ).map(
                        (equipo, indice) => (
                          <MenuItem
                            key={`principal-${equipo.id}-${indice}`}
                            value={String(
                              equipo.id
                            )}
                          >
                            {equipo.nombreVisible ||
                              equipo.nombre}
                          </MenuItem>
                        )
                      )}
                    </Select>

                    {!principalId && (
                      <FormHelperText>
                        Este campo es obligatorio.
                      </FormHelperText>
                    )}
                  </FormControl>


                  {principalId && (
                    <FormControl
                      fullWidth
                      required
                      error={!rolPrincipal}
                    >
                      <InputLabel
                        id="rol-equipo-principal-label"
                      >
                        Rol en el equipo principal
                      </InputLabel>

                      <Select
                        labelId="rol-equipo-principal-label"
                        value={rolPrincipal}
                        label="Rol en el equipo principal"
                        onChange={(event) =>
                          cambiarRolPrincipal(
                            event.target.value
                          )
                        }
                      >
                        {rolesDisponiblesPrincipal.map(
                          (rol, indice) => (
                            <MenuItem
                              key={`rol-principal-${rol}-${indice}`}
                              value={rol}
                            >
                              {rol}
                            </MenuItem>
                          )
                        )}
                      </Select>

                      {!rolPrincipal && (
                        <FormHelperText>
                          Seleccione un rol permitido.
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}

                  {esEquipoMesa &&
                    rolPrincipal && (
                    <FormControl
                      fullWidth
                      required
                      error={!mesaPrincipal}
                    >
                      <InputLabel
                        id="mesa-principal-label"
                      >
                        Mesa disponible para {rolPrincipal}
                      </InputLabel>

                      <Select
                        labelId="mesa-principal-label"
                        value={mesaPrincipal}
                        label={`Mesa disponible para ${rolPrincipal}`}
                        onChange={(event) =>
                          setMesaPrincipal(
                            String(
                              event.target.value
                            )
                          )
                        }
                      >
                        {mesasDisponiblesPorRol.map(
                          (mesa) => (
                            <MenuItem
                              key={`mesa-${mesa.numero}-${rolPrincipal}`}
                              value={String(
                                mesa.numero
                              )}
                            >
                              Mesa {mesa.numero}
                            </MenuItem>
                          )
                        )}
                      </Select>

                      {!mesaPrincipal && (
                        <FormHelperText>
                          {mesasDisponiblesPorRol.length
                            ? `Seleccione una mesa que no tenga ${rolPrincipal.toLowerCase()}.`
                            : `No hay mesas disponibles para el rol ${rolPrincipal}.`}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}

                  {equipoPrincipalActual && (
                    <Alert
                      severity={
                        rolesDisponiblesPrincipal.length
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {(() => {
                        const nombre =
                          equipoPrincipalActual.nombre
                            ?.normalize('NFD')
                            .replace(
                              /[\u0300-\u036f]/g,
                              ''
                            )
                            .toLowerCase();

                        if (
                          nombre === 'mesa' ||
                          nombre === 'mesas' ||
                          nombre ===
                            'equipo de mesa'
                        ) {
                          return 'El equipo Mesa puede tener varios líderes y colíderes en total, pero cada número de mesa solo puede tener un Líder y un Colíder.';
                        }

                        if (
                          nombre === 'direccion' ||
                          nombre ===
                            'equipo de direccion'
                        ) {
                          return 'Dirección solo admite los roles Líder y Colíder, uno de cada uno.';
                        }

                        return 'Este equipo debe tener un Líder. Los demás integrantes se asignan con el rol Equipo.';
                      })()}
                    </Alert>
                  )}

                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                }}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <GroupsRounded
                      color="secondary"
                    />
                    <Box>
                      <Typography
                        fontWeight={900}
                      >
                        Equipos de apoyo
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Tareas o servicios
                        adicionales durante momentos
                        específicos del retiro.
                      </Typography>
                    </Box>
                  </Stack>

                  {(datos?.equiposApoyo || [])
                    .length === 0 ? (
                    <Alert severity="info">
                      No hay equipos de apoyo
                      activos.
                    </Alert>
                  ) : (
                    <Stack spacing={0.75}>
                      {(datos?.equiposApoyo || []).map(
                        (equipo, indice) => {
                          const seleccionado =
                            apoyoIds.includes(
                              String(equipo.id)
                            );

                          return (
                            <Paper
                              key={`apoyo-${equipo.id}-${indice}`}
                              variant="outlined"
                              sx={{
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 2,
                                borderColor:
                                  seleccionado
                                    ? 'secondary.main'
                                    : 'divider',
                                bgcolor:
                                  seleccionado
                                    ? 'action.selected'
                                    : 'transparent',
                              }}
                            >
                              <FormControlLabel
                                sx={{
                                  m: 0,
                                  width: '100%',
                                  alignItems:
                                    'flex-start',
                                }}
                                control={
                                  <Checkbox
                                    checked={
                                      seleccionado
                                    }
                                    onChange={() =>
                                      cambiarEquipoApoyo(
                                        equipo.id
                                      )
                                    }
                                    color="secondary"
                                  />
                                }
                                label={
                                  <Box
                                    sx={{
                                      pt: 0.75,
                                    }}
                                  >
                                    <Typography
                                      fontWeight={850}
                                    >
                                      {equipo.nombreVisible ||
                                        equipo.nombre}
                                    </Typography>

                                    <Chip
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                      label="Rol: Apoyo"
                                      sx={{ mt: 0.5 }}
                                    />

                                    {equipo.descripcion && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {
                                          equipo.descripcion
                                        }
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </Paper>
                          );
                        }
                      )}
                    </Stack>
                  )}

                  {apoyosSeleccionados.length >
                    0 && (
                    <>
                      <Divider />

                      <Stack
                        direction="row"
                        gap={0.75}
                        flexWrap="wrap"
                      >
                        {apoyosSeleccionados.map(
                          (equipo, indice) => (
                            <Chip
                              key={`seleccionado-${equipo.id}-${indice}`}
                              color="secondary"
                              variant="outlined"
                              label={
                                equipo.nombreVisible ||
                                equipo.nombre
                              }
                            />
                          )
                        )}
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          apoyosSeleccionados.length
                        }{' '}
                        {apoyosSeleccionados.length ===
                        1
                          ? 'equipo de apoyo seleccionado'
                          : 'equipos de apoyo seleccionados'}
                        .
                      </Typography>
                    </>
                  )}
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
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
            !principalId ||
            !rolPrincipal ||
            (esEquipoMesa &&
              !mesaPrincipal)
          }
        >
          {saving
            ? 'Guardando...'
            : 'Guardar equipos'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
