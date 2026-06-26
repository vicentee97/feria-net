---
name: estandarizar-docker-local
description: "Decide, normaliza y documenta el uso de Docker local en Windows: stacks, persistencia, nombres canonicos y limpieza prudente de entornos heredados sin romper lo que funciona. TRIGGERS: docker, contenedor, compose, stack docker, limpiar docker, dockerizar, Dockerfile."
---

# Objetivo
Dejar el uso de Docker de un proyecto en un estado canónico, trazable y mantenible.

La skill debe decidir si Docker aporta valor real, definir dónde vive el stack y sus datos, imponer convenciones claras de nombres y documentación, y sanear legado de forma conservadora cuando ya exista caos previo.

# Alcance y límites
- Aplica al uso de Docker local en Windows con Docker Desktop y PowerShell.
- Sí cubre proyectos nuevos y limpieza de stacks heredados.
- Sí puede concluir que un proyecto no debe usar Docker.
- Sí debe generar o normalizar `compose.yaml`, `.env.example`, `README.md` y documentación Docker del proyecto cuando aplique.
- Sí debe inventariar contenedores, imágenes, volúmenes, puertos y mounts antes de migrar legado.
- No cubre Kubernetes, despliegue cloud ni CI/CD en esta versión.
- No sustituye a `configurar-entorno`; la complementa cuando el entorno local depende de Docker.
- No debe fomentar `docker run` manual ni volúmenes anónimos como solución principal.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [Skill `crear-skills`](../crear-skills/SKILL.md) como patrón de estructura si la skill se modifica o extiende.
- [Skill `configurar-entorno`](../configurar-entorno/SKILL.md) para alinear entorno y Docker cuando ambas apliquen.
- SSOT del proyecto objetivo y `docs/docker.md` si ya existe.
- Estructura real del repositorio y cualquier `compose.yaml`, `Dockerfile`, `.env.example` o documentación existente.
- Estado real del host Docker cuando se trate de legado: contenedores, volúmenes, imágenes, puertos y mounts.

# Comportamiento esperado
La skill debe empezar inspeccionando el proyecto y el host antes de proponer cambios.

Debe responder estas preguntas antes de mutar nada:
1. ¿Docker aporta valor real o solo añade ruido a este proyecto?
2. ¿Docker es principal, auxiliar o solo dev local?
3. ¿El proyecto usa realmente Docker o depende de servicios nativos?
4. ¿El dato debe ser localizable y respaldable fuera de Docker?
5. ¿El stack canónico debe vivir dentro del repo o en `D:\Programación\docker\<stack>`?

## Política base de decisión
- Usar `D:\Programación\docker\<stack>` para herramientas o stacks operativos del host que no deban quedar acoplados a un repo concreto, como `n8n`.
- Usar persistencia dentro del repo cuando el proyecto deba ser autocontenido, portable y fácil de mover junto a su código.
- Favorecer bind mounts visibles cuando el dato importe y deba localizarse o respaldarse fácil.
- Evitar volúmenes anónimos salvo necesidad transitoria y justificada.
- No renombrar caos heredado "en caliente" como estrategia principal; hacer backup, recrear y validar.

## Convenciones que debe imponer
- Carpeta de stack: nombre corto y claro, por ejemplo `n8n`, `nexo`, `tpvmanager`.
- Nombre del proyecto Compose: `<stack>-local`.
- Contenedor principal: `<stack>-<servicio>`.
- Documentación mínima por stack: `compose.yaml`, `.env.example`, `README.md`.
- Documentación mínima por proyecto: `docs/docker.md` y referencia o bloque en `docs/SSOT.md`.

## Modo A: proyecto nuevo
Cuando Docker todavía no está definido o debe arrancarse bien desde cero, la skill debe:
1. inspeccionar stack, entorno y necesidad real de contenedores;
2. decidir si Docker aplica;
3. elegir ubicación de stack y persistencia;
4. crear o normalizar `compose.yaml`, nombres, puertos y bind mounts si aplica;
5. crear `.env.example` sin secretos;
6. documentar Docker en `docs/docker.md`;
7. dejar enlazado o resumido el uso de Docker en `docs/SSOT.md`.

## Modo B: legado o limpieza
Cuando ya existe Docker desordenado, la skill debe:
1. inventariar contenedores, imágenes, volúmenes, redes, puertos y mounts;
2. clasificar recursos por stack, proyecto o estado huérfano;
3. detectar colisiones de puertos, volúmenes opacos y stacks duplicados;
4. decidir si Docker debe mantenerse o retirarse;
5. hacer backup antes de cualquier migración destructiva;
6. recrear el stack canónico si procede;
7. validar funcionamiento real;
8. retirar recursos heredados solo después de confirmar.

## Qué documentación debe dejar
### En el stack
- `compose.yaml`
- `.env.example`
- `README.md`
- estructura de persistencia visible

### En el proyecto
- `docs/docker.md` con:
  - si usa Docker o no;
  - para qué lo usa;
  - ruta del stack;
  - persistencia;
  - puertos;
  - runbook básico.
- referencia desde `docs/SSOT.md` para que Docker no quede como conocimiento implícito.

Debe aplicar `documentar-con-criterio` para decidir si Docker necesita guía propia o si basta con un bloque canónico corto en `docs/SSOT.md`.

## Casos que debe resolver correctamente
- Proyecto nuevo con PostgreSQL en Docker y datos dentro del repo.
- Herramienta del host con datos centralizados en `D:\Programación\docker`.
- Proyecto con contenedores y volúmenes heredados sin convención.
- Proyecto que realmente usa servicio nativo y debe salir de Docker.
- Colisiones de puertos locales.
- Host sin volúmenes visibles porque el stack usa bind mounts.

## Relación con otras skills
- `configurar-entorno` define el entorno operativo general; esta skill fija la parte Docker cuando aplique.
- `definir-reglas-proyecto` puede consolidar después las rutas y comandos canónicos ya aterrizados.
- `validar-calidad` debe entrar al cerrar migraciones o cambios con riesgo operativo.
- `mantener-cerebro-operativo` puede revisar más adelante que esta skill siga alineada con el hub.

# Flujo recomendado
- [ ] Inspeccionar SSOT, `docs/docker.md`, archivos Docker y estado real del host si hay legado.
- [ ] Decidir si Docker aporta valor real y si debe mantenerse.
- [ ] Elegir ubicación del stack y política de persistencia.
- [ ] Normalizar nombres, puertos y artefactos canónicos.
- [ ] Crear o completar `compose.yaml`, `.env.example`, `README.md` y `docs/docker.md` si aplica.
- [ ] Hacer backup antes de cualquier migración o limpieza destructiva.
- [ ] Validar funcionamiento real del stack o del servicio nativo resultante.
- [ ] Documentar el estado final y dejar claras las reglas operativas.

# Criterio de resultado bueno
La skill está bien aplicada si:
- Docker queda con una función clara o se retira explícitamente;
- los datos persistentes son localizables y su estrategia está justificada;
- nombres, puertos y estructura dejan de depender de decisiones improvisadas;
- el proyecto sabe explicar en `docs/` cómo usa Docker y por qué;
- el legado se migra con backup y sin romper lo que funciona.

## Triggers
- Keywords: docker, contenedor, compose, stack docker, limpiar docker, dockerizar, Dockerfile
- Patrones de usuario: "ordena el docker", "audita los contenedores", "dockeriza esto", "limpia stacks heredados", "decide si necesita docker"
- Encadenamiento: despues de `configurar-entorno`, antes de `configurar-github`

# Ejemplos de activación
"Ordena el uso de Docker de este proyecto y deja stack, persistencia y documentación en un estado canónico."

"Este repo tiene Docker heredado y contenedores raros; audítalo y déjalo profesional sin romper nada."

"Decide si este proyecto realmente necesita Docker o si debo quedarme con servicios nativos."
