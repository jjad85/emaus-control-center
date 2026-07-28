import { Backdrop, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function ProcessingOverlay() {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    const handler = (event) => setAbierto(Boolean(event.detail?.activo));
    window.addEventListener('emaus:procesando', handler);
    return () => window.removeEventListener('emaus:procesando', handler);
  }, []);
  return (
    <Backdrop open={abierto} sx={{ zIndex: theme => theme.zIndex.modal + 100, bgcolor: 'rgba(0,0,0,.58)' }}>
      <Paper role="status" aria-live="polite" sx={{ p: 4, borderRadius: 4, minWidth: 280 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="h6" fontWeight={800}>Procesando información...</Typography>
          <Typography color="text.secondary" textAlign="center">Por favor espera. No cierres ni actualices la página.</Typography>
        </Stack>
      </Paper>
    </Backdrop>
  );
}
