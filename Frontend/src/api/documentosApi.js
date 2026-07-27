import { getResource, postAction } from './apiClient';

const TIMEOUT_ARCHIVO = 180000;

export async function obtenerDocumentos(token, filtros = {}) {
  const response = await getResource('documentos', { token, ...filtros });
  return response.datos;
}

export async function crearDocumento(token, datos, archivo) {
  const response = await postAction(
    'crearDocumento',
    { token, datos, archivo },
    { timeout: TIMEOUT_ARCHIVO }
  );
  return response.datos;
}

export async function editarDocumento(token, id, datos, archivo = null) {
  const response = await postAction(
    'editarDocumento',
    { token, id, datos, archivo },
    { timeout: TIMEOUT_ARCHIVO }
  );
  return response.datos;
}

export async function eliminarDocumento(token, id) {
  const response = await postAction('eliminarDocumento', { token, id });
  return response.datos;
}

export async function restaurarDocumento(token, id) {
  const response = await postAction('restaurarDocumento', { token, id });
  return response.datos;
}

export async function obtenerUrlDescargaDocumento(token, id) {
  const response = await postAction('obtenerUrlDescargaDocumento', { token, id });
  return response.datos;
}

export function archivoDocumentoABase64(file) {
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
