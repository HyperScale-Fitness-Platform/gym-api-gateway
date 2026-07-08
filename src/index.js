// This is the file that actually starts the server. Running
// "node src/index.js" (or "npm run dev") executes this file top to bottom.

const express = require("express");

// dotenv.config() reads a local .env file (if one exists) and loads its
// values into process.env, so process.env.PORT etc. become available.
// This ONLY matters for local development — in Kubernetes, environment
// variables are injected directly by the deployment.yaml instead, and
// there is no .env file at all in that environment.

const dotenv = require("dotenv");
dotenv.config();   // must run BEFORE requiring anything that reads process.env

const { registerProxies } = require("./proxy/proxy");
const { errorHandler } = require("./middleware/errorHandler.middleware");

// Create the actual Express application object. Every route, middleware,
// and proxy we set up below gets attached to this one object.
const app = express();

// A basic health check endpoint. Kubernetes will call this repeatedly
// (via readinessProbe/livenessProbe in deployment.yaml) to know whether
// this pod is alive and ready to receive traffic. If this endpoint stops
// responding, Kubernetes will restart the pod automatically.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "api-gateway" });
});

// This single function call reads routes.config.js and sets up every
// downstream route, with auth checks applied where configured. See
// src/proxy/proxy.js for exactly what this does.
registerProxies(app);

// IMPORTANT: error handlers must be registered LAST, after every other
// route/middleware. Express only reaches this if something earlier threw
// an error or called next(err).
app.use(errorHandler);

// process.env.PORT lets you override the port (e.g. in Kubernetes), and
// falls back to 8080 if nothing is set (useful for quick local testing).
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`api-gateway listening on port ${PORT}`);
});
