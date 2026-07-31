import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import FactCheckRounded from '@mui/icons-material/FactCheckRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  buscarPersonaPago,
  obtenerMiServidorPago,
  obtenerValorRetiroPago,
  reportarPagoPublico,
} from '../api/pagosApi';
import { obtenerPortalPublico } from '../api/publicApi';
import PublicNavbar from '../components/publico/PublicNavbar';
import PublicFooter from '../components/publico/PublicFooter';

const MAX = 5 * 1024 * 1024;
const TIPOS_ARCHIVO = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
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
  archivo: null,
};

function moneda(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function DatoCuenta({ icon, etiqueta, valor, copiable = false }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!copiable || !valor) return;
    await navigator.clipboard.writeText(String(valor));
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1600);
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '42px minmax(0,1fr) auto',
        alignItems: 'center',
        gap: 1.25,
        p: 1.5,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,.10)',
        border: '1px solid rgba(255,255,255,.12)',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 2.25,
          bgcolor: 'rgba(210,238,222,.14)',
          color: '#d8f4e7',
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,.62)', fontWeight: 800, letterSpacing: '.06em' }}
        >
          {etiqueta}
        </Typography>
        <Typography sx={{ color: '#fff', fontWeight: 900, wordBreak: 'break-word' }}>
          {valor || 'No configurado'}
        </Typography>
      </Box>
      {copiable && (
        <Tooltip title={copiado ? 'Copiado' : 'Copiar'}>
          <IconButton onClick={copiar} sx={{ color: copiado ? '#bfe9d5' : 'rgba(255,255,255,.68)' }}>
            {copiado ? <CheckCircleRounded /> : <ContentCopyRounded />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default function ReportarPago() {
  const nav = useNavigate();
  const location = useLocation();
  const { autenticado, token, loading: authLoading } = useAuth();

  const esMiCuenta = location.pathname === '/mi-cuenta/reportar-pago';
  const esTesoreria = location.pathname === '/tesoreria/reportar-pago';
  const esPublico = !autenticado && location.pathname === '/reportar-pago';

  const [tipoPersona, setTipoPersona] = useState(esMiCuenta ? 'Servidor' : 'Caminante');
  const [criterio, setCriterio] = useState('');
  const [persona, setPersona] = useState(null);
  const [valorRetiro, setValorRetiro] = useState(null);
  const [valoresRetiro, setValoresRetiro] = useState({ Caminante: null, Servidor: null });
  const [cargandoValores, setCargandoValores] = useState(true);
  const [portal, setPortal] = useState({});
  const [form, setForm] = useState(FORM_INICIAL);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    setTipoPersona(esMiCuenta ? 'Servidor' : 'Caminante');
  }, [autenticado, authLoading, esMiCuenta]);

  useEffect(() => {
    let vigente = true;
    obtenerPortalPublico()
      .then((datos) => {
        if (vigente) setPortal(datos || {});
      })
      .catch(() => {
        if (vigente) setPortal({});
      });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && esMiCuenta && autenticado && token) cargarMiServidor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, autenticado, token, esMiCuenta]);

  useEffect(() => {
    let vigente = true;

    async function precargarValores() {
      try {
        const [caminante, servidor] = await Promise.all([
          obtenerValorRetiroPago('Caminante'),
          obtenerValorRetiroPago('Servidor'),
        ]);

        if (!vigente) return;

        const valores = { Caminante: caminante, Servidor: servidor };
        setValoresRetiro(valores);
        setValorRetiro(valores[tipoPersona] || null);
      } catch {
        if (vigente) {
          setValoresRetiro({ Caminante: null, Servidor: null });
          setValorRetiro(null);
        }
      } finally {
        if (vigente) setCargandoValores(false);
      }
    }

    precargarValores();
    return () => {
      vigente = false;
    };
    // Los dos valores se consultan una sola vez al cargar la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValorRetiro(valoresRetiro[tipoPersona] || null);
  }, [tipoPersona, valoresRetiro]);

  const etiquetaPersona = tipoPersona === 'Servidor' ? 'servidor' : 'caminante';
  const valorInformativo = useMemo(
    () => persona?.valorRetiro || valorRetiro,
    [persona, valorRetiro]
  );

  const cuenta = {
    banco: portal.portalPagoBanco || portal.pagoBanco || 'Bancolombia',
    tipo: portal.portalPagoTipoCuenta || portal.pagoTipoCuenta || 'Ahorros',
    numero: portal.portalPagoNumeroCuenta || portal.pagoNumeroCuenta || '004-000028-62',
    titular:
      portal.portalPagoNombreTitular ||
      portal.pagoNombreTitular ||
      'Parroquia de Santa Teresita del Niño Jesús',
    mensaje:
      portal.portalPagoMensajeReporte ||
      portal.pagoMensajeReporte ||
      'Esta página es únicamente para reportar un pago ya realizado. El pago debe efectuarse mediante transferencia bancaria.',
  };

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
      setForm((actual) => ({
        ...actual,
        nombrePagador: esMiCuenta ? actual.nombrePagador || datos?.nombre || '' : '',
        telefonoPagador: esMiCuenta ? actual.telefonoPagador || datos?.celular || '' : '',
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
      const datos = await buscarPersonaPago(tipoPersona, criterio.trim());
      setPersona(datos);
      setValorRetiro(datos?.valorRetiro || valorRetiro);
      setForm((actual) => ({
        ...actual,
        entidadPago: actual.entidadPago || cuenta.banco,
        nombrePagador: esMiCuenta ? actual.nombrePagador || datos?.nombre || '' : '',
        telefonoPagador: esMiCuenta ? actual.telefonoPagador || datos?.celular || '' : '',
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
      setForm((actual) => ({
        ...actual,
        archivo: {
          nombre: archivo.name,
          tipo: archivo.type,
          base64: String(lector.result).split(',')[1],
        },
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
        medioPago: 'Transferencia',
        tipoPersona,
        personaId: persona.id,
        criterio: criterio || persona.documentoIdentidad || persona.numeroInscripcion || '',
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

  const contenido = (
    <Box
      component="main"
      sx={{
        minHeight: esPublico ? 'calc(100dvh - 82px)' : '100dvh',
        pt: esPublico ? { xs: '90px', md: '112px' } : { xs: 2, md: 4 },
        pb: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 8% 5%, rgba(207,231,217,.7), transparent 30%), radial-gradient(circle at 92% 8%, rgba(230,211,151,.30), transparent 25%), linear-gradient(180deg,#f7f2e7 0%,#edf4ef 100%)',
      }}
    >
      <Container maxWidth="xl">
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => nav(autenticado ? '/dashboard' : '/')}
          sx={{ mb: 2, color: '#123f35', fontWeight: 900 }}
        >
          Volver
        </Button>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px,.78fr) minmax(0,1.22fr)' },
            gap: { xs: 2.5, lg: 4 },
            alignItems: 'start',
          }}
        >
          <Paper
            sx={{
              position: { lg: 'sticky' },
              top: { lg: esPublico ? 108 : 24 },
              overflow: 'hidden',
              borderRadius: 6,
              color: '#fff',
              background:
                'radial-gradient(circle at 100% 0%, rgba(104,180,151,.35), transparent 38%), linear-gradient(150deg,#062f28 0%,#0e5548 58%,#176b59 100%)',
              boxShadow: '0 28px 80px rgba(17,62,52,.20)',
            }}
          >
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Chip
                icon={<ShieldRounded />}
                label="REPORTE SEGURO"
                sx={{
                  mb: 2.5,
                  color: '#d8f4e7',
                  bgcolor: 'rgba(255,255,255,.10)',
                  fontWeight: 900,
                  letterSpacing: '.08em',
                  '& .MuiChip-icon': { color: '#d8f4e7' },
                }}
              />

              <Typography
                component="h1"
                sx={{ fontSize: { xs: '2.5rem', md: '3.6rem' }, lineHeight: .98, fontWeight: 950 }}
              >
                Reportar pago
              </Typography>
              <Typography sx={{ mt: 2, color: 'rgba(255,255,255,.76)', lineHeight: 1.7 }}>
                {cuenta.mensaje}
              </Typography>

              <Alert
                severity="warning"
                sx={{
                  mt: 2.5,
                  color: '#4b3b0d',
                  bgcolor: '#fff2c7',
                  borderRadius: 3,
                  '& .MuiAlert-icon': { color: '#8a6800' },
                }}
              >
                Aquí no se realiza el pago. Primero haz la transferencia y luego adjunta el comprobante.
              </Alert>

              <Typography variant="overline" sx={{ display: 'block', mt: 3, mb: 1.25, color: '#bfe9d5', fontWeight: 900 }}>
                DATOS PARA LA TRANSFERENCIA
              </Typography>

              <Stack spacing={1.15}>
                <DatoCuenta icon={<AccountBalanceRounded />} etiqueta="Banco" valor={cuenta.banco} />
                <DatoCuenta icon={<FactCheckRounded />} etiqueta="Tipo de cuenta" valor={cuenta.tipo} />
                <DatoCuenta icon={<ReceiptLongRounded />} etiqueta="Número de cuenta" valor={cuenta.numero} copiable />
                <DatoCuenta icon={<BadgeRounded />} etiqueta="Titular" valor={cuenta.titular} copiable />
              </Stack>
            </Box>
          </Paper>

          <Paper
            sx={{
              p: { xs: 2.25, md: 4 },
              borderRadius: 6,
              border: '1px solid rgba(19,81,67,.12)',
              boxShadow: '0 26px 75px rgba(20,65,55,.11)',
              bgcolor: 'rgba(255,255,255,.94)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="overline" sx={{ color: '#1a6b59', fontWeight: 950, letterSpacing: '.11em' }}>
                  PASO 1 · IDENTIFICA A LA PERSONA
                </Typography>
                <Typography variant="h4" fontWeight={950} sx={{ mt: .3 }}>
                  ¿A quién corresponde el pago?
                </Typography>
                <Typography color="text.secondary" sx={{ mt: .7 }}>
                  Busca el registro y luego completa los datos de la transferencia.
                </Typography>
              </Box>

              {!esMiCuenta && (
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: '#1a6b59', fontWeight: 950, letterSpacing: '.1em' }}
                  >
                    SELECCIONA EL TIPO DE PERSONA
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1.5,
                      mt: 1,
                    }}
                  >
                    {[
                      {
                        valor: 'Caminante',
                        titulo: 'Pago de caminante',
                        descripcion: 'Usa el código de inscripción o el documento del aspirante.',
                        icono: <BadgeRounded />,
                      },
                      {
                        valor: 'Servidor',
                        titulo: 'Pago de servidor',
                        descripcion: 'Usa el documento o número de inscripción del servidor.',
                        icono: <ShieldRounded />,
                      },
                    ].map((opcion) => {
                      const seleccionada = tipoPersona === opcion.valor;

                      return (
                        <Paper
                          key={opcion.valor}
                          component="button"
                          type="button"
                          onClick={() => cambiarTipo(null, opcion.valor)}
                          elevation={0}
                          sx={{
                            appearance: 'none',
                            width: '100%',
                            p: 2,
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: 4,
                            border: seleccionada
                              ? '2px solid #176b59'
                              : '1px solid rgba(19,81,67,.16)',
                            bgcolor: seleccionada ? '#edf8f3' : '#fff',
                            boxShadow: seleccionada
                              ? '0 14px 34px rgba(23,107,89,.14)'
                              : '0 8px 24px rgba(20,65,55,.06)',
                            transition: '.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: '#176b59',
                              boxShadow: '0 16px 36px rgba(23,107,89,.13)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                flex: '0 0 auto',
                                borderRadius: 3,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: seleccionada ? '#176b59' : '#e8f4ee',
                                color: seleccionada ? '#fff' : '#176b59',
                              }}
                            >
                              {opcion.icono}
                            </Box>
                            <Box minWidth={0}>
                              <Typography fontWeight={950} color="#17332d">
                                {opcion.titulo}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>
                                {opcion.descripcion}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {tipoPersona && (
                <>
                  {!persona && !esMiCuenta && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: { xs: 1.5, sm: 1.75 },
                        borderRadius: 4,
                        borderColor: 'rgba(19,81,67,.18)',
                        bgcolor: '#fbfdfc',
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.25}
                        alignItems={{ sm: 'center' }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          label={
                            tipoPersona === 'Servidor'
                              ? 'Documento o número de inscripción del servidor'
                              : 'Código de inscripción o documento del caminante'
                          }
                          value={criterio}
                          onChange={(e) => setCriterio(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && criterio.trim() && !loading) buscar();
                          }}
                        />
                        <Button
                          variant="contained"
                          startIcon={<SearchRounded />}
                          onClick={buscar}
                          disabled={loading || !criterio.trim()}
                          sx={{
                            minWidth: { sm: 185 },
                            py: 1.1,
                            borderRadius: 3,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {loading ? 'Buscando...' : `Buscar ${etiquetaPersona}`}
                        </Button>
                      </Stack>
                    </Paper>
                  )}

                  <Paper
                    elevation={0}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      p: { xs: 1.4, sm: 1.6 },
                      borderRadius: 3.5,
                      color: '#fff',
                      background:
                        'linear-gradient(135deg,#0b493d 0%,#176b59 76%,#26806b 100%)',
                      boxShadow: '0 10px 26px rgba(18,89,74,.16)',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      alignItems={{ sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2.5,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'rgba(255,255,255,.13)',
                            border: '1px solid rgba(255,255,255,.15)',
                          }}
                        >
                          <PaymentsRounded sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="overline"
                            sx={{ color: '#bfe9d5', fontWeight: 950, letterSpacing: '.1em' }}
                          >
                            VALOR RETIRO · {tipoPersona.toUpperCase()}
                          </Typography>
                          <Typography
                            sx={{
                              mt: .15,
                              fontSize: { xs: '1.35rem', sm: '1.6rem' },
                              lineHeight: 1,
                              fontWeight: 950,
                            }}
                          >
                            {cargandoValores
                              ? 'Consultando…'
                              : valorInformativo
                                ? moneda(valorInformativo)
                                : 'Valor por confirmar'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        label="Pago total o abonos"
                        sx={{
                          alignSelf: { xs: 'flex-start', sm: 'center' },
                          color: '#17332d',
                          bgcolor: '#f4dda0',
                          fontWeight: 900,
                        }}
                      />
                    </Stack>

                    <Typography variant="caption" sx={{ display: 'block', mt: .75, color: 'rgba(255,255,255,.72)' }}>
                      Puedes reportar el pago completo o un abono; Tesorería validará el comprobante.
                    </Typography>
                  </Paper>

                  {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                  {tipoPersona === 'Servidor' && autenticado && !persona && (
                    <Button variant="contained" onClick={cargarMiServidor} disabled={loading || !token}>
                      {loading ? 'Consultando...' : 'Consultar mis datos como servidor'}
                    </Button>
                  )}


                  {persona && (
                    <>
                      <Paper
                        sx={{
                          p: 2.25,
                          borderRadius: 4,
                          bgcolor: '#edf8f3',
                          border: '1px solid #c8e7d9',
                        }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
                          <Box>
                            <Typography fontWeight={950} fontSize="1.12rem">{persona.nombre}</Typography>
                            <Typography color="text.secondary" variant="body2">{tipoPersona} · {persona.estadoPago}</Typography>
                          </Box>
                          <Box textAlign={{ sm: 'right' }}>
                            <Typography variant="caption" color="text.secondary">SALDO PENDIENTE</Typography>
                            <Typography fontWeight={950} color="#0f5b4b">{moneda(persona.saldoPendiente)}</Typography>
                          </Box>
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          Valor retiro: {moneda(persona.valorRetiro)} · Abonado: {moneda(persona.totalAprobado)}
                        </Typography>
                      </Paper>

                      {persona.exentoPago && (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                          Este servidor está exento de pago y no requiere reportar comprobantes.
                          {persona.motivoExencionPago ? ` Motivo: ${persona.motivoExencionPago}` : ''}
                        </Alert>
                      )}

                      {!esMiCuenta && (
                        <Button
                          size="small"
                          onClick={() => {
                            setPersona(null);
                            setCriterio('');
                            setForm(FORM_INICIAL);
                            setError('');
                          }}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Cambiar persona
                        </Button>
                      )}

                      <Box>
                        <Typography variant="overline" sx={{ color: '#1a6b59', fontWeight: 950, letterSpacing: '.11em' }}>
                          PASO 2 · DATOS DEL PAGO
                        </Typography>
                        <Typography variant="h5" fontWeight={950}>Completa el reporte</Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                          gap: 2,
                        }}
                      >
                        <TextField
                          label="Valor pagado"
                          type="number"
                          value={form.valorReportado}
                          onChange={(e) => setForm({ ...form, valorReportado: e.target.value })}
                        />
                        <TextField
                          label="Fecha del pago"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={form.fechaPago}
                          onChange={(e) => setForm({ ...form, fechaPago: e.target.value })}
                        />
                        <TextField label="Medio de pago" value="Transferencia" disabled />
                        <TextField
                          label="Banco desde el que transferiste"
                          value={form.entidadPago}
                          onChange={(e) => setForm({ ...form, entidadPago: e.target.value })}
                        />
                        <TextField
                          label="Referencia o número de comprobante"
                          value={form.referenciaPago}
                          onChange={(e) => setForm({ ...form, referenciaPago: e.target.value })}
                        />
                        <TextField
                          label="Nombre de quien pagó"
                          value={form.nombrePagador}
                          onChange={(e) => setForm({ ...form, nombrePagador: e.target.value })}
                        />
                        <TextField
                          label="Teléfono de quien pagó"
                          value={form.telefonoPagador}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              telefonoPagador: e.target.value.replace(/\D/g, '').slice(0, 10),
                            })
                          }
                          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                        />
                      </Box>

                      <Paper
                        component="label"
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 4,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: form.archivo ? '#eef8f3' : '#fbfcfb',
                          transition: '.2s ease',
                          '&:hover': { borderColor: '#176b59', bgcolor: '#f1f8f4' },
                        }}
                      >
                        <UploadFileRounded sx={{ fontSize: 40, color: '#176b59' }} />
                        <Typography fontWeight={950} mt={.5}>
                          {form.archivo ? form.archivo.nombre : 'Adjuntar comprobante'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          PDF, JPG o PNG · máximo 5 MB
                        </Typography>
                        <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={seleccionarArchivo} />
                      </Paper>

                      <TextField
                        label="Observaciones"
                        multiline
                        minRows={3}
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                      />

                      <Button
                        startIcon={<PaymentsRounded />}
                        variant="contained"
                        onClick={enviar}
                        disabled={
                          loading ||
                          Boolean(persona?.exentoPago) ||
                          !form.valorReportado ||
                          Number(form.valorReportado) <= 0 ||
                          !form.fechaPago ||
                          !form.archivo ||
                          !form.nombrePagador.trim() ||
                          !/^3\d{9}$/.test(form.telefonoPagador)
                        }
                        sx={{ py: 1.5, borderRadius: 3, fontWeight: 950 }}
                      >
                        {loading ? 'Enviando...' : 'Enviar reporte de pago'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );

  return (
    <>
      {esPublico && <PublicNavbar onLogin={() => nav('/login')} />}
      {contenido}
      {esPublico && <PublicFooter />}

      <Dialog open={confirmacionAbierta} onClose={cerrarConfirmacion} aria-labelledby="confirmacion-pago-titulo">
        <DialogTitle id="confirmacion-pago-titulo">Pago reportado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hemos recibido correctamente tu reporte de pago. Tesorería validará la información y actualizará el estado.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={cerrarConfirmacion} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
