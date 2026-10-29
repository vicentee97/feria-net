---
name: escalera-minima
description: "Compuerta previa a escribir: sube la escalera minima (¿necesita existir?, ¿ya esta en este codigo?, libreria estandar, funcion nativa, dependencia ya instalada, una linea, el minimo que funciona) y para en el primer peldaño que aguante. El suelo de seguridad nunca se recorta y la escalera no cancela el brief. TRIGGERS: escalera minima, minimo que funciona, reutilizar antes de crear, dependencia innecesaria, funcion nativa, KISS, YAGNI, sobre-construir, codigo minimo, no instales una libreria."
---

# Escalera Mínima

# Frontera de la skill: compuerta antes de escribir (leer primero)

- **MUST** subir la escalera ANTES de escribir código, crear un fichero, añadir una dependencia o montar una pieza nueva.
- **MUST** subirla DESPUÉS de entender el problema: la escalera nunca recorta la lectura del código que se toca; se lee primero y se decide después.
- **NEVER** usar la escalera para no entregar lo que el brief pide. La escalera no cancela el brief: si algo no debería existir, se dice y se propone la alternativa más vaga que sí vale, y el entregable se entrega igual.
- **NEVER** recortar el suelo de seguridad de la sección siguiente.
- **NO** sustituye a `detectar-sobreingenieria` (audita sistemas ya construidos) ni a `cuestionar-enfoque` (decide el enfoque cuando una superficie acumula 3 o más tandas de parches sobre el mismo mecanismo). Esas dos miran hacia atrás; esta mira antes de escribir.

# Suelo de seguridad (nunca se recortan)

Estos cuatro ámbitos **nunca se recortan** por esta escalera, aunque el peldaño más barato los roce:

- Validación en frontera de confianza: lo que llega de fuera (usuario, red, fichero, tercero).
- Manejo de errores: el fallo se ve y no se traga.
- Pérdida de datos: operaciones irreversibles, borrados, migraciones, escrituras sin copia.
- Seguridad y accesibilidad: auth, permisos, RLS, secretos; foco, teclado, contraste, etiquetas.

Si el peldaño más barato obliga a quitar uno de los cuatro, ese peldaño no aguanta: se sube al siguiente.

# Objetivo

Escribir el mínimo que funciona, parando en el primer peldaño que aguante. La escalera evita construir piezas que ya existen o que la plataforma regala, y deja por escrito en qué peldaño se paró y por qué, para que otra IA pueda revisarlo.

# Alcance y límites

- Aplica a código, UI, backend, datos, scripts, configuración y dependencias; también a piezas nuevas dentro de un cambio ya pedido.
- No aplica a la lectura previa: entender el problema y leer el código que se toca va antes y no se recorta.
- No decide arquitectura, navegación, design system ni contratos de datos: si el peldaño cambia una frontera estructural, se escala al dueño del dominio y se sigue su criterio.
- No autoriza a entregar menos de lo pedido: el alcance lo fija el brief.
- No audita lo ya construido: eso es [`detectar-sobreingenieria`](../detectar-sobreingenieria/SKILL.md).

# Comportamiento esperado

Sube los 7 peldaños en orden y para en el primero que aguante. «Aguantar» significa resolver el problema real del brief sin tocar el suelo de seguridad.

## Los 7 peldaños

1. **¿Esto necesita existir?** Si no, no se construye: se dice en una línea y se propone la alternativa más vaga que sí vale (reutilizar lo que ya hay, no hacerlo, hacerlo a mano).
2. **¿Ya está en este código?** Reutiliza el helper, componente, módulo, script o contrato equivalente antes de crear otro con distinto nombre.
3. **¿Lo hace la librería estándar?** Usa la stdlib del lenguaje antes de escribir una utilidad propia.
4. **¿Lo cubre una función nativa de la plataforma?** Ejemplo real: `<input type="date">` antes que una librería de calendarios; `details/summary` antes que un acordeón propio.
5. **¿Lo resuelve una dependencia ya instalada?** Úsala; no añadas otra para lo mismo.
6. **¿Cabe en una línea?** Si cabe en una línea clara, se escribe esa línea y no una abstracción con un solo uso.
7. **Solo entonces, el mínimo que funciona.** El código más pequeño que resuelve el problema pedido, sin capas para un futuro que nadie ha pedido.

Regla de parada: se para en el primer peldaño que resuelve el problema sin romper el suelo de seguridad. Bajar de peldaño «para hacerlo mejor» es sobre-construir.

## Qué se declara al terminar

- El peldaño donde se paró y por qué los anteriores no aguantaban.
- Si el peldaño 1 dijo «esto no debería existir»: la propuesta en una línea y qué se entregó igualmente.

# Anti-patrones y su corrección

- **Construir por reflejo:** MAL instalar o escribir una pieza nueva sin subir la escalera. BIEN recorrer los peldaños 2-5 antes de crear nada. EJEMPLO un selector de fecha: `<input type="date">` en vez de una librería de calendarios.
- **Escalera como excusa para no entregar:** MAL responder «esto no debería existir» y dejar el brief sin hacer. BIEN entregar lo pedido y proponer la alternativa en una línea. EJEMPLO se entrega el panel mínimo y se propone reutilizar el panel existente.
- **Recortar el suelo para ahorrar líneas:** MAL quitar la validación de frontera o el manejo de errores porque el peldaño más barato no los trae. BIEN mantener el suelo y recortar en otro sitio. EJEMPLO no se quita el control de errores del cobro para acortar el handler.
- **Decidir sin leer:** MAL elegir peldaño sin abrir el código que se toca. BIEN leer primero y decidir después. EJEMPLO no se asume que existe un helper: se comprueba.

# Inputs / contexto obligatorio

- El brief o la orden, con su alcance real.
- El código que se toca y sus vecinos: el peldaño 2 se responde mirando, no recordando.
- Las dependencias ya instaladas del proyecto (manifiesto y lockfile).
- La skill del dominio que gobierna la superficie: [`implementador`](../implementador/SKILL.md) en UI, [`implementar-backend-datos`](../implementar-backend-datos/SKILL.md) en datos y APIs.
- Criterio general: [`actuar-como-senior`](../actuar-como-senior/SKILL.md); para APIs externas, [`investigar-antes-de-implementar`](../investigar-antes-de-implementar/SKILL.md).

# Flujo recomendado

- [ ] Leer el brief y el código que se toca, sin recortar esta lectura.
- [ ] Subir los 7 peldaños en orden y anotar en qué peldaño se para.
- [ ] Comprobar el suelo de seguridad del cambio antes de dar el peldaño por bueno.
- [ ] Escribir el mínimo que funciona y dejar en el retorno el peldaño elegido, lo reutilizado y lo descartado.
- [ ] Si el peldaño 1 dice que algo no debería existir: decirlo y proponer la alternativa, sin dejar de entregar.

# Criterio de resultado bueno (gate de cierre, auto-cita)

Un solo gate. Cada item se declara con su artefacto (fichero:línea, comando o salida), no de memoria:

- [ ] Declaro el peldaño donde paré y por qué los anteriores no aguantaban, citando el peldaño y su artefacto.
- [ ] Declaro que leí el código que toco antes de decidir, citando las rutas leídas.
- [ ] Declaro qué reutilicé (peldaños 2-5) y, si añadí una dependencia nueva, el motivo por el que ninguna ya instalada servía.
- [ ] Declaro que el suelo de seguridad sigue entero: validación en frontera de confianza, manejo de errores, pérdida de datos, seguridad y accesibilidad, citando dónde vive cada uno en el cambio.
- [ ] Declaro que la escalera no me sirvió para no entregar: si dije «esto no debería existir», cito la propuesta y el entregable que sí quedó.

## Triggers

- **Keywords:** escalera minima, minimo que funciona, escribir menos, reutilizar antes de crear, libreria estandar, funcion nativa, dependencia ya instalada, dependencia innecesaria, una linea, KISS, YAGNI, sobre-construir, codigo minimo, no instales una libreria.
- **Patrones de usuario:** "hazlo lo mas simple que funcione", "no anadas otra libreria", "esto ya existe en el proyecto?", "para que tanta capa", "escribe menos codigo", "usa lo nativo".
- **Encadenamiento:** después de leer el código y de [`actuar-como-senior`](../actuar-como-senior/SKILL.md); junto a `implementador` (UI) e `implementar-backend-datos` (datos); si la superficie acumula 3 o más tandas → [`cuestionar-enfoque`](../cuestionar-enfoque/SKILL.md); si el sistema ya está construido → `detectar-sobreingenieria`; antes de [`investigar-antes-de-implementar`](../investigar-antes-de-implementar/SKILL.md) cuando el peldaño 5 toque una API externa.

# Ejemplos de activación

- "Añade un selector de fecha al formulario." → peldaño 4: `<input type="date">` antes que una librería.
- "Necesito un helper para formatear importes." → peldaño 3: `Intl.NumberFormat` antes de escribirlo.
- "Monta un sistema de notificaciones." → peldaño 1: decir si eso necesita existir y proponer la alternativa, sin dejar de entregar lo pedido.
- "Antes de instalar esta dependencia, mira si ya lo tenemos." → peldaño 5.
