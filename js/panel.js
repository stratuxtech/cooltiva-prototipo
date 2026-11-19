/* =========================================================
   PANEL DE VENDEDORES
   Empresas · Ficha (edición en borrador) · Revisar y enviar ·
   Solicitudes y aprobación · Nueva cuenta (wizard) · Registro ·
   Equipo · Modo vendedor (comprar por el cliente)
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
  const fmtTel = function (t) { return t || '—'; };
  function log(accion, empresaId, texto, req) {
    P().log.unshift({ id: C.uid('l'), fecha: C.nowISO(), actor: P().persona, accion: accion, empresaId: empresaId, texto: texto, req: req || null });
  }
  function guard() { return P().loggedIn ? null : { redirect: '/panel/login' }; }
  function reviewCount() { return P().requests.filter(function (r) { return r.estado === 'pendiente' && r.revisor === P().persona; }).length; }

  function empEstado(emp) {
    if (emp.estado === 'pendiente_alta') return badge('Alta en aprobación', 'pending');
    if (emp.estado === 'rechazada') return badge('Alta rechazada', 'alert');
    let out = '';
    const pend = C.pendingReqs(emp.id).length;
    if (pend) out += badge(pend + (pend > 1 ? ' solicitudes' : ' solicitud') + ' en aprobación', 'pending');
    if (C.draftOps(emp.id).length) out += badge('Borrador sin enviar', 'draft');
    return out || badge('Activa', 'ok');
  }
  function usersOf(emp) {
    return [Object.assign({ id: 'principal', principal: true }, emp.user)].concat(emp.empleados || []);
  }

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
      '<button type="button" class="pn-persona" data-action="pnPersonaMenu" aria-haspopup="menu" aria-expanded="' + !!C.ui.personaMenu + '">' + avatar(me.nombre) +
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

  /* ---------- Login ---------- */
  C.route('/panel', function () { return { redirect: P().loggedIn ? '/panel/empresas' : '/panel/login' }; });
  C.route('/panel/login', function () {
    if (P().loggedIn) return { redirect: '/panel/empresas' };
    if (!C.ui.draft.persona) C.ui.draft.persona = 'fabiana';
    return {
      layout: 'bare', title: 'Panel de vendedores',
      html: '<div class="pn-login"><section class="pn-login-card"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="130" height="37">' +
        '<p class="eyebrow mt-16">Cooltiva · uso interno</p><h1 class="h1">Panel de vendedores</h1>' +
        '<p class="muted">Crea y administra cuentas de clientes. Todo cambio queda registrado y requiere la aprobación de otra persona.</p>' +
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

  /* ======================= EMPRESAS ======================= */
  function filteredEmpresas() {
    const q = (C.ui.draft.q || '').toLowerCase().trim();
    const f = C.ui.draft.f || 'todas';
    return Object.keys(C.S.empresas).map(function (k) { return C.S.empresas[k]; }).filter(function (emp) {
      if (f === 'pendientes' && !(C.pendingReqs(emp.id).length || emp.estado === 'pendiente_alta' || C.draftOps(emp.id).length)) return false;
      if (f === 'credito' && emp.credito.estado !== 'aprobado') return false;
      if (f === 'autoregistro' && emp.origen !== 'autoregistro') return false;
      if (!q) return true;
      const hay = [emp.empresa, emp.formaJuridica.razon, emp.formaJuridica.nit, emp.formaJuridica.ci].concat(usersOf(emp).map(function (u) { return fullName(u) + ' ' + u.email; })).concat(emp.sucursales.map(function (s) { return s.ciudad; })).join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    }).sort(function (a, b) { return (b.actualizado || '').localeCompare(a.actualizado || ''); });
  }
  function empresaList() {
    const list = filteredEmpresas();
    if (!list.length) return '<div class="empty"><p class="h3">No hay empresas que coincidan</p><p class="muted">Prueba con otro nombre, NIT, usuario o ciudad.</p></div>';
    return list.map(function (emp) {
      const ciudades = emp.sucursales.map(function (s) { return s.ciudad; }).filter(function (c, i, a) { return a.indexOf(c) === i; }).join(', ');
      const legal = emp.formaJuridica.tipo === 'natural' ? 'CI ' + (emp.formaJuridica.ci || '—') : (emp.formaJuridica.razon || '—') + ' · NIT ' + (emp.formaJuridica.nit || '—');
      const cred = emp.credito.estado === 'aprobado' ? C.bs(emp.credito.linea) + ' · ' + emp.credito.plazo + ' días' : C.CREDITO_ESTADOS[emp.credito.estado];
      const users = usersOf(emp).map(function (u) {
        return '<tr data-action="pnGo" data-arg="/panel/empresa/' + emp.id + '/usuarios" tabindex="0" role="link">' +
          '<td data-label="Usuario"><span class="pn-user">' + avatar(fullName(u) || u.email, 'is-sm') + '<strong>' + e(fullName(u) || 'Sin nombre') + '</strong></span></td>' +
          '<td data-label="Rol">' + e(u.rol || '—') + '</td><td data-label="Correo">' + e(u.email || '—') + '</td><td data-label="WhatsApp">' + e(u.wa || '—') + '</td>' +
          '<td data-label="Acceso">' + (u.principal ? badge('Principal', 'neutral') : '<span class="muted small">Usuario</span>') + '</td></tr>';
      }).join('');
      return '<section class="pn-emp card">' +
        '<header class="pn-emp-head" data-action="pnGo" data-arg="/panel/empresa/' + emp.id + '/usuarios" role="link" tabindex="0">' +
        '<div class="pn-emp-id">' + avatar(emp.empresa, 'is-sq') + '<div><h2 class="h3">' + e(emp.empresa) + '</h2><p class="muted small">' + e(legal) + ' · ' + e(ciudades) + '</p><div class="pn-badges">' + empEstado(emp) + (emp.origen === 'autoregistro' ? badge('Autoregistro', 'neutral') : '') + '</div></div></div>' +
        '<dl class="pn-emp-stats"><div><dt>Sucursales</dt><dd>' + emp.sucursales.length + '</dd></div><div><dt>Recepcionistas</dt><dd>' + emp.recepcionistas.length + '</dd></div>' +
        '<div><dt>Crédito</dt><dd>' + e(cred) + '</dd></div><div><dt>Último cambio</dt><dd>' + fmtDT(emp.actualizado) + '</dd></div></dl>' +
        '<span class="pn-emp-chev" aria-hidden="true">' + C.icon('chevRight', 20) + '</span></header>' +
        '<table class="pn-table pn-users"><thead><tr><th>Usuario</th><th>Rol</th><th>Correo</th><th>WhatsApp</th><th>Acceso</th></tr></thead><tbody>' + users + '</tbody></table></section>';
    }).join('');
  }
  C.live.pnFilter = function () { const l = document.getElementById('pn-list'); if (l) l.innerHTML = empresaList(); };

  C.route('/panel/empresas', function () {
    const g = guard(); if (g) return g;
    const all = Object.keys(C.S.empresas).length;
    const N = P().nueva;
    const draftBanner = N.maxStep > 0
      ? '<div class="pn-banner"><span>' + C.icon('edit', 18) + ' Tienes un alta de cuenta en borrador: <strong>' + e(N.contacto.empresa || 'Sin nombre') + '</strong></span><a class="btn btn-sm" href="#/panel/nueva/' + NUEVA_STEPS[Math.min(N.maxStep, NUEVA_STEPS.length - 1)] + '">Continuar</a></div>' : '';
    const html = '<div class="pn-head"><div><h1 class="h1">Empresas</h1><p class="muted">' + all + ' cuentas de clientes, con sus usuarios.</p></div>' +
      '<a class="btn btn-primary" href="#/panel/nueva/contacto">' + C.icon('plus', 18) + '<span>Nueva cuenta</span></a></div>' + draftBanner +
      '<div class="pn-toolbar"><label class="pn-search">' + C.icon('search', 18) + '<span class="sr-only">Buscar</span><input class="input" type="search" placeholder="Buscar por empresa, NIT, usuario o ciudad" data-bind="ui.draft.q" data-live="pnFilter" value="' + e(C.ui.draft.q || '') + '"></label>' +
      C.segmented({ cls: 'pn-filter', value: C.ui.draft.f || 'todas', action: 'pnFiltro', aria: 'Filtrar', options: [{ value: 'todas', label: 'Todas' }, { value: 'pendientes', label: 'Con pendientes' }, { value: 'credito', label: 'Con crédito' }, { value: 'autoregistro', label: 'Autoregistro' }] }) + '</div>' +
      '<div id="pn-list" class="pn-list">' + empresaList() + '</div>';
    return { layout: 'panel', nav: 'empresas', title: 'Empresas', html: html };
  });
  A.pnFiltro = function (el) { C.ui.draft.f = el.dataset.arg; C.set(); };
  A.pnGo = function (el) { C.go(el.dataset.arg); };

  /* ======================= FICHA DE EMPRESA ======================= */
  const TABS = [['usuarios', 'Usuarios'], ['legal', 'Datos legales'], ['sucursales', 'Sucursales'], ['recepcionistas', 'Recepcionistas'], ['credito', 'Crédito y contrato'], ['pedidos', 'Pedidos'], ['historial', 'Historial']];

  function marker(empId, key) {
    const pk = C.pendingKeys(empId), dk = C.draftKeys(empId);
    if (pk[key]) return { pending: pk[key], html: badge('En aprobación #' + pk[key], 'pending') };
    if (dk[key]) return { draft: dk[key], html: badge(dk[key] === 'add' ? 'Nuevo · sin enviar' : (dk[key] === 'remove' ? 'Se eliminará' : 'Editado · sin enviar'), 'draft') };
    return {};
  }
  function actions(m, locked, editArg, delArg) {
    if (locked) return '';
    if (m.pending) return '<span class="muted small">Bloqueado hasta su aprobación</span>';
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

  function tabUsuarios(id, v, locked) {
    let html = '<div class="pn-sec-head"><div><h2 class="h2">Usuarios</h2><p class="muted small">Todos ven la misma información de la empresa. El rol es informativo.</p></div>' +
      (locked ? '' : C.btn('+ Agregar usuario', { action: 'pnNew', arg: 'user', disabled: C.ui.creating === 'user' })) + '</div>';
    if (C.ui.creating === 'user') html += formCard('Nuevo usuario', userFields(), 'user:new');
    const rows = usersOf(v).map(function (u) {
      const key = u.principal ? 'path:user' : 'empleados:' + u.id, m = marker(id, key);
      if (isEditing('user', u.id)) return '<tr class="pn-tr-form"><td colspan="6">' + formCard(u.principal ? 'Editar contacto principal' : 'Editar usuario', userFields(), 'user:' + u.id) + '</td></tr>';
      return '<tr' + (m.draft ? ' class="is-draft"' : '') + '><td data-label="Usuario"><span class="pn-user">' + avatar(fullName(u) || u.email, 'is-sm') + '<strong>' + e(fullName(u) || 'Sin nombre') + '</strong></span>' + (m.html || '') + '</td>' +
        '<td data-label="Rol">' + e(u.rol || '—') + '</td><td data-label="Correo">' + e(u.email || '—') + '</td><td data-label="WhatsApp">' + e(u.wa || '—') + '</td>' +
        '<td data-label="Acceso">' + (u.principal ? badge('Principal', 'neutral') : '<span class="muted small">Usuario</span>') + '</td>' +
        '<td class="pn-td-actions">' + actions(m, locked, 'user:' + u.id, u.principal ? null : 'empleados:' + u.id) + '</td></tr>';
    }).join('') + removedRows(id, 'empleados', function (u) {
      return '<tr class="is-removed"><td data-label="Usuario">' + e(fullName(u) || u.email) + ' ' + badge('Se eliminará', 'draft') + '</td><td>' + e(u.rol || '') + '</td><td>' + e(u.email) + '</td><td>' + e(u.wa) + '</td><td></td><td class="pn-td-actions">' + C.link('Deshacer', 'pnUndo', 'empleados:' + u.id) + '</td></tr>';
    });
    return html + '<table class="pn-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Correo</th><th>WhatsApp</th><th>Acceso</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  function userFields() {
    return '<div class="form-grid">' +
      C.field({ label: 'Nombre', bind: 'ui.draft.nombre' }) + C.field({ label: 'Apellido', bind: 'ui.draft.apellido' }) +
      C.selectField({ label: 'Rol', bind: 'ui.draft.rol', placeholder: 'Elegir rol', options: C.ROLES.map(function (r) { return { value: r, label: r }; }) }) +
      C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel', placeholder: '+591 7000 0000' }) +
      C.field({ label: 'Correo electrónico', bind: 'ui.draft.email', type: 'email', cls: 'span-2', placeholder: 'nombre@empresa.bo', hint: 'Con este correo entra a la tienda. Recibe su acceso cuando se aprueba el cambio.' }) + '</div>';
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
    const pend = m1.pending || m2.pending;
    const head = '<div class="pn-sec-head"><div><h2 class="h2">Datos legales</h2><p class="muted small">Definen qué se le pide al cliente y cómo se emite su factura.</p></div>' +
      (locked || pend || isEditing('legal', 'x') ? '' : C.btn('Editar', { action: 'pnEdit', arg: 'legal:x', icon: 'edit' })) + '</div>';
    if (isEditing('legal', 'x')) return head + formCard('Editar datos legales', legalFields(), 'legal:x');
    return head + '<div class="card card-pad">' + (m1.html || m2.html || '') + legalView(v) + '</div>';
  }

  function tabSucursales(id, v, locked) {
    let html = '<div class="pn-sec-head"><div><h2 class="h2">Sucursales</h2><p class="muted small">Cada sucursal tiene sus propios recepcionistas.</p></div>' +
      (locked ? '' : C.btn('+ Agregar sucursal', { action: 'pnNew', arg: 'suc', disabled: C.ui.creating === 'suc' })) + '</div>';
    if (C.ui.creating === 'suc') html += formCard('Nueva sucursal', sucFields(), 'suc:new');
    html += '<div class="pn-grid">' + v.sucursales.map(function (s) {
      const m = marker(id, 'sucursales:' + s.id);
      if (isEditing('suc', s.id)) return '<div class="pn-grid-full">' + formCard('Editar sucursal', sucFields(), 'suc:' + s.id) + '</div>';
      const n = v.recepcionistas.filter(function (r) { return r.sucursalId === s.id; }).length;
      return '<article class="card pn-suc' + (m.draft ? ' is-draft' : '') + '"><div class="pn-suc-map">' + C.map({ small: true, pin: s.pin }) + '</div>' +
        '<div class="pn-suc-body"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span><span class="muted small">' + n + ' recepcionista' + (n === 1 ? '' : 's') + '</span>' + (m.html || '') +
        '<div class="item-actions">' + actions(m, locked, 'suc:' + s.id, 'sucursales:' + s.id) + '</div></div></article>';
    }).join('') + removedRows(id, 'sucursales', function (s) {
      return '<article class="card pn-suc is-removed"><div class="pn-suc-body"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span>' + badge('Se eliminará con sus recepcionistas', 'draft') +
        '<div class="item-actions">' + C.link('Deshacer', 'pnUndo', 'sucursales:' + s.id) + '</div></div></article>';
    }) + '</div>';
    return html;
  }
  function sucFields() {
    return C.map({ interactive: true, action: 'pnMap', pin: C.ui.draft.pin }) + '<div class="form-grid mt-16">' +
      C.field({ label: 'Dirección', bind: 'ui.draft.dir' }) + C.field({ label: 'Ciudad', bind: 'ui.draft.ciudad' }) + '</div>';
  }
  A.pnMap = function (el, ev) {
    const g = C.geocodeFromClick(el, ev);
    C.ui.draft.pin = g.pin; C.ui.draft.dir = g.dir; C.ui.draft.ciudad = g.ciudad;
    delete C.ui.errors['ui.draft.dir']; delete C.ui.errors['ui.draft.ciudad'];
    C.set();
  };

  function recFields(v) {
    return '<div class="form-grid">' +
      C.selectField({ label: 'Sucursal', bind: 'ui.draft.sucursalId', placeholder: 'Elegir sucursal', options: v.sucursales.map(function (s) { return { value: s.id, label: C.sucLabel(s) }; }) }) +
      '<span class="hide-m"></span>' +
      C.field({ label: 'Nombre recepcionista', bind: 'ui.draft.nombre' }) + C.field({ label: 'Teléfono recepcionista', bind: 'ui.draft.tel', inputmode: 'tel' }) + '</div>';
  }
  function tabRecepcionistas(id, v, locked) {
    let html = '<div class="pn-sec-head"><div><h2 class="h2">Recepcionistas</h2><p class="muted small">Agrupados por sucursal. En la compra solo se ofrecen los de la sucursal elegida.</p></div>' +
      (locked || !v.sucursales.length ? '' : C.btn('+ Agregar recepcionista', { action: 'pnNew', arg: 'rec', disabled: C.ui.creating === 'rec' })) + '</div>';
    if (C.ui.creating === 'rec') html += formCard('Nuevo recepcionista', recFields(v), 'rec:new');
    html += v.sucursales.map(function (s) {
      const rs = v.recepcionistas.filter(function (r) { return r.sucursalId === s.id; });
      return '<section class="pn-group"><h3 class="pn-group-t">' + C.icon('pin', 16) + e(s.dir) + ' <span class="muted">· ' + e(s.ciudad) + '</span></h3>' +
        (rs.length ? '<table class="pn-table"><tbody>' + rs.map(function (r) {
          const m = marker(id, 'recepcionistas:' + r.id);
          if (isEditing('rec', r.id)) return '<tr class="pn-tr-form"><td colspan="3">' + formCard('Editar recepcionista', recFields(v), 'rec:' + r.id) + '</td></tr>';
          return '<tr' + (m.draft ? ' class="is-draft"' : '') + '><td data-label="Nombre"><strong>' + e(r.nombre) + '</strong>' + (m.html || '') + '</td><td data-label="Teléfono">' + e(fmtTel(r.tel)) + '</td><td class="pn-td-actions">' + actions(m, locked, 'rec:' + r.id, 'recepcionistas:' + r.id) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p class="pn-warn">' + C.icon('alert', 16) + ' Esta sucursal no tiene recepcionista: el cliente no podrá elegir quién recibe.</p>') + '</section>';
    }).join('') + '<div class="pn-removed">' + removedRows(id, 'recepcionistas', function (r) {
      return '<p class="is-removed">' + e(r.nombre) + ' ' + badge('Se eliminará', 'draft') + ' ' + C.link('Deshacer', 'pnUndo', 'recepcionistas:' + r.id) + '</p>';
    }) + '</div>';
    return html;
  }

  /* Contrato generado con las condiciones (los vendedores crean contratos) */
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
        '<div><p class="upload-label">Documentos del cliente</p><p class="hint">Necesarios para crear o cambiar el contrato.</p><div class="docs pn-docs-up">' +
        C.CREDITO_DOCS.map(function (doc) { return C.uploadSlot({ path: 'ui.draft.docs.' + doc.key, label: doc.label, multiple: doc.multiple, max: doc.max, cta: doc.cta, sub: doc.sub }); }).join('') +
        C.uploadSlot({ path: 'ui.draft.docs.anverso', label: 'Carnet · anverso', cta: 'Anverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) +
        C.uploadSlot({ path: 'ui.draft.docs.reverso', label: 'Carnet · reverso', cta: 'Reverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) + '</div></div>' : '') + '</div>';
  }
  function tabCredito(id, v, locked) {
    const c = v.credito, m = marker(id, 'path:credito');
    const aprobado = c.estado === 'aprobado';
    const head = '<div class="pn-sec-head"><div><h2 class="h2">Crédito y contrato</h2><p class="muted small">El vendedor arma el contrato; se aplica cuando otra persona lo aprueba.</p></div>' +
      (locked || m.pending || isEditing('cred', 'x') ? '' : C.btn(aprobado ? 'Editar condiciones' : 'Crear contrato de crédito', { action: 'pnEdit', arg: 'cred:x', icon: aprobado ? 'edit' : 'fileText', primary: !aprobado })) + '</div>';
    if (isEditing('cred', 'x')) return head + formCard(aprobado ? 'Editar condiciones del crédito' : 'Crear contrato de crédito', creditFields(), 'cred:x');
    const solicitado = c.estado === 'solicitado' ? '<div class="pn-banner">' + C.icon('alert', 18) + '<span>El cliente pidió crédito desde la web. Revisa sus documentos y crea el contrato.</span></div>' : '';
    return head + solicitado + (m.html ? '<div class="mt-8">' + m.html + '</div>' : '') +
      '<div class="pn-credit"><div class="stack">' +
      '<section class="card card-pad"><div class="row-between"><h3 class="h3">Condiciones</h3>' + badge(C.CREDITO_ESTADOS[c.estado], aprobado ? 'ok' : 'neutral') + '</div>' +
      '<dl class="pn-kpis"><div><dt>Línea</dt><dd>' + (aprobado ? C.bs(c.linea) : '—') + '</dd></div><div><dt>Plazo</dt><dd>' + c.plazo + ' días</dd></div>' +
      '<div><dt>Usado</dt><dd>' + (aprobado ? C.bs(c.usado || 0) : '—') + '</dd></div><div><dt>Disponible</dt><dd>' + (aprobado ? C.bs(c.linea - (c.usado || 0)) : '—') + '</dd></div></dl></section>' +
      '<section class="card card-pad"><h3 class="h3">Documentos</h3>' + docsList(c.docs) + '</section></div>' +
      '<section class="card card-pad pn-contract"><div class="row-between"><h3 class="h3">Contrato</h3>' + badge(aprobado ? 'Vigente' : 'Sin contrato', aprobado ? 'ok' : 'neutral') + '</div>' +
      (aprobado ? '<div class="contract-body contract-body-sm">' + C.contratoPanel({ tipo: v.formaJuridica.tipo, ci: v.formaJuridica.ci, razon: v.formaJuridica.razon, nit: v.formaJuridica.nit, empresa: v.empresa, linea: c.linea, plazo: c.plazo }) + '</div>' +
        C.btn('Descargar contrato', { block: true, icon: 'download', action: 'downloadContract' }) + '<p class="hint">El cliente lo firma en su primera compra con crédito.</p>'
        : '<p class="muted mt-8">Esta empresa no tiene contrato de crédito.</p>') + '</section></div>';
  }

  function tabPedidos(id, v) {
    const list = v.pedidos.slice().sort(function (a, b) { return b.creado.localeCompare(a.creado); });
    const btn = v.estado === 'activa' ? C.btn('Hacer pedido para el cliente', { primary: true, icon: 'store', action: 'pnActAs', arg: id }) : '';
    let html = '<div class="pn-sec-head"><div><h2 class="h2">Pedidos</h2><p class="muted small">Puedes comprar en nombre del cliente; el pedido queda registrado a tu nombre.</p></div>' + btn + '</div>';
    if (!list.length) return html + '<div class="empty"><p class="h3">Sin pedidos todavía</p></div>';
    return html + '<table class="pn-table"><thead><tr><th>Pedido</th><th>Hecho</th><th>Entrega</th><th>Sucursal</th><th>Pago</th><th>Hecho por</th><th class="ta-r">Total</th></tr></thead><tbody>' +
      list.map(function (o) {
        return '<tr><td data-label="Pedido"><strong>#' + o.id + '</strong><span class="muted small pn-sub">' + e(o.items.map(function (i) { return i.name + ' ' + i.qty; }).join(' · ')) + '</span></td>' +
          '<td data-label="Hecho">' + fmtDT(o.creado) + '</td><td data-label="Entrega">' + C.fmtDay(o.entregaFecha) + ' · ' + e(o.franja) + '</td>' +
          '<td data-label="Sucursal">' + e(o.sucursal) + '</td><td data-label="Pago">' + e(o.pago) + '</td>' +
          '<td data-label="Hecho por">' + (o.porVendedor ? badge('Vendedor · ' + o.porVendedor, 'neutral') : 'Cliente') + '</td><td data-label="Total" class="ta-r"><strong>' + C.bs(o.total) + '</strong></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function reqRow(r) {
    return '<tr data-action="pnGo" data-arg="/panel/solicitud/' + r.id + '" role="link" tabindex="0"><td data-label="Solicitud"><strong>#' + r.id + '</strong> ' + badge(C.REQ_TIPOS[r.tipo], 'neutral') + '</td>' +
      '<td data-label="Empresa">' + e(r.empresaNombre) + '</td><td data-label="Enviada por">' + e(C.persona(r.autor).nombre) + '<span class="muted small pn-sub">' + fmtDT(r.fecha) + '</span></td>' +
      '<td data-label="Aprueba">' + e(C.persona(r.revisor).nombre) + '</td><td data-label="Cambios">' + (r.tipo === 'cambios' ? r.ops.length : '—') + '</td>' +
      '<td data-label="Estado">' + estadoBadge(r.estado) + '</td></tr>';
  }
  const REQ_HEAD = '<thead><tr><th>Solicitud</th><th>Empresa</th><th>Enviada por</th><th>Aprueba</th><th>Cambios</th><th>Estado</th></tr></thead>';
  function estadoBadge(st) { return badge(C.REQ_ESTADOS[st], st === 'aprobada' ? 'ok' : (st === 'rechazada' ? 'alert' : (st === 'pendiente' ? 'pending' : 'neutral'))); }

  const ACCION = { envio: 'Envío a aprobación', aprobacion: 'Aprobación', rechazo: 'Rechazo', notificacion: 'Notificación', pedido: 'Pedido', alta: 'Alta', cancelacion: 'Cancelación' };
  function logTable(entries, withEmpresa) {
    if (!entries.length) return '<p class="muted">Sin movimientos.</p>';
    return '<table class="pn-table pn-log"><thead><tr><th>Fecha</th><th>Persona</th><th>Acción</th>' + (withEmpresa ? '<th>Empresa</th>' : '') + '<th>Detalle</th></tr></thead><tbody>' +
      entries.map(function (l) {
        const emp = C.empresa(l.empresaId);
        return '<tr><td data-label="Fecha" class="nowrap">' + fmtDT(l.fecha) + '</td><td data-label="Persona">' + e(C.persona(l.actor).nombre) + '</td><td data-label="Acción">' + badge(ACCION[l.accion] || l.accion, l.accion === 'rechazo' ? 'alert' : (l.accion === 'aprobacion' ? 'ok' : 'neutral')) + '</td>' +
          (withEmpresa ? '<td data-label="Empresa">' + (emp ? '<a href="#/panel/empresa/' + emp.id + '/historial">' + e(emp.empresa) + '</a>' : e(l.empresaId || '—')) + '</td>' : '') +
          '<td data-label="Detalle">' + e(l.texto) + (l.req ? ' <a class="link" href="#/panel/solicitud/' + l.req + '">#' + l.req + '</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  function tabHistorial(id) {
    const reqs = P().requests.filter(function (r) { return r.empresaId === id; }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    const entries = P().log.filter(function (l) { return l.empresaId === id; });
    return '<div class="pn-sec-head"><h2 class="h2">Historial</h2></div>' +
      '<h3 class="h3 mt-8">Solicitudes</h3>' + (reqs.length ? '<table class="pn-table">' + REQ_HEAD + '<tbody>' + reqs.map(reqRow).join('') + '</tbody></table>' : '<p class="muted mt-8">Sin solicitudes.</p>') +
      '<h3 class="h3 mt-32">Registro de cambios</h3><div class="mt-8">' + logTable(entries, false) + '</div>';
  }

  C.route('/panel/empresa/:id/:tab', function (params) {
    const g = guard(); if (g) return g;
    const base = C.empresa(params.id);
    if (!base) return { redirect: '/panel/empresas' };
    if (params.tab === 'revisar') return revisarPage(params.id);
    const v = C.empView(params.id);
    const tab = TABS.some(function (t) { return t[0] === params.tab; }) ? params.tab : 'usuarios';
    const locked = base.estado !== 'activa';
    const counts = { usuarios: usersOf(v).length, sucursales: v.sucursales.length, recepcionistas: v.recepcionistas.length, pedidos: v.pedidos.length };
    const tabs = TABS.map(function (t) {
      const on = t[0] === tab;
      return '<a class="pn-tabs-a' + (on ? ' is-active' : '') + '" href="#/panel/empresa/' + params.id + '/' + t[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + t[1] + (counts[t[0]] != null ? ' <span class="muted">' + counts[t[0]] + '</span>' : '') + '</a>';
    }).join('');
    const fj = v.formaJuridica;
    const legal = fj.tipo === 'natural' ? 'Persona natural · CI ' + (fj.ci || '—') : (fj.razon || '—') + ' · NIT ' + (fj.nit || '—');
    let banners = C.pendingReqs(params.id).map(function (r) {
      return '<div class="pn-banner is-pending">' + C.icon('clock', 18) + '<span><strong>Solicitud #' + r.id + '</strong> de ' + e(C.persona(r.autor).nombre) + ' espera la aprobación de ' + e(C.persona(r.revisor).nombre) + '.' + (r.tipo === 'alta' ? ' La cuenta no se puede editar hasta aprobarla.' : ' Los datos involucrados quedan bloqueados.') + '</span><a class="btn btn-sm" href="#/panel/solicitud/' + r.id + '">Ver solicitud</a></div>';
    }).join('');
    if (base.estado === 'rechazada') banners += '<div class="pn-banner is-alert">' + C.icon('alert', 18) + '<span>El alta de esta cuenta fue rechazada. Revisa el motivo en el historial.</span></div>';
    const body = { usuarios: tabUsuarios, legal: tabLegal, sucursales: tabSucursales, recepcionistas: tabRecepcionistas, credito: tabCredito, pedidos: tabPedidos, historial: tabHistorial }[tab](params.id, v, locked);
    const n = C.draftOps(params.id).length;
    const html = '<nav class="pn-crumbs" aria-label="Ruta"><a href="#/panel/empresas">' + C.icon('arrowLeft', 16) + ' Empresas</a></nav>' +
      '<header class="pn-emp-hero"><div class="pn-emp-id">' + avatar(v.empresa, 'is-sq is-lg') + '<div><h1 class="h1">' + e(v.empresa) + '</h1><p class="muted small">' + e(legal) + ' · ' + (base.origen === 'autoregistro' ? 'Autoregistro' : 'Creada por ' + e(base.creadoPor)) + ' · ' + fmtDT(base.creado) + '</p><div class="pn-badges">' + empEstado(base) + '</div></div></div>' +
      '<div class="pn-hero-actions">' + (base.estado === 'activa' ? C.btn('Hacer pedido', { icon: 'store', action: 'pnActAs', arg: params.id }) : '') + '</div></header>' +
      banners + '<nav class="pn-tabs" aria-label="Secciones de la empresa">' + tabs + '</nav><div class="pn-tab-body">' + body + '</div>';
    const bar = n ? '<div class="pn-actionbar-in"><span class="pn-ab-t"><span class="pn-ab-dot" aria-hidden="true"></span><strong>' + n + (n === 1 ? ' cambio' : ' cambios') + ' sin enviar</strong><span class="muted small hide-m">Nada se aplica hasta que otra persona lo apruebe.</span></span>' +
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
    const [type, eid] = el.dataset.arg.split(':');
    C.ui.creating = null; C.ui.errors = {}; C.ui.editing = { type: type, id: eid };
    if (type === 'user') { const u = usersOf(v).find(function (x) { return x.id === eid; }); C.ui.draft = C.clone(u); }
    else if (type === 'suc') C.ui.draft = C.clone(v.sucursales.find(function (x) { return x.id === eid; }));
    else if (type === 'rec') C.ui.draft = C.clone(v.recepcionistas.find(function (x) { return x.id === eid; }));
    else if (type === 'legal') C.ui.draft = Object.assign({ empresa: v.empresa }, C.clone(v.formaJuridica));
    else if (type === 'cred') {
      const c = C.clone(v.credito);
      C.ui.draft = { estado: c.estado === 'aprobado' ? 'aprobado' : 'aprobado', linea: c.linea ? String(c.linea) : '', plazo: String(c.plazo || 30), docs: Object.assign(C.emptyDocs(), c.docs || {}), usado: c.usado || 0 };
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
    const [type, eid] = el.dataset.arg.split(':');
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
    C.toast('Agregado al borrador · aún no se aplica');
  };
  A.pnDelete = function (el) {
    const id = curEmp(), v = C.empView(id);
    const [coll, eid] = el.dataset.arg.split(':');
    const item = v[coll].find(function (x) { return x.id === eid; });
    const name = coll === 'sucursales' ? item.dir : (coll === 'recepcionistas' ? item.nombre : (fullName(item) || item.email));
    const n = coll === 'sucursales' ? v.recepcionistas.filter(function (r) { return r.sucursalId === eid; }).length : 0;
    C.ui.dialog = {
      title: '¿Eliminar ' + ({ sucursales: 'esta sucursal', recepcionistas: 'este recepcionista', empleados: 'este usuario' })[coll] + '?',
      body: '<strong>' + e(name) + '</strong>' + (n ? '<br>También se eliminarán sus ' + n + ' recepcionista' + (n > 1 ? 's' : '') + '.' : '') + '<br>Se agregará al borrador y solo se aplicará cuando otra persona lo apruebe.',
      confirm: 'Agregar al borrador', action: 'pnDeleteYes', arg: el.dataset.arg
    };
    C.renderOverlays();
  };
  A.pnDeleteYes = function (el) {
    const [coll, eid] = el.dataset.arg.split(':');
    C.draftAdd(curEmp(), { op: 'remove', coll: coll, id: eid });
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
    C.ui.dialog = { title: '¿Descartar los cambios sin enviar?', body: 'Se perderán ' + C.draftOps(el.dataset.arg).length + ' cambios del borrador. Los datos de la empresa no cambian.', confirm: 'Descartar cambios', action: 'pnDiscardYes', arg: el.dataset.arg };
    C.renderOverlays();
  };
  A.pnDiscardYes = function (el) {
    delete P().drafts[el.dataset.arg]; C.ui.dialog = null; C.set(); C.toast('Borrador descartado');
    if (C.currentPath().indexOf('/revisar') > -1) C.go('/panel/empresa/' + el.dataset.arg + '/usuarios');
  };

  /* ---------- Cambios agrupados por sección (diff antes → después) ---------- */
  function diffCards(ops, emp, removable) {
    const groups = {};
    ops.forEach(function (o) { const d = C.describeOp(o, emp); (groups[d.section] = groups[d.section] || []).push({ o: o, d: d }); });
    return Object.keys(groups).map(function (sec) {
      return '<section class="pn-diff-sec"><h3 class="eyebrow">' + e(sec) + '</h3>' + groups[sec].map(function (x) {
        const k = x.d.kind;
        return '<article class="card pn-diff"><header class="row-between"><span class="row">' + badge({ add: 'Agregar', edit: 'Editar', remove: 'Eliminar' }[k], k === 'remove' ? 'alert' : (k === 'add' ? 'ok' : 'neutral')) + '<strong>' + e(x.d.title.replace(/^(Agregar|Editar|Eliminar) /, '').replace(/^./, function (c) { return c.toUpperCase(); })) + '</strong></span>' +
          (removable ? C.link('Quitar', 'pnUndo', C.opKey(x.o)) : '') + '</header>' +
          (x.d.rows.length ? '<table class="pn-diff-t"><thead><tr><th>Dato</th>' + (k === 'add' ? '' : '<th>Antes</th>') + '<th>' + (k === 'add' ? 'Valor' : 'Después') + '</th></tr></thead><tbody>' + x.d.rows.map(function (r) {
            return '<tr><td data-label="Dato">' + e(r.label) + '</td>' + (k === 'add' ? '' : '<td data-label="Antes" class="pn-before">' + e(r.before) + '</td>') + '<td data-label="' + (k === 'add' ? 'Valor' : 'Después') + '" class="pn-after">' + e(r.after) + '</td></tr>';
          }).join('') + '</tbody></table>' : (k === 'remove' ? '<p class="muted small mt-8">Se quitará de la cuenta' + (x.o.coll === 'sucursales' ? ' junto con sus recepcionistas' : '') + '.</p>' : '')) + '</article>';
      }).join('') + '</section>';
    }).join('');
  }

  function approverField(bind) {
    const opts = P().equipo.filter(function (p) { return p.id !== P().persona; });
    return C.selectField({ label: 'Quién aprueba', bind: bind, err: 'revisor', placeholder: 'Elegir aprobador', options: opts.map(function (p) { return { value: p.id, label: p.nombre + ' · ' + p.rol }; }) });
  }

  /* ---------- Revisar y enviar (confirmación final) ---------- */
  function revisarPage(id) {
    const ops = C.draftOps(id), emp = C.empresa(id);
    if (!ops.length) return { redirect: '/panel/empresa/' + id + '/usuarios' };
    if (C.ui.draft.notificar == null) C.ui.draft.notificar = true;
    const html = '<nav class="pn-crumbs"><a href="#/panel/empresa/' + id + '/usuarios">' + C.icon('arrowLeft', 16) + ' ' + e(emp.empresa) + '</a></nav>' +
      '<div class="pn-head"><div><h1 class="h1">Revisa los cambios antes de enviarlos</h1><p class="muted">' + ops.length + (ops.length === 1 ? ' cambio' : ' cambios') + ' en ' + e(emp.empresa) + '. Nada se aplica hasta que otra persona lo apruebe.</p></div></div>' +
      '<div class="pn-review"><div class="pn-review-main">' + diffCards(ops, C.empView(id), true) + '</div>' +
      '<aside class="card card-pad pn-send"><h2 class="h3">Enviar a aprobación</h2>' +
      '<div class="stack mt-16">' + approverField('ui.draft.revisor') +
      C.field({ label: 'Motivo del cambio', bind: 'ui.draft.nota', err: 'nota', textarea: true, rows: 3, placeholder: 'Ej. El cliente pidió por WhatsApp cambiar el teléfono de su recepcionista.' }) +
      C.checkbox({ bind: 'ui.draft.notificar', label: 'Avisar al cliente por correo cuando se apruebe' + (emp.user.email ? '<span class="muted small pn-sub">' + e(emp.user.email) + '</span>' : '') }) +
      C.btn('Enviar a aprobación', { primary: true, block: true, action: 'pnSend', arg: id }) +
      C.link('Seguir editando', 'pnGo', '/panel/empresa/' + id + '/usuarios') + '</div></aside></div>';
    return { layout: 'panel', nav: 'empresas', title: 'Revisar cambios', html: html };
  }
  A.pnSend = function (el) {
    const id = el.dataset.arg, d = C.ui.draft, err = {};
    if (!d.revisor) err.revisor = 'Elige quién aprueba';
    if ((d.nota || '').trim().length < 5) err.nota = 'Explica brevemente el motivo (queda en el registro)';
    if (Object.keys(err).length) return C.fail(err);
    const emp = C.empresa(id), ops = C.clone(C.draftOps(id));
    const req = { id: P().nextReq++, tipo: 'cambios', empresaId: id, empresaNombre: emp.empresa, autor: P().persona, revisor: d.revisor, estado: 'pendiente', fecha: C.nowISO(), notificar: !!d.notificar, nota: d.nota.trim(), ops: ops };
    P().requests.unshift(req);
    delete P().drafts[id];
    log('envio', id, 'Envió ' + ops.length + (ops.length === 1 ? ' cambio' : ' cambios') + ' a aprobación de ' + C.persona(d.revisor).nombre, req.id);
    C.save();
    C.go('/panel/solicitud/' + req.id + '?enviada=1');
  };

  /* ======================= SOLICITUD ======================= */
  function altaSummary(emp) {
    const fj = emp.formaJuridica, c = emp.credito;
    const row = function (k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; };
    return '<div class="pn-alta">' +
      '<section class="card card-pad"><h3 class="eyebrow">Contacto principal</h3><dl class="pn-dl">' + row('Nombre', e(fullName(emp.user))) + row('Rol', e(emp.user.rol)) + row('Correo', e(emp.user.email)) + row('WhatsApp', e(emp.user.wa)) + '</dl></section>' +
      '<section class="card card-pad"><h3 class="eyebrow">Datos legales</h3>' + legalView(emp) + '</section>' +
      '<section class="card card-pad"><h3 class="eyebrow">Sucursales y recepcionistas</h3>' + emp.sucursales.map(function (s) {
        return '<p class="mt-8"><strong>' + e(s.dir) + '</strong> · ' + e(s.ciudad) + '<br><span class="muted small">Recibe: ' + e(emp.recepcionistas.filter(function (r) { return r.sucursalId === s.id; }).map(function (r) { return r.nombre + ' (' + r.tel + ')'; }).join(', ') || '—') + '</span></p>';
      }).join('') + '</section>' +
      '<section class="card card-pad"><h3 class="eyebrow">Crédito y contrato</h3><dl class="pn-dl">' + row('Estado', e(C.CREDITO_ESTADOS[c.estado])) + (c.estado === 'aprobado' ? row('Línea', C.bs(c.linea)) + row('Plazo', c.plazo + ' días') : '') + '</dl>' + (c.estado === 'aprobado' ? docsList(c.docs) : '') + '</section>' +
      '<section class="card card-pad"><h3 class="eyebrow">Usuarios adicionales</h3>' + (emp.empleados.length ? emp.empleados.map(function (u) { return '<p class="mt-8"><strong>' + e(fullName(u)) + '</strong> · ' + e(u.rol) + '<br><span class="muted small">' + e(u.email) + ' · ' + e(u.wa) + '</span></p>'; }).join('') : '<p class="muted mt-8">Ninguno.</p>') + '</section></div>';
  }
  function notifPreview(r) {
    const autor = C.persona(r.autor), rev = C.persona(r.revisor);
    const what = r.tipo === 'alta' ? 'aprobar el alta de la cuenta ' + r.empresaNombre : (r.tipo === 'vendedor' ? 'aprobar el alta de ' + r.persona.nombre + ' como vendedor' : 'aprobar ' + r.ops.length + (r.ops.length === 1 ? ' cambio' : ' cambios') + ' en ' + r.empresaNombre);
    return '<section class="pn-notif"><h3 class="h3">Notificación al aprobador</h3><p class="muted small">Así le llega a ' + e(rev.nombre) + ' (simulado: no se envía nada).</p>' +
      '<div class="pn-notif-grid"><article class="pn-mail"><header><span class="muted small">De</span> Panel Cooltiva · <span class="muted small">Para</span> ' + e(rev.email) + '</header>' +
      '<h4>' + e(autor.nombre) + ' te pidió ' + e(what) + '</h4><p>Motivo: “' + e(r.nota) + '”</p><p class="muted small">Solicitud #' + r.id + ' · ' + fmtDT(r.fecha) + '</p><span class="btn btn-primary btn-sm">Revisar solicitud</span></article>' +
      '<article class="pn-wa"><span class="pn-wa-h">' + C.icon('msg', 16) + ' WhatsApp · ' + e(rev.wa) + '</span><p class="pn-wa-b">Cooltiva: ' + e(autor.nombre) + ' te pidió ' + e(what) + '. Revísalo en el panel: solicitud #' + r.id + '.</p></article></div></section>';
  }
  function clientMail(r, emp) {
    if (!r.notificar || r.estado !== 'aprobada' || !emp) return '';
    const alta = r.tipo === 'alta';
    return '<section class="pn-notif"><h3 class="h3">Correo al cliente</h3><p class="muted small">Enviado al aprobarse (simulado).</p><article class="pn-mail">' +
      '<header><span class="muted small">Para</span> ' + e(emp.user.email || '—') + '</header>' +
      '<h4>' + (alta ? 'Tu cuenta Cooltiva está lista' : 'Actualizamos los datos de tu cuenta Cooltiva') + '</h4>' +
      (alta ? '<p>Hola ' + e(emp.user.nombre) + ', creamos la cuenta de <strong>' + e(emp.empresa) + '</strong> con tus sucursales, recepcionistas' + (emp.credito.estado === 'aprobado' ? ' y tu crédito' : '') + '. Ya puedes comprar: entra con tu correo y crea tu contraseña con el enlace.</p><span class="btn btn-primary btn-sm">Crear mi contraseña</span>'
        : '<p>Hola ' + e(emp.user.nombre) + ', a pedido tuyo actualizamos: ' + e(r.ops.map(function (o) { return C.describeOp(o, emp).title.toLowerCase(); }).join('; ')) + '.</p><p class="muted small">Si no reconoces este cambio, responde este correo.</p>') +
      '</article></section>';
  }
  function timeline(r) {
    const step = function (done, cur, title, sub) { return '<li class="' + (done ? 'is-done' : '') + (cur ? ' is-current' : '') + '"><span class="pn-tl-dot" aria-hidden="true">' + (done ? C.icon('check', 12) : '') + '</span><div><strong>' + title + '</strong><span class="muted small">' + sub + '</span></div></li>'; };
    const rev = C.persona(r.revisor).nombre;
    const done = r.estado === 'aprobada', rej = r.estado === 'rechazada', canc = r.estado === 'cancelada';
    return '<ol class="pn-tl">' + step(true, false, 'Enviada', e(C.persona(r.autor).nombre) + ' · ' + fmtDT(r.fecha)) +
      step(done || rej || canc, r.estado === 'pendiente', canc ? 'Cancelada' : 'En revisión', canc ? 'La retiró quien la envió' : 'Aprueba ' + e(rev)) +
      (rej ? step(true, false, 'Rechazada', e(rev) + ' · ' + fmtDT(r.revisado)) : step(done, false, 'Aprobada y aplicada', done ? e(rev) + ' · ' + fmtDT(r.revisado) : 'Pendiente')) +
      (r.notificar && !rej && !canc && r.tipo !== 'vendedor' ? step(done, false, 'Cliente notificado', done ? 'Correo enviado' : 'Al aprobarse') : '') + '</ol>';
  }

  C.route('/panel/solicitud/:id', function (params) {
    const g = guard(); if (g) return g;
    const r = P().requests.find(function (x) { return String(x.id) === params.id; });
    if (!r) return { redirect: '/panel/aprobaciones' };
    const emp = C.empresa(r.empresaId);
    const me = P().persona, rev = C.persona(r.revisor);
    const sent = C.query().enviada === '1' && r.autor === me && r.estado === 'pendiente';
    let decision = '';
    if (r.estado === 'pendiente') {
      if (me === r.revisor) {
        decision = '<section class="card card-strong card-pad pn-decide"><h2 class="h3">Tu decisión</h2><p class="muted small">Revisa cada cambio. Al aprobar, se aplica en la cuenta' + (r.notificar ? ' y se avisa al cliente' : '') + '.</p>' +
          '<div class="mt-16">' + C.field({ label: 'Comentario (obligatorio si rechazas)', bind: 'ui.draft.comentario', err: 'comentario', textarea: true, rows: 2 }) + '</div>' +
          '<div class="form-actions">' + C.btn('Rechazar', { action: 'pnReject', arg: r.id }) + C.btn('Aprobar y aplicar', { primary: true, action: 'pnApprove', arg: r.id, icon: 'shield' }) + '</div></section>';
      } else if (me === r.autor) {
        decision = '<section class="card card-pad pn-decide"><p>' + C.icon('clock', 18) + ' Esperando la aprobación de <strong>' + e(rev.nombre) + '</strong>.</p><div class="form-actions">' + C.btn('Cancelar solicitud', { action: 'pnCancelReq', arg: r.id }) + '</div></section>';
      } else {
        decision = '<section class="card card-pad pn-decide"><p>' + C.icon('shield', 18) + ' Solo <strong>' + e(rev.nombre) + '</strong> puede aprobar esta solicitud.</p><p class="hint mt-8">Demo: cambia de perfil desde tu nombre, arriba a la derecha.</p></section>';
      }
    } else if (r.comentario) {
      decision = '<section class="card card-pad pn-decide"><p><strong>' + e(rev.nombre) + ':</strong> “' + e(r.comentario) + '”</p></section>';
    }
    const content = r.tipo === 'alta' && emp ? altaSummary(emp)
      : (r.tipo === 'vendedor' ? '<section class="card card-pad"><dl class="pn-dl"><div><dt>Nombre</dt><dd>' + e(r.persona.nombre) + '</dd></div><div><dt>Rol</dt><dd>' + e(r.persona.rol) + '</dd></div><div><dt>Correo</dt><dd>' + e(r.persona.email) + '</dd></div><div><dt>WhatsApp</dt><dd>' + e(r.persona.wa) + '</dd></div></dl></section>'
        : diffCards(r.ops, emp ? C.applyOps(C.clone(emp), r.estado === 'pendiente' ? r.ops : []) : {}, false));
    const html = (sent ? '<section class="pn-sent">' + C.success('Enviado a aprobación', 'Le avisamos a <strong>' + e(rev.nombre) + '</strong> por correo y WhatsApp. Cuando lo apruebe, se aplicará' + (r.notificar && r.tipo !== 'vendedor' ? ' y se avisará al cliente' : '') + '.', '<a class="btn" href="#/panel/aprobaciones?tab=enviadas">Ver mis solicitudes</a>' + (emp ? '<a class="btn btn-primary" href="#/panel/empresa/' + emp.id + '/usuarios">Volver a la empresa</a>' : '')) + '</section>' : '') +
      '<nav class="pn-crumbs"><a href="#/panel/aprobaciones">' + C.icon('arrowLeft', 16) + ' Aprobaciones</a></nav>' +
      '<header class="pn-head"><div><p class="eyebrow">' + C.REQ_TIPOS[r.tipo] + '</p><h1 class="h1">Solicitud #' + r.id + ' · ' + e(r.empresaNombre) + '</h1><div class="pn-badges">' + estadoBadge(r.estado) + '</div></div>' +
      (emp && r.tipo !== 'vendedor' ? '<a class="btn" href="#/panel/empresa/' + emp.id + '/usuarios">' + C.icon('building', 18) + '<span>Ver empresa</span></a>' : '') + '</header>' +
      '<div class="pn-req"><div class="pn-req-main">' +
      '<dl class="pn-meta card card-pad"><div><dt>Enviada por</dt><dd>' + e(C.persona(r.autor).nombre) + '</dd></div><div><dt>Fecha</dt><dd>' + fmtDT(r.fecha) + '</dd></div><div><dt>Aprueba</dt><dd>' + e(rev.nombre) + '</dd></div>' +
      '<div><dt>Avisar al cliente</dt><dd>' + (r.tipo === 'vendedor' ? 'No aplica' : (r.notificar ? 'Sí' + (emp && emp.user.email ? '<span class="muted small pn-sub">' + e(emp.user.email) + '</span>' : '') : 'No')) + '</dd></div><div class="pn-meta-full"><dt>Motivo</dt><dd>' + e(r.nota) + '</dd></div></dl>' +
      decision + '<h2 class="h2 mt-24">' + (r.tipo === 'alta' ? 'Datos de la cuenta nueva' : (r.tipo === 'vendedor' ? 'Nuevo vendedor' : 'Cambios (' + r.ops.length + ')')) + '</h2><div class="mt-16">' + content + '</div></div>' +
      '<aside class="pn-req-side"><section class="card card-pad"><h2 class="h3">Estado</h2>' + timeline(r) + '</section>' + notifPreview(r) + clientMail(r, emp) + '</aside></div>';
    return { layout: 'panel', nav: 'aprobaciones', title: 'Solicitud #' + r.id, html: html };
  });

  function findReq(id) { return P().requests.find(function (x) { return String(x.id) === String(id); }); }
  A.pnApprove = function (el) {
    const r = findReq(el.dataset.arg), emp = C.empresa(r.empresaId);
    r.estado = 'aprobada'; r.revisado = C.nowISO(); r.comentario = (C.ui.draft.comentario || '').trim();
    if (r.tipo === 'alta') { emp.estado = 'activa'; emp.actualizado = r.revisado; }
    else if (r.tipo === 'vendedor') P().equipo.push(C.clone(r.persona));
    else { C.applyOps(emp, r.ops); emp.actualizado = r.revisado; }
    log('aprobacion', r.empresaId, r.tipo === 'alta' ? 'Aprobó el alta de la cuenta' : (r.tipo === 'vendedor' ? 'Aprobó el alta de ' + r.persona.nombre + ' como vendedor' : 'Aprobó y aplicó ' + r.ops.length + (r.ops.length === 1 ? ' cambio' : ' cambios')), r.id);
    if (r.notificar && emp && r.tipo !== 'vendedor') log('notificacion', r.empresaId, 'Se notificó al cliente por correo (' + (emp.user.email || 'sin correo') + ')', r.id);
    C.ui.draft = {}; C.set();
    C.toast(r.tipo === 'alta' ? 'Cuenta aprobada · correo de bienvenida enviado (simulado)' : 'Aprobado y aplicado');
  };
  A.pnReject = function (el) {
    const r = findReq(el.dataset.arg), c = (C.ui.draft.comentario || '').trim();
    if (c.length < 5) return C.fail({ comentario: 'Explica por qué lo rechazas: le llega a quien lo envió' });
    r.estado = 'rechazada'; r.revisado = C.nowISO(); r.comentario = c;
    if (r.tipo === 'alta') C.empresa(r.empresaId).estado = 'rechazada';
    log('rechazo', r.empresaId, 'Rechazó la solicitud: ' + c, r.id);
    C.ui.draft = {}; C.set(); C.toast('Solicitud rechazada');
  };
  A.pnCancelReq = function (el) {
    C.ui.dialog = { title: '¿Cancelar la solicitud?', body: 'Los cambios vuelven a tu borrador para que puedas corregirlos y enviarlos de nuevo.', confirm: 'Cancelar solicitud', action: 'pnCancelReqYes', arg: el.dataset.arg };
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
  C.route('/panel/aprobaciones', function () {
    const g = guard(); if (g) return g;
    const me = P().persona, tab = C.query().tab || 'revisar';
    const all = P().requests.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    const lists = {
      revisar: all.filter(function (r) { return r.estado === 'pendiente' && r.revisor === me; }),
      enviadas: all.filter(function (r) { return r.autor === me; }),
      historial: all.filter(function (r) { return r.estado !== 'pendiente'; }),
      todas: all.filter(function (r) { return r.estado === 'pendiente'; })
    };
    const labels = { revisar: 'Por revisar', enviadas: 'Enviadas por mí', todas: 'Pendientes del equipo', historial: 'Historial' };
    const tabs = Object.keys(labels).map(function (k) { return '<a class="pn-tabs-a' + (k === tab ? ' is-active' : '') + '" href="#/panel/aprobaciones?tab=' + k + '">' + labels[k] + ' <span class="muted">' + lists[k].length + '</span></a>'; }).join('');
    const list = lists[tab] || [];
    const html = '<div class="pn-head"><div><h1 class="h1">Aprobaciones</h1><p class="muted">Ningún cambio de un vendedor se aplica sin la aprobación de otra persona.</p></div></div>' +
      '<nav class="pn-tabs">' + tabs + '</nav>' +
      (list.length ? '<table class="pn-table">' + REQ_HEAD + '<tbody>' + list.map(reqRow).join('') + '</tbody></table>'
        : '<div class="empty"><p class="h3">' + (tab === 'revisar' ? 'No tienes solicitudes por revisar' : 'Nada por aquí') + '</p><p class="muted">' + (tab === 'revisar' ? 'Cuando un compañero te asigne una aprobación, aparecerá aquí y te avisaremos por correo y WhatsApp.' : '') + '</p></div>');
    return { layout: 'panel', nav: 'aprobaciones', title: 'Aprobaciones', html: html };
  });

  /* ======================= REGISTRO DE CAMBIOS ======================= */
  C.route('/panel/registro', function () {
    const g = guard(); if (g) return g;
    const d = C.ui.draft;
    const entries = P().log.filter(function (l) {
      if (d.rEmp && l.empresaId !== d.rEmp) return false;
      if (d.rPer && l.actor !== d.rPer) return false;
      if (d.rAcc && d.rAcc !== 'todas' && l.accion !== d.rAcc) return false;
      return true;
    }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    const emps = Object.keys(C.S.empresas).map(function (k) { return { value: k, label: C.S.empresas[k].empresa }; });
    const pers = P().equipo.map(function (p) { return { value: p.id, label: p.nombre }; }).concat([{ value: 'cliente', label: 'Cliente' }]);
    const html = '<div class="pn-head"><div><h1 class="h1">Registro de cambios</h1><p class="muted">Quién hizo qué, cuándo y en qué cuenta. No se puede editar ni borrar.</p></div></div>' +
      '<div class="pn-toolbar pn-filters">' +
      C.selectField({ label: 'Empresa', bind: 'ui.draft.rEmp', placeholder: 'Todas', options: emps, rerender: true }) +
      C.selectField({ label: 'Persona', bind: 'ui.draft.rPer', placeholder: 'Todas', options: pers, rerender: true }) +
      C.selectField({ label: 'Acción', bind: 'ui.draft.rAcc', placeholder: 'Todas', options: Object.keys(ACCION).map(function (k) { return { value: k, label: ACCION[k] }; }), rerender: true }) + '</div>' +
      '<p class="muted small mt-16">' + entries.length + ' movimientos</p><div class="mt-8">' + logTable(entries, true) + '</div>';
    return { layout: 'panel', nav: 'registro', title: 'Registro de cambios', html: html };
  });

  /* ======================= EQUIPO ======================= */
  C.route('/panel/equipo', function () {
    const g = guard(); if (g) return g;
    const pend = P().requests.filter(function (r) { return r.tipo === 'vendedor' && r.estado === 'pendiente'; });
    let html = '<div class="pn-head"><div><h1 class="h1">Equipo</h1><p class="muted">Personas de Cooltiva con acceso al panel. Dar de alta a un vendedor también requiere aprobación.</p></div>' +
      C.btn('+ Agregar vendedor', { action: 'pnNewSeller', disabled: C.ui.creating === 'seller' }) + '</div>';
    if (C.ui.creating === 'seller') {
      html += '<section class="card card-strong card-pad form-card reveal"><h3 class="h3">Nuevo vendedor</h3><div class="form-grid mt-16">' +
        C.field({ label: 'Nombre y apellido', bind: 'ui.draft.nombre' }) + C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel' }) +
        C.field({ label: 'Correo de Cooltiva', bind: 'ui.draft.email', type: 'email', cls: 'span-2' }) + approverField('ui.draft.revisor') +
        C.field({ label: 'Motivo', bind: 'ui.draft.nota', err: 'nota', placeholder: 'Ej. Se incorpora al equipo de Cochabamba' }) + '</div>' +
        '<div class="form-actions">' + C.btn('Cancelar', { action: 'pnCancel' }) + C.btn('Enviar a aprobación', { primary: true, action: 'pnSendSeller' }) + '</div></section>';
    }
    html += '<table class="pn-table"><thead><tr><th>Persona</th><th>Rol</th><th>Correo</th><th>WhatsApp</th><th>Estado</th></tr></thead><tbody>' +
      P().equipo.map(function (p) {
        return '<tr><td data-label="Persona"><span class="pn-user">' + avatar(p.nombre, 'is-sm') + '<strong>' + e(p.nombre) + '</strong></span></td><td data-label="Rol">' + e(p.rol) + '</td><td data-label="Correo">' + e(p.email) + '</td><td data-label="WhatsApp">' + e(p.wa) + '</td><td data-label="Estado">' + badge('Activo', 'ok') + '</td></tr>';
      }).join('') + pend.map(function (r) {
        return '<tr class="is-draft"><td data-label="Persona"><span class="pn-user">' + avatar(r.persona.nombre, 'is-sm') + '<strong>' + e(r.persona.nombre) + '</strong></span></td><td data-label="Rol">' + e(r.persona.rol) + '</td><td data-label="Correo">' + e(r.persona.email) + '</td><td data-label="WhatsApp">' + e(r.persona.wa) + '</td><td data-label="Estado"><a href="#/panel/solicitud/' + r.id + '">' + badge('En aprobación #' + r.id, 'pending') + '</a></td></tr>';
      }).join('') + '</tbody></table>';
    return { layout: 'panel', nav: 'equipo', title: 'Equipo', html: html };
  });
  A.pnNewSeller = function () { C.ui.creating = 'seller'; C.ui.draft = {}; C.ui.errors = {}; C.set(); };
  A.pnSendSeller = function () {
    const d = C.ui.draft, err = {};
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) err['ui.draft.email'] = 'Escribe un correo válido';
    if ((d.wa || '').replace(/\D/g, '').length < 8) err['ui.draft.wa'] = 'Escribe un WhatsApp válido';
    if (!d.revisor) err.revisor = 'Elige quién aprueba';
    if ((d.nota || '').trim().length < 5) err.nota = 'Explica el motivo';
    if (Object.keys(err).length) return C.fail(err);
    const persona = { id: C.uid('p'), nombre: d.nombre.trim(), rol: 'Vendedor', email: d.email.trim(), wa: d.wa.trim() };
    const req = { id: P().nextReq++, tipo: 'vendedor', empresaId: null, empresaNombre: persona.nombre, persona: persona, autor: P().persona, revisor: d.revisor, estado: 'pendiente', fecha: C.nowISO(), notificar: false, nota: d.nota.trim(), ops: [] };
    P().requests.unshift(req);
    log('envio', null, 'Envió el alta de ' + persona.nombre + ' como vendedor a aprobación de ' + C.persona(d.revisor).nombre, req.id);
    C.save(); C.go('/panel/solicitud/' + req.id + '?enviada=1');
  };

  /* ======================= NUEVA CUENTA (wizard) ======================= */
  const NUEVA_STEPS = ['contacto', 'legal', 'sucursales', 'recepcionistas', 'credito', 'usuarios', 'revisar'];
  const NUEVA_LABELS = ['Contacto', 'Forma jurídica', 'Sucursales', 'Recepcionistas', 'Crédito y contrato', 'Usuarios', 'Revisar y enviar'];
  function nPage(i, html, rightBtn) {
    return {
      layout: 'wizard', title: 'Nueva cuenta · ' + NUEVA_LABELS[i], width: 'wz-w-mid', logoHref: '#/panel/empresas',
      headRight: '<button type="button" class="link pn-exit" data-action="pnNuevaExit">Guardar y salir</button>',
      tabs: C.buildTabs(NUEVA_LABELS, i, P().nueva.maxStep, 'pnNTab'),
      html: '<p class="eyebrow">Panel de vendedores · Nueva cuenta</p>' + html,
      bar: { left: C.btn(i === 0 ? 'Salir' : 'Atrás', { action: i === 0 ? 'pnNuevaExit' : 'pnNTab', arg: i - 1 }), right: rightBtn || C.btn('Siguiente', { primary: true, action: 'pnNNext', arg: i }) }
    };
  }
  function nGuard(i) {
    if (!P().loggedIn) return { redirect: '/panel/login' };
    if (i > P().nueva.maxStep) return { redirect: '/panel/nueva/' + NUEVA_STEPS[P().nueva.maxStep] };
    return null;
  }
  A.pnNTab = function (el) { C.go('/panel/nueva/' + NUEVA_STEPS[Number(el.dataset.arg)]); };
  A.pnNuevaExit = function () { C.save(); C.go('/panel/empresas'); C.toast('Borrador del alta guardado'); };
  const N = function () { return P().nueva; };
  const NV = {};

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
  const NVAL = {};

  NV.contacto = function (i) {
    const c = N().contacto;
    const roles = C.ROLES.map(function (r) { return C.choice({ label: r, selected: c.rol === r, action: 'pnNRol', arg: r }); }).join('');
    return nPage(i, '<h1 class="h1 wz-title">¿Para quién es la cuenta?</h1>' +
      '<div class="stack">' + C.field({ label: 'Nombre comercial de la empresa', bind: 'panel.nueva.contacto.empresa', placeholder: 'Ej. Catering Andino' }) +
      '<h2 class="h3 mt-8">Contacto principal</h2><div class="form-grid">' + C.field({ label: 'Nombre', bind: 'panel.nueva.contacto.nombre' }) + C.field({ label: 'Apellido', bind: 'panel.nueva.contacto.apellido' }) + '</div>' +
      '<div class="field' + C.errCls('rol') + '"><span class="label">Rol en el negocio</span><div class="choice-grid cols-2 focus-target" tabindex="-1">' + roles + '</div>' + C.err('rol') + '</div>' +
      '<div class="form-grid">' + C.field({ label: 'Correo electrónico', bind: 'panel.nueva.contacto.email', type: 'email', hint: 'Con este correo entra a la tienda.' }) + C.field({ label: 'WhatsApp', bind: 'panel.nueva.contacto.wa', type: 'tel', placeholder: '+591 7000 0000' }) + '</div></div>');
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

  NV.sucursales = function (i) {
    const list = N().sucursales;
    if (!C.ui.draft.hasOwnProperty('dir')) C.ui.draft = { dir: '', ciudad: '', pin: null };
    return nPage(i, '<h1 class="h1 wz-title">Sucursales del cliente</h1><p class="lead">Agrega todas las direcciones donde recibe pedidos.</p>' +
      '<div class="field mt-24' + C.errCls('sucs') + '">' + (list.length ? '<div class="item-list">' + list.map(function (s) {
        return '<article class="card item-card suc-card"><div class="suc-thumb">' + C.map({ small: true, pin: s.pin }) + '</div><div class="item-main"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span></div><div class="item-actions">' + C.link('Quitar', 'pnNRemove', 'sucursales:' + s.id) + '</div></article>';
      }).join('') + '</div>' : '') + C.err('sucs') + '</div>' +
      '<section class="card card-pad mt-16"><h2 class="h3">Agregar sucursal</h2><div class="mt-16">' + sucFields() + '</div><div class="form-actions">' + C.btn('+ Agregar sucursal', { action: 'pnNAddSuc' }) + '</div></section>');
  };
  A.pnNAddSuc = function () {
    const d = C.ui.draft, err = {};
    if (!(d.dir || '').trim()) err['ui.draft.dir'] = 'Escribe la dirección o toca el mapa';
    if (!(d.ciudad || '').trim()) err['ui.draft.ciudad'] = 'Escribe la ciudad';
    if (Object.keys(err).length) return C.fail(err);
    N().sucursales.push({ id: C.uid('s'), dir: d.dir.trim(), ciudad: d.ciudad.trim(), pin: d.pin || { x: 50, y: 50 } });
    C.ui.draft = { dir: '', ciudad: '', pin: null }; delete C.ui.errors.sucs;
    C.set(); C.toast('Sucursal agregada');
  };
  A.pnNRemove = function (el) {
    const [coll, id] = el.dataset.arg.split(':');
    N()[coll] = N()[coll].filter(function (x) { return x.id !== id; });
    if (coll === 'sucursales') N().recepcionistas = N().recepcionistas.filter(function (r) { return r.sucursalId !== id; });
    C.set();
  };
  NVAL.sucursales = function () {
    const err = {};
    if (!N().sucursales.length) err.sucs = (C.ui.draft.dir ? 'Toca “+ Agregar sucursal” para sumar la que escribiste' : 'Agrega al menos una sucursal');
    return err;
  };

  NV.recepcionistas = function (i) {
    const n = N(), c = n.contacto;
    // Igual que en el registro del cliente: si el contacto es Recepcionista, se propone como tal
    if (c.rol === 'Recepcionista' && !n.recepcionistas.length && n.sucursales.length) {
      n.recepcionistas.push({ id: C.uid('r'), nombre: (c.nombre + ' ' + c.apellido).trim(), tel: c.wa.replace('+591 ', ''), sucursalId: n.sucursales[0].id });
      C.save();
    }
    if (!C.ui.draft.hasOwnProperty('sucursalId')) C.ui.draft = { sucursalId: (n.sucursales[0] || {}).id || '', nombre: '', tel: '' };
    const groups = n.sucursales.map(function (s) {
      const rs = n.recepcionistas.filter(function (r) { return r.sucursalId === s.id; });
      return '<section class="pn-group"><h3 class="pn-group-t">' + C.icon('pin', 16) + e(s.dir) + ' <span class="muted">· ' + e(s.ciudad) + '</span></h3>' +
        (rs.length ? rs.map(function (r) { return '<div class="pn-line"><span><strong>' + e(r.nombre) + '</strong> · ' + e(r.tel) + '</span>' + C.link('Quitar', 'pnNRemove', 'recepcionistas:' + r.id) + '</div>'; }).join('')
          : '<p class="pn-warn">' + C.icon('alert', 16) + ' Falta quién recibe en esta sucursal. ' + C.link('El contacto principal recibe aquí', 'pnNContactoRec', s.id) + '</p>') + '</section>';
    }).join('');
    return nPage(i, '<h1 class="h1 wz-title">¿Quién recibe en cada sucursal?</h1>' +
      '<div class="field' + C.errCls('recs') + '">' + groups + C.err('recs') + '</div>' +
      '<section class="card card-pad mt-16"><h2 class="h3">Agregar recepcionista</h2><div class="mt-16">' + recFields(n) + '</div><div class="form-actions">' + C.btn('+ Agregar recepcionista', { action: 'pnNAddRec' }) + '</div></section>');
  };
  A.pnNAddRec = function () {
    const d = C.ui.draft, err = {};
    if (!d.sucursalId) err['ui.draft.sucursalId'] = 'Elige la sucursal';
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if ((d.tel || '').replace(/\D/g, '').length < 7) err['ui.draft.tel'] = 'Escribe un teléfono válido';
    if (Object.keys(err).length) return C.fail(err);
    N().recepcionistas.push({ id: C.uid('r'), nombre: d.nombre.trim(), tel: d.tel.trim(), sucursalId: d.sucursalId });
    C.ui.draft = { sucursalId: d.sucursalId, nombre: '', tel: '' }; delete C.ui.errors.recs;
    C.set(); C.toast('Recepcionista agregado');
  };
  A.pnNContactoRec = function (el) {
    const c = N().contacto;
    N().recepcionistas.push({ id: C.uid('r'), nombre: (c.nombre + ' ' + c.apellido).trim(), tel: c.wa.replace('+591 ', ''), sucursalId: el.dataset.arg });
    delete C.ui.errors.recs; C.set();
  };
  NVAL.recepcionistas = function () {
    const n = N(), sin = n.sucursales.filter(function (s) { return !n.recepcionistas.some(function (r) { return r.sucursalId === s.id; }); });
    return sin.length ? { recs: 'Cada sucursal necesita al menos un recepcionista (' + sin.map(function (s) { return s.dir; }).join(', ') + ')' } : {};
  };

  NV.credito = function (i) {
    const cr = N().credito, c = N().contacto, fj = N().fj;
    const opts = '<div class="choice-grid cols-2 focus-target" tabindex="-1">' +
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
        '<section class="card card-pad pn-contract"><h2 class="h3">Vista previa del contrato</h2><div class="contract-body contract-body-sm" id="pn-contrato">' + C.contratoPanel({ tipo: fj.tipo, ci: fj.ci, razon: fj.razon, nit: fj.nit, empresa: c.empresa, linea: cr.linea, plazo: cr.plazo }) + '</div>' +
        '<p class="hint">El cliente lo firma en su primera compra con crédito.</p></section></div>';
    }
    return nPage(i, '<div class="row wz-title-row"><h1 class="h1">Crédito y contrato</h1><span class="tag">Opcional</span></div><p class="lead">El contrato se aplica cuando otra persona aprueba el alta.</p>' +
      '<div class="field mt-24' + C.errCls('con') + '">' + opts + C.err('con') + '</div>' + body);
  };
  C.live.pnContrato = function () {
    const el = document.getElementById('pn-contrato'), n = N();
    if (el) el.innerHTML = C.contratoPanel({ tipo: n.fj.tipo, ci: n.fj.ci, razon: n.fj.razon, nit: n.fj.nit, empresa: n.contacto.empresa, linea: n.credito.linea, plazo: n.credito.plazo });
  };
  A.pnNCred = function (el) { C.set(function (S) { S.panel.nueva.credito.con = el.dataset.arg; C.ui.errors = {}; }); };
  NVAL.credito = function () {
    const cr = N().credito, err = {};
    if (!cr.con) err.con = 'Elige si la cuenta tendrá crédito';
    if (cr.con === 'si') {
      if (!(Number(cr.linea) > 0)) err['panel.nueva.credito.linea'] = 'Escribe la línea aprobada';
      C.DOC_KEYS.forEach(function (k) { if (!cr.docs[k].length) err['panel.nueva.credito.docs.' + k] = 'Falta este documento'; });
    }
    return err;
  };

  NV.usuarios = function (i) {
    const n = N();
    if (!C.ui.draft.hasOwnProperty('email')) C.ui.draft = { nombre: '', apellido: '', rol: '', email: '', wa: '' };
    const list = '<div class="pn-line is-principal"><span>' + avatar(n.contacto.nombre + ' ' + n.contacto.apellido, 'is-sm') + '<strong>' + e((n.contacto.nombre + ' ' + n.contacto.apellido).trim()) + '</strong> · ' + e(n.contacto.rol) + ' · ' + e(n.contacto.email) + '</span>' + badge('Principal', 'neutral') + '</div>' +
      n.usuarios.map(function (u) { return '<div class="pn-line"><span>' + avatar(fullName(u), 'is-sm') + '<strong>' + e(fullName(u)) + '</strong> · ' + e(u.rol) + ' · ' + e(u.email) + '</span>' + C.link('Quitar', 'pnNRemove', 'usuarios:' + u.id) + '</div>'; }).join('');
    return nPage(i, '<div class="row wz-title-row"><h1 class="h1">Usuarios de la empresa</h1><span class="tag">Opcional</span></div><p class="lead">Cada usuario recibe una invitación y ve la misma información de la empresa.</p>' +
      '<div class="mt-24">' + list + '</div><section class="card card-pad mt-16"><h2 class="h3">Agregar usuario</h2><div class="mt-16">' + userFields() + '</div><div class="form-actions">' + C.btn('+ Agregar usuario', { action: 'pnNAddUser' }) + '</div></section>');
  };
  A.pnNAddUser = function () {
    const d = C.ui.draft, err = validUser(d);
    if (Object.keys(err).length) return C.fail(err);
    N().usuarios.push({ id: C.uid('e'), nombre: d.nombre.trim(), apellido: (d.apellido || '').trim(), rol: d.rol, email: d.email.trim(), wa: d.wa.trim() });
    C.ui.draft = { nombre: '', apellido: '', rol: '', email: '', wa: '' };
    C.set(); C.toast('Usuario agregado');
  };
  NVAL.usuarios = function () { return {}; };

  function nuevaEmpresa() {
    const n = N(), id = C.uid('emp'), now = C.nowISO();
    return {
      id: id, estado: 'pendiente_alta', origen: 'vendedor', creadoPor: C.persona().nombre, creado: now, actualizado: now,
      empresa: n.contacto.empresa.trim(),
      user: { nombre: n.contacto.nombre.trim(), apellido: n.contacto.apellido.trim(), rol: n.contacto.rol, email: n.contacto.email.trim(), wa: n.contacto.wa.trim() },
      formaJuridica: C.clone(n.fj), sucursales: C.clone(n.sucursales), recepcionistas: C.clone(n.recepcionistas), empleados: C.clone(n.usuarios),
      credito: n.credito.con === 'si' ? { estado: 'aprobado', linea: Number(n.credito.linea), plazo: Number(n.credito.plazo), usado: 0, docs: C.clone(n.credito.docs) } : { estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.emptyDocs() },
      pedidos: [], nextPedido: 6001
    };
  }
  NV.revisar = function (i) {
    const preview = nuevaEmpresa();
    const edit = function (step) { return C.link('Editar', 'pnNTab', NUEVA_STEPS.indexOf(step)); };
    const html = '<h1 class="h1 wz-title">Revisa y envía el alta</h1><p class="lead">La cuenta se crea cuando otra persona la aprueba. Hasta entonces, el cliente no puede entrar.</p>' +
      '<div class="pn-review-steps mt-24">' +
      [['contacto', 'Contacto principal'], ['legal', 'Forma jurídica'], ['sucursales', 'Sucursales'], ['recepcionistas', 'Recepcionistas'], ['credito', 'Crédito y contrato'], ['usuarios', 'Usuarios']].map(function (s) {
        let body = '';
        if (s[0] === 'contacto') body = '<strong>' + e(preview.empresa) + '</strong><br>' + e(fullName(preview.user)) + ' · ' + e(preview.user.rol) + '<br><span class="muted">' + e(preview.user.email) + ' · ' + e(preview.user.wa) + '</span>';
        if (s[0] === 'legal') body = legalView(preview);
        if (s[0] === 'sucursales') body = preview.sucursales.map(function (x) { return e(x.dir) + ' · ' + e(x.ciudad); }).join('<br>');
        if (s[0] === 'recepcionistas') body = preview.recepcionistas.map(function (r) { const su = preview.sucursales.find(function (x) { return x.id === r.sucursalId; }); return '<strong>' + e(r.nombre) + '</strong> · ' + e(r.tel) + ' <span class="muted">(' + e(su ? su.dir : '') + ')</span>'; }).join('<br>');
        if (s[0] === 'credito') body = preview.credito.estado === 'aprobado' ? 'Línea ' + C.bs(preview.credito.linea) + ' · ' + preview.credito.plazo + ' días · documentos completos' : 'Sin crédito';
        if (s[0] === 'usuarios') body = preview.empleados.length ? preview.empleados.map(function (u) { return e(fullName(u)) + ' · ' + e(u.rol); }).join('<br>') : '<span class="muted">Solo el contacto principal</span>';
        return '<section class="card card-pad sum-card"><div class="row-between"><h2 class="h3">' + s[1] + '</h2>' + edit(s[0]) + '</div><div class="pn-sum-body">' + body + '</div></section>';
      }).join('') + '</div>' +
      '<section class="card card-strong card-pad mt-24"><h2 class="h3">Enviar a aprobación</h2><div class="form-grid mt-16">' + approverField('panel.nueva.revisor') +
      C.field({ label: 'Nota para quien aprueba', bind: 'panel.nueva.nota', err: 'nota', placeholder: 'Ej. Cliente captado en visita; documentos revisados.' }) + '</div>' +
      '<div class="mt-16">' + C.checkbox({ bind: 'panel.nueva.notificar', label: 'Enviar correo de bienvenida al cliente cuando se apruebe <span class="muted small">(' + e(preview.user.email) + ')</span>' }) + '</div></section>';
    return nPage(i, html, C.btn('Enviar a aprobación', { primary: true, action: 'pnNSubmit' }));
  };
  A.pnNSubmit = function () {
    const n = N(), err = {};
    if (!n.revisor) err.revisor = 'Elige quién aprueba';
    if (n.nota.trim().length < 5) err.nota = 'Escribe una nota breve (queda en el registro)';
    if (Object.keys(err).length) return C.fail(err);
    const emp = nuevaEmpresa();
    C.S.empresas[emp.id] = emp;
    const req = { id: P().nextReq++, tipo: 'alta', empresaId: emp.id, empresaNombre: emp.empresa, autor: P().persona, revisor: n.revisor, estado: 'pendiente', fecha: emp.creado, notificar: !!n.notificar, nota: n.nota.trim(), ops: [] };
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
    return '<div class="acting" role="status"><span>' + C.icon('store', 18) + '<span><strong>Modo vendedor</strong> · ' + e(a.seller) + ' compra para <strong>' + e(emp ? emp.empresa : '') + '</strong></span></span>' +
      '<button type="button" class="btn btn-sm" data-action="actingExit">Volver al panel</button></div>';
  };
  A.actingExit = function () {
    const a = C.S.acting; if (!a) return;
    C.S.activeEmpresa = a.prevActive; C.S.session.loggedIn = a.prevLogged; C.S.cart = a.prevCart || C.emptyCart();
    C.S.acting = null; C.save();
    location.hash = a.back;
  };
})();
