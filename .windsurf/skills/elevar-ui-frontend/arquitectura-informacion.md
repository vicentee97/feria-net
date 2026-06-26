# Arquitectura de información

Esta referencia recoge las directrices de `elevar-ui-frontend` para planificar la estructura de contenido de una página ANTES de implementarla. El `SKILL.md` principal señala cuándo aplicarlo.

## Regla crítica: planificar antes de crear

Antes de implementar el contenido de cualquier página nueva o reestructurar una existente, la IA debe resolver un paso de planificación de arquitectura de información. No debe crear secciones de contenido por defecto o por patrones estadísticos.

### Paso previo obligatorio

Cuando la IA vaya a crear una página nueva o reestructurar significativamente una existente, debe responder estas preguntas ANTES de escribir código de contenido:

1. **¿Cuál es el propósito de esta página?**
   - ¿Vende, opera, revisa, configura, compra, autenticar, navegar o informa?
   - Si el propósito no está claro, la IA debe pedir aclaración antes de continuar.

2. **¿Quién es el usuario?**
   - ¿Qué necesita saber primero?
   - ¿Cuál es su nivel de conocimiento previo?
   - ¿Qué acción debe realizar al final?

3. **¿Cuál es el flujo lógico de información?**
   - Contexto -> Detalle -> Acción (patrón por defecto)
   - Problema -> Solución -> Prueba -> CTA (patrón de ventas)
   - Estado actual -> Acción siguiente (patrón operativo)

4. **¿Qué secciones son realmente necesarias?**
   - Lista de secciones candidatas
   - Justificación de cada una: ¿qué aporta al usuario?
   - ¿Se puede quitar alguna sin perder comprensión?

### Template de planificación

La IA debe dejar la planificación en este formato antes de implementar:

```
## Planificación de estructura

**Página:** [Nombre de la página]
**Propósito:** [Vende / Opera / Revisa / Configura / Compra / Autentica / Navega / Informa]
**Usuario:** [Quién es, qué necesita saber primero, qué acción debe realizar al final]
**Flujo:** [Contexto -> Detalle -> Acción / Problema -> Solución -> Prueba -> CTA / Estado actual -> Acción siguiente]

**Secciones planificadas:**
1. [Nombre de sección] - [Propósito: qué aporta al usuario]
2. [Nombre de sección] - [Propósito: qué aporta al usuario]
3. [Nombre de sección] - [Propósito: qué aporta al usuario]
...

**Secciones descartadas:** [Si había candidatas que no pasaron el filtro, listarlas con el motivo]
```

## Principios de orden de secciones

### Regla 1: Información más importante primero (pirámide invertida)

- Lo que el usuario necesita saber -> primero
- Detalles secundarios -> después
- Contexto histórico o largo -> al final si es necesario

Ejemplo:
- [MAL] "Sobre nosotros" -> "Qué hacemos" -> "Empieza"
- [OK] "Qué hacemos por ti" -> "Cómo funciona" -> "Empieza"

### Regla 2: Flujo lógico, no estructura de empresa

El orden debe seguir el viaje del usuario, no la estructura organizativa de la empresa.

- [MAL] Estructura de empresa: "Quiénes somos" -> "Productos" -> "Servicios" -> "Contacto"
- [OK] Viaje del usuario: "Qué problema resolvemos" -> "Cómo lo resolvemos" -> "Prueba" -> "Contacto"

### Regla 3: Máximo 5-7 secciones por página

- Si hay más de 7 secciones, probablemente sobran
- Cada sección debe tener un propósito claro y justificado
- Si dos secciones tienen contenido similar, deben combinarse

### Regla 4: Cada sección debe justificar su existencia

Antes de crear una sección, la IA debe responder:
- ¿Qué aporta esta sección al usuario?
- ¿Qué pasaría si no existiera?
- ¿Se puede combinar con otra sección sin perder valor?

Si la sección no pasa estas preguntas, no debe crearse.

## Anti-patrones de estructura de contenido

| Anti-patrón | Descripción | Solución |
|-------------|-------------|----------|
| **Sección genérica sin propósito** | "Sobre el producto" sin explicar qué aporta | Eliminar o redefinir con propósito claro |
| **Orden arbitrario** | Secciones colocadas sin lógica de flujo | Reordenar según pirámide invertida |
| **Demasiadas secciones** | 8+ secciones en una página | Combinar o eliminar las que no aporten |
| **Contenido que no sirve al usuario** | Texto largo sin valor real | Recortar o eliminar |
| **Secciones duplicadas** | "Características" y "Beneficios" con contenido similar | Combinar en una sola sección |
| **Copiar estructura de otra página** | "Esta página tiene 5 secciones, así que la mía también" | Planificar según el propósito real |
| **Relleno por completitud** | Añadir secciones solo para que "parezca completa" | Eliminar si no aporta valor |

## Checklist de validación de estructura

Antes de implementar el contenido de una página, verificar:

- [ ] ¿El propósito de la página está claro y justificado?
- [ ] ¿El usuario está definido y sus necesidades identificadas?
- [ ] ¿El flujo de información sigue una lógica clara?
- [ ] ¿Cada sección justifica su existencia con una función para el usuario?
- [ ] ¿El orden es lógico para el usuario (no para la empresa)?
- [ ] ¿Se puede quitar alguna sección sin perder comprensión?
- [ ] ¿La información más importante está primero?
- [ ] ¿Hay máximo 5-7 secciones?
- [ ] ¿No hay secciones duplicadas o con contenido solapado?

## Ejemplo práctico

### Caso: Página de producto SaaS

**Mal (sin planificación):**
1. Sobre el producto
2. Características
3. Demo
4. Galería
5. Testimonios
6. FAQ
7. Contacto

**Problema:** Orden arbitrario, secciones genéricas, "Sobre el producto" no justifica su existencia.

**Bien (con planificación):**
1. **Propuesta de valor** (¿qué hace por ti?) - Propósito: captar interés
2. **Cómo funciona** (3 pasos simples) - Propósito: reducir fricción
3. **Prueba social** (testimonios relevantes) - Propósito: generar confianza
4. **Empieza** (CTA claro) - Propósito: convertir

**Justificación:** Cada sección tiene un propósito claro, el orden sigue el viaje del usuario, y no hay relleno innecesario.

### Ejemplo de transformación paso a paso

**Caso original (sin planificación):**
El usuario pide: "Crea una página de producto para nuestra herramienta de gestión de inventarios"

La IA crea directamente:
1. Sobre nosotros
2. Producto
3. Características
4. Precios
5. Demo
6. Testimonios
7. Blog
8. Contacto

**Problemas detectados:**
- "Sobre nosotros" no aporta al usuario (quiere saber qué hace la herramienta, no quiénes somos)
- "Producto" y "Características" se solapan
- "Blog" es irrelevante para una página de producto
- 8 secciones es demasiado
- No hay un CTA claro

**Proceso de transformación:**

Paso 1: Identificar propósito
- Esta página VENDE una herramienta de gestión de inventarios

Paso 2: Identificar usuario
- Gerente de almacén que necesita organizar su inventario
- Quiere saber: ¿qué hace? ¿cómo me ayuda? ¿cuánto cuesta? ¿cómo empiezo?

Paso 3: Elegir flujo
- Problema -> Solución -> Prueba -> CTA (patrón de ventas)

Paso 4: Planificar secciones
1. **Propuesta de valor** - "Gestiona tu inventario en tiempo real" - Propósito: captar interés
2. **Cómo funciona** - 3 pasos simples - Propósito: reducir fricción
3. **Beneficios concretos** - Ahorro de tiempo, reducción de errores - Propósito: generar deseo
4. **Prueba social** - Testimonios de clientes reales - Propósito: generar confianza
5. **Empieza** - CTA claro "Prueba gratis 14 días" - Propósito: convertir

Paso 5: Secciones descartadas
- "Sobre nosotros" - Descartado: no aporta al usuario en etapa de compra
- "Blog" - Descartado: irrelevante para página de conversión
- "Características" - Combinado con "Beneficios concretos"

**Resultado final:**
5 secciones, cada una con propósito claro, orden lógico de ventas, sin relleno.

## Integración con otras referencias

- Esta referencia se aplica ANTES de [composicion.md](composicion.md) (diseño visual)
- Se aplica ANTES de [design-system.md](design-system.md) (sistema visual)
- Se aplica ANTES de [responsive.md](responsive.md) (adaptación)
- El flujo correcto es: planificar estructura -> diseñar visual -> implementar responsive
