# Product Map — FeriaNet

Mapa vivo de capacidades del producto. Se organiza por estado (actual, v1, futuro) y por familia funcional. Toda capacidad aquí listada debe ser coherente con `docs/SSOT.md`.

## Capacidades actuales

Vacías. FeriaNet es un proyecto nuevo sin código entregado todavía.

## Capacidades de v1 (MVP)

Capacidades que el MVP debe entregar. Cada una describe qué se hace, no cómo se implementa.

### Ferias
- Alta de ferias con nombre, año y fechas de inicio y fin.
- El sistema agrupa automáticamente ferias con el mismo nombre en años distintos como **ediciones de feria** distintas. Esta agrupación es la base de la comparativa interanual.
- CRUD básico de ferias.

### Atracciones por feria
- Alta de atracciones dentro de una feria concreta.
- Cada atracción tiene: nombre, precio base del ticket, color identificativo y caja propia.
- Las atracciones viven siempre dentro de una edición de feria, no son entidades globales.

### TPV — venta de tickets
- Venta por cantidad: `N tickets × precio unitario`.
- Soporte de **ofertas**: bundle con precio especial aplicado a un grupo de líneas dentro de la misma venta.
- Impresión inmediata del ticket a través del módulo `ticket-delivery` (en v1, impresora térmica).
- La venta nunca se bloquea por falta de internet ni por caída del backend.

### Persistencia local
- Las ventas, cajas, atracciones y ferias se almacenan localmente.
- Toda la información registrada en una jornada debe poder consultarse, abrirse y reimprimirse sin conexión.

### Panel de informes
- **Por día:** total por atracción en ese día y total de la feria en ese día.
- **Por feria:** total agregado de la edición de feria completa.
- **Comparativa interanual:** misma feria, distintos años, lado a lado (ej. "Feria de Cádiz 2025" vs "Feria de Cádiz 2026"). Esta capacidad depende de que el modelo identifique bien las ediciones.

### Sincronización opcional a backend
- Cuando hay internet, los datos locales se sincronizan al backend para consulta remota.
- La venta nunca espera ni depende de la nube. La sync es unidireccional operativa hacia el backend; el TPV no se sincroniza "para cobrar".

### Consulta remota mínima
- URL privada con vista de solo lectura de las ventas sincronizadas.
- Sin login complejo en v1 (sin autenticación robusta, sin multi-tenant, sin roles).

## Ideas futuras (post-MVP)

Agrupadas por familia. Cada idea debe pasar por el criterio de crecimiento de la SSOT antes de convertirse en capacidad.

### Ticket-delivery
- Sustitución de la impresora térmica por lector/grabador de fichas RFID.
- El módulo `ticket-delivery` ya está diseñado como intercambiable desde v1, así que este cambio no debería requerir tocar la lógica de venta.

### Cajas y operación
- Multi-puesto por atracción: varias cajas simultáneas atendiendo la misma atracción.
- Sincronización entre cajas locales en tiempo real (LAN o similar).

### Stock y catálogo
- Stock de productos físicos (chucherias, agua, etc.).
- TPV de productos sin ticket numerado, conviviendo con la venta de tickets.

### Pagos
- Pagos digitales con datáfono o TPV bancario.
- Integración con pasarelas de pago.

### Identidad y permisos
- Roles diferenciados: operador de caja vs dueño del negocio.
- Permisos por rol, auditoría de operaciones sensibles (cierre de caja, devoluciones).

### Multi-tenant
- Separación de cuentas de feriantes en el backend.
- Auth completa con email/contraseña o magic link.
- Panel de administración del feriante.

### Operación remota avanzada
- Vista remota con login completo, alertas y exportación.
- Notificaciones push al dueño cuando una caja abre o cierra.

## Criterio de entrada para nuevas capacidades

Toda propuesta debe responder:

1. **¿Aporta valor real al feriante durante una feria?** Si la respuesta es "es bonito" o "queda profesional", se rechaza.
2. **¿Es módulo nuevo o flujo dentro de un módulo existente?** Si es flujo, no se abre área nueva; se añade al módulo correspondiente.
3. **¿Rompe algún principio de la SSOT?** Si rompe local-first, ticket-delivery intercambiable, comparativa interanual o simplicidad del MVP, se rechaza o se reformula.
4. **¿Depende de una decisión diferida que aún no se ha tomado?** Si requiere fijar plataforma, stack o backend cloud concreto antes que el resto, se difiere.

Si una propuesta sobrevive las cuatro preguntas, entra al roadmap como épica siguiendo el formato de `docs/TODO.md`.