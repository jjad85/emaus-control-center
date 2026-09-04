import { getResource, postAction } from './apiClient';

export async function obtenerConfiguracionImpresion(token) {
  const r = await getResource('configuracionimpresion', {
    token,
    _ts: Date.now(),
  });
  return r.datos;
}

export async function obtenerDatosGeneracionImpresion(token) {
  const r = await getResource('datosgeneracionimpresion', {
    token,
    _ts: Date.now(),
  });
  return r.datos;
}

export async function obtenerImagenPlantillaImpresion(token, tipo) {
  const r = await getResource('imagenplantillaimpresion', {
    token,
    tipo,
    _ts: Date.now(),
  });
  return r.datos;
}

export async function guardarPlantillaImpresionApi(
  token,
  tipo,
  archivo,
  anchoCm,
  altoCm,
  tamanoCentralPt,
  tamanoInferiorPt,
  fuente,
) {
  const r = await postAction(
    'guardarPlantillaImpresion',
    {
      token,
      tipo,
      archivo,
      anchoCm,
      altoCm,
      tamanoCentralPt,
      tamanoInferiorPt,
      fuente,
    },
    { timeout: 120000 },
  );
  return r.datos;
}


export async function guardarConfiguracionPlantillaImpresionApi(
  token,
  tipo,
  anchoCm,
  altoCm,
  tamanoCentralPt,
  tamanoInferiorPt,
  fuente,
) {
  const r = await postAction(
    'guardarConfiguracionPlantillaImpresion',
    {
      token,
      tipo,
      anchoCm,
      altoCm,
      tamanoCentralPt,
      tamanoInferiorPt,
      fuente,
    },
    { timeout: 120000 },
  );
  return r.datos;
}
