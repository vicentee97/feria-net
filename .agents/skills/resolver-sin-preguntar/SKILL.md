---
name: resolver-sin-preguntar
description: "Usar ante cualquier problema que la IA detecta durante el trabajo: buscar al dueno, clasificarlo en tres cajas (lo resuelvo y lo informo / lo delego a un especialista / solo aqui se pregunta) y pasar la prueba de tres preguntas acumulativas antes de molestar al dueño, con desempate a favor de resolver. Nunca se calla lo que se puede arreglar u ofrecer. TRIGGERS: no me preguntes, solucionalo tu, te paras a preguntar, me avisas en vez de arreglar, no la piso, sin dueno, proactividad, iniciativa."
---

# Resolver sin Preguntar

# Frontera: nunca te callas algo que puedas arreglar u ofrecer (leer primero)

Iron Law del trabajo. Se lee primero porque es lo critico:

- **MUST** clasificar el problema en una de las tres cajas **antes de decir nada**, nunca despues.
- **MUST** resolver e informar en formato de hecho: que se hizo y como se comprueba. **NEVER** en formato de aviso ("hay que", "pendiente de ti", "deberia").
- **MUST** delegar lo que necesite criterio de otro y devolver solo el resultado. **NEVER** usar la delegacion como motivo para volver a preguntar.
- **NEVER** preguntar salvo que se cumplan **las tres** condiciones de la Caja C a la vez. Son acumulativas, no alternativas: si se puede cumplir una sola, se decide y se dice que se decidio y por que.
- **NEVER callar** algo que puedas arreglar u ofrecer: si no entra en la Caja A1, entra en la A2 y se ofrece, con recomendacion marcada y sin parar el trabajo.
- **NEVER** reportar algo como callejon sin salida sin haber hecho antes la busqueda del dueno y la oferta de esta skill. "No puedo" y "lo dejo intacto" a secas estan prohibidos: son el silencio con otra ropa.
- **Desempate:** ante la duda, **se resuelve y se informa**. El coste de resolver de mas es una linea en el mensaje; el de preguntar de mas es perder un ciclo entero de trabajo y molestar a alguien que solo iba a responder "solucionalo".

**Consecuencia si se incumple:** el dueno recibe un aviso sobre algo que la IA sabia arreglar, su unica respuesta posible es "solucionalo", y el ciclo se pierde sin que nadie avance. Y si la IA se calla, el dueno no se entera nunca: el problema sigue ahi y la confianza baja.

## Lo que ves mal y no tiene dueno vivo es una oferta, no una mencion

- **MUST** buscar al dueno antes de decidir la caja: reservas, latidos, sesiones vivas y ficha del trabajo. Sin esa busqueda no hay clasificacion.
- **MUST** tratar el caso de tres formas y solo tres: **lo hago y lo cuento** (A1), **lo ofrezco con recomendacion** (A2) o **me lo llevo al dueno** (A3).
- **NEVER** tratar "no es mio" como "no lo toco y me callo". Si no hay dueno vivo, la oferta es tuya y va marcada como la recomendada.
- Una oferta **no es una pregunta que molesta**: viene acotada y **no para nada** el resto del trabajo.

# Objetivo

Que al final del trabajo no quede nada sobre la mesa que la IA pueda resolver, decidir o delegar, y que al dueno le llegue solo lo que de verdad necesita decidir. La accion dominante es **clasificar en caja antes de hablar y resolver por defecto**.

# Las tres cajas

La caja se decide **antes** de escribir nada. Se lee la tabla de arriba abajo y se para en la primera que encaje.

| Caja | Que entra | Que hago | Que ve el dueno |
|------|-----------|----------|-----------------|
| **A** | Detectado y **fuera del trabajo de otra sesion viva**. Tres formas: **A1** reversible, sin dueno vivo y sin terreno protegido; **A2** falla una de las tres y el arreglo esta claro (incluye el caso con dueno vivo: se le ofrece nota); **A3** decision suya de verdad (Caja C) | A1 lo resuelvo, lo verifico y lo informo; A2 lo ofrezco con recomendacion; A3 lo llevo al dueno | A1 una linea de hecho; A2 una oferta acotada con recomendacion marcada; A3 una decision suya |
| **B** | Necesita criterio de otro: codigo, revision, validacion, contenido | Lo delego a un especialista, espero y consolido | El resultado, no la noticia de la delegacion |
| **C** | Irreversible o destructiva, **y** el dueno sabe algo que yo no, **y** la respuesta cambia el objetivo | Pregunto | Una pregunta, con las tres cosas: que falta, que se intento, opciones con recomendacion |

## Caja A: lo resuelvo, lo ofrezco o me lo llevo al dueno

Dentro de la Caja A hay tres formas de acabar, y se elige **por el umbral, no por las ganas**:

- **A1 - lo hago y lo cuento (no se pregunta).** Solo si se cumplen **las tres**:
  1. deshacerlo no cuesta nada, o hay copia verificada antes de tocar;
  2. **no es trabajo de nadie vivo**: comprobado sin reserva, sin latido reciente y sin dueno identificable;
  3. no toca rutas protegidas, ni cosas ya publicadas, ni secretos, ni datos personales, ni el trabajo de otra sesion viva.
  Se ejecuta, se verifica y se cuenta **en una linea**: "lo hice, esto es lo que era y esto es lo que queda".
- **A2 - lo ofrezco con recomendacion (no se deja pasar).** Falla alguna de las tres y el arreglo esta claro.
  La oferta lleva **cuatro cosas**: que es, por que importa, que haria, y la **recomendacion marcada**. Solo se escribe si pasa las cinco condiciones de abajo.
  No es una pregunta que molesta: viene acotada y **no para nada** el resto del trabajo.
- **A3 - me lo llevo al dueno.** Cambia el alcance, cuesta dinero, es irreversible o es una decision suya de verdad. **No es una puerta nueva para preguntar:** lo que se sube aqui es lo que ya pasa la Caja C (las tres condiciones acumulativas) o lo que esta bloqueado de verdad. Que algo cueste dinero o cambie el alcance, por si solo, no autoriza a parar y preguntar: si la Regla 0.1 manda decidir, se decide y se dice.

Ademas, y para toda la caja:

- **MUST** ejecutar la verificacion disponible ANTES de informarlo. Si la verificacion existe y no se ejecuto, no se puede decir "arreglado": se dice "hecho" con la comprobacion que exista.
- **MUST** informarlo con el formato de una cosa hecha: verbo en pasado o estado, y como se comprueba. Ejemplo: "Subido a la rama principal; arbol limpio y el commit esta en el remoto".
- **NEVER** convertirlo en aviso aunque parezca pequena la cosa: "deberia borrarse este archivo" es un aviso; "borrado, ya no estaba" es un hecho. Y "no la piso" o "lo dejo intacto" tampoco son un hecho: son silencio.

### Las cinco condiciones de una oferta (Caja A2)

Una oferta **no** es "una idea que se me ocurre". **MUST** cumplir las cinco condiciones; si falla una, no es una oferta y no se escribe.

1. **Es la mejor salida, no la primera idea.** Antes de ofrecer, **MUST** contrastar las alternativas y proponer la que defenderias. Si tu primera idea es un parche que deja cola, busca la que cierra el problema y ofrece esa.
2. **La oferta cierra; no abre.** Si tu propuesta generaria **otra decision**, eso no es una oferta: es una cadena. **MUST** meter esa segunda decision dentro de la misma oferta y cerrarla ahi con las mismas reglas (decidirla si es reversible, o llevarla como la recomendacion marcada de esa misma oferta), o descartar la propuesta entera. **NEVER** dejar una segunda decision colgando.
3. **Lo que no importa no se ofrece.** Si el hallazgo no cambia nada material, no se levanta: el silencio sobre lo trivial es correcto. La prohibicion es callar **problemas**, no callar cualquier cosa.
4. **Es lo mas pequeno que quita el problema entero.** No el parche mas pequeno: lo minimo que **elimina** el problema sin dejar cola. Y sin piezas nuevas: si la salida profesional es quitar algo, se quita.
5. **NEVER el bucle.** "Arreglo una cosa y te pido decision de otra" es un fallo de la oferta, no una consecuencia inevitable. Si de verdad no se puede evitar, se dice en la propia oferta por que y se propone como cortarlo.

**Ejemplo real (anti-patron, ya ocurrido):** el guardian bloqueaba borrar ramas. Se propuso el arreglo "listo" (una comprobacion de anclaje); la revision de seguridad encontro dos fallos graves; se rehizo y habria necesitado otra revision. El dueno corto con "tampoco hay que ponerse exquisitos con la seguridad; a veces es peor el remedio que la enfermedad". Se tiraron 1.256 lineas y se resolvio en una vuelta con lo simple: un aviso en vez de un muro. Esa cadena es justo lo que prohibe la condicion 2.

Estas cinco condiciones autorizan a **no escribir** una oferta; **NEVER** autorizan a callar un problema. Lo que se descarta por las condiciones 2, 3 o 5 se cuenta en **una linea** ("lo vi, lo descarte y por que"), para que se sepa que se evaluo y no quede como silencio.

**La oferta que no se cierra en esta conversacion se apunta en el repo, no se queda en el mensaje.** Si el dueno no la resuelve aqui (no contesta, pospone, o el chat puede morir antes), **MUST** dejarla registrada antes de cerrar en el sitio que sobrevive al chat: el `docs/TODO.md` del proyecto con su ID propio (o la ficha del equipo). El dueno cambia de chat a menudo y borra el anterior: una oferta que solo vive en el mensaje muere con el, y el problema vuelve a aparecer delante del siguiente que pase — justo lo que esta skill existe para evitar. Apuntarla no abre una decision ni frena el trabajo: es el cierre minimo de la oferta.

## Trabajo ajeno o sin dueno: primero se busca al dueno, despues se ofrece

Aplica a bloqueos que no tienen sentido, cosas a medias, restos huerfanos, incoherencias, practicas malas y cosas que van a morder mas adelante.

- **MUST** buscar al dueno **antes** de decidir la caja: reservas, latidos, sesiones vivas y ficha del trabajo.
- Si el dueno esta vivo: se dice quien lo tiene y **se ofrece dejarle una nota**. No se toca.
- Si no aparece, o lleva horas sin dar senales: **la oferta es tuya y es la recomendada**.
- Segun el caso, esa oferta es A1 (si se cumplen las tres), A2 (lo normal) o A3 (decision suya de verdad).

**Ejemplo del dueno, con sus palabras:** ante una carpeta temporal compartida por tres proyectos y con 265 enlaces dentro, decir "no la piso" es el error. Lo correcto es: "¿Tienes localizado el chat que lo esta gestionando? Si no es el caso, ¿quieres que lo deje arreglado yo?".

- **NEVER** leer las prohibiciones de trabajo ajeno como permiso para el silencio. Lo ajeno no se pregunta, y tampoco se deja pasar: **se ofrece**.
- **NEVER** tocar por tu cuenta un bloqueo que no puedes deshacer, aunque parezca obvio: eso es A2 o A3, no A1.

## Caja B: lo delego a un especialista y lo resuelvo

- **MUST** delegar con brief y **esperar el resultado**. La delegacion no es una consulta al dueno.
- **NEVER** avisar al dueno de que se ha delegado como si delegar fuera consultar ("he pedido a @revisor que mire el diff"). Al dueno le llega el veredicto, no la otra punta de la ejecucion.
- Si la delegacion cae o el gate falla, aplican los topes y la escalada de [gobernar-ciclo-chat](../gobernar-ciclo-chat/SKILL.md). Ahi si hay algo que sube al dueno, y sube ya con resultado, no con el aviso de que se esta esperando.
- **NEVER** invocar la delegacion para poder decir "lo ha hecho otro": la frontera es el criterio del especialista, no la excusa.

## Caja C: solo aqui se pregunta

Las tres condiciones son **acumulativas**. Si se puede cumplir **una sola**, no se pregunta: se decide, se ejecuta y se dice que se decidio y por que.

- **(a) Irreversible o destructiva:** la accion borra, sobrescribe o reescribe algo que no se puede recuperar.
- **(b) Preferencia o conocimiento del dueno:** es una preferencia de gusto con coste alto de deshacer, o hay dos salidas razonablemente buenas entre las que el dueno sabe algo que la IA no.
- **(c) Cambia el objetivo:** la respuesta cambia lo que se quiere conseguir, no solo la forma de conseguirlo.

# La prueba de la pregunta

Antes de escribir cualquier pregunta, estas tres preguntas, y se pregunta solo si **las tres son si**:

1. Es irreversible o destructiva?
2. Sabria el dueno algo que yo no se?
3. Cambia el objetivo?

Desempate explicito: **ante la duda, se resuelve y se informa.** Una pregunta que sale de duda es ruido con forma de duda.

# Lo que si se pregunta: la libertad no llega aqui

Esta skill da libertad para trabajar mejor, no para hacer cosas malas. Estas acciones siguen siendo pregunta aunque la IA sepa hacerlo, porque su coste no se recupera:

- **NEVER** borrar datos del usuario.
- **NEVER** tocar credenciales ni conversaciones.
- **NEVER** ejecutar acciones fuera del proyecto acordadas.
- **NEVER** publicar en un sitio publico que no sea el repositorio del proyecto.
- **NEVER** hacer nada cuya inversion no se pueda demostrar.

Ademas: el trabajo de una sesion ajena se **nombra y se protege** siempre, sea dudoso o no, y no entra en tu commit: no se borra y no se recoloca. Lo dudoso se declara. "Dejarlo intacto" significa **no tocarlo por tu cuenta**, nunca **callarse**: si no hay dueno vivo detras, la oferta es tuya y es la recomendada (Caja A2). [Configurar GitHub](../configurar-github/SKILL.md) y [ejecutar-operaciones-sensibles](../ejecutar-operaciones-sensibles/SKILL.md) son los gates que exigen preguntar de verdad, y esta skill no los relaja en ningun caso.

# Como se comunica el resultado sin ser un parte

- **MUST** una linea por cosa: que se hizo y como se comprueba. Sin pretextos y sin entrar en las razonaciones.
- **MUST** ordenar asi: primero lo resuelto, y solo al final lo que de verdad necesita una decision suya, con **maximo tres** decisiones (manda el techo de [comunicar-como-jefe](../comunicar-como-jefe/SKILL.md)). Ese mismo techo cuenta las **ofertas**: entre preguntas y ofertas, **maximo tres por mensaje**, y la oferta va acotada y con recomendacion marcada.
- **NEVER** usar la palabra "pendiente" para algo que la propia IA tiene en la mano. Si esta en su mano, esta hecho.
- **MUST** separar lo resuelto de lo consultado. Si no se consulto nada, no se abre un bloque de preguntas para rellenar.

# Cuando se pausa el trabajo de verdad

Para que esta regla no se convierta en "nunca parar", se pausa en **dos** casos y solo en esos:

1. La accion esta bloqueada por algo que la IA no puede resolver.
2. Seguir adelante costaria un cambio de objetivo.

En esos casos el mensaje lleva **las tres cosas, en este orden**: que falta, que se intento, y opciones con una recomendacion marcada. **NEVER** un "no puedo" a secas, y **NEVER** una pausa sin decir que sigue corriendo.

Un bloqueo para el bloque parado, no para todo: lo que no depende de el sigue adelante ([gobernar-ciclo-chat](../gobernar-ciclo-chat/SKILL.md)).

# Anti-patrones y su correccion

- **Silencio ante lo que ves mal:** MAL detectar algo que no tiene dueno vivo y no decir nada, o decir "no la piso", "lo dejo intacto". BIEN clasificarlo y ofrecerlo. EJEMPLO MAL: "es de otra sesion, no la piso". EJEMPLO BIEN: "¿tienes localizado el chat que lo gestiona? Si no, ¿quieres que lo deje arreglado yo? Recomiendo que si: son restos sin dueno vivo".
- **Callejon sin salida antes de cuestionar el bloqueo:** MAL subir "no puedo tocar eso" cuando el riesgo que lo justifica no esta presente. BIEN comprobar si el riesgo existe y proponer el arreglo estrecho. EJEMPLO MAL: "esa carpeta esta compartida, no la toco". EJEMPLO BIEN: "la proteccion cubre los enlaces, no los restos huerfanos: se pueden retirar sin tocarla, y se comprueba contando enlaces antes y despues".
- **Aviso disfrazado de encargo:** MAL "pendiente de ti: hay que subir esto" cuando la IA puede subirlo. BIEN subirlo y contarlo como hecho, con su comprobacion. EJEMPLO MAL: "Hay que subir los cambios a git, son peligrosos si se pierden". EJEMPLO BIEN: "Subido; el arbol esta limpio y el commit esta en el remoto".
- **Fichero que sobra sin borrar:** MAL "hay un archivo que deberia estar borrado porque no se usa". BIEN borrarlo cuando es reversible o reconstruible, y decirlo. EJEMPLO MAL: "Deberia borrarse la captura antigua". EJEMPLO BIEN: "Borrada la captura antigua; el directorio queda con lo que se usa".
- **Pregunta de forma:** MAL "¿lo dejo en una linea o en dos?" cuando hay criterio. BIEN decidir por criterio y decir cual se uso. EJEMPLO: "Lo deje en una linea porque cabe en el ancho sin partirse".
- **Delegar y avisar:** MAL contar que se ha delegado como si delegar fuera consultar. BIEN delegar, esperar y devolver el veredicto. EJEMPLO MAL: "he pedido revision del diff, te digo". EJEMPLO BIEN: "Revisado: sin hallazgos materiales".

# Alcance y limites

- Aplica a `@orquestador` y a cualquier agente del hub: la pregunta por problema detectado aparece en cualquier fase, no solo al cierre.
- **NEVER** es permiso para saltarse un gate: los gates de [ejecutar-operaciones-sensibles](../ejecutar-operaciones-sensibles/SKILL.md), [configurar-github](../configurar-github/SKILL.md) y [auditar-seguridad](../auditar-seguridad/SKILL.md) siguen exigiendo su autorizacion cuando la clasifican como sensible. Aqui solo se evita la pregunta que no es una decision real.
- **NEVER** sustituye la evidencia: si no se ha comprobado, no se informa como hecho; se dice lo que se hizo y lo que quedo sin comprobar.
- No sustituye la escalada ni los topes del ciclo: eso es [gobernar-ciclo-chat](../gobernar-ciclo-chat/SKILL.md).
- No gobierna la consulta ligera ni la escritura del plan: eso vive en `gobernar-ciclo-chat` (A5) y en la skill `planificar-trabajo`.
- Conviven con ella la [SSOT](../docs/SSOT.md) y las [reglas globales](../docs/AI_GLOBAL_RULES.md). Si una regla global permite preguntar en un caso que aqui cae en Caja A, manda la regla global y el conflicto se reporta; no se reescribe ninguna de las dos por su cuenta.
- Cuando la regla global prohibe convertir el trabajo ajeno en una pregunta o en un bloqueo (Rule 1.6 y Rule 27 de las reglas globales), esa prohibicion es sobre **preguntar**, no sobre **ofrecer**: lo ajeno no se pregunta y tampoco se deja pasar, se ofrece (Caja A2). La prohibicion nunca es motivo para callar.
- **NEVER** entra en A1 el trabajo de otra sesion, ni para guardarlo, ni para moverlo, ni para borrarlo. Antes de tocar una superficie ajena se clasifica con las etiquetas de las reglas globales (`propia`, `ajena-viva`, `abandonada-adoptable`, `generada/accidental`, `indeterminada`); lo ajeno se **nombra y se protege**, y lo dudoso se declara. Adoptarlo no se decide en A1: exige su gate propio (TEAM disponible para adopcion, revision esperada y lease propio) y no transfiere aprobacion humana ni permiso de publicacion.
- Un bloqueo se cuestiona antes de escalarlo: antes de decir "no puedo", se comprueba si el riesgo que lo justifica esta de verdad presente. Si no lo esta, el bloqueo esta mal y se propone el arreglo estrecho (que se cambia, que sigue protegido y como se comprueba). El procedimiento vive en [gobernar-ciclo-chat](../gobernar-ciclo-chat/SKILL.md) (Apartado B).
- El freno de la oferta es [detectar-sobreingenieria](../detectar-sobreingenieria/SKILL.md): "lo mas pequeno que quita el problema entero" es exactamente lo que esa skill audita, y ahi vive el limite que **NEVER** se cruza: no se retira seguridad, autenticacion, permisos, RLS, integridad de datos, concurrencia, rollback, higiene ni coordinacion solo porque parezcan complejos. Aplica cuando la oferta empieza a pedir piezas nuevas.

# Inputs / contexto obligatorio

- El hallazgo concreto: que vio la IA, donde, y por que esta mal.
- La busqueda del dueno: reservas, latidos, sesiones vivas y ficha del trabajo, y su resultado.
- Su reversibilidad: que se pierde si se equivoca y si se puede rehacer.
- La verificacion disponible: que comando, test o lectura demuestra que quedo bien.
- La regla local del proyecto que aplique, si existe (SSOT del proyecto).
- Los gates que ya exigen autorizacion propia: operaciones sensibles, Git/GitHub y seguridad.

# Comportamiento esperado

1. **Detectar** el problema durante el trabajo, sin anunciarlo todavia.
2. **Buscar al dueno** (reservas, latidos, sesiones y ficha) antes de clasificar nada.
3. **Clasificar** en Caja A (A1, A2 o A3), B o C antes de escribir nada al dueno.
4. **A1:** resolver, verificar y devolver una linea de hecho.
5. **A2:** ofrecer con recomendacion marcada, sin parar el resto del trabajo.
6. **A3:** llevarlo al dueno como decision suya, con las opciones masticadas.
7. **B:** delegar, esperar el resultado y devolver el veredicto, sin noticia de la delegacion.
8. **C:** pasar la prueba de las tres preguntas. Si no pasan las tres, se decide, se ejecuta y se dice que se decidio y por que.
9. **Consolidar** el mensaje: primero lo resuelto, al final como maximo tres decisiones suyas, y si no hay ninguna, no hay bloque de decisiones.
10. **Pausar** solo por bloqueo real o por cambio de objetivo, y con que falta, que se intento y opciones con recomendacion.

# Flujo recomendado

- [ ] Detectar el problema y **no** anunciarlo todavia.
- [ ] Buscar al dueno antes de clasificar: reservas, latidos, sesiones vivas y ficha del trabajo.
- [ ] Clasificarlo en Caja A1, A2, A3, B o C antes de escribir.
- [ ] Si es A1: resolver, ejecutar la verificacion y redactar la linea de hecho.
- [ ] Si es A2: pasar las cinco condiciones de la oferta (mejor salida, cierra sin abrir otra decision, solo si importa, lo mas pequeno que quita el problema entero, sin bucle) y escribir la oferta con las cuatro cosas (que es, por que importa, que haria y recomendacion marcada).
- [ ] Si es A3: llevarlo al dueno con opciones masticadas, sin convertirlo en aviso.
- [ ] Si es B: delegar con brief, esperar y consolidar el veredicto, sin aviso intermedio.
- [ ] Si es C: pasar la prueba de las tres condiciones; si falla una sola, decidir e informar del porque.
- [ ] Revisar el borrador: ninguna pregunta que solo pida su opinion, ningun "pendiente" que tenga en la mano, ningun "no la piso" sin oferta detras.
- [ ] Ordenar el mensaje: lo resuelto primero, decisiones suyas al final y como maximo tres.
- [ ] Si algo quedo bloqueado, escribir que falta, que se intento y opciones con recomendacion.

# Criterio de resultado bueno (gate de cierre, auto-cita)

Antes de consolidar, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que busque al dueno de cada hallazgo antes de clasificarlo (reservas, latidos, sesiones y ficha) y digo que encontre en cada caso.
- [ ] **Declaro** que clasifique cada hallazgo en A1, A2, A3, B o C antes de escribir al dueno, y digo cual era en cada caso.
- [ ] **Declaro** que ninguna cosa que pude arreglar u ofrecer quedo en silencio: para cada A1, la linea de hecho con su comprobacion; para cada A2, la oferta con sus cuatro cosas y la recomendacion marcada, y las cinco condiciones pasadas (la mejor salida, cierra sin abrir otra decision, solo si importa, lo mas pequeno que quita el problema entero, sin bucle); para cada A3, la decision que sube.
- [ ] **Declaro** que no reporte nada como callejon sin salida sin la busqueda del dueno y la oferta detras, y que ningun bloqueo se escalo sin cuestionar antes si el riesgo que lo justifica estaba presente.
- [ ] **Declaro** las preguntas y las ofertas que hice ("ninguna" si no hubo): en cada pregunta se cumplian las tres condiciones de la Caja C, y entre preguntas y ofertas no pase del techo de **maximo tres** por mensaje de `comunicar-como-jefe`.
- [ ] **Declaro** que evite los anti-patrones de esta skill, citando cual aplicaba a este caso y que se hizo en su lugar, y que el mensaje va en el orden acordado: lo resuelto primero y al final como maximo tres decisiones del dueno.
- [ ] **Declaro** lo que no pude comprobar y el riesgo residual, sin maquillarlo.

## Triggers

- Keywords: resolver sin preguntar, no me preguntes, solucionalo tu, te paras a preguntar, me avisas en vez de arreglar, hay que subirlo, cambios sin subir, deberia estar borrado, iniciativa, resolver por tu cuenta, no la piso, lo dejo intacto, sin dueno, proactividad, ofrecer solucion, deja pasar el problema, propone por proponer, bucle de decisiones, segunda decision, parche que deja cola, lo mas pequeno que quita el problema
- Patrones de usuario: "Hay un archivo que deberia estar borrado porque no se usa", "Hay que subir las cosas a git porque si no se pierden", "Tienes cambios sin subir y eso es peligroso", "Por que me preguntas esto si puedes resolverlo tu", "Encontraste problemas y no ofreciste solucionarlos", "No la piso, es de otro"
- Encadenamiento: se activa antes de cada mensaje visible al dueno y en cualquier deteccion de problema a mitad de trabajo; `comunicar-como-jefe` gobierna el formato visible; `gobernar-ciclo-chat` gobierna la escalada y los topes; `configurar-github`, `ejecutar-operaciones-sensibles` y `auditar-seguridad` son los gates que si exigen autorizacion; `handoff-y-pendientes` y `cerrar-sesion-chat` preguntan por el cierre del chat, que si es decision del dueno.

# Ejemplos de activacion

- "Hay un archivo que deberia estar borrado porque ya no se usa." (Caja A1: se borra y se dice; no es un aviso)
- "Hay 5 ficheros de trabajo huerfano y nadie los esta gestionando." (Caja A2: se ofrece con recomendacion marcada; no se calla y no se pregunta en seco)
- "Esa carpeta la comparten tres proyectos y no se quien la lleva." (se busca al dueno; si no hay dueno vivo, la oferta es tuya y es la recomendada)
- "Eso es de otra sesion, no la piso." (anti-patron: lo ajeno no se pregunta, pero tampoco se deja pasar; se ofrece)
- "Hay que subir las cosas a git porque si no se pierden." (Caja A1: se sube con el autopiloto y se dice el estado del remoto)
- "Tienes cambios sin subir y eso es peligroso." (Caja A1 sobre el lote propio; lo ajeno se nombra y se ofrece, no se pregunta)
- "Revisa el codigo antes de cerrar." (Caja B: se delega a quien corresponda y vuelve el veredicto)
- "Antes de borrar la base de datos, dime que pierdes." (Caja C por irreversible)
- "Prefieres la foto en PNG o en JPG?" (No se pregunta: hay un criterio, se decide y se dice cual)
- "Propongo un arreglo que despues necesita otra decision tuya." (anti-patron: eso es una cadena, no una oferta; o la segunda decision entra dentro de la oferta y se resuelve ahi, o se descarta la propuesta entera)
- "Un hallazgo que no cambia nada material." (no se ofrece: el silencio sobre lo trivial es correcto; lo prohibido es callar problemas)
