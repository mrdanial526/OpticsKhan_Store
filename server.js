require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simulated real-time sales pool for the Socket.IO / live-stream sales toast
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
app.post('/api/reviews', (req, res) => {
  const { author, city, rating, comment, productName } = req.body;
  if (!author || !comment) {
    return res.status(400).json({ success: false, message: "Name and comment are required." });
  }
  const review = db.addReview({ author, city, rating, comment, productName });
  res.status(201).json({ success: true, message: "Review posted successfully!", data: review });
});

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
app.post('/api/orders', (req, res) => {
  const { userId, fullName, phone, email, address, city, items, subtotal, discount, deliveryFee, totalAmount, paymentMethod, prescription } = req.body;
  if (!fullName || !phone || !address || !items || !items.length) {
    return res.status(400).json({ success: false, message: "Missing required order information." });
  }
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
    prescription
  });

  // Prepend to recent sales so next toast can feature this actual purchase!
  recentSalesPool.unshift({
    customer: `${fullName.split(' ')[0]} ${fullName.split(' ')[1] ? fullName.split(' ')[1][0] + '.' : ''}`,
    city: city || "Pakistan",
    item: items[0]?.name || "Designer Eyewear",
    time: "Just now"
  });

  console.log(`\n🔔 [NEW ORDER ALERT] Order #${order.orderId} placed by ${fullName} (${phone}) - Rs. ${totalAmount}`);
  console.log(`📦 Shipping to: ${address}, ${city || 'Pakistan'}`);
  console.log(`📧 Dispatched receipt to ${email || 'customer@faboptic.pk'}`);

  res.status(201).json({
    success: true,
    message: "Your optical order has been confirmed!",
    data: order,
    updatedUser
  });
});

// 9. Lookup order by orderId
app.get('/api/orders/:orderId', (req, res) => {
  const order = db.getOrder(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, data: order });
});

// 10. Newsletter subscription
app.post('/api/subscribe', (req, res) => {
  const { email, phone } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Please provide your email address." });
  }
  const result = db.addSubscriber(email, phone);
  res.json({ success: true, message: result.message });
});

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
app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password, phone } = req.body;
  const result = db.registerUser({ fullName, email, password, phone });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const result = db.authenticateUser({ email, password });
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.get('/api/auth/my-orders', (req, res) => {
  const { email } = req.query;
  const orders = db.getUserOrders(email);
  res.json({ success: true, total: orders.length, data: orders });
});

// --- OWNER / MANAGEMENT PRODUCT MANAGEMENT (CRUD) ---
app.post('/api/products', (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Product name and price are required." });
  }
  const product = db.addProduct(req.body);
  res.status(201).json({ success: true, message: "New optical frame added to catalog!", data: product });
});

app.put('/api/products/:id', (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, message: "Product updated successfully!", data: updated });
});

app.patch('/api/products/:id/stock', (req, res) => {
  const product = db.toggleProductStock(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, message: `Product is now ${product.inStock ? 'In Stock' : 'Out of Stock'}`, data: product });
});

app.delete('/api/products/:id', (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, message: "Product removed from catalog" });
});

// --- OWNER ATELIER STATS & FULFILLMENT ---
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

  // Stream subsequent real-time sales alerts periodically (mimics Socket.IO real-time alerts)
  const interval = setInterval(() => {
    const sale = recentSalesPool[Math.floor(Math.random() * recentSalesPool.length)];
    res.write(`data: ${JSON.stringify(sale)}\n\n`);
  }, 14000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Fallback to SPA index.html (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`👓 FabOptic Store Server Running at: http://localhost:${PORT}`);
  console.log(`🚀 REST API & Real-time Sales Alerts active`);
  console.log(`===============================================`);
});
