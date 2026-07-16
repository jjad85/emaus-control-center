import { Alert, Button, Stack } from '@mui/material';

export default function ErrorState({ message, onRetry }) {
  return (
    <Stack spacing={2}>
      <Alert severity="error">{message}</Alert>
      {onRetry && <Button onClick={onRetry}>Reintentar</Button>}
    </Stack>
  );
}
