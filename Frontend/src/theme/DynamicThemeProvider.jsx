import { useEffect, useMemo, useState } from 'react';
import { alpha, createTheme, CssBaseline, ThemeProvider } from '@mui/material';

import { obtenerConfiguraciones } from '../api/configuracionesApi';
import { normalizarConfiguracionTema, TEMA_PREDETERMINADO } from './themeConfig';

function actualizarFavicon(url) {
  if (!url) return;
  let enlace = document.querySelector("link[rel='icon']");
  if (!enlace) {
    enlace = document.createElement('link');
    enlace.rel = 'icon';
    document.head.appendChild(enlace);
  }
  enlace.href = url;
}

function crearTema(configuracion) {
  return createTheme({
    palette: {
      mode: configuracion.temaModo === 'oscuro' ? 'dark' : 'light',
      primary: {
        main: configuracion.temaColorPrimario,
        dark: configuracion.temaColorPrimarioOscuro,
        light: configuracion.temaColorSecundario,
        contrastText: configuracion.temaColorTextoMenu,
      },
      secondary: {
        main: configuracion.temaColorSecundario,
        contrastText: configuracion.temaColorPrimarioOscuro,
      },
      success: { main: configuracion.temaColorExito },
      warning: { main: configuracion.temaColorAdvertencia },
      error: { main: configuracion.temaColorError },
      info: { main: configuracion.temaColorInfo },
      background: {
        default: configuracion.temaColorFondo,
        paper: configuracion.temaColorTarjetas,
      },
      text: {
        primary: configuracion.temaColorTexto,
        secondary: configuracion.temaColorTextoSecundario,
      },
      divider: alpha(configuracion.temaColorTexto, 0.12),
    },
    shape: { borderRadius: configuracion.temaBorderRadius },
    typography: {
      fontFamily: configuracion.temaFuente,
      button: { textTransform: 'none', fontWeight: 750 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { minWidth: 320 },
          '::selection': {
            backgroundColor: alpha(configuracion.temaColorSecundario, 0.7),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(configuracion.temaColorTexto, 0.1)}`,
            boxShadow: `0 10px 30px ${alpha(configuracion.temaColorTexto, 0.07)}`,
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: Math.max(8, configuracion.temaBorderRadius - 2) },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    },
    emaus: configuracion,
  });
}

export default function DynamicThemeProvider({ children }) {
  const [configuracion, setConfiguracion] = useState(TEMA_PREDETERMINADO);

  useEffect(() => {
    let activo = true;

    async function cargarConfiguracion() {
      try {
        const datos = await obtenerConfiguraciones();
        if (!activo) return;
        const normalizada = normalizarConfiguracionTema(datos);
        setConfiguracion(normalizada);
        document.title = normalizada.sistemaNombre;
        actualizarFavicon(normalizada.temaFavicon);
      } catch (error) {
        console.error('No fue posible cargar el tema parametrizado.', error);
      }
    }

    cargarConfiguracion();
    return () => { activo = false; };
  }, []);

  const theme = useMemo(() => crearTema(configuracion), [configuracion]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
