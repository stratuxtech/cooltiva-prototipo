/* =========================================================
   DATOS DEL PROTOTIPO: catálogo, semilla de cuenta y contrato
   (datos de ejemplo verosímiles, sin backend)
   ========================================================= */
window.C = window.C || {};

C.DEMO_TODAY = new Date(2026, 10, 18); // 18 nov 2026 (fecha fija del demo)
C.KG_POR_ARROBA = 11.5;                // arroba boliviana

C.ROLES = ['Dueño', 'Administrador', 'Encargado de compra', 'Recepcionista'];

C.FORMAS_JURIDICAS = [
  { id: 'natural', label: 'Persona natural' },
  { id: 'unipersonal', label: 'Empresa unipersonal' },
  { id: 'sociedad', label: 'Sociedad' }
];

C.SIZE_ORDER = ['Papines', 'Cuarta', 'Tercera', 'Segunda', 'Primera', 'Chapara', 'Super'];

C.PRODUCTS = {
  papa: {
    id: 'papa', name: 'Papa', fullName: 'Papa Holandesa', category: 'Papas',
    servicioLavada: 0.58, garantiaPct: 14.9,
    servicioDesc: { Natural: 'Tal como sale del campo, con su tierra.', Lavada: 'Lavada y seleccionada en planta, lista para tu cocina.' },
    sizes: {
      Papines: { price: 7.20, tag: 'Mínima',       dia: 'Ø 2–3 cm', peso: '15–30 g c/u',  unid: '35–60 unid/kg', ref: 'Aprox. como una uva grande',     scale: 0.30 },
      Cuarta:  { price: 6.56, tag: 'Muy pequeña',  dia: 'Ø 3–4 cm', peso: '40–70 g c/u',  unid: '15–20 unid/kg', ref: 'Aprox. como una ciruela',         scale: 0.42 },
      Tercera: { price: 6.10, tag: 'Pequeña',      dia: 'Ø 4–5 cm', peso: '70–100 g c/u', unid: '10–14 unid/kg', ref: 'Aprox. como un huevo',            scale: 0.54 },
      Segunda: { price: 5.85, tag: 'Mediana',      dia: 'Ø 5–6 cm', peso: '100–150 g c/u',unid: '7–10 unid/kg',  ref: 'Aprox. como un limón grande',     scale: 0.66 },
      Primera: { price: 6.20, tag: 'Grande',       dia: 'Ø 6–7 cm', peso: '150–220 g c/u',unid: '5–7 unid/kg',   ref: 'Aprox. como una naranja',         scale: 0.78 },
      Chapara: { price: 6.45, tag: 'Muy grande',   dia: 'Ø 7–8 cm', peso: '220–300 g c/u',unid: '3–5 unid/kg',   ref: 'Aprox. como una toronja pequeña', scale: 0.90 },
      Super:   { price: 6.90, tag: 'Extra grande', dia: 'Ø 8–10 cm',peso: '300–450 g c/u',unid: '2–3 unid/kg',   ref: 'Aprox. como una toronja',         scale: 1.00 }
    }
  },
  cafe: {
    id: 'cafe', name: 'Café', fullName: 'Café de los Yungas', category: 'Café',
    servicioLavada: 4.20, garantiaPct: 6.5,
    servicioDesc: { Natural: 'Proceso natural: el grano se seca dentro del fruto.', Lavada: 'Proceso lavado: despulpado y fermentado en planta.' },
    sizes: {
      Papines: { price: 58.00, tag: 'Grano mínimo',      dia: 'Ø 4,8–5,2 mm', peso: '0,10 g c/grano', unid: '≈ 10.000 granos/kg', ref: 'Aprox. como una lenteja pequeña', scale: 0.30 },
      Cuarta:  { price: 61.00, tag: 'Grano muy pequeño', dia: 'Ø 5,2–5,6 mm', peso: '0,12 g c/grano', unid: '≈ 8.300 granos/kg',  ref: 'Aprox. como una lenteja',         scale: 0.42 },
      Tercera: { price: 64.00, tag: 'Grano pequeño',     dia: 'Ø 5,6–6,0 mm', peso: '0,14 g c/grano', unid: '≈ 7.100 granos/kg',  ref: 'Aprox. como un grano de arroz doble', scale: 0.54 },
      Segunda: { price: 66.50, tag: 'Grano mediano',     dia: 'Ø 6,0–6,4 mm', peso: '0,16 g c/grano', unid: '≈ 6.200 granos/kg',  ref: 'Aprox. como un garbanzo pequeño', scale: 0.66 },
      Primera: { price: 70.00, tag: 'Grano grande',      dia: 'Ø 6,4–6,8 mm', peso: '0,18 g c/grano', unid: '≈ 5.500 granos/kg',  ref: 'Aprox. como un garbanzo',         scale: 0.78 },
      Chapara: { price: 73.00, tag: 'Grano muy grande',  dia: 'Ø 6,8–7,2 mm', peso: '0,20 g c/grano', unid: '≈ 5.000 granos/kg',  ref: 'Aprox. como un frijol pequeño',   scale: 0.90 },
      Super:   { price: 77.00, tag: 'Grano extra grande',dia: 'Ø 7,2 mm o más',peso: '0,22 g c/grano', unid: '≈ 4.500 granos/kg', ref: 'Aprox. como un frijol',           scale: 1.00 }
    }
  }
};

C.GARANTIA_DESC = {
  con: 'Cubre calibre y frescura fuera del estándar Cooltiva.',
  sin: 'Recibes el producto sin cobertura de reposición.'
};

/* Franja horaria: horas en punto disponibles para entrega */
C.HORAS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

C.GARANTIA_BENEFICIOS = [
  'Lo que no cumpla el estándar Cooltiva de calibre y frescura se repone sin costo',
  'Recibes la cantidad que planificaste para tu cocina',
  'Sin reclamos ni descuentos que negociar: la reposición ya está incluida'
];

C.CREDITO_INFO = [
  { title: '¿Qué es?', text: 'Una línea de crédito para tu negocio: compras hoy y pagas a 30 días, sin trámites en cada pedido.' },
  { title: 'Compra sin frenar tu caja', text: 'Abastece tu cocina aunque no tengas efectivo el día de la entrega.' },
  { title: 'Un solo trámite', text: 'Validamos tus documentos una vez; después pagas con crédito en 1 clic.' }
];

C.CREDITO_DOCS = [
  { key: 'nit',     label: 'NIT',     hint: 'Certificado de Inscripción al Padrón Biométrico (SIN)', multiple: false, cta: 'Subir archivo',        sub: 'PDF o foto' },
  { key: 'seprec',  label: 'SEPREC',  hint: 'Matrícula de Comercio (PDF con QR o foto)',               multiple: false, cta: 'Subir archivo',        sub: 'PDF o foto' },
  { key: 'f200',    label: 'Formularios 200/400 (últimos 3 meses)', hint: 'Declaraciones de IVA e IT, hasta 6 documentos', multiple: true, max: 6, cta: '+ Subir varios archivos', sub: 'Hasta 6 documentos' },
  { key: 'poder',   label: 'Poder del representante legal', hint: 'Testimonio notarial: un PDF o fotos de cada hoja', multiple: true, cta: '+ Subir varios archivos', sub: 'PDF o varias fotos' }
];

C.CONTRATO = [
  { t: '1. Objeto', p: 'Cooltiva S.R.L. otorga al Cliente una línea de crédito comercial para la compra de insumos (papa, café y otros productos del catálogo) a través de la plataforma web, por el monto y plazo aprobados en su evaluación.' },
  { t: '2. Plazo', p: 'Cada pedido pagado con Crédito Cooltiva vence a los 30 días calendario desde la fecha de entrega. El Cliente puede pagar antes del vencimiento sin penalidad.' },
  { t: '3. Condiciones', p: 'El monto de cada pedido se descuenta del saldo disponible de la línea. El saldo se restablece al registrarse el pago. Cooltiva puede suspender temporalmente la línea si existen pagos vencidos.' },
  { t: '4. Mora', p: 'Los pagos realizados después del vencimiento generan un interés moratorio del 1,5% mensual sobre el saldo vencido, calculado por día de retraso.' },
  { t: '5. Firma y aceptación', p: 'La firma digital de este documento tiene la misma validez que la firma manuscrita. Una copia del contrato firmado se envía al correo registrado del Cliente.' },
  { t: '6. Jurisdicción', p: 'Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales de Santa Cruz de la Sierra, Estado Plurinacional de Bolivia.' }
];

/* Direcciones que "devuelve" el mapa al tocarlo (simulación de geocodificación) */
C.MAP_GEOCODE = [
  { dir: 'Av. San Martín 1890, Equipetrol', ciudad: 'Santa Cruz de la Sierra' },
  { dir: 'Av. Ballivián 1045, Calacoto', ciudad: 'La Paz' },
  { dir: 'Calle España 350', ciudad: 'Cochabamba' },
  { dir: 'Av. Monseñor Rivero 220', ciudad: 'Santa Cruz de la Sierra' },
  { dir: 'Av. Arce 2631, Sopocachi', ciudad: 'La Paz' },
  { dir: 'Av. América Este 1180', ciudad: 'Cochabamba' }
];

/* ---------- Semilla de la cuenta demo (cliente ya configurado) ---------- */
C.seedAccount = function () {
  return {
    id: 'fogon', estado: 'activa', origen: 'vendedor', creadoPor: 'Fabiana Paz', creado: '2026-09-02T10:15', actualizado: '2026-11-12T15:40',
    empresa: 'Restaurante El Fogón',
    user: { nombre: 'Carla', apellido: 'Rojas', rol: 'Dueño', email: 'carla.rojas@restaurante.bo', wa: '+591 7000 0000' },
    formaJuridica: { tipo: 'unipersonal', ci: '', razon: 'Restaurante El Fogón', nit: '4021567018', matricula: '00385124' },
    sucursales: [
      { id: 's1', dir: 'Av. 6 de Agosto 1234', ciudad: 'La Paz', pin: { x: 46, y: 42 } },
      { id: 's2', dir: 'Calle 21 de Calacoto 456', ciudad: 'La Paz', pin: { x: 62, y: 58 } }
    ],
    recepcionistas: [
      { id: 'r1', nombre: 'Juan Pérez',  tel: '7012 3456', sucursalId: 's1' },
      { id: 'r2', nombre: 'María Quispe', tel: '7145 9821', sucursalId: 's1' },
      { id: 'r3', nombre: 'Pedro Choque', tel: '7230 1187', sucursalId: 's2' },
      { id: 'r4', nombre: 'Rosa Mamani',  tel: '7698 4410', sucursalId: 's2' }
    ],
    empleados: [
      { id: 'e1', nombre: 'Ana', apellido: 'Rojas', rol: 'Administrador', email: 'ana.rojas@restaurante.bo',  wa: '+591 7000 0001' },
      { id: 'e2', nombre: 'Luis', apellido: 'Mamani', rol: 'Encargado de compra', email: 'luis.mamani@restaurante.bo', wa: '+591 7000 0002' }
    ],
    credito: { estado: 'aprobado', linea: 10000, plazo: 30, usado: 0, docs: C.fullDocs ? C.fullDocs() : {} },
    pedidos: [
      {
        id: 1043, creado: '2026-11-12T10:24', entregaFecha: '2026-11-17', franja: '08:00–10:00',
        sucursal: 'Av. 6 de Agosto 1234', recepcionista: 'Juan Pérez', pago: 'Crédito Cooltiva', total: 6610,
        items: [
          { name: 'Papa', config: 'Cuarta · Lavada · Con reposición', qty: '50 @', price: 5210 },
          { name: 'Café', config: 'Primera · Natural · Sin reposición', qty: '20 kg', price: 1400 }
        ]
      },
      {
        id: 1038, creado: '2026-11-03T16:05', entregaFecha: '2026-11-06', franja: '09:00–11:00',
        sucursal: 'Av. 6 de Agosto 1234', recepcionista: 'María Quispe', pago: 'Contraentrega', total: 3980,
        items: [ { name: 'Papa', config: 'Segunda · Natural · Sin reposición', qty: '40 @', price: 3980 } ]
      },
      {
        id: 1031, creado: '2026-10-27T11:40', entregaFecha: '2026-10-29', franja: '08:00–10:00',
        sucursal: 'Calle 21 de Calacoto 456', recepcionista: 'Pedro Choque', pago: 'Pago con QR', total: 7570,
        items: [
          { name: 'Papa', config: 'Primera · Lavada · Con reposición', qty: '60 @', price: 6420 },
          { name: 'Café', config: 'Super · Natural · Con reposición', qty: '15 kg', price: 1150 }
        ]
      }
    ],
    nextPedido: 1044
  };
};

C.emptyOnboarding = function () {
  return {
    reg: { rol: '', nombre: '', apellido: '', pass: '', terms: false, google: false },
    fj: { tipo: '', ci: '', razon: '', nit: '', matricula: '' },
    suc: { dir: '', ciudad: '', pin: null },
    rec: { yoSoy: false, nombre: '', tel: '', touched: false },
    cred: { solicitar: false, docs: { nit: [], seprec: [], f200: [], poder: [], anverso: [], reverso: [] } },
    maxStep: 0
  };
};

C.emptyItem = function () {
  return { size: '', qty: '', unit: '@', servicio: '', garantia: '' };
};

C.emptyCart = function () {
  return {
    selected: [], items: {}, open: null,
    sucursalId: null, fecha: null, franja: '', franjaDesde: '', franjaHasta: '', recepId: null, instrucciones: '',
    pago: null, firma: { modo: 'dibujar', data: null, archivo: null }, leido: false, firmo: false,
    maxStep: 0
  };
};
