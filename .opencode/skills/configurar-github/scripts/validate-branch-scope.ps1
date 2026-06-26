[CmdletBinding()]
param(
    [string]$BranchName,

    [string]$ReleaseBranch = 'main',

    [ValidateSet('Pending', 'Head')]
    [string]$DiffTarget = 'Pending',

    [string[]]$IgnoredSegments = @(
        'codex',
        'feature',
        'feat',
        'fix',
        'bugfix',
        'hotfix',
        'chore',
        'docs',
        'doc',
        'refactor',
        'test',
        'tests',
        'ci',
        'infra',
        'sync',
        'wip',
        'release',
        'main',
        'master',
        'develop',
        'dev'
    ),

    [switch]$AllowCrossScopeBranch
)

$ErrorActionPreference = 'Stop'

function Fail {
    param([string]$Message)
    throw $Message
}

function Get-GitOutput {
    param([string[]]$Arguments)

    $result = & git @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    if ($null -eq $result) {
        return ''
    }

    return ($result -join "`n").Trim()
}

function Get-BranchTokens {
    param(
        [string]$Value,
        [string[]]$Ignored
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return @()
    }

    return $Value.ToLowerInvariant().Split('/-_') |
        Where-Object {
            -not [string]::IsNullOrWhiteSpace($_) -and
            $_ -notmatch '^\d{4}$' -and
            $_ -notmatch '^\d{4}-\d{2}-\d{2}$' -and
            $_ -notmatch '^\d+$' -and
            $Ignored -notcontains $_
        } |
        Select-Object -Unique
}

function Get-PendingFiles {
    $files = New-Object System.Collections.Generic.List[string]

    $staged = Get-GitOutput -Arguments @('diff', '--cached', '--name-only')
    $unstaged = Get-GitOutput -Arguments @('diff', '--name-only')
    $status = Get-GitOutput -Arguments @('status', '--porcelain')

    foreach ($block in @($staged, $unstaged)) {
        if (-not [string]::IsNullOrWhiteSpace($block)) {
            foreach ($line in ($block -split "`r?`n")) {
                if (-not [string]::IsNullOrWhiteSpace($line)) {
                    $files.Add($line.Trim())
                }
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($status)) {
        foreach ($line in ($status -split "`r?`n")) {
            if ([string]::IsNullOrWhiteSpace($line) -or $line.Length -lt 4) {
                continue
            }

            $path = $line.Substring(3).Trim()
            if ($path.StartsWith('"') -and $path.EndsWith('"')) {
                $path = $path.Trim('"')
            }

            if ($path.Contains(' -> ')) {
                $path = ($path -split ' -> ')[-1].Trim()
            }

            if (-not [string]::IsNullOrWhiteSpace($path)) {
                $files.Add($path)
            }
        }
    }

    return $files | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
}

function Get-HeadFiles {
    $headFiles = Get-GitOutput -Arguments @('show', '--pretty=', '--name-only', 'HEAD')
    if ([string]::IsNullOrWhiteSpace($headFiles)) {
        return @()
    }

    return $headFiles -split "`r?`n" |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Select-Object -Unique
}

function Test-IsCrossCuttingPath {
    param([string]$Path)

    $normalized = $Path.Replace('\', '/').ToLowerInvariant()

    return (
        $normalized -eq 'agents.md' -or
        $normalized -match '(^|/)\.teams/' -or
        $normalized -match '(^|/)\.questions/' -or
        $normalized -match '(^|/)docs/' -or
        $normalized -match '(^|/)\.github/' -or
        $normalized -match '(^|/)\.vscode/' -or
        $normalized -match '(^|/)\.idea/' -or
        $normalized -match '(^|/)bootstrap\.md$' -or
        $normalized -match '(^|/)readme(\.[^/]+)?$' -or
        $normalized -match '(^|/)license(\.[^/]+)?$'
    )
}

if ([string]::IsNullOrWhiteSpace($BranchName)) {
    $BranchName = Get-GitOutput -Arguments @('branch', '--show-current')
}

if ([string]::IsNullOrWhiteSpace($BranchName)) {
    Fail 'No se pudo resolver la rama actual para validar su alcance.'
}

if ($AllowCrossScopeBranch -or $BranchName -eq $ReleaseBranch) {
    Write-Host 'Validacion de alcance de rama omitida por configuracion o rama de integracion.' -ForegroundColor Yellow
    return
}

$tokens = Get-BranchTokens -Value $BranchName -Ignored $IgnoredSegments
if ($tokens.Count -eq 0) {
    Write-Host "Rama '$BranchName' sin scope tematico estricto. No se fuerza validacion de alcance." -ForegroundColor Yellow
    return
}

$changedFiles = if ($DiffTarget -eq 'Head') { Get-HeadFiles } else { Get-PendingFiles }
if ($changedFiles.Count -eq 0) {
    Write-Host "Sin archivos para validar en '$BranchName'." -ForegroundColor Yellow
    return
}

$allCrossCutting = $true
foreach ($file in $changedFiles) {
    if (-not (Test-IsCrossCuttingPath -Path $file)) {
        $allCrossCutting = $false
        break
    }
}

if ($allCrossCutting) {
    $tokensText = $tokens -join ', '
    $filesText = ($changedFiles | Select-Object -First 8) -join ', '
    Fail "La rama '$BranchName' parece tematica ($tokensText), pero los cambios detectados son transversales o de sincronizacion ($filesText). Usa la rama de integracion, una rama mas amplia o confirma explicitamente una excepcion."
}

Write-Host "Validacion de alcance de rama correcta para '$BranchName'." -ForegroundColor Green
