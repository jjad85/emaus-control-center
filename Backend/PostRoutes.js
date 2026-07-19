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


    case 'solicitarrecuperacionclave':
      return {
        datos:
          solicitarRecuperacionClave(
            contenido.usuario,
            contenido.correo
          ),
        mensaje:
          'Solicitud de recuperación procesada'
      };

    case 'restablecerclaveconcodigo':
      return {
        datos:
          restablecerClaveConCodigo(
            contenido.usuario,
            contenido.correo,
            contenido.codigo,
            contenido.nuevaClave
          ),
        mensaje:
          'Contraseña restablecida correctamente'
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


    case 'desactivarcaminante':
      return {
        datos:
          desactivarCaminante(
            contenido.token,
            contenido.id,
            contenido.motivoCancelacion
          ),
        mensaje:
          'Participación cancelada correctamente'
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

    case 'prepararnotificacionwhatsapp':
      return {
        datos:
          prepararNotificacionWhatsapp(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'WhatsApp preparado correctamente'
      };

    case 'confirmarnotificacionwhatsapp':
      return {
        datos:
          confirmarNotificacionWhatsapp(
            contenido.token,
            contenido.id
          ),
        mensaje:
          'Notificación confirmada correctamente'
      };

    case 'obteneropcionesgestionservidor':
      return {
        datos: obtenerOpcionesGestionServidor(contenido.token, contenido.id),
        mensaje: 'Opciones de servidor consultadas correctamente'
      };

    case 'editarservidor':
      return {
        datos: editarServidor(contenido.token, contenido.id, contenido.datos),
        mensaje: 'Servidor actualizado correctamente'
      };

    case 'actualizarpagoservidor':
      return {
        datos: actualizarPagoServidor(contenido.token, contenido.id, contenido.estadoPago),
        mensaje: 'Pago del servidor actualizado correctamente'
      };

    case 'asignartemaservidor':
      return {
        datos: asignarTemaServidor(contenido.token, contenido.id, contenido.temaId),
        mensaje: 'Tema asignado correctamente'
      };

    case 'asignarmesaservidor':
      return {
        datos: asignarMesaServidor(
          contenido.token,
          contenido.id,
          contenido.mesa,
          contenido.rolMesa,
          contenido.tipoAsignacion,
          contenido.equipo
        ),
        mensaje: 'Mesa o equipo asignado correctamente'
      };

    case 'asignarequiposervidor':
      return {
        datos: asignarEquipoServidor(contenido.token, contenido.id, contenido.equipo, contenido.rolEquipo),
        mensaje: 'Equipo asignado correctamente'
      };

    case 'asignarhabitacionservidor':
      return {
        datos: asignarHabitacionServidor(contenido.token, contenido.id, contenido.habitacion),
        mensaje: 'Habitación asignada correctamente'
      };

    case 'registrartema':
      return {
        datos: registrarTema(contenido.token, contenido.datos),
        mensaje: 'Tema registrado correctamente'
      };

    case 'editartema':
      return {
        datos: editarTema(contenido.token, contenido.id, contenido.datos),
        mensaje: 'Tema actualizado correctamente'
      };

    case 'cambiarestadotema':
      return {
        datos: cambiarEstadoTema(contenido.token, contenido.id, contenido.activo),
        mensaje: 'Estado del tema actualizado correctamente'
      };

    case 'obteneradministracionsistema':
      return {
        datos:
          obtenerAdministracionSistema(
            contenido.token
          ),
        mensaje:
          'Administración consultada correctamente'
      };

    case 'desbloquearusuariosistema':
      return {
        datos:
          desbloquearUsuarioSistema(
            contenido.token,
            contenido.usuario
          ),
        mensaje:
          'Usuario desbloqueado correctamente'
      };

    case 'guardarpermisosrolsistema':
      return {
        datos:
          guardarPermisosRolSistema(
            contenido.token,
            contenido.rol,
            contenido.permisos
          ),
        mensaje:
          'Permisos actualizados correctamente'
      };

    case 'obtenerconfiguracionesadministracion':
      return {
        datos:
          obtenerConfiguracionesAdministracion(
            contenido.token
          ),
        mensaje:
          'Configuraciones consultadas correctamente'
      };

    case 'actualizarconfiguracionexistente':
      return {
        datos:
          actualizarConfiguracionExistente(
            contenido.token,
            contenido.clave,
            contenido.valor,
            contenido.activo
          ),
        mensaje:
          'Configuración actualizada correctamente'
      };

    default:
      throw crearErrorAplicacion(
        'ACCION_NO_VALIDA',
        'La acción solicitada no existe: ' +
        accion
      );
  }
}
