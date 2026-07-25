/**
 * ============================================================
 * FECHAS IMPORTANTES SERVICE
 * ============================================================
 * CRUD de fechas visibles en el dashboard.
 * La eliminación es lógica para conservar trazabilidad.
 */

const PERMISO_GESTIONAR_FECHAS_IMPORTANTES = 'FECHAS_IMPORTANTES_GESTIONAR';

function obtenerFechasImportantes(token, parametros) {
  validarPermisoSesion(
    token,
    PERMISO_GESTIONAR_FECHAS_IMPORTANTES,
    'No tiene permisos para consultar las fechas importantes.'
  );

  const contexto = obtenerContextoFechasImportantes_();
  const incluirInactivas = convertirBooleano(parametros && parametros.incluirInactivas);
  const zonaHoraria = Session.getScriptTimeZone() || 'America/Bogota';
  const hoy = inicioDiaFechasImportantes_(new Date());

  const items = contexto.datos
    .slice(1)
    .map(function(fila, indice) {
      const numeroFila = indice + 2;
      const fecha = normalizarFechaImportante_(fila[contexto.indices.fecha]);
      const descripcion = String(fila[contexto.indices.descripcion] || '').trim();
      const id = contexto.indices.id >= 0
        ? String(fila[contexto.indices.id] || '').trim()
        : '';
      const activo = contexto.indices.activo >= 0
        ? convertirBooleano(fila[contexto.indices.activo])
        : true;

      if (!fecha || !descripcion) return null;
      if (!incluirInactivas && !activo) return null;

      const fechaDia = inicioDiaFechasImportantes_(fecha);
      const diasRestantes = Math.round((fechaDia.getTime() - hoy.getTime()) / 86400000);

      return {
        id: id || 'FILA_' + numeroFila,
        numeroFila: numeroFila,
        fecha: Utilities.formatDate(fechaDia, zonaHoraria, 'yyyy-MM-dd'),
        fechaTexto: Utilities.formatDate(fechaDia, zonaHoraria, 'dd/MM/yyyy'),
        descripcion: descripcion,
        activo: activo,
        diasRestantes: diasRestantes,
        estado: !activo
          ? 'inactiva'
          : diasRestantes < 0
            ? 'vencida'
            : diasRestantes === 0
              ? 'hoy'
              : diasRestantes <= 7
                ? 'proxima'
                : 'futura'
      };
    })
    .filter(Boolean)
    .sort(compararFechasImportantes_);

  return {
    items: items,
    resumen: {
      total: items.length,
      proximas: items.filter(function(item) { return item.activo && item.diasRestantes >= 0; }).length,
      vencidas: items.filter(function(item) { return item.activo && item.diasRestantes < 0; }).length,
      inactivas: items.filter(function(item) { return !item.activo; }).length
    }
  };
}

function registrarFechaImportante(token, datos) {
  const sesion = validarPermisoSesion(
    token,
    PERMISO_GESTIONAR_FECHAS_IMPORTANTES,
    'No tiene permisos para crear fechas importantes.'
  );

  const entrada = validarDatosFechaImportante_(datos);
  const contexto = obtenerContextoFechasImportantes_();
  validarDuplicadoFechaImportante_(contexto, entrada, '');

  const ahora = new Date();
  const id = Utilities.getUuid();
  const fila = new Array(contexto.encabezados.length).fill('');

  fila[contexto.indices.fecha] = entrada.fecha;
  fila[contexto.indices.descripcion] = entrada.descripcion;
  if (contexto.indices.id >= 0) fila[contexto.indices.id] = id;
  if (contexto.indices.activo >= 0) fila[contexto.indices.activo] = 'Sí';
  if (contexto.indices.creadoEn >= 0) fila[contexto.indices.creadoEn] = ahora;
  if (contexto.indices.creadoPor >= 0) fila[contexto.indices.creadoPor] = sesion.usuario || sesion.nombre || '';
  if (contexto.indices.actualizadoEn >= 0) fila[contexto.indices.actualizadoEn] = ahora;
  if (contexto.indices.actualizadoPor >= 0) fila[contexto.indices.actualizadoPor] = sesion.usuario || sesion.nombre || '';

  contexto.hoja.appendRow(fila);
  ordenarHojaFechasImportantes_(contexto.hoja, contexto.indices.fecha);

  registrarAuditoriaFechaImportante_(sesion, 'CREAR_FECHA_IMPORTANTE', id, {
    fecha: formatearFechaIsoImportante_(entrada.fecha),
    descripcion: entrada.descripcion
  });

  return { id: id, creado: true };
}

function editarFechaImportante(token, idIngresado, datos) {
  const sesion = validarPermisoSesion(
    token,
    PERMISO_GESTIONAR_FECHAS_IMPORTANTES,
    'No tiene permisos para editar fechas importantes.'
  );

  const id = String(idIngresado || '').trim();
  if (!id) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_ID_REQUERIDO', 'Debe indicar la fecha que desea editar.');
  }

  const entrada = validarDatosFechaImportante_(datos);
  const contexto = obtenerContextoFechasImportantes_();
  const registro = buscarFechaImportante_(contexto, id);

  if (!registro) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_NO_EXISTE', 'La fecha importante ya no existe o fue modificada.');
  }

  validarDuplicadoFechaImportante_(contexto, entrada, id);

  const anterior = {
    fecha: formatearFechaIsoImportante_(normalizarFechaImportante_(registro.fila[contexto.indices.fecha])),
    descripcion: String(registro.fila[contexto.indices.descripcion] || '').trim()
  };

  contexto.hoja.getRange(registro.numeroFila, contexto.indices.fecha + 1).setValue(entrada.fecha);
  contexto.hoja.getRange(registro.numeroFila, contexto.indices.descripcion + 1).setValue(entrada.descripcion);
  if (contexto.indices.actualizadoEn >= 0) contexto.hoja.getRange(registro.numeroFila, contexto.indices.actualizadoEn + 1).setValue(new Date());
  if (contexto.indices.actualizadoPor >= 0) contexto.hoja.getRange(registro.numeroFila, contexto.indices.actualizadoPor + 1).setValue(sesion.usuario || sesion.nombre || '');

  ordenarHojaFechasImportantes_(contexto.hoja, contexto.indices.fecha);

  registrarAuditoriaFechaImportante_(sesion, 'EDITAR_FECHA_IMPORTANTE', id, {
    anterior: anterior,
    nuevo: {
      fecha: formatearFechaIsoImportante_(entrada.fecha),
      descripcion: entrada.descripcion
    }
  });

  return { id: id, actualizado: true };
}

function eliminarFechaImportante(token, idIngresado) {
  const sesion = validarPermisoSesion(
    token,
    PERMISO_GESTIONAR_FECHAS_IMPORTANTES,
    'No tiene permisos para eliminar fechas importantes.'
  );

  const id = String(idIngresado || '').trim();
  if (!id) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_ID_REQUERIDO', 'Debe indicar la fecha que desea eliminar.');
  }

  const contexto = obtenerContextoFechasImportantes_();
  const registro = buscarFechaImportante_(contexto, id);
  if (!registro) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_NO_EXISTE', 'La fecha importante ya no existe o fue modificada.');
  }

  if (contexto.indices.activo < 0) {
    throw crearErrorAplicacion('FECHAS_IMPORTANTES_ESTRUCTURA_INVALIDA', 'La hoja FechasImportantes no contiene la columna Activo. Ejecute instalarGestionFechasImportantes().');
  }

  contexto.hoja.getRange(registro.numeroFila, contexto.indices.activo + 1).setValue('No');
  if (contexto.indices.actualizadoEn >= 0) contexto.hoja.getRange(registro.numeroFila, contexto.indices.actualizadoEn + 1).setValue(new Date());
  if (contexto.indices.actualizadoPor >= 0) contexto.hoja.getRange(registro.numeroFila, contexto.indices.actualizadoPor + 1).setValue(sesion.usuario || sesion.nombre || '');

  registrarAuditoriaFechaImportante_(sesion, 'ELIMINAR_FECHA_IMPORTANTE', id, {
    fecha: formatearFechaIsoImportante_(normalizarFechaImportante_(registro.fila[contexto.indices.fecha])),
    descripcion: String(registro.fila[contexto.indices.descripcion] || '').trim()
  });

  return { id: id, eliminado: true };
}

function restaurarFechaImportante(token, idIngresado) {
  const sesion = validarPermisoSesion(
    token,
    PERMISO_GESTIONAR_FECHAS_IMPORTANTES,
    'No tiene permisos para restaurar fechas importantes.'
  );

  const id = String(idIngresado || '').trim();
  const contexto = obtenerContextoFechasImportantes_();
  const registro = buscarFechaImportante_(contexto, id);
  if (!registro) throw crearErrorAplicacion('FECHA_IMPORTANTE_NO_EXISTE', 'La fecha importante no existe.');

  const entrada = {
    fecha: normalizarFechaImportante_(registro.fila[contexto.indices.fecha]),
    descripcion: String(registro.fila[contexto.indices.descripcion] || '').trim()
  };
  validarDuplicadoFechaImportante_(contexto, entrada, id);

  contexto.hoja.getRange(registro.numeroFila, contexto.indices.activo + 1).setValue('Sí');
  if (contexto.indices.actualizadoEn >= 0) contexto.hoja.getRange(registro.numeroFila, contexto.indices.actualizadoEn + 1).setValue(new Date());
  if (contexto.indices.actualizadoPor >= 0) contexto.hoja.getRange(registro.numeroFila, contexto.indices.actualizadoPor + 1).setValue(sesion.usuario || sesion.nombre || '');

  registrarAuditoriaFechaImportante_(sesion, 'RESTAURAR_FECHA_IMPORTANTE', id, entrada);
  return { id: id, restaurado: true };
}

function obtenerContextoFechasImportantes_() {
  const hoja = obtenerHoja(HOJAS.FECHAS_IMPORTANTES);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(function(valor) { return convertirEncabezado(valor); });
  const indices = {
    fecha: encabezados.indexOf('fecha'),
    descripcion: encabezados.indexOf('descripcion'),
    id: encabezados.indexOf('id'),
    activo: encabezados.indexOf('activo'),
    creadoEn: encabezados.indexOf('creadoen'),
    creadoPor: encabezados.indexOf('creadopor'),
    actualizadoEn: encabezados.indexOf('actualizadoen'),
    actualizadoPor: encabezados.indexOf('actualizadopor')
  };

  if (indices.fecha < 0 || indices.descripcion < 0) {
    throw crearErrorAplicacion('FECHAS_IMPORTANTES_ESTRUCTURA_INVALIDA', 'La hoja FechasImportantes debe contener las columnas Fecha y Descripción.');
  }

  return { hoja: hoja, datos: datos, encabezados: encabezados, indices: indices };
}

function buscarFechaImportante_(contexto, id) {
  for (var indice = 1; indice < contexto.datos.length; indice += 1) {
    const fila = contexto.datos[indice];
    const idFila = contexto.indices.id >= 0 ? String(fila[contexto.indices.id] || '').trim() : 'FILA_' + (indice + 1);
    if (idFila === id) return { numeroFila: indice + 1, fila: fila };
  }
  return null;
}

function validarDatosFechaImportante_(datos) {
  const fecha = normalizarFechaImportante_(datos && datos.fecha);
  const descripcion = String(datos && datos.descripcion || '').replace(/\s+/g, ' ').trim();

  if (!fecha || isNaN(fecha.getTime())) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_FECHA_INVALIDA', 'Ingrese una fecha válida.');
  }
  if (!descripcion) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_DESCRIPCION_REQUERIDA', 'La descripción es obligatoria.');
  }
  if (descripcion.length < 3) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_DESCRIPCION_CORTA', 'La descripción debe tener al menos 3 caracteres.');
  }
  if (descripcion.length > 160) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_DESCRIPCION_LARGA', 'La descripción no puede superar los 160 caracteres.');
  }

  return { fecha: inicioDiaFechasImportantes_(fecha), descripcion: descripcion };
}

function validarDuplicadoFechaImportante_(contexto, entrada, idExcluido) {
  const fechaIso = formatearFechaIsoImportante_(entrada.fecha);
  const descripcionNormalizada = normalizarTexto(entrada.descripcion);

  const existe = contexto.datos.slice(1).some(function(fila, indice) {
    const idFila = contexto.indices.id >= 0 ? String(fila[contexto.indices.id] || '').trim() : 'FILA_' + (indice + 2);
    if (idFila === idExcluido) return false;
    if (contexto.indices.activo >= 0 && !convertirBooleano(fila[contexto.indices.activo])) return false;
    const fechaFila = normalizarFechaImportante_(fila[contexto.indices.fecha]);
    const descripcionFila = normalizarTexto(fila[contexto.indices.descripcion]);
    return fechaFila && formatearFechaIsoImportante_(fechaFila) === fechaIso && descripcionFila === descripcionNormalizada;
  });

  if (existe) {
    throw crearErrorAplicacion('FECHA_IMPORTANTE_DUPLICADA', 'Ya existe una fecha activa con la misma fecha y descripción.');
  }
}

function normalizarFechaImportante_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  const texto = String(valor || '').trim();
  if (!texto) return null;
  const matchIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (matchIso) {
    const fechaIso = new Date(Number(matchIso[1]), Number(matchIso[2]) - 1, Number(matchIso[3]));
    return fechaIso.getFullYear() === Number(matchIso[1]) && fechaIso.getMonth() === Number(matchIso[2]) - 1 && fechaIso.getDate() === Number(matchIso[3]) ? fechaIso : null;
  }
  const matchLatino = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(texto);
  if (matchLatino) {
    const fechaLatina = new Date(Number(matchLatino[3]), Number(matchLatino[2]) - 1, Number(matchLatino[1]));
    return fechaLatina.getFullYear() === Number(matchLatino[3]) && fechaLatina.getMonth() === Number(matchLatino[2]) - 1 && fechaLatina.getDate() === Number(matchLatino[1]) ? fechaLatina : null;
  }
  return null;
}

function inicioDiaFechasImportantes_(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearFechaIsoImportante_(fecha) {
  if (!fecha) return '';
  return Utilities.formatDate(fecha, Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd');
}

function compararFechasImportantes_(a, b) {
  if (a.activo !== b.activo) return a.activo ? -1 : 1;
  const aFutura = a.diasRestantes >= 0;
  const bFutura = b.diasRestantes >= 0;
  if (aFutura !== bFutura) return aFutura ? -1 : 1;
  if (aFutura) return a.fecha.localeCompare(b.fecha) || a.descripcion.localeCompare(b.descripcion, 'es');
  return b.fecha.localeCompare(a.fecha) || a.descripcion.localeCompare(b.descripcion, 'es');
}

function ordenarHojaFechasImportantes_(hoja, indiceFecha) {
  if (hoja.getLastRow() > 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).sort({ column: indiceFecha + 1, ascending: true });
  }
}

function registrarAuditoriaFechaImportante_(sesion, accion, id, detalle) {
  if (typeof registrarAuditoria !== 'function') return;
  registrarAuditoria({
    usuario: sesion.usuario || '',
    nombre: sesion.nombre || '',
    accion: accion,
    entidad: 'FechasImportantes',
    idRegistro: id,
    detalle: JSON.stringify(detalle || {})
  });
}
