const URL_XLSX = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

function cargarXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = URL_XLSX;
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('No fue posible cargar el componente de Excel.'));
    document.head.appendChild(script);
  });
}

function fechaArchivo() {
  return new Date().toISOString().slice(0, 10);
}

async function descargarLibro(nombre, hojas) {
  const XLSX = await cargarXlsx();
  const libro = XLSX.utils.book_new();
  hojas.forEach(({ nombre: hoja, filas }) => {
    const ws = XLSX.utils.json_to_sheet(filas);
    ws['!cols'] = Object.keys(filas[0] || {}).map((campo) => ({ wch: Math.max(14, campo.length + 3) }));
    XLSX.utils.book_append_sheet(libro, ws, hoja.slice(0, 31));
  });
  XLSX.writeFile(libro, nombre);
}

export function descargarPlantillaPasoAPaso() {
  return descargarLibro('Formato_importacion_paso_a_paso.xlsx', [{
    nombre: 'Paso a paso',
    filas: [
      { Día: 'Viernes', 'Hora inicio': '10:20', 'Duración (minutos)': 10, Actividad: 'Actividad de ejemplo', Responsable: 'Nombre responsable', Lugar: 'Auditorio', Equipo: '', Prioridad: 'Media', Observaciones: '' },
      { Día: 'Viernes', 'Hora inicio': '', 'Duración (minutos)': 30, Actividad: 'Segunda actividad', Responsable: 'Nombre responsable', Lugar: 'Auditorio', Equipo: '', Prioridad: 'Media', Observaciones: '' },
    ],
  }]);
}

export async function leerExcelPasoAPaso(archivo) {
  const XLSX = await cargarXlsx();
  const datos = await archivo.arrayBuffer();
  const libro = XLSX.read(datos, { type: 'array' });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });
  if (!filas.length) throw new Error('El archivo no contiene actividades.');
  return filas.map((fila, indice) => ({
    orden: indice + 1,
    dia: fila.Día ?? fila.Dia ?? '',
    horaInicio: fila['Hora inicio'] ?? fila['Hora Inicio'] ?? '',
    duracionMinutos: fila['Duración (minutos)'] ?? fila['Duracion (minutos)'] ?? fila.Duración ?? fila.Duracion ?? '',
    actividad: fila.Actividad ?? '',
    responsable: fila.Responsable ?? '',
    lugar: fila.Lugar ?? '',
    equipo: fila.Equipo ?? '',
    prioridad: fila.Prioridad || 'Media',
    observaciones: fila.Observaciones ?? '',
    estado: 'Pendiente',
  }));
}

const URL_JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
const URL_AUTOTABLE = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js';
const ORDEN_DIAS = ['Viernes', 'Sábado', 'Domingo'];

function cargarScript(url, validar) {
  if (validar()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${url}"]`);
    if (existente) {
      existente.addEventListener('load', resolve, { once: true });
      existente.addEventListener('error', () => reject(new Error('No fue posible cargar el generador de PDF.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error('No fue posible cargar el generador de PDF.'));
    document.head.appendChild(script);
  });
}

async function cargarPdf() {
  await cargarScript(URL_JSPDF, () => Boolean(window.jspdf?.jsPDF));
  await cargarScript(URL_AUTOTABLE, () => Boolean(window.jspdf?.jsPDF?.API?.autoTable));
  return window.jspdf.jsPDF;
}

function ordenarActividades(actividades) {
  return [...actividades].sort((a, b) => {
    const diaA = ORDEN_DIAS.indexOf(a.dia);
    const diaB = ORDEN_DIAS.indexOf(b.dia);
    const posicionA = diaA === -1 ? ORDEN_DIAS.length : diaA;
    const posicionB = diaB === -1 ? ORDEN_DIAS.length : diaB;
    return posicionA - posicionB || Number(a.orden || 9999) - Number(b.orden || 9999);
  });
}

function filasBase(actividades) {
  return ordenarActividades(actividades).map((a) => ({
    Día: a.dia,
    'Hora inicio': a.horaInicio,
    Duración: Number(a.duracionMinutos),
    Actividad: a.actividad,
    Responsable: a.responsable,
    Lugar: a.lugar,
  }));
}

const ESTILO_DIA = {
  Viernes: { fondo: [190, 35, 45], texto: [255, 255, 255] },
  'Sábado': { fondo: [37, 99, 175], texto: [255, 255, 255] },
  Domingo: { fondo: [220, 224, 229], texto: [45, 55, 65] },
};

function quitarEmoticones(valor) {
  return String(valor ?? '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function textoLineas(documento, valor, ancho, fontSize, maxLineas = 99) {
  documento.setFontSize(fontSize);
  const lineas = documento.splitTextToSize(String(valor ?? ''), Math.max(4, ancho));
  if (lineas.length <= maxLineas) return lineas;
  const recortadas = lineas.slice(0, maxLineas);
  const ultima = String(recortadas[maxLineas - 1] || '');
  recortadas[maxLineas - 1] = `${ultima.replace(/[.…]+$/g, '').trim()}…`;
  return recortadas;
}

function configuracionColumnas(ancho, columnas) {
  // Hora y duración ocupan solo lo indispensable. El resto se distribuye
  // entre las columnas que realmente necesitan envolver texto.
  const hora = columnas === 3 ? 9 : 10;
  const duracion = columnas === 3 ? 8 : 9;
  const disponible = ancho - hora - duracion;
  const actividad = disponible * 0.47;
  const responsable = disponible * 0.27;
  const lugar = disponible - actividad - responsable;
  return [hora, duracion, actividad, responsable, lugar];
}

function lineasActividad(documento, actividad, anchos, fontSize) {
  const valores = [
    actividad.horaInicio || '',
    `${Number(actividad.duracionMinutos || 0)}m`,
    quitarEmoticones(actividad.actividad || ''),
    actividad.responsable || '',
    actividad.lugar || '',
  ];

  // Hora y duración permanecen en una línea. Actividad, responsable y lugar
  // pueden crecer en todas las líneas necesarias para no perder información.
  return valores.map((valor, i) => textoLineas(
    documento,
    valor,
    anchos[i] - 2.2,
    fontSize,
    i < 2 ? 1 : 99,
  ));
}

function altoFilaCompacta(documento, actividad, anchos, fontSize, compactoExtremo = false) {
  const grupos = lineasActividad(documento, actividad, anchos, fontSize);
  const maxLineas = Math.max(...grupos.map((lineas) => lineas.length));
  return Math.max(compactoExtremo ? 5.2 : 6.2, maxLineas * (fontSize * 0.39) + 2.5);
}

function dibujarEncabezadoDia(documento, dia, x, y, ancho, compacto = false) {
  const estilo = ESTILO_DIA[dia] || { fondo: [80, 90, 100], texto: [255, 255, 255] };
  const alto = compacto ? 7 : 8.5;
  documento.setFillColor(...estilo.fondo);
  documento.roundedRect(x, y, ancho, alto, 1.2, 1.2, 'F');
  documento.setTextColor(...estilo.texto);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(compacto ? 7.4 : 9.2);
  documento.text(String(dia).toUpperCase(), x + 2.2, y + (compacto ? 4.8 : 5.8));
  documento.setTextColor(35, 42, 48);
  return y + alto + 1.3;
}

function dibujarCabeceraTabla(documento, x, y, anchos, fontSize, compacto = false) {
  const titulos = compacto ? ['Hr.', 'Min.', 'Actividad', 'Responsable', 'Lugar'] : ['Hora', 'Dur.', 'Actividad', 'Responsable', 'Lugar'];
  const alto = compacto ? 5.4 : 6.5;
  documento.setFillColor(54, 62, 72);
  documento.rect(x, y, anchos.reduce((a, b) => a + b, 0), alto, 'F');
  documento.setTextColor(255, 255, 255);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(fontSize);
  let cursor = x;
  titulos.forEach((titulo, i) => {
    documento.text(titulo, cursor + 1.1, y + (compacto ? 3.8 : 4.5));
    cursor += anchos[i];
  });
  documento.setTextColor(35, 42, 48);
  return y + alto;
}

function dibujarFilaCompacta(documento, actividad, x, y, anchos, alto, indice, fontSize, compactoExtremo = false) {
  const anchoTotal = anchos.reduce((a, b) => a + b, 0);
  documento.setFillColor(...(indice % 2 === 0 ? [248, 249, 251] : [232, 236, 241]));
  documento.rect(x, y, anchoTotal, alto, 'F');
  documento.setDrawColor(205, 211, 218);
  documento.setLineWidth(0.12);
  documento.rect(x, y, anchoTotal, alto, 'S');

  const grupos = lineasActividad(documento, actividad, anchos, fontSize);
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(fontSize);
  documento.setTextColor(35, 42, 48);
  let cursor = x;
  grupos.forEach((lineas, i) => {
    documento.text(lineas, cursor + 1.1, y + 2.5, { baseline: 'top' });
    cursor += anchos[i];
    if (i < grupos.length - 1) documento.line(cursor, y, cursor, y + alto);
  });
}

function crearSlots(documento, paginas, margen, gap, yInicial, yFinal, columnas) {
  const anchoPagina = documento.internal.pageSize.getWidth();
  const anchoColumna = (anchoPagina - margen * 2 - gap * (columnas - 1)) / columnas;
  const slots = [];
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    for (let columna = 0; columna < columnas; columna += 1) {
      slots.push({
        pagina,
        x: margen + columna * (anchoColumna + gap),
        y: yInicial,
        yMax: yFinal,
        ancho: anchoColumna,
      });
    }
  }
  return slots;
}

function simularDistribucion(documento, actividadesPorDia, opciones) {
  const { paginas, columnas, fontSize, compactoExtremo } = opciones;
  const margen = 6;
  const gap = columnas === 3 ? 3.5 : 5;
  const yInicial = 15;
  const yFinal = 201;
  const slots = crearSlots(documento, paginas, margen, gap, yInicial, yFinal, columnas);
  const anchos = configuracionColumnas(slots[0].ancho, columnas);
  let slotIndex = 0;
  let y = yInicial;

  for (const [, actividades] of actividadesPorDia) {
    if (!actividades.length) continue;
    let nuevaSeccion = true;
    for (const actividad of actividades) {
      const altoCabecera = nuevaSeccion ? (compactoExtremo ? 14 : 16.5) : 0;
      const alto = altoFilaCompacta(documento, actividad, anchos, fontSize, compactoExtremo);
      if (y + altoCabecera + alto > yFinal) {
        slotIndex += 1;
        if (slotIndex >= slots.length) return false;
        y = yInicial;
        nuevaSeccion = true;
      }
      if (nuevaSeccion) {
        y += altoCabecera;
        nuevaSeccion = false;
      }
      y += alto;
    }
    y += compactoExtremo ? 2 : 3.5;
  }
  return true;
}

function escogerDiseno(documento, actividadesPorDia) {
  const candidatos = [
    { paginas: 1, columnas: 2, fontSize: 7.0, compactoExtremo: false },
    { paginas: 1, columnas: 3, fontSize: 6.2, compactoExtremo: false },
    { paginas: 2, columnas: 2, fontSize: 7.0, compactoExtremo: false },
    { paginas: 2, columnas: 3, fontSize: 6.0, compactoExtremo: false },
    { paginas: 2, columnas: 3, fontSize: 5.4, compactoExtremo: true },
    { paginas: 2, columnas: 3, fontSize: 4.8, compactoExtremo: true },
    { paginas: 2, columnas: 3, fontSize: 4.2, compactoExtremo: true },
  ];
  return candidatos.find((opciones) => simularDistribucion(documento, actividadesPorDia, opciones))
    || candidatos[candidatos.length - 1];
}

export async function exportarTablaPasoAPaso(actividades) {
  if (!actividades.length) throw new Error('No hay actividades para exportar.');

  const jsPDF = await cargarPdf();
  const documento = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const ordenadas = ordenarActividades(actividades);
  const diasPresentes = [
    ...ORDEN_DIAS,
    ...ordenadas.map((item) => item.dia).filter((dia) => dia && !ORDEN_DIAS.includes(dia)),
  ].filter((dia, indice, lista) => lista.indexOf(dia) === indice);
  const actividadesPorDia = diasPresentes
    .map((dia) => [dia, ordenadas.filter((item) => item.dia === dia)])
    .filter(([, filas]) => filas.length);

  const diseno = escogerDiseno(documento, actividadesPorDia);
  const { paginas, columnas, fontSize, compactoExtremo } = diseno;
  for (let pagina = 2; pagina <= paginas; pagina += 1) documento.addPage('a4', 'landscape');

  const margen = 6;
  const gap = columnas === 3 ? 3.5 : 5;
  const yInicial = 15;
  const yFinal = 201;
  const slots = crearSlots(documento, paginas, margen, gap, yInicial, yFinal, columnas);
  const anchos = configuracionColumnas(slots[0].ancho, columnas);
  let slotIndex = 0;
  let y = yInicial;

  const activarSlot = () => {
    const slot = slots[Math.min(slotIndex, slots.length - 1)];
    documento.setPage(slot.pagina);
    return slot;
  };

  actividadesPorDia.forEach(([dia, filas]) => {
    let necesitaCabecera = true;
    filas.forEach((actividad, indice) => {
      let slot = activarSlot();
      const altoCabecera = necesitaCabecera ? (compactoExtremo ? 14 : 16.5) : 0;
      const alto = altoFilaCompacta(documento, actividad, anchos, fontSize, compactoExtremo);

      if (y + altoCabecera + alto > slot.yMax) {
        slotIndex = Math.min(slotIndex + 1, slots.length - 1);
        slot = activarSlot();
        y = slot.y;
        necesitaCabecera = true;
      }

      if (necesitaCabecera) {
        y = dibujarEncabezadoDia(documento, dia, slot.x, y, slot.ancho, compactoExtremo);
        y = dibujarCabeceraTabla(documento, slot.x, y, anchos, fontSize, compactoExtremo);
        necesitaCabecera = false;
      }

      dibujarFilaCompacta(documento, actividad, slot.x, y, anchos, alto, indice, fontSize, compactoExtremo);
      y += alto;
    });
    y += compactoExtremo ? 2 : 3.5;
  });

  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    documento.setPage(pagina);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(10);
    documento.setTextColor(35, 42, 48);
    documento.text('PASO A PASO DEL RETIRO', margen, 9.5);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(6.5);
    documento.setTextColor(100, 108, 116);
    documento.text(`Página ${pagina} de ${paginas}`, 291, 206, { align: 'right' });
  }

  documento.save(`Paso_a_paso_servidores_${fechaArchivo()}.pdf`);
}

export function exportarCronogramaPasoAPaso(actividades) {
  if (!actividades.length) throw new Error('No hay actividades para exportar.');
  const filas = ordenarActividades(actividades).map((a) => ({
    Día: a.dia,
    Inicio: a.horaInicio,
    Fin: a.horaFin,
    Duración: Number(a.duracionMinutos),
    Actividad: a.actividad,
    Responsable: a.responsable,
    Lugar: a.lugar,
    Cronograma: `${a.horaInicio} ━━━━━━━━━ ${a.horaFin}`,
  }));
  return descargarLibro(`Paso_a_paso_cronograma_${fechaArchivo()}.xlsx`, [{ nombre: 'Cronograma', filas }]);
}
