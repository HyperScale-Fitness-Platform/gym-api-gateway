function errorHandler(err, req, res, next) {
  console.error("[gateway error]", err);

  const status = err.status || 500;
  const message = err.message || "internal gateway error";

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
