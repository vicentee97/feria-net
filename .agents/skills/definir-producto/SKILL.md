---
name: definir-producto
description: "Usar al arrancar un modulo o producto nuevo cuando la idea aun es difusa o incompleta, para clarificar y documentar alcance, vision y modulos antes de hablar de arquitectura o implementacion. TRIGGERS: producto, que construimos, idea, definir el producto, vision, alcance funcional, modulo nuevo."
---

# Definir producto

# Objetivo

Convertir una idea difusa, un menu nuevo o un producto mal encuadrado en una definicion funcional explicita, defendible y documentada. Fija primero **que producto es**, **para que sirve**, **como se agrupan sus capacidades** y **cual es la fase correcta** antes de permitir que la IA baje a arquitectura, reglas o codigo.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Saltar a codigo con idea difusa:** MAL proponer stack, rutas o entidades cuando el producto aun es una lista de features sueltas. BIEN frenar y cerrar primero la definicion funcional en documentacion. EJEMPLO "quiero una app de tareas con login, notificaciones y panel" -> primero producto en una frase, usuario, problema y modulos; despues arquitectura.
- **Feature puntual secuestrando el producto:** MAL dejar que una feature concreta se convierta por inercia en "el producto". BIEN separar vision global, fase actual y capacidades futuras. EJEMPLO "exportar PDF" no es el producto; es una capacidad de un modulo de informes.
- **Naming mediocre de modulos:** MAL aceptar nombres provisionales ("Cosas", "Extras", "Modulo 2") como definitivos. BIEN cerrar naming canonico antes de mapear a codigo. EJEMPLO "Config" -> "Ajustes de cuenta"; mapear luego al nombre tecnico temporal si ya existe codigo.
- **Menu nuevo como modulo por reflejo:** MAL convertir cualquier menu nuevo en un modulo. BIEN decidir si es modulo nuevo, flujo de un modulo existente, capacidad operativa o idea prematura. EJEMPLO "otro menu de reportes" -> flujo del modulo de informes, no modulo nuevo.
- **Respuesta bonita sin documento:** MAL devolver una definicion de producto solo en el chat. BIEN materializar en `docs/SSOT.md` + `docs/product-map.md` + `docs/TODO.md`. EJEMPLO la vision queda en SSOT, no solo en la respuesta.

# Alcance y limites

- Define identidad de producto, problema real, usuario principal, capacidades, modulos, naming y fase actual.
- Sirve para proyectos nuevos, reencuadre de productos empezados y apertura de superficies/menus nuevos.
- Actualiza o crea documentacion funcional canonica en `docs/`.
- No define arquitectura tecnica detallada; precede a `definir-arquitectura` y prepara a `definir-reglas-proyecto`.
- No implementa codigo ni instala dependencias.

# Inputs / contexto obligatorio

- La documentacion canonica del proyecto (SSOT o equivalente), las reglas globales de la IA, la skill transversal `documentar-con-criterio` y, si existe, la plantilla de SSOT del proyecto.
- Documentacion existente, estructura real del repositorio y prompt/descripcion de la idea del usuario.
- La memoria de tareas, las dudas abiertas y el TODO del proyecto, si existen.

# Comportamiento esperado

Inspeccionar el repositorio y la documentacion existente antes de proponer estructura, modulos o fases. La skill es freno deliberado contra el impulso de bajar demasiado pronto a stack, rutas, entidades o codigo.

## Contextos de uso

- **Proyecto nuevo:** el producto nace sin definicion funcional cristalizada; fijar primero producto, taxonomia y fase antes de arquitectura o implementacion.
- **Menu o area nueva:** aclarar si es modulo nuevo, flujo de un modulo existente, capacidad operativa de un area existente o idea prematura que no debe convertirse aun en navegacion o codigo.
- **Reencuadre:** cuando la documentacion actual no refleja lo que el producto quiere ser, corregir esa definicion antes de seguir acumulando decisiones tecnicas.

## Preguntas que debe cerrar

Producto en una frase; usuario principal; problema o necesidad real; capacidades actuales; capacidades iniciales; capacidades futuras; modulos o areas funcionales con buen naming; criterio de crecimiento para nuevas capacidades; fase activa real; mapeo entre naming canonico y naming tecnico temporal cuando ya existe codigo.

No bajar a arquitectura o implementacion si: la idea sigue como lista de features sueltas; los nombres son provisionales; una feature puntual se esta convirtiendo en "el producto"; no esta clara la diferencia entre vision global, fase actual y proximas capacidades.

## Outputs minimos

- **El SSOT del proyecto (p. ej. `docs/SSOT.md`):** resumen del producto, fase activa, principios de producto, taxonomia canonica, criterio de crecimiento y mapeo con el codigo actual si aplica.
- **El mapa de producto (p. ej. `docs/product-map.md`):** capacidades actuales, siguientes, ideas futuras agrupadas y criterio de entrada para nuevas automatizaciones o superficies.
- **El TODO del proyecto (p. ej. `docs/TODO.md`):** definicion traducida a epicas o siguientes pasos alineados con el producto real, no tareas estrechas heredadas. Si el roadmap necesita saneado, dejarlo listo para el handoff a `gestionar-roadmap`.

Aplicar `documentar-con-criterio` para no inflar la documentacion funcional con historia, hipotesis obvias o detalle tecnico que no ayude a entender el producto.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de cerrar la definicion de producto, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que NO baje a arquitectura, stack, rutas o codigo mientras la idea siguiera difusa, mal agrupada o con naming provisional (freno deliberado aplicado).
- [ ] **Declaro** que el producto queda definido en una frase, con usuario principal y problema real explicitos.
- [ ] **Declaro** que separe vision global, fase actual y capacidades futuras, y que ninguna feature puntual secuestra la definicion.
- [ ] **Declaro** que los modulos o areas funcionales tienen naming canonico defendible, y que mapee ese naming con el tecnico temporal cuando ya existe codigo.
- [ ] **Declaro** que la definicion esta materializada en la documentacion canonica del proyecto (SSOT, mapa de producto y TODO, con los nombres que use el proyecto), no solo en la respuesta del chat.
- [ ] **Declaro** que el criterio de crecimiento para nuevas capacidades, menus o automatizaciones queda documentado.

# Flujo recomendado

- [ ] Inspeccionar el repositorio, la documentacion y el estado real del proyecto.
- [ ] Detectar si el producto esta difuso, mal agrupado o mal nombrado.
- [ ] Definir el producto en una frase y el problema real que resuelve.
- [ ] Separar vision global, fase actual y capacidades futuras.
- [ ] Agrupar capacidades en modulos o areas funcionales con buen naming.
- [ ] Documentar el criterio de crecimiento y mapear naming canonico/tecnico si ya existe codigo.
- [ ] Actualizar la documentacion canonica del proyecto (SSOT, mapa de producto y TODO); registrar la decision en la memoria del proyecto, si existe.
- [ ] Resolver el gate de auto-cita.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers

- Keywords: producto, que construimos, idea, definir el producto, vision, alcance funcional, modulo nuevo.
- Patrones de usuario: "no tengo claro el producto", "quiero anadir un menu nuevo", "la documentacion no refleja lo que quiero", "definir el producto".
- Encadenamiento: primera skill; despues `arrancar-proyecto` si el repo no tiene estructura base; antes de `definir-arquitectura`, `configurar-entorno` o implementacion; despues `gestionar-roadmap` para mantener el TODO vivo y `arrancar-proyecto`/`definir-reglas-proyecto` para concretar la base operativa.

# Ejemplos de activacion

- "Aun no tengo bien definido el producto."
- "Quiero anadir un menu nuevo pero no se si es modulo, flujo o capacidad."
- "La documentacion actual no refleja bien lo que realmente quiero construir."
