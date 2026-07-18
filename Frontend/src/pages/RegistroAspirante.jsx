import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
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
import CelularField from '../components/CelularField';
import {
  esCelularColombiaValido,
} from '../utils/celularUtils';

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
  nombreCompleto: '',
  documentoIdentidad: '',
  direccionResidencia: '',
  fechaNacimiento: '',
  edad: '',
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
};

function Campo({
  label,
  value,
  onChange,
  required = false,
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
}) {
  return (
    <FormControl required={required}>
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

  const [resultado, setResultado] =
    useState(null);

  const portal =
    portalApi.data || {};

  function cambiar(
    campo,
    valor
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function cambiarSacramento(
    sacramento
  ) {
    setForm((actual) => {
      const actuales =
        actual.sacramentosRecibidos;

      const nuevos =
        actuales.includes(
          sacramento
        )
          ? actuales.filter(
              (item) =>
                item !==
                sacramento
            )
          : [
              ...actuales,
              sacramento,
            ];

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
        return Boolean(
          form.nombreCompleto &&
          form.documentoIdentidad &&
          form.direccionResidencia &&
          form.fechaNacimiento &&
          form.edad &&
          form.barrio &&
          esCelularColombiaValido(
            form.celular,
            {
              requerido: true,
              etiqueta: 'El celular',
            }
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
          esCelularColombiaValido(
            form.contacto1Celular,
            {
              requerido: true,
              etiqueta:
                'El celular del contacto 1',
            }
          ) &&
          form.contacto2Nombre &&
          esCelularColombiaValido(
            form.contacto2Celular,
            {
              requerido: true,
              etiqueta:
                'El celular del contacto 2',
            }
          )
        );
      }

      return Boolean(
        form.comoSeEntero &&
        form.personaConocidaAsistira &&
        form.autorizaTratamientoDatos ===
          'Sí'
      );
    }, [
      paso,
      form,
    ]);

  function siguiente() {
    if (!validacionPaso) {
      setError(
        'Completa los campos obligatorios antes de continuar.'
      );
      return;
    }

    setError('');
    setPaso((actual) =>
      Math.min(
        PASOS.length - 1,
        actual + 1
      )
    );
  }

  async function enviar() {
    if (!validacionPaso) {
      setError(
        'Completa los campos obligatorios y acepta el tratamiento de datos.'
      );
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const datos =
        await registrarAspirantePublico(
          form
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

          <Button
            variant="contained"
            onClick={() =>
              navigate('/')
            }
            sx={{
              mt: 3,
            }}
          >
            Volver al inicio
          </Button>
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
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 4,
                  }}
                >
                  <Campo
                    label="Edad"
                    type="number"
                    value={form.edad}
                    onChange={(valor) =>
                      cambiar(
                        'edad',
                        valor
                      )
                    }
                    required
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
                  <CelularField
                    label="Celular"
                    value={form.celular}
                    onChange={(valor) =>
                      cambiar(
                        'celular',
                        valor
                      )
                    }
                    required
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
                  />
                )}
              </Stack>
            )}

            {paso === 2 && (
              <Stack spacing={3}>
                <FormControl required>
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
                </FormControl>

                <FormControl required>
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
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 3,
                  }}
                >
                  <CelularField
                    label="Celular del contacto 1"
                    value={form.contacto1Celular}
                    onChange={(valor) =>
                      cambiar(
                        'contacto1Celular',
                        valor
                      )
                    }
                    required
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
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 3,
                  }}
                >
                  <CelularField
                    label="Celular del contacto 2"
                    value={form.contacto2Celular}
                    onChange={(valor) =>
                      cambiar(
                        'contacto2Celular',
                        valor
                      )
                    }
                    required
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
                    <CelularField
                      label="Celular de quien lo invitó"
                      value={form.celularPersonaInvito}
                      onChange={(valor) =>
                        cambiar(
                          'celularPersonaInvito',
                          valor
                        )
                      }
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
                  />
                )}

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                  }}
                >
                  <PreguntaSiNo
                    label="¿Autoriza el tratamiento de sus datos personales y la toma de fotografías para fines relacionados únicamente con el retiro?"
                    value={form.autorizaTratamientoDatos}
                    onChange={(valor) =>
                      cambiar(
                        'autorizaTratamientoDatos',
                        valor
                      )
                    }
                    required
                  />
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
    </Box>
  );
}
