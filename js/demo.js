/* =========================================================
   DEMO · Pestaña fija vertical (derecha-centro) con controles
   del flujo + Mapa de flujos con las 45 pantallas de los PNG
   ========================================================= */
(function () {
  const e = C.esc;
  const A = C.actions;
  const inFrame = window.self !== window.top;

  /* ---------- Helpers para armar escenarios ---------- */
  function base(loggedIn) {
    const keepDemo = C.ui.demoOpen && !C.isMobile();
    C.S = C.freshState();
    C.S.session.loggedIn = !!loggedIn;
    C.ui = C.freshUI();
    C.ui.demoOpen = keepDemo;
  }
  function regData(rol) {
    C.S.onb.reg = { rol: rol || 'Dueño', nombre: 'Carla', apellido: 'Rojas', pass: 'cooltiva26', terms: true, google: false };
  }
  function onbTo(step, rol) {
    base(false); regData(rol);
    const o = C.S.onb;
    if (step >= 2) o.fj = { tipo: 'unipersonal', ci: '', razon: 'Restaurante El Fogón', nit: '4021567018', matricula: '00385124' };
    if (step >= 3) o.suc = { dir: 'Av. 6 de Agosto 1234', ciudad: 'La Paz', pin: { x: 46, y: 42 } };
    o.rec.yoSoy = (rol === 'Recepcionista');
    o.maxStep = step;
  }
  function cartUpTo(level, pago) {
    const c = C.S.cart;
    c.selected = ['papa', 'cafe'];
    c.items = {
      papa: { size: 'Cuarta', qty: '50', unit: '@', servicio: 'Lavada', garantia: 'con' },
      cafe: { size: 'Primera', qty: '20', unit: 'kg', servicio: 'Natural', garantia: 'sin' }
    };
    c.open = 'papa';
    c.maxStep = 0;
    if (level === 'producto') { c.items.cafe = C.emptyItem(); return; }
    c.maxStep = 1;
    if (level === 'sucursal') return;
    c.sucursalId = 's1'; c.maxStep = 2;
    if (level === 'entrega') return;
    c.fecha = C.deliveryDates()[1]; c.franja = '08:00 – 10:00'; c.franjaDesde = '08:00'; c.franjaHasta = '10:00'; c.recepId = 'r1'; c.maxStep = 3;
    if (level === 'pago') { c.pago = pago || null; return; }
    c.pago = pago; c.maxStep = 4;
    if (pago === 'credito') { c.leido = true; c.firmo = true; c.firma = { modo: 'dibujar', data: fakeSignature(), archivo: null }; }
  }
  function fakeSignature() {
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 180;
    const x = cv.getContext('2d'); x.lineWidth = 3; x.lineCap = 'round'; x.strokeStyle = '#000';
    x.beginPath(); x.moveTo(60, 120);
    x.bezierCurveTo(90, 30, 130, 40, 120, 110); x.bezierCurveTo(115, 150, 170, 60, 200, 100);
    x.bezierCurveTo(230, 140, 260, 50, 300, 95); x.bezierCurveTo(330, 130, 360, 70, 400, 100);
    x.bezierCurveTo(430, 120, 470, 90, 520, 105); x.stroke();
    return cv.toDataURL('image/png');
  }
  function orderWith(pago, thenOrders) {
    base(true); cartUpTo('confirmar', pago);
    C.createOrder();
    C.save();
    if (thenOrders) C.goWith('/cuenta/pedidos', { highlightOrder: true });
    else C.go('/compra/realizado');
  }

  /* ---------- Escenarios (uno por PNG) ---------- */
  C.SCENARIOS = [
    { flow: '1 · Crear cuenta cliente', items: [
      ['1a', 'Registro', function () { base(false); C.go('/acceso?modo=registro'); }],
      ['1b', 'Forma jurídica · Persona natural', function () { onbTo(1); C.S.onb.fj.tipo = 'natural'; C.go('/onboarding/forma-juridica'); }],
      ['1c', 'Forma jurídica · Empresa unipersonal', function () { onbTo(1); C.S.onb.fj.tipo = 'unipersonal'; C.go('/onboarding/forma-juridica'); }],
      ['1d', 'Sucursales', function () { onbTo(2); C.go('/onboarding/sucursales'); }],
      ['1e', 'Recepcionista', function () { onbTo(3, 'Dueño'); C.go('/onboarding/recepcionista'); }],
      ['1f', 'Recepcionista · rol Recepcionista', function () { onbTo(3, 'Recepcionista'); C.go('/onboarding/recepcionista'); }],
      ['1g', 'Crédito · sin solicitar', function () { onbTo(4); C.S.onb.rec = { yoSoy: false, nombre: 'Juan Pérez', tel: '7012 3456' }; C.go('/onboarding/credito'); }],
      ['1h', 'Crédito · solicitud marcada', function () { onbTo(4); C.S.onb.rec = { yoSoy: false, nombre: 'Juan Pérez', tel: '7012 3456' }; C.S.onb.cred.solicitar = true; C.go('/onboarding/credito'); }],
      ['1i', 'Tienda (cuenta nueva)', function () { onbTo(4); C.S.onb.rec = { yoSoy: false, nombre: 'Juan Pérez', tel: '7012 3456' }; C.save(); A.onbSkip(); }]
    ] },
    { flow: '2 · Iniciar sesión cliente', items: [
      ['2a', 'Iniciar sesión', function () { base(false); C.go('/acceso?modo=login'); }],
      ['2b', 'Tienda', function () { base(true); C.go('/cuenta/tienda'); }]
    ] },
    { flow: '3 · Proceso de compra', items: [
      ['3a', 'Tienda', function () { base(true); C.go('/cuenta/tienda'); }],
      ['3b', 'Producto', function () { base(true); cartUpTo('producto'); C.go('/compra/producto'); }],
      ['3c', 'Sucursal', function () { base(true); cartUpTo('sucursal'); C.go('/compra/sucursal'); }],
      ['3d', 'Sucursal · modal editar sucursal', function () { base(true); cartUpTo('sucursal'); C.S.cart.sucursalId = 's1'; C.goWith('/compra/sucursal', {}); C._after = function () { C.openModal('suc:s1'); }; }],
      ['3e', 'Entrega', function () { base(true); cartUpTo('entrega'); C.go('/compra/entrega'); }],
      ['3f', 'Entrega · modal editar recepcionista', function () { base(true); cartUpTo('entrega'); C.S.cart.recepId = 'r1'; C.go('/compra/entrega'); C._after = function () { C.openModal('rec:r1'); }; }]
    ], branches: [
      { name: 'Rama Pago con QR', items: [
        ['3g', 'Pago', function () { base(true); cartUpTo('pago', 'qr'); C.go('/compra/pago'); }],
        ['3h', 'Confirmar', function () { base(true); cartUpTo('confirmar', 'qr'); C.go('/compra/confirmar'); }],
        ['3i', 'Pedido realizado', function () { orderWith('qr'); }],
        ['3j', 'Pedidos realizados', function () { orderWith('qr', true); }]
      ] },
      { name: 'Rama Contraentrega', items: [
        ['3k', 'Pago', function () { base(true); cartUpTo('pago', 'contraentrega'); C.go('/compra/pago'); }],
        ['3l', 'Confirmar', function () { base(true); cartUpTo('confirmar', 'contraentrega'); C.go('/compra/confirmar'); }],
        ['3m', 'Pedido realizado', function () { orderWith('contraentrega'); }],
        ['3n', 'Pedidos realizados', function () { orderWith('contraentrega', true); }]
      ] },
      { name: 'Rama Crédito Cooltiva', items: [
        ['3o', 'Pago', function () { base(true); cartUpTo('pago', 'credito'); C.go('/compra/pago'); }],
        ['3p', 'Pago · modal crédito aprobado', function () { base(true); cartUpTo('pago', 'credito'); C.go('/compra/pago'); C._after = function () { C.openModal('credito'); }; }],
        ['3q', 'Confirmar', function () { base(true); cartUpTo('confirmar', 'credito'); C.go('/compra/confirmar'); }],
        ['3r', 'Pedido realizado', function () { orderWith('credito'); }],
        ['3s', 'Pedidos realizados', function () { orderWith('credito', true); }]
      ] }
    ] },
    { flow: '4 · Responsables', items: [
      ['4a', 'Agregar responsable', function () { base(true); C.go('/cuenta/responsables'); }],
      ['4b', 'Datos completos', function () { base(true); C.goWith('/cuenta/responsables', { draft: { email: 'carla.flores@restaurante.bo', wa: '+591 7000 0003' } }); }],
      ['4c', 'Invitación enviada', function () { base(true); C.S.account.empleados.push({ id: 'e3', email: 'carla.flores@restaurante.bo', wa: '+591 7000 0003' }); C.goWith('/cuenta/responsables', { invited: { email: 'carla.flores@restaurante.bo', wa: '+591 7000 0003' } }); }],
      ['4d', 'Eliminar responsable', function () { base(true); C.go('/cuenta/responsables'); C._after = function () { A.empDelete({ dataset: { arg: 'e2' } }); }; }]
    ] },
    { flow: '5 · Sucursales', items: [
      ['5a', 'Listado', function () { base(true); C.go('/cuenta/sucursales'); }],
      ['5b', 'Crear sucursal', function () { base(true); C.goWith('/cuenta/sucursales', { creating: 'sucursal', draft: { dir: '', ciudad: '', pin: null } }); }],
      ['5c', 'Editar sucursal', function () { base(true); const s = C.S.account.sucursales[0]; C.goWith('/cuenta/sucursales', { editing: { type: 'suc', id: 's1' }, draft: { dir: s.dir, ciudad: s.ciudad, pin: s.pin } }); }],
      ['5d', 'Eliminar sucursal', function () { base(true); C.go('/cuenta/sucursales'); C._after = function () { C.confirmDeleteSucursal('s2'); }; }]
    ] },
    { flow: '6 · Recepcionistas', items: [
      ['6a', 'Listado', function () { base(true); C.go('/cuenta/recepcionistas'); }],
      ['6b', 'Agregar · crear nuevo', function () { base(true); C.goWith('/cuenta/recepcionistas', { creating: 'recepcionista', draft: C.newRecepDraft('s1') }); }],
      ['6c', 'Agregar · elegir existente', function () { base(true); const d = C.newRecepDraft('s1'); d.modo = 'existente'; d.pickId = 'r3'; C.goWith('/cuenta/recepcionistas', { creating: 'recepcionista', draft: d }); }],
      ['6d', 'Editar recepcionista', function () { base(true); C.goWith('/cuenta/recepcionistas', { editing: { type: 'rec', id: 'r1' }, draft: { sucursalId: 's1', nombre: 'Juan Pérez', tel: '7012 3456' } }); }],
      ['6e', 'Eliminar recepcionista', function () { base(true); C.go('/cuenta/recepcionistas'); C._after = function () { C.confirmDeleteRecep('r2'); }; }]
    ] },
    { flow: '7 · Crédito', items: [
      ['7a', 'Crédito aprobado', function () { base(true); C.go('/cuenta/credito'); }],
      ['7b', 'Solicitar crédito (sin crédito)', function () { base(true); sinCredito(); C.go('/cuenta/credito'); }],
      ['7c', 'Solicitud enviada', function () { base(true); C.S.account.credito = { estado: 'solicitado', linea: 0, plazo: 30, usado: 0, solicitado: '2026-11-24T10:15', docs: C.fullDocs() }; C.go('/cuenta/credito'); }],
      ['7d', 'Desde el pago: solicitar crédito', function () { base(true); sinCredito(); cartUpTo('pago', 'qr'); C.go('/compra/pago'); C._after = function () { C.openModal('credito'); }; }],
      ['7e', 'Firmar lo que cargó el vendedor', function () { base(true); C.S.account.credito = { estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.partialDocs('Fabiana Paz'), enviadoFirma: { fecha: '2026-11-24T09:40', por: 'Fabiana Paz' } }; C.go('/cuenta/credito'); }]
    ] },
    { flow: '8 · Panel de vendedores', items: [
      ['8a', 'Login del vendedor', function () { base(false); C.go('/panel/login'); }],
      ['8b', 'Empresas y sus usuarios', function () { pbase(); C.go('/panel/empresas'); }],
      ['8c', 'Ficha de empresa', function () { pbase(); C.go('/panel/empresa/fogon/usuarios'); }],
      ['8d', 'Modal · editar usuario', function () { pbase(); C.go('/panel/empresa/fogon/usuarios'); C._after = function () { A.pmOpen({ dataset: { arg: 'user:e1' } }); }; }],
      ['8e', 'Modal · editar sucursal', function () { pbase(); C.go('/panel/empresa/fogon/sucursales'); C._after = function () { A.pmOpen({ dataset: { arg: 'suc:s2' } }); }; }],
      ['8f', 'Modal · agregar recepcionista', function () { pbase(); C.go('/panel/empresa/fogon/recepcionistas'); C._after = function () { A.pmOpen({ dataset: { arg: 'rec:new:s2' } }); }; }],
      ['8g', 'Modal · datos legales', function () { pbase(); C.go('/panel/empresa/fogon/legal'); C._after = function () { A.pmOpen({ dataset: { arg: 'legal:x' } }); }; }],
      ['8h', 'Registro de cambios (novedades)', function () { pbase(); C.go('/panel/registro'); }],
      ['8i', 'Revertir un cambio de otro vendedor', function () { pbase(); C.go('/panel/registro'); C._after = function () { A.pnRevert({ dataset: { arg: 'l8' } }); }; }],
      ['8j', 'Crédito · pedir al cliente', function () { pbase(); C.go('/panel/empresa/donarosa/credito'); C._after = function () { A.pmOpen({ dataset: { arg: 'invite:x' } }); }; }],
      ['8k', 'Crédito solicitado por el cliente', function () { pbase(); C.go('/panel/empresa/altura/credito'); }],
      ['8l', 'Nueva cuenta · contacto', function () { pbase(); C.go('/panel/nueva/contacto'); }],
      ['8m', 'Nueva cuenta · sucursales y recepcionistas', function () { pbase(); fillNueva(2); C.go('/panel/nueva/sucursales'); }],
      ['8n', 'Nueva cuenta · crédito', function () { pbase(); fillNueva(3); C.go('/panel/nueva/credito'); }],
      ['8o', 'Nueva cuenta · revisar y crear', function () { pbase(); fillNueva(4); C.go('/panel/nueva/revisar'); }],
      ['8p', 'Cuenta creada (aviso al equipo)', function () { pbase(); fillNueva(4); A.pnNSubmit(); }],
      ['8q', 'Modo vendedor: pedido para el cliente', function () { pbase(); A.pnActAs({ dataset: { arg: 'hotel' } }); }],
      ['8r', 'Equipo · editar vendedor', function () { pbase(); C.go('/panel/equipo'); C._after = function () { A.pmOpen({ dataset: { arg: 'seller:jorge' } }); }; }],
      ['8s', 'Crédito · cargar documentos del cliente', function () { pbase(); C.go('/panel/empresa/donarosa/credito'); C._after = function () { A.pmOpen({ dataset: { arg: 'creddocs:x' } }); }; }],
      ['8t', 'Crédito · enviar al cliente para firmar', function () { pbase(); C.S.empresas.donarosa.credito.docs = C.partialDocs('Fabiana Paz'); C.go('/panel/empresa/donarosa/credito'); C._after = function () { A.pmOpen({ dataset: { arg: 'firma:x' } }); }; }],
      ['8u', 'Crédito · pendiente de firma del cliente', function () { pbase(); const c = C.S.empresas.donarosa.credito; c.docs = C.partialDocs('Fabiana Paz'); c.enviadoFirma = { fecha: '2026-11-24T09:40', por: 'Fabiana Paz' }; C.go('/panel/empresa/donarosa/credito'); }]
    ] }
  ];
  function pbase() { base(false); C.S.panel.loggedIn = true; C.S.panel.persona = 'fabiana'; }
  function sinCredito() { C.S.account.credito = { estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.emptyDocs() }; }
  function fillNueva(step) {
    const n = C.S.panel.nueva;
    n.contacto = { empresa: 'Pensión La Casona', nombre: 'Julia', apellido: 'Céspedes', rol: 'Dueño', email: 'julia@lacasona.bo', wa: '+591 7455 1212' };
    n.fj = { tipo: 'unipersonal', ci: '', razon: 'Pensión La Casona', nit: '6012345019', matricula: '00477812' };
    n.sucursales = [{ id: 'ns1', dir: 'Calle Sucre 455', ciudad: 'Cochabamba', pin: { x: 44, y: 50 } }, { id: 'ns2', dir: 'Av. América Este 1180', ciudad: 'Cochabamba', pin: { x: 62, y: 36 } }];
    n.recepcionistas = [{ id: 'nr1', nombre: 'Carlos Rocha', tel: '7455 3434', sucursalId: 'ns1' }, { id: 'nr2', nombre: 'Elena Vargas', tel: '7455 5656', sucursalId: 'ns2' }];
    n.credito = { invitar: true };
    n.enviarAcceso = true;
    n.maxStep = step;
  }
  C.allScenarios = function () {
    const out = [];
    C.SCENARIOS.forEach(function (f) {
      f.items.forEach(function (i) { out.push(i); });
      (f.branches || []).forEach(function (b) { b.items.forEach(function (i) { out.push(i); }); });
    });
    return out;
  };
  C.runScenario = function (code) {
    const sc = C.allScenarios().find(function (i) { return i[0] === code; });
    if (!sc) return;
    const before = location.hash;
    C._after = null;
    sc[2]();
    C.save();
    // Acciones que requieren la pantalla ya pintada (modal, diálogo):
    // si la ruta no cambió, el render ya ocurrió y se ejecutan ahora;
    // si cambió, las ejecuta C.onRoute al terminar de pintar.
    if (C._after && location.hash === before) { const f = C._after; C._after = null; C.render(); f(); }
  };
  A.scenario = function (el) { C.runScenario(el.dataset.arg); };

  /* ---------- Mapa de flujos ---------- */
  C.route('/mapa', function () {
    const card = function (i) { return '<button type="button" class="map-step" data-action="scenario" data-arg="' + i[0] + '"><span class="map-code">' + i[0] + '</span><span>' + e(i[1]) + '</span></button>'; };
    const cols = C.SCENARIOS.map(function (f) {
      let col = '<section class="flow-col' + (f.branches ? ' has-branches' : '') + '"><h2 class="flow-title">' + e(f.flow) + '</h2><div class="flow-steps">' + f.items.map(card).join('') + '</div>';
      if (f.branches) {
        col += '<p class="branch-label">Se bifurca en el paso Pago</p><div class="branches">' + f.branches.map(function (b) {
          return '<div class="branch"><h3 class="branch-title">' + e(b.name) + '</h3><div class="flow-steps">' + b.items.map(card).join('') + '</div></div>';
        }).join('') + '</div>';
      }
      return col + '</section>';
    }).join('');
    return {
      layout: 'bare', title: 'Mapa de flujos',
      html: '<div class="flowmap"><header class="flowmap-head"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="120" height="34">' +
        '<div><h1 class="h1">Mapa de flujos</h1><p class="muted">Arquitectura de información · Sprint 1. Toca una pantalla para abrirla con sus datos de ejemplo; desde ahí el flujo es navegable.</p></div>' +
        '<div class="flowmap-actions">' + C.btn(C.getView() === 'mobile' ? 'Ver en escritorio' : 'Ver en mobile', { icon: C.getView() === 'mobile' ? 'monitor' : 'phone', action: 'demoViewMode', arg: C.getView() === 'mobile' ? 'desktop' : 'mobile' }) +
        '<button type="button" class="btn btn-primary" data-action="scenario" data-arg="1a">Empezar desde el registro</button></div></header>' +
        '<div class="flowmap-cols">' + cols + '</div></div>'
    };
  });

  /* ---------- Pestaña y panel DEMO ---------- */
  C.renderDemo = function () {
    const S = C.S, open = C.ui.demoOpen;
    const tab = '<button type="button" class="demo-tab' + (open ? ' is-open' : '') + '" data-action="demoToggle" aria-expanded="' + open + '" aria-controls="demo-panel">DEMO</button>';
    if (!open) return tab;
    const path = C.currentPath();
    const opts = C.SCENARIOS.map(function (f) {
      const items = f.items.concat.apply(f.items, (f.branches || []).map(function (b) { return b.items.map(function (i) { return [i[0], b.name.replace('Rama ', '') + ' · ' + i[1], i[2]]; }); }));
      return '<optgroup label="' + e(f.flow) + '">' + items.map(function (i) { return '<option value="' + i[0] + '">' + i[0] + ' · ' + e(i[1]) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    const cred = S.account.credito.estado;
    const inPanel = path.indexOf('/panel') === 0;
    const common = '<section class="demo-sec"><h3 class="demo-h">Vista</h3>' +
      C.segmented({ cls: 'seg-block seg-sm', value: C.getView(), action: 'demoViewMode', aria: 'Vista', options: [{ value: 'desktop', label: 'Escritorio' }, { value: 'mobile', label: 'Mobile' }] }) +
      '<p class="hint mt-8">Mismo prototipo y misma URL: Mobile lo muestra dentro de un teléfono.</p></section>' +
      '<section class="demo-sec"><h3 class="demo-h">Plataforma</h3>' +
      C.segmented({ cls: 'seg-block seg-sm', value: inPanel ? 'panel' : 'tienda', action: 'demoPlatform', aria: 'Plataforma', options: [{ value: 'tienda', label: 'Tienda (cliente)' }, { value: 'panel', label: 'Panel vendedores' }] }) + '</section>' +
      '<section class="demo-sec"><button type="button" class="btn btn-primary btn-block" data-action="demoReset">' + C.icon('refresh', 18) + '<span>Reiniciar demo</span></button>' +
      '<p class="hint mt-8">Vuelve a los datos de ejemplo de las dos plataformas.</p></section>' +
      '<section class="demo-sec"><h3 class="demo-h">Ir a una pantalla</h3>' +
      '<div class="select-wrap"><select class="input select" id="demo-jump" aria-label="Elegir pantalla"><option value="">Elegir pantalla…</option>' + opts + '</select>' + C.icon('chevDown', 16) + '</div>' +
      '<div class="demo-row">' + C.btn('Abrir', { action: 'demoJump', sm: true }) + '<a class="btn btn-sm" href="#/mapa">' + C.icon('map', 16) + '<span>Mapa de flujos</span></a></div></section>';
    const head = tab + '<div class="demo-scrim" data-action="demoToggle"></div>' +
      '<aside class="demo-panel" id="demo-panel" aria-label="Controles del demo">' +
      '<header class="demo-head"><div><p class="eyebrow">Prototipo · sin backend</p><h2 class="h2">Demo</h2></div>' +
      '<button type="button" class="icon-btn" aria-label="Cerrar demo" data-action="demoToggle">' + C.icon('x', 20) + '</button></header>' +
      '<div class="demo-body">' + common;
    if (inPanel) {
      return head + '<section class="demo-sec"><h3 class="demo-h">Perfil en el panel</h3>' +
        '<div class="select-wrap"><select class="input select" data-bind="panel.persona" data-rerender aria-label="Perfil">' +
        S.panel.equipo.map(function (p) { return '<option value="' + p.id + '"' + (S.panel.persona === p.id ? ' selected' : '') + '>' + e(p.nombre + ' · ' + p.rol) + '</option>'; }).join('') + '</select>' + C.icon('chevDown', 16) + '</div>' +
        '<p class="hint mt-8">Cambia de perfil para ver los cambios de otro vendedor como novedad y revertirlos.</p></section>' +
        '<p class="demo-foot muted small">Ruta actual: <code>#' + e(path) + '</code></p></div></aside>';
    }
    return head +

      '<section class="demo-sec"><h3 class="demo-h">Sesión</h3>' +
      (S.session.loggedIn
        ? '<p class="small">Sesión iniciada como <strong>' + e((S.account.user.nombre + ' ' + S.account.user.apellido).trim()) + '</strong> · ' + e(S.account.empresa) + '</p><div class="demo-row">' + C.btn('Cerrar sesión', { action: 'logout', sm: true }) + '</div>'
        : '<p class="small muted">Sin sesión.</p><div class="demo-row">' + C.btn('Entrar con cuenta demo', { action: 'demoLogin', sm: true }) + '</div>') +
      '</section>' +

      '<section class="demo-sec"><h3 class="demo-h">Crédito Cooltiva de la cuenta</h3>' +
      C.segmented({ cls: 'seg-block seg-sm', value: cred === 'aprobado' ? 'aprobado' : 'no', action: 'demoCredito', options: [{ value: 'aprobado', label: 'Aprobado' }, { value: 'no', label: 'Sin crédito' }] }) +
      (cred === 'aprobado' ? '<p class="hint mt-8">Disponible: ' + C.bs(C.credito().disponible) + ' de ' + C.bs(S.account.credito.linea) + '</p>' : '<p class="hint mt-8">El pago con crédito queda deshabilitado.</p>') + '</section>' +

      '<section class="demo-sec"><h3 class="demo-h">Rol en el registro</h3>' +
      '<div class="select-wrap"><select class="input select" data-bind="onb.reg.rol" data-live="demoRol" aria-label="Rol"><option value="">Sin elegir</option>' +
      C.ROLES.map(function (r) { return '<option' + (S.onb.reg.rol === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' + C.icon('chevDown', 16) + '</div>' +
      '<p class="hint mt-8">Con “Recepcionista”, la tarjeta “Yo soy el recepcionista” se marca sola.</p></section>' +

      '<section class="demo-sec"><h3 class="demo-h">Datos de la cuenta</h3><div class="demo-row">' +
      C.btn('Cargar ejemplo', { action: 'demoData', arg: 'seed', sm: true }) + C.btn('Vaciar', { action: 'demoData', arg: 'empty', sm: true }) + '</div>' +
      '<p class="hint mt-8">“Vaciar” quita sucursales, recepcionistas, responsables y pedidos para ver los estados vacíos.</p></section>' +

      '<section class="demo-sec"><h3 class="demo-h">Atajos de compra</h3><div class="demo-row">' +
      C.btn('Pedido listo para pagar', { action: 'demoCart', arg: 'pago', sm: true }) + C.btn('Vaciar pedido', { action: 'demoCart', arg: 'clear', sm: true }) + '</div></section>' +

      '<p class="demo-foot muted small">Ruta actual: <code>#' + e(path) + '</code></p>' +
      '</div></aside>';
  };

  A.demoToggle = function () { C.ui.demoOpen = !C.ui.demoOpen; C.renderOverlays(); };
  A.demoReset = function () {
    const inPanel = C.currentPath().indexOf('/panel') === 0;
    C.reset(); C.ui.demoOpen = false;
    C.go(inPanel ? '/panel/login' : '/acceso?modo=registro');
    C.toast('Demo reiniciado');
  };
  A.demoJump = function () {
    const v = document.getElementById('demo-jump').value;
    if (!v) { C.toast('Elige una pantalla'); return; }
    C.runScenario(v);
  };
  A.demoLogin = function () {
    C.S.session.loggedIn = true; C.save();
    C.ui.demoOpen = !C.isMobile();
    C.go('/cuenta/tienda', { keepUI: true });
  };
  A.demoCredito = function (el) {
    const c = C.S.account.credito;
    if (el.dataset.arg === 'aprobado') { c.estado = 'aprobado'; if (!c.linea) c.linea = 10000; c.plazo = c.plazo || 30; }
    else { c.estado = 'no'; if (C.S.cart.pago === 'credito') C.S.cart.pago = null; }
    C.set();
  };
  C.live.demoRol = function () {
    C.S.onb.rec.yoSoy = C.S.onb.reg.rol === 'Recepcionista';
    C.save(); C.set();
  };
  A.demoData = function (el) {
    const a = C.S.account;
    if (el.dataset.arg === 'seed') {
      const s = C.seedAccount();
      a.sucursales = s.sucursales; a.recepcionistas = s.recepcionistas; a.empleados = s.empleados; a.pedidos = s.pedidos; a.nextPedido = s.nextPedido;
      C.toast('Datos de ejemplo cargados');
    } else {
      a.sucursales = []; a.recepcionistas = []; a.empleados = []; a.pedidos = [];
      C.S.cart.sucursalId = null; C.S.cart.recepId = null;
      C.toast('Cuenta vaciada');
    }
    C.S.cart.maxStep = Math.min(C.S.cart.maxStep, 1);
    C.set();
    if (C.currentPath().indexOf('/compra/') === 0) C.render();
  };
  A.demoCart = function (el) {
    if (!C.S.session.loggedIn) { C.S.session.loggedIn = true; }
    if (el.dataset.arg === 'clear') { C.S.cart = C.emptyCart(); C.save(); C.go('/cuenta/tienda', { keepUI: true }); return; }
    if (!C.S.account.sucursales.length) { const s = C.seedAccount(); C.S.account.sucursales = s.sucursales; C.S.account.recepcionistas = s.recepcionistas; }
    C.S.cart = C.emptyCart();
    cartUpTo('pago', null);
    C.S.cart.sucursalId = C.S.account.sucursales[0].id;
    const r = C.S.account.recepcionistas.find(function (x) { return x.sucursalId === C.S.cart.sucursalId; });
    C.S.cart.recepId = r ? r.id : null;
    C.save();
    C.go('/compra/pago', { keepUI: true });
  };
  A.demoViewMode = function (el) { C.setView(el.dataset.arg); };
  A.demoPlatform = function (el) {
    C.ui.demoOpen = !C.isMobile();
    if (el.dataset.arg === 'panel') C.go('/panel', { keepUI: true });
    else C.go(C.S.session.loggedIn ? '/cuenta/tienda' : '/acceso?modo=login', { keepUI: true });
  };
})();
