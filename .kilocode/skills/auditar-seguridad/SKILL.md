---
name: auditar-seguridad
description: "Audita seguridad en webs y apps con criterio proporcional: auth, permisos, secretos, datos sensibles, RLS, APIs, uploads, webhooks, pagos, dependencias y publicacion. TRIGGERS: seguridad, auditar seguridad, revisar auth, revisar permisos, revisar secretos, revisar datos personales, revisar RLS, hardening, pre-publicacion sensible."
---

# Auditar Seguridad

# Objetivo
Revisar seguridad de webs, apps, APIs y cambios de infraestructura con criterio practico, profundo y proporcional al riesgo.

La skill busca evitar brechas reales sin convertir cada tarea en paranoia: encuentra fallos materiales, deja riesgos visibles y coordina con los agentes adecuados para corregir, validar o publicar.

# Alcance y limites
- Aplica a autenticacion, autorizacion, sesiones, datos sensibles, secretos, backend, APIs, Supabase/Postgres/RLS, storage, uploads, frontend, webhooks, pagos, dependencias, GitHub, CI y publicacion.
- Sirve antes de disenar, despues de implementar o antes de publicar una superficie sensible.
- No sustituye a `revisar-cambios`: esta skill se centra en seguridad, no en review general.
- No sustituye a `validar-calidad`: puede pedir checks, pero no cierra build/test completo.
- No implementa fixes por defecto; audita y reporta. Si el usuario pide corregir, debe entrar el agente especialista del dominio.
- No ejecuta operaciones destructivas o de alto impacto sin activar `ejecutar-operaciones-sensibles`.

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
- Estados de sesion: usuario anonimo, autenticado, expirado y revocado.

### Autorizacion
- Roles y permisos reales en servidor.
- Ownership: un usuario no puede leer o mutar recursos de otro.
- Multi-tenant: tenant/org/account no se puede cambiar desde input no confiable.
- Admin: no basta ocultar UI; el backend debe bloquear.
- Acceso horizontal y vertical: IDOR, escalada de rol, bypass por rutas directas.

### Datos sensibles
- PII: emails, telefonos, direcciones, nombres, documentos, historial, metadatos.
- Tokens, claves, sesiones, reset links y identificadores internos.
- Logs, errores, exports, backups y trazas.
- Minimizar exposicion: devolver solo campos necesarios.
- No imprimir secretos ni datos personales innecesarios.

### Secretos y configuracion
- `.env`, service role, private keys, webhook secrets y tokens de proveedor.
- Diferenciar claves publicas y privadas.
- No versionar secretos ni meterlos en cliente/frontend.
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
- Evitar overwrite o lectura publica accidental.
- Sanitizar nombres y metadatos.
- Comprobar permisos de descarga, borrado y actualizacion.

### Frontend
- No tratar la UI como barrera de seguridad.
- No exponer datos privados en props, HTML, localStorage, logs o errores.
- Estados de error seguros y sin pistas internas.
- Links y rutas admin protegidos tambien en servidor.

### Webhooks, pagos e integraciones
- Verificacion de firma y secreto.
- Proteccion ante replay.
- Idempotencia por event id o equivalente.
- Logs sin payload sensible completo.
- Estados transaccionales consistentes.
- No confiar en precio, estado o identidad enviados por cliente.

### Dependencias y supply chain
- Dependencias nuevas o scripts postinstall sospechosos.
- Lockfile coherente.
- Fuentes externas, CDN, scripts remotos o paquetes no mantenidos.
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

No reportes como hallazgo:
- teoria sin ruta de explotacion razonable;
- preferencias de estilo;
- checks no aplicables a la arquitectura;
- endurecimientos marginales sin beneficio practico.

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
- <@ingeniero-backend | @implementador | @revisor | @qa-validador | @documentador | @experto-github | ninguno>
```

Si no hay hallazgos materiales, dilo claramente: `No he encontrado hallazgos materiales de seguridad con la evidencia revisada`.

## 5. Relacion con otras skills y agentes
- Si hay que corregir backend, datos, RLS, APIs o webhooks: derivar a `@ingeniero-backend`.
- Si hay que corregir UI/frontend, exposicion cliente o estados visibles: derivar a `@implementador`.
- Si hay que revisar el diff completo ademas de seguridad: derivar a `@revisor`.
- Si falta build, tests, typecheck o comprobacion tecnica: derivar a `@qa-validador`.
- Si hay que documentar politica, riesgo o operativa: derivar a `@documentador`.
- Si ya esta seguro y autorizado para publicar: derivar a `@experto-github`.
- Si hay SQL destructivo, limpieza de secretos, force push, borrado remoto o accion sensible: activar `ejecutar-operaciones-sensibles`.
- Si depende de APIs o reglas de seguridad cambiantes: activar `investigar-antes-de-implementar`.

# Flujo recomendado
- [ ] Leer SSOT, reglas globales y contexto real.
- [ ] Clasificar superficie y riesgo.
- [ ] Revisar checklist aplicable.
- [ ] Emitir hallazgos con severidad y evidencia.
- [ ] Separar riesgos materiales de hardening opcional.
- [ ] Recomendar agente siguiente y cierre necesario.
- [ ] Dejar claro que no se publico nada.

# Criterio de resultado bueno
- Detecta brechas reales sin ruido.
- Protege auth, permisos, secretos, datos y superficies publicas.
- No confunde UI oculta con seguridad.
- Da acciones concretas, no consejos genericos.
- Declara lo que no pudo verificar.
- Permite a otro agente corregir o validar sin rehacer la auditoria desde cero.

## Triggers
- Keywords: seguridad, auditar seguridad, revisar auth, revisar autenticacion, revisar autorizacion, revisar permisos, revisar roles, revisar secretos, revisar datos personales, PII, revisar RLS, CORS, CSRF, rate limit, webhook, pagos, uploads, admin, hardening, pre-publicacion sensible
- Patrones de usuario: "audita la seguridad", "revisa si esto es seguro", "aplica criterio de seguridad a este cambio", "mira permisos y RLS", "hay riesgo con datos personales?", "revisa secrets antes de subir"
- Encadenamiento: antes de `configurar-github` en cambios sensibles; despues de `@ingeniero-backend` o `@implementador` si tocaron auth, datos, APIs, permisos, uploads, webhooks o admin

# Ejemplos de activacion
"Audita la seguridad del flujo de login y cuenta."
"Revisa RLS, storage y permisos antes de publicar."
"Audita la seguridad de este cambio de webhook y pagos."
