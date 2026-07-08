// This file is the single source of truth for routing.
// Every entry says: "requests starting with this URL prefix should be
// forwarded to this downstream service, and here's whether the gateway
// needs to check a login token first."
//
// When your team adds a 6th service later, you add ONE object to this
// array — nothing else in the whole gateway needs to change. This is the
// entire point of centralizing routing in one file instead of scattering
// route definitions throughout the codebase.

const routes = [
  {
    prefix: "/auth",
    // process.env.X reads an environment variable. The "|| " part is a
    // fallback default used if that environment variable isn't set —
    // useful so the gateway still works locally without a full .env file.
    target: process.env.AUTH_SERVICE_URL || "http://auth-service:4000",
    requiresAuth: false, // login and register must work WITHOUT a token
  },
  {
    prefix: "/operations", // covers occupancy, booking, membership
    target: process.env.OPERATIONS_SERVICE_URL || "http://operations-service:4001",
    requiresAuth: true,
  },
  {
    prefix: "/people", // covers profiles, progress, plans
    target: process.env.PEOPLE_SERVICE_URL || "http://people-service:4002",
    requiresAuth: true,
  },
  {
    prefix: "/social", // covers community, chat, notifications
    target: process.env.SOCIAL_SERVICE_URL || "http://social-service:4003",
    requiresAuth: true,
  },
  {
    prefix: "/commerce", // covers catalog, orders, payments
    target: process.env.COMMERCE_SERVICE_URL || "http://commerce-service:4004",
    requiresAuth: true,
  },
  {
    prefix: "/ai",
    target: process.env.AI_SERVICE_URL || "http://ai-service:4005",
    requiresAuth: true,
  },
];

// "module.exports" is how a plain Node.js file shares something with other
// files. Any other file that does require('./routes.config') will receive
// this object.
module.exports = { routes };
