/**
 * ============================================================
 * DATOS HOTEL SERVICE
 * ============================================================
 * Consolida los datos que requiere la casa de retiros.
 *
 * Incluye:
 * - Caminantes activos.
 * - Todos los servidores que NO estén marcados como Exento de Pago.
 *
 * Si un dato no existe en las fuentes se devuelve vacío.
 */

function obtenerDatosHotel(token) {
  const sesion =
    validarPermiso(
      token,
      'SISTEMA_TODO'
    );

  const caminantes =
    obtenerCaminantes({})
      .map(function(caminante) {
        return construirFilaDatosHotelCaminante_(
          caminante
        );
      });

  const registrosServidores =
    leerHojaComoObjetos(
      HOJAS.SERVIDORES
    );

  let servidoresExcluidos = 0;

  const servidores =
    registrosServidores
      .filter(function(registro) {
        const exentoPago =
          convertirBooleano(
            registro.exentoPago
          );

        if (exentoPago) {
          servidoresExcluidos += 1;
          return false;
        }

        return true;
      })
      .map(function(registro) {
        return construirFilaDatosHotelServidor_(
          registro
        );
      });

  const items =
    caminantes
      .concat(
        servidores
      )
      .sort(function(a, b) {
        return String(
          a.nombreCompleto || ''
        ).localeCompare(
          String(
            b.nombreCompleto || ''
          ),
          'es',
          {
            sensitivity: 'base'
          }
        );
      });

  const configuracion =
    typeof obtenerConfiguraciones ===
    'function'
      ? obtenerConfiguraciones()
      : {};

  if (
    typeof registrarAuditoria ===
    'function'
  ) {
    registrarAuditoria({
      usuario:
        sesion.usuario ||
        '',
      nombre:
        sesion.nombre ||
        '',
      rol:
        sesion.rol ||
        sesion.codigoRol ||
        '',
      accion:
        'CONSULTAR_DATOS_HOTEL',
      entidad:
        'Sistema',
      idRegistro:
        'DATOS_HOTEL',
      resultado:
        'EXITOSO',
      detalle:
        JSON.stringify({
          caminantes:
            caminantes.length,
          servidores:
            servidores.length,
          servidoresExentosExcluidos:
            servidoresExcluidos,
          total:
            items.length
        })
    });
  }

  return {
    items:
      items,

    resumen: {
      caminantes:
        caminantes.length,
      servidores:
        servidores.length,
      servidoresExentosExcluidos:
        servidoresExcluidos,
      total:
        items.length
    },

    anioRetiro:
      configuracion.anioRetiro ||
      new Date().getFullYear()
  };
}


function construirFilaDatosHotelCaminante_(
  caminante
) {
  return {
    tipo:
      'Caminante',

    nombreCompleto:
      primerValorDatosHotel_(
        caminante.nombre,
        caminante.nombreCompleto
      ),

    identificacion:
      primerValorDatosHotel_(
        caminante.documentoIdentidad,
        caminante.identificacion,
        caminante.numeroDocumento
      ),

    fechaNacimiento:
      primerValorDatosHotel_(
        caminante.fechaNacimiento
      ),

    direccion:
      primerValorDatosHotel_(
        caminante.direccionResidencia,
        caminante.direccion
      ),

    ciudad:
      'Medellín',

    pais:
      'Colombia',

    telefono:
      primerValorDatosHotel_(
        caminante.telefono,
        caminante.celular,
        caminante.telefonoFijo
      ),

    mesa:
      primerValorDatosHotel_(
        caminante.mesa
      ),

    habitacion:
      primerValorDatosHotel_(
        caminante.habitacion
      )
  };
}


function construirFilaDatosHotelServidor_(
  registro
) {
  const nombre =
    primerValorDatosHotel_(
      registro.nombre,
      typeof construirNombreCompletoPersona ===
      'function'
        ? construirNombreCompletoPersona(
            registro.primerNombre,
            registro.segundoNombre,
            registro.primerApellido,
            registro.segundoApellido
          )
        : ''
    );

  return {
    tipo:
      'Servidor',

    nombreCompleto:
      nombre,

    identificacion:
      primerValorDatosHotel_(
        registro.documentoIdentidad,
        registro.identificacion,
        registro.numeroDocumento
      ),

    fechaNacimiento:
      primerValorDatosHotel_(
        registro.fechaNacimiento
      ),

    direccion:
      primerValorDatosHotel_(
        registro.direccionResidencia,
        registro.direccion
      ),

    ciudad:
      'Medellín',

    pais:
      'Colombia',

    telefono:
      primerValorDatosHotel_(
        registro.celular,
        registro.telefono
      ),

    mesa:
      primerValorDatosHotel_(
        registro.mesa
      ),

    habitacion:
      primerValorDatosHotel_(
        registro.habitacion
      )
  };
}


function primerValorDatosHotel_() {
  for (
    let i = 0;
    i < arguments.length;
    i++
  ) {
    const valor =
      arguments[i];

    if (
      valor !== null &&
      valor !== undefined &&
      String(valor).trim() !== ''
    ) {
      return valor;
    }
  }

  return '';
}
