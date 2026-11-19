/* =========================================================
   MI CUENTA · Tienda, Pedidos, Sucursales, Recepcionistas,
   Crédito, Agregar empleado, Configuración (+ páginas externas)
   ========================================================= */
(function () {
  const e = C.esc;
  const A = C.actions;

  function guard() { return C.S.session.loggedIn ? null : { redirect: '/acceso?modo=login' }; }
  function page(tab, html, o) { return Object.assign({ layout: 'cuenta', tab: tab, html: html }, o || {}); }
  function head(title, right, lead) {
    return '<div class="page-head"><div><h1 class="h1">' + e(title) + '</h1>' + (lead ? '<p class="lead">' + e(lead) + '</p>' : '') + '</div>' + (right || '') + '</div>';
  }

  /* ===================== TIENDA ===================== */
  C.route('/cuenta/tienda', function () {
    const g = guard(); if (g) return g;
    const sel = C.S.cart.selected;
    const cards = ['papa', 'cafe'].map(function (id) {
      const p = C.PRODUCTS[id], on = sel.indexOf(id) > -1;
      return '<div class="prod-card' + (on ? ' is-on' : '') + '" role="checkbox" tabindex="0" aria-checked="' + on + '" data-action="tiendaToggle" data-arg="' + id + '">' +
        C.ph('Foto ' + p.name.toLowerCase(), 'prod-photo') +
        '<div class="prod-card-foot"><strong class="h3">' + e(p.name) + '</strong><span class="box" aria-hidden="true">' + C.icon('check', 16) + '</span></div></div>';
    }).join('');
    const n = sel.length;
    const label = n === 0 ? 'Ningún producto seleccionado' : (n === 1 ? '1 producto seleccionado' : n + ' productos seleccionados');
    const html = head('Tienda', '', 'Elige uno o ambos productos.') +
      '<div class="prod-grid">' + cards + '</div>' +
      '<div class="buy-bar"><span class="buy-count' + (n ? ' is-on' : '') + '">' + label + '</span>' +
      C.btn('Comprar', { primary: true, action: 'comprar', disabled: n === 0 }) + '</div>';
    return page('tienda', html, { title: 'Tienda', full: true });
  });

  A.tiendaToggle = function (el) {
    C.set(function (S) {
      const id = el.dataset.arg, i = S.cart.selected.indexOf(id);
      if (i > -1) S.cart.selected.splice(i, 1); else S.cart.selected.push(id);
      S.cart.selected.sort(function (a, b) { return a === 'papa' ? -1 : (b === 'papa' ? 1 : 0); });
    });
  };

  A.comprar = function () {
    const cart = C.S.cart;
    cart.selected.forEach(function (id) { if (!cart.items[id]) cart.items[id] = C.emptyItem(); });
    Object.keys(cart.items).forEach(function (id) { if (cart.selected.indexOf(id) < 0) delete cart.items[id]; });
    if (!cart.open || cart.selected.indexOf(cart.open) < 0) cart.open = cart.selected[0];
    // Si hay una sola sucursal, se preselecciona (todo precargado)
    if (!cart.sucursalId && C.S.account.sucursales.length === 1) cart.sucursalId = C.S.account.sucursales[0].id;
    C.save();
    C.go('/compra/producto');
  };

  /* ===================== PEDIDOS ===================== */
  C.orderCard = function (o, isNew) {
    const items = o.items.map(function (it) {
      return '<li class="order-item"><span class="ph ph-thumb" aria-hidden="true"></span><div class="order-item-main"><strong>' + e(it.name) + '</strong><span class="muted small">' + e(it.config) + '</span></div>' +
        '<div class="order-item-num"><span>' + e(it.qty) + '</span><strong>' + C.bs(it.price) + '</strong></div></li>';
    }).join('');
    return '<article class="card order' + (isNew ? ' is-new' : '') + '" id="pedido-' + o.id + '">' +
      '<div class="order-id"><h3 class="h3">Pedido #' + o.id + '</h3><p class="muted small">Hecho el <br>' + C.fmtCreated(o.creado) + '</p>' + (isNew ? '<span class="tag mt-8">Nuevo</span>' : '') + '</div>' +
      '<ul class="order-items">' + items + '</ul>' +
      '<dl class="order-meta"><div><dt>Entrega</dt><dd>' + C.fmtDay(o.entregaFecha) + ' · ' + e(o.franja) + '</dd></div>' +
      '<div><dt>Sucursal</dt><dd>' + e(o.sucursal) + '</dd></div><div><dt>Recibe</dt><dd>' + e(o.recepcionista) + '</dd></div></dl>' +
      '<dl class="order-pay"><div><dt>Pago</dt><dd>' + e(o.pago) + '</dd></div><div><dt>Total</dt><dd class="order-total">' + C.bs(o.total) + '</dd></div></dl>' +
      '</article>';
  };

  C.route('/cuenta/pedidos', function () {
    const g = guard(); if (g) return g;
    const list = C.S.account.pedidos.slice().sort(function (a, b) { return b.creado.localeCompare(a.creado); });
    let html = head('Pedidos realizados');
    if (!list.length) {
      html += '<div class="empty"><p class="h3">Aún no tienes pedidos</p><p class="muted">Cuando hagas tu primera compra aparecerá aquí.</p>' + '<a class="btn btn-primary mt-16" href="#/cuenta/tienda">Ir a la tienda</a></div>';
    } else {
      let month = '';
      list.forEach(function (o) {
        const d = C.parseDate(o.creado);
        const m = C.MESES_L[d.getMonth()] + ' ' + d.getFullYear();
        if (m !== month) { html += (month ? '</div>' : '') + '<h2 class="eyebrow month-label">' + m + '</h2><div class="order-list">'; month = m; }
        html += C.orderCard(o, o.id === C.S.lastOrderId && C.ui.highlightOrder);
      });
      html += '</div>';
    }
    return page('pedidos', html, { title: 'Pedidos', wide: true });
  });

  /* ===================== SUCURSALES ===================== */
  C.sucursalFields = function () {
    return C.map({ interactive: true, action: 'draftMap', pin: C.ui.draft.pin }) +
      '<div class="stack mt-16">' +
      C.field({ label: 'Dirección', bind: 'ui.draft.dir', placeholder: 'Ej. Av. 6 de Agosto 1234' }) +
      C.field({ label: 'Ciudad', bind: 'ui.draft.ciudad', placeholder: 'Ej. La Paz' }) + '</div>';
  };
  A.draftMap = function (el, ev) {
    const g = C.geocodeFromClick(el, ev);
    C.ui.draft.pin = g.pin; C.ui.draft.dir = g.dir; C.ui.draft.ciudad = g.ciudad;
    delete C.ui.errors['ui.draft.dir']; delete C.ui.errors['ui.draft.ciudad'];
    C.set();
  };
  C.validateSucursal = function () {
    const d = C.ui.draft, err = {};
    if (!(d.dir || '').trim()) err['ui.draft.dir'] = 'Escribe la dirección o toca el mapa';
    if (!(d.ciudad || '').trim()) err['ui.draft.ciudad'] = 'Escribe la ciudad';
    return err;
  };
  C.saveSucursal = function (id) {
    const d = C.ui.draft, list = C.S.account.sucursales;
    if (id) {
      const s = C.sucById(id);
      s.dir = d.dir.trim(); s.ciudad = d.ciudad.trim(); if (d.pin) s.pin = d.pin;
      return s;
    }
    const s = { id: C.uid('s'), dir: d.dir.trim(), ciudad: d.ciudad.trim(), pin: d.pin || { x: 50, y: 50 } };
    list.push(s);
    return s;
  };
  C.deleteSucursal = function (id) {
    const a = C.S.account;
    a.sucursales = a.sucursales.filter(function (s) { return s.id !== id; });
    const removed = a.recepcionistas.filter(function (r) { return r.sucursalId === id; }).map(function (r) { return r.id; });
    a.recepcionistas = a.recepcionistas.filter(function (r) { return r.sucursalId !== id; });
    if (C.S.cart.sucursalId === id) { C.S.cart.sucursalId = null; C.S.cart.recepId = null; }
    if (removed.indexOf(C.S.cart.recepId) > -1) C.S.cart.recepId = null;
  };
  C.confirmDeleteSucursal = function (id, after) {
    const s = C.sucById(id);
    const n = C.S.account.recepcionistas.filter(function (r) { return r.sucursalId === id; }).length;
    C.ui.dialog = {
      title: '¿Eliminar esta sucursal?',
      body: '<strong>' + e(C.sucLabel(s)) + '</strong>' + (n ? '<br>También se eliminarán sus ' + n + ' recepcionista' + (n > 1 ? 's' : '') + ' asignado' + (n > 1 ? 's' : '') + '.' : '') + '<br>Esta acción no se puede deshacer.',
      confirm: 'Eliminar sucursal', action: 'sucDeleteYes', arg: id, after: after || ''
    };
    C.renderOverlays();
  };

  C.route('/cuenta/sucursales', function () {
    const g = guard(); if (g) return g;
    const ui = C.ui, list = C.S.account.sucursales;
    let html = head('Sucursales', C.btn('+ Nueva sucursal', { action: 'sucNew', disabled: ui.creating === 'sucursal' }));
    if (ui.creating === 'sucursal') {
      html += '<section class="card card-strong card-pad form-card reveal"><h2 class="h3">Nueva sucursal</h2><div class="mt-16">' + C.sucursalFields() + '</div>' +
        '<div class="form-actions">' + C.btn('Cancelar', { action: 'sucCancel' }) + C.btn('Guardar sucursal', { primary: true, action: 'sucSave' }) + '</div></section>';
    }
    if (!list.length && ui.creating !== 'sucursal') html += '<div class="empty"><p class="h3">Aún no tienes sucursales</p><p class="muted">Agrega la dirección donde recibes tus pedidos.</p></div>';
    html += '<div class="item-list">' + list.map(function (s) {
      if (ui.editing && ui.editing.type === 'suc' && ui.editing.id === s.id) {
        return '<section class="card card-strong card-pad form-card"><h2 class="h3">Editar sucursal</h2><div class="mt-16">' + C.sucursalFields() + '</div>' +
          '<div class="form-actions">' + C.btn('Cancelar', { action: 'sucCancel' }) + C.btn('Guardar cambios', { primary: true, action: 'sucSave', arg: s.id }) + '</div></section>';
      }
      return '<article class="card item-card suc-card"><div class="suc-thumb">' + C.map({ small: true, pin: s.pin }) + '</div>' +
        '<div class="item-main"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span></div>' +
        '<div class="item-actions">' + C.link('Editar', 'sucEdit', s.id) + C.link('Eliminar', 'sucDelete', s.id) + '</div></article>';
    }).join('') + '</div>';
    return page('sucursales', html, { title: 'Sucursales' });
  });

  A.sucNew = function () { C.ui.creating = 'sucursal'; C.ui.editing = null; C.ui.draft = { dir: '', ciudad: '', pin: null }; C.ui.errors = {}; C.set(); window.scrollTo(0, 0); };
  A.sucEdit = function (el) {
    const s = C.sucById(el.dataset.arg);
    C.ui.editing = { type: 'suc', id: s.id }; C.ui.creating = null; C.ui.errors = {};
    C.ui.draft = { dir: s.dir, ciudad: s.ciudad, pin: s.pin };
    C.set();
  };
  A.sucCancel = function () { C.ui.creating = null; C.ui.editing = null; C.ui.errors = {}; C.set(); };
  A.sucSave = function (el) {
    const err = C.validateSucursal();
    if (Object.keys(err).length) return C.fail(err);
    const id = el.dataset.arg || null;
    C.saveSucursal(id);
    C.ui.creating = null; C.ui.editing = null;
    C.set();
    C.toast(id ? 'Cambios guardados' : 'Sucursal creada');
  };
  A.sucDelete = function (el) { C.confirmDeleteSucursal(el.dataset.arg); };
  A.sucDeleteYes = function (el) {
    C.deleteSucursal(el.dataset.arg);
    const after = C.ui.dialog && C.ui.dialog.after;
    C.ui.dialog = null; C.ui.editing = null;
    if (after === 'modal' && C.ui.modal) { C.ui.modal.view = 'list'; C.ui.modal.id = null; }
    C.set();
    C.toast('Sucursal eliminada');
  };

  /* ===================== RECEPCIONISTAS ===================== */
  C.recepEditFields = function () {
    return '<div class="stack">' +
      C.selectField({ label: 'Sucursal', bind: 'ui.draft.sucursalId', options: C.S.account.sucursales.map(function (s) { return { value: s.id, label: C.sucLabel(s) }; }) }) +
      '<div class="form-grid">' +
      C.field({ label: 'Nombre recepcionista', bind: 'ui.draft.nombre', placeholder: 'Ej. Juan Pérez' }) +
      C.field({ label: 'Teléfono recepcionista', bind: 'ui.draft.tel', inputmode: 'tel', placeholder: 'Ej. 7012 3456' }) +
      '</div></div>';
  };
  C.recepCandidates = function (sucursalId) {
    const a = C.S.account, here = a.recepcionistas.filter(function (r) { return r.sucursalId === sucursalId; });
    const seen = {};
    return a.recepcionistas.filter(function (r) {
      const k = r.nombre + '|' + r.tel;
      if (r.sucursalId === sucursalId || seen[k]) return false;
      if (here.some(function (h) { return h.nombre === r.nombre && h.tel === r.tel; })) return false;
      seen[k] = true; return true;
    });
  };
  /* Formulario "Agregar recepcionista": sucursal → crear nuevo / elegir existente */
  C.recepAddFields = function () {
    const d = C.ui.draft;
    let body = C.selectField({ label: 'Sucursal', bind: 'ui.draft.sucursalId', rerender: true, options: C.S.account.sucursales.map(function (s) { return { value: s.id, label: C.sucLabel(s) }; }) }) +
      '<div class="mt-16">' + C.segmented({ value: d.modo, action: 'recModo', aria: 'Tipo de alta', options: [{ value: 'nuevo', label: 'Crear nuevo' }, { value: 'existente', label: 'Elegir existente' }] }) + '</div>';
    if (d.modo === 'existente') {
      const cands = C.recepCandidates(d.sucursalId);
      body += '<div class="field mt-16' + C.errCls('pickId') + '"><span class="label">Recepcionistas de otras sucursales</span>' +
        (cands.length ? '<div class="choice-grid cols-2 focus-target" role="radiogroup" tabindex="-1">' + cands.map(function (r) {
          const s = C.sucById(r.sucursalId);
          return C.choice({ label: r.nombre, selected: d.pickId === r.id, action: 'recPick', arg: r.id, sub: e(r.tel || 'Sin teléfono') + '<br>Sucursal: ' + e(s ? s.dir : '') });
        }).join('') + '</div>' : '<p class="muted empty-inline">No hay recepcionistas en otras sucursales.</p>') + C.err('pickId') + '</div>';
    } else {
      body += '<div class="form-grid mt-16">' +
        C.field({ label: 'Nombre recepcionista', bind: 'ui.draft.nombre', placeholder: 'Ej. Juan Pérez' }) +
        C.field({ label: 'Teléfono recepcionista', bind: 'ui.draft.tel', inputmode: 'tel', placeholder: 'Ej. 7012 3456' }) + '</div>';
    }
    return body;
  };
  C.recepAddPrimary = function () {
    return C.ui.draft.modo === 'existente'
      ? C.btn('Asignar a esta sucursal', { primary: true, action: 'recSave', arg: 'assign' })
      : C.btn('Guardar recepcionista', { primary: true, action: 'recSave', arg: 'new' });
  };
  C.validateRecep = function (mode) {
    const d = C.ui.draft, err = {};
    if (mode === 'assign') { if (!d.pickId) err.pickId = 'Elige un recepcionista'; return err; }
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if ((d.tel || '').replace(/\D/g, '').length < 7) err['ui.draft.tel'] = 'Escribe un teléfono válido (7 u 8 dígitos)';
    return err;
  };
  C.saveRecep = function (mode, id) {
    const d = C.ui.draft, a = C.S.account;
    if (mode === 'assign') {
      const src = C.recById(d.pickId);
      const r = { id: C.uid('r'), nombre: src.nombre, tel: src.tel, sucursalId: d.sucursalId };
      a.recepcionistas.push(r); return r;
    }
    if (id) { const r = C.recById(id); r.nombre = d.nombre.trim(); r.tel = d.tel.trim(); r.sucursalId = d.sucursalId; if (C.S.cart.recepId === id && C.S.cart.sucursalId !== r.sucursalId) C.S.cart.recepId = null; return r; }
    const r = { id: C.uid('r'), nombre: d.nombre.trim(), tel: d.tel.trim(), sucursalId: d.sucursalId };
    a.recepcionistas.push(r); return r;
  };
  C.confirmDeleteRecep = function (id, after) {
    const r = C.recById(id), s = C.sucById(r.sucursalId);
    C.ui.dialog = {
      title: '¿Eliminar este recepcionista?',
      body: '<strong>' + e(r.nombre) + '</strong> dejará de recibir pedidos en ' + e(s ? s.dir : 'esta sucursal') + '.<br>Esta acción no se puede deshacer.',
      confirm: 'Eliminar recepcionista', action: 'recDeleteYes', arg: id, after: after || ''
    };
    C.renderOverlays();
  };
  C.newRecepDraft = function (sucursalId) {
    return { sucursalId: sucursalId || (C.S.account.sucursales[0] || {}).id || '', modo: 'nuevo', nombre: '', tel: '', pickId: null };
  };

  C.route('/cuenta/recepcionistas', function () {
    const g = guard(); if (g) return g;
    const ui = C.ui, a = C.S.account;
    const noSuc = !a.sucursales.length;
    let html = head('Recepcionistas', C.btn('+ Agregar recepcionista', { action: 'recNew', disabled: ui.creating === 'recepcionista' || noSuc }));
    if (noSuc) html += '<div class="empty"><p class="h3">Primero agrega una sucursal</p><p class="muted">Cada recepcionista pertenece a una sucursal.</p><a class="btn mt-16" href="#/cuenta/sucursales">Ir a Sucursales</a></div>';
    if (ui.creating === 'recepcionista') {
      html += '<section class="card card-strong card-pad form-card reveal"><h2 class="h3">Agregar recepcionista</h2><div class="mt-16">' + C.recepAddFields() + '</div>' +
        '<div class="form-actions">' + C.btn('Cancelar', { action: 'recCancel' }) + C.recepAddPrimary() + '</div></section>';
    }
    html += '<div class="item-list">' + a.recepcionistas.slice().sort(function (x, y) { return x.sucursalId.localeCompare(y.sucursalId); }).map(function (r) {
      const s = C.sucById(r.sucursalId);
      if (ui.editing && ui.editing.type === 'rec' && ui.editing.id === r.id) {
        return '<section class="card card-strong card-pad form-card"><h2 class="h3">Editar recepcionista</h2><div class="mt-16">' + C.recepEditFields() + '</div>' +
          '<div class="form-actions">' + C.btn('Cancelar', { action: 'recCancel' }) + C.btn('Guardar cambios', { primary: true, action: 'recSave', arg: 'edit:' + r.id }) + '</div></section>';
      }
      return '<article class="card item-card"><div class="item-main"><strong>' + e(r.nombre) + '</strong><span class="muted">' + e(r.tel || 'Sin teléfono') + '</span><span class="muted small">Sucursal: ' + e(s ? s.dir : '—') + '</span></div>' +
        '<div class="item-actions">' + C.link('Editar', 'recEdit', r.id) + C.link('Eliminar', 'recDelete', r.id) + '</div></article>';
    }).join('') + '</div>';
    return page('recepcionistas', html, { title: 'Recepcionistas' });
  });

  A.recNew = function () { C.ui.creating = 'recepcionista'; C.ui.editing = null; C.ui.errors = {}; C.ui.draft = C.newRecepDraft(); C.set(); window.scrollTo(0, 0); };
  A.recModo = function (el) { C.ui.draft.modo = el.dataset.arg; C.ui.errors = {}; C.set(); };
  A.recPick = function (el) { C.ui.draft.pickId = el.dataset.arg; delete C.ui.errors.pickId; C.set(); };
  A.recEdit = function (el) {
    const r = C.recById(el.dataset.arg);
    C.ui.editing = { type: 'rec', id: r.id }; C.ui.creating = null; C.ui.errors = {};
    C.ui.draft = { sucursalId: r.sucursalId, nombre: r.nombre, tel: r.tel };
    C.set();
  };
  A.recCancel = function () { C.ui.creating = null; C.ui.editing = null; C.ui.errors = {}; C.set(); };
  A.recSave = function (el) {
    const arg = el.dataset.arg, mode = arg.indexOf('edit:') === 0 ? 'edit' : arg;
    const err = C.validateRecep(mode);
    if (Object.keys(err).length) return C.fail(err);
    C.saveRecep(mode, mode === 'edit' ? arg.slice(5) : null);
    C.ui.creating = null; C.ui.editing = null;
    C.set();
    C.toast(mode === 'edit' ? 'Cambios guardados' : (mode === 'assign' ? 'Recepcionista asignado a la sucursal' : 'Recepcionista agregado'));
  };
  A.recDelete = function (el) { C.confirmDeleteRecep(el.dataset.arg); };
  A.recDeleteYes = function (el) {
    const id = el.dataset.arg;
    C.S.account.recepcionistas = C.S.account.recepcionistas.filter(function (r) { return r.id !== id; });
    if (C.S.cart.recepId === id) C.S.cart.recepId = null;
    const after = C.ui.dialog && C.ui.dialog.after;
    C.ui.dialog = null; C.ui.editing = null;
    if (after === 'modal' && C.ui.modal) { C.ui.modal.view = 'list'; C.ui.modal.id = null; }
    C.set();
    C.toast('Recepcionista eliminado');
  };

  /* ===================== CRÉDITO ===================== */
  C.creditoContent = function () {
    const st = C.S.account.credito.estado;
    if (st === 'aprobado') return C.creditoAprobado();
    return C.pending(st === 'solicitado' ? 'Solicitud de crédito enviada' : 'Crédito Cooltiva',
      st === 'solicitado'
        ? 'El estado de una solicitud en revisión aún no está definido en la arquitectura de información.'
        : 'El contenido del tab Crédito cuando no hay crédito aprobado (incluida la solicitud desde Mi Cuenta) aún no está definido en la arquitectura de información.');
  };
  C.route('/cuenta/credito', function () {
    const g = guard(); if (g) return g;
    const st = C.S.account.credito.estado;
    return page('credito', head('Crédito') + '<div class="' + (st === 'aprobado' ? 'card card-pad' : '') + '">' + C.creditoContent() + '</div>', { title: 'Crédito' });
  });

  /* ===================== EMPLEADOS ===================== */
  function empValid(d) { return /^\S+@\S+\.\S+$/.test(d.email || '') && (d.wa || '').replace(/\D/g, '').length >= 8; }
  C.live.empForm = function () {
    const b = document.getElementById('emp-send');
    if (b) b.disabled = !empValid(C.ui.draft);
  };
  C.empleadosContent = function (opts) {
    opts = opts || {};
    const ui = C.ui, list = C.S.account.empleados;
    if (ui.invited) {
      return C.success('Invitación enviada',
        'Enviamos la invitación a <strong>' + e(ui.invited.email) + '</strong><br>y al WhatsApp <strong>' + e(ui.invited.wa) + '</strong>.',
        C.btn('Invitar a otra persona', { action: 'empAnother' }) + C.btn('Ver empleados', { primary: true, action: 'empSeeList' }));
    }
    const d = ui.draft;
    let html = '<section class="card card-pad"><div class="form-grid">' +
      C.field({ label: 'Correo electrónico', bind: 'ui.draft.email', type: 'email', live: 'empForm', placeholder: 'nombre@restaurante.bo', autocomplete: 'off' }) +
      C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel', live: 'empForm', placeholder: '+591 7000 0000', autocomplete: 'off' }) +
      '</div><div class="form-actions">' + C.btn('Enviar invitación', { primary: true, action: 'empSend', id: 'emp-send', disabled: !empValid(d) }) + '</div></section>' +
      '<h2 class="h3 mt-32" id="emp-list">Empleados</h2>';
    if (!list.length) html += '<p class="muted mt-8">Todavía no invitaste a nadie.</p>';
    html += '<div class="item-list mt-16">' + list.map(function (m) {
      if (!opts.noEdit && ui.editing && ui.editing.type === 'emp' && ui.editing.id === m.id) {
        return '<section class="card card-strong card-pad form-card"><div class="form-grid">' +
          C.field({ label: 'Correo electrónico', bind: 'ui.draft.editEmail', type: 'email' }) +
          C.field({ label: 'WhatsApp', bind: 'ui.draft.editWa', type: 'tel' }) + '</div>' +
          '<div class="form-actions">' + C.btn('Cancelar', { action: 'empCancel' }) + C.btn('Guardar cambios', { primary: true, action: 'empSave', arg: m.id }) + '</div></section>';
      }
      return '<article class="card item-card"><div class="item-main"><strong>' + e(m.email) + '</strong><span class="muted">WhatsApp ' + e(m.wa) + '</span></div>' +
        '<div class="item-actions">' + (opts.noEdit ? '' : C.link('Editar', 'empEdit', m.id)) + C.link('Eliminar', 'empDelete', m.id) + '</div></article>';
    }).join('') + '</div>';
    return html;
  };
  C.route('/cuenta/empleados', function () {
    const g = guard(); if (g) return g;
    const html = (C.ui.invited ? '' : head('Agregar empleado', '', 'Le enviaremos una invitación para crear su cuenta.')) + C.empleadosContent();
    return page('empleados', html, { title: 'Agregar empleado' });
  });
  A.empSend = function () {
    const d = C.ui.draft;
    if (!empValid(d)) return C.fail({ 'ui.draft.email': 'Revisa el correo y el WhatsApp' });
    const m = { id: C.uid('e'), email: d.email.trim(), wa: d.wa.trim() };
    C.S.account.empleados.push(m);
    C.ui.invited = m; C.ui.draft = {};
    C.set();
    window.scrollTo(0, 0);
  };
  A.empAnother = function () {
    C.ui.invited = null; C.ui.draft = {}; C.set();
    const f = document.querySelector('[data-bind="ui.draft.email"]'); if (f) f.focus();
  };
  A.empSeeList = function () {
    C.ui.invited = null; C.set();
    const l = document.getElementById('emp-list'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  A.empEdit = function (el) {
    const m = C.S.account.empleados.find(function (x) { return x.id === el.dataset.arg; });
    C.ui.editing = { type: 'emp', id: m.id }; C.ui.errors = {};
    C.ui.draft = Object.assign({}, C.ui.draft, { editEmail: m.email, editWa: m.wa });
    C.set();
  };
  A.empCancel = function () { C.ui.editing = null; C.ui.errors = {}; C.set(); };
  A.empSave = function (el) {
    const d = C.ui.draft, err = {};
    if (!/^\S+@\S+\.\S+$/.test(d.editEmail || '')) err['ui.draft.editEmail'] = 'Escribe un correo válido';
    if ((d.editWa || '').replace(/\D/g, '').length < 8) err['ui.draft.editWa'] = 'Escribe un WhatsApp válido';
    if (Object.keys(err).length) return C.fail(err);
    const m = C.S.account.empleados.find(function (x) { return x.id === el.dataset.arg; });
    m.email = d.editEmail.trim(); m.wa = d.editWa.trim();
    C.ui.editing = null;
    C.set();
    C.toast('Cambios guardados');
  };
  A.empDelete = function (el) {
    const m = C.S.account.empleados.find(function (x) { return x.id === el.dataset.arg; });
    C.ui.dialog = {
      title: '¿Eliminar este empleado?',
      body: '<strong>' + e(m.email) + '</strong> perderá el acceso a la cuenta de la empresa.<br>Esta acción no se puede deshacer.',
      confirm: 'Eliminar empleado', action: 'empDeleteYes', arg: m.id
    };
    C.renderOverlays();
  };
  A.empDeleteYes = function (el) {
    C.S.account.empleados = C.S.account.empleados.filter(function (x) { return x.id !== el.dataset.arg; });
    C.ui.dialog = null; C.ui.editing = null;
    C.set();
    C.toast('Empleado eliminado');
  };

  /* ===================== CONFIGURACIÓN ===================== */
  C.route('/cuenta/configuracion', function () {
    const g = guard(); if (g) return g;
    return page('configuracion', head('Configuración') + C.pending('Configuración', 'El contenido del tab Configuración aún no está definido en la arquitectura de información.'), { title: 'Configuración' });
  });

  /* ===================== PÁGINAS EXISTENTES (fuera de alcance) ===================== */
  const EXT = { inicio: 'Inicio', nosotros: 'Nosotros', contacto: 'Contacto', terminos: 'Términos y condiciones' };
  const EXT_URL = { inicio: '', nosotros: 'nosotros', contacto: 'contacto', terminos: '' };
  C.route('/externo/:p', function (params) {
    const t = EXT[params.p] || 'Página';
    return {
      layout: 'public', mainCls: 'pub-center', title: t,
      html: '<section class="ext"><p class="eyebrow">Página existente</p><h1 class="h1">' + e(t) + '</h1>' +
        '<p class="muted">Esta página se mantiene igual que en la web actual de Cooltiva y no forma parte de este prototipo.</p>' +
        '<div class="row mt-24 ext-actions"><a class="btn" href="https://staging.cooltiva.market/' + (EXT_URL[params.p] || '') + '" target="_blank" rel="noopener">' + C.icon('external', 18) + '<span>Ver en staging</span></a>' +
        '<a class="btn btn-primary" href="' + (C.S.session.loggedIn ? '#/cuenta/tienda' : '#/acceso?modo=login') + '">Ir a la tienda</a></div></section>'
    };
  });
})();
