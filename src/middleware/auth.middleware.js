// A "middleware" is just a function that Express runs before your actual
// route logic. It receives (req, res, next):
//   req  = the incoming request (headers, body, etc.)
//   res  = the response you could send back
//   next = a function you call when you're done, to let the request
//          continue on to whatever comes after this middleware
//
// If you DON'T call next() and instead call res.status(...).json(...),
// the request stops here — it never reaches the downstream service.

const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4000";

// This function checks the incoming request for a valid login token
// (a JWT) by asking gym-auth-service directly "is this token valid?"
// The gateway itself does NOT know how to decode/verify tokens — it
// delegates that entirely to auth-service, which is the only place that
// knows the secret key used to sign tokens.
async function authMiddleware(req, res, next) {
  // Clients are expected to send: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token at all, or it's not in the expected format.
    // 401 means "you are not authenticated."
    return res.status(401).json({ error: "missing or malformed authorization header" });
  }

  // "Bearer abc123" -> we only want the "abc123" part
  const token = authHeader.replace("Bearer ", "");

  try {
    // Ask auth-service: is this token valid, and if so, who does it belong to?
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify`, { token });

    if (!response.data.valid) {
      return res.status(401).json({ error: "invalid token" });
    }

    // Attach the decoded user info onto the request object so that later
    // code (the proxy step) can read it and forward it downstream.
    // response.data.decoded looks like: { sub: userId, email, role }
    req.user = response.data.decoded;

    // Everything checked out — let the request continue to the next step.
    return next();
  } catch (err) {
    // This happens if auth-service is down, unreachable, or explicitly
    // rejected the request. Treat all of these as "not authenticated"
    // rather than crashing the gateway.
    return res.status(401).json({ error: "unable to verify token" });
  }
}

module.exports = { authMiddleware };
