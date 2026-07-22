import { Avatar, Badge, Tooltip } from '@mui/material';

function obtenerIniciales(nombre) {
  return String(nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase() || '?';
}

export default function AvatarServidor({
  servidor,
  nombre,
  fotoPerfilUrl,
  size = 48,
  destacado = false,
  mostrarTooltip = true,
  sx = {},
}) {
  const nombreVisible =
    nombre ||
    servidor?.nombre ||
    servidor?.nombreCompleto ||
    'Servidor';

  const foto =
    fotoPerfilUrl ||
    servidor?.fotoPerfilUrl ||
    servidor?.fotoUrl ||
    '';

  const contenido = (
    <Badge
      overlap="circular"
      variant={destacado ? 'dot' : undefined}
      color="primary"
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <Avatar
        src={foto || undefined}
        alt={nombreVisible}
        imgProps={{
          referrerPolicy: 'no-referrer',
          loading: 'lazy',
        }}
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(15, size * 0.32),
          fontWeight: 900,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0,
          ...sx,
        }}
      >
        {obtenerIniciales(nombreVisible)}
      </Avatar>
    </Badge>
  );

  return mostrarTooltip ? (
    <Tooltip title={nombreVisible} arrow>
      {contenido}
    </Tooltip>
  ) : contenido;
}
