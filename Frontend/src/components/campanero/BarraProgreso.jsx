import { Box, LinearProgress, Stack, Typography } from '@mui/material';

export default function BarraProgreso({ porcentaje = 0, retraso = false }) {
  const valor = Math.min(100, Math.max(0, porcentaje));
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={0.75}>
        <Typography fontWeight={800}>Avance de la actividad</Typography>
        <Typography fontWeight={900}>{Math.round(valor)}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={valor} color={retraso ? 'error' : valor >= 75 ? 'warning' : 'primary'} sx={{ height: { xs: 12, md: 18 }, borderRadius: 999 }} />
    </Box>
  );
}
