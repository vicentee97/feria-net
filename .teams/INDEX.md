# Teams — FeriaNet

Indice vivo de equipos de trabajo del proyecto. Convencion vigente:

- Estados: `activo` | `cerrado` | `bloqueado`.
- IDs `TEAM-NNN` correlativos asignados por `.teams/.counter`.
- Teams en curso viven en `.teams/active/`. Al cerrar, se mueven a `.teams/archive/`.
- Plantilla canonica: `.teams/TEAM_TEMPLATE.md`.

## Plantillas

| Recurso | Ruta |
|---|---|
| Plantilla de team | [`.teams/TEAM_TEMPLATE.md`](TEAM_TEMPLATE.md) |

## Teams activos

| ID | Nombre | Estado | Apertura |
|---|---|---|---|
| _vacio_ | — | — | — |

## Teams cerrados / archivados

| ID | Nombre | Estado | Apertura | Cierre |
|---|---|---|---|---|
| [TEAM-001](archive/TEAM-001-bootstrap-arranque.md) | Bootstrap de arranque del proyecto | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-002](archive/TEAM-002-configurar-github-primer-commit.md) | Configurar GitHub y primer commit | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-003](archive/TEAM-003-epica-1-backend.md) | Epica 1 backend + base frontend | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-004](archive/TEAM-004-epica-1-frontend.md) | Epica 1 frontend (UI ferias + atracciones) | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-005](archive/TEAM-005-epica-1-editions-backend.md) | Epica 1 backend de ediciones (FairEdition) | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-006](archive/TEAM-006-epica-1-editions-frontend.md) | Epica 1 frontend de ediciones (FairEdition UI) | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-007](archive/TEAM-007-r1-enforce-backend.md) | R1 enforcement: indice UNIQUE parcial para "una sola edicion active por feria" | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-008](archive/TEAM-008-epica-1-cleanup-p3.md) | Cleanup P3 post-epica 1 (unificacion toast + 7 hallazgos) | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-009](archive/TEAM-009-epica-2-backend.md) | Epica 2 backend: caja diaria + TPV (ofertas, ventas, infraestructura tickets desacoplada) | cerrado | 2026-06-26 | 2026-06-26 |
| [TEAM-010](archive/TEAM-010-epica-2-frontend.md) | Epica 2 frontend (TPV, cajas diarias, ofertas embebidas) | cerrado | 2026-06-27 | 2026-06-27 |
| [TEAM-011](archive/TEAM-011-p2-get-cash-session.md) | P2 get_cash_session — command Tauri para resolver el fan-out 4 niveles del frontend | cerrado | 2026-06-27 | 2026-06-27 |
| [TEAM-012](archive/TEAM-012-epica-3-delivery-backend.md) | Epica 3 backend: `ticket-delivery` intercambiable (trait + 3 impls + commands + tests de sustitucion) | cerrado | 2026-06-27 | 2026-06-27 |
| [TEAM-013](archive/TEAM-013-epica-3-delivery-frontend.md) | Epica 3 frontend: UI de impresion (auto-print best-effort, tickets pendientes con retry, indicador de salud del backend) | cerrado | 2026-06-27 | 2026-06-27 |
| [TEAM-014](archive/TEAM-014-fix-h1-and-cleanups.md) | Fix H1 (registry expone init_error) + execute_print helper + timeout 5s en ThermalPrinter | cerrado | 2026-06-28 | 2026-06-28 |
| [TEAM-015](archive/TEAM-015-delivery-warning-ui.md) | UI warning fallback delivery (cierra H1 frontend) | cerrado | 2026-06-28 | 2026-06-28 |
| [TEAM-016](archive/TEAM-016-epica-4-reports-backend.md) | Epica 4 backend: queries agregadas + 3 commands Tauri para informes (daily / feria / comparativa interanual) | cerrado | 2026-06-28 | 2026-06-28 |

Repositorio remoto: <https://github.com/vicentee97/feria-net>.
