import { postAction } from './apiClient';

const TIMEOUT_CARGA_ARCHIVO = 180000;

export async function obtenerMiTemaAsignado(token) {
  const response = await postAction(
    'obtenerMiTemaAsignado',
    { token }
  );

  return response.datos;
}

export async function subirVersionTema(
  token,
  temaId,
  archivo,
  comentario = '',
  onUploadProgress
) {
  const response = await postAction(
    'subirVersionTema',
    {
      token,
      temaId,
      archivo,
      comentario,
    },
    {
      timeout: TIMEOUT_CARGA_ARCHIVO,
      onUploadProgress,
    }
  );

  return response.datos;
}

export async function actualizarPreferenciasMiTema(
  token,
  temaId,
  datos
) {
  const response = await postAction(
    'actualizarPreferenciasMiTema',
    { token, temaId, datos }
  );

  return response.datos;
}

export async function subirMusicaTema(
  token,
  temaId,
  archivo,
  observaciones = '',
  onUploadProgress
) {
  const response = await postAction(
    'subirMusicaTema',
    {
      token,
      temaId,
      archivo,
      observaciones,
    },
    {
      timeout: TIMEOUT_CARGA_ARCHIVO,
      onUploadProgress,
    }
  );

  return response.datos;
}

export function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve({
        nombre: file.name,
        tipo: file.type,
        base64: reader.result,
      });

    reader.onerror = () =>
      reject(
        new Error(
          'No fue posible leer el archivo.'
        )
      );

    reader.readAsDataURL(file);
  });
}
