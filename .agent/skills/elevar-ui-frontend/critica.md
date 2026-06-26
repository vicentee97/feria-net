# Método de crítica de interfaces

Esta referencia recoge el método repetible que `elevar-ui-frontend` exige cuando la tarea principal es revisar o criticar una interfaz. El `SKILL.md` principal señala cuándo aplicarlo.

## Método de crítica de interfaces

Cuando la tarea principal sea revisar una interfaz, la IA no debe limitarse a listar gustos o comentarios sueltos. Debe seguir un método repetible y dejar claro qué está evaluando.

### Orden obligatorio de revisión

1. **Función de la pantalla**
   - Qué intenta hacer esta pantalla: vigilar, actuar, revisar, cerrar, configurar o vender.
   - Si eso no se entiende rápido, la crítica debe empezar por ahí.

2. **Jerarquía macro**
   - Qué bloque manda.
   - Qué bloque acompaña.
   - Qué bloque sobra, compite o roba foco.

3. **Composición interna**
   - Si los bloques destacados están bien resueltos por dentro.
   - Si las métricas hermanas se leen como familia.
   - Si el detalle operativo tiene una estructura estable.

4. **Materialidad y separación**
   - Si las superficies pertenecen al mismo sistema.
   - Si los bordes, divisores, tonos y radios refinan o endurecen la vista.
   - Si resumen y detalle tienen un corte visual suficiente.

5. **Densidad y ritmo**
   - Si hay demasiado aire muerto, demasiada compresión o una cadencia plana.
   - Si la pantalla parece apilada, dispersa o mecánica.

6. **Estados y datos pobres**
   - Si la pantalla sigue funcionando cuando casi todo está a cero.
   - Si depende demasiado de datos futuros para verse viva.

7. **Robustez**
   - Qué pasaría en portátil, monitor ancho, zoom alto, textos más largos o datos más sucios.

### Formato de salida recomendado al criticar

- Empezar por 3-7 fallos principales, ordenados por impacto.
- Después explicar el patrón general que está fallando.
- Cerrar con una dirección de mejora, no con una lista infinita de microcambios.
- Si la crítica revela una laguna reusable en esta skill, actualizarla o dejarlo explícitamente marcado.

## Rúbrica rápida de evaluación

Cuando convenga, la IA puede puntuar la pantalla de `0` a `5` en estas categorías para evitar críticas vagas:

- **Función y claridad operativa**
  - `0`: no se entiende para qué sirve.
  - `5`: la intención de uso es inmediata.

- **Jerarquía macro**
  - `0`: todo compite.
  - `5`: la prioridad visual es indiscutible.

- **Composición interna**
  - `0`: bloques mal resueltos por dentro.
  - `5`: cada grupo se lee como sistema.

- **Materialidad y consistencia**
  - `0`: mezcla torpe de superficies, bordes o tonos.
  - `5`: lenguaje visual coherente y refinado.

- **Detalle operativo**
  - `0`: listas, métricas o importes dispersos.
  - `5`: detalle compacto, legible y estable.

- **Ritmo y densidad**
  - `0`: caos, vacío inútil o planitud total.
  - `5`: cadencia clara y energía visual controlada.

- **Robustez responsive**
  - `0`: solo funciona en un screenshot.
  - `5`: mantiene jerarquía y equilibrio en rangos reales.

No hace falta mostrar siempre la puntuación al usuario, pero la IA debe poder usarla internamente para evitar juicios inconsistentes.

## Ejemplo anti-sesgo

### Caso: tarjeta de dashboard con rendimiento semanal

**Mal:**

- una `Card` principal;
- dentro, otra caja informativa lateral;
- dentro, un empty state resuelto como otra subcard;
- dentro de esa subcard, otra caja para el CTA;
- y dos o tres frases explicando cosas obvias.

**Bien:**

- una sola `Card` principal;
- KPI principal arriba y chips secundarios compactos;
- empty state resuelto con layout directo dentro de la propia card o con el propio skeleton estático si comunica mejor;
- una sola frase útil;
- un único CTA visible;
- sin paneles internos extra si no separan una función distinta;
- y composición que siga siendo clara en portátil y escritorio ancho, no solo en la captura inicial.
