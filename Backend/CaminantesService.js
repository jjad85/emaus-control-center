/**
 * ============================================================
 * CAMINANTES SERVICE
 * ============================================================
 */

/**
 * Obtiene todos los caminantes aplicando filtros opcionales.
 */
function obtenerCaminantes(filtros) {
  const parametros = filtros || {};

  const aspirantes = leerHojaComoObjetos(
    HOJAS.ASPIRANTES
  );

  const aspirantesPorCaminanteId = {};
  const aspirantesPorCelular = {};
  const aspirantesPorNombre = {};

  aspirantes.forEach(function(aspirante) {
    const caminanteId = String(
      aspirante.caminanteId || ''
    ).trim();

    const celular = normalizarDatoCruceCaminante(
      aspirante.celular
    );

    const nombre = normalizarTexto(
      aspirante.nombreCompleto || ''
    );

    if (caminanteId) {
      aspirantesPorCaminanteId[caminanteId] = aspirante;
    }

    if (celular) {
      aspirantesPorCelular[celular] = aspirante;
    }

    if (nombre) {
      aspirantesPorNombre[nombre] = aspirante;
    }
  });

  return leerHojaComoObjetos(
    HOJAS.CAMINANTES
  )
    .map(function(registro) {
      const caminante = convertirCaminante(registro);

      const aspirante =
        aspirantesPorCaminanteId[String(caminante.id)] ||
        aspirantesPorCelular[normalizarDatoCruceCaminante(caminante.telefono)] ||
        aspirantesPorNombre[normalizarTexto(caminante.nombre)] ||
        null;

      return enriquecerCaminanteConAspirante(
        caminante,
        aspirante
      );
    })
    .filter(function(caminante) {
      return (
        convertirBooleano(
          caminante.activo
        ) &&
        coincideTexto(
          caminante.nombre,
          parametros.nombre
        ) &&
        coincideExacto(
          caminante.estadoPago,
          parametros.estadoPago
        ) &&
        coincideExacto(
          caminante.mesa,
          parametros.mesa
        ) &&
        coincideExacto(
          caminante.habitacion,
          parametros.habitacion
        ) &&
        coincideExacto(
          caminante.entregables.carta,
          parametros.carta
        ) &&
        coincideExacto(
          caminante.entregables.foto,
          parametros.foto
        )
      );
    });
}


/**
 * Normaliza teléfonos y documentos para cruces internos.
 */
function normalizarDatoCruceCaminante(valor) {
  return String(valor || '')
    .replace(/\D/g, '')
    .trim();
}

/**
 * Complementa el caminante con la información registrada
 * durante la preinscripción como aspirante.
 */
function enriquecerCaminanteConAspirante(
  caminante,
  aspirante
) {
  if (!aspirante) {
    return caminante;
  }

  /*
   * Conserva todos los campos del aspirante y luego aplica los datos
   * propios del caminante. Así no se pierden campos de preinscripción
   * cuando se agreguen nuevas columnas a la hoja Aspirantes.
   */
  const enriquecido = Object.assign(
    {},
    aspirante,
    caminante
  );

  enriquecido.primerNombre =
    caminante.primerNombre ||
    aspirante.primerNombre ||
    '';
  enriquecido.segundoNombre =
    caminante.segundoNombre ||
    aspirante.segundoNombre ||
    '';
  enriquecido.primerApellido =
    caminante.primerApellido ||
    aspirante.primerApellido ||
    '';
  enriquecido.segundoApellido =
    caminante.segundoApellido ||
    aspirante.segundoApellido ||
    '';

  enriquecido.nombre =
    caminante.nombre ||
    aspirante.nombreCompleto ||
    construirNombreCompletoPersona(
      enriquecido.primerNombre,
      enriquecido.segundoNombre,
      enriquecido.primerApellido,
      enriquecido.segundoApellido
    ) ||
    '';

  enriquecido.telefono =
    caminante.telefono ||
    aspirante.celular ||
    aspirante.telefono ||
    '';

  enriquecido.numeroInscripcion =
    aspirante.numeroInscripcion || '';

  enriquecido.documentoIdentidad =
    aspirante.documentoIdentidad || '';

  enriquecido.direccionResidencia =
    aspirante.direccionResidencia || '';

  enriquecido.fechaNacimiento =
    aspirante.fechaNacimiento || '';

  enriquecido.edad =
    aspirante.edad || '';

  enriquecido.barrio =
    aspirante.barrio || '';

  enriquecido.telefonoFijo =
    aspirante.telefono || '';

  enriquecido.correo =
    aspirante.correo ||
    aspirante.correoElectronico ||
    aspirante.email ||
    '';

  enriquecido.estadoCivil =
    aspirante.estadoCivil || '';

  enriquecido.parroquia =
    aspirante.parroquia || '';

  enriquecido.eps =
    aspirante.eps ||
    aspirante.nombreEps ||
    '';

  enriquecido.profesionOcupacion =
    aspirante.profesionOcupacion ||
    aspirante.profesion ||
    aspirante.ocupacion ||
    '';

  enriquecido.sufreEnfermedad =
    aspirante.sufreEnfermedad || '';

  enriquecido.enfermedadCual =
    aspirante.enfermedadCual || '';

  enriquecido.tomaMedicamento =
    aspirante.tomaMedicamento || '';

  enriquecido.medicamentoCual =
    aspirante.medicamentoCual || '';

  enriquecido.horariosMedicamentos =
    aspirante.horariosMedicamentos || '';

  enriquecido.tieneLimitacionFisica =
    aspirante.tieneLimitacionFisica || '';

  enriquecido.limitacionCual =
    aspirante.limitacionCual || '';

  enriquecido.tieneCondicionAlimentaria =
    aspirante.tieneCondicionAlimentaria || 'No';

  enriquecido.alergiasAlimentarias =
    aspirante.alergiasAlimentarias ||
    aspirante.alergias ||
    '';

  enriquecido.alergias =
    enriquecido.alergiasAlimentarias;

  enriquecido.restriccionesAlimentarias =
    aspirante.restriccionesAlimentarias || '';

  enriquecido.preferenciasAlimentarias =
    aspirante.preferenciasAlimentarias || '';

  enriquecido.dietaEspecial =
    aspirante.dietaEspecial || '';

  enriquecido.sacramentosRecibidos =
    aspirante.sacramentosRecibidos || '';

  enriquecido.tallaCamiseta =
    caminante.tallaCamiseta ||
    aspirante.tallaCamisa ||
    aspirante.tallaCamiseta ||
    aspirante.talla ||
    '';

  enriquecido.contacto = {
    nombre:
      (caminante.contacto && caminante.contacto.nombre) ||
      aspirante.contacto1Nombre ||
      '',
    parentesco:
      aspirante.contacto1Parentesco || '',
    telefono:
      (caminante.contacto && caminante.contacto.telefono) ||
      aspirante.contacto1Celular ||
      ''
  };

  enriquecido.contactoAlterno = {
    nombre: aspirante.contacto2Nombre || '',
    parentesco: aspirante.contacto2Parentesco || '',
    telefono: aspirante.contacto2Celular || ''
  };

  enriquecido.comoSeEntero =
    aspirante.comoSeEntero || '';

  enriquecido.nombrePersonaInvito =
    aspirante.nombrePersonaInvito ||
    aspirante.personaInvito ||
    aspirante.invitadoPor ||
    '';

  enriquecido.celularPersonaInvito =
    aspirante.celularPersonaInvito ||
    aspirante.telefonoPersonaInvito ||
    '';

  enriquecido.personaConocidaAsistira =
    aspirante.personaConocidaAsistira || '';

  enriquecido.nombrePersonaConocida =
    aspirante.nombrePersonaConocida || '';

  enriquecido.autorizaTratamientoDatos =
    aspirante.autorizaTratamientoDatos || '';

  enriquecido.autorizaFotografias =
    aspirante.autorizaFotografias || '';

  enriquecido.observacionesGestion =
    aspirante.observacionesGestion || '';

  enriquecido.aspiranteId =
    aspirante.id || '';

  return enriquecido;
}

/**
 * Consulta un caminante por ID.
 */
function obtenerCaminantePorId(id) {
  const caminante = obtenerCaminantes({})
    .find(function(item) {
      return String(item.id) === String(id);
    });

  if (!caminante) {
    throw crearErrorAplicacion(
      'CAMINANTE_NO_ENCONTRADO',
      'No existe el caminante con ID ' + id + '.'
    );
  }

  return caminante;
}

/**
 * Convierte una fila de Sheets en un caminante.
 */
function convertirCaminante(registro) {
  return {
    id: registro.id || '',

    nombre: registro.nombre || '',
    primerNombre: registro.primerNombre || '',
    segundoNombre: registro.segundoNombre || '',
    primerApellido: registro.primerApellido || '',
    segundoApellido: registro.segundoApellido || '',

    telefono: registro.telefono || '',

    autorizaTratamientoDatos: registro.autorizaTratamientoDatos || 'Pendiente',

    autorizaFotografias: registro.autorizaFotografias || 'Pendiente',

    tallaCamiseta:
      registro.tallaCamiseta || '',

    estadoPago:
      registro.estadoPago ||
      'Sin definir',

    mesa: registro.mesa || '',

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

    activo:
      registro.activo,

    seguimiento: {
      llamadaCaminante:
        registro.llamadaCaminante ||
        'Pendiente',

      llamadaContactos:
        registro.llamadaContactos ||
        'Pendiente'
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
    }
  };
}

/**
 * Calcula indicadores generales de caminantes.
 */
function obtenerIndicadoresCaminantes(
  caminantes
) {
  const configuracion =
    obtenerConfiguraciones();

  const meta = convertirNumero(
    configuracion.metaCaminantes,
    0
  );

  const total = caminantes.length;

  return {
    total: total,

    meta: meta,

    cuposDisponibles:
      Math.max(meta - total, 0),

    porcentajeMeta:
      calcularPorcentaje(
        total,
        meta
      ),

    pagos:
      contarEstados(
        caminantes,
        function(item) {
          return item.estadoPago;
        }
      ),

    cartas:
      contarEstados(
        caminantes,
        function(item) {
          return item.entregables.carta;
        }
      ),

    fotos:
      contarEstados(
        caminantes,
        function(item) {
          return item.entregables.foto;
        }
      ),

    sinMesa:
      caminantes.filter(function(item) {
        return !String(item.mesa).trim();
      }).length,

    sinHabitacion:
      caminantes.filter(function(item) {
        return !String(
          item.habitacion
        ).trim();
      }).length
  };
}

/**
 * Prueba local.
 */
function probarCaminantes() {
  const caminantes =
    obtenerCaminantes({});

  const resultado = {
    items: caminantes,
    indicadores:
      obtenerIndicadoresCaminantes(
        caminantes
      )
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );
}