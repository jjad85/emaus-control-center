import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { consultarAutorizacionesCaminantePublico, responderAutorizacionesCaminantePublico } from '../api/publicApi';

export default function AutorizacionesCaminante() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    consultarAutorizacionesCaminantePublico(token)
      .then((respuesta) => { if (activo) setDatos(respuesta); })
      .catch((err) => { if (activo) setError(err.message || 'El enlace no es válido.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [token]);

  async function responder(decision) {
    setGuardando(true);
    setError('');
    try {
      const respuesta = await responderAutorizacionesCaminantePublico(token, decision);
      setResultado(respuesta);
    } catch (err) {
      setError(err.message || 'No fue posible registrar la respuesta.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={900}>Autorizaciones del retiro</Typography>
            {datos?.nombre && <Typography color="text.secondary" mt={1}>Hola, {datos.nombre}. Lee ambos textos antes de responder.</Typography>}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {resultado && <Alert severity="success">{resultado.mensaje}</Alert>}

          {!resultado && datos && <>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={900} mb={1.5}>{datos.autorizacionDatosTitulo}</Typography>
              <Box sx={{ '& p': { lineHeight: 1.7 }, '& li': { mb: 1 } }} dangerouslySetInnerHTML={{ __html: datos.autorizacionDatosTextoHtml }} />
            </Paper>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={900} mb={1.5}>{datos.autorizacionFotosTitulo}</Typography>
              <Box sx={{ '& p': { lineHeight: 1.7 }, '& li': { mb: 1 } }} dangerouslySetInnerHTML={{ __html: datos.autorizacionFotosTextoHtml }} />
            </Paper>
            <Alert severity="info">La decisión se aplicará a las dos autorizaciones y el enlace dejará de funcionar después de responder.</Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
              <Button variant="outlined" color="error" disabled={guardando} onClick={() => responder('rechazar')}>Rechazar ambas</Button>
              <Button variant="contained" disabled={guardando} onClick={() => responder('aceptar')}>{guardando ? 'Guardando...' : 'Aceptar ambas'}</Button>
            </Stack>
          </>}
        </Stack>
      </Paper>
    </Container>
  );
}
