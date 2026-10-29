# Referencia de patrones — Usar PowerShell Seguro

Plantillas listas para copiar. Cada una implementa una regla de `SKILL.md`; ninguna se ejecuta sin adaptar target y cotas al caso concreto.

## 1. Target absoluto con raices prohibidas (R1)

```powershell
# Raices protegidas por PREFIJO (carpetas concretas; sin raices de disco en esta lista)
$prohibidas = @(
    $env:USERPROFILE,
    (Join-Path $env:USERPROFILE '.dsh'),
    (Join-Path $env:USERPROFILE 'dsh-copias'),
    "$env:APPDATA\npm\node_modules\@deepseek-ai",
    'C:\Vicente\Programacion\Proyectos\dsh-plugins'
) | ForEach-Object { [IO.Path]::GetFullPath($_).TrimEnd('\') }

# Raices de disco: SOLO por igualdad exacta (StartsWith('C:\') casa con toda ruta en C:)
$raicesDisco = @('C:\', 'D:\') | ForEach-Object { [IO.Path]::GetFullPath($_) }

$dest = [IO.Path]::GetFullPath('C:\ruta\objetivo')
$errores = 0
if ($raicesDisco -contains $dest) { Write-Warning "R1: '$dest' es una raiz de disco."; $errores++ }
foreach ($p in $prohibidas) {
    if ($dest -eq $p -or $dest.StartsWith($p + '\', [StringComparison]::OrdinalIgnoreCase)) {
        Write-Warning "R1: '$dest' esta bajo raiz protegida '$p'."; $errores++
    }
}
if ($errores -gt 0) { throw "R1: objetivo prohibido; ABORTAR (fail-closed)." }
```

Auto-test de la plantilla (ejecutar una vez por copia): (a) una raiz de disco en minusculas debe abortar; (b) un junction dentro del arbol debe saltar el chequeo R2; (c) un proyecto legitimo debe PASS.

## 2. Deteccion de reparse points antes de borrado recursivo (R2)

```powershell
$enlaces = Get-ChildItem -LiteralPath $dest -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
if ($enlaces) {
    $enlaces | Select-Object FullName | Format-Table
    throw "R2: hay enlaces dentro de '$dest'; NO borrar. Avisar y decidir con el usuario."
}
```

## 3. Cota de bucle con lista fija (R4)

```powershell
# Lista fija: el guion crea SOLO lo que esta aqui. Nunca generar carpetas en un while.
$carpetas = @('lotes', 'salidas', 'logs')
foreach ($c in $carpetas) {
    New-Item -ItemType Directory -Path (Join-Path $dest $c) -WhatIf
}
# Pase real solo tras revisar la salida de -WhatIf
foreach ($c in $carpetas) {
    New-Item -ItemType Directory -Path (Join-Path $dest $c) -Force | Out-Null
}
```

Con contador cuando la lista no es fija:

```powershell
$max = 50   # cota declarada: si se supera, es un bug, no se sigue
for ($i = 0; $i -lt $max; $i++) {
    # ... trabajo acotado ...
}
if ($i -ge $max) { Write-Warning "R4: se alcanzo la cota de $max; revisar antes de relanzar." }
```

## 4. Guarda de trabajador y tope de procesos (R5)

PowerShell:

```powershell
if ($env:MI_GUION_TRABAJADOR -eq '1') { return }   # guarda LO PRIMERO: ya soy trabajador
$env:MI_GUION_TRABAJADOR = '1'

$maxJobs = 4   # tope declarado; jamas un bucle sin tope lanzando Start-Process/Start-Job
$jobs = @()
try {
    foreach ($item in $items) {
        if ($jobs.Count -ge $maxJobs) { $jobs = @($jobs | Where-Object { -not $_.HasExited }) }
        $jobs += Start-Process pwsh -ArgumentList '-File', $hijo -PassThru -Environment @{ MI_GUION_TRABAJADOR = '1' }
    }
}
finally {
    $jobs | Where-Object { -not $_.HasExited } | Stop-Process -ErrorAction SilentlyContinue  # retirar hijos
}
```

Node.js:

```js
// Guarda de trabajador LO PRIMERO: un trabajador jamas relanza hijos
if (process.env.MI_GUION_TRABAJADOR === '1') process.exit(0);

const MAX_PROCESOS = 4;              // tope declarado
process.env.MI_GUION_TRABAJADOR = '1';
// ... lanzar hijos con stdio 'inherit' o 'ignore' y tope MAX_PROCESOS,
//     con limpieza de hijos en un try/finally o en un handler de salida ...
```

## 5. Simulacion con -WhatIf o dry-run (R6)

```powershell
# Cmdlets con SupportsShouldProcess aceptan -WhatIf: solo narran, no tocan
Get-ChildItem -LiteralPath $dest -Filter '*.tmp' | Remove-Item -WhatIf
# Pase real SOLO tras leer la lista anterior
Get-ChildItem -LiteralPath $dest -Filter '*.tmp' | Remove-Item
```

Para scripts propios, un interruptor de seco:

```powershell
param([switch]$DryRun)
# ... calcular $targets ...
if ($DryRun) { $targets | Write-Output; return }   # modo seco: SOLO lista
# ... pase real ...
```

## 6. Copia previa en rutas protegidas (R7, proyecto dsh-plugins)

```powershell
node tools/copias.mjs copiar --motivo "antes de <que va a hacer el guion>"
```

## 7. Verificacion y cierre (R8)

```powershell
# Tras el pase real: comprobar el efecto esperado con evidencia, no de memoria
Test-Path (Join-Path $dest 'resultado-esperado')
(Get-ChildItem -LiteralPath $dest).Count
```

## 8. Retirada de temporales propios (higiene)

Los temporales de una tarea viven solo en `.ai-work/<id-de-tarea>/<agente>/`. Al terminar, el guion retira SOLO lo que creo dentro de su namespace; jamas toca restos de otras sesiones ni carpetas ajenas (eso es decision de la persona dueña y exige copia verificada).
