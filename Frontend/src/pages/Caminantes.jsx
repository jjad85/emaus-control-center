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
  ContactEmergencyRounded,
  ContactPhoneRounded,
  FavoriteRounded,
  HomeRounded,
  InfoRounded,
  ChurchRounded,
  EditRounded,
  MailRounded,
  PaymentsRounded,
  PersonRounded,
  PhotoRounded,
  SearchRounded,
  TableRestaurantRounded,
  TaskAltRounded,
} from "@mui/icons-material";

import { useEffect, useMemo, useState } from "react";

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
import { obtenerPagosCaminante } from "../api/pagosApi";

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

function calcularEdad(fechaNacimiento) {
  if (!tieneValor(fechaNacimiento)) return null;

  const texto = String(fechaNacimiento).trim();
  const coincidencia = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const nacimiento = coincidencia
    ? new Date(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3]))
    : new Date(texto);

  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const noHaCumplido =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

  if (noHaCumplido) edad -= 1;
  return edad >= 0 && edad <= 120 ? edad : null;
}

function CampoDetalle({ etiqueta, valor, anchoCompleto = false }) {
  const valorVisible = Array.isArray(valor)
    ? valor.length
      ? valor.join(", ")
      : "Pendiente"
    : tieneValor(valor)
      ? String(valor)
      : "Pendiente";

  return (
    <Grid size={{ xs: 12, sm: anchoCompleto ? 12 : 6 }}>
      <Typography variant="caption" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography fontWeight={700} sx={{ whiteSpace: "pre-wrap" }}>
        {valorVisible}
      </Typography>
    </Grid>
  );
}

function primerValor(...valores) {
  return valores.find((valor) => tieneValor(valor));
}

function obtenerDatoDetalle(datos, ...claves) {
  const fuentes = [datos?.aspirante, datos?.caminante, datos].filter(Boolean);

  for (const clave of claves) {
    for (const fuente of fuentes) {
      const partes = clave.split(".");
      let valor = fuente;

      for (const parte of partes) {
        valor = valor?.[parte];
      }

      if (tieneValor(valor) || (Array.isArray(valor) && valor.length)) {
        return valor;
      }
    }
  }

  return undefined;
}

function SeccionDetalle({ titulo, icono, children }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 2.25,
          py: 1.5,
          bgcolor: "action.hover",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          {icono}
        </Box>
        <Typography variant="subtitle1" fontWeight={900}>
          {titulo}
        </Typography>
      </Box>

      <CardContent sx={{ p: 2.25 }}>
        <Grid container spacing={2.25}>
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
  const [resumenPagos, setResumenPagos] = useState(null);

  useEffect(() => {
    if (!detalleCaminante?.id || !token) { setResumenPagos(null); return; }
    obtenerPagosCaminante(token, detalleCaminante.id).then(setResumenPagos).catch(() => setResumenPagos(null));
  }, [detalleCaminante?.id, token]);

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
                {obtenerDatoDetalle(detalleCaminante, "nombreCompleto", "nombre") || "Detalle del caminante"}
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

        <DialogContent dividers sx={{ bgcolor: "background.default" }}>
          <Stack spacing={2}>
            <SeccionDetalle
              titulo="Información personal"
              icono={<PersonRounded fontSize="small" />}
            >
              <CampoDetalle
                etiqueta="Nombre completo"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "nombreCompleto",
                  "nombre",
                )}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Inscripción diligenciada por"
                valor={normalizar(obtenerDatoDetalle(detalleCaminante, "tipoRegistrante")) === "invitador" ? "Otra persona" : "El caminante"}
              />
              {normalizar(obtenerDatoDetalle(detalleCaminante, "tipoRegistrante")) === "invitador" && <>
                <CampoDetalle etiqueta="Nombre del registrante" valor={obtenerDatoDetalle(detalleCaminante, "nombreRegistrante")} />
                <CampoDetalle etiqueta="Teléfono del registrante" valor={obtenerDatoDetalle(detalleCaminante, "telefonoRegistrante")} />
              </>}
              <CampoDetalle
                etiqueta="Documento de identidad"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "documentoIdentidad",
                  "numeroDocumento",
                  "documento",
                )}
              />
              <CampoDetalle
                etiqueta="Fecha de nacimiento"
                valor={formatearFechaDetalle(
                  obtenerDatoDetalle(detalleCaminante, "fechaNacimiento"),
                )}
              />
              <CampoDetalle
                etiqueta="Edad"
                valor={(() => {
                  const edad = calcularEdad(
                    obtenerDatoDetalle(detalleCaminante, "fechaNacimiento"),
                  );
                  return edad !== null ? `${edad} años` : "Pendiente";
                })()}
              />
              <CampoDetalle
                etiqueta="Estado civil"
                valor={obtenerDatoDetalle(detalleCaminante, "estadoCivil")}
              />
              <CampoDetalle
                etiqueta="Dirección de residencia"
                valor={obtenerDatoDetalle(detalleCaminante, "direccionResidencia")}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Barrio"
                valor={obtenerDatoDetalle(detalleCaminante, "barrio")}
              />
              <CampoDetalle
                etiqueta="Parroquia a la que asiste"
                valor={obtenerDatoDetalle(detalleCaminante, "parroquia")}
              />
              <CampoDetalle
                etiqueta="Teléfono"
                valor={obtenerDatoDetalle(detalleCaminante, "telefono")}
              />
              <CampoDetalle
                etiqueta="Celular"
                valor={obtenerDatoDetalle(detalleCaminante, "celular")}
              />
            </SeccionDetalle>

            <SeccionDetalle
              titulo="Salud"
              icono={<FavoriteRounded fontSize="small" />}
            >
              <CampoDetalle
                etiqueta="¿Sufre alguna enfermedad?"
                valor={obtenerDatoDetalle(detalleCaminante, "sufreEnfermedad")}
              />
              <CampoDetalle
                etiqueta="¿Cuál enfermedad?"
                valor={obtenerDatoDetalle(detalleCaminante, "enfermedadCual")}
              />
              <CampoDetalle
                etiqueta="¿Toma algún medicamento?"
                valor={obtenerDatoDetalle(detalleCaminante, "tomaMedicamento")}
              />
              <CampoDetalle
                etiqueta="¿Cuál medicamento?"
                valor={obtenerDatoDetalle(detalleCaminante, "medicamentoCual")}
              />
              <CampoDetalle
                etiqueta="Horarios de los medicamentos"
                valor={obtenerDatoDetalle(detalleCaminante, "horariosMedicamentos")}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="EPS"
                valor={obtenerDatoDetalle(detalleCaminante, "eps")}
              />
              <CampoDetalle
                etiqueta="Profesión u ocupación"
                valor={obtenerDatoDetalle(detalleCaminante, "profesionOcupacion")}
              />
              <CampoDetalle
                etiqueta="¿Tiene alguna limitación física?"
                valor={obtenerDatoDetalle(detalleCaminante, "tieneLimitacionFisica")}
              />
              <CampoDetalle
                etiqueta="¿Cuál limitación?"
                valor={obtenerDatoDetalle(detalleCaminante, "limitacionCual")}
              />
            </SeccionDetalle>

            <SeccionDetalle
              titulo="Información general"
              icono={<ChurchRounded fontSize="small" />}
            >
              <CampoDetalle
                etiqueta="Sacramentos recibidos"
                valor={obtenerDatoDetalle(detalleCaminante, "sacramentosRecibidos")}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Talla de camisa tipo polo"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "tallaCamisa",
                  "tallaCamiseta",
                  "talla",
                )}
              />
            </SeccionDetalle>

            <SeccionDetalle
              titulo="Emergencia"
              icono={<ContactEmergencyRounded fontSize="small" />}
            >
              <CampoDetalle
                etiqueta="Contacto de emergencia 1"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "contacto1Nombre",
                  "contacto1.nombre",
                  "nombreContacto1",
                  "contactoEmergencia1",
                )}
              />
              <CampoDetalle
                etiqueta="Parentesco contacto 1"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "contacto1Parentesco",
                  "contacto1.parentesco",
                )}
              />
              <CampoDetalle
                etiqueta="Celular contacto 1"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "contacto1Celular",
                  "contacto1.celular",
                  "contacto1.telefono",
                  "telefonoContacto1",
                  "celularContacto1",
                )}
              />
              <CampoDetalle
                etiqueta="Contacto de emergencia 2"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "contacto2Nombre",
                  "contacto2.nombre",
                  "nombreContacto2",
                  "contactoEmergencia2",
                )}
              />
              <CampoDetalle
                etiqueta="Parentesco contacto 2"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "contacto2Parentesco",
                  "contacto2.parentesco",
                )}
              />
              <CampoDetalle
                etiqueta="Celular contacto 2"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "contacto2Celular",
                  "contacto2.celular",
                  "contacto2.telefono",
                  "telefonoContacto2",
                  "celularContacto2",
                )}
              />
            </SeccionDetalle>

            <SeccionDetalle
              titulo="Pagos del retiro"
              icono={<PaymentsRounded fontSize="small" />}
            >
              <CampoDetalle etiqueta="Valor del retiro" valor={resumenPagos ? `$${Number(resumenPagos.valorRetiro).toLocaleString("es-CO")}` : "Pendiente"} />
              <CampoDetalle etiqueta="Total aprobado" valor={resumenPagos ? `$${Number(resumenPagos.totalAprobado).toLocaleString("es-CO")}` : "Pendiente"} />
              <CampoDetalle etiqueta="Saldo pendiente" valor={resumenPagos ? `$${Number(resumenPagos.saldoPendiente).toLocaleString("es-CO")}` : "Pendiente"} />
              <CampoDetalle etiqueta="Excedente" valor={resumenPagos ? `$${Number(resumenPagos.excedente).toLocaleString("es-CO")}` : "Pendiente"} />
              {(resumenPagos?.pagos || []).map((pago) => (
                <Box key={pago.id} sx={{ gridColumn: "1 / -1", border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                    <Typography fontWeight={800}>{formatearFechaDetalle(pago.fechaPago)} · ${Number(pago.valorAprobado ?? pago.valorReportado).toLocaleString("es-CO")}</Typography>
                    <StatusChip value={pago.estado} />
                  </Stack>
                  {pago.comprobanteUrl && <Button size="small" href={pago.comprobanteUrl} target="_blank" sx={{ mt: 1 }}>Ver o descargar comprobante</Button>}
                </Box>
              ))}
              {resumenPagos && !resumenPagos.pagos?.length && <Typography sx={{ gridColumn: "1 / -1" }} color="text.secondary">No hay pagos registrados.</Typography>}
            </SeccionDetalle>

            <SeccionDetalle
              titulo="Información del retiro"
              icono={<InfoRounded fontSize="small" />}
            >
              <CampoDetalle
                etiqueta="Código de inscripción"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "numeroInscripcion",
                  "codigoInscripcion",
                  "nroInscripcion",
                  "aspirante.numeroInscripcion",
                  "aspirante.codigoInscripcion",
                )}
              />
              <CampoDetalle
                etiqueta="¿Cómo se enteró del retiro?"
                valor={obtenerDatoDetalle(detalleCaminante, "comoSeEntero")}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Nombre de quien lo invitó"
                valor={obtenerDatoDetalle(detalleCaminante, "nombrePersonaInvito")}
              />
              <CampoDetalle
                etiqueta="Celular de quien lo invitó"
                valor={obtenerDatoDetalle(detalleCaminante, "celularPersonaInvito")}
              />
              <CampoDetalle
                etiqueta="¿Asistirá una persona conocida?"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "personaConocidaAsistira",
                )}
              />
              <CampoDetalle
                etiqueta="Nombre de la persona conocida"
                valor={obtenerDatoDetalle(detalleCaminante, "nombrePersonaConocida")}
              />
              <CampoDetalle
                etiqueta="Autoriza tratamiento de datos"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "autorizaTratamientoDatos",
                )}
              />
              <CampoDetalle
                etiqueta="Autoriza fotografías"
                valor={obtenerDatoDetalle(detalleCaminante, "autorizaFotografias")}
              />
              <CampoDetalle
                etiqueta="Fecha de registro"
                valor={formatearFechaDetalle(
                  obtenerDatoDetalle(
                    detalleCaminante,
                    "fechaRegistro",
                    "fechaCreacion",
                    "createdAt",
                  ),
                )}
              />
              <CampoDetalle
                etiqueta="Estado de pago"
                valor={obtenerDatoDetalle(detalleCaminante, "estadoPago")}
              />
              <CampoDetalle
                etiqueta="Estado de la carta"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "entregables.carta",
                  "estadoCarta",
                )}
              />
              <CampoDetalle
                etiqueta="Estado de la foto"
                valor={obtenerDatoDetalle(
                  detalleCaminante,
                  "entregables.foto",
                  "entregables.fotos",
                  "estadoFoto",
                  "estadoFotos",
                )}
              />
              <CampoDetalle
                etiqueta="Mesa asignada"
                valor={obtenerDatoDetalle(detalleCaminante, "mesa")}
              />
              <CampoDetalle
                etiqueta="Habitación asignada"
                valor={obtenerDatoDetalle(detalleCaminante, "habitacion")}
              />
            </SeccionDetalle>
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
