# Emaús - Sistema Integral de Administración de Retiros

> Plataforma para la administración integral de retiros Emaús.

## Descripción

Emaús es una aplicación web que centraliza la operación de los retiros,
permitiendo administrar aspirantes, caminantes, servidores, logística,
tesorería, auditoría y configuración desde una única plataforma.

## Características

-   Dashboard operativo.
-   Gestión de aspirantes.
-   Gestión de caminantes.
-   Gestión de servidores.
-   Habitaciones y mesas.
-   Gestión de temas.
-   Biblioteca documental.
-   Tesorería.
-   Reporte de pagos.
-   Auditoría.
-   Roles y permisos.
-   Configuración.
-   Notificaciones.

------------------------------------------------------------------------

# Tecnologías

## Frontend

-   React
-   Vite
-   Material UI
-   React Router
-   Axios

## Backend

-   Google Apps Script

## Persistencia

-   Google Sheets

## Archivos

-   Google Drive

------------------------------------------------------------------------

# Requisitos

-   Node.js 22 o superior
-   npm 10 o superior
-   Cuenta de Google
-   Google Apps Script
-   Google Drive
-   Google Sheets

------------------------------------------------------------------------

# Instalación

``` bash
git clone <repositorio>

cd src

npm install
```

------------------------------------------------------------------------

# Configuración

Crear el archivo `.env`

``` env
VITE_API_URL=https://TU_WEBAPP_APPS_SCRIPT

VITE_APP_NAME=EMAUS

VITE_VERSION=1.0.0
```

------------------------------------------------------------------------

# Ejecución

``` bash
npm run dev
```

La aplicación quedará disponible normalmente en:

    http://localhost:5173

------------------------------------------------------------------------

# Compilación

``` bash
npm run build
```

------------------------------------------------------------------------

# Publicación

## Frontend

``` bash
npm run build
```

Publicar el contenido de la carpeta:

    dist/

## Backend

1.  Abrir Google Apps Script.
2.  Copiar los archivos del backend.
3.  Guardar.
4.  Crear una nueva versión.
5.  Publicar la Web App.
6.  Actualizar la URL del frontend si cambia.

------------------------------------------------------------------------

# Instalación del Backend

Cada módulo puede incluir una función de instalación.

Ejemplos:

``` javascript
instalarSistema()

instalarBibliotecaDocumental()

instalarRegistroAspirantesPorServidores()
```

Estas funciones crean automáticamente hojas, parámetros y
configuraciones requeridas.

------------------------------------------------------------------------

# Variables de entorno

  Variable        Descripción
  --------------- ----------------------------------
  VITE_API_URL    URL de la Web App de Apps Script
  VITE_APP_NAME   Nombre de la aplicación
  VITE_VERSION    Versión publicada

------------------------------------------------------------------------

# Estructura del proyecto

``` text
Frontend/
├── src/
│   ├── components
│   ├── pages
│   ├── layouts
│   ├── hooks
│   ├── contexts
│   ├── services
│   ├── utils
│   └── assets

Backend/
├── Apps Script
```

------------------------------------------------------------------------

# Scripts

``` bash
npm run dev
npm run build
npm run lint
```

------------------------------------------------------------------------

# Módulos

-   Dashboard
-   Personas
-   Logística
-   Tesorería
-   Operación del retiro
-   Sistema

------------------------------------------------------------------------

# Funcionalidades implementadas

## Biblioteca documental

-   Cargar documentos
-   Editar
-   Eliminar
-   Restaurar
-   Descargar
-   Asociación con temas
-   Documentos importantes

## Gestión de Temas

-   Canción estándar
-   Palancas
-   Material de apoyo

## Registro de Aspirantes

-   Registro público
-   Registro por servidores autenticados

## Seguridad

-   Roles
-   Permisos
-   Auditoría
-   Cambio obligatorio de contraseña
-   Mostrar/Ocultar contraseña

------------------------------------------------------------------------

# Roles

-   Administrador
-   Líder del retiro
-   Líder de mesa
-   Servidor
-   Audiovisuales
-   Logística
-   Registro

------------------------------------------------------------------------

# Convenciones

-   Eliminación lógica.
-   Auditoría obligatoria.
-   Validaciones en frontend y backend.
-   Permisos parametrizables.
-   Google Drive para documentos.
-   Google Sheets para persistencia.

------------------------------------------------------------------------

# Estado del proyecto

  Módulo                  Estado
  ----------------------- -----------------
  Dashboard               En evolución
  Personas                Avanzado
  Temas                   Avanzado
  Biblioteca documental   Implementado
  Tesorería               Implementado
  Auditoría               En desarrollo
  Configuración           En desarrollo
  Multi-retiro            Diseño aprobado
  Multi-organización      Diseño aprobado

------------------------------------------------------------------------

# Roadmap

## Versión 1.1

-   Logística
-   Auditoría
-   Mejoras UX

## Versión 2.0

-   Multi-organización
-   Multi-retiro
-   Plantillas de retiro
-   Históricos

------------------------------------------------------------------------

# Documentación recomendada

``` text
docs/
├── Arquitectura.md
├── API.md
├── ModeloDatos.md
├── Instalacion.md
├── Despliegue.md
├── Permisos.md
├── Auditoria.md
├── Roadmap.md
├── Backlog.md
├── GuiaUsuario.md
└── GuiaAdministrador.md
```

------------------------------------------------------------------------

# Licencia

Uso interno del proyecto Emaús.

------------------------------------------------------------------------

**Última actualización:** Julio 2026.
