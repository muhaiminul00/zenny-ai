[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$stateFile = "$PSScriptRoot\state\mode.json"
$mode = "advisor"
$effort = "low"

if (Test-Path $stateFile) {
    try {
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json
        if ($state.mode) { $mode = $state.mode }
        if ($state.effort) { $effort = $state.effort }
    } catch { }
} else {
    New-Item -ItemType Directory -Force -Path "$PSScriptRoot\state" | Out-Null
    @{ mode = $mode; effort = $effort } | ConvertTo-Json | Set-Content $stateFile -Encoding utf8NoBOM
}

$modeInstruction = switch ($mode) {
    "commander" { "MODE: /commander (persisted). Effort: MEDIUM. Follow Commander instructions from Claude_Build_Command_Protocol_v2.md - plan, generate Build Cards, may execute directly only for simple/read-only/non-destructive/no-infra-impact actions. Do not generate a new Build Card while an unresolved conflict is flagged." }
    "execute"   { "MODE: /execute (persisted). Effort: MEDIUM. Follow Executor instructions - full build authority, existing orchestration power within Build Card scope." }
    default     { "MODE: /advisor (persisted/default). Effort: LOW. Answer at reduced effort, advisory only - no build actions, no Build Cards." }
}

$context = "$modeInstruction`n`nRead PROJECT_STATE.md and Wiki/index.md before starting work. Tool Routing Table is in CLAUDE.md - check it before manual grep/bash search. Python installs go in .zenny-py-venv only, except where pip-guard.ps1 logged an approved global-install exception."

$output = [ordered]@{
  hookSpecificOutput = [ordered]@{
    hookEventName = "SessionStart"
    additionalContext = $context
  }
}

$output | ConvertTo-Json -Depth 10 -Compress