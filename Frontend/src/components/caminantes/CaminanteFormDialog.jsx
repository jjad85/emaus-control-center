import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useEffect, useMemo, useState } from 'react';

import CelularField from '../CelularField';
import {
  esCelularColombiaValido,
  normalizarCelularColombia,
} from '../../utils/celularUtils';

const SACRAMENTOS = [
  'Bautizo',
  'Primera comunión',
  'Confirmación',
  'Matrimonio',
  'Ninguno',
];

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const FORM_INICIAL = {
  tipoRegistrante: 'ASPIRANTE',
  nombreRegistrante: '',
  telefonoRegistrante: '',
  nombreCompleto: '',
  documentoIdentidad: '',
  direccionResidencia: '',
  fechaNacimiento: '',
  barrio: '',
  parroquia: '',
  telefono: '',
  celular: '',
  estadoCivil: '',

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

  estadoPago: 'Pendiente',
  mesa: '',
  habitacion: '',
  carta: 'Pendiente',
  foto: 'Pendiente',
};

function tieneValor(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== '';
}

function leerRuta(objeto, ruta) {
  return String(ruta)
    .split('.')
    .reduce((actual, parte) => actual?.[parte], objeto);
}

function obtenerDato(datos, ...rutas) {
  const fuentes = [
    datos,
    datos?.aspirante,
    datos?.datosAspirante,
    datos?.caminante,
  ].filter(Boolean);

  for (const fuente of fuentes) {
    for (const ruta of rutas) {
      const valor = leerRuta(fuente, ruta);
      if (tieneValor(valor) || Array.isArray(valor)) return valor;
    }
  }

  return '';
}

function normalizarSiNo(valor) {
  if (valor === true) return 'Sí';
  if (valor === false) return 'No';
  const texto = String(valor || '').trim().toLowerCase();
  if (['si', 'sí', 's', 'true', '1'].includes(texto)) return 'Sí';
  if (['no', 'n', 'false', '0'].includes(texto)) return 'No';
  return valor || '';
}

function normalizarFecha(valor) {
  if (!valor) return '';
  const texto = String(valor);
  const coincidencia = texto.match(/^(\d{4}-\d{2}-\d{2})/);
  if (coincidencia) return coincidencia[1];
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const [year, month, day] = String(fechaNacimiento).split('-').map(Number);
  if (!year || !month || !day) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - year;
  if (
    hoy.getMonth() + 1 < month ||
    (hoy.getMonth() + 1 === month && hoy.getDate() < day)
  ) {
    edad -= 1;
  }
  return edad;
}

function Seccion({ titulo, children }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={900} color="primary.main">
        {titulo}
      </Typography>
      {children}
    </Stack>
  );
}

export default function CaminanteFormDialog({
  open,
  onClose,
  onSubmit,
  loading,
  opciones,
  caminante = null,
  modo = 'crear',
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (modo === 'editar' && caminante) {
      const sacramentos = obtenerDato(caminante, 'sacramentosRecibidos', 'sacramentos');

      setForm({
        tipoRegistrante: obtenerDato(caminante, 'tipoRegistrante') || 'ASPIRANTE',
        nombreRegistrante: obtenerDato(caminante, 'nombreRegistrante'),
        telefonoRegistrante: normalizarCelularColombia(obtenerDato(caminante, 'telefonoRegistrante')),
        nombreCompleto: obtenerDato(caminante, 'nombreCompleto', 'nombre'),
        documentoIdentidad: obtenerDato(caminante, 'documentoIdentidad', 'documento', 'numeroDocumento'),
        direccionResidencia: obtenerDato(caminante, 'direccionResidencia', 'direccion'),
        fechaNacimiento: normalizarFecha(obtenerDato(caminante, 'fechaNacimiento')),
        barrio: obtenerDato(caminante, 'barrio'),
        parroquia: obtenerDato(caminante, 'parroquia'),
        telefono: obtenerDato(caminante, 'telefono'),
        celular: normalizarCelularColombia(obtenerDato(caminante, 'celular', 'telefono')),
        estadoCivil: obtenerDato(caminante, 'estadoCivil'),

        sufreEnfermedad: normalizarSiNo(obtenerDato(caminante, 'sufreEnfermedad')),
        enfermedadCual: obtenerDato(caminante, 'enfermedadCual'),
        tomaMedicamento: normalizarSiNo(obtenerDato(caminante, 'tomaMedicamento')),
        medicamentoCual: obtenerDato(caminante, 'medicamentoCual'),
        horariosMedicamentos: obtenerDato(caminante, 'horariosMedicamentos'),
        eps: obtenerDato(caminante, 'eps'),
        profesionOcupacion: obtenerDato(caminante, 'profesionOcupacion'),
        tieneLimitacionFisica: normalizarSiNo(obtenerDato(caminante, 'tieneLimitacionFisica')),
        limitacionCual: obtenerDato(caminante, 'limitacionCual'),

        sacramentosRecibidos: Array.isArray(sacramentos)
          ? sacramentos
          : String(sacramentos || '').split(',').map((item) => item.trim()).filter(Boolean),
        tallaCamisa: obtenerDato(caminante, 'tallaCamisa', 'tallaCamiseta'),

        contacto1Nombre: obtenerDato(caminante, 'contacto1Nombre', 'contacto1.nombre', 'contactos.0.nombre', 'contacto.nombre', 'contacto'),
        contacto1Parentesco: obtenerDato(caminante, 'contacto1Parentesco', 'contacto1.parentesco', 'contactos.0.parentesco'),
        contacto1Celular: normalizarCelularColombia(obtenerDato(caminante, 'contacto1Celular', 'contacto1.celular', 'contacto1.telefono', 'contactos.0.celular', 'contactos.0.telefono', 'telefonoContacto')),
        contacto2Nombre: obtenerDato(caminante, 'contacto2Nombre', 'contacto2.nombre', 'contactos.1.nombre'),
        contacto2Parentesco: obtenerDato(caminante, 'contacto2Parentesco', 'contacto2.parentesco', 'contactos.1.parentesco'),
        contacto2Celular: normalizarCelularColombia(obtenerDato(caminante, 'contacto2Celular', 'contacto2.celular', 'contacto2.telefono', 'contactos.1.celular', 'contactos.1.telefono')),

        comoSeEntero: obtenerDato(caminante, 'comoSeEntero'),
        nombrePersonaInvito: obtenerDato(caminante, 'nombrePersonaInvito'),
        celularPersonaInvito: normalizarCelularColombia(obtenerDato(caminante, 'celularPersonaInvito')),
        personaConocidaAsistira: normalizarSiNo(obtenerDato(caminante, 'personaConocidaAsistira')),
        nombrePersonaConocida: obtenerDato(caminante, 'nombrePersonaConocida'),
        autorizaTratamientoDatos: normalizarSiNo(obtenerDato(caminante, 'autorizaTratamientoDatos')),
        autorizaFotografias: normalizarSiNo(obtenerDato(caminante, 'autorizaFotografias')) || 'No',

        estadoPago: obtenerDato(caminante, 'estadoPago') || 'Pendiente',
        mesa: obtenerDato(caminante, 'mesa'),
        habitacion: obtenerDato(caminante, 'habitacion'),
        carta: obtenerDato(caminante, 'entregables.carta', 'carta') || 'Pendiente',
        foto: obtenerDato(caminante, 'entregables.foto', 'foto') || 'Pendiente',
      });
    } else {
      setForm(FORM_INICIAL);
    }

    setError('');
  }, [open, modo, caminante]);

  const edad = calcularEdad(form.fechaNacimiento);
  const esMenor = edad !== null && edad < 18;

  const estadosPago = opciones?.estadosPago || ['Pendiente', 'Pago Parcial', 'Pago Total'];
  const estadosEntregables = opciones?.estadosEntregables || ['Pendiente', 'En Proceso', 'Completado'];
  const mesas = opciones?.mesasDisponibles || [];
  const habitaciones = opciones?.habitacionesDisponibles || [];

  const puedeEnviar = useMemo(() => {
    const registranteValido = form.tipoRegistrante !== 'INVITADOR' || (
      form.nombreRegistrante.trim() &&
      esCelularColombiaValido(form.telefonoRegistrante, { requerido: true })
    );
    return Boolean(
      registranteValido &&
      form.nombreCompleto.trim() &&
      form.documentoIdentidad.trim() &&
      form.fechaNacimiento &&
      edad !== null &&
      edad >= 18 &&
      esCelularColombiaValido(form.celular, { requerido: true }) &&
      form.contacto1Nombre.trim() &&
      esCelularColombiaValido(form.contacto1Celular, { requerido: true }) &&
      form.contacto2Nombre.trim() &&
      esCelularColombiaValido(form.contacto2Celular, { requerido: true })
    );
  }, [form, edad]);

  function actualizarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarSacramento(sacramento) {
    setForm((actual) => {
      if (sacramento === 'Ninguno') {
        return { ...actual, sacramentosRecibidos: actual.sacramentosRecibidos.includes('Ninguno') ? [] : ['Ninguno'] };
      }
      const sinNinguno = actual.sacramentosRecibidos.filter((item) => item !== 'Ninguno');
      return {
        ...actual,
        sacramentosRecibidos: sinNinguno.includes(sacramento)
          ? sinNinguno.filter((item) => item !== sacramento)
          : [...sinNinguno, sacramento],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (esMenor) {
      setError('El caminante debe tener 18 años o más.');
      return;
    }

    if (!puedeEnviar) {
      setError('Complete los datos obligatorios, incluidos los dos contactos de emergencia.');
      return;
    }

    const datos = {
      ...form,
      nombre: form.nombreCompleto,
      telefono: form.celular,
      tallaCamiseta: form.tallaCamisa,
      contacto: {
        nombre: form.contacto1Nombre,
        parentesco: form.contacto1Parentesco,
        telefono: form.contacto1Celular,
      },
      contacto1: {
        nombre: form.contacto1Nombre,
        parentesco: form.contacto1Parentesco,
        celular: form.contacto1Celular,
      },
      contacto2: {
        nombre: form.contacto2Nombre,
        parentesco: form.contacto2Parentesco,
        celular: form.contacto2Celular,
      },
      entregables: {
        carta: form.carta,
        foto: form.foto,
      },
    };

    delete datos.edad;

    try {
      await onSubmit(datos);
    } catch (err) {
      setError(err.message || 'No fue posible guardar el caminante.');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle>{modo === 'editar' ? 'Editar caminante' : 'Registrar caminante'}</DialogTitle>

      <DialogContent>
        <Stack spacing={4} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}

          <Seccion titulo="Información personal">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField select label="¿Quién diligenció la inscripción?" value={form.tipoRegistrante} onChange={(e) => actualizarCampo('tipoRegistrante', e.target.value)} fullWidth>
                  <MenuItem value="ASPIRANTE">La persona que asistirá al retiro</MenuItem>
                  <MenuItem value="INVITADOR">Otra persona que regaló el retiro</MenuItem>
                </TextField>
              </Grid>
              {form.tipoRegistrante === 'INVITADOR' && <>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Nombre del registrante" value={form.nombreRegistrante} onChange={(e) => actualizarCampo('nombreRegistrante', e.target.value)} fullWidth required /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><CelularField label="Teléfono del registrante" value={form.telefonoRegistrante} onChange={(valor) => actualizarCampo('telefonoRegistrante', valor)} required /></Grid>
              </>}

              <Grid size={{ xs: 12 }}><TextField label="Nombre completo" value={form.nombreCompleto} onChange={(e) => actualizarCampo('nombreCompleto', e.target.value)} fullWidth required /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Documento de identidad" value={form.documentoIdentidad} onChange={(e) => actualizarCampo('documentoIdentidad', e.target.value)} fullWidth required /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField type="date" label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)} fullWidth required InputLabelProps={{ shrink: true }} error={esMenor} helperText={esMenor ? 'Debe tener 18 años o más.' : edad !== null ? `Edad: ${edad} años` : ''} /></Grid>
              <Grid size={{ xs: 12, md: 8 }}><TextField label="Dirección de residencia" value={form.direccionResidencia} onChange={(e) => actualizarCampo('direccionResidencia', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Barrio" value={form.barrio} onChange={(e) => actualizarCampo('barrio', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Parroquia a la que asiste" value={form.parroquia} onChange={(e) => actualizarCampo('parroquia', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Teléfono" value={form.telefono} onChange={(e) => actualizarCampo('telefono', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><CelularField label="Celular" value={form.celular} onChange={(valor) => actualizarCampo('celular', valor)} required /></Grid>
              <Grid size={{ xs: 12 }}><TextField select label="Estado civil" value={form.estadoCivil} onChange={(e) => actualizarCampo('estadoCivil', e.target.value)} fullWidth><MenuItem value="">Seleccione</MenuItem>{['Soltero(a)', 'Casado(a)', 'Unión libre', 'Separado(a)', 'Divorciado(a)', 'Viudo(a)'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            </Grid>
          </Seccion>

          <Seccion titulo="Salud">
            <Grid container spacing={2}>
              {[['sufreEnfermedad', '¿Sufre alguna enfermedad?'], ['tomaMedicamento', '¿Toma algún medicamento?'], ['tieneLimitacionFisica', '¿Tiene alguna limitación física?']].map(([campo, etiqueta]) => (
                <Grid size={{ xs: 12 }} key={campo}>
                  <FormControl><FormLabel>{etiqueta}</FormLabel><RadioGroup row value={form[campo]} onChange={(e) => actualizarCampo(campo, e.target.value)}><FormControlLabel value="Sí" control={<Radio />} label="Sí" /><FormControlLabel value="No" control={<Radio />} label="No" /></RadioGroup></FormControl>
                </Grid>
              ))}
              {form.sufreEnfermedad === 'Sí' && <Grid size={{ xs: 12 }}><TextField label="¿Cuál enfermedad?" value={form.enfermedadCual} onChange={(e) => actualizarCampo('enfermedadCual', e.target.value)} fullWidth /></Grid>}
              {form.tomaMedicamento === 'Sí' && <><Grid size={{ xs: 12 }}><TextField label="¿Cuál medicamento?" value={form.medicamentoCual} onChange={(e) => actualizarCampo('medicamentoCual', e.target.value)} fullWidth /></Grid><Grid size={{ xs: 12 }}><TextField label="Horarios de los medicamentos" value={form.horariosMedicamentos} onChange={(e) => actualizarCampo('horariosMedicamentos', e.target.value)} fullWidth multiline minRows={2} /></Grid></>}
              <Grid size={{ xs: 12, md: 6 }}><TextField label="EPS" value={form.eps} onChange={(e) => actualizarCampo('eps', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Profesión u ocupación" value={form.profesionOcupacion} onChange={(e) => actualizarCampo('profesionOcupacion', e.target.value)} fullWidth /></Grid>
              {form.tieneLimitacionFisica === 'Sí' && <Grid size={{ xs: 12 }}><TextField label="¿Cuál limitación?" value={form.limitacionCual} onChange={(e) => actualizarCampo('limitacionCual', e.target.value)} fullWidth /></Grid>}
            </Grid>
          </Seccion>

          <Seccion titulo="Información general">
            <Stack spacing={2}>
              <FormControl><FormLabel>Sacramentos recibidos</FormLabel><Grid container>{SACRAMENTOS.map((item) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item}><FormControlLabel control={<Checkbox checked={form.sacramentosRecibidos.includes(item)} onChange={() => cambiarSacramento(item)} />} label={item} /></Grid>)}</Grid></FormControl>
              <TextField select label="Talla de camisa tipo polo" value={form.tallaCamisa} onChange={(e) => actualizarCampo('tallaCamisa', e.target.value)} fullWidth><MenuItem value="">Seleccione</MenuItem>{TALLAS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
            </Stack>
          </Seccion>

          <Seccion titulo="Emergencia">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}><Typography fontWeight={800}>Contacto de emergencia 1</Typography></Grid>
              <Grid size={{ xs: 12, md: 5 }}><TextField label="Nombre" value={form.contacto1Nombre} onChange={(e) => actualizarCampo('contacto1Nombre', e.target.value)} fullWidth required /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Parentesco" value={form.contacto1Parentesco} onChange={(e) => actualizarCampo('contacto1Parentesco', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><CelularField label="Celular" value={form.contacto1Celular} onChange={(valor) => actualizarCampo('contacto1Celular', valor)} required /></Grid>
              <Grid size={{ xs: 12 }}><Typography fontWeight={800}>Contacto de emergencia 2</Typography></Grid>
              <Grid size={{ xs: 12, md: 5 }}><TextField label="Nombre" value={form.contacto2Nombre} onChange={(e) => actualizarCampo('contacto2Nombre', e.target.value)} fullWidth required /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Parentesco" value={form.contacto2Parentesco} onChange={(e) => actualizarCampo('contacto2Parentesco', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><CelularField label="Celular" value={form.contacto2Celular} onChange={(valor) => actualizarCampo('contacto2Celular', valor)} required /></Grid>
            </Grid>
          </Seccion>

          <Seccion titulo="Información del retiro">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}><TextField label="¿Cómo se enteró del retiro?" value={form.comoSeEntero} onChange={(e) => actualizarCampo('comoSeEntero', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Nombre de quien lo invitó" value={form.nombrePersonaInvito} onChange={(e) => actualizarCampo('nombrePersonaInvito', e.target.value)} fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><CelularField label="Celular de quien lo invitó" value={form.celularPersonaInvito} onChange={(valor) => actualizarCampo('celularPersonaInvito', valor)} /></Grid>
              <Grid size={{ xs: 12 }}><FormControl><FormLabel>¿Alguna persona conocida asistirá al mismo retiro?</FormLabel><RadioGroup row value={form.personaConocidaAsistira} onChange={(e) => actualizarCampo('personaConocidaAsistira', e.target.value)}><FormControlLabel value="Sí" control={<Radio />} label="Sí" /><FormControlLabel value="No" control={<Radio />} label="No" /></RadioGroup></FormControl></Grid>
              {form.personaConocidaAsistira === 'Sí' && <Grid size={{ xs: 12 }}><TextField label="Nombre de la persona conocida" value={form.nombrePersonaConocida} onChange={(e) => actualizarCampo('nombrePersonaConocida', e.target.value)} fullWidth /></Grid>}
              <Grid size={{ xs: 12, md: 4 }}><TextField select label="Estado de pago" value={form.estadoPago} onChange={(e) => actualizarCampo('estadoPago', e.target.value)} fullWidth>{estadosPago.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField select label="Estado de carta" value={form.carta} onChange={(e) => actualizarCampo('carta', e.target.value)} fullWidth>{estadosEntregables.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField select label="Estado de foto" value={form.foto} onChange={(e) => actualizarCampo('foto', e.target.value)} fullWidth>{estadosEntregables.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField select label="Mesa" value={form.mesa} onChange={(e) => actualizarCampo('mesa', e.target.value)} fullWidth><MenuItem value="">Sin asignar</MenuItem>{mesas.map((item) => <MenuItem key={item.id || item} value={item.nombre || item.numero || item}>{item.nombre || item.numero || item}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField select label="Habitación" value={form.habitacion} onChange={(e) => actualizarCampo('habitacion', e.target.value)} fullWidth><MenuItem value="">Sin asignar</MenuItem>{habitaciones.map((item) => <MenuItem key={item.id || item} value={item.nombre || item.numero || item}>{item.nombre || item.numero || item}</MenuItem>)}</TextField></Grid>
            </Grid>
          </Seccion>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={loading || !puedeEnviar} startIcon={loading ? <CircularProgress size={18} /> : null}>
          {modo === 'editar' ? 'Guardar cambios' : 'Registrar caminante'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
