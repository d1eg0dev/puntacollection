/* Punta Collection · lo único que hay que tocar al poner el sitio en marcha.
   Está en un archivo aparte a propósito: el resto del JavaScript no se edita
   nunca, y así no hay que ir buscando constantes por tres sitios. */

window.PC = {

  // URL /exec del Apps Script de disponibilidad (apps-script/Disponibilidad.gs).
  // Vacío: el buscador no consulta nada y manda directo a WhatsApp, que es
  // mejor que decirle «no disponible» a un huésped por un fallo de config.
  DISPONIBILIDAD: 'https://script.google.com/macros/s/AKfycbxsLY5uNp-ZV-AhBfbL5tEhSUzxK96K9VwHsAdXc-yu-b7cF4lDSVkkZv0krxL7vi5rfg/exec',

  // WhatsApp en formato internacional, sin signos ni espacios.
  WHATSAPP: '525579481356'

};
