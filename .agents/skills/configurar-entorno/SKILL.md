---
name: configurar-entorno
description: "Usar al arrancar un proyecto en una maquina nueva, cuando el setup local falla o se quiere dejar documentado el entorno operativo (prerequisitos, runtimes, variables, servicios y comandos) para reproducirlo entre maquinas. TRIGGERS: entorno, setup, prerequisitos, configuracion local, reproducible, instalar, dependencias, arrancar proyecto."
---

# Configurar entorno

# Objetivo

Definir y dejar documentado el entorno local minimo reproducible de un proyecto: que necesita para ejecutarse, variables de entorno, prerequisitos, servicios auxiliares y comandos de setup y uso, teniendo en cuenta diferencias relevantes entre x64 y ARM cuando afecten a la experiencia real.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Asumir runtime sin evidencia:** MAL documentar `npm install` o `pip install -r requirements.txt` sin leer `package.json`/`requirements.txt`. BIEN inspeccionar configs reales antes de fijar cualquier comando. EJEMPLO un repo sin `package.json` -> omitir el comando Node, no inventarlo.
- **Secretos en `.env.example`:** MAL copiar valores reales (API keys, tokens, passwords) en `.env.example`. BIEN placeholders y comentarios utiles, nunca secretos. EJEMPLO `DATABASE_URL=postgres://usuario:contrasena@localhost:5432/mi_db` -> `DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB`.
- **Asumir ARM = x64:** MAL documentar un setup unico como si corriera igual en cualquier CPU. BIEN comprobar runtimes/binarios/SDKs/librerias nativas que puedan variar y documentar workarounds. EJEMPLO un binario nativo x64 que falla en ARM -> anotar la incompatibilidad y la ruta recomendada.
- **Duplicar setup en varios sitios:** MAL escribir el mismo bloque de setup en `docs/SSOT.md`, `README.md` y `docs/setup.md`. BIEN una sola fuente canonica (SSOT por defecto) y enlaces breves. EJEMPLO el README enlaza a la seccion de entorno del SSOT en vez de repetir los comandos.
- **Instalar por iniciativa propia:** MAL correr `npm install`, `pip install` o aprovisionar infraestructura desde esta skill. BIEN documentar el comando; la instalacion la hace el usuario o el agente ejecutor bajo brief. EJEMPLO la skill deja `npm install` como paso documentado, no lo ejecuta.

# Alcance y limites

- Define y documenta entorno local, runtimes, prerequisitos, `.env.example`, servicios externos requeridos y comandos de arranque.
- Detecta incompatibilidades o riesgos por arquitectura de CPU y deja el terreno preparado para scripts de uso diario.
- No instala dependencias ni aprovisiona infraestructura por si sola.
- No sustituye a `arrancar-proyecto`, `generar-bat-interactivo` ni `configurar-mcp` (capas distintas aunque relacionadas).
- No mezcla decisiones de arquitectura del sistema con decisiones de entorno operativo.

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md), [reglas globales](../docs/AI_GLOBAL_RULES.md) y [skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- Stack detectable, archivos de configuracion reales y dependencias locales detectables.
- Servicios externos requeridos e informacion relevante sobre arquitectura de CPU si el toolchain puede variar.

# Comportamiento esperado

Empezar inspeccionando archivos reales del proyecto para detectar runtimes, gestores de paquetes, contenedores, servicios locales y variables esperadas. Si obliga a tocar muchos archivos, aplicar cambios por bloques pequenos y coherentes.

Flujo: **detectar -> repartir -> documentar -> handoff**.

1. Identificar prerequisitos minimos para ejecutar el proyecto.
2. Repartir contenido: lo canonico (runtimes, prerequisitos, comandos) en `docs/SSOT.md`; lo sensible (variables requeridas) en `.env.example`. Aplicar `documentar-con-criterio` para no duplicar.
3. Detectar incompatibilidades o advertencias ARM frente a x64 cuando el stack pueda variar.
4. Dejar comandos de setup y uso claros sin inventar nada no respaldado por el proyecto.
5. Tras documentar el entorno, materializar `dev.bat` ejecutando `generar-bat-interactivo` con la informacion ya normalizada.

## Que debe cubrir el entorno como minimo

Runtime(s) y versiones; gestor(es) de paquetes; variables de entorno requeridas; servicios o dependencias locales; comandos base de setup/dev/build/test si existen; archivos sensibles que no deben versionarse; diferencias relevantes por sistema o arquitectura cuando apliquen.

## Politica de `.env.example`

Favorecer `.env.example` cuando haya variables requeridas; incluir placeholders y comentarios utiles, no secretos; alinear el contenido con lo que el proyecto realmente necesita.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el entorno documentado, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione archivos reales (`package.json`, `requirements.txt`, `Dockerfile`, configs) antes de fijar cualquier runtime, gestor o comando (no defaults de memoria).
- [ ] **Declaro** que el entorno queda documentado en una sola fuente canonica (SSOT por defecto) y que `.env.example` no contiene secretos, solo placeholders utiles.
- [ ] **Declaro** que trate ARM/x64 como comprobacion real cuando el stack pueda variar, documentando incompatibilidades o workarounds conocidos; si no aplica, lo deje declarado.
- [ ] **Declaro** que NO ejecute `npm install`, `pip install` ni aprovisione infraestructura por iniciativa propia (la instalacion la hace el usuario o el agente ejecutor).
- [ ] **Declaro** que los comandos de setup/dev/build/test documentados estan respaldados por evidencia del proyecto.
- [ ] **Declaro** que el handoff a `generar-bat-interactivo` queda preparado con la informacion normalizada (runtimes, gestores, comandos).

# Flujo recomendado

- [ ] Inspeccionar stack, archivos de configuracion y dependencias detectables.
- [ ] Identificar prerequisitos minimos y variables requeridas.
- [ ] Revisar compatibilidad x64/ARM cuando aplique.
- [ ] Documentar setup y comandos en `docs/SSOT.md` (fuente unica).
- [ ] Crear o completar `.env.example` si hace falta (placeholders, no secretos).
- [ ] Dejar preparada la informacion para `generar-bat-interactivo` y resolver el gate de auto-cita.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers

- Keywords: entorno, setup, prerequisitos, configuracion local, reproducible, instalar, dependencias, arrancar.
- Patrones de usuario: "configura el entorno", "que necesito instalar", "documenta los prerequisitos", "setup del proyecto".
- Encadenamiento: despues de `definir-arquitectura` y `arrancar-proyecto`; antes de `configurar-testing`, `generar-bat-interactivo` y `estandarizar-docker-local` si el proyecto dockeriza; hermana de `configurar-mcp` (entorno del agente/IDE, capa distinta).

# Ejemplos de activacion

- "Configura y documenta el entorno local de este proyecto, incluyendo prerequisitos, variables y diferencias relevantes entre equipos."
- "El setup falla en el portatil ARM; revisa compatibilidad y deja documentado el workaround."
