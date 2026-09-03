import {
  getResource,
} from './apiClient';

export async function obtenerDatosHotel(
  token,
  {
    refrescar = false,
  } = {}
) {
  const response =
    await getResource(
      'datoshotel',
      {
        token,
        ...(refrescar
          ? {
              _ts: Date.now(),
            }
          : {}),
      }
    );

  return (
    response?.datos ||
    {
      items: [],
      resumen: {},
    }
  );
}
