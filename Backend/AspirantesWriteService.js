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

  const actualizado =
    ejecutarCrudConBloqueo(
      function() {
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
      const aspirante =
        obtenerAspirantePorId(
          id
        );

      if (
        normalizarTexto(
          aspirante.estadoSolicitud
        ) !==
        'aprobado'
      ) {
        throw crearErrorAplicacion(
          'ASPIRANTE_NO_APROBADO',
          'Solo se pueden convertir aspirantes aprobados.'
        );
      }

      if (
        aspirante.caminanteId
      ) {
        throw crearErrorAplicacion(
          'ASPIRANTE_YA_CONVERTIDO',
          'Este aspirante ya fue convertido en caminante.'
        );
      }

      const caminante =
        registrarCaminante(
          token,
          {
            nombre:
              aspirante.nombreCompleto,
            telefono:
              aspirante.celular ||
              aspirante.telefono,
            estadoPago:
              'Pendiente',
            mesa: '',
            habitacion: '',
            contacto:
              aspirante.contacto1Nombre,
            telefonoContacto:
              aspirante.contacto1Celular,
            carta:
              'Pendiente',
            foto:
              'Pendiente'
          }
        );

      const actualizado =
        actualizarRegistroSheet(
          HOJAS.ASPIRANTES,
          id,
          {
            estadoSolicitud:
              'Convertido',
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
          'CONVERTIR_ASPIRANTE',
        entidad:
          'Aspirantes',
        idRegistro:
          id,
        detalle:
          'Convertido en caminante ID ' +
          caminante.id
      });

      return {
        aspirante:
          actualizado,
        caminante:
          caminante
      };
    }
  );
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
      convertirNumero(
        entrada.edad,
        0
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

    estadoSolicitud:
      'Pendiente',
    observacionesGestion: '',
    caminanteId: ''
  };
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

  if (
    normalizarTexto(
      registro.autorizaTratamientoDatos
    ) !== 'si'
  ) {
    throw crearErrorAplicacion(
      'AUTORIZACION_REQUERIDA',
      'Debe autorizar el tratamiento de datos para continuar.'
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

function validarDuplicadoAspirante(
  registro
) {
  const existentes =
    leerHojaComoObjetos(
      HOJAS.ASPIRANTES
    );

  const duplicado =
    existentes.find(
      function(item) {
        return (
          normalizarTexto(
            item.documentoIdentidad
          ) ===
            normalizarTexto(
              registro.documentoIdentidad
            ) ||
          normalizarTexto(
            item.celular
          ) ===
            normalizarTexto(
              registro.celular
            )
        );
      }
    );

  if (duplicado) {
    throw crearErrorAplicacion(
      'ASPIRANTE_DUPLICADO',
      'Ya existe una inscripción con el mismo documento o celular.'
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
