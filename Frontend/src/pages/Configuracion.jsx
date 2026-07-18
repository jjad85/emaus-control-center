import { Paper, Stack, Typography } from '@mui/material';
import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';

export default function Configuracion() {
  const api = useApi(() => obtenerConfiguraciones(), []);
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  return (
    <>
      <PageHeader eyebrow="Parámetros" title="Configuración" subtitle="Consulta de parámetros activos" onRefresh={api.reload} loading={api.loading} />
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          {Object.entries(api.data).map(([key, value]) => (
            <Stack key={key} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" sx={{ borderBottom: '1px solid #eee', py: 1 }}>
              <Typography color="text.secondary" fontWeight={700}>{key}</Typography>
              <Typography fontWeight={750}>{String(value ?? '—')}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </>
  );
}
