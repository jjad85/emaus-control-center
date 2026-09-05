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

function guardarPlantillaImpresion(token, tipo, archivo, anchoCm, altoCm, tamanoCentralPt, tamanoInferiorPt, fuente) {
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

  var valoresDefecto = obtenerValoresTextoPlantillaImpresion_(tipo);
  var tamanoCentral = Number(tamanoCentralPt || valoresDefecto.tamanoCentralPt);
  var tamanoInferior = Number(tamanoInferiorPt || valoresDefecto.tamanoInferiorPt);
  var fuenteNormalizada = normalizarFuentePlantillaImpresion_(fuente || valoresDefecto.fuente);

  if (!(tamanoCentral >= 6 && tamanoCentral <= 72)) {
    throw crearErrorAplicacion(
      'TAMANO_LETRA_CENTRAL_INVALIDO',
      'El tamaño de letra central debe estar entre 6 y 72 puntos.'
    );
  }

  if (!(tamanoInferior >= 6 && tamanoInferior <= 48)) {
    throw crearErrorAplicacion(
      'TAMANO_LETRA_INFERIOR_INVALIDO',
      'El tamaño de letra inferior debe estar entre 6 y 48 puntos.'
    );
  }

  var props = PropertiesService.getScriptProperties();
  var clave = tipo === 'escarapela'
    ? CLAVE_PLANTILLA_ESCARAPELA_
    : CLAVE_PLANTILLA_HABITACION_;
  var anterior = leerPlantillaImpresion_(props, clave);
  var reemplazaImagen = Boolean(
    archivo &&
    archivo.base64 &&
    /^image\//i.test(String(archivo.tipo || ''))
  );

  // La imagen y la parametrización son independientes. Solo se exige imagen
  // en la primera configuración; si ya existe una, se pueden guardar ancho,
  // alto, tamaños de letra y tipografía sin volver a cargarla.
  if (!reemplazaImagen && !anterior.fileId) {
    throw crearErrorAplicacion(
      'IMAGEN_REQUERIDA',
      'Seleccione una imagen para configurar la plantilla por primera vez.'
    );
  }

  var dato = {
    fileId: anterior.fileId || '',
    nombre: anterior.nombre || '',
    tipo: anterior.tipo || '',
    anchoCm: ancho,
    altoCm: alto,
    tamanoCentralPt: tamanoCentral,
    tamanoInferiorPt: tamanoInferior,
    fuente: fuenteNormalizada,
    carpetaId: anterior.carpetaId || '',
    carpetaNombre: anterior.carpetaNombre || '',
    carpetaUrl: anterior.carpetaUrl || '',
    actualizado: new Date().toISOString()
  };

  var file = null;

  try {
    if (reemplazaImagen) {
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

      file = carpeta.createFile(blob);
      dato.fileId = file.getId();
      dato.nombre = file.getName();
      dato.tipo = String(archivo.tipo || 'image/png');
      dato.carpetaId = carpeta.getId();
      dato.carpetaNombre = carpeta.getName();
      dato.carpetaUrl = carpeta.getUrl();
    }

    // Confirmar en propiedades tanto cambios de imagen como cambios solo de parámetros.
    props.setProperty(clave, JSON.stringify(dato));

    // Solo eliminar la imagen anterior cuando efectivamente fue reemplazada.
    if (reemplazaImagen && anterior.fileId && anterior.fileId !== dato.fileId) {
      try {
        DriveApp.getFileById(anterior.fileId).setTrashed(true);
      } catch (errorAnterior) {
        // No bloquear el guardado por limpieza histórica.
      }
    }

    if (typeof registrarAuditoria === 'function') {
      try {
        registrarAuditoria({
          usuario: sesion.usuario || '',
          nombre: sesion.nombre || '',
          rol: sesion.rol || '',
          accion: reemplazaImagen
            ? 'CONFIGURAR_PLANTILLA_IMPRESION'
            : 'ACTUALIZAR_PARAMETROS_PLANTILLA_IMPRESION',
          entidad: 'Sistema',
          idRegistro: tipo,
          resultado: 'EXITOSO',
          detalle: JSON.stringify({
            tipo: tipo,
            reemplazaImagen: reemplazaImagen,
            anchoCm: ancho,
            altoCm: alto,
            tamanoCentralPt: tamanoCentral,
            tamanoInferiorPt: tamanoInferior,
            fuente: fuenteNormalizada,
            nombre: dato.nombre,
            fileId: dato.fileId
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
    // Si una NUEVA imagen alcanzó a crearse pero la operación no se confirmó,
    // se limpia. Nunca se toca la imagen ya existente al guardar solo parámetros.
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

  // Fuentes maestras de asignación:
  // - El catálogo/número de habitación sale de la hoja Habitaciones.
  // - Las personas asignadas se obtienen filtrando Caminantes y Servidores
  //   por su columna Habitacion.
  // - El tipo de persona lo determina la hoja de origen.
  // - La mesa se resuelve a partir del consolidado de Mesas, no de la
  //   habitación, para que solo se imprima cuando exista esa asignación.
  var caminantesFuente = obtenerCaminantes({});
  var servidoresFuente = obtenerServidores({}).filter(function(s) {
    return Boolean(s.activo);
  });
  var mesas = obtenerMesas(caminantesFuente, servidoresFuente);

  var mapaMesas = construirMapaMesasImpresion_(mesas);

  var caminantes = caminantesFuente.map(function(c) {
    return {
      id: c.id || '',
      nombre: obtenerNombreCompletoImpresion_(c),
      mesa: buscarMesaPersonaImpresion_(mapaMesas.caminantes, c),
      habitacion: c.habitacion || ''
    };
  });

  // Se parte directamente de la hoja Habitaciones para garantizar que la
  // marcación use exactamente los números allí configurados. La ocupación no
  // se toma de esa hoja: se reconstruye cruzando la columna Habitacion de las
  // hojas Caminantes y Servidores.
  var registrosHabitaciones = leerHojaComoObjetos(HOJAS.HABITACIONES);

  var habitaciones = registrosHabitaciones
    .map(function(registro) {
      var numeroHabitacion = String(
        registro.habitacion ||
        registro.nombre ||
        registro.id ||
        ''
      ).trim();

      var claveHabitacion = normalizarHabitacionImpresion_(numeroHabitacion);
      var personas = [];

      caminantesFuente
        .filter(function(caminante) {
          return (
            claveHabitacion &&
            normalizarHabitacionImpresion_(caminante.habitacion) === claveHabitacion
          );
        })
        .forEach(function(caminante) {
          personas.push({
            id: caminante.id || '',
            nombre: obtenerNombreCompletoImpresion_(caminante),
            tipoPersona: 'Caminante',
            mesa: buscarMesaPersonaImpresion_(mapaMesas.caminantes, caminante)
          });
        });

      servidoresFuente
        .filter(function(servidor) {
          return (
            claveHabitacion &&
            normalizarHabitacionImpresion_(servidor.habitacion) === claveHabitacion
          );
        })
        .forEach(function(servidor) {
          var mesaServidor = buscarMesaPersonaImpresion_(mapaMesas.servidores, servidor);
          personas.push({
            id: servidor.id || '',
            nombre: obtenerNombreCompletoImpresion_(servidor),
            tipoPersona: 'Servidor',
            mesa: mesaServidor,
            rolMesa: mesaServidor ? obtenerRolMesaImpresion_(servidor) : '',
            equipo: mesaServidor ? '' : obtenerEquipoServidorImpresion_(servidor)
          });
        });

      return {
        id: registro.id || numeroHabitacion,
        habitacion: numeroHabitacion,
        personas: personas
      };
    })
    .filter(function(habitacion) {
      return Boolean(String(habitacion.habitacion || '').trim());
    });

  return {
    caminantes: caminantes,
    habitaciones: habitaciones
  };
}

/**
 * Construye índices de pertenencia a mesa usando el resultado oficial de
 * obtenerMesas(). Para caminantes se toma mesa.caminantes; para servidores,
 * los servidores de mesa expuestos por el consolidado (líder y colíder).
 */
function construirMapaMesasImpresion_(mesas) {
  var mapa = {
    caminantes: { porId: {}, porNombre: {} },
    servidores: { porId: {}, porNombre: {} }
  };

  (mesas || []).forEach(function(mesa) {
    var numero = String(mesa.numero || '').trim();
    if (!numero) {
      return;
    }

    (mesa.caminantes || []).forEach(function(caminante) {
      registrarMesaPersonaImpresion_(mapa.caminantes, caminante, numero);
    });

    if (mesa.lider) {
      registrarMesaPersonaImpresion_(mapa.servidores, mesa.lider, numero);
    }
    if (mesa.colider) {
      registrarMesaPersonaImpresion_(mapa.servidores, mesa.colider, numero);
    }
  });

  return mapa;
}

function registrarMesaPersonaImpresion_(mapa, persona, numeroMesa) {
  if (!persona) {
    return;
  }

  var id = String(persona.id || '').trim();
  var nombre = normalizarTexto(obtenerNombreCompletoImpresion_(persona));

  if (id) {
    mapa.porId[id] = numeroMesa;
  }
  if (nombre) {
    mapa.porNombre[nombre] = numeroMesa;
  }
}

function buscarMesaPersonaImpresion_(mapa, persona) {
  if (!mapa || !persona) {
    return '';
  }

  var id = String(persona.id || '').trim();
  if (id && mapa.porId[id]) {
    return mapa.porId[id];
  }

  var nombre = normalizarTexto(obtenerNombreCompletoImpresion_(persona));
  return nombre && mapa.porNombre[nombre]
    ? mapa.porNombre[nombre]
    : '';
}


/**
 * Para servidores asignados a una mesa, el rol se toma de la columna ROL
 * (o de rolMesa cuando la estructura nueva ya la separó). Se normaliza solo
 * la etiqueta de impresión, sin alterar el dato almacenado en la hoja.
 */
function obtenerRolMesaImpresion_(servidor) {
  if (!servidor) {
    return '';
  }

  var valor = String(servidor.rolMesa || servidor.rol || '').trim();
  var normalizado = normalizarTexto(valor);

  if (normalizado === 'lider' || normalizado === 'líder') {
    return 'Líder';
  }
  if (normalizado === 'colider' || normalizado === 'colíder') {
    return 'Colíder';
  }

  return valor;
}

/**
 * Si el servidor no pertenece a una mesa, la marcación muestra el equipo
 * asignado en la hoja Servidores. El valor técnico "Mesa" no se imprime como
 * equipo porque representa una asignación de mesa, no un equipo de apoyo.
 */
function obtenerEquipoServidorImpresion_(servidor) {
  if (!servidor) {
    return '';
  }

  var equipo = String(servidor.equipo || '').trim();
  return normalizarTexto(equipo) === 'mesa' ? '' : equipo;
}

/**
 * Prioriza los campos separados para garantizar que la marcación incluya
 * nombres y apellidos. Si un registro antiguo no los tiene, conserva el
 * nombre completo existente como respaldo.
 */
function obtenerNombreCompletoImpresion_(persona) {
  var nombreConstruido = construirNombreCompletoPersona(
    persona.primerNombre || '',
    persona.segundoNombre || '',
    persona.primerApellido || '',
    persona.segundoApellido || ''
  );

  return nombreConstruido || persona.nombre || persona.nombreCompleto || '';
}

function normalizarHabitacionImpresion_(valor) {
  var texto = String(valor || '').trim();
  if (!texto) {
    return '';
  }

  texto = texto.replace(/^habitaci[oó]n\s*/i, '').trim();

  // Si ambos lados son números, 01 y 1 deben representar la misma habitación.
  if (/^\d+(?:\.0+)?$/.test(texto)) {
    return String(Number(texto));
  }

  return normalizarTexto(texto);
}


function guardarConfiguracionPlantillaImpresion(token, tipo, anchoCm, altoCm, tamanoCentralPt, tamanoInferiorPt, fuente) {
  var sesion = validarPermiso(
    token,
    'SISTEMA_CONFIGURAR_PLANTILLAS_IMPRESION'
  );

  tipo = String(tipo || '').toLowerCase().trim();
  if (['escarapela', 'habitacion'].indexOf(tipo) < 0) {
    throw crearErrorAplicacion('TIPO_PLANTILLA_INVALIDO', 'Tipo de plantilla inválido.');
  }

  var ancho = Number(anchoCm);
  var alto = Number(altoCm);
  if (!(ancho > 0 && alto > 0 && ancho <= 50 && alto <= 50)) {
    throw crearErrorAplicacion(
      'DIMENSIONES_INVALIDAS',
      'Indique ancho y alto válidos en centímetros.'
    );
  }

  var valoresDefecto = obtenerValoresTextoPlantillaImpresion_(tipo);
  var tamanoCentral = Number(tamanoCentralPt || valoresDefecto.tamanoCentralPt);
  var tamanoInferior = Number(tamanoInferiorPt || valoresDefecto.tamanoInferiorPt);
  var fuenteNormalizada = normalizarFuentePlantillaImpresion_(fuente || valoresDefecto.fuente);

  if (!(tamanoCentral >= 6 && tamanoCentral <= 72)) {
    throw crearErrorAplicacion(
      'TAMANO_LETRA_CENTRAL_INVALIDO',
      'El tamaño de letra central debe estar entre 6 y 72 puntos.'
    );
  }

  if (!(tamanoInferior >= 6 && tamanoInferior <= 48)) {
    throw crearErrorAplicacion(
      'TAMANO_LETRA_INFERIOR_INVALIDO',
      'El tamaño de letra inferior debe estar entre 6 y 48 puntos.'
    );
  }

  var props = PropertiesService.getScriptProperties();
  var clave = tipo === 'escarapela'
    ? CLAVE_PLANTILLA_ESCARAPELA_
    : CLAVE_PLANTILLA_HABITACION_;
  var anterior = leerPlantillaImpresion_(props, clave);

  if (!anterior.fileId) {
    throw crearErrorAplicacion(
      'IMAGEN_REQUERIDA',
      'Primero debe configurar una imagen para esta plantilla.'
    );
  }

  var dato = {
    fileId: anterior.fileId,
    nombre: anterior.nombre || '',
    tipo: anterior.tipo || '',
    anchoCm: ancho,
    altoCm: alto,
    tamanoCentralPt: tamanoCentral,
    tamanoInferiorPt: tamanoInferior,
    fuente: fuenteNormalizada,
    carpetaId: anterior.carpetaId || '',
    carpetaNombre: anterior.carpetaNombre || '',
    carpetaUrl: anterior.carpetaUrl || '',
    actualizado: new Date().toISOString()
  };

  props.setProperty(clave, JSON.stringify(dato));

  if (typeof registrarAuditoria === 'function') {
    try {
      registrarAuditoria({
        usuario: sesion.usuario || '',
        nombre: sesion.nombre || '',
        rol: sesion.rol || '',
        accion: 'ACTUALIZAR_PARAMETROS_PLANTILLA_IMPRESION',
        entidad: 'Sistema',
        idRegistro: tipo,
        resultado: 'EXITOSO',
        detalle: JSON.stringify({
          tipo: tipo,
          anchoCm: ancho,
          altoCm: alto,
          tamanoCentralPt: tamanoCentral,
          tamanoInferiorPt: tamanoInferior,
          fuente: fuenteNormalizada,
          nombre: dato.nombre
        })
      });
    } catch (e) {
      // La auditoría no debe bloquear el guardado de parámetros.
    }
  }

  return dato;
}

function obtenerImagenPlantillaImpresion(token, tipo) {
  validarAccesoPlantillaImpresion_(token);

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
    tamanoCentralPt: dato.tamanoCentralPt,
    tamanoInferiorPt: dato.tamanoInferiorPt,
    fuente: dato.fuente,
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
    tamanoCentralPt: '',
    tamanoInferiorPt: '',
    fuente: 'helvetica',
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
      tamanoCentralPt: dato.tamanoCentralPt || '',
      tamanoInferiorPt: dato.tamanoInferiorPt || '',
      fuente: normalizarFuentePlantillaImpresion_(dato.fuente || 'helvetica'),
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


function obtenerValoresTextoPlantillaImpresion_(tipo) {
  return String(tipo || '').toLowerCase() === 'escarapela'
    ? { tamanoCentralPt: 20, tamanoInferiorPt: 11, fuente: 'helvetica' }
    : { tamanoCentralPt: 18, tamanoInferiorPt: 10, fuente: 'helvetica' };
}

function normalizarFuentePlantillaImpresion_(fuente) {
  var valor = String(fuente || 'helvetica').toLowerCase().trim();
  return ['adlam', 'helvetica', 'times', 'courier'].indexOf(valor) >= 0
    ? valor
    : 'helvetica';
}

function validarAccesoPlantillaImpresion_(token) {
  var sesion = obtenerSesion(token);
  var permisos = obtenerPermisosPorRol(sesion.rol) || [];
  var esAdmin = normalizarCodigoRol_(sesion.rol) === 'admin';
  var puedeConfigurar = permisos.indexOf('SISTEMA_CONFIGURAR_PLANTILLAS_IMPRESION') >= 0;
  var puedeGenerar = permisos.indexOf('SISTEMA_GENERAR_ESCARAPELAS_HABITACIONES') >= 0;

  if (!esAdmin && !puedeConfigurar && !puedeGenerar) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permisos para consultar la plantilla de impresión.'
    );
  }

  return sesion;
}
