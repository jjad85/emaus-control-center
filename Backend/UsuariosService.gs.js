/**
 * ============================================================
 * USUARIOS SERVICE
 * ============================================================
 *
 * Busca un usuario directamente en la hoja Usuarios
 * sin leer toda la hoja.
 */

/**
 * Busca un usuario por su login.
 */
function buscarUsuarioPorUsuario(usuarioIngresado) {

  const usuarioBuscado =
    normalizarTexto(usuarioIngresado);

  if (!usuarioBuscado) {
    return null;
  }

  const hoja =
    obtenerHoja(HOJAS.USUARIOS);

  const ultimaFila =
    hoja.getLastRow();

  const ultimaColumna =
    hoja.getLastColumn();

  if (ultimaFila < 2) {
    return null;
  }

  // Encabezados
  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  // Buscar la columna Usuario
  const indiceUsuario =
    encabezados
      .map(normalizarTexto)
      .indexOf('usuario');

  if (indiceUsuario === -1) {

    throw crearErrorAplicacion(
      'COLUMNA_USUARIO',
      'No existe la columna Usuario.'
    );

  }

  const filaUsuarios =
    hoja
      .getRange(
        2,
        indiceUsuario + 1,
        ultimaFila - 1,
        1
      )
      .getDisplayValues();

  for (
    let i = 0;
    i < filaUsuarios.length;
    i++
  ) {

    if (
      normalizarTexto(
        filaUsuarios[i][0]
      ) === usuarioBuscado
    ) {

      const valores =
        hoja
          .getRange(
            i + 2,
            1,
            1,
            ultimaColumna
          )
          .getDisplayValues()[0];

      return convertirFilaUsuario(
        encabezados,
        valores
      );

    }

  }

  return null;

}

/**
 * Convierte una fila en objeto.
 */
function convertirFilaUsuario(
  encabezados,
  valores
) {

  const usuario = {};

  encabezados.forEach(
    function(
      encabezado,
      indice
    ) {

      const propiedad =
        convertirEncabezadoUsuario(
          encabezado
        );

      if (!propiedad) {
        return;
      }

      usuario[propiedad] =
        valores[indice];

    }
  );

  return usuario;

}

/**
 * Convierte encabezados.
 */
function convertirEncabezadoUsuario(
  encabezado
) {

  const texto =
    normalizarTexto(encabezado);

  const mapa = {

    'id':'id',

    'usuario':'usuario',

    'nombre':'nombre',

    'salt':'salt',

    'clave hash':'claveHash',

    'clavehash':'claveHash',

    'rol':'rol',

    'activo':'activo'

  };

  return mapa[texto] || '';

}

/**
 * Prueba.
 */
function probarBuscarUsuario() {

  const usuario =
    buscarUsuarioPorUsuario(
      'juan.arango'
    );

  Logger.log(
    JSON.stringify(
      usuario,
      null,
      2
    )
  );

}
