---
name: crear-skills
description: "Define el estandar canonico para crear, reescribir o normalizar skills del hub, alineando frontmatter, estructura, tono y compatibilidad multi-IDE. TRIGGERS: crear skill, nueva skill, normalizar skill, reescribir skill, estructura skill, skill nueva."
---

# Objetivo
Garantizar que todas las skills del repositorio sigan la misma estructura, lenguaje y nivel de detalle, facilitando su reutilización y mantenimiento.

# Alcance y límites
- Aplica a cualquier nueva skill que se cree en este repositorio.
- Si una skill existente no encaja, debe reestructurarse sin alterar su intención funcional.
- No redefine reglas globales ni de proyecto; solo estandariza el formato y los apartados.

## Diferencia: skills de dominio vs skills de agentes
- **Skills de dominio**: resuelven tareas tecnicas concretas (ej: configurar-github, elevar-ui-frontend, estandarizar-docker-local).
- **Skills de agentes**: definen roles especializados que orquestan o ejecutan trabajo bajo direccion del orquestador (ej: arquitecto, implementador, revisor, experto-github).
- Para crear **agentes nuevos**, usar la skill `crear-agentes`, no esta skill.
- Para crear **skills de dominio nuevas**, usar esta skill.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) (estructura estándar de skills).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- SKILLs existentes para detectar divergencias.

# Comportamiento esperado
- Antes de crear nada, busca si ya existe una skill que cubra el mismo objetivo; si existe, actualízala en lugar de duplicarla.
- Crear una nueva carpeta usando el identificador técnico canónico de la skill.
- Crear `SKILL.md` usando la estructura estándar definida en el SSOT.
- Mantener el tono claro, directo y operativo.
- Evitar secciones redundantes o demasiado extensas: cada apartado debe aportar valor práctico.
- Si hay contenido relevante, reubicarlo en el apartado correcto en lugar de eliminarlo.
- Separar siempre identificador técnico y nombre visible humano sin usar el frontmatter como nombre bonito.
- Si la skill crea o corrige documentación, enlazar `../documentar-con-criterio/SKILL.md` como referencia transversal en lugar de duplicar sus reglas.
- Si una tarea real revela una laguna o sesgo claro en una skill existente, debe corregirse esa skill de forma proactiva en lugar de dejar la mejora solo en el código puntual.
- Esa proactividad debe reservarse para reglas importantes y reusables; no para microdetalles locales que solo inflan la skill sin mejorar realmente su criterio general.

## Seccion canónica: Triggers
Toda skill del hub debe incluir una seccion `## Triggers` antes de `## Ejemplos de activacion` con:
- **Keywords**: palabras o frases cortas que deben activar la skill.
- **Patrones de usuario**: frases tipicas que el usuario diria y que deberian dispararla.
- **Encadenamiento**: skills que cargar antes o despues cuando aplique.

Esta seccion es obligatoria para nuevas skills y debe anadirse a skills existentes cuando se normalicen.

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
- El límite es 1024 caracteres; priorizar keywords relevantes y frecuentes.

## Regla: sección `## Triggers` obligatoria
- Toda skill debe incluir una sección `## Triggers` antes de `## Ejemplos de activación`.
- Debe contener tres subapartados:
  1. **Keywords**: palabras o frases cortas que activan la skill.
  2. **Patrones de usuario**: frases típicas que el usuario diría.
  3. **Encadenamiento**: skills que cargar antes o después cuando aplique.
- Esta sección es obligatoria para nuevas skills y debe añadirse a skills existentes cuando se normalicen.

# Flujo recomendado
- [ ] Leer `docs/SSOT.md` y la estructura estándar de skills.
- [ ] Revisar `docs/AI_GLOBAL_RULES.md` para respetar reglas generales.
- [ ] Confirmar que no existe ya una skill equivalente.
- [ ] Crear (o actualizar) la carpeta/archivo correspondiente.
- [ ] Validar que el identificador técnico sigue la convención `verbo-tema` en español y `kebab-case`.
- [ ] Verificar que el frontmatter queda compatible con los IDEs soportados: `name == carpeta` y `description` entre comillas dobles.
- [ ] Incluir `TRIGGERS:` en el campo `description` del frontmatter con keywords relevantes.
- [ ] Escribir `SKILL.md` siguiendo el patrón estándar y añadir enlaces a SSOT/reglas globales compartidas en inputs.
- [ ] Añadir la sección `## Triggers` con keywords, patrones de usuario y encadenamiento.
- [ ] Verificar que no hay emojis en ninguna parte del archivo.
- [ ] Guardar el archivo con encoding UTF-8 válido y verificar que no hay secuencias corruptas.
- [ ] Revisar coherencia, orden y claridad del texto antes de cerrar.

# Criterio de resultado bueno
La skill está bien creada si:
- Sigue la estructura estándar.
- Su objetivo es claro en las primeras líneas.
- Define comportamientos accionables y verificables.
- El frontmatter incluye `TRIGGERS:` en el campo `description`.
- Incluye la sección `## Triggers` con keywords, patrones y encadenamiento.
- No contiene emojis ni caracteres que puedan entorpecer el parsing de la IA.
- El archivo se guarda con encoding UTF-8 válido sin secuencias corruptas.
- Incluye una frase de activación útil.

# Ejemplos de activación
"Crea una nueva skill siguiendo la estructura estándar del repositorio y alinea el contenido con las reglas globales."

