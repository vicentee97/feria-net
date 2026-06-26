---
name: investigar-negocio-comercial
description: "Investiga proveedores, precios, packaging, logistica, equipamiento, margenes y decisiones comerciales para proyectos que venden algo, documentando evidencia actual sin ejecutar compras ni contactos. TRIGGERS: proveedores, precios, compras, packaging, logistica, mensajerias, equipamiento, margenes, vender, negocio, comercial."
---

# Investigar Negocio Comercial

# Objetivo
Investigar y documentar informacion comercial util para proyectos que venden productos o servicios: proveedores, precios, costes, packaging, logistica, equipamiento, alternativas, margenes y contactos potenciales.

La skill convierte investigacion cambiante de internet o fuentes externas en documentacion Markdown accionable dentro del proyecto destino, sin introducir herramientas externas innecesarias ni absorber datos concretos en el hub.

# Alcance y limites
- Si compara proveedores, equipos, materiales, servicios logisticos, precios, condiciones de compra o venta y alternativas comerciales.
- Si ayuda a decidir donde comprar, que proveedor priorizar, que coste estimar o que informacion falta antes de vender.
- Si genera o actualiza documentacion local del proyecto, normalmente bajo una ruta candidata como `docs/negocio/...`, despues de verificar la SSOT local.
- Si debe incluir fecha de revision, fuentes, moneda, IVA/impuestos, envio, unidad de medida y nivel de confianza cuando aplique.
- No compra, contrata, contacta proveedores, envia correos ni realiza acciones externas en nombre del usuario.
- No guarda secretos, credenciales, datos bancarios, API keys ni informacion sensible en documentos versionados.
- No crea carpetas genericas como `Marketing`, `Compras` o `Economia` desde el minuto cero; solo documenta cuando existe necesidad real del proyecto.
- No sustituye a `documentar-con-criterio`: lo usa para decidir destino y cantidad de documentacion.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Documentar Con Criterio](../documentar-con-criterio/SKILL.md).
- Skill `actuar-como-senior` para decisiones comerciales con alternativas reales.
- Skill `investigar-antes-de-implementar` para precios, proveedores, servicios, normativa, disponibilidad o informacion que pueda cambiar.
- SSOT y documentacion existente del proyecto destino.
- Pregunta comercial concreta, mercado objetivo, pais/region, moneda y restricciones conocidas cuando existan.

# Comportamiento esperado
La skill debe tratar la informacion comercial como perecedera. Una recomendacion sin fecha, fuente y supuestos no es suficiente.

Antes de documentar:
1. Reconstruir el contexto del proyecto destino: que vende, a quien, en que region y que decision comercial se quiere tomar.
2. Revisar si ya existe documentacion local sobre negocio, precios, compras, proveedores, packaging, logistica o equipamiento.
3. Decidir si basta con actualizar un documento existente o si conviene crear uno nuevo.
4. Activar investigacion actual cuando la informacion dependa de precios, stock, proveedores, tarifas, condiciones o disponibilidad.

Durante la investigacion:
- Preferir fuentes primarias: web oficial del proveedor, tienda, ficha de producto, tarifa oficial, documentacion del transportista o pagina legal.
- Usar fuentes secundarias solo como apoyo, nunca como base unica de una decision importante.
- Separar precio observado, coste estimado y supuesto.
- Indicar moneda, IVA/impuestos, envio, cantidades minimas, plazos, garantia, pais y fecha de consulta cuando aplique.
- Registrar incertidumbres materiales: precios sin IVA claro, stock no confirmado, proveedor sin datos fiscales visibles, tarifa bajo presupuesto, condiciones no verificadas.
- Comparar alternativas con criterios utiles para el proyecto, no solo precio: fiabilidad, soporte, disponibilidad, compatibilidad, coste total, riesgo y facilidad de reposicion.

Al documentar:
- Guardar la informacion concreta solo en el proyecto destino, no en `CerebroOperativoIA`, salvo que sea una politica reusable de investigacion.
- Tratar `docs/negocio/...` como ruta candidata razonable, no obligatoria; verificar primero la SSOT y la estructura existente.
- Mantener documentos densos y operativos: tablas, decisiones, fuentes y pendientes claros.
- Evitar narrativa larga y capturas de contexto que caduquen rapido.

## Formato recomendado de salida
Cuando el agente o la IA aplique esta skill, debe devolver:
- Resumen ejecutivo.
- Tabla comparativa con alternativas.
- Recomendacion y motivo.
- Fuentes consultadas con enlaces.
- Fecha de revision.
- Supuestos, riesgos e incertidumbres.
- Documentos creados o actualizados, o documentos propuestos si no se debe escribir aun.

## Campos minimos para tablas comerciales
Usar solo los campos que aporten valor para la decision:
- Alternativa o proveedor.
- Producto/servicio.
- Precio observado.
- Moneda.
- IVA/impuestos.
- Envio.
- Unidad o cantidad minima.
- Plazo o disponibilidad.
- Ventajas.
- Riesgos.
- Fuente.
- Fecha de consulta.
- Nivel de confianza: alto, medio o bajo.

# Flujo recomendado
- [ ] Leer SSOT y documentacion local del proyecto destino.
- [ ] Identificar la decision comercial real y la region/moneda aplicable.
- [ ] Buscar documentacion existente antes de crear archivos nuevos.
- [ ] Activar `actuar-como-senior` si hay que recomendar entre alternativas.
- [ ] Activar `investigar-antes-de-implementar` si la informacion puede estar desactualizada.
- [ ] Investigar fuentes primarias y registrar fecha, fuente y supuestos.
- [ ] Comparar opciones con coste total y riesgo, no solo precio.
- [ ] Documentar en el destino minimo util usando `documentar-con-criterio`.
- [ ] Devolver resumen, recomendacion, fuentes y riesgo residual.

# Criterio de resultado bueno
La skill esta bien aplicada si:
- la informacion comercial queda trazable a fuentes actuales;
- otra IA puede revisar la fecha y saber que puede haber caducado;
- las alternativas se comparan con criterios relevantes para el proyecto;
- los datos concretos viven en el proyecto destino;
- no se han guardado secretos ni se han ejecutado acciones externas;
- y la documentacion ayuda a decidir o retomar trabajo sin depender de memoria conversacional.

## Triggers
- Keywords: proveedores, precios, compras, packaging, logistica, mensajerias, envios, equipamiento, TPV, tickets, margenes, al por mayor, vender, comercial, negocio
- Patrones de usuario: "Busca proveedores para este proyecto", "Compara mensajerias y precios", "Documenta packaging para la tienda", "Investiga equipos TPV", "Calcula margenes con precios de compra y venta", "Mira donde comprar cajas"
- Encadenamiento: usar con `actuar-como-senior`, `investigar-antes-de-implementar` y `documentar-con-criterio`; derivar a `configurar-mcp` si falta un MCP preferente para investigacion web en el IDE usado

# Ejemplos de activacion
"Investiga impresoras de tickets compatibles para TPVManager y documenta opciones con precios y fuentes."

"Compara proveedores de packaging para HQPerfumes y deja una tabla con costes, envio e incertidumbres."
