import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import ChurchRounded from '@mui/icons-material/ChurchRounded';
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
                helperText={tipo === 'habitacion' ? 'Tipo, mesa, rol o equipo' : tipo === 'formato3' ? 'Habitación y mesa, ambas alineadas a la derecha' : 'Mesa y habitación'}
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


function BloqueAcordeon({
  titulo,
  descripcion,
  icono,
  defaultExpanded = false,
  children,
}) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px !important',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        '&:before': { display: 'none' },
        '& + &': { mt: 2 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 0.8,
          bgcolor: 'action.hover',
          '& .MuiAccordionSummary-content': { my: 1.2 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              flexShrink: 0,
            }}
          >
            {icono}
          </Box>
          <Box minWidth={0}>
            <Typography variant="h6" fontWeight={900} lineHeight={1.15}>
              {titulo}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.4}>
              {descripcion}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: 'background.default' }}>
        {children}
      </AccordionDetails>
    </Accordion>
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
  const [datos, setDatos] = useState({ caminantes: [], servidores: [], habitaciones: [] });
  const [cam, setCam] = useState('');
  const [hab, setHab] = useState('');
  const [camSobre, setCamSobre] = useState('');
  const [camSantisimo, setCamSantisimo] = useState('');

  const personasSantisimo = useMemo(() => {
    const caminantes = (datos.caminantes || [])
      .filter((persona) => persona?.activo !== false)
      .map((persona) => ({ ...persona, tipoPersona: 'Caminante' }));

    const servidores = (datos.servidores || [])
      .filter((persona) => persona?.activo !== false)
      .map((persona) => ({ ...persona, tipoPersona: 'Servidor' }));

    return [...caminantes, ...servidores];
  }, [datos.caminantes, datos.servidores]);

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
      setDatos({ caminantes: [], servidores: [], habitaciones: [] });
      return;
    }

    try {
      const d = await obtenerDatosGeneracionImpresion(token);
      setDatos(d || { caminantes: [], servidores: [], habitaciones: [] });
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
        eyebrow="Logística · Impresión"
        title="Escarapelas, marcaciones y sobres"
        subtitle="Configura cada formato y genera sus PDF desde el mismo bloque. Abre únicamente la opción que necesites para mantener la página ordenada."
      />

      <Stack spacing={2.5}>
        {err && <Alert severity="error">{err}</Alert>}

        <BloqueAcordeon
          titulo="Escarapelas"
          descripcion="Configura la plantilla de la escarapela y genera el PDF para todos los caminantes o uno individual."
          icono={<BadgeRounded />}
          defaultExpanded
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Plantilla
                titulo="Configuración de escarapela"
                tipo="escarapela"
                config={cfg.escarapela}
                token={token}
                puede={puedeCfg}
                onSaved={cargar}
                onProcesando={cambiarProceso}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={900}>Generación de escarapelas</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {datos.caminantes?.length || 0} caminantes activos disponibles para generar.
                    </Typography>

                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdfRounded />}
                      disabled={!puedeGen || !cfg.escarapela?.fileId}
                      onClick={() =>
                        ejecutar(
                          'Generando escarapelas',
                          'Estamos preparando el PDF de todos los caminantes. La descarga iniciará al finalizar.',
                          async () => generarEscarapelasPdf(datos.caminantes, await plantilla('escarapela')),
                        )
                      }
                    >
                      Generar todas
                    </Button>

                    <TextField select label="Caminante" value={cam} onChange={(e) => setCam(e.target.value)}>
                      {(datos.caminantes || []).map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
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
          </Grid>
        </BloqueAcordeon>

        <BloqueAcordeon
          titulo="Marcación de habitaciones"
          descripcion="Configura la plantilla de habitación y genera las marcaciones de las habitaciones que tengan personas asignadas."
          icono={<HotelRounded />}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Plantilla
                titulo="Configuración de habitación"
                tipo="habitacion"
                config={cfg.habitacion}
                token={token}
                puede={puedeCfg}
                onSaved={cargar}
                onProcesando={cambiarProceso}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={900}>Generación de habitaciones</Typography>
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
                          async () => generarHabitacionesPdf(
                            (datos.habitaciones || []).filter((x) => Array.isArray(x.personas) && x.personas.length > 0),
                            await plantilla('habitacion'),
                          ),
                        )
                      }
                    >
                      Generar todas
                    </Button>

                    <TextField select label="Habitación" value={hab} onChange={(e) => setHab(e.target.value)}>
                      {(datos.habitaciones || [])
                        .filter((item) => Array.isArray(item.personas) && item.personas.length > 0)
                        .map((item) => (
                          <MenuItem key={item.id} value={item.id}>Habitación {item.habitacion}</MenuItem>
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
                            const item = datos.habitaciones.find((x) => x.id === hab);
                            await generarHabitacionPdf(item, await plantilla('habitacion'));
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
        </BloqueAcordeon>

        <BloqueAcordeon
          titulo="Sobres de bienvenida"
          descripcion="Configura el formato de los sobres y genera las marcaciones para todos los caminantes o uno individual."
          icono={<MailOutlineRounded />}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Plantilla
                titulo="Configuración de sobres de bienvenida"
                tipo="formato3"
                config={cfg.formato3}
                token={token}
                puede={puedeCfg}
                onSaved={cargar}
                onProcesando={cambiarProceso}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={900}>Generación de sobres</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Genera nombre y apellidos en dos filas, con mesa y habitación alineadas a la derecha.
                    </Typography>

                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdfRounded />}
                      disabled={!puedeGen || !cfg.formato3?.fileId}
                      onClick={() =>
                        ejecutar(
                          'Generando sobres de bienvenida',
                          'Estamos preparando las marcaciones para los sobres de todos los caminantes.',
                          async () => generarSobresBienvenidaPdf(datos.caminantes, await plantilla('formato3')),
                        )
                      }
                    >
                      Generar todos
                    </Button>

                    <TextField select label="Caminante" value={camSobre} onChange={(e) => setCamSobre(e.target.value)}>
                      {(datos.caminantes || []).map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
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
                            await generarSobreBienvenidaIndividualPdf(c, await plantilla('formato3'));
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
        </BloqueAcordeon>

        <BloqueAcordeon
          titulo="Nombres para Santísimo"
          descripcion="Configura la tarjeta para Santísimo y genera nombres de caminantes y servidores activos."
          icono={<ChurchRounded />}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Plantilla
                titulo="Configuración de nombres para Santísimo"
                tipo="formato4"
                config={cfg.formato4}
                token={token}
                puede={puedeCfg}
                onSaved={cargar}
                onProcesando={cambiarProceso}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={900}>Generación para Santísimo</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {personasSantisimo.length} personas activas entre caminantes y servidores.
                    </Typography>

                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdfRounded />}
                      disabled={!puedeGen || !cfg.formato4?.fileId}
                      onClick={() =>
                        ejecutar(
                          'Generando nombres para Santísimo',
                          'Estamos preparando los nombres de todos los caminantes y servidores activos.',
                          async () => generarNombresSantisimoPdf(personasSantisimo, await plantilla('formato4')),
                        )
                      }
                    >
                      Generar todos
                    </Button>

                    <TextField
                      select
                      label="Caminante o servidor"
                      value={camSantisimo}
                      onChange={(e) => setCamSantisimo(e.target.value)}
                    >
                      {personasSantisimo.map((persona) => {
                        const valor = `${persona.tipoPersona}:${persona.id}`;
                        return (
                          <MenuItem key={valor} value={valor}>
                            {persona.nombre} · {persona.tipoPersona}
                          </MenuItem>
                        );
                      })}
                    </TextField>

                    <Button
                      variant="outlined"
                      disabled={!puedeGen || !camSantisimo || !cfg.formato4?.fileId}
                      onClick={() =>
                        ejecutar(
                          'Generando nombre para Santísimo',
                          'Estamos preparando el nombre de la persona seleccionada.',
                          async () => {
                            const persona = personasSantisimo.find(
                              (x) => `${x.tipoPersona}:${x.id}` === camSantisimo,
                            );
                            if (!persona) throw new Error('No fue posible encontrar la persona seleccionada.');
                            await generarNombreSantisimoIndividualPdf(persona, await plantilla('formato4'));
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
        </BloqueAcordeon>
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
