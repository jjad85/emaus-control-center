import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem,
  Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography
} from '@mui/material';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import HistorialRecursoDialog from '../recursos/HistorialRecursoDialog';
import ReporteRecursosButton from '../recursos/ReporteRecursosButton';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  actualizarPalancaLogisticaApi,
  obtenerGestionPalancasLogisticaApi,
} from '../../api/palancasLogisticaApi';

const COLORES_ESTADO = {
  'Pendiente de información': 'default',
  Solicitada: 'info',
  'En preparación': 'warning',
  Preparada: 'info',
  'Pendiente de validación': 'warning',
  'Requiere ajuste': 'error',
  'Aprobada por Logística': 'success',
  'Entregada para ejecución': 'success',
};

function descargarCsv(items) {
  const encabezados = ['Tema','Responsable','Palanca','Cantidad','Destinatarios','Momento','Forma de entrega','Responsable de entrega','Estado','Instrucciones','Observaciones de Logística'];
  const filas = items.map((x) => [x.temaNombre,x.responsableNombre,x.nombre,x.cantidad,x.destinatarios,[x.momentoEntrega,x.detalleMomento].filter(Boolean).join(' - '),x.formaEntrega,[x.responsableEntrega,x.detalleResponsable].filter(Boolean).join(' - '),x.estado,x.instrucciones,x.observacionesLogistica]);
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const contenido = [encabezados, ...filas].map((fila) => fila.map(escapar).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', contenido], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'palancas_logistica.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function Resumen({ resumen = {} }) {
  const items = [
    ['Total', resumen.total || 0],
    ['Pendientes', resumen.pendientes || 0],
    ['En preparación', resumen.enPreparacion || 0],
    ['Por validar', resumen.porValidar || 0],
    ['Requieren ajuste', resumen.requierenAjuste || 0],
    ['Aprobadas', resumen.aprobadas || 0],
    ['Entregadas', resumen.entregadas || 0],
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)', lg: 'repeat(7,1fr)' }, gap: 1 }}>
      {items.map(([etiqueta, valor]) => (
        <Paper key={etiqueta} variant="outlined" sx={{ p: 1.3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={850}>{valor}</Typography>
          <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
        </Paper>
      ))}
    </Box>
  );
}

export default function PalancasLogisticaPanel() {
  const { token } = useAuth();
  const [datos, setDatos] = useState({ items: [], estados: [], resumen: {} });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [seleccionada, setSeleccionada] = useState(null);
  const [estado, setEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [historial, setHistorial] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setDatos(await obtenerGestionPalancasLogisticaApi(token)); }
    catch (e) { setError(e.message || 'No fue posible consultar las palancas.'); }
    finally { setCargando(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const items = useMemo(() => (datos.items || []).filter((item) => {
    if (filtroEstado !== 'TODOS' && item.estado !== filtroEstado) return false;
    const texto = `${item.temaNombre} ${item.responsableNombre} ${item.nombre} ${item.destinatarios}`.toLowerCase();
    return !busqueda || texto.includes(busqueda.toLowerCase());
  }), [datos.items, filtroEstado, busqueda]);

  const abrir = (item) => {
    setSeleccionada(item);
    setEstado(item.estado);
    setObservaciones(item.observacionesLogistica || '');
  };

  const guardar = async () => {
    if (estado === 'Requiere ajuste' && !observaciones.trim()) {
      setError('Debes indicar el ajuste requerido.'); return;
    }
    setGuardando(true); setError('');
    try {
      await actualizarPalancaLogisticaApi(token, seleccionada.temaId, { estado, observaciones });
      setSeleccionada(null);
      await cargar();
    } catch (e) { setError(e.message || 'No fue posible actualizar la palanca.'); }
    finally { setGuardando(false); }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <CardGiftcardRounded color="primary" />
              <Typography variant="h6" fontWeight={850}>Palancas de los temas</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">Preparación, validación, aprobación y entrega operativa.</Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv(datos.items || [])}>Exportar vista</Button><ReporteRecursosButton tipo="PALANCA" />
            <Button startIcon={<RefreshRounded />} variant="outlined" onClick={cargar}>Actualizar</Button>
          </Stack>
        </Stack>
        <Box mt={2}><Resumen resumen={datos.resumen} /></Box>
      </Box>

      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.2} sx={{ p: 2 }}>
        <TextField size="small" label="Buscar tema, responsable o palanca" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ minWidth: { sm: 320 } }} />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <MenuItem value="TODOS">Todos</MenuItem>
            {(datos.estados || []).map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {cargando ? <Stack alignItems="center" py={5}><CircularProgress /></Stack> : (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Tema y responsable</TableCell><TableCell>Palanca</TableCell><TableCell>Entrega</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acción</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.temaId} hover>
                  <TableCell><Typography fontWeight={750}>{item.temaNombre}</Typography><Typography variant="caption" color="text.secondary">{item.responsableNombre || 'Sin responsable'} · {item.diaDelTema} {item.horaPropuesta}</Typography></TableCell>
                  <TableCell><Typography fontWeight={700}>{item.nombre}</Typography><Typography variant="caption" color="text.secondary">Cantidad: {item.cantidad || 'Por definir'} · {item.destinatarios || 'Sin destinatarios'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{item.momentoEntrega || 'Sin momento'}</Typography><Typography variant="caption" color="text.secondary">{item.formaEntrega || 'Sin forma definida'}</Typography></TableCell>
                  <TableCell><Chip size="small" label={item.estado} color={COLORES_ESTADO[item.estado] || 'default'} variant={item.estado === 'Aprobada por Logística' || item.estado === 'Entregada para ejecución' ? 'filled' : 'outlined'} /></TableCell>
                  <TableCell align="right"><Stack direction="row" justifyContent="flex-end"><Button size="small" startIcon={<HistoryRounded />} onClick={() => setHistorial(item)}>Historial</Button><Button size="small" startIcon={<EditRounded />} onClick={() => abrir(item)}>Gestionar</Button></Stack></TableCell>
                </TableRow>
              ))}
              {!items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>No hay palancas para los filtros seleccionados.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(seleccionada)} onClose={() => !guardando && setSeleccionada(null)} fullWidth maxWidth="md">
        <DialogTitle>Gestionar palanca · {seleccionada?.temaNombre}</DialogTitle>
        <DialogContent dividers>
          {seleccionada && <Stack spacing={2}>
            <Box><Typography variant="subtitle2">{seleccionada.nombre}</Typography><Typography variant="body2" color="text.secondary">{seleccionada.descripcion || 'Sin descripción'}</Typography></Box>
            <Divider />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <Box><Typography variant="caption" color="text.secondary">Momento</Typography><Typography>{[seleccionada.momentoEntrega, seleccionada.detalleMomento].filter(Boolean).join(' · ') || 'Sin definir'}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Forma de entrega</Typography><Typography>{seleccionada.formaEntrega || 'Sin definir'}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Quién la reparte</Typography><Typography>{[seleccionada.responsableEntrega, seleccionada.detalleResponsable].filter(Boolean).join(' · ') || 'Sin definir'}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Cantidad y destinatarios</Typography><Typography>{seleccionada.cantidad || 'Por definir'} · {seleccionada.destinatarios || 'Sin definir'}</Typography></Box>
            </Box>
            <Box><Typography variant="caption" color="text.secondary">Instrucciones para Logística</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{seleccionada.instrucciones || 'Sin instrucciones'}</Typography></Box>
            {seleccionada.observacionesResponsable && <Alert severity="info">{seleccionada.observacionesResponsable}</Alert>}
            <FormControl fullWidth><InputLabel>Estado</InputLabel><Select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>{(datos.estados || []).map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></FormControl>
            <TextField fullWidth multiline minRows={3} label={estado === 'Requiere ajuste' ? 'Ajuste requerido *' : 'Observaciones de Logística'} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            {seleccionada.aprobadaPor && <Typography variant="caption" color="success.main">Aprobada por {seleccionada.aprobadaPor}</Typography>}
          </Stack>}
        </DialogContent>
        <DialogActions><Button onClick={() => setSeleccionada(null)} disabled={guardando}>Cancelar</Button><Button variant="contained" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button></DialogActions>
      </Dialog>
      <HistorialRecursoDialog open={Boolean(historial)} onClose={() => setHistorial(null)} temaId={historial?.temaId} tipoRecurso="PALANCA" titulo={historial?.temaNombre} />
    </Paper>
  );
}
