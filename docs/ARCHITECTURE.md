# Arquitectura — FeriaNet v1

Decisiones arquitectónicas defendibles para construir FeriaNet v1 a partir de la SSOT y el product-map. Define **cómo** se construye el producto, no **qué** se construye. La identidad funcional está cerrada en `docs/SSOT.md`, `docs/product-map.md` y `docs/TODO.md`; este documento los respeta y no los reinterpreta.

Este archivo es **especificación**, no código. La implementación física (SQL concreto, comandos Tauri, pantallas) la llevan a cabo `@ingeniero-backend` y `@implementador` siguiendo el brief que aquí se entrega.

---

## 1. Resumen ejecutivo

FeriaNet v1 es una **aplicación de escritorio Windows-first, local-first**, construida con **Tauri 2.x** (backend en Rust, frontend en React 19 + TypeScript). Toda la operativa de venta e impresión funciona 100 % offline contra una base **SQLite** local. Un **módulo `ticket-delivery` intercambiable** desacopla la venta del hardware concreto (en v1, impresora térmica ESC/POS). La **sincronización opcional** lleva los datos a un backend **Supabase** (Postgres + RLS + Edge Functions) cuando hay red, solo para alimentar una **vista remota de solo lectura** sin login complejo.

La arquitectura está optimizada para los tres ejes duros del producto:
- **Robustez offline** (cero dependencia de red para vender).
- **Swap de hardware sin tocar la venta** (interfaz `ticket-delivery` con pruebas de sustitución).
- **Comparativa interanual fiable** (modelo de ferias con `Fair` + `FairEdition`, identificación asistida).

---

## 2. Plataforma y justificación

### 2.1 Decisión

**Escritorio Windows-first**, empaquetado como **instalador MSI/EXE** (Tauri nativo) más valor instalador portable. Linux queda como objetivo secundario (soporte de Tauri, mismo código fuente); macOS queda fuera del MVP salvo que un feriante concreto lo pida, por coste de testing con hardware térmico heterogéneo.

El operador usa un **PC o tablet Windows** con la app instalada localmente. La impresora térmica se conecta por **USB** (preferente) o **Bluetooth** (secundario).

### 2.2 Por qué no web pura / móvil

- **Web pura (PWA en navegador)** no garantiza acceso fiable a USB/Bluetooth en todos los navegadores y SO. Service Workers no resuelven el acceso a hardware HID de bajo nivel. Descartado.
- **App móvil nativa (Android/iOS)** complica el TPV: las impresoras térmicas de feria son predominantemente USB o Bluetooth-SPP, pensadas para PC/caja. La fragmentación de impresoras en móvil es mayor y los SDKs oficiales son por marca. Descartado para v1.
- **Híbrido (Cordova/Capacitor)** suma complejidad sin aportar frente a Tauri. Descartado.

### 2.3 Por qué no Electron

Electron es viable y más rápido de levantar con un equipo 100 % web, pero para FeriaNet tiene tres problemas materiales:

| Aspecto | Tauri 2.x | Electron |
|---|---|---|
| Binario Windows | 8–15 MB | 80–250 MB |
| RAM en reposo | ~42 MB | ~100–300 MB |
| Acceso USB/HID | Plugins Rust (`tauri-plugin-hid`, `tauri-plugin-serialplugin`), sin recompilar binarios nativos | WebUSB/WebBluetooth + addons Node nativos; `node-hid` y `node-serialport` requieren rebuild por versión de Electron |
| Modelo de seguridad | Capabilities explícitas por defecto | Sandbox Chromium manual; nodeIntegration por defecto es riesgoso |
| Coste de distribución | Bajo (binarios pequeños, delta updates) | Alto (instaladores grandes, auto-update más pesado) |

El TPV feriante suele correr en hardware modesto (portátil viejo, tablet Windows barata) y la impresión térmica USB es la integración de hardware crítica. Tauri gana en los dos ejes: rendimiento en hardware limitado y acceso USB sin fricción.

### 2.4 Trade-offs asumidos al elegir Tauri

- **Coste de aprendizaje de Rust.** Se mitiga acotando el backend Rust a comandos delgados (commands Tauri + glue) y dejando la lógica de dominio en TypeScript cuando sea posible. Solo lo que toca hardware o sistema (USB, SQL, sync, ticket-delivery) es Rust.
- **WebView del sistema operativo.** Tauri usa WebView2 en Windows (Edge/Chromium). Hay que validar que la versión mínima de WebView2 está disponible en los Windows 10/11 que usen los feriantes; en caso contrario, se distribuye el bootstrapper de WebView2 junto al instalador.
- **Ecosistema más pequeño que Electron.** Aceptable porque el grueso de UI son componentes estándar (shadcn/ui sobre Radix) y la complejidad está en los comandos Tauri.

### 2.5 Supuestos a validar (plataforma)

- [ ] **S-A:** Los feriantes usan Windows 10 u 11 con WebView2 disponible o instalable. A confirmar con un feriante piloto antes de publicar.
- [ ] **S-B:** La impresora térmica del feriante es ESC/POS genérica 58 mm u 80 mm, accesible por USB o Bluetooth-SPP. Modelos concretos a inventariar (ver §3.5).
- [ ] **S-C:** El feriante tiene un PC/tablet con al menos 4 GB de RAM y 200 MB libres para datos locales. La app avisa si no se cumple.

---

## 3. Stack completo

### 3.1 Frontend (capa UI)

| Pieza | Elección | Versión objetivo | Motivo |
|---|---|---|---|
| Framework | **React** | 19.x | Ecosistema maduro, contratación fácil, soporte oficial estable |
| Lenguaje | **TypeScript** | 5.x | Tipado estricto en dominio compartido con backend |
| Build | **Vite** | 5.x o 6.x estable | Build rápido, HMR sólido, integración oficial con Tauri |
| Estilos | **Tailwind CSS** | v4 (estable) | Theming consistente, sin runtime CSS-in-JS |
| Componentes | **shadcn/ui** sobre **Radix UI primitives** | latest | Componentes accesibles copiados al repo (sin dependencia runtime), theming con Tailwind. HeroUI v3 está en beta con breaking changes — descartado para v1. |
| Estado servidor | **TanStack Query** | 5.x | Cache, invalidación, deduplicación de llamadas a Tauri commands |
| Estado local | **Zustand** o **React Context + useReducer** | latest | Simple, sin boilerplate, suficiente para v1 |
| Routing | **React Router** | 7.x | Estándar de facto en React |
| Forms | **React Hook Form** + **Zod** | latest | Validación compartida cliente/backend |
| Charts (informes) | **Recharts** | latest | Suficiente para gráficos de barras y comparativas; accesible y mantenible |

Nota: **se descarta HeroUI v3** porque está en beta y la propia documentación advierte de "breaking changes". Apostar por shadcn/ui (copia de componentes al repo + Tailwind) es más conservador para un producto a largo plazo.

### 3.2 Backend local (Rust, dentro de Tauri)

| Pieza | Elección | Versión objetivo | Motivo |
|---|---|---|---|
| Runtime de la app | **Tauri** | 2.x estable | Lo ya justificado en §2 |
| Lenguaje | **Rust** | 1.78+ estable | Toolchain moderno, soporte oficial Tauri |
| Serialización | **serde** + **serde_json** | 1.x | Estándar |
| HTTP client (sync) | **reqwest** | 0.12.x con TLS nativo | Cliente HTTP maduro para hablar con Supabase |
| Async runtime | **tokio** | 1.x (vía Tauri) | Compatible con el runtime de Tauri |
| Logging | **tracing** + **tracing-subscriber** | latest | Logs estructurados, integrado con `tauri-plugin-log` |
| UUID | **uuid** v4 | 1.x | IDs estables para dominio y sync |

### 3.3 Persistencia local

| Pieza | Elección | Versión objetivo | Motivo |
|---|---|---|---|
| Motor | **SQLite** | 3.x (la versión que venga con `libsqlite3-sys`/rusqlite) | Estándar para local-first, zero-config, modo WAL |
| Acceso desde Rust | **rusqlite** directo | 0.32.x | Sync API, latencia predecible, sin overhead async para operaciones locales cortas |
| Migraciones | **rusqlite_migration** | 1.x | Migraciones versionadas sobre `PRAGMA user_version` |
| Encriptación (opcional, post-MVP) | **SQLCipher** vía feature de `rusqlite` | cuando se active | Por si en el futuro se piden datos cifrados en disco |

Por qué **no** `tauri-plugin-sql` para v1: el plugin añade una capa IPC que, en el patrón local-first, es ruido. Llamar directamente a `rusqlite` desde los commands Tauri es más limpio, más rápido y permite SQLCipher sin pelearse con el plugin. La UI no toca SQLite nunca: solo consume commands Tauri tipados.

#### Patrón de acceso a datos

- **Repository pattern en Rust.** Cada entidad de dominio tiene un módulo `repository` con funciones tipadas (`create_fair_edition`, `list_attractions_by_edition`, etc.).
- **Transacciones explícitas.** Cualquier escritura que toque más de una tabla usa `Connection::transaction(...)`. Crítico para venta + ticket + delivery_attempt.
- **Modo WAL activado.** `PRAGMA journal_mode = WAL;` en el bootstrap de la DB para que lecturas no bloqueen escrituras.
- **Pool mínimo.** Una conexión de escritura + hasta 4 lecturas concurrentes (SQLite nativo); gestionado manualmente, no con `sqlx` (que introduce async y pool que, según benchmarks, puede empeorar el rendimiento de escritura si se configura mal).

### 3.4 Sincronización opcional

| Pieza | Elección | Motivo |
|---|---|---|
| Patrón | **Cola de cambios (ChangeLog)** con triggers SQLite + tabla `sync_queue` | Simple, verificable, sin infraestructura externa obligatoria |
| Transporte | **HTTPS REST** contra Supabase vía `reqwest` con `rustls` | TLS sin depender de OpenSSL del sistema |
| Idempotencia | UUID v4 por registro + endpoint idempotente en backend | Reintentos seguros |
| Backend cloud | **Supabase** (Postgres + RLS + Auth opcional + Edge Functions + Storage) | Estándar de facto para MVP, plan free cubre, RLS da seguridad, Edge Functions dan endpoints custom |
| Periodicidad | Worker Rust en background que sincroniza cada N segundos o cuando hay red | No bloquea la UI; respeta local-first |
| Concurrencia | Un único worker de sync, mutex sobre la cola | Suficiente para v1; multi-worker es complejidad evitable |

Por qué **no** PowerSync/ElectricSQL en v1:
- PowerSync cobra desde el primer GB sincronizado y suma una capa de infraestructura. FeriaNet no necesita colaboración en tiempo real; solo "subir para que alguien vea".
- ElectricSQL exige `wal_level = logical` en Postgres y proxy. Para una sync unidireccional cliente → nube, es overkill.
- El patrón ChangeLog + cola es **lo bastante simple para que un único desarrollador lo entienda y depure**, y **lo bastante robusto para feriantes que pierden cobertura a menudo** (reintentos idempotentes al recuperar red).

### 3.5 Impresión térmica

| Pieza | Elección | Versión objetivo | Motivo |
|---|---|---|---|
| Generación de comandos ESC/POS | **`escpos`** crate | 0.19.x | Crate más completo y mantenido del ecosistema Rust; cubre USB, Red, Consola, Barcodes 2D, QR |
| Driver Windows USB | `WindowsUsbPrintDriver` del propio crate `escpos` | incluido | Evita `libusb` y sus reglas `udev` |
| Driver Linux/macOS USB | `ConsoleDriver` enviando a `/dev/usb/lp*` o socket TCP | incluido | Mismo crate, multiplataforma |
| Bluetooth (secundario) | **`btleplug`** + envío de bytes vía SPP | 0.11.x | Bluetooth clásico SPP no cubierto por `btleplug` directamente; se usa con crate específica o puente |

Por qué **no** `node-thermal-printer` (la librería JS más popular): porque Tauri no ejecuta Node. Traer Node como subproceso para imprimir sería una aberración arquitectónica. El crate `escpos` cumple lo mismo desde Rust.

Por qué **no** `tauri-plugin-esc-pos` ni `tauri-plugin-thermal-printer`: son plugins jóvenes (un solo mantenedor cada uno) que envuelven lógica que ya controlamos. Para el caso v1, una capa fina Rust propia sobre `escpos` da control total y permite añadir el adaptador RFID mañana sin pasar por un plugin externo.

### 3.6 Backend cloud (Supabase)

| Servicio | Uso en v1 |
|---|---|
| **Postgres** | Réplica de ferias, ediciones, atracciones, cajas, ventas, tickets. Esquema mapeado 1:1 al SQLite local. |
| **RLS** | Política por defecto que **niega todo** salvo acceso por **API key de solo lectura** servida desde una URL privada firmada (storage signed URL). En v1 no hay login por usuario. |
| **Auth** | **No se usa en v1.** La "URL privada" es una signed URL de Supabase Storage que apunta a una Edge Function o a un archivo JSON snapshot. Suficiente para MVP. |
| **Realtime** | **No se usa en v1.** No hay vista remota interactiva en MVP; la consulta es pull contra snapshot. |
| **Edge Functions** | Endpoint HTTP que devuelve el snapshot más reciente de ferias/ventas del feriante, firmado y cacheado. En v1, una sola Edge Function sirve todo. |
| **Storage** | Almacén del snapshot JSON firmado. URL firmada con expiración de 24h o 7 días configurable. |

Por qué **no** Firebase: Postgres + RLS da más control que Firestore para el tipo de queries que necesitan los informes (joins, agregaciones, comparativas). El modelo de FeriaNet es claramente relacional.

Por qué **no** backend autohospedado: el feriante no quiere mantener infraestructura, y para v1 el coste de un Supabase gratis es cero. Cuando crezca, Supabase Pro son 25 USD/mes, muy por debajo del coste de mantener un VPS.

### 3.7 Vista remota

La "consulta remota mínima con URL privada" se implementa como:

1. El TPV, cuando detecta red y termina una sincronización, **genera un snapshot** en formato JSON y lo sube a un bucket privado de Supabase Storage.
2. Crea una **signed URL** con expiración de N días y se la muestra al operador (un único botón "Copiar URL de consulta").
3. Esa URL apunta a una **Edge Function** que sirve el JSON firmado.
4. El operador la comparte con quien quiera (él mismo desde el móvil, su familia, su contable).
5. La vista en sí es una **página HTML estática mínima** servida desde otra Edge Function que consume el JSON y lo renderiza con tablas simples.

No hay login, no hay base de datos de usuarios, no hay roles. Cuando expire la URL, se regenera una nueva.

---

## 4. Mapa de módulos técnicos ↔ módulos de producto

| Módulo de producto (SSOT/product-map) | Carpeta frontend (TS) | Carpeta backend (Rust) | Commands Tauri expuestos | Estado v1 |
|---|---|---|---|---|
| **Ferias** | `src/modules/fairs/` | `src-tauri/src/domain/fairs.rs` + `repository/fairs.rs` | `list_fairs`, `create_fair`, `create_fair_edition`, `close_fair_edition`, `suggest_similar_fairs` | activo |
| **Atracciones por feria** | `src/modules/attractions/` | `src-tauri/src/domain/attractions.rs` + `repository/attractions.rs` | `list_attractions`, `create_attraction`, `update_attraction`, `deactivate_attraction` | activo |
| **TPV — venta** | `src/modules/tpv/` | `src-tauri/src/domain/sales.rs` + `repository/sales.rs` + `commands/sales.rs` | `open_cash_session`, `close_cash_session`, `create_sale`, `cancel_sale`, `list_offers_for_edition` | activo |
| **Persistencia local** | n/a (UI solo consume commands) | `src-tauri/src/persistence/` (rusqlite, migraciones, sync_queue) | n/a (interno) | activo |
| **Informes v1** | `src/modules/reports/` | `src-tauri/src/domain/reports.rs` (queries agregadas) | `report_by_day`, `report_by_edition`, `report_interannual` | activo |
| **Sincronización opcional** | `src/modules/sync/` (estado y progreso) | `src-tauri/src/sync/` (worker, cola, transporte) | `trigger_sync`, `get_sync_status`, `generate_remote_view_url` | activo |
| **Consulta remota mínima** | n/a (servida por Edge Functions) | `supabase/functions/consulta-remota/` + `supabase/functions/snapshot-upload/` | n/a | activo (snapshot + signed URL) |
| **`ticket-delivery`** | `src/modules/settings/printers/` (config UI) | `src-tauri/src/ticket_delivery/` (trait + impl térmica + NoOp) | `list_printers`, `print_ticket`, `get_delivery_status`, `retry_failed_tickets` | activo |
| **Identidad / multi-tenant** | n/a | n/a en v1 | n/a | **fuera de MVP** — épica 7 deja puntos de extensión |

### 4.1 Convenciones de nombres en código

- **TypeScript**: módulos en `src/modules/<recurso>/`, con `index.ts`, `<recurso>Service.ts` (cliente de Tauri commands), `<recurso>Types.ts`, `<recurso>Page.tsx`.
- **Rust**: módulos en `src-tauri/src/<capa>/<recurso>.rs`. La capa se llama `domain`, `repository`, `commands`, `persistence`, `ticket_delivery`, `sync`, `config`. Nunca mezclar.
- **Identificadores IPC**: los commands Tauri se nombran en snake_case (`create_fair_edition`) y la capa TS los envuelve en funciones camelCase (`createFairEdition`).

---

## 5. Abstracción `ticket-delivery`

Esta es la pieza más crítica de la arquitectura. La SSOT dice que la venta **nunca** puede acoplarse a un tipo de entrega concreto.

### 5.1 Contrato (Rust, simplificado)

```rust
// src-tauri/src/ticket_delivery/mod.rs

#[async_trait]
pub trait TicketDelivery: Send + Sync {
    /// Identifica qué tipo de delivery es. Útil para UI y logs.
    fn kind(&self) -> DeliveryKind;

    /// Entrega un ticket. Idempotente: si ya existe un
    /// TicketDeliveryAttempt con outcome=success para este ticket_id,
    /// devuelve Ok con el receipt cacheado sin reimprimir.
    async fn deliver(&self, ticket: &Ticket) -> Result<DeliveryReceipt, DeliveryError>;

    /// Estado del dispositivo (papel, conexión, batería).
    async fn health(&self) -> Result<DeliveryHealth, DeliveryError>;

    /// Lista dispositivos disponibles. La UI lo usa en la pantalla de configuración.
    async fn list_devices(&self) -> Result<Vec<DeviceDescriptor>, DeliveryError>;
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum DeliveryKind {
    ThermalPrinter, // ESC/POS USB/Bluetooth
    Rfid,           // futuro: grabador de fichas
    NoOp,           // tests automatizados y modo "sin impresora"
    File,           // depuración: escribe el ticket a un archivo
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeliveryReceipt {
    pub ticket_id: Uuid,        // mismo id que el Ticket; clave idempotente
    pub delivered_at: DateTime<Utc>,
    pub kind: DeliveryKind,
    pub device_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DeliveryError {
    Offline,         // dispositivo no disponible / desconectado
    OutOfPaper,
    Jammed,
    Timeout,
    PermissionDenied,
    Unknown(String),
}

pub struct DeliveryHealth {
    pub ok: bool,
    pub detail: String,
    pub checked_at: DateTime<Utc>,
}
```

### 5.2 Eventos observables

La capa Tauri emite eventos al frontend para que la UI reaccione sin polling:

| Evento | Payload | Cuándo se emite |
|---|---|---|
| `ticket-delivery:success` | `{ ticket_id, device_id }` | Tras `deliver()` exitoso |
| `ticket-delivery:failure` | `{ ticket_id, error_code, error_detail }` | Tras `deliver()` con error |
| `ticket-delivery:device-changed` | `{ devices: [...] }` | Al detectar/desconectar dispositivo |
| `ticket-delivery:status-updated` | `{ ticket_id, status }` | Cuando un reintento cambia el `delivery_status` |

### 5.3 Modos de fallo y comportamiento esperado

La regla dura es: **una venta nunca se bloquea por un fallo de impresión**. Esto se enforcea en el command `create_sale`:

1. Se crea la `Sale`, las `SaleLine` y los `Ticket` con `delivery_status = pending`. Esto es **atómico** en una transacción SQLite.
2. Se intenta `deliver()` por cada ticket (secuencialmente o en paralelo limitado).
3. Si `deliver()` falla:
   - Se registra el `TicketDeliveryAttempt` con `outcome = failure` y `error_code` concreto.
   - El `delivery_status` del `Ticket` queda en `pending` (no `failed`) hasta N intentos automáticos.
   - La venta **se confirma** igualmente.
4. La UI muestra un toast "Venta registrada; ticket pendiente de reimprimir" y un panel "Tickets pendientes" accesible desde el menú principal.
5. El operador puede reintentar manualmente o marcar como `manual` (entregado a mano).

### 5.4 Implementaciones en v1

| Implementación | Cuándo se usa | Cómo se selecciona |
|---|---|---|
| `ThermalPrinterDelivery` | Producción. Usa `escpos` con `WindowsUsbPrintDriver` o `ConsoleDriver`. | Configuración en `app_settings` (`active_delivery_kind = thermal`, `device_id = ...`). |
| `NoOpDelivery` | Tests automatizados y modo "sin hardware" para demo. | Feature flag en arranque o config explícita. |
| `FileDelivery` | Depuración. Escribe el payload ESC/POS a un archivo para inspección. | Solo cuando `RUST_LOG=debug` y config `debug.file_delivery_path`. |

### 5.5 Pruebas de sustitución (obligatorias en épica 9)

La épica 9 exige que "la lógica de venta debe poder funcionar con un `ticket-delivery` alternativo sin tocar el TPV". Esto se materializa en:

1. **Test unitario**: arrancar el sistema con `NoOpDelivery` y ejecutar `create_sale`. Verificar que la venta se completa, el `Ticket` se crea con `delivery_status = delivered` y el `TicketDeliveryAttempt` tiene `delivery_kind = NoOp`.
2. **Test de integración**: misma operación con `FileDelivery`. Verificar que el archivo contiene los bytes esperados y que el estado es equivalente.
3. **Test de regresión**: si alguien en el futuro añade un `if delivery.is_thermal()` en la capa de venta, el test con `NoOpDelivery` debe seguir pasando. Esto detecta acoplamiento prohibido.
4. **Switch en runtime**: el operario puede cambiar de térmica a NoOp desde la UI de configuración sin reiniciar la app. Esto permite trabajar en una atracción sin impresora temporalmente.

### 5.6 Punto de extensión RFID (épica 8)

Cuando se implemente RFID, se añade un `RfidDelivery` que implementa `TicketDelivery`. La capa de venta **no se toca**. La UI añade un selector de "tipo de entrega" en la configuración de la atracción. La épica 3 (interfaz `ticket-delivery`) ya queda diseñada para que la 8 sea trivial.

---

## 6. Estructura de carpetas del repositorio

Estructura objetivo, alineada con `@arquitecto` y la frontera de responsabilidades. La inicialización efectiva (crear `.gitignore`, `package.json`, etc.) corresponde a `@arrancar-proyecto` en la épica 0; aquí solo se define qué carpetas existirán y por qué.

```
FeriaNet/
├── src/                                 # Frontend React + TS
│   ├── main.tsx
│   ├── App.tsx
│   ├── modules/
│   │   ├── fairs/                       # UI módulo ferias
│   │   ├── attractions/                 # UI módulo atracciones
│   │   ├── tpv/                         # UI módulo TPV (venta)
│   │   ├── reports/                     # UI módulo informes
│   │   ├── sync/                        # UI sync (estado, URL remota)
│   │   └── settings/                    # UI configuración (impresoras, sync, etc.)
│   ├── shared/
│   │   ├── components/                  # shadcn/ui + custom (Button, Dialog, Table, etc.)
│   │   ├── hooks/                       # useTauriCommand, useOfflineStatus, etc.
│   │   ├── lib/                         # utilidades (money formatting, date, etc.)
│   │   └── types/                       # tipos compartidos con backend
│   ├── styles/
│   │   └── globals.css                  # Tailwind directives + tokens
│   └── routes/                          # React Router config
│
├── src-tauri/                           # Backend Rust + configuración Tauri
│   ├── src/
│   │   ├── main.rs                      # arranque Tauri
│   │   ├── domain/                      # tipos y reglas de negocio
│   │   │   ├── fairs.rs
│   │   │   ├── attractions.rs
│   │   │   ├── sales.rs
│   │   │   ├── offers.rs
│   │   │   ├── tickets.rs
│   │   │   ├── reports.rs
│   │   │   └── money.rs                 # tipo Money (decimal con redondeo bancario)
│   │   ├── repository/                  # acceso a datos (rusqlite)
│   │   │   ├── fairs.rs
│   │   │   ├── attractions.rs
│   │   │   ├── sales.rs
│   │   │   ├── tickets.rs
│   │   │   └── sync_queue.rs
│   │   ├── persistence/
│   │   │   ├── mod.rs                   # apertura DB, WAL, busy_timeout
│   │   │   ├── migrations/              # definiciones para rusqlite_migration
│   │   │   └── schema.rs                # tablas y constraints (referencia)
│   │   ├── commands/                    # #[tauri::command] expuestos al frontend
│   │   │   ├── fairs.rs
│   │   │   ├── attractions.rs
│   │   │   ├── sales.rs
│   │   │   ├── reports.rs
│   │   │   ├── sync.rs
│   │   │   └── printers.rs
│   │   ├── ticket_delivery/             # abstracción + implementaciones
│   │   │   ├── mod.rs                   # trait + tipos
│   │   │   ├── thermal.rs               # impl con crate escpos
│   │   │   ├── noop.rs                  # tests / modo sin hardware
│   │   │   └── file.rs                  # depuración
│   │   ├── sync/
│   │   │   ├── mod.rs                   # worker de background
│   │   │   ├── client.rs                # reqwest + auth + retry
│   │   │   └── mapper.rs                # SQLite row -> payload Supabase
│   │   └── config/
│   │       └── mod.rs                   # carga/guarda settings locales
│   ├── migrations/                      # archivos SQL versionados
│   ├── Cargo.toml
│   ├── tauri.conf.json                  # ventana, capabilities, plugins
│   └── build.rs
│
├── supabase/                            # backend cloud (Edge Functions + SQL)
│   ├── functions/
│   │   ├── snapshot-upload/             # recibe snapshot del TPV
│   │   └── consulta-remota/             # sirve vista solo-lectura
│   └── migrations/                      # schema Postgres remoto
│
├── docs/
│   ├── SSOT.md                          # (existente)
│   ├── product-map.md                   # (existente)
│   ├── TODO.md                          # (existente)
│   ├── ARCHITECTURE.md                  # este archivo
│   ├── data-model.md                    # modelo de datos
│   └── adr/                             # ADRs de decisiones difíciles de revertir
│
├── tests/
│   ├── integration/                     # tests de venta offline con NoOpDelivery
│   └── e2e/                             # tests de UI con Playwright o similar
│
├── .gitignore                           # (lo crea arrancar-proyecto)
├── package.json                         # (lo crea arrancar-proyecto)
├── tsconfig.json                        # (lo crea arrancar-proyecto)
├── vite.config.ts                       # (lo crea arrancar-proyecto)
└── README.md                            # (lo crea arrancar-proyecto)
```

Notas:
- **`src-tauri/` y `src/` conviven en la raíz.** Tauri espera esta estructura; el frontend y el backend son dos crates distintos pero viven en el mismo monorepo de aplicación.
- **`supabase/` es opcional en arranque.** Si Supabase se descarta en el futuro, esta carpeta se elimina sin afectar a `src-tauri/` ni `src/`.
- **`docs/adr/` queda reservada.** No se crean ADRs de inicio; solo cuando una decisión concreta merezca trazabilidad separada (ver §10).

---

## 7. Decisiones críticas y trade-offs

Sección propia, no enterrada. Cada decisión incluye: aporta, cuesta, riesgo, alternativas descartadas.

### 7.1 Tauri 2.x (no Electron)

- **Aporta**: binarios 8–15 MB, RAM 58–75 % menor, acceso USB nativo sin recompilar binarios, modelo de capabilities seguro.
- **Cuesta**: aprender Rust (mitigado: solo en comandos Tauri y capas de sistema), WebView depende del SO.
- **Riesgo**: si un feriante usa Windows 7 sin WebView2, no podrá instalar la app. Mitigación: detectar y mostrar mensaje claro + instalador bootstrapper de WebView2.
- **Descartado**: Electron (binarios grandes, fricción con USB), PWA (sin USB fiable), app nativa Windows (coste de desarrollo, sin reutilización).

### 7.2 rusqlite directo (no tauri-plugin-sql ni sqlx)

- **Aporta**: latencia predecible, control sobre transacciones, sin overhead async para queries locales cortas, base para SQLCipher post-MVP.
- **Cuesta**: el ingeniero-backend escribe el pool de conexiones a mano (es trivial con WAL).
- **Riesgo**: si se abusa de conexiones por command, el pool se vuelve inmanejable. Mitigación: límite documentado y code review obligatorio sobre commands que abren conexión.
- **Descartado**: `tauri-plugin-sql` (capa IPC innecesaria), `sqlx` (overhead async y riesgo de pool mal configurado que degrada escritura, documentado por la comunidad).

### 7.3 Patrón ChangeLog + cola (no PowerSync ni ElectricSQL)

- **Aporta**: simple, verificable, sin coste de infraestructura adicional, suficiente para "subir datos para consulta remota".
- **Cuesta**: hay que implementar la cola, los reintentos y la idempotencia a mano. Coste de desarrollo contenido.
- **Riesgo**: si la cola crece mucho offline, el primer sync al recuperar red puede tardar minutos. Mitigación: paginación de la cola con progreso visible al usuario.
- **Descartado**: PowerSync (SaaS de pago desde el primer GB), ElectricSQL (overkill para sync unidireccional).

### 7.4 Supabase (no Firebase ni autohospedado)

- **Aporta**: Postgres + RLS + Edge Functions + Storage + Auth (no usada en v1) en una sola plataforma, plan free suficiente para MVP.
- **Cuesta**: dependencia de un proveedor externo; si Supabase cambia precios o cierra, hay que migrar. Mitigación: usar SQL estándar y Edge Functions Deno para minimizar lock-in.
- **Riesgo**: latencia de sync si el backend Supabase está lejos del feriante. Mitigación: Supabase tiene región EU; elegirla en el alta del proyecto.
- **Descartado**: Firebase (modelo NoSQL, peor para el dominio relacional de FeriaNet), Postgres autohospedado (mantenimiento, coste), PocketBase (inmaduro para producción multi-usuario).

### 7.5 `escpos` crate (no node-thermal-printer ni plugins Tauri jóvenes)

- **Aporta**: crate Rust maduro, mismo proyecto cubre USB Windows, USB Linux, Consola, Red. Cobertura ESC/POS completa (QR, barcode 2D, gráficos).
- **Cuesta**: comunidad más pequeña que node-thermal-printer; los bugs hay que parchearlos vía fork o PR upstream.
- **Riesgo**: si `escpos` deja de mantenerse, hay que migrar. Mitigación: usar solo la API pública estable del trait, no internals.
- **Descartado**: `node-thermal-printer` (requiere Node, incompatible con Tauri), `tauri-plugin-esc-pos` y `tauri-plugin-thermal-printer` (un solo mantenedor cada uno, lógica que podemos controlar directamente).

### 7.6 Frontend React + shadcn/ui (no HeroUI v3)

- **Aporta**: shadcn/ui es código copiado al repo, sin dependencia runtime; Radix da accesibilidad; React 19 + Tailwind v4 son stack estándar.
- **Cuesta**: shadcn/ui no es "instalar y listo"; hay que generar los componentes uno a uno.
- **Riesgo**: si Radix cambia la API de un primitivo, hay que regenerar el componente. Mitigación: tests E2E por componente crítico.
- **Descartado**: HeroUI v3 (beta con breaking changes explícitos), Mantine (más opinionated, lock-in mayor), MUI (CSS-in-JS, peor rendimiento percibido).

### 7.7 Vista remota como snapshot + signed URL (no app web separada)

- **Aporta**: cero infraestructura de hosting de UI, costo cero, expiración automática, sin login.
- **Cuesta**: la vista es estática (no interactiva). Aceptable para v1.
- **Riesgo**: si el JSON crece mucho, el snapshot puede ser pesado. Mitigación: snapshot agregado (totales por día), no línea a línea; vista detallada solo si el JSON lo justifica.
- **Descartado**: app web separada con login (fuera del MVP por decisión de SSOT), envío por email (no escala, no seguro).

---

## 8. Supuestos a validar antes de implementación

Lista operativa para la épica 0 / 1. Marcar cada uno antes de cerrar la épica 1.

- [ ] **S-A**: WebView2 está disponible en los Windows objetivo (10/11). Validar con un feriante piloto.
- [ ] **S-B**: Inventario de impresoras térmicas reales (modelos, USB/Bluetooth, 58/80 mm) que usan los feriantes. Mínimo 2 modelos distintos para validar la abstracción.
- [ ] **S-C**: Hardware mínimo del puesto (RAM, almacenamiento). El instalador debe avisar si no se cumple.
- [ ] **S-D**: El feriante puede instalar software (no es un PC corporativo bloqueado). Si no, explorar MSI distribuible por la organización del feriante.
- [ ] **S-E**: Política de "comparativa interanual" — ¿el operador acepta que es asistida (no automática)? Si exige matching automático, la épica 1 incorpora heurística de fuzzy matching. Validar antes de cerrar épica 1.
- [ ] **S-F**: Disponibilidad de cobertura — ¿el feriante tiene alguna red disponible puntualmente (WiFi del ferial, 4G puntual) para subir snapshots? Si la respuesta es "nunca", la vista remota no es viable y la épica 6 se replantea (snapshot local + envío manual).
- [ ] **S-G**: Decisión sobre moneda / idioma / formato de fecha. Asumido: EUR, es-ES, DD/MM/YYYY. A confirmar con feriante piloto.
- [ ] **S-H**: ¿La oferta es una sola por venta? SSOT dice que sí, pero si un feriante pide combos combinables, hay que introducir `OfferApplication` (muchos-a-muchos). Resolver antes de la épica 2.

---

## 9. Riesgos abiertos

1. **Falta de testing en hardware térmico real.** La investigación sobre `escpos` es positiva en benchmarks, pero hasta no probar con impresoras reales de feriantes, el riesgo de incompatibilidad existe. **Mitigación**: épica 3 exige pruebas con al menos dos modelos físicos antes de cerrar.
2. **WebView2 en Windows viejos.** Si un feriante usa Windows 10 sin actualizar, la app no arranca. **Mitigación**: bootstrapper de WebView2 en el instalador + mensaje claro.
3. **Tamaño del snapshot remoto.** Si un feriante trabaja 12 horas al día en una feria grande, el snapshot diario puede ser grande. **Mitigación**: snapshot agregado por defecto; detallado bajo demanda.
4. **Falta de gestión de inventario de papel de la impresora.** Si se acaba el papel, la entrega falla. La UI debe avisar al operador de forma proactiva. **Mitigación**: comando `health()` periódico + indicador en la barra superior.
5. **Comparativa interanual con datos sucios.** Si dos ferias distintas se llaman igual, la comparativa mezcla datos. **Mitigación**: UI que muestra el nombre normalizado de la feria y avisa si hay ambigüedad; regla documentada en `data-model.md §4`.
6. **No hay `Refund` real en v1.** Las correcciones de caja requieren intervención manual. **Mitigación**: documentación operativa clara + épica futura para `CashAdjustment`.
7. **Lock-in con Supabase.** Si en 2 años Supabase cambia precios, hay que migrar. **Mitigación**: usar SQL estándar y Deno Edge Functions, que se pueden portar.
8. **Coste de aprendizaje de Rust para el equipo.** Si el equipo no tiene experiencia, la curva es real. **Mitigación**: acotar Rust a lo imprescindible (commands, ticket-delivery, sync), dejar lógica de UI/dominio en TS.
9. **Ausencia de validación de carga real.** No se han hecho pruebas con miles de ventas. **Mitigación**: épica 9 incluye test de carga sintético; SQLite + WAL soporta bien volumen moderado, y un feriante medio no genera >1000 ventas/día.
10. **Impresoras Bluetooth SPP en Windows.** Soporte heterogéneo, especialmente en Bluetooth LE moderno. **Mitigación**: priorizar USB en v1; Bluetooth como secundario documentado; investigar SPP clásico vs BLE en épica 3.

---

## 10. Cuándo crear ADRs separados

Siguiendo la skill `definir-arquitectura`, no se crean ADRs por defecto. Se crearán en `docs/adr/` cuando se cierren estas decisiones:

- **`ADR-001 — Plataforma Tauri 2.x`** (al cerrar épica 0 o al empezar épica 1). Material porque es difícil de revertir.
- **`ADR-002 — Persistencia local con rusqlite directo`** (al cerrar épica 1).
- **`ADR-003 — Patrón de sync ChangeLog + cola`** (al cerrar épica 5).
- **`ADR-004 — Abstracción `ticket-delivery`** (al cerrar épica 3).

Estos ADRs se crean **al cerrar** la épica correspondiente, no antes. Así documentan la decisión final con su evidencia real, no la hipótesis.

---

## 11. Próximo paso recomendado

Derivar a `@arrancar-proyecto` (épica 0) para inicializar el repositorio con esta estructura. Las decisiones aquí tomadas son input directo para que `arrancar-proyecto` configure:
- `package.json` con las dependencias de §3.1 y 3.2.
- `Cargo.toml` con las dependencias de §3.2, 3.3, 3.4, 3.5.
- `tauri.conf.json` con la ventana, capabilities y plugins declarados.
- `.gitignore` adecuado al stack (no versionar `target/`, `node_modules/`, `dist/`, `*.db`).

Una vez arrancado el repo, las épicas 1 (modelo), 2 (TPV) y 3 (ticket-delivery) pueden comenzar en paralelo siguiendo la separación de responsabilidades documentada en §4. La épica 5 (sync) y 6 (vista remota) deben esperar a que 1–4 estén estables, porque dependen del modelo y de la entrega ya implementadas.