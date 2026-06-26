---
name: definir-producto
description: "Clarifica y documenta que producto se esta construyendo antes de hablar de arquitectura o implementacion, especialmente cuando la idea funcional aun es difusa o incompleta. TRIGGERS: producto, que construimos, idea, definir el producto, vision, alcance funcional, modulo nuevo."
---

# Objetivo
Convertir una idea difusa, un menú nuevo o un producto mal encuadrado en una definición funcional explícita, defendible y documentada.

La skill debe fijar primero **qué producto es**, **para qué sirve**, **cómo se agrupan sus capacidades** y **cuál es la fase correcta** antes de permitir que la IA baje a arquitectura, reglas o código.

# Alcance y límites
- Sí define identidad de producto, problema real, usuario principal, capacidades, módulos, naming y fase actual.
- Sí sirve tanto para proyectos nuevos como para reencuadrar productos ya empezados.
- Sí aplica cuando se quiere abrir una nueva superficie o menú desde cero dentro de un producto existente.
- Sí debe actualizar o crear documentación funcional canónica en `docs/`.
- No define arquitectura técnica detallada.
- No sustituye a `definir-arquitectura`; la precede.
- No sustituye a `definir-reglas-proyecto`; la prepara.
- No implementa código ni instala dependencias.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [Plantilla de SSOT de proyecto](../docs/PROJECT_SSOT_TEMPLATE.md).
- Documentación existente del proyecto, si la hay.
- Estructura real del repositorio.
- Prompt real del usuario o descripción disponible de la idea.
- `.teams/`, `.questions/` y TODOs si el proyecto ya existe.

# Comportamiento esperado
La skill debe empezar inspeccionando el repositorio y la documentación existente antes de proponer estructura, módulos o fases.

Debe resolver, como mínimo, estas preguntas:
- qué es el producto en una frase;
- qué problema real resuelve;
- quién es el usuario principal;
- qué capacidades actuales, iniciales y futuras existen;
- qué parte es visión de producto y qué parte es fase/MVP;
- cómo se agrupan las capacidades en módulos o áreas funcionales;
- qué naming canónico conviene;
- cómo se mapea ese naming con el código actual si ya existe implementación.

## Contextos explícitos de uso
### 1. Proyecto nuevo
Cuando el proyecto nace sin una definición funcional cristalizada, la skill debe fijar primero producto, taxonomía y fase antes de arquitectura o implementación.

### 2. Menú o área nueva
Cuando se quiere abrir una nueva superficie dentro de un producto ya existente, la skill debe aclarar si eso es:
- un módulo nuevo;
- un flujo dentro de un módulo existente;
- una capacidad operativa de un área ya existente;
- o una idea todavía prematura que no debe convertirse aún en navegación o código.

### 3. Reencuadre de producto existente
Cuando la documentación actual no refleja bien lo que el producto quiere ser, la skill debe priorizar corregir esa definición antes de seguir acumulando decisiones técnicas.

## Regla fuerte contra gatillos rápidos
La skill debe actuar como freno deliberado contra el impulso de la IA a bajar demasiado pronto a stack, rutas, entidades o código.

No se debe saltar a arquitectura o implementación si:
- la idea sigue expresada como lista de features sueltas;
- los nombres de módulos son provisionales o mediocres;
- una feature puntual se está convirtiendo por inercia en "el producto";
- no está clara la diferencia entre visión global, fase actual y próximas capacidades.

Si detecta ese estado, la skill debe detener la inercia y cerrar primero la definición funcional en documentación.

## Preguntas de producto que debe cerrar
Antes de terminar, la skill debe dejar respondido:
- Producto en una frase.
- Usuario principal.
- Problema o necesidad real.
- Capacidades actuales.
- Capacidades iniciales.
- Capacidades futuras.
- Módulos o áreas funcionales con buen naming.
- Criterio de crecimiento para nuevas capacidades.
- Fase activa real.
- Mapeo entre naming canónico y naming técnico temporal cuando ya exista código.

## Outputs mínimos obligatorios
### `docs/SSOT.md`
Debe dejar o actualizar, como mínimo:
- resumen del producto;
- fase activa;
- principios de producto;
- taxonomía canónica;
- criterio de crecimiento;
- mapeo con el código actual si aplica.

### `docs/product-map.md`
Debe organizar:
- capacidades actuales;
- capacidades siguientes;
- ideas futuras agrupadas;
- criterio de entrada para nuevas automatizaciones o superficies.

### `docs/TODO.md`
Debe traducir la definición de producto a épicas o siguientes pasos alineados con el producto real, no a tareas estrechas heredadas.
Si el roadmap necesita saneado, priorización o partición posterior, la skill debe dejarlo listo para el handoff a `gestionar-roadmap`.

## Relación con otras skills
Orden recomendado cuando la idea funcional todavía no está clara:
1. `definir-producto`
2. `arrancar-proyecto` si aún falta base documental o estructura mínima
3. `gestionar-roadmap` para convertir la definición en trabajo mantenible
4. `definir-arquitectura`
5. `configurar-entorno`
6. `configurar-testing`
7. `definir-reglas-proyecto`

Regla práctica:
- Si falta producto, no bajar a arquitectura.
- Si falta arquitectura, no fijar rutas o comandos como si ya fueran definitivos.
- Si la definición funcional cambia de forma importante, la skill debe ejecutarse antes de seguir implementando.
- `documentar-con-criterio` ayuda a separar definición funcional útil de ruido narrativo o microdetalle técnico.

## Formato de salida esperado
La salida principal debe vivir en documentación del proyecto, no en respuestas sueltas.

Debe dejar:
- una SSOT del proyecto defendible;
- un mapa de producto separado cuando haya más de una capacidad o módulo;
- un TODO alineado con el producto real y listo para que `gestionar-roadmap` lo mantenga vivo.

Al definir producto, debe aplicar `documentar-con-criterio` para no inflar la documentación funcional con historia, hipótesis obvias o detalle técnico que no ayude a entender el producto.

## Ejemplos operativos
### Producto nuevo muy difuso
El usuario describe varias ideas mezcladas. La skill debe reagruparlas, separar visión y fase, y evitar que la IA salte a stack o código.

### Menú nuevo dentro de una app existente
El usuario quiere "otro menú". La skill debe decidir si ese menú merece existir o si la capacidad entra mejor como flujo dentro de un módulo ya existente.

### Documentación desalineada
La app ya tiene código, pero la SSOT no representa bien el producto. La skill debe reencuadrar el producto y documentar el mapeo temporal con el naming técnico actual sin forzar renombres inmediatos.

# Flujo recomendado
- [ ] Inspeccionar el repositorio, la documentación y el estado real del proyecto.
- [ ] Detectar si el producto está difuso, mal agrupado o mal nombrado.
- [ ] Definir el producto en una frase y el problema real que resuelve.
- [ ] Separar visión global, fase actual y capacidades futuras.
- [ ] Agrupar capacidades en módulos o áreas funcionales con buen naming.
- [ ] Documentar el criterio de crecimiento para nuevas ideas, menús o automatizaciones.
- [ ] Mapear naming canónico y naming técnico actual si el código ya existe.
- [ ] Actualizar `docs/SSOT.md`, `docs/product-map.md` y `docs/TODO.md`.
- [ ] Registrar la decisión en `.teams/` si el proyecto ya está en marcha.

# Criterio de resultado bueno
La skill está bien aplicada si:
- evita que la IA dispare arquitectura o código sobre una idea aún inmadura;
- deja claro qué es realmente el producto y qué no;
- diferencia visión, fase y capacidades futuras;
- agrupa bien módulos o áreas funcionales;
- produce documentación reutilizable y no solo una respuesta bonita;
- y reduce el riesgo de que una feature puntual secuestre la definición completa del producto.

## Triggers
- Keywords: producto, que construimos, idea, definir el producto, vision, alcance funcional, modulo nuevo
- Patrones de usuario: "no tengo claro el producto", "quiero anadir un menu nuevo", "la documentacion no refleja lo que quiero", "definir el producto"
- Encadenamiento: primera skill antes de arquitectura, entorno o implementacion

# Ejemplos de activación
"Aún no tengo bien definido el producto."

"Quiero añadir un menú nuevo pero no sé si es módulo, flujo o capacidad."

"La documentación actual no refleja bien lo que realmente quiero construir."
