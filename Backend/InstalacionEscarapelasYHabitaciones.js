function instalarEscarapelasYHabitaciones(){
  var libro=obtenerLibro();
  if(!libro) throw new Error('No fue posible abrir el libro principal.');
  // La matriz definitiva es la fuente de verdad. Al reinstalarla se crean
  // ambos permisos para ADMIN y LIDER_RETIRO sin duplicados.
  instalarMatrizRolesPermisosDefinitiva();
  SpreadsheetApp.flush();
}