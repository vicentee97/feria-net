---
name: ejecutar-operaciones-sensibles
description: "Usar cuando vayas a ejecutar operaciones destructivas o de alto impacto (borrar, drop, reset, force push, migraciones destructivas, cambios fuera del workspace) sin prompts de aprobacion: aplica comprobaciones previas, reduccion de alcance, evidencia y rollback. TRIGGERS: borrar, delete, drop, truncate, reset hard, force push, cleanup masivo, migracion destructiva, tocar fuera del workspace."
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
- Operaciones por GUI o computer-use sobre el sistema real (apps, cuentas, perfiles del usuario): nivel ALTO por defecto y superficie declarada.

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
- NEVER un borrado recursivo sin el chequeo de reparse points y las cotas de `usar-powershell-seguro` (R1/R2/R3): si la operacion se ejecuta via script o PowerShell, cargar ADEMAS esa skill (reciproco del encadenamiento).
- Tripwires de "masivo": > 50 items, > 500 MB, o cualquier ruta fuera del workspace ⇒ preview obligatorio + esta skill activada.

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

## Iron Law: COMPROBAR OBJETIVO EXACTO Y REDUCIR ALCANCE ANTES DE OPERACIONES DESTRUCTIVAS

NO EJECUTO UNA OPERACION DESTRUCTIVA O DE ALTO IMPACTO SOBRE FILESYSTEM, SQL, GIT, CONFIGURACIONES GLOBALES O RUTAS FUERA DEL WORKSPACE SIN HABER COMPROBADO ANTES EL OBJETIVO EXACTO, REDUCIDO EL ALCANCE A LA VERSION MAS ACOTADA POSIBLE Y DEJADO EVIDENCIA MINIMA DE POR QUE ESE OBJETIVO ES EL CORRECTO.

**Consecuencia si se incumple:** Un borrado o reset sobre la ruta, tabla o rama equivocada destruye trabajo legitimo. La autonomia total del usuario no es seguro contra errores silenciosos del LLM que no valido el target.

## Rationalization Table: cuando la autonomia del usuario parece permiso para saltarse prechecks

Pensamientos tipicos del LLM y la realidad que los desmonta:

| Pensamiento | Realidad |
|---|---|
| "El usuario dijo que no es peligrosa, le hago caso" | "No peligrosa" lo dijo el usuario, no la verificacion. Sin estimar impacto, dependencias ni objetivo exacto, esa frase no protege de un borrado o update equivocado. |
| "Ya tengo autorizacion total, ejecuto rapido sin evidencia" | La autonomia total no exime del contrato de evidencia minima: que se va a tocar, por que, que comprobacion previa. Sin evidencia, la accion es temeridad, no autonomia. |
| "Es una rama de pruebas o tabla pequena, no importa perder trabajo" | Las ramas pequenas tambien pueden contener trabajo util o referencias cruzadas que no recordabas. La falta de valor aparente no es permiso para borrar sin listar antes. |
| "Ya conozco los comandos git o sql, ejecuto sin mas comprobaciones" | Conocer el comando no es conocer el objetivo exacto. `Remove-Item -Recurse -Force` sobre rutas calculadas o `DELETE` sin WHERE no son errores del comando, son errores del LLM que no valido. |

# Flujo recomendado
- [ ] Clasificar el riesgo y la categoria de la operacion.
- [ ] Resolver el objetivo exacto: ruta, tabla, rama, remoto, archivo o recurso.
- [ ] Hacer preview, estimacion o lectura equivalente cuando exista.
- [ ] Reducir alcance a la version mas acotada y segura posible.
- [ ] Preparar transaccion, backup o rollback si es razonable.
- [ ] Ejecutar.
- [ ] Verificar el resultado real.
- [ ] Cerrar explicando accion, alcance, evidencia y riesgo residual.

# Criterio de resultado bueno (gate de cierre, auto-cita)
- [ ] **Declaro** el objetivo exacto comprobado (ruta absoluta, tabla, rama) y el alcance reducido a la version mas acotada posible.
- [ ] **Declaro** la comprobacion previa realizada (preview, conteo, lectura equivalente) con su evidencia.
- [ ] **Declaro** el backup o transaccion preparada cuando el objetivo era irremplazable.
- [ ] **Declaro** el destino de escalada si el riesgo excedia mi frontera (Git → @experto-github, datos → @ingeniero-backend, secretos → @especialista-seguridad, resto → persona).
- [ ] **Declaro** el riesgo residual o el rollback posible.

## Triggers
- Keywords: borrar, delete, drop, truncate, reset hard, force push, cleanup, purge, remove-item, rm, outside workspace, external_directory
- Patrones de usuario: "borra esto", "limpia todo", "haz una migracion de datos", "resetea", "elimina fuera del proyecto", "haz force push", "quita esos archivos"
- Encadenamiento: usar como skill transversal cuando una tarea de dominio implique operacion destructiva o de alto impacto; si la operacion se ejecuta via script o PowerShell, cargar ADEMAS `usar-powershell-seguro` (reciproco)

# Ejemplos de activacion
- "Borra los artefactos viejos fuera del workspace."
- "Limpia estas filas duplicadas de la base de datos."
- "Haz reset hard de esta rama y vuelve a sincronizar."
- "Elimina las configuraciones MCP viejas del usuario."
