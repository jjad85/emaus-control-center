import { useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, Divider, Drawer, FormControlLabel, IconButton,
  InputAdornment, Menu, MenuItem, Paper, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import FilterAltRounded from '@mui/icons-material/FilterAltRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PersonOffRounded from '@mui/icons-material/PersonOffRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ToggleOffRounded from '@mui/icons-material/ToggleOffRounded';
import ToggleOnRounded from '@mui/icons-material/ToggleOnRounded';
import { crearUsuarioSistemaApi, editarUsuarioSistemaApi } from '../../api/administracionApi';
import { useAuth } from '../../auth/AuthContext';

const VACIO = { id:'', usuario:'', nombre:'', rol:'', servidorId:'', correo:'', celular:'', activo:true };

function textoSeguro(valor) {
  return String(valor ?? '');
}

function textoLimpio(valor) {
  return textoSeguro(valor).trim();
}

function iniciales(nombre) {
  return textoLimpio(nombre)
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || 'US';
}

function nombreVisible(usuario) {
  return textoLimpio(usuario.nombre || usuario.nombreUsuario || usuario.usuario) || 'Usuario sin nombre';
}

export default function UsuariosSistema({ usuarios = [], servidores = [], roles = [], token, onActualizado }) {
  const { tienePermiso } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [tipo, setTipo] = useState('todos');
  const [rolFiltro, setRolFiltro] = useState('todos');
  const [menu, setMenu] = useState({ anchorEl:null, usuario:null });

  const puedeConsultar = tienePermiso('USUARIOS_CONSULTAR') || tienePermiso('SISTEMA_TODO');
  const puedeCrear = tienePermiso('USUARIOS_CREAR') || tienePermiso('SISTEMA_TODO');
  const puedeEditar = tienePermiso('USUARIOS_EDITAR') || tienePermiso('SISTEMA_TODO');
  const servidoresOrdenados = useMemo(() => [...servidores].sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''))), [servidores]);

  const resumen = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter((u) => u.activo !== false).length,
    inactivos: usuarios.filter((u) => u.activo === false).length,
    sinServidor: usuarios.filter((u) => !u.tieneServidorAsociado && !u.servidorId).length,
  }), [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termino = textoLimpio(busqueda).toLowerCase();
    return [...usuarios]
      .filter((u) => {
        const activo = u.activo !== false;
        if (estado === 'activos' && !activo) return false;
        if (estado === 'inactivos' && activo) return false;
        const asociado = Boolean(u.tieneServidorAsociado || u.servidorId);
        if (tipo === 'asociados' && !asociado) return false;
        if (tipo === 'sistema' && asociado) return false;
        if (rolFiltro !== 'todos' && textoSeguro(u.rol) !== rolFiltro) return false;
        if (!termino) return true;
        return [nombreVisible(u), u.usuario, u.rol, u.correo, u.celular]
          .some((valor) => textoSeguro(valor).toLowerCase().includes(termino));
      })
      .sort((a, b) => nombreVisible(a).localeCompare(nombreVisible(b)));
  }, [usuarios, busqueda, estado, tipo, rolFiltro]);

  if (!puedeConsultar) return null;

  function nuevo() {
    setForm(VACIO);
    setError('');
    setResultado(null);
    setAbierto(true);
  }

  function editar(u) {
    setForm({
      id:u.id,
      usuario:textoSeguro(u.usuario),
      nombre:textoSeguro(u.nombreUsuario || u.nombre),
      rol:textoSeguro(u.rol),
      servidorId:textoSeguro(u.servidorId),
      correo:textoSeguro(u.correo),
      celular:textoSeguro(u.celular),
      activo:u.activo !== false,
    });
    setError('');
    setResultado(null);
    setAbierto(true);
    setMenu({ anchorEl:null, usuario:null });
  }

  function cambiar(campo, valor) {
    setForm((actual)=>({ ...actual, [campo]:valor, ...(campo==='servidorId' && valor ? { nombre:'' } : {}) }));
  }

  function cerrar() {
    if (!guardando) setAbierto(false);
  }

  async function guardar() {
    setError('');
    setResultado(null);
    if (!textoLimpio(form.usuario) || !form.rol) {
      setError('Complete el usuario y el rol.');
      return;
    }
    if (!form.servidorId && !textoLimpio(form.nombre)) {
      setError('Ingrese el nombre del usuario de sistema.');
      return;
    }
    setGuardando(true);
    try {
      const datos = {
        nombre:textoLimpio(form.nombre),
        rol:form.rol,
        servidorId:form.servidorId,
        correo:textoLimpio(form.correo),
        celular:textoLimpio(form.celular),
        activo:form.activo,
      };
      const r = form.id
        ? await editarUsuarioSistemaApi(token, form.id, datos)
        : await crearUsuarioSistemaApi(token, { ...datos, usuario:textoLimpio(form.usuario) });
      if (!form.id && r.passwordInicial) setResultado(r);
      else setAbierto(false);
      await onActualizado?.();
    } catch (e) {
      setError(e.message || 'No fue posible guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoRapido(usuario) {
    if (!puedeEditar) return;
    setMenu({ anchorEl:null, usuario:null });
    try {
      await editarUsuarioSistemaApi(token, usuario.id, {
        nombre:textoLimpio(usuario.nombreUsuario || usuario.nombre),
        rol:usuario.rol,
        servidorId:textoSeguro(usuario.servidorId),
        correo:textoLimpio(usuario.correo),
        celular:textoLimpio(usuario.celular),
        activo:usuario.activo === false,
      });
      await onActualizado?.();
    } catch (e) {
      setError(e.message || 'No fue posible cambiar el estado del usuario.');
    }
  }

  const filtrosActivos = estado !== 'todos' || tipo !== 'todos' || rolFiltro !== 'todos';

  return <>
    <Paper sx={{ p:{ xs:2, md:2.5 }, borderRadius:3 }}>
      <Stack spacing={2.5}>
        <Stack direction={{xs:'column',md:'row'}} justifyContent="space-between" alignItems={{md:'center'}} gap={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Usuarios del sistema</Typography>
            <Typography variant="body2" color="text.secondary">Administra cuentas, roles, asociaciones y estado de acceso.</Typography>
          </Box>
          {puedeCrear && <Button variant="contained" startIcon={<AddRounded />} onClick={nuevo}>Nuevo usuario</Button>}
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${resumen.total} usuarios`} />
          <Chip color="success" variant="outlined" label={`${resumen.activos} activos`} />
          <Chip variant="outlined" label={`${resumen.inactivos} inactivos`} />
          <Chip icon={<PersonOffRounded />} variant="outlined" label={`${resumen.sinServidor} solo sistema`} />
        </Stack>

        <Stack direction={{xs:'column',lg:'row'}} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre, usuario, rol, correo o celular"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{ startAdornment:<InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
          />
          <TextField select size="small" label="Estado" value={estado} onChange={(e)=>setEstado(e.target.value)} sx={{ minWidth:{lg:150} }}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="activos">Activos</MenuItem>
            <MenuItem value="inactivos">Inactivos</MenuItem>
          </TextField>
          <TextField select size="small" label="Tipo" value={tipo} onChange={(e)=>setTipo(e.target.value)} sx={{ minWidth:{lg:190} }}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="asociados">Servidor asociado</MenuItem>
            <MenuItem value="sistema">Solo sistema</MenuItem>
          </TextField>
          <TextField select size="small" label="Rol" value={rolFiltro} onChange={(e)=>setRolFiltro(e.target.value)} sx={{ minWidth:{lg:180} }}>
            <MenuItem value="todos">Todos</MenuItem>
            {roles.map((r)=><MenuItem key={r.rol} value={r.rol}>{r.nombre||r.rol}</MenuItem>)}
          </TextField>
          {filtrosActivos && <Button startIcon={<FilterAltRounded />} onClick={()=>{ setEstado('todos'); setTipo('todos'); setRolFiltro('todos'); }}>Limpiar</Button>}
        </Stack>

        {error && !abierto && <Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}

        {usuariosFiltrados.length === 0 ? (
          <Box sx={{ py:7, textAlign:'center', border:1, borderStyle:'dashed', borderColor:'divider', borderRadius:3 }}>
            <PersonRounded sx={{ fontSize:44, color:'text.disabled', mb:1 }} />
            <Typography fontWeight={800}>No encontramos usuarios</Typography>
            <Typography variant="body2" color="text.secondary">Ajusta la búsqueda o los filtros aplicados.</Typography>
          </Box>
        ) : (
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(2, minmax(0, 1fr))', xl:'repeat(3, minmax(0, 1fr))' }, gap:1.5 }}>
            {usuariosFiltrados.map((u) => {
              const activo = u.activo !== false;
              const asociado = Boolean(u.tieneServidorAsociado || u.servidorId);
              const nombre = nombreVisible(u);
              return (
                <Paper key={u.id||u.usuario} variant="outlined" sx={{ p:2, borderRadius:3, minWidth:0 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                      <Avatar sx={{ width:46, height:46, fontWeight:900 }}>{iniciales(nombre)}</Avatar>
                      <Box sx={{ minWidth:0, flex:1 }}>
                        <Typography fontWeight={900} noWrap title={nombre}>{nombre}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>@{u.usuario}</Typography>
                      </Box>
                      {puedeEditar && <Tooltip title="Acciones"><IconButton size="small" onClick={(e)=>setMenu({ anchorEl:e.currentTarget, usuario:u })}><MoreVertRounded /></IconButton></Tooltip>}
                    </Stack>

                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      <Chip size="small" label={u.rol || 'Sin rol'} />
                      <Chip size="small" color={activo?'success':'default'} variant={activo?'filled':'outlined'} label={activo?'Activo':'Inactivo'} />
                      <Chip size="small" variant="outlined" icon={asociado?<PersonRounded />:<PersonOffRounded />} label={asociado?'Servidor asociado':'Solo sistema'} />
                    </Stack>

                    {(u.correo || u.celular) && <>
                      <Divider />
                      <Stack spacing={0.35}>
                        {u.correo && <Typography variant="caption" color="text.secondary" noWrap title={u.correo}>{u.correo}</Typography>}
                        {u.celular && <Typography variant="caption" color="text.secondary">{u.celular}</Typography>}
                      </Stack>
                    </>}
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        )}
      </Stack>
    </Paper>

    <Menu anchorEl={menu.anchorEl} open={Boolean(menu.anchorEl)} onClose={()=>setMenu({ anchorEl:null, usuario:null })}>
      <MenuItem onClick={()=>editar(menu.usuario)}><EditRounded fontSize="small" sx={{ mr:1.25 }} />Editar usuario</MenuItem>
      <MenuItem onClick={()=>cambiarEstadoRapido(menu.usuario)}>
        {menu.usuario?.activo === false ? <ToggleOnRounded fontSize="small" sx={{ mr:1.25 }} /> : <ToggleOffRounded fontSize="small" sx={{ mr:1.25 }} />}
        {menu.usuario?.activo === false ? 'Activar usuario' : 'Desactivar usuario'}
      </MenuItem>
    </Menu>

    <Drawer
      anchor="right"
      open={abierto}
      onClose={cerrar}
      PaperProps={{ sx:{ width:{ xs:'100%', sm:520 }, p:0 } }}
    >
      <Stack sx={{ height:'100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px:3, py:2.25 }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>{form.id ? 'Editar usuario' : 'Nuevo usuario'}</Typography>
            <Typography variant="body2" color="text.secondary">Configura la cuenta y su acceso al sistema.</Typography>
          </Box>
          <IconButton onClick={cerrar} disabled={guardando}><CloseRounded /></IconButton>
        </Stack>
        <Divider />

        <Box sx={{ p:3, overflowY:'auto', flex:1 }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {resultado && <Alert severity="success">Usuario creado. Contraseña inicial: <strong>{resultado.passwordInicial}</strong>. Deberá cambiarla al ingresar por primera vez.</Alert>}

            <Box>
              <Typography fontWeight={900} mb={1.5}>Datos de acceso</Typography>
              <Stack spacing={2}>
                <TextField label="Usuario" value={form.usuario} onChange={(e)=>cambiar('usuario',e.target.value)} disabled={Boolean(form.id)||Boolean(resultado)} required />
                <TextField select label="Rol" value={form.rol} onChange={(e)=>cambiar('rol',e.target.value)} disabled={Boolean(resultado)} required>
                  {roles.map((r)=><MenuItem key={r.rol} value={r.rol}>{r.nombre||r.rol}</MenuItem>)}
                </TextField>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography fontWeight={900} mb={1.5}>Asociación</Typography>
              <Stack spacing={2}>
                <TextField select label="Servidor asociado" value={form.servidorId} onChange={(e)=>cambiar('servidorId',e.target.value)} disabled={Boolean(resultado)} helperText="Déjalo vacío para cuentas administrativas, técnicas o de soporte.">
                  <MenuItem value="">Sin servidor asociado</MenuItem>
                  {servidoresOrdenados.map((s)=><MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                </TextField>
                {!form.servidorId && <TextField label="Nombre visible" value={form.nombre} onChange={(e)=>cambiar('nombre',e.target.value)} disabled={Boolean(resultado)} required helperText="Se utiliza cuando la cuenta no está asociada con un servidor." />}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography fontWeight={900} mb={1.5}>Información de contacto</Typography>
              <Stack spacing={2}>
                <TextField label="Correo" value={form.correo} onChange={(e)=>cambiar('correo',e.target.value)} disabled={Boolean(resultado)} />
                <TextField label="Celular" value={form.celular} onChange={(e)=>cambiar('celular',e.target.value)} disabled={Boolean(resultado)} />
              </Stack>
            </Box>

            {form.id && <>
              <Divider />
              <Box>
                <Typography fontWeight={900} mb={1}>Estado de la cuenta</Typography>
                <FormControlLabel control={<Switch checked={form.activo} onChange={(e)=>cambiar('activo',e.target.checked)} />} label={form.activo?'Usuario activo':'Usuario inactivo'} />
              </Box>
            </>}
          </Stack>
        </Box>

        <Divider />
        <Stack direction="row" justifyContent="flex-end" spacing={1.25} sx={{ p:2.5 }}>
          <Button onClick={cerrar} disabled={guardando}>{resultado?'Cerrar':'Cancelar'}</Button>
          {!resultado && <Button variant="contained" onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar usuario'}</Button>}
        </Stack>
      </Stack>
    </Drawer>
  </>;
}
