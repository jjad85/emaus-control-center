/**
 * ============================================================
 * INSTALACIÓN DEL TEMA VISUAL — EMAÚS
 * ============================================================
 *
 * Este archivo usa la infraestructura existente del proyecto:
 *
 * - HOJAS.CONFIGURACIONES
 * - obtenerHoja()
 * - obtenerLibro()
 * - limpiarCacheConfiguraciones()
 *
 * No utiliza getActiveSpreadsheet(), PropertiesService
 * ni requiere configurar nuevamente el ID del libro.
 *
 * EJECUCIÓN:
 * 1. Reemplazar completamente el archivo anterior
 *    InstalacionTemaVisual.gs por este.
 * 2. Guardar el proyecto.
 * 3. Ejecutar instalarTemaVisualEmaus().
 */

/**
 * Instala o actualiza los parámetros visuales.
 *
 * Los parámetros que ya existen conservan su valor actual.
 * Solo se actualizan Tipo, Descripción y Activo.
 *
 * Los parámetros que no existen son agregados con
 * el valor predeterminado.
 */
function instalarTemaVisualEmaus() {
  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  validarEstructuraConfiguracionesTema_(
    hoja
  );

  const parametros =
    obtenerParametrosTemaVisual_();

  const mapaFilas =
    construirMapaConfiguracionesTema_(
      hoja
    );

  let creados = 0;
  let actualizados = 0;

  parametros.forEach(
    function(parametro) {
      const clave =
        parametro.clave;

      const numeroFila =
        mapaFilas[clave];

      if (numeroFila) {
        actualizarMetadatosParametroTema_(
          hoja,
          numeroFila,
          parametro
        );

        actualizados++;
        return;
      }

      agregarParametroTema_(
        hoja,
        parametro
      );

      creados++;
    }
  );

  aplicarFormatoConfiguracionesTema_(
    hoja
  );

  limpiarCacheConfiguraciones();

  SpreadsheetApp.flush();

  const resultado = {
    instalado: true,
    creados: creados,
    actualizados: actualizados,
    total: parametros.length
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/**
 * Define todos los parámetros visuales e institucionales.
 */
function obtenerParametrosTemaVisual_() {
  return [
    crearParametroTema_(
      'temaNombre',
      'Emaús Verde',
      'Texto',
      'Nombre interno del tema visual.'
    ),

    crearParametroTema_(
      'temaModo',
      'claro',
      'Texto',
      'Modo visual de la plataforma: claro u oscuro.'
    ),

    crearParametroTema_(
      'sistemaNombre',
      'Centro de Control Emaús',
      'Texto',
      'Nombre visible de la plataforma.'
    ),

    crearParametroTema_(
      'sistemaSubtitulo',
      'Gestión integral del retiro',
      'Texto',
      'Subtítulo visible de la plataforma.'
    ),

    crearParametroTema_(
      'sistemaAutor',
      'Juan José Arango Díaz',
      'Texto',
      'Autor mostrado discretamente en el pie de página.'
    ),

    crearParametroTema_(
      'sistemaVersion',
      'v2.0',
      'Texto',
      'Versión visible de la plataforma.'
    ),

    crearParametroTema_(
      'sistemaFooter',
      'Comunidad Emaús Santa Teresita del Niño Jesús',
      'Texto',
      'Texto institucional del pie de página.'
    ),

    crearParametroTema_(
      'temaColorPrimario',
      '#173B34',
      'Texto',
      'Color principal del menú y de la barra móvil.'
    ),

    crearParametroTema_(
      'temaColorPrimarioOscuro',
      '#0F2A25',
      'Texto',
      'Color oscuro para contraste, énfasis y estados hover.'
    ),

    crearParametroTema_(
      'temaColorSecundario',
      '#9FD0C3',
      'Texto',
      'Color secundario para avatares, indicadores y detalles.'
    ),

    crearParametroTema_(
      'temaColorAcento',
      '#C89B3C',
      'Texto',
      'Color de acento para llamados importantes.'
    ),

    crearParametroTema_(
      'temaColorFondo',
      '#F5F7F6',
      'Texto',
      'Color de fondo general de la aplicación.'
    ),

    crearParametroTema_(
      'temaColorTarjetas',
      '#FFFFFF',
      'Texto',
      'Color de fondo de tarjetas, diálogos y superficies.'
    ),

    crearParametroTema_(
      'temaColorTexto',
      '#1F2937',
      'Texto',
      'Color principal del texto.'
    ),

    crearParametroTema_(
      'temaColorTextoSecundario',
      '#667085',
      'Texto',
      'Color del texto secundario.'
    ),

    crearParametroTema_(
      'temaColorTextoMenu',
      '#FFFFFF',
      'Texto',
      'Color del texto del menú lateral.'
    ),

    crearParametroTema_(
      'temaColorIconosMenu',
      '#FFFFFF',
      'Texto',
      'Color de los iconos del menú lateral.'
    ),

    crearParametroTema_(
      'temaColorExito',
      '#2E7D32',
      'Texto',
      'Color para estados exitosos.'
    ),

    crearParametroTema_(
      'temaColorAdvertencia',
      '#ED6C02',
      'Texto',
      'Color para advertencias.'
    ),

    crearParametroTema_(
      'temaColorError',
      '#D32F2F',
      'Texto',
      'Color para errores.'
    ),

    crearParametroTema_(
      'temaColorInfo',
      '#1976D2',
      'Texto',
      'Color para mensajes informativos.'
    ),

    crearParametroTema_(
      'temaBorderRadius',
      '14',
      'Numero',
      'Redondeo global de bordes. Valor permitido entre 0 y 40.'
    ),

    crearParametroTema_(
      'temaFuente',
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'Texto',
      'Fuente global utilizada por la plataforma.'
    ),

    crearParametroTema_(
      'temaLogo',
      '',
      'Texto',
      'URL pública del logo utilizado en el menú y la cabecera.'
    ),

    crearParametroTema_(
      'temaLogoOscuro',
      '',
      'Texto',
      'URL pública del logo alternativo para fondos claros.'
    ),

    crearParametroTema_(
      'temaFavicon',
      '',
      'Texto',
      'URL pública del icono de la pestaña del navegador.'
    )
  ];
}


/**
 * Construye un parámetro visual.
 */
function crearParametroTema_(
  clave,
  valor,
  tipo,
  descripcion
) {
  return {
    clave: clave,
    valor: valor,
    tipo: tipo,
    descripcion: descripcion,
    activo: 'SI'
  };
}


/**
 * Verifica que la hoja Configuraciones tenga
 * la estructura requerida por ConfigService.
 */
function validarEstructuraConfiguracionesTema_(
  hoja
) {
  const ultimaColumna =
    hoja.getLastColumn();

  if (ultimaColumna < 5) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_ESTRUCTURA_INVALIDA',
      'La hoja "' +
        HOJAS.CONFIGURACIONES +
        '" debe tener las columnas: ' +
        'Clave, Valor, Tipo, Descripcion y Activo.'
    );
  }

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0]
      .map(convertirEncabezado);

  const requeridos = [
    'clave',
    'valor',
    'tipo',
    'descripcion',
    'activo'
  ];

  const faltantes =
    requeridos.filter(
      function(campo) {
        return encabezados.indexOf(
          campo
        ) === -1;
      }
    );

  if (faltantes.length > 0) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_COLUMNAS_FALTANTES',
      'Faltan columnas en la hoja "' +
        HOJAS.CONFIGURACIONES +
        '": ' +
        faltantes.join(', ') +
        '.'
    );
  }
}


/**
 * Construye un mapa:
 *
 * {
 *   temaColorPrimario: 14,
 *   sistemaAutor: 22
 * }
 */
function construirMapaConfiguracionesTema_(
  hoja
) {
  const ultimaFila =
    hoja.getLastRow();

  const mapa = {};

  if (ultimaFila < 2) {
    return mapa;
  }

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(convertirEncabezado);

  const indiceClave =
    encabezados.indexOf(
      'clave'
    );

  if (indiceClave === -1) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_SIN_CLAVE',
      'No fue posible encontrar la columna Clave.'
    );
  }

  const valores =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        encabezados.length
      )
      .getDisplayValues();

  valores.forEach(
    function(fila, indice) {
      const clave =
        String(
          fila[indiceClave] || ''
        ).trim();

      if (!clave) {
        return;
      }

      mapa[clave] =
        indice + 2;
    }
  );

  return mapa;
}


/**
 * Actualiza Tipo, Descripción y Activo,
 * pero conserva el valor elegido por el usuario.
 */
function actualizarMetadatosParametroTema_(
  hoja,
  numeroFila,
  parametro
) {
  const encabezados =
    obtenerEncabezadosConfiguracionesTema_(
      hoja
    );

  const cambios = {
    tipo: parametro.tipo,
    descripcion:
      parametro.descripcion,
    activo: parametro.activo
  };

  Object.keys(cambios).forEach(
    function(campo) {
      const indice =
        encabezados.indexOf(
          campo
        );

      if (indice === -1) {
        return;
      }

      hoja
        .getRange(
          numeroFila,
          indice + 1
        )
        .setValue(
          cambios[campo]
        );
    }
  );
}


/**
 * Agrega un parámetro nuevo respetando el orden
 * real de las columnas de la hoja.
 */
function agregarParametroTema_(
  hoja,
  parametro
) {
  const encabezados =
    obtenerEncabezadosConfiguracionesTema_(
      hoja
    );

  const fila =
    encabezados.map(
      function(campo) {
        if (
          Object.prototype.hasOwnProperty.call(
            parametro,
            campo
          )
        ) {
          return parametro[campo];
        }

        return '';
      }
    );

  hoja.appendRow(
    fila
  );
}


/**
 * Obtiene encabezados normalizados.
 */
function obtenerEncabezadosConfiguracionesTema_(
  hoja
) {
  return hoja
    .getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(convertirEncabezado);
}


/**
 * Aplica formato únicamente a la hoja existente.
 * No cambia los datos ni los colores del sistema.
 */
function aplicarFormatoConfiguracionesTema_(
  hoja
) {
  hoja.setFrozenRows(1);

  const ultimaColumna =
    Math.max(
      hoja.getLastColumn(),
      5
    );

  hoja
    .getRange(
      1,
      1,
      1,
      ultimaColumna
    )
    .setFontWeight('bold');

  const encabezados =
    obtenerEncabezadosConfiguracionesTema_(
      hoja
    );

  ajustarAnchoColumnaTema_(
    hoja,
    encabezados,
    'clave',
    225
  );

  ajustarAnchoColumnaTema_(
    hoja,
    encabezados,
    'valor',
    440
  );

  ajustarAnchoColumnaTema_(
    hoja,
    encabezados,
    'tipo',
    110
  );

  ajustarAnchoColumnaTema_(
    hoja,
    encabezados,
    'descripcion',
    430
  );

  ajustarAnchoColumnaTema_(
    hoja,
    encabezados,
    'activo',
    90
  );

  const indiceActivo =
    encabezados.indexOf(
      'activo'
    );

  const ultimaFila =
    hoja.getLastRow();

  if (
    indiceActivo !== -1 &&
    ultimaFila >= 2
  ) {
    const reglaActivo =
      SpreadsheetApp
        .newDataValidation()
        .requireValueInList(
          [
            'SI',
            'NO'
          ],
          true
        )
        .setAllowInvalid(false)
        .build();

    hoja
      .getRange(
        2,
        indiceActivo + 1,
        ultimaFila - 1,
        1
      )
      .setDataValidation(
        reglaActivo
      );
  }
}


/**
 * Ajusta el ancho de una columna si existe.
 */
function ajustarAnchoColumnaTema_(
  hoja,
  encabezados,
  campo,
  ancho
) {
  const indice =
    encabezados.indexOf(
      campo
    );

  if (indice === -1) {
    return;
  }

  hoja.setColumnWidth(
    indice + 1,
    ancho
  );
}


/**
 * Prueba posterior a la instalación.
 */
function probarTemaVisualEmaus() {
  limpiarCacheConfiguraciones();

  const configuraciones =
    obtenerConfiguraciones();

  const clavesEsperadas =
    obtenerParametrosTemaVisual_()
      .map(
        function(parametro) {
          return parametro.clave;
        }
      );

  const faltantes =
    clavesEsperadas.filter(
      function(clave) {
        return configuraciones[
          clave
        ] === undefined;
      }
    );

  const resultado = {
    correcto:
      faltantes.length === 0,
    faltantes: faltantes,
    temaNombre:
      configuraciones.temaNombre,
    sistemaNombre:
      configuraciones.sistemaNombre,
    sistemaAutor:
      configuraciones.sistemaAutor,
    temaColorPrimario:
      configuraciones.temaColorPrimario
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}
