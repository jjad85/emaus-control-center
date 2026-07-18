export function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function statusStyle(value) {
  const key = normalize(value);
  if (['completado', 'aprobado', 'pago total', 'entregado', 'entregada', 'recibido', 'recibida'].includes(key)) {
    return { backgroundColor: '#0B7D4F', color: '#fff' };
  }
  if (['en proceso', 'en revision', 'pago parcial', 'solicitada', 'solicitado'].includes(key)) {
    return { backgroundColor: '#0B5CAD', color: '#fff' };
  }
  if (['requiere cambios'].includes(key)) {
    return { backgroundColor: '#5B2C83', color: '#fff' };
  }
  if (['pendiente', 'por definir'].includes(key)) {
    return { backgroundColor: '#FDE7A3', color: '#6E5600' };
  }
  return { backgroundColor: '#ECEFF1', color: '#455A64' };
}
