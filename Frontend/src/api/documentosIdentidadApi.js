import { getResource, postAction } from './apiClient';

const TIMEOUT_ARCHIVO = 180000;

export async function consultarDocumentoIdentidadPublico(documento) {
  const response = await postAction(
    'consultarDocumentoIdentidadPublico',
    { documento },
    { mostrarCarga: false, refrescarDatos: false }
  );
  return response.datos;
}

export async function registrarDocumentoIdentidadPublico(documento, archivo) {
  const response = await postAction(
    'registrarDocumentoIdentidadPublico',
    { documento, archivo },
    { timeout: TIMEOUT_ARCHIVO, refrescarDatos: false }
  );
  return response.datos;
}

export async function obtenerPanelDocumentosIdentidad(token) {
  const response = await getResource('documentosidentidad', { token });
  return response.datos;
}

export async function obtenerDocumentoIdentidadArchivo(token, tipoPersona, personaId) {
  const response = await postAction(
    'obtenerDocumentoIdentidadArchivo',
    { token, tipoPersona, personaId },
    { timeout: TIMEOUT_ARCHIVO, refrescarDatos: false }
  );
  return response.datos;
}

export async function exportarDocumentosIdentidad(token, lote = 0) {
  const response = await postAction(
    'exportarDocumentosIdentidad',
    { token, lote },
    { timeout: TIMEOUT_ARCHIVO, refrescarDatos: false }
  );
  return response.datos;
}

export async function crearSolicitudDocumentoIdentidadWhatsapp(
  token,
  tipoPersona,
  personaId,
  link
) {
  const response = await postAction(
    'crearSolicitudDocumentoIdentidadWhatsapp',
    { token, tipoPersona, personaId, link }
  );
  return response.datos;
}

export function archivoABase64DocumentoIdentidad(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      nombre: file.name,
      tipo: file.type || 'application/octet-stream',
      base64: reader.result,
    });
    reader.onerror = () => reject(new Error('No fue posible leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}
