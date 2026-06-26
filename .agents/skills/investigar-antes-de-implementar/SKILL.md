---
name: investigar-antes-de-implementar
description: "Fuerza investigacion exhaustiva antes de implementar: contrastar fuentes primarias, verificar documentacion actual y no asumir APIs, librerias ni configuraciones. TRIGGERS: investigar, buscar, fuentes, contrastar, verificar, docs, documentacion, antes de implementar, no asumir."
---

# Investigar Antes De Implementar

# Objetivo
Garantizar que cualquier implementacion dependiente de APIs, librerias, frameworks, servicios externos, patrones o configuraciones se base en informacion verificada y actual.

El conocimiento del modelo caduca. La skill evita copiar patrones de memoria cuando la version real del proyecto o la documentacion actual pueden haber cambiado.

Tambien aplica como habito proactivo: si durante una tarea aparece una duda material sobre informacion cambiante, una fuente contradictoria o una decision tecnica apoyada en memoria del modelo, la IA debe parar lo justo para contrastar fuentes antes de consolidar la respuesta o implementar.

# Alcance y limites
- Aplica antes de implementar codigo que dependa de librerias, frameworks, SDKs, APIs externas, configuraciones de build, servicios cloud o integraciones.
- Si obliga a comprobar versiones reales y documentacion primaria cuando haya riesgo de drift.
- Si exige dejar evidencia breve de que se verifico lo necesario.
- No convierte tareas puramente internas y obvias en investigacion larga.
- No sustituye a `actuar-como-senior` cuando la tarea exige comparar alternativas o tomar una decision arquitectonica.
- No sustituye a `configurar-mcp` cuando el problema sea instalar o verificar herramientas MCP.

# Inputs / contexto obligatorio
- Versiones reales del proyecto (`package.json`, lockfile, configs, imports o equivalente).
- Codigo cercano y patrones ya usados en el repo.
- Documentacion oficial o MCP/documentacion primaria de la libreria o servicio.
- Brief o cambio solicitado.

# Comportamiento esperado
Antes de implementar:
1. Identificar que API, metodo, patron o configuracion necesita verificarse.
2. Comprobar la version o contexto real del proyecto.
3. Consultar fuentes primarias disponibles, priorizando MCPs oficiales, documentacion oficial y Context7 cuando aplique.
4. Contrastar con codigo existente para respetar convenciones locales.
5. Anotar riesgos si la version documentada no coincide con la version instalada o si la fuente no resuelve la duda.

## Prioridad de fuentes
1. MCP especifico del proveedor o libreria cuando exista.
2. Documentacion oficial actual.
3. Context7 u otra fuente documental actualizada y trazable.
4. Codigo del proyecto como evidencia de convencion local.
5. Fuentes secundarias solo como apoyo, no como autoridad principal.

## Fuentes contradictorias
Cuando las fuentes no coincidan:
- prioriza la version real del proyecto: `package.json`, lockfile, imports, configuracion, migraciones o equivalente;
- despues prioriza documentacion oficial de la version aplicable y fuentes primarias del proveedor;
- pondera fecha, version cubierta, autoridad de la fuente, coherencia con el codigo local y riesgo de equivocarse;
- trata blogs, snippets, issues antiguas, respuestas de foros y memoria del modelo como indicios, no como autoridad;
- si la contradiccion sigue siendo material, reporta la incertidumbre y elige la opcion mas conservadora o pide decision si bloquea.

## Anti-patrones
- No asumir que una API existe porque era comun en otra version.
- No copiar snippets de memoria sin verificar.
- No usar blogs, foros o ejemplos sueltos como fuente primaria.
- No ignorar discrepancias entre documentacion y version instalada.
- No esconder la incertidumbre: si no se pudo verificar, declararlo como riesgo.

# Flujo recomendado
- [ ] Definir exactamente que hay que verificar.
- [ ] Localizar version y configuracion real del proyecto.
- [ ] Consultar fuente primaria adecuada.
- [ ] Contrastar con patrones locales.
- [ ] Implementar solo con la informacion suficiente.
- [ ] Reportar brevemente fuentes, version y riesgos.

# Criterio de resultado bueno
La skill esta bien aplicada si:
- el agente sabe que API, version y patron esta usando;
- la implementacion no depende de una suposicion del modelo;
- las fuentes usadas quedan claras para el orquestador o el siguiente agente;
- cualquier incertidumbre relevante queda visible.

## Formato de salida recomendado
Cuando la investigacion sea material, incluir un bloque breve:

```md
## Investigacion previa
- Tema: <que se verifico>
- Fuentes: <fuentes consultadas>
- Version verificada: <version o contexto>
- Hallazgos clave: <resumen>
- Riesgos o dudas: <si aplica>
```

## Triggers
- Keywords: investigar, buscar, fuentes, contrastar, verificar, docs, documentacion, antes de implementar, no asumir
- Patrones de usuario: "investiga antes", "no asumas", "verifica la documentacion", "comprueba como se hace en esta version"
- Encadenamiento: antes de implementar cuando haya APIs, librerias, frameworks, servicios o configuraciones externas.

# Ejemplos de activacion
"Antes de tocar HeroUI, verifica en la documentacion actual como se usa este componente."

"No asumas la API de Supabase; confirma el patron correcto para esta version."
