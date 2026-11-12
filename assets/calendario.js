/* Punta Collection · calendario de disponibilidad de una casa
   Pinta dos meses, marca los días ocupados según el iCal de Airbnb y deja
   elegir un rango. Lo que el contrato llama «calendario por casa».

   Se activa solo si hay un elemento con data-calendario="<slug de la casa>". */

(function () {
  'use strict';

  var caja = document.querySelector('[data-calendario]');
  if (!caja) return;

  var CFG = window.PC || {};
  var SLUG = caja.getAttribute('data-calendario');
  var NOMBRE = caja.getAttribute('data-nombre') || SLUG;
  var EN = document.documentElement.lang === 'en';

  var T = EN ? {
    cargando: 'Loading the calendar…',
    sinCalendario: 'Pick your dates and we will confirm within the hour.',
    error: 'We could not load the calendar. Message us and we will check by hand.',
    ocupado: 'Booked',
    elegido: 'Your stay',
    elige: 'Pick your check-in date',
    eligeSalida: 'Now pick your check-out date',
    cruza: 'Those dates cross a booked night. Pick another range.',
    pedir: 'Ask for these dates',
    noche: 'night', noches: 'nights',
    meses: ['January','February','March','April','May','June','July',
            'August','September','October','November','December'],
    dias: ['Su','Mo','Tu','We','Th','Fr','Sa'],
    saludo: 'Hi, I would like to book'
  } : {
    cargando: 'Cargando el calendario…',
    sinCalendario: 'Elige tus fechas y te confirmamos en menos de una hora.',
    error: 'No pudimos cargar el calendario. Escríbenos y lo revisamos a mano.',
    ocupado: 'Ocupado',
    elegido: 'Tu estancia',
    elige: 'Elige tu fecha de llegada',
    eligeSalida: 'Ahora elige la fecha de salida',
    cruza: 'Esas fechas cruzan una noche ocupada. Elige otro rango.',
    pedir: 'Pedir estas fechas',
    noche: 'noche', noches: 'noches',
    meses: ['enero','febrero','marzo','abril','mayo','junio','julio',
            'agosto','septiembre','octubre','noviembre','diciembre'],
    dias: ['D','L','M','M','J','V','S'],
    saludo: 'Hola, me interesa reservar'
  };

  var ocupadas = [];      // días en AAAA-MM-DD
  var desde = null, hasta = null;
  var mesBase = new Date();
  mesBase = new Date(Date.UTC(mesBase.getUTCFullYear(), mesBase.getUTCMonth(), 1));

  /* ── Fechas ───────────────────────────────────────────────────── */
  function iso(d) { return d.toISOString().slice(0, 10); }
  function hoy() { return iso(new Date()); }
  function masDias(s, n) {
    var p = s.split('-');
    return iso(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)));
  }
  function noches(a, b) {
    var f = [];
    for (var d = a; d < b; d = masDias(d, 1)) f.push(d);
    return f;
  }
  function bonita(s) {
    var p = s.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]))
      .toLocaleDateString(EN ? 'en-US' : 'es-MX',
        { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }

  /* ── Pintado ──────────────────────────────────────────────────── */
  function mes(primero) {
    var anio = primero.getUTCFullYear(), m = primero.getUTCMonth();
    var arranque = new Date(Date.UTC(anio, m, 1)).getUTCDay();
    var cuantos = new Date(Date.UTC(anio, m + 1, 0)).getUTCDate();

    var html = '<div class="mes"><div class="mes-alto">' +
      T.meses[m] + ' ' + anio + '</div><div class="rejilla">';
    T.dias.forEach(function (d) { html += '<span class="dia-cab">' + d + '</span>'; });
    for (var i = 0; i < arranque; i++) html += '<span></span>';

    for (var n = 1; n <= cuantos; n++) {
      var f = anio + '-' + String(m + 1).padStart(2, '0') + '-' + String(n).padStart(2, '0');
      var clases = ['dia'];
      if (f < hoy()) clases.push('pasado');
      else if (ocupadas.indexOf(f) >= 0) clases.push('ocupado');
      if (desde && hasta && f >= desde && f < hasta) clases.push('elegido');
      else if (f === desde) clases.push('elegido');
      html += '<button type="button" class="' + clases.join(' ') +
        '" data-dia="' + f + '">' + n + '</button>';
    }
    return html + '</div></div>';
  }

  function pinta() {
    var siguiente = new Date(Date.UTC(mesBase.getUTCFullYear(), mesBase.getUTCMonth() + 1, 1));
    caja.querySelector('.meses').innerHTML = mes(mesBase) + mes(siguiente);

    var atras = caja.querySelector('.atras');
    // No se puede retroceder a meses que ya pasaron: sólo confunde.
    atras.disabled = iso(mesBase) <= hoy().slice(0, 8) + '01';

    caja.querySelectorAll('.dia').forEach(function (b) {
      if (b.classList.contains('pasado') || b.classList.contains('ocupado')) {
        b.disabled = true;
        return;
      }
      b.addEventListener('click', function () { elige(b.getAttribute('data-dia')); });
    });
    mensaje();
  }

  function elige(f) {
    if (!desde || hasta) { desde = f; hasta = null; }
    else if (f <= desde) { desde = f; }
    else {
      // La noche de salida no se ocupa, por eso el rango se comprueba sin ella.
      var cruce = noches(desde, f).some(function (n) { return ocupadas.indexOf(n) >= 0; });
      if (cruce) { aviso(T.cruza); return; }
      hasta = f;
    }
    pinta();
  }

  function mensaje() {
    var pie = caja.querySelector('.calendario-pie');
    if (!desde) return aviso(T.elige);
    if (!hasta) return aviso(T.eligeSalida);

    var n = noches(desde, hasta).length;
    var texto = T.saludo + ' ' + NOMBRE + (EN ? ' from ' : ' del ') + bonita(desde) +
      (EN ? ' to ' : ' al ') + bonita(hasta) + '.';
    pie.innerHTML = '<span class="elegido-texto"><b>' + bonita(desde) + ' → ' +
      bonita(hasta) + '</b> · ' + n + ' ' + (n === 1 ? T.noche : T.noches) + '</span>' +
      '<a class="boton" target="_blank" rel="noopener" href="https://wa.me/' +
      (CFG.WHATSAPP || '') + '?text=' + encodeURIComponent(texto) + '">' + T.pedir + '</a>';
  }

  function aviso(t) {
    caja.querySelector('.calendario-pie').innerHTML =
      '<span class="elegido-texto">' + t + '</span>';
  }

  /* ── Arranque ─────────────────────────────────────────────────── */
  caja.innerHTML =
    '<div class="calendario-alto">' +
      '<button type="button" class="paso atras" aria-label="Mes anterior">‹</button>' +
      '<div class="leyenda">' +
        '<span><i class="m-ocupado"></i>' + T.ocupado + '</span>' +
        '<span><i class="m-elegido"></i>' + T.elegido + '</span>' +
      '</div>' +
      '<button type="button" class="paso adelante" aria-label="Mes siguiente">›</button>' +
    '</div>' +
    '<div class="meses"><p class="cargando">' + T.cargando + '</p></div>' +
    '<div class="calendario-pie"></div>';

  caja.querySelector('.atras').addEventListener('click', function () {
    mesBase = new Date(Date.UTC(mesBase.getUTCFullYear(), mesBase.getUTCMonth() - 1, 1));
    pinta();
  });
  caja.querySelector('.adelante').addEventListener('click', function () {
    mesBase = new Date(Date.UTC(mesBase.getUTCFullYear(), mesBase.getUTCMonth() + 1, 1));
    pinta();
  });

  if (!CFG.DISPONIBILIDAD) {
    // Sin calendario conectado se pinta igual, con todo libre: el huésped
    // elige fechas y las pedimos por WhatsApp. Peor sería no enseñar nada.
    pinta();
    aviso(T.sinCalendario);
    return;
  }

  fetch(CFG.DISPONIBILIDAD + '?casa=' + encodeURIComponent(SLUG))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.ok) throw new Error(d.error || '');
      ocupadas = d.ocupadas || [];
      pinta();
    })
    .catch(function () {
      pinta();
      aviso(T.error);
    });
})();
