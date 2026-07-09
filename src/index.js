const express = require("express");

// The .env file ONLY matters for local development — in Kubernetes, environment
// variables are injected directly by the deployment.yaml instead, and
// there is no .env file at all in that environment.
const dotenv = require("dotenv");
dotenv.config();  

const { registerProxies } = require("./proxy/proxy");
const { errorHandler } = require("./middleware/errorHandler.middleware");


const app = express();

// A basic health check endpoint. Kubernetes will call this repeatedly
// (via readinessProbe/livenessProbe in deployment.yaml). If this endpoint stops
// responding, Kubernetes will restart the pod automatically.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "api-gateway" });
});


registerProxies(app);

app.use(errorHandler);


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`api-gateway listening on port ${PORT}`);
});
