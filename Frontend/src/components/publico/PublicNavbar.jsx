import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import LoginRounded from '@mui/icons-material/LoginRounded';

const enlaces = [
  ['Inicio', 'inicio'],
  ['Qué es Emaús', 'que-es-emaus'],
  ['Comunidad', 'comunidad'],
  ['Próximo retiro', 'proximo-retiro'],
  ['Preguntas', 'preguntas'],
];

function irA(id) {
  const destino = document.getElementById(id);

  if (destino) {
    destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  window.location.assign(`/#${id}`);
}

export default function PublicNavbar({ onLogin }) {
  const [open, setOpen] = useState(false);

  const navegar = (id) => {
    setOpen(false);
    irA(id);
  };

  return (
    <>
      <AppBar position="fixed" elevation={0} className="public-navbar">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 70, md: 82 } }}>
            <Box className="public-brand" onClick={() => navegar('inicio')} role="button" tabIndex={0}>
              <Box className="public-brand-mark">E</Box>
              <Box>
                <Typography className="public-brand-name">EMAÚS</Typography>
                <Typography className="public-brand-subtitle">Santa Teresita del Niño Jesús</Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={0.5} sx={{ ml: 'auto', display: { xs: 'none', lg: 'flex' } }}>
              {enlaces.map(([texto, id]) => (
                <Button key={id} onClick={() => navegar(id)} className="public-nav-link">
                  {texto}
                </Button>
              ))}
              <Button onClick={onLogin} className="public-login-button" startIcon={<LoginRounded />}>
                Centro de Control
              </Button>
            </Stack>

            <IconButton
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
              sx={{ ml: 'auto', display: { lg: 'none' }, color: 'white' }}
            >
              <MenuRounded />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ className: 'public-drawer' }}>
        <Box sx={{ width: 300, p: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography fontWeight={900} letterSpacing={1.4}>EMAÚS</Typography>
            <IconButton onClick={() => setOpen(false)}><CloseRounded /></IconButton>
          </Stack>
          <Stack spacing={1}>
            {enlaces.map(([texto, id]) => (
              <Button key={id} onClick={() => navegar(id)} className="public-drawer-link">
                {texto}
              </Button>
            ))}
            <Button variant="contained" onClick={() => { setOpen(false); onLogin(); }} startIcon={<LoginRounded />} sx={{ mt: 2, borderRadius: 999, py: 1.3 }}>
              Centro de Control
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
