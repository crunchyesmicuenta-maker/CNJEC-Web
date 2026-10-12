const json = (data, status = 200, extra = {}) => Response.json(data, {status, headers: {'Cache-Control':'no-store', ...extra}});
const bytes = value => new TextEncoder().encode(value);
const hex = value => Array.from(new Uint8Array(value), b => b.toString(16).padStart(2,'0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async value => hex(await crypto.subtle.digest('SHA-256', bytes(value)));
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', bytes(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:bytes(salt), iterations:100000}, key, 256));
}
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0;
}
const cookie = (token, age = 28800) => `__Host-cnjec_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

export class EnrollmentControl {
  constructor(ctx, env) {
    this.env = env; this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, username TEXT NOT NULL, expires INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, enabled INTEGER NOT NULL, updatedAt TEXT, updatedBy TEXT)`);
    this.sql.exec(`INSERT OR IGNORE INTO settings (id, enabled) VALUES (1, 1)`);
  }
  one(query, ...args) { return this.sql.exec(query, ...args).toArray()[0]; }
  state() { const row = this.one('SELECT * FROM settings WHERE id = 1'); return {enabled:Boolean(row.enabled), updatedAt:row.updatedAt, updatedBy:row.updatedBy}; }
  users() { return this.sql.exec('SELECT username, name, role FROM users ORDER BY name').toArray(); }
  async session(request) {
    const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-cnjec_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    if (!token) return null;
    return this.one('SELECT users.username, users.name, users.role FROM sessions JOIN users ON users.username = sessions.username WHERE token = ? AND expires > ?', await digest(token), Date.now());
  }
  async fetch(request) {
    try { return await this.route(request); }
    catch { return json({error:'No se pudo completar la operación. Inténtalo de nuevo.'}, 500); }
  }
  async route(request) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/api/enrollment/status') {
      const {enabled,updatedAt} = this.state(); return json({enabled,updatedAt});
    }
    if (request.method === 'GET' && path === '/api/enrollment/me') {
      const user = await this.session(request);
      const setupRequired = !this.one('SELECT username FROM users LIMIT 1');
      return json({user,setupRequired,setupConfigured:setupRequired && (this.env.ENROLLMENT_SETUP_KEY?.length >= 32), ...(user ? {state:this.state(),users:user.role === 'director' ? this.users() : []} : {})});
    }
    if (request.method !== 'POST') return json({error:'Ruta no disponible.'},404);
    const raw = await request.text();
    if (request.headers.get('Origin') !== new URL(request.url).origin || !request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Solicitud no permitida.'},403);
    if (raw.length > 4096) return json({error:'Solicitud demasiado grande.'},413);
    let body; try { body = JSON.parse(raw); } catch { return json({error:'Datos no válidos.'},400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'Datos no válidos.'},400);
    if (path === '/api/enrollment/login' || path === '/api/enrollment/setup') {
      this.sql.exec('DELETE FROM attempts WHERE expires <= ?', Date.now());
      const ip = await digest(request.headers.get('CF-Connecting-IP') || 'local');
      const key = path + ip;
      this.sql.exec('INSERT INTO attempts (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count = count + 1',key,Date.now() + 900000);
      if (this.one('SELECT count FROM attempts WHERE id = ?',key).count > 10) return json({error:'Demasiados intentos. Espera 15 minutos.'},429);
      const username = String(body.username || '').trim().toLowerCase();
      const password = body.password;
      if (typeof password !== 'string' || password.length > 128) return json({error:'Usuario o contraseña incorrectos.'},401);
      if (path.endsWith('/setup')) {
        if (!(this.env.ENROLLMENT_SETUP_KEY?.length >= 32) || !equal(body.setupKey, this.env.ENROLLMENT_SETUP_KEY)) return json({error:'Clave de activación incorrecta.'},403);
        const error = this.validateUser({...body,username}); if (error) return json({error},400);
        const salt = random(); const hash = await passwordHash(password,salt);
        if (this.one('SELECT username FROM users LIMIT 1')) return json({error:'La cuenta inicial ya fue creada. Inicia sesión.'},409);
        this.sql.exec('INSERT INTO users VALUES (?,?,?,?,?)',username,body.name.trim(),'director',salt,hash);
      } else {
        const user = this.one('SELECT * FROM users WHERE username = ?',username);
        const hash = await passwordHash(password,user?.salt || 'invalid-user-salt');
        if (!user || !equal(hash,user.hash)) return json({error:'Usuario o contraseña incorrectos.'},401);
      }
      this.sql.exec('DELETE FROM sessions WHERE expires <= ?',Date.now());
      const token = random(); this.sql.exec('INSERT INTO sessions VALUES (?,?,?)',await digest(token),username,Date.now() + 28800000);
      this.sql.exec('DELETE FROM attempts WHERE id = ?',key);
      return json({ok:true},200,{'Set-Cookie':cookie(token)});
    }
    const user = await this.session(request);
    if (!user) return json({error:'Inicia sesión para continuar.'},401);
    if (path === '/api/enrollment/logout') {
      const token = request.headers.get('Cookie')?.match(/__Host-cnjec_session=([a-f0-9]{64})/)?.[1];
      if (token) this.sql.exec('DELETE FROM sessions WHERE token = ?',await digest(token));
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    if (path === '/api/enrollment/status') {
      if (typeof body.enabled !== 'boolean') return json({error:'Selecciona un estado válido.'},400);
      this.sql.exec('UPDATE settings SET enabled = ?, updatedAt = ?, updatedBy = ? WHERE id = 1',body.enabled ? 1 : 0,new Date().toISOString(),user.name);
      return json({state:this.state()});
    }
    if (user.role !== 'director') return json({error:'Solo la dirección puede administrar cuentas.'},403);
    if (path === '/api/enrollment/users') {
      body.username = String(body.username || '').trim().toLowerCase();
      const error = this.validateUser(body); if (error) return json({error},400);
      if (!['director','staff'].includes(body.role)) return json({error:'Cargo no válido.'},400);
      const salt = random(); const hash = await passwordHash(body.password,salt);
      if (this.users().length >= 20) return json({error:'Se permiten hasta 20 cuentas.'},400);
      if (this.one('SELECT username FROM users WHERE username = ?',body.username)) return json({error:'Ese usuario ya existe.'},409);
      this.sql.exec('INSERT INTO users VALUES (?,?,?,?,?)',body.username,body.name.trim(),body.role,salt,hash);
      return json({users:this.users()});
    }
    if (path === '/api/enrollment/users/remove') {
      if (body.username === user.username) return json({error:'No puedes eliminar tu propia cuenta.'},400);
      if (typeof body.username !== 'string') return json({error:'Usuario no válido.'},400);
      this.sql.exec('DELETE FROM users WHERE username = ?',body.username);
      this.sql.exec('DELETE FROM sessions WHERE username = ?',body.username);
      return json({users:this.users()});
    }
    return json({error:'Ruta no disponible.'},404);
  }
  validateUser(body) {
    if (!/^[a-z0-9._-]{3,40}$/.test(body.username)) return 'El usuario debe tener entre 3 y 40 letras sin acentos, números, puntos o guiones.';
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80) return 'Escribe un nombre de entre 2 y 80 caracteres.';
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) return 'La contraseña debe tener entre 12 y 128 caracteres.';
  }
}

export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    let path; try { path = decodeURIComponent(url.pathname).toLowerCase(); } catch { return new Response('Ruta no válida',{status:400}); }
    if (path.startsWith('/server/') || path.startsWith('/.')) return new Response('No disponible',{status:404});
    const control = env.ENROLLMENT.get(env.ENROLLMENT.idFromName('school'));
    if (url.pathname.startsWith('/api/enrollment/')) return control.fetch(request);
    if ((/\.(pdf|docx)$/.test(path) && path.includes('contrato')) || path.endsWith('/contract-fields.json')) {
      let enabled = false;
      try { enabled = (await (await control.fetch(new Request(new URL('/api/enrollment/status',url)))).json()).enabled; } catch {}
      if (!enabled) return new Response('Las inscripciones están cerradas. Consulta con el colegio.',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
      const asset = await env.ASSETS.fetch(request); const response = new Response(asset.body,asset);
      response.headers.set('Cache-Control','no-store'); return response;
    }
    return env.ASSETS.fetch(request);
  }
};
