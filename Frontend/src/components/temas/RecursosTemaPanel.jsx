import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';

const MOMENTOS = [
  'Antes de iniciar la charla',
  'Durante la introducción',
  'Durante el desarrollo',
  'Después de una dinámica',
  'Al finalizar',
  'Cuando el expositor lo indique',
  'Otro',
];

const RESPONSABLES = [
  'Líder de mesa',
  'Responsable del tema',
  'Equipo de Logística',
  'Servidor designado',
  'Otro',
];

function estadoTexto(activo, estado) {
  return activo ? (estado || 'Pendiente de gestión') : 'No se utilizará';
}

function RecursoCard({ icono, titulo, activo, estado, detalle, onGestionar, disabled }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            {icono}
            <Typography fontWeight={900}>{titulo}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {estadoTexto(activo, estado)}
          </Typography>
          {detalle && <Typography variant="caption">{detalle}</Typography>}
          <Button size="small" variant={activo ? 'outlined' : 'contained'} onClick={onGestionar} disabled={disabled}>
            {activo ? 'Gestionar' : 'Configurar'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function RecursosTemaPanel({ tema, plantillaUrl, disabled, onCambiarPresentacion, onGuardar }) {
  const [dialogo, setDialogo] = useState('');
  const [form, setForm] = useState({});

  const cancionActiva = tema.requiereMusica === 'Sí';
  const videoActivo = Boolean(tema.usaVideo);
  const palancaActiva = Boolean(tema.requierePalanca);

  const datosIniciales = useMemo(() => ({
    CANCION: {
      activo: cancionActiva,
      usaEstandar: Boolean(tema.usaCancionEstandar && tema.tieneCancionEstandar),
      nombre: tema.cancionNombre || '',
      autor: tema.cancionAutor || '',
      enlace: tema.cancionEnlace || '',
      observaciones: tema.cancionObservaciones || '',
    },
    VIDEO: {
      activo: videoActivo,
      usaEstandar: Boolean(tema.usaVideoEstandar && tema.tieneVideoEstandar),
      nombre: tema.videoNombre || '',
      autorFuente: tema.videoAutorFuente || '',
      enlace: tema.videoEnlace || '',
      videoCompleto: tema.videoCompleto !== false,
      minutoInicio: tema.videoMinutoInicio || '',
      minutoFin: tema.videoMinutoFin || '',
      momentoReproduccion: tema.videoMomentoReproduccion || '',
      observaciones: tema.videoObservaciones || '',
    },
    PALANCA: {
      activo: palancaActiva,
      nombre: tema.palancaNombre || '',
      descripcion: tema.palancaDescripcion || '',
      momentoEntrega: tema.palancaMomentoEntrega || '',
      detalleMomento: tema.palancaDetalleMomento || '',
      formaEntrega: tema.palancaFormaEntrega || '',
      responsableEntrega: tema.palancaResponsableEntrega || '',
      detalleResponsable: tema.palancaDetalleResponsable || '',
      cantidad: tema.palancaCantidad || '',
      destinatarios: tema.palancaDestinatarios || '',
      requierePreparacion: Boolean(tema.palancaRequierePreparacion),
      instrucciones: tema.palancaInstrucciones || '',
      observaciones: tema.palancaObservaciones || '',
    },
  }), [tema, cancionActiva, videoActivo, palancaActiva]);

  useEffect(() => {
    if (dialogo) setForm(datosIniciales[dialogo]);
  }, [dialogo, datosIniciales]);

  function actualizar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar() {
    await onGuardar(dialogo, form);
    setDialogo('');
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={900}>Recursos del tema</Typography>

      <RecursoCard
        icono={<SlideshowRounded color="primary" />}
        titulo="Presentación"
        activo={tema.requierePresentacion === 'Sí'}
        estado={tema.estadoPreparacion}
        detalle="Plantilla, versiones, revisión y aprobación"
        disabled={disabled}
        onGestionar={() => onCambiarPresentacion(tema.requierePresentacion !== 'Sí')}
      />

      {tema.requierePresentacion === 'Sí' && plantillaUrl && (
        <Button component="a" href={plantillaUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<DownloadRounded />}>
          Descargar plantilla
        </Button>
      )}

      <RecursoCard
        icono={<MusicNoteRounded color="primary" />}
        titulo="Canción"
        activo={cancionActiva}
        estado={tema.cancionEstado}
        detalle={cancionActiva ? (tema.usaCancionEstandar ? `Estándar: ${tema.cancionDocumentoNombre || 'Documento asociado'}` : tema.cancionNombre || 'Canción personalizada') : ''}
        disabled={disabled}
        onGestionar={() => setDialogo('CANCION')}
      />

      <RecursoCard
        icono={<OndemandVideoRounded color="primary" />}
        titulo="Video"
        activo={videoActivo}
        estado={tema.videoEstado}
        detalle={videoActivo ? (tema.usaVideoEstandar ? `Estándar: ${tema.videoDocumentoNombre || 'Documento asociado'}` : tema.videoNombre || 'Video personalizado') : ''}
        disabled={disabled}
        onGestionar={() => setDialogo('VIDEO')}
      />

      <RecursoCard
        icono={<CardGiftcardRounded color="primary" />}
        titulo="Palanca"
        activo={palancaActiva}
        estado={tema.palancaEstado}
        detalle={palancaActiva ? tema.palancaNombre : ''}
        disabled={disabled}
        onGestionar={() => setDialogo('PALANCA')}
      />

      <Dialog open={Boolean(dialogo)} onClose={() => setDialogo('')} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogo === 'CANCION' ? 'Configurar canción' : dialogo === 'VIDEO' ? 'Configurar video' : 'Configurar palanca'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            <FormControlLabel
              control={<Switch checked={Boolean(form.activo)} onChange={(e) => actualizar('activo', e.target.checked)} />}
              label={dialogo === 'PALANCA' ? 'Este tema utilizará palanca' : `Este tema utilizará ${dialogo === 'CANCION' ? 'canción' : 'video'}`}
            />

            {form.activo && dialogo === 'CANCION' && (
              <>
                {tema.tieneCancionEstandar && (
                  <Box>
                    <Alert severity="info">Recurso estándar disponible: <strong>{tema.cancionDocumentoNombre || 'Documento asociado'}</strong></Alert>
                    <FormControlLabel control={<Checkbox checked={Boolean(form.usaEstandar)} onChange={(e) => actualizar('usaEstandar', e.target.checked)} />} label="Utilizar la canción estándar" />
                  </Box>
                )}
                {!form.usaEstandar && (
                  <>
                    <TextField required label="Nombre de la canción" value={form.nombre || ''} onChange={(e) => actualizar('nombre', e.target.value)} />
                    <TextField required label="Autor o intérprete" value={form.autor || ''} onChange={(e) => actualizar('autor', e.target.value)} />
                    <TextField required label="Enlace de referencia" placeholder="https://..." value={form.enlace || ''} onChange={(e) => actualizar('enlace', e.target.value)} />
                  </>
                )}
                <TextField label="Observaciones para Audiovisuales" multiline minRows={3} value={form.observaciones || ''} onChange={(e) => actualizar('observaciones', e.target.value)} />
              </>
            )}

            {form.activo && dialogo === 'VIDEO' && (
              <>
                {tema.tieneVideoEstandar && (
                  <Box>
                    <Alert severity="info">Recurso estándar disponible: <strong>{tema.videoDocumentoNombre || 'Documento asociado'}</strong></Alert>
                    <FormControlLabel control={<Checkbox checked={Boolean(form.usaEstandar)} onChange={(e) => actualizar('usaEstandar', e.target.checked)} />} label="Utilizar el video estándar" />
                  </Box>
                )}
                {!form.usaEstandar && (
                  <>
                    <TextField required label="Nombre del video" value={form.nombre || ''} onChange={(e) => actualizar('nombre', e.target.value)} />
                    <TextField required label="Autor, creador o fuente" value={form.autorFuente || ''} onChange={(e) => actualizar('autorFuente', e.target.value)} />
                    <TextField required label="Enlace de referencia" placeholder="https://..." value={form.enlace || ''} onChange={(e) => actualizar('enlace', e.target.value)} />
                  </>
                )}
                <FormControlLabel control={<Checkbox checked={form.videoCompleto !== false} onChange={(e) => actualizar('videoCompleto', e.target.checked)} />} label="Reproducir el video completo" />
                {form.videoCompleto === false && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField required fullWidth label="Minuto inicial" value={form.minutoInicio || ''} onChange={(e) => actualizar('minutoInicio', e.target.value)} />
                    <TextField required fullWidth label="Minuto final" value={form.minutoFin || ''} onChange={(e) => actualizar('minutoFin', e.target.value)} />
                  </Stack>
                )}
                <TextField label="Momento de reproducción" value={form.momentoReproduccion || ''} onChange={(e) => actualizar('momentoReproduccion', e.target.value)} />
                <TextField label="Observaciones para Audiovisuales" multiline minRows={3} value={form.observaciones || ''} onChange={(e) => actualizar('observaciones', e.target.value)} />
              </>
            )}

            {form.activo && dialogo === 'PALANCA' && (
              <>
                <TextField required label="Nombre o tipo de palanca" value={form.nombre || ''} onChange={(e) => actualizar('nombre', e.target.value)} />
                <TextField required label="Descripción" multiline minRows={2} value={form.descripcion || ''} onChange={(e) => actualizar('descripcion', e.target.value)} />
                <FormControl fullWidth required>
                  <InputLabel>Momento de entrega</InputLabel>
                  <Select label="Momento de entrega" value={form.momentoEntrega || ''} onChange={(e) => actualizar('momentoEntrega', e.target.value)}>
                    {MOMENTOS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Detalle del momento" value={form.detalleMomento || ''} onChange={(e) => actualizar('detalleMomento', e.target.value)} />
                <TextField required label="Forma de entrega" multiline minRows={2} value={form.formaEntrega || ''} onChange={(e) => actualizar('formaEntrega', e.target.value)} />
                <FormControl fullWidth required>
                  <InputLabel>Responsable de repartirla</InputLabel>
                  <Select label="Responsable de repartirla" value={form.responsableEntrega || ''} onChange={(e) => actualizar('responsableEntrega', e.target.value)}>
                    {RESPONSABLES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Detalle del responsable" value={form.detalleResponsable || ''} onChange={(e) => actualizar('detalleResponsable', e.target.value)} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField fullWidth label="Cantidad requerida" type="number" inputProps={{ min: 1 }} value={form.cantidad || ''} onChange={(e) => actualizar('cantidad', e.target.value)} />
                  <TextField required fullWidth label="Destinatarios" value={form.destinatarios || ''} onChange={(e) => actualizar('destinatarios', e.target.value)} />
                </Stack>
                <FormControlLabel control={<Checkbox checked={Boolean(form.requierePreparacion)} onChange={(e) => actualizar('requierePreparacion', e.target.checked)} />} label="Requiere preparación previa por Logística" />
                <TextField required label="Instrucciones para Logística" multiline minRows={3} value={form.instrucciones || ''} onChange={(e) => actualizar('instrucciones', e.target.value)} />
                <TextField label="Observaciones adicionales" multiline minRows={2} value={form.observaciones || ''} onChange={(e) => actualizar('observaciones', e.target.value)} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo('')}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={disabled}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
