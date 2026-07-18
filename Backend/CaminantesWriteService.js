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
  'En Proceso',
  'Completado'
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
      'REGISTRAR_CAMINANTE',
      'EDITAR_CAMINANTE',
      'ASIGNAR_MESA',
      'ASIGNAR_HABITACION'
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
      'REGISTRAR_CAMINANTE'
    );

  return ejecutarCrudConBloqueo(
    function() {
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
        'REGISTRAR_CAMINANTE',
        creado.id,
        creado
      );

      return convertirRegistroCaminanteRespuesta(
        creado
      );
    }
  );
}

/**
 * Edita datos generales.
 *
 * Requiere EDITAR_CAMINANTE.
 */
function editarCaminante(
  token,
  id,
  datos
) {
  const sesion =
    validarPermiso(
      token,
      'EDITAR_CAMINANTE'
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
        'EDITAR_CAMINANTE',
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
      'ASIGNAR_MESA'
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
        'ASIGNAR_MESA'
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
      'ASIGNAR_HABITACION'
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
        'ASIGNAR_HABITACION'
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
      'ACTUALIZAR_CARTA'
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

  return actualizarCampoCaminanteConAuditoria(
    sesion,
    id,
    'carta',
    valor,
    'ACTUALIZAR_CARTA'
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
      'ACTUALIZAR_FOTO'
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

  return actualizarCampoCaminanteConAuditoria(
    sesion,
    id,
    'foto',
    valor,
    'ACTUALIZAR_FOTO'
  );
}

/**
 * Desactiva un caminante.
 */
function desactivarCaminante(
  token,
  id
) {
  const sesion =
    validarPermiso(
      token,
      'EDITAR_CAMINANTE'
    );

  const resultado =
    ejecutarCrudConBloqueo(
      function() {
        return desactivarRegistroSheet(
          HOJAS.CAMINANTES,
          id,
          opcionesCrudCaminante(
            sesion.usuario
          )
        );
      }
    );

  auditarCaminanteCrud(
    sesion,
    'DESACTIVAR_CAMINANTE',
    id,
    resultado
  );

  return convertirRegistroCaminanteRespuesta(
    resultado
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
  return {
    nombre:
      String(
        datos.nombre || ''
      ).trim(),

    telefono:
      String(
        datos.telefono || ''
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

    contacto:
      String(
        datos.contacto || ''
      ).trim(),

    telefonoContacto:
      String(
        datos.telefonoContacto || ''
      ).trim(),

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
      )
  };
}

/**
 * Valida campos obligatorios.
 */
function validarDatosCaminante(
  datos
) {
  if (!datos.nombre) {
    throw crearErrorAplicacion(
      'NOMBRE_REQUERIDO',
      'Debe ingresar el nombre completo.'
    );
  }

  if (!datos.telefono) {
    throw crearErrorAplicacion(
      'TELEFONO_REQUERIDO',
      'Debe ingresar el teléfono.'
    );
  }

  if (!datos.contacto) {
    throw crearErrorAplicacion(
      'CONTACTO_REQUERIDO',
      'Debe ingresar el contacto.'
    );
  }

  if (
    !datos.telefonoContacto
  ) {
    throw crearErrorAplicacion(
      'TELEFONO_CONTACTO_REQUERIDO',
      'Debe ingresar el teléfono del contacto.'
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

    telefono:
      registro.telefono,

    estadoPago:
      registro.estadoPago,

    mesa:
      registro.mesa || '',

    habitacion:
      registro.habitacion || '',

    contacto: {
      nombre:
        registro.contacto || '',

      telefono:
        registro.telefonoContacto ||
        ''
    },

    entregables: {
      carta:
        registro.carta ||
        'Pendiente',

      foto:
        registro.foto ||
        'Pendiente'
    },

    activo:
      registro.activo,

    fechaRegistro:
      registro.fechaRegistro,

    fechaActualizacion:
      registro.fechaActualizacion,

    actualizadoPor:
      registro.actualizadoPor
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