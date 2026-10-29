---
name: rendimiento-backend-datos
description: "Usar cuando haya lentitud en backend o datos: consultas SQL lentas, N+1, endpoints que tardan, queries sin indices. Obliga a MEDIR primero (EXPLAIN, tiempos, contadores) antes de tocar, proponer la mejora con evidencia y verificar la mejora real. Espejo de rendimiento-frontend para el servidor. TRIGGERS: consulta lenta, query lenta, endpoint lento, N+1, indices, EXPLAIN, tarda mucho, base de datos lenta, rendimiento backend, optimizar query."
---

# Rendimiento Backend Datos

Metodo para diagnosticar y mejorar lentitud de backend y datos: MEDIR primero con el oraculo correcto (plan de ejecucion, tiempos, contadores), proponer UNA mejora con evidencia, y verificar la mejora con la misma medicion.

## Frontera (leer primero)
- `implementar-backend-datos` construye; esta diagnostica lentitud.
- `rendimiento-frontend` mide el navegador; esta mide servidor y base de datos.
- Si la lentitud es de red o infraestructura (DNS, TLS, instalacion), diagnosticarlo y derivar a `configurar-entorno`.

# Objetivo
- Convertir la optimizacion de backend y datos en un metodo medido: linea base, diagnostico con plan de ejecucion, UNA mejora con evidencia y re-medicion con la misma herramienta.

# Alcance y limites
- Aplica a lentitud de queries SQL, endpoints de servidor, N+1, indices y planes de ejecucion.
- No cubre el navegador (ver `rendimiento-frontend`) ni la construccion de features nuevas (ver `implementar-backend-datos`).
- Todo cambio de schema pasa por `implementar-backend-datos`; lo destructivo, por `ejecutar-operaciones-sensibles`.

# Inputs / contexto obligatorio
- La consulta o endpoint lento y su frecuencia/volumen.
- Acceso a `EXPLAIN ANALYZE` o tiempos por etapa, y al codigo que lanza la query.
- La linea base numerica ANTES de cualquier cambio (R1).

## Reglas duras (MUST/NEVER)
- R1. MUST medir ANTES de tocar: la consulta lenta con su plan de ejecucion (`EXPLAIN ANALYZE`) o el endpoint con tiempos por etapa; NEVER "optimizar" sin linea base numerica. "Se siente lento" no es una medicion.
- R2. NEVER anadir un indice "por si acaso": cada indice se justifica con el plan de ejecucion que lo pide (seq scan sobre filas filtradas) y se verifica su coste de escritura.
- R3. MUST re-medir despues del cambio con la MISMA medicion y reportar antes/despues; sin mejora demostrada, la mejora se revierte.
- R4. NEVER arreglar N+1 solo en el codigo del fix de turno si el patron se repite: señalar todos los puntos con el mismo patron.
- R5. Todo cambio de schema (indices, vistas materializadas) pasa por `implementar-backend-datos` y sus reglas de migracion.

## Comportamiento esperado
1. **Localizar**: que es lento exactamente — query concreta, endpoint, cola, funcion. Pedir o capturar el dato: tiempo total, frecuencia, volumen.
2. **Medir linea base**: `EXPLAIN ANALYZE` de la consulta, tiempos por etapa del endpoint (serializacion vs query vs red), contador de queries por request (cazador de N+1).
3. **Diagnosticar** con el plan: seq scan donde deberia haber index scan, sort en memoria, filas estimadas vs reales (estadisticas desactualizadas), N+1 (una query por item).
4. **Proponer UNA mejora con evidencia**: indice que el plan pide, reescritura que elimina el N+1 (join o batch), cache con invalidacion declarada, paginacion. Orden: barato y reversible primero.
5. **Verificar**: misma medicion, antes/despues, y efecto secundario verificado (escritura no degradada, plan sin nuevo scan sorpresa).
6. **Cerrar** con: linea base, cambio, despues, riesgo residual (coste de escritura del indice, invalidacion de cache).

## Anti-patrones y su correccion
- **Indice a ciegas:** MAL añadir indices por columna "por si acaso". BIEN índice que el EXPLAIN pide (columna filtrada/ordenada en la query lenta) verificado con el plan nuevo.
- **Cache como primera opcion:** MAL meter cache antes de medir. BIEN primero eliminar trabajo innecesario (N+1, columnas de mas); la cache es ultima y lleva invalidacion declarada.
- **Optimizar lo que no es el cuello:** MAL reescribir una query que tarda 5 ms de un endpoint que tarda 2 s en otra etapa. BIEN el desglose por etapas primero (R1).

## Flujo recomendado
- [ ] Identificar el caso lento y su frecuencia/volumen.
- [ ] Linea base: EXPLAIN ANALYZE o tiempos por etapa (R1).
- [ ] Diagnostico con evidencia del plan/contadores.
- [ ] UNA mejora propuesta con el plan que la justifica (R2).
- [ ] Implementar (via implementar-backend-datos si toca schema).
- [ ] Re-medir con la misma medicion; antes/despues; revertir si no mejora (R3).

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] **Declaro** la linea base medida con su herramienta (EXPLAIN ANALYZE, tiempos por etapa) pegada como evidencia.
- [ ] **Declaro** el diagnostico con el plan de ejecucion (o contadores) y la mejora propuesta UNICA.
- [ ] **Declaro** la re-medicion con la misma herramienta: antes X, despues Y.
- [ ] **Declaro** el efecto secundario verificado (escritura, planes de otras queries).
- [ ] **Declaro** el riesgo residual y el punto de revision.

## Triggers
- Keywords: consulta lenta, query lenta, endpoint lento, N+1, indices, EXPLAIN, tarda mucho, base de datos lenta, rendimiento backend, optimizar query, plan de ejecucion
- Patrones de usuario: "esta consulta tarda muchisimo", "el listado tarda en cargar", "creo que hay un N+1", "la base de datos va lenta"
- Encadenamiento: los cambios de schema/migracion se ejecutan via `implementar-backend-datos`; lo destructivo pasa por `ejecutar-operaciones-sensibles`; si el lentо es visible en UI, coordinar con `rendimiento-frontend`.

# Ejemplos de activacion
- "El listado de pedidos tarda 8 segundos: encuentra por que."
- "Creo que hay un N+1 en la pantalla de detalle: confirmalo y arreglalo."
- "Esta query se puso lenta con los datos de este mes: analizala."
