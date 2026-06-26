# Design system primero y librerías UI

Esta referencia detalla cómo `elevar-ui-frontend` debe relacionarse con el design system o librería UI real del proyecto. El `SKILL.md` principal resume la regla; aquí se desarrolla el criterio completo.

## Regla crítica: design system primero

Si el proyecto ya usa una librería UI o design system visible, la skill debe:

1. Preferir sus primitives y patrones oficiales.
2. Consultar primero la documentación o reglas visuales propias del proyecto y, después, la documentación oficial, source o storybook del sistema detectado antes de improvisar.
3. Reutilizar variantes y composiciones ya presentes en el proyecto.
4. Evitar crear wrappers estéticos o tokens paralelos sin necesidad probada.
5. Tratar cualquier desviación de la librería oficial como una excepción rara, no como atajo normal de implementación.

### Excepciones visuales documentadas

En ocasiones muy puntuales, el estilo nativo del design system puede no resolver bien una necesidad real de producto o composición.

En ese caso, la IA puede aplicar una solución más personalizada, pero solo si:

- Primero ha intentado resolverlo con el componente nativo y con ajustes ligeros sobre ese componente.
- La desviación aporta una mejora funcional o de claridad real, no solo preferencia estética.
- El resultado sigue conviviendo bien con el resto del sistema visual.
- Deja un comentario breve y explícito en el código junto al bloque afectado explicando que se trata de una excepción documentada.

Regla práctica: una excepción visual aceptable debe ser local, justificada, legible y reversible.

### Regla 0.0.1: auditar tokens globales antes de parchear componentes oficiales

Si un componente oficial del design system se ve distinto a la demo o al patrón esperado, la skill no debe asumir primero que el fallo vive en el componente.

Antes de añadir clases, paddings, radios o overrides locales, debe revisar si la diferencia nace de tokens globales del proyecto como `radius`, sombras, tipografía, colores base, densidad de campo o variables de tema.

Si el proyecto busca acercarse visualmente al sistema oficial, la prioridad es restaurar o alinear esos tokens globales antes que encadenar microajustes sobre cada componente.

Regla práctica: si varios componentes oficiales parecen "más redondeados", "más blandos" o "más pesados" que la documentación, probablemente el problema está en el tema global y no en cada `Select`, `Input` o `Button`.

Si el proyecto documenta una fuente MCP preferente para esa librería o design system y ese MCP no está disponible localmente, la skill debe indicarlo y derivar a `configurar-mcp` antes de improvisar patrones como si la fuente oficial ya estuviera operativa.

## Delegación a skills y MCPs específicos de librería

Si el proyecto usa una librería UI concreta (HeroUI, Shadcn, Chakra, MUI, etc.), esta skill **no debe documentar props, variantes ni anti-patrones específicos de esa librería**. Eso pertenece a la skill de la librería o a la documentación local del proyecto.

El flujo correcto es:

1. Detectar qué librería UI usa el proyecto (inspeccionando `package.json`, imports reales y documentación local).
2. Buscar si existe una **skill específica** de esa librería en el proyecto (ej: `heroui-react`, `shadcn-ui`, etc.). Si existe, leerla.
3. Buscar si existe un **MCP específico** configurado para esa librería. Si existe, consultarlo antes de improvisar.
4. Buscar si la **documentación local del proyecto** (su doc de estilo/design system) fija reglas, anti-patrones o variantes válidas propias. Si existe, respetarla.

**Orden de precedencia para detalle de componentes:**

1. Documentación visual/de estilo del proyecto (reglas y excepciones locales).
2. Skill específica de la librería (si existe en el proyecto).
3. MCP oficial de la librería (si está configurado).
4. Documentación oficial de la librería (web, MDX, storybook).

**Esta skill aporta:** criterio de diseño, composición, jerarquía, layout, estados, densidad y materialidad, todo agnóstico de librería.
**La skill de la librería aporta:** qué props usar, qué variantes existen, qué anti-patrones de versiones anteriores evitar, y cómo componer los componentes correctamente.

Si el MCP o la skill específica de la librería no están disponibles localmente, esta skill debe indicarlo y derivar a `configurar-mcp` antes de improvisar patrones como si la fuente oficial ya estuviera operativa.
