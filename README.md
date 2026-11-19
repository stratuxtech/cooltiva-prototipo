# Cooltiva · Prototipo navegable de flujos (Sprint 1)

Wireframes de mediana fidelidad en HTML/CSS/JS, sin backend. Recrea las 45 pantallas de `../pantallas/` según
`../docs/arquitectura_de_informacion_y_user_flows_cooltiva_sprint_1_v4`, en web y mobile, con la interacción real
de cada botón.

## Cómo abrirlo

Hay **una sola URL** (`index.html`) y es 100 % responsive. Sirve las dos plataformas:

- **Tienda del cliente:** `#/acceso`, la web de compra.
- **Panel de vendedores:** `#/panel`, para uso interno de Cooltiva (también está enlazado en el footer de la tienda).

Para ver cómo se ve en mobile no hay otro link: en la pestaña **DEMO → Vista → Mobile** (o el botón del mapa de flujos)
la misma página se muestra dentro de un teléfono (360 / 390 / 430 px) y mantiene la pantalla en la que estabas.
"Ver en escritorio" vuelve. También funciona abriéndola en un celular real.

- **Mapa de flujos:** `index.html#/mapa` lista las 45 pantallas del cliente (1a … 7a) y las 17 del panel (8a … 8q).
  Tocar una abre ese estado con sus datos de ejemplo y desde ahí el flujo sigue siendo navegable.

## Panel de vendedores (flujo 8)

Panel administrativo para que los vendedores creen y administren cuentas de clientes. Ruta: `#/panel`.
El demo entra con un perfil elegible: Fabiana Paz, Jorge Llorenti o un Supervisor comercial.
Está pensado para ser **rápido**: poca información por pantalla.

- **Empresas:** lista mínima con el nombre de la empresa, su estado ("Alta en aprobación") y sus usuarios.
  Tocar un usuario abre su información lista para editar; tocar la empresa abre su ficha.
- **Ficha de empresa:** Usuarios, Datos legales, Sucursales, Recepcionistas, Crédito y contrato, Pedidos e Historial.
- **Nueva cuenta (wizard de 6 pasos):** Contacto → Forma jurídica → Sucursales → Recepcionistas → Crédito y contrato → Revisar.
  Un solo contacto por cuenta; los demás usuarios se agregan después, desde la ficha.
  "Siguiente" guarda lo que está escrito (no hace falta tocar "agregar") y, al haber una sucursal o un recepcionista,
  el formulario pasa a una tarjeta "+ Agregar". "Guardar y salir" deja el alta en borrador.
- **Crédito y contrato:** el vendedor arma las condiciones (línea, plazo, 6 documentos) y ve el contrato generado.
- **Hacer pedido para el cliente:** abre la tienda real en *modo vendedor* (banner negro; solo Tienda y Pedidos).
  El pedido queda a nombre del vendedor y en el registro.
- **Registro de cambios** (quién hizo qué, cuándo y en qué cuenta; no se edita) y **Equipo** (alta de vendedores, también con aprobación).

### Control: nadie aplica un cambio solo

1. El vendedor **edita en borrador**: nada se aplica a la cuenta.
2. **Revisa y envía:** lista simple de cambios (*antes → después*). El aprobador ya viene elegido, el motivo es opcional
   y se envía con un toque.
3. Solo **otra persona** puede aprobar: quien envía no ve el botón. Mientras tanto, esos datos quedan **bloqueados**.
4. **Aprobaciones:** quien aprueba ve qué se cambió y toca **Aprobar** o **Rechazar** (el rechazo pide un motivo breve).
5. Al aprobar se aplica, queda en el registro y, si se marcó, **se avisa al cliente por correo y WhatsApp** (simulado).
   Al enviar, también se avisa al aprobador por correo y WhatsApp (simulado). No se envía nada real.

**Quién aprueba queda por definir:** hoy se elige entre los demás vendedores o un "Supervisor comercial".

## Pestaña DEMO (fija, a la derecha)

- Vista Escritorio / Mobile, y cambio entre Tienda y Panel.
- Reiniciar el demo (vuelve a los datos de ejemplo de las dos plataformas).
- Ir a cualquier pantalla o al mapa de flujos.
- Entrar o salir de la sesión con la cuenta demo.
- Crédito de la cuenta: **Aprobado / Sin crédito**.
- Rol del registro (con *Recepcionista*, se marca solo "Yo soy el recepcionista").
- Cargar o vaciar los datos de la cuenta, para ver los estados vacíos.
- Atajo: pedido listo para pagar.

El estado se guarda en el navegador (`localStorage`), así que un recargo no pierde el avance.

## Estilo

Blanco y negro con Arial. El único color es el logo real de Cooltiva. La navbar replica la estructura y las medidas de
staging.cooltiva.market (64 px, sticky, hamburguesa con drawer bajo 860 px), sin lupa ni carrito. Con la sesión iniciada
muestra "Mi cuenta".

## Comportamientos que el PNG no mostraba

- **Fijos:**
  - Navbar.
  - Barra Atrás / Siguiente.
  - "Tu pedido": sticky en escritorio; en mobile es una barra con el total que abre una hoja inferior.
  - Menú de Mi Cuenta: lateral en escritorio, tabs deslizables en mobile.
  - Barra Comprar en mobile.
  - Scroll interno del contrato.
- **Lógica de negocio:**
  - El rol Recepcionista marca "Yo soy el recepcionista".
  - Solo se ofrecen los recepcionistas de la sucursal elegida.
  - Si hay una sola sucursal o un solo recepcionista, queda preelegido.
  - Totales en vivo (1 @ = 11,5 kg).
  - El crédito descuenta del disponible.
  - Sin confirmación final en el onboarding (0 clicks first).
- **Firma:** con mouse en escritorio y "Firmar con el dedo" en mobile; o cargando una imagen.
- **Estados:** validación con mensajes, botones deshabilitados, diálogos de eliminar, éxito y vacíos.

## Micro-añadidos a validar (no están literalmente en el documento)

1. Link **"Borrar firma"** en el recuadro de firma.
2. **Toasts** breves de confirmación ("Cambios guardados", "Cuenta creada"), sin pantallas extra.
3. **Monto** debajo del QR y ayuda **"= 575 kg"** bajo la cantidad.
4. **"+ Crear sucursal" / "+ Agregar recepcionista"** en la compra abren el modal de cuenta con campos vacíos (sección 11.2).
   La sucursal o el recepcionista nuevos quedan elegidos.
5. Dentro del modal, las secciones sin contexto muestran el **listado** con Editar.
6. **Eliminar una sucursal** elimina también sus recepcionistas (el diálogo lo avisa).
7. **"Elegir existente"** asigna a la misma persona a otra sucursal (aparece en ambas).
8. **Registrarse con Google** exige antes rol y términos.
9. Textos de las **3 tarjetas explicativas** del crédito, el contrato de ejemplo y el footer.
10. Tag **"Nuevo"** en el pedido recién creado y "Pedido #N" en *Pedido realizado*.

## Cambios de la ronda 2 (feedback)

- **Tienda:** ocupa todo el ancho del contenido.
- **Configura tu pedido:** cada decisión es un bloque con título, explicación y marca de completado (Tamaño comercial con su
  referencia, Cantidad, Servicio de planta, Garantía). La cabecera muestra "N de 4 elegidos" y el pie, el desglose del precio
  por kg, el subtotal y lo que falta elegir. Las opciones muestran nombre y recargo arriba y la explicación abajo, sin superponerse.
- **Franja horaria:** dos selectores "Desde / Hasta" con horas en punto (06:00–21:00) y un mínimo de 1 hora. Si el fin queda
  antes del inicio, se propone una franja de 2 horas.
- **Modal de cuenta:**
  - "Agregar recepcionista" ya no tiene el toggle Crear nuevo / Elegir existente: se elige la sucursal y se crea uno nuevo.
  - En Empleados se invita y se elimina, pero no se edita.
  - Corregido el mapa de las sucursales, que se desbordaba.

## Pendiente de definición (placeholder, sin inventar contenido)

- Tab **Configuración**.
- Tab **Crédito** sin crédito aprobado o con solicitud en revisión. En ese caso la opción de pago con crédito queda deshabilitada.
- Panel de vendedores (flujo 8).

## Estructura

```
index.html        app (router por hash); sirve tienda y panel, escritorio y mobile
css/base.css      tokens y componentes
css/screens.css   layouts y pantallas de la tienda
css/panel.css     panel de vendedores y marco de teléfono
js/panel.js       panel de vendedores
js/panel-data.js  empresas, equipo y motor de borradores/cambios
js/data.js        catálogo, cuenta semilla, contrato
js/core.js        estado, router, acciones
js/ui.js          componentes
js/layout.js      navbar, footer, Mi Cuenta, wizard
js/views-*.js     flujos 1–7
js/modal.js       modal de cuenta y diálogos
js/demo.js        pestaña DEMO, mapa de flujos y escenarios 1a–7a
```

## Despliegue

- **Producción (Vercel):** https://cooltiva-prototipo.vercel.app
- **Código (GitHub, privado):** https://github.com/stratuxtech/cooltiva-prototipo
- Cada `git push` a `main` se despliega solo en Vercel. Es un sitio estático: no tiene build ni dependencias.
- Para correrlo en local: `python -m http.server 5500` dentro de esta carpeta, o abrir `index.html`.
