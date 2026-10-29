---
name: detectar-sobreingenieria
description: "Audita si una propuesta añade complejidad sin beneficio o mas maquina de la que el objetivo necesita ahora (desproporcionada) y propone la alternativa minima suficiente sin retirar salvaguardas justificadas. Aplica a codigo, arquitectura, docs, skills, agentes y automatizaciones. TRIGGERS: sobreingenieria, desproporcionada, sobrearquitectura, simplificar, KISS, YAGNI, demasiadas capas, abstraccion innecesaria, demasiados agentes, skill innecesaria, dependencia innecesaria, plan innecesario."
---

# Detectar Sobreingeniería

## Frontera critica

- **MUST** comparar cada elemento de complejidad con un beneficio concreto, un riesgo evitado o un requisito verificable.
- **MUST** pasar la prueba del momento y mirar implementaciones de referencia antes de clasificar: un beneficio real no basta para clasificar `proporcional`.
- **MUST** proponer una alternativa mínima suficiente cuando el diagnóstico sea `sobreingeniería probable`, `insuficientemente justificada` o `desproporcionada`.
- **MUST** frenar en la tercera vuelta o posterior de parches sobre el mismo mecanismo y proponer cambio de enfoque, no otro parche.
- **NEVER** vender como medida una amenaza plausible ni proponer de memoria lo que hacen otros productos.
- **NEVER** medir la calidad solo por líneas, número de archivos o cantidad de capas.
- **NEVER** retirar seguridad, autenticación, permisos, RLS, integridad de datos, concurrencia, rollback, higiene o coordinación solo porque parezcan complejos.
- **NEVER** crear un informe, plan, skill, agente o artefacto persistente para completar este diagnóstico, salvo petición explícita y justificación independiente.

Si faltan datos, declara `no verificable` y especifica qué evidencia falta. No conviertas una intuición en una simplificación ni un beneficio real en permiso para construir.

## Objetivo

Detectar complejidad redundante, especulativa o desproporcionada antes de implementarla y localizarla en sistemas existentes, manteniendo la complejidad que protege el producto o reduce un riesgo real.

## Alcance y límites

Aplica a:

- código, módulos, capas, abstracciones y arquitectura;
- dependencias, servicios, estados, automatizaciones y procesos;
- documentación, TODOs, planes y artefactos persistentes;
- skills, agentes, prompts, reglas y coordinación multi-IA.

No implementa cambios ni sustituye a la skill dueña del dominio. Después del diagnóstico, el trabajo pasa al propietario correcto: arquitectura, backend, seguridad, documentación, skills, agentes o coordinación.

## Comportamiento esperado

Diagnostica con profundidad proporcional al riesgo, entrega una recomendación concreta y deja la implementación al propietario del dominio.

### Activación proporcional

Carga esta skill cuando:

- el usuario pida explícitamente auditar sobreingeniería, sobrearquitectura, exceso de capas o simplificación;
- una propuesta introduzca una capa, abstracción, dependencia, servicio, agente, skill, script, automatización, documento o flujo transversal y exista una señal de coste de mantenimiento;
- una solución duplique una capacidad existente o se justifique principalmente por reutilización futura, "future-proofing" o porque hay tokens disponibles;
- la pregunta sea «¿esto es lo normal?» o la solución dependa de cómo otros productos resuelven lo mismo.

No hagas una auditoría profunda para un typo, renombrado aislado o cambio local sin señales estructurales.

## Inputs / contexto obligatorio

Reconstruye, con el nivel de profundidad proporcional al riesgo:

1. objetivo real, usuario afectado y resultado observable;
2. código, documentación, diff o propuesta relevantes;
3. capacidades existentes, TODO, coordinación y fuentes canónicas cercanas;
4. riesgo de no hacer el cambio y coste de simplificar demasiado;
5. skill de dominio que debe conservar la decisión técnica.

Si el objetivo pertenece al hub, carga primero [`refinar-cerebro-operativo`](../refinar-cerebro-operativo/SKILL.md). Para arquitectura usa [`actuar-como-senior`](../actuar-como-senior/SKILL.md) y [`definir-arquitectura`](../definir-arquitectura/SKILL.md) cuando correspondan. Para documentación usa [`documentar-con-criterio`](../documentar-con-criterio/SKILL.md); para seguridad, [`auditar-seguridad`](../auditar-seguridad/SKILL.md).

## Flujo recomendado

### 1. Define la necesidad

Escribe en una frase qué debe poder hacer el usuario o el sistema. Separa el problema real de la solución propuesta.

### 2. Busca reutilización antes de añadir piezas

Comprueba si TODO, una fuente canónica, una skill, un agente, un contrato o una herramienta existente ya cubre la necesidad. Si la cubre, la alternativa por defecto es reutilizarla.

### 3. Construye un ledger de complejidad

Para cada pieza nueva o sospechosa, registra lo observable:

```text
Elemento | Coste añadido | Beneficio o riesgo | Evidencia | Decisión
```

Incluye coste de lectura, mantenimiento, pruebas, coordinación, operación y migración; no inventes costes hipotéticos sin marcarlos como hipótesis.

Para cada salvaguarda propuesta anota **adversario y medición**: quién es el adversario y si la amenaza está **medida** (exploit, incidente o prueba reproducible) o **plausible** (razonamiento). Una amenaza plausible se rotula como hipótesis y no es motivo suficiente para construir.

### 4. Pasa la prueba del momento (antes de clasificar)

Para cada salvaguarda propuesta responde:

- ¿el beneficio hace falta **ahora** o es para un futuro hipotético?
- ¿existe una intervención **más pequeña** que consiga el mismo resultado?
- ¿qué se pierde si se aplaza?

Si hay una intervención menor que cubre el objetivo, esa es la propuesta por defecto y la grande es `desproporcionada`. Contrasta además con una evolución por etapas y con el coste de no añadir una salvaguarda necesaria: simplicidad suficiente, no simplicidad ciega.

### 5. Mira a los demás antes de proponer

Si la pregunta es «¿esto es lo normal?» o la solución afecta a cómo otros productos resuelven lo mismo, inspecciona primero implementaciones de referencia (código abierto instalado, documentación oficial) y no propongas de memoria. Si no se puede inspeccionar, márcalo `no verificable` y di qué falta. Mirar no es copiar: la referencia sirve para confirmar o desmentir «lo normal», no para delegar la decisión.

### 6. Freno de ronda repetida

Si es la **tercera o posterior** vuelta de parches sobre el mismo mecanismo, **para** y propón un cambio de enfoque, no otro parche: «el problema no es que falte el parche N+1». Encadena [`cuestionar-enfoque`](../cuestionar-enfoque/SKILL.md); clasificar el parche N+1 como `proporcional` es justo lo que esta regla evita.

### 7. Clasifica

- **`proporcional`:** la complejidad tiene beneficio concreto o evita un riesgo real y el alcance es adecuado para el momento actual.
- **`desproporcionada`:** tiene beneficio real, pero exige más máquina de la que el objetivo necesita **en este momento**. No es sobreingeniería (eso es complejidad sin beneficio) y no autoriza a retirar salvaguardas de seguridad: si la alternativa mínima protege menos, el diagnóstico es `insuficientemente justificada`.
- **`sobreingeniería probable`:** duplica capacidades, añade proceso por reflejo o se apoya principalmente en beneficios especulativos.
- **`insuficientemente justificada`:** puede tener sentido, pero la propuesta no aporta evidencia suficiente para asumir su coste.
- **`no verificable`:** falta contexto primario y no es seguro diagnosticar.

### 8. Devuelve un diagnóstico accionable

Usa este formato y no añadas secciones ornamentales:

```text
Diagnóstico: <estado>
Objetivo real: <resultado que sí hace falta>
Complejidad añadida observada: <piezas y costes materiales>
Beneficio o riesgo que la justifica: <evidencia o hipótesis marcada>
Referencias inspeccionadas: <implementaciones o docs consultadas, o no verificable + qué falta>
Adversario y medición: <quién | amenaza medida o plausible>
Alternativa mínima suficiente: <propuesta concreta>
Complejidad que no debe retirarse: <salvaguardas y motivos>
Recomendación: <mantener, simplificar, aplazar, reutilizar o investigar>
Siguiente propietario: <agente o skill responsable de aplicar el cambio>
Evidencia e hipótesis pendientes: <datos faltantes o Ninguna>
```

La salida vive en el chat. Si el usuario pide conservarla, [`documentar-con-criterio`](../documentar-con-criterio/SKILL.md) decide primero si un documento aporta valor real.

## Guardarraíles contra falsos positivos

- **Más capas = más profesional.** MAL: aceptar servicios, interfaces y adaptadores sin necesidad actual. BIEN: mantener una estructura modular simple y añadir una frontera cuando exista un contrato o riesgo real. EJEMPLO: un CRUD pequeño no necesita microservicios por crecimiento hipotético.
- **Tenemos tokens, hagámoslo completo.** MAL: convertir presupuesto de IA en presupuesto de mantenimiento. BIEN: implementar solo el camino necesario y dejar una extensión reversible. EJEMPLO: usar el TODO existente en vez de crear un sistema paralelo de lotes.
- **Menos líneas siempre es mejor.** MAL: eliminar validaciones o coordinación porque ocupan espacio. BIEN: conservar controles cuyo beneficio sea seguridad, integridad o recuperabilidad. EJEMPLO: no quitar RLS para simplificar una consulta.
- **Algún día lo reutilizaremos.** MAL: crear una abstracción general sin segundo caso plausible y cercano. BIEN: esperar al segundo caso o aislar una extensión pequeña y reversible. EJEMPLO: no crear una skill nueva si una existente cubre el flujo.
- **Auditarlo todo por si acaso.** MAL: ejecutar un análisis transversal para un cambio trivial. BIEN: escalar profundidad solo cuando haya superficie transversal, irreversibilidad o riesgo material. EJEMPLO: un renombrado local no necesita un informe arquitectónico.
- **Beneficio real, máquina desproporcionada.** MAL: clasificar `proporcional` porque el beneficio está medido y la amenaza parece plausible. BIEN: pasar la prueba del momento y proponer la intervención menor que cubre el objetivo. EJEMPLO (caso real): ver el caso trabajado de abajo.
- **Proponer de memoria lo que hacen los demás.** MAL: afirmar «lo normal es cifrar» sin haber mirado una sola referencia. BIEN: inspeccionar el código abierto instalado y la documentación oficial, o declarar `no verificable` con lo que falta. EJEMPLO (caso real): «propuse cifrado antes de comprobar que ninguna referencia lo hace».

**Caso real trabajado: cifrar la clave de API.** Se propuso cifrar con DPAPI la clave guardada en un archivo; una auditoría había medido que se leía en una llamada, así que había beneficio real y no era sobreingeniería. Referencias: las dos herramientas instaladas en la máquina no cifran; guardan la clave en texto plano y dejan además una copia `.bak`. Adversario: quien ya lee el archivo; la amenaza estaba medida, pero el cifrado ataba el secreto a la máquina y añadía una capa que ninguna referencia usa. Intervención menor: configurar el proveedor sin que el bot vea el secreto, que cubría el objetivo y protegía más. Veredicto: `desproporcionada` + alternativa mínima suficiente.

## Triggers

- **Keywords:** sobreingeniería, desproporcionada, sobrearquitectura, simplificar, KISS, YAGNI, demasiadas capas, abstracción innecesaria, prueba del momento, referencias, amenaza plausible, tercera ronda, parche N+1, duplicación, future-proofing, agentes de más, skill innecesaria, dependencia innecesaria, documento duplicado, plan innecesario.
- **Patrones de usuario:** "¿Esto es sobreingeniería?", "simplifica esta solución", "audita si estamos metiendo demasiadas capas", "tenemos tokens, hazlo completo", "¿hace falta crear otra skill/agente/documento?", "¿esto es lo normal en otros productos?", "¿por qué más máquina si el objetivo es este?", "otra vuelta del mismo parche".
- **Encadenamiento:** antes `refinar-cerebro-operativo` si se edita el hub; junto a `actuar-como-senior` y `definir-arquitectura`; junto a [`investigar-antes-de-implementar`](../investigar-antes-de-implementar/SKILL.md) cuando haya que comprobar qué hacen las referencias; si es la 3.ª vuelta o posterior sobre el mismo mecanismo → MUST parar y cambiar de enfoque con [`cuestionar-enfoque`](../cuestionar-enfoque/SKILL.md); junto a `documentar-con-criterio` para docs; junto a `auditar-seguridad` para controles sensibles; después `@revisor` diagnostica y el especialista dueño implementa.

# Ejemplos de activación

- "Audita si crear un `LOTE-*.md` duplica el TODO y la coordinación que ya tenemos."
- "Antes de añadir otra capa de servicios, dime cuál es la alternativa mínima suficiente."
- "Revisa si esta skill nueva aporta valor o solo aumenta el catálogo."
- "No simplifiques auth o RLS sin explicar qué riesgo se conservaría."

## Criterio de resultado bueno

Antes de cerrar, declara con evidencia:

- [ ] **Declaro** que reconstruí el objetivo real y revisé las capacidades existentes relevantes.
- [ ] **Declaro** el resultado de la prueba del momento: beneficio de ahora o futuro hipotético, intervención menor propuesta y qué se pierde al aplazar.
- [ ] **Declaro** qué implementaciones de referencia o documentación inspeccioné, o el `no verificable` con lo que faltó.
- [ ] **Declaro** quién es el adversario y si la amenaza está medida o es plausible; no vendí una plausible como motivo suficiente.
- [ ] **Declaro** el diagnóstico elegido con su evidencia, la alternativa mínima suficiente, las salvaguardas que conservé, la skill dueña encadenada y que no confundí menos líneas con mejor diseño.
- [ ] **Declaro** que en la tercera vuelta o posterior sobre el mismo mecanismo paré y propuse cambio de enfoque, no otro parche.
- [ ] **Declaro** que no creé artefactos persistentes ni implementé cambios desde esta skill, y el gate externo ejecutado cuando el caso era material: segunda IA, prueba, revisión o validación del hub.
