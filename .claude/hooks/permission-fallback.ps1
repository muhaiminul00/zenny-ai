[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$callInput = [Console]::In.ReadToEnd() | ConvertFrom-Json
$toolName = $callInput.tool_name
$logFile = "$PSScriptRoot\..\..\Wiki\log.md"
$date = Get-Date -Format "yyyy-MM-dd"

$entry = "`n## [$date] permission-denied | $toolName`nDenied - check for alternative before escalating.`n"
Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue

$reason = "Permission denied for $toolName. Follow this sequence: 1) Check if an easy, equivalent alternative exists and try it. 2) If an alternative succeeds: note it in PROJECT_STATE.md/Wiki (use X not $toolName going forward) and continue. 3) If no alternative exists, determine whether this action is ESSENTIAL to completing the current task - if essential: stop, explain what's blocked and why, and ask the human to grant/allowlist the permission. If NOT essential (e.g. a git commit that doesn't block the actual task): do NOT stop - continue the task, and flag this as a pending action for the human at the END of your response summary."

$output = [ordered]@{
  hookSpecificOutput = [ordered]@{
    hookEventName = "PermissionDenied"
    retry = $true
    additionalContext = $reason
  }
}

$output | ConvertTo-Json -Depth 10 -Compress