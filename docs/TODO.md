# TODO — FeriaNet

Roadmap operativo de producto. Lista épicas y áreas de trabajo alineadas con `docs/SSOT.md` y `docs/product-map.md`. Las tareas concretas que salgan de cada épica las crea y mantiene `gestionar-roadmap`; aquí solo se decide **qué** se hace y **en qué orden lógico**, no el detalle de tickets individuales.

## Estado

Proyecto greenfield. No hay épicas cerradas todavía. El orden siguiente es de ejecución sugerida, no un compromiso de fechas.

## Épica 0 — Bootstrap del proyecto

Objetivo: dejar el repositorio con estructura mínima, documentación base y entorno reproducible para que cualquier IA o persona pueda empezar a trabajar sin depender de contexto conversacional.

- Crear estructura de carpetas estándar del proyecto.
- Inicializar git y `.gitignore` adecuados al stack que se elija.
- Configurar README de entrada al proyecto.
- Crear plantilla y archivo vivo en `.teams/`.
- Definir reglas locales del proyecto en `.questions/` y, si procede, `docs/REGLAS_PROYECTO.md`.

## Épica 1 — Modelo de ferias y atracciones

Objetivo: poder dar de alta una feria, sus ediciones anuales, las atracciones de cada edición y persistir todo localmente.

- CRUD de ferias con nombre, año y fechas.
- Identificación automática de "edición de feria" (mismo nombre + año distinto) para soportar la comparativa interanual.
- CRUD de atracciones por edición: nombre, precio base del ticket, color identificativo.
- Persistencia local de ferias y atracciones.

## Épica 2 — Caja diaria y TPV

Objetivo: que el feriante pueda abrir la caja del día para una atracción y vender tickets.

- Apertura y cierre de caja diaria por atracción.
- TPV con venta por cantidad: `N tickets × precio unitario`.
- Soporte de ofertas/bundles con precio especial dentro de una misma venta.
- Persistencia local de líneas de venta, totales y cierres.
- El TPV nunca se bloquea por falta de internet.

## Épica 3 — `ticket-delivery` (módulo intercambiable)

Objetivo: entregar el ticket físico al cliente desacoplado de la lógica de venta.

- Definir interfaz interna del módulo `ticket-delivery`.
- Implementación v1: impresión en impresora térmica.
- Pruebas de sustitución: la lógica de venta debe poder funcionar con un `ticket-delivery` de prueba (no-op) sin tocar el TPV.

## Épica 4 — Informes v1

Objetivo: cerrar el ciclo de consulta local con los tres informes que el MVP promete.

- Informe por día: total por atracción + total de la feria en ese día.
- Informe por feria: total agregado de la edición.
- Comparativa interanual: misma feria en años distintos, lado a lado.
- Exportación de los datos del informe (formato a decidir más adelante).

## Épica 5 — Sincronización opcional

Objetivo: cuando hay internet, llevar al backend los datos locales para consulta remota, sin que la venta dependa nunca de esa subida.

- Diseño de la API de sync (esquema, formato, versionado) — decisión diferida hasta arquitectura.
- Empaquetado y subida idempotente de ferias, atracciones, cajas y ventas.
- Manejo de conflictos: la fuente de verdad operativa es el TPV local.

## Épica 6 — Consulta remota mínima

Objetivo: que el feriante (o alguien de su confianza) pueda ver las ventas desde fuera sin instalar nada.

- URL privada con vista de solo lectura.
- Sin login complejo en v1.
- Datos servidos desde el backend sincronizado.

## Épica 7 — Identidad y multi-tenant (post-MVP, base)

Objetivo: sentar las bases de cuentas y permisos para que las siguientes capacidades (roles, multi-puesto, datáfono) no tengan que reescribir la capa de identidad.

- Modelo de cuenta de feriante en el backend.
- Auth básica para la consulta remota.
- Punto de extensión para roles (operador vs dueño) — implementación fuera del MVP.

## Épica 8 — Familias futuras (preparación)

Objetivo: dejar preparado el terreno para las ideas futuras documentadas en `product-map.md` sin implementarlas en v1.

- Punto de extensión en `ticket-delivery` para RFID.
- Punto de extensión en caja para multi-puesto.
- Punto de extensión en venta para pagos digitales.
- Punto de extensión en producto para TPV sin ticket numerado (stock).

## Épica 9 — Validación

Objetivo: confirmar que el MVP cumple los principios de la SSOT antes de declararlo terminado.

- Pruebas de venta e impresión sin red.
- Pruebas de sustitución del módulo `ticket-delivery` (probar con un `ticket-delivery` alternativo).
- Pruebas de comparativa interanual con datos de al menos dos ediciones de la misma feria.
- Pruebas de consulta remota solo-lectura.

## Cómo usar este archivo

- Cada épica se abre como tarea macro en `gestionar-roadmap`.
- El detalle de tickets individuales se mantiene allí, no aquí.
- Si una épica cambia de alcance, vuelve a alinearse con `SSOT.md` y `product-map.md` antes de continuar.
- Una épica solo se cierra cuando su criterio de aceptación implícito está cumplido y validado por la épica 9.