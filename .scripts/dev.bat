@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title FeriaNet - Punto de entrada

REM ============================================================
REM  dev.bat - Punto de entrada interactivo para FeriaNet
REM  Plataforma: Windows-first.
REM  Stack objetivo: Tauri 2.x (Rust) + React 19 + Vite + shadcn/ui
REM  Estado del proyecto: bootstrap. Sin package.json todavia.
REM  Convenciones:
REM    - Prefijos: [INFO] [OK] [WARN] [ERROR]
REM    - Confirmaciones obligatorias antes de borrar / matar procesos
REM    - Sin emojis. Sin credenciales hardcoded.
REM ============================================================

set "PROJECT_NAME=FeriaNet"
set "PROJECT_ROOT=%~dp0"
set "DEV_PORT=1420"
set "PKG_MANAGER=n/a (pendiente de epica 1)"
set "RUNTIME=n/a (pendiente de epica 1)"

REM ============================================================
REM  Helpers canonicos
REM ============================================================

goto :menu

:print_section
echo [INFO] %~1
goto :eof

:print_ok
echo [OK] %~1
goto :eof

:print_warn
echo [WARN] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:ensure_project
if not exist "%PROJECT_ROOT%docs\SSOT.md" (
    call :print_error "No se encontro docs\SSOT.md. Ejecuta dev.bat desde la raiz del proyecto."
    exit /b 1
)
goto :eof

:check_port
set "PORT_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R "[: ]%~1[ ]" ^| findstr "LISTENING"') do (
    if not defined PORT_PID set "PORT_PID=%%P"
)
goto :eof

:confirm
set "CONFIRM_ANSWER="
choice /c SN /n /m "%~1"
set "CONFIRM_ANSWER=%errorlevel%"
goto :eof

:detect_package_manager
set "PKG_MANAGER=n/a"
where npm >nul 2>&1 && set "PKG_MANAGER=npm"
where pnpm >nul 2>&1 && set "PKG_MANAGER=pnpm"
where yarn >nul 2>&1 && set "PKG_MANAGER=yarn"
where bun  >nul 2>&1 && set "PKG_MANAGER=bun"
goto :eof

:require_node
where node >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js no esta en PATH. Instala Node 20+ LTS antes de continuar."
    exit /b 1
)
goto :eof

:diagnose
call :print_section "Diagnostico del entorno"
echo.
echo Proyecto:    %PROJECT_NAME%
echo Raiz:        %PROJECT_ROOT%
echo Stack:       Tauri 2.x + React 19 + Vite + shadcn/ui + SQLite + Supabase (sync opcional)
echo Gestor:      %PKG_MANAGER%
echo Puerto dev:  %DEV_PORT%
echo.
where node >nul 2>&1 && (echo [OK]    Node:        && node --version) || echo [WARN]  Node:        no detectado
where npm  >nul 2>&1 && (echo [OK]    npm:         && npm --version)  || echo [WARN]  npm:         no detectado
where cargo >nul 2>&1 && (echo [OK]    Rust/cargo:  && cargo --version) || echo [WARN]  Rust/cargo:  no detectado
where rustc >nul 2>&1 && (echo [OK]    rustc:       && rustc --version) || echo [WARN]  rustc:       no detectado
echo.
if exist "%PROJECT_ROOT%package.json"       (echo [OK]    package.json:        presente)        else (echo [WARN]  package.json:        ausente (pendiente epica 1))
if exist "%PROJECT_ROOT%node_modules\"      (echo [OK]    node_modules:        presente)        else (echo [WARN]  node_modules:        ausente)
if exist "%PROJECT_ROOT%src-tauri\Cargo.toml" (echo [OK]    src-tauri/Cargo.toml: presente)       else (echo [WARN]  src-tauri/Cargo.toml: ausente (pendiente epica 1))
if exist "%PROJECT_ROOT%.env.local"         (echo [OK]    .env.local:          presente)        else (echo [INFO]  .env.local:          ausente)
if exist "%PROJECT_ROOT%.env.example"       (echo [OK]    .env.example:        presente)        else (echo [INFO]  .env.example:        ausente)
echo.
call :check_port %DEV_PORT%
if defined PORT_PID (
    echo [WARN]  Puerto %DEV_PORT%: OCUPADO por PID %PORT_PID%
) else (
    echo [OK]    Puerto %DEV_PORT%: LIBRE
)
echo.
goto :eof

REM ============================================================
REM  Acciones del menu
REM ============================================================

:action_open_docs
call :ensure_project
call :print_section "Abriendo documentacion canonica"
start "" "%PROJECT_ROOT%README.md"
start "" "%PROJECT_ROOT%docs\SSOT.md"
start "" "%PROJECT_ROOT%docs\TODO.md"
start "" "%PROJECT_ROOT%docs\ARCHITECTURE.md"
call :print_ok "Abiertos README y docs clave con la aplicacion por defecto."
goto :eof

:action_dev_server
call :print_warn "Aun no existe package.json. Pendiente de la epica 1."
echo [INFO] Cuando arranque la epica 1, esta opcion hara:
echo [INFO]   1. npm install
echo [INFO]   2. npm run tauri dev
echo [INFO]   3. Apertura automatica del navegador en http://localhost:%DEV_PORT%
pause
goto :eof

:action_install_deps
call :print_warn "Aun no hay package.json; pendiente de la epica 1."
echo [INFO] Cuando exista, esta opcion ejecutara `npm install` (o el gestor detectado).
pause
goto :eof

:action_build
call :print_warn "Aun no hay package.json; pendiente de la epica 1."
echo [INFO] Cuando exista, esta opcion ejecutara `npm run tauri build` para producir el instalador MSI/EXE.
pause
goto :eof

:action_validate
call :print_section "Validacion proporcional"
call :print_warn "Sin paquete de tests ni scripts aun. Validacion minima disponible:"
if exist "%PROJECT_ROOT%docs\SSOT.md"        (echo [OK]    docs/SSOT.md presente)        else (echo [ERROR]  docs/SSOT.md ausente)
if exist "%PROJECT_ROOT%docs\TODO.md"         (echo [OK]    docs/TODO.md presente)         else (echo [ERROR]  docs/TODO.md ausente)
if exist "%PROJECT_ROOT%docs\ARCHITECTURE.md" (echo [OK]    docs/ARCHITECTURE.md presente) else (echo [ERROR]  docs/ARCHITECTURE.md ausente)
if exist "%PROJECT_ROOT%docs\data-model.md"   (echo [OK]    docs/data-model.md presente)   else (echo [ERROR]  docs/data-model.md ausente)
if exist "%PROJECT_ROOT%README.md"            (echo [OK]    README.md presente)            else (echo [ERROR]  README.md ausente)
if exist "%PROJECT_ROOT%.gitignore"           (echo [OK]    .gitignore presente)           else (echo [ERROR]  .gitignore ausente)
if exist "%PROJECT_ROOT%.git"                 (echo [OK]    Repositorio git inicializado)  else (echo [ERROR]  Sin .git/)
pause
goto :eof

:action_clean
call :print_section "Limpieza de temporales del hub y artefactos locales"
echo.
echo [INFO] Esto eliminara (con confirmacion caso por caso):
echo [INFO]   - .ai-work/          (temporales del hub)
echo [INFO]   - .restore/          (stagings del orquestador)
echo [INFO]   - *.tmp, *.bak       (temporales sueltos en raiz)
echo [INFO]   - *.restore_*        (stagings sueltos en raiz)
echo [INFO]   - tickets-debug/     (salida del FileDelivery de depuracion)
echo [INFO] NO se tocara: node_modules/, src-tauri/target/, dist/, .git/, .env*
echo.

call :confirm "Eliminar .ai-work/? (S/N)"
if "%CONFIRM_ANSWER%"=="0" (
    if exist "%PROJECT_ROOT%.ai-work\" (
        rd /s /q "%PROJECT_ROOT%.ai-work" 2>nul
        call :print_ok ".ai-work/ eliminado."
    ) else (
        echo [INFO] .ai-work/ no existe, nada que hacer.
    )
)

call :confirm "Eliminar .restore/? (S/N)"
if "%CONFIRM_ANSWER%"=="0" (
    if exist "%PROJECT_ROOT%.restore\" (
        rd /s /q "%PROJECT_ROOT%.restore" 2>nul
        call :print_ok ".restore/ eliminado."
    ) else (
        echo [INFO] .restore/ no existe, nada que hacer.
    )
)

call :confirm "Eliminar *.tmp, *.bak, *.restore_* en raiz? (S/N)"
if "%CONFIRM_ANSWER%"=="0" (
    del /q "%PROJECT_ROOT%*.tmp" 2>nul
    del /q "%PROJECT_ROOT%*.bak" 2>nul
    del /q "%PROJECT_ROOT%*.restore_*" 2>nul
    call :print_ok "Temporales sueltos eliminados."
)

call :confirm "Eliminar tickets-debug/? (S/N)"
if "%CONFIRM_ANSWER%"=="0" (
    if exist "%PROJECT_ROOT%tickets-debug\" (
        rd /s /q "%PROJECT_ROOT%tickets-debug" 2>nul
        call :print_ok "tickets-debug/ eliminado."
    ) else (
        echo [INFO] tickets-debug/ no existe, nada que hacer.
    )
)

call :print_ok "Limpieza finalizada."
goto :eof

:action_stop_dev
call :check_port %DEV_PORT%
if not defined PORT_PID (
    call :print_info "Puerto %DEV_PORT% libre. Nada que detener."
) else (
    call :print_warn "Puerto %DEV_PORT% ocupado por PID %PORT_PID%."
    call :confirm "Terminar el PID %PORT_PID%? (S/N)"
    if "!CONFIRM_ANSWER!"=="0" (
        taskkill /PID %PORT_PID% /F
        call :print_ok "PID %PORT_PID% terminado."
    ) else (
        call :print_info "Cancelado por el usuario."
    )
)
pause
goto :eof

:print_info
echo [INFO] %~1
goto :eof

REM ============================================================
REM  Menu principal
REM ============================================================

:menu
cls
call :ensure_project
call :detect_package_manager
echo ============================================================
echo   %PROJECT_NAME% - Punto de entrada
echo ============================================================
echo   Stack: Tauri 2.x + React 19 + Vite + shadcn/ui + SQLite + Supabase (sync)
echo   Puerto dev: %DEV_PORT% ^| Gestor: %PKG_MANAGER%
echo ============================================================
echo.
echo   1 - Abrir documentacion canonica
echo   2 - Iniciar dev server              (placeholder - pendiente epica 1)
echo   3 - Compilar / Build                (placeholder - pendiente epica 1)
echo   4 - Detener dev server del puerto   (placeholder - pendiente epica 1)
echo   5 - Instalar / reinstalar deps      (placeholder - pendiente epica 1)
echo   6 - Validacion proporcional
echo   7 - Diagnostico del entorno
echo   8 - Limpiar temporales del hub y artefactos locales
echo   0 - Salir
echo.
set "OPT="
set /p "OPT=Selecciona opcion: "
if "%OPT%"=="1" goto :action_open_docs
if "%OPT%"=="2" goto :action_dev_server
if "%OPT%"=="3" goto :action_build
if "%OPT%"=="4" goto :action_stop_dev
if "%OPT%"=="5" goto :action_install_deps
if "%OPT%"=="6" goto :action_validate
if "%OPT%"=="7" call :diagnose
if "%OPT%"=="8" goto :action_clean
if "%OPT%"=="0" goto :exit_clean
echo [WARN] Opcion no valida: "%OPT%"
timeout /t 2 /nobreak >nul
goto :menu

:exit_clean
call :print_ok "Saliendo."
endlocal
exit /b 0
