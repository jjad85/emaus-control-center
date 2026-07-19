/**
 * ============================================================
 * INSTALACIÓN DE CONSENTIMIENTOS PARA ASPIRANTES
 * ============================================================
 *
 * Ejecutar una sola vez:
 *
 * instalarConsentimientosAspirantes();
 *
 * La función:
 * - agrega columnas faltantes en Aspirantes;
 * - crea parámetros legales en Configuraciones;
 * - no borra registros existentes;
 * - limpia la caché de configuraciones.
 */

function instalarConsentimientosAspirantes() {
  instalarColumnasConsentimientosAspirantes();
  instalarParametrosConsentimientosAspirantes();

  limpiarCacheConfiguraciones();

  return {
    mensaje:
      'Consentimientos parametrizados instalados correctamente.'
  };
}

function instalarColumnasConsentimientosAspirantes() {
  const hoja =
    obtenerHoja(
      HOJAS.ASPIRANTES
    );

  const columnas = [
    'Versión Autorización Datos',
    'Fecha Aceptación Datos',
    'Texto Autorización Datos',
    'Autoriza Fotografías',
    'Versión Autorización Fotografías',
    'Fecha Aceptación Fotografías',
    'Texto Autorización Fotografías'
  ];

  const ultimaColumna =
    Math.max(
      hoja.getLastColumn(),
      1
    );

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  const normalizados =
    encabezados.map(
      function(valor) {
        return normalizarTexto(
          valor
        );
      }
    );

  const faltantes =
    columnas.filter(
      function(columna) {
        return (
          normalizados.indexOf(
            normalizarTexto(
              columna
            )
          ) === -1
        );
      }
    );

  if (!faltantes.length) {
    return;
  }

  hoja
    .getRange(
      1,
      hoja.getLastColumn() + 1,
      1,
      faltantes.length
    )
    .setValues([
      faltantes
    ])
    .setFontWeight('bold')
    .setBackground('#173b34')
    .setFontColor('#ffffff');

  hoja.autoResizeColumns(
    hoja.getLastColumn() -
      faltantes.length +
      1,
    faltantes.length
  );
}

function instalarParametrosConsentimientosAspirantes() {
  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  const existentes =
    leerHojaComoObjetos(
      HOJAS.CONFIGURACIONES
    );

  const parametros = [
    [
      'portalAutorizacionDatosTitulo',
      'Autorización para el tratamiento de datos personales',
      'Texto',
      'Título mostrado en la autorización obligatoria.',
      'Sí'
    ],
    [
      'portalAutorizacionDatosVersion',
      '1.0',
      'Texto',
      'Versión del texto de autorización de datos.',
      'Sí'
    ],
    [
      'portalAutorizacionDatosTextoAceptacion',
      'He leído y acepto la autorización para el tratamiento de mis datos personales.',
      'Texto',
      'Texto mostrado junto a la casilla obligatoria.',
      'Sí'
    ],
    [
      'portalAutorizacionDatosTextoHtml',
      '<p><strong>[NOMBRE DEL RESPONSABLE]</strong>, identificado con NIT o documento <strong>[NÚMERO]</strong>, con domicilio en <strong>[CIUDAD]</strong>, correo <strong>[CORREO]</strong> y teléfono <strong>[TELÉFONO]</strong>, informa que será responsable del tratamiento de los datos personales suministrados en este formulario.</p><p>Al aceptar, el titular autoriza de manera previa, expresa e informada la recolección, almacenamiento, uso, circulación, actualización y, cuando corresponda, supresión de sus datos personales para las siguientes finalidades:</p><ul><li>Gestionar la preinscripción, evaluación, confirmación y participación en el retiro.</li><li>Contactar al aspirante y a sus contactos de emergencia.</li><li>Organizar alojamiento, alimentación, transporte, salud, seguridad y demás actividades logísticas.</li><li>Atender situaciones médicas o de emergencia durante la actividad.</li><li>Conservar soportes administrativos e históricos relacionados con la participación.</li></ul><p>El formulario puede incluir datos sensibles relacionados con salud. El titular entiende que no está obligado a autorizar datos sensibles; sin embargo, cuando sean necesarios para proteger su salud y seguridad durante el retiro, la falta de información puede impedir la adecuada gestión de su participación.</p><p>Como titular, puede conocer, actualizar, rectificar y solicitar la supresión de sus datos; solicitar prueba de la autorización; ser informado sobre el uso dado a sus datos; presentar consultas o reclamos; y revocar la autorización cuando legalmente proceda. Para ejercer estos derechos puede escribir a <strong>[CORREO DE PROTECCIÓN DE DATOS]</strong>.</p><p>La Política de Tratamiento de Datos Personales puede consultarse en <strong>[ENLACE O MEDIO DE CONSULTA]</strong>.</p>',
      'Texto',
      'HTML completo y parametrizable de la autorización obligatoria. Reemplace los valores entre corchetes.',
      'Sí'
    ],
    [
      'portalAutorizacionFotosTitulo',
      'Autorización de fotografías y material audiovisual',
      'Texto',
      'Título de la autorización opcional de imágenes.',
      'Sí'
    ],
    [
      'portalAutorizacionFotosVersion',
      '1.0',
      'Texto',
      'Versión del texto de autorización audiovisual.',
      'Sí'
    ],
    [
      'portalAutorizacionFotosTextoAceptacion',
      'Autorizo el uso de fotografías y material audiovisual conforme al texto informado.',
      'Texto',
      'Texto mostrado junto a la casilla opcional.',
      'Sí'
    ],
    [
      'portalAutorizacionFotosTextoHtml',
      '<p>Autorizo de manera libre, previa, expresa e informada la captura y el uso de fotografías, videos y demás material audiovisual en el que pueda aparecer durante el retiro.</p><p>El material podrá utilizarse para memoria interna de la comunidad y, cuando se indique expresamente, para comunicaciones institucionales relacionadas con sus actividades. Esta autorización no permite usos comerciales ajenos a dichas finalidades.</p><p>Entiendo que esta autorización es <strong>opcional</strong>, que puedo negarme sin que ello impida mi inscripción y que puedo solicitar su revocatoria para usos futuros escribiendo a <strong>[CORREO DE PROTECCIÓN DE DATOS]</strong>, sin afectar tratamientos realizados previamente de forma legítima.</p>',
      'Texto',
      'HTML completo y parametrizable de la autorización opcional de fotografías.',
      'Sí'
    ]
  ];

  const nuevas =
    parametros.filter(
      function(parametro) {
        return !existentes.some(
          function(actual) {
            return (
              normalizarTexto(
                actual.clave
              ) ===
              normalizarTexto(
                parametro[0]
              )
            );
          }
        );
      }
    );

  if (!nuevas.length) {
    return;
  }

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
