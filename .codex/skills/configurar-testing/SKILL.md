---
name: configurar-testing
description: "Define o revisa una estrategia de testing proporcional al riesgo del proyecto: tipos de test, rutas, comandos, coberturas utiles y proteccion de comportamientos criticos. TRIGGERS: tests, testing, cobertura, estrategia de test, unit test, integration test, e2e, smoke test."
---

# Objetivo
Convertir el contexto técnico y funcional del proyecto en una estrategia de testing clara, pragmática y sostenible.

La skill debe decidir qué tipos de test hacen falta, dónde deben vivir, cómo se ejecutan y qué comportamientos merecen protección desde el principio. El objetivo no es maximizar tests, sino proteger el riesgo real del proyecto con el mínimo conjunto útil.

# Alcance y límites
- Sí define estrategia de test, niveles de cobertura, rutas, naming y criterios de criticidad.
- Sí puede recomendar herramientas de testing si encajan con el contexto real del proyecto.
- Sí debe decidir qué convención de carpetas es más coherente con el repo.
- No implementa tests ni instala librerías.
- No obliga a usar todos los tipos de test en todos los proyectos.
- No sustituye a `definir-arquitectura`; se apoya en la arquitectura definida.
- No sustituye a una futura skill de calidad, aunque debe dejar una base clara para ella.
- No debe vender testing por dogma: debe enseñar criterio práctico.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Estructura real del repositorio.
- Arquitectura ya definida, si existe.
- Stack detectable.
- Comandos actuales del proyecto.
- Comportamiento crítico conocido del proyecto.

# Comportamiento esperado
La skill debe empezar inspeccionando stack, arquitectura y comandos existentes antes de recomendar cualquier estrategia.

Si al aterrizar la estrategia hay que crear varias configuraciones, tests y rutas, no debe hacerse con un único parche masivo: dividir por bloques forma parte del comportamiento esperado.

Después debe:
1. Identificar comportamientos críticos y puntos de regresión caros.
2. Clasificar necesidades entre unit, integration, e2e, smoke o contract tests cuando aplique.
3. Decidir la estrategia mínima útil según riesgo.
4. Recomendar herramientas y convenciones solo si encajan con el stack real.
5. Documentar la estrategia final en `docs/SSOT.md`.

## Política de ubicación de tests
- `tests/` es la recomendación por defecto para proyectos nuevos.
- `test/` o `__tests__/` pueden aceptarse si el stack o el proyecto ya están alineados así.
- Los tests co-localizados solo deben proponerse cuando el framework o la ergonomía del proyecto lo justifiquen claramente.
- Si el proyecto ya tiene una convención coherente, la skill debe respetarla.
- `.test` no es una convención documentada en este repositorio y no debe proponerse como base por defecto.

## Qué debe cubrir la estrategia de testing como mínimo
- Ruta principal de tests.
- Comando base de test.
- Qué comportamientos son críticos.
- Qué tipo de test protege cada zona importante.
- Qué nivel de cobertura inicial es suficiente.
- Qué se pospone legítimamente para no ralentizar el proyecto.

## Política de pragmatismo
- Los proyectos simples no deben recibir una estrategia de testing sobredimensionada.
- Los proyectos con lógica crítica, dinero, autenticación, integraciones o datos sensibles deben escalar el nivel de protección.
- Cuando no haya tests aún, la skill debe proponer el primer conjunto mínimo valioso, no una batería idealizada.

## Cuándo pedir cada tipo de test
### Unit
Úsalos para:
- lógica aislada;
- reglas con combinatoria;
- transformaciones puras;
- validaciones con casuística clara.

### Integration
Úsalos para:
- fronteras entre módulos;
- acceso a base de datos;
- servicios internos;
- integraciones relevantes;
- puntos donde una regresión no se detecta bien con unit tests.

### E2E
Úsalos para:
- flujos críticos de negocio;
- autenticación;
- checkout, reserva, agenda, altas o cualquier camino principal del producto;
- validaciones que solo tienen sentido con el sistema unido.

### Smoke
Úsalos para:
- comprobar arranque;
- validar salud básica;
- verificar que el sistema no está roto de forma gruesa tras cambios o despliegues.

### Contract
Úsalos solo si:
- hay APIs o integraciones donde compensa asegurar contratos;
- el coste de ruptura entre consumidores y proveedores justifica esa capa.

## Qué no testear todavía
- Wiring trivial.
- Getters, setters o wrappers sin valor propio.
- UI puramente presentacional salvo que exista lógica crítica.
- Caminos poco valiosos cuando el coste supere claramente el riesgo actual.
- Detalles demasiado variables del comportamiento de un modelo de IA cuando lo importante sea validar contrato, flujo o fallback.

## Formato de salida
La salida principal debe actualizar `docs/SSOT.md`, especialmente el bloque de tests y validaciones críticas.

La skill puede crear un documento adicional en `docs/` solo si la estrategia de testing necesita más detalle, más fases o más profundidad de la que conviene meter en la SSOT.

Antes de abrir documentación adicional, debe aplicar `documentar-con-criterio` para no convertir la estrategia de testing en texto redundante o excesivamente teórico.

## Relación con otras skills
- `arrancar-proyecto` prepara la base del repo.
- `definir-arquitectura` define qué zonas del sistema existen.
- `configurar-testing` decide cómo protegerlas.
- `documentar-con-criterio` ayuda a fijar cuánto detalle documental necesita la estrategia y cuándo basta con la SSOT.
- `definir-reglas-proyecto` consolida rutas y comandos del proyecto.
- Una futura `validar-calidad` puede usar esta estrategia como checklist operativo.

## Ejemplos operativos
### CRUD interno simple
- Favorecer unit tests y algún integration básico.
- Evitar e2e complejos si el riesgo es bajo.

### SaaS con auth y pagos
- Elevar integración y e2e en flujos críticos.
- No confiar solo en unit tests.

### Frontend con formularios complejos
- Añadir tests de interacción donde la lógica de validación y estado lo justifique.
- No gastar esfuerzo en componentes puramente visuales si no aportan riesgo real.

### Backend API con base de datos e integraciones externas
- Priorizar integration tests y algunos contract tests cuando compense.
- Proteger especialmente errores de frontera y persistencia.

### MVP con IA
- Testear contratos, flujos críticos y fallbacks.
- No intentar fijar con exceso de rigidez cada salida variable del modelo.

# Flujo recomendado
- [ ] Inspeccionar stack, arquitectura y comandos del proyecto.
- [ ] Identificar comportamientos críticos y zonas de mayor riesgo.
- [ ] Decidir qué tipos de test aportan valor real.
- [ ] Elegir convención de ruta coherente, con `tests/` como base por defecto.
- [ ] Definir el mínimo conjunto útil de protección.
- [ ] Documentar estrategia, rutas y comandos en `docs/SSOT.md`.
- [ ] Crear documentación adicional solo si de verdad aporta valor.

# Criterio de resultado bueno
La skill está bien aplicada si:
- la estrategia de testing encaja con el riesgo real del proyecto;
- protege lo crítico sin sobrecargar el desarrollo;
- deja clara la convención de rutas y comandos;
- respeta la arquitectura y la estructura ya existentes cuando son coherentes;
- y enseña criterio práctico en lugar de imponer una batería de tests sin contexto.

## Triggers
- Keywords: tests, testing, cobertura, estrategia de test, unit test, integration test, e2e, smoke test
- Patrones de usuario: "configura tests", "estrategia de testing", "que tests necesitamos", "cobertura de tests"
- Encadenamiento: despues de `definir-arquitectura`, antes de `definir-reglas-proyecto`

# Ejemplos de activación
"Configura una estrategia de testing para este proyecto, proporcional al riesgo y coherente con su arquitectura y stack."

