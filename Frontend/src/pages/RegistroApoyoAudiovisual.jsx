import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ChurchRounded from '@mui/icons-material/ChurchRounded';
import DirectionsCarRounded from '@mui/icons-material/DirectionsCarRounded';
import TwoWheelerRounded from '@mui/icons-material/TwoWheelerRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';
import PublicNavbar from '../components/publico/PublicNavbar';
import PublicFooter from '../components/publico/PublicFooter';
import { registrarApoyoAudiovisualPublico } from '../api/publicApi';
import '../styles/portalPublico.css';

const FORM_INICIAL = {
  realizoEmaus: '',
  parroquiaEmaus: '',
  ciudadEmaus: '',
  paisEmaus: 'Colombia',
  anioEmaus: '',
  nombreCompleto: '',
  documento: '',
  celular: '',
  correo: '',
  tipoTransporte: '',
  deseaLlevarAlguien: '',
  cuposDisponibles: '',
  lugarSalida: '',
  horaSalida: '',
  observaciones: '',
  aceptaDeclaracion: false,
};

function OpcionGrande({ selected, icono, titulo, texto, onClick, disabled = false }) {
  return (
    <Paper
      variant="outlined"
      onClick={disabled ? undefined : onClick}
      sx={{
        p: 2,
        borderRadius: 3.5,
        cursor: disabled ? 'default' : 'pointer',
        borderColor: selected ? '#176b58' : 'rgba(20,75,62,.13)',
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? '#edf8f3' : '#fff',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
        '&:hover': disabled ? {} : {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 28px rgba(17,48,41,.08)',
          borderColor: '#176b58',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: 2.7,
          display: 'grid',
          placeItems: 'center',
          bgcolor: selected ? '#176b58' : '#edf8f3',
          color: selected ? '#fff' : '#176b58',
          flexShrink: 0,
        }}>
          {icono}
        </Box>
        <Box flex={1}>
          <Typography fontWeight={950}>{titulo}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .25 }}>{texto}</Typography>
        </Box>
        <Radio checked={selected} disabled={disabled} />
      </Stack>
    </Paper>
  );
}

export default function RegistroApoyoAudiovisual() {
  const navigate = useNavigate();
  const { solicitarAutenticacion } = useAuth();
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const parroquiaEmausRef = useRef(null);

  const vaEnVehiculo = ['Carro', 'Moto'].includes(form.tipoTransporte);
  const quiereLlevar = vaEnVehiculo && form.deseaLlevarAlguien === 'Sí';
  const celularLimpio = String(form.celular || '').replace(/\D/g, '');
  const celularInvalido = celularLimpio.length > 0 && !/^3\d{9}$/.test(celularLimpio);
  const realizoEmaus = form.realizoEmaus === 'Sí';

  const formularioValido = useMemo(() => {
    if (!realizoEmaus) return false;
    if (!form.parroquiaEmaus.trim() || !form.ciudadEmaus.trim()) return false;
    if (!form.nombreCompleto.trim()) return false;
    if (!/^3\d{9}$/.test(String(form.celular).replace(/\D/g, ''))) return false;
    if (!['Carro', 'Moto', 'Sin vehículo'].includes(form.tipoTransporte)) return false;
    if (vaEnVehiculo && !form.lugarSalida.trim()) return false;
    if (vaEnVehiculo && !form.horaSalida) return false;
    if (vaEnVehiculo && !['Sí', 'No'].includes(form.deseaLlevarAlguien)) return false;
    if (quiereLlevar) {
      const cupos = Number(form.cuposDisponibles);
      const maximo = form.tipoTransporte === 'Moto' ? 1 : 4;
      if (!Number.isFinite(cupos) || cupos < 1 || cupos > maximo) return false;
    }
    return Boolean(form.aceptaDeclaracion);
  }, [form, realizoEmaus, vaEnVehiculo, quiereLlevar]);

  function cambiar(campo, valor) {
    setForm(actual => {
      const siguiente = { ...actual, [campo]: valor };

      if (campo === 'tipoTransporte') {
        siguiente.deseaLlevarAlguien = '';
        siguiente.cuposDisponibles = '';

        if (valor === 'Sin vehículo') {
          siguiente.lugarSalida = '';
          siguiente.horaSalida = '';
        }
      }

      if (campo === 'deseaLlevarAlguien' && valor === 'No') {
        siguiente.cuposDisponibles = '';
      }

      return siguiente;
    });
    setError('');
  }

  function cambiarExperienciaEmaus(valor) {
    const posicionActual =
      typeof window !== 'undefined'
        ? window.scrollY
        : 0;

    cambiar('realizoEmaus', valor);

    if (valor !== 'Sí') return;

    /*
     * Al desplegar el resto del formulario el navegador puede aplicar
     * scroll anchoring y saltar hacia abajo. Conservamos explícitamente
     * la posición actual y enfocamos el primer campo sin desplazar la vista.
     */
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: posicionActual,
          left: 0,
          behavior: 'auto',
        });

        parroquiaEmausRef.current?.focus({
          preventScroll: true,
        });
      });
    });
  }

  async function enviar(event) {
    event.preventDefault();
    if (!formularioValido || enviando) return;

    try {
      setEnviando(true);
      setError('');
      await registrarApoyoAudiovisualPublico(form);
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err?.message || 'No fue posible registrar tu inscripción.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Box className="public-page" sx={{ minHeight: '100vh', bgcolor: '#f7f6f0' }}>
      <PublicNavbar onLogin={() => solicitarAutenticacion()} />

      <Box component="main" sx={{ pt: { xs: '70px', md: '82px' } }}>
        <Box sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #fffaf0 0%, #f5efe3 55%, #eaf5ef 100%)',
          borderBottom: '1px solid rgba(23,75,64,.08)',
        }}>
          <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate('/')}
              sx={{ color: '#174b40', fontWeight: 850, mb: 2 }}
            >
              Volver al inicio
            </Button>

            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <Chip
                    icon={<VolunteerActivismRounded />}
                    label="QUIERO SERVIR"
                    sx={{ bgcolor: '#e4f3eb', color: '#176b58', fontWeight: 950, letterSpacing: '.08em' }}
                  />
                </Stack>
                <Typography variant="h2" fontWeight={950} sx={{ fontSize: { xs: '2.35rem', md: '4rem' }, color: '#10231f', lineHeight: 1.03 }}>
                  Quiero participar en la serenata
                </Typography>
                <Typography sx={{ mt: 1.5, maxWidth: 760, color: 'text.secondary', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.75 }}>
                  Si ya viviste un Retiro de Emaús, puedes ayudarnos en un momento especial poniendo tu tiempo y disposición al servicio de esta experiencia.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,.82)', border: '1px solid rgba(23,75,64,.10)', backdropFilter: 'blur(10px)' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 54, height: 54, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#176b58', color: '#fff' }}>
                      <ChurchRounded />
                    </Box>
                    <Box>
                      <Typography fontWeight={950}>Requisito para servir</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>
                        Haber vivido previamente un Retiro de Emaús, incluso si fue hace muchos años o en otra parroquia, ciudad o país.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          {enviado ? (
            <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 5, textAlign: 'center', border: '1px solid rgba(23,107,88,.14)', boxShadow: '0 20px 55px rgba(17,48,41,.08)' }}>
              <Box sx={{ width: 76, height: 76, mx: 'auto', borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#edf8f3', color: '#176b58' }}>
                <CheckCircleRounded sx={{ fontSize: 42 }} />
              </Box>
              <Typography variant="h4" fontWeight={950} mt={2}>¡Gracias por querer participar!</Typography>
              <Typography color="text.secondary" mt={1.2} mx="auto" maxWidth={620} lineHeight={1.7}>
                Recibimos tu inscripción para participar en la serenata. El equipo organizador revisará la información y se pondrá en contacto contigo con las indicaciones necesarias.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 3, borderRadius: 999, px: 3 }}>
                Volver al inicio
              </Button>
            </Paper>
          ) : (
            <Box component="form" onSubmit={enviar} sx={{ overflowAnchor: 'none' }}>
              <Stack spacing={2.25}>
                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 5, border: '1px solid rgba(20,75,62,.11)', boxShadow: '0 14px 38px rgba(17,48,41,.055)' }}>
                  <Stack direction="row" spacing={1.3} alignItems="center" mb={2}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: '#edf8f3', color: '#176b58' }}><ChurchRounded /></Box>
                    <Box>
                      <Typography variant="overline" color="primary.main" fontWeight={950} letterSpacing=".1em">PASO 1</Typography>
                      <Typography variant="h5" fontWeight={950}>Tu experiencia en Emaús</Typography>
                    </Box>
                  </Stack>

                  <Typography color="text.secondary" mb={2}>No importa si lo viviste hace muchos años o en otra comunidad.</Typography>

                  <RadioGroup
                    value={form.realizoEmaus}
                    onChange={e => cambiarExperienciaEmaus(e.target.value)}
                  >
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <OpcionGrande
                          selected={form.realizoEmaus === 'Sí'}
                          icono={<FavoriteRounded />}
                          titulo="Sí, ya viví Emaús"
                          texto="Puedo continuar con mi inscripción para participar en la serenata."
                          onClick={() => cambiarExperienciaEmaus('Sí')}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <OpcionGrande
                          selected={form.realizoEmaus === 'No'}
                          icono={<ChurchRounded />}
                          titulo="No, todavía no"
                          texto="Primero es necesario vivir el retiro antes de participar en la serenata."
                          onClick={() => cambiarExperienciaEmaus('No')}
                        />
                      </Grid>
                    </Grid>
                  </RadioGroup>

                  {form.realizoEmaus === 'No' && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 3 }}>
                      Para participar en la serenata es necesario haber vivido previamente un Retiro de Emaús.
                    </Alert>
                  )}

                  {realizoEmaus && (
                    <Grid container spacing={2} mt={.5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField inputRef={parroquiaEmausRef} fullWidth required label="Parroquia o comunidad donde viviste Emaús" value={form.parroquiaEmaus} onChange={e => cambiar('parroquiaEmaus', e.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth required label="Ciudad" value={form.ciudadEmaus} onChange={e => cambiar('ciudadEmaus', e.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="País" value={form.paisEmaus} onChange={e => cambiar('paisEmaus', e.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Año aproximado" inputProps={{ maxLength: 4, inputMode: 'numeric' }} value={form.anioEmaus} onChange={e => cambiar('anioEmaus', e.target.value.replace(/\D/g, '').slice(0, 4))} helperText="No es obligatorio recordar la fecha exacta." />
                      </Grid>
                    </Grid>
                  )}
                </Paper>

                {realizoEmaus && (
                  <>
                    <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 5, border: '1px solid rgba(20,75,62,.11)', boxShadow: '0 14px 38px rgba(17,48,41,.055)' }}>
                      <Stack direction="row" spacing={1.3} alignItems="center" mb={2.2}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: '#eef6fa', color: '#315f78' }}><GroupsRounded /></Box>
                        <Box>
                          <Typography variant="overline" color="#315f78" fontWeight={950} letterSpacing=".1em">PASO 2</Typography>
                          <Typography variant="h5" fontWeight={950}>Cuéntanos quién eres</Typography>
                        </Box>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label="Nombre completo" value={form.nombreCompleto} onChange={e => cambiar('nombreCompleto', e.target.value)} /></Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            required
                            label="Celular"
                            value={form.celular}
                            inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                            onChange={e => cambiar('celular', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            error={celularInvalido}
                            helperText={
                              celularInvalido
                                ? 'El celular debe iniciar por 3 y tener exactamente 10 dígitos.'
                                : 'Debe iniciar por 3 y tener 10 dígitos.'
                            }
                          />
                        </Grid>
                      </Grid>
                    </Paper>

                    <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 5, border: '1px solid rgba(20,75,62,.11)', boxShadow: '0 14px 38px rgba(17,48,41,.055)' }}>
                      <Stack direction="row" spacing={1.3} alignItems="center" mb={2.2}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: '#fff8e8', color: '#9a6a08' }}><VolunteerActivismRounded /></Box>
                        <Box>
                          <Typography variant="overline" color="#9a6a08" fontWeight={950} letterSpacing=".1em">PASO 3</Typography>
                          <Typography variant="h5" fontWeight={950}>¿Cómo te vas a transportar?</Typography>
                        </Box>
                      </Stack>

                      <Typography fontWeight={900} mb={1.2}>¿Cómo vas a desplazarte? *</Typography>
                      <Grid container spacing={1.5} mb={vaEnVehiculo ? 2 : 0}>
                        {[
                          {
                            valor: 'Carro',
                            titulo: 'Voy en carro',
                            texto: 'Podemos organizar cupos y apoyar la movilidad de otros Angelitos.',
                            icono: <DirectionsCarRounded />,
                          },
                          {
                            valor: 'Moto',
                            titulo: 'Voy en moto',
                            texto: 'Indícanos tu punto y hora de salida para coordinar mejor.',
                            icono: <TwoWheelerRounded />,
                          },
                          {
                            valor: 'Sin vehículo',
                            titulo: 'Voy sin vehículo',
                            texto: 'No llevaré vehículo propio para este servicio.',
                            icono: <GroupsRounded />,
                          },
                        ].map(opcion => (
                          <Grid key={opcion.valor} size={{ xs: 12, md: 4 }}>
                            <OpcionGrande
                              selected={form.tipoTransporte === opcion.valor}
                              icono={opcion.icono}
                              titulo={opcion.titulo}
                              texto={opcion.texto}
                              onClick={() => cambiar('tipoTransporte', opcion.valor)}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      {vaEnVehiculo && (
                        <Stack spacing={2} mt={2}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 7 }}>
                              <TextField
                                fullWidth
                                required
                                label="¿Desde dónde sales?"
                                value={form.lugarSalida}
                                onChange={e => cambiar('lugarSalida', e.target.value)}
                                InputProps={{ startAdornment: <LocationOnRounded sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                helperText="Barrio, sector o punto de referencia."
                              />
                            </Grid>

                            <Grid size={{ xs: 12, md: 5 }}>
                              <TextField
                                fullWidth
                                required
                                type="time"
                                label="Hora de salida"
                                value={form.horaSalida}
                                onChange={e => cambiar('horaSalida', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                helperText="Hora aproximada en la que iniciarás el recorrido."
                              />
                            </Grid>
                          </Grid>

                          <Box>
                            <Typography fontWeight={900} mb={1.1}>
                              ¿Deseas llevar a alguien más? *
                            </Typography>
                            <RadioGroup
                              row
                              value={form.deseaLlevarAlguien}
                              onChange={e => cambiar('deseaLlevarAlguien', e.target.value)}
                            >
                              <FormControlLabel
                                value="Sí"
                                control={<Radio />}
                                label="Sí, puedo ayudar con transporte"
                              />
                              <FormControlLabel
                                value="No"
                                control={<Radio />}
                                label="No llevaré a otras personas"
                              />
                            </RadioGroup>
                          </Box>

                          {quiereLlevar && (
                            <TextField
                              select
                              required
                              fullWidth
                              label="¿Cuántos cupos puedes ofrecer?"
                              value={form.cuposDisponibles}
                              onChange={e => cambiar('cuposDisponibles', e.target.value)}
                              helperText={
                                form.tipoTransporte === 'Moto'
                                  ? 'En moto puedes registrar máximo 1 cupo adicional.'
                                  : 'En carro puedes registrar máximo 4 cupos.'
                              }
                            >
                              {Array.from(
                                { length: form.tipoTransporte === 'Moto' ? 1 : 4 },
                                (_, indice) => indice + 1
                              ).map(cupo => (
                                <MenuItem key={cupo} value={String(cupo)}>
                                  {cupo} {cupo === 1 ? 'cupo' : 'cupos'}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        </Stack>
                      )}

                      <TextField
                        fullWidth multiline minRows={3}
                        label="Observaciones (opcional)"
                        value={form.observaciones}
                        onChange={e => cambiar('observaciones', e.target.value)}
                        sx={{ mt: 2.5 }}
                        placeholder="Cuéntanos algo que debamos tener en cuenta para organizar tu participación."
                      />
                    </Paper>

                    <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(23,107,88,.13)', bgcolor: '#fbfdfb' }}>
                      <FormControlLabel
                        control={<Checkbox checked={form.aceptaDeclaracion} onChange={e => cambiar('aceptaDeclaracion', e.target.checked)} />}
                        label="Declaro que la información suministrada es verdadera y confirmo que he vivido previamente un Retiro de Emaús."
                      />
                    </Paper>

                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.2}>
                      <Button variant="outlined" onClick={() => navigate('/')} sx={{ borderRadius: 999, px: 3 }}>Cancelar</Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={!formularioValido || enviando}
                        endIcon={<ArrowForwardRounded />}
                        sx={{ borderRadius: 999, px: 3.5, py: 1.25, fontWeight: 900 }}
                      >
                        {enviando ? 'Enviando...' : 'Enviar inscripción'}
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Box>
          )}
        </Container>
      </Box>

      <PublicFooter />
      <LoginDialog />
    </Box>
  );
}
