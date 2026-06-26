# SSOT — FeriaNet

Fuente única de verdad del producto. Toda decisión funcional que condicione arquitectura, roadmap o código debe pasar por aquí.

## Producto en una frase

FeriaNet es la herramienta de gestión de ventas para feriantes que llevan atracciones a ferias: registra ferias, atracciones, cajas y tickets, vende e imprime localmente sin depender de internet y permite consultar las ventas desde una vista remota mínima.

## Fase activa

**v1 (MVP).** Proyecto nuevo, sin código todavía. La fase v1 está acotada al conjunto de capacidades listadas en `docs/product-map.md` y al roadmap de `docs/TODO.md`. Cualquier capacidad fuera de v1 queda explícitamente como idea futura.

## Usuario principal

El **feriante**: persona que opera una o varias atracciones en una feria y necesita cobrar tickets de forma fiable incluso sin cobertura.

## Principios de producto

1. **Local-first obligatorio para venta e impresión en v1.** El TPV registra y emite tickets sin internet. La red solo añade consulta remota opcional.
2. **`ticket-delivery` intercambiable desde v1.** El sistema que entrega el ticket (impresora térmica hoy, RFID mañana) es un módulo reemplazable. Ninguna parte de la lógica de venta puede acoplarse a un tipo de entrega concreto.
3. **Comparativa interanual es capacidad de v1.** El modelo de ferias debe permitir identificar la misma feria en distintos años (por ejemplo "Feria de Cádiz 2025" y "Feria de Cádiz 2026") para alimentar el informe de comparativa.
4. **Cero dependencia de la nube para operar.** El feriante puede abrir caja, vender e imprimir sin conexión. La sincronización, cuando exista, es solo para consulta remota.
5. **Vista remota mínima en v1.** La consulta desde fuera es de solo lectura, sin login complejo. La autenticación completa se difiere.
6. **Sin roles complejos en v1.** Operador de caja y dueño son la misma persona en v1; la separación por permisos queda fuera del MVP.

## Taxonomía canónica

Naming obligatorio en documentación, código, UI y mensajes:

| Término | Significado |
|---|---|
| **FeriaNet** | El producto. |
| **Feria** | El evento genérico (ej. "Feria de Cádiz"). |
| **Edición de feria** | La instancia anual concreta (ej. "Feria de Cádiz 2026"). |
| **Atracción** | Lo que el feriante opera. No usar "ride", no usar "puesto". |
| **Caja** | Registro diario de ventas de una atracción en una fecha concreta. |
| **Ticket** | Unidad de acceso que se vende. No usar "recibo", no usar "entrada". |
| **Oferta** | Bundle con precio especial aplicado a varias líneas de venta. |
| **TPV** | Terminal de venta. La pantalla donde el operador cobra. |
| **Feriante** | Usuario del sistema. |

## Modelo de dominio (nivel mental, sin esquema)

```
Feriante
└── Ferias (CRUD: nombre + año + fechas inicio/fin)
    └── Atracciones (configuradas para esa feria: nombre, color, precio base ticket)
        └── Caja diaria (ventas de la atracción en un día concreto)
            └── Líneas de venta (cantidad, precio unitario, oferta, total)
```

Este modelo es mental y orientativo. El esquema SQL concreto, los tipos, las claves y las políticas RLS no se fijan aquí; se decidirán al bajar a arquitectura.

## Criterio de crecimiento

Para que una idea entre al producto debe superar uno de estos tres filtros:

- **Módulo nuevo.** Cambia el modelo de datos, abre un flujo principal nuevo o requiere una abstracción que no existía.
- **Flujo dentro de un módulo.** Añade una variante operativa sobre datos que ya existen, sin modelo nuevo.
- **Rechazada.** Duplica funcionalidad existente, no aporta valor claro al feriante, o secuestra el foco del MVP.

Reglas adicionales:
- Toda capacidad que toque entrega de ticket se integra a través del módulo `ticket-delivery`. Nunca se acopla la venta a un tipo de entrega concreto.
- Toda comparativa interanual depende de que "edición de feria" esté bien identificada en el modelo. Si una idea rompe esa identificación, se rechaza.

## Decisiones diferidas (NO se deciden en producto)

Las siguientes decisiones se toman en fases posteriores. Documentarlas aquí deja explícito que son intencionadamente abiertas:

- **Plataforma exacta:** escritorio, web, móvil, tablet o híbrida.
- **Stack y librerías concretas** del cliente y del backend.
- **Backend cloud concreto:** Supabase u otro proveedor.
- **Esquema SQL final:** tablas, columnas, tipos, índices, políticas RLS.
- **Motor de impresión térmica concreto:** modelo, driver, SDK, idioma de comandos.

## Relación con el código

Proyecto greenfield. No existe aún código que mapear contra la taxonomía. Cuando arranque la implementación, este archivo será el referente para resolver dudas de naming.