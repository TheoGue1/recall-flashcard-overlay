# Creates the public GitHub repo and pushes (run once after: gh auth login)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    $localGh = Join-Path $Root ".tools\bin\gh.exe"
    if (Test-Path $localGh) { $gh = $localGh } else {
        Write-Host "Install GitHub CLI: https://cli.github.com/ or re-run setup to download .tools/bin/gh.exe"
        exit 1
    }
} else { $gh = $gh.Source }

& $gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Log in first: gh auth login"
    & $gh auth login
}

$repo = "recall-flashcard-overlay"
$owner = "TheoGue1"
$exists = & $gh repo view "$owner/$repo" 2>$null
if ($LASTEXITCODE -ne 0) {
    & $gh repo create "$owner/$repo" --public --source=. --remote=origin --description "Windows overlay flashcard app with spaced repetition (Anki-style SM-2)" --push
} else {
    git remote set-url origin "https://github.com/$owner/$repo.git"
    git push -u origin main
}
Write-Host "Done: https://github.com/$owner/$repo"
