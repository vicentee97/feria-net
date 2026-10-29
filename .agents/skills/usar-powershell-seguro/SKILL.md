---
name: usar-powershell-seguro
description: "Usar al escribir o ejecutar un comando PowerShell, un guion (.ps1, .bat, .mjs, .py) o una operacion sobre evidencia (comprimir, mover, comparar): target absoluto comprobado, simulacion antes del impacto, cotas de bucle y procesos, ejecutable disponible con salida comprobada y cero borrados en cascada. TRIGGERS: powershell, pwsh, ps1, script, guion, comando, Remove-Item, rm -rf, junction, bucle, spawn, proceso node, limpia carpetas, ejecuta esto, comprimir, descomprimir, evidencia, hash."
---

# Usar PowerShell Seguro

Contrato para que la IA escriba y ejecute guiones y comandos en el equipo como lo haria un ingeniero senior: el guion nunca es el que sorprende. Nace de incidentes reales de este entorno, no de teoria.

## Frontera (leer primero)
- Esta skill cubre la DISCIPLINA de escribir y ejecutar cualquier comando o guion, incluido el que "solo es una prueba".
- `ejecutar-operaciones-sensibles` cubre el gate de la OPERACION DESTRUCTIVA puntual (borrar, drop, reset, force push). Si el comando destruye datos, reescribe Git o toca fuera del workspace, se carga ADEMAS esa skill; esta no la sustituye.
- `configurar-entorno` documenta el entorno; esta skill decide COMO ejecutar sin destrozarlo.
- `generar-bat-interactivo` crea el .bat interactivo concreto; esta skill pone las guardas dentro.
- No convierte la autonomia en temeridad ni pide permiso de mas: obliga a evidencia y cotas para poder seguir ejecutando sin ventanas de aprobacion.

## Incidentes que dictan las reglas

| Fecha | Que paso | Reglas que nacen |
|---|---|---|
| 2026-09-11 | Una sonda de limpieza se lanzo con el hogar real como destino | R1: target absoluto y raices prohibidas |
| 2026-09-12 | Se perdieron TODAS las conversaciones: borrado sin copia previa | R7: copia verificada antes de lo irreversible |
| 2026-09-15 | Un borrado recursivo siguio un junction y se llevo 239 paquetes del harness | R2 y R3: enlaces |
| 2026-09-15 | Un guion se relanzaba a si mismo: miles de procesos node y 1.666 carpetas | R4 y R5: cotas y guarda de trabajador |

Auditoria de una ejecucion real (proyecto Portfolio): un hijo ejecuto `gzip -k -f` para comprimir trazas, gzip no existia en Windows, la orden no dio error visible y se retiraron nueve originales; se perdieron cuatro baselines. Nacen R9, R10 y R11: ejecutable disponible, salida comprobada y evidencia conservada.

# Objetivo
- Que cualquier comando o guion lanzado por la IA tenga target comprobado, alcance acotado, cota de repeticion y salida leida.
- Que los guiones que la IA escribe traigan las guardas DENTRO, sin confiar en que el operador las aplicara despues.
- Mantener la ejecucion autonoma sin aprobacion, pero sin borrados en cascada, procesos desbocados ni carpetas en bucle.

# Alcance y limites
- Aplica a PowerShell/pwsh y a cualquier guion o comando que cree, mueva, borre, instale o lance procesos en el equipo real (ps1, bat, cmd, node/mjs, python, npm/pnpm, git por guion).
- Windows primero: los ejemplos citan cmdlets y rutas de este equipo; el criterio es portable a bash.
- No cubre SQL ni publicacion Git como dominio (eso lo acota `ejecutar-operaciones-sensibles`) ni documenta el entorno (`configurar-entorno`).
- En el proyecto `dsh-plugins`, las rutas protegidas de `docs/REGLAS_PROYECTO.md` mandan sobre esta skill; alli se enlazan, nunca se copian.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) y [reglas globales](../docs/AI_GLOBAL_RULES.md).
- Objetivo del guion en una linea y como se sabe que salio bien.
- Ruta absoluta de destino y que tipo de operacion toca (crea, sobreescribe, borra, lanza procesos).
- Plantillas listas para copiar: [referencia-patrones.md](referencia-patrones.md).
- Si el proyecto tiene guardas propias (p. ej. `tools/probe-guard.mjs` en dsh-plugins), usarlas antes que improvisar una equivalente.

# Comportamiento esperado

## Reglas duras (MUST/NEVER)

**R1. Target absoluto y raices prohibidas.** MUST resolver el destino a ruta absoluta ANTES de ejecutar; NEVER apuntar limpiezas, borrados o escrituras masivas a la carpeta del usuario, a una raiz de disco, al hogar real de DSH (`~/.dsh`), a `~/dsh-copias`, a la instalacion del harness (`%APPDATA%\npm\node_modules\@deepseek-ai`) o a la raiz del repositorio. El matching de raices de disco es por IGUALDAD (no prefijo) y case-insensitive. Mal: `Remove-Item "$dest\*"` con `$dest` sin resolver. Bien: resolver con `[IO.Path]::GetFullPath`, comparar contra la lista de raices prohibidas y abortar con `throw` si coincide.

**R2. Enlaces antes de borrar.** MUST, antes de un borrado o movimiento recursivo, detectar reparse points dentro del arbol (`Get-ChildItem -LiteralPath $dest -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }`). Si hay alguno, NEVER borrar: parar, listarlos y avisar. Un junction no se borra: el borrado sigue el enlace y se lleva lo de enfrente.

**R3. Enlaces nuevos prohibidos en zonas borrables.** NEVER crear junction, symlink, `mklink` o `New-Item -ItemType Junction/SymbolicLink` dentro de una carpeta que algo pueda borrar despues (copias, worktrees, temporales).

**R4. Cota de bucle escrita.** MUST acotar todo bucle que cree, mueva o borre con una lista fija de items o un contador maximo declarado en el codigo. NEVER `while ($true)` sin salida por condicion externa, ni recursion sin limite, ni confiar en "el bucle para solo".

**R5. Guarda de trabajador y tope de procesos.** MUST en todo guion que lance procesos: comprobar lo primero si ya es un trabajador (marca de entorno) y no relanzarse, declarar un tope maximo de procesos simultaneos y retirar los hijos si algo falla. Antes de lanzarlo, declarar cuantos procesos puede llegar a abrir.

**R6. Simulacion antes del impacto.** MUST hacer un primer pase de simulacion cuando el guion escribe o borra: `-WhatIf` en cmdlets con `SupportsShouldProcess`, o un modo dry-run que SOLO liste los targets. El pase real se lanza solo tras leer la simulacion.

**R7. Copia antes de lo irremplazable.** MUST copia verificada previa antes de escribir o borrar sobre rutas protegidas o contenido irremplazable (en dsh-plugins: `node tools/copias.mjs copiar --motivo "..."`).

**R8. Leer, verificar, reportar.** MUST leer la salida de cada comando antes de lanzar el siguiente, verificar el efecto esperado (existe lo creado, no existe lo borrado) y cerrar reportando: que se toco, comprobacion previa, resultado y como se revierte.

**R9. Ejecutable disponible y salida comprobada.** MUST, antes de usar un ejecutable externo (gzip, 7z, ffmpeg, node, curl), comprobar que existe en la shell efectiva (`Get-Command <exe> -ErrorAction SilentlyContinue` o `command -v <exe>`) y que el comando termino con codigo de salida 0. NEVER asumir que `$ErrorActionPreference = 'Stop'` detiene un ejecutable nativo que falla: ese fallo no lanza excepcion de PowerShell y la orden sigue como si hubiera ido bien. MUST comprobar tambien que la salida esperada existe (fichero creado, tamano mayor que cero, formato legible). Si el ejecutable no esta, el resultado es "no verificable": NEVER instalar otra dependencia por reflejo y NEVER tocar el original.

**R10. Evidencia conservada: el original no se retira sin hash.** MUST, antes de retirar un original (comprimir, mover, convertir o normalizar): crear la salida, comprobar que existe, leerla de vuelta (descomprimir o abrir) y comprobar que su hash coincide con el del original. Solo con las tres comprobaciones en verde se retira el original. Si alguna falla, el original queda INTACTO y el estado es FALLIDO y reportado. NEVER sustituir un original por un resumen, una captura o una traza posterior: un resumen no es la evidencia.

**R11. Baseline inmutable hasta cerrar la comparacion.** MUST tratar toda baseline (medicion inicial, captura de referencia, traza previa) como evidencia inmutable hasta que la comparacion cierre. NEVER recrearla desde el estado posterior: una baseline recreada ya no prueba el antes. Si se perdio, declarar "comparacion no verificable" y reportar la perdida; NEVER reconstruirla ni estimarla.

## Preferencias (soft)
- Preferir un guion unico y revisable antes que encadenar one-liners largos con `;`.
- Preferir listas explicitas de rutas antes que comodines anchos (`*`, `*.*`) en operaciones de escritura.
- Preferir `Join-Path` y `Resolve-Path` antes que concatenar strings para construir rutas.
- Preferir guardar el guion en archivo y ejecutarlo, antes que pegar veinte lineas imposibles de revisar en un solo comando.

## Rationalization: pensamientos que no valen como permiso

| Pensamiento | Realidad |
|---|---|
| "Es solo un script de prueba" | La sonda del 2026-09-11 tambien lo era. Prueba = mismas R1 a R8 con alcance mas pequeno. |
| "El bucle para solo cuando termine" | Sin cota escrita no hay "solo". R4: lista fija o contador. |
| "Pongo -Force -Recurse por si acaso" | "Por si acaso" es el mecanismo exacto del incidente del 2026-09-15. Force no es comprobacion. |
| "Ya lo he verificado de memoria" | De memoria no se verifica. R8: leer la salida real. |
| "Es rapidisimo, lanzo y ya" | La velocidad no es argumento cuando el fallo es irreversible. |
| "gzip no existe, pero la orden no dio error" | Un ejecutable ausente no lanza excepcion de PowerShell. R9: comprobar disponibilidad y codigo de salida antes de creer el resultado. |
| "Comprimo y borro los originales para no acumular" | Sin salida creada, lectura de vuelta y hash identico no se retira nada (R10). El espacio no es argumento. |
| "Rehago la baseline con el estado actual" | Una baseline recreada no prueba el antes: la comparacion queda "no verificable" (R11). |

# Flujo recomendado
- [ ] Escribir el objetivo del guion en una linea y como se verificara el resultado.
- [ ] Resolver el target absoluto y comprobarlo contra las raices prohibidas (R1).
- [ ] Leer el arbol afectado: reparse points, numero de items, tamano (R2).
- [ ] Escribir el guion CON guardas dentro: cota de bucle (R4), guarda de trabajador y tope de procesos (R5), `-WhatIf` o dry-run (R6).
- [ ] Copia previa si la ruta es protegida o irremplazable (R7).
- [ ] Simular, leer la simulacion y lanzar el pase real.
- [ ] Verificar el efecto real y reportar que se toco y como se revierte (R8).

## Iron Law

NO EJECUTO UN GUION QUE ESCRIBA, BORRE O LANCE PROCESOS SIN TARGET ABSOLUTO COMPROBADO, COTA ESCRITA DE BUCLE Y DE PROCESOS, Y VERIFICACION DE LA SALIDA REAL. UN GUION SIN GUARDAS NO ES AUTOMATIZACION: ES UN INCIDENTE EN ESPERA. NO RETIRO UN ORIGINAL NI RECREO UNA BASELINE SIN SALIDA CREADA, LECTURA DE VUELTA Y HASH IDENTICO (R9 A R11).

**Consecuencia si se incumple:** junctions que arrastran borrados ajenos, bucles que fabrican miles de carpetas y procesos que dejan el ordenador a rastras; y evidencia perdida, que es lo que no se puede volver a medir. Los tres primeros fallos ya ocurrieron aqui; las reglas R1 a R8 son su traduccion directa, y R9 a R11 nacen de la auditoria Portfolio.

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] Declaro el target absoluto usado y que NO coincide con las raices prohibidas (R1).
- [ ] Declaro el resultado del chequeo de reparse points si hubo borrado o movimiento recursivo (R2).
- [ ] Declaro la cota de bucle (lista fija o contador) y el tope de procesos del guion (R4, R5).
- [ ] Declaro que la simulacion se leyo antes del pase real, o que no aplicaba y por que (R6).
- [ ] Declaro la copia previa en rutas protegidas, o que no habia rutas protegidas implicadas (R7).
- [ ] Declaro que lei la salida real y verifique el efecto esperado (R8).
- [ ] Declaro la evidencia conservada: ejecutable disponible, salida creada, lectura de vuelta y hash identico antes de retirar cualquier original, o que no se retiro ninguno (R9 a R11).

## Triggers
- **Keywords:** powershell, pwsh, ps1, bat, cmd, script, guion, comando, terminal, Remove-Item, rm -rf, del, mklink, junction, symlink, bucle, foreach, while, spawn, child_process, proceso node, limpia carpetas, crea carpetas, automatiza, ejecuta esto, corre el script, dry-run, WhatIf, comprimir, descomprimir, gzip, hash, baseline, evidencia, originales, LASTEXITCODE
- **Patrones de usuario:** "ejecuta este comando", "escribe un script que limpie", "automatiza esta tarea", "crea las carpetas", "lanza el proceso en segundo plano", "haz un script que borre lo que sobre"
- **Encadenamiento:** cargar ADEMAS `ejecutar-operaciones-sensibles` cuando el guion destruye datos, reescribe Git o toca fuera del workspace; `crear-plugins-dsh` cuando el guion pertenece a un plugin de DSH (sus guiones llevan ademas guarda de trabajador propia del plugin); `generar-bat-interactivo` cuando el entregable es un .bat interactivo; `configurar-entorno` para documentar el entorno que el guion modifica.

# Ejemplos de activacion
- "Haz un script que borre las carpetas temporales que sobran."
- "Ejecuta este comando de PowerShell en el proyecto."
- "Automatiza la creacion de las carpetas de la semana en bucle."
- "Lanza ese proceso node y que se relance si muere."
