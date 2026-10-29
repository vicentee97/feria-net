[CmdletBinding()]
param(
    # Rama long-lived contra la que se mide fusion/contenido (default del hub).
    [string]$ReleaseBranch = 'main',

    # Umbrales del protocolo (Bloque 3 del PLAN). Redefinibles por SSOT local.
    [ValidateRange(0, 8760)]
    [double]$CaducidadWipHoras = 72,

    [ValidateRange(0, 365)]
    [double]$CaducidadStaleDias = 7,

    [ValidateRange(0, 100)]
    [int]$TopeRamas = 5,

    [ValidateRange(0, 1)]
    [double]$UmbralRedundancia = 0.60,

    # "varios commits fuera de main" -> umbral operativo 2+ commits.
    [ValidateRange(1, 1000)]
    [int]$CommitsParaDivergente = 2
)

<#
.SYNOPSIS
    Auditoria read-only del estado de higiene de las ramas del repositorio.

.DESCRIPTION
    Materializa el Bloque 3 del PLAN de `github-protocol-loop` (skill
    `configurar-github`, references `ramas.md` y `merge-gate.md`). Emite un
    informe determinista y legible para que un humano vea en un comando el
    orden real del protocolo de ramas.

    NO muta el repositorio: solo usa comandos git de lectura
    (`for-each-ref`, `log`, `diff --quiet`, `merge-base --is-ancestor`,
    `rev-parse --verify`). NUNCA borra ramas; solo marca y reporta
    (verificable: ausencia de `git branch -d/-D/push --delete` en este cuerpo).

.MARCAS (cada una con chequeo determinista)
    - fusionada        : `git merge-base --is-ancestor <rama> <main>` exit 0.
    - squash-safe      : `git diff --quiet <main>..<rama>` exit 0 (deteccion
                         por contenido; cubre squash merge que NO crea
                         merge-node y por tanto `--merged` no lo ve).
    - huerfana         : fusionada O squash-safe (deberia borrarse).
    - caducada-WIP     : edad > 72h Y tiene commits fuera de main.
    - caducada-stale   : edad > 7d sin commit (inactividad).
    - divergente       : >=2 commits fuera de main Y no fusionable.
    - redundante       : tokeniza (split por `/` y `-`, lower-case, Jaccard)
                         con solape >=60% frente a OTRA rama activa (no main,
                         no huerfana).

.SALIDA
    Tabla legible (rama | tipo | edad | estado | marcas | tema) + resumen
    (total, activas, huerfanas, caducadas, divergentes, redundantes, tope).

.EXIT CODES
    0 = inventario completado, incluso si hay marcas de ramas ajenas.
    1 = error real al leer o interpretar el repositorio.
#>

$ErrorActionPreference = 'Stop'

function Get-GitOutput {
    param([string[]]$Arguments, [switch]$AllowMissing)

    $result = & git @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        if ($AllowMissing) { return $null }
        throw "Fallo git ($LASTEXITCODE): $($Arguments -join ' ')"
    }

    if ($null -eq $result) {
        return ''
    }

    return ($result -join "`n").Trim()
}

function Invoke-GitExit {
    # Ejecuta git silencioso y devuelve SOLO el exit code (para merge-base
    # --is-ancestor y diff --quiet, donde lo que importa es 0 vs resto).
    param([string[]]$Arguments)

    & git @Arguments 2>$null | Out-Null
    if ($LASTEXITCODE -gt 1) { throw "Fallo git ($LASTEXITCODE): $($Arguments -join ' ')" }
    return $LASTEXITCODE
}

function Get-BranchTokens {
    # Reutiliza el patron de validacion de scope de validate-branch-scope.ps1:
    # split por /, - y _ ; lower-case ; excluye prefijos comunes y numericos ;
    # dedupe. Define la tokenizacion que pide P3-V3 del PLAN (no es magica).
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return @()
    }

    $ignorados = @(
        'codex','feature','feat','fix','bugfix','hotfix','chore','docs','doc',
        'refactor','test','tests','ci','infra','sync','wip','release',
        'main','master','develop','dev','origin','remotes','heads','patch','update'
    )

    return $Value.ToLowerInvariant().Split('/-_') |
        Where-Object {
            -not [string]::IsNullOrWhiteSpace($_) -and
            $_ -notmatch '^\d{4}$' -and
            $_ -notmatch '^\d{4}-\d{2}-\d{2}$' -and
            $_ -notmatch '^\d+$' -and
            $ignorados -notcontains $_
        } |
        Select-Object -Unique
}

function Get-JaccardSimilarity {
    param([string[]]$A, [string[]]$B)

    if ($A.Count -eq 0 -and $B.Count -eq 0) { return 1.0 }
    if ($A.Count -eq 0 -or $B.Count -eq 0) { return 0.0 }

    $inter = @($A | Where-Object { $B -contains $_ } | Select-Object -Unique).Count
    $union = @($A + $B | Select-Object -Unique).Count
    if ($union -eq 0) { return 0.0 }

    return [double]$inter / [double]$union
}

# --- 1. Validar repo ---
$inRepo = Get-GitOutput -Arguments @('rev-parse', '--is-inside-work-tree')
if ([string]::IsNullOrWhiteSpace($inRepo) -or $inRepo -ne 'true') {
    throw 'No estas dentro de un repositorio git.'
}

# --- 2. Resolver rama de integracion (local preferida; fallback remota) ---
$releaseLocalSha = Get-GitOutput -Arguments @('rev-parse', '--verify', "refs/heads/$ReleaseBranch") -AllowMissing
$releaseTarget = if (-not [string]::IsNullOrWhiteSpace($releaseLocalSha)) {
    "refs/heads/$ReleaseBranch"
} else {
    $releaseRemoteSha = Get-GitOutput -Arguments @('rev-parse', '--verify', "refs/remotes/origin/$ReleaseBranch") -AllowMissing
    if ([string]::IsNullOrWhiteSpace($releaseRemoteSha)) {
        throw "La rama de integracion '$ReleaseBranch' no existe (local ni en origin)."
    }
    "refs/remotes/origin/$ReleaseBranch"
}

# --- 3. Listar refs (local + remota; excluir HEAD simbolico) ---
$refsRaw = Get-GitOutput -Arguments @('for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes')
if ([string]::IsNullOrWhiteSpace($refsRaw)) {
    Write-Host 'No hay ramas para auditar.' -ForegroundColor Yellow
    return
}

$refs = $refsRaw -split "`r?`n" | Where-Object {
    -not [string]::IsNullOrWhiteSpace($_) -and
    -not $_.EndsWith('/HEAD')
}

# --- 4. Construir objeto por ref ---
$ramas = @()
foreach ($ref in $refs) {
    if ($ref.StartsWith('refs/heads/')) {
        $tipo = 'local'
        $short = $ref.Substring('refs/heads/'.Length)
        $displayName = $short
    }
    elseif ($ref.StartsWith('refs/remotes/')) {
        $tipo = 'remota'
        $rest = $ref.Substring('refs/remotes/'.Length)
        $displayName = $rest
        $parts = $rest -split '/', 2
        $short = if ($parts.Count -ge 2) { $parts[1] } else { $parts[0] }
    }
    else {
        continue
    }

    $esMain = ($short -ceq $ReleaseBranch)

    # Edad: committerdate ISO estricto.
    $fechaIso = Get-GitOutput -Arguments @('log', '-1', '--format=%cI', $ref)
    $edadDias = $null
    $edadHoras = $null
    if (-not [string]::IsNullOrWhiteSpace($fechaIso)) {
        try {
            $fecha = [datetimeoffset]::Parse($fechaIso)
            $diff = [datetimeoffset]::UtcNow - $fecha
            $edadHoras = $diff.TotalHours
            $edadDias = $diff.TotalDays
        }
        catch {
            # timestamp no parseable; dejamos null y reportamos '?'
        }
    }

    # Dueño/tema (pista).
    $subject = Get-GitOutput -Arguments @('log', '-1', '--format=%s', $ref)
    $committer = Get-GitOutput -Arguments @('log', '-1', '--format=%cn', $ref)

    # Fusionada: merge-base --is-ancestor <rama> <main>.
    $fusionada = $false
    if (-not $esMain) {
        $rc = Invoke-GitExit -Arguments @('merge-base', '--is-ancestor', $ref, $releaseTarget)
        if ($rc -eq 0) { $fusionada = $true }
    }

    # Squash-safe: diff --quiet main..<rama> exit 0 (contenido igual).
    $squashSafe = $false
    if (-not $esMain -and -not $fusionada) {
        $rc = Invoke-GitExit -Arguments @('diff', '--quiet', "$releaseTarget..$ref")
        if ($rc -eq 0) { $squashSafe = $true }
    }

    # Commits fuera de main.
    $commitsFuera = 0
    if (-not $esMain -and -not $fusionada) {
        $logOut = Get-GitOutput -Arguments @('log', '--oneline', "$releaseTarget..$ref")
        if (-not [string]::IsNullOrWhiteSpace($logOut)) {
            $commitsFuera = @($logOut -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count
        }
    }

    $huerfana = if ($esMain) { $false } else { ($fusionada -or $squashSafe) }

    $marcas = @()
    if ($huerfana) { $marcas += 'huerfana' }

    $caducadaWip = $false
    $caducadaStale = $false
    if ($null -ne $edadHoras) {
        if (-not $esMain -and -not $huerfana -and $edadHoras -gt $CaducidadWipHoras -and $commitsFuera -gt 0) {
            $caducadaWip = $true
            $marcas += 'caducada-WIP'
        }
        if (-not $esMain -and $edadDias -gt $CaducidadStaleDias) {
            $caducadaStale = $true
            $marcas += 'caducada-stale'
        }
    }

    $divergente = $false
    if (-not $esMain -and -not $fusionada -and -not $squashSafe -and $commitsFuera -ge $CommitsParaDivergente) {
        $divergente = $true
        $marcas += 'divergente'
    }

    $tokens = if ($esMain) { @() } else { Get-BranchTokens -Value $short }

    $ramas += [pscustomobject]@{
        Ref           = $ref
        Short         = $short
        Name          = $displayName
        Tipo          = $tipo
        EsMain        = $esMain
        FechaIso      = $fechaIso
        EdadDias      = $edadDias
        EdadHoras     = $edadHoras
        Subject       = $subject
        Committer     = $committer
        Fusionada     = $fusionada
        SquashSafe    = $squashSafe
        CommitsFuera  = $commitsFuera
        Huerfana      = $huerfana
        CaducadaWip   = $caducadaWip
        CaducadaStale = $caducadaStale
        Divergente    = $divergente
        Redundante    = $false
        RedundanteVs  = ''
        Tokens        = $tokens
        Marcas        = $marcas
    }
}

# --- 5. Redundancia: comparar tokens entre activas (no main, no huerfana),
#         desduplicando por short (local+remoto de la misma rama = 1). ---
$activasPorShort = @{}
foreach ($r in $ramas) {
    if ($r.EsMain -or $r.Huerfana) { continue }
    if (-not $activasPorShort.ContainsKey($r.Short)) {
        $activasPorShort[$r.Short] = @()
    }
    $activasPorShort[$r.Short] += $r
}

foreach ($r in $ramas) {
    if ($r.EsMain -or $r.Huerfana) { continue }
    if ($r.Tokens.Count -eq 0) { continue }

    foreach ($otroShort in $activasPorShort.Keys) {
        if ($otroShort -ceq $r.Short) { continue }
        $otra = $activasPorShort[$otroShort][0]
        if ($otra.Tokens.Count -eq 0) { continue }

        $sim = Get-JaccardSimilarity -A $r.Tokens -B $otra.Tokens
        if ($sim -ge $UmbralRedundancia) {
            $r.Redundante = $true
            $r.RedundanteVs = $otroShort
            # Insertar 'redundante' antes de 'divergente' (orden de severidad).
            $nuevas = @()
            $insertado = $false
            foreach ($m in $r.Marcas) {
                if (-not $insertado -and $m -eq 'divergente') {
                    $nuevas += "redundante($otroShort)"
                    $insertado = $true
                }
                $nuevas += $m
            }
            if (-not $insertado) { $nuevas += "redundante($otroShort)" }
            $r.Marcas = $nuevas
            break
        }
    }
}

# --- 6. Tope de activas (por short unico, excluyendo main) ---
$activasUnicas = $activasPorShort.Keys.Count
$topeSuperado = $activasUnicas -gt $TopeRamas

# --- 7. Salida legible (orden determinista: main, luego severidad, luego edad) ---
$ordenadas = $ramas | Sort-Object `
    @{Expression = 'EsMain';        Descending = $true},
    @{Expression = 'Huerfana';      Descending = $true},
    @{Expression = 'CaducadaStale'; Descending = $true},
    @{Expression = 'CaducadaWip';   Descending = $true},
    @{Expression = 'Redundante';    Descending = $true},
    @{Expression = 'Divergente';    Descending = $true},
    @{Expression = 'EdadDias';      Descending = $true},
    'Name'

function Format-Edad {
    param($Dias)
    if ($null -eq $Dias) { return '?' }
    if ($Dias -lt 1) { return ('{0:N1}h' -f ($Dias * 24)) }
    return ('{0:N1}d' -f $Dias)
}

$filas = foreach ($r in $ordenadas) {
    $estado = if ($r.EsMain) { 'main' }
              elseif ($r.Fusionada) { 'fusionada' }
              elseif ($r.SquashSafe) { 'squash-safe' }
              elseif ($r.CommitsFuera -gt 0) { "activa($($r.CommitsFuera)c)" }
              else { 'sin-cambios' }
    $marcasTxt = if ($r.Marcas.Count -gt 0) { ($r.Marcas -join ', ') } else { '-' }
    $tema = if ($r.Subject) {
        $s = $r.Subject
        if ($s.Length -gt 42) { $s = $s.Substring(0, 39) + '...' }
        $s
    }
    else { '-' }

    [pscustomobject]@{
        Rama   = $r.Name
        Tipo   = $r.Tipo
        Edad   = (Format-Edad -Dias $r.EdadDias)
        Estado = $estado
        Marcas = $marcasTxt
        Tema   = $tema
    }
}

Write-Host ''
Write-Host "AUDITORIA DE RAMAS  (rama de integracion: $ReleaseBranch)" -ForegroundColor Cyan
$pct = [math]::Round($UmbralRedundancia * 100)
Write-Host "Umbrales: caducada-WIP > ${CaducidadWipHoras}h con commits fuera | caducada-stale > ${CaducidadStaleDias}d | tope activas = $TopeRamas | redundancia >= ${pct}% (Jaccard)" -ForegroundColor DarkGray
Write-Host ''

$filas | Format-Table -AutoSize

# --- 8. Resumen ---
$total = $ramas.Count
$locales = @($ramas | Where-Object Tipo -eq 'local').Count
$remotas = @($ramas | Where-Object Tipo -eq 'remota').Count
$huerfanas = @($ramas | Where-Object Huerfana).Count
$caducadas = @($ramas | Where-Object { $_.CaducadaWip -or $_.CaducadaStale }).Count
$divergentes = @($ramas | Where-Object Divergente).Count
$redundantes = @($ramas | Where-Object Redundante).Count

Write-Host ''
Write-Host 'RESUMEN' -ForegroundColor Cyan
Write-Host "  Total refs               : $total  (locales: $locales / remotas: $remotas)"
$topeTxt = if ($topeSuperado) { "  [TOPE SUPERADO]" } else { '' }
Write-Host "  Activas unicas (no main) : $activasUnicas  / tope $TopeRamas$topeTxt"
Write-Host "  Huerfanas                : $huerfanas"
Write-Host "  Caducadas (WIP o stale)  : $caducadas"
Write-Host "  Divergentes              : $divergentes"
Write-Host "  Redundantes              : $redundantes"

if ($topeSuperado) {
    Write-Host 'AVISO: exceso de ramas; mantenimiento pendiente, no bloquea el lote propio ni exige borrar ramas.' -ForegroundColor Yellow
}

# --- 9. Exit code: las marcas de inventario son avisos, no gates globales. ---
Write-Host ''
Write-Host 'RESULTADO: inventario completado; marcas informativas -> exit 0.' -ForegroundColor Green
exit 0
