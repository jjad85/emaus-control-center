import { Button } from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { obtenerReporteRecursosTemaApi } from '../../api/seguimientoRecursosTemaApi';

function csv(items) {
  const encabezado = ['Tema','Responsable','Tipo','Nombre','Origen','Estado','Aprobador','Fecha de aprobación','Observaciones'];
  const filas = items.map((x) => [x.temaNombre,x.responsable,x.tipo,x.nombre,x.origen,x.estado,x.aprobador,x.fechaAprobacion,x.observaciones]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '\ufeff' + [encabezado, ...filas].map((f) => f.map(esc).join(';')).join('\n');
}

export default function ReporteRecursosButton({ tipo = '' }) {
  const { token } = useAuth(); const [cargando, setCargando] = useState(false);
  const descargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerReporteRecursosTemaApi(token, tipo ? { tipo } : {});
      const url = URL.createObjectURL(new Blob([csv(data.items || [])], { type:'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = tipo ? `reporte_${tipo.toLowerCase()}.csv` : 'reporte_recursos_temas.csv'; a.click(); URL.revokeObjectURL(url);
    } finally { setCargando(false); }
  };
  return <Button variant="outlined" startIcon={<DownloadRounded />} onClick={descargar} disabled={cargando}>{cargando ? 'Generando...' : 'Exportar reporte'}</Button>;
}
