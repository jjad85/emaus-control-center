/**
 * Direcciona las solicitudes HTTP.
 */
function routeRequest(parametros) {
  const recurso = obtenerRecursoSolicitud(
    parametros
  );

  switch (recurso) {
    case 'diagnostico':
      return {
        datos: {
          api: 'EMAUS_CONTROL_CENTER',
          versionBackend: '2026.07.17-ASPIRANTES-01',
          recursoRecibido:
            parametros.recurso ||
            parametros.resource ||
            parametros.ruta ||
            '',
          recursoNormalizado: recurso,
          rutaAspirantesActiva: true
        },
        mensaje:
          'Backend actualizado y operativo'
      };
    case 'portalpublico':
      return {
        datos:
          obtenerPortalPublico(),
        mensaje:
          'Portal público consultado correctamente'
      };

    case 'configuraciones':
      return {
        datos:
          obtenerConfiguraciones(),
        mensaje:
          'Configuraciones consultadas correctamente'
      };

    case 'aspirantes':
      return atenderAspirantes(
        parametros
      );

    case 'caminantes':
      return atenderCaminantes(
        parametros
      );

    case 'servidores':
      return atenderServidores(
        parametros
      );

    case 'mesas':
      return atenderMesas(
        parametros
      );

    case 'equipos':
      return atenderEquipos(
        parametros
      );

    case 'presentaciones':
      return atenderPresentaciones(
        parametros
      );

    case 'habitaciones':
      return atenderHabitaciones(
        parametros
      );

    case 'minutograma':
      return atenderMinutograma(
        parametros
      );

    case 'resumenminutograma':
      return {
        datos:
          obtenerResumenMinutograma(
            parametros
          ),
        mensaje:
          'Resumen del minutograma consultado correctamente'
      };

    case 'estadovivominutograma':
      return {
        datos:
          obtenerEstadoEnVivoMinutograma(
            parametros
          ),
        mensaje:
          'Estado en vivo consultado correctamente'
      };

    case 'dashboard':
      return {
        datos:
          obtenerDashboard(),
        mensaje:
          'Dashboard consultado correctamente'
      };

    default:
      throw crearErrorAplicacion(
        'RECURSO_NO_VALIDO',
        'El recurso solicitado no existe: ' +
          recurso
      );
  }
}


/**
 * Obtiene y normaliza el recurso solicitado.
 * Tolera nombres alternativos y valores con barras,
 * evitando errores por diferencias en la URL del frontend.
 */
function obtenerRecursoSolicitud(parametros) {
  const valores = parametros || {};

  const valorOriginal =
    valores.recurso ||
    valores.resource ||
    valores.ruta ||
    'dashboard';

  return normalizarTexto(valorOriginal)
    .replace(/^\/+|\/+$/g, '')
    .split('?')[0]
    .split('#')[0];
}


function atenderAspirantes(parametros) {
  if (parametros.id) {
    validarPermiso(
      parametros.token,
      'CONSULTAR_ASPIRANTES'
    );

    return {
      datos:
        obtenerAspirantePorId(
          parametros.id
        ),
      mensaje:
        'Aspirante consultado correctamente'
    };
  }

  const items =
    obtenerAspirantes(
      parametros.token,
      parametros
    );

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresAspirantes(
          items
        )
    },
    mensaje:
      'Aspirantes consultados correctamente',
    totalRegistros:
      items.length
  };
}

function atenderCaminantes(parametros) {
  if (parametros.id) {
    return {
      datos:
        obtenerCaminantePorId(
          parametros.id
        )
    };
  }

  const items =
    obtenerCaminantes(
      parametros
    );

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresCaminantes(
          items
        )
    },
    totalRegistros:
      items.length
  };
}

function atenderServidores(parametros) {
  if (parametros.id) {
    return {
      datos:
        obtenerServidorPorId(
          parametros.id
        )
    };
  }

  const items =
    obtenerServidores(
      parametros
    );

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresServidores(
          items
        )
    },
    totalRegistros:
      items.length
  };
}

function atenderMesas(parametros) {
  if (parametros.numero) {
    return {
      datos:
        obtenerMesaPorNumero(
          parametros.numero
        )
    };
  }

  const items =
    obtenerMesas();

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresMesas(
          items
        )
    },
    totalRegistros:
      items.length
  };
}

function atenderEquipos(parametros) {
  if (parametros.nombre) {
    return {
      datos:
        obtenerEquipoPorNombre(
          parametros.nombre
        )
    };
  }

  const items =
    obtenerEquipos();

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresEquipos(
          items
        )
    },
    totalRegistros:
      items.length
  };
}

function atenderPresentaciones(
  parametros
) {
  if (parametros.id) {
    return {
      datos:
        obtenerPresentacionPorId(
          parametros.id
        )
    };
  }

  const items =
    obtenerPresentaciones(
      parametros
    );

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresPresentaciones(
          items
        )
    },
    totalRegistros:
      items.length
  };
}

function atenderHabitaciones(
  parametros
) {
  if (parametros.id) {
    return {
      datos:
        obtenerHabitacionPorId(
          parametros.id
        )
    };
  }

  const items =
    obtenerHabitaciones();

  return {
    datos: {
      items: items,
      indicadores:
        obtenerIndicadoresHabitaciones(
          items
        )
    },
    totalRegistros:
      items.length
  };
}

function atenderMinutograma(parametros) {
  if (parametros.id) {
    return {
      datos:
        obtenerActividadMinutogramaPorId(
          parametros.id
        )
    };
  }

  const items =
    obtenerMinutograma(
      parametros
    );

  return {
    datos: {
      items: items,
      resumen:
        obtenerResumenMinutograma(
          parametros
        )
    },
    totalRegistros:
      items.length
  };
}
