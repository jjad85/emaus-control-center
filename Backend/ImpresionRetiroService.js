/**
 * Plantillas de impresión: escarapelas y marcación de habitaciones.
 * Las imágenes se guardan en Google Drive y sus IDs/dimensiones en
 * ScriptProperties.
 */
var CLAVE_PLANTILLA_ESCARAPELA_ = 'EMAUS_PLANTILLA_ESCARAPELA';
var CLAVE_PLANTILLA_HABITACION_ = 'EMAUS_PLANTILLA_HABITACION';
var CLAVE_CARPETA_IMPRESION_ = 'EMAUS_CARPETA_PLANTILLAS_IMPRESION';
var NOMBRE_CARPETA_IMPRESION_ = 'Plantillas impresión Emaús';
var MAX_IMAGEN_IMPRESION_BYTES_ = 8 * 1024 * 1024;

function obtenerConfiguracionImpresion(token) {
  var sesion = obtenerSesion(token);
  if (!sesion) {
    throw crearErrorAplicacion('SESION_REQUERIDA', 'Debe iniciar sesión.');
  }

  var props = PropertiesService.getScriptProperties();
  return {
    escarapela: leerPlantillaImpresion_(props, CLAVE_PLANTILLA_ESCARAPELA_),
    habitacion: leerPlantillaImpresion_(props, CLAVE_PLANTILLA_HABITACION_)
  };
}

function guardarPlantillaImpresion(token, tipo, archivo, anchoCm, altoCm) {
  var sesion = validarPermiso(
    token,
    'SISTEMA_CONFIGURAR_PLANTILLAS_IMPRESION'
  );

  tipo = String(tipo || '').toLowerCase().trim();
  if (['escarapela', 'habitacion'].indexOf(tipo) < 0) {
    throw crearErrorAplicacion(
      'TIPO_PLANTILLA_INVALIDO',
      'Tipo de plantilla inválido.'
    );
  }

  var ancho = Number(anchoCm);
  var alto = Number(altoCm);
  if (!(ancho > 0 && alto > 0 && ancho <= 50 && alto <= 50)) {
    throw crearErrorAplicacion(
      'DIMENSIONES_INVALIDAS',
      'Indique ancho y alto válidos en centímetros.'
    );
  }

  if (
    !archivo ||
    !archivo.base64 ||
    !/^image\//i.test(String(archivo.tipo || ''))
  ) {
    throw crearErrorAplicacion(
      'IMAGEN_REQUERIDA',
      'Seleccione una imagen válida.'
    );
  }

  var base64 = String(archivo.base64 || '')
    .replace(/^data:[^;]+;base64,/, '');

  var bytes;
  try {
    bytes = Utilities.base64Decode(base64);
  } catch (errorBase64) {
    throw crearErrorAplicacion(
      'IMAGEN_INVALIDA',
      'No fue posible leer la imagen seleccionada.'
    );
  }

  if (bytes.length > MAX_IMAGEN_IMPRESION_BYTES_) {
    throw crearErrorAplicacion(
      'IMAGEN_MUY_GRANDE',
      'La imagen no puede superar 8 MB.'
    );
  }

  var props = PropertiesService.getScriptProperties();
  var clave = tipo === 'escarapela'
    ? CLAVE_PLANTILLA_ESCARAPELA_
    : CLAVE_PLANTILLA_HABITACION_;
  var anterior = leerPlantillaImpresion_(props, clave);
  var carpeta = obtenerCarpetaPlantillasImpresion_();

  var nombreArchivo = limpiarNombrePlantillaImpresion_(
    archivo.nombre || ('plantilla-' + tipo + '.png'),
    tipo
  );

  var blob = Utilities.newBlob(
    bytes,
    String(archivo.tipo || 'image/png'),
    nombreArchivo
  );

  var file = null;

  try {
    file = carpeta.createFile(blob);

    // No hacemos pública la plantilla. El backend la recupera por fileId,
    // por lo que setSharing(ANYONE_WITH_LINK) era innecesario y podía
    // introducir latencia o fallos en dominios de Google Workspace.
    var dato = {
      fileId: file.getId(),
      nombre: file.getName(),
      tipo: String(archivo.tipo || 'image/png'),
      anchoCm: ancho,
      altoCm: alto,
      carpetaId: carpeta.getId(),
      carpetaNombre: carpeta.getName(),
      carpetaUrl: carpeta.getUrl(),
      actualizado: new Date().toISOString()
    };

    // Primero confirmamos la nueva plantilla como vigente.
    props.setProperty(clave, JSON.stringify(dato));

    // La limpieza de la versión anterior es de mejor esfuerzo. Un fallo al
    // enviarla a la papelera no debe invalidar una carga ya confirmada.
    if (anterior.fileId && anterior.fileId !== dato.fileId) {
      try {
        DriveApp.getFileById(anterior.fileId).setTrashed(true);
      } catch (errorAnterior) {
        // No bloquear el guardado por limpieza histórica.
      }
    }

    // La auditoría tampoco debe revertir una plantilla ya guardada. Se
    // conserva el registro cuando el servicio está disponible.
    if (typeof registrarAuditoria === 'function') {
      try {
        registrarAuditoria({
          usuario: sesion.usuario || '',
          nombre: sesion.nombre || '',
          rol: sesion.rol || '',
          accion: 'CONFIGURAR_PLANTILLA_IMPRESION',
          entidad: 'Sistema',
          idRegistro: tipo,
          resultado: 'EXITOSO',
          detalle: JSON.stringify({
            tipo: tipo,
            anchoCm: ancho,
            altoCm: alto,
            nombre: dato.nombre,
            fileId: dato.fileId,
            carpetaId: dato.carpetaId
          }),
          datosAntes: anterior,
          datosDespues: dato
        });
      } catch (errorAuditoria) {
        console.error(
          'No fue posible registrar auditoría de plantilla de impresión: ' +
            errorAuditoria
        );
      }
    }

    return dato;
  } catch (error) {
    // Si el archivo alcanzó a crearse pero no se pudo confirmar la operación,
    // evitamos dejar un archivo huérfano en Drive.
    if (file) {
      try {
        file.setTrashed(true);
      } catch (errorLimpieza) {
        // No reemplazar el error original.
      }
    }
    throw error;
  }
}

function obtenerDatosGeneracionImpresion(token) {
  validarPermiso(token, 'SISTEMA_GENERAR_ESCARAPELAS_HABITACIONES');

  var caminantes = obtenerCaminantes({}).map(function(c) {
    return {
      id: c.id || '',
      nombre: c.nombre || c.nombreCompleto || '',
      mesa: c.mesa || '',
      habitacion: c.habitacion || ''
    };
  });

  var servidores = obtenerServidores({}).filter(function(s) {
    return Boolean(s.activo);
  });

  var habitaciones = obtenerHabitaciones(
    obtenerCaminantes({}),
    servidores
  ).map(function(h) {
    return {
      id: h.id || h.habitacion || '',
      habitacion: h.habitacion || h.nombre || h.id || '',
      personas: (h.personas || h.personasAsignadas || []).map(function(p) {
        return {
          nombre: p.nombre || '',
          tipoPersona: p.tipoPersona || ''
        };
      })
    };
  });

  return {
    caminantes: caminantes,
    habitaciones: habitaciones
  };
}

function obtenerImagenPlantillaImpresion(token, tipo) {
  validarPermiso(token, 'SISTEMA_GENERAR_ESCARAPELAS_HABITACIONES');

  tipo = String(tipo || '').toLowerCase();
  var props = PropertiesService.getScriptProperties();
  var dato = leerPlantillaImpresion_(
    props,
    tipo === 'escarapela'
      ? CLAVE_PLANTILLA_ESCARAPELA_
      : CLAVE_PLANTILLA_HABITACION_
  );

  if (!dato.fileId) {
    throw crearErrorAplicacion(
      'PLANTILLA_NO_CONFIGURADA',
      'No existe plantilla configurada.'
    );
  }

  var blob = DriveApp.getFileById(dato.fileId).getBlob();
  return {
    base64:
      'data:' +
      blob.getContentType() +
      ';base64,' +
      Utilities.base64Encode(blob.getBytes()),
    anchoCm: dato.anchoCm,
    altoCm: dato.altoCm,
    nombre: dato.nombre
  };
}

function leerPlantillaImpresion_(props, clave) {
  var vacia = {
    fileId: '',
    nombre: '',
    tipo: '',
    anchoCm: '',
    altoCm: '',
    carpetaId: '',
    carpetaNombre: '',
    carpetaUrl: '',
    actualizado: ''
  };

  var raw = props.getProperty(clave);
  if (!raw) return vacia;

  try {
    var dato = JSON.parse(raw);
    return {
      fileId: dato.fileId || '',
      nombre: dato.nombre || '',
      tipo: dato.tipo || '',
      anchoCm: dato.anchoCm || '',
      altoCm: dato.altoCm || '',
      carpetaId: dato.carpetaId || '',
      carpetaNombre: dato.carpetaNombre || '',
      carpetaUrl: dato.carpetaUrl || '',
      actualizado: dato.actualizado || ''
    };
  } catch (e) {
    return vacia;
  }
}

function obtenerCarpetaPlantillasImpresion_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(CLAVE_CARPETA_IMPRESION_);

  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      // La carpeta fue eliminada o ya no es accesible. Se recrea abajo.
    }
  }

  var carpetas = DriveApp.getFoldersByName(NOMBRE_CARPETA_IMPRESION_);
  var carpeta = carpetas.hasNext()
    ? carpetas.next()
    : DriveApp.createFolder(NOMBRE_CARPETA_IMPRESION_);

  props.setProperty(CLAVE_CARPETA_IMPRESION_, carpeta.getId());
  return carpeta;
}

function limpiarNombrePlantillaImpresion_(nombre, tipo) {
  var valor = String(nombre || '').trim();
  if (!valor) valor = 'plantilla-' + tipo + '.png';

  valor = valor
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return valor || ('plantilla-' + tipo + '.png');
}
