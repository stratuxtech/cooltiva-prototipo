/* =========================================================
   NÚCLEO: estado, persistencia, router, acciones y render
   ========================================================= */
(function () {
  const STORE_KEY = 'cooltiva-proto-v3';

  /* ---------- Estado persistente (dominio + progreso de flujos) ----------
     empresas: todas las cuentas de clientes (las ve el panel de vendedores)
     account:  la empresa activa en la tienda (cliente logueado o la que
               atiende un vendedor en "modo vendedor") */
  C.wrapState = function (s) {
    Object.defineProperty(s, 'account', {
      get: function () { return s.empresas[s.activeEmpresa]; },
      set: function (v) { s.empresas[s.activeEmpresa] = v; },
      enumerable: false, configurable: true
    });
    return s;
  };
  C.freshState = function () {
    const empresas = C.seedEmpresas();
    return C.wrapState({
      session: { loggedIn: false },
      empresas: empresas,
      activeEmpresa: 'fogon',
      acting: null,
      onb: C.emptyOnboarding(),
      cart: C.emptyCart(),
      demo: { rol: '' },
      lastOrderId: null,
      panel: C.seedPanel(empresas)
    });
  };

  C.load = function () {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return C.wrapState(Object.assign(C.freshState(), JSON.parse(raw)));
    } catch (e) { /* sin storage: el demo funciona igual en memoria */ }
    return C.freshState();
  };

  C.save = function () {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(C.S)); } catch (e) {}
  };

  /* ---------- Estado transitorio de interfaz (no se guarda) ---------- */
  C.freshUI = function () {
    return {
      errors: {},
      drawer: false,
      demoOpen: false,
      sheet: false,           // resumen "Tu pedido" en mobile
      modal: null,            // modal de cuenta
      dialog: null,           // diálogo de confirmación
      editing: null,          // { type, id } edición en línea (Mi Cuenta)
      draft: {},              // borradores de formularios en línea
      creating: null,         // 'sucursal' | 'recepcionista'
      invited: null,          // empleado recién invitado (pantalla de éxito)
      highlightOrder: null
    };
  };
  C.ui = C.freshUI();

  /* ---------- Utilidades ---------- */
  C.esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  C.uid = function (p) { return p + Math.random().toString(36).slice(2, 8); };
  C.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  C.thousands = function (n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  C.bs = function (n) { return 'Bs ' + C.thousands(n); };
  C.bsKg = function (n) { return 'Bs ' + n.toFixed(2).replace('.', ','); };

  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  C.DIAS = DIAS; C.MESES = MESES; C.MESES_L = MESES_L;

  C.parseDate = function (iso) { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  C.isoDate = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  C.fmtDay = function (iso) { const d = C.parseDate(iso); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
  C.fmtCreated = function (iso) { const d = C.parseDate(iso); return d.getDate() + ' ' + MESES[d.getMonth()] + ' · ' + iso.slice(11, 16); };

  /* Lee/escribe rutas tipo "cart.items.papa.qty" o "ui.draft.dir" */
  C.getPath = function (path) {
    const parts = path.split('.');
    let o = parts[0] === 'ui' ? C.ui : C.S;
    if (parts[0] === 'ui') parts.shift();
    for (const p of parts) { if (o == null) return undefined; o = o[p]; }
    return o;
  };
  C.setPath = function (path, value) {
    const parts = path.split('.');
    let o = parts[0] === 'ui' ? C.ui : C.S;
    if (parts[0] === 'ui') parts.shift();
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
  };

  C.isMobile = function () { return window.matchMedia('(max-width: 760px)').matches; };

  /* ---------- Router por hash ---------- */
  C.routes = [];   // { pattern: RegExp, view: fn(params) }
  C.route = function (path, view) {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '$');
    C.routes.push({ re: re, keys: keys, view: view });
  };

  C.currentPath = function () {
    const h = location.hash.replace(/^#/, '') || '/';
    return h.split('?')[0];
  };
  C.query = function () {
    const q = location.hash.split('?')[1] || '';
    const out = {};
    q.split('&').filter(Boolean).forEach(function (kv) { const [k, v] = kv.split('='); out[k] = decodeURIComponent(v || ''); });
    return out;
  };

  C.go = function (path, opts) {
    opts = opts || {};
    C._keepUI = !!opts.keepUI;
    if (('#' + path) === location.hash) { C.onRoute(); return; }
    location.hash = path;
  };

  C.onRoute = function () {
    if (C.stageActive) return;
    try { localStorage.setItem('cooltiva-last-hash', location.hash); } catch (e) {}
    if (!C._keepUI) {
      const keepDemo = C.ui.demoOpen;
      const pending = C._pendingUI;
      C.ui = C.freshUI();
      C.ui.demoOpen = keepDemo;
      if (pending) Object.assign(C.ui, pending);
    }
    C._keepUI = false;
    C._pendingUI = null;
    C.render();
    window.scrollTo(0, 0);
    if (C._after) { const f = C._after; C._after = null; f(); }
  };

  /* Para navegar y además abrir algo (modal, edición) en la nueva pantalla */
  C.goWith = function (path, uiPatch) {
    C._pendingUI = uiPatch;
    C.go(path);
  };

  C.resolve = function () {
    const path = C.currentPath();
    for (const r of C.routes) {
      const m = path.match(r.re);
      if (m) {
        const params = {};
        r.keys.forEach(function (k, i) { params[k] = decodeURIComponent(m[i + 1]); });
        return r.view(params) || null;
      }
    }
    return null;
  };

  /* ---------- Render ---------- */
  C.render = function () {
    if (C.stageActive) return;   // en vista mobile la app vive dentro del marco
    let page = C.resolve();
    if (!page) { C.go(C.S.session.loggedIn ? '/cuenta/tienda' : '/acceso'); return; }
    if (page.redirect) { C.go(page.redirect); return; }
    // Modo vendedor: solo Tienda, Pedidos y el wizard de compra
    if (C.S.acting) {
      const p = C.currentPath();
      if ((p.indexOf('/cuenta/') === 0 && !/^\/cuenta\/(tienda|pedidos)$/.test(p)) || p.indexOf('/acceso') === 0 || p.indexOf('/onboarding') === 0) {
        if (C.toast) C.toast('En modo vendedor, los datos de la cuenta se editan desde el panel');
        C.go('/cuenta/tienda'); return;
      }
    }
    C.page = page;
    document.title = (page.title ? page.title + ' · ' : '') + 'Cooltiva prototipo';
    document.body.dataset.layout = page.layout || 'public';
    const inPanel = C.currentPath().indexOf('/panel') === 0;
    document.getElementById('app').innerHTML = (C.S.acting && !inPanel && C.actingBanner ? C.actingBanner() : '') + C.layouts[page.layout || 'public'](page);
    C.renderOverlays();
    if (page.mount) page.mount();
    C.afterRender();
  };

  C.renderOverlays = function () {
    document.getElementById('sheet-root').innerHTML = C.renderSheet ? C.renderSheet() : '';
    document.getElementById('modal-root').innerHTML = C.ui.modal ? C.renderModal() : '';
    document.getElementById('dialog-root').innerHTML = C.ui.dialog ? C.renderDialog() : '';
    document.getElementById('demo-root').innerHTML = C.renderDemo ? C.renderDemo() : '';
    document.body.classList.toggle('no-scroll', !!(C.ui.modal || C.ui.dialog || C.ui.drawer || C.ui.sheet || (C.ui.demoOpen && C.isMobile())));
    if (C.ui.modal && C.mountModal) C.mountModal();
  };

  C.afterRender = function () {
    // Tab activo del wizard visible en mobile
    const act = document.querySelector('.wz-tabs .is-active');
    if (act && act.scrollIntoView) {
      const strip = act.parentElement;
      strip.scrollLeft = act.offsetLeft - strip.clientWidth / 2 + act.clientWidth / 2;
    }
    const sideAct = document.querySelector('.acc-nav .is-active');
    if (sideAct && C.isMobile()) {
      const strip = sideAct.parentElement;
      strip.scrollLeft = sideAct.offsetLeft - 16;
    }
    // Foco al primer error tras validar
    if (C._focusError) {
      C._focusError = false;
      const el = document.querySelector('.has-error input, .has-error textarea, .has-error select, .has-error .focus-target, .has-error');
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (el.focus) el.focus({ preventScroll: true });
      }
    }
  };

  /* Actualiza el estado y vuelve a pintar todo (conserva scroll) */
  C.set = function (fn) {
    const y = window.scrollY;
    if (fn) fn(C.S, C.ui);
    C.save();
    C.render();
    window.scrollTo(0, y);
  };

  /* Muestra errores de validación: {clave: mensaje} */
  C.fail = function (errors) {
    C.ui.errors = errors;
    C._focusError = true;
    C.set();
    return false;
  };

  /* ---------- Acciones (delegación de eventos) ---------- */
  C.actions = {};
  C.live = {};     // refrescos parciales mientras se escribe

  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') { ev.preventDefault(); return; }
    const fn = C.actions[el.dataset.action];
    if (!fn) { console.warn('Acción sin definir:', el.dataset.action); return; }
    ev.preventDefault();
    fn(el, ev);
  });

  function onBind(ev) {
    const el = ev.target;
    if (!el.dataset || !el.dataset.bind) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.numeric !== undefined) v = v.replace(/[^\d.,]/g, '');
    if (el.dataset.numeric !== undefined && v !== el.value) el.value = v;
    C.setPath(el.dataset.bind, v);
    C.save();
    // limpia el error del campo
    const key = el.dataset.err || el.dataset.bind;
    if (C.ui.errors[key]) {
      delete C.ui.errors[key];
      const wrap = el.closest('.has-error');
      if (wrap) { wrap.classList.remove('has-error'); const m = wrap.querySelector('.field-error'); if (m) m.remove(); }
    }
    if (el.dataset.live) el.dataset.live.split(' ').forEach(function (n) { if (C.live[n]) C.live[n](el); });
    if (el.dataset.rerender !== undefined && ev.type === 'change') C.set();
  }
  document.addEventListener('input', onBind);
  document.addEventListener('change', function (ev) {
    const el = ev.target;
    if (el.type === 'file') { if (C.onFile) C.onFile(el); return; }
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') onBind(ev);
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (C.ui.dialog) { C.ui.dialog = null; C.renderOverlays(); return; }
      if (C.ui.modal) { C.actions.closeModal(); return; }
      if (C.ui.sheet) { C.ui.sheet = false; C.renderOverlays(); return; }
      if (C.ui.drawer) { C.ui.drawer = false; C.render(); return; }
      if (C.ui.demoOpen) { C.ui.demoOpen = false; C.renderOverlays(); return; }
    }
    // Tarjetas seleccionables accesibles con teclado
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[data-action][role="radio"], [data-action][role="checkbox"], [data-action][role="button"]')) {
      ev.preventDefault();
      ev.target.click();
    }
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  C.toast = function (msg) {
    const root = document.getElementById('toast-root');
    root.innerHTML = '<div class="toast">' + C.esc(msg) + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ''; }, 2600);
  };

  /* ---------- Reinicio ---------- */
  C.reset = function () {
    C.S = C.freshState();
    C.ui = C.freshUI();
    C.save();
  };

  // El estado se carga al final, cuando todas las utilidades ya existen
  C.S = C.load();
})();
