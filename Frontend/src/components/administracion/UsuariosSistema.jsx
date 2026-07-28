import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import PersonOffRounded from '@mui/icons-material/PersonOffRounded';
import { crearUsuarioSistemaApi, editarUsuarioSistemaApi } from '../../api/administracionApi';
import { useAuth } from '../../auth/AuthContext';

const VACIO = { id:'', usuario:'', nombre:'', rol:'', servidorId:'', correo:'', celular:'', activo:true };

function textoSeguro(valor) {
  return String(valor ?? '');
}

function textoLimpio(valor) {
  return textoSeguro(valor).trim();
}

export default function UsuariosSistema({ usuarios = [], servidores = [], roles = [], token, onActualizado }) {
  const { tienePermiso } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const puedeConsultar = tienePermiso('USUARIOS_CONSULTAR') || tienePermiso('SISTEMA_TODO');
  const puedeCrear = tienePermiso('USUARIOS_CREAR') || tienePermiso('SISTEMA_TODO');
  const puedeEditar = tienePermiso('USUARIOS_EDITAR') || tienePermiso('SISTEMA_TODO');
  const servidoresOrdenados = useMemo(() => [...servidores].sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''))), [servidores]);

  if (!puedeConsultar) return null;

  function nuevo() { setForm(VACIO); setError(''); setResultado(null); setAbierto(true); }
  function editar(u) { setForm({ id:u.id, usuario:textoSeguro(u.usuario), nombre:textoSeguro(u.nombreUsuario || u.nombre), rol:textoSeguro(u.rol), servidorId:textoSeguro(u.servidorId), correo:textoSeguro(u.correo), celular:textoSeguro(u.celular), activo:u.activo !== false }); setError(''); setResultado(null); setAbierto(true); }
  function cambiar(campo, valor) { setForm((actual)=>({ ...actual, [campo]:valor, ...(campo==='servidorId' && valor ? { nombre:'' } : {}) })); }
  function cerrar() { if (!guardando) setAbierto(false); }

  async function guardar() {
    setError(''); setResultado(null);
    if (!textoLimpio(form.usuario) || !form.rol) { setError('Complete el usuario y el rol.'); return; }
    if (!form.servidorId && !textoLimpio(form.nombre)) { setError('Ingrese el nombre del usuario de sistema.'); return; }
    setGuardando(true);
    try {
      const datos = { nombre:textoLimpio(form.nombre), rol:form.rol, servidorId:form.servidorId, correo:textoLimpio(form.correo), celular:textoLimpio(form.celular), activo:form.activo };
      const r = form.id ? await editarUsuarioSistemaApi(token, form.id, datos) : await crearUsuarioSistemaApi(token, { ...datos, usuario:textoLimpio(form.usuario) });
      if (!form.id && r.passwordInicial) { setResultado(r); }
      else { setAbierto(false); }
      await onActualizado?.();
    } catch (e) { setError(e.message || 'No fue posible guardar el usuario.'); }
    finally { setGuardando(false); }
  }

  return <>
    <Paper sx={{ p:2.5 }}>
      <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" alignItems={{sm:'center'}} gap={2} mb={2}>
        <Box><Typography variant="h6" fontWeight={900}>Usuarios del sistema</Typography><Typography variant="body2" color="text.secondary">La asociación con un servidor es opcional.</Typography></Box>
        {puedeCrear && <Button variant="contained" startIcon={<AddRounded />} onClick={nuevo}>Crear usuario</Button>}
      </Stack>
      <TableContainer sx={{ border:1, borderColor:'divider', borderRadius:2 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Usuario</TableCell><TableCell>Rol</TableCell><TableCell>Tipo</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
          <TableBody>{usuarios.map((u)=><TableRow key={u.id||u.usuario} hover>
            <TableCell><Typography fontWeight={800}>{u.nombre||u.usuario}</Typography>{u.correo && <Typography variant="caption" color="text.secondary">{u.correo}</Typography>}</TableCell>
            <TableCell>{u.usuario}</TableCell><TableCell>{u.rol}</TableCell>
            <TableCell>{u.tieneServidorAsociado ? <Chip size="small" label="Servidor asociado" /> : <Chip size="small" icon={<PersonOffRounded />} label="Solo sistema" variant="outlined" />}</TableCell>
            <TableCell><Chip size="small" color={u.activo?'success':'default'} label={u.activo?'Activo':'Inactivo'} /></TableCell>
            <TableCell align="right">{puedeEditar && <Tooltip title="Editar"><IconButton onClick={()=>editar(u)}><EditRounded /></IconButton></Tooltip>}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </Paper>

    <Dialog open={abierto} onClose={cerrar} fullWidth maxWidth="sm">
      <DialogTitle>{form.id ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
      <DialogContent><Stack spacing={2} mt={1}>
        {error && <Alert severity="error">{error}</Alert>}
        {resultado && <Alert severity="success">Usuario creado. Contraseña inicial: <strong>{resultado.passwordInicial}</strong>. Deberá cambiarla al ingresar por primera vez.</Alert>}
        <TextField label="Usuario" value={form.usuario} onChange={(e)=>cambiar('usuario',e.target.value)} disabled={Boolean(form.id)||Boolean(resultado)} required />
        <TextField select label="Rol" value={form.rol} onChange={(e)=>cambiar('rol',e.target.value)} disabled={Boolean(resultado)} required>{roles.map((r)=><MenuItem key={r.rol} value={r.rol}>{r.nombre||r.rol}</MenuItem>)}</TextField>
        <TextField select label="Servidor asociado (opcional)" value={form.servidorId} onChange={(e)=>cambiar('servidorId',e.target.value)} disabled={Boolean(resultado)} helperText="Déjelo vacío para cuentas administrativas, técnicas o de soporte.">
          <MenuItem value="">Sin servidor asociado</MenuItem>{servidoresOrdenados.map((s)=><MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
        </TextField>
        {!form.servidorId && <TextField label="Nombre" value={form.nombre} onChange={(e)=>cambiar('nombre',e.target.value)} disabled={Boolean(resultado)} required helperText="Solo se guarda en el usuario cuando no tiene servidor asociado." />}
        <TextField label="Correo" value={form.correo} onChange={(e)=>cambiar('correo',e.target.value)} disabled={Boolean(resultado)} />
        <TextField label="Celular" value={form.celular} onChange={(e)=>cambiar('celular',e.target.value)} disabled={Boolean(resultado)} />
        {form.id && <FormControlLabel control={<Switch checked={form.activo} onChange={(e)=>cambiar('activo',e.target.checked)} />} label="Usuario activo" />}
      </Stack></DialogContent>
      <DialogActions><Button onClick={cerrar}>{resultado?'Cerrar':'Cancelar'}</Button>{!resultado && <Button variant="contained" onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</Button>}</DialogActions>
    </Dialog>
  </>;
}
