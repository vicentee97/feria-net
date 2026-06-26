# Modelo de datos — FeriaNet v1

Esquema lógico de datos para FeriaNet. Define **qué** se persiste y **cómo se identifican** las entidades de negocio. NO contiene SQL concreto, DDL, tipos nativos ni políticas RLS; eso corresponde a la épica 1 del roadmap, en manos del ingeniero-backend y del especialista-seguridad.

Este modelo se deriva de `docs/SSOT.md` y `docs/product-map.md`. Cualquier cambio funcional que rompa una entidad aquí definida debe volver primero a la SSOT.

---

## 1. Principios del modelo

1. **Local-first.** El modelo existe para que el TPV local pueda operar sin red. La forma física del dato (SQLite local) es responsabilidad del backend; este documento describe entidades y relaciones, no almacenamiento.
2. **Identificación operativa.** Toda entidad tiene un `id` interno estable (UUID v4) y, cuando aplique, claves naturales que sirven para deduplicar al sincronizar.
3. **`fair_edition` es la unidad organizativa del TPV.** Las atracciones, cajas y ventas cuelgan siempre de una edición concreta, nunca de la feria genérica. Esto es lo que hace posible la comparativa interanual.
4. **Inmutabilidad operativa.** Una `cash_session` (caja diaria) cerrada no se modifica. Las correcciones se hacen con líneas nuevas o ajustes trazables.
5. **Trazabilidad de entrega.** Todo ticket tiene un historial de intentos de entrega contra el módulo `ticket-delivery`. Esto permite detectar fallos de impresión sin perder la venta.

---

## 2. Entidades

### 2.1 `Fair` — Feria genérica

Representa la feria en abstracto, sin año. Existe para poder agrupar "Feria de Cádiz 2025" y "Feria de Cádiz 2026" bajo la misma feria.

| Atributo | Tipo lógico | Obligatorio | Propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `name` | string (≤120) | sí | Nombre humano de la feria. Base de la comparativa interanual. |
| `created_at` | timestamp | sí | Auditoría |
| `notes` | string (≤500) | no | Observaciones del feriante |

Notas:
- El `name` es **case-insensitive y trimmed** a efectos de sugerencia de agrupación, pero se conserva tal cual el operador lo escribió.
- En v1 no hay geolocalización ni dirección: la identidad de "misma feria en distintos años" es **manual asistida**, no automática (ver §4).

### 2.2 `FairEdition` — Edición anual de feria

Instancia anual concreta de una feria. Es la unidad desde la que cuelgan atracciones, ofertas, cajas y tickets. Toda comparativa interanual pasa por aquí.

| Atributo | Tipo lógico | Obligatorio | Propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `fair_id` | UUID → `Fair.id` | sí | FK a la feria genérica |
| `year` | entero (4 dígitos) | sí | Año de la edición |
| `start_date` | fecha | sí | Primer día operativo |
| `end_date` | fecha | sí | Último día operativo |
| `status` | enum: `planned` \| `active` \| `closed` | sí | Estado operativo. Una sola edición por feria puede estar `active` simultáneamente. |
| `created_at` | timestamp | sí | Auditoría |

Reglas:
- `(fair_id, year)` es único.
- `end_date >= start_date`.
- `start_date` y `end_date` se almacenan como fechas locales del operador (sin zona horaria). El backend will use the device's locale.

### 2.3 `Attraction` — Atracción por edición

Una atracción solo existe dentro de una edición de feria. No hay "atracciones globales" reutilizables: cada edición declara las suyas para que precio, color y configuración puedan variar entre años.

| Atributo | Tipo lógico | Obligatorio | Propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `fair_edition_id` | UUID → `FairEdition.id` | sí | FK a la edición |
| `name` | string (≤80) | sí | Nombre humano (ej. "Camas elásticas") |
| `color` | string (hex `#RRGGBB`) | sí | Color identificativo para la UI y el ticket |
| `base_ticket_price` | decimal con 2 decimales | sí | Precio base del ticket para esta atracción/edición |
| `is_active` | boolean | sí | Soft-delete. Por defecto `true`. |

Reglas:
- Una atracción pertenece a exactamente una edición.
- `is_active = false` se considera borrado lógico; no debe aparecer en selects operativos pero conserva histórico para informes.

### 2.4 `Offer` — Oferta / bundle

Una oferta aplica un precio especial a un bundle (`N` tickets por un precio fijo). Vive dentro de una edición de feria y es opcional.

| Atributo | Tipo lógico | Obligatorio | Propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `fair_edition_id` | UUID → `FairEdition.id` | sí | FK a la edición |
| `name` | string (≤80) | sí | Nombre humano (ej. "Pack familia 4 tickets") |
| `bundle_quantity` | entero ≥ 1 | sí | Número de tickets del bundle |
| `bundle_price` | decimal con 2 decimales | sí | Precio total del bundle |
| `is_active` | boolean | sí | Soft-delete |

Reglas:
- Una oferta solo es válida en su edición.
- Una venta puede aplicar **como máximo una oferta** (ver §3 y §5). Si en el futuro se quieren ofertas combinables, se introduce una entidad `OfferApplication` intermedia. **No en v1.**

### 2.5 `CashSession` — Caja diaria

Registro de la apertura de caja de una atracción en un día concreto. Es la unidad operativa del TPV: las ventas cuelgan de aquí.

| Atributo | Tipo lógico | Obligatorio | Propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `attraction_id` | UUID → `Attraction.id` | sí | FK a la atracción |
| `date` | fecha (YYYY-MM-DD local) | sí | Día de la caja |
| `opened_at` | timestamp | sí | Momento exacto de apertura |
| `closed_at` | timestamp | no | `null` mientras la caja sigue abierta |
| `opening_amount` | decimal con 2 decimales | sí | Fondo inicial (efivo en caja, normalmente 0) |
| `closing_amount` | decimal con 2 decimales | no | Importe declarado al cierre (no se obliga a que coincida con el teórico) |
| `total_amount` | decimal con 2 decimales | no | Suma de ventas registradas; se calcula y se congela al cerrar |

Reglas:
- `(attraction_id, date)` es único: **una sola caja por atracción y día**.
- `closed_at IS NULL` significa caja abierta. Solo una caja abierta por atracción simultáneamente.
- `total_amount` se calcula al cerrar; después de cerrar no debe cambiar.
- Una caja no se reabre: si se necesita corregir, se hace con una `CashAdjustment` (ver §6).

### 2.6 `Sale` — Venta

Una transacción de venta dentro de una caja. Contiene una o varias líneas.

| Atributo | tipo lógico | Obligatorio | Propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `cash_session_id` | UUID → `CashSession.id` | sí | FK a la caja |
| `offer_id` | UUID → `Offer.id` | no | Oferta aplicada a toda la venta, si la hay |
| `created_at` | timestamp | sí | Momento exacto de la venta |
| `total_amount` | decimal con 2 decimales | sí | Suma de las líneas de venta; congelada al crear la venta |
| `note` | string (≤200) | no | Anotación opcional del operador |

Reglas:
- `total_amount >= 0`.
- Si `offer_id IS NOT NULL`, todas las `SaleLine` de esta venta deben pertenecer al bundle de la oferta.
- Una venta registrada **no se elimina**: corrección vía `Refund` (ver §6) o anulación trazable.

### 2.7 `SaleLine` — Línea de venta

Cantidad de tickets vendidos a un precio unitario concreto, dentro de una venta.

| Atributo | tipo lógico | obligatorio | propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable |
| `sale_id` | UUID → `Sale.id` | sí | FK a la venta |
| `quantity` | entero ≥ 1 | sí | Número de tickets |
| `unit_price` | decimal con 2 decimales | sí | Precio por ticket en esta línea |
| `line_total` | decimal con 2 decimales | sí | `quantity * unit_price`, redondeo bancario a favor del cliente |

Reglas:
- `line_total = quantity * unit_price` redondeado a 2 decimales.
- La suma de `line_total` debe coincidir con `Sale.total_amount`. Si hay oferta, `Sale.total_amount` puede ser menor (es el bundle).
- Una `SaleLine` no se modifica tras crear la venta; correcciones vía nueva línea + `Refund` si aplica.

### 2.8 `Ticket` — Ticket emitido

Representación lógica del ticket entregado al cliente. Es lo que el módulo `ticket-delivery` imprime o graba.

| Atributo | tipo lógico | obligatorio | propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador interno estable; clave de idempotencia de entrega |
| `sale_id` | UUID → `Sale.id` | sí | FK a la venta de origen |
| `cash_session_id` | UUID → `CashSession.id` | sí | FK a la caja (denormalizado para informes rápidos) |
| `fair_edition_id` | UUID → `FairEdition.id` | sí | FK a la edición (denormalizado) |
| `attraction_id` | UUID → `Attraction.id` | sí | FK a la atracción (denormalizado) |
| `issued_at` | timestamp | sí | Momento en que se solicitó la emisión |
| `quantity` | entero ≥ 1 | sí | Tickets representados (normalmente 1, o N si la línea es bundle) |
| `unit_price` | decimal con 2 decimales | sí | Precio por ticket para este ticket |
| `total` | decimal con 2 decimales | sí | `quantity * unit_price` |
| `delivery_status` | enum: `pending` \| `delivered` \| `failed` \| `manual` | sí | Estado de entrega actual |
| `delivery_attempts` | entero ≥ 0 | sí | Número de intentos realizados |
| `last_delivery_error` | string (≤300) | no | Mensaje del último fallo, si lo hay |

Reglas:
- Un `Ticket` se crea **en el mismo momento que la `Sale`**, con `delivery_status = pending`. No existe venta sin ticket físico (o intento de emisión).
- `id` es la **clave de idempotencia** que el `ticket-delivery` usará para no reimprimir el mismo ticket dos veces.
- Tickets denormalizan `fair_edition_id`, `attraction_id` y `cash_session_id` para que los informes y la sync no necesiten joins profundos.

### 2.9 `TicketDeliveryAttempt` — Intento de entrega

Registro de cada intento de entregar un ticket. Mantiene la trazabilidad y permite reintentos seguros.

| Atributo | tipo lógico | obligatorio | propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador del intento |
| `ticket_id` | UUID → `Ticket.id` | sí | FK al ticket |
| `attempted_at` | timestamp | sí | Momento del intento |
| `delivery_kind` | enum: `thermal` \| `rfid` \| `noop` \| `file` \| `unknown` | sí | Tipo de delivery usado |
| `outcome` | enum: `success` \| `failure` | sí | Resultado del intento |
| `error_code` | enum: `offline` \| `out_of_paper` \| `jammed` \| `timeout` \| `unknown` \| `none` | sí | Código de error si `outcome = failure` |
| `error_detail` | string (≤300) | no | Mensaje detallado del fallo |
| `payload` | bytes o string (≤4 KB) | no | Bytes enviados al hardware (para depuración y soporte) |

Reglas:
- Cada entrega (exitosa o fallida) genera un `TicketDeliveryAttempt`. La historia completa del ticket queda registrada.
- El `ticket_delivery_kind` efectivo para un ticket es el último intento con `outcome = success`, o el de mayor `attempted_at` si todos fallaron.

### 2.10 `CashAdjustment` — Ajuste de caja (post-MVP, base)

Capa de trazabilidad para correcciones de caja una vez cerrada. No se usa en v1, pero el modelo de caja debe dejar espacio para ello sin migración destructiva.

| Atributo | tipo lógico | obligatorio | propósito |
|---|---|---|---|
| `id` | UUID | sí | Identificador |
| `cash_session_id` | UUID → `CashSession.id` | sí | FK a la caja afectada |
| `created_at` | timestamp | sí | Momento del ajuste |
| `kind` | enum: `correction` \| `refund` \| `withdrawal` \| `deposit` | sí | Naturaleza del ajuste |
| `amount` | decimal con 2 decimales (puede ser negativo) | sí | Importe del ajuste |
| `reason` | string (≤300) | sí | Justificación obligatoria |

Nota: la entidad existe como punto de extensión. Su uso real queda fuera del MVP (épica 9 validación).

---

## 3. Relaciones

Cardinalidades explícitas. La convención es `A — B : cardinalidad(A) : cardinalidad(B)`.

```
Fair           1 — N  FairEdition
FairEdition    1 — N  Attraction
FairEdition    1 — N  Offer
FairEdition    1 — N  Ticket               (denormalizado para sync/informes)
Attraction     1 — N  CashSession
CashSession    1 — N  Sale
CashSession    1 — N  Ticket               (denormalizado)
Sale           1 — N  SaleLine
Sale           0..1 — 1 Offer              (una venta puede tener como mucho una oferta)
Sale           1 — N  Ticket
Ticket         1 — N  TicketDeliveryAttempt
CashSession    1 — N  CashAdjustment       (futuro, base preparada)
```

Notas:
- `Sale → Offer` es 0..1 en v1. Si en el futuro se quieren ofertas combinables, se sustituye por `SaleOffer` (muchos-a-muchos) sin tocar el resto del modelo.
- `Ticket → FairEdition/Attraction/CashSession` son **denormalizaciones** que se mantienen en escritura. Permiten que los informes y la sincronización lean en una sola tabla sin joins profundos, lo cual importa en ferias con cortes de red y batería limitada.

---

## 4. Regla de identificación de "edición de feria"

La SSOT exige que "Feria de Cádiz 2025" y "Feria de Cádiz 2026" sean la misma feria en distintos años. El modelo lo resuelve así:

1. **Identidad primaria**: una `Fair` se identifica por su `id` interno. La feria genérica "Feria de Cádiz" es una sola entidad `Fair`.
2. **Instanciación anual**: cada año operativo crea una `FairEdition` con `fair_id = Fair.id` y `year = 2025` o `2026`.
3. **Comparativa interanual**: es un join `GROUP BY fair_id, year` sobre `FairEdition`. No requiere heurística de matching.
4. **Asistencia al alta**: cuando el operador crea una nueva `FairEdition` para un año, la UI le sugiere `Fair` existentes con el mismo `name` (normalizado: trim, lowercase, sin acentos opcionales). El operador confirma si la nueva edición cuelga de una `Fair` ya existente o si es una feria distinta que casualmente se llama igual. Esto resuelve el problema sin depender de fuzzy matching automático ni de scraping externo.

Lo que **NO** se hace en v1:
- No se hace matching automático por nombre + geolocalización.
- No se importan calendarios oficiales de ferias.
- No se usa IA para sugerir agrupación.

La regla es deliberadamente simple porque:
- Si el operador se equivoca al crear dos ferias distintas para la misma feria real, la comparativa interanual se rompe y debe corregirse manualmente. Esto es preferible a un matching silencioso que puede ser incorrecto.
- Cualquier capacidad de matching más avanzado entra como épica posterior (épica 8 — familias futuras, punto de extensión "calendarios externos").

---

## 5. Reglas de integridad

Reglas que la arquitectura promete respetar. La implementación física (constraints, triggers, lógica de aplicación) es responsabilidad del ingeniero-backend.

1. **Caja única por atracción y día.** No puede haber dos `CashSession` abiertas o cerradas para el mismo `(attraction_id, date)`.
2. **Caja única abierta por atracción.** Como mucho una `CashSession` con `closed_at IS NULL` por `attraction_id`.
3. **Una `Sale` siempre pertenece a una caja abierta.** No se permite crear una venta contra una caja cerrada. (Una `CashSession` cerrada rechaza nuevas `Sale` salvo `Refund`.)
4. **Líneas de venta consistentes.** `Sale.total_amount` debe ser igual a la suma de `SaleLine.line_total`. Si la venta tiene `offer_id`, `Sale.total_amount` puede ser distinto (es el bundle) pero debe coincidir con `Offer.bundle_price` cuando hay una sola línea.
5. **Tickets generados en bloque.** Toda `Sale` con `total_amount > 0` genera exactamente un `Ticket` por cada `SaleLine` de la venta, en el mismo momento transaccional. La regla "no hay venta sin ticket" se enforcea por la capa de aplicación.
6. **Idempotencia de entrega.** El `id` del `Ticket` es la clave de idempotencia para `ticket-delivery`. Un mismo `Ticket.id` no debe generar dos `TicketDeliveryAttempt` con `outcome = success`.
7. **`Ticket.fair_edition_id` coherente.** El `fair_edition_id` denormalizado en el ticket debe coincidir con el de su `Sale` → `CashSession` → `Attraction` → `FairEdition`. Validación al insertar; la propia estructura lo garantiza si no hay escrituras manuales.
8. **Una `Offer` solo aplica a ventas de su edición.** `Sale.offer_id.fair_edition_id = Sale.cash_session.attraction.fair_edition_id`.
9. **El `delivery_status` evoluciona por intentos.** Cada `TicketDeliveryAttempt` con `outcome = success` transiciona el ticket a `delivered`. Cualquier intento con `outcome = failure` mantiene `pending` (o lo transiciona a `failed` tras N intentos, configurable; ver §6 del `ARCHITECTURE.md`).
10. **`FairEdition` único activo por feria.** Solo una `FairEdition` por `fair_id` puede tener `status = active` simultáneamente.

---

## 6. Estados derivados y transiciones

### 6.1 Estados de un `Ticket`

```
                +--- (entrega OK) ---> delivered
                |
pending -------+--- (entrega KO, attempts < MAX) ---> pending (sigue reintentándose)
                |
                +--- (entrega KO, attempts >= MAX) ---> failed
                |
                +--- (operador marca manualmente como entregado) ---> manual
```

- `pending`: creado, aún no entregado ni reintentado al máximo.
- `delivered`: el último intento fue exitoso.
- `failed`: se alcanzó el máximo de intentos automáticos. El operador puede reintentar manualmente o marcarlo como `manual`.
- `manual`: el operador confirmó que el ticket se entregó por otro medio (a mano, en una hoja aparte, etc.). Este estado **no se borra** la venta; deja trazabilidad.

### 6.2 Estados de una `CashSession`

```
planned? (no existe en v1, la caja se crea ya operativa)
  |
  v
open (created_at + opened_at, closed_at = null)
  |
  v
closed (closed_at set, total_amount congelado)
```

Una caja cerrada **no se reabre**. Para corregir importes se usa `CashAdjustment` (épica futura).

### 6.3 Estados de una `FairEdition`

```
planned  ->  active  ->  closed
```

Transiciones:
- `planned → active`: cuando el operador abre la primera caja de esa edición (o manualmente desde la UI de ferias).
- `active → closed`: cuando el operador cierra explícitamente la edición, o cuando han pasado `end_date + 7 días` sin cajas activas (regla operativa configurable; la automatización exacta es post-MVP).

---

## 7. Lo que este documento NO decide

- Tipos físicos (SQLite `TEXT`, `INTEGER`, `REAL`, etc.). Es del ingeniero-backend.
- DDL concreto, índices, constraints. Es del ingeniero-backend.
- Esquema del backend cloud (Supabase Postgres). Es de la épica 5.
- RLS, políticas de seguridad. Es del especialista-seguridad.
- Formato del payload que se envía al `ticket-delivery` (texto ESC/POS, JSON, etc.). Es de la épica 3, pero el contrato del ticket lógico es este documento.

---

## 8. Riesgos abiertos del modelo

1. **Denormalización en `Ticket`.** Acelera informes y sync, pero obliga a mantener coherencia en escritura. El riesgo se mitiga haciendo que la creación de `Ticket` sea siempre atómica con la `Sale` que lo origina.
2. **Sin geolocalización.** Dos ferias con el mismo nombre en ciudades distintas se identifican solo por la voluntad del operador. Esto es aceptable para v1 porque el dominio es local y el operador controla su negocio.
3. **No hay `Refund` propio en v1.** El modelo lo deja preparado vía `CashAdjustment`, pero no se implementa en el MVP. Cualquier corrección de importe en v1 se hace abriendo un nuevo ajuste manual, lo cual queda como riesgo operacional hasta que se implemente.
4. **Identificación de "misma feria" asistida, no automática.** Depende de la disciplina del operador. Aceptable para v1; épica futura si se observa fricción.