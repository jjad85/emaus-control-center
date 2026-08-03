import {
  useEffect,
  useState,
} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  DialogActions,
  DialogTitle,
} from '@mui/material';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import AssignmentRounded from '@mui/icons-material/AssignmentRounded';
import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import HeadsetMicRounded from '@mui/icons-material/HeadsetMicRounded';
import LocalShippingRounded from '@mui/icons-material/LocalShippingRounded';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import EstadoTemaChip from '../components/temas/EstadoTemaChip';
import DetalleRecursosTema from '../components/temas/DetalleRecursosTema';
import ResumenRecursosTema, { obtenerResumenRecursos } from '../components/temas/ResumenRecursosTema';
import HistorialGeneralTema from '../components/temas/HistorialGeneralTema';
import AccionesPendientesTema from '../components/temas/AccionesPendientesTema';
import ProgresoPreparacionTema from '../components/temas/ProgresoPreparacionTema';
import FiltrosMisTemas from '../components/temas/FiltrosMisTemas';
import { responderRevisionServidor, comentarPresentacion } from '../api/entrega3PresentacionesApi';
import { actualizarPreferenciasMultimediaTema } from '../api/temasApi';
import {
  archivoABase64,
  actualizarPreferenciasMiTema,
  obtenerMiTemaAsignado,
  guardarRecursosMiTema,
  subirMusicaTema,
  subirVersionTema,
} from '../api/temasPresentacionesApi';

const MAX_ARCHIVO_BYTES =
  15 * 1024 * 1024;

export default function MisTemas() {
  const { token } = useAuth();
  const [data, setData] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');
  const [mensaje, setMensaje] =
    useState('');
  const [subiendo, setSubiendo] =
    useState('');
  const [comentario, setComentario] =
    useState({});
  const [cargaArchivo, setCargaArchivo] = useState(null);
  const [dialogoRevision, setDialogoRevision] = useState(null);
  const [textoRevision, setTextoRevision] = useState('');
  const [recursoDestacado, setRecursoDestacado] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroRecurso, setFiltroRecurso] = useState('TODOS');
  const [orden, setOrden] = useState('AGENDA');

  async function cargar() {
    setLoading(true);
    setError('');

    try {
      setData(
        await obtenerMiTemaAsignado(
          token
        )
      );
    } catch (e) {
      setError(
        e.message ||
          'No fue posible consultar los temas.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [token]);

  async function cambiar(
    tema,
    campo,
    valor
  ) {
    try {
      setSubiendo(
        tema.id + campo
      );

      if (campo === 'usaCancionEstandar' || campo === 'usaVideoEstandar') {
        await actualizarPreferenciasMultimediaTema(token, tema.id, { [campo]: valor });
      } else {
        await actualizarPreferenciasMiTema(token, tema.id, { [campo]: valor ? 'Sí' : 'No' });
      }

      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubiendo('');
    }
  }

  async function guardarRecurso(tema, tipo, datos) {
    try {
      setSubiendo(tema.id + tipo);
      setError('');
      setMensaje('');
      await guardarRecursosMiTema(token, tema.id, { tipo, ...datos });
      setMensaje('La configuración del recurso fue guardada correctamente.');
      await cargar();
    } catch (e) {
      setError(e.message || 'No fue posible guardar el recurso.');
      throw e;
    } finally {
      setSubiendo('');
    }
  }

  function validarArchivo(file) {
    if (!file) {
      return false;
    }

    if (file.size > MAX_ARCHIVO_BYTES) {
      setError(
        'El archivo supera el tamaño máximo permitido de 15 MB.'
      );
      return false;
    }

    return true;
  }

  function iniciarCarga(
    tema,
    file,
    tipo
  ) {
    setError('');
    setMensaje('');
    setCargaArchivo({
      temaId: tema.id,
      nombre: file.name,
      tipo,
      etapa: 'Preparando archivo',
      porcentaje: 0,
    });
  }



  async function cargarPpt(
    tema,
    file
  ) {
    if (!validarArchivo(file)) {
      return;
    }

    try {
      setSubiendo(
        tema.id + 'ppt'
      );
      iniciarCarga(
        tema,
        file,
        'presentación'
      );

      const archivo =
        await archivoABase64(file);

      setCargaArchivo(
        (actual) => ({
          ...actual,
          etapa: 'Enviando y guardando en Drive',
          porcentaje: null,
        })
      );

      await subirVersionTema(
        token,
        tema.id,
        archivo,
        comentario[tema.id] || ''
      );

      setMensaje(
        'La presentación quedó enviada para revisión.'
      );
      setComentario((actual) => ({
        ...actual,
        [tema.id]: '',
      }));

      await cargar();
    } catch (e) {
      setError(
        e.message ||
          'No fue posible cargar la presentación.'
      );
    } finally {
      setSubiendo('');
      setCargaArchivo(null);
    }
  }

  async function cargarMusica(
    tema,
    file
  ) {
    if (!validarArchivo(file)) {
      return;
    }

    try {
      setSubiendo(
        tema.id + 'musica'
      );
      iniciarCarga(
        tema,
        file,
        'música'
      );

      const archivo =
        await archivoABase64(file);

      setCargaArchivo(
        (actual) => ({
          ...actual,
          etapa: 'Enviando y guardando en Drive',
          porcentaje: null,
        })
      );

      await subirMusicaTema(
        token,
        tema.id,
        archivo,
        'Archivo cargado por el servidor'
      );

      setMensaje(
        'El archivo de música fue cargado.'
      );

      await cargar();
    } catch (e) {
      setError(
        e.message ||
          'No fue posible cargar el archivo de música.'
      );
    } finally {
      setSubiendo('');
      setCargaArchivo(null);
    }
  }

  async function responderRevision() {
    const d = dialogoRevision;
    if (!d) return;
    try {
      setSubiendo(d.tema.id + 'revision');
      if (d.tipo === 'comentar') {
        await comentarPresentacion(token, d.tema.id, d.version.id, textoRevision);
      } else {
        await responderRevisionServidor(token, d.tema.id, d.version.id, d.tipo, textoRevision);
      }
      setMensaje(d.tipo === 'aprobar' ? 'La presentación quedó aprobada.' : d.tipo === 'solicitar ajustes' ? 'La solicitud de ajustes fue enviada.' : 'Comentario registrado.');
      setDialogoRevision(null); setTextoRevision(''); await cargar();
    } catch (e) { setError(e.message); } finally { setSubiendo(''); }
  }

  if (loading && !data) {
    return (
      <Stack
        alignItems="center"
        py={8}
      >
        <CircularProgress />
      </Stack>
    );
  }

  const temas =
    data?.items || [];

  const indicadores = temas.reduce(
    (acumulado, tema) => {
      const resumen = obtenerResumenRecursos(tema);
      acumulado.total += 1;
      if (resumen.completo) acumulado.completos += 1;
      if (resumen.requiereAtencion) acumulado.requierenAtencion += 1;
      if (resumen.pendienteAudiovisuales) acumulado.pendientesAudiovisuales += 1;
      if (resumen.pendienteLogistica) acumulado.pendientesLogistica += 1;
      return acumulado;
    },
    {
      total: 0,
      completos: 0,
      requierenAtencion: 0,
      pendientesAudiovisuales: 0,
      pendientesLogistica: 0,
    }
  );

  const temasFiltrados = (() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');

    const recursoCoincide = (tema, tipo) => {
      if (tipo === 'TODOS') return true;
      const resumen = obtenerResumenRecursos(tema);
      const recurso = resumen.recursos?.find((item) => item.tipo === tipo);
      return Boolean(recurso && recurso.requerido);
    };

    const filtrados = temas
      .map((tema, indiceOriginal) => ({
        tema,
        indiceOriginal,
        resumen: obtenerResumenRecursos(tema),
      }))
      .filter(({ tema, resumen }) => {
        const texto = [
          tema.nombre,
          tema.descripcion,
          tema.diaDelTema,
          tema.horaPropuesta,
          tema.estadoPreparacion,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('es');

        if (termino && !texto.includes(termino)) return false;
        if (!recursoCoincide(tema, filtroRecurso)) return false;

        if (filtroEstado === 'ATENCION' && !resumen.requiereAtencion) return false;
        if (filtroEstado === 'COMPLETOS' && !resumen.completo) return false;
        if (filtroEstado === 'AUDIOVISUALES' && !resumen.pendienteAudiovisuales) return false;
        if (filtroEstado === 'LOGISTICA' && !resumen.pendienteLogistica) return false;

        return true;
      });

    const progreso = (resumen) => Number(resumen.porcentaje || 0);

    filtrados.sort((a, b) => {
      if (orden === 'NOMBRE') {
        return String(a.tema.nombre || '').localeCompare(String(b.tema.nombre || ''), 'es');
      }
      if (orden === 'PROGRESO_ASC') return progreso(a.resumen) - progreso(b.resumen);
      if (orden === 'PROGRESO_DESC') return progreso(b.resumen) - progreso(a.resumen);
      if (orden === 'ATENCION') {
        const prioridadA = a.resumen.requiereAtencion ? 0 : a.resumen.completo ? 2 : 1;
        const prioridadB = b.resumen.requiereAtencion ? 0 : b.resumen.completo ? 2 : 1;
        return prioridadA - prioridadB || a.indiceOriginal - b.indiceOriginal;
      }
      return a.indiceOriginal - b.indiceOriginal;
    });

    return filtrados.map((item) => item.tema);
  })();

  const tarjetasIndicadores = [
    { titulo: 'Temas asignados', valor: indicadores.total, icono: <AssignmentRounded /> },
    { titulo: 'Completos', valor: indicadores.completos, icono: <TaskAltRounded /> },
    { titulo: 'Requieren atención', valor: indicadores.requierenAtencion, icono: <WarningAmberRounded /> },
    { titulo: 'Pendientes Audiovisuales', valor: indicadores.pendientesAudiovisuales, icono: <HeadsetMicRounded /> },
    { titulo: 'Pendientes Logística', valor: indicadores.pendientesLogistica, icono: <LocalShippingRounded /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Servidor"
        title="Mis temas"
        subtitle="Consulta tu asignación y gestiona los archivos de la charla"
        onRefresh={cargar}
        loading={loading}
      />

      <Stack spacing={2.5}>
        {temas.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(5, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {tarjetasIndicadores.map((item) => (
              <Card
                key={item.titulo}
                variant="outlined"
                sx={{
                  borderRadius: 3.5,
                  borderColor: 'rgba(20, 75, 62, 0.13)',
                  minWidth: 0,
                }}
              >
                <CardContent sx={{ p: '18px !important' }}>
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2.25,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'primary.main',
                        bgcolor: 'rgba(20, 75, 62, 0.08)',
                      }}
                    >
                      {item.icono}
                    </Box>
                    <Typography variant="h4" fontWeight={950} lineHeight={1}>
                      {item.valor}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                      {item.titulo}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {temas.length > 0 && (
          <FiltrosMisTemas
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            estado={filtroEstado}
            onEstado={setFiltroEstado}
            recurso={filtroRecurso}
            onRecurso={setFiltroRecurso}
            orden={orden}
            onOrden={setOrden}
            resultados={temasFiltrados.length}
            total={temas.length}
            onLimpiar={() => {
              setBusqueda('');
              setFiltroEstado('TODOS');
              setFiltroRecurso('TODOS');
              setOrden('AGENDA');
            }}
          />
        )}

        {error && (
          <Alert
            severity="error"
            onClose={() =>
              setError('')
            }
          >
            {error}
          </Alert>
        )}

        {mensaje && (
          <Alert
            severity="success"
            onClose={() =>
              setMensaje('')
            }
          >
            {mensaje}
          </Alert>
        )}

        {!temas.length && (
          <Alert severity="info">
            No tienes temas activos
            asignados. Solicita al
            administrador que relacione
            tu usuario con el servidor y
            asigne el tema.
          </Alert>
        )}

        {temas.length > 0 && temasFiltrados.length === 0 && (
          <Alert severity="info">
            No hay temas que coincidan con los filtros seleccionados.
          </Alert>
        )}

        {temasFiltrados.map((tema) => (
          <Card
            key={tema.id}
            sx={{ borderRadius: 4 }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2.5,
                  md: 4,
                },
              }}
            >
              <Stack spacing={3}>
                <Stack
                  direction={{
                    xs: 'column',
                    md: 'row',
                  }}
                  justifyContent="space-between"
                  gap={2}
                >
                  <Box>
                    <Typography
                      variant="overline"
                      color="primary"
                      fontWeight={900}
                    >
                      {tema.diaDelTema ||
                        'Día por definir'}{' '}
                      ·{' '}
                      {tema.horaPropuesta ||
                        'Hora por definir'}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={950}
                    >
                      {tema.nombre}
                    </Typography>

                    <Typography color="text.secondary">
                      Duración:{' '}
                      {tema.duracionMinutos ||
                        0}{' '}
                      minutos
                    </Typography>
                  </Box>

                  <EstadoTemaChip
                    estado={
                      tema.estadoPreparacion
                    }
                  />
                </Stack>

                {tema.descripcion && (
                  <Typography>
                    {tema.descripcion}
                  </Typography>
                )}

                {tema.observaciones && (
                  <Alert severity="info">
                    {tema.observaciones}
                  </Alert>
                )}

                <ResumenRecursosTema tema={tema} />

                <ProgresoPreparacionTema tema={tema} />

                <AccionesPendientesTema
                  tema={tema}
                  onIrARecurso={(tipo) => {
                    setRecursoDestacado((actual) => ({ ...actual, [tema.id]: tipo }));
                    window.setTimeout(() => {
                      document.getElementById(`recursos-${tema.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                />

                <Box id={`recursos-${tema.id}`} sx={{ scrollMarginTop: 96 }}>
                <DetalleRecursosTema
                  tema={tema}
                  plantillaUrl={data?.plantillaUrl}
                  disabled={subiendo !== ''}
                  comentario={comentario}
                  setComentario={setComentario}
                  cargarPpt={cargarPpt}
                  cargarMusica={cargarMusica}
                  cambiar={cambiar}
                  guardarRecurso={guardarRecurso}
                  setTextoRevision={setTextoRevision}
                  setDialogoRevision={setDialogoRevision}
                  tipoInicial={recursoDestacado[tema.id]}
                />
                </Box>

                <HistorialGeneralTema
                  temaId={tema.id}
                  temaNombre={tema.nombre}
                />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog
        open={Boolean(cargaArchivo)}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogContent sx={{ p: 4 }}>
          <Stack
            spacing={2.5}
            alignItems="center"
            textAlign="center"
          >
            <CloudUploadRounded
              color="primary"
              sx={{ fontSize: 56 }}
            />

            <Box>
              <Typography
                variant="h6"
                fontWeight={900}
              >
                Cargando{' '}
                {cargaArchivo?.tipo}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  wordBreak: 'break-word',
                }}
              >
                {cargaArchivo?.nombre}
              </Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
              <LinearProgress
                variant={
                  cargaArchivo?.porcentaje > 0
                    ? 'determinate'
                    : 'indeterminate'
                }
                value={
                  cargaArchivo?.porcentaje ||
                  0
                }
                sx={{
                  height: 9,
                  borderRadius: 8,
                }}
              />

              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {cargaArchivo?.etapa}
                {cargaArchivo?.porcentaje > 0 &&
                  cargaArchivo?.porcentaje <
                    100 &&
                  ` · ${cargaArchivo.porcentaje}%`}
              </Typography>
            </Box>

            <Alert
              severity="info"
              sx={{ textAlign: 'left' }}
            >
              No cierres ni actualices esta
              ventana. Después de enviar el
              archivo, Drive puede tardar unos
              segundos en procesarlo.
            </Alert>
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(dialogoRevision)} onClose={() => !subiendo && setDialogoRevision(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogoRevision?.tipo === 'aprobar' ? 'Aprobar versión final' : dialogoRevision?.tipo === 'solicitar ajustes' ? 'Solicitar ajustes a Audiovisuales' : 'Agregar comentario'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth multiline minRows={4} sx={{ mt: 1 }} label={dialogoRevision?.tipo === 'aprobar' ? 'Comentario opcional' : 'Comentario'} value={textoRevision} onChange={(e) => setTextoRevision(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogoRevision(null)}>Cancelar</Button><Button variant="contained" onClick={responderRevision} disabled={Boolean(subiendo) || (dialogoRevision?.tipo !== 'aprobar' && !textoRevision.trim())}>Confirmar</Button></DialogActions>
      </Dialog>
    </>
  );
}