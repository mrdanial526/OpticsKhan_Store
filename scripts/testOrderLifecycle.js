require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

function postJson(urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patchJson(urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'GET'
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('====================================================');
  console.log('🛒 TESTING FULL E-COMMERCE DATABASE & ORDER LIFECYCLE');
  console.log('====================================================');

  // 1. Create a customer
  const testEmail = `shopper_${Date.now()}@faboptic.pk`;
  console.log('\n[1] Registering customer:', testEmail);
  const reg = await postJson('/api/auth/register', {
    fullName: 'Ali Raza',
    email: testEmail,
    password: 'RazaPassword123',
    phone: '03241383370'
  });
  if (reg.status !== 201) throw new Error('Registration failed');
  const userId = reg.data.user.id;
  console.log('✓ Customer registered with ID:', userId);

  // 2. Customer places order with address
  console.log('\n[2] Placing order with delivery address...');
  const orderRes = await postJson('/api/orders', {
    userId,
    fullName: 'Ali Raza',
    phone: '03241383370',
    email: testEmail,
    address: 'House 42, Street 7, Sector Y, DHA Phase 3',
    city: 'Lahore',
    paymentMethod: 'Cash on Delivery (COD)',
    subtotal: 4950,
    deliveryFee: 0,
    totalAmount: 4950,
    items: [
      { id: 'opt-001', name: 'Aviator Titanium Gold', price: 4950, quantity: 1 }
    ]
  });

  if (orderRes.status !== 201 || !orderRes.data.success) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderRes.data));
  }
  const orderId = orderRes.data.data.orderId;
  console.log(`✓ Order placed successfully! ID: #${orderId}`);

  // Verify user profile was auto-updated with delivery address
  if (!orderRes.data.updatedUser || orderRes.data.updatedUser.address !== 'House 42, Street 7, Sector Y, DHA Phase 3') {
    throw new Error('Customer profile address was not auto-saved during order!');
  }
  console.log('✓ Verified: Customer profile auto-saved address:', orderRes.data.updatedUser.address);

  // 3. Admin updates order status to "Dispatched with Courier TCS" and adds Tracking Number
  console.log('\n[3] Admin fulfills order and attaches TCS tracking number...');
  const updateRes = await patchJson(`/api/admin/orders/${orderId}`, {
    status: 'Dispatched with Courier TCS',
    courierName: 'TCS Express',
    courierTrackingNumber: 'TCS-99441188PK'
  });

  if (updateRes.status !== 200 || !updateRes.data.success) {
    throw new Error('Admin status update failed: ' + JSON.stringify(updateRes.data));
  }
  console.log('✓ Admin successfully updated status to:', updateRes.data.data.status);
  console.log('✓ Courier tracking attached:', updateRes.data.data.courierTrackingNumber);

  // 4. Customer tracks order on website
  console.log('\n[4] Customer tracking order on website...');
  const trackRes = await getJson(`/api/orders/${orderId}`);
  if (trackRes.status !== 200 || !trackRes.data.success) {
    throw new Error('Order lookup failed');
  }
  const trackedOrder = trackRes.data.data;
  if (trackedOrder.status !== 'Dispatched with Courier TCS') {
    throw new Error('Expected updated status');
  }
  if (trackedOrder.courierTrackingNumber !== 'TCS-99441188PK') {
    throw new Error('Tracking number missing from customer lookup');
  }
  if (!trackedOrder.statusHistory || trackedOrder.statusHistory.length < 2) {
    throw new Error('Status history timeline was not preserved');
  }
  console.log('✓ Customer lookup returned verified order with live status and TCS tracking!');
  console.log('✓ Order Timeline Steps recorded:', trackedOrder.statusHistory.length);

  // 5. Direct verification in MongoDB Atlas Cloud
  console.log('\n[5] Verifying live in MongoDB Atlas Cloud Cluster...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const mongoOrder = await db.collection('orders').findOne({ orderId });
  if (!mongoOrder || mongoOrder.status !== 'Dispatched with Courier TCS') {
    throw new Error('Order in MongoDB Atlas did not reflect updated status!');
  }
  console.log(`✓ MongoDB Atlas Cloud verified: Order #${mongoOrder.orderId} status is '${mongoOrder.status}' with tracking '${mongoOrder.courierTrackingNumber}'`);

  const mongoUser = await db.collection('users').findOne({ email: testEmail });
  if (!mongoUser || mongoUser.address !== 'House 42, Street 7, Sector Y, DHA Phase 3') {
    throw new Error('Customer address in MongoDB Atlas was not updated!');
  }
  console.log(`✓ MongoDB Atlas Cloud verified: Customer ${mongoUser.fullName} has saved address in database: '${mongoUser.address}, ${mongoUser.city}'`);

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL E-COMMERCE DATABASE CHECKS PASSED 100%!');
  console.log('====================================================');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
