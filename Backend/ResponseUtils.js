/**
 * Construye una respuesta exitosa.
 */
function crearRespuestaExitosa(
  datos,
  mensaje,
  totalRegistros
) {
  const metadatos = {
    fechaConsulta: new Date().toISOString()
  };

  if (totalRegistros !== undefined) {
    metadatos.totalRegistros = totalRegistros;
  }

  return {
    ok: true,
    mensaje:
      mensaje ||
      'Consulta realizada correctamente',
    datos: datos,
    metadatos: metadatos
  };
}

/**
 * Construye una respuesta controlada de error.
 */
function crearRespuestaError(error) {
  return {
    ok: false,
    mensaje:
      'No fue posible realizar la consulta',
    errores: [
      {
        codigo:
          error.codigo || 'ERROR_INTERNO',
        detalle:
          error.message || String(error)
      }
    ],
    datos: null,
    metadatos: {
      fechaConsulta: new Date().toISOString()
    }
  };
}

/**
 * Convierte el objeto en una respuesta JSON.
 */
function crearRespuestaJson(contenido) {
  return ContentService
    .createTextOutput(
      JSON.stringify(contenido)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

/**
 * Crea errores de negocio controlados.
 */
function crearErrorAplicacion(
  codigo,
  mensaje
) {
  const error = new Error(mensaje);
  error.codigo = codigo;

  return error;
}