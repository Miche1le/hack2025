# News Intelligence - Auto Setup and Launch
Write-Host "🚀 News Intelligence - Auto Setup" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "apps\web\package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Setting up environment..." -ForegroundColor Cyan

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    @"
LOCAL_SUMMARY_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral:7b-instruct
USE_LOCAL_ONLY=true
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
try {
    pnpm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎨 Starting News Intelligence..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 The app will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 To use local LLM (optional):" -ForegroundColor Cyan
Write-Host "   1. Download Ollama from https://ollama.ai/download" -ForegroundColor White
Write-Host "   2. Run: ollama serve" -ForegroundColor White
Write-Host "   3. Run: ollama pull mistral:7b-instruct" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host ""

# Start the development server
Set-Location apps\web
pnpm dev
