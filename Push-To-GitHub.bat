@echo off
title Push SquadDraft to GitHub
echo ========================================================
echo          SQUADDRAFT GITHUB REPOSITORY UPLOADER
echo ========================================================
echo.
echo 1. Go to https://github.com/new and create a new repository
echo    (Name it: squaddraft, and leave it empty)
echo 2. Copy the repository URL (e.g. https://github.com/USERNAME/squaddraft.git)
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "

if "%REPO_URL%"=="" (
    echo No URL entered. Exiting...
    pause
    exit /b
)

cd /d "C:\Users\arpit\.gemini\antigravity\scratch\squaddraft"
echo.
echo Linking repository to %REPO_URL%...
"C:\Users\arpit\MinGit\cmd\git.exe" remote remove origin 2>nul
"C:\Users\arpit\MinGit\cmd\git.exe" remote add origin %REPO_URL%
"C:\Users\arpit\MinGit\cmd\git.exe" branch -M main
echo Pushing project files to GitHub...
"C:\Users\arpit\MinGit\cmd\git.exe" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Your code is now live on GitHub.
    echo Now open https://render.com, click 'New +', choose 'Web Service',
    echo select this repository, and click 'Deploy'!
    echo ========================================================
) else (
    echo.
    echo If GitHub asked you to sign in, please complete the sign-in prompt.
)
echo.
pause
