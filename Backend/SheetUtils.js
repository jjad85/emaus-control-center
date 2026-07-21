/**
 * ============================================================
 * SHEET UTILS
 * ============================================================
 * Funciones comunes para acceder a Google Sheets.
 */

/**
 * ID del Google Sheets.
 */
const SPREADSHEET_ID =
  '1ovrRzHHL_zcNaOnI9m3j7rQwOmqzVnDaHoQ_KvffDq4';


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
  PAGOS: 'Pagos'
};


/**
 * Abre el libro.
 */
function obtenerLibro() {

  return SpreadsheetApp.openById(
    SPREADSHEET_ID
  );

}


/**
 * Obtiene una hoja.
 */
function obtenerHoja(nombreHoja){

  const hoja =
    obtenerLibro()
      .getSheetByName(nombreHoja);

  if(!hoja){

    throw crearErrorAplicacion(
      'HOJA_NO_EXISTE',
      'No existe la hoja "' +
      nombreHoja +
      '".'
    );

  }

  return hoja;

}


/**
 * Lee una hoja completa y devuelve
 * un arreglo de objetos.
 */
function leerHojaComoObjetos(nombreHoja){

  const hoja =
    obtenerHoja(nombreHoja);

  const datos =
    hoja.getDataRange()
        .getDisplayValues();

  if(datos.length<=1){

    return [];

  }

  const encabezados =
    datos[0]
      .map(convertirEncabezado);

  return datos
    .slice(1)
    .filter(function(fila){

      return fila.some(function(valor){

        return String(valor).trim()!='';

      });

    })
    .map(function(fila){

      const objeto={};

      encabezados.forEach(function(campo,i){

        objeto[campo]=
          fila[i] || '';

      });

      return objeto;

    });

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
    'carta':'carta',
    'foto':'foto',
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
    'fecha de registro': 'fechaRegistro'
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
