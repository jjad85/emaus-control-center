const SESSION_EXPIRED_EVENT =
  'emaus:session-expired';

export function emitirSesionExpirada(
  mensaje =
    'Tu sesión expiró. Inicia sesión nuevamente.'
) {
  window.dispatchEvent(
    new CustomEvent(
      SESSION_EXPIRED_EVENT,
      {
        detail: {
          mensaje,
        },
      }
    )
  );
}

export function escucharSesionExpirada(
  listener
) {
  window.addEventListener(
    SESSION_EXPIRED_EVENT,
    listener
  );

  return () => {
    window.removeEventListener(
      SESSION_EXPIRED_EVENT,
      listener
    );
  };
}
