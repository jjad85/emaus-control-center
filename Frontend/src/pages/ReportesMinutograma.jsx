import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Grid, Paper, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ArchiveIcon from '@mui/icons-material/Archive';
import RefreshIcon from '@mui/icons-material/Refresh';
import { obtenerMinutograma, obtenerResumenMinutogramaApi } from '../api/minutogramaApi';
import { cerrarRetiroMinutogramaApi, obtenerComparativoRetirosApi } from '../api/reportesMinutogramaApi';
import { useAuth } from '../context/AuthContext';
import TarjetaIndicador from '../components/reportes/TarjetaIndicador';
import ComparativoRetiros from '../components/reportes/ComparativoRetiros';
import { construirRecomendaciones, descargarCsv, minutosTexto, porcentaje } from '../utils/reportesMinutograma';

function valorToken(auth) {
  return auth?.token || auth?.sesion?.token || localStorage.getItem('token') || '';
}

export default function ReportesMinutograma() {
  const auth = useAuth();
  const [tab, setTab] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState({});
  const [actividades, setActividades] = useState([]);
  const [comparativo, setComparativo] = useState([]);
  const [dialogo, setDialogo] = useState(false);
  const [nombreRetiro, setNombreRetiro] = useState('Retiro Emaús');
  const [fechaRetiro, setFechaRetiro] = useState(new Date().toISOString().slice(0, 10));
  const [guardando, setGuardando] = useState(false);

  const recomendaciones = useMemo(() => construirRecomendaciones(resumen, actividades), [resumen, actividades]);

  async function cargar() {
    setCargando(true); setError('');
    try {
      const [r, a, c] = await Promise.all([
        obtenerResumenMinutogramaApi(),
        obtenerMinutograma(),
        obtenerComparativoRetirosApi(),
      ]);
      setResumen(r || {});
      setActividades(Array.isArray(a?.items) ? a.items : Array.isArray(a) ? a : []);
      setComparativo(Array.isArray(c?.items) ? c.items : Array.isArray(c) ? c : []);
    } catch (e) {
      setError(e?.message || 'No fue posible cargar los reportes.');
    } finally { setCargando(false); }
  }

  useEffect(() => { cargar(); }, []);

  function exportarDetalle() {
    descargarCsv(`paso_a_paso_${fechaRetiro}.csv`, actividades.map((a) => ({
      Día: a.dia, Inicio: a.horaInicio, Actividad: a.actividad, Responsable: a.responsable,
      Equipo: a.equipo, Lugar: a.lugar, Estado: a.estado,
      'Duración programada': a.duracionMinutos, 'Duración real': a.duracionRealMinutos,
      'Variación minutos': a.variacionMinutos, Observaciones: a.observaciones,
    })));
  }

  async function cerrarRetiro() {
    if (!nombreRetiro.trim() || !fechaRetiro) return;
    setGuardando(true); setError('');
    try {
      await cerrarRetiroMinutogramaApi(valorToken(auth), { nombreRetiro: nombreRetiro.trim(), fechaRetiro });
      setDialogo(false);
      await cargar();
    } catch (e) { setError(e?.message || 'No fue posible cerrar el retiro.'); }
    finally { setGuardando(false); }
  }

  if (cargando) return <Stack alignItems="center" py={8}><CircularProgress /><Typography mt={2}>Construyendo reporte...</Typography></Stack>;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1500, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2.5} className="no-print">
        <Box><Typography variant="h4" fontWeight={900}>Reportes del paso a paso</Typography><Typography color="text.secondary">Cierre, exportación y comparación histórica del retiro.</Typography></Box>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={cargar}>Actualizar</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportarDetalle}>Exportar CSV</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Guardar PDF</Button>
          <Button variant="contained" startIcon={<ArchiveIcon />} onClick={() => setDialogo(true)}>Cerrar retiro</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2 }} className="no-print">
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable">
          <Tab label="Reporte ejecutivo" /><Tab label="Comparativo histórico" /><Tab label="Detalle operativo" />
        </Tabs>
      </Paper>

      {tab === 0 && <Stack spacing={2.5}>
        <Box className="print-only" sx={{ display: 'none' }}><Typography variant="h4" fontWeight={900}>Reporte ejecutivo — {nombreRetiro}</Typography><Typography>{fechaRetiro}</Typography></Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><TarjetaIndicador icono="✅" titulo="Cumplimiento" valor={porcentaje(resumen.cumplimientoPorcentaje)} detalle={`${resumen.finalizadas || 0} actividades finalizadas`} /></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><TarjetaIndicador icono="⏱️" titulo="Puntualidad" valor={porcentaje(resumen.puntualidadPorcentaje)} detalle="Actividades terminadas dentro del tiempo" /></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><TarjetaIndicador icono="📋" titulo="Total actividades" valor={resumen.total || 0} detalle={`${resumen.pendientes || 0} pendientes`} /></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><TarjetaIndicador icono="⚖️" titulo="Balance de tiempo" valor={minutosTexto(resumen.balanceMinutos)} detalle="Programado menos ejecutado" /></Grid>
        </Grid>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800}>Estado general</Typography><Divider sx={{ my: 1.5 }} />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip label={`${resumen.pendientes || 0} pendientes`} /><Chip label={`${resumen.enCurso || 0} en curso`} /><Chip label={`${resumen.pausadas || 0} pausadas`} /><Chip label={`${resumen.finalizadas || 0} finalizadas`} /><Chip label={`${resumen.canceladas || 0} canceladas`} />
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800}>Recomendaciones operativas</Typography><Divider sx={{ my: 1.5 }} />
          <Stack spacing={1.25}>{recomendaciones.map((r, i) => <Alert key={`${r.titulo}-${i}`} severity={r.nivel === 'Alta' ? 'error' : r.nivel === 'Media' ? 'warning' : 'success'}><strong>{r.titulo}.</strong> {r.detalle}</Alert>)}</Stack>
        </Paper>
      </Stack>}

      {tab === 1 && <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}><Typography variant="h6" fontWeight={800} mb={2}>Últimos retiros cerrados</Typography><ComparativoRetiros retiros={comparativo} /></Paper>}

      {tab === 2 && <Paper variant="outlined" sx={{ overflow: 'auto', borderRadius: 3 }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 950, '& th, & td': { p: 1.25, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' }, '& th': { bgcolor: 'action.hover' } }}>
          <thead><tr><th>Día / hora</th><th>Actividad</th><th>Responsable</th><th>Equipo</th><th>Estado</th><th>Programado</th><th>Real</th><th>Variación</th></tr></thead>
          <tbody>{actividades.map((a) => <tr key={a.id}><td>{a.dia}<br />{a.horaInicio}</td><td>{a.actividad}</td><td>{a.responsable}</td><td>{a.equipo}</td><td>{a.estado}</td><td>{a.duracionMinutos} min</td><td>{a.duracionRealMinutos || 0} min</td><td>{minutosTexto(a.variacionMinutos)}</td></tr>)}</tbody>
        </Box>
      </Paper>}

      <Dialog open={dialogo} onClose={() => !guardando && setDialogo(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cerrar y archivar retiro</DialogTitle>
        <DialogContent><Alert severity="info" sx={{ mb: 2 }}>Se guardará una fotografía histórica de los indicadores y de cada actividad. El paso a paso actual no se elimina.</Alert><Stack spacing={2}><TextField label="Nombre del retiro" value={nombreRetiro} onChange={(e) => setNombreRetiro(e.target.value)} fullWidth /><TextField label="Fecha del retiro" type="date" value={fechaRetiro} onChange={(e) => setFechaRetiro(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialogo(false)} disabled={guardando}>Cancelar</Button><Button variant="contained" onClick={cerrarRetiro} disabled={guardando || !nombreRetiro.trim()}>{guardando ? 'Guardando...' : 'Cerrar retiro'}</Button></DialogActions>
      </Dialog>

      <style>{`@media print { .no-print { display:none !important; } .print-only { display:block !important; } body { background:white !important; } }`}</style>
    </Box>
  );
}
