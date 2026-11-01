const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// DB_FILE can be overridden (tests use a temporary file so real data is never touched)
const DB_FILE = process.env.DB_FILE || (process.env.VERCEL ? path.join('/tmp', 'data.json') : path.join(__dirname, 'data.json'));

// Mongoose Models for MongoDB Atlas Cloud
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
  address: String,
  city: String,
  role: { type: String, default: 'customer' },
  createdAt: { type: String }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: String,
  customer: Object,
  prescription: Object,
  items: Array,
  subtotal: Number,
  deliveryFee: Number,
  discount: Number,
  totalAmount: Number,
  paymentMethod: String,
  status: String,
  statusHistory: [{ status: String, timestamp: String, note: String }],
  courierName: String,
  courierTrackingNumber: String,
  createdAt: { type: String },
  estimatedDelivery: String
}, { timestamps: true });

const ConsultationSchema = new mongoose.Schema({
  appointmentId: { type: String },
  id: { type: String },
  fullName: String,
  phone: String,
  preferredDate: String,
  preferredCity: String,
  notes: String,
  createdAt: { type: String }
}, { timestamps: true });

const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const ConsultationModel = mongoose.models.Consultation || mongoose.model('Consultation', ConsultationSchema);

// Seed catalog organized by OptixOne category hierarchy:
// SUNGLASSES (Men, Women), EYE GLASSES (Men, Women, Clip On), LENS (Contact, Fashion, Prescription), ACCESSORIES
const initialSeed = {
  products: [
    {
      id: "opt-001",
      name: "Aviator Titanium Gold",
      category: "mens-sunglasses",
      parentCategory: "sunglasses",
      gender: "men",
      shape: "aviator",
      material: "Japanese Titanium",
      price: 4950,
      originalPrice: 6500,
      rating: 4.9,
      reviewsCount: 128,
      inStock: true,
      badge: "BESTSELLER",
      colors: [
        { name: "Gold / Amber Polarized", hex: "#D4AF37", bg: "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)" },
        { name: "Black Obsidian", hex: "#1a1a1a", bg: "#1a1a1a" },
        { name: "Gunmetal Silver", hex: "#708090", bg: "#708090" }
      ],
      description: "Ultra-lightweight aerospace-grade titanium frame with precision UV400 polarized lenses. Classic aviator silhouette with modern slim temple arms.",
      features: ["Aerospace Grade Titanium", "Polarized UV400 Protection", "Featherlight 14g Weight", "Anti-Scratch Coating"],
      images: [
        "/images/aviator-gold.svg",
        "/images/aviator-black.svg"
      ],
      popular: true
    },
    {
      id: "opt-002",
      name: "Wayfarer Havana Acetate",
      category: "mens-eyeglasses",
      parentCategory: "eyeglasses",
      gender: "men",
      shape: "wayfarer",
      material: "Handcrafted Italian Acetate",
      price: 3850,
      originalPrice: 4800,
      rating: 4.8,
      reviewsCount: 94,
      inStock: true,
      badge: "POPULAR",
      colors: [
        { name: "Havana Tortoiseshell", hex: "#8B4513", bg: "radial-gradient(circle, #8B4513 20%, #3d1b02 80%)" },
        { name: "Glossy Black", hex: "#000000", bg: "#000000" },
        { name: "Olive Crystal", hex: "#556B2F", bg: "#556B2F" }
      ],
      description: "Iconic square silhouette sculpted from hand-polished Mazzucchelli acetate with reinforced German five-barrel hinges for everyday all-day wear.",
      features: ["Handcrafted Acetate", "German 5-Barrel Hinges", "Prescription Ready", "Ergonomic Nose Bridge"],
      images: [
        "/images/wayfarer-havana.svg",
        "/images/wayfarer-black.svg"
      ],
      popular: true
    },
    {
      id: "opt-003",
      name: "BlueShield Pro Screen Protector",
      category: "prescription-lens",
      parentCategory: "lens",
      gender: "unisex",
      shape: "square",
      material: "TR-90 Memory Polymer",
      price: 2950,
      originalPrice: 3950,
      rating: 5.0,
      reviewsCount: 215,
      inStock: true,
      badge: "TOP RATED",
      colors: [
        { name: "Matte Midnight", hex: "#191970", bg: "#191970" },
        { name: "Stealth Black", hex: "#111111", bg: "#111111" },
        { name: "Frost Clear", hex: "#E0EEEE", bg: "linear-gradient(135deg, #e0eeee, #c1cdcd)" }
      ],
      description: "Engineered specifically for heavy screen users. Filters 98% of harmful 410-455nm blue light with zero color distortion, ending digital eye strain.",
      features: ["98% Blue Light Filter", "Zero-Glare Anti-Reflective", "Flexible TR-90 Frame", "Ultra-light 12g"],
      images: [
        "/images/blueshield-pro.svg"
      ],
      popular: true
    },
    {
      id: "opt-004",
      name: "Vogue Cat-Eye Rose Noir",
      category: "womens-eyeglasses",
      parentCategory: "eyeglasses",
      gender: "women",
      shape: "cateye",
      material: "Premium Bio-Acetate & Rose Gold",
      price: 4450,
      originalPrice: 5600,
      rating: 4.9,
      reviewsCount: 88,
      inStock: true,
      badge: "NEW ARRIVAL",
      colors: [
        { name: "Rose Gold Noir", hex: "#B76E79", bg: "linear-gradient(135deg, #111 40%, #B76E79 100%)" },
        { name: "Pearl White", hex: "#FDF5E6", bg: "#FDF5E6" },
        { name: "Burgundy Wine", hex: "#800020", bg: "#800020" }
      ],
      description: "Dramatic feminine flair with upward sweeping temples, accented with brushed rose gold hardware. Elegantly elevates both formal and everyday attire.",
      features: ["Chic Upturned Silhouette", "18k Rose Gold Accents", "Adjustable Silicone Pads", "Prescription Compatible"],
      images: [
        "/images/cateye-rose.svg"
      ],
      popular: true
    },
    {
      id: "opt-005",
      name: "Vintage Round Titan Flex",
      category: "womens-eyeglasses",
      parentCategory: "eyeglasses",
      gender: "women",
      shape: "round",
      material: "Beta-Titanium Alloy",
      price: 4200,
      originalPrice: 5200,
      rating: 4.8,
      reviewsCount: 76,
      inStock: true,
      badge: "TRENDING",
      colors: [
        { name: "Antique Bronze", hex: "#CD7F32", bg: "#CD7F32" },
        { name: "Matte Black", hex: "#1f1f1f", bg: "#1f1f1f" },
        { name: "Champagne Silver", hex: "#E6E8FA", bg: "#E6E8FA" }
      ],
      description: "Philosopher style circular frames with flexible temple arms that never lose their shape. Perfectly balances square and angular face silhouettes.",
      features: ["Beta-Titanium Flexibility", "Micro-groove Detailing", "Hypoallergenic", "Featherweight Balance"],
      images: [
        "/images/round-vintage.svg"
      ],
      popular: false
    },
    {
      id: "opt-006",
      name: "Executive Rimless Silhouette",
      category: "mens-eyeglasses",
      parentCategory: "eyeglasses",
      gender: "men",
      shape: "rectangular",
      material: "High-Tensile Titanium Wire",
      price: 5400,
      originalPrice: 6900,
      rating: 4.9,
      reviewsCount: 62,
      inStock: true,
      badge: "LUXURY",
      colors: [
        { name: "Polished Platinum", hex: "#E5E4E2", bg: "linear-gradient(135deg, #E5E4E2, #b0b0b0)" },
        { name: "Imperial Gold", hex: "#DAA520", bg: "#DAA520" },
        { name: "Graphite", hex: "#383838", bg: "#383838" }
      ],
      description: "Minimalist rimless luxury engineered for discerning professionals. Invisible presence on the face with indestructible compression mount hinges.",
      features: ["Pure Rimless Structure", "Invisible Face Profile", "Laser Cut High-Index Lenses", "Precision Compression Mount"],
      images: [
        "/images/rimless-executive.svg"
      ],
      popular: true
    },
    {
      id: "opt-007",
      name: "Clubmaster Retro Browline",
      category: "mens-eyeglasses",
      parentCategory: "eyeglasses",
      gender: "men",
      shape: "browline",
      material: "Acetate Upper & Metal Chasis",
      price: 3600,
      originalPrice: 4500,
      rating: 4.7,
      reviewsCount: 110,
      inStock: true,
      badge: "20% OFF",
      colors: [
        { name: "Ebony & Gold", hex: "#222222", bg: "linear-gradient(to bottom, #111 60%, #D4AF37 60%)" },
        { name: "Tortoise & Silver", hex: "#5c3317", bg: "#5c3317" }
      ],
      description: "Mid-century intellectual classic featuring prominent browlines and delicate lower rims. The timeless intellectual aesthetic for modern thinkers.",
      features: ["Dual-Material Architecture", "Reinforced Nose Pads", "Optical Grade Polycarbonate", "Classique Rivets"],
      images: [
        "/images/clubmaster-retro.svg"
      ],
      popular: false
    },
    {
      id: "opt-008",
      name: "Geometric Hexagon Polygon",
      category: "womens-sunglasses",
      parentCategory: "sunglasses",
      gender: "women",
      shape: "geometric",
      material: "Surgical Stainless Steel",
      price: 4100,
      originalPrice: 5100,
      rating: 4.8,
      reviewsCount: 53,
      inStock: true,
      badge: "NEW",
      colors: [
        { name: "Emerald Mirror / Gold", hex: "#006400", bg: "linear-gradient(135deg, #00A86B, #D4AF37)" },
        { name: "Black / Smoke Polarized", hex: "#262626", bg: "#262626" },
        { name: "Rose Gradient", hex: "#DB7093", bg: "#DB7093" }
      ],
      description: "Sharp architectural angles meet runway-inspired geometry. Premium flat polarized lenses crafted for statement makers.",
      features: ["6-Sided Geometric Silhouette", "Flat Zero-Base Lenses", "Comfort Flex Temples", "UV400 Total Sun Shield"],
      images: [
        "/images/geometric-hexagon.svg"
      ],
      popular: false
    },
    {
      id: "opt-009",
      name: "Urban Matte Minimalist Square",
      category: "prescription-lens",
      parentCategory: "lens",
      gender: "unisex",
      shape: "square",
      material: "Matte TR-90 Polymer",
      price: 2650,
      originalPrice: 3400,
      rating: 4.7,
      reviewsCount: 89,
      inStock: true,
      badge: "VALUE PACK",
      colors: [
        { name: "Matte Charcoal", hex: "#36454F", bg: "#36454F" },
        { name: "Smoky Translucent", hex: "#708090", bg: "#708090" },
        { name: "Navy Marine", hex: "#000080", bg: "#000080" }
      ],
      description: "Understated square frame with soft-touch matte finish. Zero-pressure nose design allows 10+ hours continuous screen work.",
      features: ["Soft Touch Matte Feel", "Anti-Fatigue Filter", "Zero-Pressure Bridge", "Shatterproof"],
      images: [
        "/images/urban-square.svg"
      ],
      popular: false
    },
    {
      id: "opt-010",
      name: "Aviation Polarized Driver Max",
      category: "mens-sunglasses",
      parentCategory: "sunglasses",
      gender: "men",
      shape: "aviator",
      material: "High-Grade Monel Metal",
      price: 4750,
      originalPrice: 5900,
      rating: 4.9,
      reviewsCount: 142,
      inStock: true,
      badge: "BESTSELLER",
      colors: [
        { name: "Gunmetal / Driving Amber", hex: "#595959", bg: "linear-gradient(135deg, #4A4A4A, #C68642)" },
        { name: "Stealth Chrome / Dark Grey", hex: "#A9A9A9", bg: "#333333" }
      ],
      description: "High-definition contrast enhancement for highway driving, glare elimination over water and asphalt, tested in harsh daylight.",
      features: ["Contrast HD Amber Polarized", "Sweat-Resistant Finish", "Spring Loaded Temples", "Driving Certified"],
      images: [
        "/images/aviation-driver.svg"
      ],
      popular: true
    },
    {
      id: "opt-011",
      name: "Crystal Clear Luxe Round",
      category: "womens-eyeglasses",
      parentCategory: "eyeglasses",
      gender: "women",
      shape: "round",
      material: "Optical Grade Transparent Acetate",
      price: 3900,
      originalPrice: 4900,
      rating: 4.9,
      reviewsCount: 67,
      inStock: true,
      badge: "INSTAGRAM HIT",
      colors: [
        { name: "Champagne Crystal", hex: "#F7E7CE", bg: "rgba(247, 231, 206, 0.85)" },
        { name: "Ice Pure Clear", hex: "#F0F8FF", bg: "rgba(240, 248, 255, 0.85)" },
        { name: "Blush Pink Tint", hex: "#FFD1DC", bg: "rgba(255, 209, 220, 0.85)" }
      ],
      description: "Luminous translucent frames that let your facial features shine through while providing sharp optical correction.",
      features: ["Pure Optical Transparency", "Internal Gold Wire Core", "Prescription Ready", "Featherweight"],
      images: [
        "/images/crystal-round.svg"
      ],
      popular: false
    },
    {
      id: "opt-012",
      name: "Sport Grip Wrap Polarized",
      category: "mens-sunglasses",
      parentCategory: "sunglasses",
      gender: "men",
      shape: "wrap",
      material: "Impact Resistant Polycarbonate",
      price: 3350,
      originalPrice: 4200,
      rating: 4.8,
      reviewsCount: 91,
      inStock: true,
      badge: "OUTDOOR PRO",
      colors: [
        { name: "Matte Black / Red Mirror", hex: "#111111", bg: "linear-gradient(135deg, #111, #FF4500)" },
        { name: "Navy / Ice Blue Mirror", hex: "#000080", bg: "linear-gradient(135deg, #001F3F, #00BFFF)" }
      ],
      description: "Curved aerodynamic wrap fit with rubberized hydro-grip nose pads and temples that lock in place during cricket, running, or cycling.",
      features: ["Hydro-Grip Rubber Pads", "Anti-Fog Aeration Vents", "Shatterproof Polycarbonate", "Full Lateral Sun Blocking"],
      images: [
        "/images/sport-wrap.svg"
      ],
      popular: false
    },
    {
      id: "opt-013",
      name: "Magnetic Clip-On 2-in-1 Wayfarer & Sun",
      category: "clip-on",
      parentCategory: "eyeglasses",
      gender: "unisex",
      shape: "wayfarer",
      material: "TR-90 Polymer + Neodymium Magnets",
      price: 4200,
      originalPrice: 5500,
      rating: 4.9,
      reviewsCount: 118,
      inStock: true,
      badge: "2-IN-1 SNAP",
      colors: [
        { name: "Matte Black + Dark Polarized Clip", hex: "#111111", bg: "#111111" },
        { name: "Tortoise + Amber Polarized Clip", hex: "#8B4513", bg: "#8B4513" }
      ],
      description: "Our signature 2-in-1 frame. Features high-grade prescription optical eyeglasses that instantly transform into polarized UV400 sunglasses with a magnetic snap.",
      features: ["Neodymium Magnetic Lock", "Polarized UV400 Snap-on Shade", "Lightweight TR-90 Chasis", "Seamless Indoor/Outdoor Transition"],
      images: [
        "/images/clipon-magnetic.svg"
      ],
      popular: true
    },
    {
      id: "opt-014",
      name: "AquaLens Hydra-Moist 58% Contact Lenses",
      category: "contact-lens",
      parentCategory: "lens",
      gender: "unisex",
      shape: "round",
      material: "Filcon II Silicone Hydrogel",
      price: 2900,
      originalPrice: 3800,
      rating: 5.0,
      reviewsCount: 84,
      inStock: true,
      badge: "EYE CARE",
      colors: [
        { name: "Clear Optical Power", hex: "#0284c7", bg: "linear-gradient(135deg, #0284c7, #38bdf8)" }
      ],
      description: "Daily disposable 30-pack contact lenses engineered for high oxygen transmissibility and all-day corneal moisture. Class 1 UV blocking.",
      features: ["58% Water Content", "High Oxygen Flow Dk/t 138", "SmartTouch Blister Pack", "UV-A / UV-B Shield"],
      images: [
        "/images/contact-lens-box.svg"
      ],
      popular: true
    },
    {
      id: "opt-015",
      name: "Vogue Cosmetic Colored Eye Lenses",
      category: "fashion-lens",
      parentCategory: "lens",
      gender: "women",
      shape: "round",
      material: "Hydrophilic Soft Polymer",
      price: 1850,
      originalPrice: 2400,
      rating: 4.8,
      reviewsCount: 72,
      inStock: true,
      badge: "COLOR GLAM",
      colors: [
        { name: "Pure Hazel", hex: "#b45309", bg: "#b45309" },
        { name: "Sapphire Blue", hex: "#0284c7", bg: "#0284c7" },
        { name: "Emerald Jade", hex: "#059669", bg: "#059669" }
      ],
      description: "Naturally mesmerizing cosmetic colored lenses with 3-in-1 color blend technology. Enhances eye depth with zero prescription needed.",
      features: ["3-in-1 Color Blending", "30-Day Monthly Disposable", "Includes Lens Solution & Case", "Ultra-Thin Edges"],
      images: [
        "/images/contact-lens-box.svg"
      ],
      popular: false
    },
    {
      id: "opt-016",
      name: "Ultra-Clean Anti-Fog Optical Care Kit",
      category: "accessories",
      parentCategory: "accessories",
      gender: "unisex",
      shape: "rectangular",
      material: "Nano Anti-Fog Formula & Leather",
      price: 1250,
      originalPrice: 1600,
      rating: 4.9,
      reviewsCount: 96,
      inStock: true,
      badge: "ESSENTIAL",
      colors: [
        { name: "Midnight Leather Kit", hex: "#18181b", bg: "#18181b" }
      ],
      description: "Complete optical maintenance suite: long-lasting 48-hour anti-fog spray, lint-free microfiber ultrasonic cloth, micro screwdriver, and magnetic hard case.",
      features: ["48-Hour Anti-Fog Shield", "Streak-Free Lens Spray", "Magnetic Hard Travel Shell", "Precision Keychain Tool"],
      images: [
        "/images/lens-care-kit.svg"
      ],
      popular: false
    }
  ],
  // EXACT Categories matching optixone.com.co navigation:
  // SUNGLASSES (Men, Women) | EYE GLASSES (Men, Women, Clip On) | LENS (Contact, Fashion, Prescription) | ACCESSORIES
  categories: [
    { id: "all", name: "All Products", count: 16 },
    { id: "mens-sunglasses", name: "Men's Sunglasses", parent: "sunglasses", count: 3 },
    { id: "womens-sunglasses", name: "Women's Sunglasses", parent: "sunglasses", count: 1 },
    { id: "mens-eyeglasses", name: "Men's Eye Glasses", parent: "eyeglasses", count: 3 },
    { id: "womens-eyeglasses", name: "Women's Eye Glasses", parent: "eyeglasses", count: 3 },
    { id: "clip-on", name: "Clip On Glasses", parent: "eyeglasses", count: 1 },
    { id: "contact-lens", name: "Contact Lens", parent: "lens", count: 1 },
    { id: "fashion-lens", name: "Fashion Lens", parent: "lens", count: 1 },
    { id: "prescription-lens", name: "Prescription Lens", parent: "lens", count: 2 },
    { id: "accessories", name: "Accessories", parent: "accessories", count: 1 }
  ],
  lensCustomizationOptions: [
    { id: "frame-only", name: "Frame Only (Demo Lenses)", price: 0, description: "Includes clear demo lenses. Take to your local optician or use as fashion frame." },
    { id: "blue-light", name: "Blue Light Screen Shield (0.00)", price: 990, description: "Block 98% harmful rays from laptop & phone screens without prescription." },
    { id: "single-vision", name: "Single Vision (Distance or Reading)", price: 1450, description: "Custom power lenses crafted to your exact cylindrical and spherical numbers." },
    { id: "anti-glare-pro", name: "Single Vision + Anti-Glare + Blue Shield", price: 2190, description: "Our #1 seller: HD optical clarity with 16-layer hydrophobic anti-reflective coating." },
    { id: "photochromic", name: "Photochromic Transition (Darkens in Sun)", price: 2850, description: "Clear indoors, transforms into dark sunglasses automatically outdoors." }
  ],
  reviews: [
    {
      id: "rev-01",
      author: "Dr. Farhan Tariq",
      city: "Lahore",
      rating: 5,
      date: "2 days ago",
      comment: "Mashallah, the build quality of the Aviator Titanium is identical to frames I saw at international boutiques for 5x the price. Anti-glare prescription lenses are crystal clear. Delivery in Lahore took only 24 hours!",
      productName: "Aviator Titanium Gold",
      verifiedBuyer: true
    },
    {
      id: "rev-02",
      author: "Zainab Raza",
      city: "Karachi (DHA)",
      rating: 5,
      date: "3 days ago",
      comment: "I was hesitant ordering prescription glasses online in Pakistan, but customer support guided me on WhatsApp through my doctor slip. The Havana Acetate frame fits like a glove. Super chic!",
      productName: "Wayfarer Havana Acetate",
      verifiedBuyer: true
    },
    {
      id: "rev-03",
      author: "Hamza Shafique",
      city: "Islamabad",
      rating: 5,
      date: "1 week ago",
      comment: "As a software engineer spending 12 hours a day coding, the BlueShield Pro has completely cured my end-of-day migraines. Unbelievably lightweight and comfortable under headphones.",
      productName: "BlueShield Pro Screen Protector",
      verifiedBuyer: true
    },
    {
      id: "rev-04",
      author: "Mahnoor Bilal",
      city: "Faisalabad",
      rating: 5,
      date: "1 week ago",
      comment: "The Vogue Cat-Eye frame is stunning! Free delivery arrived securely packaged in a premium magnetic leather case with a microfiber cloth and screwdriver kit. 10/10 service.",
      productName: "Vogue Cat-Eye Rose Noir",
      verifiedBuyer: true
    },
    {
      id: "rev-05",
      author: "Adeel Munir",
      city: "Rawalpindi",
      rating: 5,
      date: "2 weeks ago",
      comment: "The Executive Rimless Silhouette looks so sharp for meetings and court appearances. Very light, you almost forget you are wearing glasses. Cash on delivery was seamless.",
      productName: "Executive Rimless Silhouette",
      verifiedBuyer: true
    }
  ],
  coupons: [
    { code: "FABOPTIC10", discountPercent: 10, minSpend: 2500, description: "10% off on your entire optical order" },
    { code: "FIRSTLOOK", discountPercent: 15, minSpend: 3500, description: "15% off for first-time customers" },
    { code: "FREESHIP", discountPercent: 0, freeShipping: true, description: "Free express delivery across Pakistan" }
  ],
  orders: [],
  subscribers: [],
  consultations: [],
  users: [
    {
      id: "usr-admin",
      fullName: "Atelier Owner",
      email: "owner@faboptic.pk",
      password: "admin",
      phone: "03241383370",
      role: "admin",
      createdAt: new Date().toISOString()
    }
  ]
};

class Database {
  constructor() {
    this.data = this.load();
    this.mongoConnected = false;
    this.initMongo();
  }

  async initMongo() {
    const uri = process.env.MONGODB_URI;
    if (process.env.NODE_ENV === 'test') return; // never touch the live database from tests
    if (!uri || uri.includes('<db_password>')) return;
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
      }
      this.mongoConnected = true;
      console.log('✓ FabOptic Database connected live to MongoDB Atlas Cloud Cluster!');
      await this.syncFromMongo();
    } catch (err) {
      console.warn('⚠️ MongoDB Atlas warning (using local fallback):', err.message);
    }
  }

  async syncFromMongo() {
    try {
      const [products, users, orders, consultations] = await Promise.all([
        ProductModel.find({}).lean(),
        UserModel.find({}).lean(),
        OrderModel.find({}).lean(),
        ConsultationModel.find({}).lean()
      ]);

      if (products && products.length) this.data.products = products;
      if (users && users.length) this.data.users = users;
      if (orders && orders.length) this.data.orders = orders;
      if (consultations && consultations.length) this.data.consultations = consultations;
      this.save(this.data);
    } catch (err) {
      console.warn('Could not sync from MongoDB Atlas:', err.message);
    }
  }

  async syncToMongo(collectionName, query, doc) {
    if (!this.mongoConnected) return;
    try {
      if (collectionName === 'product') {
        await ProductModel.findOneAndUpdate(query, doc, { upsert: true, returnDocument: 'after' });
      } else if (collectionName === 'user') {
        await UserModel.findOneAndUpdate(query, doc, { upsert: true, returnDocument: 'after' });
      } else if (collectionName === 'order') {
        await OrderModel.findOneAndUpdate(query, doc, { upsert: true, returnDocument: 'after' });
      } else if (collectionName === 'consultation') {
        await ConsultationModel.findOneAndUpdate(query, doc, { upsert: true, returnDocument: 'after' });
      }
    } catch (err) {
      console.error(`MongoDB sync error for ${collectionName}:`, err.message);
    }
  }

  async deleteFromMongo(collectionName, query) {
    if (!this.mongoConnected) return;
    try {
      if (collectionName === 'product') {
        await ProductModel.deleteOne(query);
      }
    } catch (err) {
      console.error(`MongoDB delete error for ${collectionName}:`, err.message);
    }
  }

  load() {
    let data;
    try {
      const sourceFile = fs.existsSync(DB_FILE)
        ? DB_FILE
        : path.join(__dirname, 'data.json');
      if (fs.existsSync(sourceFile)) {
        const raw = fs.readFileSync(sourceFile, 'utf-8');
        const parsed = JSON.parse(raw);
        data = { ...initialSeed, ...parsed };
      }
    } catch (err) {
      console.warn("Could not load existing data, fallback to seed:", err.message);
    }
    if (!data) {
      data = JSON.parse(JSON.stringify(initialSeed));
    }
    if (!data.users || !data.users.length) {
      data.users = [
        {
          id: "usr-admin",
          fullName: "Atelier Owner",
          email: "owner@faboptic.pk",
          password: "admin",
          phone: "03241383370",
          role: "admin",
          createdAt: new Date().toISOString()
        }
      ];
      this.save(data);
    }
    return data;
  }

  save(dataToSave = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to persist database file:", err.message);
    }
  }

  getProducts(filters = {}) {
    let result = [...this.data.products];
    if (filters.category && filters.category !== 'all') {
      result = result.filter(p => 
        p.category === filters.category || 
        p.parentCategory === filters.category
      );
    }
    if (filters.gender && filters.gender !== 'all') {
      result = result.filter(p => p.gender === filters.gender || p.gender === 'unisex');
    }
    if (filters.shape && filters.shape !== 'all') {
      result = result.filter(p => p.shape === filters.shape);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (filters.sort) {
      if (filters.sort === 'price-low') {
        result.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price-high') {
        result.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (filters.sort === 'popular') {
        result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      }
    }
    return result;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  getCategories() {
    return this.data.categories;
  }

  getLensOptions() {
    return this.data.lensCustomizationOptions;
  }

  getReviews() {
    return this.data.reviews;
  }

  addReview(newReview) {
    const review = {
      id: `rev-${Date.now().toString().slice(-4)}`,
      author: newReview.author || "Anonymous Customer",
      city: newReview.city || "Pakistan",
      rating: Number(newReview.rating) || 5,
      date: "Just now",
      comment: newReview.comment || "",
      productName: newReview.productName || "Verified Purchase",
      verifiedBuyer: true
    };
    this.data.reviews.unshift(review);
    this.save();
    return review;
  }

  applyCoupon(code, subtotal) {
    if (!code) return { valid: false, message: "No coupon provided" };
    const coupon = this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase().trim());
    if (!coupon) return { valid: false, message: "Invalid promo code" };
    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return { valid: false, message: `Minimum spend of Rs. ${coupon.minSpend} required for this coupon.` };
    }
    const discountAmount = coupon.flatDiscount || Math.round((subtotal * (coupon.discountPercent || 0)) / 100);
    const msg = coupon.flatDiscount 
      ? `Coupon ${coupon.code} applied! (Flat Rs. ${coupon.flatDiscount} off)`
      : `Coupon ${coupon.code} applied! (${coupon.discountPercent}% off)`;
    return {
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent || 0,
      discountAmount,
      message: msg
    };
  }

  getAllCoupons() {
    return this.data.coupons || [];
  }

  addCoupon(payload) {
    if (!payload.code) return { success: false, message: "Coupon code is required" };
    const code = payload.code.toUpperCase().trim();
    if (!this.data.coupons) this.data.coupons = [];
    const idx = this.data.coupons.findIndex(c => c.code === code);
    const newCoupon = {
      code,
      discountPercent: Number(payload.discountPercent) || 0,
      flatDiscount: Number(payload.flatDiscount) || 0,
      minSpend: Number(payload.minSpend) || 0,
      description: payload.description || `${payload.discountPercent || 10}% off optical discount`
    };
    if (idx !== -1) {
      this.data.coupons[idx] = newCoupon;
    } else {
      this.data.coupons.push(newCoupon);
    }
    this.save();
    return { success: true, coupon: newCoupon };
  }

  deleteCoupon(code) {
    if (!this.data.coupons) return false;
    const clean = code.toUpperCase().trim();
    const idx = this.data.coupons.findIndex(c => c.code === clean);
    if (idx === -1) return false;
    this.data.coupons.splice(idx, 1);
    this.save();
    return true;
  }

  addProductReview(productId, reviewData) {
    const prod = this.data.products.find(p => p.id === productId);
    const review = {
      id: `rev-${Date.now().toString().slice(-4)}`,
      productId,
      author: reviewData.author || "Verified Customer",
      city: reviewData.city || "Pakistan",
      rating: Math.min(5, Math.max(1, Number(reviewData.rating) || 5)),
      date: "Just now",
      comment: reviewData.comment || "",
      productName: prod ? prod.name : "FabOptic Frame",
      verifiedBuyer: true
    };
    if (!this.data.reviews) this.data.reviews = [];
    this.data.reviews.unshift(review);

    if (prod) {
      prod.reviewsCount = (prod.reviewsCount || 0) + 1;
      const allProductReviews = this.data.reviews.filter(r => r.productId === productId);
      const totalScore = allProductReviews.reduce((sum, r) => sum + r.rating, 0);
      prod.rating = Number((totalScore / allProductReviews.length).toFixed(1));
      this.syncToMongo('product', { id: prod.id }, prod);
    }
    this.save();
    return review;
  }

  createOrder(orderPayload) {
    const orderId = `FO-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    // Link user and auto-save delivery address to their profile
    let linkedUserId = orderPayload.userId || null;
    let updatedUserSafe = null;

    if (this.data.users && (orderPayload.userId || orderPayload.email)) {
      const user = this.data.users.find(u => 
        (orderPayload.userId && u.id === orderPayload.userId) || 
        (orderPayload.email && u.email && u.email.toLowerCase() === orderPayload.email.toLowerCase())
      );
      if (user) {
        linkedUserId = user.id;
        user.address = orderPayload.address;
        user.city = orderPayload.city;
        if (orderPayload.phone) user.phone = orderPayload.phone;
        this.save();
        this.syncToMongo('user', { email: user.email }, user);
        const { password: _, ...uSafe } = user;
        updatedUserSafe = uSafe;
      }
    }

    const newOrder = {
      orderId,
      userId: linkedUserId,
      customer: {
        fullName: orderPayload.fullName,
        phone: orderPayload.phone,
        email: orderPayload.email,
        address: orderPayload.address,
        city: orderPayload.city,
        notes: orderPayload.notes || ""
      },
      prescription: orderPayload.prescription || null,
      items: orderPayload.items || [],
      subtotal: orderPayload.subtotal || 0,
      discount: orderPayload.discount || 0,
      deliveryFee: orderPayload.deliveryFee || 0,
      totalAmount: orderPayload.totalAmount || 0,
      paymentMethod: orderPayload.paymentMethod || "Cash on Delivery (COD)",
      status: "Confirmed & Packing",
      statusHistory: [
        {
          status: "Confirmed & Packing",
          timestamp: nowIso,
          note: "Order verified and queued for optical preparation"
        }
      ],
      courierName: orderPayload.courierName || "TCS Express",
      courierTrackingNumber: orderPayload.courierTrackingNumber || "",
      createdAt: nowIso,
      estimatedDelivery: "2 to 3 Business Days via TCS"
    };

    this.data.orders.unshift(newOrder);
    this.save();
    this.syncToMongo('order', { orderId: newOrder.orderId }, newOrder);
    return { order: newOrder, updatedUser: updatedUserSafe };
  }

  getOrder(orderId) {
    return this.data.orders.find(o => o.orderId === orderId);
  }

  addSubscriber(email, phone) {
    const exists = this.data.subscribers.find(s => s.email === email);
    if (!exists) {
      this.data.subscribers.push({ email, phone, date: new Date().toISOString() });
      this.save();
    }
    return { success: true, message: "Welcome to FabOptic VIP Club! Enjoy 10% off code FABOPTIC10." };
  }

  bookConsultation(payload) {
    const appointmentId = `EYE-${Math.floor(1000 + Math.random() * 9000)}`;
    const appointment = {
      appointmentId,
      id: appointmentId,
      fullName: payload.fullName,
      phone: payload.phone,
      preferredDate: payload.preferredDate || "Earliest Available",
      preferredCity: payload.preferredCity || "Lahore / Online WhatsApp",
      notes: payload.notes || "Comprehensive Vision & Prescription Check",
      createdAt: new Date().toISOString()
    };
    if (!this.data.consultations) this.data.consultations = [];
    this.data.consultations.unshift(appointment);
    this.save();
    this.syncToMongo('consultation', { appointmentId: appointment.appointmentId }, appointment);
    return appointment;
  }

  // --- USER AUTHENTICATION & PROFILES ---
  registerUser({ fullName, email, password, phone, role = "customer" }) {
    if (!email || !password || !fullName) {
      return { success: false, message: "Name, email, and password are required." };
    }
    const normalized = email.toLowerCase().trim();
    if (!this.data.users) this.data.users = [];
    if (this.data.users.some(u => u.email.toLowerCase().trim() === normalized)) {
      return { success: false, message: "An account with this email already exists." };
    }

    // Secure bcrypt salt & hashing
    const hashedPassword = bcrypt.hashSync(password.trim(), 10);

    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      fullName: fullName.trim(),
      email: normalized,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      role: role === "admin" ? "admin" : "customer",
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    this.syncToMongo('user', { email: newUser.email }, newUser);
    const { password: _, ...userSafe } = newUser;
    return { success: true, user: userSafe };
  }

  authenticateUser({ email, password }) {
    if (!email || !password) {
      return { success: false, message: "Email and password are required." };
    }
    const normalized = email.toLowerCase().trim();
    if (!this.data.users) this.data.users = [];
    const user = this.data.users.find(u => u.email.toLowerCase().trim() === normalized);
    if (!user) {
      return { success: false, message: "Incorrect email or password. Please verify your credentials and try again." };
    }

    let isMatch = false;
    // Check if user has an encrypted bcrypt hash
    if (typeof user.password === 'string' && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = bcrypt.compareSync(password.trim(), user.password);
    } else {
      // Legacy plain-text check for pre-seeded users
      isMatch = (user.password === password.trim());
      if (isMatch) {
        // Automatically upgrade plain-text password to secure bcrypt hash
        user.password = bcrypt.hashSync(password.trim(), 10);
        this.save();
        this.syncToMongo('user', { email: user.email }, user);
      }
    }

    if (!isMatch) {
      return { success: false, message: "Incorrect email or password. Please verify your credentials and try again." };
    }

    const { password: _, ...userSafe } = user;
    return { success: true, user: userSafe };
  }

  /**
   * Sets the owner (admin) password from ADMIN_PASSWORD so the public demo
   * password "admin" stops working. No-op if the password is already current.
   */
  applyOwnerPassword(newPassword) {
    const admins = (this.data.users || []).filter(u => u.role === 'admin');
    if (!newPassword) {
      const usesDefault = admins.some(u =>
        u.password === 'admin' ||
        (typeof u.password === 'string' && u.password.startsWith('$2') && bcrypt.compareSync('admin', u.password))
      );
      if (usesDefault && process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  SECURITY: Owner account still uses the default password "admin". Set ADMIN_PASSWORD in .env.');
      }
      return false;
    }
    let changed = false;
    for (const admin of admins) {
      const isHash = typeof admin.password === 'string' && admin.password.startsWith('$2');
      const alreadySet = isHash ? bcrypt.compareSync(newPassword, admin.password) : admin.password === newPassword;
      if (alreadySet && isHash) continue;
      admin.password = bcrypt.hashSync(newPassword, 10);
      this.syncToMongo('user', { email: admin.email }, admin);
      changed = true;
    }
    if (changed) this.save();
    return changed;
  }

  getUserById(id) {
    if (!this.data.users) return null;
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password: _, ...userSafe } = user;
    return userSafe;
  }

  getUserOrders(email) {
    if (!email || !this.data.orders) return [];
    const normalized = email.toLowerCase().trim();
    return this.data.orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase().trim() === normalized);
  }

  // --- OWNER / ADMIN PRODUCT MANAGEMENT (CRUD) ---
  addProduct(payload) {
    const id = `opt-${Date.now().toString().slice(-4)}`;
    const product = {
      id,
      name: payload.name.trim(),
      category: payload.category || "mens-sunglasses",
      parentCategory: payload.parentCategory || (payload.category && payload.category.includes('sunglass') ? 'sunglasses' : 'eyeglasses'),
      gender: payload.gender || "unisex",
      shape: payload.shape || "aviator",
      material: payload.material || "Japanese Titanium",
      price: Number(payload.price) || 3950,
      originalPrice: payload.originalPrice ? Number(payload.originalPrice) : Math.round((Number(payload.price) || 3950) * 1.25),
      rating: 5.0,
      reviewsCount: 1,
      inStock: payload.inStock !== false && payload.inStock !== 'false',
      badge: payload.badge || "NEW ARRIVAL",
      colors: payload.colors && payload.colors.length ? payload.colors : [
        { name: "Obsidian Black", hex: "#111111", bg: "#111111" }
      ],
      description: payload.description || "Signature handcrafted luxury eyewear crafted with haute precision.",
      features: payload.features && payload.features.length ? payload.features : ["UV400 Protection", "Featherlight Frame", "Prescription Ready"],
      images: payload.images && payload.images.length ? payload.images : ["/images/aviator-gold.svg"],
      popular: Boolean(payload.popular)
    };
    this.data.products.unshift(product);
    this.save();
    this.syncToMongo('product', { id: product.id }, product);
    return product;
  }

  updateProduct(id, updateData) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const current = this.data.products[idx];
    
    this.data.products[idx] = {
      ...current,
      ...updateData,
      price: updateData.price !== undefined ? Number(updateData.price) : current.price,
      originalPrice: updateData.originalPrice !== undefined ? Number(updateData.originalPrice) : current.originalPrice,
      inStock: updateData.inStock !== undefined ? (updateData.inStock === true || updateData.inStock === 'true') : current.inStock
    };
    this.save();
    this.syncToMongo('product', { id }, this.data.products[idx]);
    return this.data.products[idx];
  }

  deleteProduct(id) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    this.deleteFromMongo('product', { id });
    return true;
  }

  toggleProductStock(id) {
    const prod = this.data.products.find(p => p.id === id);
    if (!prod) return null;
    prod.inStock = !prod.inStock;
    this.save();
    this.syncToMongo('product', { id }, prod);
    return prod;
  }

  getAdminStats() {
    const totalProducts = this.data.products.length;
    const inStockCount = this.data.products.filter(p => p.inStock).length;
    const outOfStockCount = totalProducts - inStockCount;
    const totalOrders = (this.data.orders || []).length;
    const totalRevenue = (this.data.orders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalConsultations = (this.data.consultations || []).length;
    const totalUsers = (this.data.users || []).length;
    return {
      totalProducts,
      inStockCount,
      outOfStockCount,
      totalOrders,
      totalRevenue,
      totalConsultations,
      totalUsers
    };
  }

  getAllOrders() {
    return this.data.orders || [];
  }

  updateOrderStatus(orderId, status, courierData = {}) {
    const order = (this.data.orders || []).find(o => o.orderId === orderId);
    if (!order) return null;
    order.status = status;
    if (courierData.courierName) order.courierName = courierData.courierName;
    if (courierData.courierTrackingNumber !== undefined) order.courierTrackingNumber = courierData.courierTrackingNumber;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: courierData.note || `Status updated to ${status}`
    });
    this.save();
    this.syncToMongo('order', { orderId }, order);
    return order;
  }
}

module.exports = new Database();
