---
name: revisar-cambios
description: "Revisa exhaustivamente cambios pendientes antes de subirlos a GitHub: contrasta diff, documentacion, teams, roadmap, reglas y validaciones, emitiendo solo hallazgos materiales sin editar, commitear ni hacer push. TRIGGERS: revisar cambios, antes de subir, revisar diff, pre-push, review, revisar antes de commit."
---

# Revisar Cambios

Skill para actuar como revisor pre-publicacion: entender que cambio realmente el repositorio, contrastarlo con reglas y documentacion, detectar fallos materiales y decidir si el cambio esta listo para que otra skill lo publique.

# Objetivo
- Revisar cambios pendientes antes de `commit`, `push`, PR o subida a GitHub.
- Encontrar bugs, regresiones, riesgos de datos, incumplimientos de reglas del proyecto y drift documental real.
- Evitar el bucle infinito de "siempre hay algo que mejorar" aplicando una puerta estricta de materialidad.
- Entregar un dictamen claro: `listo`, `listo con riesgo residual` o `bloqueado`.
- No editar codigo, no stagear, no commitear, no pushear. Esta skill revisa; `configurar-github` publica.

# Alcance y limites
- Si revisa:
  - codigo, migraciones, scripts, configuracion, frontend, backend, tests y documentacion afectados por el diff;
  - `docs/SSOT.md`, `docs/TODO.md`, `.teams/`, `.questions/`, versionado y reglas locales;
  - consistencia con skills relevantes del dominio del cambio;
  - validaciones ejecutadas o razonablemente necesarias antes de publicar.
- No sustituye a `validar-calidad`: la usa o la invoca conceptualmente para decidir checks proporcionales.
- No sustituye a `configurar-github`: no prepara commits ni sube cambios.
- No sustituye a skills de dominio como `heroui-react`, `gestionar-roadmap` o `documentar-con-criterio`; debe apoyarse en ellas cuando el cambio toque esas areas.
- No debe proponer reescrituras, refactors o mejoras esteticas salvo que haya riesgo material verificable.
- No debe bloquear por "se podria hacer mejor" si el cambio cumple el objetivo, no rompe reglas y el riesgo residual es aceptable.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Actuar Como Senior](../actuar-como-senior/SKILL.md) para profundidad y contraste.
- [Validar Calidad](../validar-calidad/SKILL.md) para checks proporcionales.
- [Documentar Con Criterio](../documentar-con-criterio/SKILL.md) si cambia documentacion.
- [Gestionar Roadmap](../gestionar-roadmap/SKILL.md) si cambia `docs/TODO.md` o equivalentes.
- [Configurar GitHub](../configurar-github/SKILL.md) solo como frontera: esta skill termina antes de publicar.
- `git status`, `git diff`, `git diff --stat` y, si aplica, diff staged/unstaged por separado.
- TEAM activo o mas reciente en `.teams/`, preguntas abiertas relevantes y roadmap local.
- Comandos reales de build/test/lint/versionado definidos por la SSOT o scripts del proyecto.

# Comportamiento esperado

## 1. Modo revisor, no implementador
- No modificar archivos aunque el fallo sea claro.
- No hacer `git add`, `commit`, `push`, tags ni PR.
- Si el usuario pide revisar, la salida debe ser el informe.
- Si despues el usuario pide corregir, entonces se usaran las skills adecuadas de implementacion.

## 2. Reconstruir el cambio real
Antes de opinar:
1. Leer reglas globales, SSOT local y documentacion canonica relevante.
2. Identificar rama actual, estado de Git y lista de archivos modificados/nuevos/borrados.
3. Leer el diff real, no solo nombres de archivos.
4. Leer el TEAM activo o crear mentalmente la trazabilidad si falta.
5. Entender el objetivo declarado del cambio y compararlo con lo que el diff hace realmente.
6. Separar cambios propios del hilo, cambios ajenos previos y artefactos generados.

## 2.1. Trazabilidad obligatoria en TEAM
Todo cambio pendiente debe tener trazabilidad suficiente en `.teams/` cuando afecte a codigo, datos, seguridad, scripts, arquitectura, roadmap, versionado, documentacion canonica o proceso de publicacion.

Durante la revision:
- comprobar que existe un TEAM activo o reciente que justifique el objetivo del diff;
- comprobar que el TEAM explica que se cambio, por que se cambio, que queda pendiente y que validaciones relevantes se ejecutaron o faltan;
- comprobar que el TEAM no contradice el estado real de Git, migraciones, TODO, versionado o CI;
- comprobar que titulos, idioma y nombres cumplen las normas locales del proyecto cuando existan;
- si falta TEAM, esta desactualizado, esta en un idioma no aceptado por el proyecto, o no explica cambios materiales del diff, reportarlo como hallazgo.

Severidad orientativa:
- `P2` si la falta de trazabilidad puede inducir una accion equivocada, por ejemplo aplicar una migracion ya aplicada, publicar sin entender cambios de seguridad/datos, cerrar un TODO sin evidencia o romper una regla operativa.
- `P3` si es una limpieza de trazabilidad acotada que no cambia comportamiento ni puede confundir una operacion critica.

## 3. Puerta de materialidad anti-bucle
Solo reportar un hallazgo si cumple al menos una de estas condiciones:
- Puede causar bug visible, perdida/corrupcion de datos, fallo de seguridad o fallo de despliegue.
- Rompe una regla canonica del proyecto, una skill obligatoria o una ruta/documento que otros flujos consumen.
- Puede hacer fallar CI, build, tests, migraciones, scripts operativos o publicacion.
- Deja documentacion, TEAM, TODO o versionado en un estado que puede inducir una accion equivocada.
- Introduce deuda que no es estetica sino riesgo operativo cercano.

La revision debe distinguir siempre entre:
- `Fallo material`: riesgo real para comportamiento, datos, seguridad, CI, despliegue, trazabilidad o reglas del proyecto. Se reporta como hallazgo y puede bloquear.
- `Mejora significativa`: no rompe el cambio, pero mejora claramente calidad, seguridad, mantenibilidad, operacion o reduce un riesgo futuro cercano con coste razonable. Se puede proponer de forma proactiva, separada de los hallazgos, indicando si conviene hacerla antes de publicar o si puede quedar para despues.
- `Perfeccionismo improductivo`: cambios de gusto, renombres mas bonitos, micro-refactors, alternativas equivalentes o pulido teorico sin beneficio practico claro. No debe mencionarse en una revision pre-GitHub salvo que el usuario pida especificamente pulido, refactor o embellecimiento.

No reportar como finding:
- preferencias personales de estilo;
- alternativas validas con tradeoffs parecidos;
- microoptimizaciones;
- renombres "mas bonitos";
- comentarios o documentacion extra que no cambian una decision;
- mejoras futuras que no bloquean publicar.

Si algo es buena idea pero no bloquea, ponerlo como `Mejora opcional` o `Riesgo residual`, no como fallo.

## 3.1. Anti-perfeccionismo conversacional
No buscar defectos nuevos solo porque el usuario vuelva a preguntar "hay algo mas que mejorar", "estas seguro" o una variante parecida. Si ya se reviso el diff completo y no hay hallazgos materiales nuevos, repetir el dictamen con seguridad y explicar que no han aparecido evidencias nuevas.

La IA debe ser proactiva con mejoras significativas, pero no debe inflar la revision para justificar su existencia. Una mejora significativa solo debe mencionarse si puede explicar de forma concreta por que importa para publicar, mantener, operar, proteger datos/seguridad o reducir riesgo. Si no puede explicar ese valor practico, no debe incluirla.

El objetivo de esta skill no es alcanzar un 100% teorico ni producir una lista infinita de refinamientos. El objetivo es decidir si el cambio es publicable, que riesgos reales quedan y si existe alguna mejora significativa que merezca hacerse antes de publicar.

## 4. Severidad
- `P0`: rompe produccion, pierde datos, expone seguridad critica o impide operar.
- `P1`: bug probable en flujo importante, migracion peligrosa, fuga de datos, CI bloqueado o incoherencia grave.
- `P2`: fallo real pero acotado; debe corregirse antes de publicar si el cambio va a una rama compartida.
- `P3`: limpieza necesaria de proceso/documentacion o riesgo bajo, no siempre bloqueante.

Regla practica:
- P0/P1 bloquean.
- P2 normalmente bloquea si afecta a comportamiento, datos, seguridad, CI o promesas del TODO.
- P3 no bloquea salvo acumulacion que degrade la trazabilidad.

## 5. Profundidad proporcionada
La revision debe ser exhaustiva, pero no infinita.

Minimo para cambios no triviales:
- revisar productores y consumidores directos del cambio;
- revisar configuracion, mapeos, scripts o migraciones relacionados;
- revisar tests existentes o ausencia de tests donde el riesgo lo exija;
- revisar docs canonicas y TEAM si el cambio toca reglas, version, roadmap o operativa;
- ejecutar o recomendar checks reales cuando sean baratos y relevantes.

Freno anti-obsesion:
- No abrir areas remotas sin relacion tecnica clara.
- Tras una segunda pasada sin nuevos P0-P2, cerrar la revision.
- No convertir "esto podria endurecerse aun mas" en otra ronda si el riesgo residual esta explicado.

## 6. Checklist de revision
Aplicar solo las filas que correspondan al diff:

- Codigo: contrato publico, errores, edge cases, concurrencia, transacciones, nullability, validaciones, compatibilidad.
- Datos: migraciones, rutas canonicas, down/up, backups, seguridad de datos, integridad referencial, multi-tenant.
- Seguridad: autenticacion, autorizacion, secretos, logs, CORS, exposicion de errores, rate limits si aplica.
- Frontend: estado, reintentos, accesibilidad basica (`aria-label`, keyboard nav, semantic HTML), errores, layout solo si el diff toca UI. Verificar:
  - No `key={index}` en listas reordenables.
  - No números mágicos sin constante.
  - No hooks duplicados o innecesarios.
  - No `"use client"` en componentes que no lo necesitan.
  - Imports de dependencias que existen en `package.json`.
  - CSS: no clases definidas sin usar.
- Dependencias: paquetes en `package.json` realmente importados, sin librerías redundantes (mismo propósito), versiones consistentes.
- Configuración: `.gitignore` completo, configs sin paths hardcoded, metadata sin placeholders.
- Scripts: parametros, rutas, variables reservadas, idempotencia, mensajes y orden seguro de operaciones.
- Documentacion: SSOT, TODO, TEAM, preguntas abiertas, idioma/titulos, duplicados, promesas que el codigo no cumple.
- Versionado: fuente local de version, db/schema, sync push vs release formal, reglas CI.
- GitHub/CI: checks locales equivalentes, workflows afectados, archivos generados o ignorados.

## 7. Salida obligatoria
La respuesta debe empezar por los hallazgos, como una revision de codigo.

Formato:
1. `Hallazgos`
   - Si hay fallos: listar por severidad, con archivo y linea cuando sea posible.
   - Si no hay fallos materiales: decir claramente `No he encontrado fallos materiales`.
2. `Estado`
   - `bloqueado`, `listo con riesgo residual` o `listo para validar/publicar`.
3. `Explicacion para no tecnicos`
   - Traducir lo importante a lenguaje sencillo si el usuario lo pide o si el tema es delicado.
4. `Validaciones`
   - Que se ejecuto, que paso, que no se pudo ejecutar y por que.
5. `Riesgo residual / mejoras opcionales`
   - Solo lo que no bloquea, sin abrir bucle.

Cuando se use en entornos que soportan comentarios inline de review, emitir findings con el mecanismo local disponible, pero mantener tambien un resumen legible.

## 8. Dictamen final
- `bloqueado`: hay P0/P1 o P2 material que debe corregirse antes de publicar.
- `listo con riesgo residual`: no hay fallos bloqueantes, pero falta una validacion razonable o queda un riesgo explicado.
- `listo para validar/publicar`: no hay fallos materiales y las validaciones razonables pasaron o no aplican.

No decir "todo perfecto". Decir "no he encontrado fallos materiales con la evidencia revisada".

## 9. Relacion con otras skills
- Si hay que corregir: terminar la revision y esperar peticion explicita, o cambiar a la skill de implementacion si el usuario lo pide.
- Si hay que validar mas: usar `validar-calidad`.
- Si hay que subir: usar `configurar-github` despues de la aceptacion del usuario.
- Si el problema es roadmap/documentacion: usar `gestionar-roadmap` o `documentar-con-criterio`.
- Si el cambio es frontend HeroUI: usar `heroui-react` o la skill UI especifica del hub.

# Flujo recomendado
- [ ] Cargar reglas globales, SSOT y skills relacionadas.
- [ ] Identificar rama, diff y archivos pendientes.
- [ ] Leer TEAM/TODO/docs relevantes.
- [ ] Revisar el diff por riesgo, no por gusto.
- [ ] Contrastar consumidores, migraciones, scripts y tests cercanos.
- [ ] Ejecutar checks proporcionales si procede.
- [ ] Emitir solo hallazgos materiales.
- [ ] Cerrar con dictamen finito y sin publicar.

# Criterio de resultado bueno
- La revision encuentra riesgos reales sin inventar trabajo.
- Puede decir "no hay hallazgos materiales" sin sentirse obligada a criticar algo.
- Distingue fallo bloqueante, riesgo residual y mejora opcional.
- Explica los hallazgos de forma entendible para una persona no tecnica cuando hace falta.
- No edita ni sube cambios.
- Deja el siguiente paso claro: corregir, validar mas o pasar a `configurar-github`.

## Triggers
- Keywords: revisar cambios, antes de subir, revisar diff, pre-push, review, revisar antes de commit
- Patrones de usuario: "revisa los cambios antes de subir", "haz una review", "esta listo para publicar?", "revisa el diff"
- Encadenamiento: antes de `configurar-github`, despues de implementar cambios

# Ejemplos de activacion
- "Revisa los cambios pendientes antes de subirlos a GitHub."
- "Actua como revisor exhaustivo: dime si esto esta listo o si hay fallos reales."
- "Otra IA ha hecho cambios; revisa TODO, TEAM, documentacion y codigo antes de publicar."
- "Haz una review pre-push, pero no edites ni subas nada."
