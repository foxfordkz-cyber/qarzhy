import { handleBudgetApi } from './api.mjs';

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/v1/')) return handleBudgetApi(request, env.DB);
    if (path === '/' && request.method === 'GET') return Response.redirect('https://foxfordkz-cyber.github.io/qarzhy/', 302);
    return new Response('Not found', { status: 404 });
  }
};
