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
} from '@mui/material';

import {
  BedRounded,
  MailRounded,
  PaymentsRounded,
  PhotoRounded,
  TableRestaurantRounded,
} from '@mui/icons-material';

import StatusChip from '../StatusChip';
import EstadoCuentaPersona from '../pagos/EstadoCuentaPersona';

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
}) {
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
              {caminante?.nombre || 'Detalle del caminante'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Información completa de la inscripción
            </Typography>
          </Box>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <StatusChip value={caminante?.estadoPago || 'Pendiente'} />

            <Chip
              size="small"
              icon={<TableRestaurantRounded />}
              label={
                caminante?.mesa
                  ? `Mesa ${caminante.mesa}`
                  : 'Sin mesa'
              }
              variant="outlined"
            />

            <Chip
              size="small"
              icon={<BedRounded />}
              label={
                caminante?.habitacion
                  ? `Hab. ${caminante.habitacion}`
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
                personaId={caminante?.id}
              />
            </CardContent>
          </Card>

          <SeccionDetalle titulo="Información personal">
            <CampoDetalle
              etiqueta="Número de inscripción"
              valor={caminante?.numeroInscripcion}
            />

            <CampoDetalle
              etiqueta="Documento de identidad"
              valor={
                caminante?.documentoIdentidad ||
                caminante?.documento ||
                caminante?.numeroDocumento
              }
            />

            <CampoDetalle
              etiqueta="Fecha de nacimiento"
              valor={formatearFechaDetalle(caminante?.fechaNacimiento)}
            />

            <CampoDetalle
              etiqueta="Edad"
              valor={caminante?.edad}
            />

            <CampoDetalle
              etiqueta="Estado civil"
              valor={caminante?.estadoCivil}
            />

            <CampoDetalle
              etiqueta="Profesión u ocupación"
              valor={
                caminante?.profesionOcupacion ||
                caminante?.profesion ||
                caminante?.ocupacion
              }
            />

            <CampoDetalle
              etiqueta="Talla de camiseta"
              valor={
                caminante?.tallaCamiseta ||
                caminante?.tallaCamisa ||
                caminante?.talla
              }
            />

            <CampoDetalle
              etiqueta="Parroquia"
              valor={
                caminante?.parroquia ||
                caminante?.iglesia
              }
            />
          </SeccionDetalle>

          <SeccionDetalle titulo="Ubicación y contacto">
            <CampoDetalle
              etiqueta="Celular"
              valor={
                caminante?.telefono ||
                caminante?.celular
              }
            />

            <CampoDetalle
              etiqueta="Teléfono fijo"
              valor={caminante?.telefonoFijo}
            />

            <CampoDetalle
              etiqueta="Correo electrónico"
              valor={caminante?.correo}
            />

            <CampoDetalle
              etiqueta="Dirección de residencia"
              valor={
                caminante?.direccionResidencia ||
                caminante?.direccion
              }
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Barrio"
              valor={caminante?.barrio}
            />

            <CampoDetalle
              etiqueta="Ciudad o municipio"
              valor={
                caminante?.ciudad ||
                caminante?.municipio
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
                  <StatusChip value={caminante?.estadoPago || 'Pendiente'} />

                  <Chip
                    icon={<TableRestaurantRounded />}
                    label={
                      caminante?.mesa
                        ? `Mesa ${caminante.mesa}`
                        : 'Sin mesa asignada'
                    }
                    variant="outlined"
                  />

                  <Chip
                    icon={<BedRounded />}
                    label={
                      caminante?.habitacion
                        ? `Habitación ${caminante.habitacion}`
                        : 'Sin habitación asignada'
                    }
                    variant="outlined"
                  />
                </Stack>

                <Divider />

                <Grid container spacing={2}>
                  <CampoDetalle
                    etiqueta="Sacramentos recibidos"
                    valor={caminante?.sacramentosRecibidos}
                    anchoCompleto
                  />

                  <CampoDetalle
                    etiqueta="Cómo se enteró del retiro"
                    valor={caminante?.comoSeEntero}
                  />

                  <CampoDetalle
                    etiqueta="Persona que lo invitó"
                    valor={
                      caminante?.nombrePersonaInvito ||
                      caminante?.personaInvito ||
                      caminante?.invitadoPor
                    }
                  />

                  <CampoDetalle
                    etiqueta="Celular de quien lo invitó"
                    valor={caminante?.celularPersonaInvito}
                  />

                  <CampoDetalle
                    etiqueta="Asistirá una persona conocida"
                    valor={caminante?.personaConocidaAsistira}
                  />

                  <CampoDetalle
                    etiqueta="Persona conocida"
                    valor={caminante?.nombrePersonaConocida}
                  />

                  <CampoDetalle
                    etiqueta="Autoriza tratamiento de datos"
                    valor={caminante?.autorizaTratamientoDatos}
                  />

                  <CampoDetalle
                    etiqueta="Autoriza fotografías"
                    valor={caminante?.autorizaFotografias}
                  />
                </Grid>

                <Divider />

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip
                    icon={<MailRounded />}
                    label={`Carta: ${caminante?.entregables?.carta || 'Pendiente'}`}
                  />

                  <Chip
                    icon={<PhotoRounded />}
                    label={`Foto: ${caminante?.entregables?.foto || 'Pendiente'}`}
                  />
                </Stack>

                {caminante?.entregables?.aprobacionCartaLogistica?.aprobadoPor && (
                  <Alert severity="success">
                    Carta aprobada por Logística por{' '}
                    {caminante.entregables.aprobacionCartaLogistica.aprobadoPor}
                    {caminante.entregables.aprobacionCartaLogistica.fecha
                      ? ` el ${formatearFechaDetalle(
                          caminante.entregables.aprobacionCartaLogistica.fecha
                        )}`
                      : ''}
                    .
                  </Alert>
                )}

                {caminante?.entregables?.aprobacionFotoLogistica?.aprobadoPor && (
                  <Alert severity="success">
                    Fotografía aprobada por Logística por{' '}
                    {caminante.entregables.aprobacionFotoLogistica.aprobadoPor}
                    {caminante.entregables.aprobacionFotoLogistica.fecha
                      ? ` el ${formatearFechaDetalle(
                          caminante.entregables.aprobacionFotoLogistica.fecha
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
                caminante?.eps ||
                caminante?.nombreEps
              }
            />

            <CampoDetalle
              etiqueta="Sufre alguna enfermedad"
              valor={caminante?.sufreEnfermedad}
            />

            <CampoDetalle
              etiqueta="Enfermedad o condición"
              valor={
                caminante?.enfermedadCual ||
                caminante?.condicionMedica
              }
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Toma medicamentos"
              valor={caminante?.tomaMedicamento}
            />

            <CampoDetalle
              etiqueta="Medicamento"
              valor={
                caminante?.medicamentoCual ||
                caminante?.medicamentos
              }
            />

            <CampoDetalle
              etiqueta="Horario de medicamentos"
              valor={caminante?.horariosMedicamentos}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Tiene limitación física"
              valor={caminante?.tieneLimitacionFisica}
            />

            <CampoDetalle
              etiqueta="Limitación física"
              valor={caminante?.limitacionCual}
            />

            <CampoDetalle
              etiqueta="Tiene condición alimentaria"
              valor={caminante?.tieneCondicionAlimentaria}
            />

            <CampoDetalle
              etiqueta="Alergias alimentarias"
              valor={
                caminante?.alergiasAlimentarias ||
                caminante?.alergias
              }
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Restricciones alimentarias"
              valor={caminante?.restriccionesAlimentarias}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Preferencias alimentarias"
              valor={caminante?.preferenciasAlimentarias}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Dieta especial o indicaciones"
              valor={caminante?.dietaEspecial}
              anchoCompleto
            />

            <CampoDetalle
              etiqueta="Tipo de sangre"
              valor={caminante?.tipoSangre}
            />
          </SeccionDetalle>

          <SeccionDetalle titulo="Contactos de emergencia">
            <CampoDetalle
              etiqueta="Contacto principal"
              valor={caminante?.contacto?.nombre}
            />

            <CampoDetalle
              etiqueta="Parentesco"
              valor={caminante?.contacto?.parentesco}
            />

            <CampoDetalle
              etiqueta="Celular principal"
              valor={caminante?.contacto?.telefono}
            />

            <CampoDetalle
              etiqueta="Contacto alterno"
              valor={caminante?.contactoAlterno?.nombre}
            />

            <CampoDetalle
              etiqueta="Parentesco del contacto alterno"
              valor={caminante?.contactoAlterno?.parentesco}
            />

            <CampoDetalle
              etiqueta="Celular alterno"
              valor={caminante?.contactoAlterno?.telefono}
            />
          </SeccionDetalle>

          {(tieneValor(caminante?.observaciones) ||
            tieneValor(caminante?.observacionesGestion)) && (
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle1"
                  fontWeight={850}
                  sx={{ mb: 1.25 }}
                >
                  Observaciones
                </Typography>

                {tieneValor(caminante?.observaciones) && (
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                    {caminante.observaciones}
                  </Typography>
                )}

                {tieneValor(caminante?.observacionesGestion) && (
                  <Typography
                    sx={{
                      whiteSpace: 'pre-wrap',
                      mt: tieneValor(caminante?.observaciones)
                        ? 1.5
                        : 0,
                    }}
                  >
                    {caminante.observacionesGestion}
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
