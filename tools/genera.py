#!/usr/bin/env python3
"""Escribe la página de cada casa, en español y en inglés, desde casas.json.

Son ocho páginas con la misma estructura y distinto contenido. A mano se
desincronizan a la primera corrección; así se edita casas.json y se vuelve
a correr esto.

    python3 tools/genera.py

Deja casas/<slug>.html y en/houses/<slug>.html.
"""

import html
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


# Los seis puntos que comparten las cuatro casas. Se repiten en la portada;
# aquí se vuelven a poner porque mucha gente entra directo a una casa desde
# Google y nunca pasa por la página principal.
INCLUIDO_ES = (
    '<div><h3>Casa completa y privada</h3><p>Nadie más se hospeda contigo.</p></div>'
    '<div><h3>Limpieza diaria</h3><p>Incluida, sin costo extra.</p></div>'
    '<div><h3>Internet Starlink</h3><p>El más estable de la zona, para trabajar sin cortes.</p></div>'
    '<div><h3>Alberca y plunge pool</h3><p>Abajo para nadar, arriba para el atardecer.</p></div>'
    '<div><h3>Aire acondicionado</h3><p>En todas las recámaras, cada una con su baño.</p></div>'
    '<div><h3>Llegada autónoma</h3><p>Cerradura con código, llegas a la hora que quieras.</p></div>'
)

INCLUIDO_EN = (
    '<div><h3>The whole house, privately</h3><p>Nobody else stays with you.</p></div>'
    '<div><h3>Daily cleaning</h3><p>Included, at no extra cost.</p></div>'
    '<div><h3>Starlink internet</h3><p>The most stable around, so you can work without drops.</p></div>'
    '<div><h3>Pool and plunge pool</h3><p>Downstairs to swim, upstairs for the sunset.</p></div>'
    '<div><h3>Air conditioning</h3><p>In every bedroom, each with its own bathroom.</p></div>'
    '<div><h3>Self check-in</h3><p>Keypad lock, so you arrive whenever you like.</p></div>'
)


def esc(s):
    return html.escape(str(s), quote=True)


def fotos_de(casa):
    """Las fotos de una casa, por orden de archivo."""
    carpeta = RAIZ / 'fotos' / casa['carpeta']
    if not carpeta.is_dir():
        return []
    grandes = sorted(carpeta.glob('*-grande.jpg'))
    return [(f'fotos/{casa["carpeta"]}/{f.name}',
             f'fotos/{casa["carpeta"]}/{f.name.replace("-grande", "-tarjeta")}')
            for f in grandes]


def pagina(casa, casas, en):
    idioma = 'en' if en else 'es'
    base = '../' if not en else '../../'
    nombre = casa['nombre']
    fotos = fotos_de(casa)
    portada = fotos[0][0] if fotos else ''

    t = {
        'inicio': 'Home' if en else 'Inicio',
        'casas': 'The houses' if en else 'Las casas',
        'resenas': 'reviews' if en else 'reseñas',
        'huespedes': 'guests' if en else 'huéspedes',
        'recamaras': 'bedrooms' if en else 'recámaras',
        'banos': 'bathrooms' if en else 'baños',
        'galeria': 'The house' if en else 'La casa',
        'disponibilidad': 'Availability' if en else 'Disponibilidad',
        'disponibilidad_pie': (
            'Booked nights come straight from the house calendar and update on '
            'their own. Pick your dates and we confirm the rate the same day.'
            if en else
            'Las noches ocupadas salen del calendario de la casa y se '
            'actualizan solas. Elige tus fechas y te confirmamos la tarifa el '
            'mismo día.'),
        'otras': 'The other houses' if en else 'Las otras casas',
        'incluye': 'Everything in the collection is included here too'
                   if en else 'Aquí también viene incluido todo',
        'incluye_pie': ('Whole house, daily cleaning, Starlink internet, pool '
                        'and plunge pool, air conditioning in every bedroom and '
                        'self check-in.'
                        if en else
                        'Casa completa, limpieza diaria, internet Starlink, '
                        'alberca y plunge pool, aire acondicionado en todas las '
                        'recámaras y llegada autónoma.'),
        'volver': 'See all four houses' if en else 'Ver las cuatro casas',
        'derechos': 'All rights reserved.' if en else 'Todos los derechos reservados.',
        'sitio': 'Site by' if en else 'Sitio por',
    }

    otras = [c for c in casas if c['slug'] != casa['slug']]
    enlace_otra = (lambda c: f'{c["slug"]}.html')

    galeria = ''
    for grande, tarjeta in fotos[:9]:
        galeria += (f'<a href="{base}{grande}" target="_blank" rel="noopener">'
                    f'<img src="{base}{tarjeta}" alt="{esc(nombre)}" loading="lazy"></a>')

    tarjetas_otras = ''
    for c in otras:
        f = fotos_de(c)
        fondo = f' style="background-image:url(\'{base}{f[0][1]}\')"' if f else ''
        tarjetas_otras += (
            f'<a class="otra" href="{enlace_otra(c)}">'
            f'<div class="foto"{fondo}></div>'
            f'<div class="cuerpo"><h3>{esc(c["nombre"])}</h3>'
            f'<span>{esc(c["resumen"][idioma])}</span></div></a>')

    otro_idioma = (f'../../casas/{casa["slug"]}.html' if en
                   else f'../en/houses/{casa["slug"]}.html')

    return f"""<!doctype html>
<html lang="{idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(nombre)} · Punta Collection</title>
<meta name="description" content="{esc(casa['resumen'][idioma])} {esc(casa['huespedes'])} {t['huespedes']}, {esc(casa['recamaras'])} {t['recamaras']}. La Punta de Zicatela, Puerto Escondido.">
<link rel="canonical" href="https://puntacollection.com/{'en/houses' if en else 'casas'}/{casa['slug']}.html">
<meta property="og:title" content="{esc(nombre)} · Punta Collection">
<meta property="og:description" content="{esc(casa['resumen'][idioma])}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://puntacollection.com/{portada}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{base}assets/estilo.css">
</head>
<body>

<header class="barra">
  <div class="envoltura">
    <a href="{base}{'en/' if en else ''}" class="marca"><b>Punta Collection</b><span>Puerto Escondido</span></a>
    <nav class="menu">
      <a href="{base}{'en/' if en else ''}#casas">{t['casas']}</a>
      <a href="{base}{'en/' if en else ''}#incluye">{'What is included' if en else 'Qué incluye'}</a>
      <a href="{base}{'en/' if en else ''}#punta">La Punta</a>
      <a href="#disponibilidad">{t['disponibilidad']}</a>
    </nav>
    <div class="idiomas">
      <a href="{otro_idioma if en else '#'}"{'' if en else ' class="activo"'}>ES</a>
      <a href="{'#' if en else otro_idioma}"{' class="activo"' if en else ''}>EN</a>
    </div>
  </div>
</header>

<main>

<section class="casa-portada">
  <div class="fondo" style="background-image:url('{base}{portada}')"></div>
  <div class="velo"></div>
  <div class="envoltura">
    <p class="migas"><a href="{base}{'en/' if en else ''}">{t['inicio']}</a> ·
      <a href="{base}{'en/' if en else ''}#casas">{t['casas']}</a></p>
    <p class="rotulo">{esc(casa['estilo'][idioma])}</p>
    <h1>{esc(nombre)}</h1>
    <p class="entradilla">{esc(casa['resumen'][idioma])}</p>
    <div class="ficha">
      <span><b>{esc(casa['huespedes'])}</b> {t['huespedes']}</span>
      <span><b>{esc(casa['recamaras'])}</b> {t['recamaras']}</span>
      <span><b>{esc(casa['banos'])}</b> {t['banos']}</span>
      <span>★ {esc(casa['estrellas'])} · {esc(casa['resenas'])} {t['resenas']}</span>
      <span>{esc(casa['ubicacion'][idioma])}</span>
    </div>
  </div>
</section>

<section>
  <div class="envoltura">
    <div class="cabecera oculto">
      <p class="rotulo">{t['galeria']}</p>
      <h2 style="margin:12px 0 14px">{esc(nombre)}</h2>
      <p class="entradilla">{esc(casa['texto'][idioma])}</p>
    </div>
    <div class="galeria oculto">{galeria}</div>
  </div>
</section>

<section id="disponibilidad" class="hondo">
  <div class="envoltura">
    <div class="cabecera oculto">
      <p class="rotulo">{t['disponibilidad']}</p>
      <h2 style="margin:12px 0 14px">{'When are you coming?' if en else '¿Cuándo vienes?'}</h2>
      <p class="entradilla">{t['disponibilidad_pie']}</p>
    </div>
    <div class="calendario oculto" data-calendario="{casa['slug']}" data-nombre="{esc(nombre)}"></div>
  </div>
</section>

<section>
  <div class="envoltura">
    <div class="cabecera oculto">
      <p class="rotulo">{'In every house' if en else 'En todas las casas'}</p>
      <h2 style="margin:12px 0 14px">{t['incluye']}</h2>
    </div>
    <div class="incluido oculto">{INCLUIDO_EN if en else INCLUIDO_ES}</div>
  </div>
</section>

<section class="hondo">
  <div class="envoltura">
    <div class="cabecera oculto">
      <p class="rotulo">{t['otras']}</p>
      <h2 style="margin:12px 0 14px">{'Maybe one of these fits better' if en else 'Quizá te cuadre mejor otra'}</h2>
    </div>
    <div class="otras oculto">{tarjetas_otras}</div>
    <p style="margin-top:32px"><a class="boton linea" href="{base}{'en/' if en else ''}#casas">{t['volver']}</a></p>
  </div>
</section>

</main>

<footer>
  <div class="envoltura">
    <div class="pie-bajo" style="margin-top:0;border:none;padding-top:0">
      <span>© <span id="anio">2026</span> Punta Collection. {t['derechos']}</span>
      <span>{t['sitio']} <a href="https://wdstudio.agency" rel="noopener">WD Studio</a></span>
    </div>
  </div>
</footer>

<a class="flotante" id="wa-flotante" href="#" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.3.2-1.5 0-.1-.2-.2-.5-.3zM12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1115.4-4.1 8.2 8.2 0 01-8.2 8z"/></svg>
</a>

<script src="{base}assets/config.js"></script>
<script src="{base}assets/calendario.js"></script>
<script>
  document.getElementById('anio').textContent = new Date().getFullYear();
  var wa = document.getElementById('wa-flotante');
  if (wa && window.PC) wa.href = 'https://wa.me/' + window.PC.WHATSAPP +
    '?text=' + encodeURIComponent({'"Hi, I would like to book ' if en else '"Hola, me interesa reservar '}{json.dumps(nombre)[1:-1]}.");
  // Sin JavaScript la página se ve entera; la clase de ocultar la pone él.
  document.querySelectorAll('.oculto').forEach(function (e) {{
    e.classList.add('aparece');
  }});
  var ojo = new IntersectionObserver(function (xs) {{
    xs.forEach(function (x) {{
      if (!x.isIntersecting) return;
      x.target.classList.add('visible');
      ojo.unobserve(x.target);
    }});
  }}, {{ rootMargin: '0px 0px -8% 0px', threshold: .05 }});
  document.querySelectorAll('.oculto').forEach(function (e) {{ ojo.observe(e); }});
</script>
</body>
</html>
"""


def main():
    datos = json.loads((RAIZ / 'casas.json').read_text(encoding='utf-8'))
    casas = datos['casas']

    (RAIZ / 'casas').mkdir(exist_ok=True)
    (RAIZ / 'en' / 'houses').mkdir(parents=True, exist_ok=True)

    sin_fotos = []
    for casa in casas:
        if not fotos_de(casa):
            sin_fotos.append(casa['slug'])
        for en in (False, True):
            destino = (RAIZ / 'en' / 'houses' if en else RAIZ / 'casas') / f'{casa["slug"]}.html'
            destino.write_text(pagina(casa, casas, en), encoding='utf-8')
            print(f'  {destino.relative_to(RAIZ)}')

    if sin_fotos:
        print('\nAviso: sin fotos todavía → ' + ', '.join(sin_fotos))
    print(f'\n{len(casas) * 2} páginas escritas.')


if __name__ == '__main__':
    sys.exit(main())
