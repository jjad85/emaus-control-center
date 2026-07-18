import { Chip } from '@mui/material';
import { statusStyle } from '../utils/status';

export default function StatusChip({ value }) {
  return (
    <Chip
      label={value || 'Sin definir'}
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
