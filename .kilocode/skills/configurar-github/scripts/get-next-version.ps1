<#
.SYNOPSIS
    Resuelve la version base y calcula la siguiente version formal del repositorio.
.DESCRIPTION
    Busca la ultima version en tags Git con formato vX.XX.XX, en HUB_VERSION y,
    si faltan ambos, intenta recuperarla del historial local. Devuelve la fuente
    detectada y la siguiente version segun el tipo de bump indicado.
#>

param (
    [ValidateSet('major', 'minor', 'patch')]
    [string]$BumpType = 'patch',

    [string]$RepoRoot = '.',

    [string]$HubVersionPath = 'HUB_VERSION',

    [switch]$FetchTags
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Normalize-VersionString {
    param (
        [AllowNull()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $trimmed = $Value.Trim()
    if ($trimmed.StartsWith('v')) {
        $trimmed = $trimmed.Substring(1)
    }

    if ($trimmed -notmatch '^\d+\.\d{2}\.\d{2}$') {
        return $null
    }

    return $trimmed
}

function ConvertTo-VersionObject {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Version
    )

    $parts = $Version.Split('.')
    [pscustomobject]@{
        Major = [int]$parts[0]
        Minor = [int]$parts[1]
        Patch = [int]$parts[2]
    }
}

function Format-Version {
    param (
        [Parameter(Mandatory = $true)]
        [int]$Major,

        [Parameter(Mandatory = $true)]
        [int]$Minor,

        [Parameter(Mandatory = $true)]
        [int]$Patch
    )

    return '{0}.{1:D2}.{2:D2}' -f $Major, $Minor, $Patch
}

function Compare-Version {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Left,

        [Parameter(Mandatory = $true)]
        [string]$Right
    )

    $leftObj = ConvertTo-VersionObject -Version $Left
    $rightObj = ConvertTo-VersionObject -Version $Right

    foreach ($property in @('Major', 'Minor', 'Patch')) {
        if ($leftObj.$property -gt $rightObj.$property) {
            return 1
        }

        if ($leftObj.$property -lt $rightObj.$property) {
            return -1
        }
    }

    return 0
}

function Get-LatestVersionFromTags {
    if ($FetchTags) {
        git fetch --tags --quiet | Out-Null
    }

    $tagVersions = git tag --list 'v*' 2>$null |
        ForEach-Object { Normalize-VersionString -Value $_ } |
        Where-Object { $_ }

    if (-not $tagVersions) {
        return $null
    }

    $latest = $tagVersions[0]
    foreach ($candidate in $tagVersions) {
        if ((Compare-Version -Left $candidate -Right $latest) -gt 0) {
            $latest = $candidate
        }
    }

    return $latest
}

function Get-LatestVersionFromHistory {
    $history = git log --format='%s%n%b' -n 200 2>$null
    $matches = [regex]::Matches(($history -join "`n"), 'v(?<version>\d+\.\d{2}\.\d{2})')

    if ($matches.Count -eq 0) {
        return $null
    }

    $latest = $matches[0].Groups['version'].Value
    foreach ($match in $matches) {
        $candidate = $match.Groups['version'].Value
        if ((Compare-Version -Left $candidate -Right $latest) -gt 0) {
            $latest = $candidate
        }
    }

    return $latest
}

Push-Location $RepoRoot
try {
    $warnings = New-Object System.Collections.Generic.List[string]

    $tagVersion = Get-LatestVersionFromTags

    $hubVersion = $null
    if (Test-Path $HubVersionPath) {
        $hubVersion = Normalize-VersionString -Value (Get-Content -Raw $HubVersionPath)
        if (-not $hubVersion) {
            $warnings.Add("El archivo '$HubVersionPath' existe pero no contiene una version valida X.XX.XX.")
        }
    }

    $historyVersion = Get-LatestVersionFromHistory

    $currentVersion = $null
    $source = $null

    if ($tagVersion) {
        $currentVersion = $tagVersion
        $source = 'tag'

        if ($hubVersion -and (Compare-Version -Left $hubVersion -Right $tagVersion) -ne 0) {
            $warnings.Add("HUB_VERSION ($hubVersion) no coincide con el ultimo tag detectado ($tagVersion).")
        }
    } elseif ($hubVersion) {
        $currentVersion = $hubVersion
        $source = 'hub_version'
    } elseif ($historyVersion) {
        $currentVersion = $historyVersion
        $source = 'history'
    } else {
        $currentVersion = '1.00.00'
        $source = 'bootstrap'
        $warnings.Add('No se encontro una version previa valida; se usa 1.00.00 como base inicial.')
    }

    $current = ConvertTo-VersionObject -Version $currentVersion
    switch ($BumpType) {
        'major' {
            $nextVersion = Format-Version -Major ($current.Major + 1) -Minor 0 -Patch 0
        }
        'minor' {
            $nextVersion = Format-Version -Major $current.Major -Minor ($current.Minor + 1) -Patch 0
        }
        default {
            $nextVersion = Format-Version -Major $current.Major -Minor $current.Minor -Patch ($current.Patch + 1)
        }
    }

    [pscustomobject]@{
        currentVersion = $currentVersion
        currentTag = if ($source -eq 'tag') { "v$currentVersion" } else { $null }
        nextVersion = $nextVersion
        nextTag = "v$nextVersion"
        source = $source
        bumpType = $BumpType
        warnings = $warnings
    } | ConvertTo-Json -Depth 3
}
finally {
    Pop-Location
}
