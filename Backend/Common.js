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