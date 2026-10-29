---
name: explorar-proyecto-existente
description: "Usar cuando el dueño trae un proyecto ajeno o existente (codigo heredado, repo de terceros) y hay que entenderlo antes de tocar: mapa de stack, entrypoints, estructura, convenciones y estado (git, tests, docs), produciendo un informe que deriva a definir-reglas-proyecto. TRIGGERS: proyecto existente, codigo heredado, repo de terceros, explora este proyecto, entiende el codigo, onboarding, que hace este proyecto, familiarizate."
---

# Explorar Proyecto Existente

Metodo para hacerse cargo de un proyecto que ya existe (codigo heredado o de terceros): mapa de stack, entrypoints, estructura, convenciones y estado, con un informe que deja al equipo en condiciones de trabajar sin adivinar.

## Frontera (leer primero)
- `arrancar-proyecto` es para repos SIN estructura base; esta skill es para los que YA la tienen.
- `configurar-entorno` es para la maquina nueva; esta explora el CODIGO y produce el mapa. Pueden encadenarse: primero el mapa, luego el entorno.
- El informe termina recomendando `definir-reglas-proyecto` para fijar las reglas locales descubiertas.

# Objetivo
- Producir el mapa completo de un proyecto existente (stack, entrypoints, estructura, convenciones, estado) que deja al equipo trabajando sin adivinar, con los riesgos heredados visibles.

# Alcance y limites
- Aplica a repos heredados o de terceros que YA tienen estructura base (si no existe, ver `arrancar-proyecto`).
- LECTURA sola: explora y documenta; los cambios son recomendaciones del informe.
- No cubre el entorno de maquina (ver `configurar-entorno`).

# Inputs / contexto obligatorio
- Ruta del repositorio y acceso de lectura (incluido su estado git).
- El README y docs existentes, solo como hipotesis a contrastar (R5).
- Si el dueño tiene contexto historico, recogerlo sin depender de el.

## Reglas duras (MUST/NEVER)
- R1. LECTURA sola: esta skill explora y documenta; NEVER tocar codigo, renombrar, "arreglar" nada ni ejecutar comandos que muten el proyecto. Los cambios van en el informe como recomendaciones.
- R2. MUST verificar el stack con ficheros reales (package.json, requirements.txt, pom.xml, go.mod...), nunca por el nombre de la carpeta o la extension de un archivo suelto.
- R3. MUST localizar los entrypoints reales (main, index, rutas, scripts de arranque del README) y el sistema de build/test que exista, con los comandos exactos documentados como "sin verificar en ejecucion" si no se han corrido.
- R4. MUST reportar el estado de git (rama, remoto, cambios sin commitear, worktrees) antes de cualquier recomendacion: heredar un repo con trabajo sin commitear cambia todo el plan.
- R5. NEVER asumir que el README esta al dia: contrastarlo con lo que hay (hallazgo tipico: docs de una version, codigo de otra).

## Comportamiento esperado
1. **Estado**: git (rama, remoto, dirty, worktrees), tamano, ultimo commit, tests presentes (¿corren? marcado como sin verificar si no se ejecutan).
2. **Stack**: lenguaje(s) y versiones, framework, gestor de dependencias, bases de datos/servicios externos declarados, variables de entorno esperadas (nombres, JAMAS valores).
3. **Mapa**: entrypoints, estructura de carpetas con su rol deducido, zonas calientes (ficheros enormes, TODO/FIXME concentrados, carpetas sin tocar).
4. **Convenciones detectadas**: naming real, patron de rutas, estilo de commits (del log), docs canonicas frente a docs huerfanas.
5. **Riesgos heredados**: secretos potenciales en el repo (solo señalar, nunca imprimir), dependencias sin version exacta, scripts destructivos en package.json, ausencia de tests/licencia.
6. **Informe final**: mapa + riesgos + recomendaciones ordenadas (definir-reglas-proyecto primero; configurar-entorno si el entorno no corre; arrancar-proyecto NO aplica aqui).

## Anti-patrones y su correccion
- **Explorar por inercia de stack:** MAL asumir "es un proyecto Next" porque hay un next.config. BIEN verificar manifest, entrypoints y scripts (R2).
- **Tocar para entender:** MAL "pruebo a cambiar esto y veo que pasa" en codigo heredado sin tests. BIEN leer, ejecutar el test suite existente si existe, y documentar.
- **README como verdad:** MAL fiarse del README sin contrastar. BIEN R5: contrastar con los ficheros reales y reportar la divergencia.

## Flujo recomendado
- [ ] Estado de git y arbol base (R4).
- [ ] Stack verificado por manifests (R2).
- [ ] Entrypoints, build, test y arranque documentados con comandos exactos (R3, marcando los no ejecutados).
- [ ] Mapa de estructura con roles y zonas calientes.
- [ ] Convenciones detectadas y divergencias con la documentacion existente (R5).
- [ ] Riesgos heredados señalados (sin valores de secretos).
- [ ] Informe final con recomendaciones ordenadas y derivacion a definir-reglas-proyecto.

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] **Declaro** el stack verificado por manifests concretos (no por nombres de carpeta).
- [ ] **Declaro** el estado de git (rama, remoto, dirty) reportado antes de las recomendaciones.
- [ ] **Declaro** los entrypoints y comandos de build/test/arranque localizados, marcando los no ejecutados.
- [ ] **Declaro** el mapa de estructura con roles y zonas calientes.
- [ ] **Declaro** los riesgos heredados señalados sin exponer ningun valor de secreto.
- [ ] **Declaro** que nada fue modificado (R1) y que el informe deriva a definir-reglas-proyecto.

## Triggers
- Keywords: proyecto existente, codigo heredado, repo de terceros, explora este proyecto, entiende el codigo, onboarding, que hace este proyecto, familiarizate, mapa del proyecto
- Patrones de usuario: "me han pasado este repo, entiendelo", "explora este proyecto y dime como esta", "es codigo heredado, hazte un mapa antes de tocar", "herede este proyecto"
- Encadenamiento: derivar a `definir-reglas-proyecto` (fijar lo descubierto), `configurar-entorno` (si el entorno no corre), `validar-calidad` (si hay suite y hay que conocer su estado); `arrancar-proyecto` NO aplica (el proyecto ya existe).

# Ejemplos de activacion
- "Me han pasado este repo de otro desarrollador: hazte un mapa antes de tocar nada."
- "Explora este proyecto heredado y dime stack, entrada y riesgos."
- "Vamos a tomar el mantenimiento de este codigo: onboarding completo."
