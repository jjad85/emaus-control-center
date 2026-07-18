/**
 * Punto de entrada de la aplicación web.
 */
function doGet(e) {
  try {
    const parametros =
      e && e.parameter
        ? e.parameter
        : {};

    const resultado = routeRequest(parametros);

    return crearRespuestaJson(
      crearRespuestaExitosa(
        resultado.datos,
        resultado.mensaje,
        resultado.totalRegistros
      )
    );
  } catch (error) {
    console.error(error);

    return crearRespuestaJson(
      crearRespuestaError(error)
    );
  }
}

/**
 * Punto de entrada para operaciones POST.
 */
function doPost(e) {
  try {
    const contenido =
      e &&
      e.postData &&
      e.postData.contents
        ? JSON.parse(
            e.postData.contents
          )
        : {};

    const resultado =
      routePost(contenido);

    return crearRespuestaJson(
      crearRespuestaExitosa(
        resultado.datos,
        resultado.mensaje,
        resultado.totalRegistros
      )
    );
  } catch (error) {
    console.error(error);

    return crearRespuestaJson(
      crearRespuestaError(error)
    );
  }
}