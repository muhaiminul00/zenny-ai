$flowchartDirectory = Join-Path $PSScriptRoot "docs\Flowcharts"
$manifestPath = Join-Path $flowchartDirectory "manifest.json"

$files = Get-ChildItem -LiteralPath $flowchartDirectory -File |
  Where-Object { $_.Extension -in ".md", ".mmd" } |
  Sort-Object Name |
  Select-Object -ExpandProperty Name

$files | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8
Write-Host "Registered $($files.Count) Mermaid source files in $manifestPath"
