import { CircularProgress, Stack, Typography } from '@mui/material';

export default function LoadingState({ text = 'Cargando información…' }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}>
      <CircularProgress />
      <Typography color="text.secondary" mt={2}>{text}</Typography>
    </Stack>
  );
}
