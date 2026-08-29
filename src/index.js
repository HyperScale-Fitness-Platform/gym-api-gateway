const express = require("express");
const cors = require("cors"); // Added CORS
const { createProxyMiddleware } = require("http-proxy-middleware");

// The .env file ONLY matters for local development — in Kubernetes, environment
// variables are injected directly by the deployment.yaml instead, and
// there is no .env file at all in that environment.
const dotenv = require("dotenv");
dotenv.config();

const { registerProxies } = require("./proxy/proxy");
const { errorHandler } = require("./middleware/errorHandler.middleware");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

// Socket.IO (chat with trainer) lives in social-service. Its client hits
// /socket.io/... for both the long-poll handshake AND the WebSocket upgrade.
// This proxy is mounted at the root with a pathFilter (no prefix stripping —
// the downstream server also serves /socket.io) and ws:true. It is registered
// BEFORE the gateway's own cors() so socket.io requests use social-service's
// CORS (origin:"*") rather than the gateway's allow-list — otherwise the
// preflight for a cross-origin client comes back with no Allow-Origin and the
// browser blocks the connection. The upgrade event is wired to the HTTP
// server below; Express routing never sees a raw WebSocket upgrade.
const socketProxy = createProxyMiddleware({
  target: process.env.SOCIAL_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  pathFilter: "/socket.io",
});
app.use(socketProxy);

// Configure CORS to allow the React frontend to connect.
// The origin list can be overridden at deploy time via the CORS_ORIGINS env var
// (comma-separated). In production the frontend is served from the same origin
// as the gateway (shared ALB), so browser calls are same-origin and not blocked.
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true, // Required if you plan to send JWT cookies later
  }),
);

// upload.routes.js needs a parsed JSON body (filename/contentType) — the
// proxied routes below don't need this, http-proxy-middleware streams
// their raw bodies straight through to the downstream service instead.
app.use("/uploads", express.json());

// A basic health check endpoint. Kubernetes will call this repeatedly
// (via readinessProbe/livenessProbe in deployment.yaml). If this endpoint stops
// responding, Kubernetes will restart the pod automatically.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "api-gateway" });
});

app.use("/uploads", uploadRoutes);

registerProxies(app);

app.use(errorHandler);

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`api-gateway listening on port ${PORT}`);
});

server.on("upgrade", socketProxy.upgrade);
