import {
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { useState } from 'react';

import { obtenerEquipos } from '../api/equiposApi';
import { obtenerConfiguraciones } from '../api/configuracionesApi';

import { useApi } from '../hooks/useApi';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';

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
  };

  return prioridades[normalizar(rol)] || 99;
}

export default function Equipos() {
  const equiposApi = useApi(
    () => obtenerEquipos(),
    []
  );

  const configuracionApi = useApi(
    () => obtenerConfiguraciones(),
    []
  );

  const [selected, setSelected] = useState(null);

  const loading =
    equiposApi.loading ||
    configuracionApi.loading;

  const error =
    equiposApi.error ||
    configuracionApi.error;

  if (
    loading &&
    (!equiposApi.data ||
      !configuracionApi.data)
  ) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          equiposApi.reload();
          configuracionApi.reload();
        }}
      />
    );
  }

  const equipos =
    equiposApi.data?.items || [];

  const configuracion =
    configuracionApi.data || {};

  const anioRetiro =
    configuracion.anioRetiro || '';

  const tipoRetiro =
    configuracion.tipoRetiro || '';

  function obtenerNombreEquipo(equipo) {
    const nombre =
      normalizar(equipo?.nombre);

    if (nombre === 'direccion') {
      const datosRetiro = [
        anioRetiro,
        tipoRetiro,
      ]
        .filter(Boolean)
        .join(' - ');

      return datosRetiro
        ? `Dirección del Retiro ${datosRetiro}`
        : 'Dirección del Retiro';
    }

    return equipo?.nombre || '';
  }

  function esEquipoDireccion(equipo) {
    return (
      normalizar(equipo?.nombre) ===
      'direccion'
    );
  }

  function esEquipoMesa(equipo) {
    const nombre =
      normalizar(equipo?.nombre);

    return (
      nombre === 'mesa' ||
      nombre === 'mesas'
    );
  }

  function mostrarSoloCantidad(equipo) {
    return esEquipoMesa(equipo);
  }

  function mostrarSoloLider(equipo) {
    return (
      !esEquipoDireccion(equipo) &&
      !esEquipoMesa(equipo)
    );
  }

  function mostrarLiderYColider(equipo) {
    return esEquipoDireccion(equipo);
  }

  function ordenarIntegrantes(equipo) {
    const integrantes = [
      ...(equipo?.integrantes || []),
    ];

    const equipoEsMesa =
      esEquipoMesa(equipo);

    if (equipoEsMesa) {
      return integrantes.sort((a, b) => {
        const mesaA =
          Number(a.mesa) || 999;

        const mesaB =
          Number(b.mesa) || 999;

        if (mesaA !== mesaB) {
          return mesaA - mesaB;
        }

        const diferenciaRol =
          prioridadRol(a.rol) -
          prioridadRol(b.rol);

        if (diferenciaRol !== 0) {
          return diferenciaRol;
        }

        return String(
          a.nombre || ''
        ).localeCompare(
          String(b.nombre || ''),
          'es'
        );
      });
    }

    return integrantes.sort((a, b) => {
      const diferenciaRol =
        prioridadRol(a.rol) -
        prioridadRol(b.rol);

      if (diferenciaRol !== 0) {
        return diferenciaRol;
      }

      return String(
        a.nombre || ''
      ).localeCompare(
        String(b.nombre || ''),
        'es'
      );
    });
  }

  const integrantesOrdenados =
    ordenarIntegrantes(selected);

  return (
    <>
      <PageHeader
        eyebrow="Organización"
        title="Equipos"
        subtitle="Servidores agrupados por equipo"
        onRefresh={() => {
          equiposApi.reload();
          configuracionApi.reload();
        }}
        loading={loading}
      />

      <Grid container spacing={2}>
        {equipos.map((equipo) => (
          <Grid
            key={equipo.nombre}
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() =>
                  setSelected(equipo)
                }
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    fontWeight={850}
                  >
                    {obtenerNombreEquipo(
                      equipo
                    )}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    mb={2}
                  >
                    {equipo.cantidad}{' '}
                    {equipo.cantidad === 1
                      ? 'integrante'
                      : 'integrantes'}
                  </Typography>

                  {mostrarSoloCantidad(
                    equipo
                  ) && null}

                  {mostrarSoloLider(
                    equipo
                  ) && (
                    <Typography>
                      Líder:{' '}
                      {equipo.lider?.nombre ||
                        'Sin asignar'}
                    </Typography>
                  )}

                  {mostrarLiderYColider(
                    equipo
                  ) && (
                    <>
                      <Typography>
                        Líder:{' '}
                        {equipo.lider?.nombre ||
                          'Sin asignar'}
                      </Typography>

                      <Typography>
                        Colíder:{' '}
                        {equipo.colider?.nombre ||
                          'Sin asignar'}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={Boolean(selected)}
        onClose={() =>
          setSelected(null)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selected
            ? obtenerNombreEquipo(
                selected
              )
            : ''}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5}>
            {integrantesOrdenados.map(
              (integrante, indice) => {
                const esLider =
                  normalizar(
                    integrante.rol
                  ) === 'lider';

                const esColider =
                  normalizar(
                    integrante.rol
                  ) === 'colider';

                const equipoEsMesa =
                  esEquipoMesa(selected);

                const mesaActual =
                  integrante.mesa;

                const mesaAnterior =
                  indice > 0
                    ? integrantesOrdenados[
                        indice - 1
                      ]?.mesa
                    : null;

                const iniciaNuevaMesa =
                  equipoEsMesa &&
                  String(mesaActual) !==
                    String(mesaAnterior);

                return (
                  <Stack
                    key={`${integrante.id}-${integrante.mesa}-${integrante.rol}`}
                    spacing={1}
                  >
                    {iniciaNuevaMesa && (
                      <Typography
                        variant="subtitle1"
                        fontWeight={900}
                        color="primary.main"
                        sx={{
                          mt:
                            indice === 0
                              ? 0
                              : 1.5,
                          pb: 0.5,
                          borderBottom:
                            '2px solid',
                          borderColor:
                            'primary.light',
                        }}
                      >
                        Mesa {mesaActual}
                      </Typography>
                    )}

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
                      gap={2}
                      sx={{
                        px: 2,
                        py: 2,
                        borderRadius: 2.5,
                        border:
                          '1px solid',
                        borderColor: esLider
                          ? 'primary.main'
                          : esColider
                            ? 'secondary.main'
                            : 'divider',
                        bgcolor: esLider
                          ? 'primary.light'
                          : esColider
                            ? 'action.hover'
                            : 'background.paper',
                        boxShadow: esLider
                          ? '0 8px 24px rgba(47, 111, 94, 0.18)'
                          : 'none',
                      }}
                    >
                      <div>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={0.5}
                          flexWrap="wrap"
                        >
                          <Typography
                            fontWeight={850}
                          >
                            {integrante.nombre}
                          </Typography>

                          {esLider && (
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.35,
                                borderRadius: 999,
                                bgcolor:
                                  'primary.main',
                                color:
                                  'primary.contrastText',
                                fontWeight: 850,
                                letterSpacing: 0.4,
                              }}
                            >
                              LÍDER
                            </Typography>
                          )}

                          {esColider && (
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.35,
                                borderRadius: 999,
                                bgcolor:
                                  'secondary.main',
                                color:
                                  'secondary.contrastText',
                                fontWeight: 850,
                                letterSpacing: 0.4,
                              }}
                            >
                              COLÍDER
                            </Typography>
                          )}
                        </Stack>

                        {!equipoEsMesa && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Rol:{' '}
                            {integrante.rol ||
                              'Sin definir'}
                          </Typography>
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Celular:{' '}
                          {integrante.celular ||
                            'No registrado'}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Tema:{' '}
                          {integrante.temas
                            ?.length
                            ? integrante.temas.join(
                                ', '
                              )
                            : 'No aplica'}
                        </Typography>

                        {!equipoEsMesa &&
                          integrante.mesa && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Mesa:{' '}
                              {integrante.mesa}
                            </Typography>
                          )}
                      </div>

                      <Stack
                        alignItems={{
                          xs: 'flex-start',
                          sm: 'flex-end',
                        }}
                        spacing={0.5}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          Estado de pago
                        </Typography>

                        <StatusChip
                          value={
                            integrante.estadoPago
                          }
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                );
              }
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}