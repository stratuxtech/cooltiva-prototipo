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

- **Mapa de flujos:** `index.html#/mapa` lista las 45 pantallas del cliente (1a … 7a) y las 18 del panel (8a … 8r).
  Tocar una abre ese estado con sus datos de ejemplo y desde ahí el flujo sigue siendo navegable.

## Panel de vendedores (flujo 8)

Panel interno para que los vendedores creen y administren cuentas de clientes. Ruta: `#/panel`.
El demo entra con un perfil elegible: Fabiana Paz, Jorge Llorenti o un Supervisor comercial.
La especificación completa está en `docs/arquitectura_de_informacion_y_user_flows_cooltiva_sprint_1_v5.md` (sección 8).

- **Empresas:** nombre de la empresa y sus usuarios. Tocar un usuario abre su edición.
- **Ficha:** Usuarios, Datos legales, Sucursales, Recepcionistas, Crédito, Pedidos e Historial.
  **Todo se edita, siempre en modal**; eliminar pide confirmación.
- **Confianza con trazabilidad:** guardar aplica el cambio al instante, queda en el **Registro de cambios** con el valor
  anterior y se avisa al equipo (campana y "Nuevo"). Otro vendedor puede **revertirlo**. No hay aprobaciones previas.
- **Crédito:** el vendedor no lo crea ni lo edita. Lo ve en modo solo lectura y puede **pedirle al cliente que lo solicite**
  (correo y WhatsApp), porque la firma tiene que hacerse desde el dispositivo del cliente.
- **Nueva cuenta (5 pasos):** Contacto → Forma jurídica → Sucursales y recepcionistas → Crédito → Revisar y crear.
  Siempre se puede agregar otra sucursal u otro recepcionista (en modal). La cuenta queda activa al crearla.
- **Hacer pedido para el cliente:** tienda real en *modo vendedor* (solo Tienda y Pedidos).
- **Equipo:** agregar y editar vendedores en modal.

## Comprador: cambios de la ronda 4

- "Agregar empleado" pasa a **Agregar responsable**; los responsables solo se eliminan (no se editan).
- **Solicitar crédito:** sin crédito, el cliente lo solicita desde Mi Cuenta → Crédito o desde el modal de cuenta:
  6 documentos, firma electrónica (dedo o mouse) y autorización. En el pago, la opción Crédito muestra "Solicitar crédito".

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
