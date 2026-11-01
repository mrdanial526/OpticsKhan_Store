// Customer reviews slider/form & newsletter signup
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

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
      if (this.currentUser) {
        const authorInput = modal.querySelector('input[name="author"]');
        const cityInput = modal.querySelector('input[name="city"]');
        if (authorInput && !authorInput.value) authorInput.value = this.currentUser.name || '';
        if (cityInput && !cityInput.value) cityInput.value = this.currentUser.city || '';
      }
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
});
