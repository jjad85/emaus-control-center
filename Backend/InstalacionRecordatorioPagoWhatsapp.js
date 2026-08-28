/**
 * Entrega 6.23
 *
 * Instala:
 * - PAGOS_RECORDAR_PAGO
 * - Configuración whatsappMensajeRecordatorioPago
 *
 * Roles iniciales:
 * - ADMIN
 * - LIDER_RETIRO
 * - TESORERIA
 *
 * Es idempotente.
 */
function instalarRecordatorioPagoWhatsapp() {
  const libro =
    obtenerLibro();

  instalarPermisoRecordatorioPago_(
    libro
  );

  instalarPlantillaRecordatorioPago_(
    libro
  );

  limpiarCachePermisos();
  limpiarCacheConfiguraciones();

  SpreadsheetApp.flush();

  return {
    instalado: true,
    permiso:
      'PAGOS_RECORDAR_PAGO',
    configuracion:
      'whatsappMensajeRecordatorioPago'
  };
}

function instalarPermisoRecordatorioPago_(
  libro
) {
  const hoja =
    libro.getSheetByName(
      HOJAS.PERMISOS_ROL
    );

  if (!hoja) {
    throw new Error(
      'No existe la hoja PermisosRol.'
    );
  }

  const permiso =
    'PAGOS_RECORDAR_PAGO';

  const roles = [
    'ADMIN',
    'LIDER_RETIRO',
    'TESORERIA'
  ];

  const datos =
    hoja.getDataRange().getValues();

  const encabezados =
    (datos[0] || []).map(
      function(valor) {
        return normalizarTexto(
          valor
        ).replace(
          /[^a-z0-9]/g,
          ''
        );
      }
    );

  const iRol =
    encabezados.indexOf('rol');

  const iPermiso =
    encabezados.indexOf('permiso');

  const iActivo =
    encabezados.indexOf('activo');

  if (
    iRol < 0 ||
    iPermiso < 0 ||
    iActivo < 0
  ) {
    throw new Error(
      'PermisosRol debe contener Rol, Permiso y Activo.'
    );
  }

  roles.forEach(
    function(rol) {
      let fila = 0;

      for (
        let i = 1;
        i < datos.length;
        i += 1
      ) {
        if (
          normalizarCodigoRol_(
            datos[i][iRol]
          ) ===
            normalizarCodigoRol_(
              rol
            ) &&
          normalizarPermiso(
            datos[i][iPermiso]
          ) === permiso
        ) {
          fila = i + 1;
          break;
        }
      }

      if (fila) {
        hoja
          .getRange(
            fila,
            iActivo + 1
          )
          .setValue('Sí');

        return;
      }

      const nueva =
        new Array(
          Math.max(
            hoja.getLastColumn(),
            encabezados.length
          )
        ).fill('');

      nueva[iRol] = rol;
      nueva[iPermiso] = permiso;
      nueva[iActivo] = 'Sí';

      hoja.appendRow(
        nueva
      );

      datos.push(
        nueva
      );
    }
  );
}

function instalarPlantillaRecordatorioPago_(
  libro
) {
  const hoja =
    libro.getSheetByName(
      HOJAS.CONFIGURACIONES
    );

  if (!hoja) {
    throw new Error(
      'No existe la hoja Configuraciones.'
    );
  }

  const clave =
    'whatsappMensajeRecordatorioPago';

  const plantilla =
    'Hola {{nombre}} 👋\n\n' +
    'Estamos realizando la conciliación de cuentas del Retiro de Emaús y vemos que tienes un saldo pendiente de {{saldoPendiente}}.\n\n' +
    'Te agradecemos mucho si puedes ayudarnos realizando este pago. Si ya lo realizaste recientemente, por favor ignora este mensaje o compártenos el soporte para actualizar nuestros registros.\n\n' +
    '¡Muchas gracias por tu apoyo! 🙏';

  const datos =
    hoja
      .getDataRange()
      .getDisplayValues();

  const encabezados =
    (datos[0] || []).map(
      function(valor) {
        return normalizarTexto(
          valor
        ).replace(
          /[^a-z0-9]/g,
          ''
        );
      }
    );

  const iClave =
    encabezados.indexOf(
      'clave'
    );

  if (iClave < 0) {
    throw new Error(
      'Configuraciones debe contener la columna Clave.'
    );
  }

  const filaExistente =
    datos
      .slice(1)
      .findIndex(
        function(fila) {
          return normalizarTexto(
            fila[iClave]
          ) ===
            normalizarTexto(
              clave
            );
        }
      );

  if (filaExistente >= 0) {
    return;
  }

  const fila =
    new Array(
      Math.max(
        hoja.getLastColumn(),
        encabezados.length
      )
    ).fill('');

  function asignar(
    nombres,
    valor
  ) {
    for (
      let i = 0;
      i < nombres.length;
      i += 1
    ) {
      const indice =
        encabezados.indexOf(
          nombres[i]
        );

      if (indice >= 0) {
        fila[indice] = valor;
        return;
      }
    }
  }

  asignar(
    ['clave'],
    clave
  );

  asignar(
    [
      'nombrevisible',
      'nombre',
      'etiqueta'
    ],
    'Mensaje WhatsApp - Recordatorio de pago'
  );

  asignar(
    ['valor'],
    plantilla
  );

  asignar(
    ['tipo'],
    'Texto'
  );

  asignar(
    ['descripcion'],
    'Mensaje parametrizable para recordar saldo pendiente. Variables: {{nombre}}, {{saldoPendiente}}, {{valorRetiro}}, {{totalAprobado}}, {{tipoPersona}}'
  );

  asignar(
    ['activo'],
    'Sí'
  );

  hoja.appendRow(
    fila
  );
}
