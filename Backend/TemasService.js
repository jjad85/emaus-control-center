/**
 * ============================================================
 * TEMAS SERVICE
 * ============================================================
 * Catálogo administrativo de temas asignables a servidores.
 * No realiza eliminación física; utiliza el campo Activo.
 */

function obtenerTemas(token, filtros) {
  validarAdministradorSistema(token);

  const parametros = filtros || {};
  const incluirInactivos = convertirBooleano(parametros.incluirInactivos);

  const items = listarRegistrosSheet(
    HOJAS.TEMAS,
    {},
    opcionesCrudTemas('')
  )
    .map(convertirTema)
    .filter(function(item) {
      if (!incluirInactivos && !convertirBooleano(item.activo)) {
        return false;
      }

      return coincideTexto(item.nombre, parametros.nombre);
    })
    .sort(function(a, b) {
      return String(a.nombre || '').localeCompare(
        String(b.nombre || ''),
        'es',
        { sensitivity: 'base' }
      );
    });

  return {
    items: items,
    servidores: obtenerServidoresVigentesParaTemas_()
  };
}

function registrarTema(token, datos) {
  const sesion = validarAdministradorSistema(token);

  return ejecutarCrudConBloqueo(function() {
    const registro = prepararTema_(datos);
    validarTema_(registro);
    validarNombreTemaUnico_(registro.nombre, null);

    const creado = crearRegistroSheet(
      HOJAS.TEMAS,
      registro,
      opcionesCrudTemas(sesion.usuario)
    );

    auditarTema_(sesion, 'REGISTRAR_TEMA', creado.id, creado);
    return convertirTema(creado);
  });
}

function editarTema(token, id, datos) {
  const sesion = validarAdministradorSistema(token);

  return ejecutarCrudConBloqueo(function() {
    const anterior = leerRegistroPorIdSheet(
      HOJAS.TEMAS,
      id,
      opcionesCrudTemas(sesion.usuario)
    );

    const registro = prepararTema_(datos);
    validarTema_(registro);
    validarNombreTemaUnico_(registro.nombre, id);

    const actualizado = actualizarRegistroSheet(
      HOJAS.TEMAS,
      id,
      registro,
      opcionesCrudTemas(sesion.usuario)
    );

    auditarTema_(sesion, 'EDITAR_TEMA', id, {
      anterior: anterior,
      nuevo: actualizado
    });

    return convertirTema(actualizado);
  });
}

function cambiarEstadoTema(token, id, activo) {
  const sesion = validarAdministradorSistema(token);

  return ejecutarCrudConBloqueo(function() {
    const actualizado = actualizarRegistroSheet(
      HOJAS.TEMAS,
      id,
      { activo: convertirBooleano(activo) ? 'Sí' : 'No' },
      opcionesCrudTemas(sesion.usuario)
    );

    auditarTema_(
      sesion,
      convertirBooleano(activo) ? 'ACTIVAR_TEMA' : 'DESACTIVAR_TEMA',
      id,
      actualizado
    );

    return convertirTema(actualizado);
  });
}

function convertirTema(registro) {
  return {
    id: registro.id || '',
    nombre: registro.nombre || '',
    servidorId: registro.servidorId || '',
    servidorNombre: registro.servidorNombre || '',
    requierePresentacion: convertirBooleano(registro.requierePresentacion),
    requiereTestimonio: convertirBooleano(registro.requiereTestimonio),
    activo: convertirBooleano(registro.activo),
    fechaRegistro: registro.fechaRegistro || '',
    fechaActualizacion: registro.fechaActualizacion || '',
    actualizadoPor: registro.actualizadoPor || ''
  };
}

function prepararTema_(datos) {
  const entrada = datos || {};
  const servidorId = String(entrada.servidorId || '').trim();
  const servidores = obtenerServidoresVigentesParaTemas_();
  const servidor = servidores.find(function(item) {
    return String(item.id) === servidorId;
  });

  return {
    nombre: String(entrada.nombre || '').trim(),
    servidorId: servidorId,
    servidorNombre: servidor ? servidor.nombre : '',
    requierePresentacion: convertirBooleano(entrada.requierePresentacion) ? 'Sí' : 'No',
    requiereTestimonio: convertirBooleano(entrada.requiereTestimonio) ? 'Sí' : 'No'
  };
}

function validarTema_(tema) {
  if (!tema.nombre) {
    throw crearErrorAplicacion(
      'NOMBRE_TEMA_REQUERIDO',
      'El nombre del tema es obligatorio.'
    );
  }

  if (tema.servidorId && !tema.servidorNombre) {
    throw crearErrorAplicacion(
      'SERVIDOR_TEMA_NO_VIGENTE',
      'El servidor seleccionado no existe o no está vigente.'
    );
  }
}

function validarNombreTemaUnico_(nombre, idExcluir) {
  const duplicado = listarRegistrosSheet(
    HOJAS.TEMAS,
    {},
    opcionesCrudTemas('')
  ).find(function(item) {
    return (
      convertirBooleano(item.activo) &&
      normalizarTexto(item.nombre) === normalizarTexto(nombre) &&
      String(item.id) !== String(idExcluir || '')
    );
  });

  if (duplicado) {
    throw crearErrorAplicacion(
      'TEMA_DUPLICADO',
      'Ya existe un tema activo con ese nombre.'
    );
  }
}

function obtenerServidoresVigentesParaTemas_() {
  return leerHojaComoObjetos(HOJAS.SERVIDORES)
    .filter(function(registro) {
      return registro.activo === undefined ||
        registro.activo === '' ||
        convertirBooleano(registro.activo);
    })
    .map(convertirServidor)
    .filter(function(item) {
      return String(item.id || '').trim() && String(item.nombre || '').trim();
    })
    .map(function(item) {
      return { id: item.id, nombre: item.nombre };
    })
    .sort(function(a, b) {
      return String(a.nombre).localeCompare(String(b.nombre), 'es', {
        sensitivity: 'base'
      });
    });
}

function opcionesCrudTemas(usuario) {
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

function auditarTema_(sesion, accion, id, detalle) {
  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: accion,
    entidad: 'Temas',
    idRegistro: id,
    detalle: JSON.stringify(detalle || {})
  });
}
