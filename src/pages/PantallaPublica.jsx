import { Box, Card, CardContent, CircularProgress, Container, LinearProgress, Stack, Typography } from '@mui/material';
import { LocationOnRounded, PersonRounded, ScheduleRounded } from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { obtenerMinutograma } from '../api/minutogramaApi';
import useMinutogramaEnVivo from '../hooks/useMinutogramaEnVivo';
import { formatoHora, formatoReloj } from '../utils/minutogramaTiempo';

export default function PantallaPublica() {
  const api = useApi(() => obtenerMinutograma(), []);
  const vivo = useMinutogramaEnVivo(api.data?.items || []);
  if (api.loading && !api.data) return <Box minHeight="100vh" display="grid" sx={{ placeItems:'center', bgcolor:'#081b2c' }}><CircularProgress /></Box>;
  const retraso = vivo.ejecucion.retraso;
  return (
    <Box sx={{ minHeight:'100vh', color:'white', background: retraso ? 'linear-gradient(135deg,#671111,#a61b1b)' : 'linear-gradient(135deg,#081b2c,#174d73)', display:'flex', alignItems:'center', py:3 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="overline" fontWeight={900} sx={{ opacity:.7, letterSpacing:2 }}>EMAÚS · PROGRAMACIÓN EN VIVO</Typography><Typography variant="h4" fontWeight={950}>{vivo.dia}</Typography></Box><Typography sx={{ fontSize:{ xs:'2rem', md:'3.5rem' }, fontWeight:950, fontVariantNumeric:'tabular-nums' }}>{vivo.ahora.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</Typography></Stack>
          {vivo.actual ? <Card elevation={0} sx={{ bgcolor:'rgba(255,255,255,.1)', color:'inherit', border:'1px solid rgba(255,255,255,.18)', borderRadius:5 }}><CardContent sx={{ p:{xs:3,md:6}, '&:last-child':{pb:{xs:3,md:6}} }}>
            <Typography variant="overline" fontWeight={900} sx={{ opacity:.75 }}>{retraso ? 'ACTIVIDAD EN TIEMPO EXCEDIDO' : 'EN ESTE MOMENTO'}</Typography>
            <Typography sx={{ fontSize:{xs:'2.3rem',sm:'3.5rem',md:'5.2rem'}, lineHeight:1.03, fontWeight:950, my:2 }}>{vivo.actual.actividad}</Typography>
            <Stack direction={{xs:'column',sm:'row'}} gap={3} mb={4}><Stack direction="row" gap={1}><PersonRounded/><Typography variant="h6">{vivo.actual.responsable}</Typography></Stack><Stack direction="row" gap={1}><LocationOnRounded/><Typography variant="h6">{vivo.actual.lugar}</Typography></Stack><Stack direction="row" gap={1}><ScheduleRounded/><Typography variant="h6">{formatoHora(vivo.actual.horaInicio)} – {formatoHora(vivo.actual.horaFin)}</Typography></Stack></Stack>
            <Typography textAlign="center" sx={{ fontSize:{xs:'3rem',md:'6rem'}, fontWeight:950, fontVariantNumeric:'tabular-nums', mb:2 }}>{formatoReloj(vivo.ejecucion.restantes,true)}</Typography>
            <LinearProgress variant="determinate" value={vivo.ejecucion.porcentaje} color={retraso?'error':'warning'} sx={{height:20,borderRadius:999}}/>
          </CardContent></Card> : <Card sx={{p:5,borderRadius:5,textAlign:'center'}}><Typography variant="h3" fontWeight={900}>No hay actividad en curso</Typography><Typography variant="h6" color="text.secondary" mt={1}>La programación se actualizará automáticamente.</Typography></Card>}
          <Box sx={{ bgcolor:'rgba(255,255,255,.08)', borderRadius:3, p:3 }}><Typography variant="overline" fontWeight={900} sx={{opacity:.7}}>A CONTINUACIÓN</Typography>{vivo.proxima ? <Stack direction={{xs:'column',md:'row'}} justifyContent="space-between" gap={1}><Typography variant="h4" fontWeight={900}>{vivo.proxima.actividad}</Typography><Typography variant="h4" fontWeight={900}>{formatoHora(vivo.proxima.horaInicio)}</Typography></Stack> : <Typography variant="h5">No hay más actividades programadas para hoy.</Typography>}</Box>
        </Stack>
      </Container>
    </Box>
  );
}
