const express = require("express");
const cors = require("cors"); // Added CORS

// The .env file ONLY matters for local development — in Kubernetes, environment
// variables are injected directly by the deployment.yaml instead, and
// there is no .env file at all in that environment.
const dotenv = require("dotenv");
dotenv.config();  

const { registerProxies } = require("./proxy/proxy");
const { errorHandler } = require("./middleware/errorHandler.middleware");

const app = express();

// Configure CORS to allow your React frontend to connect.
// Update the origin array if your frontend runs on a different port (e.g., Vite defaults to 5173, CRA to 3000).
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"], 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true // Required if you plan to send JWT cookies later
}));

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