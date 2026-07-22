/**
 * ============================================================
 * INSTALADOR SPRINT 2 - MOTOR DE EJECUCIÓN
 * ============================================================
 * Ejecute instalarSprint2Minutograma() una sola vez.
 */
function instalarSprint2Minutograma() {
  instalarColumnasEjecucionMinutograma_();
  instalarRolCampaneroYPermisos_();
  return 'Sprint 2 del Paso a paso instalado correctamente.';
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
    'Usuario Fin',
    'Fecha Pausa Actual',
    'Tiempo Pausado Segundos',
    'Usuario Pausa',
    'Usuario Reanudación'
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
    'VER_PASO_A_PASO',
    'VER_DASHBOARD_PASO_A_PASO',
    'REGISTRAR_ACTIVIDAD_PASO_A_PASO',
    'EDITAR_ACTIVIDAD_PASO_A_PASO',
    'ELIMINAR_ACTIVIDAD_PASO_A_PASO',
    'ACTUALIZAR_ESTADO_PASO_A_PASO',
    'INICIAR_ACTIVIDAD_PASO_A_PASO',
    'PAUSAR_ACTIVIDAD_PASO_A_PASO',
    'REANUDAR_ACTIVIDAD_PASO_A_PASO',
    'FINALIZAR_ACTIVIDAD_PASO_A_PASO'
  ];

  const permisosCampanero = [
    'VER_PASO_A_PASO',
    'VER_DASHBOARD_PASO_A_PASO',
    'INICIAR_ACTIVIDAD_PASO_A_PASO',
    'PAUSAR_ACTIVIDAD_PASO_A_PASO',
    'REANUDAR_ACTIVIDAD_PASO_A_PASO',
    'FINALIZAR_ACTIVIDAD_PASO_A_PASO'
  ];

  asegurarRegistroSeguridad_('Roles', {
    rol: 'Campanero',
    nombre: 'Campanero',
    descripcion: 'Responsable del control operativo y del tiempo del paso a paso.',
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
    if (clave === 'actualizadoPor') return 'INSTALADOR_SPRINT_2';
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
