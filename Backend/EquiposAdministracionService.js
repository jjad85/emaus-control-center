/**
 * ============================================================
 * ADMINISTRACIÓN DE EQUIPOS PRINCIPALES Y DE APOYO
 * ============================================================
 *
 * Modelo:
 * - Servidores.Equipo conserva el equipo principal.
 * - ServidorEquipos guarda las asignaciones de equipos de apoyo.
 * - Cada servidor debe tener exactamente un equipo principal.
 * - Cada servidor puede tener cero o varios equipos de apoyo.
 */

var HOJA_EQUIPOS_ADMINISTRABLES = 'Equipos';
var HOJA_SERVIDOR_EQUIPOS = 'ServidorEquipos';


function obtenerNombreVisibleEquipo_(equipo) {
  if (!equipo) return '';

  var nombre = String(equipo.nombre || '').trim();
  var normalizado = normalizarTexto(nombre);

  if (
    ['direccion', 'equipo direccion', 'equipo de direccion']
      .indexOf(normalizado) < 0
  ) {
    return nombre;
  }

  try {
    var configuracion = obtenerConfiguraciones() || {};
    var partes = [
      configuracion.anioRetiro,
      configuracion.tipoRetiro
    ].filter(function(valor) {
      return String(valor || '').trim();
    });

    return partes.length
      ? 'Dirección del Retiro ' + partes.join(' - ')
      : 'Dirección del Retiro';
  } catch (error) {
    return 'Dirección del Retiro';
  }
}

function completarNombreVisibleEquipo_(equipo) {
  return Object.assign({}, equipo, {
    nombreVisible: obtenerNombreVisibleEquipo_(equipo)
  });
}

function listarEquiposAdministrables(token) {
  obtenerSesion(token);

  var equipos = leerHojaAdministracionEquipos_();
  var asignaciones = leerAsignacionesEquiposApoyo_();
  var servidores = obtenerServidores({});

  return equipos
    .map(function(equipo) {
      var integrantes = [];

      if (normalizarTexto(equipo.tipo) === 'principal') {
        integrantes = servidores
          .filter(function(servidor) {
            return normalizarTexto(servidor.equipo) ===
              normalizarTexto(equipo.nombre);
          })
          .map(resumirServidorEquipoAdministrable_);
      } else {
        var ids = asignaciones
          .filter(function(asignacion) {
            return (
              String(asignacion.equipoId) === String(equipo.id) &&
              asignacion.activo
            );
          })
          .map(function(asignacion) {
            return String(asignacion.servidorId);
          });

        integrantes = servidores
          .filter(function(servidor) {
            return ids.indexOf(String(servidor.id)) >= 0;
          })
          .map(resumirServidorEquipoAdministrable_);
      }

      return completarNombreVisibleEquipo_(
        Object.assign({}, equipo, {
          integrantes: integrantes,
          cantidadIntegrantes: integrantes.length
        })
      );
    })
    .sort(function(a, b) {
      var tipoA = normalizarTexto(a.tipo) === 'principal' ? 0 : 1;
      var tipoB = normalizarTexto(b.tipo) === 'principal' ? 0 : 1;

      if (tipoA !== tipoB) {
        return tipoA - tipoB;
      }

      var ordenA = Number(a.orden) || 9999;
      var ordenB = Number(b.orden) || 9999;

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      return String(a.nombre || '').localeCompare(
        String(b.nombre || ''),
        'es'
      );
    });
}

function asegurarEstructuraHojaEquipos_() {
  var hoja = obtenerHojaAdministracionEquipos_();
  var requeridos = [
    'ID',
    'Nombre',
    'Tipo',
    'Descripción',
    'Orden',
    'Activo',
    'Fecha Registro',
    'Fecha Actualización',
    'Actualizado Por'
  ];

  var actuales = hoja.getLastColumn()
    ? hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0]
    : [];

  requeridos.forEach(function(encabezado) {
    var existe = actuales.some(function(actual) {
      return normalizarTexto(actual) === normalizarTexto(encabezado);
    });

    if (!existe) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(encabezado);
    }
  });

  hoja.getRange(1, 1, 1, hoja.getLastColumn()).setFontWeight('bold');
  return hoja;
}

function escribirFilaCompletaEquipo_(hoja, fila, valores) {
  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var filaActual = hoja
    .getRange(fila, 1, 1, hoja.getLastColumn())
    .getValues()[0];

  Object.keys(valores).forEach(function(clave) {
    var columna = encabezados.indexOf(clave);
    if (columna >= 0 && valores[clave] !== undefined) {
      filaActual[columna] = valores[clave];
    }
  });

  hoja.getRange(fila, 1, 1, filaActual.length).setValues([filaActual]);
}

function verificarEquipoGuardado_(id) {
  SpreadsheetApp.flush();

  var equipo = leerHojaAdministracionEquipos_().find(function(item) {
    return String(item.id) === String(id);
  });

  if (!equipo) {
    throw crearErrorAplicacion(
      'EQUIPO_NO_GUARDADO',
      'El equipo no quedó registrado en la hoja Equipos. Intente nuevamente.'
    );
  }

  return equipo;
}

function guardarEquipoAdministrable(token, datos) {
  var sesion = validarPermiso(token, 'EDITAR_EQUIPOS');
  var entrada = datos || {};
  var id = String(entrada.id || '').trim();
  var nombre = String(entrada.nombre || '').trim();
  var tipo = normalizarTipoEquipo_(entrada.tipo);
  var descripcion = String(entrada.descripcion || '').trim();
  var orden = Number(entrada.orden || 0);
  var activo = convertirBooleanoEquipo_(entrada.activo, true);

  if (!nombre) {
    throw crearErrorAplicacion(
      'NOMBRE_EQUIPO_REQUERIDO',
      'El nombre del equipo es obligatorio.'
    );
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var hoja = asegurarEstructuraHojaEquipos_();
    var existentes = leerHojaAdministracionEquipos_();
    var equipoAnterior = id
      ? existentes.find(function(item) {
          return String(item.id) === String(id);
        })
      : null;

    var duplicado = existentes.some(function(item) {
      return (
        String(item.id) !== id &&
        normalizarTexto(item.nombre) === normalizarTexto(nombre)
      );
    });

    if (duplicado) {
      throw crearErrorAplicacion(
        'EQUIPO_DUPLICADO',
        'Ya existe otro equipo con el mismo nombre.'
      );
    }

    if (id && !equipoAnterior) {
      throw crearErrorAplicacion(
        'EQUIPO_NO_ENCONTRADO',
        'No existe el equipo que intenta actualizar.'
      );
    }

    if (equipoAnterior) {
      validarCambioTipoEquipo_(equipoAnterior, tipo);
    }

    var ahora = new Date();
    var fila;

    if (id) {
      var encabezados = obtenerEncabezadosEquipo_(hoja);
      fila = buscarFilaPorIdEquipo_(hoja, encabezados, id);

      if (!fila) {
        throw crearErrorAplicacion(
          'EQUIPO_NO_ENCONTRADO',
          'No existe el equipo que intenta actualizar.'
        );
      }
    } else {
      id = generarIdEquipoAdministrable_();
      fila = Math.max(hoja.getLastRow() + 1, 2);
    }

    escribirFilaCompletaEquipo_(hoja, fila, {
      id: id,
      nombre: nombre,
      tipo: tipo,
      descripcion: descripcion,
      orden: orden,
      activo: activo ? 'Sí' : 'No',
      fechaRegistro: entrada.id ? undefined : ahora,
      fechaActualizacion: ahora,
      actualizadoPor: sesion.usuario || ''
    });

    if (
      equipoAnterior &&
      normalizarTexto(equipoAnterior.tipo) === 'principal' &&
      normalizarTexto(equipoAnterior.nombre) !== normalizarTexto(nombre)
    ) {
      actualizarNombreEquipoPrincipalEnServidores_(
        equipoAnterior.nombre,
        nombre,
        sesion.usuario || ''
      );
    }

    var guardado = verificarEquipoGuardado_(id);

    registrarAuditoriaEquipo_(
      sesion,
      entrada.id ? 'EDITAR_EQUIPO' : 'CREAR_EQUIPO',
      id,
      (equipoAnterior
        ? 'Antes: ' + equipoAnterior.nombre + ' · ' + equipoAnterior.tipo +
          ' | Después: '
        : '') +
        nombre + ' · ' + tipo
    );

    return guardado;
  } finally {
    lock.releaseLock();
  }
}

function validarCambioTipoEquipo_(equipoAnterior, nuevoTipo) {
  var tipoAnterior = normalizarTipoEquipo_(equipoAnterior.tipo);

  if (tipoAnterior === nuevoTipo) {
    return;
  }

  if (tipoAnterior === 'Principal' && nuevoTipo === 'Apoyo') {
    var servidoresAsignados = obtenerServidores({}).filter(
      function(servidor) {
        return normalizarTexto(servidor.equipo) ===
          normalizarTexto(equipoAnterior.nombre);
      }
    );

    if (servidoresAsignados.length > 0) {
      throw crearErrorAplicacion(
        'EQUIPO_PRINCIPAL_CON_ASIGNACIONES',
        'No puede convertir este equipo principal en equipo de apoyo porque tiene ' +
          servidoresAsignados.length +
          ' servidor(es) asignado(s). Primero reasígnelos a otro equipo principal.'
      );
    }
  }

  if (tipoAnterior === 'Apoyo' && nuevoTipo === 'Principal') {
    var asignacionesActivas = leerAsignacionesEquiposApoyo_().filter(
      function(asignacion) {
        return (
          String(asignacion.equipoId) === String(equipoAnterior.id) &&
          asignacion.activo
        );
      }
    );

    if (asignacionesActivas.length > 0) {
      throw crearErrorAplicacion(
        'EQUIPO_APOYO_CON_ASIGNACIONES',
        'No puede convertir este equipo de apoyo en principal porque tiene ' +
          asignacionesActivas.length +
          ' asignación(es) activa(s). Retire primero esas asignaciones.'
      );
    }
  }
}

function actualizarNombreEquipoPrincipalEnServidores_(
  nombreAnterior,
  nombreNuevo,
  usuario
) {
  var hoja = obtenerLibro().getSheetByName(HOJAS.SERVIDORES);

  if (!hoja || hoja.getLastRow() < 2) {
    return;
  }

  var encabezados = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(normalizarEncabezadoEquipo_);

  var columnaEquipo = encabezados.indexOf('equipo');
  var columnaFecha = encabezados.indexOf('fechaActualizacion');
  var columnaUsuario = encabezados.indexOf('actualizadoPor');

  if (columnaEquipo < 0) {
    return;
  }

  var cantidadFilas = hoja.getLastRow() - 1;
  var rango = hoja.getRange(
    2,
    1,
    cantidadFilas,
    hoja.getLastColumn()
  );
  var valores = rango.getValues();
  var cambio = false;
  var ahora = new Date();

  valores.forEach(function(fila) {
    if (
      normalizarTexto(fila[columnaEquipo]) ===
      normalizarTexto(nombreAnterior)
    ) {
      fila[columnaEquipo] = nombreNuevo;

      if (columnaFecha >= 0) {
        fila[columnaFecha] = ahora;
      }

      if (columnaUsuario >= 0) {
        fila[columnaUsuario] = usuario;
      }

      cambio = true;
    }
  });

  if (cambio) {
    rango.setValues(valores);
    SpreadsheetApp.flush();
  }
}

function cambiarEstadoEquipoAdministrable(token, equipoId, activo) {
  var sesion = validarPermiso(token, 'EDITAR_EQUIPOS');
  var equipos = leerHojaAdministracionEquipos_();
  var equipo = equipos.find(function(item) {
    return String(item.id) === String(equipoId);
  });

  if (!equipo) {
    throw crearErrorAplicacion(
      'EQUIPO_NO_ENCONTRADO',
      'No existe el equipo seleccionado en la hoja Equipos. Actualice la página e inténtelo nuevamente.'
    );
  }

  var nuevoActivo = convertirBooleanoEquipo_(activo, false);

  if (
    !nuevoActivo &&
    normalizarTexto(equipo.tipo) === 'principal'
  ) {
    var usados = obtenerServidores({}).filter(function(servidor) {
      return normalizarTexto(servidor.equipo) ===
        normalizarTexto(equipo.nombre);
    });

    if (usados.length > 0) {
      throw crearErrorAplicacion(
        'EQUIPO_PRINCIPAL_EN_USO',
        'No puede desactivar un equipo principal que todavía tiene servidores asignados.'
      );
    }
  }

  var hoja = obtenerHojaAdministracionEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var fila = buscarFilaPorIdEquipo_(
    hoja,
    encabezados,
    equipoId
  );

  escribirValoresEquipo_(hoja, encabezados, fila, {
    activo: nuevoActivo ? 'Sí' : 'No',
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  });

  registrarAuditoriaEquipo_(
    sesion,
    nuevoActivo ? 'ACTIVAR_EQUIPO' : 'DESACTIVAR_EQUIPO',
    equipoId,
    equipo.nombre
  );

  return {
    id: equipoId,
    activo: nuevoActivo
  };
}

function obtenerAsignacionEquiposServidor(token, servidorId) {
  validarPermiso(token, 'EDITAR_EQUIPOS');

  var servidor = obtenerServidorPorId(servidorId);
  var equipos = leerHojaAdministracionEquipos_().filter(function(item) {
    return item.activo;
  });
  var asignaciones = leerAsignacionesEquiposApoyo_().filter(
    function(item) {
      return (
        String(item.servidorId) === String(servidorId) &&
        item.activo
      );
    }
  );

  var equipoPrincipal = equipos.find(function(item) {
    return (
      normalizarTexto(item.tipo) === 'principal' &&
      normalizarTexto(item.nombre) ===
        normalizarTexto(servidor.equipo)
    );
  });

  return {
    servidor: resumirServidorEquipoAdministrable_(servidor),
    equipoPrincipalId: equipoPrincipal
      ? equipoPrincipal.id
      : '',
    equiposApoyoIds: asignaciones.map(function(item) {
      return String(item.equipoId);
    }),
    equiposPrincipales: equipos
      .filter(function(item) {
        return normalizarTexto(item.tipo) === 'principal';
      })
      .map(function(item) {
        return completarNombreVisibleEquipo_(
          Object.assign({}, item, {
            rolesDisponibles:
              obtenerRolesEquipoPrincipal_(
                item,
                servidor
              )
          })
        );
      }),
    equiposApoyo: equipos
      .filter(function(item) {
        return normalizarTexto(item.tipo) === 'apoyo';
      })
      .map(function(item) {
        return completarNombreVisibleEquipo_(
          Object.assign({}, item, {
            rolAsignacion: 'Apoyo'
          })
        );
      }),
    rolEquipoPrincipal:
      servidor.rolEquipo ||
      servidor.rolMesa ||
      servidor.rol ||
      '',
    mesaPrincipal:
      servidor.mesa || '',
    mesasDisponibles:
      typeof obtenerMesasDisponiblesServidor_ === 'function'
        ? obtenerMesasDisponiblesServidor_(servidor)
        : []
  };
}

function guardarAsignacionEquiposServidor(
  token,
  servidorId,
  equipoPrincipalId,
  equipoPrincipalNombre,
  rolEquipoPrincipal,
  mesaPrincipal,
  equiposApoyoIds
) {
  var sesion = validarPermiso(token, 'EDITAR_EQUIPOS');
  var servidor = obtenerServidorPorId(servidorId);
  var equipos = leerHojaAdministracionEquipos_();

  var principal = resolverEquipoAdministrable_(
    equipos,
    equipoPrincipalId,
    equipoPrincipalNombre
  );

  if (
    principal &&
    (
      !principal.activo ||
      normalizarTexto(principal.tipo) !== 'principal'
    )
  ) {
    principal = null;
  }

  if (!principal) {
    throw crearErrorAplicacion(
      'EQUIPO_PRINCIPAL_REQUERIDO',
      'El equipo principal seleccionado no existe o está inactivo. Actualice la página y vuelva a intentarlo.'
    );
  }

  var rolPrincipal = validarRolEquipoPrincipal_(
    principal,
    rolEquipoPrincipal,
    servidor
  );

  var idsApoyo = Array.isArray(equiposApoyoIds)
    ? equiposApoyoIds.map(String)
    : [];

  idsApoyo = Array.from(new Set(idsApoyo));

  var equiposApoyoValidos = equipos.filter(function(item) {
    return (
      idsApoyo.indexOf(String(item.id)) >= 0 &&
      item.activo &&
      normalizarTexto(item.tipo) === 'apoyo'
    );
  });

  if (equiposApoyoValidos.length !== idsApoyo.length) {
    throw crearErrorAplicacion(
      'EQUIPO_APOYO_INVALIDO',
      'Uno o más equipos de apoyo no existen o están inactivos.'
    );
  }

  var esMesa =
    normalizarTexto(principal.nombre) === 'mesa' ||
    normalizarTexto(principal.nombre) === 'mesas' ||
    normalizarTexto(principal.nombre) === 'equipo mesa' ||
    normalizarTexto(principal.nombre) === 'equipo de mesa';

  var cambiosPrincipal = {
    equipo: principal.nombre,
    rolEquipo: rolPrincipal,
    rol: rolPrincipal,
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  };

  /*
   * Mesa conserva su lógica especializada:
   * - hay múltiples líderes y colíderes en el equipo Mesa;
   * - cada número de mesa solo puede tener un Líder y un Colíder;
   * - se usa la misma función histórica de disponibilidad de mesas.
   */
  if (esMesa) {
    var numeroMesa = String(mesaPrincipal || '').trim();

    if (!numeroMesa) {
      throw crearErrorAplicacion(
        'MESA_REQUERIDA',
        'Seleccione la mesa en la que prestará el servicio.'
      );
    }

    var mesasDisponibles =
      obtenerMesasDisponiblesServidor_(servidor);

    var mesaDisponible = mesasDisponibles.find(function(item) {
      return (
        String(item.numero) === numeroMesa &&
        (item.rolesDisponibles || []).some(function(rol) {
          return normalizarTexto(rol) ===
            normalizarTexto(rolPrincipal);
        })
      );
    });

    if (!mesaDisponible) {
      throw crearErrorAplicacion(
        'MESA_ROL_NO_DISPONIBLE',
        'La mesa seleccionada ya tiene asignado ese rol. Actualice la información y seleccione otra mesa.'
      );
    }

    cambiosPrincipal.mesa = numeroMesa;
    cambiosPrincipal.rolMesa = rolPrincipal;
  } else {
    cambiosPrincipal.mesa = '';
    cambiosPrincipal.rolMesa = '';
  }

  actualizarRegistroSheet(
    HOJAS.SERVIDORES,
    servidorId,
    cambiosPrincipal,
    opcionesCrudServidores_(sesion.usuario)
  );

  sincronizarEquiposApoyoServidor_(
    sesion,
    servidor,
    idsApoyo
  );

  registrarAuditoriaEquipo_(
    sesion,
    'ASIGNAR_EQUIPOS_SERVIDOR',
    servidorId,
    'Principal: ' +
      principal.nombre +
      ' · Rol: ' +
      rolPrincipal +
      (
        esMesa
          ? ' · Mesa: ' + String(mesaPrincipal || '')
          : ''
      ) +
      ' · Apoyo: ' +
      equiposApoyoValidos
        .map(function(item) {
          return item.nombre + ' (Apoyo)';
        })
        .join(', ')
  );

  return obtenerAsignacionEquiposServidor(
    token,
    servidorId
  );
}

function obtenerRolesEquipoPrincipal_(equipo, servidor) {
  if (!equipo) {
    return [];
  }

  var nombre = normalizarTexto(equipo.nombre);
  var esDireccion =
    nombre === 'direccion' ||
    nombre === 'equipo direccion' ||
    nombre === 'equipo de direccion';

  var esMesa =
    nombre === 'mesa' ||
    nombre === 'mesas' ||
    nombre === 'equipo mesa' ||
    nombre === 'equipo de mesa';

  if (esMesa) {
    return ['Líder', 'Colíder'];
  }

  var servidores = obtenerServidores({});
  var integrantes = servidores.filter(function(item) {
    return (
      String(item.id) !== String(servidor && servidor.id) &&
      normalizarTexto(item.equipo) === nombre
    );
  });

  var tieneLider = integrantes.some(function(item) {
    return normalizarTexto(
      item.rolEquipo || item.rol
    ) === 'lider';
  });

  if (esDireccion) {
    var tieneColider = integrantes.some(function(item) {
      return normalizarTexto(
        item.rolEquipo || item.rol
      ) === 'colider';
    });

    var rolesDireccion = [];

    if (!tieneLider) {
      rolesDireccion.push('Líder');
    }

    if (!tieneColider) {
      rolesDireccion.push('Colíder');
    }

    return rolesDireccion;
  }

  /*
   * Para los demás equipos principales:
   * - debe existir un único líder;
   * - mientras no exista líder, solo se puede asignar Líder;
   * - después, los demás integrantes quedan con rol Equipo.
   */
  return tieneLider
    ? ['Equipo']
    : ['Líder'];
}

function validarRolEquipoPrincipal_(
  equipo,
  rol,
  servidor
) {
  var rolTexto = String(rol || '').trim();
  var rolNormalizado = normalizarTexto(rolTexto);
  var disponibles = obtenerRolesEquipoPrincipal_(
    equipo,
    servidor
  );

  var permitido = disponibles.some(function(item) {
    return normalizarTexto(item) === rolNormalizado;
  });

  if (!permitido) {
    var nombre = String(equipo.nombre || '');

    if (
      normalizarTexto(nombre) === 'mesa' ||
      normalizarTexto(nombre) === 'mesas' ||
      normalizarTexto(nombre) === 'equipo mesa' ||
      normalizarTexto(nombre) === 'equipo de mesa'
    ) {
      throw crearErrorAplicacion(
        'ROL_MESA_INVALIDO',
        'En Mesa el rol debe ser Líder o Colíder.'
      );
    }

    if (
      normalizarTexto(nombre) === 'direccion' ||
      normalizarTexto(nombre) === 'equipo direccion' ||
      normalizarTexto(nombre) === 'equipo de direccion'
    ) {
      throw crearErrorAplicacion(
        'ROL_DIRECCION_NO_DISPONIBLE',
        'Dirección solo permite un Líder y un Colíder. El rol seleccionado ya está ocupado o no es válido.'
      );
    }

    throw crearErrorAplicacion(
      'ROL_EQUIPO_NO_DISPONIBLE',
      'Este equipo debe tener un Líder y los demás integrantes deben tener el rol Equipo.'
    );
  }

  return disponibles.find(function(item) {
    return normalizarTexto(item) === rolNormalizado;
  });
}


/**
 * Resumen de cobertura de equipos principales.
 *
 * Permite verificar que el total de servidores coincida con:
 * - servidores con equipo principal;
 * - servidores sin equipo principal.
 */
function obtenerResumenAsignacionEquipos(token) {
  obtenerSesion(token);

  var servidores = obtenerServidores({});
  var asignados = servidores.filter(function(servidor) {
    return String(servidor.equipo || '').trim();
  });

  var sinEquipoPrincipal = servidores
    .filter(function(servidor) {
      return !String(servidor.equipo || '').trim();
    })
    .map(resumirServidorEquipoAdministrable_)
    .sort(function(a, b) {
      return String(a.nombre || '').localeCompare(
        String(b.nombre || ''),
        'es'
      );
    });

  return {
    totalServidores: servidores.length,
    conEquipoPrincipal: asignados.length,
    sinEquipoPrincipal: sinEquipoPrincipal.length,
    servidoresSinEquipoPrincipal: sinEquipoPrincipal
  };
}


/**
 * Resuelve un equipo utilizando primero su ID y luego su nombre.
 *
 * El respaldo por nombre permite recuperar equipos cuya fila recibió
 * un ID nuevo durante la corrección de datos, mientras el navegador
 * todavía conserva el ID anterior.
 */
function resolverEquipoAdministrable_(equipos, equipoId, equipoNombre) {
  var id = String(equipoId || '').trim();
  var nombre = normalizarTexto(equipoNombre || '');

  var equipo = null;

  if (id) {
    equipo = equipos.find(function(item) {
      return String(item.id || '').trim() === id;
    });
  }

  if (!equipo && nombre) {
    equipo = equipos.find(function(item) {
      return normalizarTexto(item.nombre) === nombre;
    });
  }

  return equipo || null;
}


function esEquipoDireccion_(equipo) {
  var nombre = normalizarTexto(equipo && equipo.nombre);

  return [
    'direccion',
    'equipo direccion',
    'equipo de direccion'
  ].indexOf(nombre) >= 0;
}

function esEquipoMesa_(equipo) {
  var nombre = normalizarTexto(equipo && equipo.nombre);

  return [
    'mesa',
    'mesas',
    'equipo mesa',
    'equipo de mesa'
  ].indexOf(nombre) >= 0;
}

function obtenerRolesDisponiblesAsignacionEquipo_(
  equipo,
  servidoresSeleccionados
) {
  if (!equipo) {
    return [];
  }

  if (normalizarTexto(equipo.tipo) === 'apoyo') {
    return ['Apoyo'];
  }

  if (esEquipoMesa_(equipo)) {
    return ['Líder', 'Colíder'];
  }

  var integrantes = (servidoresSeleccionados || []).filter(
    function(servidor) {
      return normalizarTexto(servidor.equipo) ===
        normalizarTexto(equipo.nombre);
    }
  );

  var tieneLider = integrantes.some(function(servidor) {
    return normalizarTexto(
      servidor.rolEquipo ||
      servidor.rolMesa ||
      servidor.rol
    ) === 'lider';
  });

  if (esEquipoDireccion_(equipo)) {
    var tieneColider = integrantes.some(function(servidor) {
      return normalizarTexto(
        servidor.rolEquipo ||
        servidor.rolMesa ||
        servidor.rol
      ) === 'colider';
    });

    var roles = [];

    if (!tieneLider) {
      roles.push('Líder');
    }

    if (!tieneColider) {
      roles.push('Colíder');
    }

    return roles;
  }

  return tieneLider
    ? ['Equipo']
    : ['Líder'];
}

function validarRolAsignacionEquipo_(
  equipo,
  rol,
  servidoresActuales
) {
  var disponibles =
    obtenerRolesDisponiblesAsignacionEquipo_(
      equipo,
      servidoresActuales
    );

  var rolNormalizado = normalizarTexto(rol);

  var valido = disponibles.some(function(item) {
    return normalizarTexto(item) === rolNormalizado;
  });

  if (!valido) {
    if (esEquipoMesa_(equipo)) {
      throw crearErrorAplicacion(
        'ROL_MESA_INVALIDO',
        'En Mesa el rol debe ser Líder o Colíder. Se permiten varios de cada uno.'
      );
    }

    if (esEquipoDireccion_(equipo)) {
      throw crearErrorAplicacion(
        'ROL_DIRECCION_INVALIDO',
        'Dirección solo permite un Líder y un Colíder.'
      );
    }

    if (normalizarTexto(equipo.tipo) === 'apoyo') {
      throw crearErrorAplicacion(
        'ROL_APOYO_INVALIDO',
        'Los integrantes de equipos de apoyo siempre tienen el rol Apoyo.'
      );
    }

    throw crearErrorAplicacion(
      'ROL_EQUIPO_INVALIDO',
      'Este equipo debe tener un Líder y los demás integrantes deben tener el rol Equipo.'
    );
  }

  return disponibles.find(function(item) {
    return normalizarTexto(item) === rolNormalizado;
  });
}

function obtenerCandidatosAsignacionEquipo(token, equipoId, equipoNombre) {
  validarPermiso(token, 'EDITAR_EQUIPOS');

  var equipos = leerHojaAdministracionEquipos_();
  var equipo = resolverEquipoAdministrable_(
    equipos,
    equipoId,
    equipoNombre
  );

  if (!equipo) {
    throw crearErrorAplicacion(
      'EQUIPO_NO_ENCONTRADO',
      'No existe el equipo seleccionado.'
    );
  }

  if (!equipo.activo) {
    throw crearErrorAplicacion(
      'EQUIPO_INACTIVO',
      'No se pueden asignar servidores a un equipo inactivo.'
    );
  }

  var servidores = obtenerServidores({});
  var integrantesActuales = [];
  var candidatos = [];

  if (normalizarTexto(equipo.tipo) === 'principal') {
    integrantesActuales = servidores.filter(function(servidor) {
      return normalizarTexto(servidor.equipo) ===
        normalizarTexto(equipo.nombre);
    });

    candidatos = servidores.filter(function(servidor) {
      return !String(servidor.equipo || '').trim();
    });
  } else {
    var asignaciones = leerAsignacionesEquiposApoyo_();
    var idsActivos = asignaciones
      .filter(function(asignacion) {
        return (
          String(asignacion.equipoId) === String(equipo.id) &&
          asignacion.activo
        );
      })
      .map(function(asignacion) {
        return String(asignacion.servidorId);
      });

    integrantesActuales = servidores.filter(function(servidor) {
      return idsActivos.indexOf(String(servidor.id)) >= 0;
    });

    candidatos = servidores.filter(function(servidor) {
      return idsActivos.indexOf(String(servidor.id)) < 0;
    });
  }

  var integrantesResumen =
    integrantesActuales.map(
      resumirServidorEquipoAdministrable_
    );

  return {
    equipo: {
      id: equipo.id,
      nombre: equipo.nombre,
      tipo: equipo.tipo,
      descripcion: equipo.descripcion || '',
      activo: equipo.activo,
      nombreVisible:
        obtenerNombreVisibleEquipo_(equipo)
    },
    rolesDisponibles:
      obtenerRolesDisponiblesAsignacionEquipo_(
        equipo,
        integrantesActuales
      ),
    integrantesActuales:
      integrantesResumen,
    candidatos:
      candidatos
        .map(resumirServidorEquipoAdministrable_)
        .sort(function(a, b) {
          return String(a.nombre || '').localeCompare(
            String(b.nombre || ''),
            'es'
          );
        })
  };
}

/**
 * Asigna uno o varios servidores directamente desde la tarjeta del equipo.
 */
function asignarServidoresAEquipo(token, equipoId, equipoNombre, rol, servidorIds) {
  var sesion = validarPermiso(token, 'EDITAR_EQUIPOS');
  var ids = Array.isArray(servidorIds)
    ? Array.from(
        new Set(
          servidorIds
            .map(String)
            .filter(Boolean)
        )
      )
    : [];

  if (!ids.length) {
    throw crearErrorAplicacion(
      'SERVIDORES_REQUERIDOS',
      'Seleccione al menos un servidor.'
    );
  }

  var equipos = leerHojaAdministracionEquipos_();
  var equipo = resolverEquipoAdministrable_(
    equipos,
    equipoId,
    equipoNombre
  );

  if (!equipo) {
    throw crearErrorAplicacion(
      'EQUIPO_NO_ENCONTRADO',
      'No existe el equipo seleccionado.'
    );
  }

  if (!equipo.activo) {
    throw crearErrorAplicacion(
      'EQUIPO_INACTIVO',
      'No se pueden asignar servidores a un equipo inactivo.'
    );
  }

  var servidores = obtenerServidores({});
  var seleccionados = servidores.filter(function(servidor) {
    return ids.indexOf(String(servidor.id)) >= 0;
  });

  if (seleccionados.length !== ids.length) {
    throw crearErrorAplicacion(
      'SERVIDOR_NO_ENCONTRADO',
      'Uno o más servidores seleccionados no existen.'
    );
  }

  if (normalizarTexto(equipo.tipo) === 'principal') {
    var yaAsignados = seleccionados.filter(function(servidor) {
      return String(servidor.equipo || '').trim();
    });

    if (yaAsignados.length) {
      throw crearErrorAplicacion(
        'SERVIDOR_CON_EQUIPO_PRINCIPAL',
        'Los siguientes servidores ya tienen equipo principal: ' +
          yaAsignados
            .map(function(item) {
              return item.nombre + ' (' + item.equipo + ')';
            })
            .join(', ') +
          '. Para cambiarlos, edite la asignación desde la ficha del servidor.'
      );
    }

    var rolValidado = validarRolAsignacionEquipo_(
      equipo,
      rol,
      servidores
    );

    /*
     * Dirección:
     * - un Líder;
     * - un Colíder.
     *
     * Mesa:
     * - múltiples Líderes;
     * - múltiples Colíderes;
     * - no se modifica número de mesa.
     *
     * Otros principales:
     * - un Líder;
     * - resto Equipo.
     */
    seleccionados.forEach(function(servidor) {
      var cambios = {
        equipo: equipo.nombre,
        rol: rolValidado,
        rolEquipo: rolValidado,
        fechaActualizacion: new Date(),
        actualizadoPor: sesion.usuario || ''
      };

      if (esEquipoMesa_(equipo)) {
        if (String(servidor.mesa || '').trim()) {
          cambios.rolMesa = rolValidado;
        }
      } else {
        cambios.mesa = '';
        cambios.rolMesa = '';
      }

      actualizarRegistroSheet(
        HOJAS.SERVIDORES,
        servidor.id,
        cambios,
        opcionesCrudServidores_(sesion.usuario)
      );
    });
  } else {
    var rolApoyo = validarRolAsignacionEquipo_(
      equipo,
      rol || 'Apoyo',
      servidores
    );

    asignarServidoresEquipoApoyo_(
      sesion,
      equipo,
      seleccionados
    );
  }

  registrarAuditoriaEquipo_(
    sesion,
    'ASIGNAR_SERVIDORES_EQUIPO',
    equipo.id,
    equipo.nombre +
      ' · Rol: ' +
      (
        normalizarTexto(equipo.tipo) === 'apoyo'
          ? 'Apoyo'
          : rol
      ) +
      ' · ' +
      seleccionados
        .map(function(item) {
          return item.nombre;
        })
        .join(', ')
  );

  return obtenerCandidatosAsignacionEquipo(
    token,
    equipo.id,
    equipo.nombre
  );
}

function asignarServidoresEquipoApoyo_(
  sesion,
  equipo,
  servidores
) {
  var hoja = obtenerHojaServidorEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var existentes = leerAsignacionesEquiposApoyo_();
  var ahora = new Date();

  servidores.forEach(function(servidor) {
    var existente = existentes.find(function(asignacion) {
      return (
        String(asignacion.servidorId) === String(servidor.id) &&
        String(asignacion.equipoId) === String(equipo.id)
      );
    });

    if (existente && existente.activo) {
      return;
    }

    if (existente) {
      escribirValoresEquipo_(
        hoja,
        encabezados,
        existente._fila,
        {
          activo: 'Sí',
          fechaInicio: ahora,
          fechaFin: '',
          fechaActualizacion: ahora,
          actualizadoPor: sesion.usuario || ''
        }
      );
      return;
    }

    escribirValoresEquipo_(
      hoja,
      encabezados,
      hoja.getLastRow() + 1,
      {
        id: generarIdAsignacionEquipo_(),
        servidorId: servidor.id,
        servidorNombre: servidor.nombre,
        equipoId: equipo.id,
        tipoAsignacion: 'Apoyo',
        activo: 'Sí',
        fechaInicio: ahora,
        fechaFin: '',
        fechaRegistro: ahora,
        fechaActualizacion: ahora,
        actualizadoPor: sesion.usuario || ''
      }
    );
  });
}

function obtenerEquiposApoyoServidor_(servidorId) {
  var equipos = leerHojaAdministracionEquipos_();
  var mapa = {};

  equipos.forEach(function(equipo) {
    mapa[String(equipo.id)] = equipo;
  });

  return leerAsignacionesEquiposApoyo_()
    .filter(function(item) {
      return (
        String(item.servidorId) === String(servidorId) &&
        item.activo
      );
    })
    .map(function(item) {
      return mapa[String(item.equipoId)];
    })
    .filter(Boolean)
    .map(function(equipo) {
      return {
        id: equipo.id,
        nombre: equipo.nombre,
        tipo: equipo.tipo
      };
    });
}

function sincronizarEquiposApoyoServidor_(
  sesion,
  servidor,
  idsApoyo
) {
  var hoja = obtenerHojaServidorEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var existentes = leerAsignacionesEquiposApoyo_().filter(
    function(item) {
      return String(item.servidorId) === String(servidor.id);
    }
  );
  var ahora = new Date();

  existentes.forEach(function(asignacion) {
    var debeEstarActivo =
      idsApoyo.indexOf(String(asignacion.equipoId)) >= 0;

    if (asignacion.activo !== debeEstarActivo) {
      escribirValoresEquipo_(
        hoja,
        encabezados,
        asignacion._fila,
        {
          activo: debeEstarActivo ? 'Sí' : 'No',
          fechaFin: debeEstarActivo ? '' : ahora,
          fechaActualizacion: ahora,
          actualizadoPor: sesion.usuario || ''
        }
      );
    }
  });

  idsApoyo.forEach(function(equipoId) {
    var existente = existentes.find(function(item) {
      return String(item.equipoId) === String(equipoId);
    });

    if (existente) {
      return;
    }

    escribirValoresEquipo_(
      hoja,
      encabezados,
      hoja.getLastRow() + 1,
      {
        id: generarIdAsignacionEquipo_(),
        servidorId: servidor.id,
        servidorNombre: servidor.nombre,
        equipoId: equipoId,
        tipoAsignacion: 'Apoyo',
        activo: 'Sí',
        fechaInicio: ahora,
        fechaRegistro: ahora,
        fechaActualizacion: ahora,
        actualizadoPor: sesion.usuario || ''
      }
    );
  });
}

function leerHojaAdministracionEquipos_() {
  var hoja = obtenerHojaAdministracionEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);

  if (hoja.getLastRow() < 2) {
    return [];
  }

  var valores = hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      hoja.getLastColumn()
    )
    .getValues();

  var columnaId = encabezados.indexOf('id');
  var huboCorrecciones = false;

  var equipos = valores
    .map(function(fila, indice) {
      var registro = {};
      encabezados.forEach(function(clave, columna) {
        registro[clave] = fila[columna];
      });

      var nombre = String(
        registro.nombre || ''
      ).trim();

      if (!nombre) {
        return null;
      }

      var id = String(
        registro.id || ''
      ).trim();

      /*
       * Algunas filas migradas pudieron quedar sin ID.
       * Se corrigen aquí una sola vez para garantizar:
       * - claves únicas en React;
       * - asignaciones confiables;
       * - edición y cambio de estado por ID.
       */
      if (!id) {
        id = generarIdEquipoAdministrable_();

        if (columnaId >= 0) {
          valores[indice][columnaId] = id;
          huboCorrecciones = true;
        }
      }

      return {
        id: id,
        nombre: nombre,
        tipo: normalizarTipoEquipo_(
          registro.tipo || 'Principal'
        ),
        descripcion: registro.descripcion || '',
        orden: Number(registro.orden || 0),
        activo: convertirBooleanoEquipo_(
          registro.activo,
          true
        ),
        fechaRegistro: registro.fechaRegistro || '',
        fechaActualizacion:
          registro.fechaActualizacion || '',
        actualizadoPor: registro.actualizadoPor || '',
        _fila: indice + 2
      };
    })
    .filter(Boolean);

  if (huboCorrecciones) {
    hoja
      .getRange(
        2,
        1,
        valores.length,
        hoja.getLastColumn()
      )
      .setValues(valores);

    SpreadsheetApp.flush();
  }

  /*
   * Si por algún error histórico existen IDs duplicados,
   * se regeneran desde la segunda aparición.
   */
  var idsVistos = {};

  equipos.forEach(function(equipo) {
    if (!idsVistos[equipo.id]) {
      idsVistos[equipo.id] = true;
      return;
    }

    var nuevoId =
      generarIdEquipoAdministrable_();

    equipo.id = nuevoId;

    if (columnaId >= 0) {
      hoja
        .getRange(
          equipo._fila,
          columnaId + 1
        )
        .setValue(nuevoId);
    }
  });

  SpreadsheetApp.flush();

  return equipos;
}

function leerAsignacionesEquiposApoyo_() {
  var hoja = obtenerHojaServidorEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);

  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      hoja.getLastColumn()
    )
    .getValues()
    .map(function(fila, indice) {
      var registro = {};
      encabezados.forEach(function(clave, columna) {
        registro[clave] = fila[columna];
      });

      return {
        id: registro.id || '',
        servidorId: registro.servidorId || '',
        servidorNombre: registro.servidorNombre || '',
        equipoId: registro.equipoId || '',
        tipoAsignacion:
          registro.tipoAsignacion || 'Apoyo',
        activo: convertirBooleanoEquipo_(
          registro.activo,
          true
        ),
        fechaInicio: registro.fechaInicio || '',
        fechaFin: registro.fechaFin || '',
        fechaRegistro: registro.fechaRegistro || '',
        fechaActualizacion:
          registro.fechaActualizacion || '',
        actualizadoPor: registro.actualizadoPor || '',
        _fila: indice + 2
      };
    })
    .filter(function(item) {
      return String(item.id || '').trim();
    });
}

function obtenerHojaAdministracionEquipos_() {
  var libro = obtenerLibro();
  var hoja =
    libro.getSheetByName(HOJA_EQUIPOS_ADMINISTRABLES);

  if (!hoja) {
    throw crearErrorAplicacion(
      'HOJA_EQUIPOS_NO_INSTALADA',
      'Ejecute instalarAdministracionEquipos() antes de usar esta funcionalidad.'
    );
  }

  return hoja;
}

function obtenerHojaServidorEquipos_() {
  var libro = obtenerLibro();
  var hoja =
    libro.getSheetByName(HOJA_SERVIDOR_EQUIPOS);

  if (!hoja) {
    throw crearErrorAplicacion(
      'HOJA_SERVIDOR_EQUIPOS_NO_INSTALADA',
      'Ejecute instalarAdministracionEquipos() antes de usar esta funcionalidad.'
    );
  }

  return hoja;
}

function obtenerEncabezadosEquipo_(hoja) {
  var columnas = hoja.getLastColumn();

  if (!columnas) {
    return [];
  }

  return hoja
    .getRange(1, 1, 1, columnas)
    .getDisplayValues()[0]
    .map(normalizarEncabezadoEquipo_);
}

function normalizarEncabezadoEquipo_(valor) {
  var texto = String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+(.)/g, function(_, caracter) {
      return caracter.toUpperCase();
    });

  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function buscarFilaPorIdEquipo_(hoja, encabezados, id) {
  var indiceId = encabezados.indexOf('id');

  if (indiceId < 0 || hoja.getLastRow() < 2) {
    return 0;
  }

  var valores = hoja
    .getRange(2, indiceId + 1, hoja.getLastRow() - 1, 1)
    .getDisplayValues();

  for (var i = 0; i < valores.length; i += 1) {
    if (String(valores[i][0]) === String(id)) {
      return i + 2;
    }
  }

  return 0;
}

function escribirValoresEquipo_(
  hoja,
  encabezados,
  fila,
  valores
) {
  Object.keys(valores).forEach(function(clave) {
    var columna = encabezados.indexOf(clave);

    if (columna >= 0) {
      hoja
        .getRange(fila, columna + 1)
        .setValue(valores[clave]);
    }
  });
}

function generarIdEquipoAdministrable_() {
  return (
    'EQ-' +
    Utilities.getUuid()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()
  );
}

function generarIdAsignacionEquipo_() {
  return (
    'SE-' +
    Utilities.getUuid()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()
  );
}

function normalizarTipoEquipo_(valor) {
  return normalizarTexto(valor) === 'apoyo'
    ? 'Apoyo'
    : 'Principal';
}

function convertirBooleanoEquipo_(valor, defecto) {
  if (valor === undefined || valor === null || valor === '') {
    return defecto;
  }

  if (typeof valor === 'boolean') {
    return valor;
  }

  var normalizado = normalizarTexto(valor);

  return ['si', 'sí', 'true', '1', 'activo'].indexOf(
    normalizado
  ) >= 0;
}

function resumirServidorEquipoAdministrable_(servidor) {
  return {
    id: servidor.id || '',
    nombre: servidor.nombre || '',
    fotoPerfilUrl: servidor.fotoPerfilUrl || '',
    equipo: servidor.equipo || '',
    rol:
      servidor.rolMesa ||
      servidor.rolEquipo ||
      servidor.rol ||
      '',
    rolEquipo: servidor.rolEquipo || '',
    rolMesa: servidor.rolMesa || '',
    mesa: servidor.mesa || '',
    celular:
      servidor.celular ||
      servidor.telefono ||
      '',
    temas: servidor.temas || [],
    estadoPago: servidor.estadoPago || 'Pendiente'
  };
}

function registrarAuditoriaEquipo_(
  sesion,
  accion,
  idRegistro,
  detalle
) {
  if (typeof registrarAuditoria !== 'function') {
    return;
  }

  registrarAuditoria({
    usuario: sesion.usuario || '',
    nombre: sesion.nombre || '',
    accion: accion,
    entidad: 'Equipos',
    idRegistro: idRegistro,
    detalle: detalle
  });
}
