/**
 * Corrección 6.24.1
 *
 * Estandarización de estados de pago para AMBAS poblaciones:
 * Caminantes y Servidores.
 *
 * Pendiente     = 0%
 * Pago Parcial  = >0% y <100%
 * Pago Total    = 100% exacto
 * Pago Excedido = >100%
 * Exento        = únicamente Servidores exentos
 */
function estandarizarEstadosPagoPersonas() {
  const usuario =
    'MIGRACION_ESTADOS_PAGO';

  const resultado = {
    caminantes: {
      procesados: 0,
      Pendiente: 0,
      'Pago Parcial': 0,
      'Pago Total': 0,
      'Pago Excedido': 0
    },
    servidores: {
      procesados: 0,
      Pendiente: 0,
      'Pago Parcial': 0,
      'Pago Total': 0,
      'Pago Excedido': 0,
      Exento: 0
    }
  };

  leerHojaComoObjetos(
    HOJAS.CAMINANTES
  ).forEach(function(persona) {
    if (!persona.id) return;

    recalcularEstadoPagoCaminante(
      persona.id,
      usuario
    );

    const actualizado =
      leerRegistroPorIdSheet(
        HOJAS.CAMINANTES,
        persona.id,
        { usuario: usuario }
      );

    const estado =
      String(
        actualizado.estadoPago ||
        'Pendiente'
      ).trim();

    resultado.caminantes.procesados += 1;

    if (
      Object.prototype.hasOwnProperty.call(
        resultado.caminantes,
        estado
      )
    ) {
      resultado.caminantes[estado] += 1;
    }
  });

  leerHojaComoObjetos(
    HOJAS.SERVIDORES
  ).forEach(function(persona) {
    if (!persona.id) return;

    recalcularEstadoPagoServidor_(
      persona.id,
      usuario
    );

    const actualizado =
      leerRegistroPorIdSheet(
        HOJAS.SERVIDORES,
        persona.id,
        { usuario: usuario }
      );

    const estado =
      String(
        actualizado.estadoPago ||
        'Pendiente'
      ).trim();

    resultado.servidores.procesados += 1;

    if (
      Object.prototype.hasOwnProperty.call(
        resultado.servidores,
        estado
      )
    ) {
      resultado.servidores[estado] += 1;
    }
  });

  SpreadsheetApp.flush();

  return resultado;
}
