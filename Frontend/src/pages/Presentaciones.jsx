import { useEffect, useMemo, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent,
  Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import CommentRounded from '@mui/icons-material/CommentRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import MovieRounded from '@mui/icons-material/MovieRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import PageHeader from '../components/PageHeader';
import EstadoTemaChip from '../components/temas/EstadoTemaChip';
import HistorialRecursoDialog from '../components/recursos/HistorialRecursoDialog';
import ReporteRecursosButton from '../components/recursos/ReporteRecursosButton';
import HistorialVersiones from '../components/temas/HistorialVersiones';
import ComentariosPresentacion from '../components/temas/ComentariosPresentacion';
import { useAuth } from '../auth/AuthContext';
import { comentarPresentacion, obtenerRevisionPresentaciones, revisarPresentacionAudiovisuales, subirVersionAjustadaAudiovisuales } from '../api/entrega3PresentacionesApi';
import { cambiarEstadoRecursoAudiovisual, obtenerGestionRecursosAudiovisuales } from '../api/recursosAudiovisualesApi';

const MAX_ARCHIVO_PRESENTACION_BYTES = 15 * 1024 * 1024;

const ESTADOS_RECURSO = [
  'Pendiente de gestión',
  'En preparación',
  'Listo para validación',
  'Requiere ajustes',
  'Aprobado',
];

const leerArchivo = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ nombre: file.name, tipo: file.type, base64: reader.result });
  reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
  reader.readAsDataURL(file);
});

export default function Presentaciones() {
  const { token } = useAuth();
  const [tab, setTab] = useState(0);
  const [presentaciones, setPresentaciones] = useState(null);
  const [recursos, setRecursos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [dialogo, setDialogo] = useState(null);
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('En preparación');
  const [archivo, setArchivo] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setLoading(true);
    setError('');
    try {
      const [datosPresentaciones, datosRecursos] = await Promise.all([
        obtenerRevisionPresentaciones(token),
        obtenerGestionRecursosAudiovisuales(token),
      ]);
      setPresentaciones(datosPresentaciones);
      setRecursos(datosRecursos);
    } catch (e) {
      setError(e.message || 'No fue posible consultar la bandeja de Audiovisuales.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, [token]);

  const canciones = useMemo(() => (recursos?.items || []).filter((item) => item.tipo === 'CANCION'), [recursos]);
  const videos = useMemo(() => (recursos?.items || []).filter((item) => item.tipo === 'VIDEO'), [recursos]);

  async function ejecutarPresentacion() {
    if (!dialogo) return;
    setGuardando(true); setError('');
    try {
      const { tipo, tema, version } = dialogo;
      if (tipo === 'comentar') {
        await comentarPresentacion(token, tema.id, version.id, texto);
      } else if (tipo === 'subir ajuste') {
        if (!archivo) throw new Error('Seleccione el archivo con la versión ajustada.');
        if (archivo.size > MAX_ARCHIVO_PRESENTACION_BYTES) throw new Error('El archivo no puede superar 15 MB.');
        const archivoAjustado = await leerArchivo(archivo);
        await subirVersionAjustadaAudiovisuales(token, tema.id, archivoAjustado, texto);
      } else {
        await revisarPresentacionAudiovisuales(token, tema.id, version.id, tipo, texto);
      }
      setMensaje(
        tipo === 'aprobar'
          ? 'Presentación aprobada y enviada al servidor.'
          : tipo === 'solicitar ajustes'
            ? 'Ajustes solicitados al servidor.'
            : tipo === 'subir ajuste'
              ? 'La versión ajustada fue cargada y enviada al servidor para aprobación.'
              : 'Comentario registrado.'
      );
      cerrarDialogo();
      await cargar();
    } catch (e) { setError(e.message); } finally { setGuardando(false); }
  }

  async function ejecutarRecurso() {
    if (!dialogo?.recurso) return;
    setGuardando(true); setError('');
    try {
      const archivoDefinitivo = archivo ? await leerArchivo(archivo) : null;
      await cambiarEstadoRecursoAudiovisual(token, dialogo.recurso.temaId, dialogo.recurso.tipo, estado, texto, archivoDefinitivo);
      setMensaje(`${dialogo.recurso.tipo === 'CANCION' ? 'Canción' : 'Video'} actualizado correctamente.`);
      cerrarDialogo();
      await cargar();
    } catch (e) { setError(e.message); } finally { setGuardando(false); }
  }

  function cerrarDialogo() {
    setDialogo(null); setTexto(''); setArchivo(null); setEstado('En preparación');
  }

  if (loading && !presentaciones && !recursos) return <Stack alignItems="center" py={8}><CircularProgress /></Stack>;

  return <>
    <PageHeader eyebrow="Control audiovisual" title="Audiovisuales" subtitle="Gestión de presentaciones, canciones y videos" onRefresh={cargar} loading={loading} />
    <Stack spacing={2.5}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {mensaje && <Alert severity="success" onClose={() => setMensaje('')}>{mensaje}</Alert>}

      <Card variant="outlined"><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
        <Tab label={`Presentaciones (${presentaciones?.items?.length || 0})`} />
        <Tab label={`Canciones (${canciones.length})`} />
        <Tab label={`Videos (${videos.length})`} />
      </Tabs></Card>

      {tab === 0 && <BandejaPresentaciones data={presentaciones} abrir={(tipo, tema, version) => { setDialogo({ tipo, tema, version }); setTexto(''); }} />}
      {tab === 1 && <BandejaRecursos items={canciones} tipo="CANCION" indicadores={recursos?.indicadores} abrirHistorial={setHistorial} abrir={(recurso) => { setDialogo({ tipo: 'recurso', recurso }); setEstado(recurso.estado || 'En preparación'); setTexto(recurso.observacionesAudiovisuales || ''); }} />}
      {tab === 2 && <BandejaRecursos items={videos} tipo="VIDEO" indicadores={recursos?.indicadores} abrirHistorial={setHistorial} abrir={(recurso) => { setDialogo({ tipo: 'recurso', recurso }); setEstado(recurso.estado || 'En preparación'); setTexto(recurso.observacionesAudiovisuales || ''); }} />}
    </Stack>

    <Dialog open={Boolean(dialogo && dialogo.tipo !== 'recurso')} onClose={() => !guardando && cerrarDialogo()} fullWidth maxWidth="sm">
      <DialogTitle>
        {dialogo?.tipo === 'aprobar'
          ? 'Aprobar presentación'
          : dialogo?.tipo === 'solicitar ajustes'
            ? 'Solicitar ajustes'
            : dialogo?.tipo === 'subir ajuste'
              ? 'Subir versión ajustada'
              : 'Agregar comentario'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {dialogo?.tipo === 'subir ajuste' && <>
            <Alert severity="info">
              Se creará una nueva versión sin reemplazar el archivo del servidor. La versión quedará pendiente de su aprobación.
            </Alert>
            <Button component="label" variant="outlined" startIcon={<UploadFileRounded />}>
              {archivo ? archivo.name : 'Seleccionar presentación ajustada'}
              <input hidden type="file" accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="caption" color="text.secondary">Formatos permitidos: PPT, PPTX y PDF. Tamaño máximo: 15 MB.</Typography>
          </>}
          <TextField
            autoFocus={dialogo?.tipo !== 'subir ajuste'}
            fullWidth
            multiline
            minRows={4}
            label={dialogo?.tipo === 'aprobar' ? 'Comentario opcional' : dialogo?.tipo === 'subir ajuste' ? 'Descripción de los ajustes realizados *' : 'Comentario'}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
        <Button
          onClick={ejecutarPresentacion}
          variant="contained"
          disabled={guardando || (dialogo?.tipo !== 'aprobar' && !texto.trim()) || (dialogo?.tipo === 'subir ajuste' && !archivo)}
        >
          {guardando ? 'Guardando...' : dialogo?.tipo === 'subir ajuste' ? 'Cargar versión' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={dialogo?.tipo === 'recurso'} onClose={() => !guardando && cerrarDialogo()} fullWidth maxWidth="sm">
      <DialogTitle>Gestionar {dialogo?.recurso?.tipo === 'CANCION' ? 'canción' : 'video'}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity="info">Tema: <strong>{dialogo?.recurso?.temaNombre}</strong></Alert>
        <TextField select fullWidth label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>{ESTADOS_RECURSO.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
        <TextField fullWidth multiline minRows={4} label={estado === 'Requiere ajustes' ? 'Ajustes requeridos *' : 'Observaciones de Audiovisuales'} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Button component="label" variant="outlined" startIcon={<UploadFileRounded />}>
          {archivo ? archivo.name : 'Adjuntar archivo definitivo'}
          <input hidden type="file" accept={dialogo?.recurso?.tipo === 'CANCION' ? 'audio/*' : 'video/mp4,video/webm,video/quicktime'} onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
        </Button>
        <Typography variant="caption" color="text.secondary">El archivo es opcional. Para aprobar, se recomienda asociar la versión definitiva que se utilizará durante el retiro.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button><Button onClick={ejecutarRecurso} variant="contained" disabled={guardando || (estado === 'Requiere ajustes' && !texto.trim())}>{guardando ? 'Guardando...' : 'Guardar gestión'}</Button></DialogActions>
    </Dialog>
    <HistorialRecursoDialog open={Boolean(historial)} onClose={() => setHistorial(null)} temaId={historial?.temaId} tipoRecurso={historial?.tipo} titulo={historial?.temaNombre} />
  </>;
}

function BandejaPresentaciones({ data, abrir }) {
  const items = data?.items || []; const ind = data?.indicadores || {};
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="flex-end"><ReporteRecursosButton tipo="PRESENTACION" /></Stack>
    <Indicadores valores={[['Total', ind.total], ['Pendientes de revisión', ind.pendientesRevision], ['Requieren ajustes', ind.requierenAjustes], ['Pendientes del servidor', ind.pendientesServidor], ['Configuradas', ind.configurados]]} />
    {!items.length && <Alert severity="info">No hay presentaciones para revisar.</Alert>}
    {items.map((tema) => { const v = tema.versionActual; return <Accordion key={tema.id} disableGutters sx={{ borderRadius: 3, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" width="100%" gap={1} pr={2}><Box><Typography fontWeight={900}>{tema.nombre}</Typography><Typography variant="body2" color="text.secondary">Servidor: {tema.servidorNombre || 'Sin asignar'} · {tema.diaDelTema || 'Sin día'} {tema.horaPropuesta || ''}</Typography></Box><EstadoTemaChip estado={tema.estadoPreparacion} /></Stack></AccordionSummary>
      <AccordionDetails><Stack spacing={2.5}>{!v ? <Alert severity="warning">El servidor todavía no ha cargado una presentación.</Alert> : <><Stack direction={{ xs: 'column', sm: 'row' }} gap={1} flexWrap="wrap"><Button component="a" href={v.archivoDriveUrl} target="_blank" variant="outlined" startIcon={<DownloadRounded />}>Abrir versión {v.numeroVersion}</Button><Button variant="contained" startIcon={<UploadFileRounded />} onClick={() => abrir('subir ajuste', tema, v)}>Subir versión ajustada</Button><Button variant="contained" color="success" startIcon={<CheckCircleRounded />} onClick={() => abrir('aprobar', tema, v)}>Aprobar</Button><Button variant="outlined" color="warning" startIcon={<ReplayRounded />} onClick={() => abrir('solicitar ajustes', tema, v)}>Solicitar ajustes</Button><Button variant="text" startIcon={<CommentRounded />} onClick={() => abrir('comentar', tema, v)}>Comentar</Button></Stack><Box><Typography variant="h6" fontWeight={900} mb={1}>Comentarios</Typography><ComentariosPresentacion comentarios={tema.comentarios} /></Box><Box><Typography variant="h6" fontWeight={900} mb={1}>Historial de versiones</Typography><HistorialVersiones versiones={tema.versiones} /></Box></>}</Stack></AccordionDetails>
    </Accordion>; })}
  </Stack>;
}

function BandejaRecursos({ items, tipo, indicadores, abrir, abrirHistorial }) {
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="flex-end"><ReporteRecursosButton tipo={tipo} /></Stack>
    <Indicadores valores={[['Total audiovisual', indicadores?.total], ['Pendientes', indicadores?.pendientes], ['En preparación', indicadores?.enPreparacion], ['Requieren ajustes', indicadores?.requierenAjustes], ['Aprobados', indicadores?.aprobados]]} />
    {!items.length && <Alert severity="info">No hay {tipo === 'CANCION' ? 'canciones' : 'videos'} pendientes o configurados.</Alert>}
    {items.map((item) => <Card key={item.id} variant="outlined"><CardContent><Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}><Box><Stack direction="row" gap={1} alignItems="center">{tipo === 'CANCION' ? <MusicNoteRounded /> : <MovieRounded />}<Typography variant="h6" fontWeight={900}>{item.temaNombre}</Typography></Stack><Typography variant="body2" color="text.secondary">Servidor: {item.servidorNombre} · {item.diaDelTema} {item.horaPropuesta}</Typography></Box><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={item.origen === 'ESTANDAR' ? 'Recurso estándar' : 'Personalizado'} variant="outlined" /><EstadoTemaChip estado={item.estado} /></Stack></Stack>
      <Divider />
      <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}><Typography variant="caption" color="text.secondary">Nombre</Typography><Typography fontWeight={800}>{item.nombre || 'Sin nombre'}</Typography></Grid><Grid size={{ xs: 12, md: 6 }}><Typography variant="caption" color="text.secondary">Autor o fuente</Typography><Typography>{item.autorFuente || (item.origen === 'ESTANDAR' ? 'Definido en el recurso estándar' : 'Sin información')}</Typography></Grid></Grid>
      {tipo === 'VIDEO' && !item.videoCompleto && <Alert severity="info">Reproducir desde {item.videoMinutoInicio || 'inicio no definido'} hasta {item.videoMinutoFin || 'fin no definido'}. {item.videoMomentoReproduccion ? `Momento: ${item.videoMomentoReproduccion}` : ''}</Alert>}
      {item.observacionesResponsable && <Box><Typography variant="caption" color="text.secondary">Indicaciones del responsable</Typography><Typography>{item.observacionesResponsable}</Typography></Box>}
      {item.observacionesAudiovisuales && <Box><Typography variant="caption" color="text.secondary">Observaciones de Audiovisuales</Typography><Typography>{item.observacionesAudiovisuales}</Typography></Box>}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} flexWrap="wrap">
        {item.enlaceReferencia && <Button component="a" href={item.enlaceReferencia} target="_blank" variant="outlined">Abrir referencia</Button>}
        {item.archivoDefinitivoUrl && <Button component="a" href={item.archivoDefinitivoUrl} target="_blank" variant="outlined" startIcon={<DownloadRounded />}>Abrir archivo definitivo</Button>}
        <Button variant="outlined" onClick={() => abrirHistorial(item)}>Historial</Button><Button variant="contained" onClick={() => abrir(item)}>Gestionar</Button>
      </Stack>
    </Stack></CardContent></Card>)}
  </Stack>;
}

function Indicadores({ valores }) {
  return <Grid container spacing={2}>{valores.map(([label, value]) => <Grid key={label} size={{ xs: 6, md: 'auto' }}><Card variant="outlined"><CardContent><Typography variant="h4" fontWeight={950}>{value || 0}</Typography><Typography color="text.secondary">{label}</Typography></CardContent></Card></Grid>)}</Grid>;
}
