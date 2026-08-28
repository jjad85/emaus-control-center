/**
 * ============================================================
 * SHEET UTILS
 * ============================================================
 * Funciones comunes para acceder a Google Sheets.
 */

/**
 * Nombre de la propiedad del script que contiene
 * el ID del Google Sheets utilizado por el ambiente.
 */
const PROPIEDAD_SPREADSHEET_ID =
  'EMAUS_SPREADSHEET_ID';

/**
 * Contexto efímero de acceso a Sheets.
 * Se reinicia al comienzo de cada doGet/doPost y evita abrir o leer
 * repetidamente el mismo libro/hoja dentro de una sola solicitud.
 */
var CONTEXTO_SHEETS_SOLICITUD_ = null;

function iniciarContextoSolicitud_() {
  CONTEXTO_SHEETS_SOLICITUD_ = {
    inicioMs: Date.now(),
    libro: null,
    hojas: {},
    datos: {},
    encabezadosCrud: {},
    hojasLeidas: {},
    lecturasFisicas: 0
  };
  return CONTEXTO_SHEETS_SOLICITUD_;
}

function obtenerContextoSolicitud_() {
  if (!CONTEXTO_SHEETS_SOLICITUD_) {
    return iniciarContextoSolicitud_();
  }
  return CONTEXTO_SHEETS_SOLICITUD_;
}

function obtenerCacheSolicitud_(clave) {
  var contexto = obtenerContextoSolicitud_();
  return Object.prototype.hasOwnProperty.call(contexto.datos, clave)
    ? contexto.datos[clave]
    : undefined;
}

function guardarCacheSolicitud_(clave, valor) {
  obtenerContextoSolicitud_().datos[clave] = valor;
  return valor;
}

function copiarRegistrosSolicitud_(registros) {
  return (registros || []).map(function(registro) {
    return Object.assign({}, registro);
  });
}

function registrarLecturaFisicaSolicitud_(nombreHoja) {
  var contexto = obtenerContextoSolicitud_();
  contexto.lecturasFisicas += 1;
  contexto.hojasLeidas[nombreHoja] =
    (contexto.hojasLeidas[nombreHoja] || 0) + 1;
}

function invalidarCacheHojaSolicitud_(nombreHoja) {
  var contexto = obtenerContextoSolicitud_();
  Object.keys(contexto.datos).forEach(function(clave) {
    if (
      clave === 'HOJA:' + nombreHoja ||
      clave === 'CRUD:' + nombreHoja ||
      clave.indexOf('HOJA:' + nombreHoja + ':') === 0 ||
      clave.indexOf('CRUD:' + nombreHoja + ':') === 0
    ) {
      delete contexto.datos[clave];
    }
  });
  delete contexto.encabezadosCrud[nombreHoja];
}

function obtenerDiagnosticoSolicitud_() {
  var contexto = obtenerContextoSolicitud_();
  return {
    duracionMs: Math.max(0, Date.now() - contexto.inicioMs),
    lecturasFisicas: contexto.lecturasFisicas,
    hojasLeidas: Object.keys(contexto.hojasLeidas).map(function(nombre) {
      return {
        hoja: nombre,
        lecturas: contexto.hojasLeidas[nombre]
      };
    })
  };
}



/**
 * Nombre de las hojas.
 */
const HOJAS = {
  CONFIGURACIONES: 'Configuraciones',
  LISTAS: 'Listas',
  CAMINANTES: 'Caminantes',
  SERVIDORES: 'Servidores',
  PRESENTACIONES: 'Presentaciones',
  HABITACIONES: 'Habitaciones',
  USUARIOS: 'Usuarios',
  AUDITORIA: 'Auditoria',
  ROLES: 'Roles',
  PERMISOS_ROL: 'PermisosRol',
  MINUTOGRAMA: 'Minutograma',
  ASPIRANTES: 'Aspirantes',
  RECUPERACIONES_CLAVE: 'RecuperacionesClave',
  TEMAS: 'Temas',
  PAGOS: 'Pagos',
  GASTOS: 'Gastos',
  FECHAS_IMPORTANTES: 'FechasImportantes',
  DOCUMENTOS: 'Documentos',
  ANGELITOS: 'Angelitos',
  SERENATA: 'Serenata'
};


/**
 * Obtiene el ID del Google Sheets configurado
 * en las Propiedades del script.
 */
function obtenerSpreadsheetId() {

  const spreadsheetId =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        PROPIEDAD_SPREADSHEET_ID
      );

  if(
    !spreadsheetId ||
    String(spreadsheetId).trim()==''
  ){

    throw crearErrorAplicacion(
      'CONFIGURACION_INVALIDA',
      'No existe la propiedad "' +
      PROPIEDAD_SPREADSHEET_ID +
      '" en las Propiedades del script.'
    );

  }

  return String(spreadsheetId).trim();

}


/**
 * Abre el libro.
 */
function obtenerLibro() {
  const contexto = obtenerContextoSolicitud_();
  if (!contexto.libro) {
    contexto.libro = SpreadsheetApp.openById(
      obtenerSpreadsheetId()
    );
  }
  return contexto.libro;
}


/**
 * Obtiene una hoja.
 */
function obtenerHoja(nombreHoja){
  const contexto = obtenerContextoSolicitud_();
  if (contexto.hojas[nombreHoja]) {
    return contexto.hojas[nombreHoja];
  }

  const hoja = obtenerLibro().getSheetByName(nombreHoja);
  if(!hoja){
    throw crearErrorAplicacion(
      'HOJA_NO_EXISTE',
      'No existe la hoja "' + nombreHoja + '".'
    );
  }

  contexto.hojas[nombreHoja] = hoja;
  return hoja;
}


/**
 * Lee una hoja completa y devuelve
 * un arreglo de objetos.
 */
function leerHojaComoObjetos(nombreHoja){
  const claveCache = 'HOJA:' + nombreHoja;
  const almacenados = obtenerCacheSolicitud_(claveCache);
  if (almacenados !== undefined) {
    return copiarRegistrosSolicitud_(almacenados);
  }

  const hoja = obtenerHoja(nombreHoja);
  const datos = hoja.getDataRange().getDisplayValues();
  registrarLecturaFisicaSolicitud_(nombreHoja);

  if(datos.length<=1){
    guardarCacheSolicitud_(claveCache, []);
    return [];
  }

  const encabezados = datos[0].map(convertirEncabezado);
  const registros = datos
    .slice(1)
    .filter(function(fila){
      return fila.some(function(valor){
        return String(valor).trim()!='';
      });
    })
    .map(function(fila){
      const objeto={};
      encabezados.forEach(function(campo,i){
        objeto[campo]=fila[i] || '';
      });
      return objeto;
    });

  guardarCacheSolicitud_(claveCache, registros);
  return copiarRegistrosSolicitud_(registros);
}


/**
 * Convierte encabezados
 * de Google Sheets
 * a propiedades javascript.
 */
function convertirEncabezado(texto){

  const limpio =
    normalizarTexto(texto);

  const mapa={
    'id':'id',
    'número inscripción':'numeroInscripcion',
    'numero inscripcion':'numeroInscripcion',
    'nombre completo':'nombreCompleto',
    'primer nombre':'primerNombre',
    'segundo nombre':'segundoNombre',
    'primer apellido':'primerApellido',
    'segundo apellido':'segundoApellido',
    'primernombre':'primerNombre',
    'segundonombre':'segundoNombre',
    'primerapellido':'primerApellido',
    'segundoapellido':'segundoApellido',
    'documento identidad':'documentoIdentidad',
    'dirección residencia':'direccionResidencia',
    'direccion residencia':'direccionResidencia',
    'fecha nacimiento':'fechaNacimiento',
    'edad':'edad',
    'barrio':'barrio',
    'estado civil':'estadoCivil',
    'parroquia':'parroquia',
    'sufre enfermedad':'sufreEnfermedad',
    'enfermedad cual':'enfermedadCual',
    'toma medicamento':'tomaMedicamento',
    'medicamento cual':'medicamentoCual',
    'horarios medicamentos':'horariosMedicamentos',
    'eps':'eps',
    'profesión ocupación':'profesionOcupacion',
    'profesion ocupacion':'profesionOcupacion',
    'tiene limitación física':'tieneLimitacionFisica',
    'tiene limitacion fisica':'tieneLimitacionFisica',
    'limitación cual':'limitacionCual',
    'limitacion cual':'limitacionCual',
    'sacramentos recibidos':'sacramentosRecibidos',
    'talla camisa':'tallaCamisa',
    'contacto 1 nombre':'contacto1Nombre',
    'contacto 1 parentesco':'contacto1Parentesco',
    'contacto 1 celular':'contacto1Celular',
    'contacto 2 nombre':'contacto2Nombre',
    'contacto 2 parentesco':'contacto2Parentesco',
    'contacto 2 celular':'contacto2Celular',
    'cómo se enteró':'comoSeEntero',
    'como se entero':'comoSeEntero',
    'nombre persona invitó':'nombrePersonaInvito',
    'nombre persona invito':'nombrePersonaInvito',
    'celular persona invitó':'celularPersonaInvito',
    'celular persona invito':'celularPersonaInvito',
    'persona conocida asistirá':'personaConocidaAsistira',
    'persona conocida asistira':'personaConocidaAsistira',
    'nombre persona conocida':'nombrePersonaConocida',
    'autoriza tratamiento datos':'autorizaTratamientoDatos',
    'autorización tratamiento de datos personales':'autorizaTratamientoDatos',
    'autorizacion tratamiento de datos personales':'autorizaTratamientoDatos',
    'autoriza fotografías':'autorizaFotografias',
    'autoriza fotografias':'autorizaFotografias',
    'autorización uso de fotografías':'autorizaFotografias',
    'autorizacion uso de fotografias':'autorizaFotografias',
    'estado autorización datos':'estadoAutorizacionDatos',
    'estado autorizacion datos':'estadoAutorizacionDatos',
    'estado autorización fotografías':'estadoAutorizacionFotografias',
    'estado autorizacion fotografias':'estadoAutorizacionFotografias',
    'versión autorización datos':'versionAutorizacionDatos',
    'version autorizacion datos':'versionAutorizacionDatos',
    'fecha aceptación datos':'fechaAceptacionDatos',
    'fecha aceptacion datos':'fechaAceptacionDatos',
    'texto autorización datos':'textoAutorizacionDatos',
    'texto autorizacion datos':'textoAutorizacionDatos',
    'versión autorización fotografías':'versionAutorizacionFotografias',
    'version autorizacion fotografias':'versionAutorizacionFotografias',
    'fecha aceptación fotografías':'fechaAceptacionFotografias',
    'fecha aceptacion fotografias':'fechaAceptacionFotografias',
    'texto autorización fotografías':'textoAutorizacionFotografias',
    'texto autorizacion fotografias':'textoAutorizacionFotografias',
    'estado solicitud':'estadoSolicitud',
    'observaciones gestión':'observacionesGestion',
    'observaciones gestion':'observacionesGestion',

    'tipo registrante':'tipoRegistrante',
    'nombre registrante':'nombreRegistrante',
    'telefono registrante':'telefonoRegistrante',
    'destinatario notificacion':'destinatarioNotificacion',
    'caminante id':'caminanteId',
    'retiro id':'retiroId',
    'valor reportado':'valorReportado',
    'valor aprobado':'valorAprobado',
    'fecha pago':'fechaPago',
    'medio pago':'medioPago',
    'entidad pago':'entidadPago',
    'referencia pago':'referenciaPago',
    'nombre pagador':'nombrePagador',
    'telefono pagador':'telefonoPagador',
    'comprobante url':'comprobanteUrl',
    'comprobante id':'comprobanteId',
    'comprobante nombre':'comprobanteNombre',
    'comprobante tipo':'comprobanteTipo',
    'comprobante tamano':'comprobanteTamano',
    'estado pago reportado':'estadoPagoReportado',
    'observaciones reportante':'observacionesReportante',
    'observaciones tesoreria':'observacionesTesoreria',
    'validado por':'validadoPor',
    'fecha validacion':'fechaValidacion',
    'motivo modificacion valor':'motivoModificacionValor',
    'supera saldo':'superaSaldo',
    'excedente':'excedente',

    'orden':'orden',
    'dia':'dia',
    'hora inicio':'horaInicio',
    'duracion minutos':'duracionMinutos',
    'actividad':'actividad',
    'responsable':'responsable',
    'lugar':'lugar',
    'estado':'estado',
    'prioridad':'prioridad',
    'nombre':'nombre',
    'telefono':'telefono',
    'estado de pago':'estadoPago',
    'exento de pago': 'exentoPago',
    'motivo exencion pago': 'motivoExencionPago',
    'motivo exención pago': 'motivoExencionPago',
    'rol mesa':'rolMesa',
    'rol de mesa':'rolMesa',
    'rol equipo':'rolEquipo',
    'rol de equipo':'rolEquipo',
    'tema id':'temaId',
    'servidor id':'servidorId',
    'servidor nombre':'servidorNombre',
    'requiere presentación':'requierePresentacion',
    'requiere presentacion':'requierePresentacion',
    'requiere testimonio':'requiereTestimonio',
    'equipo':'equipo',
    'rol':'rol',
    'tema':'tema',
    'mesa':'mesa',
    'habitacion':'habitacion',
    'contacto':'contacto',
    'telefono contacto':'telefonoContacto',
    'contacto 1 nombre':'contacto1Nombre',
    'contacto 1 parentesco':'contacto1Parentesco',
    'contacto 1 celular':'contacto1Celular',
    'contacto 2 nombre':'contacto2Nombre',
    'contacto 2 parentesco':'contacto2Parentesco',
    'contacto 2 celular':'contacto2Celular',
    'carta':'carta',
    'foto':'foto',
    'carta aprobada logistica por':'cartaAprobadaLogisticaPor',
    'carta aprobada logística por':'cartaAprobadaLogisticaPor',
    'carta fecha aprobacion logistica':'cartaFechaAprobacionLogistica',
    'carta fecha aprobación logística':'cartaFechaAprobacionLogistica',
    'foto aprobada logistica por':'fotoAprobadaLogisticaPor',
    'foto aprobada logística por':'fotoAprobadaLogisticaPor',
    'foto fecha aprobacion logistica':'fotoFechaAprobacionLogistica',
    'foto fecha aprobación logística':'fotoFechaAprobacionLogistica',
    'entrega':'entrega',
    'apoyo audiovisual':'apoyoAudiovisual',
    'ajustado por audiovisuales':'ajustadoAudiovisuales',
    'aprobado por conferencista':'aprobadoConferencista',
    'observaciones':'observaciones',
    'clave':'clave',
    'valor':'valor',
    'tipo':'tipo',
    'descripcion':'descripcion',
    'activo':'activo',
    'capacidad':'capacidad',
    'piso': 'piso',
    'celular':'celular',
    'usuario': 'usuario',
    'salt': 'salt',
    'clavehash': 'claveHash',
    'clave hash': 'claveHash',
    'iteraciones': 'iteraciones',
    'permisos': 'permisos',
    'accion': 'accion',
    'entidad': 'entidad',
    'id registro': 'idRegistro',
    'detalle': 'detalle',
    'fecha': 'fecha',
    'permiso': 'permiso',
    'fecha actualizacion': 'fechaActualizacion',
    'fecha de actualizacion': 'fechaActualizacion',
    'actualizado por': 'actualizadoPor',
    'fecha registro': 'fechaRegistro',
    'fecha de registro': 'fechaRegistro',

    // Hoja AutorizacionesCaminantes. Los encabezados se normalizan
    // completamente a minúsculas antes de consultar este mapa.
    'caminanteid': 'caminanteId',
    'caminante id': 'caminanteId',
    'aspiranteid': 'aspiranteId',
    'aspirante id': 'aspiranteId',
    'tokenhash': 'tokenHash',
    'token hash': 'tokenHash',
    'fechageneracion': 'fechaGeneracion',
    'fecha generacion': 'fechaGeneracion',
    'fecha generación': 'fechaGeneracion',
    'fechaexpiracion': 'fechaExpiracion',
    'fecha expiracion': 'fechaExpiracion',
    'fecha expiración': 'fechaExpiracion',
    'generadopor': 'generadoPor',
    'generado por': 'generadoPor',
    'fechaenvio': 'fechaEnvio',
    'fecha envio': 'fechaEnvio',
    'fecha envío': 'fechaEnvio',
    'fecharespuesta': 'fechaRespuesta',
    'fecha respuesta': 'fechaRespuesta'
  };

  if(mapa[limpio]){

    return mapa[limpio];

  }

  return limpio
      .split(' ')
      .map(function(palabra,i){

        if(i==0){

          return palabra;

        }

        return palabra.charAt(0).toUpperCase()+
               palabra.slice(1);

      })
      .join('');

}


/**
 * Convierte texto
 * a minúsculas
 * sin tildes.
 */
function normalizarTexto(valor){

  return String(
      valor || ''
    )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');

}


/**
 * Convierte a número.
 */
function convertirNumero(
  valor,
  defecto
){

  const numero =
    Number(valor);

  if(isNaN(numero)){

    return defecto;

  }

  return numero;

}


/**
 * Convierte SI/NO
 * TRUE/FALSE
 * ACTIVO
 */
function convertirBooleano(valor){

  return [

    'si',

    'true',

    '1',

    'activo'

  ].includes(
      normalizarTexto(valor)
  );

}
