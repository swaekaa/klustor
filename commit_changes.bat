@echo off
echo ============================================================
echo   KLUSTOR // THE FIXER + KRPO - Committing All Changes
echo ============================================================

REM 1. Commit nested KRPO repository
echo.
echo [1/2] Staging and committing KRPO sub-repository...
cd /d "%~dp0KRPO"
git add -A
git commit -m "feat(krpo): 10/10 car design, boost physics, monotonic optimizer, leaderboard store and test suite"

REM 2. Commit parent KLUSTOR repository
echo.
echo [2/2] Staging and committing KLUSTOR root repository...
cd /d "%~dp0"
git add src/game/data/krpoLeaderboardStore.ts src/game/data/krpoAuthoritativeDesign.ts src/game/data/krpoLiveLearning.ts src/game/data/krpoReplayStore.ts src/pages/LeaderboardPage.tsx src/game/components/ReplayHUD.tsx src/pages/ReplayPage.tsx KRPO
git commit -m "feat(leaderboard): add live KRPO optimizer tab, boost telemetry, and 10/10 design integration"

echo.
echo ============================================================
echo   Commit completed successfully for both repositories!
echo ============================================================
pause
