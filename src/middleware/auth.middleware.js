const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

async function authMiddleware(req, res, next) {
  // Clients are expected to send: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing or malformed authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify`, { token });

    if (!response.data.valid) {
      return res.status(401).json({ error: "invalid token" });
    }

    // response.data.decoded looks like: { sub: userId, email, role }
    req.user = response.data.decoded;

    return next();
  } catch (err) {
    console.error("[auth middleware error]", err);
    return res.status(401).json({ error: "unable to verify token" });
  }
}

module.exports = { authMiddleware };
