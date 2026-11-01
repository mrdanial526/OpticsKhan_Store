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

  // Prescription slip upload, recently viewed, and live order chime state
  uploadedPrescriptionBase64: null,
  recentlyViewed: [],
  orderChimeEnabled: true,
  lastKnownOrderCount: 0,
  orderPollTimer: null,

  getAuthToken() {
    try {
      return localStorage.getItem('faboptic_token') || null;
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
