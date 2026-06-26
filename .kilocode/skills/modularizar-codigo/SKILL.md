---
name: modularizar-codigo
description: "Divide archivos monoliticos en modulos mas pequenos, enfocados y mantenibles, preservando comportamiento y contratos existentes. TRIGGERS: modularizar, split file, monolito, componente grande, refactor big component, dividir archivo."
---

# Modularizar Codigo

## Objetivo
Dividir archivos monoliticos en modulos mas pequenos, enfocados y mantenibles, preservando comportamiento, contratos existentes y sin cambiar funcionalidad.

## Alcance y limites
- Incluye identificar responsabilidades y extraer componentes, hooks y datos.
- Incluye verificar que no cambia comportamiento ni contratos publicos.
- No redefine arquitectura; si la division afecta fronteras entre modulos, escala a @arquitecto.
- No crea modulos mas pequenos de ~30 lineas (overhead > beneficio).
- No cambia funcionalidad mientras refactoriza.

## Inputs / contexto obligatorio
- Archivo monolitico a dividir.
- Componentes hermanos y patrones del proyecto.
- SSOT y convenciones de estructura.
- Build y typecheck como verificacion continua.

## Comportamiento esperado

### Fase 1: Analisis de responsabilidades
1. Leer el archivo completo y listar todas las responsabilidades:
   - Datos estaticos (arrays, configs, textos)
   - Logica de estado (useState, useEffect, hooks custom)
   - Logica de presentacion (JSX, layout, composicion)
   - Utilidades (funciones helper, calculos, formatos)
   - Componentes inline definidos dentro del archivo
2. Agrupar por cohesion: cosas que cambian juntas van juntas.

### Fase 2: Plan de extraccion
3. Definir el orden de extraccion (menos dependiente primero):
   - Datos estaticos → `src/data/`
   - Utilidades → `src/lib/`
   - Hooks custom → `src/hooks/`
   - Componentes inline → `src/components/` o subdirectorio
4. Definir la interfaz de cada modulo extraido:
   - Que props exporta
   - Que tipos comparte
   - Que dependencias tiene

### Fase 3: Extraccion incremental
5. Extraer un modulo a la vez.
6. Despues de cada extraccion:
   - Verificar que typecheck pasa.
   - Verificar que no hay imports rotos.
   - Verificar que el comportamiento no cambio.
7. No extraer el siguiente modulo hasta que el actual este validado.

### Fase 4: Limpieza del archivo original
8. Despues de extraer todos los modulos, el archivo original debe:
   - Importar los modulos extraidos.
   - Mantener su rol como compositor/orquestador.
   - Tener una longitud razonable (idealmente < 300 lineas para componentes).

### Fase 5: Verificacion final
9. Typecheck completo.
10. Build completo.
11. Verificar que no hay imports muertos.
12. Verificar que no hay exports sin usar.

## Criterios de separacion
- **Single Responsibility**: cada modulo hace una cosa bien.
- **Data Ownership**: los datos viven donde se usan principalmente.
- **Interface Clarity**: props/exports minimas y claras.
- **No Behavior Change**: el codigo extraido debe comportarse identicamente.
- **Minimum Size**: no crear modulos de menos de ~30 lineas.

## Anti-patterns
- No extraer todo a la vez (incremental es mas seguro).
- No crear modulos mas pequenos de 30 lineas (overhead > beneficio).
- No dejar codigo muerto en el archivo original.
- No cambiar comportamiento mientras refactoriza.
- No crear modulos que solo usa un unico consumidor si el modulo es pequeno.
- No crear barrel exports (index.ts) innecesarios.

## Flujo recomendado
- [ ] Leer el archivo completo y clasificar responsabilidades reales.
- [ ] Revisar componentes hermanos, rutas, exports e imports existentes.
- [ ] Definir extracciones pequenas por datos, utilidades, hooks o componentes.
- [ ] Extraer un modulo cada vez, preservando contratos y comportamiento.
- [ ] Validar typecheck o build proporcional tras bloques relevantes.
- [ ] Eliminar codigo muerto y dejar el archivo original como compositor claro.

## Criterio de resultado bueno
- El comportamiento publico no cambia y los contratos existentes se preservan.
- Cada modulo extraido tiene responsabilidad clara, tamano razonable e interfaz minima.
- La estructura respeta convenciones reales del proyecto y evita barrels o capas innecesarias.
- El cierre incluye checks ejecutados y cualquier riesgo residual.

## Triggers
- Keywords: modularizar, split file, monolito, componente grande, refactor big component, dividir archivo, archivo muy grande
- Patrones de usuario: "este archivo es muy grande", "divide este componente", "modulariza page.tsx", "tengo un componente de 900 lineas"
- Encadenamiento: despues de `actuar-como-senior` como implementacion del analisis

## Ejemplos de activacion
- "Modulariza page.tsx que tiene 900 lineas."
- "Este componente hace demasiadas cosas, dividelo."
- "Extrae los datos y hooks de este archivo monolitico."
