import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import EstadoTemaChip from './EstadoTemaChip';
import HistorialVersiones from './HistorialVersiones';
import ComentariosPresentacion from './ComentariosPresentacion';
import RecursosTemaPanel from './RecursosTemaPanel';

const TABS = [
  { clave: 'PRESENTACION', label: 'Presentación', icono: <SlideshowRounded /> },
  { clave: 'CANCION', label: 'Música', icono: <MusicNoteRounded /> },
  { clave: 'VIDEO', label: 'Video', icono: <OndemandVideoRounded /> },
  { clave: 'PALANCA', label: 'Palanca', icono: <CardGiftcardRounded /> },
];


function esActivo(valor) {
  if (typeof valor === 'boolean') return valor;
  return ['sí', 'si', 'true', '1', 'activo'].includes(String(valor ?? '').trim().toLowerCase());
}

function valorVisible(valor, fallback = 'Sin información') {
  if (valor === true) return 'Sí';
  if (valor === false) return 'No';
  return String(valor ?? '').trim() || fallback;
}

function FichaDato({ etiqueta, valor }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>
        {etiqueta}
      </Typography>
      <Typography fontWeight={750}>{valorVisible(valor)}</Typography>
    </Box>
  );
}

function ResumenCancion({ tema }) {
  const activa = tema.requiereMusica === 'Sí';
  if (!activa) return <Alert severity="info">Este tema no utiliza canción.</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={950}>
            {tema.usaCancionEstandar ? 'Canción estándar' : 'Canción personalizada'}
          </Typography>
          <Typography color="text.secondary">
            Información preparada para el equipo de Audiovisuales.
          </Typography>
        </Box>
        <EstadoTemaChip estado={tema.cancionEstado || 'Pendiente de gestión'} />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          <FichaDato etiqueta="Nombre" valor={tema.usaCancionEstandar ? tema.cancionDocumentoNombre : tema.cancionNombre} />
          <FichaDato etiqueta="Autor o intérprete" valor={tema.cancionAutor} />
          <FichaDato etiqueta="Origen" valor={tema.usaCancionEstandar ? 'Recurso estándar' : 'Personalizado'} />
          <FichaDato etiqueta="Estado" valor={tema.cancionEstado || 'Pendiente de gestión'} />
        </Box>
      </Paper>

      {tema.cancionEnlace && (
        <Button component="a" href={tema.cancionEnlace} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRounded />} sx={{ alignSelf: 'flex-start' }}>
          Abrir referencia
        </Button>
      )}
      {tema.cancionArchivoDefinitivoUrl && (
        <Button component="a" href={tema.cancionArchivoDefinitivoUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRounded />} sx={{ alignSelf: 'flex-start' }}>
          Abrir archivo definitivo
        </Button>
      )}
      {tema.cancionObservaciones && <Alert severity="info">Indicaciones: {tema.cancionObservaciones}</Alert>}
      {tema.cancionObservacionesAudiovisuales && <Alert severity="warning">Audiovisuales: {tema.cancionObservacionesAudiovisuales}</Alert>}
    </Stack>
  );
}

function ResumenVideo({ tema }) {
  const activo = esActivo(tema.usaVideo);
  if (!activo) return <Alert severity="info">Este tema no utiliza video.</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={950}>
            {tema.usaVideoEstandar ? 'Video estándar' : 'Video personalizado'}
          </Typography>
          <Typography color="text.secondary">Detalles para preparar la reproducción durante la charla.</Typography>
        </Box>
        <EstadoTemaChip estado={tema.videoEstado || 'Pendiente de gestión'} />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          <FichaDato etiqueta="Nombre" valor={tema.usaVideoEstandar ? tema.videoDocumentoNombre : tema.videoNombre} />
          <FichaDato etiqueta="Autor o fuente" valor={tema.videoAutorFuente} />
          <FichaDato etiqueta="Reproducción" valor={tema.videoCompleto === false ? `${valorVisible(tema.videoMinutoInicio, 'Inicio')} a ${valorVisible(tema.videoMinutoFin, 'Fin')}` : 'Video completo'} />
          <FichaDato etiqueta="Momento de reproducción" valor={tema.videoMomentoReproduccion} />
        </Box>
      </Paper>

      {tema.videoEnlace && (
        <Button component="a" href={tema.videoEnlace} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRounded />} sx={{ alignSelf: 'flex-start' }}>
          Abrir referencia
        </Button>
      )}
      {tema.videoArchivoDefinitivoUrl && (
        <Button component="a" href={tema.videoArchivoDefinitivoUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRounded />} sx={{ alignSelf: 'flex-start' }}>
          Abrir archivo definitivo
        </Button>
      )}
      {tema.videoObservaciones && <Alert severity="info">Indicaciones: {tema.videoObservaciones}</Alert>}
      {tema.videoObservacionesAudiovisuales && <Alert severity="warning">Audiovisuales: {tema.videoObservacionesAudiovisuales}</Alert>}
    </Stack>
  );
}

function ResumenPalanca({ tema }) {
  const activa = esActivo(tema.requierePalanca);
  if (!activa) return <Alert severity="info">Este tema no utiliza palanca.</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={950}>{tema.palancaNombre || 'Palanca del tema'}</Typography>
          <Typography color="text.secondary">Instrucciones operativas para preparación y entrega.</Typography>
        </Box>
        <EstadoTemaChip estado={tema.palancaEstado || 'Pendiente de Logística'} />
      </Stack>

      {tema.palancaDescripcion && <Alert severity="info">{tema.palancaDescripcion}</Alert>}

      <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          <FichaDato etiqueta="Momento de entrega" valor={tema.palancaMomentoEntrega} />
          <FichaDato etiqueta="Detalle del momento" valor={tema.palancaDetalleMomento} />
          <FichaDato etiqueta="Forma de entrega" valor={tema.palancaFormaEntrega} />
          <FichaDato etiqueta="Responsable de repartirla" valor={tema.palancaResponsableEntrega} />
          <FichaDato etiqueta="Detalle del responsable" valor={tema.palancaDetalleResponsable} />
          <FichaDato etiqueta="Cantidad" valor={tema.palancaCantidad} />
          <FichaDato etiqueta="Destinatarios" valor={tema.palancaDestinatarios} />
          <FichaDato etiqueta="Preparación previa" valor={esActivo(tema.palancaRequierePreparacion) ? 'Sí' : 'No'} />
        </Box>
      </Paper>

      {tema.palancaInstrucciones && <Alert severity="success">Instrucciones para Logística: {tema.palancaInstrucciones}</Alert>}
      {tema.palancaObservaciones && <Alert severity="info">Observaciones: {tema.palancaObservaciones}</Alert>}
      {tema.palancaObservacionesLogistica && <Alert severity="warning">Logística: {tema.palancaObservacionesLogistica}</Alert>}
    </Stack>
  );
}

export default function DetalleRecursosTema({
  tema,
  plantillaUrl,
  disabled,
  comentario,
  setComentario,
  cargarPpt,
  cargarMusica,
  cambiar,
  guardarRecurso,
  setTextoRevision,
  setDialogoRevision,
  tipoInicial = '',
}) {
  const [tab, setTab] = useState('PRESENTACION');

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: 'rgba(20,75,62,.14)' }}>
      <Box sx={{ px: { xs: 1, md: 2 }, pt: 1, bgcolor: 'rgba(244,249,246,.78)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          {TABS.map((item) => (
            <Tab key={item.clave} value={item.clave} icon={item.icono} iconPosition="start" label={item.label} sx={{ minHeight: 58, fontWeight: 900 }} />
          ))}
        </Tabs>
      </Box>

      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {tab === 'PRESENTACION' && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="h6" fontWeight={950}>Presentación</Typography>
                <Typography color="text.secondary">Versiones, comentarios y aprobación del material.</Typography>
              </Box>
              <EstadoTemaChip estado={tema.estadoPreparacion} />
            </Stack>

            <RecursosTemaPanel
              tema={tema}
              plantillaUrl={plantillaUrl}
              disabled={disabled}
              soloTipo="PRESENTACION"
              onCambiarPresentacion={(valor) => cambiar(tema, 'requierePresentacion', valor)}
              onGuardar={(tipo, datos) => guardarRecurso(tema, tipo, datos)}
            />

            {tema.requierePresentacion === 'Sí' ? (
              <>
                <TextField
                  label="Comentario de esta versión"
                  multiline
                  minRows={2}
                  value={comentario[tema.id] || ''}
                  onChange={(evento) => setComentario((actual) => ({ ...actual, [tema.id]: evento.target.value }))}
                />
                <Button component="label" variant="contained" startIcon={disabled ? <CircularProgress size={18} color="inherit" /> : <UploadFileRounded />} disabled={disabled} sx={{ alignSelf: 'flex-start' }}>
                  {disabled ? 'Procesando...' : 'Subir nueva versión'}
                  <input hidden type="file" accept=".ppt,.pptx,.pdf" onChange={(evento) => { const file = evento.target.files?.[0]; evento.target.value = ''; cargarPpt(tema, file); }} />
                </Button>
                <Typography variant="caption" color="text.secondary">Formatos permitidos: PPT, PPTX y PDF. Tamaño máximo: 15 MB.</Typography>
              </>
            ) : (
              <Alert severity="info">Activa la presentación para habilitar la carga de versiones.</Alert>
            )}

            <Divider />
            <Box>
              <Typography variant="subtitle1" fontWeight={950} mb={1}>Comentarios y observaciones</Typography>
              <ComentariosPresentacion comentarios={tema.comentarios || []} />
            </Box>

            {tema.versionActual && (
              <Box>
                <Typography variant="subtitle1" fontWeight={950} mb={1}>Acciones del servidor</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} flexWrap="wrap">
                  <Button variant="outlined" onClick={() => { setTextoRevision(''); setDialogoRevision({ tipo: 'comentar', tema, version: tema.versionActual }); }} disabled={disabled}>Agregar comentario</Button>
                  {!tema.versionActual.aprobadaConferencista && (
                    <>
                      <Button variant="outlined" onClick={() => { setTextoRevision(''); setDialogoRevision({ tipo: 'solicitar ajustes', tema, version: tema.versionActual }); }} disabled={disabled || !tema.versionActual.aprobadaAudiovisuales}>Solicitar ajustes a Audiovisuales</Button>
                      <Button variant="contained" onClick={() => { setTextoRevision(''); setDialogoRevision({ tipo: 'aprobar', tema, version: tema.versionActual }); }} disabled={disabled || !tema.versionActual.aprobadaAudiovisuales}>Aprobar como servidor</Button>
                    </>
                  )}
                </Stack>
                {!tema.versionActual.aprobadaAudiovisuales && !tema.versionActual.aprobadaConferencista && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>La aprobación se habilita cuando Audiovisuales apruebe la versión vigente.</Typography>
                )}
                {tema.versionActual.aprobadaConferencista && <Alert severity="success" sx={{ mt: 1.5 }}>Esta versión ya fue aprobada por el servidor.</Alert>}
              </Box>
            )}

            <Divider />
            <Box>
              <Typography variant="subtitle1" fontWeight={950} mb={1}>Historial de versiones</Typography>
              <HistorialVersiones versiones={tema.versiones} />
            </Box>
          </Stack>
        )}

        {tab === 'CANCION' && (
          <Stack spacing={2.5}>
            <ResumenCancion tema={tema} />
            <Divider />
            <RecursosTemaPanel tema={tema} plantillaUrl={plantillaUrl} disabled={disabled} soloTipo="CANCION" onCambiarPresentacion={() => {}} onGuardar={(tipo, datos) => guardarRecurso(tema, tipo, datos)} />
            {tema.requiereMusica === 'Sí' && !tema.usaCancionEstandar && (
              <Button component="label" variant="outlined" startIcon={<UploadFileRounded />} disabled={disabled} sx={{ alignSelf: 'flex-start' }}>
                Cargar archivo de música
                <input hidden type="file" accept="audio/*" onChange={(evento) => { const file = evento.target.files?.[0]; evento.target.value = ''; cargarMusica(tema, file); }} />
              </Button>
            )}
          </Stack>
        )}

        {tab === 'VIDEO' && (
          <Stack spacing={2.5}>
            <ResumenVideo tema={tema} />
            <Divider />
            <RecursosTemaPanel tema={tema} plantillaUrl={plantillaUrl} disabled={disabled} soloTipo="VIDEO" onCambiarPresentacion={() => {}} onGuardar={(tipo, datos) => guardarRecurso(tema, tipo, datos)} />
          </Stack>
        )}

        {tab === 'PALANCA' && (
          <Stack spacing={2.5}>
            <ResumenPalanca tema={tema} />
            <Divider />
            <RecursosTemaPanel tema={tema} plantillaUrl={plantillaUrl} disabled={disabled} soloTipo="PALANCA" onCambiarPresentacion={() => {}} onGuardar={(tipo, datos) => guardarRecurso(tema, tipo, datos)} />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
