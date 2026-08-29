[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$input_json = [Console]::In.ReadToEnd() | ConvertFrom-Json
$filePath = $input_json.tool_input.file_path

if ($filePath -match '\.(ts|tsx)$') {
  $msg = "Dashboard file edited - codebase-memory-mcp index may need a refresh if this touches call structure."
} elseif ($filePath -match 'Wiki[\\/]') {
  $msg = "Wiki page edited directly - confirm index.md and log.md are updated to match, per the promotion rule."
} elseif ($filePath -match '\.claude[\\/]skills[\\/]gstack[\\/]' -or $filePath -match 'document-release|document-generate') {
  $msg = "gstack skill/doc-output file touched - reminder: Zenny's Wiki is the memory system for project knowledge, never GBrain/context-save/learn. Repo-technical docs (README/inline) from /document-release are fine as-is."
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