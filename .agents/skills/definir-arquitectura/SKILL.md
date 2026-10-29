---
name: definir-arquitectura
description: "Usar cuando haya que decidir stack, modulos, capas, limites, versiones o cualquier arquitectura dificil de revertir, y necesites analizar el contexto real del proyecto antes de proponer y documentar la opcion. TRIGGERS: arquitectura, stack, capas, modulos, decisiones tecnicas, estructura tecnica, que framework."
---

# Definir Arquitectura

# Objetivo

Convertir el contexto real de una aplicacion en una arquitectura tecnica explicita, defendible y documentada.

La skill analiza el producto, las restricciones, la madurez del proyecto, el stack detectable y las necesidades no funcionales para recomendar la mejor arquitectura, documentarla en `docs/SSOT.md` y crear ADRs solo cuando existan decisiones importantes o dificiles de revertir.

La accion dominante es **proponer arquitectura dificil de revertir solo tras inspeccionar el contexto real**, no a partir de defaults de memoria.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Sobrearquitectura:** MAL montar microservicios, colas, mensajeria o multi-tenant para un CRUD interno de poco trafico. BIEN favorecer simplicidad y modular monolith mientras no haya una necesidad real. EJEMPLO un panel admin interno queda en monolito modular Next.js + Postgres; separar servicios llega cuando el dominio o la escala lo justifiquen, no antes.
- **Diseno fragil por moda:** MAL elegir stack por "lo que se lleva" o por preferencia del modelo sin cruzar restricciones de equipo, coste o despliegue. BIEN justificar cada decision con el contexto real del proyecto. EJEMPLO "elijo edge runtime porque el equipo conoce X y el despliegue es Y", no "porque edge es moderno".
- **Reescritura arbitraria:** MAL tirar lo existente defendible porque encaja mal con la idea nueva. BIEN respetar lo que ya funciona y proponer una ruta de enderezamiento progresiva. EJEMPLO un proyecto a medio arrancar conserva su capa de datos si es defendible y se introducen limites claros en lugar de reescribir desde cero.
- **Latest sin estable:** MAL apostar por versiones bleeding-edge o beta sin asentar para un stack base. BIEN preferir versiones estables recientes; ante tension `latest` vs `estable`, priorizar estabilidad razonable. EJEMPLO para framework base elegir la estable mas reciente con soporte a largo plazo, no la RC.
- **Documentacion inflada:** MAL crear ADRs por defecto para cada decision menor o duplicar la SSOT en documentos paralelos. BIEN ADRs solo para decisiones costosas de revertir, y aplicar `documentar-con-criterio` antes de añadir detalle. EJEMPLO un cambio de `content` de Tailwind no genera ADR; la eleccion monolito vs servicios si.

# Alcance y limites

- Define estructura tecnica, modulos, limites entre capas, patrones, integraciones y criterios de seleccion tecnologica.
- Puede recomendar stack, runtime, framework, base de datos, estrategia de estado o despliegue si el contexto lo requiere.
- Orienta la eleccion de versiones hacia opciones estables recientes.
- No implementa codigo ni instala dependencias; no reemplaza la documentacion funcional del dominio.
- No sustituye a `arrancar-proyecto` (prepara el repo), `definir-reglas-proyecto` (concreta rutas/comandos/operativa) ni futuras skills de testing, entorno u observabilidad (deja claras sus necesidades de integracion).

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio y documentacion existente.
- Stack detectable en archivos y configuracion.
- Requisitos funcionales y no funcionales conocidos.
- Documentacion tecnica vigente cuando este disponible (preferentemente via Context7 si esta configurado; si no, documentacion oficial directa y dejar el fallback declarado).

# Comportamiento esperado

La skill empieza inspeccionando el repositorio y la documentacion antes de proponer nada. Despues resuelve, como minimo: tipo real de aplicacion, restricciones (tecnicas, equipo, tiempo, coste, despliegue), partes que necesitan escalar o aislarse, tecnologia ya existente digna de respeto, y que decisiones son estructurales frente a aplazables.

## Flujo de analisis por capas
1. Inspeccionar repo y documentacion disponible.
2. Identificar tipo de aplicacion, superficie tecnica y restricciones.
3. Detectar variante real (frontend puro, full-stack, backend API, monolito, modular monolith, microservicios u otra).
4. Analizar escalabilidad, mantenibilidad, despliegue, coste, velocidad de iteracion, SEO, tiempo real, auth, integraciones y carga operativa.
5. Proponer 2-3 opciones viables cuando la decision no sea obvia.
6. Recomendar una arquitectura y justificarla con pros, contras y riesgos.
7. Documentar la decision final en `docs/SSOT.md`.
8. Crear ADRs solo para decisiones importantes o dificiles de revertir.

## Politica de versiones y documentacion
- Revisar documentacion oficial y fuentes primarias del stack candidato cuando la decision dependa de versiones, breaking changes o recomendaciones actuales.
- Si Context7 esta disponible, usarlo como fuente preferente; si no, continuar con documentacion oficial y dejar el fallback declarado. Si el proyecto quiere apoyarse de forma estable en ese MCP, derivar a `configurar-mcp` en lugar de asumir que existe.
- Preferir versiones estables recientes; evitar tecnologias demasiado nuevas sin asentar.
- Documentar la version elegida y el criterio de seleccion cuando esa eleccion impacte la arquitectura.

## Decisiones arquitectonicas minimas que debe cubrir
- Tipo de sistema y topologia general.
- Estructura por modulos, features o capas; separacion dominio/aplicacion/infraestructura/UI cuando aplique.
- Estrategia de datos y persistencia a alto nivel.
- Estrategia de integraciones externas y patron de estado/flujo de datos.
- Autenticacion y autorizacion a alto nivel si aplica.
- Estrategia de despliegue y entornos a nivel conceptual.
- Limites de responsabilidad entre carpetas, modulos o servicios.
- Anti-patrones a evitar en ese proyecto.

## Formato de salida y ADR
La salida principal vive en `docs/SSOT.md`, normalmente en la seccion de arquitectura. La skill puede crear `docs/adr/` solo cuando una decision merezca trazabilidad separada. Antes de añadir ADRs o documentos complementarios, aplicar `documentar-con-criterio` para comprobar que el detalle extra cambia decisiones reales y no duplica la SSOT.

Crea un ADR cuando exista una decision costosa de revertir: framework base, monolito vs servicios, patron de datos critico, frontera cliente/servidor, colas/mensajeria/caching/multi-tenant u otra con impacto estructural prolongado.

## Preguntas que debe resolver antes de cerrar
Quien usa el sistema, nivel de trafico esperado, criticidad del dato, velocidad de entrega frente a robustez, restricciones de hosting/equipo/coste, integraciones externas y tiempo real, y necesidad de SSR, SEO, offline, multitenancy o escalado independiente. Si una de estas no puede inferirse y afecta a una eleccion dificil de revertir, se eleva como pregunta importante **solo si se cumplen a la vez las tres condiciones de la Regla 0.1** (accion irreversible o destructiva, el dueno sabe algo que no se puede inferir del proyecto, y la respuesta cambia el objetivo). En los demas casos se elige la opcion mas defendible con la evidencia disponible, se declara la hipotesis en `docs/SSOT.md` y la arquitectura se cierra igual.

## Ejemplos orientativos
- **CRUD interno poco trafico:** simplicidad + modular monolith + baja carga; evitar microservicios.
- **SaaS con panel y auth:** limites claros frontend/backend/auth/datos/billing; modularidad y despliegue razonable.
- **Frontend + backend separado:** frontera cliente-servidor, contratos, estado e integracion; evitar duplicar logica entre lados.
- **MVP con IA e integraciones:** aislar integraciones, gestion de errores y puntos de fallo externos; nucleo de dominio protegido.
- **Proyecto a medio arrancar:** respetar lo defendible; ruta de enderezamiento progresivo, no reescritura arbitraria.

## Relacion con otras skills
`arrancar-proyecto` prepara el repo; `definir-arquitectura` fija la estructura tecnica; `documentar-con-criterio` marca cuanto detalle merece la SSOT y cuando conviene un ADR; `definir-reglas-proyecto` concreta rutas, comandos y operativa; `configurar-github` gestiona el flujo del repositorio; `elevar-ui-frontend` aplica despues sobre la capa UI cuando exista interfaz.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la arquitectura propuesta como lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione el repositorio, la SSOT y la documentacion existente antes de proponer, y que detecte el stack y la madurez real (no defaults de memoria).
- [ ] **Declaro** que evite cada anti-patron de arriba (sobrearquitectura, diseno fragil por moda, reescritura arbitraria, latest sin estable, documentacion inflada), citando cual aplicaba a este caso concreto.
- [ ] **Declaro** que, cuando hubo eleccion tecnica, contraste fuentes primarias o documentacion oficial vigente y documente la version elegida con criterio.
- [ ] **Declaro** que deje claros los limites entre modulos, capas o servicios y los anti-patrones a evitar en el proyecto.
- [ ] **Declaro** que documente la decision en `docs/SSOT.md` sin inflar y que cree ADRs solo para decisiones costosas de revertir.
- [ ] **Declaro** que eleve como pregunta importante solo las decisiones no inferibles que superen el filtro acumulativo de la Regla 0.1, y que para el resto decida con evidencia, declare la hipotesis en `docs/SSOT.md` y no lo cierre por inercia.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que propone arquitectura no es el que la califica. La arquitectura es lo mas dificil de revertir del proyecto:

- Si la propuesta **fija framework base, topologia (monolito vs servicios), patron de datos critico o frontera cliente/servidor** -> escalar OBLIGATORIAMENTE a **@arquitecto** (si no es el que la carga) y delegar a **@revisor** para revision de riesgo antes de entregar la decision al usuario o de implementar.
- Si la propuesta **toca auth, permisos, secretos, RLS o datos sensibles** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad**.
- Si la propuesta es una **mejora local sin frontera estructural** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Flujo recomendado

- [ ] Inspeccionar repositorio, SSOT y documentacion existente.
- [ ] Detectar stack, restricciones y madurez real del proyecto.
- [ ] Identificar decisiones arquitectonicas importantes y separarlas de las menores.
- [ ] Consultar documentacion oficial y, si esta disponible, Context7 para versiones y recomendaciones vigentes.
- [ ] Comparar alternativas cuando la decision no sea obvia.
- [ ] Recomendar una arquitectura con justificacion clara.
- [ ] Documentar la decision en `docs/SSOT.md`; ADRs solo para decisiones estructurales de alto impacto.
- [ ] Resolver el gate de auto-cita y el gate de segunda IA.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header. La senal observable es que la arquitectura encaja con el contexto real, evita sobrearquitectura y diseno fragil, deja claras las fronteras y las decisiones dificiles de revertir pasaron por @arquitecto/@revisor.

## Triggers
- Keywords: arquitectura, stack, capas, modulos, decisiones tecnicas, estructura tecnica, que framework
- Patrones de usuario: "define la arquitectura", "que stack usar", "como organizar los modulos", "proponte una arquitectura"
- Encadenamiento: despues de `definir-producto` y `arrancar-proyecto`; antes de `configurar-entorno` y `definir-reglas-proyecto`; hermana de `actuar-como-senior` (decision justificada) y `documentar-con-criterio` (cuanto documentar).

# Ejemplos de activacion
- "Define la arquitectura de este proyecto segun su contexto real, proponiendo la mejor opcion y documentandola con criterio actual."
- "Tenemos un SaaS con panel y auth: como organizo modulos y capas sin sobrearquitectura."
