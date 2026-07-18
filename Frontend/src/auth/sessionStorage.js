const STORAGE_KEY =
  'emaus_control_center_session';

const LEGACY_SESSION_STORAGE_KEY =
  STORAGE_KEY;

/**
 * La sesión se guarda en localStorage para compartirla entre todas
 * las pestañas del mismo navegador y del mismo dominio.
 *
 * sessionStorage no sirve para este caso porque cada pestaña mantiene
 * una copia independiente.
 */
export function guardarSesionLocal(
  sesion
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sesion)
  );

  /*
   * Limpia la copia antigua para evitar comportamientos ambiguos
   * después de actualizar desde versiones anteriores.
   */
  sessionStorage.removeItem(
    LEGACY_SESSION_STORAGE_KEY
  );
}

export function leerSesionLocal() {
  let valor =
    localStorage.getItem(
      STORAGE_KEY
    );

  /*
   * Migración automática desde la implementación anterior.
   * Si una pestaña todavía tenía la sesión en sessionStorage,
   * la mueve a localStorage una sola vez.
   */
  if (!valor) {
    valor =
      sessionStorage.getItem(
        LEGACY_SESSION_STORAGE_KEY
      );

    if (valor) {
      localStorage.setItem(
        STORAGE_KEY,
        valor
      );

      sessionStorage.removeItem(
        LEGACY_SESSION_STORAGE_KEY
      );
    }
  }

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(valor);
  } catch {
    localStorage.removeItem(
      STORAGE_KEY
    );

    sessionStorage.removeItem(
      LEGACY_SESSION_STORAGE_KEY
    );

    return null;
  }
}

export function eliminarSesionLocal() {
  localStorage.removeItem(
    STORAGE_KEY
  );

  sessionStorage.removeItem(
    LEGACY_SESSION_STORAGE_KEY
  );
}

/**
 * Escucha cambios de sesión realizados desde otras pestañas.
 *
 * El evento storage solo se dispara en las otras pestañas,
 * no en la pestaña que hizo el cambio.
 */
export function escucharCambiosSesion(
  listener
) {
  function manejarStorage(event) {
    if (
      event.key !== STORAGE_KEY
    ) {
      return;
    }

    let sesion = null;

    if (event.newValue) {
      try {
        sesion =
          JSON.parse(
            event.newValue
          );
      } catch {
        sesion = null;
      }
    }

    listener?.(sesion);
  }

  window.addEventListener(
    'storage',
    manejarStorage
  );

  return () => {
    window.removeEventListener(
      'storage',
      manejarStorage
    );
  };
}
