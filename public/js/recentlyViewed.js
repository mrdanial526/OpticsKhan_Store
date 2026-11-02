// Recently viewed products
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

  // ==========================================
  // RECENTLY VIEWED FRAMES
  // ==========================================
  getRecentlyViewedKey() {
    return this.getStorageKey ? this.getStorageKey('opticskhan_recently_viewed') : 'opticskhan_recently_viewed';
  },

  loadRecentlyViewed() {
    try {
      const key = this.getRecentlyViewedKey();
      const saved = localStorage.getItem(key) || (key.endsWith('_guest') ? localStorage.getItem('opticskhan_recently_viewed') : null);
      this.recentlyViewed = saved ? JSON.parse(saved) : [];
    } catch(e) {
      this.recentlyViewed = [];
    }
  },

  saveRecentlyViewed() {
    localStorage.setItem(this.getRecentlyViewedKey(), JSON.stringify(this.recentlyViewed));
  },

  addToRecentlyViewed(productId) {
    if (!productId) return;
    this.recentlyViewed = [productId, ...this.recentlyViewed.filter(id => id !== productId)].slice(0, 8);
    this.saveRecentlyViewed();
    this.renderRecentlyViewed();
  },

  clearRecentlyViewed() {
    this.recentlyViewed = [];
    this.saveRecentlyViewed();
    this.renderRecentlyViewed();
  },

  renderRecentlyViewed() {
    const section = document.getElementById('recently-viewed-section');
    const container = document.getElementById('recently-viewed-grid');
    if (!section || !container) return;

    if (!this.recentlyViewed.length) {
      section.style.display = 'none';
      return;
    }

    const recentProducts = this.recentlyViewed
      .map(id => this.products.find(p => p.id === id))
      .filter(Boolean);

    if (!recentProducts.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = recentProducts.map(p => {
      const img = (p.images && p.images[0]) || '/images/hero-eyewear.svg';
      const inStock = p.inStock !== false;
      return `
        <div class="recently-viewed-card" style="min-width:210px; max-width:210px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; cursor:pointer;" onclick="App.openLensCustomizer('${p.id}')">
          <img src="${img}" alt="${p.name}" style="width:100%; height:110px; object-fit:contain; background:#f8fafc; border-radius:8px; padding:6px;">
          <div>
            <span style="font-size:10.5px; text-transform:uppercase; color:#64748b; font-weight:700;">${p.shape}</span>
            <h4 style="font-size:13px; font-weight:800; margin:2px 0; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h4>
            <div style="font-size:13px; font-weight:900; color:#000;">Rs. ${p.price.toLocaleString()}</div>
          </div>
          <button class="action-btn-mini" style="width:100%; padding:6px; font-size:11px; font-weight:700; background:#0f172a; color:#fff;" onclick="event.stopPropagation(); App.openLensCustomizer('${p.id}')">
            ${inStock ? 'Select Lenses' : 'Out of Stock'}
          </button>
        </div>
      `;
    }).join('');
  }
});
