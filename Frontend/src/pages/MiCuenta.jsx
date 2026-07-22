import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PersonRounded from '@mui/icons-material/PersonRounded';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import BedRounded from '@mui/icons-material/BedRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import FotoPerfilServidor from '../components/servidores/FotoPerfilServidor';
import { obtenerMiCuentaServidorApi } from '../api/miCuentaApi';

function Campo({ etiqueta, valor }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>
        {etiqueta}
      </Typography>
      <Typography fontWeight={700}>{valor || 'Sin información'}</Typography>
    </Box>
  );
}

export default function MiCuenta() {
  const { token } = useAuth();
  const api = useApi(() => obtenerMiCuentaServidorApi(token), [token]);
  const [fotoLocal, setFotoLocal] = useState('');

  if (api.loading && !api.data) return <LoadingState />;

  const servidor = api.data || {};

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Mi cuenta"
        subtitle="Consulta tu información y administra tu fotografía de perfil"
        onRefresh={api.reload}
        loading={api.loading}
      />

      {api.error && (
        <Alert severity="error">
          {api.error?.message || api.error || 'No fue posible consultar tu cuenta.'}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <FotoPerfilServidor
                token={token}
                nombre={servidor.nombre || ''}
                fotoPerfilUrl={fotoLocal || servidor.fotoPerfilUrl || ''}
                onActualizada={(foto) => {
                  setFotoLocal(foto?.fotoPerfilUrl || '');
                  api.reload();
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PersonRounded color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight={900}>
                      {servidor.nombre || 'Servidor'}
                    </Typography>
                    <Typography color="text.secondary">
                      Información registrada para el retiro
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Campo etiqueta="Documento de identidad" valor={servidor.documentoIdentidad} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Campo etiqueta="Correo" valor={servidor.correo} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Campo etiqueta="Celular" valor={servidor.celular} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Campo etiqueta="Contacto" valor={servidor.contacto} />
                  </Grid>
                </Grid>

                <Divider />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip icon={<PaymentsRounded />} label={`Pago: ${servidor.estadoPago || 'Pendiente'}`} />
                  <Chip icon={<GroupsRounded />} label={servidor.equipo || 'Sin equipo'} />
                  <Chip icon={<BadgeRounded />} label={servidor.rol || servidor.rolEquipo || servidor.rolMesa || 'Sin rol'} />
                  <Chip icon={<TableRestaurantRounded />} label={servidor.mesa ? `Mesa ${servidor.mesa}` : 'Sin mesa'} />
                  <Chip icon={<BedRounded />} label={servidor.habitacion ? `Habitación ${servidor.habitacion}` : 'Sin habitación'} />
                </Stack>

                {servidor.temas?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                      Temas asignados
                    </Typography>
                    <Typography fontWeight={700}>
                      {servidor.temas.map((tema) => typeof tema === 'object' ? tema.nombre || tema.titulo : tema).filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                )}

                {api.loading && <CircularProgress size={24} />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
