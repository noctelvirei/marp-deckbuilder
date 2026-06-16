<#
.SYNOPSIS
  Propagate the compiled renderer engine (tool/dist) to every consumer, then
  rebuild the Lightico-Reporting plugin. One command so nothing is forgotten.

.DESCRIPTION
  Run this after the engine bundle changes (a fresh `npm run bundle:skill`, or a
  pulled upstream that ships a new tool/dist). It fans the SAME byte-identical
  engine out to three fork shapes:

    1. claude-custom-skills forks (4)  - self-contained copies (canonical source)
    2. installed skills in ~/.claude   - self-contained copies (what you run locally)
    3. Lightico-Reporting plugin       - DE-DUPED: rebuilt from the forks, so its
                                         single _shared/dist picks up the new engine

  It does NOT touch tool/resources anywhere - brand assets are the forks' own
  source of truth. It does NOT commit; review and commit per repo afterwards.

    pwsh -File scripts\propagate-bundle.ps1
    pwsh -File scripts\propagate-bundle.ps1 -SkipInstalled   # forks + plugin only
#>
param([switch]$SkipInstalled, [switch]$SkipPlugin)
$ErrorActionPreference = 'Stop'

$distSrc      = Join-Path $PSScriptRoot '..\skills\marp-deckbuilder\tool\dist' | Resolve-Path | Select-Object -ExpandProperty Path
$forksRoot    = 'C:\GIT\claude-custom-skills\skills'
$installedRoot = Join-Path $env:USERPROFILE '.claude\skills'
$pluginBuild  = 'C:\GIT\Lightico-Reporting\build-plugin.ps1'
$forks        = @('lightico-present', 'lightico-deck-builder-new', 'lightico-report-viz', 'lightico-report-dcp')

if (-not (Test-Path (Join-Path $distSrc 'deckbuilder.mjs'))) {
  throw "Engine not found at $distSrc - run the WSL bundle build first (see CLAUDE.md)."
}

$touched = New-Object System.Collections.Generic.List[object]
function Sync-Dist([string]$root, [string]$label) {
  foreach ($f in $forks) {
    $dst = Join-Path $root "$f\tool\dist"
    if (-not (Test-Path (Split-Path $dst -Parent))) {
      $touched.Add([pscustomobject]@{ Target = $label; Skill = $f; Result = 'SKIPPED (no tool/)' }); continue
    }
    if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }   # full replace drops stale content-hashed chunks
    Copy-Item $distSrc $dst -Recurse -Force
    $touched.Add([pscustomobject]@{ Target = $label; Skill = $f; Result = 'updated' })
  }
}

Write-Host "Engine source: $distSrc"
Write-Host ""

# 1. canonical forks
Sync-Dist $forksRoot 'claude-custom-skills'

# 2. installed skills
if (-not $SkipInstalled) { Sync-Dist $installedRoot '~/.claude/skills' }
else { Write-Host "Skipped installed ~/.claude/skills (-SkipInstalled)" }

# 3. plugin - rebuild from the now-updated forks (its _shared/dist gets the engine)
if (-not $SkipPlugin) {
  if (Test-Path $pluginBuild) {
    Write-Host ""
    Write-Host "Rebuilding Lightico-Reporting plugin..."
    pwsh -File $pluginBuild
    if ($LASTEXITCODE -ne 0) { throw "Plugin rebuild failed ($LASTEXITCODE)" }
    $touched.Add([pscustomobject]@{ Target = 'Lightico-Reporting'; Skill = '_shared/dist (+zip)'; Result = 'rebuilt' })
  } else {
    Write-Warning "Plugin build script not found: $pluginBuild"
  }
} else { Write-Host "Skipped plugin (-SkipPlugin)" }

Write-Host ""
Write-Host "=== propagation summary ==="
$touched | Format-Table -AutoSize | Out-String | Write-Host
Write-Host "Next: commit the forks in claude-custom-skills (integration workflow step 6),"
Write-Host "      commit the plugin repo, and re-upload Lightico-Reporting.zip to the org."
