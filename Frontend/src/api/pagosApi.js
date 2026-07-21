import { getResource, postAction } from './apiClient';
export async function buscarCaminantePago(criterio){const r=await getResource('buscarcaminantepago',{criterio});return r.datos;}
export async function reportarPagoPublico(datos){const r=await postAction('reportarpagopublico',{datos});return r.datos;}
export async function obtenerPagos(token,params={}){const r=await getResource('pagos',{token,...params});return r.datos;}
export async function validarPago(token,id,decision){const r=await postAction('validarpago',{token,id,decision});return r.datos;}
export async function obtenerPagosCaminante(token,caminanteId){const r=await getResource('pagoscaminante',{token,caminanteId});return r.datos;}
