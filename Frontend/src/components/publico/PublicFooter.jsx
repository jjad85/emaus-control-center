import { Box, Container, Divider, Stack, Typography } from '@mui/material';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';

export default function PublicFooter() {
  return (
    <Box component="footer" className="public-footer">
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={3} py={5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeRounded fontSize="small" />
              <Typography fontWeight={950} letterSpacing={1.6}>EMAÚS · SANTA TERESITA  DEL NIÑO JESÚS</Typography>
            </Stack>
            <Typography mt={1} className="public-footer-muted">
              Una comunidad que camina, encuentra y sirve.
            </Typography>
          </Box>
          <Typography className="public-footer-muted" alignSelf={{ md: 'center' }}>
            Centro de Control EMAÚS · Información administrada por el equipo organizador.
          </Typography>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(255,255,255,.09)' }} />
        <Typography py={2.5} variant="caption" className="public-footer-muted">
          © {new Date().getFullYear()} Comunidad EMAÚS. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
}
