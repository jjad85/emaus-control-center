/**
 * RF-06 y RF-07.
 * Ejecutar una sola vez: instalarRolLogisticaYFlujoEntregables()
 */
function instalarRolLogisticaYFlujoEntregables() {
  const libro = obtenerLibro();
  const hojaRoles = asegurarHojaConEncabezados_(
    libro,
    HOJAS.ROLES,
    ['Rol', 'Descripción', 'Activo']
  );
  const roles = leerHojaComoObjetos(HOJAS.ROLES);
  const existeLogistica = roles.some(function(item) {
    return normalizarTexto(item.rol) === normalizarTexto('LOGISTICA');
  });
  if (!existeLogistica) {
    hojaRoles.appendRow([
      'LOGISTICA',
      'Gestión logística, entregables y elementos físicos.',
      'Sí'
    ]);
  }

  const permiso = 'CAMINANTES_APROBAR_ENTREGA_LOGISTICA';
  const permisosInicialesLogistica = [
    'DASHBOARD_VER',
    'CAMINANTES_VER_DETALLE',
    'CAMINANTES_FILTROS',
    'CAMINANTES_REPORTAR_CARTA',
    'CAMINANTES_REPORTAR_FOTO',
    permiso
  ];
  const hojaPermisos = asegurarHojaConEncabezados_(
    libro,
    HOJAS.PERMISOS_ROL,
    ['Rol', 'Permiso', 'Activo']
  );
  const permisos = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const existePermiso = permisos.some(function(item) {
    return normalizarTexto(item.rol) === normalizarTexto('LOGISTICA') &&
      normalizarPermiso(item.permiso) === permiso;
  });
  if (!existePermiso) {
    hojaPermisos.appendRow(['LOGISTICA', permiso, 'Sí']);
  }

  // Habilita el flujo mínimo requerido por el rol nuevo.
  permisosInicialesLogistica.forEach(function(codigo) {
    const filas = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
    const indice = filas.findIndex(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto('LOGISTICA') &&
        normalizarPermiso(item.permiso) === codigo;
    });
    if (indice >= 0) {
      hojaPermisos.getRange(indice + 2, 3).setValue('Sí');
    } else {
      hojaPermisos.appendRow(['LOGISTICA', codigo, 'Sí']);
    }
  });

  // Garantiza que el rol aparezca con todas las filas de la matriz,
  // conservando la administración normal desde Sistema.
  const catalogo = obtenerCatalogoPermisosDefinitivo_();
  const permisosActualizados = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  catalogo.forEach(function(item) {
    const existe = permisosActualizados.some(function(fila) {
      return normalizarTexto(fila.rol) === normalizarTexto('LOGISTICA') &&
        normalizarPermiso(fila.permiso) === item.codigo;
    });
    if (!existe) {
      hojaPermisos.appendRow([
        'LOGISTICA',
        item.codigo,
        permisosInicialesLogistica.indexOf(item.codigo) >= 0 ? 'Sí' : 'No'
      ]);
    }
  });

  const hojaCaminantes = obtenerHoja(HOJAS.CAMINANTES);
  agregarColumnasSiNoExistenRF07_(hojaCaminantes, [
    'Carta Aprobada Logística Por',
    'Carta Fecha Aprobación Logística',
    'Foto Aprobada Logística Por',
    'Foto Fecha Aprobación Logística'
  ]);

  migrarEstadosEntregablesRF07_(hojaCaminantes);
  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    rol: 'LOGISTICA',
    permisoAprobacion: permiso,
    estados: [
      'Pendiente',
      'Solicitada',
      'Entregada',
      'Empaquetada',
      'Entregada a Logística'
    ]
  };
}

function agregarColumnasSiNoExistenRF07_(hoja, nombres) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0];
  const normalizados = encabezados.map(function(valor) {
    return normalizarTexto(valor);
  });
  nombres.forEach(function(nombre) {
    if (normalizados.indexOf(normalizarTexto(nombre)) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(nombre);
      normalizados.push(normalizarTexto(nombre));
    }
  });
}

function migrarEstadosEntregablesRF07_(hoja) {
  if (hoja.getLastRow() < 2) return;
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const indiceCarta = encabezados.findIndex(function(x) {
    return normalizarTexto(x) === 'carta';
  });
  const indiceFoto = encabezados.findIndex(function(x) {
    return normalizarTexto(x) === 'foto';
  });
  if (indiceCarta < 0 && indiceFoto < 0) return;

  const rango = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn());
  const datos = rango.getValues();
  function migrar(valor) {
    const estado = normalizarTexto(valor);
    if (!estado || estado === 'sin definir') return 'Pendiente';
    if (estado === 'en proceso') return 'Solicitada';
    if (estado === 'completado' || estado === 'completa') return 'Entregada';
    return valor;
  }
  datos.forEach(function(fila) {
    if (indiceCarta >= 0) fila[indiceCarta] = migrar(fila[indiceCarta]);
    if (indiceFoto >= 0) fila[indiceFoto] = migrar(fila[indiceFoto]);
  });
  rango.setValues(datos);
}
