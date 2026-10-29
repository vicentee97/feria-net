---
name: auditar-seguridad
description: "Usar antes de exponer una web o app, ante cualquier duda sobre auth, permisos, secretos, RLS, uploads, webhooks, pagos o dependencias, o como pre-publicacion sensible para AUDITAR y REPORTAR la superficie de ataque con severidad y evidencia. TRIGGERS: seguridad, auditar seguridad, revisar auth, revisar permisos, revisar secretos, revisar datos personales, revisar RLS, hardening, pre-publicacion sensible."
---

# Auditar Seguridad

# Frontera de la skill: AUDITA, reporta (LEER PRIMERO)

Esta skill es de auditoria de seguridad, no de ejecucion. La frontera es estricta:

- **REPORTA** hallazgos con severidad (`P0`-`P3`), evidencia observable y accion recomendada.
- **NEVER** implementa fixes por iniciativa propia; si el usuario pide corregir, entra el agente especialista del dominio (`@ingeniero-backend`, `@implementador`) bajo brief explicito.
- **NEVER** ejecuta operaciones destructivas (borrar secretos versionados, rotar claves, reescribir historial) sin activar `ejecutar-operaciones-sensibles`.
- Si aparece un secreto real versionado, se trata como incidente y se escala OBLIGATORIAMENTE a **@especialista-seguridad**; no basta borrarlo del archivo.

Razon: una auditoria que corrige pierde su valor como checkpoint neutral previo a publicacion. Ver [auditar-proyecto-tecnico/SKILL.md](../auditar-proyecto-tecnico/SKILL.md) para la misma frontera aplicada a configs y dependencias.

# Objetivo

Revisar seguridad de webs, apps, APIs y cambios de infraestructura con criterio practico, profundo y proporcional al riesgo. La skill busca evitar brechas reales sin convertir cada tarea en paranoia: encuentra fallos materiales, deja riesgos visibles y coordina con los agentes adecuados para corregir, validar o publicar.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Paranoia sin ruta de explotacion:** MAL reportar como hallazgo cualquier teoria sin una ruta de explotacion razonable. BIEN exigir un camino concreto (quien llama, con que input, que obtiene) antes de marcar P0/P1. EJEMPLO "el JWT no valida `aud`" sin mostrar quien puede forjar un token valido -> descartar o bajar a P3 hasta tener evidencia.
- **Confundir UI oculta con seguridad:** MAL tratar que un boton o ruta no se muestre en frontend como control de acceso. BIEN verificar el bloqueo en servidor (rol/ownership/policy) para cada mutacion y lectura. EJEMPLO ocultar el panel admin en UI sin gate server-side -> P1 real, no hardening opcional.
- **Hardening marginal como hallazgo:** MAL inflar el reporte con endurecimientos teoricos sin beneficio practico. BIEN separar `P3` (recomendacion, no bloqueante) de `P0/P1` (explotable) y declarar el riesgo residual en vez de exigir perfeccion. EJEMPLO sugerir HSTS en un dominio interno sin TLS -> P3 o nota, no P1.
- **Filtrar stack o secretos en errores:** MAL aceptar mensajes de error que exponen SQL, stack trace, tokens o reglas internas. BIEN senalar cada fuga con evidencia y recomendar errores seguros (genericos al cliente, detallados solo en logs de servidor). EJEMPLO un 500 que devuelve el query SQL -> P1.
- **Confiar en input del cliente para identidad/precio:** MAL asumir que `userId`, `role`, `tenantId`, `price` o `status` enviados por el cliente son fiables. BIEN verificar cada uno en servidor contra la sesion y la fuente de verdad. EJEMPLO webhook de pago que reusa el `amount` del cliente -> P0/P1.
- **Service role o secretos en cliente:** MAL mover `SERVICE_ROLE`, private keys o webhook secrets al frontend o a una Server Action sin gate. BIEN garantizar que las claves privadas viven solo en servidor y que el cliente usa la clave publicable. EJEMPLO `import { createClient } from '@supabase/supabase-js'` con service role en un componente cliente -> P0.

# Alcance y limites
- Aplica a autenticacion, autorizacion, sesiones, datos sensibles, secretos, backend, APIs, Supabase/Postgres/RLS, storage, uploads, frontend, webhooks, pagos, dependencias, GitHub, CI y publicacion.
- Sirve antes de disenar, despues de implementar o antes de publicar una superficie sensible.
- No sustituye a `revisar-cambios`: esta skill se centra en seguridad, no en review general.
- No sustituye a `validar-calidad`: puede pedir checks, pero no cierra build/test completo.
- No implementa fixes por defecto; audita y reporta. Si el usuario pide corregir, entra el agente especialista del dominio.
- No ejecuta operaciones destructivas sin activar `ejecutar-operaciones-sensibles`.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Diff, brief, superficie o flujo a revisar.
- Arquitectura, rutas, APIs, policies, schemas, variables y configuracion disponibles.
- `.teams/`, `.questions/`, TODO o documentacion local relevante.
- Skills de dominio si aplican: `implementar-backend-datos`, `revisar-cambios`, `validar-calidad`, `configurar-github`, `ejecutar-operaciones-sensibles`.

# Comportamiento esperado

## 1. Clasificar superficie y riesgo
Antes de auditar, identifica:
- que flujo o datos se protegen;
- quien puede llamar o ver cada parte;
- si hay datos personales, secretos, dinero, permisos admin, multi-tenant, webhooks, uploads o APIs publicas;
- si el cambio es diseno previo, implementacion hecha o revision pre-publicacion.

Estados de riesgo:
- `bajo`: no toca datos sensibles, auth, permisos ni superficie publica.
- `medio`: toca APIs, formularios, logs, uploads, configuracion o datos de usuario no criticos.
- `alto`: toca auth, roles, RLS, secretos, pagos, admin, webhooks, datos personales o multi-tenant.
- `critico`: puede exponer datos, permitir acceso indebido, romper aislamiento, filtrar secretos o ejecutar acciones destructivas.

## 2. Checklist operativo
Aplica solo lo que corresponda al cambio, pero no omitas una categoria si la superficie la toca.

### Auth y sesiones
- Login, logout, registro, recuperacion de contrasena y refresh.
- Cookies: `httpOnly`, `secure`, `sameSite`, dominio, expiracion.
- JWT o tokens: expiracion, audience, issuer, almacenamiento y rotacion.
- Frontera server/client: no mover secretos ni checks de confianza al cliente.
- Estados de sesion: anonimo, autenticado, expirado y revocado.

### Autorizacion
- Roles y permisos reales en servidor.
- Ownership: un usuario no puede leer o mutar recursos de otro.
- Multi-tenant: tenant/org/account no se puede cambiar desde input no confiable.
- Admin: no basta ocultar UI; el backend debe bloquear.
- Acceso horizontal y vertical: IDOR, escalada de rol, bypass por rutas directas.

### Datos sensibles
- PII: emails, telefonos, direcciones, nombres, documentos, historial, metadatos.
- Tokens, claves, sesiones, reset links e identificadores internos.
- Logs, errores, exports, backups y trazas.
- Minimizar exposicion: devolver solo campos necesarios; no imprimir secretos ni datos personales.

### Secretos y configuracion
- `.env`, service role, private keys, webhook secrets y tokens de proveedor.
- Diferenciar claves publicas y privadas; no versionar secretos ni meterlos en cliente.
- Revisar CI/CD y variables expuestas.
- Si aparece un secreto real, tratar como incidente: no basta borrarlo del archivo.

### Backend, APIs y Server Actions
- Validacion server-side de input y permisos.
- No confiar en datos del cliente para userId, role, tenantId, price, status o ownership.
- Errores seguros: no filtrar stack, SQL, tokens o reglas internas.
- CORS, CSRF y rate limiting cuando aplique a la arquitectura.
- Idempotencia en acciones sensibles, pagos, webhooks y mutaciones repetibles.

### Supabase, Postgres y RLS
- RLS activado donde corresponda y policies revisables.
- Policies para `anon` y `authenticated` sin escritura publica accidental.
- Storage buckets: lectura/escritura, rutas, ownership y MIME/tamano.
- Funciones `security definer` solo si hacen falta y con `search_path` controlado.
- Migraciones, seeds y tipos sin IDs o secretos de produccion hardcodeados.
- Service role solo en servidor y nunca en cliente.

### Uploads y storage
- Tipo, tamano, extension, MIME y contenido esperado.
- Rutas no predecibles si exponen informacion sensible.
- Evitar overwrite o lectura publica accidental; sanitizar nombres y metadatos.
- Comprobar permisos de descarga, borrado y actualizacion.

### Frontend
- No tratar la UI como barrera de seguridad.
- No exponer datos privados en props, HTML, localStorage, logs o errores.
- Estados de error seguros y sin pistas internas.
- Links y rutas admin protegidos tambien en servidor.

### Webhooks, pagos e integraciones
- Verificacion de firma y secreto; proteccion ante replay.
- Idempotencia por event id o equivalente.
- Logs sin payload sensible completo; estados transaccionales consistentes.
- No confiar en precio, estado o identidad enviados por cliente.

### Dependencias y supply chain
- Dependencias nuevas o scripts postinstall sospechosos.
- Lockfile coherente; fuentes externas, CDN, scripts remotos o paquetes no mantenidos.
- Comandos de instalacion o build que ejecutan codigo externo.

### GitHub, CI y publicacion
- Secretos versionados o expuestos en logs de CI.
- Workflows que imprimen env vars o tokens.
- Ramas, tags y releases que publican una superficie sensible sin revision.
- Cambios de seguridad deben pasar por review/QA proporcional antes de `configurar-github`.

## 3. Severidad de hallazgos
- `P0`: explotable o muy probable, expone secretos/datos, permite acceso indebido critico, perdida de dinero/datos o bypass total.
- `P1`: riesgo alto real en auth, permisos, RLS, datos sensibles, pagos o webhooks; debe corregirse antes de publicar.
- `P2`: fallo de seguridad acotado o hardening necesario con impacto plausible; normalmente corregir antes de merge/publicacion.
- `P3`: recomendacion de hardening o riesgo bajo; no bloquea salvo acumulacion o contexto sensible.

## 4. Salida obligatoria
La respuesta debe incluir:

```text
Estado: seguro razonable | seguro con riesgo residual | bloqueado

Superficie revisada:
- <flujos, archivos, APIs o configs revisadas>

Hallazgos:
- <P0/P1/P2/P3, evidencia, impacto y accion recomendada>

Evidencia observada:
- <hechos del codigo, config o docs>

No se pudo verificar:
- <huecos reales o ninguno>

Riesgo residual:
- <riesgo restante o ninguno material>

Accion recomendada:
- <corregir | validar | documentar | publicar | no publicar>

Agentes siguientes:
- <@especialista-seguridad | @ingeniero-backend | @implementador | @revisor | @qa-validador | @documentador | @experto-github | ninguno>
```

Si no hay hallazgos materiales, decirlo claramente: `No he encontrado hallazgos materiales de seguridad con la evidencia revisada`.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la auditoria lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que clasifique la superficie y el nivel de riesgo (bajo/medio/alto/critico) antes de aplicar el checklist, y que aplique las categorias que la superficie toca (no todas por reflejo).
- [ ] **Declaro** que cada hallazgo cita evidencia observable (archivo/linea/policy/comando) y una ruta de explotacion razonable; evite inflar con teorias sin ruta (anti-patron paranoia).
- [ ] **Declaro** que distingui control server-side de UI oculta y que senale como P0/P1 las fugas de secretos, service role en cliente o input de cliente confianza para identidad/precio.
- [ ] **Declaro** que NO implemente fixes por iniciativa propia; las correcciones quedan como recomendacion con el agente responsable.
- [ ] **Declaro** que separe `P0/P1` (bloqueantes) de `P2/P3` (hardening) y que el estado final es `seguro razonable`, `seguro con riesgo residual` o `bloqueado` con motivacion.
- [ ] **Declaro** que deje claro que no se publico nada y que la salida sigue el formato obligatorio de arriba.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

Esta skill es la capa de auditoria, pero el agente que audita seguridad no es el que califica el cierre. Antes de cerrar:

- **SIEMPRE** que la auditoria detecte **secrets versionados, auth/permisos mal configurados, RLS ausente o rota, datos personales expuestos o superficie publica sensible** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad** para validacion del diagnostico y cierre de seguridad. No queda como hallazgo P3.
- Si la auditoria se hace sobre un **cambio concreto que va a publicarse** y hay hallazgos `P0/P1` -> delegar OBLIGATORIAMENTE a **@qa-validador** para re-validar build/typecheck/lint tras la correccion, antes de cerrar.
- Si la auditoria revela **refactor material** (varias superficies sensibles con impacto, arquitectura de auth incoherente) -> derivar a **@revisor** para revision de riesgo antes de entregar el reporte.
- Si el resultado es `seguro razonable` sin hallazgos materiales -> sin segunda IA obligatoria (no burocracia innecesaria), pero declararlo explicitamente.

# Flujo recomendado
- [ ] Leer SSOT, reglas globales y contexto real (diff/brief/superficie).
- [ ] Clasificar superficie y riesgo.
- [ ] Aplicar el checklist operativo por categoria tocada.
- [ ] Emitir hallazgos con severidad y evidencia, separando riesgos materiales de hardening opcional.
- [ ] Resolver el gate de auto-cita y el gate de segunda IA.
- [ ] Recomendar agente siguiente y dejar claro que no se publico nada.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: seguridad, auditar seguridad, revisar auth, revisar autenticacion, revisar autorizacion, revisar permisos, revisar roles, revisar secretos, revisar datos personales, PII, revisar RLS, CORS, CSRF, rate limit, webhook, pagos, uploads, admin, hardening, pre-publicacion sensible.
- Patrones de usuario: "audita la seguridad", "revisa si esto es seguro", "aplica criterio de seguridad a este cambio", "mira permisos y RLS", "hay riesgo con datos personales?", "revisa secrets antes de subir".
- Encadenamiento: antes de `configurar-github` en cambios sensibles; despues de `@ingeniero-backend` o `@implementador` si tocaron auth, datos, APIs, permisos, uploads, webhooks o admin; hermana de `revisar-cambios` (review general) y `validar-calidad` (gate tecnico).

# Ejemplos de activacion
- "Audita la seguridad del flujo de login y cuenta."
- "Revisa RLS, storage y permisos antes de publicar."
- "Audita la seguridad de este cambio de webhook y pagos."
