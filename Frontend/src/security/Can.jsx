import { Tooltip, Box } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

export default function Can({ permiso, children, ocultar = true, mensaje = 'No tiene permiso para realizar esta acción.' }) {
  const { tienePermiso } = useAuth();
  const permitido = tienePermiso(permiso);
  if (permitido) return children;
  if (ocultar) return null;
  return (
    <Tooltip title={mensaje}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {typeof children === 'function' ? children({ disabled: true }) : children}
      </Box>
    </Tooltip>
  );
}
