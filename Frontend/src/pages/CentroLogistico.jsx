import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
  FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography
} from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import RestaurantRounded from '@mui/icons-material/RestaurantRounded';
import FactCheckRounded from '@mui/icons-material/FactCheckRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import HotelRounded from '@mui/icons-material/HotelRounded';
import CheckroomRounded from '@mui/icons-material/CheckroomRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import PhotoRounded from '@mui/icons-material/PhotoRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { obtenerCentroLogisticoApi } from '../api/centroLogisticoApi';
import PalancasLogisticaPanel from '../components/logistica/PalancasLogisticaPanel';

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

function formatearEtiqueta(texto) {
  return String(texto || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letra) => letra.toUpperCase());
}

function MetricaCompacta({ icono, etiqueta, valor, detalle, destacado = false }) {
  return (
    <Box sx={{
      minWidth: 0,
      px: 2,
      py: 1.7,
      display: 'flex',
      alignItems: 'center',
      gap: 1.3,
      borderRight: { xs: 0, md: '1px solid' },
      borderColor: 'divider',
      '&:last-of-type': { borderRight: 0 }
    }}>
      <Avatar sx={{
        width: 38,
        height: 38,
        bgcolor: destacado ? 'primary.main' : 'action.hover',
        color: destacado ? 'primary.contrastText' : 'text.secondary'
      }}>
        {icono}
      </Avatar>
      <Box minWidth={0}>
        <Typography variant="h6" fontWeight={850} lineHeight={1}>{valor}</Typography>
        <Typography variant="body2" fontWeight={700} noWrap>{etiqueta}</Typography>
        {detalle && <Typography variant="caption" color="text.secondary" noWrap>{detalle}</Typography>}
      </Box>
    </Box>
  );
}

function IndicadorAvance({ nombre, valor, icono }) {
  const porcentaje = Number(valor || 0);
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box color="text.secondary" display="flex">{icono}</Box>
          <Typography variant="body2" fontWeight={750}>{nombre}</Typography>
        </Stack>
        <Typography variant="body2" fontWeight={850}>{porcentaje}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, porcentaje)}
        color={porcentaje === 100 ? 'success' : porcentaje >= 70 ? 'warning' : 'primary'}
        sx={{ height: 7, borderRadius: 999 }}
      />
    </Box>
  );
}

function EstadoEntregable({ valor, aprobado }) {
  const completo = valor === 'Empaquetada' || (valor === 'Entregada a Logística' && aprobado);
  return (
    <Chip
      size="small"
      label={aprobado ? `${valor} · Aprobada` : valor}
      color={completo ? 'success' : valor === 'Pendiente' ? 'default' : 'warning'}
      variant={completo ? 'filled' : 'outlined'}
      sx={{ fontWeight: 650 }}
    />
  );
}

function PanelEntregable({ titulo, icono, conteo }) {
  const total = ESTADOS.reduce((suma, estado) => suma + Number(conteo?.[estado] || 0), 0);
  const completadas = Number(conteo?.Empaquetada || 0) + Number(conteo?.aprobadas || 0);
  const porcentaje = total ? Math.min(100, Math.round((completadas / total) * 100)) : 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2.5, overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'action.hover', color: 'primary.main' }}>{icono}</Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>{titulo}</Typography>
            <Typography variant="caption" color="text.secondary">Seguimiento de recolección y aprobación</Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${porcentaje}%`} color={porcentaje === 100 ? 'success' : 'primary'} variant="outlined" />
      </Stack>

      <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 6, borderRadius: 999, mb: 2 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
        {ESTADOS.map((estado) => (
          <Box key={estado} sx={{ px: 1.2, py: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" display="block">{estado}</Typography>
            <Typography fontWeight={800}>{conteo?.[estado] || 0}</Typography>
          </Box>
        ))}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mt={1.5}>
        <Chip size="small" color="warning" variant="outlined" label={`Pendientes de aprobación: ${conteo?.pendientesAprobacion || 0}`} />
        <Chip size="small" color="success" variant="outlined" label={`Aprobadas: ${conteo?.aprobadas || 0}`} />
      </Stack>
    </Paper>
  );
}

function PanelOperativo({ titulo, icono, indicadores = {}, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0, borderRadius: 2.5 }}>
      <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'action.hover', color: 'primary.main' }}>{icono}</Avatar>
        <Typography variant="subtitle1" fontWeight={800}>{titulo}</Typography>
      </Stack>
      {children || (
        <Stack spacing={0} divider={<Divider flexItem />}>
          {Object.entries(indicadores).map(([clave, valor]) => (
            <Stack key={clave} direction="row" justifyContent="space-between" py={0.9} gap={2}>
              <Typography variant="body2" color="text.secondary">{formatearEtiqueta(clave)}</Typography>
              <Typography variant="body2" fontWeight={800}>{valor}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function CentroLogistico() {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await obtenerCentroLogisticoApi(token));
    } catch (e) {
      setError(e.message || 'No fue posible consultar el Centro Logístico.');
    } finally {
      setCargando(false);
    }
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
  const alertasCriticas = [
    Number(cartas.pendientesAprobacion || 0),
    Number(fotos.pendientesAprobacion || 0),
    Number(datos?.habitaciones?.indicadores?.sinHabitacion || 0),
    Number(datos?.mesas?.indicadores?.sinMesa || 0)
  ].reduce((a, b) => a + b, 0);

  return (
    <Stack spacing={2.5}>
      <Paper sx={{
        px: { xs: 2, md: 2.5 },
        py: 2,
        borderRadius: 2.5,
        color: 'primary.contrastText',
        background: (theme) => `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
      }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <FactCheckRounded />
              <Typography variant="h5" fontWeight={850}>Centro Logístico</Typography>
            </Stack>
            <Typography sx={{ opacity: 0.82 }}>Control operativo del retiro en una sola vista.</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {alertasCriticas > 0 && (
              <Chip
                icon={<WarningAmberRounded />}
                label={`${alertasCriticas} pendientes operativos`}
                sx={{ bgcolor: 'rgba(255,255,255,.16)', color: 'inherit', '& .MuiChip-icon': { color: 'inherit' } }}
              />
            )}
            <Button
              startIcon={<RefreshRounded />}
              variant="contained"
              onClick={cargar}
              sx={{ bgcolor: 'rgba(255,255,255,.16)', color: 'inherit', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,.24)', boxShadow: 'none' } }}
            >
              Actualizar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
          <MetricaCompacta icono={<FactCheckRounded fontSize="small" />} etiqueta="Pulso logístico" valor={`${resumen.pulsoLogistico || 0}%`} detalle="Estado general" destacado />
          <MetricaCompacta icono={<GroupsRounded fontSize="small" />} etiqueta="Caminantes" valor={resumen.caminantes || 0} />
          <MetricaCompacta icono={<VolunteerActivismRounded fontSize="small" />} etiqueta="Servidores" valor={resumen.servidores || 0} />
          <MetricaCompacta icono={<RestaurantRounded fontSize="small" />} etiqueta="Condiciones alimentarias" valor={datos?.alimentacion?.totalConCondicion || 0} />
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={850}>Avance logístico</Typography>
            <Typography variant="caption" color="text.secondary">Nivel de preparación por frente operativo</Typography>
          </Box>
          <Chip size="small" label={`${resumen.pulsoLogistico || 0}% general`} color="primary" variant="outlined" />
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.2 }}>
          <IndicadorAvance nombre="Mesas" valor={avances.mesas} icono={<TableRestaurantRounded fontSize="small" />} />
          <IndicadorAvance nombre="Habitaciones" valor={avances.habitaciones} icono={<HotelRounded fontSize="small" />} />
          <IndicadorAvance nombre="Cartas" valor={avances.cartas} icono={<MailRounded fontSize="small" />} />
          <IndicadorAvance nombre="Fotografías" valor={avances.fotografias} icono={<PhotoRounded fontSize="small" />} />
        </Box>
      </Paper>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <PanelEntregable titulo="Cartas" icono={<MailRounded fontSize="small" />} conteo={cartas} />
        <PanelEntregable titulo="Fotografías" icono={<PhotoRounded fontSize="small" />} conteo={fotos} />
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <PanelOperativo titulo="Habitaciones" icono={<HotelRounded fontSize="small" />} indicadores={datos?.habitaciones?.indicadores || {}} />
        <PanelOperativo titulo="Mesas" icono={<TableRestaurantRounded fontSize="small" />} indicadores={datos?.mesas?.indicadores || {}} />
        <PanelOperativo titulo="Camisas" icono={<CheckroomRounded fontSize="small" />}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
            {(datos?.tallas || []).map((item) => (
              <Stack key={item.talla} direction="row" justifyContent="space-between" sx={{ px: 1.2, py: 1, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Talla {item.talla}</Typography>
                <Typography variant="body2" fontWeight={850}>{item.cantidad}</Typography>
              </Stack>
            ))}
          </Box>
        </PanelOperativo>
      </Stack>

      <PalancasLogisticaPanel />

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.5}>
            <Box>
              <Typography variant="subtitle1" fontWeight={850}>Control por caminante</Typography>
              <Typography variant="caption" color="text.secondary">{filas.length} registros visibles</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
              <TextField size="small" label="Buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <FormControl size="small" sx={{ minWidth: 210 }}>
                <InputLabel>Filtro</InputLabel>
                <Select label="Filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="sin-mesa">Sin mesa</MenuItem>
                  <MenuItem value="sin-habitacion">Sin habitación</MenuItem>
                  <MenuItem value="carta-pendiente">Carta pendiente</MenuItem>
                  <MenuItem value="foto-pendiente">Foto pendiente</MenuItem>
                  <MenuItem value="alimentacion">Con condición alimentaria</MenuItem>
                  <MenuItem value="completos">Completos</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Caminante</TableCell>
                <TableCell>Mesa</TableCell>
                <TableCell>Habitación</TableCell>
                <TableCell>Carta</TableCell>
                <TableCell>Foto</TableCell>
                <TableCell>Alimentación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={750}>{item.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.telefono}</Typography>
                  </TableCell>
                  <TableCell>{item.mesa || <Chip size="small" label="Sin mesa" color="warning" variant="outlined" />}</TableCell>
                  <TableCell>{item.habitacion || <Chip size="small" label="Sin habitación" color="warning" variant="outlined" />}</TableCell>
                  <TableCell><EstadoEntregable valor={item.carta} aprobado={item.cartaAprobada} /></TableCell>
                  <TableCell><EstadoEntregable valor={item.foto} aprobado={item.fotoAprobada} /></TableCell>
                  <TableCell>{item.tieneCondicionAlimentaria === 'Sí' ? item.detalleAlimentacion || 'Condición registrada' : '—'}</TableCell>
                </TableRow>
              ))}
              {!filas.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No hay registros para el filtro seleccionado.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={850}>Exportaciones operativas</Typography>
            <Typography variant="caption" color="text.secondary">Descarga reportes para la coordinación logística.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} flexWrap="wrap">
            <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('resumen_logistico.csv', ['Caminante','Teléfono','Mesa','Habitación','Talla','Carta','Foto','Condición alimentaria','Detalle alimentación'], (datos?.caminantes || []).map(x => [x.nombre,x.telefono,x.mesa,x.habitacion,x.tallaCamiseta,x.carta,x.foto,x.tieneCondicionAlimentaria,x.detalleAlimentacion]))}>Resumen logístico</Button>
            <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('alimentacion.csv', ['Nombre','Teléfono','Mesa','Habitación','Alergias','Restricciones','Preferencias','Dieta especial'], (datos?.alimentacion?.personas || []).map(x => [x.nombre,x.telefono,x.mesa,x.habitacion,x.alergias,x.restricciones,x.preferencias,x.dietaEspecial]))}>Alimentación</Button>
            <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('habitaciones.csv', ['Habitación','Bloque','Piso','Capacidad','Ocupantes','Cupos disponibles','Estado','Conflicto'], (datos?.habitaciones?.items || []).map(x => [x.habitacion,x.bloque,x.piso,x.capacidad,x.ocupantes,x.cuposDisponibles,x.estado,x.conflictoAsignacion ? 'Sí':'No']))}>Habitaciones</Button>
            <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => descargarCsv('mesas.csv', ['Mesa','Capacidad','Caminantes','Cupos disponibles','Ocupación','Excedida'], (datos?.mesas?.items || []).map(x => [x.numero,x.capacidad,x.cantidadCaminantes,x.cuposDisponibles,`${x.porcentajeOcupacion}%`,x.excedida ? 'Sí':'No']))}>Mesas</Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
