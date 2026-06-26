---
name: elevar-ui-frontend
description: "UI, frontend, menu, modal, layout, visual, UX, responsive, movil y design system. Eleva la calidad visual respetando el lenguaje real del proyecto y evitando sesgos tipicos de LLM. TRIGGERS: UI, frontend, diseno, responsive, movil, mobile, viewport, adaptar a movil, layout."
---

# Elevar UI Frontend

## Objetivo

Elevar la calidad visual y de interacción del frontend sin romper el lenguaje real del producto.

La skill debe impedir dos fallos comunes:

- UI genérica de IA sin criterio de producto.
- Experimentos visuales que compiten con el design system ya presente.

## Checklist corto obligatorio

Antes de implementar o criticar una UI, la IA debe resolver este pase corto:

- Función de la pantalla: vender, operar, revisar, configurar, comprar, autenticar o navegar.
- Patrón visual existente: 2-3 pantallas o componentes hermanos revisados.
- Librería UI real: dependencias, imports y skill específica si existe.
- Jerarquía dominante: qué acción, dato o bloque manda en el estado actual.
- Estados interactivos: cerrado, abierto, hover/focus, loading, empty y error cuando apliquen.
- Responsive por rangos: mobile estrecho, tablet/medio, portátil común y escritorio ancho.
- Arquitectura de información: si se crea una página nueva o se reestructura una existente, resolver primero la planificación de estructura (ver [arquitectura-informacion.md](arquitectura-informacion.md)).
- Cierre visual mínimo: @revisor para pulido visual acotado, @qa-validador para interacción, responsive, estado, formularios, drawers, modales o accesibilidad.

## Fallos típicos de IA en UI

La IA debe vigilar activamente estos sesgos:

- **Landingitis:** convertir herramientas, dashboards o pantallas internas en páginas de marketing.
- **Card soup:** meter cards dentro de cards o cajas dentro de cajas para simular orden.
- **Decoración sin función:** gradientes, orbes, brillos, ilustraciones o adornos que no orientan ni accionan.
- **Copy compensatorio:** explicar dentro de la app lo que una buena jerarquía debería hacer evidente.
- **Responsive superficial:** comprobar que no explota pero no que conserve jerarquía y uso.
- **Screenshot único:** revisar solo el estado cerrado y olvidar dropdowns, drawers, modales, hover, focus, empty, loading y error.
- **Memoria de librería:** copiar patrones de otra versión, otra librería o mini-docs del brief sin verificar.
- **Jerarquía fingida:** endurecer bordes, divisores o sombras para compensar una composición floja.

# Alcance y límites

- Aplica cuando haya que diseñar, refinar o implementar interfaz frontend.
- Sí define reglas fuertes de UI, UX, composición, materialidad, estados y calidad visual.
- Sí puede endurecer decisiones visuales por defecto si el usuario no da una dirección clara.
- Sí puede condicionar arquitectura de componentes frontend cuando haga falta para preservar coherencia del sistema visual.
- No sustituye a `definir-arquitectura`; se apoya en la estructura técnica ya elegida.
- No sustituye a `configurar-entorno` ni a `configurar-testing`.
- No debe imponer una estética nueva si el proyecto ya tiene un design system o una librería UI dominante; en ese caso debe trabajar **dentro** de ese sistema.

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- SSOT y documentación visual del proyecto actual, si existen.
- Estructura real del frontend.
- `package.json` y configuración real del proyecto.
- Librería UI real detectada y patrones ya usados en el código.
- Restricciones explícitas del usuario sobre estética, densidad o branding.

# Comportamiento esperado

Antes de proponer o escribir código frontend, la skill debe:

- Revisar si la SSOT o la documentación visual del proyecto ya fijan un design system, una librería UI dominante o una fuente preferente de consulta.
- Inspeccionar el stack real del proyecto.
- Detectar si existe design system o librería UI dominante.
- Revisar dependencias y versiones antes de importar librerías.
- Inspeccionar 2-3 pantallas hermanas para entender el lenguaje visual real.
- Decidir el nivel de ambición visual en función de la superficie, no del ego estético.

## Configuración base activa

Línea base de trabajo. La IA no debe pedir al usuario que edite la skill; debe usar estos valores salvo que la persona indique explícitamente otros niveles.

- `DESIGN_VARIANCE`: `6` — variación moderada, con composición intencional pero sin caos.
- `MOTION_INTENSITY`: `3` — motion sobrio, casi siempre basado en estados nativos y transiciones cortas.
- `VISUAL_DENSITY`: `4` — densidad operativa media, clara y reutilizable.

## Arquitectura y convenciones por defecto

- **Verificación obligatoria de dependencias:** antes de importar librerías externas, revisa `package.json`. Nunca asumas que existen.
- **Framework e interactividad:** React o Next.js. Por defecto, prioriza `RSC`.
- **Seguridad RSC:** providers y estado global solo en componentes cliente.
- **Gestión de estado:** prefiere `useState` y `useReducer` locales para UI aislada.
- **Política de estilos:** usa Tailwind CSS para composición; el sistema UI existente manda sobre el CSS inventado.
- **Responsividad y espaciado:** estandariza `sm`, `md`, `lg`, `xl`.
- **Contención de layout:** usa `max-w-[1400px] mx-auto` o `max-w-7xl`.
- **Estabilidad de viewport:** usa `min-h-[100dvh]` en lugar de `h-screen`.
- **Grid sobre flex con cálculos:** no uses `w-[calc(...)]` complejos cuando CSS Grid resuelva mejor.

Para el criterio completo de adaptabilidad y responsive, ver [responsive.md](responsive.md).

## Design system primero

Si el proyecto ya usa una librería UI o design system visible, la skill debe preferir sus primitives y patrones oficiales, reutilizar variantes ya presentes y evitar wrappers estéticos o tokens paralelos sin necesidad probada. El detalle completo —incluyendo excepciones visuales documentadas, auditoría de tokens globales y delegación a skills o MCPs específicos de librería— está en [design-system.md](design-system.md).

## Directrices de composición y materialidad

La skill aporta criterio agnóstico de librería sobre composición, jerarquía, tipografía, color, materialidad, estados, formularios, métricas y dashboards. El detalle operativo completo vive en [composicion.md](composicion.md).

## Escalada diagnóstica para bugs visuales persistentes

Si un bug visual sigue igual tras 2-3 ajustes locales razonables de `padding`, `gap`, `justify`, `max-width` o distribución interna, la IA debe dejar de encadenar microfixes y reclasificar el problema.

Antes de seguir tocando espaciados, debe decidir en qué capa vive realmente el fallo:

- composición interna del componente;
- contenedor inmediato;
- shell o chrome persistente de la aplicación;
- viewport, scroll o raíces `html` / `body` / `#root`.

En `headers`, `top bars`, `sidebars`, elementos `fixed` o `sticky`, la revisión global es obligatoria e incluye al menos:

- quién hace scroll realmente;
- `overflow` en `html`, `body` y contenedor raíz;
- `scrollbar-gutter`;
- interacción entre `fixed` y viewport visual;
- uso de `w-screen`, `100vw`, `inset-x-0`;
- herencia indebida de `max-width` desde el contenido de página al chrome persistente.

Si el síntoma no cambia visualmente después de un ajuste local, la IA debe interpretar eso como señal de diagnóstico fallido, no como invitación a seguir probando offsets al azar. La prioridad es encontrar la capa causal antes que seguir ajustando la capa visible.

## Bucle de mejora de la skill

- Si durante una tarea la IA detecta que un fallo corregido ha sido favorecido por una laguna, ambigüedad o sesgo de esta skill, debe actualizar la skill de forma proactiva en la misma iteración o dejarlo explícitamente señalado como pendiente real.
- No debe tratar la corrección como un parche aislado si el problema revela una carencia reusable del criterio compartido.
- La mejora de la skill debe ser concreta y operativa: regla nueva, anti-patrón, checklist, ejemplo o flujo, no texto ornamental.
- La IA no debe esperar a que el usuario pida “actualiza también la skill” cuando la necesidad sea clara.
- Esta proactividad aplica a carencias importantes y reusables: sesgos de composición, reglas de jerarquía, estados, layout, design system, responsive o decisiones que puedan repetirse en muchas pantallas.
- No debe escalar a la skill microajustes locales de una sola vista, preferencias finas de espaciado o correcciones demasiado específicas que no generalicen bien.
- El objetivo es que cada corrección relevante reduzca la probabilidad de repetir el mismo error en tareas futuras.

# Flujo recomendado

- [ ] Leer `docs/SSOT.md` y `docs/AI_GLOBAL_RULES.md`.
- [ ] Revisar si el proyecto ya documenta su estilo, librería UI dominante o fuente preferente de consulta.
- [ ] Inspeccionar stack, design system y pantallas hermanas.
- [ ] Revisar `package.json` y confirmar dependencias.
- [ ] Detectar si el proyecto pide continuidad con una librería UI existente.
- [ ] Decidir niveles razonables de `DESIGN_VARIANCE`, `MOTION_INTENSITY` y `VISUAL_DENSITY`.
- [ ] Si se va a crear una página nueva o reestructurar una existente, resolver primero la planificación de estructura (ver [arquitectura-informacion.md](arquitectura-informacion.md)).
- [ ] Resolver primero la composición con primitives del sistema real (ver [design-system.md](design-system.md)).
- [ ] Aplicar criterio de composición, jerarquía y materialidad (ver [composicion.md](composicion.md)).
- [ ] Resolver adaptabilidad por rangos reales, no por monitor (ver [responsive.md](responsive.md)).
- [ ] Recortar copy antes de añadir adornos, cajas o notas explicativas.
- [ ] Verificar que el layout se sostiene por constraints y flujo, no por números mágicos.
- [ ] Revisar estados abiertos y overlays, no solo estados cerrados.
- [ ] Cubrir estados interactivos y empty states.
- [ ] Comparar si el loading/skeleton resulta más limpio que el estado final; si sí, simplificar.
- [ ] Si un bug visual persistió tras varios ajustes locales, revisar explícitamente viewport, scroll, `html/body/#root` y chrome persistente antes de cerrar.
- [ ] Si la tarea es crítica de interfaces, aplicar el método de [critica.md](critica.md).
- [ ] Revisar la salida final con el checklist de calidad visual y técnica.

# Accesibilidad mínima obligatoria

Todo elemento interactivo debe cumplir estos requisitos básicos:

- `aria-label` en botones, iconos y enlaces sin texto visible.
- `aria-expanded` en elementos que abren/cierran contenido (dropdowns, accordions, menus).
- `aria-label` en botones de cerrar (modales, lightboxes, drawers).
- Navegación por teclado en todos los elementos interactivos (Enter, Escape, Tab).
- Focus visible en elementos interactivos (`:focus-visible`).
- HTML semántico: `<button>` para acciones, `<nav>` para navegación, `<main>` para contenido principal.
- `alt` text descriptivo en imágenes de contenido (no en decorativas).
- `<label>` asociado a todo `<input>`, `<select>` y `<textarea>`.
- Contraste mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande).
- `role` ARIA correcto cuando el HTML semántico nativo no es suficiente.

# Checklist final antes de entregar

- [ ] Reutilizo el design system real antes de inventar piezas nuevas.
- [ ] La pantalla deja una acción dominante clara y el bloque protagonista está bien compuesto por dentro.
- [ ] Evité meter cajas dentro de cajas salvo necesidad funcional real.
- [ ] Reviso estados interactivos: cerrado, abierto, hover, loading, empty y error.
- [ ] La composición aguanta cambios de ancho y no solo un screenshot concreto.
- [ ] En móvil, la navegación, el CTA principal, el scroll y los estados abiertos siguen siendo utilizables.
- [ ] El layout depende de estructura y constraints, no de offsets frágiles.
- [ ] La cantidad de texto es proporcional a la superficie.
- [ ] El color semántico tiene un significado consistente y no actúa solo como adorno.
- [ ] Todo botón/icono interactivo tiene `aria-label`, los inputs tienen `<label>`, HTML semántico, `aria-expanded` y focus visible.
- [ ] Los radios, bordes y sombras son consistentes.
- [ ] Los overlays y dropdowns se ven bien en abierto.
- [ ] Si un bug visual persistió tras ajustes locales, validé viewport, scroll y contenedor raíz.
- [ ] Evité introducir tokens globales innecesarios.
- [ ] El contenido crítico no queda enterrado al final de una pila móvil por conservar el orden exacto de desktop.
- [ ] Si es una página nueva, la estructura de contenido fue planificada con arquitectura de información antes de implementar.

# Criterio de resultado bueno

La skill está bien aplicada si:

- la UI deja de parecer genérica sin romper el sistema existente;
- el design system real se usa como base visible casi completa cuando existe;
- la composición, densidad y estados mejoran sin inventar otra librería por encima;
- la jerarquía se resuelve sin apilar cajas innecesarias;
- la composición resiste cambios razonables de ancho, zoom y longitud de contenido;
- la estructura de contenido de páginas nuevas está planificada con criterio de arquitectura de información;
- el texto queda comprimido y funcional, no ornamental;
- dropdowns, modales y overlays funcionan visualmente, no solo el estado base;
- y el frontend final se siente deliberado, técnico y coherente.

## Triggers

- **Keywords:** UI, frontend, diseño, componente visual, layout, estilos, UX, pantalla, interfaz, responsive, móvil, mobile, viewport.
- **Patrones de usuario:** "eleva este frontend", "mejora la UI", "revisa el diseño", "componente visual", "ajusta la pantalla", "adaptalo a móvil", "hazlo responsive", "que se vea bien en el teléfono".
- **Encadenamiento:** después de `definir-arquitectura` cuando el proyecto tenga interfaz; antes de `validar-calidad` o @qa-validador cuando toque responsive, móvil, viewport, navegación, formularios, overlays o accesibilidad.

# Ejemplos de activación

"Eleva este frontend respetando al máximo HeroUI y sus patrones oficiales."


