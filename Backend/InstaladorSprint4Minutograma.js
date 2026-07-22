/**
 * INSTALADOR SPRINT 4 - BACKEND MINUTOGRAMA
 * Ejecutar una sola vez: instalarSprint4BackendMinutograma()
 */
function instalarSprint4BackendMinutograma() {
  instalarColumnasSprint4Minutograma_();
  instalarPermisosSprint4Minutograma_();
  validarEstructuraSprint4Minutograma_();

  return {
    ok: true,
    mensaje: 'Sprint 4 Backend del Paso a paso instalado correctamente.',
    fecha: new Date().toISOString()
  };
}

function instalarColumnasSprint4Minutograma_() {
  const hoja = obtenerHoja(HOJAS.MINUTOGRAMA);
  const columnas = [
    'Fecha Inicio Real',
    'Fecha Fin Real',
    'Duracion Real Minutos',
    'Variacion Minutos',
    'Usuario Inicio',
    'Usuario Fin',
    'Fecha Pausa Actual',
    'Tiempo Pausado Segundos',
    'Usuario Pausa',
    'Usuario Reanudacion',
    'Alertas Emitidas',
    'Historial Alertas'
  ];

  asegurarEncabezadosSprint4_(hoja, columnas);
  hoja.setFrozenRows(1);
}

function instalarPermisosSprint4Minutograma_() {
  const permisosPorRol = {
    Administrador: [
      'REGISTRAR_ACTIVIDAD_PASO_A_PASO',
      'EDITAR_ACTIVIDAD_PASO_A_PASO',
      'ELIMINAR_ACTIVIDAD_PASO_A_PASO',
      'ACTUALIZAR_ESTADO_PASO_A_PASO',
      'INICIAR_ACTIVIDAD_PASO_A_PASO',
      'PAUSAR_ACTIVIDAD_PASO_A_PASO',
      'REANUDAR_ACTIVIDAD_PASO_A_PASO',
      'FINALIZAR_ACTIVIDAD_PASO_A_PASO',
      'REGISTRAR_ALERTA_PASO_A_PASO'
    ],
    Campanero: [
      'ACTUALIZAR_ESTADO_PASO_A_PASO',
      'INICIAR_ACTIVIDAD_PASO_A_PASO',
      'PAUSAR_ACTIVIDAD_PASO_A_PASO',
      'REANUDAR_ACTIVIDAD_PASO_A_PASO',
      'FINALIZAR_ACTIVIDAD_PASO_A_PASO',
      'REGISTRAR_ALERTA_PASO_A_PASO'
    ],
    Coordinador: [
      'REGISTRAR_ACTIVIDAD_PASO_A_PASO',
      'EDITAR_ACTIVIDAD_PASO_A_PASO',
      'ACTUALIZAR_ESTADO_PASO_A_PASO',
      'INICIAR_ACTIVIDAD_PASO_A_PASO',
      'PAUSAR_ACTIVIDAD_PASO_A_PASO',
      'REANUDAR_ACTIVIDAD_PASO_A_PASO',
      'FINALIZAR_ACTIVIDAD_PASO_A_PASO'
    ]
  };

  Object.keys(permisosPorRol).forEach(function(rol) {
    permisosPorRol[rol].forEach(function(permiso) {
      asegurarPermisoSprint4_(rol, permiso);
    });
  });
}

function asegurarEncabezadosSprint4_(hoja, encabezadosRequeridos) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const existentes = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];
  const normalizados = existentes.map(normalizarTexto);

  encabezadosRequeridos.forEach(function(encabezado) {
    if (normalizados.indexOf(normalizarTexto(encabezado)) !== -1) return;

    hoja
      .getRange(1, hoja.getLastColumn() + 1)
      .setValue(encabezado);

    normalizados.push(normalizarTexto(encabezado));
  });
}

function asegurarPermisoSprint4_(rol, permiso) {
  const hoja = obtenerHoja('PermisosRol');
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];

  const claves = encabezados.map(convertirEncabezadoAClaveSprint4_);
  const filas = hoja.getLastRow() > 1
    ? hoja
        .getRange(2, 1, hoja.getLastRow() - 1, encabezados.length)
        .getDisplayValues()
    : [];

  const existe = filas.some(function(fila) {
    const registro = {};
    claves.forEach(function(clave, indice) {
      registro[clave] = fila[indice];
    });

    return (
      normalizarTexto(registro.rol) === normalizarTexto(rol) &&
      normalizarTexto(registro.permiso) === normalizarTexto(permiso) &&
      convertirBooleano(registro.activo)
    );
  });

  if (existe) return;

  const nuevaFila = claves.map(function(clave) {
    if (clave === 'id') return Utilities.getUuid();
    if (clave === 'rol') return rol;
    if (clave === 'permiso') return permiso;
    if (clave === 'activo') return 'Sí';
    if (clave === 'fechaRegistro' || clave === 'fechaActualizacion') return new Date();
    if (clave === 'actualizadoPor') return 'INSTALADOR_SPRINT_4';
    return '';
  });

  hoja.appendRow(nuevaFila);
}

function convertirEncabezadoAClaveSprint4_(encabezado) {
  const palabras = String(encabezado || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return palabras
    .map(function(palabra, indice) {
      const base = palabra.toLowerCase();
      return indice === 0
        ? base
        : base.charAt(0).toUpperCase() + base.slice(1);
    })
    .join('');
}

function validarEstructuraSprint4Minutograma_() {
  const hoja = obtenerHoja(HOJAS.MINUTOGRAMA);
  const encabezados = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(normalizarTexto);

  const obligatorios = [
    'id',
    'orden',
    'dia',
    'hora inicio',
    'duracion minutos',
    'actividad',
    'responsable',
    'lugar',
    'estado',
    'activo'
  ];

  const faltantes = obligatorios.filter(function(encabezado) {
    return encabezados.indexOf(normalizarTexto(encabezado)) === -1;
  });

  if (faltantes.length > 0) {
    throw crearErrorAplicacion(
      'ESTRUCTURA_PASO_A_PASO_INCOMPLETA',
      'Faltan columnas obligatorias en Minutograma: ' + faltantes.join(', ')
    );
  }
}