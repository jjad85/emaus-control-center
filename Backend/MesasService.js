/**
 * ============================================================
 * MESAS SERVICE
 * ============================================================
 *
 * Las mesas se construyen dinámicamente usando:
 * - Configuraciones
 * - Servidores
 * - Caminantes
 *
 * No se lee la hoja visual "Mesas", porque contiene
 * celdas combinadas y sirve únicamente como vista humana.
 */

/**
 * Obtiene todas las mesas del retiro.
 */
function obtenerMesas() {
  const configuracion =
    obtenerConfiguraciones();

  const numeroMesas =
    convertirNumero(
      configuracion.numeroMesas,
      10
    );

  const capacidadPorMesa =
    convertirNumero(
      configuracion.caminantesPorMesa,
      6
    );

  const servidores =
    obtenerServidores({}).filter(
      function(servidor) {
        return String(servidor.mesa || '').trim() !== '';
      }
    );

  const caminantes =
    obtenerCaminantes({});

  const mesas = [];

  for (
    let numeroMesa = 1;
    numeroMesa <= numeroMesas;
    numeroMesa += 1
  ) {
    mesas.push(
      construirDetalleMesa(
        numeroMesa,
        capacidadPorMesa,
        servidores,
        caminantes
      )
    );
  }

  return mesas;
}

/**
 * Obtiene una mesa por número.
 */
function obtenerMesaPorNumero(
  numeroMesa
) {
  const mesa =
    obtenerMesas().find(
      function(item) {
        return (
          Number(item.numero) ===
          Number(numeroMesa)
        );
      }
    );

  if (!mesa) {
    throw crearErrorAplicacion(
      'MESA_NO_ENCONTRADA',
      'No existe la mesa ' +
        numeroMesa +
        '.'
    );
  }

  return mesa;
}

/**
 * Construye la información consolidada
 * de una mesa.
 */
function construirDetalleMesa(
  numeroMesa,
  capacidad,
  servidores,
  caminantes
) {
  const servidoresMesa =
    servidores.filter(
      function(servidor) {
        return (
          Number(servidor.mesa) ===
          Number(numeroMesa)
        );
      }
    );

  const caminantesMesa =
    caminantes.filter(
      function(caminante) {
        return (
          Number(caminante.mesa) ===
          Number(numeroMesa)
        );
      }
    );

  const lider =
    servidoresMesa.find(
      function(servidor) {
        return (
          normalizarTexto(
            servidor.rolMesa || servidor.rol
          ) === 'lider'
        );
      }
    ) || null;

  const colider =
    servidoresMesa.find(
      function(servidor) {
        return (
          normalizarTexto(
            servidor.rolMesa || servidor.rol
          ) === 'colider'
        );
      }
    ) || null;

  const cartas =
    contarEstados(
      caminantesMesa,
      function(caminante) {
        return (
          caminante.entregables.carta
        );
      }
    );

  const fotos =
    contarEstados(
      caminantesMesa,
      function(caminante) {
        return (
          caminante.entregables.foto
        );
      }
    );

  const cartasEntregadas =
    contarEstadosCompletados(
      cartas
    );

  const fotosEntregadas =
    contarEstadosCompletados(
      fotos
    );

  return {
    numero: numeroMesa,

    lider:
      lider
        ? resumirServidor(lider)
        : null,

    colider:
      colider
        ? resumirServidor(colider)
        : null,

    capacidad: capacidad,

    cantidadCaminantes:
      caminantesMesa.length,

    cuposDisponibles:
      Math.max(
        capacidad -
          caminantesMesa.length,
        0
      ),

    porcentajeOcupacion:
      calcularPorcentaje(
        caminantesMesa.length,
        capacidad
      ),

    excedida:
      caminantesMesa.length >
      capacidad,

    cartas: {
      estados: cartas,

      porcentajeCumplimiento:
        calcularPorcentaje(
          cartasEntregadas,
          caminantesMesa.length
        )
    },

    fotos: {
      estados: fotos,

      porcentajeCumplimiento:
        calcularPorcentaje(
          fotosEntregadas,
          caminantesMesa.length
        )
    },

    caminantes:
      caminantesMesa
  };
}

/**
 * Cuenta estados considerados terminados.
 */
function contarEstadosCompletados(
  estados
) {
  return (
    Number(
      estados.entregada || 0
    ) +
    Number(
      estados['entregada a logistica'] || 0
    ) +
    Number(
      estados.entregado || 0
    ) +
    Number(
      estados.recibida || 0
    ) +
    Number(
      estados.recibido || 0
    ) +
    Number(
      estados.completado || 0
    ) +
    Number(
      estados.aprobado || 0
    )
  );
}

/**
 * Calcula indicadores generales
 * de las mesas.
 */
function obtenerIndicadoresMesas(
  mesas
) {
  return {
    total: mesas.length,

    completas:
      mesas.filter(
        function(mesa) {
          return (
            mesa.cantidadCaminantes ===
            mesa.capacidad
          );
        }
      ).length,

    incompletas:
      mesas.filter(
        function(mesa) {
          return (
            mesa.cantidadCaminantes <
            mesa.capacidad
          );
        }
      ).length,

    excedidas:
      mesas.filter(
        function(mesa) {
          return mesa.excedida;
        }
      ).length,

    sinLider:
      mesas.filter(
        function(mesa) {
          return !mesa.lider;
        }
      ).length,

    sinColider:
      mesas.filter(
        function(mesa) {
          return !mesa.colider;
        }
      ).length,

    cuposDisponibles:
      mesas.reduce(
        function(total, mesa) {
          return (
            total +
            mesa.cuposDisponibles
          );
        },
        0
      )
  };
}

/**
 * Prueba local.
 */
function probarMesas() {
  const mesas =
    obtenerMesas();

  const resultado = {
    items: mesas,
    indicadores:
      obtenerIndicadoresMesas(
        mesas
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

/**
 * Compara el parámetro numeroMesas con las asignaciones existentes.
 *
 * Las mesas son dinámicas y se construyen desde Configuraciones.
 * Por eso no se eliminan registros de una hoja de Mesas:
 * se detectan personas asignadas a números superiores al límite.
 */
function obtenerEstadoSincronizacionMesas() {
  const configuracion =
    obtenerConfiguraciones();

  const numeroMesas =
    convertirNumero(
      configuracion.numeroMesas,
      10
    );

  const servidores =
    obtenerServidores({});

  const caminantes =
    obtenerCaminantes({});

  const asignacionesExtras = {};

  function agregarAsignacion(
    persona,
    tipoPersona
  ) {
    const numero =
      Number(persona.mesa);

    if (
      !Number.isFinite(numero) ||
      numero <= numeroMesas
    ) {
      return;
    }

    if (!asignacionesExtras[numero]) {
      asignacionesExtras[numero] = {
        numero: numero,
        servidores: [],
        caminantes: [],
        cantidadServidores: 0,
        cantidadCaminantes: 0,
        cantidadPersonas: 0
      };
    }

    const resumen = {
      id: persona.id || '',
      nombre: persona.nombre || '',
      tipoPersona: tipoPersona,
      rol:
        persona.rolMesa ||
        persona.rolEquipo ||
        persona.rol ||
        '',
      fotoPerfilUrl:
        persona.fotoPerfilUrl || ''
    };

    if (tipoPersona === 'Servidor') {
      asignacionesExtras[numero]
        .servidores.push(resumen);
      asignacionesExtras[numero]
        .cantidadServidores += 1;
    } else {
      asignacionesExtras[numero]
        .caminantes.push(resumen);
      asignacionesExtras[numero]
        .cantidadCaminantes += 1;
    }

    asignacionesExtras[numero]
      .cantidadPersonas += 1;
  }

  servidores.forEach(function(servidor) {
    agregarAsignacion(
      servidor,
      'Servidor'
    );
  });

  caminantes.forEach(function(caminante) {
    agregarAsignacion(
      caminante,
      'Caminante'
    );
  });

  const mesasFueraDeRango =
    Object.keys(asignacionesExtras)
      .map(function(numero) {
        return asignacionesExtras[
          numero
        ];
      })
      .sort(function(a, b) {
        return a.numero - b.numero;
      });

  const totalPersonasFueraDeRango =
    mesasFueraDeRango.reduce(
      function(total, mesa) {
        return (
          total +
          mesa.cantidadPersonas
        );
      },
      0
    );

  const numeroMaximoAsignado =
    servidores
      .concat(caminantes)
      .reduce(
        function(maximo, persona) {
          const numero =
            Number(persona.mesa);

          return Number.isFinite(numero)
            ? Math.max(maximo, numero)
            : maximo;
        },
        0
      );

  return {
    numeroMesasConfigurado:
      numeroMesas,

    numeroMaximoAsignado:
      numeroMaximoAsignado,

    sincronizada:
      mesasFueraDeRango.length === 0,

    requiereReubicacion:
      mesasFueraDeRango.length > 0,

    cantidadMesasFueraDeRango:
      mesasFueraDeRango.length,

    totalPersonasFueraDeRango:
      totalPersonasFueraDeRango,

    mesasFueraDeRango:
      mesasFueraDeRango,

    mensaje:
      mesasFueraDeRango.length
        ? 'Existen personas asignadas a mesas superiores al parámetro configurado.'
        : 'La configuración de mesas está sincronizada.'
  };
}


/**
 * Retorna los caminantes que todavía no tienen mesa.
 */

/**
 * Obtiene el listado completo de caminantes de una mesa para exportación.
 * La consulta está protegida por un permiso específico porque contiene
 * información personal, de salud, alimentación y contactos de emergencia.
 */
function obtenerExportacionCaminantesMesa(
  token,
  numeroMesa
) {
  validarPermiso(
    token,
    'MESAS_EXPORTAR_CAMINANTES'
  );

  const mesa =
    obtenerMesaPorNumero(
      numeroMesa
    );

  const caminantes =
    obtenerCaminantes({
      mesa: String(numeroMesa)
    })
      .map(function(caminante) {
        return {
          id: caminante.id || '',
          numeroInscripcion:
            caminante.numeroInscripcion || '',

          primerNombre:
            caminante.primerNombre || '',
          segundoNombre:
            caminante.segundoNombre || '',
          primerApellido:
            caminante.primerApellido || '',
          segundoApellido:
            caminante.segundoApellido || '',
          nombre:
            caminante.nombre || '',

          documentoIdentidad:
            caminante.documentoIdentidad || '',
          fechaNacimiento:
            caminante.fechaNacimiento || '',
          edad:
            caminante.edad ||
            calcularEdadAspirante(
              caminante.fechaNacimiento
            ) ||
            '',
          direccionResidencia:
            caminante.direccionResidencia || '',
          barrio:
            caminante.barrio || '',
          telefonoFijo:
            caminante.telefonoFijo || '',
          celular:
            caminante.telefono ||
            caminante.celular ||
            '',
          correo:
            caminante.correo || '',
          estadoCivil:
            caminante.estadoCivil || '',
          parroquia:
            caminante.parroquia || '',
          profesionOcupacion:
            caminante.profesionOcupacion || '',
          eps:
            caminante.eps || '',
          tallaCamiseta:
            caminante.tallaCamiseta || '',
          habitacion:
            caminante.habitacion || '',

          sufreEnfermedad:
            caminante.sufreEnfermedad || '',
          enfermedadCual:
            caminante.enfermedadCual || '',
          tomaMedicamento:
            caminante.tomaMedicamento || '',
          medicamentoCual:
            caminante.medicamentoCual || '',
          horariosMedicamentos:
            caminante.horariosMedicamentos || '',
          tieneLimitacionFisica:
            caminante.tieneLimitacionFisica || '',
          limitacionCual:
            caminante.limitacionCual || '',

          tieneCondicionAlimentaria:
            caminante.tieneCondicionAlimentaria || '',
          alergiasAlimentarias:
            caminante.alergiasAlimentarias ||
            caminante.alergias ||
            '',
          restriccionesAlimentarias:
            caminante.restriccionesAlimentarias || '',
          preferenciasAlimentarias:
            caminante.preferenciasAlimentarias || '',
          dietaEspecial:
            caminante.dietaEspecial || '',

          contacto1Nombre:
            caminante.contacto &&
            caminante.contacto.nombre
              ? caminante.contacto.nombre
              : '',
          contacto1Parentesco:
            caminante.contacto &&
            caminante.contacto.parentesco
              ? caminante.contacto.parentesco
              : '',
          contacto1Celular:
            caminante.contacto &&
            caminante.contacto.telefono
              ? caminante.contacto.telefono
              : '',

          contacto2Nombre:
            caminante.contactoAlterno &&
            caminante.contactoAlterno.nombre
              ? caminante.contactoAlterno.nombre
              : '',
          contacto2Parentesco:
            caminante.contactoAlterno &&
            caminante.contactoAlterno.parentesco
              ? caminante.contactoAlterno.parentesco
              : '',
          contacto2Celular:
            caminante.contactoAlterno &&
            caminante.contactoAlterno.telefono
              ? caminante.contactoAlterno.telefono
              : '',

          sacramentosRecibidos:
            caminante.sacramentosRecibidos || '',
          comoSeEntero:
            caminante.comoSeEntero || '',
          nombrePersonaInvito:
            caminante.nombrePersonaInvito || '',
          celularPersonaInvito:
            caminante.celularPersonaInvito || '',
          personaConocidaAsistira:
            caminante.personaConocidaAsistira || '',
          nombrePersonaConocida:
            caminante.nombrePersonaConocida || ''
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
    numeroMesa: mesa.numero,
    lider: mesa.lider || null,
    colider: mesa.colider || null,
    cantidadCaminantes:
      caminantes.length,
    caminantes: caminantes
  };
}


function obtenerCandidatosMesaCaminantes(
  token,
  numeroMesa
) {
  validarPermiso(
    token,
    'ASIGNAR_MESA'
  );

  const mesa =
    obtenerMesaPorNumero(
      numeroMesa
    );

  const candidatos =
    obtenerCaminantes({})
      .filter(function(caminante) {
        return !String(
          caminante.mesa || ''
        ).trim();
      })
      .map(function(caminante) {
        return {
          id: caminante.id || '',
          nombre:
            caminante.nombre || '',
          edad:
            Number(caminante.edad || calcularEdadAspirante(caminante.fechaNacimiento) || 0),
          habitacion:
            caminante.habitacion || '',
          estadoPago:
            caminante.estadoPago ||
            'Pendiente',
          entregables:
            caminante.entregables || {}
        };
      })
      .sort(function(a, b) {
        const edadA = Number(a.edad || 999);
        const edadB = Number(b.edad || 999);
        if (edadA !== edadB) return edadA - edadB;
        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
      });

  return {
    mesa: mesa,
    cuposDisponibles:
      mesa.cuposDisponibles,
    candidatos: candidatos
  };
}

/**
 * Asigna varios caminantes a una mesa.
 *
 * Las asignaciones continúan almacenándose
 * en Caminantes.mesa.
 */
function asignarCaminantesMesa(
  token,
  numeroMesa,
  caminanteIds
) {
  const sesion =
    validarPermiso(
      token,
      'ASIGNAR_MESA'
    );

  const ids =
    Array.isArray(caminanteIds)
      ? Array.from(
          new Set(
            caminanteIds
              .map(String)
              .filter(Boolean)
          )
        )
      : [];

  if (!ids.length) {
    throw crearErrorAplicacion(
      'CAMINANTES_REQUERIDOS',
      'Seleccione al menos un caminante.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      const mesa =
        obtenerMesaPorNumero(
          numeroMesa
        );

      if (
        ids.length >
        mesa.cuposDisponibles
      ) {
        throw crearErrorAplicacion(
          'CAPACIDAD_MESA_SUPERADA',
          'La mesa solo tiene ' +
            mesa.cuposDisponibles +
            ' cupo(s) disponible(s).'
        );
      }

      const caminantes =
        obtenerCaminantes({});

      const seleccionados =
        caminantes.filter(
          function(caminante) {
            return ids.indexOf(
              String(caminante.id)
            ) >= 0;
          }
        );

      if (
        seleccionados.length !==
        ids.length
      ) {
        throw crearErrorAplicacion(
          'CAMINANTE_NO_ENCONTRADO',
          'Uno o más caminantes seleccionados no existen.'
        );
      }

      const yaAsignados =
        seleccionados.filter(
          function(caminante) {
            return String(
              caminante.mesa || ''
            ).trim();
          }
        );

      if (yaAsignados.length) {
        throw crearErrorAplicacion(
          'CAMINANTE_CON_MESA',
          'Los siguientes caminantes ya tienen mesa: ' +
            yaAsignados
              .map(function(item) {
                return item.nombre;
              })
              .join(', ')
        );
      }

      seleccionados.forEach(
        function(caminante) {
          actualizarRegistroSheet(
            HOJAS.CAMINANTES,
            caminante.id,
            {
              mesa:
                String(numeroMesa),
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
      );

      if (
        typeof registrarAuditoria ===
        'function'
      ) {
        registrarAuditoria({
          usuario:
            sesion.usuario || '',
          nombre:
            sesion.nombre || '',
          accion:
            'ASIGNAR_CAMINANTES_MESA',
          entidad: 'Mesas',
          idRegistro:
            String(numeroMesa),
          detalle:
            seleccionados
              .map(function(item) {
                return item.nombre;
              })
              .join(', ')
        });
      }

      return obtenerMesaPorNumero(
        numeroMesa
      );
    }
  );
}

/**
 * Libera todas las personas de una mesa que
 * quedó por encima del parámetro numeroMesas.
 *
 * No elimina personas ni otros datos.
 */
function liberarMesaFueraDeRango(
  token,
  numeroMesa
) {
  const sesion =
    validarPermiso(
      token,
      'ASIGNAR_MESA'
    );

  const configuracion =
    obtenerConfiguraciones();

  const numeroMesas =
    convertirNumero(
      configuracion.numeroMesas,
      10
    );

  const numero =
    Number(numeroMesa);

  if (
    !Number.isFinite(numero) ||
    numero <= numeroMesas
  ) {
    throw crearErrorAplicacion(
      'MESA_NO_ES_ADICIONAL',
      'Solo se pueden liberar desde esta acción las mesas superiores al parámetro configurado.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      const servidores =
        obtenerServidores({})
          .filter(function(servidor) {
            return (
              Number(servidor.mesa) ===
              numero
            );
          });

      const caminantes =
        obtenerCaminantes({})
          .filter(function(caminante) {
            return (
              Number(caminante.mesa) ===
              numero
            );
          });

      caminantes.forEach(
        function(caminante) {
          actualizarRegistroSheet(
            HOJAS.CAMINANTES,
            caminante.id,
            {
              mesa: '',
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
      );

      servidores.forEach(
        function(servidor) {
          const cambios = {
            mesa: '',
            rolMesa: '',
            fechaActualizacion:
              new Date(),
            actualizadoPor:
              sesion.usuario || ''
          };

          /*
           * El servidor conserva su equipo principal.
           * Si pertenece al equipo Mesa, se limpia el rol
           * específico porque ya no ocupa una mesa.
           */
          if (
            normalizarTexto(
              servidor.equipo
            ) === 'mesa'
          ) {
            cambios.rolEquipo = '';
            cambios.rol = '';
          }

          actualizarRegistroSheet(
            HOJAS.SERVIDORES,
            servidor.id,
            cambios,
            opcionesCrudServidores_(
              sesion.usuario
            )
          );
        }
      );

      if (
        typeof registrarAuditoria ===
        'function'
      ) {
        registrarAuditoria({
          usuario:
            sesion.usuario || '',
          nombre:
            sesion.nombre || '',
          accion:
            'LIBERAR_MESA_FUERA_RANGO',
          entidad: 'Mesas',
          idRegistro:
            String(numero),
          detalle:
            JSON.stringify({
              servidores:
                servidores.map(
                  function(item) {
                    return item.nombre;
                  }
                ),
              caminantes:
                caminantes.map(
                  function(item) {
                    return item.nombre;
                  }
                )
            })
        });
      }

      return {
        numeroMesa: numero,
        servidoresLiberados:
          servidores.length,
        caminantesLiberados:
          caminantes.length,
        totalLiberados:
          servidores.length +
          caminantes.length,
        sincronizacion:
          obtenerEstadoSincronizacionMesas()
      };
    }
  );
}


/**
 * Desasigna un caminante de una mesa.
 *
 * No modifica habitación, estado de pago, entregables
 * ni ningún otro dato del caminante.
 */
function desasignarCaminanteMesa(
  token,
  numeroMesa,
  caminanteId
) {
  const sesion =
    validarPermiso(
      token,
      'MESAS_DESASIGNAR_CAMINANTE'
    );

  const id =
    String(caminanteId || '').trim();

  if (!id) {
    throw crearErrorAplicacion(
      'CAMINANTE_REQUERIDO',
      'Debe indicar el caminante que desea desasignar.'
    );
  }

  return ejecutarCrudConBloqueo(
    function() {
      const caminante =
        leerRegistroPorIdSheet(
          HOJAS.CAMINANTES,
          id,
          {
            usuario:
              sesion.usuario || ''
          }
        );

      if (!caminante) {
        throw crearErrorAplicacion(
          'CAMINANTE_NO_ENCONTRADO',
          'No se encontró el caminante seleccionado.'
        );
      }

      const mesaActual =
        String(
          caminante.mesa || ''
        ).trim();

      if (!mesaActual) {
        throw crearErrorAplicacion(
          'CAMINANTE_SIN_MESA',
          'El caminante ya se encuentra sin mesa asignada.'
        );
      }

      if (
        String(mesaActual) !==
        String(numeroMesa)
      ) {
        throw crearErrorAplicacion(
          'MESA_CAMINANTE_CAMBIO',
          'La asignación cambió. Actualice la mesa e intente nuevamente.'
        );
      }

      actualizarRegistroSheet(
        HOJAS.CAMINANTES,
        id,
        {
          mesa: '',
          fechaActualizacion:
            new Date(),
          actualizadoPor:
            sesion.usuario || ''
        },
        opcionesCrudCaminante(
          sesion.usuario
        )
      );

      if (
        typeof registrarAuditoria ===
        'function'
      ) {
        registrarAuditoria({
          usuario:
            sesion.usuario || '',
          nombre:
            sesion.nombre || '',
          accion:
            'DESASIGNAR_CAMINANTE_MESA',
          entidad:
            'Mesas',
          idRegistro:
            String(numeroMesa),
          detalle:
            JSON.stringify({
              caminanteId: id,
              caminante:
                caminante.nombre || '',
              mesaAnterior:
                mesaActual
            })
        });
      }

      return obtenerMesaPorNumero(
        numeroMesa
      );
    }
  );
}
