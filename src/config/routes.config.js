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
    prefix: "/api/profiles",
    target: process.env.PEOPLE_SERVICE_URL,
    requiresAuth: true,
  },
    {
    prefix: "/progress",
    target: process.env.PROGRESS_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/social",
    target: process.env.SOCIAL_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/chat",
    target: process.env.SOCIAL_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/commerce",
    target: process.env.COMMERCE_SERVICE_URL,
    requiresAuth: true,
    // catalog-service exposes /api/products, not /commerce/api/products.
    preservePrefix: false,
  },
  {
    prefix: "/orders",
    target: process.env.ORDER_SERVICE_URL,
    requiresAuth: true,
    // order-service exposes /api/cart and /api/orders directly.
    preservePrefix: false,
  },
  {
    prefix: "/payments",
    target: process.env.PAYMENT_SERVICE_URL,
    requiresAuth: true,
  },
  {
    prefix: "/ai",
    target: process.env.AI_SERVICE_URL,
    requiresAuth: true,
  },
];


module.exports = { routes };
