/* =========================================================
   PANEL DE VENDEDORES
   Empresas · Ficha (todo editable, en modales) · Registro de
   cambios (con "Revertir") · Nueva cuenta (wizard) · Equipo ·
   Modo vendedor (comprar por el cliente)

   Lógica de confianza: el vendedor guarda y el cambio se aplica
   al instante. Se avisa al resto del equipo y queda en el
   registro; cualquier otro vendedor puede revertirlo.
   Crédito: el vendedor puede cargar los documentos y enviar la
   solicitud al cliente (correo y WhatsApp). La firma electrónica
   y la autorización las hace siempre el cliente desde su dispositivo.
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
  const joinY = function (a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : (a[0] || ''); };
  function guard() { return P().loggedIn ? null : { redirect: '/panel/login' }; }
  function usersOf(emp) { return [Object.assign({ id: 'principal', principal: true }, emp.user)].concat(emp.empleados || []); }
  function others() { return P().equipo.filter(function (p) { return p.id !== P().persona; }); }
  function avisados() { return joinY(others().map(function (p) { return p.nombre.split(' ')[0]; })); }

  /* ---------- registro y novedades ---------- */
  function seenList() { const s = P().seen || (P().seen = {}); return s[P().persona] || (s[P().persona] = []); }
  function unseen() { const seen = seenList(); return P().log.filter(function (l) { return l.actor !== P().persona && seen.indexOf(l.id) < 0; }); }
  function addLog(entry) {
    entry.id = C.uid('l'); entry.fecha = entry.fecha || C.nowISO(); entry.actor = entry.actor || P().persona;
    P().log.unshift(entry); seenList().push(entry.id);
    return entry;
  }
  /* Aplica el cambio al instante, guarda el "antes" y avisa al equipo */
  function commit(empId, ops, texto) {
    const emp = C.empresa(empId);
    const full = C.withBefore(emp, ops);
    C.applyOps(emp, full);
    emp.actualizado = C.nowISO();
    addLog({ accion: 'cambio', empresaId: empId, texto: texto, ops: full });
    C.save();
    C.toast('Guardado · avisamos a ' + avisados());
  }

  /* ---------- Layout del panel ---------- */
  const NAV = [
    { id: 'empresas', label: 'Empresas', icon: 'building', href: '#/panel/empresas' },
    { id: 'nueva', label: 'Nueva cuenta', short: 'Nueva', icon: 'plus', href: '#/panel/nueva/contacto' },
    { id: 'registro', label: 'Registro de cambios', short: 'Registro', icon: 'history', href: '#/panel/registro' },
    { id: 'equipo', label: 'Equipo', icon: 'users', href: '#/panel/equipo' }
  ];
  C.layouts.panel = function (page) {
    const me = C.persona();
    const n = unseen().length;
    const nav = function (cls) {
      return NAV.map(function (i) {
        const on = page.nav === i.id;
        const count = i.id === 'registro' && n ? '<span class="pn-count">' + n + '</span>' : '';
        return '<a class="' + cls + (on ? ' is-active' : '') + '" href="' + i.href + '"' + (on ? ' aria-current="page"' : '') + '>' + C.icon(i.icon, 19) +
          '<span>' + (cls === 'pn-tab' ? (i.short || i.label) : i.label) + '</span>' + count + '</a>';
      }).join('');
    };
    const menu = C.ui.personaMenu
      ? '<div class="pn-menu-scrim" data-action="pnPersonaMenu"></div><div class="pn-menu" role="menu"><p class="eyebrow">Cambiar de perfil (demo)</p>' +
        P().equipo.map(function (p) {
          return '<button type="button" class="pn-menu-item' + (p.id === me.id ? ' is-on' : '') + '" role="menuitem" data-action="pnPersona" data-arg="' + p.id + '">' + avatar(p.nombre) + '<span><strong>' + e(p.nombre) + '</strong><span class="muted small">' + e(p.rol) + '</span></span></button>';
        }).join('') +
        '<hr class="divider"><button type="button" class="pn-menu-item" role="menuitem" data-action="pnLogout">' + C.icon('logout', 18) + '<span>Cerrar sesión</span></button></div>'
      : '';
    return '<div class="pn">' +
      '<header class="pn-top"><a class="pn-brand" href="#/panel/empresas"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="110" height="31"><span class="pn-brand-t">Panel de vendedores</span></a>' +
      '<div class="pn-top-right"><a class="pn-bell" href="#/panel/registro" aria-label="Cambios nuevos del equipo: ' + n + '">' + C.icon('bell', 20) + (n ? '<span class="pn-dot">' + n + '</span>' : '') + '</a>' +
      '<button type="button" class="pn-persona" data-action="pnPersonaMenu" aria-haspopup="menu" aria-expanded="' + !!C.ui.personaMenu + '" aria-label="Perfil: ' + e(me.nombre) + '">' + avatar(me.nombre) +
      '<span class="pn-persona-t"><strong>' + e(me.nombre) + '</strong><span>' + e(me.rol) + '</span></span>' + C.icon('chevDown', 16) + '</button>' + menu + '</div></header>' +
      '<div class="pn-body"><aside class="pn-side" aria-label="Navegación del panel"><nav class="pn-nav">' + nav('pn-link') + '</nav></aside>' +
      '<main class="pn-main" id="main"><div class="pn-content' + (page.narrow ? ' is-narrow' : '') + '">' + page.html + '</div></main></div>' +
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
        '<p class="muted">Crea y administra cuentas de clientes.</p>' +
        '<div class="stack mt-24">' +
        C.field({ label: 'Correo de Cooltiva', bind: 'ui.draft.email', type: 'email', placeholder: 'nombre@cooltiva.bo', autocomplete: 'username' }) +
        C.field({ label: 'Contraseña', bind: 'ui.draft.pass', type: 'password', autocomplete: 'current-password' }) +
        C.selectField({ label: 'Perfil (solo para el demo)', bind: 'ui.draft.persona', options: P().equipo.map(function (p) { return { value: p.id, label: p.nombre + ' · ' + p.rol }; }) }) +
        C.btn('Entrar al panel', { primary: true, block: true, action: 'pnLogin' }) + '</div></section></div>'
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
  function activas() { return Object.keys(C.S.empresas).map(function (k) { return C.S.empresas[k]; }).filter(function (x) { return x.estado !== 'baja'; }); }
  function empBadge(emp) {
    const nuevos = unseen().filter(function (l) { return l.empresaId === emp.id; }).length;
    return nuevos ? badge('Cambios nuevos', 'draft') : '';
  }
  function empresaList() {
    const q = (C.ui.draft.q || '').toLowerCase().trim();
    const list = activas().filter(function (emp) {
      if (!q) return true;
      return [emp.empresa, emp.formaJuridica.razon, emp.formaJuridica.nit].concat(usersOf(emp).map(function (u) { return fullName(u) + ' ' + u.email; })).join(' ').toLowerCase().indexOf(q) > -1;
    }).sort(function (a, b) { return (b.actualizado || '').localeCompare(a.actualizado || ''); });
    if (!list.length) return '<div class="empty"><p class="h3">No hay empresas que coincidan</p></div>';
    return list.map(function (emp) {
      const rows = usersOf(emp).map(function (u) {
        return '<tr data-action="pnGoUser" data-arg="' + emp.id + '|' + u.id + '" tabindex="0" role="link"><td data-label="Usuario"><span class="pn-user">' + avatar(fullName(u) || u.email, 'is-sm') + '<strong>' + e(fullName(u) || 'Sin nombre') + '</strong>' + (u.principal ? badge('Principal', 'neutral') : '') + '</span></td>' +
          '<td data-label="Rol">' + e(u.rol || '—') + '</td><td data-label="Correo">' + e(u.email || '—') + '</td><td data-label="WhatsApp">' + e(u.wa || '—') + '</td></tr>';
      }).join('');
      return '<section class="pn-emp card"><header class="pn-emp-head" data-action="pnGo" data-arg="/panel/empresa/' + emp.id + '/usuarios" role="link" tabindex="0">' +
        '<div class="pn-emp-id">' + avatar(emp.empresa, 'is-sq') + '<h2 class="h3">' + e(emp.empresa) + '</h2>' + empBadge(emp) + '</div>' +
        '<span class="pn-emp-chev" aria-hidden="true">' + C.icon('chevRight', 20) + '</span></header>' +
        '<table class="pn-table pn-users"><thead><tr><th>Usuario</th><th>Rol</th><th>Correo</th><th>WhatsApp</th></tr></thead><tbody>' + rows + '</tbody></table></section>';
    }).join('');
  }
  C.live.pnFilter = function () { const l = document.getElementById('pn-list'); if (l) l.innerHTML = empresaList(); };

  C.route('/panel/empresas', function () {
    const g = guard(); if (g) return g;
    const N = P().nueva;
    const draftBanner = N.maxStep > 0
      ? '<div class="pn-banner"><span>' + C.icon('edit', 18) + '<span>Cuenta a medio crear: <strong>' + e(N.contacto.empresa || 'Sin nombre') + '</strong></span></span><a class="btn btn-sm" href="#/panel/nueva/' + NUEVA_STEPS[Math.min(N.maxStep, NUEVA_STEPS.length - 1)] + '">Continuar</a></div>' : '';
    const html = '<div class="pn-head"><h1 class="h1">Empresas</h1><a class="btn btn-primary" href="#/panel/nueva/contacto">' + C.icon('plus', 18) + '<span>Nueva cuenta</span></a></div>' + draftBanner +
      '<label class="pn-search">' + C.icon('search', 18) + '<span class="sr-only">Buscar</span><input class="input" type="search" placeholder="Buscar empresa o usuario" data-bind="ui.draft.q" data-live="pnFilter" value="' + e(C.ui.draft.q || '') + '"></label>' +
      '<div id="pn-list" class="pn-list">' + empresaList() + '</div>';
    return { layout: 'panel', nav: 'empresas', title: 'Empresas', html: html };
  });
  /* Tocar un usuario abre su ficha con el modal de edición */
  A.pnGoUser = function (el) {
    const a = el.dataset.arg.split('|');
    C._after = function () { openModal('user', a[1], { empId: a[0] }); };
    C.go('/panel/empresa/' + a[0] + '/usuarios');
  };

  /* ======================= FICHA DE EMPRESA ======================= */
  const TABS = [['usuarios', 'Usuarios'], ['legal', 'Datos legales'], ['sucursales', 'Sucursales'], ['recepcionistas', 'Recepcionistas'], ['credito', 'Crédito'], ['pedidos', 'Pedidos'], ['historial', 'Historial']];
  const secHead = function (title, btn) { return '<div class="pn-sec-head"><h2 class="h2">' + title + '</h2>' + (btn || '') + '</div>'; };
  const editDel = function (kind, id, canDelete) { return C.link('Editar', 'pmOpen', kind + ':' + id) + (canDelete ? C.link('Eliminar', 'pmAskDelete', kind + ':' + id) : ''); };

  function tabUsuarios(id, v) {
    const rows = usersOf(v).map(function (u) {
      return '<tr><td data-label="Usuario"><span class="pn-user">' + avatar(fullName(u) || u.email, 'is-sm') + '<strong>' + e(fullName(u) || 'Sin nombre') + '</strong>' + (u.principal ? badge('Principal', 'neutral') : '') + '</span></td>' +
        '<td data-label="Rol">' + e(u.rol || '—') + '</td><td data-label="Correo">' + e(u.email || '—') + '</td><td data-label="WhatsApp">' + e(u.wa || '—') + '</td>' +
        '<td class="pn-td-actions">' + editDel('user', u.id, !u.principal) + '</td></tr>';
    }).join('');
    return secHead('Usuarios', C.btn('+ Agregar usuario', { action: 'pmOpen', arg: 'user:new' })) +
      '<table class="pn-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Correo</th><th>WhatsApp</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  function legalView(v) {
    const fj = v.formaJuridica, f = C.FORMAS_JURIDICAS.find(function (x) { return x.id === fj.tipo; });
    const rows = [['Nombre comercial', v.empresa], ['Forma jurídica', f ? f.label : '—']].concat(fj.tipo === 'natural' ? [['CI', fj.ci]] : [['Razón social', fj.razon], ['NIT', fj.nit], ['Matrícula de comercio', fj.matricula]]);
    return '<dl class="pn-dl">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + e(r[1] || '—') + '</dd></div>'; }).join('') + '</dl>';
  }
  function tabLegal(id, v) {
    return secHead('Datos legales', C.btn('Editar', { action: 'pmOpen', arg: 'legal:x', icon: 'edit' })) + '<div class="card card-pad">' + legalView(v) + '</div>';
  }
  function tabSucursales(id, v) {
    return secHead('Sucursales', C.btn('+ Agregar sucursal', { action: 'pmOpen', arg: 'suc:new' })) +
      '<div class="pn-grid">' + v.sucursales.map(function (s) {
        const n = v.recepcionistas.filter(function (r) { return r.sucursalId === s.id; }).length;
        return '<article class="card pn-suc"><div class="pn-suc-map">' + C.map({ small: true, pin: s.pin }) + '</div>' +
          '<div class="pn-suc-body"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span><span class="muted small">' + n + (n === 1 ? ' recepcionista' : ' recepcionistas') + '</span>' +
          '<div class="item-actions">' + editDel('suc', s.id, true) + '</div></div></article>';
      }).join('') + '</div>' + (v.sucursales.length ? '' : '<div class="empty"><p class="h3">Sin sucursales</p></div>');
  }
  function tabRecepcionistas(id, v) {
    if (!v.sucursales.length) return secHead('Recepcionistas') + '<div class="empty"><p class="h3">Primero agrega una sucursal</p></div>';
    return secHead('Recepcionistas', C.btn('+ Agregar recepcionista', { action: 'pmOpen', arg: 'rec:new' })) +
      v.sucursales.map(function (s) {
        const rs = v.recepcionistas.filter(function (r) { return r.sucursalId === s.id; });
        return '<section class="pn-group"><h3 class="pn-group-t">' + C.icon('pin', 16) + '<span>' + e(s.dir) + ' <span class="muted">· ' + e(s.ciudad) + '</span></span>' + C.link('+ Agregar aquí', 'pmOpen', 'rec:new:' + s.id) + '</h3>' +
          (rs.length ? '<table class="pn-table"><tbody>' + rs.map(function (r) {
            return '<tr><td data-label="Nombre"><strong>' + e(r.nombre) + '</strong></td><td data-label="Teléfono">' + e(r.tel || '—') + '</td><td class="pn-td-actions">' + editDel('rec', r.id, true) + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="pn-warn">' + C.icon('alert', 16) + ' Sin recepcionista: el cliente no podrá elegir quién recibe.</p>') + '</section>';
      }).join('');
  }

  /* Contrato (solo lectura en el panel) */
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
      const one = {}; one[k] = f;
      const por = C.docsPor(one);
      return '<li class="' + (f.length ? 'is-ok' : 'is-missing') + '"><span class="pn-doc-mark" aria-hidden="true">' + C.icon(f.length ? 'check' : 'x', 13) + '</span><span><strong>' + C.DOC_LABELS[k] + '</strong><span class="muted small">' +
        (f.length ? e(f.map(function (x) { return x.name; }).join(', ')) + (por.length ? ' · cargado por ' + e(por.join(', ')) : '') : 'Falta') + '</span></span></li>';
    }).join('') + '</ul>';
  }
  function tabCredito(id, v) {
    const c = v.credito, fase = C.creditoFase(c);
    const note = '<p class="hint mt-8">Puedes cargar sus documentos. La firma electrónica y la autorización las hace el cliente desde su celular o PC.</p>';
    if (c.estado === 'aprobado') {
      return secHead('Crédito') + '<div class="pn-credit"><section class="card card-pad"><div class="row-between"><h3 class="h3">Condiciones</h3>' + badge('Aprobado', 'ok') + '</div>' +
        '<dl class="pn-kpis"><div><dt>Línea</dt><dd>' + C.bs(c.linea) + '</dd></div><div><dt>Plazo</dt><dd>' + c.plazo + ' días</dd></div><div><dt>Disponible</dt><dd>' + C.bs(c.linea - (c.usado || 0)) + '</dd></div></dl></section>' +
        '<section class="card card-pad pn-contract"><div class="row-between"><h3 class="h3">Contrato</h3>' + badge('Firmado por el cliente', 'neutral') + '</div><div class="contract-body contract-body-sm">' +
        C.contratoPanel({ tipo: v.formaJuridica.tipo, ci: v.formaJuridica.ci, razon: v.formaJuridica.razon, nit: v.formaJuridica.nit, empresa: v.empresa, linea: c.linea, plazo: c.plazo }) + '</div>' +
        C.btn('Descargar contrato', { block: true, icon: 'download', action: 'downloadContract' }) + '</section></div>';
    }
    if (c.estado === 'solicitado') {
      return secHead('Crédito') + '<section class="card card-pad"><div class="row-between"><h3 class="h3">Solicitud del cliente</h3>' + badge('En revisión', 'pending') + '</div>' +
        '<p class="muted mt-8">Firmada y enviada por el cliente desde su dispositivo el ' + fmtDT(c.solicitado) + '.' + (c.asistido && c.asistido.length ? ' Documentos cargados con ayuda de ' + e(joinY(c.asistido)) + '.' : '') + '</p>' + docsList(c.docs) + '</section>';
    }
    /* Sin crédito · En preparación · Pendiente de firma */
    const n = C.docsCount(c.docs), inv = c.invitado, env = c.enviadoFirma;
    const BADGE = { no: ['Sin iniciar', 'neutral'], preparacion: ['En preparación', 'draft'], firma: ['Pendiente de firma', 'pending'] }[fase];
    let msg = '', actions = '';
    if (fase === 'firma') {
      msg = 'Se la enviamos para firmar el ' + fmtDT(env.fecha) + ' (' + e(env.por) + '), por correo y WhatsApp. Falta que el cliente ' + (n < C.DOC_KEYS.length ? 'suba lo que falta, ' : '') + 'firme y envíe desde su dispositivo.';
      actions = C.btn('Editar documentos', { icon: 'edit', action: 'pmOpen', arg: 'creddocs:x' }) + C.btn('Reenviar aviso', { icon: 'msg', action: 'pmOpen', arg: 'firma:x' });
    } else if (fase === 'preparacion') {
      msg = n + ' de ' + C.DOC_KEYS.length + ' documentos cargados. Cuando quieras, envíasela al cliente para que firme; lo que falte lo puede subir él.';
      actions = C.btn('Enviar al cliente para firmar', { primary: true, icon: 'msg', action: 'pmOpen', arg: 'firma:x' }) + C.btn('Editar documentos', { icon: 'edit', action: 'pmOpen', arg: 'creddocs:x' });
    } else {
      msg = inv ? 'Le pedimos que lo solicite el ' + fmtDT(inv.fecha) + ' (' + e(inv.por) + '), por correo y WhatsApp.' : 'El cliente todavía no tiene Crédito Cooltiva. Puedes ayudarle cargando sus documentos, o pedirle que lo haga él.';
      actions = C.btn('Cargar sus documentos', { primary: true, icon: 'upload', action: 'pmOpen', arg: 'creddocs:x' }) + C.btn(inv ? 'Volver a pedírselo' : 'Pedir que lo haga él', { icon: 'msg', action: 'pmOpen', arg: 'invite:x' });
    }
    return secHead('Crédito') + '<section class="card card-pad"><div class="row-between"><h3 class="h3">Solicitud de crédito</h3>' + badge(BADGE[0], BADGE[1]) + '</div>' +
      '<p class="muted mt-8">' + msg + '</p>' + (fase === 'no' ? '' : docsList(c.docs)) +
      '<div class="pn-credit-actions mt-16">' + actions + '</div></section>' + note;
  }

  function tabPedidos(id, v) {
    const list = v.pedidos.slice().sort(function (a, b) { return b.creado.localeCompare(a.creado); });
    const head = secHead('Pedidos', C.btn('Hacer pedido para el cliente', { primary: true, icon: 'store', action: 'pnActAs', arg: id }));
    if (!list.length) return head + '<div class="empty"><p class="h3">Sin pedidos todavía</p></div>';
    return head + '<table class="pn-table"><thead><tr><th>Pedido</th><th>Entrega</th><th>Pago</th><th class="ta-r">Total</th></tr></thead><tbody>' +
      list.map(function (o) {
        return '<tr><td data-label="Pedido"><strong>#' + o.id + '</strong>' + (o.porVendedor ? badge('Vendedor', 'neutral') : '') + '<span class="muted small pn-sub">' + e(o.items.map(function (i) { return i.name + ' ' + i.qty; }).join(' · ')) + '</span></td>' +
          '<td data-label="Entrega">' + C.fmtDay(o.entregaFecha) + ' · ' + e(o.franja) + '</td><td data-label="Pago">' + e(o.pago) + '</td><td data-label="Total" class="ta-r"><strong>' + C.bs(o.total) + '</strong></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function tabHistorial(id) {
    const list = P().log.filter(function (l) { return l.empresaId === id; });
    return secHead('Historial') + (list.length ? '<div class="pn-feed">' + list.map(function (l) { return entryCard(l, false, {}); }).join('') + '</div>' : '<p class="muted">Sin movimientos.</p>');
  }

  C.route('/panel/empresa/:id/:tab', function (params) {
    const g = guard(); if (g) return g;
    const v = C.empresa(params.id);
    if (!v) return { redirect: '/panel/empresas' };
    const tab = TABS.some(function (t) { return t[0] === params.tab; }) ? params.tab : 'usuarios';
    const tabs = TABS.map(function (t) {
      const on = t[0] === tab;
      return '<a class="pn-tabs-a' + (on ? ' is-active' : '') + '" href="#/panel/empresa/' + params.id + '/' + t[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
    }).join('');
    if (v.estado === 'baja') {
      return { layout: 'panel', nav: 'empresas', title: v.empresa, html: '<nav class="pn-crumbs"><a href="#/panel/empresas">' + C.icon('arrowLeft', 16) + ' Empresas</a></nav><h1 class="h1">' + e(v.empresa) + '</h1><div class="pn-banner is-alert mt-16">' + C.icon('alert', 18) + '<span>Se revirtió la creación de esta cuenta. Ya no aparece en Empresas.</span></div>' };
    }
    const body = { usuarios: tabUsuarios, legal: tabLegal, sucursales: tabSucursales, recepcionistas: tabRecepcionistas, credito: tabCredito, pedidos: tabPedidos, historial: tabHistorial }[tab](params.id, v);
    const html = (C.ui.flash ? '<div class="pn-banner is-sent">' + C.icon('check', 18) + '<span>' + e(C.ui.flash) + '</span></div>' : '') +
      '<nav class="pn-crumbs" aria-label="Ruta"><a href="#/panel/empresas">' + C.icon('arrowLeft', 16) + ' Empresas</a></nav>' +
      '<header class="pn-emp-hero"><div class="pn-emp-id">' + avatar(v.empresa, 'is-sq is-lg') + '<h1 class="h1">' + e(v.empresa) + '</h1>' + empBadge(v) + '</div>' +
      '<div class="pn-hero-actions">' + C.btn('Hacer pedido', { icon: 'store', action: 'pnActAs', arg: params.id }) + '</div></header>' +
      '<nav class="pn-tabs" aria-label="Secciones de la empresa">' + tabs + '</nav><div class="pn-tab-body">' + body + '</div>';
    return { layout: 'panel', nav: 'empresas', title: v.empresa, html: html };
  });

  /* ======================= MODAL DEL PANEL (agregar / editar) ======================= */
  function scope() {
    const p = C.currentPath();
    if (p.indexOf('/panel/nueva') === 0) return 'nueva';
    if (p.indexOf('/panel/equipo') === 0) return 'equipo';
    const m = p.match(/^\/panel\/empresa\/([^/]+)/);
    return m ? m[1] : null;
  }
  const N = function () { return P().nueva; };
  /* fuente de datos del modal: una empresa, el alta en curso o el equipo */
  function src(sc) { return sc === 'nueva' ? { sucursales: N().sucursales, recepcionistas: N().recepcionistas } : C.empresa(sc); }

  function openModal(kind, id, opts) {
    opts = opts || {};
    const sc = opts.empId || scope(), s = sc === 'equipo' ? null : src(sc);
    C.ui.errors = {};
    C.ui.pnModal = { kind: kind, id: id, sc: sc };
    if (kind === 'user') {
      const u = id === 'new' ? null : usersOf(s).find(function (x) { return x.id === id; });
      C.ui.draft = u ? C.clone(u) : { nombre: '', apellido: '', rol: '', email: '', wa: '' };
    } else if (kind === 'legal') C.ui.draft = Object.assign({ empresa: s.empresa }, C.clone(s.formaJuridica));
    else if (kind === 'suc') {
      const it = id === 'new' ? null : s.sucursales.find(function (x) { return x.id === id; });
      C.ui.draft = it ? C.clone(it) : { dir: '', ciudad: '', pin: null };
    } else if (kind === 'rec') {
      const it = id === 'new' ? null : s.recepcionistas.find(function (x) { return x.id === id; });
      C.ui.draft = it ? C.clone(it) : { sucursalId: opts.sucId || (s.sucursales[0] || {}).id || '', nombre: '', tel: '' };
    } else if (kind === 'seller') {
      const p = id === 'new' ? null : P().equipo.find(function (x) { return x.id === id; });
      C.ui.draft = p ? C.clone(p) : { nombre: '', rol: 'Vendedor', email: '', wa: '' };
    } else if (kind === 'creddocs') C.ui.draft = { cdocs: C.clone(Object.assign(C.emptyDocs(), s.credito.docs || {})) };
    else if (kind === 'invite' || kind === 'firma') C.ui.draft = {};
    C.renderOverlays();
  }
  A.pmOpen = function (el) { const a = el.dataset.arg.split(':'); openModal(a[0], a[1], { sucId: a[2] }); };
  A.pmClose = function () { C.ui.pnModal = null; C.ui.errors = {}; C.renderOverlays(); };

  function sucFields() {
    return C.map({ interactive: true, action: 'pnMap', pin: C.ui.draft.pin }) + '<div class="form-grid mt-16">' +
      C.field({ label: 'Dirección', bind: 'ui.draft.dir', placeholder: 'Ej. Av. 6 de Agosto 1234' }) + C.field({ label: 'Ciudad', bind: 'ui.draft.ciudad', placeholder: 'Ej. La Paz' }) + '</div>';
  }
  A.pnMap = function (el, ev) {
    const g = C.geocodeFromClick(el, ev);
    C.ui.draft.pin = g.pin; C.ui.draft.dir = g.dir; C.ui.draft.ciudad = g.ciudad;
    delete C.ui.errors['ui.draft.dir']; delete C.ui.errors['ui.draft.ciudad'];
    C.renderOverlays();
  };
  A.pnFj = function (el) { C.ui.draft.tipo = el.dataset.arg; delete C.ui.errors.tipo; C.renderOverlays(); };

  C.renderPnModal = function () {
    const m = C.ui.pnModal, d = C.ui.draft, isNew = m.id === 'new';
    const s = m.sc === 'equipo' ? null : src(m.sc);
    let title = '', body = '', del = false, save = 'Guardar';
    if (m.kind === 'user') {
      title = isNew ? 'Nuevo usuario' : (m.id === 'principal' ? 'Contacto principal' : 'Editar usuario'); del = !isNew && m.id !== 'principal';
      body = '<div class="form-grid">' + C.field({ label: 'Nombre', bind: 'ui.draft.nombre' }) + C.field({ label: 'Apellido', bind: 'ui.draft.apellido' }) +
        C.selectField({ label: 'Rol', bind: 'ui.draft.rol', placeholder: 'Elegir rol', options: C.ROLES.map(function (r) { return { value: r, label: r }; }) }) +
        C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel', placeholder: '+591 7000 0000' }) +
        C.field({ label: 'Correo electrónico', bind: 'ui.draft.email', type: 'email', cls: 'span-2', placeholder: 'nombre@empresa.bo' }) + '</div>';
    } else if (m.kind === 'legal') {
      title = 'Datos legales';
      const cards = C.FORMAS_JURIDICAS.map(function (f) { return C.choice({ label: f.label, selected: d.tipo === f.id, action: 'pnFj', arg: f.id }); }).join('');
      body = '<div class="stack">' + C.field({ label: 'Nombre comercial', bind: 'ui.draft.empresa' }) +
        '<div class="field' + C.errCls('tipo') + '"><span class="label">Forma jurídica</span><div class="choice-grid cols-3">' + cards + '</div>' + C.err('tipo') + '</div>' +
        (d.tipo === 'natural' ? C.field({ label: 'CI', bind: 'ui.draft.ci' })
          : '<div class="form-grid">' + C.field({ label: 'Razón social', bind: 'ui.draft.razon', cls: 'span-2' }) + C.field({ label: 'NIT', bind: 'ui.draft.nit', inputmode: 'numeric' }) + C.field({ label: 'Matrícula de comercio', bind: 'ui.draft.matricula' }) + '</div>') + '</div>';
    } else if (m.kind === 'suc') {
      title = isNew ? 'Nueva sucursal' : 'Editar sucursal'; del = !isNew; body = sucFields();
    } else if (m.kind === 'rec') {
      title = isNew ? 'Nuevo recepcionista' : 'Editar recepcionista'; del = !isNew;
      body = '<div class="stack">' + C.selectField({ label: 'Sucursal', bind: 'ui.draft.sucursalId', placeholder: 'Elegir sucursal', options: s.sucursales.map(function (x) { return { value: x.id, label: C.sucLabel(x) }; }) }) +
        '<div class="form-grid">' + C.field({ label: 'Nombre recepcionista', bind: 'ui.draft.nombre' }) + C.field({ label: 'Teléfono recepcionista', bind: 'ui.draft.tel', inputmode: 'tel' }) + '</div></div>';
    } else if (m.kind === 'seller') {
      title = isNew ? 'Nuevo vendedor' : 'Editar vendedor';
      body = '<div class="form-grid">' + C.field({ label: 'Nombre y apellido', bind: 'ui.draft.nombre', cls: 'span-2' }) +
        C.field({ label: 'Correo de Cooltiva', bind: 'ui.draft.email', type: 'email' }) + C.field({ label: 'WhatsApp', bind: 'ui.draft.wa', type: 'tel' }) +
        C.field({ label: 'Cargo', bind: 'ui.draft.rol', cls: 'span-2' }) + '</div>';
    } else if (m.kind === 'invite') {
      title = 'Pedir al cliente que solicite su crédito'; save = 'Enviar';
      body = '<p>Le enviamos un enlace para que, desde su celular o PC, suba sus documentos y firme electrónicamente la solicitud.</p>' + paraRows(s);
    } else if (m.kind === 'creddocs') {
      title = 'Documentos para el crédito';
      body = '<p class="muted mb-12">Sube lo que tengas: lo que falte lo puede subir el cliente. La firma y la autorización las hace él desde su dispositivo.</p>' +
        '<div class="docs cred-docs-up">' + C.CREDITO_DOCS.map(function (x) { return C.uploadSlot({ path: 'ui.draft.cdocs.' + x.key, label: x.label, hint: x.hint, multiple: x.multiple, max: x.max, cta: x.cta, sub: x.sub }); }).join('') +
        '<div class="docs-full"><p class="upload-label">Carnet del representante legal</p><p class="hint">Cédula de Identidad, ambas caras</p><div class="docs-pair">' +
        C.uploadSlot({ path: 'ui.draft.cdocs.anverso', cta: 'Anverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) +
        C.uploadSlot({ path: 'ui.draft.cdocs.reverso', cta: 'Reverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) + '</div></div></div>';
    } else if (m.kind === 'firma') {
      const c = s.credito, faltan = C.DOC_KEYS.filter(function (k) { return !((c.docs || {})[k] || []).length; });
      title = c.enviadoFirma ? 'Reenviar aviso para firmar' : 'Enviar al cliente para firmar'; save = 'Enviar';
      body = '<p>Le llega un enlace por correo y WhatsApp. Desde su celular o PC revisa los documentos, firma con el dedo o el mouse y envía la solicitud.</p>' + paraRows(s) +
        (faltan.length ? '<p class="pn-warn mt-16">' + C.icon('alert', 16) + ' Faltan ' + faltan.length + ': ' + e(faltan.map(function (k) { return C.DOC_LABELS[k]; }).join(', ')) + '. El cliente los sube antes de firmar.</p>' : '');
    }
    return '<div class="overlay modal-overlay" data-action="pmClose"></div>' +
      '<div class="pmodal" role="dialog" aria-modal="true" aria-labelledby="pm-title">' +
      '<header class="pmodal-head"><h2 class="h2" id="pm-title">' + e(title) + '</h2><button type="button" class="icon-btn" aria-label="Cerrar" data-action="pmClose">' + C.icon('x', 20) + '</button></header>' +
      '<div class="pmodal-body">' + body + '</div>' +
      '<footer class="pmodal-foot"><div>' + (del ? C.link('Eliminar', 'pmAskDelete', m.kind + ':' + m.id) : '') + '</div><div class="pmodal-actions">' +
      C.btn('Cancelar', { action: 'pmClose' }) + C.btn(save, { primary: true, action: 'pmSave' }) + '</div></footer></div>';
  };
  function paraRows(s) {
    return '<dl class="pn-rows mt-16"><div><dt>Para</dt><dd>' + e(fullName(s.user)) + '</dd></div><div><dt>Correo</dt><dd>' + e(s.user.email || '—') + '</dd></div><div><dt>WhatsApp</dt><dd>' + e(s.user.wa || '—') + '</dd></div></dl>';
  }
  C.mountPnModal = function () {
    const f = document.querySelector('.pmodal .has-error input, .pmodal .has-error select');
    if (f) { f.focus(); return; }
    const first = document.querySelector('.pmodal input, .pmodal select');
    if (first && !document.querySelector('.pmodal').contains(document.activeElement)) first.focus({ preventScroll: true });
  };
  function modalFail(err) { C.ui.errors = err; C.renderOverlays(); return false; }

  function validUser(d) {
    const err = {};
    if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
    if (!d.rol) err['ui.draft.rol'] = 'Elige el rol';
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) err['ui.draft.email'] = 'Escribe un correo válido';
    if ((d.wa || '').replace(/\D/g, '').length < 8) err['ui.draft.wa'] = 'Escribe un WhatsApp válido';
    return err;
  }
  A.pmSave = function () {
    const m = C.ui.pnModal, d = C.ui.draft, isNew = m.id === 'new', sc = m.sc;
    let err = {};
    if (m.kind === 'user') {
      err = validUser(d); if (Object.keys(err).length) return modalFail(err);
      const val = { nombre: d.nombre.trim(), apellido: (d.apellido || '').trim(), rol: d.rol, email: d.email.trim(), wa: d.wa.trim() };
      if (m.id === 'principal') commit(sc, [{ op: 'set', path: 'user', value: val }], 'Editó el contacto principal');
      else if (isNew) commit(sc, [{ op: 'add', coll: 'empleados', item: Object.assign({ id: C.uid('e') }, val) }], 'Agregó un usuario');
      else commit(sc, [{ op: 'update', coll: 'empleados', id: m.id, value: val }], 'Editó un usuario');
    } else if (m.kind === 'legal') {
      if (!(d.empresa || '').trim()) err['ui.draft.empresa'] = 'Escribe el nombre comercial';
      if (!d.tipo) err.tipo = 'Elige la forma jurídica';
      else if (d.tipo === 'natural') { if (!(d.ci || '').trim()) err['ui.draft.ci'] = 'Escribe el CI'; }
      else {
        if (!(d.razon || '').trim()) err['ui.draft.razon'] = 'Escribe la razón social';
        if (!/^\d{6,}$/.test((d.nit || '').replace(/\s/g, ''))) err['ui.draft.nit'] = 'El NIT debe tener solo números';
        if (!(d.matricula || '').trim()) err['ui.draft.matricula'] = 'Escribe la matrícula';
      }
      if (Object.keys(err).length) return modalFail(err);
      const emp = C.empresa(sc), ops = [];
      if (d.empresa.trim() !== emp.empresa) ops.push({ op: 'set', path: 'empresa', value: d.empresa.trim() });
      const fj = d.tipo === 'natural' ? { tipo: 'natural', ci: d.ci.trim(), razon: '', nit: '', matricula: '' } : { tipo: d.tipo, ci: '', razon: d.razon.trim(), nit: d.nit.trim(), matricula: d.matricula.trim() };
      if (JSON.stringify(fj) !== JSON.stringify(emp.formaJuridica)) ops.push({ op: 'set', path: 'formaJuridica', value: fj });
      if (ops.length) commit(sc, ops, 'Editó los datos legales'); else C.toast('Sin cambios');
    } else if (m.kind === 'suc') {
      if (!(d.dir || '').trim()) err['ui.draft.dir'] = 'Escribe la dirección o toca el mapa';
      if (!(d.ciudad || '').trim()) err['ui.draft.ciudad'] = 'Escribe la ciudad';
      if (Object.keys(err).length) return modalFail(err);
      const val = { dir: d.dir.trim(), ciudad: d.ciudad.trim(), pin: d.pin || { x: 50, y: 50 } };
      if (sc === 'nueva') return saveNuevaSuc(isNew ? null : m.id, val);
      if (isNew) commit(sc, [{ op: 'add', coll: 'sucursales', item: Object.assign({ id: C.uid('s') }, val) }], 'Agregó una sucursal');
      else commit(sc, [{ op: 'update', coll: 'sucursales', id: m.id, value: val }], 'Editó una sucursal');
    } else if (m.kind === 'rec') {
      if (!d.sucursalId) err['ui.draft.sucursalId'] = 'Elige la sucursal';
      if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
      if ((d.tel || '').replace(/\D/g, '').length < 7) err['ui.draft.tel'] = 'Escribe un teléfono válido';
      if (Object.keys(err).length) return modalFail(err);
      const val = { nombre: d.nombre.trim(), tel: d.tel.trim(), sucursalId: d.sucursalId };
      if (sc === 'nueva') {
        if (isNew) N().recepcionistas.push(Object.assign({ id: C.uid('r') }, val));
        else Object.assign(N().recepcionistas.find(function (x) { return x.id === m.id; }), val);
        delete C.ui.errors.recs; C.ui.pnModal = null; C.set(); return;
      }
      if (isNew) commit(sc, [{ op: 'add', coll: 'recepcionistas', item: Object.assign({ id: C.uid('r') }, val) }], 'Agregó un recepcionista');
      else commit(sc, [{ op: 'update', coll: 'recepcionistas', id: m.id, value: val }], 'Editó un recepcionista');
    } else if (m.kind === 'seller') {
      if (!(d.nombre || '').trim()) err['ui.draft.nombre'] = 'Escribe el nombre';
      if (!/^\S+@\S+\.\S+$/.test(d.email || '')) err['ui.draft.email'] = 'Escribe un correo válido';
      if ((d.wa || '').replace(/\D/g, '').length < 8) err['ui.draft.wa'] = 'Escribe un WhatsApp válido';
      if (Object.keys(err).length) return modalFail(err);
      const val = { nombre: d.nombre.trim(), rol: (d.rol || 'Vendedor').trim(), email: d.email.trim(), wa: d.wa.trim() };
      if (isNew) { P().equipo.push(Object.assign({ id: C.uid('p') }, val)); addLog({ accion: 'equipo', empresaId: null, texto: 'Agregó a ' + val.nombre + ' al equipo' }); }
      else { Object.assign(P().equipo.find(function (x) { return x.id === m.id; }), val); addLog({ accion: 'equipo', empresaId: null, texto: 'Editó los datos de ' + val.nombre }); }
      C.toast('Guardado · avisamos a ' + avisados());
    } else if (m.kind === 'invite') {
      const emp = C.empresa(sc);
      emp.credito.invitado = { fecha: C.nowISO(), por: C.persona().nombre };
      addLog({ accion: 'invitacion', empresaId: sc, texto: 'Le pidió al cliente que solicite Crédito Cooltiva (correo y WhatsApp)' });
      C.toast('Enviado a ' + (emp.user.email || 'el cliente') + ' y al WhatsApp ' + (emp.user.wa || ''));
    } else if (m.kind === 'creddocs') {
      const emp = C.empresa(sc), me = C.persona().nombre, docs = C.emptyDocs();
      // cada archivo nuevo queda marcado con el vendedor que lo subió
      C.DOC_KEYS.forEach(function (k) { docs[k] = ((d.cdocs || {})[k] || []).map(function (f) { return f.por ? f : Object.assign({}, f, { por: me }); }); });
      const names = function (x) { return JSON.stringify(C.DOC_KEYS.map(function (k) { return (x[k] || []).map(function (f) { return f.name; }); })); };
      if (names(docs) === names(emp.credito.docs || {})) { C.toast('Sin cambios'); }
      else commit(sc, [{ op: 'set', path: 'credito.docs', value: docs }], 'Cargó documentos para el crédito');
    } else if (m.kind === 'firma') {
      const emp = C.empresa(sc), again = !!emp.credito.enviadoFirma;
      emp.credito.enviadoFirma = { fecha: C.nowISO(), por: C.persona().nombre };
      emp.actualizado = C.nowISO();
      addLog({ accion: 'firma', empresaId: sc, texto: (again ? 'Reenvió' : 'Envió') + ' la solicitud de crédito al cliente para que firme desde su dispositivo (correo y WhatsApp)' });
      C.save();
      C.toast('Enviado a ' + (emp.user.email || 'el cliente') + ' y al WhatsApp ' + (emp.user.wa || ''));
    }
    C.ui.pnModal = null; C.ui.errors = {};
    C.set();
  };

  /* Eliminar (con confirmación) */
  A.pmAskDelete = function (el) {
    const a = el.dataset.arg.split(':'), kind = a[0], id = a[1];
    const sc = C.ui.pnModal ? C.ui.pnModal.sc : scope(), s = src(sc);
    let name = '', extra = '';
    if (kind === 'user') { const u = usersOf(s).find(function (x) { return x.id === id; }); name = fullName(u) || u.email; }
    if (kind === 'suc') { const it = s.sucursales.find(function (x) { return x.id === id; }); name = it.dir; const n = s.recepcionistas.filter(function (r) { return r.sucursalId === id; }).length; if (n) extra = '<br>También se eliminan sus ' + n + (n === 1 ? ' recepcionista.' : ' recepcionistas.'); }
    if (kind === 'rec') { name = s.recepcionistas.find(function (x) { return x.id === id; }).nombre; }
    C.ui.dialog = {
      title: '¿Eliminar ' + ({ user: 'este usuario', suc: 'esta sucursal', rec: 'este recepcionista' })[kind] + '?',
      body: '<strong>' + e(name) + '</strong>' + extra + (sc === 'nueva' ? '' : '<br>Se aplica al instante y queda en el registro: otro vendedor puede revertirlo.'),
      confirm: 'Eliminar', action: 'pmDeleteYes', arg: sc + ':' + kind + ':' + id
    };
    C.renderOverlays();
  };
  A.pmDeleteYes = function (el) {
    const a = el.dataset.arg.split(':'), sc = a[0], kind = a[1], id = a[2];
    const coll = { user: 'empleados', suc: 'sucursales', rec: 'recepcionistas' }[kind];
    if (sc === 'nueva') {
      N()[coll] = N()[coll].filter(function (x) { return x.id !== id; });
      if (coll === 'sucursales') N().recepcionistas = N().recepcionistas.filter(function (r) { return r.sucursalId !== id; });
    } else commit(sc, [{ op: 'remove', coll: coll, id: id }], 'Eliminó ' + ({ user: 'un usuario', suc: 'una sucursal', rec: 'un recepcionista' })[kind]);
    C.ui.dialog = null; C.ui.pnModal = null;
    C.set();
  };

  /* ======================= REGISTRO DE CAMBIOS (con Revertir) ======================= */
  function changeList(ops, emp) {
    return '<ul class="pn-changes">' + ops.map(function (o) {
      const d = C.describeOp(o, emp || {}), k = d.kind;
      let detail = '';
      if (k === 'edit') detail = d.rows.map(function (r) { return '<span class="pn-chg"><span class="muted">' + e(r.label) + '</span> <s>' + e(r.before) + '</s> <b>→ ' + e(r.after) + '</b></span>'; }).join('');
      else if (k === 'add') detail = d.rows.filter(function (r) { return r.after && r.after !== '—'; }).map(function (r) { return '<span class="pn-chg"><span class="muted">' + e(r.label) + '</span> <b>' + e(r.after) + '</b></span>'; }).join('');
      else detail = '<span class="pn-chg muted">Se quitó de la cuenta' + (o.coll === 'sucursales' ? ' con sus recepcionistas' : '') + '</span>';
      return '<li class="pn-change">' + badge({ add: 'Agregó', edit: 'Editó', remove: 'Eliminó' }[k], k === 'remove' ? 'alert' : (k === 'add' ? 'ok' : 'neutral')) +
        '<div class="pn-change-body"><strong>' + e(cap(d.title)) + '</strong><div class="pn-chgs">' + detail + '</div></div></li>';
    }).join('') + '</ul>';
  }
  const VERB = { cambio: 'editó', alta: 'creó la cuenta', reversion: 'revirtió un cambio', pedido: 'hizo un pedido', credito: 'solicitó crédito', invitacion: 'pidió al cliente que solicite crédito', firma: 'envió el crédito para firmar', equipo: 'actualizó el equipo' };
  function entryCard(l, withEmpresa, flags) {
    const emp = C.empresa(l.empresaId), actor = C.persona(l.actor);
    // los documentos del crédito ya no se revierten cuando el cliente firmó
    const credFirmado = emp && (l.ops || []).some(function (o) { return o.path === 'credito.docs'; }) && (emp.credito.estado === 'solicitado' || emp.credito.estado === 'aprobado');
    const revertible = (l.accion === 'cambio' || l.accion === 'alta') && l.actor !== 'cliente' && !l.revertedBy && emp && emp.estado !== 'baja' && !credFirmado;
    const who = l.actor === P().persona ? 'Tú' : actor.nombre;
    return '<article class="card pn-entry' + (flags.isNew ? ' is-new' : '') + (l.revertedBy ? ' is-reverted' : '') + '">' +
      '<header class="pn-entry-head">' + avatar(actor.nombre, 'is-sm') + '<div class="pn-entry-t"><span><strong>' + e(who) + '</strong> ' + e(VERB[l.accion] || '') +
      (withEmpresa && emp ? ' · <a href="#/panel/empresa/' + emp.id + '/historial">' + e(emp.empresa) + '</a>' : '') + '</span><span class="muted small">' + fmtDT(l.fecha) + ' · ' + e(l.texto) + '</span></div>' +
      (flags.isNew ? badge('Nuevo', 'draft') : '') + (l.revertedBy ? badge('Revertido', 'alert') : '') + '</header>' +
      (l.ops && l.ops.length ? changeList(l.ops, emp) : '') +
      (l.revertedBy ? '<p class="muted small pn-entry-foot">Revertido por ' + e(C.persona(l.revertedBy).nombre) + ' · ' + fmtDT(l.revertedAt) + '</p>' : '') +
      (revertible ? '<div class="pn-entry-foot">' + C.btn(l.actor === P().persona ? 'Deshacer' : 'Revertir', { sm: true, icon: 'refresh', action: 'pnRevert', arg: l.id }) + '</div>' : '') +
      '</article>';
  }
  C.route('/panel/registro', function () {
    const g = guard(); if (g) return g;
    const d = C.ui.draft;
    const nuevos = unseen().map(function (l) { return l.id; });
    // al abrir el registro, las novedades quedan vistas
    nuevos.forEach(function (id) { seenList().push(id); }); C.save();
    const entries = P().log.filter(function (l) {
      if (d.rEmp && l.empresaId !== d.rEmp) return false;
      if (d.rPer && l.actor !== d.rPer) return false;
      return true;
    }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    const emps = activas().map(function (x) { return { value: x.id, label: x.empresa }; });
    const pers = P().equipo.map(function (p) { return { value: p.id, label: p.nombre }; }).concat([{ value: 'cliente', label: 'Cliente' }]);
    const html = '<div class="pn-head"><h1 class="h1">Registro de cambios</h1></div>' +
      '<p class="muted mb-12">Los cambios se aplican al instante. Si algo no está bien, revisalo y revertilo.</p>' +
      '<div class="pn-filters">' + C.selectField({ label: 'Empresa', bind: 'ui.draft.rEmp', placeholder: 'Todas', options: emps, rerender: true }) + C.selectField({ label: 'Persona', bind: 'ui.draft.rPer', placeholder: 'Todas', options: pers, rerender: true }) + '</div>' +
      '<div class="pn-feed mt-16">' + (entries.length ? entries.map(function (l) { return entryCard(l, true, { isNew: nuevos.indexOf(l.id) > -1 }); }).join('') : '<p class="muted">Sin movimientos.</p>') + '</div>';
    return { layout: 'panel', nav: 'registro', title: 'Registro de cambios', html: html, narrow: true };
  });
  A.pnRevert = function (el) {
    const l = P().log.find(function (x) { return x.id === el.dataset.arg; }), emp = C.empresa(l.empresaId);
    C.ui.dialog = {
      title: l.accion === 'alta' ? '¿Revertir la creación de la cuenta?' : '¿Revertir este cambio?',
      body: l.accion === 'alta' ? '<strong>' + e(emp.empresa) + '</strong> dejará de aparecer en Empresas.' : 'Los datos de <strong>' + e(emp.empresa) + '</strong> vuelven a como estaban antes. ' + (l.actor !== P().persona ? 'Avisamos a ' + e(C.persona(l.actor).nombre) + '.' : ''),
      confirm: 'Revertir', action: 'pnRevertYes', arg: l.id
    };
    C.renderOverlays();
  };
  A.pnRevertYes = function (el) {
    const l = P().log.find(function (x) { return x.id === el.dataset.arg; }), emp = C.empresa(l.empresaId);
    const autor = C.persona(l.actor).nombre;
    if (l.accion === 'alta') {
      emp.estado = 'baja';
      addLog({ accion: 'reversion', empresaId: l.empresaId, texto: 'Revirtió la creación de la cuenta hecha por ' + autor, revertOf: l.id });
    } else {
      const inv = C.inverseOps(l.ops);
      C.applyOps(emp, inv);
      emp.actualizado = C.nowISO();
      addLog({ accion: 'reversion', empresaId: l.empresaId, texto: 'Revirtió el cambio de ' + autor, ops: inv, revertOf: l.id });
    }
    l.revertedBy = P().persona; l.revertedAt = C.nowISO();
    C.ui.dialog = null; C.save(); C.set();
    C.toast('Revertido' + (l.actor !== P().persona ? ' · avisamos a ' + autor : ''));
  };

  /* ======================= EQUIPO ======================= */
  C.route('/panel/equipo', function () {
    const g = guard(); if (g) return g;
    const html = '<div class="pn-head"><h1 class="h1">Equipo</h1>' + C.btn('+ Agregar vendedor', { action: 'pmOpen', arg: 'seller:new' }) + '</div>' +
      '<table class="pn-table"><thead><tr><th>Persona</th><th>Cargo</th><th>Correo</th><th>WhatsApp</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>' +
      P().equipo.map(function (p) {
        return '<tr><td data-label="Persona"><span class="pn-user">' + avatar(p.nombre, 'is-sm') + '<strong>' + e(p.nombre) + '</strong>' + (p.id === P().persona ? badge('Tú', 'neutral') : '') + '</span></td><td data-label="Cargo">' + e(p.rol) + '</td><td data-label="Correo">' + e(p.email) + '</td><td data-label="WhatsApp">' + e(p.wa) + '</td>' +
          '<td class="pn-td-actions">' + C.link('Editar', 'pmOpen', 'seller:' + p.id) + '</td></tr>';
      }).join('') + '</tbody></table>';
    return { layout: 'panel', nav: 'equipo', title: 'Equipo', html: html };
  });

  /* ======================= NUEVA CUENTA (wizard) =======================
     Contacto → Forma jurídica → Sucursales y recepcionistas → Crédito → Revisar.
     La cuenta queda activa al crearla; el equipo recibe el aviso. */
  const NUEVA_STEPS = ['contacto', 'legal', 'sucursales', 'credito', 'revisar'];
  const NUEVA_LABELS = ['Contacto', 'Forma jurídica', 'Sucursales y recepcionistas', 'Crédito', 'Revisar y crear'];
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
  A.pnNuevaExit = function () { C.save(); C.go('/panel/empresas'); C.toast('Guardada para continuar después'); };
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

  /* Sucursales y recepcionistas: siempre se puede agregar más, todo en modales */
  function saveNuevaSuc(id, val) {
    const n = N();
    if (id) { Object.assign(n.sucursales.find(function (x) { return x.id === id; }), val); C.ui.pnModal = null; C.set(); return; }
    const s = Object.assign({ id: C.uid('s') }, val);
    n.sucursales.push(s);
    delete C.ui.errors.sucs;
    const c = n.contacto;
    if (c.rol === 'Recepcionista' && !n.recepcionistas.length) {
      // igual que en el registro del cliente: el contacto Recepcionista recibe en su primera sucursal
      n.recepcionistas.push({ id: C.uid('r'), nombre: (c.nombre + ' ' + c.apellido).trim(), tel: c.wa.replace('+591 ', ''), sucursalId: s.id });
      C.ui.pnModal = null; C.set(); C.toast('Sucursal agregada · ' + (c.nombre || 'el contacto') + ' recibe aquí');
      return;
    }
    // siguiente paso natural: quién recibe en esta sucursal
    C.set();
    openModal('rec', 'new', { sucId: s.id });
    C.toast('Sucursal agregada. ¿Quién recibe aquí?');
  }
  NV.sucursales = function (i) {
    const n = N(), err = C.ui.errors.recs;
    const cards = n.sucursales.map(function (s) {
      const rs = n.recepcionistas.filter(function (r) { return r.sucursalId === s.id; });
      return '<article class="card pn-nsuc' + (err && !rs.length ? ' is-missing' : '') + '">' +
        '<header class="pn-nsuc-head"><div class="pn-nsuc-map">' + C.map({ small: true, pin: s.pin }) + '</div><div class="item-main"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span></div>' +
        '<div class="item-actions">' + C.link('Editar', 'pmOpen', 'suc:' + s.id) + C.link('Quitar', 'pmAskDelete', 'suc:' + s.id) + '</div></header>' +
        '<div class="pn-nsuc-recs"><p class="eyebrow">Recepcionistas</p>' +
        (rs.length ? rs.map(function (r) { return '<div class="pn-line"><span><strong>' + e(r.nombre) + '</strong> · ' + e(r.tel) + '</span><span class="item-actions">' + C.link('Editar', 'pmOpen', 'rec:' + r.id) + C.link('Quitar', 'pmAskDelete', 'rec:' + r.id) + '</span></div>'; }).join('')
          : '<p class="pn-warn">' + C.icon('alert', 16) + ' Falta quién recibe aquí. ' + C.link('El contacto principal recibe aquí', 'pnNContactoRec', s.id) + '</p>') +
        C.link('+ Agregar recepcionista', 'pmOpen', 'rec:new:' + s.id, 'pn-add-link') + '</div></article>';
    }).join('');
    return nPage(i, '<h1 class="h1 wz-title">Sucursales y recepcionistas</h1><p class="lead mb-12">Cada sucursal necesita al menos una persona que reciba los pedidos.</p>' +
      '<div class="field' + C.errCls('sucs') + C.errCls('recs') + '">' + C.err('sucs') + C.err('recs') + '</div>' +
      '<div class="stack">' + cards + '</div>' +
      '<button type="button" class="btn btn-dashed mt-16" data-action="pmOpen" data-arg="suc:new">+ Agregar ' + (n.sucursales.length ? 'otra ' : '') + 'sucursal</button>');
  };
  A.pnNContactoRec = function (el) {
    const c = N().contacto;
    N().recepcionistas.push({ id: C.uid('r'), nombre: (c.nombre + ' ' + c.apellido).trim(), tel: c.wa.replace('+591 ', ''), sucursalId: el.dataset.arg });
    delete C.ui.errors.recs; C.set();
  };
  NVAL.sucursales = function () {
    const n = N();
    if (!n.sucursales.length) return { sucs: 'Agrega al menos una sucursal' };
    const sin = n.sucursales.filter(function (s) { return !n.recepcionistas.some(function (r) { return r.sucursalId === s.id; }); });
    return sin.length ? { recs: 'Falta quién recibe en: ' + sin.map(function (s) { return s.dir; }).join(', ') } : {};
  };

  NV.credito = function (i) {
    const cr = N().credito, c = N().contacto;
    return nPage(i, '<div class="row wz-title-row"><h1 class="h1">Crédito Cooltiva</h1><span class="tag">Opcional</span></div>' +
      '<p class="lead mb-12">La firma electrónica la hace el cliente desde su dispositivo. Si quieres ayudarle, después de crear la cuenta puedes cargar sus documentos desde su ficha → Crédito.</p>' +
      '<div class="choice-grid cols-2">' +
      C.choice({ label: 'Sin crédito por ahora', sub: 'Paga con QR o contraentrega.', selected: !cr.invitar, action: 'pnNCred', arg: 'no' }) +
      C.choice({ label: 'Pedirle que solicite crédito', sub: 'Le llega un enlace por correo y WhatsApp' + (c.email ? ' (' + e(c.email) + ')' : '') + ' para subir sus documentos y firmar.', selected: !!cr.invitar, action: 'pnNCred', arg: 'si' }) + '</div>');
  };
  A.pnNCred = function (el) { C.set(function (S) { S.panel.nueva.credito.invitar = el.dataset.arg === 'si'; }); };
  NVAL.credito = function () { return {}; };

  NV.revisar = function (i) {
    const n = N();
    const edit = function (step) { return C.link('Editar', 'pnNTab', NUEVA_STEPS.indexOf(step)); };
    const c = n.contacto, fj = n.fj;
    const sections = [
      ['contacto', 'Contacto', '<strong>' + e(c.empresa) + '</strong><br>' + e((c.nombre + ' ' + c.apellido).trim()) + ' · ' + e(c.rol) + '<br><span class="muted">' + e(c.email) + ' · ' + e(c.wa) + '</span>'],
      ['legal', 'Forma jurídica', fj.tipo === 'natural' ? 'Persona natural · CI ' + e(fj.ci) : e(fj.razon) + ' · NIT ' + e(fj.nit)],
      ['sucursales', 'Sucursales y recepcionistas', n.sucursales.map(function (s) { return '<strong>' + e(s.dir) + '</strong> · ' + e(s.ciudad) + '<br><span class="muted">Recibe: ' + e(n.recepcionistas.filter(function (r) { return r.sucursalId === s.id; }).map(function (r) { return r.nombre; }).join(', ')) + '</span>'; }).join('<br>')],
      ['credito', 'Crédito', n.credito.invitar ? 'Le pediremos que solicite crédito (correo y WhatsApp)' : 'Sin crédito por ahora']
    ].map(function (s) { return '<section class="card card-pad sum-card"><div class="row-between"><h2 class="h3">' + s[1] + '</h2>' + edit(s[0]) + '</div><div class="pn-sum-body">' + s[2] + '</div></section>'; }).join('');
    const html = '<h1 class="h1 wz-title">Revisa y crea la cuenta</h1><div class="stack">' + sections + '</div>' +
      '<section class="card card-strong card-pad mt-24">' + C.checkbox({ bind: 'panel.nueva.enviarAcceso', label: 'Enviar el acceso al cliente por correo y WhatsApp' }) +
      '<p class="hint mt-8">La cuenta queda activa al crearla. Avisamos a ' + e(avisados()) + '; pueden revisarla en el registro.</p></section>';
    return nPage(i, html, C.btn('Crear cuenta', { primary: true, action: 'pnNSubmit' }));
  };
  A.pnNSubmit = function () {
    const n = N(), id = C.uid('emp'), now = C.nowISO(), c = n.contacto;
    const emp = {
      id: id, estado: 'activa', origen: 'vendedor', creadoPor: C.persona().nombre, creado: now, actualizado: now,
      empresa: c.empresa.trim(),
      user: { nombre: c.nombre.trim(), apellido: c.apellido.trim(), rol: c.rol, email: c.email.trim(), wa: c.wa.trim() },
      formaJuridica: C.clone(n.fj), sucursales: C.clone(n.sucursales), recepcionistas: C.clone(n.recepcionistas), empleados: [],
      credito: Object.assign({ estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.emptyDocs() }, n.credito.invitar ? { invitado: { fecha: now, por: C.persona().nombre } } : {}),
      pedidos: [], nextPedido: 6001
    };
    C.S.empresas[id] = emp;
    const partes = ['Creó la cuenta'];
    if (n.enviarAcceso) partes.push('envió el acceso al cliente por correo y WhatsApp');
    if (n.credito.invitar) partes.push('le pidió que solicite crédito');
    addLog({ accion: 'alta', empresaId: id, texto: joinY(partes) });
    P().nueva = C.emptyNueva();
    C.save();
    C.goWith('/panel/empresa/' + id + '/usuarios', { flash: 'Cuenta creada' + (n.enviarAcceso ? '. Enviamos el acceso a ' + emp.user.email + ' y al WhatsApp ' + emp.user.wa : '') + '. Avisamos a ' + avisados() + '.' });
  };

  /* ======================= MODO VENDEDOR (comprar por el cliente) ======================= */
  A.pnActAs = function (el) {
    const id = el.dataset.arg, emp = C.empresa(id);
    if (!emp || emp.estado !== 'activa') { C.toast('La cuenta no está activa'); return; }
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
