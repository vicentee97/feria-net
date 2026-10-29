---
name: ordenar-archivos
description: "Usar al crear, mover o renombrar archivos, y cuando el arbol tenga desorden, nombres inconsistentes, archivos mal ubicados o ruido acumulado. Cubre la coherencia estructural de rutas, nombres y ubicacion. TRIGGERS: ordenar, limpiar estructura, nombres, carpetas, reorganizar, orden del proyecto, renombrar archivos, crear archivo nuevo, mover archivo."
---

# Ordenar Archivos

# Objetivo
Mantener estructura, rutas, nombres y ubicacion de piezas de codigo de forma coherente con el proyecto real, evitando duplicacion, archivos mal ubicados y decisiones de organizacion tomadas por inercia.

# Alcance y limites
- Incluye **crear, mover y renombrar** archivos y carpetas: son las tres operaciones que cubre esta skill, y las tres exigen el contrato previo de Rule 29 de `docs/AI_GLOBAL_RULES.md` antes de ejecutar.
- Incluye decidir o revisar rutas, nombres de archivos, carpetas, casing, agrupacion por dominio/modulo, ubicacion de helpers, validators, actions, componentes y utilidades.
- Incluye detectar duplicacion estructural: funciones equivalentes con otro nombre, helpers repetidos, validators/actions paralelos, imports profundos innecesarios o archivos huerfanos.
- Incluye distinguir entre rutas canonicas confirmadas y rutas candidatas sugeridas por un brief.
- No autoriza borrados, renombres masivos ni movimientos amplios sin blueprint previo y confirmacion cuando el cambio sea destructivo o dificil de revertir.
- No cambia reglas propias del framework si eso rompe convenciones como routing basado en archivos, carpetas especiales o generacion automatica.
- **Fuera de alcance:** extraer datos compartidos y consolidar librerias NO forman parte de una orden de organizacion. Solo entran con brief explicito y los ejecuta su procedimiento propietario (ver las dos secciones al final del bloque de comportamiento).

# Inputs / contexto obligatorio
- **Hub resuelto** (la ruta real de `CerebroOperativoIA`, no una asumida): su `docs/SSOT.md` y sus `docs/AI_GLOBAL_RULES.md`. Son los que aportan el contrato comun y el estandar de skills; resolucion habitual en `.cerebro-operativo/hub-path.txt`.
- **Proyecto realmente resuelto** sobre el que se escribe: su SSOT local declara la carpeta canonica de planes, las rutas principales, los nombres por familia y las rutas protegidas. Ese documento manda sobre cualquier default de esta skill.
- Estructura real del proyecto y archivos cercanos al punto de cambio.
- Convenciones confirmadas de nombres, casing, exports, imports y agrupacion, leidas en el propio proyecto.
- Brief original, distinguiendo si las rutas vienen de SSOT/issue/arquitectura aprobada o si son deducciones.

**NEVER** tomes rutas por convencion de memoria: el hub y el proyecto se resuelven leyendo su ruta real antes de decidir. Un default de esta skill que contradiga la SSOT local o la convencion confirmada de la familia queda descartado y no se negocia por estetica.

# Comportamiento esperado
## Rutas canonicas y candidatas
- Una ruta sugerida por un brief es candidata salvo que venga marcada o respaldada por SSOT, issue aprobada, arquitectura aprobada o convencion existente.
- Si una ruta es candidata, inspecciona primero el arbol y confirma si encaja antes de crearla.
- Si una ruta es canonica, respetala salvo conflicto real con framework, seguridad, build o documentacion mas autoritativa.
- No conviertas `(nuevo)` en permiso automatico para crear: primero busca equivalentes y convenciones.

**Orden de precedencia al decidir ubicacion o nombre** (el primero que responda, gana):

1. La SSOT del proyecto y sus convenciones confirmadas por familia.
2. La convencion real observable en las piezas vecinas de esa misma familia.
3. El requisito de un framework, generador, herramienta o compatibilidad (excepcion justificada, no incumplimiento).
4. Los defaults de la tabla de naming de esta skill: ultimo recurso, solo cuando no consta nada de lo anterior.

Si el paso 1 y el 2 no existen, el caso es «contexto insuficiente»: investiga antes de escribir. **NEVER** inventes una carpeta, un nombre ni una convencion, y **NEVER** interpretes la ausencia de contexto como aprobacion.

## Cuando la orden del dueno choca con una regla dura
El dueno decide; las reglas duras no se desactivan por orden. Su palabra manda **dentro** de la regla y **NEVER** por encima: la parte que un NEVER prohibe no se ejecuta por explicita, urgente o reiterada que sea la orden, ni en la sombra, ni presentada como hecha. El contrato completo de que manda una orden y que no es de Rule 29 de `docs/AI_GLOBAL_RULES.md` (apartado «Cuando la orden del dueno choca con esta regla»). Aqui va solo como se resuelve al crear, mover o renombrar.

- **Choque con un NEVER:** **MUST** ejecutar la parte segura, minima y reversible, y **MUST** declarar por escrito la parte que no se hizo, con el motivo y el nombre de la regla. **NEVER** la ejecutes en silencio ni la presentes como hecha, y **NEVER** la desbloquees por un «si, hazlo» de confirmacion: el estado es `no hecho` o `bloqueado`, nunca `hecho`.
- **Choque con la SSOT local o con la convencion de una familia:** una orden **NEVER** convierte en convencion confirmada algo que el proyecto no confirma. Trata la orden como dato nuevo del dueno, aplica el patron ya confirmado o el mas cercano que conste, en su version minima y reversible, y declaralo como hipotesis. Si no consta ninguno, el caso es contexto insuficiente: **NEVER** inventes la convencion para complacer la orden; declara el hueco y propone la alternativa.
- **Cambiar la convencion de una familia:** solo es legitimo como cambio declarado, con la SSOT o la skill actualizadas en el mismo acto y los consumidores comprobados. Sin esa declaracion, **NEVER** ejecutes el renombre que salta la convencion de su familia por orden suelta: proponlo en la alternativa.
- **Orden que autoriza tocar, mover o borrar algo protegido** (una salida de build, un artefacto generado, un archivo ajeno): la respuesta **NEVER** es un «no» seco. La orden es la autorizacion para lo que cabe dentro de la regla; **NEVER** basta por si sola para una perdida irreversible. Ahora bien, «tocar» no es una sola cosa y el camino seguro **NO existe para todo**:
  - **Mover, renombrar o reordenar una ruta protegida, generada o de framework: NEVER, ni por orden suelta ni con autorizacion.** Su sitio lo fija el framework o el procedimiento que la regenera; no hay operacion de orden que la reordene sin romper routing, build o imports. Lo que cabe es explicar el choque con la regla y proponer la alternativa legitima: que la configuracion de build emita en otra ruta, o regenerar la salida por su procedimiento propietario. **NEVER** la muevas a mano.
  - **Borrar una salida regenerable** (limpieza de build, artefacto generado): cuando el dueno lo pide, se ejecuta por el procedimiento propietario del framework y por `ejecutar-operaciones-sensibles`: objetivo exacto, alcance acotado, evidencia previa y rollback. **NEVER** por orden suelta.
  - **Un archivo ajeno:** solo con copia verificada y con la autorizacion explicita que exige el procedimiento de operaciones sensibles.
  - Si el objetivo no se identifica con precision, el estado es `bloqueado`, no `hecho`.
- **«No me preguntes» (o «no leas documentacion»):** el hueco **NEVER** se rellena preguntando ni inventando: se rellena investigando y **informando**. Investiga primero (SSOT, vecinos, consumidores, historico); si sigue sin constar, aplica solo la parte segura y reversible, deja por escrito lo que no hiciste, su motivo y la alternativa, y sustituye la pregunta por el informe. **NEVER** uses esa prohibicion como permiso para cerrar el hueco por la via irreversible ni para ejecutar en la sombra.
- **Cita la fuente de todo hecho sobre el repo:** toda afirmacion de hecho (que un archivo existe, que «ya existia», que una pieza se comprobo) **MUST** citar lo que la sostiene —ruta, comando con su salida, commit o dato leido—. Un «ya existia» sin fuente es incumplimiento demostrable, no un atajo de redaccion. Lo no comprobado se declara como no comprobado.

## Lectura local proporcional
- **Crear:** lee la carpeta destino y 2-3 piezas vecinas de la misma familia. Eso basta para resolver la convencion. No escanees el repositorio entero «por si acaso».
- **Mover o renombrar:** lee las referencias del elemento concreto (importadores, configuracion, scripts, docs que lo nombran) y las rutas protegidas que lo esperan en un sitio fijo.
- Amplia la lectura solo si aparece una senal real: frontera entre modulos, duda sobre el alcance del renombre, o posible duplicado en otra zona.
- Un barrido general del arbol es una operacion de revision o auditoria, no la preparacion por defecto de un cambio puntual.

## Crear, mover y renombrar
Las tres operaciones comparten contrato previo, cambiando solo la comprobacion final.

### Crear
- Antes de crear un archivo, carpeta, helper, validator, action o componente nuevo, busca si ya existe una pieza equivalente o un patron cercano.
- Elige nombres y carpetas por convencion del proyecto, no por gusto aislado ni por el primer nombre plausible.
- Reutiliza funciones existentes cuando encajen; no dupliques helpers, validators, actions ni utilidades con nombres distintos.
- Si la decision es local, reversible y encaja con convenciones, puedes avanzar y declarar la hipotesis.
- Si la ubicacion afecta fronteras entre modulos, arquitectura, dominio o rutas dificiles de revertir, escala a @orquestador para @arquitecto.

### Mover o renombrar
- **MUST** aplicar el contrato previo completo de Rule 29 antes de tocar nada: categoria y propietario, ruta canonica, equivalente cercano, consumidores y rutas protegidas, cambio minimo.
- **MUST** actualizar todos los consumidores que rompan con el cambio (imports, referencias, configuracion, docs que citan la ruta) en el mismo lote.
- **NEVER** muevas ni renombres por estetica sin senalar el consumidor afectado: si rompe un import o una ruta esperada por una herramienta, no es una mejora de orden.
- **NEVER** toques rutas protegidas: artefactos generados, salidas de build, routing basado en archivos del framework, carpetas especiales ni alias de compatibilidad.
- Un renombre o movimiento de una sola pieza es cambio minimo; un renombre masivo es reorganizacion y exige blueprint previo.
- Si el renombre rompe consumidores que no controlas o cruza fronteras de modulo, es decision estructural: escala a @orquestador para @arquitecto.

## Convenciones de naming (defaults React/TS = ultimo recurso; la convencion confirmada del proyecto SIEMPRE gana)
Estos defaults **no se aplican de memoria**: son el cuarto peldaño de la precedencia de arriba. Si la SSOT local o las piezas vecinas de esa familia dicen otra cosa, manda lo que dice el proyecto.

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `FloatingNavbar.tsx`, `HeroSection.tsx` |
| Hooks custom | kebab-case con `use-` | `use-theme-toggle.ts`, `use-toast.ts` |
| Utilidades | kebab-case | `utils.ts`, `format-date.ts` |
| Datos | kebab-case | `projects.tsx`, `portfolio-data.ts` |
| Configs | kebab-case o nombre de herramienta | `eslint.config.mjs`, `tailwind.config.ts` |
| Assets en public/ | kebab-case sin espacios | `about-avatar.jpg`, `ventana-de-ventas.jpg` |
| C# / .NET | PascalCase | `ProductoService.cs` |
| Python | snake_case | `workspace_hygiene.py` |
| (otra familia) | la convencion de esa familia | la que confirmen sus piezas vecinas |

Regla práctica: si un archivo rompe la convención de **su propia** categoría, renombrarlo y actualizar todos los imports.

**Excepciones protegidas (no son incumplimientos):** los nombres exigidos por un framework, un generador, una herramienta o la compatibilidad se conservan tal cual. **NEVER** fuerces una convencion sobre otra por estetica.

- **TPV-Manager:** componentes React y clases C# en PascalCase, hooks `useNombre.js` y utilidades JavaScript en camelCase. Correcto: son las convenciones de sus familias.
- **Portfolio:** componentes propios en PascalCase, hooks `use-name.ts` y nombres propios de shadcn tal como los trae la libreria. Correcto: son su stack y su design system.
- **NEVER** impongas kebab-case a una clase C# ni a un hook camelCase, ni renombres un componente de libreria por parecerte inconsistente con los propios.

## Extraccion de datos duplicados (NO es una operacion de orden)
> **Fuera de alcance por defecto.** Una orden de organizacion (ordenar, limpiar, renombrar, reorganizar) **NEVER** autoriza extraer datos ni tocar la capa de datos. Solo se ejecuta con brief explicito, porque cambia contratos y consumidores: es refactorizacion, no orden.

Si existe esa autorizacion explicita, el procedimiento propietario es el de la capa de datos del stack:
1. Identificar la fuente de verdad mas completa.
2. Extraer a la capa de datos del stack (p. ej. `src/data/`) con tipos definidos segun el lenguaje del proyecto.
3. Actualizar todos los consumidores para importar desde la fuente unica.
4. Verificar que las descripciones y datos no han divergido entre las copias.
5. Ejecutar typecheck y build.

Si detectas duplicacion de datos **durante** una tarea de orden, no la ejecutes: declarala como hallazgo y pide brief propio.

## Consolidacion de librerias (NO es una operacion de orden)
> **Fuera de alcance por defecto.** La DETECCION de librerias sin uso la audita `auditar-proyecto-tecnico` (report-only, con los 4 casos trampa). La EJECUCION solo entra con brief explicito, porque cambia dependencias y puede alterar el build: eso no es orden de archivos, es un cambio de dependencias.

Cuando multiples librerias cubren el mismo proposito (iconos, animaciones, formularios, estado):
1. Identificar cual se usa mas en el codigo real.
2. Migrar los usos de las otras a la elegida.
3. Eliminar las no usadas de `package.json`.
4. Verificar build despues de cada eliminacion.

**NEVER** elimines dependencias como efecto colateral de ordenar archivos.

## Cambios estructurales, movimientos amplios o limpieza
- Para reorganizaciones, renombres, movimientos amplios o limpieza de carpetas, prepara primero un blueprint de arbol objetivo.
- El blueprint debe indicar que se mueve, que se renombra, por que mejora coherencia y que imports/consumidores se actualizaran.
- No elimines archivos salvo autorizacion explicita o aplicando una skill de operaciones sensibles cuando corresponda.

## Relacion con higiene de artefactos
- Esta skill decide orden estructural, ubicacion, nombres, duplicacion y archivos huerfanos de producto.
- El ciclo de vida operativo de temporales y artefactos creados por agentes vive en Rule 24 de `docs/AI_GLOBAL_RULES.md` y `scripts/workspace_hygiene.py`; no depende de activar esta skill.
- Un temporal propio registrado puede limpiarse por ese contrato. Borrar o mover legado, archivos ajenos o material dudoso sigue requiriendo revision y, cuando corresponda, `ejecutar-operaciones-sensibles`.

## Anti-patrones y su correccion
- **Crear por ruta candidata sin inspeccionar:** MAL crear `src/actions/products.ts` solo porque el brief lo nombra. BIEN inspeccionar arbol y convenciones y confirmar canonica vs candidata. EJEMPLO el brief pide `src/helpers/fecha.ts` y el proyecto ya tiene `src/utils/dates.ts`: extender ese.
- **Crear sin leer la carpeta destino:** MAL inventar la convencion de una familia mirando solo el brief. BIEN leer la carpeta destino y 2-3 piezas vecinas. EJEMPLO el brief pide `src/hooks/useFilters.ts` y los vecinos de `src/hooks/` son `use-filters.ts`: sigue al vecino.
- **Renombrar por gusto rompiendo imports:** MAL renombrar por estetica sin seguir los importadores. BIEN renombrar solo con blueprint y actualizacion verificada de imports. EJEMPLO un renombre que rompe 12 imports sin actualizarlos no es orden, es regresion.
- **Mover sin comprobar consumidores ni rutas protegidas:** MAL mover un archivo porque «queda mejor» en otra carpeta. BIEN comprobar importadores, configuracion y rutas que una herramienta espera fijas antes de mover. EJEMPLO mover un archivo que el framework enruta por ruta rompe el producto aunque el arbol quede mas limpio.
- **Borrar "huerfanos" sin autorizacion:** MAL borrar archivos que "parecen sin uso". BIEN reportarlos y derivar a la skill de operaciones sensibles bajo brief.
- **Tabla de naming por encima de la convencion real:** MAL imponer PascalCase de React en un proyecto Python, o kebab-case a una clase C#. BIEN SSOT y convencion confirmada de la familia primero; la tabla de defaults solo como ultimo recurso.
- **Meter extraccion de datos o consolidacion de librerias dentro de una orden de organizacion:** MAL aprovechar «ordena esto» para extraer datos o quitar dependencias. BIEN tratarlas como refactorizacion con brief propio y reportarlas como hallazgo. EJEMPLO un renombre de carpeta no justifica tocar `package.json`.
- **Escanear el repositorio entero para crear un archivo:** MAL barrer todo el arbol ante un cambio puntual. BIEN lectura local proporcional (carpeta destino y vecinos); ampliar solo con senal real.
- **Obedecer una orden que rompe un NEVER y presentarla como hecha:** MAL renombrar la pieza que salta la convencion de su familia o borrar lo ajeno porque el dueno lo pidio, y reportarlo como trabajo terminado. BIEN ejecutar la parte segura, minima y reversible, y declarar la parte no hecha con su motivo y su regla. EJEMPLO el dueno pide normalizar un hook camelCase a kebab-case: se informa del choque con la convencion de esa familia y no se ejecuta el renombre.
- **Responder «no» seco a una orden que autoriza tocar algo protegido:** MAL negarse sin mas a borrar un artefacto generado o un archivo ajeno que el dueno autoriza, y MAL tambien mover, renombrar o reordenar una ruta protegida, generada o de framework porque el dueno lo autorice: ahi no hay camino seguro que la reordene, su sitio lo decide el framework o su procedimiento de regeneracion. BIEN explicar el choque con la regla y proponer la alternativa legitima (configuracion de build que emita en otra ruta, o regenerar), y para lo que si tiene salida, hacer copia verificada y pasar la parte destructiva por `ejecutar-operaciones-sensibles` con objetivo exacto, alcance acotado, evidencia y rollback. EJEMPLO el dueno autoriza limpiar una salida de build: se verifica la copia y se borra por el procedimiento de operaciones sensibles, no por orden suelta; si lo que pide es mudar esa salida de carpeta, no se mueve y se propone la configuracion.
- **Rellenar el hueco cuando no se puede preguntar:** MAL inventar la convencion o saltarse la comprobacion porque el dueno dijo «no me preguntes». BIEN investigar primero e informar lo que no se hizo, su motivo y la alternativa. EJEMPLO con una orden de ordenar sin contexto local: se aplica solo el patron confirmado y se declara el resto como no hecho.

# Flujo recomendado
- [ ] Resolver el hub y el proyecto reales; leer su SSOT y el brief original.
- [ ] Clasificar la operacion: crear, mover o renombrar (o revision de orden).
- [ ] Aplicar el contrato previo de Rule 29: categoria y propietario, ruta canonica, equivalente cercano, consumidores y rutas protegidas, cambio minimo.
- [ ] Hacer la lectura local proporcional a esa operacion.
- [ ] Clasificar rutas como canonicas confirmadas o candidatas.
- [ ] Buscar equivalentes antes de crear piezas nuevas.
- [ ] Elegir ubicacion/nombre coherente o escalar a @arquitecto si la decision es estructural.
- [ ] Actualizar los consumidores afectados y comprobar el cambio.
- [ ] En revisiones, reportar solo desorden material: duplicacion, mala ubicacion o naming que cause riesgo real.

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] **Declaro** que resolvi el hub y el proyecto reales (no rutas asumidas) y que cedi ante su SSOT y convenciones confirmadas por delante de los defaults, o que no hubo conflicto.
- [ ] **Declaro** si la operacion fue crear, mover o renombrar, y el cambio minimo elegido.
- [ ] **Declaro** el blueprint antes de cualquier movimiento amplio (que se mueve, que imports cambian, por que mejora coherencia).
- [ ] **Declaro** cero borrados sin autorizacion explicita o skill de operaciones sensibles.
- [ ] **Declaro** que verifique los consumidores afectados (imports, configuracion, docs) y las rutas protegidas que no toque.
- [ ] **Declaro** que no ejecute extraccion de datos ni consolidacion de librerias, o que existia brief explicito propio para ello.
- [ ] **Declaro** las decisiones estructurales escaladas a @orquestador para @arquitecto (o que no hubo ninguna).
- [ ] **Declaro** si la orden del dueno choco con un NEVER, con la SSOT local o con la convencion de una familia, y como se resolvio: parte ejecutada, parte declarada como no hecha con su regla, o alternativa propuesta.
- [ ] **Declaro** que cada afirmacion de hecho sobre el repo (existencia, equivalencia, comprobacion) va con su fuente citada, o queda marcada como no comprobada.

## Triggers
- Keywords: ordenar, limpiar estructura, nombres, carpetas, reorganizar, orden del proyecto, renombrar archivos, crear archivo nuevo, mover archivo
- Patrones de usuario: "Ordena estos archivos y nombres", "Revisa si estas rutas nuevas tienen sentido", "Antes de crear este validator/action, comprueba si ya existe algo equivalente", "El brief sugiere X; verifica si es ruta canonica o candidata", "Voy a crear este archivo, dime donde va", "Mueve esto a su sitio"
- Encadenamiento: antes de @arquitecto si la decision afecta fronteras entre modulos o estructura transversal dificil de revertir; despues de `mantener-cerebro-operativo` para chequeos integrales del hub; hermana de `revisar-cambios` para verificacion pre-publicacion

# Ejemplos de activacion
- "Ordena estos archivos y nombres."
- "Revisa si estas rutas nuevas tienen sentido."
- "Antes de crear este validator/action, comprueba si ya existe algo equivalente."
- "El brief sugiere `src/actions/products.ts`; verifica si es ruta canonica o candidata."
- "Voy a crear este helper; dime donde va segun la convencion del proyecto."
- "Renombra este componente a PascalCase."
