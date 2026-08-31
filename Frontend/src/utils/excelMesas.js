const URL_EXCELJS =
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';

function cargarExcelJs() {
  if (window.ExcelJS) {
    return Promise.resolve(
      window.ExcelJS
    );
  }

  return new Promise(
    (resolve, reject) => {
      const existente =
        document.querySelector(
          `script[src="${URL_EXCELJS}"]`
        );

      if (existente) {
        existente.addEventListener(
          'load',
          () => resolve(window.ExcelJS),
          { once: true }
        );

        existente.addEventListener(
          'error',
          () =>
            reject(
              new Error(
                'No fue posible cargar el componente de Excel.'
              )
            ),
          { once: true }
        );

        return;
      }

      const script =
        document.createElement(
          'script'
        );

      script.src = URL_EXCELJS;

      script.onload =
        () => resolve(window.ExcelJS);

      script.onerror =
        () =>
          reject(
            new Error(
              'No fue posible cargar el componente de Excel.'
            )
          );

      document.head.appendChild(
        script
      );
    }
  );
}

function valor(valorOriginal) {
  if (
    valorOriginal === null ||
    valorOriginal === undefined
  ) {
    return '';
  }

  return String(valorOriginal);
}

function fechaLegible(valorOriginal) {
  if (!valorOriginal) return '';

  const texto =
    String(valorOriginal);

  const iso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (iso) {
    return (
      iso[3] +
      '/' +
      iso[2] +
      '/' +
      iso[1]
    );
  }

  return texto;
}

function filaCaminante(c) {
  return [
    valor(c.numeroInscripcion),
    valor(c.nombre),
    valor(c.documentoIdentidad),
    fechaLegible(c.fechaNacimiento),
    valor(c.edad),
    valor(c.direccionResidencia),
    valor(c.barrio),
    valor(c.telefonoFijo),
    valor(c.celular),
    valor(c.estadoCivil),
    valor(c.parroquia),
    valor(c.profesionOcupacion),

    valor(c.contacto1Nombre),
    valor(c.contacto1Parentesco),
    valor(c.contacto1Celular),
    valor(c.contacto2Nombre),
    valor(c.contacto2Parentesco),
    valor(c.contacto2Celular),

    valor(c.tallaCamiseta),
    valor(c.habitacion),

    valor(c.eps),
    valor(c.sufreEnfermedad),
    valor(c.enfermedadCual),
    valor(c.tomaMedicamento),
    valor(c.medicamentoCual),
    valor(c.horariosMedicamentos),
    valor(c.tieneLimitacionFisica),
    valor(c.limitacionCual),

    valor(c.tieneCondicionAlimentaria),
    valor(c.alergiasAlimentarias),
    valor(c.restriccionesAlimentarias),
    valor(c.preferenciasAlimentarias),
    valor(c.dietaEspecial),

    valor(c.sacramentosRecibidos),
    valor(c.comoSeEntero),
    valor(c.nombrePersonaInvito),
    valor(c.celularPersonaInvito),
    valor(c.personaConocidaAsistira),
    valor(c.nombrePersonaConocida),
  ];
}

const BORDE_CELDA = {
  top: {
    style: 'thin',
    color: { argb: 'FF000000' },
  },
  left: {
    style: 'thin',
    color: { argb: 'FF000000' },
  },
  bottom: {
    style: 'thin',
    color: { argb: 'FF000000' },
  },
  right: {
    style: 'thin',
    color: { argb: 'FF000000' },
  },
};

const GRUPOS = [
  {
    titulo: 'Información General',
    inicio: 2,
    fin: 13,
    colorOscuro: 'FF265663',
    colorClaro: 'FF388195',
  },
  {
    titulo: 'Información Contactos',
    inicio: 14,
    fin: 19,
    colorOscuro: 'FF403251',
    colorClaro: 'FF604B7A',
  },
  {
    titulo: 'Logistica',
    inicio: 20,
    fin: 21,
    colorOscuro: 'FF7C4B23',
    colorClaro: 'FFB97035',
  },
  {
    titulo: 'Salud',
    inicio: 22,
    fin: 29,
    colorOscuro: 'FF4E5E2D',
    colorClaro: 'FF748C43',
  },
  {
    titulo: 'Alimentación',
    inicio: 30,
    fin: 34,
    colorOscuro: 'FF602827',
    colorClaro: 'FF903C3A',
  },
  {
    titulo: 'Información del Retiro',
    inicio: 35,
    fin: 40,
    colorOscuro: 'FF000000',
    colorClaro: 'FF000000',
  },
];

const ENCABEZADOS = [
  'Número de inscripción',
  'Nombre completo',
  'Numero Documento',
  'Fecha de nacimiento',
  'Edad',
  'Dirección',
  'Barrio',
  'Teléfono',
  'Celular',
  'Estado civil',
  'Parroquia',
  'Profesión / ocupación',

  'Contacto 1 - Nombre',
  'Contacto 1 - Parentesco',
  'Contacto 1 - Celular',
  'Contacto 2 - Nombre',
  'Contacto 2 - Parentesco',
  'Contacto 2 - Celular',

  'Talla camiseta',
  'N° Habitación',

  'EPS',
  '¿Sufre enfermedad?',
  'Enfermedad',
  '¿Toma medicamento?',
  'Medicamento',
  'Horarios medicamentos',
  '¿Tiene limitación física?',
  'Limitación física',

  '¿Tiene condición alimentaria?',
  'Alergias',
  'Restricciones',
  'Preferencias',
  'Dieta especial',

  'Sacramentos recibidos',
  'Cómo se enteró',
  'Persona que invitó',
  'Celular persona que invitó',
  '¿Asistirá persona conocida?',
  'Nombre persona conocida',
];

const ANCHOS_COLUMNAS = [
  5.125,
  20.75,
  29.5,
  19,
  19,
  5.375,
  26,
  24.375,
  11.25,
  11.25,
  10.75,
  33.75,
  25,
  22.125,
  21.875,
  17.875,
  19.125,
  21.875,
  17.875,
  12.875,
  12.5,
  9.625,
  17.75,
  11.125,
  19.5,
  12.625,
  20.875,
  20.625,
  14.125,
  25.875,
  19.125,
  19.125,
  48.125,
  12.625,
  47.125,
  25.375,
  23.125,
  29.375,
  30.75,
  29.625,
];

function aplicarFuenteBase(celda) {
  celda.font = {
    name: 'Calibri',
    size: 12,
    color: {
      argb: 'FF000000',
    },
  };
}

function aplicarEncabezadoGrupo(
  hoja,
  grupo
) {
  hoja.mergeCells(
    2,
    grupo.inicio,
    2,
    grupo.fin
  );

  for (
    let columna = grupo.inicio;
    columna <= grupo.fin;
    columna += 1
  ) {
    const celda =
      hoja.getCell(
        2,
        columna
      );

    celda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb:
          grupo.colorOscuro,
      },
    };

    celda.border =
      BORDE_CELDA;

    celda.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    celda.font = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: {
        argb: 'FFFFFFFF',
      },
    };
  }

  hoja.getCell(
    2,
    grupo.inicio
  ).value = grupo.titulo;
}

function aplicarEncabezados(
  hoja
) {
  ENCABEZADOS.forEach(
    (encabezado, indice) => {
      const columna =
        indice + 2;

      const grupo =
        GRUPOS.find(
          (item) =>
            columna >= item.inicio &&
            columna <= item.fin
        );

      const celda =
        hoja.getCell(
          3,
          columna
        );

      celda.value =
        encabezado;

      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb:
            grupo.colorClaro,
        },
      };

      celda.border =
        BORDE_CELDA;

      celda.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      celda.font = {
        name: 'Calibri',
        size: 12,
        bold:
          grupo.titulo !==
          'Logistica',
        color: {
          argb: 'FFFFFFFF',
        },
      };
    }
  );
}

function aplicarDatos(
  hoja,
  caminantes
) {
  caminantes.forEach(
    (caminante, indice) => {
      const fila =
        indice + 4;

      const valores =
        filaCaminante(
          caminante
        );

      valores.forEach(
        (dato, indiceColumna) => {
          const celda =
            hoja.getCell(
              fila,
              indiceColumna + 2
            );

          celda.value = dato;

          aplicarFuenteBase(
            celda
          );

          celda.border =
            BORDE_CELDA;
        }
      );
    }
  );
}

function aplicarDimensiones(
  hoja
) {
  ANCHOS_COLUMNAS.forEach(
    (ancho, indice) => {
      hoja.getColumn(
        indice + 1
      ).width = ancho;
    }
  );
}

function descargarBuffer(
  buffer,
  nombreArchivo
) {
  const blob =
    new Blob(
      [buffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const enlace =
    document.createElement(
      'a'
    );

  enlace.href = url;
  enlace.download =
    nombreArchivo;

  document.body.appendChild(
    enlace
  );

  enlace.click();
  enlace.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );
}

async function descargarCaminantesMesaExcel(
  datos
) {
  const caminantes =
    datos?.caminantes || [];

  if (!caminantes.length) {
    throw new Error(
      'La mesa no tiene caminantes para exportar.'
    );
  }

  const ExcelJS =
    await cargarExcelJs();

  const libro =
    new ExcelJS.Workbook();

  libro.creator =
    'Centro de Control Emaús';

  const hoja =
    libro.addWorksheet(
      `Mesa ${datos.numeroMesa}`.slice(
        0,
        31
      ),
      {
        views: [
          {
            state: 'frozen',
            xSplit: 3,
            ySplit: 3,
            topLeftCell: 'Q4',
            activeCell: 'Q4',
          },
        ],
      }
    );

  aplicarDimensiones(
    hoja
  );

  GRUPOS.forEach(
    (grupo) =>
      aplicarEncabezadoGrupo(
        hoja,
        grupo
      )
  );

  aplicarEncabezados(
    hoja
  );

  aplicarDatos(
    hoja,
    caminantes
  );

  const numero =
    String(
      datos.numeroMesa || ''
    ).replace(
      /[^a-zA-Z0-9_-]/g,
      ''
    );

  const buffer =
    await libro.xlsx.writeBuffer();

  descargarBuffer(
    buffer,
    `Mesa_${numero}_Caminantes.xlsx`
  );
}

export { descargarCaminantesMesaExcel };
