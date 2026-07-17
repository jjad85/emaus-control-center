import {
  AccessTimeRounded,
  AssessmentRounded,
  EmojiEventsRounded,
  GroupsRounded,
  PersonRounded,
  ScheduleRounded,
  TrendingDownRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function esFinalizada(item) {
  return normalizar(item.estado) === 'finalizada';
}

function esCancelada(item) {
  return normalizar(item.estado) === 'cancelada';
}

function obtenerVariacion(item) {
  const variacion = numero(item.variacionMinutos);
  if (variacion !== 0) return variacion;

  const planeada = numero(item.duracionMinutos);
  const real = numero(item.duracionRealMinutos);
  return real > 0 ? planeada - real : 0;
}

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function formatoMinutos(valor) {
  const minutos = Math.round(Math.abs(numero(valor)));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (!horas) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

function colorBalance(valor) {
  if (valor > 0) return 'success';
  if (valor < 0) return 'error';
  return 'default';
}

function TarjetaKpi({ icono, titulo, valor, detalle, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={900}>
              {titulo}
            </Typography>
            <Typography variant="h4" fontWeight={950} sx={{ mt: 0.25 }}>
              {valor}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {detalle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
              flexShrink: 0,
            }}
          >
            {icono}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BarraComparativa({ etiqueta, valor, maximo, secundario, color = 'primary' }) {
  const ancho = maximo > 0 ? Math.max(3, (Math.abs(valor) / maximo) * 100) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" gap={1} mb={0.6}>
        <Typography variant="body2" fontWeight={800} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          {etiqueta || 'Sin definir'}
        </Typography>
        <Stack direction="row" gap={1} flexShrink={0}>
          {secundario && (
            <Typography variant="caption" color="text.secondary">
              {secundario}
            </Typography>
          )}
          <Typography variant="body2" fontWeight={900} color={`${color}.main`}>
            {valor}
          </Typography>
        </Stack>
      </Stack>
      <Box sx={{ height: 9, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.min(100, ancho)}%`, height: '100%', bgcolor: `${color}.main`, borderRadius: 999 }} />
      </Box>
    </Box>
  );
}

function TablaRanking({ titulo, icono, filas, tipo }) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          {icono}
          <Typography variant="h6" fontWeight={900}>{titulo}</Typography>
        </Stack>
        <Stack spacing={1.5}>
          {filas.length ? filas.map((fila, indice) => {
            const balance = fila.balance;
            return (
              <Paper key={`${fila.nombre}-${indice}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5}>
                  <Stack direction="row" alignItems="center" gap={1.25} minWidth={0}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: indice < 3 ? 'primary.main' : 'action.hover',
                        color: indice < 3 ? 'primary.contrastText' : 'text.secondary',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {indice + 1}
                    </Box>
                    <Box minWidth={0}>
                      <Typography fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>{fila.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fila.finalizadas}/{fila.total} finalizadas · {fila.cumplimiento}%
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    color={colorBalance(balance)}
                    variant={balance === 0 ? 'outlined' : 'filled'}
                    label={balance > 0 ? `+${formatoMinutos(balance)}` : balance < 0 ? `-${formatoMinutos(balance)}` : 'Sin variación'}
                  />
                </Stack>
                {tipo === 'cumplimiento' && (
                  <LinearProgress variant="determinate" value={fila.cumplimiento} sx={{ mt: 1.25, height: 7, borderRadius: 999 }} />
                )}
              </Paper>
            );
          }) : (
            <Alert severity="info">No hay información suficiente para construir este ranking.</Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function EstadisticasMinutograma({ actividades = [], dia = '' }) {
  const [alcance, setAlcance] = useState('dia');
  const [dimension, setDimension] = useState('equipo');

  const datos = useMemo(() => {
    const base = actividades.filter((item) => !esCancelada(item));
    return alcance === 'dia' && dia ? base.filter((item) => item.dia === dia) : base;
  }, [actividades, alcance, dia]);

  const resumen = useMemo(() => {
    const finalizadas = datos.filter(esFinalizada);
    const totalPlaneado = datos.reduce((suma, item) => suma + numero(item.duracionMinutos), 0);
    const totalReal = finalizadas.reduce((suma, item) => suma + numero(item.duracionRealMinutos), 0);
    const balance = finalizadas.reduce((suma, item) => suma + obtenerVariacion(item), 0);
    const aTiempo = finalizadas.filter((item) => obtenerVariacion(item) >= 0).length;
    const retrasadas = finalizadas.filter((item) => obtenerVariacion(item) < 0).length;

    return {
      total: datos.length,
      finalizadas: finalizadas.length,
      cumplimiento: porcentaje(finalizadas.length, datos.length),
      totalPlaneado,
      totalReal,
      balance,
      aTiempo,
      retrasadas,
      puntualidad: porcentaje(aTiempo, finalizadas.length),
    };
  }, [datos]);

  const agrupados = useMemo(() => {
    const mapa = new Map();
    datos.forEach((item) => {
      const nombre = String(item[dimension] || '').trim() || `Sin ${dimension}`;
      if (!mapa.has(nombre)) {
        mapa.set(nombre, { nombre, total: 0, finalizadas: 0, balance: 0, retrasos: 0, planeado: 0, real: 0 });
      }
      const grupo = mapa.get(nombre);
      grupo.total += 1;
      grupo.planeado += numero(item.duracionMinutos);
      if (esFinalizada(item)) {
        grupo.finalizadas += 1;
        grupo.balance += obtenerVariacion(item);
        grupo.real += numero(item.duracionRealMinutos);
        if (obtenerVariacion(item) < 0) grupo.retrasos += 1;
      }
    });

    return [...mapa.values()].map((grupo) => ({
      ...grupo,
      cumplimiento: porcentaje(grupo.finalizadas, grupo.total),
      puntualidad: porcentaje(grupo.finalizadas - grupo.retrasos, grupo.finalizadas),
    }));
  }, [datos, dimension]);

  const rankingCumplimiento = useMemo(
    () => [...agrupados].sort((a, b) => b.cumplimiento - a.cumplimiento || b.balance - a.balance).slice(0, 8),
    [agrupados]
  );

  const rankingBalance = useMemo(
    () => [...agrupados].filter((item) => item.finalizadas > 0).sort((a, b) => b.balance - a.balance).slice(0, 8),
    [agrupados]
  );

  const mayoresRetrasos = useMemo(
    () => datos
      .filter(esFinalizada)
      .map((item) => ({ ...item, variacionCalculada: obtenerVariacion(item) }))
      .filter((item) => item.variacionCalculada < 0)
      .sort((a, b) => a.variacionCalculada - b.variacionCalculada)
      .slice(0, 8),
    [datos]
  );

  const maximoRetraso = Math.max(1, ...mayoresRetrasos.map((item) => Math.abs(item.variacionCalculada)));

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={950}>Estadísticas operativas</Typography>
            <Typography color="text.secondary">Análisis de cumplimiento, puntualidad y consumo de tiempo.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
            <TextField select size="small" label="Alcance" value={alcance} onChange={(event) => setAlcance(event.target.value)} sx={{ minWidth: 155 }}>
              <MenuItem value="dia">Día seleccionado</MenuItem>
              <MenuItem value="retiro">Retiro completo</MenuItem>
            </TextField>
            <TextField select size="small" label="Agrupar por" value={dimension} onChange={(event) => setDimension(event.target.value)} sx={{ minWidth: 155 }}>
              <MenuItem value="equipo">Equipo</MenuItem>
              <MenuItem value="responsable">Responsable</MenuItem>
              <MenuItem value="lugar">Lugar</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <TarjetaKpi icono={<AssessmentRounded />} titulo="Cumplimiento" valor={`${resumen.cumplimiento}%`} detalle={`${resumen.finalizadas} de ${resumen.total} actividades`} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <TarjetaKpi icono={<AccessTimeRounded />} titulo="Puntualidad" valor={`${resumen.puntualidad}%`} detalle={`${resumen.aTiempo} actividades a tiempo`} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <TarjetaKpi
            icono={resumen.balance >= 0 ? <TrendingUpRounded /> : <TrendingDownRounded />}
            titulo="Balance de tiempo"
            valor={`${resumen.balance > 0 ? '+' : resumen.balance < 0 ? '-' : ''}${formatoMinutos(resumen.balance)}`}
            detalle={resumen.balance >= 0 ? 'Tiempo recuperado o disponible' : 'Retraso acumulado'}
            color={resumen.balance >= 0 ? 'success' : 'error'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <TarjetaKpi icono={<ScheduleRounded />} titulo="Tiempo ejecutado" valor={formatoMinutos(resumen.totalReal)} detalle={`${formatoMinutos(resumen.totalPlaneado)} planeados`} color="info" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <TablaRanking
            titulo={`Cumplimiento por ${dimension}`}
            icono={dimension === 'responsable' ? <PersonRounded color="primary" /> : <GroupsRounded color="primary" />}
            filas={rankingCumplimiento}
            tipo="cumplimiento"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <TablaRanking
            titulo="Mejor balance de tiempo"
            icono={<EmojiEventsRounded color="warning" />}
            filas={rankingBalance}
            tipo="balance"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
            <TrendingDownRounded color="error" />
            <Typography variant="h6" fontWeight={900}>Actividades con mayor retraso</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Solo se incluyen actividades finalizadas con duración real superior a la planeada.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {mayoresRetrasos.length ? (
            <Stack spacing={2}>
              {mayoresRetrasos.map((item) => (
                <BarraComparativa
                  key={item.id || `${item.dia}-${item.actividad}`}
                  etiqueta={item.actividad}
                  valor={Math.abs(item.variacionCalculada)}
                  maximo={maximoRetraso}
                  secundario={`${item.dia || ''}${item.equipo ? ` · ${item.equipo}` : ''}`}
                  color="error"
                />
              ))}
            </Stack>
          ) : (
            <Alert severity="success">No hay actividades finalizadas con retraso en el alcance seleccionado.</Alert>
          )}
        </CardContent>
      </Card>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography fontWeight={900}>Lectura rápida</Typography>
            <Typography variant="body2" color="text.secondary">
              {resumen.retrasadas > 0
                ? `${resumen.retrasadas} actividades finalizaron con retraso. Conviene revisar sus responsables, equipos y observaciones.`
                : 'Hasta ahora no se registran actividades finalizadas con retraso.'}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip label={`${resumen.aTiempo} a tiempo`} color="success" variant="outlined" />
            <Chip label={`${resumen.retrasadas} con retraso`} color={resumen.retrasadas ? 'error' : 'default'} variant="outlined" />
            <Chip label={`${resumen.total - resumen.finalizadas} pendientes`} variant="outlined" />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
