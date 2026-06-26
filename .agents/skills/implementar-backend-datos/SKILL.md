---
name: implementar-backend-datos
description: "Implementa backend, SQL, Supabase, PostgreSQL, RLS, migraciones, seeds, APIs, webhooks, auth server-side y tipos con criterio seguro y verificable. TRIGGERS: backend, sql, supabase, postgresql, rls, migracion, seed, api, webhook, auth server-side, tipos."
---

# Implementar Backend Datos

# Objetivo
Guiar implementaciones de backend y datos para que sean coherentes con el proyecto real, seguras con permisos y datos, y faciles de validar.

La skill define el criterio reusable. El agente responsable decide el procedimiento tecnico concreto segun el repositorio, el brief y la documentacion local.

# Alcance y limites
- Aplica a SQL, PostgreSQL, Supabase, RLS, migrations, seeds, tipos generados, APIs, webhooks, Server Actions, auth server-side y logica de persistencia.
- Si debe inspeccionar schema, migraciones existentes, clientes backend y contratos de datos antes de escribir.
- Si debe dividir cambios amplios en bloques pequenos y verificables.
- No define UI, estilos, componentes visuales ni experiencia de usuario.
- No sustituye a `revisar-cambios` ni a `validar-calidad` para el cierre final.
- No ejecuta operaciones destructivas sin activar `ejecutar-operaciones-sensibles`.

# Inputs / contexto obligatorio
- `docs/SSOT.md` del proyecto.
- Roadmap o `docs/TODO.md` si existe.
- `.teams/` y `.questions/` relevantes.
- Migraciones, schema, tipos y clientes existentes.
- Variables o configuracion local disponible sin exponer secretos.
- Brief del orquestador o especificacion aprobada.

# Comportamiento esperado
Antes de implementar:
1. Reconstruir el estado real del backend desde documentacion y codigo.
2. Identificar contratos existentes: tablas, relaciones, RLS, tipos, APIs, acciones server-side y webhooks.
3. Comprobar si la tarea depende de documentacion externa actualizada; si aplica, activar `investigar-antes-de-implementar`.
4. Detectar si hay riesgo sensible: SQL destructivo, datos reales, permisos, secretos, cambios remotos o borrados. Si aplica, activar `ejecutar-operaciones-sensibles`.

Durante la implementacion:
- Mantener migraciones ordenadas, auditables e idempotentes donde sea razonable.
- Separar schema, policies, seeds y datos de prueba cuando el proyecto lo permita.
- Mantener nombres, tipos, constraints y defaults alineados con la SSOT local.
- Tratar RLS y ownership como parte central del diseno, no como anexo final.
- Evitar hardcodear secretos, IDs generados, claves privadas o datos de produccion.
- Actualizar tipos generados solo cuando el flujo del proyecto lo establezca y sea verificable.

Al cerrar:
- Reportar archivos tocados, decisiones relevantes y checks ejecutados.
- Declarar riesgos residuales cuando no se pueda validar contra base real o entorno remoto.
- Pedir cierre con `@revisor` si toca permisos, datos sensibles, RLS o flujos criticos.
- Pedir cierre con `@qa-validador` para build, typecheck, tests, migraciones o validaciones proporcionales.

## Criterios especificos para SQL y Supabase
- Crear enums, funciones, triggers, policies y tablas en orden seguro.
- Usar claves foraneas y `ON DELETE` de forma explicita y coherente con el dominio.
- Evitar policies que abran escritura publica por accidente.
- Usar funciones auxiliares de permisos con `security definer` solo cuando sea necesario y con `search_path` controlado.
- No asumir que insertar directamente en `auth.users` es valido para seeds de usuarios; documentar o delegar el flujo correcto.
- Para storage, separar bucket, limites y policies, y validar que las policies no exponen escritura anonima.

# Flujo recomendado
- [ ] Leer SSOT, TODO, registros de equipo y preguntas abiertas.
- [ ] Inspeccionar migraciones, tipos, clientes backend y APIs existentes.
- [ ] Clasificar riesgo: schema, datos, permisos, auth, API, webhook o tipos.
- [ ] Activar investigacion o operaciones sensibles cuando corresponda.
- [ ] Implementar por bloques verificables.
- [ ] Ejecutar o proponer checks proporcionales.
- [ ] Devolver evidencia, riesgo residual y siguientes agentes necesarios.

# Criterio de resultado bueno
La skill esta bien aplicada si:
- el backend implementado coincide con la realidad documental y tecnica del proyecto;
- los contratos de datos quedan claros y tipados cuando aplica;
- las migraciones y policies son revisables y seguras;
- los riesgos de permisos, datos y auth quedan tratados explicitamente;
- otro agente puede validar el resultado sin reconstruir todo desde cero.

## Triggers
- Keywords: backend, sql, supabase, postgresql, rls, migracion, seed, api, webhook, auth server-side, tipos database
- Patrones de usuario: "crea las migraciones", "implementa RLS", "haz el backend", "genera tipos de Supabase", "crea el webhook"
- Encadenamiento: normalmente despues de `@orquestador`; antes de `@revisor` y `@qa-validador` cuando el cambio sea material.

# Ejemplos de activacion
"Implementa las migraciones y policies de Supabase para esta fase."

"Crea las Server Actions y contratos backend de autenticacion."
