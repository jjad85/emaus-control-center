import {
  CheckCircleRounded,
  GroupsRounded,
  PlayCircleRounded,
  ScheduleRounded,
  WarningAmberRounded,
} from '@mui/icons-material';

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useMemo } from 'react';

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function numero(valor, defecto = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : defecto;
}

function minutosDesdeHora(hora) {
  const [horas, minutos] = String(hora || '').split(':').map(Number);
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return 0;
  return horas * 60 + minutos;
}

function formatoHora(hora) {
  if (!hora) return '--:--';

  const [horas, minutos] = String(hora).split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(horas, minutos, 0, 0);

  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(fecha);
}

function KpiCard({
  icono,
  titulo,
  valor,
  detalle,
  color = 'primary',
  progreso,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 2.25,
          '&:last-child': {
            pb: 2.25,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          gap={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={850}
            >
              {titulo}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                mt: 0.25,
                overflowWrap: 'anywhere',
              }}
            >
              {valor}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
            >
              {detalle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {icono}
          </Box>
        </Stack>

        {typeof progreso === 'number' && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progreso))}
            color={color}
            sx={{
              mt: 2,
              height: 8,
              borderRadius: 99,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function BarraEstado({
  etiqueta,
  cantidad,
  total,
  color,
}) {
  const porcentaje = total
    ? Math.round((cantidad / total) * 100)
    : 0;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        gap={1}
        mb={0.75}
      >
        <Typography
          variant="body2"
          fontWeight={750}
        >
          {etiqueta}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {cantidad} · {porcentaje}%
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={porcentaje}
        color={color}
        sx={{
          height: 8,
          borderRadius: 99,
        }}
      />
    </Box>
  );
}

export default function DashboardMinutograma({
  actividades = [],
  dia,
}) {
  const datos = useMemo(() => {
    const delDia = actividades
      .filter(
        (item) =>
          item.dia === dia &&
          normalizar(item.estado) !== 'cancelada'
      )
      .sort(
        (a, b) =>
          minutosDesdeHora(a.horaInicio) -
          minutosDesdeHora(b.horaInicio)
      );

    const finalizadas = delDia.filter(
      (item) =>
        normalizar(item.estado) === 'finalizada'
    );

    const pendientes = delDia.filter(
      (item) =>
        normalizar(item.estado) === 'pendiente'
    );

    const actividadActual = delDia.find(
      (item) =>
        normalizar(item.estado) === 'en curso' ||
        normalizar(item.estado) === 'pausada'
    );

    const proxima =
      pendientes.find(
        (item) =>
          minutosDesdeHora(item.horaInicio) >=
          minutosDesdeHora(actividadActual?.horaInicio || '00:00')
      ) ||
      pendientes[0];

    const cumplimiento = delDia.length
      ? Math.round(
          (finalizadas.length / delDia.length) * 100
        )
      : 0;

    const minutosPlaneados = delDia.reduce(
      (acumulado, item) =>
        acumulado +
        numero(item.duracionMinutos, 0),
      0
    );

    const retrasos = finalizadas
      .filter(
        (item) =>
          numero(item.variacionMinutos, 0) < 0
      )
      .sort(
        (a, b) =>
          numero(a.variacionMinutos, 0) -
          numero(b.variacionMinutos, 0)
      )
      .slice(0, 4);

    return {
      delDia,
      finalizadas,
      pendientes,
      actividadActual,
      proxima,
      cumplimiento,
      minutosPlaneados,
      retrasos,
    };
  }, [actividades, dia]);

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: {
            xs: 1.5,
            md: 2.5,
          },
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography
              variant="overline"
              color="primary"
              fontWeight={900}
            >
              Centro de operaciones
            </Typography>

            <Typography
              variant="h5"
              fontWeight={900}
            >
              Resumen ejecutivo · {dia}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Estado general de las actividades programadas para el retiro.
            </Typography>
          </Box>

          <Chip
            variant="outlined"
            label={`${datos.finalizadas.length} de ${datos.delDia.length} finalizadas`}
            sx={{
              alignSelf: {
                xs: 'flex-start',
                md: 'center',
              },
            }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={1.5}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <KpiCard
            icono={<CheckCircleRounded />}
            titulo="Cumplimiento diario"
            valor={`${datos.cumplimiento}%`}
            detalle={`${datos.finalizadas.length} actividades completadas`}
            color="success"
            progreso={datos.cumplimiento}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <KpiCard
            icono={<PlayCircleRounded />}
            titulo="Actividad actual"
            valor={
              datos.actividadActual?.actividad ||
              'Sin actividad activa'
            }
            detalle={
              datos.actividadActual
                ? `${datos.actividadActual.responsable || 'Sin responsable'} · ${datos.actividadActual.lugar || 'Sin lugar'}`
                : datos.proxima
                  ? `Próxima: ${formatoHora(datos.proxima.horaInicio)} · ${datos.proxima.actividad}`
                  : 'No hay más actividades pendientes'
            }
            color={
              datos.actividadActual
                ? 'warning'
                : 'primary'
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            lg: 5,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2.25,
              borderRadius: 3,
              height: '100%',
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  Distribución del día
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Estado general de las actividades programadas.
                </Typography>
              </Box>

              <BarraEstado
                etiqueta="Finalizadas"
                cantidad={datos.finalizadas.length}
                total={datos.delDia.length}
                color="success"
              />

              <BarraEstado
                etiqueta="Pendientes"
                cantidad={datos.pendientes.length}
                total={datos.delDia.length}
                color="primary"
              />

              <Divider />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Minutos planeados
              </Typography>

              <Typography
                variant="h6"
                fontWeight={900}
              >
                {Math.round(datos.minutosPlaneados)}
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 7,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2.25,
              borderRadius: 3,
              height: '100%',
            }}
          >
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  Mayores retrasos
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Actividades finalizadas con mayor desviación negativa.
                </Typography>
              </Box>

              {datos.retrasos.length ? (
                datos.retrasos.map((item) => (
                  <Stack
                    key={item.id}
                    direction="row"
                    justifyContent="space-between"
                    gap={1.5}
                    alignItems="center"
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        fontWeight={800}
                        noWrap
                        title={item.actividad}
                      >
                        {item.actividad}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {item.responsable ||
                          'Sin responsable'}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      color="error"
                      icon={<WarningAmberRounded />}
                      label={`${Math.abs(
                        Math.round(
                          numero(item.variacionMinutos)
                        )
                      )} min`}
                    />
                  </Stack>
                ))
              ) : (
                <Stack
                  alignItems="center"
                  spacing={1}
                  py={2}
                >
                  <ScheduleRounded color="success" />

                  <Typography
                    color="text.secondary"
                    textAlign="center"
                  >
                    No hay retrasos registrados en las actividades finalizadas.
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper
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
          gap={1.5}
          alignItems={{
            md: 'center',
          }}
        >
          <Stack
            direction="row"
            gap={1.25}
            alignItems="center"
          >
            <GroupsRounded color="primary" />

            <Box>
              <Typography fontWeight={900}>
                Siguiente actividad
              </Typography>

              <Typography color="text.secondary">
                {datos.proxima
                  ? `${formatoHora(datos.proxima.horaInicio)} · ${datos.proxima.actividad}`
                  : 'No hay otra actividad pendiente para este día.'}
              </Typography>
            </Box>
          </Stack>

          {datos.proxima && (
            <Chip
              variant="outlined"
              label={`${datos.proxima.responsable || 'Sin responsable'} · ${datos.proxima.lugar || 'Sin lugar'}`}
              sx={{
                maxWidth: '100%',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
