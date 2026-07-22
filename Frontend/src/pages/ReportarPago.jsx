import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  buscarPersonaPago,
  obtenerMiServidorPago,
  reportarPagoPublico
} from '../api/pagosApi';

const MAX = 5 * 1024 * 1024;
const TIPOS_ARCHIVO = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function moneda(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  });
}

export default function ReportarPago() {
  const nav = useNavigate();
  const location = useLocation();
  const { token, autenticado } = useAuth();
  const params = new URLSearchParams(location.search);
  const tipoInicial = params.get('tipo') === 'servidor' ? 'servidor' : 'caminante';
  const idInicial = params.get('id') || '';
  const esMiCuenta = params.get('miCuenta') === '1';

  const [tipoPersona, setTipoPersona] = useState(tipoInicial);
  const [criterio, setCriterio] = useState('');
  const [persona, setPersona] = useState(null);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [form, setForm] = useState({
    valorReportado: '', fechaPago: '', medioPago: 'Transferencia',
    entidadPago: '', referenciaPago: '', nombrePagador: '',
    telefonoPagador: '', observaciones: '', archivo: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let activo = true;
    async function precargar() {
      if (!idInicial && !esMiCuenta) return;
      try {
        setLoading(true);
        setError('');
        const datos = esMiCuenta
          ? await obtenerMiServidorPago(token)
          : await buscarPersonaPago('servidor', '', idInicial);
        if (activo) {
          setTipoPersona('servidor');
          setPersona(datos);
          setCriterio(datos.nombre || '');
        }
      } catch (e) {
        if (activo) setError(e.message || 'No fue posible consultar el servidor.');
      } finally {
        if (activo) setLoading(false);
      }
    }
    if (!esMiCuenta || autenticado) precargar();
    return () => { activo = false; };
  }, [idInicial, esMiCuenta, token, autenticado]);

  async function buscar() {
    try {
      setLoading(true);
      setError('');
      setPersona(await buscarPersonaPago(tipoPersona, criterio));
    } catch (e) {
      setPersona(null);
      setError(e.message || 'No fue posible consultar la persona.');
    } finally {
      setLoading(false);
    }
  }

  function seleccionarArchivo(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!TIPOS_ARCHIVO.includes(f.type) || f.size > MAX) {
      setError('Solo PDF, JPG, JPEG o PNG de máximo 5 MB.');
      return;
    }
    setError('');
    const lector = new FileReader();
    lector.onload = () => setForm(actual => ({
      ...actual,
      archivo: { nombre: f.name, tipo: f.type, base64: String(lector.result).split(',')[1] }
    }));
    lector.readAsDataURL(f);
  }

  async function enviar() {
    if (!persona) return;
    try {
      setLoading(true);
      setError('');
      const excedente = Number(form.valorReportado) - Number(persona.saldoPendiente || 0);
      if (excedente > 0 && !window.confirm(`El pago supera el saldo en ${moneda(excedente)}. ¿Deseas continuar?`)) return;
      await reportarPagoPublico({
        ...form,
        tipoPersona,
        personaId: persona.id,
        criterio
      });
      setConfirmacionAbierta(true);
    } catch (e) {
      setError(e.message || 'No fue posible reportar el pago.');
    } finally {
      setLoading(false);
    }
  }

  function cerrarConfirmacion() {
    setConfirmacionAbierta(false);
    nav(autenticado ? '/dashboard' : '/');
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Button onClick={() => nav(autenticado ? -1 : '/')}>Volver</Button>
          <Typography variant="h3" fontWeight={900}>Reportar pago</Typography>

          {persona?.valorRetiro ? (
            <Alert severity="info">
              El retiro tiene un costo de <strong>{moneda(persona.valorRetiro)}</strong>. Puedes realizar el pago total o hacer abonos parciales. Cada comprobante será revisado por tesorería.
            </Alert>
          ) : (
            <Alert severity="info">Consulta primero al caminante o servidor para conocer el costo y el saldo pendiente.</Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Stack spacing={2}>
              {!esMiCuenta && !idInicial && (
                <>
                  <TextField select label="Tipo de persona" value={tipoPersona} onChange={e => { setTipoPersona(e.target.value); setPersona(null); }}>
                    <MenuItem value="caminante">Caminante</MenuItem>
                    <MenuItem value="servidor">Servidor</MenuItem>
                  </TextField>
                  <TextField
                    label={tipoPersona === 'servidor' ? 'Nombre, correo o celular del servidor' : 'Código de inscripción o documento'}
                    value={criterio}
                    onChange={e => setCriterio(e.target.value)}
                  />
                  <Button variant="contained" onClick={buscar} disabled={loading || !criterio}>
                    Buscar {tipoPersona}
                  </Button>
                </>
              )}

              {loading && !persona && <Alert severity="info">Consultando información…</Alert>}

              {persona && (
                <>
                  <Alert severity="success">
                    <strong>{persona.nombre}</strong><br />
                    Tipo: {tipoPersona === 'servidor' ? 'Servidor' : 'Caminante'}<br />
                    Pago: {persona.estadoPago === 'Pago Parcial' ? 'Parcial' : persona.estadoPago === 'Pago Total' ? 'Total' : 'Pendiente'}<br />
                    Abonado aprobado: {moneda(persona.totalAprobado)} · Saldo: {moneda(persona.saldoPendiente)}
                  </Alert>

                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                      Historial de pagos
                    </Typography>

                    {!persona.pagos?.length ? (
                      <Alert severity="info">Esta persona todavía no tiene pagos reportados.</Alert>
                    ) : (
                      <Stack spacing={1.5}>
                        {persona.pagos.map((pago, index) => (
                          <Paper key={pago.id || index} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                            <Stack spacing={1}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                spacing={0.5}
                              >
                                <Typography fontWeight={800}>
                                  {moneda(pago.valorReportado)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={800}
                                  color={
                                    pago.estado === 'Aprobado'
                                      ? 'success.main'
                                      : pago.estado === 'Rechazado'
                                        ? 'error.main'
                                        : 'warning.main'
                                  }
                                >
                                  {pago.estado || 'Pendiente'}
                                </Typography>
                              </Stack>

                              <Divider />

                              <Typography variant="body2">
                                <strong>Fecha del pago:</strong> {pago.fechaPago || 'No informada'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Medio:</strong> {pago.medioPago || 'No informado'}
                                {pago.entidadPago ? ` · ${pago.entidadPago}` : ''}
                              </Typography>
                              {pago.referenciaPago && (
                                <Typography variant="body2">
                                  <strong>Referencia:</strong> {pago.referenciaPago}
                                </Typography>
                              )}
                              {pago.estado === 'Aprobado' && (
                                <Typography variant="body2">
                                  <strong>Valor aprobado:</strong> {moneda(pago.valorAprobado ?? pago.valorReportado)}
                                </Typography>
                              )}
                              {pago.observacionesTesoreria && (
                                <Typography variant="body2">
                                  <strong>Observación de tesorería:</strong> {pago.observacionesTesoreria}
                                </Typography>
                              )}
                              {pago.comprobanteUrl && (
                                <Button
                                  component="a"
                                  href={pago.comprobanteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="text"
                                  size="small"
                                  sx={{ alignSelf: 'flex-start', px: 0 }}
                                >
                                  Ver comprobante
                                </Button>
                              )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Divider />

                  <Typography variant="h6" fontWeight={800}>
                    Registrar un nuevo pago
                  </Typography>

                  <TextField label="Valor pagado" type="number" value={form.valorReportado} onChange={e => setForm({ ...form, valorReportado: e.target.value })} required />
                  <TextField label="Fecha del pago" type="date" InputLabelProps={{ shrink: true }} value={form.fechaPago} onChange={e => setForm({ ...form, fechaPago: e.target.value })} required />
                  <TextField select label="Medio de pago" value={form.medioPago} onChange={e => setForm({ ...form, medioPago: e.target.value })}>
                    <MenuItem value="Transferencia">Transferencia</MenuItem>
                    <MenuItem value="Consignación">Consignación</MenuItem>
                    <MenuItem value="Efectivo">Efectivo</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </TextField>
                  <TextField label="Banco o entidad" value={form.entidadPago} onChange={e => setForm({ ...form, entidadPago: e.target.value })} />
                  <TextField label="Referencia" value={form.referenciaPago} onChange={e => setForm({ ...form, referenciaPago: e.target.value })} />
                  <TextField label="Nombre de quien pagó" value={form.nombrePagador} onChange={e => setForm({ ...form, nombrePagador: e.target.value })} />
                  <TextField label="Teléfono de quien pagó" value={form.telefonoPagador} onChange={e => setForm({ ...form, telefonoPagador: e.target.value })} />
                  <TextField label="Observaciones" multiline minRows={3} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
                  <Button variant="outlined" component="label">
                    {form.archivo ? form.archivo.nombre : 'Adjuntar comprobante'}
                    <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={seleccionarArchivo} />
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PaymentsRounded />}
                    onClick={enviar}
                    disabled={loading || !form.valorReportado || !form.fechaPago || !form.archivo}
                  >
                    Enviar comprobante
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <Dialog open={confirmacionAbierta} onClose={cerrarConfirmacion}>
        <DialogTitle>Comprobante recibido</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Recibimos el comprobante. Quedó pendiente de validación por tesorería. Muchas gracias.
          </DialogContentText>
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={cerrarConfirmacion}>Aceptar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
