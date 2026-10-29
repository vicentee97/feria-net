---
name: auditar-proyecto-tecnico
description: "Usar cuando el proyecto muestre errores de build, configs inconsistentes, dependencias dudosas o paquetes sin usar: AUDITA y REPORTA con evidencia (no modifica; las acciones las ejecutan @implementador o @ingeniero-backend bajo brief). TRIGGERS: auditar config, auditar dependencias, verificar configuracion, config correcta, tailwind config, eslint config, tsconfig, next config, paquetes sin usar, limpiar package.json, dependency audit."
---

# Auditar Proyecto Tecnico

# Objetivo

Auditar la salud tecnica del proyecto detectando misconfiguraciones, settings obsoletos, paths rotos y dependencias muertas, redundantes o desactualizadas, **reportando hallazgos con evidencia concreta** antes de que cualquier agente ejecutor proponga o aplique cambios.

# Frontera de la skill: REPORTA, no toca (LEER PRIMERO)

Esta skill es de auditoria, no de ejecucion. La frontera es estricta y debe leerse antes de cualquier paso:

- **REPORTA** hallazgos con evidencia: configs rotas, paquetes candidatos a eliminacion, redundancias, settings incoherentes.
- **NEVER** modifica configs. **NEVER** elimina paquetes. **NEVER** ejecuta acciones destructivas (`npm uninstall`, `npm audit fix`, upgrades, ediciones de config) por iniciativa propia.
- Las acciones reales las ejecutan **@implementador** o **@ingeniero-backend** bajo brief explicito del usuario o de @orquestador, con su propio gate de validacion.
- Si el brief autoriza acciones concretas, la skill puede **recomendar** el comando exacto, pero la ejecucion la hace el agente ejecutor.
- Excepcion: typecheck, build y lint son comandos de verificacion no destructivos. La skill los ejecuta como parte del gate obligatorio MUST.

Razon: una auditoria que destruye pierde su utilidad como checkpoint neutral. El nombre "auditar" describe reportar evidencia, no intervenir.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Borrar por limpieza:** MAL eliminar un paquete porque no hay `import` estatico evidente. BIEN grep contra los 4 casos trampa (ver abajo) antes de marcar como candidato. EJEMPLO `@types/node` no se importa pero rompe tipos de `process.env`.
- **Defaults genericos:** MAL activar `reactStrictMode: true` o `darkMode: 'class'` por memoria. BIEN contrastar cada setting con el config real y la estructura del proyecto. EJEMPLO no asumir `content: ['./src/**/*']` si el proyecto usa App Router con `./app/**/*`.
- **Marcar sin evidencia:** MAL reportar "hay paquetes sin usar" sin haber grep'eado. BIEN cada hallazgo cita el comando ejecutado y su resultado. EJEMPLO "paquete X: 0 resultados en `rg 'from \"...'X' src/`, 0 en configs raiz".
- **Intervenir destruyendo:** MAL ejecutar `npm audit fix`, `npm uninstall` o upgrades masivos por iniciativa propia. BIEN reportar candidatos con evidencia y dejar la ejecucion a @implementador/@ingeniero-backend bajo brief. EJEMPLO reporte "paquete Y candidato a eliminacion; `npm uninstall Y` + typecheck lo ejecuta @implementador".
- **Asumir transitive sin verificar:** MAL marcar como eliminable un paquete que es dependencia transitive de otro directo. BIEN verificar el arbol con `npm ls <paquete>` antes de proponer eliminacion. EJEMPLO `ts-node` puede estar requerido por tooling de tipos aunque no haya imports en `src/`.
- **Cambio de config por reflejo:** MAL anadir regla ESLint, plugin PostCSS o path Tailwind "estandar" sin contrastar. BIEN contrastar cada cambio con el config real y la estructura del proyecto. EJEMPLO no anadir `darkMode: 'class'` sin leer el bloque `@theme`/`darkMode` real.

## Verificacion de uso: los 4 casos trampa

Antes de marcar cualquier paquete como "no usado", grep contra los 4 casos trampa. Un solo caso positivo descarta la eliminacion. El metodo grep es lo mas valioso de esta skill: si se omite, el reporte pierde valor.

1. **CLI tools** (`prisma`, `eslint`, `prettier`, `husky`, `lint-staged`...): se invocan desde scripts, no desde imports. Verificar `scripts` en `package.json`.
2. **Paquetes de tipos** (`@types/*`): no se importan, pero alimentan tipos globales (`@types/node` -> `process.env`, `@types/react` -> JSX). Verificar si el proyecto usa TypeScript.
3. **Usados en archivos de config** (`next.config.*`, `tailwind.config.*`, `eslint.config.*`, `postcss.config.*`): grep tambien en raiz, no solo en `src/`.
4. **Imports dinamicos** (`import()`, `require(variable)`): grep por el nombre del paquete como string literal, no solo como `from "X"`.

Patron base (PowerShell): `rg 'nombre-paquete' src/ ; rg 'nombre-paquete' *.config.* ; rg '"nombre-paquete"' .` Si los 4 casos devuelven 0 resultados, el paquete es candidato a eliminacion: reportar (no eliminar).

# Alcance y limites

- Incluye verificar configs de Tailwind, ESLint, TypeScript, Next.js, PostCSS y `.gitignore`.
- Incluye escanear `package.json` contra imports reales y detectar librerias redundantes por proposito.
- Incluye detectar settings desactivados que deberian estar activos y paths que no coinciden con la estructura real.
- NEVER cambia configs ni elimina paquetes por iniciativa propia; solo bajo brief explicito.
- NEVER elimina transitive deps (las necesitan otros paquetes directos).
- NEVER ejecuta `npm audit fix`, `npm uninstall` ni actualiza versiones por iniciativa propia.
- No redefine estrategias de testing ni arquitectura; si lo requiere, escalar a @arquitecto.

# Inputs / contexto obligatorio

- Todos los archivos de config en raiz (`tailwind.config.*`, `eslint.config.*`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, `.gitignore`).
- `package.json`, lockfile y scripts reales.
- Todos los archivos fuente en `src/`, `app/`, `pages/` o equivalentes.
- Estructura real del proyecto (no asumir estructura estandar).
- Build, typecheck y lint del proyecto como verificacion final.

# Comportamiento esperado

La auditoria sigue el patron **inventario -> verificacion -> reporte**, sin ejecutar acciones destructivas. Los checks especificos por tipo de config estan en [configs.md](configs.md).

1. **Inventario**: leer `package.json` y listar dependencias directas (`dependencies` + `devDependencies`).
2. **Verificacion de uso**: para cada dependencia, grep por los 4 casos trampa. Marcar "usada" / "candidata" / "incierta" con evidencia del comando ejecutado.
3. **Redundancia**: buscar grupos que cubren el mismo proposito (iconos, animacion, formularios, estado). Recomendar cual mantener por uso real, tamano de bundle y mantenimiento activo.
4. **Configs**: ejecutar los checks de [configs.md](configs.md) por cada config presente.
5. **Validacion final** (GATE OBLIGATORIO MUST, ver abajo): typecheck + build + lint.
6. **Reporte**: hallazgos clasificados P1/P2/P3 con evidencia, separando errores reales de mejoras opcionales.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la auditoria lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que cargue los configs + `package.json` + estructura real del proyecto (no defaults de memoria).
- [ ] **Declaro** que para cada paquete marcado como "no usado", verifique los 4 casos trampa (CLI tools, `@types/*`, configs, imports dinamicos) con evidencia del grep ejecutado.
- [ ] **Declaro** que NO se ejecuto ninguna accion destructiva (`npm uninstall`, `npm audit fix`, eliminacion de config, upgrade) sin autorizacion explicita; los cambios propuestos estan como recomendaciones en el reporte.
- [ ] **Declaro** que verifique ausencia de secrets en configs; si los hay, los escale OBLIGATORIAMENTE a **@especialista-seguridad**.
- [ ] **Declaro** que el reporte separa hallazgos P1/P2/P3 con evidencia del comando ejecutado por cada uno.
- [ ] **Declaro** que el gate de typecheck + build + lint esta en estado conocido o lo deje pendiente con motivo concreto (y lo escalé a @qa-validador si fallo).
- [ ] **Declaro** que el gate de segunda IA esta resuelto segun la tipificacion de abajo.

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que audita no es el que califica. Antes de cerrar:

- Si la auditoria detecta **secrets, permisos mal configurados, auth sensible o datos personales** en archivos de config -> escalar OBLIGATORIAMENTE a **@especialista-seguridad**. No queda como hallazgo P3.
- Si la auditoria se hace sobre un **cambio concreto que va a publicarse** -> delegar a **@qa-validador** para re-validar typecheck + build + lint antes de cerrar.
- Si la auditoria revela **refactor material** (varias configs rotas, paquetes redundantes con impacto, estructura incoherente) -> delegar a **@revisor** para revision de riesgo antes de entregar el reporte.

# Flujo recomendado

- [ ] Leer configs, `package.json`, lockfile y estructura real del proyecto.
- [ ] Inventariar configs relevantes segun el framework detectado y dependencias directas por uso esperado.
- [ ] Ejecutar los checks de [configs.md](configs.md) para cada config presente.
- [ ] Buscar imports reales + los 4 casos trampa antes de marcar cualquier paquete como candidato.
- [ ] Detectar redundancias por proposito y decidir si son materialmente problematicas.
- [ ] Ejecutar typecheck + build + lint (GATE OBLIGATORIO MUST).
- [ ] Reportar hallazgos P1/P2/P3 con evidencia, validaciones ejecutadas/pendientes y riesgo residual.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

# Mejora proactiva de la skill

Si un hallazgo corregido durante una auditoria revela una laguna reusable (nuevo caso trampa, patron de config no cubierto, nuevo anti-patron), actualizar [configs.md](configs.md) o este archivo. Proactividad solo para reglas reusables, no para hallazgos puntuales de un proyecto.

## Triggers
- Keywords: auditar config, auditar dependencias, verificar configuracion, config correcta, tailwind config, eslint config, tsconfig, next config, paquetes sin usar, limpiar package.json, redundant libraries, unused packages, dependency audit, configuration audit, misconfiguration.
- Patrones de usuario: "audita la configuracion del proyecto y dime que esta mal", "el tailwind no funciona bien", "el lint no detecta nada", "revisa tsconfig", "audita las dependencias", "hay paquetes sin usar?", "limpiamos package.json", "por que tengo tantos paquetes?", "antes de subir revisa que no haya paquetes muertos".
- Encadenamiento: despues de `arrancar-proyecto` o como validacion pre-publicacion; antes de `validar-calidad` y @qa-validador cuando toque cambios que se van a publicar; si la auditoria revela documentacion desalineada, coordinar con `documentar-con-criterio`; si detecta secrets, escalar a @especialista-seguridad.

# Ejemplos de activacion
- "Audita la configuracion del proyecto y dime que esta mal."
- "El Tailwind no detecta todas las clases, revisa el config."
- "Antes de publicar, verifica que las configs estan bien y no hay paquetes muertos."
- "Audita las dependencias del proyecto y dime cuales sobran (sin tocar nada)."
