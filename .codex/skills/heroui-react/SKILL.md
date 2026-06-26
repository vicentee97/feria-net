---
name: heroui-react
description: "Guia a la IA para usar HeroUI v3 correctamente en proyectos React: componentes, variantes, theming, anti-patrones de v2 y consulta de documentacion oficial antes de implementar UI. TRIGGERS: HeroUI, hero-ui, boton heroui, card heroui, tabla heroui, componente heroui, theming heroui."
---

# HeroUI React
Guia operativa para trabajar con HeroUI v3 en proyectos React sin mezclar patrones heredados de v2.

# Objetivo
- Guiar a la IA para implementar interfaces con HeroUI v3 de forma correcta, moderna y alineada con su documentacion oficial.
- Evitar anti-patrones heredados de HeroUI v2 que rompen estilos, APIs o composicion.
- Forzar consulta de documentacion viva antes de improvisar props, variantes o estructura de componentes.

# Alcance y limites
- Aplica cuando el proyecto usa o quiere usar `@heroui/react` y `@heroui/styles`.
- Cubre composicion de componentes, instalacion, theming, variantes, estilos y consulta de documentacion/source.
- Incluye el uso de los scripts locales de esta skill para obtener componentes, docs, source, estilos y theme variables.
- No sustituye a la documentacion visual o de design system propia del proyecto cuando exista.
- No debe aplicar patrones de HeroUI v2 ni mezclar APIs antiguas por inercia de entrenamiento.
- No debe copiar implementaciones internas de la libreria como si fueran codigo de aplicacion salvo necesidad de aprendizaje puntual.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- SSOT y documentacion visual del proyecto actual.
- `package.json`, imports reales y componentes existentes del proyecto.
- Scripts de esta skill en `./scripts/`.
- Si el proyecto documenta una fuente MCP preferente para HeroUI, usarla antes de improvisar.

# Comportamiento esperado
Antes de proponer o escribir codigo con HeroUI, la skill debe:
1. Confirmar que el proyecto realmente usa HeroUI v3 o que esa adopcion encaja con el stack existente.
2. Revisar la version real de `@heroui/react`, `@heroui/styles`, Tailwind y dependencias relacionadas.
3. Consultar documentacion viva del componente o guia necesaria antes de usar props, variantes o estructura.
4. Mantener la implementacion dentro del sistema visual de HeroUI y del proyecto, sin inventar una capa paralela.

## Regla critica: HeroUI v3 solamente
- No usar patrones de HeroUI v2.
- No asumir `HeroUIProvider` como requisito base.
- No asumir `framer-motion` como dependencia necesaria del sistema.
- Preferir composicion compound cuando la documentacion del componente la defina.
- Recordar que HeroUI v3 trabaja sobre Tailwind CSS v4 y React Aria Components.

### Comparativa rapida v2 vs v3
| Feature | v2 (no usar) | v3 (usar) |
| --- | --- | --- |
| Provider | `<HeroUIProvider>` requerido | No hace falta provider global |
| Animaciones | `framer-motion` | CSS nativo del sistema |
| API de componentes | Props planas | Composicion y primitives modernas |
| Styling | Tailwind v3 + paquetes antiguos | Tailwind v4 + `@heroui/styles` |
| Paquetes | `@heroui/system`, `@heroui/theme` | `@heroui/react`, `@heroui/styles` |

## Anti-patrones criticos: props fantasma de v2
Los LLM tienden a inyectar props de HeroUI v2 por entrenamiento previo. Si aparece una prop dudosa, la skill debe verificarla contra la documentacion oficial de v3 antes de usarla.

### Button
| Prop v2 (no usar) | Efecto en v3 | Alternativa v3 |
| --- | --- | --- |
| `color="primary"` | Ignorada o innecesaria | Omitirla si el default ya cubre el caso |
| `variant="shadow"` | No existe | Usar una variante valida documentada |
| `variant="light"` | No existe | `variant="ghost"` |
| `variant="flat"` | No existe | `variant="secondary"` o `variant="ghost"` |
| `variant="bordered"` | No existe | `variant="outline"` |
| `variant="faded"` | No existe | `variant="outline"` o `variant="ghost"` |
| `disableRipple` | No existe | Omitir |
| `disableAnimation` | No existe | Omitir |

Variantes validas: `primary`, `secondary`, `tertiary`, `outline`, `ghost`, `danger`, `danger-soft`.

### Chip
| Prop v2 (no usar) | Efecto en v3 | Alternativa v3 |
| --- | --- | --- |
| `variant="flat"` | No existe | `variant="soft"` |
| `variant="dot"` | No existe | `startContent` con el icono o punto necesario |
| `variant="light"` | No existe | `variant="tertiary"` |

### Spinner
| Prop v2 (no usar) | Efecto en v3 | Alternativa v3 |
| --- | --- | --- |
| `color="primary"` | No existe | `color="accent"` |
| `color="secondary"` | No existe | `color="current"` o `color="accent"` |

## Instalacion esencial
### Instalacion minima
```bash
npm i @heroui/styles @heroui/react tailwind-variants
```

### Setup base recomendado
1. Importar primero `tailwindcss`.
2. Importar despues `@heroui/styles`.
3. Configurar PostCSS/Tailwind v4 segun el framework real del proyecto.
4. Usar `onPress` y patrones accesibles donde el componente lo recomiende.

## Theming
- HeroUI v3 usa CSS variables con `oklch`.
- Las variables sin sufijo representan fondos o surfaces.
- Las variables con `-foreground` representan texto sobre ese fondo.
- Si el proyecto necesita un tema custom, ajustar tokens y no solo clases sueltas.

## Consulta de documentacion y source
La skill debe consultar documentacion antes de implementar.

### Scripts disponibles
```bash
node scripts/list_components.mjs
node scripts/get_component_docs.mjs Button
node scripts/get_component_docs.mjs Button Card TextField
node scripts/get_source.mjs Button
node scripts/get_styles.mjs Button
node scripts/get_theme.mjs
node scripts/get_docs.mjs /docs/react/getting-started/theming
```

### Uso recomendado de fuentes
1. Docs del proyecto, si existen.
2. Scripts o MCP oficial de HeroUI.
3. Source/styles oficiales de HeroUI para dudas finas.
4. Fallbacks de red solo cuando la via primaria no responda.

# Flujo recomendado
- [ ] Confirmar que HeroUI v3 es la libreria correcta para el proyecto.
- [ ] Revisar `package.json`, imports existentes y version real de HeroUI.
- [ ] Obtener la documentacion del componente concreto antes de implementarlo.
- [ ] Verificar variantes, props y estructura con docs/source reales.
- [ ] Aplicar HeroUI como sistema base, no como excusa para montar CSS paralelo.
- [ ] Ajustar tema, variantes y `className`/`classNames` solo cuando haga falta de verdad.
- [ ] Validar estados abiertos, focus, loading, empty y error cuando el componente los tenga.

# Criterio de resultado bueno
- La implementacion usa HeroUI v3 real y no patrones heredados de v2.
- Los componentes se montan con props y variantes que existen de verdad.
- La decision de theming o estilos respeta el sistema oficial y el contexto del proyecto.
- La IA se apoya en documentacion viva antes de improvisar.
- Los scripts locales de la skill siguen siendo suficientes para recuperar docs, source y theme data.

## Triggers
- Keywords: HeroUI, hero-ui, boton heroui, card heroui, tabla heroui, componente heroui, theming heroui
- Patrones de usuario: "usa HeroUI para esta pantalla", "consulta la documentacion de Button", "monta theming con HeroUI v3", "revisa si esto usa props de v2"
- Encadenamiento: despues de `elevar-ui-frontend` cuando el proyecto use HeroUI

# Ejemplos de activacion
- "Usa HeroUI para esta pantalla."
- "Consulta la documentacion de Button y Card."
- "Necesito montar theming con HeroUI v3."
- "Revisa si este componente esta usando props fantasma de HeroUI v2."
