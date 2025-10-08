@echo off
echo 🚀 News Intelligence - Quick Start
echo.

echo 📋 Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js is installed

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm is not installed. Installing pnpm...
    npm install -g pnpm
)
echo ✅ pnpm is available

echo.
echo 🔧 Setting up environment...
if not exist .env.local (
    echo LOCAL_SUMMARY_URL=http://localhost:11434/api/generate > .env.local
    echo OLLAMA_MODEL=mistral:7b-instruct >> .env.local
    echo USE_LOCAL_ONLY=true >> .env.local
    echo ✅ Created .env.local file
) else (
    echo ✅ .env.local already exists
)

echo.
echo 📦 Installing dependencies...
pnpm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo 🎨 Starting News Intelligence...
echo.
echo 🌐 Open http://localhost:3000 in your browser
echo.
echo 📝 To use local LLM:
echo    1. Install Ollama from https://ollama.ai/download
echo    2. Run: ollama serve
echo    3. Run: ollama pull mistral:7b-instruct
echo.

pnpm dev
