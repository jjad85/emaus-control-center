/**
 * ============================================================
 * ASPIRANTES WRITE SERVICE
 * ============================================================
 */

function registrarAspirantePublico(
  datos
) {
  const portal =
    obtenerPortalPublico();

  if (!portal.registroActivo) {
    throw crearErrorAplicacion(
      'REGISTRO_CERRADO',
      portal.mensajeRegistroCerrado ||
        'Las inscripciones se encuentran cerradas.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      const registro =
        prepararAspirante(
          datos
        );

      validarAspirante(
        registro
      );

      validarDuplicadoAspirante(
        registro
      );

      completarEvidenciaConsentimientos(
        registro
      );

      const creado =
        crearRegistroSheet(
          HOJAS.ASPIRANTES,
          registro,
          opcionesCrudAspirante(
            'PORTAL_PUBLICO'
          )
        );

      const numero =
        generarNumeroInscripcion(
          creado.id
        );

      const actualizado =
        actualizarCampoSheet(
          HOJAS.ASPIRANTES,
          creado.id,
          'numeroInscripcion',
          numero,
          opcionesCrudAspirante(
            'PORTAL_PUBLICO'
          )
        );

      registrarAuditoria({
        usuario:
          'PORTAL_PUBLICO',
        nombre:
          actualizado.nombreCompleto,
        accion:
          'REGISTRAR_ASPIRANTE',
        entidad:
          'Aspirantes',
        idRegistro:
          actualizado.id,
        detalle:
          'Registro público de aspirante'
      });

      return {
        id:
          actualizado.id,
        numeroInscripcion:
          actualizado.numeroInscripcion,
        estadoSolicitud:
          actualizado.estadoSolicitud
      };
    }
  );
}

function actualizarEstadoAspirante(
  token,
  id,
  estado,
  observacionesGestion
) {
  const sesion =
    validarPermiso(
      token,
      'ACTUALIZAR_ESTADO_ASPIRANTE'
    );

  const estadoValido =
    ESTADOS_ASPIRANTE.find(
      function(item) {
        return (
          normalizarTexto(item) ===
          normalizarTexto(estado)
        );
      }
    );

  if (!estadoValido) {
    throw crearErrorAplicacion(
      'ESTADO_ASPIRANTE_INVALIDO',
      'El estado seleccionado no es válido.'
    );
  }

  if (
    normalizarTexto(
      estadoValido
    ) === 'convertido'
  ) {
    throw crearErrorAplicacion(
      'ESTADO_CONVERTIDO_NO_MANUAL',
      'El estado Convertido se asigna automáticamente al aprobar al aspirante.'
    );
  }

  /*
   * Aprobar al aspirante ejecuta una sola transacción:
   * crea el caminante y bloquea definitivamente
   * la gestión del aspirante.
   */
  if (
    normalizarTexto(
      estadoValido
    ) === 'aprobado'
  ) {
    validarPermiso(
      token,
      'CONVERTIR_ASPIRANTE'
    );

    return ejecutarCrudConBloqueo(
      function() {
        return convertirAspiranteEnCaminanteInterno(
          sesion,
          id,
          observacionesGestion
        );
      }
    );
  }

  const actualizado =
    ejecutarCrudConBloqueo(
      function() {
        const aspirante =
          obtenerAspirantePorId(
            id
          );

        validarAspiranteEditable(
          aspirante
        );

        return actualizarRegistroSheet(
          HOJAS.ASPIRANTES,
          id,
          {
            estadoSolicitud:
              estadoValido,
            observacionesGestion:
              String(
                observacionesGestion ||
                ''
              ).trim()
          },
          opcionesCrudAspirante(
            sesion.usuario
          )
        );
      }
    );

  registrarAuditoria({
    usuario:
      sesion.usuario,
    nombre:
      sesion.nombre,
    accion:
      'ACTUALIZAR_ESTADO_ASPIRANTE',
    entidad:
      'Aspirantes',
    idRegistro:
      id,
    detalle:
      JSON.stringify({
        estado:
          estadoValido,
        observacionesGestion:
          observacionesGestion || ''
      })
  });

  return actualizado;
}

/**
 * Conversión manual conservada por compatibilidad.
 * Normalmente la conversión se ejecuta automáticamente
 * al seleccionar el estado Aprobado.
 */
function convertirAspiranteEnCaminante(
  token,
  id
) {
  const sesion =
    validarPermiso(
      token,
      'CONVERTIR_ASPIRANTE'
    );

  return ejecutarCrudConBloqueo(
    function() {
      return convertirAspiranteEnCaminanteInterno(
        sesion,
        id,
        ''
      );
    }
  );
}

/**
 * Ejecuta la conversión dentro de un bloqueo ya adquirido.
 * No solicita permisos adicionales ni genera otro bloqueo.
 */
function convertirAspiranteEnCaminanteInterno(
  sesion,
  id,
  observacionesGestion
) {
  const aspirante =
    obtenerAspirantePorId(
      id
    );

  validarAspiranteEditable(
    aspirante
  );

  const datosCaminante = {
    nombre:
      aspirante.nombreCompleto,

    telefono:
      aspirante.celular,

    tallaCamiseta:
      aspirante.tallaCamisa ||
      '',

    estadoPago:
      'Pendiente',

    mesa:
      '',

    habitacion:
      '',

    contacto:
      aspirante.contacto1Nombre,

    telefonoContacto:
      aspirante.contacto1Celular,

    carta:
      'Pendiente',

    foto:
      'Pendiente'
  };

  /*
   * La creación se hace con la sesión ya validada.
   * Esto evita exigir REGISTRAR_CAMINANTE y evita
   * un segundo bloqueo dentro de la misma operación.
   */
  const caminante =
    registrarCaminanteInterno(
      sesion,
      datosCaminante
    );

  const actualizado =
    actualizarRegistroSheet(
      HOJAS.ASPIRANTES,
      id,
      {
        estadoSolicitud:
          'Convertido',

        observacionesGestion:
          String(
            observacionesGestion ||
            aspirante.observacionesGestion ||
            ''
          ).trim(),

        caminanteId:
          caminante.id
      },
      opcionesCrudAspirante(
        sesion.usuario
      )
    );

  registrarAuditoria({
    usuario:
      sesion.usuario,
    nombre:
      sesion.nombre,
    accion:
      'APROBAR_Y_CONVERTIR_ASPIRANTE',
    entidad:
      'Aspirantes',
    idRegistro:
      id,
    detalle:
      JSON.stringify({
        estadoAnterior:
          aspirante.estadoSolicitud ||
          '',
        estadoNuevo:
          'Convertido',
        caminanteId:
          caminante.id
      })
  });

  const caminantes =
    obtenerCaminantes({});

  const indicadores =
    obtenerIndicadoresCaminantes(
      caminantes
    );

  return {
    aspirante:
      actualizado,
    caminante:
      caminante,
    indicadores:
      indicadores
  };
}

/**
 * Un aspirante convertido queda bloqueado.
 */
function validarAspiranteEditable(
  aspirante
) {
  const convertido =
    normalizarTexto(
      aspirante.estadoSolicitud
    ) === 'convertido' ||
    Boolean(
      String(
        aspirante.caminanteId ||
        ''
      ).trim()
    );

  if (convertido) {
    throw crearErrorAplicacion(
      'ASPIRANTE_NO_EDITABLE',
      'El aspirante ya fue aprobado y convertido en caminante. No puede modificarse.'
    );
  }
}

function prepararAspirante(
  datos
) {
  const entrada =
    datos || {};

  return {
    numeroInscripcion: '',
    nombreCompleto:
      limpiarTextoAspirante(
        entrada.nombreCompleto
      ),
    documentoIdentidad:
      limpiarTextoAspirante(
        entrada.documentoIdentidad
      ),
    direccionResidencia:
      limpiarTextoAspirante(
        entrada.direccionResidencia
      ),
    fechaNacimiento:
      limpiarTextoAspirante(
        entrada.fechaNacimiento
      ),
    edad:
      calcularEdadAspirante(
        entrada.fechaNacimiento
      ),
    barrio:
      limpiarTextoAspirante(
        entrada.barrio
      ),
    telefono:
      limpiarTextoAspirante(
        entrada.telefono
      ),
    celular:
      limpiarTextoAspirante(
        entrada.celular
      ),
    estadoCivil:
      limpiarTextoAspirante(
        entrada.estadoCivil
      ),
    parroquia:
      limpiarTextoAspirante(
        entrada.parroquia
      ),

    sufreEnfermedad:
      limpiarTextoAspirante(
        entrada.sufreEnfermedad
      ),
    enfermedadCual:
      limpiarTextoAspirante(
        entrada.enfermedadCual
      ),
    tomaMedicamento:
      limpiarTextoAspirante(
        entrada.tomaMedicamento
      ),
    medicamentoCual:
      limpiarTextoAspirante(
        entrada.medicamentoCual
      ),
    horariosMedicamentos:
      limpiarTextoAspirante(
        entrada.horariosMedicamentos
      ),
    eps:
      limpiarTextoAspirante(
        entrada.eps
      ),
    profesionOcupacion:
      limpiarTextoAspirante(
        entrada.profesionOcupacion
      ),
    tieneLimitacionFisica:
      limpiarTextoAspirante(
        entrada.tieneLimitacionFisica
      ),
    limitacionCual:
      limpiarTextoAspirante(
        entrada.limitacionCual
      ),

    sacramentosRecibidos:
      Array.isArray(
        entrada.sacramentosRecibidos
      )
        ? entrada.sacramentosRecibidos
            .join(', ')
        : limpiarTextoAspirante(
            entrada.sacramentosRecibidos
          ),
    tallaCamisa:
      limpiarTextoAspirante(
        entrada.tallaCamisa
      ),

    contacto1Nombre:
      limpiarTextoAspirante(
        entrada.contacto1Nombre
      ),
    contacto1Parentesco:
      limpiarTextoAspirante(
        entrada.contacto1Parentesco
      ),
    contacto1Celular:
      limpiarTextoAspirante(
        entrada.contacto1Celular
      ),
    contacto2Nombre:
      limpiarTextoAspirante(
        entrada.contacto2Nombre
      ),
    contacto2Parentesco:
      limpiarTextoAspirante(
        entrada.contacto2Parentesco
      ),
    contacto2Celular:
      limpiarTextoAspirante(
        entrada.contacto2Celular
      ),

    comoSeEntero:
      limpiarTextoAspirante(
        entrada.comoSeEntero
      ),
    nombrePersonaInvito:
      limpiarTextoAspirante(
        entrada.nombrePersonaInvito
      ),
    celularPersonaInvito:
      limpiarTextoAspirante(
        entrada.celularPersonaInvito
      ),
    personaConocidaAsistira:
      limpiarTextoAspirante(
        entrada.personaConocidaAsistira
      ),
    nombrePersonaConocida:
      limpiarTextoAspirante(
        entrada.nombrePersonaConocida
      ),
    autorizaTratamientoDatos:
      limpiarTextoAspirante(
        entrada.autorizaTratamientoDatos
      ),
    versionAutorizacionDatos: '',
    fechaAceptacionDatos: '',
    textoAutorizacionDatos: '',

    autorizaFotografias:
      limpiarTextoAspirante(
        entrada.autorizaFotografias
      ) || 'No',
    versionAutorizacionFotografias: '',
    fechaAceptacionFotografias: '',
    textoAutorizacionFotografias: '',

    estadoSolicitud:
      'Pendiente',
    observacionesGestion: '',
    caminanteId: ''
  };
}

function calcularEdadAspirante(
  fechaNacimiento
) {
  const texto =
    limpiarTextoAspirante(
      fechaNacimiento
    );

  if (!texto) {
    return 0;
  }

  const partes =
    texto.split('-');

  if (partes.length !== 3) {
    return 0;
  }

  const nacimiento =
    new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );

  if (
    isNaN(
      nacimiento.getTime()
    )
  ) {
    return 0;
  }

  const hoy =
    new Date();

  let edad =
    hoy.getFullYear() -
    nacimiento.getFullYear();

  const diferenciaMes =
    hoy.getMonth() -
    nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (
      diferenciaMes === 0 &&
      hoy.getDate() <
        nacimiento.getDate()
    )
  ) {
    edad -= 1;
  }

  return (
    edad >= 0 &&
    edad <= 120
  )
    ? edad
    : 0;
}

function normalizarCelularAspirante(
  valor
) {
  return String(
    valor || ''
  ).replace(
    /\D/g,
    ''
  );
}

function validarFormatoCelularAspirante(
  valor,
  etiqueta,
  obligatorio
) {
  const celular =
    normalizarCelularAspirante(
      valor
    );

  if (
    !celular &&
    !obligatorio
  ) {
    return;
  }

  if (
    !/^3\d{9}$/.test(
      celular
    )
  ) {
    throw crearErrorAplicacion(
      'CELULAR_ASPIRANTE_INVALIDO',
      etiqueta +
        ' debe tener 10 dígitos y comenzar por 3.'
    );
  }
}

function validarAspirante(
  registro
) {
  const requeridos = [
    [
      registro.nombreCompleto,
      'Nombre completo'
    ],
    [
      registro.documentoIdentidad,
      'Documento de identidad'
    ],
    [
      registro.direccionResidencia,
      'Dirección de residencia'
    ],
    [
      registro.fechaNacimiento,
      'Fecha de nacimiento'
    ],
    [
      registro.edad,
      'Edad'
    ],
    [
      registro.barrio,
      'Barrio'
    ],
    [
      registro.celular,
      'Celular'
    ],
    [
      registro.estadoCivil,
      'Estado civil'
    ],
    [
      registro.sufreEnfermedad,
      'Enfermedad'
    ],
    [
      registro.tomaMedicamento,
      'Medicamentos'
    ],
    [
      registro.eps,
      'EPS'
    ],
    [
      registro.profesionOcupacion,
      'Profesión u ocupación'
    ],
    [
      registro.tieneLimitacionFisica,
      'Limitación física'
    ],
    [
      registro.sacramentosRecibidos,
      'Sacramentos'
    ],
    [
      registro.tallaCamisa,
      'Talla de camisa'
    ],
    [
      registro.contacto1Nombre,
      'Contacto de emergencia 1'
    ],
    [
      registro.contacto1Celular,
      'Celular del contacto 1'
    ],
    [
      registro.contacto2Nombre,
      'Contacto de emergencia 2'
    ],
    [
      registro.contacto2Parentesco,
      'Parentesco del contacto 2'
    ],
    [
      registro.contacto2Celular,
      'Celular del contacto 2'
    ],
    [
      registro.comoSeEntero,
      'Cómo se enteró'
    ],
    [
      registro.personaConocidaAsistira,
      'Persona conocida'
    ]
  ];

  const faltante =
    requeridos.find(
      function(item) {
        return !item[0];
      }
    );

  if (faltante) {
    throw crearErrorAplicacion(
      'CAMPO_ASPIRANTE_REQUERIDO',
      'Debe diligenciar: ' +
        faltante[1] +
        '.'
    );
  }

  validarFormatoCelularAspirante(
    registro.celular,
    'El celular del aspirante',
    true
  );

  validarFormatoCelularAspirante(
    registro.contacto1Celular,
    'El celular del contacto 1',
    true
  );

  validarFormatoCelularAspirante(
    registro.contacto2Celular,
    'El celular del contacto 2',
    true
  );

  validarFormatoCelularAspirante(
    registro.celularPersonaInvito,
    'El celular de quien lo invitó',
    false
  );

  if (
    normalizarTexto(
      registro.autorizaTratamientoDatos
    ) !== 'si'
  ) {
    throw crearErrorAplicacion(
      'AUTORIZACION_REQUERIDA',
      'Debe leer y aceptar la autorización para el tratamiento de datos personales. Sin esta aceptación no es posible registrar al aspirante.'
    );
  }

  if (
    normalizarTexto(
      registro.sufreEnfermedad
    ) === 'si' &&
    !registro.enfermedadCual
  ) {
    throw crearErrorAplicacion(
      'ENFERMEDAD_DETALLE_REQUERIDO',
      'Debe indicar cuál enfermedad presenta.'
    );
  }

  if (
    normalizarTexto(
      registro.tomaMedicamento
    ) === 'si' &&
    !registro.medicamentoCual
  ) {
    throw crearErrorAplicacion(
      'MEDICAMENTO_DETALLE_REQUERIDO',
      'Debe indicar cuál medicamento toma.'
    );
  }
}

/**
 * Conserva evidencia consultable de las autorizaciones aceptadas.
 *
 * La fecha se genera en el servidor y no se toma del navegador.
 * También se almacena una copia del texto vigente, no solamente
 * su versión, para que una modificación futura de Configuraciones
 * no borre la evidencia histórica.
 */
function completarEvidenciaConsentimientos(
  registro
) {
  const configuracion =
    obtenerConfiguraciones();

  registro.versionAutorizacionDatos =
    limpiarTextoAspirante(
      configuracion.portalAutorizacionDatosVersion ||
      '1.0'
    );

  registro.fechaAceptacionDatos =
    new Date();

  registro.textoAutorizacionDatos =
    limpiarTextoAspirante(
      configuracion.portalAutorizacionDatosTextoHtml ||
      ''
    );

  const autorizaFotos =
    normalizarTexto(
      registro.autorizaFotografias
    ) === 'si';

  registro.autorizaFotografias =
    autorizaFotos
      ? 'Sí'
      : 'No';

  registro.versionAutorizacionFotografias =
    limpiarTextoAspirante(
      configuracion.portalAutorizacionFotosVersion ||
      '1.0'
    );

  registro.fechaAceptacionFotografias =
    autorizaFotos
      ? new Date()
      : '';

  registro.textoAutorizacionFotografias =
    limpiarTextoAspirante(
      configuracion.portalAutorizacionFotosTextoHtml ||
      ''
    );
}

function validarDuplicadoAspirante(
  registro
) {
  const existentes =
    leerHojaComoObjetos(
      HOJAS.ASPIRANTES
    );

  const documento =
    normalizarTexto(
      registro.documentoIdentidad
    );

  const duplicado =
    existentes.find(
      function(item) {
        return (
          normalizarTexto(
            item.documentoIdentidad
          ) === documento
        );
      }
    );

  if (duplicado) {
    throw crearErrorAplicacion(
      'ASPIRANTE_DOCUMENTO_DUPLICADO',
      'Un usuario con ese número de documento ya está registrado.'
    );
  }
}

function generarNumeroInscripcion(
  id
) {
  const configuracion =
    obtenerConfiguraciones();

  const prefijo =
    String(
      configuracion.portalPrefijoInscripcion ||
      'H'
    )
      .trim()
      .toUpperCase();

  const anio =
    configuracion.anioRetiro ||
    new Date().getFullYear();

  return (
    prefijo +
    anio +
    '-' +
    String(id)
      .padStart(5, '0')
  );
}

function opcionesCrudAspirante(
  usuario
) {
  return {
    campoId: 'id',
    campoActivo: 'activo',
    campoFechaRegistro:
      'fechaRegistro',
    campoFechaActualizacion:
      'fechaActualizacion',
    campoActualizadoPor:
      'actualizadoPor',
    valorActivo: 'Sí',
    valorInactivo: 'No',
    usuario:
      usuario || ''
  };
}

function limpiarTextoAspirante(
  valor
) {
  return String(
    valor || ''
  ).trim();
}
