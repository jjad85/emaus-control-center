function instalarModuloGastos() {
  const libro = obtenerLibro();

  const encabezados = [
    'ID','Fecha Gasto','Categoria','Concepto','Valor','Metodo Pago',
    'Cruza Con Efectivo','Persona Efectivo ID','Persona Efectivo Nombre',
    'Persona Efectivo Celular','Comprobante URL','Comprobante ID',
    'Comprobante Nombre','Comprobante Tipo','Comprobante Tamano','Estado',
    'Reportado Por','Reportado Por Nombre','Fecha Registro','Validado Por',
    'Validado Por Nombre','Fecha Validacion','Observaciones Tesoreria',
    'Motivo Rechazo','Revertido Por','Revertido Por Nombre','Fecha Reversion',
    'Motivo Reversion','Activo','Fecha Actualizacion','Actualizado Por'
  ];

  let hoja = libro.getSheetByName(HOJAS.GASTOS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJAS.GASTOS);
    hoja.getRange(1,1,1,encabezados.length).setValues([encabezados]);
    hoja.setFrozenRows(1);
  } else {
    agregarColumnasSiFaltanGastos_(hoja, encabezados);
  }

  const props = PropertiesService.getScriptProperties();
  let carpetaId = props.getProperty('CARPETA_COMPROBANTES_GASTOS_ID');
  let carpeta;

  if (carpetaId) {
    carpeta = DriveApp.getFolderById(carpetaId);
  } else {
    carpeta = DriveApp.createFolder('Comprobantes gastos Emaús');
    carpetaId = carpeta.getId();
    props.setProperty('CARPETA_COMPROBANTES_GASTOS_ID', carpetaId);
  }

  asegurarConfiguracionGastos_(libro);
  asegurarPermisosGastos_(libro);
  limpiarCachePermisos();
  limpiarCacheConfiguraciones();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    hoja: HOJAS.GASTOS,
    carpetaId: carpetaId,
    carpetaUrl: carpeta.getUrl(),
    permisos: [
      'GASTOS_VER','GASTOS_REPORTAR','GASTOS_APROBAR',
      'GASTOS_RECHAZAR','GASTOS_REVERSAR'
    ]
  };
}

function agregarColumnasSiFaltanGastos_(hoja, nombres) {
  const actuales = hoja.getRange(
    1,1,1,Math.max(hoja.getLastColumn(),1)
  ).getDisplayValues()[0].map(normalizarTexto);

  nombres.forEach(function(n) {
    if (actuales.indexOf(normalizarTexto(n)) < 0) {
      hoja.getRange(1, hoja.getLastColumn()+1).setValue(n);
      actuales.push(normalizarTexto(n));
    }
  });
}

function asegurarConfiguracionGastos_(libro) {
  const hoja = libro.getSheetByName(HOJAS.CONFIGURACIONES);
  if (!hoja) return;

  const datos = hoja.getDataRange().getDisplayValues();
  const headers = (datos[0] || []).map(function(x) {
    return normalizarTexto(x).replace(/[^a-z0-9]/g,'');
  });
  const iClave = headers.indexOf('clave');
  if (iClave < 0) return;

  if (datos.slice(1).some(function(f) {
    return normalizarTexto(f[iClave]) === 'categorias_gastos';
  })) return;

  const fila = new Array(Math.max(hoja.getLastColumn(), headers.length)).fill('');
  function set(nombres, valor) {
    for (let i=0;i<nombres.length;i++) {
      const idx = headers.indexOf(nombres[i]);
      if (idx >= 0) { fila[idx] = valor; return; }
    }
  }
  set(['clave'], 'CATEGORIAS_GASTOS');
  set(['nombrevisible','nombre','etiqueta'], 'Categorías de gastos');
  set(['valor'], 'Alimentación,Transporte,Alojamiento,Papelería,Decoración,Logística,Audiovisuales,Liturgia,Materiales,Otros');
  set(['tipo'], 'Texto');
  set(['descripcion'], 'Categorías disponibles para reportar gastos, separadas por coma.');
  set(['activo'], 'Sí');
  hoja.appendRow(fila);
}

function asegurarPermisosGastos_(libro) {
  const hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);
  if (!hoja) return;

  const roles = ['ADMIN','LIDER_RETIRO','TESORERIA'];
  const permisos = [
    'GASTOS_VER','GASTOS_REPORTAR','GASTOS_APROBAR',
    'GASTOS_RECHAZAR','GASTOS_REVERSAR'
  ];

  const datos = hoja.getDataRange().getValues();
  const h = (datos[0] || []).map(function(x) {
    return normalizarTexto(x).replace(/[^a-z0-9]/g,'');
  });
  const iRol = h.indexOf('rol');
  const iPermiso = h.indexOf('permiso');
  const iActivo = h.indexOf('activo');

  roles.forEach(function(rol) {
    permisos.forEach(function(permiso) {
      const existe = leerHojaComoObjetos(HOJAS.PERMISOS_ROL).some(function(x) {
        return normalizarCodigoRol_(x.rol) === normalizarCodigoRol_(rol) &&
          normalizarPermiso(x.permiso) === permiso;
      });
      if (!existe) {
        const fila = new Array(Math.max(hoja.getLastColumn(), h.length)).fill('');
        fila[iRol] = rol;
        fila[iPermiso] = permiso;
        fila[iActivo] = 'Sí';
        hoja.appendRow(fila);
      }
    });
  });
}

function repararPermisosModuloGastos() {
  const libro = obtenerLibro();
  asegurarPermisosGastos_(libro);
  limpiarCachePermisos();
  SpreadsheetApp.flush();

  const roles = ['ADMIN','LIDER_RETIRO','TESORERIA'];
  const permisos = ['GASTOS_VER','GASTOS_REPORTAR','GASTOS_APROBAR','GASTOS_RECHAZAR','GASTOS_REVERSAR'];
  const registros = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const resultado = {};

  roles.forEach(function(rol) {
    resultado[rol] = {};
    permisos.forEach(function(permiso) {
      resultado[rol][permiso] = registros.some(function(x) {
        return normalizarCodigoRol_(x.rol) === normalizarCodigoRol_(rol) &&
          normalizarPermiso(x.permiso) === permiso &&
          convertirBooleano(x.activo);
      });
    });
  });
  return resultado;
}
