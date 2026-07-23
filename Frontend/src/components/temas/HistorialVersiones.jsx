import { Button, Paper, Stack, Typography } from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import EstadoTemaChip from './EstadoTemaChip';

function formatearFechaVersion(valor) {
  if (!valor) return 'Fecha no disponible';

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toLocaleString('es-CO');
  }

  const texto = String(valor).trim();
  if (!texto) return 'Fecha no disponible';

  // Compatibilidad con valores históricos dd/MM/yyyy y dd/MM/yyyy HH:mm:ss.
  const coincidencia = texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  let fecha;
  if (coincidencia) {
    fecha = new Date(
      Number(coincidencia[3]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[1]),
      Number(coincidencia[4] || 0),
      Number(coincidencia[5] || 0),
      Number(coincidencia[6] || 0)
    );
  } else {
    fecha = new Date(texto);
  }

  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha no disponible';
  }

  return fecha.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function HistorialVersiones({ versiones = [] }) {
  return (
    <Stack spacing={1.2}>
      {versiones.map((version, indice) => (
        <Paper
          variant="outlined"
          key={version.id || `${version.temaId || 'tema'}-${version.numeroVersion || indice}`}
          sx={{ p: 2, borderRadius: 3 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Stack>
              <Typography fontWeight={850}>
                Versión {version.numeroVersion} · {version.nombreArchivo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {version.comentarioCambio || 'Sin comentarios'} ·{' '}
                {formatearFechaVersion(version.fechaRegistro)}
              </Typography>
            </Stack>

            <Stack direction="row" gap={1} alignItems="center">
              <EstadoTemaChip estado={version.estadoVersion} />
              {version.archivoDriveUrl && (
                <Button
                  component="a"
                  href={version.archivoDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                  startIcon={<DownloadRounded />}
                >
                  Abrir
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
