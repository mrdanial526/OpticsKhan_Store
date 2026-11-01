// DOM event bindings, announcements, consultation, order tracking, delivery modal
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

  bindEvents() {
    // Category Tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.dataset.filter;
        this.fetchFilteredProducts();
      });
    });

    // Navigation and Footer Category Links (OptixOne categories)
    document.querySelectorAll('.filter-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const cat = link.dataset.filter;
        if (cat) {
          this.activeFilter = cat;
          document.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.filter === cat);
          });
          document.querySelectorAll('.filter-nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.filter === cat);
          });
          this.fetchFilteredProducts();
        }
      });
    });

    // Gender Filter
    const genderSelect = document.getElementById('gender-filter-select');
    if (genderSelect) {
      genderSelect.addEventListener('change', (e) => {
        this.activeGender = e.target.value;
        this.fetchFilteredProducts();
      });
    }

    // Shape Filter
    const shapeSelect = document.getElementById('shape-filter-select');
    if (shapeSelect) {
      shapeSelect.addEventListener('change', (e) => {
        this.activeShape = e.target.value;
        this.fetchFilteredProducts();
      });
    }

    // Sort Filter
    const sortSelect = document.getElementById('sort-filter-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.activeSort = e.target.value;
        this.fetchFilteredProducts();
      });
    }

    // Live Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.fetchFilteredProducts();
      });
    }

    // Review slider arrows
    const prevBtn = document.getElementById('reviews-prev-btn');
    const nextBtn = document.getElementById('reviews-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.slideReviews(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.slideReviews(1));

    // Write Review Button
    const writeRevBtn = document.getElementById('write-review-open-btn');
    if (writeRevBtn) writeRevBtn.addEventListener('click', () => this.openWriteReviewModal());

    const closeRevBtn = document.getElementById('close-review-modal-btn');
    if (closeRevBtn) closeRevBtn.addEventListener('click', () => this.closeWriteReviewModal());

    const reviewForm = document.getElementById('write-review-form');
    if (reviewForm) reviewForm.addEventListener('submit', (e) => this.handleReviewSubmit(e));

    // Customizer Modal Close
    const closeCustBtn = document.getElementById('close-customizer-btn');
    if (closeCustBtn) closeCustBtn.addEventListener('click', () => this.closeLensCustomizer());

    const addCustomizedBtn = document.getElementById('customizer-add-cart-btn');
    if (addCustomizedBtn) addCustomizedBtn.addEventListener('click', () => this.addCustomizedToCart());

    // Newsletter Form
    const nlForm = document.getElementById('newsletter-form');
    if (nlForm) nlForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));

    // Consultation Modal Listeners
    const openConsultBtn = document.getElementById('open-consultation-btn');
    if (openConsultBtn) openConsultBtn.addEventListener('click', () => this.openConsultationModal());

    const closeConsultBtn = document.getElementById('close-consultation-btn');
    if (closeConsultBtn) closeConsultBtn.addEventListener('click', () => this.closeConsultationModal());

    const consultForm = document.getElementById('consultation-form');
    if (consultForm) consultForm.addEventListener('submit', (e) => this.handleConsultationSubmit(e));

    // Backdrop click handlers for all app modals
    ['lens-customizer-modal', 'write-review-modal', 'consultation-modal', 'order-tracking-modal', 'delivery-modal', 'auth-modal', 'customer-account-modal', 'admin-portal-modal', 'edit-product-modal', 'wishlist-modal', 'invoice-modal', 'prescription-view-modal'].forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
          }
        });
      }
    });

    // Explicit Nav Click Handlers
    const navAuth = document.getElementById('nav-auth-btn');
    if (navAuth) {
      navAuth.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleUserNavClick();
      });
    }

    const navOwner = document.getElementById('nav-owner-portal-btn');
    if (navOwner) {
      navOwner.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAdminModal();
      });
    }

    // Clear authentication errors and error highlights on input
    ['login-email', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          el.classList.remove('input-error');
          const errBox = document.getElementById('login-error-box');
          if (errBox) errBox.style.display = 'none';
        });
      }
    });

    ['reg-name', 'reg-phone', 'reg-email', 'reg-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          el.classList.remove('input-error');
          const errBox = document.getElementById('register-error-box');
          if (errBox) errBox.style.display = 'none';
        });
      }
    });

    // Start announcement rotator
    this.initAnnouncementRotator();
  },

  initAnnouncementRotator() {
    const messages = [
      "🚚 Free Express Delivery All Over Pakistan on orders above Rs. 5,000 | 100% Optical Guarantee",
      "✨ Handcrafted Japanese Titanium & Italian Acetate Eyewear with 1-Year Frame Warranty",
      "👓 Need Free Prescription Advice? WhatsApp Optometrist: 0324-1383370",
      "✨ Magnetic Clip-On 2-in-1 Sunglasses now in stock! Snap on polarized shade anytime."
    ];
    let idx = 0;
    const textEl = document.getElementById('announcement-text');
    if (!textEl) return;
    setInterval(() => {
      idx = (idx + 1) % messages.length;
      textEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = messages[idx];
        textEl.style.opacity = '1';
      }, 300);
    }, 4500);
  },

  openConsultationModal() {
    const modal = document.getElementById('consultation-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeConsultationModal() {
    const modal = document.getElementById('consultation-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  async handleConsultationSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking Appointment...';

    const payload = {
      fullName: form.fullName.value,
      phone: form.phone.value,
      preferredCity: form.preferredCity.value,
      preferredDate: form.preferredDate.value,
      notes: form.notes.value
    };

    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        this.closeConsultationModal();
        Cart.showToast(`📅 Consultation booked! ID: ${data.data.appointmentId}. Our optometrist will contact you.`);
        form.reset();
      } else {
        alert(data.message || 'Booking failed');
      }
    } catch (err) {
      alert('Network error booking consultation.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Optometrist Booking 📅';
    }
  },

  // --- ORDER TRACKING PORTAL ---
  openTrackingModal(orderId = '') {
    const modal = document.getElementById('order-tracking-modal');
    if (!modal) return;

    const input = document.getElementById('tracking-input-id');
    const resultBox = document.getElementById('tracking-result-box');
    const errorBox = document.getElementById('tracking-error-box');

    if (resultBox) resultBox.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';

    const targetId = orderId || localStorage.getItem('faboptic_last_order_id') || '';
    if (input) {
      input.value = targetId;
      if (targetId) {
        this.lookupOrder();
      }
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeTrackingModal() {
    const modal = document.getElementById('order-tracking-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  async lookupOrder() {
    const input = document.getElementById('tracking-input-id');
    const resultBox = document.getElementById('tracking-result-box');
    const errorBox = document.getElementById('tracking-error-box');
    if (!input) return;

    const query = input.value.trim().toUpperCase();
    if (!query) {
      Cart.showToast('Please enter an Order ID');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${query}`);
      const data = await res.json();

      if (data.success && data.data) {
        const order = data.data;
        if (errorBox) errorBox.style.display = 'none';

        const dateStr = new Date(order.createdAt).toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        // Dynamic 5-Step Fulfillment Timeline calculation
        const currentStatus = (order.status || 'Confirmed & Packing').toLowerCase();
        let currentStepIndex = 1;
        if (currentStatus.includes('delivered') || currentStatus.includes('verified')) {
          currentStepIndex = 5;
        } else if (currentStatus.includes('dispatched') || currentStatus.includes('courier')) {
          currentStepIndex = 4;
        } else if (currentStatus.includes('qc') || currentStatus.includes('inspection')) {
          currentStepIndex = 3;
        } else if (currentStatus.includes('lab') || currentStatus.includes('cut') || currentStatus.includes('lens')) {
          currentStepIndex = 2;
        } else {
          currentStepIndex = 1;
        }

        const steps = [
          { num: 1, label: '1. Confirmed', icon: '✓' },
          { num: 2, label: '2. Lab Cut', icon: '🔬' },
          { num: 3, label: '3. QC Passed', icon: '⚡' },
          { num: 4, label: '4. Dispatched', icon: '🚚' },
          { num: 5, label: '5. Delivered', icon: '🎉' }
        ];

        const timelineHtml = steps.map(s => {
          let bg = 'var(--color-gray-100, #f3f4f6)';
          let color = 'var(--color-gray-500, #6b7280)';
          let border = '1px solid var(--color-gray-300, #d1d5db)';
          let icon = s.num < currentStepIndex ? '✓' : s.icon;

          if (s.num < currentStepIndex) {
            bg = '#16a34a';
            color = '#ffffff';
            border = '1px solid #15803d';
            icon = '✓';
          } else if (s.num === currentStepIndex) {
            bg = '#2563eb';
            color = '#ffffff';
            border = '1px solid #1d4ed8';
          }

          return `
            <div style="background:${bg}; color:${color}; border:${border}; padding:6px 2px; border-radius:6px; font-size:10.5px; font-weight:700; text-align:center; transition:all 0.3s ease;">
              <div style="font-size:12px;">${icon}</div>
              <div style="margin-top:2px;">${s.label}</div>
            </div>
          `;
        }).join('');

        const courierHtml = order.courierTrackingNumber ? `
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 14px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:10.5px; text-transform:uppercase; font-weight:800; color:#1d4ed8;">Courier Tracking Active</span>
              <div style="font-size:13px; font-weight:800; color:#1e3a8a; margin-top:2px;">
                ${order.courierName || 'TCS Express'}: <span style="font-family:monospace; background:#dbeafe; padding:2px 6px; border-radius:4px;">${order.courierTrackingNumber}</span>
              </div>
            </div>
            <a href="https://www.tcsexpress.com/tracking" target="_blank" style="background:#2563eb; color:#fff; text-decoration:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700;">Track on TCS ↗</a>
          </div>
        ` : '';

        resultBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-gray-200); padding-bottom:10px;">
            <div>
              <span style="font-size:11px; text-transform:uppercase; color:var(--color-gray-500); font-weight:800;">Order Verified</span>
              <h4 style="font-size:16px; font-weight:900; margin:2px 0;">#${order.orderId}</h4>
              <span style="font-size:12px; color:var(--color-gray-500);">Placed on: ${dateStr}</span>
            </div>
            <span style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:11.5px; font-weight:800; padding:4px 10px; border-radius:99px;">
              ${order.status || 'In Lab Preparation'}
            </span>
          </div>

          <!-- Dynamic 5-Step Optical Timeline -->
          <div>
            <span style="font-size:11px; font-weight:800; color:var(--color-gray-600); text-transform:uppercase;">Live Fulfillment Progress</span>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; margin-top:8px;">
              ${timelineHtml}
            </div>
          </div>

          ${courierHtml}

          <!-- Customer & Delivery Details -->
          <div style="font-size:12.5px; display:flex; flex-direction:column; gap:4px; border-top:1px dashed var(--color-gray-200); padding-top:10px;">
            <div><strong>Recipient:</strong> ${order.customer.fullName} (${order.customer.phone})</div>
            <div><strong>Delivery Destination:</strong> ${order.customer.address}, ${order.customer.city}</div>
            <div><strong>Estimated Delivery:</strong> <strong>${order.estimatedDelivery || '2-3 Business Days via TCS'}</strong></div>
            <div><strong>Payment Mode:</strong> ${order.paymentMethod} (Rs. ${order.totalAmount.toLocaleString()})</div>
          </div>

          <!-- Items Ordered -->
          <div style="border-top:1px solid var(--color-gray-200); padding-top:10px;">
            <span style="font-size:11px; font-weight:800; color:var(--color-gray-600); text-transform:uppercase;">Optical Items (${order.items.length})</span>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
              ${order.items.map(it => `
                <div style="display:flex; justify-content:space-between; font-size:12px; background:#fff; padding:6px 10px; border-radius:6px; border:1px solid var(--color-gray-200);">
                  <span><strong>${it.name}</strong> • ${it.lensName || 'Demo Lenses'}</span>
                  <span>Rs. ${(it.price * (it.quantity || 1)).toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <button class="secondary-btn" onclick="App.printOrderInvoice('${order.orderId}')" style="width:100%; text-align:center; padding:9px; background:#f8fafc; border:1px solid #cbd5e1; font-weight:700; font-size:12px; margin-top:4px;">
            🖨️ Print Packing Slip / Invoice
          </button>

          <a href="https://wa.me/923241383370?text=Hi%20FabOptic!%20Checking%20dispatch%20for%20Order%20%23${order.orderId}" target="_blank" class="primary-btn" style="text-align:center; padding:10px; background:#25D366; color:#fff; font-size:13px;">
            💬 WhatsApp Dispatch Desk for Updates
          </a>
        `;
        resultBox.style.display = 'flex';
      } else {
        if (resultBox) resultBox.style.display = 'none';
        if (errorBox) errorBox.style.display = 'block';
      }
    } catch (e) {
      if (resultBox) resultBox.style.display = 'none';
      if (errorBox) errorBox.style.display = 'block';
    }
  },

  // --- DELIVERY & GUARANTEE MODAL ---
  openDeliveryModal() {
    const modal = document.getElementById('delivery-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDeliveryModal() {
    const modal = document.getElementById('delivery-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },
});
