import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
  MenuItem,
  TextField,
  CircularProgress,} from '@mui/material';

import {
  BedRounded,
  MailRounded,
  PaymentsRounded,
  PhotoRounded,
  PhoneInTalkRounded,
  GroupsRounded,
  TableRestaurantRounded,
} from '@mui/icons-material';

import {
  actualizarCartaCaminanteApi,
  actualizarFotoCaminanteApi,
  actualizarLlamadaCaminanteApi,
  actualizarLlamadaContactosCaminanteApi,
} from '../../api/caminantesApi';

import StatusChip from '../StatusChip';
import EstadoCuentaPersona from '../pagos/EstadoCuentaPersona';

const ESTADOS_ENTREGABLES_MESA = [
  'Pendiente',
  'Solicitada',
  'Entregada',
  'Empaquetada',
  'Entregada a Logística',
];

const ESTADOS_LLAMADAS_MESA = [
  'Pendiente',
  'En Proceso',
  'Realizado',
];


function estiloEstadoEntregable(estado) {
  const colores = {
    "Pendiente": "#d32f2f",
    "Solicitada": "#b23a48",
    "Entregada": "#1976d2",
    "Empaquetada": "#168c91",
    "Entregada a Logística": "#2e7d32",
  };

  const color = colores[estado] || "#6b7280";

  return {
    variant: "outlined",
    sx: {
      color,
      borderColor: color,
      bgcolor: "transparent",
      fontWeight: 700,
      "& .MuiChip-icon": {
        color,
      },
    },
  };
}

function colorEstadoLlamadaMesa(estado) {
  if (estado === 'Realizado') return 'success';
  if (estado === 'En Proceso') return 'info';
  return 'warning';
}

function tieneValor(valor) {
  return !(
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ''
  );
}

function formatearFechaDetalle(valor) {
  if (!tieneValor(valor)) return '';

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

function CampoDetalle({
  etiqueta,
  valor,
  anchoCompleto = false,
}) {
  if (!tieneValor(valor)) return null;

  return (
    <Grid size={{ xs: 12, sm: anchoCompleto ? 12 : 6 }}>
      <Typography variant="caption" color="text.secondary">
        {etiqueta}
      </Typography>

      <Typography
        fontWeight={700}
        sx={{ whiteSpace: 'pre-wrap' }}
      >
        {String(valor)}
      </Typography>
    </Grid>
  );
}

function SeccionDetalle({ titulo, children }) {
  const elementos = Array.isArray(children)
    ? children.filter(Boolean)
    : children;

  if (
    Array.isArray(elementos) &&
    elementos.length === 0
  ) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="subtitle1"
          fontWeight={850}
          sx={{ mb: 1.75 }}
        >
          {titulo}
        </Typography>

        <Grid container spacing={2}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function CaminanteDetalleDialog({
  open,
  caminante,
  token,
  onClose,
  tienePermiso,
  onUpdated,
}) {
  const [caminanteLocal, setCaminanteLocal] = useState(caminante);
  const [guardandoSeguimiento, setGuardandoSeguimiento] = useState('');
  const [errorSeguimiento, setErrorSeguimiento] = useState('');

  useEffect(() => {
    setCaminanteLocal(caminante);
  }, [caminante]);

  const actual = caminanteLocal || caminante;

  function puede(permiso) {
    return typeof tienePermiso === 'function' && tienePermiso(permiso);
  }

  async function actualizarSeguimiento(tipo, estado) {
    if (!actual?.id) return;

    setGuardandoSeguimiento(tipo);
    setErrorSeguimiento('');

    try {
      let resultado;

      if (tipo === 'carta') {
        resultado = await actualizarCartaCaminanteApi(token, actual.id, estado);
      } else if (tipo === 'foto') {
        resultado = await actualizarFotoCaminanteApi(token, actual.id, estado);
      } else if (tipo === 'llamadaCaminante') {
        resultado = await actualizarLlamadaCaminanteApi(token, actual.id, estado);
      } else if (tipo === 'llamadaContactos') {
        resultado = await actualizarLlamadaContactosCaminanteApi(token, actual.id, estado);
      }

      const caminanteActualizado = resultado?.caminante || resultado;

      if (caminanteActualizado?.id) {
        setCaminanteLocal(caminanteActualizado);
      } else {
        setCaminanteLocal((previo) => {
          const base = previo || actual || {};
          if (tipo === 'carta' || tipo === 'foto') {
            return {
              ...base,
              entregables: {
                ...(base.entregables || {}),
                [tipo]: estado,
              },
            };
          }

          return {
            ...base,
            seguimiento: {
              ...(base.seguimiento || {}),
              [tipo]: estado,
            },
          };
        });
      }

      if (typeof onUpdated === 'function') {
        await onUpdated();
      }
    } catch (error) {
      setErrorSeguimiento(
        error?.message ||
        'No fue posible actualizar el seguimiento.'
      );
    } finally {
      setGuardandoSeguimiento('');
    }
  }

  return (
    <Dialog
      open={Boolean(open && caminante)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={1.5}
        >
          <Box>
            <Typography variant="h5" fontWeight={900}>
              {actual?.nombre || 'Detalle del caminante'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Información completa de la inscripción
            </Typography>
          </Box>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <StatusChip value={actual?.estadoPago || 'Pendiente'} />

            <Chip
              size="small"
              icon={<TableRestaurantRounded />}
              label={
                actual?.mesa
                  ? `Mesa ${actual.mesa}`
                  : 'Sin mesa'
              }
              variant="outlined"
            />

            <Chip
              size="small"
              icon={<BedRounded />}
              label={
                actual?.habitacion
                  ? `Hab. ${actual.habitacion}`
                  : 'Sin habitación'
              }
              variant="outlined"
            />
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.25}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <PaymentsRounded color="primary" />

                <Box>
                  <Typography variant="subtitle1" fontWeight={850}>
                    Estado de cuenta
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Abonos, comprobantes y trazabilidad financiera.
                  </Typography>
                </Box>
              </Stack>

              <EstadoCuentaPersona
                token={token}
                tipoPersona="Caminante"
                personaId={actual?.id}
              />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={850}>
                    Seguimiento y comunicaciones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Puedes reportar los avances directamente desde la mesa sin salir de este caminante.
                  </Typography>
                </Box>

                {errorSeguimiento && (
                  <Alert severity="error">
                    {errorSeguimiento}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  {[
                    {
                      tipo: 'carta',
                      titulo: 'Carta',
                      valor: actual?.entregables?.carta || 'Pendiente',
                      permiso: 'CAMINANTES_REPORTAR_CARTA',
                      opciones: ESTADOS_ENTREGABLES_MESA.filter(
                        (estado) =>
                          estado !== 'Entregada a Logística' ||
                          puede('CAMINANTES_APROBAR_ENTREGA_LOGISTICA')
                      ),
                      icono: <MailRounded fontSize="small" />,
                    },
                    {
                      tipo: 'foto',
                      titulo: 'Foto',
                      valor: actual?.entregables?.foto || 'Pendiente',
                      permiso: 'CAMINANTES_REPORTAR_FOTO',
                      opciones: ESTADOS_ENTREGABLES_MESA.filter(
                        (estado) =>
                          estado !== 'Entregada a Logística' ||
                          puede('CAMINANTES_APROBAR_ENTREGA_LOGISTICA')
                      ),
                      icono: <PhotoRounded fontSize="small" />,
                    },
                    {
                      tipo: 'llamadaCaminante',
                      titulo: 'Llamada al caminante',
                      valor: actual?.seguimiento?.llamadaCaminante || 'Pendiente',
                      permiso: 'CAMINANTES_REPORTAR_LLAMADA_CAMINANTE',
                      opciones: ESTADOS_LLAMADAS_MESA,
                      icono: <PhoneInTalkRounded fontSize="small" />,
                    },
                    {
                      tipo: 'llamadaContactos',
                      titulo: 'Llamada a contactos',
                      valor: actual?.seguimiento?.llamadaContactos || 'Pendiente',
                      permiso: 'CAMINANTES_REPORTAR_LLAMADA_CONTACTOS',
                      opciones: ESTADOS_LLAMADAS_MESA,
                      icono: <GroupsRounded fontSize="small" />,
                    },
                  ].map((item) => (
                    <Grid key={item.tipo} size={{ xs: 12, sm: 6 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack spacing={1.25}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              gap={1}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                {item.icono}
                                <Typography fontWeight={800}>
                                  {item.titulo}
                                </Typography>
                              </Stack>

                              {item.tipo.startsWith('llamada') ? (
                                <Chip
                                  size="small"
                                  label={item.valor}
                                  color={colorEstadoLlamadaMesa(item.valor)}
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label={item.valor}
                                  variant="outlined"
                        sx={estiloEstadoEntregable(item.valor).sx}
                                />
                              )}
                            </Stack>

                            {puede(item.permiso) && (
                              <TextField
                                select
                                fullWidth
                                size="small"
                                label="Reportar estado"
                                value={item.valor}
                                disabled={Boolean(guardandoSeguimiento)}
                                onChange={(event) =>
                                  actualizarSeguimiento(
                                    item.tipo,
                                    event.target.value
                                  )
                                }
                              >
                                {item.opciones.map((estado) => (
                                  <MenuItem key={estado} value={estado}>
                                    {estado}
                                  </MenuItem>
                                ))}
                              </TextField>
                            )}

                            {guardandoSeguimiento === item.tipo && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CircularProgress size={16} />
                                <Typography variant="caption" color="text.secondary">
                                  Guardando...
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <SeccionDetalle titulo="Información personal">
            <CampoDetalle
              etiqueta="Número de inscripción"
              valor={actual?.numeroInscripcion}
            />

            <CampoDetalle
              etiqueta="Documento de identidad"
              valor={
                actual?.documentoIdentidad ||
                actual?.documento ||
                actual?.numeroDocumento
              }
            />

            <CampoDetalle
              etiqueta="Fecha de nacimiento"
              valor={formatearFechaDetalle(actual?.fechaNacimiento)}
            />

            <CampoDetalle
              etiqueta="Edad"
              valor={actual?.edad}
            />

            <CampoDetalle
              etiqueta="Estado civil"
              valor={actual?.estadoCivil}
            />

            <CampoDetalle
              etiqueta="Profesión u ocupación"
              valor={
                actual?.profesionOcupacion ||
                actual?.profesion ||
                actual?.ocupacion
              }
            />

            <CampoDetalle
              etiqueta="Talla de camiseta"
              valor={
                actual?.tallaCamiseta ||
                actual?.tallaCamisa ||
                actual?.talla
              }
            />

            <CampoDetalle
              etiqueta="Parroquia"
              valor={
                actual?.parroquia ||
                actual?.iglesia
              }
            />
          </SeccionDetalle>

          <SeccionDetalle titulo="Ubicación y contacto">
            <CampoDetalle
              etiqueta="Celular"
              valor={
                actual?.telefono ||
                actual?.celular
              }
            />

            <CampoDetalle
              etiqueta="Teléfono fijo"
              valor={actual?.telefonoFijo}
            />

            <CampoDetalle
              etiqueta="Correo electrónico"
              valor={actual?.correo}
            />

            <CampoDetalle
              etiqueta="Dirección de residencia"
              valor={
                actual?.direccionResidencia ||
                actual?.direccion
              }
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Barrio"
              valor={actual?.barrio}
            />

            <CampoDetalle
              etiqueta="Ciudad o municipio"
              valor={
                actual?.ciudad ||
                actual?.municipio
              }
            />
          </SeccionDetalle>

          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight={850}
                sx={{ mb: 1.75 }}
              >
                Información del retiro
              </Typography>

              <Stack spacing={2}>
                <Stack
                  direction="row"
                  gap={1}
                  flexWrap="wrap"
                >
                  <StatusChip value={actual?.estadoPago || 'Pendiente'} />

                  <Chip
                    icon={<TableRestaurantRounded />}
                    label={
                      actual?.mesa
                        ? `Mesa ${actual.mesa}`
                        : 'Sin mesa asignada'
                    }
                    variant="outlined"
                  />

                  <Chip
                    icon={<BedRounded />}
                    label={
                      actual?.habitacion
                        ? `Habitación ${actual.habitacion}`
                        : 'Sin habitación asignada'
                    }
                    variant="outlined"
                  />
                </Stack>

                <Divider />

                <Grid container spacing={2}>
                  <CampoDetalle
                    etiqueta="Sacramentos recibidos"
                    valor={actual?.sacramentosRecibidos}
                    anchoCompleto
                  />

                  <CampoDetalle
                    etiqueta="Cómo se enteró del retiro"
                    valor={actual?.comoSeEntero}
                  />

                  <CampoDetalle
                    etiqueta="Persona que lo invitó"
                    valor={
                      actual?.nombrePersonaInvito ||
                      actual?.personaInvito ||
                      actual?.invitadoPor
                    }
                  />

                  <CampoDetalle
                    etiqueta="Celular de quien lo invitó"
                    valor={actual?.celularPersonaInvito}
                  />

                  <CampoDetalle
                    etiqueta="Asistirá una persona conocida"
                    valor={actual?.personaConocidaAsistira}
                  />

                  <CampoDetalle
                    etiqueta="Persona conocida"
                    valor={actual?.nombrePersonaConocida}
                  />

                  <CampoDetalle
                    etiqueta="Autoriza tratamiento de datos"
                    valor={actual?.autorizaTratamientoDatos}
                  />

                  <CampoDetalle
                    etiqueta="Autoriza fotografías"
                    valor={actual?.autorizaFotografias}
                  />
                </Grid>

                <Divider />

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip
                    icon={<MailRounded />}
                    label={`Carta: ${actual?.entregables?.carta || 'Pendiente'}`}
                  />

                  <Chip
                    icon={<PhotoRounded />}
                    label={`Foto: ${actual?.entregables?.foto || 'Pendiente'}`}
                  />
                </Stack>

                {actual?.entregables?.aprobacionCartaLogistica?.aprobadoPor && (
                  <Alert severity="success">
                    Carta aprobada por Logística por{' '}
                    {actual.entregables.aprobacionCartaLogistica.aprobadoPor}
                    {actual.entregables.aprobacionCartaLogistica.fecha
                      ? ` el ${formatearFechaDetalle(
                          actual.entregables.aprobacionCartaLogistica.fecha
                        )}`
                      : ''}
                    .
                  </Alert>
                )}

                {actual?.entregables?.aprobacionFotoLogistica?.aprobadoPor && (
                  <Alert severity="success">
                    Fotografía aprobada por Logística por{' '}
                    {actual.entregables.aprobacionFotoLogistica.aprobadoPor}
                    {actual.entregables.aprobacionFotoLogistica.fecha
                      ? ` el ${formatearFechaDetalle(
                          actual.entregables.aprobacionFotoLogistica.fecha
                        )}`
                      : ''}
                    .
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          <SeccionDetalle titulo="Información de salud">
            <CampoDetalle
              etiqueta="EPS"
              valor={
                actual?.eps ||
                actual?.nombreEps
              }
            />

            <CampoDetalle
              etiqueta="Sufre alguna enfermedad"
              valor={actual?.sufreEnfermedad}
            />

            <CampoDetalle
              etiqueta="Enfermedad o condición"
              valor={
                actual?.enfermedadCual ||
                actual?.condicionMedica
              }
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Toma medicamentos"
              valor={actual?.tomaMedicamento}
            />

            <CampoDetalle
              etiqueta="Medicamento"
              valor={
                actual?.medicamentoCual ||
                actual?.medicamentos
              }
            />

            <CampoDetalle
              etiqueta="Horario de medicamentos"
              valor={actual?.horariosMedicamentos}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Tiene limitación física"
              valor={actual?.tieneLimitacionFisica}
            />

            <CampoDetalle
              etiqueta="Limitación física"
              valor={actual?.limitacionCual}
            />

            <CampoDetalle
              etiqueta="Tiene condición alimentaria"
              valor={actual?.tieneCondicionAlimentaria}
            />

            <CampoDetalle
              etiqueta="Alergias alimentarias"
              valor={
                actual?.alergiasAlimentarias ||
                actual?.alergias
              }
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Restricciones alimentarias"
              valor={actual?.restriccionesAlimentarias}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Preferencias alimentarias"
              valor={actual?.preferenciasAlimentarias}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Dieta especial o indicaciones"
              valor={actual?.dietaEspecial}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Tipo de sangre"
              valor={actual?.tipoSangre}
            />
          </SeccionDetalle>

          <SeccionDetalle titulo="Contactos de emergencia">
            <CampoDetalle
              etiqueta="Contacto principal"
              valor={actual?.contacto?.nombre}
            />

            <CampoDetalle
              etiqueta="Parentesco"
              valor={actual?.contacto?.parentesco}
            />

            <CampoDetalle
              etiqueta="Celular principal"
              valor={actual?.contacto?.telefono}
            />

            <CampoDetalle
              etiqueta="Contacto alterno"
              valor={actual?.contactoAlterno?.nombre}
            />

            <CampoDetalle
              etiqueta="Parentesco del contacto alterno"
              valor={actual?.contactoAlterno?.parentesco}
            />

            <CampoDetalle
              etiqueta="Celular alterno"
              valor={actual?.contactoAlterno?.telefono}
            />
          </SeccionDetalle>

          {(tieneValor(actual?.observaciones) ||
            tieneValor(actual?.observacionesGestion)) && (
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle1"
                  fontWeight={850}
                  sx={{ mb: 1.25 }}
                >
                  Observaciones
                </Typography>

                {tieneValor(actual?.observaciones) && (
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                    {actual.observaciones}
                  </Typography>
                )}

                {tieneValor(actual?.observacionesGestion) && (
                  <Typography
                    sx={{
                      whiteSpace: 'pre-wrap',
                      mt: tieneValor(actual?.observaciones)
                        ? 1.5
                        : 0,
                    }}
                  >
                    {actual.observacionesGestion}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
