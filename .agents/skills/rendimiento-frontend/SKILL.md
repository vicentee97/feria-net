---
name: rendimiento-frontend
description: "Usar cuando toques superficies con scroll, animaciones, listeners, blur, sombras o repintado que puedan afectar a la fluidez del frontend. Regla: acreditar el instrumento y medir antes de tocar. TRIGGERS: rendimiento, perf, fps, fluidez, lento, scroll, animacion, sonda, profiling, optimizar, repintado, jank, instrumento, control positivo, contador cero, primera activacion, arranque, ready, long task, frame gap, metodo portable, reusar arnes."
---

# Rendimiento Frontend

# Frontera de la skill: dos capas, no una biblia (leer primero)

Esta skill tiene DOS capas y no se mezclan:

1. **Metodo portable** (aplica a cualquier proyecto con superficies de fluidez): la acreditacion del instrumento, la separacion de estados, las reglas de reuso y la entrega de resultados. Vive en este archivo.
2. **Norma local de TPV-Manager** (presupuestos, patrones culpables, receta de sonda, que NO hacer y checklist completo): vive en `docs/rendimiento.md` del repo TPV-Manager (SSOT) y queda **etiquetada como local** en este archivo. Aqui NO se duplica: se activa, se cita con su superficie y su valor real, y se enlaza.

- **NEVER** decidir rendimiento por impresion. «Se ve fluido» no es metrica.
- **MUST** cargar y responder el checklist de tanda aplicable al proyecto medido antes de declarar listo en cualquier cambio que toque las superficies del disparo: en TPV-Manager son las 7 preguntas de abajo; en otro proyecto, el de su propio documento de rendimiento.
- **MUST** consultar `docs/rendimiento.md` del repo TPV-Manager cuando exista o se toque un presupuesto de TPV (regla antidesincronizacion abajo).
- **NEVER** aplicar los presupuestos de TPV como umbral universal de otro proyecto: cada proyecto mide contra su propio presupuesto; sin presupuesto aplicable, el resultado es una medicion con limite declarado, no un PASS (bloque de metodo portable).
- Si alguna vez no existiera `docs/rendimiento.md` de TPV, esta skill conserva la norma local citada abajo y esa ruta queda declarada como norma de proxima creacion; hoy ese documento existe y es el SSOT (asi lo declara su propia cabecera, `docs/rendimiento.md:13-14`).

Razon: TPV ya pago la leccion (AX29 midio 9,3 fps cruzando el umbral del colapso -> TP43 llego a 54-55 fps con la animacion IDENTICA). El metodo (sonda antes/despues) esta pagado y probado; esta skill existe para que ningun bot lo omita por no saber que existe, y para que no importe cifras de TPV a proyectos que no miden lo mismo.

# Objetivo

Que cualquier bot que toque frontend con scroll, animaciones, listeners, amplificadores de repintado o chrome fijo aplique el protocolo de rendimiento del proyecto ANTES de declarar listo: medir lo que toca, no romper los presupuestos vigentes y avisar (sin implementar) las optimizaciones sin coste visual.

# Alcance y limites

- Aplica a cualquier proyecto con superficies de fluidez (scroll, animaciones, listeners, repintado): el **metodo portable** de abajo es la parte comun.
- TPV-Manager es el proyecto de referencia: sus presupuestos, patrones y receta de sonda son **norma local** de ese repo y no se importan a otros proyectos (bloque local mas abajo).
- No cubre validacion visual (frontera de `validar-ui-visual`, que declara no cubrir rendimiento profundo ni profiling) ni criterio de calidad UI (frontera de `elevar-ui-frontend`).
- No ensena a medir paso a paso: da el contrato de metodo y acredita el instrumento; la receta concreta de cada proyecto vive en su documento de rendimiento.
- No autoriza a implementar optimizaciones por su cuenta: la licencia proactiva avisa y delega la decision (ver abajo).

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md) (estructura de skills y reglas del hub).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md) (Rule 27: regresiones de rendimiento bloquean «listo»).
- Presupuesto aplicable del proyecto medido: su documento de rendimiento, su arnes y su senal de ready. Sin presupuesto aplicable se declara medicion limitada (bloque de metodo portable).
- Fuentes locales de TPV-Manager (proyecto de referencia; solo lectura, no se editan desde aqui):
  - `docs/rendimiento.md` del repo TPV-Manager: presupuestos B1-B11 (lineas 27-39), patrones culpables P1-P5, receta de sonda (lineas 101-132) y «que NO hacer» (lineas 134-147).
  - `docs/ui-estilo.md` del repo TPV-Manager: seccion 5 (movimiento) y tratamientos de rendimiento del colapso.
  - `docs/estandar-animaciones.md` del repo TPV-Manager: catalogo de patrones con sus duraciones y tokens.

# Comportamiento esperado

## Disparo

Cargar esta skill y consultar el SSOT cuando el trabajo toque:

- superficies con scroll (salon movil, listas, cuenta, monitores);
- animaciones nuevas o modificadas (entradas, colapsos, bandas, detalle expandible);
- listeners (scroll, resize, pointer), polls o mutaciones de estado en raiz;
- blur, mascaras, sombras o `will-change` (amplificadores de repintado, patrón P3);
- chrome `fixed`/`sticky` nuevo (contencion, patrón P4);
- o cuando Vicente diga «la app va lenta / poco fluida / se atasca»: entonces la tarea es de ANALISIS con la sonda (patrón AX29), cero codigo sin medicion previa.

## Metodo portable: medir el estado correcto

Contrato comun a cualquier proyecto con superficies de fluidez. MUST cumplirlo antes de citar un numero; lo que no cumpla, se declara `no verificable`.

**Identificacion minima de toda medida.** Cada cifra que se publique lleva: estado y accion medidos; input que la dispara; artefacto y entorno donde se midio; instrumento que la produce; misma rutina comparable (antes y despues); y resultado con sus limites explicitos.

- **NEVER** publicar un numero sin el estado y el entorno que lo producen: dos cifras de estados distintos no se comparan ni se promedian.
- **NEVER** usar una medida de un estado como prueba de otro estado que no se midio (el caso grave: aprobar el arranque con metricas del estado estable).
- **MUST** declarar el presupuesto aplicable antes de juzgar. Sin presupuesto del proyecto medido, el resultado es una medicion con limite declarado; **NEVER** es PASS global ni se sustituye por cifras de otro proyecto.

**Estado de arranque: primera activacion, importacion, preparacion y ready NO son la fase estable.** Son estados distintos y se aprueban por separado.

- **MUST** medir, del arranque: **maximo long task** y **maximo gap** observables (el bloqueo mas largo del hilo principal y el mayor hueco entre frames), mas el **tiempo hasta usable/ready** cuando el proyecto lo define.
- **NEVER** aprobar la fluidez de arranque con bytes y CLS: el CLS describe estabilidad de layout y los bytes describen transferencia; ninguno de los dos mide un bloqueo del hilo de varios segundos. Un bloque de segundos NO desaparece porque el estado estable sea barato.
- **MUST** registrar hardware, throttling y GPU del ensayo, y las limitaciones de medicion, sin atribucion causal automatica: una cifra de arranque no demuestra por si sola que el coste sea del codigo nuevo, de la GPU, del DPR, de una importacion o de la maquina.
- **NEVER** llamar «FPS global de produccion» a un `raf` estimado en el navegador, ni «solo coste del renderer» a un frame gap: son nombres que atribuyen lo que no se ha demostrado.

## Acreditacion del instrumento (bloqueante antes de medir)

Una matriz de rendimiento solo vale si el instrumento que la produce esta acreditado. MUST acreditar la sonda ANTES de la primera matriz; sin acreditacion los numeros no se publican y el resultado es "no verificable". Esto no es el metodo de medida concreto (vive en el documento de rendimiento de cada proyecto): es la puerta de entrada a cualquier matriz.

- **Sintaxis con la herramienta nativa del lenguaje.** MUST comprobar la sintaxis antes de lanzar la sonda: `node --check sonda.mjs` solo para sondas JS; `python -m py_compile sonda.py` para Python. Una sonda que no compila no mide.
- **Alcance del linter y sintaxis focal.** MUST declarar, antes de crear la sonda, que linter la cubre y que sintaxis del lenguaje usa (modulo ES, CommonJS, TS compilado). NEVER confiar en `.gitignore`: que el fichero este ignorado no lo saca del linter; si el linter no lo cubre, el hueco se declara.
- **Control positivo y control negativo.** MUST correr la sonda contra un caso con dibujo conocido (control positivo: el contador sube) y contra un caso sin dibujo (control negativo: el contador se queda en cero). Sin los dos controles, un cero no distingue "no habia coste" de "la sonda no mira".
- **Atribucion estable.** MUST atribuir el coste por una via que la minificacion no cambie (marca en el bundle, id estable, medicion por tipo de tarea). NEVER atribuir leyendo nombres de funcion con `Function.toString`: el bundle minificado los renombra y la atribucion se vuelve ficcion.
- **Cero con dibujo observado = instrumento no acreditado.** MUST tratar un contador a cero con el dibujo observado en pantalla como sonda no acreditada, e investigarla antes de concluir. NEVER llamarlo "coste cero" ni "coste nulo": un cero sin acreditar no es una medida.
- **Reusar el arnes del mismo arbol.** MUST buscar y reusar el arnes ya aprobado del proyecto que se mide (sus scripts versionados y su receta documentada) en vez de escribir una sonda nueva. Un arnes propio del arbol ya viene calibrado a sus superficies y a su rutina; una sonda universal nueva estrena fuentes de error y no es comparable con las mediciones anteriores. NEVER instalar dependencias ni exigir puertos o protocolos que el proyecto no use para estrenar sonda.
- **Senal de ready antes de la matriz.** MUST exigir y comprobar una senal de ready aplicable (el proyecto declara cuando su interfaz esta usable) antes de lanzar las corridas; sin esa senal, la matriz mide un estado intermedio y sus numeros no describen ni el arranque ni la fase estable.
- **Fallo del ensayo, no del producto.** MUST tratar como fallo del instrumento y no del producto: el timeout de la sonda, el navegador lanzado con `--disable-gpu` o un contexto grafico inexistente cuando el escenario los necesita. MUST corregir la configuracion y repetir el ensayo antes de declarar que el producto falla. En proyectos WebGL, comprobar ademas contexto valido, renderer y estado de GPU bajo la configuracion representativa del ensayo (regla portable y condicional: aplica cuando el proyecto sea WebGL; TPV es una app DOM, asi que es probable que no le aplique).
- **Una correccion de instrumento invalida sus numeros anteriores.** MUST repetir solo la medicion afectada por el cambio de instrumento, conservar la referencia anterior como historica y NEVER comparar estados medidos con instrumentos distintos.

## Norma local de TPV-Manager (proyecto de referencia, NO universal)

Estos numeros son **norma local de TPV-Manager**: se citan aqui como referencia y no se rebajan ni se homogeneizan. Fuente: `docs/rendimiento.md` del repo TPV-Manager (SSOT), tabla de presupuestos B1-B11 en lineas 27-39. Cada presupuesto se cita con su superficie y su valor medido; ninguno se funde con otro.

**Regla soft (sin gate automatico).** Hoy ninguna suite del hub pinnea estas cifras: se comprobo que una copia de esta skill sin ninguna de las cifras deja `eval/test_instrument_accreditation_contract.py` en verde (exit 0). Su proteccion es la revision y este contrato escrito, no un validador; no se le supone enforcement automatico.

- Interaccion click->texto (cantidad +/-) [B1]: objetivo **<= 350 ms** (medido 326,6 ms, antes 721,1). Regresion **> 400 ms** = bloqueante [B2].
- Scroll del **selector de mesas** (movil, CPU x4) [B3]: **rafFps >= 58** y **0 huecos > 100 ms** (medido 58,9-59,4).
- Scroll del **catalogo** (17 cards, CPU x4) [B4]: **rafFps >= 50** y **scripting <= 20 %** (medido 52,6-52,8 fps y 14,3-15,5 %).
- Scroll de la **cuenta** (16 lineas, CPU x4) [B5]: **rafFps >= 50** y **0 huecos > 100 ms** (medido 54,3-55,2).
- Cruce del umbral de colapso (64 px, CPU x4) [B6]: **<= 60 ms** de scripting por cruce (medido ~30 ms).
- Hilo principal en rutina de scroll (CPU x4) [B7]: **<= 20 % del hilo** en scripting (medido 14,3-15,5 %).
- Memoria en ciclos selector<->mesa [B11]: sin tendencia de crecimiento.

La norma local NO se limita a estos numeros: su catalogo de patrones de animacion (duraciones y tokens) vive en `docs/estandar-animaciones.md` del mismo repo y la regla de movimiento en la seccion 5 de `docs/ui-estilo.md`. Esas reglas se consultan alli; aqui solo se enlazan.

**Cobertura comprobada y migracion pendiente del dueno de TPV.** Leidas las tres fuentes (supuesto S5): los presupuestos B1-B11, los patrones culpables P1-P5, la receta de sonda y el «que NO hacer» estan cubiertos por `docs/rendimiento.md` (lineas 27-39, 45-99, 101-132 y 134-147), el checklist de tanda por su seccion 5 (lineas 149-167) y el catalogo de animaciones por `docs/estandar-animaciones.md`. Se conservan igual porque esta skill es su disparador operativo (asi lo declara el propio SSOT en `docs/rendimiento.md:13-14`). Lo que NO esta cubierto por esas fuentes y vive solo aqui es la **licencia proactiva** (avisar la optimizacion sin coste visual sin implementarla en la tanda) y el resumen de anti-patrones del hub. Retirarlas o migrarlas al SSOT de TPV es decision del dueno de ese repo, no de este hub.

## Checklist de tanda de TPV-Manager (7 preguntas - norma local, NO universal)

**Alcance.** Estas 7 preguntas son norma local de TPV-Manager: sus umbrales, su rutina de sonda (x4) y su documento son suyos. MUST responderlas ANTES de declarar listo cuando el proyecto medido es TPV-Manager. Otro proyecto responde el checklist de su propio documento de rendimiento, con su rutina y sus presupuestos; si ese documento no existe, declara que no hay checklist aplicable y entrega la medida del metodo portable con su limite declarado.

1. **¿Tocaste una superficie con scroll?** Si: sonda ANTES/DESPUES obligatoria en esa superficie (misma sonda, rutina plena, x4 = la rutina de TPV).
2. **¿Anadiste o cambiaste animaciones?** Solo transform/opacity. Excepcion declarada: `grid-rows` 300 ms (colapso, banda, detalle); ninguna excepcion nueva sin medicion y visto bueno de Vicente.
3. **¿Anadiste listeners (scroll/resize/pointer) o polls?** rAF + passive + desmonte; el estado que mutan vive EN el componente que toca, jamás en el raiz (patrones P1/P5).
4. **¿Anadiste blur, mascaras, sombras o will-change?** Solo con capa propia justificada; nunca en elementos cuyo rect se invalida en scroll sin capa (patrón P3).
5. **¿El cambio re-renderiza mas de lo que toca?** Estado en raiz, paneles sin memo, remontajes con key volatil: aislar estado y memoizar (patrón TP43 cura 86).
6. **¿Mediste el estado correcto?** Cada presupuesto con SU superficie: **selector de mesas** (movil x4) = `rafFps >= 58`; **catalogo** y **cuenta** = `rafFps >= 50`, `0 huecos > 100 ms` (catalogo ademas `scripting <= 20 %`); sin regresion de B2; capturas sin cambio visual. Y si el cambio toca el arranque, ademas el bloque de primera activacion (`maximo long task` y `maximo gap`), no solo la fase estable. «Se ve fluido» no es metrica.
7. **¿Cambiaste un presupuesto de TPV o descubriste un patron nuevo de TPV?** Actualiza `docs/rendimiento.md` del repo TPV (SSOT) y esta skill en el mismo ciclo de trabajo, con un commit en cada repositorio (regla antidesincronizacion; los detalles viven en el SSOT, aqui solo el resumen local). Si el proyecto medido no es TPV, el cambio va al documento de rendimiento de ESE proyecto: esta skill no lleva sus cifras.

## Licencia proactiva: aviso de optimizacion sin coste visual

Si en codigo que tocas (o revisas) ves un patron culpable declarado por el proyecto medido (en TPV-Manager, su SSOT: re-render global en scroll, animacion de layout nueva, blur/mascara en zona que se repinta, chrome sin contencion; si el proyecto medido no tiene documento de rendimiento, valen estos cuatro casos) y la cura NO cambia lo que se ve (clase, aislamiento, capa, contain):

- **MUST** avisarlo en la consolidacion con formato: patron -> donde (archivo:linea) -> coste estimado (cita la evidencia del documento de rendimiento del proyecto medido, o la medida en el propio codigo si ese documento no existe; en TPV, su P# y su SSOT) -> propuesta sin coste -> riesgo visual (cero/bajo).
- **NEVER** implementarlo en esa tanda (alcance). **NEVER** callarlo (las optimizaciones gratuitas se avisan y se deciden con el orquestador/Vicente).
- Ejemplo real: TP43 podia retirar el blur del navbar en tactil (-52 % scripting en repintados) y se dejo como pendiente condicional, no se colo en la tanda.

## Anti-patrones (mal -> bien -> ejemplo)

- **Medir por impresiones:** MAL «se ve fluido, listo». BIEN sonda antes/despues con la misma rutina. EJEMPLO TP38-4b: 721 -> 327 ms click->texto medido con GET encadenado 20/20 -> 0/20.
- **Optimizar donde nadie lo pide:** MAL retocar animaciones del colapso «por si acaso». BIEN solo tocar la maquinaria y verificar curva frame a frame identica. EJEMPLO TP43: sin cambio visual con 9,3 -> 55 fps.
- **Virtualizar sin umbral:** MAL virtualizar listas de 16-34 items. BIEN solo >= 200-300 items visibles (decision medida AX29). EJEMPLO la cuenta tiene 16 lineas: render completo cuesta 20-60 ms, virtualizar seria sobreingenieria.
- **Matriz antes de acreditar el instrumento:** MAL publicar la tabla de una sonda sin acreditar. BIEN sintaxis + control positivo + control negativo antes de la primera matriz. EJEMPLO una sonda con error de sintaxis devolvio frames/busy/perFrame a cero durante un hover con 27.643 celdas y el informe lo leyo como coste nulo.
- **Atribucion por nombre de funcion:** MAL leer `Function.toString` para saber que funcion gasta. BIEN marca estable en el bundle o medicion por tipo de tarea. EJEMPLO la minificacion renombra `handleHover` a `a` y la atribucion por nombre senala a otra funcion.
- **Fundir presupuestos de superficies distintas:** MAL citar un unico umbral para «scroll movil y cuenta» cuando el SSOT fija dos presupuestos distintos. BIEN citar cada presupuesto con su superficie y su valor real. EJEMPLO el selector de mesas exige `rafFps >= 58` y la cuenta `>= 50`: publicar 50 para ambas superficies rebaja la exigencia de la que pide mas.
- **Aprobar el arranque con metricas del estado estable:** MAL dar por buena la primera activacion porque bytes y CLS salen bien y el estado estable es barato. BIEN medir `maximo long task` y `maximo gap` del arranque, mas el tiempo hasta usable/ready cuando el proyecto lo define. EJEMPLO un bloque de segundos al arrancar no se compensa con un CLS de 0,01.
- **Sonda nueva donde ya hay arnes:** MAL escribir una sonda generica para un proyecto que ya tiene arnes versionado y receta. BIEN reusar el arnes del mismo arbol y declarar su senal de ready. EJEMPLO una sonda nueva estrena error de sintaxis y sus numeros no son comparables con los del arnes acreditado.

## Hard rules resumidas

- NEVER decidir rendimiento por impresion (MUST medir con la sonda antes/despues en superficies con scroll).
- MUST cumplir el metodo portable: estado/accion, input, artefacto y entorno identificados; instrumento acreditado; misma rutina comparable; resultado y limites explicitos. NEVER publicar un numero sin su estado y su entorno.
- MUST separar el arranque (primera activacion/importacion/preparacion/ready) de la fase estable; NEVER aprobar la fluidez de arranque con bytes y CLS.
- MUST reusar el arnes aprobado del mismo arbol y comprobar su senal de ready antes de la matriz; NEVER escribir una sonda universal nueva ni exigir puertos o dependencias que el proyecto no use.
- MUST acreditar el instrumento (sintaxis, alcance del linter, control positivo y negativo, atribucion estable) antes de la primera matriz; NEVER publicar numeros de una sonda no acreditada.
- MUST tratar un timeout, `--disable-gpu` o un contexto inexistente como fallo del ensayo, no del producto; una correccion de instrumento obliga a repetir solo la medicion afectada y NEVER se comparan estados medidos con instrumentos distintos.
- NEVER llamar "coste cero" a un contador a cero con el dibujo observado.
- NEVER fundir presupuestos de superficies distintas: cada cifra se cita con su superficie y su valor real (el umbral mas bajo no se aplica a la superficie que exige mas).
- MUST responder el checklist de tanda del proyecto medido antes de declarar listo (en TPV-Manager, las 7 preguntas de arriba; en otro proyecto, el de su documento de rendimiento).
- MUST avisar las optimizaciones sin coste visual; NEVER implementarlas en la tanda ni callarlas.
- MUST actualizar el SSOT de TPV + esta skill en el mismo ciclo de trabajo cuando cambie un presupuesto o aparezca un patron de TPV: son dos repositorios, con un commit en cada uno. Otro proyecto actualiza su propio documento de rendimiento.

## Regla antidesincronizacion (norma local de TPV-Manager)

Cualquier tanda de rendimiento que cambie un presupuesto o anada un patron culpable **de TPV-Manager** actualiza el SSOT de ese repo (`docs/rendimiento.md`) Y esta skill en el mismo ciclo de trabajo. Son dos repositorios distintos y ningun commit de Git abarca los dos: el cambio se guarda con **un commit en cada repositorio** (uno en TPV-Manager y otro en el hub), y las dos mitades viven en el mismo ciclo. La pareja se declara en el mensaje de cada commit (que repo lleva la otra mitad y que cambio comparten; no el sha del otro commit, que puede no existir todavia). El bot que cierra la tanda es el responsable de ambas, no un mantenedor posterior.

# Flujo recomendado

- [ ] Detectar superficie del disparo en el brief o en el codigo a tocar.
- [ ] Identificar el proyecto medido: su presupuesto, su arnes aprobado y su senal de ready. Si es TPV, ademas leer `docs/rendimiento.md` del repo (presupuestos, patrones y metodo).
- [ ] Separar el estado que se va a medir: arranque (primera activacion/importacion/preparacion/ready) o fase estable. No se mezclan.
- [ ] Acreditar el instrumento antes de la primera matriz (sintaxis, linter, controles, atribucion estable, reuso del arnes del arbol).
- [ ] Aplicar el checklist de tanda del proyecto medido antes de implementar (medir el estado inicial si toca scroll): en TPV, las 7 preguntas; en otro proyecto, el suyo.
- [ ] Implementar con las reglas vivas de los patrones del proyecto medido: en TPV, los P1-P5 (no resucitar el re-render en raiz, no amplificar repintados, contener chrome); en otro proyecto, los que declare su documento de rendimiento.
- [ ] Medir despues con la misma sonda y comparar contra el presupuesto de ESA superficie; cerrar con el gate de auto-cita.
- [ ] Si hay hallazgos «optimizables sin coste», avisarlos en la consolidacion sin implementarlos.
- [ ] Si el presupuesto o patron cambiado es de TPV, actualizar su SSOT + esta skill en el mismo ciclo de trabajo, con un commit en cada repositorio (declarando la pareja).

# Criterio de resultado bueno (gate de cierre, auto-cita)

Antes de declarar la tanda lista, declarar:

- [ ] Declaro que identifique el proyecto medido y su presupuesto aplicable, y que entregue la medida con estado/accion, input, artefacto y entorno (o que declare la medicion limitada por falta de presupuesto).
- [ ] Declaro que separe el arranque de la fase estable cuando el cambio toca el arranque, con `maximo long task` y `maximo gap` del arranque, o que no aplicaba y por que; y que NO use bytes ni CLS para aprobar fluidez de arranque.
- [ ] Declaro que reuse el arnes aprobado del mismo arbol y que comprobe su senal de ready antes de medir, o que declare por que no existia arnes aplicable.
- [ ] Declaro que respondi el checklist de tanda aplicable al proyecto medido (en TPV-Manager, las 7 preguntas de arriba), citando que items aplicaban a este cambio.
- [ ] Declaro que medi con la misma rutina comparable del proyecto medido antes/despues cuando el cambio toca una superficie con scroll (en TPV-Manager, su rutina: x4 y 2 corridas), o que no hacia falta y por que; y que el instrumento estaba acreditado (sintaxis, controles, atribucion estable) antes de la primera matriz.
- [ ] Declaro que cite cada cifra con su superficie y su fuente (ninguna cifra fundida, ninguna `>= 50` aplicada al selector de mesas) y que no hay regresion contra los presupuestos vigentes, o que esta bloqueada y reportada.
- [ ] Declaro que avise cada hallazgo «optimizable sin coste» con formato patron -> donde -> coste -> propuesta, sin implementarlo en la tanda; que no decidi nada por impresion; y que, si cambio un presupuesto o descubri un patron **de TPV**, actualice `docs/rendimiento.md` de ese repo y esta skill en el mismo ciclo de trabajo, con un commit en cada repositorio (declarando la pareja).

## Triggers

- Keywords: rendimiento, perf, fps, fluidez, fluido, lento, se atasca, scroll, animacion, sonda, profiling, optimizar, repintado, jank, throttling, rafFps, presupuesto, colapso, instrumento, acreditacion, control positivo, control negativo, contador cero, minificacion, primera activacion, arranque, ready, long task, frame gap, metodo portable, arnes
- Patrones de usuario: "la app va lenta", "el scroll va a tirones", "se atasca al hacer scroll", "anima esta entrada sin que se note el coste", "este listener hace que vaya a tirones", "mide si esto afecta al rendimiento", "quita el blur que lastra el scroll", "tarda en arrancar", "se queda pillado al abrir"
- Encadenamiento: antes de implementar cambios de UI con superficies con scroll -> cargar `elevar-ui-frontend` si ademas se toca calidad visual; cierre tecnico -> `validar-calidad` y, si aplica, `validar-ui-visual` (que no cubre profiling; la sonda la pide esta skill); hermana `detectar-sobreingenieria` para dudar de «optimizaciones» sin umbral; consultar `investigar-antes-de-implementar` si la duda es de API/libreria del navegador.

# Ejemplos de activacion

"Voy a anadir un listener de scroll al selector de mesas para el estado de la cabecera."
"Abre la cuenta con 16 lineas y al hacer scroll a CPU x4 va a 9 fps: diagnostica con la sonda por que."
"El detalle expandible pierde fluidez al colapsar; comprueba antes/despues con la misma rutina."
"Al tocar el navbar he visto que el blur del backdrop repinta la ventana entera: avisa la cura sin implementarla en esta tanda."
"La app tarda en quedarse usable al abrir: mide el arranque (long task y gap maximos), no el estado estable."
"El proyecto ya tiene su arnes en el repo: reusalo y declara su senal de ready antes de lanzar la matriz."