/* =========================================================
   PANEL DE VENDEDORES · datos semilla y motor de cambios
   Lógica de confianza: el vendedor guarda y el cambio se
   aplica al instante. Queda en el registro (con el "antes")
   y se avisa al resto del equipo, que puede revertirlo.
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
  /* Documentos que un vendedor ya cargó (falta el carnet, que el cliente saca con su celular) */
  C.partialDocs = function (por) {
    const d = C.fullDocs();
    C.DOC_KEYS.forEach(function (k) { d[k].forEach(function (f) { f.por = por; }); });
    d.anverso = []; d.reverso = [];
    return d;
  };
  C.docsCount = function (docs) { return C.DOC_KEYS.filter(function (k) { return ((docs || {})[k] || []).length; }).length; };
  /* Quién ayudó a cargar documentos (vendedores) */
  C.docsPor = function (docs) {
    const out = [];
    C.DOC_KEYS.forEach(function (k) { ((docs || {})[k] || []).forEach(function (f) { if (f.por && out.indexOf(f.por) < 0) out.push(f.por); }); });
    return out;
  };
  /* Fase del crédito: el vendedor puede preparar los documentos,
     pero la firma y la autorización las hace el cliente desde su dispositivo.
     no → preparacion (hay documentos) → firma (se envió al cliente) → solicitado → aprobado */
  C.creditoFase = function (c) {
    if (c.estado === 'aprobado' || c.estado === 'solicitado') return c.estado;
    if (c.enviadoFirma) return 'firma';
    return C.docsCount(c.docs) ? 'preparacion' : 'no';
  };

  C.PERSONAS = [
    { id: 'fabiana', nombre: 'Fabiana Paz', rol: 'Vendedora', email: 'fabiana.paz@cooltiva.bo', wa: '+591 7600 1001' },
    { id: 'jorge', nombre: 'Jorge Llorenti', rol: 'Vendedor', email: 'jorge.llorenti@cooltiva.bo', wa: '+591 7600 1002' },
    { id: 'sup', nombre: 'Supervisor comercial', rol: 'Supervisor · por definir', email: 'supervision@cooltiva.bo', wa: '+591 7600 1000' }
  ];

  C.seedEmpresas = function () {
    const fogon = C.seedAccount();
    const hotel = {
      id: 'hotel', estado: 'activa', origen: 'vendedor', creadoPor: 'Jorge Llorenti', creado: '2026-08-14T11:00', actualizado: '2026-11-17T17:30',
      empresa: 'Hotel Río Piraí',
      user: { nombre: 'Marcelo', apellido: 'Suárez', rol: 'Administrador', email: 'compras@hotelriopirai.bo', wa: '+591 7712 3344' },
      formaJuridica: { tipo: 'sociedad', ci: '', razon: 'Hotelera Río Piraí S.A.', nit: '1023456027', matricula: '00214587' },
      sucursales: [
        { id: 'h1', dir: 'Av. San Martín 1890, Equipetrol', ciudad: 'Santa Cruz de la Sierra', pin: pin(40, 38) },
        { id: 'h2', dir: 'Av. Banzer 3350, 4to anillo', ciudad: 'Santa Cruz de la Sierra', pin: pin(66, 30) }
      ],
      recepcionistas: [
        { id: 'hr1', nombre: 'Daniela Ortiz', tel: '7788 1122', sucursalId: 'h1' },
        { id: 'hr2', nombre: 'Óscar Vaca', tel: '7790 5566', sucursalId: 'h2' },
        { id: 'hr3', nombre: 'Paola Rivero', tel: '7701 2233', sucursalId: 'h2' }
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
      credito: { estado: 'solicitado', linea: 0, plazo: 30, usado: 0, solicitado: '2026-11-15T16:50', docs: C.fullDocs() },
      pedidos: [], nextPedido: 4001
    };
    const andino = {
      id: 'andino', estado: 'activa', origen: 'vendedor', creadoPor: 'Jorge Llorenti', creado: '2026-11-18T09:12', actualizado: '2026-11-18T09:12',
      empresa: 'Catering Andino',
      user: { nombre: 'Verónica', apellido: 'Choque', rol: 'Dueño', email: 'veronica@cateringandino.bo', wa: '+591 7321 4455' },
      formaJuridica: { tipo: 'sociedad', ci: '', razon: 'Catering Andino S.R.L.', nit: '3345678015', matricula: '00398871' },
      sucursales: [{ id: 'c1', dir: 'Av. Arce 2631, Sopocachi', ciudad: 'La Paz', pin: pin(36, 52) }],
      recepcionistas: [{ id: 'cr1', nombre: 'Germán Quisbert', tel: '7322 0909', sucursalId: 'c1' }],
      empleados: [{ id: 'ce1', nombre: 'Iván', apellido: 'Copa', rol: 'Encargado de compra', email: 'compras@cateringandino.bo', wa: '+591 7322 1010' }],
      credito: { estado: 'no', linea: 0, plazo: 30, usado: 0, docs: C.emptyDocs(), invitado: { fecha: '2026-11-18T09:12', por: 'Jorge Llorenti' } },
      pedidos: [], nextPedido: 5001
    };
    return { fogon: fogon, hotel: hotel, donarosa: donarosa, altura: altura, andino: andino };
  };

  C.seedPanel = function () {
    const log = [
      { id: 'l9', fecha: '2026-11-18T09:12', actor: 'jorge', accion: 'alta', empresaId: 'andino', texto: 'Creó la cuenta y envió el acceso al cliente por correo y WhatsApp' },
      { id: 'l8', fecha: '2026-11-17T17:30', actor: 'jorge', accion: 'cambio', empresaId: 'hotel', texto: 'Editó 2 datos',
        ops: [
          { op: 'update', coll: 'sucursales', id: 'h2', value: { dir: 'Av. Banzer 3350, 4to anillo' }, before: { id: 'h2', dir: '4to anillo, Av. Banzer 3200', ciudad: 'Santa Cruz de la Sierra', pin: pin(66, 30) } },
          { op: 'add', coll: 'recepcionistas', item: { id: 'hr3', nombre: 'Paola Rivero', tel: '7701 2233', sucursalId: 'h2' } }
        ] },
      { id: 'l7', fecha: '2026-11-15T16:50', actor: 'cliente', accion: 'credito', empresaId: 'altura', texto: 'El cliente solicitó Crédito Cooltiva desde su celular' },
      { id: 'l6', fecha: '2026-11-15T16:45', actor: 'cliente', accion: 'alta', empresaId: 'altura', texto: 'El cliente creó su cuenta por autoregistro' },
      { id: 'l5', fecha: '2026-11-12T15:40', actor: 'fabiana', accion: 'cambio', empresaId: 'fogon', texto: 'Editó 1 dato',
        ops: [{ op: 'update', coll: 'recepcionistas', id: 'r2', value: { tel: '7145 9821' }, before: { id: 'r2', nombre: 'María Quispe', tel: '7145 0000', sucursalId: 's1' } }] },
      { id: 'l3', fecha: '2026-11-10T08:05', actor: 'jorge', accion: 'pedido', empresaId: 'hotel', texto: 'Creó el pedido #2210 para el cliente (Bs 8.400)' }
    ];
    // Fabiana ya vio lo suyo y lo viejo; le quedan como novedad los cambios recientes de Jorge
    return { loggedIn: false, persona: 'fabiana', equipo: C.clone(C.PERSONAS), log: log, nueva: C.emptyNueva(), seen: { fabiana: ['l3', 'l5', 'l6', 'l7'], jorge: ['l3', 'l5', 'l6', 'l7', 'l8', 'l9'], sup: [] } };
  };

  C.emptyNueva = function () {
    return {
      maxStep: 0,
      contacto: { empresa: '', nombre: '', apellido: '', rol: '', email: '', wa: '' },
      fj: { tipo: '', ci: '', razon: '', nit: '', matricula: '' },
      sucursales: [], recepcionistas: [],
      credito: { invitar: false },
      enviarAcceso: true
    };
  };

  /* ===================== Motor de operaciones ===================== */
  /* op: {op:'set', path, value, before} | {op:'add', coll, item} |
         {op:'update', coll, id, value, before} | {op:'remove', coll, id, before, removedRecs} */
  /* path admite puntos: 'credito.docs' */
  function getIn(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function setIn(obj, path, v) { const ks = path.split('.'), last = ks.pop(); ks.reduce(function (o, k) { return o[k] || (o[k] = {}); }, obj)[last] = v; }
  C.applyOps = function (emp, ops) {
    (ops || []).forEach(function (o) {
      if (o.op === 'set') setIn(emp, o.path, C.clone(o.value));
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

  /* Completa el "antes" de cada operación con el estado actual (para poder revertir) */
  C.withBefore = function (emp, ops) {
    return ops.map(function (o) {
      o = C.clone(o);
      if (o.op === 'set') o.before = C.clone(getIn(emp, o.path));
      if (o.op === 'update' || o.op === 'remove') o.before = C.clone(emp[o.coll].find(function (x) { return x.id === o.id; }));
      if (o.op === 'remove' && o.coll === 'sucursales') o.removedRecs = C.clone(emp.recepcionistas.filter(function (r) { return r.sucursalId === o.id; }));
      return o;
    });
  };

  /* Operaciones inversas: deshacen exactamente lo que se hizo */
  C.inverseOps = function (ops) {
    const out = [];
    ops.slice().reverse().forEach(function (o) {
      if (o.op === 'set') out.push({ op: 'set', path: o.path, value: C.clone(o.before), before: C.clone(o.value) });
      else if (o.op === 'add') out.push({ op: 'remove', coll: o.coll, id: o.item.id, before: C.clone(o.item) });
      else if (o.op === 'update') {
        const back = {};
        Object.keys(o.value).forEach(function (k) { back[k] = o.before ? C.clone(o.before[k]) : undefined; });
        out.push({ op: 'update', coll: o.coll, id: o.id, value: back, before: Object.assign({}, o.before, C.clone(o.value)) });
      } else if (o.op === 'remove') {
        out.push({ op: 'add', coll: o.coll, item: C.clone(o.before) });
        (o.removedRecs || []).forEach(function (r) { out.push({ op: 'add', coll: 'recepcionistas', item: C.clone(r) }); });
      }
    });
    return out;
  };

  C.persona = function (id) { return C.S.panel.equipo.find(function (p) { return p.id === (id || C.S.panel.persona); }) || { id: id, nombre: id === 'cliente' ? 'Cliente' : (id === 'sistema' ? 'Sistema' : id), rol: '' }; };
  C.empresa = function (id) { return C.S.empresas[id]; };

  /* ===================== Descripción legible de cambios ===================== */
  const FIELD = {
    empresa: 'Nombre comercial', nombre: 'Nombre', apellido: 'Apellido', rol: 'Rol', email: 'Correo', wa: 'WhatsApp',
    tipo: 'Forma jurídica', ci: 'CI', razon: 'Razón social', nit: 'NIT', matricula: 'Matrícula de comercio',
    dir: 'Dirección', ciudad: 'Ciudad', tel: 'Teléfono', sucursalId: 'Sucursal'
  };
  const NOUN = { sucursales: 'sucursal', recepcionistas: 'recepcionista', empleados: 'usuario' };
  C.CREDITO_ESTADOS = { aprobado: 'Aprobado', no: 'Sin crédito', preparacion: 'En preparación', firma: 'Pendiente de firma del cliente', solicitado: 'Solicitado · en revisión' };

  function fmtVal(k, v, emp) {
    if (v == null || v === '') return '—';
    if (k === 'tipo') { const f = C.FORMAS_JURIDICAS.find(function (x) { return x.id === v; }); return f ? f.label : v; }
    if (k === 'sucursalId') { const s = (emp.sucursales || []).find(function (x) { return x.id === v; }); return s ? s.dir : v; }
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
    const keys = Object.keys(Object.assign({}, before || {}, after || {})).filter(function (k) { return FIELD[k]; });
    return keys.filter(function (k) { return JSON.stringify((before || {})[k]) !== JSON.stringify((after || {})[k]); })
      .map(function (k) { return { label: FIELD[k], before: before ? fmtVal(k, before[k], emp) : null, after: after ? fmtVal(k, after[k], emp) : null }; });
  }
  C.describeOp = function (o, emp) {
    if (o.op === 'set' && o.path === 'credito.docs') {
      const names = function (docs, k) { return ((docs || {})[k] || []).map(function (f) { return f.name; }).join(', '); };
      const rows = C.DOC_KEYS.filter(function (k) { return names(o.before, k) !== names(o.value, k); })
        .map(function (k) { return { label: C.DOC_LABELS[k], before: names(o.before, k) || 'Falta', after: names(o.value, k) || 'Falta' }; });
      return { kind: 'edit', title: 'Documentos del crédito', rows: rows };
    }
    if (o.op === 'set') {
      const title = { user: 'Contacto principal', formaJuridica: 'Datos legales', empresa: 'Nombre comercial' }[o.path] || o.path;
      const rows = o.path === 'empresa' ? [{ label: 'Nombre comercial', before: o.before || '—', after: o.value }] : diffRows(o.before, o.value, emp);
      return { kind: 'edit', title: title, rows: rows };
    }
    if (o.op === 'add') return { kind: 'add', title: NOUN[o.coll] + ': ' + itemTitle(o.coll, o.item), rows: diffRows(null, o.item, emp) };
    if (o.op === 'update') return { kind: 'edit', title: NOUN[o.coll] + ': ' + itemTitle(o.coll, o.before), rows: diffRows(o.before, Object.assign({}, o.before, o.value), emp) };
    return { kind: 'remove', title: NOUN[o.coll] + ': ' + itemTitle(o.coll, o.before), rows: [] };
  };
})();
