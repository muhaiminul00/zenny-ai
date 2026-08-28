# .claude/hooks/prompt-routing.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$output = [ordered]@{
  hookSpecificOutput = [ordered]@{
    hookEventName = "UserPromptSubmit"
    additionalContext = "Before manual grep/bash: check CLAUDE.md's Tool Routing Table - a matching MCP/skill/bundle likely already covers this."
  }
}

$output | ConvertTo-Json -Depth 10 -Compress