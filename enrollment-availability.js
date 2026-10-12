async function updateEnrollmentAvailability() {
  const status = document.getElementById('enrollment-availability');
  let enabled = false;
  try {
    const response = await fetch('/api/enrollment/status',{cache:'no-store'});
    if (!response.ok) throw new Error();
    const data = await response.json(); enabled = data.enabled === true;
    status.textContent = enabled ? 'Inscripciones habilitadas · Contrato disponible' : 'Inscripciones cerradas por el momento. Consulta con el colegio las próximas fechas.';
  } catch { status.textContent = 'No se pudo consultar la disponibilidad. Recarga la página o consulta con el colegio.'; }
  document.querySelectorAll('[data-enrollment-access]').forEach(link => {link.hidden = !enabled; link.style.display = enabled ? '' : 'none';});
}
updateEnrollmentAvailability();
setInterval(updateEnrollmentAvailability,20000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateEnrollmentAvailability();});
