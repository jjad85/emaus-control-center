import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import CloseRounded from '@mui/icons-material/CloseRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import PasswordRecoveryDialog from './PasswordRecoveryDialog';
import '../styles/portalPublico.css';

export default function LoginDialog() {
  const navigate = useNavigate();
  const { loginOpen, cerrarLogin, login, mensajeSesion } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!usuario.trim() || !clave) {
      setError('Ingrese usuario y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const sesion = await login(usuario.trim(), clave);
      if (sesion.debeCambiarPassword) navigate('/cambiar-password-inicial', { replace: true });
      setUsuario('');
      setClave('');
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setError('');
    setClave('');
    setMostrarClave(false);
    cerrarLogin();
  }

  return (
    <Dialog
      open={loginOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      component="form"
      onSubmit={handleSubmit}
      className="login-futuristic"
    >
      <Box className="login-shell">
        <Box className="login-visual">
          <Stack height="100%" justifyContent="space-between" position="relative" zIndex={1}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeRounded />
                <Typography fontWeight={950} letterSpacing={1.5}>EMAÚS</Typography>
              </Stack>
              <Typography variant="h3" fontWeight={950} letterSpacing={-1.6} lineHeight={1.04} mt={7}>
                Servir también es caminar juntos.
              </Typography>
              <Typography mt={2} color="rgba(255,255,255,.64)" lineHeight={1.75}>
                Acceso exclusivo para servidores, líderes y equipos responsables de la preparación del retiro.
              </Typography>
            </Box>
            <Box sx={{ borderLeft: '3px solid #ddb971', pl: 2 }}>
              <Typography fontStyle="italic" color="rgba(255,255,255,.7)">
                “Quédate con nosotros, porque atardece.”
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,.48)">Lucas 24, 29</Typography>
            </Box>
          </Stack>
        </Box>

        <Box className="login-form">
          <IconButton aria-label="Cerrar" onClick={handleClose} disabled={loading} sx={{ position: 'absolute', right: 18, top: 18 }}>
            <CloseRounded />
          </IconButton>

          <Box className="public-icon-shell" sx={{ mb: 2.5 }}><LockRounded /></Box>
          <Typography variant="h4" fontWeight={950} letterSpacing={-0.8}>Centro de Control</Typography>
          <Typography color="text.secondary" mt={1} mb={3}>
            Ingresa con las credenciales asignadas por el equipo administrador.
          </Typography>

          <Stack spacing={1.7}>
            {mensajeSesion && <Alert severity="warning">{mensajeSesion}</Alert>}
            {mensajeRecuperacion && <Alert severity="success">{mensajeRecuperacion}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              autoFocus
              label="Usuario"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              autoComplete="username"
              disabled={loading}
              fullWidth
              className="login-input"
            />
            <TextField
              label="Contraseña"
              type={mostrarClave ? 'text' : 'password'}
              value={clave}
              onChange={(event) => setClave(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              fullWidth
              className="login-input"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setMostrarClave((valor) => !valor)}
                        onMouseDown={(event) => event.preventDefault()}
                        edge="end"
                        disabled={loading}
                      >
                        {mostrarClave ? <VisibilityOffRounded /> : <VisibilityRounded />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" disabled={loading} className="login-submit" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockRounded />}>
              Iniciar sesión
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={() => { setError(''); setMensajeRecuperacion(''); setRecoveryOpen(true); }}
              disabled={loading}
              sx={{ alignSelf: 'center', textTransform: 'none', fontWeight: 800 }}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </Stack>
        </Box>
      </Box>

      <PasswordRecoveryDialog
        open={Boolean(recoveryOpen)}
        onClose={() => setRecoveryOpen(false)}
        onSuccess={(mensaje) => setMensajeRecuperacion(mensaje)}
      />
    </Dialog>
  );
}
