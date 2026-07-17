export const TEMA_PREDETERMINADO = Object.freeze({
  temaNombre: 'Emaús Verde',
  temaModo: 'claro',
  sistemaNombre: 'Centro de Control Emaús',
  sistemaSubtitulo: 'Gestión integral del retiro',
  sistemaAutor: 'Juan José Arango Díaz',
  sistemaVersion: 'v2.0',
  sistemaFooter: 'Comunidad Emaús Santa Teresita del Niño Jesús',
  temaColorPrimario: '#173B34',
  temaColorPrimarioOscuro: '#0F2A25',
  temaColorSecundario: '#9FD0C3',
  temaColorAcento: '#C89B3C',
  temaColorFondo: '#F5F7F6',
  temaColorTarjetas: '#FFFFFF',
  temaColorTexto: '#1F2937',
  temaColorTextoSecundario: '#667085',
  temaColorTextoMenu: '#FFFFFF',
  temaColorIconosMenu: '#FFFFFF',
  temaColorExito: '#2E7D32',
  temaColorAdvertencia: '#ED6C02',
  temaColorError: '#D32F2F',
  temaColorInfo: '#1976D2',
  temaBorderRadius: 14,
  temaFuente:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  temaLogo: '',
  temaLogoOscuro: '',
  temaFavicon: '',
});

const REGEX_COLOR_HEX = /^#[0-9A-F]{6}$/i;

function texto(valor, predeterminado) {
  const normalizado = String(valor ?? '').trim();
  return normalizado || predeterminado;
}

function color(valor, predeterminado) {
  const normalizado = String(valor ?? '').trim();
  return REGEX_COLOR_HEX.test(normalizado)
    ? normalizado.toUpperCase()
    : predeterminado;
}

function numero(valor, predeterminado, minimo, maximo) {
  const normalizado = Number(valor);
  if (!Number.isFinite(normalizado)) return predeterminado;
  return Math.min(maximo, Math.max(minimo, normalizado));
}

export function normalizarConfiguracionTema(configuracion = {}) {
  return {
    ...TEMA_PREDETERMINADO,
    ...configuracion,
    temaNombre: texto(configuracion.temaNombre, TEMA_PREDETERMINADO.temaNombre),
    temaModo: texto(configuracion.temaModo, TEMA_PREDETERMINADO.temaModo).toLowerCase(),
    sistemaNombre: texto(configuracion.sistemaNombre, TEMA_PREDETERMINADO.sistemaNombre),
    sistemaSubtitulo: texto(configuracion.sistemaSubtitulo, TEMA_PREDETERMINADO.sistemaSubtitulo),
    sistemaAutor: texto(configuracion.sistemaAutor, TEMA_PREDETERMINADO.sistemaAutor),
    sistemaVersion: texto(configuracion.sistemaVersion, TEMA_PREDETERMINADO.sistemaVersion),
    sistemaFooter: texto(configuracion.sistemaFooter, TEMA_PREDETERMINADO.sistemaFooter),
    temaColorPrimario: color(configuracion.temaColorPrimario, TEMA_PREDETERMINADO.temaColorPrimario),
    temaColorPrimarioOscuro: color(configuracion.temaColorPrimarioOscuro, TEMA_PREDETERMINADO.temaColorPrimarioOscuro),
    temaColorSecundario: color(configuracion.temaColorSecundario, TEMA_PREDETERMINADO.temaColorSecundario),
    temaColorAcento: color(configuracion.temaColorAcento, TEMA_PREDETERMINADO.temaColorAcento),
    temaColorFondo: color(configuracion.temaColorFondo, TEMA_PREDETERMINADO.temaColorFondo),
    temaColorTarjetas: color(configuracion.temaColorTarjetas, TEMA_PREDETERMINADO.temaColorTarjetas),
    temaColorTexto: color(configuracion.temaColorTexto, TEMA_PREDETERMINADO.temaColorTexto),
    temaColorTextoSecundario: color(configuracion.temaColorTextoSecundario, TEMA_PREDETERMINADO.temaColorTextoSecundario),
    temaColorTextoMenu: color(configuracion.temaColorTextoMenu, TEMA_PREDETERMINADO.temaColorTextoMenu),
    temaColorIconosMenu: color(configuracion.temaColorIconosMenu, TEMA_PREDETERMINADO.temaColorIconosMenu),
    temaColorExito: color(configuracion.temaColorExito, TEMA_PREDETERMINADO.temaColorExito),
    temaColorAdvertencia: color(configuracion.temaColorAdvertencia, TEMA_PREDETERMINADO.temaColorAdvertencia),
    temaColorError: color(configuracion.temaColorError, TEMA_PREDETERMINADO.temaColorError),
    temaColorInfo: color(configuracion.temaColorInfo, TEMA_PREDETERMINADO.temaColorInfo),
    temaBorderRadius: numero(configuracion.temaBorderRadius, TEMA_PREDETERMINADO.temaBorderRadius, 0, 40),
    temaFuente: texto(configuracion.temaFuente, TEMA_PREDETERMINADO.temaFuente),
    temaLogo: texto(configuracion.temaLogo, ''),
    temaLogoOscuro: texto(configuracion.temaLogoOscuro, ''),
    temaFavicon: texto(configuracion.temaFavicon, ''),
  };
}
