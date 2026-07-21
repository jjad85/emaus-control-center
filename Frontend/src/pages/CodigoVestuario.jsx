import {
  Alert,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import CheckroomRounded from '@mui/icons-material/CheckroomRounded';
import ReactMarkdown from 'react-markdown';
import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

const DIAS = [
  {
    clave: 'Viernes',
    imagen: 'vestuarioViernesImagenUrl',
    texto: 'vestuarioViernesTexto',
    predeterminado:
      'Camisa tipo polo roja con el nombre **Emaús** en color blanco, ubicado al lado izquierdo del pecho.\n\nCombínala con pantalón tipo jean azul.',
  },
  {
    clave: 'Sábado',
    imagen: 'vestuarioSabadoImagenUrl',
    texto: 'vestuarioSabadoTexto',
    predeterminado:
      'Camisa tipo polo azul oscuro con el nombre **Emaús** en color dorado, ubicado al lado izquierdo del pecho.\n\nCombínala con pantalón color caqui.',
  },
  {
    clave: 'Domingo',
    imagen: 'vestuarioDomingoImagenUrl',
    texto: 'vestuarioDomingoTexto',
    predeterminado:
      'Camisa tipo polo blanca con el nombre **Emaús** y una rosa en color rojo, ubicados al lado izquierdo del pecho.\n\nCombínala con pantalón negro.',
  },
];

export default function CodigoVestuario() {
  const api = useApi(() => obtenerConfiguraciones(), []);

  if (api.loading && !api.data) return <LoadingState />;

  const config = api.data || {};

  return (
    <Stack spacing={3}>
      <PageHeader
        title={config.vestuarioTitulo || 'Código de vestuario'}
        subtitle={
          config.vestuarioIntroduccion ||
          'Consulta la vestimenta definida para cada día del retiro.'
        }
      />

      {api.error && (
        <Alert severity="warning">
          No fue posible cargar toda la configuración. Se muestra la información
          predeterminada.
        </Alert>
      )}

      <Grid container spacing={3}>
        {DIAS.map((dia) => {
          const url = config[dia.imagen];

          return (
            <Grid key={dia.clave} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                {url ? (
                  <CardMedia
                    component="img"
                    height="390"
                    image={url}
                    alt={`Código de vestuario del ${dia.clave.toLowerCase()}`}
                    sx={{
                      objectFit: 'contain',
                      bgcolor: 'grey.100',
                      p: 1,
                    }}
                  />
                ) : (
                  <Stack
                    height={390}
                    alignItems="center"
                    justifyContent="center"
                    bgcolor="grey.100"
                    color="text.secondary"
                    spacing={1}
                    px={2}
                    textAlign="center"
                  >
                    <CheckroomRounded sx={{ fontSize: 72 }} />
                    <Typography fontWeight={800}>
                      Imagen pendiente de configurar
                    </Typography>
                  </Stack>
                )}

                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="overline"
                    color="primary"
                    fontWeight={900}
                  >
                    Vestuario del día
                  </Typography>

                  <Typography variant="h5" fontWeight={950} mb={2}>
                    {dia.clave}
                  </Typography>

                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <Typography
                          color="text.secondary"
                          lineHeight={1.7}
                          paragraph
                        >
                          {children}
                        </Typography>
                      ),
                      strong: ({ children }) => (
                        <Typography
                          component="span"
                          fontWeight={700}
                          color="text.primary"
                        >
                          {children}
                        </Typography>
                      ),
                      ul: ({ children }) => (
                        <Box component="ul" sx={{ pl: 3, mt: 1, mb: 2 }}>
                          {children}
                        </Box>
                      ),
                      ol: ({ children }) => (
                        <Box component="ol" sx={{ pl: 3, mt: 1, mb: 2 }}>
                          {children}
                        </Box>
                      ),
                      li: ({ children }) => (
                        <Typography
                          component="li"
                          color="text.secondary"
                          lineHeight={1.7}
                        >
                          {children}
                        </Typography>
                      ),
                    }}
                  >
                    {config[dia.texto] || dia.predeterminado}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}