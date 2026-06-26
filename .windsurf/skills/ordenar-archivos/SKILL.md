---
name: ordenar-archivos
description: "Revisa y mejora el orden estructural del proyecto: nombres de archivos y carpetas, ubicacion correcta de piezas, limpieza de desorden y coherencia general del arbol. TRIGGERS: ordenar, limpiar estructura, nombres, carpetas, reorganizar, orden del proyecto, renombrar archivos."
---

# Ordenar Archivos

# Objetivo
Mantener estructura, rutas, nombres y ubicacion de piezas de codigo de forma coherente con el proyecto real, evitando duplicacion, archivos mal ubicados y decisiones de organizacion tomadas por inercia.

# Alcance y limites
- Incluye decidir o revisar rutas, nombres de archivos, carpetas, casing, agrupacion por dominio/modulo, ubicacion de helpers, validators, actions, componentes y utilidades.
- Incluye detectar duplicacion estructural: funciones equivalentes con otro nombre, helpers repetidos, validators/actions paralelos, imports profundos innecesarios o archivos huerfanos.
- Incluye distinguir entre rutas canonicas confirmadas y rutas candidatas sugeridas por un brief.
- No autoriza borrados, renombres masivos ni movimientos amplios sin blueprint previo y confirmacion cuando el cambio sea destructivo o dificil de revertir.
- No cambia reglas propias del framework si eso rompe convenciones como routing basado en archivos, carpetas especiales o generacion automatica.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Estructura real del proyecto y archivos cercanos.
- Convenciones detectadas de nombres, casing, exports, imports y agrupacion.
- Brief original, distinguiendo si las rutas vienen de SSOT/issue/arquitectura aprobada o si son deducciones.

# Comportamiento esperado
## Rutas canonicas y candidatas
- Una ruta sugerida por un brief es candidata salvo que venga marcada o respaldada por SSOT, issue aprobada, arquitectura aprobada o convencion existente.
- Si una ruta es candidata, inspecciona primero el arbol y confirma si encaja antes de crearla.
- Si una ruta es canonica, respetala salvo conflicto real con framework, seguridad, build o documentacion mas autoritativa.
- No conviertas `(nuevo)` en permiso automatico para crear: primero busca equivalentes y convenciones.

## Implementacion normal con archivos nuevos
- Antes de crear un archivo nuevo, busca si ya existe una pieza equivalente o un patron cercano.
- Elige nombres y carpetas por convencion del proyecto, no por gusto aislado ni por el primer nombre plausible.
- Reutiliza funciones existentes cuando encajen; no dupliques helpers, validators, actions ni utilidades con nombres distintos.
- Si la decision es local, reversible y encaja con convenciones, puedes avanzar y explicar la hipotesis.
- Si la ubicacion afecta fronteras entre modulos, arquitectura, dominio o rutas dificiles de revertir, escala a @orquestador para @arquitecto.

## Convenciones de naming
| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `FloatingNavbar.tsx`, `HeroSection.tsx` |
| Hooks custom | kebab-case con `use-` | `use-theme-toggle.ts`, `use-toast.ts` |
| Utilidades | kebab-case | `utils.ts`, `format-date.ts` |
| Datos | kebab-case | `projects.tsx`, `portfolio-data.ts` |
| Configs | kebab-case o nombre de herramienta | `eslint.config.mjs`, `tailwind.config.ts` |
| Assets en public/ | kebab-case sin espacios | `about-avatar.jpg`, `Ventana-de-ventas.jpg` |

Regla práctica: si un archivo rompe la convención de su categoría, renombrarlo y actualizar todos los imports.

## Extracción de datos duplicados
Cuando varios componentes definen la misma estructura de datos (arrays de objetos con la misma forma):
1. Identificar la fuente de verdad más completa.
2. Extraer a `src/data/` con tipos TypeScript definidos.
3. Actualizar todos los consumidores para importar desde la fuente única.
4. Verificar que las descripciones y datos no han divergido entre las copias.
5. Ejecutar typecheck y build.

## Consolidación de librerías
Cuando múltiples librerías cubren el mismo propósito (iconos, animaciones, formularios, estado):
1. Identificar cuál se usa más en el código real.
2. Migrar los usos de las otras a la elegida.
3. Eliminar las no usadas de `package.json`.
4. Verificar build después de cada eliminación.

## Cambios estructurales, renombres o limpieza
- Para reorganizaciones, renombres, movimientos amplios o limpieza de carpetas, prepara primero un blueprint de arbol objetivo.
- El blueprint debe indicar que se mueve, que se renombra, por que mejora coherencia y que imports/consumidores se actualizaran.
- No elimines archivos salvo autorizacion explicita o aplicando una skill de operaciones sensibles cuando corresponda.

## Relacion con higiene de artefactos
- Esta skill decide orden estructural, ubicacion, nombres, duplicacion y archivos huerfanos de producto.
- El ciclo de vida operativo de temporales y artefactos creados por agentes vive en Rule 24 de `docs/AI_GLOBAL_RULES.md` y `scripts/workspace_hygiene.py`; no depende de activar esta skill.
- Un temporal propio registrado puede limpiarse por ese contrato. Borrar o mover legado, archivos ajenos o material dudoso sigue requiriendo revision y, cuando corresponda, `ejecutar-operaciones-sensibles`.

# Flujo recomendado
- [ ] Leer SSOT/reglas y el brief original.
- [ ] Inspeccionar arbol, archivos cercanos y convenciones reales.
- [ ] Clasificar rutas como canonicas confirmadas o candidatas.
- [ ] Buscar equivalentes antes de crear piezas nuevas.
- [ ] Elegir ubicacion/nombre coherente o escalar a @arquitecto si la decision es estructural.
- [ ] En revisiones, reportar solo desorden material: duplicacion, mala ubicacion o naming que cause riesgo real.

# Criterio de resultado bueno
- La estructura queda predecible para otro desarrollador.
- Las rutas nuevas respetan convenciones reales del proyecto.
- No hay duplicacion funcional ni helpers paralelos innecesarios.
- Las decisiones estructurales importantes pasan por @arquitecto.
- Los cambios de orden no se convierten en burocracia por preferencias menores.

# Ejemplos de activacion
- "Ordena estos archivos y nombres."
- "Revisa si estas rutas nuevas tienen sentido."
- "Antes de crear este validator/action, comprueba si ya existe algo equivalente."
- "El brief sugiere `src/actions/products.ts`; verifica si es ruta canonica o candidata."
