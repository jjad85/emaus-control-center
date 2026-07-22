function instalarFotoPerfilServidor() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJAS.SERVIDORES);
  if (!hoja) throw new Error('No se encontró la hoja Servidores.');
  agregarColumnasFotoPerfilServidor_(hoja,['Foto Perfil ID','Foto Perfil URL','Fecha Actualización Foto']);
  const carpeta = obtenerCarpetaFotosPerfilServidores_();
  hoja.getRange(1,1,1,hoja.getLastColumn()).setFontWeight('bold');
  return {instalado:true,carpetaId:carpeta.getId(),carpetaUrl:carpeta.getUrl(),mensaje:'Foto de perfil de servidores instalada correctamente.'};
}
function agregarColumnasFotoPerfilServidor_(hoja,nombres) {
  const ultimaColumna = Math.max(hoja.getLastColumn(),1);
  const encabezados = hoja.getRange(1,1,1,ultimaColumna).getDisplayValues()[0];
  const normalizados = encabezados.map(function(valor){return normalizarTexto(valor).replace(/[^a-z0-9]/g,'');});
  nombres.forEach(function(nombre){
    const clave = normalizarTexto(nombre).replace(/[^a-z0-9]/g,'');
    if (normalizados.indexOf(clave) >= 0) return;
    hoja.getRange(1,hoja.getLastColumn()+1).setValue(nombre);
    normalizados.push(clave);
  });
}
