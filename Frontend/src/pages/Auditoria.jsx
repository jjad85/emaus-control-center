import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded';
import FilterAltOffRounded from '@mui/icons-material/FilterAltOffRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CompareArrowsRounded from '@mui/icons-material/CompareArrowsRounded';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { obtenerAuditoriaApi } from '../api/auditoriaApi';

const TAMANOS_PAGINA = [10, 25, 50, 100];

function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(fecha);
}

function intentarJson(valor) {
  if (!valor) return null;
  if (typeof valor === 'object') return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

function textoBonito(valor) {
  if (!valor) return '—';
  const json = intentarJson(valor);
  return json ? JSON.stringify(json, null, 2) : String(valor);
}

function escaparCsv(valor) {
  const texto = String(valor ?? '').replace(/\r?\n/g, ' ').trim();
  return `"${texto.replace(/"/g, '""')}"`;
}

function descargarCsv(items) {
  const encabezados = [
    'Fecha y hora', 'Usuario', 'Nombre', 'Rol', 'Acción',
    'Entidad', 'ID registro', 'Resultado', 'Detalle',
    'Datos antes', 'Datos después', 'Cambios', 'IP',
    'Sesión ID', 'Origen', 'Método', 'Ruta', 'Duración ms', 'Error',
  ];

  const filas = items.map((item) => [
    formatearFecha(item.fecha), item.usuario, item.nombre, item.rol,
    item.accion, item.entidad, item.idRegistro, item.resultado,
    item.detalle, item.datosAntes, item.datosDespues, item.cambios,
    item.ip, item.sesionId, item.origen, item.metodo, item.ruta,
    item.duracionMs, item.error,
  ]);

  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCsv).join(';'))
    .join('\r\n');

  const blob = new Blob([`\uFEFF${contenido}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `Auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function BloqueJson({ titulo, valor }) {
  return (
    <Box>
      <Typography fontWeight={900} mb={.75}>{titulo}</Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: 'rgba(15,42,37,.025)',
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        <Typography
          component="pre"
          variant="body2"
          sx={{
            m: 0,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {textoBonito(valor)}
        </Typography>
      </Paper>
    </Box>
  );
}

function DetalleAuditoria({ item, open, onClose }) {
  if (!item) return null;

  const cambios = intentarJson(item.cambios);
  const listaCambios = Array.isArray(cambios) ? cambios : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="h5" fontWeight={950}>Detalle de auditoría</Typography>
        <Typography variant="body2" color="text.secondary">
          {item.accion || 'Acción'} · {item.entidad || 'Entidad'} · {item.idRegistro || 'Sin ID'}
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 14, top: 14 }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={2} flexWrap="wrap">
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Fecha y hora</Typography>
                <Typography fontWeight={800}>{formatearFecha(item.fecha)}</Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Usuario</Typography>
                <Typography fontWeight={800}>{item.nombre || '—'}</Typography>
                <Typography variant="caption">{item.usuario || '—'}</Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Rol</Typography>
                <Typography fontWeight={800}>{item.rol || '—'}</Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Resultado</Typography>
                <Box mt={.4}>
                  <Chip
                    size="small"
                    color={String(item.resultado).toUpperCase() === 'ERROR' ? 'error' : 'success'}
                    label={item.resultado || 'EXITOSO'}
                  />
                </Box>
              </Box>
            </Stack>
          </Paper>

          {item.detalle && (
            <Box>
              <Typography fontWeight={900} mb={.5}>Detalle</Typography>
              <Typography color="text.secondary">{item.detalle}</Typography>
            </Box>
          )}

          {listaCambios.length > 0 && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CompareArrowsRounded color="primary" />
                <Typography fontWeight={950}>Campos modificados</Typography>
              </Stack>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Campo</TableCell>
                      <TableCell>Antes</TableCell>
                      <TableCell>Después</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listaCambios.map((cambio, index) => (
                      <TableRow key={`${cambio.campo}-${index}`}>
                        <TableCell sx={{ fontWeight: 850 }}>{cambio.campo}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {textoBonito(cambio.antes)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {textoBonito(cambio.despues)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box flex={1}><BloqueJson titulo="Datos antes" valor={item.datosAntes} /></Box>
            <Box flex={1}><BloqueJson titulo="Datos después" valor={item.datosDespues} /></Box>
          </Stack>

          <Divider />

          <Box>
            <Typography fontWeight={900} mb={1}>Contexto técnico</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} flexWrap="wrap">
              <Typography variant="body2"><b>IP:</b> {item.ip || 'No disponible'}</Typography>
              <Typography variant="body2"><b>Sesión:</b> {item.sesionId || '—'}</Typography>
              <Typography variant="body2"><b>Origen:</b> {item.origen || '—'}</Typography>
              <Typography variant="body2"><b>Método:</b> {item.metodo || '—'}</Typography>
              <Typography variant="body2"><b>Ruta:</b> {item.ruta || '—'}</Typography>
              <Typography variant="body2"><b>Duración:</b> {item.duracionMs ? `${item.duracionMs} ms` : '—'}</Typography>
            </Stack>
            {item.error && <Alert severity="error" sx={{ mt: 1.5 }}>{item.error}</Alert>}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function Auditoria() {
  const { token } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [pagina, setPagina] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(25);
  const [total, setTotal] = useState(0);
  const temporizadorBusqueda = useRef(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerAuditoriaApi(token, {
        pagina: pagina + 1, tamanoPagina,
        busqueda: busquedaAplicada, fechaDesde, fechaHasta,
      });
      setRegistros(Array.isArray(datos?.items) ? datos.items : []);
      setTotal(Number(datos?.total || 0));
      const paginaBackend = Math.max(1, Number(datos?.pagina || 1)) - 1;
      if (paginaBackend !== pagina) setPagina(paginaBackend);
    } catch (err) {
      setError(err?.message || 'No fue posible consultar la auditoría.');
      setRegistros([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, [token, pagina, tamanoPagina, busquedaAplicada, fechaDesde, fechaHasta]);

  useEffect(() => { if (token) cargar(); }, [token, cargar]);

  useEffect(() => {
    clearTimeout(temporizadorBusqueda.current);
    temporizadorBusqueda.current = setTimeout(() => {
      setPagina(0);
      setBusquedaAplicada(busqueda.trim());
    }, 450);
    return () => clearTimeout(temporizadorBusqueda.current);
  }, [busqueda]);

  function limpiarFiltros() {
    setBusqueda(''); setBusquedaAplicada('');
    setFechaDesde(''); setFechaHasta(''); setPagina(0); setAviso('');
  }

  async function exportar() {
    setExportando(true); setError(''); setAviso('');
    try {
      const datos = await obtenerAuditoriaApi(token, {
        busqueda: busquedaAplicada, fechaDesde, fechaHasta, exportar: true,
      });
      const items = Array.isArray(datos?.items) ? datos.items : [];
      if (!items.length) {
        setAviso('No existen registros para exportar con los filtros seleccionados.');
        return;
      }
      descargarCsv(items);
      if (datos?.truncado) {
        setAviso(`Se exportaron los primeros ${datos.limiteExportacion} registros de ${datos.total}.`);
      }
    } catch (err) {
      setError(err?.message || 'No fue posible exportar la auditoría.');
    } finally {
      setExportando(false);
    }
  }

  const hayFiltros = Boolean(busqueda || fechaDesde || fechaHasta);

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
        <Box>
          <Typography variant="h4" fontWeight={950}>Auditoría</Typography>
          <Typography color="text.secondary">
            Trazabilidad de usuarios, operaciones y cambios realizados en el sistema.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" startIcon={<RefreshRounded />} onClick={cargar} disabled={cargando}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<FileDownloadRounded />} onClick={exportar} disabled={cargando || exportando || total === 0}>
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
            <TextField
              fullWidth size="small" label="Buscar"
              placeholder="Usuario, acción, entidad, ID, cambios..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{ startAdornment: <SearchRounded sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
            <TextField size="small" type="date" label="Desde" value={fechaDesde}
              onChange={(e) => { setPagina(0); setFechaDesde(e.target.value); }}
              InputLabelProps={{ shrink: true }} inputProps={{ max: fechaHasta || undefined }}
            />
            <TextField size="small" type="date" label="Hasta" value={fechaHasta}
              onChange={(e) => { setPagina(0); setFechaHasta(e.target.value); }}
              InputLabelProps={{ shrink: true }} inputProps={{ min: fechaDesde || undefined }}
            />
            <Button variant="text" startIcon={<FilterAltOffRounded />} onClick={limpiarFiltros} disabled={!hayFiltros}>
              Limpiar
            </Button>
          </Stack>
          <Chip sx={{ alignSelf: 'flex-start' }} label={`${total} ${total === 1 ? 'registro' : 'registros'}`} />
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {aviso && <Alert severity="info" onClose={() => setAviso('')}>{aviso}</Alert>}

      {cargando ? (
        <Stack alignItems="center" py={8} spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Consultando auditoría...</Typography>
        </Stack>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Entidad</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell align="center">Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registros.map((item, index) => (
                  <TableRow hover key={`${item.fecha}-${item.usuario}-${index}`}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatearFecha(item.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800}>{item.nombre || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.usuario || '—'}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" label={item.accion || '—'} /></TableCell>
                    <TableCell>{item.entidad || '—'}</TableCell>
                    <TableCell>{item.idRegistro || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={String(item.resultado || 'EXITOSO').toUpperCase() === 'ERROR' ? 'error' : 'success'}
                        label={item.resultado || 'EXITOSO'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => setSeleccionado(item)} aria-label="Ver detalle">
                        <VisibilityRounded />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!registros.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      No se encontraron registros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={total} page={pagina}
            onPageChange={(_, p) => setPagina(p)}
            rowsPerPage={tamanoPagina}
            onRowsPerPageChange={(e) => { setTamanoPagina(Number(e.target.value)); setPagina(0); }}
            rowsPerPageOptions={TAMANOS_PAGINA}
            labelRowsPerPage="Registros por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Paper>
      )}

      <DetalleAuditoria
        item={seleccionado}
        open={Boolean(seleccionado)}
        onClose={() => setSeleccionado(null)}
      />
    </Stack>
  );
}
