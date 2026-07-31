import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, InputAdornment,
  LinearProgress, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import CommentRounded from '@mui/icons-material/CommentRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import MovieRounded from '@mui/icons-material/MovieRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded';
import PageHeader from '../components/PageHeader';
import EstadoTemaChip from '../components/temas/EstadoTemaChip';
import HistorialRecursoDialog from '../components/recursos/HistorialRecursoDialog';
import ReporteRecursosButton from '../components/recursos/ReporteRecursosButton';
import HistorialVersiones from '../components/temas/HistorialVersiones';
import ComentariosPresentacion from '../components/temas/ComentariosPresentacion';
import { useAuth } from '../auth/AuthContext';
import {
  comentarPresentacion,
  obtenerRevisionPresentaciones,
  revisarPresentacionAudiovisuales,
  subirVersionAjustadaAudiovisuales,
} from '../api/entrega3PresentacionesApi';
import {
  cambiarEstadoRecursoAudiovisual,
  obtenerGestionRecursosAudiovisuales,
} from '../api/recursosAudiovisualesApi';

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

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 4,
  overflow: 'hidden',
  background: (theme) => `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 160%)`,
  boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)',
};

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
  const [busqueda, setBusqueda] = useState('');

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
    setGuardando(true);
    setError('');
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
              : 'Comentario registrado.',
      );
      cerrarDialogo();
      await cargar();
    } catch (e) {
      setError(e.message || 'No fue posible completar la operación.');
    } finally {
      setGuardando(false);
    }
  }

  async function ejecutarRecurso() {
    if (!dialogo?.recurso) return;
    setGuardando(true);
    setError('');
    try {
      const archivoDefinitivo = archivo ? await leerArchivo(archivo) : null;
      await cambiarEstadoRecursoAudiovisual(
        token,
        dialogo.recurso.temaId,
        dialogo.recurso.tipo,
        estado,
        texto,
        archivoDefinitivo,
      );
      setMensaje(`${dialogo.recurso.tipo === 'CANCION' ? 'Canción' : 'Video'} actualizado correctamente.`);
      cerrarDialogo();
      await cargar();
    } catch (e) {
      setError(e.message || 'No fue posible actualizar el recurso.');
    } finally {
      setGuardando(false);
    }
  }

  function cerrarDialogo() {
    setDialogo(null);
    setTexto('');
    setArchivo(null);
    setEstado('En preparación');
  }

  if (loading && !presentaciones && !recursos) {
    return <Stack alignItems="center" py={10} spacing={2}><CircularProgress /><Typography color="text.secondary">Preparando centro audiovisual…</Typography></Stack>;
  }

  return <>
    <PageHeader
      eyebrow="OPERACIÓN DEL RETIRO · AUDIOVISUALES"
      title="Centro audiovisual"
      subtitle="Revise, ajuste y controle el material que se utilizará durante el retiro."
      onRefresh={cargar}
      loading={loading}
    />

    <Stack spacing={2.5}>
      {loading && <LinearProgress sx={{ borderRadius: 99 }} />}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {mensaje && <Alert severity="success" onClose={() => setMensaje('')}>{mensaje}</Alert>}

      <HeroResumen presentaciones={presentaciones} recursos={recursos} />

      <Card sx={panelSx}>
        <Box sx={{ px: { xs: 1, md: 2 }, pt: 1.2 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => { setTab(value); setBusqueda(''); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 58,
              '& .MuiTab-root': { minHeight: 52, fontWeight: 900, borderRadius: 2.5, mx: .5 },
              '& .Mui-selected': { bgcolor: 'action.selected' },
            }}
          >
            <Tab icon={<SlideshowRounded />} iconPosition="start" label={`Presentaciones · ${presentaciones?.items?.length || 0}`} />
            <Tab icon={<MusicNoteRounded />} iconPosition="start" label={`Canciones · ${canciones.length}`} />
            <Tab icon={<MovieRounded />} iconPosition="start" label={`Videos · ${videos.length}`} />
          </Tabs>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} mb={2.5}>
            <TextField
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por tema, servidor, recurso o estado…"
              size="small"
              sx={{ width: { xs: '100%', md: 460 } }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment>,
                },
              }}
            />
            <ReporteRecursosButton tipo={tab === 0 ? 'PRESENTACION' : tab === 1 ? 'CANCION' : 'VIDEO'} />
          </Stack>

          {tab === 0 && <BandejaPresentaciones
            data={presentaciones}
            busqueda={busqueda}
            abrir={(tipo, tema, version) => { setDialogo({ tipo, tema, version }); setTexto(''); }}
          />}
          {tab === 1 && <BandejaRecursos
            items={canciones}
            tipo="CANCION"
            indicadores={recursos?.indicadores}
            busqueda={busqueda}
            abrirHistorial={setHistorial}
            abrir={(recurso) => {
              setDialogo({ tipo: 'recurso', recurso });
              setEstado(recurso.estado || 'En preparación');
              setTexto(recurso.observacionesAudiovisuales || '');
            }}
          />}
          {tab === 2 && <BandejaRecursos
            items={videos}
            tipo="VIDEO"
            indicadores={recursos?.indicadores}
            busqueda={busqueda}
            abrirHistorial={setHistorial}
            abrir={(recurso) => {
              setDialogo({ tipo: 'recurso', recurso });
              setEstado(recurso.estado || 'En preparación');
              setTexto(recurso.observacionesAudiovisuales || '');
            }}
          />}
        </Box>
      </Card>
    </Stack>

    <Dialog open={Boolean(dialogo && dialogo.tipo !== 'recurso')} onClose={() => !guardando && cerrarDialogo()} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 950 }}>
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
          {dialogo?.tema && <Alert icon={<SlideshowRounded />} severity="info"><strong>{dialogo.tema.nombre}</strong> · Versión {dialogo.version?.numeroVersion || 'actual'}</Alert>}
          {dialogo?.tipo === 'subir ajuste' && <>
            <Alert severity="info">Se creará una nueva versión sin reemplazar el archivo enviado por el servidor.</Alert>
            <Button component="label" variant="outlined" startIcon={<UploadFileRounded />} sx={{ py: 1.4, borderStyle: 'dashed' }}>
              {archivo ? archivo.name : 'Seleccionar presentación ajustada'}
              <input hidden type="file" accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="caption" color="text.secondary">PPT, PPTX o PDF. Máximo 15 MB.</Typography>
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
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
        <Button
          onClick={ejecutarPresentacion}
          variant="contained"
          disabled={guardando || (dialogo?.tipo !== 'aprobar' && !texto.trim()) || (dialogo?.tipo === 'subir ajuste' && !archivo)}
        >
          {guardando ? 'Guardando…' : dialogo?.tipo === 'subir ajuste' ? 'Cargar versión' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={dialogo?.tipo === 'recurso'} onClose={() => !guardando && cerrarDialogo()} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 950 }}>Gestionar {dialogo?.recurso?.tipo === 'CANCION' ? 'canción' : 'video'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">Tema: <strong>{dialogo?.recurso?.temaNombre}</strong></Alert>
          <TextField select fullWidth label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS_RECURSO.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <TextField fullWidth multiline minRows={4} label={estado === 'Requiere ajustes' ? 'Ajustes requeridos *' : 'Observaciones de Audiovisuales'} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <Button component="label" variant="outlined" startIcon={<UploadFileRounded />} sx={{ py: 1.4, borderStyle: 'dashed' }}>
            {archivo ? archivo.name : 'Adjuntar archivo definitivo'}
            <input hidden type="file" accept={dialogo?.recurso?.tipo === 'CANCION' ? 'audio/*' : 'video/mp4,video/webm,video/quicktime'} onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
          </Button>
          <Typography variant="caption" color="text.secondary">El archivo es opcional. Para aprobar, se recomienda asociar la versión definitiva.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
        <Button onClick={ejecutarRecurso} variant="contained" disabled={guardando || (estado === 'Requiere ajustes' && !texto.trim())}>{guardando ? 'Guardando…' : 'Guardar gestión'}</Button>
      </DialogActions>
    </Dialog>

    <HistorialRecursoDialog open={Boolean(historial)} onClose={() => setHistorial(null)} temaId={historial?.temaId} tipoRecurso={historial?.tipo} titulo={historial?.temaNombre} />
  </>;
}

function HeroResumen({ presentaciones, recursos }) {
  const p = presentaciones?.indicadores || {};
  const r = recursos?.indicadores || {};
  const total = Number(p.total || 0) + Number(r.total || 0);
  const pendientes = Number(p.pendientesRevision || 0) + Number(r.pendientes || 0) + Number(r.enPreparacion || 0);
  const ajustes = Number(p.requierenAjustes || 0) + Number(r.requierenAjustes || 0);
  const aprobados = Number(p.configurados || 0) + Number(r.aprobados || 0);
  const progreso = total ? Math.min(100, Math.round((aprobados / total) * 100)) : 0;

  return <Box sx={{
    position: 'relative', overflow: 'hidden', borderRadius: 5, p: { xs: 2.5, md: 3.5 }, color: 'common.white',
    background: 'linear-gradient(125deg, #082f2b 0%, #0f5a50 48%, #123d55 100%)',
    boxShadow: '0 24px 70px rgba(8, 47, 43, .25)',
    '&:before': { content: '""', position: 'absolute', width: 320, height: 320, borderRadius: '50%', right: -90, top: -180, background: 'rgba(255,255,255,.10)' },
    '&:after': { content: '""', position: 'absolute', width: 190, height: 190, borderRadius: '50%', right: 190, bottom: -150, background: 'rgba(255,255,255,.07)' },
  }}>
    <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <AutoAwesomeRounded fontSize="small" />
          <Typography variant="overline" fontWeight={900} sx={{ letterSpacing: 1.6 }}>PULSO AUDIOVISUAL</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={950}>Material listo para el retiro</Typography>
        <Typography sx={{ opacity: .82, mt: 1, maxWidth: 560 }}>Priorice lo que requiere atención y cierre cada recurso con trazabilidad.</Typography>
        <Stack direction="row" alignItems="center" spacing={2} mt={2.5}>
          <Box flex={1}><LinearProgress variant="determinate" value={progreso} sx={{ height: 10, borderRadius: 99, bgcolor: 'rgba(255,255,255,.18)', '& .MuiLinearProgress-bar': { bgcolor: 'common.white', borderRadius: 99 } }} /></Box>
          <Typography fontWeight={950}>{progreso}%</Typography>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Grid container spacing={1.5}>
          <ResumenMini icon={<SlideshowRounded />} value={total} label="Recursos controlados" />
          <ResumenMini icon={<PendingActionsRounded />} value={pendientes} label="Pendientes" />
          <ResumenMini icon={<WarningAmberRounded />} value={ajustes} label="Con ajustes" />
          <ResumenMini icon={<DoneAllRounded />} value={aprobados} label="Listos" />
        </Grid>
      </Grid>
    </Grid>
  </Box>;
}

function ResumenMini({ icon, value, label }) {
  return <Grid size={{ xs: 6, sm: 3 }}>
    <Box sx={{ p: 2, height: '100%', borderRadius: 3.5, bgcolor: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.16)', backdropFilter: 'blur(8px)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ opacity: .85 }}>{icon}</Box>
        <Typography variant="h4" fontWeight={950}>{value || 0}</Typography>
      </Stack>
      <Typography variant="caption" sx={{ opacity: .82 }}>{label}</Typography>
    </Box>
  </Grid>;
}

function BandejaPresentaciones({ data, abrir, busqueda }) {
  const items = data?.items || [];
  const ind = data?.indicadores || {};
  const q = busqueda.trim().toLowerCase();
  const filtrados = items.filter((tema) => !q || [tema.nombre, tema.servidorNombre, tema.estadoPreparacion, tema.diaDelTema].some((v) => String(v || '').toLowerCase().includes(q)));

  return <Stack spacing={2.5}>
    <Indicadores valores={[
      ['Total', ind.total, <SlideshowRounded />],
      ['Pendientes de revisión', ind.pendientesRevision, <PendingActionsRounded />],
      ['Requieren ajustes', ind.requierenAjustes, <WarningAmberRounded />],
      ['Pendientes del servidor', ind.pendientesServidor, <PersonRounded />],
      ['Configuradas', ind.configurados, <DoneAllRounded />],
    ]} />

    {!filtrados.length && <EmptyState texto={items.length ? 'No hay resultados para la búsqueda.' : 'No hay presentaciones para revisar.'} />}

    <Grid container spacing={2}>
      {filtrados.map((tema) => <Grid key={tema.id} size={{ xs: 12, xl: 6 }}>
        <TarjetaPresentacion tema={tema} abrir={abrir} />
      </Grid>)}
    </Grid>
  </Stack>;
}

function TarjetaPresentacion({ tema, abrir }) {
  const v = tema.versionActual;
  const comentarios = tema.comentarios || [];
  const versiones = tema.versiones || [];
  const [detalle, setDetalle] = useState(false);

  return <Card sx={{
    height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
    transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 22px 60px rgba(15,23,42,.12)', borderColor: 'primary.main' },
  }}>
    <Box sx={{ height: 5, background: v ? 'linear-gradient(90deg, #0f766e, #0891b2)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)' }} />
    <CardContent sx={{ p: 2.5 }}>
      <Stack spacing={2.2}>
        <Stack direction="row" justifyContent="space-between" gap={2}>
          <Stack direction="row" spacing={1.5} minWidth={0}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 46, height: 46 }}><SlideshowRounded /></Avatar>
            <Box minWidth={0}>
              <Typography fontWeight={950} fontSize="1.08rem" noWrap title={tema.nombre}>{tema.nombre}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mt={.5}>
                <Typography variant="caption" color="text.secondary"><PersonRounded sx={{ fontSize: 14, verticalAlign: 'middle', mr: .4 }} />{tema.servidorNombre || 'Sin asignar'}</Typography>
                <Typography variant="caption" color="text.secondary"><ScheduleRounded sx={{ fontSize: 14, verticalAlign: 'middle', mr: .4 }} />{tema.diaDelTema || 'Sin día'} {tema.horaPropuesta || ''}</Typography>
              </Stack>
            </Box>
          </Stack>
          <EstadoTemaChip estado={tema.estadoPreparacion} />
        </Stack>

        {!v ? <Alert severity="warning" variant="outlined">El servidor todavía no ha cargado una presentación.</Alert> : <>
          <Box sx={{ p: 1.7, borderRadius: 3, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">VERSIÓN ACTUAL</Typography>
                <Typography fontWeight={900}>Versión {v.numeroVersion}</Typography>
              </Box>
              <Stack direction="row" spacing={.5}>
                <Tooltip title="Abrir archivo"><IconButton component="a" href={v.archivoDriveUrl} target="_blank" color="primary"><OpenInNewRounded /></IconButton></Tooltip>
                <Tooltip title="Comentarios"><Chip size="small" icon={<CommentRounded />} label={comentarios.length} variant="outlined" /></Tooltip>
                <Tooltip title="Versiones"><Chip size="small" icon={<HistoryRounded />} label={versiones.length} variant="outlined" /></Tooltip>
              </Stack>
            </Stack>
          </Box>

          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}><Button fullWidth variant="contained" startIcon={<UploadFileRounded />} onClick={() => abrir('subir ajuste', tema, v)}>Subir versión ajustada</Button></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Button fullWidth variant="contained" color="success" startIcon={<CheckCircleRounded />} onClick={() => abrir('aprobar', tema, v)}>Aprobar</Button></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Button fullWidth variant="outlined" color="warning" startIcon={<ReplayRounded />} onClick={() => abrir('solicitar ajustes', tema, v)}>Solicitar ajustes</Button></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Button fullWidth variant="outlined" startIcon={<CommentRounded />} onClick={() => abrir('comentar', tema, v)}>Comentar</Button></Grid>
          </Grid>

          <Button variant="text" startIcon={<TuneRounded />} onClick={() => setDetalle((x) => !x)} sx={{ alignSelf: 'flex-start' }}>{detalle ? 'Ocultar detalle' : 'Ver comentarios e historial'}</Button>
          {detalle && <Stack spacing={2} sx={{ pt: .5 }}>
            <Divider />
            <Box><Typography fontWeight={900} mb={1}>Comentarios</Typography><ComentariosPresentacion comentarios={comentarios} /></Box>
            <Box><Typography fontWeight={900} mb={1}>Historial de versiones</Typography><HistorialVersiones versiones={versiones} /></Box>
          </Stack>}
        </>}
      </Stack>
    </CardContent>
  </Card>;
}

function BandejaRecursos({ items, tipo, indicadores, abrir, abrirHistorial, busqueda }) {
  const q = busqueda.trim().toLowerCase();
  const filtrados = items.filter((item) => !q || [item.temaNombre, item.servidorNombre, item.nombre, item.autorFuente, item.estado].some((v) => String(v || '').toLowerCase().includes(q)));

  return <Stack spacing={2.5}>
    <Indicadores valores={[
      ['Total audiovisual', indicadores?.total, tipo === 'CANCION' ? <MusicNoteRounded /> : <MovieRounded />],
      ['Pendientes', indicadores?.pendientes, <PendingActionsRounded />],
      ['En preparación', indicadores?.enPreparacion, <TuneRounded />],
      ['Requieren ajustes', indicadores?.requierenAjustes, <WarningAmberRounded />],
      ['Aprobados', indicadores?.aprobados, <DoneAllRounded />],
    ]} />

    {!filtrados.length && <EmptyState texto={items.length ? 'No hay resultados para la búsqueda.' : `No hay ${tipo === 'CANCION' ? 'canciones' : 'videos'} pendientes o configurados.`} />}

    <Grid container spacing={2}>
      {filtrados.map((item) => <Grid key={item.id} size={{ xs: 12, xl: 6 }}>
        <TarjetaRecurso item={item} tipo={tipo} abrir={abrir} abrirHistorial={abrirHistorial} />
      </Grid>)}
    </Grid>
  </Stack>;
}

function TarjetaRecurso({ item, tipo, abrir, abrirHistorial }) {
  return <Card sx={{ height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', transition: '.18s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 22px 60px rgba(15,23,42,.12)', borderColor: 'primary.main' } }}>
    <Box sx={{ height: 5, background: tipo === 'CANCION' ? 'linear-gradient(90deg, #7c3aed, #db2777)' : 'linear-gradient(90deg, #0369a1, #0d9488)' }} />
    <CardContent sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" gap={2}>
          <Stack direction="row" spacing={1.5} minWidth={0}>
            <Avatar sx={{ bgcolor: tipo === 'CANCION' ? 'secondary.main' : 'primary.main' }}>{tipo === 'CANCION' ? <MusicNoteRounded /> : <MovieRounded />}</Avatar>
            <Box minWidth={0}>
              <Typography fontWeight={950} noWrap title={item.temaNombre}>{item.temaNombre}</Typography>
              <Typography variant="caption" color="text.secondary">{item.servidorNombre || 'Sin servidor'} · {item.diaDelTema || 'Sin día'} {item.horaPropuesta || ''}</Typography>
            </Box>
          </Stack>
          <EstadoTemaChip estado={item.estado} />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={item.origen === 'ESTANDAR' ? 'Recurso estándar' : 'Personalizado'} variant="outlined" />
          {item.archivoDefinitivoUrl && <Chip size="small" label="Archivo definitivo" color="success" variant="outlined" />}
        </Stack>

        <Box sx={{ p: 1.7, borderRadius: 3, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">{tipo === 'CANCION' ? 'CANCIÓN' : 'VIDEO'}</Typography>
          <Typography fontWeight={900}>{item.nombre || 'Sin nombre definido'}</Typography>
          <Typography variant="body2" color="text.secondary">{item.autorFuente || (item.origen === 'ESTANDAR' ? 'Definido en recurso estándar' : 'Sin autor o fuente')}</Typography>
        </Box>

        {tipo === 'VIDEO' && !item.videoCompleto && <Alert severity="info" variant="outlined">Reproducir desde {item.videoMinutoInicio || 'inicio no definido'} hasta {item.videoMinutoFin || 'fin no definido'}. {item.videoMomentoReproduccion ? `Momento: ${item.videoMomentoReproduccion}` : ''}</Alert>}
        {item.observacionesResponsable && <Nota titulo="Indicaciones del responsable" texto={item.observacionesResponsable} />}
        {item.observacionesAudiovisuales && <Nota titulo="Observaciones de Audiovisuales" texto={item.observacionesAudiovisuales} />}

        <Stack direction="row" gap={1} flexWrap="wrap">
          {item.enlaceReferencia && <Button component="a" href={item.enlaceReferencia} target="_blank" variant="outlined" startIcon={<OpenInNewRounded />}>Referencia</Button>}
          {item.archivoDefinitivoUrl && <Button component="a" href={item.archivoDefinitivoUrl} target="_blank" variant="outlined" startIcon={<DownloadRounded />}>Archivo definitivo</Button>}
          <Button variant="outlined" startIcon={<HistoryRounded />} onClick={() => abrirHistorial(item)}>Historial</Button>
          <Button variant="contained" startIcon={<TuneRounded />} onClick={() => abrir(item)}>Gestionar</Button>
        </Stack>
      </Stack>
    </CardContent>
  </Card>;
}

function Nota({ titulo, texto }) {
  return <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 1.5, py: .4 }}><Typography variant="caption" color="text.secondary">{titulo}</Typography><Typography variant="body2">{texto}</Typography></Box>;
}

function Indicadores({ valores }) {
  return <Grid container spacing={1.5}>
    {valores.map(([label, value, icon]) => <Grid key={label} size={{ xs: 6, md: 2.4 }}>
      <Card variant="outlined" sx={{ height: '100%', borderRadius: 3.5, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: '16px !important' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: 2.2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>{icon}</Box>
            <Typography variant="h5" fontWeight={950}>{value || 0}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>{label}</Typography>
        </CardContent>
      </Card>
    </Grid>)}
  </Grid>;
}

function EmptyState({ texto }) {
  return <Box sx={{ py: 7, px: 2, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider', bgcolor: 'action.hover' }}>
    <AutoAwesomeRounded color="disabled" sx={{ fontSize: 42 }} />
    <Typography fontWeight={900} mt={1}>{texto}</Typography>
    <Typography variant="body2" color="text.secondary">La bandeja se actualizará cuando exista material para gestionar.</Typography>
  </Box>;
}
