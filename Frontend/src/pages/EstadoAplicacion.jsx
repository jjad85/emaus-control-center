import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorRounded from '@mui/icons-material/ErrorRounded';
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { useAuth } from '../auth/AuthContext';

function EstadoChip({ estado }) {
  if (estado === 'ok') {
    return <Chip size="small" color="success" icon={<CheckCircleRounded />} label="Operativo" />;
  }

  if (estado === 'error') {
    return <Chip size="small" color="error" icon={<ErrorRounded />} label="Con novedad" />;
  }

  return <Chip size="small" variant="outlined" label="Sin información" />;
}

function TarjetaEstado({ icono, titulo, estado, detalle }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Box sx={{ color: 'primary.main', mb: 1 }}>{icono}</Box>
            <Typography variant="subtitle1" fontWeight={800}>{titulo}</Typography>
          </Box>
          <EstadoChip estado={estado} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {detalle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function EstadoAplicacion() {
  const { autenticado, usuario, rol, fechaExpiracion } = useAuth();
  const [consultando, setConsultando] = useState(false);
  const [backendOk, setBackendOk] = useState(null);
  const [mensajeBackend, setMensajeBackend] = useState('Aún no se ha ejecutado la verificación.');
  const [ultimaVerificacion, setUltimaVerificacion] = useState(null);

  const ambiente = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'production';
  const version = import.meta.env.VITE_APP_VERSION || 'No configurada';
  const apiConfigurada = Boolean(import.meta.env.VITE_APPS_SCRIPT_URL);

  const verificar = useCallback(async () => {
    setConsultando(true);

    try {
      await obtenerConfiguraciones();
      setBackendOk(true);
      setMensajeBackend('La aplicación respondió correctamente y fue posible consultar la configuración existente.');
    } catch (error) {
      setBackendOk(false);
      setMensajeBackend(error?.message || 'No fue posible conectar con el backend.');
    } finally {
      setUltimaVerificacion(new Date());
      setConsultando(false);
    }
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  const sesionDetalle = useMemo(() => {
    if (!autenticado) return 'No hay una sesión autenticada.';

    const vence = fechaExpiracion
      ? new Date(fechaExpiracion).toLocaleString('es-CO')
      : 'sin fecha disponible';

    return `Sesión activa para ${usuario || 'el usuario actual'} (${rol || 'sin rol informado'}). Vence: ${vence}.`;
  }, [autenticado, fechaExpiracion, rol, usuario]);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900}>Estado de la aplicación</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Vista rápida del estado técnico disponible sin modificar la lógica actual del sistema.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={consultando ? <CircularProgress size={17} color="inherit" /> : <RefreshRounded />}
          onClick={verificar}
          disabled={consultando}
        >
          {consultando ? 'Verificando…' : 'Verificar ahora'}
        </Button>
      </Stack>

      <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3 }}>
        Esta primera versión valida conectividad, sesión y configuración del frontend. Copias de seguridad, espacio utilizado y procesos automáticos requieren información adicional del backend y se muestran como no disponibles, sin inventar datos.
      </Alert>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6} lg={4}>
          <TarjetaEstado
            icono={<MonitorHeartRounded fontSize="large" />}
            titulo="Frontend"
            estado={navigator.onLine ? 'ok' : 'error'}
            detalle={navigator.onLine ? 'El navegador tiene conexión de red.' : 'El navegador reporta que está sin conexión.'}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <TarjetaEstado
            icono={<CloudDoneRounded fontSize="large" />}
            titulo="Backend Apps Script"
            estado={backendOk === null ? null : backendOk ? 'ok' : 'error'}
            detalle={mensajeBackend}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <TarjetaEstado
            icono={<StorageRounded fontSize="large" />}
            titulo="Configuración de API"
            estado={apiConfigurada ? 'ok' : 'error'}
            detalle={apiConfigurada ? 'La URL del backend está configurada en el frontend.' : 'No se encontró VITE_APPS_SCRIPT_URL.'}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <TarjetaEstado
            icono={<SecurityRounded fontSize="large" />}
            titulo="Sesión"
            estado={autenticado ? 'ok' : 'error'}
            detalle={sesionDetalle}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <TarjetaEstado
            icono={<InfoOutlined fontSize="large" />}
            titulo="Ambiente"
            estado="ok"
            detalle={`Ambiente detectado: ${String(ambiente).toUpperCase()}. Versión: ${version}.`}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <TarjetaEstado
            icono={<StorageRounded fontSize="large" />}
            titulo="Respaldo y almacenamiento"
            estado={null}
            detalle="No disponible con los servicios actuales. No se realizó ningún cambio de backend para calcularlo."
          />
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        Última verificación: {ultimaVerificacion ? ultimaVerificacion.toLocaleString('es-CO') : 'pendiente'}.
      </Typography>
    </Box>
  );
}
