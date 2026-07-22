import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  BedRounded,
  EditRounded,
  MenuBookRounded,
  PaymentsRounded,
  PersonSearchRounded,
  SearchRounded,
  TableRestaurantRounded,
  GroupsRounded,
} from '@mui/icons-material';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import {
  asignarHabitacionServidorApi,
  asignarMesaServidorApi,
  asignarTemaServidorApi,
  editarServidorApi,
  obtenerOpcionesGestionServidorApi,
  obtenerServidores,
} from '../api/servidoresApi';
import { buscarPersonaPago } from '../api/pagosApi';

import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import ProtectedButton from '../components/ProtectedButton';
import AvatarServidor from '../components/servidores/AvatarServidor';
import GestionEquiposServidorDialog from '../components/equipos/GestionEquiposServidorDialog';

const CONFIG_ACCIONES = {
  tema: { titulo: 'Asignar tema', permiso: 'EDITAR_SERVIDOR' },
  mesa: { titulo: 'Asignar equipo', permiso: 'EDITAR_SERVIDOR' },
  habitacion: { titulo: 'Asignar habitación', permiso: 'EDITAR_SERVIDOR' },
};

function moneda(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function normalizar(valor) {
  return String(valor || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function nombreTema(tema) {
  if (typeof tema === 'object' && tema !== null) {
    return tema.nombre || tema.titulo || 'Tema';
  }

  return String(tema || '').trim();
}

function tieneAsignacion(servidor) {
  return Boolean(String(servidor?.mesa || '').trim() || String(servidor?.equipo || '').trim());
}

function tieneHabitacion(servidor) {
  return Boolean(String(servidor?.habitacion || '').trim());
}

function descripcionAsignacion(servidor) {
  if (servidor?.mesa) {
    return `Mesa ${servidor.mesa} · ${servidor.rolMesa || servidor.rolEquipo || servidor.rol || 'Sin rol'}`;
  }

  if (servidor?.equipo) {
    return `${servidor.equipo} · ${servidor.rolEquipo || servidor.rolMesa || servidor.rol || 'Sin rol'}`;
  }

  return 'Sin asignación';
}

export default function Servidores() {
  const api = useApi(() => obtenerServidores(), []);
  const navigate = useNavigate();
  const { token, autenticado } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [selected, setSelected] = useState(null);
  const [dialogo, setDialogo] = useState('');
  const [opciones, setOpciones] = useState(null);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({});
  const [detalleServidor, setDetalleServidor] = useState(null);
  const [resumenPagos, setResumenPagos] = useState(null);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [errorPagos, setErrorPagos] = useState('');
  const [
    servidorGestionEquipos,
    setServidorGestionEquipos,
  ] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargarHistorialPagos() {
      if (!detalleServidor?.id) {
        setResumenPagos(null);
        setErrorPagos('');
        return;
      }

      try {
        setCargandoPagos(true);
        setErrorPagos('');
        const datos = await buscarPersonaPago('servidor', '', detalleServidor.id);
        if (activo) setResumenPagos(datos);
      } catch (error) {
        if (activo) {
          setResumenPagos(null);
          setErrorPagos(error.message || 'No fue posible consultar el historial de pagos.');
        }
      } finally {
        if (activo) setCargandoPagos(false);
      }
    }

    cargarHistorialPagos();
    return () => { activo = false; };
  }, [detalleServidor?.id]);

  const items = api.data?.items || [];
  const filtrados = useMemo(() => items.filter((item) => {
    const texto = normalizar(busqueda);
    return !texto || normalizar(item.nombre).includes(texto) ||
      normalizar(item.documentoIdentidad).includes(texto) ||
      normalizar(item.correo).includes(texto) || String(item.celular || '').includes(busqueda);
  }), [items, busqueda]);

  async function abrirAccion(tipo, servidor) {
    setSelected(servidor);
    setDialogo(tipo);
    setForm({
      nombre: servidor.nombre || '',
      documentoIdentidad: servidor.documentoIdentidad || '',
      correo: servidor.correo || '',
      celular: servidor.celular || '',
      estadoPago: servidor.estadoPago || 'Pendiente',
      temaId: '',
      destinoAsignacion: servidor.mesa ? 'Mesa' : (servidor.equipo || ''),
      mesa: servidor.mesa || '',
      equipo: servidor.mesa ? '' : (servidor.equipo || ''),
      rolMesa: servidor.rolMesa || servidor.rolEquipo || servidor.rol || '',
      habitacion: servidor.habitacion || '',
    });

    if (tipo !== 'editar') {
      setCargandoOpciones(true);
      try {
        setOpciones(await obtenerOpcionesGestionServidorApi(token, servidor.id));
      } finally {
        setCargandoOpciones(false);
      }
    }
  }

  async function abrirTema(servidor) {
    await abrirAccion('tema', servidor);
  }

  async function abrirHabitacion(servidor) {
    if (tieneHabitacion(servidor)) {
      setSelected(servidor);
      setDialogo('habitacionExistente');
      setOpciones(null);
      setForm({});
      return;
    }

    await abrirAccion('habitacion', servidor);
  }

  async function abrirAsignacion(servidor) {
    if (tieneAsignacion(servidor)) {
      setSelected(servidor);
      setDialogo('asignacionExistente');
      setOpciones(null);
      setForm({});
      return;
    }

    await abrirAccion('mesa', servidor);
  }

  async function liberarAsignacion() {
    if (!selected) return;

    setGuardando(true);
    try {
      await asignarMesaServidorApi(token, selected.id, '', '', '', '');
      setDialogo('');
      setSelected(null);
      setOpciones(null);
      setForm({});
      setMensaje('Asignación liberada correctamente.');
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  async function liberarHabitacion() {
    if (!selected) return;

    setGuardando(true);
    try {
      await asignarHabitacionServidorApi(token, selected.id, '');
      setDialogo('');
      setSelected(null);
      setOpciones(null);
      setForm({});
      setMensaje('Habitación liberada correctamente.');
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  function cerrarDialogo() {
    if (guardando) return;
    setDialogo('');
    setSelected(null);
    setOpciones(null);
    setForm({});
  }

  async function guardar() {
    if (!selected) return;
    setGuardando(true);
    try {
      if (dialogo === 'editar') await editarServidorApi(token, selected.id, form);
      if (dialogo === 'tema') await asignarTemaServidorApi(token, selected.id, form.temaId);
      if (dialogo === 'mesa') await asignarMesaServidorApi(
        token,
        selected.id,
        form.destinoAsignacion === 'Mesa' ? 'Mesa' : (form.destinoAsignacion ? 'Equipo' : ''),
        form.mesa,
        form.destinoAsignacion === 'Mesa' ? '' : form.destinoAsignacion,
        form.rolMesa
      );
      if (dialogo === 'habitacion') await asignarHabitacionServidorApi(token, selected.id, form.habitacion);
      setDialogo('');
      setSelected(null);
      setOpciones(null);
      setForm({});
      setMensaje('Cambio guardado correctamente.');
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  const mesaSeleccionada = opciones?.mesas?.find((m) => String(m.numero) === String(form.mesa));
  const equipoSeleccionado = opciones?.equipos?.find(
    (e) => normalizar(e.nombre) === normalizar(form.destinoAsignacion)
  );
  const esMesa = form.destinoAsignacion === 'Mesa';
  const esDireccion = ['direccion', 'equipo de direccion'].includes(
    normalizar(form.destinoAsignacion)
  );
  const rolesDisponibles = esMesa
    ? (mesaSeleccionada?.rolesDisponibles || [])
    : (equipoSeleccionado?.rolesDisponibles || []);
  const rolAutomaticoEquipo = !esMesa && !esDireccion &&
    form.destinoAsignacion && rolesDisponibles.length === 1 &&
    normalizar(rolesDisponibles[0]) === 'equipo';
  const nombresTemasAsignados = new Set(
    (selected?.temas || []).map((tema) => normalizar(nombreTema(tema)))
  );
  const temasDisponibles = (opciones?.temas || []).filter(
    (tema) => !nombresTemasAsignados.has(normalizar(nombreTema(tema)))
  );

  return (
    <>
      <PageHeader
        eyebrow="Equipo humano"
        title="Servidores"
        subtitle={`${items.length} registros`}
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        <TextField
          placeholder="Buscar por nombre, documento, correo o celular"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ maxWidth: 440 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment>,
          }}
        />

        {!autenticado && (
          <Alert severity="info">Está en modo consulta. Inicie sesión para modificar información.</Alert>
        )}

        <Grid container spacing={2}>
          {filtrados.map((servidor) => (
            <Grid key={servidor.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Stack spacing={1.5}>
                    <Stack alignItems="center" spacing={1}>
                      <AvatarServidor
                        servidor={servidor}
                        size={104}
                        destacado={Boolean(
                          servidor.rolEquipo === 'Líder' ||
                          servidor.rolMesa === 'Líder' ||
                          servidor.rol === 'Líder'
                        )}
                        mostrarTooltip={false}
                      />
                    </Stack>

                    <Box>
                      <Typography
                        component="button"
                        type="button"
                        variant="h6"
                        fontWeight={850}
                        onClick={() => setDetalleServidor(servidor)}
                        sx={{
                          p: 0,
                          border: 0,
                          background: 'transparent',
                          color: 'text.primary',
                          cursor: 'pointer',
                          textAlign: 'left',
                          '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                        }}
                      >
                        {servidor.nombre}
                      </Typography>
                      <Typography color="text.secondary">{servidor.celular || 'Sin celular'}</Typography>
                      <Typography variant="body2" color="text.secondary">{servidor.correo || 'Sin correo'}</Typography>
                    </Box>

                    <Stack direction="row" gap={1} flexWrap="wrap">
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" color="text.secondary" fontWeight={700}>
                          Pago:
                        </Typography>
                        <StatusChip value={servidor.estadoPago || 'Pendiente'} />
                      </Stack>
                      <Badge
                        color="error"
                        badgeContent={servidor.temas?.length > 1 ? `+${servidor.temas.length - 1}` : 0}
                        invisible={!servidor.temas || servidor.temas.length <= 1}
                        overlap="rectangular"
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.68rem',
                            fontWeight: 850,
                            minWidth: 20,
                            height: 20,
                            px: 0.6,
                          },
                        }}
                      >
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<MenuBookRounded />}
                          label={servidor.temas?.length
                            ? nombreTema(servidor.temas[0])
                            : 'Sin tema'}
                        />
                      </Badge>
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        icon={<TableRestaurantRounded />}
                        label={
                          servidor.equipo
                            ? `Principal: ${servidor.equipo}`
                            : 'Sin equipo principal'
                        }
                      />

                      {(servidor.equiposApoyo || []).map(
                        (equipoApoyo) => (
                          <Chip
                            key={equipoApoyo.id}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            icon={<GroupsRounded />}
                            label={`Apoyo: ${equipoApoyo.nombre}`}
                          />
                        )
                      )}
                      <Chip size="small" variant="outlined" icon={<BedRounded />} label={servidor.habitacion ? `Habitación ${servidor.habitacion}` : 'Sin habitación'} />
                    </Stack>
                  </Stack>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <ProtectedButton permiso="EDITAR_SERVIDOR" size="small" startIcon={<EditRounded />} onClick={() => abrirAccion('editar', servidor)}>Editar</ProtectedButton>
                  <ProtectedButton permiso="EDITAR_SERVIDOR" size="small" startIcon={<MenuBookRounded />} onClick={() => abrirTema(servidor)}>Tema</ProtectedButton>
                  <ProtectedButton
                    permiso="EDITAR_EQUIPOS"
                    size="small"
                    startIcon={<GroupsRounded />}
                    onClick={() =>
                      setServidorGestionEquipos(
                        servidor
                      )
                    }
                  >
                    Equipos
                  </ProtectedButton>
                  <ProtectedButton permiso="EDITAR_SERVIDOR" size="small" startIcon={<BedRounded />} onClick={() => abrirHabitacion(servidor)}>Habitación</ProtectedButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Dialog
        open={Boolean(detalleServidor)}
        onClose={() => setDetalleServidor(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <PersonSearchRounded color="primary" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={850} noWrap>
                {detalleServidor?.nombre || 'Detalle del servidor'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resumen del servidor
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                  <Stack alignItems="center" mb={2}>
                    <AvatarServidor
                      servidor={detalleServidor}
                      size={104}
                      destacado={Boolean(
                        detalleServidor?.rolEquipo === 'Líder' ||
                        detalleServidor?.rolMesa === 'Líder' ||
                        detalleServidor?.rol === 'Líder'
                      )}
                      mostrarTooltip={false}
                    />
                  </Stack>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                  Datos personales
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Documento de identidad</Typography>
                    <Typography fontWeight={700}>{detalleServidor?.documentoIdentidad || 'No registrado'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Celular</Typography>
                    <Typography fontWeight={700}>{detalleServidor?.celular || 'No registrado'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Correo</Typography>
                    <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
                      {detalleServidor?.correo || 'No registrado'}
                    </Typography>
                  </Grid>
                  {detalleServidor?.tallaCamiseta && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Talla de camiseta</Typography>
                      <Typography fontWeight={700}>{detalleServidor.tallaCamiseta}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                      Servicio y asignación
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Equipo principal
                        </Typography>
                        <Typography fontWeight={750}>
                          {detalleServidor?.equipo ||
                            'Sin equipo principal'}
                        </Typography>

                        {(detalleServidor?.equiposApoyo || []).length > 0 && (
                          <Stack
                            direction="row"
                            gap={1}
                            flexWrap="wrap"
                            mt={1}
                          >
                            {detalleServidor.equiposApoyo.map(
                              (equipoApoyo) => (
                                <Chip
                                  key={equipoApoyo.id}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  label={`Apoyo: ${equipoApoyo.nombre}`}
                                />
                              )
                            )}
                          </Stack>
                        )}
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Habitación</Typography>
                        <Typography fontWeight={750}>
                          {detalleServidor?.habitacion ? `Habitación ${detalleServidor.habitacion}` : 'Sin habitación asignada'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                      Estado del pago
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>
                        Pago:
                      </Typography>
                      <StatusChip value={detalleServidor?.estadoPago || 'Pendiente'} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Historial de pagos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pagos reportados específicamente para este servidor.
                    </Typography>
                  </Box>
                  {resumenPagos && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>Pago:</Typography>
                      <StatusChip value={resumenPagos.estadoPago || 'Pendiente'} />
                    </Stack>
                  )}
                </Stack>

                {cargandoPagos && <Alert severity="info">Consultando pagos del servidor…</Alert>}
                {errorPagos && <Alert severity="error">{errorPagos}</Alert>}

                {resumenPagos && (
                  <Stack spacing={1.5}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Valor retiro</Typography>
                        <Typography fontWeight={800}>{moneda(resumenPagos.valorRetiro)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Total aprobado</Typography>
                        <Typography fontWeight={800}>{moneda(resumenPagos.totalAprobado)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Saldo pendiente</Typography>
                        <Typography fontWeight={800}>{moneda(resumenPagos.saldoPendiente)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Excedente</Typography>
                        <Typography fontWeight={800}>{moneda(resumenPagos.excedente)}</Typography>
                      </Grid>
                    </Grid>

                    {!resumenPagos.pagos?.length ? (
                      <Alert severity="info">Este servidor no tiene pagos registrados.</Alert>
                    ) : (
                      <Stack spacing={1}>
                        {resumenPagos.pagos.map((pago, index) => (
                          <Box key={pago.id || index} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                              <Box>
                                <Typography fontWeight={800}>{moneda(pago.valorReportado)}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {pago.fechaPago || pago.fechaRegistro || 'Fecha no informada'}
                                  {pago.medioPago ? ` · ${pago.medioPago}` : ''}
                                </Typography>
                              </Box>
                              <StatusChip value={pago.estado || 'Pendiente'} />
                            </Stack>
                            {pago.estado === 'Aprobado' && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Valor aprobado:</strong> {moneda(pago.valorAprobado ?? pago.valorReportado)}
                              </Typography>
                            )}
                            {pago.referenciaPago && (
                              <Typography variant="body2"><strong>Referencia:</strong> {pago.referenciaPago}</Typography>
                            )}
                            {pago.observacionesTesoreria && (
                              <Typography variant="body2"><strong>Observación:</strong> {pago.observacionesTesoreria}</Typography>
                            )}
                            {pago.comprobanteUrl && (
                              <Button size="small" href={pago.comprobanteUrl} target="_blank" rel="noopener noreferrer" sx={{ mt: 0.5, px: 0 }}>
                                Ver comprobante
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Temas asignados
                  </Typography>
                  <Chip
                    size="small"
                    label={`${detalleServidor?.temas?.length || 0} tema${detalleServidor?.temas?.length === 1 ? '' : 's'}`}
                  />
                </Stack>

                {detalleServidor?.temas?.length ? (
                  <Stack spacing={1}>
                    {detalleServidor.temas.map((tema, index) => (
                      <Stack
                        key={`${typeof tema === 'object' ? tema.id || tema.nombre : tema}-${index}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 2 }}
                      >
                        <MenuBookRounded fontSize="small" color="primary" />
                        <Typography fontWeight={700}>{nombreTema(tema)}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Este servidor no tiene temas asignados.</Typography>
                )}
              </CardContent>
            </Card>

            {detalleServidor?.observaciones && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                    Observaciones
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                    {detalleServidor.observaciones}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setDetalleServidor(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(dialogo)} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{dialogo === 'editar' ? 'Editar servidor' : dialogo === 'asignacionExistente' ? 'Equipo asignado' : dialogo === 'habitacionExistente' ? 'Habitación existente' : CONFIG_ACCIONES[dialogo]?.titulo}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {cargandoOpciones && <Alert severity="info">Cargando opciones disponibles…</Alert>}

            {dialogo === 'asignacionExistente' && (
              <Alert severity="warning">
                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                  Este servidor ya tiene un equipo o mesa asignado.
                </Typography>
                <Typography variant="body2">
                  Asignación actual: <strong>{descripcionAsignacion(selected)}</strong>.
                  Para asignarlo a otro equipo o mesa, primero debes liberar la asignación actual.
                </Typography>
              </Alert>
            )}


            {dialogo === 'habitacionExistente' && (
              <Alert severity="warning">
                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                  Este servidor ya tiene una habitación asignada.
                </Typography>
                <Typography variant="body2">
                  Habitación actual: <strong>Habitación {selected?.habitacion}</strong>.
                  Para asignarle una nueva habitación, primero debes liberar la actual.
                </Typography>
              </Alert>
            )}

            {dialogo === 'editar' && (
              <>
                <TextField label="Nombre" value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                <TextField
                  label="Documento de identidad"
                  value={form.documentoIdentidad || ''}
                  onChange={(e) => setForm({ ...form, documentoIdentidad: e.target.value.replace(/\D/g, '') })}
                  inputProps={{ inputMode: 'numeric', maxLength: 20 }}
                  helperText="Se usa para identificar al servidor y buscarlo al reportar pagos."
                />
                <TextField label="Correo" value={form.correo || ''} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                <TextField label="Celular" value={form.celular || ''} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
              </>
            )}

            {dialogo === 'tema' && (
              <TextField select label="Tema" value={form.temaId || ''} onChange={(e) => setForm({ ...form, temaId: e.target.value })} helperText="Solo se muestran temas sin asignar. Un servidor puede tener uno o varios temas.">
                <MenuItem value="">Seleccione un tema</MenuItem>
                {temasDisponibles.map((tema) => (
                  <MenuItem key={tema.id} value={tema.id}>{nombreTema(tema)}</MenuItem>
                ))}
              </TextField>
            )}

            {dialogo === 'mesa' && (
              <>
                <TextField
                  select
                  label="Equipo o mesa"
                  value={form.destinoAsignacion || ''}
                  onChange={(e) => {
                    const destino = e.target.value;
                    const equipo = (opciones?.equipos || []).find(
                      (item) => normalizar(item.nombre) === normalizar(destino)
                    );
                    const roles = equipo?.rolesDisponibles || [];
                    const rolAutomatico =
                      destino !== 'Mesa' &&
                      !['direccion', 'equipo de direccion'].includes(normalizar(destino)) &&
                      roles.length === 1 &&
                      normalizar(roles[0]) === 'equipo'
                        ? 'Equipo'
                        : '';

                    setForm({
                      ...form,
                      destinoAsignacion: destino,
                      mesa: '',
                      equipo: destino === 'Mesa' ? '' : destino,
                      rolMesa: rolAutomatico,
                    });
                  }}
                  helperText="Seleccione Mesa, Dirección u otro equipo. También puede dejar al servidor sin asignación."
                >
                  <MenuItem value="">Sin asignación</MenuItem>
                  <MenuItem value="Mesa">Mesa</MenuItem>
                  {(opciones?.equipos || []).map((equipo) => (
                    <MenuItem key={equipo.nombre} value={equipo.nombre}>
                      {equipo.nombre}
                    </MenuItem>
                  ))}
                </TextField>

                {esMesa && (
                  <TextField
                    select
                    label="Número de mesa"
                    value={form.mesa || ''}
                    onChange={(e) => setForm({ ...form, mesa: e.target.value, rolMesa: '' })}
                    helperText="La cantidad de mesas se toma del parámetro numeroMesas de Configuraciones."
                  >
                    {(opciones?.mesas || []).map((mesa) => (
                      <MenuItem key={mesa.numero} value={String(mesa.numero)}>
                        Mesa {mesa.numero}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {((esMesa && form.mesa) || (!esMesa && form.destinoAsignacion)) &&
                  !rolAutomaticoEquipo && (
                    <TextField
                      select
                      label="Rol"
                      value={form.rolMesa || ''}
                      onChange={(e) => setForm({ ...form, rolMesa: e.target.value })}
                      required
                      helperText={
                        esMesa
                          ? 'La mesa solo permite Líder o Colíder, según los cupos disponibles.'
                          : esDireccion
                            ? 'Dirección solo permite Líder o Colíder, según los cupos disponibles.'
                            : 'Este equipo permite Líder o Equipo mientras el cargo de líder esté disponible.'
                      }
                    >
                      {rolesDisponibles.map((rol) => (
                        <MenuItem key={rol} value={rol}>{rol}</MenuItem>
                      ))}
                    </TextField>
                  )}

                {rolAutomaticoEquipo && (
                  <TextField
                    label="Rol"
                    value="Equipo"
                    disabled
                    helperText="Este equipo ya tiene líder. El servidor se asignará automáticamente con el rol Equipo."
                  />
                )}
              </>
            )}

            {dialogo === 'habitacion' && (
              <TextField select label="Habitación" value={form.habitacion || ''} onChange={(e) => setForm({ ...form, habitacion: e.target.value })} helperText="Solo se muestran habitaciones disponibles. Puede dejarla pendiente.">
                <MenuItem value="">Sin habitación asignada</MenuItem>
                {(opciones?.habitaciones || []).map((habitacion) => (
                  <MenuItem key={habitacion.habitacion} value={String(habitacion.habitacion)}>
                    Habitación {habitacion.habitacion}{habitacion.piso ? ` · Piso ${habitacion.piso}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {dialogo === 'editar' && selected && (
            <Button
              startIcon={<PaymentsRounded />}
              onClick={() => {
                const servidorId = selected.id;
                cerrarDialogo();
                navigate(`/reportar-pago?tipo=servidor&id=${encodeURIComponent(servidorId)}`);
              }}
              disabled={guardando}
            >
              Registrar pago
            </Button>
          )}
          <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
          {dialogo === 'asignacionExistente' ? (
            <Button color="error" variant="contained" onClick={liberarAsignacion} disabled={guardando}>
              Liberar equipo
            </Button>
          ) : dialogo === 'habitacionExistente' ? (
            <Button color="error" variant="contained" onClick={liberarHabitacion} disabled={guardando}>
              Liberar habitación
            </Button>
          ) : (
            <Button variant="contained" onClick={guardar} disabled={guardando || cargandoOpciones}>Guardar</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(mensaje)} autoHideDuration={3500} onClose={() => setMensaje('')} message={mensaje} />
    
      <GestionEquiposServidorDialog
        open={Boolean(servidorGestionEquipos)}
        servidor={servidorGestionEquipos}
        token={token}
        onClose={() =>
          setServidorGestionEquipos(null)
        }
        onSaved={async () => {
          setMensaje(
            'Equipos del servidor actualizados correctamente.'
          );
          await api.reload();
        }}
      />

</>
  );
}
