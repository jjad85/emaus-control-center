/**
 * ============================================================
 * AUDITORÍA SERVICE
 * ============================================================
 */

function registrarAuditoria(datos) {
  const hoja = obtenerHoja(HOJAS.AUDITORIA);

  hoja.appendRow([
    new Date(),
    datos.usuario || '',
    datos.nombre || '',
    datos.accion || '',
    datos.entidad || '',
    datos.idRegistro || '',
    datos.detalle || ''
  ]);
}

function convertirFechaFiltroAuditoria(valor, finDelDia) {
  if (!valor) return null;

  var partes = String(valor).split('-');
  if (partes.length !== 3) return null;

  var fecha = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2]),
    finDelDia ? 23 : 0,
    finDelDia ? 59 : 0,
    finDelDia ? 59 : 0,
    finDelDia ? 999 : 0
  );

  return isNaN(fecha.getTime()) ? null : fecha;
}

function obtenerAuditoriaSistema(token, filtros) {
  validarAdministradorSistema(token);

  filtros = filtros || {};

  const hoja = obtenerHoja(HOJAS.AUDITORIA);
  const valores = hoja.getDataRange().getValues();

  if (valores.length <= 1) {
    return {
      items: [],
      total: 0,
      pagina: 1,
      tamanoPagina: Number(filtros.tamanoPagina || 25),
      totalPaginas: 0,
      truncado: false
    };
  }

  const encabezados = valores[0].map(function (valor) {
    return normalizarTexto(valor).replace(/\s+/g, '');
  });

  function indice() {
    for (var i = 0; i < arguments.length; i++) {
      var encontrado = encabezados.indexOf(normalizarTexto(arguments[i]).replace(/\s+/g, ''));
      if (encontrado !== -1) return encontrado;
    }
    return -1;
  }

  const columnas = {
    fecha: indice('fecha', 'fechahora'),
    usuario: indice('usuario'),
    nombre: indice('nombre'),
    accion: indice('accion'),
    entidad: indice('entidad'),
    idRegistro: indice('idregistro', 'id'),
    detalle: indice('detalle')
  };

  var fechaDesde = convertirFechaFiltroAuditoria(filtros.fechaDesde, false);
  var fechaHasta = convertirFechaFiltroAuditoria(filtros.fechaHasta, true);
  var textoBusqueda = normalizarTexto(filtros.busqueda || '').trim();

  var items = valores.slice(1)
    .filter(function (fila) {
      return fila.some(function (celda) {
        return String(celda || '').trim() !== '';
      });
    })
    .map(function (fila) {
      return {
        fecha: columnas.fecha >= 0 ? fila[columnas.fecha] : fila[0],
        usuario: columnas.usuario >= 0 ? fila[columnas.usuario] : fila[1],
        nombre: columnas.nombre >= 0 ? fila[columnas.nombre] : fila[2],
        accion: columnas.accion >= 0 ? fila[columnas.accion] : fila[3],
        entidad: columnas.entidad >= 0 ? fila[columnas.entidad] : fila[4],
        idRegistro: columnas.idRegistro >= 0 ? fila[columnas.idRegistro] : fila[5],
        detalle: columnas.detalle >= 0 ? fila[columnas.detalle] : fila[6]
      };
    })
    .filter(function (item) {
      var fechaItem = new Date(item.fecha);
      var fechaValida = !isNaN(fechaItem.getTime());

      if (fechaDesde && (!fechaValida || fechaItem < fechaDesde)) return false;
      if (fechaHasta && (!fechaValida || fechaItem > fechaHasta)) return false;

      if (textoBusqueda) {
        var contenido = normalizarTexto([
          item.usuario,
          item.nombre,
          item.accion,
          item.entidad,
          item.idRegistro,
          item.detalle
        ].join(' '));

        if (contenido.indexOf(textoBusqueda) === -1) return false;
      }

      return true;
    })
    .sort(function (a, b) {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

  var total = items.length;
  var exportar = filtros.exportar === true || String(filtros.exportar).toLowerCase() === 'true';

  if (exportar) {
    var limiteExportacion = 20000;
    return {
      items: items.slice(0, limiteExportacion),
      total: total,
      pagina: 1,
      tamanoPagina: Math.min(total, limiteExportacion),
      totalPaginas: total > 0 ? 1 : 0,
      truncado: total > limiteExportacion,
      limiteExportacion: limiteExportacion
    };
  }

  var tamanoSolicitado = Number(filtros.tamanoPagina || filtros.limite || 25);
  var tamanosPermitidos = [10, 25, 50, 100];
  var tamanoPagina = tamanosPermitidos.indexOf(tamanoSolicitado) >= 0
    ? tamanoSolicitado
    : 25;

  var totalPaginas = total === 0 ? 0 : Math.ceil(total / tamanoPagina);
  var paginaSolicitada = Math.max(1, Number(filtros.pagina || 1));
  var pagina = totalPaginas > 0 ? Math.min(paginaSolicitada, totalPaginas) : 1;
  var inicio = (pagina - 1) * tamanoPagina;

  return {
    items: items.slice(inicio, inicio + tamanoPagina),
    total: total,
    pagina: pagina,
    tamanoPagina: tamanoPagina,
    totalPaginas: totalPaginas,
    truncado: false
  };
}
