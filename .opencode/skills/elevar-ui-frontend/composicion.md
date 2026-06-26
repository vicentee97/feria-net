# Composición, materialidad y patrones visuales

Esta referencia recoge las directrices concretas de ingeniería de diseño de `elevar-ui-frontend`: composición, tipografía, color, materialidad, estados, formularios, dashboards y el playbook por tipo de superficie. El `SKILL.md` principal resume cuándo aplicarlas.

## Directrices de ingeniería de diseño

### Regla 0: La superficie manda

- Clasifica la pantalla: `login/auth`, `dashboard`, `settings`, `wizard`, `empty state`, `table`, `catalog`, `detail`, etc.
- La prioridad es la claridad operacional de la superficie real, no demostrar rango visual.

### Regla 0.1: Una superficie dominante por bloque

- Si una pantalla o card ya define una superficie clara, la IA no debe meter por defecto más tarjetas, paneles o cajas visuales dentro para “ordenar” el contenido.
- Dentro de una `Card`, el empty state, los KPIs y el CTA deben resolverse primero con layout, espaciado, tipografía y una sola materialidad coherente.
- Solo se permite una sub-superficie interna cuando tenga una función distinta y real: por ejemplo un formulario separado, una tabla embebida, un bloque colapsable o un área scrollable que necesite delimitación propia.
- Regla práctica: si al quitar una caja interna la pantalla sigue siendo clara, esa caja sobraba.
- En dashboards operativos, anidar card dentro de card por estética es un anti-patrón por defecto.

### Regla 0.1.1: Una prioridad visual dominante por estado

- Si el estado actual de la pantalla implica un siguiente paso obvio, la composición debe dejar una sola prioridad visual indiscutible.
- La acción principal del estado actual debe dominar antes que el histórico, los detalles secundarios o los bloques de apoyo.
- La IA no debe repartir el mismo peso visual entre "hacer lo siguiente" y "consultar contexto" cuando una de esas dos cosas manda claramente.
- Regla práctica: si al mirar la pantalla 2 segundos no se entiende qué acción manda, la jerarquía está mal resuelta.

### Regla 0.1.2: Un bloque protagonista también debe estar bien compuesto por dentro

- Destacar un bloque con fondo, tono o tamaño no basta si su composición interna sigue siendo torpe.
- Cuando un bloque agrupe una métrica principal y varias secundarias, la IA debe decidir con claridad qué dato manda, cómo se subordinan los secundarios y qué alineación hace que se lean como sistema.
- Las métricas secundarias no deben parecer notas pegadas en una esquina del highlight ni competir con la principal sin una jerarquía interna clara.
- Regla práctica: si el bloque principal destaca desde lejos pero al acercarte parece una suma de piezas mal repartidas, falta composición interna.

### Regla 0.1.3: La metadata contextual debe pertenecer a la cabecera

- Datos como corte, turno, sucursal, canal o estado temporal no deben quedar ni flotando en una esquina ni pegados al título como microtexto accidental.
- La IA debe integrarlos como parte del resumen ejecutivo de cabecera con una relación clara respecto al estado principal y al contexto temporal.
- Esa metadata puede ser más discreta que el titular, pero no debe sentirse decorativa ni desconectada.
- Regla práctica: si al mover mentalmente esa metadata a otro rincón de la pantalla casi no cambia nada, estaba mal integrada.

### Regla 0.2: La composición debe soportar variación real

- Diseña para soportar cambios de anchura, altura, zoom, densidad de texto y longitud de etiquetas sin perder sentido.
- No cierres una composición solo porque “cuadra” con un screenshot concreto.
- Los bloques deben poder expandirse o comprimirse dentro de límites razonables sin romper la lectura.
- Todo componente importante debería tener una respuesta clara a estas preguntas:
  - ¿Qué se apila primero?
  - ¿Qué se encoge primero?
  - ¿Qué se oculta o simplifica primero?
  - ¿Qué debe permanecer siempre visible?

### Regla 0.3: Jerarquía con estructura, no con trucos

- La IA debe preferir `grid-template`, columnas proporcionales, `align-*`, `justify-*`, `gap`, `minmax()` y `max-width` antes que introducir empujes visuales artificiales.
- No uses huecos enormes para “equilibrar” algo que en realidad está mal distribuido.
- Si un layout necesita demasiado aire vacío para verse bien, probablemente aún no está resuelto.

### Regla 0.4: El borde no sustituye la jerarquía

- La IA no debe intentar ordenar una pantalla delimitando todo con bordes del mismo peso.
- Cuando cards, subcards, inputs, chips y bloques secundarios comparten el mismo protagonismo de borde, la interfaz se aplana aunque "parezca limpia".
- La jerarquía debe salir primero de composición, espaciado, tipografía y contraste de superficie; el borde solo remata la estructura.
- Regla práctica: si al reducir mentalmente la fuerza de los bordes la pantalla se vuelve confusa, faltaba jerarquía real.

### Regla 0.5: Limpieza no es neutralidad

- Una interfaz operativa no debe quedarse en "ordenada" o "limpia"; también debe orientar la lectura y sugerir prioridad de uso en menos de 2-3 segundos.
- Si una pantalla se ve correcta pero demasiado pasiva, la IA debe reforzar la intención operativa antes de pensar en adornos o microestilos.
- La ausencia de ruido no cuenta como éxito si el usuario no entiende rápido si la pantalla sirve para vigilar, actuar, revisar o cerrar.
- Regla práctica: si la composición podría pertenecer igual a una ficha estática que a una herramienta operativa, falta dirección.

### Regla 0.6: Ritmo visual y densidad útil

- No todos los bloques deben hablar con la misma intensidad visual.
- Cuando título, contexto, métricas y datos secundarios comparten una modulación demasiado parecida, la pantalla se vuelve plana aunque esté bien alineada.
- La IA debe introducir ritmo visual con agrupación, contraste tipográfico, densidad variable y jerarquía espacial, no necesariamente con más cajas.
- El espacio vacío solo es bueno si mejora foco, respiración o lectura; si deja una superficie deshabitada, es un fallo de composición.

### Regla 0.7: Superficies planas con articulación real

- Si la IA elige resolver una pantalla sobre una única superficie plana, debe compensarlo con agrupación muy clara entre bloques.
- En una superficie única no basta con repartir texto y números: hacen falta subgrupos visibles por proximidad, ritmo vertical, subgrids, divisores con intención o cambios controlados de densidad.
- La pantalla no debe parecer una colección de etiquetas flotando sobre blanco aunque todos los elementos estén bien alineados.
- Regla práctica: si al quitar mentalmente los títulos de sección la información se convierte en texto disperso, faltaba articulación.

### Regla 1: Tipografía determinista

- **Display y títulos:** `text-3xl md:text-5xl tracking-tight leading-none` salvo necesidad real de más.
- **Serifas prohibidas** en dashboards o software.
- **Cuerpo y párrafos:** sobrios y cortos; no uses texto de apoyo por defecto si no añade claridad real.

### Regla 1.1: Presupuesto de texto

- La IA debe trabajar con presupuesto de copy, no con texto infinito.
- En superficies operativas, cada bloque debería intentar contener:
  - un título corto;
  - cero o una línea de apoyo;
  - un CTA claro si hace falta.
- No expliques con texto lo que ya se entiende por la jerarquía visual, la etiqueta del bloque o el propio botón.
- Si un párrafo puede convertirse en una línea, debe comprimirse.
- Si una línea puede desaparecer sin perder comprensión, debe desaparecer.
- Empty states de dashboard: por defecto un titular corto, una frase útil y un CTA. No más.

### Regla 1.2: Copy resiliente

- El copy debe sobrevivir a traducciones, nombres largos y zoom sin destruir la composición.
- No bases el equilibrio de una tarjeta en que una frase mida exactamente lo mismo que en tu pantalla.
- Evita textos decorativos largos en zonas estrechas o densas.
- Si el texto es importante, dale espacio estructural real; si no lo es, recórtalo.

### Regla 2: Color y materialidad

- Máximo un acento principal.
- Saturación controlada.
- Evita negro puro y superficies demasiado contrastadas en interfaces claras si el sistema no lo pide.
- Diferencia claramente: fondo, superficie, control y estado seleccionado.

### Regla 2.1: Materialidad refinada en interfaces claras

- Cuando una interfaz clara necesite más estructura, la IA debe introducirla primero con una escala tonal más rica, no endureciendo todos los contornos.
- La separación entre fondo, superficie principal, bloques secundarios y controles debe poder leerse también por tono, profundidad suave o densidad, no solo por líneas negras.
- Una UI clara no debe resolverse como wireframe finalista: bordes oscuros, divisores tajantes y texto casi todo en el mismo negro suelen endurecer la pantalla y volverla menos elegante.
- Regla práctica: si una propuesta mejora la organización pero se siente más dura, más tosca o más "dibujada a rotulador", falta refinamiento de materialidad.

### Regla 2.2: Color semántico con significado consistente

- Si la IA introduce color semántico en métricas, estados o movimientos, ese color debe responder a una lógica estable y repetible, no a una decoración puntual.
- Verde, rojo, ámbar, azul o cualquier otro código deben conservar una relación reconocible con éxito, riesgo, alerta, neutralidad o categoría operativa, según el sistema real del producto.
- No basta con que el color "quede bien"; debe ayudar a leer y priorizar sin sembrar dudas sobre por qué una cifra o etiqueta está resaltada.
- Regla práctica: si el usuario no puede explicar en una frase qué significa cada color usado en la pantalla, la semántica cromática está floja.

### Regla 2.2.1: No confundir estado con contador

- La IA debe distinguir entre un dato semántico y un dato cuantitativo antes de colorearlo.
- Un estado real puede merecer color semántico; un contador o resumen cuantitativo no debe parecer éxito, alerta o error solo por decoración.
- Si una pieza solo informa cuántas cosas hay, debe leerse como metadata o contexto, no como estado del sistema.
- Regla práctica: si al quitar el color el significado del elemento no cambia, probablemente ese color no era semántico sino ornamental.

### Regla 3: Sombras, bordes y radios

- Define tres niveles de borde: estructural, control y detalle.
- Usa sombras mínimas y cercanas; no glows.
- Los radios deben ser consistentes entre botones, cards, inputs y overlays.
- Antes de introducir nuevos tokens visuales, valida si HeroUI ya ofrece una variante suficiente.

### Regla 3.1: Divisores y contornos con tacto

- Los divisores deben organizar, no cortar la pantalla con agresividad.
- En interfaces claras, los bordes estructurales y los contornos de tarjetas no deberían usar por defecto un negro duro si una versión más suave mantiene la legibilidad.
- Si una forma tiene radios amables, su borde y su sombra deben acompañar esa suavidad; una silueta blanda con contorno severo genera una materialidad incoherente.
- La IA no debe resolver la falta de capas convirtiendo cada bloque en una caja de formulario rígida.
- La dureza del trazo debe acompañar la materialidad general: si la pantalla usa superficies suaves y tonos ligeros, los separadores no deberían parecer trazos de rotulador técnico.
- Regla práctica: si al bajar mentalmente la oscuridad de líneas y contornos la pantalla mejora sin perder claridad, estaban demasiado agresivos.

### Regla 4: Estados interactivos

- Siempre cubre loading, empty state, error y feedback táctil.
- Para loading, usa skeletons proporcionados o equivalentes del sistema.
- `hover`, `focus`, `selected` y `open` deben verse correctos, no solo el estado cerrado.

### Regla 4.1: Agrupaciones de acciones con materialidad coherente

- Cuando varias acciones hermanas convivan en una misma fila o bloque, deben compartir huella visual, densidad y nivel de contenedor salvo que exista una razón funcional muy clara para romper el patrón.
- No mezclar en la misma agrupación un icono desnudo, un botón circular y otro con fondo distinto si todos representan acciones del mismo rango.
- La diferenciación entre acciones hermanas debe venir de la semántica, la jerarquía o el tono, no de parecer controles de familias distintas.
- Regla práctica: si al entrecerrar los ojos una fila de acciones parece compuesta por piezas de sistemas distintos, falta coherencia de materialidad.

### Regla 5: Overlays y componentes desplegables

Los LLM fallan mucho en esto; la skill debe comprobar explícitamente:

- popovers;
- listboxes;
- selects;
- dropdowns;
- accordions;
- modales.

No basta con estilizar el trigger. Hay que verificar también:

- fondo del overlay;
- contraste del texto;
- hover;
- selected;
- iconos;
- estados en tema claro y oscuro si el proyecto los soporta.

### Regla 6: Patrones de datos y formularios

- Label encima del input.
- Error debajo del campo.
- Ayuda solo si aporta.
- Si una primitive del design system introduce fricción visual, ajusta primero sus props, variantes o `classNames` antes de abandonar el sistema.

### Regla 6.0.1: Formularios embebidos sin pseudo-diálogo interno

- En una superficie operativa principal, un formulario corto no debe parecer un popup metido dentro de otra card salvo necesidad funcional real.
- Si el formulario solo recoge 1-3 campos y una acción principal, primero debe resolverse como parte del propio layout del bloque dominante.
- Solo conviene encapsularlo como sub-superficie fuerte cuando necesite aislamiento funcional real: validación compleja, scroll propio, varios grupos o separación clara de riesgo.

### Regla 6.1: Métricas, gráficos y dashboards

- Un KPI o gráfico debe leerse incluso cuando no hay datos, cuando hay pocos datos y cuando hay muchos.
- Las tarjetas analíticas no deben depender de overlays complejos para explicar su estado.
- En estados vacíos o parciales, prioriza estructuras reconocibles del propio gráfico: skeletons, barras placeholder, ejes simples o patrones de continuidad visual.
- La composición ideal de una tarjeta analítica responde a este orden: dato principal, contexto secundario, visualización, acción opcional.
- Si la visualización vacía se entiende mejor que una versión "decorada", gana la visualización vacía.

### Regla 6.1.1: Resúmenes operativos, no pseudo-tablas ambiguas

- Un resumen de cierre, balance o estado no debe quedarse a medio camino entre tabla informal, lista de labels y bloque de métricas.
- Si el contenido pide comparación estructurada, usa tabla o grid semántico claro.
- Si el contenido pide vistazo rápido, usa pocas métricas compactas con jerarquía fuerte.
- La IA no debe mezclar en la misma fila demasiados pares label/valor con distribución horizontal frágil solo porque "caben" en desktop.
- Regla práctica: si no está claro si un bloque se lee como tabla o como KPI, probablemente está mal compuesto.

### Regla 6.1.2: Laterales y paneles secundarios con ancho honesto

- Una columna lateral no debe usarse por defecto para contenido con fechas largas, estados, importes y varios metadatos si ese ancho obliga a truncar o apilar mal la información.
- Si el panel secundario contiene listas históricas ricas, la IA debe decidir explícitamente entre darle más ancho, simplificar radicalmente cada item o moverlo a otra superficie.
- Un lateral estrecho solo es correcto para contenido realmente resumible a una o dos líneas por item.
- Regla práctica: si una lista lateral corta sistemáticamente títulos, fechas o importes importantes, el patrón o el ancho están mal elegidos.

### Regla 6.1.3: Estados válidos con baja actividad

- Una pantalla no debe depender de valores altos, variación numérica o datos llamativos para sentirse viva y legible.
- Cuando muchos datos estén en cero, vacíos o sin movimiento, la interfaz debe conservar jerarquía y energía visual desde la composición.
- La IA no debe confiar en que el número grande o el dato "interesante" aparezca más tarde para resolver una pantalla que ahora mismo se ve muerta.
- Regla práctica: si con todos los valores en cero la UI pierde foco o intención, el diseño estaba delegando demasiado en el contenido.

### Regla 6.1.4: Separación entre resumen y detalle

- Un bloque de resumen operativo y un bloque de detalle o movimientos no deben convivir sobre la misma superficie con una separación tan débil que parezcan una sola masa de texto.
- Si una pantalla mezcla KPI, estado y lista de movimientos, la IA debe marcar con claridad dónde termina el vistazo rápido y dónde empieza el detalle exploratorio.
- Esa separación puede resolverse con estructura, espaciado, divisores o cambios de agrupación, no obliga por defecto a crear tarjetas extra.
- Regla práctica: si el usuario no distingue de un vistazo el resumen del detalle, falta un corte visual claro.

### Regla 6.1.5: Métricas hermanas como subconjunto reconocible

- Varias métricas del mismo rango, como `Inicial`, `Teórico` y `Saldo`, no deben quedarse como tres datos alineados que solo comparten una fila.
- La IA debe componerlas como un subconjunto reconocible mediante proximidad, ritmo, ancho compartido, una retícula clara o una superficie ligera si hace falta.
- El objetivo es que se lean como familia y segundo nivel de jerarquía, no como restos sueltos alrededor del bloque principal.
- Regla práctica: si al tapar el título de sección esas métricas parecen objetos independientes sin parentesco visual, falta cohesión.

### Regla 6.1.6: Detalle operativo compacto y estable

- Listas de movimientos, balances parciales o importes recurrentes no deben resolverse como texto suelto a la izquierda y cifras pegadas al extremo derecho con demasiado vacío entre medias.
- La IA debe dar al detalle operativo una estructura estable de lectura: columnas claras, ritmo vertical consistente, anchos razonables y cercanía suficiente entre concepto y valor.
- Compactar no significa endurecer con cajas por todas partes; significa reducir dispersión y hacer que el ojo pueda barrer el detalle sin perderse.
- Los separadores del detalle no deben cargar por sí solos la jerarquía del bloque; primero deben existir proximidad, ritmo, alineación y agrupación suficientes.
- Regla práctica: si el detalle parece más un lienzo con etiquetas dispersas que una estructura de lectura, sigue faltando composición.

### Regla 6.2: Quick actions en dashboards

- Un bloque de Quick actions no debe dar el mismo peso visual a todas las acciones por defecto.
- Si existe una acción principal clara del producto, debe dominar con una sola pieza destacada y legible de un vistazo.
- Las acciones secundarias deben resolverse como una lista operativa compacta, no como varias pseudo-tarjetas hinchadas con el mismo protagonismo.
- Las acciones no disponibles todavía deben verse preparadas pero subordinadas: bajo contraste, copy corto y un estado honesto como Próximamente.
- Regla práctica: si el bloque parece una pila de tarjetas grises repetidas, la jerarquía de acciones está mal resuelta.

### Regla 6.3: Teclados operativos (Numpads) y listas de atajos

- **Materialidad física vs. Ruido corporativo**: En interfaces con mucha interacción táctil (como calculadoras o TPVs), los botones del teclado no deben renderizarse con colores de variante `strong` (`secondary` o pálidos corporativos) porque dispersan la atención: efecto "cielo azul saturado".
- Emula teclas físicas robustas usando variantes neutras o nulas (ej. `variant="ghost"`) inyectando fondos puros crudos (`bg-white`), contraste extremo (`text-default-800` o `font-black`) y elevaciones imperceptibles de separación (`shadow-sm ring-1 ring-black/5`).
- **Problema de grilla colapsable**: Los botones de UI-Kits suelen ser `inline-flex`. Si se anidan dentro de celosías tipo `grid grid-cols-*` sin indicar un explícito `w-full h-full`, ignorarán la celda formando extraños botones "lápiz". Forzar el llenado es siempre clave.
- **Acción ganadora única**: Cuando hay varias vías rápidas que disparan un mismo embudo (Billetes "10€", "20€", "Exacto"), **SÓLO LA SOLUCIÓN IDEAL** debe dominar visualmente (`primary/solid`). El resto deben rebajarse categóricamente a variantes grises para que actúen como red de seguridad secundaria sin distraer el layout.

### Regla 7: Nada entra sin función clara

- No añadas texto, métricas, tarjetas, etiquetas, divisores, botones o bloques visuales solo para "rellenar" una pantalla.
- Cada elemento debe justificar su presencia con al menos una función clara: orientar, priorizar, informar, accionar o dar feedback.
- Si un bloque no mejora comprensión, jerarquía o uso real, debe eliminarse.
- Ante la duda, recorta antes de decorar.

## Playbook por superficie

### E-commerce

- Producto, precio, disponibilidad, confianza y acción principal deben leerse sin esfuerzo.
- En catálogos, prioriza escaneo, filtros claros y tarjetas consistentes antes que composición editorial.
- En detalle de producto, la imagen real y la acción de compra mandan; el storytelling no debe empujar fuera del flujo.

### Dashboard / SaaS operativo

- La navegación, el estado y las acciones aparecen antes que el discurso de producto.
- No conviertas una herramienta operativa en una landing interna.
- Evita duplicar la misma acción principal en una barra superior y otra vez dentro del contenido si no añade una ventaja operativa real.
- Si un CTA ya vive de forma dominante dentro de un bloque natural del dashboard, no necesita una segunda presencia arriba "por si acaso".
- La cabecera debe comportarse como un resumen ejecutivo: estado actual, contexto temporal y acciones reales, no una acumulación plana de metadata y botones sueltos.
- Si la pantalla ya tiene un estado operativo fuerte, la cabecera no debe competir con el bloque principal ni diluir su prioridad.
- En barras superiores con navegación horizontal, decide explícitamente si el grupo de tabs debe quedar centrado, agrupado o distribuido; no lo dejes flotando dentro de un carril `flex-1` que genere huecos muertos sin intención.
- El chrome persistente de la aplicación (`top bar`, `sidebar`, shell principal) no debe heredar por defecto el mismo `max-width` que el contenido de página.
- Si el proyecto usa `scrollbar-gutter: stable`, el chrome fijo a ancho completo debe cubrir el viewport visual real (`w-screen` o equivalente) o compensar explícitamente ese gutter.
- Una vista operativa de consulta debe dejar claro de un vistazo si su función principal es vigilar, actuar, revisar o cerrar.

### Auth / login

- El formulario manda.
- Titular corto, subtítulo corto, una sola nota útil.
- Nada de storytelling si compite con la acción.

### Admin / settings

- Layout estable, repetible y denso sin saturar.
- La agrupación y la nomenclatura importan más que adornos.
- Los cambios peligrosos deben separarse visualmente de la configuración cotidiana.

### Modal / drawer / popover

- Revisa el estado abierto, no solo el trigger.
- El foco, cierre, scroll interno, anchura y altura útil deben estar resueltos.
- El contenido debe tener una acción primaria clara y una salida secundaria visible.
- En mobile, confirma que no bloquea acciones, no corta texto crítico y no depende de hover.

### Tabla / listado

- Prioriza escaneo, alineación de columnas, acciones repetibles y estados vacíos útiles.
- No sustituyas una tabla necesaria por cards si se pierde comparación.
- Si una lista lateral corta datos importantes de forma sistemática, el patrón o el ancho están mal elegidos.

### Checkout / formulario

- Claridad, confianza y prevención de errores mandan sobre expresividad visual.
- Cada campo debe tener etiqueta, ayuda o error solo cuando aporte decisión.
- El resumen y la acción final deben permanecer visibles o fácilmente recuperables.

### Pantallas sobre design system existente

- La mejora debe venir de composición, densidad, jerarquía y estados.
- No reinventes la librería con CSS global improvisado.

## Errores conocidos que esta skill debe evitar

- Caer en landingitis cuando la superficie real es operativa.
- Usar gradientes, orbes, glows o decoración sin función clara.
- Revisar solo el estado cerrado de una pieza interactiva.
- Dar por bueno un responsive que solo "no rompe" pero pierde jerarquía.
- Copiar patrones de otra librería o versión sin verificar fuente viva.
- Añadir texto explicativo para tapar una UX poco clara.
- Meter demasiadas explicaciones en menús o superficies operativas.
- Resolver jerarquía metiendo cajas dentro de cajas en lugar de usar layout, espaciado y tipografía.
- Anidar `Card` dentro de `Card` o paneles internos sin una necesidad funcional clara.
- Resolver formularios cortos como si fueran un mini-diálogo metido dentro de la card principal sin necesidad funcional.
- Convertir un empty state simple en una composición con varias subtarjetas y varios mensajes compitiendo.
- Crear tokens globales para arreglar una sola pantalla sin validar su impacto.
- Dejar bien el trigger pero mal el dropdown/popover.
- Mezclar materialidades incompatibles dentro de la misma vista.
- Usar el mismo peso de borde para casi todos los elementos y luego intentar que la jerarquía la haga el contorno.
- Endurecer una UI clara con negros demasiado duros, separadores tajantes y contornos de wireframe para compensar una composición floja.
- Convertir bloques informativos en cajas demasiado rígidas cuando bastaría una mejor escala tonal o una mejor agrupación.
- Usar líneas y bordes tan oscuros que la pantalla parezca más agresiva que precisa.
- Usar defaults de librería sin calibrar contraste, hover, selected y focus.
- Intentar embellecer un sistema existente en vez de refinarlo.
- Colocar elementos para un screenshot concreto en vez de para un rango de tamaños reales.
- Depender de offsets manuales y espacios vacíos enormes para que algo parezca centrado.
- Confundir limpieza visual con falta de intención operativa.
- Dejar una pantalla demasiado plana porque todos los bloques usan una intensidad visual parecida.
- Confiar en el valor numérico o en datos futuros para crear jerarquía en vez de diseñarla desde la composición.
- Creer que un bloque ya está resuelto por tener un fondo destacado aunque su jerarquía interna siga mal distribuida.
- Dejar métricas hermanas alineadas pero sin identidad compartida, como si una misma fila ya bastara para agruparlas.
- Resolver detalle operativo con demasiado vacío horizontal entre etiqueta e importe y obligar al ojo a reconstruir cada pareja.
- Usar color semántico como adorno puntual sin una lógica consistente entre estados, métricas o movimientos.
- Dejar metadata de cabecera flotando, pegada al título o aislada en una esquina sin integrarla en el resumen operativo.
- Confiar en líneas de detalle demasiado gruesas u oscuras para ordenar una lista que en realidad sigue mal compuesta.
- Mezclar superficies suaves con trazos duros hasta que la vista parezca un wireframe encima de una UI amable.
- Cerrar una UI sin pensar qué pasa en portátil, monitor ancho, zoom alto o textos más largos.
- Dar al histórico o a un panel lateral el mismo o casi el mismo peso visual que a la acción principal del estado actual.
- Meter listas históricas complejas en columnas demasiado estrechas y aceptar truncados como si fueran inevitables.
- Dejar resúmenes de datos a medio camino entre tabla y métrica compacta en lugar de elegir un patrón claro.
- Usar una única superficie plana sin crear agrupaciones suficientes entre resumen, métricas y detalle.
- Distribuir texto y cifras por el lienzo como si la alineación por sí sola ya ordenara la pantalla.
- Dejar que resumen y detalle convivan con un corte visual demasiado débil y obligar al usuario a reconstruir los grupos mentalmente.
- Encadenar microfixes de spacing cuando el problema real vive en viewport, scroll, shell o contenedor raíz.
