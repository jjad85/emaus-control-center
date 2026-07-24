import { Avatar, Paper, Stack, Typography } from '@mui/material';

export default function ComentariosPresentacion({ comentarios=[] }) {
  if (!comentarios.length) return <Typography color="text.secondary">Todavía no hay comentarios.</Typography>;
  return <Stack spacing={1.2}>{comentarios.map((c)=><Paper key={c.id} variant="outlined" sx={{p:2,borderRadius:3}}><Stack direction="row" spacing={1.5}><Avatar>{String(c.nombreUsuario||c.rol||'?').charAt(0)}</Avatar><Stack><Typography fontWeight={850}>{c.nombreUsuario||c.usuario||c.rol} · {c.rol}</Typography><Typography variant="body2" color="text.secondary">Versión {c.numeroVersion||'—'} · {c.fechaRegistro||''}</Typography><Typography sx={{mt:.5,whiteSpace:'pre-wrap'}}>{c.comentario}</Typography></Stack></Stack></Paper>)}</Stack>;
}
