#!/usr/bin/env python3
"""Escribe las páginas de sección (La Punta, Qué incluye, Preguntas).

Mismo trato que las casas: el contenido vive en secciones.json y de ahí
salen las seis páginas, tres por idioma.

    python3 tools/genera_secciones.py

Deja secciones/<slug>.html y en/<slug_en>.html
"""

import html
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def esc(s):
    return html.escape(str(s), quote=True)


def foto_de(clave):
    """Una foto cualquiera para la portada de la sección, si la hay."""
    mapa = json.loads((RAIZ / 'assets' / 'fotos.json').read_text(encoding='utf-8'))
    ruta = mapa.get(clave)
    if ruta and (RAIZ / ruta).exists():
        return ruta
    # Si no hay una asignada, la primera que exista sirve: mejor una foto suya
    # que una franja de color.
    for c in sorted((RAIZ / 'fotos').glob('*/01-grande.jpg')):
        return str(c.relative_to(RAIZ))
    return ''


def pagina(sec, secciones, casas, en):
    idioma = 'en' if en else 'es'
    base = '../'
    slug = sec['slug_en'] if en else sec['slug']
    portada = foto_de(sec.get('foto') or '')

    t = {
        'inicio': 'Home' if en else 'Inicio',
        'casas': 'The houses' if en else 'Las casas',
        'volver': 'See the four houses' if en else 'Ver las cuatro casas',
        'escribir': 'Message us on WhatsApp' if en else 'Escríbenos por WhatsApp',
        'derechos': 'All rights reserved.' if en else 'Todos los derechos reservados.',
        'por': 'By' if en else 'Por',
        'distancias': 'Distances' if en else 'Distancias',
    }

    def ruta_sec(s):
        return f'{base}' + (f'en/{s["slug_en"]}.html' if en else f'secciones/{s["slug"]}.html')

    nav = ''.join(
        f'<a href="{ruta_sec(s)}">{esc(s["nav"][idioma])}</a>' for s in secciones)

    otro_idioma = (f'../secciones/{sec["slug"]}.html' if en
                   else f'../en/{sec["slug_en"]}.html')

    cuerpo = ''
    if sec.get('bloques'):
        cuerpo += '<div class="bloques oculto">'
        for b in sec['bloques']:
            cuerpo += (f'<div><h3>{esc(b["titulo"][idioma])}</h3>'
                       f'<p>{esc(b["texto"][idioma])}</p></div>')
        cuerpo += '</div>'

    if sec.get('distancias'):
        cuerpo += ('<div class="distancias oculto" style="max-width:640px;margin-top:48px">'
                   + ''.join(
                       f'<div><b>{esc(d["que"][idioma])}</b>'
                       f'<span>{esc(d["cuanto"][idioma])}</span></div>'
                       for d in sec['distancias'])
                   + '</div>')

    if sec.get('preguntas'):
        cuerpo += '<div class="preguntas oculto">'
        for q in sec['preguntas']:
            cuerpo += (f'<details><summary>{esc(q["p"][idioma])}</summary>'
                       f'<p>{esc(q["r"][idioma])}</p></details>')
        cuerpo += '</div>'

    tarjetas = ''
    for c in casas:
        carpeta = RAIZ / 'fotos' / c['carpeta']
        primera = sorted(carpeta.glob('*-tarjeta.jpg'))
        fondo = (f' style="background-image:url(\'{base}fotos/{c["carpeta"]}/'
                 f'{primera[0].name}\')"' if primera else '')
        destino = (f'{base}en/houses/{c["slug"]}.html' if en
                   else f'{base}casas/{c["slug"]}.html')
        tarjetas += (f'<a class="otra" href="{destino}"><div class="foto"{fondo}></div>'
                     f'<div class="cuerpo"><h3>{esc(c["nombre"])}</h3>'
                     f'<span>{esc(c["resumen"][idioma])}</span></div></a>')

    return f"""<!doctype html>
<html lang="{idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(sec['titulo'][idioma])} · Punta Collection</title>
<meta name="description" content="{esc(sec['entradilla'][idioma])}">
<link rel="canonical" href="https://puntacollection.com/{'en' if en else 'secciones'}/{slug}.html">
<meta property="og:title" content="{esc(sec['titulo'][idioma])} · Punta Collection">
<meta property="og:description" content="{esc(sec['entradilla'][idioma])}">
<meta property="og:type" content="website">
{f'<meta property="og:image" content="https://puntacollection.com/{portada}">' if portada else ''}
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
      {nav}
    </nav>
    <div class="idiomas">
      <a href="{otro_idioma if en else '#'}"{'' if en else ' class="activo"'}>ES</a>
      <a href="{'#' if en else otro_idioma}"{' class="activo"' if en else ''}>EN</a>
    </div>
  </div>
</header>

<main>

<section class="{'casa-portada' if portada else ''}" {'' if portada else 'style="padding-top:130px"'}>
  {f'<div class="fondo" style="background-image:url(&quot;{base}{portada}&quot;)"></div><div class="velo"></div>' if portada else ''}
  <div class="envoltura">
    <p class="migas"><a href="{base}{'en/' if en else ''}">{t['inicio']}</a></p>
    <p class="rotulo">{esc(sec['rotulo'][idioma])}</p>
    <h1>{esc(sec['titulo'][idioma])}</h1>
    <p class="entradilla">{esc(sec['entradilla'][idioma])}</p>
  </div>
</section>

<section>
  <div class="envoltura">
    {cuerpo}
  </div>
</section>

<section class="hondo">
  <div class="envoltura">
    <div class="cabecera oculto">
      <p class="rotulo">{t['casas']}</p>
      <h2 style="margin:12px 0 14px">{'Pick yours' if en else 'Elige la tuya'}</h2>
    </div>
    <div class="otras cuatro oculto">{tarjetas}</div>
    <p style="margin-top:32px"><a class="boton linea" href="{base}{'en/' if en else ''}#casas">{t['volver']}</a></p>
  </div>
</section>

</main>

<footer>
  <div class="envoltura">
    <div class="pie-bajo" style="margin-top:0;border:none;padding-top:0">
      <span>© <span id="anio">2026</span> Punta Collection. {t['derechos']}</span>
      <span>{t['por']} <a href="https://wdstudio.agency" rel="noopener">WD Studio Agency</a></span>
    </div>
  </div>
</footer>

<a class="flotante" id="wa-flotante" href="#" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.3.2-1.5 0-.1-.2-.2-.5-.3zM12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1115.4-4.1 8.2 8.2 0 01-8.2 8z"/></svg>
</a>

<script src="{base}assets/config.js"></script>
<script>
  document.getElementById('anio').textContent = new Date().getFullYear();
  var wa = document.getElementById('wa-flotante');
  if (wa && window.PC) wa.href = 'https://wa.me/' + window.PC.WHATSAPP +
    '?text=' + encodeURIComponent({'"Hi, I would like to book."' if en else '"Hola, me interesa reservar."'});
  document.querySelectorAll('.oculto').forEach(function (e) {{ e.classList.add('aparece'); }});
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
    secciones = json.loads((RAIZ / 'secciones.json').read_text(encoding='utf-8'))['secciones']
    casas = json.loads((RAIZ / 'casas.json').read_text(encoding='utf-8'))['casas']

    (RAIZ / 'secciones').mkdir(exist_ok=True)
    (RAIZ / 'en').mkdir(exist_ok=True)

    for sec in secciones:
        for en in (False, True):
            slug = sec['slug_en'] if en else sec['slug']
            destino = (RAIZ / 'en' if en else RAIZ / 'secciones') / f'{slug}.html'
            destino.write_text(pagina(sec, secciones, casas, en), encoding='utf-8')
            print(f'  {destino.relative_to(RAIZ)}')

    print(f'\n{len(secciones) * 2} páginas de sección escritas.')


if __name__ == '__main__':
    sys.exit(main())
