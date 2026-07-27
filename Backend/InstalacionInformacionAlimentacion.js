/**
 * RF-02 - Información de alimentación.
 * Ejecutar una sola vez después de desplegar el backend.
 * Agrega columnas sin eliminar información y registra el permiso de exportación.
 */
function instalarInformacionAlimentacion() {
  const columnas = [
    'Tiene Condición Alimentaria',
    'Alergias Alimentarias',
    'Restricciones Alimentarias',
    'Preferencias Alimentarias',
    'Dieta Especial'
  ];

  agregarColumnasAlimentacion_(HOJAS.ASPIRANTES, columnas);
  agregarColumnasAlimentacion_(HOJAS.CAMINANTES, columnas);

  const hojaPermisos = obtenerHoja(HOJAS.PERMISOS_ROL);
  const permisos = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const rolesHabilitados = ['ADMIN', 'LIDER_RETIRO', 'LOGISTICA'];
  const roles = leerHojaComoObjetos(HOJAS.ROLES)
    .filter(function(item) { return convertirBooleano(item.activo); })
    .map(function(item) { return String(item.rol || '').trim(); })
    .filter(Boolean);

  roles.forEach(function(rol) {
    const existe = permisos.some(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto(rol) &&
        normalizarPermiso(item.permiso) === 'ALIMENTACION_EXPORTAR';
    });

    if (!existe) {
      hojaPermisos.appendRow([
        rol,
        'ALIMENTACION_EXPORTAR',
        rolesHabilitados.indexOf(String(rol).toUpperCase()) >= 0 ? 'Sí' : 'No'
      ]);
    }
  });


  if (roles.some(function(rol) { return String(rol).toUpperCase() === 'LOGISTICA'; })) {
    const existeConsultaLogistica = permisos.some(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto('LOGISTICA') &&
        normalizarPermiso(item.permiso) === 'ASPIRANTES_VER_DETALLE';
    });
    if (!existeConsultaLogistica) {
      hojaPermisos.appendRow(['LOGISTICA', 'ASPIRANTES_VER_DETALLE', 'Sí']);
    }
  }

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    hojas: [HOJAS.ASPIRANTES, HOJAS.CAMINANTES],
    columnas: columnas,
    permiso: 'ALIMENTACION_EXPORTAR'
  };
}

function agregarColumnasAlimentacion_(nombreHoja, columnas) {
  const hoja = obtenerHoja(nombreHoja);
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const actuales = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0]
    .map(function(valor) { return normalizarTexto(valor); });

  columnas.forEach(function(encabezado) {
    if (actuales.indexOf(normalizarTexto(encabezado)) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(normalizarTexto(encabezado));
    }
  });

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, hoja.getLastColumn());
}
