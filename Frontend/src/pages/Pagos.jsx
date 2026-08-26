import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import UndoRounded from '@mui/icons-material/UndoRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import {
  obtenerPagos,
  obtenerReportePagos,
  validarPago
} from '../api/pagosApi';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import AvatarServidor from '../components/servidores/AvatarServidor';

function formatearMoneda(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

function normalizarValorCop(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }

  const texto = String(valor ?? '').trim();
  if (!texto) return 0;

  // Los valores del sistema son pesos enteros.
  // Acepta 380000, 380.000, $ 380.000, 380,000, etc.
  const soloDigitos = texto.replace(/\D/g, '');
  return Number(soloDigitos || 0);
}


function formatearTamano(bytes) {
  const total = Number(bytes || 0);
  if (!total) return 'No informado';
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}


function formatearFechaHora(valor) {
  if (!valor) return 'No informado';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(fecha);
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

function Indicador({ titulo, valor, detalle }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {titulo}
        </Typography>
        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
          {valor}
        </Typography>
        {detalle && (
          <Typography variant="caption" color="text.secondary">
            {detalle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return `"${texto.replace(/"/g, '""')}"`;
}

function descargarReporteCsv(reporte) {
  const filas = [[
    'Grupo',
    'ID',
    'Nombre',
    'Número de inscripción',
    'Documento',
    'Valor individual',
    'Valor esperado',
    'Valor recaudado',
    'Valor pendiente',
    'Excedente',
    'Estado de pago',
    'Exento de pago',
    'Motivo de exención'
  ]];

  (reporte?.grupos || []).forEach(grupo => {
    (grupo.detalle || []).forEach(persona => {
      filas.push([
        grupo.tipoPersona,
        persona.id,
        persona.nombre,
        persona.numeroInscripcion,
        persona.documentoIdentidad,
        grupo.valorIndividual,
        persona.valorEsperado,
        persona.valorRecaudado,
        persona.valorPendiente,
        persona.excedente,
        persona.estadoPago,
        persona.exentoPago ? 'Sí' : 'No',
        persona.motivoExencionPago || ''
      ]);
    });
  });

  const contenido = filas.map(fila => fila.map(escaparCsv).join(';')).join('\n');
  const blob = new Blob([`\ufeff${contenido}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `reporte-pagos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function descargarComprobantesTesoreriaExcel(pagos) {
  const comprobantes = Array.from(
    new Map(
      (pagos || [])
        .map(pago => [pago.comprobanteId || pago.comprobanteUrl || pago.id, pago])
    ).values()
  );

  const columnasBase = [
    { titulo: 'ID comprobante', valor: pago => pago.id },
    { titulo: 'Nombre', valor: pago => pago.personaNombre },
    { titulo: 'Número de inscripción', valor: pago => pago.numeroInscripcion },
    { titulo: 'Documento', valor: pago => pago.documentoIdentidad },
    { titulo: 'Fecha del pago', valor: pago => pago.fechaPago },
    { titulo: 'Valor reportado', valor: pago => pago.valorReportado },
    { titulo: 'Medio de pago', valor: pago => pago.medioPago },
    { titulo: 'Banco o entidad', valor: pago => pago.entidadPago },
    { titulo: 'Referencia', valor: pago => pago.referenciaPago },
    { titulo: 'Nombre del pagador', valor: pago => pago.nombrePagador },
    { titulo: 'Teléfono del pagador', valor: pago => pago.telefonoPagador },
    { titulo: 'Observaciones', valor: pago => pago.observacionesReportante },
    { titulo: 'Nombre del archivo', valor: pago => pago.comprobanteNombre },
    {
      titulo: 'Enlace del comprobante',
      valor: pago => pago.comprobanteDescargaUrl || pago.comprobanteUrl
    },
    { titulo: 'Estado', valor: pago => pago.estado }
  ];

  function crearTabla(titulo, tipoPersona) {
    const columnas = tipoPersona === 'Servidor'
      ? columnasBase.filter(columna => columna.titulo !== 'Número de inscripción')
      : columnasBase;

    const filas = comprobantes.filter(pago => pago.tipoPersona === tipoPersona);

    const encabezados = columnas
      .map(columna => `<th>${escaparHtml(columna.titulo)}</th>`)
      .join('');

    const cuerpo = filas.length
      ? filas.map((pago, indice) => {
        const clase = indice % 2 === 0 ? 'fila-par' : 'fila-impar';
        const celdas = columnas.map(columna => {
          const valor = columna.valor(pago);
          if (columna.titulo === 'Enlace del comprobante' && valor) {
            return `<td><a href="${escaparHtml(valor)}">Abrir comprobante</a></td>`;
          }
          if (columna.titulo === 'Valor reportado') {
            return `<td class="numero">${escaparHtml(valor)}</td>`;
          }
          return `<td>${escaparHtml(valor)}</td>`;
        }).join('');
        return `<tr class="${clase}">${celdas}</tr>`;
      }).join('')
      : `<tr><td colspan="${columnas.length}" class="sin-registros">No hay comprobantes registrados.</td></tr>`;

    return `
      <table>
        <thead>
          <tr>
            <th colspan="${columnas.length}" class="titulo-seccion">${escaparHtml(titulo)}</th>
          </tr>
          <tr class="encabezados">${encabezados}</tr>
        </thead>
        <tbody>${cuerpo}</tbody>
      </table>
      <div class="separador"></div>
    `;
  }

  const contenido = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
          th, td { border: 1px solid #b7b7b7; padding: 7px 9px; vertical-align: top; }
          .titulo-seccion {
            background: #1f4e78;
            color: #ffffff;
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            padding: 10px;
          }
          .encabezados th {
            background: #d9eaf7;
            color: #1f1f1f;
            font-weight: 700;
            text-align: center;
          }
          .fila-par td { background: #ffffff; }
          .fila-impar td { background: #f2f6fa; }
          .numero { text-align: right; mso-number-format: '\\$'#,##0; }
          .sin-registros { text-align: center; font-style: italic; color: #666666; }
          .separador { height: 18px; }
        </style>
      </head>
      <body>
        ${crearTabla('COMPROBANTES DE CAMINANTES', 'Caminante')}
        ${crearTabla('COMPROBANTES DE SERVIDORES', 'Servidor')}
      </body>
    </html>
  `;

  const blob = new Blob([contenido], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `comprobantes-tesoreria-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}


export default function Pagos() {
  const { token } = useAuth();

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });

  const [vistaActiva, setVistaActiva] = useState('pendientes');
  const [ordenPendientes, setOrdenPendientes] = useState('antiguos');
  const [metodoFiltro, setMetodoFiltro] = useState('Todos');
  const [busquedaEstado, setBusquedaEstado] = useState('');
  const [condicionEstado, setCondicionEstado] = useState('Todos');

  const [selected, setSelected] = useState(null);
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [dialogoEfectivo, setDialogoEfectivo] = useState(false);

  const api = useApi(
    async () => {
      const [pagos, reporte] = await Promise.all([
        obtenerPagos(token, filtrosAplicados),
        obtenerReportePagos(token, filtrosAplicados)
      ]);

      return { pagos, reporte };
    },
    [token, filtrosAplicados.fechaDesde, filtrosAplicados.fechaHasta]
  );

  const pagos = api.data?.pagos || [];
  const reporte = api.data?.reporte;

  const pagosPendientes = useMemo(
    () => pagos.filter(p => p.estado === 'Pendiente'),
    [pagos]
  );

  const pagosAprobados = useMemo(
    () => pagos.filter(p => p.estado === 'Aprobado'),
    [pagos]
  );

  const pagosRechazados = useMemo(
    () => pagos.filter(p => p.estado === 'Rechazado'),
    [pagos]
  );

  const pagosReversados = useMemo(
    () => pagos.filter(p => Boolean(p.fechaReversion)),
    [pagos]
  );

  const composicionRecaudo = useMemo(() => {
    const resumen = {
      caminantes: 0,
      servidores: 0,
      transferencias: 0,
      efectivo: 0,
      sinMetodo: 0,
      total: 0
    };

    pagosAprobados.forEach(pago => {
      const valor = Number(
        pago.valorAprobado ??
        pago.valorReportado ??
        0
      ) || 0;

      resumen.total += valor;

      if (String(pago.tipoPersona || '').toLowerCase() === 'servidor') {
        resumen.servidores += valor;
      } else if (String(pago.tipoPersona || '').toLowerCase() === 'caminante') {
        resumen.caminantes += valor;
      }

      const medio = String(pago.medioPago || '').trim().toLowerCase();

      if (medio === 'transferencia') {
        resumen.transferencias += valor;
      } else if (medio === 'efectivo') {
        resumen.efectivo += valor;
      } else {
        resumen.sinMetodo += valor;
      }
    });

    return resumen;
  }, [pagosAprobados]);

  const distribucionEfectivo = useMemo(() => {
    const mapa = new Map();

    pagosAprobados
      .filter(
        pago =>
          String(pago.medioPago || '')
            .trim()
            .toLowerCase() === 'efectivo'
      )
      .forEach(pago => {
        const nombre =
          String(pago.nombrePagador || '').trim() ||
          'Sin responsable identificado';

        const telefono =
          String(pago.telefonoPagador || '').trim();

        const clave = `${nombre.toLowerCase()}|${telefono}`;

        const valor = Number(
          pago.valorAprobado ??
          pago.valorReportado ??
          0
        ) || 0;

        if (!mapa.has(clave)) {
          mapa.set(clave, {
            nombre,
            telefono,
            total: 0,
            cantidad: 0,
            pagos: []
          });
        }

        const item = mapa.get(clave);
        item.total += valor;
        item.cantidad += 1;
        item.pagos.push({
          id: pago.id,
          personaNombre:
            pago.personaNombre || 'Persona no identificada',
          tipoPersona:
            pago.tipoPersona || 'Participante',
          numeroInscripcion:
            pago.numeroInscripcion || '',
          fechaPago:
            pago.fechaPago || pago.fechaRegistro || '',
          valor
        });
      });

    return Array.from(mapa.values())
      .map(item => ({
        ...item,
        pagos: item.pagos.sort((a, b) => {
          const fechaA = new Date(a.fechaPago || 0).getTime();
          const fechaB = new Date(b.fechaPago || 0).getTime();
          return fechaB - fechaA;
        })
      }))
      .sort((a, b) => b.total - a.total);
  }, [pagosAprobados]);

  const valorPendienteValidacion = useMemo(
    () =>
      pagosPendientes.reduce(
        (total, pago) =>
          total + Number(pago.valorReportado || 0),
        0
      ),
    [pagosPendientes]
  );

  const comprobantesTodos = useMemo(
    () =>
      Array.from(
        new Map(
          pagos.map(pago => [
            pago.comprobanteId ||
              pago.comprobanteUrl ||
              pago.id,
            pago
          ])
        ).values()
      ),
    [pagos]
  );

  const pendientesVisibles = useMemo(() => {
    const normalizarFecha = pago => {
      const valorFecha =
        pago.fechaRegistro ||
        pago.fechaPago ||
        pago.fechaCreacion ||
        '';

      const tiempo = new Date(valorFecha).getTime();
      return Number.isFinite(tiempo) ? tiempo : 0;
    };

    const filtrados = pagosPendientes.filter(pago => {
      if (metodoFiltro === 'Todos') return true;
      return String(pago.medioPago || '').toLowerCase() ===
        metodoFiltro.toLowerCase();
    });

    return [...filtrados].sort((a, b) => {
      const diferencia = normalizarFecha(a) - normalizarFecha(b);
      return ordenPendientes === 'antiguos'
        ? diferencia
        : -diferencia;
    });
  }, [pagosPendientes, metodoFiltro, ordenPendientes]);

  const reversadosVisibles = useMemo(() => {
    const filtrados = pagosReversados.filter(pago => {
      if (metodoFiltro === 'Todos') return true;
      return String(pago.medioPago || '').toLowerCase() ===
        metodoFiltro.toLowerCase();
    });

    return [...filtrados].sort((a, b) => {
      const fechaA = new Date(
        a.fechaReversion ||
        a.fechaActualizacion ||
        a.fechaRegistro ||
        0
      ).getTime();

      const fechaB = new Date(
        b.fechaReversion ||
        b.fechaActualizacion ||
        b.fechaRegistro ||
        0
      ).getTime();

      return ordenPendientes === 'antiguos'
        ? fechaA - fechaB
        : fechaB - fechaA;
    });
  }, [pagosReversados, metodoFiltro, ordenPendientes]);

  const grupoActivo = useMemo(() => {
    const tipo =
      vistaActiva === 'servidores'
        ? 'Servidor'
        : 'Caminante';

    return reporte?.grupos?.find(
      item => item.tipoPersona === tipo
    );
  }, [reporte, vistaActiva]);

  const personasEstado = useMemo(() => {
    const detalle = grupoActivo?.detalle || [];
    const termino = busquedaEstado
      .trim()
      .toLowerCase();

    return detalle.filter(persona => {
      const coincideBusqueda =
        !termino ||
        [
          persona.nombre,
          persona.numeroInscripcion,
          persona.documentoIdentidad,
          persona.id
        ]
          .filter(Boolean)
          .some(valorPersona =>
            String(valorPersona)
              .toLowerCase()
              .includes(termino)
          );

      if (!coincideBusqueda) return false;

      if (condicionEstado === 'Todos') return true;
      if (condicionEstado === 'Al día') {
        return (
          Number(persona.valorPendiente || 0) <= 0 &&
          !persona.exentoPago
        );
      }
      if (condicionEstado === 'Con saldo') {
        return Number(persona.valorPendiente || 0) > 0;
      }
      if (condicionEstado === 'Exentos') {
        return Boolean(persona.exentoPago);
      }

      return true;
    });
  }, [grupoActivo, busquedaEstado, condicionEstado]);

  if (api.loading) return <LoadingState />;

  function aplicarFiltros() {
    setFiltrosAplicados({
      fechaDesde,
      fechaHasta
    });
  }

  function limpiarFiltros() {
    setFechaDesde('');
    setFechaHasta('');
    setFiltrosAplicados({
      fechaDesde: '',
      fechaHasta: ''
    });
  }

  function abrirDetalle(pago) {
    setSelected(pago);
    setValor(
      String(normalizarValorCop(pago.valorReportado))
    );
    setObs(
      pago.observacionesTesoreria || ''
    );
    setMotivo(
      pago.motivoModificacionValor || ''
    );
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

      const valorAprobadoNormalizado =
        normalizarValorCop(valor);

      const valorReportadoNormalizado =
        normalizarValorCop(
          selected.valorReportado
        );

      const huboCorreccionValor =
        estado === 'Aprobado' &&
        valorAprobadoNormalizado !==
          valorReportadoNormalizado;

      await validarPago(
        token,
        selected.id,
        {
          estado,
          valorAprobado:
            valorAprobadoNormalizado,
          observacionesTesoreria: obs,
          motivoModificacionValor:
            huboCorreccionValor
              ? motivo
              : ''
        }
      );

      setSelected(null);
      api.reload();
    } catch (error) {
      setErrorAccion(
        error?.message ||
          'No fue posible validar el pago.'
      );
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCorreccionPendiente() {
    try {
      const nuevoValor =
        normalizarValorCop(valor);
      if (!nuevoValor || nuevoValor <= 0) {
        setErrorAccion('El valor reportado debe ser mayor a cero.');
        return;
      }
      if (
        nuevoValor ===
        normalizarValorCop(
          selected.valorReportado
        )
      ) {
        setErrorAccion('No hay cambios en el valor reportado.');
        return;
      }
      if (!String(motivo || '').trim()) {
        setErrorAccion('Debes indicar el motivo de la corrección.');
        return;
      }

      setGuardando(true);
      setErrorAccion('');
      await editarValorPagoPendiente(token, selected.id, nuevoValor, motivo);
      setSelected(null);
      api.reload();
    } catch (error) {
      setErrorAccion(error?.message || 'No fue posible corregir el valor del pago.');
    } finally {
      setGuardando(false);
    }
  }

  const vistas = [
    {
      id: 'pendientes',
      titulo: 'Pagos por validar',
      valor: pagosPendientes.length,
      detalle:
        pagosPendientes.length > 0
          ? 'Requieren atención de Tesorería'
          : 'Tesorería está al día',
      icono: <ScheduleRounded />,
      color: '#b98316',
      fondo: '#fff8e8'
    },
    {
      id: 'reversados',
      titulo: 'Pagos reversados',
      valor: pagosReversados.length,
      detalle:
        pagosReversados.length > 0
          ? 'Auditoría de aprobaciones revertidas'
          : 'Sin reversión de pagos',
      icono: <UndoRounded />,
      color: '#8a5b12',
      fondo: '#fff5df'
    },
    {
      id: 'caminantes',
      titulo: 'Estados de caminantes',
      valor:
        reporte?.grupos?.find(
          grupo =>
            grupo.tipoPersona === 'Caminante'
        )?.cantidadPersonas || 0,
      detalle: 'Consulta saldos y recaudo',
      icono: <GroupsRounded />,
      color: '#176b58',
      fondo: '#edf8f3'
    },
    {
      id: 'servidores',
      titulo: 'Estados de servidores',
      valor:
        reporte?.grupos?.find(
          grupo =>
            grupo.tipoPersona === 'Servidor'
        )?.cantidadPersonas || 0,
      detalle: 'Consulta saldos y recaudo',
      icono: <PersonRounded />,
      color: '#315f78',
      fondo: '#eef6fa'
    }
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Estados de cuenta"
        subtitle="Tesorería · prioriza los pagos por validar y consulta el estado financiero del retiro"
        actions={
          <Button
            variant="contained"
            startIcon={<RefreshRounded />}
            onClick={api.reload}
            sx={{
              borderRadius: 999,
              minWidth: 145
            }}
          >
            Actualizar
          </Button>
        }
      />

      {api.error && (
        <Alert severity="error">
          {api.error.message}
        </Alert>
      )}

      <Paper
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 5,
          px: {
            xs: 2.5,
            md: 3.5
          },
          py: {
            xs: 2.75,
            md: 3.25
          },
          color: '#fff',
          background:
            'linear-gradient(125deg, #113f35 0%, #176b58 52%, #2b8b72 100%)',
          boxShadow:
            '0 22px 55px rgba(17,63,53,.18)',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            right: -90,
            top: -160,
            bgcolor: 'rgba(255,255,255,.08)'
          }
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            md: 'row'
          }}
          justifyContent="space-between"
          alignItems={{
            xs: 'stretch',
            md: 'center'
          }}
          spacing={2.5}
          position="relative"
          zIndex={1}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 950,
                letterSpacing: '.14em',
                color: '#bdebdc'
              }}
            >
              CONTROL FINANCIERO
            </Typography>

            <Typography
              variant="h4"
              fontWeight={950}
              sx={{
                mt: 0.25,
                maxWidth: 760
              }}
            >
              Mantén al día los pagos del retiro
            </Typography>

            <Typography
              sx={{
                mt: 1,
                maxWidth: 760,
                color: 'rgba(255,255,255,.78)',
                lineHeight: 1.65
              }}
            >
              Valida primero los movimientos recibidos,
              identifica inconsistencias y luego consulta
              el saldo de caminantes y servidores.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            spacing={1}
          >
            <Button
              variant="contained"
              startIcon={<DownloadRounded />}
              onClick={() =>
                descargarReporteCsv(reporte)
              }
              disabled={!reporte}
              sx={{
                bgcolor: '#fff',
                color: '#123f35',
                borderRadius: 999,
                '&:hover': {
                  bgcolor: '#f1faf6'
                }
              }}
            >
              Exportar estados
            </Button>

            <Button
              variant="outlined"
              startIcon={<ReceiptLongRounded />}
              onClick={() =>
                descargarComprobantesTesoreriaExcel(
                  pagos
                )
              }
              disabled={!comprobantesTodos.length}
              sx={{
                color: '#fff',
                borderColor:
                  'rgba(255,255,255,.42)',
                borderRadius: 999,
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor:
                    'rgba(255,255,255,.08)'
                }
              }}
            >
              Exportar comprobantes
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)'
        }}
        gap={1.5}
      >
        <KpiTesoreria
          icono={<ScheduleRounded />}
          titulo="Por validar"
          valor={pagosPendientes.length}
          detalle={formatearMoneda(
            valorPendienteValidacion
          )}
          color="#b98316"
          fondo="#fff8e8"
        />

        <KpiTesoreria
          icono={<PaymentsRounded />}
          titulo="Valor pendiente"
          valor={formatearMoneda(
            reporte?.total?.valorPendiente || 0
          )}
          detalle="Saldo general del retiro"
          color="#176b58"
          fondo="#edf8f3"
        />

        <KpiTesoreria
          icono={<CheckCircleRounded />}
          titulo="Aprobados"
          valor={pagosAprobados.length}
          detalle="Movimientos validados"
          color="#21865f"
          fondo="#edf8f3"
        />

        <KpiTesoreria
          icono={<CloseRounded />}
          titulo="Rechazados"
          valor={pagosRechazados.length}
          detalle="Movimientos rechazados"
          color="#b54747"
          fondo="#fff1f1"
        />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 2,
            md: 2.5
          },
          borderRadius: 4,
          borderColor: 'rgba(20,75,62,.10)',
          background:
            'linear-gradient(135deg, rgba(237,248,243,.72) 0%, #fff 72%)'
        }}
      >
        <Stack spacing={1.75}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#176b58',
                fontWeight: 950,
                letterSpacing: '.12em'
              }}
            >
              COMPOSICIÓN DEL RECAUDO APROBADO
            </Typography>
            <Typography
              variant="h6"
              fontWeight={950}
            >
              ¿Dónde está el dinero recaudado?
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.3 }}
            >
              Solo se contabilizan pagos aprobados. Las dos lecturas deben
              representar el mismo recaudo: por tipo de persona y por método de pago.
            </Typography>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)'
            }}
            gap={1.25}
          >
            <KpiTesoreria
              icono={<GroupsRounded />}
              titulo="Dinero de caminantes"
              valor={formatearMoneda(composicionRecaudo.caminantes)}
              detalle="Pagos aprobados de caminantes"
              color="#176b58"
              fondo="#edf8f3"
            />

            <KpiTesoreria
              icono={<PersonRounded />}
              titulo="Dinero de servidores"
              valor={formatearMoneda(composicionRecaudo.servidores)}
              detalle="Pagos aprobados de servidores"
              color="#315f78"
              fondo="#eef6fa"
            />

            <KpiTesoreria
              icono={<AccountBalanceWalletRounded />}
              titulo="Transferencias"
              valor={formatearMoneda(composicionRecaudo.transferencias)}
              detalle="Recaudo aprobado por transferencia"
              color="#315f78"
              fondo="#eef6fa"
            />

            <KpiTesoreria
              icono={<StorefrontRounded />}
              titulo="Efectivo"
              valor={formatearMoneda(composicionRecaudo.efectivo)}
              detalle="Haz clic para ver quién tiene el dinero"
              color="#8a5b12"
              fondo="#fff8e8"
              onClick={() => setDialogoEfectivo(true)}
            />
          </Box>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            justifyContent="space-between"
            gap={0.5}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Total aprobado: <strong>{formatearMoneda(composicionRecaudo.total)}</strong>
            </Typography>

            {composicionRecaudo.sinMetodo > 0 && (
              <Typography
                variant="caption"
                color="warning.main"
                fontWeight={850}
              >
                {formatearMoneda(composicionRecaudo.sinMetodo)} de pagos históricos
                no tienen método clasificado.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 1,
          borderRadius: 4,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(4, 1fr)'
          },
          gap: 1,
          bgcolor: '#fff'
        }}
      >
        {vistas.map(vista => {
          const activa =
            vistaActiva === vista.id;

          return (
            <Box
              key={vista.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                setVistaActiva(vista.id)
              }
              onKeyDown={event => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  setVistaActiva(vista.id);
                }
              }}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                p: 2,
                borderRadius: 3.5,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activa
                  ? vista.color
                  : 'transparent',
                bgcolor: activa
                  ? vista.fondo
                  : 'transparent',
                boxShadow: activa
                  ? `0 12px 28px ${vista.color}20`
                  : 'none',
                transition:
                  'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                '&:hover': {
                  transform:
                    'translateY(-2px)',
                  bgcolor: vista.fondo
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 90,
                  height: 90,
                  right: -30,
                  top: -38,
                  borderRadius: '50%',
                  bgcolor: vista.color,
                  opacity: activa ? 0.1 : 0
                }
              }}
            >
              <Stack
                direction="row"
                spacing={1.35}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    bgcolor: activa
                      ? vista.color
                      : vista.fondo,
                    color: activa
                      ? '#fff'
                      : vista.color
                  }}
                >
                  {vista.icono}
                </Avatar>

                <Box flex={1}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography
                      fontWeight={950}
                    >
                      {vista.titulo}
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight={950}
                      color={vista.color}
                    >
                      {vista.valor}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.3 }}
                  >
                    {vista.detalle}
                  </Typography>
                </Box>

                {activa && (
                  <ArrowForwardRounded
                    sx={{
                      color: vista.color
                    }}
                  />
                )}
              </Stack>
            </Box>
          );
        })}
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          borderColor:
            'rgba(20,75,62,.12)',
          boxShadow:
            '0 18px 50px rgba(17,48,41,.07)'
        }}
      >
        {vistaActiva === 'pendientes' ? (
          <>
            <Box
              sx={{
                px: {
                  xs: 2,
                  md: 3
                },
                py: 2.5,
                borderBottom: 1,
                borderColor: 'divider',
                background:
                  'linear-gradient(135deg, #fff8e8 0%, #fff 68%)'
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  lg: 'row'
                }}
                justifyContent="space-between"
                alignItems={{
                  xs: 'stretch',
                  lg: 'center'
                }}
                gap={2}
              >
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: '#9a6a08',
                      fontWeight: 950,
                      letterSpacing: '.12em'
                    }}
                  >
                    PRIORIDAD DE TESORERÍA
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={950}
                  >
                    Pagos pendientes de validación
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.4 }}
                  >
                    Revisa primero los movimientos más
                    antiguos y valida cada reporte desde
                    esta misma vista.
                  </Typography>
                </Box>

                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row'
                  }}
                  spacing={1}
                >
                  <TextField
                    select
                    size="small"
                    label="Método"
                    value={metodoFiltro}
                    onChange={event =>
                      setMetodoFiltro(
                        event.target.value
                      )
                    }
                    sx={{
                      minWidth: 170
                    }}
                  >
                    {[
                      'Todos',
                      'Transferencia',
                      'Efectivo'
                    ].map(opcion => (
                      <MenuItem
                        key={opcion}
                        value={opcion}
                      >
                        {opcion}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Box
                    sx={{
                      p: 0.45,
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      borderRadius: 999,
                      bgcolor:
                        'rgba(17,48,41,.055)',
                      minWidth: 320
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={
                        <ArrowUpwardRounded />
                      }
                      onClick={() =>
                        setOrdenPendientes(
                          'antiguos'
                        )
                      }
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        color:
                          ordenPendientes ===
                          'antiguos'
                            ? '#fff'
                            : 'text.secondary',
                        bgcolor:
                          ordenPendientes ===
                          'antiguos'
                            ? '#174b40'
                            : 'transparent',
                        '&:hover': {
                          bgcolor:
                            ordenPendientes ===
                            'antiguos'
                              ? '#123f35'
                              : 'rgba(23,75,64,.06)'
                        }
                      }}
                    >
                      Antiguos
                    </Button>

                    <Button
                      size="small"
                      startIcon={
                        <ArrowDownwardRounded />
                      }
                      onClick={() =>
                        setOrdenPendientes(
                          'nuevos'
                        )
                      }
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        color:
                          ordenPendientes ===
                          'nuevos'
                            ? '#fff'
                            : 'text.secondary',
                        bgcolor:
                          ordenPendientes ===
                          'nuevos'
                            ? '#174b40'
                            : 'transparent',
                        '&:hover': {
                          bgcolor:
                            ordenPendientes ===
                            'nuevos'
                              ? '#123f35'
                              : 'rgba(23,75,64,.06)'
                        }
                      }}
                    >
                      Recientes
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  md: 2.25
                },
                bgcolor:
                  'rgba(17,48,41,.018)'
              }}
            >
              {pendientesVisibles.length ? (
                <Stack spacing={1.35}>
                  {pendientesVisibles.map(
                    (pago, indice) => (
                      <PagoPendienteCard
                        key={pago.id}
                        pago={pago}
                        indice={indice}
                        onValidar={() =>
                          abrirDetalle(pago)
                        }
                      />
                    )
                  )}
                </Stack>
              ) : (
                <EmptyTesoreria
                  titulo="No hay pagos pendientes"
                  detalle={
                    metodoFiltro === 'Todos'
                      ? 'Tesorería está al día con los movimientos recibidos.'
                      : `No hay pagos pendientes por ${metodoFiltro.toLowerCase()}.`
                  }
                />
              )}
            </Box>
          </>
        ) : vistaActiva === 'reversados' ? (
          <PagosReversadosPanel
            pagos={reversadosVisibles}
            metodoFiltro={metodoFiltro}
            onMetodoFiltro={setMetodoFiltro}
            orden={ordenPendientes}
            onOrden={setOrdenPendientes}
            onAbrir={abrirDetalle}
          />
        ) : (
          <EstadoCuentaPanel
            tipo={
              vistaActiva === 'servidores'
                ? 'Servidor'
                : 'Caminante'
            }
            grupo={grupoActivo}
            personas={personasEstado}
            busqueda={busquedaEstado}
            onBusqueda={setBusquedaEstado}
            condicion={condicionEstado}
            onCondicion={setCondicionEstado}
          />
        )}
      </Paper>

      <Card
        variant="outlined"
        sx={{
          borderRadius: 4
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{
                xs: 'column',
                md: 'row'
              }}
              justifyContent="space-between"
              alignItems={{
                xs: 'stretch',
                md: 'center'
              }}
              gap={1.5}
            >
              <Box>
                <Typography
                  fontWeight={900}
                >
                  Filtros del periodo
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Limita los movimientos y reportes al
                  rango de fechas que necesites.
                </Typography>
              </Box>

              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row'
                }}
                spacing={1}
              >
                <TextField
                  label="Fecha desde"
                  type="date"
                  value={fechaDesde}
                  onChange={event =>
                    setFechaDesde(
                      event.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                />

                <TextField
                  label="Fecha hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={event =>
                    setFechaHasta(
                      event.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                />

                <Button
                  variant="contained"
                  onClick={aplicarFiltros}
                >
                  Aplicar
                </Button>

                <Button
                  variant="outlined"
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={!!selected}
        onClose={cerrarDetalle}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 5,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            background:
              'linear-gradient(135deg, #edf8f3 0%, #fff 72%)'
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: '#176b58',
              fontWeight: 950,
              letterSpacing: '.12em'
            }}
          >
            VALIDACIÓN DE TESORERÍA
          </Typography>

          <Typography
            variant="h5"
            fontWeight={950}
          >
            Revisar reporte de pago
          </Typography>
        </DialogTitle>

        <DialogContent>
          {selected && (
            <Stack
              spacing={2}
              sx={{ pt: 2 }}
            >
              {errorAccion && (
                <Alert severity="error">
                  {errorAccion}
                </Alert>
              )}

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3.5,
                  bgcolor:
                    'rgba(23,107,88,.035)'
                }}
              >
                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row'
                  }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box>
                    <Typography
                      fontWeight={950}
                    >
                      {selected.personaNombre ||
                        'Persona no identificada'}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {selected.tipoPersona} ·{' '}
                      {selected.numeroInscripcion ||
                        selected.documentoIdentidad ||
                        selected.id}
                    </Typography>
                  </Box>

                  <Box textAlign={{
                    xs: 'left',
                    sm: 'right'
                  }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      VALOR REPORTADO
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight={950}
                      color="primary.main"
                    >
                      {formatearMoneda(
                        selected.valorReportado
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Typography
                variant="subtitle1"
                fontWeight={900}
              >
                Información del pago
              </Typography>

              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)'
                }}
                gap={2}
              >
                <Dato
                  etiqueta="Fecha del pago"
                  valor={selected.fechaPago}
                />
                <Dato
                  etiqueta="Método"
                  valor={selected.medioPago}
                />

                {String(
                  selected.medioPago || ''
                ).toLowerCase() ===
                'efectivo' ? (
                  <>
                    <Dato
                      etiqueta="Nombre de quien recibió el dinero"
                      valor={
                        selected.nombrePagador
                      }
                    />
                    <Dato
                      etiqueta="Teléfono de la persona que tiene el dinero"
                      valor={
                        selected.telefonoPagador
                      }
                    />
                  </>
                ) : (
                  <>
                    <Dato
                      etiqueta="Banco o entidad"
                      valor={
                        selected.entidadPago
                      }
                    />
                    <Dato
                      etiqueta="Referencia"
                      valor={
                        selected.referenciaPago
                      }
                    />
                    <Dato
                      etiqueta="Nombre de quien pagó"
                      valor={
                        selected.nombrePagador
                      }
                    />
                    <Dato
                      etiqueta="Teléfono de quien pagó"
                      valor={
                        selected.telefonoPagador
                      }
                    />
                  </>
                )}
              </Box>

              <Dato
                etiqueta="Observaciones de quien reportó"
                valor={
                  selected.observacionesReportante
                }
              />

              {String(
                selected.medioPago || ''
              ).toLowerCase() !==
                'efectivo' && (
                <>
                  <Divider />

                  <Typography
                    variant="subtitle1"
                    fontWeight={900}
                  >
                    Comprobante
                  </Typography>

                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)'
                    }}
                    gap={2}
                  >
                    <Dato
                      etiqueta="Nombre del archivo"
                      valor={
                        selected.comprobanteNombre
                      }
                    />
                    <Dato
                      etiqueta="Tamaño"
                      valor={formatearTamano(
                        selected.comprobanteTamano
                      )}
                    />
                  </Box>

                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row'
                    }}
                    spacing={1}
                  >
                    <Button
                      component="a"
                      href={
                        selected.comprobanteUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      disabled={
                        !selected.comprobanteUrl
                      }
                    >
                      Abrir comprobante
                    </Button>

                    <Button
                      component="a"
                      href={
                        selected.comprobanteDescargaUrl ||
                        selected.comprobanteUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      disabled={
                        !selected.comprobanteDescargaUrl &&
                        !selected.comprobanteUrl
                      }
                    >
                      Descargar comprobante
                    </Button>
                  </Stack>
                </>
              )}

              {selected.fechaReversion && (
                <>
                  <Divider />

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3.5,
                      borderColor: 'rgba(185,131,22,.22)',
                      bgcolor: '#fffaf0'
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <HistoryRounded
                          sx={{ color: '#8a5b12' }}
                        />
                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight={950}
                          >
                            Historial de reversión
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Este movimiento tuvo una aprobación revertida.
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        display="grid"
                        gridTemplateColumns={{
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)'
                        }}
                        gap={1.5}
                      >
                        <Dato
                          etiqueta="Aprobación anterior"
                          valor={formatearFechaHora(
                            selected.fechaValidacionAnterior
                          )}
                        />
                        <Dato
                          etiqueta="Aprobado anteriormente por"
                          valor={selected.validadoPorAnterior}
                        />
                        <Dato
                          etiqueta="Valor aprobado anteriormente"
                          valor={formatearMoneda(
                            selected.valorAprobadoAnterior
                          )}
                        />
                        <Dato
                          etiqueta="Estado anterior"
                          valor={
                            selected.estadoAnteriorReversion ||
                            'Aprobado'
                          }
                        />
                        <Dato
                          etiqueta="Fecha de reversión"
                          valor={formatearFechaHora(
                            selected.fechaReversion
                          )}
                        />
                        <Dato
                          etiqueta="Revertido por"
                          valor={selected.revertidoPor}
                        />
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          bgcolor: '#fff',
                          border: '1px solid rgba(185,131,22,.16)'
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          MOTIVO DE LA REVERSIÓN
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          sx={{ mt: 0.35 }}
                        >
                          {selected.motivoReversion ||
                            'No informado'}
                        </Typography>
                      </Box>

                      <Alert
                        severity={
                          selected.estado === 'Pendiente'
                            ? 'warning'
                            : selected.estado === 'Aprobado'
                              ? 'success'
                              : 'info'
                        }
                      >
                        Estado actual del movimiento:{' '}
                        <strong>{selected.estado}</strong>
                        {selected.estado === 'Pendiente'
                          ? '. El pago debe ser revisado nuevamente por Tesorería.'
                          : selected.estado === 'Aprobado'
                            ? '. Después de la reversión fue aprobado nuevamente.'
                            : '.'}
                      </Alert>
                    </Stack>
                  </Paper>
                </>
              )}

              {selected.estado ===
              'Pendiente' ? (
                <>
                  <Divider />

                  <Typography
                    variant="subtitle1"
                    fontWeight={900}
                  >
                    Decisión de Tesorería
                  </Typography>

                  <TextField
                    label="Valor aprobado"
                    type="number"
                    value={valor}
                    onChange={event => {
                      setValor(
                        event.target.value
                      );
                      setErrorAccion('');
                    }}
                    helperText={
                      normalizarValorCop(valor) ===
                      normalizarValorCop(
                        selected.valorReportado
                      )
                        ? `Mismo valor reportado: ${formatearMoneda(
                            normalizarValorCop(
                              selected.valorReportado
                            )
                          )}`
                        : `Nuevo valor: ${formatearMoneda(
                            normalizarValorCop(valor)
                          )}`
                    }
                    fullWidth
                  />

                  {normalizarValorCop(valor) !==
                    normalizarValorCop(
                      selected.valorReportado
                    ) && (
                    <TextField
                      label="Motivo de la corrección"
                      value={motivo}
                      onChange={event =>
                        setMotivo(
                          event.target.value
                        )
                      }
                      fullWidth
                    />
                  )}

                  <TextField
                    label="Observaciones / motivo de rechazo"
                    multiline
                    minRows={3}
                    value={obs}
                    onChange={event =>
                      setObs(
                        event.target.value
                      )
                    }
                    fullWidth
                  />
                </>
              ) : (
                <>
                  <Divider />

                  <Typography
                    variant="subtitle1"
                    fontWeight={900}
                  >
                    Resultado de la validación
                  </Typography>

                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)'
                    }}
                    gap={2}
                  >
                    <Dato
                      etiqueta="Valor aprobado"
                      valor={
                        selected.valorAprobado ===
                        null
                          ? 'No aplica'
                          : formatearMoneda(
                              selected.valorAprobado
                            )
                      }
                    />
                    <Dato
                      etiqueta="Validado por"
                      valor={
                        selected.validadoPor
                      }
                    />
                    <Dato
                      etiqueta="Fecha de validación"
                      valor={
                        selected.fechaValidacion
                      }
                    />
                    <Dato
                      etiqueta="Motivo de modificación"
                      valor={
                        selected.motivoModificacionValor
                      }
                    />
                  </Box>

                  <Dato
                    etiqueta="Observaciones de tesorería"
                    valor={
                      selected.observacionesTesoreria
                    }
                  />
                </>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3
          }}
        >
          <Button
            onClick={cerrarDetalle}
            disabled={guardando}
          >
            Cerrar
          </Button>

          {selected?.estado ===
            'Pendiente' && (
              <>
                {normalizarValorCop(valor) !==
                  normalizarValorCop(
                    selected.valorReportado
                  ) && (
                  <Button
                    onClick={guardarCorreccionPendiente}
                    variant="outlined"
                    color="warning"
                    disabled={guardando || !String(motivo || '').trim()}
                  >
                    Guardar corrección
                  </Button>
                )}

                <Button
                  onClick={() =>
                    resolver('Rechazado')
                  }
                  color="error"
                  variant="outlined"
                  disabled={guardando}
                >
                  Rechazar
                </Button>

                <Button
                  onClick={() =>
                    resolver('Aprobado')
                  }
                  variant="contained"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : 'Aprobar pago'}
                </Button>
              </>
            )}
        </DialogActions>
      </Dialog>
      <Dialog
        open={dialogoEfectivo}
        onClose={() => setDialogoEfectivo(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
          >
            <Avatar
              sx={{
                bgcolor: '#fff8e8',
                color: '#8a5b12'
              }}
            >
              <StorefrontRounded />
            </Avatar>

            <Box>
              <Typography
                variant="h6"
                fontWeight={950}
              >
                Distribución del efectivo
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Quién tiene actualmente el dinero recibido en efectivo
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3.5,
                bgcolor: '#fff8e8',
                borderColor:
                  'rgba(138,91,18,.15)'
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row'
                }}
                justifyContent="space-between"
                gap={1}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    TOTAL EN EFECTIVO APROBADO
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={950}
                    color="#8a5b12"
                  >
                    {formatearMoneda(
                      composicionRecaudo.efectivo
                    )}
                  </Typography>
                </Box>

                <Box
                  textAlign={{
                    xs: 'left',
                    sm: 'right'
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    RESPONSABLES CON DINERO
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={950}
                  >
                    {distribucionEfectivo.length}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {distribucionEfectivo.length ? (
              <Stack spacing={1.25}>
                {distribucionEfectivo.map(
                  (responsable, indice) => (
                    <Paper
                      key={`${responsable.nombre}-${responsable.telefono}-${indice}`}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 3.5,
                        borderColor:
                          'rgba(20,75,62,.10)'
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack
                          direction={{
                            xs: 'column',
                            sm: 'row'
                          }}
                          justifyContent="space-between"
                          gap={1}
                        >
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                bgcolor: '#edf8f3',
                                color: '#176b58'
                              }}
                            >
                              <PersonRounded />
                            </Avatar>

                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight={950}
                              >
                                {responsable.nombre}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {responsable.telefono ||
                                  'Sin celular registrado'}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box
                            textAlign={{
                              xs: 'left',
                              sm: 'right'
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              DINERO EN SU PODER
                            </Typography>

                            <Typography
                              variant="h5"
                              fontWeight={950}
                              color="#176b58"
                            >
                              {formatearMoneda(
                                responsable.total
                              )}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {responsable.cantidad}{' '}
                              {responsable.cantidad === 1
                                ? 'pago'
                                : 'pagos'}
                            </Typography>
                          </Box>
                        </Stack>

                        <Divider />

                        <Stack spacing={0.8}>
                          {responsable.pagos.map(
                            pago => (
                              <Box
                                key={pago.id}
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: '1fr auto'
                                  },
                                  gap: 1,
                                  p: 1.1,
                                  borderRadius: 2.5,
                                  bgcolor:
                                    'rgba(23,107,88,.035)'
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight={850}
                                  >
                                    {pago.personaNombre}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {pago.tipoPersona}
                                    {pago.numeroInscripcion
                                      ? ` · ${pago.numeroInscripcion}`
                                      : ''}
                                    {' · '}
                                    {formatearFechaHora(
                                      pago.fechaPago
                                    )}
                                  </Typography>
                                </Box>

                                <Typography
                                  fontWeight={950}
                                  color="#176b58"
                                  sx={{
                                    alignSelf: 'center'
                                  }}
                                >
                                  {formatearMoneda(
                                    pago.valor
                                  )}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  )
                )}
              </Stack>
            ) : (
              <Alert severity="info">
                No hay pagos aprobados en efectivo para los filtros seleccionados.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            onClick={() =>
              setDialogoEfectivo(false)
            }
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

    </Stack>
  );
}

function KpiTesoreria({
  icono,
  titulo,
  valor,
  detalle,
  color,
  fondo,
  onClick
}) {
  return (
    <Paper
      variant="outlined"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? event => {
              if (
                event.key === 'Enter' ||
                event.key === ' '
              ) {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        p: 2,
        borderRadius: 4,
        borderColor:
          'rgba(20,75,62,.10)',
        bgcolor: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 28px rgba(17,48,41,.08)',
              borderColor: color
            }
          : undefined
      }}
    >
      <Stack
        direction="row"
        spacing={1.4}
        alignItems="center"
      >
        <Avatar
          sx={{
            bgcolor: fondo,
            color
          }}
        >
          {icono}
        </Avatar>

        <Box>
          <Typography
            variant="h5"
            fontWeight={950}
            color={color}
          >
            {valor}
          </Typography>

          <Typography
            fontWeight={900}
            sx={{
              mt: -0.2
            }}
          >
            {titulo}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {detalle}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function PagoPendienteCard({
  pago,
  indice,
  onValidar
}) {
  const efectivo =
    String(pago.medioPago || '')
      .toLowerCase() === 'efectivo';

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'relative',
        p: {
          xs: 2,
          md: 2.25
        },
        pl: {
          xs: 2,
          md: 7.25
        },
        borderRadius: 3.5,
        borderColor:
          'rgba(20,75,62,.10)',
        bgcolor: '#fff',
        transition:
          'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor:
            'rgba(23,107,88,.28)',
          boxShadow:
            '0 14px 32px rgba(17,48,41,.08)'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 18,
          bottom: 18,
          width: 4,
          borderRadius:
            '0 8px 8px 0',
          bgcolor: '#b98316'
        }
      }}
    >
      <Box
        sx={{
          display: {
            xs: 'none',
            md: 'grid'
          },
          placeItems: 'center',
          position: 'absolute',
          left: 16,
          top: 18,
          width: 34,
          height: 34,
          borderRadius: '50%',
          bgcolor: '#fff8e8',
          color: '#9a6a08',
          fontWeight: 950
        }}
      >
        {String(
          indice + 1
        ).padStart(2, '0')}
      </Box>

      <Stack
        direction={{
          xs: 'column',
          lg: 'row'
        }}
        justifyContent="space-between"
        gap={2}
      >
        <Box flex={1}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography
              variant="h6"
              fontWeight={950}
            >
              {pago.personaNombre ||
                'Persona no identificada'}
            </Typography>

            <Chip
              size="small"
              label={
                pago.tipoPersona ||
                'Participante'
              }
              variant="outlined"
            />

            <Chip
              size="small"
              icon={
                efectivo
                  ? <StorefrontRounded />
                  : <AccountBalanceWalletRounded />
              }
              label={
                pago.medioPago ||
                'Método no informado'
              }
              sx={{
                bgcolor: efectivo
                  ? '#fff8e8'
                  : '#edf8f3'
              }}
            />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {pago.numeroInscripcion ||
              pago.documentoIdentidad ||
              pago.id}
            {' · '}
            {pago.fechaPago ||
              'Fecha pendiente'}
          </Typography>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            spacing={{
              xs: 0.4,
              sm: 2
            }}
            sx={{ mt: 1.25 }}
          >
            {efectivo ? (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Recibió:{' '}
                  <strong>
                    {pago.nombrePagador ||
                      'No informado'}
                  </strong>
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Tel:{' '}
                  {pago.telefonoPagador ||
                    'No informado'}
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {pago.entidadPago ||
                    'Banco no informado'}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Ref:{' '}
                  {pago.referenciaPago ||
                    'No informada'}
                </Typography>

                <Typography
                  variant="body2"
                  color="success.main"
                  fontWeight={800}
                >
                  {pago.comprobanteUrl
                    ? 'Comprobante adjunto ✓'
                    : 'Sin comprobante'}
                </Typography>
              </>
            )}
          </Stack>
        </Box>

        <Stack
          alignItems={{
            xs: 'stretch',
            lg: 'flex-end'
          }}
          justifyContent="space-between"
          spacing={1.25}
        >
          <Box
            textAlign={{
              xs: 'left',
              lg: 'right'
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              VALOR REPORTADO
            </Typography>

            <Typography
              variant="h5"
              fontWeight={950}
              color="#176b58"
            >
              {formatearMoneda(
                pago.valorReportado
              )}
            </Typography>
          </Box>

          <Button
            variant="contained"
            endIcon={<ArrowForwardRounded />}
            onClick={onValidar}
            sx={{
              borderRadius: 999
            }}
          >
            Validar pago
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}


function PagosReversadosPanel({
  pagos,
  metodoFiltro,
  onMetodoFiltro,
  orden,
  onOrden,
  onAbrir
}) {
  return (
    <>
      <Box
        sx={{
          px: {
            xs: 2,
            md: 3
          },
          py: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          background:
            'linear-gradient(135deg, #fff5df 0%, #fff 72%)'
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            lg: 'row'
          }}
          justifyContent="space-between"
          alignItems={{
            xs: 'stretch',
            lg: 'center'
          }}
          gap={2}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#8a5b12',
                fontWeight: 950,
                letterSpacing: '.12em'
              }}
            >
              AUDITORÍA DE TESORERÍA
            </Typography>

            <Typography
              variant="h5"
              fontWeight={950}
            >
              Pagos reversados
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.4 }}
            >
              Consulta los pagos cuya aprobación fue revertida,
              quién realizó la reversión, el motivo y su estado actual.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            spacing={1}
          >
            <TextField
              select
              size="small"
              label="Método"
              value={metodoFiltro}
              onChange={event =>
                onMetodoFiltro(event.target.value)
              }
              sx={{ minWidth: 170 }}
            >
              {[
                'Todos',
                'Transferencia',
                'Efectivo'
              ].map(opcion => (
                <MenuItem
                  key={opcion}
                  value={opcion}
                >
                  {opcion}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Orden"
              value={orden}
              onChange={event =>
                onOrden(event.target.value)
              }
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="antiguos">
                Reversión más antigua
              </MenuItem>
              <MenuItem value="nuevos">
                Reversión más reciente
              </MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          p: {
            xs: 1.5,
            md: 2.25
          },
          bgcolor: 'rgba(138,91,18,.018)'
        }}
      >
        {pagos.length ? (
          <Stack spacing={1.35}>
            {pagos.map(pago => (
              <Paper
                key={pago.id}
                variant="outlined"
                sx={{
                  p: {
                    xs: 2,
                    md: 2.25
                  },
                  borderRadius: 3.5,
                  borderColor:
                    'rgba(138,91,18,.14)',
                  bgcolor: '#fff',
                  transition:
                    'transform .18s ease, box-shadow .18s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow:
                      '0 14px 32px rgba(70,48,10,.08)'
                  }
                }}
              >
                <Stack
                  direction={{
                    xs: 'column',
                    lg: 'row'
                  }}
                  justifyContent="space-between"
                  gap={2}
                >
                  <Box flex={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography
                        variant="h6"
                        fontWeight={950}
                      >
                        {pago.personaNombre ||
                          'Persona no identificada'}
                      </Typography>

                      <Chip
                        size="small"
                        icon={<UndoRounded />}
                        label="Reversado"
                        sx={{
                          bgcolor: '#fff5df',
                          color: '#8a5b12',
                          fontWeight: 900
                        }}
                      />

                      <Chip
                        size="small"
                        label={`Actual: ${pago.estado || 'Pendiente'}`}
                        color={
                          pago.estado === 'Aprobado'
                            ? 'success'
                            : pago.estado === 'Rechazado'
                              ? 'error'
                              : 'warning'
                        }
                        variant="outlined"
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.55 }}
                    >
                      {pago.tipoPersona} ·{' '}
                      {pago.numeroInscripcion ||
                        pago.documentoIdentidad ||
                        pago.id}
                    </Typography>

                    <Box
                      display="grid"
                      gridTemplateColumns={{
                        xs: '1fr',
                        sm: 'repeat(3, 1fr)'
                      }}
                      gap={1.25}
                      sx={{ mt: 1.5 }}
                    >
                      <Dato
                        etiqueta="Fecha de reversión"
                        valor={formatearFechaHora(
                          pago.fechaReversion
                        )}
                      />
                      <Dato
                        etiqueta="Revertido por"
                        valor={pago.revertidoPor}
                      />
                      <Dato
                        etiqueta="Valor que estaba aprobado"
                        valor={formatearMoneda(
                          pago.valorAprobadoAnterior
                        )}
                      />
                    </Box>

                    <Box
                      sx={{
                        mt: 1.3,
                        p: 1.25,
                        borderRadius: 2.5,
                        bgcolor: '#fffaf0'
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Motivo
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                      >
                        {pago.motivoReversion ||
                          'No informado'}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack
                    alignItems={{
                      xs: 'stretch',
                      lg: 'flex-end'
                    }}
                    justifyContent="space-between"
                    spacing={1.25}
                  >
                    <Box
                      textAlign={{
                        xs: 'left',
                        lg: 'right'
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        VALOR REPORTADO
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={950}
                        color="#8a5b12"
                      >
                        {formatearMoneda(
                          pago.valorReportado
                        )}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      startIcon={<HistoryRounded />}
                      onClick={() => onAbrir(pago)}
                      sx={{
                        borderRadius: 999,
                        borderColor: '#8a5b12',
                        color: '#8a5b12',
                        '&:hover': {
                          borderColor: '#6f470c',
                          bgcolor: '#fffaf0'
                        }
                      }}
                    >
                      Ver historial
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyTesoreria
            titulo="No hay pagos reversados"
            detalle="Todavía no se han revertido aprobaciones dentro del periodo consultado."
          />
        )}
      </Box>
    </>
  );
}

function EstadoCuentaPanel({
  tipo,
  grupo,
  personas,
  busqueda,
  onBusqueda,
  condicion,
  onCondicion
}) {
  const color =
    tipo === 'Servidor'
      ? '#315f78'
      : '#176b58';

  const fondo =
    tipo === 'Servidor'
      ? '#eef6fa'
      : '#edf8f3';

  return (
    <>
      <Box
        sx={{
          px: {
            xs: 2,
            md: 3
          },
          py: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          background:
            `linear-gradient(135deg, ${fondo} 0%, #fff 70%)`
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            lg: 'row'
          }}
          justifyContent="space-between"
          alignItems={{
            xs: 'stretch',
            lg: 'center'
          }}
          gap={2}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color,
                fontWeight: 950,
                letterSpacing: '.12em'
              }}
            >
              ESTADOS DE CUENTA
            </Typography>

            <Typography
              variant="h5"
              fontWeight={950}
            >
              {tipo === 'Servidor'
                ? 'Servidores'
                : 'Caminantes'}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.35 }}
            >
              {grupo
                ? `${grupo.cantidadPersonas} personas · Valor individual ${formatearMoneda(grupo.valorIndividual)}`
                : 'Sin información disponible'}
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            spacing={1}
          >
            <TextField
              size="small"
              value={busqueda}
              onChange={event =>
                onBusqueda(
                  event.target.value
                )
              }
              placeholder="Nombre, documento o inscripción"
              InputProps={{
                startAdornment: (
                  <SearchRounded
                    sx={{
                      mr: 1,
                      color: 'text.secondary'
                    }}
                  />
                )
              }}
              sx={{
                minWidth: {
                  xs: '100%',
                  sm: 300
                }
              }}
            />

            <TextField
              select
              size="small"
              label="Condición"
              value={condicion}
              onChange={event =>
                onCondicion(
                  event.target.value
                )
              }
              sx={{
                minWidth: 160
              }}
            >
              {[
                'Todos',
                'Con saldo',
                'Al día',
                'Exentos'
              ].map(opcion => (
                <MenuItem
                  key={opcion}
                  value={opcion}
                >
                  {opcion}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Box>

      {grupo && (
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: '1fr',
            md: 'repeat(3, 1fr)'
          }}
          gap={1.5}
          sx={{
            px: {
              xs: 1.5,
              md: 2.25
            },
            pt: 2
          }}
        >
          <Indicador
            titulo="Esperado"
            valor={formatearMoneda(
              grupo.valorEsperado
            )}
          />

          <Indicador
            titulo="Recaudado"
            valor={formatearMoneda(
              grupo.valorRecaudado
            )}
          />

          <Indicador
            titulo="Pendiente"
            valor={formatearMoneda(
              grupo.valorPendiente
            )}
          />
        </Box>
      )}

      <Box
        sx={{
          p: {
            xs: 1.5,
            md: 2.25
          },
          bgcolor:
            'rgba(17,48,41,.018)'
        }}
      >
        {personas.length ? (
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              xl: 'repeat(2, minmax(0, 1fr))'
            }}
            gap={1.35}
          >
            {personas.map(persona => {
              const esperado = Number(
                persona.valorEsperado || 0
              );
              const recaudado = Number(
                persona.valorRecaudado || 0
              );

              const porcentaje =
                esperado > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        (recaudado /
                          esperado) *
                          100
                      )
                    )
                  : 100;

              const alDia =
                Number(
                  persona.valorPendiente || 0
                ) <= 0;

              return (
                <Paper
                  key={`${tipo}-${persona.id}`}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3.5,
                    borderColor:
                      'rgba(20,75,62,.10)',
                    bgcolor: '#fff'
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={1}
                    >
                      <Stack
                        direction="row"
                        spacing={1.2}
                        alignItems="center"
                      >
                        <Avatar
                          sx={{
                            bgcolor: fondo,
                            color
                          }}
                        >
                          {tipo === 'Servidor'
                            ? <PersonRounded />
                            : <GroupsRounded />}
                        </Avatar>

                        <Box>
                          <Typography
                            fontWeight={950}
                          >
                            {persona.nombre}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {persona.numeroInscripcion ||
                              persona.documentoIdentidad ||
                              persona.id}
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        size="small"
                        label={
                          persona.exentoPago
                            ? 'Exento'
                            : alDia
                              ? 'Al día'
                              : 'Con saldo'
                        }
                        sx={{
                          fontWeight: 900,
                          bgcolor:
                            persona.exentoPago
                              ? '#eef6fa'
                              : alDia
                                ? '#edf8f3'
                                : '#fff8e8',
                          color:
                            persona.exentoPago
                              ? '#315f78'
                              : alDia
                                ? '#176b58'
                                : '#9a6a08'
                        }}
                      />
                    </Stack>

                    <Box>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mb: 0.7 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Progreso de pago
                        </Typography>

                        <Typography
                          variant="caption"
                          fontWeight={900}
                        >
                          {Math.round(
                            porcentaje
                          )}%
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={porcentaje}
                        sx={{
                          height: 8,
                          borderRadius: 999,
                          bgcolor:
                            'rgba(23,107,88,.08)',
                          '& .MuiLinearProgress-bar':
                            {
                              borderRadius: 999,
                              bgcolor: color
                            }
                        }}
                      />
                    </Box>

                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(3, 1fr)"
                      gap={1}
                    >
                      <Dato
                        etiqueta="Esperado"
                        valor={formatearMoneda(
                          persona.valorEsperado
                        )}
                      />
                      <Dato
                        etiqueta="Abonado"
                        valor={formatearMoneda(
                          persona.valorRecaudado
                        )}
                      />
                      <Dato
                        etiqueta="Saldo"
                        valor={formatearMoneda(
                          persona.valorPendiente
                        )}
                      />
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <EmptyTesoreria
            titulo="Sin resultados"
            detalle="No encontramos personas con los filtros seleccionados."
          />
        )}
      </Box>
    </>
  );
}

function EmptyTesoreria({
  titulo,
  detalle
}) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center'
      }}
    >
      <Avatar
        sx={{
          mx: 'auto',
          mb: 1.5,
          width: 58,
          height: 58,
          bgcolor: '#edf8f3',
          color: '#176b58'
        }}
      >
        <CheckCircleRounded />
      </Avatar>

      <Typography
        variant="h6"
        fontWeight={950}
      >
        {titulo}
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          maxWidth: 520,
          mx: 'auto'
        }}
      >
        {detalle}
      </Typography>
    </Box>
  );
}
