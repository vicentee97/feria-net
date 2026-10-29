# Método de crítica y refinamiento de interfaces

Esta referencia define cómo revisar una interfaz y cómo iterar sobre ella sin convertir un gusto puntual, una solución local o una diferencia de código en una conclusión visual. El `SKILL.md` principal señala cuándo aplicarla.

## Principio de partida

Una crítica útil evalúa la **lectura y el uso** de una pantalla, no solo los elementos que contiene. Antes de proponer un cambio, distinguir entre:

- una evidencia observable en un render, una interacción o un estado real;
- una hipótesis de causa;
- una preferencia estética que sigue abierta.

Comentarios como «esto parece igual», «no parece una sección», «hay demasiado aire» o «no sé dónde mirar» son evidencia válida de una percepción que hay que investigar. No se invalidan citando clases, tokens, intención de diseño o diferencias que solo existen en el código.

Cuando el trabajo tenga una dirección visual, referencia o anti-referencia explícita, la primera lectura de la pantalla debe contrastarse también con ese contrato. No basta con que la implementación funcione.

## Micro-loop de refinamiento proporcional

Usar este ciclo cuando se diseñe, se pula o se responda a feedback visual persistente:

1. **Situar la pantalla.** Identificar su función, persona usuaria, momento de uso, contenido o acción dominante, y el viewport/estado que se va a evaluar.
2. **Nombrar los roles.** Separar contexto, sección, control, ayuda, estado, contenido operativo y acción antes de decidir cómo deben distinguirse.
3. **Formular un claim perceptivo.** Expresar la relación que debería poder observarse, por ejemplo qué guía primero la lectura, qué se entiende como grupo o qué queda claramente secundario.
4. **Capturar una línea base.** Renderizar el estado relevante y anotar qué evidencia sostiene o contradice el claim.
5. **Probar una hipótesis.** Cambiar una relación de composición, agrupación, densidad, jerarquía o materialidad que pueda explicar el síntoma. No acumular ajustes inconexos.
6. **Comparar la percepción.** Volver a renderizar el mismo perfil y decidir si la relación cambió de forma observable. Si no cambió, reclasificar la causa antes de seguir.
7. **Cerrar o escalar.** Detenerse cuando el claim tenga evidencia suficiente; si el síntoma persiste, la evidencia es insuficiente o la decisión afecta navegación, shell o sistema, escalar con el contexto recogido.

El ciclo es interno y proporcional: una pantalla acotada no necesita una ceremonia extensa, pero sí una hipótesis y una comprobación visual cuando existe acceso a render. Un loop multiagente formal solo corresponde a objetivos amplios o transversales. Si no hay navegador, datos, autenticación o visión disponibles, dejar esa limitación explícita y no presentar la percepción como validada.

## Orden de revisión

Aplicar las capas en este orden para no pulir una causa equivocada:

1. **Función y orientación.** Qué intenta conseguir la persona, qué cambia si actúa y si el contexto ya está resuelto por navegación o flujo previo.
2. **Jerarquía macro.** Qué manda, qué acompaña y qué no merece competir por atención en la primera lectura.
3. **Agrupación y composición interna.** Qué elementos forman una unidad, qué separación expresa una relación distinta y si los bloques hermanos se leen como familia.
4. **Contenido y controles.** Si etiquetas, ayuda, datos, acciones y estados explican su prioridad y consecuencia sin depender de decoración.
5. **Materialidad y sistema.** Si las superficies, contraste, tipografía, divisores y señales de estado refuerzan los roles dentro del lenguaje existente.
6. **Densidad y ritmo.** Si la cadencia ayuda a escanear en vez de producir vacío sin propósito, compresión, repetición o una secuencia plana.
7. **Estados, datos y robustez.** Si la lectura se conserva con contenido escaso, extenso, inválido, cargando, abierto, con error, con foco, en rangos de viewport y con teclado.

No saltar a detalles de materialidad cuando no está claro qué debe leerse como primario, secundario o agrupado.

## Lentes de refinamiento progresivo

Estas lentes sirven para explorar una pantalla poco a poco. No son una lista mecánica ni obligan a que toda interfaz use la misma solución; seleccionar las que afectan al objetivo y al estado evaluado.

### Lectura y propósito

- orientación dentro del flujo y repetición útil o innecesaria de contexto;
- primera lectura, tarea dominante y siguiente paso comprensible;
- orden entre información, decisión y confirmación;
- carga cognitiva de copy, etiquetas y explicaciones persistentes;
- coincidencia entre el modelo mental de la persona y la estructura visible.

### Agrupación y ritmo

- proximidad, continuidad y separación entre elementos relacionados o independientes;
- jerarquía perceptible entre pantalla, sección, subgrupo y control;
- alineación de contenido, acciones, iconografía y ayudas;
- ritmo entre bloques, dentro de cada grupo y durante transiciones;
- densidad que permita escanear sin crear vacío ornamental ni hacinamiento.

### Contenido y controles

- legibilidad y rol de títulos, etiquetas, valores, ayuda y estados;
- prioridad y consecuencia de acciones primarias, secundarias y destructivas;
- affordance de controles, selección, expansión, edición y confirmación;
- claridad de la relación entre una opción, su explicación y su efecto;
- visibilidad de cambios pendientes, validaciones, errores y resultado de guardar.

### Materialidad y sistema

- consistencia de superficies, profundidad, contraste y bordes con el design system real;
- señales visuales que diferencian roles sin añadir ruido;
- repetición intencional de patrones y excepción justificada cuando cambia la función;
- proporción entre identidad visual, contenido y utilidad operativa;
- ausencia de acumulación de tarjetas, adornos, iconos o señales que no aportan relación.

### Uso y resiliencia

- estabilidad de la lectura en viewport, zoom y contenido variable;
- estados cerrados, expandidos, seleccionados, deshabilitados, cargando y con error cuando apliquen;
- foco, teclado, lectura asistida y mensajes de feedback;
- continuidad entre navegación, contexto de página y contenido principal;
- ausencia de cortes, solapes, scroll inesperado o pérdida de prioridad al cambiar de estado.

## Formato de salida al criticar o refinar

Documentar solo lo material, usando esta secuencia:

- **Claim:** qué relación visual o de uso se esperaba.
- **Evidencia:** qué se observa en el estado y viewport revisados.
- **Hipótesis:** qué capa parece causar la diferencia entre ambos.
- **Dirección:** qué relación debe cambiar, sin convertirla en receta universal.
- **Resultado:** qué muestra el siguiente render; si no se pudo comprobar, qué queda pendiente.

Una respuesta puede comenzar por los tres a siete hallazgos de mayor impacto, explicar el patrón común y cerrar con una dirección de mejora. Evitar listas infinitas de microcambios o una puntuación sin evidencia.

## Rúbrica de apoyo

Cuando ayude a evitar crítica vaga, evaluar de forma cualitativa estas dimensiones. La puntuación es interna y opcional; nunca sustituye la evidencia.

- **Función y claridad operativa:** la intención de uso y su siguiente paso son comprensibles.
- **Jerarquía percibida entre roles:** la persona distingue qué manda, qué agrupa y qué acompaña sin necesitar una explicación externa.
- **Composición y agrupación:** los elementos relacionados forman sistemas legibles y los independientes no se confunden.
- **Materialidad y consistencia:** el lenguaje visual existente sostiene la función en vez de competir con ella.
- **Ritmo y densidad:** hay una cadencia útil para escanear, leer y actuar.
- **Estados y feedback:** cambios, consecuencias y errores siguen siendo claros durante la interacción.
- **Robustez inclusiva:** la prioridad se mantiene en rangos reales, con contenido variable y mediante teclado.

## Antisesgos frecuentes

### Diferencia implementada, diferencia no percibida

**Mal:** concluir que dos niveles están diferenciados porque usan clases, tokens, iconos o estilos distintos.

**Bien:** describir qué relación falla en la captura, probar una hipótesis de jerarquía y comprobar si alguien puede distinguir los roles en la primera lectura.

### Solución local convertida en patrón universal

**Mal:** trasladar una cabecera, una tarjeta, un divisor o una intensidad de contraste que funcionó en un caso a todas las pantallas.

**Bien:** conservar el principio transferible —por ejemplo, hacer visible una agrupación o reducir competencia— y elegir la expresión que encaje con la función, el sistema y el contexto de cada pantalla.

### Bucle cosmético

**Mal:** encadenar ajustes mínimos cuando el usuario sigue percibiendo el mismo problema.

**Bien:** volver al claim, cambiar de capa diagnóstica y pedir o producir nueva evidencia antes de seguir refinando.

### Lectura decorativa

**Mal:** añadir contexto, copy, superficies o iconos porque parecen elevar la pantalla, aunque la navegación y el flujo ya resuelvan la orientación.

**Bien:** conservar solo lo que modifica comprensión, decisión, riesgo, estado o acción; la ausencia de un elemento también puede ser una decisión de diseño.

### Captura única

**Mal:** calificar una interfaz a partir de un único estado ideal.

**Bien:** revisar los estados y perfiles que cambian la lectura o la interacción, en proporción al riesgo de la pantalla.
