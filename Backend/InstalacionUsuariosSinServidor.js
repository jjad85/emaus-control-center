/** Instala RF-01: usuarios con asociación opcional a servidor. */
function instalarUsuariosSinServidor() {
  const hoja = obtenerHoja(HOJAS.USUARIOS);
  const requeridas = ['Nombre','Servidor ID','Correo','Celular','Versión Sesión','Debe Cambiar Password'];
  const actuales = hoja.getRange(1,1,1,hoja.getLastColumn()).getDisplayValues()[0];
  const normalizados = actuales.map(normalizarEncabezadoUsuarioAdministracion_);
  requeridas.forEach(function(nombre) {
    if (normalizados.indexOf(normalizarEncabezadoUsuarioAdministracion_(nombre)) === -1) {
      hoja.getRange(1, hoja.getLastColumn()+1).setValue(nombre);
      normalizados.push(normalizarEncabezadoUsuarioAdministracion_(nombre));
    }
  });
  const permisos = ['USUARIOS_CONSULTAR','USUARIOS_CREAR','USUARIOS_EDITAR'];
  const roles = leerHojaComoObjetos(HOJAS.ROLES).filter(function(r){return convertirBooleano(r.activo);});
  const hp = obtenerHoja(HOJAS.PERMISOS_ROL);
  const existentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  permisos.forEach(function(permiso){
    roles.forEach(function(rol){
      const existe = existentes.some(function(x){return normalizarCodigoRol_(x.rol)===normalizarCodigoRol_(rol.rol)&&normalizarPermiso(x.permiso)===permiso;});
      if (!existe) hp.appendRow([rol.rol, permiso, normalizarCodigoRol_(rol.rol)==='admin'?'Sí':'No']);
    });
  });
  limpiarCachePermisos();
  return {ok:true,columnas:requeridas,permisos:permisos};
}
