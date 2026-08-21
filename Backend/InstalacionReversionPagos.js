/**
 * Entrega 6.15
 * Agrega las columnas de auditoría necesarias para revertir
 * una aprobación de pago sin borrar ni modificar el historial.
 *
 * Puede ejecutarse más de una vez.
 */
function instalarReversionAprobacionPagos() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJAS.PAGOS);

  if (!hoja) {
    throw new Error(
      'No existe la hoja de Pagos. Ejecuta primero instalarModuloPagos().'
    );
  }

  agregarColumnasSiFaltan_(hoja, [
    'Fecha Reversion',
    'Revertido Por',
    'Motivo Reversion',
    'Estado Anterior Reversion',
    'Valor Aprobado Anterior',
    'Validado Por Anterior',
    'Fecha Validacion Anterior'
  ]);

  return {
    instalado: true,
    hoja: HOJAS.PAGOS
  };
}
