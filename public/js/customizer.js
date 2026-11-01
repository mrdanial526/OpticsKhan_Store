// Lens customizer modal & prescription upload
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

  // --- LENS CUSTOMIZER MODAL ---
  openLensCustomizer(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    this.selectedProductForCustomization = prod;
    this.selectedLensOption = this.lensOptions[0] || null;
    this.selectedColorIndex = 0;
    this.selectedFrameSize = 'Medium';
    this.customizerPhotoIndex = 0;
    this.removePrescriptionFile();
    this.addToRecentlyViewed(productId);

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

    if (this.uploadedPrescriptionBase64) {
      prescription = {
        prescriptionImage: this.uploadedPrescriptionBase64,
        hasUploadedSlip: true,
        note: "Doctor prescription slip uploaded by customer"
      };
      if (sphR || cylR || pd) {
        prescription.right = { sph: sphR, cyl: cylR, axis: axisR };
        prescription.left = {
          sph: document.getElementById('rx-sph-l')?.value,
          cyl: document.getElementById('rx-cyl-l')?.value,
          axis: document.getElementById('rx-axis-l')?.value
        };
        prescription.pd = pd;
      }
    } else if (whatsappRxCheck) {
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

  handlePrescriptionFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Selected image is larger than 10MB. Please select a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedPrescriptionBase64 = e.target.result;
      const previewBox = document.getElementById('rx-upload-preview-box');
      const promptBox = document.getElementById('rx-upload-prompt');
      const thumb = document.getElementById('rx-preview-thumb');
      const filename = document.getElementById('rx-preview-filename');

      if (thumb) thumb.src = this.uploadedPrescriptionBase64;
      if (filename) filename.textContent = file.name;
      if (previewBox) previewBox.style.display = 'flex';
      if (promptBox) promptBox.style.display = 'none';

      Cart.showToast("Doctor's prescription slip attached!");
    };
    reader.readAsDataURL(file);
  },

  removePrescriptionFile() {
    this.uploadedPrescriptionBase64 = null;
    const previewBox = document.getElementById('rx-upload-preview-box');
    const promptBox = document.getElementById('rx-upload-prompt');
    const fileInput = document.getElementById('rx-file-upload');
    if (previewBox) previewBox.style.display = 'none';
    if (promptBox) promptBox.style.display = 'flex';
    if (fileInput) fileInput.value = '';
  },

  viewPrescriptionImage(url) {
    if (!url) return;
    const img = document.getElementById('prescription-full-img');
    const modal = document.getElementById('prescription-view-modal');
    if (img) img.src = url;
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },
});
