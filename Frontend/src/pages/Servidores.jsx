import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { obtenerServidores } from '../api/servidoresApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';

export default function Servidores() {
  const api = useApi(() => obtenerServidores(), []);
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;
  const items = api.data.items || [];
  return (
    <>
      <PageHeader eyebrow="Equipo humano" title="Servidores" subtitle={`${items.length} registros`} onRefresh={api.reload} loading={api.loading} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Correo</TableCell><TableCell>Celular</TableCell><TableCell>Pago</TableCell><TableCell>Equipo</TableCell><TableCell>Rol</TableCell><TableCell>Mesa</TableCell><TableCell>Habitación</TableCell><TableCell>Temas</TableCell></TableRow></TableHead>
          <TableBody>{items.map((i) => <TableRow key={i.id} hover><TableCell>{i.nombre}</TableCell><TableCell>{i.correo || '—'}</TableCell><TableCell>{i.celular || '—'}</TableCell><TableCell><StatusChip value={i.estadoPago} /></TableCell><TableCell>{i.equipo}</TableCell><TableCell>{i.rol}</TableCell><TableCell>{i.mesa || '—'}</TableCell><TableCell>{i.habitacion || '—'}</TableCell><TableCell>{i.temas.join(', ') || '—'}</TableCell></TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
