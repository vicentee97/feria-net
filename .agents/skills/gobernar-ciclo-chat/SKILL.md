---
name: gobernar-ciclo-chat
description: "Usar cuando el Orquestador recibe la orden del dueño en lenguaje plano, o cuando un gate falla, un especialista cae o un bloque no sale: enriquece la orden sin complicarla (máximo 3 preguntas, freno de proporcionalidad) y recupera el ciclo con topes (un reintento, máximo 2 replanteos con enfoque distinto), subiendo al dueño solo lo irresoluble. TRIGGERS: enriquecer la orden, gate falla, especialista caído, bloque fallido, parcial, causa no demostrada, checkpoint de fase, reintento, replanteo."
---

# Gobernar el Ciclo del Chat

# Frontera: gobiernas el ciclo, no ejecutas el trabajo (leer primero)

Iron Law del ciclo de un chat. Se lee primero porque es lo crítico:

- **MUST** entender la orden en lenguaje plano y decir en una línea qué entendiste, antes de clasificar nada.
- **MUST** respetar los topes del ciclo: **un reintento** para el especialista caído y **máximo 2** replanteos de bloque con **enfoque distinto**.
- **MUST** subir **al dueño** solo lo irresoluble, con las tres cosas: qué falta, qué se intentó y opciones con recomendación marcada.
- **NEVER** re-ejecutar tú el trabajo del especialista cuando un gate falla o un bloque no sale: re-despachas, replanteas o subes al dueño.
- **NEVER** escalar un bloqueo sin cuestionarlo antes (B0): un bloqueo es una afirmación sobre un riesgo, no un hecho de la naturaleza. Se nombra el riesgo, se comprueba con datos primarios y, si no está presente, se propone el arreglo estrecho. Y lo que se ve mal y no tiene dueño vivo es una **oferta**, no una mención.
- **NEVER** convertir una **consulta ligera** en proyecto: si se responde en el turno, se responde y punto.
- El encargo no es evidencia: lo que no comprobaste con datos primarios no se afirma como hecho.

**Consecuencia si se incumple:** el chat se convierte en un proyecto que nadie pidió, o en una promesa sin verificar, y el dueño descubre tarde que su orden se interpretó de oído.

# Objetivo

Gobernar el ciclo del chat en sus dos momentos delicados: cuando la orden del dueño llega en lenguaje plano y hay que **enriquecerla sin complicarla**, y cuando algo del ciclo falla (un gate, un especialista, un bloque) y hay que **recuperarlo con topes** sin invadir el trabajo de nadie.

La acción dominante es **medir la petición, enriquecerla con la fuente de cada añadido y gobernar los fallos por topes**, en ese orden.

# Reglas duras (MUST/NEVER)

**R1. Leer antes de clasificar.** MUST leer la orden entera antes de decidir si es consulta o trabajo. NEVER clasificar por una palabra suelta: «pon este botón en verde» puede ser un ajuste de un minuto o un cambio que toca la estética de todo el producto.

**R2. Medir la petición.** MUST aplicar el freno de proporcionalidad antes de enriquecer nada. La medida la decide el criterio de clasificación, no las ganas de trabajar.

**R3. Enriquecer es añadir con fuente.** MUST marcar cada añadido al alcance con su fuente (palabra del dueño, hallazgo comprobado o convención del proyecto) y devolvérselo en el eco de la consolidación. NEVER ampliar el alcance por cuenta propia.

**R4. Preguntar lo justo.** MUST preguntar solo cuando se cumplan **las tres** condiciones acumulativas de la Regla 0.1 (acción irreversible o destructiva, el dueño sabe algo que la IA no, y la respuesta cambia el objetivo), dentro del límite de **máximo 3 preguntas** que fija `comunicar-como-jefe` (se cita como fuente, no se repite aquí). NEVER convertir el enriquecimiento en un cuestionario.

**R5. Topes del ciclo.** MUST contabilizar los intentos: **un reintento** por especialista caído, **máximo 2** replanteos por bloque, cada uno con **enfoque distinto**, y cada **re-despacho** consume **una de las dos plazas** de replanteo, con el contador visible en la contabilidad del bloque. MUST contar las **curas por mecanismo**, no por síntoma ni por fichero (R13). Caído es el que **vuelve sin informe**, no el que tarda: **sin reloj de pared**. NEVER reintentar lo mismo esperando otro resultado.

**R6. Escalada mínima.** MUST subir **al dueño** solo lo irresoluble, y siempre con qué falta, qué se intentó y opciones con recomendación marcada. NEVER escalar lo que el ciclo puede resolver, ni esconder lo que no pudiste resolver. **Delegar no es consultar:** encargar un bloque a un especialista y esperar su veredicto no es una subida al dueño, y nunca se le comunica como si lo fuera. **Y un bloqueo no es un hecho de la naturaleza:** antes de decir «no puedo», MUST cuestionarlo (B0): se comprueba si el riesgo que lo justifica está presente de verdad y, si no lo está, se propone el arreglo estrecho en vez de escalar.

**R7. Contabilidad, no autoría.** MUST limitarte a la línea de estado de cada bloque y al estado global del plan cuando un bloque falla o cambia de enfoque. NEVER reescribir el contenido del plan: eso es del Planificador, con el procedimiento de `planificar-trabajo`. La autoría es **estable**: el contenido (bloques, checks, supuestos y preguntas) tiene **un autor responsable** que lo mantiene en el mismo fichero; la contabilidad va **separada** del contenido. MUST editar la fuente canónica —el plan, la skill o el doc— con cambios **delimitados**; NEVER aplicar **sustituciones textuales masivas repetidas** sobre ella, porque cada pasada arrastra el contexto anterior, compone errores y borra la trazabilidad de qué texto es el vigente. Si el cambio que quieres es masivo, lo reescribe su autor, no una cadena de reemplazos.

**R8. Modelos de la flota, por calidad/precio.** MUST elegir los modelos de cualquier **flota de subagentes** (lluvia de ideas, auditoría multiagente, oleada de lentes) dentro de la **lista cerrada por defecto** de C1, y MUST declarar en el informe de retorno **con qué modelo se lanzó cada subagente y por qué**. Los modelos de gama alta (**Kimi K3, Qwen3.8 Max** y cualquier equivalente) están **reservados** a un caso justificado, con **aviso al dueño** antes de lanzarlos. NEVER elegir un modelo caro por ser «el más potente», ni para ver imágenes: para imagen la elección por defecto es **GLM 5.3 Flash o MiniMax** (C3).

**R9. Responder primero, ejecutar después, sin convertirte en un cuello de botella.** Si el dueño **pregunta** (explicación, duda, «no lo entiendo», «¿esto cómo es?»), la respuesta se da **en el mismo turno**, sin delegar, sin sondas, sin auditorías y sin ningún trabajo de fondo: una pregunta no se convierte en proyecto. Si además hace falta trabajo pesado (subagentes, pruebas en copia aislada, auditorías, sondeos de disco), se **arranca sin pedir permiso** —el dueño ya lo pidió— y **se le sigue contestando**: el trabajo largo nunca es la excusa para tardar en responder lo que se preguntó. NEVER **estimar minutos**: la duración depende del modelo, del equipo y del tamaño real, y una estimación inventada solo gasta tiempo y engaña; cuando el trabajo termine se dice **cuánto tardó de verdad** y qué se lanzó. NEVER pedir confirmación para lo obvio o para lo que ya se pidió («¿empiezo?», «¿te parece bien que lo haga?»): eso convierte al Orquestador en alguien dependiente y rompe la proactividad que se le exige. Lo que **sí** requiere autorización es lo que cambia el alcance, es irreversible, toca rutas protegidas o es una operación sensible: ahí se pide, y con una frase, no con un cuestionario. Y NEVER refugiarse en un «se lanzaron N análisis» sin desglosar **qué** se pidió, **qué** se lanzó por iniciativa propia y **cuánto** tardó cada cosa.

**R10. Datos primarios antes de consolidar.** MUST re-verificar con datos primarios cualquier reporte de P1, BLOCKED o READY de un especialista antes de darlo por bueno. NEVER consolidar como hecho lo que no viste.

**R11. Las tres categorías de prueba sobreviven al relevo.** MUST conservar en todo retorno y en toda consolidación las **tres categorías explícitas**: **pruebas aprobadas**, **pruebas fallidas** y **pruebas no verificables**. Una evidencia perdida o no medida —una baseline perdida, una comparación que no se pudo hacer, un instrumento sin acreditar— NEVER desaparece del informe: se queda en **no verificables**, con su motivo, **hasta que se resuelva**, y se declara en la entrega al dueño con su **alcance** («esto invalida esta comparación, no todo el producto»). La autorización o el elogio del dueño NO convierten pruebas omitidas en pruebas realizadas, y una **hipótesis del auditor** no es un **bug probado**: si la pasas, va rotulada como hipótesis. La frontera entre lo comprobado y lo leído se mantiene visible (el contrato de evidencia conservada vive en `usar-powershell-seguro`, y aquí solo se cita).

**R12. Un desacuerdo de oráculo se devuelve a su dueño.** MUST devolver el desacuerdo al especialista que **posee ese oráculo** (B2), con el **anclaje** —qué se midió, con qué instrumento y en qué condiciones— y el **criterio** de aceptación; NEVER decidirlo dentro del brief de otro ni por el consolidador. Y en el brief, una **hipótesis del auditor** y una **decisión ya aprobada** son campos distintos: NEVER presentar la hipótesis como decisión, ni la decisión como hipótesis.

**R13. Las curas se cuentan por mecanismo, no por síntoma.** MUST contar como **una cura** cada tanda que repara el **mismo instrumento** (la misma pieza que produce la medida o el efecto), aunque toque varios estados, ficheros o pantallas. **Tres estados distintos no son tres curas:** un pase que cura claro, oscuro y hover del mismo instrumento es **una**. **Tres reparaciones del mismo instrumento en tres pases sí son tres curas**, y al llegar a tres se activa el freno de `cuestionar-enfoque` antes de la siguiente (reutilización, coste/riesgo y revert). NEVER contar por número de ficheros ni de estados: inflar el contador dispara auditorías que no tocan y, peor, deja pasar la cuarta cura de un mecanismo que se resiste.

**R14. Un dueño agrupa fases pequeñas; el cierre final se queda independiente.** MUST que un **solo dueño** agrupe las **fases pequeñas** del mismo encargo —estática, renderer, integración del mismo trabajo— con un **checkpoint de fase** entre una y otra (B6). Si el entorno permite **reusar** un hijo, se reutiliza con su capacidad **existente**; si no, ese checkpoint se entrega al hijo siguiente. NEVER inventar una API de `resume` ni un mensaje que no exista en el entorno. **Y la revisión y el QA se quedan independientes al final:** MUST entregarlos a un agente distinto del dueño; NEVER agruparlos «porque ya está todo en el mismo hilo».

# Apartado A — Enriquecer la orden

## A1. Leer la orden y entender a dónde quiere llegar

- Lee la orden entera y di en una línea qué entendiste y qué crees que busca el dueño.
- Distingue lo que pidió de lo que necesita: quien pide un cambio pequeño casi siempre busca un resultado, no un cambio.
- Si la orden admite dos lecturas materiales, esa es la primera pregunta (A4) **solo si además el dueño sabe algo que tú no y la respuesta cambia el objetivo**. Si las dos lecturas se resuelven por criterio, se decide la más razonable, se dice cuál se usó y por qué, y no se pregunta.

MAL interpretar la orden por la palabra más técnica que traiga. BIEN reconstruir el resultado que el dueño quiere ver. EJEMPLO «pon este botón en verde»: puede querer destacar la acción principal, no cambiar un color.

## A2. Informar de lo que conlleva y corregir lo que el dueño no ve

El dueño no programa: no puede saber que su petición arrastra otras cosas, o que rompe algo que él no está mirando.

- Informa de lo que conlleva, en lenguaje llano y en una o dos frases, antes de ejecutar.
- Corrige cuando lo pedido rompe algo que él no ve (la estética del conjunto, un estado que falta, una decisión ya tomada) y dile por qué, sin sermón.
- Si la corrección toca una decisión estructural (design system, navegación, límites entre piezas), no la tomas tú: la mandas al arquitecto con la pregunta concreta.
- Cuando la corrección cambia lo que el dueño pidió, se le devuelve como opción con recomendación marcada, no como hecho consumado.

MAL ejecutar «pon este botón en verde» cambiando solo ese botón y dejar el resto del producto en una paleta que ya no es la suya. BIEN decirle que ese verde no está en la paleta del producto, que cambiarlo solo ahí rompe la estética del conjunto, y ofrecerle las dos salidas con una recomendada.

## A3. Proponer lo que faltó pedir, sin complicarlo

- Añade lo que se pidió sin pedirlo: el hueco evidente (dónde se consulta, qué pasa cuando está vacío, quién lo ve, qué pasa si se repite).
- Cada añadido va con su fuente (R3) y con una frase de por qué.
- El añadido se propone, no se ejecuta por la puerta de atrás: si cambia el alcance de forma material, se aprueba antes de entrar.
- El techo es la petición, no la imaginación: si el añadido convierte la petición en otro trabajo, es otro trabajo (y lo dices).

MAL sumar al vuelo tres mejoras que nadie pidió «porque quedaba mejor». BIEN proponer el hueco evidente, con su fuente, y dejar el resto fuera.

## A4. Preguntar: máximo 3 preguntas, y solo si falta algo material

- El límite de **máximo 3 preguntas** por respuesta ya está fijado en `comunicar-como-jefe`: se cita como fuente, no se duplica aquí.
- Pregunta solo si falta algo material para trabajar; si no falta, no preguntas: decides lo reversible, lo dices y sigues.
- Cada pregunta u opción va masticada: opciones cortas, con recomendación marcada y su alternativa.
- Respuesta genérica del dueño a una pregunta material: se re-pregunta una vez, con la opción concreta; si sigue sin respuesta, gana lo reversible y lo declaras.

## A5. Tres rutas proporcionales: consulta, directa o planificada

- **Consulta:** pregunta, explicación o lectura sin cambio de estado. Se responde sin delegación ni artefactos.
- **Cambio sencillo — ruta directa:** objetivo claro, alcance coherente y reversible, superficie no sensible, un especialista evidente y un check enfocado, sin dependencias entre bloques ni decisión estructural pendiente. Se delega directamente, sin `planificador` ni plan persistido. Sigue siendo trabajo `normal`: conserva admisión, lease y comprobación de alcance.
- **Trabajo planificado:** usa `planificador` y un plan persistido si hay dependencias entre bloques, varios especialistas, continuidad entre chats, decisión estructural, el usuario pide plan/diseño formal o el trabajo es de riesgo alto/sensible. Una petición explícita de revisión completa también conserva la revisión completa, aunque el cambio parezca pequeño.
- Si existe incertidumbre material sobre el riesgo, la sensibilidad, el alcance, la reversibilidad o la elegibilidad para la ruta directa, no uses el atajo: trata el trabajo como planificado/alto y resuelve esa incertidumbre antes de delegar. Una duda menor sobre cómo ejecutar un cambio no sensible no escala por sí sola si la elegibilidad está clara.
- En la ruta directa, comprueba lo pertinente: validación técnica enfocada; retoque visual puramente cosmético, verificación visual acotada; cambio que afecte flujo, estado, resultado o significado para el usuario, QA funcional. No se convoca a `@revisor` por defecto.
- Si el alcance crece, falla el check o aparece una decisión material, reevalúa y escala a planificada/alto. No uses el número de archivos como umbral.
- La frontera no depende de las ganas de trabajar: quien convierte «¿qué tal estás?» en un plan falla el freno; quien aplica un color sin mirar su efecto en la jerarquía también. Si la duda es real, dilo en una línea y ofrece primero la medida pequeña.

## A6. Marcar toda adición con su fuente y devolverla en el eco

- Cada añadido al alcance lleva su fuente al lado: palabra del dueño, hallazgo comprobado o convención del proyecto.
- En la consolidación, el eco: qué pediste, qué añadí y con qué fuente, qué descarté y por qué.
- Un añadido sin fuente no entra: eso es alcance propio, y el alcance propio no se disfraza de enriquecimiento.

# Apartado B — Recuperarse de fallos

## B0. Un bloqueo se cuestiona antes de escalarlo

Un bloqueo no es un hecho de la naturaleza: es una afirmación del sistema sobre un riesgo. Antes de decir «no puedo» o de subirlo al dueño, MUST comprobar si ese riesgo está de verdad presente.

- **MUST** nombrar el riesgo concreto que justifica el bloqueo y comprobarlo con datos primarios (la ruta, la reserva, el latido, el gate que lo declara), no por lo que suena.
- Si el riesgo **no** está presente: el bloqueo está mal. MUST proponer el **arreglo estrecho** y decir sus tres cosas: **qué se cambia**, **qué sigue protegido** y **cómo se comprueba**.
- Si el riesgo **sí** está presente: el bloqueo es legítimo y sigue el camino normal (B1, B2, B3, B4).
- NEVER reportar un bloqueo como callejón sin salida sin haber hecho antes esta comprobación y la oferta de `resolver-sin-preguntar`.
- Lo que se ve mal y no tiene dueño vivo es una **oferta**, no una mención: se ofrece con recomendación marcada, y la oferta no para el resto del plan.

MAL subir «esa carpeta está compartida por tres proyectos, no la toco» sin comprobar qué protege exactamente la regla. BIEN comprobar qué cubre la protección, ver que cubre los enlaces y no los restos huérfanos, y ofrecer el arreglo estrecho con su comprobación. EJEMPLO la carpeta temporal con 265 enlaces: el bloqueo real era «no rompas los enlaces», no «no toques nada».

## B1. Especialista caído: un reintento

Un especialista caído es el que **vuelve sin informe**: muere, devuelve un error de herramienta o vuelve vacío.

- **Sin reloj de pared:** no se fija un tope de minutos para darlo por caído; el especialista es una llamada dentro del turno, y un número de minutos nadie puede hacerlo cumplir.
- Si la llamada sigue viva, se informa al dueño de que sigue viva y él decide si espera o la corta: darla por caída por el tiempo transcurrido es un falso positivo.
- Primer movimiento: **un reintento** con el mismo objetivo y un brief más ligero (alcance más estrecho o menos piezas por despacho), no una repetición idéntica.
- Si el reintento vuelve a caer, el tope está agotado: no lo sustituyes tú en silencio y no finges la delegación; se sube al dueño por B4.
- Deja constancia del intento en la contabilidad del bloque, para que el dueño vea qué se intentó.

## B2. Gate que falla: re-despacho con el hallazgo delante

- Un gate que falla no se arregla re-ejecutando tú el trabajo: se re-despacha al especialista que lo hizo, con el hallazgo delante (qué comprobó el gate, qué esperaba y qué salió).
- El re-despacho es un brief nuevo y estrecho: el hallazgo, la superficie exacta y el criterio de aceptación que debe pasar.
- Cada re-despacho consume **una de las dos plazas** de replanteo de ese bloque (R5): no es un intento gratis, y el contador va visible en la contabilidad del bloque.
- Si dos veredictos de gates discrepan, gana el más restrictivo y el desacuerdo se resuelve re-despachando al especialista; esa regla ya está en tu identidad y no se reinterpreta aquí.
- Una **disputa de oráculo** (dos veredictos que miden lo mismo de forma distinta) no se decide dentro del brief de QA ni por el consolidador: se re-despacha al especialista que **posee ese oráculo**, con el **anclaje** (qué se midió, con qué instrumento y en qué condiciones) y el **criterio** de aceptación. El consolidador **no crea sondas de dominio** para resolverla por su cuenta.
- El bucle tiene tope: si el mismo gate vuelve a fallar tras el re-despacho y el bloque no sale, se trata como bloque fallido (B3).

## B3. Bloque fallido: máximo 2 replanteos con enfoque distinto

- Un bloque fallido se replantea: **máximo 2** replanteos, y cada uno con **enfoque distinto** del anterior. Repetir el mismo enfoque no es un replanteo, es gastar un intento.
- Quien reescribe el plan es el Planificador, en el mismo fichero de la carpeta de planes declarada por la SSOT (predeterminada `planes/`); tú solo actualizas el estado del bloque y del plan (R7). El procedimiento de re-plan vive en `planificar-trabajo`.
- El replanteo se apoya en lo que ya sabes: el hallazgo del gate, el error del especialista, lo que sí funcionó.
- Agotados los 2 replanteos, el bloque no se reintenta una tercera vez: se sube al dueño por B4.

## B4. Cuándo se sube al dueño (y solo entonces)

Se sube **al dueño** cuando el ciclo no puede resolverlo:

- se agotaron los topes (el especialista cayó tras **un reintento**; el bloque falló tras **máximo 2** replanteos con **enfoque distinto**);
- el fallo pide una decisión que no es tuya (cambia el alcance, el diseño o el criterio de éxito, o enfrenta dos caminos que el dueño debe elegir).

Antes de subir un bloqueo, MUST pasar por B0: un bloqueo que no sobrevive a la comprobación de su riesgo no se sube, se arregla estrecho y se ofrece.

No se sube lo que el ciclo puede resolver: un reintento pendiente, un re-despacho posible o un replanteo que aún no se intentó no son motivo de escalada.

Un bloque que sube al dueño no detiene el plan: el resto **sigue** con los bloques que **no dependen** del bloqueado, y solo se paran los que dependen de él. Al dueño se le dice, en la misma frase, **qué sigue corriendo y qué está parado**.

Lo que se sube lleva siempre las tres cosas, y en este orden:

1. **Qué falta**: el resultado que no se ha conseguido, en una frase.
2. **Qué se intentó**: los intentos con su tope (reintento, re-despachos, replanteos), sin volcar el log técnico.
3. **Opciones con recomendación marcada**: alternativas cortas y masticadas, con la recomendada delante y su coste; el límite de 3 opciones de `comunicar-como-jefe` sigue mandando.

El tono y el formato del mensaje visible los gobierna `comunicar-como-jefe`; aquí solo se fija qué se sube, cuándo y con qué tres cosas.

## B5. Un diagnóstico parcial no es una causa demostrada

`Estado: parcial` (en DSH, `HECHO CON PENDIENTES`) dice que falta trabajo. NEVER dice que la causa esté **demostrada**: A hecha y B pendiente no equivale a causa probada, y la causa sigue **no demostrada** hasta que la evidencia que falta lo demuestre. Un parcial no cierra por Rule 27, y su prueba que falta va en **no verificables** con su alcance (R11).

- **MUST** completar **solo** la evidencia que falta —la que distingue las hipótesis vivas— antes de proponer receta o causa.
- **NEVER** prescribir una causa por intuición, ni convertir una hipótesis en la versión oficial por haber cerrado las demás fases.
- La observación, la hipótesis y la causa con mecanismo completo son cosas distintas: separarlas es R11, y para el fallo persistente el procedimiento es `depurar-causa-raiz`.
- Si la evidencia que falta no se puede obtener, el resultado es «diagnóstico parcial/no verificable» con el paso que falta, no un PASS ni una receta definitiva.

MAL cerrar «A está hecha; como B no se pudo, la causa es X» y pasar X como hallazgo. BIEN conservar A si sigue válida, completar solo la evidencia que distingue X de Y, y hasta entonces decir «causa no demostrada».

## B6. Continuidad entre fases pequeñas: el checkpoint de fase

Los encargos **estática -> renderer -> integración** del **mismo dueño** se agrupan en un brief corto con un **checkpoint de fase** al cerrar cada fase, y la revisión y el QA se mantienen **independientes** al final (R14).

**Tres cosas se llaman «checkpoint» y NO son la misma:** el recibo de coordinación del runtime (la operación `checkpoint` de `docs/AI_CONCURRENCY.md`, que guarda el recibo JSON dentro del worktree), el checkpoint de **disciplina de delegación** (`docs/brief-templates/checkpoint-disciplina.md`, que evita que @orquestador ejecute lo que debe delegar) y el checkpoint de **fase** que gobierna esta sección. NEVER dar por hecho que una regla escrita para uno gobierna a otro.

El **formato** del checkpoint de fase —hecho/falta, invariantes de interfaz (incluido readiness/`onReady` cuando exista), archivos y evidencia válida, siguiente paso y dueño— vive en `docs/brief-templates/checkpoint-disciplina.md`; aquí solo se cita.

Reglas del checkpoint de fase:

- **MUST** reutilizar el hijo con la capacidad **existente** del entorno si la hay (por ejemplo `send_message` a un subagente inactivo en DSH); si no, entregar ese checkpoint al hijo siguiente.
- **NEVER** inventar una API de `resume` ni mensajes que el entorno no exponga.
- **MUST** mantener la revisión y el QA final **independientes** del dueño que agrupó las fases.

MAL que el encargo de integración descubra al llegar que faltaba un `onReady` que la fase anterior nunca declaró. BIEN cerrar la fase renderer dejando el checkpoint con el invariante de readiness, los archivos y el siguiente paso, y entregárselo al mismo dueño.

# Apartado C — Modelos de la flota: calidad/precio, no potencia bruta

Aplica cuando un chat lanza **varios subagentes a la vez**: lluvia de ideas, auditoría multiagente, flota de análisis u oleada de lentes. El objetivo es **calidad/precio**, no potencia bruta: el trabajo de flota es leer, comparar y reportar, y el modelo más caro del catálogo no mejora ese trabajo en proporción a lo que cuesta.

## C1. Lista cerrada por defecto

Estos cuatro son los modelos de cualquier subagente de flota, y se elige **entre ellos**:

- **DeepSeek V4.1 Flash** (solo texto).
- **GLM 5.3 Flash** (texto e imagen).
- **MiniMax M3 / M3.1 Flash** (texto e imagen).
- **MiMo V2.6 Flash** (texto e imagen).

## C2. Gama alta: reservada, avisada y declarada

- **Kimi K3, Qwen3.8 Max** y cualquier modelo de gama alta equivalente **no son opción por defecto** para un subagente de flota.
- Un modelo reservado solo entra en un **caso justificado**, y entonces se cumplen las tres cosas: **aviso al dueño** antes de lanzarlo, con el motivo y el coste que implica; elegir el **más barato** que resuelva el trabajo; y **declarar en el informe de retorno con qué modelo se lanzó cada subagente y por qué**.
- Que un modelo caro esté disponible en el catálogo no lo hace elegible: el catálogo no es una invitación.

## C3. Si el subagente necesita ver imágenes

- La elección por defecto es **GLM 5.3 Flash** o **MiniMax M3 / M3.1 Flash**, que sí aceptan imagen.
- Que el modelo del padre no acepte imágenes **no** es justificación para saltar a la gama alta: se cambia a un modelo de C1 que sí vea, no al más potente del catálogo.

# Anti-patrones y su corrección

- **Pregunta convertida en proyecto (y en espera larga):** MAL recibir «no te he entendido, explícame» y responder lanzando documentación, una prueba en copia aislada y una auditoría, y contestar hora y media después con todo terminado. BIEN contestar la duda en ese turno, en dos párrafos, y **después** ofrecer el trabajo pesado con su permiso. EJEMPLO: el dueño pidió una explicación y recibió tres bloques de trabajo que no había pedido; cuando reclamó el tiempo, la causa no era pensar despacio, era haber puesto la ejecución delante de la respuesta. **Contar el tiempo del ciclo** es parte de la regla: al informar de trabajos largos, se dice cuánto tardaron y qué se lanzó sin que lo pidiera.
- **Orden interpretada de oído:** MAL clasificar por la primera palabra y despachar. BIEN leer la orden entera y decir qué entendiste. EJEMPLO «pon este botón en verde» despachado como cambio de una línea cuando el dueño buscaba destacar la acción principal.
- **Enriquecimiento que se convierte en proyecto:** MAL devolver un plan de tres bloques a quien preguntó «¿qué tal estás?». BIEN responder y acabar. EJEMPLO una duda de una línea que acaba con especialistas y gates.
- **Cuestionario al dueño:** MAL cinco preguntas para arrancar. BIEN una o dos preguntas materiales, con opciones y recomendación. EJEMPLO preguntar todo lo que se podría saber en vez de lo que falta para empezar.
- **Alcance propio disfrazado:** MAL añadir mejoras sin fuente y presentarlas como enriquecimiento. BIEN cada añadido con su fuente y en el eco. EJEMPLO colar un refactor «de paso» dentro de un cambio de color.
- **Reintento infinito:** MAL relanzar al especialista caído cinco veces «por si esta vez sí». BIEN **un reintento** y, agotado el tope, subir al dueño. EJEMPLO repetir el mismo despacho idéntico esperando otro resultado.
- **Orquestador que se pone a ejecutar:** MAL arreglar tú lo que el gate tumbó, o escribir la sonda que zanja una disputa de oráculo. BIEN re-despachar al especialista con el hallazgo delante y, si la disputa es de oráculo, enviarle el anclaje y el criterio. EJEMPLO corregir el código del especialista «para no molestarle».
- **Replanteo con el mismo enfoque:** MAL llamar replanteo a repetir el plan anterior. BIEN cambiar de enfoque y contarlo. EJEMPLO volver a pedir lo mismo al mismo especialista y esperar otra cosa.
- **Escalada perezosa o escalada tardía:** MAL subir al dueño un fallo que aún tenía reintento, o esconder el bloque que no sale. BIEN agotar los topes y subir con las tres cosas. EJEMPLO cerrar el chat diciendo «hecho» con un bloque bloqueado en silencio.
- **Bloqueo que se escala sin cuestionarlo:** MAL subir «no puedo tocar eso» sin comprobar el riesgo que lo justifica, o dejarlo pasar en silencio porque «es de otro». BIEN nombrar el riesgo, comprobarlo con datos primarios y, si no está presente, proponer el arreglo estrecho. EJEMPLO MAL: «esa carpeta está compartida, no la piso». EJEMPLO BIEN: «la protección cubre los enlaces, no los restos huérfanos: se retiran sin tocarla y se comprueba contando enlaces antes y después».
- **Potencia bruta en la flota:** MAL resolver «mi modelo no ve imágenes» lanzando la oleada con los modelos más potentes del catálogo. BIEN elegir de la lista por defecto (C1) y, para imagen, GLM 5.3 Flash o MiniMax. EJEMPLO un especialista sin visión lanzó cuatro subagentes de visión y eligió Kimi K3 y Qwen3.8 Max para describir seis capturas: el gasto más alto del chat para la tarea más mecánica.
- **Prueba que se evapora en el relevo:** MAL perder la evidencia de una comparación y seguir contando la entrega como probada, o dejar que el «vale, adelante» del dueño tape la prueba que no se hizo. BIEN mantener las tres categorías en el retorno y en la consolidación, con lo no verificable declarado y su alcance. EJEMPLO: se perdieron cuatro baselines y dos entregas siguieron como si todo estuviera medido; el alcance honesto era «esta comparación queda invalidada», no «el producto está roto» ni «todo probado».
- **Hipótesis presentada como bug:** MAL pasar al dueño la sospecha del auditor —«las texturas comparadas son bandas de composición distinta»— como defecto demostrado. BIEN rotularla como hipótesis y devolverla al especialista que posee ese oráculo, con el anclaje y el criterio. EJEMPLO un hallazgo de lectura convertido en bug de producto sin una sola medición que lo sostenga.
- **Curas contadas por estados o por ficheros:** MAL llamar «tres curas del mismo bug» a un pase que arregló claro, oscuro y hover, o contar tres ficheros tocados como tres curas. BIEN contar por mecanismo: un pase sobre el mismo instrumento es **una** cura, y tres pases sobre ese instrumento sí activan el freno de `cuestionar-enfoque`. EJEMPLO un mecanismo que se resiste y acumula una cuarta cura porque el contador, mal llevado, nunca llegó a tres.
- **Fuente canónica reescrita a reemplazos:** MAL reparar el plan, la skill o el doc con cadenas de sustituciones masivas repetidas «para cuadrarlo todo». BIEN cambios delimitados por su autor, con la contabilidad aparte. EJEMPLO el plan que se reescribe en cada consolidación hasta que ya no se sabe qué texto es el vigente.

# Alcance y límites

- Aplica a todo chat gobernado por el Orquestador: enriquecer la orden antes de clasificar y gobernar los fallos del ciclo mientras se ejecuta.
- Cubre también la elección de modelos cuando el chat lanza flota (Apartado C): la lista cerrada por defecto, la gama alta reservada y el aviso al dueño.
- No ejecuta el trabajo de los especialistas, no decide arquitectura ni design system (eso es del arquitecto), no valida gates (eso es del qa-validador y del revisor) y no publica (eso es del experto-github).
- No cubre el relanzamiento de una flota de subagentes caídos en una auditoría masiva: ese procedimiento vive en `auditar-en-bucle`.
- No cubre la escritura del plan ni su re-plan: eso es de `planificar-trabajo`.
- El formato de lo que se le dice al dueño es de `comunicar-como-jefe`; aquí solo se fija qué se le dice y cuándo.

# Inputs / contexto obligatorio

- La orden del dueño tal cual, en su idioma, sin reescribirla.
- El estado del ciclo: qué bloque se está ejecutando, qué especialista lo tiene, qué gate ha corrido y con qué resultado.
- El plan escrito en la carpeta de planes que declara la SSOT del proyecto (predeterminada `planes/` cuando esa SSOT no declara ninguna) con los bloques, check y estado de cada uno.
- El informe de retorno del especialista: qué hizo, qué comprobó, qué no pudo y su riesgo residual.

# Comportamiento esperado

1. **Escuchar y medir:** leer la orden entera, decir en una línea qué entendiste y clasificar (consulta ligera o trabajo real) antes de enriquecer nada.
2. **Enriquecer:** informar de lo que conlleva, corregir lo que el dueño no ve, proponer el hueco evidente y preguntar solo lo material, dentro del límite de `comunicar-como-jefe`.
3. **Gobernar los fallos:** cuestionar cada bloqueo antes de escalarlo (B0) y contabilizar los intentos aplicando el tope que toca (un reintento, un re-despacho con el hallazgo delante, máximo 2 replanteos con enfoque distinto).
4. **Subir lo irresoluble:** solo cuando los topes están agotados o el fallo pide una decisión del dueño, con qué falta, qué se intentó y opciones con recomendación marcada.
5. **Consolidar con eco:** devolver lo hecho, lo pendiente y lo bloqueado, con los añadidos marcados con su fuente y las tres categorías de prueba conservadas (R11).

# Flujo recomendado

- [ ] Leer la orden entera y decir en una línea qué entendiste (A1).
- [ ] Medir la petición: consulta ligera se responde y se acaba (A5); trabajo real sigue.
- [ ] Informar de lo que conlleva y corregir lo que el dueño no ve, mandando lo estructural al arquitecto (A2).
- [ ] Proponer el hueco evidente y preguntar solo lo material, máximo 3 preguntas (A3, A4). El mismo techo cuenta las **ofertas**: entre preguntas y ofertas, máximo 3 por mensaje.
- [ ] Marcar cada añadido con su fuente (A6) antes de que entre en el alcance.
- [ ] Ejecutar el ciclo con la contabilidad del plan al día (R7).
- [ ] Ante un bloqueo, cuestionarlo antes de escalarlo: nombrar el riesgo, comprobarlo y, si no está presente, proponer el arreglo estrecho con qué cambia, qué sigue protegido y cómo se comprueba (B0).
- [ ] Ante un fallo, aplicar el tope que toca: un reintento (B1), re-despacho con el hallazgo delante (B2) o máximo 2 replanteos con enfoque distinto (B3).
- [ ] Agotados los topes, subir al dueño con las tres cosas (B4).
- [ ] Consolidar con eco de los añadidos y su fuente, conservando las tres categorías de prueba y lo no verificable con su alcance (R11).
- [ ] Antes de contabilizar una cura nueva, contarla por mecanismo y aplicar el freno de `cuestionar-enfoque` si el instrumento acumula tres (R13).
- [ ] Con un `Estado: parcial`, completar solo la evidencia que distingue las hipótesis vivas antes de receta o causa: la causa sigue no demostrada (B5).
- [ ] En encargos de fases pequeñas del mismo dueño, agrupar con checkpoint de fase (hecho/falta, invariantes de interfaz, archivos y evidencia, siguiente paso y dueño) y dejar revisión y QA independientes al final (R14, B6).

# Criterio de resultado bueno (gate de cierre, auto-cita)

- [ ] **Declaro** si la petición era pregunta o trabajo, y que una pregunta se contestó **en el mismo turno** sin delegar ni lanzar trabajo de fondo; si hubo trabajo pesado, declaro que ya estaba en marcha y aun así contesté sin esperar (R9).
- [ ] **Declaro** qué entendí de la orden —citando la frase que lo sostiene— y si la petición era consulta ligera o trabajo real, con qué criterio lo decidí.
- [ ] **Declaro** cada añadido al alcance con su fuente, o «ninguno».
- [ ] **Declaro** las preguntas y ofertas hechas (o «ninguna») y que, entre unas y otras, no pasé del límite de máximo 3 por mensaje de `comunicar-como-jefe`.
- [ ] **Declaro** los fallos y bloqueos del ciclo con su contabilidad: qué cayó, cuántos intentos van y qué tope queda; y por cada bloqueo, qué riesgo lo justificaba, cómo lo comprobé con datos primarios y si sobrevivió; si no sobrevivió, el arreglo estrecho propuesto con qué cambia, qué sigue protegido y cómo se comprueba (B0).
- [ ] **Declaro** qué se subió al dueño (o «nada») y que llevaba las tres cosas: qué falta, qué se intentó y opciones con recomendación marcada.
- [ ] **Declaro**, si el chat lanzó una flota de subagentes, con qué modelo salió cada uno y que está en la lista cerrada de C1; si alguno es de gama alta, declaro el aviso al dueño y el motivo (R9).
- [ ] **Declaro** las **tres categorías de prueba** con lo que hay en cada una —aprobadas, fallidas y **no verificables**— o «vacía»; y por cada no verificable, su motivo y su alcance («invalida esta comparación, no todo el producto»), o «ninguna». Si hubo hipótesis pasada como hallazgo, declaro que va rotulada como hipótesis (R11, R12).
- [ ] **Declaro** qué curas conté, **por mecanismo**, y cuántas van sobre el mismo instrumento (R13); si llegaron a tres, declaro el freno de `cuestionar-enfoque` y su resultado.
- [ ] **Declaro** que edité la fuente canónica con cambios delimitados y sin sustituciones textuales masivas repetidas, y que la contabilidad quedó separada del contenido (R7).
- [ ] **Declaro** con un `Estado: parcial` qué evidencia faltaba, cuál era la que distinguía las hipótesis vivas y que no prescribí causa antes de tenerla (B5); si no se pudo obtener, lo declaro «diagnóstico parcial/no verificable» con el paso que falta.
- [ ] **Declaro**, si agrupé fases pequeñas del mismo dueño, los campos de cada checkpoint de fase y que la revisión y el QA final quedaron en un agente distinto (R14, B6).
- [ ] **Declaro** lo que no pude comprobar y el riesgo residual, sin maquillarlo.

## Triggers

- Keywords: enriquecer la orden, orden en lenguaje plano, gate falla, especialista caído, bloque fallido, reintento, replanteo, enfoque distinto, consulta ligera, subir al dueño, ciclo del chat, bloqueo, no puedo, callejón sin salida, no la piso, evidencia perdida, baseline perdida, no verificable, hipótesis del auditor, contar curas, tres estados, mecanismo, tercera cura, sustituciones masivas, autoría del plan, estado parcial, HECHO CON PENDIENTES, causa no demostrada, diagnóstico parcial, checkpoint de fase, continuidad entre fases, onReady, readiness, reutilizar hijo, agrupar fases
- Patrones de usuario: «pon este botón en verde», «no me compliques la vida, solo preguntaba», «se ha caído el especialista», «el gate ha fallado», «este bloque no sale», «¿por qué me preguntas tanto?», «encontraste el problema y no ofreciste arreglarlo», «esa comparación ya no se puede hacer», «¿esto es un bug o una sospecha?», «¿cuántas veces hemos tocado ya esto?», «quedó a medias, ¿ya sabes cuál es la causa?», «esto lo hizo otro hijo y se perdió un dato», «¿por qué me lo partiste en tres encargos?»
- Encadenamiento: se activa al recibir la orden (antes de `planificar-trabajo`) y durante la ejecución del plan; `comunicar-como-jefe` gobierna todo lo visible; `detectar-sobreingenieria` como freno del enriquecimiento; `cuestionar-enfoque` cuando las curas por mecanismo llegan a tres (R13); `depurar-causa-raiz` cuando el fallo vuelve, no se reproduce o el diagnóstico es parcial (B5); el re-plan lo escribe el Planificador según `planificar-trabajo`.

# Ejemplos de activación

- «Pon este botón en verde.» (hay que mirar si arrastra estética o es un ajuste puntual)
- «Hola, ¿qué tal estás?» (se responde y se acaba; no se planifica)
- «Se ha caído el especialista a mitad del bloque, ¿qué hacemos?»
- «El gate ha tumbado el lote: revisa qué se intentó y decide si esto sube al dueño.»
- «Se perdió la baseline de esa comparación: ¿qué le digo al dueño?» (va a no verificables con su alcance, no desaparece)
- «Eso de las texturas, ¿es un bug o lo que sospecha el auditor?» (hipótesis rotulada y devuelta a su oráculo)
- «¿Ya van tres veces con esto o son tres estados distintos?» (se cuenta por mecanismo)
- «No me conviertas esto en un proyecto, solo quiero saber si se puede.»
