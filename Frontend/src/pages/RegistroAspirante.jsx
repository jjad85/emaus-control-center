import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';

import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  obtenerPortalPublico,
  registrarAspirantePublico,
} from '../api/publicApi';

import { useApi } from '../hooks/useApi';

const PASOS = [
  'Información personal',
  'Salud',
  'Información general',
  'Emergencia',
  'Información del retiro',
];

const ESTADOS_CIVILES = [
  'Casado(a)',
  'Unión libre',
  'Divorciado(a)',
  'Soltero(a)',
  'Viudo(a)',
  'Otro',
];

const TALLAS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
];

const SACRAMENTOS = [
  'Bautizo',
  'Primera comunión',
  'Confirmación',
  'Matrimonio',
  'Ninguno',
];

const COMO_SE_ENTERO = [
  'Anuncio en la parroquia',
  'Me invitó un amigo o familiar',
  'Había escuchado y busqué información',
  'Otro',
];

const INICIAL = {
  tipoRegistrante: '',
  nombreRegistrante: '',
  telefonoRegistrante: '',
  nombreCompleto: '',
  documentoIdentidad: '',
  direccionResidencia: '',
  fechaNacimiento: '',
  barrio: '',
  telefono: '',
  celular: '',
  estadoCivil: '',
  parroquia: '',

  sufreEnfermedad: '',
  enfermedadCual: '',
  tomaMedicamento: '',
  medicamentoCual: '',
  horariosMedicamentos: '',
  eps: '',
  profesionOcupacion: '',
  tieneLimitacionFisica: '',
  limitacionCual: '',

  sacramentosRecibidos: [],
  tallaCamisa: '',

  contacto1Nombre: '',
  contacto1Parentesco: '',
  contacto1Celular: '',
  contacto2Nombre: '',
  contacto2Parentesco: '',
  contacto2Celular: '',

  comoSeEntero: '',
  nombrePersonaInvito: '',
  celularPersonaInvito: '',
  personaConocidaAsistira: '',
  nombrePersonaConocida: '',
  autorizaTratamientoDatos: '',
  autorizaFotografias: 'No',
};

function Campo({
  label,
  value,
  onChange,
  required = false,
  error = false,
  helperText = '',
  ...props
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      required={required}
      error={error}
      helperText={
        error
          ? helperText ||
            'Este campo es obligatorio.'
          : helperText
      }
      fullWidth
      {...props}
    />
  );
}

function PreguntaSiNo({
  label,
  value,
  onChange,
  required = false,
  error = false,
}) {
  return (
    <FormControl
      required={required}
      error={error}
    >
      <FormLabel>
        {label}
      </FormLabel>

      <RadioGroup
        row
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        <FormControlLabel
          value="Sí"
          control={<Radio />}
          label="Sí"
        />

        <FormControlLabel
          value="No"
          control={<Radio />}
          label="No"
        />
      </RadioGroup>

      {error && (
        <FormHelperText>
          Seleccione una opción.
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default function RegistroAspirante() {
  const navigate =
    useNavigate();

  const portalApi = useApi(
    () => obtenerPortalPublico(),
    []
  );

  const [paso, setPaso] =
    useState(0);

  const [form, setForm] =
    useState(INICIAL);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    mostrarErrores,
    setMostrarErrores,
  ] = useState(false);

  const [resultado, setResultado] =
    useState(null);

  const [
    dialogoAutorizacion,
    setDialogoAutorizacion,
  ] = useState(null);

  const [
    dialogoTipoRegistrante,
    setDialogoTipoRegistrante,
  ] = useState(true);

  const [
    errorTipoRegistrante,
    setErrorTipoRegistrante,
  ] = useState('');

  const portal =
    portalApi.data || {};

  function campoVacio(
    valor
  ) {
    if (Array.isArray(valor)) {
      return valor.length === 0;
    }

    return !String(
      valor ?? ''
    ).trim();
  }

  function errorObligatorio(
    campo,
    condicion = true
  ) {
    return (
      mostrarErrores &&
      condicion &&
      campoVacio(
        form[campo]
      )
    );
  }

  function calcularEdad(
    fechaNacimiento
  ) {
    if (!fechaNacimiento) {
      return '';
    }

    const partes =
      String(
        fechaNacimiento
      ).split('-');

    if (partes.length !== 3) {
      return '';
    }

    const nacimiento =
      new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
      );

    if (
      Number.isNaN(
        nacimiento.getTime()
      )
    ) {
      return '';
    }

    const hoy =
      new Date();

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear();

    const diferenciaMes =
      hoy.getMonth() -
      nacimiento.getMonth();

    if (
      diferenciaMes < 0 ||
      (
        diferenciaMes === 0 &&
        hoy.getDate() <
          nacimiento.getDate()
      )
    ) {
      edad -= 1;
    }

    if (
      edad < 0 ||
      edad > 120
    ) {
      return '';
    }

    return edad;
  }

  function normalizarCelular(
    valor
  ) {
    return String(
      valor || ''
    ).replace(
      /\D/g,
      ''
    );
  }

  function celularValido(
    valor
  ) {
    return /^3\d{9}$/.test(
      normalizarCelular(
        valor
      )
    );
  }

  function errorCelular(
    campo,
    obligatorio = true
  ) {
    const valor =
      form[campo];

    if (!valor) {
      return (
        obligatorio &&
        mostrarErrores
      );
    }

    return !celularValido(
      valor
    );
  }

  function ayudaCelular(
    campo,
    obligatorio = true
  ) {
    if (
      !form[campo] &&
      obligatorio &&
      mostrarErrores
    ) {
      return 'Este campo es obligatorio.';
    }

    if (
      form[campo] &&
      !celularValido(
        form[campo]
      )
    ) {
      return 'Ingrese 10 dígitos y comience por 3.';
    }

    return '';
  }

  function cambiar(
    campo,
    valor
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function confirmarTipoRegistrante() {
    if (!form.tipoRegistrante) {
      setErrorTipoRegistrante(
        'Selecciona quién está diligenciando la inscripción.'
      );
      return;
    }

    if (
      form.tipoRegistrante === 'INVITADOR' &&
      (
        !form.nombreRegistrante.trim() ||
        !celularValido(form.telefonoRegistrante)
      )
    ) {
      setErrorTipoRegistrante(
        'Ingresa el nombre y un celular válido de quien realiza la inscripción.'
      );
      return;
    }

    setErrorTipoRegistrante('');
    setDialogoTipoRegistrante(false);
  }

  function cambiarSacramento(
    sacramento
  ) {
    setForm((actual) => {
      const actuales =
        actual.sacramentosRecibidos;

      let nuevos;

      if (
        sacramento === 'Ninguno'
      ) {
        nuevos =
          actuales.includes(
            'Ninguno'
          )
            ? []
            : ['Ninguno'];
      } else {
        const sinNinguno =
          actuales.filter(
            (item) =>
              item !== 'Ninguno'
          );

        nuevos =
          sinNinguno.includes(
            sacramento
          )
            ? sinNinguno.filter(
                (item) =>
                  item !==
                  sacramento
              )
            : [
                ...sinNinguno,
                sacramento,
              ];
      }

      return {
        ...actual,
        sacramentosRecibidos:
          nuevos,
      };
    });
  }

  const validacionPaso =
    useMemo(() => {
      if (paso === 0) {
        const registranteValido = form.tipoRegistrante !== 'INVITADOR' || (form.nombreRegistrante && celularValido(form.telefonoRegistrante));
        return Boolean(
          registranteValido &&
          form.nombreCompleto &&
          form.documentoIdentidad &&
          form.direccionResidencia &&
          form.fechaNacimiento &&
          calcularEdad(form.fechaNacimiento) >= 18 &&
          form.barrio &&
          celularValido(
            form.celular
          ) &&
          form.estadoCivil
        );
      }

      if (paso === 1) {
        return Boolean(
          form.sufreEnfermedad &&
          form.tomaMedicamento &&
          form.eps &&
          form.profesionOcupacion &&
          form.tieneLimitacionFisica
        );
      }

      if (paso === 2) {
        return Boolean(
          form.sacramentosRecibidos.length &&
          form.tallaCamisa
        );
      }

      if (paso === 3) {
        return Boolean(
          form.contacto1Nombre &&
          form.contacto1Parentesco &&
          celularValido(
            form.contacto1Celular
          ) &&
          form.contacto2Nombre &&
          form.contacto2Parentesco &&
          celularValido(
            form.contacto2Celular
          )
        );
      }

      return Boolean(
        form.comoSeEntero &&
        form.personaConocidaAsistira &&
        (
          !form.celularPersonaInvito ||
          celularValido(
            form.celularPersonaInvito
          )
        ) &&
        form.autorizaTratamientoDatos ===
          'Sí'
      );
    }, [
      paso,
      form,
    ]);

  function siguiente() {
    setMostrarErrores(true);

    if (!validacionPaso) {
      setError(
        'Completa los campos obligatorios antes de continuar.'
      );
      return;
    }

    setError('');
    setMostrarErrores(false);
    setPaso((actual) =>
      Math.min(
        PASOS.length - 1,
        actual + 1
      )
    );
  }

  async function enviar() {
    setMostrarErrores(true);

    if (!validacionPaso) {
      setError(
        'Completa los campos obligatorios y acepta el tratamiento de datos.'
      );
      return;
    }

    setEnviando(true);
    setError('');

    const edadCalculada = calcularEdad(form.fechaNacimiento);

    if (edadCalculada === '' || edadCalculada < 18) {
      setError('El aspirante debe tener 18 años o más.');
      setEnviando(false);
      return;
    }

    try {
      const datosFormulario = { ...form };
      delete datosFormulario.edad;

      const datos =
        await registrarAspirantePublico(
          datosFormulario
        );

      setResultado(datos);
    } catch (err) {
      setError(
        err.message ||
          'No fue posible realizar el registro.'
      );
    } finally {
      setEnviando(false);
    }
  }

  const descargarCodigoInscripcion = () => {
    const codigo = resultado?.numeroInscripcion;

    if (!codigo) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.fillStyle = '#f5efe3';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#ffffff';
    context.beginPath();
    context.roundRect(80, 80, 1040, 1040, 48);
    context.fill();

    context.textAlign = 'center';
    context.fillStyle = '#2e7d32';
    context.font = 'bold 92px Arial, sans-serif';
    context.fillText('✓', 600, 250);

    context.fillStyle = '#1f2937';
    context.font = 'bold 58px Arial, sans-serif';
    context.fillText('Inscripción recibida', 600, 350);

    context.fillStyle = '#6b7280';
    context.font = '34px Arial, sans-serif';
    context.fillText('Tu código de inscripción es:', 600, 440);

    context.fillStyle = '#7b1e3b';
    context.font = 'bold 92px Arial, sans-serif';
    context.fillText(codigo, 600, 565);

    context.fillStyle = '#374151';
    context.font = '32px Arial, sans-serif';
    context.fillText('Guarda este código.', 600, 680);
    context.fillText('Lo puedes necesitar para consultar tu inscripción', 600, 735);
    context.fillText('o para reportar y consultar tus pagos.', 600, 790);

    context.strokeStyle = '#d1d5db';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(180, 865);
    context.lineTo(1020, 865);
    context.stroke();

    context.fillStyle = '#6b7280';
    context.font = '28px Arial, sans-serif';
    context.fillText('Retiro de Emaús 2026', 600, 950);

    const enlace = document.createElement('a');
    enlace.download = `inscripcion-${codigo}.png`;
    enlace.href = canvas.toDataURL('image/png');
    enlace.click();
  };

  if (resultado) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: '#f5efe3',
          display: 'grid',
          placeItems: 'center',
          p: 2,
        }}
      >
        <Paper
          sx={{
            maxWidth: 620,
            p: {
              xs: 3,
              md: 5,
            },
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <CheckCircleRounded
            color="success"
            sx={{
              fontSize: 70,
            }}
          />

          <Typography
            variant="h4"
            fontWeight={900}
            mt={1}
          >
            Registro recibido
          </Typography>

          <Typography
            color="text.secondary"
            mt={1}
          >
            {portal.mensajeConfirmacion ||
              'Gracias. El equipo del retiro revisará tu información y se comunicará contigo.'}
          </Typography>

          <Typography
            variant="h6"
            fontWeight={900}
            mt={3}
          >
            Número de inscripción
          </Typography>

          <Typography
            variant="h4"
            color="primary"
            fontWeight={950}
          >
            {
              resultado.numeroInscripcion
            }
          </Typography>

          <Alert
            severity="info"
            sx={{
              mt: 3,
              textAlign: 'left',
            }}
          >
            <strong>Guarda este código.</strong> Lo puedes necesitar para preguntar por tu inscripción o para reportar y consultar tus pagos.
          </Alert>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row',
            }}
            spacing={1.5}
            justifyContent="center"
            mt={3}
          >
            <Button
              variant="contained"
              startIcon={<DownloadRounded />}
              onClick={descargarCodigoInscripcion}
            >
              Descargar código como imagen
            </Button>

            <Button
              variant="outlined"
              onClick={() =>
                navigate('/')
              }
            >
              Volver al inicio
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#f5efe3',
        py: {
          xs: 2,
          md: 5,
        },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={2.5}>
          <Box>
            <Button
              startIcon={
                <ArrowBackRounded />
              }
              onClick={() =>
                navigate('/')
              }
            >
              Volver
            </Button>

            <Typography
              variant="h3"
              fontWeight={950}
              mt={1}
              sx={{
                fontSize: {
                  xs: '2rem',
                  md: '3rem',
                },
              }}
            >
              Registro al retiro
            </Typography>

            <Typography
              color="text.secondary"
            >
              Diligencia la información con calma y verifica los datos antes de enviar.
            </Typography>
          </Box>

          <Dialog
            open={dialogoTipoRegistrante}
            fullWidth
            maxWidth="sm"
            onClose={() => navigate('/')}
          >
            <DialogTitle sx={{ position: 'relative', pr: 6 }}>
              Antes de comenzar

              <IconButton
                aria-label="Cerrar inscripción"
                onClick={() => navigate('/')}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseRounded />
              </IconButton>
            </DialogTitle>

            <DialogContent>
              <Typography
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Indícanos quién está diligenciando esta inscripción. Esta selección no hace parte de los pasos del formulario.
              </Typography>

              <FormControl
                required
                error={Boolean(errorTipoRegistrante)}
                fullWidth
              >
                <FormLabel>
                  ¿Quién está diligenciando la inscripción?
                </FormLabel>

                <RadioGroup
                  value={form.tipoRegistrante}
                  onChange={(event) => {
                    const valor = event.target.value;
                    cambiar('tipoRegistrante', valor);
                    setErrorTipoRegistrante('');

                    if (valor === 'ASPIRANTE') {
                      cambiar('nombreRegistrante', '');
                      cambiar('telefonoRegistrante', '');
                    }
                  }}
                >
                  <FormControlLabel
                    value="ASPIRANTE"
                    control={<Radio />}
                    label="Soy la persona que asistirá al retiro"
                  />

                  <FormControlLabel
                    value="INVITADOR"
                    control={<Radio />}
                    label="Estoy inscribiendo a otra persona"
                  />
                </RadioGroup>

                {errorTipoRegistrante && (
                  <FormHelperText>
                    {errorTipoRegistrante}
                  </FormHelperText>
                )}
              </FormControl>

              {form.tipoRegistrante === 'INVITADOR' && (
                <Stack spacing={2} mt={2}>
                  <Campo
                    label="Nombre de quien realiza la inscripción"
                    value={form.nombreRegistrante}
                    onChange={(valor) => {
                      cambiar('nombreRegistrante', valor);
                      setErrorTipoRegistrante('');
                    }}
                    required
                  />

                  <Campo
                    label="Celular de quien realiza la inscripción"
                    value={form.telefonoRegistrante}
                    onChange={(valor) => {
                      cambiar(
                        'telefonoRegistrante',
                        normalizarCelular(valor).slice(0, 10)
                      );
                      setErrorTipoRegistrante('');
                    }}
                    required
                    error={Boolean(
                      form.telefonoRegistrante &&
                      !celularValido(form.telefonoRegistrante)
                    )}
                    helperText={
                      form.telefonoRegistrante &&
                      !celularValido(form.telefonoRegistrante)
                        ? 'Ingrese 10 dígitos y comience por 3.'
                        : ''
                    }
                  />
                </Stack>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={() => navigate('/')}
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                onClick={confirmarTipoRegistrante}
                disabled={!form.tipoRegistrante}
              >
                Continuar con la inscripción
              </Button>
            </DialogActions>
          </Dialog>

          <Paper
            sx={{
              p: {
                xs: 2,
                md: 3,
              },
              borderRadius: 4,
            }}
          >
            <Stepper
              activeStep={paso}
              alternativeLabel
              sx={{
                display: {
                  xs: 'none',
                  sm: 'flex',
                },
              }}
            >
              {PASOS.map(
                (nombre) => (
                  <Step key={nombre}>
                    <StepLabel>
                      {nombre}
                    </StepLabel>
                  </Step>
                )
              )}
            </Stepper>

            <Typography
              variant="overline"
              color="primary"
              fontWeight={900}
              sx={{
                display: {
                  sm: 'none',
                },
              }}
            >
              Paso {paso + 1} de {PASOS.length}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                mt: {
                  xs: 0,
                  sm: 3,
                },
                mb: 2.5,
              }}
            >
              {PASOS[paso]}
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                }}
              >
                {error}
              </Alert>
            )}

            {paso === 0 && (
              <Grid
                container
                spacing={2}
              >
                <Grid size={12}>
                  <Campo
                    label="Nombre completo"
                    value={form.nombreCompleto}
                    onChange={(valor) =>
                      cambiar(
                        'nombreCompleto',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'nombreCompleto'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Documento de identidad"
                    value={form.documentoIdentidad}
                    onChange={(valor) =>
                      cambiar(
                        'documentoIdentidad',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'documentoIdentidad'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Fecha de nacimiento"
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(valor) =>
                      cambiar(
                        'fechaNacimiento',
                        valor
                      )
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    required
                    error={
                      errorObligatorio('fechaNacimiento') ||
                      Boolean(
                        form.fechaNacimiento &&
                        calcularEdad(form.fechaNacimiento) < 18
                      )
                    }
                    helperText={
                      form.fechaNacimiento &&
                      calcularEdad(form.fechaNacimiento) < 18
                        ? 'El aspirante debe tener 18 años o más.'
                        : ''
                    }
                    inputProps={{
                      max: new Date().toISOString().split('T')[0],
                    }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 8,
                  }}
                >
                  <Campo
                    label="Dirección de residencia"
                    value={form.direccionResidencia}
                    onChange={(valor) =>
                      cambiar(
                        'direccionResidencia',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'direccionResidencia'
                    )}
                  />
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Barrio"
                    value={form.barrio}
                    onChange={(valor) =>
                      cambiar(
                        'barrio',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'barrio'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Parroquia a la que asiste"
                    value={form.parroquia}
                    onChange={(valor) =>
                      cambiar(
                        'parroquia',
                        valor
                      )
                    }
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Teléfono"
                    value={form.telefono}
                    onChange={(valor) =>
                      cambiar(
                        'telefono',
                        valor
                      )
                    }
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Celular"
                    value={form.celular}
                    onChange={(valor) =>
                      cambiar(
                        'celular',
                        valor
                      )
                    }
                    required
                    error={errorCelular(
                      'celular'
                    )}
                    helperText={ayudaCelular(
                      'celular'
                    )}
                    inputProps={{
                      inputMode: 'numeric',
                      maxLength: 10,
                    }}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    select
                    label="Estado civil"
                    value={form.estadoCivil}
                    onChange={(event) =>
                      cambiar(
                        'estadoCivil',
                        event.target.value
                      )
                    }
                    fullWidth
                    required
                    error={errorObligatorio(
                      'estadoCivil'
                    )}
                    helperText={
                      errorObligatorio(
                        'estadoCivil'
                      )
                        ? 'Este campo es obligatorio.'
                        : ''
                    }
                  >
                    {ESTADOS_CIVILES.map(
                      (item) => (
                        <MenuItem
                          key={item}
                          value={item}
                        >
                          {item}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                </Grid>
              </Grid>
            )}

            {paso === 1 && (
              <Stack spacing={2.5}>
                <PreguntaSiNo
                  label="¿Sufre alguna enfermedad?"
                  value={form.sufreEnfermedad}
                  onChange={(valor) =>
                    cambiar(
                      'sufreEnfermedad',
                      valor
                    )
                  }
                  required
                  error={errorObligatorio(
                    'sufreEnfermedad'
                  )}
                />

                {form.sufreEnfermedad ===
                  'Sí' && (
                  <Campo
                    label="¿Cuál enfermedad?"
                    value={form.enfermedadCual}
                    onChange={(valor) =>
                      cambiar(
                        'enfermedadCual',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'enfermedadCual',
                      form.sufreEnfermedad === 'Sí'
                    )}
                  />
                )}

                <PreguntaSiNo
                  label="¿Toma algún medicamento?"
                  value={form.tomaMedicamento}
                  onChange={(valor) =>
                    cambiar(
                      'tomaMedicamento',
                      valor
                    )
                  }
                  required
                  error={errorObligatorio(
                    'tomaMedicamento'
                  )}
                />

                {form.tomaMedicamento ===
                  'Sí' && (
                  <>
                    <Campo
                      label="¿Cuál medicamento?"
                      value={form.medicamentoCual}
                      onChange={(valor) =>
                        cambiar(
                          'medicamentoCual',
                          valor
                        )
                      }
                      required
                    error={errorObligatorio(
                      'medicamentoCual',
                      form.tomaMedicamento === 'Sí'
                    )}
                    />

                    <Campo
                      label="Horarios de los medicamentos"
                      value={form.horariosMedicamentos}
                      onChange={(valor) =>
                        cambiar(
                          'horariosMedicamentos',
                          valor
                        )
                      }
                      multiline
                      minRows={2}
                    />
                  </>
                )}

                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <Campo
                      label="EPS"
                      value={form.eps}
                      onChange={(valor) =>
                        cambiar(
                          'eps',
                          valor
                        )
                      }
                      required
                    error={errorObligatorio(
                      'eps'
                    )}
                    />
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <Campo
                      label="Profesión u ocupación"
                      value={form.profesionOcupacion}
                      onChange={(valor) =>
                        cambiar(
                          'profesionOcupacion',
                          valor
                        )
                      }
                      required
                    error={errorObligatorio(
                      'profesionOcupacion'
                    )}
                    />
                  </Grid>
                </Grid>

                <PreguntaSiNo
                  label="¿Tiene alguna limitación física?"
                  value={form.tieneLimitacionFisica}
                  onChange={(valor) =>
                    cambiar(
                      'tieneLimitacionFisica',
                      valor
                    )
                  }
                  required
                  error={errorObligatorio(
                    'tieneLimitacionFisica'
                  )}
                />

                {form.tieneLimitacionFisica ===
                  'Sí' && (
                  <Campo
                    label="¿Cuál limitación?"
                    value={form.limitacionCual}
                    onChange={(valor) =>
                      cambiar(
                        'limitacionCual',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'limitacionCual',
                      form.tieneLimitacionFisica === 'Sí'
                    )}
                  />
                )}
              </Stack>
            )}

            {paso === 2 && (
              <Stack spacing={3}>
                <FormControl
                  required
                  error={errorObligatorio(
                    'sacramentosRecibidos'
                  )}
                >
                  <FormLabel>
                    Sacramentos recibidos
                  </FormLabel>

                  <FormGroup>
                    {SACRAMENTOS.map(
                      (item) => (
                        <FormControlLabel
                          key={item}
                          control={
                            <Checkbox
                              checked={
                                form.sacramentosRecibidos.includes(
                                  item
                                )
                              }
                              onChange={() =>
                                cambiarSacramento(
                                  item
                                )
                              }
                            />
                          }
                          label={item}
                        />
                      )
                    )}
                  </FormGroup>

                  {errorObligatorio(
                    'sacramentosRecibidos'
                  ) && (
                    <FormHelperText>
                      Seleccione al menos una opción.
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl
                  required
                  error={errorObligatorio(
                    'tallaCamisa'
                  )}
                >
                  <FormLabel>
                    Talla de camisa tipo polo
                  </FormLabel>

                  <RadioGroup
                    row
                    value={form.tallaCamisa}
                    onChange={(event) =>
                      cambiar(
                        'tallaCamisa',
                        event.target.value
                      )
                    }
                  >
                    {TALLAS.map(
                      (item) => (
                        <FormControlLabel
                          key={item}
                          value={item}
                          control={<Radio />}
                          label={item}
                        />
                      )
                    )}
                  </RadioGroup>

                  {errorObligatorio(
                    'tallaCamisa'
                  ) && (
                    <FormHelperText>
                      Seleccione una talla.
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            )}

            {paso === 3 && (
              <Grid
                container
                spacing={2}
              >
                <Grid size={12}>
                  <Typography
                    fontWeight={900}
                  >
                    Contacto de emergencia 1
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Nombre"
                    value={form.contacto1Nombre}
                    onChange={(valor) =>
                      cambiar(
                        'contacto1Nombre',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'contacto1Nombre'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 3,
                  }}
                >
                  <Campo
                    label="Parentesco"
                    value={form.contacto1Parentesco}
                    onChange={(valor) =>
                      cambiar(
                        'contacto1Parentesco',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'contacto1Parentesco'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 3,
                  }}
                >
                  <Campo
                    label="Celular"
                    value={form.contacto1Celular}
                    onChange={(valor) =>
                      cambiar(
                        'contacto1Celular',
                        valor
                      )
                    }
                    required
                    error={errorCelular(
                      'contacto1Celular'
                    )}
                    helperText={ayudaCelular(
                      'contacto1Celular'
                    )}
                    inputProps={{
                      inputMode: 'numeric',
                      maxLength: 10,
                    }}
                  />
                </Grid>

                <Grid size={12}>
                  <Typography
                    fontWeight={900}
                    mt={1}
                  >
                    Contacto de emergencia 2
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Campo
                    label="Nombre"
                    value={form.contacto2Nombre}
                    onChange={(valor) =>
                      cambiar(
                        'contacto2Nombre',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'contacto2Nombre'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 3,
                  }}
                >
                  <Campo
                    label="Parentesco"
                    value={form.contacto2Parentesco}
                    onChange={(valor) =>
                      cambiar(
                        'contacto2Parentesco',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'contacto2Parentesco'
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 3,
                  }}
                >
                  <Campo
                    label="Celular"
                    value={form.contacto2Celular}
                    onChange={(valor) =>
                      cambiar(
                        'contacto2Celular',
                        valor
                      )
                    }
                    required
                    error={errorCelular(
                      'contacto2Celular'
                    )}
                    helperText={ayudaCelular(
                      'contacto2Celular'
                    )}
                    inputProps={{
                      inputMode: 'numeric',
                      maxLength: 10,
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {paso === 4 && (
              <Stack spacing={2.5}>
                <TextField
                  select
                  label="¿Cómo se enteró del retiro?"
                  value={form.comoSeEntero}
                  onChange={(event) =>
                    cambiar(
                      'comoSeEntero',
                      event.target.value
                    )
                  }
                  fullWidth
                  required
                  error={errorObligatorio(
                    'comoSeEntero'
                  )}
                  helperText={
                    errorObligatorio(
                      'comoSeEntero'
                    )
                      ? 'Este campo es obligatorio.'
                      : ''
                  }
                >
                  {COMO_SE_ENTERO.map(
                    (item) => (
                      <MenuItem
                        key={item}
                        value={item}
                      >
                        {item}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <Campo
                      label="Nombre completo de quien lo invitó"
                      value={form.nombrePersonaInvito}
                      onChange={(valor) =>
                        cambiar(
                          'nombrePersonaInvito',
                          valor
                        )
                      }
                    />
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <Campo
                      label="Celular de quien lo invitó"
                      value={form.celularPersonaInvito}
                      onChange={(valor) =>
                        cambiar(
                          'celularPersonaInvito',
                          valor
                        )
                      }
                      error={errorCelular(
                        'celularPersonaInvito',
                        false
                      )}
                      helperText={ayudaCelular(
                        'celularPersonaInvito',
                        false
                      )}
                      inputProps={{
                        inputMode: 'numeric',
                        maxLength: 10,
                      }}
                    />
                  </Grid>
                </Grid>

                <PreguntaSiNo
                  label="¿Alguna persona conocida asistirá al mismo retiro?"
                  value={form.personaConocidaAsistira}
                  onChange={(valor) =>
                    cambiar(
                      'personaConocidaAsistira',
                      valor
                    )
                  }
                  required
                  error={errorObligatorio(
                    'personaConocidaAsistira'
                  )}
                />

                {form.personaConocidaAsistira ===
                  'Sí' && (
                  <Campo
                    label="Nombre de la persona conocida"
                    value={form.nombrePersonaConocida}
                    onChange={(valor) =>
                      cambiar(
                        'nombrePersonaConocida',
                        valor
                      )
                    }
                    required
                    error={errorObligatorio(
                      'nombrePersonaConocida',
                      form.personaConocidaAsistira === 'Sí'
                    )}
                  />
                )}

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        fontWeight={900}
                      >
                        Protección de datos personales
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                      >
                        Antes de aceptar, puede consultar
                        el texto completo de la autorización.
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      onClick={() =>
                        setDialogoAutorizacion(
                          'datos'
                        )
                      }
                      sx={{
                        alignSelf: 'flex-start',
                      }}
                    >
                      Ver autorización completa
                    </Button>

                    <FormControl
                      required
                      error={
                        mostrarErrores &&
                        form.autorizaTratamientoDatos !==
                          'Sí'
                      }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              form.autorizaTratamientoDatos ===
                              'Sí'
                            }
                            onChange={(event) =>
                              cambiar(
                                'autorizaTratamientoDatos',
                                event.target.checked
                                  ? 'Sí'
                                  : 'No'
                              )
                            }
                          />
                        }
                        label={
                          portal.autorizacionDatosTextoAceptacion ||
                          'He leído y acepto la autorización para el tratamiento de mis datos personales.'
                        }
                      />

                      {mostrarErrores &&
                        form.autorizaTratamientoDatos !==
                          'Sí' && (
                          <FormHelperText>
                            Debe aceptar el tratamiento de datos
                            personales para enviar el registro.
                          </FormHelperText>
                        )}
                    </FormControl>

                    <Alert severity="info">
                      Sin esta autorización no es posible
                      registrar al aspirante, porque los datos
                      son necesarios para gestionar la
                      inscripción y la participación en el retiro.
                    </Alert>
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        fontWeight={900}
                      >
                        Fotografías y material audiovisual
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                      >
                        Esta autorización es independiente y
                        opcional. Rechazarla no impide el registro.
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      onClick={() =>
                        setDialogoAutorizacion(
                          'fotos'
                        )
                      }
                      sx={{
                        alignSelf: 'flex-start',
                      }}
                    >
                      Ver autorización de fotografías
                    </Button>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            form.autorizaFotografias ===
                            'Sí'
                          }
                          onChange={(event) =>
                            cambiar(
                              'autorizaFotografias',
                              event.target.checked
                                ? 'Sí'
                                : 'No'
                            )
                          }
                        />
                      }
                      label={
                        portal.autorizacionFotosTextoAceptacion ||
                        'Autorizo el uso de fotografías y material audiovisual conforme al texto informado.'
                      }
                    />
                  </Stack>
                </Paper>
              </Stack>
            )}

            <Stack
              direction="row"
              justifyContent="space-between"
              gap={1}
              mt={4}
            >
              <Button
                startIcon={
                  <ArrowBackRounded />
                }
                disabled={paso === 0}
                onClick={() => {
                  setError('');
                  setMostrarErrores(false);
                  setPaso((actual) =>
                    Math.max(
                      0,
                      actual - 1
                    )
                  );
                }}
              >
                Atrás
              </Button>

              {paso <
              PASOS.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={
                    <ArrowForwardRounded />
                  }
                  onClick={siguiente}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  disabled={enviando}
                  onClick={enviar}
                  startIcon={
                    enviando
                      ? (
                        <CircularProgress
                          size={18}
                          color="inherit"
                        />
                      )
                      : (
                        <CheckCircleRounded />
                      )
                  }
                >
                  {enviando
                    ? 'Enviando...'
                    : 'Enviar registro'}
                </Button>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <Dialog
        open={dialogoAutorizacion === 'datos'}
        onClose={() =>
          setDialogoAutorizacion(null)
        }
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle>
          {portal.autorizacionDatosTitulo ||
            'Autorización para el tratamiento de datos personales'}
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              '& p': {
                lineHeight: 1.7,
              },
              '& li': {
                mb: 1,
              },
            }}
            dangerouslySetInnerHTML={{
              __html:
                portal.autorizacionDatosTextoHtml ||
                '<p>El texto de la autorización no ha sido configurado. Comuníquese con el responsable del retiro.</p>',
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={3}
          >
            Versión:{' '}
            {portal.autorizacionDatosVersion ||
              'Sin definir'}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDialogoAutorizacion(null)
            }
          >
            Cerrar
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              cambiar(
                'autorizaTratamientoDatos',
                'Sí'
              );
              setDialogoAutorizacion(null);
            }}
          >
            He leído y acepto
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogoAutorizacion === 'fotos'}
        onClose={() =>
          setDialogoAutorizacion(null)
        }
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle>
          {portal.autorizacionFotosTitulo ||
            'Autorización de fotografías y material audiovisual'}
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              '& p': {
                lineHeight: 1.7,
              },
              '& li': {
                mb: 1,
              },
            }}
            dangerouslySetInnerHTML={{
              __html:
                portal.autorizacionFotosTextoHtml ||
                '<p>El texto de la autorización no ha sido configurado.</p>',
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={3}
          >
            Versión:{' '}
            {portal.autorizacionFotosVersion ||
              'Sin definir'}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDialogoAutorizacion(null)
            }
          >
            Cerrar
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              cambiar(
                'autorizaFotografias',
                'Sí'
              );
              setDialogoAutorizacion(null);
            }}
          >
            Autorizar fotografías
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
