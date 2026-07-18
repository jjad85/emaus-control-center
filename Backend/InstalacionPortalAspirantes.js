/**
 * ============================================================
 * INSTALACIÓN PORTAL PÚBLICO Y ASPIRANTES
 * ============================================================
 */

function instalarPortalPublicoYAspirantes() {
  instalarHojaAspirantes();
  instalarConfiguracionPortal();
  instalarPermisosAspirantes();

  return {
    mensaje:
      'Portal público y aspirantes instalados correctamente.'
  };
}

function instalarHojaAspirantes() {
  const libro =
    obtenerLibro();

  let hoja =
    libro.getSheetByName(
      HOJAS.ASPIRANTES
    );

  if (!hoja) {
    hoja =
      libro.insertSheet(
        HOJAS.ASPIRANTES
      );
  }

  if (
    hoja.getLastRow() > 0
  ) {
    return;
  }

  const encabezados = [
    'ID',
    'Número Inscripción',
    'Nombre Completo',
    'Documento Identidad',
    'Dirección Residencia',
    'Fecha Nacimiento',
    'Edad',
    'Barrio',
    'Teléfono',
    'Celular',
    'Estado Civil',
    'Parroquia',
    'Sufre Enfermedad',
    'Enfermedad Cual',
    'Toma Medicamento',
    'Medicamento Cual',
    'Horarios Medicamentos',
    'EPS',
    'Profesión Ocupación',
    'Tiene Limitación Física',
    'Limitación Cual',
    'Sacramentos Recibidos',
    'Talla Camisa',
    'Contacto 1 Nombre',
    'Contacto 1 Parentesco',
    'Contacto 1 Celular',
    'Contacto 2 Nombre',
    'Contacto 2 Parentesco',
    'Contacto 2 Celular',
    'Cómo Se Enteró',
    'Nombre Persona Invitó',
    'Celular Persona Invitó',
    'Persona Conocida Asistirá',
    'Nombre Persona Conocida',
    'Autoriza Tratamiento Datos',
    'Estado Solicitud',
    'Observaciones Gestión',
    'Caminante ID',
    'Activo',
    'Fecha Registro',
    'Fecha Actualización',
    'Actualizado Por'
  ];

  hoja
    .getRange(
      1,
      1,
      1,
      encabezados.length
    )
    .setValues([
      encabezados
    ])
    .setFontWeight(
      'bold'
    )
    .setBackground(
      '#173b34'
    )
    .setFontColor(
      '#ffffff'
    );

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(
    1,
    encabezados.length
  );

  const reglaEstado =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        ESTADOS_ASPIRANTE,
        true
      )
      .setAllowInvalid(false)
      .build();

  hoja
    .getRange(
      2,
      36,
      hoja.getMaxRows() - 1,
      1
    )
    .setDataValidation(
      reglaEstado
    );
}

function instalarConfiguracionPortal() {
  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  const existentes =
    leerHojaComoObjetos(
      HOJAS.CONFIGURACIONES
    );

  const contenido = [
    [
      'portalTitulo',
      'Retiro de Emaús',
      'Texto',
      'Título principal del portal público',
      'Sí'
    ],
    [
      'portalSubtitulo',
      'Una experiencia para detenernos, encontrarnos y comenzar de nuevo.',
      'Texto',
      'Subtítulo del portal público',
      'Sí'
    ],
    [
      'portalContenidoHtml',
      '<h2>Información sobre el retiro</h2><p>Bienvenido al Retiro de Emaús. Este espacio ha sido preparado para vivir una experiencia de encuentro, reflexión y comunidad.</p><p><strong>Completa el formulario de inscripción</strong> con información verdadera y actualizada. El equipo organizador se comunicará contigo para confirmar disponibilidad, pago y demás indicaciones.</p><h3>¿Qué debes llevar?</h3><p>Ropa cómoda, elementos de aseo personal y todo lo indicado por el equipo organizador.</p><h3>Importante</h3><p>El envío del formulario no garantiza automáticamente el cupo. La participación se confirma cuando el equipo organizador valida la inscripción y el pago.</p>',
      'HTML',
      'Contenido con formato mostrado en el portal. Acepta etiquetas HTML básicas.',
      'Sí'
    ],
    [
      'portalRegistroActivo',
      'Sí',
      'Booleano',
      'Permite abrir o cerrar inscripciones',
      'Sí'
    ],
    [
      'portalMensajeRegistroCerrado',
      'Las inscripciones se encuentran cerradas temporalmente.',
      'Texto',
      'Mensaje mostrado cuando el registro está cerrado',
      'Sí'
    ],
    [
      'portalTextoBotonRegistro',
      'Registrarme al retiro',
      'Texto',
      'Texto del botón público de registro',
      'Sí'
    ],
    [
      'portalTextoBotonLogin',
      'Ingresar al centro de control',
      'Texto',
      'Texto del botón de autenticación',
      'Sí'
    ],
    [
      'portalMensajeConfirmacion',
      'Gracias por registrarte. El equipo del retiro revisará tu información y se comunicará contigo.',
      'Texto',
      'Mensaje después de enviar la inscripción',
      'Sí'
    ],
    [
      'portalPrefijoInscripcion',
      'H',
      'Texto',
      'Prefijo para el número de inscripción',
      'Sí'
    ]
  ];

  const nuevas =
    contenido.filter(
      function(item) {
        return !existentes.some(
          function(actual) {
            return (
              normalizarTexto(
                actual.clave
              ) ===
              normalizarTexto(
                item[0]
              )
            );
          }
        );
      }
    );

  if (nuevas.length > 0) {
    hoja
      .getRange(
        hoja.getLastRow() + 1,
        1,
        nuevas.length,
        5
      )
      .setValues(
        nuevas
      );
  }
}

function instalarPermisosAspirantes() {
  const hoja =
    obtenerHoja(
      HOJAS.PERMISOS_ROL
    );

  const existentes =
    leerHojaComoObjetos(
      HOJAS.PERMISOS_ROL
    );

  const permisos = [
    [
      'Administrador',
      'CONSULTAR_ASPIRANTES',
      'Sí'
    ],
    [
      'Administrador',
      'ACTUALIZAR_ESTADO_ASPIRANTE',
      'Sí'
    ],
    [
      'Administrador',
      'CONVERTIR_ASPIRANTE',
      'Sí'
    ],
    [
      'Registro',
      'CONSULTAR_ASPIRANTES',
      'Sí'
    ],
    [
      'Registro',
      'ACTUALIZAR_ESTADO_ASPIRANTE',
      'Sí'
    ],
    [
      'Registro',
      'CONVERTIR_ASPIRANTE',
      'Sí'
    ]
  ];

  const nuevas =
    permisos.filter(
      function(item) {
        return !existentes.some(
          function(actual) {
            return (
              normalizarTexto(
                actual.rol
              ) ===
                normalizarTexto(
                  item[0]
                ) &&
              normalizarTexto(
                actual.permiso
              ) ===
                normalizarTexto(
                  item[1]
                )
            );
          }
        );
      }
    );

  if (nuevas.length > 0) {
    hoja
      .getRange(
        hoja.getLastRow() + 1,
        1,
        nuevas.length,
        3
      )
      .setValues(
        nuevas
      );
  }

  limpiarCachePermisos();
}
