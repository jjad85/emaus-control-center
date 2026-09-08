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
  generarSobresBienvenidaPdf,
  generarSobreBienvenidaIndividualPdf,
  generarNombresSantisimoPdf,
  generarNombreSantisimoIndividualPdf,
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
  if (tipo === 'habitacion') return { central: 18, inferior: 10, fuente: 'helvetica' };
  if (tipo === 'formato3') return { central: 20, inferior: 11, fuente: 'helvetica' };
  return { central: 20, inferior: 11, fuente: 'helvetica' };
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
      if (tipo !== 'formato4' && !(Number(inferior) >= 6 && Number(inferior) <= 48)) {
        throw new Error('El tamaño de letra inferior debe estar entre 6 y 48 pt.');
      }

      const inferiorGuardar = tipo === 'formato4' ? central : inferior;
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
          inferiorGuardar,
          fuente,
        );
      } else {
        await guardarConfiguracionPlantillaImpresionApi(
          token,
          tipo,
          w,
          h,
          central,
          inferiorGuardar,
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

          {tipo === 'formato4' ? (
            <TextField
              label="Tamaño del nombre (pt)"
              type="number"
              value={central}
              onChange={(e) => setCentral(e.target.value)}
              disabled={!puede}
              inputProps={{ min: 6, max: 72, step: 1 }}
              helperText="Nombre del caminante centrado en tamaño grande."
            />
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Tamaño letra central (pt)"
                type="number"
                value={central}
                onChange={(e) => setCentral(e.target.value)}
                disabled={!puede}
                inputProps={{ min: 6, max: 72, step: 1 }}
                helperText={tipo === 'habitacion' ? 'Habitación y nombres principales' : 'Nombre del caminante'}
              />
              <TextField
                label="Tamaño letra inferior (pt)"
                type="number"
                value={inferior}
                onChange={(e) => setInferior(e.target.value)}
                disabled={!puede}
                inputProps={{ min: 6, max: 48, step: 1 }}
                helperText={tipo === 'habitacion' ? 'Tipo, mesa, rol o equipo' : tipo === 'formato3' ? 'Mesa y habitación, ambas alineadas a la derecha' : 'Mesa y habitación'}
              />
            </Stack>
          )}

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


function textoClave(valor) {
  return String(valor == null ? '' : valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function enriquecerCaminanteParaSobre(caminante, habitaciones = []) {
  if (!caminante) return caminante;

  const idCaminante = String(
    caminante.id || caminante.caminanteId || caminante.personaId || ''
  ).trim();
  const nombreCaminante = textoClave(caminante.nombre);

  let personaHabitacion = null;
  let habitacionEncontrada = null;

  for (const habitacion of habitaciones || []) {
    const personas = Array.isArray(habitacion?.personas) ? habitacion.personas : [];
    const persona = personas.find((p) => {
      const idPersona = String(
        p?.id || p?.caminanteId || p?.personaId || p?.servidorId || ''
      ).trim();
      if (idCaminante && idPersona && idCaminante === idPersona) return true;
      return nombreCaminante && textoClave(p?.nombre) === nombreCaminante;
    });

    if (persona) {
      personaHabitacion = persona;
      habitacionEncontrada = habitacion;
      break;
    }
  }

  const mesa =
    caminante.mesa ||
    caminante.numeroMesa ||
    caminante.mesaNumero ||
    personaHabitacion?.mesa ||
    personaHabitacion?.numeroMesa ||
    personaHabitacion?.mesaNumero ||
    '';

  const habitacion =
    caminante.habitacion ||
    caminante.numeroHabitacion ||
    caminante.habitacionNumero ||
    personaHabitacion?.habitacion ||
    habitacionEncontrada?.habitacion ||
    habitacionEncontrada?.numero ||
    '';

  return {
    ...caminante,
    mesa,
    habitacion,
  };
}

function enriquecerCaminantesParaSobres(caminantes = [], habitaciones = []) {
  return (caminantes || []).map((c) =>
    enriquecerCaminanteParaSobre(c, habitaciones)
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
  const [camSobre, setCamSobre] = useState('');
  const [camSantisimo, setCamSantisimo] = useState('');
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
    setErr('');

    // La configuración y los datos de generación son cargas independientes.
    // Esto evita bloquear toda la pantalla cuando un rol puede entrar al
    // módulo pero no tiene permiso para generar PDFs o configurar plantillas.
    try {
      const c = await obtenerConfiguracionImpresion(token);
      setCfg(c || {});
    } catch (e) {
      setErr(e.message || 'No fue posible cargar la configuración de impresión.');
    }

    if (!puedeGen) {
      setDatos({ caminantes: [], habitaciones: [] });
      return;
    }

    try {
      const d = await obtenerDatosGeneracionImpresion(token);
      setDatos(d || { caminantes: [], habitaciones: [] });
    } catch (e) {
      setErr((actual) => actual || e.message || 'No fue posible cargar los datos para generar los PDFs.');
    }
  }

  useEffect(() => {
    if (!token) return;
    cargar();
  }, [token, puedeGen]);

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
        titulo="Escarapelas, marcaciones y sobres"
        subtitulo="Configura escarapelas, habitaciones, sobres de bienvenida y nombres para Santísimo. Todos los PDF se optimizan para corte."
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Plantilla
              titulo="Opción 3 · Sobres de bienvenida"
              tipo="formato3"
              config={cfg.formato3}
              token={token}
              puede={puedeCfg}
              onSaved={cargar}
              onProcesando={cambiarProceso}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Plantilla
              titulo="Opción 4 · Nombres para Santísimo"
              tipo="formato4"
              config={cfg.formato4}
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
                    {(datos.habitaciones || []).filter((x) => Array.isArray(x.personas) && x.personas.length > 0).length} habitaciones con asignación.
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
                            (datos.habitaciones || []).filter((x) => Array.isArray(x.personas) && x.personas.length > 0),
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
                    {(datos.habitaciones || []).filter((h) => Array.isArray(h.personas) && h.personas.length > 0).map((h) => (
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={900}>
                    Opción 3 · Marcación de sobres de bienvenida
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Genera dos filas centradas: nombre 1 + nombre 2 y, debajo, apellido 1 + apellido 2. Habitación y mesa usan el tamaño inferior parametrizable y se alinean a la derecha.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdfRounded />}
                    disabled={!puedeGen || !cfg.formato3?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando sobres de bienvenida',
                        'Estamos preparando las marcaciones para los sobres de todos los caminantes.',
                        async () => generarSobresBienvenidaPdf(
                          enriquecerCaminantesParaSobres(datos.caminantes, datos.habitaciones),
                          await plantilla('formato3'),
                        ),
                      )
                    }
                  >
                    Generar todos
                  </Button>

                  <TextField
                    select
                    label="Caminante"
                    value={camSobre}
                    onChange={(e) => setCamSobre(e.target.value)}
                  >
                    {(datos.caminantes || []).map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    disabled={!puedeGen || !camSobre || !cfg.formato3?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando sobre de bienvenida',
                        'Estamos preparando la marcación del caminante seleccionado.',
                        async () => {
                          const c = datos.caminantes.find((x) => x.id === camSobre);
                          const sobre = enriquecerCaminanteParaSobre(c, datos.habitaciones);
                          await generarSobreBienvenidaIndividualPdf(sobre, await plantilla('formato3'));
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
                    Opción 4 · Nombres para Santísimo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Imagen de fondo y nombre del caminante centrado en texto grande.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdfRounded />}
                    disabled={!puedeGen || !cfg.formato4?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando nombres para Santísimo',
                        'Estamos preparando los nombres de todos los caminantes.',
                        async () => generarNombresSantisimoPdf(datos.caminantes, await plantilla('formato4')),
                      )
                    }
                  >
                    Generar todos
                  </Button>

                  <TextField
                    select
                    label="Caminante"
                    value={camSantisimo}
                    onChange={(e) => setCamSantisimo(e.target.value)}
                  >
                    {(datos.caminantes || []).map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    disabled={!puedeGen || !camSantisimo || !cfg.formato4?.fileId}
                    onClick={() =>
                      ejecutar(
                        'Generando nombre para Santísimo',
                        'Estamos preparando el nombre del caminante seleccionado.',
                        async () => {
                          const c = datos.caminantes.find((x) => x.id === camSantisimo);
                          await generarNombreSantisimoIndividualPdf(c, await plantilla('formato4'));
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
