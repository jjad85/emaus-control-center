/**
 * ============================================================
 * TEMAS SERVICE - FASE 1
 * ============================================================
 * Administración, asignación y ordenamiento de temas.
 */

const PERMISO_ADMINISTRAR_TEMAS = 'ADMINISTRAR_TEMAS';

function obtenerTemas(token, filtros) {
  validarPermiso(token, PERMISO_ADMINISTRAR_TEMAS);

  const parametros = filtros || {};
  const incluirInactivos = convertirBooleano(parametros.incluirInactivos);
  const items = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .map(convertirTema)
    .filter(function(item) {
      if (!incluirInactivos && !item.activo) return false;
      return coincideTexto(item.nombre, parametros.nombre);
    });

  ordenarTemasEnMemoria_(items);
  completarNavegacionTemas_(items);

  return {
    items: items,
    servidores: obtenerServidoresVigentesParaTemas_(),
    dias: obtenerDiasTema_(items)
  };
}

function registrarTema(token, datos) {
  const sesion = validarPermiso(token, PERMISO_ADMINISTRAR_TEMAS);

  return ejecutarCrudConBloqueo(function() {
    const registro = prepararTema_(datos);
    validarTema_(registro);
    validarNombreTemaUnico_(registro.nombre, null);

    registro.ordenGeneral = obtenerSiguienteOrdenGeneralTema_();
    registro.ordenDelDia = obtenerSiguienteOrdenDiaTema_(registro.diaDelTema);
    registro.estadoPreparacion = calcularEstadoPreparacionTema_(registro);
    registro.aprobacionConferencista = 'No';
    registro.aprobacionAudiovisuales = 'No';

    const creado = crearRegistroSheet(HOJAS.TEMAS, registro, opcionesCrudTemas(sesion.usuario));
    normalizarOrdenesTemas_(sesion);
    auditarTema_(sesion, 'REGISTRAR_TEMA', creado.id, creado);
    return convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS, creado.id, opcionesCrudTemas('')));
  });
}

function editarTema(token, id, datos) {
  const sesion = validarPermiso(token, PERMISO_ADMINISTRAR_TEMAS);

  return ejecutarCrudConBloqueo(function() {
    const anterior = leerRegistroPorIdSheet(HOJAS.TEMAS, id, opcionesCrudTemas(sesion.usuario));
    const registro = prepararTema_(datos);
    validarTema_(registro);
    validarNombreTemaUnico_(registro.nombre, id);

    const cambioDia = normalizarTexto(anterior.diaDelTema) !== normalizarTexto(registro.diaDelTema);
    if (cambioDia) {
      registro.ordenDelDia = obtenerSiguienteOrdenDiaTema_(registro.diaDelTema, id);
    }
    registro.estadoPreparacion = calcularEstadoPreparacionTema_(Object.assign({}, anterior, registro));

    const actualizado = actualizarRegistroSheet(HOJAS.TEMAS, id, registro, opcionesCrudTemas(sesion.usuario));
    normalizarOrdenesTemas_(sesion);
    registrarHistorialOrdenTema_(sesion, anterior, actualizado);
    auditarTema_(sesion, 'EDITAR_TEMA', id, { anterior: anterior, nuevo: actualizado });
    return convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS, id, opcionesCrudTemas('')));
  });
}

function cambiarEstadoTema(token, id, activo) {
  const sesion = validarPermiso(token, PERMISO_ADMINISTRAR_TEMAS);

  return ejecutarCrudConBloqueo(function() {
    const anterior = leerRegistroPorIdSheet(HOJAS.TEMAS, id, opcionesCrudTemas(sesion.usuario));
    const activar = convertirBooleano(activo);
    const cambios = { activo: activar ? 'Sí' : 'No' };

    if (activar) {
      cambios.ordenGeneral = obtenerSiguienteOrdenGeneralTema_(id);
      cambios.ordenDelDia = obtenerSiguienteOrdenDiaTema_(anterior.diaDelTema, id);
    }

    const actualizado = actualizarRegistroSheet(HOJAS.TEMAS, id, cambios, opcionesCrudTemas(sesion.usuario));
    normalizarOrdenesTemas_(sesion);
    auditarTema_(sesion, activar ? 'ACTIVAR_TEMA' : 'DESACTIVAR_TEMA', id, actualizado);
    return convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS, id, opcionesCrudTemas('')));
  });
}

function moverTema(token, id, direccion) {
  const sesion = validarPermiso(token, PERMISO_ADMINISTRAR_TEMAS);
  const movimiento = normalizarTexto(direccion);

  if (movimiento !== 'subir' && movimiento !== 'bajar') {
    throw crearErrorAplicacion('DIRECCION_TEMA_INVALIDA', 'La dirección debe ser subir o bajar.');
  }

  return ejecutarCrudConBloqueo(function() {
    const registros = listarRegistrosSheet(
      HOJAS.TEMAS,
      {},
      opcionesCrudTemas(sesion.usuario)
    );

    const activos = registros
      .filter(function(item) {
        return convertirBooleano(item.activo);
      })
      .sort(function(a, b) {
        const ordenA = numeroSeguroTema_(a.ordenGeneral);
        const ordenB = numeroSeguroTema_(b.ordenGeneral);

        // Los registros sin orden se ubican al final de forma estable.
        if (!ordenA && ordenB) return 1;
        if (ordenA && !ordenB) return -1;

        return (
          ordenA - ordenB ||
          numeroSeguroTema_(a.ordenDelDia) - numeroSeguroTema_(b.ordenDelDia) ||
          String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
        );
      });

    const indiceActual = activos.findIndex(function(item) {
      return String(item.id) === String(id);
    });

    if (indiceActual < 0) {
      throw crearErrorAplicacion(
        'TEMA_NO_EXISTE',
        'No se encontró el tema activo que se desea mover.'
      );
    }

    const indiceDestino = movimiento === 'subir'
      ? indiceActual - 1
      : indiceActual + 1;

    if (indiceDestino < 0 || indiceDestino >= activos.length) {
      return convertirTema(activos[indiceActual]);
    }

    const temaMovido = activos[indiceActual];
    const ordenAnterior = indiceActual + 1;

    // Se mueve realmente el elemento dentro del arreglo y después se
    // reescriben todos los órdenes. Esto evita empates y órdenes vacíos.
    activos.splice(indiceActual, 1);
    activos.splice(indiceDestino, 0, temaMovido);

    const conteoPorDia = {};
    activos.forEach(function(item, indice) {
      const dia = item.diaDelTema || 'Sin definir';
      const claveDia = normalizarTexto(dia);
      conteoPorDia[claveDia] = (conteoPorDia[claveDia] || 0) + 1;

      actualizarRegistroSheet(
        HOJAS.TEMAS,
        item.id,
        {
          ordenGeneral: indice + 1,
          ordenDelDia: conteoPorDia[claveDia]
        },
        opcionesCrudTemas(sesion.usuario)
      );
    });

    const resultado = leerRegistroPorIdSheet(
      HOJAS.TEMAS,
      id,
      opcionesCrudTemas('')
    );

    registrarHistorialOrdenTema_(sesion, temaMovido, resultado);
    auditarTema_(
      sesion,
      'MOVER_TEMA_' + movimiento.toUpperCase(),
      id,
      {
        anterior: ordenAnterior,
        nuevo: indiceDestino + 1
      }
    );

    return convertirTema(resultado);
  });
}

function convertirTema(registro) {
  return {
    id: registro.id || '',
    nombre: registro.nombre || '',
    descripcion: registro.descripcion || '',
    duracionMinutos: numeroSeguroTema_(registro.duracionMinutos) || '',
    diaDelTema: registro.diaDelTema || 'Sin definir',
    ordenDelDia: numeroSeguroTema_(registro.ordenDelDia),
    ordenGeneral: numeroSeguroTema_(registro.ordenGeneral),
    horaPropuesta: formatearHoraTema_(registro.horaPropuesta),
    servidorId: registro.servidorId || '',
    servidorNombre: registro.servidorNombre || '',
    requierePresentacion: normalizarSiNoPendienteTema_(registro.requierePresentacion),
    requiereTestimonio: convertirBooleano(registro.requiereTestimonio),
    requiereMusica: normalizarSiNoPendienteTema_(registro.requiereMusica),
    estadoPreparacion: registro.estadoPreparacion || 'Pendiente de definición',
    aprobacionConferencista: convertirBooleano(registro.aprobacionConferencista),
    aprobacionAudiovisuales: convertirBooleano(registro.aprobacionAudiovisuales),
    versionAprobadaId: registro.versionAprobadaId || '',
    carpetaDriveId: registro.carpetaDriveId || '',
    carpetaDriveUrl: registro.carpetaDriveUrl || '',
    observaciones: registro.observaciones || '',
    activo: convertirBooleano(registro.activo),
    fechaRegistro: registro.fechaRegistro || '',
    fechaActualizacion: registro.fechaActualizacion || '',
    actualizadoPor: registro.actualizadoPor || ''
  };
}

function prepararTema_(datos) {
  const entrada = datos || {};
  const servidorId = String(entrada.servidorId || '').trim();
  const servidor = obtenerServidoresVigentesParaTemas_().find(function(item) { return String(item.id) === servidorId; });

  return {
    nombre: String(entrada.nombre || '').trim(),
    descripcion: String(entrada.descripcion || '').trim(),
    duracionMinutos: entrada.duracionMinutos === '' || entrada.duracionMinutos === null ? '' : Number(entrada.duracionMinutos),
    diaDelTema: String(entrada.diaDelTema || 'Sin definir').trim() || 'Sin definir',
    horaPropuesta: String(entrada.horaPropuesta || '').trim(),
    servidorId: servidorId,
    servidorNombre: servidor ? servidor.nombre : '',
    requierePresentacion: normalizarSiNoPendienteTema_(entrada.requierePresentacion),
    requiereTestimonio: convertirBooleano(entrada.requiereTestimonio) ? 'Sí' : 'No',
    requiereMusica: normalizarSiNoPendienteTema_(entrada.requiereMusica),
    observaciones: String(entrada.observaciones || '').trim()
  };
}

function validarTema_(tema) {
  if (!tema.nombre) throw crearErrorAplicacion('NOMBRE_TEMA_REQUERIDO', 'El nombre del tema es obligatorio.');
  if (tema.duracionMinutos !== '' && (!isFinite(tema.duracionMinutos) || Number(tema.duracionMinutos) <= 0)) {
    throw crearErrorAplicacion('DURACION_TEMA_INVALIDA', 'La duración debe ser un número mayor que cero.');
  }
  if (tema.servidorId && !tema.servidorNombre) {
    throw crearErrorAplicacion('SERVIDOR_TEMA_NO_VIGENTE', 'El servidor seleccionado no existe o no está vigente.');
  }
}

function validarNombreTemaUnico_(nombre, idExcluir) {
  const duplicado = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas('')).find(function(item) {
    return convertirBooleano(item.activo) && normalizarTexto(item.nombre) === normalizarTexto(nombre) && String(item.id) !== String(idExcluir || '');
  });
  if (duplicado) throw crearErrorAplicacion('TEMA_DUPLICADO', 'Ya existe un tema activo con ese nombre.');
}

function obtenerServidoresVigentesParaTemas_() {
  return leerHojaComoObjetos(HOJAS.SERVIDORES)
    .filter(function(registro) { return registro.activo === undefined || registro.activo === '' || convertirBooleano(registro.activo); })
    .map(convertirServidor)
    .filter(function(item) { return String(item.id || '').trim() && String(item.nombre || '').trim(); })
    .map(function(item) { return { id: item.id, nombre: item.nombre }; })
    .sort(function(a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' }); });
}

function obtenerSiguienteOrdenGeneralTema_(idExcluir) {
  return listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas('')).filter(function(item) {
    return convertirBooleano(item.activo) && String(item.id) !== String(idExcluir || '');
  }).length + 1;
}

function obtenerSiguienteOrdenDiaTema_(dia, idExcluir) {
  const clave = normalizarTexto(dia || 'Sin definir');
  return listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas('')).filter(function(item) {
    return convertirBooleano(item.activo) && normalizarTexto(item.diaDelTema || 'Sin definir') === clave && String(item.id) !== String(idExcluir || '');
  }).length + 1;
}

function normalizarOrdenesTemas_(sesion) {
  const registros = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(sesion.usuario));
  const activos = registros.filter(function(item) { return convertirBooleano(item.activo); });
  activos.sort(function(a, b) {
    const diferencia = numeroSeguroTema_(a.ordenGeneral) - numeroSeguroTema_(b.ordenGeneral);
    return diferencia || String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
  });

  const conteoDia = {};
  activos.forEach(function(item, indice) {
    const dia = item.diaDelTema || 'Sin definir';
    const clave = normalizarTexto(dia);
    conteoDia[clave] = (conteoDia[clave] || 0) + 1;
    actualizarRegistroSheet(HOJAS.TEMAS, item.id, {
      ordenGeneral: indice + 1,
      ordenDelDia: conteoDia[clave]
    }, opcionesCrudTemas(sesion.usuario));
  });
}

function ordenarTemasEnMemoria_(items) {
  items.sort(function(a, b) {
    if (a.activo !== b.activo) return a.activo ? -1 : 1;
    return numeroSeguroTema_(a.ordenGeneral) - numeroSeguroTema_(b.ordenGeneral) || String(a.nombre).localeCompare(String(b.nombre), 'es');
  });
}

function completarNavegacionTemas_(items) {
  const activos = items.filter(function(item) { return item.activo; });
  activos.forEach(function(item, indice) {
    item.totalTemas = activos.length;
    item.temaAnterior = indice > 0 ? activos[indice - 1].nombre : '';
    item.temaSiguiente = indice < activos.length - 1 ? activos[indice + 1].nombre : '';
  });
}

function obtenerDiasTema_(items) {
  const dias = ['Sin definir'];
  items.forEach(function(item) { if (item.diaDelTema && !dias.includes(item.diaDelTema)) dias.push(item.diaDelTema); });
  return dias;
}

function calcularEstadoPreparacionTema_(tema) {
  const presentacion = normalizarSiNoPendienteTema_(tema.requierePresentacion);
  if (presentacion === 'No') return 'Sin presentación';
  if (!tema.servidorId || presentacion === 'Pendiente') return 'Pendiente de definición';
  return 'Pendiente de carga';
}

function normalizarSiNoPendienteTema_(valor) {
  const texto = normalizarTexto(valor);
  if (texto === 'si' || texto === 'sí' || valor === true) return 'Sí';
  if (texto === 'no' || valor === false) return 'No';
  return 'Pendiente';
}

function formatearHoraTema_(valor) {
  if (!valor) return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(valor).trim();
}

function numeroSeguroTema_(valor) {
  const numero = Number(valor);
  return isFinite(numero) && numero > 0 ? numero : 0;
}

function registrarHistorialOrdenTema_(sesion, anterior, nuevo) {
  if (!anterior || !nuevo) return;
  if (String(anterior.diaDelTema || '') === String(nuevo.diaDelTema || '') && Number(anterior.ordenGeneral || 0) === Number(nuevo.ordenGeneral || 0)) return;
  crearRegistroSheet('TemaOrdenHistorial', {
    temaId: nuevo.id,
    diaAnterior: anterior.diaDelTema || '',
    diaNuevo: nuevo.diaDelTema || '',
    ordenAnterior: anterior.ordenGeneral || '',
    ordenNuevo: nuevo.ordenGeneral || '',
    usuarioId: sesion.usuario || '',
    usuarioNombre: sesion.nombre || '',
    fechaRegistro: new Date()
  }, { campoId: 'id', usuario: sesion.usuario || '' });
}

function opcionesCrudTemas(usuario) {
  return {
    campoId: 'id', campoActivo: 'activo', campoFechaRegistro: 'fechaRegistro',
    campoFechaActualizacion: 'fechaActualizacion', campoActualizadoPor: 'actualizadoPor',
    usuario: usuario || '', valorActivo: 'Sí', valorInactivo: 'No'
  };
}

function auditarTema_(sesion, accion, id, detalle) {
  registrarAuditoria({ usuario: sesion.usuario, nombre: sesion.nombre, accion: accion, entidad: 'Temas', idRegistro: id, detalle: JSON.stringify(detalle || {}) });
}
