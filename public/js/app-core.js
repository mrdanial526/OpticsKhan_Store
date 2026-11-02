// Main Storefront Controller for OpticsKhan.
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

  // Prescription slip upload, recently viewed, and live order chime state
  uploadedPrescriptionBase64: null,
  recentlyViewed: [],
  orderChimeEnabled: true,
  lastKnownOrderCount: 0,
  orderPollTimer: null,

  getUserScope() {
    return this.currentUser ? (this.currentUser.id || this.currentUser.email || 'user') : 'guest';
  },

  getStorageKey(prefix) {
    return `${prefix}_${this.getUserScope()}`;
  },

  getAuthToken() {
    try {
      return localStorage.getItem('opticskhan_token') || null;
    } catch {
      return null;
    }
  },

  authHeaders(extraHeaders = {}) {
    const token = this.getAuthToken();
    return {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...extraHeaders,
    };
  },

  async authFetch(url, options = {}) {
    const headers = this.authHeaders(options.headers || {});
    return fetch(url, { ...options, headers });
  },

  showPromptDialog({
    title = 'Prompt',
    message = '',
    placeholder = '',
    initialValue = '',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    allowEmpty = false,
    inputType = 'text',
    multiline = false,
  } = {}) {
    return new Promise((resolve) => {
      const existing = document.getElementById('app-prompt-modal');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'app-prompt-modal';
      overlay.className = 'custom-prompt-overlay';

      const card = document.createElement('div');
      card.className = 'custom-prompt-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');

      const header = document.createElement('div');
      header.className = 'custom-prompt-header';

      const heading = document.createElement('h3');
      heading.className = 'custom-prompt-title';
      heading.textContent = title;

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'custom-prompt-close';
      closeBtn.setAttribute('aria-label', 'Close prompt');
      closeBtn.textContent = '×';

      header.appendChild(heading);
      header.appendChild(closeBtn);

      const body = document.createElement('div');
      body.className = 'custom-prompt-body';

      if (message) {
        const msg = document.createElement('p');
        msg.className = 'custom-prompt-message';
        msg.textContent = message;
        body.appendChild(msg);
      }

      const input = document.createElement(multiline ? 'textarea' : 'input');
      input.className = 'custom-prompt-input';
      input.type = multiline ? '' : inputType;
      input.placeholder = placeholder;
      input.value = initialValue;
      if (multiline) {
        input.rows = 4;
      }

      body.appendChild(input);

      const footer = document.createElement('div');
      footer.className = 'custom-prompt-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'custom-prompt-btn custom-prompt-btn-secondary';
      cancelBtn.textContent = cancelLabel;

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'custom-prompt-btn custom-prompt-btn-primary';
      confirmBtn.textContent = confirmLabel;

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const closePrompt = () => {
        overlay.remove();
        resolve(null);
      };

      const submitPrompt = () => {
        const value = input.value;
        if (!allowEmpty && !String(value).trim()) {
          input.classList.add('has-error');
          input.focus();
          return;
        }
        overlay.remove();
        resolve(value);
      };

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closePrompt();
      });
      closeBtn.addEventListener('click', closePrompt);
      cancelBtn.addEventListener('click', closePrompt);
      confirmBtn.addEventListener('click', submitPrompt);

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !multiline) {
          event.preventDefault();
          submitPrompt();
        }
        if (event.key === 'Escape') {
          closePrompt();
        }
      });

      input.focus();
      if (input instanceof HTMLInputElement) {
        const end = input.value.length;
        input.setSelectionRange(end, end);
      }
    });
  },

  async init() {
    this.loadWishlist();
    this.loadCurrentUser();
    this.loadRecentlyViewed();
    await this.fetchInitialData();
    this.bindEvents();
    this.renderProducts();
    this.renderReviews();
    this.renderRecentlyViewed();
    this.updateAuthUI();
    this.renderNewProductImages();
  },
};

window.App = App;
