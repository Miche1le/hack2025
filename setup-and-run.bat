@echo off
chcp 65001 >nul
echo 🚀 News Intelligence - Auto Setup
echo.

REM Check if we're in the right directory
if not exist "apps\web\package.json" (
    echo ❌ Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo 📋 Setting up environment...
echo.

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo LOCAL_SUMMARY_URL=http://localhost:11434/api/generate > .env.local
    echo OLLAMA_MODEL=mistral:7b-instruct >> .env.local
    echo USE_LOCAL_ONLY=true >> .env.local
    echo ✅ Created .env.local file
) else (
    echo ✅ .env.local already exists
)

echo.
echo 📦 Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully

echo.
echo 🎨 Starting News Intelligence...
echo.
echo 🌐 The app will be available at: http://localhost:3000
echo.
echo 📝 To use local LLM (optional):
echo    1. Download Ollama from https://ollama.ai/download
echo    2. Run: ollama serve
echo    3. Run: ollama pull mistral:7b-instruct
echo.
echo 🚀 Starting development server...
echo.

REM Start the development server
cd apps\web
call pnpm dev
