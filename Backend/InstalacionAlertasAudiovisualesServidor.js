/**
 * Registra en ConfiguracionAlertas las alertas del flujo
 * Audiovisuales -> Servidor sin borrar la parametrización existente.
 *
 * Ejecutar una sola vez después de subir ConfiguracionAlertasService.js.
 */
function instalarAlertasAudiovisualesServidor() {
  const resultado = instalarConfiguracionAlertas();
  console.log(JSON.stringify(resultado, null, 2));
  return resultado;
}
