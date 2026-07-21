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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buscarCaminantePago,
  reportarPagoPublico
} from '../api/pagosApi';

const MAX = 5 * 1024 * 1024;
const TIPOS = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

// Cambia este valor por el costo real del retiro.
const COSTO_RETIRO = 'XXX';

export default function ReportarPago() {
  const nav = useNavigate();

  const [criterio, setCriterio] = useState('');
  const [caminante, setCaminante] = useState(null);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

  const [form, setForm] = useState({
    valorReportado: '',
    fechaPago: '',
    medioPago: 'Transferencia',
    entidadPago: '',
    referenciaPago: '',
    nombrePagador: '',
    telefonoPagador: '',
    observaciones: '',
    archivo: null
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function buscar() {
    try {
      setLoading(true);
      setError('');
      setCaminante(await buscarCaminantePago(criterio));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function archivo(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!TIPOS.includes(f.type) || f.size > MAX) {
      setError('Solo PDF, JPG, JPEG o PNG de máximo 5 MB.');
      return;
    }

    setError('');

    const r = new FileReader();
    r.onload = () =>
      setForm(actual => ({
        ...actual,
        archivo: {
          nombre: f.name,
          tipo: f.type,
          base64: String(r.result).split(',')[1]
        }
      }));

    r.readAsDataURL(f);
  }

  async function enviar() {
    try {
      setLoading(true);
      setError('');

      if (
        Number(form.valorReportado) > caminante.saldoPendiente &&
        !window.confirm(
          `El pago supera el saldo en $${(
            Number(form.valorReportado) - caminante.saldoPendiente
          ).toLocaleString('es-CO')}. ¿Deseas continuar?`
        )
      ) {
        return;
      }

      await reportarPagoPublico({
        ...form,
        criterio
      });

      setConfirmacionAbierta(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function cerrarConfirmacion() {
    setConfirmacionAbierta(false);
    nav('/');
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Button onClick={() => nav('/')}>Volver</Button>

          <Typography variant="h3" fontWeight={900}>
            Reportar pago
          </Typography>

          <Alert severity="info">
            El retiro tiene un costo de <strong>${COSTO_RETIRO}</strong>.
            Puedes realizar el pago total o hacer abonos parciales hasta
            completar el valor del retiro. Cada comprobante será revisado y
            validado por el equipo encargado.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Stack spacing={2}>
              <TextField
                label="Código de inscripción o documento"
                value={criterio}
                onChange={e => setCriterio(e.target.value)}
              />

              <Button
                variant="contained"
                onClick={buscar}
                disabled={loading || !criterio}
              >
                Buscar caminante
              </Button>

              {caminante && (
                <>
                  <Alert severity="info">
                    <b>{caminante.nombre}</b>
                    <br />
                    Estado: {caminante.estadoPago}
                    <br />
                    Abonado: $
                    {Number(caminante.totalAprobado).toLocaleString('es-CO')} ·
                    Saldo: $
                    {Number(caminante.saldoPendiente).toLocaleString('es-CO')}
                  </Alert>

                  <TextField
                    label="Valor pagado"
                    type="number"
                    value={form.valorReportado}
                    onChange={e =>
                      setForm({ ...form, valorReportado: e.target.value })
                    }
                  />

                  <TextField
                    label="Fecha del pago"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={form.fechaPago}
                    onChange={e =>
                      setForm({ ...form, fechaPago: e.target.value })
                    }
                  />

                  <TextField
                    select
                    label="Medio de pago"
                    value={form.medioPago}
                    onChange={e =>
                      setForm({ ...form, medioPago: e.target.value })
                    }
                  >
                    <MenuItem value="Transferencia">Transferencia</MenuItem>
                    <MenuItem value="Consignación">Consignación</MenuItem>
                    <MenuItem value="Efectivo">Efectivo</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </TextField>

                  <TextField
                    label="Banco o entidad"
                    value={form.entidadPago}
                    onChange={e =>
                      setForm({ ...form, entidadPago: e.target.value })
                    }
                  />

                  <TextField
                    label="Referencia"
                    value={form.referenciaPago}
                    onChange={e =>
                      setForm({ ...form, referenciaPago: e.target.value })
                    }
                  />

                  <TextField
                    label="Nombre de quien pagó"
                    value={form.nombrePagador}
                    onChange={e =>
                      setForm({ ...form, nombrePagador: e.target.value })
                    }
                  />

                  <TextField
                    label="Teléfono de quien pagó"
                    value={form.telefonoPagador}
                    onChange={e =>
                      setForm({
                        ...form,
                        telefonoPagador: e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10)
                      })
                    }
                  />

                  <Button component="label" variant="outlined">
                    Adjuntar comprobante
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={archivo}
                    />
                  </Button>

                  {form.archivo && (
                    <Typography variant="body2">
                      {form.archivo.nombre}
                    </Typography>
                  )}

                  <TextField
                    label="Observaciones"
                    multiline
                    minRows={2}
                    value={form.observaciones}
                    onChange={e =>
                      setForm({ ...form, observaciones: e.target.value })
                    }
                  />

                  <Button
                    startIcon={<PaymentsRounded />}
                    variant="contained"
                    onClick={enviar}
                    disabled={
                      loading ||
                      !form.valorReportado ||
                      !form.fechaPago ||
                      !form.nombrePagador ||
                      !/^3\d{9}$/.test(form.telefonoPagador) ||
                      !form.archivo
                    }
                  >
                    {loading ? 'Enviando...' : 'Enviar comprobante de pago'}
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <Dialog
        open={confirmacionAbierta}
        onClose={cerrarConfirmacion}
        aria-labelledby="confirmacion-pago-titulo"
      >
        <DialogTitle id="confirmacion-pago-titulo">
          Comprobante recibido
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hemos recibido correctamente tu comprobante de pago. Estamos
            pendientes de validar la información y actualizar el estado del
            pago. Muchas gracias.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={cerrarConfirmacion} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}