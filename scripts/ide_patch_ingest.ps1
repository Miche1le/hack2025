param(
  [string]$RepoPath   = "C:\\Users\\Admin\\Downloads\\hack2025",
  [string]$PatchPath  = "C:\\hack project\\hack2025_news_aggregator\\patch.diff",
  [string]$BaseBranch = "dev"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Log([string]$Message) {
  Write-Host ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $Message)
}

if (-not (Test-Path -LiteralPath $PatchPath)) {
  Log "Patch file not found: $PatchPath"
  exit 0
}

if (-not (Test-Path -LiteralPath $RepoPath)) {
  throw "RepoPath does not exist: $RepoPath"
}

Push-Location $RepoPath
try {
  git fetch origin | Out-Null
  git checkout $BaseBranch 2>$null | Out-Null
  git pull 2>$null | Out-Null

  $stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
  $branch = "ide/ui-$stamp"
  git checkout -b $branch 2>$null | Out-Null
  Log "Created branch $branch"

  $applied = $true
  try {
    git apply --ignore-whitespace --whitespace=fix "$PatchPath"
  } catch {
    Log "git apply failed, retrying with --reject"
    $applied = $false
  }

  if (-not $applied) {
    git apply --reject --ignore-whitespace --whitespace=fix "$PatchPath"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to apply patch. Check *.rej files inside $RepoPath"
    }
  }

  git add -A
  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Log "Patch did not produce changes. Cleaning up."
    git checkout $BaseBranch 2>$null | Out-Null
    git branch -D $branch 2>$null | Out-Null
  } else {
    git commit -m "feat(ui): apply IDE patch ($stamp)" | Out-Null
    git push -u origin $branch | Out-Null
    Log "Pushed branch $branch"

    if (Get-Command gh -ErrorAction SilentlyContinue) {
      try {
        $prUrl = gh pr create --base $BaseBranch --head $branch --title "UI patch $stamp" --body "Automated ingestion of IDE patch." | Select-Object -Last 1
        if ($LASTEXITCODE -eq 0 -and $prUrl) {
          Log "Opened PR $prUrl"
          try {
            gh pr merge $prUrl --auto --merge | Out-Null
            Log "Enabled auto-merge for $prUrl"
          } catch {
            Log "Auto-merge could not be enabled (checks or permissions missing)."
          }
        } else {
          Log "gh pr create returned no URL."
        }
      } catch {
        Log "gh pr create failed: $($_.Exception.Message)"
      }
    } else {
      Log "GitHub CLI (gh) not available. Please open PR for $branch manually."
    }
  }
}
finally {
  Pop-Location
  try { Remove-Item -LiteralPath $PatchPath -ErrorAction SilentlyContinue } catch {}
  Log "Finished."
}
