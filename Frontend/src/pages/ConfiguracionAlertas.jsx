import { Alert, Box, Button, Checkbox, CircularProgress, Chip, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { guardarConfiguracionAlertasApi, obtenerConfiguracionAlertasApi } from '../api/configuracionAlertasApi';

export default function ConfiguracionAlertas() {
  const { token, tienePermiso } = useAuth();
  const api = useApi(() => obtenerConfiguracionAlertasApi(token), [token]);
  const [matriz, setMatriz] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const datos = api.data || {};
  const roles = datos.roles || [];
  const alertas = datos.alertas || [];

  useEffect(() => { if (api.data) setMatriz(api.data.rolesPorAlerta || {}); }, [api.data]);
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return !q ? alertas : alertas.filter((a) => `${a.nombre} ${a.descripcion} ${a.categoria}`.toLowerCase().includes(q));
  }, [alertas, busqueda]);

  if (!tienePermiso('SISTEMA_TODO')) return <Alert severity="error">No tiene permisos para configurar alertas.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function cambiar(codigo, rol) {
    setMatriz((actual) => {
      const lista = actual[codigo] || [];
      return { ...actual, [codigo]: lista.includes(rol) ? lista.filter((x) => x !== rol) : [...lista, rol] };
    });
  }
  async function guardar() {
    setGuardando(true); setMensaje(''); setError('');
    try { const actualizado = await guardarConfiguracionAlertasApi(token, matriz); setMatriz(actualizado.rolesPorAlerta || {}); setMensaje('La configuración de alertas fue actualizada. Los cambios aplican inmediatamente en la campana.'); }
    catch (e) { setError(e.message || 'No fue posible guardar la configuración.'); }
    finally { setGuardando(false); }
  }

  return <>
    <PageHeader eyebrow="Sistema · Administración" title="Configuración de alertas" subtitle="Defina qué roles reciben cada alerta en la campana" onRefresh={api.reload} loading={api.loading} />
    <Stack spacing={2.5}>
      {mensaje && <Alert severity="success">{mensaje}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p:2.5 }}>
        <Stack direction={{ xs:'column', md:'row' }} justifyContent="space-between" gap={2} alignItems={{ md:'center' }}>
          <Box><Stack direction="row" spacing={1} alignItems="center"><NotificationsActiveRounded color="primary"/><Typography variant="h6" fontWeight={900}>Matriz alertas × roles</Typography></Stack><Typography variant="body2" color="text.secondary" mt={0.5}>Una casilla activa significa que los usuarios de ese rol podrán ver la alerta cuando se cumpla su condición.</Typography></Box>
          <Button variant="contained" startIcon={guardando ? <CircularProgress size={18} color="inherit"/> : <SaveRounded/>} disabled={guardando} onClick={guardar}>Guardar matriz</Button>
        </Stack>
        <Divider sx={{ my:2 }}/>
        <TextField fullWidth size="small" label="Buscar alerta" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ mb:2 }}/>
        <TableContainer sx={{ maxHeight:'68vh', border:1, borderColor:'divider', borderRadius:2 }}>
          <Table stickyHeader size="small">
            <TableHead><TableRow><TableCell sx={{ minWidth:150, fontWeight:900 }}>Categoría</TableCell><TableCell sx={{ minWidth:330, fontWeight:900 }}>Alerta y condición</TableCell>{roles.map((r) => <TableCell key={r.rol} align="center" sx={{ minWidth:115, fontWeight:900 }}>{r.rol}</TableCell>)}</TableRow></TableHead>
            <TableBody>{filtradas.map((a) => <TableRow key={a.codigo} hover><TableCell><Chip size="small" label={a.categoria}/></TableCell><TableCell><Typography fontWeight={800}>{a.nombre}</Typography><Typography variant="body2" color="text.secondary">{a.descripcion}</Typography></TableCell>{roles.map((r) => <TableCell key={`${a.codigo}-${r.rol}`} align="center"><Checkbox checked={(matriz[a.codigo] || []).includes(r.rol)} onChange={() => cambiar(a.codigo, r.rol)} inputProps={{ 'aria-label': `${a.nombre} para ${r.rol}` }}/></TableCell>)}</TableRow>)}</TableBody>
          </Table>
        </TableContainer>
        {!filtradas.length && <Alert severity="info" sx={{ mt:2 }}>No se encontraron alertas con ese criterio.</Alert>}
      </Paper>
    </Stack>
  </>;
}
