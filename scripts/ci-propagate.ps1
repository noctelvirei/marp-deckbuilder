<#
.SYNOPSIS
  CI engine propagation: push the freshly-built renderer engine into the four
  Lightico forks via an auto-completing PR, gated by safety-net builds.

.DESCRIPTION
  Runs in the marp-deckbuilder pipeline after `npm run bundle:skill`. It:
    1. Copies the new tool/dist into each fork in claude-custom-skills.
    2. SAFETY NETS: rebuilds a deck fork and a report fork with the new engine;
       both must produce HTML or the PR is left open for manual review.
    3. Commits to a branch, pushes, and opens a PR to main.
       - safety nets pass -> PR is set to auto-complete (merges itself).
       - safety nets fail -> PR opened WITHOUT auto-complete; pipeline fails.
  The merge to claude-custom-skills/main then triggers the plugin build pipeline.

  Auth uses the pipeline's System.AccessToken (passed as env SYSTEM_ACCESSTOKEN);
  the checked-out forks repo must have persistCredentials: true for the git push.
#>
param(
  [Parameter(Mandatory)][string]$ForksRepo,    # checked-out claude-custom-skills
  [Parameter(Mandatory)][string]$EngineDist,   # freshly built skills/marp-deckbuilder/tool/dist
  [string]$Org = 'https://dev.azure.com/Vizolution',
  [string]$Project = 'DBA',
  [string]$Repo = 'claude-custom-skills'
)
$ErrorActionPreference = 'Stop'
$forks = @('lightico-present', 'lightico-deck-builder-new', 'lightico-report-viz', 'lightico-report-dcp')
$skills = Join-Path $ForksRepo 'skills'

if (-not (Test-Path (Join-Path $EngineDist 'deckbuilder.mjs'))) { throw "Engine not found at $EngineDist" }

# --- 1. copy engine dist into each fork (full replace drops stale chunks) -----
foreach ($f in $forks) {
  $dst = Join-Path $skills "$f\tool\dist"
  if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
  Copy-Item $EngineDist $dst -Recurse -Force
}

# --- bail early if nothing actually changed ----------------------------------
git -C $ForksRepo add -- 'skills/*/tool/dist' | Out-Null
git -C $ForksRepo diff --cached --quiet
if ($LASTEXITCODE -eq 0) { Write-Host "Engine unchanged in forks; nothing to propagate."; exit 0 }

# --- 2. safety nets: a deck fork and a report fork must build with new engine -
function Test-ForkBuild([string]$name, [string]$script, [string[]]$extra) {
  $sk = Join-Path $skills $name
  $ex = Get-ChildItem (Join-Path $sk 'examples') -Filter *.md -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $ex) { throw "no example markdown in $name" }
  $tmp = Join-Path $env:TEMP "verify-$name-$([guid]::NewGuid().ToString('N'))"
  & node (Join-Path $sk "scripts\$script") $ex.FullName --out-dir $tmp @extra 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "$name build returned $LASTEXITCODE" }
  if (-not (Get-ChildItem $tmp -Filter *.html -ErrorAction SilentlyContinue)) { throw "$name produced no HTML" }
  Write-Host "  safety-net OK: $name"
}
$safe = $true; $reason = ''
try {
  Test-ForkBuild 'lightico-present'     'build-deck.mjs'   @('--output', 'html')
  Test-ForkBuild 'lightico-report-viz'  'build-report.mjs' @()
} catch { $safe = $false; $reason = $_.Exception.Message; Write-Warning "SAFETY NET FAILED: $reason" }

# --- 3. commit + push branch -------------------------------------------------
$branch = "auto/engine-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git -C $ForksRepo config user.email 'build@vizolution.local'
git -C $ForksRepo config user.name  'Engine Propagation (pipeline)'
git -C $ForksRepo checkout -b $branch
git -C $ForksRepo add -- 'skills/*/tool/dist'
git -C $ForksRepo commit -m "Auto: propagate renderer engine to all forks" | Out-Host
git -C $ForksRepo push origin $branch
if ($LASTEXITCODE -ne 0) { throw "git push failed (build service needs Contribute on $Repo)" }

# --- 4. open PR; auto-complete only if safety nets passed --------------------
$env:AZURE_DEVOPS_EXT_PAT = $env:SYSTEM_ACCESSTOKEN
$title = if ($safe) { 'Auto: renderer engine update (safety nets passed)' }
         else { "Auto: renderer engine update - NEEDS REVIEW ($reason)" }
$prArgs = @(
  'repos', 'pr', 'create',
  '--org', $Org, '--project', $Project, '--repository', $Repo,
  '--source-branch', $branch, '--target-branch', 'main',
  '--title', $title,
  '--description', "Automated engine propagation from marp-deckbuilder. Safety nets passed: $safe",
  '--squash', 'true', '--delete-source-branch', 'true',
  '--auto-complete', $safe.ToString().ToLower()
)
az @prArgs | Out-Host
if ($LASTEXITCODE -ne 0) { throw "az repos pr create failed" }

if (-not $safe) { throw "Safety nets failed - PR opened for manual review, not auto-completed." }
Write-Host "Engine propagated; PR opened with auto-complete."
