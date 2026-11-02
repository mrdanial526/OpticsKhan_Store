// User authentication, sessions & customer account modal
// Extends the global App object (defined in app-core.js).
Object.assign(App, {

  // ==========================================
  // USER AUTHENTICATION & SESSIONS
  // ==========================================
  loadCurrentUser() {
    try {
      const saved = localStorage.getItem('opticskhan_user') || localStorage.getItem('opticskhan_auth_user');
      const user = saved ? JSON.parse(saved) : null;
      this.currentUser = user;

      if (user) {
        localStorage.setItem('opticskhan_user', JSON.stringify(user));
        localStorage.setItem('opticskhan_auth_user', JSON.stringify(user));
      }
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
      if (title) title.textContent = 'Sign In to OpticsKhan';
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

  handleGoogleAuth(mode = 'login') {
    if (!window.google || !window.google.accounts) {
      Cart.showToast('❌ Google sign-in is not configured yet.');
      return;
    }

    const label = mode === 'register' ? 'Sign up' : 'Login';
    const client = window.google.accounts.id;

    client.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
          });

          const data = await res.json();

          if (!data.success) {
            Cart.showToast(`❌ ${data.message || 'Google authentication failed.'}`);
            return;
          }

          this.currentUser = data.user;
          localStorage.setItem('opticskhan_user', JSON.stringify(data.user));
          localStorage.setItem('opticskhan_auth_user', JSON.stringify(data.user));
          localStorage.setItem('opticskhan_token', data.token);
          this.updateAuthUI();
          this.closeAuthModal();
          Cart.showToast(`✅ Welcome ${data.user.fullName}!`);
        } catch (error) {
          Cart.showToast(`❌ ${label} with Google failed. Please try again.`);
        }
      }
    });

    client.prompt();
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
        if (data.token) {
          localStorage.setItem('opticskhan_token', data.token);
        }
        localStorage.setItem('opticskhan_user', JSON.stringify(data.user));
        localStorage.setItem('opticskhan_auth_user', JSON.stringify(data.user));
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
    localStorage.removeItem('opticskhan_user');
    localStorage.removeItem('opticskhan_auth_user');
    localStorage.removeItem('opticskhan_token');
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
        const res = await this.authFetch('/api/auth/my-orders');
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
                ${!((o.status || '').toLowerCase().includes('cancel') || (o.status || '').toLowerCase().includes('delivered') || (o.status || '').toLowerCase().includes('verified')) ? `
                  <button class="action-btn-mini danger" onclick="App.cancelCustomerOrder('${o.orderId}')">Cancel</button>
                ` : ''}
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

  async cancelCustomerOrder(orderId) {
    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }

    const reason = await this.showPromptDialog({
      title: 'Cancel order',
      message: `Write the cancellation reason for order #${orderId}:`,
      placeholder: 'Type a cancellation reason',
      allowEmpty: false,
    });
    if (reason === null) return;

    const trimmedReason = String(reason).trim();
    if (!trimmedReason) {
      Cart.showToast('⚠️ Please write a reason before cancelling this order.');
      return;
    }

    try {
      const res = await this.authFetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: trimmedReason })
      });
      const data = await res.json();

      if (data.success) {
        Cart.showToast(data.message || 'Order cancelled successfully.');
        await this.openCustomerModal();
        return;
      }

      alert(data.message || 'Unable to cancel this order.');
    } catch (e) {
      alert('Error cancelling this order.');
    }
  },

  closeCustomerModal() {
    const modal = document.getElementById('customer-account-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },
});
