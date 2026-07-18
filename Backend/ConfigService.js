/**
 * ============================================================
 * CONFIG SERVICE
 * ============================================================
 *
 * Lee la hoja Configuraciones y mantiene una copia temporal
 * en CacheService para evitar consultas repetidas a Sheets.
 *
 * Estructura esperada:
 * Clave | Valor | Tipo | Descripcion | Activo
 */

/**
 * Clave utilizada para almacenar las configuraciones.
 */
const CLAVE_CACHE_CONFIGURACIONES =
  'EMAUS_CONFIGURACIONES_V1';

/**
 * Tiempo durante el cual se conservan las configuraciones
 * en caché.
 *
 * 300 segundos = 5 minutos.
 */
const DURACION_CACHE_CONFIGURACIONES_SEGUNDOS =
  300;

/**
 * Obtiene todas las configuraciones activas.
 *
 * Primero consulta la caché. Si no existen allí,
 * lee la hoja y vuelve a almacenarlas.
 */
function obtenerConfiguraciones() {
  const cache =
    CacheService.getScriptCache();

  const configuracionesCache =
    cache.get(
      CLAVE_CACHE_CONFIGURACIONES
    );

  if (configuracionesCache) {
    try {
      return JSON.parse(
        configuracionesCache
      );
    } catch (error) {
      /*
       * Si el contenido quedó corrupto,
       * se elimina y se vuelve a consultar la hoja.
       */
      cache.remove(
        CLAVE_CACHE_CONFIGURACIONES
      );
    }
  }

  const configuraciones =
    leerConfiguracionesDesdeHoja();

  cache.put(
    CLAVE_CACHE_CONFIGURACIONES,
    JSON.stringify(configuraciones),
    DURACION_CACHE_CONFIGURACIONES_SEGUNDOS
  );

  return configuraciones;
}

/**
 * Lee directamente la hoja Configuraciones.
 *
 * Esta función no utiliza caché.
 */
function leerConfiguracionesDesdeHoja() {
  const filas =
    leerHojaComoObjetos(
      HOJAS.CONFIGURACIONES
    );

  const configuraciones = {};

  filas.forEach(
    function(registro) {
      const activo =
        convertirBooleano(
          registro.activo
        );

      if (!activo) {
        return;
      }

      const clave =
        String(
          registro.clave || ''
        ).trim();

      if (!clave) {
        return;
      }

      configuraciones[clave] =
        convertirValorConfiguracion(
          registro.valor,
          registro.tipo,
          clave
        );
    }
  );

  return completarConfiguraciones(
    configuraciones
  );
}

/**
 * Convierte el valor según el tipo registrado en la hoja.
 *
 * Tipos soportados:
 * - Texto
 * - Numero
 * - Booleano
 * - JSON
 * - Fecha
 */
function convertirValorConfiguracion(
  valor,
  tipo,
  clave
) {
  const tipoNormalizado =
    normalizarTexto(tipo);

  switch (tipoNormalizado) {
    case 'numero':
    case 'numerico':
    case 'number': {
      const numero =
        Number(
          String(valor)
            .trim()
            .replace(',', '.')
        );

      if (!Number.isFinite(numero)) {
        throw crearErrorAplicacion(
          'CONFIGURACION_NUMERICA_INVALIDA',
          'La configuración "' +
            clave +
            '" debe contener un número válido.'
        );
      }

      return numero;
    }

    case 'booleano':
    case 'boolean':
      return convertirBooleano(
        valor
      );

    case 'json':
      try {
        return JSON.parse(
          String(valor || '')
        );
      } catch (error) {
        throw crearErrorAplicacion(
          'CONFIGURACION_JSON_INVALIDA',
          'La configuración "' +
            clave +
            '" no contiene un JSON válido.'
        );
      }

    case 'fecha':
    case 'date':
      return String(
        valor || ''
      ).trim();

    case 'texto':
    case 'text':
    default:
      return String(
        valor === null ||
        valor === undefined
          ? ''
          : valor
      ).trim();
  }
}

/**
 * Completa propiedades derivadas utilizadas por React.
 */
function completarConfiguraciones(
  configuraciones
) {
  const resultado =
    Object.assign(
      {},
      configuraciones
    );

  /*
   * Solo genera título y subtítulo si no están
   * definidos directamente en la hoja.
   */
  if (!resultado.titulo) {
    resultado.titulo = [
      'EMAÚS',
      resultado.anioRetiro
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (!resultado.subtitulo) {
    resultado.subtitulo =
      resultado.tipoRetiro
        ? 'Retiro de ' +
          resultado.tipoRetiro
        : '';
  }

  return resultado;
}

/**
 * Obtiene una configuración específica.
 */
function obtenerConfiguracion(
  clave,
  valorPredeterminado
) {
  const configuraciones =
    obtenerConfiguraciones();

  const valor =
    configuraciones[clave];

  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return valorPredeterminado;
  }

  return valor;
}

/**
 * Elimina manualmente la caché.
 *
 * Ejecútala después de cambiar valores en la hoja
 * si no quieres esperar cinco minutos.
 */
function limpiarCacheConfiguraciones() {
  const cache =
    CacheService.getScriptCache();

  cache.remove(
    CLAVE_CACHE_CONFIGURACIONES
  );

  console.log(
    'Caché de configuraciones eliminada.'
  );

  return {
    eliminada: true
  };
}

/**
 * Prueba la lectura de configuraciones.
 */
function probarConfiguraciones() {
  const configuraciones =
    obtenerConfiguraciones();

  console.log(
    JSON.stringify(
      configuraciones,
      null,
      2
    )
  );
}

/**
 * Prueba la lectura directa sin caché.
 */
function probarConfiguracionesDesdeHoja() {
  const configuraciones =
    leerConfiguracionesDesdeHoja();

  console.log(
    JSON.stringify(
      configuraciones,
      null,
      2
    )
  );
}