// Owner suite: stats, inventory, product photos, orders, invoices, coupons, order chime
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

  // ==========================================
  // OWNER / MANAGEMENT ATELIER SUITE
  // ==========================================
  async openAdminModal() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      Cart.showToast('⛔ Access Denied: Owner login required to manage products.');
      return;
    }
    const modal = document.getElementById('admin-portal-modal');
    if (!modal) return;

    this.switchAdminTab('inventory');
    await this.refreshAdminStats();
    await this.refreshAdminInventory();
    await this.refreshAdminOrders();
    await this.refreshAdminCoupons();

    // Start background live polling for incoming orders while Owner Suite is open
    if (!this.orderPollTimer) {
      this.orderPollTimer = setInterval(() => {
        this.refreshAdminOrders();
      }, 20000);
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeAdminModal() {
    const modal = document.getElementById('admin-portal-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (this.orderPollTimer) {
      clearInterval(this.orderPollTimer);
      this.orderPollTimer = null;
    }
  },

  switchAdminTab(tabName) {
    ['inventory', 'add', 'orders', 'coupons'].forEach(t => {
      const tabEl = document.getElementById(`admin-tab-${t}`);
      const btnEl = document.getElementById(`admin-tab-${t}-btn`);
      if (tabEl) tabEl.style.display = t === tabName ? 'flex' : 'none';
      if (btnEl) btnEl.classList.toggle('active', t === tabName);
    });
    if (tabName === 'coupons') {
      this.refreshAdminCoupons();
    }
  },

  async refreshAdminStats() {
    try {
      const res = await this.authFetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        const container = document.getElementById('admin-metrics-container');
        if (container) {
          container.innerHTML = `
            <div class="admin-stat-card">
              <span class="admin-stat-num">${s.totalProducts}</span>
              <span class="admin-stat-label">Total Catalog</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-num" style="color:#16a34a;">${s.inStockCount}</span>
              <span class="admin-stat-label">In Stock Frames</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-num" style="color:#ef4444;">${s.outOfStockCount}</span>
              <span class="admin-stat-label">Out of Stock</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-num">${s.totalOrders}</span>
              <span class="admin-stat-label">Orders Received</span>
            </div>
            <div class="admin-stat-card highlight">
              <span class="admin-stat-num" style="color:#854d0e;">Rs. ${s.totalRevenue.toLocaleString()}</span>
              <span class="admin-stat-label">Total Revenue</span>
            </div>
          `;
        }
      }
    } catch(e) {}
  },

  async refreshAdminInventory() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      this.products = data.data || [];
      this.renderAdminInventory(this.products);
      this.renderProducts();
    } catch(e) {}
  },

  renderAdminInventory(list) {
    const tbody = document.getElementById('admin-inventory-tbody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#888;">No eyewear products found matching query.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(p => {
      const img = (p.images && p.images[0]) || '/images/hero-eyewear.svg';
      const inStock = p.inStock !== false;
      return `
        <tr>
          <td style="width:70px;">
            <img src="${img}" alt="${p.name}" style="width:60px; height:40px; object-fit:contain; background:#f8fafc; border-radius:6px; padding:3px; border:1px solid #e2e8f0;">
          </td>
          <td>
            <strong>${p.name}</strong>
            <div style="font-size:11px; color:var(--color-gray-500);">${p.material} • ${p.shape}</div>
          </td>
          <td>
            <span style="font-size:11.5px; background:var(--color-gray-100); padding:3px 8px; border-radius:6px;">${p.category}</span>
          </td>
          <td>
            <strong style="color:var(--color-black);">Rs. ${p.price.toLocaleString()}</strong>
            ${p.originalPrice ? `<div style="font-size:10.5px; color:#999; text-decoration:line-through;">Rs. ${p.originalPrice.toLocaleString()}</div>` : ''}
          </td>
          <td>
            <button class="stock-badge-pill ${inStock ? 'in-stock' : 'out-stock'}" onclick="App.toggleStockFromAdmin('${p.id}')" title="Click to toggle availability">
              <span>${inStock ? '● In Stock' : '✕ Out of Stock'}</span>
            </button>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="action-btn-mini" onclick="App.openEditProductModal('${p.id}')">
                ✏️ Edit
              </button>
              <button class="action-btn-mini danger" onclick="App.handleDeleteProduct('${p.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterAdminInventory() {
    const q = document.getElementById('admin-inventory-search')?.value.toLowerCase().trim();
    if (!q) {
      this.renderAdminInventory(this.products);
      return;
    }
    const filtered = this.products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.shape.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q)
    );
    this.renderAdminInventory(filtered);
  },

  async toggleStockFromAdmin(id) {
    try {
      const res = await this.authFetch(`/api/products/${id}/stock`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(data.message);
        await this.refreshAdminInventory();
        await this.refreshAdminStats();
      } else {
        alert(data.message || 'Failed to update stock');
      }
    } catch(e) {
      alert('Error updating stock status.');
    }
  },

  // ==========================================
  // MULTI-PHOTO MANAGEMENT (EDIT & NEW PRODUCTS)
  // ==========================================

  // --- EDIT PRODUCT PHOTOS ---
  renderEditProductImages() {
    const container = document.getElementById('edit-prod-photos-container');
    const badge = document.getElementById('edit-prod-photo-count-badge');
    if (!container) return;

    if (!this.editingProductImages || !this.editingProductImages.length) {
      this.editingProductImages = ['/images/aviator-gold.svg'];
    }

    if (badge) {
      const len = this.editingProductImages.length;
      badge.textContent = `${len} Photo${len > 1 ? 's' : ''}`;
    }

    container.innerHTML = this.editingProductImages.map((src, idx) => {
      const isPrimary = idx === 0;
      return `
        <div class="photo-manager-chip ${isPrimary ? 'is-primary' : ''}">
          <img src="${src}" alt="Frame photo ${idx + 1}" onerror="this.src='/images/hero-eyewear.svg'">
          <span class="chip-badge">${isPrimary ? '★ Primary' : `#${idx + 1}`}</span>
          ${!isPrimary ? `
            <button type="button" class="chip-star-btn" onclick="App.setPrimaryEditPhoto(${idx})" title="Set as primary/front photo">★</button>
          ` : ''}
          <button type="button" class="chip-del-btn" onclick="App.removeEditPhoto(${idx})" title="Remove this photo">✕</button>
        </div>
      `;
    }).join('');
  },

  addPhotoFromPresetToEdit() {
    const select = document.getElementById('edit-add-photo-preset');
    if (!select || !select.value) return;
    this.editingProductImages = this.editingProductImages || [];
    this.editingProductImages.push(select.value);
    this.renderEditProductImages();
    Cart.showToast(`📸 Added "${select.options[select.selectedIndex].text}" to frame gallery!`);
  },

  addCustomUrlPhotoToEdit() {
    const input = document.getElementById('edit-add-custom-photo-url');
    const val = input?.value?.trim();
    if (!val) {
      alert('Please enter or paste an image URL.');
      return;
    }
    this.editingProductImages = this.editingProductImages || [];
    this.editingProductImages.push(val);
    input.value = '';
    this.renderEditProductImages();
    Cart.showToast('📸 Added custom image URL to frame gallery!');
  },

  handleEditMultiFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.editingProductImages = this.editingProductImages || [];
      this.editingProductImages.push(dataUrl);
      this.renderEditProductImages();
      Cart.showToast(`📸 Photo "${file.name}" added to frame gallery!`);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  },

  removeEditPhoto(index) {
    if (!this.editingProductImages) return;
    if (this.editingProductImages.length <= 1) {
      if (!confirm('This is the only photo for this frame. Remove and reset to default?')) return;
      this.editingProductImages = ['/images/aviator-gold.svg'];
    } else {
      this.editingProductImages.splice(index, 1);
    }
    this.renderEditProductImages();
    Cart.showToast('Photo removed from gallery.');
  },

  setPrimaryEditPhoto(index) {
    if (!this.editingProductImages || !this.editingProductImages[index]) return;
    const item = this.editingProductImages.splice(index, 1)[0];
    this.editingProductImages.unshift(item);
    this.renderEditProductImages();
    Cart.showToast('⭐ Set as Primary front photo!');
  },

  // --- NEW PRODUCT PHOTOS ---
  renderNewProductImages() {
    const container = document.getElementById('new-prod-photos-container');
    const badge = document.getElementById('new-prod-photo-count-badge');
    if (!container) return;

    if (!this.newProductImages || !this.newProductImages.length) {
      this.newProductImages = ['/images/aviator-gold.svg'];
    }

    if (badge) {
      const len = this.newProductImages.length;
      badge.textContent = `${len} Photo${len > 1 ? 's' : ''}`;
    }

    container.innerHTML = this.newProductImages.map((src, idx) => {
      const isPrimary = idx === 0;
      return `
        <div class="photo-manager-chip ${isPrimary ? 'is-primary' : ''}">
          <img src="${src}" alt="Frame photo ${idx + 1}" onerror="this.src='/images/hero-eyewear.svg'">
          <span class="chip-badge">${isPrimary ? '★ Primary' : `#${idx + 1}`}</span>
          ${!isPrimary ? `
            <button type="button" class="chip-star-btn" onclick="App.setPrimaryNewPhoto(${idx})" title="Set as primary/front photo">★</button>
          ` : ''}
          <button type="button" class="chip-del-btn" onclick="App.removeNewPhoto(${idx})" title="Remove this photo">✕</button>
        </div>
      `;
    }).join('');
  },

  addPhotoFromPresetToNew() {
    const select = document.getElementById('new-add-photo-preset');
    if (!select || !select.value) return;
    this.newProductImages = this.newProductImages || [];
    this.newProductImages.push(select.value);
    this.renderNewProductImages();
    Cart.showToast(`📸 Added "${select.options[select.selectedIndex].text}" to new frame gallery!`);
  },

  addCustomUrlPhotoToNew() {
    const input = document.getElementById('new-add-custom-photo-url');
    const val = input?.value?.trim();
    if (!val) {
      alert('Please enter or paste an image URL.');
      return;
    }
    this.newProductImages = this.newProductImages || [];
    this.newProductImages.push(val);
    input.value = '';
    this.renderNewProductImages();
    Cart.showToast('📸 Added custom image URL to new frame gallery!');
  },

  handleNewMultiFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.newProductImages = this.newProductImages || [];
      this.newProductImages.push(dataUrl);
      this.renderNewProductImages();
      Cart.showToast(`📸 Photo "${file.name}" added to new frame gallery!`);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  },

  removeNewPhoto(index) {
    if (!this.newProductImages) return;
    if (this.newProductImages.length <= 1) {
      if (!confirm('This is the only photo for this frame. Remove and reset to default?')) return;
      this.newProductImages = ['/images/aviator-gold.svg'];
    } else {
      this.newProductImages.splice(index, 1);
    }
    this.renderNewProductImages();
    Cart.showToast('Photo removed.');
  },

  setPrimaryNewPhoto(index) {
    if (!this.newProductImages || !this.newProductImages[index]) return;
    const item = this.newProductImages.splice(index, 1)[0];
    this.newProductImages.unshift(item);
    this.renderNewProductImages();
    Cart.showToast('⭐ Set as Primary front photo!');
  },

  async handleCreateProduct(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const imagesToSave = (this.newProductImages && this.newProductImages.length) ? this.newProductImages : ['/images/aviator-gold.svg'];

    const payload = {
      name: form.name.value,
      badge: form.badge.value,
      category: form.category.value,
      shape: form.shape.value,
      gender: form.gender.value,
      price: Number(form.price.value),
      originalPrice: form.originalPrice.value ? Number(form.originalPrice.value) : null,
      material: form.material.value || 'Handcrafted Italian Acetate',
      description: form.description.value,
      inStock: form.inStock.checked,
      images: imagesToSave
    };

    try {
      const res = await this.authFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(`✨ Frame "${payload.name}" published with ${imagesToSave.length} photo(s)!`);
        form.reset();
        this.newProductImages = ['/images/aviator-gold.svg'];
        this.renderNewProductImages();
        await this.refreshAdminInventory();
        await this.refreshAdminStats();
        this.switchAdminTab('inventory');
      } else {
        alert(data.message || 'Failed to create product.');
      }
    } catch(err) {
      alert('Error publishing product.');
    } finally {
      submitBtn.disabled = false;
    }
  },

  openEditProductModal(id) {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-product-id-label').textContent = `Product ID: ${prod.id}`;
    document.getElementById('edit-prod-name').value = prod.name;
    document.getElementById('edit-prod-price').value = prod.price;
    document.getElementById('edit-prod-original-price').value = prod.originalPrice || '';
    document.getElementById('edit-prod-badge').value = prod.badge || '';
    document.getElementById('edit-prod-stock').value = prod.inStock !== false ? 'true' : 'false';
    document.getElementById('edit-prod-desc').value = prod.description || '';

    // Initialize multi-photo array from product images
    this.editingProductImages = (prod.images && prod.images.length) ? [...prod.images] : ['/images/aviator-gold.svg'];
    this.renderEditProductImages();

    const modal = document.getElementById('edit-product-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeEditProductModal() {
    const modal = document.getElementById('edit-product-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  async handleUpdateProduct(e) {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const imagesToSave = (this.editingProductImages && this.editingProductImages.length) ? this.editingProductImages : ['/images/aviator-gold.svg'];

    const payload = {
      name: form.name.value,
      price: Number(form.price.value),
      originalPrice: form.originalPrice.value ? Number(form.originalPrice.value) : null,
      badge: form.badge.value,
      inStock: form.inStock.value === 'true',
      description: form.description.value,
      images: imagesToSave
    };

    try {
      const res = await this.authFetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(`Updated "${payload.name}" with ${imagesToSave.length} photo(s) successfully!`);
        this.closeEditProductModal();
        await this.refreshAdminInventory();
        await this.refreshAdminStats();
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch(err) {
      alert('Error updating product.');
    } finally {
      submitBtn.disabled = false;
    }
  },

  async handleDeleteProduct(id) {
    const prod = this.products.find(p => p.id === id);
    if (!confirm(`Are you sure you want to permanently delete "${prod ? prod.name : id}" from your catalog?`)) {
      return;
    }

    try {
      const res = await this.authFetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        Cart.showToast('Frame deleted from store catalog.');
        await this.refreshAdminInventory();
        await this.refreshAdminStats();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch(e) {
      alert('Error deleting product.');
    }
  },

  handleDeleteFromEdit() {
    const id = document.getElementById('edit-prod-id')?.value;
    if (id) {
      this.closeEditProductModal();
      this.handleDeleteProduct(id);
    }
  },

  async refreshAdminOrders() {
    try {
      const res = await this.authFetch('/api/admin/orders');
      const data = await res.json();
      const orders = data.data || [];
      const tbody = document.getElementById('admin-orders-tbody');
      if (!tbody) return;

      // Play chime if new order arrived while Owner Suite is active
      if (this.lastKnownOrderCount > 0 && orders.length > this.lastKnownOrderCount && this.orderChimeEnabled) {
        this.playNewOrderChime();
        Cart.showToast('🔔 New Customer Order Received!');
      }
      this.lastKnownOrderCount = orders.length;

      if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#888;">No orders placed yet.</td></tr>';
        return;
      }

      tbody.innerHTML = orders.map(o => {
        const rxItem = (o.items || []).find(it => it.prescription && it.prescription.prescriptionImage);
        const hasRxImg = !!rxItem;
        const rxImgUrl = rxItem ? rxItem.prescription.prescriptionImage : '';

        return `
        <tr>
          <td>
            <strong style="font-size:13px;">#${o.orderId}</strong>
            ${o.courierTrackingNumber ? `<div style="font-size:10.5px; color:#2563eb; font-weight:700;">${o.courierName || 'TCS'}: ${o.courierTrackingNumber}</div>` : ''}
          </td>
          <td>
            <strong>${o.customer.fullName}</strong>
            <div style="font-size:11px; color:#666;">${o.customer.phone}</div>
            <div style="font-size:10.5px; color:#888;">${o.customer.address}</div>
          </td>
          <td>${o.customer.city}</td>
          <td><strong>Rs. ${o.totalAmount.toLocaleString()}</strong></td>
          <td>
            <span style="font-size:11px; font-weight:700; ${o.transactionId ? 'color:#854d0e; background:#fef3c7; padding:2px 6px; border-radius:4px; display:inline-block;' : ''}">
              ${o.paymentMethod || 'COD'}
            </span>
            ${o.transactionId ? `
              <div style="font-size:10.5px; font-family:monospace; color:#92400e; font-weight:800; margin-top:3px; background:#fff; padding:2px 4px; border:1px solid #fde047; border-radius:4px;">
                TID: ${o.transactionId}
              </div>
            ` : ''}
          </td>
          <td>
            <span style="background:#f0fdf4; color:#166534; font-size:11px; font-weight:800; padding:3px 8px; border-radius:99px;">
              ${o.status}
            </span>
          </td>
          <td>
            <select class="form-input" style="padding:4px 8px; font-size:11.5px; width:100%;" onchange="App.handleUpdateOrderStatus('${o.orderId}', this.value)">
              <option value="Confirmed & Packing" ${o.status === 'Confirmed & Packing' ? 'selected' : ''}>Confirmed & Packing</option>
              <option value="Lenses Cut in Lab" ${o.status === 'Lenses Cut in Lab' ? 'selected' : ''}>Lenses Cut in Lab</option>
              <option value="16-pt QC Inspection Passed" ${o.status === '16-pt QC Inspection Passed' ? 'selected' : ''}>16-pt QC Inspection Passed</option>
              <option value="Dispatched with Courier TCS" ${o.status === 'Dispatched with Courier TCS' ? 'selected' : ''}>Dispatched with Courier TCS</option>
              <option value="Delivered & Verified" ${o.status === 'Delivered & Verified' ? 'selected' : ''}>Delivered & Verified</option>
            </select>
            <div style="display:flex; gap:4px; margin-top:6px;">
              <button class="action-btn-mini" onclick="App.printOrderInvoice('${o.orderId}')" style="font-size:10.5px; padding:3px 8px; font-weight:700; background:#f1f5f9; border:1px solid #cbd5e1; flex:1;" title="Print Packing Slip & Invoice">
                🖨️ Packing Slip
              </button>
              ${hasRxImg ? `
                <button class="action-btn-mini" onclick="App.viewPrescriptionImage('${rxImgUrl}')" style="font-size:10.5px; padding:3px 8px; font-weight:700; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; flex:1;" title="View Customer Rx Slip">
                  📄 View Rx
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
      }).join('');
    } catch(e) {}
  },

  async handleUpdateOrderStatus(orderId, status) {
    try {
      let courierTrackingNumber = undefined;
      let courierName = undefined;

      if (status.includes('Dispatched') || status.includes('Courier')) {
        const inputTrack = prompt(`Enter Courier Tracking Number (e.g. TCS-99881122 or Trax ID) for order #${orderId} (leave empty to skip):`, '');
        if (inputTrack !== null && inputTrack.trim()) {
          courierTrackingNumber = inputTrack.trim();
          courierName = "TCS Express";
        }
      }

      const res = await this.authFetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, courierName, courierTrackingNumber })
      });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(`Order #${orderId} updated to: ${status}`);
        await this.refreshAdminOrders();
      }
    } catch(e) {
      alert('Error updating order fulfillment status.');
    }
  },

  // ==========================================
  // PRINTABLE INVOICE & COURIER PACKING SLIP
  // ==========================================
  async printOrderInvoice(orderId) {
    if (!orderId) return;
    const cleanId = orderId.toString().replace('#', '').trim();
    try {
      const res = await this.authFetch(`/api/orders/${cleanId}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        alert('Could not find order details for invoice.');
        return;
      }
      const order = data.data;
      const invoiceEl = document.getElementById('printable-invoice-content');
      if (!invoiceEl) return;

      const orderDate = new Date(order.createdAt).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const isCOD = (order.paymentMethod || '').toLowerCase().includes('cash');

      invoiceEl.innerHTML = `
        <div style="border-bottom:2px solid #0f172a; padding-bottom:14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-family:var(--font-display, serif); font-size:22px; font-weight:900; letter-spacing:0.5px; color:#0f172a;">FABOPTIC CO.</div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#475569; font-weight:700;">Luxury Eyewear Atelier & Precision Optical Lab</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Lahore, Pakistan • WhatsApp: +92 324 1383370 • rdanial795@gmail.com</div>
          </div>
          <div style="text-align:right;">
            <div style="background:#0f172a; color:#fff; font-size:11px; font-weight:900; padding:4px 10px; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px; display:inline-block;">
              Official Packing Slip & Invoice
            </div>
            <div style="font-size:15px; font-weight:900; margin-top:6px; color:#0f172a;">#${order.orderId}</div>
            <div style="font-size:11px; color:#64748b;">Date: ${orderDate}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:16px; margin-bottom:16px;">
          <!-- Consignee Details -->
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:800; color:#475569; margin-bottom:4px;">SHIP TO / CONSIGNEE</div>
            <div style="font-size:14px; font-weight:900; color:#0f172a;">${order.customer.fullName}</div>
            <div style="font-size:13px; font-weight:800; color:#2563eb; margin:2px 0;">📞 ${order.customer.phone}</div>
            <div style="font-size:12px; color:#334155; line-height:1.4;">${order.customer.address}</div>
            <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">📍 ${order.customer.city}, Pakistan</div>
          </div>

          <!-- Carrier & Payment Pill -->
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="background:${isCOD ? '#fef2f2' : '#f0fdf4'}; border:1.5px solid ${isCOD ? '#f87171' : '#86efac'}; border-radius:8px; padding:10px 12px; text-align:center;">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:800; color:${isCOD ? '#991b1b' : '#166534'};">
                ${isCOD ? 'CASH ON DELIVERY (COLLECT FROM CUSTOMER)' : 'PAYMENT PREPAID (' + (order.paymentMethod || 'ONLINE') + ')'}
              </div>
              <div style="font-size:22px; font-weight:900; color:${isCOD ? '#dc2626' : '#15803d'}; font-family:var(--font-display, sans-serif); margin-top:2px;">
                Rs. ${order.totalAmount.toLocaleString()}
              </div>
              ${order.transactionId ? `<div style="font-size:11px; font-family:monospace; color:#854d0e; font-weight:800; margin-top:2px;">TID: ${order.transactionId}</div>` : ''}
            </div>

            <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:11.5px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="color:#64748b;">Carrier:</span>
                <strong style="color:#0f172a; margin-left:4px;">${order.courierName || 'TCS Express'}</strong>
              </div>
              ${order.courierTrackingNumber ? `<div><span style="color:#64748b;">Tracking:</span> <strong style="font-family:monospace; color:#2563eb;">${order.courierTrackingNumber}</strong></div>` : ''}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:12px;">
          <thead>
            <tr style="background:#f1f5f9; border-top:1px solid #cbd5e1; border-bottom:2px solid #94a3b8; text-align:left;">
              <th style="padding:8px 10px; font-weight:800;">#</th>
              <th style="padding:8px 10px; font-weight:800;">Frame & Optics Description</th>
              <th style="padding:8px 10px; font-weight:800; text-align:center;">Qty</th>
              <th style="padding:8px 10px; font-weight:800; text-align:right;">Unit Price</th>
              <th style="padding:8px 10px; font-weight:800; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((it, idx) => `
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:8px 10px; color:#64748b;">${idx + 1}</td>
                <td style="padding:8px 10px;">
                  <strong style="color:#0f172a;">${it.name}</strong>
                  <div style="font-size:11px; color:#64748b;">Lens: ${it.lensName || 'Demo Lenses'} ${it.colorName ? `• Color: ${it.colorName}` : ''}</div>
                  ${it.prescription && it.prescription.note ? `<div style="font-size:10.5px; color:#0369a1;">Note: ${it.prescription.note}</div>` : ''}
                  ${it.prescription && it.prescription.right ? `<div style="font-size:10px; color:#475569; font-family:monospace;">R: SPH ${it.prescription.right.sph || '0'} CYL ${it.prescription.right.cyl || '0'} | L: SPH ${it.prescription.left.sph || '0'} CYL ${it.prescription.left.cyl || '0'} | PD: ${it.prescription.pd || 'N/A'}</div>` : ''}
                </td>
                <td style="padding:8px 10px; text-align:center;">${it.quantity || 1}</td>
                <td style="padding:8px 10px; text-align:right;">Rs. ${it.price.toLocaleString()}</td>
                <td style="padding:8px 10px; text-align:right; font-weight:800;">Rs. ${(it.price * (it.quantity || 1)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Calculation -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
          <div style="width:260px; display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Subtotal:</span>
              <strong style="color:#0f172a;">Rs. ${order.subtotal ? order.subtotal.toLocaleString() : order.totalAmount.toLocaleString()}</strong>
            </div>
            ${order.discount ? `
              <div style="display:flex; justify-content:space-between; color:#16a34a;">
                <span>Discount / Promo:</span>
                <strong>- Rs. ${order.discount.toLocaleString()}</strong>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Shipping Fee:</span>
              <span>${order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}</span>
            </div>
            <div style="border-top:2px solid #0f172a; padding-top:6px; margin-top:2px; display:flex; justify-content:space-between; font-size:14px; font-weight:900; color:#0f172a;">
              <span>Total Payable:</span>
              <span>Rs. ${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Optical Guarantee Disclaimer -->
        <div style="background:#f8fafc; border-top:1px dashed #cbd5e1; padding:12px 14px; border-radius:6px; font-size:10.5px; color:#64748b; line-height:1.4;">
          <strong>FabOptic 7-Day Optical Guarantee:</strong> If lenses need power calibration or fit adjustment, exchange within 7 days. Inspect flyer seal upon delivery. For queries, WhatsApp 0324-1383370 or email rdanial795@gmail.com.
        </div>
      `;

      const modal = document.getElementById('invoice-modal');
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    } catch (e) {
      alert('Error generating packing slip invoice.');
    }
  },

  closeInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  // ==========================================
  // 1-CLICK EXPORT COURIER CSV (TCS / TRAX)
  // ==========================================
  async exportCourierCSV() {
    try {
      const res = await this.authFetch('/api/admin/orders');
      const data = await res.json();
      const orders = data.data || [];
      if (!orders.length) {
        alert('No orders available to export.');
        return;
      }

      const headers = [
        "Order ID",
        "Consignee Name",
        "Consignee Phone",
        "Delivery Address",
        "City",
        "COD Amount (PKR)",
        "Payment Mode",
        "Items Summary",
        "Courier",
        "Tracking Number",
        "Status",
        "Order Date"
      ];

      const rows = orders.map(o => {
        const itemsSummary = (o.items || []).map(i => `${i.name} (${i.lensName || 'Demo'}) x${i.quantity || 1}`).join('; ');
        const isCOD = (o.paymentMethod || '').toLowerCase().includes('cash');
        const codAmount = isCOD ? o.totalAmount : 0;
        const dateStr = new Date(o.createdAt).toISOString().slice(0, 10);

        return [
          o.orderId,
          `"${(o.customer.fullName || '').replace(/"/g, '""')}"`,
          `"${(o.customer.phone || '').replace(/"/g, '""')}"`,
          `"${(o.customer.address || '').replace(/"/g, '""')}"`,
          `"${(o.customer.city || '').replace(/"/g, '""')}"`,
          codAmount,
          `"${(o.paymentMethod || '').replace(/"/g, '""')}"`,
          `"${itemsSummary.replace(/"/g, '""')}"`,
          `"${(o.courierName || 'TCS Express').replace(/"/g, '""')}"`,
          `"${(o.courierTrackingNumber || '').replace(/"/g, '""')}"`,
          `"${(o.status || 'Confirmed & Packing').replace(/"/g, '""')}"`,
          dateStr
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FabOptic_Courier_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Cart.showToast('Courier CSV manifest exported for TCS/Trax!');
    } catch(e) {
      alert('Error exporting courier CSV.');
    }
  },

  // ==========================================
  // LIVE AUDIO CHIME (WEB AUDIO API)
  // ==========================================
  toggleOrderChime() {
    this.orderChimeEnabled = !this.orderChimeEnabled;
    const btn = document.getElementById('admin-chime-toggle-btn');
    if (btn) {
      btn.textContent = this.orderChimeEnabled ? '🔊 New Order Chime: ON' : '🔇 New Order Chime: OFF';
      btn.style.background = this.orderChimeEnabled ? '#fff' : '#f1f5f9';
      btn.style.color = this.orderChimeEnabled ? '#0f172a' : '#64748b';
    }
    if (this.orderChimeEnabled) {
      this.playNewOrderChime();
    }
  },

  playNewOrderChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First tone: A5 (880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.28);

      // Second tone: E6 (1320 Hz) chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.48);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.48);
    } catch(e) {}
  },

  // ==========================================
  // PROMO CODE & COUPON MANAGER
  // ==========================================
  async refreshAdminCoupons() {
    try {
      const res = await this.authFetch('/api/admin/coupons');
      const data = await res.json();
      const coupons = data.data || [];
      const listEl = document.getElementById('admin-coupons-list');
      if (!listEl) return;

      if (!coupons.length) {
        listEl.innerHTML = '<div style="color:#64748b; font-size:12px; padding:12px; text-align:center;">No promo codes configured yet.</div>';
        return;
      }

      listEl.innerHTML = coupons.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-family:monospace; font-size:13px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px;">${c.code}</span>
              <strong style="font-size:12px; color:#166534;">
                ${c.discountPercent ? `${c.discountPercent}% OFF` : `Rs. ${c.flatDiscount} OFF`}
              </strong>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">
              ${c.description || 'General store promo'} ${c.minSpend ? `• Min Spend: Rs. ${c.minSpend}` : ''}
            </div>
          </div>
          <button class="action-btn-mini danger" onclick="App.handleDeleteCoupon('${c.code}')" style="padding:4px 10px; font-size:11px;">
            Delete
          </button>
        </div>
      `).join('');
    } catch(e) {}
  },

  async handleCreateCoupon(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      code: form.code.value,
      discountPercent: form.discountPercent.value ? Number(form.discountPercent.value) : undefined,
      flatDiscount: form.flatDiscount.value ? Number(form.flatDiscount.value) : undefined,
      minSpend: form.minSpend.value ? Number(form.minSpend.value) : 0,
      description: form.description.value
    };

    try {
      const res = await this.authFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(`Coupon ${payload.code.toUpperCase()} created successfully!`);
        form.reset();
        await this.refreshAdminCoupons();
      } else {
        alert(data.message || 'Failed to create coupon');
      }
    } catch(err) {
      alert('Error creating coupon.');
    }
  },

  async handleDeleteCoupon(code) {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      const res = await this.authFetch(`/api/admin/coupons/${code}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(`Coupon ${code} deleted.`);
        await this.refreshAdminCoupons();
      } else {
        alert(data.message || 'Failed to delete coupon');
      }
    } catch(e) {
      alert('Error deleting coupon.');
    }
  },
});
