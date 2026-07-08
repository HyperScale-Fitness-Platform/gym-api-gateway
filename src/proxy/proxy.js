// This file does the actual "forward this request to the right service"
// work, using a library called http-proxy-middleware. It takes an
// incoming request and re-sends it to a completely different server
// (one of our downstream services), then pipes the response back to
// the original client — all transparently.

const { createProxyMiddleware } = require("http-proxy-middleware");
const { routes } = require("../config/routes.config");
const { authMiddleware } = require("../middleware/auth.middleware");

// "app" here is the Express application object created in index.js.
// This function loops over every route we defined and registers it.
function registerProxies(app) {
  for (const route of routes) {
    // If this route requires auth, we put authMiddleware in front of it.
    // If not (like /auth itself, since you can't require a token to log in),
    // we use an empty array, meaning "no extra middleware, just proxy it."
    const middlewares = route.requiresAuth ? [authMiddleware] : [];

    app.use(
      route.prefix, // e.g. "/operations" — matches any URL starting with this
      ...middlewares, // spreads either [authMiddleware] or [] into app.use's arguments
      createProxyMiddleware({
        target: route.target, // e.g. "http://operations-service:4001"
        changeOrigin: true, // makes the proxied request look like it's coming
                             // from the target's own host, which most backend
                             // frameworks expect for things like CORS checks

        // IMPORTANT: Express strips the mount prefix (e.g. "/auth") from
        // req.url before this middleware ever sees the request — so a
        // request to /auth/register would arrive here as just /register.
        // pathRewrite puts the prefix back on before forwarding, so the
        // downstream service (which expects the FULL path, e.g.
        // /auth/register) receives the correct URL.
        pathRewrite: (path) => `${route.prefix}${path}`,

        // This "on.proxyReq" hook runs right before the request is actually
        // sent to the downstream service. We use it to attach the verified
        // user identity as custom headers, so the downstream service knows
        // WHO is making the request without having to verify a JWT itself.
        on: {
          proxyReq: (proxyReq, req) => {
            if (req.user) {
              // req.user was set earlier by authMiddleware, if this route
              // required auth. These custom headers are a convention —
              // downstream services read them to know the caller's identity.
              proxyReq.setHeader("x-user-id", req.user.sub);
              proxyReq.setHeader("x-user-email", req.user.email);
              proxyReq.setHeader("x-user-role", req.user.role);
            }
          },
        },
      })
    );
  }
}

module.exports = { registerProxies };
