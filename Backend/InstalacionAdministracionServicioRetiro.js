/**
 * Instala la administración interna de Angelitos y Serenata.
 * Es idempotente: puede ejecutarse nuevamente.
 */
function instalarAdministracionServicioRetiro() {
  const libro = obtenerLibro();

  asegurarColumnasGestionServicio_(libro.getSheetByName('Angelitos'));
  asegurarColumnasGestionServicio_(libro.getSheetByName('Serenata'));
  instalarParametrosServicioRetiro_(libro);
  instalarRolServicioRetiro_(libro);
  instalarPermisosServicioRetiro_(libro);

  // El catálogo se amplía desde ConfiguracionAlertasService.
  instalarConfiguracionAlertas();

  limpiarCachePermisos();
  limpiarCacheConfiguraciones();

  return {
    instalado: true,
    modulos: ['Angelitos', 'Serenata'],
    mensaje: 'Administración de Servicio al retiro instalada correctamente.'
  };
}

function asegurarColumnasGestionServicio_(hoja) {
  if (!hoja) {
    throw new Error('Primero debes instalar las hojas Angelitos y Serenata.');
  }

  const requeridas = [
    'estadoInscripcion',
    'observacionesGestion',
    'fechaDecision',
    'decididoPor',
    'fechaActualizacion',
    'actualizadoPor'
  ];

  const actuales = hoja
    .getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1))
    .getDisplayValues()[0]
    .map(function(valor){ return normalizarTexto(valor).replace(/\s+/g, ''); });

  requeridas.forEach(function(encabezado) {
    const normalizado = normalizarTexto(encabezado).replace(/\s+/g, '');
    if (actuales.indexOf(normalizado) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(normalizado);
    }
  });
}

function instalarParametrosServicioRetiro_(libro) {
  const parametros = [
    {
      clave:'angelitosWhatsappNotificacionActiva', nombreVisible:'Angelitos · Notificar decisiones por WhatsApp', valor:'Sí', tipo:'Booleano',
      descripcion:'Permite abrir WhatsApp con el mensaje parametrizado después de aprobar o rechazar una inscripción de Angelitos.', activo:'Sí'
    },
    {
      clave:'serenataWhatsappNotificacionActiva', nombreVisible:'Serenata · Notificar decisiones por WhatsApp', valor:'Sí', tipo:'Booleano',
      descripcion:'Permite abrir WhatsApp con el mensaje parametrizado después de aprobar o rechazar una inscripción de Serenata.', activo:'Sí'
    },
    {
      clave:'angelitosWhatsappMensajeAprobado', nombreVisible:'Angelitos · Mensaje WhatsApp de aprobación',
      valor:'Hola {{nombre}} 👋\n\nQueremos contarte que tu inscripción para servir como Angelito fue aprobada. Muy pronto el equipo organizador se pondrá en contacto contigo con las indicaciones necesarias.\n\n¡Gracias por servir! 🙏',
      tipo:'Texto', descripcion:'Variables: {{nombre}}, {{tipoRetiro}}, {{anioRetiro}}, {{servicio}}', activo:'Sí'
    },
    {
      clave:'angelitosWhatsappMensajeRechazado', nombreVisible:'Angelitos · Mensaje WhatsApp de rechazo',
      valor:'Hola {{nombre}}.\n\nLuego de revisar tu inscripción para servir como Angelito, en esta oportunidad no podremos contar con tu participación.\n\n{{motivo}}\n\nGracias por tu disposición para servir.',
      tipo:'Texto', descripcion:'Variables: {{nombre}}, {{motivo}}, {{tipoRetiro}}, {{anioRetiro}}, {{servicio}}', activo:'Sí'
    },
    {
      clave:'serenataWhatsappMensajeAprobado', nombreVisible:'Serenata · Mensaje WhatsApp de aprobación',
      valor:'Hola {{nombre}} 👋\n\nQueremos contarte que tu inscripción para brindar apoyo en nuestro momento especial fue aprobada. Muy pronto te compartiremos las indicaciones necesarias.\n\n¡Gracias por servir! 🙏',
      tipo:'Texto', descripcion:'Variables: {{nombre}}, {{tipoRetiro}}, {{anioRetiro}}, {{servicio}}', activo:'Sí'
    },
    {
      clave:'serenataWhatsappMensajeRechazado', nombreVisible:'Serenata · Mensaje WhatsApp de rechazo',
      valor:'Hola {{nombre}}.\n\nLuego de revisar tu inscripción para apoyarnos, en esta oportunidad no podremos contar con tu participación.\n\n{{motivo}}\n\nGracias por tu disposición para servir.',
      tipo:'Texto', descripcion:'Variables: {{nombre}}, {{motivo}}, {{tipoRetiro}}, {{anioRetiro}}, {{servicio}}', activo:'Sí'
    },
    {
      clave:'campanaAngelitosTitulo', nombreVisible:'Campana · Título de Angelitos pendientes', valor:'{{cantidad}} inscripciones de Angelitos pendientes', tipo:'Texto',
      descripcion:'Título de la campana. Variable: {{cantidad}}', activo:'Sí'
    },
    {
      clave:'campanaAngelitosMensaje', nombreVisible:'Campana · Mensaje de Angelitos pendientes', valor:'Hay nuevas personas inscritas como Angelitos que requieren aprobación o rechazo.', tipo:'Texto',
      descripcion:'Mensaje mostrado en la campana para Angelitos.', activo:'Sí'
    },
    {
      clave:'campanaSerenataTitulo', nombreVisible:'Campana · Título de Serenata pendiente', valor:'{{cantidad}} inscripciones de Serenata pendientes', tipo:'Texto',
      descripcion:'Título de la campana. Variable: {{cantidad}}', activo:'Sí'
    },
    {
      clave:'campanaSerenataMensaje', nombreVisible:'Campana · Mensaje de Serenata pendiente', valor:'Hay nuevas personas inscritas para Serenata que requieren aprobación o rechazo.', tipo:'Texto',
      descripcion:'Mensaje mostrado en la campana para Serenata.', activo:'Sí'
    }
  ];

  parametros.forEach(function(parametro) {
    asegurarParametroServicio_(libro, parametro);
  });
}

function asegurarParametroServicio_(libro, parametro) {
  const hoja = libro.getSheetByName(HOJAS.CONFIGURACIONES);
  if (!hoja) throw new Error('No existe la hoja Configuraciones.');

  const datos = hoja.getDataRange().getDisplayValues();
  const encabezados = (datos[0] || []).map(function(valor) {
    return normalizarTexto(valor).replace(/[^a-z0-9]/g, '');
  });
  const indiceClave = encabezados.indexOf('clave');
  if (indiceClave < 0) throw new Error('La hoja Configuraciones no contiene la columna Clave.');

  const existente = datos.slice(1).some(function(fila) {
    return normalizarTexto(fila[indiceClave]) === normalizarTexto(parametro.clave);
  });
  if (existente) return;

  const fila = new Array(Math.max(hoja.getLastColumn(), encabezados.length)).fill('');
  const asignar = function(nombres, valor) {
    for (let i = 0; i < nombres.length; i += 1) {
      const indice = encabezados.indexOf(nombres[i]);
      if (indice >= 0) { fila[indice] = valor; return; }
    }
  };

  asignar(['clave'], parametro.clave);
  asignar(['nombrevisible','nombre','etiqueta'], parametro.nombreVisible);
  asignar(['valor'], parametro.valor);
  asignar(['tipo'], parametro.tipo);
  asignar(['descripcion'], parametro.descripcion);
  asignar(['activo'], parametro.activo);
  hoja.appendRow(fila);
}

function instalarRolServicioRetiro_(libro) {
  const hoja = libro.getSheetByName(HOJAS.ROLES);
  if (!hoja) throw new Error('No existe la hoja Roles.');

  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(function(valor) {
    return normalizarTexto(valor).replace(/[^a-z0-9]/g, '');
  });

  const indiceRol = encabezados.indexOf('rol');
  const indiceDescripcion = encabezados.indexOf('descripcion');
  const indiceActivo = encabezados.indexOf('activo');

  if (indiceRol < 0) {
    throw new Error('La hoja Roles no contiene la columna Rol.');
  }

  let filaEncontrada = 0;

  for (let i = 1; i < datos.length; i += 1) {
    if (normalizarCodigoRol_(datos[i][indiceRol]) === 'ANGELITOS') {
      filaEncontrada = i + 1;
      break;
    }
  }

  if (!filaEncontrada) {
    const fila = new Array(Math.max(hoja.getLastColumn(), encabezados.length)).fill('');
    fila[indiceRol] = 'ANGELITOS';

    if (indiceDescripcion >= 0) {
      fila[indiceDescripcion] =
        'Servicio al retiro: administración de Angelitos y Serenata.';
    }

    if (indiceActivo >= 0) {
      fila[indiceActivo] = 'Sí';
    }

    hoja.appendRow(fila);
    return;
  }

  if (indiceDescripcion >= 0) {
    hoja
      .getRange(filaEncontrada, indiceDescripcion + 1)
      .setValue('Servicio al retiro: administración de Angelitos y Serenata.');
  }

  if (indiceActivo >= 0) {
    hoja
      .getRange(filaEncontrada, indiceActivo + 1)
      .setValue('Sí');
  }
}

function instalarPermisosServicioRetiro_(libro) {
  const hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);
  if (!hoja) throw new Error('No existe la hoja PermisosRol.');

  const permisos = [
    'SERVICIO_ANGELITOS_VER',
    'SERVICIO_ANGELITOS_GESTIONAR',
    'SERVICIO_ANGELITOS_NOTIFICAR',
    'SERVICIO_SERENATA_VER',
    'SERVICIO_SERENATA_GESTIONAR',
    'SERVICIO_SERENATA_NOTIFICAR'
  ];

  const roles = ['ADMIN', 'ANGELITOS'];
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(function(valor) {
    return normalizarTexto(valor).replace(/[^a-z0-9]/g, '');
  });

  const indiceRol = encabezados.indexOf('rol');
  const indicePermiso = encabezados.indexOf('permiso');
  const indiceActivo = encabezados.indexOf('activo');

  if (indiceRol < 0 || indicePermiso < 0 || indiceActivo < 0) {
    throw new Error('La hoja PermisosRol debe contener Rol, Permiso y Activo.');
  }

  roles.forEach(function(rol) {
    permisos.forEach(function(permiso) {
      let filaEncontrada = 0;

      for (let i = 1; i < datos.length; i += 1) {
        if (
          normalizarCodigoRol_(datos[i][indiceRol]) === normalizarCodigoRol_(rol) &&
          normalizarPermiso(datos[i][indicePermiso]) === permiso
        ) {
          filaEncontrada = i + 1;
          break;
        }
      }

      if (filaEncontrada) {
        // Si existía pero estaba apagado, el instalador base lo deja operativo.
        hoja
          .getRange(filaEncontrada, indiceActivo + 1)
          .setValue('Sí');
      } else {
        const fila = new Array(Math.max(hoja.getLastColumn(), encabezados.length)).fill('');
        fila[indiceRol] = rol;
        fila[indicePermiso] = permiso;
        fila[indiceActivo] = 'Sí';
        hoja.appendRow(fila);

        // Mantener datos locales sincronizados para evitar duplicados
        // dentro de la misma ejecución.
        datos.push(fila);
      }
    });
  });
}
