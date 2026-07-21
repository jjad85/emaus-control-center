/**
 * ============================================================
 * CRUD SHEETS
 * ============================================================
 *
 * Motor genérico para registrar, consultar y actualizar
 * entidades almacenadas en Google Sheets.
 *
 * Principios:
 * - Trabaja por nombre de encabezado, nunca por posición fija.
 * - Conserva columnas desconocidas durante una actualización.
 * - Soporta actualizaciones parciales.
 * - Maneja ID, Activo y campos de auditoría de fila.
 * - No elimina físicamente registros.
 */

/**
 * Registra una nueva entidad.
 *
 * @param {string} nombreHoja
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */
function crearRegistroSheet(
  nombreHoja,
  datos,
  opciones
) {
  const configuracion =
    normalizarOpcionesCrud(
      opciones
    );

  const hoja =
    obtenerHoja(
      nombreHoja
    );

  const encabezados =
    obtenerEncabezadosCrud(
      hoja
    );

  validarEncabezadoIdCrud(
    encabezados,
    configuracion.campoId
  );

  const ahora =
    new Date();

  const registro =
    Object.assign(
      {},
      datos || {}
    );

  if (
    registro[
      configuracion.campoId
    ] === undefined ||
    registro[
      configuracion.campoId
    ] === null ||
    registro[
      configuracion.campoId
    ] === ''
  ) {
    registro[
      configuracion.campoId
    ] =
      obtenerSiguienteIdCrud(
        hoja,
        encabezados,
        configuracion.campoId
      );
  }

  if (
    configuracion.campoActivo &&
    existeCampoCrud(
      encabezados,
      configuracion.campoActivo
    ) &&
    (
      registro[
        configuracion.campoActivo
      ] === undefined ||
      registro[
        configuracion.campoActivo
      ] === null ||
      registro[
        configuracion.campoActivo
      ] === ''
    )
  ) {
    registro[
      configuracion.campoActivo
    ] =
      configuracion.valorActivo;
  }

  if (
    configuracion.campoFechaRegistro &&
    existeCampoCrud(
      encabezados,
      configuracion.campoFechaRegistro
    )
  ) {
    registro[
      configuracion.campoFechaRegistro
    ] =
      registro[
        configuracion.campoFechaRegistro
      ] || ahora;
  }

  if (
    configuracion.campoFechaActualizacion &&
    existeCampoCrud(
      encabezados,
      configuracion.campoFechaActualizacion
    )
  ) {
    registro[
      configuracion.campoFechaActualizacion
    ] = ahora;
  }

  if (
    configuracion.campoActualizadoPor &&
    existeCampoCrud(
      encabezados,
      configuracion.campoActualizadoPor
    )
  ) {
    registro[
      configuracion.campoActualizadoPor
    ] =
      configuracion.usuario || '';
  }

  const fila =
    construirFilaCrud(
      encabezados,
      registro,
      null
    );
  hoja.appendRow(
    fila
  );

  return leerRegistroPorIdSheet(
    nombreHoja,
    registro[
      configuracion.campoId
    ],
    configuracion
  );
}

/**
 * Consulta un registro por ID.
 */
function leerRegistroPorIdSheet(
  nombreHoja,
  id,
  opciones
) {
  const configuracion =
    normalizarOpcionesCrud(
      opciones
    );

  const hoja =
    obtenerHoja(
      nombreHoja
    );

  const encabezados =
    obtenerEncabezadosCrud(
      hoja
    );

  const numeroFila =
    buscarNumeroFilaPorIdCrud(
      hoja,
      encabezados,
      configuracion.campoId,
      id
    );

  return leerFilaCrud(
    hoja,
    encabezados,
    numeroFila
  );
}

/**
 * Consulta todos los registros.
 *
 * filtros:
 * {
 *   activo: true,
 *   nombre: 'Juan'
 * }
 */
function listarRegistrosSheet(
  nombreHoja,
  filtros,
  opciones
) {
  const configuracion =
    normalizarOpcionesCrud(
      opciones
    );

  const hoja =
    obtenerHoja(
      nombreHoja
    );

  const encabezados =
    obtenerEncabezadosCrud(
      hoja
    );

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return [];
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

  const registros =
    valores
      .filter(function(fila) {
        return fila.some(
          function(valor) {
            return String(
              valor || ''
            ).trim() !== '';
          }
        );
      })
      .map(function(fila) {
        return construirObjetoCrud(
          encabezados,
          fila
        );
      });

  return aplicarFiltrosCrud(
    registros,
    filtros || {},
    configuracion
  );
}

/**
 * Actualiza parcialmente un registro.
 *
 * Solo cambia los campos presentes en datos.
 * Las demás columnas se conservan.
 */
function actualizarRegistroSheet(
  nombreHoja,
  id,
  datos,
  opciones
) {
  const configuracion =
    normalizarOpcionesCrud(
      opciones
    );

  const hoja =
    obtenerHoja(
      nombreHoja
    );

  const encabezados =
    obtenerEncabezadosCrud(
      hoja
    );

  const numeroFila =
    buscarNumeroFilaPorIdCrud(
      hoja,
      encabezados,
      configuracion.campoId,
      id
    );

  const actual =
    leerFilaCrud(
      hoja,
      encabezados,
      numeroFila
    );

  const cambios =
    Object.assign(
      {},
      datos || {}
    );

  delete cambios[
    configuracion.campoId
  ];

  if (
    configuracion.campoFechaActualizacion &&
    existeCampoCrud(
      encabezados,
      configuracion.campoFechaActualizacion
    )
  ) {
    cambios[
      configuracion.campoFechaActualizacion
    ] = new Date();
  }

  if (
    configuracion.campoActualizadoPor &&
    existeCampoCrud(
      encabezados,
      configuracion.campoActualizadoPor
    )
  ) {
    cambios[
      configuracion.campoActualizadoPor
    ] =
      configuracion.usuario || '';
  }

  const propiedadesCambiadas =
    Object.keys(cambios);

  propiedadesCambiadas.forEach(
    function(propiedad) {
      const indiceColumna =
        encabezados.findIndex(
          function(encabezado) {
            return (
              encabezado.propiedad ===
              propiedad
            );
          }
        );

      // Ignora propiedades que no existen en la hoja.
      if (indiceColumna < 0) {
        return;
      }

      hoja
        .getRange(
          numeroFila,
          indiceColumna + 1
        )
        .setValue(
          convertirValorParaCeldaCrud(
            cambios[propiedad]
          )
        );
    }
  );

  return leerRegistroPorIdSheet(
    nombreHoja,
    id,
    configuracion
  );
}

/**
 * Actualiza un único campo.
 */
function actualizarCampoSheet(
  nombreHoja,
  id,
  campo,
  valor,
  opciones
) {
  const datos = {};
  datos[campo] = valor;

  return actualizarRegistroSheet(
    nombreHoja,
    id,
    datos,
    opciones
  );
}

/**
 * Eliminación lógica.
 */
function desactivarRegistroSheet(
  nombreHoja,
  id,
  opciones
) {
  const configuracion =
    normalizarOpcionesCrud(
      opciones
    );

  if (
    !configuracion.campoActivo
  ) {
    throw crearErrorAplicacion(
      'CAMPO_ACTIVO_NO_CONFIGURADO',
      'No se configuró el campo Activo.'
    );
  }

  return actualizarCampoSheet(
    nombreHoja,
    id,
    configuracion.campoActivo,
    configuracion.valorInactivo,
    configuracion
  );
}

/**
 * Reactiva un registro.
 */
function activarRegistroSheet(
  nombreHoja,
  id,
  opciones
) {
  const configuracion =
    normalizarOpcionesCrud(
      opciones
    );

  return actualizarCampoSheet(
    nombreHoja,
    id,
    configuracion.campoActivo,
    configuracion.valorActivo,
    configuracion
  );
}

/**
 * Ejecuta una operación de escritura con bloqueo.
 */
function ejecutarCrudConBloqueo(
  operacion
) {
  const bloqueo =
    LockService.getScriptLock();

  bloqueo.waitLock(
    30000
  );

  try {
    return operacion();
  } finally {
    bloqueo.releaseLock();
  }
}

/**
 * Configuración predeterminada del CRUD.
 */
function normalizarOpcionesCrud(
  opciones
) {
  const entrada =
    opciones || {};

  return {
    campoId:
      entrada.campoId ||
      'id',

    campoActivo:
      entrada.campoActivo ===
        null
        ? null
        : (
          entrada.campoActivo ||
          'activo'
        ),

    campoFechaRegistro:
      entrada.campoFechaRegistro ===
        null
        ? null
        : (
          entrada.campoFechaRegistro ||
          'fechaRegistro'
        ),

    campoFechaActualizacion:
      entrada.campoFechaActualizacion ===
        null
        ? null
        : (
          entrada.campoFechaActualizacion ||
          'fechaActualizacion'
        ),

    campoActualizadoPor:
      entrada.campoActualizadoPor ===
        null
        ? null
        : (
          entrada.campoActualizadoPor ||
          'actualizadoPor'
        ),

    valorActivo:
      entrada.valorActivo ||
      'Sí',

    valorInactivo:
      entrada.valorInactivo ||
      'No',

    usuario:
      entrada.usuario || ''
  };
}

/**
 * Convierte el encabezado real de una columna
 * en la propiedad utilizada por el código.
 *
 * Esta función pertenece al CRUD y evita depender
 * de funciones externas de SheetUtils.gs.
 */
function convertirEncabezadoCrud(
  encabezado
) {
  const texto =
    String(
      encabezado === null ||
      encabezado === undefined
        ? ''
        : encabezado
    )
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-z0-9 ]/g,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  const mapa = {
    'id': 'id',

    'nombre': 'nombre',
    'nombre completo': 'nombreCompleto',

    'telefono': 'telefono',

    'estado de pago': 'estadoPago',

    'mesa': 'mesa',

    'habitacion': 'habitacion',

    'contacto': 'contacto',
    'nombre del contacto': 'contacto',

    'telefono contacto':
      'telefonoContacto',

    'telefono del contacto':
      'telefonoContacto',

    'carta': 'carta',

    'foto': 'foto',

    'activo': 'activo',

    'fecha registro':
      'fechaRegistro',

    'fecha de registro':
      'fechaRegistro',

    'fecha actualizacion':
      'fechaActualizacion',

    'fecha de actualizacion':
      'fechaActualizacion',

    'actualizado por':
      'actualizadoPor',

    'rol': 'rol',

    'permiso': 'permiso',

    'usuario': 'usuario',

    'descripcion':
      'descripcion',

    'valor': 'valor',

    'tipo': 'tipo',

    'clave': 'clave',

    'salt': 'salt',

    'clave hash': 'claveHash',
    'clavehash': 'claveHash'
  };

  if (mapa[texto]) {
    return mapa[texto];
  }

  /*
   * Si no está en el mapa,
   * se convierte automáticamente a camelCase.
   *
   * Ejemplo:
   * "Observaciones Médicas"
   * → observacionesMedicas
   */
  return texto
    .split(' ')
    .filter(Boolean)
    .map(
      function(
        palabra,
        indice
      ) {
        if (indice === 0) {
          return palabra;
        }

        return (
          palabra
            .charAt(0)
            .toUpperCase() +
          palabra.slice(1)
        );
      }
    )
    .join('');
}

/**
 * Obtiene encabezados reales de la hoja
 * convertidos a propiedades.
 */
function obtenerEncabezadosCrud(
  hoja
) {
  const ultimaColumna =
    hoja.getLastColumn();

  if (ultimaColumna < 1) {
    throw crearErrorAplicacion(
      'HOJA_SIN_ENCABEZADOS',
      'La hoja "' +
        hoja.getName() +
        '" no tiene encabezados.'
    );
  }

  const encabezadosOriginales =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  return encabezadosOriginales.map(
    function(encabezado) {
      return {
        original:
          encabezado,

        propiedad:
          convertirEncabezadoCrud(
            encabezado
          )
      };
    }
  );
}

/**
 * Construye una fila respetando el orden real
 * de la hoja.
 */
function construirFilaCrud(
  encabezados,
  registro,
  anterior
) {
  return encabezados.map(
    function(encabezado) {
      const propiedad =
        encabezado.propiedad;

      if (!propiedad) {
        return '';
      }

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            registro,
            propiedad
          )
      ) {
        return convertirValorParaCeldaCrud(
          registro[propiedad]
        );
      }

      if (
        anterior &&
        Object.prototype
          .hasOwnProperty
          .call(
            anterior,
            propiedad
          )
      ) {
        return convertirValorParaCeldaCrud(
          anterior[propiedad]
        );
      }

      return '';
    }
  );
}

/**
 * Lee una fila como objeto.
 */
function leerFilaCrud(
  hoja,
  encabezados,
  numeroFila
) {
  const valores =
    hoja
      .getRange(
        numeroFila,
        1,
        1,
        encabezados.length
      )
      .getValues()[0];

  return construirObjetoCrud(
    encabezados,
    valores
  );
}

/**
 * Convierte una fila a objeto.
 */
function construirObjetoCrud(
  encabezados,
  valores
) {
  const resultado = {};

  encabezados.forEach(
    function(
      encabezado,
      indice
    ) {
      if (
        !encabezado.propiedad
      ) {
        return;
      }

      resultado[
        encabezado.propiedad
      ] =
        valores[indice] !==
          undefined
          ? valores[indice]
          : '';
    }
  );

  return resultado;
}

/**
 * Busca la fila de un ID.
 */
function buscarNumeroFilaPorIdCrud(
  hoja,
  encabezados,
  campoId,
  id
) {
  const indiceId =
    encabezados.findIndex(
      function(encabezado) {
        return (
          encabezado.propiedad ===
          campoId
        );
      }
    );

  if (indiceId === -1) {
    throw crearErrorAplicacion(
      'COLUMNA_ID_NO_ENCONTRADA',
      'No existe la columna ID en la hoja "' +
        hoja.getName() +
        '".'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    throw crearErrorAplicacion(
      'REGISTRO_NO_ENCONTRADO',
      'No existe el registro solicitado.'
    );
  }

  const valores =
    hoja
      .getRange(
        2,
        indiceId + 1,
        ultimaFila - 1,
        1
      )
      .getDisplayValues()
      .flat();

  const posicion =
    valores.findIndex(
      function(valor) {
        return (
          String(valor).trim() ===
          String(id).trim()
        );
      }
    );

  if (posicion === -1) {
    throw crearErrorAplicacion(
      'REGISTRO_NO_ENCONTRADO',
      'No existe el registro con ID "' +
        id +
        '".'
    );
  }

  return posicion + 2;
}

/**
 * Genera siguiente ID numérico.
 */
function obtenerSiguienteIdCrud(
  hoja,
  encabezados,
  campoId
) {
  const indiceId =
    encabezados.findIndex(
      function(encabezado) {
        return (
          encabezado.propiedad ===
          campoId
        );
      }
    );

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return 1;
  }

  const valores =
    hoja
      .getRange(
        2,
        indiceId + 1,
        ultimaFila - 1,
        1
      )
      .getDisplayValues()
      .flat();

  const maximo =
    valores.reduce(
      function(
        acumulado,
        valor
      ) {
        const numero =
          Number(valor);

        return Number.isFinite(
          numero
        )
          ? Math.max(
            acumulado,
            numero
          )
          : acumulado;
      },
      0
    );

  return maximo + 1;
}

/**
 * Verifica si un campo existe.
 */
function existeCampoCrud(
  encabezados,
  campo
) {
  return encabezados.some(
    function(encabezado) {
      return (
        encabezado.propiedad ===
        campo
      );
    }
  );
}

/**
 * Valida encabezado ID.
 */
function validarEncabezadoIdCrud(
  encabezados,
  campoId
) {
  if (
    !existeCampoCrud(
      encabezados,
      campoId
    )
  ) {
    throw crearErrorAplicacion(
      'COLUMNA_ID_NO_ENCONTRADA',
      'No existe la columna ID requerida.'
    );
  }
}

/**
 * Aplica filtros básicos.
 */
function aplicarFiltrosCrud(
  registros,
  filtros,
  configuracion
) {
  return registros.filter(
    function(registro) {
      return Object.keys(
        filtros
      ).every(
        function(campo) {
          const esperado =
            filtros[campo];

          if (
            esperado ===
              undefined ||
            esperado ===
              null ||
            esperado === ''
          ) {
            return true;
          }

          if (
            campo === 'activo' &&
            typeof esperado ===
              'boolean' &&
            configuracion.campoActivo
          ) {
            const activo =
              convertirBooleano(
                registro[
                  configuracion
                    .campoActivo
                ]
              );

            return activo ===
              esperado;
          }

          return normalizarTexto(
            registro[campo]
          ).includes(
            normalizarTexto(
              esperado
            )
          );
        }
      );
    }
  );
}

/**
 * Convierte Date y valores especiales.
 */
function convertirValorParaCeldaCrud(
  valor
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return '';
  }

  return valor;
}

/**
 * Prueba del CRUD.
 */
function probarCrudCaminantes() {
  const registros =
    listarRegistrosSheet(
      HOJAS.CAMINANTES,
      {
        activo: true
      }
    );

  console.log(
    JSON.stringify(
      registros.slice(
        0,
        3
      ),
      null,
      2
    )
  );
}


function probarActualizacionCrudCaminante() {
  const resultado =
    actualizarRegistroSheet(
      HOJAS.CAMINANTES,
      1,
      {
        contacto:
          'Contacto actualizado'
      },
      opcionesCrudCaminante(
        'juan.arango'
      )
    );

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );
}
