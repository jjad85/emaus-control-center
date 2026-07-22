import { Chip } from '@mui/material';
import { statusStyle } from '../utils/status';

function normalizarEtiqueta(value) {
  const estado = String(value || '').trim().toLowerCase();

  if (estado === 'pago parcial') return 'Parcial';
  if (estado === 'pago total') return 'Total';
  if (estado === 'pendiente') return 'Pendiente';

  return value || 'Sin definir';
}

export default function StatusChip({ value, label }) {
  return (
    <Chip
      label={label || normalizarEtiqueta(value)}
      size="small"
      sx={{
        ...statusStyle(value),
        fontWeight: 750,
        maxWidth: 230,
        height: 'auto',
        '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
      }}
    />
  );
}
