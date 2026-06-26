---
name: definir-reglas-proyecto
description: "Define las reglas especificas de un proyecto: SSOT, fase activa, rutas canonicas, preguntas abiertas, logs de equipo, validaciones y convenciones operativas locales. TRIGGERS: reglas, SSOT, convenciones, normas del proyecto, reglas locales, rutas canonicas."
---

# Objetivo
Establecer las **reglas del proyecto** sin romper las rules globales. Esta skill se completa usando la SSOT del proyecto. Estas reglas concretan *dónde* vive cada cosa (SSOT, test, logs, preguntas, TODO, etc.) para que la IA pueda trabajar con máxima autonomía y consistencia.

La documentación específica del proyecto debe vivir por defecto en `docs/`. Esta skill no debe intentar resolver en el hub general decisiones de dominio del producto: debe crearlas o completarlas dentro del propio repositorio del proyecto, normalmente en `docs/SSOT.md`.

# Alcance y límites
- Aplica a cualquier proyecto donde se necesite definir la fuente única de verdad y rutas clave.
- No sustituye las reglas globales: las concreta para el proyecto actual.
- Usa `docs/` como hogar por defecto de la documentación específica del proyecto salvo que la SSOT local defina otra cosa.
- No mueve al hub general decisiones de dominio, arquitectura funcional o reglas de negocio del producto.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- Estructura real del repositorio.

# Comportamiento esperado
Completar y mantener este checklist por proyecto:

- Si algún dato no está definido, revisa SSOT, código y documentación antes de preguntar.
- Si tras investigar sigue sin existir respuesta pero el cambio es reversible, documenta la hipótesis en el log del equipo y añade un TODO en la sección correspondiente.
- Si `docs/SSOT.md` no existe y no hay otra SSOT explícita, créalo o complétalo como fuente principal del proyecto.
- Toda documentación específica de producto, arquitectura, módulos, entidades, reglas de negocio e integraciones debe quedar dentro de `docs/` del proyecto.
- La cantidad y profundidad de esa documentación debe alinearse con `documentar-con-criterio` para evitar tanto huecos como ruido.
- Si faltan arquitectura, entorno o estrategia de testing suficientemente definidos, prioriza esas capas antes de cerrar rutas o comandos como si ya fueran definitivos.
- Si detectas una politica Git/versionado reusable que falta en el hub, no la dupliques sin mas en el proyecto: corrige o propone corregir `CerebroOperativoIA` y deja en el proyecto solo la concrecion local.

## 1) SSOT del proyecto
- **SSOT (archivo o ruta):** `<ruta>`  
  *Ejemplo:* `docs/SSOT.md`
- **Resumen principal:** `<ruta dentro del SSOT>`  
  *Ejemplo:* `docs/SSOT.md#resumen`
- **Fase activa actual:** `<ruta dentro del SSOT>`  
  *Ejemplo:* `docs/SSOT.md#fase-activa`

## 2) Estructura del proyecto
- **Carpeta raíz del código:** `<ruta>`  
  *Ejemplo:* `app/`
- **Convención de nombres (si aplica):** `<texto>`  
  *Ejemplo:* `PascalCase para clases, snake_case para archivos`

## 3) Test (ubicación y ejecución)
- **Ruta de test:** `<ruta>`  
  *Ejemplo:* `tests/`
- **Comando de test base:** `<comando>`  
  *Ejemplo:* `npm run test`
- **Test de comportamiento crítico:** `<ruta o comando>`  
  *Ejemplo:* `tests/e2e/checkout.test.ts`

## 4) Logs del equipo (Rule 2)
- **Carpeta de registros:** `.teams/`
- **Patrón:** `TEAM_XXX_YYYY-MM-DD_<resumen>.md`
- **Plantilla base:** `<enlace o ruta>`  
  *Ejemplo:* `.teams/TEAM_TEMPLATE.md`

## 5) Preguntas abiertas (Rule 8)
- **Carpeta de preguntas:** `.questions/`
- **Patrón:** `TEAM_XXX_YYYY-MM-DD_<resumen>.md`
- **Cómo marcar resueltas:** `<método>`  
  *Ejemplo:* `Añadir sección "Respuesta" dentro del archivo`

## 6) TODOs del proyecto (Rule 11)
- **Lista global de TODO:** `<ruta>`  
  *Ejemplo:* `TODO.md`
- **Formato requerido:** `<texto>`  
  *Ejemplo:* `- [ ] PRJ-001 - Resultado concreto y accionable`
- **Secciones esperadas:** `<texto>`
  *Ejemplo:* `En Curso, Siguientes, Bloqueados, Cerrados, Aparcados`

## 7) Versionado y publicacion local
- **Fuente local de version formal:** `<ruta o decision>`  
  *Ejemplo:* `VERSION.json`
- **Rama local de integracion/release:** `<rama>`  
  *Ejemplo:* `main`
- **Comando local de validacion de versionado/publicacion:** `<comando>`  
  *Ejemplo:* `pwsh ./scripts/validar-versionado.ps1 -Mode Auto`
- **Formato local de commit/tag si difiere del default del hub:** `<texto>`

> La politica general de `sync push`, `release formal` y salida obligatoria al usuario debe venir del hub. El proyecto solo concreta sus valores locales.

> Si falta información crítica y no se puede deducir, crea un archivo en `.questions/` para aclararlo y deja un `TODO(TEAM_XXX)` en la sección correspondiente hasta que se resuelva.

# Flujo recomendado
- [ ] Confirmar si el proyecto ya tiene SSOT; si no, crear `docs/SSOT.md` o usar la ubicación explícita que el propio proyecto declare.
- [ ] Tratar `docs/` como carpeta por defecto de la documentación específica del proyecto.
- [ ] Leer la SSOT del proyecto.
- [ ] Completar cada apartado con rutas y comandos reales.
- [ ] Documentar en `docs/` la parte específica de dominio, arquitectura y flujos funcionales cuando falte.
- [ ] Separar politicas reutilizables del hub frente a concreciones locales del proyecto.
- [ ] Validar que no hay conflictos con reglas globales.
- [ ] Registrar cualquier cambio en el archivo de equipo.

# Criterio de resultado bueno
La skill está bien aplicada si:
- Todas las rutas y comandos críticos están definidos.
- La IA puede operar sin ambigüedad sobre tests, logs, preguntas y TODOs.
- El roadmap/TODO queda definido como documento vivo y no como lista suelta.
- Se respeta la SSOT del proyecto como referencia principal.
- Queda claro que la documentación específica del producto vive en `docs/` del proyecto y no en el hub general.
- Queda claro qué parte del versionado/publicacion es reusable del hub y qué parte es local del proyecto.

## Triggers
- Keywords: reglas, SSOT, convenciones, normas del proyecto, reglas locales, rutas canonicas
- Patrones de usuario: "define las reglas del proyecto", "configura la SSOT", "fija rutas y comandos", "concreta convenciones locales"
- Encadenamiento: despues de `definir-arquitectura` y `configurar-entorno`, antes de `configurar-testing`

# Ejemplos de activación
"Define las reglas específicas del proyecto usando la SSOT y alinea rutas, tests, logs y TODOs con las reglas globales." 

# Reglas de uso
- Si algún apartado no existe pero la decisión es menor, reversible y coherente con la estructura del proyecto, la IA puede crearlo y registrarlo en `.teams/`.
- Si este documento entra en conflicto con reglas globales, **prevalece la SSOT del proyecto** para detalles específicos (rutas, comandos, estructura).
- Si el conflicto afecta a una politica reutilizable de Git/publicacion, no lo cierres solo dentro del proyecto: actualiza primero el hub o deja explicitamente documentado el hueco para corregirlo alli.
- Si falta documentación de dominio o arquitectura, debe añadirse al `docs/` del proyecto en lugar de empujar esa decisión al repositorio general.
- Si el proyecto todavía no ha pasado por `arrancar-proyecto`, `definir-arquitectura`, `configurar-entorno` o `configurar-testing` y esos huecos afectan a las rutas o comandos, la IA debe señalar esa precedencia antes de improvisar definiciones frágiles.
- Todo cambio en estas reglas debe registrarse en el archivo de equipo correspondiente (Rule 2).

