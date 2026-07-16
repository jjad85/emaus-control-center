import {
  Alert,
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  CheckCircleRounded,
  GroupsRounded,
  MailRounded,
  PaymentsRounded,
  PersonRounded,
  PhotoRounded,
  SlideshowRounded,
} from '@mui/icons-material';

import { obtenerDashboard } from '../api/dashboardApi';
import { useApi } from '../hooks/useApi';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import KpiCard from '../components/KpiCard';
import PageHeader from '../components/PageHeader';

function obtenerCantidad(objeto, ...claves) {
  if (!objeto) {
    return 0;
  }

  return claves.reduce(
    (total, clave) =>
      total + Number(objeto[clave] || 0),
    0
  );
}

function IndicadorEstado({
  etiqueta,
  valor,
  total,
}) {
  const porcentaje =
    total > 0
      ? Math.round((valor / total) * 100)
      : 0;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        mb={0.5}
      >
        <Typography
          color="text.secondary"
          fontWeight={650}
        >
          {etiqueta}
        </Typography>

        <Typography fontWeight={800}>
          {valor}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(porcentaje, 100)}
        sx={{
          height: 8,
          borderRadius: 999,
        }}
      />
    </Box>
  );
}

function TarjetaProceso({
  titulo,
  icono,
  total,
  indicadores,
}) {
  return (
    <Paper
      sx={{
        p: 2.5,
        height: '100%',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        mb={2.5}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            color: 'primary.dark',
            display: 'grid',
            placeItems: 'center',

            '& svg': {
              fontSize: 24,
            },
          }}
        >
          {icono}
        </Box>

        <Box>
          <Typography
            variant="h6"
            fontWeight={850}
          >
            {titulo}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Total: {total}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        {indicadores.map((indicador) => (
          <IndicadorEstado
            key={indicador.etiqueta}
            etiqueta={indicador.etiqueta}
            valor={indicador.valor}
            total={total}
          />
        ))}
      </Stack>
    </Paper>
  );
}

export default function Dashboard() {
  const {
    data,
    loading,
    error,
    reload,
  } = useApi(
    () => obtenerDashboard(),
    []
  );

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

  const servidores = data.servidores;
  const caminantes = data.caminantes;
  const presentaciones = data.presentaciones;

  const pagosServidores = servidores.pagos || {};
  const pagosCaminantes = caminantes.pagos || {};

  const cartas = caminantes.cartas || {};
  const fotos = caminantes.fotos || {};

  const servidoresPendientes =
    obtenerCantidad(
      pagosServidores,
      'pendiente'
    );

  const servidoresParciales =
    obtenerCantidad(
      pagosServidores,
      'pagoparcial',
      'parcial'
    );

  const servidoresPagados =
    obtenerCantidad(
      pagosServidores,
      'pagototal',
      'total',
      'pagado'
    );

  const caminantesPendientes =
    obtenerCantidad(
      pagosCaminantes,
      'pendiente'
    );

  const caminantesParciales =
    obtenerCantidad(
      pagosCaminantes,
      'pagoparcial',
      'parcial'
    );

  const caminantesPagados =
    obtenerCantidad(
      pagosCaminantes,
      'pagototal',
      'total',
      'pagado'
    );

  const cartasPendientes =
    obtenerCantidad(
      cartas,
      'pendiente',
      'nosolicitada'
    );

  const cartasProceso =
    obtenerCantidad(
      cartas,
      'enproceso',
      'solicitada'
    );

  const cartasEntregadas =
    obtenerCantidad(
      cartas,
      'entregada',
      'entregado',
      'recibida',
      'recibido',
      'completado'
    );

  const fotosPendientes =
    obtenerCantidad(
      fotos,
      'pendiente',
      'nosolicitada'
    );

  const fotosProceso =
    obtenerCantidad(
      fotos,
      'enproceso',
      'solicitada'
    );

  const fotosEntregadas =
    obtenerCantidad(
      fotos,
      'entregada',
      'entregado',
      'recibida',
      'recibido',
      'completado'
    );

  const alertasCriticas =
    data.alertas.filter(
      (alerta) => alerta.tipo === 'error'
    );

  const alertasImportantes =
    data.alertas.filter(
      (alerta) => alerta.tipo === 'warning'
    );

  const alertasInformativas =
    data.alertas.filter(
      (alerta) => alerta.tipo === 'info'
    );

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="Centro de Control"
        title={[
          'EMAÚS',
          data.configuracion?.tipoRetiro
            ? `Retiro ${data.configuracion.tipoRetiro}`
            : 'Retiro',
          data.configuracion?.anioRetiro,
        ]
          .filter(Boolean)
          .join(' - ')}
        subtitle="Resumen general del retiro"
        onRefresh={reload}
        loading={loading}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Servidores"
            value={servidores.total}
            icon={<GroupsRounded />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Caminantes"
            value={caminantes.total}
            helper={`Meta: ${caminantes.meta}`}
            icon={<PersonRounded />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Cupos disponibles"
            value={caminantes.cuposDisponibles}
            icon={<CheckCircleRounded />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Presentaciones aprobadas"
            value={presentaciones.aprobadas}
            icon={<SlideshowRounded />}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          justifyContent="space-between"
          gap={1}
          mb={1.5}
        >
          <Box>
            <Typography
              variant="overline"
              color="primary"
            >
              Meta de caminantes
            </Typography>

            <Typography
              variant="h6"
              fontWeight={850}
            >
              Cumplimiento general
            </Typography>
          </Box>

          <Typography
            variant="h4"
            color="primary"
            fontWeight={850}
          >
            {caminantes.porcentajeMeta}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={Math.min(
            caminantes.porcentajeMeta,
            100
          )}
          sx={{
            height: 14,
            borderRadius: 999,
          }}
        />
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <TarjetaProceso
            titulo="Pagos de servidores"
            icono={<PaymentsRounded />}
            total={servidores.total}
            indicadores={[
              {
                etiqueta: 'Pendientes',
                valor: servidoresPendientes,
              },
              {
                etiqueta: 'Pago parcial',
                valor: servidoresParciales,
              },
              {
                etiqueta: 'Pago total',
                valor: servidoresPagados,
              },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <TarjetaProceso
            titulo="Pagos de caminantes"
            icono={<PaymentsRounded />}
            total={caminantes.total}
            indicadores={[
              {
                etiqueta: 'Pendientes',
                valor: caminantesPendientes,
              },
              {
                etiqueta: 'Pago parcial',
                valor: caminantesParciales,
              },
              {
                etiqueta: 'Pago total',
                valor: caminantesPagados,
              },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <TarjetaProceso
            titulo="Control audiovisual"
            icono={<SlideshowRounded />}
            total={
              presentaciones.totalPresentaciones
            }
            indicadores={[
              {
                etiqueta: 'Entregadas',
                valor: presentaciones.entregadas,
              },
              {
                etiqueta: 'Ajustadas',
                valor: presentaciones.ajustadas,
              },
              {
                etiqueta: 'Aprobadas',
                valor: presentaciones.aprobadas,
              },
            ]}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TarjetaProceso
            titulo="Cartas"
            icono={<MailRounded />}
            total={caminantes.total}
            indicadores={[
              {
                etiqueta: 'Pendientes',
                valor: cartasPendientes,
              },
              {
                etiqueta: 'En proceso',
                valor: cartasProceso,
              },
              {
                etiqueta: 'Entregadas',
                valor: cartasEntregadas,
              },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TarjetaProceso
            titulo="Fotos"
            icono={<PhotoRounded />}
            total={caminantes.total}
            indicadores={[
              {
                etiqueta: 'Pendientes',
                valor: fotosPendientes,
              },
              {
                etiqueta: 'En proceso',
                valor: fotosProceso,
              },
              {
                etiqueta: 'Entregadas',
                valor: fotosEntregadas,
              },
            ]}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          fontWeight={850}
          mb={2}
        >
          Alertas prioritarias
        </Typography>

        <Stack spacing={2.5}>
          {alertasCriticas.length > 0 && (
            <Box>
              <Typography
                fontWeight={800}
                color="error.main"
                mb={1}
              >
                Críticas
              </Typography>

              <Stack spacing={1}>
                {alertasCriticas.map(
                  (alerta, indice) => (
                    <Alert
                      severity="error"
                      key={indice}
                    >
                      {alerta.mensaje}
                    </Alert>
                  )
                )}
              </Stack>
            </Box>
          )}

          {alertasImportantes.length > 0 && (
            <Box>
              <Typography
                fontWeight={800}
                color="warning.dark"
                mb={1}
              >
                Importantes
              </Typography>

              <Stack spacing={1}>
                {alertasImportantes.map(
                  (alerta, indice) => (
                    <Alert
                      severity="warning"
                      key={indice}
                    >
                      {alerta.mensaje}
                    </Alert>
                  )
                )}
              </Stack>
            </Box>
          )}

          {alertasInformativas.length > 0 && (
            <Box>
              <Typography
                fontWeight={800}
                color="info.main"
                mb={1}
              >
                Información
              </Typography>

              <Stack spacing={1}>
                {alertasInformativas.map(
                  (alerta, indice) => (
                    <Alert
                      severity="info"
                      key={indice}
                    >
                      {alerta.mensaje}
                    </Alert>
                  )
                )}
              </Stack>
            </Box>
          )}

          {data.alertas.length === 0 && (
            <Alert severity="success">
              No hay alertas prioritarias.
            </Alert>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}