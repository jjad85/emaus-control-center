/**
 * ============================================================
 * SERVIDORES SERVICE
 * ============================================================
 */

/**
 * Obtiene servidores con filtros opcionales.
 */
function obtenerServidores(filtros) {
  const parametros = filtros || {};

  return leerHojaComoObjetos(
    HOJAS.SERVIDORES
  )
    .map(convertirServidor)
    .filter(function(servidor) {
      return (
        coincideTexto(
          servidor.nombre,
          parametros.nombre
        ) &&
        coincideExacto(
          servidor.estadoPago,
          parametros.estadoPago
        ) &&
        coincideExacto(
          servidor.equipo,
          parametros.equipo
        ) &&
        coincideExacto(
          servidor.rol,
          parametros.rol
        ) &&
        coincideExacto(
          servidor.mesa,
          parametros.mesa
        ) &&
        coincideExacto(
          servidor.habitacion,
          parametros.habitacion
        ) &&
        coincideTema(
          servidor.temas,
          parametros.tema
        )
      );
    });
}

/**
 * Consulta un servidor por ID.
 */
function obtenerServidorPorId(id) {
  const servidor =
    obtenerServidores({})
      .find(function(item) {
        return String(item.id) ===
          String(id);
      });

  if (!servidor) {
    throw crearErrorAplicacion(
      'SERVIDOR_NO_ENCONTRADO',
      'No existe el servidor con ID ' +
        id +
        '.'
    );
  }

  return servidor;
}

/**
 * Convierte una fila en servidor.
 */
function convertirServidor(registro) {
  return {
    id: registro.id || '',
    nombre: registro.nombre || '',
    contacto: registro.contacto || '',
    estadoPago: registro.estadoPago || 'Pendiente',
    equipo: registro.equipo || '',
    rol: registro.rol || '',
    mesa: registro.mesa || '',
    habitacion: registro.habitacion || '',
    temas: separarTemas(registro.tema)
  };
}

/**
 * Calcula indicadores de servidores.
 */
function obtenerIndicadoresServidores(
  servidores
) {
  return {
    total: servidores.length,

    pagos:
      contarEstados(
        servidores,
        function(item) {
          return item.estadoPago;
        }
      ),

    porEquipo:
      contarEstados(
        servidores,
        function(item) {
          return item.equipo;
        }
      ),

    porRol:
      contarEstados(
        servidores,
        function(item) {
          return item.rol;
        }
      ),

    conTema:
      servidores.filter(
        function(item) {
          return item.temas.length > 0;
        }
      ).length,

    sinTema:
      servidores.filter(
        function(item) {
          return item.temas.length === 0;
        }
      ).length,

    sinHabitacion:
      servidores.filter(
        function(item) {
          return !String(
            item.habitacion
          ).trim();
        }
      ).length
  };
}

/**
 * Versión resumida utilizada por mesas y equipos.
 */
function resumirServidor(servidor) {
  return {
    id: servidor.id || '',
    nombre: servidor.nombre || '',
    celular: servidor.celular || '',
    rol: servidor.rol || '',
    estadoPago: servidor.estadoPago || 'Pendiente',
    temas: servidor.temas || [],
    mesa: servidor.mesa || '',
    habitacion: servidor.habitacion || ''
  };
}

/**
 * Prueba local.
 */
function probarServidores() {
  const servidores =
    obtenerServidores({});

  const resultado = {
    items: servidores,
    indicadores:
      obtenerIndicadoresServidores(
        servidores
      )
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );
}