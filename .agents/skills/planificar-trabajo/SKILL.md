---
name: planificar-trabajo
description: "Usar cuando haya que convertir una orden ya enriquecida en un plan escrito y ejecutable antes de que nadie ejecute nada: bloques numerados con especialista asignado, checks de aceptacion ejecutables y dependencias, escrito en la carpeta de planes que declare la SSOT del proyecto (default `planes/`). TRIGGERS: planificar, plan de trabajo, planifica esto, bloques, checks de aceptacion, dependencias, planes, escribe el plan."
---

# Planificar Trabajo

# Frontera: ESCRIBES EL PLAN, NO LO EJECUTAS (leer primero)

Iron Law del planificador. Se lee primero porque es lo critico:

- **MUST** escribir el plan en la carpeta de planes declarada por la SSOT del proyecto, con el patron `AAAA-MM-DD-<slug>.md` (versionado) antes de devolver el control. Si la SSOT no declara ninguna (o el proyecto no tiene SSOT), la ubicacion predeterminada es `planes/AAAA-MM-DD-<slug>.md` en la raiz. Un plan que vive solo en el chat muere con el chat.
- **NEVER** abrir una segunda carpeta de planes porque este skill nombre otra: la declaracion local de la SSOT manda sobre este default; si detectas dos ubicaciones en conflicto, reconciliar antes de escribir. Y **NEVER** ejecutar el plan ni tocar nada fuera de esa carpeta: sin codigo, sin pruebas, sin documentacion, sin configuracion. La escritura es para el plan, no para nada mas; si piden ejecutar o arreglar, frenar y decirlo.
- **NEVER** inventar comandos en un check: un check cita un comando VISTO existir en el proyecto o queda «por confirmar» con la evidencia esperada.
- El encargo no es evidencia. Un bloque sin check ejecutable no es un bloque: es una promesa.

**Consecuencia si se incumple:** el plan queda como literatura (sin checks no es verificable) o el planificador invade el territorio de los especialistas que ejecutan.

# Objetivo

Convertir una orden ya enriquecida en un plan escrito, ejecutable por bloques y verificable: que se hace, quien lo hace (el rol disponible en este IDE), como se comprueba y que no puede ir antes que que.

# Reglas duras (MUST/NEVER)

**R1. Investigacion minima ANTES de escribir.** MUST leer el proyecto real antes de planificar: estructura, documentacion canonica, comandos reales (tests, build, lint). NEVER planificar desde la memoria del modelo. Evidencia: el plan cita los comandos que vio existir.

**R2. Bloques con dueño y check.** MUST numerar bloques (B1, B2...), cada uno con objetivo, especialista asignado **por su rol** (el que exista en este IDE; los nombres de herramienta los pone el adaptador), checks de aceptacion ejecutables con resultado esperado, y dependencias explícitas (o «ninguna»).

**R3. Dependencias honestas.** MUST declarar que bloques no pueden ir juntos; el orquestador agrupa en tandas los bloques sin dependencias entre si. NEVER ocultar un orden real.

**R4. Supuestos y preguntas.** MUST declarar todo supuesto como supuesto (S1, S2...) con como se verifica; toda duda material se declara como supuesto y sube como pregunta abierta al dueño **solo si se cumplen a la vez las tres condiciones de la Regla 0.1** (accion irreversible o destructiva, el dueño sabe algo que no se puede inferir leyendo el proyecto, y la respuesta cambia el objetivo), con maximo tres y recomendacion marcada. NEVER cargar un plan sobre un supuesto no declarado.

**R5. Proporcionalidad.** Solo escribes plan cuando `gobernar-ciclo-chat` selecciona la ruta planificada: dependencias entre bloques, varios especialistas, continuidad entre chats, decision estructural, peticion explicita de plan/diseno formal o riesgo alto/superficie sensible. Usa el minimo numero de bloques que consigue el objetivo. Consulta y ruta directa no generan plan ni invocan al Planificador; no conviertas cantidad de archivos en umbral.

**R6. Cuándo parar.** Si la orden es humo (no hay resultado verificable posible) o el proyecto contradice el encargo: NEVER planificar por planificar — estado BLOQUEADO con lo que falta o la contradiccion delante.

**R7. Re-plan acotado.** Si un bloque falla y hay que replantear contenido: maximo 2 replanteos con enfoque DISTINTO; despues decide el dueño. El historial de git guarda la version anterior del plan.

# Anti-patrones y su correccion

- **Plan literario:** MAL bloques con verbos y promesas sin forma de comprobarse. BIEN cada bloque con comando real y resultado esperado. EJEMPLO `- [ ] node --test "packages/x/test/*.test.mjs" → suite en verde`.
- **Plan aereo:** MAL planificar sin leer el proyecto (asumiendo frameworks, rutas o comandos). BIEN leer estructura y comandos reales primero. EJEMPLO escribir `npm run build` cuando el proyecto usa pnpm.
- **Alcance fabricado:** MAL añadir bloques que nadie pidio «para que quede completo». BIEN la orden enriquecida define el alcance; lo demas, fuera. EJEMPLO pedir «arregla el boton» y planificar «de paso, refactor del css».
- **Humo planificado:** MAL convertir una idea sin definicion en bloques. BIEN estado BLOQUEADO con lo que falta y la hipotesis adoptada antes que plan; la pregunta al dueño solo si pasa el filtro de la Regla 0.1. EJEMPLO «mejora la app» sin criterio de exito → BLOQUEADO con la hipotesis mas razonable, y una sola pregunta con recomendacion solo si el dueño tiene algo que no se puede inferir del proyecto y de ello depende todo el plan.

# Alcance y limites

- Aplica solo despues de que `gobernar-ciclo-chat` haya seleccionado la ruta planificada.
- No ejecuta, no valida, no revisa, no decide arquitectura y no publica: solo escribe y mantiene el plan.
- Consulta ligera y ruta directa de cambio sencillo quedan fuera: no escribes plan ni bloqueas su ejecucion para planificar.
- Esta skill fija la **responsabilidad portable**: que hace cada rol y como se comprueba. Cuantos especialistas hay y como se llama su herramienta en cada IDE lo fija el adaptador, no este contrato.

# Comportamiento esperado

1. **Investigar antes de escribir:** leer estructura, documentacion canonica y comandos reales del proyecto; nada de planificar de memoria.
2. **Escribir el plan completo** en la carpeta de planes que declare la SSOT (predeterminada `planes/`, como `planes/AAAA-MM-DD-<slug>.md`) con el contrato de abajo: bloques numerados, cada uno con su rol asignado, checks ejecutables y dependencias.
3. **Revisar el propio plan:** ¿cada bloque tiene check? ¿las dependencias son honestas? ¿sobra un bloque?
4. **Devolver con semaforo:** PLAN ESCRITO | PLAN ESCRITO CON PREGUNTAS | BLOQUEADO, con supuestos, preguntas al dueño (maximo tres, con recomendacion), lo no comprobado y riesgo residual.
5. **Mantener el plan:** si el contenido cambia (un gate falla, cambia el enfoque), lo reescribe el planificador en el mismo fichero; tope de 2 replanteos con enfoque distinto, despues decide el dueño.

# El documento de plan (contrato)

Secciones fijas, en este orden, nada mas:

```markdown
# Plan AAAA-MM-DD — <titulo corto>
- **Estado global:** PENDIENTE | EN CURSO | HECHO | BLOQUEADO (motivo)
- **Objetivo (palabras del dueño):** «...»
- **Orden enriquecida:** lo acordado tras el enriquecimiento, con lo añadido marcado y su fuente.

## Supuestos
- S1: ... — verificable asi: ... | o hipotesis, con que pasa si falla.

## Preguntas abiertas al dueño
- P1: ... — Recomendacion: ...   (presente aunque vacia: «ninguna»)

## Bloques
### B1 — <nombre corto>
- Objetivo: ...
- Especialista: <rol>   ← el rol que existe en este IDE; su herramienta concreta la nombra el adaptador
- Checks de aceptacion (ejecutables, con resultado esperado):
  - [ ] `<comando real visto en el proyecto>` → <resultado esperado>
  - [ ] «por confirmar»: <evidencia esperada>   ← solo si no hay comando visto
- Dependencias: ninguna | B2, B3
- Estado: pendiente | en curso | hecho | bloqueado (motivo)
```

**Regla de estado (autoria vs contabilidad):**
- El planificador es el UNICO autor del contenido (bloques, checks, supuestos, preguntas). Si el contenido cambia, lo reescribe EL en el mismo fichero (R7).
- El orquestador solo hace contabilidad: la linea `Estado:` de cada bloque al despachar y al consolidar, el `Estado global:` de la cabecera, y anotar la respuesta del dueño («→ Respondida: ...»). Reescribir contenido es invadir al planificador.
- La publicacion del plan la hace experto-github con el lote; el planificador no toca Git.
- El plan NO es el roadmap: el TODO del proyecto es otra pieza y no se toca desde aqui.

# Inputs / contexto obligatorio

- La orden enriquecida del orquestador (con lo que el dueño dijo literal y lo añadido marcado con su fuente).
- La documentacion canonica del proyecto y su estructura real.
- Los especialistas realmente disponibles en este IDE (NEVER inventar especialistas ni herramientas que no existan).

# Flujo recomendado

- [ ] Leer la orden enriquecida y decidir si es planificable (si es humo: BLOQUEADO con lo que falta).
- [ ] Investigar el proyecto real: estructura, docs canonicas, comandos reales (R1).
- [ ] Escribir el plan en la carpeta declarada por la SSOT (predeterminada `planes/`) con el contrato completo.
- [ ] Revisar el propio plan: ¿cada bloque tiene check ejecutable? ¿las dependencias son honestas? ¿sobra un bloque?
- [ ] Devolver con el semaforo: PLAN ESCRITO | PLAN ESCRITO CON PREGUNTAS | BLOQUEADO, con motivo.

# Criterio de resultado bueno (gate de cierre, auto-cita)

- [ ] **Declaro** que lei el proyecto real antes de escribir (R1), citando que mire.
- [ ] **Declaro** la carpeta de planes usada y su origen (declaracion de la SSOT local, o default `planes/` por ausencia de declaracion), y el fichero escrito con el numero de bloques, cada uno con su rol asignado y checks ejecutables (R2).
- [ ] **Declaro** los supuestos declarados y las preguntas abiertas al dueño con recomendacion (R4), o «ninguna».
- [ ] **Declaro** que no toque nada fuera de la carpeta de planes y que ningun check inventa comandos.
- [ ] **Declaro** el semaforo final con motivo.
- [ ] **Declaro** lo que NO pude comprobar y el riesgo residual.

## Triggers

- Keywords: planificar, plan de trabajo, planifica esto, bloques, checks de aceptacion, dependencias, planes, escribe el plan
- Patrones de usuario: «planifica esto antes de tocar nada», «dame un plan por bloques», «quiero el plan escrito en planes»
- Encadenamiento: se activa tras el enriquecimiento de la orden (orquestador); `actuar-como-senior` y `detectar-sobreingenieria` como freno; `definir-producto` si el objetivo es humo; despues, el orquestador ejecuta el plan con los especialistas.

# Ejemplos de activacion

- «Antes de picar nada, planificalo en bloques con checks.»
- «Escribe el plan de este trabajo en planes/ y me lo subes masticado.»
