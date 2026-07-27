import {
  Alert, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid,
  IconButton, InputAdornment, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import RestoreRounded from '@mui/icons-material/RestoreRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import TopicRounded from '@mui/icons-material/TopicRounded';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import {
  archivoDocumentoABase64, crearDocumento, editarDocumento, eliminarDocumento,
  obtenerDocumentos, obtenerUrlDescargaDocumento, restaurarDocumento,
} from '../api/documentosApi';

const FORM_INICIAL = {
  nombre: '', descripcion: '', categoria: 'Presentación', etiquetas: '',
  asociadoATema: false, temaId: '', esImportante: false,
};

function formatoFecha(valor) {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleString('es-CO');
}

export default function Documentos() {
  const { token, tienePermiso } = useAuth();
  const [data, setData] = useState({ items: [], categorias: [], temas: [], indicadores: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [temaIdFiltro, setTemaIdFiltro] = useState('');
  const [soloImportantes, setSoloImportantes] = useState(false);
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dialogo, setDialogo] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);

  const puedeCrear = tienePermiso('DOCUMENTOS_CREAR');
  const puedeEditar = tienePermiso('DOCUMENTOS_EDITAR');
  const puedeEliminar = tienePermiso('DOCUMENTOS_ELIMINAR');
  const puedeDescargar = tienePermiso('DOCUMENTOS_DESCARGAR');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const respuesta = await obtenerDocumentos(token, {
        texto, categoria, temaId: temaIdFiltro, soloImportantes, incluirInactivos,
      });
      setData(respuesta || { items: [], categorias: [], temas: [], indicadores: {} });
    } catch (err) {
      setError(err.message || 'No fue posible consultar la biblioteca documental.');
    } finally {
      setLoading(false);
    }
  }, [token, texto, categoria, temaIdFiltro, soloImportantes, incluirInactivos]);

  useEffect(() => {
    const timeout = window.setTimeout(cargar, 250);
    return () => window.clearTimeout(timeout);
  }, [cargar]);

  const categorias = useMemo(
    () => data.categorias?.length ? data.categorias : ['Presentación', 'Canción', 'Manual', 'Formato', 'Instructivo', 'Otro'],
    [data.categorias]
  );
  const temas = data.temas || [];

  function abrirCrear() {
    setForm(FORM_INICIAL);
    setArchivo(null);
    setDialogo({ tipo: 'crear' });
  }

  function abrirEditar(item) {
    setForm({
      nombre: item.nombre || '', descripcion: item.descripcion || '',
      categoria: item.categoria || 'Otro', etiquetas: item.etiquetas || '',
      asociadoATema: Boolean(item.asociadoATema), temaId: item.temaId || '',
      esImportante: Boolean(item.esImportante),
    });
    setArchivo(null);
    setDialogo({ tipo: 'editar', item });
  }

  function actualizarForm(campo, valor) {
    setForm(actual => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === 'asociadoATema' && !valor) siguiente.temaId = '';
      return siguiente;
    });
  }

  async function guardar() {
    setError('');
    if (!form.nombre.trim()) return setError('El nombre del documento es obligatorio.');
    if (form.asociadoATema && !form.temaId) return setError('Debe seleccionar el tema asociado.');
    if (dialogo?.tipo === 'crear' && !archivo) return setError('Debe seleccionar el archivo que desea cargar.');
    if (archivo && archivo.size > 15 * 1024 * 1024) return setError('El archivo no puede superar 15 MB.');

    setGuardando(true);
    try {
      const archivoConvertido = archivo ? await archivoDocumentoABase64(archivo) : null;
      if (dialogo.tipo === 'crear') {
        await crearDocumento(token, form, archivoConvertido);
        setMensaje('Documento cargado correctamente.');
      } else {
        await editarDocumento(token, dialogo.item.id, form, archivoConvertido);
        setMensaje('Documento actualizado correctamente.');
      }
      setDialogo(null);
      setArchivo(null);
      await cargar();
    } catch (err) {
      setError(err.message || 'No fue posible guardar el documento.');
    } finally {
      setGuardando(false);
    }
  }

  async function descargar(item) {
    setError('');
    try {
      const datos = await obtenerUrlDescargaDocumento(token, item.id);
      window.open(datos.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'No fue posible abrir el documento.');
    }
  }

  async function ejecutarConfirmacion() {
    if (!confirmar) return;
    setGuardando(true);
    setError('');
    try {
      if (confirmar.tipo === 'eliminar') {
        await eliminarDocumento(token, confirmar.item.id);
        setMensaje('Documento eliminado correctamente.');
      } else {
        await restaurarDocumento(token, confirmar.item.id);
        setMensaje('Documento restaurado correctamente.');
      }
      setConfirmar(null);
      await cargar();
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Material del retiro" title="Biblioteca documental" subtitle="Presentaciones, canciones, manuales, formatos y demás material de apoyo." onRefresh={cargar} loading={loading} />
      <Stack spacing={2.5}>
        {puedeCrear && <Box display="flex" justifyContent="flex-end"><Button variant="contained" startIcon={<AddRounded />} onClick={abrirCrear}>Cargar documento</Button></Box>}
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {mensaje && <Alert severity="success" onClose={() => setMensaje('')}>{mensaje}</Alert>}

        <Card variant="outlined"><CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Buscar" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Nombre, descripción, archivo, etiqueta o tema" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} /></Grid>
            <Grid size={{ xs: 12, md: 2 }}><TextField select fullWidth label="Categoría" value={categoria} onChange={e => setCategoria(e.target.value)}><MenuItem value="">Todas</MenuItem>{categorias.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12, md: 2 }}><TextField select fullWidth label="Tema" value={temaIdFiltro} onChange={e => setTemaIdFiltro(e.target.value)}><MenuItem value="">Todos</MenuItem>{temas.map(x => <MenuItem key={x.id} value={x.id}>{x.nombre}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12, md: 2 }}><FormControlLabel control={<Switch checked={soloImportantes} onChange={e => setSoloImportantes(e.target.checked)} />} label="Importantes" /></Grid>
            <Grid size={{ xs: 12, md: 2 }}><FormControlLabel control={<Switch checked={incluirInactivos} onChange={e => setIncluirInactivos(e.target.checked)} />} label="Eliminados" /></Grid>
          </Grid>
        </CardContent></Card>

        {loading ? <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box> : !data.items?.length ? <Alert severity="info">No hay documentos que coincidan con los filtros seleccionados.</Alert> : (
          <Grid container spacing={2}>{data.items.map(item => (
            <Grid key={item.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: item.activo ? 1 : 0.65 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                    <Box display="flex" gap={1.5} minWidth={0}><DescriptionRounded color="primary" /><Box minWidth={0}><Typography variant="h6" fontWeight={900} noWrap title={item.nombre}>{item.nombre}</Typography><Typography variant="body2" color="text.secondary" noWrap title={item.nombreArchivo}>{item.nombreArchivo}</Typography></Box></Box>
                    <Chip size="small" label={item.activo ? item.categoria : 'Eliminado'} color={item.activo ? 'primary' : 'default'} variant="outlined" />
                  </Stack>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={1.5}>
                    {item.esImportante && <Chip icon={<StarRounded />} size="small" label="Documento importante" color="warning" />}
                    {item.asociadoATema && <Chip icon={<TopicRounded />} size="small" label={item.temaNombre || 'Tema asociado'} variant="outlined" />}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 2, minHeight: 42 }} color={item.descripcion ? 'text.primary' : 'text.secondary'}>{item.descripcion || 'Sin descripción.'}</Typography>
                  {item.etiquetas && <Typography variant="caption" display="block" color="text.secondary" mt={1}>Etiquetas: {item.etiquetas}</Typography>}
                  <Typography variant="caption" display="block" color="text.secondary" mt={1.5}>Actualizado: {formatoFecha(item.actualizadoEn || item.creadoEn)}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  {item.activo && puedeDescargar && <Tooltip title="Abrir o descargar"><IconButton color="primary" onClick={() => descargar(item)}><DownloadRounded /></IconButton></Tooltip>}
                  {item.activo && puedeEditar && <Tooltip title="Editar"><IconButton onClick={() => abrirEditar(item)}><EditRounded /></IconButton></Tooltip>}
                  {item.activo && puedeEliminar && <Tooltip title="Eliminar"><IconButton color="error" onClick={() => setConfirmar({ tipo: 'eliminar', item })}><DeleteRounded /></IconButton></Tooltip>}
                  {!item.activo && puedeEditar && <Tooltip title="Restaurar"><IconButton color="success" onClick={() => setConfirmar({ tipo: 'restaurar', item })}><RestoreRounded /></IconButton></Tooltip>}
                </CardActions>
              </Card>
            </Grid>
          ))}</Grid>
        )}
      </Stack>

      <Dialog open={Boolean(dialogo)} onClose={() => !guardando && setDialogo(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogo?.tipo === 'crear' ? 'Cargar documento' : 'Editar documento'}</DialogTitle>
        <DialogContent><Stack spacing={2.2} mt={1}>
          <TextField label="Nombre del documento" required value={form.nombre} onChange={e => actualizarForm('nombre', e.target.value)} inputProps={{ maxLength: 120 }} />
          <TextField label="Descripción" multiline minRows={3} value={form.descripcion} onChange={e => actualizarForm('descripcion', e.target.value)} inputProps={{ maxLength: 500 }} />
          <TextField select label="Categoría" required value={form.categoria} onChange={e => actualizarForm('categoria', e.target.value)}>{categorias.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
          <FormControlLabel control={<Switch checked={form.asociadoATema} onChange={e => actualizarForm('asociadoATema', e.target.checked)} />} label="¿El documento está asociado a un tema?" />
          {form.asociadoATema && <TextField select required label="Tema asociado" value={form.temaId} onChange={e => actualizarForm('temaId', e.target.value)} helperText={temas.length ? 'Seleccione el tema al que pertenece el documento.' : 'No hay temas activos disponibles.'}>{temas.map(x => <MenuItem key={x.id} value={x.id}>{x.nombre}</MenuItem>)}</TextField>}
          <FormControlLabel control={<Switch checked={form.esImportante} onChange={e => actualizarForm('esImportante', e.target.checked)} />} label="Publicar como documento importante" />
          {form.esImportante && <Alert severity="info">Este documento aparecerá destacado en el dashboard para los usuarios autorizados.</Alert>}
          <TextField label="Etiquetas" value={form.etiquetas} onChange={e => actualizarForm('etiquetas', e.target.value)} inputProps={{ maxLength: 200 }} helperText="Separe las etiquetas con comas." />
          <Button component="label" variant="outlined" startIcon={<UploadFileRounded />}>{archivo ? archivo.name : dialogo?.tipo === 'crear' ? 'Seleccionar archivo' : 'Reemplazar archivo (opcional)'}<input hidden type="file" onChange={e => setArchivo(e.target.files?.[0] || null)} /></Button>
          <Typography variant="caption" color="text.secondary">Tamaño máximo permitido: 15 MB.</Typography>
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialogo(null)} disabled={guardando}>Cancelar</Button><Button variant="contained" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmar)} onClose={() => !guardando && setConfirmar(null)}>
        <DialogTitle>{confirmar?.tipo === 'eliminar' ? 'Eliminar documento' : 'Restaurar documento'}</DialogTitle>
        <DialogContent><Typography>{confirmar?.tipo === 'eliminar' ? `¿Desea eliminar “${confirmar?.item?.nombre}”?` : `¿Desea restaurar “${confirmar?.item?.nombre}”?`}</Typography></DialogContent>
        <DialogActions><Button onClick={() => setConfirmar(null)} disabled={guardando}>Cancelar</Button><Button variant="contained" color={confirmar?.tipo === 'eliminar' ? 'error' : 'success'} onClick={ejecutarConfirmacion} disabled={guardando}>Confirmar</Button></DialogActions>
      </Dialog>
    </>
  );
}
