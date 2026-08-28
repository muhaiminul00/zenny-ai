[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$callInput = [Console]::In.ReadToEnd() | ConvertFrom-Json
$command = $callInput.tool_input.command

$inVenv = $command -match '\.zenny-py-venv' -or $command -match 'zenny-py-venv\\Scripts'

if ($inVenv) {
    exit 0
}

$output = [ordered]@{
  hookSpecificOutput = [ordered]@{
    hookEventName = "PreToolUse"
    permissionDecision = "ask"
    permissionDecisionReason = "Standing rule: Python installs go in .zenny-py-venv. '.claude' or claude's local/gloabl settings/config out of these rule. If this package genuinely cannot work in the local venv, or forcing it there costs more tokens than it's worth, proceed with global install - but log a 1-2 line reason in your response summary AND append an entry to Wiki/log.md (## [date] pip-global | package | reason)."
  }
}

$output | ConvertTo-Json -Depth 10 -Compress