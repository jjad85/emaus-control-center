/**
 * ============================================================
 * INSTALADOR SPRINT 3 - ALERTAS INTELIGENTES
 * ============================================================
 * Ejecute instalarSprint3Minutograma() una sola vez.
 */
function instalarSprint3Minutograma() {
  instalarColumnasAlertasMinutograma_();
  instalarPermisosAlertasMinutograma_();
  return 'Sprint 3 del Minutograma instalado correctamente.';
}

function instalarColumnasAlertasMinutograma_() {
  const hoja = obtenerHoja(HOJAS.MINUTOGRAMA);
  const encabezadosActuales = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0];

  const requeridos = [
    'Alertas Emitidas',
    'Historial Alertas'
  ];

  const normalizados = encabezadosActuales.map(normalizarTexto);

  requeridos.forEach(function(encabezado) {
    if (normalizados.indexOf(normalizarTexto(encabezado)) === -1) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      normalizados.push(normalizarTexto(encabezado));
    }
  });

  hoja.setFrozenRows(1);
}

function instalarPermisosAlertasMinutograma_() {
  const permiso = 'REGISTRAR_ALERTA_PASO_A_PASO';

  ['Administrador', 'Campanero'].forEach(function(rol) {
    asegurarRegistroSeguridadSprint3_('PermisosRol', {
      rol: rol,
      permiso: permiso,
      activo: 'Sí'
    });
  });
}

function asegurarRegistroSeguridadSprint3_(nombreHoja, datos) {
  const hoja = obtenerHoja(nombreHoja);
  const encabezados = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0];

  const claves = encabezados.map(convertirEncabezadoAClaveSprint3_);
  const filas = hoja.getLastRow() > 1
    ? hoja
        .getRange(2, 1, hoja.getLastRow() - 1, encabezados.length)
        .getDisplayValues()
    : [];

  const existe = filas.some(function(fila) {
    const objeto = {};

    claves.forEach(function(clave, indice) {
      objeto[clave] = fila[indice];
    });

    return (
      normalizarTexto(objeto.rol) === normalizarTexto(datos.rol) &&
      normalizarTexto(objeto.permiso) === normalizarTexto(datos.permiso)
    );
  });

  if (existe) return;

  const nuevaFila = claves.map(function(clave) {
    if (Object.prototype.hasOwnProperty.call(datos, clave)) {
      return datos[clave];
    }

    if (clave === 'id') return Utilities.getUuid();
    if (clave === 'fechaRegistro' || clave === 'fechaActualizacion') {
      return new Date();
    }
    if (clave === 'actualizadoPor') return 'INSTALADOR_SPRINT_3';

    return '';
  });

  hoja.appendRow(nuevaFila);
}

function convertirEncabezadoAClaveSprint3_(encabezado) {
  const palabras = String(encabezado || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/);

  return palabras
    .map(function(palabra, indice) {
      const base = palabra.toLowerCase();
      return indice === 0
        ? base
        : base.charAt(0).toUpperCase() + base.slice(1);
    })
    .join('');
}
