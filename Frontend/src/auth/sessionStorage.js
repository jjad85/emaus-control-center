const STORAGE_KEY =
  'emaus_control_center_session';

export function guardarSesionLocal(
  sesion
) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sesion)
  );
}

export function leerSesionLocal() {
  const valor =
    sessionStorage.getItem(
      STORAGE_KEY
    );

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(valor);
  } catch {
    sessionStorage.removeItem(
      STORAGE_KEY
    );

    return null;
  }
}

export function eliminarSesionLocal() {
  sessionStorage.removeItem(
    STORAGE_KEY
  );
}
