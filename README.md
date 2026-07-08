# gym-api-gateway (plain JavaScript)

Single entry point for every client (mobile, web, admin). This service does
exactly three things, and nothing else:

1. **Routes** incoming requests to the correct downstream service, based on
   URL prefix (see `src/config/routes.config.js`).
2. **Verifies login tokens** by asking `gym-auth-service` (never decodes
   tokens itself — that logic and the signing secret live only in
   auth-service).
3. **Forwards the verified identity** downstream as `x-user-id`,
   `x-user-email`, `x-user-role` headers, so other services don't need to
   re-verify tokens themselves.

No business logic belongs in this repo. If you find yourself writing an
`if` statement about bookings or payments here, that logic belongs in one
of the actual service repos instead.

## Why plain JavaScript instead of TypeScript

No compile step — you edit a `.js` file and `nodemon` restarts the server
directly. Fewer moving parts, faster to get started, at the cost of not
catching type errors before runtime. Fine tradeoff for a service this thin.

## File-by-file explanation

| File | What it does |
|---|---|
| `src/index.js` | Entrypoint. Creates the Express app, adds the health check, wires up routing, starts listening. |
| `src/config/routes.config.js` | The map of URL prefix → downstream service address → whether auth is required. Add new services here. |
| `src/middleware/auth.middleware.js` | Checks the `Authorization` header, calls auth-service to verify it, attaches the result to `req.user`. |
| `src/middleware/errorHandler.middleware.js` | Catches any error thrown earlier in the request and returns a clean JSON error response. |
| `src/proxy/proxy.js` | Actually forwards each request to its target service, injecting the `x-user-*` headers. |
| `k8s/deployment.yaml` | Tells Kubernetes how to run this service and expose it (uniquely among our services) to the outside world via NodePort. |
| `Dockerfile` | Packages this service into a container image. |

## Local development (running directly on your machine)

```bash
npm install
cp .env.example .env
npm run dev
```

The gateway is now running at `http://localhost:8080`. `npm run dev` uses
`nodemon`, which watches your files and restarts the server automatically
whenever you save a change — no manual restarting needed while you work.

### Testing it manually

You need `gym-auth-service` running too (in a separate terminal, on port
4000) since `/auth/*` requests get forwarded there.

```bash
# 1. register a user through the gateway
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"secret123","role":"customer"}'

# 2. log in to get a token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"secret123"}'
# copy the "token" value from the JSON response

# 3. call a protected route through the gateway
curl http://localhost:8080/operations/bookings \
  -H "Authorization: Bearer PASTE_YOUR_TOKEN_HERE"
```

Until `gym-operations-service` actually exists and is running, step 3 will
fail with a connection error — that's expected, not a bug in this repo.

## Running inside the local kind cluster

```bash
docker build -t gym-api-gateway:dev .
kind load docker-image gym-api-gateway:dev --name gym-dev
kubectl apply -f k8s/deployment.yaml

# should now be reachable at:
curl http://localhost:8080/health
```

This only works if your kind cluster was created with the port mapping
shown in `k8s/kind-config-reference.yaml` — that block needs to live in
`gym-platform-infra/kind-config.yaml`, used when the cluster is first
created (`kind create cluster --name gym-dev --config kind-config.yaml`).

## Security note

Downstream services (`operations`, `people`, `social`, `commerce`, `ai`)
trust the `x-user-*` headers completely, with no re-verification. This
means those services must **never** be reachable directly from outside the
cluster — only from the gateway. In production this gets enforced with a
Kubernetes NetworkPolicy; for local dev, it's just a convention to keep in
mind while building the other services (use `type: ClusterIP`, not
`NodePort`, for all of them).
