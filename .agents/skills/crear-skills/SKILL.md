---
name: crear-skills
description: "Usar cuando vayas a crear, reescribir o normalizar una skill del hub y necesites asegurar frontmatter, estructura, tono y compatibilidad multi-IDE segun el estandar canonico. TRIGGERS: crear skill, nueva skill, normalizar skill, reescribir skill, estructura skill, skill nueva."
---

# Objetivo
Garantizar que todas las skills del repositorio sigan la misma estructura, lenguaje y nivel de detalle, facilitando su reutilización y mantenimiento.

# Alcance y límites
- Aplica a cualquier nueva skill que se cree en este repositorio.
- Si una skill existente no encaja, debe reestructurarse sin alterar su intención funcional.
- No redefine reglas globales ni de proyecto; solo estandariza el formato y los apartados.

## Diferencia: skills de dominio vs skills de agentes
- **Skills de dominio** (esta skill): resuelven tareas técnicas concretas (ej: `configurar-github`, `elevar-ui-frontend`, `estandarizar-docker-local`).
- **Skills de agentes**: definen roles especializados que orquestan o ejecutan trabajo bajo dirección de `@orquestador`. Para crear agentes nuevos, usar `crear-agentes`, no esta skill.

## Frontera con endurecer-skills
- `crear-skills` (esta) -> la skill existe y tiene forma (carpeta, frontmatter, encoding, naming, secciones, triggers).
- `endurecer-skills` -> la skill se cumple de verdad (cognicion del LLM, posicion en el archivo, tipo de regla, gates de cierre, anti-patrones de diseno).
- Flujo canonico: primero `crear-skills` (existe), despues `endurecer-skills` (se cumple). **MUST:** cargar `endurecer-skills` antes de escribir contenido operativo de cualquier skill nueva o normalizada, para que el criterio se cumpla en runtime, no solo exista.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) (estructura estándar de skills).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- SKILLs existentes para detectar divergencias.

# Comportamiento esperado
- Antes de crear, buscar si ya existe una skill que cubra el objetivo; si existe, actualizarla en lugar de duplicarla.
- Crear carpeta + `SKILL.md` siguiendo el identificador técnico canónico y la estructura del SSOT; tono claro, directo y operativo.
- Cada apartado debe aportar valor práctico: evitar secciones redundantes o extensas y reubicar contenido en lugar de eliminarlo.
- Separar identificador técnico y nombre visible humano (sin usar el frontmatter como nombre bonito).
- Si la skill crea o corrige documentación, enlazar `../documentar-con-criterio/SKILL.md` como referencia transversal en lugar de duplicar sus reglas.
- Corregir proactivamente lagunas o sesgos en esta skill, pero solo para reglas importantes y reusables, no para microdetalles locales.

## Convención de nombres obligatoria
- El identificador técnico debe estar en español.
- Debe usar `kebab-case`.
- Debe seguir el patrón `verbo-tema`.
- La carpeta de la skill debe coincidir exactamente con ese identificador.
- El campo `name` del frontmatter debe coincidir exactamente con el slug de la carpeta.
- El campo `description` del frontmatter debe ir entre comillas dobles para ser seguro como YAML en todos los IDEs soportados.
- El nombre visible humano debe vivir en el título Markdown de la skill y en la documentación que la liste.

Ejemplos válidos:
- Carpeta: `configurar-github` | `name`: `configurar-github` | título: `# Configurar GitHub`
- Carpeta: `ordenar-archivos` | `name`: `ordenar-archivos` | título: `# Ordenar Archivos`

## Registro de skills nuevas
- Toda skill nueva DEBE registrarse en `scripts/agent-prompts.json` (lista `skills` de al menos un agente) y añadirse al árbol de directorios del README (línea con `Skill:`).
- Sin esos dos pasos `pwsh scripts/validate-hub.ps1` falla: la carpeta queda como skill no registrada y el conteo del README no cuadra.

## Regla: sin emojis
- Las skills del hub no deben incluir emojis en títulos, headers, bullets ni contenido.
- Los emojis entorpecen el parsing por parte de las IAs y pueden causar problemas de encoding al editar archivos entre distintos sistemas.
- Usar texto plano y, cuando sea necesario, identificadores textuales como `[OK]`, `[WARN]`, `[CRIT]` en lugar de iconos.

## Regla: encoding UTF-8 estricto
- Todo SKILL.md debe guardarse con encoding UTF-8 válido.
- Nunca debe producirse re-codificación accidental (UTF-8 interpretado como latin1 y vuelto a guardar).
- Si se detecta contenido con secuencias corruptas por mala decodificacion UTF-8, la skill debe corregir el encoding antes de continuar.
- Para evitarlo: usar siempre herramientas que explícitamente escriban UTF-8 (por ejemplo, `fs.writeFileSync(path, content, 'utf8')` en Node.js, o `open(path, 'w', encoding='utf-8')` en Python).

## Regla: description enriquecida con triggers
- El campo `description` del frontmatter debe incluir la descripción funcional seguida de `TRIGGERS:` y una lista de keywords separadas por comas.
- Esto permite que la IA detecte la skill sin depender solo de la memoria conversacional.
- Ejemplo válido:
  ```yaml
  description: "Gestiona git y GitHub con criterio operativo... TRIGGERS: subir, push, publicar, github, commit, release."
  ```
- El límite formal es 1024 caracteres, pero la superficie real de discovery en DSH corta a 500: los primeros 500 deben llevar el momento de activación y los triggers fuertes. Acentos: los validadores del hub comparan plegando acentos, pero evítalos en keywords por consistencia.

## Regla: sección `## Triggers` obligatoria
- Toda skill debe incluir una sección `## Triggers` antes de `# Ejemplos de activación`.
- Debe contener tres subapartados:
  1. **Keywords**: palabras o frases cortas que activan la skill.
  2. **Patrones de usuario**: frases típicas que el usuario diría.
  3. **Encadenamiento**: skills que cargar antes o después cuando aplique.
- Esta sección es obligatoria para nuevas skills y debe añadirse a skills existentes cuando se normalicen.

## Regla: gate de cierre con auto-cita (canon del hub)

Toda skill del hub DEBE cerrar con un único gate de cierre en modo **auto-cita** (declaración con evidencia observable), no en modo **auto-evaluación** (pregunta o aspiración como "la skill está bien aplicada si..."). El anti-patrón clásico alimenta "marcado fantasma": el modelo marca "hecho" sin verificar. Ver `endurecer-skills` principio 6.

El header `## Criterio de resultado bueno` se mantiene por compatibilidad con `validate-hub-skills.ps1`, pero su contenido DEBE reformularse como auto-cita.

Plantilla base (máximo 7 items en total; cada skill de dominio añade los específicos). Cada item del gate debe citar su artefacto verificable (fichero:linea, comando+salida o TEAM_ID); un Declaro sin artefacto citable es auto-evaluación disfrazada:

- [ ] Declaro que cargué los inputs obligatorios (SSOT, reglas globales, archivos citados).
- [ ] Declaro que apliqué las hard rules (MUST/NEVER) con evidencia observable por otra IA.
- [ ] Declaro que evité cada anti-patrón listado en la skill, citando cuál aplicaba a este caso concreto.
- [ ] Declaro que ejecuté el gate externo (comando / test / segunda IA) cuando la skill lo exige.
- [ ] Declaro el recorte de densidad citando el artefacto: qué información quité, a qué archivo de referencia la moví o a qué fuente enlacé (principio 4 de `endurecer-skills`).

# Flujo recomendado
- [ ] Leer `docs/SSOT.md` y `docs/AI_GLOBAL_RULES.md`; confirmar que no existe ya una skill equivalente.
- [ ] Crear (o actualizar) carpeta + `SKILL.md` con la estructura del SSOT y enlaces a fuentes canónicas en inputs.
- [ ] Validar identificador técnico `verbo-tema` en español, kebab-case, `name == carpeta` y `description` entre comillas dobles.
- [ ] Incluir `TRIGGERS:` en `description` y la sección `## Triggers` (keywords, patrones, encadenamiento); registrar la skill en `scripts/agent-prompts.json`; despues de crearla, endurecerla con `endurecer-skills`.
- [ ] Verificar ausencia de emojis y encoding UTF-8 válido sin secuencias corruptas.
- [ ] Aplicar el gate de cierre con auto-cita (ver regla anterior) antes de declarar la skill lista.

# Criterio de resultado bueno (gate de cierre, auto-cita)

Antes de declarar la skill creada o normalizada como lista, declarar:

- [ ] Declaro que cargué `docs/SSOT.md`, `docs/AI_GLOBAL_RULES.md` y las skills hermanas (`endurecer-skills`, `documentar-con-criterio`).
- [ ] Declaro que el identificador técnico sigue `verbo-tema` en español, kebab-case y `name == carpeta`.
- [ ] Declaro que el frontmatter incluye `TRIGGERS:` en `description` entre comillas dobles.
- [ ] Declaro que la skill incluye `## Triggers` (keywords, patrones, encadenamiento) y está registrada en `scripts/agent-prompts.json`.
- [ ] Declaro que evité los anti-patrones de esta skill (emojis, encoding corrupto, secciones redundantes), citando cuál aplicaba al caso concreto.
- [ ] Declaro que el cierre usa auto-cita (ver regla anterior), no auto-evaluación.

## Triggers
- Keywords: crear skill, nueva skill, normalizar skill, reescribir skill, estructura skill, skill nueva
- Patrones de usuario: "Crea una nueva skill siguiendo la estructura del hub", "Normaliza esta skill para que cumpla el estandar", "Reescribe el SKILL.md manteniendo la intencion", "Anade la seccion ## Triggers a esta skill"
- Encadenamiento: antes de `crear-agentes` si lo que se crea es un agente (no una skill de dominio); despues de `documentar-con-criterio` cuando la skill modifica documentacion de proyecto; hermanas `auditar-proyecto-tecnico` (verifica que la skill nueva no rompe validacion) y `mantener-cerebro-operativo` (chequeo integral del hub tras cambios estructurales)

# Ejemplos de activación
"Crea una nueva skill siguiendo la estructura estándar del repositorio y alinea el contenido con las reglas globales."

