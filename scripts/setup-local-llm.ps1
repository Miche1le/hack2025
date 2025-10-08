# PowerShell скрипт для настройки локальной LLM через Ollama
# Использование: .\setup-local-llm.ps1 [model-name]

param(
    [string]$ModelName = "mistral:7b-instruct"
)

$OllamaHost = $env:OLLAMA_HOST
if (-not $OllamaHost) {
    $OllamaHost = "http://localhost:11434"
}

Write-Host "🚀 Setting up local LLM with Ollama..." -ForegroundColor Green
Write-Host "Model: $ModelName" -ForegroundColor Cyan
Write-Host "Host: $OllamaHost" -ForegroundColor Cyan

# Проверяем, запущен ли Ollama
Write-Host "📡 Checking Ollama status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$OllamaHost/api/tags" -Method Get -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running. Please start Ollama first:" -ForegroundColor Red
    Write-Host "   docker-compose up -d ollama" -ForegroundColor Yellow
    Write-Host "   or" -ForegroundColor Yellow
    Write-Host "   ollama serve" -ForegroundColor Yellow
    exit 1
}

# Проверяем, загружена ли модель
Write-Host "🔍 Checking if model $ModelName is available..." -ForegroundColor Yellow
try {
    $tagsResponse = Invoke-RestMethod -Uri "$OllamaHost/api/tags" -Method Get
    $modelExists = $tagsResponse.models | Where-Object { $_.name -eq $ModelName }
    
    if ($modelExists) {
        Write-Host "✅ Model $ModelName is already available" -ForegroundColor Green
    } else {
        Write-Host "📥 Pulling model $ModelName..." -ForegroundColor Yellow
        & ollama pull $ModelName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Model $ModelName downloaded successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to download model $ModelName" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error checking/downloading model: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Тестируем модель
Write-Host "🧪 Testing model..." -ForegroundColor Yellow
try {
    $testBody = @{
        model = $ModelName
        prompt = "Summarize this text in 2-3 sentences: The quick brown fox jumps over the lazy dog."
        stream = $false
    } | ConvertTo-Json

    $testResponse = Invoke-RestMethod -Uri "$OllamaHost/api/generate" -Method Post -Body $testBody -ContentType "application/json"
    
    if ($testResponse.response) {
        Write-Host "✅ Model test successful" -ForegroundColor Green
        Write-Host "📝 Test response:" -ForegroundColor Cyan
        Write-Host $testResponse.response -ForegroundColor White
    } else {
        Write-Host "❌ Model test failed - no response received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Model test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Local LLM setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set environment variables:" -ForegroundColor Yellow
Write-Host "   `$env:LOCAL_SUMMARY_URL = `"$OllamaHost/api/generate`"" -ForegroundColor White
Write-Host "   `$env:OLLAMA_MODEL = `"$ModelName`"" -ForegroundColor White
Write-Host "   `$env:USE_LOCAL_ONLY = `"true`"" -ForegroundColor White
Write-Host ""
Write-Host "2. Or add to your .env.local file:" -ForegroundColor Yellow
Write-Host "   LOCAL_SUMMARY_URL=$OllamaHost/api/generate" -ForegroundColor White
Write-Host "   OLLAMA_MODEL=$ModelName" -ForegroundColor White
Write-Host "   USE_LOCAL_ONLY=true" -ForegroundColor White
Write-Host ""
Write-Host "3. Restart your application to use local LLM" -ForegroundColor Yellow
