import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { FullscreenRounded, PauseRounded, PlayArrowRounded, StopCircleRounded, RefreshRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { obtenerMinutograma, iniciarActividadMinutogramaApi, pausarActividadMinutogramaApi, reanudarActividadMinutogramaApi, finalizarActividadMinutogramaApi } from '../api/minutogramaApi';
import useMinutogramaEnVivo from '../hooks/useMinutogramaEnVivo';
import { normalizar } from '../utils/minutogramaTiempo';
import CronometroGigante from '../components/campanero/CronometroGigante';
import BarraProgreso from '../components/campanero/BarraProgreso';
import ActividadActual from '../components/campanero/ActividadActual';
import ProximaActividad from '../components/campanero/ProximaActividad';

export default function Campanero() {
  console.log("CAMPANERO");
  const api = useApi(() => obtenerMinutograma(), []);
  const { token, autenticado, tienePermiso } = useAuth();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const actividades = api.data?.items || [];
  const vivo = useMinutogramaEnVivo(actividades);
  console.log("Actividad actual:", vivo.actual);
  const estado = normalizar(vivo.actual?.estadoEjecucion || vivo.actual?.estado);
  const pausada = estado === 'pausada';
  const puedeOperar = autenticado && tienePermiso('ACTUALIZAR_ESTADO_PASO_A_PASO');

  async function ejecutar(accion) {
    if (!vivo.actual) return;
    setProcesando(true); setError('');
    try { await accion(token, vivo.actual.id); await api.reload(); }
    catch (e) { setError(e?.message || 'No fue posible ejecutar la operación.'); }
    finally { setProcesando(false); }
  }

  async function pantallaCompleta() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch (_) { /* El navegador puede bloquearlo */ }
  }

  const fondo = vivo.ejecucion.retraso ? 'linear-gradient(145deg,#7f1d1d,#b91c1c)' : pausada ? 'linear-gradient(145deg,#78350f,#b45309)' : 'linear-gradient(145deg,#102a43,#1f4e79)';

  if (api.loading && !api.data) return <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>;
  return (
    <Box sx={{ minHeight: '100vh', background: fondo, color: 'common.white', py: { xs: 2, md: 3 }, transition: 'background .4s ease' }}>
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 2, md: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box><Typography variant="overline" fontWeight={900} sx={{ opacity: .75 }}>MODO CAMPANERO · {vivo.dia}</Typography><Typography variant="h5" fontWeight={950}>{vivo.ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Typography></Box>
            <Stack direction="row" gap={1}><Button color="inherit" variant="outlined" onClick={api.reload} startIcon={<RefreshRounded />}>Actualizar</Button><Button color="inherit" variant="outlined" onClick={pantallaCompleta} startIcon={<FullscreenRounded />}>Pantalla completa</Button></Stack>
          </Stack>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {!vivo.actual ? <Alert severity="info">No hay una actividad activa para {vivo.dia}. Revisa el paso a paso o inicia una actividad.</Alert> : <>
            <ActividadActual actividad={vivo.actual} />
            <CronometroGigante restantes={vivo.ejecucion.restantes} pausada={pausada} />
            <BarraProgreso porcentaje={vivo.ejecucion.porcentaje} retraso={vivo.ejecucion.retraso} />
            {puedeOperar && <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={1.5}>
              {estado === 'pendiente' && <Button size="large" variant="contained" color="success" startIcon={<PlayArrowRounded />} disabled={procesando} onClick={() => ejecutar(iniciarActividadMinutogramaApi)}>Iniciar</Button>}
              {estado === 'en curso' && <Button size="large" variant="contained" color="warning" startIcon={<PauseRounded />} disabled={procesando} onClick={() => ejecutar(pausarActividadMinutogramaApi)}>Pausar</Button>}
              {pausada && <Button size="large" variant="contained" color="success" startIcon={<PlayArrowRounded />} disabled={procesando} onClick={() => ejecutar(reanudarActividadMinutogramaApi)}>Reanudar</Button>}
              {['en curso','pausada'].includes(estado) && <Button size="large" variant="contained" color="error" startIcon={<StopCircleRounded />} disabled={procesando} onClick={() => ejecutar(finalizarActividadMinutogramaApi)}>Finalizar</Button>}
            </Stack>}
          </>}
          <ProximaActividad actividad={vivo.proxima} />
        </Stack>
      </Container>
    </Box>
  );
}
