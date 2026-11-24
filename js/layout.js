/* =========================================================
   LAYOUTS: navbar (calcada de staging), footer, Mi Cuenta,
   wizard (tabs + barra inferior fija) y pantalla simple
   ========================================================= */
(function () {
  const e = C.esc;

  function tiendaHref() { return C.S.session.loggedIn ? '#/cuenta/tienda' : '#/acceso?modo=login'; }

  /* ---------- Navbar (estructura y medidas de staging.cooltiva.market) ---------- */
  C.navbar = function () {
    const path = C.currentPath();
    const logged = C.S.session.loggedIn;
    const links = [
      { label: 'Inicio', href: '#/externo/inicio', on: path === '/externo/inicio' },
      { label: 'Tienda', href: tiendaHref(), on: path === '/cuenta/tienda' },
      { label: 'Nosotros', href: '#/externo/nosotros', on: path === '/externo/nosotros' },
      { label: 'Contacto', href: '#/externo/contacto', on: path === '/externo/contacto' }
    ];
    const navLinks = links.map(function (l) {
      return '<a class="ct-nav-link' + (l.on ? ' is-active' : '') + '" href="' + l.href + '"' + (l.on ? ' aria-current="page"' : '') + '>' + l.label + '</a>';
    }).join('');
    const actions = logged
      ? '<a class="um-btn-ghost um-account' + (path.indexOf('/cuenta/') === 0 && path !== '/cuenta/tienda' ? ' is-active' : '') + '" href="#/cuenta/tienda">' + C.icon('user', 18) + '<span>Mi cuenta</span></a>'
      : '<div class="um-guest"><a class="um-btn-ghost" href="#/acceso?modo=login">Iniciar sesión</a><a class="um-btn-primary" href="#/acceso?modo=registro">Registrarse</a></div>';

    let html = '<header class="ct-header"><div class="ct-header-inner">' +
      '<button type="button" class="ct-hamburger" aria-label="Abrir menú" data-action="drawer" data-arg="open">' + C.icon('menu', 20) + '</button>' +
      C.logo(tiendaHref()) +
      '<nav class="ct-nav" aria-label="Navegación principal">' + navLinks + '</nav>' +
      '<div class="ct-header-spacer"></div><div class="ct-actions">' + actions + '</div>' +
      '</div></header>';

    if (C.ui.drawer) {
      html += '<div class="ct-mobile-overlay" data-action="drawer" data-arg="close"></div>' +
        '<aside class="ct-mobile-sheet" aria-label="Menú">' +
        '<div class="ct-mobile-sheet-head">' + C.logo(tiendaHref()) +
        '<button type="button" class="ct-sheet-close" aria-label="Cerrar menú" data-action="drawer" data-arg="close">' + C.icon('x', 18) + '</button></div>' +
        '<nav class="ct-mobile-nav">' + links.map(function (l) {
          return '<a class="ct-mobile-nav-link' + (l.on ? ' is-active' : '') + '" href="' + l.href + '">' + l.label + '</a>';
        }).join('') + '</nav>' +
        '<div class="ct-mobile-sheet-foot">' + (logged
          ? '<a class="btn btn-block" href="#/cuenta/tienda">' + C.icon('user', 18) + '<span>Mi cuenta</span></a>' +
            '<button type="button" class="btn btn-block btn-ghost" data-action="logout">' + C.icon('logout', 18) + '<span>Cerrar sesión</span></button>'
          : '<a class="btn btn-block" href="#/acceso?modo=login">Iniciar sesión</a><a class="btn btn-primary btn-block" href="#/acceso?modo=registro">Registrarse</a>') +
        '</div></aside>';
    }
    return html;
  };

  C.actions.drawer = function (el) { C.ui.drawer = el.dataset.arg === 'open'; C.set(); };

  C.footer = function () {
    return '<footer class="ct-footer"><div class="ct-footer-inner">' +
      '<div class="ct-footer-brand"><strong>COOLTIVA</strong><p>Abastecimiento B2B para gastronomía en Santa Cruz, La Paz y Cochabamba.</p></div>' +
      '<nav class="ct-footer-links" aria-label="Pie de página"><a href="#/externo/nosotros">Nosotros</a><a href="#/externo/contacto">Contacto</a><a href="#/externo/terminos">Términos y condiciones</a><a href="#/panel">Panel de vendedores</a></nav>' +
      '<p class="ct-footer-copy">© 2026 Cooltiva S.R.L.</p>' +
      '</div></footer>';
  };

  /* ---------- Menú de Mi Cuenta ---------- */
  C.ACCOUNT_TABS = [
    { id: 'tienda', label: 'Tienda' },
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'sucursales', label: 'Sucursales' },
    { id: 'recepcionistas', label: 'Recepcionistas' },
    { id: 'credito', label: 'Crédito' },
    { id: 'responsables', label: 'Agregar responsable' },
    { id: 'configuracion', label: 'Configuración' }
  ];

  C.layouts = {};

  C.layouts.public = function (page) {
    return C.navbar() + '<main class="pub-main' + (page.mainCls ? ' ' + page.mainCls : '') + '" id="main">' + page.html + '</main>' + C.footer();
  };

  C.layouts.cuenta = function (page) {
    const tab = page.tab;
    // En modo vendedor solo se compra y se ven pedidos: los datos se editan desde el panel
    const nav = C.ACCOUNT_TABS.filter(function (t) { return !C.S.acting || t.id === 'tienda' || t.id === 'pedidos'; }).map(function (t) {
      const on = t.id === tab;
      return '<a class="acc-link' + (on ? ' is-active' : '') + '" href="#/cuenta/' + t.id + '"' + (on ? ' aria-current="page"' : '') + '>' + t.label + '</a>';
    }).join('');
    return C.navbar() +
      '<div class="acc">' +
      '<aside class="acc-side" aria-label="Mi cuenta"><p class="eyebrow acc-eyebrow">Mi cuenta</p>' +
      '<nav class="acc-nav">' + nav + '<button type="button" class="acc-link acc-logout-m" data-action="logout">Cerrar sesión</button></nav>' +
      '<div class="acc-side-foot"><button type="button" class="acc-link" data-action="logout">Cerrar sesión</button></div></aside>' +
      '<main class="acc-main" id="main"><div class="acc-content' + (page.wide ? ' is-wide' : '') + (page.full ? ' is-full' : '') + '">' + page.html + '</div></main>' +
      '</div>' + C.footer();
  };

  /* Wizard: sin navbar ni footer, tabs sin número, barra inferior fija */
  C.layouts.wizard = function (page) {
    const tabs = (page.tabs || []).map(function (t) {
      const cls = 'wz-tab is-' + t.state;
      if (t.clickable && t.action) {
        return '<button type="button" class="' + cls + '" data-action="' + t.action + '" data-arg="' + e(t.arg) + '">' + e(t.label) + '</button>';
      }
      return '<span class="' + cls + '"' + (t.state === 'active' ? ' aria-current="step"' : '') + '>' + e(t.label) + '</span>';
    }).join('');
    const bar = page.bar
      ? '<div class="wz-bar">' + (page.summaryBar || '') + '<div class="wz-bar-inner ' + (page.width || '') + '"><div class="wz-bar-left">' + (page.bar.left || '') + '</div><div class="wz-bar-right">' + (page.bar.right || '') + '</div></div></div>'
      : '';
    return '<header class="wz-head"><div class="wz-head-inner">' +
      (page.logoHref ? C.logo(page.logoHref) : '<span class="ct-logo"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="120" height="34"></span>') +
      '<nav class="wz-tabs" aria-label="Pasos">' + tabs + '</nav>' + (page.headRight ? '<span class="wz-head-right">' + page.headRight + '</span>' : '<span class="wz-head-spacer"></span>') + '</div></header>' +
      '<main class="wz-main ' + (page.width || '') + (page.summaryBar ? ' has-summary' : '') + '" id="main">' + page.html + '</main>' + bar;
  };

  /* Pantalla con solo logo (Pedido realizado) */
  C.layouts.plain = function (page) {
    return '<header class="wz-head"><div class="wz-head-inner">' + C.logo('#/cuenta/tienda') + '</div></header>' +
      '<main class="plain-main" id="main">' + page.html + '</main>';
  };

  C.layouts.bare = function (page) { return page.html; };

  /* Construye tabs a partir de una lista y el índice activo */
  /* anteriores: negro y clicables · activo: negrita subrayado · siguientes: gris
     (los siguientes ya visitados siguen en gris pero se pueden tocar) */
  C.buildTabs = function (labels, active, maxStep, action) {
    return labels.map(function (label, i) {
      const state = i === active ? 'active' : (i < active ? 'done' : 'todo');
      return { label: label, state: state, action: action, arg: i, clickable: i !== active && i <= Math.max(maxStep, active) };
    });
  };
})();
