import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton,
  Button, Paper, Stack, Typography,
} from '@mui/material';
import {
  CalendarMonthRounded, CloseRounded, GroupsRounded, HotelRounded,
  MailRounded, PaymentsRounded, PersonRounded, PhotoRounded,
  ReportProblemRounded, SlideshowRounded, TableRestaurantRounded,
  TaskAltRounded, WarningAmberRounded, DescriptionRounded, OpenInNewRounded, Inventory2Rounded, CheckCircleRounded, PersonAddAltRounded,
} from '@mui/icons-material';

import { obtenerDashboard } from '../api/dashboardApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { obtenerDocumentos, obtenerUrlDescargaDocumento } from '../api/documentosApi';
import { obtenerPendientesLogisticaApi, aprobarEntregableLogisticaApi } from '../api/caminantesApi';
import { obtenerAspirantes } from '../api/aspirantesApi';

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: 'background.paper',
  boxShadow: '0 4px 18px rgba(15, 23, 42, .045)',
};

const moneda = (v) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(v || 0));

function CuentaRegresiva({ item }) {
  if (!item) return <Typography color="text.secondary">No hay fechas configuradas.</Typography>;
  const dias = Number(item.diasRestantes || 0);
  const texto = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `${dias} días`;
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ minWidth: 62, height: 48, px: 1.2, borderRadius: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Typography fontWeight={900} fontSize={dias > 1 ? 21 : 15} lineHeight={1}>{texto}</Typography>
      </Box>
      <Box minWidth={0}>
        <Typography fontWeight={800} noWrap>{item.descripcion}</Typography>
        <Typography variant="caption" color="text.secondary">{item.fechaTexto}</Typography>
      </Box>
    </Stack>
  );
}

function Dato({ valor, etiqueta, color = 'text.primary' }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography fontSize={{ xs: 21, md: 24 }} fontWeight={900} color={color} lineHeight={1.1} noWrap>{valor}</Typography>
      <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
    </Box>
  );
}

function FilaEstado({ icono, texto, valor, alerta = false }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
        <Box sx={{ color: alerta ? 'warning.main' : 'text.secondary', display: 'grid' }}>{icono}</Box>
        <Typography variant="body2" fontWeight={700} noWrap>{texto}</Typography>
      </Stack>
      <Typography variant="body2" fontWeight={900} color={alerta ? 'warning.main' : 'text.primary'}>{valor}</Typography>
    </Stack>
  );
}

function TarjetaOperacion({ titulo, icono, children, accent = 'primary.main' }) {
  return (
    <Paper sx={{ ...panelSx, height: '100%', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.35, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ color: accent, display: 'grid' }}>{icono}</Box>
          <Typography fontWeight={900}>{titulo}</Typography>
        </Stack>
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function MiniMetrica({ icono, etiqueta, valor, alerta = false }) {
  return (
    <Box sx={{ px: 1.7, py: 1.45, borderRight: { md: '1px solid' }, borderBottom: { xs: '1px solid', md: 0 }, borderColor: 'divider', '&:last-child': { borderRight: 0, borderBottom: 0 } }}>
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Box sx={{ color: alerta ? 'warning.main' : 'primary.main', display: 'grid' }}>{icono}</Box>
        <Box minWidth={0}>
          <Typography fontSize={21} fontWeight={900} lineHeight={1}>{valor}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{etiqueta}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ModalFechas({ open, onClose, fechas = [] }) {
  const futuras = useMemo(() => [...fechas].filter(x => Number(x.diasRestantes) >= 0).sort((a,b) => Number(a.diasRestantes)-Number(b.diasRestantes)), [fechas]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 7 }}><Typography variant="h5" fontWeight={950}>Próximas fechas</Typography><Typography variant="body2" color="text.secondary">De la más próxima a la más lejana.</Typography><IconButton onClick={onClose} sx={{ position:'absolute', right:14, top:14 }}><CloseRounded /></IconButton></DialogTitle>
      <DialogContent><Stack spacing={1.4}>{futuras.map((x,i)=><Paper key={`${x.fecha}-${x.descripcion}`} variant="outlined" sx={{ p:2, borderRadius:2, borderColor:i===0?'primary.main':'divider' }}><CuentaRegresiva item={x}/></Paper>)}{!futuras.length&&<Alert severity="info">No hay fechas próximas configuradas.</Alert>}</Stack></DialogContent>
    </Dialog>
  );
}

function ModalAprobacionesLogistica({ open, onClose, items, procesando, onAprobar }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="h5" fontWeight={950}>Aprobaciones de Logística</Typography>
        <Typography variant="body2" color="text.secondary">Cartas y fotografías que ya fueron entregadas físicamente.</Typography>
        <IconButton onClick={onClose} sx={{ position:'absolute', right:14, top:14 }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.4}>
          {items.map(item => (
            <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs:'column', md:'row' }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography fontWeight={950}>{item.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{[item.numeroInscripcion && `Inscripción ${item.numeroInscripcion}`, item.mesa].filter(Boolean).join(' · ')}</Typography>
                </Box>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
                  {item.cartaPendiente && <Button variant="contained" startIcon={<MailRounded />} disabled={procesando === `${item.id}-carta`} onClick={() => onAprobar(item.id, 'carta')}>Aprobar carta</Button>}
                  {item.fotoPendiente && <Button variant="contained" startIcon={<PhotoRounded />} disabled={procesando === `${item.id}-foto`} onClick={() => onAprobar(item.id, 'foto')}>Aprobar foto</Button>}
                </Stack>
              </Stack>
            </Paper>
          ))}
          {!items.length && <Alert severity="success">No hay entregables pendientes de aprobación.</Alert>}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { token, tienePermiso } = useAuth();
  const [fechasOpen, setFechasOpen] = useState(false);
  const [documentosImportantes, setDocumentosImportantes] = useState([]);
  const [pendientesLogistica, setPendientesLogistica] = useState([]);
  const [logisticaOpen, setLogisticaOpen] = useState(false);
  const [procesandoLogistica, setProcesandoLogistica] = useState('');
  const [aspirantesPendientes, setAspirantesPendientes] = useState(0);
  const puedeVerDocumentos = tienePermiso('DOCUMENTOS_CONSULTAR');
  const puedeDescargarDocumentos = tienePermiso('DOCUMENTOS_DESCARGAR');
  const puedeVerBandejaLogistica = tienePermiso('LOGISTICA_CONSULTAR_BANDEJA');
  const puedeAprobarLogistica = tienePermiso('CAMINANTES_APROBAR_ENTREGA_LOGISTICA');
  const puedeVerAspirantes = tienePermiso('ASPIRANTES_VER_DETALLE');
  const { data, loading, error, reload } = useApi(() => obtenerDashboard(), []);

  useEffect(() => {
    let activo = true;
    if (!puedeVerDocumentos || !token) { setDocumentosImportantes([]); return undefined; }
    obtenerDocumentos(token, { soloImportantes: true })
      .then(respuesta => { if (activo) setDocumentosImportantes((respuesta?.items || []).slice(0, 6)); })
      .catch(() => { if (activo) setDocumentosImportantes([]); });
    return () => { activo = false; };
  }, [token, puedeVerDocumentos]);

  const cargarPendientesLogistica = async () => {
    if (!token || !puedeVerBandejaLogistica) { setPendientesLogistica([]); return; }
    try {
      const items = await obtenerPendientesLogisticaApi(token);
      setPendientesLogistica(items || []);
    } catch {
      setPendientesLogistica([]);
    }
  };

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

        const items = respuesta?.items || [];
        const totalPendientes = items.filter((item) => {
          const estado = String(item?.estadoSolicitud || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

          return estado === 'pendiente' || estado === 'en revision';
        }).length;

        setAspirantesPendientes(totalPendientes);
      })
      .catch(() => {
        if (activo) setAspirantesPendientes(0);
      });

    return () => {
      activo = false;
    };
  }, [token, puedeVerAspirantes]);

  const aprobarPendienteLogistica = async (id, tipo) => {
    if (!puedeAprobarLogistica) return;
    const clave = `${id}-${tipo}`;
    setProcesandoLogistica(clave);
    try {
      await aprobarEntregableLogisticaApi(token, id, tipo);
      await cargarPendientesLogistica();
    } finally {
      setProcesandoLogistica('');
    }
  };

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const caminantes = data.caminantes || {};
  const servidores = data.servidores || {};
  const mesas = data.resumenMesas || {};
  const financiero = data.resumenFinanciero || {};
  const presentaciones = data.presentaciones || {};
  const habitaciones = data.habitaciones || {};
  const fechas = data.fechasImportantes || [];
  const proxima = [...fechas].filter(x => Number(x.diasRestantes) >= 0).sort((a,b)=>Number(a.diasRestantes)-Number(b.diasRestantes))[0];
  const alertas = [...(data.alertas || [])].sort((a,b)=>({error:0,warning:1,info:2}[a.tipo]??9)-({error:0,warning:1,info:2}[b.tipo]??9));
  const criticas = alertas.filter(x=>x.tipo==='error').length;
  const advertencias = alertas.filter(x=>x.tipo==='warning').length;
  const pagosPorValidar = financiero.pagosPendientesValidacion || 0;

  const tareas = [
    caminantes.sinMesa > 0 && `${caminantes.sinMesa} caminantes sin mesa`,
    servidores.sinEquipo > 0 && `${servidores.sinEquipo} servidores sin equipo`,
    ((caminantes.sinHabitacion||0)+(servidores.sinHabitacion||0)) > 0 && `${(caminantes.sinHabitacion||0)+(servidores.sinHabitacion||0)} personas sin habitación`,
    mesas.cartasPendientes > 0 && `${mesas.cartasPendientes} cartas pendientes`,
    mesas.fotosPendientes > 0 && `${mesas.fotosPendientes} fotografías pendientes`,
    (presentaciones.totalPresentaciones-presentaciones.entregadas) > 0 && `${presentaciones.totalPresentaciones-presentaciones.entregadas} presentaciones sin entregar`,
    pagosPorValidar > 0 && `${pagosPorValidar} pagos por validar`,
    puedeVerBandejaLogistica && pendientesLogistica.length > 0 && `${pendientesLogistica.length} caminantes con entregables por aprobar`,
  ].filter(Boolean);

  return (
    <Stack spacing={2.25}>
      <PageHeader eyebrow="Centro de operaciones" title={['EMAÚS', data.configuracion?.tipoRetiro && `Retiro ${data.configuracion.tipoRetiro}`, data.configuracion?.anioRetiro].filter(Boolean).join(' - ')} subtitle="Estado operativo del retiro en tiempo real" onRefresh={reload} loading={loading} />

      {documentosImportantes.length > 0 && (
        <Paper
          sx={{
            ...panelSx,
            p: { xs: 1.5, md: 2 },
            borderLeft: '5px solid',
            borderLeftColor: 'warning.main',
            background: 'linear-gradient(135deg, rgba(255,248,225,.96), rgba(255,255,255,.98))',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} mb={1.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'warning.light',
                  color: 'warning.dark',
                }}
              >
                <DescriptionRounded />
              </Box>
              <Box>
                <Typography fontWeight={950}>Documentos importantes para todos</Typography>
                <Typography variant="body2" color="text.secondary">
                  Accesos rápidos a manuales, formatos y material clave del retiro.
                </Typography>
              </Box>
            </Stack>
            <Button variant="outlined" size="small" onClick={() => window.location.assign('/documentos')}>
              Ver biblioteca completa
            </Button>
          </Stack>

          <Grid container spacing={1}>
            {documentosImportantes.slice(0, 6).map((documento) => (
              <Grid key={documento.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: 2.5,
                    height: '100%',
                    bgcolor: 'rgba(255,255,255,.8)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Box minWidth={0}>
                      <Typography variant="body2" fontWeight={900} noWrap>{documento.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {documento.temaNombre ? `Tema: ${documento.temaNombre}` : documento.categoria}
                      </Typography>
                    </Box>
                    {puedeDescargarDocumentos && (
                      <IconButton
                        size="small"
                        aria-label={`Abrir ${documento.nombre}`}
                        onClick={async () => {
                          const datosDocumento = await obtenerUrlDescargaDocumento(token, documento.id);
                          window.open(datosDocumento.url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <OpenInNewRounded fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Paper sx={{ ...panelSx, overflow: 'hidden' }}>
        <Grid container>
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2.1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.8}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tareas.length ? 'warning.main' : 'success.main', boxShadow: tareas.length ? '0 0 0 5px rgba(237,108,2,.10)' : '0 0 0 5px rgba(46,125,50,.10)' }} />
                <Typography variant="overline" color="text.secondary" fontWeight={900}>ESTADO OPERATIVO</Typography>
              </Stack>
              <Typography variant="h4" fontWeight={900} lineHeight={1.15}>{tareas.length ? `${tareas.length} asuntos requieren atención` : 'La operación está bajo control'}</Typography>
              <Stack direction="row" spacing={2.2} useFlexGap flexWrap="wrap" mt={1.4}>
                <Typography variant="body2"><Box component="span" fontWeight={900} color={criticas ? 'error.main' : 'success.main'}>{criticas}</Box> críticas</Typography>
                <Typography variant="body2"><Box component="span" fontWeight={900} color="warning.main">{advertencias}</Box> advertencias</Typography>
                <Typography variant="body2"><Box component="span" fontWeight={900}>{pagosPorValidar}</Box> pagos por validar</Typography>
              </Stack>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Box onClick={() => setFechasOpen(true)} role="button" tabIndex={0} sx={{ px: 2.2, py: 1.8, height: '100%', cursor: 'pointer', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="overline" color="primary" fontWeight={900}>PRÓXIMO HITO</Typography>
                <CalendarMonthRounded color="primary" fontSize="small" />
              </Stack>
              <CuentaRegresiva item={proxima} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ ...panelSx, overflow: 'hidden' }}>
        <Grid container columns={{ xs: 1, sm: 2, lg: puedeVerAspirantes ? 5 : 4 }}>
          <Grid size={1}><MiniMetrica icono={<GroupsRounded fontSize="small" />} etiqueta="Caminantes" valor={caminantes.total || 0} /></Grid>
          <Grid size={1}><MiniMetrica icono={<GroupsRounded fontSize="small" />} etiqueta="Servidores" valor={servidores.total || 0} /></Grid>
          {puedeVerAspirantes && <Grid size={1}><MiniMetrica icono={<PersonAddAltRounded fontSize="small" />} etiqueta="Aspirantes pendientes" valor={aspirantesPendientes} alerta={aspirantesPendientes > 0} /></Grid>}
          <Grid size={1}><MiniMetrica icono={<TableRestaurantRounded fontSize="small" />} etiqueta="Mesas completas" valor={`${mesas.mesasCompletas || 0}/${mesas.totalMesas || 0}`} alerta={(mesas.mesasIncompletas || 0) > 0} /></Grid>
          <Grid size={1}><MiniMetrica icono={<PaymentsRounded fontSize="small" />} etiqueta="Pendiente por recaudar" valor={moneda(financiero.valorPendiente)} alerta={(financiero.valorPendiente || 0) > 0} /></Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <TarjetaOperacion titulo="Prioridades" icono={<TaskAltRounded fontSize="small" />} accent="warning.main">
            <Stack>{tareas.slice(0, 8).map(t => <FilaEstado key={t} icono={<WarningAmberRounded fontSize="small" />} texto={t} valor="Pendiente" alerta />)}{!tareas.length && <Alert severity="success">No hay pendientes operativos importantes.</Alert>}</Stack>
          </TarjetaOperacion>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <TarjetaOperacion titulo="Tesorería" icono={<PaymentsRounded fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}><Dato valor={moneda(financiero.valorEsperado)} etiqueta="Esperado" /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><Dato valor={moneda(financiero.valorRecaudado)} etiqueta="Recibido" color="success.main" /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><Dato valor={moneda(financiero.valorPendiente)} etiqueta="Pendiente" color="warning.main" /></Grid>
            </Grid>
            <Box mt={1.5}>
              <FilaEstado icono={<PersonRounded fontSize="small" />} texto="Caminantes" valor={`${moneda(financiero.caminantes?.valorRecaudado)} de ${moneda(financiero.caminantes?.valorEsperado)}`} />
              <FilaEstado icono={<GroupsRounded fontSize="small" />} texto="Servidores" valor={`${moneda(financiero.servidores?.valorRecaudado)} de ${moneda(financiero.servidores?.valorEsperado)}`} />
            </Box>
          </TarjetaOperacion>
        </Grid>
      </Grid>

      {puedeVerBandejaLogistica && pendientesLogistica.length > 0 && (
        <Paper sx={{ ...panelSx, px: 2, py: 1.4, borderLeft: '3px solid', borderLeftColor: 'warning.main' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Inventory2Rounded color="warning" fontSize="small" />
              <Box><Typography fontWeight={900}>Aprobaciones de Logística</Typography><Typography variant="caption" color="text.secondary">{pendientesLogistica.length} caminantes con entregables por aprobar</Typography></Box>
            </Stack>
            <Button size="small" variant="contained" startIcon={<TaskAltRounded />} onClick={() => setLogisticaOpen(true)}>Revisar bandeja</Button>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <TarjetaOperacion titulo="Personas" icono={<GroupsRounded fontSize="small" />}>
            <FilaEstado icono={<TableRestaurantRounded fontSize="small" />} texto="Caminantes sin mesa" valor={caminantes.sinMesa || 0} alerta={(caminantes.sinMesa || 0) > 0} />
            <FilaEstado icono={<GroupsRounded fontSize="small" />} texto="Servidores sin equipo" valor={servidores.sinEquipo || 0} alerta={(servidores.sinEquipo || 0) > 0} />
            <FilaEstado icono={<HotelRounded fontSize="small" />} texto="Sin habitación" valor={(caminantes.sinHabitacion || 0) + (servidores.sinHabitacion || 0)} alerta={((caminantes.sinHabitacion || 0) + (servidores.sinHabitacion || 0)) > 0} />
          </TarjetaOperacion>
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <TarjetaOperacion titulo="Mesas y entregables" icono={<TableRestaurantRounded fontSize="small" />}>
            <FilaEstado icono={<WarningAmberRounded fontSize="small" />} texto="Mesas incompletas" valor={mesas.mesasIncompletas || 0} alerta={(mesas.mesasIncompletas || 0) > 0} />
            <FilaEstado icono={<MailRounded fontSize="small" />} texto="Cartas pendientes" valor={mesas.cartasPendientes || 0} alerta={(mesas.cartasPendientes || 0) > 0} />
            <FilaEstado icono={<PhotoRounded fontSize="small" />} texto="Fotografías pendientes" valor={mesas.fotosPendientes || 0} alerta={(mesas.fotosPendientes || 0) > 0} />
          </TarjetaOperacion>
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <TarjetaOperacion titulo="Alojamiento" icono={<HotelRounded fontSize="small" />}>
            <FilaEstado icono={<HotelRounded fontSize="small" />} texto="Habitaciones ocupadas" valor={habitaciones.ocupadas || 0} />
            <FilaEstado icono={<ReportProblemRounded fontSize="small" />} texto="Conflictos" valor={habitaciones.conConflicto || 0} alerta={(habitaciones.conConflicto || 0) > 0} />
            <FilaEstado icono={<PersonRounded fontSize="small" />} texto="Personas sin habitación" valor={(caminantes.sinHabitacion || 0) + (servidores.sinHabitacion || 0)} alerta={((caminantes.sinHabitacion || 0) + (servidores.sinHabitacion || 0)) > 0} />
          </TarjetaOperacion>
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <TarjetaOperacion titulo="Audiovisuales" icono={<SlideshowRounded fontSize="small" />}>
            <FilaEstado icono={<SlideshowRounded fontSize="small" />} texto="Sin entregar" valor={(presentaciones.totalPresentaciones || 0) - (presentaciones.entregadas || 0)} alerta={(presentaciones.totalPresentaciones || 0) > (presentaciones.entregadas || 0)} />
            <FilaEstado icono={<TaskAltRounded fontSize="small" />} texto="Pendientes de ajuste" valor={(presentaciones.totalPresentaciones || 0) - (presentaciones.ajustadas || 0)} alerta={(presentaciones.totalPresentaciones || 0) > (presentaciones.ajustadas || 0)} />
            <FilaEstado icono={<TaskAltRounded fontSize="small" />} texto="Sin aprobar" valor={(presentaciones.totalPresentaciones || 0) - (presentaciones.aprobadas || 0)} alerta={(presentaciones.totalPresentaciones || 0) > (presentaciones.aprobadas || 0)} />
          </TarjetaOperacion>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TarjetaOperacion titulo="Radar de alertas" icono={<ReportProblemRounded fontSize="small" />} accent="error.main">
            <Grid container spacing={1}>{alertas.slice(0, 8).map((a, i) => <Grid key={`${a.modulo}-${i}`} size={{ xs: 12, md: 6 }}><Alert severity={a.tipo} variant="outlined" sx={{ borderRadius: 1.5, py: .25, height: '100%' }}><Typography variant="caption" fontWeight={900}>{a.modulo}</Typography><Typography variant="body2">{a.mensaje}</Typography></Alert></Grid>)}{!alertas.length && <Grid size={{ xs: 12 }}><Alert severity="success">No hay alertas activas.</Alert></Grid>}</Grid>
          </TarjetaOperacion>
        </Grid>
      </Grid>

      <ModalAprobacionesLogistica open={logisticaOpen} onClose={()=>setLogisticaOpen(false)} items={pendientesLogistica} procesando={procesandoLogistica} onAprobar={aprobarPendienteLogistica} />
      <ModalFechas open={fechasOpen} onClose={()=>setFechasOpen(false)} fechas={fechas}/>
    </Stack>
  );
}
