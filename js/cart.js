// ============================================================
// VAAVASCANVAS – CART & CHECKOUT
// ============================================================

const Cart = (() => {
  let items = JSON.parse(localStorage.getItem('vc_cart') || '[]');

  function save() {
    localStorage.setItem('vc_cart', JSON.stringify(items));
    render();
    updateBadge();
    document.dispatchEvent(new CustomEvent('cartupdate'));
  }

  function hasOriginal(baseId) {
    return items.some(i =>
      i.type === 'original' &&
      (i.paintingBaseId === baseId || i.id === baseId || i.id === baseId + '-framed')
    );
  }

  function add(item) {
    const key = `${item.id}-${item.size || 'original'}`;

    if (item.type === 'original') {
      const existing = items.find(i => i.key === key);
      if (existing) {
        openCart();
        showToast(`"${item.title}" ${t('cart_toast_already')}`);
        return;
      }
      // Remove any other frame-variant of the same painting
      const baseId = item.paintingBaseId || item.id.replace(/-framed$/, '');
      items = items.filter(i => {
        if (i.type !== 'original') return true;
        const iBase = i.paintingBaseId || i.id.replace(/-framed$/, '');
        return iBase !== baseId;
      });
    } else {
      const existing = items.find(i => i.key === key);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
        save();
        openCart();
        showToast(`"${item.title}" ${t('cart_toast_added')}`);
        return;
      }
    }

    items.push({ ...item, key, qty: 1 });
    save();
    openCart();
    showToast(`"${item.title}" lagd i varukorgen`);
  }

  function toggleFrame(key, withFrame) {
    const item = items.find(i => i.key === key);
    if (!item || !item.frameAvailable) return;
    const baseId = item.paintingBaseId;
    const newId = withFrame ? `${baseId}-framed` : baseId;
    item.id = newId;
    item.key = `${newId}-original`;
    item.withFrame = withFrame;
    item.price = withFrame ? item.framedPrice : item.basePrice;
    item.title = item.paintingTitle;
    save();
  }

  function remove(key) {
    items = items.filter(i => i.key !== key);
    justOpened = true;
    setTimeout(() => { justOpened = false; }, 0);
    save();
    if (items.length === 0) closeCart();
  }

  function updateQty(key, delta) {
    const item = items.find(i => i.key === key);
    if (!item) return;
    item.qty = (item.qty || 1) + delta;
    justOpened = true;
    setTimeout(() => { justOpened = false; }, 0);
    if (item.qty <= 0) remove(key);
    else save();
  }

  function total() {
    return items.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
  }

  function count() {
    return items.reduce((sum, i) => sum + (i.qty || 1), 0);
  }

  function updateBadge() {
    const badge = document.getElementById('cart-badge');
    const n = count();
    if (badge) {
      badge.textContent = n;
      badge.style.display = n > 0 ? 'flex' : 'none';
      if (n > 0) {
        badge.classList.remove('pop');
        void badge.offsetWidth;
        badge.classList.add('pop');
      }
    }
  }

  function render() {
    const list = document.getElementById('cart-items');
    const emptyMsg = document.getElementById('cart-empty');
    const footer = document.getElementById('cart-footer');
    const totalEl = document.getElementById('cart-total');
    if (!list) return;

    list.innerHTML = '';

    if (items.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (footer) footer.style.display = 'block';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item-img">
          ${item.image
            ? `<img src="${item.image}" alt="${item.title}" />`
            : `<div class="cart-item-img-placeholder"></div>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-meta">${item.type === 'print' ? 'Print · ' + (item.sizeLabel || item.size) : 'Original'}</div>
          <div class="cart-item-price">${(item.price * (item.qty || 1)).toLocaleString('sv-SE')} kr</div>
          ${item.framedOnly ? `
          <span class="cart-frame-fixed">${t('cart_frame_included')}</span>` :
          item.frameAvailable ? `
          <label class="cart-frame-toggle">
            <input type="checkbox" ${item.withFrame ? 'checked' : ''} onchange="Cart.toggleFrame('${item.key}', this.checked)" />
            <span>${item.withFrame
              ? t('cart_frame_included')
              : `${t('cart_frame_add')} <em>+${(item.framedPrice - item.basePrice).toLocaleString('sv-SE')} kr</em>`
            }</span>
          </label>` : ''}
          ${item.type === 'original' ? '' : `
          <div class="cart-item-qty">
            <button onclick="Cart.updateQty('${item.key}', -1)">−</button>
            <span>${item.qty || 1}</span>
            <button onclick="Cart.updateQty('${item.key}', 1)">+</button>
          </div>`}
        </div>
        <button class="cart-item-remove" onclick="Cart.remove('${item.key}')">×</button>
      `;
      list.appendChild(el);
    });

    if (totalEl) totalEl.textContent = total().toLocaleString('sv-SE') + ' kr';
  }

  let justOpened = false;

  function preventBodyScroll(e) {
    if (e.target.closest('#cart-items')) return;
    e.preventDefault();
  }

  function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.getElementById('header-container')?.classList.add('visible');
    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', preventBodyScroll, { passive: false });
    render();
    justOpened = true;
    setTimeout(() => { justOpened = false; }, 0);
  }

  function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
    document.removeEventListener('touchmove', preventBodyScroll, { passive: false });
    const cb = document.getElementById('cart-terms-checkbox');
    if (cb) cb.checked = false;
    document.querySelector('.cart-terms-label')?.classList.remove('cart-terms-error');
  }

  async function checkout() {
    if (items.length === 0) return;

    const cb = document.getElementById('cart-terms-checkbox');
    if (!cb?.checked) {
      const label = cb?.closest('.cart-terms-label');
      if (label) {
        label.classList.remove('cart-terms-error');
        void label.offsetWidth; // force reflow to restart animation
        label.classList.add('cart-terms-error');
      }
      return;
    }

    const btn = document.getElementById('checkout-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('cart_processing');
    }

    try {
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.url) {
        // Clear cart before redirect
        items = [];
        save();
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Något gick fel');
      }
    } catch (err) {
      showToast(t('cart_error'));
      if (btn) {
        btn.disabled = false;
        btn.textContent = t('cart_checkout_btn');
      }
    }
  }

  function init() {
    updateBadge();

    // Terms checkbox — clear error state when checked
    document.addEventListener('change', (e) => {
      if (e.target.id === 'cart-terms-checkbox' && e.target.checked) {
        document.getElementById('cart-terms-checkbox')
          ?.closest('.cart-terms-label')
          ?.classList.remove('cart-terms-error');
      }
    });

    function isShippingModalOpen() {
      const m = document.getElementById('shippingModal');
      return m?.style.display === 'flex';
    }

    // Close when clicking/tapping outside the drawer
    document.addEventListener('click', (e) => {
      if (justOpened) return;
      const drawer = document.getElementById('cart-drawer');
      if (!drawer?.classList.contains('open')) return;
      if (isShippingModalOpen()) return;
      const cartBtn = document.querySelector('.cart-icon-btn');
      if (!drawer.contains(e.target) && !cartBtn?.contains(e.target)) closeCart();
    });

    // Close on touch outside the drawer (overlay tap on mobile)
    document.addEventListener('touchstart', (e) => {
      if (justOpened) return;
      const drawer = document.getElementById('cart-drawer');
      if (!drawer?.classList.contains('open')) return;
      if (isShippingModalOpen()) return;
      const cartBtn = document.querySelector('.cart-icon-btn');
      if (!drawer.contains(e.target) && !cartBtn?.contains(e.target)) closeCart();
    }, { passive: true });

    // Check for success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('order') === 'success') {
      showToast(t('cart_order_success'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  return { add, remove, updateQty, toggleFrame, openCart, closeCart, checkout, init, count, updateBadge, hasOriginal };
})();

// Toast notification
function showToast(msg) {
  let t = document.getElementById('vc-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vc-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

document.addEventListener('DOMContentLoaded', () => Cart.init());