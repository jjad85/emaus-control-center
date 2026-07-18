import { Paper, Stack, Typography } from '@mui/material';

export default function TarjetaIndicador({ titulo, valor, detalle, icono }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, height: '100%', borderRadius: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Typography fontSize={28} aria-hidden>{icono}</Typography>
        <div>
          <Typography variant="body2" color="text.secondary">{titulo}</Typography>
          <Typography variant="h4" fontWeight={800} lineHeight={1.15}>{valor}</Typography>
          {detalle && <Typography variant="caption" color="text.secondary">{detalle}</Typography>}
        </div>
      </Stack>
    </Paper>
  );
}
