/**
 * RF-03 - Parametrización de alertas de la campana por rol.
 */
const HOJA_CONFIGURACION_ALERTAS = 'ConfiguracionAlertas';

function obtenerCatalogoAlertas_() {
  return [
    { codigo:'ASPIRANTES_PENDIENTES_GESTION', categoria:'Personas', nombre:'Aspirantes pendientes de gestión', descripcion:'Se muestra cuando existen aspirantes activos pendientes de convertir o rechazar.', codigoCampana:'ASPIRANTES_PENDIENTES' },
    { codigo:'PAGOS_PENDIENTES_VALIDACION', categoria:'Tesorería', nombre:'Pagos pendientes de validar', descripcion:'Se muestra cuando existen comprobantes reportados pendientes de validación.', codigoCampana:'PAGOS_PENDIENTES' },
    { codigo:'PRESENTACIONES_NOVEDADES', categoria:'Presentaciones', nombre:'Novedades en presentaciones', descripcion:'Agrupa comentarios, revisiones, aprobaciones y solicitudes de ajuste no leídas.', codigoCampana:'PRESENTACIONES_PENDIENTES' },
    { codigo:'WHATSAPP_INSCRIPCION_PENDIENTE', categoria:'Comunicaciones', nombre:'Inscripciones pendientes por notificar', descripcion:'Se muestra cuando hay mensajes de inscripción pendientes de gestionar por WhatsApp.', codigoCampana:'WHATSAPP_INSCRIPCION' },
    { codigo:'WHATSAPP_APROBACION_PENDIENTE', categoria:'Comunicaciones', nombre:'Aprobaciones pendientes por notificar', descripcion:'Se muestra cuando hay mensajes de aprobación pendientes de gestionar por WhatsApp.', codigoCampana:'WHATSAPP_APROBACION' },
    { codigo:'WHATSAPP_CANCELACION_PENDIENTE', categoria:'Comunicaciones', nombre:'Cancelaciones pendientes por notificar', descripcion:'Se muestra cuando hay mensajes de cancelación pendientes de gestionar por WhatsApp.', codigoCampana:'WHATSAPP_CANCELACION' },
    { codigo:'WHATSAPP_PAGO_RECHAZADO_PENDIENTE', categoria:'Comunicaciones', nombre:'Pagos rechazados pendientes por notificar', descripcion:'Se muestra cuando hay pagos rechazados pendientes de comunicar por WhatsApp.', codigoCampana:'WHATSAPP_PAGO_RECHAZADO' }
  ];
}

function obtenerRolesAlertas_() {
  return leerHojaComoObjetos(HOJAS.ROLES)
    .filter(function(r){ return r.activo === undefined || convertirBooleano(r.activo); })
    .map(function(r){ return { rol:String(r.rol || '').trim(), descripcion:String(r.descripcion || '') }; })
    .filter(function(r){ return r.rol; });
}

function asegurarHojaConfiguracionAlertas_() {
  const libro = obtenerLibro();
  let hoja = libro.getSheetByName(HOJA_CONFIGURACION_ALERTAS);
  if (!hoja) hoja = libro.insertSheet(HOJA_CONFIGURACION_ALERTAS);
  if (hoja.getLastRow() === 0) hoja.appendRow(['Alerta','Rol','Activo','FechaActualizacion','ActualizadoPor']);
  return hoja;
}

function obtenerMatrizInicialAlertas_() {
  return {
    ASPIRANTES_PENDIENTES_GESTION:['ADMIN','LIDER_RETIRO','REGISTRO'],
    PAGOS_PENDIENTES_VALIDACION:['ADMIN','LIDER_RETIRO','TESORERIA'],
    PRESENTACIONES_NOVEDADES:['ADMIN','AUDIOVISUAL','LIDER_RETIRO','SERVIDOR'],
    WHATSAPP_INSCRIPCION_PENDIENTE:['ADMIN','LIDER_RETIRO','REGISTRO'],
    WHATSAPP_APROBACION_PENDIENTE:['ADMIN','LIDER_RETIRO','REGISTRO'],
    WHATSAPP_CANCELACION_PENDIENTE:['ADMIN','LIDER_RETIRO','REGISTRO'],
    WHATSAPP_PAGO_RECHAZADO_PENDIENTE:['ADMIN','LIDER_RETIRO','TESORERIA']
  };
}

function instalarConfiguracionAlertas() {
  const hoja = asegurarHojaConfiguracionAlertas_();
  const catalogo = obtenerCatalogoAlertas_();
  const roles = obtenerRolesAlertas_();
  const inicial = obtenerMatrizInicialAlertas_();
  const existentes = leerHojaComoObjetos(HOJA_CONFIGURACION_ALERTAS);
  const claves = {};
  existentes.forEach(function(x){ claves[normalizarTexto(x.alerta)+'|'+normalizarTexto(x.rol)] = true; });
  catalogo.forEach(function(alerta){
    roles.forEach(function(rol){
      const clave = normalizarTexto(alerta.codigo)+'|'+normalizarTexto(rol.rol);
      if (!claves[clave]) hoja.appendRow([alerta.codigo, rol.rol, (inicial[alerta.codigo] || []).indexOf(rol.rol) >= 0 ? 'Sí' : 'No', new Date(), 'INSTALADOR']);
    });
  });
  SpreadsheetApp.flush();
  return { instalado:true, alertas:catalogo.length, roles:roles.length };
}

function obtenerConfiguracionAlertas(token) {
  validarAdministradorSistema(token);
  asegurarHojaConfiguracionAlertas_();
  const filas = leerHojaComoObjetos(HOJA_CONFIGURACION_ALERTAS);
  const matriz = {};
  filas.forEach(function(f){
    const codigo = String(f.alerta || '').trim();
    const rol = String(f.rol || '').trim();
    if (!codigo || !rol) return;
    if (!matriz[codigo]) matriz[codigo] = [];
    if (convertirBooleano(f.activo)) matriz[codigo].push(rol);
  });
  return { alertas:obtenerCatalogoAlertas_(), roles:obtenerRolesAlertas_(), rolesPorAlerta:matriz };
}

function guardarConfiguracionAlertas(token, configuracion) {
  const sesion = validarAdministradorSistema(token);
  const hoja = asegurarHojaConfiguracionAlertas_();
  const catalogo = obtenerCatalogoAlertas_();
  const roles = obtenerRolesAlertas_();
  const seleccion = configuracion && typeof configuracion === 'object' ? configuracion : {};
  const valores = [['Alerta','Rol','Activo','FechaActualizacion','ActualizadoPor']];
  catalogo.forEach(function(alerta){
    const activos = Array.isArray(seleccion[alerta.codigo]) ? seleccion[alerta.codigo] : [];
    roles.forEach(function(rol){ valores.push([alerta.codigo, rol.rol, activos.indexOf(rol.rol) >= 0 ? 'Sí' : 'No', new Date(), sesion.usuario || '']); });
  });
  hoja.clearContents();
  hoja.getRange(1,1,valores.length,valores[0].length).setValues(valores);
  registrarAuditoria({ usuario:sesion.usuario, nombre:sesion.nombre, accion:'ACTUALIZAR_CONFIGURACION_ALERTAS', entidad:'ConfiguracionAlertas', idRegistro:'MATRIZ', detalle:'Actualizó la matriz de alertas por rol.' });
  SpreadsheetApp.flush();
  return obtenerConfiguracionAlertas(token);
}

function estaAlertaHabilitadaParaRol_(codigoAlerta, rol) {
  asegurarHojaConfiguracionAlertas_();
  const filas = leerHojaComoObjetos(HOJA_CONFIGURACION_ALERTAS);
  const coincidencia = filas.find(function(f){ return normalizarTexto(f.alerta) === normalizarTexto(codigoAlerta) && normalizarTexto(f.rol) === normalizarTexto(rol); });
  if (coincidencia) return convertirBooleano(coincidencia.activo);
  const inicial = obtenerMatrizInicialAlertas_();
  return (inicial[codigoAlerta] || []).some(function(r){ return normalizarTexto(r) === normalizarTexto(rol); });
}
