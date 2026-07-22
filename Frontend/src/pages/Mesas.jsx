import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Button,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import PersonAddAltRounded from '@mui/icons-material/PersonAddAltRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { obtenerMesas } from '../api/mesasApi';
import { useAuth } from '../auth/AuthContext';
import ProtectedButton from '../components/ProtectedButton';
import AsignarCaminantesMesaDialog from '../components/mesas/AsignarCaminantesMesaDialog';
import LiberarMesaDialog from '../components/mesas/LiberarMesaDialog';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import AvatarServidor from '../components/servidores/AvatarServidor';

function ServidorMesa({
  etiqueta,
  servidor,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
    >
      <AvatarServidor
        servidor={servidor}
        size={52}
      />

      <div>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={800}
        >
          {etiqueta}
        </Typography>

        <Typography fontWeight={850}>
          {servidor?.nombre ||
            'Sin asignar'}
        </Typography>
      </div>
    </Stack>
  );
}

function PersonaFueraDeRango({
  persona,
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
    >
      <AvatarServidor
        servidor={
          persona.tipoPersona ===
          'Servidor'
            ? persona
            : undefined
        }
        nombre={persona.nombre}
        fotoPerfilUrl={
          persona.fotoPerfilUrl
        }
        size={34}
      />

      <Box>
        <Typography
          variant="body2"
          fontWeight={800}
        >
          {persona.nombre}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          {persona.tipoPersona}
          {persona.rol
            ? ` · ${persona.rol}`
            : ''}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function Mesas() {
  const { token } = useAuth();

  const api = useApi(
    () => obtenerMesas(),
    []
  );

  const [selected, setSelected] =
    useState(null);

  const [mesaAsignar, setMesaAsignar] =
    useState(null);

  const [mesaLiberar, setMesaLiberar] =
    useState(null);

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

  const items =
    api.data?.items || [];

  const sincronizacion =
    api.data?.sincronizacion;

  return (
    <>
      <PageHeader
        eyebrow="Distribución"
        title="Mesas"
        subtitle={`${items.length} mesas configuradas`}
        onRefresh={api.reload}
        loading={api.loading}
      />

      {sincronizacion
        ?.requiereReubicacion && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          <AlertTitle>
            La cantidad de mesas fue
            reducida y existen asignaciones
            pendientes
          </AlertTitle>

          <Typography>
            El parámetro indica{' '}
            <strong>
              {
                sincronizacion
                  .numeroMesasConfigurado
              }{' '}
              mesas
            </strong>
            , pero todavía hay personas
            asignadas a{' '}
            <strong>
              {
                sincronizacion
                  .cantidadMesasFueraDeRango
              }{' '}
              mesas adicionales
            </strong>
            .
          </Typography>

          <Typography
            variant="body2"
            mt={1}
          >
            Reubica estas personas en una
            mesa entre la 1 y la{' '}
            {
              sincronizacion
                .numeroMesasConfigurado
            }
            , o aumenta nuevamente el
            parámetro.
          </Typography>

          <Stack
            spacing={1.5}
            mt={2}
          >
            {sincronizacion
              .mesasFueraDeRango
              .map((mesa) => (
                <Card
                  key={
                    mesa.numero
                  }
                  variant="outlined"
                >
                  <CardContent>
                    <Stack
                      direction={{
                        xs: 'column',
                        sm: 'row',
                      }}
                      justifyContent="space-between"
                      alignItems={{
                        sm: 'center',
                      }}
                      gap={1}
                      mb={1.5}
                    >
                      <Typography
                        fontWeight={900}
                      >
                        Mesa {mesa.numero}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Chip
                          size="small"
                          color="warning"
                          label={`${mesa.cantidadPersonas} personas`}
                        />

                        <ProtectedButton
                          permiso="ASIGNAR_MESA"
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={
                            <DeleteOutlineRounded />
                          }
                          onClick={() =>
                            setMesaLiberar(mesa)
                          }
                        >
                          Eliminar mesa
                        </ProtectedButton>
                      </Stack>
                    </Stack>

                    <Grid
                      container
                      spacing={1.5}
                    >
                      {[
                        ...mesa.servidores,
                        ...mesa.caminantes,
                      ].map(
                        (
                          persona,
                          indice
                        ) => (
                          <Grid
                            key={`${persona.tipoPersona}-${persona.id || persona.nombre}-${indice}`}
                            size={{
                              xs: 12,
                              sm: 6,
                            }}
                          >
                            <PersonaFueraDeRango
                              persona={
                                persona
                              }
                            />
                          </Grid>
                        )
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        </Alert>
      )}

      {sincronizacion?.sincronizada && (
        <Alert
          severity="success"
          variant="outlined"
          sx={{ mb: 3 }}
        >
          La cantidad de mesas está
          sincronizada con el parámetro del
          retiro.
        </Alert>
      )}

      <Grid container spacing={2}>
        {items.map((mesa) => (
          <Grid
            key={mesa.numero}
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <Card
              sx={{
                height: '100%',
              }}
            >
              <CardActionArea
                onClick={() =>
                  setSelected(mesa)
                }
                sx={{
                  height: '100%',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    mb={2}
                  >
                    Mesa {mesa.numero}
                  </Typography>

                  <Stack spacing={1.5}>
                    <ServidorMesa
                      etiqueta="Líder"
                      servidor={
                        mesa.lider
                      }
                    />

                    <ServidorMesa
                      etiqueta="Colíder"
                      servidor={
                        mesa.colider
                      }
                    />
                  </Stack>

                  <Typography mt={2.5}>
                    {
                      mesa.cantidadCaminantes
                    }{' '}
                    de {mesa.capacidad}{' '}
                    caminantes
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      mesa.porcentajeOcupacion ||
                        0,
                      100
                    )}
                    sx={{ my: 1 }}
                  />

                  <Typography
                    variant="body2"
                  >
                    Cartas:{' '}
                    {mesa.cartas
                      ?.porcentajeCumplimiento ||
                      0}
                    % · Fotos:{' '}
                    {mesa.fotos
                      ?.porcentajeCumplimiento ||
                      0}
                    %
                  </Typography>

                  <ProtectedButton
                    permiso="ASIGNAR_MESA"
                    size="small"
                    variant="contained"
                    startIcon={
                      <PersonAddAltRounded />
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      setMesaAsignar(mesa);
                    }}
                    disabled={
                      mesa.cuposDisponibles <= 0
                    }
                    sx={{ mt: 2 }}
                  >
                    Asignar caminantes
                  </ProtectedButton>
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
        maxWidth="lg"
      >
        <DialogTitle>
          <Typography
            variant="h5"
            fontWeight={900}
          >
            Mesa {selected?.numero}
          </Typography>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row',
            }}
            spacing={3}
            mt={2}
          >
            <ServidorMesa
              etiqueta="Líder"
              servidor={
                selected?.lider
              }
            />

            <ServidorMesa
              etiqueta="Colíder"
              servidor={
                selected?.colider
              }
            />
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            {selected?.caminantes?.map(
              (caminante) => (
                <Stack
                  key={caminante.id}
                  direction={{
                    xs: 'column',
                    md: 'row',
                  }}
                  justifyContent="space-between"
                  alignItems={{
                    md: 'center',
                  }}
                  gap={1}
                  sx={{
                    borderBottom:
                      '1px solid',
                    borderColor:
                      'divider',
                    py: 1,
                  }}
                >
                  <Typography
                    fontWeight={750}
                  >
                    {caminante.nombre}
                  </Typography>

                  <Typography>
                    Habitación:{' '}
                    {caminante.habitacion ||
                      '—'}
                  </Typography>

                  <StatusChip
                    value={
                      caminante.estadoPago
                    }
                  />

                  <StatusChip
                    value={
                      caminante.entregables
                        ?.carta
                    }
                  />

                  <StatusChip
                    value={
                      caminante.entregables
                        ?.foto
                    }
                  />
                </Stack>
              )
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    
      <AsignarCaminantesMesaDialog
        open={Boolean(mesaAsignar)}
        mesa={mesaAsignar}
        token={token}
        onClose={() =>
          setMesaAsignar(null)
        }
        onSaved={async () => {
          setMesaAsignar(null);
          await api.reload();
        }}
      />

      <LiberarMesaDialog
        open={Boolean(mesaLiberar)}
        mesa={mesaLiberar}
        token={token}
        onClose={() =>
          setMesaLiberar(null)
        }
        onSaved={async () => {
          setMesaLiberar(null);
          await api.reload();
        }}
      />

</>
  );
}
