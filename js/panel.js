/* =========================================================
   PANEL DE VENDEDORES
   Empresas · Ficha (edición en borrador) · Revisar y enviar ·
   Aprobaciones · Nueva cuenta (wizard) · Registro · Equipo ·
   Modo vendedor (comprar por el cliente)
   Principio: rápido para el vendedor. Poca información por
   pantalla; el control está en "borrador → aprobar".
   ========================================================= */
(function () {
  const e = C.esc;
  const A = C.actions;
  const P = function () { return C.S.panel; };

  /* ---------- utilidades ---------- */
  C.nowISO = function () { const d = new Date(); return C.isoDate(C.DEMO_TODAY) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const fmtDT = function (iso) { return iso ? C.fmtCreated(iso) : '—'; };
  const initials = function (n) { return String(n || '?').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };
  const avatar = function (n, cls) { return '<span class="pn-av' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + e(initials(n)) + '</span>'; };
  const badge = function (t, kind) { return '<span class="pn-badge is-' + (kind || 'neutral') + '">' + e(t) + '</span>'; };
  const fullName = function (u) { return ((u.nombre || '') + ' ' + (u.apellido || '')).trim(); };
  const cap = function (s) { return String(s || '').replace(/^./, function (c) { return c.toUpperCase(); }); };
  function log(accion, empresaId, texto, req) {
    P().log.unshift({ id: C.uid('l'), fecha: C.nowISO(), actor: P().persona, accion: accion, empresaId: empresaId, texto: texto, req: req || null });
  }
  function guard() { return P().loggedIn ? null : { redirect: '/panel/login' }; }
  function reviewCount() { return P().requests.filter(function (r) { return r.estado === 'pendiente' && r.revisor === P().persona; }).length; }
  function defaultApprover() { const o = P().equipo.filter(function (p) { return p.id !== P().persona; }); return o.length ? o[0].id : ''; }
  function usersOf(emp) { return [Object.assign({ id: 'principal', principal: true }, emp.user)].concat(emp.empleados || []); }
  function empEstado(emp) {
    if (emp.estado === 'pendiente_alta') return badge('Alta en aprobación', 'pending');
    if (emp.estado === 'rechazada') return badge('Alta rechazada', 'alert');
    return C.pendingReqs(emp.id).length ? badge('En aprobación', 'pending') : '';
  }
  const clientVia = function (emp) { return 'correo y WhatsApp' + (emp && emp.user && emp.user.email ? ' (' + emp.user.email + ' · ' + (emp.user.wa || '—') + ')' : ''); };

  /* ---------- Layout del panel ---------- */
  const NAV = [
    { id: 'empresas', label: 'Empresas', icon: 'building', href: '#/panel/empresas' },
    { id: 'nueva', label: 'Nueva cuenta', short: 'Nueva', icon: 'plus', href: '#/panel/nueva/contacto' },
    { id: 'aprobaciones', label: 'Aprobaciones', short: 'Aprobar', icon: 'inbox', href: '#/panel/aprobaciones' },
    { id: 'registro', label: 'Registro de cambios', short: 'Registro', icon: 'history', href: '#/panel/registro' },
    { id: 'equipo', label: 'Equipo', icon: 'users', href: '#/panel/equipo' }
  ];
  C.layouts.panel = function (page) {
    const me = C.persona();
    const n = reviewCount();
    const nav = function (cls) {
      return NAV.map(function (i) {
        const on = page.nav === i.id;
        const count = i.id === 'aprobaciones' && n ? '<span class="pn-count">' + n + '</span>' : '';
        return '<a class="' + cls + (on ? ' is-active' : '') + '" href="' + i.href + '"' + (on ? ' aria-current="page"' : '') + '>' + C.icon(i.icon, 19) +
          '<span>' + (cls === 'pn-tab' ? (i.short || i.label) : i.label) + '</span>' + count + '</a>';
      }).join('');
    };
    const menu = C.ui.personaMenu
      ? '<div class="pn-menu-scrim" data-action="pnPersonaMenu"></div><div class="pn-menu" role="menu"><p class="eyebrow">Cambiar de perfil (demo)</p>' +
        P().equipo.map(function (p) {
          return '<button type="button" class="pn-menu-item' + (p.id === me.id ? ' is-on' : '') + '" role="menuitem" data-action="pnPersona" data-arg="' + p.id + '">' + avatar(p.nombre) + '<span><strong>' + e(p.nombre) + '</strong><span class="muted small">' + e(p.rol) + '</span></span></button>';
        }).join('') +
        '<hr class="divider"><a class="pn-menu-item" href="#/acceso" role="menuitem">' + C.icon('store', 18) + '<span>Ir a la tienda (cliente)</span></a>' +
        '<button type="button" class="pn-menu-item" role="menuitem" data-action="pnLogout">' + C.icon('logout', 18) + '<span>Cerrar sesión</span></button></div>'
      : '';
    return '<div class="pn">' +
      '<header class="pn-top"><a class="pn-brand" href="#/panel/empresas"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="110" height="31"><span class="pn-brand-t">Panel de vendedores</span></a>' +
      '<div class="pn-top-right"><a class="pn-bell" href="#/panel/aprobaciones" aria-label="Aprobaciones por revisar: ' + n + '">' + C.icon('bell', 20) + (n ? '<span class="pn-dot">' + n + '</span>' : '') + '</a>' +
      '<button type="button" class="pn-persona" data-action="pnPersonaMenu" aria-haspopup="menu" aria-expanded="' + !!C.ui.personaMenu + '" aria-label="Perfil: ' + e(me.nombre) + '">' + avatar(me.nombre) +
      '<span class="pn-persona-t"><strong>' + e(me.nombre) + '</strong><span>' + e(me.rol) + '</span></span>' + C.icon('chevDown', 16) + '</button>' + menu + '</div></header>' +
      '<div class="pn-body"><aside class="pn-side" aria-label="Navegación del panel"><nav class="pn-nav">' + nav('pn-link') + '</nav>' +
      '<div class="pn-side-foot"><a class="pn-link" href="#/acceso">' + C.icon('store', 19) + '<span>Ver tienda del cliente</span></a></div></aside>' +
      '<main class="pn-main' + (page.actionBar ? ' has-bar' : '') + '" id="main"><div class="pn-content' + (page.narrow ? ' is-narrow' : '') + '">' + page.html + '</div></main></div>' +
      (page.actionBar ? '<div class="pn-actionbar">' + page.actionBar + '</div>' : '') +
      '<nav class="pn-tabbar" aria-label="Navegación del panel">' + nav('pn-tab') + '</nav></div>';
  };
  A.pnPersonaMenu = function () { C.ui.personaMenu = !C.ui.personaMenu; C.set(); };
  A.pnPersona = function (el) {
    P().persona = el.dataset.arg; C.ui.personaMenu = false; C.set();
    C.toast('Ahora estás como ' + C.persona().nombre);
  };
  A.pnLogout = function () { P().loggedIn = false; C.save(); C.go('/panel/login'); };
  A.pnGo = function (el) { C.go(el.dataset.arg); };

  /* ---------- Login ---------- */
  C.route('/panel', function () { return { redirect: P().loggedIn ? '/panel/empresas' : '/panel/login' }; });
  C.route('/panel/login', function () {
    if (P().loggedIn) return { redirect: '/panel/empresas' };
    if (!C.ui.draft.persona) C.ui.draft.persona = 'fabiana';
    return {
      layout: 'bare', title: 'Panel de vendedores',
      html: '<div class="pn-login"><section class="pn-login-card"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="130" height="37">' +
        '<p class="eyebrow mt-16">Cooltiva · uso interno</p><h1 class="h1">Panel de vendedores</h1>' +
        '<p class="muted">Crea y administra cuentas de clientes. Los cambios los aprueba otra persona.</p>' +
        '<div class="stack mt-24">' +
        C.field({ label: 'Correo de Cooltiva', bind: 'ui.draft.email', type: 'email', placeholder: 'nombre@cooltiva.bo', autocomplete: 'username' }) +
        C.field({ label: 'Contraseña', bind: 'ui.draft.pass', type: 'password', autocomplete: 'current-password' }) +
        C.selectField({ label: 'Perfil (solo para el demo)', bind: 'ui.draft.persona', options: P().equipo.map(function (p) { return { value: p.id, label: p.nombre + ' · ' + p.rol }; }) }) +
        C.btn('Entrar al panel', { primary: true, block: true, action: 'pnLogin' }) + '</div>' +
        '<a class="link mt-16 pn-login-back" href="#/acceso">Volver a la tienda</a></section></div>'
    };
  });
  A.pnLogin = function () {
    const d = C.ui.draft, err = {};
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) err['ui.draft.email'] = 'Escribe tu correo de Cooltiva';
    if (!d.pass) err['ui.draft.pass'] = 'Escribe tu contraseña';
    if (Object.keys(err).length) return C.fail(err);
    P().loggedIn = true; P().persona = d.persona || 'fabiana';
    C.save(); C.go('/panel/empresas');
  };

  /* ======================= EMPRESAS (lista mínima) ======================= */
  function filteredEmpresas() {
    const q = (C.ui.draft.q || '').toLowerCase().trim();
    return Object.keys(C.S.empresas).map(function (k) { return C.S.empresas[k]; }).filter(function (emp) {
      if (!q) return true;
      const hay = [emp.empresa, emp.formaJuridica.razon, emp.formaJuridica.nit].concat(usersOf(emp).map(function (u) { return fullName(u) + ' ' + u.email; })).join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    }).sort(function (a, b) { return (b.actualizado || '').localeCompare(a.actualizado || ''); });
  }
  function empresaList() {
    const list = filteredEmpresas();
    if (!list.length) return '<div class="empty"><p class="h3">No hay empresas que coincidan</p></div>';
    return list.map(function (emp) {
      const rows = usersOf(emp).map(function (u) {
        return '<tr data-action="pnGoUser" data-arg="' + emp.id + '|' + u.id + '" tabindex="0" role="link"><td data-label="Usuario"><span class="pn-user">' + avatar(fullName(u) || u.email, 'is-sm') + '<strong>' + e(fullName(u) || 'Sin nombre') + '</strong>' + (u.principal ? badge('Principal', 'neutral') : '') + '</span></td>' +
          '<td data-label="Rol">' + e(u.rol || '—') + '</td><td data-label="Correo">' + e(u.email || '—') + '</td><td data-label="WhatsApp">' + e(u.wa || '—') + '</td></tr>';
      }).join('');
      return '<section class="pn-emp card"><header class="pn-emp-head" data-action="pnGo" data-arg="/panel/empresa/' + emp.id + '/usuarios" role="link" tabindex="0">' +
        '<div class="pn-emp-id">' + avatar(emp.empresa, 'is-sq') + '<h2 class="h3">' + e(emp.empresa) + '</h2>' + empEstado(emp) + '</div>' +
        '<span class="pn-emp-chev" aria-hidden="true">' + C.icon('chevRight', 20) + '</span></header>' +
        '<table class="pn-table pn-users"><thead><tr><th>Usuario</th><th>Rol</th><th>Correo</th><th>WhatsApp</th></tr></thead><tbody>' + rows + '</tbody></table></section>';
    }).join('');
  }
  C.live.pnFilter = function () { const l = document.getElementById('pn-list'); if (l) l.innerHTML = empresaList(); };

  C.route('/panel/empresas', function () {
    const g = guard(); if (g) return g;
    const N = P().nueva;
    const draftBanner = N.maxStep > 0
      ? '<div class="pn-banner"><span>' + C.icon('edit', 18) + '<span>Alta en borrador: <strong>' + e(N.contacto.empresa || 'Sin nombre') + '</strong></span></span><a class="btn btn-sm" href="#/panel/nueva/' + NUEVA_STEPS[Math.min(N.maxStep, NUEVA_STEPS.length - 1)] + '">Continuar</a></div>' : '';
    const html = '<div class="pn-head"><h1 class="h1">Empresas</h1><a class="btn btn-primary" href="#/panel/nueva/contacto">' + C.icon('plus', 18) + '<span>Nueva cuenta</span></a></div>' + draftBanner +
      '<label class="pn-search">' + C.icon('search', 18) + '<span class="sr-only">Buscar</span><input class="input" type="search" placeholder="Buscar empresa o usuario" data-bind="ui.draft.q" data-live="pnFilter" value="' + e(C.ui.draft.q || '') + '"></label>' +
      '<div id="pn-list" class="pn-list">' + empresaList() + '</div>';
    return { layout: 'panel', nav: 'empresas', title: 'Empresas', html: html };
  });
  /* Tocar un usuario abre su información lista para editar */
  A.pnGoUser = function (el) {
    const a = el.dataset.arg.split('|'), id = a[0], uid = a[1];
    const v = C.empView(id), u = usersOf(v).find(function (x) { return x.id === uid; });
    const locked = C.S.empresas[id].estado !== 'activa' || C.pendingKeys(id)[uid === 'principal' ? 'path:user' : 'empleados:' + uid];
    C.goWith('/panel/empresa/' + id + '/usuarios', locked || !u ? {} : { editing: { type: 'user', id: uid }, draft: C.clone(u) });
  };

  /* ======================= FICHA DE EMPRESA ======================= */
  const TABS = [['usuarios', 'Usuarios'], ['legal', 'Datos legales'], ['sucursales', 'Sucursales'], ['recepcionistas', 'Recepcionistas'], ['credito', 'Crédito y contrato'], ['pedidos', 'Pedidos'], ['historial', 'Historial']];

  function marker(empId, key) {
    const pk = C.pendingKeys(empId), dk = C.draftKeys(empId);
    if (pk[key]) return { pending: pk[key], html: badge('En aprobación', 'pending') };
    if (dk[key]) return { draft: dk[key], html: badge(dk[key] === 'add' ? 'Nuevo' : (dk[key] === 'remove' ? 'Se eliminará' : 'Editado'), 'draft') };
    return {};
  }
  function actions(m, locked, editArg, delArg) {
    if (locked) return '';
    if (m.pending) return '<span class="muted small">Bloqueado</span>';
    return C.link('Editar', 'pnEdit', editArg) + (delArg ? C.link('Eliminar', 'pnDelete', delArg) : '');
  }
  function removedRows(empId, coll, render) {
    const dk = C.draftKeys(empId), base = C.empresa(empId);
    return base[coll].filter(function (x) { return dk[coll + ':' + x.id] === 'remove'; }).map(render).join('');
  }
  function formCard(title, body, saveArg) {
    return '<section class="card card-strong card-pad form-card reveal"><h3 class="h3">' + e(title) + '</h3><div class="mt-16">' + body + '</div>' +
      '<div class="form-actions">' + C.btn('Cancelar', { action: 'pnCancel' }) + C.btn('Guardar en el borrador', { primary: true, action: 'pnSave', arg: saveArg }) + '</div></section>';
  }
  const isEditing = function (type, id) { return C.ui.editing && C.ui.editing.type === type && C.ui.editing.id === id; };
  const secHead = function (title, btn) { return '<div class="pn-sec-head"><h2 class="h2">' + title + '</h2>' + (btn || '') + '</div>'; };

  function userFields() {
    return '<div class="form-grid">' +
      C.field({ label: 'Nombre', bind: 'ui.draft.nombre' }) + C.field({ label: 'Apellido', bind: 'ui.draft.apellido' }) +
      C.selectField({ label: 'Rol', bind: 'ui.draft.rol', placeholder: 'Elegir rol', options: C.ROLES.map(function (r) { return { value: r, label: r }; }) }) +
      C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel', placeholder: '+591 7000 0000' }) +
      C.field({ label: 'Correo electrónico', bind: 'ui.draft.email', type: 'email', cls: 'span-2', placeholder: 'nombre@empresa.bo' }) + '</div>';
  }
  function tabUsuarios(id, v, locked) {
    let html = secHead('Usuarios', locked ? '' : C.btn('+ Agregar usuario', { action: 'pnNew', arg: 'user', disabled: C.ui.creating === 'user' }));
    if (C.ui.creating === 'user') html += formCard('Nuevo usuario', userFields(), 'user:new');
    const rows = usersOf(v).map(function (u) {
      const key = u.principal ? 'path:user' : 'empleados:' + u.id, m = marker(id, key);
      if (isEditing('user', u.id)) return '<tr class="pn-tr-form"><td colspan="5">' + formCard(u.principal ? 'Contacto principal' : 'Editar usuario', userFields(), 'user:' + u.id) + '</td></tr>';
      return '<tr' + (m.draft ? ' class="is-draft"' : '') + '><td data-label="Usuario"><span class="pn-user">' + avatar(fullName(u) || u.email, 'is-sm') + '<strong>' + e(fullName(u) || 'Sin nombre') + '</strong>' + (u.principal ? badge('Principal', 'neutral') : '') + '</span>' + (m.html || '') + '</td>' +
        '<td data-label="Rol">' + e(u.rol || '—') + '</td><td data-label="Correo">' + e(u.email || '—') + '</td><td data-label="WhatsApp">' + e(u.wa || '—') + '</td>' +
        '<td class="pn-td-actions">' + actions(m, locked, 'user:' + u.id, u.principal ? null : 'empleados:' + u.id) + '</td></tr>';
    }).join('') + removedRows(id, 'empleados', function (u) {
      return '<tr class="is-removed"><td data-label="Usuario">' + e(fullName(u) || u.email) + ' ' + badge('Se eliminará', 'draft') + '</td><td>' + e(u.rol || '') + '</td><td>' + e(u.email) + '</td><td>' + e(u.wa) + '</td><td class="pn-td-actions">' + C.link('Deshacer', 'pnUndo', 'empleados:' + u.id) + '</td></tr>';
    });
    return html + '<table class="pn-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Correo</th><th>WhatsApp</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function legalView(v) {
    const fj = v.formaJuridica, f = C.FORMAS_JURIDICAS.find(function (x) { return x.id === fj.tipo; });
    const rows = [['Nombre comercial', v.empresa], ['Forma jurídica', f ? f.label : '—']].concat(fj.tipo === 'natural' ? [['CI', fj.ci]] : [['Razón social', fj.razon], ['NIT', fj.nit], ['Matrícula de comercio', fj.matricula]]);
    return '<dl class="pn-dl">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + e(r[1] || '—') + '</dd></div>'; }).join('') + '</dl>';
  }
  function legalFields() {
    const d = C.ui.draft;
    const cards = C.FORMAS_JURIDICAS.map(function (f) { return C.choice({ label: f.label, selected: d.tipo === f.id, action: 'pnFj', arg: f.id }); }).join('');
    return '<div class="stack">' + C.field({ label: 'Nombre comercial', bind: 'ui.draft.empresa' }) +
      '<div class="field' + C.errCls('tipo') + '"><span class="label">Forma jurídica</span><div class="choice-grid cols-3">' + cards + '</div>' + C.err('tipo') + '</div>' +
      (d.tipo === 'natural' ? C.field({ label: 'CI', bind: 'ui.draft.ci' })
        : '<div class="form-grid">' + C.field({ label: 'Razón social', bind: 'ui.draft.razon', cls: 'span-2' }) + C.field({ label: 'NIT', bind: 'ui.draft.nit', inputmode: 'numeric' }) + C.field({ label: 'Matrícula de comercio', bind: 'ui.draft.matricula' }) + '</div>') + '</div>';
  }
  function tabLegal(id, v, locked) {
    const m1 = marker(id, 'path:formaJuridica'), m2 = marker(id, 'path:empresa');
    const head = secHead('Datos legales', locked || m1.pending || m2.pending || isEditing('legal', 'x') ? '' : C.btn('Editar', { action: 'pnEdit', arg: 'legal:x', icon: 'edit' }));
    if (isEditing('legal', 'x')) return head + formCard('Editar datos legales', legalFields(), 'legal:x');
    return head + '<div class="card card-pad">' + (m1.html || m2.html || '') + legalView(v) + '</div>';
  }

  function sucFields() {
    return C.map({ interactive: true, action: 'pnMap', pin: C.ui.draft.pin }) + '<div class="form-grid mt-16">' +
      C.field({ label: 'Dirección', bind: 'ui.draft.dir', placeholder: 'Ej. Av. 6 de Agosto 1234' }) + C.field({ label: 'Ciudad', bind: 'ui.draft.ciudad', placeholder: 'Ej. La Paz' }) + '</div>';
  }
  A.pnMap = function (el, ev) {
    const g = C.geocodeFromClick(el, ev);
    C.ui.draft.pin = g.pin; C.ui.draft.dir = g.dir; C.ui.draft.ciudad = g.ciudad;
    delete C.ui.errors['ui.draft.dir']; delete C.ui.errors['ui.draft.ciudad'];
    C.set();
  };
  function tabSucursales(id, v, locked) {
    let html = secHead('Sucursales', locked ? '' : C.btn('+ Agregar sucursal', { action: 'pnNew', arg: 'suc', disabled: C.ui.creating === 'suc' }));
    if (C.ui.creating === 'suc') html += formCard('Nueva sucursal', sucFields(), 'suc:new');
    html += '<div class="pn-grid">' + v.sucursales.map(function (s) {
      const m = marker(id, 'sucursales:' + s.id);
      if (isEditing('suc', s.id)) return '<div class="pn-grid-full">' + formCard('Editar sucursal', sucFields(), 'suc:' + s.id) + '</div>';
      return '<article class="card pn-suc' + (m.draft ? ' is-draft' : '') + '"><div class="pn-suc-map">' + C.map({ small: true, pin: s.pin }) + '</div>' +
        '<div class="pn-suc-body"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span>' + (m.html || '') +
        '<div class="item-actions">' + actions(m, locked, 'suc:' + s.id, 'sucursales:' + s.id) + '</div></div></article>';
    }).join('') + removedRows(id, 'sucursales', function (s) {
      return '<article class="card pn-suc is-removed"><div class="pn-suc-body"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span>' + badge('Se eliminará con sus recepcionistas', 'draft') +
        '<div class="item-actions">' + C.link('Deshacer', 'pnUndo', 'sucursales:' + s.id) + '</div></div></article>';
    }) + '</div>';
    return html;
  }

  function recFields(v) {
    return '<div class="form-grid">' +
      C.selectField({ label: 'Sucursal', bind: 'ui.draft.sucursalId', placeholder: 'Elegir sucursal', cls: 'span-2', options: v.sucursales.map(function (s) { return { value: s.id, label: C.sucLabel(s) }; }) }) +
      C.field({ label: 'Nombre recepcionista', bind: 'ui.draft.nombre' }) + C.field({ label: 'Teléfono recepcionista', bind: 'ui.draft.tel', inputmode: 'tel' }) + '</div>';
  }
  function tabRecepcionistas(id, v, locked) {
    let html = secHead('Recepcionistas', locked || !v.sucursales.length ? '' : C.btn('+ Agregar recepcionista', { action: 'pnNew', arg: 'rec', disabled: C.ui.creating === 'rec' }));
    if (C.ui.creating === 'rec') html += formCard('Nuevo recepcionista', recFields(v), 'rec:new');
    html += v.sucursales.map(function (s) {
      const rs = v.recepcionistas.filter(function (r) { return r.sucursalId === s.id; });
      return '<section class="pn-group"><h3 class="pn-group-t">' + C.icon('pin', 16) + e(s.dir) + ' <span class="muted">· ' + e(s.ciudad) + '</span></h3>' +
        (rs.length ? '<table class="pn-table"><tbody>' + rs.map(function (r) {
          const m = marker(id, 'recepcionistas:' + r.id);
          if (isEditing('rec', r.id)) return '<tr class="pn-tr-form"><td colspan="3">' + formCard('Editar recepcionista', recFields(v), 'rec:' + r.id) + '</td></tr>';
          return '<tr' + (m.draft ? ' class="is-draft"' : '') + '><td data-label="Nombre"><strong>' + e(r.nombre) + '</strong>' + (m.html || '') + '</td><td data-label="Teléfono">' + e(r.tel || '—') + '</td><td class="pn-td-actions">' + actions(m, locked, 'rec:' + r.id, 'recepcionistas:' + r.id) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p class="pn-warn">' + C.icon('alert', 16) + ' Sin recepcionista: el cliente no podrá elegir quién recibe.</p>') + '</section>';
    }).join('') + removedRows(id, 'recepcionistas', function (r) {
      return '<p class="is-removed">' + e(r.nombre) + ' ' + badge('Se eliminará', 'draft') + ' ' + C.link('Deshacer', 'pnUndo', 'recepcionistas:' + r.id) + '</p>';
    });
    return html;
  }

  /* Contrato generado con las condiciones */
  C.contratoPanel = function (o) {
    const ident = o.tipo === 'natural' ? 'con CI ' + (o.ci || '—') : (o.razon || o.empresa || '—') + ', con NIT ' + (o.nit || '—');
    const v = function (x) { return '<mark>' + e(x) + '</mark>'; };
    return '<h4 class="contract-h">Contrato de línea de crédito comercial</h4>' +
      '<p class="contract-p">Entre Cooltiva S.R.L. y ' + v(ident) + ' (“el Cliente”), se acuerda una línea de crédito por ' + v(C.bs(Number(o.linea) || 0)) + ' para la compra de insumos en la plataforma.</p>' +
      '<p class="contract-p">Cada pedido pagado con crédito vence a los ' + v((o.plazo || 30) + ' días') + ' calendario desde su entrega. Los pagos vencidos generan un interés moratorio del 1,5% mensual.</p>' +
      C.CONTRATO.slice(2).map(function (s) { return '<h4 class="contract-h">' + e(s.t) + '</h4><p class="contract-p">' + e(s.p) + '</p>'; }).join('');
  };
  function docsList(docs) {
    return '<ul class="pn-docs">' + C.DOC_KEYS.map(function (k) {
      const f = (docs && docs[k]) || [];
      return '<li class="' + (f.length ? 'is-ok' : 'is-missing') + '"><span class="pn-doc-mark" aria-hidden="true">' + C.icon(f.length ? 'check' : 'x', 13) + '</span><span><strong>' + C.DOC_LABELS[k] + '</strong><span class="muted small">' + (f.length ? e(f.map(function (x) { return x.name; }).join(', ')) : 'Falta') + '</span></span></li>';
    }).join('') + '</ul>';
  }
  function creditFields() {
    const d = C.ui.draft;
    return '<div class="stack">' +
      '<div class="field"><span class="label">Estado</span>' + C.segmented({ value: d.estado, action: 'pnCredEstado', options: [{ value: 'aprobado', label: 'Crédito aprobado' }, { value: 'no', label: 'Sin crédito' }] }) + '</div>' +
      (d.estado === 'aprobado' ? '<div class="form-grid">' + C.field({ label: 'Línea aprobada (Bs)', bind: 'ui.draft.linea', numeric: true, placeholder: 'Ej. 10000' }) +
        C.selectField({ label: 'Plazo de pago', bind: 'ui.draft.plazo', options: [15, 30, 45, 60].map(function (p) { return { value: String(p), label: p + ' días' }; }) }) + '</div>' +
        '<div><p class="upload-label">Documentos del cliente</p><div class="docs pn-docs-up">' +
        C.CREDITO_DOCS.map(function (doc) { return C.uploadSlot({ path: 'ui.draft.docs.' + doc.key, label: doc.label, multiple: doc.multiple, max: doc.max, cta: doc.cta, sub: doc.sub }); }).join('') +
        C.uploadSlot({ path: 'ui.draft.docs.anverso', label: 'Carnet · anverso', cta: 'Anverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) +
        C.uploadSlot({ path: 'ui.draft.docs.reverso', label: 'Carnet · reverso', cta: 'Reverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) + '</div></div>' : '') + '</div>';
  }
  function tabCredito(id, v, locked) {
    const c = v.credito, m = marker(id, 'path:credito');
    const aprobado = c.estado === 'aprobado';
    const head = secHead('Crédito y contrato', locked || m.pending || isEditing('cred', 'x') ? '' : C.btn(aprobado ? 'Editar condiciones' : 'Crear contrato de crédito', { action: 'pnEdit', arg: 'cred:x', icon: aprobado ? 'edit' : 'fileText', primary: !aprobado }));
    if (isEditing('cred', 'x')) return head + formCard(aprobado ? 'Editar condiciones del crédito' : 'Crear contrato de crédito', creditFields(), 'cred:x');
    const solicitado = c.estado === 'solicitado' ? '<div class="pn-banner">' + C.icon('alert', 18) + '<span>El cliente pidió crédito desde la web. Revisa sus documentos y crea el contrato.</span></div>' : '';
    return head + solicitado + (m.html ? '<div class="mt-8">' + m.html + '</div>' : '') +
      '<div class="pn-credit"><div class="stack">' +
      '<section class="card card-pad"><div class="row-between"><h3 class="h3">Condiciones</h3>' + badge(C.CREDITO_ESTADOS[c.estado], aprobado ? 'ok' : 'neutral') + '</div>' +
      '<dl class="pn-kpis"><div><dt>Línea</dt><dd>' + (aprobado ? C.bs(c.linea) : '—') + '</dd></div><div><dt>Plazo</dt><dd>' + c.plazo + ' días</dd></div>' +
      '<div><dt>Disponible</dt><dd>' + (aprobado ? C.bs(c.linea - (c.usado || 0)) : '—') + '</dd></div></dl></section>' +
      '<section class="card card-pad"><h3 class="h3">Documentos</h3>' + docsList(c.docs) + '</section></div>' +
      '<section class="card card-pad pn-contract"><div class="row-between"><h3 class="h3">Contrato</h3>' + badge(aprobado ? 'Vigente' : 'Sin contrato', aprobado ? 'ok' : 'neutral') + '</div>' +
      (aprobado ? '<div class="contract-body contract-body-sm">' + C.contratoPanel({ tipo: v.formaJuridica.tipo, ci: v.formaJuridica.ci, razon: v.formaJuridica.razon, nit: v.formaJuridica.nit, empresa: v.empresa, linea: c.linea, plazo: c.plazo }) + '</div>' +
        C.btn('Descargar contrato', { block: true, icon: 'download', action: 'downloadContract' })
        : '<p class="muted mt-8">Esta empresa no tiene contrato de crédito.</p>') + '</section></div>';
  }

  function tabPedidos(id, v) {
    const list = v.pedidos.slice().sort(function (a, b) { return b.creado.localeCompare(a.creado); });
    const btn = v.estado === 'activa' ? C.btn('Hacer pedido para el cliente', { primary: true, icon: 'store', action: 'pnActAs', arg: id }) : '';
    const head = secHead('Pedidos', btn);
    if (!list.length) return head + '<div class="empty"><p class="h3">Sin pedidos todavía</p></div>';
    return head + '<table class="pn-table"><thead><tr><th>Pedido</th><th>Entrega</th><th>Pago</th><th class="ta-r">Total</th></tr></thead><tbody>' +
      list.map(function (o) {
        return '<tr><td data-label="Pedido"><strong>#' + o.id + '</strong>' + (o.porVendedor ? badge('Vendedor', 'neutral') : '') + '<span class="muted small pn-sub">' + e(o.items.map(function (i) { return i.name + ' ' + i.qty; }).join(' · ')) + '</span></td>' +
          '<td data-label="Entrega">' + C.fmtDay(o.entregaFecha) + ' · ' + e(o.franja) + '</td><td data-label="Pago">' + e(o.pago) + '</td><td data-label="Total" class="ta-r"><strong>' + C.bs(o.total) + '</strong></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function tabHistorial(id) {
    return secHead('Historial') + logTable(P().log.filter(function (l) { return l.empresaId === id; }), false);
  }

  const ACCION = { envio: 'Envío', aprobacion: 'Aprobación', rechazo: 'Rechazo', notificacion: 'Aviso al cliente', pedido: 'Pedido', alta: 'Alta', cancelacion: 'Cancelación' };
  function logTable(entries, withEmpresa) {
    if (!entries.length) return '<p class="muted">Sin movimientos.</p>';
    return '<table class="pn-table pn-log"><thead><tr><th>Fecha</th><th>Persona</th>' + (withEmpresa ? '<th>Empresa</th>' : '') + '<th>Qué pasó</th></tr></thead><tbody>' +
      entries.map(function (l) {
        const emp = C.empresa(l.empresaId);
        return '<tr><td data-label="Fecha" class="nowrap">' + fmtDT(l.fecha) + '</td><td data-label="Persona">' + e(C.persona(l.actor).nombre) + '</td>' +
          (withEmpresa ? '<td data-label="Empresa">' + (emp ? '<a href="#/panel/empresa/' + emp.id + '/historial">' + e(emp.empresa) + '</a>' : '—') + '</td>' : '') +
          '<td data-label="Qué pasó">' + e(l.texto) + (l.req ? ' <a class="link" href="#/panel/solicitud/' + l.req + '">#' + l.req + '</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  C.route('/panel/empresa/:id/:tab', function (params) {
    const g = guard(); if (g) return g;
    const base = C.empresa(params.id);
    if (!base) return { redirect: '/panel/empresas' };
    if (params.tab === 'revisar') return revisarPage(params.id);
    const v = C.empView(params.id);
    const tab = TABS.some(function (t) { return t[0] === params.tab; }) ? params.tab : 'usuarios';
    const locked = base.estado !== 'activa';
    const tabs = TABS.map(function (t) {
      const on = t[0] === tab;
      return '<a class="pn-tabs-a' + (on ? ' is-active' : '') + '" href="#/panel/empresa/' + params.id + '/' + t[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
    }).join('');
    let banners = C.pendingReqs(params.id).map(function (r) {
      return '<div class="pn-banner is-pending">' + C.icon('clock', 18) + '<span>Esperando la aprobación de <strong>' + e(C.persona(r.revisor).nombre) + '</strong>. Los datos involucrados quedan bloqueados.</span><a class="btn btn-sm" href="#/panel/solicitud/' + r.id + '">Ver</a></div>';
    }).join('');
    if (base.estado === 'rechazada') banners += '<div class="pn-banner is-alert">' + C.icon('alert', 18) + '<span>El alta fue rechazada. Mira el motivo en Historial.</span></div>';
    const body = { usuarios: tabUsuarios, legal: tabLegal, sucursales: tabSucursales, recepcionistas: tabRecepcionistas, credito: tabCredito, pedidos: tabPedidos, historial: tabHistorial }[tab](params.id, v, locked);
    const n = C.draftOps(params.id).length;
    const html = '<nav class="pn-crumbs" aria-label="Ruta"><a href="#/panel/empresas">' + C.icon('arrowLeft', 16) + ' Empresas</a></nav>' +
      '<header class="pn-emp-hero"><div class="pn-emp-id">' + avatar(v.empresa, 'is-sq is-lg') + '<h1 class="h1">' + e(v.empresa) + '</h1>' + empEstado(base) + '</div>' +
      (base.estado === 'activa' ? '<div class="pn-hero-actions">' + C.btn('Hacer pedido', { icon: 'store', action: 'pnActAs', arg: params.id }) + '</div>' : '') + '</header>' +
      banners + '<nav class="pn-tabs" aria-label="Secciones de la empresa">' + tabs + '</nav><div class="pn-tab-body">' + body + '</div>';
    const bar = n ? '<div class="pn-actionbar-in"><span class="pn-ab-t"><span class="pn-ab-dot" aria-hidden="true"></span><strong>' + n + (n === 1 ? ' cambio' : ' cambios') + ' sin enviar</strong></span>' +
      '<span class="pn-ab-actions">' + C.btn('Descartar', { action: 'pnDiscard', arg: params.id, sm: true }) + '<a class="btn btn-primary btn-sm" href="#/panel/empresa/' + params.id + '/revisar">Revisar y enviar</a></span></div>' : '';
    return { layout: 'panel', nav: 'empresas', title: v.empresa, html: html, actionBar: bar };
  });

  /* ---------- Edición en borrador ---------- */
  function curEmp() { const m = C.currentPath().match(/^\/panel\/empresa\/([^/]+)/); return m ? m[1] : null; }
  A.pnNew = function (el) {
    const v = C.empView(curEmp());
    C.ui.creating = el.dataset.arg; C.ui.editing = null; C.ui.errors = {};
    C.ui.draft = el.dataset.arg === 'rec' ? { sucursalId: (v.sucursales[0] || {}).id || '', nombre: '', tel: '' } : (el.dataset.arg === 'suc' ? { dir: '', ciudad: '', pin: null } : { nombre: '', apellido: '', rol: '', email: '', wa: '' });
    C.set();
  };
  A.pnEdit = function (el) {
    const id = curEmp(), v = C.empView(id);
    const parts = el.dataset.arg.split(':'), type = parts[0], eid = parts[1];
    C.ui.creating = null; C.ui.errors = {}; C.ui.editing = { type: type, id: eid };
    if (type === 'user') { const u = usersOf(v).find(function (x) { return x.id === eid; }); C.ui.draft = C.clone(u); }
    else if (type === 'suc') C.ui.draft = C.clone(v.sucursales.find(function (x) { return x.id === eid; }));
    else if (type === 'rec') C.ui.draft = C.clone(v.recepcionistas.find(function (x) { return x.id === eid; }));
    else if (type === 'legal') C.ui.draft = Object.assign({ empresa: v.empresa }, C.clone(v.formaJuridica));
    else if (type === 'cred') {
      const c = C.clone(v.credito);
      C.ui.draft = { estado: 'aprobado', linea: c.linea ? String(c.linea) : '', plazo: String(c.plazo || 30), docs: Object.assign(C.emptyDocs(), c.docs || {}), usado: c.usado || 0 };
    }
    C.set();
  };
  A.pnCancel = function () { C.ui.creating = null; C.ui.editing = null; C.ui.errors = {}; C.set(); };
  A.pnFj = function (el) { C.ui.draft.tipo = el.dataset.arg; delete C.ui.errors.tipo; C.set(); };
  A.pnCredEstado = function (el) { C.ui.draft.estado = el.dataset.arg; C.set(); };

  function validUser(d) {
    const err = {};
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if (!d.rol) err['ui.draft.rol'] = 'Elige el rol';
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) err['ui.draft.email'] = 'Escribe un correo válido';
    if ((d.wa || '').replace(/\D/g, '').length < 8) err['ui.draft.wa'] = 'Escribe un WhatsApp válido';
    return err;
  }
  A.pnSave = function (el) {
    const id = curEmp(), d = C.ui.draft, v = C.empView(id);
    const parts = el.dataset.arg.split(':'), type = parts[0], eid = parts[1];
    let err = {};
    if (type === 'user') {
      err = validUser(d); if (Object.keys(err).length) return C.fail(err);
      const val = { nombre: d.nombre.trim(), apellido: (d.apellido || '').trim(), rol: d.rol, email: d.email.trim(), wa: d.wa.trim() };
      if (eid === 'principal') C.draftAdd(id, { op: 'set', path: 'user', value: val });
      else if (eid === 'new') C.draftAdd(id, { op: 'add', coll: 'empleados', item: Object.assign({ id: C.uid('e') }, val) });
      else C.draftAdd(id, { op: 'update', coll: 'empleados', id: eid, value: val });
    } else if (type === 'suc') {
      if (!(d.dir || '').trim()) err['ui.draft.dir'] = 'Escribe la dirección o toca el mapa';
      if (!(d.ciudad || '').trim()) err['ui.draft.ciudad'] = 'Escribe la ciudad';
      if (Object.keys(err).length) return C.fail(err);
      const val = { dir: d.dir.trim(), ciudad: d.ciudad.trim(), pin: d.pin || { x: 50, y: 50 } };
      if (eid === 'new') C.draftAdd(id, { op: 'add', coll: 'sucursales', item: Object.assign({ id: C.uid('s') }, val) });
      else C.draftAdd(id, { op: 'update', coll: 'sucursales', id: eid, value: val });
    } else if (type === 'rec') {
      if (!d.sucursalId) err['ui.draft.sucursalId'] = 'Elige la sucursal';
      if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
      if ((d.tel || '').replace(/\D/g, '').length < 7) err['ui.draft.tel'] = 'Escribe un teléfono válido';
      if (Object.keys(err).length) return C.fail(err);
      const val = { nombre: d.nombre.trim(), tel: d.tel.trim(), sucursalId: d.sucursalId };
      if (eid === 'new') C.draftAdd(id, { op: 'add', coll: 'recepcionistas', item: Object.assign({ id: C.uid('r') }, val) });
      else C.draftAdd(id, { op: 'update', coll: 'recepcionistas', id: eid, value: val });
    } else if (type === 'legal') {
      if (!(d.empresa || '').trim()) err['ui.draft.empresa'] = 'Escribe el nombre comercial';
      if (!d.tipo) err.tipo = 'Elige la forma jurídica';
      else if (d.tipo === 'natural') { if (!(d.ci || '').trim()) err['ui.draft.ci'] = 'Escribe el CI'; }
      else {
        if (!(d.razon || '').trim()) err['ui.draft.razon'] = 'Escribe la razón social';
        if (!/^\d{6,}$/.test((d.nit || '').replace(/\s/g, ''))) err['ui.draft.nit'] = 'El NIT debe tener solo números';
        if (!(d.matricula || '').trim()) err['ui.draft.matricula'] = 'Escribe la matrícula';
      }
      if (Object.keys(err).length) return C.fail(err);
      if (d.empresa.trim() !== v.empresa) C.draftAdd(id, { op: 'set', path: 'empresa', value: d.empresa.trim() });
      const fj = d.tipo === 'natural' ? { tipo: 'natural', ci: d.ci.trim(), razon: '', nit: '', matricula: '' } : { tipo: d.tipo, ci: '', razon: d.razon.trim(), nit: d.nit.trim(), matricula: d.matricula.trim() };
      C.draftAdd(id, { op: 'set', path: 'formaJuridica', value: fj });
    } else if (type === 'cred') {
      if (d.estado === 'aprobado') {
        if (!(Number(d.linea) > 0)) err['ui.draft.linea'] = 'Escribe la línea aprobada';
        C.DOC_KEYS.forEach(function (k) { if (!(d.docs[k] || []).length) err['ui.draft.docs.' + k] = 'Falta este documento'; });
      }
      if (Object.keys(err).length) return C.fail(err);
      C.draftAdd(id, { op: 'set', path: 'credito', value: { estado: d.estado, linea: d.estado === 'aprobado' ? Number(d.linea) : 0, plazo: Number(d.plazo), usado: d.usado || 0, docs: d.docs } });
    }
    C.ui.creating = null; C.ui.editing = null; C.ui.errors = {};
    C.set();
    C.toast('Guardado en el borrador · aún no se aplica');
  };
  A.pnDelete = function (el) {
    const id = curEmp(), v = C.empView(id);
    const parts = el.dataset.arg.split(':'), coll = parts[0], eid = parts[1];
    const item = v[coll].find(function (x) { return x.id === eid; });
    const name = coll === 'sucursales' ? item.dir : (coll === 'recepcionistas' ? item.nombre : (fullName(item) || item.email));
    const n = coll === 'sucursales' ? v.recepcionistas.filter(function (r) { return r.sucursalId === eid; }).length : 0;
    C.ui.dialog = {
      title: '¿Eliminar ' + ({ sucursales: 'esta sucursal', recepcionistas: 'este recepcionista', empleados: 'este usuario' })[coll] + '?',
      body: '<strong>' + e(name) + '</strong>' + (n ? '<br>También se eliminarán sus ' + n + ' recepcionista' + (n > 1 ? 's' : '') + '.' : '') + '<br>Va al borrador y solo se aplica cuando otra persona lo apruebe.',
      confirm: 'Agregar al borrador', action: 'pnDeleteYes', arg: el.dataset.arg
    };
    C.renderOverlays();
  };
  A.pnDeleteYes = function (el) {
    const parts = el.dataset.arg.split(':');
    C.draftAdd(curEmp(), { op: 'remove', coll: parts[0], id: parts[1] });
    C.ui.dialog = null; C.set();
    C.toast('Eliminación agregada al borrador');
  };
  A.pnUndo = function (el) {
    const id = curEmp(), key = el.dataset.arg;
    const d = P().drafts[id]; if (!d) return;
    d.ops = d.ops.filter(function (o) { return C.opKey(o) !== key; });
    if (!d.ops.length) delete P().drafts[id];
    C.set();
  };
  A.pnDiscard = function (el) {
    C.ui.dialog = { title: '¿Descartar los cambios?', body: 'Se pierden ' + C.draftOps(el.dataset.arg).length + ' cambios sin enviar. Los datos de la empresa no cambian.', confirm: 'Descartar', action: 'pnDiscardYes', arg: el.dataset.arg };
    C.renderOverlays();
  };
  A.pnDiscardYes = function (el) {
    delete P().drafts[el.dataset.arg]; C.ui.dialog = null; C.set(); C.toast('Borrador descartado');
    if (C.currentPath().indexOf('/revisar') > -1) C.go('/panel/empresa/' + el.dataset.arg + '/usuarios');
  };

  /* ---------- Lista simple de cambios: qué se cambió, sin tablas ---------- */
  function changeList(ops, emp, removable) {
    return '<ul class="pn-changes">' + ops.map(function (o) {
      const d = C.describeOp(o, emp), k = d.kind;
      const what = cap(d.title.replace(/^(Agregar|Editar|Eliminar) /, ''));
      let detail = '';
      if (k === 'edit') detail = d.rows.map(function (r) { return '<span class="pn-chg"><span class="muted">' + e(r.label) + '</span> <s>' + e(r.before) + '</s> <b>→ ' + e(r.after) + '</b></span>'; }).join('');
      else if (k === 'add') detail = d.rows.filter(function (r) { return r.after && r.after !== '—'; }).map(function (r) { return '<span class="pn-chg"><span class="muted">' + e(r.label) + '</span> <b>' + e(r.after) + '</b></span>'; }).join('');
      else detail = '<span class="pn-chg muted">Se quita de la cuenta' + (o.coll === 'sucursales' ? ' con sus recepcionistas' : '') + '</span>';
      return '<li class="pn-change">' + badge({ add: 'Agregar', edit: 'Editar', remove: 'Eliminar' }[k], k === 'remove' ? 'alert' : (k === 'add' ? 'ok' : 'neutral')) +
        '<div class="pn-change-body"><strong>' + e(what) + '</strong><div class="pn-chgs">' + detail + '</div></div>' + (removable ? C.link('Quitar', 'pnUndo', C.opKey(o)) : '') + '</li>';
    }).join('') + '</ul>';
  }

  function approverField(bind) {
    const opts = P().equipo.filter(function (p) { return p.id !== P().persona; });
    return C.selectField({ label: 'Quién aprueba', bind: bind, err: 'revisor', placeholder: 'Elegir aprobador', options: opts.map(function (p) { return { value: p.id, label: p.nombre + ' · ' + p.rol }; }) });
  }

  /* ---------- Revisar y enviar (confirmación final) ---------- */
  function revisarPage(id) {
    const ops = C.draftOps(id), emp = C.empresa(id);
    if (!ops.length) return { redirect: '/panel/empresa/' + id + '/usuarios' };
    const d = C.ui.draft;
    if (!d.revisor || d.revisor === P().persona) d.revisor = defaultApprover();
    if (d.notificar == null) d.notificar = true;
    const html = '<nav class="pn-crumbs"><a href="#/panel/empresa/' + id + '/usuarios">' + C.icon('arrowLeft', 16) + ' ' + e(emp.empresa) + '</a></nav>' +
      '<div class="pn-head"><h1 class="h1">Revisa y envía</h1></div>' +
      '<p class="muted mb-12">' + ops.length + (ops.length === 1 ? ' cambio' : ' cambios') + ' en ' + e(emp.empresa) + '. No se aplican hasta que otra persona los apruebe.</p>' +
      changeList(ops, C.empView(id), true) +
      '<section class="card card-pad pn-send"><div class="stack">' + approverField('ui.draft.revisor') +
      C.field({ label: 'Motivo (opcional)', bind: 'ui.draft.nota', placeholder: 'Ej. El cliente lo pidió por WhatsApp' }) +
      C.checkbox({ bind: 'ui.draft.notificar', label: 'Avisar al cliente por correo y WhatsApp cuando se apruebe' }) + '</div></section>';
    const bar = '<div class="pn-actionbar-in"><span class="pn-ab-t"><strong>' + ops.length + (ops.length === 1 ? ' cambio' : ' cambios') + '</strong></span><span class="pn-ab-actions">' +
      '<a class="btn btn-sm" href="#/panel/empresa/' + id + '/usuarios">Seguir editando</a>' + C.btn('Enviar a aprobación', { primary: true, sm: true, action: 'pnSend', arg: id }) + '</span></div>';
    return { layout: 'panel', nav: 'empresas', title: 'Revisar cambios', html: html, narrow: true, actionBar: bar };
  }
  A.pnSend = function (el) {
    const id = el.dataset.arg, d = C.ui.draft;
    if (!d.revisor) return C.fail({ revisor: 'Elige quién aprueba' });
    const emp = C.empresa(id), ops = C.clone(C.draftOps(id));
    const req = { id: P().nextReq++, tipo: 'cambios', empresaId: id, empresaNombre: emp.empresa, autor: P().persona, revisor: d.revisor, estado: 'pendiente', fecha: C.nowISO(), notificar: d.notificar !== false, nota: (d.nota || '').trim(), ops: ops };
    P().requests.unshift(req);
    delete P().drafts[id];
    log('envio', id, 'Envió ' + ops.length + (ops.length === 1 ? ' cambio' : ' cambios') + ' a aprobación de ' + C.persona(d.revisor).nombre, req.id);
    C.save();
    C.go('/panel/solicitud/' + req.id + '?enviada=1');
  };

  /* ======================= SOLICITUD (simple) ======================= */
  function altaSummary(emp) {
    const fj = emp.formaJuridica, c = emp.credito;
    const legal = fj.tipo === 'natural' ? 'Persona natural · CI ' + (fj.ci || '—') : (fj.razon || '—') + ' · NIT ' + (fj.nit || '—');
    const rows = [
      ['Contacto', e(fullName(emp.user)) + ' · ' + e(emp.user.rol) + '<br><span class="muted">' + e(emp.user.email) + ' · ' + e(emp.user.wa) + '</span>'],
      ['Datos legales', e(legal)],
      ['Sucursales', emp.sucursales.map(function (s) { return e(s.dir + ', ' + s.ciudad); }).join('<br>')],
      ['Recepcionistas', emp.recepcionistas.map(function (r) { return e(r.nombre + ' · ' + r.tel); }).join('<br>') || '—'],
      ['Crédito', c.estado === 'aprobado' ? e(C.bs(c.linea) + ' · ' + c.plazo + ' días · 6 documentos') : 'Sin crédito']
    ];
    if (emp.empleados.length) rows.push(['Usuarios', emp.empleados.map(function (u) { return e(fullName(u) + ' · ' + u.rol); }).join('<br>')]);
    return '<dl class="pn-rows">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
  }

  C.route('/panel/solicitud/:id', function (params) {
    const g = guard(); if (g) return g;
    const r = P().requests.find(function (x) { return String(x.id) === params.id; });
    if (!r) return { redirect: '/panel/aprobaciones' };
    const emp = C.empresa(r.empresaId);
    const me = P().persona, rev = C.persona(r.revisor), autor = C.persona(r.autor);
    const pending = r.estado === 'pendiente', mine = me === r.revisor;
    const sent = C.query().enviada === '1' && r.autor === me && pending;
    const what = r.tipo === 'alta' ? 'el alta de la cuenta' : (r.tipo === 'vendedor' ? 'el alta de ' + r.persona.nombre + ' como vendedor' : (r.ops.length === 1 ? '1 cambio' : r.ops.length + ' cambios'));
    const intro = mine && pending ? autor.nombre + ' te pidió aprobar ' + what : autor.nombre + ' pidió a ' + rev.nombre + ' aprobar ' + what;

    let content;
    if (r.tipo === 'alta' && emp) content = altaSummary(emp);
    else if (r.tipo === 'vendedor') content = '<dl class="pn-rows"><div><dt>Nombre</dt><dd>' + e(r.persona.nombre) + '</dd></div><div><dt>Correo</dt><dd>' + e(r.persona.email) + '</dd></div><div><dt>WhatsApp</dt><dd>' + e(r.persona.wa) + '</dd></div></dl>';
    else content = changeList(r.ops, C.applyOps(C.clone(emp), pending ? r.ops : []), false);

    let result = '';
    if (r.estado === 'aprobada') result = '<p class="pn-result">' + C.icon('check', 16) + '<span><strong>Aprobada</strong> por ' + e(rev.nombre) + ' · ' + fmtDT(r.revisado) + (r.comentario ? '<br>“' + e(r.comentario) + '”' : '') + (r.notificar && r.tipo !== 'vendedor' ? '<br>Cliente avisado por ' + e(clientVia(emp)) : '') + '</span></p>';
    if (r.estado === 'rechazada') result = '<p class="pn-result is-alert">' + C.icon('x', 16) + '<span><strong>Rechazada</strong> por ' + e(rev.nombre) + ' · ' + fmtDT(r.revisado) + '<br>“' + e(r.comentario || '') + '”</span></p>';
    if (r.estado === 'cancelada') result = '<p class="pn-result">' + C.icon('x', 16) + '<span><strong>Cancelada</strong> por ' + e(autor.nombre) + '</span></p>';

    let bar = '', extra = '';
    if (pending && mine) {
      const rejecting = !!C.ui.draft.rejecting;
      if (rejecting) extra = '<section class="card card-pad mt-16 reveal">' + C.field({ label: 'Motivo del rechazo', bind: 'ui.draft.comentario', err: 'comentario', placeholder: 'Le llega a ' + autor.nombre }) + '</section>';
      bar = '<div class="pn-actionbar-in"><span class="pn-ab-t hide-m"><strong>' + e(intro) + '</strong></span><span class="pn-ab-actions pn-ab-wide">' +
        (rejecting ? C.btn('Volver', { action: 'pnRejectToggle', sm: true }) + C.btn('Confirmar rechazo', { primary: true, sm: true, action: 'pnReject', arg: r.id })
          : C.btn('Rechazar', { action: 'pnRejectToggle', sm: true }) + C.btn('Aprobar', { primary: true, sm: true, action: 'pnApprove', arg: r.id, icon: 'shield' })) + '</span></div>';
    } else if (pending && me === r.autor) {
      extra = '<p class="pn-wait mt-16">' + C.icon('clock', 16) + '<span>Esperando a <strong>' + e(rev.nombre) + '</strong>. ' + C.link('Cancelar solicitud', 'pnCancelReq', r.id) + '</span></p>';
    } else if (pending) {
      extra = '<p class="pn-wait mt-16">' + C.icon('shield', 16) + '<span>Solo <strong>' + e(rev.nombre) + '</strong> puede aprobarla.</span></p>';
    }

    const html = (sent ? '<div class="pn-banner is-sent">' + C.icon('check', 18) + '<span>Enviado a <strong>' + e(rev.nombre) + '</strong>. Le avisamos por correo y WhatsApp.</span></div>' : '') +
      '<nav class="pn-crumbs"><a href="#/panel/aprobaciones">' + C.icon('arrowLeft', 16) + ' Aprobaciones</a></nav>' +
      '<header class="pn-head"><div><h1 class="h1">' + e(r.empresaNombre) + '</h1><p class="muted">' + e(intro) + ' · ' + fmtDT(r.fecha) + '</p></div>' + estadoBadge(r.estado) + '</header>' +
      (r.nota ? '<p class="pn-quote">“' + e(r.nota) + '”</p>' : '') +
      (r.tipo === 'cambios' ? content : '<section class="card card-pad">' + content + '</section>') + result + extra;
    return { layout: 'panel', nav: 'aprobaciones', title: 'Solicitud #' + r.id, html: html, narrow: true, actionBar: bar };
  });
  function estadoBadge(st) { return badge(C.REQ_ESTADOS[st], st === 'aprobada' ? 'ok' : (st === 'rechazada' ? 'alert' : (st === 'pendiente' ? 'pending' : 'neutral'))); }

  function findReq(id) { return P().requests.find(function (x) { return String(x.id) === String(id); }); }
  A.pnRejectToggle = function () { C.ui.draft.rejecting = !C.ui.draft.rejecting; C.ui.errors = {}; C.set(); };
  A.pnApprove = function (el) {
    const r = findReq(el.dataset.arg); if (!r || r.revisor !== P().persona) return;
    const emp = C.empresa(r.empresaId);
    r.estado = 'aprobada'; r.revisado = C.nowISO(); r.comentario = '';
    if (r.tipo === 'alta') { emp.estado = 'activa'; emp.actualizado = r.revisado; }
    else if (r.tipo === 'vendedor') P().equipo.push(C.clone(r.persona));
    else { C.applyOps(emp, r.ops); emp.actualizado = r.revisado; }
    log('aprobacion', r.empresaId, r.tipo === 'alta' ? 'Aprobó el alta de la cuenta' : (r.tipo === 'vendedor' ? 'Aprobó el alta de ' + r.persona.nombre + ' como vendedor' : 'Aprobó y aplicó ' + r.ops.length + (r.ops.length === 1 ? ' cambio' : ' cambios')), r.id);
    if (r.notificar && emp && r.tipo !== 'vendedor') log('notificacion', r.empresaId, 'Se avisó al cliente por correo y WhatsApp (' + (emp.user.email || 'sin correo') + ' · ' + (emp.user.wa || 'sin WhatsApp') + ')', r.id);
    C.ui.draft = {}; C.set();
    C.toast(r.notificar && r.tipo !== 'vendedor' ? 'Aprobado · cliente avisado por correo y WhatsApp (simulado)' : 'Aprobado y aplicado');
  };
  A.pnReject = function (el) {
    const r = findReq(el.dataset.arg), c = (C.ui.draft.comentario || '').trim();
    if (!r || r.revisor !== P().persona) return;
    if (c.length < 3) return C.fail({ comentario: 'Cuéntale por qué lo rechazas' });
    r.estado = 'rechazada'; r.revisado = C.nowISO(); r.comentario = c;
    if (r.tipo === 'alta') C.empresa(r.empresaId).estado = 'rechazada';
    log('rechazo', r.empresaId, 'Rechazó la solicitud: ' + c, r.id);
    C.ui.draft = {}; C.set(); C.toast('Solicitud rechazada');
  };
  A.pnCancelReq = function (el) {
    C.ui.dialog = { title: '¿Cancelar la solicitud?', body: 'Los cambios vuelven a tu borrador para corregirlos y enviarlos de nuevo.', confirm: 'Cancelar solicitud', action: 'pnCancelReqYes', arg: el.dataset.arg };
    C.renderOverlays();
  };
  A.pnCancelReqYes = function (el) {
    const r = findReq(el.dataset.arg);
    r.estado = 'cancelada'; r.revisado = C.nowISO();
    if (r.tipo === 'cambios') { const d = P().drafts[r.empresaId] || (P().drafts[r.empresaId] = { ops: [] }); d.ops = C.clone(r.ops).concat(d.ops); }
    if (r.tipo === 'alta') C.empresa(r.empresaId).estado = 'rechazada';
    log('cancelacion', r.empresaId, 'Canceló la solicitud', r.id);
    C.ui.dialog = null; C.set(); C.toast('Solicitud cancelada');
  };

  /* ======================= APROBACIONES ======================= */
  function reqWhat(r) { return r.tipo === 'alta' ? 'Alta de cuenta' : (r.tipo === 'vendedor' ? 'Alta de vendedor' : r.ops.length + (r.ops.length === 1 ? ' cambio' : ' cambios')); }
  C.route('/panel/aprobaciones', function () {
    const g = guard(); if (g) return g;
    const me = P().persona, tab = C.query().tab || 'revisar';
    const all = P().requests.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    const lists = {
      revisar: all.filter(function (r) { return r.estado === 'pendiente' && r.revisor === me; }),
      enviadas: all.filter(function (r) { return r.autor === me; }),
      historial: all.filter(function (r) { return r.estado !== 'pendiente'; })
    };
    const labels = { revisar: 'Por revisar', enviadas: 'Enviadas por mí', historial: 'Historial' };
    const tabs = Object.keys(labels).map(function (k) { return '<a class="pn-tabs-a' + (k === tab ? ' is-active' : '') + '" href="#/panel/aprobaciones?tab=' + k + '">' + labels[k] + (lists[k].length ? ' <span class="muted">' + lists[k].length + '</span>' : '') + '</a>'; }).join('');
    const list = lists[tab] || [];
    const who = tab === 'enviadas' ? 'Para' : 'De';
    const rows = list.map(function (r) {
      return '<tr data-action="pnGo" data-arg="/panel/solicitud/' + r.id + '" role="link" tabindex="0"><td data-label="Empresa"><strong>' + e(r.empresaNombre) + '</strong></td><td data-label="Pedido">' + reqWhat(r) + '</td>' +
        '<td data-label="' + who + '">' + e(C.persona(tab === 'enviadas' ? r.revisor : r.autor).nombre) + '</td><td data-label="Estado">' + estadoBadge(r.estado) + '</td></tr>';
    }).join('');
    const html = '<div class="pn-head"><h1 class="h1">Aprobaciones</h1></div><nav class="pn-tabs">' + tabs + '</nav>' +
      (list.length ? '<table class="pn-table"><thead><tr><th>Empresa</th><th>Pedido</th><th>' + who + '</th><th>Estado</th></tr></thead><tbody>' + rows + '</tbody></table>'
        : '<div class="empty"><p class="h3">' + (tab === 'revisar' ? 'Nada por revisar' : 'Nada por aquí') + '</p></div>');
    return { layout: 'panel', nav: 'aprobaciones', title: 'Aprobaciones', html: html };
  });

  /* ======================= REGISTRO DE CAMBIOS ======================= */
  C.route('/panel/registro', function () {
    const g = guard(); if (g) return g;
    const d = C.ui.draft;
    const entries = P().log.filter(function (l) {
      if (d.rEmp && l.empresaId !== d.rEmp) return false;
      if (d.rPer && l.actor !== d.rPer) return false;
      return true;
    }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    const emps = Object.keys(C.S.empresas).map(function (k) { return { value: k, label: C.S.empresas[k].empresa }; });
    const pers = P().equipo.map(function (p) { return { value: p.id, label: p.nombre }; }).concat([{ value: 'cliente', label: 'Cliente' }]);
    const html = '<div class="pn-head"><h1 class="h1">Registro de cambios</h1></div>' +
      '<div class="pn-filters">' + C.selectField({ label: 'Empresa', bind: 'ui.draft.rEmp', placeholder: 'Todas', options: emps, rerender: true }) + C.selectField({ label: 'Persona', bind: 'ui.draft.rPer', placeholder: 'Todas', options: pers, rerender: true }) + '</div>' +
      '<div class="mt-16">' + logTable(entries, true) + '</div>';
    return { layout: 'panel', nav: 'registro', title: 'Registro de cambios', html: html };
  });

  /* ======================= EQUIPO ======================= */
  C.route('/panel/equipo', function () {
    const g = guard(); if (g) return g;
    const pend = P().requests.filter(function (r) { return r.tipo === 'vendedor' && r.estado === 'pendiente'; });
    let html = '<div class="pn-head"><h1 class="h1">Equipo</h1>' + C.btn('+ Agregar vendedor', { action: 'pnNewSeller', disabled: C.ui.creating === 'seller' }) + '</div>';
    if (C.ui.creating === 'seller') {
      html += '<section class="card card-strong card-pad form-card reveal"><h3 class="h3">Nuevo vendedor</h3><div class="form-grid mt-16">' +
        C.field({ label: 'Nombre y apellido', bind: 'ui.draft.nombre' }) + C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel' }) +
        C.field({ label: 'Correo de Cooltiva', bind: 'ui.draft.email', type: 'email' }) + approverField('ui.draft.revisor') + '</div>' +
        '<div class="form-actions">' + C.btn('Cancelar', { action: 'pnCancel' }) + C.btn('Enviar a aprobación', { primary: true, action: 'pnSendSeller' }) + '</div></section>';
    }
    html += '<table class="pn-table"><thead><tr><th>Persona</th><th>Rol</th><th>Correo</th><th>WhatsApp</th></tr></thead><tbody>' +
      P().equipo.map(function (p) {
        return '<tr><td data-label="Persona"><span class="pn-user">' + avatar(p.nombre, 'is-sm') + '<strong>' + e(p.nombre) + '</strong></span></td><td data-label="Rol">' + e(p.rol) + '</td><td data-label="Correo">' + e(p.email) + '</td><td data-label="WhatsApp">' + e(p.wa) + '</td></tr>';
      }).join('') + pend.map(function (r) {
        return '<tr class="is-draft" data-action="pnGo" data-arg="/panel/solicitud/' + r.id + '" role="link" tabindex="0"><td data-label="Persona"><span class="pn-user">' + avatar(r.persona.nombre, 'is-sm') + '<strong>' + e(r.persona.nombre) + '</strong>' + badge('En aprobación', 'pending') + '</span></td><td data-label="Rol">' + e(r.persona.rol) + '</td><td data-label="Correo">' + e(r.persona.email) + '</td><td data-label="WhatsApp">' + e(r.persona.wa) + '</td></tr>';
      }).join('') + '</tbody></table>';
    return { layout: 'panel', nav: 'equipo', title: 'Equipo', html: html };
  });
  A.pnNewSeller = function () { C.ui.creating = 'seller'; C.ui.draft = { revisor: defaultApprover() }; C.ui.errors = {}; C.set(); };
  A.pnSendSeller = function () {
    const d = C.ui.draft, err = {};
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) err['ui.draft.email'] = 'Escribe un correo válido';
    if ((d.wa || '').replace(/\D/g, '').length < 8) err['ui.draft.wa'] = 'Escribe un WhatsApp válido';
    if (!d.revisor) err.revisor = 'Elige quién aprueba';
    if (Object.keys(err).length) return C.fail(err);
    const persona = { id: C.uid('p'), nombre: d.nombre.trim(), rol: 'Vendedor', email: d.email.trim(), wa: d.wa.trim() };
    const req = { id: P().nextReq++, tipo: 'vendedor', empresaId: null, empresaNombre: persona.nombre, persona: persona, autor: P().persona, revisor: d.revisor, estado: 'pendiente', fecha: C.nowISO(), notificar: false, nota: '', ops: [] };
    P().requests.unshift(req);
    log('envio', null, 'Envió el alta de ' + persona.nombre + ' como vendedor a aprobación de ' + C.persona(d.revisor).nombre, req.id);
    C.save(); C.go('/panel/solicitud/' + req.id + '?enviada=1');
  };

  /* ======================= NUEVA CUENTA (wizard) =======================
     Contacto → Forma jurídica → Sucursales → Recepcionistas → Crédito → Revisar.
     Un solo contacto: los demás usuarios se agregan después, desde la ficha. */
  const NUEVA_STEPS = ['contacto', 'legal', 'sucursales', 'recepcionistas', 'credito', 'revisar'];
  const NUEVA_LABELS = ['Contacto', 'Forma jurídica', 'Sucursales', 'Recepcionistas', 'Crédito y contrato', 'Revisar y enviar'];
  const N = function () { return P().nueva; };
  function nPage(i, html, rightBtn) {
    return {
      layout: 'wizard', title: 'Nueva cuenta · ' + NUEVA_LABELS[i], width: 'wz-w-mid', logoHref: '#/panel/empresas',
      headRight: '<button type="button" class="link pn-exit" data-action="pnNuevaExit">Guardar y salir</button>',
      tabs: C.buildTabs(NUEVA_LABELS, i, N().maxStep, 'pnNTab'),
      html: '<p class="eyebrow">Panel de vendedores · Nueva cuenta</p>' + html,
      bar: { left: C.btn(i === 0 ? 'Salir' : 'Atrás', { action: i === 0 ? 'pnNuevaExit' : 'pnNTab', arg: i - 1 }), right: rightBtn || C.btn('Siguiente', { primary: true, action: 'pnNNext', arg: i }) }
    };
  }
  function nGuard(i) {
    if (!P().loggedIn) return { redirect: '/panel/login' };
    if (i > N().maxStep) return { redirect: '/panel/nueva/' + NUEVA_STEPS[Math.min(N().maxStep, NUEVA_STEPS.length - 1)] };
    return null;
  }
  A.pnNTab = function (el) { C.go('/panel/nueva/' + NUEVA_STEPS[Number(el.dataset.arg)]); };
  A.pnNuevaExit = function () { C.save(); C.go('/panel/empresas'); C.toast('Alta guardada como borrador'); };
  const NV = {}, NVAL = {};

  C.route('/panel/nueva/:step', function (params) {
    const i = NUEVA_STEPS.indexOf(params.step);
    if (i < 0) return { redirect: '/panel/nueva/contacto' };
    const g = nGuard(i); if (g) return g;
    return NV[params.step](i);
  });
  A.pnNNext = function (el) {
    const i = Number(el.dataset.arg);
    const err = NVAL[NUEVA_STEPS[i]]();
    if (err && Object.keys(err).length) return C.fail(err);
    N().maxStep = Math.max(N().maxStep, i + 1);
    C.save();
    C.go('/panel/nueva/' + NUEVA_STEPS[i + 1]);
  };

  NV.contacto = function (i) {
    const c = N().contacto;
    const roles = C.ROLES.map(function (r) { return C.choice({ label: r, selected: c.rol === r, action: 'pnNRol', arg: r }); }).join('');
    return nPage(i, '<h1 class="h1 wz-title">¿Para quién es la cuenta?</h1>' +
      '<div class="stack">' + C.field({ label: 'Nombre comercial de la empresa', bind: 'panel.nueva.contacto.empresa', placeholder: 'Ej. Catering Andino' }) +
      '<div class="form-grid">' + C.field({ label: 'Nombre', bind: 'panel.nueva.contacto.nombre' }) + C.field({ label: 'Apellido', bind: 'panel.nueva.contacto.apellido' }) + '</div>' +
      '<div class="field' + C.errCls('rol') + '"><span class="label">Rol en el negocio</span><div class="choice-grid cols-2 focus-target" tabindex="-1">' + roles + '</div>' + C.err('rol') + '</div>' +
      '<div class="form-grid">' + C.field({ label: 'Correo electrónico', bind: 'panel.nueva.contacto.email', type: 'email' }) + C.field({ label: 'WhatsApp', bind: 'panel.nueva.contacto.wa', type: 'tel', placeholder: '+591 7000 0000' }) + '</div></div>');
  };
  A.pnNRol = function (el) { C.set(function (S) { S.panel.nueva.contacto.rol = el.dataset.arg; delete C.ui.errors.rol; }); };
  NVAL.contacto = function () {
    const c = N().contacto, err = {};
    if (!c.empresa.trim()) err['panel.nueva.contacto.empresa'] = 'Escribe el nombre comercial';
    if (!c.nombre.trim()) err['panel.nueva.contacto.nombre'] = 'Escribe el nombre';
    if (!c.rol) err.rol = 'Elige el rol';
    if (!/^\S+@\S+\.\S+$/.test(c.email)) err['panel.nueva.contacto.email'] = 'Escribe un correo válido';
    if (c.wa.replace(/\D/g, '').length < 8) err['panel.nueva.contacto.wa'] = 'Escribe un WhatsApp válido';
    return err;
  };

  NV.legal = function (i) {
    const fj = N().fj;
    const cards = C.FORMAS_JURIDICAS.map(function (f) { return C.choice({ label: f.label, selected: fj.tipo === f.id, action: 'pnNFj', arg: f.id }); }).join('');
    let fields = '';
    if (fj.tipo === 'natural') fields = C.field({ label: 'CI', bind: 'panel.nueva.fj.ci' });
    else if (fj.tipo) fields = '<div class="form-grid">' + C.field({ label: 'Razón social', bind: 'panel.nueva.fj.razon', cls: 'span-2' }) + C.field({ label: 'NIT', bind: 'panel.nueva.fj.nit', inputmode: 'numeric' }) + C.field({ label: 'Matrícula de comercio', bind: 'panel.nueva.fj.matricula' }) + '</div>';
    return nPage(i, '<h1 class="h1 wz-title">Forma jurídica</h1><div class="field' + C.errCls('tipo') + '"><div class="choice-grid cols-3 focus-target" tabindex="-1">' + cards + '</div>' + C.err('tipo') + '</div>' +
      (fields ? '<div class="card card-muted card-pad mt-24 reveal">' + fields + '</div>' : ''));
  };
  A.pnNFj = function (el) { C.set(function (S) { S.panel.nueva.fj.tipo = el.dataset.arg; C.ui.errors = {}; }); };
  NVAL.legal = function () {
    const fj = N().fj, err = {};
    if (!fj.tipo) err.tipo = 'Elige la forma jurídica';
    else if (fj.tipo === 'natural') { if (!fj.ci.trim()) err['panel.nueva.fj.ci'] = 'Escribe el CI'; }
    else {
      if (!fj.razon.trim()) err['panel.nueva.fj.razon'] = 'Escribe la razón social';
      if (!/^\d{6,}$/.test(fj.nit.replace(/\s/g, ''))) err['panel.nueva.fj.nit'] = 'El NIT debe tener solo números';
      if (!fj.matricula.trim()) err['panel.nueva.fj.matricula'] = 'Escribe la matrícula';
    }
    return err;
  };

  /* Sucursales: formulario solo cuando hace falta; con ≥1 se muestra como tarjeta "+ Agregar" */
  const suc0 = function () { return { dir: '', ciudad: '', pin: null, adding: false }; };
  function addSuc() {
    const d = C.ui.draft;
    N().sucursales.push({ id: C.uid('s'), dir: d.dir.trim(), ciudad: d.ciudad.trim(), pin: d.pin || { x: 50, y: 50 } });
    C.ui.draft = suc0();
  }
  NV.sucursales = function (i) {
    const list = N().sucursales;
    if (!('dir' in C.ui.draft)) C.ui.draft = suc0();
    const adding = !list.length || C.ui.draft.adding;
    const cards = list.length ? '<div class="item-list">' + list.map(function (s) {
      return '<article class="card item-card suc-card"><div class="suc-thumb">' + C.map({ small: true, pin: s.pin }) + '</div><div class="item-main"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span></div><div class="item-actions">' + C.link('Quitar', 'pnNRemove', 'sucursales:' + s.id) + '</div></article>';
    }).join('') + '</div>' : '';
    const form = adding
      ? '<section class="card card-pad ' + (list.length ? 'card-strong ' : '') + 'mt-16 reveal">' + (list.length ? '<h2 class="h3 mb-12">Nueva sucursal</h2>' : '<p class="muted mb-12">Toca el mapa o escribe la dirección.</p>') + sucFields() +
        (list.length ? '<div class="form-actions">' + C.btn('Cancelar', { action: 'pnNHideSuc' }) + C.btn('Agregar sucursal', { primary: true, action: 'pnNAddSuc' }) + '</div>' : '') + '</section>'
      : '<button type="button" class="btn btn-dashed mt-16" data-action="pnNShowSuc">+ Agregar otra sucursal</button>';
    return nPage(i, '<h1 class="h1 wz-title">Sucursales del cliente</h1>' + cards + form);
  };
  A.pnNShowSuc = function () { C.ui.draft = suc0(); C.ui.draft.adding = true; C.set(); };
  A.pnNHideSuc = function () { C.ui.draft = suc0(); C.ui.errors = {}; C.set(); };
  A.pnNAddSuc = function () {
    const d = C.ui.draft, err = {};
    if (!(d.dir || '').trim()) err['ui.draft.dir'] = 'Escribe la dirección o toca el mapa';
    if (!(d.ciudad || '').trim()) err['ui.draft.ciudad'] = 'Escribe la ciudad';
    if (Object.keys(err).length) return C.fail(err);
    addSuc(); C.set(); C.toast('Sucursal agregada');
  };
  A.pnNRemove = function (el) {
    const parts = el.dataset.arg.split(':'), coll = parts[0], id = parts[1];
    N()[coll] = N()[coll].filter(function (x) { return x.id !== id; });
    if (coll === 'sucursales') N().recepcionistas = N().recepcionistas.filter(function (r) { return r.sucursalId !== id; });
    C.set();
  };
  NVAL.sucursales = function () {
    const d = C.ui.draft, n = N(), err = {};
    const showing = !n.sucursales.length || d.adding;
    const dir = (d.dir || '').trim(), ciudad = (d.ciudad || '').trim();
    if (showing && dir && ciudad) { addSuc(); return {}; }          // lo escrito se guarda solo al pulsar Siguiente
    if (!n.sucursales.length) {
      if (!dir) err['ui.draft.dir'] = 'Escribe la dirección o toca el mapa';
      if (!ciudad) err['ui.draft.ciudad'] = 'Escribe la ciudad';
    }
    return err;
  };

  /* Recepcionistas: igual de simple. Cada sucursal necesita al menos uno */
  function sinRecep() { const n = N(); return n.sucursales.filter(function (s) { return !n.recepcionistas.some(function (r) { return r.sucursalId === s.id; }); }); }
  const rec0 = function () { const sin = sinRecep(); return { sucursalId: (sin[0] || N().sucursales[0] || {}).id || '', nombre: '', tel: '', adding: false }; };
  function addRec() {
    const d = C.ui.draft;
    N().recepcionistas.push({ id: C.uid('r'), nombre: d.nombre.trim(), tel: d.tel.trim(), sucursalId: d.sucursalId });
    C.ui.draft = rec0();
  }
  NV.recepcionistas = function (i) {
    const n = N(), c = n.contacto;
    // Si el contacto es Recepcionista, se propone como tal (igual que en el registro del cliente)
    if (c.rol === 'Recepcionista' && !n.recepcionistas.length && n.sucursales.length) {
      n.recepcionistas.push({ id: C.uid('r'), nombre: (c.nombre + ' ' + c.apellido).trim(), tel: c.wa.replace('+591 ', ''), sucursalId: n.sucursales[0].id });
      C.save();
    }
    if (!('nombre' in C.ui.draft)) C.ui.draft = rec0();
    const sin = sinRecep();
    const adding = sin.length > 0 || C.ui.draft.adding;
    const groups = n.sucursales.map(function (s) {
      const rs = n.recepcionistas.filter(function (r) { return r.sucursalId === s.id; });
      return '<section class="pn-group"><h3 class="pn-group-t">' + C.icon('pin', 16) + e(s.dir) + ' <span class="muted">· ' + e(s.ciudad) + '</span></h3>' +
        (rs.length ? rs.map(function (r) { return '<div class="pn-line"><span><strong>' + e(r.nombre) + '</strong> · ' + e(r.tel) + '</span>' + C.link('Quitar', 'pnNRemove', 'recepcionistas:' + r.id) + '</div>'; }).join('')
          : '<p class="pn-warn">' + C.icon('alert', 16) + ' Falta quién recibe aquí. ' + C.link('El contacto principal recibe aquí', 'pnNContactoRec', s.id) + '</p>') + '</section>';
    }).join('');
    const form = adding
      ? '<section class="card card-pad mt-16 reveal">' + recFields(n) + (sin.length === 0 ? '<div class="form-actions">' + C.btn('Cancelar', { action: 'pnNHideRec' }) + C.btn('Agregar recepcionista', { primary: true, action: 'pnNAddRec' }) + '</div>' : '') + '</section>'
      : '<button type="button" class="btn btn-dashed mt-16" data-action="pnNShowRec">+ Agregar otro recepcionista</button>';
    return nPage(i, '<h1 class="h1 wz-title">¿Quién recibe en cada sucursal?</h1><div class="field' + C.errCls('recs') + '">' + groups + C.err('recs') + '</div>' + form);
  };
  A.pnNShowRec = function () { C.ui.draft = rec0(); C.ui.draft.adding = true; C.set(); };
  A.pnNHideRec = function () { C.ui.draft = rec0(); C.ui.errors = {}; C.set(); };
  A.pnNAddRec = function () {
    const d = C.ui.draft, err = {};
    if (!d.sucursalId) err['ui.draft.sucursalId'] = 'Elige la sucursal';
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if ((d.tel || '').replace(/\D/g, '').length < 7) err['ui.draft.tel'] = 'Escribe un teléfono válido';
    if (Object.keys(err).length) return C.fail(err);
    addRec(); delete C.ui.errors.recs; C.set(); C.toast('Recepcionista agregado');
  };
  A.pnNContactoRec = function (el) {
    const c = N().contacto;
    N().recepcionistas.push({ id: C.uid('r'), nombre: (c.nombre + ' ' + c.apellido).trim(), tel: c.wa.replace('+591 ', ''), sucursalId: el.dataset.arg });
    delete C.ui.errors.recs; C.ui.draft = rec0(); C.set();
  };
  NVAL.recepcionistas = function () {
    const d = C.ui.draft, err = {};
    const filled = (d.nombre || '').trim() && (d.tel || '').replace(/\D/g, '').length >= 7 && d.sucursalId;
    if (filled) addRec();                                            // lo escrito se guarda solo al pulsar Siguiente
    const sin = sinRecep();
    if (sin.length) {
      err.recs = 'Falta quién recibe en: ' + sin.map(function (s) { return s.dir; }).join(', ');
      if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
      if ((d.tel || '').replace(/\D/g, '').length < 7) err['ui.draft.tel'] = 'Escribe un teléfono válido';
    }
    return err;
  };

  NV.credito = function (i) {
    const cr = N().credito, c = N().contacto, fj = N().fj;
    const opts = '<div class="choice-grid cols-2">' +
      C.choice({ label: 'Sin crédito', sub: 'Paga con QR o contraentrega.', selected: cr.con === 'no', action: 'pnNCred', arg: 'no' }) +
      C.choice({ label: 'Con Crédito Cooltiva', sub: 'Armas el contrato con sus condiciones.', selected: cr.con === 'si', action: 'pnNCred', arg: 'si' }) + '</div>';
    let body = '';
    if (cr.con === 'si') {
      body = '<div class="pn-credit mt-24 reveal"><div class="stack"><section class="card card-pad"><h2 class="h3">Condiciones</h2><div class="form-grid mt-16">' +
        C.field({ label: 'Línea aprobada (Bs)', bind: 'panel.nueva.credito.linea', numeric: true, live: 'pnContrato', placeholder: 'Ej. 10000' }) +
        C.selectField({ label: 'Plazo de pago', bind: 'panel.nueva.credito.plazo', rerender: true, options: [15, 30, 45, 60].map(function (p) { return { value: String(p), label: p + ' días' }; }) }) + '</div></section>' +
        '<section class="card card-pad"><h2 class="h3">Documentos</h2><div class="docs pn-docs-up">' +
        C.CREDITO_DOCS.map(function (doc) { return C.uploadSlot({ path: 'panel.nueva.credito.docs.' + doc.key, label: doc.label, hint: doc.hint, multiple: doc.multiple, max: doc.max, cta: doc.cta, sub: doc.sub }); }).join('') +
        C.uploadSlot({ path: 'panel.nueva.credito.docs.anverso', label: 'Carnet · anverso', cta: 'Anverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) +
        C.uploadSlot({ path: 'panel.nueva.credito.docs.reverso', label: 'Carnet · reverso', cta: 'Reverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) + '</div></section></div>' +
        '<section class="card card-pad pn-contract"><h2 class="h3">Vista previa del contrato</h2><div class="contract-body contract-body-sm" id="pn-contrato">' + C.contratoPanel({ tipo: fj.tipo, ci: fj.ci, razon: fj.razon, nit: fj.nit, empresa: c.empresa, linea: cr.linea, plazo: cr.plazo }) + '</div></section></div>';
    }
    return nPage(i, '<div class="row wz-title-row"><h1 class="h1">Crédito y contrato</h1><span class="tag">Opcional</span></div>' + opts + body);
  };
  C.live.pnContrato = function () {
    const el = document.getElementById('pn-contrato'), n = N();
    if (el) el.innerHTML = C.contratoPanel({ tipo: n.fj.tipo, ci: n.fj.ci, razon: n.fj.razon, nit: n.fj.nit, empresa: n.contacto.empresa, linea: n.credito.linea, plazo: n.credito.plazo });
  };
  A.pnNCred = function (el) { C.set(function (S) { S.panel.nueva.credito.con = el.dataset.arg; C.ui.errors = {}; }); };
  NVAL.credito = function () {
    const cr = N().credito, err = {};
    if (cr.con === 'si') {
      if (!(Number(cr.linea) > 0)) err['panel.nueva.credito.linea'] = 'Escribe la línea aprobada';
      C.DOC_KEYS.forEach(function (k) { if (!cr.docs[k].length) err['panel.nueva.credito.docs.' + k] = 'Falta este documento'; });
    }
    return err;
  };

  function nuevaEmpresa() {
    const n = N(), id = C.uid('emp'), now = C.nowISO();
    return {
      id: id, estado: 'pendiente_alta', origen: 'vendedor', creadoPor: C.persona().nombre, creado: now, actualizado: now,
      empresa: n.contacto.empresa.trim(),
      user: { nombre: n.contacto.nombre.trim(), apellido: n.contacto.apellido.trim(), rol: n.contacto.rol, email: n.contacto.email.trim(), wa: n.contacto.wa.trim() },
      formaJuridica: C.clone(n.fj), sucursales: C.clone(n.sucursales), recepcionistas: C.clone(n.recepcionistas), empleados: [],
      credito: n.credito.con === 'si' ? { estado: 'aprobado', linea: Number(n.credito.linea), plazo: Number(n.credito.plazo), usado: 0, docs: C.clone(n.credito.docs) } : { estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.emptyDocs() },
      pedidos: [], nextPedido: 6001
    };
  }
  NV.revisar = function (i) {
    const n = N(), preview = nuevaEmpresa();
    if (!n.revisor || n.revisor === P().persona) n.revisor = defaultApprover();
    const edit = function (step) { return C.link('Editar', 'pnNTab', NUEVA_STEPS.indexOf(step)); };
    const sections = [['contacto', 'Contacto'], ['legal', 'Forma jurídica'], ['sucursales', 'Sucursales'], ['recepcionistas', 'Recepcionistas'], ['credito', 'Crédito']].map(function (s) {
      let body = '';
      if (s[0] === 'contacto') body = '<strong>' + e(preview.empresa) + '</strong><br>' + e(fullName(preview.user)) + ' · ' + e(preview.user.rol) + '<br><span class="muted">' + e(preview.user.email) + ' · ' + e(preview.user.wa) + '</span>';
      if (s[0] === 'legal') body = preview.formaJuridica.tipo === 'natural' ? 'Persona natural · CI ' + e(preview.formaJuridica.ci) : e(preview.formaJuridica.razon) + ' · NIT ' + e(preview.formaJuridica.nit);
      if (s[0] === 'sucursales') body = preview.sucursales.map(function (x) { return e(x.dir) + ' · ' + e(x.ciudad); }).join('<br>');
      if (s[0] === 'recepcionistas') body = preview.recepcionistas.map(function (r) { return '<strong>' + e(r.nombre) + '</strong> · ' + e(r.tel); }).join('<br>');
      if (s[0] === 'credito') body = preview.credito.estado === 'aprobado' ? C.bs(preview.credito.linea) + ' · ' + preview.credito.plazo + ' días · contrato listo' : 'Sin crédito';
      return '<section class="card card-pad sum-card"><div class="row-between"><h2 class="h3">' + s[1] + '</h2>' + edit(s[0]) + '</div><div class="pn-sum-body">' + body + '</div></section>';
    }).join('');
    const html = '<h1 class="h1 wz-title">Revisa y envía</h1><div class="stack">' + sections + '</div>' +
      '<section class="card card-strong card-pad mt-24"><div class="stack">' + approverField('panel.nueva.revisor') +
      C.field({ label: 'Nota (opcional)', bind: 'panel.nueva.nota', placeholder: 'Ej. Cliente captado en visita' }) +
      C.checkbox({ bind: 'panel.nueva.notificar', label: 'Avisar al cliente por correo y WhatsApp cuando se apruebe' }) + '</div></section>';
    return nPage(i, html, C.btn('Enviar a aprobación', { primary: true, action: 'pnNSubmit' }));
  };
  A.pnNSubmit = function () {
    const n = N();
    if (!n.revisor) return C.fail({ revisor: 'Elige quién aprueba' });
    const emp = nuevaEmpresa();
    C.S.empresas[emp.id] = emp;
    const req = { id: P().nextReq++, tipo: 'alta', empresaId: emp.id, empresaNombre: emp.empresa, autor: P().persona, revisor: n.revisor, estado: 'pendiente', fecha: emp.creado, notificar: !!n.notificar, nota: (n.nota || '').trim(), ops: [] };
    P().requests.unshift(req);
    log('envio', emp.id, 'Envió el alta de la cuenta a aprobación de ' + C.persona(n.revisor).nombre, req.id);
    P().nueva = C.emptyNueva();
    C.save();
    C.go('/panel/solicitud/' + req.id + '?enviada=1');
  };

  /* ======================= MODO VENDEDOR (comprar por el cliente) ======================= */
  A.pnActAs = function (el) {
    const id = el.dataset.arg, emp = C.empresa(id);
    if (!emp || emp.estado !== 'activa') { C.toast('La cuenta debe estar activa'); return; }
    C.S.acting = { empresaId: id, seller: C.persona().nombre, back: '#/panel/empresa/' + id + '/pedidos', prevActive: C.S.activeEmpresa, prevLogged: C.S.session.loggedIn, prevCart: C.S.cart };
    C.S.activeEmpresa = id; C.S.session.loggedIn = true; C.S.cart = C.emptyCart();
    C.save(); C.go('/cuenta/tienda');
  };
  C.actingBanner = function () {
    const a = C.S.acting, emp = C.empresa(a.empresaId);
    return '<div class="acting" role="status"><span>' + C.icon('store', 18) + '<span><strong>Modo vendedor</strong> · compras para <strong>' + e(emp ? emp.empresa : '') + '</strong></span></span>' +
      '<button type="button" class="btn btn-sm" data-action="actingExit">Volver al panel</button></div>';
  };
  A.actingExit = function () {
    const a = C.S.acting; if (!a) return;
    C.S.activeEmpresa = a.prevActive; C.S.session.loggedIn = a.prevLogged; C.S.cart = a.prevCart || C.emptyCart();
    C.S.acting = null; C.save();
    location.hash = a.back;
  };
})();
