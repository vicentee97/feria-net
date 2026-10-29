---
name: endurecer-skills
description: "Usar despues de crear-skills para garantizar que una skill se cumple de verdad en runtime, aplicando principios de como piensan las IAs (atencion en U, reglas verificables, gates externos, auto-cita, etc.). NO crea la skill ni define estructura; eso hace crear-skills. TRIGGERS: cumplir skill, skill ignorada, IA no hace caso, regla blanda, checklist ignorado, perdida en el medio, lost in the middle, auto-cita, enforcement skill, rediseñar skill, regla no se cumple."
---

# Endurecer skills

# Frontera con crear-skills
- `crear-skills` -> la skill existe y tiene forma (carpeta, frontmatter, encoding, naming, secciones, triggers).
- `endurecer-skills` (esta) -> la skill se cumple de verdad (cognicion del LLM, posicion en el archivo, tipo de regla, gates de cierre, anti-patrones de diseno).

Flujo canonico: primero `crear-skills` (existe), despues `endurecer-skills` (se cumple).

# Objetivo

Una skill que existe pero no se cumple en runtime es ruido. Esta skill convierte criterio bueno en criterio que el modelo realmente aplica: elegir el tipo de regla, la posicion en el archivo, el gate de cierre y los anti-patrones de diseno que vencen los sesgos fuertes del entrenamiento base.

# Alcance y limites
- Aplica al diseno, auditoria o rediseño de skills del hub.
- NO crea la skill ni define su contenido de dominio; eso hacen `crear-skills` y la skill de dominio respectivamente.
- NO sustituye a `validar-calidad` (gate tecnico) ni a `documentar-con-criterio` (densidad); coopera con ambas.

# Inputs / contexto obligatorio
- La skill a endurecer: su `SKILL.md` y sus referencias.
- `crear-skills` ya cargada (la skill ya existe y tiene forma).
- Validadores del hub: `scripts/test_skills.py` y `scripts/validate-hub-skills.ps1`.

# Los 10 principios

Cada principio une una propiedad cognitiva del LLM con una decision concreta de diseno.

1. **Atencion en U (lost in the middle)** — Cita: Liu et al., "Lost in the Middle" (arXiv:2307.03172, 2023; recall ~75% inicio, ~20% medio, ~72% final). Refresco 2025 (NoLiMa, arXiv:2502.05167): el dip al medio persiste en tareas dificiles, atenuado en simples — refrescar la cifra con medicion propia si se discute; la practica queda.
   - Aplicacion: lo critico (frontera, reglas gate, anti-patrones principales) va al INICIO y al FINAL del archivo. El medio solo para detalle de referencia. Si una regla dura vive en el medio de un archivo largo, la IA la skim, no la aplica.

2. **Verificable > abstracta** — Cita: IFEval (Google Research, 2023) esta saturado; la frontera actual es IFBench (Ai2, 2025): 58 restricciones novedosas fuera de dominio con scores bajos. Verificable > abstracta sigue siendo la palanca.
   - Aplicacion: cada regla operacional con verbo de accion y criterio binario. Convertir aspiracional ("que se sienta coherente") en verificable ("declaro que hay una sola accion dominante") siempre que sea posible.

3. **Sin enforcement externo no hay cumplimiento** — Cita: auditorias externas (PrismorSec / Warden) reportan caidas al 25-40% sin capa externa; evidencia interna 15/09/2026: los validadores no gateaban el gate de cierre y los P1 pasaban en verde. NEVER fiarse del "esta escrito"; refrescar la cifra con muestreo propio.
   - Aplicacion: las reglas criticas NECESITAN un gate externo (lint, test, hook, segunda IA, validador del hub). Lo que no tenga gate se marca como soft y no se fía de que se cumpla. "Esta escrito" no es lo mismo que "se hace".

4. **Densidad moderada** — Cita: Anthropic ("ruthlessly prune, if Claude does it without the rule, delete it or convert to a hook") y OpenAI ("una AGENTS.md de 50 lineas bien escogidas supera a una de 300").
   - Aplicacion: borrar redundante, mover secundario a archivo de referencia, nucleo corto. Una skill no crece sin control: antes de añadir, decidir que informacion sobra y quitarla o moverla a referencia. El criterio es el contenido, nunca el recuento de lineas (mismo criterio que `detectar-sobreingenieria`).

5. **Par anti-patron -> alternativa -> ejemplo** — Aplicacion: NUNCA escribir solo "evita X". Siempre "evita X, haz Y en su lugar, ejemplo: Z". Esto vence sesgos fuertes del entrenamiento (landingitis, card soup, generico, copy compensatorio). Un nombre de anti-patron sin alternativa no cambia la conducta por defecto del modelo.

6. **Un solo checklist de auto-cita al cierre** — Aplicacion: multiples listas alimentan "marcado fantasma" (el modelo marca "hecho" sin verificar). Preferir auto-cita ("declaro que aplique X con evidencia Y") a auto-evaluacion ("¿aplique X?"). Un unico gate citado supera a varias listas no citadas. Cada item del gate debe citar su artefacto (fichero:linea, comando+salida o TEAM_ID); un Declaro sin artefacto citable es auto-evaluacion disfrazada.

7. **MUST/NEVER para hard rules, "preferir" para soft** — Cita: system prompt de Claude Code reverse-engineered.
   - Aplicacion: marcar obligacion vs preferencia de forma explicita. Mezclar MUST con "seria bueno" hace que todo se lea como "seria bueno". Hard rules con MUST/NEVER; soft rules con "preferir / suele / por defecto".

8. **Test del colega despistado** — Cita: regla dorada de Anthropic.
   - Aplicacion: si un humano con contexto minimo se confunde leyendo la skill, la IA tambien. Reescribir.

9. **Segunda IA como gate en casos criticos** — Cita: practicas de subagente de verificacion de Claude Code ("el agente que hace el trabajo no debe ser el que lo califica").
   - Aplicacion: para trabajo con alto riesgo de auto-engaño (UI con estado/overlay/responsive/formulario, seguridad, migraciones), delegar la validacion a un segundo agente (@revisor / @qa-validador / @especialista-seguridad) es OBLIGATORIO, no sugerencia. Nota runtime 2026 (DSH): el harness ya tiene subagentes reales; el gate se resuelve con subagente real o fallback DECLARADO (quien fue y que contexto compartia); nunca soft por defecto.

10. **Markdown estructurado > prosa densa** — Cita: mejores practicas de prompting de Claude; system prompt reverse-engineered de Claude Code ("structured prompt outperforms natural language prose every time").
    - Aplicacion: headers, listas, tablas, bloques. Evitar parrafos densos de mas de ~5 lineas.

# Comportamiento esperado

Antes de añadir o mantener una regla, decidir:
- Su **tipo**: hard (MUST/NEVER) o soft (preferir). Marcarlo explicito.
- Su **posicion**: si es critica, va al inicio o final del archivo (principio 1).
- Su **gate**: si es critica, NECESITA gate externo (principio 3). Si no lo tiene, declararla soft.
- Su **forma**: verbo de accion + criterio binario (principio 2), no prosa aspiracional.
- Su **anti-patron**: si corrige un sesgo, debe tener alternativa + ejemplo (principio 5).

Colapsar listas multiples en un unico gate de auto-cita (principio 6). Exigir segunda IA en casos criticos (principio 9).

# Anti-patrones de diseno de skills

- **Listas multiples paralelas** -> consolidar en un unico gate de auto-cita -> "3 checklists de 15 items" se convierte en "1 gate de 7 items citados al cerrar".
- **Criterio denso en el medio del archivo** -> mover nucleo al inicio, detalle a referencia -> "escalada diagnostica en 21 lineas de prosa" se convierte en "arbol binario de 5 lineas + enlace a detalle".
- **Anti-patron sin alternativa** -> par mal/bien/ejemplo -> "evita card soup" se convierte en "evita card soup; usa layout/espaciado/tipografia; ejemplo: KPI arriba + chips secundarios en una sola Card".
- **Auto-evaluacion en lugar de auto-cita** -> exigir declaracion con evidencia -> "¿evite cajas?" se convierte en "declaro que la accion dominante es X con evidencia Y".
- **Referencias huerfanas** -> enlazarlas desde el nucleo o fusionar y borrar -> "una referencia .md no enlazada desde el SKILL" se convierte en "regla movida al nucleo + archivo borrado".

# Flujo recomendado
- [ ] Cargar `crear-skills` (la skill ya existe y tiene forma).
- [ ] Leer la skill objetivo y sus referencias.
- [ ] Clasificar cada regla: verificable/abstracta, hard/soft, posicion (inicio/medio/final).
- [ ] Reescribir anti-patrones como pares mal -> bien -> ejemplo.
- [ ] Colapsar checklists multiples en un unico gate de auto-cita.
- [ ] Marcar gates externos para las reglas criticas o declararlas soft.
- [ ] Validar con `scripts/test_skills.py` y `scripts/validate-hub-skills.ps1`.

# Gate de cierre al rediseñar o auditar una skill

Antes de cerrar, declarar (auto-cita, no auto-evaluacion):

- [ ] Declaro que las reglas criticas estan al INICIO o FINAL del archivo (principio 1).
- [ ] Declaro que cada regla operacional tiene verbo de accion y criterio binario (principio 2).
- [ ] Declaro que las reglas criticas SIN gate externo estan marcadas como soft (principio 3).
- [ ] Declaro el recorte aplicado con su artefacto: que informacion quite, a que archivo de referencia la movi o a que fuente enlace (principio 4).
- [ ] Declaro que cada anti-patron tiene alternativa + micro-ejemplo (principio 5).
- [ ] Declaro que hay UN solo checklist de cierre con auto-cita, no varias listas (principio 6).
- [ ] Declaro que las hard rules usan MUST/NEVER y las soft usan "preferir" (principio 7).

# Criterio de resultado bueno

La skill esta bien endurecida si pasa de "esta escrito" a "se cumple":
- lo critico esta en alta atencion (inicio/final);
- cada regla operacional tiene verbo de accion y criterio binario;
- las reglas criticas tienen gate externo o estan marcadas como soft;
- hay un unico gate de auto-cita, no listas paralelas;
- los anti-patrones tienen alternativa y micro-ejemplo;
- y los validadores del hub (`test_skills.py`, `validate-hub-skills.ps1`) pasan sin warnings.

# Auto-aplicacion (dog food)

Esta skill aplica sus propios 10 principios. Declaracion explicita de cumplimiento:

1. **Atencion en U:** la frontera, los 10 principios y el gate de cierre estan al inicio y final del archivo. El medio contiene el nucleo (los 10 principios); es inevitable y se compensa manteniendo cada principio compacto (principio 4).
2. **Verificable:** cada principio cierra con "Aplicacion" con verbo de accion; el gate de cierre es auto-cita binaria.
3. **Sin gate externo:** las reglas de esta skill se cumplen mejor si un validador del hub o @auditor-cumplimiento las chequea; eso es responsabilidad del ciclo del hub. Declarado soft aqui (la skill enseña, el hub hace cumplir).
4. **Densidad:** la regla es de contenido, no de recuento: se quita lo redundante y lo secundario va a archivo de referencia; las secciones canonicas (Alcance, Inputs, Comportamiento, Flujo, Criterio) se añaden compactas porque el validador del hub las EXIGE como gate (el propio principio 3 prioriza el gate externo sobre la densidad cuando hay conflicto).
5. **Par anti-patron:** la seccion "Anti-patrones de diseno de skills" usa el formato mal -> bien -> ejemplo.
6. **Un solo checklist:** existe un unico "Gate de cierre" con auto-cita.
7. **MUST/NEVER:** se usa "MUST/NEVER/NECESITAN/OBLIGATORIO" para hard rules y "preferir / suele / soft" para blandas.
8. **Test del colega:** cada principio abre con la propiedad cognitiva y cierra con la accion.
9. **Segunda IA:** el principio 9 y el gate de cierre de la skill de dominio (elevar-ui-frontend) convierten @revisor/@qa-validador en obligatorio.
10. **Markdown estructurado:** headers numerados, listas, bloques; sin parrafos densos > 5 lineas.

Exclusion dog-food: el principio 1 no se aplica al 100% porque el contenido principal de esta skill ES la lista de 10 principios (el medio). Se compensa quitando lo redundante de cada principio (principio 4) y repitiendo lo accionable en el gate de cierre (final, alta atencion).

## Triggers
- **Keywords:** cumplir skill, skill ignorada, IA no hace caso, regla blanda, checklist ignorado, perdida en el medio, lost in the middle, auto-cita, enforcement skill, rediseñar skill, regla no se cumple.
- **Patrones de usuario:** "la skill existe pero el modelo no la aplica", "tengo una regla y la IA la ignora", "demasiados checklists y ninguno se cumple", "esta skill no tiene dientes", "como hago que una skill se cumpla de verdad".
- **Encadenamiento:** despues de `crear-skills`; antes de `mantener-cerebro-operativo`; hermana de `documentar-con-criterio` y `validar-calidad`.

# Ejemplos de activacion

"Elevar-ui-frontend tiene buen criterio pero el modelo no lo aplica: rediseñala para que se cumpla."
"Tengo 4 checklists en una skill y ninguno se respeta; unificame el gate de cierre."
