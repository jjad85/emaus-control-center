import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton,
  Button, Paper, Stack, Typography,
} from '@mui/material';
import {
  CalendarMonthRounded, CloseRounded, GroupsRounded, HotelRounded,
  MailRounded, PaymentsRounded, PersonRounded, PhotoRounded,
  ReportProblemRounded, SlideshowRounded, TableRestaurantRounded,
  TaskAltRounded, WarningAmberRounded, DescriptionRounded, OpenInNewRounded,
} from '@mui/icons-material';

import { obtenerDashboard } from '../api/dashboardApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { obtenerDocumentos, obtenerUrlDescargaDocumento } from '../api/documentosApi';

const panelSx = {
  border: '1px solid', borderColor: 'divider', borderRadius: 4,
  bgcolor: 'background.paper', boxShadow: '0 12px 34px rgba(18,73,44,.07)',
};

const moneda = (v) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(v || 0));

function CuentaRegresiva({ item }) {
  if (!item) return <Typography color="text.secondary">No hay fechas configuradas.</Typography>;
  const dias = Number(item.diasRestantes || 0);
  const texto = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`;
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ minWidth: 76, p: 1.2, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'center' }}>
        <Typography fontWeight={950} fontSize={dias > 1 ? 28 : 18} lineHeight={1}>{dias > 1 ? dias : texto}</Typography>
        {dias > 1 && <Typography variant="caption" fontWeight={800}>días</Typography>}
      </Box>
      <Box minWidth={0}>
        <Typography fontWeight={900}>{item.descripcion}</Typography>
        <Typography variant="body2" color="text.secondary">{item.fechaTexto}</Typography>
      </Box>
    </Stack>
  );
}

function Dato({ valor, etiqueta, color = 'text.primary' }) {
  return <Box><Typography variant="h4" fontWeight={950} color={color}>{valor}</Typography><Typography variant="body2" color="text.secondary">{etiqueta}</Typography></Box>;
}

function FilaEstado({ icono, texto, valor, alerta = false }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ py: 1.15, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      <Stack direction="row" spacing={1.1} alignItems="center" minWidth={0}>
        <Box sx={{ color: alerta ? 'warning.main' : 'primary.main', display: 'grid' }}>{icono}</Box>
        <Typography variant="body2" fontWeight={750}>{texto}</Typography>
      </Stack>
      <Typography fontWeight={950} color={alerta ? 'warning.main' : 'text.primary'}>{valor}</Typography>
    </Stack>
  );
}

function TarjetaOperacion({ titulo, icono, children, accent = 'primary.main' }) {
  return (
    <Paper sx={{ ...panelSx, p: 2.4, height: '100%', borderTop: '4px solid', borderTopColor: accent }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={950}>{titulo}</Typography>
        <Box sx={{ width: 42, height: 42, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: accent }}>{icono}</Box>
      </Stack>
      {children}
    </Paper>
  );
}

function ModalFechas({ open, onClose, fechas = [] }) {
  const futuras = useMemo(() => [...fechas].filter(x => Number(x.diasRestantes) >= 0).sort((a,b) => Number(a.diasRestantes)-Number(b.diasRestantes)), [fechas]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
      <DialogTitle sx={{ pr: 7 }}><Typography variant="h5" fontWeight={950}>Próximas fechas</Typography><Typography variant="body2" color="text.secondary">De la más próxima a la más lejana.</Typography><IconButton onClick={onClose} sx={{ position:'absolute', right:14, top:14 }}><CloseRounded /></IconButton></DialogTitle>
      <DialogContent><Stack spacing={1.4}>{futuras.map((x,i)=><Paper key={`${x.fecha}-${x.descripcion}`} variant="outlined" sx={{ p:2, borderRadius:4, borderColor:i===0?'primary.main':'divider' }}><CuentaRegresiva item={x}/></Paper>)}{!futuras.length&&<Alert severity="info">No hay fechas próximas configuradas.</Alert>}</Stack></DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { token, tienePermiso } = useAuth();
  const [fechasOpen, setFechasOpen] = useState(false);
  const [documentosImportantes, setDocumentosImportantes] = useState([]);
  const puedeVerDocumentos = tienePermiso('DOCUMENTOS_CONSULTAR');
  const puedeDescargarDocumentos = tienePermiso('DOCUMENTOS_DESCARGAR');
  const { data, loading, error, reload } = useApi(() => obtenerDashboard(), []);

  useEffect(() => {
    let activo = true;
    if (!puedeVerDocumentos || !token) { setDocumentosImportantes([]); return undefined; }
    obtenerDocumentos(token, { soloImportantes: true })
      .then(respuesta => { if (activo) setDocumentosImportantes((respuesta?.items || []).slice(0, 6)); })
      .catch(() => { if (activo) setDocumentosImportantes([]); });
    return () => { activo = false; };
  }, [token, puedeVerDocumentos]);
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
  ].filter(Boolean);

  return (
    <Stack spacing={3}>
      <PageHeader eyebrow="Centro de operaciones" title={['EMAÚS', data.configuracion?.tipoRetiro && `Retiro ${data.configuracion.tipoRetiro}`, data.configuracion?.anioRetiro].filter(Boolean).join(' - ')} subtitle="Lo importante, lo pendiente y lo próximo en una sola vista" onRefresh={reload} loading={loading} />

      <Paper sx={{ ...panelSx, p:{xs:2.5,md:3.2}, backgroundImage:'linear-gradient(135deg, rgba(46,125,50,.08), rgba(255,255,255,1) 55%)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{xs:12,md:7}}>
            <Typography variant="overline" color="primary" fontWeight={950}>ESTADO GENERAL</Typography>
            <Typography variant="h3" fontWeight={950} mt={0.5}>{tareas.length ? `${tareas.length} asuntos requieren atención` : 'La operación está bajo control'}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={2}>
              <Chip icon={<ReportProblemRounded/>} label={`${criticas} críticas`} color={criticas?'error':'success'} sx={{fontWeight:900}}/>
              <Chip icon={<WarningAmberRounded/>} label={`${advertencias} advertencias`} color="warning" variant="outlined" sx={{fontWeight:900}}/>
              <Chip icon={<PaymentsRounded/>} label={`${moneda(financiero.valorPendiente)} por recaudar`} variant="outlined" sx={{fontWeight:900}}/>
            </Stack>
          </Grid>
          <Grid size={{xs:12,md:5}}>
            <Paper onClick={()=>setFechasOpen(true)} role="button" tabIndex={0} sx={{p:2.2,borderRadius:4,border:'1px solid',borderColor:'primary.main',cursor:'pointer','&:hover':{boxShadow:'0 14px 35px rgba(46,125,50,.15)'}}}>
              <Stack direction="row" justifyContent="space-between" mb={1.5}><Typography fontWeight={950} color="primary">LO PRÓXIMO</Typography><CalendarMonthRounded color="primary"/></Stack>
              <CuentaRegresiva item={proxima}/>
              <Typography variant="caption" color="primary" fontWeight={850} display="block" mt={1.5}>Ver todas las fechas</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>


      {documentosImportantes.length > 0 && (
        <Paper sx={{ ...panelSx, p: 2.5, borderTop: '4px solid', borderTopColor: 'warning.main' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={950}>Documentos importantes</Typography>
              <Typography variant="body2" color="text.secondary">Información que debes conocer para el retiro.</Typography>
            </Box>
            <DescriptionRounded color="warning" />
          </Stack>
          <Grid container spacing={1.5}>
            {documentosImportantes.map(documento => (
              <Grid key={documento.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 3, height: '100%' }}>
                  <Typography fontWeight={900}>{documento.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.4}>
                    {documento.temaNombre ? `Tema: ${documento.temaNombre}` : documento.categoria}
                  </Typography>
                  {documento.descripcion && <Typography variant="body2" color="text.secondary" mt={1}>{documento.descripcion}</Typography>}
                  {puedeDescargarDocumentos && (
                    <Button size="small" endIcon={<OpenInNewRounded />} sx={{ mt: 1.2 }} onClick={async () => {
                      const datosDocumento = await obtenerUrlDescargaDocumento(token, documento.id);
                      window.open(datosDocumento.url, '_blank', 'noopener,noreferrer');
                    }}>Abrir</Button>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{xs:12,lg:5}}>
          <TarjetaOperacion titulo="Lo que debes resolver" icono={<TaskAltRounded/>} accent="warning.main">
            <Stack>{tareas.slice(0,8).map((t,i)=><FilaEstado key={t} icono={<WarningAmberRounded fontSize="small"/>} texto={t} valor="Pendiente" alerta/>)}{!tareas.length&&<Alert severity="success">No hay pendientes operativos importantes.</Alert>}</Stack>
          </TarjetaOperacion>
        </Grid>
        <Grid size={{xs:12,lg:7}}>
          <TarjetaOperacion titulo="Tesorería" icono={<PaymentsRounded/>}>
            <Grid container spacing={2.5}>
              <Grid size={{xs:12,sm:4}}><Dato valor={moneda(financiero.valorEsperado)} etiqueta="Esperado"/></Grid>
              <Grid size={{xs:12,sm:4}}><Dato valor={moneda(financiero.valorRecaudado)} etiqueta="Recibido" color="success.main"/></Grid>
              <Grid size={{xs:12,sm:4}}><Dato valor={moneda(financiero.valorPendiente)} etiqueta="Pendiente" color="warning.main"/></Grid>
            </Grid>
            <Grid container spacing={2} mt={1}>
              <Grid size={{xs:12,md:6}}><FilaEstado icono={<PersonRounded fontSize="small"/>} texto="Caminantes" valor={`${moneda(financiero.caminantes?.valorRecaudado)} de ${moneda(financiero.caminantes?.valorEsperado)}`}/></Grid>
              <Grid size={{xs:12,md:6}}><FilaEstado icono={<GroupsRounded fontSize="small"/>} texto="Servidores" valor={`${moneda(financiero.servidores?.valorRecaudado)} de ${moneda(financiero.servidores?.valorEsperado)}`}/></Grid>
            </Grid>
          </TarjetaOperacion>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{xs:12,md:6,lg:4}}><TarjetaOperacion titulo="Personas" icono={<GroupsRounded/>}><Grid container spacing={2}><Grid size={{xs:6}}><Dato valor={caminantes.total||0} etiqueta="Caminantes"/></Grid><Grid size={{xs:6}}><Dato valor={servidores.total||0} etiqueta="Servidores"/></Grid></Grid><Box mt={1}><FilaEstado icono={<TableRestaurantRounded fontSize="small"/>} texto="Caminantes sin mesa" valor={caminantes.sinMesa||0} alerta={(caminantes.sinMesa||0)>0}/><FilaEstado icono={<GroupsRounded fontSize="small"/>} texto="Servidores sin equipo" valor={servidores.sinEquipo||0} alerta={(servidores.sinEquipo||0)>0}/><FilaEstado icono={<HotelRounded fontSize="small"/>} texto="Personas sin habitación" valor={(caminantes.sinHabitacion||0)+(servidores.sinHabitacion||0)} alerta={((caminantes.sinHabitacion||0)+(servidores.sinHabitacion||0))>0}/></Box></TarjetaOperacion></Grid>

        <Grid size={{xs:12,md:6,lg:4}}><TarjetaOperacion titulo="Mesas y entregables" icono={<TableRestaurantRounded/>}><Grid container spacing={2}><Grid size={{xs:6}}><Dato valor={`${mesas.caminantesAsignados||0}/${mesas.capacidadTotal||0}`} etiqueta="Caminantes asignados"/></Grid><Grid size={{xs:6}}><Dato valor={mesas.mesasCompletas||0} etiqueta={`de ${mesas.totalMesas||0} mesas completas`}/></Grid></Grid><Box mt={1}><FilaEstado icono={<WarningAmberRounded fontSize="small"/>} texto="Mesas incompletas" valor={mesas.mesasIncompletas||0} alerta={(mesas.mesasIncompletas||0)>0}/><FilaEstado icono={<MailRounded fontSize="small"/>} texto="Cartas pendientes" valor={mesas.cartasPendientes||0} alerta={(mesas.cartasPendientes||0)>0}/><FilaEstado icono={<PhotoRounded fontSize="small"/>} texto="Fotografías pendientes" valor={mesas.fotosPendientes||0} alerta={(mesas.fotosPendientes||0)>0}/></Box></TarjetaOperacion></Grid>

        <Grid size={{xs:12,md:6,lg:4}}><TarjetaOperacion titulo="Alojamiento" icono={<HotelRounded/>}><Grid container spacing={2}><Grid size={{xs:6}}><Dato valor={habitaciones.ocupadas||0} etiqueta="Habitaciones ocupadas"/></Grid><Grid size={{xs:6}}><Dato valor={habitaciones.disponibles||0} etiqueta="Con cupos disponibles"/></Grid></Grid><Box mt={1}><FilaEstado icono={<HotelRounded fontSize="small"/>} texto="Habitaciones registradas" valor={habitaciones.total||0}/><FilaEstado icono={<ReportProblemRounded fontSize="small"/>} texto="Conflictos de asignación" valor={habitaciones.conConflicto||0} alerta={(habitaciones.conConflicto||0)>0}/><FilaEstado icono={<PersonRounded fontSize="small"/>} texto="Personas sin habitación" valor={(caminantes.sinHabitacion||0)+(servidores.sinHabitacion||0)} alerta={((caminantes.sinHabitacion||0)+(servidores.sinHabitacion||0))>0}/></Box></TarjetaOperacion></Grid>

        <Grid size={{xs:12,md:6,lg:4}}><TarjetaOperacion titulo="Audiovisuales" icono={<SlideshowRounded/>}><Grid container spacing={2}><Grid size={{xs:6}}><Dato valor={presentaciones.totalPresentaciones||0} etiqueta="Presentaciones"/></Grid><Grid size={{xs:6}}><Dato valor={presentaciones.aprobadas||0} etiqueta="Aprobadas" color="success.main"/></Grid></Grid><Box mt={1}><FilaEstado icono={<SlideshowRounded fontSize="small"/>} texto="Sin entregar" valor={(presentaciones.totalPresentaciones||0)-(presentaciones.entregadas||0)} alerta={(presentaciones.totalPresentaciones||0)>(presentaciones.entregadas||0)}/><FilaEstado icono={<TaskAltRounded fontSize="small"/>} texto="Pendientes de ajuste" valor={(presentaciones.totalPresentaciones||0)-(presentaciones.ajustadas||0)} alerta={(presentaciones.totalPresentaciones||0)>(presentaciones.ajustadas||0)}/><FilaEstado icono={<TaskAltRounded fontSize="small"/>} texto="Pendientes de aprobación" valor={(presentaciones.totalPresentaciones||0)-(presentaciones.aprobadas||0)} alerta={(presentaciones.totalPresentaciones||0)>(presentaciones.aprobadas||0)}/></Box></TarjetaOperacion></Grid>

        <Grid size={{xs:12,lg:8}}><TarjetaOperacion titulo="Radar de alertas" icono={<ReportProblemRounded/>} accent="error.main"><Grid container spacing={1.4}>{alertas.slice(0,10).map((a,i)=><Grid key={`${a.modulo}-${i}`} size={{xs:12,md:6}}><Alert severity={a.tipo} sx={{borderRadius:3,height:'100%'}}><Typography variant="caption" fontWeight={900}>{a.modulo}</Typography><Typography variant="body2" fontWeight={650}>{a.mensaje}</Typography></Alert></Grid>)}{!alertas.length&&<Grid size={{xs:12}}><Alert severity="success">No hay alertas activas.</Alert></Grid>}</Grid></TarjetaOperacion></Grid>
      </Grid>

      <ModalFechas open={fechasOpen} onClose={()=>setFechasOpen(false)} fechas={fechas}/>
    </Stack>
  );
}
