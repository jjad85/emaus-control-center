import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  cambiarPrimerPasswordApi,
  cerrarSesionApi,
  consultarSesionApi,
  iniciarSesionApi,
} from '../api/authApi';

import {
  eliminarSesionLocal,
  guardarSesionLocal,
  leerSesionLocal,
} from './sessionStorage';

import {
  escucharSesionExpirada,
} from './sessionEvents';

const AuthContext =
  createContext(null);

const AVISO_ANTES_EXPIRAR_MS =
  5 * 60 * 1000;

const INTERVALO_HEARTBEAT_MS =
  5 * 60 * 1000;

function normalizarPermiso(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase();
}

function obtenerMilisegundosRestantes(
  fechaExpiracion
) {
  if (!fechaExpiracion) {
    return 0;
  }

  return Math.max(
    0,
    new Date(
      fechaExpiracion
    ).getTime() -
      Date.now()
  );
}


const CODIGOS_SESION_INVALIDA = new Set([
  'SESION_EXPIRADA',
  'SESION_REQUERIDA',
  'SESION_INVALIDA',
  'SESION_REVOCADA',
  'TOKEN_EXPIRADO',
  'TOKEN_INVALIDO',
]);

function esErrorSesionInvalida(error) {
  return (
    Number(error?.estadoHttp || 0) === 401 ||
    CODIGOS_SESION_INVALIDA.has(
      String(error?.codigo || '')
    )
  );
}

export function AuthProvider({
  children,
}) {
  const [sesion, setSesion] =
    useState(() =>
      leerSesionLocal()
    );

  const [loading, setLoading] =
    useState(
      Boolean(sesion?.token)
    );

  const [loginOpen, setLoginOpen] =
    useState(false);

  const [
    mensajeSesion,
    setMensajeSesion,
  ] = useState('');

  const [
    avisoSesion,
    setAvisoSesion,
  ] = useState('');

  const [
    pendingAction,
    setPendingAction,
  ] = useState(null);

  const timerExpiracionRef =
    useRef(null);

  const timerAvisoRef =
    useRef(null);

  const cerrandoSesionRef =
    useRef(false);

  const ultimoHeartbeatRef =
    useRef(0);

  const limpiarTemporizadores =
    useCallback(() => {
      if (
        timerExpiracionRef.current
      ) {
        window.clearTimeout(
          timerExpiracionRef.current
        );

        timerExpiracionRef.current =
          null;
      }

      if (timerAvisoRef.current) {
        window.clearTimeout(
          timerAvisoRef.current
        );

        timerAvisoRef.current =
          null;
      }
    }, []);

  const cerrarSesionLocal =
    useCallback(() => {
      limpiarTemporizadores();
      eliminarSesionLocal();
      setSesion(null);
      setPendingAction(null);
      setAvisoSesion('');
    }, [limpiarTemporizadores]);

  const expirarSesion =
    useCallback(
      (
        mensaje =
          'Tu sesión expiró. Inicia sesión nuevamente.'
      ) => {
        cerrarSesionLocal();
        setMensajeSesion(mensaje);
        setLoginOpen(true);
      },
      [cerrarSesionLocal]
    );

  const programarExpiracion =
    useCallback(
      (fechaExpiracion) => {
        limpiarTemporizadores();

        const restantes =
          obtenerMilisegundosRestantes(
            fechaExpiracion
          );

        if (restantes <= 0) {
          expirarSesion(
            'Tu sesión expiró. Inicia sesión nuevamente.'
          );

          return;
        }

        if (
          restantes >
          AVISO_ANTES_EXPIRAR_MS
        ) {
          timerAvisoRef.current =
            window.setTimeout(
              () => {
                setAvisoSesion(
                  'Tu sesión expirará en 5 minutos.'
                );
              },
              restantes -
                AVISO_ANTES_EXPIRAR_MS
            );
        } else {
          setAvisoSesion(
            'Tu sesión expirará en menos de 5 minutos.'
          );
        }

        timerExpiracionRef.current =
          window.setTimeout(
            () => {
              expirarSesion(
                'Tu sesión expiró por tiempo. Inicia sesión nuevamente para continuar.'
              );
            },
            restantes
          );
      },
      [
        expirarSesion,
        limpiarTemporizadores,
      ]
    );

  const programarInactividad =
    useCallback(
      (duracionSegundos) => {
        limpiarTemporizadores();
        const duracionMs = Math.max(1, Number(duracionSegundos || 0)) * 1000;
        const avisoMs = Math.min(AVISO_ANTES_EXPIRAR_MS, Math.floor(duracionMs / 2));

        if (duracionMs > avisoMs) {
          timerAvisoRef.current = window.setTimeout(
            () => setAvisoSesion('Tu sesión se cerrará pronto por inactividad.'),
            duracionMs - avisoMs
          );
        }

        timerExpiracionRef.current = window.setTimeout(
          () => expirarSesion('Tu sesión expiró por inactividad. Inicia sesión nuevamente para continuar.'),
          duracionMs
        );
      },
      [expirarSesion, limpiarTemporizadores]
    );

  useEffect(() => {
    if (!sesion?.token || !sesion?.duracionSesionSegundos) return undefined;

    let cancelado = false;
    const registrarActividad = async () => {
      programarInactividad(sesion.duracionSesionSegundos);
      setAvisoSesion('');

      const ahora = Date.now();
      if (
        ahora - ultimoHeartbeatRef.current <
        INTERVALO_HEARTBEAT_MS
      ) {
        return;
      }
      ultimoHeartbeatRef.current = ahora;

      try {
        const datos = await consultarSesionApi(sesion.token);
        if (cancelado) return;
        const actualizada = {
          ...sesion,
          ...datos,
          token: sesion.token,
        };

        guardarSesionLocal(actualizada);

        setSesion((actual) => {
          if (!actual) {
            return actualizada;
          }

          const cambioRelevante =
            actual.fechaExpiracion !==
              actualizada.fechaExpiracion ||
            actual.duracionSesionSegundos !==
              actualizada.duracionSesionSegundos ||
            actual.rol !== actualizada.rol ||
            actual.debeCambiarPassword !==
              actualizada.debeCambiarPassword ||
            JSON.stringify(actual.permisos || []) !==
              JSON.stringify(
                actualizada.permisos || []
              );

          return cambioRelevante
            ? actualizada
            : actual;
        });
      } catch (error) {
        if (
          !cancelado &&
          esErrorSesionInvalida(error)
        ) {
          expirarSesion(
            'Tu sesión expiró. Inicia sesión nuevamente.'
          );
        }
      }
    };

    const eventos = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    eventos.forEach(evento => window.addEventListener(evento, registrarActividad, { passive: true }));
    programarInactividad(sesion.duracionSesionSegundos);

    return () => {
      cancelado = true;
      eventos.forEach(evento => window.removeEventListener(evento, registrarActividad));
    };
  }, [sesion?.token, sesion?.duracionSesionSegundos, programarInactividad, expirarSesion]);

  useEffect(() => {
    return escucharSesionExpirada(
      (event) => {
        if (cerrandoSesionRef.current) {
          return;
        }

        expirarSesion(
          event?.detail?.mensaje
        );
      }
    );
  }, [expirarSesion]);

  useEffect(() => {
    let activo = true;

    async function validarSesionInicial() {
      if (!sesion?.token) {
        setLoading(false);
        return;
      }

      try {
        const datos =
          await consultarSesionApi(
            sesion.token
          );

        if (!activo) {
          return;
        }

        const sesionActualizada = {
          ...sesion,
          ...datos,
          token: sesion.token,
        };

        guardarSesionLocal(
          sesionActualizada
        );

        setSesion(
          sesionActualizada
        );

        programarInactividad(
          sesionActualizada.duracionSesionSegundos
        );
      } catch (error) {
        if (
          activo &&
          esErrorSesionInvalida(error)
        ) {
          cerrarSesionLocal();
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    validarSesionInicial();

    return () => {
      activo = false;
    };
  }, []);


  const login = useCallback(
    async (
      usuario,
      clave
    ) => {
      const datos =
        await iniciarSesionApi(
          usuario,
          clave
        );

      const nuevaSesion = {
        token:
          datos.token,

        usuario:
          datos.usuario,

        nombre:
          datos.nombre,

        rol:
          datos.rol,

        servidorId:
          datos.servidorId || '',

        servidor:
          datos.servidor || null,

        permisos:
          datos.permisos || [],

        fechaInicio:
          datos.fechaInicio,

        fechaExpiracion:
          datos.fechaExpiracion,

        duracionSesionSegundos:
          datos.duracionSesionSegundos,

        debeCambiarPassword:
          Boolean(
            datos.debeCambiarPassword
          ),
      };

      guardarSesionLocal(
        nuevaSesion
      );

      setSesion(nuevaSesion);
      setMensajeSesion('');
      setAvisoSesion('');
      setLoginOpen(false);

      programarInactividad(
        nuevaSesion.duracionSesionSegundos
      );

      const accion =
        pendingAction;

      setPendingAction(null);

      if (
        accion &&
        !nuevaSesion.debeCambiarPassword
      ) {
        window.setTimeout(
          () => accion(),
          0
        );
      }

      return nuevaSesion;
    },
    [
      pendingAction,
      programarInactividad,
    ]
  );

  const completarCambioPassword =
    useCallback(
      async (
        passwordActual,
        passwordNueva
      ) => {
        if (!sesion?.token) {
          throw new Error(
            'Debe iniciar sesión nuevamente.'
          );
        }

        const datos =
          await cambiarPrimerPasswordApi(
            sesion.token,
            passwordActual,
            passwordNueva
          );

        const sesionActualizada = {
          ...sesion,
          debeCambiarPassword: false,
        };

        guardarSesionLocal(
          sesionActualizada
        );

        setSesion(
          sesionActualizada
        );

        return datos;
      },
      [sesion]
    );

  const logout = useCallback(
    async () => {
      const token =
        sesion?.token;

      cerrandoSesionRef.current = true;
      setLoginOpen(false);
      setMensajeSesion('');
      cerrarSesionLocal();

      try {
        if (token) {
          await cerrarSesionApi(
            token
          );
        }
      } catch {
        // La sesión local ya quedó cerrada.
      } finally {
        window.setTimeout(() => {
          cerrandoSesionRef.current = false;
        }, 0);
      }
    },
    [
      sesion?.token,
      cerrarSesionLocal,
    ]
  );

  const tienePermiso =
    useCallback(
      (permiso) => {
        if (!permiso) {
          return true;
        }

        const requerido =
          normalizarPermiso(
            permiso
          );

        // El rol ADMIN es un superusuario. No debe depender de que cada
        // permiso exista o esté correctamente asignado en la matriz.
        const rolNormalizado = String(sesion?.rol || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        if ([
          'admin',
          'administrador',
          'administrador del sistema',
        ].includes(rolNormalizado)) {
          return true;
        }

        const permisosNormalizados = (sesion?.permisos || []).map(normalizarPermiso);
        if (permisosNormalizados.includes(requerido)) {
          return true;
        }

        // Compatibilidad entre los códigos históricos usados por algunos
        // servicios/pantallas y los códigos definitivos de la matriz.
        const equivalencias = {
          CONSULTAR_ASPIRANTES: ['ASPIRANTES_VER_DETALLE'],
          NOTIFICAR_ASPIRANTE: ['ASPIRANTES_NOTIFICAR_PREINSCRIPCION'],
          CONVERTIR_ASPIRANTE: ['ASPIRANTES_CAMBIAR_ESTADO'],
          ACTUALIZAR_ESTADO_ASPIRANTE: ['ASPIRANTES_CAMBIAR_ESTADO'],
          CONSULTAR_CAMINANTES: ['CAMINANTES_VER_DETALLE'],
          EDITAR_CAMINANTE: ['CAMINANTES_EDITAR'],
          REGISTRAR_CAMINANTE: ['CAMINANTES_REGISTRAR'],
          ASIGNAR_MESA: ['CAMINANTES_ASIGNAR_MESA', 'MESAS_ASIGNAR_CAMINANTE'],
          ASIGNAR_HABITACION: ['CAMINANTES_ASIGNAR_HABITACION', 'HABITACIONES_ASIGNAR_PERSONA'],
          ACTUALIZAR_CARTA: ['CAMINANTES_REPORTAR_CARTA'],
          ACTUALIZAR_FOTO: ['CAMINANTES_REPORTAR_FOTO'],
          CONSULTAR_SERVIDORES: ['SERVIDORES_VER_DETALLE'],
          EDITAR_SERVIDOR: ['SERVIDORES_EDITAR'],
          EDITAR_EQUIPOS: ['EQUIPOS_CREAR', 'EQUIPOS_ASIGNAR_SERVIDOR', 'EQUIPOS_EDITAR', 'EQUIPOS_RETIRAR_SERVIDOR'],
          GESTIONAR_PRESENTACIONES: ['PRESENTACIONES_TODO'],
          GESTIONAR_PAGOS: ['PAGOS_VER_ESTADOS_CUENTA'],
          ADMINISTRAR_TEMAS: ['TEMAS_VER_DETALLE', 'TEMAS_EDITAR', 'TEMAS_CREAR', 'TEMAS_DESACTIVAR'],
          EXPORTAR_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_EXPORTAR'],
          IMPORTAR_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_IMPORTAR'],
          CREAR_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_REGISTRAR_ACTIVIDAD'],
          EDITAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_EDITAR'],
          ACTUALIZAR_ESTADO_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
          MOVER_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ORDEN'],
          INICIAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_INICIAR'],
          PAUSAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
          REANUDAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
          FINALIZAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
          REPORTAR_PAGO_REGISTRAR: ['REPORTAR_PAGO_TODO'],
        };

        return (equivalencias[requerido] || []).some((codigo) =>
          permisosNormalizados.includes(normalizarPermiso(codigo))
        );
      },
      [sesion?.permisos, sesion?.rol]
    );

  const solicitarAutenticacion =
    useCallback(
      (
        accionPosterior = null
      ) => {
        setPendingAction(
          accionPosterior
        );

        setMensajeSesion('');
        setLoginOpen(true);
      },
      []
    );

  const cerrarLogin =
    useCallback(() => {
      setLoginOpen(false);
      setMensajeSesion('');
      setPendingAction(null);
    }, []);

  const cerrarAvisoSesion =
    useCallback(() => {
      setAvisoSesion('');
    }, []);

  const ejecutarConPermiso =
    useCallback(
      ({
        permiso,
        accion,
        onDenied,
      }) => {
        if (!sesion?.token) {
          solicitarAutenticacion(
            accion
          );

          return false;
        }

        if (
          !tienePermiso(
            permiso
          )
        ) {
          onDenied?.();
          return false;
        }

        accion?.();
        return true;
      },
      [
        sesion?.token,
        solicitarAutenticacion,
        tienePermiso,
      ]
    );

  const value = useMemo(
    () => ({
      sesion,

      token:
        sesion?.token || null,

      usuario:
        sesion?.usuario || null,

      nombre:
        sesion?.nombre || null,

      rol:
        sesion?.rol || null,

      servidorId:
        sesion?.servidorId || '',

      servidor:
        sesion?.servidor || null,

      permisos:
        sesion?.permisos || [],

      fechaExpiracion:
        sesion?.fechaExpiracion ||
        null,

      debeCambiarPassword:
        Boolean(
          sesion?.debeCambiarPassword
        ),

      autenticado:
        Boolean(
          sesion?.token
        ),

      loading,
      loginOpen,
      mensajeSesion,
      avisoSesion,

      login,
      completarCambioPassword,
      logout,
      expirarSesion,
      tienePermiso,
      solicitarAutenticacion,
      cerrarLogin,
      cerrarAvisoSesion,
      ejecutarConPermiso,
    }),
    [
      sesion,
      loading,
      loginOpen,
      mensajeSesion,
      avisoSesion,
      login,
      completarCambioPassword,
      logout,
      expirarSesion,
      tienePermiso,
      solicitarAutenticacion,
      cerrarLogin,
      cerrarAvisoSesion,
      ejecutarConPermiso,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    );
  }

  return context;
}
