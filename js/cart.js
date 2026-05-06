// ============================================================
// VAAVASCANVAS – CART & CHECKOUT
// ============================================================

const Cart = (() => {
  let items = JSON.parse(localStorage.getItem('vc_cart') || '[]');

  function save() {
    localStorage.setItem('vc_cart', JSON.stringify(items));
    render();
    updateBadge();
  }

  function add(item) {
    // item: { id, title, type, size, price, image }
    const key = `${item.id}-${item.size || 'original'}`;
    const existing = items.find(i => i.key === key);
    if (existing) {
      if (item.type === 'original') {
        openCart();
        showToast(`"${item.title}" finns redan i varukorgen`);
        return;
      }
      existing.qty = (existing.qty || 1) + 1;
    } else {
      items.push({ ...item, key, qty: 1 });
    }
    save();
    openCart();
    showToast(`"${item.title}" lagd i varukorgen`);
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
          <div class="cart-item-meta">${item.type === 'print' ? 'Print · ' + item.size : 'Original'}</div>
          <div class="cart-item-price">${(item.price * (item.qty || 1)).toLocaleString('sv-SE')} kr</div>
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

  function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
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
    const cb = document.getElementById('cart-terms-checkbox');
    const btn = document.getElementById('checkout-btn');
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
      btn.textContent = 'Bearbetar...';
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
      showToast('Något gick fel. Försök igen.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Till betalning';
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

    // Close when clicking outside the drawer
    document.addEventListener('click', (e) => {
      if (justOpened) return;
      const drawer = document.getElementById('cart-drawer');
      if (!drawer?.classList.contains('open')) return;
      const cartBtn = document.querySelector('.cart-icon-btn');
      const shippingModal = document.getElementById('shippingModal');
      if (shippingModal?.contains(e.target) || e.target === shippingModal) return;
      if (!drawer.contains(e.target) && !cartBtn?.contains(e.target)) closeCart();
    });

    // Check for success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('order') === 'success') {
      showToast('✓ Tack för din beställning! Bekräftelse skickas till din e-post.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  return { add, remove, updateQty, openCart, closeCart, checkout, init, count, updateBadge };
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