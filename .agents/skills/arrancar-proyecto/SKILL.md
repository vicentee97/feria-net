---
name: arrancar-proyecto
description: "Usar al iniciar un repositorio nuevo, despues de un bootstrap fallido o cuando el proyecto aun no tiene estructura base, docs operativos ni plantillas para empezar a trabajar sin improvisar. TRIGGERS: nuevo proyecto, bootstrap, iniciar repo, estructura base, arrancar, crear proyecto, primera configuracion."
---

# Arrancar proyecto

# Objetivo

Arrancar un repositorio nuevo con una base operativa minima, clara y reutilizable desde el dia 1: estructura, documentacion canonica, plantillas de seguimiento y preparacion inicial para el flujo de Git/GitHub, sin generar codigo de aplicacion ni asumir logica de negocio.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Crear todo por reflejo:** MAL generar `docs/SSOT.md`, `.teams/` y `.gitignore` sin inspeccionar primero el repo. BIEN detectar que ya existe y completar solo lo que falte. EJEMPLO un repo con `README.md` y `src/` -> respetarlos y anadir solo `docs/`, `.teams/` y `.gitignore`.
- **Duplicar SSOT o plantillas:** MAL crear `docs/SSOT.md` cuando el proyecto ya tiene `README.md` como SSOT o una plantilla propia. BIEN respetar la variante equivalente y referenciarla. EJEMPLO si existe `docs/PROJECT.md` canonico, enlazarlo en vez de abrir un segundo SSOT.
- **Gitignore agresivo:** MAL ignorar por defecto carpetas amplias (`dist/`, `build/`, `*.log`) que pueden ocultar archivos del proyecto. BIEN base general segura + ignorar stack solo con evidencia real del proyecto. EJEMPLO no ignorar `.next/` si el proyecto no usa Next.js.
- **Normalizar .teams legacy por estilo:** MAL reescribir teams antiguos para adaptar formato o estados. BIEN tratar el historico como legacy; usar el contrato vigente solo para teams nuevos. EJEMPLO un `TEAM_003_...` con campo `Responsable` se respeta; un team nuevo usa `activo|cerrado|bloqueado`.
- **Sembrar dev.bat sin stack:** MAL generar `.scripts/dev.bat` para cualquier proyecto. BIEN sembrar `dev.bat` solo si el stack detectado se beneficia de un menu; si no, omitir y registrar la decision en SSOT. EJEMPLO libreria npm de tipos -> omitir y anotar el motivo.

# Alcance y limites

- Aplica al minuto cero de proyectos nuevos o parcialmente inicializados.
- Crea estructura y documentos base del proyecto; prepara `.gitignore` y deja el terreno listo para Git.
- No crea arquitectura especifica de producto ni reglas de negocio; precede a `definir-reglas-proyecto`.
- No sustituye a `configurar-github`; deja el repositorio listo para esa skill despues.
- No instala dependencias ni genera codigo de aplicacion salvo plantilla explicita del proyecto.

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md) y [reglas globales](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md) y [plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio (vacio o parcial).
- Pistas detectables del stack (`package.json`, `pyproject.toml`, `.sln`, `Dockerfile`) sin asumir tecnologia no confirmada.

# Comportamiento esperado

Inspeccionar primero; crear solo lo que falte. Si hay que tocar muchos archivos, dividir por bloques tematicos y verificar el estado entre bloques.

La estructura objetivo minima es:

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

Principios operativos (aplicar `documentar-con-criterio` para no inflar la base inicial):

1. `docs/` es el hogar por defecto de la documentacion especifica del proyecto.
2. Crear `docs/SSOT.md` desde la plantilla del hub solo si no existe SSOT local explicita.
3. Crear `docs/TODO.md` como roadmap operativo vivo minimo si falta lista global equivalente.
4. Crear `.teams/` con `active/`, `archive/`, `.teams/.counter`, `.teams/INDEX.md` y plantillas `TEAM_TEMPLATE.md` / `QUESTION_TEMPLATE.md` si faltan.
5. Crear `.gitignore` base prudente (ver anti-patron Gitignore agresivo).
6. Dejar constancia del arranque en `.teams/active/` y archivarlo si el bootstrap queda completado.
7. Sembrar `dev.bat` aplicando `generar-bat-interactivo` solo si el stack detectado lo justifica; si no, documentar la omision en SSOT.
8. Señalar el siguiente paso: completar la SSOT especifica y despues usar `definir-reglas-proyecto` y `configurar-github`.

## Compatibilidad con `.teams` legacy

- Si `.teams/` contiene teams planos, estados antiguos o campos retirados (`Responsable`), tratarlo como historico legacy; no reescribir por estilo.
- Para teams nuevos usar el contrato vigente: `.teams/active/`, `.teams/archive/`, `.teams/.counter`, `.teams/INDEX.md` y estados `activo|cerrado|bloqueado`.
- Inicializar `.teams/.counter` con el ID mas alto existente, aunque los archivos antiguos usen 3 digitos.
- Solo corregir un team antiguo si se retoma ese hilo exacto, contiene un error que induce a fallo operativo o bloquea una decision actual.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el arranque listo, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione el repo antes de crear nada (estructura, `docs/`, `.teams/`, `.gitignore`, stack detectable) y que no duplique archivos canonicos ya existentes.
- [ ] **Declaro** que `docs/SSOT.md` existe o queda referenciado de forma explicita, y que la base documental es minima y sin ruido (aplique `documentar-con-criterio`).
- [ ] **Declaro** que `.gitignore` es conservador: base general segura, ignora stack solo con evidencia real, no oculta archivos del proyecto.
- [ ] **Declaro** que `.teams/` respeta el contrato vigente (`active/` + `archive/` + `.counter` + `INDEX.md` + plantillas) y que NO normalize el historico legacy por estilo.
- [ ] **Declaro** que el arranque quedo registrado en `.teams/active/` (y archivado si el bootstrap se completo).
- [ ] **Declaro** que la decision sobre `dev.bat` (sembrar u omitir) esta documentada con motivo.
- [ ] **Declaro** que el handoff a `definir-reglas-proyecto` y `configurar-github` queda señalado como siguiente paso.

# Flujo recomendado

- [ ] Inspeccionar el repositorio y detectar estructura/documentos ya existentes.
- [ ] Identificar stack detectable sin asumir tecnologia no confirmada.
- [ ] Crear o completar solo lo que falte de la estructura base canonica.
- [ ] Si hay `.teams` legacy, preparar `active/`, `archive/`, `.counter` e `INDEX.md` sin normalizar historico por estilo.
- [ ] Crear o completar `.gitignore` con base prudente.
- [ ] Registrar el arranque en `.teams/active/` y archivar si procede.
- [ ] Resolver el gate de auto-cita y señalar el siguiente paso operativo recomendado.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers

- Keywords: nuevo proyecto, bootstrap, iniciar repo, estructura base, arrancar, crear proyecto, primera configuracion.
- Patrones de usuario: "arranca este proyecto", "bootstrap inicial", "estructura base", "primeros pasos", "inicia el repo".
- Encadenamiento: despues de `definir-producto` si la idea aun es difusa; antes de `definir-arquitectura` y `definir-reglas-proyecto`; llama a `generar-bat-interactivo` si el stack lo justifica; si el proyecto dockeriza, derivar a `estandarizar-docker-local`; `gestionar-roadmap` y `ordenar-archivos` entran despues si hace falta.

# Ejemplos de activacion

- "Arranca este proyecto desde cero y dejalo listo para empezar a trabajar con estructura, SSOT y documentacion base."
- "Este repo ya tiene `src/` y `README.md`; completa la base operativa sin duplicar lo que ya funciona."
