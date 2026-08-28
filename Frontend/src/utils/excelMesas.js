const URL_XLSX =
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

function cargarXlsx() {
  if (window.XLSX) {
    return Promise.resolve(
      window.XLSX
    );
  }

  return new Promise(
    (resolve, reject) => {
      const existente =
        document.querySelector(
          `script[src="${URL_XLSX}"]`
        );

      if (existente) {
        existente.addEventListener(
          'load',
          () => resolve(window.XLSX),
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

      script.src = URL_XLSX;
      script.onload =
        () => resolve(window.XLSX);
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
  return {
    'ID caminante':
      valor(c.id),
    'Número de inscripción':
      valor(c.numeroInscripcion),

    'Información general - Primer nombre':
      valor(c.primerNombre),
    'Información general - Segundo nombre':
      valor(c.segundoNombre),
    'Información general - Primer apellido':
      valor(c.primerApellido),
    'Información general - Segundo apellido':
      valor(c.segundoApellido),
    'Información general - Nombre completo':
      valor(c.nombre),
    'Información general - Documento':
      valor(c.documentoIdentidad),
    'Información general - Fecha de nacimiento':
      fechaLegible(c.fechaNacimiento),
    'Información general - Edad':
      valor(c.edad),
    'Información general - Dirección':
      valor(c.direccionResidencia),
    'Información general - Barrio':
      valor(c.barrio),
    'Información general - Teléfono':
      valor(c.telefonoFijo),
    'Información general - Celular':
      valor(c.celular),
    'Información general - Correo':
      valor(c.correo),
    'Información general - Estado civil':
      valor(c.estadoCivil),
    'Información general - Parroquia':
      valor(c.parroquia),
    'Información general - Profesión / ocupación':
      valor(c.profesionOcupacion),
    'Información general - EPS':
      valor(c.eps),
    'Información general - Talla camiseta':
      valor(c.tallaCamiseta),
    'Información general - Habitación':
      valor(c.habitacion),

    'Salud - ¿Sufre enfermedad?':
      valor(c.sufreEnfermedad),
    'Salud - Enfermedad':
      valor(c.enfermedadCual),
    'Salud - ¿Toma medicamento?':
      valor(c.tomaMedicamento),
    'Salud - Medicamento':
      valor(c.medicamentoCual),
    'Salud - Horarios medicamentos':
      valor(c.horariosMedicamentos),
    'Salud - ¿Tiene limitación física?':
      valor(c.tieneLimitacionFisica),
    'Salud - Limitación física':
      valor(c.limitacionCual),

    'Alimentación - ¿Tiene condición alimentaria?':
      valor(c.tieneCondicionAlimentaria),
    'Alimentación - Alergias':
      valor(c.alergiasAlimentarias),
    'Alimentación - Restricciones':
      valor(c.restriccionesAlimentarias),
    'Alimentación - Preferencias':
      valor(c.preferenciasAlimentarias),
    'Alimentación - Dieta especial':
      valor(c.dietaEspecial),

    'Contacto 1 - Nombre':
      valor(c.contacto1Nombre),
    'Contacto 1 - Parentesco':
      valor(c.contacto1Parentesco),
    'Contacto 1 - Celular':
      valor(c.contacto1Celular),

    'Contacto 2 - Nombre':
      valor(c.contacto2Nombre),
    'Contacto 2 - Parentesco':
      valor(c.contacto2Parentesco),
    'Contacto 2 - Celular':
      valor(c.contacto2Celular),

    'Retiro - Sacramentos recibidos':
      valor(c.sacramentosRecibidos),
    'Retiro - Cómo se enteró':
      valor(c.comoSeEntero),
    'Retiro - Persona que invitó':
      valor(c.nombrePersonaInvito),
    'Retiro - Celular persona que invitó':
      valor(c.celularPersonaInvito),
    'Retiro - ¿Asistirá persona conocida?':
      valor(c.personaConocidaAsistira),
    'Retiro - Nombre persona conocida':
      valor(c.nombrePersonaConocida)
  };
}

export async function descargarCaminantesMesaExcel(
  datos
) {
  const caminantes =
    datos?.caminantes || [];

  if (!caminantes.length) {
    throw new Error(
      'La mesa no tiene caminantes para exportar.'
    );
  }

  const XLSX =
    await cargarXlsx();

  const filas =
    caminantes.map(
      filaCaminante
    );

  const hoja =
    XLSX.utils.json_to_sheet(
      filas
    );

  hoja['!cols'] =
    Object.keys(
      filas[0] || {}
    ).map(function(campo) {
      return {
        wch: Math.min(
          Math.max(
            16,
            campo.length + 2
          ),
          42
        )
      };
    });

  const libro =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    `Mesa ${datos.numeroMesa}`.slice(
      0,
      31
    )
  );

  const numero =
    String(
      datos.numeroMesa || ''
    ).replace(
      /[^a-zA-Z0-9_-]/g,
      ''
    );

  XLSX.writeFile(
    libro,
    `Mesa_${numero}_Caminantes.xlsx`
  );
}
