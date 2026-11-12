/* Punta Collection · carrusel de la galería
   La rejilla recortaba cada foto a un mismo formato y con mezcla de
   verticales y horizontales se comía medio encuadre. Aquí manda el alto y
   el ancho lo pone cada imagen, así que ninguna se recorta.

   En móvil basta con deslizar: las flechas se esconden. */

(function () {
  'use strict';

  document.querySelectorAll('.carrusel').forEach(function (c) {
    var tira = c.querySelector('.tira');
    var atras = c.querySelector('.atras');
    var adelante = c.querySelector('.adelante');
    if (!tira || !atras) return;

    function salto() {
      // Un paso = lo que se ve, menos un poco, para que siempre asome la
      // siguiente foto y se entienda que hay más.
      return Math.max(240, tira.clientWidth * 0.8);
    }

    function estado() {
      var fin = tira.scrollWidth - tira.clientWidth - 2;
      atras.disabled = tira.scrollLeft <= 2;
      adelante.disabled = tira.scrollLeft >= fin;
    }

    atras.addEventListener('click', function () {
      tira.scrollBy({ left: -salto(), behavior: 'smooth' });
    });
    adelante.addEventListener('click', function () {
      tira.scrollBy({ left: salto(), behavior: 'smooth' });
    });

    tira.addEventListener('scroll', estado, { passive: true });
    window.addEventListener('resize', estado);

    // Las imágenes llegan tarde y hasta entonces el ancho total miente,
    // así que se recalcula cuando cada una termina de cargar.
    tira.querySelectorAll('img').forEach(function (im) {
      if (im.complete) return;
      im.addEventListener('load', estado);
      im.addEventListener('error', estado);
    });

    estado();
  });
})();
