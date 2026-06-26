# Bootstrap para OpenCode

Este archivo forma parte del arranque multi-IDE gestionado por `CerebroOperativoIA`.

**Preflight proporcional**
1. Clasifica el trabajo: `ligero` (solo consulta), `normal` (edita algo acotado) o `alto` (estructura, seguridad, publicacion u operaciones sensibles).
2. Si el trabajo es `normal` o `alto`, resuelve la ubicacion del hub `CerebroOperativoIA` leyendo: `.cerebro-operativo/hub-path.txt` (o busca rutas cercanas si falla).
3. Lee `docs/AI_GLOBAL_RULES.md` dentro de la ruta resuelta del hub cuando el trabajo dependa del hub o vaya a editar archivos.
4. Lee `docs/SSOT.md` del proyecto actual y la documentacion relevante.
5. Si vas a editar archivos, reconstruye contexto leyendo `.teams/`, `.questions/` y validaciones reales antes de implementar.
6. Si `.teams/` contiene plantilla antigua, teams planos, estados legacy o campos retirados como `Responsable`, tratalo como legado local. Para teams nuevos manda el contrato actual del hub: `.teams/active/`, `.teams/archive/`, `.teams/.counter`, `.teams/INDEX.md` y estados `activo|cerrado|bloqueado`. No normalices historico salvo que bloquee trabajo actual.
7. Si este IDE soporta skills locales, usa rigurosamente las enlazadas en:
   `.opencode/skills`

No dupliques reglas largas aqui. El contenido real vive en el hub.