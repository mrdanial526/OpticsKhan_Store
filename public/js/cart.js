// Cart & Checkout Module
const Cart = {
  items: [],
  coupon: null,
  FREE_SHIPPING_THRESHOLD: 5000,
  SHIPPING_FEE: 299,

  init() {
    this.load();
    this.bindEvents();
    this.render();
  },

  getCartKey() {
    const scope = (window.App && window.App.getUserScope) ? window.App.getUserScope() : 'guest';
    return `opticskhan_cart_${scope}`;
  },

  getCouponKey() {
    const scope = (window.App && window.App.getUserScope) ? window.App.getUserScope() : 'guest';
    return `opticskhan_coupon_${scope}`;
  },

  getLastOrderKey() {
    const scope = (window.App && window.App.getUserScope) ? window.App.getUserScope() : 'guest';
    return `opticskhan_last_order_${scope}`;
  },

  load() {
    try {
      this.items = [];
      this.coupon = null;
      const key = this.getCartKey();
      const saved = localStorage.getItem(key) || (key.endsWith('_guest') ? localStorage.getItem('opticskhan_cart') : null);
      if (saved) {
        this.items = JSON.parse(saved);
      }
      const couponKey = this.getCouponKey();
      const savedCoupon = localStorage.getItem(couponKey) || (couponKey.endsWith('_guest') ? localStorage.getItem('opticskhan_coupon') : null);
      if (savedCoupon) {
        this.coupon = JSON.parse(savedCoupon);
      }
    } catch (e) {
      this.items = [];
      this.coupon = null;
    }
  },

  save() {
    localStorage.setItem(this.getCartKey(), JSON.stringify(this.items));
    if (this.coupon) {
      localStorage.setItem(this.getCouponKey(), JSON.stringify(this.coupon));
    } else {
      localStorage.removeItem(this.getCouponKey());
    }
  },

  addItem(product, lensOption = null, prescription = null, color = null) {
    const lensPrice = lensOption ? lensOption.price : 0;
    const lensName = lensOption ? lensOption.name : "Frame Only (Demo Lenses)";
    const colorName = color ? color.name : (product.colors && product.colors[0] ? product.colors[0].name : "Standard");
    const itemKey = `${product.id}_${lensOption ? lensOption.id : 'demo'}_${colorName}`;

    const existing = this.items.find(i => i.key === itemKey);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        key: itemKey,
        productId: product.id,
        name: product.name,
        price: product.price + lensPrice,
        framePrice: product.price,
        lensPrice: lensPrice,
        lensName: lensName,
        colorName: colorName,
        image: (product.images && product.images[0]) || '/images/hero-eyewear.svg',
        quantity: 1,
        prescription: prescription
      });
    }

    this.save();
    this.render();
    this.openDrawer();
    this.showToast(`Added "${product.name}" with ${lensName} to cart!`);
  },

  updateQuantity(itemKey, delta) {
    const item = this.items.find(i => i.key === itemKey);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.items = this.items.filter(i => i.key !== itemKey);
    }
    this.save();
    this.render();
  },

  removeItem(itemKey) {
    this.items = this.items.filter(i => i.key !== itemKey);
    this.save();
    this.render();
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getDiscount() {
    if (!this.coupon) return 0;
    const subtotal = this.getSubtotal();
    if (this.coupon.discountAmount !== undefined) {
      return Math.min(subtotal, this.coupon.discountAmount);
    }
    return Math.round((subtotal * (this.coupon.discountPercent || 0)) / 100);
  },

  getShipping() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    if (this.coupon && this.coupon.freeShipping) return 0;
    return subtotal >= this.FREE_SHIPPING_THRESHOLD ? 0 : this.SHIPPING_FEE;
  },

  getTotal() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    return Math.max(0, subtotal - this.getDiscount() + this.getShipping());
  },

  async applyCoupon(code) {
    if (!code) return;
    try {
      const res = await fetch('/api/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: this.getSubtotal() })
      });
      const data = await res.json();
      if (data.success) {
        this.coupon = data.data;
        this.save();
        this.render();
        this.showToast(data.data.message);
      } else {
        alert(data.message || "Invalid coupon code");
      }
    } catch (err) {
      alert("Failed to apply coupon. Try OPTICSKHAN10");
    }
  },

  removeCoupon() {
    this.coupon = null;
    this.save();
    this.render();
  },

  render() {
    // 1. Update header badges
    const totalCount = this.items.reduce((sum, i) => sum + i.quantity, 0);
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // 2. Render items inside drawer
    const listEl = document.getElementById('drawer-items-list');
    const emptyEl = document.getElementById('drawer-empty-state');
    const footerEl = document.getElementById('drawer-footer');

    if (!listEl) return;

    if (this.items.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'flex';
      if (footerEl) footerEl.style.display = 'none';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      if (footerEl) footerEl.style.display = 'flex';

      listEl.innerHTML = this.items.map(item => `
        <div class="cart-item-row" data-key="${item.key}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <span class="cart-item-lens">${item.lensName} • ${item.colorName}</span>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <div class="qty-control">
                <button class="qty-btn" onclick="Cart.updateQuantity('${item.key}', -1)">−</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="Cart.updateQuantity('${item.key}', 1)">+</button>
              </div>
              <span class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          </div>
          <button style="background:none; border:none; color:#ef4444; cursor:pointer; align-self:flex-start;" onclick="Cart.removeItem('${item.key}')" title="Remove">✕</button>
        </div>
      `).join('');
    }

    // 3. Free shipping meter
    const subtotal = this.getSubtotal();
    const meterEl = document.getElementById('shipping-meter-fill');
    const meterText = document.getElementById('shipping-meter-text');
    if (meterEl && meterText) {
      if (subtotal >= this.FREE_SHIPPING_THRESHOLD || (this.coupon && this.coupon.freeShipping)) {
        meterEl.style.width = '100%';
        meterText.innerHTML = '🎉 <strong>Free Delivery Unlocked</strong> across all Pakistan!';
      } else {
        const remaining = this.FREE_SHIPPING_THRESHOLD - subtotal;
        const pct = Math.min(100, Math.round((subtotal / this.FREE_SHIPPING_THRESHOLD) * 100));
        meterEl.style.width = `${pct}%`;
        meterText.innerHTML = `Add <strong>Rs. ${remaining.toLocaleString()}</strong> more to unlock <strong>FREE Express Delivery</strong>!`;
      }
    }

    // 4. Update pricing summaries
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const discountEl = document.getElementById('cart-discount-val');
    const shippingEl = document.getElementById('cart-shipping-val');
    const totalEl = document.getElementById('cart-total-val');

    if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    if (discountEl) discountEl.textContent = `- Rs. ${this.getDiscount().toLocaleString()}`;
    if (shippingEl) {
      const s = this.getShipping();
      shippingEl.textContent = s === 0 ? 'FREE' : `Rs. ${s}`;
    }
    if (totalEl) totalEl.textContent = `Rs. ${this.getTotal().toLocaleString()}`;
  },

  openDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if (backdrop && drawer) {
      backdrop.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if (backdrop && drawer) {
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  bindEvents() {
    // Drawer buttons
    const openBtns = document.querySelectorAll('.open-cart-btn');
    openBtns.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.openDrawer();
    }));

    const closeBtn = document.getElementById('close-drawer-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());

    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => this.closeDrawer());

    // Coupon Apply
    const couponBtn = document.getElementById('apply-coupon-btn');
    const couponInput = document.getElementById('coupon-input');
    if (couponBtn && couponInput) {
      couponBtn.addEventListener('click', () => {
        this.applyCoupon(couponInput.value);
        couponInput.value = '';
      });
    }

    // Checkout modal trigger
    const checkoutBtn = document.getElementById('proceed-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.closeDrawer();
        this.openCheckoutModal();
      });
    }

    // Checkout Form Submit
    const checkoutForm = document.getElementById('checkout-order-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => this.handleOrderSubmit(e));
    }

    // Backdrop click for checkout modal
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
      checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) this.closeCheckoutModal();
      });
    }

    const successModal = document.getElementById('order-success-modal');
    if (successModal) {
      successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
          successModal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  },

  openCheckoutModal() {
    // 1. Mandatory Account Gate: User must be signed in or create an account
    if (!window.App || !window.App.currentUser) {
      this.closeDrawer();
      this.showToast('🔐 Please sign in or create an account to proceed with your order.');
      if (window.App) {
        window.App.pendingCheckoutAfterAuth = true;
        window.App.openAuthModal('customer');
      }
      return;
    }

    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    // 2. Pre-fill customer details from verified session (isolated per user)
    const form = document.getElementById('checkout-order-form');
    const userBar = document.getElementById('checkout-auth-user-bar');
    const userDisplayName = document.getElementById('checkout-user-display-name');

    if (form) {
      if (window.App && window.App.currentUser) {
        const u = window.App.currentUser;
        form.fullName.value = u.fullName || '';
        form.phone.value = u.phone || '';
        form.email.value = u.email || '';
        form.address.value = u.address || '';
        if (u.city) form.city.value = u.city;
        if (userBar && userDisplayName) {
          userBar.style.display = 'flex';
          userDisplayName.textContent = `${u.fullName} (${u.email || u.phone})`;
        }
      } else {
        form.reset();
        if (userBar) userBar.style.display = 'none';
      }
    }

    // Fill detailed breakdown in checkout modal
    const subtotalEl = document.getElementById('checkout-subtotal-amount');
    const shippingEl = document.getElementById('checkout-shipping-fee');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountEl = document.getElementById('checkout-discount-amount');
    const summaryEl = document.getElementById('checkout-payable-amount');

    const subtotal = this.getSubtotal();
    const shipping = this.getShipping();
    const discount = this.getDiscount();
    const total = this.getTotal();

    if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    if (shippingEl) {
      shippingEl.textContent = shipping === 0 ? 'FREE' : `Rs. ${shipping}`;
      shippingEl.style.color = shipping === 0 ? '#16a34a' : 'inherit';
    }
    if (discountRow) {
      if (discount > 0) {
        discountRow.style.display = 'flex';
        if (discountEl) discountEl.textContent = `- Rs. ${discount.toLocaleString()}`;
      } else {
        discountRow.style.display = 'none';
      }
    }
    if (summaryEl) {
      summaryEl.textContent = `Rs. ${total.toLocaleString()}`;
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  onPaymentMethodChange(val) {
    const submitBtn = document.getElementById('checkout-submit-btn');

    if (val && !val.includes('Cash on Delivery')) {
      if (submitBtn) submitBtn.textContent = 'Confirm Order (Cash on Delivery)';
      this.showToast('Only Cash on Delivery is available for checkout.');
      return;
    }

    if (submitBtn) submitBtn.textContent = 'Confirm Order (Cash on Delivery)';
  },

  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  async handleOrderSubmit(e) {
    e.preventDefault();
    // Verify user is logged in
    if (!window.App || !window.App.currentUser) {
      this.closeCheckoutModal();
      this.showToast('Please sign in or create an account to complete your order.');
      if (window.App) {
        window.App.pendingCheckoutAfterAuth = true;
        window.App.openAuthModal('customer');
      }
      return;
    }

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const paymentMethod = form.paymentMethod.value;
    const tidInput = form.querySelector('[name="transactionId"]');
    const transactionId = tidInput ? tidInput.value.trim() : '';

    if (!paymentMethod.includes('Cash on Delivery')) {
      alert('Only Cash on Delivery is available for checkout.');
      if (tidInput) tidInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Optical Order...';

    const orderData = {
      userId: window.App?.currentUser?.id || null,
      fullName: form.fullName.value || window.App.currentUser.fullName,
      phone: form.phone.value || window.App.currentUser.phone,
      email: form.email.value || window.App.currentUser.email || 'customer@opticskhan.pk',
      address: form.address.value,
      city: form.city.value,
      paymentMethod,
      transactionId,
      subtotal: this.getSubtotal(),
      discount: this.getDiscount(),
      deliveryFee: this.getShipping(),
      totalAmount: this.getTotal(),
      items: this.items
    };

    try {
      const headers = window.App && window.App.authHeaders
        ? window.App.authHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (data.success) {
        // Save recent order ID for tracking (isolated per user scope)
        localStorage.setItem(this.getLastOrderKey(), data.data.orderId);
        localStorage.setItem('opticskhan_last_order_id', data.data.orderId);

        // Update local session with saved address
        if (data.updatedUser && window.App) {
          window.App.currentUser = { ...window.App.currentUser, ...data.updatedUser };
          localStorage.setItem('opticskhan_user', JSON.stringify(window.App.currentUser));
          localStorage.setItem('opticskhan_auth_user', JSON.stringify(window.App.currentUser));
        } else if (window.App && window.App.currentUser) {
          window.App.currentUser.address = orderData.address;
          window.App.currentUser.city = orderData.city;
          localStorage.setItem('opticskhan_user', JSON.stringify(window.App.currentUser));
          localStorage.setItem('opticskhan_auth_user', JSON.stringify(window.App.currentUser));
        }

        // Clear cart
        this.items = [];
        this.coupon = null;
        this.save();
        this.render();

        // Close checkout modal & show confirmation modal
        this.closeCheckoutModal();
        this.showOrderConfirmation(data.data);
      } else {
        alert(data.message || 'Failed to place order.');
      }
    } catch (err) {
      alert('Network error placing order. Please try again or WhatsApp us.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Order (Cash on Delivery)';
    }
  },

  showOrderConfirmation(order) {
    const modal = document.getElementById('order-success-modal');
    if (!modal) return;

    document.getElementById('confirmed-order-id').textContent = order.orderId;
    document.getElementById('confirmed-customer-name').textContent = order.customer.fullName;
    document.getElementById('confirmed-total-price').textContent = `Rs. ${order.totalAmount.toLocaleString()}`;
    document.getElementById('confirmed-address').textContent = `${order.customer.address}, ${order.customer.city}`;

    const paymentEl = document.getElementById('confirmed-payment-method');
    if (paymentEl) paymentEl.textContent = order.paymentMethod || 'Cash on Delivery (COD)';

    const tidRow = document.getElementById('confirmed-tid-row');
    const tidVal = document.getElementById('confirmed-tid-value');
    const isWallet = false;

    if (order.transactionId && tidRow && tidVal) {
      tidRow.style.display = 'block';
      tidVal.textContent = order.transactionId;
    } else if (tidRow) {
      tidRow.style.display = 'none';
    }

    const emailNotice = document.getElementById('confirmed-email-notice');
    if (emailNotice) {
      emailNotice.textContent = order.customer.email || 'customer@opticskhan.pk';
    }

    // WhatsApp link with full itemized receipt for instant dispatch confirmation
    const waBtn = document.getElementById('whatsapp-track-btn');
    if (waBtn) {
      const itemsList = (order.items || []).map(i => `• ${i.name} (x${i.quantity || 1}) - Rs. ${(i.price || 0).toLocaleString()}`).join('\n');
      const text = encodeURIComponent(
        `👓 *${isWallet ? 'NEW ORDER - ADVANCE PAYMENT PROOF' : 'NEW ORDER CONFIRMATION'} - OPTICSKHAN PAKISTAN*\n\n` +
        `*Order ID:* #${order.orderId}\n` +
        `*Customer:* ${order.customer.fullName}\n` +
        `*Contact:* ${order.customer.phone}\n` +
        `*Payment Method:* ${order.paymentMethod}\n` +
        (order.transactionId ? `*Transaction ID (TID):* ${order.transactionId}\n` : '') +
        `*Shipping Address:* ${order.customer.address}, ${order.customer.city}\n\n` +
        `*Items Ordered:*\n${itemsList}\n\n` +
        `*Total Payable:* Rs. ${order.totalAmount.toLocaleString()}\n\n` +
        (isWallet
          ? `I have sent the payment via ${order.paymentMethod} (TID: ${order.transactionId || 'Attached'}). Please find attached my payment screenshot for express dispatch!`
          : `Please confirm my optical order dispatch!`)
      );
      waBtn.href = `https://wa.me/923241383370?text=${text}`;
      if (isWallet) {
        waBtn.innerHTML = `<span>💬 Send Payment Screenshot on WhatsApp (0324-1383370)</span>`;
      } else {
        waBtn.innerHTML = `<span>💬 Track / Confirm on WhatsApp</span>`;
      }
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerHTML = `<span>👓</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

window.Cart = Cart;
document.addEventListener('DOMContentLoaded', () => Cart.init());
