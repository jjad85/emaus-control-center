import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import FilterAltRounded from '@mui/icons-material/FilterAltRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';

const ESTADOS = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'ATENCION', label: 'Requieren mi atención' },
  { value: 'COMPLETOS', label: 'Completos' },
  { value: 'AUDIOVISUALES', label: 'Pendientes de Audiovisuales' },
  { value: 'LOGISTICA', label: 'Pendientes de Logística' },
];

const RECURSOS = [
  { value: 'TODOS', label: 'Todos los recursos' },
  { value: 'PRESENTACION', label: 'Presentación' },
  { value: 'CANCION', label: 'Música' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PALANCA', label: 'Palanca' },
];

const ORDENES = [
  { value: 'AGENDA', label: 'Orden del retiro' },
  { value: 'ATENCION', label: 'Prioridad de atención' },
  { value: 'PROGRESO_ASC', label: 'Menor avance primero' },
  { value: 'PROGRESO_DESC', label: 'Mayor avance primero' },
  { value: 'NOMBRE', label: 'Nombre del tema' },
];

export default function FiltrosMisTemas({
  busqueda,
  onBusqueda,
  estado,
  onEstado,
  recurso,
  onRecurso,
  orden,
  onOrden,
  resultados,
  total,
  onLimpiar,
}) {
  const hayFiltros = Boolean(
    busqueda.trim() ||
      estado !== 'TODOS' ||
      recurso !== 'TODOS' ||
      orden !== 'AGENDA'
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        borderColor: 'rgba(20, 75, 62, 0.14)',
        background:
          'linear-gradient(135deg, rgba(245,250,247,.96), rgba(255,253,248,.98))',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={1}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterAltRounded color="primary" />
                <Typography fontWeight={950}>Encuentra rápidamente tu tema</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.25}>
                Busca, filtra y prioriza lo que necesita gestión.
              </Typography>
            </Box>

            <Chip
              label={`${resultados} de ${total} tema${total === 1 ? '' : 's'}`}
              color={resultados < total ? 'primary' : 'default'}
              variant={resultados < total ? 'filled' : 'outlined'}
              sx={{ fontWeight: 850 }}
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(240px, 1.45fr) repeat(3, minmax(170px, .8fr)) auto',
              },
              gap: 1.25,
              alignItems: 'center',
            }}
          >
            <TextField
              value={busqueda}
              onChange={(event) => onBusqueda(event.target.value)}
              placeholder="Buscar por nombre, día, hora o descripción"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Estado"
              size="small"
              value={estado}
              onChange={(event) => onEstado(event.target.value)}
            >
              {ESTADOS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Recurso"
              size="small"
              value={recurso}
              onChange={(event) => onRecurso(event.target.value)}
            >
              {RECURSOS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Ordenar"
              size="small"
              value={orden}
              onChange={(event) => onOrden(event.target.value)}
            >
              {ORDENES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="text"
              startIcon={<RestartAltRounded />}
              onClick={onLimpiar}
              disabled={!hayFiltros}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Limpiar
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
