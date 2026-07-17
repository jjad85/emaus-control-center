import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import LoginRounded from '@mui/icons-material/LoginRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';

import {
  useEffect,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';
import { useApi } from '../hooks/useApi';
import { obtenerPortalPublico } from '../api/publicApi';

function sanitizarHtml(html) {
  return String(html || '')
    .replace(
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      ''
    )
    .replace(
      /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
      ''
    )
    .replace(
      /\son\w+\s*=\s*(['"]).*?\1/gi,
      ''
    )
    .replace(
      /javascript:/gi,
      ''
    );
}

export default function PublicHome() {
  const navigate =
    useNavigate();

  const {
    autenticado,
    solicitarAutenticacion,
  } = useAuth();

  const portalApi = useApi(
    () => obtenerPortalPublico(),
    []
  );

  useEffect(() => {
    if (autenticado) {
      navigate(
        '/dashboard',
        {
          replace: true,
        }
      );
    }
  }, [
    autenticado,
    navigate,
  ]);

  const portal =
    portalApi.data || {};

  const registroActivo =
    portal.registroActivo !==
    false;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#f5efe3',
        py: {
          xs: 3,
          md: 7,
        },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box>
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
                sx={{
                  '& h1, & h2, & h3': {
                    color: '#173b34',
                  },
                  '& p': {
                    lineHeight: 1.7,
                  },
                  '& a': {
                    color: 'primary.main',
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    sanitizarHtml(
                      portal.contenidoHtml
                    ),
                }}
              />

              <Divider sx={{ my: 3 }} />

              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                spacing={1.5}
              >
                {registroActivo ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      <HowToRegRounded />
                    }
                    onClick={() =>
                      navigate(
                        '/registro'
                      )
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

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={
                    <LoginRounded />
                  }
                  onClick={() =>
                    solicitarAutenticacion()
                  }
                  sx={{
                    minHeight: 52,
                    borderRadius: 3,
                    px: 3,
                    fontWeight: 800,
                    textTransform: 'none',
                  }}
                >
                  {portal.textoBotonLogin ||
                    'Ingresar al centro de control'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Typography
            variant="caption"
            textAlign="center"
            color="text.secondary"
          >
            Centro de Control EMAÚS · Información administrada por el equipo organizador.
          </Typography>
        </Stack>
      </Container>

      <LoginDialog />
    </Box>
  );
}
