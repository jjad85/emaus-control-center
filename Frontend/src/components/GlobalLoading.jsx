import {
  Backdrop,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

const EVENTO_INICIO = 'emaus:api-loading-start';
const EVENTO_FIN = 'emaus:api-loading-end';
const RETRASO_VISUAL_MS = 450;
const TIEMPO_MINIMO_VISIBLE_MS = 500;

export default function GlobalLoading() {
  const [cantidad, setCantidad] = useState(0);
  const [visible, setVisible] = useState(false);

  const temporizadorApertura = useRef(null);
  const temporizadorCierre = useRef(null);
  const inicioVisible = useRef(0);

  useEffect(() => {
    function iniciar() {
      setCantidad((actual) => actual + 1);
    }

    function finalizar() {
      setCantidad((actual) => Math.max(0, actual - 1));
    }

    window.addEventListener(EVENTO_INICIO, iniciar);
    window.addEventListener(EVENTO_FIN, finalizar);

    return () => {
      window.removeEventListener(EVENTO_INICIO, iniciar);
      window.removeEventListener(EVENTO_FIN, finalizar);
      window.clearTimeout(temporizadorApertura.current);
      window.clearTimeout(temporizadorCierre.current);
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(temporizadorApertura.current);
    window.clearTimeout(temporizadorCierre.current);

    if (cantidad > 0) {
      if (!visible) {
        temporizadorApertura.current = window.setTimeout(() => {
          inicioVisible.current = Date.now();
          setVisible(true);
        }, RETRASO_VISUAL_MS);
      }
      return undefined;
    }

    if (!visible) return undefined;

    const transcurrido = Date.now() - inicioVisible.current;
    const espera = Math.max(0, TIEMPO_MINIMO_VISIBLE_MS - transcurrido);

    temporizadorCierre.current = window.setTimeout(() => {
      setVisible(false);
      inicioVisible.current = 0;
    }, espera);

    return () => {
      window.clearTimeout(temporizadorApertura.current);
      window.clearTimeout(temporizadorCierre.current);
    };
  }, [cantidad, visible]);

  return (
    <Backdrop
      open={visible}
      transitionDuration={180}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 100,
        bgcolor: 'rgba(5, 25, 21, .62)',
        backdropFilter: 'blur(5px)',
        cursor: 'wait',
        userSelect: 'none',
        pointerEvents: visible ? 'all' : 'none',
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Paper
        role="alert"
        aria-live="assertive"
        aria-busy="true"
        elevation={18}
        sx={{
          width: 'min(420px, calc(100vw - 32px))',
          px: { xs: 3, sm: 4 },
          py: { xs: 2.5, sm: 3 },
          borderRadius: 5,
          bgcolor: 'rgba(255,255,255,.98)',
          border: '1px solid rgba(23,107,88,.14)',
          boxShadow: '0 24px 70px rgba(5,25,21,.28)',
        }}
      >
        <Stack direction="row" spacing={2.25} alignItems="center">
          <Box
            sx={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(23,107,88,.10)',
              flexShrink: 0,
            }}
          >
            <CircularProgress size={34} thickness={4.5} />
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 950,
                fontSize: '1.08rem',
                color: '#10231f',
              }}
            >
              Procesando solicitud
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.4, lineHeight: 1.55 }}
            >
              Espera un momento. La operación está en curso; evita hacer clic varias veces.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Backdrop>
  );
}
