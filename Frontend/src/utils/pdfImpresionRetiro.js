import adlamDisplayUrl from '../assets/fonts/ADLaMDisplay-Regular.ttf?url';

const JSPDF_URL = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';

const FUENTES_SOPORTADAS = new Set(['adlam', 'helvetica', 'times', 'courier']);
const NOMBRE_FUENTE_ADLAM = 'ADLaM Display';
let adlamBase64Cache = null;

function cargarJsPdf() {
  if (window.jspdf) return Promise.resolve(window.jspdf);

  return new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = JSPDF_URL;
    s.onload = () => ok(window.jspdf);
    s.onerror = () => no(new Error('No fue posible cargar el generador PDF.'));
    document.head.appendChild(s);
  });
}

function cargarImagen(src) {
  return new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => no(new Error('No fue posible cargar la plantilla de impresión.'));
    i.src = src;
  });
}

async function prepararImagenConFondoBlanco(src) {
  const imagen = await cargarImagen(src);
  const canvas = document.createElement('canvas');
  canvas.width = imagen.naturalWidth || imagen.width;
  canvas.height = imagen.naturalHeight || imagen.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}

function normalizarFuente(fuente) {
  const valor = String(fuente || 'helvetica').toLowerCase().trim();
  return FUENTES_SOPORTADAS.has(valor) ? valor : 'helvetica';
}

function nombreFuenteJsPdf(fuente) {
  const normalizada = normalizarFuente(fuente);
  return normalizada === 'adlam' ? NOMBRE_FUENTE_ADLAM : normalizada;
}

async function obtenerAdlamBase64() {
  if (adlamBase64Cache) return adlamBase64Cache;

  let response;
  try {
    response = await fetch(adlamDisplayUrl);
  } catch (_) {
    throw new Error(
      'No fue posible cargar ADLaM Display. Verifica que ADLaMDisplay-Regular.ttf exista en Frontend/src/assets/fonts/.',
    );
  }

  if (!response.ok) {
    throw new Error(
      'No fue posible cargar ADLaM Display. Verifica que ADLaMDisplay-Regular.ttf exista en Frontend/src/assets/fonts/.',
    );
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const partes = [];
  const bloque = 0x8000;

  for (let i = 0; i < bytes.length; i += bloque) {
    partes.push(String.fromCharCode(...bytes.subarray(i, i + bloque)));
  }

  adlamBase64Cache = btoa(partes.join(''));
  return adlamBase64Cache;
}

async function registrarFuenteSeleccionada(doc, fuente) {
  const normalizada = normalizarFuente(fuente);
  if (normalizada !== 'adlam') return;

  const base64 = await obtenerAdlamBase64();
  const archivo = 'ADLaMDisplay-Regular.ttf';

  // Se registra el mismo TTF como normal y bold para que el código existente
  // pueda pedir ambos estilos sin que jsPDF cambie silenciosamente de familia.
  doc.addFileToVFS(archivo, base64);
  doc.addFont(archivo, NOMBRE_FUENTE_ADLAM, 'normal');
  doc.addFont(archivo, NOMBRE_FUENTE_ADLAM, 'bold');
}

function numeroPositivo(valor, defecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : defecto;
}

function ajustarFuente(doc, texto, maxWidth, inicial, min = 7) {
  let s = inicial;
  doc.setFontSize(s);
  while (s > min && doc.getTextWidth(texto) > maxWidth) {
    s -= 0.5;
    doc.setFontSize(s);
  }
  return s;
}

async function dibujarEscarapela(doc, img, x, y, w, h, c, opciones) {
  const fuente = nombreFuenteJsPdf(opciones.fuente);
  const central = numeroPositivo(opciones.tamanoCentralPt, 20);
  const inferior = numeroPositivo(opciones.tamanoInferiorPt, 11);
  const nombre = String(c.nombre || '');

  // Fondo explícitamente blanco para evitar bordes negros en zonas
  // transparentes o redondeadas de la imagen al generar el PDF.
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  doc.addImage(img, 'PNG', x, y, w, h);

  doc.setTextColor(20, 35, 45);
  doc.setFont(fuente, 'bold');

  // El título CAMINANTE usa exactamente el tamaño central configurado.
  doc.setFontSize(central);
  doc.text('CAMINANTE', x + w / 2, y + h * 0.34, { align: 'center' });

  ajustarFuente(doc, nombre, w * 0.88, central, Math.max(9, central * 0.55));
  doc.text(nombre, x + w / 2, y + h * 0.49, { align: 'center' });

  doc.setFont(fuente, 'bold');
  doc.setFontSize(inferior);
  doc.text(`Mesa ${c.mesa || ''}`, x + w * 0.09, y + h * 0.79);
  doc.text(`Habitación ${c.habitacion || ''}`, x + w * 0.09, y + h * 0.88);
}

async function dibujarHabitacion(doc, img, x, y, w, h, hab, opciones) {
  const fuente = nombreFuenteJsPdf(opciones.fuente);
  const central = numeroPositivo(opciones.tamanoCentralPt, 18);
  const inferior = numeroPositivo(opciones.tamanoInferiorPt, 10);

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  doc.addImage(img, 'PNG', x, y, w, h);

  doc.setTextColor(20, 35, 45);
  doc.setFont(fuente, 'bold');
  doc.setFontSize(central);
  doc.text(`Habitación ${hab.habitacion || ''}`, x + w / 2, y + h * 0.25, {
    align: 'center',
  });

  const personas = hab.personas || [];
  const inicio = y + h * 0.40;
  const espacio = Math.min(h * 0.13, (h * 0.48) / Math.max(personas.length, 1));

  personas.forEach((p, i) => {
    const yy = inicio + i * espacio;
    doc.setFont(fuente, 'bold');
    ajustarFuente(
      doc,
      p.nombre || '',
      w * 0.84,
      central,
      Math.max(9, central * 0.55),
    );
    doc.text(p.nombre || '', x + w / 2, yy, { align: 'center' });

    doc.setFont(fuente, 'normal');
    doc.setFontSize(inferior);
    doc.text(p.tipoPersona || '', x + w / 2, yy + 4.2, { align: 'center' });
  });
}

async function generar(items, plantilla, tipo, nombre) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No hay registros para generar.');
  }

  const { jsPDF } = await cargarJsPdf();
  const imagenAplanada = await prepararImagenConFondoBlanco(plantilla.base64);
  const w = Number(plantilla.anchoCm) * 10;
  const h = Number(plantilla.altoCm) * 10;

  if (!(w > 0 && h > 0)) {
    throw new Error('Las dimensiones de la plantilla no son válidas.');
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pw = 210;
  const ph = 297;
  const m = 7;
  const g = 3;

  if (w > pw - 2 * m || h > ph - 2 * m) {
    throw new Error('Las dimensiones configuradas son mayores que una página A4.');
  }

  const cols = Math.max(1, Math.floor((pw - 2 * m + g) / (w + g)));
  const rows = Math.max(1, Math.floor((ph - 2 * m + g) / (h + g)));
  const cap = cols * rows;

  const opciones = {
    fuente: plantilla.fuente || 'helvetica',
    tamanoCentralPt: plantilla.tamanoCentralPt,
    tamanoInferiorPt: plantilla.tamanoInferiorPt,
  };

  await registrarFuenteSeleccionada(doc, opciones.fuente);

  for (let i = 0; i < items.length; i += 1) {
    if (i > 0 && i % cap === 0) doc.addPage();

    const pos = i % cap;
    const col = pos % cols;
    const row = Math.floor(pos / cols);
    const x = m + col * (w + g);
    const y = m + row * (h + g);

    if (tipo === 'escarapela') {
      await dibujarEscarapela(doc, imagenAplanada, x, y, w, h, items[i], opciones);
    } else {
      await dibujarHabitacion(doc, imagenAplanada, x, y, w, h, items[i], opciones);
    }
  }

  doc.save(nombre);
}

export const generarEscarapelasPdf = (items, p) =>
  generar(items, p, 'escarapela', 'Escarapelas_Caminantes.pdf');

export const generarEscarapelaPdf = (item, p) =>
  generar([item], p, 'escarapela', `Escarapela_${item.nombre || 'Caminante'}.pdf`);

export const generarHabitacionesPdf = (items, p) =>
  generar(items, p, 'habitacion', 'Marcacion_Habitaciones.pdf');

export const generarHabitacionPdf = (item, p) =>
  generar([item], p, 'habitacion', `Habitacion_${item.habitacion || ''}.pdf`);
