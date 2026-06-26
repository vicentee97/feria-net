<#
.SYNOPSIS
    Prepara y crea un repositorio en GitHub para el proyecto actual.
.DESCRIPTION
    Verifica git, GitHub CLI, autenticacion, estado local y remoto antes de crear
    el repositorio. Por defecto no sobrescribe origin, no crea commits y no hace
    push inicial salvo que se pidan esos pasos con switches explicitos.
.PARAMETER RepoName
    Nombre del repositorio. Por defecto es el nombre de la carpeta actual.
.PARAMETER Owner
    Usuario u organizacion de GitHub. Si se omite, gh usa el owner autenticado.
.PARAMETER Visibility
    Visibilidad del repositorio: public, private o internal.
.PARAMETER RemoteProtocol
    Protocolo preferido para el remoto: https o ssh.
.PARAMETER Description
    Descripcion opcional del repositorio.
.PARAMETER CreateInitialCommit
    Crea un commit inicial si el repositorio local no tiene historial.
.PARAMETER Push
    Hace push inicial al remoto despues de crear el repositorio.
.PARAMETER OverwriteOrigin
    Reemplaza origin si ya existe. Sin este switch, el script se detiene.
.PARAMETER DryRun
    Muestra el plan sin ejecutar cambios.
#>

param (
    [string]$RepoName = (Get-Item .).Name,
    [string]$Owner,
    [ValidateSet('public', 'private', 'internal')]
    [string]$Visibility = 'private',
    [ValidateSet('https', 'ssh')]
    [string]$RemoteProtocol = 'https',
    [string]$Description,
    [switch]$CreateInitialCommit,
    [switch]$Push,
    [switch]$OverwriteOrigin,
    [switch]$DryRun
)

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Invoke-Checked {
    param(
        [string]$Label,
        [string[]]$Command
    )

    Write-Step $Label
    if ($DryRun) {
        Write-Host ("DRY-RUN: " + ($Command -join ' ')) -ForegroundColor DarkGray
        return
    }

    $exe = $Command[0]
    $args = $Command[1..($Command.Length - 1)]
    & $exe @args
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo ejecutando: $($Command -join ' ')"
    }
}

Process {
    try {
        Write-Step "--- Preparando repositorio GitHub ---"

        if (!(Get-Command git -ErrorAction SilentlyContinue)) {
            throw "Git no esta instalado. Instala Git desde https://git-scm.com/"
        }

        if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
            throw "GitHub CLI (gh) no esta instalado. Instala con: winget install Microsoft.GitHubCLI"
        }

        gh auth status *> $null
        if ($LASTEXITCODE -ne 0) {
            throw "No hay sesion activa en GitHub CLI. Ejecuta: gh auth login"
        }

        $repoFullName = if ([string]::IsNullOrWhiteSpace($Owner)) { $RepoName } else { "$Owner/$RepoName" }

        Write-Host "Repo: $repoFullName"
        Write-Host "Visibilidad: $Visibility"
        Write-Host "Protocolo remoto: $RemoteProtocol"
        Write-Host "Crear commit inicial: $($CreateInitialCommit.IsPresent)"
        Write-Host "Push inicial: $($Push.IsPresent)"

        if (!(Test-Path .git)) {
            Invoke-Checked "Inicializando git local..." @('git', 'init')
            Invoke-Checked "Configurando rama main..." @('git', 'branch', '-M', 'main')
        }

        $remotes = git remote
        if ($remotes -contains 'origin') {
            $remoteUrl = git remote get-url origin
            if (!$OverwriteOrigin) {
                throw "Ya existe origin ($remoteUrl). Revisa si corresponde usarlo o relanza con -OverwriteOrigin."
            }
            Invoke-Checked "Eliminando origin existente..." @('git', 'remote', 'remove', 'origin')
        }

        gh repo view $repoFullName *> $null
        if ($LASTEXITCODE -eq 0) {
            throw "Ya existe un repositorio remoto '$repoFullName'. Revisa si debes enlazarlo en vez de crearlo."
        }

        $hasCommits = $false
        git rev-parse --verify HEAD *> $null
        if ($LASTEXITCODE -eq 0) {
            $hasCommits = $true
        }

        if (!$hasCommits -and $CreateInitialCommit) {
            if ($env:OS -eq 'Windows_NT') {
                Invoke-Checked "Configurando core.autocrlf..." @('git', 'config', 'core.autocrlf', 'true')
            }
            Invoke-Checked "Preparando primer snapshot..." @('git', 'add', '.')
            Invoke-Checked "Creando commit inicial..." @('git', 'commit', '-m', 'chore: commit inicial')
        } elseif (!$hasCommits) {
            Write-Host "No hay commits locales. El repo remoto puede crearse, pero no habra push inicial sin -CreateInitialCommit." -ForegroundColor Yellow
        }

        $createArgs = @('gh', 'repo', 'create', $repoFullName, "--$Visibility", '--source=.', '--remote=origin')
        if ($Description) {
            $createArgs += @('--description', $Description)
        }

        Invoke-Checked "Creando repositorio remoto..." $createArgs

        if ($RemoteProtocol -eq 'ssh') {
            Invoke-Checked "Cambiando origin a SSH..." @('gh', 'repo', 'set-default', $repoFullName)
            $sshUrl = "git@github.com:$repoFullName.git"
            Invoke-Checked "Aplicando URL SSH a origin..." @('git', 'remote', 'set-url', 'origin', $sshUrl)
        }

        if ($Push) {
            $currentBranch = git branch --show-current
            if ([string]::IsNullOrWhiteSpace($currentBranch)) {
                $currentBranch = 'main'
            }
            Invoke-Checked "Haciendo push inicial..." @('git', 'push', '-u', 'origin', $currentBranch)
        } else {
            Write-Host "Repositorio creado/enlazado. Push inicial omitido porque no se paso -Push." -ForegroundColor Green
        }
    } catch {
        Write-Error $_.Exception.Message
        exit 1
    }
}
