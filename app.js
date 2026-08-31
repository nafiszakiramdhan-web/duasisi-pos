/* =========================================================
   DUA SISI COFFEE & EATERY — POS PWA
   app.js — IndexedDB + UI logic (no external framework)
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
  let allMenu = [];          // cache of menu items from IndexedDB
  let cart = [];              // [{id, name, category, price, qty}]
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
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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
    const filtered = getFilteredMenu();

    grid.innerHTML = '';

    if (filtered.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const frag = document.createDocumentFragment();
    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="cat-icon">${CATEGORY_ICON[item.category] || '🍽️'}</div>
        <p class="p-name">${escapeHtml(item.name)}</p>
        <span class="p-tag">${escapeHtml(item.category)}</span>
        <div class="p-price">${formatRupiah(item.price)}</div>
        <button class="add-btn" data-id="${item.id}" aria-label="Tambah ${escapeHtml(item.name)}">+</button>
      `;
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

    if (cart.length === 1) {
      $('#checkoutCard').classList.remove('collapsed');
    }
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

    $('#cartCount').textContent = `${cartItemCount()} item`;
    $('#cartMiniTotal').textContent = formatRupiah(total);
    $('#cartTotal').textContent = formatRupiah(total);

    if (cart.length === 0) {
      list.innerHTML = '<p class="empty-state small">Belum ada menu dipilih.</p>';
    } else {
      list.innerHTML = cart.map((c) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(c.name)}</div>
            <div class="cart-item-price">${formatRupiah(c.price)} x ${c.qty}</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn minus" data-id="${c.id}" data-delta="-1" aria-label="Kurangi">−</button>
            <span class="qty-value">${c.qty}</span>
            <button class="qty-btn plus" data-id="${c.id}" data-delta="1" aria-label="Tambah">+</button>
          </div>
        </div>
      `).join('');
    }

    recalcChange();
  }

  function recalcChange() {
    const total = cartTotal();
    const paid = Number($('#paidInput').value) || 0;
    const change = paid - total;
    const changeEl = $('#changeAmount');
    const finishBtn = $('#finishTransactionBtn');

    changeEl.textContent = formatRupiah(Math.abs(change));
    if (change < 0) {
      changeEl.classList.add('negative');
    } else {
      changeEl.classList.remove('negative');
    }

    const canFinish = cart.length > 0 && paid >= total && total > 0;
    finishBtn.disabled = !canFinish;
  }

  async function finishTransaction() {
    const total = cartTotal();
    const paid = Number($('#paidInput').value) || 0;
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
      $('#paidInput').value = '';
      renderCart();
      $('#checkoutCard').classList.add('collapsed');
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
    $('#menuTotalCount').textContent = allMenu.length;

    if (allMenu.length === 0) {
      container.innerHTML = '<p class="empty-state">Belum ada menu tersimpan.</p>';
      return;
    }

    container.innerHTML = allMenu.map((item) => `
      <div class="menu-row">
        <div class="cat-icon">${CATEGORY_ICON[item.category] || '🍽️'}</div>
        <div class="menu-row-info">
          <div class="menu-row-name">${escapeHtml(item.name)}</div>
          <div class="menu-row-meta">${escapeHtml(item.category)}</div>
        </div>
        <div class="menu-row-price">${formatRupiah(item.price)}</div>
        <button class="delete-btn" data-id="${item.id}" aria-label="Hapus ${escapeHtml(item.name)}">🗑️</button>
      </div>
    `).join('');
  }

  async function handleAddMenu(e) {
    e.preventDefault();
    const name = $('#menuName').value.trim();
    const category = $('#menuCategory').value;
    const price = Number($('#menuPrice').value);

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

    $('#statOmset').textContent = formatRupiah(totalOmset);
    $('#statTrx').textContent = totalTrx;
    $('#statItems').textContent = totalItems;

    // Best sellers
    const salesMap = {};
    transactions.forEach((t) => {
      t.items.forEach((i) => {
        if (!salesMap[i.name]) salesMap[i.name] = { name: i.name, category: i.category, qty: 0 };
        salesMap[i.name].qty += i.qty;
      });
    });
    const bestSellers = Object.values(salesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const bestSellerEl = $('#bestSellerList');
    if (bestSellers.length === 0) {
      bestSellerEl.innerHTML = '<p class="empty-state">Belum ada penjualan.</p>';
    } else {
      bestSellerEl.innerHTML = bestSellers.map((b, idx) => `
        <div class="bestseller-row">
          <div class="bestseller-rank">${idx + 1}</div>
          <div class="bestseller-info">
            <div class="bestseller-name">${escapeHtml(b.name)}</div>
            <div class="bestseller-sold">${b.qty} terjual</div>
          </div>
        </div>
      `).join('');
    }

    // History
    const historyEl = $('#historyList');
    if (transactions.length === 0) {
      historyEl.innerHTML = '<p class="empty-state">Belum ada riwayat transaksi.</p>';
    } else {
      historyEl.innerHTML = transactions.map((t) => `
        <div class="history-card">
          <div class="history-top">
            <span class="history-time">${formatDateTime(t.datetime)}</span>
            <span class="history-total">${formatRupiah(t.total)}</span>
          </div>
          <div class="history-items">
            ${t.items.map((i) => `${escapeHtml(i.name)} x${i.qty}`).join(', ')}
          </div>
          <div class="history-foot">
            <span>Dibayar: ${formatRupiah(t.paid)}</span>
            <span>Kembali: ${formatRupiah(t.change)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  async function refreshReportIfVisible() {
    if ($('#tab-laporan').classList.contains('active')) {
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
  }

  /* ---------------------------------------------------------
     ONLINE / OFFLINE STATUS
  --------------------------------------------------------- */
  function updateOnlineStatus() {
    const badge = $('#statusBadge');
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
    $('#searchInput').addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderProducts();
    });

    // Category chips
    $('#categoryChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      activeCategory = chip.dataset.cat;
      $$('.chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderProducts();
    });

    // Add to cart (delegated)
    $('#productGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('.add-btn');
      if (!btn) return;
      addToCart(Number(btn.dataset.id));
    });

    // Cart qty controls (delegated)
    $('#cartList').addEventListener('click', (e) => {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;
      changeQty(Number(btn.dataset.id), Number(btn.dataset.delta));
    });

    // Paid input
    $('#paidInput').addEventListener('input', recalcChange);

    // Finish transaction
    $('#finishTransactionBtn').addEventListener('click', finishTransaction);

    // Checkout collapse toggle
    $('#checkoutToggle').addEventListener('click', () => {
      $('#checkoutCard').classList.toggle('collapsed');
    });

    // Menu form
    $('#menuForm').addEventListener('submit', handleAddMenu);

    // Delete menu (delegated)
    $('#menuTable').addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (!btn) return;
      handleDeleteMenu(Number(btn.dataset.id));
    });

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
