import { Card, CardContent, Stack, Typography } from '@mui/material';
import { NavigateNextRounded, ScheduleRounded } from '@mui/icons-material';
import { formatoHora } from '../../utils/minutogramaTiempo';

export default function ProximaActividad({ actividad }) {
  return (
    <Card elevation={0} sx={{ bgcolor: 'rgba(255,255,255,.08)', color: 'inherit', border: '1px solid rgba(255,255,255,.14)', borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={1}><NavigateNextRounded /><Typography variant="overline" fontWeight={900}>PRÓXIMA ACTIVIDAD</Typography></Stack>
        {actividad ? <><Typography variant="h5" fontWeight={900}>{actividad.actividad}</Typography><Stack direction="row" gap={1} alignItems="center" mt={1}><ScheduleRounded fontSize="small"/><Typography>{formatoHora(actividad.horaInicio)} · {actividad.lugar || 'Lugar por definir'}</Typography></Stack></> : <Typography sx={{ opacity: 0.75 }}>No hay más actividades programadas para hoy.</Typography>}
      </CardContent>
    </Card>
  );
}
