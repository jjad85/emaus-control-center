import {
  AddRounded,
  AssessmentRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  NotificationsActiveRounded,
  NotificationsOffRounded,
  FullscreenRounded,
  FullscreenExitRounded,
  VolumeUpRounded,
  VolumeOffRounded,
  RecordVoiceOverRounded,
  SettingsRounded,
  EditRounded,
  LocationOnRounded,
  PersonRounded,
  PauseRounded,
  PlayArrowRounded,
  ReplayRounded,
  ScheduleRounded,
  StopCircleRounded,
  TimelineRounded,
  TrendingDownRounded,
  TrendingFlatRounded,
  TrendingUpRounded,
  ViewListRounded,
} from '@mui/icons-material';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import { useEffect, useMemo, useState } from 'react';

import {
  editarActividadMinutogramaApi,
  finalizarActividadMinutogramaApi,
  iniciarActividadMinutogramaApi,
  pausarActividadMinutogramaApi,
  reanudarActividadMinutogramaApi,
  obtenerMinutograma,
  registrarActividadMinutogramaApi,
  registrarAlertaMinutogramaApi,
} from '../api/minutogramaApi';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import DashboardMinutograma from '../components/minutograma/DashboardMinutograma';
import EstadisticasMinutograma from '../components/minutograma/EstadisticasMinutograma';
console.log("MINUTOGRAMA");
const DIAS = ['Viernes', 'Sábado', 'Domingo'];
const ESTADOS = ['Pendiente', 'En curso', 'Pausada', 'Finalizada', 'Cancelada'];
const PRIORIDADES = ['Alta', 'Media', 'Baja'];

const FORM_INICIAL = {
  orden: '',
  dia: 'Viernes',
  horaInicio: '13:00',
  duracionMinutos: 30,
  actividad: '',
  responsable: '',
  equipo: '',
  lugar: '',
  estado: 'Pendiente',
  prioridad: 'Media',
  observaciones: '',
};

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function minutosDesdeHora(hora) {
  const partes = String(hora || '').split(':').map(Number);
  if (partes.length !== 2 || partes.some(Number.isNaN)) return 0;
  return partes[0] * 60 + partes[1];
}

function formatoHora(hora) {
  if (!hora) return '';
  const [h, m] = String(hora).split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(fecha);
}

function formatoContador(segundos) {
  const valor = Math.abs(Math.round(segundos));
  const horas = Math.floor(valor / 3600);
  const minutos = Math.floor((valor % 3600) / 60);
  const resto = valor % 60;
  return horas > 0
    ? `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
    : `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}


const CLAVE_CONFIG_ALERTAS = 'emaus.minutograma.alertas.v1';
const DURACION_MINIMA_ALERTAS = 15;

const CONFIG_ALERTAS_INICIAL = {
  alertasActivas: true,
  sonido: true,
  voz: true,
  vibracion: true,
  alerta50: true,
  alerta75: true,
  alerta5Min: true,
  alertaAgotado: true,
};

function leerConfiguracionAlertas() {
  try {
    const guardada = window.localStorage.getItem(CLAVE_CONFIG_ALERTAS);
    return guardada
      ? { ...CONFIG_ALERTAS_INICIAL, ...JSON.parse(guardada) }
      : CONFIG_ALERTAS_INICIAL;
  } catch {
    return CONFIG_ALERTAS_INICIAL;
  }
}

function parsearAlertasEmitidas(valor) {
  if (Array.isArray(valor)) return valor;
  return String(valor || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function calcularEstadoTemporal(actividad, ahoraMs) {
  if (!actividad) {
    return {
      transcurridos: 0,
      programados: 0,
      restantes: 0,
      avance: 0,
      porcentaje: 0,
    };
  }

  const transcurridos = obtenerSegundosTranscurridos(actividad, ahoraMs);
  const programados = Math.max(0, Number(actividad.duracionMinutos || 0) * 60);
  const restantes = programados - transcurridos;
  const porcentaje = programados > 0 ? (transcurridos / programados) * 100 : 0;

  return {
    transcurridos,
    programados,
    restantes,
    porcentaje,
    avance: Math.min(100, Math.max(0, porcentaje)),
  };
}

function obtenerNivelVisual(porcentaje, restantes) {
  if (restantes <= 0) return 'error';
  if (restantes <= 300) return 'warning';
  if (porcentaje >= 75) return 'warning';
  if (porcentaje >= 50) return 'info';
  return 'success';
}

function emitirSonido(tipo) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const contexto = new AudioContextClass();
    const frecuencias = {
      '50': [660],
      '75': [660, 760],
      '5MIN': [700, 820, 940],
      AGOTADO: [360, 300, 240],
    }[tipo] || [660];

    frecuencias.forEach((frecuencia, indice) => {
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      const inicio = contexto.currentTime + indice * 0.22;

      oscilador.frequency.value = frecuencia;
      oscilador.type = tipo === 'AGOTADO' ? 'square' : 'sine';
      ganancia.gain.setValueAtTime(0.0001, inicio);
      ganancia.gain.exponentialRampToValueAtTime(0.18, inicio + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.18);
      oscilador.connect(ganancia);
      ganancia.connect(contexto.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.2);
    });

    window.setTimeout(() => contexto.close(), 1400);
  } catch {
    // Algunos navegadores bloquean audio hasta que exista interacción del usuario.
  }
}

function hablarAlerta(texto) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const mensaje = new SpeechSynthesisUtterance(texto);
    mensaje.lang = 'es-CO';
    mensaje.rate = 0.92;
    mensaje.pitch = 1;
    window.speechSynthesis.speak(mensaje);
  } catch {
    // La voz es una ayuda opcional y no debe bloquear la operación.
  }
}

function construirAlertaPendiente(actividad, ahoraMs, configuracion) {
  if (!actividad || normalizar(actividad.estado) !== 'en curso') return null;
  if (!configuracion.alertasActivas) return null;
  if (Number(actividad.duracionMinutos || 0) < DURACION_MINIMA_ALERTAS) return null;

  const emitidas = parsearAlertasEmitidas(actividad.alertasEmitidas);
  const tiempo = calcularEstadoTemporal(actividad, ahoraMs);

  const opciones = [
    {
      tipo: 'AGOTADO',
      aplica: configuracion.alertaAgotado && tiempo.restantes <= 0,
      titulo: 'Tiempo agotado',
      mensaje: `La actividad superó el tiempo programado. Retraso actual: ${formatoContador(tiempo.restantes)}.`,
      voz: 'Tiempo agotado. La actividad ya superó el tiempo programado.',
      severidad: 'error',
    },
    {
      tipo: '5MIN',
      aplica: configuracion.alerta5Min && tiempo.restantes <= 300,
      titulo: 'Solo quedan 5 minutos',
      mensaje: `Es momento de preparar el cierre. Restan ${formatoContador(tiempo.restantes)}.`,
      voz: 'Quedan cinco minutos para finalizar la actividad.',
      severidad: 'warning',
    },
    {
      tipo: '75',
      aplica: configuracion.alerta75 && tiempo.porcentaje >= 75,
      titulo: '75% del tiempo consumido',
      mensaje: `Quedan ${formatoContador(tiempo.restantes)} para finalizar.`,
      voz: 'Se consumió el setenta y cinco por ciento del tiempo.',
      severidad: 'warning',
    },
    {
      tipo: '50',
      aplica: configuracion.alerta50 && tiempo.porcentaje >= 50,
      titulo: 'Mitad del tiempo consumido',
      mensaje: `Quedan ${formatoContador(tiempo.restantes)} para finalizar.`,
      voz: 'Se consumió la mitad del tiempo de la actividad.',
      severidad: 'info',
    },
  ];

  return opciones.find((item) => item.aplica && !emitidas.includes(item.tipo)) || null;
}

function obtenerSegundosTranscurridos(actividad, ahoraMs) {
  if (!actividad?.fechaInicioReal) return 0;

  const inicio = new Date(actividad.fechaInicioReal).getTime();
  if (!Number.isFinite(inicio)) return 0;

  const estado = normalizar(actividad.estado);
  let fin = actividad.fechaFinReal
    ? new Date(actividad.fechaFinReal).getTime()
    : ahoraMs;

  let pausados = Number(actividad.tiempoPausadoSegundos || 0);

  if (estado === 'pausada' && actividad.fechaPausaActual) {
    const inicioPausa = new Date(actividad.fechaPausaActual).getTime();
    if (Number.isFinite(inicioPausa)) {
      fin = inicioPausa;
    }
  }

  return Math.max(0, Math.floor((fin - inicio) / 1000) - pausados);
}

function EstadoChip({ estado }) {
  const valor = normalizar(estado);
  const color =
    valor === 'finalizada'
      ? 'success'
      : valor === 'en curso'
        ? 'warning'
        : valor === 'pausada'
          ? 'info'
          : valor === 'cancelada'
          ? 'error'
          : 'default';
  return <Chip size="small" color={color} label={estado || 'Pendiente'} />;
}

function TarjetaIndicador({ icono, titulo, valor, subtitulo, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ color: `${color}.main`, display: 'flex', mt: 0.25 }}>{icono}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {titulo}
            </Typography>
            <Typography variant="h5" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
              {valor}
            </Typography>
            {subtitulo && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitulo}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ResumenDiario({ actividades, dia, ahoraMs }) {
  const aplicables = actividades.filter(
    (item) => item.dia === dia && normalizar(item.estado) !== 'cancelada'
  );
  const finalizadas = aplicables.filter(
    (item) => normalizar(item.estado) === 'finalizada'
  );
  const cumplimiento = aplicables.length
    ? Math.round((finalizadas.length / aplicables.length) * 100)
    : 0;
  const balance = finalizadas.reduce(
    (total, item) => total + Number(item.variacionMinutos || 0),
    0
  );
  const actual = actividades.find((item) => {
    const estado = normalizar(item.estado);
    return item.dia === dia && (estado === 'en curso' || estado === 'pausada');
  });
  const transcurridos = obtenerSegundosTranscurridos(actual, ahoraMs);
  const programados = Number(actual?.duracionMinutos || 0) * 60;
  const restantes = programados - transcurridos;
  const avance = actual && programados > 0
    ? Math.min(100, Math.max(0, (transcurridos / programados) * 100))
    : 0;
  const balanceRedondeado = Math.round(balance);
  const balanceEnTiempo = Math.abs(balanceRedondeado) <= 2;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={900}>
              Seguimiento diario
            </Typography>
            <Typography variant="h5" fontWeight={900}>{dia}</Typography>
          </Box>
          <Chip
            icon={<CalendarMonthRounded />}
            label={`${finalizadas.length} de ${aplicables.length} actividades finalizadas`}
            variant="outlined"
          />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={cumplimiento}
          sx={{ height: 12, borderRadius: 999 }}
        />

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TarjetaIndicador
              icono={<CheckCircleRounded />}
              titulo="Cumplimiento"
              valor={`${cumplimiento}%`}
              subtitulo={`${finalizadas.length} actividades completadas`}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TarjetaIndicador
              icono={
                balanceEnTiempo
                  ? <TrendingFlatRounded />
                  : balanceRedondeado > 0
                    ? <TrendingUpRounded />
                    : <TrendingDownRounded />
              }
              titulo="Estado del tiempo"
              valor={
                balanceEnTiempo
                  ? 'En tiempo'
                  : balanceRedondeado > 0
                    ? `${balanceRedondeado} min adelantados`
                    : `${Math.abs(balanceRedondeado)} min de retraso`
              }
              subtitulo="Balance de actividades finalizadas"
              color={balanceEnTiempo ? 'warning' : balanceRedondeado > 0 ? 'success' : 'error'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TarjetaIndicador
              icono={<PlayArrowRounded />}
              titulo={normalizar(actual?.estado) === 'pausada' ? 'Actividad pausada' : 'Actividad actual'}
              valor={actual?.actividad || 'Sin actividad en curso'}
              subtitulo={
                actual
                  ? `${actual.responsable} · ${actual.lugar}`
                  : 'Inicia una actividad para activar el control'
              }
              color={!actual ? 'primary' : normalizar(actual.estado) === 'pausada' ? 'info' : 'warning'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TarjetaIndicador
              icono={<ScheduleRounded />}
              titulo={
                normalizar(actual?.estado) === 'pausada'
                  ? 'Tiempo detenido'
                  : restantes >= 0
                    ? 'Tiempo restante'
                    : 'Tiempo excedido'
              }
              valor={actual ? formatoContador(restantes) : '--:--'}
              subtitulo={
                actual
                  ? normalizar(actual.estado) === 'pausada'
                    ? 'La pausa no consume el tiempo programado'
                    : `${Math.round(avance)}% del tiempo consumido`
                  : 'Esperando inicio'
              }
              color={!actual ? 'primary' : restantes >= 0 ? 'info' : 'error'}
            />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}

function ActividadDialog({ open, onClose, onSubmit, actividad, loading }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(actividad ? { ...FORM_INICIAL, ...actividad } : FORM_INICIAL);
    setError('');
  }, [open, actividad]);

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(event) {
    event.preventDefault();
    if (!form.actividad.trim() || !form.responsable.trim() || !form.lugar.trim()) {
      setError('Actividad, responsable y lugar son obligatorios.');
      return;
    }
    if (Number(form.duracionMinutos) <= 0) {
      setError('La duración debe ser mayor que cero.');
      return;
    }
    setError('');
    try {
      await onSubmit({
        ...form,
        duracionMinutos: Number(form.duracionMinutos),
        orden: form.orden === '' ? '' : Number(form.orden),
      });
    } catch (err) {
      setError(err.message || 'No fue posible guardar.');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      fullScreen={window.innerWidth < 600}
      component="form"
      onSubmit={guardar}
    >
      <DialogTitle>{actividad ? 'Editar actividad' : 'Registrar actividad'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Día" value={form.dia} onChange={(e) => cambiar('dia', e.target.value)} fullWidth>
                {DIAS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="Hora inicio" type="time" value={form.horaInicio} onChange={(e) => cambiar('horaInicio', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="Duración (min)" type="number" value={form.duracionMinutos} onChange={(e) => cambiar('duracionMinutos', e.target.value)} inputProps={{ min: 1 }} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Actividad" value={form.actividad} onChange={(e) => cambiar('actividad', e.target.value)} fullWidth required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Orden" type="number" value={form.orden} onChange={(e) => cambiar('orden', e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Responsable" value={form.responsable} onChange={(e) => cambiar('responsable', e.target.value)} fullWidth required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Equipo" value={form.equipo} onChange={(e) => cambiar('equipo', e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Lugar" value={form.lugar} onChange={(e) => cambiar('lugar', e.target.value)} fullWidth required />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Estado" value={form.estado} onChange={(e) => cambiar('estado', e.target.value)} fullWidth>
                {ESTADOS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Prioridad" value={form.prioridad} onChange={(e) => cambiar('prioridad', e.target.value)} fullWidth>
                {PRIORIDADES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField label="Observaciones" value={form.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} multiline minRows={3} fullWidth />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BotonesOperacion({
  actividad,
  puedeEditar,
  puedeIniciar,
  puedePausar,
  puedeReanudar,
  puedeFinalizar,
  onEditar,
  onIniciar,
  onPausar,
  onReanudar,
  onFinalizar,
  loading,
}) {
  const estado = normalizar(actividad.estado);
  const enCurso = estado === 'en curso';
  const pausada = estado === 'pausada';
  const finalizada = estado === 'finalizada';
  const cancelada = estado === 'cancelada';

  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {puedeEditar && !enCurso && !pausada && !finalizada && (
        <Button
          size="small"
          startIcon={<EditRounded />}
          onClick={() => onEditar(actividad)}
          disabled={loading}
        >
          Editar
        </Button>
      )}

      {puedeIniciar && !enCurso && !pausada && !finalizada && !cancelada && (
        <Button
          size="small"
          color="warning"
          startIcon={<PlayArrowRounded />}
          onClick={() => onIniciar(actividad)}
          disabled={loading}
        >
          Iniciar
        </Button>
      )}

      {puedePausar && enCurso && (
        <Button
          size="small"
          color="info"
          startIcon={<PauseRounded />}
          onClick={() => onPausar(actividad)}
          disabled={loading}
        >
          Pausar
        </Button>
      )}

      {puedeReanudar && pausada && (
        <Button
          size="small"
          color="warning"
          startIcon={<ReplayRounded />}
          onClick={() => onReanudar(actividad)}
          disabled={loading}
        >
          Reanudar
        </Button>
      )}

      {puedeFinalizar && (enCurso || pausada) && (
        <Button
          size="small"
          color="success"
          startIcon={<StopCircleRounded />}
          onClick={() => onFinalizar(actividad)}
          disabled={loading}
        >
          Finalizar
        </Button>
      )}
    </Stack>
  );
}

function VistaTabla(props) {
  const { actividades } = props;
  return (
    <Stack spacing={1.5}>
      {actividades.map((actividad) => (
        <Paper key={actividad.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                <Typography variant="h6" fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>{actividad.actividad}</Typography>
                <EstadoChip estado={actividad.estado} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 2 }} mt={1}>
                <Typography variant="body2" color="text.secondary"><ScheduleRounded sx={{ fontSize: 17, verticalAlign: 'middle', mr: 0.5 }} />{formatoHora(actividad.horaInicio)} – {formatoHora(actividad.horaFin)} · {actividad.duracionMinutos} min</Typography>
                <Typography variant="body2" color="text.secondary"><PersonRounded sx={{ fontSize: 17, verticalAlign: 'middle', mr: 0.5 }} />{actividad.responsable}</Typography>
                <Typography variant="body2" color="text.secondary"><LocationOnRounded sx={{ fontSize: 17, verticalAlign: 'middle', mr: 0.5 }} />{actividad.lugar}</Typography>
              </Stack>
              {actividad.observaciones && <Typography variant="body2" mt={1}>{actividad.observaciones}</Typography>}
            </Box>
            <BotonesOperacion {...props} actividad={actividad} />
          </Stack>
        </Paper>
      ))}
      {actividades.length === 0 && <Alert severity="info">No hay actividades para mostrar.</Alert>}
    </Stack>
  );
}

function VistaGantt({ actividades, dia }) {
  const actividadesDia = actividades
    .filter((item) => item.dia === dia && normalizar(item.estado) !== 'cancelada')
    .sort((a, b) => minutosDesdeHora(a.horaInicio) - minutosDesdeHora(b.horaInicio));

  if (!actividadesDia.length) {
    return <Alert severity="info">No hay actividades programadas para {dia}.</Alert>;
  }

  const inicioCrudo = Math.min(...actividadesDia.map((item) => minutosDesdeHora(item.horaInicio)));
  const finCrudo = Math.max(...actividadesDia.map((item) => minutosDesdeHora(item.horaFin)));
  const inicio = Math.floor(inicioCrudo / 30) * 30;
  const fin = Math.ceil(finCrudo / 30) * 30;
  const rango = Math.max(60, fin - inicio);
  const anchoNombre = { xs: 172, sm: 230, md: 300 };
  const anchoLinea = Math.max(820, Math.ceil(rango / 60) * 150);
  const marcas = [];

  for (let minuto = inicio; minuto <= fin; minuto += 30) {
    marcas.push(minuto);
  }

  function horaDesdeMinutos(total) {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={900}>Cronograma visual · {dia}</Typography>
        <Typography variant="body2" color="text.secondary">
          Desliza horizontalmente. La actividad, el responsable y el equipo permanecen visibles en celular.
        </Typography>
      </Box>

      <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
        <Box sx={{ minWidth: `calc(${anchoLinea}px + 172px)` }}>
          <Box sx={{ display: 'flex', minHeight: 54, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Box
              sx={{
                width: anchoNombre,
                minWidth: anchoNombre,
                position: 'sticky',
                left: 0,
                zIndex: 6,
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '6px 0 12px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={900}>Actividad</Typography>
            </Box>

            <Box sx={{ width: anchoLinea, minWidth: anchoLinea, position: 'relative' }}>
              {marcas.map((marca) => {
                const left = ((marca - inicio) / rango) * 100;
                return (
                  <Box
                    key={marca}
                    sx={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: 0,
                      bottom: 0,
                      borderLeft: 1,
                      borderColor: 'divider',
                      pl: 0.75,
                      pt: 1,
                    }}
                  >
                    <Typography variant="caption" fontWeight={800} color="text.secondary">
                      {formatoHora(horaDesdeMinutos(marca))}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {actividadesDia.map((actividad, index) => {
            const inicioActividad = minutosDesdeHora(actividad.horaInicio);
            const duracion = Math.max(1, Number(actividad.duracionMinutos || 0));
            const ancho = (duracion / rango) * 100;
            const izquierda = ((inicioActividad - inicio) / rango) * 100;
            const estado = normalizar(actividad.estado);
            const color =
              estado === 'finalizada'
                ? 'success.main'
                : estado === 'en curso'
                  ? 'warning.main'
                  : estado === 'pausada'
                    ? 'info.main'
                    : 'primary.main';

            return (
              <Box
                key={actividad.id}
                sx={{
                  display: 'flex',
                  minHeight: { xs: 104, sm: 92 },
                  borderBottom: index === actividadesDia.length - 1 ? 0 : 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: anchoNombre,
                    minWidth: anchoNombre,
                    position: 'sticky',
                    left: 0,
                    zIndex: 5,
                    bgcolor: 'background.paper',
                    borderRight: 1,
                    borderColor: 'divider',
                    p: 1.5,
                    boxShadow: '6px 0 12px rgba(0,0,0,0.08)',
                  }}
                >
                  <Typography
                    fontWeight={850}
                    title={actividad.actividad}
                    sx={{
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.22,
                      display: '-webkit-box',
                      WebkitLineClamp: { xs: 3, sm: 2 },
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {actividad.actividad}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.65, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                  >
                    {actividad.responsable || 'Sin responsable'}
                    {actividad.equipo ? ` · ${actividad.equipo}` : ''}
                  </Typography>
                </Box>

                <Box sx={{ width: anchoLinea, minWidth: anchoLinea, position: 'relative', bgcolor: 'background.default' }}>
                  {marcas.map((marca) => (
                    <Box
                      key={marca}
                      sx={{
                        position: 'absolute',
                        left: `${((marca - inicio) / rango) * 100}%`,
                        top: 0,
                        bottom: 0,
                        borderLeft: 1,
                        borderColor: 'divider',
                        opacity: 0.7,
                      }}
                    />
                  ))}

                  <Box
                    sx={{
                      position: 'absolute',
                      left: `calc(${izquierda}% + 6px)`,
                      width: `calc(${Math.max(ancho, 1.6)}% - 12px)`,
                      minWidth: 56,
                      top: 14,
                      bottom: 14,
                      borderRadius: 2,
                      bgcolor: color,
                      color: 'primary.contrastText',
                      px: 1.25,
                      py: 0.75,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: 2,
                    }}
                  >
                    <Typography variant="caption" fontWeight={900} noWrap>
                      {formatoHora(actividad.horaInicio)} · {duracion} min
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ opacity: 0.92 }}>
                      {actividad.lugar || actividad.estado || 'Programada'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}

function VistaEnVivo({ actividades, dia, ahoraMs, ...props }) {
  const actividadesDia = actividades.filter((item) => item.dia === dia && normalizar(item.estado) !== 'cancelada');
  const actual = actividadesDia.find((item) => {
    const estado = normalizar(item.estado);
    return estado === 'en curso' || estado === 'pausada';
  });
  const pendientes = actividadesDia.filter((item) => normalizar(item.estado) === 'pendiente');
  const proxima = pendientes[0];
  const transcurridos = obtenerSegundosTranscurridos(actual, ahoraMs);
  const programados = Number(actual?.duracionMinutos || 0) * 60;
  const restantes = programados - transcurridos;
  const avance = actual && programados > 0 ? Math.min(100, (transcurridos / programados) * 100) : 0;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent>
            <Typography
              variant="overline"
              color={normalizar(actual?.estado) === 'pausada' ? 'info.main' : 'success.main'}
              fontWeight={900}
            >
              {normalizar(actual?.estado) === 'pausada' ? 'Actividad pausada' : 'Actividad actual'}
            </Typography>
            {actual ? (
              <Stack spacing={2} mt={1}>
                <Typography variant="h4" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>{actual.actividad}</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                  <Typography><strong>Responsable:</strong> {actual.responsable}</Typography>
                  <Typography><strong>Lugar:</strong> {actual.lugar}</Typography>
                </Stack>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.75} gap={1}>
                    <Typography variant="body2" color="text.secondary">Duración programada: {actual.duracionMinutos} min</Typography>
                    <Typography fontWeight={900} color={restantes < 0 ? 'error.main' : 'text.primary'}>
                      {normalizar(actual.estado) === 'pausada'
                        ? `${formatoContador(restantes)} detenidos`
                        : restantes >= 0
                          ? `${formatoContador(restantes)} restantes`
                          : `${formatoContador(restantes)} excedidos`}
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={avance} color={restantes < 0 ? 'error' : 'primary'} sx={{ height: 12, borderRadius: 999 }} />
                </Box>
                <BotonesOperacion {...props} actividad={actual} />
              </Stack>
            ) : (
              <Alert severity="info" sx={{ mt: 1 }}>
                No hay una actividad en curso o pausada. El Campanero o el Administrador puede iniciar la siguiente.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="overline" color="primary" fontWeight={900}>Próxima actividad</Typography>
            {proxima ? (
              <Stack spacing={1} mt={1}>
                <Typography variant="h5" fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>{proxima.actividad}</Typography>
                <Typography color="text.secondary">{formatoHora(proxima.horaInicio)}</Typography>
                <Divider />
                <Typography>{proxima.responsable}</Typography>
                <Typography color="text.secondary">{proxima.lugar}</Typography>
                <BotonesOperacion {...props} actividad={proxima} />
              </Stack>
            ) : <Typography mt={1} color="text.secondary">No hay más actividades pendientes para {dia}.</Typography>}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}



function ConfiguracionAlertasDialog({ open, configuracion, onClose, onChange }) {
  const opciones = [
    ['alertasActivas', 'Activar alertas automáticas'],
    ['sonido', 'Reproducir sonido'],
    ['voz', 'Leer alertas en voz alta'],
    ['vibracion', 'Vibrar en dispositivos compatibles'],
    ['alerta50', 'Alertar al 50%'],
    ['alerta75', 'Alertar al 75%'],
    ['alerta5Min', 'Alertar cuando falten 5 minutos'],
    ['alertaAgotado', 'Alertar cuando se agote el tiempo'],
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Configuración de alertas</DialogTitle>
      <DialogContent>
        <Stack spacing={0.5} mt={1}>
          <Alert severity="info">
            Las alertas se aplican a actividades de {DURACION_MINIMA_ALERTAS} minutos o más.
          </Alert>
          {opciones.map(([clave, etiqueta]) => (
            <FormControlLabel
              key={clave}
              control={(
                <Switch
                  checked={Boolean(configuracion[clave])}
                  onChange={(event) => onChange(clave, event.target.checked)}
                />
              )}
              label={etiqueta}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Listo</Button>
      </DialogActions>
    </Dialog>
  );
}

function AlertaPantallaCompleta({ alerta, actividad, onClose }) {
  if (!alerta) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: alerta.severidad === 'error' ? 'error.main' : 'background.default',
          color: alerta.severidad === 'error' ? 'error.contrastText' : 'text.primary',
        },
      }}
    >
      <DialogContent sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
        <Stack spacing={3} alignItems="center" maxWidth={900}>
          <NotificationsActiveRounded sx={{ fontSize: { xs: 72, md: 110 } }} />
          <Typography variant="overline" fontWeight={900}>Alerta del minutograma</Typography>
          <Typography variant="h2" fontWeight={950} sx={{ fontSize: { xs: '2.5rem', md: '5rem' } }}>
            {alerta.titulo}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', md: '2.25rem' } }}>
            {actividad?.actividad}
          </Typography>
          <Typography variant="h5">{alerta.mensaje}</Typography>
          <Button
            size="large"
            variant={alerta.severidad === 'error' ? 'outlined' : 'contained'}
            color="inherit"
            onClick={onClose}
            sx={{ minWidth: 220, minHeight: 54, fontWeight: 900 }}
          >
            Entendido
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function ModoCampanero({ open, actividades, dia, ahoraMs, onClose, propsOperacion }) {
  const actividadesDia = actividades.filter(
    (item) => item.dia === dia && normalizar(item.estado) !== 'cancelada'
  );
  const actual = actividadesDia.find((item) => {
    const estado = normalizar(item.estado);
    return estado === 'en curso' || estado === 'pausada';
  });
  const proxima = actividadesDia.find((item) => normalizar(item.estado) === 'pendiente');
  const tiempo = calcularEstadoTemporal(actual, ahoraMs);
  const nivel = obtenerNivelVisual(tiempo.porcentaje, tiempo.restantes);

  useEffect(() => {
    if (!open) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [open]);

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        bgcolor: 'background.default',
        p: { xs: 2, md: 4 },
        overflowY: 'auto',
      }}
    >
      <Stack spacing={3} minHeight="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" color="primary" fontWeight={900}>Modo Campanero</Typography>
            <Typography variant="h5" fontWeight={900}>{dia}</Typography>
          </Box>
          <Button startIcon={<FullscreenExitRounded />} onClick={onClose}>Salir</Button>
        </Stack>

        {actual ? (
          <Paper
            elevation={4}
            sx={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              p: { xs: 2.5, md: 5 },
              borderRadius: 4,
              border: 3,
              borderColor: `${nivel}.main`,
            }}
          >
            <Stack spacing={3} alignItems="center" width="100%" maxWidth={1100}>
              <Typography variant="overline" color={`${nivel}.main`} fontWeight={950}>
                {normalizar(actual.estado) === 'pausada' ? 'Actividad pausada' : 'Actividad en ejecución'}
              </Typography>
              <Typography variant="h2" fontWeight={950} sx={{ fontSize: { xs: '2.1rem', md: '4.5rem' }, overflowWrap: 'anywhere' }}>
                {actual.actividad}
              </Typography>
              <Typography
                variant="h1"
                color={`${nivel}.main`}
                fontWeight={950}
                sx={{ fontSize: { xs: '4rem', md: '8rem' }, fontVariantNumeric: 'tabular-nums' }}
              >
                {tiempo.restantes >= 0 ? formatoContador(tiempo.restantes) : `+${formatoContador(tiempo.restantes)}`}
              </Typography>
              <Typography variant="h6">
                {tiempo.restantes >= 0 ? 'restantes' : 'de retraso'} · {Math.round(tiempo.porcentaje)}% consumido
              </Typography>
              <LinearProgress
                variant="determinate"
                value={tiempo.avance}
                color={nivel}
                sx={{ height: 22, borderRadius: 999, width: '100%' }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Typography variant="h6"><strong>Responsable:</strong> {actual.responsable}</Typography>
                <Typography variant="h6"><strong>Lugar:</strong> {actual.lugar}</Typography>
              </Stack>
              <BotonesOperacion {...propsOperacion} actividad={actual} />
            </Stack>
          </Paper>
        ) : (
          <Alert severity="info">No hay una actividad en curso o pausada.</Alert>
        )}

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="overline" color="text.secondary" fontWeight={900}>Próxima actividad</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
            {proxima?.actividad || 'No hay más actividades pendientes'}
          </Typography>
          {proxima && (
            <Typography color="text.secondary" mt={0.5}>
              {formatoHora(proxima.horaInicio)} · {proxima.responsable} · {proxima.lugar}
            </Typography>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}

function ConfirmarFinalizacionDialog({
  open,
  actividad,
  ahoraMs,
  loading,
  onClose,
  onConfirmar,
}) {
  if (!actividad) return null;

  const transcurridos = obtenerSegundosTranscurridos(actividad, ahoraMs);
  const programados = Number(actividad.duracionMinutos || 0) * 60;
  const variacionSegundos = programados - transcurridos;
  const aFavor = variacionSegundos >= 0;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Finalizar actividad</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="h6" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
            {actividad.actividad}
          </Typography>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Duración programada
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {actividad.duracionMinutos} minutos
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Tiempo efectivo utilizado
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {formatoContador(transcurridos)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity={aFavor ? 'success' : 'warning'}>
            {aFavor
              ? `Esta actividad aportará aproximadamente ${formatoContador(variacionSegundos)} a favor del balance diario.`
              : `Esta actividad agregará aproximadamente ${formatoContador(variacionSegundos)} de retraso al balance diario.`}
          </Alert>

          {normalizar(actividad.estado) === 'pausada' && (
            <Alert severity="info">
              La actividad está pausada. El tiempo de pausa no será incluido en la duración real.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Continuar actividad
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={
            loading
              ? <CircularProgress size={18} color="inherit" />
              : <StopCircleRounded />
          }
          onClick={onConfirmar}
          disabled={loading}
        >
          {loading ? 'Finalizando...' : 'Sí, finalizar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Minutograma() {
  const api = useApi(() => obtenerMinutograma(), []);
  const { token, autenticado, loading: authLoading, tienePermiso } = useAuth();
  const [vista, setVista] = useState('tabla');
  const [dia, setDia] = useState('Viernes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [ahoraMs, setAhoraMs] = useState(Date.now());
  const [actividadPorFinalizar, setActividadPorFinalizar] = useState(null);
  const [configuracionAlertas, setConfiguracionAlertas] = useState(leerConfiguracionAlertas);
  const [configuracionOpen, setConfiguracionOpen] = useState(false);
  const [modoCampanero, setModoCampanero] = useState(false);
  const [alertaVisible, setAlertaVisible] = useState(null);
  const [alertaProcesando, setAlertaProcesando] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setAhoraMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CLAVE_CONFIG_ALERTAS,
        JSON.stringify(configuracionAlertas)
      );
    } catch {
      // La configuración local no es obligatoria para operar el módulo.
    }
  }, [configuracionAlertas]);

  const actividades = api.data?.items || [];
  const actividadEnCurso = actividades.find((item) => {
    const estado = normalizar(item.estado);
    return item.dia === dia && (estado === 'en curso' || estado === 'pausada');
  });

  useEffect(() => {
    if (!actividadEnCurso || alertaProcesando || alertaVisible) return;

    const alerta = construirAlertaPendiente(
      actividadEnCurso,
      ahoraMs,
      configuracionAlertas
    );

    if (!alerta) return;

    let cancelado = false;

    async function procesarAlerta() {
      setAlertaProcesando(true);

      try {
        if (configuracionAlertas.sonido) emitirSonido(alerta.tipo);
        if (configuracionAlertas.voz) hablarAlerta(alerta.voz);
        if (configuracionAlertas.vibracion && navigator.vibrate) {
          navigator.vibrate(alerta.tipo === 'AGOTADO' ? [300, 150, 300] : [180]);
        }

        if (token && (puede('INICIAR_ACTIVIDAD_MINUTOGRAMA') || puede('FINALIZAR_ACTIVIDAD_MINUTOGRAMA'))) {
          await registrarAlertaMinutogramaApi(
            token,
            actividadEnCurso.id,
            alerta.tipo,
            alerta.mensaje
          );
          await api.reload();
        }

        if (!cancelado) {
          setAlertaVisible({ ...alerta, actividad: actividadEnCurso });
        }
      } catch (error) {
        if (!cancelado) {
          setErrorAccion(error.message || 'No fue posible registrar la alerta.');
          setAlertaVisible({ ...alerta, actividad: actividadEnCurso });
        }
      } finally {
        if (!cancelado) setAlertaProcesando(false);
      }
    }

    procesarAlerta();
    return () => { cancelado = true; };
  }, [
    actividadEnCurso?.id,
    actividadEnCurso?.estado,
    actividadEnCurso?.alertasEmitidas,
    ahoraMs,
    configuracionAlertas,
    alertaProcesando,
    alertaVisible,
    token,
  ]);

  const filtradas = useMemo(
    () => actividades.filter((item) => !dia || item.dia === dia),
    [actividades, dia]
  );

  function puede(permiso) {
    return !authLoading && autenticado && tienePermiso(permiso);
  }

  const puedeRegistrar = puede('REGISTRAR_ACTIVIDAD_MINUTOGRAMA');
  const puedeEditar = puede('EDITAR_ACTIVIDAD_MINUTOGRAMA');
  const puedeIniciar = puede('INICIAR_ACTIVIDAD_MINUTOGRAMA');
  const puedePausar = puede('PAUSAR_ACTIVIDAD_MINUTOGRAMA');
  const puedeReanudar = puede('REANUDAR_ACTIVIDAD_MINUTOGRAMA');
  const puedeFinalizar = puede('FINALIZAR_ACTIVIDAD_MINUTOGRAMA');

  async function ejecutarAccion(accion, mensajeOk) {
    setGuardando(true);
    setErrorAccion('');

    try {
      await accion();
      setMensaje(mensajeOk);
      await api.reload();
      return true;
    } catch (error) {
      setErrorAccion(error.message || 'No fue posible completar la acción.');
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function guardarActividad(datos) {
    await ejecutarAccion(async () => {
      if (seleccionada) {
        await editarActividadMinutogramaApi(token, seleccionada.id, datos);
      } else {
        await registrarActividadMinutogramaApi(token, datos);
      }
      setDialogOpen(false);
      setSeleccionada(null);
    }, seleccionada ? 'Actividad actualizada correctamente.' : 'Actividad registrada correctamente.');
  }

  function iniciarActividad(actividad) {
    ejecutarAccion(
      () => iniciarActividadMinutogramaApi(token, actividad.id),
      `Actividad iniciada: ${actividad.actividad}`
    );
  }

  function pausarActividad(actividad) {
    ejecutarAccion(
      () => pausarActividadMinutogramaApi(token, actividad.id),
      `Actividad pausada: ${actividad.actividad}`
    );
  }

  function reanudarActividad(actividad) {
    ejecutarAccion(
      () => reanudarActividadMinutogramaApi(token, actividad.id),
      `Actividad reanudada: ${actividad.actividad}`
    );
  }

  function solicitarFinalizacion(actividad) {
    setActividadPorFinalizar(actividad);
  }

  async function confirmarFinalizacion() {
    const actividad = actividadPorFinalizar;
    if (!actividad) return;

    const finalizada = await ejecutarAccion(
      () => finalizarActividadMinutogramaApi(token, actividad.id),
      `Actividad finalizada: ${actividad.actividad}`
    );

    if (finalizada) {
      setActividadPorFinalizar(null);
    }
  }

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  const propsOperacion = {
    puedeEditar,
    puedeIniciar,
    puedePausar,
    puedeReanudar,
    puedeFinalizar,
    onEditar: (actividad) => {
      setSeleccionada(actividad);
      setDialogOpen(true);
    },
    onIniciar: iniciarActividad,
    onPausar: pausarActividad,
    onReanudar: reanudarActividad,
    onFinalizar: solicitarFinalizacion,
    loading: guardando,
  };

  return (
    <>
      <PageHeader
        eyebrow="Operación del retiro"
        title="Minutograma"
        subtitle="Programación, control y seguimiento en tiempo real"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5}>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {DIAS.map((item) => (
              <Chip
                key={item}
                icon={<CalendarMonthRounded />}
                label={item}
                color={dia === item ? 'primary' : 'default'}
                variant={dia === item ? 'filled' : 'outlined'}
                onClick={() => setDia(item)}
              />
            ))}
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              startIcon={configuracionAlertas.alertasActivas ? <NotificationsActiveRounded /> : <NotificationsOffRounded />}
              onClick={() => setConfiguracionOpen(true)}
            >
              Alertas
            </Button>
            {(puedeIniciar || puedeFinalizar) && (
              <Button
                size="small"
                variant="contained"
                startIcon={<FullscreenRounded />}
                onClick={() => setModoCampanero(true)}
              >
                Modo Campanero
              </Button>
            )}
          </Stack>
        </Stack>

        <DashboardMinutograma actividades={actividades} dia={dia} ahoraMs={ahoraMs} />

        {errorAccion && <Alert severity="error" onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Tabs value={vista} onChange={(_, valor) => setVista(valor)} variant="scrollable" scrollButtons="auto">
            <Tab value="tabla" icon={<ViewListRounded />} iconPosition="start" label="Tabla" />
            <Tab value="gantt" icon={<TimelineRounded />} iconPosition="start" label="Cronograma" />
            <Tab value="vivo" icon={<PlayArrowRounded />} iconPosition="start" label="En vivo" />
            <Tab value="estadisticas" icon={<AssessmentRounded />} iconPosition="start" label="Estadísticas" />
          </Tabs>

          {puedeRegistrar && (
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => {
                setSeleccionada(null);
                setDialogOpen(true);
              }}
              sx={{ alignSelf: { xs: 'stretch', md: 'center' }, borderRadius: 2.5, minHeight: 42, textTransform: 'none', fontWeight: 800 }}
            >
              Registrar actividad
            </Button>
          )}
        </Stack>

        {vista === 'tabla' && <VistaTabla actividades={filtradas} {...propsOperacion} />}
        {vista === 'gantt' && <VistaGantt actividades={actividades} dia={dia} />}
        {vista === 'vivo' && <VistaEnVivo actividades={actividades} dia={dia} ahoraMs={ahoraMs} {...propsOperacion} />}
        {vista === 'estadisticas' && <EstadisticasMinutograma actividades={actividades} dia={dia} />}
      </Stack>

      <ActividadDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSeleccionada(null);
        }}
        onSubmit={guardarActividad}
        actividad={seleccionada}
        loading={guardando}
      />

      <ConfirmarFinalizacionDialog
        open={Boolean(actividadPorFinalizar)}
        actividad={actividadPorFinalizar}
        ahoraMs={ahoraMs}
        loading={guardando}
        onClose={() => setActividadPorFinalizar(null)}
        onConfirmar={confirmarFinalizacion}
      />

      <ConfiguracionAlertasDialog
        open={configuracionOpen}
        configuracion={configuracionAlertas}
        onClose={() => setConfiguracionOpen(false)}
        onChange={(clave, valor) => {
          setConfiguracionAlertas((actual) => ({ ...actual, [clave]: valor }));
        }}
      />

      <ModoCampanero
        open={modoCampanero}
        actividades={actividades}
        dia={dia}
        ahoraMs={ahoraMs}
        onClose={() => setModoCampanero(false)}
        propsOperacion={propsOperacion}
      />

      <AlertaPantallaCompleta
        alerta={alertaVisible}
        actividad={alertaVisible?.actividad}
        onClose={() => setAlertaVisible(null)}
      />

      <Snackbar open={Boolean(mensaje)} autoHideDuration={3500} onClose={() => setMensaje('')}>
        <Alert severity="success" variant="filled" onClose={() => setMensaje('')}>{mensaje}</Alert>
      </Snackbar>
    </>
  );
}
