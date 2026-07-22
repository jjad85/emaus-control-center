import { postAction } from './apiClient';
export async function obtenerMiFotoPerfilServidor(token){const r=await postAction('obtenermifotoperfilservidor',{token});return r.datos;}
export async function actualizarMiFotoPerfilServidor(token,archivo){const r=await postAction('actualizarmifotoperfilservidor',{token,archivo});return r.datos;}
export async function eliminarMiFotoPerfilServidor(token){const r=await postAction('eliminarmifotoperfilservidor',{token});return r.datos;}
