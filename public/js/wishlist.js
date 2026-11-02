// Wishlist: persistence, badge, modal, move-to-cart
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

  getWishlistKey() {
    return this.getStorageKey ? this.getStorageKey('opticskhan_wishlist') : 'opticskhan_wishlist';
  },

  loadWishlist() {
    try {
      const key = this.getWishlistKey();
      const saved = localStorage.getItem(key) || (key.endsWith('_guest') ? localStorage.getItem('opticskhan_wishlist') : null);
      this.wishlist = saved ? JSON.parse(saved) : [];
      this.updateWishlistBadge();
    } catch (e) {
      this.wishlist = [];
    }
  },

  saveWishlist() {
    localStorage.setItem(this.getWishlistKey(), JSON.stringify(this.wishlist));
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

  openWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    const container = document.getElementById('wishlist-items-container');
    if (!modal || !container) return;

    if (!this.wishlist.length) {
      container.innerHTML = `
        <div style="text-align:center; padding:36px 16px; color:#64748b;">
          <div style="font-size:36px; margin-bottom:10px;">👓</div>
          <h4 style="font-size:15px; font-weight:800; color:#1e293b; margin:0 0 6px;">Your Wishlist is Empty</h4>
          <p style="font-size:12.5px; margin:0 0 16px;">Click the heart icon on any frame in our atelier to save it here for later.</p>
          <button class="primary-btn" onclick="App.closeWishlistModal()" style="padding:8px 20px; font-size:12px;">Explore Frames</button>
        </div>
      `;
    } else {
      const wishlistedProducts = this.products.filter(p => this.wishlist.includes(p.id));
      container.innerHTML = wishlistedProducts.map(p => {
        const img = (p.images && p.images[0]) || '/images/hero-eyewear.svg';
        const inStock = p.inStock !== false;
        return `
          <div class="wishlist-item-card" style="display:flex; align-items:center; gap:14px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px;">
            <img src="${img}" alt="${p.name}" style="width:70px; height:45px; object-fit:contain; background:#f8fafc; border-radius:6px; padding:4px;">
            <div style="flex:1;">
              <h4 style="font-size:13.5px; font-weight:800; margin:0 0 2px; color:#0f172a;">${p.name}</h4>
              <div style="font-size:11.5px; color:#64748b;">${p.shape} • ${p.material}</div>
              <div style="font-size:13px; font-weight:900; color:#000; margin-top:2px;">Rs. ${p.price.toLocaleString()}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <button class="primary-btn" onclick="App.moveWishlistToCart('${p.id}')" style="padding:6px 12px; font-size:11.5px; font-weight:700;">
                + Add to Cart
              </button>
              <button class="action-btn-mini danger" onclick="App.removeFromWishlist('${p.id}')" style="padding:4px 8px; font-size:11px;">
                Remove
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  moveWishlistToCart(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;
    Cart.addItem(prod);
    this.toggleWishlist(productId);
    this.openWishlistModal();
  },

  removeFromWishlist(productId) {
    this.toggleWishlist(productId);
    this.openWishlistModal();
  },
});
