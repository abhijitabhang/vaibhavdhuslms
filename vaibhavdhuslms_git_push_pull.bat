@echo off
REM Get the current PC name and timestamp
set PC_NAME=%COMPUTERNAME%
for /f "tokens=1-3 delims=:" %%a in ("%time%") do (set TIMESTAMP=%%a%%b%%c)
set CURRENT_DATE=%date:/=%
set COMMIT_MSG="Commit from %PC_NAME% on %CURRENT_DATE% at %TIMESTAMP%"

REM Pull latest changes
git pull origin main

REM Add all changes to the staging area
git add .

REM Commit with the message
git commit -m %COMMIT_MSG%

REM Push changes to the remote repository
git push origin main

@echo Commit and push complete with message: %COMMIT_MSG%
pause