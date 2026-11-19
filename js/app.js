/* =========================================================
   ARRANQUE + VISTA ESCRITORIO / MOBILE EN LA MISMA PÁGINA
   La vista mobile monta la misma app dentro de un marco de
   teléfono (iframe ?embed=1). Una sola URL para las dos.
   ========================================================= */
(function () {
  const VIEW_KEY = 'cooltiva-view';
  const HASH_KEY = 'cooltiva-last-hash';
  C.embedded = /[?&]embed=1/.test(location.search);
  if (C.embedded) document.documentElement.classList.add('is-embedded');

  const store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  C.getView = function () { return C.embedded ? 'mobile' : (C.stageActive ? 'mobile' : 'desktop'); };

  const SIZES = [{ w: 360, h: 740 }, { w: 390, h: 844 }, { w: 430, h: 932 }];
  function stageHTML(hash) {
    const size = Number(store.get('cooltiva-device') || 390);
    const s = SIZES.find(function (x) { return x.w === size; }) || SIZES[1];
    return '<div class="stage-bar"><span class="stage-title"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="96" height="27"><span>Vista mobile</span></span>' +
      '<span class="stage-actions"><span class="seg stage-sizes" role="radiogroup" aria-label="Tamaño del teléfono">' +
      SIZES.map(function (x) { return '<button type="button" class="seg-btn' + (x.w === s.w ? ' is-on' : '') + '" data-size="' + x.w + '">' + x.w + '</button>'; }).join('') + '</span>' +
      '<button type="button" class="btn btn-primary btn-sm" id="stage-desktop">' + C.icon('monitor', 18) + '<span>Ver en escritorio</span></button></span></div>' +
      '<div class="stage-wrap"><div class="stage-phone" style="--pw:' + s.w + 'px;--ph:' + s.h + 'px"><iframe id="stage-frame" title="Prototipo en mobile" src="' + location.pathname + '?embed=1' + hash + '"></iframe></div></div>';
  }

  C.setView = function (v) {
    if (C.embedded) { window.parent.postMessage({ cooltivaView: v }, '*'); return; }
    if (v === 'mobile' && !C.stageActive) {
      C.save();                 // la app del marco arranca con el estado actual
      C.ui.demoOpen = false;
      C.stageActive = true;
      store.set(VIEW_KEY, 'mobile');
      document.body.classList.add('stage-mode');
      mountStage(location.hash || '#/');
    } else if (v === 'desktop' && C.stageActive) {
      const h = store.get(HASH_KEY) || location.hash || '#/';
      store.set(VIEW_KEY, 'desktop');
      const st = document.getElementById('stage'); if (st) st.remove();
      document.body.classList.remove('stage-mode');
      C.stageActive = false;
      C.S = C.load(); C.ui = C.freshUI();
      if (h !== location.hash) location.hash = h; else C.render();
    }
  };

  function mountStage(hash) {
    let st = document.getElementById('stage');
    if (!st) { st = document.createElement('div'); st.id = 'stage'; document.body.appendChild(st); }
    st.innerHTML = stageHTML(hash);
    st.querySelector('#stage-desktop').addEventListener('click', function () { C.setView('desktop'); });
    Array.prototype.forEach.call(st.querySelectorAll('[data-size]'), function (b) {
      b.addEventListener('click', function () {
        store.set('cooltiva-device', b.dataset.size);
        mountStage(store.get(HASH_KEY) || location.hash);   // sin guardar: el estado lo maneja la app del marco
      });
    });
  }

  // Mensajes desde la app dentro del marco
  window.addEventListener('message', function (ev) {
    if (ev.data && ev.data.cooltivaView) C.setView(ev.data.cooltivaView);
    if (ev.data && ev.data.cooltivaHash && C.stageActive) history.replaceState(null, '', ev.data.cooltivaHash);
  });

  window.addEventListener('hashchange', function () {
    C.onRoute();
    if (C.embedded) window.parent.postMessage({ cooltivaHash: location.hash }, '*');
  });

  // Re-pinta al cruzar el breakpoint mobile (p. ej. "Firmar con mouse" ↔ "con el dedo")
  let wasMobile = C.isMobile();
  window.addEventListener('resize', function () {
    const m = C.isMobile();
    if (m !== wasMobile) { wasMobile = m; C.set(); }
  });

  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    location.replace('#' + (C.S.session.loggedIn ? '/cuenta/tienda' : '/acceso?modo=registro'));
  }
  if (!C.embedded && store.get(VIEW_KEY) === 'mobile') C.setView('mobile');
  else { store.set(HASH_KEY, location.hash); C.render(); }
})();
