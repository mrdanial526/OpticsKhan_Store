// @ts-check
/**
 * Order Notification Service
 * Sends automated email receipts & alerts to store admin and customers via Nodemailer,
 * with optional instant webhook alerts (Discord / Telegram / Custom Webhook).
 */
const nodemailer = require('nodemailer');

/**
 * Creates the Nodemailer transporter using environment variables.
 * Compatible with Gmail App Passwords, SendGrid, Mailgun, Brevo, or custom SMTP.
 */
function getTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Builds HTML email body for new orders
 * @param {any} order
 * @param {boolean} isForAdmin
 */
function buildOrderHtml(order, isForAdmin) {
  const customer = order.customer || {};
  const items = order.items || [];
  const phone = customer.phone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
  const isWallet = order.paymentMethod && (order.paymentMethod.includes('JazzCash') || order.paymentMethod.includes('EasyPaisa') || order.paymentMethod.includes('Bank'));

  const itemsRows = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 12px; font-size: 13px; color: #1e293b;">
        <strong>${idx + 1}. ${item.name || 'Frame'}</strong>
        ${item.color ? `<div style="font-size: 11px; color: #64748b;">Color: ${item.color}</div>` : ''}
        ${item.lens ? `<div style="font-size: 11px; color: #0284c7;">Lens: ${item.lens}</div>` : ''}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; text-align: right; font-weight: 600;">Rs. ${(item.price || 0).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      
      <!-- Brand Header -->
      <div style="background: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; letter-spacing: 1.5px; text-transform: uppercase;">👓 FabOptic Eyewear</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #d4af37;">
          ${isForAdmin ? '🔔 NEW ORDER NOTIFICATION' : '✨ YOUR ORDER CONFIRMATION'}
        </p>
      </div>

      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">
          <div>
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Order Number</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a;">#${order.orderId}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Status</div>
            <div style="font-size: 14px; font-weight: 700; color: #16a34a;">${order.status || 'Confirmed & Packing'}</div>
          </div>
        </div>

        <!-- Payment Method Alert Banner -->
        <div style="background: ${isWallet ? '#fefce8' : '#f0fdf4'}; border: 1px solid ${isWallet ? '#fef08a' : '#bbf7d0'}; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <div style="font-size: 13px; font-weight: 700; color: ${isWallet ? '#854d0e' : '#166534'};">
            💳 Payment Method: ${order.paymentMethod || 'Cash on Delivery (COD)'}
          </div>
          ${order.transactionId ? `
            <div style="margin-top: 6px; font-size: 13px; color: #713f12;">
              <strong>Transaction ID / Reference #:</strong>
              <span style="font-family: monospace; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde047; font-weight: 800; color: #92400e;">${order.transactionId}</span>
              ${isForAdmin ? '<div style="font-size: 11px; margin-top: 4px; color: #b45309;">⚠️ Please verify this transaction in your JazzCash/EasyPaisa app.</div>' : ''}
            </div>
          ` : ''}
        </div>

        <!-- Customer & Shipping Details -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #334155;">📦 Shipping Information</h3>
          <div style="font-size: 13px; line-height: 1.6; color: #1e293b;">
            <strong>Customer:</strong> ${customer.fullName || 'N/A'}<br>
            <strong>Phone:</strong> <a href="tel:${phone}" style="color: #0284c7; text-decoration: none;">${phone}</a><br>
            <strong>Email:</strong> ${customer.email || 'N/A'}<br>
            <strong>Delivery Address:</strong> ${customer.address || ''}, ${customer.city || 'Pakistan'}
          </div>
          ${isForAdmin && waPhone ? `
            <div style="margin-top: 12px;">
              <a href="https://wa.me/${waPhone}" target="_blank" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                💬 Open WhatsApp Chat with Customer
              </a>
            </div>
          ` : ''}
        </div>

        <!-- Items Table -->
        <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #334155;">Ordered Eyewear</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b;">Item</th>
              <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center;">Qty</th>
              <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 8px 12px; font-size: 13px; text-align: right; color: #64748b;">Subtotal:</td>
              <td style="padding: 8px 12px; font-size: 13px; text-align: right; font-weight: 600;">Rs. ${(order.subtotal || 0).toLocaleString()}</td>
            </tr>
            ${order.discount ? `
              <tr>
                <td colspan="2" style="padding: 4px 12px; font-size: 13px; text-align: right; color: #16a34a;">Discount:</td>
                <td style="padding: 4px 12px; font-size: 13px; text-align: right; color: #16a34a; font-weight: 600;">- Rs. ${order.discount.toLocaleString()}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="2" style="padding: 4px 12px; font-size: 13px; text-align: right; color: #64748b;">Delivery Fee:</td>
              <td style="padding: 4px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #16a34a;">${order.deliveryFee ? `Rs. ${order.deliveryFee}` : 'FREE'}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a;">
              <td colspan="2" style="padding: 10px 12px; font-size: 15px; font-weight: 800; text-align: right; color: #0f172a;">Total Payable:</td>
              <td style="padding: 10px 12px; font-size: 16px; font-weight: 900; text-align: right; color: #0f172a;">Rs. ${(order.totalAmount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Prescription Info (if attached) -->
        ${order.prescription ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: #1e40af;">
            <strong>👓 Prescription Details:</strong> Custom optical prescription attached. View full parameters in the Owner Suite.
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
          FabOptic Eyewear Pakistan • Haute Precision Eyewear • WhatsApp / Helpline: 0324-1383370
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Sends order alerts via email & webhooks
 * @param {any} order
 */
async function sendOrderNotifications(order) {
  const customer = order.customer || {};
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'rdanial795@gmail.com';
  const transporter = getTransporter();

  // 1. Send Admin Email Notification
  if (transporter && adminEmail) {
    try {
      const isWallet = order.paymentMethod && (order.paymentMethod.includes('JazzCash') || order.paymentMethod.includes('EasyPaisa'));
      const subject = `👓 [NEW ORDER #${order.orderId}] Rs. ${(order.totalAmount || 0).toLocaleString()} - ${order.customer?.fullName || 'Customer'} (${isWallet ? '📱 ' + order.paymentMethod : 'COD'})`;
      await transporter.sendMail({
        from: `"FabOptic Store" <${process.env.SMTP_USER || 'rdanial795@gmail.com'}>`,
        to: adminEmail,
        subject,
        html: buildOrderHtml(order, true),
      });
      console.log(`✓ Order alert email sent to admin: ${adminEmail}`);
    } catch (err) {
      console.warn('⚠️ Admin notification email failed:', err.message);
    }

    // 2. Send Customer Email Receipt
    if (customer.email && customer.email.includes('@')) {
      try {
        await transporter.sendMail({
          from: `"FabOptic Eyewear" <${process.env.SMTP_USER || 'no-reply@faboptic.pk'}>`,
          to: customer.email,
          subject: `✨ Your FabOptic Order Confirmation #${order.orderId}`,
          html: buildOrderHtml(order, false),
        });
        console.log(`✓ Order receipt email sent to customer: ${customer.email}`);
      } catch (err) {
        console.warn('⚠️ Customer receipt email failed:', err.message);
      }
    }
  }

  // 3. Optional Instant Push Webhook (Discord / Slack / Telegram)
  const webhookUrl = process.env.ADMIN_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const itemsList = (order.items || []).map(i => `• ${i.name} (x${i.quantity || 1}) - Rs. ${(i.price || 0).toLocaleString()}`).join('\n');
      const payload = {
        username: 'FabOptic Orders',
        content: `🚨 **NEW OPTICAL ORDER PLACED!**\n**Order:** #${order.orderId}\n**Customer:** ${customer.fullName} (${customer.phone})\n**Address:** ${customer.address}, ${customer.city}\n**Total:** Rs. ${(order.totalAmount || 0).toLocaleString()} (${order.paymentMethod || 'COD'})${order.transactionId ? `\n**TID:** ${order.transactionId}` : ''}\n**Items:**\n${itemsList}`,
      };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('✓ Instant webhook notification delivered to admin channel.');
    } catch (err) {
      console.warn('⚠️ Webhook notification failed:', err.message);
    }
  }
}

module.exports = {
  sendOrderNotifications,
  getTransporter,
};

