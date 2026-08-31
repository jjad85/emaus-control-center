/**
 * ============================================================
 * AUDITORÍA SERVICE - V2
 * ============================================================
 *
 * Compatible con las llamadas históricas:
 * registrarAuditoria({ usuario, nombre, accion, entidad, ... })
 *
 * Nuevos campos opcionales:
 * rol, resultado, datosAntes, datosDespues, cambios,
 * ip, sesionId, origen, metodo, ruta, duracionMs, error.
 */

function registrarAuditoria(datos) {
  datos = datos || {};

  const hoja =
    obtenerHoja(
      HOJAS.AUDITORIA
    );

  const encabezados =
    obtenerEncabezadosAuditoria_(
      hoja
    );

  const cambioCrud =
    typeof ULTIMO_CAMBIO_CRUD_AUDITORIA_ !==
      'undefined'
      ? ULTIMO_CAMBIO_CRUD_AUDITORIA_
      : null;

  const coincideCambioCrud =
    Boolean(
      cambioCrud &&
      normalizarTexto(
        cambioCrud.entidad
      ) ===
        normalizarTexto(
          datos.entidad
        ) &&
      String(
        cambioCrud.idRegistro
      ) ===
        String(
          datos.idRegistro
        )
    );

  const antes =
    sanitizarAuditoria_(
      datos.datosAntes !==
        undefined
        ? datos.datosAntes
        : (
          coincideCambioCrud
            ? cambioCrud.datosAntes
            : undefined
        )
    );

  const despues =
    sanitizarAuditoria_(
      datos.datosDespues !==
        undefined
        ? datos.datosDespues
        : (
          coincideCambioCrud
            ? cambioCrud.datosDespues
            : undefined
        )
    );

  const cambios =
    datos.cambios !== undefined
      ? sanitizarAuditoria_(
          datos.cambios
        )
      : calcularCambiosAuditoria_(
          antes,
          despues
        );

  const registro = {
    fecha:
      new Date(),

    usuario:
      datos.usuario || '',

    nombre:
      datos.nombre || '',

    rol:
      datos.rol || '',

    accion:
      datos.accion || '',

    entidad:
      datos.entidad || '',

    idRegistro:
      datos.idRegistro || '',

    resultado:
      datos.resultado ||
      'EXITOSO',

    detalle:
      normalizarDetalleAuditoria_(
        datos.detalle
      ),

    datosAntes:
      serializarAuditoria_(
        antes
      ),

    datosDespues:
      serializarAuditoria_(
        despues
      ),

    cambios:
      serializarAuditoria_(
        cambios
      ),

    ip:
      /*
       * Apps Script Web Apps no exponen de forma confiable la IP
       * remota del navegador. Solo se guarda si una capa confiable
       * la entrega explícitamente.
       */
      datos.ip || '',

    sesionId:
      datos.sesionId || '',

    origen:
      datos.origen ||
      'WEB_APP',

    metodo:
      datos.metodo || '',

    ruta:
      datos.ruta || '',

    duracionMs:
      datos.duracionMs === undefined
        ? ''
        : datos.duracionMs,

    error:
      normalizarDetalleAuditoria_(
        datos.error
      )
  };

  const fila =
    encabezados.map(
      function(columna) {
        const propiedad =
          propiedadAuditoriaPorEncabezado_(
            columna
          );

        return propiedad
          ? registro[propiedad]
          : '';
      }
    );

  hoja.appendRow(
    fila
  );

  invalidarCacheHojaSolicitud_(
    HOJAS.AUDITORIA
  );
}


function registrarAuditoriaCambio(
  datos
) {
  registrarAuditoria(
    datos
  );
}


function calcularCambiosAuditoria_(
  antes,
  despues
) {
  if (
    !esObjetoAuditoria_(
      antes
    ) ||
    !esObjetoAuditoria_(
      despues
    )
  ) {
    return [];
  }

  const claves = {};

  Object.keys(
    antes
  ).forEach(
    function(clave) {
      claves[clave] = true;
    }
  );

  Object.keys(
    despues
  ).forEach(
    function(clave) {
      claves[clave] = true;
    }
  );

  return Object.keys(
    claves
  )
    .filter(
      function(clave) {
        return !valoresAuditoriaIguales_(
          antes[clave],
          despues[clave]
        );
      }
    )
    .map(
      function(clave) {
        return {
          campo:
            clave,
          antes:
            sanitizarAuditoria_(
              antes[clave]
            ),
          despues:
            sanitizarAuditoria_(
              despues[clave]
            )
        };
      }
    );
}


function sanitizarAuditoria_(
  valor,
  profundidad
) {
  profundidad =
    Number(
      profundidad || 0
    );

  if (
    valor === null ||
    valor === undefined
  ) {
    return valor;
  }

  if (
    profundidad > 8
  ) {
    return '[PROFUNDIDAD_MAXIMA]';
  }

  if (
    valor instanceof Date
  ) {
    return valor.toISOString();
  }

  if (
    Array.isArray(
      valor
    )
  ) {
    return valor.map(
      function(item) {
        return sanitizarAuditoria_(
          item,
          profundidad + 1
        );
      }
    );
  }

  if (
    typeof valor ===
      'object'
  ) {
    const salida = {};

    Object.keys(
      valor
    ).forEach(
      function(clave) {
        if (
          esCampoSensibleAuditoria_(
            clave
          )
        ) {
          salida[clave] =
            '[PROTEGIDO]';
          return;
        }

        salida[clave] =
          sanitizarAuditoria_(
            valor[clave],
            profundidad + 1
          );
      }
    );

    return salida;
  }

  return valor;
}


function esCampoSensibleAuditoria_(
  clave
) {
  const normalizada =
    normalizarTexto(
      clave
    )
      .replace(
        /[^a-z0-9]/g,
        ''
      );

  return [
    'password',
    'contrasena',
    'clavehash',
    'hash',
    'salt',
    'token',
    'tokenhash',
    'accesstoken',
    'refreshtoken',
    'base64',
    'contenidoarchivo'
  ].some(
    function(sensible) {
      return (
        normalizada ===
          sensible ||
        normalizada.indexOf(
          sensible
        ) >= 0
      );
    }
  );
}


function valoresAuditoriaIguales_(
  a,
  b
) {
  return (
    serializarAuditoria_(
      sanitizarAuditoria_(
        a
      )
    ) ===
    serializarAuditoria_(
      sanitizarAuditoria_(
        b
      )
    )
  );
}


function serializarAuditoria_(
  valor
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return '';
  }

  if (
    typeof valor ===
      'string'
  ) {
    return valor;
  }

  try {
    return JSON.stringify(
      valor
    );
  } catch (error) {
    return String(
      valor
    );
  }
}


function normalizarDetalleAuditoria_(
  valor
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return '';
  }

  return typeof valor ===
    'string'
      ? valor
      : serializarAuditoria_(
          sanitizarAuditoria_(
            valor
          )
        );
}


function esObjetoAuditoria_(
  valor
) {
  return Boolean(
    valor &&
    typeof valor === 'object' &&
    !Array.isArray(valor) &&
    !(valor instanceof Date)
  );
}


function obtenerEncabezadosAuditoria_(
  hoja
) {
  const ultimaColumna =
    Math.max(
      hoja.getLastColumn(),
      1
    );

  return hoja
    .getRange(
      1,
      1,
      1,
      ultimaColumna
    )
    .getDisplayValues()[0];
}


function propiedadAuditoriaPorEncabezado_(
  encabezado
) {
  const clave =
    normalizarTexto(
      encabezado
    )
      .replace(
        /[^a-z0-9]/g,
        ''
      );

  const mapa = {
    fecha:
      'fecha',
    fechahora:
      'fecha',

    usuario:
      'usuario',
    nombre:
      'nombre',
    rol:
      'rol',

    accion:
      'accion',
    entidad:
      'entidad',
    idregistro:
      'idRegistro',

    resultado:
      'resultado',
    detalle:
      'detalle',

    datosantes:
      'datosAntes',
    datosanteriores:
      'datosAntes',

    datosdespues:
      'datosDespues',
    datosnuevos:
      'datosDespues',

    cambios:
      'cambios',

    ip:
      'ip',
    sesionid:
      'sesionId',
    origen:
      'origen',
    metodo:
      'metodo',
    ruta:
      'ruta',
    duracionms:
      'duracionMs',
    error:
      'error'
  };

  return mapa[clave] || '';
}


function convertirFechaFiltroAuditoria(
  valor,
  finDelDia
) {
  if (!valor) return null;

  var partes =
    String(
      valor
    ).split('-');

  if (
    partes.length !== 3
  ) {
    return null;
  }

  var fecha =
    new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2]),
      finDelDia ? 23 : 0,
      finDelDia ? 59 : 0,
      finDelDia ? 59 : 0,
      finDelDia ? 999 : 0
    );

  return isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}


function obtenerAuditoriaSistema(
  token,
  filtros
) {
  validarPermiso(
    token,
    'SISTEMA_TODO'
  );

  filtros =
    filtros || {};

  const hoja =
    obtenerHoja(
      HOJAS.AUDITORIA
    );

  const valores =
    hoja
      .getDataRange()
      .getValues();

  if (
    valores.length <= 1
  ) {
    return {
      items: [],
      total: 0,
      pagina: 1,
      tamanoPagina:
        Number(
          filtros.tamanoPagina ||
          25
        ),
      totalPaginas: 0,
      truncado: false
    };
  }

  const encabezados =
    valores[0];

  const propiedades =
    encabezados.map(
      propiedadAuditoriaPorEncabezado_
    );

  var fechaDesde =
    convertirFechaFiltroAuditoria(
      filtros.fechaDesde,
      false
    );

  var fechaHasta =
    convertirFechaFiltroAuditoria(
      filtros.fechaHasta,
      true
    );

  var textoBusqueda =
    normalizarTexto(
      filtros.busqueda || ''
    ).trim();

  var items =
    valores
      .slice(1)
      .filter(
        function(fila) {
          return fila.some(
            function(celda) {
              return String(
                celda || ''
              ).trim() !== '';
            }
          );
        }
      )
      .map(
        function(fila) {
          const item = {};

          propiedades.forEach(
            function(propiedad, indice) {
              if (
                propiedad
              ) {
                item[propiedad] =
                  fila[indice];
              }
            }
          );

          return item;
        }
      )
      .filter(
        function(item) {
          var fechaItem =
            new Date(
              item.fecha
            );

          var fechaValida =
            !isNaN(
              fechaItem.getTime()
            );

          if (
            fechaDesde &&
            (
              !fechaValida ||
              fechaItem <
                fechaDesde
            )
          ) {
            return false;
          }

          if (
            fechaHasta &&
            (
              !fechaValida ||
              fechaItem >
                fechaHasta
            )
          ) {
            return false;
          }

          if (
            textoBusqueda
          ) {
            var contenido =
              normalizarTexto(
                [
                  item.usuario,
                  item.nombre,
                  item.rol,
                  item.accion,
                  item.entidad,
                  item.idRegistro,
                  item.resultado,
                  item.detalle,
                  item.cambios,
                  item.datosAntes,
                  item.datosDespues,
                  item.ip,
                  item.sesionId,
                  item.error
                ].join(' ')
              );

            if (
              contenido.indexOf(
                textoBusqueda
              ) === -1
            ) {
              return false;
            }
          }

          return true;
        }
      )
      .sort(
        function(a, b) {
          return (
            new Date(
              b.fecha
            ).getTime() -
            new Date(
              a.fecha
            ).getTime()
          );
        }
      );

  var total =
    items.length;

  var exportar =
    filtros.exportar === true ||
    String(
      filtros.exportar
    ).toLowerCase() ===
      'true';

  if (
    exportar
  ) {
    var limiteExportacion =
      20000;

    return {
      items:
        items.slice(
          0,
          limiteExportacion
        ),
      total:
        total,
      pagina:
        1,
      tamanoPagina:
        Math.min(
          total,
          limiteExportacion
        ),
      totalPaginas:
        total > 0
          ? 1
          : 0,
      truncado:
        total >
        limiteExportacion,
      limiteExportacion:
        limiteExportacion
    };
  }

  var tamanoSolicitado =
    Number(
      filtros.tamanoPagina ||
      filtros.limite ||
      25
    );

  var tamanosPermitidos =
    [10, 25, 50, 100];

  var tamanoPagina =
    tamanosPermitidos.indexOf(
      tamanoSolicitado
    ) >= 0
      ? tamanoSolicitado
      : 25;

  var totalPaginas =
    total === 0
      ? 0
      : Math.ceil(
          total /
          tamanoPagina
        );

  var paginaSolicitada =
    Math.max(
      1,
      Number(
        filtros.pagina ||
        1
      )
    );

  var pagina =
    totalPaginas > 0
      ? Math.min(
          paginaSolicitada,
          totalPaginas
        )
      : 1;

  var inicio =
    (
      pagina - 1
    ) *
    tamanoPagina;

  return {
    items:
      items.slice(
        inicio,
        inicio +
        tamanoPagina
      ),
    total:
      total,
    pagina:
      pagina,
    tamanoPagina:
      tamanoPagina,
    totalPaginas:
      totalPaginas,
    truncado:
      false
  };
}
