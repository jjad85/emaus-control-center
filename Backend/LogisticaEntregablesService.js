/**
 * Bandeja de aprobaciones de cartas y fotografías para Logística.
 */
function obtenerPendientesLogistica(token) {
  validarPermiso(token, 'LOGISTICA_CONSULTAR_BANDEJA');

  return obtenerCaminantes({}).reduce(function(items, caminante) {
    const entregables = caminante.entregables || {};
    const aprobacionCarta = entregables.aprobacionCartaLogistica || {};
    const aprobacionFoto = entregables.aprobacionFotoLogistica || {};

    const cartaPendiente =
      normalizarTexto(entregables.carta) === normalizarTexto('Entregada a Logística') &&
      !String(aprobacionCarta.aprobadoPor || '').trim();
    const fotoPendiente =
      normalizarTexto(entregables.foto) === normalizarTexto('Entregada a Logística') &&
      !String(aprobacionFoto.aprobadoPor || '').trim();

    if (cartaPendiente || fotoPendiente) {
      items.push({
        id: caminante.id,
        nombre: caminante.nombre,
        numeroInscripcion: caminante.numeroInscripcion || '',
        mesa: caminante.mesa || '',
        cartaPendiente: cartaPendiente,
        fotoPendiente: fotoPendiente
      });
    }
    return items;
  }, []);
}

function aprobarEntregableLogistica(token, id, tipo) {
  const sesion = obtenerSesion(token);
  validarPermiso(token, 'CAMINANTES_APROBAR_ENTREGA_LOGISTICA');

  const campo = normalizarTexto(tipo) === 'carta' ? 'carta' :
    normalizarTexto(tipo) === 'foto' ? 'foto' : '';
  if (!campo) throw new Error('El tipo de entregable no es válido.');

  return ejecutarCrudConBloqueo(function() {
    const actual = leerRegistroPorIdSheet(
      HOJAS.CAMINANTES,
      id,
      opcionesCrudCaminante(sesion.usuario)
    );
    if (!actual) throw new Error('No se encontró el caminante.');

    if (normalizarTexto(actual[campo]) !== normalizarTexto('Entregada a Logística')) {
      throw new Error('El entregable todavía no ha sido entregado a Logística.');
    }

    const campoPor = campo === 'carta'
      ? 'cartaAprobadaLogisticaPor'
      : 'fotoAprobadaLogisticaPor';
    const campoFecha = campo === 'carta'
      ? 'cartaFechaAprobacionLogistica'
      : 'fotoFechaAprobacionLogistica';

    if (String(actual[campoPor] || '').trim()) {
      return convertirRegistroCaminanteRespuesta(actual);
    }

    const cambios = {};
    cambios[campoPor] = sesion.usuario;
    cambios[campoFecha] = new Date();

    const actualizado = actualizarRegistroSheet(
      HOJAS.CAMINANTES,
      id,
      cambios,
      opcionesCrudCaminante(sesion.usuario)
    );

    auditarCaminanteCrud(
      sesion,
      'APROBAR_ENTREGA_LOGISTICA_' + campo.toUpperCase(),
      id,
      {
        campo: campo,
        aprobadoPor: actualizado[campoPor],
        fechaAprobacion: actualizado[campoFecha]
      }
    );

    return convertirRegistroCaminanteRespuesta(actualizado);
  });
}
