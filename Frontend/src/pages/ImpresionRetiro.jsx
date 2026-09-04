import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import HotelRounded from '@mui/icons-material/HotelRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import { useEffect, useMemo, useState } from 'react';
import adlamDisplayUrl from '../assets/fonts/ADLaMDisplay-Regular.ttf?url';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/AuthContext';
import {
  obtenerConfiguracionImpresion,
  obtenerDatosGeneracionImpresion,
  obtenerImagenPlantillaImpresion,
  guardarPlantillaImpresionApi,
  guardarConfiguracionPlantillaImpresionApi,
} from '../api/impresionRetiroApi';
import {
  generarEscarapelasPdf,
  generarEscarapelaPdf,
  generarHabitacionesPdf,
  generarHabitacionPdf,
} from '../utils/pdfImpresionRetiro';

const FUENTES = [
  { value: 'adlam', label: 'ADLaM Display' },
  { value: 'helvetica', label: 'Helvetica / Arial' },
  { value: 'times', label: 'Times' },
  { value: 'courier', label: 'Courier' },
];

function archivoBase64(file) {
  return new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () =>
      ok({
        nombre: file.name,
        tipo: file.type,
        base64: r.result,
      });
    r.onerror = no;
    r.readAsDataURL(file);
  });
}

function valoresDefecto(tipo) {
  return tipo === 'escarapela'
    ? { central: 20, inferior: 11, fuente: 'helvetica' }
    : { central: 18, inferior: 10, fuente: 'helvetica' };
}

function Plantilla({
  titulo,
  tipo,
  config,
  token,
  puede,
  onSaved,
  onProcesando,
}) {
  const defecto = useMemo(() => valoresDefecto(tipo), [tipo]);
  const [file, setFile] = useState(null);
  const [w, setW] = useState(config?.anchoCm || '');
  const [h, setH] = useState(config?.altoCm || '');
  const [central, setCentral] = useState(config?.tamanoCentralPt || defecto.central);
  const [inferior, setInferior] = useState(config?.tamanoInferiorPt || defecto.inferior);
  const [fuente, setFuente] = useState(config?.fuente || defecto.fuente);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState('');
  const [previewCargando, setPreviewCargando] = useState(false);

  useEffect(() => {
    setW(config?.anchoCm || '');
    setH(config?.altoCm || '');
    setCentral(config?.tamanoCentralPt || defecto.central);
    setInferior(config?.tamanoInferiorPt || defecto.inferior);
    setFuente(config?.fuente || defecto.fuente);
  }, [config, defecto]);

  useEffect(() => {
    let activo = true;

    async function cargarPreview() {
      if (!config?.fileId) {
        setPreview('');
        return;
      }

      setPreviewCargando(true);
      try {
        const imagen = await obtenerImagenPlantillaImpresion(token, tipo);
        if (activo) setPreview(imagen?.base64 || '');
      } catch (_) {
        if (activo) setPreview('');
      } finally {
        if (activo) setPreviewCargando(false);
      }
    }

    cargarPreview();
    return () => {
      activo = false;
    };
  }, [config?.fileId, config?.actualizado, token, tipo]);

  async function guardar() {
    try {
      setErr('');
      if (!file && !config?.fileId) {
        throw new Error('Seleccione una imagen para configurar la plantilla por primera vez.');
      }
      if (!(Number(w) > 0) || !(Number(h) > 0)) {
        throw new Error('Indique ancho y alto válidos.');
      }
      if (!(Number(central) >= 6 && Number(central) <= 72)) {
        throw new Error('El tamaño de letra central debe estar entre 6 y 72 pt.');
      }
      if (!(Number(inferior) >= 6 && Number(inferior) <= 48)) {
        throw new Error('El tamaño de letra inferior debe estar entre 6 y 48 pt.');
      }

      const reemplazaImagen = Boolean(file);
      onProcesando(
        true,
        reemplazaImagen ? 'Guardando plantilla' : 'Guardando configuración',
        reemplazaImagen
          ? 'Estamos procesando la nueva imagen y guardando la configuración.'
          : 'Estamos guardando los tamaños y la tipografía sin modificar la imagen actual.',
      );
      if (reemplazaImagen) {
        const a = await archivoBase64(file);
        await guardarPlantillaImpresionApi(
          token,
          tipo,
          a,
          w,
          h,
          central,
          inferior,
          fuente,
        );
      } else {
        await guardarConfiguracionPlantillaImpresionApi(
          token,
          tipo,
          w,
          h,
          central,
          inferior,
          fuente,
        );
      }
      setFile(null);
      await onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      onProcesando(false);
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={900}>
            {titulo}
          </Typography>

          {config?.nombre && (
            <Alert severity="success">
              Configurada: <b>{config.nombre}</b> · {config.anchoCm} × {config.altoCm} cm
            </Alert>
          )}

          {config?.fileId && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Imagen configurada actualmente
              </Typography>
              <Box
                sx={{
                  width: 170,
                  minHeight: 100,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  p: 1,
                }}
              >
                {previewCargando ? (
                  <CircularProgress size={26} />
                ) : preview ? (
                  <Box
                    component="img"
                    src={preview}
                    alt={`Vista previa ${titulo}`}
                    sx={{ maxWidth: '100%', maxHeight: 130, objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Sin vista previa
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {err && <Alert severity="error">{err}</Alert>}

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileRounded />}
            disabled={!puede}
          >
            Seleccionar imagen
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Button>

          {file && <Typography variant="caption">Nueva imagen: {file.name}</Typography>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Ancho (cm)"
              type="number"
              value={w}
              onChange={(e) => setW(e.target.value)}
              disabled={!puede}
              inputProps={{ min: 1, max: 50, step: 0.1 }}
            />
            <TextField
              label="Alto (cm)"
              type="number"
              value={h}
              onChange={(e) => setH(e.target.value)}
              disabled={!puede}
              inputProps={{ min: 1, max: 50, step: 0.1 }}
            />
          </Stack>

          <Divider />

          <Typography fontWeight={800}>Texto del PDF</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Tamaño letra central (pt)"
              type="number"
              value={central}
              onChange={(e) => setCentral(e.target.value)}
              disabled={!puede}
              inputProps={{ min: 6, max: 72, step: 1 }}
              helperText={tipo === 'escarapela' ? 'Nombre y texto CAMINANTE' : 'Título y nombres principales'}
            />
            <TextField
              label="Tamaño letra inferior (pt)"
              type="number"
              value={inferior}
              onChange={(e) => setInferior(e.target.value)}
              disabled={!puede}
              inputProps={{ min: 6, max: 48, step: 1 }}
              helperText={tipo === 'escarapela' ? 'Mesa y habitación' : 'Tipo de persona'}
            />
          </Stack>

          <TextField
            select
            label="Tipo de letra"
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            disabled={!puede}
          >
            {FUENTES.map((item) => (
              <MenuItem
                key={item.value}
                value={item.value}
                sx={item.value === 'adlam' ? { fontFamily: '"ADLaM Display", sans-serif' } : undefined}
              >
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" onClick={guardar} disabled={!puede}>
            Guardar configuración
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ImpresionRetiro() {
  useEffect(() => {
    // Carga la fuente también en el navegador para que el nombre de la opción
    // pueda mostrarse con ADLaM Display. El PDF la registra por separado en jsPDF.
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;

    const fuente = new FontFace('ADLaM Display', `url(${adlamDisplayUrl})`, {
      style: 'normal',
      weight: '400',
    });

    fuente.load()
      .then((cargada) => document.fonts.add(cargada))
      .catch(() => {
        // Si falla la vista previa tipográfica del navegador, no bloquea el módulo.
        // La generación PDF informará un error explícito si no puede cargar el TTF.
      });
  }, []);

  const { token, tienePermiso } = useAuth();
  const [cfg, setCfg] = useState({});
  const [datos, setDatos] = useState({ caminantes: [], habitaciones: [] });
  const [cam, setCam] = useState('');
  const [hab, setHab] = useState('');
  const [err, setErr] = useState('');
  const [proceso, setProceso] = useState({
    abierto: false,
    titulo: '',
    mensaje: '',
  });

  const puedeCfg = tienePermiso('SISTEMA_CONFIGURAR_PLANTILLAS_IMPRESION');
  const puedeGen = tienePermiso('SISTEMA_GENERAR_ESCARAPELAS_HABITACIONES');

  function cambiarProceso(abierto, titulo = '', mensaje = '') {
    setProceso({ abierto, titulo, mensaje });
  }

  async function cargar() {
    try {
      setErr('');
      const [c, d] = await Promise.all([
        obtenerConfiguracionImpresion(token),
        obtenerDatosGeneracionImpresion(token),
      ]);
      setCfg(c);
      setDatos(d);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, [token]);

  async function plantilla(tipo) {
    return obtenerImagenPlantillaImpresion(token, tipo);
  }

  async function ejecutar(titulo, mensaje, fn) {
    try {
      setErr('');
      cambiarProceso(true, titulo, mensaje);
      await fn();
    } catch (e) {
      setErr(e.message);
    } finally {
      cambiarProceso(false);
    }
  }

  return (
    <Box>
      <PageHeader
        titulo="Escarapelas y habitaciones"
        subtitulo="Configura las plantillas y genera PDFs listos para impresión."
        icono={<BadgeRounded />}
      />

      <Stack spacing={2.5}>
        {err && <Alert severity="error">{err}</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Plantilla
              titulo="Plantilla de escarapela"
              tipo="escarapela"
              config={cfg.escarapela}
              token={token}
              puede={puedeCfg}
              onSaved={cargar}
              onProcesando={cambiarProceso}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Plantilla
              titulo="Plantilla de habitación"
              tipo="habitacion"
              config={cfg.habitacion}
              token={token}
              puede={puedeCfg}
              onSaved={cargar}
              onProcesando={cambiarProceso}
            />
          </Grid>
        </Grid>

        <Divider />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={900}>
                    Escarapelas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {datos.caminantes?.length || 0} caminantes activos.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdfRounded />}
                    disabled={!puedeGen || !cfg.escarapela?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando escarapelas',
                        'Estamos preparando el PDF de todos los caminantes. La descarga iniciará al finalizar.',
                        async () =>
                          generarEscarapelasPdf(
                            datos.caminantes,
                            await plantilla('escarapela'),
                          ),
                      )
                    }
                  >
                    Generar todas
                  </Button>

                  <TextField
                    select
                    label="Caminante"
                    value={cam}
                    onChange={(e) => setCam(e.target.value)}
                  >
                    {(datos.caminantes || []).map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    disabled={!puedeGen || !cam || !cfg.escarapela?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando escarapela',
                        'Estamos preparando el PDF del caminante seleccionado.',
                        async () => {
                          const c = datos.caminantes.find((x) => x.id === cam);
                          await generarEscarapelaPdf(c, await plantilla('escarapela'));
                        },
                      )
                    }
                  >
                    Generar individual
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={900}>
                    Marcación de habitaciones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {datos.habitaciones?.length || 0} habitaciones.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<HotelRounded />}
                    disabled={!puedeGen || !cfg.habitacion?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando marcación de habitaciones',
                        'Estamos preparando el PDF de todas las habitaciones. La descarga iniciará al finalizar.',
                        async () =>
                          generarHabitacionesPdf(
                            datos.habitaciones,
                            await plantilla('habitacion'),
                          ),
                      )
                    }
                  >
                    Generar todas
                  </Button>

                  <TextField
                    select
                    label="Habitación"
                    value={hab}
                    onChange={(e) => setHab(e.target.value)}
                  >
                    {(datos.habitaciones || []).map((h) => (
                      <MenuItem key={h.id} value={h.id}>
                        Habitación {h.habitacion}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    disabled={!puedeGen || !hab || !cfg.habitacion?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando marcación de habitación',
                        'Estamos preparando el PDF de la habitación seleccionada.',
                        async () => {
                          const h = datos.habitaciones.find((x) => x.id === hab);
                          await generarHabitacionPdf(h, await plantilla('habitacion'));
                        },
                      )
                    }
                  >
                    Generar individual
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <Dialog
        open={proceso.abierto}
        disableEscapeKeyDown
        PaperProps={{ sx: { minWidth: { xs: 280, sm: 390 }, borderRadius: 3 } }}
      >
        <DialogContent>
          <Stack spacing={2.25} alignItems="center" textAlign="center" py={1.5}>
            <CircularProgress size={42} />
            <Box>
              <Typography variant="h6" fontWeight={900}>
                {proceso.titulo || 'Procesando'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.75}>
                {proceso.mensaje || 'Espera un momento mientras finaliza la operación.'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
