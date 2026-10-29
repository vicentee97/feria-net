@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title FeriaNet - Punto de entrada

REM ============================================================
REM  dev.bat - Punto de entrada interactivo para FeriaNet
REM  Plataforma: Windows-first.
REM  Stack: Tauri 2.x (Rust) + React 19 + Vite + Tailwind v4
REM         + shadcn/ui + SQLite (rusqlite directo)
REM  Convenciones:
REM    - Prefijos: [INFO] [OK] [WARN] [ERROR]
REM    - Confirmaciones obligatorias antes de borrar / matar procesos
REM    - Sin emojis. Sin credenciales hardcoded.
REM    - Encoding UTF-8 sin BOM, saltos CRLF.
REM ============================================================

set "PROJECT_NAME=FeriaNet"
set "PROJECT_ROOT=%~dp0"
set "DEV_PORT=1420"
set "PKG_MANAGER=npm"
set "RUNTIME=Tauri 2.x + React 19 + Vite"

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

:print_info
echo [INFO] %~1
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
set "PKG_MANAGER=npm"
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

:require_rust
where cargo >nul 2>&1
if errorlevel 1 (
    call :print_error "Rust/cargo no esta en PATH. Instala rustup desde https://rustup.rs y luego ejecuta: rustup default stable-x86_64-pc-windows-msvc"
    exit /b 1
)
goto :eof

:diagnose
call :print_section "Diagnostico del entorno"
echo.
echo Proyecto:    %PROJECT_NAME%
echo Raiz:        %PROJECT_ROOT%
echo Stack:       Tauri 2.x + React 19 + Vite + Tailwind v4 + shadcn/ui + SQLite + Supabase (sync)
echo Gestor:      %PKG_MANAGER%
echo Puerto dev:  %DEV_PORT%
echo.
where node >nul 2>&1 && (echo [OK]    Node:        && node --version) || echo [WARN]  Node:        no detectado
where npm  >nul 2>&1 && (echo [OK]    npm:         && npm --version)  || echo [WARN]  npm:         no detectado
where cargo >nul 2>&1 && (echo [OK]    Rust/cargo:  && cargo --version) || echo [WARN]  Rust/cargo:  no detectado
where rustc >nul 2>&1 && (echo [OK]    rustc:       && rustc --version) || echo [WARN]  rustc:       no detectado
echo.
if exist "%PROJECT_ROOT%package.json"       (echo [OK]    package.json:        presente)        else (echo [WARN]  package.json:        ausente)
if exist "%PROJECT_ROOT%node_modules\"      (echo [OK]    node_modules:        presente)        else (echo [WARN]  node_modules:        ausente)
if exist "%PROJECT_ROOT%src-tauri\Cargo.toml" (echo [OK]    src-tauri/Cargo.toml: presente)       else (echo [WARN]  src-tauri/Cargo.toml: ausente)
if exist "%PROJECT_ROOT%src-tauri\.cargo\config.toml" (echo [OK]    src-tauri/.cargo/config.toml: presente) else (echo [WARN]  src-tauri/.cargo/config.toml: ausente)
if exist "%PROJECT_ROOT%src-tauri\target"   (echo [OK]    src-tauri/target:    presente (compilacion previa)) else (echo [INFO]  src-tauri/target:    ausente (primera compilacion ~3-5 min))
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
start "" "%PROJECT_ROOT%docs\data-model.md"
call :print_ok "Abiertos README y docs clave con la aplicacion por defecto."
goto :eof

:action_dev_app
call :require_node
call :require_rust
call :print_section "Arrancando FeriaNet (Vite + Tauri)"
echo [INFO] Equivalente a: npm run tauri dev
echo [INFO] Vite servira el frontend en http://localhost:%DEV_PORT%
echo [INFO] Tauri abrira la ventana nativa cuando termine la compilacion inicial.
echo [INFO] Primera compilacion puede tardar 3-5 min; las siguientes, segundos.
echo [INFO] Pulsa Ctrl+C en esta ventana para detener el dev server.
echo.
call :check_port %DEV_PORT%
if defined PORT_PID (
    call :print_warn "Puerto %DEV_PORT% ocupado por PID %PORT_PID%. Terminando..."
    taskkill /PID %PORT_PID% /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)
pushd "%PROJECT_ROOT%"
call npm run tauri dev
popd
goto :eof

:action_dev_frontend
call :require_node
call :print_section "Arrancando solo el frontend Vite (sin ventana Tauri)"
echo [INFO] Equivalente a: npm run dev
echo [INFO] Util para iterar UI sin recompilar Rust. Abre http://localhost:%DEV_PORT%.
echo [INFO] Pulsa Ctrl+C para detener.
echo.
call :check_port %DEV_PORT%
if defined PORT_PID (
    call :print_warn "Puerto %DEV_PORT% ocupado por PID %PORT_PID%. Terminando..."
    taskkill /PID %PORT_PID% /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)
pushd "%PROJECT_ROOT%"
call npm run dev
popd
goto :eof

:action_cargo_check
call :require_rust
call :print_section "cargo check (validacion Rust sin link completo)"
pushd "%PROJECT_ROOT%src-tauri"
call cargo check
set "CARGO_EXIT=%errorlevel%"
popd
if %CARGO_EXIT%==0 (
    call :print_ok "cargo check paso sin errores."
) else (
    call :print_error "cargo check fallo con codigo %CARGO_EXIT%."
)
pause
goto :eof

:action_install_deps
call :require_node
call :print_section "Instalando dependencias npm"
echo [INFO] Equivalente a: npm install
echo.
pushd "%PROJECT_ROOT%"
call npm install
popd
call :print_ok "Dependencias instaladas."
pause
goto :eof

:action_build
call :require_node
call :require_rust
call :print_section "Build de produccion"
echo [INFO] 1. npm run build     (TypeScript + Vite, genera dist/)
echo [INFO] 2. npm run tauri build (Rust release + bundle MSI/EXE)
echo.
pushd "%PROJECT_ROOT%"
call npm run build
if errorlevel 1 (
    call :print_error "npm run build fallo."
    popd
    pause
    goto :eof
)
call :print_ok "Frontend construido en dist/."
call npm run tauri build
set "TAURI_EXIT=%errorlevel%"
popd
if %TAURI_EXIT%==0 (
    call :print_ok "Bundle de Tauri generado en src-tauri\target\release\bundle\."
) else (
    call :print_error "tauri build fallo con codigo %TAURI_EXIT%."
)
pause
goto :eof

:action_validate
call :print_section "Validacion proporcional"
call :print_warn "Sin paquete de tests aun. Validacion minima disponible:"
echo.
echo --- Documentos canonicos ---
if exist "%PROJECT_ROOT%docs\SSOT.md"        (echo [OK]    docs/SSOT.md presente)        else (echo [ERROR]  docs/SSOT.md ausente)
if exist "%PROJECT_ROOT%docs\TODO.md"         (echo [OK]    docs/TODO.md presente)         else (echo [ERROR]  docs/TODO.md ausente)
if exist "%PROJECT_ROOT%docs\ARCHITECTURE.md" (echo [OK]    docs/ARCHITECTURE.md presente) else (echo [ERROR]  docs/ARCHITECTURE.md ausente)
if exist "%PROJECT_ROOT%docs\data-model.md"   (echo [OK]    docs/data-model.md presente)   else (echo [ERROR]  docs/data-model.md ausente)
if exist "%PROJECT_ROOT%docs\REGLAS_PROYECTO.md" (echo [OK]    docs/REGLAS_PROYECTO.md presente) else (echo [ERROR]  docs/REGLAS_PROYECTO.md ausente)
if exist "%PROJECT_ROOT%README.md"            (echo [OK]    README.md presente)            else (echo [ERROR]  README.md ausente)
if exist "%PROJECT_ROOT%.gitignore"           (echo [OK]    .gitignore presente)           else (echo [ERROR]  .gitignore ausente)
if exist "%PROJECT_ROOT%.git"                 (echo [OK]    Repositorio git inicializado)  else (echo [ERROR]  Sin .git/)
echo.
echo --- Estructura del stack ---
if exist "%PROJECT_ROOT%package.json"        (echo [OK]    package.json presente)         else (echo [ERROR]  package.json ausente)
if exist "%PROJECT_ROOT%tsconfig.json"       (echo [OK]    tsconfig.json presente)        else (echo [ERROR]  tsconfig.json ausente)
if exist "%PROJECT_ROOT%vite.config.ts"      (echo [OK]    vite.config.ts presente)       else (echo [ERROR]  vite.config.ts ausente)
if exist "%PROJECT_ROOT%src-tauri\Cargo.toml" (echo [OK]    src-tauri/Cargo.toml presente) else (echo [ERROR]  src-tauri/Cargo.toml ausente)
if exist "%PROJECT_ROOT%src-tauri\tauri.conf.json" (echo [OK]    src-tauri/tauri.conf.json presente) else (echo [ERROR]  src-tauri/tauri.conf.json ausente)
if exist "%PROJECT_ROOT%components.json"     (echo [OK]    components.json (shadcn) presente) else (echo [WARN]  components.json ausente)
echo.
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
echo   Stack: Tauri 2.x + React 19 + Vite + Tailwind v4 + shadcn/ui + SQLite
echo   Puerto dev: %DEV_PORT% ^| Gestor: %PKG_MANAGER%
echo ============================================================
echo.
echo   1 - Abrir documentacion canonica
echo   2 - Arrancar app (npm run tauri dev)
echo   3 - Solo frontend Vite (sin ventana Tauri)
echo   4 - Detener dev server del puerto %DEV_PORT%
echo   5 - Instalar / reinstalar deps (npm install)
echo   6 - cargo check (validacion Rust)
echo   7 - Build de produccion (npm run tauri build)
echo   8 - Validacion proporcional
echo   9 - Diagnostico del entorno
echo  10 - Limpiar temporales del hub y artefactos locales
echo   0 - Salir
echo.
set "OPT="
set /p "OPT=Selecciona opcion: "
if "%OPT%"=="1"  goto :action_open_docs
if "%OPT%"=="2"  goto :action_dev_app
if "%OPT%"=="3"  goto :action_dev_frontend
if "%OPT%"=="4"  goto :action_stop_dev
if "%OPT%"=="5"  goto :action_install_deps
if "%OPT%"=="6"  goto :action_cargo_check
if "%OPT%"=="7"  goto :action_build
if "%OPT%"=="8"  goto :action_validate
if "%OPT%"=="9"  call :diagnose
if "%OPT%"=="10" goto :action_clean
if "%OPT%"=="0"  goto :exit_clean
echo [WARN] Opcion no valida: "%OPT%"
timeout /t 2 /nobreak >nul
goto :menu

:exit_clean
call :print_ok "Saliendo."
endlocal
exit /b 0
