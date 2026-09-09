import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import {
  crearSolicitudDocumentoIdentidadWhatsapp,
  exportarDocumentosIdentidad,
  obtenerDocumentoIdentidadArchivo,
  obtenerPanelDocumentosIdentidad,
} from '../api/documentosIdentidadApi';
import { prepararNotificacionWhatsapp } from '../api/whatsappApi';

function descargarBase64(nombre, mimeType, base64) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre || 'archivo';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function Indicador({ titulo, datos }) {
  const total = Number(datos?.total || 0);
  const entregados = Number(datos?.entregados || 0);
  const porcentaje = Number(datos?.porcentaje || 0);
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={900}>{titulo}</Typography>
            <Chip size="small" color={entregados === total && total > 0 ? 'success' : 'default'} label={`${entregados}/${total}`} />
          </Stack>
          <Typography variant="h4" fontWeight={950}>{porcentaje}%</Typography>
          <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 8, borderRadius: 10 }} />
          <Typography variant="caption" color="text.secondary">
            {Number(datos?.pendientes || 0)} pendientes
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TarjetaPersona({ item, onOpen, onSolicitar, solicitando }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        variant="outlined"
        onClick={() => onOpen(item)}
        sx={{
          height: '100%',
          borderRadius: 3,
          cursor: 'pointer',
          transition: 'transform .15s ease, box-shadow .15s ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              {item.entregado ? (
                <CheckCircleRounded color="success" sx={{ mt: 0.2 }} />
              ) : (
                <CancelRounded color="error" sx={{ mt: 0.2 }} />
              )}
              <Box minWidth={0} flex={1}>
                <Typography fontWeight={900} lineHeight={1.2}>{item.nombre}</Typography>
                {item.tipoPersona === 'Caminante' && item.mesa ? (
                  <Typography variant="caption" color="text.secondary">Mesa {item.mesa}</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">{item.tipoPersona}</Typography>
                )}
              </Box>
            </Stack>

            {!item.entregado && (
              <Box onClick={(e) => e.stopPropagation()}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={solicitando ? <CircularProgress size={16} color="inherit" /> : <WhatsApp />}
                  onClick={() => onSolicitar(item)}
                  disabled={solicitando}
                >
                  Solicitar documento
                </Button>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function ResumenAcordeon({ icono, titulo, items }) {
  const total = items.length;
  const entregados = items.filter((item) => item.entregado).length;
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" width="100%" pr={1}>
      {icono}
      <Box flex={1} minWidth={0}>
        <Typography fontWeight={950}>{titulo}</Typography>
        <Typography variant="caption" color="text.secondary">
          {entregados} entregados de {total}
        </Typography>
      </Box>
      <Chip
        size="small"
        color={total > 0 && entregados === total ? 'success' : 'default'}
        label={`${entregados}/${total}`}
      />
    </Stack>
  );
}

export default function DocumentosIdentidad() {
  const { token } = useAuth();
  const [data, setData] = useState({ items: [], indicadores: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [mesa, setMesa] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [progresoExportacion, setProgresoExportacion] = useState('');
  const [solicitandoClave, setSolicitandoClave] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const respuesta = await obtenerPanelDocumentosIdentidad(token);
      setData(respuesta || { items: [], indicadores: {} });
    } catch (err) {
      setError(err.message || 'No fue posible consultar los documentos de identidad.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const todosCaminantes = useMemo(
    () => (data.items || []).filter((item) => item.tipoPersona === 'Caminante'),
    [data.items]
  );

  const todosServidores = useMemo(
    () => (data.items || []).filter((item) => item.tipoPersona === 'Servidor'),
    [data.items]
  );

  const mesas = useMemo(() => (
    Array.from(new Set(
      todosCaminantes
        .map((item) => String(item.mesa || '').trim())
        .filter(Boolean)
    )).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b, 'es'))
  ), [todosCaminantes]);

  const coincideBusqueda = useCallback((item) => {
    const q = String(texto || '').trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.nombre || '').toLowerCase().includes(q) ||
      String(item.documentoIdentidad || '').includes(q)
    );
  }, [texto]);

  const caminantes = useMemo(() => (
    todosCaminantes.filter((item) =>
      coincideBusqueda(item) &&
      (!mesa || String(item.mesa || '').trim() === String(mesa))
    )
  ), [todosCaminantes, coincideBusqueda, mesa]);

  const servidores = useMemo(
    () => todosServidores.filter(coincideBusqueda),
    [todosServidores, coincideBusqueda]
  );

  const linkPublico = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/documento-identidad`;
  }, []);

  async function abrirDetalle(item) {
    setDetalle(item);
    setArchivo(null);
    setError('');
    if (!item.entregado) return;

    setCargandoArchivo(true);
    try {
      const respuesta = await obtenerDocumentoIdentidadArchivo(token, item.tipoPersona, item.id);
      setArchivo(respuesta);
    } catch (err) {
      setError(err.message || 'No fue posible abrir el documento.');
    } finally {
      setCargandoArchivo(false);
    }
  }

  async function solicitarDocumento(item) {
    const clave = `${item.tipoPersona}-${item.id}`;
    const ventanaWhatsapp = window.open('', '_blank');

    if (!ventanaWhatsapp) {
      setError('El navegador bloqueó la nueva pestaña de WhatsApp. Habilita las ventanas emergentes para este sitio.');
      return;
    }

    try {
      ventanaWhatsapp.document.title = 'Preparando WhatsApp…';
      ventanaWhatsapp.document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;background:#f5f7f6;color:#173b34;text-align:center;padding:24px;box-sizing:border-box;">
          <div><div style="font-size:42px;margin-bottom:12px;">💬</div><strong>Preparando mensaje de WhatsApp…</strong></div>
        </div>
      `;
    } catch {
      // La pestaña puede no permitir modificación temporal en algunos navegadores.
    }

    setSolicitandoClave(clave);
    setError('');

    try {
      const notificacion = await crearSolicitudDocumentoIdentidadWhatsapp(
        token,
        item.tipoPersona,
        item.id,
        linkPublico
      );

      if (!notificacion?.id) {
        throw new Error('No fue posible preparar la solicitud de documento.');
      }

      const preparada = await prepararNotificacionWhatsapp(token, notificacion.id);
      if (!preparada?.url) {
        throw new Error('No fue posible obtener el enlace de WhatsApp.');
      }

      ventanaWhatsapp.location.replace(preparada.url);
    } catch (err) {
      try { ventanaWhatsapp.close(); } catch { /* sin acción */ }
      setError(err.message || 'No fue posible abrir WhatsApp.');
    } finally {
      setSolicitandoClave('');
    }
  }

  async function exportarTodo() {
    setExportando(true);
    setError('');
    setProgresoExportacion('Preparando exportación…');
    try {
      let lote = 0;
      let totalLotes = 1;
      do {
        const respuesta = await exportarDocumentosIdentidad(token, lote);
        if (respuesta.vacio) {
          setProgresoExportacion('');
          setError('Todavía no hay documentos adjuntos para exportar.');
          return;
        }
        totalLotes = Number(respuesta.totalLotes || 1);
        setProgresoExportacion(`Descargando lote ${lote + 1} de ${totalLotes}…`);
        descargarBase64(respuesta.nombre, respuesta.mimeType, respuesta.base64);
        lote += 1;
      } while (lote < totalLotes);
      setProgresoExportacion('Exportación completada.');
      window.setTimeout(() => setProgresoExportacion(''), 3500);
    } catch (err) {
      setError(err.message || 'No fue posible exportar los documentos.');
      setProgresoExportacion('');
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Logística"
        title="Documentos de identidad"
        subtitle="Control de cédulas entregadas por caminantes y servidores requeridos por la casa de retiros."
        onRefresh={cargar}
        loading={loading}
      />

      <Stack spacing={2.5}>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {progresoExportacion && <Alert severity="info">{progresoExportacion}</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}><Indicador titulo="Caminantes" datos={data.indicadores?.caminantes} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Indicador titulo="Servidores" datos={data.indicadores?.servidores} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Indicador titulo="Total" datos={data.indicadores?.total} /></Grid>
        </Grid>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <TextField
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o documento"
            sx={{ minWidth: { md: 360 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }}
          />
          <Button
            variant="contained"
            startIcon={exportando ? <CircularProgress size={18} color="inherit" /> : <DownloadRounded />}
            onClick={exportarTodo}
            disabled={exportando || loading}
          >
            Exportar documentos entregados
          </Button>
        </Stack>

        {loading ? (
          <Box py={8} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={1.5}>
            <Accordion defaultExpanded sx={{ borderRadius: '16px !important', overflow: 'hidden', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <ResumenAcordeon
                  icono={<GroupsRounded color="primary" />}
                  titulo="Caminantes"
                  items={todosCaminantes}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Filtrar por mesa"
                    value={mesa}
                    onChange={(e) => setMesa(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 260 } }}
                  >
                    <MenuItem value="">Todas las mesas</MenuItem>
                    {mesas.map((numeroMesa) => (
                      <MenuItem key={numeroMesa} value={numeroMesa}>Mesa {numeroMesa}</MenuItem>
                    ))}
                  </TextField>

                  {!caminantes.length ? (
                    <Alert severity="info">No hay caminantes que coincidan con los filtros seleccionados.</Alert>
                  ) : (
                    <Grid container spacing={1.5}>
                      {caminantes.map((item) => (
                        <TarjetaPersona
                          key={`${item.tipoPersona}-${item.id}`}
                          item={item}
                          onOpen={abrirDetalle}
                          onSolicitar={solicitarDocumento}
                          solicitando={solicitandoClave === `${item.tipoPersona}-${item.id}`}
                        />
                      ))}
                    </Grid>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: '16px !important', overflow: 'hidden', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <ResumenAcordeon
                  icono={<PersonRounded color="primary" />}
                  titulo="Servidores"
                  items={todosServidores}
                />
              </AccordionSummary>
              <AccordionDetails>
                {!servidores.length ? (
                  <Alert severity="info">No hay servidores que coincidan con la búsqueda.</Alert>
                ) : (
                  <Grid container spacing={1.5}>
                    {servidores.map((item) => (
                      <TarjetaPersona
                        key={`${item.tipoPersona}-${item.id}`}
                        item={item}
                        onOpen={abrirDetalle}
                        onSolicitar={solicitarDocumento}
                        solicitando={solicitandoClave === `${item.tipoPersona}-${item.id}`}
                      />
                    ))}
                  </Grid>
                )}
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </Stack>

      <Dialog
        open={Boolean(detalle)}
        onClose={() => { setDetalle(null); setArchivo(null); }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <BadgeRounded color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={900}>{detalle?.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">
                {detalle?.tipoPersona === 'Caminante' && detalle?.mesa
                  ? `Caminante · Mesa ${detalle.mesa}`
                  : detalle?.tipoPersona}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {!detalle?.entregado ? (
            <Alert severity="warning">Esta persona todavía no ha adjuntado su documento de identidad.</Alert>
          ) : cargandoArchivo ? (
            <Box py={8} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
          ) : archivo?.mimeType === 'application/pdf' ? (
            <Box
              component="iframe"
              src={archivo.dataUrl}
              title={`Documento de ${detalle?.nombre || ''}`}
              sx={{ border: 0, width: '100%', height: { xs: '60vh', md: '72vh' }, borderRadius: 2 }}
            />
          ) : archivo?.dataUrl ? (
            <Box
              component="img"
              src={archivo.dataUrl}
              alt={`Documento de ${detalle?.nombre || ''}`}
              sx={{ display: 'block', width: '100%', maxHeight: '72vh', objectFit: 'contain', bgcolor: '#f6f7f7', borderRadius: 2 }}
            />
          ) : (
            <Alert severity="error">No fue posible visualizar el archivo.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          {archivo?.base64 && (
            <Button
              startIcon={<DownloadRounded />}
              onClick={() => descargarBase64(archivo.nombre, archivo.mimeType, archivo.base64)}
            >
              Descargar
            </Button>
          )}
          <Button onClick={() => { setDetalle(null); setArchivo(null); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
