export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    // Las antiguas rutas del panel ya no están disponibles.
    if (/^\/administracion(?:\.html)?\/?$/i.test(path) || /^\/api\/enrollment(?:\/|$)/.test(path)) {
      return new Response('Página no disponible.', {
        status: 404,
        headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}
      });
    }
    return env.ASSETS.fetch(request);
  }
};
