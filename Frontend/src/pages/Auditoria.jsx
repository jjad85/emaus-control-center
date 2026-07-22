import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { obtenerAuditoriaApi } from '../api/auditoriaApi';

const TAMANOS_PAGINA = [10, 25, 50, 100];

function esAdministrador(rol) {
  const valor = String(rol || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return valor === 'administrador' || valor === 'administradores';
}

function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(fecha);
}

function escaparCsv(valor) {
  const texto = String(valor ?? '').replace(/\r?\n/g, ' ').trim();
  return `"${texto.replace(/"/g, '""')}"`;
}

function descargarCsv(items) {
  const encabezados = [
    'Fecha y hora',
    'Usuario',
    'Nombre',
    'Acción',
    'Entidad',
    'ID registro',
    'Detalle',
  ];

  const filas = items.map((item) => [
    formatearFecha(item.fecha),
    item.usuario,
    item.nombre,
    item.accion,
    item.entidad,
    item.idRegistro,
    item.detalle,
  ]);

  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCsv).join(';'))
    .join('\r\n');

  const blob = new Blob([`\uFEFF${contenido}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  const fecha = new Date().toISOString().slice(0, 10);

  enlace.href = url;
  enlace.download = `Auditoria_${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export default function Auditoria() {
  const { token, rol } = useAuth();
  const [registros, setRegistros] = useState([]);
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
        pagina: pagina + 1,
        tamanoPagina,
        busqueda: busquedaAplicada,
        fechaDesde,
        fechaHasta,
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

  useEffect(() => {
    if (token && esAdministrador(rol)) cargar();
  }, [token, rol, cargar]);

  useEffect(() => {
    clearTimeout(temporizadorBusqueda.current);
    temporizadorBusqueda.current = setTimeout(() => {
      setPagina(0);
      setBusquedaAplicada(busqueda.trim());
    }, 450);

    return () => clearTimeout(temporizadorBusqueda.current);
  }, [busqueda]);

  function cambiarFechaDesde(event) {
    setPagina(0);
    setFechaDesde(event.target.value);
  }

  function cambiarFechaHasta(event) {
    setPagina(0);
    setFechaHasta(event.target.value);
  }

  function limpiarFiltros() {
    setBusqueda('');
    setBusquedaAplicada('');
    setFechaDesde('');
    setFechaHasta('');
    setPagina(0);
    setAviso('');
  }

  async function exportar() {
    setExportando(true);
    setError('');
    setAviso('');

    try {
      const datos = await obtenerAuditoriaApi(token, {
        busqueda: busquedaAplicada,
        fechaDesde,
        fechaHasta,
        exportar: true,
      });

      const items = Array.isArray(datos?.items) ? datos.items : [];
      if (!items.length) {
        setAviso('No existen registros para exportar con los filtros seleccionados.');
        return;
      }

      descargarCsv(items);

      if (datos?.truncado) {
        setAviso(
          `Se exportaron los primeros ${datos.limiteExportacion} registros de ${datos.total}. ` +
          'Reduce el rango de fechas para exportar el resto.'
        );
      }
    } catch (err) {
      setError(err?.message || 'No fue posible exportar la auditoría.');
    } finally {
      setExportando(false);
    }
  }

  if (!esAdministrador(rol)) {
    return <Alert severity="error">Esta sección es exclusiva para administradores.</Alert>;
  }

  const hayFiltros = Boolean(busqueda || fechaDesde || fechaHasta);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={1.5}
      >
        <Box>
          <Typography variant="h4" fontWeight={900}>Auditoría</Typography>
          <Typography color="text.secondary">
            Consulta y exportación de las acciones registradas en el sistema.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={cargar}
            disabled={cargando || exportando}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={exportando ? <CircularProgress size={18} color="inherit" /> : <FileDownloadRounded />}
            onClick={exportar}
            disabled={cargando || exportando || total === 0}
          >
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems="center">
            <TextField
              fullWidth
              size="small"
              label="Buscar en la auditoría"
              placeholder="Usuario, acción, entidad, detalle..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              InputProps={{
                startAdornment: <SearchRounded sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <TextField
              size="small"
              type="date"
              label="Desde"
              value={fechaDesde}
              onChange={cambiarFechaDesde}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: fechaHasta || undefined }}
              sx={{ minWidth: { xs: '100%', md: 170 } }}
            />

            <TextField
              size="small"
              type="date"
              label="Hasta"
              value={fechaHasta}
              onChange={cambiarFechaHasta}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: fechaDesde || undefined }}
              sx={{ minWidth: { xs: '100%', md: 170 } }}
            />

            <Button
              variant="text"
              startIcon={<FilterAltOffRounded />}
              onClick={limpiarFiltros}
              disabled={!hayFiltros}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Limpiar
            </Button>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip label={`${total} ${total === 1 ? 'registro' : 'registros'}`} />
            {(fechaDesde || fechaHasta) && (
              <Typography variant="body2" color="text.secondary">
                Rango: {fechaDesde || 'inicio'} a {fechaHasta || 'hoy'}
              </Typography>
            )}
          </Stack>
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Entidad</TableCell>
                  <TableCell>ID registro</TableCell>
                  <TableCell sx={{ minWidth: 280 }}>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registros.map((item, index) => (
                  <TableRow hover key={`${item.fecha}-${item.usuario}-${item.idRegistro}-${index}`}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatearFecha(item.fecha)}</TableCell>
                    <TableCell>{item.usuario || '—'}</TableCell>
                    <TableCell>{item.nombre || '—'}</TableCell>
                    <TableCell><Chip size="small" label={item.accion || '—'} /></TableCell>
                    <TableCell>{item.entidad || '—'}</TableCell>
                    <TableCell>{item.idRegistro || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.detalle || '—'}
                    </TableCell>
                  </TableRow>
                ))}

                {!registros.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      No se encontraron registros con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={pagina}
            onPageChange={(_, nuevaPagina) => setPagina(nuevaPagina)}
            rowsPerPage={tamanoPagina}
            onRowsPerPageChange={(event) => {
              setTamanoPagina(Number(event.target.value));
              setPagina(0);
            }}
            rowsPerPageOptions={TAMANOS_PAGINA}
            labelRowsPerPage="Registros por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Paper>
      )}
    </Stack>
  );
}
