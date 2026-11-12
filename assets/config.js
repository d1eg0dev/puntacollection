/* Punta Collection · lo único que hay que tocar al poner el sitio en marcha.
   Está en un archivo aparte a propósito: el resto del JavaScript no se edita
   nunca, y así no hay que ir buscando constantes por tres sitios. */

window.PC = {

  // URL /exec del Apps Script de disponibilidad (apps-script/Disponibilidad.gs).
  // Vacío: el buscador no consulta nada y manda directo a WhatsApp, que es
  // mejor que decirle «no disponible» a un huésped por un fallo de config.
  DISPONIBILIDAD: '',

  // WhatsApp en formato internacional, sin signos ni espacios.
  WHATSAPP: '525512345678'

};
