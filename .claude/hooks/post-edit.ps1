[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$input_json = [Console]::In.ReadToEnd() | ConvertFrom-Json
$filePath = $input_json.tool_input.file_path

if ($filePath -match '\.(ts|tsx)$') {
  $msg = "Dashboard file edited - codebase-memory-mcp index may need a refresh if this touches call structure."
} elseif ($filePath -match 'Wiki[\\/]') {
  $msg = "Wiki page edited directly - confirm index.md and log.md are updated to match, per the promotion rule."
} else {
  exit 0
}

$output = [ordered]@{
  hookSpecificOutput = [ordered]@{
    hookEventName = "PostToolUse"
    additionalContext = $msg
  }
}

$output | ConvertTo-Json -Depth 10 -Compress