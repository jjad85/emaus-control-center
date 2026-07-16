# React — Emaús Control Center

## Instalación
```bash
npm install
```

## Configuración
1. Copie `.env.example` como `.env`.
2. Pegue la URL `/exec` de Apps Script:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
```

## Ejecución
```bash
npm run dev
```

## Construcción
```bash
npm run build
```

## Notas
- El título `EMAÚS {año}` y el subtítulo `Retiro de Hombres/Mujeres` vienen del endpoint `dashboard`.
- Las páginas muestran errores controlados; no deben quedar en blanco.
- Esta versión implementa consulta. Formularios y seguridad quedan para una fase posterior.
