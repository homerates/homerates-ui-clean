$ErrorActionPreference="Stop"
$files = "vercel.json","package.json"
foreach($f in $files){
  if(-not (Test-Path $f)){ throw "Missing file: $f" }
  (Get-Content $f -Raw | ConvertFrom-Json) | Out-Null
}
Write-Host "JSON OK for: $($files -join ', ')"
