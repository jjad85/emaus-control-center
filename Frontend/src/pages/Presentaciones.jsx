import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { obtenerPresentaciones } from '../api/presentacionesApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';

export default function Presentaciones() {
  const api = useApi(() => obtenerPresentaciones(), []);
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;
  const items = api.data.items || [];
  return (
    <>
      <PageHeader eyebrow="Control audiovisual" title="Presentaciones" subtitle={`Avance general: ${api.data.indicadores.avanceGeneral}%`} onRefresh={api.reload} loading={api.loading} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Conferencista</TableCell><TableCell>Tema</TableCell><TableCell>Entrega</TableCell><TableCell>Apoyo</TableCell><TableCell>Ajustado</TableCell><TableCell>Aprobado</TableCell><TableCell>Observaciones</TableCell></TableRow></TableHead>
          <TableBody>{items.map((i) => <TableRow key={i.id} hover><TableCell>{i.nombre}</TableCell><TableCell>{i.tema}</TableCell><TableCell><StatusChip value={i.entrega} /></TableCell><TableCell><StatusChip value={i.apoyoAudiovisual} /></TableCell><TableCell><StatusChip value={i.ajustadoAudiovisuales} /></TableCell><TableCell><StatusChip value={i.aprobadoConferencista} /></TableCell><TableCell>{i.observaciones || '—'}</TableCell></TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
