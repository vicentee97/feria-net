---
name: definir-arquitectura
description: "Analiza el contexto real de un proyecto para proponer y documentar una arquitectura tecnica solida: modulos, capas, stack, limites, versiones y decisiones de alto impacto. TRIGGERS: arquitectura, stack, capas, modulos, decisiones tecnicas, estructura tecnica, que framework."
---

# Objetivo
Convertir el contexto real de una aplicación en una arquitectura técnica explícita, defendible y documentada.

La skill debe analizar el producto, las restricciones, la madurez del proyecto, el stack detectable y las necesidades no funcionales para recomendar la mejor arquitectura posible, documentarla en `docs/SSOT.md` y crear ADRs solo cuando existan decisiones importantes o difíciles de revertir.

# Alcance y límites
- Sí define estructura técnica, módulos, límites entre capas, patrones, integraciones y criterios de selección tecnológica.
- Sí puede recomendar stack, runtime, framework, base de datos, estrategia de estado o despliegue si el contexto lo requiere.
- Sí debe orientar la elección de versiones hacia opciones estables recientes.
- No implementa código ni instala dependencias.
- No reemplaza la documentación funcional del dominio.
- No sustituye a `arrancar-proyecto`; se apoya en la base que esa skill deja preparada.
- No sustituye a `definir-reglas-proyecto`; esa skill concreta rutas, comandos y operativa una vez fijada la arquitectura.
- No sustituye a futuras skills de testing, entorno u observabilidad, aunque debe dejar claras sus necesidades de integración.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio.
- Documentación existente del proyecto.
- Stack detectable en archivos y configuración.
- Requisitos funcionales y no funcionales conocidos.
- Acceso a documentación técnica actualizada cuando esté disponible, preferentemente vía Context7.

# Comportamiento esperado
La skill debe empezar inspeccionando el repositorio y la documentación existente antes de proponer ninguna arquitectura.

Después debe resolver, como mínimo, estas preguntas:
- Qué tipo de aplicación es realmente.
- Qué restricciones técnicas, de equipo, tiempo, coste o despliegue existen.
- Qué partes del sistema necesitan escalar, aislarse o mantenerse simples.
- Qué tecnología ya existe y merece respetarse.
- Qué decisiones son estructurales y cuáles pueden aplazarse.

## Flujo de análisis por capas
1. Inspeccionar el repo y la documentación disponible.
2. Identificar el tipo de aplicación, superficie técnica y restricciones.
3. Detectar si el proyecto es frontend puro, full-stack, backend API, monolito, modular monolith, microservicios u otra variante razonable.
4. Analizar necesidades de escalabilidad, mantenibilidad, despliegue, coste, velocidad de iteración, SEO, tiempo real, autenticación, integraciones y carga operativa.
5. Proponer 2-3 opciones viables cuando la decisión no sea obvia.
6. Recomendar una arquitectura y justificarla con pros, contras y riesgos.
7. Documentar la decisión final en `docs/SSOT.md`.
8. Crear ADRs solo para decisiones importantes o difíciles de revertir.

## Política de versiones y documentación
La skill debe seguir estas reglas:
- revisar documentación oficial y fuentes primarias del stack candidato cuando la decisión dependa de versiones, breaking changes o recomendaciones actuales;
- cuando haya acceso disponible, usar Context7 como fuente preferente para consultar documentación técnica actualizada;
- si Context7 no está disponible, continuar con documentación oficial directa o fuentes primarias equivalentes;
- preferir versiones estables recientes;
- evitar tecnologías o versiones demasiado nuevas si todavía no están asentadas;
- si hay tensión entre `latest` y `estable`, priorizar estabilidad razonable sin quedarse claramente atrás;
- documentar la versión elegida y el criterio de selección cuando esa elección impacte la arquitectura.

## Nota sobre Context7
La skill debe asumir que puede existir acceso futuro al servidor MCP de Context7.

Si está disponible, debe usarse para validar:
- frameworks;
- runtimes;
- librerías clave;
- breaking changes;
- recomendaciones vigentes de arquitectura o integración.

Si todavía no está configurado, la skill no debe bloquearse: debe continuar con documentación oficial y dejar claro ese fallback.
Si el proyecto, la tarea o la sesión quieren apoyarse de forma estable en ese MCP, debe indicar el hueco y derivar a `configurar-mcp` en lugar de asumir que ya existe.

## Decisiones arquitectónicas mínimas que debe cubrir
- Tipo de sistema y topología general.
- Estructura por módulos, features o capas.
- Separación entre dominio, aplicación, infraestructura y UI cuando aplique.
- Estrategia de datos y persistencia a alto nivel.
- Estrategia de integraciones externas.
- Patrón de estado y flujo de datos.
- Autenticación y autorización a alto nivel si aplica.
- Estrategia de despliegue y entornos a nivel conceptual.
- Límites de responsabilidad entre carpetas, módulos o servicios.
- Anti-patrones a evitar en ese proyecto.

## Formato de salida
La salida principal debe vivir en `docs/SSOT.md`, normalmente dentro de la sección de arquitectura.

La skill puede crear `docs/adr/` solo cuando una decisión merezca trazabilidad separada. No debe generar documentación excesiva por defecto.

Antes de añadir ADRs o documentos complementarios, debe aplicar `documentar-con-criterio` para comprobar que el detalle extra cambia decisiones reales y no duplica la SSOT.

## Cuándo crear ADR
Crea un ADR cuando exista una decisión:
- costosa de revertir;
- sobre framework base;
- sobre monolito vs servicios;
- sobre patrón de datos crítico;
- sobre frontera cliente/servidor;
- sobre colas, mensajería, caching o multi-tenant;
- o cualquier otra con impacto estructural prolongado.

## Relación con otras skills
- `arrancar-proyecto` prepara el repositorio.
- `definir-arquitectura` fija la estructura técnica.
- `documentar-con-criterio` marca cuánto detalle arquitectónico merece vivir en la SSOT y cuándo conviene un ADR separado.
- `definir-reglas-proyecto` concreta rutas, comandos y operativa sobre esa arquitectura.
- `configurar-github` se encarga del flujo del repositorio y la publicación.
- `elevar-ui-frontend` aplica después sobre la capa UI cuando exista interfaz.

## Ejemplos operativos
### App web CRUD interna con poco tráfico
- Favorecer simplicidad, modular monolith y baja carga operativa.
- Evitar microservicios o separación prematura.

### SaaS con panel y autenticación
- Definir límites claros entre frontend, backend, auth, datos y billing si aplica.
- Priorizar mantenibilidad, separación modular y despliegue razonable.

### Frontend con backend separado
- Definir frontera cliente-servidor, contratos, estado y estrategia de integración.
- Evitar duplicar lógica entre ambos lados.

### MVP con IA e integraciones externas
- Aislar integraciones, gestión de errores y puntos de fallo externos.
- Mantener el núcleo del dominio protegido del ruido de proveedores.

### Proyecto parcialmente iniciado que necesita ordenar su arquitectura
- Respetar lo que ya existe cuando sea defendible.
- Evitar reescrituras arbitrarias.
- Proponer una ruta de enderezamiento progresiva.

## Preguntas importantes que debe resolver
Antes de fijar la arquitectura, la skill debe intentar responder:
- quién usa el sistema;
- nivel de tráfico esperado;
- criticidad del dato;
- velocidad de entrega frente a robustez;
- restricciones de hosting, equipo o coste;
- integraciones externas y requisitos de tiempo real;
- necesidad de SSR, SEO, offline, multitenancy o escalado independiente.

Si una de estas decisiones no puede inferirse y afecta a una elección difícil de revertir, la skill debe elevarla como pregunta importante antes de cerrar la arquitectura.

# Flujo recomendado
- [ ] Inspeccionar repositorio, SSOT y documentación existente.
- [ ] Detectar stack, restricciones y madurez real del proyecto.
- [ ] Identificar decisiones arquitectónicas importantes y separarlas de las menores.
- [ ] Consultar documentación oficial y, si está disponible, Context7 para versiones y recomendaciones vigentes.
- [ ] Comparar alternativas cuando la decisión no sea obvia.
- [ ] Recomendar una arquitectura con justificación clara.
- [ ] Documentar la decisión en `docs/SSOT.md`.
- [ ] Crear ADRs solo para decisiones estructurales de alto impacto.

# Criterio de resultado bueno
La skill está bien aplicada si:
- la arquitectura propuesta encaja con el contexto real del producto;
- evita tanto la sobrearquitectura como el diseño frágil;
- usa criterios actuales y razonables de versiones y documentación;
- deja claras las fronteras entre módulos, capas o servicios;
- documenta en `docs/SSOT.md` lo importante sin inflar la documentación;
- y crea ADRs solo cuando la decisión lo justifica de verdad.

## Triggers
- Keywords: arquitectura, stack, capas, modulos, decisiones tecnicas, estructura tecnica, que framework
- Patrones de usuario: "define la arquitectura", "que stack usar", "como organizar los modulos", "proponte una arquitectura"
- Encadenamiento: despues de `definir-producto`, antes de `configurar-entorno` y `definir-reglas-proyecto`

# Ejemplos de activación
"Define la arquitectura de este proyecto según su contexto real, proponiendo la mejor opción y documentándola con criterio actual."

