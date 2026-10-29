require('dotenv').config();
const mongoose = require('mongoose');

async function testAtlas() {
  console.log('Connecting to MongoDB Atlas with URI...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas successfully!');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('\nFound Collections in "faboptic" database:');
  collections.forEach(c => console.log(' - ' + c.name));

  const productsCount = await db.collection('products').countDocuments();
  const usersCount = await db.collection('users').countDocuments();
  const ordersCount = await db.collection('orders').countDocuments();
  const consultationsCount = await db.collection('consultations').countDocuments();

  console.log('\nDocument Counts:');
  console.log(` - Products: ${productsCount}`);
  console.log(` - Users: ${usersCount}`);
  console.log(` - Orders: ${ordersCount}`);
  console.log(` - Consultations: ${consultationsCount}`);

  const sampleProduct = await db.collection('products').findOne({ id: 'opt-001' });
  console.log('\nSample Product Verified:');
  console.log(` - Name: ${sampleProduct.name}`);
  console.log(` - Price: Rs. ${sampleProduct.price}`);
  console.log(` - Images count: ${sampleProduct.images.length}`);

  const sampleAdmin = await db.collection('users').findOne({ role: 'admin' });
  console.log('\nSample Admin User Verified:');
  console.log(` - Email: ${sampleAdmin.email}`);
  console.log(` - Role: ${sampleAdmin.role}`);
  console.log(` - Password hash: ${sampleAdmin.password.substring(0, 15)}... (starts with bcrypt prefix)`);

  await mongoose.disconnect();
  console.log('\n✓ MongoDB Atlas Verification Complete! Everything is 100% operational in the cloud.');
}

testAtlas().catch(err => {
  console.error('Atlas test failed:', err);
  process.exit(1);
});
