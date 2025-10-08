# 🚀 Установка Ollama на Windows

## Способ 1: Скачать установщик (рекомендуется)

1. Перейдите на https://ollama.ai/download
2. Скачайте установщик для Windows
3. Запустите `OllamaSetup.exe`
4. Следуйте инструкциям установщика

## Способ 2: Через PowerShell

```powershell
# Откройте PowerShell от имени администратора
Set-ExecutionPolicy Bypass -Scope Process -Force
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://ollama.ai/install.ps1'))
```

## Способ 3: Через Chocolatey

```powershell
# Если у вас установлен Chocolatey
choco install ollama
```

## После установки

1. **Запустите Ollama**:
   ```cmd
   ollama serve
   ```

2. **В новом терминале загрузите модель**:
   ```cmd
   ollama pull mistral:7b-instruct
   ```

3. **Проверьте работу**:
   ```cmd
   curl http://localhost:11434/api/tags
   ```

## Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
LOCAL_SUMMARY_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral:7b-instruct
USE_LOCAL_ONLY=true
```

## Запуск приложения

```bash
pnpm dev
```

Откройте http://localhost:3000 и наслаждайтесь новым дизайном! 🎉
