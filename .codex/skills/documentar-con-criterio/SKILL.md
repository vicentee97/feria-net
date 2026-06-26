---
name: documentar-con-criterio
description: "Decide que documentacion crear, actualizar o evitar para mantener una documentacion canonica, util y proporcionada al cambio real, sin ruido ni duplicacion. TRIGGERS: documentar, docs, README, documentacion, crear doc, actualizar doc, escribir documentacion."
---

# Objetivo
Mantener una documentación útil, consistente y proporcionada al cambio real.

La skill debe ayudar a decidir **si hay que documentar**, **dónde**, **cuánto** y **con qué nivel de detalle**, evitando tanto la omisión de información importante como la inflación documental.

# Alcance y límites
- Sí define criterios transversales para documentación canónica, operativa y de soporte.
- Sí decide si una información debe vivir en `docs/`, `docs/SSOT.md`, `README`, `.teams/`, `.questions/`, un script o un comentario de código.
- Sí debe frenar documentación redundante, efímera o demasiado obvia.
- Sí puede usarse junto a otras skills que creen o actualicen documentación.
- No sustituye a la skill de dominio que genera el contenido concreto.
- No obliga a crear un documento nuevo si basta con actualizar una fuente canónica ya existente.
- No convierte la documentación en changelog narrativo ni en espejo del código.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Documentación existente relevante.
- Código, scripts o configuración reales afectados por el cambio.
- Diff o cambio que se está aplicando, si existe.

# Comportamiento esperado
La skill debe empezar preguntándose si la documentación aporta valor operativo real.

Antes de escribir nada:
1. Inspeccionar el cambio real, el código y la documentación ya existente.
2. Detectar si la información ya está documentada en un sitio canónico.
3. Decidir si el problema es de ausencia, desalineación, duplicidad o exceso de detalle.
4. Elegir el artefacto correcto antes de redactar contenido nuevo.

## Regla base
Documentar solo lo que:
- evita errores o bloqueos;
- fija decisiones difíciles de inferir;
- aclara contratos, rutas, flujos o reglas de uso;
- ayuda a retomar el trabajo sin depender de memoria conversacional.

No documentar lo que:
- el código o el script ya expresan claramente por sí solos;
- es un detalle visual menor de un menú o prompt;
- es temporal, experimental o fácil de deducir;
- solo aporta historial o narración sin valor operativo actual.

## Jerarquía de destino
Elegir el destino con este criterio:

1. `docs/SSOT.md`
   - para contexto canónico, rutas clave, precedencia, estado general y decisiones estructurales del proyecto o repositorio.
2. `docs/` especializados
   - para detalle que supera razonablemente la SSOT y seguirá siendo útil.
3. `README.md`
   - para entrada rápida, uso básico o visión general orientada a humanos.
4. `.teams/`
   - para registro operativo, hipótesis, decisiones del hilo y trazabilidad de trabajo.
5. `.questions/`
   - para dudas reales no resueltas.
6. Script, `.env.example` o archivo de configuración de ejemplo
   - cuando la mejor explicación es un artefacto operable y mantenible.
7. Comentario de código
   - solo cuando el comportamiento no es obvio leyendo el código.

## Reglas prácticas de cantidad
- Preferir actualizar una fuente existente antes que abrir otra.
- Preferir bloques cortos y densos en señal antes que texto narrativo largo.
- Si un detalle no cambia decisiones ni evita errores, omitirlo.
- Si un documento empieza a duplicar otra fuente canónica, recortar y enlazar.
- Si una mejora es solo cosmética o autoexplicativa, dejarla en el código o script.

## Reglas de consistencia
- Mantener una sola fuente de verdad por tema.
- No repartir la misma regla entre varias skills o varios documentos salvo referencia breve.
- Cuando una skill de dominio genere documentación, debe alinearse con esta estrategia transversal.
- Si el cambio afecta a varias capas, documentar lo común aquí y dejar en la skill de dominio solo lo específico.

## Casos típicos
### Sí documentar
- un cambio de ruta canónica;
- un flujo oficial de setup o restauración;
- una decisión arquitectónica no obvia;
- una diferencia relevante entre máquinas;
- un contrato operativo que el usuario necesita repetir.

### No documentar en docs
- que un menú muestra `[ultimo]`;
- que un script imprime una columna más;
- un detalle trivial del orden de botones si no cambia el flujo;
- una implementación obvia que ya está clara en el código.

## Señales de sobre-documentación
- describe microdetalles de UI o scripts sin impacto operativo;
- explica el diff en vez del comportamiento final;
- duplica texto entre `SSOT`, README y docs especializadas;
- conserva "historia" que ya no guía ninguna decisión actual.

## Relación con otras skills
- `arrancar-proyecto` crea la base documental mínima.
- `definir-producto`, `definir-arquitectura`, `configurar-entorno`, `configurar-testing` y `definir-reglas-proyecto` generan contenido de dominio y deben apoyarse en este criterio.
- `gestionar-roadmap` mantiene `docs/TODO.md` sin ruido.
- `validar-calidad` revisa si la documentación necesaria quedó alineada tras el cambio.
- `mantener-cerebro-operativo` puede usar esta skill para sanear drift documental del propio hub.

# Flujo recomendado
- [ ] Leer el cambio real, la SSOT y la documentación existente.
- [ ] Decidir si realmente hace falta documentación nueva o basta con ajustar una fuente existente.
- [ ] Elegir el destino correcto del contenido.
- [ ] Escribir solo el mínimo contenido útil para evitar errores, drift o pérdida de contexto.
- [ ] Eliminar o evitar duplicación y ruido documental cuando se detecten.
- [ ] Revisar que el resultado describe el estado final útil, no el proceso histórico del cambio.

# Criterio de resultado bueno
La skill está bien aplicada si:
- la documentación ayuda a operar mejor el proyecto o el hub;
- el contenido importante queda en una fuente canónica clara;
- no aparecen documentos o párrafos redundantes;
- el detalle es suficiente para actuar, pero no tanto como para enterrar la señal;
- y otra IA puede continuar el trabajo sin depender de contexto conversacional oculto.

## Triggers
- Keywords: documentar, docs, README, documentacion, crear doc, actualizar doc, escribir documentacion
- Patrones de usuario: "documenta esto", "necesita documentacion?", "actualiza el README", "revisa la documentacion", "sin inflar docs"
- Encadenamiento: transversal, usar junto a cualquier skill que genere documentacion

# Ejemplos de activación
"Revisa si este cambio necesita documentación o si sería ruido."

"Documenta esto bien, pero sin inflar `docs/`."

"Alinea la documentación de este cambio con una estrategia transversal coherente."
