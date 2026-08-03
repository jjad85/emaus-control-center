import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AssignmentTurnedInRounded from '@mui/icons-material/AssignmentTurnedInRounded';
import CampaignRounded from '@mui/icons-material/CampaignRounded';
import HeadsetMicRounded from '@mui/icons-material/HeadsetMicRounded';
import LocalShippingRounded from '@mui/icons-material/LocalShippingRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PriorityHighRounded from '@mui/icons-material/PriorityHighRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
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

function normalizar(valor) {
  return String(valor || '').trim().toLowerCase();
}

function obtenerResponsable(recurso, estado) {
  const texto = normalizar(estado);

  if (texto.includes('servidor') || texto.includes('conferencista')) {
    return {
      clave: 'SERVIDOR',
      nombre: 'Tú',
      icono: <PersonRounded fontSize="small" />,
    };
  }

  if (recurso === 'PALANCA') {
    return {
      clave: 'LOGISTICA',
      nombre: 'Logística',
      icono: <LocalShippingRounded fontSize="small" />,
    };
  }

  return {
    clave: 'AUDIOVISUALES',
    nombre: 'Audiovisuales',
    icono: <HeadsetMicRounded fontSize="small" />,
  };
}

function obtenerAccion(recurso, estado, tema) {
  const texto = normalizar(estado);

  if (texto.includes('ajuste') || texto.includes('correg') || texto.includes('observ')) {
    return 'Revisa las observaciones y actualiza la información solicitada.';
  }

  if (texto.includes('aprobación servidor') || texto.includes('pendiente servidor')) {
    return 'Revisa la versión enviada y apruébala o solicita nuevos ajustes.';
  }

  if (recurso === 'PRESENTACION') {
    if (!tema.versionActual && !tema.presentacionActualId) {
      return 'Carga la primera versión de la presentación.';
    }
    return 'Audiovisuales debe revisar la presentación cargada.';
  }

  if (recurso === 'CANCION') {
    return 'Audiovisuales debe preparar y validar la canción.';
  }

  if (recurso === 'VIDEO') {
    return 'Audiovisuales debe preparar y validar el video.';
  }

  if (recurso === 'PALANCA') {
    return 'Logística debe preparar y validar la palanca.';
  }

  return 'Revisa el estado y completa la acción pendiente.';
}

function prioridadDeEstado(estado) {
  const texto = normalizar(estado);
  if (texto.includes('ajuste') || texto.includes('rechaz') || texto.includes('observ')) {
    return { nivel: 1, texto: 'Alta', color: 'error' };
  }
  if (texto.includes('servidor') || texto.includes('conferencista')) {
    return { nivel: 2, texto: 'Tu acción', color: 'warning' };
  }
  return { nivel: 3, texto: 'En gestión', color: 'info' };
}

export function obtenerAccionesTema(tema) {
  const resumen = obtenerResumenRecursos(tema);

  return resumen.recursos
    .filter((recurso) => recurso.activo && !recurso.listo)
    .map((recurso) => {
      const responsable = obtenerResponsable(recurso.clave, recurso.texto);
      const prioridad = prioridadDeEstado(recurso.texto);
      return {
        id: `${tema.id}-${recurso.clave}`,
        recurso: recurso.clave,
        titulo: recurso.titulo,
        estado: recurso.texto,
        accion: obtenerAccion(recurso.clave, recurso.texto, tema),
        responsable,
        prioridad,
      };
    })
    .sort((a, b) => a.prioridad.nivel - b.prioridad.nivel);
}

export default function AccionesPendientesTema({ tema, onIrARecurso }) {
  const acciones = obtenerAccionesTema(tema);
  const accionesPropias = acciones.filter((accion) => accion.responsable.clave === 'SERVIDOR');
  const accionesEquipos = acciones.filter((accion) => accion.responsable.clave !== 'SERVIDOR');

  if (!acciones.length) {
    return (
      <Alert
        severity="success"
        icon={<AssignmentTurnedInRounded />}
        sx={{ borderRadius: 3.5, alignItems: 'center' }}
      >
        <Typography fontWeight={900}>No tienes acciones pendientes en este tema.</Typography>
        <Typography variant="body2">
          Todos los recursos requeridos se encuentran listos o aprobados.
        </Typography>
      </Alert>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        borderColor: accionesPropias.length ? 'rgba(211, 47, 47, .22)' : 'rgba(2, 136, 209, .2)',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 1.8,
          background: accionesPropias.length
            ? 'linear-gradient(135deg, rgba(255,235,238,.9), rgba(255,248,240,.9))'
            : 'linear-gradient(135deg, rgba(227,242,253,.9), rgba(240,248,255,.9))',
          borderBottom: '1px solid rgba(20,75,62,.08)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.25}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: accionesPropias.length ? 'error.main' : 'info.main',
                color: '#fff',
              }}
            >
              {accionesPropias.length ? <PriorityHighRounded /> : <ScheduleRounded />}
            </Box>
            <Box>
              <Typography fontWeight={950}>Próximas acciones</Typography>
              <Typography variant="body2" color="text.secondary">
                {accionesPropias.length
                  ? `${accionesPropias.length} acción${accionesPropias.length === 1 ? '' : 'es'} requiere${accionesPropias.length === 1 ? '' : 'n'} tu atención`
                  : 'Los equipos responsables están gestionando los recursos pendientes'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            {accionesPropias.length > 0 && (
              <Chip
                icon={<PersonRounded />}
                label={`Tu acción: ${accionesPropias.length}`}
                color="error"
                sx={{ fontWeight: 900 }}
              />
            )}
            {accionesEquipos.length > 0 && (
              <Chip
                icon={<CampaignRounded />}
                label={`En otros equipos: ${accionesEquipos.length}`}
                color="info"
                variant="outlined"
                sx={{ fontWeight: 900 }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      <Stack spacing={1.25} sx={{ p: { xs: 2, md: 2.5 } }}>
        {acciones.map((accion) => (
          <Paper
            key={accion.id}
            variant="outlined"
            sx={{
              p: 1.75,
              borderRadius: 3,
              borderColor:
                accion.prioridad.color === 'error'
                  ? 'error.light'
                  : accion.prioridad.color === 'warning'
                    ? 'warning.light'
                    : 'divider',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              gap={1.5}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.25,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(20,75,62,.08)',
                    color: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  {ICONOS[accion.recurso]}
                </Box>
                <Box>
                  <Stack direction="row" gap={.75} flexWrap="wrap" alignItems="center">
                    <Typography fontWeight={950}>{accion.titulo}</Typography>
                    <Chip
                      size="small"
                      label={accion.estado}
                      color={accion.prioridad.color}
                      variant={accion.prioridad.color === 'error' ? 'filled' : 'outlined'}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: .45 }}>
                    {accion.accion}
                  </Typography>
                  <Stack direction="row" spacing={.7} alignItems="center" sx={{ mt: .75 }}>
                    <Box sx={{ display: 'grid', color: 'text.secondary' }}>{accion.responsable.icono}</Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                      Responsable: {accion.responsable.nombre}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>

              {typeof onIrARecurso === 'function' && (
                <Button
                  variant={accion.responsable.clave === 'SERVIDOR' ? 'contained' : 'outlined'}
                  onClick={() => onIrARecurso(accion.recurso)}
                  sx={{ alignSelf: { xs: 'stretch', md: 'center' }, whiteSpace: 'nowrap' }}
                >
                  Ver {accion.titulo.toLowerCase()}
                </Button>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
