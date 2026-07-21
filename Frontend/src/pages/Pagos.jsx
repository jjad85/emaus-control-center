import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { obtenerPagos, validarPago } from '../api/pagosApi';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

function formatearMoneda(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

function formatearTamano(bytes) {
  const total = Number(bytes || 0);
  if (!total) return 'No informado';
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}

function Dato({ etiqueta, valor }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {valor || 'No informado'}
      </Typography>
    </Box>
  );
}

export default function Pagos() {
  const { token } = useAuth();
  const api = useApi(() => obtenerPagos(token), [token]);
  const [selected, setSelected] = useState(null);
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  if (api.loading) return <LoadingState />;

  function abrirDetalle(pago) {
    setSelected(pago);
    setValor(String(pago.valorReportado || ''));
    setObs(pago.observacionesTesoreria || '');
    setMotivo(pago.motivoModificacionValor || '');
    setErrorAccion('');
  }

  function cerrarDetalle() {
    if (guardando) return;
    setSelected(null);
    setErrorAccion('');
  }

  async function resolver(estado) {
    try {
      setGuardando(true);
      setErrorAccion('');
      await validarPago(token, selected.id, {
        estado,
        valorAprobado: valor,
        observacionesTesoreria: obs,
        motivoModificacionValor: motivo
      });
      setSelected(null);
      api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible validar el pago.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Pagos"
        subtitle="Validación de comprobantes reportados"
      />

      {api.error && <Alert severity="error">{api.error.message}</Alert>}

      {(api.data || []).map(p => (
        <Card key={p.id}>
          <CardContent>
            <Stack spacing={1}>
              <Typography fontWeight={900}>
                {formatearMoneda(p.valorReportado)} · {p.estado}
              </Typography>
              <Typography variant="body2">
                {p.caminanteNombre || 'Caminante no identificado'} · Fecha:{' '}
                {p.fechaPago || 'Pendiente'} · Medio: {p.medioPago || 'Pendiente'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => abrirDetalle(p)}>
                  Ver comprobante
                </Button>
                {p.estado === 'Pendiente' && (
                  <Button variant="contained" onClick={() => abrirDetalle(p)}>
                    Validar
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selected} onClose={cerrarDetalle} fullWidth maxWidth="md">
        <DialogTitle>Detalle del comprobante de pago</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {errorAccion && <Alert severity="error">{errorAccion}</Alert>}

              <Typography variant="subtitle1" fontWeight={800}>
                Información del caminante
              </Typography>
              <Stack
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={2}
              >
                <Dato etiqueta="Nombre" valor={selected.caminanteNombre} />
                <Dato etiqueta="Número de inscripción" valor={selected.numeroInscripcion} />
                <Dato etiqueta="Documento" valor={selected.documentoIdentidad} />
                <Dato etiqueta="Estado del reporte" valor={selected.estado} />
              </Stack>

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Información del pago
              </Typography>
              <Stack
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={2}
              >
                <Dato etiqueta="Valor reportado" valor={formatearMoneda(selected.valorReportado)} />
                <Dato etiqueta="Fecha del pago" valor={selected.fechaPago} />
                <Dato etiqueta="Medio de pago" valor={selected.medioPago} />
                <Dato etiqueta="Banco o entidad" valor={selected.entidadPago} />
                <Dato etiqueta="Referencia" valor={selected.referenciaPago} />
                <Dato etiqueta="Nombre de quien pagó" valor={selected.nombrePagador} />
                <Dato etiqueta="Teléfono de quien pagó" valor={selected.telefonoPagador} />
                <Dato etiqueta="Supera el saldo pendiente" valor={selected.superaSaldo} />
                {Number(selected.excedente || 0) > 0 && (
                  <Dato etiqueta="Excedente reportado" valor={formatearMoneda(selected.excedente)} />
                )}
              </Stack>
              <Dato
                etiqueta="Observaciones de quien reportó"
                valor={selected.observacionesReportante}
              />

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Archivo adjunto
              </Typography>
              <Stack
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={2}
              >
                <Dato etiqueta="Nombre del archivo" valor={selected.comprobanteNombre} />
                <Dato etiqueta="Tipo" valor={selected.comprobanteTipo} />
                <Dato etiqueta="Tamaño" valor={formatearTamano(selected.comprobanteTamano)} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  component="a"
                  href={selected.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  disabled={!selected.comprobanteUrl}
                >
                  Abrir comprobante
                </Button>
                <Button
                  component="a"
                  href={selected.comprobanteDescargaUrl || selected.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  disabled={!selected.comprobanteDescargaUrl && !selected.comprobanteUrl}
                >
                  Descargar comprobante
                </Button>
              </Stack>

              {selected.estado === 'Pendiente' ? (
                <>
                  <Divider />
                  <Typography variant="subtitle1" fontWeight={800}>
                    Validación de tesorería
                  </Typography>
                  <TextField
                    label="Valor aprobado"
                    type="number"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    fullWidth
                  />
                  {Number(valor) !== Number(selected.valorReportado) && (
                    <TextField
                      label="Motivo de la corrección"
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                      fullWidth
                    />
                  )}
                  <TextField
                    label="Observaciones / motivo de rechazo"
                    multiline
                    minRows={3}
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    fullWidth
                  />
                </>
              ) : (
                <>
                  <Divider />
                  <Typography variant="subtitle1" fontWeight={800}>
                    Resultado de la validación
                  </Typography>
                  <Stack
                    display="grid"
                    gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                    gap={2}
                  >
                    <Dato etiqueta="Valor aprobado" valor={selected.valorAprobado === null ? 'No aplica' : formatearMoneda(selected.valorAprobado)} />
                    <Dato etiqueta="Validado por" valor={selected.validadoPor} />
                    <Dato etiqueta="Fecha de validación" valor={selected.fechaValidacion} />
                    <Dato etiqueta="Motivo de modificación" valor={selected.motivoModificacionValor} />
                  </Stack>
                  <Dato etiqueta="Observaciones de tesorería" valor={selected.observacionesTesoreria} />
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDetalle} disabled={guardando}>
            Cerrar
          </Button>
          {selected?.estado === 'Pendiente' && (
            <>
              <Button
                onClick={() => resolver('Rechazado')}
                color="error"
                disabled={guardando}
              >
                Rechazar
              </Button>
              <Button
                onClick={() => resolver('Aprobado')}
                variant="contained"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Aprobar'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
