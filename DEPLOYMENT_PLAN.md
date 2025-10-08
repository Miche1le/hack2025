# План развертывания Hack2025 News Aggregator

## 🎯 **Цель:** Развернуть проект на Vercel для публичного доступа

## 📋 **Пошаговый план:**

### 1. **Подготовка к развертыванию**

#### 1.1 Проверить структуру проекта
- ✅ Монорепозиторий с Next.js в `apps/web/`
- ✅ Все компоненты созданы
- ✅ API routes настроены
- ✅ Конфигурация готова

#### 1.2 Создать файл конфигурации для Vercel
```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

#### 1.3 Настроить переменные окружения
- `OPENAI_API_KEY` (опционально)
- `OPENAI_MODEL` (по умолчанию: gpt-4o-mini)
- `SUMMARY_CACHE_TTL_MS` (по умолчанию: 1800000)

### 2. **Развертывание на Vercel**

#### 2.1 Создать аккаунт Vercel
- Перейти на [vercel.com](https://vercel.com)
- Войти через GitHub
- Подключить репозиторий

#### 2.2 Настроить проект
- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

#### 2.3 Настроить переменные окружения
```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
SUMMARY_CACHE_TTL_MS=1800000
```

### 3. **Альтернативные варианты**

#### 3.1 Netlify
```toml
# netlify.toml
[build]
  command = "cd apps/web && npm run build"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "18"
```

#### 3.2 Railway
- Подключить GitHub репозиторий
- Настроить `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd apps/web && npm start",
    "healthcheckPath": "/"
  }
}
```

### 4. **Проверка после развертывания**

#### 4.1 Функциональные тесты
- ✅ Загрузка главной страницы
- ✅ Добавление RSS фидов
- ✅ Фильтрация по ключевым словам
- ✅ Сортировка новостей
- ✅ Переключение темы
- ✅ Горизонтальная прокрутка

#### 4.2 Производительность
- ✅ Скорость загрузки
- ✅ Время отклика API
- ✅ Адаптивность на мобильных

#### 4.3 Безопасность
- ✅ HTTPS соединение
- ✅ CORS настройки
- ✅ Обработка ошибок

### 5. **Мониторинг и поддержка**

#### 5.1 Логирование
- Настроить логи Vercel
- Мониторинг ошибок
- Аналитика использования

#### 5.2 Обновления
- Автоматический деплой из main ветки
- CI/CD pipeline
- Тестирование перед деплоем

## 🚀 **Команды для локального тестирования:**

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен версии
npm run start

# Тестирование
npm run test
```

## 📱 **Тестовые RSS фиды:**

```bash
# Для тестирования
https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
https://feeds.bbci.co.uk/news/rss.xml
https://rss.cnn.com/rss/edition.rss
```

## 🎯 **Ожидаемый результат:**

После развертывания пользователи смогут:
- Открыть публичную ссылку
- Добавить свои RSS фиды
- Настроить фильтры и сортировку
- Получать AI-powered сводки новостей
- Использовать современный интерфейс в стиле Apple Intelligence

## 📞 **Поддержка:**

- Документация: README.md
- Техническая поддержка: через GitHub Issues
- Обновления: автоматические через CI/CD
