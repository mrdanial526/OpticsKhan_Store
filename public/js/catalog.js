// Catalog: data fetching, filters, product grid, card photo slider
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

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
});
