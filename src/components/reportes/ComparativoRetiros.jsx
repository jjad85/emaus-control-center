import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { numero, porcentaje } from '../../utils/reportesMinutograma';

export default function ComparativoRetiros({ retiros = [] }) {
  if (!retiros.length) {
    return <Typography color="text.secondary">Todavía no existen retiros cerrados en el histórico.</Typography>;
  }
  return (
    <Stack spacing={1.5}>
      {retiros.map((retiro) => (
        <Paper key={retiro.retiroId} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
            <Box sx={{ minWidth: 220 }}>
              <Typography fontWeight={800}>{retiro.nombreRetiro}</Typography>
              <Typography variant="caption" color="text.secondary">{retiro.fechaCierre || retiro.fechaRetiro}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption">Cumplimiento: {porcentaje(retiro.cumplimientoPorcentaje)}</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, numero(retiro.cumplimientoPorcentaje))} sx={{ height: 9, borderRadius: 9, mb: 0.75 }} />
              <Typography variant="caption">Puntualidad: {porcentaje(retiro.puntualidadPorcentaje)}</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, numero(retiro.puntualidadPorcentaje))} sx={{ height: 9, borderRadius: 9 }} />
            </Box>
            <Stack minWidth={150} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Typography variant="body2">{retiro.finalizadas}/{retiro.totalActividades} finalizadas</Typography>
              <Typography variant="body2">Balance: {numero(retiro.balanceMinutos)} min</Typography>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
