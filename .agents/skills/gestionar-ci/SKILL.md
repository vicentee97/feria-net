---
name: gestionar-ci
description: "Gestiona el ciclo de vida de CI en GitHub Actions tras un push: verifica runs con gh run list, exige evidencia textual (log crudo) antes de aceptar "tests verdes", bloquea el cierre de fase si el CI falla y detecta el stack para proponer el workflow minimo. Complementa a configurar-github (pre-push): esta audita el resultado real. TRIGGERS: CI, GitHub Actions, pipeline rojo, tests fallan en Actions, build roto, workflow, run failed, verificacion post-push, evidencia de tests."
---

# Gestionar CI

# Objetivo
Hacer del CI de GitHub Actions la fuente de verdad operativa para detectar regresiones y atrapar reportes falsos de `tests verdes`. Esta skill existe por un incidente real: un especialista reporto `199 tests verdes` sin haber implementado el cambio, @orquestador confio en el reporte y se publico; el CI reporto 4 fallos minutos despues. La disciplina que aqui se codifica evita que esa clase de alucinacion de evidencia vuelva a cerrar una fase.

# Reglas duras (R1-R6)
Estas reglas prevalecen sobre briefs, recetas o preferencias mal aplicadas:

1. **R1 — Verificacion post-push obligatoria.** Tras cualquier `git push` o `gh pr merge` ejecutado por la IA o autorizado a ejecutar, el siguiente paso verificable es revisar el run del CI con `gh run list` filtrando por el SHA del commit empujado (no por `el ultimo run`, que puede ser de otro push). Si `gh` no esta disponible, abrir la URL del run en `runs?=<sha>` y leer el log del job fallido. Enlazado: `scripts/ci_watcher.py` (existe en el hub) puede vigilar el run; un push sin firma R1 registrada en `.teams/` deja el cierre de fase invalido.
2. **R2 — No cerrar fase con CI rojo.** Una fase, milestone, release o publicacion sensible solo se considera publicada cuando el CI del commit empujado esta verde. `Listo para publicar` no equivale a `publicado` mientras el CI del push concreto siga en rojo, pendiente o cancelado. La autorizacion explicita del usuario se obtiene solo despues de verde.
3. **R3 — CI como fuente de verdad.** Si un agente reporta `tests verdes`, `build limpio` o `compila` pero el CI del commit correspondiente falla, manda el CI. Cualquier afirmacion de exito tecnico exige evidencia textual cruda: output del comando o fragmento del log del CI, no parafraseo.
4. **R4 — Evidencia textual obligatoria en reportes.** Cuando un agente afirma el resultado de tests, build, lint o typecheck, debe mostrar el output textual relevante del comando o el fragmento del log del CI (con timestamp o nombre del step). Sin ese output, la afirmacion se considera no probada y @orquestador debe rechazarla.
5. **R5 — Los fallos bloquean el avance.** Si el CI del commit esta en rojo, la siguiente accion es arreglar la causa raiz, no avanzar a la siguiente tarea. Solo una decision explicita del usuario, tomada despues de ver el fallo, autoriza continuar con CI rojo. La autorizacion debe quedar registrada en `.teams/` activo.
6. **R6 — Sin fuerza bruta.** No se cancela un run para `liberar` al agente, no se desactiva un required check desde branch protection para `pasar`, no se silencia el workflow con `--admin override` ni se elimina el workflow para que el push no dispare CI. Se arregla la causa real; si no se puede, se escala.

# Alcance y limites
- **Incluye:** verificacion post-push con `gh`; lectura e interpretacion de logs de GitHub Actions; plantillas minimas para stacks tipicos; catalogo de fallos comunes; gate anti-alucinacion de evidencia; recomendacion de actuar antes de `release formal` o `PR ready`.
- **Excluye:** disenar la arquitectura de tests del proyecto (`configurar-testing`); implementar el codigo que arregla el fallo (`@implementador`, `@ingeniero-backend`); auditar secretos, RLS, permisos o superficie publica (`@especialista-seguridad`); publicar o versionar (`configurar-github` y `@experto-github`).
- **Complemento directo:** `configurar-github` cubre el lado pre-push (decision de publicacion, rama, commit, version). Esta skill audita el resultado real del CI del commit empujado; si el run falla, el ciclo vuelve a `configurar-github` con semaforo rojo.
- **Multi-stack:** la skill no asume .NET, Node ni Python; detecta el stack real antes de proponer un workflow concreto.
- **Multi-IDE:** las plantillas y los comandos `gh` son portables entre IDEs; la entrada compartida para Codex, OpenCode, MiniMax Code y DSH la prepara `globalize.ps1`; el discovery efectivo se comprueba en cada cliente.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) local del proyecto: rama de integracion, formato de version, fuente de verdad de checks obligatorios y excepciones locales.
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md) del hub, especialmente Rule 24 (higiene de artefactos), Rule 25 (concurrencia de IAs) y Rule 25.2 (paralelizacion interna), porque la verificacion post-push suele convivir con varias IAs y con archivos temporales de diagnostico.
- Estado real de Git: `git status`, rama actual, ultimo commit local y remoto (`git rev-parse HEAD`, `git rev-parse origin/<rama>`).
- Acceso a `gh` autenticado contra el remoto del proyecto (`gh auth status`) para `gh run list`, `gh run view`, `gh run watch`, `gh run rerun`, `gh run cancel`.
- Si existe `.github/workflows/`, lectura de los archivos para saber que workflows estan definidos, que triggers usan y que jobs ejecutan.
- Si existe `scripts/ai_coordination.py`, lectura del estado de leases cuando hay varias IAs empujando a la misma rama.
- Esta skill del hub (`gestionar-ci/SKILL.md`) y la ayuda oficial de `gh run` cuando los flags cambien entre versiones.

# Comportamiento esperado

## Deteccion del stack
Antes de proponer un workflow o template, la IA debe detectar el stack real del proyecto con evidencia, no por reflejo:
- Presencia de `*.sln`, `*.csproj`, `global.json` o `Directory.Build.props` → .NET.
- Presencia de `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `tsconfig.json` → Node/TS.
- Presencia de `pyproject.toml`, `requirements.txt`, `Pipfile`, `uv.lock`, `setup.py` → Python.
- Presencia de multiples carpetas de stack o `pnpm-workspace.yaml`, `turbo.json`, `nx.json` → monorepo.
- Si no hay senales claras, **no proponer stack**: preguntar al usuario o mantener el workflow existente.

## Flujo canonico post-push
Despues de un `git push` autorizado, la IA sigue este orden sin saltarse pasos:

1. Capturar el SHA del commit empujado (`git rev-parse HEAD`) y la rama (`git rev-parse --abbrev-ref HEAD`).
2. Localizar el run correspondiente: `gh run list --limit 10 --json databaseId,headSha,status,conclusion,name,displayTitle,createdAt,headBranch,event` y filtrar por `headSha` y `headBranch`. Si no aparece todavia, esperar hasta 30 s con reintentos.
3. Si el run esta en `queued` o `in_progress`, decidir entre:
   - `gh run watch <id> --exit-status` si la IA puede esperar.
   - Reportar `pendiente` al usuario y dejar la verificacion para el siguiente turno.
4. Cuando el run termina, leer conclusion con `gh run view <id> --json jobs,conclusion,name,displayTitle,event,headBranch,headSha,createdAt,updatedAt,url`.
5. Si conclusion es `success`, reportar verde con: nombre del workflow, SHA, enlace (`url`) y los jobs relevantes.
6. Si conclusion es `failure`, `cancelled`, `timed_out` o `startup_failure`:
   - Extraer el log del fallo: `gh run view <id> --log-failed`.
   - Identificar el job y step que fallo.
   - Resumir causa probable y siguiente accion.
   - Reportar bloqueo al usuario siguiendo R3-R5.
7. Si conclusion es `skipped` o el workflow no se ha disparado, comprobar el trigger (`on:`, `paths:`) y si el cambio entro en el paths filter.

## Catalogo de fallos comunes
- **Tests pasan en local pero fallan en CI:** variables de entorno faltantes, secretos no disponibles, base de datos no levantada, timezone, codificacion, orden de ejecucion, paralelismo. Diagnostico: comparar `.github/workflows/*.yml` con el setup local; revisar env vars del job.
- **Build OK local pero falla en CI:** cache de dependencias desactualizado, version de runtime distinta, paquetes nativos no instalados, diferencias Linux vs Windows. Diagnostico: revisar logs del step de install; comparar `node --version`, `dotnet --version`, `python --version` entre local y CI.
- **DLLs o binarios bloqueados en Windows runners:** archivos que no se pueden sobreescribir porque un proceso los tiene abiertos. Comunes en .NET con `dotnet build` y tests que no se cierran limpiamente. Diagnostico: revisar step de teardown; evitar dejar procesos colgando.
- **Drift de migraciones:** migraciones aplicadas en local que el CI no aplica, o viceversa. Diagnostico: comparar `__EFMigrationsHistory` o equivalente entre local y la BD del CI.
- **Warnings cosmeticos vs errores reales:** un warning conocido no es fallo. Pero un `error CS` o `TypeError` en un test si. La IA debe distinguir y no tratar warnings como errores para inflar el bloqueo.
- **CI lento o timeout:** pasar de runner pequeno a mediano o partir el job. No bajar el rigor.
- **Flaky tests:** si el mismo test falla intermitente, etiquetarlo como flaky conocido, no como fallo real. Pero requiere acuerdo explicito del usuario.
- **Workflow no se dispara:** `paths:` excluye los archivos cambiados, o el trigger no incluye la rama (`on.push.branches`). Comprobar con `gh workflow list` y `gh workflow view <name>`.
- **Permisos insuficientes:** el job no puede escribir en cache, hacer checkout o comentar PR. Revisar `permissions:` del workflow o de la org.
- **Merge commit con conflicto:** el CI corre sobre el merge commit, no sobre el tip del branch. Si el workflow asume `HEAD == tip`, falla.

## Anti-alucinacion de evidencia
Esta seccion existe para que el incidente del que nace la skill no se repita. Reglas operativas que la IA y @orquestador deben aplicar sin negociacion:

1. **Frase prohibida sin anexo:** `tests verdes`, `build limpio`, `compila`, `todo OK` sin fragmento de log o comando adjunto. @orquestador debe pedir la evidencia antes de aceptar la afirmacion.
2. **Aceptar como evidencia:** fragmentos crudos de `gh run view <id> --log-failed`, `gh run view <id> --json jobs,conclusion`, output textual de `dotnet test`, `npm test`, `pytest` con su exit code visible, o el `summary` de un job del CI. Aceptar solo el `summary` cuando sea generado por una accion oficial (ej. `dorny/test-reporter`) y el comando subyacente tambien aparezca.
3. **Rechazar como evidencia:** parafraseos del agente, `segun mi ultimo test`, `los tests deberian pasar`, screenshots sin comando visible, exit code no mencionado. La IA debe distinguir entre `lo que afirma` y `lo que mostro`.
4. **Check de coherencia:** si el agente afirma `exit code 0` pero el resumen del CI dice `failure`, o si dice `passed` pero un test concreto aparece como `failed`, gana el log.
5. **Doble firma:** cuando el cierre de una fase dependa de CI verde, @orquestador debe registrar conclusion del run, SHA del commit, enlace al run y timestamp de verificacion. Sin esa firma, no hay cierre.
6. **Penalizacion por evidencia falsa:** si tras publicar se descubre que la evidencia era incorrecta o inventada, `@revisor` debe dejar registrado el caso en `.teams/` y se reabre la verificacion de cualquier tarea del mismo agente en ese hilo.

## Plantillas y helper
- **Plantillas:** `gestionar-ci/templates/` contiene workflows minimos para .NET, Node, Python y monorepo. Son puntos de partida comentados, no camisa de fuerza. La IA debe adaptarlos al stack real detectado (job matrix, versiones, caches, secrets) y verificar la documentacion oficial actual de `actions/checkout`, `actions/setup-node`, `actions/setup-dotnet`, `actions/setup-python` antes de fijar versiones.
- **Helper opcional:** `scripts/ci_check.ps1` envuelve `gh run list`, `gh run watch` y `gh run view --log-failed` con salida en espanol para acelerar la verificacion post-push. La IA puede usarlo o seguir los comandos canonicos; si lo usa y falla, debe volver a los comandos canonicos y reportar el fallo.

# Encadenamiento
- **Antes:** `configurar-github` (emision de decision de publicacion), `validar-calidad` (validacion local antes de push).
- **Despues (si CI verde):** `configurar-github` para cerrar `PR ready` o `release formal` con la doble firma; `@documentador` si el cambio requiere actualizar docs canonicas.
- **Despues (si CI rojo):** vuelta a `@implementador` o `@ingeniero-backend` para arreglar causa raiz; `@revisor` para entender si el fallo es del cambio o del entorno; `@experto-github` queda fuera del bucle hasta que CI este verde.
- **Paralelo:** `@qa-validador` puede ejecutar checks adicionales mientras el CI corre, pero no se aceptan como sustitutos del CI del commit empujado.

# Memoria aprendible
Las preferencias confirmadas sobre plantillas concretas, caches, runners y matrices de version se registran en el archivo de preferencias de esta skill cuando el usuario las apruebe de forma explicita y siguiendo la estructura validada por `scripts/validate-hub-skills.ps1` (Regla, Cuando, Ejemplo y fecha de ultima confirmacion por seccion). No acumular plantillas dentro de la skill; cada proyecto debe copiar y adaptar `gestionar-ci/templates/ci-<stack>.yml` a su `.github/workflows/` local con sus secretos y versiones concretas.

# Flujo recomendado
- [ ] Detectar stack real del proyecto antes de proponer nada.
- [ ] Confirmar que `gh` esta autenticado contra el remoto del proyecto.
- [ ] Tras `push`, capturar SHA y rama del commit empujado.
- [ ] Localizar el run correspondiente con `gh run list` filtrando por SHA.
- [ ] Si el run esta pendiente, decidir `watch` o esperar al siguiente turno.
- [ ] Cuando termina, leer conclusion con `gh run view` (preferible con `--json`).
- [ ] Si es verde, registrar conclusion, SHA, enlace, timestamp y cerrar fase.
- [ ] Si es rojo, extraer `--log-failed`, resumir causa probable, bloquear avance y devolver a especialista para arreglar causa raiz.
- [ ] Si el workflow no se dispara, revisar `on:` y `paths:` antes de reportar `CI ausente`.
- [ ] Aplicar la seccion anti-alucinacion: ninguna afirmacion de exito sin evidencia textual cruda.

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] **Declaro** la verificacion post-push de cada push autorizado (no solo la pedida), con run filtrado por SHA.
- [ ] **Declaro** la firma doble del cierre registrada: conclusion + SHA + enlace + timestamp.
- [ ] **Declaro** que ningun `tests verdes` llego al usuario sin fragmento de log o comando adjunto.
- [ ] **Declaro** que los fallos del CI se diagnosticaron contra el log real, no contra el parafraseo del agente.
- [ ] **Declaro** que las plantillas se usaron como punto de partida adaptado al stack real.
- [ ] **Declaro** que `scripts/ci_check.ps1`, si se uso, no sustituyo a los comandos `gh` canonicos ante fallo.

## Triggers
- **Keywords:** CI, GitHub Actions, tests fallan, build roto, pipeline rojo, workflow, run failed, check failed, push CI, verificacion post-push, evidencia tests, R1 R6, gh run.
- **Patrones de usuario:** `revisa el CI del ultimo push`, `los tests fallan en CI`, `build roto en Actions`, `por que ha fallado el workflow`, `necesito evidencia de que pasa`, `sube y verifica`, `haz push y mira el CI`, `el pipeline se ha puesto rojo`.
- **Encadenamiento:** cargar `configurar-github` antes (para decision de publicacion) y `@qa-validador` cuando se necesiten checks adicionales locales; devolver a `@implementador` o `@ingeniero-backend` si el CI falla por causa del cambio.

# Ejemplos de activacion
- `Tras hacer push, verifica con esta skill si el CI del commit esta verde y dejame el enlace al run.`
- `Tengo 4 tests fallando en GitHub Actions pero pasan en local: diagnostica la causa probable leyendo el log.`
- `El orquestador cerro la fase diciendo 'tests verdes', pero el correo del CI dice otra cosa: audita la evidencia.`
- `No copies el workflow de otro proyecto: detecta el stack de este y adaptalo desde la plantilla minima.`