import { Alert, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Button, Stack, Typography } from '@mui/material';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { obtenerHistorialRecursoTemaApi } from '../../api/seguimientoRecursosTemaApi';

const formatear = (valor) => valor ? new Intl.DateTimeFormat('es-CO', { dateStyle:'medium', timeStyle:'short' }).format(new Date(valor)) : '';

export default function HistorialRecursoDialog({ open, onClose, temaId, tipoRecurso, titulo }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]); const [cargando, setCargando] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !temaId || !tipoRecurso) return;
    setCargando(true); setError('');
    obtenerHistorialRecursoTemaApi(token, temaId, tipoRecurso).then(setItems).catch((e) => setError(e.message || 'No fue posible consultar el historial.')).finally(() => setCargando(false));
  }, [open, token, temaId, tipoRecurso]);
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle><Stack direction="row" spacing={1} alignItems="center"><HistoryRounded /><span>Historial · {titulo || tipoRecurso}</span></Stack></DialogTitle>
    <DialogContent dividers>
      {cargando && <Stack alignItems="center" py={4}><CircularProgress /></Stack>}
      {error && <Alert severity="error">{error}</Alert>}
      {!cargando && !error && !items.length && <Alert severity="info">Este recurso todavía no tiene cambios registrados en el historial.</Alert>}
      <Stack spacing={1.5}>{items.map((x) => <Box key={x.id} sx={{ border:'1px solid', borderColor:'divider', borderRadius:2, p:1.5 }}>
        <Typography fontWeight={800}>{x.estadoAnterior || 'Sin estado'} → {x.estadoNuevo || 'Sin estado'}</Typography>
        <Typography variant="caption" color="text.secondary">{formatear(x.fecha)} · {x.nombreUsuario || x.usuario || 'Sistema'}</Typography>
        {x.observaciones && <Typography variant="body2" mt={1}>{x.observaciones}</Typography>}
        {x.archivoNombre && <Typography variant="caption" display="block" mt={0.5}>Archivo: {x.archivoNombre}</Typography>}
      </Box>)}</Stack>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>;
}
