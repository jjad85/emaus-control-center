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

function dividirTextoEnDosLineas(doc, texto, maxWidth, tamano) {
  const limpio = String(texto || '').trim().replace(/\s+/g, ' ');
  if (!limpio) return [''];

  doc.setFontSize(tamano);
  if (doc.getTextWidth(limpio) <= maxWidth) return [limpio];

  const palabras = limpio.split(' ');
  if (palabras.length === 1) return [limpio];

  let mejor = null;
  for (let corte = 1; corte < palabras.length; corte += 1) {
    const linea1 = palabras.slice(0, corte).join(' ');
    const linea2 = palabras.slice(corte).join(' ');
    const ancho1 = doc.getTextWidth(linea1);
    const ancho2 = doc.getTextWidth(linea2);
    const cabe = ancho1 <= maxWidth && ancho2 <= maxWidth;
    const diferencia = Math.abs(ancho1 - ancho2);

    if (cabe && (!mejor || diferencia < mejor.diferencia)) {
      mejor = { lineas: [linea1, linea2], diferencia };
    }
  }

  if (mejor) return mejor.lineas;

  // Caso extremo: si ni en dos líneas cabe al tamaño central, jsPDF reduce
  // únicamente lo indispensable para evitar que el texto se salga.
  const lineas = doc.splitTextToSize(limpio, maxWidth);
  return lineas.slice(0, 2);
}

function dibujarNombreCentral(doc, texto, centroX, centroY, maxWidth, tamanoCentral) {
  doc.setFontSize(tamanoCentral);
  let lineas = dividirTextoEnDosLineas(doc, texto, maxWidth, tamanoCentral);
  let tamano = tamanoCentral;

  while (lineas.some((linea) => doc.getTextWidth(linea) > maxWidth) && tamano > 8) {
    tamano -= 0.5;
    doc.setFontSize(tamano);
    lineas = dividirTextoEnDosLineas(doc, texto, maxWidth, tamano);
  }

  const interlineado = tamano * 0.38; // pt -> separación visual apropiada en mm
  const yInicial = lineas.length === 2 ? centroY - interlineado / 2 : centroY;
  lineas.forEach((linea, indice) => {
    doc.text(linea, centroX, yInicial + indice * interlineado, { align: 'center' });
  });

  return lineas.length;
}


function ajustarTextoUnaLinea(doc, texto, maxWidth, tamanoInicial, tamanoMinimo = 8) {
  const limpio = textoSeguro(texto);
  let tamano = tamanoInicial;
  doc.setFontSize(tamano);
  while (limpio && doc.getTextWidth(limpio) > maxWidth && tamano > tamanoMinimo) {
    tamano -= 0.5;
    doc.setFontSize(tamano);
  }
  return { texto: limpio, tamano };
}

function obtenerPartesNombreSobre(c) {
  const primerNombre = textoSeguro(c.primerNombre || c.nombre1);
  const segundoNombre = textoSeguro(c.segundoNombre || c.nombre2);
  const primerApellido = textoSeguro(c.primerApellido || c.apellido1);
  const segundoApellido = textoSeguro(c.segundoApellido || c.apellido2);

  if (primerNombre || segundoNombre || primerApellido || segundoApellido) {
    return {
      nombres: [primerNombre, segundoNombre].filter(Boolean).join(' '),
      apellidos: [primerApellido, segundoApellido].filter(Boolean).join(' '),
    };
  }

  // Respaldo para clientes que aún estén consumiendo un backend anterior:
  // mantiene dos filas en lugar de volver al nombre completo en una sola línea.
  const partes = textoSeguro(c.nombre).split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return { nombres: partes.join(' '), apellidos: '' };
  if (partes.length === 2) return { nombres: partes[0], apellidos: partes[1] };
  if (partes.length === 3) return { nombres: partes[0], apellidos: partes.slice(1).join(' ') };
  return {
    nombres: partes.slice(0, 2).join(' '),
    apellidos: partes.slice(2).join(' '),
  };
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

  // El nombre conserva el tamaño central. Si no cabe en una línea, se divide
  // primero en dos líneas antes de considerar cualquier reducción de tamaño.
  dibujarNombreCentral(doc, nombre, x + w / 2, y + h * 0.49, w * 0.88, central);

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

  // Todo el bloque se baja respecto de la versión anterior para que el texto
  // quede visualmente más centrado en sentido vertical dentro de la plantilla.
  doc.text(`Habitación ${hab.habitacion || ''}`, x + w / 2, y + h * 0.30, {
    align: 'center',
  });

  const personas = Array.isArray(hab.personas) ? hab.personas : [];
  const cantidad = Math.max(personas.length, 1);
  const inicio = y + h * (cantidad > 1 ? 0.46 : 0.55);
  const espacio = cantidad > 1 ? h * 0.29 : h * 0.30;

  personas.forEach((p, i) => {
    const yy = inicio + i * espacio;

    // Nombre completo en tamaño central. Si no cabe, primero se divide en dos
    // líneas antes de reducir el tamaño.
    doc.setFont(fuente, 'bold');
    const lineasNombre = dibujarNombreCentral(
      doc,
      p.nombre || '',
      x + w / 2,
      yy,
      w * 0.86,
      central,
    );

    doc.setFont(fuente, 'normal');
    doc.setFontSize(inferior);

    // Se deja un renglón visual adicional después del nombre antes de mostrar
    // Caminante / Servidor.
    const desplazamientoTipo = lineasNombre === 2 ? 10.0 : 7.2;
    const yTipo = yy + desplazamientoTipo;
    doc.text(p.tipoPersona || '', x + w / 2, yTipo, { align: 'center' });

    const mesa = String(p.mesa || '').trim();
    const esServidor = String(p.tipoPersona || '').trim().toLowerCase() === 'servidor';

    if (esServidor) {
      if (mesa) {
        const rolMesa = String(p.rolMesa || '').trim();
        const textoMesa = `Mesa ${mesa}${rolMesa ? ` - ${rolMesa}` : ''}`;
        doc.text(textoMesa, x + w / 2, yTipo + 4.8, { align: 'center' });
      } else {
        const equipo = String(p.equipo || '').trim();
        if (equipo) {
          const textoEquipo = /^equipo\b/i.test(equipo) ? equipo : `Equipo ${equipo}`;
          doc.text(textoEquipo, x + w / 2, yTipo + 4.8, { align: 'center' });
        }
      }
    } else if (mesa) {
      // Para caminantes se conserva la regla anterior: mostrar su mesa cuando
      // exista una asignación.
      doc.text(`Mesa ${mesa}`, x + w / 2, yTipo + 4.8, { align: 'center' });
    }
  });
}

function textoSeguro(valor) {
  return String(valor == null ? '' : valor).trim();
}

async function dibujarFormato3(doc, img, x, y, w, h, c, opciones) {
  // Opción 3 · Sobres de bienvenida:
  // fila 1 = nombre 1 + nombre 2
  // fila 2 = apellido 1 + apellido 2
  // habitación y mesa = tamaño inferior, alineadas a la derecha.
  const fuente = nombreFuenteJsPdf(opciones.fuente);
  const central = numeroPositivo(opciones.tamanoCentralPt, 20);
  const inferior = numeroPositivo(opciones.tamanoInferiorPt, 11);

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  doc.addImage(img, 'PNG', x, y, w, h);
  doc.setTextColor(20, 35, 45);

  const partes = obtenerPartesNombreSobre(c);
  const centroX = x + w / 2;
  const anchoMaximo = w * 0.86;

  doc.setFont(fuente, 'bold');

  const nombres = ajustarTextoUnaLinea(doc, partes.nombres, anchoMaximo, central);
  if (nombres.texto) {
    doc.setFontSize(nombres.tamano);
    doc.text(nombres.texto, centroX, y + h * 0.48, { align: 'center' });
  }

  const apellidos = ajustarTextoUnaLinea(doc, partes.apellidos, anchoMaximo, central);
  if (apellidos.texto) {
    doc.setFontSize(apellidos.tamano);
    doc.text(apellidos.texto, centroX, y + h * 0.60, { align: 'center' });
  }

  // Mesa y habitación forman un bloque inferior, primero mesa y luego habitación.
  // Se ubican hacia el costado izquierdo y un poco más arriba para evitar
  // que la segunda línea quede por fuera o demasiado cerca del borde inferior.
  doc.setFont(fuente, 'bold');
  doc.setFontSize(inferior);
  const margenIzquierdo = Math.max(4, w * 0.06);
  const xIzquierda = x + margenIzquierdo;
  const habitacion = textoSeguro(c.habitacion);
  const mesa = textoSeguro(c.mesa);

  doc.text(
    mesa ? `Mesa ${mesa}` : 'Mesa',
    xIzquierda,
    y + h * 0.72,
    { align: 'left' },
  );
  doc.text(
    habitacion ? `Habitación ${habitacion}` : 'Habitación',
    xIzquierda,
    y + h * 0.80,
    { align: 'left' },
  );
}

async function dibujarFormato4(doc, img, x, y, w, h, c, opciones) {
  // Opción 4: nombre para el momento de Santísimo.
  const fuente = nombreFuenteJsPdf(opciones.fuente);
  const central = numeroPositivo(opciones.tamanoCentralPt, 20);

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  doc.addImage(img, 'PNG', x, y, w, h);

  doc.setTextColor(20, 35, 45);
  doc.setFont(fuente, 'bold');
  dibujarNombreCentral(
    doc,
    textoSeguro(c.nombre),
    x + w / 2,
    y + h * 0.57,
    w * 0.88,
    central,
  );
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

  // Las piezas quedan completamente pegadas entre sí: 0 mm horizontal y
  // 0 mm vertical. Solo se reparte como margen exterior el espacio que sobra
  // en la hoja. Un pequeño epsilon evita perder una fila/columna por errores
  // de punto flotante (por ejemplo 210 / 70 = 2.999999...).
  if (w > pw || h > ph) {
    throw new Error('Las dimensiones configuradas son mayores que una página A4.');
  }

  const EPSILON = 0.0001;
  const cols = Math.max(1, Math.floor((pw + EPSILON) / w));
  const rows = Math.max(1, Math.floor((ph + EPSILON) / h));
  const cap = Math.max(1, cols * rows);
  const offsetX = Math.max(0, (pw - cols * w) / 2);
  const offsetY = Math.max(0, (ph - rows * h) / 2);

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
    const x = offsetX + col * w;
    const y = offsetY + row * h;

    if (tipo === 'escarapela') {
      await dibujarEscarapela(doc, imagenAplanada, x, y, w, h, items[i], opciones);
    } else if (tipo === 'habitacion') {
      await dibujarHabitacion(doc, imagenAplanada, x, y, w, h, items[i], opciones);
    } else if (tipo === 'formato3') {
      await dibujarFormato3(doc, imagenAplanada, x, y, w, h, items[i], opciones);
    } else if (tipo === 'formato4') {
      await dibujarFormato4(doc, imagenAplanada, x, y, w, h, items[i], opciones);
    } else {
      throw new Error('Tipo de formato de impresión no soportado.');
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


export const generarSobresBienvenidaPdf = (items, p) =>
  generar(items, p, 'formato3', 'Marcacion_Sobres_Bienvenida.pdf');

export const generarSobreBienvenidaIndividualPdf = (item, p) =>
  generar([item], p, 'formato3', `Sobre_Bienvenida_${item.nombre || 'Caminante'}.pdf`);

export const generarNombresSantisimoPdf = (items, p) =>
  generar(items, p, 'formato4', 'Nombres_Santisimo_Caminantes.pdf');

export const generarNombreSantisimoIndividualPdf = (item, p) =>
  generar([item], p, 'formato4', `Nombre_Santisimo_${item.nombre || 'Caminante'}.pdf`);
