import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import BadgeRounded from '@mui/icons-material/BadgeRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ContactEmergencyRounded from '@mui/icons-material/ContactEmergencyRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';

import {
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  actualizarEstadoAspiranteApi,
  editarAspiranteApi,
  obtenerAspirantes,
} from '../api/aspirantesApi';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';

import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import WhatsAppNotifyButton from '../components/WhatsAppNotifyButton';
import AspiranteEditDialog from '../components/aspirantes/AspiranteEditDialog';

function colorEstado(estado) {
  const valor = String(estado || '').toLowerCase();

  if (valor === 'aprobado' || valor === 'convertido') {
    return 'success';
  }

  if (valor === 'rechazado') {
    return 'error';
  }

  if (valor === 'en revisión') {
    return 'warning';
  }

  return 'default';
}

function valorVisible(valor) {
  if (valor === null || valor === undefined) {
    return 'No informado';
  }

  const texto = String(valor).trim();
  return texto || 'No informado';
}

function formatearFecha(valor) {
  if (!valor) {
    return 'No informada';
  }

  const texto = String(valor).trim();
  let fecha = new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    const coincidencia = texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (coincidencia) {
      const [
        ,
        dia,
        mes,
        anio,
        hora = '0',
        minuto = '0',
        segundo = '0',
      ] = coincidencia;

      fecha = new Date(
        Number(anio),
        Number(mes) - 1,
        Number(dia),
        Number(hora),
        Number(minuto),
        Number(segundo)
      );
    }
  }

  if (Number.isNaN(fecha.getTime())) {
    return texto;
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha);
}

function formatearFechaCorta(valor) {
  if (!valor) {
    return 'No informada';
  }

  const texto = String(valor).trim();
  let fecha = new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    const coincidencia = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    if (coincidencia) {
      const [, dia, mes, anio] = coincidencia;
      fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    }
  }

  if (Number.isNaN(fecha.getTime())) {
    return texto;
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
  }).format(fecha);
}


function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;

  const texto = String(fechaNacimiento).trim();
  const coincidencia = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const nacimiento = coincidencia
    ? new Date(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3]))
    : new Date(texto);

  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const noHaCumplido =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

  if (noHaCumplido) edad -= 1;
  return edad >= 0 && edad <= 120 ? edad : null;
}

function CampoDetalle({ etiqueta, valor, anchoCompleto = false }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: anchoCompleto ? '1 / -1' : 'auto',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        display="block"
        mb={0.25}
      >
        {etiqueta}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
        }}
      >
        {valorVisible(valor)}
      </Typography>
    </Box>
  );
}

function SeccionDetalle({ icono, titulo, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1.75}>
        {icono}
        <Typography variant="subtitle1" fontWeight={900}>
          {titulo}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}


const CONFETTI_PARTICLES = Array.from(
  { length: 72 },
  (_, index) => ({
    id: index,
    left: (index * 37) % 100,
    delay: (index % 12) * 0.08,
    duration: 2.4 + (index % 7) * 0.18,
    rotation: (index * 47) % 360,
    size: 7 + (index % 5) * 2,
    color: [
      '#2f6f5e',
      '#f2b84b',
      '#d95d5d',
      '#5b8def',
      '#9b6fd8',
      '#2aa198',
    ][index % 6],
  })
);

function reproducirSonidoCelebracion() {
  try {
    const AudioContexto =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContexto) {
      return;
    }

    const contexto =
      new AudioContexto();

    const ahora =
      contexto.currentTime;

    const notas = [
      {
        frecuencia: 523.25,
        inicio: 0,
        duracion: 0.16,
      },
      {
        frecuencia: 659.25,
        inicio: 0.16,
        duracion: 0.16,
      },
      {
        frecuencia: 783.99,
        inicio: 0.32,
        duracion: 0.18,
      },
      {
        frecuencia: 1046.5,
        inicio: 0.5,
        duracion: 0.42,
      },
    ];

    notas.forEach(
      ({
        frecuencia,
        inicio,
        duracion,
      }) => {
        const oscilador =
          contexto.createOscillator();

        const volumen =
          contexto.createGain();

        oscilador.type =
          'triangle';

        oscilador.frequency.setValueAtTime(
          frecuencia,
          ahora + inicio
        );

        volumen.gain.setValueAtTime(
          0.0001,
          ahora + inicio
        );

        volumen.gain.exponentialRampToValueAtTime(
          0.18,
          ahora + inicio + 0.025
        );

        volumen.gain.exponentialRampToValueAtTime(
          0.0001,
          ahora + inicio + duracion
        );

        oscilador.connect(
          volumen
        );

        volumen.connect(
          contexto.destination
        );

        oscilador.start(
          ahora + inicio
        );

        oscilador.stop(
          ahora + inicio + duracion
        );
      }
    );

    window.setTimeout(
      () => {
        contexto.close().catch(
          () => {}
        );
      },
      1400
    );
  } catch (_) {
    // El navegador puede bloquear el audio.
    // La conversión continúa normalmente.
  }
}

function ConfetiCelebracion() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
    >
      {CONFETTI_PARTICLES.map((particula) => (
        <Box
          key={particula.id}
          sx={{
            position: 'absolute',
            top: -24,
            left: `${particula.left}%`,
            width: particula.size,
            height: particula.size * 1.5,
            bgcolor: particula.color,
            borderRadius:
              particula.id % 3 === 0
                ? '50%'
                : 0.75,
            opacity: 0,
            transform:
              `rotate(${particula.rotation}deg)`,
            animation:
              `caidaConfeti ${particula.duration}s ease-in ${particula.delay}s infinite`,
            '@keyframes caidaConfeti': {
              '0%': {
                opacity: 0,
                transform:
                  `translate3d(0, -20px, 0) rotate(${particula.rotation}deg)`,
              },
              '10%': {
                opacity: 1,
              },
              '100%': {
                opacity: 0.9,
                transform:
                  `translate3d(${(particula.id % 2 ? 1 : -1) * (40 + particula.id % 70)}px, 110vh, 0) rotate(${particula.rotation + 720}deg)`,
              },
            },
          }}
        />
      ))}
    </Box>
  );
}

function obtenerMensajeMeta(celebracion) {
  const total =
    Number(celebracion?.total) || 0;

  const meta =
    Number(celebracion?.meta) || 0;

  const faltantes =
    Math.max(
      Number(celebracion?.faltantes) || 0,
      0
    );

  if (meta <= 0) {
    return {
      titulo:
        '¡Nuevo caminante registrado!',
      mensaje:
        `Ya contamos con ${total} caminantes. La meta todavía no está configurada.`,
    };
  }

  if (total > meta) {
    return {
      titulo:
        '¡Meta superada!',
      mensaje:
        `Ya contamos con ${total} caminantes y superamos la meta de ${meta}.`,
    };
  }

  if (total === meta) {
    return {
      titulo:
        '¡Meta cumplida!',
      mensaje:
        `Ya contamos con los ${meta} caminantes definidos para el retiro.`,
    };
  }

  return {
    titulo:
      '¡Nuevo caminante registrado!',
    mensaje:
      `Tenemos ${total} caminantes de una meta de ${meta}. Faltan ${faltantes} ${faltantes === 1 ? 'caminante' : 'caminantes'} para cumplirla.`,
  };
}


function normalizarBusqueda(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function coincideBusqueda(aspirante, busqueda) {
  const termino = normalizarBusqueda(busqueda);

  if (!termino) {
    return true;
  }

  return [
    aspirante?.nombreCompleto,
    aspirante?.documentoIdentidad,
    aspirante?.numeroInscripcion,
    aspirante?.celular,
    aspirante?.telefono,
    aspirante?.alergiasAlimentarias,
    aspirante?.restriccionesAlimentarias,
    aspirante?.preferenciasAlimentarias,
    aspirante?.dietaEspecial,
  ].some((valor) =>
    normalizarBusqueda(valor).includes(termino)
  );
}

function fechaAspiranteMilisegundos(
  valor
) {
  if (!valor) {
    return 0;
  }

  if (
    valor instanceof Date
  ) {
    return valor.getTime();
  }

  const texto =
    String(valor).trim();

  const fechaDirecta =
    new Date(texto);

  if (
    !Number.isNaN(
      fechaDirecta.getTime()
    )
  ) {
    return fechaDirecta.getTime();
  }

  const coincidencia =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

  if (!coincidencia) {
    return 0;
  }

  return new Date(
    Number(coincidencia[3]),
    Number(coincidencia[2]) - 1,
    Number(coincidencia[1]),
    Number(coincidencia[4] || 0),
    Number(coincidencia[5] || 0),
    Number(coincidencia[6] || 0)
  ).getTime();
}

function ordenarAspirantesAntiguosPrimero(
  items
) {
  return [...items].sort(
    (a, b) => {
      const diferencia =
        fechaAspiranteMilisegundos(
          a.fechaRegistro
        ) -
        fechaAspiranteMilisegundos(
          b.fechaRegistro
        );

      if (diferencia !== 0) {
        return diferencia;
      }

      return (
        Number(a.id || 0) -
        Number(b.id || 0)
      );
    }
  );
}

function notificacionesWhatsappUnicas(
  notificaciones
) {
  const unicas =
    new Map();

  (
    Array.isArray(notificaciones)
      ? notificaciones
      : []
  ).forEach(
    (notificacion) => {
      const clave = [
        String(
          notificacion.tipo || ''
        ).trim().toUpperCase(),
        String(
          notificacion.entidad || ''
        ).trim().toUpperCase(),
        String(
          notificacion.entidadId || ''
        ).trim(),
      ].join('|');

      const existente =
        unicas.get(clave);

      if (
        !existente ||
        fechaAspiranteMilisegundos(
          notificacion.fechaCreacion
        ) <
          fechaAspiranteMilisegundos(
            existente.fechaCreacion
          )
      ) {
        unicas.set(
          clave,
          notificacion
        );
      }
    }
  );

  return Array.from(
    unicas.values()
  );
}

function TarjetaAspirante({
  item,
  onVerDetalle,
  onEditar,
  puedeEditar,
  colorBorde,
  token,
  puedeNotificar,
  onNotificacionCompletada,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        borderLeft: 5,
        borderLeftColor: colorBorde,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={2}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
            alignItems="center"
            mb={1}
          >
            <Chip
              size="small"
              color={colorEstado(item.estadoSolicitud)}
              label={item.estadoSolicitud || 'Sin estado'}
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ mb: 1.5, overflowWrap: 'anywhere' }}
          >
            {item.nombreCompleto || 'Nombre no informado'}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <BadgeRounded fontSize="small" color="action" />
              <Box minWidth={0}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Número de inscripción
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {valorVisible(item.numeroInscripcion)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <PhoneRounded fontSize="small" color="action" />
              <Box minWidth={0}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Teléfono
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {valorVisible(item.celular || item.telefono)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <CalendarMonthRounded fontSize="small" color="action" />
              <Box minWidth={0}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Fecha de preinscripción
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatearFecha(item.fechaRegistro)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Stack
          spacing={1}
          sx={{
            alignSelf: { xs: 'stretch', md: 'center' },
            minWidth: { md: 205 },
          }}
        >
          {puedeNotificar &&
            notificacionesWhatsappUnicas(
              item.whatsappNotificaciones
            ).map(
              (notificacion) => (
                <WhatsAppNotifyButton
                  key={notificacion.id}
                  token={token}
                  notificacion={notificacion}
                  label={
                    notificacion.tipo === 'INSCRIPCION'
                      ? 'Notificar preinscripción'
                      : notificacion.tipo === 'APROBACION'
                        ? 'Notificar aceptación'
                        : 'Notificar'
                  }
                  onCompleted={onNotificacionCompletada}
                  fullWidth
                />
              )
            )}

          <Button
            startIcon={<VisibilityRounded />}
            onClick={() => onVerDetalle(item)}
            fullWidth
            sx={{ whiteSpace: 'nowrap' }}
          >
            Ver detalle
          </Button>
          {puedeEditar && (
            <Button
              startIcon={<EditRounded />}
              onClick={() => onEditar(item)}
              variant="contained"
              fullWidth
            >
              Editar
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function PanelEstadoAspirantes({
  id,
  titulo,
  subtitulo,
  items,
  color,
  colorSuave,
  mensajeVacio,
  onVerDetalle,
  onEditar,
  puedeEditar,
  token,
  puedeNotificar,
  onNotificacionCompletada,
}) {
  const [orden, setOrden] =
    useState('antiguos');

  const itemsOrdenados =
    useMemo(
      () => {
        const ordenados =
          ordenarAspirantesAntiguosPrimero(
            items
          );

        return orden === 'nuevos'
          ? [...ordenados].reverse()
          : ordenados;
      },
      [items, orden]
    );

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 5,
        overflow: 'hidden',
        borderColor:
          'rgba(20,75,62,.12)',
        bgcolor: '#fff',
        boxShadow:
          '0 20px 55px rgba(17,48,41,.08)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          px: {
            xs: 2,
            md: 3,
          },
          py: {
            xs: 2,
            md: 2.5,
          },
          overflow: 'hidden',
          borderBottom: 1,
          borderColor: 'divider',
          background:
            `linear-gradient(135deg, ${colorSuave} 0%, #ffffff 66%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            right: -60,
            top: -90,
            bgcolor: color,
            opacity: 0.055,
            pointerEvents: 'none',
          },
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          alignItems={{
            xs: 'stretch',
            md: 'center',
          }}
          justifyContent="space-between"
          gap={2}
          position="relative"
          zIndex={1}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                color,
                bgcolor: '#fff',
                border: 1,
                borderColor:
                  'rgba(20,75,62,.10)',
                boxShadow:
                  '0 8px 22px rgba(17,48,41,.08)',
              }}
            >
              {id === 'pendientes' && (
                <PersonRounded />
              )}

              {id === 'aprobados' && (
                <CheckRounded />
              )}

              {id === 'rechazados' && (
                <CloseRounded />
              )}
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{
                  color,
                  fontWeight: 950,
                  letterSpacing: '.13em',
                  lineHeight: 1.2,
                }}
              >
                Vista activa
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography
                  variant="h5"
                  fontWeight={950}
                >
                  {titulo}
                </Typography>

                <Chip
                  label={items.length}
                  size="small"
                  sx={{
                    fontWeight: 950,
                    bgcolor: colorSuave,
                    color,
                  }}
                />
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.35,
                  maxWidth: 650,
                }}
              >
                {subtitulo}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 0.5,
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              borderRadius: 999,
              bgcolor:
                'rgba(17,48,41,.055)',
              border: 1,
              borderColor:
                'rgba(17,48,41,.08)',
              minWidth: {
                xs: '100%',
                md: 330,
              },
            }}
          >
            <Button
              size="small"
              startIcon={
                <ArrowUpwardRounded />
              }
              onClick={() =>
                setOrden('antiguos')
              }
              sx={{
                borderRadius: 999,
                py: 0.9,
                px: 1.5,
                fontWeight: 900,
                color:
                  orden === 'antiguos'
                    ? '#fff'
                    : 'text.secondary',
                bgcolor:
                  orden === 'antiguos'
                    ? '#174b40'
                    : 'transparent',
                boxShadow:
                  orden === 'antiguos'
                    ? '0 7px 18px rgba(23,75,64,.18)'
                    : 'none',
                '&:hover': {
                  bgcolor:
                    orden === 'antiguos'
                      ? '#123f35'
                      : 'rgba(23,75,64,.06)',
                },
              }}
            >
              Antiguas primero
            </Button>

            <Button
              size="small"
              startIcon={
                <ArrowDownwardRounded />
              }
              onClick={() =>
                setOrden('nuevos')
              }
              sx={{
                borderRadius: 999,
                py: 0.9,
                px: 1.5,
                fontWeight: 900,
                color:
                  orden === 'nuevos'
                    ? '#fff'
                    : 'text.secondary',
                bgcolor:
                  orden === 'nuevos'
                    ? '#174b40'
                    : 'transparent',
                boxShadow:
                  orden === 'nuevos'
                    ? '0 7px 18px rgba(23,75,64,.18)'
                    : 'none',
                '&:hover': {
                  bgcolor:
                    orden === 'nuevos'
                      ? '#123f35'
                      : 'rgba(23,75,64,.06)',
                },
              }}
            >
              Recientes primero
            </Button>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          p: {
            xs: 1.5,
            md: 2.25,
          },
          bgcolor:
            'rgba(17,48,41,.018)',
        }}
      >
        {itemsOrdenados.length > 0 ? (
          <Stack spacing={1.35}>
            {itemsOrdenados.map(
              (item, indice) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '54px minmax(0, 1fr)',
                    },
                    alignItems: 'stretch',
                    gap: {
                      xs: 0,
                      md: 1.25,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: {
                        xs: 'none',
                        md: 'flex',
                      },
                      flexDirection: 'column',
                      alignItems: 'center',
                      pt: 1.6,
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor:
                          indice === 0
                            ? color
                            : '#fff',
                        color:
                          indice === 0
                            ? '#fff'
                            : 'text.secondary',
                        border: 1,
                        borderColor:
                          indice === 0
                            ? color
                            : 'divider',
                        boxShadow:
                          '0 6px 16px rgba(17,48,41,.08)',
                        zIndex: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={950}
                      >
                        {String(
                          indice + 1
                        ).padStart(2, '0')}
                      </Typography>
                    </Box>

                    {indice <
                      itemsOrdenados.length -
                        1 && (
                      <Box
                        sx={{
                          width: 1,
                          flex: 1,
                          minHeight: 26,
                          mt: 0.7,
                          bgcolor:
                            'rgba(23,75,64,.11)',
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      position: 'relative',
                      '& > .MuiPaper-root': {
                        border:
                          '1px solid rgba(20,75,62,.10)',
                        borderLeftWidth: 1,
                        bgcolor: '#fff',
                        boxShadow:
                          '0 7px 22px rgba(17,48,41,.045)',
                        transition:
                          'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                        '&:hover': {
                          transform:
                            'translateY(-2px)',
                          borderColor:
                            'rgba(23,107,88,.28)',
                          boxShadow:
                            '0 16px 34px rgba(17,48,41,.09)',
                        },
                        '&::before': {
                          content: '""',
                          position:
                            'absolute',
                          left: 0,
                          top: 20,
                          bottom: 20,
                          width: 4,
                          borderRadius:
                            '0 8px 8px 0',
                          bgcolor: color,
                          opacity: 0.82,
                        },
                      },
                    }}
                  >
                    <TarjetaAspirante
                      item={item}
                      onVerDetalle={onVerDetalle}
                      onEditar={onEditar}
                      puedeEditar={puedeEditar}
                      colorBorde="transparent"
                      token={token}
                      puedeNotificar={
                        puedeNotificar
                      }
                      onNotificacionCompletada={
                        onNotificacionCompletada
                      }
                    />
                  </Box>
                </Box>
              )
            )}
          </Stack>
        ) : (
          <Box
            sx={{
              py: 5,
              px: 2,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 58,
                height: 58,
                mx: 'auto',
                mb: 1.5,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: colorSuave,
                color,
              }}
            >
              {id === 'pendientes'
                ? <CheckRounded />
                : <InfoRounded />}
            </Box>

            <Typography
              variant="h6"
              fontWeight={900}
            >
              Sin registros en esta vista
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {mensajeVacio}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}


function escaparCsv(valor) {
  const texto = String(valor ?? '').replace(/\r?\n/g, ' ').trim();
  return `"${texto.replace(/"/g, '""')}"`;
}

function descargarReporteAlimentacion(items) {
  const encabezados = [
    'Número de inscripción',
    'Nombre',
    'Documento',
    'Celular',
    'Estado de solicitud',
    'Tiene condición alimentaria',
    'Alergias alimentarias',
    'Restricciones alimentarias',
    'Preferencias alimentarias',
    'Dieta especial o indicaciones',
  ];

  const filas = items.map((item) => [
    item.numeroInscripcion,
    item.nombreCompleto,
    item.documentoIdentidad,
    item.celular,
    item.estadoSolicitud,
    item.tieneCondicionAlimentaria,
    item.alergiasAlimentarias || item.alergias,
    item.restriccionesAlimentarias,
    item.preferenciasAlimentarias,
    item.dietaEspecial,
  ]);

  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCsv).join(';'))
    .join('\n');

  const blob = new Blob(['\ufeff' + contenido], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `alimentacion-retiro-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export default function Aspirantes() {
  const navigate = useNavigate();
  const {
    token,
    autenticado,
    loading: authLoading,
    tienePermiso,
  } = useAuth();

  const api = useApi(
    () => obtenerAspirantes(token),
    [token]
  );

  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [aspiranteEditar, setAspiranteEditar] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [celebracion, setCelebracion] = useState(null);
  const [grupoAbierto, setGrupoAbierto] = useState('pendientes');

  const items = api.data?.items || [];

  const grupos = useMemo(() => {
    const visibles = items.filter((item) =>
      coincideBusqueda(item, busqueda)
    );

    return {
      pendientes:
        ordenarAspirantesAntiguosPrimero(
          visibles.filter((item) => {
            const estado =
              normalizarBusqueda(
                item.estadoSolicitud
              );

            return (
              estado === 'pendiente' ||
              estado === 'en revision'
            );
          })
        ),

      aprobados:
        ordenarAspirantesAntiguosPrimero(
          visibles.filter((item) => {
            const estado =
              normalizarBusqueda(
                item.estadoSolicitud
              );

            return (
              estado === 'aprobado' ||
              estado === 'convertido'
            );
          })
        ),

      rechazados:
        ordenarAspirantesAntiguosPrimero(
          visibles.filter(
            (item) =>
              normalizarBusqueda(
                item.estadoSolicitud
              ) === 'rechazado'
          )
        ),
    };
  }, [items, busqueda]);


  function puede(permiso) {
    return !authLoading && autenticado && tienePermiso(permiso);
  }

  function aspiranteBloqueado(aspirante) {
    return (
      String(
        aspirante?.estadoSolicitud || ''
      )
        .trim()
        .toLowerCase() ===
        'convertido' ||
      Boolean(
        String(
          aspirante?.caminanteId || ''
        ).trim()
      )
    );
  }

  async function guardarEdicionAspirante(datos) {
    if (!aspiranteEditar) return;
    setProcesando(true);
    try {
      await editarAspiranteApi(token, aspiranteEditar.id, datos);
      setAspiranteEditar(null);
      setSeleccionado(null);
      await api.reload();
    } finally {
      setProcesando(false);
    }
  }

  async function cambiarEstado(estado) {
    if (!seleccionado) {
      return;
    }

    setProcesando(true);

    try {
      const resultado =
        await actualizarEstadoAspiranteApi(
          token,
          seleccionado.id,
          estado,
          seleccionado.observacionesGestion || ''
        );

      setSeleccionado(null);
      await api.reload();

      const estadoNormalizado = normalizarBusqueda(estado);

      if (estadoNormalizado === 'aprobado') {
        setGrupoAbierto('aprobados');
      } else if (estadoNormalizado === 'rechazado') {
        setGrupoAbierto('rechazados');
      }

      if (
        String(estado)
          .trim()
          .toLowerCase() ===
          'aprobado' &&
        resultado?.caminante
      ) {
        reproducirSonidoCelebracion();

        setCelebracion({
          nombre:
            resultado.caminante.nombre ||
            seleccionado.nombreCompleto ||
            'El aspirante',
          total:
            resultado.indicadores?.total ||
            0,
          meta:
            resultado.indicadores?.meta ||
            0,
          faltantes:
            resultado.indicadores
              ?.cuposDisponibles ||
            0,
        });
      }
    } finally {
      setProcesando(false);
    }
  }

  const mensajeMeta =
    obtenerMensajeMeta(
      celebracion
    );

  if (api.loading && !api.data) {
    return <LoadingState />;
  }

  if (api.error) {
    return <ErrorState message={api.error} onRetry={api.reload} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Admisiones"
        title="Aspirantes"
        subtitle="Solicitudes recibidas desde el portal público"
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 3 },
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            color: '#fff',
            background: 'linear-gradient(135deg, #0b3d34 0%, #176b58 62%, #2c8a72 100%)',
            boxShadow: '0 18px 45px rgba(15,72,60,.16)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2.5}>
            <Box>
              <Typography variant="overline" sx={{ color: '#c8f1e5', fontWeight: 950, letterSpacing: '.14em' }}>
                Gestión de admisiones
              </Typography>
              <Typography variant="h4" fontWeight={950} sx={{ mt: .25 }}>
                Acompaña cada inscripción hasta su decisión
              </Typography>
              <Typography sx={{ mt: 1, maxWidth: 700, color: 'rgba(255,255,255,.76)', lineHeight: 1.65 }}>
                Revisa primero los pendientes, consulta la información del aspirante y gestiona su avance desde un solo lugar.
              </Typography>
            </Box>

            {puede('ASPIRANTES_REGISTRAR') && (
              <Button
                variant="contained"
                startIcon={<PersonAddRounded />}
                onClick={() => navigate('/aspirantes/nuevo')}
                sx={{
                  alignSelf: { xs: 'stretch', md: 'center' },
                  bgcolor: '#fff',
                  color: '#124b40',
                  fontWeight: 950,
                  px: 2.5,
                  '&:hover': { bgcolor: '#f3fbf8' },
                }}
              >
                Registrar aspirante
              </Button>
            )}
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {[
            { id: 'pendientes', titulo: 'Por gestionar', valor: grupos.pendientes.length, icono: <PersonRounded />, fondo: '#fff8e8', borde: '#e8b84a', texto: '#74530c' },
            { id: 'aprobados', titulo: 'Aprobados', valor: grupos.aprobados.length, icono: <CheckRounded />, fondo: '#edf8f3', borde: '#42a77c', texto: '#175b43' },
            { id: 'rechazados', titulo: 'Rechazados', valor: grupos.rechazados.length, icono: <CloseRounded />, fondo: '#fff1f1', borde: '#d96b6b', texto: '#7b2929' },
          ].map((resumen) => (
            <Paper
              key={resumen.id}
              role="button"
              tabIndex={0}
              onClick={() => setGrupoAbierto(resumen.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setGrupoAbierto(resumen.id);
              }}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3.5,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                borderColor:
                  grupoAbierto === resumen.id
                    ? resumen.borde
                    : 'divider',
                borderWidth:
                  grupoAbierto === resumen.id
                    ? 2
                    : 1,
                bgcolor:
                  grupoAbierto === resumen.id
                    ? resumen.fondo
                    : '#fff',
                boxShadow:
                  grupoAbierto === resumen.id
                    ? `0 15px 34px ${resumen.borde}28`
                    : '0 6px 20px rgba(17,48,41,.035)',
                transition:
                  'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: -26,
                  top: -34,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: resumen.borde,
                  opacity:
                    grupoAbierto === resumen.id
                      ? 0.10
                      : 0,
                  transition: 'opacity .18s ease',
                },
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow:
                    `0 16px 34px ${resumen.borde}22`,
                  borderColor: resumen.borde,
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: resumen.fondo, color: resumen.texto }}>
                  {resumen.icono}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={950} color={resumen.texto}>{resumen.valor}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={750}>{resumen.titulo}</Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3.5, bgcolor: '#fff' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1.5}
        >
          <TextField
            size="small"
            label="Buscar aspirante"
            placeholder="Nombre, documento, inscripción o celular"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            sx={{ width: { xs: '100%', sm: 390 } }}
            InputProps={{
              startAdornment: (
                <SearchRounded
                  fontSize="small"
                  color="action"
                  sx={{ mr: 1 }}
                />
              ),
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Typography color="text.secondary">
              {items.length} registros totales
            </Typography>

            {puede('ALIMENTACION_EXPORTAR') && (
              <Button
                variant="outlined"
                startIcon={<DownloadRounded />}
                onClick={() => descargarReporteAlimentacion(items)}
                disabled={!items.length}
              >
                Exportar alimentación
              </Button>
            )}

          </Stack>
        </Stack>
        </Paper>

        <PanelEstadoAspirantes
          id={grupoAbierto}
          titulo={
            grupoAbierto === 'pendientes'
              ? 'Por gestionar'
              : grupoAbierto === 'aprobados'
                ? 'Aprobados'
                : 'Rechazados'
          }
          subtitulo={
            grupoAbierto === 'pendientes'
              ? 'Inscripciones que requieren revisión o una decisión del equipo.'
              : grupoAbierto === 'aprobados'
                ? 'Personas aprobadas o ya convertidas en caminantes.'
                : 'Solicitudes rechazadas que permanecen disponibles para consulta.'
          }
          items={
            grupos[grupoAbierto] || []
          }
          color={
            grupoAbierto === 'pendientes'
              ? '#b98316'
              : grupoAbierto === 'aprobados'
                ? '#21865f'
                : '#b54747'
          }
          colorSuave={
            grupoAbierto === 'pendientes'
              ? '#fff8e8'
              : grupoAbierto === 'aprobados'
                ? '#edf8f3'
                : '#fff1f1'
          }
          mensajeVacio={
            grupoAbierto === 'pendientes'
              ? 'No hay aspirantes pendientes por gestionar.'
              : grupoAbierto === 'aprobados'
                ? 'Todavía no hay aspirantes aprobados.'
                : 'No hay aspirantes rechazados.'
          }
          onVerDetalle={setSeleccionado}
          onEditar={setAspiranteEditar}
          puedeEditar={puede('ASPIRANTES_EDITAR')}
          token={token}
          puedeNotificar={
            puede('ASPIRANTES_NOTIFICAR_PREINSCRIPCION') ||
            puede('ASPIRANTES_CAMBIAR_ESTADO')
          }
          onNotificacionCompletada={
            api.reload
          }
        />

      </Stack>
      <Dialog
        open={Boolean(seleccionado)}
        onClose={() => !procesando && setSeleccionado(null)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={1}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Detalle del aspirante
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {seleccionado?.numeroInscripcion || 'Sin número de inscripción'}
              </Typography>
            </Box>

            {seleccionado && (
              <Chip
                color={colorEstado(seleccionado.estadoSolicitud)}
                label={seleccionado.estadoSolicitud || 'Sin estado'}
                sx={{ fontWeight: 800 }}
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {seleccionado && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={900}>
                  {seleccionado.nombreCompleto || 'Nombre no informado'}
                </Typography>
                <Typography color="text.secondary">
                  Documento {valorVisible(seleccionado.documentoIdentidad)}
                </Typography>
              </Box>

              <SeccionDetalle
                icono={<PersonRounded color="primary" />}
                titulo="Información personal"
              >
                <CampoDetalle
                  etiqueta="Número de inscripción"
                  valor={seleccionado.numeroInscripcion}
                />
                <CampoDetalle
                  etiqueta="Inscripción diligenciada por"
                  valor={seleccionado.tipoRegistrante === 'INVITADOR' ? 'Otra persona' : 'El aspirante'}
                />
                {seleccionado.tipoRegistrante === 'INVITADOR' && <>
                  <CampoDetalle etiqueta="Nombre del registrante" valor={seleccionado.nombreRegistrante} />
                  <CampoDetalle etiqueta="Teléfono del registrante" valor={seleccionado.telefonoRegistrante} />
                </>}
                <CampoDetalle
                  etiqueta="Nombre completo"
                  valor={seleccionado.nombreCompleto}
                />
                <CampoDetalle
                  etiqueta="Documento de identidad"
                  valor={seleccionado.documentoIdentidad}
                />
                <CampoDetalle
                  etiqueta="Fecha de nacimiento"
                  valor={formatearFechaCorta(seleccionado.fechaNacimiento)}
                />
                <CampoDetalle
                  etiqueta="Edad"
                  valor={(() => {
                    const edad = calcularEdad(seleccionado.fechaNacimiento);
                    return edad !== null ? `${edad} años` : "No informada";
                  })()}
                />
                <CampoDetalle
                  etiqueta="Estado civil"
                  valor={seleccionado.estadoCivil}
                />
                <CampoDetalle
                  etiqueta="Profesión u ocupación"
                  valor={seleccionado.profesionOcupacion}
                />
                <CampoDetalle
                  etiqueta="Talla de camisa"
                  valor={seleccionado.tallaCamisa}
                />
              </SeccionDetalle>

              <SeccionDetalle
                icono={<HomeRounded color="primary" />}
                titulo="Ubicación y contacto"
              >
                <CampoDetalle
                  etiqueta="Dirección de residencia"
                  valor={seleccionado.direccionResidencia}
                />
                <CampoDetalle etiqueta="Barrio" valor={seleccionado.barrio} />
                <CampoDetalle
                  etiqueta="Teléfono"
                  valor={seleccionado.telefono}
                />
                <CampoDetalle
                  etiqueta="Celular"
                  valor={seleccionado.celular}
                />
                <CampoDetalle
                  etiqueta="Parroquia"
                  valor={seleccionado.parroquia}
                />
                <CampoDetalle etiqueta="EPS" valor={seleccionado.eps} />
              </SeccionDetalle>

              <SeccionDetalle
                icono={<FavoriteRounded color="primary" />}
                titulo="Información de salud"
              >
                <CampoDetalle
                  etiqueta="Sufre alguna enfermedad"
                  valor={seleccionado.sufreEnfermedad}
                />
                <CampoDetalle
                  etiqueta="Enfermedad"
                  valor={seleccionado.enfermedadCual}
                />
                <CampoDetalle
                  etiqueta="Toma medicamentos"
                  valor={seleccionado.tomaMedicamento}
                />
                <CampoDetalle
                  etiqueta="Medicamento"
                  valor={seleccionado.medicamentoCual}
                />
                <CampoDetalle
                  etiqueta="Horario de medicamentos"
                  valor={seleccionado.horariosMedicamentos}
                />
                <CampoDetalle
                  etiqueta="Tiene limitación física"
                  valor={seleccionado.tieneLimitacionFisica}
                />
                <CampoDetalle
                  etiqueta="Limitación"
                  valor={seleccionado.limitacionCual}
                />
                <CampoDetalle
                  etiqueta="Tiene condición alimentaria"
                  valor={seleccionado.tieneCondicionAlimentaria}
                />
                <CampoDetalle
                  etiqueta="Alergias alimentarias"
                  valor={seleccionado.alergiasAlimentarias || seleccionado.alergias}
                  anchoCompleto
                />
                <CampoDetalle
                  etiqueta="Restricciones alimentarias"
                  valor={seleccionado.restriccionesAlimentarias}
                  anchoCompleto
                />
                <CampoDetalle
                  etiqueta="Preferencias alimentarias"
                  valor={seleccionado.preferenciasAlimentarias}
                  anchoCompleto
                />
                <CampoDetalle
                  etiqueta="Dieta especial o indicaciones"
                  valor={seleccionado.dietaEspecial}
                  anchoCompleto
                />
              </SeccionDetalle>

              <SeccionDetalle
                icono={<ContactEmergencyRounded color="primary" />}
                titulo="Contactos de emergencia"
              >
                <CampoDetalle
                  etiqueta="Contacto 1 - Nombre"
                  valor={seleccionado.contacto1Nombre}
                />
                <CampoDetalle
                  etiqueta="Contacto 1 - Parentesco"
                  valor={seleccionado.contacto1Parentesco}
                />
                <CampoDetalle
                  etiqueta="Contacto 1 - Celular"
                  valor={seleccionado.contacto1Celular}
                />
                <CampoDetalle
                  etiqueta="Contacto 2 - Nombre"
                  valor={seleccionado.contacto2Nombre}
                />
                <CampoDetalle
                  etiqueta="Contacto 2 - Parentesco"
                  valor={seleccionado.contacto2Parentesco}
                />
                <CampoDetalle
                  etiqueta="Contacto 2 - Celular"
                  valor={seleccionado.contacto2Celular}
                />
              </SeccionDetalle>

              <SeccionDetalle
                icono={<InfoRounded color="primary" />}
                titulo="Información del retiro"
              >
                <CampoDetalle
                  etiqueta="Sacramentos recibidos"
                  valor={seleccionado.sacramentosRecibidos}
                  anchoCompleto
                />
                <CampoDetalle
                  etiqueta="Cómo se enteró"
                  valor={seleccionado.comoSeEntero}
                />
                <CampoDetalle
                  etiqueta="Nombre de quien lo invitó"
                  valor={seleccionado.nombrePersonaInvito}
                />
                <CampoDetalle
                  etiqueta="Celular de quien lo invitó"
                  valor={seleccionado.celularPersonaInvito}
                />
                <CampoDetalle
                  etiqueta="Asistirá una persona conocida"
                  valor={seleccionado.personaConocidaAsistira}
                />
                <CampoDetalle
                  etiqueta="Nombre de la persona conocida"
                  valor={seleccionado.nombrePersonaConocida}
                />
                <CampoDetalle
                  etiqueta="Autoriza tratamiento de datos"
                  valor={seleccionado.autorizaTratamientoDatos}
                />
              </SeccionDetalle>

              <SeccionDetalle
                icono={<BadgeRounded color="primary" />}
                titulo="Gestión de la solicitud"
              >
                <CampoDetalle
                  etiqueta="Estado de la solicitud"
                  valor={seleccionado.estadoSolicitud}
                />
                <CampoDetalle
                  etiqueta="Caminante ID"
                  valor={seleccionado.caminanteId}
                />
                <CampoDetalle
                  etiqueta="Activo"
                  valor={seleccionado.activo}
                />
                <CampoDetalle
                  etiqueta="Fecha de preinscripción"
                  valor={formatearFecha(seleccionado.fechaRegistro)}
                />
                <CampoDetalle
                  etiqueta="Fecha de actualización"
                  valor={formatearFecha(seleccionado.fechaActualizacion)}
                />
                <CampoDetalle
                  etiqueta="Actualizado por"
                  valor={seleccionado.actualizadoPor}
                />
              </SeccionDetalle>

              <Divider />

              {aspiranteBloqueado(seleccionado) && (
                <Alert severity="success">
                  Este aspirante ya fue aprobado y creado como caminante.
                  Su solicitud quedó cerrada y no puede editarse.
                </Alert>
              )}

              <TextField
                label="Observaciones de gestión"
                value={seleccionado.observacionesGestion || ''}
                onChange={(event) =>
                  setSeleccionado((actual) => ({
                    ...actual,
                    observacionesGestion: event.target.value,
                  }))
                }
                multiline
                minRows={3}
                fullWidth
                disabled={aspiranteBloqueado(seleccionado)}
                helperText={
                  aspiranteBloqueado(seleccionado)
                    ? 'La gestión se encuentra cerrada.'
                    : 'Estas observaciones se guardarán al cambiar el estado.'
                }
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ flexWrap: 'wrap', gap: 0.5, px: 3, py: 2 }}>
          <Button
            onClick={() => setSeleccionado(null)}
            disabled={procesando}
          >
            Cerrar
          </Button>
          {puede('ASPIRANTES_EDITAR') && seleccionado && !aspiranteBloqueado(seleccionado) && (
            <Button
              variant="outlined"
              startIcon={<EditRounded />}
              onClick={() => {
                setAspiranteEditar(seleccionado);
                setSeleccionado(null);
              }}
            >
              Editar aspirante
            </Button>
          )}

          {(puede('ASPIRANTES_NOTIFICAR_PREINSCRIPCION') ||
            puede('ASPIRANTES_CAMBIAR_ESTADO')) &&
            notificacionesWhatsappUnicas(
              seleccionado?.whatsappNotificaciones
            ).map(
              (notificacion) => (
                <WhatsAppNotifyButton
                  key={notificacion.id}
                  token={token}
                  notificacion={notificacion}
                  label={
                    notificacion.tipo === 'INSCRIPCION'
                      ? 'Notificar preinscripción'
                      : notificacion.tipo === 'APROBACION'
                        ? 'Notificar aceptación'
                        : 'Notificar'
                  }
                  onCompleted={async () => {
                    setSeleccionado(null);
                    await api.reload();
                  }}
                />
              )
            )}

          {puede('ASPIRANTES_CAMBIAR_ESTADO') &&
            !aspiranteBloqueado(seleccionado) && (
              <>
                <Button
                  color="warning"
                  onClick={() => cambiarEstado('En revisión')}
                  disabled={procesando}
                >
                  En revisión
                </Button>

                <Button
                  color="error"
                  startIcon={<CloseRounded />}
                  onClick={() => cambiarEstado('Rechazado')}
                  disabled={procesando}
                >
                  Rechazar
                </Button>

                {puede('ASPIRANTES_CAMBIAR_ESTADO') && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckRounded />}
                    onClick={() => cambiarEstado('Aprobado')}
                    disabled={procesando}
                  >
                    Aprobar y crear caminante
                  </Button>
                )}
              </>
            )}
        </DialogActions>
      </Dialog>

      <AspiranteEditDialog open={Boolean(aspiranteEditar)} aspirante={aspiranteEditar} loading={procesando} onClose={()=>setAspiranteEditar(null)} onSave={guardarEdicionAspirante} />

      {celebracion && (
        <ConfetiCelebracion />
      )}

      <Dialog
        open={Boolean(celebracion)}
        onClose={() =>
          setCelebracion(null)
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'visible',
          },
        }}
      >
        <DialogContent
          sx={{
            textAlign: 'center',
            px: { xs: 3, sm: 5 },
            pt: 5,
            pb: 3,
          }}
        >
          <Typography
            aria-hidden="true"
            sx={{
              fontSize: { xs: 58, sm: 72 },
              lineHeight: 1,
              mb: 2,
            }}
          >
            🎉
          </Typography>

          <Typography
            variant="h4"
            fontWeight={950}
            mb={1.5}
          >
            {mensajeMeta.titulo}
          </Typography>

          <Typography
            variant="h6"
            color="primary.main"
            fontWeight={900}
            mb={2}
          >
            {celebracion?.nombre}
          </Typography>

          <Typography
            color="text.secondary"
            fontSize="1.05rem"
            lineHeight={1.7}
          >
            {mensajeMeta.mensaje}
          </Typography>

          {Number(
            celebracion?.meta
          ) > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 3,
                bgcolor:
                  'action.hover',
              }}
            >
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="baseline"
                spacing={1}
              >
                <Typography
                  variant="h3"
                  fontWeight={950}
                  color="success.main"
                >
                  {celebracion?.total || 0}
                </Typography>

                <Typography
                  color="text.secondary"
                  fontWeight={800}
                >
                  de {celebracion?.meta}
                </Typography>
              </Stack>

              {Number(
                celebracion?.faltantes
              ) > 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  mt={0.5}
                >
                  Faltan{' '}
                  <strong>
                    {celebracion.faltantes}
                  </strong>{' '}
                  para cumplir la meta.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            px: 3,
            pb: 3,
          }}
        >
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={() =>
              setCelebracion(null)
            }
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
