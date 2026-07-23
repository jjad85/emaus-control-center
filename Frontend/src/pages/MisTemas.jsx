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
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import EstadoTemaChip from '../components/temas/EstadoTemaChip';
import HistorialVersiones from '../components/temas/HistorialVersiones';
import {
  archivoABase64,
  actualizarPreferenciasMiTema,
  obtenerMiTemaAsignado,
  subirMusicaTema,
  subirVersionTema,
} from '../api/temasPresentacionesApi';

const MAX_ARCHIVO_BYTES =
  15 * 1024 * 1024;

function calcularPorcentaje(evento) {
  if (!evento?.total) {
    return null;
  }

  return Math.min(
    100,
    Math.round(
      (evento.loaded * 100) /
        evento.total
    )
  );
}

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
  const [cargaArchivo, setCargaArchivo] =
    useState(null);

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

      await actualizarPreferenciasMiTema(
        token,
        tema.id,
        {
          [campo]: valor
            ? 'Sí'
            : 'No',
        }
      );

      await cargar();
    } catch (e) {
      setError(e.message);
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

  function actualizarProgreso(evento) {
    const porcentaje =
      calcularPorcentaje(evento);

    setCargaArchivo((actual) => {
      if (!actual) {
        return actual;
      }

      return {
        ...actual,
        etapa:
          porcentaje === 100
            ? 'Procesando y guardando en Drive'
            : 'Enviando archivo',
        porcentaje:
          porcentaje ??
          actual.porcentaje,
      };
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
          etapa: 'Enviando archivo',
        })
      );

      await subirVersionTema(
        token,
        tema.id,
        archivo,
        comentario[tema.id] || '',
        actualizarProgreso
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
          etapa: 'Enviando archivo',
        })
      );

      await subirMusicaTema(
        token,
        tema.id,
        archivo,
        'Archivo cargado por el conferencista',
        actualizarProgreso
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

  return (
    <>
      <PageHeader
        eyebrow="Conferencista"
        title="Mis temas"
        subtitle="Consulta tu asignación y gestiona los archivos de la charla"
        onRefresh={cargar}
        loading={loading}
      />

      <Stack spacing={2.5}>
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

        {temas.map((tema) => (
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

                <Divider />

                <Grid
                  container
                  spacing={3}
                >
                  <Grid
                    size={{
                      xs: 12,
                      md: 5,
                    }}
                  >
                    <Stack spacing={2}>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                      >
                        Definición de recursos
                      </Typography>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              tema.requierePresentacion ===
                              'Sí'
                            }
                            disabled={
                              subiendo !== ''
                            }
                            onChange={(_, valor) =>
                              cambiar(
                                tema,
                                'requierePresentacion',
                                valor
                              )
                            }
                          />
                        }
                        label="Utilizaré presentación"
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              tema.requiereMusica ===
                              'Sí'
                            }
                            disabled={
                              subiendo !== ''
                            }
                            onChange={(_, valor) =>
                              cambiar(
                                tema,
                                'requiereMusica',
                                valor
                              )
                            }
                          />
                        }
                        label="Utilizaré música"
                      />

                      {data?.plantillaUrl && (
                        <Button
                          component="a"
                          href={
                            data.plantillaUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          variant="outlined"
                          startIcon={
                            <DownloadRounded />
                          }
                        >
                          Descargar plantilla
                        </Button>
                      )}

                      {tema.requiereMusica ===
                        'Sí' && (
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={
                            <MusicNoteRounded />
                          }
                          disabled={
                            subiendo !== ''
                          }
                        >
                          Subir música
                          <input
                            hidden
                            type="file"
                            accept="audio/mpeg,audio/wav,audio/mp4"
                            onChange={(evento) => {
                              const file =
                                evento.target
                                  .files?.[0];
                              evento.target.value =
                                '';
                              cargarMusica(
                                tema,
                                file
                              );
                            }}
                          />
                        </Button>
                      )}

                      {tema.musica?.map(
                        (musica) => (
                          <Button
                            key={musica.id}
                            component="a"
                            href={
                              musica.archivoDriveUrl
                            }
                            target="_blank"
                            size="small"
                          >
                            Abrir:{' '}
                            {
                              musica.nombreCancion
                            }
                          </Button>
                        )
                      )}
                    </Stack>
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      md: 7,
                    }}
                  >
                    <Stack spacing={2}>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                      >
                        Presentación
                      </Typography>

                      {tema.requierePresentacion ===
                      'Sí' ? (
                        <>
                          <TextField
                            label="Comentario de esta versión"
                            multiline
                            minRows={2}
                            value={
                              comentario[
                                tema.id
                              ] || ''
                            }
                            onChange={(
                              evento
                            ) =>
                              setComentario(
                                (actual) => ({
                                  ...actual,
                                  [tema.id]:
                                    evento.target
                                      .value,
                                })
                              )
                            }
                          />

                          <Button
                            component="label"
                            variant="contained"
                            startIcon={
                              subiendo ===
                              tema.id + 'ppt' ? (
                                <CircularProgress
                                  size={18}
                                  color="inherit"
                                />
                              ) : (
                                <UploadFileRounded />
                              )
                            }
                            disabled={
                              subiendo !== ''
                            }
                          >
                            {subiendo ===
                            tema.id + 'ppt'
                              ? 'Cargando presentación...'
                              : 'Subir nueva versión'}

                            <input
                              hidden
                              type="file"
                              accept=".ppt,.pptx,.pdf"
                              onChange={(evento) => {
                                const file =
                                  evento.target
                                    .files?.[0];
                                evento.target.value =
                                  '';
                                cargarPpt(
                                  tema,
                                  file
                                );
                              }}
                            />
                          </Button>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Formatos permitidos:
                            PPT, PPTX y PDF.
                            Tamaño máximo: 15 MB.
                          </Typography>
                        </>
                      ) : (
                        <Alert severity="info">
                          Marca “Utilizaré
                          presentación” para
                          habilitar la carga.
                        </Alert>
                      )}
                    </Stack>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    mb={1.5}
                  >
                    Historial de versiones
                  </Typography>

                  <HistorialVersiones
                    versiones={
                      tema.versiones
                    }
                  />
                </Box>
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
    </>
  );
}
