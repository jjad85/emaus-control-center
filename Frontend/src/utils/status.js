export function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function statusStyle(value) {
  const key = normalize(value);
  if (['pago excedido'].includes(key)) {
    return {
      backgroundColor: '#FDEBEC',
      color: '#B4232A',
      border: '1px solid rgba(180,35,42,.18)'
    };
  }
  if (['completado', 'aprobado', 'pago total', 'exento', 'entregado', 'entregada', 'recibido', 'recibida'].includes(key)) {
    return { backgroundColor: '#0B7D4F', color: '#fff' };
  }
  if (['pago parcial'].includes(key)) {
    return {
      backgroundColor: '#EAF3FC',
      color: '#0B5CAD',
      border: '1px solid rgba(11,92,173,.16)'
    };
  }
  if (['en proceso', 'en revision', 'solicitada', 'solicitado'].includes(key)) {
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
