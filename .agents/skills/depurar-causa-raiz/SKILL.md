---
name: depurar-causa-raiz
description: "Usar cuando un bug no se va: reaparece tras el fix, nadie sabe reproducirlo o hay varias hipotesis en conflicto. Metodo sistematico de depuracion: reproducir de forma fiable, aislar, bisecar y verificar la causa raiz antes de tocar codigo. TRIGGERS: depurar, debug, bug que vuelve, no encuentro la causa, sigue fallando, reproducir el error, aislar el problema, bisecar, causa raiz."
---

# Depurar Causa Raiz

Metodo sistematico para bugs que no se van con el primer fix: reproducir de forma fiable, aislar la causa, bisecar si hace falta y verificar el arreglo contra la causa, no contra el sintoma.

## Frontera (leer primero)
- `cuestionar-enfoque` es para cuando el bug acumula 3+ tandas de parches fallidos: esta skill es el metodo ANTES de llegar ahi.
- `@revisor` hace review adversarial de codigo; esta skill define como ENCONTRAR la causa.
- Si el bug solo existe en produccion con datos reales, empezar por reproducibilidad, no por fijar codigo.

# Objetivo
- Convertir la depuracion de bugs dificiles en un metodo repetible: reproducir de forma fiable, aislar con una variable por vez, bisecar si hace falta y arreglar la causa raiz con el test de reproduccion en el suite.

# Alcance y limites
- Aplica a bugs que no se van con el primer fix, intermitentes, o con muchas versiones entre bien y roto.
- No sustituye a `cuestionar-enfoque` (3+ tandas de parches) ni a `@revisor` (review adversarial).
- Fuera de alcance: rendimiento (ver `rendimiento-frontend`/`rendimiento-backend-datos`) y decisiones de arquitectura.

# Inputs / contexto obligatorio
- El reporte del bug y los pasos exactos cuando existan.
- Historial reciente del area (git log) y tests existentes.
- Si hay 3+ tandas de parches, cargar `cuestionar-enfoque` antes.

## Reglas duras (MUST/NEVER)
- R1. MUST reproducir el bug de forma fiable antes de proponer fix: mismo input, mismo resultado erroneo, de preferencia automatizado (test que falla). NEVER "arreglar" un bug que no sabes reproducir: es adivinanza, no depuracion.
- R2. MUST aislar la causa con una variable por vez: comentar el diff reciente, desactivar sospechosos, añadir logging puntual. NEVER cambiar dos cosas a la vez: si mejora, no sabras cual era.
- R3. Si el bug aparece o desaparece entre muchas versiones, MUST bisecar (`git bisect`) con un script de reproduccion como criterio; NEVER bisecar a mano por intuicion.
- R4. NEVER declarar arreglado sin la evidencia: el test de reproduccion en verde + el caso que fallaba verificado de nuevo + explicacion de POR QUE la causa producia el sintoma.
- R5. Si tras el metodo la causa no aparece, escalar con la evidencia (reproduccion, biseccion, hipotesis descartadas): NEVER seguir lanzando fixes a ciegas.

## Comportamiento esperado
1. **Reproducir**: convertir el reporte en un caso minimo y fiable (test, comando o pasos exactos). Si es intermitente: identificar el factor que varía (concurrency, datos, cache, tiempo).
2. **Aislar**: reducir el caso hasta la frontera donde funciona/falla; una variable por vez (R2).
3. **Bisecar** si hay muchas versiones entre bien y roto: `git bisect start`, commit bueno, commit malo, criterio automatico (el test de R1).
4. **Causa raiz**: explicar el mecanismo completo ("porque X, entonces Y, por eso se ve Z"), no solo el punto donde explota.
5. **Arreglar en la causa**, no en el sintoma; añadir el test de reproduccion al suite para que no vuelva.
6. **Verificar**: test en verde, caso original re-verificado, revision de que el fix no rompa adyacentes.

## Anti-patrones y su correccion
- **Fix en el sintoma:** MAL añadir un `if` que esconda el caso que explota. BIEN corregir el mecanismo y dejar el test de reproduccion. EJEMPLO el null explota en la pantalla: el fix es en quien genera el null, no en la pantalla.
- **Depuracion por loteria:** MAL cambiar tres cosas "a ver si". BIEN una variable por vez con su resultado anotado (R2).
- **"No reproduce en mi maquina":** MAL cerrarlo ahi. BIEN documentar la diferencia de entorno (versiones, datos, config) como pista principal.

# Flujo recomendado
- [ ] Test o pasos exactos que reproducen el fallo de forma fiable.
- [ ] Aislamiento con una variable por vez; notas de cada resultado.
- [ ] Bisecar si el historial es amplio (R3).
- [ ] Explicar el mecanismo completo de la causa raiz.
- [ ] Fix en la causa + test de reproduccion añadido al suite.
- [ ] Verificar caso original y adyacentes; reportar con evidencia.

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] **Declaro** la reproduccion fiable (test o pasos exactos) y su resultado antes y despues.
- [ ] **Declaro** el mecanismo completo de la causa raiz (por que produce el sintoma), no solo el punto de fallo.
- [ ] **Declaro** las hipotesis descartadas y con que evidencia.
- [ ] **Declaro** el test de reproduccion añadido al suite (o por que no procede).
- [ ] **Declaro** los adyacentes verificados y el riesgo residual.

## Triggers
- Keywords: depurar, debug, bug que vuelve, no encuentro la causa, sigue fallando, reproducir el error, aislar el problema, bisecar, causa raiz, bug intermitente
- Patrones de usuario: "este bug vuelve siempre", "no encuentro por que falla", "a veces falla y a veces no", "ya lo arregle y sigue roto"
- Encadenamiento: hermana de `cuestionar-enfoque` (si ya van 3+ tandas, esa frena y esta explica); produce hallazgos para `@revisor`; los fixes verificados cierran con `validar-calidad`.

# Ejemplos de activacion
- "Este bug vuelve siempre aunque lo arreglamos: encuentra la causa raiz."
- "El fallo es intermitente en produccion: ayudame a reproducirlo y aislarlo."
- "Hay 40 commits entre que funcionaba y se rompio: biseca."
