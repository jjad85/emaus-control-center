import { Grid, Paper, Stack, Typography } from '@mui/material';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const opciones = [
  { titulo: 'Usuarios', descripcion: 'Crear, editar y asociar cuentas con servidores.', ruta: '/sistema/usuarios', icono: <PeopleRounded fontSize="large" /> },
  { titulo: 'Roles y permisos', descripcion: 'Administrar la matriz de acciones permitidas por rol.', ruta: '/sistema/roles-permisos', icono: <SecurityRounded fontSize="large" /> },
  { titulo: 'Seguridad', descripcion: 'Consultar y desbloquear cuentas bloqueadas.', ruta: '/sistema/seguridad', icono: <LockRounded fontSize="large" /> },
  { titulo: 'Alertas y notificaciones', descripcion: 'Definir qué alertas ve cada rol en el sistema.', ruta: '/sistema/alertas', icono: <NotificationsActiveRounded fontSize="large" /> },
];

export default function Administracion() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Administración"
        subtitle="Seleccione la función que necesita gestionar"
      />
      <Grid container spacing={2.5}>
        {opciones.map((opcion) => (
          <Grid item xs={12} sm={6} lg={3} key={opcion.ruta}>
            <Paper
              role="button"
              tabIndex={0}
              onClick={() => navigate(opcion.ruta)}
              onKeyDown={(evento) => { if (evento.key === 'Enter') navigate(opcion.ruta); }}
              sx={{ p: 2.5, height: '100%', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
            >
              <Stack spacing={1.5}>
                {opcion.icono}
                <Typography variant="h6" fontWeight={900}>{opcion.titulo}</Typography>
                <Typography variant="body2" color="text.secondary">{opcion.descripcion}</Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
