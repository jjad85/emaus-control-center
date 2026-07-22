/**
 * ============================================================
 * INSTALACIÓN RELACIÓN USUARIOS - SERVIDORES
 * ============================================================
 *
 * Ejecutar una sola vez después de reemplazar los archivos.
 *
 * Crea en Usuarios la columna "Servidor ID" y trata de relacionar
 * automáticamente cada usuario con Servidores.ID:
 * 1. Primero por correo único.
 * 2. Si no encuentra correo, por nombre único.
 * 3. No reemplaza relaciones ya existentes.
 */
function instalarRelacionUsuariosServidores() {
  const hojaUsuarios = obtenerHoja(HOJAS.USUARIOS);
  const hojaServidores = obtenerHoja(HOJAS.SERVIDORES);

  const encabezadosUsuarios = obtenerEncabezadosRelacion_(hojaUsuarios);
  const encabezadosServidores = obtenerEncabezadosRelacion_(hojaServidores);

  const columnaUsuarioId = asegurarColumnaRelacion_(
    hojaUsuarios,
    encabezadosUsuarios,
    'Servidor ID'
  );

  const columnaCorreoUsuario = buscarColumnaRelacion_(
    encabezadosUsuarios,
    ['correo']
  );
  const columnaNombreUsuario = buscarColumnaRelacion_(
    encabezadosUsuarios,
    ['nombre']
  );

  const columnaIdServidor = buscarColumnaRelacion_(
    encabezadosServidores,
    ['id']
  );
  const columnaCorreoServidor = buscarColumnaRelacion_(
    encabezadosServidores,
    ['correo']
  );
  const columnaNombreServidor = buscarColumnaRelacion_(
    encabezadosServidores,
    ['nombre']
  );

  if (columnaIdServidor === -1) {
    throw crearErrorAplicacion(
      'COLUMNA_ID_SERVIDOR_FALTANTE',
      'La hoja Servidores debe contener una columna llamada ID.'
    );
  }

  const ultimaFilaServidores = hojaServidores.getLastRow();
  const datosServidores = ultimaFilaServidores >= 2
    ? hojaServidores.getRange(
        2,
        1,
        ultimaFilaServidores - 1,
        hojaServidores.getLastColumn()
      ).getDisplayValues()
    : [];

  const indicePorCorreo = crearIndiceRelacion_(
    datosServidores,
    columnaCorreoServidor,
    columnaIdServidor
  );
  const indicePorNombre = crearIndiceRelacion_(
    datosServidores,
    columnaNombreServidor,
    columnaIdServidor
  );

  const ultimaFilaUsuarios = hojaUsuarios.getLastRow();
  if (ultimaFilaUsuarios < 2) {
    return {
      instalado: true,
      columna: 'Servidor ID',
      relacionados: 0,
      pendientes: 0,
      ambiguos: 0
    };
  }

  const datosUsuarios = hojaUsuarios.getRange(
    2,
    1,
    ultimaFilaUsuarios - 1,
    hojaUsuarios.getLastColumn()
  ).getDisplayValues();

  let relacionados = 0;
  let pendientes = 0;
  let ambiguos = 0;

  datosUsuarios.forEach(function(fila, indice) {
    const existente = String(fila[columnaUsuarioId] || '').trim();
    if (existente) {
      return;
    }

    const correo = columnaCorreoUsuario === -1
      ? ''
      : normalizarTexto(fila[columnaCorreoUsuario]);
    const nombre = columnaNombreUsuario === -1
      ? ''
      : normalizarTexto(fila[columnaNombreUsuario]);

    let resultado = correo ? indicePorCorreo[correo] : null;

    if (!resultado && nombre) {
      resultado = indicePorNombre[nombre];
    }

    if (resultado && resultado.ambiguo) {
      ambiguos += 1;
      return;
    }

    if (!resultado || !resultado.id) {
      pendientes += 1;
      return;
    }

    hojaUsuarios
      .getRange(indice + 2, columnaUsuarioId + 1)
      .setValue(resultado.id);

    relacionados += 1;
  });

  hojaUsuarios.setFrozenRows(1);
  hojaUsuarios.autoResizeColumns(1, hojaUsuarios.getLastColumn());

  return {
    instalado: true,
    columna: 'Servidor ID',
    relacionados: relacionados,
    pendientes: pendientes,
    ambiguos: ambiguos,
    mensaje:
      'Relación instalada. Revise manualmente los usuarios pendientes o ambiguos.'
  };
}

function obtenerEncabezadosRelacion_(hoja) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  return hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];
}

function asegurarColumnaRelacion_(hoja, encabezados, nombre) {
  let indice = buscarColumnaRelacion_(encabezados, [nombre]);

  if (indice !== -1) {
    return indice;
  }

  indice = hoja.getLastColumn();
  hoja.getRange(1, indice + 1).setValue(nombre);
  encabezados.push(nombre);
  return indice;
}

function buscarColumnaRelacion_(encabezados, nombres) {
  const normalizados = encabezados.map(function(valor) {
    return normalizarEncabezadoRelacion_(valor);
  });

  for (let i = 0; i < nombres.length; i += 1) {
    const indice = normalizados.indexOf(
      normalizarEncabezadoRelacion_(nombres[i])
    );

    if (indice !== -1) {
      return indice;
    }
  }

  return -1;
}

function crearIndiceRelacion_(filas, columnaClave, columnaId) {
  const indice = {};

  if (columnaClave === -1) {
    return indice;
  }

  filas.forEach(function(fila) {
    const clave = normalizarTexto(fila[columnaClave]);
    const id = String(fila[columnaId] || '').trim();

    if (!clave || !id) {
      return;
    }

    if (indice[clave] && indice[clave].id !== id) {
      indice[clave] = { ambiguo: true };
      return;
    }

    indice[clave] = { id: id, ambiguo: false };
  });

  return indice;
}

function normalizarEncabezadoRelacion_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
