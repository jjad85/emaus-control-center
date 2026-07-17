import {
  AccessTimeRounded,
  CheckCircleRounded,
  GroupsRounded,
  InsightsRounded,
  PlayCircleRounded,
  ScheduleRounded,
  TrendingDownRounded,
  TrendingFlatRounded,
  TrendingUpRounded,
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

function formatoContador(segundos) {
  const valor = Math.max(0, Math.round(Math.abs(segundos || 0)));
  const horas = Math.floor(valor / 3600);
  const minutos = Math.floor((valor % 3600) / 60);
  const resto = valor % 60;
  return horas > 0
    ? `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
    : `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

function fechaComoMs(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor.getTime();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
}

function segundosTranscurridos(actividad, ahoraMs) {
  if (!actividad) return 0;
  const inicio = fechaComoMs(
    actividad.fechaHoraInicioReal ||
      actividad.fechaInicioReal ||
      actividad.inicioReal
  );
  if (!inicio) return 0;

  const estado = normalizar(actividad.estado);
  const fin = fechaComoMs(
    actividad.fechaHoraFinReal ||
      actividad.fechaFinReal ||
      actividad.finReal
  );
  const pausaActual = fechaComoMs(
    actividad.fechaHoraPausa ||
      actividad.fechaPausaActual ||
      actividad.pausaActual
  );
  const pausado = numero(
    actividad.tiempoPausadoSegundos || actividad.segundosPausados,
    0
  );

  const corte =
    estado === 'finalizada' && fin
      ? fin
      : estado === 'pausada' && pausaActual
        ? pausaActual
        : ahoraMs;

  return Math.max(0, (corte - inicio) / 1000 - pausado);
}

function colorEstadoTemporal(balance) {
  if (balance < -5) return 'error';
  if (balance < -1) return 'warning';
  if (balance > 1) return 'success';
  return 'info';
}

function KpiCard({ icono, titulo, valor, detalle, color = 'primary', progreso }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" justifyContent="space-between" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={850}>
              {titulo}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{ mt: 0.25, overflowWrap: 'anywhere' }}
            >
              {valor}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
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
            sx={{ mt: 2, height: 8, borderRadius: 99 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function BarraEstado({ etiqueta, cantidad, total, color }) {
  const porcentaje = total ? Math.round((cantidad / total) * 100) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" gap={1} mb={0.75}>
        <Typography variant="body2" fontWeight={750}>{etiqueta}</Typography>
        <Typography variant="body2" color="text.secondary">
          {cantidad} · {porcentaje}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={porcentaje}
        color={color}
        sx={{ height: 8, borderRadius: 99 }}
      />
    </Box>
  );
}

function FilaRanking({ posicion, nombre, finalizadas, total, balance }) {
  const cumplimiento = total ? Math.round((finalizadas / total) * 100) : 0;
  const color = colorEstadoTemporal(balance);
  return (
    <Stack direction="row" alignItems="center" gap={1.25}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 99,
          bgcolor: 'action.hover',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {posicion}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={800} noWrap title={nombre}>{nombre}</Typography>
        <Typography variant="caption" color="text.secondary">
          {finalizadas} de {total} finalizadas · {cumplimiento}%
        </Typography>
      </Box>
      <Chip
        size="small"
        color={color}
        variant="outlined"
        label={
          Math.abs(balance) <= 1
            ? 'En tiempo'
            : balance > 0
              ? `+${Math.round(balance)} min`
              : `${Math.round(balance)} min`
        }
      />
    </Stack>
  );
}

export default function DashboardMinutograma({ actividades = [], dia, ahoraMs = Date.now() }) {
  const datos = useMemo(() => {
    const delDia = actividades
      .filter((item) => item.dia === dia && normalizar(item.estado) !== 'cancelada')
      .sort((a, b) => minutosDesdeHora(a.horaInicio) - minutosDesdeHora(b.horaInicio));

    const finalizadas = delDia.filter((item) => normalizar(item.estado) === 'finalizada');
    const pendientes = delDia.filter((item) => normalizar(item.estado) === 'pendiente');
    const enCurso = delDia.find((item) => ['en curso', 'pausada'].includes(normalizar(item.estado)));
    const pausadas = delDia.filter((item) => normalizar(item.estado) === 'pausada');

    const balance = finalizadas.reduce(
      (acumulado, item) => acumulado + numero(item.variacionMinutos, 0),
      0
    );

    const cumplimiento = delDia.length
      ? Math.round((finalizadas.length / delDia.length) * 100)
      : 0;

    const segundos = segundosTranscurridos(enCurso, ahoraMs);
    const programados = numero(enCurso?.duracionMinutos, 0) * 60;
    const restantes = programados - segundos;
    const avanceActual = programados > 0
      ? Math.min(100, Math.max(0, (segundos / programados) * 100))
      : 0;

    const indiceActual = enCurso
      ? delDia.findIndex((item) => item.id === enCurso.id)
      : -1;
    const proxima = indiceActual >= 0
      ? delDia.slice(indiceActual + 1).find((item) => normalizar(item.estado) === 'pendiente')
      : delDia.find((item) => normalizar(item.estado) === 'pendiente');

    const minutosPlaneados = delDia.reduce(
      (acumulado, item) => acumulado + numero(item.duracionMinutos, 0),
      0
    );
    const minutosEjecutados = finalizadas.reduce(
      (acumulado, item) => acumulado + numero(item.duracionRealMinutos, item.duracionMinutos),
      0
    );

    const grupos = new Map();
    delDia.forEach((item) => {
      const nombre = String(item.equipo || 'Sin equipo').trim() || 'Sin equipo';
      if (!grupos.has(nombre)) {
        grupos.set(nombre, { nombre, total: 0, finalizadas: 0, balance: 0 });
      }
      const grupo = grupos.get(nombre);
      grupo.total += 1;
      if (normalizar(item.estado) === 'finalizada') {
        grupo.finalizadas += 1;
        grupo.balance += numero(item.variacionMinutos, 0);
      }
    });

    const ranking = Array.from(grupos.values())
      .sort((a, b) => {
        const cumplimientoA = a.total ? a.finalizadas / a.total : 0;
        const cumplimientoB = b.total ? b.finalizadas / b.total : 0;
        if (cumplimientoB !== cumplimientoA) return cumplimientoB - cumplimientoA;
        return b.balance - a.balance;
      })
      .slice(0, 5);

    const retrasos = finalizadas
      .filter((item) => numero(item.variacionMinutos, 0) < 0)
      .sort((a, b) => numero(a.variacionMinutos, 0) - numero(b.variacionMinutos, 0))
      .slice(0, 4);

    const actividadesRestantes = pendientes.length + (enCurso ? 1 : 0);
    const promedioVariacion = finalizadas.length ? balance / finalizadas.length : 0;
    const proyeccionBalance = balance + promedioVariacion * Math.max(0, actividadesRestantes - 1);
    const probabilidad = delDia.length === 0
      ? 0
      : Math.round(
          Math.max(
            5,
            Math.min(
              98,
              82 + cumplimiento * 0.12 + proyeccionBalance * 1.4 - pausadas.length * 8
            )
          )
        );

    return {
      delDia,
      finalizadas,
      pendientes,
      enCurso,
      pausadas,
      balance,
      cumplimiento,
      restantes,
      avanceActual,
      proxima,
      minutosPlaneados,
      minutosEjecutados,
      ranking,
      retrasos,
      probabilidad,
    };
  }, [actividades, dia, ahoraMs]);

  const balanceRedondeado = Math.round(datos.balance);
  const balanceColor = colorEstadoTemporal(datos.balance);
  const estadoActual = normalizar(datos.enCurso?.estado);

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: { xs: 1.5, md: 2.5 },
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={900}>
              Centro de operaciones
            </Typography>
            <Typography variant="h5" fontWeight={900}>Resumen ejecutivo · {dia}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Lectura en tiempo real de cumplimiento, ejecución y tendencia del cronograma.
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
            <Chip
              icon={<InsightsRounded />}
              color={datos.probabilidad >= 75 ? 'success' : datos.probabilidad >= 50 ? 'warning' : 'error'}
              label={`${datos.probabilidad}% probabilidad de terminar a tiempo`}
            />
            <Chip
              variant="outlined"
              label={`${datos.finalizadas.length} de ${datos.delDia.length} finalizadas`}
            />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            icono={<CheckCircleRounded />}
            titulo="Cumplimiento diario"
            valor={`${datos.cumplimiento}%`}
            detalle={`${datos.finalizadas.length} actividades completadas`}
            color="success"
            progreso={datos.cumplimiento}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            icono={
              Math.abs(balanceRedondeado) <= 1
                ? <TrendingFlatRounded />
                : balanceRedondeado > 0
                  ? <TrendingUpRounded />
                  : <TrendingDownRounded />
            }
            titulo="Balance acumulado"
            valor={
              Math.abs(balanceRedondeado) <= 1
                ? 'En tiempo'
                : balanceRedondeado > 0
                  ? `${balanceRedondeado} min a favor`
                  : `${Math.abs(balanceRedondeado)} min de retraso`
            }
            detalle="Suma de variaciones de actividades finalizadas"
            color={balanceColor}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            icono={<PlayCircleRounded />}
            titulo={estadoActual === 'pausada' ? 'Actividad pausada' : 'Actividad actual'}
            valor={datos.enCurso?.actividad || 'Sin actividad activa'}
            detalle={
              datos.enCurso
                ? `${datos.enCurso.responsable || 'Sin responsable'} · ${datos.enCurso.lugar || 'Sin lugar'}`
                : 'Esperando el inicio de una actividad'
            }
            color={!datos.enCurso ? 'primary' : estadoActual === 'pausada' ? 'info' : 'warning'}
            progreso={datos.avanceActual}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            icono={<AccessTimeRounded />}
            titulo={datos.restantes < 0 ? 'Tiempo excedido' : 'Tiempo restante'}
            valor={datos.enCurso ? formatoContador(datos.restantes) : '--:--'}
            detalle={
              datos.enCurso
                ? `${Math.round(datos.avanceActual)}% consumido · ${datos.enCurso.duracionMinutos} min planeados`
                : datos.proxima
                  ? `Próxima: ${datos.proxima.actividad}`
                  : 'No hay más actividades pendientes'
            }
            color={!datos.enCurso ? 'primary' : datos.restantes < 0 ? 'error' : 'info'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>Distribución del día</Typography>
                <Typography variant="body2" color="text.secondary">
                  Estado general de las actividades programadas.
                </Typography>
              </Box>
              <BarraEstado etiqueta="Finalizadas" cantidad={datos.finalizadas.length} total={datos.delDia.length} color="success" />
              <BarraEstado etiqueta="Pendientes" cantidad={datos.pendientes.length} total={datos.delDia.length} color="primary" />
              <BarraEstado etiqueta="En ejecución" cantidad={datos.enCurso ? 1 : 0} total={datos.delDia.length} color="warning" />
              <BarraEstado etiqueta="Pausadas" cantidad={datos.pausadas.length} total={datos.delDia.length} color="info" />
              <Divider />
              <Grid container spacing={1.25}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Minutos planeados</Typography>
                  <Typography variant="h6" fontWeight={900}>{Math.round(datos.minutosPlaneados)}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Minutos ejecutados</Typography>
                  <Typography variant="h6" fontWeight={900}>{Math.round(datos.minutosEjecutados)}</Typography>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>Desempeño por equipo</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ranking basado en cumplimiento y balance de tiempo.
                </Typography>
              </Box>
              {datos.ranking.length > 0 ? (
                datos.ranking.map((item, index) => (
                  <FilaRanking key={item.nombre} posicion={index + 1} {...item} />
                ))
              ) : (
                <Typography color="text.secondary">No hay equipos con actividades para este día.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={900}>Línea de tiempo resumida</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lectura rápida del orden y estado de las actividades de {dia}.
            </Typography>
            <Box sx={{ overflowX: 'auto', pb: 1, WebkitOverflowScrolling: 'touch' }}>
              <Stack direction="row" spacing={1.25} sx={{ minWidth: 'max-content' }}>
                {datos.delDia.map((item) => {
                  const estado = normalizar(item.estado);
                  const color =
                    estado === 'finalizada'
                      ? 'success'
                      : estado === 'en curso'
                        ? 'warning'
                        : estado === 'pausada'
                          ? 'info'
                          : 'default';
                  return (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{
                        width: 210,
                        p: 1.5,
                        borderRadius: 2.5,
                        borderTop: 4,
                        borderTopColor: color === 'default' ? 'divider' : `${color}.main`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatoHora(item.horaInicio)} · {item.duracionMinutos} min
                      </Typography>
                      <Typography fontWeight={850} sx={{ mt: 0.5, lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                        {item.actividad}
                      </Typography>
                      <Chip size="small" color={color} label={item.estado || 'Pendiente'} sx={{ mt: 1 }} />
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%' }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6" fontWeight={900}>Mayores retrasos</Typography>
                <Typography variant="body2" color="text.secondary">
                  Actividades finalizadas con mayor desviación negativa.
                </Typography>
              </Box>
              {datos.retrasos.length ? (
                datos.retrasos.map((item) => (
                  <Stack key={item.id} direction="row" justifyContent="space-between" gap={1.5} alignItems="center">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} noWrap title={item.actividad}>{item.actividad}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.responsable || 'Sin responsable'}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color="error"
                      icon={<WarningAmberRounded />}
                      label={`${Math.abs(Math.round(numero(item.variacionMinutos)))} min`}
                    />
                  </Stack>
                ))
              ) : (
                <Stack alignItems="center" spacing={1} py={2}>
                  <ScheduleRounded color="success" />
                  <Typography color="text.secondary" textAlign="center">
                    No hay retrasos registrados en las actividades finalizadas.
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} alignItems={{ md: 'center' }}>
          <Stack direction="row" gap={1.25} alignItems="center">
            <GroupsRounded color="primary" />
            <Box>
              <Typography fontWeight={900}>Siguiente actividad</Typography>
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
              sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
            />
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
