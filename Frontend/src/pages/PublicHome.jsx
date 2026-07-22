import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import LoginRounded from '@mui/icons-material/LoginRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';
import { useApi } from '../hooks/useApi';
import { obtenerPortalPublico } from '../api/publicApi';

function sanitizarHtml(html) {
  return String(html || '')
    .replace(
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      '',
    )
    .replace(
      /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
      '',
    )
    .replace(
      /\son\w+\s*=\s*(['"]).*?\1/gi,
      '',
    )
    .replace(
      /javascript:/gi,
      '',
    );
}

export default function PublicHome() {
  const navigate = useNavigate();

  const {
    autenticado,
    solicitarAutenticacion,
  } = useAuth();

  const portalApi = useApi(
    () => obtenerPortalPublico(),
    [],
  );

  useEffect(() => {
    if (autenticado) {
      navigate('/dashboard', {
        replace: true,
      });
    }
  }, [autenticado, navigate]);

  const portal = portalApi.data || {};

  const registroActivo =
    portal.registroActivo !== false;

  const textoAccesoServidores =
    portal.textoBotonLogin ||
    'Acceso de servidores';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        pt: {
          xs: 2,
          md: 4,
        },
        pb: {
          xs: 14,
          sm: 12,
        },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack
            component="header"
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                color="primary"
                fontWeight={900}
                letterSpacing={1.8}
              >
                EMAÚS
              </Typography>

              <Typography
                variant="h2"
                fontWeight={950}
                sx={{
                  fontSize: {
                    xs: '2.35rem',
                    md: '4rem',
                  },
                  lineHeight: 1.03,
                }}
              >
                {portal.titulo ||
                  'Retiro de Emaús'}
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                mt={1}
              >
                {portal.subtitulo ||
                  'Un espacio para detenernos, encontrarnos y comenzar de nuevo.'}
              </Typography>
            </Box>

          </Stack>

          <Card
            sx={{
              borderRadius: 4,
              boxShadow:
                '0 18px 60px rgba(35,40,38,.10)',
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2.5,
                  md: 4,
                },
              }}
            >
              <Box
                className="portal-html"
                sx={{
                  '& h1, & h2, & h3': {
                    color: 'primary.main',
                  },
                  '& p': {
                    lineHeight: 1.7,
                  },
                  '& a': {
                    color: 'primary.main',
                  },
                  '& blockquote': {
                    borderLeftColor:
                      'primary.main !important',
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html: sanitizarHtml(
                    portal.contenidoHtml,
                  ),
                }}
              />

            </CardContent>
          </Card>

          <Typography
            variant="caption"
            textAlign="center"
            color="text.secondary"
          >
            Centro de Control EMAÚS · Información
            administrada por el equipo organizador.
          </Typography>
        </Stack>
      </Container>

      <Box
        component="nav"
        aria-label="Acciones principales"
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.appBar + 1,
          px: { xs: 1, sm: 2 },
          py: { xs: 1, sm: 1.25 },
          bgcolor: 'rgba(255,255,255,.96)',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -8px 28px rgba(35,40,38,.14)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="md" disableGutters>
          <Stack
            direction="row"
            spacing={{ xs: 0.75, sm: 1.25 }}
            sx={{ width: '100%' }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<HowToRegRounded />}
              disabled={!registroActivo}
              onClick={() => navigate('/registro')}
              sx={{
                minWidth: 0,
                minHeight: { xs: 48, sm: 52 },
                borderRadius: 999,
                px: { xs: 0.75, sm: 2 },
                fontSize: { xs: '0.72rem', sm: '0.9rem' },
                fontWeight: 850,
                lineHeight: 1.15,
                textTransform: 'none',
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                transition:
                  'transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease',
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.4, sm: 1 },
                },
                boxShadow:
                  '0 4px 12px rgba(23,59,52,.20)',
                '&:hover': {
                  bgcolor: '#215148',
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 10px 22px rgba(23,59,52,.34)',
                },
              }}
            >
              {registroActivo
                ? portal.textoBotonRegistro || 'Inscribirse'
                : 'Inscripciones cerradas'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<PaymentsRounded />}
              onClick={() => navigate('/reportar-pago')}
              sx={{
                minWidth: 0,
                minHeight: { xs: 48, sm: 52 },
                borderRadius: 999,
                px: { xs: 0.75, sm: 2 },
                bgcolor: '#FFFFFF',
                color: '#173B34',
                borderColor: '#173B34',
                fontSize: { xs: '0.72rem', sm: '0.9rem' },
                fontWeight: 850,
                lineHeight: 1.15,
                textTransform: 'none',
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                transition:
                  'transform .18s ease, box-shadow .18s ease, background-color .18s ease, color .18s ease, border-color .18s ease',
                boxShadow:
                  '0 2px 8px rgba(23,59,52,.10)',
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.4, sm: 1 },
                },
                '&:hover': {
                  bgcolor: '#E7F1ED',
                  color: '#0F2F29',
                  borderColor: '#0F2F29',
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 10px 22px rgba(23,59,52,.24)',
                },
              }}
            >
              Reportar pago
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<LoginRounded />}
              onClick={() => solicitarAutenticacion()}
              sx={{
                minWidth: 0,
                minHeight: { xs: 48, sm: 52 },
                borderRadius: 999,
                px: { xs: 0.75, sm: 2 },
                bgcolor: '#FFFFFF',
                color: '#173B34',
                borderColor: '#173B34',
                fontSize: { xs: '0.72rem', sm: '0.9rem' },
                fontWeight: 850,
                lineHeight: 1.15,
                textTransform: 'none',
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                transition:
                  'transform .18s ease, box-shadow .18s ease, background-color .18s ease, color .18s ease, border-color .18s ease',
                boxShadow:
                  '0 2px 8px rgba(23,59,52,.10)',
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.4, sm: 1 },
                },
                '&:hover': {
                  bgcolor: '#E7F1ED',
                  color: '#0F2F29',
                  borderColor: '#0F2F29',
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 10px 22px rgba(23,59,52,.24)',
                },
              }}
            >
              {textoAccesoServidores}
            </Button>
          </Stack>
        </Container>
      </Box>

      <LoginDialog />
    </Box>
  );
}
