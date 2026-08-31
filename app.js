/* =========================================================
   DUA SISI COFFEE & EATERY — POS SYSTEM & FULL MENU ENGINE
   ========================================================= */

(() => {
  'use strict';

  const DB_NAME = 'DuaSisi_Kasir_DB_v7';
  const DB_VERSION = 1;
  const STORE_MENU = 'menu';
  const STORE_TRX = 'transactions';

  // SELURUH DAFTAR MENU LENGKAP DUA SISI
  const DUMMY_MENU = [
    // ICE BLACK
    { name: 'Black Bitter (House Blend 70:30)', category: 'Ice Black', price: 15000, available: true, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop' },
    { name: 'Black Seasonal (Full Arabica)', category: 'Ice Black', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300&auto=format&fit=crop' },
    { name: 'Black Series (Peach)', category: 'Ice Black', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop' },
    { name: 'Black Series (Berry)', category: 'Ice Black', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop' },
    { name: 'Black Series (Rum)', category: 'Ice Black', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop' },
    { name: 'Iced Americano', category: 'Ice Black', price: 16000, available: true, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop' },

    // MILK BASED
    { name: 'Creamy Latte', category: 'Milk Based', price: 18000, available: true, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&auto=format&fit=crop' },
    { name: 'Aren Latte Dua Sisi', category: 'Milk Based', price: 18000, available: true, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&auto=format&fit=crop' },
    { name: 'Spanish Latte', category: 'Milk Based', price: 18000, available: true, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&auto=format&fit=crop' },
    { name: 'Creamchesse Latte', category: 'Milk Based', price: 23000, available: true, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300&auto=format&fit=crop' },
    { name: 'Caramel Cream Salt', category: 'Milk Based', price: 23000, available: true, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300&auto=format&fit=crop' },
    { name: 'Butterscoth Cream', category: 'Milk Based', price: 23000, available: true, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300&auto=format&fit=crop' },
    { name: 'Caramel Macchiato', category: 'Milk Based', price: 24000, available: true, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300&auto=format&fit=crop' },

    // NON-COFFEE
    { name: 'Chocolate', category: 'Non-Coffee', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&auto=format&fit=crop' },
    { name: 'Choco Cheese', category: 'Non-Coffee', price: 23000, available: true, image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&auto=format&fit=crop' },
    { name: 'Matcha Latte', category: 'Non-Coffee', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&auto=format&fit=crop' },
    { name: 'Matcha Berry', category: 'Non-Coffee', price: 23000, available: true, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&auto=format&fit=crop' },
    { name: 'Berry Milk', category: 'Non-Coffee', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=300&auto=format&fit=crop' },

    // BREWED COFFEE
    { name: 'Hot Cappucino', category: 'Brewed Coffee', price: 18000, available: true, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&auto=format&fit=crop' },
    { name: 'Tubruk Susu', category: 'Brewed Coffee', price: 13000, available: true, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&auto=format&fit=crop' },
    { name: 'Tubruk R (Robusta)', category: 'Brewed Coffee', price: 10000, available: true, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&auto=format&fit=crop' },
    { name: 'Tubruk A (Arabica)', category: 'Brewed Coffee', price: 13000, available: true, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&auto=format&fit=crop' },
    { name: 'Filter Coffee / V60 Gayo', category: 'Brewed Coffee', price: 20000, available: true, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&auto=format&fit=crop' },

    // SIGNATURE
    { name: 'Mont Blanc Twoside', category: 'Signature', price: 25000, available: true, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop' }
  ];

  /* ---------------------------------------------------------
     STATE SYSTEM
  --------------------------------------------------------- */
  let db = null;
  let allMenu = [];
  let cart = [];
  let activeCategory = 'Semua';
  let searchTerm = '';
  let activeCashier = 'K-1';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function formatRupiah(num) {
    const n = Math.max(0, Math.round(Number(num) || 0));
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add('hidden'), 2000);
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  /* ---------------------------------------------------------
     INDEXEDDB SETUP
  --------------------------------------------------------- */
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const _db = e.target.result;
        if (!_db.objectStoreNames.contains(STORE_MENU)) {
          _db.createObjectStore(STORE_MENU, { keyPath: 'id', autoIncrement: true });
        }
        if (!_db.objectStoreNames.contains(STORE_TRX)) {
          _db.createObjectStore(STORE_TRX, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => { db = e.target.result; resolve(db); };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  function tx(store, mode) { return db.transaction(store, mode).objectStore(store); }

  function idbGetAll(store) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readonly').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function idbAdd(store, val) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readwrite').add(val);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbPut(store, val) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readwrite').put(val);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbDelete(store, key) {
    return new Promise((resolve, reject) => {
      const req = tx(store, 'readwrite').delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function seedDummyData() {
    const existing = await idbGetAll(STORE_MENU);
    if (existing.length === 0) {
      for (const item of DUMMY_MENU) {
        await idbAdd(STORE_MENU, item);
      }
    }
  }

  /* ---------------------------------------------------------
     RENDER PRODUCTS (TAB KASIR)
  --------------------------------------------------------- */
  function renderProducts() {
    const grid = $('#productGrid');
    const empty = $('#emptyProducts');
    if (!grid) return;

    const filtered = allMenu.filter(item => {
      const matchCat = activeCategory === 'Semua' || item.category === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    filtered.forEach(item => {
      const isAvailable = item.available !== false;
      const card = document.createElement('div');
      card.className = `bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col relative group ${isAvailable ? 'cursor-pointer hover:shadow' : 'opacity-60'}`;
      card.innerHTML = `
        <div class="aspect-square w-full relative bg-surface-container">
          <img src="${item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300'}" class="w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}" alt="${escapeHtml(item.name)}"/>
          <div class="absolute top-2 left-2 bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface">${escapeHtml(item.category)}</div>
          ${!isAvailable ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center font-bold text-xs text-white">Stok Habis</div>' : ''}
        </div>
        <div class="p-2.5 flex flex-col flex-1 justify-between">
          <h3 class="font-semibold text-xs text-on-surface line-clamp-2 mb-1">${escapeHtml(item.name)}</h3>
          <div class="flex items-center justify-between mt-2 pt-1">
            <span class="font-bold text-xs text-on-surface">${formatRupiah(item.price)}</span>
            ${isAvailable ? `<button class="add-btn w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-95" data-id="${item.id}"><span class="material-symbols-outlined text-sm">add</span></button>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------
     CART LOGIC
  --------------------------------------------------------- */
  function addToCart(id) {
    const item = allMenu.find(m => m.id === id);
    if (!item || item.available === false) return;

    const exist = cart.find(c => c.id === id);
    if (exist) {
      exist.qty += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }
    renderCart();
    showToast(`${item.name} +1`);
  }

  function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(c => c.id !== id);
    }
    renderCart();
  }

  function renderCart() {
    const list = $('#cartList');
    const total = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    const count = cart.reduce((sum, c) => sum + c.qty, 0);

    if ($('#cartCount')) $('#cartCount').textContent = `${count} item`;
    if ($('#cartMiniTotal')) $('#cartMiniTotal').textContent = formatRupiah(total);
    if ($('#cartTotal')) $('#cartTotal').textContent = formatRupiah(total);

    if (list) {
      if (cart.length === 0) {
        list.innerHTML = '<p class="text-xs text-on-surface-variant text-center py-4">Belum ada menu dipilih.</p>';
      } else {
        list.innerHTML = cart.map(c => `
          <div class="flex justify-between items-center py-2 border-b border-outline-variant/40">
            <div class="flex-1">
              <h4 class="text-xs font-semibold text-on-surface">${escapeHtml(c.name)}</h4>
              <span class="text-[11px] text-on-surface-variant">${formatRupiah(c.price)}</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="qty-btn w-6 h-6 rounded-full border border-outline-variant flex items-center justify-center text-xs" data-id="${c.id}" data-delta="-1">-</button>
              <span class="text-xs font-semibold w-4 text-center">${c.qty}</span>
              <button class="qty-btn w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs" data-id="${c.id}" data-delta="1">+</button>
            </div>
          </div>
        `).join('');
      }
    }
    recalcChange();
  }

  function recalcChange() {
    const total = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    const paid = Number($('#paidInput')?.value) || 0;
    const change = paid - total;
    
    if ($('#changeAmount')) {
      $('#changeAmount').textContent = formatRupiah(Math.max(0, change));
    }
    if ($('#finishTransactionBtn')) {
      $('#finishTransactionBtn').disabled = !(cart.length > 0 && paid >= total && total > 0);
    }
  }

  async function finishTransaction() {
    const total = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    const paid = Number($('#paidInput')?.value) || 0;
    const customerName = $('#customerNameInput')?.value.trim() || 'Pelanggan Umum';

    if (cart.length === 0 || paid < total) return;

    const record = {
      datetime: new Date().toISOString(),
      cashier: activeCashier,
      customerName,
      items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
      total,
      paid,
      change: paid - total
    };

    try {
      await idbAdd(STORE_TRX, record);
      cart = [];
      if ($('#paidInput')) $('#paidInput').value = '';
      if ($('#customerNameInput')) $('#customerNameInput').value = '';
      renderCart();
      $('#checkoutBody').classList.add('hidden');
      $('#drawerArrow').style.transform = 'rotate(0deg)';
      showToast('Transaksi Berhasil ✓');
      await refreshReportIfVisible();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan transaksi');
    }
  }

  /* ---------------------------------------------------------
     TAB MENU MANAGEMENT
  --------------------------------------------------------- */
  async function refreshMenuCache() {
    allMenu = await idbGetAll(STORE_MENU);
    allMenu.sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderMenuTable() {
    const container = $('#menuTable');
    if (!container) return;
    if ($('#menuTotalCount')) $('#menuTotalCount').textContent = allMenu.length;

    container.innerHTML = allMenu.map(item => `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 flex items-center gap-3">
        <img src="${item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300'}" class="w-12 h-12 rounded object-cover bg-surface-container ${item.available === false ? 'grayscale' : ''}"/>
        <div class="flex-1">
          <h4 class="text-xs font-bold text-on-surface">${escapeHtml(item.name)}</h4>
          <span class="text-[10px] text-on-surface-variant">${escapeHtml(item.category)}</span>
          <div class="text-xs font-semibold text-primary mt-0.5">${formatRupiah(item.price)}</div>
        </div>
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="toggle-checkbox sr-only" data-id="${item.id}" ${item.available !== false ? 'checked' : ''}>
            <div class="w-9 h-5 bg-outline-variant rounded-full toggle-label"></div>
          </label>
          <button class="delete-menu-btn text-error p-1" data-id="${item.id}"><span class="material-symbols-outlined text-sm">delete</span></button>
        </div>
      </div>
    `).join('');
  }

  async function handleAddMenu(e) {
    e.preventDefault();
    const name = $('#menuName')?.value.trim();
    const category = $('#menuCategory')?.value;
    const price = Number($('#menuPrice')?.value);
    const image = $('#menuImage')?.value.trim() || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300';

    if (!name || !price) return;

    await idbAdd(STORE_MENU, { name, category, price, image, available: true });
    await refreshMenuCache();
    renderMenuTable();
    renderProducts();
    $('#menuForm').reset();
    showToast('Menu ditambahkan');
  }

  async function toggleMenuAvailability(id, available) {
    const item = allMenu.find(m => m.id === id);
    if (!item) return;
    item.available = available;
    await idbPut(STORE_MENU, item);
    await refreshMenuCache();
    renderProducts();
  }

  async function handleDeleteMenu(id) {
    await idbDelete(STORE_MENU, id);
    await refreshMenuCache();
    renderMenuTable();
    renderProducts();
    showToast('Menu dihapus');
  }

  /* ---------------------------------------------------------
     TAB LAPORAN
  --------------------------------------------------------- */
  async function renderReport() {
    const transactions = await idbGetAll(STORE_TRX);
    transactions.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    const totalOmset = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTrx = transactions.length;
    const totalItems = transactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0), 0);

    if ($('#statOmset')) $('#statOmset').textContent = formatRupiah(totalOmset);
    if ($('#statTrx')) $('#statTrx').textContent = totalTrx;
    if ($('#statItems')) $('#statItems').textContent = totalItems;

    // Terlaris
    const map = {};
    transactions.forEach(t => {
      t.items.forEach(i => {
        if (!map[i.name]) map[i.name] = 0;
        map[i.name] += i.qty;
      });
    });
    const bestSellers = Object.keys(map).map(k => ({ name: k, qty: map[k] })).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const bestEl = $('#bestSellerList');
    if (bestEl) {
      bestEl.innerHTML = bestSellers.map((b, idx) => `
        <div class="min-w-[140px] bg-surface-container-lowest border border-outline-variant p-3 rounded-lg flex flex-col justify-between">
          <div class="text-[10px] font-bold text-primary">#${idx + 1} TERLARIS</div>
          <div class="text-xs font-semibold text-on-surface line-clamp-2 my-1">${escapeHtml(b.name)}</div>
          <div class="text-[11px] text-on-surface-variant font-bold">${b.qty} Terjual</div>
        </div>
      `).join('') || '<p class="text-xs text-on-surface-variant">Belum ada data penjualan.</p>';
    }

    // Riwayat
    const historyEl = $('#historyList');
    if (historyEl) {
      historyEl.innerHTML = transactions.map(t => `
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 space-y-2">
          <div class="flex justify-between items-center border-b border-outline-variant/40 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-on-surface">#ORD-${t.id}</span>
              <span class="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded">${escapeHtml(t.cashier || 'K-1')}</span>
            </div>
            <span class="text-[11px] text-on-surface-variant">${formatDateTime(t.datetime)}</span>
          </div>
          <div class="text-xs text-on-surface font-semibold flex items-center gap-1">
            <span class="material-symbols-outlined text-sm text-on-surface-variant">person</span>
            ${escapeHtml(t.customerName || 'Pelanggan')}
          </div>
          <div class="text-[11px] text-on-surface-variant">
            ${t.items.map(i => `${escapeHtml(i.name)} x${i.qty}`).join(', ')}
          </div>
          <div class="grid grid-cols-3 gap-1 bg-surface-container-low p-2 rounded text-[11px] mt-1">
            <div><span class="block text-[9px] text-on-surface-variant">TOTAL</span><strong>${formatRupiah(t.total)}</strong></div>
            <div><span class="block text-[9px] text-on-surface-variant">DUIT</span>${formatRupiah(t.paid)}</div>
            <div class="text-right"><span class="block text-[9px] text-on-surface-variant">KEMBALI</span><strong class="text-primary">${formatRupiah(t.change)}</strong></div>
          </div>
        </div>
      `).join('') || '<p class="text-xs text-on-surface-variant text-center py-4">Belum ada riwayat transaksi.</p>';
    }
  }

  async function refreshReportIfVisible() {
    if (!$('#tab-laporan').classList.contains('hidden')) {
      await renderReport();
    }
  }

  /* ---------------------------------------------------------
     EVENT BINDINGS & NAV
  --------------------------------------------------------- */
  function switchTab(tabId) {
    $$('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== tabId));
    $$('.nav-btn').forEach(b => {
      const active = b.dataset.tab === tabId;
      b.classList.toggle('text-primary', active);
      b.classList.toggle('text-on-surface-variant', !active);
    });

    if ($('#headerSearchArea')) {
      $('#headerSearchArea').style.display = tabId === 'tab-kasir' ? 'block' : 'none';
    }

    if (tabId === 'tab-laporan') renderReport();
    if (tabId === 'tab-menu') renderMenuTable();
  }

  function bindEvents() {
    $('#cashierBadge')?.addEventListener('click', () => {
      activeCashier = activeCashier === 'K-1' ? 'K-2' : 'K-1';
      if ($('#cashierText')) $('#cashierText').textContent = activeCashier;
      showToast(`Kasir Aktif: ${activeCashier}`);
    });

    $('#searchInput')?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderProducts();
    });

    $('#categoryChips')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      activeCategory = chip.dataset.cat;
      $$('.chip').forEach(c => {
        c.classList.toggle('bg-primary', c === chip);
        c.classList.toggle('text-on-primary', c === chip);
        c.classList.toggle('bg-surface-container-lowest', c !== chip);
        c.classList.toggle('text-on-surface', c !== chip);
      });
      renderProducts();
    });

    $('#productGrid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-btn');
      if (btn) addToCart(Number(btn.dataset.id));
    });

    $('#checkoutToggle')?.addEventListener('click', () => {
      const body = $('#checkoutBody');
      const arrow = $('#drawerArrow');
      if (body) {
        body.classList.toggle('hidden');
        if (arrow) arrow.style.transform = body.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });

    $('#cartList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.qty-btn');
      if (btn) changeQty(Number(btn.dataset.id), Number(btn.dataset.delta));
    });

    $('#paidInput')?.addEventListener('input', recalcChange);
    $('#finishTransactionBtn')?.addEventListener('click', finishTransaction);

    $('#menuForm')?.addEventListener('submit', handleAddMenu);
    $('#menuTable')?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.delete-menu-btn');
      if (delBtn) handleDeleteMenu(Number(delBtn.dataset.id));

      const toggle = e.target.closest('.toggle-checkbox');
      if (toggle) toggleMenuAvailability(Number(toggle.dataset.id), toggle.checked);
    });

    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  async function init() {
    try {
      await openDatabase();
      await seedDummyData();
      await refreshMenuCache();
      renderProducts();
      renderCart();
      bindEvents();
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat database');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();