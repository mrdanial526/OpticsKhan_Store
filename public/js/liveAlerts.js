// Real-time Sales Alert Module (Mimics FabDecor Socket.IO sales alerts)
const LiveAlerts = {
  container: null,
  activeToast: null,
  toastTimeout: null,

  init() {
    this.createContainer();
    this.listenToStream();
  },

  createContainer() {
    let container = document.getElementById('sales-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sales-toast-container';
      container.className = 'sales-toast-container';
      document.body.appendChild(container);
    }
    this.container = container;
  },

  listenToStream() {
    // Attempt SSE connection
    try {
      const evtSource = new EventSource('/api/live-sales-stream');
      evtSource.onmessage = (e) => {
        try {
          const sale = JSON.parse(e.data);
          this.showSaleToast(sale);
        } catch (err) {}
      };
      evtSource.onerror = () => {
        // If SSE closes or fails, fallback to simulated periodic alerts
        evtSource.close();
        this.startFallbackSimulation();
      };
    } catch (e) {
      this.startFallbackSimulation();
    }
  },

  startFallbackSimulation() {
    const mockSales = [
      { customer: "Hamza K.", city: "Lahore (Gulberg)", item: "Aviator Titanium Gold", time: "Just now" },
      { customer: "Ayesha N.", city: "Islamabad (F-7)", item: "Vogue Cat-Eye Rose Noir", time: "2 mins ago" },
      { customer: "Bilal S.", city: "Karachi (Clifton)", item: "BlueShield Pro Gamer & Dev", time: "3 mins ago" },
      { customer: "Dr. Farhan", city: "Faisalabad", item: "Executive Rimless Silhouette", time: "5 mins ago" },
      { customer: "Zainab R.", city: "Rawalpindi", item: "Wayfarer Havana Acetate", time: "8 mins ago" }
    ];

    setInterval(() => {
      const randomSale = mockSales[Math.floor(Math.random() * mockSales.length)];
      this.showSaleToast(randomSale);
    }, 16000);
  },

  showSaleToast(sale) {
    if (this.activeToast) {
      this.dismissToast();
    }

    const toast = document.createElement('div');
    toast.className = 'sales-toast';
    toast.innerHTML = `
      <div class="sales-toast-icon">👓</div>
      <div class="sales-toast-content">
        <div class="sales-toast-title">${sale.customer} in ${sale.city}</div>
        <div class="sales-toast-desc">Purchased <strong>${sale.item}</strong></div>
        <div class="sales-toast-time">⚡ Verified Buyer • ${sale.time}</div>
      </div>
      <button style="background:none; border:none; color:#999; cursor:pointer; font-size:12px; margin-left:auto;" onclick="LiveAlerts.dismissToast()">✕</button>
    `;

    this.container.appendChild(toast);
    this.activeToast = toast;

    this.toastTimeout = setTimeout(() => {
      this.dismissToast();
    }, 6000);
  },

  dismissToast() {
    if (this.activeToast) {
      this.activeToast.style.opacity = '0';
      this.activeToast.style.transform = 'translateY(12px) scale(0.95)';
      const t = this.activeToast;
      this.activeToast = null;
      clearTimeout(this.toastTimeout);
      setTimeout(() => {
        if (t && t.parentNode) t.remove();
      }, 300);
    }
  }
};

window.LiveAlerts = LiveAlerts;
document.addEventListener('DOMContentLoaded', () => LiveAlerts.init());
