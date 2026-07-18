import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import LoginRounded from '@mui/icons-material/LoginRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';

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
        py: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack
            component="header"
            sx={{
              position: 'relative',
              pr: {
                xs: 0,
                md: 28,
              },
            }}
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

            <Tooltip
              title="Solo para el equipo organizador del retiro"
              arrow
            >
              <Button
                variant="outlined"
                size="medium"
                startIcon={<LoginRounded />}
                onClick={() =>
                  solicitarAutenticacion()
                }
                sx={{
                  position: {
                    xs: 'static',
                    md: 'absolute',
                  },
                  top: {
                    md: 0,
                  },
                  right: {
                    md: 0,
                  },

                  alignSelf: {
                    xs: 'flex-start',
                    md: 'auto',
                  },

                  flexShrink: 0,
                  minHeight: 46,
                  px: 2.75,
                  borderRadius: 3,

                  bgcolor: '#E8F5E9',
                  color: '#1B5E20',
                  border: '1px solid #A5D6A7',

                  fontWeight: 800,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(27,94,32,.08)',

                  transition: 'all .2s ease',

                  '&:hover': {
                    bgcolor: '#DCEFD9',
                    borderColor: '#81C784',
                    boxShadow: '0 6px 18px rgba(27,94,32,.18)',
                    transform: 'translateY(-1px)',
                  },

                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {textoAccesoServidores}
              </Button>
            </Tooltip>
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

              <Divider sx={{ my: 3 }} />

              {registroActivo ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HowToRegRounded />}
                  onClick={() =>
                    navigate('/registro')
                  }
                  sx={{
                    minHeight: 52,
                    borderRadius: 3,
                    px: 3,
                    fontWeight: 850,
                    textTransform: 'none',
                  }}
                >
                  {portal.textoBotonRegistro ||
                    'Registrarme al retiro'}
                </Button>
              ) : (
                <Typography
                  color="warning.main"
                  fontWeight={800}
                >
                  {portal.mensajeRegistroCerrado ||
                    'Las inscripciones se encuentran cerradas.'}
                </Typography>
              )}
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

      <LoginDialog />
    </Box>
  );
}
