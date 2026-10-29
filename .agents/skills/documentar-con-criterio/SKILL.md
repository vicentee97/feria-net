---
name: documentar-con-criterio
description: "Usar antes de tocar o crear cualquier doc (README, SSOT, manual, guia) para decidir si realmente aporta valor, evitar duplicacion y ruido, y mantener una documentacion canonica y proporcionada al cambio. TRIGGERS: documentar, docs, README, documentacion, crear doc, actualizar doc, escribir documentacion."
---

# Documentar con criterio

# Objetivo

Mantener una documentacion util, consistente y proporcionada al cambio real. La skill ayuda a decidir **si hay que documentar**, **donde**, **cuanto** y **con que nivel de detalle**, evitando tanto la omision de informacion importante como la inflacion documental.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Documentar el diff, no el estado final:** MAL describir paso a paso lo que cambio en el codigo. BIEN describir el comportamiento o contrato final util, no el proceso. EJEMPLO "se anadio `if (x) return null` antes de la llamada" -> "la llamada devuelve `null` cuando `x` es falso".
- **Duplicar entre fuentes:** MAL escribir el mismo bloque de setup en SSOT, README y `docs/setup.md`. BIEN una sola fuente canonica y enlaces breves. EJEMPLO el README enlaza a la seccion de entorno del SSOT.
- **Crear doc nueva por reflejo:** MAL abrir `docs/decision-X.md` cuando basta actualizar una seccion del SSOT. BIEN actualizar la fuente canonica existente; solo crear si el tema merece su propio artefacto. EJEMPLO una decision de rutas va en `docs/SSOT.md#rutas`, no en un archivo nuevo.
- **Inflar con historia:** MAL conservar parrafos de "primero pensamos X, despues Y" que no guian ninguna decision actual. BIEN borrar el historial narrativo; si hace falta trazabilidad, vive en `.teams/`. EJEMPLO el SSOT describe el estado actual; el `.teams/` guarda el porque del cambio.
- **Documentar lo obvio del codigo:** MAL explicar que hace cada funcion que ya se lee en el codigo. BIEN comentar solo lo que no es obvio leyendo el codigo. EJEMPLO no documentar `sumar(a,b) = a+b`; si documentar por que un pago se divide en dos transacciones.

# Alcance y limites

- Define criterios transversales para documentacion canonica, operativa y de soporte.
- Decide si una informacion debe vivir en `docs/`, `docs/SSOT.md`, `README`, `.teams/`, `.questions/`, un script o un comentario de codigo.
- Frena documentacion redundante, efimera o demasiado obvia.
- No sustituye a la skill de dominio que genera el contenido concreto.
- No obliga a crear documento nuevo si basta actualizar una fuente canonica existente.

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md) y [reglas globales](../docs/AI_GLOBAL_RULES.md).
- Documentacion existente relevante.
- Codigo, scripts o configuracion reales afectados por el cambio.
- Diff o cambio que se esta aplicando, si existe.

# Comportamiento esperado

Empezar preguntandose si la documentacion aporta valor operativo real. Antes de escribir:

1. Inspeccionar el cambio real, el codigo y la documentacion ya existente.
2. Detectar si la informacion ya esta documentada en un sitio canonico.
3. Decidir si el problema es ausencia, desalineacion, duplicidad o exceso de detalle.
4. Elegir el artefacto correcto antes de redactar contenido nuevo.

## Regla base

Documentar solo lo que: evita errores o bloqueos; fija decisiones dificiles de inferir; aclara contratos, rutas, flujos o reglas de uso; ayuda a retomar el trabajo sin depender de memoria conversacional.

No documentar lo que: el codigo o el script ya expresan claramente; es un detalle visual menor; es temporal, experimental o facil de deducir; solo aporta historial sin valor operativo actual.

## Jerarquia de destino

1. `docs/SSOT.md` — contexto canonico, rutas clave, precedencia, estado general y decisiones estructurales.
2. `docs/` especializados — detalle que supera razonablemente la SSOT y seguira siendo util.
3. `README.md` — entrada rapida, uso basico o vision general orientada a humanos.
4. `.teams/` — registro operativo, hipotesis, decisiones del hilo y trazabilidad.
5. `.questions/` — dudas reales no resueltas.
6. Script, `.env.example` o config de ejemplo — cuando la mejor explicacion es un artefacto operable.
7. Comentario de codigo — solo cuando el comportamiento no es obvio leyendo el codigo.

## Reglas practicas

- Preferir actualizar una fuente existente antes que abrir otra.
- Preferir bloques cortos y densos en señal antes que texto narrativo largo.
- Si un detalle no cambia decisiones ni evita errores, omitirlo.
- Si un documento empieza a duplicar otra fuente canonica, recortar y enlazar.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de cerrar un cambio documental, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione el cambio real, el codigo y la documentacion ya existente antes de escribir (no redacte de memoria).
- [ ] **Declaro** que decidi explicitamente si habia que documentar, y el destino elegido sigue la jerarquia de esta skill (SSOT > docs > README > `.teams/` > `.questions/` > script > comentario).
- [ ] **Declaro** que describo el estado final util, no el diff ni el proceso historico.
- [ ] **Declaro** que NO duplique contenido entre fuentes (una sola canonica + enlaces breves).
- [ ] **Declaro** que NO cree documento nuevo cuando bastaba actualizar una fuente canonica existente.
- [ ] **Declaro** que recorte el contenido que no evita errores, no fija decisiones ni ayuda a retomar el trabajo.

# Flujo recomendado

- [ ] Leer el cambio real, la SSOT y la documentacion existente.
- [ ] Decidir si hace falta documentacion nueva o basta ajustar una fuente existente.
- [ ] Elegir el destino correcto segun la jerarquia.
- [ ] Escribir solo el minimo contenido util para evitar errores, drift o perdida de contexto.
- [ ] Eliminar o evitar duplicacion y ruido documental cuando se detecten.
- [ ] Resolver el gate de auto-cita.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers

- Keywords: documentar, docs, README, documentacion, crear doc, actualizar doc, escribir documentacion.
- Patrones de usuario: "documenta esto", "necesita documentacion?", "actualiza el README", "revisa la documentacion", "sin inflar docs".
- Encadenamiento: transversal; usar junto a cualquier skill que genere documentacion (`arrancar-proyecto`, `definir-producto`, `definir-reglas-proyecto`, `configurar-entorno`, `gestionar-roadmap`).

# Ejemplos de activacion

- "Revisa si este cambio necesita documentacion o si seria ruido."
- "Documenta esto bien, pero sin inflar `docs/`."
- "Alinea la documentacion de este cambio con una estrategia transversal coherente."
