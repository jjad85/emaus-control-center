/**
 * ============================================================
 * ADMINISTRACIÓN DEL SISTEMA
 * ============================================================
 *
 * Funciones exclusivas para los roles:
 * - Administrador
 * - Administradores
 */

function validarAdministradorSistema(token) {
  const sesion = obtenerSesion(token);
  const rol = normalizarTexto(sesion.rol);
  const esAdmin = rol === 'admin' || rol === 'administrador' || rol === 'administradores';
  const permisos = obtenerPermisosPorRol(sesion.rol);
  if (!esAdmin && permisos.indexOf('SISTEMA_TODO') === -1) {
    throw crearErrorAplicacion('ADMINISTRADOR_REQUERIDO','No tiene permisos para administrar el sistema.');
  }
  return sesion;
}

function obtenerAdministracionSistema(
  token
) {
  validarAdministradorSistema(
    token
  );

  return {
    usuarios:
      listarUsuariosAdministracion_(),

    servidores:
      obtenerServidores({}).filter(function(item) { return item.activo !== false; }),

    roles:
      listarRolesAdministracion_(),

    permisos:
      listarCatalogoPermisos_(),

    permisosPorRol:
      listarPermisosPorRolAdministracion_()
  };
}


function desbloquearUsuarioSistema(
  token,
  usuarioIngresado
) {
  const sesion =
    validarAdministradorSistema(
      token
    );

  const usuario =
    buscarUsuarioPorUsuario(
      usuarioIngresado
    );

  if (!usuario) {
    throw crearErrorAplicacion(
      'USUARIO_NO_ENCONTRADO',
      'No existe el usuario indicado.'
    );
  }

  reiniciarIntentosUsuario_(
    usuario.usuario
  );

  registrarAuditoria({
    usuario:
      sesion.usuario,
    nombre:
      sesion.nombre,
    accion:
      'DESBLOQUEAR_USUARIO',
    entidad:
      'Seguridad',
    idRegistro:
      usuario.id,
    detalle:
      'Usuario desbloqueado: ' +
      usuario.usuario
  });

  return {
    usuario:
      usuario.usuario,
    desbloqueado:
      true
  };
}


function guardarPermisosRolSistema(
  token,
  rolIngresado,
  permisosSeleccionados
) {
  const sesion =
    validarAdministradorSistema(
      token
    );

  const rol =
    validarRolActivo(
      rolIngresado
    );

  const seleccionados =
    (
      Array.isArray(
        permisosSeleccionados
      )
        ? permisosSeleccionados
        : []
    )
      .map(
        normalizarPermiso
      )
      .filter(Boolean);

  const catalogo = listarCatalogoPermisos_().map(function(item) { return typeof item === 'string' ? item : item.codigo; });

  const hoja =
    obtenerHoja(
      HOJAS.PERMISOS_ROL
    );

  const encabezados =
    obtenerEncabezadosAdministracion_(
      hoja
    );

  const indiceRol =
    encabezados.indexOf('rol');

  const indicePermiso =
    encabezados.indexOf(
      'permiso'
    );

  const indiceActivo =
    encabezados.indexOf(
      'activo'
    );

  if (
    indiceRol === -1 ||
    indicePermiso === -1 ||
    indiceActivo === -1
  ) {
    throw crearErrorAplicacion(
      'PERMISOS_ROL_ESTRUCTURA',
      'La hoja PermisosRol debe contener Rol, Permiso y Activo.'
    );
  }

  const datos =
    hoja
      .getDataRange()
      .getValues();

  const filasPorPermiso = {};

  for (
    let fila = 1;
    fila < datos.length;
    fila += 1
  ) {
    if (
      normalizarTexto(
        datos[fila][indiceRol]
      ) !==
      normalizarTexto(
        rol.rol
      )
    ) {
      continue;
    }

    const permiso =
      normalizarPermiso(
        datos[fila][indicePermiso]
      );

    if (permiso) {
      filasPorPermiso[
        permiso
      ] = fila + 1;
    }
  }

  catalogo.forEach(
    function(permiso) {
      const activo =
        seleccionados.includes(
          permiso
        )
          ? 'Sí'
          : 'No';

      const numeroFila =
        filasPorPermiso[
          permiso
        ];

      if (numeroFila) {
        hoja
          .getRange(
            numeroFila,
            indiceActivo + 1
          )
          .setValue(
            activo
          );

        return;
      }

      const nuevaFila =
        encabezados.map(
          function(campo) {
            if (
              campo === 'rol'
            ) {
              return rol.rol;
            }

            if (
              campo === 'permiso'
            ) {
              return permiso;
            }

            if (
              campo === 'activo'
            ) {
              return activo;
            }

            return '';
          }
        );

      hoja.appendRow(
        nuevaFila
      );
    }
  );

  limpiarCachePermisos();

  registrarAuditoria({
    usuario:
      sesion.usuario,
    nombre:
      sesion.nombre,
    accion:
      'ACTUALIZAR_PERMISOS_ROL',
    entidad:
      'PermisosRol',
    idRegistro:
      rol.rol,
    detalle:
      JSON.stringify({
        permisos:
          seleccionados
      })
  });

  return {
    rol:
      rol.rol,

    permisos:
      seleccionados
  };
}


function listarUsuariosAdministracion_() {
  const hoja =
    obtenerHoja(
      HOJAS.USUARIOS
    );

  const datos =
    hoja
      .getDataRange()
      .getValues();

  if (datos.length <= 1) {
    return [];
  }

  const encabezados =
    datos[0].map(
      function(valor) {
        return String(
          valor || ''
        )
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /[^a-z0-9]/g,
            ''
          );
      }
    );

  function indice(
    nombre
  ) {
    return encabezados.indexOf(
      nombre
    );
  }

  const indiceId =
    indice('id');

  const indiceUsuario =
    indice('usuario');

  const indiceNombre =
    indice('nombre');

  const indiceRol =
    indice('rol');

  const indiceServidorId =
    indice('servidorid');

  const indiceCorreo =
    indice('correo');

  const indiceCelular =
    indice('celular');

  const indiceActivo =
    indice('activo');

  const indiceIntentos =
    indice('intentosfallidos');

  const indiceUltimoIntento =
    indice('ultimointentofallido');

  const indiceBloqueadoHasta =
    indice('bloqueadohasta');

  const ahora =
    Date.now();

  const servidoresPorId = {};
  obtenerServidores({}).forEach(function(servidor) {
    servidoresPorId[String(servidor.id || '').trim()] = servidor;
  });

  return datos
    .slice(1)
    .filter(
      function(fila) {
        return String(
          fila[indiceUsuario] || ''
        ).trim();
      }
    )
    .map(
      function(fila) {
        const valorBloqueadoHasta =
          indiceBloqueadoHasta >= 0
            ? fila[indiceBloqueadoHasta]
            : '';

        const bloqueadoHasta =
          obtenerFechaUsuario_(
            valorBloqueadoHasta
          );

        const intentosFallidos =
          indiceIntentos >= 0
            ? Number(
                fila[indiceIntentos] ||
                0
              )
            : 0;

        const bloqueoVigente =
          Boolean(
            bloqueadoHasta &&
            bloqueadoHasta.getTime() >
              ahora
          );

        return {
          id:
            indiceId >= 0
              ? fila[indiceId]
              : '',

          usuario:
            indiceUsuario >= 0
              ? fila[indiceUsuario]
              : '',

          nombre:
            (function() {
              const servidorId = indiceServidorId >= 0
                ? String(fila[indiceServidorId] || '').trim()
                : '';
              const servidor = servidoresPorId[servidorId];
              return servidor
                ? servidor.nombre
                : (indiceNombre >= 0 ? fila[indiceNombre] : '');
            })(),

          nombreUsuario:
            indiceNombre >= 0
              ? fila[indiceNombre]
              : '',

          servidorId:
            indiceServidorId >= 0
              ? fila[indiceServidorId]
              : '',

          tieneServidorAsociado:
            indiceServidorId >= 0 && Boolean(String(fila[indiceServidorId] || '').trim()),

          correo:
            indiceCorreo >= 0 ? fila[indiceCorreo] : '',

          celular:
            indiceCelular >= 0 ? fila[indiceCelular] : '',

          rol:
            indiceRol >= 0
              ? fila[indiceRol]
              : '',

          activo:
            indiceActivo >= 0
              ? convertirBooleano(
                  fila[indiceActivo]
                )
              : false,

          intentosFallidos:
            intentosFallidos,

          ultimoIntentoFallido:
            indiceUltimoIntento >= 0
              ? fila[indiceUltimoIntento]
              : '',

          bloqueadoHasta:
            valorBloqueadoHasta,

          bloqueado:
            bloqueoVigente
        };
      }
    )
    .sort(
      function(a, b) {
        return String(
          a.nombre ||
          a.usuario
        ).localeCompare(
          String(
            b.nombre ||
            b.usuario
          ),
          'es'
        );
      }
    );
}

function listarRolesAdministracion_() {
  return leerHojaComoObjetos(
    HOJAS.ROLES
  )
    .filter(
      function(rol) {
        return convertirBooleano(
          rol.activo
        );
      }
    )
    .map(
      function(rol) {
        return {
          rol:
            rol.rol,

          descripcion:
            rol.descripcion ||
            ''
        };
      }
    );
}


function listarCatalogoPermisos_() {
  if (typeof obtenerCatalogoPermisosDefinitivo_ === 'function') {
    return obtenerCatalogoPermisosDefinitivo_();
  }
  return [];
}

function listarPermisosPorRolAdministracion_() {
  const filas =
    leerHojaComoObjetos(
      HOJAS.PERMISOS_ROL
    );

  const resultado = {};

  filas.forEach(
    function(item) {
      const rol =
        String(
          item.rol || ''
        ).trim();

      const permiso =
        normalizarPermiso(
          item.permiso
        );

      if (
        !rol ||
        !permiso ||
        !convertirBooleano(
          item.activo
        )
      ) {
        return;
      }

      if (!resultado[rol]) {
        resultado[rol] = [];
      }

      if (
        !resultado[rol].includes(
          permiso
        )
      ) {
        resultado[rol].push(
          permiso
        );
      }
    }
  );

  return resultado;
}


function obtenerEncabezadosAdministracion_(
  hoja
) {
  return hoja
    .getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(
      function(valor) {
        return String(
          valor || ''
        )
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /[^a-z0-9]/g,
            ''
          );
      }
    )
    .map(
      function(campo) {
        const mapa = {
          rol: 'rol',
          permiso: 'permiso',
          activo: 'activo'
        };

        return mapa[campo] ||
          campo;
      }
    );
}


/**
 * Crea un usuario con asociación opcional a un servidor.
 */
function crearUsuarioSistema(token, datosEntrada) {
  const sesion = validarAdministradorSistema(token);
  const datos = datosEntrada || {};
  const usuario = normalizarTexto(datos.usuario);
  const rol = validarRolActivo(datos.rol);
  const servidorId = String(datos.servidorId || '').trim();
  const nombre = String(datos.nombre || '').trim();

  if (!usuario) throw crearErrorAplicacion('USUARIO_REQUERIDO', 'Debe ingresar el usuario.');
  if (buscarUsuarioPorUsuario(usuario)) throw crearErrorAplicacion('USUARIO_DUPLICADO', 'Ya existe un usuario con ese nombre de acceso.');

  var servidor = null;
  if (servidorId) servidor = obtenerServidorPorId(servidorId);
  if (!servidorId && !nombre) throw crearErrorAplicacion('NOMBRE_REQUERIDO', 'Los usuarios sin servidor asociado deben tener un nombre.');

  const passwordInicial = String(obtenerConfiguracion('passwordInicialUsuarios', 'Bienvenido2026*'));
  validarPoliticaPassword(passwordInicial);
  const credencial = crearCredencialPassword(passwordInicial);
  const hoja = obtenerHoja(HOJAS.USUARIOS);
  const encabezadosOriginales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0];
  const mapa = {
    id: Utilities.getUuid(),
    usuario: usuario,
    nombre: servidor ? '' : nombre,
    salt: credencial.salt,
    clavehash: credencial.claveHash,
    rol: rol.rol,
    activo: 'Sí',
    correo: String(datos.correo || '').trim(),
    celular: String(datos.celular || '').trim(),
    servidorid: servidorId,
    versionsesion: 1,
    intentosfallidos: 0,
    ultimointentofallido: '',
    bloqueadohasta: '',
    debecambiarpassword: 'Sí'
  };
  hoja.appendRow(encabezadosOriginales.map(function(h) {
    const k = normalizarEncabezadoUsuarioAdministracion_(h);
    return Object.prototype.hasOwnProperty.call(mapa, k) ? mapa[k] : '';
  }));

  registrarAuditoria({usuario:sesion.usuario,nombre:sesion.nombre,accion:'CREAR_USUARIO',entidad:'Usuarios',idRegistro:mapa.id,detalle:JSON.stringify({usuario:usuario,rol:rol.rol,servidorId:servidorId})});
  return { id: mapa.id, usuario: usuario, nombre: servidor ? servidor.nombre : nombre, rol: rol.rol, servidorId: servidorId, passwordInicial: passwordInicial };
}

/** Actualiza los datos administrativos de un usuario. */
function editarUsuarioSistema(token, id, datosEntrada) {
  const sesion = validarAdministradorSistema(token);
  const datos = datosEntrada || {};
  const hoja = obtenerHoja(HOJAS.USUARIOS);
  const valores = hoja.getDataRange().getValues();
  const headers = valores[0].map(normalizarEncabezadoUsuarioAdministracion_);
  const iId = headers.indexOf('id');
  const filaIndice = valores.findIndex(function(f, i) { return i > 0 && String(f[iId]) === String(id); });
  if (filaIndice < 1) throw crearErrorAplicacion('USUARIO_NO_ENCONTRADO', 'No existe el usuario indicado.');

  const servidorId = String(datos.servidorId || '').trim();
  const nombre = String(datos.nombre || '').trim();
  const rol = validarRolActivo(datos.rol);
  if (servidorId) obtenerServidorPorId(servidorId);
  if (!servidorId && !nombre) throw crearErrorAplicacion('NOMBRE_REQUERIDO', 'Los usuarios sin servidor asociado deben tener un nombre.');

  const cambios = { nombre: servidorId ? '' : nombre, rol: rol.rol, activo: convertirBooleano(datos.activo) ? 'Sí' : 'No', correo:String(datos.correo||'').trim(), celular:String(datos.celular||'').trim(), servidorid:servidorId };
  Object.keys(cambios).forEach(function(campo) {
    const col = headers.indexOf(campo);
    if (col >= 0) hoja.getRange(filaIndice + 1, col + 1).setValue(cambios[campo]);
  });
  const colVersion = headers.indexOf('versionsesion');
  if (colVersion >= 0) hoja.getRange(filaIndice + 1, colVersion + 1).setValue(Number(valores[filaIndice][colVersion] || 0) + 1);

  registrarAuditoria({usuario:sesion.usuario,nombre:sesion.nombre,accion:'EDITAR_USUARIO',entidad:'Usuarios',idRegistro:id,detalle:JSON.stringify(cambios)});
  return { id:id, actualizado:true };
}

function normalizarEncabezadoUsuarioAdministracion_(valor) {
  return String(valor || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}
