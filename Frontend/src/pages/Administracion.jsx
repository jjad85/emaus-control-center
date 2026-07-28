import { Alert, Box, Button, Checkbox, CircularProgress, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { desbloquearUsuarioSistemaApi, guardarPermisosRolSistemaApi, obtenerAdministracionSistemaApi } from '../api/administracionApi';
import UsuariosSistema from '../components/administracion/UsuariosSistema';

export default function Administracion() {
  const navigate = useNavigate();
  const { token, tienePermiso } = useAuth();
  const api = useApi(() => obtenerAdministracionSistemaApi(token), [token]);
  const [matriz, setMatriz] = useState({});
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const datos = api.data || {};
  const roles = datos.roles || [];
  const catalogo = datos.permisos || [];

  useEffect(() => {
    if (api.data) {
      const inicial = {};
      roles.forEach((r) => { inicial[r.rol] = [...(datos.permisosPorRol?.[r.rol] || [])]; });
      setMatriz(inicial);
    }
  }, [api.data]);

  const grupos = useMemo(() => {
    const resultado = [];
    catalogo.forEach((item) => {
      const permiso = typeof item === 'string' ? { codigo: item, modulo: 'Otros', pagina: 'Otros', accion: item } : item;
      let grupo = resultado.find((g) => g.modulo === permiso.modulo && g.pagina === permiso.pagina);
      if (!grupo) { grupo = { modulo: permiso.modulo, pagina: permiso.pagina, permisos: [] }; resultado.push(grupo); }
      grupo.permisos.push(permiso);
    });
    return resultado;
  }, [catalogo]);

  const usuariosBloqueados = (datos.usuarios || []).filter((u) => u.bloqueado);

  if (!tienePermiso('SISTEMA_TODO')) return <Alert severity="error">No tiene permisos para administrar el sistema.</Alert>;
  if (api.loading && !api.data) return <LoadingState />;
  if (api.error) return <ErrorState message={api.error} onRetry={api.reload} />;

  function cambiar(rol, permiso) {
    setMatriz((actual) => {
      const lista = actual[rol] || [];
      return { ...actual, [rol]: lista.includes(permiso) ? lista.filter((p) => p !== permiso) : [...lista, permiso] };
    });
  }

  async function guardarTodo() {
    setProcesando(true); setError(''); setMensaje('');
    try {
      for (const rol of roles) await guardarPermisosRolSistemaApi(token, rol.rol, matriz[rol.rol] || []);
      setMensaje('La matriz de roles y permisos fue actualizada correctamente. Cierre sesión e ingrese nuevamente para refrescar los permisos.');
      await api.reload();
    } catch (e) { setError(e.message || 'No fue posible guardar la matriz.'); }
    finally { setProcesando(false); }
  }

  async function desbloquear(usuario) {
    setProcesando(true); setError('');
    try { await desbloquearUsuarioSistemaApi(token, usuario); await api.reload(); }
    catch (e) { setError(e.message || 'No fue posible desbloquear el usuario.'); }
    finally { setProcesando(false); }
  }

  return <>
    <PageHeader eyebrow="Sistema" title="Administración" subtitle="Matriz definitiva de roles y permisos" onRefresh={api.reload} loading={api.loading} />
    <Stack spacing={2.5}>
      {mensaje && <Alert severity="success">{mensaje}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <UsuariosSistema usuarios={datos.usuarios || []} servidores={datos.servidores || []} roles={roles} token={token} onActualizado={api.reload} />
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={900}>Usuarios bloqueados</Typography>
        <Divider sx={{ my: 2 }} />
        {!usuariosBloqueados.length ? <Alert severity="info">No hay usuarios bloqueados.</Alert> : usuariosBloqueados.map((u) => <Stack key={u.usuario} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}><Box><Typography fontWeight={800}>{u.nombre || u.usuario}</Typography><Typography variant="body2">{u.usuario}</Typography></Box><Button startIcon={<LockOpenRounded />} onClick={() => desbloquear(u.usuario)}>Desbloquear</Button></Stack>)}
      </Paper>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs:'column', md:'row' }} justifyContent="space-between" gap={2} mb={2}>
          <Box><Typography variant="h6" fontWeight={900}>Roles y permisos</Typography><Typography variant="body2" color="text.secondary">Marque las acciones permitidas para cada rol. El control aplica al menú, páginas, botones y backend.</Typography></Box>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/administracion/alertas')}>Configurar alertas</Button>
            <Button variant="contained" startIcon={procesando ? <CircularProgress size={18} color="inherit" /> : <SecurityRounded />} disabled={procesando} onClick={guardarTodo}>Guardar matriz</Button>
          </Stack>
        </Stack>
        <TableContainer sx={{ maxHeight: '68vh', border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Table stickyHeader size="small">
            <TableHead><TableRow><TableCell sx={{ minWidth: 170, fontWeight: 900 }}>Módulo</TableCell><TableCell sx={{ minWidth: 170, fontWeight: 900 }}>Página</TableCell><TableCell sx={{ minWidth: 220, fontWeight: 900 }}>Acción</TableCell>{roles.map((r) => <TableCell key={r.rol} align="center" sx={{ minWidth: 105, fontWeight: 900 }}>{r.rol}</TableCell>)}</TableRow></TableHead>
            <TableBody>{grupos.flatMap((grupo) => grupo.permisos.map((p, index) => <TableRow key={p.codigo} hover><TableCell>{index === 0 ? grupo.modulo : ''}</TableCell><TableCell>{index === 0 ? grupo.pagina : ''}</TableCell><TableCell>{p.accion}</TableCell>{roles.map((r) => <TableCell key={`${r.rol}-${p.codigo}`} align="center"><Checkbox checked={(matriz[r.rol] || []).includes(p.codigo)} onChange={() => cambiar(r.rol, p.codigo)} /></TableCell>)}</TableRow>))}</TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  </>;
}
