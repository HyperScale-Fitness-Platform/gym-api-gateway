// Express has a special rule: any middleware function with FOUR
// parameters (err, req, res, next) instead of three is treated as an
// "error handler." Express automatically routes any error thrown
// anywhere earlier in the request cycle to this function, as long as
// it's registered LAST, after all your normal routes.

function errorHandler(err, req, res, next) {
  console.error("[gateway error]", err);

  // err.status lets code elsewhere throw a specific HTTP status if it
  // wants to (e.g. "throw { status: 404, message: 'not found' }").
  // If nothing specified one, default to 500 (generic server error).
  const status = err.status || 500;
  const message = err.message || "internal gateway error";

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
