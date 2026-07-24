import { Chip } from '@mui/material';
const MAPA={
  'Aprobada final':{color:'success',label:'Aprobada final'},
  'Aprobada':{color:'success',label:'Aprobada'},
  'En revisión':{color:'warning',label:'En revisión'},
  'Pendiente revisión audiovisual':{color:'warning',label:'Pendiente revisión audiovisual'},
  'Pendiente aprobación servidor':{color:'info',label:'Pendiente aprobación del servidor'},
  'Requiere ajustes':{color:'error',label:'Requiere ajustes'},
  'Requiere ajustes audiovisuales':{color:'error',label:'Requiere ajustes audiovisuales'},
  'Tema configurado':{color:'success',label:'Tema configurado'},
  'Rechazada':{color:'error',label:'Requiere ajustes'},
  'Pendiente de carga':{color:'default',label:'Pendiente de carga'},
  'Pendiente de definición':{color:'default',label:'Pendiente de definición'},
  'Sin presentación':{color:'info',label:'Sin presentación'},
};
export default function EstadoTemaChip({ estado }) { const c=MAPA[estado]||{color:'default',label:estado||'Pendiente'}; return <Chip size="small" color={c.color} label={c.label}/>; }
