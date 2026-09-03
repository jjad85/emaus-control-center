const URL_EXCELJS =
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';

function cargarExcelJsDatosHotel() {
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
          () =>
            resolve(
              window.ExcelJS
            ),
          {
            once: true,
          }
        );

        existente.addEventListener(
          'error',
          () =>
            reject(
              new Error(
                'No fue posible cargar el componente de Excel.'
              )
            ),
          {
            once: true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          'script'
        );

      script.src =
        URL_EXCELJS;

      script.onload =
        () =>
          resolve(
            window.ExcelJS
          );

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


const ENCABEZADOS_DATOS_HOTEL = [
  'NOMBRE COMPLETO',
  'IDENTIFICACIÓN',
  'FECHA DE NACIMIENTO',
  'DIRECCIÓN',
  'CIUDAD',
  'PAÍS',
  'TELÉFONO',
  'MESA',
  'HABITACIÓN',
];


const BORDE_DATOS_HOTEL = {
  top: {
    style: 'thin',
    color: {
      argb: 'FF000000',
    },
  },
  left: {
    style: 'thin',
    color: {
      argb: 'FF000000',
    },
  },
  bottom: {
    style: 'thin',
    color: {
      argb: 'FF000000',
    },
  },
  right: {
    style: 'thin',
    color: {
      argb: 'FF000000',
    },
  },
};


function textoDatosHotel(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor);
}


function fechaDatosHotel(valor) {
  if (!valor) {
    return '';
  }

  if (
    valor instanceof Date &&
    !Number.isNaN(
      valor.getTime()
    )
  ) {
    return valor;
  }

  const texto =
    String(valor).trim();

  const coincidenciaIso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (coincidenciaIso) {
    return new Date(
      Number(coincidenciaIso[1]),
      Number(coincidenciaIso[2]) - 1,
      Number(coincidenciaIso[3])
    );
  }

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {
    return fecha;
  }

  return texto;
}


function filaDatosHotel(item) {
  return [
    textoDatosHotel(
      item.nombreCompleto
    ),
    textoDatosHotel(
      item.identificacion
    ),
    fechaDatosHotel(
      item.fechaNacimiento
    ),
    textoDatosHotel(
      item.direccion
    ),
    textoDatosHotel(
      item.ciudad
    ),
    textoDatosHotel(
      item.pais
    ),
    textoDatosHotel(
      item.telefono
    ),
    textoDatosHotel(
      item.mesa
    ),
    textoDatosHotel(
      item.habitacion
    ),
  ];
}


function descargarBlobDatosHotel(
  blob,
  nombre
) {
  const url =
    URL.createObjectURL(
      blob
    );

  const enlace =
    document.createElement(
      'a'
    );

  enlace.href =
    url;

  enlace.download =
    nombre;

  document.body.appendChild(
    enlace
  );

  enlace.click();

  enlace.remove();

  URL.revokeObjectURL(
    url
  );
}


export async function exportarDatosHotelExcel({
  items = [],
  anioRetiro,
}) {
  const ExcelJS =
    await cargarExcelJsDatosHotel();

  const workbook =
    new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet(
      'Personal',
      {
        views: [
          {
            showGridLines: true,
          },
        ],
      }
    );

  /*
   * La plantilla entregada comienza en B2 y deja A y la fila 1
   * completamente libres.
   */
  ENCABEZADOS_DATOS_HOTEL.forEach(
    (
      encabezado,
      indice
    ) => {
      const celda =
        worksheet.getCell(
          2,
          indice + 2
        );

      celda.value =
        encabezado;

      celda.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: {
          argb: 'FF000000',
        },
      };

      celda.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };

      celda.border =
        BORDE_DATOS_HOTEL;
    }
  );

  /*
   * Anchos exactos observados en la plantilla original:
   * B:H = 40.7109375
   * I   = 24.140625
   * J   = 21.85546875
   */
  for (
    let columna = 2;
    columna <= 8;
    columna++
  ) {
    worksheet.getColumn(
      columna
    ).width =
      40.7109375;
  }

  worksheet.getColumn(
    9
  ).width =
    24.140625;

  worksheet.getColumn(
    10
  ).width =
    21.85546875;

  items.forEach(
    (
      item,
      indice
    ) => {
      const numeroFila =
        indice + 3;

      const datos =
        filaDatosHotel(
          item
        );

      datos.forEach(
        (
          valor,
          indiceColumna
        ) => {
          const celda =
            worksheet.getCell(
              numeroFila,
              indiceColumna + 2
            );

          celda.value =
            valor;

          celda.font = {
            name: 'Arial',
            size: 10,
            color: {
              argb: 'FF000000',
            },
          };

          celda.alignment = {
            vertical: 'middle',
            wrapText: true,
          };

          celda.border =
            BORDE_DATOS_HOTEL;

          if (
            indiceColumna === 2 &&
            valor instanceof Date
          ) {
            celda.numFmt =
              'dd/mm/yyyy';

            celda.alignment.horizontal =
              'center';
          }

          if (
            [
              1,
              7,
              8,
            ].includes(
              indiceColumna
            )
          ) {
            celda.alignment.horizontal =
              'center';
          }
        }
      );
    }
  );

  const buffer =
    await workbook.xlsx.writeBuffer();

  const blob =
    new Blob(
      [
        buffer,
      ],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );

  const anio =
    String(
      anioRetiro ||
      new Date().getFullYear()
    ).trim();

  descargarBlobDatosHotel(
    blob,
    `DatosPersonas_Retiro_${anio}.xlsx`
  );
}
