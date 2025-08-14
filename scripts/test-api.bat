@echo off
echo ================================
echo     API Testing Script
echo ================================
echo.

set API_URL=https://vast-mountain-10554-07c9c3a1bd74.herokuapp.com

echo Testing your API endpoints...
echo.

echo 1. Testing basic health check...
curl -s "%API_URL%/api/health" || echo API might be starting up...
echo.

echo 2. Testing product review public endpoint...
curl -s "%API_URL%/api/product-review/test-public"
echo.

echo 3. Testing product review creation (guest user)...
powershell -Command "$body = @{ productId = 1; rating = 5; description = 'Test review from script'; guestName = 'Test User'; guestEmail = 'test@example.com' } | ConvertTo-Json; try { Invoke-RestMethod -Uri '%API_URL%/api/product-review/create' -Method POST -Body $body -ContentType 'application/json' } catch { Write-Host 'Error:' $_.Exception.Message }"
echo.

echo ================================
echo   Testing Complete!
echo ================================
pause
