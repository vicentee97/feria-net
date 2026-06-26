---
name: validar-calidad
description: "Aplica una validacion tecnica proporcional al riesgo del cambio: decidir checks minimos, ejecutar o revisar lint, typecheck, build, tests y dejar un estado final claro con riesgo residual. TRIGGERS: validar, calidad, lint, typecheck, build, tests, listo?, validar cambio, esta listo."
---

# Objetivo
Convertir el cierre técnico de una tarea en un proceso sistemático, proporcionado al riesgo y defendible.

La skill debe decidir qué validaciones mínimas son razonables para un cambio concreto, ejecutar o revisar las comprobaciones relevantes, detectar gaps y regresiones obvias, y dejar un estado final claro antes de considerar el trabajo listo.

# Alcance y límites
- Sí define y aplica una validación proporcional al cambio.
- Sí puede ejecutar o revisar checks reales del proyecto.
- Sí debe detectar si faltan validaciones críticas.
- Sí debe evaluar riesgo residual y dejarlo documentado cuando aplique.
- No redefine la estrategia global de testing; usa la que el proyecto ya tenga.
- No sustituye a `configurar-testing`; se apoya en ella.
- No sustituye a `configurar-github`, aunque se integra con el momento previo al cierre y publicación.
- No debe bloquear por dogma cuando el riesgo real sea bajo, pero tampoco debe maquillar validaciones fallidas.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- Arquitectura y estrategia de testing del proyecto, si existen.
- Comandos reales del proyecto.
- Diff o cambios realizados.
- Comportamiento crítico afectado por la tarea.

# Comportamiento esperado
La skill debe empezar inspeccionando el cambio y clasificando su riesgo.

Cuando detecte que el trabajo previo dejó cambios amplios o frágiles, debe favorecer una validación por bloques y señalar si la estrategia de edición fue demasiado masiva para el entorno.

Después debe:
1. Identificar qué validación mínima razonable toca.
2. Localizar comandos y comprobaciones reales del proyecto.
3. Ejecutar o revisar lint, typecheck, build, tests o comprobaciones críticas según corresponda.
4. Interpretar los resultados, no solo listarlos.
5. Concluir si el cambio está `listo`, `bloqueado` o `listo con riesgo residual`.

## Política de validación proporcional al cambio
- Cambios documentales: validación ligera.
- Cambios de UI sin lógica crítica: build, revisión del flujo afectado o checks razonables equivalentes.
- Cambios de lógica, datos, autenticación, pagos, integraciones o comportamiento crítico: elevar nivel de validación.
- Cambios estructurales o de arquitectura: exigir validaciones más amplias.

La validación debe escalar con el riesgo real, no con reflejos automáticos.

Una vez ejecutadas las validaciones proporcionales al riesgo, la skill no debe pedir mas checks indefinidamente. Solo debe ampliar la validacion si aparece una sospecha concreta, una validacion critica no cubierta o un fallo que necesite acotar causa.

## Tipos mínimos de validación a considerar
- Lint.
- Typecheck.
- Build.
- Tests automatizados.
- Comprobación crítica específica del comportamiento afectado.
- Revisión de documentación o SSOT cuando el cambio lo exija.

## Validaciones de configuración
Antes de ejecutar lint o typecheck, verificar que las configs mismas son correctas:
- ESLint: no hay reglas críticas desactivadas innecesariamente (`no-unused-vars`, `react-hooks/exhaustive-deps`, `no-console`).
- TypeScript: `strict` y `noImplicitAny` activados salvo justificación documentada.
- Tailwind: `content` paths coinciden con los directorios reales de código fuente.
- Next.js: CSP, metadata URL y headers correctos.
- `.gitignore`: cubre todos los archivos generados.

Si se detectan misconfiguraciones, reportarlas como hallazgo y referir a `auditar-proyecto-tecnico` para revisión profunda.

## Clasificacion de validaciones
La skill debe separar las comprobaciones en tres niveles:

- `Obligatorias`: protegen el comportamiento afectado o el flujo de publicacion. Si fallan, el estado final es `bloqueado`.
- `Recomendables`: aumentan confianza en zonas cercanas, pero pueden quedar como riesgo residual si no son criticas o no estan disponibles.
- `Opcionales`: cobertura extra, exploracion o mejoras futuras. No bloquean por si solas.

No convertir una validacion opcional en bloqueo salvo que durante la revision aparezca evidencia concreta de riesgo material.

## Fuente de verdad para validar
- Usar primero `docs/SSOT.md`, estrategia de testing, scripts reales y comandos detectados.
- No inventar comandos.
- Si faltan validaciones claras para algo crítico, escalarlo como hueco importante del proyecto.

## Reglas de bloqueo
- Si falla una validación importante, el trabajo no debe considerarse listo.
- Si una validación importante no puede ejecutarse, la skill debe documentar motivo, impacto y riesgo.
- Solo se permite cerrar con riesgo residual cuando el cambio sea de bajo riesgo o la ausencia de validación esté bien acotada.

## Formato de salida
La salida principal debe ser un checklist breve con:
- qué se validó;
- qué no pudo validarse;
- fallos encontrados;
- estado final: `listo`, `bloqueado` o `listo con riesgo residual`;
- siguiente paso recomendado si falta algo.

## Relación con otras skills
- `configurar-testing` define qué estrategia de tests existe.
- `validar-calidad` usa esa estrategia sobre cambios concretos.
- `revisar-cambios` entra antes cuando el usuario pide una revision pre-GitHub de diff, documentacion, TEAMs, TODO, reglas o hallazgos materiales; `validar-calidad` entra despues para ejecutar o interpretar checks.
- `configurar-github` usa este cierre como paso natural antes de considerar el trabajo listo para validación del usuario y eventual publicación.
- `definir-reglas-proyecto` y `docs/SSOT.md` indican comandos y rutas canónicos del proyecto.
- `auditar-proyecto-tecnico` revisa configs en profundidad y verifica que no haya paquetes muertos o redundantes; `validar-calidad` usa esa información como input del cierre pre-publicación.

## Qué mirar además de los comandos
- Riesgo de regresión.
- Cobertura real del comportamiento afectado.
- Documentación desalineada.
- Código muerto o huérfano introducido.
- Validaciones ausentes en zonas críticas.

## Ejemplos operativos
### Cambio solo documental
- Validación ligera.
- Comprobar coherencia documental y ausencia de referencias rotas si aplica.
- Verificar con `documentar-con-criterio` que el cambio no haya añadido ruido, duplicación o detalle operativo innecesario.

### Cambio frontend visual menor
- Build o validación mínima razonable.
- No tratarlo como un cambio crítico de backend si no lo es.

### Cambio de lógica de negocio
- Elevar checks y exigir validación relevante del comportamiento afectado.
- No cerrar si falla la comprobación crítica.

### Cambio de integración externa
- Verificar tests, contratos, fallbacks o checks que protejan la frontera.
- Dejar claro el riesgo si no puede validarse algo importante.

### Refactor estructural sin cambio funcional esperado
- Aumentar validaciones de regresión.
- Revisar que el cambio no haya roto estructura, imports, build o rutas críticas.

# Flujo recomendado
- [ ] Inspeccionar el cambio y clasificar su riesgo.
- [ ] Localizar comandos y validaciones reales del proyecto.
- [ ] Ejecutar o revisar la validación mínima razonable.
- [ ] Interpretar resultados y detectar riesgo residual.
- [ ] Emitir checklist final con estado claro.
- [ ] Registrar en `.teams/` lo validado y lo pendiente cuando aplique.

# Criterio de resultado bueno
La skill está bien aplicada si:
- la validación es proporcionada al cambio;
- detecta fallos relevantes y no los oculta;
- no inventa checks inexistentes;
- deja claro qué se comprobó y qué no;
- y el cierre técnico queda basado en evidencia real, no en impresiones.

## Triggers
- Keywords: validar, calidad, lint, typecheck, build, tests, listo?, validar cambio, esta listo
- Patrones de usuario: "valida la calidad", "esta listo?", "pasa los checks", "valida esto antes de subir", "lint y typecheck"
- Encadenamiento: antes de `configurar-github` o `revisar-cambios` como cierre tecnico

# Ejemplos de activación
"Valida la calidad de este cambio y dime si está realmente listo, qué falta y qué riesgo residual queda."

