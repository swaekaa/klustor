# ============================================================
#   KLUSTOR // THE FIXER + KRPO - PowerShell Commit Script
# ============================================================

$RootPath = $PSScriptRoot

Write-Host "`n[1/2] Staging and committing KRPO sub-repository..." -ForegroundColor Cyan
Set-Location -Path "$RootPath\KRPO"
git add -A
git commit -m "feat(krpo): 10/10 car design, boost physics, monotonic optimizer, leaderboard store and test suite"

Write-Host "`n[2/2] Staging and committing KLUSTOR root repository..." -ForegroundColor Cyan
Set-Location -Path $RootPath
git add src/game/data/krpoLeaderboardStore.ts src/game/data/krpoAuthoritativeDesign.ts src/game/data/krpoLiveLearning.ts src/game/data/krpoReplayStore.ts src/pages/LeaderboardPage.tsx src/game/components/ReplayHUD.tsx src/pages/ReplayPage.tsx KRPO
git commit -m "feat(leaderboard): add live KRPO optimizer tab, boost telemetry, and 10/10 design integration"

Write-Host "`nCommit completed successfully for both repositories!" -ForegroundColor Green
