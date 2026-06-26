[CmdletBinding()]
param(
    [ValidateSet('Auto', 'Sync', 'Release')]
    [string]$Mode = 'Auto',

    [string]$BranchName,

    [string]$ReleaseBranch = 'main',

    [switch]$AllowSyncOnReleaseBranch,

    [ValidateSet('None', 'Json', 'Text')]
    [string]$VersionMode = 'None',

    [string]$VersionPath,

    [string]$VersionJsonProperty = 'version',

    [string]$ExpectedVersion,

    [string]$ExpectedTag,

    [string]$TodoPath,

    [string]$PublishedVersionLabel = 'Version publicada actual',

    [string]$TargetVersionLabel,

    [string]$GitHubRef = $env:GITHUB_REF,

    [string]$ReleaseCommitPattern,

    [switch]$EnforceBranchScope,

    [ValidateSet('Pending', 'Head')]
    [string]$BranchScopeDiffTarget = 'Pending',

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

function Get-VersionValue {
    if ($VersionMode -eq 'None') {
        return $null
    }

    if ([string]::IsNullOrWhiteSpace($VersionPath)) {
        Fail 'VersionPath es obligatorio cuando VersionMode no es None.'
    }

    if (-not (Test-Path $VersionPath)) {
        Fail "No existe la ruta de version '$VersionPath'."
    }

    switch ($VersionMode) {
        'Json' {
            $json = Get-Content -Raw $VersionPath | ConvertFrom-Json
            $value = $json.$VersionJsonProperty
        }
        'Text' {
            $value = (Get-Content -Raw $VersionPath).Trim()
        }
    }

    if ([string]::IsNullOrWhiteSpace([string]$value)) {
        Fail "No se pudo resolver la version desde '$VersionPath'."
    }

    $trimmed = ([string]$value).Trim()
    if ($trimmed.StartsWith('v')) {
        $trimmed = $trimmed.Substring(1)
    }

    if ($trimmed -notmatch '^\d+\.\d+\.\d+$') {
        Fail "La version '$trimmed' no sigue un formato SemVer basico X.Y.Z."
    }

    return $trimmed
}

function Get-TodoValue {
    param(
        [string]$Content,
        [string]$Label
    )

    if ([string]::IsNullOrWhiteSpace($Label)) {
        return $null
    }

    $pattern = "(?m)^- $([regex]::Escape($Label)):\s+`?(?<value>[^`r`n]+)`?\s*$"
    $match = [regex]::Match($Content, $pattern)
    if (-not $match.Success) {
        Fail "No se encontro el campo '$Label' en '$TodoPath'."
    }

    return $match.Groups['value'].Value.Trim().Trim('`')
}

function Invoke-BranchScopeValidation {
    if (-not $EnforceBranchScope) {
        return
    }

    $branchScopeScript = Join-Path $PSScriptRoot 'validate-branch-scope.ps1'
    if (-not (Test-Path $branchScopeScript)) {
        Fail "No existe el validador de alcance de rama '$branchScopeScript'."
    }

    $arguments = @(
        '-BranchName', $currentBranch,
        '-ReleaseBranch', $ReleaseBranch,
        '-DiffTarget', $BranchScopeDiffTarget
    )

    if ($AllowCrossScopeBranch) {
        $arguments += '-AllowCrossScopeBranch'
    }

    & powershell -ExecutionPolicy Bypass -File $branchScopeScript @arguments
    if ($LASTEXITCODE -ne 0) {
        Fail 'La validacion de alcance de rama no ha pasado.'
    }
}

$version = Get-VersionValue
$currentBranch = $BranchName
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = Get-GitOutput -Arguments @('branch', '--show-current')
}

if ([string]::IsNullOrWhiteSpace($currentBranch) -and $GitHubRef -match '^refs/heads/(?<branch>.+)$') {
    $currentBranch = $matches.branch
}

$tagFromRef = $null
if ($GitHubRef -match '^refs/tags/(?<tag>v.+)$') {
    $tagFromRef = $matches.tag
}

$resolvedMode = $Mode
if ($resolvedMode -eq 'Auto') {
    if ($tagFromRef -or ($currentBranch -eq $ReleaseBranch -and -not $AllowSyncOnReleaseBranch)) {
        $resolvedMode = 'Release'
    } else {
        $resolvedMode = 'Sync'
    }
}

$commitSubject = Get-GitOutput -Arguments @('log', '-1', '--pretty=%s')
$changedFilesRaw = Get-GitOutput -Arguments @('show', '--pretty=', '--name-only', 'HEAD')
$changedFiles = @()
if (-not [string]::IsNullOrWhiteSpace($changedFilesRaw)) {
    $changedFiles = $changedFilesRaw -split "`r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

$todoContent = $null
if (-not [string]::IsNullOrWhiteSpace($TodoPath)) {
    if (-not (Test-Path $TodoPath)) {
        Fail "No existe el roadmap '$TodoPath'."
    }

    $todoContent = Get-Content -Raw $TodoPath
}

$genericVersionedCommitPattern = '(^v\d+\.\d+\.\d+ - .+)|(^\[v\d+\.\d+\.\d+\] .+)'

if ($resolvedMode -eq 'Release') {
    if (-not $tagFromRef -and $currentBranch -ne $ReleaseBranch) {
        Fail "Un release formal solo puede validarse en '$ReleaseBranch' o desde un tag versionado. Rama detectada: '$currentBranch'."
    }

    if ($version) {
        if ($ExpectedVersion -and $ExpectedVersion.TrimStart('v') -ne $version) {
            Fail "ExpectedVersion ('$ExpectedVersion') no coincide con la version resuelta ('$version')."
        }

        if ($ExpectedTag -and $ExpectedTag -ne "v$version") {
            Fail "ExpectedTag ('$ExpectedTag') no coincide con la version resuelta ('v$version')."
        }

        if ($tagFromRef -and $tagFromRef -ne "v$version") {
            Fail "El tag del workflow ('$tagFromRef') no coincide con la version resuelta ('v$version')."
        }

        if ($todoContent -and $PublishedVersionLabel) {
            $publishedVersion = Get-TodoValue -Content $todoContent -Label $PublishedVersionLabel
            if ($publishedVersion -ne "v$version") {
                Fail "El roadmap no refleja como publicada la version 'v$version'. Valor detectado: '$publishedVersion'."
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ReleaseCommitPattern)) {
        if ($commitSubject -notmatch $ReleaseCommitPattern) {
            Fail "El commit actual no cumple el formato de release esperado: '$commitSubject'."
        }
    }
}
else {
    if ($currentBranch -eq $ReleaseBranch -and -not $AllowSyncOnReleaseBranch) {
        Fail "Los sync push no deben ejecutarse en '$ReleaseBranch'."
    }

    if ($tagFromRef) {
        Fail 'Los sync push no deben publicarse con tags de release.'
    }

    if ($commitSubject -match $genericVersionedCommitPattern) {
        Fail "El commit actual parece versionado y no un sync push: '$commitSubject'."
    }

    if ($version -and $VersionPath) {
        $normalizedVersionPath = (Resolve-Path $VersionPath).Path
        foreach ($file in $changedFiles) {
            $resolvedFile = Resolve-Path $file -ErrorAction SilentlyContinue
            if ($resolvedFile -and $resolvedFile.Path -eq $normalizedVersionPath) {
                Fail 'Un sync push no debe modificar la fuente formal de version.'
            }
        }
    }
}

Invoke-BranchScopeValidation

Write-Host "Validacion Git correcta. Modo: $resolvedMode." -ForegroundColor Green
