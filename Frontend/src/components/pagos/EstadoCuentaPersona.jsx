import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, LinearProgress, MenuItem,
  Stack, TextField, Typography,
} from '@mui/material';
import {
  AccountBalanceWalletRounded, CheckCircleRounded, HourglassTopRounded,
  OpenInNewRounded, PaymentsRounded, ReceiptLongRounded,
  StorefrontRounded,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { obtenerEstadoCuentaPersona } from '../../api/pagosApi';
import StatusChip from '../StatusChip';

const moneda = (v) => Number(v || 0).toLocaleString('es-CO', {style:'currency',currency:'COP',maximumFractionDigits:0});
function fechaHora(v){ if(!v)return 'No informada'; const f=new Date(v); return Number.isNaN(f.getTime())?String(v):new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(f);}
function fecha(v){ if(!v)return 'No informada'; const f=new Date(v); return Number.isNaN(f.getTime())?String(v):new Intl.DateTimeFormat('es-CO',{dateStyle:'medium'}).format(f);}
function Dato({etiqueta,valor,ancho=6}){ if(valor===undefined||valor===null||String(valor).trim()==='')return null; return <Grid size={{xs:12,sm:ancho}}><Typography variant="caption" color="text.secondary">{etiqueta}</Typography><Typography fontWeight={750} sx={{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}}>{String(valor)}</Typography></Grid>;}
function Resumen({titulo,valor}){return <Box sx={{p:1.4,border:1,borderColor:'divider',borderRadius:3,height:'100%'}}><Typography variant="caption" color="text.secondary">{titulo}</Typography><Typography fontWeight={900}>{valor}</Typography></Box>;}
function Seccion({titulo,children}){return <Card variant="outlined"><CardContent><Typography fontWeight={850} sx={{mb:1.4}}>{titulo}</Typography><Grid container spacing={1.5}>{children}</Grid></CardContent></Card>;}

export default function EstadoCuentaPersona({token,tipoPersona,personaId}){
  const [data,setData]=useState(null),[cargando,setCargando]=useState(false),[error,setError]=useState(''),[filtro,setFiltro]=useState('Todos'),[detalle,setDetalle]=useState(null);
  useEffect(()=>{let vivo=true; (async()=>{if(!token||!personaId)return; try{setCargando(true);setError('');const d=await obtenerEstadoCuentaPersona(token,tipoPersona,personaId);if(vivo)setData(d);}catch(e){if(vivo)setError(e?.message||'No fue posible consultar el estado de cuenta.');}finally{if(vivo)setCargando(false);}})(); return()=>{vivo=false};},[token,tipoPersona,personaId]);
  const pagos=useMemo(()=>{const x=data?.pagos||[];return filtro==='Todos'?x:x.filter(p=>String(p.estado||'Pendiente')===filtro)},[data,filtro]);
  const avance=data?.exentoPago?100:(Number(data?.valorRetiro)>0?Math.min(100,(Number(data?.totalAprobado||0)/Number(data.valorRetiro))*100):0);
  if(cargando)return <Alert severity="info">Consultando estado de cuenta…</Alert>;
  if(error)return <Alert severity="error">{error}</Alert>;
  if(!data)return null;
  return <>
    <Stack spacing={2}>
      {data.exentoPago&&<Alert severity="success">Esta persona está exenta de pago.{data.motivoExencionPago?` Motivo: ${data.motivoExencionPago}`:''}</Alert>}
      <Grid container spacing={1.2}>
        <Grid size={{xs:6,md:3}}><Resumen titulo="Valor retiro" valor={moneda(data.valorRetiro)}/></Grid>
        <Grid size={{xs:6,md:3}}><Resumen titulo="Aprobado" valor={moneda(data.totalAprobado)}/></Grid>
        <Grid size={{xs:6,md:3}}><Resumen titulo="Pendiente validar" valor={moneda(data.totalPendienteValidacion)}/></Grid>
        <Grid size={{xs:6,md:3}}><Resumen titulo="Saldo" valor={moneda(data.saldoPendiente)}/></Grid>
      </Grid>
      {!data.exentoPago&&<Box><Stack direction="row" justifyContent="space-between"><Typography variant="caption">Avance de pago</Typography><Typography variant="caption" fontWeight={900}>{Math.round(avance)}%</Typography></Stack><LinearProgress variant="determinate" value={avance} sx={{mt:.6,height:8,borderRadius:99,'& .MuiLinearProgress-bar':{borderRadius:99}}}/></Box>}
      <Divider/>
      <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" gap={1}>
        <Box><Typography fontWeight={900}>Historial de abonos</Typography><Typography variant="body2" color="text.secondary">{data.cantidadPagos||0} movimientos registrados</Typography></Box>
        <TextField select size="small" label="Estado" value={filtro} onChange={e=>setFiltro(e.target.value)} sx={{minWidth:170}}>{['Todos','Aprobado','Pendiente','Rechazado'].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
      </Stack>
      {!pagos.length?<Alert severity="info">No hay movimientos para este filtro.</Alert>:<Stack spacing={1}>{pagos.map(p=>{const efectivo=String(p.medioPago||'').toLowerCase()==='efectivo';return <Card key={p.id} variant="outlined" sx={{borderRadius:3}}><CardContent><Stack direction={{xs:'column',md:'row'}} justifyContent="space-between" gap={1.2}><Box><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap><Typography variant="h6" fontWeight={900}>{moneda(p.valorReportado)}</Typography><StatusChip value={p.estado||'Pendiente'}/><Chip size="small" icon={efectivo?<StorefrontRounded/>:<AccountBalanceWalletRounded/>} label={p.medioPago||'Sin método'} variant="outlined"/></Stack><Typography variant="body2" color="text.secondary" mt={.5}>Pago: {fecha(p.fechaPago)} · Reportado: {fechaHora(p.fechaRegistro)}</Typography><Typography variant="body2" mt={.6}><strong>{efectivo?'Recibió:':'Pagó:'}</strong> {p.nombrePagador||'No informado'}</Typography>{p.estado==='Aprobado'&&<Typography variant="body2" color="success.main" fontWeight={750}>Aprobado: {moneda(p.valorAprobado??p.valorReportado)}</Typography>}</Box><Button variant="outlined" startIcon={<ReceiptLongRounded/>} onClick={()=>setDetalle(p)}>Ver detalle</Button></Stack></CardContent></Card>})}</Stack>}
    </Stack>
    <Dialog open={Boolean(detalle)} onClose={()=>setDetalle(null)} fullWidth maxWidth="md">
      <DialogTitle><Typography variant="h6" fontWeight={900}>Detalle del abono</Typography><Typography variant="body2" color="text.secondary">Trazabilidad completa del movimiento</Typography></DialogTitle>
      <DialogContent dividers>{detalle&&<Stack spacing={2}>
        <Card variant="outlined"><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="caption">VALOR REPORTADO</Typography><Typography variant="h4" fontWeight={950}>{moneda(detalle.valorReportado)}</Typography></Box><Box><StatusChip value={detalle.estado||'Pendiente'}/>{detalle.estado==='Aprobado'&&<Typography mt={.7} color="success.main" fontWeight={800}>{moneda(detalle.valorAprobado??detalle.valorReportado)}</Typography>}</Box></Stack></CardContent></Card>
        <Seccion titulo="Información del pago"><Dato etiqueta="Fecha del pago" valor={fecha(detalle.fechaPago)}/><Dato etiqueta="Método" valor={detalle.medioPago}/><Dato etiqueta="Banco / entidad" valor={detalle.entidadPago}/><Dato etiqueta="Referencia" valor={detalle.referenciaPago}/><Dato etiqueta={String(detalle.medioPago||'').toLowerCase()==='efectivo'?'Nombre de quien recibió el dinero':'Nombre de quien pagó'} valor={detalle.nombrePagador}/><Dato etiqueta={String(detalle.medioPago||'').toLowerCase()==='efectivo'?'Teléfono de la persona que tiene el dinero':'Teléfono de quien pagó'} valor={detalle.telefonoPagador}/></Seccion>
        <Seccion titulo="Registro y validación"><Dato etiqueta="Fecha del reporte" valor={fechaHora(detalle.fechaRegistro)}/><Dato etiqueta="Origen del reporte" valor={detalle.origenReporte}/><Dato etiqueta="Fecha de validación" valor={fechaHora(detalle.fechaValidacion)}/><Dato etiqueta="Validado por" valor={detalle.validadoPor}/></Seccion>
        {(detalle.observacionesReportante||detalle.observacionesTesoreria||detalle.motivoModificacionValor)&&<Seccion titulo="Observaciones"><Dato ancho={12} etiqueta="Quien reportó" valor={detalle.observacionesReportante}/><Dato ancho={12} etiqueta="Tesorería" valor={detalle.observacionesTesoreria}/><Dato ancho={12} etiqueta="Motivo de ajuste" valor={detalle.motivoModificacionValor}/></Seccion>}
        {detalle.comprobanteUrl&&<Card variant="outlined"><CardContent><Typography fontWeight={850}>Comprobante</Typography><Typography variant="body2" color="text.secondary" mb={1}>{detalle.comprobanteNombre||'Archivo adjunto'}</Typography><Button component="a" href={detalle.comprobanteUrl} target="_blank" variant="outlined" startIcon={<OpenInNewRounded/>}>Abrir comprobante</Button>{detalle.comprobanteDescargaUrl&&<Button component="a" href={detalle.comprobanteDescargaUrl} target="_blank" variant="contained" sx={{ml:1}}>Descargar</Button>}</CardContent></Card>}
      </Stack>}</DialogContent>
      <DialogActions><Button variant="contained" onClick={()=>setDetalle(null)}>Cerrar</Button></DialogActions>
    </Dialog>
  </>;
}
