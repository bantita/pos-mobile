# Xcellence ERP POS — Deploy Script
# Usage: cd D:\pos-mobile; .\deploy.ps1

Write-Host "=== Building web version ===" -ForegroundColor Cyan
Set-Location D:\pos-mobile
npx expo export --platform web

if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

Write-Host "=== Fixing icon fonts ===" -ForegroundColor Cyan

# Copy vercel.json for SPA routing (จอ 2 ?display=1)
Copy-Item "public\vercel.json" "dist\vercel.json" -Force

# Create fonts directory
New-Item -ItemType Directory -Path "dist\fonts" -Force | Out-Null

# Copy font files to simple path (no @ in URL)
$fontDir = "dist\assets\node_modules\@expo\vector-icons\build\vendor\react-native-vector-icons\Fonts"
Copy-Item "$fontDir\Ionicons.*.ttf" "dist\fonts\Ionicons.ttf" -Force
Copy-Item "$fontDir\MaterialIcons.*.ttf" "dist\fonts\MaterialIcons.ttf" -Force
Copy-Item "$fontDir\MaterialCommunityIcons.*.ttf" "dist\fonts\MaterialCommunityIcons.ttf" -Force
Copy-Item "$fontDir\FontAwesome.b*.ttf" "dist\fonts\FontAwesome.ttf" -Force

# Write font-fix.css
$css = @"
@font-face { font-family: 'Ionicons'; src: url('/fonts/Ionicons.ttf') format('truetype'); }
@font-face { font-family: 'MaterialIcons'; src: url('/fonts/MaterialIcons.ttf') format('truetype'); }
@font-face { font-family: 'MaterialCommunityIcons'; src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'); }
@font-face { font-family: 'FontAwesome'; src: url('/fonts/FontAwesome.ttf') format('truetype'); }
"@
Set-Content "dist\font-fix.css" $css -NoNewline

# Inject link in index.html
$html = Get-Content "dist\index.html" -Raw
if ($html -notmatch 'font-fix.css') {
    $html = $html -replace '</head>', '<link rel="stylesheet" href="/font-fix.css"/></head>'
    Set-Content "dist\index.html" $html -NoNewline
}

Write-Host "Font fix applied!" -ForegroundColor Green

Write-Host "=== Deploying to Vercel ===" -ForegroundColor Cyan
Set-Location dist
vercel --prod

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "URL: https://xcellence-pos.vercel.app" -ForegroundColor Yellow
