/**
 * ============================================================
 * FUNCIONES COMUNES
 * ============================================================
 */

/**
 * Compara texto parcialmente.
 */
function coincideTexto(
  valor,
  filtro
) {
  if (
    filtro === undefined ||
    filtro === null ||
    String(filtro).trim() === ''
  ) {
    return true;
  }

  return normalizarTexto(valor)
    .includes(
      normalizarTexto(filtro)
    );
}

/**
 * Compara valores exactamente,
 * ignorando tildes, espacios y mayúsculas.
 */
function coincideExacto(
  valor,
  filtro
) {
  if (
    filtro === undefined ||
    filtro === null ||
    String(filtro).trim() === ''
  ) {
    return true;
  }

  return (
    normalizarTexto(valor) ===
    normalizarTexto(filtro)
  );
}

/**
 * Valida si un tema coincide.
 */
function coincideTema(
  temas,
  filtro
) {
  if (
    !filtro ||
    String(filtro).trim() === ''
  ) {
    return true;
  }

  return temas.some(function(tema) {
    return coincideTexto(
      tema,
      filtro
    );
  });
}

/**
 * Separa varios temas guardados en una celda.
 *
 * Ejemplo:
 * Tema 1 | Tema 2
 */
function separarTemas(valor) {
  if (!valor) {
    return [];
  }

  return String(valor)
    .split('|')
    .map(function(tema) {
      return tema.trim();
    })
    .filter(Boolean);
}

/**
 * Cuenta estados y normaliza las claves.
 */
function contarEstados(
  items,
  obtenerValor
) {
  return items.reduce(
    function(resultado, item) {
      const valor =
        obtenerValor(item) ||
        'Sin definir';

      const clave =
        normalizarTexto(valor)
          .replace(/\s+/g, '');

      resultado[clave] =
        (resultado[clave] || 0) + 1;

      return resultado;
    },
    {}
  );
}

/**
 * Calcula porcentaje entero.
 */
function calcularPorcentaje(
  cantidad,
  total
) {
  if (!total) {
    return 0;
  }

  return Math.round(
    (Number(cantidad) /
      Number(total)) *
      100
  );
}

/**
 * Normaliza un celular colombiano.
 *
 * Elimina espacios, guiones, paréntesis y el prefijo +57/57.
 * Devuelve siempre 10 dígitos nacionales.
 */
function normalizarCelularColombia(
  valor
) {
  let numero = String(
    valor || ''
  ).replace(/\D/g, '');

  if (
    numero.length === 12 &&
    numero.indexOf('57') === 0
  ) {
    numero = numero.substring(2);
  }

  return numero;
}

/**
 * Valida y devuelve un celular colombiano normalizado.
 */
function validarCelularColombia(
  valor,
  opciones
) {
  const config = opciones || {};
  const requerido =
    config.requerido !== false;
  const etiqueta =
    String(
      config.etiqueta ||
      'El celular'
    );

  const numero =
    normalizarCelularColombia(
      valor
    );

  if (!numero) {
    if (!requerido) {
      return '';
    }

    throw crearErrorAplicacion(
      'CELULAR_REQUERIDO',
      etiqueta +
        ' es obligatorio.'
    );
  }

  if (!/^3\d{9}$/.test(numero)) {
    throw crearErrorAplicacion(
      'CELULAR_INVALIDO',
      etiqueta +
        ' debe tener exactamente 10 dígitos y comenzar por 3.'
    );
  }

  if (
    /^(\d)\1{9}$/.test(numero) ||
    /^(0123456789|1234567890|0987654321)$/.test(numero)
  ) {
    throw crearErrorAplicacion(
      'CELULAR_INVALIDO',
      etiqueta +
        ' no parece ser válido.'
    );
  }

  return numero;
}
