import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import { useMemo, useState } from 'react';
import {
  archivoABase64DocumentoIdentidad,
  consultarDocumentoIdentidadPublico,
  registrarDocumentoIdentidadPublico,
} from '../api/documentosIdentidadApi';

const MAX_IMAGEN_PX = 1800;

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No fue posible procesar una de las imágenes. Usa JPG, PNG o WEBP.'));
    };
    image.src = url;
  });
}

function escalarDimensiones(ancho, alto, maximo = MAX_IMAGEN_PX) {
  const factor = Math.min(1, maximo / Math.max(ancho, alto));
  return {
    ancho: Math.max(1, Math.round(ancho * factor)),
    alto: Math.max(1, Math.round(alto * factor)),
  };
}

async function imagenUnicaNormalizada(file) {
  const img = await cargarImagen(file);
  const dims = escalarDimensiones(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = dims.ancho;
  canvas.height = dims.alto;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, dims.ancho, dims.alto);
  return {
    nombre: 'cedula.jpg',
    tipo: 'image/jpeg',
    base64: canvas.toDataURL('image/jpeg', 0.86),
  };
}

async function combinarDosImagenes(frente, posterior) {
  const [imgFrente, imgPosterior] = await Promise.all([
    cargarImagen(frente),
    cargarImagen(posterior),
  ]);

  const anchoObjetivo = Math.min(
    MAX_IMAGEN_PX,
    Math.max(imgFrente.naturalWidth, imgPosterior.naturalWidth)
  );

  function calcular(img) {
    const factor = Math.min(
      1,
      anchoObjetivo / img.naturalWidth,
      MAX_IMAGEN_PX / img.naturalHeight
    );
    return {
      ancho: Math.round(img.naturalWidth * factor),
      alto: Math.round(img.naturalHeight * factor),
    };
  }

  const a = calcular(imgFrente);
  const b = calcular(imgPosterior);
  const separacion = 24;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(a.ancho, b.ancho);
  canvas.height = a.alto + b.alto + separacion;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgFrente, Math.round((canvas.width - a.ancho) / 2), 0, a.ancho, a.alto);
  ctx.drawImage(
    imgPosterior,
    Math.round((canvas.width - b.ancho) / 2),
    a.alto + separacion,
    b.ancho,
    b.alto
  );

  return {
    nombre: 'cedula_frente_y_posterior.jpg',
    tipo: 'image/jpeg',
    base64: canvas.toDataURL('image/jpeg', 0.86),
  };
}

export default function RegistroDocumentoIdentidad() {
  const [documento, setDocumento] = useState('');
  const [persona, setPersona] = useState(null);
  const [modo, setModo] = useState('dos-imagenes');
  const [frente, setFrente] = useState(null);
  const [posterior, setPosterior] = useState(null);
  const [imagenUnica, setImagenUnica] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [yaExiste, setYaExiste] = useState(false);

  const documentoLimpio = useMemo(() => documento.replace(/\D/g, ''), [documento]);

  function limpiarArchivos() {
    setFrente(null);
    setPosterior(null);
    setImagenUnica(null);
    setPdf(null);
  }

  async function buscar() {
    if (documentoLimpio.length < 5) {
      setError('Ingresa un número de documento válido.');
      return;
    }

    setBuscando(true);
    setError('');
    setExito('');
    setPersona(null);
    limpiarArchivos();

    try {
      const resultado = await consultarDocumentoIdentidadPublico(documentoLimpio);
      setPersona(resultado);
      if (resultado.tieneDocumento) setYaExiste(true);
    } catch (err) {
      setError(err.message || 'No fue posible consultar el documento.');
    } finally {
      setBuscando(false);
    }
  }

  async function prepararArchivo() {
    if (modo === 'pdf') {
      if (!pdf) throw new Error('Selecciona el PDF de la cédula.');
      if (pdf.type !== 'application/pdf') throw new Error('El archivo seleccionado debe ser PDF.');
      return archivoABase64DocumentoIdentidad(pdf);
    }

    if (modo === 'una-imagen') {
      if (!imagenUnica) throw new Error('Selecciona la imagen con la cédula por ambos lados.');
      return imagenUnicaNormalizada(imagenUnica);
    }

    if (!frente || !posterior) {
      throw new Error('Selecciona la imagen del frente y la imagen de la parte posterior.');
    }
    return combinarDosImagenes(frente, posterior);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    setExito('');

    try {
      const archivo = await prepararArchivo();
      await registrarDocumentoIdentidadPublico(documentoLimpio, archivo);
      setExito('Documento recibido correctamente. Gracias por completar esta información.');
      setPersona((actual) => actual ? { ...actual, tieneDocumento: true } : actual);
      limpiarArchivos();
    } catch (err) {
      if (err?.codigo === 'DOCUMENTO_IDENTIDAD_YA_REGISTRADO' ||
          String(err?.message || '').toLowerCase().includes('ya tenemos')) {
        setYaExiste(true);
      } else {
        setError(err.message || 'No fue posible registrar el documento.');
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f7f5', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 5,
              color: '#f6fffb',
              background: 'linear-gradient(145deg, #0b322b 0%, #145447 62%, #277965 100%)',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Box sx={{ width: 64, height: 64, borderRadius: 3.5, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,.12)' }}>
                <BadgeRounded sx={{ fontSize: 36 }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: '#bcebdc', fontWeight: 900, letterSpacing: '.12em' }}>
                  Retiro de Emaús
                </Typography>
                <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: '2rem', md: '2.7rem' } }}>
                  Documento de identidad
                </Typography>
                <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.78)', lineHeight: 1.7 }}>
                  Adjunta una copia clara de tu cédula para completar la información requerida por la casa de retiros.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" fontWeight={900}>1. Identifícate</Typography>
                  <Typography color="text.secondary" mt={0.5}>
                    Ingresa exactamente el número de documento registrado en el retiro.
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Número de documento"
                    value={documento}
                    onChange={(e) => {
                      setDocumento(e.target.value.replace(/\D/g, ''));
                      setPersona(null);
                      setError('');
                      setExito('');
                    }}
                    inputProps={{ inputMode: 'numeric', maxLength: 15 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') buscar(); }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={buscando ? <CircularProgress size={18} color="inherit" /> : <SearchRounded />}
                    onClick={buscar}
                    disabled={buscando}
                    sx={{ minWidth: 150 }}
                  >
                    Buscar
                  </Button>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}
                {exito && <Alert severity="success" icon={<CheckCircleRounded />}>{exito}</Alert>}

                {persona && !persona.tieneDocumento && (
                  <>
                    <Divider />
                    <Alert severity="success" icon={<CheckCircleRounded />}>
                      Encontramos a <strong>{persona.nombre}</strong> · {persona.tipoPersona}
                    </Alert>

                    <Box>
                      <Typography variant="h5" fontWeight={900}>2. Adjunta la cédula</Typography>
                      <Typography color="text.secondary" mt={0.5}>
                        Puedes enviar dos fotos, una sola foto con ambos lados o un PDF.
                      </Typography>
                    </Box>

                    <FormControl>
                      <RadioGroup value={modo} onChange={(e) => { setModo(e.target.value); limpiarArchivos(); }}>
                        <FormControlLabel
                          value="dos-imagenes"
                          control={<Radio />}
                          label="Dos imágenes: frente y posterior"
                        />
                        <FormControlLabel
                          value="una-imagen"
                          control={<Radio />}
                          label="Una sola imagen con la cédula por ambos lados"
                        />
                        <FormControlLabel
                          value="pdf"
                          control={<Radio />}
                          label="Un PDF con la cédula"
                        />
                      </RadioGroup>
                    </FormControl>

                    {modo === 'dos-imagenes' && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button component="label" variant="outlined" startIcon={<PhotoCameraRounded />} fullWidth>
                          {frente ? `Frente: ${frente.name}` : 'Seleccionar frente'}
                          <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFrente(e.target.files?.[0] || null)} />
                        </Button>
                        <Button component="label" variant="outlined" startIcon={<PhotoCameraRounded />} fullWidth>
                          {posterior ? `Posterior: ${posterior.name}` : 'Seleccionar posterior'}
                          <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPosterior(e.target.files?.[0] || null)} />
                        </Button>
                      </Stack>
                    )}

                    {modo === 'una-imagen' && (
                      <Button component="label" variant="outlined" startIcon={<PhotoCameraRounded />}>
                        {imagenUnica ? imagenUnica.name : 'Seleccionar imagen'}
                        <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImagenUnica(e.target.files?.[0] || null)} />
                      </Button>
                    )}

                    {modo === 'pdf' && (
                      <Button component="label" variant="outlined" startIcon={<PictureAsPdfRounded />}>
                        {pdf ? pdf.name : 'Seleccionar PDF'}
                        <input hidden type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
                      </Button>
                    )}

                    <Alert severity="info">
                      Si eliges dos imágenes, el sistema las unirá automáticamente en una sola imagen antes de guardarlas.
                    </Alert>

                    <Button
                      variant="contained"
                      size="large"
                      startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <CloudUploadRounded />}
                      onClick={guardar}
                      disabled={guardando}
                    >
                      {guardando ? 'Enviando documento…' : 'Enviar documento'}
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Typography variant="caption" textAlign="center" color="text.secondary">
            Los documentos son almacenados de forma privada y solo pueden ser consultados por el equipo autorizado del retiro.
          </Typography>
        </Stack>
      </Container>

      <Dialog open={yaExiste} onClose={() => setYaExiste(false)} fullWidth maxWidth="sm">
        <DialogTitle>Documento ya registrado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1} alignItems="center" textAlign="center">
            <CheckCircleRounded color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h6" fontWeight={900}>
              Ya tenemos tu documento de identidad adjunto.
            </Typography>
            <Typography color="text.secondary">
              No necesitas volver a subirlo. Gracias por completar esta información.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setYaExiste(false)}>Entendido</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
