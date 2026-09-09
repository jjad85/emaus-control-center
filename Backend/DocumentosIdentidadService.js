/**
 * ============================================================
 * DOCUMENTOS DE IDENTIDAD
 * ============================================================
 * Gestión pública de carga y panel interno para documentos de identidad.
 *
 * Seguridad:
 * - Los archivos NO se comparten públicamente en Drive.
 * - La consulta pública exige coincidencia exacta del número de documento.
 * - La carga vuelve a resolver la persona en backend y no confía en IDs del cliente.
 * - El panel interno requiere SISTEMA_DOCUMENTOS_IDENTIDAD_VER.
 */

const PROPIEDAD_CARPETA_DOCUMENTOS_IDENTIDAD =
  'EMAUS_CARPETA_DOCUMENTOS_IDENTIDAD_ID';

const MAX_DOCUMENTO_IDENTIDAD_BYTES = 12 * 1024 * 1024;
const MAX_LOTE_EXPORTACION_IDENTIDAD_BYTES = 15 * 1024 * 1024;
const TIPOS_DOCUMENTO_IDENTIDAD_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

function consultarDocumentoIdentidadPublico(documento) {
  const persona = buscarPersonaDocumentoIdentidadPublico_(documento);
  const existente = obtenerRegistroDocumentoIdentidadPersona_(
    persona.tipoPersona,
    persona.id
  );

  return {
    encontrado: true,
    nombre: persona.nombre,
    tipoPersona: persona.tipoPersona,
    tieneDocumento: Boolean(existente),
    fechaRegistro: existente ? existente.fechaRegistro || '' : ''
  };
}

function registrarDocumentoIdentidadPublico(documento, archivo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const persona = buscarPersonaDocumentoIdentidadPublico_(documento);
    const existente = obtenerRegistroDocumentoIdentidadPersona_(
      persona.tipoPersona,
      persona.id
    );

    if (existente) {
      throw crearErrorAplicacion(
        'DOCUMENTO_IDENTIDAD_YA_REGISTRADO',
        'Ya tenemos un documento de identidad adjunto para esta persona. No es necesario volver a cargarlo.'
      );
    }

    validarArchivoDocumentoIdentidad_(archivo);

    const archivoDrive = guardarArchivoDocumentoIdentidad_(archivo, persona);
    const registro = {
      id: Utilities.getUuid(),
      tipoPersona: persona.tipoPersona,
      personaId: persona.id,
      documentoIdentidad: persona.documentoIdentidad,
      nombre: persona.nombre,
      telefono: persona.telefono || '',
      nombreArchivo: archivoDrive.nombre,
      mimeType: archivoDrive.mimeType,
      archivoDriveId: archivoDrive.id,
      fechaRegistro: new Date(),
      activo: 'Sí'
    };

    crearRegistroSheet(
      HOJAS.DOCUMENTOS_IDENTIDAD,
      registro,
      {
        campoId: 'id',
        campoActivo: 'activo',
        valorActivo: 'Sí',
        usuario: 'PUBLICO'
      }
    );

    if (typeof registrarAuditoria === 'function') {
      registrarAuditoria({
        usuario: 'PUBLICO',
        nombre: persona.nombre,
        accion: 'REGISTRAR_DOCUMENTO_IDENTIDAD',
        entidad: 'DocumentosIdentidad',
        idRegistro: registro.id,
        resultado: 'EXITOSO',
        detalle: JSON.stringify({
          tipoPersona: persona.tipoPersona,
          personaId: persona.id,
          mimeType: archivoDrive.mimeType
        })
      });
    }

    return {
      registrado: true,
      nombre: persona.nombre,
      tipoPersona: persona.tipoPersona,
      mensaje: 'Documento de identidad recibido correctamente.'
    };
  } finally {
    lock.releaseLock();
  }
}

function obtenerPanelDocumentosIdentidad(token) {
  validarPermiso(token, 'SISTEMA_DOCUMENTOS_IDENTIDAD_VER');

  const personas = obtenerPersonasEsperadasDocumentosIdentidad_();
  const registros = obtenerRegistrosDocumentosIdentidadActivos_();
  const mapa = {};

  registros.forEach(function(registro) {
    mapa[clavePersonaDocumentoIdentidad_(registro.tipoPersona, registro.personaId)] = registro;
  });

  const items = personas.map(function(persona) {
    const registro = mapa[clavePersonaDocumentoIdentidad_(persona.tipoPersona, persona.id)] || null;
    return {
      id: persona.id,
      tipoPersona: persona.tipoPersona,
      nombre: persona.nombre,
      telefono: persona.telefono || '',
      documentoIdentidad: persona.documentoIdentidad || '',
      entregado: Boolean(registro),
      fechaRegistro: registro ? registro.fechaRegistro || '' : '',
      mimeType: registro ? registro.mimeType || '' : '',
      nombreArchivo: registro ? registro.nombreArchivo || '' : ''
    };
  });

  const caminantes = items.filter(function(item) { return item.tipoPersona === 'Caminante'; });
  const servidores = items.filter(function(item) { return item.tipoPersona === 'Servidor'; });

  return {
    items: items,
    indicadores: {
      caminantes: construirIndicadorDocumentoIdentidad_(caminantes),
      servidores: construirIndicadorDocumentoIdentidad_(servidores),
      total: construirIndicadorDocumentoIdentidad_(items)
    }
  };
}

function obtenerArchivoDocumentoIdentidad(token, tipoPersona, personaId) {
  validarPermiso(token, 'SISTEMA_DOCUMENTOS_IDENTIDAD_VER');

  const registro = obtenerRegistroDocumentoIdentidadPersona_(tipoPersona, personaId);
  if (!registro) {
    throw crearErrorAplicacion(
      'DOCUMENTO_IDENTIDAD_NO_ADJUNTO',
      'La persona todavía no tiene documento de identidad adjunto.'
    );
  }

  const file = obtenerArchivoDriveDocumentoIdentidad_(registro.archivoDriveId);
  const blob = file.getBlob();
  const bytes = blob.getBytes();

  return {
    nombre: registro.nombreArchivo || file.getName(),
    mimeType: registro.mimeType || blob.getContentType() || 'application/octet-stream',
    base64: Utilities.base64Encode(bytes),
    dataUrl:
      'data:' +
      (registro.mimeType || blob.getContentType() || 'application/octet-stream') +
      ';base64,' +
      Utilities.base64Encode(bytes)
  };
}

/**
 * Exportación paginada por lotes para evitar respuestas gigantes de Apps Script.
 * El frontend solicita lote 0, descarga y continúa hasta totalLotes - 1.
 */
function exportarDocumentosIdentidad(token, lote) {
  validarPermiso(token, 'SISTEMA_DOCUMENTOS_IDENTIDAD_VER');

  const registros = obtenerRegistrosDocumentosIdentidadActivos_()
    .sort(function(a, b) {
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
    });

  const lotes = [];
  let actual = [];
  let bytesActuales = 0;

  registros.forEach(function(registro) {
    const file = obtenerArchivoDriveDocumentoIdentidad_(registro.archivoDriveId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const tamano = bytes.length;

    if (actual.length && bytesActuales + tamano > MAX_LOTE_EXPORTACION_IDENTIDAD_BYTES) {
      lotes.push(actual);
      actual = [];
      bytesActuales = 0;
    }

    actual.push({ registro: registro, blob: blob, bytes: bytes });
    bytesActuales += tamano;
  });

  if (actual.length) lotes.push(actual);

  if (!lotes.length) {
    return {
      lote: 0,
      totalLotes: 0,
      cantidadDocumentos: 0,
      vacio: true
    };
  }

  const indice = Math.max(0, Number(lote || 0));
  if (indice >= lotes.length) {
    throw crearErrorAplicacion(
      'LOTE_EXPORTACION_INVALIDO',
      'El lote solicitado no existe.'
    );
  }

  const blobs = lotes[indice].map(function(item) {
    const extension = obtenerExtensionDocumentoIdentidad_(
      item.registro.nombreArchivo,
      item.registro.mimeType
    );
    const nombre = nombreArchivoExportacionDocumentoIdentidad_(item.registro, extension);
    return Utilities.newBlob(item.bytes, item.registro.mimeType || item.blob.getContentType(), nombre);
  });

  const nombreZip =
    'documentos_identidad_emaus_lote_' +
    (indice + 1) +
    '_de_' +
    lotes.length +
    '.zip';

  const zip = Utilities.zip(blobs, nombreZip);
  const zipBytes = zip.getBytes();

  return {
    lote: indice,
    totalLotes: lotes.length,
    cantidadDocumentos: registros.length,
    cantidadLote: blobs.length,
    nombre: nombreZip,
    mimeType: 'application/zip',
    base64: Utilities.base64Encode(zipBytes),
    vacio: false
  };
}

function crearSolicitudDocumentoIdentidadWhatsapp(token, tipoPersona, personaId, link) {
  validarPermiso(token, 'SISTEMA_DOCUMENTOS_IDENTIDAD_VER');

  const persona = obtenerPersonaEsperadaDocumentoIdentidad_(tipoPersona, personaId);
  if (!persona) {
    throw crearErrorAplicacion(
      'PERSONA_DOCUMENTO_IDENTIDAD_NO_ENCONTRADA',
      'No encontramos una persona vigente para solicitar el documento.'
    );
  }

  if (obtenerRegistroDocumentoIdentidadPersona_(persona.tipoPersona, persona.id)) {
    throw crearErrorAplicacion(
      'DOCUMENTO_IDENTIDAD_YA_REGISTRADO',
      'La persona ya tiene documento de identidad adjunto.'
    );
  }

  if (!String(persona.telefono || '').trim()) {
    throw crearErrorAplicacion(
      'TELEFONO_DOCUMENTO_IDENTIDAD_REQUERIDO',
      'La persona no tiene un celular registrado para enviar la solicitud por WhatsApp.'
    );
  }

  const urlPublica = String(link || '').trim();
  if (!urlPublica) {
    throw crearErrorAplicacion(
      'LINK_DOCUMENTO_IDENTIDAD_REQUERIDO',
      'No fue posible determinar el enlace público para cargar el documento.'
    );
  }

  return crearNotificacionWhatsappPendiente({
    tipo: TIPOS_NOTIFICACION_WHATSAPP.DOCUMENTO_IDENTIDAD,
    entidad: 'DocumentosIdentidad',
    entidadId: persona.tipoPersona + ':' + persona.id + ':' + new Date().getTime(),
    nombre: persona.nombre,
    telefono: persona.telefono,
    motivo: JSON.stringify({
      link: urlPublica,
      tipoPersona: persona.tipoPersona
    })
  });
}

function buscarPersonaDocumentoIdentidadPublico_(documento) {
  const buscado = normalizarNumeroDocumentoIdentidad_(documento);
  if (buscado.length < 5) {
    throw crearErrorAplicacion(
      'DOCUMENTO_IDENTIDAD_INVALIDO',
      'Ingresa un número de documento válido.'
    );
  }

  const coincidencias = obtenerPersonasEsperadasDocumentosIdentidad_()
    .filter(function(persona) {
      return normalizarNumeroDocumentoIdentidad_(persona.documentoIdentidad) === buscado;
    });

  if (!coincidencias.length) {
    throw crearErrorAplicacion(
      'PERSONA_DOCUMENTO_IDENTIDAD_NO_ENCONTRADA',
      'No encontramos un caminante o servidor vigente con ese número de documento.'
    );
  }

  if (coincidencias.length > 1) {
    throw crearErrorAplicacion(
      'DOCUMENTO_IDENTIDAD_AMBIGUO',
      'El número de documento aparece asociado a más de una persona. Contacta al equipo organizador.'
    );
  }

  return coincidencias[0];
}

function obtenerPersonasEsperadasDocumentosIdentidad_() {
  const caminantes = obtenerCaminantes({})
    .filter(function(item) {
      return convertirBooleano(item.activo) &&
        Boolean(normalizarNumeroDocumentoIdentidad_(item.documentoIdentidad));
    })
    .map(function(item) {
      return {
        id: String(item.id || '').trim(),
        tipoPersona: 'Caminante',
        nombre: String(item.nombre || '').trim(),
        documentoIdentidad: String(item.documentoIdentidad || '').trim(),
        telefono: String(item.telefono || item.celular || '').trim()
      };
    });

  const servidores = obtenerServidores({})
    .filter(function(item) {
      return Boolean(item.activo) &&
        !Boolean(item.exentoPago) &&
        Boolean(normalizarNumeroDocumentoIdentidad_(item.documentoIdentidad));
    })
    .map(function(item) {
      return {
        id: String(item.id || '').trim(),
        tipoPersona: 'Servidor',
        nombre: String(item.nombre || '').trim(),
        documentoIdentidad: String(item.documentoIdentidad || '').trim(),
        telefono: String(item.celular || '').trim()
      };
    });

  return caminantes
    .concat(servidores)
    .filter(function(item) { return item.id && item.nombre; })
    .sort(function(a, b) {
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
    });
}

function obtenerPersonaEsperadaDocumentoIdentidad_(tipoPersona, personaId) {
  const tipo = normalizarTipoPersonaDocumentoIdentidad_(tipoPersona);
  return obtenerPersonasEsperadasDocumentosIdentidad_().find(function(item) {
    return item.tipoPersona === tipo && String(item.id) === String(personaId);
  }) || null;
}

function obtenerRegistrosDocumentosIdentidadActivos_() {
  try {
    return leerHojaComoObjetos(HOJAS.DOCUMENTOS_IDENTIDAD)
      .filter(function(item) { return convertirBooleano(item.activo); });
  } catch (error) {
    if (String(error && error.message || '').toLowerCase().includes('hoja')) return [];
    throw error;
  }
}

function obtenerRegistroDocumentoIdentidadPersona_(tipoPersona, personaId) {
  const tipo = normalizarTipoPersonaDocumentoIdentidad_(tipoPersona);
  return obtenerRegistrosDocumentosIdentidadActivos_().find(function(item) {
    return normalizarTipoPersonaDocumentoIdentidad_(item.tipoPersona) === tipo &&
      String(item.personaId || '').trim() === String(personaId || '').trim();
  }) || null;
}

function construirIndicadorDocumentoIdentidad_(items) {
  const total = items.length;
  const entregados = items.filter(function(item) { return Boolean(item.entregado); }).length;
  return {
    total: total,
    entregados: entregados,
    pendientes: Math.max(total - entregados, 0),
    porcentaje: total ? Math.round((entregados / total) * 100) : 0
  };
}

function validarArchivoDocumentoIdentidad_(archivo) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) {
    throw crearErrorAplicacion(
      'ARCHIVO_DOCUMENTO_IDENTIDAD_REQUERIDO',
      'Selecciona una imagen o PDF válido.'
    );
  }

  const tipo = String(archivo.tipo || '').toLowerCase();
  if (TIPOS_DOCUMENTO_IDENTIDAD_PERMITIDOS.indexOf(tipo) < 0) {
    throw crearErrorAplicacion(
      'TIPO_DOCUMENTO_IDENTIDAD_INVALIDO',
      'Solo se permiten archivos JPG, PNG, WEBP o PDF.'
    );
  }

  const bytes = decodificarDocumentoIdentidad_(archivo);
  if (!bytes.length) {
    throw crearErrorAplicacion(
      'ARCHIVO_DOCUMENTO_IDENTIDAD_VACIO',
      'El archivo seleccionado está vacío.'
    );
  }

  if (bytes.length > MAX_DOCUMENTO_IDENTIDAD_BYTES) {
    throw crearErrorAplicacion(
      'ARCHIVO_DOCUMENTO_IDENTIDAD_MUY_GRANDE',
      'El archivo no puede superar 12 MB.'
    );
  }
}

function decodificarDocumentoIdentidad_(archivo) {
  return Utilities.base64Decode(
    String(archivo.base64 || '').replace(/^data:[^;]+;base64,/, '')
  );
}

function guardarArchivoDocumentoIdentidad_(archivo, persona) {
  const carpeta = obtenerCarpetaDocumentosIdentidad_();
  const bytes = decodificarDocumentoIdentidad_(archivo);
  const extension = obtenerExtensionDocumentoIdentidad_(archivo.nombre, archivo.tipo);
  const nombreSeguro =
    sanitizarNombreArchivoDocumentoIdentidad_(persona.nombre) +
    '_' +
    normalizarNumeroDocumentoIdentidad_(persona.documentoIdentidad) +
    '.' + extension;

  const blob = Utilities.newBlob(bytes, archivo.tipo, nombreSeguro);
  const file = carpeta.createFile(blob);

  // Intencionalmente NO se usa setSharing(ANYONE_WITH_LINK): contiene PII.
  return {
    id: file.getId(),
    nombre: nombreSeguro,
    mimeType: archivo.tipo
  };
}

function obtenerCarpetaDocumentosIdentidad_() {
  const propiedades = PropertiesService.getScriptProperties();
  const id = propiedades.getProperty(PROPIEDAD_CARPETA_DOCUMENTOS_IDENTIDAD);

  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (error) {
      propiedades.deleteProperty(PROPIEDAD_CARPETA_DOCUMENTOS_IDENTIDAD);
    }
  }

  const carpeta = DriveApp.createFolder('Documentos de identidad Emaús');
  propiedades.setProperty(PROPIEDAD_CARPETA_DOCUMENTOS_IDENTIDAD, carpeta.getId());
  return carpeta;
}

function obtenerArchivoDriveDocumentoIdentidad_(id) {
  const fileId = String(id || '').trim();
  if (!fileId) {
    throw crearErrorAplicacion(
      'ARCHIVO_DOCUMENTO_IDENTIDAD_NO_CONFIGURADO',
      'El registro no tiene archivo asociado.'
    );
  }

  try {
    return DriveApp.getFileById(fileId);
  } catch (error) {
    throw crearErrorAplicacion(
      'ARCHIVO_DOCUMENTO_IDENTIDAD_NO_ENCONTRADO',
      'No fue posible localizar el archivo de identidad en Drive.'
    );
  }
}

function nombreArchivoExportacionDocumentoIdentidad_(registro, extension) {
  return (
    String(registro.tipoPersona || 'Persona') +
    '_' +
    sanitizarNombreArchivoDocumentoIdentidad_(registro.nombre || 'Sin_nombre') +
    '_' +
    normalizarNumeroDocumentoIdentidad_(registro.documentoIdentidad || '') +
    '.' + extension
  );
}

function sanitizarNombreArchivoDocumentoIdentidad_(valor) {
  return String(valor || 'Persona')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100) || 'Persona';
}

function obtenerExtensionDocumentoIdentidad_(nombre, tipo) {
  const match = String(nombre || '').match(/\.([a-zA-Z0-9]+)$/);
  if (match) return match[1].toLowerCase();

  const mapa = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf'
  };
  return mapa[String(tipo || '').toLowerCase()] || 'bin';
}

function normalizarNumeroDocumentoIdentidad_(valor) {
  return String(valor || '').replace(/\D/g, '').trim();
}

function normalizarTipoPersonaDocumentoIdentidad_(valor) {
  const tipo = normalizarTexto(valor);
  if (tipo === 'caminante' || tipo === 'caminantes') return 'Caminante';
  if (tipo === 'servidor' || tipo === 'servidores') return 'Servidor';
  return String(valor || '').trim();
}

function clavePersonaDocumentoIdentidad_(tipoPersona, personaId) {
  return normalizarTipoPersonaDocumentoIdentidad_(tipoPersona) + ':' + String(personaId || '').trim();
}
