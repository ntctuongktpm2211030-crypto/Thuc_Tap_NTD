Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[1/3] Dong bo cau truc Database..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/backend"
npx prisma db push

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[2/3] Sinh lai du lieu tri thuc..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/knowledge-builder"
python chunk.py

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[3/3] Nap du lieu tri thuc vao PostgreSQL..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Dynamic resolution of accented filenames to avoid any encoding errors
$vnJson = (Get-ChildItem "$PSScriptRoot/knowledge-builder/chunks/*014_*.json" | Select-Object -First 1).FullName
$citiesJson = (Get-ChildItem "$PSScriptRoot/knowledge-builder/chunks/*017_*.json" | Select-Object -First 1).FullName

npm run import-json -- --file="$vnJson,$citiesJson" --fast --clear

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "DONE! HOAN THANH DONG BO DATABASE RAG!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Read-Host "Nhan Enter de ket thuc..."
