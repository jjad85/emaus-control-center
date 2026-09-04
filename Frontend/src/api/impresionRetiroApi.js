import { getResource, postAction } from './apiClient';
export async function obtenerConfiguracionImpresion(token){const r=await getResource('configuracionimpresion',{token,_ts:Date.now()});return r.datos;}
export async function obtenerDatosGeneracionImpresion(token){const r=await getResource('datosgeneracionimpresion',{token,_ts:Date.now()});return r.datos;}
export async function obtenerImagenPlantillaImpresion(token,tipo){const r=await getResource('imagenplantillaimpresion',{token,tipo,_ts:Date.now()});return r.datos;}
export async function guardarPlantillaImpresionApi(token,tipo,archivo,anchoCm,altoCm){const r=await postAction('guardarPlantillaImpresion',{token,tipo,archivo,anchoCm,altoCm});return r.datos;}
