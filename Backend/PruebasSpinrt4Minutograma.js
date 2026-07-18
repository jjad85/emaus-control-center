/**
 * PRUEBAS MANUALES - SPRINT 4 BACKEND MINUTOGRAMA
 * Estas pruebas no modifican datos.
 */
function probarLecturaSprint4Minutograma() {
  const items = obtenerMinutograma({});
  Logger.log(JSON.stringify({
    total: items.length,
    primero: items.length ? items[0] : null
  }, null, 2));
}

function probarResumenSprint4Minutograma() {
  Logger.log(JSON.stringify(obtenerResumenMinutograma({}), null, 2));
}

function probarEstadoEnVivoSprint4Minutograma() {
  Logger.log(JSON.stringify(obtenerEstadoEnVivoMinutograma({}), null, 2));
}

function probarRutasGetSprint4Minutograma() {
  const respuestas = {
    minutograma: routeRequest({ recurso: 'minutograma' }),
    resumen: routeRequest({ recurso: 'resumenMinutograma' }),
    vivo: routeRequest({ recurso: 'estadoVivoMinutograma' })
  };

  Logger.log(JSON.stringify(respuestas, null, 2));
}
