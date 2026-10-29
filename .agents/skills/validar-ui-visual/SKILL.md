---
name: validar-ui-visual
description: "Validar visualmente interfaces web con navegador real, capturas y modelo con vision, sin asumir mobile/desktop por defecto y separando defectos accionables de gustos esteticos; mide contraste nominal, textura y matriz de estados. TRIGGERS: visual, screenshot, captura, QA visual, validar UI, verificacion visual, MiniMax, Playwright MCP, interfaz rota, solape, texto cortado, contraste, WCAG, textura, alpha."
---

# Validar UI Visual

# Objetivo

Convertir la revision visual de una web en un flujo repetible: abrir la interfaz con navegador real, capturar evidencia visual, analizarla con un modelo con entrada de imagen cuando este disponible y devolver defectos accionables. Cuando el cierre dependa de jerarquia, agrupacion o prioridad, comprobar tambien el claim perceptivo que se esperaba observar.

Esta skill existe para evitar dos fallos comunes:
- declarar una UI como correcta sin verla;
- gastar tiempo probando viewports que no pertenecen al producto.

# Hard rules

- MUST usar un navegador real o herramienta equivalente antes de cerrar una validacion visual.
- MUST capturar al menos una screenshot cuando el cierre dependa de layout, jerarquia, solapes, scroll, canvas, graficos, imagenes, densidad o texto visible.
- MUST definir el perfil visual antes de probar: `desktop`, `mobile`, `tablet`, `responsive`, `kiosk`, `embed` o `perfil indicado por el usuario/proyecto`.
- MUST convertir una afirmacion relevante de jerarquia, agrupacion o prioridad en un claim perceptivo comprobable en el viewport y estado revisados.
- MUST distinguir un blocker objetivo (permiso ausente, requisito verificable incumplido o estado indispensable inaccesible) de un advisory visual; una preferencia estetica no se eleva a blocker.
- NEVER probar mobile o desktop por inercia. Si la app es solo desktop, se valida desktop. Si es solo mobile, se valida mobile. Si el objetivo no esta claro, se usa el perfil pedido en el prompt o se reporta la falta como pendiente.
- NEVER tomar una diferencia de DOM, CSS, clases o tokens como evidencia de una diferencia percibida; la evidencia sale del render y del estado de uso.
- NEVER sustituir tests funcionales por revision visual. La revision visual detecta presentacion; Playwright assertions, lint, typecheck y tests siguen siendo gates separados.
- NEVER guardar capturas, tokens, sesiones o secretos en docs, skills, `.teams` ni archivos versionados.

## Medicion visual: matriz, contraste y textura

Aplica cuando el cierre dependa de contraste, textura o comparacion de estados.

**Matriz declarada antes de medir (B3.1).** MUST declarar antes de la primera medida: que temas y estados entran en la matriz, cual es el criterio de aceptacion y que estados quedan protegidos (no deben cambiar). MUST separar tres cosas: obligacion WCAG (contraste minimo exigible), requisito aprobado de diseno (lo que el dueno aprobo) y observacion estetica (lo que se ve distinto sin requisito). NEVER convertir una observacion estetica en blocker ni una obligacion WCAG en opinion.

**Contraste nominal (B3.2).** MUST medir la relacion de contraste con los colores nominales del navegador o del CSS (valor declarado) y el fondo efectivo, incluyendo alpha cuando el color la lleva. Es una medida nominal, no un claim perceptivo: ningun pixel de captura la sustituye.

- Una captura suavizada que falla mientras el nominal es valido NO bloquea sola: el suavizado es artefacto del instrumento, no del producto.
- Un nominal realmente insuficiente SI bloquea, aunque la captura se vea bien.

**Textura comparada (B3.3).** MUST comparar textura en regiones geometricas equivalentes (mismo rect, mismo tamano, misma posicion relativa) y en composiciones equivalentes (mismo fondo, mismo blending, mismo zoom). Si la diferencia no se reproduce con geometria y composicion igualadas, declarar la limitacion y arreglar el instrumento; NEVER presentar como defecto del producto lo que produce la propia comparacion.

# Alcance y limites

Aplica a:
- UI, frontend, modales, menus, dashboards, formularios, landing pages, apps canvas/WebGL, graficos y componentes visuales.
- QA visual asistido por screenshots y modelos con vision, por ejemplo MiniMax-M3 cuando este seleccionado en OpenCode.
- Revision posterior a cambios de layout, estados vacios/loading/error, scroll, sticky, overflow y densidad visual.

No aplica como unico gate para:
- seguridad, permisos, pagos, datos sensibles, RLS o backend;
- regresion pixel-perfect formal de CI;
- rendimiento profundo, profiling o trazas de Chrome DevTools. Para eso, `rendimiento-frontend`, cuyo metodo portable fija que bytes y CLS NO acreditan la fluidez de la primera activacion: arranque y fase estable son estados distintos.

# Herramienta recomendada

Para OpenCode, la opcion preferente para este flujo es Playwright MCP:
- automatiza navegador real;
- expone snapshots de accesibilidad para interaccion estable;
- puede tomar screenshots para revision visual;
- permite activar `--caps=vision` cuando hagan falta herramientas por coordenadas.

Chrome DevTools MCP es alternativa preferente si el objetivo principal es depurar consola, red, performance o trazas. Para QA visual de producto con capturas, Playwright MCP suele ser suficiente y mas directo.

Si Playwright MCP no esta disponible en el IDE, activar `configurar-mcp` antes de improvisar otro flujo.

# Inputs / contexto obligatorio

- Memoria acumulativa: leer `preferences.md` de esta carpeta si existe y aplicar sus reglas sin repreguntar.
- URL objetivo o forma de arrancar la app local.
- Perfil visual a validar:
  - explicito del usuario;
  - documentado en SSOT/docs del proyecto;
  - inferido de la naturaleza de la app solo si es claro.
- Estados o rutas criticas a revisar.
- Roles visuales o claim perceptivo que deben distinguirse, cuando el cambio los afecte.
- Modelo con vision disponible si se va a pedir analisis de capturas.
- Criterio de aceptacion del cambio, si existe.

# Comportamiento esperado

## 1. Clasificar perfil visual

Antes de abrir capturas, declarar internamente uno de estos perfiles:

- `desktop`: producto de escritorio o backoffice.
- `mobile`: producto exclusivamente movil.
- `responsive`: el usuario/proyecto pide varios rangos.
- `tablet`, `kiosk`, `embed` u otro perfil concreto.
- `pendiente`: no hay perfil claro y validarlo cambiaria el alcance.

Regla practica: un dashboard SaaS, CRM o herramienta operativa no se valida en mobile salvo que el usuario, la SSOT o el producto lo pidan. Una app mobile-first no se valida en desktop salvo que exista soporte real.

## 2. Navegar y preparar estados

- Abrir la URL con Playwright MCP.
- Esperar a que cargue el estado relevante.
- Interactuar con refs de snapshot cuando existan.
- Usar vision/coordenadas solo como fallback para canvas, mapas, graficos o widgets sin ARIA util.
- Revisar estados que importan al flujo: normal, hover/focus si aplica, modal/drawer/popover, empty, loading, error y scroll.
- Usar el tema real del proyecto (el que compila y usa el usuario); una captura con tema de prueba no sirve de evidencia.

## 3. Capturar evidencia visual

- Tomar screenshots de las pantallas o estados revisados.
- Si se guardan archivos temporales, ubicarlos en `.ai-work/<task-id>/<agent>/` o en el temporal del sistema y registrarlos con higiene cuando aplique.
- No pegar capturas en docs ni versionarlas por defecto.

## 4. Analizar con modelo visual

Cuando haya modelo con imagen:
- enviar las capturas con una pregunta concreta;
- pedir defectos observables, no gustos;
- pedir que confirme o contradiga el claim perceptivo y cite la evidencia visible;
- pedir severidad y ubicacion aproximada;
- contrastar el resultado con snapshots/DOM cuando sea posible.

Formato de analisis recomendado:

```text
Pantalla/estado:
Viewport/perfil:
Claim perceptivo:
Hallazgo:
Severidad: P1 | P2 | P3
Evidencia visual:
Impacto:
Siguiente accion:
Resultado: confirmado | contradicho | pendiente
```

## 5. Reportar cierre

Un cierre valido distingue:
- `validado visualmente`: hubo navegador real + screenshot + analisis;
- `validado parcialmente`: falto perfil, estado, auth, captura o modelo visual;
- `no validado`: no hubo evidencia visual suficiente.

Al registrar hallazgos, clasificar su naturaleza antes de la severidad:

- `blocker objetivo`: impide afirmar la aceptacion de la parte afectada y debe incluir requisito o evidencia concreta (por ejemplo, referencia externa no aprobada, foco inaccesible o estado abierto imposible de revisar).
- `advisory`: mejora propuesta, incertidumbre proporcional o preferencia que no contradice un requisito verificable. Puede quedar como pendiente sin disfrazarse de fallo bloqueante.

La etiqueta no reemplaza `P1 | P2 | P3`: explica por qué el hallazgo bloquea o no bloquea. Un `P1` requiere impacto material demostrable; una opinión sin ese impacto es advisory.

## Anti-patrones

- **Responsive por reflejo** -> validar solo el perfil real del producto -> ejemplo: backoffice desktop-only se revisa a 1440x900 y estados de scroll, no en iPhone.
- **Screenshot turistico** -> capturar estados que importan -> ejemplo: no basta home cerrada si el cambio toca un modal; hay que abrir el modal.
- **Gusto como bug** -> reportar solo defecto observable -> ejemplo: "el boton no me gusta" no es hallazgo; "el texto se corta dentro del boton" si.
- **Vision sin DOM** -> combinar screenshot con snapshot cuando se pueda -> ejemplo: si el modelo ve un icono ambiguo, usar snapshot para confirmar rol/nombre.
- **Implementacion como prueba** -> validar la relacion en el render, no por diferencias de clases o tokens -> ejemplo: dos encabezados con estilos distintos no prueban que alguien los lea como niveles distintos.
- **OK sin evidencia** -> declarar parcial o no validado -> ejemplo: si Playwright MCP no arranca, no decir "visualmente correcto".
- **Medir sin declarar la matriz** -> declarar temas, estados, criterio de aceptacion y estados protegidos antes de la primera medida -> ejemplo: se mide el hover del tema claro y se cierra como si cubriera el tema oscuro.
- **Pixel de captura como contraste** -> medir la relacion nominal (color declarado + fondo efectivo + alpha) -> ejemplo: un texto con alpha sobre fondo claro mide peor que el pixel suavizado de la captura; el numero valido es el nominal.
- **Bandas de composicion distinta como equivalentes** -> igualar region geometrica y composicion antes de comparar textura -> ejemplo: comparar una banda sobre fondo plano con otra sobre degradado mide la diferencia de fondo, no la textura.
- **Vision rota + diagnostico a ciegas** -> si `vision_analyze` devuelve error de modelo no soportado o el endpoint rechaza la imagen, NO calcular el diagnostico visual solo con medidas (top/height/center) y entregar un fix geometrico: la queja del dueño es PERCEPTIVA, no geometrica, y un cambio de 2px numericamente correcto no resuelve sintomas visuales. EJEMPLO: el dueño dice "se ve mas arriba que abajo"; calculas que el centro geometrico esta en sitio, lo "centras" moviendolo 2px y el dueño vuelve a quejarse; mientras no vuelvas a abrir la captura con la vision arreglada, no sabes que la causa era proporcional (40px de aire bajo los controles comprimian la banda contra el borde superior). Si vision no esta, parar y avisar para que la arreglen, o redactar un fix proporcional basado en hipotesis trazable con `validacion visual pendiente` en el reporte.

# Flujo recomendado para OpenCode

1. Confirmar que MiniMax u otro modelo con vision esta seleccionado cuando se necesite analisis de imagen.
2. Usar Playwright MCP para abrir la URL.
3. Definir perfil visual segun usuario/proyecto; no anadir mobile/desktop por inercia.
4. Navegar los estados relevantes.
5. Tomar screenshot.
6. Pedir analisis visual de defectos accionables.
7. Devolver hallazgos con severidad o declarar "sin hallazgos visuales materiales" citando perfil y estados revisados.

Prompt operativo:

```text
Usa Playwright MCP para validar visualmente <URL>. Perfil visual: <desktop|mobile|responsive|otro>. Captura screenshots de los estados relevantes y analizalas con el modelo con vision disponible. Reporta solo defectos accionables con severidad, evidencia e impacto. No pruebes viewports no pedidos.
```

# Criterio de resultado bueno

Antes de cerrar una validacion visual, declarar:

- [ ] Declaro que defini el perfil visual y la matriz de temas y estados (con criterio de aceptacion y estados protegidos) antes de medir, y que no probe mobile/desktop por inercia.
- [ ] Declaro que use navegador real o reporte por que no estuvo disponible.
- [ ] Declaro que capture screenshots para los estados cuyo cierre dependia de layout o apariencia.
- [ ] Declaro que separe defectos accionables de preferencias esteticas y que cualquier claim perceptivo se apoya en screenshot, no en DOM/CSS; y que el contraste se midio con los colores nominales y el fondo efectivo (con alpha), no con pixeles de la captura.
- [ ] Declaro que contraste screenshot con snapshot/DOM cuando el hallazgo lo requeria.
- [ ] Declaro que no guarde capturas ni secretos en archivos versionados.
- [ ] Declaro el estado final: `validado visualmente`, `validado parcialmente` o `no validado`.

## Triggers

- Keywords: visual, screenshot, captura, QA visual, validar UI, verificacion visual, MiniMax, Playwright MCP, interfaz rota, solape, texto cortado, contraste, WCAG, textura, matriz de estados, alpha, nominal.
- Patrones de usuario: "haz QA visual", "mira si se ve bien", "valida esta pantalla con capturas", "usa MiniMax para revisar screenshots", "comprueba visualmente esta web".
- Encadenamiento: despues de `elevar-ui-frontend` cuando hubo cambios UI; junto a `configurar-mcp` si Playwright MCP falta; antes de `validar-calidad` cuando el cierre tecnico depende de evidencia visual.

# Ejemplos de activacion

"Haz QA visual de `http://localhost:3000/admin` con perfil desktop."

"Valida visualmente este modal; no pruebes mobile porque esta app es solo escritorio."

"Usa Playwright y MiniMax para revisar las capturas de la home."
