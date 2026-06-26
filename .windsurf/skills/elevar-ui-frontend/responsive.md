# Responsive y adaptación profesional

Esta referencia desarrolla todo el criterio de adaptabilidad de `elevar-ui-frontend`. El `SKILL.md` principal señala cuándo cargarla; aquí está el detalle completo.

## Regla crítica: diseñar por rangos, no por monitor

La IA no debe intentar que una pantalla se vea idéntica en todos los ordenadores; debe hacer que conserve jerarquía, equilibrio y claridad en la mayoría de anchos reales.

El objetivo profesional no es la perfección milimétrica en un monitor concreto, sino un sistema robusto que no colapse cuando cambian resolución, zoom, densidad de píxel, tipografía efectiva o espacio útil.

Toda decisión de layout debe pensarse como un rango de comportamiento: qué pasa en estrecho, medio, ancho y muy ancho.

Si una composición solo se ve bien en un ancho concreto, está mal resuelta aunque “en tu pantalla” se vea perfecta.

## Sistema profesional de adaptación

La IA debe resolver la adaptabilidad con reglas de sistema, no con ajustes visuales puntuales.

### 1. Layout fluido

- Construye primero con `grid`, `flex`, `minmax()`, `auto-fit`, `auto-fill`, anchos relativos y contenedores con `max-width`.
- Usa `gap` consistente para separar bloques; evita repartir el espacio “a ojo” con márgenes arbitrarios.
- Prefiere `w-full` + `max-w-*` frente a anchos fijos cuando el bloque deba respirar en distintos monitores.
- Si un bloque necesita anchura mínima para seguir siendo comprensible, exprésala con `min-w-*` o `minmax()` en lugar de confiar en la suerte.

### 2. Constraints antes que offsets

- La jerarquía debe salir de constraints y alineación, no de `absolute`, `translate`, offsets manuales o números mágicos.
- El posicionamiento absoluto solo se justifica cuando la función lo exige de verdad: badges, overlays, anclajes, decoraciones o capas controladas.
- Si un elemento depende de estar “justo aquí” con `top-[47%]`, `left-[13px]` o separaciones frágiles para verse bien, la solución no es estable.
- Antes de usar coordenadas manuales, intenta resolver la composición con flujo normal del layout.

### 3. Escala fluida de tipografía y espacio

- Tipografía, paddings y gaps deben crecer o comprimirse con lógica, no con saltos bruscos arbitrarios.
- Usa `clamp()` cuando una pieza importante necesite escalar con elegancia entre tamaños.
- Evita titulares o métricas tan grandes que funcionen en desktop pero rompan la composición en portátil o en zoom 125%.
- El espacio en blanco debe ser deliberado, pero nunca depender de que sobre aire en una pantalla concreta.

### 4. Proporción y lectura

- Define para cada bloque qué elemento manda, cuál acompaña y cuál puede comprimirse primero.
- Un buen layout responsive mantiene la jerarquía aunque cambien anchura, idioma, zoom o longitud de copy.
- Los textos secundarios deben ser los primeros en recortarse; la acción principal y el dato principal deben sobrevivir.
- Si dos piezas compiten por el mismo espacio, la IA debe priorizar en este orden: acción crítica, dato crítico, contexto secundario, ornamento.

### 5. Estados consistentes

- `loading`, `empty`, `error` y `success` deben compartir la misma estructura base siempre que sea posible.
- Si el skeleton de carga se ve mejor y más limpio que el estado vacío final, la IA debe considerarlo una señal de que el empty state está sobreexplicado o sobrediseñado.
- Para datos aún no disponibles, prioriza placeholders estructurales del propio sistema antes que overlays, cajas internas o textos grandes superpuestos.

### 6. Pruebas mínimas de robustez visual

- La IA debe revisar al menos estos anchos mentales o reales antes de cerrar una UI: móvil estrecho, tablet vertical, portátil común, escritorio ancho.
- Cuando no pueda abrir varios viewports, debe razonar explícitamente cómo se comporta el layout en esos rangos.
- También debe vigilar zoom del navegador, altura útil reducida y diferencias de rendering entre equipos.
- “Se ve bien en mi monitor” nunca cuenta como validación suficiente.

### 7. Criterio práctico de validación visual

- **Mobile estrecho:** la acción principal, el título útil y los datos críticos siguen visibles o fácilmente accesibles.
- **Tablet / medio:** la UI no queda ni aplastada ni con huecos muertos que rompan la jerarquía.
- **Portátil común:** el flujo principal cabe con densidad razonable y sin depender de scroll accidental.
- **Escritorio ancho:** el contenido no se estira sin intención ni deja gutters falsos en shell o chrome persistente.
- **Textos largos:** etiquetas, nombres, importes y mensajes de error no pisan acciones ni rompen controles.
- **Estados abiertos:** drawers, modales, popovers, dropdowns y overlays mantienen foco, cierre, scroll y composición.
- **Estados pobres:** empty, loading y error se ven integrados y no más limpios que el estado final.

## Responsive y móvil profesional

Cuando el usuario pida "adaptar a móvil", "responsive", "mobile", "navegador móvil", "que se vea bien en el teléfono" o una formulación equivalente, la IA debe tratarlo como una experiencia propia por rango, no como una conversión mecánica del desktop.

### 1. Clasificación móvil obligatoria

Antes de implementar, criticar o cerrar, la IA debe clasificar:

- **Navegación:** menú, anchors, tabs, breadcrumbs, top bar, acciones persistentes y salida.
- **Jerarquía:** qué debe aparecer primero en móvil y qué puede bajar de prioridad.
- **Lectura:** longitud de textos, tamaño real, ritmo vertical y cortes naturales.
- **CTA:** acción principal, alcance con pulgar, repetición justificada y estados deshabilitados.
- **Imágenes y media:** foco visual, recorte, aspect ratio, peso percibido y alt text.
- **Interacción:** hover reemplazado por tap/focus, gestos, formularios, errores y teclado.
- **Scroll y altura útil:** quién hace scroll, barras del navegador, `100dvh`, sticky/fixed y overlays.

### 2. Repriorización, no apilado

- No basta con apilar columnas de desktop en una única columna.
- El contenido crítico no debe quedar enterrado al final de una pila larga si define la acción o comprensión principal.
- Los bloques secundarios pueden compactarse, agruparse, moverse o diferirse si el móvil necesita recuperar foco.
- Una web o app con desktop y móvil debe sentirse terminada en ambos rangos, no como una versión principal y una degradada.

### 3. Navegación y acciones móviles

- La navegación móvil debe poder abrirse, cerrarse, recorrerse con teclado y no tapar acciones críticas.
- Si hay CTA principal, debe ser visible o fácilmente recuperable sin depender de hover ni de precisión fina.
- En landings, portfolios y páginas editoriales, la primera pantalla móvil debe identificar la propuesta, persona, producto o pieza principal sin ocultar el siguiente bloque útil.
- En herramientas operativas, la acción crítica y el estado actual mandan por encima de ornamento, métricas secundarias o histórico.

### 4. Estados abiertos cuentan

- El estado abierto de menú, modal, drawer, popover, filtro, formulario, error y validación forma parte del responsive.
- No se puede cerrar una adaptación móvil revisando solo la pantalla base.
- Los overlays deben resolver foco, cierre, scroll interno, altura útil, acción primaria y salida secundaria.
- Si el teclado virtual puede aparecer, los campos, errores y acción final deben seguir siendo utilizables.

### 5. Cierre responsive mínimo

- No aceptar como cierre que "no rompe" o que "compila".
- Validar o razonar explícitamente al menos: móvil estrecho, móvil común, tablet vertical/medio, portátil común y desktop ancho.
- Si no hay navegador o screenshot real disponible, la IA debe declarar el riesgo residual y explicar cómo se comporta el layout en esos rangos.
- Cualquier cambio responsive real debe pasar por @qa-validador; si además redefine navegación, shell, layout transversal o design system, debe escalar antes a @arquitecto.
