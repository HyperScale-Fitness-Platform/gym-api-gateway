const routes = [
  {
    prefix: "/auth",
    target: process.env.AUTH_SERVICE_URL,
    requiresAuth: false,
  },
  {
    prefix: "/operations", 
    target: process.env.OPERATIONS_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/people",
    target: process.env.PEOPLE_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/social",
    target: process.env.SOCIAL_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/commerce",
    target: process.env.COMMERCE_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/ai",
    target: process.env.AI_SERVICE_URL,
    requiresAuth: true,
  },
];


module.exports = { routes };
