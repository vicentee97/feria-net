---
name: ejecutar-operaciones-sensibles
description: "Ejecutar comandos, SQL, operaciones Git, cambios fuera del workspace y acciones de alto impacto sin depender de prompts de aprobacion, aplicando comprobaciones previas, reduccion de alcance, evidencia y rollback cuando sea posible. TRIGGERS: borrar, delete, drop, truncate, reset hard, force push, cleanup masivo, migracion destructiva, tocar fuera del workspace."
---

# Ejecutar Operaciones Sensibles
Contrato reusable para operaciones potencialmente destructivas o de alto impacto cuando el runtime no va a pedir aprobacion o cuando el usuario quiere autonomia total sin ventanas intermedias.

# Objetivo
- Permitir ejecucion autonoma de operaciones sensibles sin convertirlas en impulsivas.
- Reducir el riesgo de borrados masivos, cambios irreversibles o ediciones fuera de objetivo.
- Forzar comprobaciones previas, delimitacion de alcance y evidencia antes de tocar datos, Git, filesystem o configuraciones externas.

# Alcance y limites
- Aplica a operaciones destructivas o de alto impacto en filesystem, SQL, Git, scripts, infraestructura, configuraciones globales y rutas fuera del workspace.
- Complementa las skills de dominio; no las sustituye.
- No obliga a bloquearse ni a pedir aprobacion por defecto si el usuario ya ha decidido dar autonomia total al runtime.
- Si existe una forma segura de previsualizar, estimar impacto, limitar alcance o dejar rollback, debe usarse.
- Si no es posible demostrar un nivel razonable de seguridad, la IA debe escalar o dejar la accion sin ejecutar aunque tecnicamente tenga permiso.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Skill de dominio aplicable, si existe.
- Objetivo exacto del usuario y superficie real afectada.
- Comandos, rutas, consultas, tablas, ramas, remotos o recursos implicados.

# Comportamiento esperado
## 1. Clasificar el tipo de riesgo
Antes de ejecutar, identifica si la operacion toca una o varias de estas categorias:
- borrado o sobreescritura de archivos;
- cambios fuera del workspace;
- SQL destructivo o mutacion masiva de datos;
- reescritura de historia Git o cambios remotos sensibles;
- limpieza agresiva de caches, contenedores, volumenes o artefactos;
- cambios de configuracion global del IDE, maquina o usuario.

## 2. Verificar objetivo exacto
- Resuelve rutas absolutas y objetivos concretos antes de borrar, mover o editar.
- En SQL, identifica tabla, filtro, estimacion de filas afectadas y criterio de seleccion real.
- En Git, identifica repo, rama, remoto, refs y alcance de la accion.
- En configuraciones externas, identifica archivo exacto y si existe backup o forma simple de restaurar.

## 3. Reducir alcance antes de ejecutar
Si existe una version mas acotada o reversible de la operacion, prefierela.

Ejemplos:
- usar seleccion explicita en vez de comodines amplios;
- mover a cuarentena o renombrar antes que borrar definitivamente cuando sea razonable;
- hacer preview de coincidencias antes de `Remove-Item` o `rm`;
- hacer `SELECT COUNT(*)` o equivalente antes de `DELETE` o `UPDATE`;
- listar ramas, tags o archivos afectados antes de eliminarlos;
- tocar primero una sola ruta, una sola tabla o un solo recurso cuando el cambio pueda validarse por lotes.

## 4. Exigir evidencia minima antes de ejecutar
La IA debe poder explicar, aunque sea de forma breve:
- que se va a tocar exactamente;
- por que ese objetivo es el correcto;
- que comprobacion previa hizo;
- que hace improbable un alcance accidental.

No basta con "parece correcto".

## 5. Priorizar transacciones, backups y rollback cuando existan
- En SQL, usar transaccion o estrategia reversible cuando el entorno lo permita.
- En filesystem, preferir backup, copia o cuarentena si el coste es razonable.
- En Git, evitar acciones irreversibles si existe una alternativa conservadora.
- En configuraciones globales, guardar contenido previo o diff cuando sea posible.

## 6. Reglas duras por categoria
### Filesystem
- No hagas borrados masivos sobre rutas calculadas sin comprobar antes el target final.
- No mezcles resolucion de rutas inciertas con eliminacion recursiva.
- Si la ruta sale del workspace, comprueba dos veces que coincide con el objetivo del usuario.

### SQL y datos
- No ejecutes `DELETE`, `UPDATE`, `DROP`, `TRUNCATE` o migraciones destructivas sin estimar impacto.
- Si el `WHERE` es complejo o dudoso, valida primero con una lectura equivalente.
- Si no puedes estimar o limitar razonablemente el alcance, escala.

### Git
- No hagas `reset --hard`, `push --force`, borrado de ramas/tags o reescritura de historia por comodidad.
- Solo usa acciones remotas sensibles cuando el objetivo las requiera de verdad y el contexto este claro.
- Si existe una ruta conservadora que cumple el objetivo, prefierela.

### Configuraciones externas y globales
- No escribas en rutas fuera del workspace por tanteo.
- Verifica archivo, formato y ambito antes de guardar.
- Si una configuracion es global de usuario o de IDE, deja claro que superficie externa fue tocada.

## 7. Cierre obligatorio
Tras ejecutar una operacion sensible, devuelve como minimo:
- accion ejecutada;
- objetivo exacto afectado;
- comprobacion previa realizada;
- resultado observado;
- riesgo residual o rollback posible si aplica.

# Flujo recomendado
- [ ] Clasificar el riesgo y la categoria de la operacion.
- [ ] Resolver el objetivo exacto: ruta, tabla, rama, remoto, archivo o recurso.
- [ ] Hacer preview, estimacion o lectura equivalente cuando exista.
- [ ] Reducir alcance a la version mas acotada y segura posible.
- [ ] Preparar transaccion, backup o rollback si es razonable.
- [ ] Ejecutar.
- [ ] Verificar el resultado real.
- [ ] Cerrar explicando accion, alcance, evidencia y riesgo residual.

# Criterio de resultado bueno
- La IA puede ejecutar sin prompts de aprobacion sin comportarse de forma temeraria.
- Las operaciones sensibles no dependen de intuicion ni de comandos amplios "porque si".
- Queda evidencia de por que el alcance era el correcto.
- Si el riesgo no se podia acotar con razon suficiente, la IA no ejecuta por inercia.

## Triggers
- Keywords: borrar, delete, drop, truncate, reset hard, force push, cleanup, purge, remove-item, rm, outside workspace, external_directory
- Patrones de usuario: "borra esto", "limpia todo", "haz una migracion de datos", "resetea", "elimina fuera del proyecto", "haz force push", "quita esos archivos"
- Encadenamiento: usar como skill transversal cuando una tarea de dominio implique operacion destructiva o de alto impacto

# Ejemplos de activacion
- "Borra los artefactos viejos fuera del workspace."
- "Limpia estas filas duplicadas de la base de datos."
- "Haz reset hard de esta rama y vuelve a sincronizar."
- "Elimina las configuraciones MCP viejas del usuario."
