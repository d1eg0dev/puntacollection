# Punta Collection

Portal de reserva directa de las cuatro casas de La Punta de Zicatela,
Puerto Escondido. Sitio estático, bilingüe, sin framework.

```
index.html          portada en español
en/index.html       portada en inglés
resena.html         formulario de reseña (ES) · en/review.html (EN)
assets/             estilo.css · sitio.js · fotos.json
fotos/              fotos optimizadas, las deja el flujo fotos.yml
apps-script/        Disponibilidad.gs, el que habla con los iCal
```

## Lo que hay que configurar

### 1 · Apps Script

El navegador no puede leer los iCal de Airbnb: no mandan cabeceras de CORS.
Por eso hay un web app en medio que los lee, los traduce a días ocupados y
los sirve en JSON.

1. Proyecto nuevo en [script.google.com](https://script.google.com), pegar
   `apps-script/Disponibilidad.gs`.
2. Ejecutar una vez `creaHojaResenas()`. Crea la hoja de reseñas y la deja
   registrada sola.
3. Configuración del proyecto · Propiedades del script:

   | propiedad | valor |
   | --- | --- |
   | `CASAS_ICAL` | `{"aloha-punta":["https://www.airbnb.mx/calendar/ical/….ics"], "punta-vista":[…], "punta-maeva":[…], "punta-rosa":[…]}` |
   | `AVISAR_A` | correo al que llega el aviso de reseña nueva |

   Los enlaces iCal **no van en el repo**: dejan ver el calendario completo de
   una propiedad a cualquiera que los tenga. Viven aquí y sólo aquí.

4. Implementar · Nueva implementación · Aplicación web.
   Ejecutar como **yo**, acceso **cualquier persona**. Sin eso, un huésped sin
   cuenta de Google no puede consultar fechas.
5. Pegar la URL `/exec` en tres sitios: `DISPONIBILIDAD` en `assets/sitio.js`,
   y `DESTINO` en `resena.html` y en `en/review.html`.

### 2 · WhatsApp

`WHATSAPP` en `assets/sitio.js`, en formato internacional y sin signos
(`52954…`).

### 3 · Fotos

El sitio anterior no tenía fotos propias: las enlazaba en caliente desde el
CDN de Airbnb, así que bastaba con que allí cambiaran una dirección para que
se quedara en blanco.

Actions · **Traer y optimizar las fotos** · Run workflow. Las baja, las deja
en dos tamaños y las versiona. Después se reparten entre los huecos del sitio
editando `assets/fotos.json`, sin tocar el HTML.

Cuando Maia mande los originales, mejor sustituirlas: Airbnb recomprime lo
que se le sube, y estas casas se venden por cómo se ven.

### 4 · Dominio

`CNAME` ya apunta a `puntacollection.com`. Falta, en Cloudflare, un CNAME de
`puntacollection.com` a `d1eg0dev.github.io`, y activar Pages en Settings ·
Pages · Deploy from a branch · `main` · `/`.

## Reseñas

No se raspan de Airbnb. No tienen API de reseñas y hacerlo va contra sus
términos, con la cuenta de anfitriona de la clienta de por medio.

En su lugar: la hoja manda. Una reseña que deja un huésped en el sitio entra
con `mostrar` en `no`; sale publicada cuando se pone `sí`. La columna `orden`
decide en qué posición aparece.

El sitio trae tres reseñas escritas en el HTML como respaldo. Si el script no
contesta, se quedan ésas, y la sección nunca sale vacía.

## Páginas de cada casa

Las ocho (cuatro casas × dos idiomas) las escribe `tools/genera.py` desde
`casas.json`. **No se editan a mano**: se corrige `casas.json` y se vuelve a
correr.

```
python3 tools/genera.py
```

Cada una lleva galería con las fotos de su carpeta, el calendario de esa casa
y enlaces a las otras tres. El calendario sale de `assets/calendario.js` y
pinta dos meses, con las noches ocupadas tachadas.

Si `DISPONIBILIDAD` está vacío en `assets/config.js`, el calendario se pinta
igual con todo libre y el huésped pide fechas por WhatsApp. Es a propósito:
antes que no enseñar nada.

## Páginas de sección

La Punta, Qué incluye y Preguntas tienen página propia, en los dos idiomas.
Salen de `secciones.json` con `tools/genera_secciones.py`, igual que las casas.

```
python3 tools/genera_secciones.py
```

En la portada esas secciones se quedan como resumen con un enlace al final,
para que la página principal siga leyéndose de un tirón.

Van aparte sobre todo por búsquedas: «La Punta de Zicatela» se busca mucho
más que el nombre de cualquiera de las casas, y una sección dentro de la
portada no compite por esa búsqueda.

**En los textos de La Punta no hay nombres de restaurantes ni de negocios.**
No se pueden inventar; hay que pedirle a la clienta sus recomendaciones y
añadirlas a `secciones.json`.
