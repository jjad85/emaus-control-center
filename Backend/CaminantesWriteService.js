/**
 * ============================================================
 * CAMINANTES WRITE SERVICE
 * ============================================================
 *
 * Gestión de escritura de Caminantes usando CrudSheets.gs.
 */

const ESTADOS_PAGO_CAMINANTE = [
  'Pendiente',
  'Pago Parcial',
  'Pago Total'
];

const ESTADOS_ENTREGABLE_CAMINANTE = [
  'Pendiente',
  'Solicitada',
  'Entregada',
  'Empaquetada',
  'Entregada a Logística'
];

/**
 * Opciones disponibles para formularios.
 */
function obtenerOpcionesRegistroCaminante(
  token
) {
  const sesion =
    obtenerSesion(token);

  const permisos =
    obtenerPermisosPorRol(
      sesion.rol
    );

  const puedeConsultar =
    [
      'CAMINANTES_REGISTRAR',
      'CAMINANTES_EDITAR',
      'CAMINANTES_ASIGNAR_MESA',
      'CAMINANTES_ASIGNAR_HABITACION'
    ].some(
      function(permiso) {
        return permisos.includes(
          permiso
        );
      }
    );

  if (!puedeConsultar) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permisos para consultar estas opciones.'
    );
  }

  return {
    estadosPago:
      ESTADOS_PAGO_CAMINANTE,

    estadosEntregables:
      ESTADOS_ENTREGABLE_CAMINANTE,

    mesasDisponibles:
      obtenerMesasDisponiblesCaminante(),

    habitacionesDisponibles:
      obtenerHabitacionesDisponiblesCaminante()
  };
}

/**
 * Registra un caminante.
 */
function registrarCaminante(
  token,
  datos
) {
  const sesion =
    validarPermiso(
      token,
      'CAMINANTES_REGISTRAR'
    );

  return ejecutarCrudConBloqueo(
    function() {
      return registrarCaminanteInterno(
        sesion,
        datos
      );
    }
  );
}

/**
 * Registra un caminante usando una sesión previamente
 * validada y un bloqueo ya adquirido.
 *
 * Se utiliza en la aprobación automática de aspirantes.
 */
function registrarCaminanteInterno(
  sesion,
  datos
) {
  if (
    !sesion ||
    !sesion.usuario
  ) {
    throw crearErrorAplicacion(
      'SESION_INTERNA_REQUERIDA',
      'No fue posible identificar al usuario que registra el caminante.'
    );
  }

  const registro =
    prepararDatosCaminante(
      datos || {}
    );

  validarDatosCaminante(
    registro
  );

  validarDuplicadoCaminanteCrud(
    registro,
    null
  );

  validarMesaCaminanteCrud(
    registro.mesa,
    null
  );

  validarHabitacionCaminanteCrud(
    registro.habitacion,
    null
  );

  const momento =
    new Date();

  registro.activo =
    'Sí';

  registro.fechaRegistro =
    momento;

  registro.fechaActualizacion =
    momento;

  registro.actualizadoPor =
    sesion.usuario;

  const creado =
    crearRegistroSheet(
      HOJAS.CAMINANTES,
      registro,
      opcionesCrudCaminante(
        sesion.usuario
      )
    );

  auditarCaminanteCrud(
    sesion,
    'CAMINANTES_REGISTRAR',
    creado.id,
    creado
  );

  return convertirRegistroCaminanteRespuesta(
    creado
  );
}

/**
 * Edita datos generales.
 *
 * Requiere CAMINANTES_EDITAR.
 */
function editarCaminante(
  token,
  id,
  datos
) {
  const sesion =
    validarPermiso(
      token,
      'CAMINANTES_EDITAR'
    );

  return ejecutarCrudConBloqueo(
    function() {
      const actual =
        leerRegistroPorIdSheet(
          HOJAS.CAMINANTES,
          id,
          opcionesCrudCaminante(
            sesion.usuario
          )
        );

      const entrada =
        prepararDatosCaminante(
          datos || {}
        );

      validarDatosCaminante(
        entrada
      );

      validarDuplicadoCaminanteCrud(
        entrada,
        id
      );

      validarMesaCaminanteCrud(
        entrada.mesa,
        id
      );

      validarHabitacionCaminanteCrud(
        entrada.habitacion,
        id
      );

      const actualizado =
        actualizarRegistroSheet(
          HOJAS.CAMINANTES,
          id,
          entrada,
          opcionesCrudCaminante(
            sesion.usuario
          )
        );

      auditarCaminanteCrud(
        sesion,
        'CAMINANTES_EDITAR',
        id,
        {
          anterior: actual,
          nuevo: actualizado
        }
      );

      return convertirRegistroCaminanteRespuesta(
        actualizado
      );
    }
  );
}

/**
 * Actualiza pago.
 */
function actualizarPagoCaminante(
  token,
  id,
  estadoPago
) {
  const sesion =
    validarPermiso(
      token,
      'ACTUALIZAR_PAGO'
    );

  const valor =
    estandarizarOpcionCaminante(
      estadoPago,
      ESTADOS_PAGO_CAMINANTE
    );

  if (!valor) {
    throw crearErrorAplicacion(
      'ESTADO_PAGO_INVALIDO',
      'El estado de pago no es válido.'
    );
  }

  return actualizarCampoCaminanteConAuditoria(
    sesion,
    id,
    'estadoPago',
    valor,
    'ACTUALIZAR_PAGO'
  );
}

/**
 * Asigna mesa.
 */
function asignarMesaCaminante(
  token,
  id,
  mesa
) {
  const sesion =
    validarPermiso(
      token,
      'CAMINANTES_ASIGNAR_MESA'
    );

  const valor =
    limpiarValorOpcionalCaminante(
      mesa
    );

  return ejecutarCrudConBloqueo(
    function() {
      validarMesaCaminanteCrud(
        valor,
        id
      );

      return actualizarCampoCaminanteConAuditoriaInterno(
        sesion,
        id,
        'mesa',
        valor,
        'CAMINANTES_ASIGNAR_MESA'
      );
    }
  );
}

/**
 * Asigna habitación.
 */
function asignarHabitacionCaminante(
  token,
  id,
  habitacion
) {
  const sesion =
    validarPermiso(
      token,
      'CAMINANTES_ASIGNAR_HABITACION'
    );

  const valor =
    limpiarValorOpcionalCaminante(
      habitacion
    );

  return ejecutarCrudConBloqueo(
    function() {
      validarHabitacionCaminanteCrud(
        valor,
        id
      );

      return actualizarCampoCaminanteConAuditoriaInterno(
        sesion,
        id,
        'habitacion',
        valor,
        'CAMINANTES_ASIGNAR_HABITACION'
      );
    }
  );
}

/**
 * Actualiza carta.
 */
function actualizarCartaCaminante(
  token,
  id,
  carta
) {
  const sesion =
    validarPermiso(
      token,
      'CAMINANTES_REPORTAR_CARTA'
    );

  const valor =
    estandarizarOpcionCaminante(
      carta,
      ESTADOS_ENTREGABLE_CAMINANTE
    );

  if (!valor) {
    throw crearErrorAplicacion(
      'ESTADO_CARTA_INVALIDO',
      'El estado de la carta no es válido.'
    );
  }

  return actualizarEntregableCaminanteConAprobacion_(
    token,
    sesion,
    id,
    'carta',
    valor,
    'CAMINANTES_REPORTAR_CARTA'
  );
}

/**
 * Actualiza foto.
 */
function actualizarFotoCaminante(
  token,
  id,
  foto
) {
  const sesion =
    validarPermiso(
      token,
      'CAMINANTES_REPORTAR_FOTO'
    );

  const valor =
    estandarizarOpcionCaminante(
      foto,
      ESTADOS_ENTREGABLE_CAMINANTE
    );

  if (!valor) {
    throw crearErrorAplicacion(
      'ESTADO_FOTO_INVALIDO',
      'El estado de la foto no es válido.'
    );
  }

  return actualizarEntregableCaminanteConAprobacion_(
    token,
    sesion,
    id,
    'foto',
    valor,
    'CAMINANTES_REPORTAR_FOTO'
  );
}


/**
 * Actualiza carta o fotografía. El estado final constituye la aprobación
 * formal de Logística y requiere el permiso correspondiente.
 */
function actualizarEntregableCaminanteConAprobacion_(
  token,
  sesion,
  id,
  campo,
  valor,
  accion
) {
  return ejecutarCrudConBloqueo(function() {
    const esEntregaLogistica =
      normalizarTexto(valor) === normalizarTexto('Entregada a Logística');

    const campoAprobadoPor = campo === 'carta'
      ? 'cartaAprobadaLogisticaPor'
      : 'fotoAprobadaLogisticaPor';
    const campoFechaAprobacion = campo === 'carta'
      ? 'cartaFechaAprobacionLogistica'
      : 'fotoFechaAprobacionLogistica';

    const anterior = leerRegistroPorIdSheet(
      HOJAS.CAMINANTES,
      id,
      opcionesCrudCaminante(sesion.usuario)
    );

    const cambios = {};
    cambios[campo] = valor;
    // Marcar "Entregada a Logística" crea una solicitud pendiente.
    // La aprobación se realiza después desde la bandeja de Logística.
    cambios[campoAprobadoPor] = '';
    cambios[campoFechaAprobacion] = '';

    const actualizado = actualizarRegistroSheet(
      HOJAS.CAMINANTES,
      id,
      cambios,
      opcionesCrudCaminante(sesion.usuario)
    );

    auditarCaminanteCrud(
      sesion,
      esEntregaLogistica
        ? 'SOLICITAR_APROBACION_LOGISTICA_' + campo.toUpperCase()
        : accion,
      id,
      {
        campo: campo,
        anterior: anterior[campo],
        nuevo: actualizado[campo],
        aprobacionPendiente: esEntregaLogistica
      }
    );

    return convertirRegistroCaminanteRespuesta(actualizado);
  });
}


/**
 * Cancela la participación de un caminante sin eliminar su historial.
 */
function desactivarCaminante(
  token,
  id,
  motivoCancelacion
) {
  const sesion =
    validarPermiso(
      token,
      'DESACTIVAR_CAMINANTE'
    );

  const motivo = String(
    motivoCancelacion || ''
  ).trim();

  if (!motivo) {
    throw crearErrorAplicacion(
      'MOTIVO_CANCELACION_REQUERIDO',
      'Debe indicar el motivo de la cancelación.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      const actual = leerRegistroPorIdSheet(
        HOJAS.CAMINANTES,
        id,
        opcionesCrudCaminante(
          sesion.usuario
        )
      );

      if (!convertirBooleano(actual.activo)) {
        throw crearErrorAplicacion(
          'CAMINANTE_YA_CANCELADO',
          'El caminante ya se encuentra cancelado.'
        );
      }

      const momento = new Date();

      const actualizado = actualizarRegistroSheet(
        HOJAS.CAMINANTES,
        id,
        {
          activo: 'No',
          mesa: '',
          habitacion: '',
          fechaCancelacion: momento,
          motivoCancelacion: motivo
        },
        opcionesCrudCaminante(
          sesion.usuario
        )
      );

      auditarCaminanteCrud(
        sesion,
        'DESACTIVAR_CAMINANTE',
        id,
        {
          nombre: actual.nombre || '',
          mesaAnterior: actual.mesa || '',
          habitacionAnterior:
            actual.habitacion || '',
          fechaCancelacion: momento,
          motivoCancelacion: motivo
        }
      );

      crearNotificacionWhatsappPendiente({
        tipo:
          TIPOS_NOTIFICACION_WHATSAPP.CANCELACION,
        entidad:
          'Caminantes',
        entidadId:
          id,
        nombre:
          actual.nombre || '',
        telefono:
          actual.telefono || '',
        motivo:
          motivo
      });

      return convertirRegistroCaminanteRespuesta(
        actualizado
      );
    }
  );
}

/**
 * Configuración del CRUD para Caminantes.
 */
function opcionesCrudCaminante(
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
    usuario: usuario || ''
  };
}

/**
 * Prepara datos recibidos desde React.
 */
function prepararDatosCaminante(
  datos
) {
  const nombres = validarNombresPersona(
    datos,
    'El caminante'
  );

  return Object.assign({}, datos, {
    primerNombre: nombres.primerNombre,
    segundoNombre: nombres.segundoNombre,
    primerApellido: nombres.primerApellido,
    segundoApellido: nombres.segundoApellido,
    nombre: nombres.nombreCompleto,

    telefono:
      validarCelularColombia(
        datos.telefono,
        {
          requerido: true,
          etiqueta:
            'El celular del caminante'
        }
      ),

    tallaCamiseta:
      String(
        datos.tallaCamiseta || ''
      ).trim(),

    estadoPago:
      estandarizarOpcionCaminante(
        datos.estadoPago ||
          'Pendiente',
        ESTADOS_PAGO_CAMINANTE
      ),

    mesa:
      limpiarValorOpcionalCaminante(
        datos.mesa
      ),

    habitacion:
      limpiarValorOpcionalCaminante(
        datos.habitacion
      ),

    contacto1Nombre:
      String(
        datos.contacto1Nombre ||
        (datos.contacto1 && datos.contacto1.nombre) ||
        (datos.contacto && datos.contacto.nombre) ||
        datos.contacto ||
        ''
      ).trim(),

    contacto1Parentesco:
      String(
        datos.contacto1Parentesco ||
        (datos.contacto1 && datos.contacto1.parentesco) ||
        (datos.contacto && datos.contacto.parentesco) ||
        ''
      ).trim(),

    contacto1Celular:
      validarCelularColombia(
        datos.contacto1Celular ||
        (datos.contacto1 && (datos.contacto1.celular || datos.contacto1.telefono)) ||
        (datos.contacto && (datos.contacto.celular || datos.contacto.telefono)) ||
        datos.telefonoContacto,
        {
          requerido: true,
          etiqueta:
            'El celular del contacto de emergencia 1'
        }
      ),

    contacto2Nombre:
      String(
        datos.contacto2Nombre ||
        (datos.contacto2 && datos.contacto2.nombre) ||
        (datos.contactoAlterno && datos.contactoAlterno.nombre) ||
        ''
      ).trim(),

    contacto2Parentesco:
      String(
        datos.contacto2Parentesco ||
        (datos.contacto2 && datos.contacto2.parentesco) ||
        (datos.contactoAlterno && datos.contactoAlterno.parentesco) ||
        ''
      ).trim(),

    contacto2Celular:
      validarCelularColombia(
        datos.contacto2Celular ||
        (datos.contacto2 && (datos.contacto2.celular || datos.contacto2.telefono)) ||
        (datos.contactoAlterno && (datos.contactoAlterno.celular || datos.contactoAlterno.telefono)),
        {
          requerido: true,
          etiqueta:
            'El celular del contacto de emergencia 2'
        }
      ),

    // Compatibilidad temporal con módulos que todavía consumen el modelo anterior.
    contacto:
      String(
        datos.contacto1Nombre ||
        (datos.contacto1 && datos.contacto1.nombre) ||
        (datos.contacto && datos.contacto.nombre) ||
        datos.contacto ||
        ''
      ).trim(),

    telefonoContacto:
      validarCelularColombia(
        datos.contacto1Celular ||
        (datos.contacto1 && (datos.contacto1.celular || datos.contacto1.telefono)) ||
        (datos.contacto && (datos.contacto.celular || datos.contacto.telefono)) ||
        datos.telefonoContacto,
        {
          requerido: true,
          etiqueta:
            'El celular del contacto de emergencia 1'
        }
      ),

    carta:
      estandarizarOpcionCaminante(
        datos.carta ||
          'Pendiente',
        ESTADOS_ENTREGABLE_CAMINANTE
      ),

    foto:
      estandarizarOpcionCaminante(
        datos.foto ||
          'Pendiente',
        ESTADOS_ENTREGABLE_CAMINANTE
      ),

    tieneCondicionAlimentaria:
      String(datos.tieneCondicionAlimentaria || 'No').trim(),

    alergiasAlimentarias:
      String(datos.alergiasAlimentarias || datos.alergias || '').trim(),

    restriccionesAlimentarias:
      String(datos.restriccionesAlimentarias || '').trim(),

    preferenciasAlimentarias:
      String(datos.preferenciasAlimentarias || '').trim(),

    dietaEspecial:
      String(datos.dietaEspecial || '').trim()
  });
}

/**
 * Valida campos obligatorios.
 */
function validarDatosCaminante(
  datos
) {
  validarNombresPersona(
    datos,
    'El caminante'
  );

  if (!datos.telefono) {
    throw crearErrorAplicacion(
      'TELEFONO_REQUERIDO',
      'Debe ingresar el teléfono.'
    );
  }

  if (!datos.contacto1Nombre) {
    throw crearErrorAplicacion(
      'CONTACTO_1_REQUERIDO',
      'Debe ingresar el nombre del contacto de emergencia 1.'
    );
  }

  if (!datos.contacto1Parentesco) {
    throw crearErrorAplicacion(
      'PARENTESCO_CONTACTO_1_REQUERIDO',
      'Debe ingresar el parentesco del contacto de emergencia 1.'
    );
  }

  if (!datos.contacto1Celular) {
    throw crearErrorAplicacion(
      'TELEFONO_CONTACTO_1_REQUERIDO',
      'Debe ingresar el celular del contacto de emergencia 1.'
    );
  }

  if (!datos.contacto2Nombre) {
    throw crearErrorAplicacion(
      'CONTACTO_2_REQUERIDO',
      'Debe ingresar el nombre del contacto de emergencia 2.'
    );
  }

  if (!datos.contacto2Parentesco) {
    throw crearErrorAplicacion(
      'PARENTESCO_CONTACTO_2_REQUERIDO',
      'Debe ingresar el parentesco del contacto de emergencia 2.'
    );
  }

  if (!datos.contacto2Celular) {
    throw crearErrorAplicacion(
      'TELEFONO_CONTACTO_2_REQUERIDO',
      'Debe ingresar el celular del contacto de emergencia 2.'
    );
  }

  if (!datos.estadoPago) {
    throw crearErrorAplicacion(
      'ESTADO_PAGO_INVALIDO',
      'El estado de pago no es válido.'
    );
  }

  if (!datos.carta) {
    throw crearErrorAplicacion(
      'ESTADO_CARTA_INVALIDO',
      'El estado de carta no es válido.'
    );
  }

  if (!datos.foto) {
    throw crearErrorAplicacion(
      'ESTADO_FOTO_INVALIDO',
      'El estado de foto no es válido.'
    );
  }
}

/**
 * Evita duplicados por nombre y teléfono.
 */
function validarDuplicadoCaminanteCrud(
  datos,
  idExcluir
) {
  const registros =
    listarRegistrosSheet(
      HOJAS.CAMINANTES,
      {},
      opcionesCrudCaminante('')
    );

  const duplicado =
    registros.find(
      function(registro) {
        return (
          String(registro.id) !==
            String(
              idExcluir || ''
            ) &&
          normalizarTexto(
            registro.nombre
          ) ===
            normalizarTexto(
              datos.nombre
            ) &&
          String(
            registro.telefono || ''
          ).trim() ===
            String(
              datos.telefono
            ).trim()
        );
      }
    );

  if (duplicado) {
    throw crearErrorAplicacion(
      'CAMINANTE_DUPLICADO',
      'Ya existe un caminante con el mismo nombre y teléfono.'
    );
  }
}

/**
 * Valida disponibilidad de mesa.
 */
function validarMesaCaminanteCrud(
  numeroMesa,
  idCaminante
) {
  if (!numeroMesa) {
    return;
  }

  const mesa =
    obtenerMesas()
      .find(
        function(item) {
          return (
            String(
              item.numero
            ) ===
            String(
              numeroMesa
            )
          );
        }
      );

  if (!mesa) {
    throw crearErrorAplicacion(
      'MESA_NO_VALIDA',
      'La mesa seleccionada no existe.'
    );
  }

  const yaAsignado =
    (
      mesa.caminantes || []
    ).some(
      function(item) {
        return (
          String(item.id) ===
          String(idCaminante)
        );
      }
    );

  if (
    !yaAsignado &&
    mesa.cuposDisponibles <= 0
  ) {
    throw crearErrorAplicacion(
      'MESA_SIN_CUPO',
      'La mesa seleccionada no tiene cupos disponibles.'
    );
  }
}

/**
 * Valida disponibilidad de habitación.
 */
function validarHabitacionCaminanteCrud(
  numeroHabitacion,
  idCaminante
) {
  if (!numeroHabitacion) {
    return;
  }

  const habitacion =
    obtenerHabitaciones()
      .find(
        function(item) {
          return (
            String(
              item.habitacion
            ) ===
            String(
              numeroHabitacion
            )
          );
        }
      );

  if (!habitacion) {
    throw crearErrorAplicacion(
      'HABITACION_NO_VALIDA',
      'La habitación seleccionada no existe.'
    );
  }

  const persona =
    habitacion.persona ||
    (
      habitacion.personas ||
      []
    )[0] ||
    null;

  const mismaPersona =
    persona &&
    persona.tipoPersona ===
      'Caminante' &&
    String(persona.id) ===
      String(idCaminante);

  if (
    habitacion.asignada &&
    !mismaPersona
  ) {
    throw crearErrorAplicacion(
      'HABITACION_OCUPADA',
      'La habitación seleccionada ya está ocupada.'
    );
  }
}

/**
 * Obtiene mesas disponibles.
 */
function obtenerMesasDisponiblesCaminante() {
  return obtenerMesas()
    .filter(
      function(mesa) {
        return (
          mesa.cuposDisponibles >
          0
        );
      }
    )
    .map(
      function(mesa) {
        return {
          numero:
            mesa.numero,

          capacidad:
            mesa.capacidad,

          ocupados:
            mesa.cantidadCaminantes,

          cuposDisponibles:
            mesa.cuposDisponibles,

          etiqueta:
            'Mesa ' +
            mesa.numero +
            ' — ' +
            mesa.cuposDisponibles +
            (
              mesa.cuposDisponibles ===
              1
                ? ' cupo disponible'
                : ' cupos disponibles'
            )
        };
      }
    );
}

/**
 * Obtiene habitaciones disponibles.
 */
function obtenerHabitacionesDisponiblesCaminante() {
  return obtenerHabitaciones()
    .filter(
      function(habitacion) {
        const tipo =
          normalizarTexto(
            habitacion.tipo
          );

        const tipoPermitido =
          !tipo ||
          tipo ===
            'caminante' ||
          tipo ===
            'caminantes' ||
          tipo ===
            'mixta' ||
          tipo ===
            'mixto';

        return (
          !habitacion.asignada &&
          habitacion.cuposDisponibles >
            0 &&
          tipoPermitido
        );
      }
    )
    .map(
      function(habitacion) {
        return {
          habitacion:
            habitacion.habitacion,

          piso:
            habitacion.piso || '',

          tipo:
            habitacion.tipo || '',

          etiqueta:
            'Habitación ' +
            habitacion.habitacion +
            (
              habitacion.piso
                ? ' — Piso ' +
                  habitacion.piso
                : ''
            )
        };
      }
    );
}

/**
 * Actualiza un campo y audita.
 */
function actualizarCampoCaminanteConAuditoria(
  sesion,
  id,
  campo,
  valor,
  accion
) {
  return ejecutarCrudConBloqueo(
    function() {
      return actualizarCampoCaminanteConAuditoriaInterno(
        sesion,
        id,
        campo,
        valor,
        accion
      );
    }
  );
}

function actualizarCampoCaminanteConAuditoriaInterno(
  sesion,
  id,
  campo,
  valor,
  accion
) {
  const anterior =
    leerRegistroPorIdSheet(
      HOJAS.CAMINANTES,
      id,
      opcionesCrudCaminante(
        sesion.usuario
      )
    );

  const actualizado =
    actualizarCampoSheet(
      HOJAS.CAMINANTES,
      id,
      campo,
      valor,
      opcionesCrudCaminante(
        sesion.usuario
      )
    );

  auditarCaminanteCrud(
    sesion,
    accion,
    id,
    {
      campo: campo,
      anterior:
        anterior[campo],
      nuevo:
        actualizado[campo]
    }
  );

  return convertirRegistroCaminanteRespuesta(
    actualizado
  );
}

/**
 * Convierte a contrato de respuesta.
 */
function convertirRegistroCaminanteRespuesta(
  registro
) {
  return {
    id:
      registro.id,

    nombre:
      registro.nombre,
    primerNombre:
      registro.primerNombre || '',
    segundoNombre:
      registro.segundoNombre || '',
    primerApellido:
      registro.primerApellido || '',
    segundoApellido:
      registro.segundoApellido || '',

    telefono:
      registro.telefono,

    tallaCamiseta:
      registro.tallaCamiseta || '',

    estadoPago:
      registro.estadoPago,

    mesa:
      registro.mesa || '',

    habitacion:
      registro.habitacion || '',

    contacto1Nombre:
      registro.contacto1Nombre || registro.contacto || '',

    contacto1Parentesco:
      registro.contacto1Parentesco || '',

    contacto1Celular:
      registro.contacto1Celular || registro.telefonoContacto || '',

    contacto2Nombre:
      registro.contacto2Nombre || '',

    contacto2Parentesco:
      registro.contacto2Parentesco || '',

    contacto2Celular:
      registro.contacto2Celular || '',

    contacto: {
      nombre:
        registro.contacto1Nombre || registro.contacto || '',
      parentesco:
        registro.contacto1Parentesco || '',
      telefono:
        registro.contacto1Celular || registro.telefonoContacto || ''
    },

    contactoAlterno: {
      nombre: registro.contacto2Nombre || '',
      parentesco: registro.contacto2Parentesco || '',
      telefono: registro.contacto2Celular || ''
    },

    entregables: {
      carta:
        registro.carta ||
        'Pendiente',

      foto:
        registro.foto ||
        'Pendiente',

      aprobacionCartaLogistica: {
        aprobadoPor: registro.cartaAprobadaLogisticaPor || '',
        fecha: registro.cartaFechaAprobacionLogistica || ''
      },

      aprobacionFotoLogistica: {
        aprobadoPor: registro.fotoAprobadaLogisticaPor || '',
        fecha: registro.fotoFechaAprobacionLogistica || ''
      }
    },

    activo:
      registro.activo,

    fechaRegistro:
      registro.fechaRegistro,

    fechaActualizacion:
      registro.fechaActualizacion,

    actualizadoPor:
      registro.actualizadoPor,

    fechaCancelacion:
      registro.fechaCancelacion || '',

    motivoCancelacion:
      registro.motivoCancelacion || ''
  };
}

/**
 * Normaliza opción permitida.
 */
function estandarizarOpcionCaminante(
  valor,
  opciones
) {
  const buscado =
    normalizarTexto(valor);

  const opcion =
    opciones.find(
      function(item) {
        return (
          normalizarTexto(
            item
          ) === buscado
        );
      }
    );

  return opcion || '';
}

/**
 * Limpia campos opcionales.
 */
function limpiarValorOpcionalCaminante(
  valor
) {
  const texto =
    String(
      valor || ''
    ).trim();

  const normalizado =
    normalizarTexto(
      texto
    );

  if (
    !texto ||
    normalizado ===
      'pendiente' ||
    normalizado ===
      'pendiente por definir' ||
    normalizado ===
      'sin asignar'
  ) {
    return '';
  }

  return texto;
}

/**
 * Registra auditoría.
 */
function auditarCaminanteCrud(
  sesion,
  accion,
  id,
  detalle
) {
  registrarAuditoria({
    usuario:
      sesion.usuario,

    nombre:
      sesion.nombre,

    accion:
      accion,

    entidad:
      'Caminantes',

    idRegistro:
      id,

    detalle:
      JSON.stringify(
        detalle
      )
  });
}

/**
 * Prueba de lectura CRUD.
 */
function probarCaminantesCrud() {
  const registros =
    listarRegistrosSheet(
      HOJAS.CAMINANTES,
      {
        activo: true
      },
      opcionesCrudCaminante('')
    );

  console.log(
    JSON.stringify(
      registros.slice(
        0,
        5
      ),
      null,
      2
    )
  );
}


function pruebaExisteFuncion() {
  Logger.log(
    typeof obtenerOpcionesRegistroCaminante
  );
}