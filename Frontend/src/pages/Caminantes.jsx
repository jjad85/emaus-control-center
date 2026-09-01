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
  Paper,
} from "@mui/material";

import {
  AddRounded,
  BedRounded,
  EditRounded,
  MailRounded,
  PaymentsRounded,
  PhotoRounded,
  SearchRounded,
  FilterAltRounded,
  RestartAltRounded,
  PersonOffRounded,
  PhoneInTalkRounded,
  GroupsRounded,
  TableRestaurantRounded,
} from "@mui/icons-material";

import { useMemo, useState } from "react";

import {
  asignarHabitacionCaminanteApi,
  asignarMesaCaminanteApi,
  actualizarCartaCaminanteApi,
  actualizarFotoCaminanteApi,
  actualizarLlamadaCaminanteApi,
  actualizarLlamadaContactosCaminanteApi,
  actualizarPagoCaminanteApi,
  cancelarCaminanteApi,
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
import EstadoCuentaPersona from "../components/pagos/EstadoCuentaPersona";

const ESTADOS_PAGO = [
  "Pendiente",
  "Pago Parcial",
  "Pago Total",
  "Pago Excedido",
];

const ESTADOS_ENTREGABLES = ["Pendiente", "Solicitada", "Entregada", "Empaquetada", "Entregada a Logística"];
const ESTADOS_LLAMADAS = ["Pendiente", "En Proceso", "Realizado"];


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

function colorEstadoLlamada(estado) {
  if (estado === "Realizado") return "success";
  if (estado === "En Proceso") return "info";
  return "warning";
}

const CRITERIOS_FILTRO = [
  {
    valor: "mesa",
    etiqueta: "Mesa",
  },
  {
    valor: "estadoPago",
    etiqueta: "Estado de pago",
  },
  {
    valor: "habitacion",
    etiqueta: "Habitación",
  },
  {
    valor: "carta",
    etiqueta: "Estado de carta",
  },
  {
    valor: "foto",
    etiqueta: "Estado de foto",
  },
  {
    valor: "llamadaCaminante",
    etiqueta: "Llamada al caminante",
  },
  {
    valor: "llamadaContactos",
    etiqueta: "Llamada a contactos",
  },
  {
    valor: "nombre",
    etiqueta: "Nombre",
  },
  {
    valor: "numeroInscripcion",
    etiqueta: "Número de inscripción",
  },
  {
    valor: "documento",
    etiqueta: "Documento",
  },
];

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

  const [criterioFiltro, setCriterioFiltro] = useState("mesa");

  const [valorFiltro, setValorFiltro] = useState("");

  const [opciones, setOpciones] = useState(null);

  const [cargandoOpciones, setCargandoOpciones] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [formOpen, setFormOpen] = useState(false);

  const [modoForm, setModoForm] = useState("crear");

  const [selected, setSelected] = useState(null);

  const [actionDialog, setActionDialog] = useState(null);

  const [mensaje, setMensaje] = useState("");

  const [cancelando, setCancelando] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [errorCancelacion, setErrorCancelacion] = useState("");

  const [detalleCaminante, setDetalleCaminante] = useState(null);

  const items = api.data?.items || [];

  const opcionesFiltro = useMemo(() => {
    function unicosOrdenados(valores) {
      return Array.from(
        new Set(
          valores
            .map((valor) => String(valor || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "es", {
          numeric: true,
          sensitivity: "base",
        }),
      );
    }

    if (criterioFiltro === "mesa") {
      return [
        {
          valor: "__SIN_VALOR__",
          etiqueta: "Sin mesa",
        },
        ...unicosOrdenados(items.map((item) => item.mesa)).map((mesa) => ({
          valor: mesa,
          etiqueta: `Mesa ${mesa}`,
        })),
      ];
    }

    if (criterioFiltro === "estadoPago") {
      const estados = unicosOrdenados(
        items.map((item) => item.estadoPago),
      );

      return (estados.length ? estados : ESTADOS_PAGO).map((estado) => ({
        valor: estado,
        etiqueta: estado,
      }));
    }

    if (criterioFiltro === "habitacion") {
      return [
        {
          valor: "__SIN_VALOR__",
          etiqueta: "Sin habitación",
        },
        ...unicosOrdenados(items.map((item) => item.habitacion)).map(
          (habitacion) => ({
            valor: habitacion,
            etiqueta: `Habitación ${habitacion}`,
          }),
        ),
      ];
    }

    if (criterioFiltro === "carta") {
      const estados = unicosOrdenados(
        items.map((item) => item.entregables?.carta),
      );

      return (estados.length ? estados : ESTADOS_ENTREGABLES).map(
        (estado) => ({
          valor: estado,
          etiqueta: estado,
        }),
      );
    }

    if (criterioFiltro === "foto") {
      const estados = unicosOrdenados(
        items.map((item) => item.entregables?.foto),
      );

      return (estados.length ? estados : ESTADOS_ENTREGABLES).map(
        (estado) => ({
          valor: estado,
          etiqueta: estado,
        }),
      );
    }

    if (criterioFiltro === "llamadaCaminante") {
      return ESTADOS_LLAMADAS.map((estado) => ({
        valor: estado,
        etiqueta: estado,
      }));
    }

    if (criterioFiltro === "llamadaContactos") {
      return ESTADOS_LLAMADAS.map((estado) => ({
        valor: estado,
        etiqueta: estado,
      }));
    }

    return [];
  }, [items, criterioFiltro]);

  const criterioEsTexto = [
    "nombre",
    "numeroInscripcion",
    "documento",
  ].includes(criterioFiltro);

  const etiquetaValorFiltro = {
    mesa: "Seleccione una mesa",
    estadoPago: "Seleccione un estado",
    habitacion: "Seleccione una habitación",
    carta: "Seleccione un estado",
    foto: "Seleccione un estado",
    llamadaCaminante: "Seleccione un estado",
    llamadaContactos: "Seleccione un estado",
    nombre: "Escriba el nombre",
    numeroInscripcion: "Escriba el número de inscripción",
    documento: "Escriba el documento",
  }[criterioFiltro];

  const filtrados = useMemo(
    () =>
      items.filter((item) => {
        const textoBusqueda = normalizar(busqueda);

        const coincideBusqueda =
          !textoBusqueda ||
          [
            item.nombre,
            item.telefono,
            item.celular,
            item.documentoIdentidad,
            item.documento,
            item.numeroInscripcion,
          ].some((valor) =>
            normalizar(valor).includes(textoBusqueda),
          );

        if (!coincideBusqueda) {
          return false;
        }

        if (!valorFiltro) {
          return true;
        }

        let valorItem = "";

        if (criterioFiltro === "mesa") {
          valorItem = item.mesa;
        } else if (criterioFiltro === "estadoPago") {
          valorItem = item.estadoPago;
        } else if (criterioFiltro === "habitacion") {
          valorItem = item.habitacion;
        } else if (criterioFiltro === "carta") {
          valorItem = item.entregables?.carta;
        } else if (criterioFiltro === "foto") {
          valorItem = item.entregables?.foto;
        } else if (criterioFiltro === "llamadaCaminante") {
          valorItem = item.seguimiento?.llamadaCaminante || "Pendiente";
        } else if (criterioFiltro === "llamadaContactos") {
          valorItem = item.seguimiento?.llamadaContactos || "Pendiente";
        } else if (criterioFiltro === "nombre") {
          valorItem = item.nombre;
        } else if (criterioFiltro === "numeroInscripcion") {
          valorItem =
            item.numeroInscripcion ||
            item.numeroInscripcionCaminante;
        } else if (criterioFiltro === "documento") {
          valorItem =
            item.documentoIdentidad ||
            item.documento;
        }

        if (valorFiltro === "__SIN_VALOR__") {
          return !String(valorItem || "").trim();
        }

        if (criterioEsTexto) {
          return normalizar(valorItem).includes(
            normalizar(valorFiltro),
          );
        }

        return (
          normalizar(valorItem) ===
          normalizar(valorFiltro)
        );
      }),
    [
      items,
      busqueda,
      criterioFiltro,
      valorFiltro,
      criterioEsTexto,
    ],
  );

  function cambiarCriterioFiltro(event) {
    setCriterioFiltro(event.target.value);
    setValorFiltro("");
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCriterioFiltro("mesa");
    setValorFiltro("");
  }

  const hayFiltrosActivos =
    Boolean(busqueda) ||
    Boolean(valorFiltro) ||
    criterioFiltro !== "mesa";

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

      if (actionDialog === "llamadaCaminante") {
        await actualizarLlamadaCaminanteApi(token, selected.id, valor);
      }

      if (actionDialog === "llamadaContactos") {
        await actualizarLlamadaContactosCaminanteApi(token, selected.id, valor);
      }

      setActionDialog(null);
      setMensaje(
        valor === "Entregada a Logística"
          ? "Entrega aprobada por Logística correctamente."
          : "Cambio guardado correctamente.",
      );

      await api.reload();
    } finally {
      setGuardando(false);
    }
  }

  function actualizarDetalleDesdeLista(id, datos) {
    const actualizado = datos?.items?.find((item) => item.id === id);
    if (actualizado) {
      setDetalleCaminante(actualizado);
    }
  }

  function abrirCancelacion(caminante) {
    setCancelando(caminante);
    setMotivoCancelacion("");
    setErrorCancelacion("");
  }

  function cerrarCancelacion() {
    if (guardando) return;

    setCancelando(null);
    setMotivoCancelacion("");
    setErrorCancelacion("");
  }

  async function confirmarCancelacion() {
    if (!cancelando) return;

    const motivo =
      String(
        motivoCancelacion ||
        ""
      ).trim();

    if (motivo.length < 5) {
      setErrorCancelacion(
        "Escribe el motivo de la cancelación con al menos 5 caracteres.",
      );
      return;
    }

    setGuardando(true);
    setErrorCancelacion("");

    try {
      const resultado =
        await cancelarCaminanteApi(
          token,
          cancelando.id,
          motivo,
        );

      const pagosRevertidos =
        Number(
          resultado?.cancelacion
            ?.pagosAprobadosRevertidos ||
            0,
        );

      const valorRevertido =
        Number(
          resultado?.cancelacion
            ?.valorRevertido ||
            0,
        );

      const detallePagos =
        pagosRevertidos > 0
          ? ` Se revirtieron ${pagosRevertidos} pago(s) aprobado(s) por ${new Intl.NumberFormat(
              "es-CO",
              {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              },
            ).format(valorRevertido)}.`
          : "";

      setMensaje(
        `Caminante cancelado correctamente.${detallePagos}`,
      );

      setCancelando(null);
      setMotivoCancelacion("");
      setDetalleCaminante(null);

      await api.reload();
    } catch (err) {
      setErrorCancelacion(
        err?.message ||
          "No fue posible cancelar el caminante.",
      );
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
              lg: "row",
            }}
            gap={1.5}
            flex={1}
            alignItems={{
              lg: "flex-start",
            }}
          >
            <TextField
              placeholder="Buscar por nombre, documento, inscripción o teléfono"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{
                minWidth: {
                  sm: 330,
                },
                flex: {
                  lg: 1,
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
              label="Criterio"
              value={criterioFiltro}
              onChange={cambiarCriterioFiltro}
              sx={{
                minWidth: {
                  xs: "100%",
                  sm: 220,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterAltRounded />
                  </InputAdornment>
                ),
              }}
            >
              {CRITERIOS_FILTRO.map((criterio) => (
                <MenuItem
                  key={criterio.valor}
                  value={criterio.valor}
                >
                  {criterio.etiqueta}
                </MenuItem>
              ))}
            </TextField>

            {criterioEsTexto ? (
              <TextField
                label="Valor"
                placeholder={etiquetaValorFiltro}
                value={valorFiltro}
                onChange={(e) =>
                  setValorFiltro(e.target.value)
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 250,
                  },
                }}
              />
            ) : (
              <TextField
                select
                label="Valor"
                value={valorFiltro}
                onChange={(e) =>
                  setValorFiltro(e.target.value)
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 240,
                  },
                }}
              >
                <MenuItem value="">
                  {criterioFiltro === "mesa"
                    ? "Todas las mesas"
                    : "Todos"}
                </MenuItem>

                {opcionesFiltro.map((opcion) => (
                  <MenuItem
                    key={opcion.valor}
                    value={opcion.valor}
                  >
                    {opcion.etiqueta}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <Button
              variant="outlined"
              startIcon={<RestartAltRounded />}
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              sx={{
                minHeight: 56,
                whiteSpace: "nowrap",
                textTransform: "none",
                fontWeight: 750,
              }}
            >
              Limpiar
            </Button>
          </Stack>

          <ProtectedButton
            permiso="CAMINANTES_REGISTRAR"
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

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          gap={1}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Mostrando{" "}
            <strong>{filtrados.length}</strong> de{" "}
            <strong>{items.length}</strong> caminantes
          </Typography>

          {valorFiltro && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`Filtro: ${
                CRITERIOS_FILTRO.find(
                  (criterio) =>
                    criterio.valor === criterioFiltro,
                )?.etiqueta || "Criterio"
              } · ${
                valorFiltro === "__SIN_VALOR__"
                  ? criterioFiltro === "mesa"
                    ? "Sin mesa"
                    : "Sin habitación"
                  : criterioEsTexto
                    ? valorFiltro
                    : opcionesFiltro.find(
                        (opcion) =>
                          opcion.valor === valorFiltro,
                      )?.etiqueta || valorFiltro
              }`}
            />
          )}
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
                        variant="outlined"
                        sx={estiloEstadoEntregable(
                          caminante.entregables?.carta || "Pendiente",
                        ).sx}
                      />

                      <Chip
                        size="small"
                        icon={<PhotoRounded />}
                        label={`Foto: ${
                          caminante.entregables?.foto || "Pendiente"
                        }`}
                        variant="outlined"
                        sx={estiloEstadoEntregable(
                          caminante.entregables?.foto || "Pendiente",
                        ).sx}
                      />

                      <Chip
                        size="small"
                        icon={<PhoneInTalkRounded />}
                        label={`Llamada caminante: ${
                          caminante.seguimiento?.llamadaCaminante || "Pendiente"
                        }`}
                        color={colorEstadoLlamada(
                          caminante.seguimiento?.llamadaCaminante || "Pendiente",
                        )}
                        variant="outlined"
                      />

                      <Chip
                        size="small"
                        icon={<GroupsRounded />}
                        label={`Llamada contactos: ${
                          caminante.seguimiento?.llamadaContactos || "Pendiente"
                        }`}
                        color={colorEstadoLlamada(
                          caminante.seguimiento?.llamadaContactos || "Pendiente",
                        )}
                        variant="outlined"
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
                  {puede("CAMINANTES_EDITAR") && (
                    <Button
                      size="small"
                      startIcon={<EditRounded />}
                      onClick={() => abrirEdicion(caminante)}
                    >
                      Editar
                    </Button>
                  )}

                  {puede("CAMINANTES_CANCELAR") && (
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      startIcon={<PersonOffRounded />}
                      onClick={() => abrirCancelacion(caminante)}
                      sx={{
                        fontWeight: 900,
                        boxShadow: 2,
                      }}
                    >
                      Cancelar
                    </Button>
                  )}

                  {puede("CAMINANTES_ASIGNAR_MESA") && (
                    <Button
                      size="small"
                      startIcon={<TableRestaurantRounded />}
                      onClick={() => abrirMesa(caminante)}
                    >
                      Mesa
                    </Button>
                  )}

                  {puede("CAMINANTES_ASIGNAR_HABITACION") && (
                    <Button
                      size="small"
                      startIcon={<BedRounded />}
                      onClick={() => abrirHabitacion(caminante)}
                    >
                      Habitación
                    </Button>
                  )}

                  {puede("CAMINANTES_REPORTAR_CARTA") && (
                    <Button
                      size="small"
                      startIcon={<MailRounded />}
                      onClick={() => abrirAccion("carta", caminante)}
                    >
                      Carta
                    </Button>
                  )}

                  {puede("CAMINANTES_REPORTAR_FOTO") && (
                    <Button
                      size="small"
                      startIcon={<PhotoRounded />}
                      onClick={() => abrirAccion("foto", caminante)}
                    >
                      Foto
                    </Button>
                  )}

                  {puede("CAMINANTES_REPORTAR_LLAMADA_CAMINANTE") && (
                    <Button
                      size="small"
                      startIcon={<PhoneInTalkRounded />}
                      onClick={() => abrirAccion("llamadaCaminante", caminante)}
                    >
                      Llamada caminante
                    </Button>
                  )}

                  {puede("CAMINANTES_REPORTAR_LLAMADA_CONTACTOS") && (
                    <Button
                      size="small"
                      startIcon={<GroupsRounded />}
                      onClick={() => abrirAccion("llamadaContactos", caminante)}
                    >
                      Llamada contactos
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
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <PaymentsRounded color="primary" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={850}>Estado de cuenta</Typography>
                    <Typography variant="body2" color="text.secondary">Abonos, comprobantes y trazabilidad financiera.</Typography>
                  </Box>
                </Stack>
                <EstadoCuentaPersona token={token} tipoPersona="Caminante" personaId={detalleCaminante?.id} />
              </CardContent>
            </Card>
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
                      variant="outlined"
                        sx={estiloEstadoEntregable(
                        detalleCaminante?.entregables?.carta || "Pendiente",
                      ).sx}
                    />
                    <Chip
                      icon={<PhotoRounded />}
                      label={`Foto: ${detalleCaminante?.entregables?.foto || "Pendiente"}`}
                      variant="outlined"
                        sx={estiloEstadoEntregable(
                        detalleCaminante?.entregables?.foto || "Pendiente",
                      ).sx}
                    />
                    <Chip
                      icon={<PhoneInTalkRounded />}
                      label={`Llamada al caminante: ${detalleCaminante?.seguimiento?.llamadaCaminante || "Pendiente"}`}
                      color={colorEstadoLlamada(
                        detalleCaminante?.seguimiento?.llamadaCaminante || "Pendiente",
                      )}
                      variant="outlined"
                    />
                    <Chip
                      icon={<GroupsRounded />}
                      label={`Llamada a contactos: ${detalleCaminante?.seguimiento?.llamadaContactos || "Pendiente"}`}
                      color={colorEstadoLlamada(
                        detalleCaminante?.seguimiento?.llamadaContactos || "Pendiente",
                      )}
                      variant="outlined"
                    />
                  </Stack>

                  {detalleCaminante?.entregables?.aprobacionCartaLogistica?.aprobadoPor && (
                    <Alert severity="success">
                      Carta aprobada por Logística por {detalleCaminante.entregables.aprobacionCartaLogistica.aprobadoPor}
                      {detalleCaminante.entregables.aprobacionCartaLogistica.fecha
                        ? ` el ${formatearFechaDetalle(detalleCaminante.entregables.aprobacionCartaLogistica.fecha)}`
                        : ""}.
                    </Alert>
                  )}

                  {detalleCaminante?.entregables?.aprobacionFotoLogistica?.aprobadoPor && (
                    <Alert severity="success">
                      Fotografía aprobada por Logística por {detalleCaminante.entregables.aprobacionFotoLogistica.aprobadoPor}
                      {detalleCaminante.entregables.aprobacionFotoLogistica.fecha
                        ? ` el ${formatearFechaDetalle(detalleCaminante.entregables.aprobacionFotoLogistica.fecha)}`
                        : ""}.
                    </Alert>
                  )}
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
                etiqueta="Tiene condición alimentaria"
                valor={detalleCaminante?.tieneCondicionAlimentaria}
              />
              <CampoDetalle
                etiqueta="Alergias alimentarias"
                valor={detalleCaminante?.alergiasAlimentarias || detalleCaminante?.alergias}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Restricciones alimentarias"
                valor={detalleCaminante?.restriccionesAlimentarias}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Preferencias alimentarias"
                valor={detalleCaminante?.preferenciasAlimentarias}
                anchoCompleto
              />
              <CampoDetalle
                etiqueta="Dieta especial o indicaciones"
                valor={detalleCaminante?.dietaEspecial}
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
        open={Boolean(cancelando)}
        onClose={cerrarCancelacion}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Cancelar participación
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="error">
              <Typography fontWeight={900} sx={{ mb: .5 }}>
                ¿Cancelar la participación de este caminante?
              </Typography>

              <Typography variant="body2">
                Antes de continuar verifica el motivo. La cancelación conserva
                el historial, pero libera los cupos y revierte el dinero aprobado.
              </Typography>
            </Alert>

            <Box>
              <Typography fontWeight={900}>
                {cancelando?.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cancelando?.numeroInscripcion
                  ? `Inscripción ${cancelando.numeroInscripcion}`
                  : "Caminante seleccionado"}
              </Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2.5 }}
            >
              <Typography fontWeight={850} sx={{ mb: 1 }}>
                Al confirmar:
              </Typography>

              <Stack spacing={.8}>
                <Typography variant="body2">
                  ✓ Estado de participación → <strong>Cancelado</strong>
                </Typography>

                <Typography variant="body2">
                  ✓ Mesa actual →{" "}
                  <strong>
                    {cancelando?.mesa
                      ? `Mesa ${cancelando.mesa} quedará disponible`
                      : "No tiene mesa asignada"}
                  </strong>
                </Typography>

                <Typography variant="body2">
                  ✓ Habitación actual →{" "}
                  <strong>
                    {cancelando?.habitacion
                      ? `Habitación ${cancelando.habitacion} quedará disponible`
                      : "No tiene habitación asignada"}
                  </strong>
                </Typography>

                <Typography variant="body2">
                  ✓ Los pagos aprobados, si existen, se revertirán y dejarán de
                  sumar como dinero recibido.
                </Typography>

                <Typography variant="body2">
                  ✓ Se conservarán los pagos y su historial para auditoría.
                </Typography>

                <Typography variant="body2">
                  ✓ Las cartas y fotografías reportadas <strong>no se eliminan ni se retroceden</strong>;
                  conservan su estado y aprobaciones como historial del caminante.
                </Typography>

                <Typography variant="body2">
                  ✓ Al quedar cancelado, el caminante deja de contar en las bandejas e indicadores
                  logísticos activos.
                </Typography>
              </Stack>
            </Paper>

            {errorCancelacion && (
              <Alert severity="error">
                {errorCancelacion}
              </Alert>
            )}

            <TextField
              label="Motivo de cancelación"
              value={motivoCancelacion}
              onChange={(event) =>
                setMotivoCancelacion(event.target.value)
              }
              multiline
              minRows={3}
              required
              autoFocus
              placeholder="Ej.: No podrá asistir por un compromiso personal..."
              helperText={`${motivoCancelacion.trim().length} caracteres · mínimo 5`}
              error={
                Boolean(errorCancelacion) &&
                motivoCancelacion.trim().length < 5
              }
              fullWidth
            />

            <Alert severity="warning">
              La cancelación de la participación queda registrada en auditoría con el usuario,
              el motivo, la mesa/habitación liberadas y los pagos revertidos.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={cerrarCancelacion}
            disabled={guardando}
          >
            Volver
          </Button>

          <Button
            color="error"
            variant="contained"
            startIcon={<PersonOffRounded />}
            onClick={confirmarCancelacion}
            disabled={
              guardando ||
              motivoCancelacion.trim().length < 5
            }
          >
            {guardando
              ? "Cancelando..."
              : "Confirmar cancelación"}
          </Button>
        </DialogActions>
      </Dialog>

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
                  : actionDialog === "foto"
                    ? "Actualizar foto"
                    : actionDialog === "llamadaCaminante"
                      ? "Llamada al caminante"
                      : "Llamada a contactos"
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
                  : actionDialog === "foto"
                    ? "Estado de la foto"
                    : "Estado de la llamada"
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
                  : actionDialog === "foto"
                    ? selected?.entregables?.foto
                    : actionDialog === "llamadaCaminante"
                      ? selected?.seguimiento?.llamadaCaminante
                      : selected?.seguimiento?.llamadaContactos
        }
        opciones={
          actionDialog === "pago"
            ? ESTADOS_PAGO
            : actionDialog === "mesa"
              ? mesasOpciones
              : actionDialog === "habitacion"
                ? habitacionesOpciones
                : actionDialog === "carta" || actionDialog === "foto"
                  ? ESTADOS_ENTREGABLES.filter((estado) =>
                      estado !== "Entregada a Logística" ||
                      puede("CAMINANTES_APROBAR_ENTREGA_LOGISTICA"),
                    )
                  : ESTADOS_LLAMADAS
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
