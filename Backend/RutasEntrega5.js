/**
 * INTEGRACIÓN MANUAL EN Routes.gs
 * Agrega estos casos al switch de routeRequest(parametros):
 *
 * case 'historicominutograma':
 *   return { datos: obtenerHistoricoMinutograma(parametros), mensaje: 'Histórico consultado correctamente' };
 * case 'comparativoretiros':
 *   return { datos: obtenerComparativoRetiros(parametros), mensaje: 'Comparativo consultado correctamente' };
 *
 * INTEGRACIÓN MANUAL EN PostRoutes.gs
 * Agrega este caso al switch de acciones:
 *
 * case 'cerrarretirominutograma':
 *   return { datos: cerrarRetiroMinutograma(payload.token, payload.datos), mensaje: 'Retiro cerrado correctamente' };
 */
