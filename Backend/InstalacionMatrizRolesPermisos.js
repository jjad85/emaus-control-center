/**
 * Instala los roles definitivos y la matriz de permisos del retiro.
 * Ejecutar una sola vez: instalarMatrizRolesPermisosDefinitiva()
 */
function instalarMatrizRolesPermisosDefinitiva() {
  const libro = obtenerLibro();
  const roles = [
    ['ADMIN', 'Administración completa del sistema.', 'Sí'],
    ['AUDIOVISUAL', 'Gestión audiovisual y presentaciones.', 'Sí'],
    ['LIDER_RETIRO', 'Liderazgo y operación general del retiro.', 'Sí'],
    ['LIDER_MESA', 'Acompañamiento de caminantes de mesa.', 'Sí'],
    ['SERVIDOR', 'Servidor del retiro.', 'Sí'],
    ['REGISTRO', 'Registro y gestión de aspirantes.', 'Sí'],
    ['TESORERIA', 'Gestión financiera y comprobantes.', 'Sí'],
    ['CAMPANERO', 'Operación del paso a paso.', 'Sí']
  ];

  const permisos = obtenerCatalogoPermisosDefinitivo_();
  const matriz = obtenerMatrizInicialRolesPermisos_();

  const hojaRoles = asegurarHojaConEncabezados_(libro, HOJAS.ROLES, ['Rol', 'Descripción', 'Activo']);
  const hojaPermisos = asegurarHojaConEncabezados_(libro, HOJAS.PERMISOS_ROL, ['Rol', 'Permiso', 'Activo']);

  const rolesExistentes = leerHojaComoObjetos(HOJAS.ROLES);
  roles.forEach(function(fila) {
    const existe = rolesExistentes.some(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto(fila[0]);
    });
    if (!existe) hojaRoles.appendRow(fila);
  });

  const existentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const indice = {};
  existentes.forEach(function(item, i) {
    indice[normalizarTexto(item.rol) + '|' + normalizarPermiso(item.permiso)] = i + 2;
  });

  roles.forEach(function(rolFila) {
    const rol = rolFila[0];
    permisos.forEach(function(item) {
      const permiso = item.codigo;
      const activo = (matriz[rol] || []).indexOf(permiso) >= 0 ? 'Sí' : 'No';
      const clave = normalizarTexto(rol) + '|' + permiso;
      if (indice[clave]) {
        hojaPermisos.getRange(indice[clave], 3).setValue(activo);
      } else {
        hojaPermisos.appendRow([rol, permiso, activo]);
      }
    });
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();
  return { roles: roles.length, permisos: permisos.length, instalado: true };
}

function asegurarHojaConEncabezados_(libro, nombre, encabezados) {
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (hoja.getLastRow() === 0) hoja.appendRow(encabezados);
  return hoja;
}

function obtenerCatalogoPermisosDefinitivo_() {
  return [
    ['DASHBOARD_VER','Dashboard','Dashboard','Ver dashboard'],
    ['ASPIRANTES_VER_DETALLE','Personas','Aspirantes','Ver detalle'],
    ['ALIMENTACION_EXPORTAR','Personas','Aspirantes','Exportar alimentación'],
    ['ASPIRANTES_NOTIFICAR_PREINSCRIPCION','Personas','Aspirantes','Notificar preinscripción'],
    ['ASPIRANTES_CAMBIAR_ESTADO','Personas','Aspirantes','Cambiar estado'],
    ['CAMINANTES_VER_DETALLE','Personas','Caminantes','Ver detalle'],
    ['CAMINANTES_EDITAR','Personas','Caminantes','Editar'],
    ['CAMINANTES_ASIGNAR_MESA','Personas','Caminantes','Asignar mesa'],
    ['CAMINANTES_ASIGNAR_HABITACION','Personas','Caminantes','Asignar habitación'],
    ['CAMINANTES_REPORTAR_CARTA','Personas','Caminantes','Reportar estado de carta'],
    ['CAMINANTES_REPORTAR_FOTO','Personas','Caminantes','Reportar estado de foto'],
    ['CAMINANTES_REGISTRAR','Personas','Caminantes','Registrar caminante'],
    ['CAMINANTES_FILTROS','Personas','Caminantes','Usar filtros'],
    ['SERVIDORES_VER_DETALLE','Personas','Servidores','Ver detalle'],
    ['SERVIDORES_EDITAR','Personas','Servidores','Editar'],
    ['SERVIDORES_ASIGNAR_EQUIPO','Personas','Servidores','Asignar equipo'],
    ['SERVIDORES_ASIGNAR_HABITACION','Personas','Servidores','Asignar habitación'],
    ['EQUIPOS_VER_DETALLE','Logística','Equipos','Ver detalle'],
    ['EQUIPOS_CREAR','Logística','Equipos','Crear equipo'],
    ['EQUIPOS_ASIGNAR_SERVIDOR','Logística','Equipos','Asignar servidor'],
    ['EQUIPOS_EDITAR','Logística','Equipos','Editar'],
    ['HABITACIONES_VER_DETALLE','Logística','Habitaciones','Ver detalle'],
    ['HABITACIONES_EDITAR','Logística','Habitaciones','Editar'],
    ['HABITACIONES_ASIGNAR_PERSONA','Logística','Habitaciones','Asignar persona'],
    ['MESAS_VER_DETALLE','Logística','Mesas','Ver detalle'],
    ['MESAS_ASIGNAR_CAMINANTE','Logística','Mesas','Asignar caminante'],
    ['MESAS_ELIMINAR','Logística','Mesas','Eliminar mesa'],
    ['PRESENTACIONES_TODO','Logística','Presentaciones','Acceso completo'],
    ['PAGOS_VER_ESTADOS_CUENTA','Tesorería','Estados de cuenta','Ver estados de cuenta'],
    ['PAGOS_EXPORTAR_ESTADOS_CUENTA','Tesorería','Estados de cuenta','Exportar estados de cuenta'],
    ['PAGOS_EXPORTAR_COMPROBANTES','Tesorería','Estados de cuenta','Exportar comprobantes'],
    ['PAGOS_VALIDAR_COMPROBANTE','Tesorería','Estados de cuenta','Validar comprobante'],
    ['PAGOS_VER_COMPROBANTE','Tesorería','Estados de cuenta','Ver comprobante'],
    ['REPORTAR_PAGO_REGISTRAR','Tesorería','Reportar pagos','Reportar pago'],
    ['REPORTAR_PAGO_TODO','Tesorería','Reportar pagos','Acceso completo'],
    ['TEMAS_VER_DETALLE','Operación del retiro','Temas','Ver detalle'],
    ['TEMAS_EDITAR','Operación del retiro','Temas','Editar'],
    ['TEMAS_DESACTIVAR','Operación del retiro','Temas','Desactivar'],
    ['TEMAS_CREAR','Operación del retiro','Temas','Crear nuevo'],
    ['PASO_A_PASO_VER_DETALLE','Operación del retiro','Paso a paso','Ver detalle'],
    ['PASO_A_PASO_EXPORTAR','Operación del retiro','Paso a paso','Exportar'],
    ['PASO_A_PASO_IMPORTAR','Operación del retiro','Paso a paso','Importar'],
    ['PASO_A_PASO_REGISTRAR_ACTIVIDAD','Operación del retiro','Paso a paso','Registrar actividad'],
    ['PASO_A_PASO_CAMBIAR_ESTADO','Operación del retiro','Paso a paso','Cambiar estado'],
    ['PASO_A_PASO_CAMBIAR_ORDEN','Operación del retiro','Paso a paso','Cambiar orden'],
    ['PASO_A_PASO_INICIAR','Operación del retiro','Paso a paso','Iniciar'],
    ['PASO_A_PASO_EDITAR','Operación del retiro','Paso a paso','Editar'],
    ['SISTEMA_TODO','Sistema','Sistema','Acceso completo'],
    ['FECHAS_IMPORTANTES_GESTIONAR','Sistema','Fechas importantes','Gestionar'],
    ['MI_CUENTA_VER','Mi menú','Mi cuenta','Ver'],
    ['MI_MENU_REPORTAR_PAGO','Mi menú','Reporte de pago','Ver y reportar'],
    ['CODIGO_VESTUARIO_VER','Mi menú','Código de vestuario','Ver'],
    ['MIS_TEMAS_VER','Mi menú','Mis temas','Ver']
  ].map(function(x){return {codigo:x[0], modulo:x[1], pagina:x[2], accion:x[3]};});
}

function obtenerMatrizInicialRolesPermisos_() {
  const todos = obtenerCatalogoPermisosDefinitivo_().map(function(x){return x.codigo;});
  const todosRoles = ['ADMIN','AUDIOVISUAL','LIDER_RETIRO','LIDER_MESA','SERVIDOR','REGISTRO','TESORERIA','CAMPANERO'];
  const mapa = {};
  todosRoles.forEach(function(r){mapa[r]=[];});
  mapa.ADMIN = todos.slice();
  function dar(permiso, roles){roles.forEach(function(r){mapa[r].push(permiso);});}
  const todosConsulta = todosRoles;
  dar('DASHBOARD_VER', todosConsulta);
  dar('ASPIRANTES_VER_DETALLE', todosConsulta);
  dar('ASPIRANTES_NOTIFICAR_PREINSCRIPCION',['LIDER_RETIRO','REGISTRO']);
  dar('ASPIRANTES_CAMBIAR_ESTADO',['LIDER_RETIRO','REGISTRO']);
  dar('CAMINANTES_VER_DETALLE',todosConsulta);
  dar('CAMINANTES_EDITAR',['LIDER_RETIRO','REGISTRO']);
  dar('CAMINANTES_ASIGNAR_MESA',['LIDER_RETIRO']);
  dar('CAMINANTES_ASIGNAR_HABITACION',['LIDER_RETIRO']);
  dar('CAMINANTES_REPORTAR_CARTA',['LIDER_RETIRO','LIDER_MESA']);
  dar('CAMINANTES_REPORTAR_FOTO',['LIDER_RETIRO','LIDER_MESA']);
  dar('CAMINANTES_REGISTRAR',['LIDER_RETIRO','REGISTRO']);
  dar('CAMINANTES_FILTROS',todosConsulta);
  dar('SERVIDORES_VER_DETALLE',todosConsulta);
  dar('SERVIDORES_EDITAR',['LIDER_RETIRO']);
  dar('SERVIDORES_ASIGNAR_EQUIPO',['LIDER_RETIRO']);
  dar('SERVIDORES_ASIGNAR_HABITACION',['LIDER_RETIRO']);
  dar('EQUIPOS_VER_DETALLE',todosConsulta);
  dar('EQUIPOS_CREAR',['LIDER_RETIRO']);
  dar('EQUIPOS_ASIGNAR_SERVIDOR',['LIDER_RETIRO']);
  dar('EQUIPOS_EDITAR',['LIDER_RETIRO']);
  dar('HABITACIONES_VER_DETALLE',todosConsulta);
  dar('HABITACIONES_EDITAR',['LIDER_RETIRO']);
  dar('HABITACIONES_ASIGNAR_PERSONA',['LIDER_RETIRO']);
  dar('MESAS_VER_DETALLE',todosConsulta);
  dar('MESAS_ASIGNAR_CAMINANTE',['LIDER_RETIRO']);
  dar('MESAS_ELIMINAR',['LIDER_RETIRO']);
  dar('PRESENTACIONES_TODO',['AUDIOVISUAL','LIDER_RETIRO']);
  dar('PAGOS_VER_ESTADOS_CUENTA',todosConsulta);
  dar('PAGOS_EXPORTAR_ESTADOS_CUENTA',['LIDER_RETIRO','TESORERIA']);
  dar('PAGOS_EXPORTAR_COMPROBANTES',['LIDER_RETIRO','TESORERIA']);
  dar('PAGOS_VALIDAR_COMPROBANTE',['LIDER_RETIRO','TESORERIA']);
  dar('PAGOS_VER_COMPROBANTE',['LIDER_RETIRO','TESORERIA']);
  dar('REPORTAR_PAGO_REGISTRAR',['LIDER_RETIRO','TESORERIA']);
  dar('REPORTAR_PAGO_TODO',['LIDER_RETIRO','TESORERIA']);
  dar('TEMAS_VER_DETALLE',todosConsulta);
  dar('TEMAS_EDITAR',['LIDER_RETIRO']);
  dar('TEMAS_DESACTIVAR',['LIDER_RETIRO']);
  dar('TEMAS_CREAR',['LIDER_RETIRO']);
  dar('PASO_A_PASO_VER_DETALLE',todosConsulta);
  dar('PASO_A_PASO_EXPORTAR',todosConsulta);
  dar('PASO_A_PASO_IMPORTAR',['LIDER_RETIRO']);
  dar('PASO_A_PASO_REGISTRAR_ACTIVIDAD',['LIDER_RETIRO']);
  dar('PASO_A_PASO_CAMBIAR_ESTADO',['LIDER_RETIRO','CAMPANERO']);
  dar('PASO_A_PASO_CAMBIAR_ORDEN',['LIDER_RETIRO']);
  dar('PASO_A_PASO_INICIAR',['LIDER_RETIRO','CAMPANERO']);
  dar('PASO_A_PASO_EDITAR',['LIDER_RETIRO']);
  dar('SISTEMA_TODO',['LIDER_RETIRO']);
  dar('FECHAS_IMPORTANTES_GESTIONAR',['LIDER_RETIRO']);
  ['MI_CUENTA_VER','MI_MENU_REPORTAR_PAGO','CODIGO_VESTUARIO_VER','MIS_TEMAS_VER'].forEach(function(p){dar(p,todosConsulta);});
  Object.keys(mapa).forEach(function(r){mapa[r]=Array.from(new Set(mapa[r]));});
  return mapa;
}
