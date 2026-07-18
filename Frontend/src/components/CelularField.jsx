import {
  TextField,
} from '@mui/material';

import {
  normalizarCelularColombia,
  obtenerErrorCelularColombia,
} from '../utils/celularUtils';

export default function CelularField({
  value,
  onChange,
  label = 'Celular',
  required = false,
  mostrarError = true,
  helperText,
  ...props
}) {
  const error =
    mostrarError
      ? obtenerErrorCelularColombia(
          value,
          {
            requerido: required,
            etiqueta: label,
          }
        )
      : '';

  const longitud =
    normalizarCelularColombia(value).length;

  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) =>
        onChange(
          normalizarCelularColombia(
            event.target.value
          )
        )
      }
      required={required}
      fullWidth
      error={Boolean(error)}
      helperText={
        error ||
        helperText ||
        `${longitud}/10 dígitos`
      }
      inputProps={{
        inputMode: 'numeric',
        maxLength: 10,
        pattern: '[0-9]*',
      }}
      autoComplete="tel"
      {...props}
    />
  );
}
