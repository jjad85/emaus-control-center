import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  EditRounded,
  GroupsRounded,
  PersonAddAltRounded,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { obtenerConfiguraciones } from '../api/configuracionesApi';
import {
  listarEquiposAdministrables,
  obtenerResumenAsignacionEquipos,
} from '../api/equiposAdministracionApi';
import { useApi } from '../hooks/useApi';

import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StatusChip from '../components/StatusChip';
import ProtectedButton from '../components/ProtectedButton';
import AvatarServidor from '../components/servidores/AvatarServidor';
import EquipoFormDialog from '../components/equipos/EquipoFormDialog';
import AsignarServidorEquipoDialog from '../components/equipos/AsignarServidorEquipoDialog';

function normalizar(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function prioridadRol(rol) {
  const prioridades = {
    lider: 1,
    colider: 2,
    equipo: 3,
    apoyo: 4,
  };

  return prioridades[normalizar(rol)] || 99;
}

function esDireccion(equipo) {
  return [
    'direccion',
    'equipo direccion',
    'equipo de direccion',
  ].includes(normalizar(equipo?.nombre));
}

function esMesa(equipo) {
  return [
    'mesa',
    'mesas',
    'equipo mesa',
    'equipo de mesa',
  ].includes(normalizar(equipo?.nombre));
}

function obtenerLideres(equipo) {
  return (equipo?.integrantes || []).filter(
    (integrante) =>
      normalizar(integrante.rol) === 'lider'
  );
}

function obtenerColideres(equipo) {
  return (equipo?.integrantes || []).filter(
    (integrante) =>
      normalizar(integrante.rol) === 'colider'
  );
}

export default function Equipos() {
  const { token } = useAuth();

  const equiposApi = useApi(
    () =>
      token
        ? listarEquiposAdministrables(token)
        : Promise.resolve([]),
    [token]
  );

  const configuracionApi = useApi(
    () => obtenerConfiguraciones(),
    []
  );

  const resumenApi = useApi(
    () =>
      token
        ? obtenerResumenAsignacionEquipos(token)
        : Promise.resolve({
            totalServidores: 0,
            conEquipoPrincipal: 0,
            sinEquipoPrincipal: 0,
            servidoresSinEquipoPrincipal: [],
          }),
    [token]
  );

  const [selected, setSelected] =
    useState(null);
  const [equipoEditar, setEquipoEditar] =
    useState(null);
  const [equipoAsignar, setEquipoAsignar] =
    useState(null);
  const [crearEquipo, setCrearEquipo] =
    useState(false);

  const loading =
    equiposApi.loading ||
    configuracionApi.loading ||
    resumenApi.loading;

  const error =
    equiposApi.error ||
    configuracionApi.error ||
    resumenApi.error;

  const equipos = equiposApi.data || [];
  const configuracion =
    configuracionApi.data || {};

  const resumen =
    resumenApi.data || {
      totalServidores: 0,
      conEquipoPrincipal: 0,
      sinEquipoPrincipal: 0,
      servidoresSinEquipoPrincipal: [],
    };

  const principales = useMemo(
    () =>
      equipos.filter(
        (equipo) =>
          normalizar(equipo.tipo) ===
          'principal'
      ),
    [equipos]
  );

  const apoyos = useMemo(
    () =>
      equipos.filter(
        (equipo) =>
          normalizar(equipo.tipo) ===
          'apoyo'
      ),
    [equipos]
  );

  const integrantesOrdenados = useMemo(
    () => {
      const integrantes = [
        ...(selected?.integrantes || []),
      ];

      return integrantes.sort((a, b) => {
        if (esMesa(selected)) {
          const mesaA =
            Number(a.mesa) || 9999;
          const mesaB =
            Number(b.mesa) || 9999;

          if (mesaA !== mesaB) {
            return mesaA - mesaB;
          }
        }

        const diferencia =
          prioridadRol(a.rol) -
          prioridadRol(b.rol);

        if (diferencia !== 0) {
          return diferencia;
        }

        return String(
          a.nombre || ''
        ).localeCompare(
          String(b.nombre || ''),
          'es'
        );
      });
    },
    [selected]
  );

  function nombreVisible(equipo) {
    return (
      equipo?.nombreVisible ||
      equipo?.nombre ||
      ''
    );
  }

  async function recargar() {
    await Promise.all([
      equiposApi.reload(),
      resumenApi.reload(),
    ]);
  }

  if (loading && !equiposApi.data) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          equiposApi.reload();
          configuracionApi.reload();
          resumenApi.reload();
          resumenApi.reload();
        }}
      />
    );
  }

  function TarjetaEquipo({ equipo }) {
    const lideres =
      obtenerLideres(equipo);
    const colideres =
      obtenerColideres(equipo);
    const esApoyo =
      normalizar(equipo.tipo) ===
      'apoyo';

    return (
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity:
            equipo.activo === false
              ? 0.68
              : 1,
        }}
      >
        <CardActionArea
          onClick={() =>
            setSelected(equipo)
          }
          sx={{
            flex: 1,
            alignItems: 'stretch',
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
                  >
                    {nombreVisible(equipo)}
                  </Typography>

                  <Stack
                    direction="row"
                    gap={0.75}
                    flexWrap="wrap"
                    mt={0.75}
                  >
                    <Chip
                      size="small"
                      color={
                        esApoyo
                          ? 'secondary'
                          : 'primary'
                      }
                      icon={
                        <GroupsRounded />
                      }
                      label={
                        esApoyo
                          ? 'Equipo de apoyo'
                          : 'Equipo principal'
                      }
                    />

                    <Chip
                      size="small"
                      variant="outlined"
                      color={
                        equipo.activo === false
                          ? 'default'
                          : 'success'
                      }
                      label={
                        equipo.activo === false
                          ? 'Inactivo'
                          : 'Activo'
                      }
                    />
                  </Stack>
                </Box>

                <Chip
                  size="small"
                  label={
                    equipo.cantidadIntegrantes ||
                    0
                  }
                />
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minHeight: 40 }}
              >
                {equipo.descripcion ||
                  'Sin descripción'}
              </Typography>

              <Divider />

              {esApoyo ? (
                <Stack spacing={1}>
                  <Typography
                    fontWeight={800}
                  >
                    Integrantes de apoyo
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={-0.75}
                    flexWrap="wrap"
                    minHeight={44}
                  >
                    {(equipo.integrantes || [])
                      .slice(0, 8)
                      .map(
                        (
                          integrante,
                          indice
                        ) => (
                          <AvatarServidor
                            key={`${equipo.id}-${integrante.id || integrante.nombre}-${indice}`}
                            servidor={
                              integrante
                            }
                            size={42}
                          />
                        )
                      )}
                  </Stack>
                </Stack>
              ) : esMesa(equipo) ? (
                <Typography
                  fontWeight={800}
                >
                  {lideres.length}{' '}
                  {lideres.length === 1
                    ? 'líder'
                    : 'líderes'}{' '}
                  · {colideres.length}{' '}
                  {colideres.length === 1
                    ? 'colíder'
                    : 'colíderes'}
                </Typography>
              ) : esDireccion(equipo) ? (
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <AvatarServidor
                      servidor={lideres[0]}
                      size={42}
                    />
                    <Typography>
                      Líder:{' '}
                      {lideres[0]?.nombre ||
                        'Sin asignar'}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <AvatarServidor
                      servidor={colideres[0]}
                      size={42}
                    />
                    <Typography>
                      Colíder:{' '}
                      {colideres[0]?.nombre ||
                        'Sin asignar'}
                    </Typography>
                  </Stack>
                </Stack>
              ) : (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <AvatarServidor
                    servidor={lideres[0]}
                    size={46}
                  />
                  <Typography>
                    Líder:{' '}
                    {lideres[0]?.nombre ||
                      'Sin asignar'}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </CardActionArea>

        <CardActions
          sx={{
            px: 2,
            pb: 2,
            pt: 0,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <ProtectedButton
            permiso="EDITAR_EQUIPOS"
            size="small"
            variant="outlined"
            startIcon={<EditRounded />}
            onClick={() =>
              setEquipoEditar(equipo)
            }
          >
            Editar
          </ProtectedButton>

          <ProtectedButton
            permiso="EDITAR_EQUIPOS"
            size="small"
            variant="contained"
            startIcon={
              <PersonAddAltRounded />
            }
            onClick={() =>
              setEquipoAsignar(equipo)
            }
            disabled={
              equipo.activo === false
            }
          >
            Asignar servidor
          </ProtectedButton>
        </CardActions>
      </Card>
    );
  }

  function SeccionEquipos({
    titulo,
    descripcion,
    items,
  }) {
    return (
      <Stack spacing={1.5}>
        <Box>
          <Typography
            variant="h5"
            fontWeight={900}
          >
            {titulo}
          </Typography>
          <Typography
            color="text.secondary"
          >
            {descripcion}
          </Typography>
        </Box>

        {items.length ? (
          <Grid container spacing={2}>
            {items.map(
              (equipo, indice) => (
                <Grid
                  key={`${equipo.tipo}-${equipo.id || equipo.nombre}-${indice}`}
                  size={{
                    xs: 12,
                    sm: 6,
                    lg: 4,
                  }}
                >
                  <TarjetaEquipo
                    equipo={equipo}
                  />
                </Grid>
              )
            )}
          </Grid>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography
                color="text.secondary"
              >
                No hay equipos registrados
                en esta categoría.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Organización"
        title="Equipos"
        subtitle={`${principales.length} principales · ${apoyos.length} de apoyo`}
        onRefresh={() => {
          equiposApi.reload();
          configuracionApi.reload();
        }}
        loading={loading}
      />

      <Grid
        container
        spacing={2}
        mb={3}
      >
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total de servidores
              </Typography>
              <Typography
                variant="h4"
                fontWeight={950}
              >
                {resumen.totalServidores}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Con equipo principal
              </Typography>
              <Typography
                variant="h4"
                fontWeight={950}
                color="success.main"
              >
                {resumen.conEquipoPrincipal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Sin equipo principal
              </Typography>
              <Typography
                variant="h4"
                fontWeight={950}
                color={
                  resumen.sinEquipoPrincipal
                    ? 'warning.main'
                    : 'success.main'
                }
              >
                {resumen.sinEquipoPrincipal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {resumen.sinEquipoPrincipal > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          <Typography fontWeight={850}>
            Hay {resumen.sinEquipoPrincipal}{' '}
            {resumen.sinEquipoPrincipal === 1
              ? 'servidor sin equipo principal'
              : 'servidores sin equipo principal'}
            .
          </Typography>

          <Stack
            direction="row"
            gap={0.75}
            flexWrap="wrap"
            mt={1}
          >
            {(
              resumen.servidoresSinEquipoPrincipal ||
              []
            ).map((servidor, indice) => (
              <Chip
                key={`sin-equipo-${servidor.id || servidor.nombre}-${indice}`}
                avatar={
                  <AvatarServidor
                    servidor={servidor}
                    size={28}
                    mostrarTooltip={false}
                  />
                }
                label={servidor.nombre}
                variant="outlined"
              />
            ))}
          </Stack>
        </Alert>
      )}

      <Stack
        direction="row"
        justifyContent="flex-end"
        mb={3}
      >
        <ProtectedButton
          permiso="EDITAR_EQUIPOS"
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() =>
            setCrearEquipo(true)
          }
        >
          Crear equipo
        </ProtectedButton>
      </Stack>

      <Stack spacing={4}>
        <SeccionEquipos
          titulo="Equipos principales"
          descripcion="Equipos permanentes del retiro. Cada servidor debe pertenecer a uno."
          items={principales}
        />

        <SeccionEquipos
          titulo="Equipos de apoyo"
          descripcion="Equipos para tareas o momentos específicos. Un servidor puede participar en varios."
          items={apoyos}
        />
      </Stack>

      <Dialog
        open={Boolean(selected)}
        onClose={() =>
          setSelected(null)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Stack spacing={0.75}>
            <Typography
              variant="h5"
              fontWeight={900}
            >
              {selected
                ? nombreVisible(selected)
                : ''}
            </Typography>

            <Stack
              direction="row"
              gap={0.75}
              flexWrap="wrap"
            >
              <Chip
                size="small"
                color={
                  normalizar(
                    selected?.tipo
                  ) === 'apoyo'
                    ? 'secondary'
                    : 'primary'
                }
                label={
                  normalizar(
                    selected?.tipo
                  ) === 'apoyo'
                    ? 'Equipo de apoyo'
                    : 'Equipo principal'
                }
              />

              <Chip
                size="small"
                variant="outlined"
                label={`${selected?.cantidadIntegrantes || 0} integrantes`}
              />
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.25}>
            {integrantesOrdenados.length ===
            0 ? (
              <Typography
                color="text.secondary"
              >
                Este equipo todavía no tiene
                servidores asignados.
              </Typography>
            ) : (
              integrantesOrdenados.map(
                (integrante, indice) => (
                  <Stack
                    key={`${selected?.id}-${integrante.id || integrante.nombre}-${integrante.mesa || ''}-${integrante.rol || ''}-${indice}`}
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    justifyContent="space-between"
                    alignItems={{
                      xs: 'flex-start',
                      sm: 'center',
                    }}
                    gap={2}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                    >
                      <AvatarServidor
                        servidor={integrante}
                        size={52}
                        destacado={[
                          'lider',
                          'colider',
                        ].includes(
                          normalizar(
                            integrante.rol
                          )
                        )}
                      />

                      <Box>
                        <Typography
                          fontWeight={850}
                        >
                          {integrante.nombre}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Rol:{' '}
                          {normalizar(
                            selected?.tipo
                          ) === 'apoyo'
                            ? 'Apoyo'
                            : integrante.rol ||
                              'Sin definir'}
                        </Typography>

                        {integrante.mesa && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Mesa:{' '}
                            {integrante.mesa}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <StatusChip
                      value={
                        integrante.estadoPago
                      }
                    />
                  </Stack>
                )
              )
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      <EquipoFormDialog
        open={crearEquipo}
        equipo={null}
        token={token}
        onClose={() =>
          setCrearEquipo(false)
        }
        onSaved={async () => {
          setCrearEquipo(false);
          await recargar();
        }}
      />

      <EquipoFormDialog
        open={Boolean(equipoEditar)}
        equipo={equipoEditar}
        token={token}
        onClose={() =>
          setEquipoEditar(null)
        }
        onSaved={async () => {
          setEquipoEditar(null);
          await recargar();
        }}
      />

      <AsignarServidorEquipoDialog
        open={Boolean(equipoAsignar)}
        equipo={equipoAsignar}
        token={token}
        onClose={() =>
          setEquipoAsignar(null)
        }
        onSaved={async () => {
          setEquipoAsignar(null);
          await recargar();
        }}
      />
    </>
  );
}
