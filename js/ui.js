/* =========================================================
   COMPONENTES DE UI (devuelven HTML como string)
   ========================================================= */
(function () {
  const e = C.esc;

  C.icon = function (name, size) {
    size = size || 20;
    const s = 'width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const p = {
      menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
      x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      check: '<path d="M20 6 9 17l-5-5"/>',
      chevDown: '<path d="m6 9 6 6 6-6"/>',
      chevUp: '<path d="m18 15-6-6-6 6"/>',
      chevLeft: '<path d="m15 18-6-6 6-6"/>',
      chevRight: '<path d="m9 18 6-6-6-6"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
      file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
      alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
      pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
      download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
      external: '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
      refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
      map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
      phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
      monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
      trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
      bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
      building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
      plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
      inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
      store: '<path d="M3 9 4.5 4h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/>',
      arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
      arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
      msg: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.7A8.5 8.5 0 1 1 21 11.5z"/>',
      fileText: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
      dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
    };
    return '<svg ' + s + '>' + (p[name] || '') + '</svg>';
  };

  C.logo = function (href) {
    return '<a class="ct-logo" href="' + (href || '#/') + '" aria-label="Cooltiva, ir a la tienda"><img src="assets/logo-cooltiva.png" alt="Cooltiva" width="120" height="34"></a>';
  };

  C.err = function (key) {
    const m = C.ui.errors[key];
    return m ? '<p class="field-error">' + C.icon('alert', 14) + '<span>' + e(m) + '</span></p>' : '';
  };
  C.errCls = function (key) { return C.ui.errors[key] ? ' has-error' : ''; };

  /* Campo de texto con etiqueta */
  C.field = function (o) {
    const key = o.err || o.bind;
    const val = o.value != null ? o.value : (o.bind ? C.getPath(o.bind) : '');
    const id = 'f-' + (o.bind || o.name || Math.random()).toString().replace(/\W/g, '-');
    const attrs = [
      'id="' + id + '"',
      'class="input"',
      o.bind ? 'data-bind="' + o.bind + '"' : '',
      o.err ? 'data-err="' + o.err + '"' : '',
      o.live ? 'data-live="' + o.live + '"' : '',
      o.numeric ? 'data-numeric inputmode="decimal"' : '',
      o.inputmode ? 'inputmode="' + o.inputmode + '"' : '',
      'type="' + (o.type || 'text') + '"',
      o.placeholder ? 'placeholder="' + e(o.placeholder) + '"' : '',
      o.autocomplete ? 'autocomplete="' + o.autocomplete + '"' : '',
      'value="' + e(val || '') + '"'
    ].join(' ');
    const control = o.textarea
      ? '<textarea ' + attrs.replace('class="input"', 'class="input textarea"').replace(/type="[^"]*"/, '').replace(/value="[^"]*"/, '') + ' rows="' + (o.rows || 3) + '">' + e(val || '') + '</textarea>'
      : '<input ' + attrs + '>';
    return '<div class="field' + C.errCls(key) + (o.cls ? ' ' + o.cls : '') + '">' +
      '<label class="label" for="' + id + '">' + e(o.label) + '</label>' + control +
      (o.hint ? '<p class="hint">' + e(o.hint) + '</p>' : '') + C.err(key) + '</div>';
  };

  C.selectField = function (o) {
    const key = o.err || o.bind;
    const val = o.value != null ? o.value : C.getPath(o.bind);
    const id = 'f-' + o.bind.replace(/\W/g, '-');
    return '<div class="field' + C.errCls(key) + '"><label class="label" for="' + id + '">' + e(o.label) + '</label>' +
      '<div class="select-wrap"><select id="' + id + '" class="input select" data-bind="' + o.bind + '"' + (o.rerender ? ' data-rerender' : '') + (o.live ? ' data-live="' + o.live + '"' : '') + '>' +
      (o.placeholder ? '<option value="">' + e(o.placeholder) + '</option>' : '') +
      o.options.map(function (op) { return '<option value="' + e(op.value) + '"' + (String(op.value) === String(val) ? ' selected' : '') + '>' + e(op.label) + '</option>'; }).join('') +
      '</select>' + C.icon('chevDown', 16) + '</div>' + C.err(key) + '</div>';
  };

  /* Tarjeta seleccionable tipo radio */
  C.choice = function (o) {
    return '<div class="choice' + (o.selected ? ' is-selected' : '') + (o.disabled ? ' is-disabled' : '') + (o.cls ? ' ' + o.cls : '') + '" role="radio" tabindex="0" aria-checked="' + (o.selected ? 'true' : 'false') + '"' +
      (o.disabled ? ' aria-disabled="true"' : '') + ' data-action="' + o.action + '" data-arg="' + e(o.arg) + '">' +
      '<span class="radio" aria-hidden="true"></span><span class="choice-body"><span class="choice-label">' + e(o.label) + '</span>' +
      (o.sub ? '<span class="choice-sub">' + o.sub + '</span>' : '') + '</span>' +
      (o.aside ? '<span class="choice-aside">' + o.aside + '</span>' : '') + '</div>';
  };

  C.checkbox = function (o) {
    return '<div class="check-wrap' + C.errCls(o.err || o.bind) + '"><label class="check' + (o.cls ? ' ' + o.cls : '') + '"><input type="checkbox" data-bind="' + o.bind + '"' + (o.err ? ' data-err="' + o.err + '"' : '') + (C.getPath(o.bind) ? ' checked' : '') + (o.rerender ? ' data-rerender' : '') + (o.live ? ' data-live="' + o.live + '"' : '') + '>' +
      '<span class="box" aria-hidden="true">' + C.icon('check', 14) + '</span><span class="check-label">' + o.label + '</span></label>' + C.err(o.err || o.bind) + '</div>';
  };

  C.segmented = function (o) {
    return '<div class="seg' + (o.cls ? ' ' + o.cls : '') + '" role="radiogroup"' + (o.aria ? ' aria-label="' + e(o.aria) + '"' : '') + '>' + o.options.map(function (op) {
      const on = String(op.value) === String(o.value);
      return '<button type="button" class="seg-btn' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-action="' + o.action + '" data-arg="' + e(op.value) + '">' + e(op.label) + '</button>';
    }).join('') + '</div>';
  };

  C.btn = function (label, o) {
    o = o || {};
    const cls = 'btn' + (o.primary ? ' btn-primary' : '') + (o.ghost ? ' btn-ghost' : '') + (o.block ? ' btn-block' : '') + (o.sm ? ' btn-sm' : '') + (o.cls ? ' ' + o.cls : '');
    return '<button type="button" class="' + cls + '"' + (o.action ? ' data-action="' + o.action + '"' : '') + (o.arg != null ? ' data-arg="' + e(o.arg) + '"' : '') +
      (o.disabled ? ' disabled' : '') + (o.id ? ' id="' + o.id + '"' : '') + '>' + (o.icon ? C.icon(o.icon, 18) : '') + '<span>' + e(label) + '</span></button>';
  };
  C.link = function (label, action, arg, cls) {
    return '<button type="button" class="link' + (cls ? ' ' + cls : '') + '" data-action="' + action + '"' + (arg != null ? ' data-arg="' + e(arg) + '"' : '') + '>' + e(label) + '</button>';
  };

  /* Placeholder rayado (foto) */
  C.ph = function (label, cls) {
    return '<div class="ph' + (cls ? ' ' + cls : '') + '"><span>' + e(label || '') + '</span></div>';
  };

  /* Mapa simulado: un pin posicionable */
  C.map = function (o) {
    o = o || {};
    const pin = o.pin;
    return '<div class="map' + (o.small ? ' map-sm' : '') + (o.interactive ? ' is-interactive' : '') + (o.cls ? ' ' + o.cls : '') + '"' +
      (o.interactive ? ' data-action="' + o.action + '" role="button" tabindex="0" aria-label="Seleccionar ubicación en el mapa"' : '') + '>' +
      '<span class="map-streets" aria-hidden="true"></span>' +
      (pin ? '<span class="map-pin" style="left:' + pin.x + '%;top:' + pin.y + '%"></span>'
           : (o.interactive ? '<span class="map-hint">' + C.icon('pin', 18) + 'Toca el mapa para ubicar tu sucursal</span>' : '')) +
      '</div>';
  };

  C.success = function (title, body, actions) {
    return '<div class="success"><div class="success-icon">' + C.icon('check', 30) + '</div><h2 class="h2">' + e(title) + '</h2>' +
      (body ? '<p class="success-body">' + body + '</p>' : '') + (actions ? '<div class="success-actions">' + actions + '</div>' : '') + '</div>';
  };

  C.pending = function (title, text) {
    return '<div class="pending"><span class="tag">Pendiente de definición</span><h2 class="h2">' + e(title) + '</h2><p class="muted">' + e(text || 'El contenido de esta sección aún no está definido en la arquitectura de información.') + '</p></div>';
  };

  C.sucLabel = function (s) { return s ? s.dir + ', ' + s.ciudad : ''; };
  C.sucById = function (id) { return C.S.account.sucursales.find(function (s) { return s.id === id; }); };
  C.recById = function (id) { return C.S.account.recepcionistas.find(function (r) { return r.id === id; }); };

  /* Valor del mapa simulado: devuelve dirección "geocodificada" */
  C.geocodeFromClick = function (el, ev) {
    const r = el.getBoundingClientRect();
    let x = 50, y = 50;
    if (ev && ev.clientX) { x = Math.round(((ev.clientX - r.left) / r.width) * 100); y = Math.round(((ev.clientY - r.top) / r.height) * 100); }
    x = Math.min(94, Math.max(6, x)); y = Math.min(90, Math.max(10, y));
    const g = C.MAP_GEOCODE[(x + y) % C.MAP_GEOCODE.length];
    return { pin: { x: x, y: y }, dir: g.dir, ciudad: g.ciudad };
  };

  C.credito = function () {
    const c = C.S.account.credito;
    return { linea: c.linea, plazo: c.plazo, disponible: c.linea - c.usado, estado: c.estado };
  };

  C.creditoAprobado = function (o) {
    o = o || {};
    const c = C.credito();
    return '<div class="credit-ok">' +
      '<div class="success-icon">' + C.icon('check', 30) + '</div>' +
      '<h2 class="h2">Tu crédito está aprobado</h2>' +
      '<div class="stat-row">' +
      '<div class="stat"><span class="stat-label">Línea aprobada</span><strong class="stat-value">' + C.bs(c.linea) + '</strong></div>' +
      '<div class="stat"><span class="stat-label">Plazo configurado</span><strong class="stat-value">' + c.plazo + ' días</strong></div>' +
      '<div class="stat"><span class="stat-label">Disponible</span><strong class="stat-value">' + C.bs(c.disponible) + '</strong></div>' +
      '</div></div>';
  };
})();
