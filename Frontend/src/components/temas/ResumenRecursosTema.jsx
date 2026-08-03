import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded';
import RemoveCircleOutlineRounded from '@mui/icons-material/RemoveCircleOutlineRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';

function esActivo(valor) {
  if (typeof valor === 'boolean') return valor;
  const texto = String(valor ?? '').trim().toLowerCase();
  return ['sí', 'si', 'true', '1', 'activo'].includes(texto);
}

function clasificarEstado(activo, estado, tipo) {
  if (!activo) {
    return {
      texto: 'No requerido',
      color: 'default',
      listo: true,
      requiereAtencion: false,
      icono: <RemoveCircleOutlineRounded fontSize="small" />,
    };
  }

  const textoOriginal = String(estado || '').trim();
  const texto = textoOriginal.toLowerCase();

  if (
    texto.includes('aprob') ||
    texto.includes('complet') ||
    texto.includes('listo') ||
    texto.includes('entregad')
  ) {
    return {
      texto: textoOriginal || 'Listo',
      color: 'success',
      listo: true,
      requiereAtencion: false,
      icono: <CheckCircleRounded fontSize="small" />,
    };
  }

  if (
    texto.includes('ajuste') ||
    texto.includes('rechaz') ||
    texto.includes('correg') ||
    texto.includes('observ')
  ) {
    return {
      texto: textoOriginal || 'Requiere ajustes',
      color: 'error',
      listo: false,
      requiereAtencion: true,
      icono: <ErrorOutlineRounded fontSize="small" />,
    };
  }

  const pendientePorDefecto =
    tipo === 'PALANCA'
      ? 'Pendiente de Logística'
      : tipo === 'PRESENTACION'
        ? 'Pendiente de presentación'
        : 'Pendiente de Audiovisuales';

  return {
    texto: textoOriginal || pendientePorDefecto,
    color: 'warning',
    listo: false,
    requiereAtencion: true,
    icono: <PendingActionsRounded fontSize="small" />,
  };
}

export function obtenerResumenRecursos(tema) {
  const recursos = [
    {
      clave: 'PRESENTACION',
      titulo: 'Presentación',
      activo: esActivo(tema.requierePresentacion),
      estado: tema.estadoPreparacion,
      icono: <SlideshowRounded fontSize="small" />,
    },
    {
      clave: 'CANCION',
      titulo: 'Canción',
      activo: esActivo(tema.requiereMusica),
      estado: tema.cancionEstado,
      icono: <MusicNoteRounded fontSize="small" />,
    },
    {
      clave: 'VIDEO',
      titulo: 'Video',
      activo: esActivo(tema.usaVideo),
      estado: tema.videoEstado,
      icono: <OndemandVideoRounded fontSize="small" />,
    },
    {
      clave: 'PALANCA',
      titulo: 'Palanca',
      activo: esActivo(tema.requierePalanca),
      estado: tema.palancaEstado,
      icono: <CardGiftcardRounded fontSize="small" />,
    },
  ].map((recurso) => ({
    ...recurso,
    ...clasificarEstado(recurso.activo, recurso.estado, recurso.clave),
  }));

  const requeridos = recursos.filter((recurso) => recurso.activo);
  const listos = requeridos.filter((recurso) => recurso.listo).length;
  const porcentaje = requeridos.length
    ? Math.round((listos / requeridos.length) * 100)
    : 100;

  return {
    recursos,
    requeridos: requeridos.length,
    listos,
    porcentaje,
    completo: porcentaje === 100,
    requiereAtencion: recursos.some((recurso) => recurso.requiereAtencion),
    pendienteAudiovisuales: recursos.some(
      (recurso) =>
        recurso.activo &&
        ['PRESENTACION', 'CANCION', 'VIDEO'].includes(recurso.clave) &&
        !recurso.listo
    ),
    pendienteLogistica: recursos.some(
      (recurso) => recurso.activo && recurso.clave === 'PALANCA' && !recurso.listo
    ),
  };
}

export default function ResumenRecursosTema({ tema }) {
  const resumen = obtenerResumenRecursos(tema);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 3.5,
        borderColor: 'rgba(20, 75, 62, 0.14)',
        bgcolor: 'rgba(245, 250, 247, 0.72)',
      }}
    >
      <Stack spacing={1.75}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1}
        >
          <Box>
            <Typography fontWeight={950}>Estado de los recursos</Typography>
            <Typography variant="body2" color="text.secondary">
              {resumen.requeridos
                ? `${resumen.listos} de ${resumen.requeridos} recursos requeridos están listos`
                : 'Este tema no tiene recursos adicionales configurados'}
            </Typography>
          </Box>

          <Chip
            label={`${resumen.porcentaje}% listo`}
            color={resumen.completo ? 'success' : 'warning'}
            variant={resumen.completo ? 'filled' : 'outlined'}
            sx={{ fontWeight: 900, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={resumen.porcentaje}
          color={resumen.completo ? 'success' : 'primary'}
          sx={{ height: 8, borderRadius: 99 }}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1.25,
          }}
        >
          {resumen.recursos.map((recurso) => (
            <Paper
              key={recurso.clave}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2.75,
                borderColor:
                  recurso.color === 'error'
                    ? 'error.light'
                    : recurso.color === 'success'
                      ? 'success.light'
                      : 'divider',
                bgcolor: '#fff',
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    {recurso.icono}
                  </Box>
                  <Typography variant="body2" fontWeight={900}>
                    {recurso.titulo}
                  </Typography>
                </Stack>

                <Chip
                  size="small"
                  icon={recurso.icono}
                  label={recurso.texto}
                  color={recurso.color}
                  variant={recurso.color === 'default' ? 'outlined' : 'filled'}
                  sx={{
                    maxWidth: '100%',
                    justifyContent: 'flex-start',
                    fontWeight: 800,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </Stack>
            </Paper>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
