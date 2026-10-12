const el = id => document.getElementById(id);
let me, setup = false, state;
function message(text,error=false) { el('admin-message').textContent=text; el('admin-message').dataset.error=String(error); }
async function api(path,body) {
  const response=await fetch('/api/enrollment/'+path,{cache:'no-store',...(body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {})});
  let data; try { data=await response.json(); } catch { throw new Error('No se pudo conectar con la administración. Inténtalo más tarde.'); }
  if (!response.ok) {
    if (response.status===401 && me) { me=null; el('dashboard').hidden=true; el('access').hidden=false; }
    throw new Error(data.error || 'No se pudo completar la operación.');
  }
  return data;
}
function renderState(next) {
  state=next; el('state-badge').textContent=state.enabled?'Habilitadas':'Deshabilitadas'; el('state-badge').dataset.closed=String(!state.enabled);
  el('state-title').textContent=state.enabled?'Las inscripciones están abiertas':'Las inscripciones están cerradas';
  el('state-help').textContent=state.enabled?'Las familias pueden completar y descargar el contrato desde la web.':'Las familias ven un aviso de cierre. El contrato estará disponible cuando vuelvas a habilitar las inscripciones.';
  el('toggle-state').textContent=state.enabled?'Deshabilitar inscripciones':'Habilitar inscripciones';
  el('last-change').textContent=state.updatedAt?`Último cambio: ${new Date(state.updatedAt).toLocaleString('es-PY')} · ${state.updatedBy}`:'Todavía no se ha cambiado el estado.';
}
function renderUsers(users) {
  el('users-list').replaceChildren();
  users.forEach(user=>{
    const row=document.createElement('li'), info=document.createElement('span'), name=document.createElement('strong'), detail=document.createElement('small');
    name.textContent=user.name; detail.textContent=`${user.username} · ${user.role==='director'?'Dirección':'Personal administrativo'}${user.username===me.username?' · Tu cuenta':''}`;
    info.append(name,detail);row.append(info);
    if(user.username!==me.username) {
      const button=document.createElement('button');button.type='button';button.textContent='Quitar acceso';button.setAttribute('aria-label',`Quitar acceso a ${user.name}`);
      button.onclick=async()=>{
        if(!confirm(`¿Quitar el acceso de ${user.name}? Se cerrarán sus sesiones.`)) return;
        button.disabled=true;
        try {renderUsers((await api('users/remove',{username:user.username})).users);message('Acceso eliminado.');} catch(error) {message(error.message,true);button.disabled=false;}
      };row.append(button);
    }
    el('users-list').append(row);
  });
}
async function refresh() {
  const data=await api('me');me=data.user;setup=data.setupRequired;
  el('access').hidden=Boolean(me);el('dashboard').hidden=!me;
  if(me) {el('welcome').textContent=`Hola, ${me.name}`;renderState(data.state);el('accounts').hidden=me.role!=='director';if(me.role==='director')renderUsers(data.users);message('Tu sesión está activa. Los cambios se aplican a toda la web.');}
  else {
    el('setup-name-wrap').hidden=!setup;el('setup-key-wrap').hidden=!setup;el('setup-name').required=setup;el('setup-key').required=setup;
    el('password').minLength=setup?12:1;el('password').autocomplete=setup?'new-password':'current-password';
    el('access-title').textContent=setup?'Activar la cuenta de dirección':'Iniciar sesión';el('login-button').textContent=setup?'Crear cuenta de dirección':'Entrar';
    el('access-help').textContent=setup?'Crea la primera cuenta. Después podrás dar acceso al personal administrativo.':'Usa la cuenta que te entregó la dirección del colegio.';
    el('login-button').disabled=setup&&!data.setupConfigured;
    message(setup&&!data.setupConfigured?'Falta la activación inicial: el propietario debe agregar la clave ENROLLMENT_SETUP_KEY en Cloudflare.':'Ingresa para administrar las inscripciones.');
  }
}
el('login-form').onsubmit=async event=>{event.preventDefault();el('login-button').disabled=true;
  try {await api(setup?'setup':'login',{username:el('username').value,password:el('password').value,...(setup?{name:el('setup-name').value,setupKey:el('setup-key').value}:{})});el('login-form').reset();await refresh();}catch(error){message(error.message,true);}finally{el('login-button').disabled=false;}
};
el('logout').onclick=async()=>{try{await api('logout',{});await refresh();}catch(error){message(error.message,true);}};
el('toggle-state').onclick=async()=>{
  if(state.enabled&&!confirm('¿Deshabilitar las inscripciones para todos los visitantes?'))return;
  el('toggle-state').disabled=true;
  try {const data=await api('status',{enabled:!state.enabled});renderState(data.state);message(state.enabled?'Inscripciones habilitadas.':'Inscripciones deshabilitadas.');}catch(error){message(error.message,true);}finally{el('toggle-state').disabled=false;}
};
el('user-form').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;
  try {const data=await api('users',{name:el('new-name').value,username:el('new-username').value,password:el('new-password').value,role:el('new-role').value});renderUsers(data.users);el('user-form').reset();message('Cuenta creada. Esa persona ya puede iniciar sesión.');}catch(error){message(error.message,true);}finally{button.disabled=false;}
};
refresh().catch(error=>message(error.message,true));
