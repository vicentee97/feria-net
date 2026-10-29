---
name: estandarizar-docker-local
description: "Usar cuando vayas a dockerizar un proyecto, definir un stack Docker local reproducible o limpiar entornos heredados en Windows sin romper lo que ya funciona, normalizando stacks, persistencia y nombres. TRIGGERS: docker, contenedor, compose, stack docker, limpiar docker, dockerizar, Dockerfile."
---

# Estandarizar Docker Local

# Objetivo

Dejar el uso de Docker de un proyecto en un estado canonico, trazable y mantenible. La skill decide si Docker aporta valor real, define donde vive el stack y sus datos, impone convenciones claras de nombres y documentacion, y sanea legado de forma conservadora cuando ya exista caos previo.

La skill existe para blindar el anti-patron mas critico: hardcoded paths y configuracion no portable. Cualquier ruta absoluta del host (Windows, Linux o macOS) debe declararse como preferencia del proyecto en su SSOT, no como constante dentro de la skill.

# Anti-patrones y su correccion

Cada sesgo del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Docker por moda (D1):** MAL dockerizar todo por defecto porque "es lo moderno". BIEN decidir primero si Docker aporta valor real; concluir sin Docker es un resultado valido. EJEMPLO ante `dockeriza esto` -> si el proyecto usa solo SQLite local y un CLI, recomendar servicio nativo y no forzar compose.
- **Path hardcoded no portable (D2, critico):** MAL escribir rutas absolutas del host (`D:\Programacion\docker\<stack>`, `C:\...`, `/Users/...`) dentro de la skill o del `compose.yaml`. BIEN declarar la ruta del stack centralizado como preferencia en la SSOT local (p.ej. `docker.host_stack_root`) y referenciarla como variable/placeholder en compose y docs. EJEMPLO el `compose.yaml` de n8n usa `${HOST_STACK_ROOT}/n8n` y `docs/SSOT.md` define `HOST_STACK_ROOT` para esa maquina; otra maquina solo cambia el valor en `.env`.
- **Volumenes anonimos (D3):** MAL usar `docker run` con volúmenes anonimos como solucion principal porque "funciona". BIEN favorecer bind mounts visibles cuando el dato importe y deba localizarse o respaldarse; reservar volumenes anonimos para necesidad transitoria justificada. EJEMPLO datos de n8n -> bind mount visible; cache temporal de build -> volumen anonimo declarado.
- **Renombrar caos en caliente (D4):** MAL renombrar/eliminar recursos heredados sin backup. BIEN hacer backup antes de cualquier migracion destructiva, recrear stack canonico y validar antes de retirar lo viejo. EJEMPLO stack `n8n_viejo` -> backup de datos, crear `n8n-local` canonico, validar, y solo entonces retirar el viejo.
- **Persistencia opaca no localizable (D5):** MAL dejar datos en volumenes opacos sin documentar donde viven. BIEN documentar la estructura de persistencia visible en `docs/docker.md` y referenciarla desde `docs/SSOT.md`. EJEMPLO `docs/docker.md` lista cada stack con su bind mount, tamaño esperado y runbook de backup.
- **Stack centralizado sin documentacion portable (D6):** MAL asumir que la ruta del stack centralizado del host es "evidente" o escribirla como texto en una respuesta. BIEN la ruta vive en `.env.example` (placeholder) + `docs/SSOT.md` (preferencia del proyecto), y el `compose.yaml` solo la referencia por variable. EJEMPLO `.env.example` incluye `# HOST_STACK_ROOT: ruta absoluta del host donde viven stacks operativos (definir en .env local, no versionar)`.

# Alcance y limites
- Aplica al uso de Docker local en Windows con Docker Desktop y PowerShell (tambien portable a Linux/macOS manteniendo la regla anti-path-hardcoded D2).
- Cubre proyectos nuevos y limpieza de stacks heredados.
- Puede concluir que un proyecto no debe usar Docker (anti-patron D1).
- Genera o normaliza `compose.yaml`, `.env.example`, `README.md` y documentacion Docker del proyecto cuando aplique.
- Inventariar contenedores, imagenes, volumenes, puertos y mounts antes de migrar legado.
- No cubre Kubernetes, despliegue cloud ni CI/CD en esta version.
- No sustituye a `configurar-entorno`; la complementa cuando el entorno local depende de Docker.
- NEVER fomenta `docker run` manual ni volumenes anonimos como solucion principal.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- [Skill `crear-skills`](../crear-skills/SKILL.md) como patron de estructura si la skill se modifica o extiende.
- [Skill `configurar-entorno`](../configurar-entorno/SKILL.md) para alinear entorno y Docker cuando ambas apliquen.
- SSOT del proyecto objetivo y `docs/docker.md` si ya existe.
- Estructura real del repositorio y cualquier `compose.yaml`, `Dockerfile`, `.env.example` o documentacion existente.
- Estado real del host Docker cuando se trate de legado: contenedores, volumenes, imagenes, puertos y mounts.
- Preferencia del proyecto `docker.host_stack_root` (ruta del stack centralizado del host, si aplica); si no esta definida en la SSOT local, tratar como pendiente y no asumir valor por defecto hardcoded.

# Comportamiento esperado

La skill empieza inspeccionando el proyecto y el host antes de proponer cambios. Responde estas preguntas antes de mutar nada:
1. ¿Docker aporta valor real o solo anade ruido a este proyecto? (anti-patron D1)
2. ¿Docker es principal, auxiliar o solo dev local?
3. ¿El proyecto usa realmente Docker o depende de servicios nativos?
4. ¿El dato debe ser localizable y respaldable fuera de Docker? (anti-patron D5)
5. ¿El stack canonico debe vivir dentro del repo (autocontenido) o en el stack centralizado del host (definido en SSOT local como `docker.host_stack_root`)?

## Politica base de decision
- Para herramientas o stacks operativos del host que no deban quedar acoplados a un repo concreto (como `n8n`), usar el stack centralizado del host definido en la SSOT local (`docker.host_stack_root`); NEVER escribir la ruta absoluta del host directamente en la skill, el `compose.yaml` o la documentacion versionada (anti-patron D2).
- Para proyectos autocontenidos, usar persistencia dentro del repo para que sea portable y facil de mover junto a su codigo.
- Favorecer bind mounts visibles cuando el dato importe (anti-patron D3).
- Evitar volumenes anonimos salvo necesidad transitoria y justificada.
- No renombrar caos heredado "en caliente" como estrategia principal (anti-patron D4); hacer backup, recrear y validar.

## Convenciones que debe imponer
- Carpeta de stack: nombre corto y claro, por ejemplo `n8n`, `nexo`, `tpvmanager`.
- Nombre del proyecto Compose: `<stack>-local`.
- Contenedor principal: `<stack>-<servicio>`.
- Documentacion minima por stack: `compose.yaml`, `.env.example`, `README.md`.
- Documentacion minima por proyecto: `docs/docker.md` y referencia o bloque en `docs/SSOT.md`.

## Modo A: proyecto nuevo
1. Inspeccionar stack, entorno y necesidad real de contenedores (anti-patron D1).
2. Decidir si Docker aplica.
3. Elegir ubicacion de stack y persistencia; si usa stack centralizado del host, definirlo en la SSOT local y referenciarlo por variable (anti-patron D2).
4. Crear o normalizar `compose.yaml`, nombres, puertos y bind mounts si aplica.
5. Crear `.env.example` sin secretos y con placeholders de rutas del host.
6. Documentar Docker en `docs/docker.md`.
7. Dejar enlazado o resumido el uso de Docker en `docs/SSOT.md`.

## Modo B: legado o limpieza
1. Inventariar contenedores, imagenes, volumenes, redes, puertos y mounts.
2. Clasificar recursos por stack, proyecto o estado huerfano.
3. Detectar colisiones de puertos, volumenes opacos y stacks duplicados.
4. Decidir si Docker debe mantenerse o retirarse.
5. Hacer backup antes de cualquier migracion destructiva (anti-patron D4).
6. Recrear el stack canonico si procede.
7. Validar funcionamiento real.
8. Retirar recursos heredados solo despues de confirmar.

## Que documentacion debe dejar
**En el stack:** `compose.yaml`, `.env.example`, `README.md`, estructura de persistencia visible.

**En el proyecto:** `docs/docker.md` con: si usa Docker o no; para que lo usa; ruta del stack (resuelta via variable/placeholder, no hardcoded); persistencia; puertos; runbook basico. Referencia desde `docs/SSOT.md` para que Docker no quede como conocimiento implicito (anti-patron D5).

Debe aplicar `documentar-con-criterio` para decidir si Docker necesita guia propia o si basta con un bloque canonico corto en `docs/SSOT.md`.

## Casos que debe resolver correctamente
- Proyecto nuevo con PostgreSQL en Docker y datos dentro del repo.
- Herramienta del host con datos centralizados: la ruta del host se define en SSOT local y se referencia por variable (anti-patron D2).
- Proyecto con contenedores y volumenes heredados sin convencion.
- Proyecto que realmente usa servicio nativo y debe salir de Docker (anti-patron D1).
- Colisiones de puertos locales.
- Host sin volumenes visibles porque el stack usa bind mounts.

## Relacion con otras skills
- `configurar-entorno` define el entorno operativo general; esta skill fija la parte Docker cuando aplique.
- `definir-reglas-proyecto` puede consolidar despues las rutas y comandos canonicos ya aterrizados.
- `validar-calidad` debe entrar al cerrar migraciones o cambios con riesgo operativo.
- `mantener-cerebro-operativo` puede revisar mas adelante que esta skill siga alineada con el hub.

# Flujo recomendado
- [ ] Inspeccionar SSOT, `docs/docker.md`, archivos Docker y estado real del host si hay legado.
- [ ] Decidir si Docker aporta valor real y si debe mantenerse (anti-patron D1).
- [ ] Elegir ubicacion del stack y politica de persistencia; definir rutas del host en SSOT local, no hardcodeadas (anti-patron D2).
- [ ] Normalizar nombres, puertos y artefactos canonicos.
- [ ] Crear o completar `compose.yaml`, `.env.example`, `README.md` y `docs/docker.md` si aplica.
- [ ] Hacer backup antes de cualquier migracion o limpieza destructiva (anti-patron D4).
- [ ] Validar funcionamiento real del stack o del servicio nativo resultante.
- [ ] Resolver gate de auto-cita + gate de segunda IA.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el stack Docker canonizado y verificado, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que decidi primero si Docker aporta valor real y documenté la decision (incluido el caso "no usa Docker", anti-patron D1).
- [ ] **Declaro** que ninguna ruta absoluta del host quedo hardcoded en la skill, el `compose.yaml` ni en docs versionados; las rutas del host viven como variables/placeholders referenciadas desde SSOT local (anti-patron D2).
- [ ] **Declaro** que favorecí bind mounts visibles sobre volumenes anonimos y justifique los anonimos que mantuve (anti-patron D3).
- [ ] **Declaro** que ante legado hice backup antes de cualquier migracion destructiva (anti-patron D4), citando el artefacto de backup.
- [ ] **Declaro** que la estructura de persistencia esta documentada en `docs/docker.md` y referenciada desde `docs/SSOT.md` (anti-patron D5).
- [ ] **Declaro** que el stack arranca y responde (verificacion funcional real: `docker compose up`, `docker compose ps`,Healthcheck verde o comando de servicio).
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que dockeriza no es el que califica. Antes de cerrar:

- **Stack nuevo o migracion de legado con persistencia** -> delegar OBLIGATORIAMENTE a **@qa-validador** para validar que el stack arranca (`docker compose up`), los servicios responden y los bind mounts son legibles.
- **Migracion destructiva (borrar recursos heredados)** -> delegar OBLIGATORIAMENTE a **@qa-validador** para confirmar que el backup existe y los datos criticos sobreviven a la recreacion.
- **Stack que toca secretos, auth o red expuesta** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad** antes de cerrar.
- **Proyecto donde la conclusion fue "no usar Docker"** -> sin segunda IA obligatoria (no burocracia innecesaria); la verificacion se reduce a confirmar que el servicio nativo funciona.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: docker, contenedor, compose, stack docker, limpiar docker, dockerizar, Dockerfile
- Patrones de usuario: "ordena el docker", "audita los contenedores", "dockeriza esto", "limpia stacks heredados", "decide si necesita docker"
- Encadenamiento: despues de `configurar-entorno`, antes de `configurar-github`

# Ejemplos de activacion
"Ordena el uso de Docker de este proyecto y deja stack, persistencia y documentacion en un estado canonico."

"Este repo tiene Docker heredado y contenedores raros; auditalo y dejalo profesional sin romper nada."

"Decide si este proyecto realmente necesita Docker o si debo quedarme con servicios nativos."
