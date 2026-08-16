/**
 * ============================================================
 * SERENATA / APOYO AUDIOVISUAL SERVICE
 * ============================================================
 * Registro público de personas que desean brindar apoyo
 * audiovisual en un momento especial del retiro.
 *
 * En el portal público no se revela la dinámica interna
 * de la serenata; administrativamente se conserva la hoja
 * "Serenata".
 */

function registrarApoyoAudiovisualPublico(datos) {
  const entrada = datos || {};

  const nombreCompleto = String(entrada.nombreCompleto || '').trim();
  const documento = String(entrada.documento || '').trim();
  const celular = String(entrada.celular || '').replace(/\D/g, '');
  const correo = String(entrada.correo || '').trim();

  const realizoEmaus = convertirBooleano(entrada.realizoEmaus);
  const parroquiaEmaus = String(entrada.parroquiaEmaus || '').trim();
  const ciudadEmaus = String(entrada.ciudadEmaus || '').trim();
  const paisEmaus = String(entrada.paisEmaus || '').trim();
  const anioEmaus = String(entrada.anioEmaus || '').trim();

  const tipoTransporte = String(entrada.tipoTransporte || '').trim();
  const vaEnVehiculo = ['Carro', 'Moto'].indexOf(tipoTransporte) >= 0;
  const deseaLlevarAlguien =
    vaEnVehiculo && convertirBooleano(entrada.deseaLlevarAlguien);
  const cuposDisponibles =
    deseaLlevarAlguien ? Number(entrada.cuposDisponibles || 0) : 0;
  const lugarSalida =
    vaEnVehiculo ? String(entrada.lugarSalida || '').trim() : '';
  const horaSalida =
    vaEnVehiculo ? String(entrada.horaSalida || '').trim() : '';

  const observaciones = String(entrada.observaciones || '').trim();
  const aceptaDeclaracion =
    convertirBooleano(entrada.aceptaDeclaracion);

  if (!nombreCompleto) {
    throw crearErrorAplicacion(
      'SERENATA_NOMBRE_REQUERIDO',
      'Debes ingresar tu nombre completo.'
    );
  }

  if (!documento) {
    throw crearErrorAplicacion(
      'SERENATA_DOCUMENTO_REQUERIDO',
      'Debes ingresar tu número de documento.'
    );
  }

  if (!/^3\d{9}$/.test(celular)) {
    throw crearErrorAplicacion(
      'SERENATA_CELULAR_INVALIDO',
      'El celular debe iniciar por 3 y tener exactamente 10 dígitos.'
    );
  }

  if (!realizoEmaus) {
    throw crearErrorAplicacion(
      'SERENATA_REQUIERE_EMAUS',
      'Para brindar este apoyo es necesario haber vivido previamente un Retiro de Emaús.'
    );
  }

  if (!parroquiaEmaus || !ciudadEmaus) {
    throw crearErrorAplicacion(
      'SERENATA_DATOS_EMAUS_REQUERIDOS',
      'Indica la parroquia o comunidad y la ciudad donde viviste Emaús.'
    );
  }

  if (anioEmaus && !/^\d{4}$/.test(anioEmaus)) {
    throw crearErrorAplicacion(
      'SERENATA_ANIO_EMAUS_INVALIDO',
      'El año aproximado de Emaús debe tener cuatro dígitos.'
    );
  }

  if (['Carro', 'Moto', 'Sin vehículo'].indexOf(tipoTransporte) < 0) {
    throw crearErrorAplicacion(
      'SERENATA_TRANSPORTE_REQUERIDO',
      'Selecciona si vas en carro, moto o sin vehículo.'
    );
  }

  if (vaEnVehiculo && !lugarSalida) {
    throw crearErrorAplicacion(
      'SERENATA_SALIDA_REQUERIDA',
      'Indica desde dónde sales con el vehículo.'
    );
  }

  if (
    vaEnVehiculo &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaSalida)
  ) {
    throw crearErrorAplicacion(
      'SERENATA_HORA_SALIDA_REQUERIDA',
      'Indica una hora de salida válida.'
    );
  }

  if (deseaLlevarAlguien) {
    const maximoCupos =
      tipoTransporte === 'Moto' ? 1 : 4;

    if (
      !Number.isFinite(cuposDisponibles) ||
      cuposDisponibles < 1 ||
      cuposDisponibles > maximoCupos
    ) {
      throw crearErrorAplicacion(
        'SERENATA_CUPOS_INVALIDOS',
        tipoTransporte === 'Moto'
          ? 'En moto puedes registrar máximo 1 cupo adicional.'
          : 'En carro puedes registrar máximo 4 cupos.'
      );
    }
  }

  if (!aceptaDeclaracion) {
    throw crearErrorAplicacion(
      'SERENATA_DECLARACION_REQUERIDA',
      'Debes confirmar que la información suministrada es verdadera.'
    );
  }

  const existentes = listarRegistrosSheet(
    HOJAS.SERENATA,
    {},
    {
      campoId: 'id',
      campoActivo: 'activo'
    }
  );

  const duplicado = existentes.find(function(item) {
    return (
      String(item.documento || '').trim() === documento &&
      convertirBooleano(item.activo)
    );
  });

  if (duplicado) {
    throw crearErrorAplicacion(
      'SERENATA_INSCRIPCION_DUPLICADA',
      'Ya existe una inscripción activa con este documento.'
    );
  }

  return crearRegistroSheet(
    HOJAS.SERENATA,
    {
      nombreCompleto: nombreCompleto,
      documento: documento,
      celular: celular,
      correo: correo,

      realizoEmaus: 'Sí',
      parroquiaEmaus: parroquiaEmaus,
      ciudadEmaus: ciudadEmaus,
      paisEmaus: paisEmaus,
      anioEmaus: anioEmaus,

      tipoTransporte: tipoTransporte,
      vaEnVehiculo: vaEnVehiculo ? 'Sí' : 'No',
      tieneCupoLibre:
        cuposDisponibles > 0 ? 'Sí' : 'No',
      deseaLlevarAlguien:
        deseaLlevarAlguien ? 'Sí' : 'No',
      cuposDisponibles:
        cuposDisponibles || '',
      lugarSalida: lugarSalida,
      horaSalida: horaSalida,

      observaciones: observaciones,
      validacionEmaus:
        'Declarado por participante',
      estadoInscripcion: 'Pendiente',
      origenRegistro: 'Portal público',
      aceptaDeclaracion: 'Sí',
      activo: 'Sí',
      fechaRegistro: new Date(),
      fechaActualizacion: new Date(),
      actualizadoPor: 'PORTAL_PUBLICO'
    },
    {
      campoId: 'id',
      campoActivo: 'activo',
      campoFechaRegistro: 'fechaRegistro',
      campoFechaActualizacion: 'fechaActualizacion',
      campoActualizadoPor: 'actualizadoPor',
      usuario: 'PORTAL_PUBLICO'
    }
  );
}
