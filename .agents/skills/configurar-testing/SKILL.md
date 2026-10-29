---
name: configurar-testing
description: "Usar al definir o revisar la estrategia de tests de un proyecto: tipos de test, rutas, comandos, cobertura util y proteccion de comportamientos criticos, con intensidad proporcional al riesgo. TRIGGERS: tests, testing, cobertura, estrategia de test, unit test, integration test, e2e, smoke test."
---

# Configurar Testing

# Objetivo

Convertir el contexto tecnico y funcional del proyecto en una estrategia de testing clara, pragmatica y sostenible. Decidir que tipos de test hacen falta, donde deben vivir, como se ejecutan y que comportamientos merecen proteccion desde el principio. El objetivo no es maximizar tests, sino proteger el riesgo real del proyecto con el minimo conjunto util.

La skill existe para blindar el anti-patron mas tipico: imponer una bateria de tests por dogma sin contexto real, lo que genera cobertura hueca que no protege lo critico.

# Anti-patrones y su correccion

Cada sesgo del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Testing por dogma (D1):** MAL imponer unit + integration + e2e + contract en todos los proyectos sin contexto. BIEN escalar tipos de test al riesgo real: proyectos simples reciben estrategia minima, proyectos con dinero/auth/datos sensibles escalan proteccion. EJEMPLO un CRUD interno sin auth -> unit + integration basico, sin e2e ni contract.
- **Sobredimensionar lo simple (D2):** MAL meter e2e y contract tests en un MVP pequeno. BIEN proponer el primer conjunto minimo valioso y posponer lo que no aporte riesgo real. EJEMPLO MVP con IA: priorizar contract y flujos criticos, no fijar cada salida variable del modelo.
- **Testear lo trivial (D3):** MAL cubrir wiring trivial, getters/setters o UI puramente presentacional sin logica. BIEN priorizar logica con combinatoria, fronteras entre modulos, persistencia y flujos criticos. EJEMPLO saltar getters triviales; cubrir en cambio la validacion de un formulario con reglas complejas.
- **Confundir nivel de test (D4):** MAL usar unit tests para cubrir acceso a base de datos o e2e para logica aislada. BIEN mapear cada comportamiento al tipo correcto (unit = logica aislada, integration = fronteras/DB, e2e = flujos criticos, smoke = arranque, contract = APIs). EJEMPLO frontera modulo-DB -> integration, no unit con mocks dobles.
- **Ignorar arquitectura/convencion existente (D5):** MAL proponer `tests/` cuando el proyecto ya usa `test/` o `__tests__/` de forma coherente. BIEN respetar la convencion coherente del proyecto; solo proponer cambio si hay incoherencia real. EJEMPLO repo Next.js con `__tests__/` funcionando: mantener, no reescribir a `tests/`.
- **Documentacion redundante (D6):** MAL abrir `docs/testing.md` extenso repitiendo la SSOT. BIEN volcar la estrategia en `docs/SSOT.md` y solo abrir doc adicional si aporta mas fases/profundidad que la SSOT, aplicando `documentar-con-criterio`. EJEMPLO estrategia simple -> bloque corto en SSOT, sin doc extra.

# Alcance y limites
- Define estrategia de test, niveles de cobertura, rutas, naming y criterios de criticidad.
- Puede recomendar herramientas de testing si encajan con el contexto real del proyecto.
- Decide que convencion de carpetas es mas coherente con el repo.
- NEVER implementa tests ni instala librerias.
- NEVER obliga a usar todos los tipos de test en todos los proyectos.
- No sustituye a `definir-arquitectura`; se apoya en la arquitectura definida.
- No debe vender testing por dogma: ensea criterio practico.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio, arquitectura ya definida, stack detectable, comandos actuales y comportamiento critico conocido.

# Comportamiento esperado

La skill empieza inspeccionando stack, arquitectura y comandos existentes antes de recomendar cualquier estrategia. Si al aterrizar la estrategia hay que crear varias configuraciones, tests y rutas, no se hace con un unico parche masivo: dividir por bloques forma parte del comportamiento esperado.

Despues: identificar comportamientos criticos y puntos de regresion caros; clasificar necesidades entre unit, integration, e2e, smoke o contract cuando aplique; decidir la estrategia minima util segun riesgo; recomendar herramientas y convenciones solo si encajan con el stack real; y documentar la estrategia final en `docs/SSOT.md`.

## Politica de ubicacion de tests
- `tests/` es la recomendacion por defecto para proyectos nuevos.
- `test/` o `__tests__/` pueden aceptarse si el stack o el proyecto ya estan alineados asi (anti-patron D5).
- Los tests co-localizados solo deben proponerse cuando el framework o la ergonomia del proyecto lo justifiquen claramente.
- `.test` no es una convencion documentada en este repositorio y no debe proponerse como base por defecto.

## Que debe cubrir la estrategia de testing como minimo
Ruta principal de tests; comando base de test; que comportamientos son criticos; que tipo de test protege cada zona importante; que nivel de cobertura inicial es suficiente; y que se pospone legitimamente para no ralentizar el proyecto.

## Politica de pragmatismo
Los proyectos simples no deben recibir estrategia sobredimensionada (anti-patron D2). Los proyectos con logica critica, dinero, autenticacion, integraciones o datos sensibles escalan el nivel de proteccion. Cuando no haya tests aun, la skill propone el primer conjunto minimo valioso, no una bateria idealizada.

## Cuando pedir cada tipo de test
- **Unit:** logica aislada; reglas con combinatoria; transformaciones puras; validaciones con casuistica clara.
- **Integration:** fronteras entre modulos; acceso a base de datos; servicios internos; integraciones relevantes; puntos donde una regresion no se detecta bien con unit tests.
- **E2E:** flujos criticos de negocio; autenticacion; checkout, reserva, agenda, altas o cualquier camino principal del producto; validaciones que solo tienen sentido con el sistema unido.
- **Smoke:** comprobar arranque; validar salud basica; verificar que el sistema no esta roto de forma gruesa tras cambios o despliegues.
- **Contract:** solo si hay APIs o integraciones donde compensa asegurar contratos y el coste de ruptura entre consumidores y proveedores justifica esa capa.

## Que no testear todavia
Wiring trivial; getters, setters o wrappers sin valor propio (anti-patron D3); UI puramente presentacional salvo logica critica; caminos poco valiosos cuando el coste supere claramente el riesgo actual; detalles demasiado variables del comportamiento de un modelo de IA cuando lo importante sea validar contrato, flujo o fallback.

## Formato de salida
La salida principal actualiza `docs/SSOT.md`, especialmente el bloque de tests y validaciones criticas. La skill puede crear un documento adicional en `docs/` solo si la estrategia necesita mas detalle, fases o profundidad que la SSOT; antes de abrir doc adicional aplica `documentar-con-criterio` (anti-patron D6).

## Relacion con otras skills
- `arrancar-proyecto` prepara la base del repo; `definir-arquitectura` define que zonas del sistema existen; `configurar-testing` decide como protegerlas; `documentar-con-criterio` ayuda a fijar cuanto detalle documental necesita la estrategia; `definir-reglas-proyecto` consolida rutas y comandos del proyecto; `validar-calidad` puede usar esta estrategia como checklist operativo.

# Ejemplos operativos

- **CRUD interno simple:** favorecer unit tests y algun integration basico; evitar e2e complejos si el riesgo es bajo.
- **SaaS con auth y pagos:** elevar integracion y e2e en flujos criticos; no confiar solo en unit tests.
- **Frontend con formularios complejos:** anadir tests de interaccion donde la logica de validacion y estado lo justifique; no gastar esfuerzo en componentes puramente visuales sin riesgo real.
- **Backend API con base de datos e integraciones externas:** priorizar integration tests y algunos contract tests cuando compense; proteger especialmente errores de frontera y persistencia.
- **MVP con IA:** testear contratos, flujos criticos y fallbacks; no intentar fijar con exceso de rigidez cada salida variable del modelo.

# Flujo recomendado
- [ ] Inspeccionar stack, arquitectura y comandos del proyecto.
- [ ] Identificar comportamientos criticos y zonas de mayor riesgo.
- [ ] Decidir que tipos de test aportan valor real; elegir convencion de ruta coherente (`tests/` por defecto).
- [ ] Definir el minimo conjunto util de proteccion; documentar estrategia, rutas y comandos en `docs/SSOT.md`.
- [ ] Crear documentacion adicional solo si de verdad aporta valor.
- [ ] Resolver gate de auto-cita + gate de segunda IA.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la estrategia de testing definida y documentada, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione stack, arquitectura y comandos reales del proyecto antes de proponer tipos de test (no testing por dogma, anti-patron D1).
- [ ] **Declaro** que escalé tipos de test al riesgo real: simple -> minima, critico -> elevada (anti-patron D2).
- [ ] **Declaro** que excluí wiring trivial, getters/setters y UI puramente presentacional sin logica (anti-patron D3), citando las zonas no cubiertas.
- [ ] **Declaro** que mapeé cada comportamiento critico al tipo de test correcto (unit/integration/e2e/smoke/contract), no mezclé niveles a ciegas (anti-patron D4).
- [ ] **Declaro** que respeté la convencion de rutas coherente del proyecto o propuse `tests/` solo si no existia convencion coherente (anti-patron D5).
- [ ] **Declaro** que la salida vive en `docs/SSOT.md` y solo abrí doc adicional tras aplicar `documentar-con-criterio` (anti-patron D6).
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que define la estrategia no es el que la califica. Antes de cerrar:

- **Proyecto con auth, pagos, datos sensibles o flujos criticos** -> delegar OBLIGATORIAMENTE a **@qa-validador** para validar que la estrategia cubre los puntos de regresion caros con el tipo correcto de test.
- **Estrategia que redefine rutas o comandos de test en un proyecto en marcha** -> delegar OBLIGATORIAMENTE a **@qa-validador** para confirmar que la convencion elegida no rompe CI/validadores existentes.
- **Cambios en SSOT que abren documentacion adicional de tests** -> escalar a `documentar-con-criterio` (ya cubierto por anti-patron D6); @qa-validador entra solo si el cambio afecta gates de build.
- **Estrategia trivial sobre CRUD simple y sin auth** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: tests, testing, cobertura, estrategia de test, unit test, integration test, e2e, smoke test
- Patrones de usuario: "configura tests", "estrategia de testing", "que tests necesitamos", "cobertura de tests"
- Encadenamiento: despues de `definir-arquitectura`, antes de `definir-reglas-proyecto`; hermana de `validar-calidad`

# Ejemplos de activacion
"Configura una estrategia de testing para este proyecto, proporcional al riesgo y coherente con su arquitectura y stack."

"Necesito saber que tests poner primero en este SaaS con auth y pagos."
