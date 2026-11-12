/* Punta Collection · comportamiento del sitio
   Sin dependencias: son cuatro casas y un calendario, no hace falta más. */

(function () {
  'use strict';

  // La configuración vive en assets/config.js, que es el único archivo que
  // se edita al poner el sitio en marcha.
  var CFG = window.PC || {};
  var DISPONIBILIDAD = CFG.DISPONIBILIDAD || '';
  var WHATSAPP = CFG.WHATSAPP || '';

  /* ───────────────────────────────────────────────────────────────── */

  var ES = document.documentElement.lang !== 'en';
  var CASAS = {
    'aloha-punta': { nombre: 'Aloha Punta', max: 10 },
    'punta-vista': { nombre: 'Punta Vista', max: 10 },
    'punta-maeva': { nombre: 'Punta Maeva', max: 8 },
    'punta-rosa':  { nombre: 'Punta Rosa',  max: 6 }
  };

  var T = ES ? {
    faltan: 'Elige fecha de llegada y de salida.',
    orden: 'La salida tiene que ser después de la llegada.',
    pasado: 'Esa fecha ya pasó.',
    buscando: 'Consultando disponibilidad…',
    libre: 'está libre',
    libres: 'casas libres',
    ocupada: 'no está libre esas fechas',
    ninguna: 'Ninguna de las casas está libre esas fechas',
    alterna: 'Escríbenos y te proponemos fechas cercanas.',
    caben: 'para',
    huespedes: 'huéspedes',
    escribir: 'Escribir por WhatsApp',
    error: 'No pudimos consultar el calendario en este momento.',
    errorPie: 'Escríbenos y te confirmamos a mano en unos minutos.',
    noches: 'noches',
    noche: 'noche',
    saludo: 'Hola, me interesa reservar'
  } : {
    faltan: 'Pick a check-in and a check-out date.',
    orden: 'Check-out has to be after check-in.',
    pasado: 'That date is in the past.',
    buscando: 'Checking availability…',
    libre: 'is free',
    libres: 'houses free',
    ocupada: 'is not free on those dates',
    ninguna: 'None of the houses are free on those dates',
    alterna: 'Message us and we will suggest nearby dates.',
    caben: 'for',
    huespedes: 'guests',
    escribir: 'Message us on WhatsApp',
    error: 'We could not check the calendar right now.',
    errorPie: 'Message us and we will confirm by hand in a few minutes.',
    noches: 'nights',
    noche: 'night',
    saludo: 'Hi, I would like to book'
  };

  var $ = function (id) { return document.getElementById(id); };

  /* ── Fotos ───────────────────────────────────────────────────────
     Los huecos se rellenan desde un archivo aparte para que cambiar una
     foto no obligue a tocar el HTML. Si el archivo no está todavía, los
     huecos se quedan con su color de fondo y la página se ve entera. */
  function fotos() {
    var base = document.documentElement.lang === 'en' ? '../' : '';
    fetch(base + 'assets/fotos.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (mapa) {
        if (!mapa) return;
        document.querySelectorAll('[data-foto]').forEach(function (el) {
          var f = mapa[el.getAttribute('data-foto')];
          if (f) el.style.backgroundImage = 'url("' + base + f + '")';
        });
      })
      .catch(function () { /* sin fotos la página sigue en pie */ });
  }

  /* ── Reseñas ─────────────────────────────────────────────────────
     Las del HTML son el respaldo: si la hoja responde, se sustituyen.
     Así el sitio nunca sale sin reseñas, ni cuando el script falla. */
  function resenas() {
    if (!DISPONIBILIDAD) return;
    var caja = $('lista-resenas');
    if (!caja) return;
    fetch(DISPONIBILIDAD + '?accion=resenas')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        // Menos de tres se verían sueltas en una rejilla de tres, así que
        // hasta entonces se quedan las del HTML, que son reseñas reales
        // suyas y no texto de relleno.
        if (!d.ok || !d.resenas || d.resenas.length < 3) return;
        caja.innerHTML = d.resenas.slice(0, 3).map(function (r) {
          var firma = [r.nombre, r.lugar].filter(Boolean).join(' · ');
          return '<figure class="resena"><p>“' + esc(r.texto) + '”</p>' +
            (firma ? '<cite>' + esc(firma) + '</cite>' : '') + '</figure>';
        }).join('');
      })
      .catch(function () { /* se quedan las del HTML */ });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── Fechas ──────────────────────────────────────────────────────── */
  function hoy() { return new Date().toISOString().slice(0, 10); }

  function masUnDia(iso) {
    var p = iso.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + 1)).toISOString().slice(0, 10);
  }

  /** Las noches de una estancia: la de salida no cuenta, esa ya está libre. */
  function nochesEntre(a, b) {
    var fuera = [];
    for (var d = a; d < b; d = masUnDia(d)) fuera.push(d);
    return fuera;
  }

  function formatea(iso) {
    var p = iso.split('-');
    var f = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return f.toLocaleDateString(ES ? 'es-MX' : 'en-US',
      { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }

  /* ── WhatsApp ────────────────────────────────────────────────────── */
  function enlaceWa(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  function mensaje(casa, a, b, g) {
    var partes = [T.saludo];
    if (casa) partes.push(CASAS[casa] ? CASAS[casa].nombre : casa);
    if (a && b) partes.push((ES ? 'del ' : 'from ') + formatea(a) +
      (ES ? ' al ' : ' to ') + formatea(b));
    if (g) partes.push((ES ? 'para ' : 'for ') + g + ' ' + T.huespedes);
    return partes.join(' ') + '.';
  }

  /* ── Buscador ────────────────────────────────────────────────────── */
  function buscador() {
    var form = $('buscador');
    if (!form) return;

    var llegada = $('llegada'), salida = $('salida'), caja = $('respuesta');
    llegada.min = hoy();
    salida.min = masUnDia(hoy());
    llegada.addEventListener('change', function () {
      if (llegada.value) {
        salida.min = masUnDia(llegada.value);
        if (salida.value && salida.value <= llegada.value) salida.value = '';
      }
    });

    // Los botones de cada tarjeta preseleccionan la casa y suben al buscador,
    // en vez de abrir otro formulario que habría que mantener por duplicado.
    document.querySelectorAll('[data-casa]').forEach(function (b) {
      b.addEventListener('click', function () {
        $('casa').value = b.getAttribute('data-casa');
        document.querySelector('.portada').scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () { llegada.focus(); }, 500);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var casa = $('casa').value, a = llegada.value, b = salida.value,
          g = +$('huespedes').value;

      if (!a || !b) return pinta(T.faltan, false);
      if (b <= a) return pinta(T.orden, false);
      if (a < hoy()) return pinta(T.pasado, false);

      if (!DISPONIBILIDAD) return directo(casa, a, b, g);

      pinta(T.buscando, false, true);
      var url = DISPONIBILIDAD + '?casa=' + encodeURIComponent(casa || 'todas');
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.ok) throw new Error(d.error || 'sin respuesta');
          resuelve(d, casa, a, b, g);
        })
        .catch(function () {
          // Si el calendario no responde, el huésped no se puede quedar sin
          // salida: se le ofrece WhatsApp y lo confirmamos a mano.
          pinta('<b>' + T.error + '</b><br>' + T.errorPie, true,
            false, mensaje(casa, a, b, g));
        });
    });

    function resuelve(d, casa, a, b, g) {
      var noches = nochesEntre(a, b);
      var cuantas = noches.length;
      var sufijo = ' · ' + cuantas + ' ' + (cuantas === 1 ? T.noche : T.noches);

      function libre(ocupadas) {
        return !noches.some(function (n) { return ocupadas.indexOf(n) >= 0; });
      }

      if (casa) {
        var ok = libre(d.ocupadas || []);
        var nom = CASAS[casa].nombre;
        if (ok) {
          pinta('<b>' + nom + ' ' + T.libre + '</b>' + sufijo, false, false,
            mensaje(casa, a, b, g));
        } else {
          pinta('<b>' + nom + ' ' + T.ocupada + '.</b><br>' + T.alterna, true,
            false, mensaje(casa, a, b, g));
        }
        return;
      }

      var disponibles = Object.keys(CASAS).filter(function (s) {
        var o = (d.casas && d.casas[s]) || [];
        if (o.error) return false;
        return CASAS[s].max >= g && libre(o);
      });

      if (!disponibles.length) {
        pinta('<b>' + T.ninguna + sufijo + '.</b><br>' + T.alterna, true, false,
          mensaje('', a, b, g));
        return;
      }
      var nombres = disponibles.map(function (s) { return CASAS[s].nombre; });
      pinta('<b>' + nombres.length + ' ' + T.libres + sufijo + '</b><br>' +
        nombres.join(' · ') + ' — ' + T.caben + ' ' + g + ' ' + T.huespedes,
        false, false, mensaje(disponibles.length === 1 ? disponibles[0] : '', a, b, g));
    }

    function directo(casa, a, b, g) {
      window.open(enlaceWa(mensaje(casa, a, b, g)), '_blank', 'noopener');
    }

    function pinta(html, ocupado, cargando, textoWa) {
      caja.className = 'respuesta puesta';
      var acciones = textoWa
        ? '<div class="acciones"><a class="boton" target="_blank" rel="noopener" href="' +
          enlaceWa(textoWa) + '">' + T.escribir + '</a></div>'
        : '';
      caja.innerHTML = '<div class="aviso' + (ocupado ? ' ocupado' : '') + '">' +
        html + acciones + '</div>';
      if (cargando) caja.firstChild.style.opacity = '.7';
    }
  }

  /* ── WhatsApp suelto ─────────────────────────────────────────────── */
  function enlacesWa() {
    ['wa-cierre', 'wa-flotante'].forEach(function (id) {
      var el = $(id);
      if (el) el.href = enlaceWa(T.saludo + '.');
    });
  }

  /* ── Aparición al desplazar ──────────────────────────────────────── */
  function aparicion() {
    var piezas = document.querySelectorAll('.oculto');
    if (!('IntersectionObserver' in window)) {
      piezas.forEach(function (p) { p.classList.remove('oculto'); });
      return;
    }
    piezas.forEach(function (p) { p.classList.add('aparece'); });
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('visible');
        ojo.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    piezas.forEach(function (p) { ojo.observe(p); });
  }

  /* ── Arranque ────────────────────────────────────────────────────── */
  var anio = $('anio');
  if (anio) anio.textContent = new Date().getFullYear();
  fotos();
  resenas();
  buscador();
  enlacesWa();
  aparicion();
})();
