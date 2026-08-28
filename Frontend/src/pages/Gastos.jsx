import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Grid, MenuItem,
  Stack, Tab, Tabs, TextField, Typography
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import UndoRounded from '@mui/icons-material/UndoRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import CreditCardRounded from '@mui/icons-material/CreditCardRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import {
  obtenerGastos, reportarGasto, validarGasto, revertirGasto
} from '../api/gastosApi';

const money = v => new Intl.NumberFormat('es-CO', {
  style:'currency', currency:'COP', maximumFractionDigits:0
}).format(Number(v||0));

const emptyForm = {
  fechaGasto: new Date().toISOString().slice(0,10),
  categoria:'', concepto:'', valor:'', metodoPago:'Transferencia',
  cruzaConEfectivo:false, personaEfectivoId:'', archivo:null
};

export default function Gastos() {
  const { token, permisos = [], sesion } = useAuth();
  const [data,setData] = useState({items:[],resumen:{},categorias:[],caja:[]});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [tab,setTab] = useState('Todos');
  const [open,setOpen] = useState(false);
  const [detalle,setDetalle] = useState(null);
  const [form,setForm] = useState(emptyForm);
  const [guardando,setGuardando] = useState(false);
  const [obs,setObs] = useState('');

  const codigosPermiso = (permisos || []).map(p =>
    String(typeof p === 'string' ? p : (p?.codigo || p?.permiso || '')).trim().toUpperCase()
  );
  const rolActual = String(sesion?.rol || sesion?.codigoRol || '').trim().toUpperCase();
  const esAdmin = rolActual === 'ADMIN';
  const puedeReportar = esAdmin || codigosPermiso.includes('GASTOS_REPORTAR');
  const puedeAprobar = esAdmin || codigosPermiso.includes('GASTOS_APROBAR');
  const puedeReversar = esAdmin || codigosPermiso.includes('GASTOS_REVERSAR');

  async function cargar() {
    try {
      setLoading(true); setError('');
      setData(await obtenerGastos(token));
    } catch(e) { setError(e.message || 'No fue posible consultar gastos.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ cargar(); },[token]);

  const items = useMemo(() => (data.items||[]).filter(x =>
    tab === 'Todos' || x.estado === tab
  ), [data,tab]);

  async function archivoBase64(file) {
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload=()=>resolve({
        nombre:file.name,tipo:file.type,tamano:file.size,base64:reader.result
      });
      reader.onerror=reject; reader.readAsDataURL(file);
    });
  }

  async function guardar() {
    try {
      setGuardando(true); setError('');
      if (!form.fechaGasto || !form.categoria || !form.concepto.trim() ||
          !Number(form.valor) || !form.archivo) {
        throw new Error('Completa fecha, categoría, concepto, valor y comprobante.');
      }
      if (form.cruzaConEfectivo && !form.personaEfectivoId) {
        throw new Error('Selecciona la persona cuyo efectivo cubrirá el gasto.');
      }
      const archivo = await archivoBase64(form.archivo);
      await reportarGasto(token,{...form,valor:Number(form.valor),archivo});
      setOpen(false); setForm(emptyForm); await cargar();
    } catch(e) { setError(e.message || 'No fue posible reportar el gasto.'); }
    finally { setGuardando(false); }
  }

  async function decidir(accion) {
    try {
      if (accion==='Rechazar' && obs.trim().length<5) {
        throw new Error('Escribe el motivo del rechazo.');
      }
      await validarGasto(token,detalle.id,{
        accion, observaciones:obs, motivo: accion==='Rechazar'?obs:''
      });
      setDetalle(null); setObs(''); await cargar();
    } catch(e) { setError(e.message || 'No fue posible validar el gasto.'); }
  }

  async function reversar() {
    try {
      if (obs.trim().length<5) throw new Error('Escribe el motivo de la reversión.');
      await revertirGasto(token,detalle.id,obs);
      setDetalle(null); setObs(''); await cargar();
    } catch(e) { setError(e.message || 'No fue posible reversar el gasto.'); }
  }

  const cajaSel = (data.caja||[]).find(x=>x.servidorId===form.personaEfectivoId);
  const esMismoReportante = detalle &&
    String(detalle.reportadoPor||'').toLowerCase() === String(sesion?.usuario||'').toLowerCase();

  return <Stack spacing={2.5}>
    <PageHeader
      title="Gastos"
      subtitle="Tesorería · registra, valida y controla los egresos del retiro"
    />

    {error && <Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}

    {!puedeReportar && <Alert severity="warning">
      Tu sesión no tiene GASTOS_REPORTAR. Ejecuta repararPermisosModuloGastos() y vuelve a iniciar sesión.
    </Alert>}

    <Box
      sx={{
        px: { xs: 2.5, md: 3.5 },
        py: { xs: 3, md: 3.6 },
        borderRadius: 5,
        overflow: 'hidden',
        position: 'relative',
        color: '#fff',
        background:
          'linear-gradient(105deg, #104a3f 0%, #176b58 48%, #2c8a73 100%)',
        boxShadow: '0 20px 44px rgba(17,72,61,.14)',
        '&:after': {
          content: '""',
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          right: -82,
          top: -155,
          background: 'rgba(255,255,255,.07)'
        }
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', lg: 'center' }}
        gap={2.5}
        position="relative"
        zIndex={1}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 950,
              letterSpacing: '.13em',
              color: '#fff'
            }}
          >
            CONTROL FINANCIERO
          </Typography>

          <Typography
            variant="h4"
            fontWeight={950}
            sx={{ mt: .25, mb: .65 }}
          >
            Controla cada salida de dinero del retiro
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,.92)',
              maxWidth: 760
            }}
          >
            Reporta gastos con comprobante, valida los movimientos y mantén
            cuadrado el efectivo que está en poder de los servidores.
          </Typography>
        </Box>

        {puedeReportar && (
          <Button
            size="large"
            variant="contained"
            startIcon={<AddRounded />}
            onClick={()=>setOpen(true)}
            sx={{
              borderRadius: 99,
              px: 3,
              py: 1.2,
              fontWeight: 950,
              bgcolor: '#fff',
              color: '#104a3f',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#f6fbf9',
                boxShadow: 'none'
              }
            }}
          >
            Reportar gasto
          </Button>
        )}
      </Stack>
    </Box>

    <Box
      display="grid"
      gridTemplateColumns={{
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        xl: 'repeat(4, 1fr)'
      }}
      gap={1.5}
    >
      <Kpi
        icon={<PendingActionsRounded />}
        t="Por validar"
        v={data.resumen?.pendientes || 0}
        s={money(data.resumen?.valorPendiente || 0)}
        color="#b97708"
        fondo="#fff8e8"
      />
      <Kpi
        icon={<PaymentsRounded />}
        t="Gastos aprobados"
        v={money(data.resumen?.totalAprobado)}
        s="Egresos validados"
        color="#176b58"
        fondo="#edf8f3"
      />
      <Kpi
        icon={<AccountBalanceWalletRounded />}
        t="Cruce con efectivo"
        v={money(data.resumen?.totalEfectivo)}
        s="Descontado de caja"
        color="#176b58"
        fondo="#edf8f3"
      />
      <Kpi
        icon={<CreditCardRounded />}
        t="Transferencias"
        v={money(data.resumen?.totalTransferencia)}
        s="Pagos electrónicos"
        color="#315f78"
        fondo="#eef6fa"
      />
    </Box>

    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        boxShadow: '0 14px 34px rgba(17,48,41,.045)'
      }}
    >
      <Typography
        variant="overline"
        sx={{
          fontWeight: 950,
          letterSpacing: '.12em',
          color: '#176b58'
        }}
      >
        CONTROL DE EGRESOS APROBADOS
      </Typography>

      <Typography variant="h6" fontWeight={950} sx={{ mt: .3 }}>
        ¿Cómo se están pagando los gastos?
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.2 }}>
        Solo se contabilizan los gastos aprobados. Los que cruzan con efectivo
        reducen automáticamente el dinero disponible del servidor responsable.
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          md: 'repeat(3, 1fr)'
        }}
        gap={1.5}
      >
        <ResumenMedio
          icon={<PaymentsRounded />}
          titulo="Total aprobado"
          valor={money(data.resumen?.totalAprobado)}
          detalle="Todos los egresos validados"
          color="#176b58"
          fondo="#edf8f3"
        />
        <ResumenMedio
          icon={<AccountBalanceWalletRounded />}
          titulo="Efectivo"
          valor={money(data.resumen?.totalEfectivo)}
          detalle="Gastos descontados de caja"
          color="#8a5b12"
          fondo="#fff8e8"
        />
        <ResumenMedio
          icon={<CreditCardRounded />}
          titulo="Transferencias"
          valor={money(data.resumen?.totalTransferencia)}
          detalle="Pagos electrónicos aprobados"
          color="#315f78"
          fondo="#eef6fa"
        />
      </Box>
    </Box>

    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        boxShadow: '0 14px 34px rgba(17,48,41,.045)'
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={1}
        mb={2}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 950,
              letterSpacing: '.12em',
              color: '#8a5b12'
            }}
          >
            CAJA
          </Typography>
          <Typography variant="h6" fontWeight={950}>
            Efectivo en poder de servidores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pagos recibidos en efectivo menos gastos aprobados que se cruzan contra caja.
          </Typography>
        </Box>

        <Typography
          variant="h5"
          fontWeight={950}
          color="#176b58"
        >
          {money(
            (data.caja || []).reduce(
              (total, x) => total + Number(x.disponible || 0),
              0
            )
          )}
        </Typography>
      </Stack>

      {(data.caja || []).length ? (
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(3, 1fr)'
          }}
          gap={1.25}
        >
          {(data.caja || []).map(x => (
            <Box
              key={x.servidorId}
              sx={{
                p: 1.6,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'rgba(20,75,62,.10)',
                bgcolor: 'rgba(23,107,88,.025)'
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                gap={1}
              >
                <Box>
                  <Typography fontWeight={950}>{x.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recibido {money(x.recibido)}
                  </Typography>
                </Box>

                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    DISPONIBLE
                  </Typography>
                  <Typography fontWeight={950} color="#176b58">
                    {money(x.disponible)}
                  </Typography>
                </Box>
              </Stack>

              {Number(x.gastos || 0) > 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: .8,
                    color: 'error.main',
                    fontWeight: 850
                  }}
                >
                  -{money(x.gastos)} en gastos aprobados
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            py: 3.5,
            px: 2,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'rgba(17,48,41,.018)'
          }}
        >
          <AccountBalanceWalletRounded
            sx={{ fontSize: 42, color: 'text.disabled' }}
          />
          <Typography fontWeight={900} mt={.5}>
            No hay efectivo distribuido actualmente
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cuando existan pagos aprobados en efectivo, aparecerán aquí.
          </Typography>
        </Box>
      )}
    </Box>

    <Box
      sx={{
        borderRadius: 5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        overflow: 'hidden',
        boxShadow: '0 14px 34px rgba(17,48,41,.045)'
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, md: 2.25 },
          pt: 1
        }}
      >
        <Tabs
          value={tab}
          onChange={(_,v)=>setTab(v)}
          variant="scrollable"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 850,
              minHeight: 54
            }
          }}
        >
          {['Todos','Pendiente','Aprobado','Rechazado','Reversado'].map(x=>
            <Tab key={x} value={x} label={x}/>)}
        </Tabs>
      </Box>

      <Divider />

      <Stack
        spacing={1.2}
        sx={{
          p: { xs: 1.5, md: 2.25 },
          bgcolor: 'rgba(17,48,41,.018)'
        }}
      >
        {items.map(g=><Card
          variant="outlined"
          key={g.id}
          sx={{
            cursor:'pointer',
            borderRadius:3.5,
            borderColor:'rgba(20,75,62,.10)',
            transition:'all .18s ease',
            '&:hover':{
              transform:'translateY(-2px)',
              boxShadow:'0 12px 28px rgba(20,55,50,.08)',
              borderColor:'rgba(23,107,88,.22)'
            }
          }}
          onClick={()=>{setDetalle(g);setObs('');}}
        >
          <CardContent>
            <Stack
              direction={{xs:'column',md:'row'}}
              justifyContent="space-between"
              gap={1.5}
            >
              <Box>
                <Stack
                  direction="row"
                  gap={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography fontWeight={950}>
                    {g.concepto}
                  </Typography>
                  <StatusChip value={g.estado}/>
                  <Chip
                    size="small"
                    label={g.id}
                    variant="outlined"
                    sx={{ fontWeight: 750 }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: .5 }}
                >
                  {g.categoria} · {g.fechaGasto} · Reportó: {g.reportadoPorNombre}
                </Typography>

                {g.cruzaConEfectivo && (
                  <Typography
                    variant="body2"
                    sx={{ mt: .35, color: '#8a5b12', fontWeight: 750 }}
                  >
                    Se cruza con efectivo de {g.personaEfectivoNombre}
                  </Typography>
                )}
              </Box>

              <Stack
                alignItems={{ xs:'flex-start', md:'flex-end' }}
                gap={.6}
              >
                <Typography variant="h6" fontWeight={950}>
                  {money(g.valor)}
                </Typography>

                <Button
                  size="small"
                  startIcon={<VisibilityRounded/>}
                  onClick={(e)=>{
                    e.stopPropagation();
                    setDetalle(g);
                    setObs('');
                  }}
                >
                  Ver detalle
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>)}

        {!loading && !items.length && (
          <Box
            sx={{
              textAlign:'center',
              py:6,
              borderRadius:4
            }}
          >
            <ReceiptLongRounded sx={{fontSize:50,opacity:.25}}/>
            <Typography fontWeight={900} mt={1}>
              Aún no hay gastos en esta vista
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Los gastos reportados aparecerán aquí para validación y seguimiento.
            </Typography>
            {puedeReportar && (
              <Button
                variant="contained"
                startIcon={<AddRounded/>}
                onClick={()=>setOpen(true)}
                sx={{ borderRadius: 99, px: 2.5, fontWeight: 900 }}
              >
                Reportar primer gasto
              </Button>
            )}
          </Box>
        )}
      </Stack>
    </Box>

    <Dialog open={open} onClose={()=>!guardando&&setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Reportar gasto</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField type="date" label="Fecha del gasto" InputLabelProps={{shrink:true}}
            value={form.fechaGasto} onChange={e=>setForm({...form,fechaGasto:e.target.value})} required/>
          <TextField select label="Categoría" value={form.categoria}
            onChange={e=>setForm({...form,categoria:e.target.value})} required>
            {(data.categorias||[]).map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}
          </TextField>
          <TextField label="Concepto / descripción" multiline minRows={2} value={form.concepto}
            onChange={e=>setForm({...form,concepto:e.target.value})} required/>
          <TextField label="Valor" type="number" value={form.valor}
            onChange={e=>setForm({...form,valor:e.target.value})} required
            helperText={form.valor ? money(form.valor) : 'Ingrese el valor total del gasto'}/>
          <TextField select label="Método de pago" value={form.metodoPago}
            onChange={e=>setForm({...form,metodoPago:e.target.value})}>
            {['Efectivo','Transferencia','Otro'].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}
          </TextField>
          <TextField select label="¿Cruzar contra el efectivo controlado por Tesorería?"
            value={form.cruzaConEfectivo?'Sí':'No'}
            onChange={e=>setForm({...form,cruzaConEfectivo:e.target.value==='Sí',personaEfectivoId:''})}>
            <MenuItem value="No">No</MenuItem><MenuItem value="Sí">Sí</MenuItem>
          </TextField>
          {form.cruzaConEfectivo && <>
            <Autocomplete options={data.caja||[]} getOptionLabel={x=>`${x.nombre} · Disponible ${money(x.disponible)}`}
              onChange={(_,x)=>setForm({...form,personaEfectivoId:x?.servidorId||''})}
              renderInput={params=><TextField {...params} label="Persona que tiene el efectivo" required/>}/>
            {cajaSel && <Alert severity={Number(form.valor)>cajaSel.disponible?'error':'info'}>
              Disponible: <b>{money(cajaSel.disponible)}</b> · Después de aprobar:
              <b> {money(cajaSel.disponible-Number(form.valor||0))}</b>
            </Alert>}
          </>}
          <Button variant="outlined" component="label" startIcon={<ReceiptLongRounded/>}>
            {form.archivo ? form.archivo.name : 'Adjuntar comprobante o factura *'}
            <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={e=>setForm({...form,archivo:e.target.files?.[0]||null})}/>
          </Button>
          <Typography variant="caption" color="text.secondary">PDF/JPG/PNG · máximo 10 MB.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setOpen(false)}>Cancelar</Button>
        <Button variant="contained" disabled={guardando} onClick={guardar}>
          {guardando?'Guardando...':'Reportar gasto'}
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(detalle)} onClose={()=>setDetalle(null)} fullWidth maxWidth="sm">
      {detalle && <>
        <DialogTitle>{detalle.id} · Detalle del gasto</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4}>
            <StatusChip value={detalle.estado}/>
            <Dato l="Concepto" v={detalle.concepto}/>
            <Dato l="Categoría" v={detalle.categoria}/>
            <Dato l="Valor" v={money(detalle.valor)}/>
            <Dato l="Método" v={detalle.metodoPago}/>
            <Dato l="Reportado por" v={detalle.reportadoPorNombre}/>
            {detalle.cruzaConEfectivo && <Dato l="Se descuenta del efectivo de" v={detalle.personaEfectivoNombre}/>}
            {detalle.comprobanteUrl &&
              <Button href={detalle.comprobanteUrl} target="_blank" variant="outlined">Ver comprobante / factura</Button>}
            <Divider/>
            {esMismoReportante && detalle.estado==='Pendiente' &&
              <Alert severity="warning">Reportaste este gasto. Por segregación de funciones, debe validarlo otro usuario autorizado.</Alert>}
            {(detalle.estado==='Pendiente' || detalle.estado==='Aprobado') &&
              <TextField label={detalle.estado==='Aprobado'?'Motivo de reversión':'Observaciones / motivo de rechazo'}
                multiline minRows={2} value={obs} onChange={e=>setObs(e.target.value)}/>}
            {detalle.motivoRechazo && <Dato l="Motivo rechazo" v={detalle.motivoRechazo}/>}
            {detalle.motivoReversion && <Dato l="Motivo reversión" v={detalle.motivoReversion}/>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDetalle(null)}>Cerrar</Button>
          {detalle.estado==='Pendiente' && puedeAprobar && !esMismoReportante && <>
            <Button color="error" onClick={()=>decidir('Rechazar')}>Rechazar</Button>
            <Button variant="contained" startIcon={<CheckCircleRounded/>} onClick={()=>decidir('Aprobar')}>Aprobar</Button>
          </>}
          {detalle.estado==='Aprobado' && puedeReversar &&
            <Button color="error" startIcon={<UndoRounded/>} onClick={reversar}>Reversar</Button>}
        </DialogActions>
      </>}
    </Dialog>
  </Stack>
}

function Kpi({icon,t,v,s,color='#176b58',fondo='#edf8f3'}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 99,
        border: '1px solid',
        borderColor: 'rgba(20,75,62,.10)',
        bgcolor: '#fff',
        minHeight: 108,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 8px 22px rgba(17,48,41,.035)'
      }}
    >
      <Stack direction="row" spacing={1.4} alignItems="center" width="100%">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            bgcolor: fondo,
            color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}
        >
          {icon}
        </Box>

        <Box minWidth={0}>
          <Typography variant="h5" fontWeight={950} color={color}>
            {v}
          </Typography>
          <Typography fontWeight={900}>{t}</Typography>
          <Typography variant="caption" color="text.secondary">
            {s}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ResumenMedio({icon,titulo,valor,detalle,color,fondo}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 99,
        border: '1px solid',
        borderColor: 'rgba(20,75,62,.10)',
        bgcolor: '#fff'
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: fondo,
            color,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={950} color={color}>
            {valor}
          </Typography>
          <Typography fontWeight={900}>{titulo}</Typography>
          <Typography variant="caption" color="text.secondary">
            {detalle}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function Dato({l,v}) {
  return <Box><Typography variant="caption" color="text.secondary">{l}</Typography>
    <Typography fontWeight={750}>{v||'—'}</Typography></Box>;
}
