import { Route } from 'react-router-dom';
import Minutograma from '../pages/Minutograma';
import Campanero from '../pages/Campanero';
import PantallaPublica from '../pages/PantallaPublica';

// Inserta <RutasMinutograma /> dentro de <Routes>.
// Paso a paso y Campanero pueden quedar dentro de MainLayout.
// PantallaPublica debe quedar fuera de MainLayout para no mostrar menú lateral.
export function RutasPrivadasMinutograma() {
  return <><Route path="/paso-a-paso" element={<Minutograma />} /><Route path="/campanero" element={<Campanero />} /></>;
}
export function RutaPublicaMinutograma() {
  return <Route path="/pantalla-publica" element={<PantallaPublica />} />;
}
