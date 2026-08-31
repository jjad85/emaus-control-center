import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWalletRounded,
  ArrowForwardRounded,
  BedRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  DescriptionRounded,
  GroupsRounded,
  HotelRounded,
  Inventory2Rounded,
  LinkRounded,
  MailRounded,
  OpenInNewRounded,
  PaymentsRounded,
  PersonAddAltRounded,
  PersonRounded,
  PhotoRounded,
  ReceiptLongRounded,
  ReportProblemRounded,
  TableRestaurantRounded,
  TaskAltRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { obtenerDashboard } from '../api/dashboardApi';
import { obtenerDocumentos, obtenerUrlDescargaDocumento } from '../api/documentosApi';
import { obtenerPendientesLogisticaApi, aprobarEntregableLogisticaApi } from '../api/caminantesApi';
import { obtenerAspirantes } from '../api/aspirantesApi';
import { obtenerGastos } from '../api/gastosApi';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const CARD_SX = {
  border: '1px solid',
  borderColor: 'rgba(15, 82, 70, .09)',
  borderRadius: { xs: 3, md: 4 },
  bgcolor: 'rgba(255,255,255,.96)',
  boxShadow: '0 16px 45px rgba(16, 74, 63, .07)',
  overflow: 'hidden',
};

const clickableSx = {
  cursor: 'pointer',
  transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 20px 48px rgba(16, 74, 63, .12)',
    borderColor: 'rgba(23,107,88,.24)',
  },
  '&:focus-visible': {
    outline: '3px solid rgba(23,107,88,.24)',
    outlineOffset: 2,
  },
};

const moneda = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));

function porcentaje(parte, total) {
  const t = Number(total || 0);
  if (!t) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round((Number(parte || 0) / t) * 100)
    )
  );
}

function ejecutarConTeclado(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

function EncabezadoSeccion({
  icono,
  titulo,
  accion,
  accionTexto = 'Ver más',
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1.5}
      sx={{ mb: 2 }}
    >
      <Stack direction="row" spacing={1.15} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: '#176b58',
            bgcolor: 'rgba(23,107,88,.08)',
            '& .MuiSvgIcon-root': { fontSize: 20 },
          }}
        >
          {icono}
        </Box>

        <Typography
          fontWeight={950}
          sx={{
            color: '#102b26',
            fontSize: { xs: 16, md: 17 },
          }}
        >
          {titulo}
        </Typography>
      </Stack>

      {accion && (
        <Button
          size="small"
          variant="text"
          endIcon={<ArrowForwardRounded />}
          onClick={accion}
          sx={{
            color: '#176b58',
            fontWeight: 850,
            minWidth: 0,
            px: 1,
          }}
        >
          {accionTexto}
        </Button>
      )}
    </Stack>
  );
}

function CuentaRegresiva({ item }) {
  if (!item) {
    return (
      <Alert severity="info">
        No hay fechas próximas configuradas.
      </Alert>
    );
  }

  const dias = Number(item.diasRestantes || 0);
  const numero = Math.max(dias, 0);
  const etiqueta =
    dias === 0
      ? 'Hoy'
      : dias === 1
        ? 'día'
        : 'días';

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          minWidth: 96,
          height: 104,
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          color: '#fff',
          background:
            'linear-gradient(145deg, #0d4a3e 0%, #176b58 100%)',
          boxShadow: '0 16px 28px rgba(16,74,63,.20)',
        }}
      >
        {dias === 0 ? (
          <Typography fontWeight={950} fontSize={23}>
            Hoy
          </Typography>
        ) : (
          <Box>
            <Typography
              fontWeight={950}
              fontSize={42}
              lineHeight={0.9}
            >
              {numero}
            </Typography>
            <Typography fontWeight={850} sx={{ mt: .7 }}>
              {etiqueta}
            </Typography>
          </Box>
        )}
      </Box>

      <Box minWidth={0} flex={1}>
        <Typography
          fontWeight={900}
          sx={{ fontSize: { xs: 15, md: 17 } }}
        >
          {item.descripcion}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: .45 }}
        >
          {item.fechaTexto}
        </Typography>

        <Stack direction="row" spacing={.55} sx={{ mt: 1.7 }}>
          {[0, 1, 2, 3, 4].map((paso) => (
            <Box
              key={paso}
              sx={{
                height: 5,
                width: paso < 2 ? 28 : 22,
                borderRadius: 99,
                bgcolor:
                  paso < 2
                    ? '#20a36f'
                    : 'rgba(16,74,63,.13)',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

function MetricaPersona({
  valor,
  titulo,
  detalle,
  color = '#176b58',
  onClick,
}) {
  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => ejecutarConTeclado(event, onClick)
          : undefined
      }
      sx={{
        flex: 1,
        minWidth: 0,
        px: { xs: 1, sm: 2.2 },
        py: .6,
        textAlign: 'center',
        borderRight: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderRight: 0 },
        ...(onClick
          ? {
              cursor: 'pointer',
              borderRadius: 2,
              transition: 'background-color .18s ease',
              '&:hover': {
                bgcolor: 'rgba(23,107,88,.05)',
              },
            }
          : {}),
      }}
    >
      <Typography
        fontWeight={950}
        sx={{
          color,
          fontSize: { xs: 27, md: 34 },
          lineHeight: 1,
        }}
      >
        {valor}
      </Typography>

      <Typography
        fontWeight={850}
        sx={{ mt: .75, color: '#132d28' }}
      >
        {titulo}
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: .1 }}
      >
        {detalle}
      </Typography>
    </Box>
  );
}

function LineaIndicador({
  icono,
  etiqueta,
  valor,
  alerta = false,
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1.5}
      sx={{
        py: 1.05,
        borderBottom: '1px solid',
        borderColor: 'rgba(15,82,70,.08)',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
        <Box
          sx={{
            display: 'grid',
            color: alerta ? '#ef6c00' : '#718096',
            '& .MuiSvgIcon-root': { fontSize: 19 },
          }}
        >
          {icono}
        </Box>

        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
        >
          {etiqueta}
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        fontWeight={950}
        color={alerta ? '#ef6c00' : 'text.primary'}
      >
        {valor}
      </Typography>
    </Stack>
  );
}

function TarjetaResumen({
  titulo,
  icono,
  children,
  onClick,
  pie = 'Ver más',
}) {
  return (
    <Paper
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => ejecutarConTeclado(event, onClick)
          : undefined
      }
      sx={{
        ...CARD_SX,
        ...(onClick ? clickableSx : {}),
        height: '100%',
      }}
    >
      <Box sx={{ p: 2 }}>
        <EncabezadoSeccion
          icono={icono}
          titulo={titulo}
        />

        {children}

        {onClick && (
          <>
            <Divider sx={{ mt: 1.3, mb: 1.05 }} />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ color: '#176b58' }}
            >
              <Typography variant="body2" fontWeight={850}>
                {pie}
              </Typography>
              <ArrowForwardRounded fontSize="small" />
            </Stack>
          </>
        )}
      </Box>
    </Paper>
  );
}

function AccesoRapido({
  icono,
  titulo,
  onClick,
}) {
  return (
    <Paper
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => ejecutarConTeclado(event, onClick)}
      variant="outlined"
      sx={{
        p: 2,
        minHeight: 94,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.25,
        borderColor: 'rgba(15,82,70,.10)',
        bgcolor: '#fff',
        ...clickableSx,
      }}
    >
      <Stack direction="row" spacing={1.3} alignItems="center" minWidth={0}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(23,107,88,.08)',
            color: '#176b58',
          }}
        >
          {icono}
        </Box>

        <Typography fontWeight={850} noWrap>
          {titulo}
        </Typography>
      </Stack>

      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1px solid',
          borderColor: 'divider',
          display: 'grid',
          placeItems: 'center',
          color: '#176b58',
          flexShrink: 0,
        }}
      >
        <ArrowForwardRounded fontSize="small" />
      </Box>
    </Paper>
  );
}

function BarraFinanciera({
  titulo,
  icono,
  recaudado,
  esperado,
  onClick,
}) {
  const progreso = porcentaje(recaudado, esperado);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => ejecutarConTeclado(event, onClick)}
      sx={{
        px: { xs: 1.5, md: 2.2 },
        py: 1.6,
        cursor: 'pointer',
        transition: 'background-color .18s ease',
        '&:hover': { bgcolor: 'rgba(23,107,88,.035)' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={{ xs: 1, sm: 2 }}
      >
        <Stack
          direction="row"
          spacing={1.1}
          alignItems="center"
          sx={{ minWidth: { sm: 180 } }}
        >
          <Box sx={{ color: '#718096', display: 'grid' }}>
            {icono}
          </Box>
          <Typography fontWeight={900}>
            {titulo}
          </Typography>
        </Stack>

        <Box flex={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            gap={1}
          >
            <Typography fontWeight={950}>
              {moneda(recaudado)}
              <Box
                component="span"
                color="text.secondary"
                fontWeight={600}
              >
                {' '}de {moneda(esperado)}
              </Box>
            </Typography>

            <Chip
              size="small"
              label={`${progreso}%`}
              sx={{
                height: 23,
                fontWeight: 900,
                bgcolor: 'rgba(32,163,111,.12)',
                color: '#177647',
              }}
            />
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progreso}
            sx={{
              mt: .75,
              height: 7,
              borderRadius: 99,
              bgcolor: 'rgba(16,74,63,.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 99,
                background:
                  'linear-gradient(90deg, #1f9d68, #36b37e)',
              },
            }}
          />
        </Box>

        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'divider',
            display: { xs: 'none', sm: 'grid' },
            placeItems: 'center',
            color: '#176b58',
          }}
        >
          <ArrowForwardRounded fontSize="small" />
        </Box>
      </Stack>
    </Box>
  );
}

function ModalFechas({
  open,
  onClose,
  fechas = [],
}) {
  const futuras = useMemo(
    () =>
      [...fechas]
        .filter((item) => Number(item.diasRestantes) >= 0)
        .sort(
          (a, b) =>
            Number(a.diasRestantes) -
            Number(b.diasRestantes)
        ),
    [fechas]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="h5" fontWeight={950}>
          Próximas fechas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hitos configurados para el retiro.
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 14,
            top: 14,
          }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1.4}>
          {futuras.map((item, indice) => (
            <Paper
              key={`${item.fecha}-${item.descripcion}`}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderColor:
                  indice === 0
                    ? 'primary.main'
                    : 'divider',
              }}
            >
              <CuentaRegresiva item={item} />
            </Paper>
          ))}

          {!futuras.length && (
            <Alert severity="info">
              No hay fechas próximas configuradas.
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function ModalAprobacionesLogistica({
  open,
  onClose,
  items,
  procesando,
  onAprobar,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="h5" fontWeight={950}>
          Aprobaciones de Logística
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cartas y fotografías entregadas físicamente.
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 14,
            top: 14,
          }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1.4}>
          {items.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2.5 }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                gap={2}
              >
                <Box>
                  <Typography fontWeight={950}>
                    {item.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[
                      item.numeroInscripcion &&
                        `Inscripción ${item.numeroInscripcion}`,
                      item.mesa,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                >
                  {item.cartaPendiente && (
                    <Button
                      variant="contained"
                      startIcon={<MailRounded />}
                      disabled={
                        procesando === `${item.id}-carta`
                      }
                      onClick={() =>
                        onAprobar(item.id, 'carta')
                      }
                    >
                      Aprobar carta
                    </Button>
                  )}

                  {item.fotoPendiente && (
                    <Button
                      variant="contained"
                      startIcon={<PhotoRounded />}
                      disabled={
                        procesando === `${item.id}-foto`
                      }
                      onClick={() =>
                        onAprobar(item.id, 'foto')
                      }
                    >
                      Aprobar foto
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}

          {!items.length && (
            <Alert severity="success">
              No hay entregables pendientes de aprobación.
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    token,
    nombre,
    tienePermiso,
  } = useAuth();

  const [fechasOpen, setFechasOpen] =
    useState(false);

  const [documentosImportantes, setDocumentosImportantes] =
    useState([]);

  const [pendientesLogistica, setPendientesLogistica] =
    useState([]);

  const [logisticaOpen, setLogisticaOpen] =
    useState(false);

  const [procesandoLogistica, setProcesandoLogistica] =
    useState('');

  const [aspirantesPendientes, setAspirantesPendientes] =
    useState(0);

  const [gastos, setGastos] =
    useState({
      totalAprobado: 0,
      pendientes: 0,
      valorPendiente: 0,
    });

  const puedeVerDocumentos =
    tienePermiso('DOCUMENTOS_CONSULTAR');

  const puedeDescargarDocumentos =
    tienePermiso('DOCUMENTOS_DESCARGAR');

  const puedeVerBandejaLogistica =
    tienePermiso('LOGISTICA_CONSULTAR_BANDEJA');

  const puedeAprobarLogistica =
    tienePermiso('CAMINANTES_APROBAR_ENTREGA_LOGISTICA');

  const puedeVerAspirantes =
    tienePermiso('ASPIRANTES_VER_DETALLE');

  const puedeVerGastos =
    tienePermiso('GASTOS_VER');

  const {
    data,
    loading,
    error,
    reload,
  } = useApi(
    () => obtenerDashboard(),
    []
  );

  useEffect(() => {
    let activo = true;

    if (!puedeVerDocumentos || !token) {
      setDocumentosImportantes([]);
      return undefined;
    }

    obtenerDocumentos(
      token,
      { soloImportantes: true }
    )
      .then((respuesta) => {
        if (activo) {
          setDocumentosImportantes(
            (respuesta?.items || []).slice(0, 3)
          );
        }
      })
      .catch(() => {
        if (activo) {
          setDocumentosImportantes([]);
        }
      });

    return () => {
      activo = false;
    };
  }, [token, puedeVerDocumentos]);

  async function cargarPendientesLogistica() {
    if (!token || !puedeVerBandejaLogistica) {
      setPendientesLogistica([]);
      return;
    }

    try {
      const items =
        await obtenerPendientesLogisticaApi(token);

      setPendientesLogistica(
        items || []
      );
    } catch {
      setPendientesLogistica([]);
    }
  }

  useEffect(() => {
    cargarPendientesLogistica();
  }, [token, puedeVerBandejaLogistica]);

  useEffect(() => {
    let activo = true;

    if (!token || !puedeVerAspirantes) {
      setAspirantesPendientes(0);
      return undefined;
    }

    obtenerAspirantes(token)
      .then((respuesta) => {
        if (!activo) return;

        const items =
          respuesta?.items || [];

        const totalPendientes =
          items.filter((item) => {
            const estado =
              String(
                item?.estadoSolicitud ||
                item?.estado ||
                ''
              )
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toLowerCase();

            return (
              estado === 'pendiente' ||
              estado === 'en revision'
            );
          }).length;

        setAspirantesPendientes(
          totalPendientes
        );
      })
      .catch(() => {
        if (activo) {
          setAspirantesPendientes(0);
        }
      });

    return () => {
      activo = false;
    };
  }, [token, puedeVerAspirantes]);

  useEffect(() => {
    let activo = true;

    if (!token || !puedeVerGastos) {
      setGastos({
        totalAprobado: 0,
        pendientes: 0,
        valorPendiente: 0,
      });
      return undefined;
    }

    obtenerGastos(token)
      .then((respuesta) => {
        if (!activo) return;

        setGastos({
          totalAprobado:
            Number(
              respuesta?.resumen?.totalAprobado || 0
            ),
          pendientes:
            Number(
              respuesta?.resumen?.pendientes || 0
            ),
          valorPendiente:
            Number(
              respuesta?.resumen?.valorPendiente || 0
            ),
        });
      })
      .catch(() => {
        if (activo) {
          setGastos({
            totalAprobado: 0,
            pendientes: 0,
            valorPendiente: 0,
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [token, puedeVerGastos]);

  async function aprobarPendienteLogistica(
    id,
    tipo
  ) {
    if (!puedeAprobarLogistica) {
      return;
    }

    const clave =
      `${id}-${tipo}`;

    setProcesandoLogistica(
      clave
    );

    try {
      await aprobarEntregableLogisticaApi(
        token,
        id,
        tipo
      );

      await cargarPendientesLogistica();
    } finally {
      setProcesandoLogistica('');
    }
  }

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={reload}
      />
    );
  }

  const caminantes =
    data?.caminantes || {};

  const servidores =
    data?.servidores || {};

  const mesas =
    data?.resumenMesas || {};

  const financiero =
    data?.resumenFinanciero || {};

  const habitaciones =
    data?.habitaciones || {};

  const fechas =
    data?.fechasImportantes || [];

  const proxima =
    [...fechas]
      .filter(
        (item) =>
          Number(item.diasRestantes) >= 0
      )
      .sort(
        (a, b) =>
          Number(a.diasRestantes) -
          Number(b.diasRestantes)
      )[0];

  const nombreUsuario =
    String(nombre || '')
      .trim()
      .split(/\s+/)[0] ||
    'Servidor';

  const configuracion =
    data?.configuracion || {};

  const nombreRetiro =
    configuracion.titulo ||
    data?.titulo ||
    [
      configuracion.tipoRetiro
        ? `Retiro ${configuracion.tipoRetiro}`
        : 'Retiro',
      configuracion.numeroRetiro
        ? `#${configuracion.numeroRetiro}`
        : '',
      configuracion.anioRetiro,
    ]
      .filter(Boolean)
      .join(' · ');

  const totalSinHabitacion =
    Number(
      caminantes.sinHabitacion || 0
    ) +
    Number(
      servidores.sinHabitacion || 0
    );

  const cartasPendientes =
    Number(
      mesas.cartasPendientes || 0
    );

  const fotosPendientes =
    Number(
      mesas.fotosPendientes || 0
    );

  const habitacionesOcupadas =
    Number(
      habitaciones.ocupadas || 0
    );

  const conflictosHabitaciones =
    Number(
      habitaciones.conConflicto || 0
    );

  const accesos = [
    tienePermiso('MESAS_VER_DETALLE') && {
      titulo: 'Mesas',
      icono: <TableRestaurantRounded />,
      path: '/mesas',
    },
    tienePermiso('HABITACIONES_VER_DETALLE') && {
      titulo: 'Habitaciones',
      icono: <HotelRounded />,
      path: '/habitaciones',
    },
    tienePermiso('CAMINANTES_VER_DETALLE') && {
      titulo: 'Caminantes',
      icono: <GroupsRounded />,
      path: '/caminantes',
    },
    tienePermiso('MIS_TEMAS_VER') && {
      titulo: 'Mis temas',
      icono: <Inventory2Rounded />,
      path: '/mis-temas',
    },
  ].filter(Boolean);

  return (
    <Box
      sx={{
        mx: { xs: -1.5, md: -1 },
        mt: { xs: -1, md: -1 },
        px: { xs: 1.5, md: 1 },
        pb: 3,
        borderRadius: 4,
        background:
          'radial-gradient(circle at 92% 2%, rgba(23,107,88,.08), transparent 28%), linear-gradient(180deg, #f7faf9 0%, #f4f8f7 100%)',
      }}
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            pt: { xs: 1, md: .5 },
            pb: .5,
          }}
        >
          <Typography
            variant="h3"
            fontWeight={950}
            sx={{
              color: '#102b26',
              fontSize: {
                xs: 30,
                md: 38,
              },
              letterSpacing: '-.035em',
            }}
          >
            ¡Bienvenido, {nombreUsuario}! 👋
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: .4 }}
          >
            Aquí tienes el resumen general de{' '}
            <Box component="span" fontWeight={800} color="text.primary">
              {nombreRetiro}
            </Box>
            .
          </Typography>
        </Box>

        {puedeVerDocumentos && (
          <Paper sx={{ ...CARD_SX, p: { xs: 1.7, md: 2.2 } }}>
            <EncabezadoSeccion
              icono={<DescriptionRounded />}
              titulo="Documentos importantes"
              accion={() => navigate('/documentos')}
              accionTexto="Ver todos"
            />

            {documentosImportantes.length ? (
              <Grid container spacing={1.5}>
                {documentosImportantes.map((documento) => (
                  <Grid
                    key={documento.id}
                    size={{ xs: 12, md: 4 }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        borderColor: 'rgba(15,82,70,.09)',
                        ...clickableSx,
                      }}
                    >
                      <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          gap={1.5}
                        >
                          <Stack
                            direction="row"
                            spacing={1.3}
                            alignItems="center"
                            minWidth={0}
                          >
                            <Box
                              sx={{
                                width: 46,
                                height: 46,
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: 'rgba(23,107,88,.07)',
                                color: '#176b58',
                                flexShrink: 0,
                              }}
                            >
                              <DescriptionRounded />
                            </Box>

                            <Box minWidth={0}>
                              <Typography fontWeight={900} noWrap>
                                {documento.nombre}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{ display: 'block', mt: .2 }}
                              >
                                {documento.temaNombre ||
                                  documento.categoria ||
                                  'Documento'}
                              </Typography>
                            </Box>
                          </Stack>

                          {puedeDescargarDocumentos ? (
                            <Tooltip title="Abrir documento" arrow>
                              <IconButton
                                aria-label={`Abrir ${documento.nombre}`}
                                onClick={async () => {
                                  const datosDocumento =
                                    await obtenerUrlDescargaDocumento(
                                      token,
                                      documento.id
                                    );

                                  window.open(
                                    datosDocumento.url,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  flexShrink: 0,
                                }}
                              >
                                <OpenInNewRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <ArrowForwardRounded color="action" />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No hay documentos importantes configurados.
              </Alert>
            )}
          </Paper>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper
              role="button"
              tabIndex={0}
              onClick={() => setFechasOpen(true)}
              onKeyDown={(event) =>
                ejecutarConTeclado(
                  event,
                  () => setFechasOpen(true)
                )
              }
              sx={{
                ...CARD_SX,
                ...clickableSx,
                p: { xs: 2, md: 2.4 },
                height: '100%',
              }}
            >
              <EncabezadoSeccion
                icono={<CalendarMonthRounded />}
                titulo="Próximo hito"
              />
              <CuentaRegresiva item={proxima} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper
              sx={{
                ...CARD_SX,
                p: { xs: 2, md: 2.4 },
                height: '100%',
              }}
            >
              <EncabezadoSeccion
                icono={<GroupsRounded />}
                titulo="Resumen de personas"
              />

              <Stack
                direction="row"
                alignItems="stretch"
                sx={{
                  minHeight: 122,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'rgba(15,82,70,.08)',
                  py: 1.6,
                }}
              >
                <MetricaPersona
                  valor={caminantes.total || 0}
                  titulo="Caminantes"
                  detalle="activos"
                  color="#219653"
                  onClick={
                    tienePermiso('CAMINANTES_VER_DETALLE')
                      ? () => navigate('/caminantes')
                      : undefined
                  }
                />

                <MetricaPersona
                  valor={servidores.total || 0}
                  titulo="Servidores"
                  detalle="activos"
                  color="#1976d2"
                  onClick={
                    tienePermiso('SERVIDORES_VER_DETALLE')
                      ? () => navigate('/servidores')
                      : undefined
                  }
                />

                {puedeVerAspirantes && (
                  <MetricaPersona
                    valor={aspirantesPendientes}
                    titulo="Aspirantes"
                    detalle="pendientes"
                    color="#ef6c00"
                    onClick={() => navigate('/aspirantes')}
                  />
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ ...CARD_SX }}>
          <Box sx={{ p: { xs: 2, md: 2.4 }, pb: 1.5 }}>
            <EncabezadoSeccion
              icono={<AccountBalanceWalletRounded />}
              titulo="Dinero"
              accion={
                tienePermiso('PAGOS_VER_ESTADOS_CUENTA')
                  ? () => navigate('/pagos')
                  : undefined
              }
              accionTexto="Ver tesorería"
            />
          </Box>

          <Grid container>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Box
                sx={{
                  px: { xs: 2, md: 2.4 },
                  pb: 2.2,
                  borderRight: { lg: '1px solid' },
                  borderColor: 'divider',
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1.7 }}
                >
                  <PaymentsRounded sx={{ color: '#102b26' }} />
                  <Typography fontWeight={900}>
                    Tesorería
                  </Typography>
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography
                      fontWeight={950}
                      sx={{ color: '#1f5f9d', fontSize: 20 }}
                    >
                      {moneda(financiero.valorEsperado)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Esperado
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography
                      fontWeight={950}
                      sx={{ color: '#219653', fontSize: 20 }}
                    >
                      {moneda(financiero.valorRecaudado)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Recibido
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography
                      fontWeight={950}
                      sx={{ color: '#ef6c00', fontSize: 20 }}
                    >
                      {moneda(financiero.valorPendiente)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pendiente
                    </Typography>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 2,
                    height: 8,
                    borderRadius: 99,
                    overflow: 'hidden',
                    bgcolor: 'rgba(16,74,63,.08)',
                    display: 'flex',
                  }}
                >
                  <Box
                    sx={{
                      width: `${porcentaje(
                        financiero.valorRecaudado,
                        financiero.valorEsperado
                      )}%`,
                      background:
                        'linear-gradient(90deg, #2182b4 0%, #28a66b 100%)',
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Box
                role={
                  puedeVerGastos
                    ? 'button'
                    : undefined
                }
                tabIndex={
                  puedeVerGastos
                    ? 0
                    : undefined
                }
                onClick={
                  puedeVerGastos
                    ? () => navigate('/tesoreria/gastos')
                    : undefined
                }
                onKeyDown={
                  puedeVerGastos
                    ? (event) =>
                        ejecutarConTeclado(
                          event,
                          () => navigate('/tesoreria/gastos')
                        )
                    : undefined
                }
                sx={{
                  px: { xs: 2, md: 2.6 },
                  pb: 2.2,
                  height: '100%',
                  ...(puedeVerGastos
                    ? {
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(211,47,47,.025)',
                        },
                      }
                    : {}),
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  gap={1}
                  alignItems="flex-start"
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ReceiptLongRounded color="error" />
                      <Typography fontWeight={900}>
                        Gastos
                      </Typography>
                    </Stack>

                    <Typography
                      fontWeight={950}
                      sx={{
                        mt: 1.4,
                        color: 'error.main',
                        fontSize: 24,
                      }}
                    >
                      {puedeVerGastos
                        ? moneda(gastos.totalAprobado)
                        : '—'}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {puedeVerGastos
                        ? `${gastos.pendientes} por validar`
                        : 'Sin permiso de consulta'}
                    </Typography>
                  </Box>

                  {puedeVerGastos && (
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ArrowForwardRounded fontSize="small" />
                    </Box>
                  )}
                </Stack>

                {puedeVerGastos && (
                  <Stack
                    spacing={1}
                    sx={{
                      mt: 2,
                      p: 1.4,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(211,47,47,.035)',
                      border: '1px solid rgba(211,47,47,.08)',
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Gastos aprobados
                      </Typography>
                      <Typography variant="body2" fontWeight={950}>
                        {moneda(gastos.totalAprobado)}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Pendientes de validar
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={950}
                        color={gastos.pendientes > 0 ? 'warning.main' : 'success.main'}
                      >
                        {gastos.pendientes}
                      </Typography>
                    </Stack>

                    {gastos.valorPendiente > 0 && (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Valor por validar
                        </Typography>
                        <Typography variant="body2" fontWeight={950} color="warning.main">
                          {moneda(gastos.valorPendiente)}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider />

          <BarraFinanciera
            titulo="Caminantes"
            icono={<PersonRounded />}
            recaudado={financiero.caminantes?.valorRecaudado}
            esperado={financiero.caminantes?.valorEsperado}
            onClick={() => navigate('/pagos')}
          />

          <Divider />

          <BarraFinanciera
            titulo="Servidores"
            icono={<GroupsRounded />}
            recaudado={financiero.servidores?.valorRecaudado}
            esperado={financiero.servidores?.valorEsperado}
            onClick={() => navigate('/pagos')}
          />
        </Paper>

        {puedeVerBandejaLogistica &&
          pendientesLogistica.length > 0 && (
            <Paper
              sx={{
                ...CARD_SX,
                px: 2.2,
                py: 1.5,
                borderLeft: '4px solid #ef6c00',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                gap={1.5}
              >
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Inventory2Rounded sx={{ color: '#ef6c00' }} />
                  <Box>
                    <Typography fontWeight={900}>
                      Aprobaciones de Logística
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pendientesLogistica.length} caminantes con entregables por aprobar
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  size="small"
                  variant="contained"
                  startIcon={<TaskAltRounded />}
                  onClick={() => setLogisticaOpen(true)}
                >
                  Revisar bandeja
                </Button>
              </Stack>
            </Paper>
          )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TarjetaResumen
              titulo="Personas"
              icono={<GroupsRounded />}
              onClick={() => navigate('/caminantes')}
            >
              <LineaIndicador
                icono={<TableRestaurantRounded />}
                etiqueta="Caminantes sin mesa"
                valor={caminantes.sinMesa || 0}
                alerta={Number(caminantes.sinMesa || 0) > 0}
              />
              <LineaIndicador
                icono={<GroupsRounded />}
                etiqueta="Servidores sin equipo"
                valor={servidores.sinEquipo || 0}
                alerta={Number(servidores.sinEquipo || 0) > 0}
              />
              <LineaIndicador
                icono={<BedRounded />}
                etiqueta="Sin habitación"
                valor={totalSinHabitacion}
                alerta={totalSinHabitacion > 0}
              />
            </TarjetaResumen>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TarjetaResumen
              titulo="Mesas y entregables"
              icono={<TableRestaurantRounded />}
              onClick={() => navigate('/mesas')}
            >
              <LineaIndicador
                icono={<WarningAmberRounded />}
                etiqueta="Mesas incompletas"
                valor={mesas.mesasIncompletas || 0}
                alerta={Number(mesas.mesasIncompletas || 0) > 0}
              />
              <LineaIndicador
                icono={<MailRounded />}
                etiqueta="Cartas pendientes"
                valor={cartasPendientes}
                alerta={cartasPendientes > 0}
              />
              <LineaIndicador
                icono={<PhotoRounded />}
                etiqueta="Fotografías pendientes"
                valor={fotosPendientes}
                alerta={fotosPendientes > 0}
              />
            </TarjetaResumen>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TarjetaResumen
              titulo="Alojamiento"
              icono={<HotelRounded />}
              onClick={() => navigate('/habitaciones')}
            >
              <LineaIndicador
                icono={<HotelRounded />}
                etiqueta="Habitaciones ocupadas"
                valor={habitacionesOcupadas}
              />
              <LineaIndicador
                icono={<ReportProblemRounded />}
                etiqueta="Conflictos"
                valor={conflictosHabitaciones}
                alerta={conflictosHabitaciones > 0}
              />
              <LineaIndicador
                icono={<PersonRounded />}
                etiqueta="Personas sin habitación"
                valor={totalSinHabitacion}
                alerta={totalSinHabitacion > 0}
              />
            </TarjetaResumen>
          </Grid>
        </Grid>

        {accesos.length > 0 && (
          <Paper sx={{ ...CARD_SX, p: { xs: 2, md: 2.4 } }}>
            <EncabezadoSeccion
              icono={<LinkRounded />}
              titulo="Accesos importantes"
            />

            <Grid container spacing={1.5}>
              {accesos.map((acceso) => (
                <Grid
                  key={acceso.path}
                  size={{
                    xs: 12,
                    sm: 6,
                    lg: 12 / Math.min(accesos.length, 4),
                  }}
                >
                  <AccesoRapido
                    icono={acceso.icono}
                    titulo={acceso.titulo}
                    onClick={() => navigate(acceso.path)}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          sx={{
            py: 1,
            color: 'text.secondary',
          }}
        >
          <CheckCircleRounded sx={{ fontSize: 17, color: '#76a99b' }} />
          <Typography variant="caption">
            Emaús, un camino de encuentro con Él
          </Typography>
        </Stack>
      </Stack>

      <ModalAprobacionesLogistica
        open={logisticaOpen}
        onClose={() => setLogisticaOpen(false)}
        items={pendientesLogistica}
        procesando={procesandoLogistica}
        onAprobar={aprobarPendienteLogistica}
      />

      <ModalFechas
        open={fechasOpen}
        onClose={() => setFechasOpen(false)}
        fechas={fechas}
      />
    </Box>
  );
}
