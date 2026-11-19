/* =========================================================
   MODAL DE CUENTA (desde el proceso de compra) y DIÁLOGOS
   Menú contextual izquierda · bloque de edición derecha
   ========================================================= */
(function () {
  const e = C.esc;
  const A = C.actions;
  const SECTIONS = [
    { id: 'sucursales', label: 'Sucursales' },
    { id: 'recepcionistas', label: 'Recepcionistas' },
    { id: 'credito', label: 'Crédito' },
    { id: 'empleados', label: 'Empleados' },
    { id: 'configuracion', label: 'Configuración' }
  ];

  /* arg: 'suc:new' | 'suc:<id>' | 'rec:new' | 'rec:<id>' | 'credito' | '<seccion>' */
  C.openModal = function (arg) {
    const ui = C.ui;
    if (C.S.acting && arg !== 'credito') { C.toast('En modo vendedor, estos datos se editan desde el panel y pasan por aprobación'); return; }
    ui.errors = {};
    const [kind, id] = arg.split(':');
    if (kind === 'suc') {
      ui.modal = { section: 'sucursales', view: id === 'new' ? 'new' : 'edit', id: id === 'new' ? null : id, origin: 'direct' };
      const s = id !== 'new' ? C.sucById(id) : null;
      ui.draft = s ? { dir: s.dir, ciudad: s.ciudad, pin: s.pin } : { dir: '', ciudad: '', pin: null };
    } else if (kind === 'rec') {
      ui.modal = { section: 'recepcionistas', view: id === 'new' ? 'new' : 'edit', id: id === 'new' ? null : id, origin: 'direct' };
      const r = id !== 'new' ? C.recById(id) : null;
      ui.draft = r ? { sucursalId: r.sucursalId, nombre: r.nombre, tel: r.tel } : C.newRecepDraft(C.S.cart.sucursalId);
    } else {
      ui.modal = { section: kind === 'credito' ? 'credito' : kind, view: 'list', id: null, origin: 'direct' };
      ui.draft = {};
    }
    C.renderOverlays();
  };
  A.openModal = function (el) { C.openModal(el.dataset.arg); };
  A.closeModal = function () {
    C.ui.modal = null; C.ui.errors = {}; C.ui.draft = {}; C.ui.invited = null; C.ui.editing = null;
    C.renderOverlays();
  };
  A.modalSection = function (el) {
    C.ui.modal = { section: el.dataset.arg, view: 'list', id: null, origin: 'nav' };
    C.ui.errors = {}; C.ui.draft = {}; C.ui.invited = null; C.ui.editing = null;
    C.renderOverlays();
  };
  A.modalGo = function (el) {  // desde un listado del modal: editar o crear
    const [kind, id] = el.dataset.arg.split(':');
    C.openModal(el.dataset.arg);
    C.ui.modal.origin = 'nav';
    C.renderOverlays();
  };
  A.modalCancel = function () {
    if (C.ui.modal.origin === 'direct') return A.closeModal();
    C.ui.modal.view = 'list'; C.ui.modal.id = null; C.ui.errors = {};
    C.renderOverlays();
  };
  A.modalRecModo = function (el) { C.ui.draft.modo = el.dataset.arg; C.ui.errors = {}; C.renderOverlays(); };
  A.modalRecPick = function (el) { C.ui.draft.pickId = el.dataset.arg; delete C.ui.errors.pickId; C.renderOverlays(); };

  function modalFail(err) { C.ui.errors = err; C.renderOverlays(); const f = document.querySelector('.modal .has-error input, .modal .has-error select, .modal .has-error'); if (f && f.focus) f.focus(); return false; }

  A.modalSave = function () {
    const m = C.ui.modal;
    if (m.section === 'sucursales') {
      const err = C.validateSucursal();
      if (Object.keys(err).length) return modalFail(err);
      const s = C.saveSucursal(m.id);
      if (!m.id) C.selectSucursal(s.id);   // la sucursal nueva queda elegida para el pedido
      C.toast(m.id ? 'Sucursal actualizada' : 'Sucursal creada y elegida');
    } else if (m.section === 'recepcionistas') {
      const mode = m.view === 'edit' ? 'edit' : 'new';
      const err = C.validateRecep(mode);
      if (Object.keys(err).length) return modalFail(err);
      const r = C.saveRecep(mode, m.id);
      if (mode !== 'edit' && r.sucursalId === C.S.cart.sucursalId) C.S.cart.recepId = r.id;
      C.toast(mode === 'edit' ? 'Recepcionista actualizado' : 'Recepcionista agregado');
    }
    if (m.origin === 'direct') { C.ui.modal = null; C.ui.draft = {}; }
    else { m.view = 'list'; m.id = null; }
    C.ui.errors = {};
    C.set();
  };
  A.modalDelete = function () {
    const m = C.ui.modal;
    if (m.section === 'sucursales') C.confirmDeleteSucursal(m.id, 'modal');
    else C.confirmDeleteRecep(m.id, 'modal');
  };

  /* ---------- Contenido por sección ---------- */
  function content(m) {
    const a = C.S.account;
    const fromPago = C.currentPath() === '/compra/pago';
    const close = C.btn('Cerrar', { action: 'closeModal' });
    if (m.section === 'sucursales') {
      if (m.view === 'list') {
        return {
          title: 'Sucursales',
          body: '<div class="item-list">' + a.sucursales.map(function (s) {
            return '<article class="card item-card suc-card"><div class="suc-thumb">' + C.map({ small: true, pin: s.pin }) + '</div><div class="item-main"><strong>' + e(s.dir) + '</strong><span class="muted">' + e(s.ciudad) + '</span></div>' +
              '<div class="item-actions">' + C.link('Editar', 'modalGo', 'suc:' + s.id) + '</div></article>';
          }).join('') + '</div><button type="button" class="btn btn-dashed mt-16" data-action="modalGo" data-arg="suc:new">+ Nueva sucursal</button>',
          right: close
        };
      }
      return {
        title: m.view === 'new' ? 'Nueva sucursal' : 'Editar sucursal',
        body: C.sucursalFields().replace('data-action="draftMap"', 'data-action="modalMap"'),
        left: m.view === 'edit' ? C.link('Eliminar sucursal', 'modalDelete') : '',
        right: C.btn('Cancelar', { action: 'modalCancel' }) + C.btn(m.view === 'new' ? 'Guardar sucursal' : 'Guardar cambios', { primary: true, action: 'modalSave' })
      };
    }
    if (m.section === 'recepcionistas') {
      if (m.view === 'list') {
        return {
          title: 'Recepcionistas',
          body: '<div class="item-list">' + a.recepcionistas.map(function (r) {
            const s = C.sucById(r.sucursalId);
            return '<article class="card item-card"><div class="item-main"><strong>' + e(r.nombre) + '</strong><span class="muted">' + e(r.tel || 'Sin teléfono') + '</span><span class="muted small">Sucursal: ' + e(s ? s.dir : '—') + '</span></div>' +
              '<div class="item-actions">' + C.link('Editar', 'modalGo', 'rec:' + r.id) + '</div></article>';
          }).join('') + '</div><button type="button" class="btn btn-dashed mt-16" data-action="modalGo" data-arg="rec:new">+ Agregar recepcionista</button>',
          right: close
        };
      }
      if (m.view === 'new') {
        // En el modal siempre se crea uno nuevo; la sucursal se elige arriba
        return {
          title: 'Agregar recepcionista',
          body: C.recepEditFields(),
          right: C.btn('Cancelar', { action: 'modalCancel' }) + C.btn('Guardar recepcionista', { primary: true, action: 'modalSave' })
        };
      }
      return {
        title: 'Editar recepcionista',
        body: C.recepEditFields(),
        left: C.link('Eliminar recepcionista', 'modalDelete'),
        right: C.btn('Cancelar', { action: 'modalCancel' }) + C.btn('Guardar cambios', { primary: true, action: 'modalSave' })
      };
    }
    if (m.section === 'credito') {
      return {
        title: 'Crédito Cooltiva',
        body: C.creditoContent(),
        right: fromPago ? C.btn('Volver al pago', { primary: true, action: 'closeModal' }) : close
      };
    }
    if (m.section === 'empleados') {
      // En el modal los empleados no se editan: se invita y se consulta la lista
      return { title: C.ui.invited ? 'Invitación enviada' : 'Agregar empleado', body: C.empleadosContent({ noEdit: true }), right: close };
    }
    return { title: 'Configuración', body: C.pending('Configuración'), right: close };
  }
  A.modalMap = function (el, ev) {
    const g = C.geocodeFromClick(el, ev);
    C.ui.draft.pin = g.pin; C.ui.draft.dir = g.dir; C.ui.draft.ciudad = g.ciudad;
    delete C.ui.errors['ui.draft.dir']; delete C.ui.errors['ui.draft.ciudad'];
    C.renderOverlays();
  };
  C.live.modalRerender = function () { C.renderOverlays(); };

  C.renderModal = function () {
    const m = C.ui.modal;
    const c = content(m);
    const nav = SECTIONS.map(function (s) {
      const on = s.id === m.section;
      return '<button type="button" class="modal-link' + (on ? ' is-active' : '') + '"' + (on ? ' aria-current="true"' : '') + ' data-action="modalSection" data-arg="' + s.id + '">' + s.label + '</button>';
    }).join('');
    return '<div class="overlay modal-overlay" data-action="closeModal"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<nav class="modal-nav" aria-label="Secciones de tu cuenta"><p class="eyebrow modal-eyebrow">Modificar</p><div class="modal-links">' + nav + '</div></nav>' +
      '<section class="modal-panel"><header class="modal-head"><h2 class="h2" id="modal-title">' + e(c.title) + '</h2>' +
      '<button type="button" class="icon-btn" aria-label="Cerrar" data-action="closeModal">' + C.icon('x', 20) + '</button></header>' +
      '<div class="modal-body">' + c.body + '</div>' +
      '<footer class="modal-foot"><div class="modal-foot-left">' + (c.left || '') + '</div><div class="modal-foot-right">' + (c.right || '') + '</div></footer>' +
      '</section></div>';
  };
  C.mountModal = function () {
    const act = document.querySelector('.modal-links .is-active');
    if (act && act.parentElement.scrollWidth > act.parentElement.clientWidth) act.parentElement.scrollLeft = act.offsetLeft - 16;
    if (!C.ui.errors || !Object.keys(C.ui.errors).length) {
      const panel = document.querySelector('.modal-head .icon-btn');
      if (panel && !document.querySelector('.modal').contains(document.activeElement)) panel.focus({ preventScroll: true });
    }
  };

  /* ---------- Diálogo de confirmación ---------- */
  C.renderDialog = function () {
    const d = C.ui.dialog;
    return '<div class="overlay dialog-overlay" data-action="dialogCancel"></div>' +
      '<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b">' +
      '<div class="dialog-icon">' + C.icon('trash', 22) + '</div>' +
      '<h2 class="h2" id="dlg-t">' + e(d.title) + '</h2><p class="dialog-body" id="dlg-b">' + d.body + '</p>' +
      '<div class="dialog-actions">' + C.btn('Cancelar', { action: 'dialogCancel', id: 'dlg-cancel' }) + C.btn(d.confirm, { primary: true, action: d.action, arg: d.arg }) + '</div></div>';
  };
  A.dialogCancel = function () { C.ui.dialog = null; C.renderOverlays(); };
})();
