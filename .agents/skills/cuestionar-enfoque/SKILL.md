---
name: cuestionar-enfoque
description: "Usar cuando una superficie acumule 3 o mas tandas de parches sobre el mismo mecanismo, o antes de despachar la siguiente cura: obliga a frenar y auditar si el ENFOQUE entero sobra (forma nativa del framework, menos piezas) y a proponerselo al dueño con coste/beneficio y riesgo de revert. TRIGGERS: otra ronda de parches, se resiste, volvemos a lo mismo, tercera tanda, mismo bug otra vez, cambio radical, enfoque, sobra, complejidad que crece."
---

# Cuestionar Enfoque

# Frontera de la skill: freno auditor, no prohibition (leer primero)

Esta skill se dispara ANTES de la siguiente cura parcial de un mecanismo ya parcheado. Su frontera es el momento de decision, no el como tecnico:

- **MUST** contar las tandas o parches previos sobre el mismo mecanismo ANTES de despachar la siguiente. Con 3 o mas curas de sintomas, la siguiente accion es una auditoria de enfoque, no otro parche.
- **NEVER** encadenar una cuarta cura de sintomas sin haber escrito y comunicado la alternativa de enfoque (aunque sea para que el dueño la rechace).
- **NEVER** proponer el cambio radical en silencio ni ejecutarlo sin OK del dueño si toca superficie viva: se PROPONE con coste/beneficio, riesgo y plan de revert; el dueño decide.
- NO sustituye a `detectar-sobreingenieria` (que audita sistemas ya construidos) ni a `actuar-como-senior` (criterio general): esta es el freno especifico del momento "otra ronda de parches sobre lo mismo".

# Objetivo

Evitar la trampa del coste hundido: cuando algo "ya funciona" pero necesita parche tras parche, la inercia de las IAs es arreglar el sintoma visible en vez de preguntar si el mecanismo entero sobra. Esta skill obliga a esa pregunta en el momento correcto y convierte la respuesta en una propuesta concreta para el dueño.

# Alcance y limites

- Aplica a cualquier mecanismo de codigo o configuracion con historial de curas repetidas (front, back, infra, docs vivas).
- El umbral (3 o mas curas de sintomas) es orientativo: una orden explicita del dueño ("no sera mejor de otra forma?") dispara la auditoria igual aunque haya menos.
- No sustituye el diagnostico tecnico puntual: un bug nuevo y aislado se cura normal, sin auditoria.
- La auditoria NO es un analisis infinito: maximo una pagina; el entregable es la decision del dueño.
- No autoriza a ejecutar el cambio radical sin OK del dueño cuando hay superficie viva; con superficie muerta o desechada, si.

# Origen (leccion pagada)

Caso real TPV-Manager (ago-sep 2026): el plegado de la cabecera al hacer scroll acumulo 8 tandas de JavaScript (franja fantasma, carrera de compensacion, "pillada", feel tardio...), cada una curando un sintoma del mecanismo "la app escribe el scroll mientras el usuario tambien lo escribe". El dueño pidio un cambio de comportamiento ("que se pliegue poco a poco") y la respuesta fue UNA tanda con CSS scroll-driven nativo (`animation-timeline: scroll()`) que ademas retiro 340 lineas de la maquina de parches y mato matematicamente la clase entera de bugs (el codigo nuevo jamas escribe el scroll). El dueño lo cristalizo como norma: "necesito que seas mas critico; si esta forma no es la mejor, dilo y propone el cambio radical aunque lo actual funcione".

# Comportamiento esperado

1. **Detectar el umbral**: mismo mecanismo + 3 o mas curas de sintomas (tandas, fixes, ajustes) = disparador. Tambien dispara el propio dueño diciendo "otra vez lo mismo" o "se resiste".
2. **Escribir la auditoria de enfoque** (analisis corto, no biblia):
   - Que hace el mecanismo actual y que sintomas ha ido curando (lista con fechas/tandas).
   - La pregunta clave: que pieza moveria el navegador, el framework, la base de datos o la plataforma POR NOSOTROS (CSS nativo, API declarativa, constraint del sistema, libreria mantenida por otros).
   - Coste de migrar (tandas, riesgo) vs coste de seguir (proximo sintoma probable, lineas de guardia acumuladas).
   - Plan de revert (commit exacto al que se vuelve).
3. **Proponer al dueño en cristiano**: que pasa hoy, que habria con el cambio, ejemplo real, y recomendacion. Sin jerga; el decide.
4. **Si el dueño aprueba**: la tanda del cambio radical hereda TODOS los contratos vigentes (tests, sondas, docs) y se ejecuta como cualquier tanda; los contratos que el cambio retira se renegocian explicitamente con la cita del dueño, nunca en silencio.
5. **Si el dueño la rechaza**: queda documentada la decision y el porque; el siguiente parche es legitimo (decision informada, ya no inercia).

# Anti-patrones y su correccion

- **Parchear por momentum:** MAL "el error concreto es este, lo arreglo y sigo" por cuarta vez. BIEN contar las curas previas del mecanismo y disparar la auditoria. EJEMPLO 4º fix de scroll -> freno.
- **Radicalismo sin plano:** MAL proponer "rehagamos esto" sin coste, riesgo ni revert. BIEN propuesta con numeros y plan de vuelta atras. EJEMPLO "revert al commit X en 1 minuto".
- **Cambiar en silencio:** MAL ejecutar el enfoque nuevo porque "es mejor" sin OK del dueño cuando hay superficie viva. BIEN propuesta + decision numerada del dueño.
- **Auditoria eterna:** MAL convertir el freno en un analisis de 40 paginas. BIEN una pagina con la decision; la auditoria no es el entregable, la decision si.

# Inputs / contexto obligatorio

- Historial de tandas del mecanismo (fichas team, git log del area, docs del proyecto).
- Contratos vigentes de la superficie (tests y sondas que anclan el comportamiento actual).
- Referencia de la leccion original: saga scroll TP50-TP56 de TPV-Manager (resumen: el CSS scroll-driven "de carrera" compensaba en exceso y costaba rendimiento; detalle en el repo TPV-Manager).

# Flujo recomendado

- [ ] Contar las curas previas del mecanismo (fichas o git log) y confirmar el umbral (3 o mas).
- [ ] Escribir la auditoria de enfoque: mecanismo actual, sintomas curados, que moveria la plataforma por nosotros, coste/beneficio, plan de revert.
- [ ] Proponer al dueño en cristiano con recomendacion y registrar su decision.
- [ ] Si aprueba: tanda del cambio con contratos heredados; renegociar los retirados con cita explicita. Si rechaza: documentar y seguir con parches legitimados por decision informada.

# Criterio de resultado bueno (gate de cierre, auto-cita)

- [ ] Declaro que conte las curas previas del mecanismo y cite el umbral (3 o mas) con evidencia (fichas o git log).
- [ ] Declaro que escribi la auditoria con la pregunta de que moveria la plataforma por nosotros, coste/beneficio y plan de revert.
- [ ] Declaro que la propuesta al dueño esta en cristiano (que pasa hoy, que habria, ejemplo, recomendacion) y que la decision queda registrada.
- [ ] Declaro que si se ejecuto el cambio, los contratos retirados se renegociaron con cita explicita, no en silencio.

## Triggers

- Keywords: otra ronda de parches, se resiste, volvemos a lo mismo, tercera tanda, mismo bug otra vez, enfoque, cambio radical, refactor, sobra, complejidad que crece, mejor forma, nativo, cuestionar enfoque.
- Patrones de usuario: "otra vez el mismo error", "esto se resiste", "ya son X tandas con esto", "no sera mejor hacerlo de otra forma?", "por que no lo hicisteis asi desde el principio", "se te esta yendo de las manos".
- Encadenamiento: antes `actuar-como-senior` (criterio) y `detectar-sobreingenieria` (si ya esta construido); despues `documentar-con-criterio` (registrar la decision) y la skill de tandas del proyecto para ejecutar el cambio aprobado.

# Ejemplos de activacion

- "Vamos por la cuarta tanda del scroll y sigue raro." -> freno: auditoria de enfoque antes de despachar.
- "No sera mejor dejar que el navegador haga esto en vez de nuestro codigo?" -> exacto: esa es la pregunta canonica de esta skill.
- "Cada fix del modal arregla una cosa y rompe otra." -> contar fixes y disparar.
