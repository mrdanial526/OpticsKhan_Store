require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('<db_password>')) {
  console.error('\n❌ ERROR: MONGODB_URI is not configured with your real password yet!');
  console.error('Please open your .env file and replace <db_password> with your actual MongoDB user password.\n');
  process.exit(1);
}

// Define schemas for FabOptic
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: String,
  parentCategory: String,
  gender: String,
  shape: String,
  material: String,
  price: Number,
  originalPrice: Number,
  rating: Number,
  reviewsCount: Number,
  inStock: Boolean,
  badge: String,
  colors: [{ name: String, hex: String, bg: String }],
  description: String,
  features: [String],
  images: [String],
  popular: Boolean
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  role: { type: String, default: 'customer' },
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: Object,
  items: Array,
  subtotal: Number,
  deliveryFee: Number,
  discount: Number,
  totalAmount: Number,
  shippingAddress: Object,
  paymentMethod: String,
  paymentStatus: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const ConsultationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fullName: String,
  phone: String,
  preferredDate: String,
  preferredCity: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', ConsultationSchema);

async function runMigration() {
  console.log('===========================================================');
  console.log('🚀 MIGRATING FABOPTIC TO MONGODB ATLAS CLOUD...');
  console.log('===========================================================');
  console.log('Connecting to MongoDB Atlas...');

  await mongoose.connect(uri);
  console.log('✓ Successfully connected to MongoDB Atlas Cloud Cluster!\n');

  const dataFile = path.join(__dirname, '../db/data.json');
  const rawData = fs.readFileSync(dataFile, 'utf8');
  const data = JSON.parse(rawData);

  // 1. Migrate Products
  if (data.products && data.products.length > 0) {
    console.log(`[1] Migrating ${data.products.length} Products...`);
    for (const prod of data.products) {
      await Product.findOneAndUpdate({ id: prod.id }, prod, { upsert: true, new: true });
    }
    console.log(`✓ Products successfully migrated into 'products' collection!`);
  }

  // 2. Migrate Users (with Bcrypt Hashes)
  if (data.users && data.users.length > 0) {
    console.log(`\n[2] Migrating ${data.users.length} Users & Admin accounts...`);
    for (const user of data.users) {
      await User.findOneAndUpdate({ email: user.email.toLowerCase() }, user, { upsert: true, new: true });
    }
    console.log(`✓ Users successfully migrated into 'users' collection!`);
  }

  // 3. Migrate Orders
  if (data.orders && data.orders.length > 0) {
    console.log(`\n[3] Migrating ${data.orders.length} Orders...`);
    for (const order of data.orders) {
      await Order.findOneAndUpdate({ orderId: order.orderId }, order, { upsert: true, new: true });
    }
    console.log(`✓ Orders successfully migrated into 'orders' collection!`);
  }

  // 4. Migrate Consultations
  if (data.consultations && data.consultations.length > 0) {
    console.log(`\n[4] Migrating ${data.consultations.length} Consultations...`);
    for (const c of data.consultations) {
      await Consultation.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true });
    }
    console.log(`✓ Consultations successfully migrated into 'consultations' collection!`);
  }

  console.log('\n===========================================================');
  console.log('🎉 ALL DATA MIGRATED TO MONGODB ATLAS SUCCESSFULLY!');
  console.log('===========================================================');
  
  await mongoose.disconnect();
  console.log('Disconnected cleanly.');
}

runMigration().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
