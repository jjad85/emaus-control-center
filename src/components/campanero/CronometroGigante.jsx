import { Box, Typography } from '@mui/material';
import { formatoReloj } from '../../utils/minutogramaTiempo';

export default function CronometroGigante({ restantes = 0, pausada = false }) {
  const retraso = restantes < 0;
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
      <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.8 }}>
        {pausada ? 'TIEMPO PAUSADO' : retraso ? 'TIEMPO EXCEDIDO' : 'TIEMPO RESTANTE'}
      </Typography>
      <Typography sx={{ fontSize: { xs: '3.4rem', sm: '5rem', md: '7rem' }, lineHeight: 1, fontWeight: 950, fontVariantNumeric: 'tabular-nums', letterSpacing: { xs: -2, md: -5 } }}>
        {formatoReloj(restantes, true)}
      </Typography>
    </Box>
  );
}
