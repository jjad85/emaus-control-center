/**
 * ============================================================
 * INSTALADOR SPRINT 1 - MINUTOGRAMA + CAMPANERO
 * ============================================================
 * Ejecute instalarSprint1Minutograma() una sola vez.
 */
function instalarSprint1Minutograma() {
  instalarColumnasEjecucionMinutograma_();
  instalarRolCampaneroYPermisos_();
  return 'Sprint 1 del Minutograma instalado correctamente.';
}

function instalarColumnasEjecucionMinutograma_() {
  const hoja = obtenerHoja(HOJAS.MINUTOGRAMA);
  const encabezadosActuales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0];
  const requeridos = [
    'Fecha Inicio Real',
    'Fecha Fin Real',
    'Duración Real Minutos',
    'Variación Minutos',
    'Usuario Inicio',
    'Usuario Fin'
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

function instalarRolCampaneroYPermisos_() {
  const permisosAdministrador = [
    'VER_MINUTOGRAMA',
    'VER_DASHBOARD_MINUTOGRAMA',
    'REGISTRAR_ACTIVIDAD_MINUTOGRAMA',
    'EDITAR_ACTIVIDAD_MINUTOGRAMA',
    'ELIMINAR_ACTIVIDAD_MINUTOGRAMA',
    'ACTUALIZAR_ESTADO_MINUTOGRAMA',
    'INICIAR_ACTIVIDAD_MINUTOGRAMA',
    'FINALIZAR_ACTIVIDAD_MINUTOGRAMA'
  ];

  const permisosCampanero = [
    'VER_MINUTOGRAMA',
    'VER_DASHBOARD_MINUTOGRAMA',
    'INICIAR_ACTIVIDAD_MINUTOGRAMA',
    'FINALIZAR_ACTIVIDAD_MINUTOGRAMA'
  ];

  asegurarRegistroSeguridad_('Roles', {
    rol: 'Campanero',
    nombre: 'Campanero',
    descripcion: 'Responsable del control operativo y del tiempo del minutograma.',
    activo: 'Sí'
  });

  permisosAdministrador.forEach(function(permiso) {
    asegurarRegistroSeguridad_('PermisosRol', {
      rol: 'Administrador',
      permiso: permiso,
      activo: 'Sí'
    });
  });

  permisosCampanero.forEach(function(permiso) {
    asegurarRegistroSeguridad_('PermisosRol', {
      rol: 'Campanero',
      permiso: permiso,
      activo: 'Sí'
    });
  });
}

function asegurarRegistroSeguridad_(nombreHoja, datos) {
  const hoja = obtenerHoja(nombreHoja);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0];
  const claves = encabezados.map(function(item) {
    return convertirEncabezadoAClaveInstalador_(item);
  });
  const filas = hoja.getLastRow() > 1
    ? hoja.getRange(2, 1, hoja.getLastRow() - 1, encabezados.length).getDisplayValues()
    : [];

  const existe = filas.some(function(fila) {
    const objeto = {};
    claves.forEach(function(clave, indice) { objeto[clave] = fila[indice]; });

    if (nombreHoja === 'Roles') {
      return normalizarTexto(objeto.rol || objeto.nombre) === normalizarTexto(datos.rol);
    }

    return (
      normalizarTexto(objeto.rol) === normalizarTexto(datos.rol) &&
      normalizarTexto(objeto.permiso) === normalizarTexto(datos.permiso)
    );
  });

  if (existe) return;

  const nuevaFila = claves.map(function(clave) {
    if (Object.prototype.hasOwnProperty.call(datos, clave)) return datos[clave];
    if (clave === 'id') return Utilities.getUuid();
    if (clave === 'fechaRegistro' || clave === 'fechaActualizacion') return new Date();
    if (clave === 'actualizadoPor') return 'INSTALADOR_SPRINT_1';
    return '';
  });

  hoja.appendRow(nuevaFila);
}

function convertirEncabezadoAClaveInstalador_(encabezado) {
  const palabras = String(encabezado || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/);

  return palabras.map(function(palabra, indice) {
    const base = palabra.toLowerCase();
    return indice === 0 ? base : base.charAt(0).toUpperCase() + base.slice(1);
  }).join('');
}
