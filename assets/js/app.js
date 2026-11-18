/* CraftMart shared client logic: catalog helpers, cart, orders, UI behaviours, Kala chat */
(function () {
  const P = window.CM_PRODUCTS || [];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const img = p => 'assets/img/' + p.img + '.svg';

  /* ---------- cart ---------- */
  const DEFAULT_CART = [
    { id: 'pot', v: 1, qty: 1 }, { id: 'lamp', v: 0, qty: 1 }, { id: 'lace', v: 1, qty: 2 }
  ];
  function getCart() {
    let c = store.get('cm_cart', null);
    if (c === null) { c = DEFAULT_CART; store.set('cm_cart', c); }
    return c.filter(i => byId[i.id]);
  }
  function setCart(c) { store.set('cm_cart', c); updateBadges(); }
  function addToCart(id, v, qty) {
    const c = getCart(); const p = byId[id]; if (!p) return;
    v = v == null ? p.default : v; qty = qty || 1;
    const ex = c.find(i => i.id === id && i.v === v);
    if (ex) ex.qty += qty; else c.push({ id, v, qty });
    setCart(c); toast(p.name + ' added to cart', 'cart.html', 'View cart');
  }
  function lineOf(i) { const p = byId[i.id]; const variant = p.variants[i.v] || p.variants[0]; return { p, variant: variant[0], unit: variant[1], qty: i.qty, total: variant[1] * i.qty }; }
  function totals(c, promo) {
    const lines = c.map(lineOf);
    const sub = lines.reduce((a, l) => a + l.total, 0);
    const count = lines.reduce((a, l) => a + l.qty, 0);
    let disc = 0;
    if ((promo || '').toUpperCase() === 'CRAFT15') disc = Math.round(lines.filter(l => l.p.category === 'Brassware').reduce((a, l) => a + l.total, 0) * 0.15);
    const ship = sub === 0 || sub >= 10000 ? 0 : 450;
    return { lines, sub, count, disc, ship, total: sub - disc + ship };
  }
  function getPromo() { return store.get('cm_promo', 'CRAFT15'); }

  /* ---------- orders ---------- */
  const SEED_ORDERS = [
    { id: 'CM-24390', date: '09 Nov 2026', status: 'Shipped', note: 'Arrives tomorrow', items: [{ id: 'mask', v: 0, qty: 1 }], total: 8900, courier: 'Domex DX-55098120' },
    { id: 'CM-23988', date: '28 Oct 2026', status: 'Delivered', note: 'Delivered 01 Nov', items: [{ id: 'batik', v: 0, qty: 1 }, { id: 'cushion', v: 0, qty: 1 }], total: 6850, courier: 'Pronto PR-7720931' },
    { id: 'CM-23611', date: '12 Oct 2026', status: 'Delivered', note: 'Delivered 16 Oct', items: [{ id: 'bowl', v: 0, qty: 2 }], total: 3900, courier: 'Domex DX-54011873' },
    { id: 'CM-23204', date: '24 Sep 2026', status: 'Cancelled', note: 'Refunded 25 Sep', items: [{ id: 'elephant', v: 0, qty: 1 }], total: 5600, courier: '' },
    { id: 'CM-22870', date: '02 Sep 2026', status: 'Delivered', note: 'Delivered 06 Sep', items: [{ id: 'basket', v: 0, qty: 1 }, { id: 'lacquer', v: 0, qty: 1 }], total: 7550, courier: 'Domex DX-52230017' }
  ];
  function getOrders() { return store.get('cm_orders', []).concat(SEED_ORDERS); }
  function saveOrder(o) { const o2 = store.get('cm_orders', []); o2.unshift(o); store.set('cm_orders', o2); }
  function findOrder(id) { return getOrders().find(o => o.id === id); }

  /* ---------- UI ---------- */
  function updateBadges() {
    const n = getCart().reduce((a, i) => a + i.qty, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
  }
  let toastTimer;
  function toast(msg, href, linkText) {
    let t = document.getElementById('cm-toast');
    if (!t) { t = document.createElement('div'); t.id = 'cm-toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (href ? ' <a href="' + href + '">' + esc(linkText) + '</a>' : '');
    t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }
  function initTabs(root) {
    (root || document).querySelectorAll('[data-tab-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = btn.dataset.tabGroup, i = btn.dataset.tab;
        document.querySelectorAll('[data-tab-group="' + g + '"]').forEach(b => { b.classList.toggle('on', b.dataset.tab === i); b.setAttribute('aria-selected', b.dataset.tab === i); });
        document.querySelectorAll('[data-pane-group="' + g + '"]').forEach(p => { p.hidden = p.dataset.pane !== i; });
      });
    });
  }
  function initCommon() {
    updateBadges();
    initTabs();
    document.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => { t.classList.toggle('off'); t.setAttribute('aria-checked', !t.classList.contains('off')); }));
    document.querySelectorAll('[data-opt-group]').forEach(o => o.addEventListener('click', () => {
      document.querySelectorAll('[data-opt-group="' + o.dataset.optGroup + '"]').forEach(x => x.classList.toggle('on', x === o));
    }));
    document.querySelectorAll('[data-chip-group]').forEach(o => o.addEventListener('click', () => {
      document.querySelectorAll('[data-chip-group="' + o.dataset.chipGroup + '"]').forEach(x => x.classList.toggle('on', x === o));
    }));
    document.querySelectorAll('[data-chip-toggle]').forEach(o => o.addEventListener('click', () => o.classList.toggle('on')));
    document.querySelectorAll('[data-toast]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); toast(b.dataset.toast); }));
    document.querySelectorAll('.fav').forEach(f => f.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); f.classList.toggle('on'); toast(f.classList.contains('on') ? 'Saved to wishlist' : 'Removed from wishlist'); }));
    const mb = document.querySelector('.menu-btn'), dr = document.getElementById('drawer');
    if (mb && dr) {
      mb.addEventListener('click', () => { dr.hidden = false; mb.setAttribute('aria-expanded', 'true'); });
      dr.addEventListener('click', e => { if (e.target === dr || e.target.closest('[data-close]')) { dr.hidden = true; mb.setAttribute('aria-expanded', 'false'); } });
    }
    document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); addToCart(b.dataset.add); }));
    initWidget();
  }

  /* ---------- Kala chat ---------- */
  const OFFLINE = {
    gift: 'Here are handmade gifts under Rs 5,000 that customers love: [product:pot] [product:basket] [product:bowl] All can be gift-wrapped for Rs 250.',
    track: 'You can see live status for every order under **My orders**. Standard delivery takes 3–5 working days island-wide.',
    brass: 'Ajith Kumara of Kandy Brass Works hand-casts pahana lamps. Use code **CRAFT15** for 15% off brassware this month. [product:lamp]',
    deliver: 'Standard delivery is 3–5 working days to all 25 districts (4–6 days to the Northern Province). It\'s free over Rs 10,000, otherwise Rs 450. Express (1–2 days) is Rs 950 in the Western and Central provinces.',
    pay: 'We accept Visa, Mastercard and Amex, LankaQR, bank transfer, and cash on delivery for orders up to Rs 25,000.',
    def: 'I can help with products, categories, artisans, orders, payments and delivery. Could you tell me a bit more?'
  };
  function offlineReply(q) {
    q = q.toLowerCase();
    if (/gift|present/.test(q)) return OFFLINE.gift;
    if (/track|order|cm-/.test(q)) return OFFLINE.track;
    if (/brass|lamp|pahana/.test(q)) return OFFLINE.brass;
    if (/deliver|ship|jaffna|days/.test(q)) return OFFLINE.deliver;
    if (/pay|card|qr|cash/.test(q)) return OFFLINE.pay;
    return OFFLINE.def;
  }
  function orderContext() {
    return getOrders().slice(0, 8).map(o => ({ id: o.id, date: o.date, status: o.status, note: o.note, total: 'Rs ' + fmt(o.total), courier: o.courier || '', items: o.items.map(i => { const l = lineOf(i); return l.qty + ' × ' + l.p.name + ' (' + l.variant + ') by ' + l.p.artisan; }) }));
  }
  async function askKala(history) {
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-16), orders: orderContext(), cart: getCart().map(i => { const l = lineOf(i); return l.qty + ' × ' + l.p.name; }) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.reply) throw new Error(d.error || ('HTTP ' + r.status));
      return { text: d.reply, live: true };
    } catch (e) {
      console.warn('Kala offline fallback:', e.message);
      const last = history.filter(m => m.role === 'user').slice(-1)[0];
      return { text: offlineReply(last ? last.text : ''), live: false };
    }
  }
  function miniCard(p) {
    return '<a class="minip" href="product.html?id=' + p.id + '"><img src="' + img(p) + '" alt=""><span><strong style="font-size:13.5px;display:block">' + esc(p.name) + '</strong><span class="price" style="font-size:14px">Rs ' + fmt(p.price) + '</span></span></a>';
  }
  function renderRich(text) {
    const cards = [];
    let t = String(text).replace(/\[product:([a-z]+)\]/g, (m, id) => { if (byId[id] && !cards.includes(id)) cards.push(id); return ''; });
    const lines = esc(t.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').split('\n');
    let out = '', blank = false;
    lines.forEach(line => {
      const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (m) { out += '<span class="li">' + m[1] + '</span>'; blank = false; }
      else if (!line.trim()) { blank = true; }
      else { out += (out ? (blank ? '<span class="gap"></span>' : '<br>') : '') + line; blank = false; }
    });
    t = out;
    return { html: t, cards: cards.map(id => miniCard(byId[id])).join('') };
  }
  function botBubble(text, opts) {
    opts = opts || {};
    const r = renderRich(text);
    return '<div class="row msg-row" style="gap:10px;align-items:flex-start"><span class="bot-av sm">' + BOT_ICON + '</span><div style="display:flex;flex-direction:column;gap:10px;max-width:min(86%,600px)"><div class="bub-bot" style="max-width:none">' + r.html + (opts.offline ? '<div class="bub-meta">Offline demo answer · connect the Gemini API key for live replies</div>' : '') + '</div>' + (r.cards ? '<div class="row" style="gap:10px;flex-wrap:wrap">' + r.cards + '</div>' : '') + '</div></div>';
  }
  function meBubble(text) { return '<div class="bub-me">' + esc(text) + '</div>'; }
  const TYPING = '<div class="row typing-row" style="gap:10px;align-items:flex-end"><span class="bot-av sm">__BOT__</span><div class="bub-bot typing" aria-label="Kala is typing"><span></span><span></span><span></span></div><span class="muted" style="font-size:12.5px">Kala is typing…</span></div>';
  let BOT_ICON = '';

  function initWidget() {
    const w = document.getElementById('kala-widget'); if (!w) return;
    BOT_ICON = w.dataset.boticon ? decodeURIComponent(w.dataset.boticon) : '';
    const panel = w.querySelector('.cw-panel'), fab = w.querySelector('.cw-fab'), body = w.querySelector('.cw-msgs'), form = w.querySelector('form'), input = form.querySelector('input');
    let hist = []; try { hist = JSON.parse(sessionStorage.getItem('cm_widget') || '[]'); } catch (e) {}
    let busy = false;
    function render() {
      body.innerHTML = hist.map(m => m.role === 'user' ? meBubble(m.text) : botBubble(m.text, { offline: m.offline })).join('') + (busy ? TYPING.replace('__BOT__', BOT_ICON) : '');
      w.querySelector('.sugg').hidden = hist.length > 0;
      const sc = w.querySelector('.cw-body'); sc.scrollTop = sc.scrollHeight;
      try { sessionStorage.setItem('cm_widget', JSON.stringify(hist)); } catch (e) {}
    }
    async function send(q) {
      q = (q || '').trim(); if (!q || busy) return;
      hist.push({ role: 'user', text: q }); busy = true; render();
      const r = await askKala(hist.map(m => ({ role: m.role, text: m.text })));
      busy = false; hist.push({ role: 'model', text: r.text, offline: !r.live }); render();
    }
    fab.addEventListener('click', () => { panel.hidden = !panel.hidden; fab.setAttribute('aria-expanded', !panel.hidden); if (!panel.hidden) { render(); input.focus(); } });
    w.querySelector('[data-close]').addEventListener('click', () => { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); });
    form.addEventListener('submit', e => { e.preventDefault(); const q = input.value; input.value = ''; send(q); });
    w.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', () => send(b.dataset.ask)));
    render();
  }

  window.CM = { P, byId, fmt, esc, img, store, getCart, setCart, addToCart, lineOf, totals, getPromo, getOrders, saveOrder, findOrder, toast, updateBadges, initTabs,
    askKala, botBubble, meBubble, typingHtml: () => TYPING.replace('__BOT__', BOT_ICON), setBotIcon: s => { BOT_ICON = s; }, renderRich, miniCard };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCommon); else initCommon();
})();
