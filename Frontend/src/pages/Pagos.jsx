import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import {
  obtenerPagos,
  obtenerReportePagos,
  validarPago
} from '../api/pagosApi';
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

function descargarEstadosCuentaExcel(reporte) {
  const grupos = reporte?.grupos || [];

  const columnasBase = [
    { titulo: 'ID', valor: persona => persona.id },
    { titulo: 'Nombre', valor: persona => persona.nombre },
    { titulo: 'Número de inscripción', valor: persona => persona.numeroInscripcion },
    { titulo: 'Documento', valor: persona => persona.documentoIdentidad },
    { titulo: 'Valor individual', valor: (persona, grupo) => grupo.valorIndividual },
    { titulo: 'Valor esperado', valor: persona => persona.valorEsperado },
    { titulo: 'Valor recaudado', valor: persona => persona.valorRecaudado },
    { titulo: 'Valor pendiente', valor: persona => persona.valorPendiente },
    { titulo: 'Excedente', valor: persona => persona.excedente },
    { titulo: 'Estado de pago', valor: persona => persona.estadoPago }
  ];

  function crearTabla(titulo, tipoPersona) {
    const grupo = grupos.find(item => item.tipoPersona === tipoPersona);
    const columnas = tipoPersona === 'Servidor'
      ? columnasBase.filter(columna => columna.titulo !== 'Número de inscripción')
      : columnasBase;
    const filas = grupo?.detalle || [];

    const encabezados = columnas
      .map(columna => `<th>${escaparHtml(columna.titulo)}</th>`)
      .join('');

    const cuerpo = filas.length
      ? filas.map((persona, indice) => {
        const clase = indice % 2 === 0 ? 'fila-par' : 'fila-impar';
        const celdas = columnas.map(columna => {
          const valor = columna.valor(persona, grupo);
          const esMoneda = [
            'Valor individual',
            'Valor esperado',
            'Valor recaudado',
            'Valor pendiente',
            'Excedente'
          ].includes(columna.titulo);

          return esMoneda
            ? `<td class="numero">${escaparHtml(valor)}</td>`
            : `<td>${escaparHtml(valor)}</td>`;
        }).join('');
        return `<tr class="${clase}">${celdas}</tr>`;
      }).join('')
      : `<tr><td colspan="${columnas.length}" class="sin-registros">No hay personas registradas.</td></tr>`;

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
        ${crearTabla('ESTADOS DE CUENTA DE CAMINANTES', 'Caminante')}
        ${crearTabla('ESTADOS DE CUENTA DE SERVIDORES', 'Servidor')}
      </body>
    </html>
  `;

  const blob = new Blob([contenido], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `estados-de-cuenta-${new Date().toISOString().slice(0, 10)}.xls`;
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
  const [filtrosAplicados, setFiltrosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
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
  const [selected, setSelected] = useState(null);
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [acordeonArrastrado, setAcordeonArrastrado] = useState(null);
  const [ordenAcordeones, setOrdenAcordeones] = useState(() => {
    const ordenInicial = [
      'resumen-Caminante',
      'resumen-Servidor',
      'comprobantes-Caminante',
      'comprobantes-Servidor'
    ];

    try {
      const guardado = JSON.parse(localStorage.getItem('ordenAcordeonesPagos'));
      return Array.isArray(guardado) && ordenInicial.every(id => guardado.includes(id))
        ? guardado
        : ordenInicial;
    } catch {
      return ordenInicial;
    }
  });

  const pagosPorGrupo = useMemo(() => {
    const pagos = api.data?.pagos || [];
    return {
      Caminante: pagos.filter(p => p.tipoPersona === 'Caminante'),
      Servidor: pagos.filter(p => p.tipoPersona === 'Servidor')
    };
  }, [api.data]);

  const comprobantesTodos = useMemo(
    () => Array.from(
      new Map(
        (api.data?.pagos || [])
          .map(pago => [pago.comprobanteId || pago.comprobanteUrl || pago.id, pago])
      ).values()
    ),
    [api.data]
  );

  if (api.loading) return <LoadingState />;

  function aplicarFiltros() {
    setFiltrosAplicados({ fechaDesde, fechaHasta });
  }

  function limpiarFiltros() {
    setFechaDesde('');
    setFechaHasta('');
    setFiltrosAplicados({ fechaDesde: '', fechaHasta: '' });
  }

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

  const reporte = api.data?.reporte;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Pagos"
        subtitle="Control financiero de caminantes y servidores"
      />

      {api.error && <Alert severity="error">{api.error.message}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography fontWeight={800}>Filtros del reporte</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
              <TextField
                label="Fecha desde"
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Fecha hasta"
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Button variant="contained" onClick={aplicarFiltros}>
                Aplicar
              </Button>
              <Button variant="outlined" onClick={limpiarFiltros}>
                Limpiar
              </Button>
              <Button
                variant="outlined"
                onClick={() => descargarEstadosCuentaExcel(reporte)}
                disabled={!reporte}
                sx={{ minWidth: 220, minHeight: 40, whiteSpace: 'nowrap' }}
              >
                Exportar estados de cuenta
              </Button>
              <Button
                variant="outlined"
                onClick={() => descargarComprobantesTesoreriaExcel(api.data?.pagos)}
                disabled={!comprobantesTodos.length}
                sx={{ minWidth: 220, minHeight: 40, whiteSpace: 'nowrap' }}
              >
                Exportar comprobantes
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {reporte && (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={2}
        >
          <Indicador titulo="Personas" valor={reporte.total.cantidadPersonas} />
          <Indicador titulo="Valor esperado" valor={formatearMoneda(reporte.total.valorEsperado)} />
          <Indicador titulo="Valor recaudado" valor={formatearMoneda(reporte.total.valorRecaudado)} />
          <Indicador titulo="Valor pendiente" valor={formatearMoneda(reporte.total.valorPendiente)} />
        </Box>
      )}

      <Alert severity="info">
        Puedes cambiar el orden de los acordeones arrastrándolos desde el indicador ⋮⋮.
      </Alert>

      {ordenAcordeones.map(idAcordeon => {
        const [categoria, tipo] = idAcordeon.split('-');
        const esResumen = categoria === 'resumen';
        const grupo = esResumen
          ? reporte?.grupos?.find(item => item.tipoPersona === tipo)
          : null;
        const pagosGrupo = pagosPorGrupo[tipo] || [];

        if (esResumen && !grupo) return null;

        function soltarAcordeon(event) {
          event.preventDefault();
          if (!acordeonArrastrado || acordeonArrastrado === idAcordeon) return;

          const nuevoOrden = [...ordenAcordeones];
          const origen = nuevoOrden.indexOf(acordeonArrastrado);
          const destino = nuevoOrden.indexOf(idAcordeon);
          nuevoOrden.splice(origen, 1);
          nuevoOrden.splice(destino, 0, acordeonArrastrado);
          setOrdenAcordeones(nuevoOrden);
          localStorage.setItem('ordenAcordeonesPagos', JSON.stringify(nuevoOrden));
          setAcordeonArrastrado(null);
        }

        return (
          <Box
            key={idAcordeon}
            onDragOver={event => event.preventDefault()}
            onDrop={soltarAcordeon}
            sx={{
              opacity: acordeonArrastrado === idAcordeon ? 0.55 : 1,
              transition: 'opacity 150ms ease'
            }}
          >
            <Accordion defaultExpanded={idAcordeon !== 'comprobantes-Servidor'}>
              <AccordionSummary
                expandIcon={<Typography aria-hidden="true">⌄</Typography>}
                aria-controls={idAcordeon}
                id={`encabezado-${idAcordeon}`}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                  <Box
                    draggable
                    onDragStart={event => {
                      event.stopPropagation();
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', idAcordeon);
                      setAcordeonArrastrado(idAcordeon);
                    }}
                    onDragEnd={() => setAcordeonArrastrado(null)}
                    onClick={event => event.stopPropagation()}
                    title="Arrastrar para cambiar el orden"
                    aria-label="Arrastrar para cambiar el orden"
                    sx={{
                      cursor: 'grab',
                      userSelect: 'none',
                      fontWeight: 900,
                      fontSize: 22,
                      lineHeight: 1,
                      px: 0.5,
                      '&:active': { cursor: 'grabbing' }
                    }}
                  >
                    ⋮⋮
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="h6" fontWeight={900}>
                      {esResumen
                        ? tipo === 'Caminante' ? 'Caminantes' : 'Servidores'
                        : `Comprobantes de ${tipo === 'Caminante' ? 'caminantes' : 'servidores'}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {esResumen
                        ? `${grupo.cantidadPersonas} personas · Valor individual: ${formatearMoneda(grupo.valorIndividual)}`
                        : `${pagosGrupo.length} comprobantes en el rango seleccionado`}
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>

              <AccordionDetails id={idAcordeon}>
                {esResumen ? (
                  <Stack spacing={2}>
                    <Box
                      display="grid"
                      gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
                      gap={2}
                    >
                      <Indicador titulo="Esperado" valor={formatearMoneda(grupo.valorEsperado)} />
                      <Indicador titulo="Recaudado" valor={formatearMoneda(grupo.valorRecaudado)} />
                      <Indicador titulo="Pendiente" valor={formatearMoneda(grupo.valorPendiente)} />
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Persona</TableCell>
                            <TableCell align="right">Esperado</TableCell>
                            <TableCell align="right">Recaudado</TableCell>
                            <TableCell align="right">Pendiente</TableCell>
                            <TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {grupo.detalle.map(persona => (
                            <TableRow key={`${grupo.tipoPersona}-${persona.id}`}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>{persona.nombre}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {persona.numeroInscripcion || persona.documentoIdentidad || persona.id}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{formatearMoneda(persona.valorEsperado)}</TableCell>
                              <TableCell align="right">{formatearMoneda(persona.valorRecaudado)}</TableCell>
                              <TableCell align="right">{formatearMoneda(persona.valorPendiente)}</TableCell>
                              <TableCell>{persona.estadoPago}</TableCell>
                            </TableRow>
                          ))}
                          {!grupo.detalle.length && (
                            <TableRow>
                              <TableCell colSpan={5}>No hay personas activas en este grupo.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    {pagosGrupo.map(p => (
                      <Card key={p.id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography fontWeight={900}>
                              {formatearMoneda(p.valorReportado)} · {p.estado}
                            </Typography>
                            <Typography variant="body2">
                              {p.personaNombre || 'Persona no identificada'} · Fecha: {p.fechaPago || 'Pendiente'} · Medio: {p.medioPago || 'Pendiente'}
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
                    {!pagosGrupo.length && (
                      <Typography variant="body2" color="text.secondary">
                        No hay comprobantes en el rango seleccionado.
                      </Typography>
                    )}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        );
      })}

      <Dialog open={!!selected} onClose={cerrarDetalle} fullWidth maxWidth="md">
        <DialogTitle>Detalle del comprobante de pago</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {errorAccion && <Alert severity="error">{errorAccion}</Alert>}
              <Typography variant="subtitle1" fontWeight={800}>Información de la persona</Typography>
              <Stack display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
                <Dato etiqueta="Tipo" valor={selected.tipoPersona} />
                <Dato etiqueta="Nombre" valor={selected.personaNombre} />
                <Dato etiqueta="Número de inscripción" valor={selected.numeroInscripcion} />
                <Dato etiqueta="Documento" valor={selected.documentoIdentidad} />
                <Dato etiqueta="Estado del reporte" valor={selected.estado} />
              </Stack>
              <Divider />
              <Typography variant="subtitle1" fontWeight={800}>Información del pago</Typography>
              <Stack display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
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
              <Dato etiqueta="Observaciones de quien reportó" valor={selected.observacionesReportante} />
              <Divider />
              <Typography variant="subtitle1" fontWeight={800}>Archivo adjunto</Typography>
              <Stack display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
                <Dato etiqueta="Nombre del archivo" valor={selected.comprobanteNombre} />
                <Dato etiqueta="Tipo" valor={selected.comprobanteTipo} />
                <Dato etiqueta="Tamaño" valor={formatearTamano(selected.comprobanteTamano)} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button component="a" href={selected.comprobanteUrl} target="_blank" rel="noopener noreferrer" variant="outlined" disabled={!selected.comprobanteUrl}>
                  Abrir comprobante
                </Button>
                <Button component="a" href={selected.comprobanteDescargaUrl || selected.comprobanteUrl} target="_blank" rel="noopener noreferrer" variant="contained" disabled={!selected.comprobanteDescargaUrl && !selected.comprobanteUrl}>
                  Descargar comprobante
                </Button>
              </Stack>
              {selected.estado === 'Pendiente' ? (
                <>
                  <Divider />
                  <Typography variant="subtitle1" fontWeight={800}>Validación de tesorería</Typography>
                  <TextField label="Valor aprobado" type="number" value={valor} onChange={e => setValor(e.target.value)} fullWidth />
                  {Number(valor) !== Number(selected.valorReportado) && (
                    <TextField label="Motivo de la corrección" value={motivo} onChange={e => setMotivo(e.target.value)} fullWidth />
                  )}
                  <TextField label="Observaciones / motivo de rechazo" multiline minRows={3} value={obs} onChange={e => setObs(e.target.value)} fullWidth />
                </>
              ) : (
                <>
                  <Divider />
                  <Typography variant="subtitle1" fontWeight={800}>Resultado de la validación</Typography>
                  <Stack display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
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
          <Button onClick={cerrarDetalle} disabled={guardando}>Cerrar</Button>
          {selected?.estado === 'Pendiente' && (
            <>
              <Button onClick={() => resolver('Rechazado')} color="error" disabled={guardando}>Rechazar</Button>
              <Button onClick={() => resolver('Aprobado')} variant="contained" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Aprobar'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
