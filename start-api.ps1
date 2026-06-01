# ── Démarrer l'API Le Corridor Club (Supabase) ─────────────────────
$env:DATABASE_URL        = "postgresql://postgres:romyStone2026@db.jvnawphfifzmepkzczqz.supabase.co:5432/postgres"
$env:PORT                = "4000"
$env:NODE_ENV            = "development"
$env:CORS_ORIGIN         = "http://localhost:5173"
$env:JWT_ACCESS_SECRET   = "dev_access_secret_please_change_in_production_32chars"
$env:JWT_REFRESH_SECRET  = "dev_refresh_secret_please_change_in_production_32chars"

Set-Location "C:\Users\JEANPATRICKROMUALDCA\Desktop\Le corridor club\apps\api"
Write-Host "🚀 API Le Corridor Club → Supabase PostgreSQL (port 4000)" -ForegroundColor Green
npx tsx src/index.ts
