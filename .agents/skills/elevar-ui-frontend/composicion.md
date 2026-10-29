# Composición, materialidad y patrones visuales

Esta referencia recoge criterios de ingeniería de diseño para `elevar-ui-frontend`: composición, tipografía, color, materialidad, estados, formularios, dashboards y playbooks por superficie. El `SKILL.md` principal resume cuándo aplicarlos. Los ejemplos describen relaciones y decisiones; no son valores, componentes ni geometrías obligatorias.

## Directrices de ingeniería de diseño

### Regla 0: La superficie manda

- Clasifica la pantalla: `login/auth`, `dashboard`, `settings`, `wizard`, `empty state`, `table`, `catalog`, `detail`, etc.
- La prioridad es la claridad operacional de la superficie real, no demostrar rango visual.

### Regla 0.0a: Variación localizada y trazable

- En brownfield, cualquier aumento de expresividad, movimiento o compactación debe poder explicarse contra el patrón interno de una superficie hermana; no basta citar una tendencia o un valor numérico.
- Si el contrato usa `design_variance`, `motion_intensity` o `visual_density`, sus valores describen la relación con el sistema existente y el alcance local. No determinan por sí mismos color, spacing, duración, componentes ni estructura.
- Una referencia externa aprobada puede inspirar rasgos transferibles como ritmo, contraste relativo o revelado progresivo, pero no justifica copiar sus píxeles, geometría, marca o composición completa.
- La ausencia de referencia o de valor numérico no crea un hueco de diseño: conservar el patrón heredado es una decisión válida hasta que la tarea aporte evidencia para variar.

### Regla 0.0: Jerarquía percibida, no declarada

- Antes de estilizar, asigna a cada bloque un rol: contexto, sección, control, ayuda, estado, detalle o acción. Decide qué relaciones deben leerse como continuidad, agrupación, prioridad o separación.
- Una diferencia de clases, tokens, tamaño o peso no demuestra por sí sola que dos roles se distingan. La prueba es la lectura que transmite la interfaz en el perfil y estado relevantes.
- Cuando dos roles deban diferenciarse de inmediato, combina las señales que el sistema y la superficie necesiten: posición, agrupación, ritmo, superficie, contraste, tipografía, iconografía o comportamiento. Ninguna señal ni patrón es obligatorio por sí solo.
- Si el usuario dice que dos niveles "parecen iguales", trátalo como evidencia de jerarquía insuficiente. Revisa primero la relación entre roles y la composición; no defiendas la intención del CSS ni encadenes ajustes arbitrarios.
- Regla práctica: si un observador necesita leer todos los títulos para saber qué pertenece a qué, la relación visual sigue sin estar resuelta.

### Regla 0.0.1: Contexto útil, no repetido por decoración

- La navegación, la ruta, el estado de página y el contenido pueden aportar contexto simultáneamente. Decide si repetirlo dentro de la superficie cambia una decisión, aclara una excepción o sostiene la orientación.
- No añadas una cabecera, resumen o etiqueta interna solo para que la pantalla parezca más importante. Mantén la repetición cuando aporte estado, riesgo, acción o orientación que el contexto exterior no da.
- Regla práctica: si al retirar una repetición el usuario conserva ubicación, propósito y siguiente decisión, esa repetición no era necesaria.

### Regla 0.1: Una superficie dominante por bloque

- Si una pantalla o superficie ya define una unidad clara, no añadir por defecto más paneles internos solo para aparentar orden.
- Resolver primero estados vacíos, métricas y acciones con estructura, espaciado, tipografía y una materialidad coherente antes de crear una nueva capa visual.
- Una sub-superficie se justifica cuando aísla una función distinta y real, como una decisión de riesgo, un área con comportamiento propio o contenido que necesita otro modo de exploración.
- Regla práctica: si al retirar una capa interna la relación entre contenido y acción sigue siendo clara, esa capa sobraba.
- En dashboards operativos, apilar superficies por estética es un anti-patrón por defecto.

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

- La IA debe preferir relaciones de layout estables, alineación, anchuras con intención y agrupación antes que empujes visuales artificiales.
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

### Regla 1: Tipografía subordinada al rol

- Determina el contraste tipográfico por función y relación, no por una escala universal. Contexto, sección, control, ayuda y estado no necesitan la misma presencia.
- Usa el sistema tipográfico real del producto. Una familia, peso, tamaño o ancho concreto solo se fija cuando el design system, legibilidad o una necesidad funcional lo justifican.
- Mantén el cuerpo y los párrafos sobrios y cortos; no uses texto de apoyo por defecto si no añade claridad real.

### Regla 1.1: Presupuesto de texto

- La IA debe trabajar con un presupuesto de copy proporcional a la complejidad y riesgo de la decisión, no con texto infinito.
- En superficies operativas, conservar solo título, apoyo y acción que cambien comprensión, consecuencia o siguiente paso; la cantidad concreta depende del contexto.
- No explicar con texto lo que ya se entiende por jerarquía visual, etiqueta o comportamiento del control.
- Comprimir, revelar bajo demanda o retirar texto cuando no cambie la comprensión.
- En estados vacíos, usar el mínimo contenido que oriente, explique el estado y permita continuar si existe una acción útil.

### Regla 1.2: Copy resiliente

- El copy debe sobrevivir a traducciones, nombres largos y zoom sin destruir la composición.
- No bases el equilibrio de un bloque en que una frase mida exactamente lo mismo que en tu pantalla.
- Evita textos decorativos largos en zonas estrechas o densas.
- Si el texto es importante, dale espacio estructural real; si no lo es, recórtalo.

### Regla 2: Color y materialidad

- Usa el acento con intención y según la semántica del sistema. Evita varios acentos compitiendo cuando no representan relaciones o estados diferentes.
- Ajusta saturación, contraste y profundidad al lenguaje visual existente; no importes una estética por defecto.
- Diferencia claramente fondo, superficie, control y estado seleccionado cuando la tarea requiera que se lean como roles distintos.

### Regla 2.1: Materialidad refinada en interfaces claras

- Cuando una interfaz clara necesite más estructura, la IA debe introducirla primero con una escala tonal más rica, no endureciendo todos los contornos.
- La separación entre fondo, superficie principal, bloques secundarios y controles debe poder leerse también por tono, profundidad suave o densidad, no solo por líneas negras.
- Una UI clara no debe resolverse como wireframe finalista: bordes oscuros, divisores tajantes y texto casi todo en el mismo negro suelen endurecer la pantalla y volverla menos elegante.
- Regla práctica: si una propuesta mejora la organización pero se siente más dura, más tosca o más "dibujada a rotulador", falta refinamiento de materialidad.

### Regla 2.2: Color semántico con significado consistente

- Si la IA introduce color semántico en métricas, estados o movimientos, ese color debe responder a una lógica estable y repetible, no a una decoración puntual.
- Cualquier código cromático debe conservar una relación reconocible con éxito, riesgo, alerta, neutralidad o categoría operativa, según el sistema real del producto.
- No basta con que el color "quede bien"; debe ayudar a leer y priorizar sin sembrar dudas sobre por qué una cifra o etiqueta está resaltada.
- Regla práctica: si el usuario no puede explicar en una frase qué significa cada color usado en la pantalla, la semántica cromática está floja.

### Regla 2.2.1: No confundir estado con contador

- La IA debe distinguir entre un dato semántico y un dato cuantitativo antes de colorearlo.
- Un estado real puede merecer color semántico; un contador o resumen cuantitativo no debe parecer éxito, alerta o error solo por decoración.
- Si una pieza solo informa cuántas cosas hay, debe leerse como metadata o contexto, no como estado del sistema.
- Regla práctica: si al quitar el color el significado del elemento no cambia, probablemente ese color no era semántico sino ornamental.

### Regla 3: Sombras, bordes y radios

- Diferencia estructura, controles y detalle solo en la medida necesaria para que cada rol se lea sin endurecer toda la interfaz.
- Usa profundidad y contorno con contención; no introduzcas efectos que compitan con la información.
- La geometría de controles, superficies y overlays debe conservar la coherencia que marque el sistema real.
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

- Mantén una relación estable y accesible entre etiqueta, control, ayuda y error; su disposición concreta debe respetar el patrón real del producto y conservar la lectura del campo.
- Sitúa el error de forma que se asocie inequívocamente al campo afectado y no compita con otros mensajes.
- La ayuda solo debe persistir si aporta a la decisión.
- Si una primitive del design system introduce fricción visual, ajusta primero sus props, variantes o `classNames` antes de abandonar el sistema.

### Regla 6.0.1: Formularios embebidos sin pseudo-diálogo interno

- En una superficie operativa principal, un formulario corto no debe parecer un diálogo artificial dentro de otra capa salvo necesidad funcional real.
- Si el formulario recoge pocos datos y una acción principal, primero debe resolverse como parte del propio layout del bloque dominante.
- Solo conviene encapsularlo como sub-superficie fuerte cuando necesite aislamiento funcional real: validación compleja, scroll propio, varios grupos o separación clara de riesgo.

### Regla 6.1: Métricas, gráficos y dashboards

- Un KPI o gráfico debe leerse incluso cuando no hay datos, cuando hay pocos datos y cuando hay muchos.
- Las tarjetas analíticas no deben depender de overlays complejos para explicar su estado.
- En estados vacíos o parciales, prioriza estructuras reconocibles del propio gráfico: skeletons, barras placeholder, ejes simples o patrones de continuidad visual.
- La composición debe hacer explícita la relación entre dato dominante, contexto, visualización y acción cuando existan; el orden concreto depende de la tarea que la persona viene a resolver.
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

- Un bloque de acciones rápidas no debe dar el mismo peso visual a todas las acciones por defecto.
- Si existe una acción principal clara del producto, debe dominar de forma legible de un vistazo.
- Las acciones secundarias deben organizarse como un conjunto operativo subordinado, no como piezas hinchadas con el mismo protagonismo.
- Las acciones no disponibles todavía deben verse preparadas pero subordinadas: bajo contraste, copy corto y un estado honesto como Próximamente.
- Regla práctica: si el bloque parece una pila de tarjetas grises repetidas, la jerarquía de acciones está mal resuelta.

### Regla 6.3: Teclados operativos (Numpads) y listas de atajos

- **Materialidad útil frente a ruido corporativo**: En interfaces táctiles u operativas, los controles repetidos deben favorecer reconocimiento, pulsación segura y lectura rápida antes que una paleta de variantes compitiendo.
- Usa las primitives del sistema para mantener contraste, consistencia y una separación física suficiente. Elige la variante concreta tras consultar el sistema real; no conviertas una clase o color de una librería en receta general.
- **Grilla con huella completa**: Comprueba que los controles ocupan y respetan la celda que representa su área táctil. Las primitives con tamaño intrínseco pueden romper la retícula aunque su estilo parezca correcto.
- **Acción ganadora única**: Cuando varias vías convergen en un mismo resultado, deja clara la opción preferible y subordina las alternativas sin volverlas invisibles. La jerarquía viene de la consecuencia y el flujo, no de una variante memorizada.

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
- En barras superiores con navegación horizontal, decide qué relación espacial expresa pertenencia, prioridad y equilibrio; no dejes el grupo en un espacio residual sin intención.
- El chrome persistente de la aplicación (`top bar`, `sidebar`, shell principal) no debe heredar por defecto las restricciones de anchura del contenido de página. Verifica la relación con el viewport y el scroll real.
- Una vista operativa de consulta debe dejar claro de un vistazo si su función principal es vigilar, actuar, revisar o cerrar.

### Auth / login

- El formulario manda.
- Titular corto, subtítulo corto, una sola nota útil.
- Nada de storytelling si compite con la acción.

### Admin / settings

- Layout estable, repetible y denso sin saturar.
- La agrupación, la nomenclatura y la diferencia perceptible entre secciones y controles importan más que los adornos.
- Antes de destacar una sección, determina qué la hace distinta de una configuración individual: propósito, consecuencias, relación con otros ajustes o riesgo. El tratamiento visual debe expresar esa relación sin imponer un formato único.
- La ayuda secundaria debe aparecer al nivel de detalle que exige la decisión; no debe competir de forma permanente con ajustes rutinarios.
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

- Confundir una diferencia declarada en codigo con una diferencia percibida entre roles semanticos.
- Convertir una solucion visual local o una referencia puntual en una receta obligatoria para todas las pantallas.
- Responder a feedback como "esto parece igual" defendiendo la intencion de estilos en lugar de comprobar la lectura y cambiar de hipotesis.
- Validar jerarquia desde el DOM, las clases o un estado aislado sin evidencia visual del perfil y estado que importan.
- Caer en landingitis cuando la superficie real es operativa.
- Usar gradientes, orbes, glows o decoración sin función clara.
- Revisar solo el estado cerrado de una pieza interactiva.
- Dar por bueno un responsive que solo "no rompe" pero pierde jerarquía.
- Copiar patrones de otra librería o versión sin verificar fuente viva.
- Añadir texto explicativo para tapar una UX poco clara.
- Meter demasiadas explicaciones en menús o superficies operativas.
- Resolver jerarquía metiendo cajas dentro de cajas en lugar de usar layout, espaciado y tipografía.
- Anidar superficies o paneles internos sin una necesidad funcional clara.
- Resolver formularios cortos como si fueran un mini-diálogo metido dentro de la superficie principal sin necesidad funcional.
- Convertir un estado vacío simple en una composición con varias sub-superficies y mensajes compitiendo.
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
