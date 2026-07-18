/**
 * ============================================================
 * POST ROUTES
 * ============================================================
 */

function routePost(contenido) {
  const accion =
    normalizarTexto(
      contenido.accion
    );

  switch (accion) {
    case 'iniciarsesion':
      return {
        datos: iniciarSesion(
          contenido.usuario,
          contenido.clave
        ),
        mensaje:
          'Inicio de sesión correcto'
      };

    case 'consultarsesion':
      return {
        datos: consultarSesion(
          contenido.token
        ),
        mensaje:
          'Sesión consultada correctamente'
      };

    case 'cerrarsesion':
      return {
        datos: cerrarSesion(
          contenido.token
        ),
        mensaje:
          'Sesión cerrada correctamente'
      };

    case 'obteneropcionesregistrocaminante':
      return {
        datos:
          obtenerOpcionesRegistroCaminante(
            contenido.token
          ),
        mensaje:
          'Opciones consultadas correctamente'
      };

    case 'registrarcaminante':
      return {
        datos:
          registrarCaminante(
            contenido.token,
            contenido.datos
          ),
        mensaje:
          'Caminante registrado correctamente'
      };

    case 'editarcaminante':
      return {
        datos:
          editarCaminante(
            contenido.token,
            contenido.id,
            contenido.datos
          ),
        mensaje:
          'Caminante actualizado correctamente'
      };

    case 'actualizarpagocaminante':
      return {
        datos:
          actualizarPagoCaminante(
            contenido.token,
            contenido.id,
            contenido.estadoPago
          ),
        mensaje:
          'Pago actualizado correctamente'
      };

    case 'asignarmesacaminante':
      return {
        datos:
          asignarMesaCaminante(
            contenido.token,
            contenido.id,
            contenido.mesa
          ),
        mensaje:
          'Mesa actualizada correctamente'
      };

    case 'asignarhabitacioncaminante':
      return {
        datos:
          asignarHabitacionCaminante(
            contenido.token,
            contenido.id,
            contenido.habitacion
          ),
        mensaje:
          'Habitación actualizada correctamente'
      };

    case 'actualizarcartacaminante':
      return {
        datos:
          actualizarCartaCaminante(
            contenido.token,
            contenido.id,
            contenido.carta
          ),
        mensaje:
          'Carta actualizada correctamente'
      };

    case 'actualizarfotocaminante':
      return {
        datos:
          actualizarFotoCaminante(
            contenido.token,
            contenido.id,
            contenido.foto
          ),
        mensaje:
          'Foto actualizada correctamente'
      };


    case 'registraractividadminutograma':
      return {
        datos:
          registrarActividadMinutograma(
            contenido.token,
            contenido.datos
          ),
        mensaje:
          'Actividad registrada correctamente'
      };

    case 'editaractividadminutograma':
      return {
        datos:
          editarActividadMinutograma(
            contenido.token,
            contenido.id,
            contenido.datos
          ),
        mensaje:
          'Actividad actualizada correctamente'
      };

    case 'actualizarestadominutograma':
      return {
        datos:
          actualizarEstadoMinutograma(
            contenido.token,
            contenido.id,
            contenido.estado
          ),
        mensaje:
          'Estado actualizado correctamente'
      };

    case 'desactivaractividadminutograma':
      return {
        datos:
          desactivarActividadMinutograma(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Actividad desactivada correctamente'
      };


    case 'iniciaractividadminutograma':
      return {
        datos:
          iniciarActividadMinutograma(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Actividad iniciada correctamente'
      };


    case 'pausaractividadminutograma':
      return {
        datos:
          pausarActividadMinutograma(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Actividad pausada correctamente'
      };

    case 'reanudaractividadminutograma':
      return {
        datos:
          reanudarActividadMinutograma(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Actividad reanudada correctamente'
      };

    case 'registraralertaminutograma':
      return {
        datos:
          registrarAlertaMinutograma(
            contenido.token,
            contenido.id,
            contenido.tipo,
            contenido.mensaje
          ),
        mensaje:
          'Alerta registrada correctamente'
      };

    case 'finalizaractividadminutograma':
      return {
        datos:
          finalizarActividadMinutograma(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Actividad finalizada correctamente'
      };


    case 'registraraspirantepublico':
      return {
        datos:
          registrarAspirantePublico(
            contenido.datos
          ),
        mensaje:
          'Registro recibido correctamente'
      };

    case 'actualizarestadoaspirante':
      return {
        datos:
          actualizarEstadoAspirante(
            contenido.token,
            contenido.id,
            contenido.estado,
            contenido.observacionesGestion
          ),
        mensaje:
          'Estado actualizado correctamente'
      };

    case 'convertiraspiranteencaminante':
      return {
        datos:
          convertirAspiranteEnCaminante(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Aspirante convertido en caminante correctamente'
      };

    default:
      throw crearErrorAplicacion(
        'ACCION_NO_VALIDA',
        'La acción solicitada no existe: ' +
          accion
      );
  }
}
