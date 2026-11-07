# Gestión de Taller (Servicio Mecanica Integral)

Aplicación web de una sola página: presupuestos, historial con estados y reportes de producción y facturación. HTML + Tailwind CSS (CDN) + JavaScript, sin instalación. Los datos se guardan en el `localStorage` del navegador.

## Usar
1. Copie el logo de su taller como `logo.png` en esta carpeta (reemplaza al de ejemplo).
2. Edite el nombre y datos del taller al inicio de `app.js` (constante `TALLER`).
3. Abra `index.html` con doble clic, o sirva la carpeta: `python3 -m http.server 8000` y entre a http://localhost:8000.

Necesita internet solo para cargar Tailwind. Los datos quedan en el navegador y equipo donde los cargue: haga copias periódicas.

## Imprimir directo a la impresora predeterminada
Los navegadores siempre abren el diálogo de impresión. Para saltarlo, abra Chrome o Edge con la opción `--kiosk-printing` (agréguela al acceso directo) y fije la impresora predeterminada del sistema.

## Subir a GitHub
```bash
cd taller-gestion
git init
git add .
git commit -m "Sistema de gestión de taller"
git branch -M main
git remote add origin https://github.com/SU_USUARIO/taller-gestion.git
git push -u origin main
```
Cree antes el repositorio vacío en github.com. Para publicarlo como sitio, active GitHub Pages en Settings > Pages (rama `main`, carpeta raíz). Ojo: en Pages, cada navegador guarda sus propios datos.
