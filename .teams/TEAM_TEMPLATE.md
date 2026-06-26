# TEAM_TEMPLATE

Plantilla canonica de team activo en FeriaNet. Cualquier TEAM nuevo se crea copiando
este archivo a `.teams/active/TEAM-NNN-<slug>.md` y rellenando los campos.

## Contrato vigente

- **Estados validos**: `activo` | `cerrado` | `bloqueado`. Nada mas.
- **IDs**: `TEAM-NNN` correlativos, asignados por `.teams/.counter`. Antes de crear un team, leer `.teams/.counter` y usar el siguiente numero.
- **Sin campo `Responsable`**. Ese campo era del contrato legacy del hub y esta retirado.
- **Cierre**: cuando el trabajo termina, mover el archivo a `.teams/archive/` y actualizar `.teams/INDEX.md` y `.teams/.counter`.

## Campos

| Campo | Obligatorio | Notas |
|---|---|---|
| `ID` | si | `TEAM-NNN` |
| `Nombre` | si | Frase corta que identifica el hilo |
| `Fecha creacion` | si | `YYYY-MM-DD` |
| `Estado` | si | `activo` \| `cerrado` \| `bloqueado` |
| `Descripcion` | si | 2-4 lineas: que se hace y por que |
| `Objetivo` | si | Criterio verificable de cierre |
| `Contexto` | si | Documentos canonicos leidos, supuestos, dependencias |
| `Trabajo realizado` | si | Bullet list concreto, no narracion |
| `Archivos tocados` | si | Rutas exactas, una por linea |
| `Coordinacion` | si | Si aplica Rule 25: rama, worktree, lease, superficies. Si no aplica, justificar. |
| `Criterios de cierre` | si | Lista verificable |
| `Riesgos` | si | Materiales o `Ninguno material` |
| `Evidencia` | si | Comandos ejecutados, salidas, rutas finales |
| `Proximo paso` | si | Quien continua, con que brief |

## Esqueleto

```markdown
# TEAM-NNN — <Nombre>

- ID: TEAM-NNN
- Nombre: <Nombre>
- Fecha creacion: YYYY-MM-DD
- Estado: activo | cerrado | bloqueado

## Descripcion
<2-4 lineas>

## Objetivo
<Criterio verificable de cierre>

## Contexto
- Docs leidos: <rutas>
- Supuestos: <lista>
- Dependencias: <otros TEAMs o tareas>

## Trabajo realizado
- <bullet>
- <bullet>

## Archivos tocados
- <ruta absoluta 1>
- <ruta absoluta 2>

## Coordinacion
<Rule 25 si aplica; si no, "No aplica: <motivo>">

## Criterios de cierre
- [ ] <criterio>
- [ ] <criterio>

## Riesgos
<materiales o "Ninguno material">

## Evidencia
- <comando> -> <salida relevante>
- <ruta final>

## Proximo paso
<quien continua, con que brief>
```
