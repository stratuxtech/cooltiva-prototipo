/* =========================================================
   PANEL DE VENDEDORES · datos semilla y motor de cambios
   Todo cambio del vendedor es una lista de "operaciones" que
   queda en borrador → se envía a aprobación → se aplica.
   ========================================================= */
(function () {
  const pin = function (x, y) { return { x: x, y: y }; };

  C.DOC_KEYS = ['nit', 'seprec', 'f200', 'poder', 'anverso', 'reverso'];
  C.DOC_LABELS = { nit: 'NIT (Padrón SIN)', seprec: 'SEPREC (Matrícula)', f200: 'Formularios 200/400', poder: 'Poder del representante', anverso: 'Carnet · anverso', reverso: 'Carnet · reverso' };
  C.fullDocs = function () {
    return {
      nit: [{ name: 'padron-sin.pdf' }], seprec: [{ name: 'matricula-seprec.pdf' }],
      f200: [{ name: 'f200-agosto.pdf' }, { name: 'f200-septiembre.pdf' }, { name: 'f200-octubre.pdf' }],
      poder: [{ name: 'testimonio-poder.pdf' }], anverso: [{ name: 'ci-anverso.jpg' }], reverso: [{ name: 'ci-reverso.jpg' }]
    };
  };
  C.emptyDocs = function () { return { nit: [], seprec: [], f200: [], poder: [], anverso: [], reverso: [] }; };

  C.PERSONAS = [
    { id: 'fabiana', nombre: 'Fabiana Paz', rol: 'Vendedora', email: 'fabiana.paz@cooltiva.bo', wa: '+591 7600 1001' },
    { id: 'jorge', nombre: 'Jorge Llorenti', rol: 'Vendedor', email: 'jorge.llorenti@cooltiva.bo', wa: '+591 7600 1002' },
    { id: 'sup', nombre: 'Supervisor comercial', rol: 'Aprobador · por definir', email: 'supervision@cooltiva.bo', wa: '+591 7600 1000' }
  ];

  C.seedEmpresas = function () {
    const fogon = C.seedAccount();
    const hotel = {
      id: 'hotel', estado: 'activa', origen: 'vendedor', creadoPor: 'Jorge Llorenti', creado: '2026-08-14T11:00', actualizado: '2026-11-10T09:30',
      empresa: 'Hotel Río Piraí',
      user: { nombre: 'Marcelo', apellido: 'Suárez', rol: 'Administrador', email: 'compras@hotelriopirai.bo', wa: '+591 7712 3344' },
      formaJuridica: { tipo: 'sociedad', ci: '', razon: 'Hotelera Río Piraí S.A.', nit: '1023456027', matricula: '00214587' },
      sucursales: [
        { id: 'h1', dir: 'Av. San Martín 1890, Equipetrol', ciudad: 'Santa Cruz de la Sierra', pin: pin(40, 38) },
        { id: 'h2', dir: '4to anillo, Av. Banzer 3200', ciudad: 'Santa Cruz de la Sierra', pin: pin(66, 30) }
      ],
      recepcionistas: [
        { id: 'hr1', nombre: 'Daniela Ortiz', tel: '7788 1122', sucursalId: 'h1' },
        { id: 'hr2', nombre: 'Óscar Vaca', tel: '7790 5566', sucursalId: 'h2' }
      ],
      empleados: [{ id: 'he1', nombre: 'Lucía', apellido: 'Justiniano', rol: 'Encargado de compra', email: 'lucia.j@hotelriopirai.bo', wa: '+591 7000 1101' }],
      credito: { estado: 'aprobado', linea: 25000, plazo: 30, usado: 8400, docs: C.fullDocs() },
      pedidos: [
        { id: 2210, creado: '2026-11-10T08:05', entregaFecha: '2026-11-11', franja: '06:00–08:00', sucursal: 'Av. San Martín 1890, Equipetrol', recepcionista: 'Daniela Ortiz', pago: 'Crédito Cooltiva', total: 8400, porVendedor: 'Jorge Llorenti',
          items: [{ name: 'Papa', config: 'Primera · Lavada · Con reposición', qty: '90 @', price: 7300 }, { name: 'Café', config: 'Super · Lavada · Con reposición', qty: '14 kg', price: 1100 }] }
      ],
      nextPedido: 2211
    };
    const donarosa = {
      id: 'donarosa', estado: 'activa', origen: 'autoregistro', creadoPor: 'Autoregistro del cliente', creado: '2026-10-03T19:20', actualizado: '2026-11-05T12:00',
      empresa: 'Pollos Doña Rosa',
      user: { nombre: 'Rosa', apellido: 'Gutiérrez', rol: 'Dueño', email: 'rosa.gutierrez@gmail.com', wa: '+591 7140 8899' },
      formaJuridica: { tipo: 'unipersonal', ci: '', razon: 'Pollos Doña Rosa', nit: '5543219013', matricula: '00451230' },
      sucursales: [{ id: 'd1', dir: 'Calle España 350', ciudad: 'Cochabamba', pin: pin(52, 46) }],
      recepcionistas: [{ id: 'dr1', nombre: 'Rosa Gutiérrez', tel: '7140 8899', sucursalId: 'd1' }],
      empleados: [],
      credito: { estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.emptyDocs() },
      pedidos: [
        { id: 3102, creado: '2026-11-05T11:40', entregaFecha: '2026-11-06', franja: '07:00–09:00', sucursal: 'Calle España 350', recepcionista: 'Rosa Gutiérrez', pago: 'Contraentrega', total: 2140,
          items: [{ name: 'Papa', config: 'Segunda · Natural · Sin reposición', qty: '25 @', price: 2140 }] }
      ],
      nextPedido: 3103
    };
    const altura = {
      id: 'altura', estado: 'activa', origen: 'autoregistro', creadoPor: 'Autoregistro del cliente', creado: '2026-11-15T16:45', actualizado: '2026-11-15T16:45',
      empresa: 'Café Altura',
      user: { nombre: 'Tomás', apellido: 'Arteaga', rol: 'Encargado de compra', email: 'tomas@cafealtura.bo', wa: '+591 7255 6677' },
      formaJuridica: { tipo: 'natural', ci: '7834521 SC', razon: '', nit: '', matricula: '' },
      sucursales: [{ id: 'a1', dir: 'Av. Monseñor Rivero 220', ciudad: 'Santa Cruz de la Sierra', pin: pin(48, 60) }],
      recepcionistas: [{ id: 'ar1', nombre: 'Tomás Arteaga', tel: '7255 6677', sucursalId: 'a1' }],
      empleados: [],
      credito: { estado: 'solicitado', linea: 0, plazo: 30, usado: 0, docs: { nit: [{ name: 'padron.pdf' }], seprec: [], f200: [{ name: 'f200-oct.pdf' }], poder: [], anverso: [{ name: 'ci-a.jpg' }], reverso: [{ name: 'ci-b.jpg' }] } },
      pedidos: [], nextPedido: 4001
    };
    const andino = {
      id: 'andino', estado: 'pendiente_alta', origen: 'vendedor', creadoPor: 'Jorge Llorenti', creado: '2026-11-18T09:12', actualizado: '2026-11-18T09:12',
      empresa: 'Catering Andino',
      user: { nombre: 'Verónica', apellido: 'Choque', rol: 'Dueño', email: 'veronica@cateringandino.bo', wa: '+591 7321 4455' },
      formaJuridica: { tipo: 'sociedad', ci: '', razon: 'Catering Andino S.R.L.', nit: '3345678015', matricula: '00398871' },
      sucursales: [{ id: 'c1', dir: 'Av. Arce 2631, Sopocachi', ciudad: 'La Paz', pin: pin(36, 52) }],
      recepcionistas: [{ id: 'cr1', nombre: 'Germán Quisbert', tel: '7322 0909', sucursalId: 'c1' }],
      empleados: [{ id: 'ce1', nombre: 'Iván', apellido: 'Copa', rol: 'Encargado de compra', email: 'compras@cateringandino.bo', wa: '+591 7322 1010' }],
      credito: { estado: 'aprobado', linea: 15000, plazo: 45, usado: 0, docs: C.fullDocs() },
      pedidos: [], nextPedido: 5001
    };
    return { fogon: fogon, hotel: hotel, donarosa: donarosa, altura: altura, andino: andino };
  };

  C.seedPanel = function (empresas) {
    const h = empresas.hotel;
    const requests = [
      { id: 107, tipo: 'alta', empresaId: 'andino', empresaNombre: 'Catering Andino', autor: 'jorge', revisor: 'fabiana', estado: 'pendiente',
        fecha: '2026-11-18T09:12', notificar: true, nota: 'Cliente captado en la feria gastronómica de La Paz. Entregó los documentos de crédito en papel; están escaneados.', ops: [] },
      { id: 106, tipo: 'cambios', empresaId: 'hotel', empresaNombre: 'Hotel Río Piraí', autor: 'jorge', revisor: 'fabiana', estado: 'pendiente',
        fecha: '2026-11-17T17:30', notificar: true, nota: 'El hotel amplió la cocina de la sucursal del 4to anillo y pidió más línea de crédito.',
        ops: [
          { op: 'update', coll: 'sucursales', id: 'h2', value: { dir: 'Av. Banzer 3350, 4to anillo' }, before: C.clone(h.sucursales[1]) },
          { op: 'add', coll: 'recepcionistas', item: { id: 'hr3', nombre: 'Paola Rivero', tel: '7701 2233', sucursalId: 'h2' } },
          { op: 'set', path: 'credito', value: Object.assign(C.clone(h.credito), { linea: 30000 }), before: C.clone(h.credito) }
        ] },
      { id: 105, tipo: 'cambios', empresaId: 'fogon', empresaNombre: 'Restaurante El Fogón', autor: 'fabiana', revisor: 'jorge', estado: 'aprobada',
        fecha: '2026-11-12T15:10', revisado: '2026-11-12T15:40', comentario: 'Confirmado por llamada con Carla.', notificar: true,
        nota: 'María Quispe cambió de número.', ops: [
          { op: 'update', coll: 'recepcionistas', id: 'r2', value: { tel: '7145 9821' }, before: { id: 'r2', nombre: 'María Quispe', tel: '7145 0000', sucursalId: 's1' } }
        ] },
      { id: 104, tipo: 'cambios', empresaId: 'donarosa', empresaNombre: 'Pollos Doña Rosa', autor: 'fabiana', revisor: 'sup', estado: 'rechazada',
        fecha: '2026-11-06T10:00', revisado: '2026-11-06T18:20', comentario: 'Faltan los formularios 200/400 de los últimos 3 meses. Volver a enviar cuando estén.', notificar: false,
        nota: 'Doña Rosa pidió crédito por teléfono.', ops: [
          { op: 'set', path: 'credito', value: { estado: 'aprobado', linea: 5000, plazo: 30, usado: 0, docs: C.emptyDocs() }, before: C.clone(empresas.donarosa.credito) }
        ] }
    ];
    const log = [
      { id: 'l9', fecha: '2026-11-18T09:12', actor: 'jorge', accion: 'envio', empresaId: 'andino', req: 107, texto: 'Envió el alta de la cuenta a aprobación de Fabiana Paz' },
      { id: 'l8', fecha: '2026-11-17T17:30', actor: 'jorge', accion: 'envio', empresaId: 'hotel', req: 106, texto: 'Envió 3 cambios a aprobación de Fabiana Paz' },
      { id: 'l7', fecha: '2026-11-15T16:45', actor: 'cliente', accion: 'alta', empresaId: 'altura', texto: 'El cliente creó su cuenta por autoregistro y solicitó crédito' },
      { id: 'l6', fecha: '2026-11-12T15:41', actor: 'sistema', accion: 'notificacion', empresaId: 'fogon', req: 105, texto: 'Se notificó al cliente por correo (carla.rojas@restaurante.bo)' },
      { id: 'l5', fecha: '2026-11-12T15:40', actor: 'jorge', accion: 'aprobacion', empresaId: 'fogon', req: 105, texto: 'Aprobó y aplicó 1 cambio' },
      { id: 'l4', fecha: '2026-11-12T15:10', actor: 'fabiana', accion: 'envio', empresaId: 'fogon', req: 105, texto: 'Envió 1 cambio a aprobación de Jorge Llorenti' },
      { id: 'l3', fecha: '2026-11-10T08:05', actor: 'jorge', accion: 'pedido', empresaId: 'hotel', texto: 'Creó el pedido #2210 para el cliente (Bs 8.400)' },
      { id: 'l2', fecha: '2026-11-06T18:20', actor: 'sup', accion: 'rechazo', empresaId: 'donarosa', req: 104, texto: 'Rechazó 1 cambio: faltan formularios 200/400' },
      { id: 'l1', fecha: '2026-11-06T10:00', actor: 'fabiana', accion: 'envio', empresaId: 'donarosa', req: 104, texto: 'Envió 1 cambio a aprobación de Supervisor comercial' }
    ];
    return { loggedIn: false, persona: 'fabiana', equipo: C.clone(C.PERSONAS), drafts: {}, requests: requests, log: log, nueva: C.emptyNueva(), nextReq: 108 };
  };

  C.emptyNueva = function () {
    return {
      maxStep: 0,
      contacto: { empresa: '', nombre: '', apellido: '', rol: '', email: '', wa: '' },
      fj: { tipo: '', ci: '', razon: '', nit: '', matricula: '' },
      sucursales: [], recepcionistas: [],
      credito: { con: 'no', linea: '', plazo: '30', docs: C.emptyDocs() },
      revisor: '', notificar: true, nota: ''
    };
  };

  /* ===================== Motor de operaciones ===================== */
  /* op: {op:'set', path, value, before} | {op:'add', coll, item} |
         {op:'update', coll, id, value, before} | {op:'remove', coll, id, before} */
  C.applyOps = function (emp, ops) {
    (ops || []).forEach(function (o) {
      if (o.op === 'set') emp[o.path] = C.clone(o.value);
      else if (o.op === 'add') emp[o.coll].push(C.clone(o.item));
      else if (o.op === 'update') {
        const i = emp[o.coll].findIndex(function (x) { return x.id === o.id; });
        if (i > -1) emp[o.coll][i] = Object.assign({}, emp[o.coll][i], C.clone(o.value));
      } else if (o.op === 'remove') {
        emp[o.coll] = emp[o.coll].filter(function (x) { return x.id !== o.id; });
        if (o.coll === 'sucursales') emp.recepcionistas = emp.recepcionistas.filter(function (r) { return r.sucursalId !== o.id; });
      }
    });
    return emp;
  };

  C.persona = function (id) { return C.S.panel.equipo.find(function (p) { return p.id === (id || C.S.panel.persona); }) || { id: id, nombre: id === 'cliente' ? 'Cliente' : (id === 'sistema' ? 'Sistema' : id), rol: '' }; };
  C.empresa = function (id) { return C.S.empresas[id]; };
  C.draftOps = function (empId) { const d = C.S.panel.drafts[empId]; return d ? d.ops : []; };

  /* Vista de la empresa con el borrador aplicado (lo que verá si se aprueba) */
  C.empView = function (empId) {
    return C.applyOps(C.clone(C.empresa(empId)), C.draftOps(empId));
  };

  /* Agrega una operación al borrador fusionando con las existentes */
  C.draftAdd = function (empId, op) {
    const base = C.empresa(empId);
    const panel = C.S.panel;
    const d = panel.drafts[empId] || (panel.drafts[empId] = { ops: [] });
    const same = function (o) { return o.coll === op.coll && (o.id === op.id || (o.item && o.item.id === op.id)); };
    if (op.op === 'set') {
      const ex = d.ops.find(function (o) { return o.op === 'set' && o.path === op.path; });
      if (ex) ex.value = C.clone(op.value);
      else d.ops.push({ op: 'set', path: op.path, value: C.clone(op.value), before: C.clone(base[op.path]) });
      const cur = d.ops.find(function (o) { return o.op === 'set' && o.path === op.path; });
      if (JSON.stringify(cur.value) === JSON.stringify(cur.before)) d.ops.splice(d.ops.indexOf(cur), 1);
    } else if (op.op === 'add') {
      d.ops.push({ op: 'add', coll: op.coll, item: C.clone(op.item) });
    } else if (op.op === 'update') {
      const added = d.ops.find(function (o) { return o.op === 'add' && same(o); });
      if (added) Object.assign(added.item, C.clone(op.value));
      else {
        const ex = d.ops.find(function (o) { return o.op === 'update' && same(o); });
        if (ex) Object.assign(ex.value, C.clone(op.value));
        else d.ops.push({ op: 'update', coll: op.coll, id: op.id, value: C.clone(op.value), before: C.clone(base[op.coll].find(function (x) { return x.id === op.id; })) });
      }
    } else if (op.op === 'remove') {
      const added = d.ops.find(function (o) { return o.op === 'add' && same(o); });
      if (added) d.ops = d.ops.filter(function (o) { return !same(o); });
      else {
        d.ops = d.ops.filter(function (o) { return !(o.op === 'update' && same(o)); });
        d.ops.push({ op: 'remove', coll: op.coll, id: op.id, before: C.clone(base[op.coll].find(function (x) { return x.id === op.id; })) });
        // al eliminar una sucursal, se descartan altas de recepcionistas en ella
        if (op.coll === 'sucursales') d.ops = d.ops.filter(function (o) { return !(o.op === 'add' && o.coll === 'recepcionistas' && o.item.sucursalId === op.id); });
      }
    }
    if (!d.ops.length) delete panel.drafts[empId];
  };

  /* Claves de entidades tocadas por borrador o solicitudes pendientes */
  C.opKey = function (o) { return o.op === 'set' ? 'path:' + o.path : o.coll + ':' + (o.id || (o.item && o.item.id)); };
  C.draftKeys = function (empId) {
    const out = {};
    C.draftOps(empId).forEach(function (o) { out[C.opKey(o)] = o.op; });
    return out;
  };
  C.pendingKeys = function (empId) {
    const out = {};
    C.S.panel.requests.forEach(function (r) {
      if (r.empresaId === empId && r.estado === 'pendiente') r.ops.forEach(function (o) { out[C.opKey(o)] = r.id; });
    });
    return out;
  };
  C.pendingReqs = function (empId) {
    return C.S.panel.requests.filter(function (r) { return r.empresaId === empId && r.estado === 'pendiente'; });
  };

  /* ===================== Descripción legible de cambios ===================== */
  const FIELD = {
    empresa: 'Nombre comercial', nombre: 'Nombre', apellido: 'Apellido', rol: 'Rol', email: 'Correo', wa: 'WhatsApp',
    tipo: 'Forma jurídica', ci: 'CI', razon: 'Razón social', nit: 'NIT', matricula: 'Matrícula de comercio',
    dir: 'Dirección', ciudad: 'Ciudad', tel: 'Teléfono', sucursalId: 'Sucursal',
    estado: 'Estado del crédito', linea: 'Línea aprobada', plazo: 'Plazo', docs: 'Documentos'
  };
  const SECTION = { user: 'Usuarios', empleados: 'Usuarios', formaJuridica: 'Datos legales', empresa: 'Datos legales', sucursales: 'Sucursales', recepcionistas: 'Recepcionistas', credito: 'Crédito y contrato' };
  const NOUN = { sucursales: 'sucursal', recepcionistas: 'recepcionista', empleados: 'usuario' };
  C.CREDITO_ESTADOS = { aprobado: 'Aprobado', no: 'Sin crédito', solicitado: 'Solicitado (en revisión)' };

  function fmtVal(k, v, emp) {
    if (v == null || v === '') return '—';
    if (k === 'tipo') { const f = C.FORMAS_JURIDICAS.find(function (x) { return x.id === v; }); return f ? f.label : v; }
    if (k === 'sucursalId') { const s = (emp.sucursales || []).find(function (x) { return x.id === v; }); return s ? s.dir : v; }
    if (k === 'linea') return C.bs(Number(v));
    if (k === 'plazo') return v + ' días';
    if (k === 'estado') return C.CREDITO_ESTADOS[v] || v;
    if (k === 'docs') { const n = C.DOC_KEYS.filter(function (d) { return v[d] && v[d].length; }).length; return n + ' de 6 cargados'; }
    return String(v);
  }
  function itemTitle(coll, it) {
    if (!it) return '';
    if (coll === 'sucursales') return it.dir;
    if (coll === 'recepcionistas') return it.nombre;
    if (coll === 'empleados') return ((it.nombre || '') + ' ' + (it.apellido || '')).trim() || it.email;
    return '';
  }
  function diffRows(before, after, emp) {
    const keys = Object.keys(Object.assign({}, before || {}, after || {})).filter(function (k) { return k !== 'id' && k !== 'pin' && k !== 'usado' && FIELD[k]; });
    return keys.filter(function (k) { return JSON.stringify((before || {})[k]) !== JSON.stringify((after || {})[k]); })
      .map(function (k) { return { label: FIELD[k], before: before ? fmtVal(k, before[k], emp) : null, after: after ? fmtVal(k, after[k], emp) : null }; });
  }
  /* emp: empresa con el contexto (para resolver nombres de sucursal) */
  C.describeOp = function (o, emp) {
    if (o.op === 'set') {
      const title = { user: 'Contacto principal', formaJuridica: 'Forma jurídica y datos legales', credito: 'Condiciones de crédito y contrato', empresa: 'Nombre comercial' }[o.path] || o.path;
      const rows = o.path === 'empresa'
        ? [{ label: 'Nombre comercial', before: o.before || '—', after: o.value }]
        : diffRows(o.before, o.value, emp);
      return { section: SECTION[o.path], kind: 'edit', title: 'Editar ' + title.toLowerCase(), rows: rows };
    }
    if (o.op === 'add') return { section: SECTION[o.coll], kind: 'add', title: 'Agregar ' + NOUN[o.coll] + ': ' + itemTitle(o.coll, o.item), rows: diffRows(null, o.item, emp) };
    if (o.op === 'update') {
      const after = Object.assign({}, o.before, o.value);
      return { section: SECTION[o.coll], kind: 'edit', title: 'Editar ' + NOUN[o.coll] + ': ' + itemTitle(o.coll, o.before), rows: diffRows(o.before, after, emp) };
    }
    return { section: SECTION[o.coll], kind: 'remove', title: 'Eliminar ' + NOUN[o.coll] + ': ' + itemTitle(o.coll, o.before), rows: [] };
  };

  C.REQ_TIPOS = { alta: 'Alta de cuenta', cambios: 'Cambios en cuenta', vendedor: 'Nuevo vendedor' };
  C.REQ_ESTADOS = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada', cancelada: 'Cancelada' };
})();
