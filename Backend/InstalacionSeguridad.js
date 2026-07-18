/**
 * ============================================================
 * INSTALACIÓN DE ROLES Y PERMISOS
 * ============================================================
 *
 * Crea las hojas Roles y PermisosRol si no existen.
 * No elimina ni reemplaza información existente.
 */

function instalarRolesYPermisos() {
  const libro =
    obtenerLibro();

  let hojaRoles =
    libro.getSheetByName(
      HOJAS.ROLES
    );

  if (!hojaRoles) {
    hojaRoles =
      libro.insertSheet(
        HOJAS.ROLES
      );
  }

  if (
    hojaRoles.getLastRow() === 0
  ) {
    hojaRoles.appendRow([
      'Rol',
      'Descripcion',
      'Activo'
    ]);

    const roles = [
      [
        'Administrador',
        'Acceso completo a todas las funciones.',
        'Sí'
      ],
      [
        'Registro',
        'Registro y edición general de caminantes.',
        'Sí'
      ],
      [
        'Tesorería',
        'Actualización de pagos.',
        'Sí'
      ],
      [
        'Logística',
        'Asignación de mesas y habitaciones.',
        'Sí'
      ],
      [
        'Entregables',
        'Actualización de cartas y fotos.',
        'Sí'
      ],
      [
        'Consulta',
        'Solo consulta de información.',
        'Sí'
      ]
    ];

    hojaRoles
      .getRange(
        2,
        1,
        roles.length,
        roles[0].length
      )
      .setValues(
        roles
      );
  }

  let hojaPermisos =
    libro.getSheetByName(
      HOJAS.PERMISOS_ROL
    );

  if (!hojaPermisos) {
    hojaPermisos =
      libro.insertSheet(
        HOJAS.PERMISOS_ROL
      );
  }

  if (
    hojaPermisos.getLastRow() === 0
  ) {
    hojaPermisos.appendRow([
      'Rol',
      'Permiso',
      'Activo'
    ]);

    const permisos = [
      ['Administrador', 'REGISTRAR_CAMINANTE', 'Sí'],
      ['Administrador', 'EDITAR_CAMINANTE', 'Sí'],
      ['Administrador', 'ACTUALIZAR_PAGO', 'Sí'],
      ['Administrador', 'ASIGNAR_MESA', 'Sí'],
      ['Administrador', 'ASIGNAR_HABITACION', 'Sí'],
      ['Administrador', 'ACTUALIZAR_CARTA', 'Sí'],
      ['Administrador', 'ACTUALIZAR_FOTO', 'Sí'],
      ['Administrador', 'REGISTRAR_SERVIDOR', 'Sí'],
      ['Administrador', 'EDITAR_SERVIDOR', 'Sí'],
      ['Administrador', 'ACTUALIZAR_PAGO_SERVIDOR', 'Sí'],
      ['Administrador', 'ADMINISTRAR_PRESENTACIONES', 'Sí'],
      ['Administrador', 'ADMINISTRAR_USUARIOS', 'Sí'],

      ['Registro', 'REGISTRAR_CAMINANTE', 'Sí'],
      ['Registro', 'EDITAR_CAMINANTE', 'Sí'],
      ['Registro', 'ACTUALIZAR_CARTA', 'Sí'],
      ['Registro', 'ACTUALIZAR_FOTO', 'Sí'],

      ['Tesorería', 'ACTUALIZAR_PAGO', 'Sí'],
      ['Tesorería', 'ACTUALIZAR_PAGO_SERVIDOR', 'Sí'],

      ['Logística', 'ASIGNAR_MESA', 'Sí'],
      ['Logística', 'ASIGNAR_HABITACION', 'Sí'],

      ['Entregables', 'ACTUALIZAR_CARTA', 'Sí'],
      ['Entregables', 'ACTUALIZAR_FOTO', 'Sí']
    ];

    hojaPermisos
      .getRange(
        2,
        1,
        permisos.length,
        permisos[0].length
      )
      .setValues(
        permisos
      );
  }

  limpiarCachePermisos();

  return {
    roles:
      hojaRoles.getName(),

    permisosRol:
      hojaPermisos.getName(),

    mensaje:
      'Roles y permisos instalados correctamente.'
  };
}
