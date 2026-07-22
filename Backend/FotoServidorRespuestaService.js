/**
 * Utilidades transversales para exponer la fotografía del servidor
 * en cualquier respuesta del backend.
 */

function completarFotoServidor_(servidor) {
  if (!servidor) return servidor;

  return Object.assign({}, servidor, {
    fotoPerfilId: servidor.fotoPerfilId || '',
    fotoPerfilUrl: servidor.fotoPerfilUrl || '',
    fechaActualizacionFoto: servidor.fechaActualizacionFoto || ''
  });
}

function completarFotosServidoresLista_(servidores) {
  return (servidores || []).map(completarFotoServidor_);
}

function completarFotosEquipo_(equipo) {
  if (!equipo) return equipo;

  return Object.assign({}, equipo, {
    lider: completarFotoServidor_(equipo.lider),
    colider: completarFotoServidor_(equipo.colider),
    integrantes: completarFotosServidoresLista_(equipo.integrantes)
  });
}

function completarFotosMesa_(mesa) {
  if (!mesa) return mesa;

  return Object.assign({}, mesa, {
    lider: completarFotoServidor_(mesa.lider),
    colider: completarFotoServidor_(mesa.colider),
    servidores: completarFotosServidoresLista_(mesa.servidores)
  });
}

function completarFotosHabitacion_(habitacion) {
  if (!habitacion) return habitacion;

  const completarPersona = function(persona) {
    return persona && normalizarTexto(persona.tipoPersona) === 'servidor'
      ? completarFotoServidor_(persona)
      : persona;
  };

  return Object.assign({}, habitacion, {
    persona: completarPersona(habitacion.persona),
    personas: (habitacion.personas || []).map(completarPersona)
  });
}
