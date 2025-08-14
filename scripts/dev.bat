@echo off
echo ================================
echo   Starting Local Development
echo ================================
echo.

echo Checking if Node.js is installed...
node --version || (echo Please install Node.js first! & pause & exit)

echo.
echo Installing dependencies...
npm install

echo.
echo Starting development server...
echo Your local API will be available at: http://localhost:4000
echo Press Ctrl+C to stop the server
echo.

npm run dev
