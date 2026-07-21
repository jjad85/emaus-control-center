/**
 * ============================================================
 * SERVIDORES SERVICE
 * ============================================================
 * Consulta y gestión de servidores. Las asignaciones se guardan
 * sin eliminar físicamente información.
 */

function obtenerServidores(filtros) {
  const parametros = filtros || {};

  return leerHojaComoObjetos(HOJAS.SERVIDORES)
    .map(convertirServidor)
    .filter(function(servidor) {
      return (
        coincideTexto(servidor.nombre, parametros.nombre) &&
        coincideExacto(servidor.estadoPago, parametros.estadoPago) &&
        coincideExacto(servidor.equipo, parametros.equipo) &&
        coincideExacto(servidor.rolEquipo || servidor.rol, parametros.rol) &&
        coincideExacto(servidor.mesa, parametros.mesa) &&
        coincideExacto(servidor.habitacion, parametros.habitacion) &&
        coincideTema(servidor.temas, parametros.tema)
      );
    });
}


function obtenerMiCuentaServidor(token) {
  const sesion = obtenerSesion(token);
  const nombreSesion = normalizarTexto(sesion.nombre);
  const usuarioSesion = normalizarTexto(sesion.usuario);

  const coincidencias = obtenerServidores({}).filter(function(item) {
    return normalizarTexto(item.nombre) === nombreSesion ||
      normalizarTexto(item.correo) === usuarioSesion;
  });

  if (!coincidencias.length) {
    throw crearErrorAplicacion(
      'SERVIDOR_SESION_NO_ENCONTRADO',
      'No fue posible relacionar el usuario autenticado con un servidor.'
    );
  }

  if (coincidencias.length > 1) {
    throw crearErrorAplicacion(
      'SERVIDOR_SESION_AMBIGUO',
      'Existe más de un servidor relacionado con este usuario. Revise los nombres o correos registrados.'
    );
  }

  return coincidencias[0];
}

function obtenerServidorPorId(id) {
  const servidor = obtenerServidores({}).find(function(item) {
    return String(item.id) === String(id);
  });

  if (!servidor) {
    throw crearErrorAplicacion(
      'SERVIDOR_NO_ENCONTRADO',
      'No existe el servidor con ID ' + id + '.'
    );
  }

  return servidor;
}

function convertirServidor(registro) {
  const rolLegacy = registro.rol || '';
  const rolMesa = registro.rolMesa || (
    normalizarTexto(registro.equipo) === 'mesa' ? rolLegacy : ''
  );
  const rolEquipo = registro.rolEquipo || (
    normalizarTexto(registro.equipo) !== 'mesa' ? rolLegacy : ''
  );

  return {
    id: registro.id || '',
    nombre: registro.nombre || '',
    correo: registro.correo || '',
    celular: registro.celular || registro.telefono || '',
    contacto: registro.contacto || '',
    estadoPago: registro.estadoPago || 'Pendiente',
    equipo: registro.equipo || '',
    rol: rolEquipo || rolMesa || rolLegacy,
    rolEquipo: rolEquipo,
    mesa: registro.mesa || '',
    rolMesa: rolMesa,
    habitacion: registro.habitacion || '',
    temaId: registro.temaId || '',
    temas: separarTemas(registro.tema),
    activo: registro.activo === undefined || registro.activo === ''
      ? true
      : convertirBooleano(registro.activo)
  };
}

function obtenerIndicadoresServidores(servidores) {
  return {
    total: servidores.length,
    pagos: contarEstados(servidores, function(item) { return item.estadoPago; }),
    porEquipo: contarEstados(servidores, function(item) { return item.equipo; }),
    porRol: contarEstados(servidores, function(item) { return item.rolEquipo || item.rol; }),
    conTema: servidores.filter(function(item) { return item.temas.length > 0; }).length,
    sinTema: servidores.filter(function(item) { return item.temas.length === 0; }).length,
    sinHabitacion: servidores.filter(function(item) {
      return !String(item.habitacion).trim();
    }).length
  };
}

function resumirServidor(servidor) {
  return {
    id: servidor.id || '',
    nombre: servidor.nombre || '',
    celular: servidor.celular || '',
    rol: servidor.rol || '',
    rolMesa: servidor.rolMesa || '',
    rolEquipo: servidor.rolEquipo || '',
    estadoPago: servidor.estadoPago || 'Pendiente',
    temas: servidor.temas || [],
    mesa: servidor.mesa || '',
    equipo: servidor.equipo || '',
    habitacion: servidor.habitacion || ''
  };
}

function obtenerOpcionesGestionServidor(token, servidorId) {
  validarPermisoEdicionServidor_(token);
  const servidor = servidorId ? obtenerServidorPorId(servidorId) : null;

  return {
    estadosPago: ['Pendiente', 'Pago Parcial', 'Pago Total'],
    temas: obtenerTemasDisponiblesServidor_(servidorId),
    mesas: obtenerMesasDisponiblesServidor_(servidor),
    equipos: obtenerEquiposDisponiblesServidor_(servidor),
    habitaciones: obtenerHabitacionesDisponiblesServidor_(servidor)
  };
}

function editarServidor(token, id, datos) {
  const sesion = validarPermiso(token, 'EDITAR_SERVIDOR');
  const entrada = datos || {};
  const nombre = String(entrada.nombre || '').trim();

  if (!nombre) {
    throw crearErrorAplicacion('NOMBRE_SERVIDOR_REQUERIDO', 'El nombre es obligatorio.');
  }

  return ejecutarCrudConBloqueo(function() {
    const actualizado = actualizarRegistroSheet(
      HOJAS.SERVIDORES,
      id,
      {
        nombre: nombre,
        correo: String(entrada.correo || '').trim(),
        celular: String(entrada.celular || '').trim(),
        contacto: String(entrada.contacto || '').trim()
      },
      opcionesCrudServidores_(sesion.usuario)
    );

    auditarServidor_(sesion, 'EDITAR_SERVIDOR', id, actualizado);
    return convertirServidor(actualizado);
  });
}

function actualizarPagoServidor(token, id, estadoPago) {
  const sesion = validarPermiso(token, 'ACTUALIZAR_PAGO_SERVIDOR');
  const estado = String(estadoPago || '').trim();
  const permitidos = ['Pendiente', 'Pago Parcial', 'Pago Total'];

  if (!permitidos.some(function(item) { return normalizarTexto(item) === normalizarTexto(estado); })) {
    throw crearErrorAplicacion('ESTADO_PAGO_INVALIDO', 'El estado de pago no es válido.');
  }

  return actualizarServidorConAuditoria_(sesion, id, { estadoPago: estado }, 'ACTUALIZAR_PAGO_SERVIDOR');
}

function asignarTemaServidor(token, id, temaId) {
  const sesion = validarPermiso(token, 'EDITAR_SERVIDOR');
  const nuevoTemaId = String(temaId || '').trim();

  return ejecutarCrudConBloqueo(function() {
    // Se vuelve a leer el servidor dentro del bloqueo para trabajar siempre
    // con la información más reciente y no reemplazar temas ya asignados.
    const servidorActual = obtenerServidorPorId(id);
    const temas = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(sesion.usuario));

    // Un valor vacío libera explícitamente todos los temas del servidor.
    if (!nuevoTemaId) {
      temas.forEach(function(tema) {
        if (String(tema.servidorId || '') === String(id)) {
          actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {
            servidorId: '',
            servidorNombre: ''
          }, opcionesCrudTemas(sesion.usuario));
        }
      });

      const liberado = actualizarRegistroSheet(HOJAS.SERVIDORES, id, {
        temaId: '',
        tema: ''
      }, opcionesCrudServidores_(sesion.usuario));

      auditarServidor_(sesion, 'LIBERAR_TEMAS_SERVIDOR', id, liberado);
      return convertirServidor(liberado);
    }

    const temaSeleccionado = temas.find(function(item) {
      return String(item.id) === nuevoTemaId;
    });
    const activo = temaSeleccionado && (
      temaSeleccionado.activo === undefined || temaSeleccionado.activo === ''
        ? true
        : convertirBooleano(temaSeleccionado.activo)
    );

    if (!temaSeleccionado || !activo) {
      throw crearErrorAplicacion('TEMA_NO_DISPONIBLE', 'El tema seleccionado no está disponible.');
    }

    if (
      String(temaSeleccionado.servidorId || '').trim() &&
      String(temaSeleccionado.servidorId) !== String(id)
    ) {
      throw crearErrorAplicacion('TEMA_YA_ASIGNADO', 'El tema ya está asignado a otro servidor.');
    }

    // Asigna únicamente el tema seleccionado. No se liberan ni se modifican
    // los demás temas que ya pertenecen al servidor.
    actualizarRegistroSheet(HOJAS.TEMAS, nuevoTemaId, {
      servidorId: String(id),
      servidorNombre: servidorActual.nombre
    }, opcionesCrudTemas(sesion.usuario));

    // Se consolidan tres fuentes para conservar también asignaciones antiguas:
    // 1. IDs guardados en la fila del servidor.
    // 2. Temas vinculados al servidor en la hoja Temas.
    // 3. El nuevo tema seleccionado.
    const idsTemas = separarIdsTemasServidor_(servidorActual.temaId);

    temas.forEach(function(tema) {
      if (String(tema.servidorId || '') === String(id)) {
        agregarValorUnico_(idsTemas, tema.id);
      }
    });
    agregarValorUnico_(idsTemas, nuevoTemaId);

    const nombresTemas = [];

    idsTemas.forEach(function(idTema) {
      const tema = temas.find(function(item) {
        return String(item.id) === String(idTema);
      });

      if (tema) {
        agregarValorUnico_(nombresTemas, tema.nombre || tema.titulo);
      }
    });

    // Compatibilidad con registros anteriores que tenían nombres guardados,
    // pero no contaban todavía con la relación completa en la hoja Temas.
    (servidorActual.temas || []).forEach(function(nombre) {
      agregarValorUnico_(nombresTemas, nombre);
    });
    agregarValorUnico_(nombresTemas, temaSeleccionado.nombre || temaSeleccionado.titulo);

    const actualizado = actualizarRegistroSheet(HOJAS.SERVIDORES, id, {
      temaId: idsTemas.join(' | '),
      tema: nombresTemas.join(' | ')
    }, opcionesCrudServidores_(sesion.usuario));

    auditarServidor_(sesion, 'ASIGNAR_TEMA_SERVIDOR', id, actualizado);
    return convertirServidor(actualizado);
  });
}

function separarIdsTemasServidor_(valor) {
  if (!valor) return [];

  return String(valor)
    .split(/[|,;\n]/)
    .map(function(item) { return String(item || '').trim(); })
    .filter(Boolean)
    .filter(function(item, index, lista) {
      return lista.indexOf(item) === index;
    });
}

function agregarValorUnico_(lista, valor) {
  const texto = String(valor || '').trim();
  if (texto && lista.indexOf(texto) === -1) {
    lista.push(texto);
  }
}

/**
 * Asigna al servidor a una mesa o a un equipo.
 *
 * Compatibilidad:
 * - llamadas anteriores pueden enviar solo mesa y rolMesa;
 * - las llamadas nuevas envían tipoAsignacion y equipo.
 */
function asignarMesaServidor(token, id, mesa, rolMesa, tipoAsignacion, equipo) {
  const sesion = validarPermiso(token, 'EDITAR_SERVIDOR');
  const servidor = obtenerServidorPorId(id);
  const tipo = normalizarTexto(tipoAsignacion || (String(mesa || '').trim() ? 'Mesa' : (String(equipo || '').trim() ? 'Equipo' : '')));
  const rol = String(rolMesa || '').trim();
  const rolNormalizado = normalizarTexto(rol);

  if (!tipo) {
    return actualizarServidorConAuditoria_(sesion, id, {
      mesa: '',
      rolMesa: '',
      equipo: '',
      rolEquipo: '',
      rol: ''
    }, 'QUITAR_MESA_EQUIPO_SERVIDOR');
  }

  if (tipo === 'mesa') {
    const numeroMesa = String(mesa || '').trim();

    if (!numeroMesa) {
      throw crearErrorAplicacion('MESA_REQUERIDA', 'Seleccione una mesa.');
    }

    if (!['lider', 'colider'].includes(rolNormalizado)) {
      throw crearErrorAplicacion(
        'ROL_MESA_INVALIDO',
        'En una mesa el servidor solo puede ser Líder o Colíder.'
      );
    }

    const disponible = obtenerMesasDisponiblesServidor_(servidor).some(function(item) {
      return String(item.numero) === numeroMesa && item.rolesDisponibles.some(function(itemRol) {
        return normalizarTexto(itemRol) === rolNormalizado;
      });
    });

    if (!disponible) {
      throw crearErrorAplicacion(
        'MESA_ROL_NO_DISPONIBLE',
        'La mesa o el rol seleccionado ya no está disponible.'
      );
    }

    return actualizarServidorConAuditoria_(sesion, id, {
      mesa: numeroMesa,
      rolMesa: rol,
      equipo: 'Mesa',
      rolEquipo: rol,
      rol: rol
    }, 'ASIGNAR_MESA_SERVIDOR');
  }

  if (tipo === 'equipo') {
    const nombreEquipo = String(equipo || '').trim();

    if (!nombreEquipo) {
      throw crearErrorAplicacion('EQUIPO_REQUERIDO', 'Seleccione un equipo.');
    }

    const opcion = obtenerEquiposDisponiblesServidor_(servidor).find(function(item) {
      return normalizarTexto(item.nombre) === normalizarTexto(nombreEquipo);
    });

    if (!opcion || !opcion.rolesDisponibles.some(function(itemRol) {
      return normalizarTexto(itemRol) === rolNormalizado;
    })) {
      throw crearErrorAplicacion(
        'EQUIPO_ROL_NO_DISPONIBLE',
        'El equipo o el rol seleccionado ya no está disponible.'
      );
    }

    return actualizarServidorConAuditoria_(sesion, id, {
      mesa: '',
      rolMesa: '',
      equipo: nombreEquipo,
      rolEquipo: rol,
      rol: rol
    }, 'ASIGNAR_EQUIPO_SERVIDOR');
  }

  throw crearErrorAplicacion('TIPO_ASIGNACION_INVALIDO', 'El tipo de asignación no es válido.');
}

/**
 * Compatibilidad con versiones anteriores del frontend.
 */
function asignarEquipoServidor(token, id, equipo, rolEquipo) {
  return asignarMesaServidor(token, id, '', rolEquipo, 'Equipo', equipo);
}

function asignarHabitacionServidor(token, id, habitacion) {
  const sesion = validarPermiso(token, 'EDITAR_SERVIDOR');
  const numero = String(habitacion || '').trim();

  if (numero) {
    const disponible = obtenerHabitacionesDisponiblesServidor_(obtenerServidorPorId(id)).some(function(item) {
      return String(item.habitacion) === numero;
    });
    if (!disponible) {
      throw crearErrorAplicacion('HABITACION_NO_DISPONIBLE', 'La habitación seleccionada ya no está disponible.');
    }
  }

  return actualizarServidorConAuditoria_(sesion, id, { habitacion: numero }, 'ASIGNAR_HABITACION_SERVIDOR');
}

function obtenerTemasDisponiblesServidor_(servidorId) {
  return listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .filter(function(item) {
      const activo = item.activo === undefined || item.activo === ''
        ? true
        : convertirBooleano(item.activo);

      return activo && (
        !String(item.servidorId || '').trim() ||
        String(item.servidorId) === String(servidorId || '')
      );
    })
    .map(convertirTema)
    .sort(function(a, b) {
      return String(a.nombre).localeCompare(String(b.nombre), 'es');
    });
}

function obtenerMesasDisponiblesServidor_(servidor) {
  return obtenerMesas().map(function(mesa) {
    const roles = [];

    if (!mesa.lider || (servidor && String(mesa.lider.id) === String(servidor.id))) {
      roles.push('Líder');
    }

    if (!mesa.colider || (servidor && String(mesa.colider.id) === String(servidor.id))) {
      roles.push('Colíder');
    }

    return {
      numero: mesa.numero,
      rolesDisponibles: roles
    };
  }).filter(function(mesa) {
    return mesa.rolesDisponibles.length > 0;
  });
}

function obtenerEquiposDisponiblesServidor_(servidor) {
  const configuracion = obtenerConfiguraciones();
  const configurados = normalizarListaEquiposConfiguracion_(
    configuracion.equiposServidores || configuracion.equipos || []
  );

  const existentes = obtenerServidores({}).map(function(item) {
    return String(item.equipo || '').trim();
  }).filter(function(nombre) {
    const normalizado = normalizarTexto(nombre);
    return nombre && normalizado !== 'mesa' && normalizado !== 'sin equipo';
  });

  const nombres = ['Dirección'].concat(configurados, existentes).filter(function(nombre, indice, lista) {
    return lista.findIndex(function(item) {
      return normalizarTexto(item) === normalizarTexto(nombre);
    }) === indice;
  });

  const servidores = obtenerServidores({});

  return nombres.map(function(nombre) {
    const integrantes = servidores.filter(function(item) {
      return normalizarTexto(item.equipo) === normalizarTexto(nombre);
    });

    const lider = integrantes.find(function(item) {
      return normalizarTexto(item.rolEquipo || item.rol) === 'lider';
    });

    const colider = integrantes.find(function(item) {
      return normalizarTexto(item.rolEquipo || item.rol) === 'colider';
    });

    const esDireccion = normalizarTexto(nombre) === 'direccion' ||
      normalizarTexto(nombre) === 'equipo de direccion';
    const roles = [];

    if (!lider || (servidor && String(lider.id) === String(servidor.id))) {
      roles.push('Líder');
    }

    if (esDireccion) {
      if (!colider || (servidor && String(colider.id) === String(servidor.id))) {
        roles.push('Colíder');
      }
    } else {
      roles.push('Equipo');
    }

    return {
      nombre: nombre,
      rolesDisponibles: roles
    };
  }).filter(function(equipo) {
    return equipo.rolesDisponibles.length > 0;
  }).sort(function(a, b) {
    return String(a.nombre).localeCompare(String(b.nombre), 'es');
  });
}

function normalizarListaEquiposConfiguracion_(valor) {
  if (Array.isArray(valor)) {
    return valor.map(function(item) { return String(item || '').trim(); }).filter(Boolean);
  }

  const texto = String(valor || '').trim();
  if (!texto) return [];

  try {
    const json = JSON.parse(texto);
    if (Array.isArray(json)) {
      return json.map(function(item) { return String(item || '').trim(); }).filter(Boolean);
    }
  } catch (error) {
    // Si no es JSON, se interpreta como lista separada por coma o punto y coma.
  }

  return texto.split(/[;,\n]/).map(function(item) {
    return String(item || '').trim();
  }).filter(Boolean);
}

function obtenerHabitacionesDisponiblesServidor_(servidor) {
  return obtenerHabitaciones().filter(function(item) {
    return !item.asignada || (
      servidor && item.persona && item.persona.tipoPersona === 'Servidor' &&
      String(item.persona.id) === String(servidor.id)
    );
  }).map(function(item) {
    return { habitacion: item.habitacion, piso: item.piso || '', tipo: item.tipo || '' };
  });
}

function validarPermisoEdicionServidor_(token) {
  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);
  if (!permisos.includes('EDITAR_SERVIDOR') && !permisos.includes('ACTUALIZAR_PAGO_SERVIDOR')) {
    throw crearErrorAplicacion('PERMISO_DENEGADO', 'No tiene permisos para gestionar servidores.');
  }
  return sesion;
}

function actualizarServidorConAuditoria_(sesion, id, cambios, accion) {
  return ejecutarCrudConBloqueo(function() {
    const actualizado = actualizarRegistroSheet(
      HOJAS.SERVIDORES,
      id,
      cambios,
      opcionesCrudServidores_(sesion.usuario)
    );
    auditarServidor_(sesion, accion, id, actualizado);
    return convertirServidor(actualizado);
  });
}

function opcionesCrudServidores_(usuario) {
  return {
    campoId: 'id',
    campoActivo: 'activo',
    campoFechaRegistro: 'fechaRegistro',
    campoFechaActualizacion: 'fechaActualizacion',
    campoActualizadoPor: 'actualizadoPor',
    usuario: usuario || '',
    valorActivo: 'Sí',
    valorInactivo: 'No'
  };
}

function auditarServidor_(sesion, accion, id, detalle) {
  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: accion,
    entidad: 'Servidores',
    idRegistro: id,
    detalle: JSON.stringify(detalle || {})
  });
}

function probarServidores() {
  const servidores = obtenerServidores({});
  console.log(JSON.stringify({
    items: servidores,
    indicadores: obtenerIndicadoresServidores(servidores)
  }, null, 2));
}
