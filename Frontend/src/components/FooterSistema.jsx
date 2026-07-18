import {
  Box,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import CodeRounded from '@mui/icons-material/CodeRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';

function limpiar(valor) {
  return String(valor || '').trim();
}

function construirEnlaceContacto(contacto) {
  const valor = limpiar(contacto);

  if (!valor) {
    return '';
  }

  if (valor.includes('@')) {
    return `mailto:${valor}`;
  }

  const numero = valor.replace(/[^\d+]/g, '');

  return numero
    ? `tel:${numero}`
    : '';
}

export default function FooterSistema({
  autor,
  version,
  contacto,
  anio,
}) {
  const autorVisible =
    limpiar(autor) ||
    'Autor no configurado';

  const versionVisible =
    limpiar(version) ||
    'Sin configurar';

  const contactoVisible =
    limpiar(contacto) ||
    'No configurado';

  const enlaceContacto =
    construirEnlaceContacto(contacto);

  const anioVisible =
    limpiar(anio) ||
    new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        px: {
          xs: 1.5,
          sm: 2,
          md: 4,
        },
        pb: {
          xs:
            'calc(20px + env(safe-area-inset-bottom))',
          md: 3,
        },
      }}
    >
      <Divider sx={{ mb: 2.25 }} />

      <Stack
        direction={{
          xs: 'column',
          md: 'row',
        }}
        justifyContent="space-between"
        alignItems={{
          xs: 'center',
          md: 'flex-end',
        }}
        spacing={1.5}
        sx={{
          color: 'text.secondary',
          textAlign: {
            xs: 'center',
            md: 'left',
          },
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          spacing={{
            xs: 0.75,
            sm: 2,
          }}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
          >
            <CodeRounded
              sx={{ fontSize: 17 }}
            />

            <Typography
              variant="caption"
              component="span"
            >
              Desarrollado por{' '}
              <Box
                component="span"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                }}
              >
                {autorVisible}
              </Box>
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
          >
            <VerifiedRounded
              sx={{ fontSize: 17 }}
            />

            <Typography
              variant="caption"
              component="span"
            >
              Sistema versión{' '}
              <Box
                component="span"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                }}
              >
                {versionVisible}
              </Box>
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
          >
            <PhoneRounded
              sx={{ fontSize: 17 }}
            />

            <Typography
              variant="caption"
              component="span"
            >
              Contacto:{' '}
              {enlaceContacto ? (
                <Link
                  href={enlaceContacto}
                  underline="hover"
                  color="inherit"
                  sx={{ fontWeight: 800 }}
                >
                  {contactoVisible}
                </Link>
              ) : (
                <Box
                  component="span"
                  sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                  }}
                >
                  {contactoVisible}
                </Box>
              )}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            whiteSpace: {
              md: 'nowrap',
            },
          }}
        >
          © {anioVisible} Todos los derechos reservados.
        </Typography>
      </Stack>
    </Box>
  );
}
