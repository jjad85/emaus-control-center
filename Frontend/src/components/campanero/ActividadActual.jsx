import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { LocationOnRounded, PersonRounded, GroupsRounded } from '@mui/icons-material';
import { formatoHora } from '../../utils/minutogramaTiempo';

export default function ActividadActual({ actividad }) {
  if (!actividad) return null;
  return (
    <Card elevation={0} sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'inherit', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4 }}>
      <CardContent sx={{ p: { xs: 2, md: 4 }, '&:last-child': { pb: { xs: 2, md: 4 } } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} mb={2}>
          <Typography variant="overline" fontWeight={900}>ACTIVIDAD ACTUAL</Typography>
          <Chip label={`${formatoHora(actividad.horaInicio)} – ${formatoHora(actividad.horaFin)}`} sx={{ bgcolor: 'rgba(255,255,255,.18)', color: 'inherit', fontWeight: 800 }} />
        </Stack>
        <Typography sx={{ fontSize: { xs: '1.8rem', sm: '2.6rem', md: '3.7rem' }, lineHeight: 1.08, fontWeight: 950, mb: 3 }}>
          {actividad.actividad}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 1, sm: 3 }} flexWrap="wrap">
          <Stack direction="row" gap={1} alignItems="center"><PersonRounded /><Typography fontWeight={750}>{actividad.responsable || 'Sin responsable'}</Typography></Stack>
          <Stack direction="row" gap={1} alignItems="center"><GroupsRounded /><Typography fontWeight={750}>{actividad.equipo || 'Sin equipo'}</Typography></Stack>
          <Stack direction="row" gap={1} alignItems="center"><LocationOnRounded /><Typography fontWeight={750}>{actividad.lugar || 'Sin lugar'}</Typography></Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
