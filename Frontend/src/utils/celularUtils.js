/**
 * Normaliza celulares colombianos para almacenarlos siempre con 10 dígitos.
 *
 * Acepta entradas como:
 * - 300 123 4567
 * - 300-123-4567
 * - +57 300 123 4567
 * - 57 300 123 4567
 */
export function normalizarCelularColombia(valor = '') {
  let numero = String(valor || '')
    .replace(/\D/g, '');

  if (
    numero.length === 12 &&
    numero.startsWith('57')
  ) {
    numero = numero.slice(2);
  }

  return numero.slice(0, 10);
}

export function obtenerErrorCelularColombia(
  valor,
  {
    requerido = true,
    etiqueta = 'El celular',
  } = {}
) {
  const numero =
    normalizarCelularColombia(valor);

  if (!numero) {
    return requerido
      ? `${etiqueta} es obligatorio.`
      : '';
  }

  if (numero.length !== 10) {
    const faltantes =
      Math.max(0, 10 - numero.length);

    return faltantes > 0
      ? `${etiqueta} debe tener 10 dígitos. Faltan ${faltantes}.`
      : `${etiqueta} debe tener exactamente 10 dígitos.`;
  }

  if (!numero.startsWith('3')) {
    return `${etiqueta} debe comenzar por 3.`;
  }

  if (/^(\d)\1{9}$/.test(numero)) {
    return `${etiqueta} no parece ser válido.`;
  }

  if (/^(0123456789|1234567890|0987654321)$/.test(numero)) {
    return `${etiqueta} no parece ser válido.`;
  }

  return '';
}

export function esCelularColombiaValido(
  valor,
  opciones
) {
  return !obtenerErrorCelularColombia(
    valor,
    opciones
  );
}
