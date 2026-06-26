# Formato de roadmap operativo

Usa esta referencia cuando tengas que crear, normalizar o sanear `docs/TODO.md`.

## 1. Estructura mínima recomendada

```md
# TODO — <Proyecto>

> Este archivo es el roadmap operativo vivo del proyecto.
> Usa IDs estables para enlazar trabajo, equipo y publicaciones.

## En Curso
- [ ] PRJ-001 - Resultado concreto en progreso.

## Siguientes
- [ ] PRJ-002 - Siguiente resultado concreto.

## Bloqueados
- [ ] PRJ-003 - Resultado bloqueado.
  Depende de: decisión sobre proveedor de pagos.

## Cerrados
- [x] PRJ-004 - Resultado ya completado. (v1.02.00 - 2026-03-21)

## Aparcados
- [ ] PRJ-005 - Idea legítima, fuera del foco actual.
```

## 2. Calidad mínima de un ítem
Un ítem bueno:
- se entiende sin conversación previa;
- describe un resultado, no solo una intención;
- se puede cerrar sin arrastrar varias decisiones grandes;
- deja claro qué cambia cuando esté terminado.

## 3. Señales de ítem flojo
Reescribe o parte el ítem si:
- usa verbos genéricos como `mejorar`, `revisar`, `hacer` sin objeto claro;
- mezcla varias entregas grandes con `y`;
- necesita una explicación larga fuera del propio documento para entenderse;
- en realidad es una épica que debería partirse en 2 o más pasos cerrables.

## 4. Cuándo partir un ítem
Pártelo si:
- afecta a capas distintas con validaciones distintas;
- mezcla definición, implementación y cierre técnico como un solo bloque;
- el usuario podría decir `esto ya está` solo para una parte y no para el resto;
- requiere más de una decisión estructural importante.

## 5. Estados
- `En Curso`: trabajo activo real, no simples intenciones.
- `Siguientes`: siguiente cola priorizada.
- `Bloqueados`: no puede avanzar sin una dependencia externa o decisión relevante.
- `Cerrados`: ya terminado y, si aplica, enlazado con versión.
- `Aparcados`: válido pero fuera del foco actual.

## 6. IDs estables
- Reutiliza el prefijo que ya exista en el proyecto.
- Si la SSOT define uno, respétalo.
- Si no existe ninguno, usa un prefijo corto y estable derivado del proyecto.
- No renumeres IDs antiguos salvo corrección claramente mecánica y segura.

## 7. Relación con publicación versionada
- El roadmap no decide la versión.
- `configurar-github` puede añadir `vX.XX.XX - YYYY-MM-DD` cuando el cierre sea inequívoco.
- Si no hubo publicación, el ítem puede cerrarse sin versión.
