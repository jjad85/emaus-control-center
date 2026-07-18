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
  cerrarSesionApi,
  consultarSesionApi,
  iniciarSesionApi,
} from '../api/authApi';

import {
  eliminarSesionLocal,
  escucharCambiosSesion,
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

  useEffect(() => {
    return escucharSesionExpirada(
      (event) => {
        expirarSesion(
          event?.detail?.mensaje
        );
      }
    );
  }, [expirarSesion]);

  /*
   * Sincroniza login, logout y cambio de usuario entre pestañas.
   *
   * - Si otra pestaña inicia sesión, esta pestaña adopta la misma sesión.
   * - Si otra pestaña cierra sesión, esta también se cierra.
   * - No pueden quedar dos usuarios distintos activos en el mismo navegador.
   */
  useEffect(() => {
    return escucharCambiosSesion(
      (sesionCompartida) => {
        limpiarTemporizadores();
        setPendingAction(null);
        setAvisoSesion('');
        setMensajeSesion('');

        if (
          sesionCompartida?.token
        ) {
          setSesion(
            sesionCompartida
          );

          setLoginOpen(false);

          programarExpiracion(
            sesionCompartida
              .fechaExpiracion
          );

          return;
        }

        setSesion(null);
        setLoginOpen(false);
      }
    );
  }, [
    limpiarTemporizadores,
    programarExpiracion,
  ]);

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

        programarExpiracion(
          sesionActualizada
            .fechaExpiracion
        );
      } catch {
        if (activo) {
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

  useEffect(() => {
    if (
      sesion?.token &&
      sesion?.fechaExpiracion
    ) {
      programarExpiracion(
        sesion.fechaExpiracion
      );
    }

    return () => {
      limpiarTemporizadores();
    };
  }, [
    sesion?.token,
    sesion?.fechaExpiracion,
    programarExpiracion,
    limpiarTemporizadores,
  ]);

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

        permisos:
          datos.permisos || [],

        fechaInicio:
          datos.fechaInicio,

        fechaExpiracion:
          datos.fechaExpiracion,

        duracionSesionSegundos:
          datos.duracionSesionSegundos,
      };

      guardarSesionLocal(
        nuevaSesion
      );

      setSesion(nuevaSesion);
      setMensajeSesion('');
      setAvisoSesion('');
      setLoginOpen(false);

      programarExpiracion(
        nuevaSesion.fechaExpiracion
      );

      const accion =
        pendingAction;

      setPendingAction(null);

      if (accion) {
        window.setTimeout(
          () => accion(),
          0
        );
      }

      return nuevaSesion;
    },
    [
      pendingAction,
      programarExpiracion,
    ]
  );

  const logout = useCallback(
    async () => {
      const token =
        sesion?.token;

      cerrarSesionLocal();
      setMensajeSesion('');

      if (token) {
        try {
          await cerrarSesionApi(
            token
          );
        } catch {
          // La sesión local ya quedó cerrada.
        }
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

        return (
          sesion?.permisos || []
        )
          .map(
            normalizarPermiso
          )
          .includes(
            requerido
          );
      },
      [sesion?.permisos]
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

      permisos:
        sesion?.permisos || [],

      fechaExpiracion:
        sesion?.fechaExpiracion ||
        null,

      autenticado:
        Boolean(
          sesion?.token
        ),

      loading,
      loginOpen,
      mensajeSesion,
      avisoSesion,

      login,
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
