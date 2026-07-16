import { Button } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

/**
 * Solo muestra el botón cuando la sesión ya fue validada,
 * el usuario está autenticado y posee el permiso requerido.
 */
export default function ProtectedButton({
  permiso,
  onClick,
  children,
  ...buttonProps
}) {
  const {
    autenticado,
    loading,
    tienePermiso,
  } = useAuth();

  const autorizado =
    !loading &&
    autenticado &&
    tienePermiso(permiso);

  if (!autorizado) {
    return null;
  }

  return (
    <Button
      {...buttonProps}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
