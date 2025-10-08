# 🚀 Финальный план развертывания Hack2025 News Aggregator

## 🎯 **Цель:** Безопасно развернуть проект с сохранением backup

## 📋 **Пошаговый план:**

### **ШАГ 1: Создание backup (КРИТИЧНО!)**

#### 1.1 Проверить Git статус
```bash
git status
```

#### 1.2 Создать backup ветку
```bash
git checkout -b backup-before-deployment
git add .
git commit -m "Backup: Apple Intelligence design complete - ready for deployment"
git push origin backup-before-deployment
```

#### 1.3 Создать локальный архив
```bash
tar -czf hack2025-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
```

#### 1.4 Создать тег checkpoint
```bash
git tag -a v1.0-backup -m "Backup before deployment"
git push origin v1.0-backup
```

### **ШАГ 2: Подготовка к развертыванию**

#### 2.1 Вернуться на main
```bash
git checkout main
```

#### 2.2 Убедиться, что все готово
- ✅ Структура проекта корректна
- ✅ Все компоненты созданы
- ✅ API routes настроены
- ✅ Конфигурация Vercel готова

### **ШАГ 3: Развертывание на Vercel**

#### 3.1 Создать аккаунт Vercel
- Перейти на [vercel.com](https://vercel.com)
- Войти через GitHub

#### 3.2 Импортировать проект
- New Project → Import Git Repository
- **Root Directory:** `apps/web` (ВАЖНО!)
- **Framework Preset:** Next.js

#### 3.3 Настроить переменные окружения
```
OPENAI_API_KEY = your_openai_key_here (опционально)
OPENAI_MODEL = gpt-4o-mini
SUMMARY_CACHE_TTL_MS = 1800000
```

#### 3.4 Деплой
- Нажать "Deploy"
- Дождаться завершения сборки
- Получить публичную ссылку

### **ШАГ 4: Тестирование**

#### 4.1 Базовые тесты
- [ ] Открыть главную страницу
- [ ] Проверить загрузку интерфейса
- [ ] Добавить тестовый RSS фид
- [ ] Проверить отображение новостей

#### 4.2 Функциональные тесты
- [ ] Горизонтальная прокрутка работает
- [ ] Переключение темы работает
- [ ] Фильтрация по ключевым словам
- [ ] Сортировка новостей
- [ ] Переходы на источники

#### 4.3 Тестовые RSS фиды
```
https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
https://feeds.bbci.co.uk/news/rss.xml
https://rss.cnn.com/rss/edition.rss
```

### **ШАГ 5: Мониторинг**

#### 5.1 Проверить логи
- Vercel Dashboard → Functions
- Мониторинг ошибок
- Производительность

#### 5.2 Включить аналитику
- Vercel Analytics
- Отслеживание использования

## 🚨 **План восстановления (если что-то пойдет не так):**

### Быстрое восстановление:
```bash
git checkout backup-before-deployment
git checkout main
git reset --hard backup-before-deployment
git push origin main --force
```

### Восстановление из архива:
```bash
tar -xzf hack2025-backup-YYYYMMDD-HHMMSS.tar.gz
```

## 📊 **Ожидаемый результат:**

После успешного развертывания:
- ✅ Публичная ссылка на работающий сервис
- ✅ Современный дизайн в стиле Apple Intelligence
- ✅ Горизонтальная прокручиваемая лента новостей
- ✅ AI-powered суммаризация
- ✅ Все функции работают корректно

## 🔄 **Следующие шаги (согласно анализу проекта):**

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

**Готовы начать с создания backup?** 🛡️

**Команда для начала:**
```bash
git status
```
