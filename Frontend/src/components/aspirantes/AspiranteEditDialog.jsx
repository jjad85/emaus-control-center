import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

const OPCIONES_SI_NO = ['Sí', 'No'];
const txt = (v) => v == null ? '' : String(v);

function fecha(v) {
  if (!v) return '';
  const s = String(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const f = new Date(v);
  if (Number.isNaN(f.getTime())) return '';
  return `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}`;
}

function inicial(aspirante) {
  const a = aspirante || {};

  return {
    primerNombre: txt(a.primerNombre), segundoNombre: txt(a.segundoNombre),
    primerApellido: txt(a.primerApellido), segundoApellido: txt(a.segundoApellido),
    documentoIdentidad: txt(a.documentoIdentidad), fechaNacimiento: fecha(a.fechaNacimiento),
    direccionResidencia: txt(a.direccionResidencia), barrio: txt(a.barrio),
    parroquia: txt(a.parroquia), telefono: txt(a.telefono), celular: txt(a.celular),
    estadoCivil: txt(a.estadoCivil), profesionOcupacion: txt(a.profesionOcupacion),
    eps: txt(a.eps), sufreEnfermedad: txt(a.sufreEnfermedad),
    enfermedadCual: txt(a.enfermedadCual), tomaMedicamento: txt(a.tomaMedicamento),
    medicamentoCual: txt(a.medicamentoCual), horariosMedicamentos: txt(a.horariosMedicamentos),
    tieneLimitacionFisica: txt(a.tieneLimitacionFisica), limitacionCual: txt(a.limitacionCual),
    tieneCondicionAlimentaria: txt(a.tieneCondicionAlimentaria),
    alergiasAlimentarias: txt(a.alergiasAlimentarias || a.alergias),
    restriccionesAlimentarias: txt(a.restriccionesAlimentarias),
    preferenciasAlimentarias: txt(a.preferenciasAlimentarias),
    dietaEspecial: txt(a.dietaEspecial), sacramentosRecibidos: txt(a.sacramentosRecibidos),
    tallaCamisa: txt(a.tallaCamisa), contacto1Nombre: txt(a.contacto1Nombre),
    contacto1Parentesco: txt(a.contacto1Parentesco), contacto1Celular: txt(a.contacto1Celular),
    contacto2Nombre: txt(a.contacto2Nombre), contacto2Parentesco: txt(a.contacto2Parentesco),
    contacto2Celular: txt(a.contacto2Celular), comoSeEntero: txt(a.comoSeEntero),
    nombrePersonaInvito: txt(a.nombrePersonaInvito), celularPersonaInvito: txt(a.celularPersonaInvito),
    personaConocidaAsistira: txt(a.personaConocidaAsistira),
    nombrePersonaConocida: txt(a.nombrePersonaConocida),
  };
}

function Seccion({titulo, children}) {
  return <Stack spacing={1.5}>
    <Typography variant="subtitle1" fontWeight={900} color="primary.main">{titulo}</Typography>
    <Grid container spacing={1.5}>{children}</Grid>
  </Stack>;
}

export default function AspiranteEditDialog({open, aspirante, loading, onClose, onSave}) {
  const [form,setForm] = useState(() => inicial(aspirante));
  const [error,setError] = useState('');
  const [confirmar,setConfirmar] = useState(false);

  useEffect(()=>{ if(open){ setForm(inicial(aspirante)); setError(''); setConfirmar(false);} },[open,aspirante]);

  const celOk = useMemo(()=>/^3\d{9}$/.test(String(form.celular||'').replace(/\D/g,'')),[form.celular]);
  const c1Ok = /^3\d{9}$/.test(String(form.contacto1Celular||'').replace(/\D/g,''));
  const c2Ok = /^3\d{9}$/.test(String(form.contacto2Celular||'').replace(/\D/g,''));

  function set(campo, valor){ setForm(a=>({...a,[campo]:valor})); if(error)setError(''); }

  function validar(){
    if(!form.primerNombre.trim()) return 'El primer nombre es obligatorio.';
    if(!form.primerApellido.trim()) return 'El primer apellido es obligatorio.';
    if(!form.documentoIdentidad.trim()) return 'El documento es obligatorio.';
    if(!form.fechaNacimiento) return 'La fecha de nacimiento es obligatoria.';
    if(!form.direccionResidencia.trim()) return 'La dirección es obligatoria.';
    if(!form.barrio.trim()) return 'El barrio es obligatorio.';
    if(!celOk) return 'El celular debe tener 10 dígitos y comenzar por 3.';
    if(!form.estadoCivil.trim()) return 'El estado civil es obligatorio.';
    if(!form.contacto1Nombre.trim() || !form.contacto2Nombre.trim()) return 'Los dos contactos de emergencia son obligatorios.';
    if(!c1Ok || !c2Ok) return 'Los celulares de los contactos deben tener 10 dígitos y comenzar por 3.';
    return '';
  }

  function datos(){
    return {
      ...aspirante, ...form,
      celular:String(form.celular||'').replace(/\D/g,''),
      contacto1Celular:String(form.contacto1Celular||'').replace(/\D/g,''),
      contacto2Celular:String(form.contacto2Celular||'').replace(/\D/g,''),
      celularPersonaInvito:String(form.celularPersonaInvito||'').replace(/\D/g,''),
    };
  }

  async function guardar(){
    const e=validar(); if(e){setError(e);return;}
    if(!form.segundoApellido.trim()){setConfirmar(true);return;}
    await onSave(datos());
  }

  return <>
    <Dialog open={open} onClose={loading?undefined:onClose} fullWidth maxWidth="lg">
      <DialogTitle component="div">
        <Typography variant="h6" component="div" fontWeight={900}>
          Editar aspirante
        </Typography>
        <Typography variant="body2" component="div" color="text.secondary">
          {aspirante?.numeroInscripcion || ''}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {error&&<Alert severity="error">{error}</Alert>}
          <Seccion titulo="Información personal">
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Primer nombre" value={form.primerNombre} onChange={e=>set('primerNombre',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Segundo nombre" value={form.segundoNombre} onChange={e=>set('segundoNombre',e.target.value)} helperText="Opcional"/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Primer apellido" value={form.primerApellido} onChange={e=>set('primerApellido',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Segundo apellido" value={form.segundoApellido} onChange={e=>set('segundoApellido',e.target.value)} helperText="Opcional. Si queda vacío se pedirá confirmación."/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Documento" value={form.documentoIdentidad} onChange={e=>set('documentoIdentidad',e.target.value.replace(/\D/g,''))}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required type="date" label="Fecha de nacimiento" InputLabelProps={{shrink:true}} value={form.fechaNacimiento} onChange={e=>set('fechaNacimiento',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Dirección" value={form.direccionResidencia} onChange={e=>set('direccionResidencia',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Barrio" value={form.barrio} onChange={e=>set('barrio',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Parroquia" value={form.parroquia} onChange={e=>set('parroquia',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Teléfono" value={form.telefono} onChange={e=>set('telefono',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Celular" value={form.celular} onChange={e=>set('celular',e.target.value.replace(/\D/g,'').slice(0,10))} error={Boolean(form.celular)&&!celOk}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Estado civil" value={form.estadoCivil} onChange={e=>set('estadoCivil',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Profesión / ocupación" value={form.profesionOcupacion} onChange={e=>set('profesionOcupacion',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="EPS" value={form.eps} onChange={e=>set('eps',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Talla de camisa" value={form.tallaCamisa} onChange={e=>set('tallaCamisa',e.target.value)}/></Grid>
          </Seccion>
          <Seccion titulo="Salud y alimentación">
            {[
              ['sufreEnfermedad','¿Sufre alguna enfermedad?'],
              ['tomaMedicamento','¿Toma medicamentos?'],
              ['tieneLimitacionFisica','¿Tiene limitación física?'],
              ['tieneCondicionAlimentaria','¿Tiene condición alimentaria?'],
            ].map(([campo,etiqueta])=><Grid key={campo} size={{xs:12,md:6}}>
              <TextField select fullWidth label={etiqueta} value={form[campo]} onChange={e=>set(campo,e.target.value)}>
                <MenuItem value="">Seleccione</MenuItem>{OPCIONES_SI_NO.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}
              </TextField>
            </Grid>)}
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Enfermedad" value={form.enfermedadCual} onChange={e=>set('enfermedadCual',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Medicamento" value={form.medicamentoCual} onChange={e=>set('medicamentoCual',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Horario medicamentos" value={form.horariosMedicamentos} onChange={e=>set('horariosMedicamentos',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Limitación" value={form.limitacionCual} onChange={e=>set('limitacionCual',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Alergias" value={form.alergiasAlimentarias} onChange={e=>set('alergiasAlimentarias',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Restricciones" value={form.restriccionesAlimentarias} onChange={e=>set('restriccionesAlimentarias',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Preferencias" value={form.preferenciasAlimentarias} onChange={e=>set('preferenciasAlimentarias',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Dieta especial" value={form.dietaEspecial} onChange={e=>set('dietaEspecial',e.target.value)}/></Grid>
          </Seccion>
          <Seccion titulo="Contactos de emergencia">
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Contacto 1 - Nombre" value={form.contacto1Nombre} onChange={e=>set('contacto1Nombre',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Contacto 1 - Parentesco" value={form.contacto1Parentesco} onChange={e=>set('contacto1Parentesco',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Contacto 1 - Celular" value={form.contacto1Celular} onChange={e=>set('contacto1Celular',e.target.value.replace(/\D/g,'').slice(0,10))}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Contacto 2 - Nombre" value={form.contacto2Nombre} onChange={e=>set('contacto2Nombre',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Contacto 2 - Parentesco" value={form.contacto2Parentesco} onChange={e=>set('contacto2Parentesco',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Contacto 2 - Celular" value={form.contacto2Celular} onChange={e=>set('contacto2Celular',e.target.value.replace(/\D/g,'').slice(0,10))}/></Grid>
          </Seccion>
          <Seccion titulo="Información del retiro">
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Sacramentos recibidos" value={form.sacramentosRecibidos} onChange={e=>set('sacramentosRecibidos',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Cómo se enteró" value={form.comoSeEntero} onChange={e=>set('comoSeEntero',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Nombre de quien lo invitó" value={form.nombrePersonaInvito} onChange={e=>set('nombrePersonaInvito',e.target.value)}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Celular de quien lo invitó" value={form.celularPersonaInvito} onChange={e=>set('celularPersonaInvito',e.target.value.replace(/\D/g,'').slice(0,10))}/></Grid>
            <Grid size={{xs:12,md:6}}><TextField select fullWidth label="¿Asistirá una persona conocida?" value={form.personaConocidaAsistira} onChange={e=>set('personaConocidaAsistira',e.target.value)}><MenuItem value="">Seleccione</MenuItem>{OPCIONES_SI_NO.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Grid>
            <Grid size={{xs:12,md:6}}><TextField fullWidth label="Nombre de persona conocida" value={form.nombrePersonaConocida} onChange={e=>set('nombrePersonaConocida',e.target.value)}/></Grid>
          </Seccion>
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={loading}>Cancelar</Button><Button variant="contained" onClick={guardar} disabled={loading}>{loading?'Guardando…':'Guardar cambios'}</Button></DialogActions>
    </Dialog>
    <Dialog open={confirmar} onClose={()=>setConfirmar(false)} fullWidth maxWidth="sm">
      <DialogTitle>Confirma el segundo apellido</DialogTitle>
      <DialogContent dividers><Alert severity="warning" sx={{mb:2}}>El campo <strong>Segundo apellido</strong> está vacío.</Alert><Typography>Confirma que este aspirante realmente tiene un solo apellido.</Typography></DialogContent>
      <DialogActions><Button onClick={()=>setConfirmar(false)}>Volver y completar</Button><Button variant="contained" color="warning" onClick={async()=>{setConfirmar(false);await onSave(datos());}}>Confirmo que tiene un solo apellido</Button></DialogActions>
    </Dialog>
  </>;
}
