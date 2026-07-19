import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  BedRounded,
  EditRounded,
  MailRounded,
  PaymentsRounded,
  PhotoRounded,
  SearchRounded,
  TableRestaurantRounded,
} from "@mui/icons-material";

import { useMemo, useState } from "react";

import {
  asignarHabitacionCaminanteApi,
  asignarMesaCaminanteApi,
  actualizarCartaCaminanteApi,
  actualizarFotoCaminanteApi,
  actualizarPagoCaminanteApi,
  editarCaminanteApi,
  obtenerCaminantes,
  obtenerOpcionesRegistroCaminante,
  registrarCaminanteApi,
} from "../api/caminantesApi";

import { useApi } from "../hooks/useApi";
import { useAuth } from "../auth/AuthContext";

import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import ProtectedButton from "../components/ProtectedButton";

import CaminanteFormDialog from "../components/caminantes/CaminanteFormDialog";
import CaminanteActionDialog from "../components/caminantes/CaminanteActionDialog";

const ESTADOS_PAGO = ["Pendiente", "Pago Parcial", "Pago Total"];

const ESTADOS_ENTREGABLES = ["Pendiente", "En Proceso", "Completado"];

function normalizar(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tieneValor(valor) {
  return !(
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  );
}

function formatearFechaDetalle(valor) {
  if (!tieneValor(valor)) return "";

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function CampoDetalle({ etiqueta, valor, anchoCompleto = false }) {
  if (!tieneValor(valor)) return null;

  return (
    <Grid size={{ xs: 12, sm: anchoCompleto ? 12 : 6 }}>
      <Typography variant="caption" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography fontWeight={700} sx={{ whiteSpace: "pre-wrap" }}>
        {String(valor)}
      </Typography>
    </Grid>
  );
}

function SeccionDetalle({ titulo, children }) {
  const elementos = Array.isArray(children)
    ? children.filter(Boolean)
    : children;

  if (Array.isArray(elementos) && elementos.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 1.75 }}>
          {titulo}
        </Typography>
        <Grid container spacing={2}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function Caminantes() {
  const api = useApi(() => obtenerCaminantes(), []);

  const { token, autenticado, loading: authLoading, tienePermiso } = useAuth();

  const [busqueda, setBusqueda] = useState("");

  const [filtroPago, setFiltroPago] = useState("");

  const [opciones, setOpciones] = useState(null);

  const [cargandoOpciones, setCargandoOpciones] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [formOpen, setFormOpen] = useState(false);

  const [modoForm, setModoForm] = useState("crear");

  const [selected, setSelected] = useState(null);

  const [actionDialog, setActionDialog] = useState(null);

  const [mensaje, setMensaje] = useState("");

  const [detalleCaminante, setDetalleCaminante] = useState(null);

  const items = api.data?.items || [];

  const filtrados = useMemo(
    () =>
      items.filter((item) => {
        const coincideBusqueda =
          !busqueda ||
          normalizar(item.nombre).includes(normalizar(busqueda)) ||
          String(item.telefono || "").includes(busqueda);

        const coincidePago =
          !filtroPago || normalizar(item.estadoPago) === normalizar(filtroPago);

        return coincideBusqueda && coincidePago;
      }),
    [items, busqueda, filtroPago],
  );

  function puede(permiso) {
    return !authLoading && autenticado && tienePermiso(permiso);
  }

  async function cargarOpciones() {
    if (!token) {
      return null;
    }

    setCargandoOpciones(true);

    try {
      const datos = await obtenerOpcionesRegistroCaminante(token);

      setOpciones(datos);
      return datos;
    } finally {
      setCargandoOpciones(false);
    }
  }

  async function abrirRegistro() {
    await cargarOpciones();
    setSelected(null);
    setModoForm("crear");
    setFormOpen(true);
  }

  async function abrirEdicion(caminante) {
    await cargarOpciones();
    setSelected(caminante);
    setModoForm("editar");
    setFormOpen(true);
  }

  async function guardarFormulario(datos) {
    setGuardando(true);

    try {
      if (modoForm === "crear") {
        await registrarCaminanteApi(token, datos);

        setMensaje("Caminante registrado correctamente.");
      } else {
        await editarCaminanteApi(token, selected.id, datos);

        setMensaje("Caminante actualizado correctamente.");
      }

      setFormOpen(false);
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  function abrirAccion(tipo, caminante) {
    setSelected(caminante);
    setActionDialog(tipo);
  }

  async function abrirMesa(caminante) {
    if (String(caminante?.mesa || "").trim()) {
      setSelected(caminante);
      setActionDialog("mesaExistente");
      return;
    }

    await cargarOpciones();
    abrirAccion("mesa", caminante);
  }

  async function abrirHabitacion(caminante) {
    if (String(caminante?.habitacion || "").trim()) {
      setSelected(caminante);
      setActionDialog("habitacionExistente");
      return;
    }

    await cargarOpciones();
    abrirAccion("habitacion", caminante);
  }

  async function liberarAsignacionCaminante(tipo) {
    if (!selected) return;

    setGuardando(true);
    try {
      if (tipo === "mesa") {
        await asignarMesaCaminanteApi(token, selected.id, "");
        setMensaje("Mesa liberada correctamente.");
      } else {
        await asignarHabitacionCaminanteApi(token, selected.id, "");
        setMensaje("Habitación liberada correctamente.");
      }

      setActionDialog(null);
      setSelected(null);
      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  async function guardarAccion(valor) {
    setGuardando(true);

    try {
      if (actionDialog === "pago") {
        await actualizarPagoCaminanteApi(token, selected.id, valor);
      }

      if (actionDialog === "mesa") {
        await asignarMesaCaminanteApi(token, selected.id, valor);
      }

      if (actionDialog === "habitacion") {
        await asignarHabitacionCaminanteApi(token, selected.id, valor);
      }

      if (actionDialog === "carta") {
        await actualizarCartaCaminanteApi(token, selected.id, valor);
      }

      if (actionDialog === "foto") {
        await actualizarFotoCaminanteApi(token, selected.id, valor);
      }

      setActionDialog(null);
      setMensaje("Cambio guardado correctamente.");

      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  if (api.loading && !api.data) {
    return <LoadingState />;
  }

  if (api.error) {
    return <ErrorState message={api.error} onRetry={api.reload} />;
  }

  const mesasOpciones = [
    {
      valor: "",
      etiqueta: "Pendiente por definir",
    },
    ...(opciones?.mesasDisponibles || []).map((mesa) => ({
      valor: String(mesa.numero),
      etiqueta: mesa.etiqueta || `Mesa ${mesa.numero}`,
    })),
  ];

  const habitacionesOpciones = [
    {
      valor: "",
      etiqueta: "Pendiente por definir",
    },
    ...(opciones?.habitacionesDisponibles || []).map((habitacion) => ({
      valor: String(habitacion.habitacion),
      etiqueta: habitacion.etiqueta || `Habitación ${habitacion.habitacion}`,
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Inscripciones"
        title="Caminantes"
        subtitle={`${items.length} registros`}
        onRefresh={api.reload}
        loading={api.loading}
      />

      <Stack spacing={2.5}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          gap={2}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            gap={1.5}
            flex={1}
          >
            <TextField
              placeholder="Buscar por nombre o teléfono"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{
                minWidth: {
                  sm: 320,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Estado de pago"
              value={filtroPago}
              onChange={(e) => setFiltroPago(e.target.value)}
              sx={{
                minWidth: 190,
              }}
            >
              <MenuItem value="">Todos</MenuItem>

              {ESTADOS_PAGO.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <ProtectedButton
            permiso="REGISTRAR_CAMINANTE"
            variant="contained"
            startIcon={<AddRounded />}
            onClick={abrirRegistro}
            sx={{
              minHeight: 42,
              borderRadius: 2.5,
              px: 2.5,
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            Registrar caminante
          </ProtectedButton>
        </Stack>

        {!autenticado && (
          <Alert severity="info">
            Está en modo consulta. Inicie sesión para registrar o modificar
            información.
          </Alert>
        )}

        <Grid container spacing={2}>
          {filtrados.map((caminante) => (
            <Grid
              key={caminante.id}
              size={{
                xs: 12,
                md: 6,
                xl: 4,
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        component="button"
                        type="button"
                        variant="h6"
                        fontWeight={850}
                        onClick={() => setDetalleCaminante(caminante)}
                        sx={{
                          p: 0,
                          border: 0,
                          background: "transparent",
                          color: "text.primary",
                          cursor: "pointer",
                          textAlign: "left",
                          "&:hover": {
                            color: "primary.main",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {caminante.nombre}
                      </Typography>

                      <Typography color="text.secondary">
                        {caminante.telefono || "Sin teléfono"}
                      </Typography>
                    </Box>

                    <Stack direction="row" gap={1} flexWrap="wrap">
                      <StatusChip value={caminante.estadoPago} />

                      <Chip
                        size="small"
                        label={
                          caminante.mesa ? `Mesa ${caminante.mesa}` : "Sin mesa"
                        }
                        variant="outlined"
                      />

                      <Chip
                        size="small"
                        label={
                          caminante.habitacion
                            ? `Hab. ${caminante.habitacion}`
                            : "Sin habitación"
                        }
                        variant="outlined"
                      />
                    </Stack>

                    <Stack direction="row" gap={1} flexWrap="wrap">
                      <Chip
                        size="small"
                        icon={<MailRounded />}
                        label={`Carta: ${
                          caminante.entregables?.carta || "Pendiente"
                        }`}
                      />

                      <Chip
                        size="small"
                        icon={<PhotoRounded />}
                        label={`Foto: ${
                          caminante.entregables?.foto || "Pendiente"
                        }`}
                      />
                    </Stack>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Contacto
                      </Typography>

                      <Typography variant="body2" fontWeight={700}>
                        {caminante.contacto?.nombre || "Sin contacto"}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {caminante.contacto?.telefono || ""}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <CardActions
                  sx={{
                    px: 2,
                    pb: 2,
                    flexWrap: "wrap",
                    gap: 0.5,
                  }}
                >
                  {puede("EDITAR_CAMINANTE") && (
                    <Button
                      size="small"
                      startIcon={<EditRounded />}
                      onClick={() => abrirEdicion(caminante)}
                    >
                      Editar
                    </Button>
                  )}

                  {puede("ACTUALIZAR_PAGO") && (
                    <Button
                      size="small"
                      startIcon={<PaymentsRounded />}
                      onClick={() => abrirAccion("pago", caminante)}
                    >
                      Pago
                    </Button>
                  )}

                  {puede("ASIGNAR_MESA") && (
                    <Button
                      size="small"
                      startIcon={<TableRestaurantRounded />}
                      onClick={() => abrirMesa(caminante)}
                    >
                      Mesa
                    </Button>
                  )}

                  {puede("ASIGNAR_HABITACION") && (
                    <Button
                      size="small"
                      startIcon={<BedRounded />}
                      onClick={() => abrirHabitacion(caminante)}
                    >
                      Habitación
                    </Button>
                  )}

                  {puede("ACTUALIZAR_CARTA") && (
                    <Button
                      size="small"
                      startIcon={<MailRounded />}
                      onClick={() => abrirAccion("carta", caminante)}
                    >
                      Carta
                    </Button>
                  )}

                  {puede("ACTUALIZAR_FOTO") && (
                    <Button
                      size="small"
                      startIcon={<PhotoRounded />}
                      onClick={() => abrirAccion("foto", caminante)}
                    >
                      Foto
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filtrados.length === 0 && (
          <Alert severity="info">
            No hay caminantes que coincidan con los filtros.
          </Alert>
        )}
      </Stack>

      <Dialog
        open={Boolean(detalleCaminante)}
        onClose={() => setDetalleCaminante(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={1.5}
          >
            <Box>
              <Typography variant="h5" fontWeight={900}>
                {detalleCaminante?.nombre || "Detalle del caminante"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Información completa para la gestión del retiro
              </Typography>
            </Box>

            <Stack direction="row" gap={1} flexWrap="wrap">
              <StatusChip value={detalleCaminante?.estadoPago || "Pendiente"} />
              <Chip
                size="small"
                icon={<TableRestaurantRounded />}
                label={
                  detalleCaminante?.mesa
                    ? `Mesa ${detalleCaminante.mesa}`
                    : "Sin mesa"
                }
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<BedRounded />}
                label={
                  detalleCaminante?.habitacion
                    ? `Hab. ${detalleCaminante.habitacion}`
                    : "Sin habitación"
                }
                variant="outlined"
              />
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.25}>
            <SeccionDetalle titulo="Información personal">
              <CampoDetalle
                etiqueta="Número de inscripción"
                valor={detalleCaminante?.numeroInscripcion}
              />
              <CampoDetalle
                etiqueta="Documento de identidad"
                valor={
                  detalleCaminante?.documentoIdentidad ||
                  detalleCaminante?.documento ||
                  detalleCaminante?.numeroDocumento
                }
              />
              <CampoDetalle
                etiqueta="Fecha de nacimiento"
                valor={formatearFechaDetalle(detalleCaminante?.fechaNacimiento)}
              />
              <CampoDetalle etiqueta="Edad" valor={detalleCaminante?.edad} />
              <CampoDetalle
                etiqueta="Estado civil"
                valor={detalleCaminante?.estadoCivil}
              />
              <CampoDetalle
                etiqueta="Profesión u ocupación"
                valor={
                  detalleCaminante?.profesionOcupacion ||
                  detalleCaminante?.profesion ||
                  detalleCaminante?.ocupacion
                }
              />
              <CampoDetalle
                etiqueta="Talla de camiseta"
                valor={
                  detalleCaminante?.tallaCamiseta ||
                  detalleCaminante?.tallaCamisa ||
                  detalleCaminante?.talla
                }
              />
              <CampoDetalle
                etiqueta="Parroquia"
                valor={detalleCaminante?.parroquia || detalleCaminante?.iglesia}
              />
            </SeccionDetalle>

            <SeccionDetalle titulo="Ubicación y contacto">
              <CampoDetalle
                etiqueta="Celular"
                valor={detalleCaminante?.telefono || detalleCaminante?.celular}
              />
              <CampoDetalle
                etiqueta="Teléfono fijo"
                valor={detalleCaminante?.telefonoFijo}
              />
              <CampoDetalle
                etiqueta="Correo electrónico"
                valor={detalleCaminante?.correo}
              />
              <CampoDetalle
                etiqueta="Dirección de residencia"
                valor={
                  detalleCaminante?.direccionResidencia ||
                  detalleCaminante?.direccion
                }
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Barrio"
                valor={detalleCaminante?.barrio}
              />
              <CampoDetalle
                etiqueta="Ciudad o municipio"
                valor={detalleCaminante?.ciudad || detalleCaminante?.municipio}
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
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    <StatusChip
                      value={detalleCaminante?.estadoPago || "Pendiente"}
                    />
                    <Chip
                      icon={<TableRestaurantRounded />}
                      label={
                        detalleCaminante?.mesa
                          ? `Mesa ${detalleCaminante.mesa}`
                          : "Sin mesa asignada"
                      }
                      variant="outlined"
                    />
                    <Chip
                      icon={<BedRounded />}
                      label={
                        detalleCaminante?.habitacion
                          ? `Habitación ${detalleCaminante.habitacion}`
                          : "Sin habitación asignada"
                      }
                      variant="outlined"
                    />
                  </Stack>

                  <Divider />

                  <Grid container spacing={2}>
                    <CampoDetalle
                      etiqueta="Sacramentos recibidos"
                      valor={detalleCaminante?.sacramentosRecibidos}
                      anchoCompleto
                    />
                    <CampoDetalle
                      etiqueta="Cómo se enteró del retiro"
                      valor={detalleCaminante?.comoSeEntero}
                    />
                    <CampoDetalle
                      etiqueta="Persona que lo invitó"
                      valor={
                        detalleCaminante?.nombrePersonaInvito ||
                        detalleCaminante?.personaInvito ||
                        detalleCaminante?.invitadoPor
                      }
                    />
                    <CampoDetalle
                      etiqueta="Celular de quien lo invitó"
                      valor={detalleCaminante?.celularPersonaInvito}
                    />
                    <CampoDetalle
                      etiqueta="Asistirá una persona conocida"
                      valor={detalleCaminante?.personaConocidaAsistira}
                    />
                    <CampoDetalle
                      etiqueta="Persona conocida"
                      valor={detalleCaminante?.nombrePersonaConocida}
                    />
                    <CampoDetalle
                      etiqueta="Autoriza tratamiento de datos"
                      valor={detalleCaminante?.autorizaTratamientoDatos}
                    />
                    <CampoDetalle
                      etiqueta="Autoriza fotografías"
                      valor={detalleCaminante?.autorizaFotografias}
                    />
                  </Grid>

                  <Divider />

                  <Stack direction="row" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<MailRounded />}
                      label={`Carta: ${detalleCaminante?.entregables?.carta || "Pendiente"}`}
                    />
                    <Chip
                      icon={<PhotoRounded />}
                      label={`Foto: ${detalleCaminante?.entregables?.foto || "Pendiente"}`}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <SeccionDetalle titulo="Información de salud">
              <CampoDetalle
                etiqueta="EPS"
                valor={detalleCaminante?.eps || detalleCaminante?.nombreEps}
              />
              <CampoDetalle
                etiqueta="Sufre alguna enfermedad"
                valor={detalleCaminante?.sufreEnfermedad}
              />
              <CampoDetalle
                etiqueta="Enfermedad o condición"
                valor={
                  detalleCaminante?.enfermedadCual ||
                  detalleCaminante?.condicionMedica
                }
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Toma medicamentos"
                valor={detalleCaminante?.tomaMedicamento}
              />
              <CampoDetalle
                etiqueta="Medicamento"
                valor={
                  detalleCaminante?.medicamentoCual ||
                  detalleCaminante?.medicamentos
                }
              />
              <CampoDetalle
                etiqueta="Horario de medicamentos"
                valor={detalleCaminante?.horariosMedicamentos}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Tiene limitación física"
                valor={detalleCaminante?.tieneLimitacionFisica}
              />
              <CampoDetalle
                etiqueta="Limitación física"
                valor={detalleCaminante?.limitacionCual}
              />
              <CampoDetalle
                etiqueta="Alergias"
                valor={detalleCaminante?.alergias}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Restricciones alimentarias"
                valor={detalleCaminante?.restriccionesAlimentarias}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Tipo de sangre"
                valor={detalleCaminante?.tipoSangre}
              />
            </SeccionDetalle>

            <SeccionDetalle titulo="Contactos de emergencia">
              <CampoDetalle
                etiqueta="Contacto principal"
                valor={detalleCaminante?.contacto?.nombre}
              />
              <CampoDetalle
                etiqueta="Parentesco"
                valor={detalleCaminante?.contacto?.parentesco}
              />
              <CampoDetalle
                etiqueta="Celular principal"
                valor={detalleCaminante?.contacto?.telefono}
              />
              <CampoDetalle
                etiqueta="Contacto alterno"
                valor={detalleCaminante?.contactoAlterno?.nombre}
              />
              <CampoDetalle
                etiqueta="Parentesco del contacto alterno"
                valor={detalleCaminante?.contactoAlterno?.parentesco}
              />
              <CampoDetalle
                etiqueta="Celular alterno"
                valor={detalleCaminante?.contactoAlterno?.telefono}
              />
            </SeccionDetalle>

            {(tieneValor(detalleCaminante?.observaciones) ||
              tieneValor(detalleCaminante?.observacionesGestion)) && (
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={850}
                    sx={{ mb: 1.25 }}
                  >
                    Observaciones
                  </Typography>
                  {tieneValor(detalleCaminante?.observaciones) && (
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      {detalleCaminante.observaciones}
                    </Typography>
                  )}
                  {tieneValor(detalleCaminante?.observacionesGestion) && (
                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                        mt: tieneValor(detalleCaminante?.observaciones)
                          ? 1.5
                          : 0,
                      }}
                    >
                      {detalleCaminante.observacionesGestion}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setDetalleCaminante(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <CaminanteFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={guardarFormulario}
        loading={guardando || cargandoOpciones}
        opciones={opciones}
        caminante={selected}
        modo={modoForm}
      />

      <Dialog
        open={
          actionDialog === "mesaExistente" ||
          actionDialog === "habitacionExistente"
        }
        onClose={guardando ? undefined : () => setActionDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {actionDialog === "mesaExistente"
            ? "Mesa existente"
            : "Habitación existente"}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography fontWeight={800} sx={{ mb: 0.5 }}>
              {actionDialog === "mesaExistente"
                ? "Este caminante ya tiene una mesa asignada."
                : "Este caminante ya tiene una habitación asignada."}
            </Typography>
            <Typography variant="body2">
              {actionDialog === "mesaExistente" ? (
                <>
                  Mesa actual: <strong>Mesa {selected?.mesa}</strong>. Para
                  asignarle una nueva mesa, primero debes liberar la actual.
                </>
              ) : (
                <>
                  Habitación actual:{" "}
                  <strong>Habitación {selected?.habitacion}</strong>. Para
                  asignarle una nueva habitación, primero debes liberar la
                  actual.
                </>
              )}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={guardando}
            onClick={() =>
              liberarAsignacionCaminante(
                actionDialog === "mesaExistente" ? "mesa" : "habitacion",
              )
            }
          >
            {actionDialog === "mesaExistente"
              ? "Liberar mesa"
              : "Liberar habitación"}
          </Button>
        </DialogActions>
      </Dialog>

      <CaminanteActionDialog
        open={
          Boolean(actionDialog) &&
          actionDialog !== "mesaExistente" &&
          actionDialog !== "habitacionExistente"
        }
        onClose={() => setActionDialog(null)}
        onSubmit={guardarAccion}
        loading={guardando}
        titulo={
          actionDialog === "pago"
            ? "Actualizar pago"
            : actionDialog === "mesa"
              ? "Asignar mesa"
              : actionDialog === "habitacion"
                ? "Asignar habitación"
                : actionDialog === "carta"
                  ? "Actualizar carta"
                  : "Actualizar foto"
        }
        descripcion={selected ? selected.nombre : ""}
        label={
          actionDialog === "pago"
            ? "Estado del pago"
            : actionDialog === "mesa"
              ? "Mesa"
              : actionDialog === "habitacion"
                ? "Habitación"
                : actionDialog === "carta"
                  ? "Estado de la carta"
                  : "Estado de la foto"
        }
        valorInicial={
          actionDialog === "pago"
            ? selected?.estadoPago
            : actionDialog === "mesa"
              ? selected?.mesa
              : actionDialog === "habitacion"
                ? selected?.habitacion
                : actionDialog === "carta"
                  ? selected?.entregables?.carta
                  : selected?.entregables?.foto
        }
        opciones={
          actionDialog === "pago"
            ? ESTADOS_PAGO
            : actionDialog === "mesa"
              ? mesasOpciones
              : actionDialog === "habitacion"
                ? habitacionesOpciones
                : ESTADOS_ENTREGABLES
        }
      />

      <Snackbar
        open={Boolean(mensaje)}
        autoHideDuration={3500}
        onClose={() => setMensaje("")}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setMensaje("")}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </>
  );
}
