# .claude/hooks/session-end.ps1
# Fast, fire-and-forget only - SessionEnd has a ~1.5s combined budget.
# No real work here (no Wiki regen, no lint pass) - just a plain-text
# reminder written to stderr for YOU to see, since SessionEnd has no
# Claude-visible decision control at all.
Write-Error "Session ended - remember: update PROJECT_STATE.md status lines, promote durable facts to Wiki/, do NOT append full narrative there. Still-open skill/plugin pruning candidates (kept for now, revisit when asked): neon, neon-postgres, skill-creator, andrej-karpathy-skills, playwright."
exit 0