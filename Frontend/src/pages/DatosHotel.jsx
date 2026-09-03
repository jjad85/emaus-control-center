import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import DownloadRounded from '@mui/icons-material/DownloadRounded';
import HotelRounded from '@mui/icons-material/HotelRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import BlockRounded from '@mui/icons-material/BlockRounded';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../auth/AuthContext';

import PageHeader from '../components/PageHeader';

import {
  obtenerDatosHotel,
} from '../api/datosHotelApi';

import {
  exportarDatosHotelExcel,
} from '../utils/excelDatosHotel';


const DATOS_INICIALES = {
  items: [],
  resumen: {
    caminantes: 0,
    servidores: 0,
    servidoresExentosExcluidos: 0,
    total: 0,
  },
  anioRetiro: '',
};


function TarjetaResumen({
  icono,
  titulo,
  valor,
  detalle,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {titulo}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                mt: 0.5,
              }}
            >
              {valor}
            </Typography>
          </Box>

          <Box
            sx={{
              color: 'primary.main',
            }}
          >
            {icono}
          </Box>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mt: 1.5,
          }}
        >
          {detalle}
        </Typography>
      </CardContent>
    </Card>
  );
}


export default function DatosHotel() {
  const {
    token,
  } = useAuth();

  const [
    datos,
    setDatos,
  ] = useState(
    DATOS_INICIALES
  );

  const [
    cargando,
    setCargando,
  ] = useState(
    true
  );

  const [
    exportando,
    setExportando,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState(
    ''
  );

  const cargar =
    useCallback(
      async (
        refrescar = false
      ) => {
        setCargando(
          true
        );

        setError(
          ''
        );

        try {
          const respuesta =
            await obtenerDatosHotel(
              token,
              {
                refrescar,
              }
            );

          setDatos(
            respuesta ||
            DATOS_INICIALES
          );
        } catch (
          err
        ) {
          setError(
            err?.message ||
            'No fue posible consultar los datos para hotel.'
          );
        } finally {
          setCargando(
            false
          );
        }
      },
      [
        token,
      ]
    );

  useEffect(
    () => {
      cargar(
        true
      );
    },
    [
      cargar,
    ]
  );

  async function exportar() {
    setExportando(
      true
    );

    setError(
      ''
    );

    try {
      /*
       * Antes de descargar se consulta de nuevo para garantizar que
       * el archivo use la información más reciente de producción.
       */
      const respuesta =
        await obtenerDatosHotel(
          token,
          {
            refrescar: true,
          }
        );

      setDatos(
        respuesta ||
        DATOS_INICIALES
      );

      await exportarDatosHotelExcel({
        items:
          respuesta?.items ||
          [],
        anioRetiro:
          respuesta?.anioRetiro,
      });
    } catch (
      err
    ) {
      setError(
        err?.message ||
        'No fue posible generar el archivo Excel.'
      );
    } finally {
      setExportando(
        false
      );
    }
  }

  const resumen =
    datos?.resumen ||
    DATOS_INICIALES.resumen;

  return (
    <Box>
      <PageHeader
        titulo="Datos para hotel"
        subtitulo="Genera el archivo de personas para la casa de retiros con caminantes y servidores habilitados."
        icono={<HotelRounded />}
      />

      <Stack
        spacing={2.5}
      >
        {error && (
          <Alert
            severity="error"
          >
            {error}
          </Alert>
        )}

        <Alert
          severity="info"
        >
          El archivo incluye todos los <strong>caminantes activos</strong> y
          todos los <strong>servidores</strong>, excepto los servidores
          marcados como <strong>Exento de Pago</strong>. Los datos que no
          existan en el sistema se dejan vacíos.
        </Alert>

        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <TarjetaResumen
              icono={<GroupsRounded fontSize="large" />}
              titulo="Total para hotel"
              valor={resumen.total || 0}
              detalle="Personas que serán incluidas en el Excel."
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <TarjetaResumen
              icono={<PersonRounded fontSize="large" />}
              titulo="Caminantes"
              valor={resumen.caminantes || 0}
              detalle="Caminantes actualmente activos."
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <TarjetaResumen
              icono={<HotelRounded fontSize="large" />}
              titulo="Servidores incluidos"
              valor={resumen.servidores || 0}
              detalle="Servidores que sí deben reportarse a la casa de retiros."
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <TarjetaResumen
              icono={<BlockRounded fontSize="large" />}
              titulo="Exentos excluidos"
              valor={resumen.servidoresExentosExcluidos || 0}
              detalle="Servidores con marca Exento de Pago."
            />
          </Grid>
        </Grid>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Stack
              spacing={2}
            >
              <Stack
                direction={{
                  xs: 'column',
                  md: 'row',
                }}
                justifyContent="space-between"
                alignItems={{
                  xs: 'stretch',
                  md: 'center',
                }}
                gap={2}
              >
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={900}
                    >
                      Archivo para la casa de retiros
                    </Typography>

                    <Chip
                      size="small"
                      label={`${resumen.total || 0} personas`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                    }}
                  >
                    Se conserva la estructura de la plantilla entregada:
                    Nombre completo, Identificación, Fecha de nacimiento,
                    Dirección, Ciudad, País, Teléfono, Mesa y Habitación.
                  </Typography>
                </Box>

                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  spacing={1}
                >
                  <Button
                    variant="outlined"
                    startIcon={
                      cargando
                        ? (
                            <CircularProgress
                              size={17}
                              color="inherit"
                            />
                          )
                        : (
                            <RefreshRounded />
                          )
                    }
                    disabled={
                      cargando ||
                      exportando
                    }
                    onClick={() =>
                      cargar(
                        true
                      )
                    }
                  >
                    Actualizar datos
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={
                      exportando
                        ? (
                            <CircularProgress
                              size={17}
                              color="inherit"
                            />
                          )
                        : (
                            <DownloadRounded />
                          )
                    }
                    disabled={
                      cargando ||
                      exportando
                    }
                    onClick={
                      exportar
                    }
                  >
                    {exportando
                      ? 'Generando Excel...'
                      : 'Exportar Excel'}
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                El Excel se descarga como{' '}
                <strong>
                  DatosPersonas_Retiro_{datos.anioRetiro || 'AAAA'}.xlsx
                </strong>
                . Toda la tabla queda con bordes en cada celda.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
