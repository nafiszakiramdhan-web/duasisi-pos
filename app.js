/* =========================================================
   DUA SISI COFFEE & EATERY — POS PWA
   app.js — IndexedDB + Synchronized UI Layout
   ========================================================= */

(() => {
  'use strict';

  /* ---------------------------------------------------------
     CONFIG
  --------------------------------------------------------- */
  const DB_NAME = 'DuaSisi_Kasir_DB_v5';
  const DB_VERSION = 1;
  const STORE_MENU = 'menu';
  const STORE_TRX = 'transactions';

  const CATEGORY_ICON = {
    'Ice Black': '🧊',
    'Milk Based': '🥛',
    'Non-Coffee': '🍵',
    'Brewed Coffee': '☕',
    'Signature': '⭐'
  };

  const DUMMY_MENU = [
    // ICE BLACK
    { name: 'Black Bitter (House Blend 70:30)', category: 'Ice Black', price: 15000 },
    { name: 'Black Seasonal (Full Arabica)', category: 'Ice Black', price: 20000 },
    { name: 'Black Series (Peach)', category: 'Ice Black', price: 20000 },
    { name: 'Black Series (Berry)', category: 'Ice Black', price: 20000 },
    { name: 'Black Series (Rum)', category: 'Ice Black', price: 20000 },

    // MILK BASED
    { name: 'Creamy Latte', category: 'Milk Based', price: 18000 },
    { name: 'Aren Latte', category: 'Milk Based', price: 18000 },
    { name: 'Spanish Latte', category: 'Milk Based', price: 18000 },
    { name: 'Creamchesse Latte', category: 'Milk Based', price: 23000 },
    { name: 'Caramel Cream Salt', category: 'Milk Based', price: 23000 },
    { name: 'Butterscoth Cream', category: 'Milk Based', price: 23000 },

    // NON-COFFEE
    { name: 'Chocolate', category: 'Non-Coffee', price: 20000 },
    { name: 'Choco Cheese', category: 'Non-Coffee', price: 23000 },
    { name: 'Matcha Latte', category: 'Non-Coffee', price: 20000 },
    { name: 'Matcha Berry', category: 'Non-Coffee', price: 23000 },
    { name: 'Berry Milk', category: 'Non-Coffee', price: 20000 },

    // BREWED COFFEE
    { name: 'Hot Cappucino', category: 'Brewed Coffee', price: 18000 },
    { name: 'Tubruk Susu', category: 'Brewed Coffee', price: 13000 },
    { name: 'Tubruk R (Robusta)', category: 'Brewed Coffee', price: 10000 },
    { name: 'Tubruk A (Arabica)', category: 'Brewed Coffee', price: 13000 },
    { name: 'Filter Coffee', category: 'Brewed Coffee', price: 20000 },

    // SIGNATURE
    { name: 'Mont Blanc Twoside', category: 'Signature', price: 25000 }
  ];

  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */
  let db = null;
  let allMenu = [];
  let cart = [];
  let activeCategory = 'Semua';
  let searchTerm = '';

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function formatRupiah(num) {
    const n = Math.max(0, Math.round(Number(num) || 0));
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.style.display = 'none'; }, 2200);
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------------------------------------------------
     INDEXEDDB SETUP
  --------------------------------------------------------- */
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const _db = event.target.result;

        if (!_db.objectStoreNames.contains(STORE_MENU)) {
          const menuStore = _db.createObjectStore(STORE_MENU, { keyPath: 'id', autoIncrement: true });
          menuStore.createIndex('category', 'category', { unique: false });
        }

        if (!_db.objectStoreNames.contains(STORE_TRX)) {
          _db.createObjectStore(STORE_TRX, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  function tx(storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function idbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, 'readonly').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function idbAdd(storeName, value) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, 'readwrite').add(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbDelete(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, 'readwrite').delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function seedDummyDataIfEmpty() {
    const existing = await idbGetAll(STORE_MENU);
    if (existing.length === 0) {
      for (const item of DUMMY_MENU) {
        await idbAdd(STORE_MENU, item);
      }
    }
  }

  /* ---------------------------------------------------------
     PRODUCT RENDERING (KASIR TAB)
  --------------------------------------------------------- */
  function getFilteredMenu() {
    return allMenu.filter((item) => {
      const matchCategory = activeCategory === 'Semua' || item.category === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }

  function renderProducts() {
    const grid = $('#productGrid');
    const empty = $('#emptyProducts');
    if (!grid) return;

    const filtered = getFilteredMenu();
    grid.innerHTML = '';

    if (filtered.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const frag = document.createDocumentFragment();
    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'card product-card';
      card.innerHTML = `
        <div class="product-info">
          <div class="product-icon">${CATEGORY_ICON[item.category] || '☕'}</div>
          <div class="product-title">${escapeHtml(item.name)}</div>
          <div class="product-cat">${escapeHtml(item.category)}</div>
        </div>
        <div class="product-footer">
          <span class="product-price">${formatRupiah(item.price)}</span>
          <button class="btn-add add-btn" data-id="${item.id}" aria-label="Tambah ${escapeHtml(item.name)}">+</button>
        </div>
      `;
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  /* ---------------------------------------------------------
     CART LOGIC
  --------------------------------------------------------- */
  function addToCart(menuId) {
    const item = allMenu.find((m) => m.id === menuId);
    if (!item) return;

    const existing = cart.find((c) => c.id === menuId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: item.id, name: item.name, category: item.category, price: item.price, qty: 1 });
    }
    renderCart();
    showToast(`${item.name} ditambahkan`);
  }

  function changeQty(menuId, delta) {
    const item = cart.find((c) => c.id === menuId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((c) => c.id !== menuId);
    }
    renderCart();
  }

  function cartTotal() {
    return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  }

  function cartItemCount() {
    return cart.reduce((sum, c) => sum + c.qty, 0);
  }

  function renderCart() {
    const list = $('#cartList');
    const total = cartTotal();

    if ($('#cartCount')) $('#cartCount').textContent = `${cartItemCount()} item`;
    if ($('#cartMiniTotal')) $('#cartMiniTotal').textContent = formatRupiah(total);
    if ($('#cartTotal')) $('#cartTotal').textContent = formatRupiah(total);

    if (list) {
      if (cart.length === 0) {
        list.innerHTML = '<p class="empty-state small">Belum ada menu dipilih.</p>';
      } else {
        list.innerHTML = cart.map((c) => `
          <div class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-name">${escapeHtml(c.name)}</div>
              <div class="cart-item-price">${formatRupiah(c.price)} x ${c.qty}</div>
            </div>
            <div class="qty-control" style="display:flex; gap:6px; align-items:center;">
              <button class="qty-btn minus" data-id="${c.id}" data-delta="-1" style="padding:2px 8px; border-radius:4px; border:1px solid #ccc;">−</button>
              <span class="qty-value">${c.qty}</span>
              <button class="qty-btn plus" data-id="${c.id}" data-delta="1" style="padding:2px 8px; border-radius:4px; border:1px solid #ccc;">+</button>
            </div>
          </div>
        `).join('');
      }
    }

    recalcChange();
  }

  function recalcChange() {
    const total = cartTotal();
    const paidInput = $('#paidInput');
    const paid = paidInput ? (Number(paidInput.value) || 0) : 0;
    const change = paid - total;
    const changeEl = $('#changeAmount');
    const finishBtn = $('#finishTransactionBtn');

    if (changeEl) {
      changeEl.textContent = formatRupiah(Math.max(0, change));
    }

    const canFinish = cart.length > 0 && paid >= total && total > 0;
    if (finishBtn) finishBtn.disabled = !canFinish;
  }

  async function finishTransaction() {
    const total = cartTotal();
    const paidInput = $('#paidInput');
    const paid = paidInput ? (Number(paidInput.value) || 0) : 0;
    if (cart.length === 0 || paid < total) return;

    const record = {
      datetime: new Date().toISOString(),
      items: cart.map((c) => ({ id: c.id, name: c.name, category: c.category, price: c.price, qty: c.qty })),
      total,
      paid,
      change: paid - total
    };

    try {
      await idbAdd(STORE_TRX, record);
      cart = [];
      if (paidInput) paidInput.value = '';
      renderCart();
      if ($('#checkoutCard')) $('#checkoutCard').classList.remove('expanded');
      showToast('Transaksi berhasil disimpan ✓');
      await refreshReportIfVisible();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan transaksi');
    }
  }

  /* ---------------------------------------------------------
     MENU MANAGEMENT (TAB MENU)
  --------------------------------------------------------- */
  async function refreshMenuCache() {
    allMenu = await idbGetAll(STORE_MENU);
    allMenu.sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderMenuTable() {
    const container = $('#menuTable');
    if (!container) return;
    if ($('#menuTotalCount')) $('#menuTotalCount').textContent = allMenu.length;

    if (allMenu.length === 0) {
      container.innerHTML = '<p class="empty-state">Belum ada menu tersimpan.</p>';
      return;
    }

    container.innerHTML = allMenu.map((item) => `
      <div class="card" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.category)})
          <div style="font-size:12px; color:var(--primary);">${formatRupiah(item.price)}</div>
        </div>
        <button class="delete-btn" data-id="${item.id}" style="background:#E63946; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Hapus</button>
      </div>
    `).join('');
  }

  async function handleAddMenu(e) {
    e.preventDefault();
    const name = $('#menuName')?.value.trim();
    const category = $('#menuCategory')?.value;
    const price = Number($('#menuPrice')?.value);

    if (!name || !price || price <= 0) {
      showToast('Lengkapi data menu dengan benar');
      return;
    }

    try {
      await idbAdd(STORE_MENU, { name, category, price });
      await refreshMenuCache();
      renderMenuTable();
      renderProducts();
      $('#menuForm').reset();
      showToast('Menu berhasil ditambahkan');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan menu');
    }
  }

  async function handleDeleteMenu(id) {
    try {
      await idbDelete(STORE_MENU, id);
      await refreshMenuCache();
      renderMenuTable();
      renderProducts();
      showToast('Menu dihapus');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus menu');
    }
  }

  /* ---------------------------------------------------------
     REPORT / ANALYTICS (TAB LAPORAN)
  --------------------------------------------------------- */
  async function renderReport() {
    const transactions = await idbGetAll(STORE_TRX);
    transactions.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    const totalOmset = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTrx = transactions.length;
    const totalItems = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0), 0
    );

    if ($('#statOmset')) $('#statOmset').textContent = formatRupiah(totalOmset);
    if ($('#statTrx')) $('#statTrx').textContent = totalTrx;
    if ($('#statItems')) $('#statItems').textContent = totalItems;

    // History
    const historyEl = $('#historyList');
    if (historyEl) {
      if (transactions.length === 0) {
        historyEl.innerHTML = '<p class="empty-state">Belum ada riwayat transaksi.</p>';
      } else {
        historyEl.innerHTML = transactions.map((t) => `
          <div class="card" style="margin-bottom:8px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong>#TRX-${t.id.toString().slice(-4)}</strong>
              <span>${formatDateTime(t.datetime)}</span>
            </div>
            <div>Items: ${t.items.map((i) => `${escapeHtml(i.name)} x${i.qty}`).join(', ')}</div>
            <div style="margin-top:4px;">Total: <strong>${formatRupiah(t.total)}</strong></div>
          </div>
        `).join('');
      }
    }
  }

  async function refreshReportIfVisible() {
    const tab = $('#tab-laporan');
    if (tab && tab.classList.contains('active')) {
      await renderReport();
    }
  }

  /* ---------------------------------------------------------
     TAB / NAVIGATION
  --------------------------------------------------------- */
  function switchTab(tabId) {
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === tabId));
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));

    if (tabId === 'tab-laporan') renderReport();
    if (tabId === 'tab-menu') renderMenuTable();
  }

  /* ---------------------------------------------------------
     ONLINE / OFFLINE STATUS
  --------------------------------------------------------- */
  function updateOnlineStatus() {
    const badge = $('#statusBadge');
    if (!badge) return;
    if (navigator.onLine) {
      badge.classList.remove('offline');
      badge.classList.add('online');
      badge.innerHTML = '<span class="status-dot"></span> Online';
    } else {
      badge.classList.remove('online');
      badge.classList.add('offline');
      badge.innerHTML = '<span class="status-dot"></span> Offline';
    }
  }

  /* ---------------------------------------------------------
     EVENT BINDING
  --------------------------------------------------------- */
  function bindEvents() {
    // Search
    if ($('#searchInput')) {
      $('#searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderProducts();
      });
    }

    // Category chips
    if ($('#categoryChips')) {
      $('#categoryChips').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        activeCategory = chip.dataset.cat;
        $$('.chip').forEach((c) => c.classList.toggle('active', c === chip));
        renderProducts();
      });
    }

    // Add to cart (delegated)
    if ($('#productGrid')) {
      $('#productGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('.add-btn');
        if (!btn) return;
        addToCart(Number(btn.dataset.id));
      });
    }

    // Cart qty controls (delegated)
    if ($('#cartList')) {
      $('#cartList').addEventListener('click', (e) => {
        const btn = e.target.closest('.qty-btn');
        if (!btn) return;
        changeQty(Number(btn.dataset.id), Number(btn.dataset.delta));
      });
    }

    // Paid input
    if ($('#paidInput')) {
      $('#paidInput').addEventListener('input', recalcChange);
    }

    // Finish transaction
    if ($('#finishTransactionBtn')) {
      $('#finishTransactionBtn').addEventListener('click', finishTransaction);
    }

    // Checkout collapse toggle
    if ($('#checkoutToggle')) {
      $('#checkoutToggle').addEventListener('click', () => {
        const card = $('#checkoutCard');
        if (card) card.classList.toggle('expanded');
      });
    }

    // Menu form
    if ($('#menuForm')) {
      $('#menuForm').addEventListener('submit', handleAddMenu);
    }

    // Delete menu (delegated)
    if ($('#menuTable')) {
      $('#menuTable').addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-btn');
        if (!btn) return;
        handleDeleteMenu(Number(btn.dataset.id));
      });
    }

    // Bottom nav
    $$('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Online/offline
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /* ---------------------------------------------------------
     SERVICE WORKER
  --------------------------------------------------------- */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  async function init() {
    try {
      await openDatabase();
      await seedDummyDataIfEmpty();
      await refreshMenuCache();
      renderProducts();
      renderCart();
      bindEvents();
      updateOnlineStatus();
      registerServiceWorker();
    } catch (err) {
      console.error('Gagal memuat aplikasi:', err);
      showToast('Gagal memuat database');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();