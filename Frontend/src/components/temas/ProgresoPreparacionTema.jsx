import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import LockClockRounded from '@mui/icons-material/LockClockRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import { obtenerResumenRecursos } from './ResumenRecursosTema';

const ICONOS = {
  PRESENTACION: <SlideshowRounded fontSize="small" />,
  CANCION: <MusicNoteRounded fontSize="small" />,
  VIDEO: <OndemandVideoRounded fontSize="small" />,
  PALANCA: <CardGiftcardRounded fontSize="small" />,
};

function colorPaso(recurso) {
  if (!recurso.activo) return 'default';
  if (recurso.listo) return 'success';
  if (recurso.requiereAtencion) return 'warning';
  return 'info';
}

function textoGeneral(resumen) {
  if (!resumen.requeridos) {
    return 'No se han definido recursos adicionales para este tema.';
  }

  if (resumen.completo) {
    return 'El tema tiene todos sus recursos requeridos listos para el retiro.';
  }

  const pendientes = resumen.requeridos - resumen.listos;
  return `Faltan ${pendientes} recurso${pendientes === 1 ? '' : 's'} por completar o aprobar.`;
}

export default function ProgresoPreparacionTema({ tema }) {
  const resumen = obtenerResumenRecursos(tema);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        borderColor: resumen.completo
          ? 'rgba(46, 125, 50, .2)'
          : 'rgba(20, 75, 62, .14)',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          background: resumen.completo
            ? 'linear-gradient(135deg, rgba(232,245,233,.95), rgba(247,252,249,.95))'
            : 'linear-gradient(135deg, rgba(239,248,244,.96), rgba(250,247,238,.96))',
          borderBottom: '1px solid rgba(20,75,62,.08)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1.5}
        >
          <Box>
            <Typography fontWeight={950}>Ruta de preparación</Typography>
            <Typography variant="body2" color="text.secondary">
              {textoGeneral(resumen)}
            </Typography>
          </Box>

          <Chip
            icon={resumen.completo ? <CheckCircleRounded /> : <LockClockRounded />}
            label={resumen.completo ? 'Tema listo' : `${resumen.porcentaje}% preparado`}
            color={resumen.completo ? 'success' : 'primary'}
            variant={resumen.completo ? 'filled' : 'outlined'}
            sx={{ fontWeight: 900, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={resumen.porcentaje}
          color={resumen.completo ? 'success' : 'primary'}
          sx={{ mt: 1.75, height: 9, borderRadius: 99 }}
        />
      </Box>

      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
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
          {resumen.recursos.map((recurso, indice) => {
            const color = colorPaso(recurso);
            const completado = !recurso.activo || recurso.listo;

            return (
              <Paper
                key={recurso.clave}
                variant="outlined"
                sx={{
                  position: 'relative',
                  p: 1.75,
                  borderRadius: 3,
                  borderColor:
                    color === 'success'
                      ? 'success.light'
                      : color === 'warning'
                        ? 'warning.light'
                        : 'divider',
                  bgcolor: completado ? 'rgba(248,252,249,.95)' : '#fff',
                }}
              >
                <Stack spacing={1.1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: completado ? 'success.light' : 'rgba(20,75,62,.08)',
                          color: completado ? 'success.dark' : 'primary.main',
                        }}
                      >
                        {ICONOS[recurso.clave]}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>
                          Paso {indice + 1}
                        </Typography>
                        <Typography variant="body2" fontWeight={950}>
                          {recurso.titulo}
                        </Typography>
                      </Box>
                    </Stack>

                    {completado ? (
                      <CheckCircleRounded color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedRounded color="disabled" fontSize="small" />
                    )}
                  </Stack>

                  <Chip
                    size="small"
                    label={recurso.texto}
                    color={color}
                    variant={color === 'success' ? 'filled' : 'outlined'}
                    sx={{
                      alignSelf: 'flex-start',
                      maxWidth: '100%',
                      fontWeight: 850,
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
