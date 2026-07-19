/**
 * ============================================================
 * ADMINISTRACIÓN DEL SISTEMA
 * ============================================================
 *
 * Funciones exclusivas para los roles:
 * - Administrador
 * - Administradores
 */

function validarAdministradorSistema(
  token
) {
  const sesion =
    obtenerSesion(token);

  const rol =
    normalizarTexto(
      sesion.rol
    );

  if (
    rol !== 'administrador' &&
    rol !== 'administradores'
  ) {
    throw crearErrorAplicacion(
      'ADMINISTRADOR_REQUERIDO',
      'Esta funcionalidad es exclusiva para administradores.'
    );
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

  const catalogo =
    listarCatalogoPermisos_();

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
            indiceNombre >= 0
              ? fila[indiceNombre]
              : '',

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
  const filas =
    leerHojaComoObjetos(
      HOJAS.PERMISOS_ROL
    );

  const unicos = {};

  filas.forEach(
    function(item) {
      const permiso =
        normalizarPermiso(
          item.permiso
        );

      if (permiso) {
        unicos[permiso] =
          true;
      }
    }
  );

  return Object.keys(
    unicos
  ).sort();
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
