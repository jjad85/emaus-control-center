import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  FormControl, InputLabel, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography
} from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { obtenerCentroLogisticoApi } from '../api/centroLogisticoApi';

const ESTADOS = ['Pendiente', 'Solicitada', 'Entregada', 'Empaquetada', 'Entregada a Logística'];

function descargarCsv(nombre, encabezados, filas) {
  const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const contenido = [encabezados, ...filas].map((fila) => fila.map(escapar).join(';')).join('\n');
  const blob = new Blob(['\ufeff', contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

function Tarjeta({ titulo, valor, detalle }) {
  return <Card variant="outlined" sx={{ minWidth: 180, flex: 1 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{titulo}</Typography>
      <Typography variant="h4" fontWeight={800}>{valor}</Typography>
      {detalle && <Typography variant="caption" color="text.secondary">{detalle}</Typography>}
    </CardContent>
  </Card>;
}

function EstadoEntregable({ valor, aprobado }) {
  const completo = valor === 'Empaquetada' || (valor === 'Entregada a Logística' && aprobado);
  return <Chip size="small" label={aprobado ? `${valor} · Aprobada` : valor} color={completo ? 'success' : valor === 'Pendiente' ? 'default' : 'warning'} />;
}

export default function CentroLogistico() {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setDatos(await obtenerCentroLogisticoApi(token)); }
    catch (e) { setError(e.message || 'No fue posible consultar el Centro Logístico.'); }
    finally { setCargando(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const filas = useMemo(() => (datos?.caminantes || []).filter((item) => {
    const texto = `${item.nombre} ${item.telefono} ${item.mesa} ${item.habitacion}`.toLowerCase();
    if (busqueda && !texto.includes(busqueda.toLowerCase())) return false;
    if (filtro === 'sin-mesa') return !item.mesa;
    if (filtro === 'sin-habitacion') return !item.habitacion;
    if (filtro === 'carta-pendiente') return item.carta !== 'Empaquetada' && !(item.carta === 'Entregada a Logística' && item.cartaAprobada);
    if (filtro === 'foto-pendiente') return item.foto !== 'Empaquetada' && !(item.foto === 'Entregada a Logística' && item.fotoAprobada);
    if (filtro === 'alimentacion') return item.tieneCondicionAlimentaria === 'Sí';
    if (filtro === 'completos') return item.completo;
    return true;
  }), [datos, busqueda, filtro]);

  if (cargando) return <Stack alignItems="center" py={8}><CircularProgress /><Typography mt={2}>Consultando información logística…</Typography></Stack>;
  if (error) return <Stack spacing={2}><Alert severity="error">{error}</Alert><Button onClick={cargar}>Reintentar</Button></Stack>;

  const resumen = datos?.resumen || {};
  const avances = datos?.avances || {};
  const cartas = datos?.entregables?.cartas || {};
  const fotos = datos?.entregables?.fotos || {};

  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
      <Box><Typography variant="h4" fontWeight={800}>Centro Logístico</Typography><Typography color="text.secondary">Control operativo del retiro, sin información de pagos.</Typography></Box>
      <Button startIcon={<RefreshRounded />} variant="outlined" onClick={cargar}>Actualizar</Button>
    </Stack>

    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
      <Tarjeta titulo="Pulso logístico" valor={`${resumen.pulsoLogistico || 0}%`} detalle="Mesas, habitaciones, cartas y fotografías" />
      <Tarjeta titulo="Caminantes" valor={resumen.caminantes || 0} />
      <Tarjeta titulo="Servidores" valor={resumen.servidores || 0} />
      <Tarjeta titulo="Condiciones alimentarias" valor={datos?.alimentacion?.totalConCondicion || 0} />
    </Stack>

    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Avance logístico</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        {Object.entries({ Mesas: avances.mesas, Habitaciones: avances.habitaciones, Cartas: avances.cartas, Fotografías: avances.fotografias }).map(([nombre, valor]) => <Chip key={nombre} label={`${nombre}: ${valor || 0}%`} color={(valor || 0) === 100 ? 'success' : (valor || 0) >= 70 ? 'warning' : 'default'} />)}
      </Stack>
    </Paper>

    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      {[['Cartas', cartas], ['Fotografías', fotos]].map(([titulo, conteo]) => <Paper key={titulo} variant="outlined" sx={{ p: 2, flex: 1 }}>
        <Typography variant="h6" fontWeight={700}>{titulo}</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} mt={2}>{ESTADOS.map((estado) => <Chip key={estado} label={`${estado}: ${conteo[estado] || 0}`} />)}</Stack>
        <Stack direction="row" gap={1} mt={2}><Chip color="warning" label={`Pendientes de aprobación: ${conteo.pendientesAprobacion || 0}`} /><Chip color="success" label={`Aprobadas: ${conteo.aprobadas || 0}`} /></Stack>
      </Paper>)}
    </Stack>

    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="h6" fontWeight={700}>Habitaciones</Typography><Stack direction="row" flexWrap="wrap" gap={1} mt={2}>{Object.entries(datos?.habitaciones?.indicadores || {}).map(([k,v]) => <Chip key={k} label={`${k.replace(/([A-Z])/g,' $1')}: ${v}`} />)}</Stack></Paper>
      <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="h6" fontWeight={700}>Mesas</Typography><Stack direction="row" flexWrap="wrap" gap={1} mt={2}>{Object.entries(datos?.mesas?.indicadores || {}).map(([k,v]) => <Chip key={k} label={`${k.replace(/([A-Z])/g,' $1')}: ${v}`} />)}</Stack></Paper>
      <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="h6" fontWeight={700}>Camisas</Typography><Stack direction="row" flexWrap="wrap" gap={1} mt={2}>{(datos?.tallas || []).map((x) => <Chip key={x.talla} label={`${x.talla}: ${x.cantidad}`} />)}</Stack></Paper>
    </Stack>

    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2}>
        <Typography variant="h6" fontWeight={700}>Control por caminante</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <TextField size="small" label="Buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>Filtro</InputLabel><Select label="Filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <MenuItem value="todos">Todos</MenuItem><MenuItem value="sin-mesa">Sin mesa</MenuItem><MenuItem value="sin-habitacion">Sin habitación</MenuItem><MenuItem value="carta-pendiente">Carta pendiente</MenuItem><MenuItem value="foto-pendiente">Foto pendiente</MenuItem><MenuItem value="alimentacion">Con condición alimentaria</MenuItem><MenuItem value="completos">Completos</MenuItem>
          </Select></FormControl>
        </Stack>
      </Stack>
      <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Caminante</TableCell><TableCell>Mesa</TableCell><TableCell>Habitación</TableCell><TableCell>Carta</TableCell><TableCell>Foto</TableCell><TableCell>Alimentación</TableCell></TableRow></TableHead><TableBody>
        {filas.map((item) => <TableRow key={item.id} hover><TableCell><Typography fontWeight={700}>{item.nombre}</Typography><Typography variant="caption" color="text.secondary">{item.telefono}</Typography></TableCell><TableCell>{item.mesa || 'Sin mesa'}</TableCell><TableCell>{item.habitacion || 'Sin habitación'}</TableCell><TableCell><EstadoEntregable valor={item.carta} aprobado={item.cartaAprobada} /></TableCell><TableCell><EstadoEntregable valor={item.foto} aprobado={item.fotoAprobada} /></TableCell><TableCell>{item.tieneCondicionAlimentaria === 'Sí' ? item.detalleAlimentacion || 'Condición registrada' : '—'}</TableCell></TableRow>)}
        {!filas.length && <TableRow><TableCell colSpan={6} align="center">No hay registros para el filtro seleccionado.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
    </Paper>

    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Exportaciones</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} flexWrap="wrap">
        <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('resumen_logistico.csv', ['Caminante','Teléfono','Mesa','Habitación','Talla','Carta','Foto','Condición alimentaria','Detalle alimentación'], (datos?.caminantes || []).map(x => [x.nombre,x.telefono,x.mesa,x.habitacion,x.tallaCamiseta,x.carta,x.foto,x.tieneCondicionAlimentaria,x.detalleAlimentacion]))}>Resumen logístico</Button>
        <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('alimentacion.csv', ['Nombre','Teléfono','Mesa','Habitación','Alergias','Restricciones','Preferencias','Dieta especial'], (datos?.alimentacion?.personas || []).map(x => [x.nombre,x.telefono,x.mesa,x.habitacion,x.alergias,x.restricciones,x.preferencias,x.dietaEspecial]))}>Alimentación</Button>
        <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('habitaciones.csv', ['Habitación','Bloque','Piso','Capacidad','Ocupantes','Cupos disponibles','Estado','Conflicto'], (datos?.habitaciones?.items || []).map(x => [x.habitacion,x.bloque,x.piso,x.capacidad,x.ocupantes,x.cuposDisponibles,x.estado,x.conflictoAsignacion ? 'Sí':'No']))}>Habitaciones</Button>
        <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('mesas.csv', ['Mesa','Capacidad','Caminantes','Cupos disponibles','Ocupación','Excedida'], (datos?.mesas?.items || []).map(x => [x.numero,x.capacidad,x.cantidadCaminantes,x.cuposDisponibles,`${x.porcentajeOcupacion}%`,x.excedida ? 'Sí':'No']))}>Mesas</Button>
      </Stack>
    </Paper>
  </Stack>;
}
