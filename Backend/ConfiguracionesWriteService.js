/**
 * ============================================================
 * EDICIÓN DE CONFIGURACIONES
 * ============================================================
 *
 * Permite modificar configuraciones existentes.
 * No permite crear ni eliminar configuraciones desde la pantalla.
 *
 * Requiere:
 * - validarAdministradorSistema()
 * - HOJAS.CONFIGURACIONES
 * - obtenerHoja()
 * - limpiarCacheConfiguraciones()
 * - convertirValorConfiguracion()
 * - registrarAuditoria()
 */

function obtenerConfiguracionesAdministracion(
  token
) {
  validarAdministradorSistema(
    token
  );

  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  const datos =
    hoja
      .getDataRange()
      .getValues();

  if (datos.length <= 1) {
    return {
      items: []
    };
  }

  const encabezados =
    obtenerEncabezadosConfiguracionEdicion_(
      datos[0]
    );

  const indiceClave =
    encabezados.indexOf(
      'clave'
    );

  const indiceNombreVisible =
    encabezados.indexOf(
      'nombrevisible'
    );

  const indiceValor =
    encabezados.indexOf(
      'valor'
    );

  const indiceTipo =
    encabezados.indexOf(
      'tipo'
    );

  const indiceDescripcion =
    encabezados.indexOf(
      'descripcion'
    );

  const indiceActivo =
    encabezados.indexOf(
      'activo'
    );

  if (
    indiceClave === -1 ||
    indiceValor === -1 ||
    indiceTipo === -1 ||
    indiceActivo === -1
  ) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_ESTRUCTURA_INVALIDA',
      'La hoja Configuraciones debe contener las columnas Clave, Valor, Tipo y Activo.'
    );
  }

  const items =
    datos
      .slice(1)
      .map(
        function(fila, indice) {
          const clave =
            String(
              fila[indiceClave] || ''
            ).trim();

          if (!clave) {
            return null;
          }

          const valor =
            fila[indiceValor];

          return {
            numeroFila:
              indice + 2,

            clave:
              clave,

            nombreVisible:
              indiceNombreVisible >= 0
                ? String(
                    fila[
                      indiceNombreVisible
                    ] || ''
                  ).trim() ||
                  humanizarClaveConfiguracion_(
                    clave
                  )
                : humanizarClaveConfiguracion_(
                    clave
                  ),

            valor:
              convertirValorEditableConfiguracion_(
                valor
              ),

            tipo:
              String(
                fila[indiceTipo] ||
                'Texto'
              ).trim(),

            descripcion:
              indiceDescripcion >= 0
                ? String(
                    fila[
                      indiceDescripcion
                    ] || ''
                  ).trim()
                : '',

            activo:
              convertirBooleano(
                fila[indiceActivo]
              )
          };
        }
      )
      .filter(Boolean)
      .sort(
        function(a, b) {
          return (
            a.nombreVisible ||
            a.clave
          ).localeCompare(
            b.nombreVisible ||
            b.clave,
            'es'
          );
        }
      );

  return {
    items:
      items
  };
}


function actualizarConfiguracionExistente(
  token,
  claveIngresada,
  nombreVisibleIngresado,
  valorIngresado,
  activoIngresado
) {
  const sesion =
    validarAdministradorSistema(
      token
    );

  const clave =
    String(
      claveIngresada || ''
    ).trim();

  if (!clave) {
    throw crearErrorAplicacion(
      'CONFIGURACION_CLAVE_REQUERIDA',
      'Debe indicar la configuración que desea modificar.'
    );
  }

  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  const datos =
    hoja
      .getDataRange()
      .getValues();

  const encabezados =
    obtenerEncabezadosConfiguracionEdicion_(
      datos[0] || []
    );

  const indiceClave =
    encabezados.indexOf(
      'clave'
    );

  const indiceNombreVisible =
    encabezados.indexOf(
      'nombrevisible'
    );

  const indiceValor =
    encabezados.indexOf(
      'valor'
    );

  const indiceTipo =
    encabezados.indexOf(
      'tipo'
    );

  const indiceActivo =
    encabezados.indexOf(
      'activo'
    );

  if (
    indiceClave === -1 ||
    indiceValor === -1 ||
    indiceTipo === -1 ||
    indiceActivo === -1
  ) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_ESTRUCTURA_INVALIDA',
      'La hoja Configuraciones debe contener las columnas Clave, Valor, Tipo y Activo.'
    );
  }

  let numeroFila = -1;
  let tipo = '';
  let nombreVisibleAnterior = '';
  let valorAnterior = '';
  let activoAnterior = false;

  for (
    let indice = 1;
    indice < datos.length;
    indice += 1
  ) {
    if (
      normalizarTexto(
        datos[indice][indiceClave]
      ) ===
      normalizarTexto(
        clave
      )
    ) {
      numeroFila =
        indice + 1;

      tipo =
        String(
          datos[indice][indiceTipo] ||
          'Texto'
        ).trim();

      nombreVisibleAnterior =
        indiceNombreVisible >= 0
          ? String(
              datos[indice][
                indiceNombreVisible
              ] || ''
            ).trim()
          : '';

      valorAnterior =
        datos[indice][indiceValor];

      activoAnterior =
        convertirBooleano(
          datos[indice][indiceActivo]
        );

      break;
    }
  }

  if (numeroFila === -1) {
    throw crearErrorAplicacion(
      'CONFIGURACION_NO_ENCONTRADA',
      'La configuración "' +
        clave +
        '" no existe. La pantalla no permite crear nuevas configuraciones.'
    );
  }

  const nombreVisible =
    String(
      nombreVisibleIngresado || ''
    ).trim();

  if (!nombreVisible) {
    throw crearErrorAplicacion(
      'CONFIGURACION_NOMBRE_VISIBLE_REQUERIDO',
      'Debe indicar el nombre que se mostrará al usuario.'
    );
  }

  if (indiceNombreVisible === -1) {
    throw crearErrorAplicacion(
      'CONFIGURACION_NOMBRE_VISIBLE_FALTANTE',
      'La hoja Configuraciones no contiene la columna Nombre Visible. Ejecute el instalador.'
    );
  }

  /*
   * Valida el valor con la misma regla utilizada al leer
   * las configuraciones. El resultado no se escribe porque
   * Sheets debe conservar el valor editable original.
   */
  convertirValorConfiguracion(
    valorIngresado,
    tipo,
    clave
  );

  const activo =
    convertirBooleano(
      activoIngresado
    );

  const bloqueo =
    LockService.getScriptLock();

  try {
    bloqueo.waitLock(30000);

    hoja
      .getRange(
        numeroFila,
        indiceNombreVisible + 1
      )
      .setValue(
        nombreVisible
      );

    hoja
      .getRange(
        numeroFila,
        indiceValor + 1
      )
      .setValue(
        normalizarValorParaHojaConfiguracion_(
          valorIngresado,
          tipo
        )
      );

    hoja
      .getRange(
        numeroFila,
        indiceActivo + 1
      )
      .setValue(
        activo
          ? 'Sí'
          : 'No'
      );

    SpreadsheetApp.flush();

    /*
     * La limpieza ocurre dentro de la misma operación,
     * inmediatamente después de guardar.
     */
    limpiarCacheConfiguraciones();

    /*
     * Fuerza una nueva lectura para confirmar que el valor
     * actualizado ya es visible sin esperar cinco minutos.
     */
    const configuracionesActualizadas =
      obtenerConfiguraciones();

    registrarAuditoria({
      usuario:
        sesion.usuario,

      nombre:
        sesion.nombre,

      accion:
        'ACTUALIZAR_CONFIGURACION',

      entidad:
        'Configuraciones',

      idRegistro:
        clave,

      detalle:
        JSON.stringify({
          clave:
            clave,

          nombreVisibleAnterior:
            nombreVisibleAnterior,

          nombreVisibleNuevo:
            nombreVisible,

          valorAnterior:
            convertirValorEditableConfiguracion_(
              valorAnterior
            ),

          valorNuevo:
            convertirValorEditableConfiguracion_(
              valorIngresado
            ),

          activoAnterior:
            activoAnterior,

          activoNuevo:
            activo
        })
    });

    return {
      clave:
        clave,

      nombreVisible:
        nombreVisible,

      valor:
        configuracionesActualizadas[
          clave
        ],

      activo:
        activo,

      cacheLimpiada:
        true
    };
  } finally {
    if (bloqueo.hasLock()) {
      bloqueo.releaseLock();
    }
  }
}


function obtenerEncabezadosConfiguracionEdicion_(
  encabezados
) {
  return encabezados.map(
    function(valor) {
      const normalizado =
        String(
          valor || ''
        )
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /[^a-z0-9]/g,
            ''
          );

      const mapa = {
        clave:
          'clave',

        nombrevisible:
          'nombrevisible',

        nombre:
          'nombrevisible',

        etiqueta:
          'nombrevisible',

        valor:
          'valor',

        tipo:
          'tipo',

        descripcion:
          'descripcion',

        activo:
          'activo'
      };

      return (
        mapa[normalizado] ||
        normalizado
      );
    }
  );
}


function convertirValorEditableConfiguracion_(
  valor
) {
  if (
    valor instanceof Date
  ) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
  }

  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  if (
    typeof valor === 'object'
  ) {
    return JSON.stringify(
      valor,
      null,
      2
    );
  }

  return String(valor);
}


function normalizarValorParaHojaConfiguracion_(
  valor,
  tipo
) {
  const tipoNormalizado =
    normalizarTexto(
      tipo
    );

  switch (tipoNormalizado) {
    case 'numero':
    case 'numerico':
    case 'number':
      return Number(
        String(valor)
          .trim()
          .replace(',', '.')
      );

    case 'booleano':
    case 'boolean':
      return convertirBooleano(
        valor
      )
        ? 'Sí'
        : 'No';

    case 'json':
      return JSON.stringify(
        JSON.parse(
          String(
            valor || ''
          )
        )
      );

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
      );
  }
}



/**
 * Convierte una clave técnica en una etiqueta legible.
 * Solo se usa como respaldo cuando Nombre Visible está vacío.
 */
function humanizarClaveConfiguracion_(
  clave
) {
  return String(
    clave || ''
  )
    .replace(
      /([a-z0-9])([A-Z])/g,
      '$1 $2'
    )
    .replace(
      /[_-]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .replace(
      /^./,
      function(letra) {
        return letra.toUpperCase();
      }
    );
}
