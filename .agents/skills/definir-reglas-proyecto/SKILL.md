---
name: definir-reglas-proyecto
description: "Usar al arrancar un proyecto nuevo o cuando se necesite fijar o revisar SSOT, fase activa, rutas canonicas, preguntas abiertas, logs de equipo, validaciones y convenciones operativas locales. TRIGGERS: reglas, SSOT, convenciones, normas del proyecto, reglas locales, rutas canonicas."
---

# Definir reglas de proyecto

# Objetivo

Establecer las **reglas del proyecto** sin romper las rules globales. Concreta *donde* vive cada cosa (SSOT, tests, logs, preguntas, TODO, versionado) para que la IA pueda trabajar con maxima autonomia y consistencia.

La documentacion especifica del proyecto vive por defecto en `docs/`. Esta skill no resuelve en el hub general decisiones de dominio del producto: las crea o completa dentro del propio repositorio, normalmente en `docs/SSOT.md`.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Improvisar rutas sin SSOT:** MAL cerrar `tests/` y `npm run test` sin haber leido SSOT, codigo y estructura real. BIEN investigar SSOT, codigo y docs antes de fijar; si no existe respuesta, documentar la hipotesis y dejar un TODO. EJEMPLO asumir `jest` sin `jest` en `package.json` -> revisar configs reales antes de fijar el comando.
- **Duplicar politicas del hub:** MAL copiar la politica de `sync push`/`release formal` del hub dentro del proyecto. BIEN dejar en el proyecto solo la concrecion local (rama, `VERSION.json`, comando) y referenciar el hub para lo reutilizable. EJEMPLO el proyecto anota `VERSION.json` + `main`, pero no reescribe la politica de publicacion.
- **Empujar dominio al hub:** MAL mover decisiones de negocio o arquitectura funcional del producto al repositorio general del hub. BIEN todo lo de dominio vive en `docs/` del proyecto. EJEMPLO las reglas de una TPV viven en el proyecto, no en el hub general.
- **Cerrar rutas como definitivas sin capas previas:** MAL fijar rutas de test o comandos de build cuando arquitectura, entorno o testing no estan definidos. BIEN señalar la precedencia y dejar las rutas como pendientes hasta que esas capas existan. EJEMPLO sin `configurar-entorno`, no cerrar el comando de dev como definitivo.

# Alcance y limites

- Aplica a cualquier proyecto donde se necesite definir la fuente unica de verdad y rutas clave.
- No sustituye las reglas globales: las concreta para el proyecto actual.
- Usa `docs/` como hogar por defecto de la documentacion especifica salvo que la SSOT local defina otra cosa.
- No mueve al hub general decisiones de dominio, arquitectura funcional o reglas de negocio.

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md), [reglas globales](../docs/AI_GLOBAL_RULES.md) y [skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- Estructura real del repositorio.

# Comportamiento esperado

Completar y mantener el checklist por proyecto. Si un dato no esta definido, revisar SSOT, codigo y documentacion antes de preguntar. Si tras investigar sigue sin respuesta pero el cambio es reversible, documentar la hipotesis en el log del equipo y anadir un TODO en la seccion correspondiente. Aplicar `documentar-con-criterio` para evitar huecos y ruido.

Si `docs/SSOT.md` no existe y no hay otra SSOT explicita, crearlo o completarlo como fuente principal del proyecto. Toda la documentacion especifica de producto, arquitectura, modulos, entidades, reglas de negocio e integraciones queda dentro de `docs/` del proyecto.

## Checklist por proyecto

### 1) SSOT del proyecto
- **SSOT (archivo o ruta):** `<ruta>` — *Ej:* `docs/SSOT.md`
- **Resumen principal:** `<ruta dentro del SSOT>` — *Ej:* `docs/SSOT.md#resumen`
- **Fase activa actual:** `<ruta dentro del SSOT>` — *Ej:* `docs/SSOT.md#fase-activa`

### 2) Estructura del proyecto
- **Carpeta raiz del codigo:** `<ruta>` — *Ej:* `app/`
- **Convencion de nombres (si aplica):** `<texto>` — *Ej:* `PascalCase` clases, `snake_case` archivos

### 3) Test (ubicacion y ejecucion)
- **Ruta de test:** `<ruta>` — *Ej:* `tests/`
- **Comando de test base:** `<comando>` — *Ej:* `npm run test`
- **Test de comportamiento critico:** `<ruta o comando>` — *Ej:* `tests/e2e/checkout.test.ts`

### 4) Logs del equipo (Rule 2)
- **Carpeta de registros:** `.teams/`
- **Patron:** `TEAM_XXX_YYYY-MM-DD_<resumen>.md`
- **Plantilla base:** `<ruta>` — *Ej:* `.teams/TEAM_TEMPLATE.md`

### 5) Preguntas abiertas (Rule 8)
- **Carpeta de preguntas:** `.questions/`
- **Patron:** `TEAM_XXX_YYYY-MM-DD_<resumen>.md`
- **Como marcar resueltas:** `<metodo>` — *Ej:* anadir seccion "Respuesta" dentro del archivo

### 6) TODOs del proyecto (Rule 11)
- **Lista global de TODO:** `<ruta>` — *Ej:* `TODO.md`
- **Formato requerido:** `<texto>` — *Ej:* `- [ ] PRJ-001 - Resultado concreto y accionable`
- **Secciones esperadas:** `<texto>` — *Ej:* En Curso, Siguientes, Bloqueados, Cerrados, Aparcados

### 7) Versionado y publicacion local
- **Fuente local de version formal:** `<ruta o decision>` — *Ej:* `VERSION.json`
- **Rama local de integracion/release:** `<rama>` — *Ej:* `main`
- **Comando local de validacion de versionado/publicacion:** `<comando>` — *Ej:* `pwsh ./scripts/validar-versionado.ps1 -Mode Auto`
- **Formato local de commit/tag si difiere del default del hub:** `<texto>`

> La politica general de `sync push`, `release formal` y salida obligatoria al usuario viene del hub. El proyecto solo concreta sus valores locales. Si falta informacion critica y no se puede deducir, crea un archivo en `.questions/` y deja un `TODO(TEAM_XXX)` en la seccion correspondiente hasta resolverlo.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar las reglas del proyecto fijadas, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que cada ruta y comando del checklist esta respaldado por SSOT, codigo o configuracion real del proyecto (no defaults de memoria).
- [ ] **Declaro** que `docs/SSOT.md` existe o queda como fuente principal explicita del proyecto.
- [ ] **Declaro** que NO duplique en el proyecto politicas reutilizables del hub (versionado/publicacion): solo deje la concrecion local.
- [ ] **Declaro** que las decisiones de dominio, arquitectura funcional y reglas de negocio quedan en `docs/` del proyecto, no en el hub general.
- [ ] **Declaro** que señale la precedencia de `definir-arquitectura`, `configurar-entorno` y `configurar-testing` antes de cerrar como definitivas rutas o comandos que dependan de esas capas.
- [ ] **Declaro** que registre el cambio de reglas en el archivo de equipo correspondiente (Rule 2).

# Flujo recomendado

- [ ] Confirmar si el proyecto ya tiene SSOT; si no, crear `docs/SSOT.md` o usar la ubicacion explicita que el proyecto declare.
- [ ] Leer la SSOT y completar cada apartado del checklist con rutas y comandos reales.
- [ ] Documentar en `docs/` la parte especifica de dominio, arquitectura y flujos cuando falte.
- [ ] Separar politicas reutilizables del hub frente a concreciones locales del proyecto.
- [ ] Validar que no hay conflictos con reglas globales; registrar el cambio en el archivo de equipo.
- [ ] Resolver el gate de auto-cita.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers

- Keywords: reglas, SSOT, convenciones, normas del proyecto, reglas locales, rutas canonicas.
- Patrones de usuario: "define las reglas del proyecto", "configura la SSOT", "fija rutas y comandos", "concreta convenciones locales".
- Encadenamiento: despues de `definir-arquitectura`, `arrancar-proyecto` y `configurar-entorno`; antes de `configurar-testing`.

# Ejemplos de activacion

- "Define las reglas especificas del proyecto usando la SSOT y alinea rutas, tests, logs y TODOs con las reglas globales."
- "Falta la SSOT; crea `docs/SSOT.md` y concreta rutas y comandos reales."
