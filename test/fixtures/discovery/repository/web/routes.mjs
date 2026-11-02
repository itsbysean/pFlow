export function status(request, response) { response.end('alive'); }

// @HttpRoute('/admin') is documentation only; this export is never installed.
export function AdminController_handleRequest(request, response) { response.end('not installed'); }

export function createRouter() {
  const routes = new Map();
  return {
    routes,
    dispatch(request, response) {
      const target = routes.get(`${request.method} ${request.url}`);
      if (!target) { response.statusCode = 404; response.end('missing'); return; }
      return target(request, response);
    },
  };
}
export function installRoutes(router) {
  router.routes.set('GET /status', status);
}
