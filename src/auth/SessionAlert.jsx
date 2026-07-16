import {
  Alert,
  Snackbar,
} from '@mui/material';

import { useAuth } from './AuthContext';

export default function SessionAlert() {
  const {
    avisoSesion,
    cerrarAvisoSesion,
  } = useAuth();

  return (
    <Snackbar
      open={Boolean(avisoSesion)}
      autoHideDuration={10000}
      onClose={
        cerrarAvisoSesion
      }
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        onClose={
          cerrarAvisoSesion
        }
      >
        {avisoSesion}
      </Alert>
    </Snackbar>
  );
}
