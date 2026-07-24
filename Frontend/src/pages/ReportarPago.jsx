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
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  buscarPersonaPago,
  obtenerMiServidorPago,
  obtenerValorRetiroPago,
  reportarPagoPublico
} from '../api/pagosApi';

const MAX = 5 * 1024 * 1024;
const TIPOS_ARCHIVO = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const FORM_INICIAL = {
  valorReportado: '',
  fechaPago: '',
  medioPago: 'Transferencia',
  entidadPago: '',
  referenciaPago: '',
  nombrePagador: '',
  telefonoPagador: '',
  observaciones: '',
  archivo: null
};

function moneda(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

export default function ReportarPago() {
  const nav = useNavigate();
  const { autenticado, token, loading: authLoading } = useAuth();

  // En la ruta pública continúa siendo un reporte para caminante.
  // Al ingresar autenticado se solicita expresamente escoger el tipo de persona.
  const [tipoPersona, setTipoPersona] = useState('');
  const [criterio, setCriterio] = useState('');
  const [persona, setPersona] = useState(null);
  const [valorRetiro, setValorRetiro] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    setTipoPersona(autenticado ? '' : 'Caminante');
  }, [autenticado, authLoading]);

  useEffect(() => {
    let vigente = true;

    async function consultarValor() {
      if (!tipoPersona) {
        setValorRetiro(null);
        return;
      }

      try {
        const valor = await obtenerValorRetiroPago(tipoPersona);
        if (vigente) setValorRetiro(valor);
      } catch {
        if (vigente) setValorRetiro(null);
      }
    }

    consultarValor();
    return () => {
      vigente = false;
    };
  }, [tipoPersona]);

  const etiquetaPersona = tipoPersona === 'Servidor' ? 'servidor' : 'caminante';

  const valorInformativo = useMemo(
    () => persona?.valorRetiro || valorRetiro,
    [persona, valorRetiro]
  );

  function cambiarTipo(_, nuevoTipo) {
    if (!nuevoTipo) return;
    setTipoPersona(nuevoTipo);
    setCriterio('');
    setPersona(null);
    setForm(FORM_INICIAL);
    setError('');
  }

  async function cargarMiServidor() {
    try {
      setLoading(true);
      setError('');
      const datos = await obtenerMiServidorPago(token);
      setPersona(datos);
      setValorRetiro(datos?.valorRetiro || valorRetiro);
      setForm(actual => ({
        ...actual,
        nombrePagador: actual.nombrePagador || datos?.nombre || '',
        telefonoPagador: actual.telefonoPagador || datos?.celular || ''
      }));
    } catch (e) {
      setPersona(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function buscar() {
    try {
      setLoading(true);
      setError('');
      const datos = await buscarPersonaPago(tipoPersona, criterio);
      setPersona(datos);
      setValorRetiro(datos?.valorRetiro || valorRetiro);
      setForm(actual => ({
        ...actual,
        nombrePagador: actual.nombrePagador || datos?.nombre || '',
        telefonoPagador: actual.telefonoPagador || datos?.celular || ''
      }));
    } catch (e) {
      setPersona(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function seleccionarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!TIPOS_ARCHIVO.includes(archivo.type) || archivo.size > MAX) {
      setError('Solo PDF, JPG, JPEG o PNG de máximo 5 MB.');
      return;
    }

    setError('');
    const lector = new FileReader();
    lector.onload = () =>
      setForm(actual => ({
        ...actual,
        archivo: {
          nombre: archivo.name,
          tipo: archivo.type,
          base64: String(lector.result).split(',')[1]
        }
      }));
    lector.readAsDataURL(archivo);
  }

  async function enviar() {
    try {
      setLoading(true);
      setError('');

      const valorPago = Number(form.valorReportado);
      if (
        valorPago > Number(persona.saldoPendiente || 0) &&
        !window.confirm(
          `El pago supera el saldo en ${moneda(
            valorPago - Number(persona.saldoPendiente || 0)
          )}. ¿Deseas continuar?`
        )
      ) {
        return;
      }

      await reportarPagoPublico({
        ...form,
        tipoPersona,
        personaId: persona.id,
        criterio: criterio || persona.documentoIdentidad || persona.numeroInscripcion || ''
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
    nav(autenticado ? '/dashboard' : '/');
  }

  if (authLoading) return null;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Button onClick={() => nav(autenticado ? '/dashboard' : '/')}>Volver</Button>

          <Typography variant="h3" fontWeight={900}>
            Reportar pago
          </Typography>

          {autenticado && !tipoPersona && (
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  ¿Para quién vas a reportar el pago?
                </Typography>
                <Typography color="text.secondary">
                  Selecciona si el comprobante corresponde a un caminante o a un servidor.
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={tipoPersona}
                  onChange={cambiarTipo}
                >
                  <ToggleButton value="Caminante">
                    <GroupsRounded sx={{ mr: 1 }} /> Caminante
                  </ToggleButton>
                  <ToggleButton value="Servidor">
                    <PersonRounded sx={{ mr: 1 }} /> Servidor
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Paper>
          )}

          {tipoPersona && (
            <>
              {autenticado && (
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={tipoPersona}
                  onChange={cambiarTipo}
                >
                  <ToggleButton value="Caminante">Caminante</ToggleButton>
                  <ToggleButton value="Servidor">Servidor</ToggleButton>
                </ToggleButtonGroup>
              )}

              <Alert severity="info">
                El retiro para {etiquetaPersona} tiene un costo de{' '}
                <strong>
                  {valorInformativo ? moneda(valorInformativo) : 'valor parametrizado'}
                </strong>.
                Puedes realizar el pago total o hacer abonos parciales. Cada comprobante será revisado por Tesorería.
              </Alert>

              {error && <Alert severity="error">{error}</Alert>}

              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Stack spacing={2}>
                  {tipoPersona === 'Servidor' && autenticado && !persona && (
                    <Button
                      variant="contained"
                      onClick={cargarMiServidor}
                      disabled={loading || !token}
                    >
                      {loading ? 'Consultando...' : 'Consultar mis datos como servidor'}
                    </Button>
                  )}

                  {!persona && (
                    <>
                      {tipoPersona === 'Servidor' && autenticado && (
                        <Typography variant="body2" color="text.secondary">
                          También puedes buscar otro servidor por documento o número de inscripción.
                        </Typography>
                      )}

                      <TextField
                        label={
                          tipoPersona === 'Servidor'
                            ? 'Documento o número de inscripción del servidor'
                            : 'Código de inscripción o documento del caminante'
                        }
                        value={criterio}
                        onChange={e => setCriterio(e.target.value)}
                      />

                      <Button
                        variant="outlined"
                        onClick={buscar}
                        disabled={loading || !criterio.trim()}
                      >
                        {loading ? 'Buscando...' : `Buscar ${etiquetaPersona}`}
                      </Button>
                    </>
                  )}

                  {persona && (
                    <>
                      <Alert severity="success">
                        <b>{persona.nombre}</b>
                        <br />
                        Tipo: {tipoPersona}
                        <br />
                        Valor del retiro: {moneda(persona.valorRetiro)}
                        <br />
                        Estado: {persona.estadoPago}
                        <br />
                        Abonado: {moneda(persona.totalAprobado)} · Saldo: {moneda(persona.saldoPendiente)}
                      </Alert>

                      <Button
                        size="small"
                        onClick={() => {
                          setPersona(null);
                          setCriterio('');
                          setForm(FORM_INICIAL);
                          setError('');
                        }}
                      >
                        Cambiar persona
                      </Button>

                      <TextField
                        label="Valor pagado"
                        type="number"
                        value={form.valorReportado}
                        onChange={e => setForm({ ...form, valorReportado: e.target.value })}
                      />

                      <TextField
                        label="Fecha del pago"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={form.fechaPago}
                        onChange={e => setForm({ ...form, fechaPago: e.target.value })}
                      />

                      <TextField
                        select
                        label="Medio de pago"
                        value={form.medioPago}
                        onChange={e => setForm({ ...form, medioPago: e.target.value })}
                      >
                        <MenuItem value="Transferencia">Transferencia</MenuItem>
                        <MenuItem value="Consignación">Consignación</MenuItem>
                        <MenuItem value="Efectivo">Efectivo</MenuItem>
                        <MenuItem value="Otro">Otro</MenuItem>
                      </TextField>

                      <TextField
                        label="Banco o entidad"
                        value={form.entidadPago}
                        onChange={e => setForm({ ...form, entidadPago: e.target.value })}
                      />

                      <TextField
                        label="Referencia"
                        value={form.referenciaPago}
                        onChange={e => setForm({ ...form, referenciaPago: e.target.value })}
                      />

                      <TextField
                        label="Nombre de quien pagó"
                        value={form.nombrePagador}
                        onChange={e => setForm({ ...form, nombrePagador: e.target.value })}
                      />

                      <TextField
                        label="Teléfono de quien pagó"
                        value={form.telefonoPagador}
                        onChange={e =>
                          setForm({
                            ...form,
                            telefonoPagador: e.target.value.replace(/\D/g, '').slice(0, 10)
                          })
                        }
                      />

                      <Button component="label" variant="outlined">
                        Adjuntar comprobante
                        <input
                          hidden
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={seleccionarArchivo}
                        />
                      </Button>

                      {form.archivo && (
                        <Typography variant="body2">{form.archivo.nombre}</Typography>
                      )}

                      <TextField
                        label="Observaciones"
                        multiline
                        minRows={2}
                        value={form.observaciones}
                        onChange={e => setForm({ ...form, observaciones: e.target.value })}
                      />

                      <Button
                        startIcon={<PaymentsRounded />}
                        variant="contained"
                        onClick={enviar}
                        disabled={
                          loading ||
                          !form.valorReportado ||
                          Number(form.valorReportado) <= 0 ||
                          !form.fechaPago ||
                          !form.nombrePagador.trim() ||
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
            </>
          )}
        </Stack>
      </Container>

      <Dialog
        open={confirmacionAbierta}
        onClose={cerrarConfirmacion}
        aria-labelledby="confirmacion-pago-titulo"
      >
        <DialogTitle id="confirmacion-pago-titulo">Comprobante recibido</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hemos recibido correctamente tu comprobante de pago. Estamos pendientes de validar la información y actualizar el estado del pago. Muchas gracias.
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
