---
name: arrancar-proyecto
description: "Crea el bootstrap canonico de un repositorio nuevo o incompleto: estructura base, docs iniciales, plantillas operativas y preparacion para empezar a trabajar sin improvisar. TRIGGERS: nuevo proyecto, bootstrap, iniciar repo, estructura base, arrancar, crear proyecto, primera configuracion."
---

# Objetivo
Arrancar un repositorio nuevo con una base operativa mínima, clara y reutilizable desde el día 1.

Esta skill debe dejar preparado el marco de trabajo general del proyecto: estructura, documentación canónica, plantillas de seguimiento y preparación inicial para el flujo de Git/GitHub, sin generar código de aplicación ni asumir lógica de negocio.

# Alcance y límites
- Aplica al minuto cero de proyectos nuevos o parcialmente inicializados.
- Sí crea estructura y documentos base del proyecto.
- Sí puede preparar `.gitignore` y dejar el terreno listo para Git.
- No crea arquitectura específica de producto ni reglas de negocio.
- No sustituye a `definir-reglas-proyecto`; la precede.
- No sustituye a `configurar-github`; deja el repositorio listo para usar esa skill después.
- No debe instalar dependencias ni generar código de aplicación salvo que el propio proyecto ya provea una plantilla explícita para ello.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio, si ya existe algo.
- Cualquier pista detectable del stack (`package.json`, `pyproject.toml`, `.sln`, `Dockerfile`, etc.) sin asumir tecnología no confirmada.

# Comportamiento esperado
Antes de crear nada, inspecciona si el repositorio está vacío o parcialmente inicializado.

Si la skill debe crear o modificar muchos archivos, no intentes hacerlo en un único parche masivo: divide el trabajo por bloques temáticos y verifica el estado entre bloques.

La skill debe detectar si ya existen:
- `docs/`
- `docs/SSOT.md`
- `docs/TODO.md` o `TODO.md`
- `.teams/`
- `.questions/`
- `.gitignore`
- `.git/`

Después debe actuar con estos principios:

1. Crear solo lo que falte o normalizar lo mínimo necesario.
2. Usar `docs/` como hogar por defecto de la documentación específica del proyecto.
3. Crear `docs/SSOT.md` a partir de la plantilla del hub si no existe una SSOT local explícita.
4. Crear `docs/TODO.md` si falta una lista global equivalente, dejándolo como roadmap operativo vivo mínimo.
5. Crear `.teams/`, `.teams/active/`, `.teams/archive/`, `.questions/`, `.teams/.counter` y `.teams/INDEX.md` si faltan.
6. Crear `TEAM_TEMPLATE.md` y `QUESTION_TEMPLATE.md` si el proyecto no tiene una plantilla propia compatible con el contrato vigente del hub.
7. Crear un `.gitignore` base prudente, transversal y seguro.
8. Dejar constancia del arranque realizado en `.teams/active/` y cerrarlo/archivarlo si el bootstrap queda completado.
9. Señalar el siguiente paso recomendado: completar la SSOT específica y, después, usar `definir-reglas-proyecto` y `configurar-github` cuando aplique.
10. Sembrar `dev.bat` aplicando `generar-bat-interactivo` si el stack detectado lo justifica. Documentar la omision en SSOT si no aplica.

La base documental inicial debe ser mínima, canónica y sin ruido: aplicar `documentar-con-criterio` antes de añadir detalle que aún no aporte valor operativo real.

## Estructura base que debe dejar
La estructura objetivo mínima es:

```text
docs/
  SSOT.md
  TODO.md
.teams/
  TEAM_TEMPLATE.md
  .counter
  INDEX.md
  active/
  archive/
.questions/
  QUESTION_TEMPLATE.md
.gitignore
```

Si el proyecto ya tiene una variante equivalente, la IA debe respetarla y completar solo lo que falte.

## Compatibilidad con `.teams` legacy

Al arrancar o completar un proyecto antiguo:
- si `.teams/` contiene teams planos, estados antiguos o campos retirados como `Responsable`, tratarlo como historico legacy;
- no reescribir teams antiguos para adaptar estilo;
- para teams nuevos usar siempre el contrato vigente del hub: `.teams/active/`, `.teams/archive/`, contador `.teams/.counter`, indice `.teams/INDEX.md` y estados `activo|cerrado|bloqueado`;
- inicializar `.teams/.counter` con el ID mas alto existente, aunque los archivos antiguos usen 3 digitos;
- solo corregir un team antiguo si se retoma exactamente ese hilo, contiene un error que induce a fallo operativo o bloquea una decision actual.

## Política de `.gitignore`
La IA debe seguir estas reglas:
- usar una base general y segura;
- incluir archivos de sistema y editores comunes;
- no inventar ignores específicos de stack sin evidencia real del proyecto;
- si el stack está claramente detectado, ampliar el `.gitignore` de forma conservadora;
- evitar reglas agresivas que puedan ocultar archivos importantes del proyecto por accidente.

## Relación con otras skills
- `arrancar-proyecto` prepara el terreno del repositorio.
- `gestionar-roadmap` entra después cuando haga falta dar forma, sanear o mantener vivo el roadmap.
- `definir-reglas-proyecto` concreta rutas, comandos y reglas reales del proyecto una vez existe la base documental.
- `configurar-github` se encarga del flujo de repositorio remoto, commits y publicación.
- `ordenar-archivos` entra después si hay que refinar o reestructurar el árbol del proyecto.
- Llama a `generar-bat-interactivo` para sembrar el punto de entrada de desarrollo del proyecto cuando el stack detectado lo justifique.

## Ejemplos operativos
### Repo vacío
- Crear `docs/`, `docs/SSOT.md`, `docs/TODO.md`, `.teams/`, `.questions/` y `.gitignore`.
- Registrar en `.teams/active/` que se ha realizado el bootstrap inicial y archivar el registro si queda completado.
- Dejar como siguiente paso completar la SSOT del proyecto y sanear el roadmap con `gestionar-roadmap` si ya hay alcance suficiente.

### Repo parcialmente iniciado
- Detectar qué ya existe.
- No duplicar SSOT, TODOs ni plantillas.
- Completar únicamente los huecos necesarios para llegar a una base canónica mínima.

### Repo con stack detectado pero sin documentación
- Detectar la tecnología real.
- Crear la base documental y operativa.
- Ampliar `.gitignore` solo si la evidencia del stack lo justifica.
- Dejar notas claras sobre los siguientes pasos de definición del proyecto.

# Flujo recomendado
- [ ] Inspeccionar el repositorio.
- [ ] Detectar qué estructura y documentos ya existen.
- [ ] Identificar si hay stack detectable sin asumir tecnología no confirmada.
- [ ] Crear o completar la estructura base y la documentación canónica.
- [ ] Si hay `.teams` legacy, preparar `active/`, `archive/`, `.counter` e `INDEX.md` sin normalizar historico por estilo.
- [ ] Crear o completar `.gitignore` con una base prudente.
- [ ] Registrar el arranque en `.teams/active/` y archivar si procede.
- [ ] Indicar el siguiente paso operativo recomendado.

# Criterio de resultado bueno
La skill está bien aplicada si:
- el repositorio queda listo para empezar a trabajar con una base operativa clara;
- `docs/SSOT.md` existe o queda referenciado de forma explícita;
- no se duplican archivos canónicos ya existentes;
- `.gitignore` es útil y conservador;
- queda claro que la parte específica del proyecto debe completarse después en `docs/`;
- el handoff hacia `definir-reglas-proyecto` y `configurar-github` es evidente.

## Triggers
- Keywords: nuevo proyecto, bootstrap, iniciar repo, estructura base, arrancar, crear proyecto, primera configuracion
- Patrones de usuario: "arranca este proyecto", "bootstrap inicial", "estructura base", "primeros pasos", "inicia el repo"
- Encadenamiento: antes de `definir-reglas-proyecto` y `configurar-github`

# Ejemplos de activación
"Arranca este proyecto desde cero y déjalo listo para empezar a trabajar con estructura, SSOT y documentación base."

