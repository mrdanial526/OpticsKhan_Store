// Main Storefront Controller for FabOptic Co.
const App = {
  products: [],
  categories: [],
  lensOptions: [],
  reviews: [],
  wishlist: [],
  currentUser: null,
  
  activeFilter: 'all',
  activeGender: 'all',
  activeShape: 'all',
  activeSort: 'popular',
  searchQuery: '',

  selectedProductForCustomization: null,
  selectedLensOption: null,
  selectedColorIndex: 0,
  selectedFrameSize: 'Medium',

  // Multi-photo swapping & photo management state
  cardImageIndices: {},
  customizerPhotoIndex: 0,
  editingProductImages: [],
  newProductImages: ['/images/aviator-gold.svg'],

  async init() {
    this.loadWishlist();
    this.loadCurrentUser();
    await this.fetchInitialData();
    this.bindEvents();
    this.renderProducts();
    this.renderReviews();
    this.updateAuthUI();
    this.renderNewProductImages();
  },

  loadWishlist() {
    try {
      const saved = localStorage.getItem('faboptic_wishlist');
      this.wishlist = saved ? JSON.parse(saved) : [];
      this.updateWishlistBadge();
    } catch (e) {
      this.wishlist = [];
    }
  },

  saveWishlist() {
    localStorage.setItem('faboptic_wishlist', JSON.stringify(this.wishlist));
    this.updateWishlistBadge();
  },

  updateWishlistBadge() {
    const badge = document.querySelector('.wishlist-count-badge');
    if (badge) {
      badge.textContent = this.wishlist.length;
      badge.style.display = this.wishlist.length > 0 ? 'flex' : 'none';
    }
  },

  toggleWishlist(productId) {
    const idx = this.wishlist.indexOf(productId);
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
    } else {
      this.wishlist.push(productId);
      Cart.showToast("Saved to your optical wishlist!");
    }
    this.saveWishlist();
    this.renderProducts();
  },

  async fetchInitialData() {
    try {
      const [prodRes, catRes, lensRes, revRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/lens-options'),
        fetch('/api/reviews')
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const lensData = await lensRes.json();
      const revData = await revRes.json();

      this.products = prodData.data || [];
      this.categories = catData.data || [];
      this.lensOptions = lensData.data || [];
      this.reviews = revData.data || [];
    } catch (err) {
      console.error("Failed to load store data:", err);
    }
  },

  async fetchFilteredProducts() {
    const params = new URLSearchParams();
    if (this.activeFilter !== 'all') params.append('category', this.activeFilter);
    if (this.activeGender !== 'all') params.append('gender', this.activeGender);
    if (this.activeShape !== 'all') params.append('shape', this.activeShape);
    if (this.activeSort) params.append('sort', this.activeSort);
    if (this.searchQuery) params.append('search', this.searchQuery);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      this.products = data.data || [];
      this.renderProducts();
    } catch (e) {
      console.error("Error fetching filtered products:", e);
    }
  },

  renderProducts() {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('product-count-display');
    if (!grid) return;

    if (countEl) {
      countEl.textContent = `Showing ${this.products.length} Eyewear Frames`;
    }

    if (this.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <h3 style="font-family: var(--font-display); font-size: 1.5rem; text-transform: uppercase;">No optical frames found</h3>
          <p style="color: var(--color-gray-500); margin-top: 8px;">Try clearing filters or search terms.</p>
          <button class="primary-btn" style="margin-top: 16px;" onclick="App.resetFilters()">View All Eyewear</button>
        </div>
      `;
      return;
    }

    this.cardImageIndices = this.cardImageIndices || {};
    grid.innerHTML = this.products.map(p => {
      const isWishlisted = this.wishlist.includes(p.id);
      const activeColor = p.colors && p.colors[0] ? p.colors[0] : { name: "Classic", hex: "#111" };
      const imagesList = (p.images && p.images.length) ? p.images : ['/images/hero-eyewear.svg'];
      const activeImgIdx = this.cardImageIndices[p.id] !== undefined ? this.cardImageIndices[p.id] : 0;
      const currentImg = imagesList[activeImgIdx] || imagesList[0];
      const hasMultiplePhotos = imagesList.length > 1;
      const inStock = p.inStock !== false;

      return `
        <div class="product-card ${!inStock ? 'out-of-stock' : ''}" id="card-${p.id}">
          <div class="card-img-wrapper" onclick="${inStock ? `App.openLensCustomizer('${p.id}')` : `Cart.showToast('This frame is currently out of stock or reserved')`}">
            <span class="card-badge">${!inStock ? 'OUT OF STOCK' : (p.badge || 'LUXE')}</span>
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                    onclick="event.stopPropagation(); App.toggleWishlist('${p.id}')" 
                    title="Add to wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="${isWishlisted ? '#ef4444' : '#111'}" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            <!-- Multi-photo Navigation Arrows (Only shown when multiple photos exist) -->
            ${hasMultiplePhotos ? `
              <button type="button" class="card-img-nav prev" onclick="event.stopPropagation(); App.slideCardImage('${p.id}', -1)" title="Previous photo" aria-label="Previous photo">‹</button>
              <button type="button" class="card-img-nav next" onclick="event.stopPropagation(); App.slideCardImage('${p.id}', 1)" title="Next photo" aria-label="Next photo">›</button>
              <div class="card-img-dots" id="dots-${p.id}">
                ${imagesList.map((_, i) => `
                  <span class="card-img-dot ${i === activeImgIdx ? 'active' : ''}" 
                        onclick="event.stopPropagation(); App.setCardImage('${p.id}', ${i})"
                        title="Photo ${i + 1} of ${imagesList.length}"></span>
                `).join('')}
              </div>
              <span class="card-img-counter" id="counter-${p.id}">${activeImgIdx + 1}/${imagesList.length}</span>
            ` : ''}

            <img src="${currentImg}" alt="${p.name}" id="img-${p.id}" style="transition:opacity 0.18s ease;">
          </div>

          <div class="card-info">
            <span class="card-category">${p.shape} • ${p.material.split(' ')[0]}</span>
            <h3 class="card-title">${p.name}</h3>

            <!-- Color Swatches -->
            <div class="card-color-swatches">
              ${(p.colors || []).map((c, idx) => `
                <span class="color-swatch-dot ${idx === 0 ? 'active' : ''}" 
                      style="background: ${c.bg || c.hex};" 
                      title="${c.name}"
                      onclick="App.changeProductCardColor('${p.id}', ${idx})"></span>
              `).join('')}
              <span style="font-size: 10px; color: var(--color-gray-500); margin-left: 4px;">${p.colors ? p.colors.length : 1} colors</span>
            </div>

            <!-- Rating -->
            <div class="card-rating">
              <span class="star-icon">★</span>
              <span>${p.rating}</span>
              <span class="rating-count">(${p.reviewsCount} reviews)</span>
            </div>

            <!-- Price -->
            <div class="card-price-row">
              <span class="price-current">Rs. ${p.price.toLocaleString()}</span>
              ${p.originalPrice ? `<span class="price-original">Rs. ${p.originalPrice.toLocaleString()}</span>` : ''}
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button class="customize-lens-btn" onclick="${inStock ? `App.openLensCustomizer('${p.id}')` : `Cart.showToast('This frame is out of stock')`}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>${inStock ? 'Select Lenses' : 'Out of Stock'}</span>
              </button>
              <button class="quick-add-btn" onclick="${inStock ? `App.quickAddToCart('${p.id}')` : `Cart.showToast('This frame is out of stock')`}" title="${inStock ? 'Quick Add Demo Frame' : 'Out of Stock'}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  slideCardImage(productId, step) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod || !prod.images || prod.images.length <= 1) return;
    this.cardImageIndices = this.cardImageIndices || {};
    const total = prod.images.length;
    let curr = this.cardImageIndices[productId] || 0;
    curr = (curr + step + total) % total;
    this.cardImageIndices[productId] = curr;
    this.updateCardImageDisplay(productId, prod);
  },

  setCardImage(productId, index) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod || !prod.images || !prod.images[index]) return;
    this.cardImageIndices = this.cardImageIndices || {};
    this.cardImageIndices[productId] = index;
    this.updateCardImageDisplay(productId, prod);
  },

  updateCardImageDisplay(productId, prod) {
    if (!prod) prod = this.products.find(p => p.id === productId);
    if (!prod || !prod.images) return;
    const curr = (this.cardImageIndices && this.cardImageIndices[productId]) || 0;
    const newSrc = prod.images[curr] || prod.images[0];
    const imgEl = document.getElementById(`img-${productId}`);
    if (imgEl) {
      imgEl.style.opacity = '0.35';
      setTimeout(() => {
        imgEl.src = newSrc;
        imgEl.style.opacity = '1';
      }, 100);
    }
    const dotsContainer = document.getElementById(`dots-${productId}`);
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.card-img-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === curr));
    }
    const counterEl = document.getElementById(`counter-${productId}`);
    if (counterEl) {
      counterEl.textContent = `${curr + 1}/${prod.images.length}`;
    }
  },

  changeProductCardColor(productId, colorIdx) {
    const card = document.getElementById(`card-${productId}`);
    if (!card) return;
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    // Toggle active dot
    const dots = card.querySelectorAll('.color-swatch-dot');
    dots.forEach((d, idx) => d.classList.toggle('active', idx === colorIdx));

    // Update image if available
    const imgEl = document.getElementById(`img-${productId}`);
    if (imgEl && prod.images && prod.images[colorIdx]) {
      imgEl.src = prod.images[colorIdx];
    }
  },

  quickAddToCart(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;
    Cart.addItem(prod, this.lensOptions[0], null, prod.colors ? prod.colors[0] : null);
  },

  resetFilters() {
    this.activeFilter = 'all';
    this.activeGender = 'all';
    this.activeShape = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === 'all');
    });

    this.fetchFilteredProducts();
  },

  // --- LENS CUSTOMIZER MODAL ---
  openLensCustomizer(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    this.selectedProductForCustomization = prod;
    this.selectedLensOption = this.lensOptions[0] || null;
    this.selectedColorIndex = 0;
    this.selectedFrameSize = 'Medium';
    this.customizerPhotoIndex = 0;

    const modal = document.getElementById('lens-customizer-modal');
    if (!modal) return;

    document.getElementById('customizer-product-name').textContent = prod.name;
    document.getElementById('customizer-frame-price').textContent = `Rs. ${prod.price.toLocaleString()}`;
    
    // Update photos & thumbnails
    this.updateCustomizerPhotoDisplay();

    // Render colors
    const colorContainer = document.getElementById('customizer-color-swatches');
    if (colorContainer) {
      colorContainer.innerHTML = (prod.colors || []).map((c, idx) => `
        <button type="button" class="color-swatch-btn ${idx === 0 ? 'active' : ''}" 
                onclick="App.selectCustomizerColor(${idx})" 
                style="display:flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; border:1px solid #ddd; background:#fff; cursor:pointer;">
          <span style="width:14px; height:14px; border-radius:50%; background:${c.bg || c.hex};"></span>
          <span style="font-size:12px; font-weight:600;">${c.name}</span>
        </button>
      `).join('');
    }

    // Render lens options
    const lensContainer = document.getElementById('customizer-lens-options');
    if (lensContainer) {
      lensContainer.innerHTML = this.lensOptions.map((opt, idx) => `
        <div class="lens-option-card ${idx === 0 ? 'selected' : ''}" 
             data-lens-id="${opt.id}" 
             onclick="App.selectLensOption('${opt.id}')">
          <div class="lens-option-details">
            <h4>${opt.name}</h4>
            <p>${opt.description}</p>
          </div>
          <div class="lens-option-price">${opt.price === 0 ? 'FREE' : `+ Rs. ${opt.price.toLocaleString()}`}</div>
        </div>
      `).join('');
    }

    this.updateCustomizerTotal();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  slideCustomizerImage(step) {
    const prod = this.selectedProductForCustomization;
    if (!prod || !prod.images || prod.images.length <= 1) return;
    const total = prod.images.length;
    this.customizerPhotoIndex = ((this.customizerPhotoIndex || 0) + step + total) % total;
    this.updateCustomizerPhotoDisplay();
  },

  setCustomizerImage(idx) {
    const prod = this.selectedProductForCustomization;
    if (!prod || !prod.images || !prod.images[idx]) return;
    this.customizerPhotoIndex = idx;
    this.updateCustomizerPhotoDisplay();
  },

  updateCustomizerPhotoDisplay() {
    const prod = this.selectedProductForCustomization;
    if (!prod) return;
    const imagesList = (prod.images && prod.images.length) ? prod.images : ['/images/hero-eyewear.svg'];
    const curr = this.customizerPhotoIndex || 0;
    const imgEl = document.getElementById('customizer-product-img');
    if (imgEl) {
      imgEl.src = imagesList[curr] || imagesList[0];
    }
    const prevBtn = document.getElementById('cust-img-prev-btn');
    const nextBtn = document.getElementById('cust-img-next-btn');
    const counter = document.getElementById('cust-img-counter');
    const strip = document.getElementById('customizer-thumbnails-strip');

    if (imagesList.length > 1) {
      if (prevBtn) prevBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
      if (counter) {
        counter.style.display = 'block';
        counter.textContent = `${curr + 1}/${imagesList.length}`;
      }
      if (strip) {
        strip.innerHTML = imagesList.map((src, i) => `
          <img src="${src}" class="cust-thumb ${i === curr ? 'active' : ''}" 
               onclick="App.setCustomizerImage(${i})" 
               title="View photo ${i + 1}" alt="Angle ${i + 1}">
        `).join('');
      }
    } else {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (counter) counter.style.display = 'none';
      if (strip) strip.innerHTML = '';
    }
  },

  closeLensCustomizer() {
    const modal = document.getElementById('lens-customizer-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  selectCustomizerColor(idx) {
    this.selectedColorIndex = idx;
    const prod = this.selectedProductForCustomization;
    if (!prod) return;

    document.querySelectorAll('.color-swatch-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
      btn.style.borderColor = i === idx ? '#000' : '#ddd';
      btn.style.boxShadow = i === idx ? '0 0 0 1px #000' : 'none';
    });

    if (prod.images && prod.images[idx]) {
      this.customizerPhotoIndex = idx;
      this.updateCustomizerPhotoDisplay();
    }
  },

  selectLensOption(lensId) {
    this.selectedLensOption = this.lensOptions.find(o => o.id === lensId);
    document.querySelectorAll('.lens-option-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.lensId === lensId);
    });

    // Show/hide prescription inputs if prescription is selected
    const rxContainer = document.getElementById('prescription-form-section');
    if (rxContainer) {
      const needsRx = ['single-vision', 'anti-glare-pro', 'photochromic'].includes(lensId);
      rxContainer.style.display = needsRx ? 'block' : 'none';
    }

    this.updateCustomizerTotal();
  },

  updateCustomizerTotal() {
    if (!this.selectedProductForCustomization) return;
    const framePrice = this.selectedProductForCustomization.price;
    const lensPrice = this.selectedLensOption ? this.selectedLensOption.price : 0;
    const total = framePrice + lensPrice;

    const totalEl = document.getElementById('customizer-total-price');
    if (totalEl) {
      totalEl.textContent = `Rs. ${total.toLocaleString()}`;
    }
  },

  addCustomizedToCart() {
    const prod = this.selectedProductForCustomization;
    if (!prod) return;

    const color = prod.colors ? prod.colors[this.selectedColorIndex] : null;

    // Grab prescription values if entered
    let prescription = null;
    const sphR = document.getElementById('rx-sph-r')?.value;
    const cylR = document.getElementById('rx-cyl-r')?.value;
    const axisR = document.getElementById('rx-axis-r')?.value;
    const pd = document.getElementById('rx-pd')?.value;
    const whatsappRxCheck = document.getElementById('rx-whatsapp-later')?.checked;

    if (whatsappRxCheck) {
      prescription = { note: "Customer will send doctor slip via WhatsApp" };
    } else if (sphR || cylR || pd) {
      prescription = {
        right: { sph: sphR, cyl: cylR, axis: axisR },
        left: {
          sph: document.getElementById('rx-sph-l')?.value,
          cyl: document.getElementById('rx-cyl-l')?.value,
          axis: document.getElementById('rx-axis-l')?.value
        },
        pd: pd
      };
    }

    Cart.addItem(prod, this.selectedLensOption, prescription, color);
    this.closeLensCustomizer();
  },

  // --- REVIEWS MODULE (Exact FabDecor Layout) ---
  renderReviews() {
    const track = document.getElementById('reviews-slider-track');
    if (!track) return;

    track.innerHTML = this.reviews.map(r => `
      <div class="review-card">
        <div class="review-stars">
          ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
        </div>
        <div class="review-author-row">
          <span class="review-author">${r.author}</span>
          ${r.verifiedBuyer ? '<span class="verified-badge" title="Verified Optical Buyer">✓</span>' : ''}
          <span style="font-size: 11px; color: var(--color-gray-500); margin-left: auto;">${r.city}</span>
        </div>
        <p class="review-text">"${r.comment}"</p>
        <div class="review-meta">
          <span>Frame: <strong>${r.productName || 'Optical Pair'}</strong></span>
          <span>${r.date}</span>
        </div>
      </div>
    `).join('');
  },

  slideReviews(dir) {
    const track = document.getElementById('reviews-slider-track');
    if (!track) return;
    track.scrollBy({ left: dir * 360, behavior: 'smooth' });
  },

  openWriteReviewModal() {
    const modal = document.getElementById('write-review-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeWriteReviewModal() {
    const modal = document.getElementById('write-review-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  async handleReviewSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const payload = {
      author: form.author.value,
      city: form.city.value,
      rating: Number(form.rating.value) || 5,
      productName: form.productName.value || "Optical Glasses",
      comment: form.comment.value
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        this.reviews.unshift(data.data);
        this.renderReviews();
        this.closeWriteReviewModal();
        Cart.showToast("Thank you! Your verified review has been published.");
        form.reset();
      } else {
        alert(data.message || "Failed to post review");
      }
    } catch (err) {
      alert("Error posting review.");
    } finally {
      submitBtn.disabled = false;
    }
  },

  // --- NEWSLETTER SUBSCRIPTION ---
  async handleNewsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const phone = form.phone ? form.phone.value : '';

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });
      const data = await res.json();
      if (data.success) {
        Cart.showToast("🎉 Subscribed! Use promo code FABOPTIC10 for 10% OFF!");
        form.reset();
      }
    } catch (err) {
      alert("Subscription failed.");
    }
  },

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
    ['lens-customizer-modal', 'write-review-modal', 'consultation-modal', 'order-tracking-modal', 'delivery-modal', 'auth-modal', 'customer-account-modal', 'admin-portal-modal', 'edit-product-modal'].forEach(modalId => {
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

          <!-- Visual 4-Step Optical Timeline -->
          <div>
            <span style="font-size:11px; font-weight:800; color:var(--color-gray-600); text-transform:uppercase;">Fulfillment Progress</span>
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-top:8px; text-align:center;">
              <div style="background:#16a34a; color:#fff; padding:6px 2px; border-radius:6px; font-size:10.5px; font-weight:700;">
                ✓ 1. Confirmed
              </div>
              <div style="background:#16a34a; color:#fff; padding:6px 2px; border-radius:6px; font-size:10.5px; font-weight:700;">
                ✓ 2. Lab Cut
              </div>
              <div style="background:#0284c7; color:#fff; padding:6px 2px; border-radius:6px; font-size:10.5px; font-weight:700;">
                ⚡ 3. QC Checked
              </div>
              <div style="background:var(--color-gray-200); color:var(--color-gray-600); padding:6px 2px; border-radius:6px; font-size:10.5px; font-weight:700;">
                4. Courier
              </div>
            </div>
          </div>

          <!-- Customer & Delivery Details -->
          <div style="font-size:12.5px; display:flex; flex-direction:column; gap:4px; border-top:1px dashed var(--color-gray-200); padding-top:10px;">
            <div><strong>Recipient:</strong> ${order.customer.fullName} (${order.customer.phone})</div>
            <div><strong>Delivery Destination:</strong> ${order.customer.address}, ${order.customer.city}</div>
            <div><strong>Estimated Courier Delivery:</strong> <strong>${order.estimatedDelivery || '2-3 Business Days via TCS'}</strong></div>
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

  // ==========================================
  // USER AUTHENTICATION & SESSIONS
  // ==========================================
  loadCurrentUser() {
    try {
      const saved = localStorage.getItem('faboptic_user');
      this.currentUser = saved ? JSON.parse(saved) : null;
    } catch(e) {
      this.currentUser = null;
    }
  },

  updateAuthUI() {
    const authBtn = document.getElementById('nav-auth-btn');
    const userLabel = document.getElementById('nav-user-label');
    const ownerBtn = document.getElementById('nav-owner-portal-btn');

    if (this.currentUser) {
      if (userLabel) {
        const firstName = (this.currentUser.fullName || 'VIP Member').split(' ')[0];
        userLabel.textContent = this.currentUser.role === 'admin' ? `👑 ${firstName}` : `👤 ${firstName}`;
        userLabel.style.display = 'inline';
      }
      // OWNER SUITE VISIBILITY: ONLY SHOWN IF AUTHENTICATED AS OWNER/ADMIN
      if (ownerBtn) {
        if (this.currentUser.role === 'admin') {
          ownerBtn.style.display = 'inline-flex';
          ownerBtn.style.background = '#d4af37';
          ownerBtn.style.color = '#111';
          ownerBtn.innerHTML = '<span>👑</span><span>Owner Suite (Active)</span>';
        } else {
          ownerBtn.style.display = 'none';
        }
      }

      const cartAuthNotice = document.getElementById('cart-auth-notice');
      if (cartAuthNotice) {
        const name = (this.currentUser.fullName || 'VIP Member').split(' ')[0];
        cartAuthNotice.innerHTML = `✓ Signed in as <strong>${name}</strong> — Ready for checkout`;
        cartAuthNotice.style.color = '#16a34a';
      }
    } else {
      if (userLabel) {
        userLabel.textContent = 'Sign In / Register';
        userLabel.style.display = 'inline';
      }
      
      // NOT LOGGED IN: HIDE OWNER SUITE BUTTON COMPLETELY
      if (ownerBtn) {
        ownerBtn.style.display = 'none';
      }

      const cartAuthNotice = document.getElementById('cart-auth-notice');
      if (cartAuthNotice) {
        cartAuthNotice.innerHTML = '🔒 Sign in or create an account required to checkout';
        cartAuthNotice.style.color = 'var(--color-gray-500)';
      }
    }
  },

  handleUserNavClick() {
    this.openAuthModal();
  },

  openAuthModal(defaultRole = 'customer') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.switchAuthTab('login');

    // Clear previous error/success notices and error states
    const loginErr = document.getElementById('login-error-box');
    const loginSuccess = document.getElementById('login-success-box');
    const regErr = document.getElementById('register-error-box');
    if (loginErr) loginErr.style.display = 'none';
    if (loginSuccess) loginSuccess.style.display = 'none';
    if (regErr) regErr.style.display = 'none';

    ['login-email', 'login-password', 'reg-name', 'reg-phone', 'reg-email', 'reg-password'].forEach(id => {
      document.getElementById(id)?.classList.remove('input-error');
    });

    if (defaultRole === 'admin') {
      this.fillOwnerDemoCredentials();
    }

    const banner = document.getElementById('auth-logged-in-banner');
    const userText = document.getElementById('auth-logged-in-user-text');
    if (banner && userText) {
      if (this.currentUser) {
        banner.style.display = 'flex';
        const roleLabel = this.currentUser.role === 'admin' ? '👑 Atelier Owner (Management)' : '👤 VIP Customer';
        userText.innerHTML = `${this.currentUser.fullName || 'User'} <span style="font-weight:normal; font-size:12px; color:#555;">(${this.currentUser.email || ''})</span> — <strong>${roleLabel}</strong>`;
      } else {
        banner.style.display = 'none';
      }
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabReg = document.getElementById('auth-tab-register');
    const title = document.getElementById('auth-modal-title');
    const loginErrorBox = document.getElementById('login-error-box');
    const regErrorBox = document.getElementById('register-error-box');
    const loginSuccessBox = document.getElementById('login-success-box');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'flex';
      if (regForm) regForm.style.display = 'none';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabReg) tabReg.classList.remove('active');
      if (title) title.textContent = 'Sign In to FabOptic';
      if (regErrorBox) regErrorBox.style.display = 'none';
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'flex';
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabReg) tabReg.classList.add('active');
      if (title) title.textContent = 'Create Customer Account';
      if (loginErrorBox) loginErrorBox.style.display = 'none';
      if (loginSuccessBox) loginSuccessBox.style.display = 'none';
    }
  },

  togglePasswordVisibility(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🙈';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  },

  fillOwnerDemoCredentials() {
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    if (emailEl) {
      emailEl.value = 'owner@faboptic.pk';
      emailEl.classList.remove('input-error');
    }
    if (passEl) {
      passEl.value = 'admin';
      passEl.classList.remove('input-error');
    }
    const loginErr = document.getElementById('login-error-box');
    if (loginErr) loginErr.style.display = 'none';
    Cart.showToast('👑 Owner credentials auto-filled! Click "Sign In" to enter Owner Suite.');
  },

  async handleLogin(e) {
    e.preventDefault();
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error-box');
    const successBox = document.getElementById('login-success-box');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const email = emailEl?.value?.trim() || '';
    const password = passEl?.value || '';

    if (errorBox) errorBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';
    if (emailEl) emailEl.classList.remove('input-error');
    if (passEl) passEl.classList.remove('input-error');

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Verifying...'; }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem('faboptic_user', JSON.stringify(data.user));
        this.updateAuthUI();
        this.closeAuthModal();

        // If user was heading to checkout, continue directly to checkout modal
        if (this.pendingCheckoutAfterAuth) {
          this.pendingCheckoutAfterAuth = false;
          Cart.showToast(`✅ Welcome back, ${data.user.fullName}! Continuing to checkout...`);
          setTimeout(() => Cart.openCheckoutModal(), 350);
          return;
        }

        if (data.user.role === 'admin') {
          Cart.showToast(`👑 Welcome Owner! Opening Management Suite...`);
          setTimeout(() => this.openAdminModal(), 400);
        } else {
          Cart.showToast(`Welcome back, ${data.user.fullName}!`);
        }
      } else {
        // Incorrect email or password: show popup toast and alert banner with shake animation
        const errMsg = data.message || 'Incorrect email or password. Please verify your credentials and try again.';
        if (errorBox) {
          const errText = document.getElementById('login-error-text');
          if (errText) errText.textContent = errMsg;
          errorBox.style.display = 'flex';
          errorBox.classList.remove('shake-animation');
          void errorBox.offsetWidth; // trigger reflow for css shake animation
          errorBox.classList.add('shake-animation');
        }
        if (emailEl) emailEl.classList.add('input-error');
        if (passEl) {
          passEl.classList.add('input-error');
          passEl.value = '';
          passEl.focus();
        }
        Cart.showToast(`❌ ${errMsg}`);
      }
    } catch(err) {
      if (errorBox) {
        const errText = document.getElementById('login-error-text');
        if (errText) errText.textContent = 'Network error connecting to login service. Please try again.';
        errorBox.style.display = 'flex';
      }
      Cart.showToast('❌ Network error connecting to login service.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In to Atelier'; }
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const nameEl = document.getElementById('reg-name');
    const phoneEl = document.getElementById('reg-phone');
    const emailEl = document.getElementById('reg-email');
    const passEl = document.getElementById('reg-password');
    const regErrorBox = document.getElementById('register-error-box');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const fullName = nameEl?.value?.trim() || '';
    const phone = phoneEl?.value?.trim() || '';
    const email = emailEl?.value?.trim() || '';
    const password = passEl?.value || '';

    if (regErrorBox) regErrorBox.style.display = 'none';
    if (nameEl) nameEl.classList.remove('input-error');
    if (phoneEl) phoneEl.classList.remove('input-error');
    if (emailEl) emailEl.classList.remove('input-error');
    if (passEl) passEl.classList.remove('input-error');

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating Account...'; }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        // DO NOT log in automatically: user must manually log in
        // Reset registration input fields
        e.target.reset();

        // Push user to the Login tab
        this.switchAuthTab('login');

        // Pre-fill the login email so user doesn't have to retype it
        const loginEmail = document.getElementById('login-email');
        const loginPass = document.getElementById('login-password');
        if (loginEmail) {
          loginEmail.value = email;
          loginEmail.classList.remove('input-error');
        }
        if (loginPass) {
          loginPass.value = '';
          loginPass.classList.remove('input-error');
          setTimeout(() => loginPass.focus(), 200);
        }

        // Show "Account is created" banner above login form
        const successBox = document.getElementById('login-success-box');
        const successText = document.getElementById('login-success-text');
        if (successBox) {
          if (successText) {
            successText.textContent = `Account created for ${data.user.fullName}! Please enter your password to sign in manually.`;
          }
          successBox.style.display = 'flex';
          successBox.classList.remove('shake-animation');
          void successBox.offsetWidth;
          successBox.classList.add('shake-animation');
        }

        // Popup toast notification confirming account creation
        Cart.showToast(`🎉 Account is created! Please sign in with your password.`);
      } else {
        const errMsg = data.message || 'Registration failed. Please check your information.';
        if (regErrorBox) {
          const errText = document.getElementById('register-error-text');
          if (errText) errText.textContent = errMsg;
          regErrorBox.style.display = 'flex';
          regErrorBox.classList.remove('shake-animation');
          void regErrorBox.offsetWidth;
          regErrorBox.classList.add('shake-animation');
        }
        if (emailEl && (errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('already'))) {
          emailEl.classList.add('input-error');
          emailEl.focus();
        }
        Cart.showToast(`❌ ${errMsg}`);
      }
    } catch(err) {
      if (regErrorBox) {
        const errText = document.getElementById('register-error-text');
        if (errText) errText.textContent = 'Network error creating account. Please try again.';
        regErrorBox.style.display = 'flex';
      }
      Cart.showToast('❌ Network error creating account.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Customer Account'; }
    }
  },

  logoutUser() {
    this.currentUser = null;
    localStorage.removeItem('faboptic_user');
    this.updateAuthUI();
    this.closeCustomerModal();
    this.closeAdminModal();
    this.closeAuthModal();
    Cart.showToast('You have been signed out.');
  },

  // ==========================================
  // CUSTOMER PROFILE & ORDERS
  // ==========================================
  async openCustomerModal() {
    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }
    const modal = document.getElementById('customer-account-modal');
    if (!modal) return;

    document.getElementById('account-user-name').textContent = this.currentUser.fullName;
    document.getElementById('account-user-email').textContent = this.currentUser.email;
    document.getElementById('account-user-phone').textContent = `Phone: ${this.currentUser.phone || '0324-1383370'}`;

    const listEl = document.getElementById('customer-orders-list');
    if (listEl) {
      listEl.innerHTML = '<div style="text-align:center; padding:16px; color:#888;">Loading your past orders...</div>';
      try {
        const res = await fetch(`/api/auth/my-orders?email=${encodeURIComponent(this.currentUser.email)}`);
        const data = await res.json();
        const orders = data.data || [];

        if (orders.length === 0) {
          listEl.innerHTML = `
            <div style="text-align:center; padding:24px; background:var(--color-gray-50); border-radius:10px;">
              <span style="font-size:28px;">👓</span>
              <p style="margin-top:6px; font-size:13px; color:var(--color-gray-500);">You have not placed any optical orders yet.</p>
              <button class="primary-btn" style="margin-top:10px; padding:8px 16px; font-size:12px;" onclick="App.closeCustomerModal();">Explore Eyewear</button>
            </div>
          `;
        } else {
          listEl.innerHTML = orders.map(o => `
            <div style="background:#fff; border:1px solid var(--color-gray-200); border-radius:10px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:14px;">#${o.orderId}</strong>
                <span style="font-size:12px; color:var(--color-gray-500); margin-left:8px;">${new Date(o.createdAt).toLocaleDateString()}</span>
                <div style="font-size:12px; color:var(--color-gray-600); margin-top:3px;">
                  ${o.items.map(i => i.name).join(', ')} • Rs. ${o.totalAmount.toLocaleString()}
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#f0fdf4; color:#166534; font-size:11px; font-weight:700; padding:3px 8px; border-radius:99px;">${o.status}</span>
                <button class="action-btn-mini" onclick="App.closeCustomerModal(); App.openTrackingModal('${o.orderId}')">Track</button>
              </div>
            </div>
          `).join('');
        }
      } catch(e) {
        listEl.innerHTML = '<div style="color:red; text-align:center;">Failed to load order history.</div>';
      }
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeCustomerModal() {
    const modal = document.getElementById('customer-account-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

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

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeAdminModal() {
    const modal = document.getElementById('admin-portal-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  switchAdminTab(tabName) {
    ['inventory', 'add', 'orders'].forEach(t => {
      const tabEl = document.getElementById(`admin-tab-${t}`);
      const btnEl = document.getElementById(`admin-tab-${t}-btn`);
      if (tabEl) tabEl.style.display = t === tabName ? 'flex' : 'none';
      if (btnEl) btnEl.classList.toggle('active', t === tabName);
    });
  },

  async refreshAdminStats() {
    try {
      const res = await fetch('/api/admin/stats');
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
      const res = await fetch(`/api/products/${id}/stock`, { method: 'PATCH' });
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
      const res = await fetch('/api/products', {
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
      const res = await fetch(`/api/products/${id}`, {
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
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      const orders = data.data || [];
      const tbody = document.getElementById('admin-orders-tbody');
      if (!tbody) return;

      if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#888;">No orders placed yet.</td></tr>';
        return;
      }

      tbody.innerHTML = orders.map(o => `
        <tr>
          <td><strong style="font-size:13px;">#${o.orderId}</strong></td>
          <td>
            <strong>${o.customer.fullName}</strong>
            <div style="font-size:11px; color:#666;">${o.customer.phone}</div>
          </td>
          <td>${o.customer.city}</td>
          <td><strong>Rs. ${o.totalAmount.toLocaleString()}</strong></td>
          <td><span style="font-size:11px; font-weight:700;">${o.paymentMethod}</span></td>
          <td>
            <span style="background:#f0fdf4; color:#166534; font-size:11px; font-weight:800; padding:3px 8px; border-radius:99px;">
              ${o.status}
            </span>
          </td>
          <td>
            <select class="form-input" style="padding:4px 8px; font-size:11.5px;" onchange="App.handleUpdateOrderStatus('${o.orderId}', this.value)">
              <option value="Confirmed & Packing" ${o.status === 'Confirmed & Packing' ? 'selected' : ''}>Confirmed & Packing</option>
              <option value="Lenses Cut in Lab" ${o.status === 'Lenses Cut in Lab' ? 'selected' : ''}>Lenses Cut in Lab</option>
              <option value="16-pt QC Inspection Passed" ${o.status === '16-pt QC Inspection Passed' ? 'selected' : ''}>16-pt QC Inspection Passed</option>
              <option value="Dispatched with Courier TCS" ${o.status === 'Dispatched with Courier TCS' ? 'selected' : ''}>Dispatched with Courier TCS</option>
              <option value="Delivered & Verified" ${o.status === 'Delivered & Verified' ? 'selected' : ''}>Delivered & Verified</option>
            </select>
          </td>
        </tr>
      `).join('');
    } catch(e) {}
  },

  async handleUpdateOrderStatus(orderId, status) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        Cart.showToast(`Order #${orderId} status set to: ${status}`);
        await this.refreshAdminOrders();
      }
    } catch(e) {
      alert('Error updating order fulfillment status.');
    }
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
