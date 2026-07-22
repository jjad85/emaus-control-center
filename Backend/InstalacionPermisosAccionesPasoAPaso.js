/**
 * Agrega permisos independientes para las acciones operativas del Paso a paso.
 * Ejecutar una sola vez: instalarPermisosAccionesPasoAPaso()
 */
function instalarPermisosAccionesPasoAPaso() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const valores = hoja.getDataRange().getValues();

  if (!valores.length) {
    throw new Error('La hoja PermisosRol no contiene encabezados.');
  }

  const encabezados = valores[0].map(function(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  });

  const indiceRol = encabezados.indexOf('rol');
  const indicePermiso = encabezados.indexOf('permiso');
  const indiceActivo = encabezados.indexOf('activo');

  if (indiceRol < 0 || indicePermiso < 0 || indiceActivo < 0) {
    throw new Error('La hoja PermisosRol debe contener las columnas Rol, Permiso y Activo.');
  }

  const porRol = {};
  const roles = {};

  for (let i = 1; i < valores.length; i += 1) {
    const rol = String(valores[i][indiceRol] || '').trim();
    const permiso = normalizarPermiso(valores[i][indicePermiso]);
    if (!rol || !permiso) continue;

    roles[rol] = true;
    if (!porRol[rol]) porRol[rol] = {};
    porRol[rol][permiso] = convertirBooleano(valores[i][indiceActivo]);
  }

  const configuracion = [
    {
      permiso: 'CREAR_ACTIVIDADES_PASO_A_PASO',
      hereda: ['REGISTRAR_ACTIVIDAD_PASO_A_PASO', 'REGISTRAR_ACTIVIDAD_MINUTOGRAMA']
    },
    {
      permiso: 'IMPORTAR_ACTIVIDADES_PASO_A_PASO',
      hereda: ['REGISTRAR_ACTIVIDAD_PASO_A_PASO', 'REGISTRAR_ACTIVIDAD_MINUTOGRAMA']
    },
    {
      permiso: 'EXPORTAR_ACTIVIDADES_PASO_A_PASO',
      hereda: ['VER_PASO_A_PASO', 'VER_MINUTOGRAMA']
    },
    {
      permiso: 'MOVER_ACTIVIDADES_PASO_A_PASO',
      hereda: ['EDITAR_ACTIVIDAD_PASO_A_PASO', 'EDITAR_ACTIVIDAD_MINUTOGRAMA']
    }
  ];

  const nuevasFilas = [];
  Object.keys(roles).forEach(function(rol) {
    const permisosRol = porRol[rol] || {};

    configuracion.forEach(function(item) {
      if (Object.prototype.hasOwnProperty.call(permisosRol, item.permiso)) return;

      const activo = item.hereda.some(function(anterior) {
        return permisosRol[anterior] === true;
      });

      const fila = new Array(valores[0].length).fill('');
      fila[indiceRol] = rol;
      fila[indicePermiso] = item.permiso;
      fila[indiceActivo] = activo ? 'Sí' : 'No';
      nuevasFilas.push(fila);
    });
  });

  if (nuevasFilas.length) {
    hoja.getRange(
      hoja.getLastRow() + 1,
      1,
      nuevasFilas.length,
      nuevasFilas[0].length
    ).setValues(nuevasFilas);
  }

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    permisosAgregados: nuevasFilas.length,
    rolesProcesados: Object.keys(roles).length
  };
}
