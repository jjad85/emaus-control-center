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
  MenuItem,
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
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';

import {
  useMemo,
  useState,
} from 'react';

import {
  actualizarEstadoAspiranteApi,
  convertirAspiranteEnCaminanteApi,
  obtenerAspirantes,
} from '../api/aspirantesApi';

import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';

import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

const ESTADOS = [
  '',
  'Pendiente',
  'En revisión',
  'Aprobado',
  'Rechazado',
  'Convertido',
];

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

export default function Aspirantes() {
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

  const [filtro, setFiltro] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const items = api.data?.items || [];

  const filtrados = useMemo(
    () =>
      filtro
        ? items.filter((item) => item.estadoSolicitud === filtro)
        : items,
    [items, filtro]
  );

  function puede(permiso) {
    return !authLoading && autenticado && tienePermiso(permiso);
  }

  async function cambiarEstado(estado) {
    if (!seleccionado) {
      return;
    }

    setProcesando(true);

    try {
      await actualizarEstadoAspiranteApi(
        token,
        seleccionado.id,
        estado,
        seleccionado.observacionesGestion || ''
      );

      setSeleccionado(null);
      await api.reload();
    } finally {
      setProcesando(false);
    }
  }

  async function convertir() {
    if (!seleccionado) {
      return;
    }

    setProcesando(true);

    try {
      await convertirAspiranteEnCaminanteApi(token, seleccionado.id);
      setSeleccionado(null);
      await api.reload();
    } finally {
      setProcesando(false);
    }
  }

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

      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          gap={1.5}
        >
          <TextField
            select
            size="small"
            label="Estado"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            {ESTADOS.map((item) => (
              <MenuItem key={item || 'todos'} value={item}>
                {item || 'Todos'}
              </MenuItem>
            ))}
          </TextField>

          <Typography color="text.secondary">
            {filtrados.length} registros
          </Typography>
        </Stack>

        {filtrados.map((item) => (
          <Paper
            key={item.id}
            variant="outlined"
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
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

              <Button
                startIcon={<VisibilityRounded />}
                onClick={() => setSeleccionado(item)}
                sx={{
                  alignSelf: { xs: 'flex-start', md: 'center' },
                  whiteSpace: 'nowrap',
                }}
              >
                Ver detalle
              </Button>
            </Stack>
          </Paper>
        ))}

        {filtrados.length === 0 && (
          <Alert severity="info">
            No hay aspirantes con el filtro seleccionado.
          </Alert>
        )}
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
                <CampoDetalle etiqueta="Edad" valor={seleccionado.edad} />
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

          {puede('ACTUALIZAR_ESTADO_ASPIRANTE') && (
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

              <Button
                color="success"
                startIcon={<CheckRounded />}
                onClick={() => cambiarEstado('Aprobado')}
                disabled={procesando}
              >
                Aprobar
              </Button>
            </>
          )}

          {puede('CONVERTIR_ASPIRANTE') &&
            seleccionado?.estadoSolicitud === 'Aprobado' && (
              <Button
                variant="contained"
                startIcon={<PersonAddRounded />}
                onClick={convertir}
                disabled={procesando}
              >
                Convertir en caminante
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </>
  );
}
