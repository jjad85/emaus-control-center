import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    primary: { main: '#2f6f5e', light: '#dfeee9', dark: '#214d42' },
    background: { default: '#f4f6f8', paper: '#fff' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(31,41,55,.07)' } } },
    MuiPaper: { styleOverrides: { root: { border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(31,41,55,.07)' } } },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
