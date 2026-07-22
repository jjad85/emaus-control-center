/**
 * ============================================================
 * ADMINISTRACIÓN DE HABITACIONES
 * ============================================================
 *
 * La asignación continúa almacenándose en:
 * - Caminantes.habitacion
 * - Servidores.habitacion
 *
 * La hoja Habitaciones únicamente administra:
 * - número;
 * - capacidad;
 * - bloque;
 * - piso;
 * - observaciones;
 * - estado.
 *
 * El tipo se calcula automáticamente con las personas asignadas.
 */

function obtenerHabitaciones() {
  var habitaciones =
    leerHojaComoObjetos(
      HOJAS.HABITACIONES
    );

  var caminantes =
    obtenerCaminantes({});

  var servidores =
    obtenerServidores({});

  return habitaciones
    .map(function(registro) {
      return construirHabitacion(
        registro,
        caminantes,
        servidores
      );
    })
    .sort(compararHabitacionesBackend_);
}

function obtenerHabitacionPorId(id) {
  var habitacion =
    obtenerHabitaciones()
      .find(function(item) {
        return (
          String(item.id) === String(id) ||
          String(item.habitacion) === String(id)
        );
      });

  if (!habitacion) {
    throw crearErrorAplicacion(
      'HABITACION_NO_ENCONTRADA',
      'No existe la habitación ' + id + '.'
    );
  }

  return habitacion;
}

function construirHabitacion(
  registro,
  caminantes,
  servidores
) {
  var numeroHabitacion =
    String(
      registro.habitacion ||
      registro.nombre ||
      registro.id ||
      ''
    ).trim();

  var personasEncontradas = [];

  caminantes
    .filter(function(item) {
      return (
        String(item.habitacion || '').trim() ===
        numeroHabitacion
      );
    })
    .forEach(function(item) {
      personasEncontradas.push({
        id: item.id,
        nombre: item.nombre,
        tipoPersona: 'Caminante',
        mesa: item.mesa || '',
        equipo: '',
        rol: '',
        fotoPerfilUrl: '',
        asignado: true
      });
    });

  servidores
    .filter(function(item) {
      return (
        String(item.habitacion || '').trim() ===
        numeroHabitacion
      );
    })
    .forEach(function(item) {
      personasEncontradas.push({
        id: item.id,
        nombre: item.nombre,
        tipoPersona: 'Servidor',
        equipo: item.equipo || '',
        rol:
          item.rolMesa ||
          item.rolEquipo ||
          item.rol ||
          '',
        mesa: item.mesa || '',
        fotoPerfilUrl:
          item.fotoPerfilUrl || '',
        asignado: true
      });
    });

  var capacidad =
    normalizarCapacidadHabitacion_(
      registro.capacidad
    );

  var ocupantes =
    personasEncontradas.length;

  var tipos = Array.from(
    new Set(
      personasEncontradas.map(function(item) {
        return item.tipoPersona;
      })
    )
  );

  var tipoCalculado =
    tipos.length === 0
      ? 'Sin asignar'
      : tipos.length === 1
        ? tipos[0]
        : 'Mixta';

  var activo =
    convertirEstadoHabitacion_(
      registro.estado !== undefined
        ? registro.estado
        : registro.activo,
      true
    );

  return {
    id:
      registro.id ||
      numeroHabitacion,

    habitacion:
      numeroHabitacion,

    tipo:
      tipoCalculado,

    capacidad:
      capacidad,

    bloque:
      String(
        registro.bloque ||
        'Sin bloque'
      ).trim() || 'Sin bloque',

    piso:
      String(
        registro.piso ||
        'Sin piso'
      ).trim() || 'Sin piso',

    observaciones:
      registro.observaciones || '',

    activo:
      activo,

    estado:
      activo ? 'Activo' : 'Inactivo',

    ocupantes:
      ocupantes,

    cuposDisponibles:
      Math.max(
        capacidad - ocupantes,
        0
      ),

    porcentajeOcupacion:
      capacidad
        ? Math.min(
            Math.round(
              (ocupantes / capacidad) * 100
            ),
            100
          )
        : 0,

    asignada:
      ocupantes > 0,

    persona:
      personasEncontradas[0] || null,

    personas:
      personasEncontradas,

    conflictoAsignacion:
      ocupantes > capacidad ||
      tipoCalculado === 'Mixta',

    cantidadAsignados:
      ocupantes
  };
}

function editarHabitacion(
  token,
  habitacionId,
  datos
) {
  var sesion =
    validarPermiso(
      token,
      'ASIGNAR_HABITACION'
    );

  var actual =
    obtenerHabitacionPorId(
      habitacionId
    );

  var entrada = datos || {};

  var numero =
    String(
      entrada.habitacion || ''
    ).trim();

  var bloque =
    String(
      entrada.bloque || ''
    ).trim();

  var piso =
    String(
      entrada.piso || ''
    ).trim();

  var observaciones =
    String(
      entrada.observaciones || ''
    ).trim();

  var capacidad =
    Number(
      entrada.capacidad
    );

  var activo =
    convertirEstadoHabitacion_(
      entrada.activo,
      true
    );

  if (!numero) {
    throw crearErrorAplicacion(
      'NUMERO_HABITACION_REQUERIDO',
      'El número de habitación es obligatorio.'
    );
  }

  if (
    !Number.isInteger(capacidad) ||
    capacidad < 1 ||
    capacidad > 2
  ) {
    throw crearErrorAplicacion(
      'CAPACIDAD_HABITACION_INVALIDA',
      'La capacidad debe ser 1 o 2.'
    );
  }

  if (capacidad < actual.ocupantes) {
    throw crearErrorAplicacion(
      'CAPACIDAD_MENOR_OCUPACION',
      'La capacidad no puede ser menor que la cantidad de personas actualmente asignadas.'
    );
  }

  if (!bloque) {
    throw crearErrorAplicacion(
      'BLOQUE_REQUERIDO',
      'El bloque es obligatorio.'
    );
  }

  if (!piso) {
    throw crearErrorAplicacion(
      'PISO_REQUERIDO',
      'El piso es obligatorio.'
    );
  }

  var duplicada =
    obtenerHabitaciones()
      .some(function(item) {
        return (
          String(item.id) !==
            String(actual.id) &&
          normalizarTexto(
            item.habitacion
          ) ===
            normalizarTexto(numero)
        );
      });

  if (duplicada) {
    throw crearErrorAplicacion(
      'HABITACION_DUPLICADA',
      'Ya existe otra habitación con ese número.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      if (
        String(actual.habitacion) !==
        numero
      ) {
        actualizarNumeroHabitacionPersonas_(
          sesion,
          actual.habitacion,
          numero
        );
      }

      actualizarRegistroSheet(
        HOJAS.HABITACIONES,
        actual.id,
        {
          habitacion: numero,
          capacidad: capacidad,
          bloque: bloque,
          piso: piso,
          observaciones:
            observaciones,
          estado:
            activo ? 'Sí' : 'No',
          activo:
            activo ? 'Sí' : 'No',
          fechaActualizacion:
            new Date(),
          actualizadoPor:
            sesion.usuario || ''
        },
        opcionesCrudHabitaciones_(
          sesion.usuario
        )
      );

      auditarHabitacion_(
        sesion,
        'EDITAR_HABITACION',
        actual.id,
        {
          habitacion: numero,
          capacidad: capacidad,
          bloque: bloque,
          piso: piso,
          activo: activo
        }
      );

      return obtenerHabitacionPorId(
        actual.id
      );
    }
  );
}

function obtenerCandidatosHabitacion(
  token,
  habitacionId,
  tipoPersona
) {
  validarPermiso(
    token,
    'ASIGNAR_HABITACION'
  );

  var habitacion =
    obtenerHabitacionPorId(
      habitacionId
    );

  if (!habitacion.activo) {
    throw crearErrorAplicacion(
      'HABITACION_INACTIVA',
      'No se pueden asignar personas a una habitación inactiva.'
    );
  }

  if (
    habitacion.cuposDisponibles <= 0
  ) {
    return {
      habitacion: habitacion,
      tipoPersona:
        normalizarTipoPersonaHabitacion_(
          tipoPersona
        ),
      candidatos: []
    };
  }

  var tipo =
    normalizarTipoPersonaHabitacion_(
      tipoPersona
    );

  if (
    habitacion.tipo !== 'Sin asignar' &&
    habitacion.tipo !== tipo
  ) {
    throw crearErrorAplicacion(
      'TIPO_HABITACION_NO_COINCIDE',
      'Esta habitación ya está destinada a ' +
        habitacion.tipo.toLowerCase() +
        's.'
    );
  }

  var personas =
    tipo === 'Servidor'
      ? obtenerServidores({})
      : obtenerCaminantes({});

  var candidatos =
    personas
      .filter(function(persona) {
        return !String(
          persona.habitacion || ''
        ).trim();
      })
      .map(function(persona) {
        return {
          id: persona.id,
          nombre: persona.nombre,
          tipoPersona: tipo,
          fotoPerfilUrl:
            persona.fotoPerfilUrl || '',
          equipo:
            persona.equipo || '',
          rol:
            persona.rolMesa ||
            persona.rolEquipo ||
            persona.rol ||
            '',
          mesa:
            persona.mesa || '',
          documento:
            persona.documentoIdentidad ||
            persona.documento ||
            ''
        };
      })
      .sort(function(a, b) {
        return String(
          a.nombre || ''
        ).localeCompare(
          String(b.nombre || ''),
          'es'
        );
      });

  return {
    habitacion: habitacion,
    tipoPersona: tipo,
    candidatos: candidatos
  };
}

function asignarPersonasHabitacion(
  token,
  habitacionId,
  tipoPersona,
  personaIds
) {
  var sesion =
    validarPermiso(
      token,
      'ASIGNAR_HABITACION'
    );

  var tipo =
    normalizarTipoPersonaHabitacion_(
      tipoPersona
    );

  var ids = Array.isArray(personaIds)
    ? Array.from(
        new Set(
          personaIds
            .map(String)
            .filter(Boolean)
        )
      )
    : [];

  if (!ids.length) {
    throw crearErrorAplicacion(
      'PERSONAS_REQUERIDAS',
      'Seleccione al menos una persona.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      var habitacion =
        obtenerHabitacionPorId(
          habitacionId
        );

      if (!habitacion.activo) {
        throw crearErrorAplicacion(
          'HABITACION_INACTIVA',
          'No se pueden asignar personas a una habitación inactiva.'
        );
      }

      if (
        habitacion.tipo !== 'Sin asignar' &&
        habitacion.tipo !== tipo
      ) {
        throw crearErrorAplicacion(
          'TIPO_HABITACION_NO_COINCIDE',
          'No se pueden mezclar servidores y caminantes en la misma habitación.'
        );
      }

      if (
        ids.length >
        habitacion.cuposDisponibles
      ) {
        throw crearErrorAplicacion(
          'CAPACIDAD_HABITACION_SUPERADA',
          'La habitación solo tiene ' +
            habitacion.cuposDisponibles +
            ' cupo(s) disponible(s).'
        );
      }

      var personas =
        tipo === 'Servidor'
          ? obtenerServidores({})
          : obtenerCaminantes({});

      var seleccionadas =
        personas.filter(function(persona) {
          return ids.indexOf(
            String(persona.id)
          ) >= 0;
        });

      if (
        seleccionadas.length !==
        ids.length
      ) {
        throw crearErrorAplicacion(
          'PERSONA_NO_ENCONTRADA',
          'Una o más personas seleccionadas no existen.'
        );
      }

      var yaAsignadas =
        seleccionadas.filter(
          function(persona) {
            return String(
              persona.habitacion || ''
            ).trim();
          }
        );

      if (yaAsignadas.length) {
        throw crearErrorAplicacion(
          'PERSONA_CON_HABITACION',
          'Las siguientes personas ya tienen habitación: ' +
            yaAsignadas
              .map(function(persona) {
                return persona.nombre;
              })
              .join(', ')
        );
      }

      seleccionadas.forEach(
        function(persona) {
          if (tipo === 'Servidor') {
            actualizarRegistroSheet(
              HOJAS.SERVIDORES,
              persona.id,
              {
                habitacion:
                  habitacion.habitacion,
                fechaActualizacion:
                  new Date(),
                actualizadoPor:
                  sesion.usuario || ''
              },
              opcionesCrudServidores_(
                sesion.usuario
              )
            );
          } else {
            actualizarRegistroSheet(
              HOJAS.CAMINANTES,
              persona.id,
              {
                habitacion:
                  habitacion.habitacion,
                fechaActualizacion:
                  new Date(),
                actualizadoPor:
                  sesion.usuario || ''
              },
              opcionesCrudCaminante(
                sesion.usuario
              )
            );
          }
        }
      );

      auditarHabitacion_(
        sesion,
        'ASIGNAR_PERSONAS_HABITACION',
        habitacion.id,
        {
          tipoPersona: tipo,
          personas:
            seleccionadas.map(
              function(persona) {
                return persona.nombre;
              }
            )
        }
      );

      return obtenerHabitacionPorId(
        habitacion.id
      );
    }
  );
}

function actualizarNumeroHabitacionPersonas_(
  sesion,
  numeroAnterior,
  numeroNuevo
) {
  obtenerServidores({})
    .filter(function(servidor) {
      return (
        String(
          servidor.habitacion || ''
        ).trim() ===
        String(numeroAnterior)
      );
    })
    .forEach(function(servidor) {
      actualizarRegistroSheet(
        HOJAS.SERVIDORES,
        servidor.id,
        {
          habitacion: numeroNuevo,
          fechaActualizacion:
            new Date(),
          actualizadoPor:
            sesion.usuario || ''
        },
        opcionesCrudServidores_(
          sesion.usuario
        )
      );
    });

  obtenerCaminantes({})
    .filter(function(caminante) {
      return (
        String(
          caminante.habitacion || ''
        ).trim() ===
        String(numeroAnterior)
      );
    })
    .forEach(function(caminante) {
      actualizarRegistroSheet(
        HOJAS.CAMINANTES,
        caminante.id,
        {
          habitacion: numeroNuevo,
          fechaActualizacion:
            new Date(),
          actualizadoPor:
            sesion.usuario || ''
        },
        opcionesCrudCaminante(
          sesion.usuario
        )
      );
    });
}

function obtenerIndicadoresHabitaciones(
  habitaciones
) {
  return {
    total:
      habitaciones.length,

    activas:
      habitaciones.filter(
        function(item) {
          return item.activo;
        }
      ).length,

    inactivas:
      habitaciones.filter(
        function(item) {
          return !item.activo;
        }
      ).length,

    ocupadas:
      habitaciones.filter(
        function(item) {
          return item.ocupantes > 0;
        }
      ).length,

    disponibles:
      habitaciones.filter(
        function(item) {
          return (
            item.activo &&
            item.cuposDisponibles > 0
          );
        }
      ).length,

    conConflicto:
      habitaciones.filter(
        function(item) {
          return item.conflictoAsignacion;
        }
      ).length
  };
}

function normalizarCapacidadHabitacion_(
  valor
) {
  var capacidad =
    Number(valor || 1);

  if (
    !Number.isInteger(capacidad) ||
    capacidad < 1
  ) {
    return 1;
  }

  return Math.min(
    capacidad,
    2
  );
}

function normalizarTipoPersonaHabitacion_(
  valor
) {
  var tipo =
    normalizarTexto(valor);

  if (tipo === 'servidor') {
    return 'Servidor';
  }

  if (tipo === 'caminante') {
    return 'Caminante';
  }

  throw crearErrorAplicacion(
    'TIPO_PERSONA_INVALIDO',
    'Seleccione si va a asignar un servidor o un caminante.'
  );
}

function convertirEstadoHabitacion_(
  valor,
  defecto
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return defecto;
  }

  if (typeof valor === 'boolean') {
    return valor;
  }

  return [
    'si',
    'sí',
    'true',
    '1',
    'activo'
  ].indexOf(
    normalizarTexto(valor)
  ) >= 0;
}

function opcionesCrudHabitaciones_(
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

function compararHabitacionesBackend_(
  a,
  b
) {
  var bloque =
    String(a.bloque).localeCompare(
      String(b.bloque),
      'es',
      {
        numeric: true,
        sensitivity: 'base'
      }
    );

  if (bloque !== 0) {
    return bloque;
  }

  var piso =
    String(a.piso).localeCompare(
      String(b.piso),
      'es',
      {
        numeric: true,
        sensitivity: 'base'
      }
    );

  if (piso !== 0) {
    return piso;
  }

  return String(
    a.habitacion
  ).localeCompare(
    String(b.habitacion),
    'es',
    {
      numeric: true,
      sensitivity: 'base'
    }
  );
}

function auditarHabitacion_(
  sesion,
  accion,
  idRegistro,
  detalle
) {
  if (
    typeof registrarAuditoria !==
    'function'
  ) {
    return;
  }

  registrarAuditoria({
    usuario:
      sesion.usuario || '',
    nombre:
      sesion.nombre || '',
    accion: accion,
    entidad: 'Habitaciones',
    idRegistro: idRegistro,
    detalle:
      JSON.stringify(detalle)
  });
}
