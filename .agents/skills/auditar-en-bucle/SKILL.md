---
name: auditar-en-bucle
description: "Usar cuando el usuario pida una auditoria masiva en bucle de un corpus (skills, docs, codigo) con flota de subagentes de lectura sola y lentes distintas, produciendo un documento vivo de hallazgos verificados. TRIGGERS: audita toda la noche, bucle nocturno, analisis masivo, flota de subagentes, lentes distintas, documento vivo, ojos nuevos, Noche, revisa todo el hub, auditoria multiple, hazme un Nochexxx."
---

# Auditar en bucle

Procedimiento probado para auditar un corpus entero (skills, documentacion, codigo) con una flota de subagentes de lectura sola, lentes distintas y un documento vivo, hasta cerrar la ventana de tiempo o converger. Primera ejecucion real (15/09/2026): 46 skills, ~165 hallazgos, 12 subagentes, verificacion 13/13 sin falsos positivos, en ~70 minutos.

## Frontera (leer primero)
- `refinar-en-bucle` refina un OBJETIVO o plan hasta converger antes de ejecutarlo; esta skill AUDITA un corpus ya existente y produce hallazgos. Si lo que quieres es mejorar un plan, usa aquella; si quieres radiografiar un corpus, esta.
- `revisar-cambios` revisa un diff puntual antes de publicar; esta es flota masiva sobre un corpus completo.
- `usar-powershell-seguro` es OBLIGATORIA si algun subagente lanzara procesos; por defecto la flota entera es de lectura sola y no aplica.
- El informe visible al jefe se redacta segun `comunicar-como-jefe` o el contrato de comunicacion activo: conclusion primero, lenguaje llano.

## Reglas duras (MUST/NEVER) — cada una con su incidente de origen

**R1. Analistas de lectura sola.** MUST limitar cada subagente analista a leer y analizar; solo el coordinador consolida y escribe el documento. Un analista que edita compite con el corpus que esta auditando.

**R2. Relanzar los caidos.** MUST contabilizar los subagentes que mueren sin informe y reanudarlos (mensaje de continuacion o nuevo despacho con metodo mas ligero). Incidente origen: 2 de 12 subagentes murieron en silencio la primera noche; uno se recupero reanudandolo, la otra se relanzo con metodo simplificado.

**R3. Higiene horaria.** NEVER escribas horas estimadas "a ojo" en el documento o el informe; la hora se MIDE (reloj del sistema, CreationTime/LastWriteTime) o se omite. Incidente origen: el log de la primera noche llevaba horas inventadas que no cuadraban con el sistema de ficheros; el jefe las detecto.

**R4. Documento vivo.** MUST cosechar los hallazgos en el documento tras cada oleada, dejandolo util en cualquier punto: si el bucle se corta a medias, lo que hay ya sirve.

**R5. El consolidador arbitra.** MUST recoger las contradicciones entre lentes en una seccion propia y reconciliar los conteos enfrentados por grep o medicion; NEVER dejes cifras enfrentadas impresas sin veredicto. Incidente origen: dos lentes reportaron conteos distintos de skills sin gate y ambos quedaron impresos.

**R6. Ojos nuevos antes del cierre.** MUST cerrar con al menos una pasada de agentes frescos que no hayan participado: (a) un verificador de los hallazgos graves contra los ficheros reales, (b) un cazador de ciegas (angulos que ninguna lente uso, contradicciones entre lentes, riesgos del plan). Incidente origen: la pasada de ojos nuevos confirmo 13/13 hallazgos graves y encontro 2 errores del propio documento coordinador.

**R7. El goal es una ventana, no un entregable.** Cuando el bucle corre bajo un goal del harness: NEVER completes el objetivo antes de la hora de corte; si no queda trabajo nuevo, lanza otra lente de verificacion y registra "ronda N: sin hallazgos nuevos". El driver de rondas de DSH no tiene evaluador externo: el modelo que decide el cierre es el modelo que trabaja, y la plantilla de la seccion siguiente existe para amarrarle las manos.

**R8. Modelos de la flota, por calidad/precio.** MUST lanzar cada lente con un modelo de la lista cerrada por defecto —**DeepSeek V4.1 Flash**, **GLM 5.3 Flash**, **MiniMax M3 / M3.1 Flash** o **MiMo V2.6 Flash**— y MUST dejar escrito en el log de rondas del documento **con que modelo corrio cada lente**. Una lente que necesite **ver imagenes** usa **GLM 5.3 Flash o MiniMax**, que si aceptan imagen; NEVER se salta a un modelo caro por eso. Los modelos de gama alta (**Kimi K3, Qwen3.8 Max** y cualquier equivalente) estan **reservados**: exigen un caso justificado y **aviso al dueño** antes de lanzarlos. La regla completa, con su lista cerrada y su excepcion, vive en el Apartado C de `gobernar-ciclo-chat`; aqui solo se aplica. Incidente origen: una oleada de 4 lentes de vision (describir 6 capturas) se lanzo con Kimi K3 y Qwen3.8 Max, los dos ids mas caros del catalogo, porque el modelo del coordinador no aceptaba imagenes.

# Objetivo
- Convertir la auditoria masiva con flota de lentes en un procedimiento repetible: el jefe pide con una frase corta y la skill aporta el metodo probado (oleadas globales, bloques individuales, documento vivo, ojos nuevos, plan en tandas).
- Que el resultado quede util a medio hacer, verificado antes de confiarse, y con las decisiones del jefe separadas y visibles.

# Alcance y limites
- Aplica a auditorias de corpus en LECTURA SOLA (skills, documentacion, codigo, configuracion) coordinadas por una sesion que consolida.
- No cubre la implementacion de las mejoras encontradas (sesion posterior con las skills de dominio) ni sustituye a `revisar-cambios` para un diff puntual.
- Fuera de lectura sola, entran `usar-powershell-seguro` y las reglas locales del proyecto, que mandan.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) y [reglas globales](../docs/AI_GLOBAL_RULES.md).
- Corpus a auditar y su ruta real; nombre del documento entregable; ventana horaria (inicio y corte).
- Presupuesto de verificacion: que se considera suficiente (solo graves, muestreo P2/P3, 100%).
- Si el bucle corre bajo un goal del harness: usar la plantilla de goal-ventana de esta skill.

## Plantilla del goal-ventana (copiar, cambiar el MAYUSCULAS)

```text
Trabaja en bucle hasta las 05:00 auditando <CORPUS> con subagentes de lectura sola
y lentes distintas, cosechando cada oleada en el documento <DOCUMENTO>.
NUNCA marques el objetivo como completo antes de las 05:00.
Si crees que esta terminado, NO completes: lanza otra pasada de verificacion con
una lente distinta y registra "ronda N: sin hallazgos nuevos".
Trabajo inagotable declarado: verificar el 100% de los hallazgos P2/P3 acumulados,
profundizar item a item, y una pasada de ojos nuevos al final.
```

## Comportamiento esperado

### Fase 0 — Inventario
- Lista del corpus completo (carpetas, ficheros o items) con metricas mecanicas basicas: tamano, presencia de secciones o partes esperadas, fechas.
- Definir las 3-5 lentes globales adaptadas al dominio del corpus (ejemplos probados: routing/naming, estructura y gates, solapes y huecos, valor real y coste, riesgo operativo, concrecion, experiencia del usuario).

### Fase 1 — Oleada global
- Un subagente por lente, lectura sola, con formato de salida exigido (resumen + hallazgos numerados con severidad y propuesta + top 5).

### Fase 2 — Bloques individuales
- Partir el corpus en bloques tematicos coherentes (~7-8 items) y dar a cada subagente una lente de enfasis DISTINTA para multiplicar angulos.
- Ficha por item: veredicto con nota, hallazgos con severidad, que recortaria/anadiria/reescribiria, solapes.

### Fase 3 — Cosecha viva
- Integrar cada informe en el documento al aterrizar: hallazgos globales por lente, fichas por item, log de rondas.
- Relanzar o reanudar los caidos (R2). Actualizar el estado del bucle en cada cosecha.

### Fase 4 — Ojos nuevos (R6)
- Verificador: confirma o refuta los hallazgos graves citando linea literal de los ficheros reales.
- Cazador de ciegas: angulos que ninguna lente uso, contradicciones entre lentes, riesgos del plan propuesto.
- Integrar veredictos (CONFIRMADO/REFUTADO/matizado) y corregir los errores del propio documento que salgan.

### Fase 5 — Consolidacion
- Plan de implementacion en tandas ordenadas por palanca y riesgo, con las decisiones que necesita el jefe marcadas como lista propia.
- Marcar solapes entre tandas (si una fusion hace tirar un refuerzo, hay que decirlo).
- Informe visible al jefe en lenguaje del jefe.

### Fase 6 — Bucle
- Repetir fases 1-5 con lentes nuevas hasta cerrar la ventana de tiempo o hasta que una ronda fresca no aporte hallazgos nuevos (senal de parada real; "esta perfecto" NO es una senal).

## Estructura del documento entregable
1. Encabezado: que es, ventana REAL (medida), para que sirve.
2. Estado del bucle (ronda, cosechado, en vuelo).
3. Hallazgos globales por lente (incluida una "Lente 0" mecanica del coordinador, con sus metricas medidas y pendientes de confirmacion).
4. Fichas por item (acumulando lentes).
5. Plan de implementacion en tandas, con decisiones para el jefe separadas.
6. Registro de ojos nuevos (veredictos con evidencia).
7. Log de rondas.

## Flujo recomendado
- [ ] Inventario + metricas mecanicas del corpus (Lente 0 del coordinador).
- [ ] Oleada global (3-5 lentes) en paralelo, lectura sola.
- [ ] Cosechar en el documento; relanzar caidos.
- [ ] Bloques individuales con lente de enfasis por bloque.
- [ ] Cosechar; ojos nuevos (verificador + ciegas).
- [ ] Consolidar plan en tandas con decisiones del jefe; informe visible.
- [ ] Bucle hasta ventana o convergencia; cierre con log limpio (R3).

# Criterio de resultado bueno (gate de cierre, auto-cita)

- [ ] Declaro que todo subagente analista fue de lectura sola, con el modelo por defecto que exige R8 (o el aviso al dueño y el motivo de la excepcion), y que solo el coordinador edito el documento (R1, R8).
- [ ] Declaro los subagentes caidos y como se reanudaron o relanzaron (R2).
- [ ] Declaro que ninguna hora del documento o del informe es estimada: medida u omitida (R3).
- [ ] Declaro que el documento quedo util tras cada oleada, no solo al final (R4).
- [ ] Declaro las contradicciones entre lentes y como se arbitraron (R5).
- [ ] Declaro la pasada de ojos nuevos con su veredicto de confirmacion/refutacion con evidencia (R6).
- [ ] Si hubo goal: declaro que NO se completo antes de la hora de corte, o la razon por la que el jefe autorizo cerrarlo antes (R7).

## Triggers
- **Keywords:** audita toda la noche, bucle nocturno, analisis masivo, flota de subagentes, lentes distintas, documento vivo, ojos nuevos, revisa todo el hub, auditoria multiple, auditoria nocturna, Nochexxx
- **Patrones de usuario:** "deja IAs trabajando toda la noche analizando", "hazme un Noche", "lanza subagentes con distintos criterios y recoge todo en un documento", "quiero que muchas IAs revisen esto"
- **Encadenamiento:** hermana de `refinar-en-bucle` (esa refina un objetivo; esta audita un corpus); el informe visible se redacta con `comunicar-como-jefe` o el contrato activo; `usar-powershell-seguro` si la flota lanzara procesos; los hallazgos que exijan cambios en el hub vuelven a `crear-skills`/`endurecer-skills` en la sesion de implementacion.

# Ejemplos de activacion
- "Deja IAs trabajando toda la noche analizando las skills del hub."
- "Haz un Noche_0102: que revisen la documentacion entre varias y me lo dejes en un documento."
- "Quiero muchas opiniones frescas sobre este corpus antes de tocar nada."
