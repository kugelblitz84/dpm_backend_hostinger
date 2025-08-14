@echo off
echo ================================
echo    Easy Heroku Deployment
echo ================================
echo.

echo Step 1: Adding all changes to git...
git add -A

echo Step 2: Committing changes...
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Update API code

git commit -m "%commit_message%"

echo Step 3: Pushing to Heroku...
git push heroku main

echo.
echo ================================
echo   Deployment Complete!
echo   Your API: https://vast-mountain-10554-07c9c3a1bd74.herokuapp.com/
echo ================================
pause
