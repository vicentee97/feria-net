# QUESTION_TEMPLATE

Plantilla canonica para preguntas abiertas en FeriaNet. Cualquier duda real que
bloquee una decision o que merezca trazabilidad se documenta aqui.

## Contrato vigente

- **IDs**: `QUESTION-NNN` correlativos. Asignar a partir de `.questions/.counter` (a crear cuando se use por primera vez; mientras tanto, correlativo manual).
- **Estados**: `abierta` | `resuelta` | `descartada`.
- **Sin preguntas narrativas**: solo dudas que afecten a una decision o un riesgo material.
- **Cierre**: al pasar a `resuelta` o `descartada`, la decision tomada se anade en el campo `Decision`.

## Campos

| Campo | Obligatorio | Notas |
|---|---|---|
| `ID` | si | `QUESTION-NNN` |
| `Fecha` | si | `YYYY-MM-DD` |
| `Contexto` | si | Por que surge ahora |
| `Pregunta` | si | Una sola pregunta concreta |
| `Opciones consideradas` | si | Lista breve, no narrativa |
| `Recomendacion` | no | Si hay una opcion claramente mejor |
| `Decision` | si al cerrar | Que se decidio y por que |
| `Impacto` | si | Que modulos o docs se ven afectados |
| `Estado` | si | `abierta` \| `resuelta` \| `descartada` |

## Esqueleto

```markdown
# QUESTION-NNN — <Titulo corto>

- ID: QUESTION-NNN
- Fecha: YYYY-MM-DD
- Estado: abierta | resuelta | descartada

## Contexto
<Por que surge>

## Pregunta
<Una sola pregunta concreta>

## Opciones consideradas
- Opcion A: <resumen>
- Opcion B: <resumen>

## Recomendacion
<si aplica>

## Decision
<si resuelta o descartada>

## Impacto
<modulos / docs afectados>
```
