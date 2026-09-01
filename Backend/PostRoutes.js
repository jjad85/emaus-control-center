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

    case 'cambiarprimerpassword':
      return {
        datos: cambiarPrimerPassword(
          contenido.token,
          contenido.passwordActual,
          contenido.passwordNueva
        ),
        mensaje:
          'Contraseña actualizada correctamente'
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

    case 'obtenermicuentaservidor':
      return {
        datos: obtenerMiCuentaServidor(contenido.token),
        mensaje: 'Cuenta del servidor consultada correctamente'
      };

    case 'resolverinscripcionservicio':
      return {
        datos: resolverInscripcionServicioRetiro(
          contenido.token,
          contenido.tipo,
          contenido.id,
          contenido.estado,
          contenido.observacionesGestion
        ),
        mensaje: 'Inscripción de servicio actualizada correctamente'
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

    case 'obtenerpendienteslogistica':
      return {
        datos: obtenerPendientesLogistica(contenido.token),
        mensaje: 'Pendientes consultados correctamente'
      };

    case 'aprobarentregablelogistica':
      return {
        datos: aprobarEntregableLogistica(
          contenido.token,
          contenido.id,
          contenido.tipo
        ),
        mensaje: 'Entrega aprobada correctamente'
      };


    case 'actualizarllamadacaminante':
      return {
        datos:
          actualizarLlamadaCaminante(
            contenido.token,
            contenido.id,
            contenido.estado
          ),
        mensaje:
          'Llamada al caminante actualizada correctamente'
      };

    case 'actualizarllamadacontactoscaminante':
      return {
        datos:
          actualizarLlamadaContactosCaminante(
            contenido.token,
            contenido.id,
            contenido.estado
          ),
        mensaje:
          'Llamada a contactos actualizada correctamente'
      };

    case 'cancelarcaminante':
      return {
        datos:
          cancelarCaminante(
            contenido.token,
            contenido.id,
            contenido.motivoCancelacion
          ),
        mensaje:
          'Caminante cancelado correctamente'
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

    case 'enviarautorizacionescaminante':
      return {
        datos: enviarAutorizacionesCaminante(contenido.token, contenido.id),
        mensaje: 'Enlace de autorizaciones generado correctamente'
      };

    case 'responderautorizacionescaminantepublico':
      return {
        datos: responderAutorizacionesCaminantePublico(contenido.tokenAutorizacion, contenido.decision),
        mensaje: 'Respuesta registrada correctamente'
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



    case 'reportarpagopublico':
      return { datos: reportarPagoPublico(contenido.datos), mensaje: 'Pago reportado correctamente' };
    case 'editarvalorpagopendiente':
      return {
        datos: editarValorPagoPendiente(
          contenido.token,
          contenido.id,
          contenido.valorReportado,
          contenido.motivo
        ),
        mensaje: 'Valor del pago corregido correctamente'
      };

    case 'validarpago':
      return { datos: validarPago(contenido.token, contenido.id, contenido.decision || {}), mensaje: 'Pago validado correctamente' };

    case 'revertiraprobacionpago':
      return {
        datos: revertirAprobacionPago(
          contenido.token,
          contenido.id,
          contenido.motivo
        ),
        mensaje: 'Aprobación del pago revertida correctamente'
      };

    case 'registrarangelitopublico':
      return {
        datos: registrarAngelitoPublico(
          contenido.datos
        ),
        mensaje: 'Inscripción de Angelito recibida correctamente'
      };

    case 'registrarapoyoaudiovisualpublico':
      return {
        datos: registrarApoyoAudiovisualPublico(
          contenido.datos
        ),
        mensaje: 'Inscripción de apoyo audiovisual recibida correctamente'
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

    case 'registraraspiranteservidor':
      return {
        datos: registrarAspiranteServidor(
          contenido.token,
          contenido.datos
        ),
        mensaje: 'Aspirante registrado correctamente'
      };

    case 'editaraspirante':
      return { datos: editarAspirante(contenido.token, contenido.id, contenido.datos || {}), mensaje: 'Aspirante actualizado correctamente' };

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

    case 'omitirnotificacionwhatsapp':
      return {
        datos:
          omitirNotificacionWhatsapp(
            contenido.token,
            contenido.id,
            contenido.motivo
          ),
        mensaje:
          'Notificación omitida correctamente'
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



    case 'actualizarpreferenciasmultimediatema':
      return { datos: actualizarPreferenciasMultimediaTema(contenido.token, contenido.temaId, contenido.datos), mensaje: 'Preferencias actualizadas correctamente' };

    case 'cambiarestadopalancatema':
      return { datos: cambiarEstadoPalancaTema(contenido.token, contenido.temaId, contenido.estado), mensaje: 'Estado de palanca actualizado correctamente' };

    case 'aprobarpalancalogistica':
      return { datos: aprobarPalancaLogistica(contenido.token, contenido.temaId), mensaje: 'Palanca aprobada correctamente' };

    case 'obtenergestionpalancaslogistica':
      return { datos: obtenerGestionPalancasLogistica(contenido.token), mensaje: 'Palancas consultadas correctamente' };

    case 'actualizarpalancalogistica':
      return { datos: actualizarPalancaLogistica(contenido.token, contenido.temaId, contenido.datos), mensaje: 'Palanca actualizada correctamente' };

    case 'movertema':
      return {
        datos: moverTema(contenido.token, contenido.id, contenido.direccion),
        mensaje: 'Orden del tema actualizado correctamente'
      };

    case 'reordenartemas':
      return {
        datos: reordenarTemas(
          contenido.token,
          contenido.idsOrdenados ||
          (contenido.datos && contenido.datos.idsOrdenados) ||
          contenido.orden ||
          []
        ),
        mensaje: 'Orden de los temas actualizado correctamente'
      };

    case 'obtener mitemaasignado':
    case 'obtenermitemaasignado':
      return { datos: obtenerMiTemaAsignado(contenido.token), mensaje: 'Temas asignados consultados correctamente' };


    case 'obtenerhistorialgeneralmitema':
      return { datos: obtenerHistorialGeneralMiTema(contenido.token, contenido.temaId), mensaje: 'Actividad del tema consultada correctamente' };

    case 'subirversiontema':
      return { datos: subirVersionTema(contenido.token, contenido.temaId, contenido.archivo, contenido.comentario), mensaje: 'Presentación cargada correctamente' };

    case 'actualizarpreferenciasmitema':
      return { datos: actualizarPreferenciasMiTema(contenido.token, contenido.temaId, contenido.datos), mensaje: 'Preferencias del tema actualizadas correctamente' };

    case 'guardarrecursosmitema':
      return { datos: guardarRecursosMiTema(contenido.token, contenido.temaId, contenido.datos), mensaje: 'Recurso del tema guardado correctamente' };

    case 'subirmusicatema':
      return { datos: subirMusicaTema(contenido.token, contenido.temaId, contenido.archivo, contenido.observaciones), mensaje: 'Música cargada correctamente' };

    case 'creardocumento':
      return { datos: crearDocumento(contenido.token, contenido.datos, contenido.archivo), mensaje: 'Documento cargado correctamente' };

    case 'editardocumento':
      return { datos: editarDocumento(contenido.token, contenido.id, contenido.datos, contenido.archivo), mensaje: 'Documento actualizado correctamente' };

    case 'eliminardocumento':
      return { datos: eliminarDocumento(contenido.token, contenido.id), mensaje: 'Documento eliminado correctamente' };

    case 'restaurardocumento':
      return { datos: restaurarDocumento(contenido.token, contenido.id), mensaje: 'Documento restaurado correctamente' };

    case 'obtenerurldescargadocumento':
      return { datos: obtenerUrlDescargaDocumento(contenido.token, contenido.id), mensaje: 'Descarga autorizada correctamente' };

    case 'obtenerrevisionpresentaciones':
      return { datos: obtenerRevisionPresentaciones(contenido.token), mensaje: 'Presentaciones consultadas correctamente' };

    case 'obtenergestionrecursosaudiovisuales':
      return { datos: obtenerGestionRecursosAudiovisuales(contenido.token), mensaje: 'Recursos audiovisuales consultados correctamente' };

    case 'obtenerhistorialrecursotema':
      return { datos: obtenerHistorialRecursoTema(contenido.token, contenido.temaId, contenido.tipoRecurso), mensaje: 'Historial consultado correctamente' };

    case 'obtenerreporterecursostema':
      return { datos: obtenerReporteRecursosTema(contenido.token, contenido.filtros), mensaje: 'Reporte consultado correctamente' };

    case 'cambiarestadorecursoaudiovisual':
      return { datos: cambiarEstadoRecursoAudiovisual(contenido.token, contenido.temaId, contenido.tipo, contenido.estado, contenido.observaciones, contenido.archivoDefinitivo), mensaje: 'Recurso audiovisual actualizado correctamente' };

    case 'comentarpresentacion':
      return { datos: comentarPresentacion(contenido.token, contenido.temaId, contenido.versionId, contenido.comentario), mensaje: 'Comentario registrado correctamente' };

    case 'revisarpresentacionaudiovisuales':
      return { datos: revisarPresentacionAudiovisuales(contenido.token, contenido.temaId, contenido.versionId, contenido.decision, contenido.comentario), mensaje: 'Revisión registrada correctamente' };

    case 'subirversionajustadaaudiovisuales':
      return { datos: subirVersionAjustadaAudiovisuales(contenido.token, contenido.temaId, contenido.archivo, contenido.comentario), mensaje: 'Versión ajustada cargada correctamente' };

    case 'responderrevisionservidor':
      return { datos: responderRevisionServidor(contenido.token, contenido.temaId, contenido.versionId, contenido.decision, contenido.comentario), mensaje: 'Respuesta registrada correctamente' };

    case 'obtenernotificacionestemas':
      return { datos: obtenerNotificacionesTemas(contenido.token), mensaje: 'Notificaciones consultadas correctamente' };

    case 'marcarnotificaciontemaleida':
      return { datos: marcarNotificacionTemaLeida(contenido.token, contenido.id), mensaje: 'Notificación actualizada correctamente' };

    case 'obtenerconfiguracionalertas':
      return {
        datos: obtenerConfiguracionAlertas(contenido.token),
        mensaje: 'Configuración de alertas consultada correctamente'
      };

    case 'guardarconfiguracionalertas':
      return {
        datos: guardarConfiguracionAlertas(contenido.token, contenido.configuracion),
        mensaje: 'Configuración de alertas actualizada correctamente'
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

    case 'obtenerauditoriasistema':
      return {
        datos:
          obtenerAuditoriaSistema(
            contenido.token,
            contenido.filtros
          ),
        mensaje:
          'Auditoría consultada correctamente'
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


    case 'crearusuariosistema':
      return {
        datos: crearUsuarioSistema(contenido.token, contenido.datos),
        mensaje: 'Usuario creado correctamente'
      };

    case 'editarusuariosistema':
      return {
        datos: editarUsuarioSistema(contenido.token, contenido.id, contenido.datos),
        mensaje: 'Usuario actualizado correctamente'
      };

    case 'registrarfechaimportante':
      return {
        datos: registrarFechaImportante(contenido.token, contenido.datos),
        mensaje: 'Fecha importante registrada correctamente'
      };

    case 'editarfechaimportante':
      return {
        datos: editarFechaImportante(contenido.token, contenido.id, contenido.datos),
        mensaje: 'Fecha importante actualizada correctamente'
      };

    case 'eliminarfechaimportante':
      return {
        datos: eliminarFechaImportante(contenido.token, contenido.id),
        mensaje: 'Fecha importante eliminada correctamente'
      };

    case 'restaurarfechaimportante':
      return {
        datos: restaurarFechaImportante(contenido.token, contenido.id),
        mensaje: 'Fecha importante restaurada correctamente'
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
            contenido.nombreVisible,
            contenido.valor,
            contenido.activo
          ),
        mensaje:
          'Configuración actualizada correctamente'
      };


    case 'obtenermiservidorpago':
      return {
        datos: obtenerMiServidorPago(contenido.token),
        mensaje: 'Información de pago del servidor consultada correctamente'
      };

    case 'obtenermifotoperfilservidor':
      return {
        datos: obtenerMiFotoPerfilServidor(contenido.token),
        mensaje: 'Fotografía de perfil consultada correctamente'
      };

    case 'actualizarmifotoperfilservidor':
      return {
        datos: actualizarMiFotoPerfilServidor(contenido.token, contenido.archivo),
        mensaje: 'Fotografía de perfil actualizada correctamente'
      };

    case 'eliminarmifotoperfilservidor':
      return {
        datos: eliminarMiFotoPerfilServidor(contenido.token),
        mensaje: 'Fotografía de perfil eliminada correctamente'
      };


    case 'listarequiposadministrables':
      return {
        datos: listarEquiposAdministrables(
          contenido.token
        ),
        mensaje:
          'Equipos consultados correctamente'
      };

    case 'guardarequipoadministrable':
      return {
        datos: guardarEquipoAdministrable(
          contenido.token,
          contenido.equipo
        ),
        mensaje:
          'Equipo guardado correctamente'
      };

    case 'cambiarestadoequipoadministrable':
      return {
        datos: cambiarEstadoEquipoAdministrable(
          contenido.token,
          contenido.equipoId,
          contenido.activo
        ),
        mensaje:
          'Estado del equipo actualizado correctamente'
      };

    case 'obtenerasignacionequiposservidor':
      return {
        datos: obtenerAsignacionEquiposServidor(
          contenido.token,
          contenido.servidorId
        ),
        mensaje:
          'Asignación de equipos consultada correctamente'
      };

    case 'guardarasignacionequiposservidor':
      return {
        datos: guardarAsignacionEquiposServidor(
          contenido.token,
          contenido.servidorId,
          contenido.equipoPrincipalId,
          contenido.equipoPrincipalNombre,
          contenido.rolEquipoPrincipal,
          contenido.mesaPrincipal,
          contenido.equiposApoyoIds
        ),
        mensaje:
          'Equipos del servidor guardados correctamente'
      };



    case 'obtenerresumenasignacionequipos':
      return {
        datos: obtenerResumenAsignacionEquipos(
          contenido.token
        ),
        mensaje:
          'Resumen de asignación de equipos consultado correctamente'
      };

    case 'obtenercandidatosasignacionequipo':
      return {
        datos: obtenerCandidatosAsignacionEquipo(
          contenido.token,
          contenido.equipoId,
          contenido.equipoNombre
        ),
        mensaje:
          'Servidores disponibles consultados correctamente'
      };

    // Se aceptan los nombres históricos para evitar errores entre versiones
    // del frontend y despliegues anteriores del backend.
    case 'retirarservidorequipo':
    case 'retirarservidordeequipo':
    case 'retirarservidordelequipo':
      return {
        datos: retirarServidorDeEquipo(
          contenido.token,
          contenido.equipoId,
          contenido.servidorId
        ),
        mensaje: 'Servidor retirado del equipo correctamente'
      };

    case 'asignarservidoresequipo':
      return {
        datos: asignarServidoresAEquipo(
          contenido.token,
          contenido.equipoId,
          contenido.equipoNombre,
          contenido.rol,
          contenido.servidorIds
        ),
        mensaje:
          'Servidores asignados correctamente'
      };


    case 'editarhabitacion':
      return {
        datos: editarHabitacion(
          contenido.token,
          contenido.habitacionId,
          contenido.datos
        ),
        mensaje:
          'Habitación actualizada correctamente'
      };

    case 'obtenercandidatoshabitacion':
      return {
        datos: obtenerCandidatosHabitacion(
          contenido.token,
          contenido.habitacionId,
          contenido.tipoPersona
        ),
        mensaje:
          'Personas disponibles consultadas correctamente'
      };

    case 'desasignarpersonahabitacion':
      return {
        datos: desasignarPersonaHabitacion(
          contenido.token,
          contenido.habitacionId,
          contenido.tipoPersona,
          contenido.personaId
        ),
        mensaje:
          'Persona desasignada de la habitación correctamente'
      };

    case 'desasignarcaminantehabitacion':
      return {
        datos: desasignarCaminanteHabitacion(
          contenido.token,
          contenido.habitacionId,
          contenido.caminanteId
        ),
        mensaje:
          'Caminante desasignado de la habitación correctamente'
      };

    case 'asignarpersonashabitacion':
      return {
        datos: asignarPersonasHabitacion(
          contenido.token,
          contenido.habitacionId,
          contenido.tipoPersona,
          contenido.personaIds
        ),
        mensaje:
          'Personas asignadas correctamente'
      };


    case 'exportarcaminantesmesa':
      return {
        datos:
          obtenerExportacionCaminantesMesa(
            contenido.token,
            contenido.numeroMesa
          ),
        mensaje:
          'Listado de caminantes generado correctamente'
      };


    case 'obtenercandidatosmesacaminantes':
      return {
        datos:
          obtenerCandidatosMesaCaminantes(
            contenido.token,
            contenido.numeroMesa
          ),
        mensaje:
          'Caminantes disponibles consultados correctamente'
      };

    case 'desasignarcaminantemesa':
      return {
        datos:
          desasignarCaminanteMesa(
            contenido.token,
            contenido.numeroMesa,
            contenido.caminanteId
          ),
        mensaje:
          'Caminante desasignado de la mesa correctamente'
      };

    case 'asignarcaminantesmesa':
      return {
        datos:
          asignarCaminantesMesa(
            contenido.token,
            contenido.numeroMesa,
            contenido.caminanteIds
          ),
        mensaje:
          'Caminantes asignados correctamente'
      };

    case 'liberarmesafueraderango':
      return {
        datos:
          liberarMesaFueraDeRango(
            contenido.token,
            contenido.numeroMesa
          ),
        mensaje:
          'Mesa liberada correctamente'
      };

    default:
      throw crearErrorAplicacion(
        'ACCION_NO_VALIDA',
        'La acción solicitada no existe: ' +
        accion
      );
  }
}
