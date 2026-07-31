import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import Diversity3Rounded from '@mui/icons-material/Diversity3Rounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';

import { useAuth } from '../auth/AuthContext';
import LoginDialog from '../auth/LoginDialog';
import { useApi } from '../hooks/useApi';
import { obtenerPortalPublico } from '../api/publicApi';
import PublicNavbar from '../components/publico/PublicNavbar';
import PublicFooter from '../components/publico/PublicFooter';
import '../styles/portalPublico.css';

const pilares = [
  {
    icono: <FavoriteRounded />,
    titulo: 'Encuentro',
    texto: 'Un espacio para detenerse, escuchar y permitir que Dios vuelva a caminar a nuestro lado.',
  },
  {
    icono: <Diversity3Rounded />,
    titulo: 'Comunidad',
    texto: 'La experiencia no termina el domingo. Continúa en una comunidad que acompaña y sostiene.',
  },
  {
    icono: <VolunteerActivismRounded />,
    titulo: 'Servicio',
    texto: 'Lo recibido se transforma en disponibilidad, fraternidad y servicio a quienes vienen detrás.',
  },
];

const pasos = [
  ['01', 'La invitación', 'Alguien de la comunidad te invita a abrir un espacio distinto en medio de la rutina.'],
  ['02', 'El retiro', 'Tres días para escuchar, compartir y vivir un encuentro personal, sin revelar aquello que hace única la experiencia.'],
  ['03', 'La comunidad', 'Después del retiro comienza un camino de acompañamiento, oración y crecimiento fraterno.'],
  ['04', 'El servicio', 'Cada persona puede poner sus dones al servicio de otros y ayudar a mantener viva la comunidad.'],
];


const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function parseFechaLocal(valor) {
  if (!valor || typeof valor !== 'string') return null;
  const partes = valor.slice(0, 10).split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
  const [anio, mes, dia] = partes;
  const fecha = new Date(anio, mes - 1, dia);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function construirDiasRetiro(fechaInicio, fechaFin, diasTexto) {
  const inicio = parseFechaLocal(fechaInicio);
  const fin = parseFechaLocal(fechaFin);

  if (inicio && fin && fin >= inicio) {
    const dias = [];
    const cursor = new Date(inicio);
    while (cursor <= fin && dias.length < 7) {
      dias.push({
        numero: cursor.getDate(),
        mes: MESES_CORTOS[cursor.getMonth()],
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    if (dias.length) return dias;
  }

  return String(diasTexto || '11 · 12 · 13')
    .split(/[·,|]/)
    .map((dia) => dia.trim())
    .filter(Boolean)
    .slice(0, 7)
    .map((numero) => ({ numero, mes: '' }));
}

function calcularCuentaRegresiva(fechaInicio) {
  const inicio = parseFechaLocal(fechaInicio);
  if (!inicio) return '';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diferencia = Math.ceil((inicio.getTime() - hoy.getTime()) / 86400000);
  if (diferencia > 1) return `Faltan ${diferencia} días`;
  if (diferencia === 1) return 'Falta 1 día';
  if (diferencia === 0) return 'Comienza hoy';
  return 'Retiro finalizado';
}

const preguntas = [
  ['¿Necesito pertenecer a la parroquia?', 'No es necesario. Emaús recibe a personas que desean vivir la experiencia y abrir un espacio para su vida espiritual.'],
  ['¿Debo tener experiencia previa en grupos de Iglesia?', 'No. El retiro está pensado también para quienes no participan actualmente en una comunidad o desean volver a acercarse.'],
  ['¿Cuánto dura el retiro?', 'Se vive durante un fin de semana completo. La información precisa de horarios y logística la entrega el equipo organizador.'],
  ['¿Qué debo llevar?', 'Antes del retiro recibirás indicaciones claras sobre ropa, elementos personales y recomendaciones prácticas.'],
  ['¿Cómo puedo recibir más información?', 'Puedes iniciar el proceso de inscripción desde esta página o comunicarte con una persona de la comunidad que te haya invitado.'],
];

export default function PublicHome() {
  const navigate = useNavigate();
  const { autenticado, solicitarAutenticacion } = useAuth();
  const portalApi = useApi(() => obtenerPortalPublico(), []);

  useEffect(() => {
    if (autenticado) navigate('/dashboard', { replace: true });
  }, [autenticado, navigate]);

  const portal = portalApi.data || {};
  const mostrarRetiro = portal.mostrarRetiro !== false;
  const registroActivo = portal.registroActivo !== false;
  const mostrarReportePago = portal.mostrarReportePago !== false;
  const subtitulo = portal.subtitulo || 'Una experiencia de encuentro, fe y transformación.';
  const diasRetiro = portal.diasRetiro || '11 · 12 · 13';
  const mesAnioRetiro = portal.mesAnioRetiro || 'Septiembre de 2026';
  const lugarRetiro = portal.lugarRetiro || 'Parroquia Santa Teresita del Niño Jesús';
  const textoEstadoRegistro = portal.textoEstadoRegistro || 'Inscripciones cerradas';
  const diasVisuales = construirDiasRetiro(portal.fechaInicioRetiro, portal.fechaFinRetiro, diasRetiro);
  const cuentaRegresiva = calcularCuentaRegresiva(portal.fechaInicioRetiro);
  const estadoRegistro = registroActivo ? 'Inscripciones abiertas' : textoEstadoRegistro;

  return (
    <Box className="public-page">
      <PublicNavbar onLogin={() => solicitarAutenticacion()} />

      <Box component="main">
        <Box id="inicio" component="section" className="public-hero">
          <Box className="public-orb public-orb-one" />
          <Box className="public-orb public-orb-two" />
          <Container maxWidth="xl" className="public-hero-container">
            <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center">
              <Grid size={{ xs: 12, md: mostrarRetiro ? 7 : 12 }}> 
                <Box className="public-kicker">
                  <AutoAwesomeRounded fontSize="small" />
                  EMAÚS · PARROQUIA SANTA TERESITA DEL NIÑO JESÚS
                </Box>

                <Typography component="p" className="public-hero-eyebrow">
                  RETIRO DE HOMBRES
                </Typography>

                <Typography component="h1" className="public-hero-title">
                  Un espacio para detenerte, reencontrarte y volver a caminar.
                </Typography>

                <Typography className="public-hero-copy">
                  {subtitulo} Una experiencia para abrir un espacio interior, compartir en comunidad y descubrir que no caminamos solos.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={3.5} alignItems={{ sm: 'center' }}>
                  {mostrarReportePago && (
                    <Button
                      className="public-primary-cta"
                      startIcon={<PaymentsRounded />}
                      endIcon={<ArrowForwardRounded />}
                      onClick={() => navigate(portal.urlReportePago || '/reportar-pago')}
                    >
                      {portal.textoBotonReportePago || 'Reportar pago'}
                    </Button>
                  )}
                  <Button
                    className="public-secondary-cta"
                    variant="outlined"
                    onClick={() => document.getElementById('que-es-emaus')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Conocer Emaús
                  </Button>
                </Stack>

                <Typography className="public-hero-action-note">
                  {mostrarRetiro
                    ? 'Si ya realizaste el pago, puedes reportarlo desde esta pantalla. La inscripción está disponible en la tarjeta del próximo retiro.'
                    : 'Actualmente no hay un retiro publicado. Puedes conocer Emaús y acceder al Centro de Control desde el menú superior.'}
                </Typography>
              </Grid>

              {mostrarRetiro && (
                <Grid size={{ xs: 12, md: 5 }}>
                <Box className="public-hero-retreat-card">
                  <Box className="public-hero-card-glow" />
                  <Box className="public-retreat-card-header">
                    <Box>
                      <Typography className="public-hero-card-label">PRÓXIMO RETIRO</Typography>
                      <Typography className="public-retreat-card-title">Retiro de Hombres</Typography>
                    </Box>
                    <Box className={`public-retreat-status ${registroActivo ? 'is-open' : 'is-closed'}`}>
                      <span />
                      {estadoRegistro}
                    </Box>
                  </Box>

                  <Box className="public-retreat-days-grid">
                    {diasVisuales.map((dia, index) => (
                      <Box className="public-retreat-day" key={`${dia.numero}-${dia.mes}-${index}`}>
                        <Typography className="public-retreat-day-number">{dia.numero}</Typography>
                        <Typography className="public-retreat-day-month">{dia.mes || mesAnioRetiro.split(' ')[0].slice(0, 3).toUpperCase()}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography className="public-retreat-month-year">{mesAnioRetiro}</Typography>

                  <Stack className="public-retreat-meta" spacing={1.2}>
                    <Box className="public-retreat-meta-row">
                      <LocationOnRounded />
                      <Typography>{lugarRetiro}</Typography>
                    </Box>
                    {cuentaRegresiva && (
                      <Box className="public-retreat-meta-row">
                        <AccessTimeRounded />
                        <Typography>{cuentaRegresiva}</Typography>
                      </Box>
                    )}
                  </Stack>

                  <Box className="public-hero-card-divider" />

                  <Typography className="public-hero-card-quote">
                    “¿No ardía nuestro corazón mientras nos hablaba por el camino?”
                  </Typography>
                  <Typography className="public-hero-card-reference">Lucas 24, 32</Typography>

                  <Button
                    fullWidth
                    className="public-card-cta"
                    disabled={!registroActivo}
                    onClick={() => navigate(portal.urlRegistro || '/registro')}
                    startIcon={<HowToRegRounded />}
                    endIcon={<ArrowForwardRounded />}
                  >
                    {registroActivo ? portal.textoBotonRegistro || 'Registrarme al retiro' : textoEstadoRegistro}
                  </Button>
                </Box>
              </Grid>
              )}
            </Grid>
          </Container>
        </Box>

        <Box id="que-es-emaus" component="section" className="public-section">
          <Container maxWidth="xl">
            <Typography className="public-section-label">UN CAMINO DE ENCUENTRO</Typography>
            <Typography component="h2" className="public-section-title">
              Emaús no es solo un retiro. Es el comienzo de un camino.
            </Typography>
            <Typography className="public-section-copy">
              Inspirado en el encuentro de Jesús resucitado con los discípulos que caminaban hacia Emaús, este espacio invita a mirar la propia historia con calma, fe y esperanza.
            </Typography>

            <Grid container spacing={2.5} mt={3}>
              {pilares.map((pilar) => (
                <Grid key={pilar.titulo} size={{ xs: 12, md: 4 }}>
                  <Box className="public-glass-card">
                    <Box className="public-icon-shell">{pilar.icono}</Box>
                    <Typography variant="h5" fontWeight={950} mt={3}>{pilar.titulo}</Typography>
                    <Typography color="text.secondary" mt={1.4} lineHeight={1.75}>{pilar.texto}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box id="comunidad" component="section" className="public-section public-section-dark">
          <Container maxWidth="xl">
            <Grid container spacing={7} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography className="public-section-label">NO CAMINAMOS SOLOS</Typography>
                <Typography component="h2" className="public-section-title">
                  Una comunidad que acompaña antes, durante y después.
                </Typography>
                <Typography className="public-section-copy">
                  Somos hombres con historias distintas que comparten una misma certeza: la fe se fortalece cuando se vive en comunidad, con espacios de oración, conversación y servicio.
                </Typography>
                <Grid container spacing={2} mt={3}>
                  <Grid size={{ xs: 12, sm: 6 }}><Box className="public-stat-card"><Typography variant="h4" fontWeight={950}>Fe</Typography><Typography color="rgba(255,255,255,.58)">Un camino personal y compartido.</Typography></Box></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Box className="public-stat-card"><Typography variant="h4" fontWeight={950}>Servicio</Typography><Typography color="rgba(255,255,255,.58)">Dones puestos al servicio de otros.</Typography></Box></Grid>
                </Grid>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box className="public-timeline">
                  {pasos.map(([numero, tituloPaso, texto]) => (
                    <Box className="public-timeline-item" key={numero}>
                      <Box className="public-timeline-number">{numero}</Box>
                      <Box pt={0.5}>
                        <Typography variant="h6" fontWeight={950}>{tituloPaso}</Typography>
                        <Typography mt={0.7} color="rgba(255,255,255,.6)" lineHeight={1.7}>{texto}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {mostrarRetiro && (
          <Box id="proximo-retiro" component="section" className="public-section">
          <Container maxWidth="lg">
            <Box className="public-retiro-panel">
              <Grid container>
                <Grid size={{ xs: 12, md: 5 }} className="public-date-block">
                  <Typography className="public-section-label">PRÓXIMO RETIRO</Typography>
                  <Box className="public-retiro-days-compact">
                    {diasVisuales.map((dia, index) => (
                      <Box className="public-retiro-day-compact" key={`panel-${dia.numero}-${index}`}>
                        <strong>{dia.numero}</strong>
                        <span>{dia.mes || mesAnioRetiro.split(' ')[0].slice(0, 3).toUpperCase()}</span>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="h5" fontWeight={850} mt={2}>{mesAnioRetiro}</Typography>
                  <Typography mt={1.5} color="text.secondary">{lugarRetiro}</Typography>
                  {cuentaRegresiva && <Typography className="public-retiro-countdown">{cuentaRegresiva}</Typography>}
                </Grid>
                <Grid size={{ xs: 12, md: 7 }} sx={{ p: { xs: 3.5, md: 5 }, bgcolor: 'white' }}>
                  <Typography variant="h4" fontWeight={950}>Da el primer paso.</Typography>
                  <Typography mt={1.5} color="text.secondary" lineHeight={1.75}>
                    El retiro está pensado para vivirlo, no para explicarlo por completo. Inicia tu inscripción y el equipo organizador te acompañará con toda la información necesaria.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3} mt={3}>
                    <Button
                      variant="contained"
                      disabled={!registroActivo}
                      startIcon={<HowToRegRounded />}
                      onClick={() => navigate(portal.urlRegistro || '/registro')}
                      sx={{ borderRadius: 999, px: 3, py: 1.35, textTransform: 'none', fontWeight: 900 }}
                    >
                      {registroActivo ? portal.textoBotonRegistro || 'Quiero inscribirme' : textoEstadoRegistro}
                    </Button>
                    {mostrarReportePago && (
                      <Button
                        variant="outlined"
                        startIcon={<PaymentsRounded />}
                        onClick={() => navigate(portal.urlReportePago || '/reportar-pago')}
                        sx={{ borderRadius: 999, px: 3, py: 1.35, textTransform: 'none', fontWeight: 900 }}
                      >
                        {portal.textoBotonReportePago || 'Reportar pago'}
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Container>
        </Box>
        )}
        <Box id="preguntas" component="section" className="public-section" sx={{ pt: 2 }}>
          <Container maxWidth="md">
            <Typography className="public-section-label" textAlign="center">PREGUNTAS FRECUENTES</Typography>
            <Typography component="h2" className="public-section-title" textAlign="center" mx="auto">
              Lo esencial antes de comenzar.
            </Typography>
            <Box className="public-faq" mt={5}>
              {preguntas.map(([pregunta, respuesta]) => (
                <Accordion key={pregunta} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                    <Typography fontWeight={900}>{pregunta}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary" lineHeight={1.75}>{respuesta}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Container>
        </Box>
      </Box>

      {mostrarRetiro && registroActivo && (
        <Button
          className="public-mobile-register"
          startIcon={<HowToRegRounded />}
          onClick={() => navigate(portal.urlRegistro || '/registro')}
        >
          Inscribirme al retiro
        </Button>
      )}

      <PublicFooter />
      <LoginDialog />
    </Box>
  );
}
