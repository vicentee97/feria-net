---
name: configurar-entorno
description: "Define y documenta el entorno operativo local de un proyecto: prerequisitos, runtimes, variables, servicios auxiliares y comandos de setup para dejarlo reproducible entre maquinas. TRIGGERS: entorno, setup, prerequisitos, configuracion local, reproducible, instalar, dependencias, arrancar proyecto."
---

# Objetivo
Definir y dejar documentado el entorno local mínimo reproducible de un proyecto.

La skill debe detectar qué necesita el proyecto para ejecutarse, fijar variables de entorno, prerequisitos y servicios auxiliares, dejar claros los comandos de setup y uso, y tener en cuenta diferencias relevantes entre x64 y ARM cuando afecten a la experiencia real.

# Alcance y límites
- Sí define y documenta entorno local, runtimes, prerequisitos, `.env.example`, servicios externos requeridos y comandos de arranque.
- Sí puede detectar incompatibilidades o riesgos por arquitectura de CPU.
- Sí puede dejar el terreno preparado para scripts de uso diario.
- No instala dependencias ni aprovisiona infraestructura por sí sola.
- No sustituye a `arrancar-proyecto`.
- No sustituye a `generar-bat-interactivo`, aunque debe dejar información útil para esa skill.
- No sustituye a `configurar-mcp`; el entorno local y el tooling MCP del agente/IDE son capas distintas aunque relacionadas.
- No debe mezclar decisiones de arquitectura del sistema con decisiones de entorno operativo.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio.
- Stack detectable.
- Archivos de configuración reales.
- Servicios externos y dependencias locales detectables.
- Información relevante sobre arquitectura de CPU si el entorno o el toolchain pueden variar.

# Comportamiento esperado
La skill debe empezar inspeccionando archivos reales del proyecto para detectar runtimes, gestores de paquetes, contenedores, servicios locales y variables esperadas.

Si la configuración del entorno obliga a tocar muchos archivos o documentos, aplica los cambios por bloques pequeños y coherentes para evitar parches gigantes y reintentos frágiles.

Después debe:
1. Identificar prerequisitos mínimos para ejecutar el proyecto.
2. Decidir qué parte del entorno debe documentarse en `docs/SSOT.md` y qué parte debe vivir en `.env.example`.
3. Detectar posibles incompatibilidades o advertencias específicas para ARM frente a x64.
4. Dejar comandos de setup y uso claros sin inventar nada no respaldado por el proyecto.
5. Señalar la relación con scripts o menú `.bat` cuando aporte valor real.
6. Tras documentar el entorno, materializar `dev.bat` ejecutando `generar-bat-interactivo` con la informacion de runtimes, gestores y comandos ya normalizada.

Al repartir el contenido entre `docs/SSOT.md`, `.env.example` y documentación adicional, debe aplicar `documentar-con-criterio` para evitar duplicar setup, secretos o microdetalles operativos.

## Compatibilidad ARM/x64
La skill debe tratar la arquitectura de CPU como una comprobación real cuando el stack pueda variar por plataforma.

Debe:
- comprobar si runtimes, binarios, SDKs, librerías nativas o herramientas del proyecto pueden comportarse distinto en ARM;
- documentar incompatibilidades conocidas o sospechas razonables;
- proponer alternativas o advertencias cuando algo no sea igual de estable en ARM;
- no asumir que el proyecto correrá igual en ambos equipos sin verificación contextual.

## Qué debe cubrir el entorno como mínimo
- Runtime(s) y versiones.
- Gestor(es) de paquetes.
- Variables de entorno requeridas.
- Servicios o dependencias locales necesarias.
- Comandos base de setup, dev, build y test si existen.
- Archivos sensibles que no deben versionarse.
- Diferencias relevantes por sistema o arquitectura cuando apliquen.

## Política de `.env.example`
- Favorecer la existencia de `.env.example` o equivalente cuando haya variables requeridas.
- Incluir placeholders y comentarios útiles, no secretos.
- Evitar copiar valores reales o sensibles.
- Alinear el contenido con lo que el proyecto realmente necesita.

## Formato de salida
La salida principal debe actualizar `docs/SSOT.md` con una sección de entorno o setup.

La skill puede crear o completar `.env.example` cuando falte o esté incompleto.

Solo debe generar documentación adicional en `docs/` si el entorno es lo bastante complejo como para necesitar más detalle que el SSOT.

## Relación con otras skills
- `arrancar-proyecto` prepara el repositorio.
- `definir-arquitectura` define la estructura técnica.
- `configurar-entorno` define cómo ejecutar y mantener el proyecto localmente.
- `documentar-con-criterio` decide cuánto detalle documental merece realmente el entorno y en qué artefacto debe vivir.
- `configurar-mcp` entra después cuando el flujo del proyecto depende de MCPs del agente o del IDE.
- `generar-bat-interactivo` puede apoyarse después en esta información para construir un menú útil.
- Esta skill alimenta `generar-bat-interactivo` con comandos base y contexto. Tras `configurar-entorno` viene `generar-bat-interactivo` para crear el `dev.bat` canonico.
- `configurar-testing` y `validar-calidad` dependen de que el entorno y comandos estén bien definidos.

## Qué detectar antes de decidir el entorno
- Runtimes y versiones.
- Gestores de paquetes.
- Dependencias nativas.
- Necesidad de contenedores.
- Servicios externos obligatorios.
- Credenciales, tokens y variables requeridas.
- Posibles diferencias por Windows x64 frente a Windows ARM.

## Ejemplos operativos
### Proyecto Node
- Documentar runtime, gestor de paquetes, `npm install` o equivalente y `.env.example`.

### Proyecto Python
- Documentar `venv`, dependencias, variables locales y comandos de ejecución.

### Proyecto full-stack con frontend, backend y base de datos
- Dejar claros prerequisitos, orden de arranque y dependencias locales.

### Proyecto con Docker opcional
- Diferenciar claramente entre setup local nativo y alternativa con contenedores.

### Proyecto con diferencias entre x64 y ARM
- Añadir advertencias específicas, workarounds o rutas recomendadas según la arquitectura.

# Flujo recomendado
- [ ] Inspeccionar stack, archivos de configuración y dependencias detectables.
- [ ] Identificar prerequisitos mínimos y variables requeridas.
- [ ] Revisar compatibilidad entre x64 y ARM cuando aplique.
- [ ] Documentar setup y comandos en `docs/SSOT.md`.
- [ ] Crear o completar `.env.example` si hace falta.
- [ ] Dejar preparada la información que `generar-bat-interactivo` podría reutilizar después.

# Criterio de resultado bueno
La skill está bien aplicada si:
- el proyecto queda documentado para poder arrancar en local con claridad;
- existen variables y prerequisitos bien descritos;
- ARM y x64 quedan tratados cuando haya diferencias relevantes;
- `.env.example` no contiene secretos y sí contexto útil;
- y la base creada sirve también para automatizaciones o scripts posteriores sin duplicar responsabilidades.

## Triggers
- Keywords: entorno, setup, prerequisitos, configuracion local, reproducible, instalar, dependencias, arrancar
- Patrones de usuario: "configura el entorno", "que necesito instalar", "documenta los prerequisitos", "setup del proyecto"
- Encadenamiento: despues de `definir-arquitectura`, antes de `configurar-testing` y `generar-bat-interactivo`

# Ejemplos de activación
"Configura y documenta el entorno local de este proyecto, incluyendo prerequisitos, variables y diferencias relevantes entre equipos."

