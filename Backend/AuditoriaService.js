/**
 * ============================================================
 * AUDITORÍA SERVICE
 * ============================================================
 */

function registrarAuditoria(datos) {
  const hoja =
    obtenerHoja(
      HOJAS.AUDITORIA
    );

  hoja.appendRow([
    new Date(),
    datos.usuario || '',
    datos.nombre || '',
    datos.accion || '',
    datos.entidad || '',
    datos.idRegistro || '',
    datos.detalle || ''
  ]);
}