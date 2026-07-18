import {
  Alert,
  Button,
  Snackbar,
} from '@mui/material';

import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function ProtectedButton({
  permiso,
  onClick,
  children,
  ...buttonProps
}) {
  const {
    ejecutarConPermiso,
  } = useAuth();

  const [
    deniedOpen,
    setDeniedOpen,
  ] = useState(false);

  function handleClick() {
    ejecutarConPermiso({
      permiso,
      accion: onClick,
      onDenied: () =>
        setDeniedOpen(true),
    });
  }

  return (
    <>
      <Button
        {...buttonProps}
        onClick={handleClick}
      >
        {children}
      </Button>

      <Snackbar
        open={deniedOpen}
        autoHideDuration={4500}
        onClose={() =>
          setDeniedOpen(false)
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          severity="warning"
          onClose={() =>
            setDeniedOpen(false)
          }
          variant="filled"
        >
          No tiene permisos para
          realizar esta acción.
        </Alert>
      </Snackbar>
    </>
  );
}
