/* =========================================================
   FLUJO 3 · Proceso de compra
   Producto → Sucursal → Entrega → Pago (QR | Contraentrega |
   Crédito Cooltiva) → Confirmar → Pedido realizado
   ========================================================= */
(function () {
  const e = C.esc;
  const A = C.actions;
  const STEPS = ['producto', 'sucursal', 'entrega', 'pago', 'confirmar'];
  const LABELS = ['Producto', 'Sucursal', 'Entrega', 'Pago', 'Confirmar'];
  const PAGOS = { credito: 'Crédito Cooltiva', qr: 'Pago con QR', contraentrega: 'Contraentrega' };
  C.PAGOS = PAGOS;

  /* ---------- Cálculos ---------- */
  C.itemCalc = function (id) {
    const p = C.PRODUCTS[id], it = C.S.cart.items[id] || C.emptyItem();
    const qty = parseFloat(String(it.qty).replace(',', '.')) || 0;
    const kg = qty * (it.unit === '@' ? C.KG_POR_ARROBA : 1);
    const size = it.size ? p.sizes[it.size] : null;
    const base = size ? size.price : 0;
    const serv = it.servicio === 'Lavada' ? p.servicioLavada : 0;
    const gar = it.garantia === 'con' ? base * p.garantiaPct / 100 : 0;
    const complete = !!(it.size && qty > 0 && it.servicio && it.garantia);
    const parts = [it.size, it.servicio, it.garantia ? (it.garantia === 'con' ? 'Con reposición' : 'Sin reposición') : ''].filter(Boolean);
    return {
      p: p, it: it, size: size, qty: qty, kg: kg, base: base, serv: serv, gar: gar,
      perKg: base + serv + gar, total: size ? kg * (base + serv + gar) : 0,
      complete: complete, config: parts.join(' · '),
      qtyLabel: qty > 0 ? (String(it.qty).replace('.', ',') + (it.unit === '@' ? ' @' : ' kg')) : ''
    };
  };
  C.cartTotal = function () {
    return C.S.cart.selected.reduce(function (sum, id) { return sum + C.itemCalc(id).total; }, 0);
  };
  C.deliveryDates = function () {
    const out = [], d = new Date(C.DEMO_TODAY);
    while (out.length < 12) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) out.push(C.isoDate(d));
    }
    return out;
  };
  function recepsOf(sucursalId) {
    return C.S.account.recepcionistas.filter(function (r) { return r.sucursalId === sucursalId; });
  }

  /* ---------- Guardas y página ---------- */
  function guard(idx) {
    if (!C.S.session.loggedIn) return { redirect: '/acceso?modo=login' };
    if (!C.S.cart.selected.length) return { redirect: '/cuenta/tienda' };
    if (idx > C.S.cart.maxStep) return { redirect: '/compra/' + STEPS[C.S.cart.maxStep] };
    return null;
  }
  function stepPage(idx, html, o) {
    o = o || {};
    const withSummary = idx < 4;
    return {
      layout: 'wizard', title: LABELS[idx], logoHref: '#/cuenta/tienda',
      width: withSummary ? 'wz-w-wide' : (o.width || 'wz-w-mid'),
      tabs: C.buildTabs(LABELS, idx, C.S.cart.maxStep, 'compraTab'),
      html: withSummary ? '<div class="buy-grid"><div class="buy-main">' + html + '</div><aside class="summary hide-m" id="summary" aria-label="Tu pedido">' + C.summaryHTML() + '</aside></div>' : html,
      summaryBar: withSummary ? '<div class="sumbar show-m" id="sumbar">' + C.sumbarHTML() + '</div>' : '',
      bar: o.bar || {
        left: C.btn('Atrás', { action: 'compraBack', arg: idx }),
        right: C.btn('Siguiente', { primary: true, action: 'compraNext', arg: idx })
      },
      mount: o.mount
    };
  }
  A.compraTab = function (el) { C.go('/compra/' + STEPS[Number(el.dataset.arg)]); };
  A.compraBack = function (el) {
    const i = Number(el.dataset.arg);
    C.go(i === 0 ? '/cuenta/tienda' : '/compra/' + STEPS[i - 1]);
  };
  function advance(idx) {
    C.S.cart.maxStep = Math.max(C.S.cart.maxStep, idx + 1);
    C.save();
    C.go('/compra/' + STEPS[idx + 1]);
  }
  A.compraNext = function (el) {
    const idx = Number(el.dataset.arg);
    const v = VALIDATE[idx]();
    if (v === true) advance(idx);
  };

  /* ---------- Barra lateral "Tu pedido" ---------- */
  C.summaryHTML = function () {
    const cart = C.S.cart;
    const items = cart.selected.map(function (id) {
      const c = C.itemCalc(id);
      return '<li class="sum-item"><span class="ph ph-thumb" aria-hidden="true"></span><div class="sum-item-main"><strong>' + e(c.p.name) + '</strong>' +
        (c.complete ? '<span class="muted small">' + e(c.config) + '</span><span class="muted small">' + e(c.qtyLabel) + '</span>' : '<span class="muted small">Por configurar</span>') +
        '</div><strong class="sum-price">' + (c.complete ? C.bs(c.total) : '') + '</strong></li>';
    }).join('');
    const s = C.sucById(cart.sucursalId), r = C.recById(cart.recepId);
    const entrega = cart.fecha && cart.franja && r ? C.fmtDay(cart.fecha) + ' · ' + e(cart.franja) + '<br>' + e(r.nombre) : '';
    const row = function (k, v) { return '<div class="sum-row"><span class="muted">' + k + '</span><span class="sum-val' + (v ? '' : ' is-empty') + '">' + (v || 'Por elegir') + '</span></div>'; };
    return '<h2 class="h3 sum-title">Tu pedido</h2><ul class="sum-items">' + items + '</ul>' +
      row('Sucursal', s ? e(s.dir) : '') + row('Entrega', entrega) + row('Pago', cart.pago ? PAGOS[cart.pago] : '') +
      '<div class="sum-total"><span>Total</span><strong>' + C.bs(C.cartTotal()) + '</strong></div>';
  };
  C.sumbarHTML = function () {
    const n = C.S.cart.selected.length;
    return '<button type="button" class="sumbar-btn" data-action="sheet" data-arg="open" aria-haspopup="dialog">' +
      '<span><strong>Tu pedido</strong><span class="muted small"> · ' + n + (n === 1 ? ' producto' : ' productos') + '</span></span>' +
      '<span class="sumbar-total"><strong>' + C.bs(C.cartTotal()) + '</strong>' + C.icon('chevUp', 18) + '</span></button>';
  };
  C.live.summary = function () {
    const s = document.getElementById('summary'); if (s) s.innerHTML = C.summaryHTML();
    const b = document.getElementById('sumbar'); if (b) b.innerHTML = C.sumbarHTML();
  };
  C.renderSheet = function () {
    if (!C.ui.sheet) return '';
    return '<div class="overlay" data-action="sheet" data-arg="close"></div><div class="sheet" role="dialog" aria-label="Tu pedido">' +
      '<div class="sheet-grip" aria-hidden="true"></div><button type="button" class="icon-btn sheet-x" aria-label="Cerrar" data-action="sheet" data-arg="close">' + C.icon('x', 18) + '</button>' +
      '<div class="summary summary-sheet">' + C.summaryHTML() + '</div></div>';
  };
  A.sheet = function (el) { C.ui.sheet = el.dataset.arg === 'open'; C.renderOverlays(); };

  /* =============== Tab 1 · Producto =============== */
  function sizeInfo(c) {
    if (!c.size) return '<div class="size-info is-empty"><span class="size-dot" style="--s:.6" aria-hidden="true"></span><p class="muted small">Elige un tamaño para ver su referencia: diámetro, peso y a qué se parece.</p></div>';
    return '<div class="size-info"><span class="size-dot" style="--s:' + c.size.scale + '" aria-hidden="true"></span><div>' +
      '<p class="small"><strong>' + e(c.it.size) + '</strong> <span class="muted">· ' + e(c.size.tag) + '</span></p>' +
      '<p class="size-dia">' + e(c.size.dia) + '</p>' +
      '<p class="muted small">' + e(c.size.peso) + ' · ' + e(c.size.unid) + '</p>' +
      '<p class="small"><strong>' + e(c.size.ref) + '</strong></p></div></div>';
  }

  /* Estado de cada decisión del producto */
  function stepsDone(c) {
    return { size: !!c.it.size, qty: c.qty > 0, servicio: !!c.it.servicio, garantia: !!c.it.garantia };
  }
  const STEP_NAMES = { size: 'tamaño', qty: 'cantidad', servicio: 'servicio de planta', garantia: 'garantía' };
  function progressLabel(c) {
    const d = stepsDone(c), n = Object.keys(d).filter(function (k) { return d[k]; }).length;
    return n === 4 ? C.icon('check', 14) + ' Listo' : n + ' de 4 elegidos';
  }
  /* Pie: desglose del precio por kg y subtotal */
  function pcardFoot(c) {
    const d = stepsDone(c);
    const missing = Object.keys(d).filter(function (k) { return !d[k]; }).map(function (k) { return STEP_NAMES[k]; });
    let breakdown;
    if (c.size) {
      breakdown = C.bsKg(c.base) + ' base' +
        (c.serv ? ' + ' + C.bsKg(c.serv) + ' lavada' : '') +
        (c.gar ? ' + ' + C.bsKg(c.gar) + ' reposición' : '') +
        ' = <strong>' + C.bsKg(c.perKg) + '/kg</strong>' +
        (c.kg > 0 ? ' × ' + C.thousands(c.kg) + ' kg' : '');
    } else {
      breakdown = 'El precio por kg depende del tamaño que elijas.';
    }
    const missingTxt = missing.length
      ? '<p class="pfoot-missing">' + C.icon('alert', 14) + '<span>Falta elegir: ' + (missing.length > 1 ? missing.slice(0, -1).join(', ') + ' y ' + missing[missing.length - 1] : missing[0]) + '</span></p>'
      : '';
    return '<div class="pfoot-left"><p class="pfoot-break">' + breakdown + '</p>' + missingTxt + '</div>' +
      '<div class="pfoot-total"><span class="muted small">Subtotal</span><strong>' + (c.complete ? C.bs(c.total) : '—') + '</strong></div>';
  }
  function pstep(id, key, title, help, done, body, errKey) {
    return '<section class="pstep' + (done ? ' is-done' : '') + C.errCls(errKey) + '" id="pstep-' + key + '-' + id + '">' +
      '<div class="pstep-head"><span class="pstep-mark" aria-hidden="true">' + C.icon('check', 13) + '</span>' +
      '<div><h3 class="pstep-title">' + title + '</h3><p class="pstep-help">' + help + '</p></div></div>' +
      '<div class="pstep-body">' + body + C.err(errKey) + '</div></section>';
  }
  function opt(id, field, value, label, price, desc, selected) {
    return '<div class="choice opt' + (selected ? ' is-selected' : '') + '" role="radio" tabindex="0" aria-checked="' + selected + '" data-action="setItem" data-arg="' + id + '|' + field + '|' + value + '">' +
      '<span class="radio" aria-hidden="true"></span><span class="opt-body"><span class="opt-top"><span class="choice-label">' + e(label) + '</span>' +
      '<span class="opt-price">' + price + '</span></span><span class="choice-sub">' + e(desc) + '</span></span></div>';
  }

  function productCard(id, i, n) {
    const c = C.itemCalc(id), open = C.S.cart.open === id;
    const eyebrow = e(c.p.category) + ' · Producto ' + (i + 1) + ' de ' + n;
    if (!open) {
      return '<article class="card pcard is-collapsed" data-action="openProd" data-arg="' + id + '" role="button" tabindex="0" aria-expanded="false">' +
        '<span class="ph ph-thumb" aria-hidden="true"></span><div class="pcard-mini"><p class="eyebrow">' + eyebrow + '</p><h2 class="h3">' + e(c.p.name) + '</h2>' +
        '<p class="pcard-status' + (c.complete ? ' is-done' : '') + '">' + (c.complete ? e(c.config) + ' · ' + e(c.qtyLabel) : 'Por configurar') + '</p></div>' +
        (c.complete ? '<strong class="pcard-sub">' + C.bs(c.total) + '</strong>' : '<span class="pprog">' + progressLabel(c) + '</span>') +
        '<span class="pcard-chev">' + C.icon('chevDown', 20) + '</span></article>';
    }
    const it = c.it, p = c.p, d = stepsDone(c);
    const chips = C.SIZE_ORDER.map(function (s) {
      return '<button type="button" class="chip' + (it.size === s ? ' is-on' : '') + '" aria-pressed="' + (it.size === s) + '" data-action="setItem" data-arg="' + id + '|size|' + s + '">' + s + '</button>';
    }).join('');
    const garPerKg = c.size ? ' · +' + C.bsKg(c.base * p.garantiaPct / 100) + '/kg' : '';
    const kgHint = it.unit === '@' && c.qty > 0 ? '= ' + C.thousands(c.kg) + ' kg' : '1 @ = 11,5 kg';
    const minPrice = Math.min.apply(null, C.SIZE_ORDER.map(function (s) { return p.sizes[s].price; }));
    const priceLine = c.size ? C.bsKg(c.base) + ' <span class="muted">/ kg · ' + e(it.size) + '</span>' : '<span class="muted">Desde ' + C.bsKg(minPrice) + ' / kg</span>';

    const body =
      pstep(id, 'size', 'Tamaño comercial', 'Calibre del producto, de menor a mayor.', d.size,
        '<div class="size-row"><div class="chips focus-target" tabindex="-1" role="group" aria-label="Tamaño comercial">' + chips + '</div>' + sizeInfo(c) + '</div>', 'p.' + id + '.size') +
      pstep(id, 'qty', '<label for="qty-' + id + '">Cantidad</label>', 'En arrobas (@) o en kilos.', d.qty,
        '<div class="qty-row"><input id="qty-' + id + '" class="input qty-input" data-bind="cart.items.' + id + '.qty" data-err="cart.items.' + id + '.qty" data-live="summary qtyHint" data-numeric inputmode="decimal" placeholder="0" value="' + e(it.qty) + '">' +
        C.segmented({ value: it.unit, action: 'setUnit', aria: 'Unidad', options: [{ value: '@', label: '@' }, { value: 'kg', label: 'kg' }] }).replace(/data-arg="/g, 'data-arg="' + id + '|') +
        '<span class="hint qty-hint" id="qty-hint-' + id + '">' + kgHint + '</span></div>', 'cart.items.' + id + '.qty') +
      pstep(id, 'servicio', 'Servicio de planta', 'Cómo preparamos el producto antes de enviarlo.', d.servicio,
        '<div class="opt-grid focus-target" role="radiogroup" aria-label="Servicio de planta" tabindex="-1">' +
        opt(id, 'servicio', 'Natural', 'Natural', 'Sin recargo', p.servicioDesc.Natural, it.servicio === 'Natural') +
        opt(id, 'servicio', 'Lavada', 'Lavada', '+' + C.bsKg(p.servicioLavada) + '/kg', p.servicioDesc.Lavada, it.servicio === 'Lavada') +
        '</div>', 'p.' + id + '.servicio') +
      pstep(id, 'garantia', 'Garantía de reposición', 'Qué pasa si algo no cumple el estándar.', d.garantia,
        '<div class="opt-grid focus-target" role="radiogroup" aria-label="Garantía de reposición" tabindex="-1">' +
        opt(id, 'garantia', 'con', 'Con reposición', '+' + String(p.garantiaPct).replace('.', ',') + '%' + garPerKg, C.GARANTIA_DESC.con, it.garantia === 'con') +
        opt(id, 'garantia', 'sin', 'Sin reposición', 'Sin recargo', C.GARANTIA_DESC.sin, it.garantia === 'sin') +
        '</div>' +
        (it.garantia === 'con' ? '<ul class="benefits reveal">' + C.GARANTIA_BENEFICIOS.map(function (b) { return '<li><span class="box is-on" aria-hidden="true">' + C.icon('check', 13) + '</span>' + e(b) + '</li>'; }).join('') + '</ul>' : ''),
        'p.' + id + '.garantia');

    return '<article class="card card-strong pcard is-open">' +
      '<header class="pcard-head">' + C.ph('Foto ' + p.name.toLowerCase(), 'pcard-photo') +
      '<div class="pcard-title"><p class="eyebrow">' + eyebrow + '</p><h2 class="h2">' + e(p.fullName) + '</h2><p class="pcard-price">' + priceLine + '</p></div>' +
      '<span class="pprog' + (c.complete ? ' is-done' : '') + '" id="pprog-' + id + '">' + progressLabel(c) + '</span>' +
      (n > 1 ? '<button type="button" class="icon-btn pcard-toggle" aria-label="Plegar producto" aria-expanded="true" data-action="openProd" data-arg="">' + C.icon('chevUp', 20) + '</button>' : '') +
      '</header>' +
      '<div class="pcard-steps">' + body + '</div>' +
      '<footer class="pcard-foot" id="pfoot-' + id + '" aria-live="polite">' + pcardFoot(c) + '</footer></article>';
  }

  /* Refresco parcial al escribir la cantidad (sin perder el foco) */
  C.live.qtyHint = function (el) {
    const id = el.dataset.bind.split('.')[2];
    const c = C.itemCalc(id);
    const h = document.getElementById('qty-hint-' + id);
    if (h) h.textContent = c.it.unit === '@' && c.qty > 0 ? '= ' + C.thousands(c.kg) + ' kg' : '1 @ = 11,5 kg';
    const f = document.getElementById('pfoot-' + id); if (f) f.innerHTML = pcardFoot(c);
    const pr = document.getElementById('pprog-' + id); if (pr) { pr.innerHTML = progressLabel(c); pr.classList.toggle('is-done', c.complete); }
    const st = document.getElementById('pstep-qty-' + id); if (st) st.classList.toggle('is-done', c.qty > 0);
  };

  C.route('/compra/producto', function () {
    const g = guard(0); if (g) return g;
    const sel = C.S.cart.selected;
    const html = '<h1 class="h1 wz-title">Configura tu pedido</h1><div class="pcards">' +
      sel.map(function (id, i) { return productCard(id, i, sel.length); }).join('') + '</div>';
    return stepPage(0, html);
  });

  A.openProd = function (el) { C.set(function (S) { S.cart.open = el.dataset.arg || null; }); };
  A.setItem = function (el) {
    const a = el.dataset.arg.split('|');
    C.set(function (S) {
      S.cart.items[a[0]][a[1]] = a[2];
      delete C.ui.errors['p.' + a[0] + '.' + a[1]];
    });
  };
  A.setUnit = function (el) {
    const a = el.dataset.arg.split('|');
    C.set(function (S) { S.cart.items[a[0]].unit = a[1]; });
  };

  const VALIDATE = [];
  VALIDATE[0] = function () {
    const cart = C.S.cart;
    const order = cart.selected.slice();
    // valida primero el producto abierto
    if (cart.open) { order.splice(order.indexOf(cart.open), 1); order.unshift(cart.open); }
    for (const id of order) {
      const c = C.itemCalc(id);
      if (c.complete) continue;
      if (cart.open !== id) {
        cart.open = id; C.ui.errors = {}; C.set();
        C.toast('Ahora configura ' + c.p.name.toLowerCase());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
      }
      const err = {};
      if (!c.it.size) err['p.' + id + '.size'] = 'Elige un tamaño comercial';
      if (!(c.qty > 0)) err['cart.items.' + id + '.qty'] = 'Escribe la cantidad';
      if (!c.it.servicio) err['p.' + id + '.servicio'] = 'Elige el servicio de planta';
      if (!c.it.garantia) err['p.' + id + '.garantia'] = 'Elige si quieres garantía de reposición';
      return C.fail(err);
    }
    return true;
  };

  /* =============== Tab 2 · Sucursal =============== */
  C.route('/compra/sucursal', function () {
    const g = guard(1); if (g) return g;
    const cart = C.S.cart, list = C.S.account.sucursales;
    const cards = list.map(function (s) {
      const on = cart.sucursalId === s.id;
      return '<div class="choice suc-choice' + (on ? ' is-selected' : '') + '" role="radio" tabindex="0" aria-checked="' + on + '" data-action="pickSuc" data-arg="' + s.id + '">' +
        '<div class="suc-choice-map">' + C.map({ small: true, pin: s.pin }) + '</div>' +
        '<div class="choice-body"><span class="choice-label h3">' + e(s.dir) + '</span><span class="muted">' + e(s.ciudad) + '</span>' +
        '<span>' + C.link('Editar', 'openModal', 'suc:' + s.id) + '</span></div><span class="radio" aria-hidden="true"></span></div>';
    }).join('');
    const html = '<h1 class="h1 wz-title">¿A qué sucursal enviamos?</h1>' +
      '<div class="field' + C.errCls('sucursal') + '"><div class="stack focus-target" role="radiogroup" tabindex="-1">' + cards + '</div>' + C.err('sucursal') + '</div>' +
      '<button type="button" class="btn btn-dashed mt-16" data-action="openModal" data-arg="suc:new">+ Crear sucursal</button>';
    return stepPage(1, html);
  });
  C.selectSucursal = function (id) {
    const cart = C.S.cart;
    cart.sucursalId = id;
    const r = C.recById(cart.recepId);
    if (!r || r.sucursalId !== id) cart.recepId = null;
    const rs = recepsOf(id);
    if (!cart.recepId && rs.length === 1) cart.recepId = rs[0].id;
  };
  A.pickSuc = function (el) { C.set(function () { C.selectSucursal(el.dataset.arg); delete C.ui.errors.sucursal; }); };
  VALIDATE[1] = function () {
    if (!C.sucById(C.S.cart.sucursalId)) return C.fail({ sucursal: 'Elige la sucursal donde recibes el pedido' });
    return true;
  };

  /* =============== Tab 3 · Entrega =============== */
  C.route('/compra/entrega', function () {
    const g = guard(2); if (g) return g;
    const cart = C.S.cart, suc = C.sucById(cart.sucursalId);
    if (!suc) return { redirect: '/compra/sucursal' };
    // Todo precargado: si la sucursal tiene un único recepcionista, queda elegido
    const only = recepsOf(suc.id);
    if (!C.recById(cart.recepId) && only.length === 1) { cart.recepId = only[0].id; C.save(); }
    const dates = C.deliveryDates().map(function (iso) {
      const d = C.parseDate(iso), on = cart.fecha === iso;
      return '<button type="button" class="date' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-action="pickDate" data-arg="' + iso + '">' +
        '<span class="date-dow">' + C.DIAS[d.getDay()] + '</span><strong class="date-num">' + d.getDate() + '</strong><span class="date-mon">' + C.MESES[d.getMonth()] + '</span></button>';
    }).join('');
    const rs = recepsOf(suc.id);
    const recCards = rs.length ? '<div class="choice-grid cols-2 focus-target" role="radiogroup" tabindex="-1">' + rs.map(function (r) {
      const on = cart.recepId === r.id;
      return '<div class="choice rec-choice' + (on ? ' is-selected' : '') + '" role="radio" tabindex="0" aria-checked="' + on + '" data-action="pickRec" data-arg="' + r.id + '">' +
        '<span class="radio" aria-hidden="true"></span><span class="choice-body"><span class="choice-label">' + e(r.nombre) + '</span>' +
        '<span class="choice-sub">' + e(r.tel || 'Sin teléfono') + '</span><span class="choice-sub">Sucursal: ' + e(suc.dir) + '</span></span>' +
        '<span class="rec-edit">' + C.link('Editar', 'openModal', 'rec:' + r.id) + '</span></div>';
    }).join('') + '</div>'
      : '<div class="empty-inline card card-pad"><p class="muted">Esta sucursal todavía no tiene recepcionistas.</p></div>';
    const html = '<h1 class="h1 wz-title">¿Cuándo y quién recibe?</h1>' +
      '<div class="field' + C.errCls('fecha') + '"><span class="label">Día de entrega</span><div class="dates">' +
      '<button type="button" class="icon-btn date-arrow hide-m" aria-label="Fechas anteriores" data-action="dateScroll" data-arg="-1">' + C.icon('chevLeft', 18) + '</button>' +
      '<div class="date-strip focus-target" id="date-strip" tabindex="-1">' + dates + '</div>' +
      '<button type="button" class="icon-btn date-arrow hide-m" aria-label="Más fechas" data-action="dateScroll" data-arg="1">' + C.icon('chevRight', 18) + '</button></div>' + C.err('fecha') + '</div>' +
      franjaField(cart) +
      '<div class="field mt-24' + C.errCls('recep') + '"><div class="row-between"><span class="label">Recepción</span>' + C.link('+ Agregar recepcionista', 'openModal', 'rec:new') + '</div>' + recCards + C.err('recep') + '</div>' +
      '<div class="mt-24">' + C.field({ label: 'Instrucciones de preparación y entrega (opcional)', bind: 'cart.instrucciones', textarea: true, rows: 3, placeholder: 'Ej. Entregar por la puerta de servicio. La papa lavada en bolsas de 1 @.' }) + '</div>';
    return stepPage(2, html, {
      mount: function () {
        const strip = document.getElementById('date-strip');
        const on = strip && strip.querySelector('.is-on');
        if (on) strip.scrollLeft = on.offsetLeft - strip.offsetLeft - 8;
      }
    });
  });
  /* Franja horaria: dos selectores por hora en punto, mínimo 1 hora */
  function hourSelect(bind, id, label, options, value) {
    return '<div class="franja-col"><label class="hint" for="' + id + '">' + label + '</label><div class="select-wrap">' +
      '<select id="' + id + '" class="input select" data-bind="' + bind + '" data-err="franja" data-live="franja summary" data-rerender>' +
      '<option value="">--:--</option>' + options.map(function (h) { return '<option' + (h === value ? ' selected' : '') + '>' + h + '</option>'; }).join('') +
      '</select>' + C.icon('chevDown', 16) + '</div></div>';
  }
  function franjaField(cart) {
    const desde = cart.franjaDesde || '', hasta = cart.franjaHasta || '';
    const di = C.HORAS.indexOf(desde);
    const desdeOpts = C.HORAS.slice(0, -1);
    const hastaOpts = C.HORAS.slice(di > -1 ? di + 1 : 1);
    return '<div class="field franja mt-24' + C.errCls('franja') + '"><span class="label">Franja horaria</span>' +
      '<div class="franja-row focus-target" tabindex="-1">' + hourSelect('cart.franjaDesde', 'franja-desde', 'Desde', desdeOpts, desde) +
      '<span class="franja-sep" aria-hidden="true">–</span>' + hourSelect('cart.franjaHasta', 'franja-hasta', 'Hasta', hastaOpts, hasta) + '</div>' +
      '<p class="hint">Mínimo 1 hora entre el inicio y el fin.</p>' + C.err('franja') + '</div>';
  }
  C.live.franja = function () {
    const cart = C.S.cart, H = C.HORAS;
    const di = H.indexOf(cart.franjaDesde), hi = H.indexOf(cart.franjaHasta);
    // si el fin queda antes del inicio, se propone una franja de 2 horas
    if (di > -1 && (hi === -1 || hi <= di)) cart.franjaHasta = H[Math.min(di + 2, H.length - 1)];
    cart.franja = cart.franjaDesde && cart.franjaHasta ? cart.franjaDesde + ' – ' + cart.franjaHasta : '';
    C.save();
  };
  A.pickDate = function (el) {
    const strip = document.getElementById('date-strip'), x = strip ? strip.scrollLeft : 0;
    C.set(function (S) { S.cart.fecha = el.dataset.arg; delete C.ui.errors.fecha; });
    const s2 = document.getElementById('date-strip'); if (s2) s2.scrollLeft = x;
  };
  A.dateScroll = function (el) {
    const s = document.getElementById('date-strip');
    s.scrollBy({ left: Number(el.dataset.arg) * s.clientWidth * 0.8, behavior: 'smooth' });
  };
  A.pickRec = function (el) {
    const strip = document.getElementById('date-strip'), x = strip ? strip.scrollLeft : 0;
    C.set(function (S) { S.cart.recepId = el.dataset.arg; delete C.ui.errors.recep; });
    const s2 = document.getElementById('date-strip'); if (s2) s2.scrollLeft = x;
  };
  VALIDATE[2] = function () {
    const cart = C.S.cart, err = {};
    if (!cart.fecha) err.fecha = 'Elige el día de entrega';
    if (!cart.franjaDesde || !cart.franjaHasta) err.franja = 'Elige desde y hasta qué hora pueden recibir';
    const r = C.recById(cart.recepId);
    if (!r || r.sucursalId !== cart.sucursalId) err.recep = 'Elige quién recibe el pedido';
    if (Object.keys(err).length) return C.fail(err);
    return true;
  };

  /* =============== Tab 4 · Pago (bifurcación) =============== */
  function qrSVG(seed) {
    const n = 25, cells = [];
    let x = seed || 7;
    const rnd = function () { x = (x * 9301 + 49297) % 233280; return x / 233280; };
    const finder = function (r, c) {
      const inF = function (r0, c0) { return r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7; };
      const at = function (r0, c0) { const rr = r - r0, cc = c - c0; return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4); };
      if (inF(0, 0)) return at(0, 0) ? 1 : 0;
      if (inF(0, n - 7)) return at(0, n - 7) ? 1 : 0;
      if (inF(n - 7, 0)) return at(n - 7, 0) ? 1 : 0;
      if (r === 7 || c === 7 || r === n - 8 || c === n - 8) { if ((r < 8 && (c < 8 || c > n - 9)) || (r > n - 9 && c < 8)) return 0; }
      return -1;
    };
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const f = finder(r, c);
      const on = f === -1 ? rnd() > 0.52 : f === 1;
      if (on) cells.push('<rect x="' + c + '" y="' + r + '" width="1" height="1"/>');
    }
    return '<svg class="qr" viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" role="img" aria-label="Código QR de pago" shape-rendering="crispEdges"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><g fill="#000">' + cells.join('') + '</g></svg>';
  }
  C.qrSVG = qrSVG;

  C.contratoHTML = function () {
    return C.CONTRATO.map(function (s) { return '<h4 class="contract-h">' + e(s.t) + '</h4><p class="contract-p">' + e(s.p) + '</p>'; }).join('');
  };

  function firmaBlock() {
    const cart = C.S.cart, f = cart.firma;
    const drawLabel = C.isMobile() ? 'Firmar con el dedo' : 'Firmar con mouse';
    let pad;
    if (f.modo === 'cargar') {
      pad = f.archivo
        ? '<div class="sign-pad has-img"><img src="' + f.archivo + '" alt="Firma cargada"></div><div class="sign-tools">' + C.link('Quitar firma', 'firmaClear') + '</div>'
        : '<label class="drop sign-drop"><input type="file" class="sr-only" data-file="cart.firma.archivoMeta" accept="image/*"><span class="drop-cta">' + C.icon('upload', 18) + ' Cargar imagen de tu firma</span><span class="drop-sub">PNG o JPG</span></label>';
    } else {
      pad = '<div class="sign-pad" id="sign-pad"><canvas id="sign-canvas" aria-label="Área de firma"></canvas><span class="sign-line" aria-hidden="true"></span>' +
        (f.data ? '' : '<span class="sign-hint" id="sign-hint">Firma aquí</span>') + '</div>' +
        '<div class="sign-tools">' + C.link('Borrar firma', 'firmaClear') + '</div>';
    }
    return '<div class="field' + C.errCls('firma') + '"><span class="label">Firma</span>' +
      C.segmented({ cls: 'seg-block', value: f.modo, action: 'firmaModo', aria: 'Modo de firma', options: [{ value: 'dibujar', label: drawLabel }, { value: 'cargar', label: 'Cargar firma' }] }) +
      '<div class="focus-target" tabindex="-1">' + pad + '</div>' + C.err('firma') + '</div>';
  }

  function creditoPanel() {
    const c = C.credito(), total = C.cartTotal(), despues = c.disponible - total;
    const over = despues < 0;
    return '<div class="credit-grid reveal">' +
      '<section class="card contract"><h3 class="h3 contract-title">Contrato</h3><div class="contract-body" tabindex="0" aria-label="Contrato de crédito">' + C.contratoHTML() + '</div></section>' +
      '<div class="credit-side">' +
      '<div class="mini-stats"><div class="stat stat-sm"><span class="stat-label">Plazo configurado</span><strong>' + c.plazo + ' días</strong></div>' +
      '<div class="stat stat-sm"><span class="stat-label">Disponible antes</span><strong>' + C.bs(c.disponible) + '</strong></div>' +
      '<div class="stat stat-sm' + (over ? ' is-alert' : '') + '"><span class="stat-label">Disponible después</span><strong>' + (over ? '−' + C.bs(-despues).slice(3) : C.bs(despues)) + '</strong></div></div>' +
      (over ? '<p class="field-error">' + C.icon('alert', 14) + '<span>El total supera tu crédito disponible. Elige otro método de pago o reduce el pedido.</span></p>' : '') +
      firmaBlock() +
      '<div class="stack-sm">' +
      C.checkbox({ bind: 'cart.leido', err: 'leido', label: 'Leí el contrato' }) +
      C.checkbox({ bind: 'cart.firmo', err: 'firmo', label: 'Firmo digitalmente' }) +
      '</div></div></div>';
  }

  C.route('/compra/pago', function () {
    const g = guard(3); if (g) return g;
    const cart = C.S.cart, cred = C.S.account.credito;
    const aprobado = cred.estado === 'aprobado';
    const opts = '<div class="choice-grid cols-3 pay-opts focus-target" role="radiogroup" tabindex="-1">' +
      C.choice({ label: 'Crédito Cooltiva', selected: cart.pago === 'credito', action: 'pickPago', arg: 'credito', disabled: !aprobado, sub: aprobado ? C.link('Ver crédito', 'openModal', 'credito') : (cred.estado === 'solicitado' ? 'Solicitud en revisión' : C.link('Solicitar crédito', 'openModal', 'credito')) }) +
      C.choice({ label: 'Pago con QR', selected: cart.pago === 'qr', action: 'pickPago', arg: 'qr' }) +
      C.choice({ label: 'Contraentrega', selected: cart.pago === 'contraentrega', action: 'pickPago', arg: 'contraentrega' }) + '</div>';
    let panel = '';
    if (cart.pago === 'qr') {
      panel = '<section class="card card-pad pay-panel qr-panel reveal">' + qrSVG(C.cartTotal() % 997 + 11) +
        '<p class="muted">Escanea el código para pagar</p><p class="h2">' + C.bs(C.cartTotal()) + '</p></section>';
    } else if (cart.pago === 'contraentrega') {
      panel = '<section class="card card-pad pay-panel reveal"><p class="pay-note">Prepara el monto exacto en efectivo, o ten tu tarjeta lista si el repartidor lleva POS</p></section>';
    } else if (cart.pago === 'credito') {
      panel = creditoPanel();
    }
    const html = '<h1 class="h1 wz-title">¿Cómo quieres pagar?</h1>' +
      '<div class="field' + C.errCls('pago') + '">' + opts + C.err('pago') + '</div>' +
      '<div class="mt-24">' + panel + '</div>';
    return stepPage(3, html, { mount: mountSignature });
  });
  A.pickPago = function (el) { C.set(function (S) { S.cart.pago = el.dataset.arg; C.ui.errors = {}; }); };
  A.firmaModo = function (el) { C.set(function (S) { S.cart.firma.modo = el.dataset.arg; delete C.ui.errors.firma; }); };
  A.firmaClear = function () { C.set(function (S) { S.cart.firma.data = null; S.cart.firma.archivo = null; }); };

  /* Carga de imagen de firma (preview) */
  C.onFileExtra = function (el) {
    if (el.dataset.file !== 'cart.firma.archivoMeta' || !el.files[0]) return;
    const reader = new FileReader();
    reader.onload = function () { C.S.cart.firma.archivo = reader.result; delete C.ui.errors.firma; C.set(); };
    reader.readAsDataURL(el.files[0]);
  };

  /* Pad de firma: mouse o dedo (pointer events) */
  function mountSignature() {
    const canvas = document.getElementById('sign-canvas');
    if (!canvas) return;
    const pad = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = pad.clientWidth, h = pad.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000';
    if (C.S.cart.firma.data) {
      const img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, w, h); };
      img.src = C.S.cart.firma.data;
    }
    let drawing = false, last = null;
    const pos = function (ev) { const r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    canvas.addEventListener('pointerdown', function (ev) {
      drawing = true; last = pos(ev); canvas.setPointerCapture(ev.pointerId);
      const hint = document.getElementById('sign-hint'); if (hint) hint.remove();
      ctx.beginPath(); ctx.arc(last.x, last.y, 1, 0, Math.PI * 2); ctx.fill();
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!drawing) return;
      const p = pos(ev);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
    });
    const end = function () {
      if (!drawing) return;
      drawing = false;
      C.S.cart.firma.data = canvas.toDataURL('image/png');
      C.save();
      if (C.ui.errors.firma) {
        delete C.ui.errors.firma;
        const wrap = pad.closest('.has-error');
        if (wrap) { wrap.classList.remove('has-error'); const m = wrap.querySelector(':scope > .field-error'); if (m) m.remove(); }
      }
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  VALIDATE[3] = function () {
    const cart = C.S.cart, err = {};
    if (!cart.pago) return C.fail({ pago: 'Elige cómo quieres pagar' });
    if (cart.pago === 'credito') {
      if (C.credito().disponible - C.cartTotal() < 0) { C.toast('El total supera tu crédito disponible'); return false; }
      const f = cart.firma;
      if (!(f.modo === 'cargar' ? f.archivo : f.data)) err.firma = f.modo === 'cargar' ? 'Carga la imagen de tu firma' : 'Firma el contrato en el recuadro';
      if (!cart.leido) err.leido = 'Confirma que leíste el contrato';
      if (!cart.firmo) err.firmo = 'Confirma la firma digital';
    }
    if (Object.keys(err).length) return C.fail(err);
    return true;
  };

  /* =============== Tab 5 · Confirmar =============== */
  C.route('/compra/confirmar', function () {
    const g = guard(4); if (g) return g;
    const cart = C.S.cart, s = C.sucById(cart.sucursalId), r = C.recById(cart.recepId);
    if (!s || !r || !cart.pago) return { redirect: '/compra/pago' };
    const isCred = cart.pago === 'credito';
    const box = function (title, step, rows) {
      return '<section class="card card-pad sum-card"><div class="row-between"><h2 class="h3">' + title + '</h2>' + C.link('Editar', 'compraTab', step) + '</div><dl class="kv">' + rows + '</dl></section>';
    };
    const kv = function (k, v) { return '<div class="kv-row"><dt>' + k + '</dt><dd>' + v + '</dd></div>'; };
    const prodRows = cart.selected.map(function (id) {
      const c = C.itemCalc(id);
      return '<div class="kv-row"><dt class="kv-strong">' + e(c.p.name) + ' · ' + e(c.config) + '</dt><dd>' + e(c.qtyLabel) + ' · ' + C.bs(c.total) + '</dd></div>';
    }).join('');
    const firmaImg = cart.firma.modo === 'cargar' ? cart.firma.archivo : cart.firma.data;
    const resumen = '<div class="stack">' +
      box('Producto', 0, prodRows) +
      box('Sucursal', 1, kv('Dirección', e(C.sucLabel(s)))) +
      box('Entrega', 2, kv('Día y franja', C.fmtDay(cart.fecha) + ' · ' + e(cart.franja)) + kv('Recibe', e(r.nombre) + (r.tel ? ' · ' + e(r.tel) : '')) + (cart.instrucciones.trim() ? kv('Instrucciones', e(cart.instrucciones)) : '')) +
      box('Pago', 3, kv('Método', PAGOS[cart.pago]) + (isCred ? kv('Plazo', C.credito().plazo + ' días') : '')) +
      '<div class="grand-total"><span>Total</span><strong>' + C.bs(C.cartTotal()) + '</strong></div></div>';
    const contrato = isCred ? '<aside class="card card-pad contract-confirm"><h2 class="h3">Contrato</h2><div class="contract-body contract-body-sm" tabindex="0" aria-label="Contrato firmado">' + C.contratoHTML() +
      (firmaImg ? '<div class="signed"><img src="' + firmaImg + '" alt="Tu firma"><span class="muted small">Firmado por ' + e(C.S.account.user.nombre + ' ' + C.S.account.user.apellido) + '</span></div>' : '') + '</div>' +
      C.btn('Descargar contrato', { block: true, icon: 'download', action: 'downloadContract' }) + '<p class="muted small mt-8">También lo enviamos a tu correo.</p></aside>' : '';
    const html = '<h1 class="h1 wz-title">Revisa tu pedido</h1><div class="confirm-grid' + (isCred ? ' has-contract' : '') + '">' + resumen + contrato + '</div>';
    return stepPage(4, html, {
      width: isCred ? 'wz-w-confirm' : 'wz-w-form',
      bar: { left: C.btn('Atrás', { action: 'compraBack', arg: 4 }), right: C.btn('Confirmar pedido', { primary: true, action: 'placeOrder' }) }
    });
  });
  A.downloadContract = function () { C.toast('Descargando contrato.pdf (simulado)'); };

  A.placeOrder = function () {
    C.createOrder();
    C.save();
    C.go('/compra/realizado');
  };
  C.createOrder = function () {
    const cart = C.S.cart, a = C.S.account;
    const s = C.sucById(cart.sucursalId), r = C.recById(cart.recepId);
    const now = new Date();
    const total = Math.round(C.cartTotal());
    const order = {
      id: a.nextPedido++,
      creado: C.isoDate(C.DEMO_TODAY) + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      entregaFecha: cart.fecha, franja: cart.franja.trim(), sucursal: s.dir, recepcionista: r.nombre,
      pago: PAGOS[cart.pago], total: total,
      items: cart.selected.map(function (id) { const c = C.itemCalc(id); return { name: c.p.name, config: c.config, qty: c.qtyLabel, price: Math.round(c.total) }; })
    };
    // Pedido hecho por un vendedor en nombre del cliente: queda a su nombre y en el registro
    if (C.S.acting) {
      order.porVendedor = C.S.acting.seller;
      C.S.panel.log.unshift({ id: C.uid('l'), fecha: order.creado, actor: C.S.panel.persona, accion: 'pedido', empresaId: C.S.activeEmpresa, texto: 'Creó el pedido #' + order.id + ' para el cliente (' + C.bs(total) + ')' });
    }
    a.pedidos.push(order);
    a.actualizado = order.creado;
    if (cart.pago === 'credito') a.credito.usado += total;
    C.S.lastOrderId = order.id;
    C.S.cart = C.emptyCart();
    return order;
  };

  /* =============== Pedido realizado =============== */
  C.route('/compra/realizado', function () {
    if (!C.S.session.loggedIn) return { redirect: '/acceso?modo=login' };
    if (!C.S.lastOrderId) return { redirect: '/cuenta/pedidos' };
    return {
      layout: 'plain', title: 'Pedido realizado',
      html: C.success('Pedido realizado', 'Pedido #' + C.S.lastOrderId, C.btn('Ver pedidos realizados', { primary: true, block: true, action: 'seeOrders' }))
    };
  });
  A.seeOrders = function () {
    C.goWith('/cuenta/pedidos', { highlightOrder: true });
  };
})();
