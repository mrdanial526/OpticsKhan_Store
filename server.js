require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const db = require('./db/database');
const { createToken, attachUser, requireAuth, requireAdmin } = require('./lib/auth');
const { sendOrderNotifications } = require('./lib/notifications');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_TEST = process.env.NODE_ENV === 'test';

// Behind Docker / Nginx / Render / Railway the real client IP comes from X-Forwarded-For
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// --- SECURITY MIDDLEWARE ---
// CSP allows inline handlers because the storefront uses onclick="App.x()" attributes.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: req => IS_TEST || req.path === '/live-sales-stream',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
// Stricter limit on login/register to slow down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => IS_TEST,
  message: { success: false, message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: IS_TEST ? 0 : '1h' }));
app.use('/api/', attachUser);

/** Returns 400 with a readable `message` (the frontend shows data.message). */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const list = errors.array();
  return res.status(400).json({ success: false, message: list[0].msg, errors: list });
};

/** Hides personal details on public order tracking unless viewer is owner/admin. */
const redactOrder = (order, viewer) => {
  const isAdmin = viewer && viewer.role === 'admin';
  const isOwner =
    viewer && order.customer && order.customer.email &&
    order.customer.email.toLowerCase() === String(viewer.email).toLowerCase();
  if (isAdmin || isOwner) return order;
  const phone = String((order.customer && order.customer.phone) || '');
  const masked = phone.length > 6 ? `${phone.slice(0, 4)}****${phone.slice(-3)}` : '****';
  const { prescription: _prescription, ...rest } = order;
  return {
    ...rest,
    items: (order.items || []).map(({ prescription: _p, ...item }) => item),
    customer: {
      fullName: order.customer ? order.customer.fullName : '',
      phone: masked,
      address: 'Hidden for privacy',
      city: order.customer ? order.customer.city : '',
    },
  };
};

// Simulated real-time sales pool for the live sales toast
const recentSalesPool = [
  { customer: "Hamza K.", city: "Lahore (Gulberg)", item: "Aviator Titanium Gold", time: "Just now" },
  { customer: "Ayesha N.", city: "Islamabad (F-7)", item: "Vogue Cat-Eye Rose Noir", time: "2 mins ago" },
  { customer: "Bilal S.", city: "Karachi (Clifton)", item: "BlueShield Pro Gamer & Dev", time: "4 mins ago" },
  { customer: "Dr. Farhan", city: "Faisalabad", item: "Executive Rimless Silhouette", time: "6 mins ago" },
  { customer: "Zainab R.", city: "Rawalpindi", item: "Wayfarer Havana Acetate", time: "8 mins ago" },
  { customer: "Omer J.", city: "Multan", item: "Vintage Round Titan Flex", time: "11 mins ago" },
  { customer: "Saad M.", city: "Peshawar", item: "Aviation Polarized Driver Max", time: "15 mins ago" },
  { customer: "Maryam T.", city: "Sialkot", item: "Crystal Clear Luxe Round", time: "18 mins ago" }
];

// --- REST API ENDPOINTS ---

// Health check (used by Docker / uptime monitors)
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', mongo: Boolean(db.mongoConnected), uptime: Math.round(process.uptime()) });
});

// 1. Get products with dynamic filtering, search & sorting
app.get('/api/products', (req, res) => {
  const { category, gender, shape, search, sort } = req.query;
  const products = db.getProducts({ category, gender, shape, search, sort });
  res.json({
    success: true,
    total: products.length,
    data: products
  });
});

// 2. Get single product by ID
app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, data: product });
});

// 3. Get categories
app.get('/api/categories', (req, res) => {
  const categories = db.getCategories();
  res.json({ success: true, data: categories });
});

// 4. Get lens customization options
app.get('/api/lens-options', (req, res) => {
  const lensOptions = db.getLensOptions();
  res.json({ success: true, data: lensOptions });
});

// 5. Get reviews
app.get('/api/reviews', (req, res) => {
  const reviews = db.getReviews();
  res.json({ success: true, data: reviews });
});

// 6. Submit a review
app.post(
  '/api/reviews',
  [
    body('author').trim().notEmpty().withMessage('Name and comment are required.').isLength({ max: 80 }),
    body('comment').trim().notEmpty().withMessage('Name and comment are required.').isLength({ max: 2000 }),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  ],
  validate,
  (req, res) => {
    const { author, city, rating, comment, productName } = req.body;
    const review = db.addReview({ author, city, rating, comment, productName });
    res.status(201).json({ success: true, message: "Review posted successfully!", data: review });
  }
);

// 7. Apply coupon code
app.post('/api/apply-coupon', (req, res) => {
  const { code, subtotal } = req.body;
  const result = db.applyCoupon(code, Number(subtotal) || 0);
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message });
  }
  res.json({ success: true, data: result });
});

// 8. Create an order
app.post(
  '/api/orders',
  [
    body('fullName').trim().notEmpty().withMessage('Full name required'),
    body('phone').trim().notEmpty().withMessage('Phone required'),
    body('address').trim().notEmpty().withMessage('Address required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('totalAmount').isFloat({ gt: 0 }).withMessage('Total amount must be positive'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email address')
  ],
  validate,
  (req, res) => {
    const { fullName, phone, email, address, city, items, subtotal, discount, deliveryFee, totalAmount, paymentMethod, transactionId, prescription } = req.body;
    // Signed-in customers: trust the token, not the request body
    const userId = req.user ? req.user.uid : req.body.userId;
    const { order, updatedUser } = db.createOrder({
      userId,
      fullName,
      phone,
      email,
      address,
      city: city || "Pakistan",
      items,
      subtotal,
      discount,
      deliveryFee,
      totalAmount,
      paymentMethod,
      transactionId,
      prescription
    });

    // Send automated email receipts / instant alerts to store admin & buyer
    sendOrderNotifications(order).catch(err => {
      if (!IS_TEST) console.warn('Order notification dispatch warning:', err.message);
    });

    // Prepend to recent sales so next toast can feature this actual purchase!
    recentSalesPool.unshift({
      customer: `${fullName.split(' ')[0]} ${fullName.split(' ')[1] ? fullName.split(' ')[1][0] + '.' : ''}`,
      city: city || "Pakistan",
      item: items[0]?.name || "Designer Eyewear",
      time: "Just now"
    });
    if (recentSalesPool.length > 50) recentSalesPool.length = 50;

    if (!IS_TEST) {
      console.log(`\n🔔 [NEW ORDER ALERT] Order #${order.orderId} placed by ${fullName} (${phone}) - Rs. ${totalAmount}`);
      console.log(`📦 Shipping to: ${address}, ${city || 'Pakistan'}`);
    }

    res.status(201).json({
      success: true,
      message: "Your optical order has been confirmed!",
      data: order,
      updatedUser
    });
  }
);

// 9. Lookup order by orderId (public tracking: personal details are masked)
app.get('/api/orders/:orderId', (req, res) => {
  const order = db.getOrder(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, data: redactOrder(order, req.user) });
});

// 10. Newsletter subscription
app.post(
  '/api/subscribe',
  [body('email').trim().isEmail().withMessage('Please provide a valid email address.')],
  validate,
  (req, res) => {
    const { email, phone } = req.body;
    const result = db.addSubscriber(email, phone);
    res.json({ success: true, message: result.message });
  }
);

// 11. Eye Examination / Optometrist Consultation Booking
app.post('/api/consultations', (req, res) => {
  const { fullName, phone, preferredDate, preferredCity, notes } = req.body;
  if (!fullName || !phone) {
    return res.status(400).json({ success: false, message: "Name and phone number are required." });
  }
  const appointment = db.bookConsultation({ fullName, phone, preferredDate, preferredCity, notes });
  res.status(201).json({
    success: true,
    message: "Your Optometrist Consultation appointment has been requested!",
    data: appointment
  });
});

// --- AUTHENTICATION ENDPOINTS (Customer & Owner) ---
app.post(
  '/api/auth/register',
  authLimiter,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional({ values: 'falsy' })
      .matches(/^[+0-9\s-]{7,20}$/)
      .withMessage('Please enter a valid phone number (e.g. 0324-1383370)')
  ],
  validate,
  (req, res) => {
    const { fullName, email, password, phone } = req.body;
    // role is never taken from the request: new accounts are always customers
    const result = db.registerUser({ fullName, email, password, phone });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  }
);

app.post(
  '/api/auth/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  (req, res) => {
    const { email, password } = req.body;
    const result = db.authenticateUser({ email, password });
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json({ ...result, token: createToken(result.user) });
  }
);

// Current session (lets the frontend confirm a stored token is still valid)
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.uid);
  if (!user) return res.status(401).json({ success: false, message: 'Account not found.' });
  res.json({ success: true, user });
});

// Customers can only see their own orders (email comes from the signed token)
app.get('/api/auth/my-orders', requireAuth, (req, res) => {
  const orders = db.getUserOrders(req.user.email);
  res.json({ success: true, total: orders.length, data: orders });
});

// --- OWNER / MANAGEMENT PRODUCT MANAGEMENT (CRUD) ---
app.post('/api/products', requireAdmin, (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Product name and price are required." });
  }
  const product = db.addProduct(req.body);
  res.status(201).json({ success: true, message: "New optical frame added to catalog!", data: product });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, message: "Product updated successfully!", data: updated });
});

app.patch('/api/products/:id/stock', requireAdmin, (req, res) => {
  const product = db.toggleProductStock(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, message: `Product is now ${product.inStock ? 'In Stock' : 'Out of Stock'}`, data: product });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, message: "Product removed from catalog" });
});

// --- OWNER ATELIER STATS & FULFILLMENT (all /api/admin/* routes are owner-only) ---
app.use('/api/admin', requireAdmin);

app.get('/api/admin/stats', (req, res) => {
  const stats = db.getAdminStats();
  res.json({ success: true, data: stats });
});

app.get('/api/admin/orders', (req, res) => {
  const orders = db.getAllOrders();
  res.json({ success: true, total: orders.length, data: orders });
});

app.patch('/api/admin/orders/:orderId', (req, res) => {
  const { status, courierName, courierTrackingNumber } = req.body;
  const order = db.updateOrderStatus(req.params.orderId, status, { courierName, courierTrackingNumber });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, message: "Order status updated", data: order });
});

// --- REVIEWS & RATINGS ---
app.get('/api/products/:id/reviews', (req, res) => {
  const allReviews = db.getReviews();
  const filtered = allReviews.filter(r => r.productId === req.params.id);
  res.json({ success: true, data: filtered });
});

app.post('/api/products/:id/reviews', (req, res) => {
  const { author, city, rating, comment } = req.body;
  if (!comment) {
    return res.status(400).json({ success: false, message: "Please enter your review comment." });
  }
  const review = db.addProductReview(req.params.id, { author, city, rating, comment });
  res.status(201).json({ success: true, message: "Thank you for your verified optical review!", data: review });
});

// --- COUPON & PROMO CODE MANAGEMENT ---
app.get('/api/admin/coupons', (req, res) => {
  res.json({ success: true, data: db.getAllCoupons() });
});

app.post('/api/admin/coupons', (req, res) => {
  const result = db.addCoupon(req.body);
  if (!result.success) return res.status(400).json(result);
  res.status(201).json({ success: true, message: "Promo coupon code created!", data: result.coupon });
});

app.delete('/api/admin/coupons/:code', (req, res) => {
  const deleted = db.deleteCoupon(req.params.code);
  if (!deleted) return res.status(404).json({ success: false, message: "Coupon code not found" });
  res.json({ success: true, message: "Coupon removed" });
});

// 12. Real-time Server-Sent Events (SSE) for live sales notifications
app.get('/api/live-sales-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send an immediate first alert
  const initialSale = recentSalesPool[Math.floor(Math.random() * recentSalesPool.length)];
  res.write(`data: ${JSON.stringify(initialSale)}\n\n`);

  // Stream subsequent real-time sales alerts periodically
  const interval = setInterval(() => {
    const sale = recentSalesPool[Math.floor(Math.random() * recentSalesPool.length)];
    res.write(`data: ${JSON.stringify(sale)}\n\n`);
  }, 14000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Unknown API routes return JSON 404 instead of the HTML page
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback to SPA index.html (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// JSON error handler (bad JSON, payload too large, unexpected errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Server error:', err);
  res.status(status).json({
    success: false,
    message: status === 413 ? 'Upload too large (max 10MB).' : status >= 500 ? 'Something went wrong. Please try again.' : err.message,
  });
});

// Owner password: set ADMIN_PASSWORD in .env to replace the default demo password
db.applyOwnerPassword(process.env.ADMIN_PASSWORD);

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`👓 FabOptic Store Server Running at: http://localhost:${PORT}`);
    console.log(`🚀 REST API & Real-time Sales Alerts active`);
    console.log(`===============================================`);
  });

  // Graceful shutdown: close HTTP server + MongoDB cleanly on SIGTERM/SIGINT
  const shutdown = (signal) => {
    console.log(`\n🛑 ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          await mongoose.disconnect();
          console.log('✓ MongoDB disconnected.');
        }
      } catch { /* ignore */ }
      console.log('✓ Server closed. Goodbye!');
      process.exit(0);
    });
    // Force exit after 10s if connections don't close
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
