/**
 * ============================================================
 * ANGELITOS SERVICE
 * ============================================================
 * Registro público de personas que desean servir como Angelitos.
 */

function registrarAngelitoPublico(datos) {
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
  const diaServicio = String(entrada.diaServicio || '').trim();
  const tipoTransporte = String(entrada.tipoTransporte || '').trim();
  const vaEnVehiculo = ['Carro', 'Moto'].indexOf(tipoTransporte) >= 0;
  const deseaLlevarAlguien = vaEnVehiculo && convertirBooleano(entrada.deseaLlevarAlguien);
  const cuposDisponibles = deseaLlevarAlguien ? Number(entrada.cuposDisponibles || 0) : 0;
  const lugarSalida = vaEnVehiculo ? String(entrada.lugarSalida || '').trim() : '';
  const horaSalida = vaEnVehiculo ? String(entrada.horaSalida || '').trim() : '';
  const observaciones = String(entrada.observaciones || '').trim();
  const aceptaDeclaracion = convertirBooleano(entrada.aceptaDeclaracion);

  if (!nombreCompleto) {
    throw crearErrorAplicacion('ANGELITO_NOMBRE_REQUERIDO', 'Debes ingresar tu nombre completo.');
  }

  if (!documento) {
    throw crearErrorAplicacion('ANGELITO_DOCUMENTO_REQUERIDO', 'Debes ingresar tu número de documento.');
  }

  if (!/^3\d{9}$/.test(celular)) {
    throw crearErrorAplicacion('ANGELITO_CELULAR_INVALIDO', 'El celular debe iniciar por 3 y tener exactamente 10 dígitos.');
  }

  if (!realizoEmaus) {
    throw crearErrorAplicacion(
      'ANGELITO_REQUIERE_EMAUS',
      'Para servir como Angelito es necesario haber vivido previamente un Retiro de Emaús.'
    );
  }

  if (!parroquiaEmaus || !ciudadEmaus) {
    throw crearErrorAplicacion(
      'ANGELITO_DATOS_EMAUS_REQUERIDOS',
      'Indica la parroquia o comunidad y la ciudad donde viviste Emaús.'
    );
  }

  if (anioEmaus && !/^\d{4}$/.test(anioEmaus)) {
    throw crearErrorAplicacion('ANGELITO_ANIO_EMAUS_INVALIDO', 'El año aproximado de Emaús debe tener cuatro dígitos.');
  }

  if (['Viernes', 'Sábado'].indexOf(diaServicio) < 0) {
    throw crearErrorAplicacion('ANGELITO_DIA_REQUERIDO', 'Selecciona si participarás el viernes o el sábado.');
  }

  if (['Carro', 'Moto', 'Sin vehículo'].indexOf(tipoTransporte) < 0) {
    throw crearErrorAplicacion(
      'ANGELITO_TRANSPORTE_REQUERIDO',
      'Selecciona si vas en carro, moto o sin vehículo.'
    );
  }

  if (vaEnVehiculo && !lugarSalida) {
    throw crearErrorAplicacion(
      'ANGELITO_SALIDA_REQUERIDA',
      'Indica desde dónde sales con el vehículo.'
    );
  }

  if (vaEnVehiculo && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaSalida)) {
    throw crearErrorAplicacion(
      'ANGELITO_HORA_SALIDA_REQUERIDA',
      'Indica una hora de salida válida.'
    );
  }

  if (deseaLlevarAlguien) {
    const maximoCuposs = tipoTransporte === 'Moto' ? 1 : 4;

    if (
      !Number.isFinite(cuposDisponibles) ||
      cuposDisponibles < 1 ||
      cuposDisponibles > maximoCuposs
    ) {
      throw crearErrorAplicacion(
        'ANGELITO_CUPOS_INVALIDOS',
        tipoTransporte === 'Moto'
          ? 'En moto puedes registrar máximo 1 cupo adicional.'
          : 'En carro puedes registrar máximo 4 cupos.'
      );
    }
  }

  if (!aceptaDeclaracion) {
    throw crearErrorAplicacion(
      'ANGELITO_DECLARACION_REQUERIDA',
      'Debes confirmar que la información suministrada es verdadera.'
    );
  }

  const existentes = listarRegistrosSheet(
    HOJAS.ANGELITOS,
    {},
    { campoId: 'id', campoActivo: 'activo' }
  );

  const duplicado = existentes.find(function(item) {
    return String(item.documento || '').trim() === documento &&
      String(item.diaServicio || '').trim() === diaServicio &&
      convertirBooleano(item.activo);
  });

  if (duplicado) {
    throw crearErrorAplicacion(
      'ANGELITO_INSCRIPCION_DUPLICADA',
      'Ya existe una inscripción activa con este documento para el día seleccionado.'
    );
  }

  return crearRegistroSheet(
    HOJAS.ANGELITOS,
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
      diaServicio: diaServicio,
      tipoTransporte: tipoTransporte,
      vaEnVehiculo: vaEnVehiculo ? 'Sí' : 'No',
      tieneCupoLibre: cuposDisponibles > 0 ? 'Sí' : 'No',
      deseaLlevarAlguien: deseaLlevarAlguien ? 'Sí' : 'No',
      cuposDisponibles: cuposDisponibles || '',
      lugarSalida: lugarSalida,
      horaSalida: horaSalida,
      observaciones: observaciones,
      validacionEmaus: 'Declarado por participante',
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
