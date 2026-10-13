/* Envío nativo: conserva la validación del navegador y el antispam de FormSubmit. */
(() => {
  'use strict';
  const form = document.getElementById('school-contact-form');
  if (!form) return;
  const birthdate = form.querySelector('#contact-student-birthdate');
  const phone = form.querySelector('#contact-phone');
  const button = form.querySelector('button[type="submit"]');
  const originalButton = button.innerHTML;
  const today = new Date();
  birthdate.max = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  for (const field of form.querySelectorAll('input[required], textarea[required]')) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }
  function hidden(name, value) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = value; form.append(input);
  }
  if (location.protocol === 'https:' || location.protocol === 'http:') {
    const next = new URL(location.href);
    next.search = '?contacto=procesado'; next.hash = 'formulario-contacto';
    hidden('_next', next.href);
    hidden('_url', new URL(location.pathname, location.origin).href + '#formulario-contacto');
  }
  form.addEventListener('submit', event => {
    if (button.disabled) { event.preventDefault(); return; }
    for (const field of form.querySelectorAll('input[type="text"][required], input[type="tel"][required], input[type="email"][required], textarea[required]')) {
      field.value = field.value.trim();
      field.setCustomValidity(!field.value ? 'Completa este campo.' : field.minLength > 0 && field.value.length < field.minLength ? 'Escribe al menos ' + field.minLength + ' caracteres.' : '');
    }
    const digits = phone.value.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(phone.value) || digits.length < 7 || digits.length > 15) phone.setCustomValidity('Escribe un teléfono válido de entre 7 y 15 dígitos.');
    if (!form.reportValidity()) { event.preventDefault(); return; }
    // El navegador envía el POST al servicio. No se guardan datos en este sitio.
    button.disabled = true;
    button.textContent = 'Continuando al envío…';
  });
  window.addEventListener('pageshow', () => { button.disabled = false; button.innerHTML = originalButton; });
  const url = new URL(location.href);
  if (url.searchParams.get('contacto') === 'procesado') {
    const result = document.getElementById('school-contact-result');
    result.textContent = 'Tu consulta fue enviada al servicio de correo para su procesamiento. El colegio se comunicará contigo por los datos que proporcionaste. Recuerda que el contacto no confirma la inscripción.';
    result.hidden = false;
    url.searchParams.delete('contacto');
    history.replaceState(history.state, '', url);
  }
})();
