/**
 * Ejecutar una sola vez: instalarConfiguracionCodigoVestuario();
 * Crea las configuraciones editables del módulo Código de vestuario.
 */
function instalarConfiguracionCodigoVestuario() {
  const hoja = obtenerHoja(HOJAS.CONFIGURACIONES);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos[0].map(function(v) {
    return normalizarTexto(v).replace(/[^a-z0-9]/g, '');
  });

  const columnas = {
    clave: encabezados.indexOf('clave'),
    valor: encabezados.indexOf('valor'),
    tipo: encabezados.indexOf('tipo'),
    descripcion: encabezados.indexOf('descripcion'),
    activo: encabezados.indexOf('activo'),
    nombreVisible: encabezados.indexOf('nombrevisible')
  };

  if (columnas.clave < 0 || columnas.valor < 0 || columnas.tipo < 0 || columnas.activo < 0) {
    throw crearErrorAplicacion('CONFIGURACIONES_ESTRUCTURA_INVALIDA', 'Faltan columnas obligatorias en Configuraciones.');
  }

  const existentes = {};
  datos.slice(1).forEach(function(fila) { existentes[String(fila[columnas.clave] || '').trim()] = true; });

  const items = [
    ['vestuarioTitulo', 'Código de vestuario', 'Texto', 'Título de la página de código de vestuario.', true, 'Vestuario - Título'],
    ['vestuarioIntroduccion', 'Consulta la vestimenta definida para cada día del retiro.', 'Texto', 'Texto introductorio de la página.', true, 'Vestuario - Introducción'],
    ['vestuarioViernesTexto', 'Camisa tipo polo roja con el nombre Emaús en color blanco, ubicado al lado izquierdo del pecho. Combínala con pantalón tipo jean azul.', 'Texto', 'Descripción del vestuario del viernes.', true, 'Vestuario - Viernes - Texto'],
    ['vestuarioViernesImagenUrl', '', 'Texto', 'URL pública de la imagen del vestuario del viernes.', true, 'Vestuario - Viernes - Imagen URL'],
    ['vestuarioSabadoTexto', 'Camisa tipo polo azul oscuro con el nombre Emaús en color dorado, ubicado al lado izquierdo del pecho. Combínala con pantalón color caqui.', 'Texto', 'Descripción del vestuario del sábado.', true, 'Vestuario - Sábado - Texto'],
    ['vestuarioSabadoImagenUrl', '', 'Texto', 'URL pública de la imagen del vestuario del sábado.', true, 'Vestuario - Sábado - Imagen URL'],
    ['vestuarioDomingoTexto', 'Camisa tipo polo blanca con el nombre Emaús y una rosa en color rojo, ubicados al lado izquierdo del pecho. Combínala con pantalón negro.', 'Texto', 'Descripción del vestuario del domingo.', true, 'Vestuario - Domingo - Texto'],
    ['vestuarioDomingoImagenUrl', '', 'Texto', 'URL pública de la imagen del vestuario del domingo.', true, 'Vestuario - Domingo - Imagen URL']
  ];

  const nuevas = [];
  items.forEach(function(item) {
    if (existentes[item[0]]) return;
    const fila = new Array(hoja.getLastColumn()).fill('');
    fila[columnas.clave] = item[0]; fila[columnas.valor] = item[1]; fila[columnas.tipo] = item[2];
    if (columnas.descripcion >= 0) fila[columnas.descripcion] = item[3];
    fila[columnas.activo] = item[4];
    if (columnas.nombreVisible >= 0) fila[columnas.nombreVisible] = item[5];
    nuevas.push(fila);
  });

  if (nuevas.length) hoja.getRange(hoja.getLastRow()+1, 1, nuevas.length, hoja.getLastColumn()).setValues(nuevas);
  SpreadsheetApp.flush();
  limpiarCacheConfiguraciones();
  return { configuracionesCreadas: nuevas.length };
}
