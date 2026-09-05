param([Parameter(Mandatory=$true)][string]$commitMsg)

Write-Host 'Building xl-frontend...'
cd xl-frontend
npm run build
git add src dist -f
cd ..

Write-Host 'Building xla-frontend...'
cd xla-frontend
npm run build
git add src dist -f
cd ..

git add .
git commit -m $commitMsg
git push
