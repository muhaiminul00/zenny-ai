# .claude/hooks/enforce-venv.ps1
$callInput = [Console]::In.ReadToEnd() | ConvertFrom-Json
$command = $callInput.tool_input.command

if ($command -match 'pip install|pip uninstall' -and $command -notmatch '\.zenny-py-venv') {
  @{
    hookSpecificOutput = @{
      hookEventName = "PreToolUse"
      permissionDecision = "deny"
      permissionDecisionReason = "Blocked: pip must run inside .zenny-py-venv. Activate it first: .zenny-py-venv\Scripts\activate"
    }
  } | ConvertTo-Json -Compress
} else {
  exit 0
}