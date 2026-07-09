// This file does the actual "forward this request to the right service"
// work, using a library called http-proxy-middleware. It takes an
// incoming request and re-sends it to a completely different server
// (one of our downstream services), then pipes the response back to
// the original client — all transparently.

const { createProxyMiddleware } = require("http-proxy-middleware");
const { routes } = require("../config/routes.config");
const { authMiddleware } = require("../middleware/auth.middleware");


function registerProxies(app) {
  for (const route of routes) {
    const middlewares = route.requiresAuth ? [authMiddleware] : [];

    app.use(
      route.prefix, 
      ...middlewares,

      // This function (from the http-proxy-middleware library) doesn't forward anything by itself.
      // It returns a middleware function, configured by the object you pass in. 
      // That returned function is what actually runs when a matching request comes in.
      createProxyMiddleware({
        target: route.target, 
        changeOrigin: true, // makes the proxied request look like it's coming from the target's own host (localhost:8080).

        // Express strips the mount prefix (e.g. "/auth") from req.url before this middleware ever sees the request — so a
        // request to /auth/register would arrive here as just /register.
        pathRewrite: (path) => `${route.prefix}${path}`,

        // This "on.proxyReq" hook runs right before the request is actually sent to the downstream service. 
        // We use it to attach the verified user identity as custom headers
        on: {
          proxyReq: (proxyReq, req) => {
            if (req.user) {
              proxyReq.setHeader("user-id", req.user.sub);
              proxyReq.setHeader("user-email", req.user.email);
              proxyReq.setHeader("user-role", req.user.role);
            }
          },
        },
      })
    );
  }
}

module.exports = { registerProxies };
