import { Chip } from '@mui/material';
const MAPA={
  'Aprobada final':{color:'success',label:'Aprobada final'},
  'Aprobada':{color:'success',label:'Aprobada'},
  'En revisión':{color:'warning',label:'En revisión'},
  'Rechazada':{color:'error',label:'Requiere ajustes'},
  'Pendiente de carga':{color:'default',label:'Pendiente de carga'},
  'Pendiente de definición':{color:'default',label:'Pendiente de definición'},
  'Sin presentación':{color:'info',label:'Sin presentación'},
};
export default function EstadoTemaChip({ estado }) { const c=MAPA[estado]||{color:'default',label:estado||'Pendiente'}; return <Chip size="small" color={c.color} label={c.label}/>; }
