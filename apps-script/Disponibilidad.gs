/**
 * Punta Collection · disponibilidad por casa
 *
 * El navegador no puede leer los iCal de Airbnb directamente: no mandan
 * cabeceras de CORS. Así que este web app los lee por detrás, los traduce a
 * una lista de días ocupados y la sirve en JSON.
 *
 * Las direcciones iCal no van en el repo ni en el sitio: son enlaces secretos
 * que dejan ver el calendario completo de una propiedad a cualquiera que los
 * tenga. Viven en las propiedades del proyecto, que es lo único que no se
 * publica.
 *
 * Para ponerlo en marcha
 *   1. Configuración del proyecto · Propiedades del script
 *      CASAS_ICAL = {"aloha-punta":["https://www.airbnb.mx/calendar/ical/....ics"],
 *                    "punta-vista":[...], "punta-maeva":[...], "punta-rosa":[...]}
 *      Una casa puede llevar varias direcciones si está en más de un portal.
 *   2. Implementar · Nueva implementación · Aplicación web
 *      Ejecutar como: yo · Acceso: cualquier persona
 *   3. Pegar la URL /exec en assets/sitio.js, en DISPONIBILIDAD.
 *
 * Ojo con el nombre del parámetro: «c» está reservado por Google en las URLs
 * /macros/s/ y devuelve un 400 suyo antes de que la petición llegue aquí.
 */

var CACHE_SEGUNDOS = 1800;   // media hora: Airbnb no actualiza más rápido
var SLUG_OK = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
var HOJA_RESENAS = 'Reseñas';

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.accion === 'resenas') return json_({ ok: true, resenas: resenas_() });

    var casas = casasConfiguradas_();
    if (!p.casa) return json_({ ok: true, casas: Object.keys(casas) });

    if (p.casa === 'todas') {
      var todo = {};
      Object.keys(casas).forEach(function (slug) {
        try { todo[slug] = ocupadas_(slug, casas[slug]); }
        catch (err) { todo[slug] = { error: String(err.message || err) }; }
      });
      return json_({ ok: true, casas: todo });
    }

    if (!SLUG_OK.test(p.casa)) throw new Error('casa no válida');
    if (!casas[p.casa]) throw new Error('esa casa no está configurada');
    return json_({ ok: true, casa: p.casa, ocupadas: ocupadas_(p.casa, casas[p.casa]) });

  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function casasConfiguradas_() {
  var crudo = PropertiesService.getScriptProperties().getProperty('CASAS_ICAL');
  if (!crudo) throw new Error('falta la propiedad CASAS_ICAL');
  var cfg = JSON.parse(crudo), salida = {};
  Object.keys(cfg).forEach(function (slug) {
    var v = cfg[slug];
    salida[slug] = Array.isArray(v) ? v : [v];
  });
  return salida;
}

/** Devuelve los días ocupados de una casa, en formato AAAA-MM-DD. */
function ocupadas_(slug, urls) {
  var cache = CacheService.getScriptCache(), clave = 'ocup_' + slug;
  var guardado = cache.get(clave);
  if (guardado) return JSON.parse(guardado);

  var dias = {};
  urls.forEach(function (url) {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (r.getResponseCode() !== 200) {
      // Un calendario caído no puede tumbar a los demás: la casa se queda con
      // lo que sí se pudo leer y el sitio sigue funcionando.
      return;
    }
    leeIcal_(r.getContentText()).forEach(function (rango) {
      // En iCal el DTEND es exclusivo: el último día es de salida y esa noche
      // la casa ya está libre. Por eso el bucle no lo incluye.
      for (var d = rango[0]; d < rango[1]; d = masUnDia_(d)) dias[d] = 1;
    });
  });

  var lista = Object.keys(dias).sort();
  cache.put(clave, JSON.stringify(lista), CACHE_SEGUNDOS);
  return lista;
}

/** Saca los pares [inicio, fin) de un texto iCal. */
function leeIcal_(txt) {
  // Las líneas largas de iCal vienen partidas y continuadas con un espacio al
  // principio: se vuelven a unir antes de buscar nada.
  txt = txt.replace(/\r\n[ \t]/g, '');
  var fuera = [];
  txt.split('BEGIN:VEVENT').slice(1).forEach(function (ev) {
    var a = (ev.match(/DTSTART[^:\n]*:(\d{8})/) || [])[1];
    var b = (ev.match(/DTEND[^:\n]*:(\d{8})/) || [])[1];
    if (a && b) fuera.push([guion_(a), guion_(b)]);
  });
  return fuera;
}

function guion_(s) { return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8); }

function masUnDia_(iso) {
  var p = iso.split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + 1));
  return d.toISOString().slice(0, 10);
}

/* ---------- reseñas ----------
   Salen de una hoja que lleva Maia, no de Airbnb. Airbnb no tiene API de
   reseñas y rasparlas va contra sus términos: el riesgo sería su cuenta de
   anfitriona, no la nuestra. Además así elige cuáles se muestran y en qué
   orden, que para vender funciona mejor que enseñarlas todas.

   Propiedad del script: HOJA_RESENAS_ID con el id de la hoja de cálculo.
   Columnas: texto · nombre · lugar · casa · mostrar (sí/no) · orden        */
function resenas_() {
  var id = PropertiesService.getScriptProperties().getProperty('HOJA_RESENAS_ID');
  if (!id) return [];
  var cache = CacheService.getScriptCache(), guardado = cache.get('resenas');
  if (guardado) return JSON.parse(guardado);

  var h = SpreadsheetApp.openById(id).getSheetByName(HOJA_RESENAS);
  if (!h || h.getLastRow() < 2) return [];

  var filas = h.getRange(1, 1, h.getLastRow(), 6).getValues();
  var cab = filas.shift().map(function (c) { return String(c).trim().toLowerCase(); });
  function col(nombre) { return cab.indexOf(nombre); }

  var salida = [];
  filas.forEach(function (f) {
    var mostrar = String(f[col('mostrar')] || '').trim().toLowerCase();
    if (mostrar && ['no', 'false', '0'].indexOf(mostrar) >= 0) return;
    var texto = String(f[col('texto')] || '').trim();
    if (!texto) return;
    salida.push({
      texto: texto,
      nombre: String(f[col('nombre')] || '').trim(),
      lugar: String(f[col('lugar')] || '').trim(),
      casa: String(f[col('casa')] || '').trim(),
      orden: Number(f[col('orden')]) || 999
    });
  });
  salida.sort(function (a, b) { return a.orden - b.orden; });

  cache.put('resenas', JSON.stringify(salida), 600);
  return salida;
}

/** Crea la hoja de reseñas con las columnas puestas. Correr una vez. */
function creaHojaResenas() {
  var ss = SpreadsheetApp.create('Punta Collection · Reseñas');
  var h = ss.getSheets()[0].setName(HOJA_RESENAS);
  var cab = ['texto', 'nombre', 'lugar', 'casa', 'mostrar', 'orden'];
  h.getRange(1, 1, 1, cab.length).setValues([cab])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F5B57');
  h.setFrozenRows(1);
  h.setColumnWidth(1, 460);
  h.getRange('A:A').setWrap(true);
  h.getRange(2, 1, 1, cab.length).setValues([[
    'Desde que llegamos los anfitriones nos atendieron de la mejor manera y nos apoyaron con el transporte, tours y recomendaciones.',
    'Alfonzo', 'Chula Vista, California', 'Aloha Punta', 'sí', 1]]);
  PropertiesService.getScriptProperties()
    .setProperty('HOJA_RESENAS_ID', ss.getId());
  Logger.log('Hoja creada y registrada: ' + ss.getUrl());
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Para correr a mano desde el editor y ver que los iCal responden. */
function comprueba() {
  var casas = casasConfiguradas_();
  Object.keys(casas).forEach(function (slug) {
    try {
      var o = ocupadas_(slug, casas[slug]);
      Logger.log(slug + ': ' + o.length + ' días ocupados' +
        (o.length ? ' · del ' + o[0] + ' al ' + o[o.length - 1] : ''));
    } catch (err) {
      Logger.log(slug + ': ERROR ' + err.message);
    }
  });
}
