# 🚀 Инструкции по развертыванию на Vercel

## 📋 **Пошаговое руководство:**

### **ШАГ 1: Подготовка (Backup)**
```bash
# Создать backup ветку
git checkout -b backup-before-deployment
git add .
git commit -m "Backup: Apple Intelligence design complete"
git push origin backup-before-deployment
git checkout main
```

### **ШАГ 2: Создание аккаунта Vercel**

#### 2.1 Перейти на [vercel.com](https://vercel.com)
#### 2.2 Нажать "Sign Up"
#### 2.3 Выбрать "Continue with GitHub"
#### 2.4 Авторизоваться через GitHub

### **ШАГ 3: Импорт проекта**

#### 3.1 Нажать "New Project"
#### 3.2 Выбрать репозиторий: `Miche1le/hack2025`
#### 3.3 **КРИТИЧНО:** Установить Root Directory: `apps/web`
#### 3.4 Framework Preset: Next.js (автоматически определится)
#### 3.5 Нажать "Deploy"

### **ШАГ 4: Настройка переменных окружения**

#### 4.1 После первого деплоя перейти в Settings
#### 4.2 Environment Variables → Add New
#### 4.3 Добавить переменные:

```
Name: OPENAI_API_KEY
Value: your_openai_key_here (опционально)
Environment: Production, Preview, Development

Name: OPENAI_MODEL
Value: gpt-4o-mini
Environment: Production, Preview, Development

Name: SUMMARY_CACHE_TTL_MS
Value: 1800000
Environment: Production, Preview, Development
```

#### 4.4 Нажать "Save"
#### 4.5 Перейти в Deployments → Redeploy

### **ШАГ 5: Тестирование**

#### 5.1 Открыть полученную ссылку
#### 5.2 Проверить загрузку главной страницы
#### 5.3 Добавить тестовый RSS фид:
```
https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
```
#### 5.4 Проверить отображение новостей
#### 5.5 Протестировать все функции

### **ШАГ 6: Мониторинг**

#### 6.1 Перейти в Vercel Dashboard
#### 6.2 Проверить Functions → Logs
#### 6.3 Мониторить ошибки
#### 6.4 Проверить производительность

## 🔧 **Конфигурация Vercel:**

### **vercel.json (уже создан):**
```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "functions": {
    "apps/web/app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### **Root Directory:** `apps/web`
### **Build Command:** `pnpm build`
### **Output Directory:** `.next`

## 🚨 **Возможные проблемы и решения:**

### **Проблема 1: Build ошибка**
**Решение:** Проверить Root Directory = `apps/web`

### **Проблема 2: API routes не работают**
**Решение:** Проверить переменные окружения

### **Проблема 3: Стили не загружаются**
**Решение:** Проверить Tailwind CSS конфигурацию

### **Проблема 4: Ошибки TypeScript**
**Решение:** Проверить tsconfig.json

## 📊 **Ожидаемый результат:**

После успешного развертывания:
- ✅ Публичная ссылка на работающий сервис
- ✅ Современный дизайн в стиле Apple Intelligence
- ✅ Горизонтальная прокручиваемая лента новостей
- ✅ AI-powered суммаризация
- ✅ Все функции работают корректно

## 🔄 **Следующие шаги:**

1. **Применить patch.diff** (если нужно)
2. **Слить ветку в main** (объединить изменения)
3. **Провести полное ручное тестирование**
4. **Подготовить демонстрацию**

## 📞 **Поддержка:**

Если возникли проблемы:
1. Проверить логи в Vercel Dashboard
2. Убедиться в правильности конфигурации
3. Проверить переменные окружения
4. При необходимости восстановить из backup

**Готовы к развертыванию!** 🚀
