/* =========================================================
   FLUJO 1 · Crear cuenta cliente  |  FLUJO 2 · Iniciar sesión
   ========================================================= */
(function () {
  const e = C.esc;
  const A = C.actions;
  const ONB_LABELS = ['Registro', 'Forma jurídica', 'Sucursales', 'Recepcionista', 'Crédito Cooltiva'];
  const ONB_ROUTES = [null, 'forma-juridica', 'sucursales', 'recepcionista', 'credito'];

  /* ---------- Pantalla Registrar / Iniciar sesión ---------- */
  C.route('/acceso', function () {
    if (C.S.session.loggedIn) return { redirect: '/cuenta/tienda' };
    const modo = C.query().modo === 'login' ? 'login' : 'registro';
    const toggle = C.segmented({
      cls: 'seg-block auth-toggle', aria: 'Elegir acción', value: modo, action: 'authMode',
      options: [{ value: 'registro', label: 'Registrar' }, { value: 'login', label: 'Iniciar sesión' }]
    });
    return {
      layout: 'public', mainCls: 'pub-center', title: modo === 'login' ? 'Iniciar sesión' : 'Registrarse',
      html: '<section class="auth">' + toggle + (modo === 'login' ? loginForm() : registroForm()) + '</section>'
    };
  });

  function registroForm() {
    const r = C.S.onb.reg;
    const roles = C.ROLES.map(function (rol) {
      return C.choice({ label: rol, selected: r.rol === rol, action: 'onbRol', arg: rol });
    }).join('');
    return '<h1 class="h1">Crea tu cuenta</h1>' +
      '<button type="button" class="btn btn-block btn-google" data-action="regGoogle"><span class="g-mark" aria-hidden="true">G</span><span>Registrarse con Google</span></button>' +
      '<div class="or"><span>o con tus datos</span></div>' +
      '<div class="field' + C.errCls('rol') + '"><span class="label" id="rol-l">Tu rol</span>' +
      '<div class="choice-grid cols-2 focus-target" role="radiogroup" aria-labelledby="rol-l" tabindex="-1">' + roles + '</div>' + C.err('rol') + '</div>' +
      '<div class="form-grid">' +
      C.field({ label: 'Nombre', bind: 'onb.reg.nombre', autocomplete: 'given-name' }) +
      C.field({ label: 'Apellido', bind: 'onb.reg.apellido', autocomplete: 'family-name' }) +
      '</div>' +
      C.field({ label: 'Contraseña', bind: 'onb.reg.pass', type: 'password', autocomplete: 'new-password', hint: 'Mínimo 6 caracteres' }) +
      C.checkbox({ bind: 'onb.reg.terms', label: 'Acepto <a href="#/externo/terminos" target="_blank">términos y condiciones</a>' }) +
      C.btn('Continuar', { primary: true, block: true, action: 'regContinue' });
  }

  function loginForm() {
    return '<h1 class="h1">Ingresa a tu cuenta</h1>' +
      C.field({ label: 'Correo electrónico', bind: 'ui.draft.email', type: 'email', autocomplete: 'email', placeholder: 'nombre@restaurante.bo' }) +
      C.field({ label: 'Contraseña', bind: 'ui.draft.pass', type: 'password', autocomplete: 'current-password' }) +
      C.btn('Iniciar sesión', { primary: true, block: true, action: 'login' });
  }

  A.authMode = function (el) { C.go('/acceso?modo=' + el.dataset.arg); };

  A.onbRol = function (el) {
    C.set(function (S) {
      S.onb.reg.rol = el.dataset.arg;
      delete C.ui.errors.rol;
      // Lógica de producto: rol Recepcionista marca "Yo soy el recepcionista"
      S.onb.rec.yoSoy = el.dataset.arg === 'Recepcionista';
    });
  };

  function validateReg(google) {
    const r = C.S.onb.reg, err = {};
    if (!r.rol) err.rol = 'Elige tu rol en el negocio';
    if (!google) {
      if (!r.nombre.trim()) err['onb.reg.nombre'] = 'Escribe tu nombre';
      if (!r.apellido.trim()) err['onb.reg.apellido'] = 'Escribe tu apellido';
      if (r.pass.length < 6) err['onb.reg.pass'] = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!r.terms) err['onb.reg.terms'] = 'Debes aceptar los términos y condiciones';
    return err;
  }

  A.regContinue = function () {
    const err = validateReg(false);
    if (Object.keys(err).length) return C.fail(err);
    C.S.onb.reg.google = false;
    C.S.onb.maxStep = Math.max(C.S.onb.maxStep, 1);
    C.save();
    C.go('/onboarding/forma-juridica');
  };

  A.regGoogle = function () {
    const err = validateReg(true);
    if (Object.keys(err).length) { C.toast('Elige tu rol y acepta los términos para continuar con Google'); return C.fail(err); }
    const r = C.S.onb.reg;
    r.google = true;
    if (!r.nombre) r.nombre = 'Carla';
    if (!r.apellido) r.apellido = 'Rojas';
    C.S.onb.maxStep = Math.max(C.S.onb.maxStep, 1);
    C.save();
    C.toast('Cuenta de Google vinculada');
    C.go('/onboarding/forma-juridica');
  };

  A.login = function () {
    const d = C.ui.draft, err = {};
    if (!d.email || !/^\S+@\S+\.\S+$/.test(d.email)) err['ui.draft.email'] = 'Escribe un correo válido';
    if (!d.pass) err['ui.draft.pass'] = 'Escribe tu contraseña';
    if (Object.keys(err).length) return C.fail(err);
    C.S.session.loggedIn = true;
    C.save();
    C.go('/cuenta/tienda');
  };

  A.logout = function () {
    if (C.S.acting) return C.actions.actingExit();
    C.S.session.loggedIn = false;
    C.S.cart = C.emptyCart();
    C.save();
    C.go('/acceso?modo=login');
  };

  /* ---------- Wizard de Onboarding ---------- */
  function onbPage(stepIdx, html, bar, width) {
    return {
      layout: 'wizard', title: ONB_LABELS[stepIdx], width: width || 'wz-w-form',
      tabs: C.buildTabs(ONB_LABELS, stepIdx, C.S.onb.maxStep, 'onbTab'),
      html: html, bar: bar
    };
  }
  function onbGuard(idx) {
    if (C.S.session.loggedIn) return { redirect: '/cuenta/tienda' };
    if (C.S.onb.maxStep < 1) return { redirect: '/acceso?modo=registro' };
    if (idx > C.S.onb.maxStep) return { redirect: '/onboarding/' + ONB_ROUTES[C.S.onb.maxStep] };
    return null;
  }
  A.onbTab = function (el) {
    const i = Number(el.dataset.arg);
    C.go(i === 0 ? '/acceso?modo=registro' : '/onboarding/' + ONB_ROUTES[i]);
  };
  function nextStep(idx) {
    C.S.onb.maxStep = Math.max(C.S.onb.maxStep, idx + 1);
    C.save();
    C.go('/onboarding/' + ONB_ROUTES[idx + 1]);
  }
  function backBtn(idx) {
    return C.btn('Atrás', { action: 'onbTab', arg: idx - 1 });
  }

  /* Paso 2 · Forma jurídica */
  C.route('/onboarding/forma-juridica', function () {
    const g = onbGuard(1); if (g) return g;
    const fj = C.S.onb.fj;
    const cards = C.FORMAS_JURIDICAS.map(function (f) {
      return C.choice({ label: f.label, selected: fj.tipo === f.id, action: 'onbFj', arg: f.id });
    }).join('');
    let fields = '';
    if (fj.tipo === 'natural') {
      fields = C.field({ label: 'CI', bind: 'onb.fj.ci', inputmode: 'numeric', placeholder: 'Ej. 6234517 LP' });
    } else if (fj.tipo) {
      fields = '<div class="form-grid">' +
        C.field({ label: 'Razón social', bind: 'onb.fj.razon', cls: 'span-2', placeholder: 'Ej. Restaurante El Fogón' }) +
        C.field({ label: 'NIT', bind: 'onb.fj.nit', inputmode: 'numeric', placeholder: 'Ej. 4021567018' }) +
        C.field({ label: 'Matrícula de comercio', bind: 'onb.fj.matricula', placeholder: 'Ej. 00385124' }) + '</div>';
    }
    const html = '<h1 class="h1 wz-title">¿Cuál es la forma jurídica de tu negocio?</h1>' +
      '<div class="field' + C.errCls('tipo') + '"><div class="choice-grid cols-3 focus-target" role="radiogroup" aria-label="Forma jurídica" tabindex="-1">' + cards + '</div>' + C.err('tipo') + '</div>' +
      (fields ? '<div class="card card-muted card-pad reveal mt-24">' + fields + '</div>' : '');
    return onbPage(1, html, { left: backBtn(1), right: C.btn('Siguiente', { primary: true, action: 'onbFjNext' }) });
  });
  A.onbFj = function (el) { C.set(function (S) { S.onb.fj.tipo = el.dataset.arg; C.ui.errors = {}; }); };
  A.onbFjNext = function () {
    const fj = C.S.onb.fj, err = {};
    if (!fj.tipo) err.tipo = 'Elige la forma jurídica de tu negocio';
    else if (fj.tipo === 'natural') { if (!fj.ci.trim()) err['onb.fj.ci'] = 'Escribe tu número de CI'; }
    else {
      if (!fj.razon.trim()) err['onb.fj.razon'] = 'Escribe la razón social';
      if (!/^\d{6,}$/.test(fj.nit.replace(/\s/g, ''))) err['onb.fj.nit'] = 'El NIT debe tener solo números';
      if (!fj.matricula.trim()) err['onb.fj.matricula'] = 'Escribe la matrícula de comercio';
    }
    if (Object.keys(err).length) return C.fail(err);
    nextStep(1);
  };

  /* Paso 3 · Sucursales */
  C.route('/onboarding/sucursales', function () {
    const g = onbGuard(2); if (g) return g;
    const s = C.S.onb.suc;
    const html = '<h1 class="h1 wz-title">¿Dónde está tu sucursal?</h1><p class="lead">Selecciona la ubicación en el mapa.</p>' +
      '<div class="mt-24">' + C.map({ interactive: true, action: 'onbMap', pin: s.pin }) + '</div>' +
      '<div class="stack mt-24">' +
      C.field({ label: 'Dirección', bind: 'onb.suc.dir', placeholder: 'Ej. Av. 6 de Agosto 1234', autocomplete: 'street-address' }) +
      C.field({ label: 'Ciudad', bind: 'onb.suc.ciudad', placeholder: 'Ej. La Paz', autocomplete: 'address-level2' }) +
      '</div>';
    return onbPage(2, html, { left: backBtn(2), right: C.btn('Siguiente', { primary: true, action: 'onbSucNext' }) });
  });
  A.onbMap = function (el, ev) {
    const g = C.geocodeFromClick(el, ev);
    C.set(function (S) {
      S.onb.suc.pin = g.pin; S.onb.suc.dir = g.dir; S.onb.suc.ciudad = g.ciudad;
      delete C.ui.errors['onb.suc.dir']; delete C.ui.errors['onb.suc.ciudad'];
    });
    C.toast('Dirección completada desde el mapa');
  };
  A.onbSucNext = function () {
    const s = C.S.onb.suc, err = {};
    if (!s.dir.trim()) err['onb.suc.dir'] = 'Escribe la dirección o toca el mapa';
    if (!s.ciudad.trim()) err['onb.suc.ciudad'] = 'Escribe la ciudad';
    if (Object.keys(err).length) return C.fail(err);
    nextStep(2);
  };

  /* Paso 4 · Recepcionista */
  C.route('/onboarding/recepcionista', function () {
    const g = onbGuard(3); if (g) return g;
    const r = C.S.onb.rec, s = C.S.onb.suc;
    const card = '<div class="big-check' + (r.yoSoy ? ' is-on' : '') + '" role="checkbox" tabindex="0" aria-checked="' + r.yoSoy + '" data-action="onbYoSoy">' +
      '<span class="box" aria-hidden="true">' + C.icon('check', 16) + '</span><span class="big-check-label">Yo soy el recepcionista</span></div>';
    const form = r.yoSoy ? '' :
      '<div class="stack mt-24 reveal">' +
      C.selectField({ label: 'Sucursal', bind: 'ui.draft.onbSuc', value: 'new', options: [{ value: 'new', label: C.sucLabel(s) }] }) +
      '<div class="form-grid">' +
      C.field({ label: 'Nombre recepcionista', bind: 'onb.rec.nombre', placeholder: 'Ej. Juan Pérez' }) +
      C.field({ label: 'Teléfono recepcionista', bind: 'onb.rec.tel', inputmode: 'tel', placeholder: 'Ej. 7012 3456' }) +
      '</div></div>';
    const html = '<h1 class="h1 wz-title">¿Quién recibe los pedidos?</h1>' + card + form;
    return onbPage(3, html, { left: backBtn(3), right: C.btn('Siguiente', { primary: true, action: 'onbRecNext' }) });
  });
  A.onbYoSoy = function () { C.set(function (S) { S.onb.rec.yoSoy = !S.onb.rec.yoSoy; S.onb.rec.touched = true; C.ui.errors = {}; }); };
  A.onbRecNext = function () {
    const r = C.S.onb.rec, err = {};
    if (!r.yoSoy) {
      if (!r.nombre.trim()) err['onb.rec.nombre'] = 'Escribe el nombre de quien recibe';
      if (r.tel.replace(/\D/g, '').length < 7) err['onb.rec.tel'] = 'Escribe un teléfono válido (7 u 8 dígitos)';
    }
    if (Object.keys(err).length) return C.fail(err);
    nextStep(3);
  };

  /* Paso 5 · Crédito Cooltiva (opcional) */
  C.uploadSlot = function (o) {
    const files = C.getPath(o.path) || [];
    const key = o.path;
    const full = !o.multiple ? files.length >= 1 : (o.max && files.length >= o.max);
    const list = files.map(function (f, i) {
      return '<li class="file">' + C.icon('file', 16) + '<span class="file-name">' + e(f.name) + '</span><button type="button" class="file-x" aria-label="Quitar ' + e(f.name) + '" data-action="fileRemove" data-arg="' + key + '|' + i + '">' + C.icon('x', 14) + '</button></li>';
    }).join('');
    const drop = full ? '' :
      '<label class="drop' + (files.length ? ' is-compact' : '') + '">' +
      '<input type="file" class="sr-only" data-file="' + key + '"' + (o.multiple ? ' multiple' : '') + (o.max ? ' data-max="' + o.max + '"' : '') + ' accept="' + (o.accept || '.pdf,image/*') + '">' +
      '<span class="drop-cta">' + (files.length && o.multiple ? '+ Agregar más' : e(o.cta)) + '</span>' +
      (files.length ? '' : '<span class="drop-sub">' + e(o.sub) + '</span>') + '</label>';
    return '<div class="upload' + C.errCls(key) + (o.cls ? ' ' + o.cls : '') + '">' +
      (o.label ? '<p class="upload-label">' + e(o.label) + '</p>' : '') +
      (o.hint ? '<p class="hint">' + e(o.hint) + '</p>' : '') +
      (list ? '<ul class="files">' + list + '</ul>' : '') + drop + C.err(key) + '</div>';
  };

  C.route('/onboarding/credito', function () {
    const g = onbGuard(4); if (g) return g;
    const cr = C.S.onb.cred;
    const info = C.CREDITO_INFO.map(function (c) {
      return '<div class="card card-pad info-card"><span class="info-ico" aria-hidden="true"></span><h3 class="h3">' + e(c.title) + '</h3><p class="muted small">' + e(c.text) + '</p></div>';
    }).join('');
    const docs = cr.solicitar ?
      '<div class="docs reveal">' +
      C.CREDITO_DOCS.map(function (d) {
        return C.uploadSlot({ path: 'onb.cred.docs.' + d.key, label: d.label, hint: d.hint, multiple: d.multiple, max: d.max, cta: d.cta, sub: d.sub });
      }).join('') +
      '<div class="docs-full"><p class="upload-label">Carnet del representante legal</p><p class="hint">Cédula de Identidad, ambas caras</p>' +
      '<div class="docs-pair">' +
      C.uploadSlot({ path: 'onb.cred.docs.anverso', cta: 'Anverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) +
      C.uploadSlot({ path: 'onb.cred.docs.reverso', cta: 'Reverso', sub: 'Subir foto', accept: 'image/*,.pdf' }) +
      '</div></div></div>' : '';
    const html = '<div class="row wz-title-row"><h1 class="h1">Crédito Cooltiva</h1><span class="tag">Opcional</span></div>' +
      '<p class="lead">Puedes saltar este paso y solicitarlo después desde Mi Cuenta.</p>' +
      '<div class="info-grid mt-24">' + info + '</div>' +
      '<div class="card card-pad mt-24' + (cr.solicitar ? ' card-strong' : '') + '">' +
      C.checkbox({ bind: 'onb.cred.solicitar', label: '<strong>Quiero solicitar Crédito Cooltiva</strong>', rerender: true }) +
      docs + '</div>';
    const right = cr.solicitar
      ? C.btn('Saltar este paso', { action: 'onbSkip' }) + C.btn('Confirmar cuenta', { primary: true, action: 'onbConfirm' })
      : C.btn('Saltar este paso', { primary: true, action: 'onbSkip' });
    return onbPage(4, html, { left: backBtn(4), right: right }, 'wz-w-mid');
  });

  C.onFile = function (el) {
    const path = el.dataset.file;
    const max = Number(el.dataset.max || 0);
    const incoming = Array.prototype.map.call(el.files, function (f) { return { name: f.name, size: f.size }; });
    let cur = (C.getPath(path) || []).slice();
    if (el.multiple) cur = cur.concat(incoming); else cur = incoming.slice(0, 1);
    if (max && cur.length > max) { C.toast('Máximo ' + max + ' documentos'); cur = cur.slice(0, max); }
    C.setPath(path, cur);
    delete C.ui.errors[path];
    if (C.onFileExtra) C.onFileExtra(el);
    C.set();
  };
  A.fileRemove = function (el) {
    const parts = el.dataset.arg.split('|');
    const list = (C.getPath(parts[0]) || []).slice();
    list.splice(Number(parts[1]), 1);
    C.setPath(parts[0], list);
    C.set();
  };

  A.onbConfirm = function () {
    const d = C.S.onb.cred.docs, err = {};
    ['nit', 'seprec', 'f200', 'poder', 'anverso', 'reverso'].forEach(function (k) {
      if (!d[k].length) err['onb.cred.docs.' + k] = k === 'anverso' || k === 'reverso' ? 'Sube la foto del ' + k : 'Sube este documento';
    });
    if (Object.keys(err).length) return C.fail(err);
    finishOnboarding(true);
  };
  A.onbSkip = function () { finishOnboarding(false); };

  /* 0 clicks first: sin pantalla de confirmación, directo a la Tienda */
  function finishOnboarding(conCredito) {
    const o = C.S.onb;
    const nombreCompleto = (o.reg.nombre + ' ' + o.reg.apellido).trim();
    const suc = { id: 's1', dir: o.suc.dir, ciudad: o.suc.ciudad, pin: o.suc.pin || { x: 50, y: 50 } };
    const rec = o.rec.yoSoy
      ? { id: 'r1', nombre: nombreCompleto, tel: '', sucursalId: 's1' }
      : { id: 'r1', nombre: o.rec.nombre, tel: o.rec.tel, sucursalId: 's1' };
    // Se crea una empresa nueva (el panel de vendedores la verá como "autoregistro")
    const id = C.uid('emp');
    const now = C.isoDate(C.DEMO_TODAY) + 'T' + new Date().toTimeString().slice(0, 5);
    C.S.empresas[id] = {
      id: id, estado: 'activa', origen: 'autoregistro', creadoPor: 'Autoregistro del cliente', creado: now, actualizado: now,
      empresa: o.fj.razon || nombreCompleto,
      user: { nombre: o.reg.nombre, apellido: o.reg.apellido, rol: o.reg.rol, email: '', wa: '' },
      formaJuridica: C.clone(o.fj),
      sucursales: [suc],
      recepcionistas: [rec],
      empleados: [],
      credito: { estado: conCredito ? 'solicitado' : 'no', linea: 0, plazo: 30, usado: 0, docs: C.clone(o.cred.docs) },
      pedidos: [],
      nextPedido: 1001
    };
    C.S.activeEmpresa = id;
    C.S.panel.log.unshift({ id: C.uid('l'), fecha: now, actor: 'cliente', accion: 'alta', empresaId: id, texto: 'El cliente creó su cuenta por autoregistro' + (conCredito ? ' y solicitó crédito' : '') });
    C.S.session.loggedIn = true;
    C.S.onb = C.emptyOnboarding();
    C.S.cart = C.emptyCart();
    C.save();
    C.go('/cuenta/tienda');
    C.toast(conCredito ? 'Cuenta creada · Recibimos tu solicitud de crédito' : 'Cuenta creada');
  }
})();
