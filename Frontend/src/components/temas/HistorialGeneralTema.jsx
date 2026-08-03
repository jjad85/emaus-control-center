import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import CommentRounded from '@mui/icons-material/CommentRounded';
import { useAuth } from '../../auth/AuthContext';
import { obtenerHistorialGeneralMiTema } from '../../api/temasPresentacionesApi';

const ICONOS = {
  PRESENTACION: <SlideshowRounded fontSize="small" />,
  CANCION: <MusicNoteRounded fontSize="small" />,
  VIDEO: <OndemandVideoRounded fontSize="small" />,
  PALANCA: <CardGiftcardRounded fontSize="small" />,
  COMENTARIO: <CommentRounded fontSize="small" />,
};

const ETIQUETAS = {
  PRESENTACION: 'Presentación',
  CANCION: 'Música',
  VIDEO: 'Video',
  PALANCA: 'Palanca',
  COMENTARIO: 'Comentario',
};

function formatearFecha(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha);
}

export default function HistorialGeneralTema({ temaId, temaNombre }) {
  const { token } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [consultado, setConsultado] = useState(false);

  useEffect(() => {
    setItems([]);
    setError('');
    setConsultado(false);
    setAbierto(false);
  }, [temaId]);

  async function cargar() {
    if (consultado) return;
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerHistorialGeneralMiTema(token, temaId);
      setItems(Array.isArray(datos) ? datos : []);
      setConsultado(true);
    } catch (e) {
      setError(e.message || 'No fue posible consultar la actividad del tema.');
    } finally {
      setCargando(false);
    }
  }

  async function alternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente) await cargar();
  }

  const resumen = useMemo(() => {
    const conteo = {};
    items.forEach((item) => {
      const tipo = item.tipoRecurso || 'COMENTARIO';
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });
    return conteo;
  }, [items]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        borderColor: 'rgba(20,75,62,.14)',
        bgcolor: 'rgba(248,251,249,.8)',
      }}
    >
      <Button
        fullWidth
        onClick={alternar}
        startIcon={<HistoryRounded />}
        endIcon={
          <ExpandMoreRounded
            sx={{
              transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .2s ease',
            }}
          />
        }
        sx={{
          justifyContent: 'flex-start',
          px: { xs: 2, md: 2.5 },
          py: 1.6,
          fontWeight: 950,
          color: 'text.primary',
          '& .MuiButton-endIcon': { ml: 'auto' },
        }}
      >
        Actividad general del tema
      </Button>

      <Collapse in={abierto}>
        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5 }}>
          {cargando && (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={30} />
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {!cargando && !error && consultado && !items.length && (
            <Alert severity="info">
              Todavía no hay movimientos registrados para {temaNombre || 'este tema'}.
            </Alert>
          )}

          {!cargando && !error && items.length > 0 && (
            <Stack spacing={2}>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {Object.entries(resumen).map(([tipo, cantidad]) => (
                  <Chip
                    key={tipo}
                    icon={ICONOS[tipo] || <HistoryRounded fontSize="small" />}
                    label={`${ETIQUETAS[tipo] || tipo}: ${cantidad}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>

              <Box sx={{ position: 'relative', pl: { xs: 3.5, md: 4 } }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 15,
                    top: 10,
                    bottom: 10,
                    width: 2,
                    bgcolor: 'rgba(20,75,62,.15)',
                  }}
                />

                <Stack spacing={1.5}>
                  {items.map((item) => (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{
                        position: 'relative',
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#fff',
                        borderColor: 'rgba(20,75,62,.12)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: { xs: -29, md: -33 },
                          top: 18,
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'primary.main',
                          bgcolor: '#e8f5ef',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px rgba(20,75,62,.15)',
                        }}
                      >
                        {ICONOS[item.tipoRecurso] || <HistoryRounded fontSize="small" />}
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                        <Box>
                          <Typography fontWeight={950}>{item.titulo}</Typography>
                          {item.descripcion && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>
                              {item.descripcion}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={ETIQUETAS[item.tipoRecurso] || item.tipoRecurso || 'Actividad'}
                          size="small"
                          variant="outlined"
                          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                        />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {formatearFecha(item.fecha)} · {item.nombreUsuario || item.usuario || 'Sistema'}
                      </Typography>

                      {item.observaciones && (
                        <Alert severity="info" sx={{ mt: 1.25, py: .2 }}>
                          {item.observaciones}
                        </Alert>
                      )}

                      {item.archivoNombre && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Archivo: {item.archivoNombre}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
