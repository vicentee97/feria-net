---
name: elevar-ui-frontend
description: "Usar cuando vayas a tocar UI o frontend (menu, modal, layout, navbar, responsive, movil, design system) y necesites elevar la calidad visual respetando el lenguaje real del proyecto, verificando jerarquia percibida y evitando sesgos tipicos de LLM. TRIGGERS: UI, frontend, diseno, jerarquia visual, refinamiento visual, responsive, movil, mobile, viewport, adaptar a movil, layout, rediseño, mejora visual, premium, one-shot."
---

# Elevar UI Frontend

# Objetivo

Elevar la calidad visual y de interaccion del frontend sin romper el lenguaje real del producto. La skill debe impedir dos fallos:

- UI generica de IA sin criterio de producto.
- Experimentos visuales que compiten con el design system ya presente.

La accion dominante, el dato critico y el estado actual deben leerse en menos de 2-3 segundos.

## Contrato visual y micro-loop perceptivo

Cuando el usuario pida una UI `premium`, `wow`, distintiva, una pagina nueva, una reestructuracion visual relevante o un refinamiento iterativo, MUST cerrar antes de implementar un contrato visual breve:

- funcion de la pantalla y usuario principal;
- accion o dato dominante en la primera lectura;
- roles que deben distinguirse y la relacion que el usuario debe percibir entre ellos;
- claim perceptivo observable, por ejemplo que una seccion se distinga de sus ajustes sin leer todos los textos;
- referencia positiva y anti-referencia, si existen, extrayendo rasgos transferibles en vez de copiar la solucion; si no existen, citar 1-2 de las mejores superficies del propio proyecto como vara de nivel (el gusto generico de LLM no es la vara);
- tesis visual, densidad y detalle bajo demanda;
- perfil/viewport y estados que aportan evidencia suficiente.

El `one-shot` es externo, no interno: MUST ejecutar `formular hipotesis -> implementar -> renderizar -> criticar -> corregir` antes de enseñar el resultado. Cuando el cambio altere jerarquia o el usuario diga que dos niveles "parecen iguales", repetir el micro-loop mientras cada pasada pruebe una hipotesis distinta y aporte evidencia nueva. No activar el loop multiagente formal para una pantalla puntual; usar validacion proporcional. La evidencia se captura en navegador real con el tema real del proyecto (el que compila y usa el usuario); si falta navegador, auth, datos o vision, declarar `validacion visual pendiente` en vez de fingir el gate.

Un microajuste que no cambia jerarquia, lectura, estados ni responsive no abre este bucle completo.

### El problema One-Shot (6-sep): por que los rediseños salen tibios y como exigir mas

Cuando el dueño pida un rediseño visual cuyo resultado deba verse PREMIUM a la primera (su verbatim: «que parezca que 10 diseñadores de Apple han estado meses trabajando»), el micro-loop de 1 pasada no basta: un LLM sin vara concreta converge al promedio seguro. Cura en 6 palancas:

1. **MAGNITUD DEL PEDIDO, no palabra magica (decision del dueño 6-sep)**: «rediseño», «mejora visual» de una superficie entera (no de un boton), «quiero que estes horas», «hazlo premium» → protocolo completo. Un retoque puntual de un elemento → flujo normal (microajuste). Ante la duda de magnitud, PREGUNTAR una vez («¿esto es retoque o rediseño completo?») — nunca adivinar a la baja.
2. **PEDIDO CONCRETO**: jamas aceptar «mas bonito». Traducir SIEMPRE a criterios observables (accion dominante, jerarquia de 3 niveles, densidad aireada vs compacta, que se lee en 2 s, cual es el elemento WOW). Si el dueño no los da, el diseñador LOS PROPONE (3-5) y el dueño los aprueba viendo variantes.
3. **VARA EXTERNA Y CONCRETA**: citar referencias por nombre de archivo de la galeria de referencias declarada en las preferencias del proyecto (`ui.reference_gallery_root` en SSOT/preferences; si la carpeta no existe o no esta disponible, usar 2 superficies reales del propio proyecto como vara) o del propio proyecto («la vara es el modal receta actual») — «premium» no es vara, es adorno.
4. **VARIANTES EN VIVO, ELEGIDAS VIENDO**: para composicion/estructura relevante, el diseñador monta 2-3 variantes RENDERIZADAS (CSS inyectado sobre la app viva — protocolo de simulacion visual — o prototipo standalone), capturas lado a lado, y el dueño ELIGE antes de que el implementador toque nada. Elegir entre opciones buenas ≠ pedir cambios sobre una opcion unica.
5. **PULIDO N-PASADAS**: el micro-loop se repite en bucle con presupuesto (2-6 h) y criterios de parada (abajo). Cada pasada prueba UNA hipotesis distinta y aporta evidencia nueva (captura+medida), jamas re-toca lo ya verde.
6. **CRITICOS ROTANDO + OSCILACION = ALARMA**: cada pasada de critica usa UN perfil (ciclando): (a) Apple-esque — aire, proporcion, ritmo, detalle obsesivo; (b) Refactoring UI — jerarquia es todo, de-enfasis para enfatizar, etiquetas como ultimo recurso; (c) Densidad&info — un vistazo del camarero: accion dominante clara, saturacion cero, estados visibles; (d) Motion — coreografia con intencion (150-300 ms, easing honesto, `prefers-reduced-motion`); (e) Tokens — consistencia del sistema (espaciado 4/8/16/24/32, 5-9 tonos por color, sombras de elevacion); (f) Anti-slop — caza de lo generico de IA: Inter/purpura-sobre-blanco, gradientes sin proposito, esquinas todo-16px, el «medio seguro» ni aireado ni denso. Y si una pasada revierte lo que otra habia hecho (bitacora por pasada), NO seguir tocando: congelar, revisar el criterio y citar la vara — la oscilacion sin evidencia nueva es la firma de dos criticos sin vara compartida.

**Criterios de parada del bucle** (se para al cumplir UNO): cero P1 y ≤2 P2 residuales citados al dueño; pasada completa sin mejoras sustanciales; presupuesto de tiempo agotado.

**Barrido pre-dueño «ojo de dueño simulado» (nacido del QA-1 de TEAM_0416, 6-sep: 10 defectos del dueño tras una sonda 10/10 verde + revisor APTO)**: antes de enseñar un rediseño al dueño, una pasada de diseñador ejecuta EXPLÍCITAMENTE esta checklist — los defectos que el dueño caza no los mide la sonda: (1) **duplicación de información** (mismo dato en cabecera Y pie, título de sección + label de columna que dicen lo mismo); (2) **ritmo de espaciado** (medir px entre filas/secciones: ni apretado ni «demasiado aire» — preguntarse si ABURRE el espacio en blanco); (3) **adornos que sobran** (divisores/bordes que no delimitan nada — si el dueño lo llama «feo», fuera); (4) **calidad de animación** (drag/transition nativos cutres vs librería fluida — el dueño compara con apps de consumo, no con 'funciona'); (5) **estados secundarios diseñados** (alertas de modo, vacíos, warnings: no 'apenas se ven'); (6) **jerarquía del título** (qué palabra lleva el peso — el IDENTIFICADOR manda, no la coletilla); (7) **mensajes largos inline** → icono+tooltip cuando el estado es estable (y menos saltos de altura). Cada punto del checklist o se aplica o se descarta CON MOTIVO escrito.

## Presupuesto y ritmo del bucle premium

- Presupuesto por defecto: 2 h de reloj o 4 pasadas; max 6 h / 8 pasadas sin escalarlo al dueño.
- Cada pasada deja bitacora: hipotesis, diff (archivos+cifras), captura, critico de turno, P1/P2/P3 contados.
- Prohibido re-abrir lo que una pasada dejo verde salvo con evidencia nueva (medida o captura que lo contradiga).
- El critico NUNCA implementa (separacion juez/ejecutor): la critica la hace un agente distinto al que escribio el codigo.

## Diales y procedencia para UI brownfield

En una mejora sobre un producto existente, los diales expresan la direccion local de **esa superficie**, no una receta ni tokens nuevos para todo el producto. El contrato visual puede registrar, para cada uno, `hereda` o un entero de `1-10`:

- `design_variance`: cuanto se aparta esta solucion de los patrones visuales ya presentes.
- `motion_intensity`: cuanto movimiento perceptible aporta la interaccion; respeta `prefers-reduced-motion` y nunca sustituye feedback, foco o estado por animacion.
- `visual_density`: cuanta informacion y controles se muestran por area, sin ocultar decisiones, errores o contexto necesario.

`hereda` es el default: conserva el nivel comprobado en las pantallas hermanas. Un valor numerico es relativo al sistema real, no prescribe pixeles, duracion, clases, componentes ni geometria. Antes de elevarlo o reducirlo, declarar el motivo, la superficie afectada y que el cambio no convierte ese valor en una norma global. Si el usuario no fija un valor y la evidencia interna no exige variacion, mantener `hereda`.

Toda referencia usada en el contrato tiene exactamente un `provenance` enum: `internal`, `user-provided`, `external-approved` o `none`.

- `internal`: patron, captura o pantalla ya perteneciente al producto. Tiene prioridad para un cambio brownfield.
- `user-provided`: referencia aportada explicitamente por la persona usuaria. Esa aportacion ya expresa la autorizacion para considerarla en el contrato; no exigir una segunda aprobacion. Registrar que rasgo solicita y no convertir por inferencia su estilo completo en una regla global.
- `external-approved`: fuente externa descubierta por ella (la IA), es decir, una fuente externa descubierta por la IA, y aprobada despues de forma explicita por la persona usuaria. Una URL, nombre o intuicion que la IA encuentre sin esa aprobacion sigue siendo una fuente externa no aprobada.
- `none`: no hay una referencia operativa; usar el design system y las pantallas hermanas disponibles, sin fingir una fuente.

Una referencia externa solo se admite con aprobacion explicita. Registrar solo rasgos transferibles (por ejemplo, ritmo, jerarquia, nivel de ruido, progresion de revelado o densidad), junto con lo que se excluye. NEVER copiar pixeles, medidas exactas, layout completo, identidad de marca ni una captura como especificacion. La procedencia y los rasgos dejan trazabilidad, no autorizan un calco.

### Bloqueadores objetivos y avisos

Un **bloqueador objetivo** (`blocker objetivo`) impide ejecutar la parte afectada hasta resolverlo: usar una referencia externa sin aprobacion explicita, una orden que contradice requisitos de accesibilidad/funcionales verificables, o una dependencia de render indispensable sin acceso a la pantalla/estado que debe probarse. Declarar el alcance bloqueado y escalar; no inventar aprobacion ni evidencia.

Un **aviso** no impide un cambio proporcional (`advisory`): no tener referencia, que un dial no venga numerado, preferir otra densidad razonable o no poder convertir un gusto en un defecto observable. En ese caso conservar `hereda` o documentar la hipotesis, usar referencia interna cuando exista y marcar la validacion visual pendiente si corresponde. Nunca presentar un aviso estetico como P1 ni un blocker como una preferencia.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par mal -> bien -> ejemplo. Reconocer el anti-patron no basta para vencerlo.

- **Landingitis:** MAL convertir herramienta, dashboard o pantalla interna en pagina de marketing. BIEN resolver la superficie operativa real (vigilar, actuar, revisar, configurar). Ej: un dashboard prioriza estado actual y accion dominante, no un discurso comercial.
- **Card soup:** MAL meter card dentro de card o cajas dentro de cajas para "ordenar". BIEN resolver primero con estructura, agrupacion, espaciado y una materialidad coherente. Ej: un bloque mantiene una sola superficie salvo que exista aislamiento funcional real.
- **Decoracion sin funcion:** MAL introducir adornos que no orientan ni accionan. BIEN cada elemento justifica orientar, priorizar, informar, accionar o dar feedback. Ej: si al quitar un adorno no se pierde claridad, sobra.
- **Copy compensatorio:** MAL explicar dentro de la app lo que una buena jerarquia haria evidente o mantener toda la ayuda visible "por seguridad". BIEN recortar copy y revelar detalle bajo demanda cuando no cambie la decision. Ej: una explicacion secundaria se consulta, no compite con la tarea principal.
- **Copy que miente:** MAL microcopy con tiempo relativo que falsifica casos borde. BIEN adaptar el copy al estado real o mostrar el dato concreto. Ej: "Cobrar ayer" sobre una jornada cerrada hace dos dias miente; mostrar la fecha real.
- **Comportamiento roto en rediseno:** MAL reescribir tests o alterar contratos para que el rediseno pase. BIEN la suite de tests existente debe seguir verde sin reescribir tests; si un test exige reescritura, el cambio ya no es visual y se devuelve como cambio de comportamiento. Ej: un rediseno que rompe la maquina de estados y obliga a reescribir sus tests.
- **Premium como decoracion:** MAL traducir `premium` a mas efectos o componentes. BIEN traducirlo a direccion, proporcion, jerarquia, ritmo y un detalle justificable. Ej: una prioridad clara y transiciones cuidadas, no efectos compitiendo.
- **Referencia como calco:** MAL copiar una captura o su personalidad completa. BIEN extraer principios compatibles con el producto y declarar que no se replica. Ej: tomar su bajo ruido o su lectura principal, no sus valores visuales concretos.
- **Dial como receta:** MAL tratar `design_variance`, `motion_intensity` o `visual_density` como valores CSS universales o como permiso para rediseñar el sistema. BIEN acotarlos a la superficie, compararlos con patrones internos y conservar `hereda` cuando no hay motivo probado.
- **Referencia externa sin permiso:** MAL usar una tendencia, URL o captura externa como direccion aprobada por defecto. BIEN priorizar una referencia interna; si la externa es necesaria, exigir aprobacion explicita, registrar procedencia y transferir solo rasgos compatibles.
- **Bloqueo estetico inventado:** MAL detener una mejora porque falta una referencia o un numero exacto, o llamar P1 a un gusto. BIEN distinguir un bloqueo verificable (permiso, accesibilidad, estado indispensable) de un aviso que permite continuar con una hipotesis trazable.
- **Jerarquia declarada:** MAL dar por resuelta una diferencia semantica porque el DOM, las clases o los tokens son distintos. BIEN nombrar los roles, elegir señales compatibles con el sistema y comprobar la lectura en una captura. Ej: si seccion y ajuste siguen pareciendo equivalentes, la diferencia no esta resuelta.
- **Receta fosilizada:** MAL convertir una solucion que funciono en una pantalla en la forma obligatoria de toda cabecera, seccion o control. BIEN fijar objetivo perceptivo, restricciones y evidencia; los valores concretos vienen del design system, accesibilidad o necesidad funcional. Ej: dos pantallas de ajustes pueden requerir articulaciones distintas sin perder coherencia.
- **Bucle cosmetico:** MAL responder a feedback persistente con una sucesion de microcambios sin cambiar la hipotesis. BIEN formular que percepcion falla, probar una direccion de composicion y cambiar de capa si no se corrige. Ej: "todo parece igual" exige revisar roles y agrupacion, no defender la diferencia de estilo.
- **Responsive superficial:** MAL comprobar solo que "no explota". BIEN conservar jerarquia y uso por rangos reales. Ej: validar que la accion principal y los datos criticos sobreviven en el perfil de producto pedido.
- **Screenshot unico:** MAL revisar solo el estado cerrado. BIEN revisar los estados que cambian lectura o interaccion. Ej: comprobar el contenido desplegado, el foco y los estados de carga/error cuando apliquen.
- **Memoria de libreria:** MAL copiar patrones de otra version, otra libreria o mini-docs del brief sin verificar. BIEN revisar `package.json` y documentacion viva antes de importar. Ej: confirmar la version real antes de asumir una prop, o comprobar que una clase existe en el tema compilado antes de usarla.
- **Jerarquia fingida:** MAL endurecer bordes, divisores o sombras para compensar una composicion floja. BIEN sacar la jerarquia de estructura, agrupacion, ritmo, tipografia y contraste de superficie. Ej: si al suavizar contornos la pantalla se vuelve confusa, faltaba jerarquia real.
- **HeroUI custom prematuro** (aplica si el proyecto usa HeroUI): MAL inventar wrappers visuales propios por defecto. BIEN resolver la superficie con primitives y patrones oficiales antes de crear UI custom. Ej: comprobar si la libreria ya ofrece el comportamiento necesario antes de separarse del sistema.

Para el criterio completo de composicion, materialidad, jerarquia, estados, formularios, dashboards y playbook por superficie, ver [composicion.md](composicion.md). Para una critica o refinamiento visual, ver [critica.md](critica.md).

# Alcance y limites

- Aplica cuando haya que diseñar, refinar o implementar interfaz frontend.
- Define reglas fuertes de UI, UX, composicion, materialidad, estados y calidad visual.
- No sustituye a `definir-arquitectura` ni a `configurar-entorno` / `configurar-testing`.
- No impone una estetica nueva si el proyecto ya tiene design system o libreria UI dominante; trabaja **dentro** de ese sistema.

# Inputs / contexto obligatorio

- `docs/SSOT.md`, `docs/AI_GLOBAL_RULES.md` y documentacion visual del proyecto actual, si existe.
- Estructura real del frontend, `package.json` y libreria UI detectada.
- 2-3 pantallas hermanas para entender el lenguaje visual real.
- Restricciones explicitas del usuario sobre estetica, densidad o branding.
- Referencias positivas/negativas disponibles y preferencias confirmadas en [preferences.md](preferences.md).
- Feedback visual del usuario y evidencia ya capturada; un comentario de percepcion es un sintoma a verificar, no una objecion.

## Escalada diagnostica para bugs visuales persistentes

Arbol binario corto. Si el sintoma es que dos roles visuales se perciben iguales, identificar primero que relacion deberia leerse y validarla con evidencia visual; una diferencia declarada en codigo no prueba la diferencia percibida.

Si un bug visual sigue igual tras un ajuste local razonable de composicion, espaciado, alineacion o contencion, NO encadenar microfixes.

- ¿El sintoma cambia tras un ajuste local? **Si** -> continuar en la capa actual. **No** -> reclasificar la capa en este orden: roles y composicion interna -> contenedor inmediato -> shell/chrome persistente -> viewport, scroll y raiz de la aplicacion.
- En `headers`, `top bars`, `sidebars`, elementos `fixed`/`sticky`: la revision global es OBLIGATORIA. Revisar quien hace scroll, overflow de la raiz, relacion entre viewport visual y chrome persistente, y cualquier contencion heredada desde el contenido.
- Un sintoma que no cambia tras un ajuste local es señal de diagnostico fallido, no invitacion a seguir probando offsets al azar.

### Proporcional vs geometrico (regla de centrado real)

Cuando el dueño pide "centrar X dentro de su contenedor" o "X se ve mas arriba que abajo", distinguir antes de tocar:

- **Geometrico**: el y-centro del contenido esta fisicamente descentrado respecto al contenedor. Mide con sonda. Si coinciden (diferencia <2px), NO hay problema geometrico.
- **Proporcional**: el contenido esta centrado geometricamente pero su proporcion respecto al contenedor es desfavorable (ej. bloque 36px vs 54px de aire -> controles quedan contra el borde superior perceptivamente). Reajustar pt/pb o cambiar el padding simetrico no mueve la proporcion; la unica herramienta proporcional es COMPRIMIR el aire vacio (quitar `min-h` reservado, colapsar el wrapper, eliminar franjas sin contenido) sin tocar la banda de controles.

Si el problema es proporcional, el fix geometrico deja la queja exactamente igual. Diagnosticar la capa antes de mover pixeles; si la sonda geometrica ya dio OK y el dueño sigue quejandose, el siguiente movimiento NO es "ajustar 2px mas de padding" sino "buscar el aire vacio que pesa perceptivamente".

# Comportamiento esperado

Reglas fuertes de arquitectura y convenciones (verificables, por defecto salvo necesidad funcional probada):

- **Dependencias:** revisar `package.json` antes de importar librerias externas. Nunca asumir que existen.
- **Stack real:** confirmar framework, estrategia de estado, estilos y primitives del proyecto; nunca imponer React, Tailwind o una libreria por memoria.
- **Tokens reales:** MUST verificar que las clases y tokens existen en el tema compilado del proyecto antes de componer; las clases inexistentes no fallan, simplemente no se aplican. Detalle y auditoria en [design-system.md](design-system.md).
- **Roles antes de tratamiento:** identificar contexto, seccion, control, ayuda, estado y accion antes de decidir su tratamiento visual.
- **Jerarquia percibida:** MUST declarar el claim visual cuando la diferencia entre roles importe y validarlo en el perfil/estado relevante. Diferencias de codigo no cuentan como evidencia.
- **Grado de libertad:** NEVER prescribir valores, componentes o geometria como norma general cuando varias soluciones sean validas. Preferir criterios de eleccion y usar valores concretos solo si el sistema real, la accesibilidad o una restriccion funcional los fija.
- **Layout:** preferir relaciones estables y rangos reales sobre offsets magicos o calculos fragiles.
- **Viewport:** comprobar scroll, altura util y chrome persistente con la estrategia que corresponda al stack real.

Si el proyecto ya usa una libreria UI o design system visible, preferir sus primitives, variantes y patrones oficiales antes de inventar piezas. El detalle de excepciones, auditoria de tokens globales y delegacion a skills/MCPs de libreria esta en [design-system.md](design-system.md).

## Accesibilidad minima obligatoria

Verificable. Todo elemento interactivo debe cumplir:

- `aria-label` en botones, iconos y enlaces sin texto visible.
- `aria-expanded` en elementos que abren/cierran (dropdowns, accordions, menus, drawers, modales).
- `aria-label` en botones de cerrar (modales, lightboxes, drawers).
- Navegacion por teclado en todos los elementos interactivos (Enter, Escape, Tab).
- Focus visible (`:focus-visible`) en elementos interactivos.
- HTML semantico: `<button>` para acciones, `<nav>` para navegacion, `<main>` para contenido principal.
- `alt` descriptivo en imagenes de contenido (no en decorativas).
- `<label>` asociado a todo `<input>`, `<select>` y `<textarea>`.
- Contraste minimo WCAG AA (4.5:1 texto normal, 3:1 texto grande).
- `role` ARIA correcto solo cuando el HTML semantico nativo no basta.

## Cierre OBLIGATORIO: gate de auto-cita

**NORMA DEL DUEÑO (7-sep-2026): el resultado visual se ENTREGA EN EL CHAT** — todo reporte de cambio visual al dueño incluye la captura inline (MEDIA:) del estado final y, si hay antes/después o variantes, ambas lado a lado. El dueño NO entra a la app para evaluar estética: «me gusta mucho que me pongas el resultado en el chat, asi las cosas esteticas no tengo que entrar en la aplicacion para verlas». Sin captura inline, el reporte no está completo. La guía de prueba en vivo va DESPUÉS de que él haya visto la imagen; el archivo en disco (.ai-work) es archivo, no entrega. Aplica a: rediseños, pulidos, tandas de QA visual, simulaciones y experimentos.

Antes de entregar la UI, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** la funcion de la pantalla y cual es la accion o dato dominante en el estado actual.
- [ ] **Declaro** los roles cuya diferencia importaba, el claim perceptivo y la evidencia visual que lo confirma o deja pendiente.
- [ ] **Declaro** la tesis visual, la referencia/anti-referencia o vara de nivel interna utilizada y los rasgos transferibles; si no aplicaban, cite por que.
- [ ] **Declaro** que reutilice el design system o libreria real antes de inventar piezas nuevas, sin convertir una solucion local en receta universal.
- [ ] **Declaro** que renderice los perfiles/estados relevantes en navegador real y tema real, y aplique el micro-loop proporcional, o deje visible por que la evidencia visual quedo pendiente.
- [ ] **Declaro** que verifique accesibilidad (aria-label, aria-expanded, label en inputs, foco visible, HTML semantico, contraste WCAG AA).
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que implementa no es el que califica. Antes de cerrar:

- Si la UI tiene **estado, overlay, responsive, formulario, drawer, modal o accesibilidad**: delegar OBLIGATORIAMENTE a **@qa-validador** con evidencia de estados abiertos.
- Si la UI necesita **pulido visual acotado**: delegar a **@revisor**.
- Si el usuario pidio explicitamente **premium, wow o una direccion visual aprobada**: **@revisor** compara la captura contra el contrato visual y devuelve P2 si la primera lectura, jerarquia, copy persistente o coherencia contradicen materialmente ese contrato. El gusto libre sin contrato sigue siendo P3.
- En **redisenos o elevaciones visuales puras**: el hook post-listo de `@qa-funcional` aplica igual; intuitividad, lectura de estados y microcopy son historia de usuario, no solo estetica.
- Si el cambio **redefine navegacion, shell, layout transversal o design system**: escalar ANTES a **@arquitecto**.

# Flujo recomendado

- [ ] Leer `docs/SSOT.md` y `docs/AI_GLOBAL_RULES.md`.
- [ ] Inspeccionar stack, `package.json`, documentacion visual del proyecto y 2-3 pantallas hermanas.
- [ ] Si aplica contrato visual o refinamiento, definir funcion, roles, claim perceptivo, referencias, jerarquia y copy persistente antes de implementar.
- [ ] Si se crea o reestructura una pagina: planificar estructura primero con [arquitectura-informacion.md](arquitectura-informacion.md).
- [ ] Resolver design system primero: [design-system.md](design-system.md).
- [ ] Aplicar criterio de composicion, jerarquia y materialidad: [composicion.md](composicion.md).
- [ ] Resolver responsive por rangos reales: [responsive.md](responsive.md).
- [ ] Si la tarea es criticar o refinar una interfaz: aplicar el metodo de [critica.md](critica.md).
- [ ] Renderizar, criticar contra el claim y corregir de forma proporcional antes de entregar cuando haya evidencia visual disponible.
- [ ] Resolver el gate de auto-cita y el gate de segunda IA.

# Criterio de resultado bueno

Cierre valido cuando el gate anterior se declara con evidencia observable: la UI conserva el sistema existente, diferencia los roles que importan en la lectura real, resiste variacion razonable de contenido y viewport, y no depende de una receta local ni de una captura unica.

# Mejora proactiva de la skill

Si un fallo corregido durante una tarea revela una laguna reusable de esta skill (sesgo de composicion, regla de jerarquia, estado, layout, design system o responsive), actualizar la skill o dejarlo explicitamente señalado como pendiente. Proactividad solo para reglas importantes y reusables, no para microajustes locales de una sola vista.

## Triggers

- **Keywords:** diseno, jerarquia visual, refinamiento visual, mejora visual, premium, rediseño, estilo, lente de calidad (la ejecucion de codigo va a `implementador`).
- **Patrones de usuario:** "eleva este frontend", "mejora la UI", "revisa el diseno", "estas secciones parecen iguales", "refina esta pantalla", "componente visual", "ajusta la pantalla", "adaptalo a movil", "hazlo responsive", "que se vea bien en el telefono".
- **Encadenamiento:** despues de `definir-arquitectura` cuando el proyecto tenga interfaz; junto a `heroui-react` u otra skill de libreria cuando aplique; antes de `validar-calidad` o @qa-validador cuando toque responsive, movil, viewport, navegacion, formularios, overlays o accesibilidad. Para superficies con scroll/animaciones, llevar `rendimiento-frontend` como compañera de medicion.

# Ejemplos de activacion

"Eleva este frontend respetando al maximo HeroUI y sus patrones oficiales."

"Esta pantalla de ajustes se ve plana; revisa si sus secciones se perciben como grupos distintos sin imponer una solucion visual concreta."
