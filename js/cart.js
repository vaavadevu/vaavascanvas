// ============================================================
// VAAVASCANVAS – CART & CHECKOUT
// ============================================================

// This file owns the drawer: the DOM, the toasts and the network call. The
// decisions behind them live in two files it expects to have been loaded first.
//
//   js/cart-math.js  — what a cart costs: FREE_SHIPPING_THRESHOLD,
//                      SHIPPING_COST_SE, SHIPPING_COST_EU, calcSubtotal,
//                      calcShipping, calcTotal, calcCount,
//                      applyBookmarkPricing, cartItemOldPrice
//   js/cart-rules.js — what belongs in it: isUniqueItem, resolveAdd,
//                      withoutFrameVariants, validateCheckout, buildOrderItems

const Cart = (() => {
  let items = JSON.parse(localStorage.getItem('vc_cart') || '[]');
  let selectedCountry = '';

  // Recomputed on every change so the cart total matches what
  // create-checkout.js independently calculates for the same cart
  function repriceBookmarks() {
    // Prefer the catalog over whatever an older build stored in localStorage
    const product = (typeof paintings !== 'undefined' && Array.isArray(paintings))
      ? paintings.find(p => p.type === 'bookmark')
      : null;

    applyBookmarkPricing(items, product);
  }

  function save() {
    repriceBookmarks();
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

  function formatCartItemType(type) {
    switch (type) {
      case 'original': return t('item_type_original');
      case 'clay': return t('item_type_clay');
      case 'bookmark': return t('item_type_bookmark');
      default: return t('item_type_shop');
    }
  }

  function add(item) {
    const outcome = resolveAdd(items, item);

    // Nothing to add — the piece is one of a kind and already in the cart
    if (outcome.action === 'duplicate') {
      openCart();
      showToast(`"${item.title}" ${t('cart_toast_already')}`);
      return;
    }

    if (outcome.action === 'increment') {
      const existing = items.find(i => i.key === outcome.key);
      existing.qty = (existing.qty || 1) + 1;
    } else {
      // Picking the other frame-variant swaps out the one already there
      if (outcome.action === 'replace') {
        items = withoutFrameVariants(items, outcome.baseId);
      }
      items.push({ ...item, key: outcome.key, qty: 1 });
    }

    trackEvent('add_to_cart', {
      currency: 'SEK',
      value: item.price,
      items: buildOrderItems([{ ...item, qty: 1 }]),
    });
    save();
    openCart();
    showToast(`"${item.title}" ${t('cart_toast_added')}`);
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

  function subtotal() {
    return calcSubtotal(items);
  }

  function shipping() {
    return calcShipping(subtotal(), selectedCountry);
  }

  function total() {
    return calcTotal(items, selectedCountry);
  }

  function count() {
    return calcCount(items);
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
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '';
      if (emptyMsg) {
        list.appendChild(emptyMsg);
        emptyMsg.style.display = 'block';
      }
      if (footer) footer.style.display = 'none';
      return;
    }

    list.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (footer) footer.style.display = 'block';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      const oldPrice = cartItemOldPrice(item);
      el.innerHTML = `
        <div class="cart-item-img">
          ${item.image
            ? `<img src="${item.image}" alt="${item.title}" />`
            : `<div class="cart-item-img-placeholder"></div>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-meta">${formatCartItemType(item.type)}</div>
          <div class="cart-item-price">
            ${(item.price * (item.qty || 1)).toLocaleString('sv-SE')} kr
            ${oldPrice ? `<span class="cart-item-price-old">${(oldPrice * (item.qty || 1)).toLocaleString('sv-SE')} kr</span>` : ''}
          </div>
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
          ${isUniqueItem(item) ? '' : `
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

    if (subtotalEl) subtotalEl.textContent = subtotal().toLocaleString('sv-SE') + ' kr';
    if (shippingEl) shippingEl.textContent = shipping() === 0 ? t('cart_free_shipping') : shipping().toLocaleString('sv-SE') + ' kr';
    if (totalEl) totalEl.textContent = total().toLocaleString('sv-SE') + ' kr';

    const shippingDisplayEl = document.getElementById('cart-shipping-display');
    const FREE_SHIPPING = FREE_SHIPPING_THRESHOLD;
    const sub = subtotal();
    const isEU = selectedCountry === 'EU';

    if (shippingDisplayEl) {
      if (isEU) {
        shippingDisplayEl.innerHTML = `<span class="shipping-cost">${SHIPPING_COST_EU} kr</span>`;
      } else if (sub >= FREE_SHIPPING) {
        shippingDisplayEl.innerHTML = `<s class="shipping-old-price">${SHIPPING_COST_SE} kr</s> <span class="shipping-free-label">${t('cart_free_shipping')}</span>`;
      } else {
        shippingDisplayEl.innerHTML = `<span class="shipping-cost">${SHIPPING_COST_SE} kr</span>`;
      }
    }
    const progressEl = document.getElementById('cart-shipping-progress');
    const progressText = document.getElementById('cart-shipping-progress-text');
    const progressFill = document.getElementById('cart-shipping-fill');
    if (progressEl) {
      if (isEU) {
        progressEl.style.display = 'none';
      } else {
        progressEl.style.display = '';
        if (sub >= FREE_SHIPPING) {
          progressEl.classList.add('achieved');
          if (progressText) progressText.textContent = t('cart_free_shipping_achieved');
          if (progressFill) progressFill.style.width = '100%';
        } else {
          progressEl.classList.remove('achieved');
          const remaining = FREE_SHIPPING - sub;
          if (progressText) progressText.textContent = remaining.toLocaleString('sv-SE') + t('cart_free_shipping_remaining_post');
          if (progressFill) progressFill.style.width = Math.round((sub / FREE_SHIPPING) * 100) + '%';
        }
      }
    }

    updateCountryWarning();
  }

  function updateCountryWarning() {
    const select = document.getElementById('cart-country');
    const countryRow = document.getElementById('cart-country-row');
    if (select) select.value = selectedCountry;
    if (countryRow) countryRow.style.display = items.length > 0 ? 'flex' : 'none';
  }

  function onCountryChange(val) {
    selectedCountry = val;
    render();
  }

  let justOpened = false;

  function preventBodyScroll(e) {
    if (e.target.closest('#cart-items')) return;
    if (e.target.closest('.subscribe-modal-inner')) return;
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
    selectedCountry = '';
    const cb = document.getElementById('cart-terms-checkbox');
    if (cb) cb.checked = false;
    document.querySelector('.cart-terms-label')?.classList.remove('cart-terms-error');
  }

  async function checkout() {
    if (items.length === 0) return;

    const cb = document.getElementById('cart-terms-checkbox');
    const { ok, blockers } = validateCheckout({
      country: selectedCountry,
      termsAccepted: !!cb?.checked,
    });

    if (!ok) {
      // Re-triggering the animation needs the class off, a reflow, then on again
      const flagError = (el) => {
        if (!el) return;
        el.classList.remove('cart-terms-error');
        void el.offsetWidth;
        el.classList.add('cart-terms-error');
      };

      if (blockers.includes('country')) flagError(document.getElementById('cart-country-row'));
      if (blockers.includes('terms')) flagError(cb?.closest('.cart-terms-label'));
      return;
    }

    const orderItems = buildOrderItems(items);
    trackEvent('begin_checkout', { currency: 'SEK', value: total(), items: orderItems });
    sessionStorage.setItem('vc_last_order', JSON.stringify({ value: total(), items: orderItems }));

    const btn = document.getElementById('checkout-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('cart_processing');
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, country: selectedCountry }),
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

    window.addEventListener('languagechange', () => render());

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
      const raw = sessionStorage.getItem('vc_last_order');
      if (raw) {
        try {
          const order = JSON.parse(raw);
          trackEvent('purchase', { currency: 'SEK', value: order.value, transaction_id: 'order_' + Date.now(), items: order.items });
        } catch (_) {}
        sessionStorage.removeItem('vc_last_order');
      }
      showToast(t('cart_order_success'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  return { add, remove, updateQty, toggleFrame, openCart, closeCart, checkout, init, count, updateBadge, hasOriginal, onCountryChange };
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