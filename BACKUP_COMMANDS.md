# 🛡️ Инструкции по созданию backup перед развертыванием

## 📋 **Команды для создания backup:**

### 1. **Проверить Git статус**
```bash
git status
```

### 2. **Создать backup ветку**
```bash
# Создать новую ветку для backup
git checkout -b backup-before-deployment

# Добавить все изменения
git add .

# Создать коммит с описанием
git commit -m "Backup: Complete working state with Apple Intelligence design

- Horizontal scrollable feed implemented
- Modern card design with animations
- Dark/light theme toggle
- Client-side filtering and sorting
- HTML tag cleaning
- All components ready for deployment"

# Отправить backup ветку на GitHub
git push origin backup-before-deployment
```

### 3. **Создать локальный архив**
```bash
# Создать архив с timestamp
tar -czf hack2025-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Проверить размер архива
ls -lh hack2025-backup-*.tar.gz
```

### 4. **Создать тег для checkpoint**
```bash
# Создать тег для текущего состояния
git tag -a v1.0-backup -m "Backup before deployment - Apple Intelligence design complete"

# Отправить тег на GitHub
git push origin v1.0-backup
```

### 5. **Документировать состояние**
```bash
# Создать файл с описанием текущего состояния
cat > BACKUP_INFO.md << EOF
# Backup Information

## Дата создания: $(date)
## Ветка: backup-before-deployment
## Тег: v1.0-backup

## Что включено:
- ✅ Apple Intelligence дизайн
- ✅ Горизонтальная прокручиваемая лента
- ✅ Современные карточки новостей
- ✅ Темная/светлая тема
- ✅ Клиентская фильтрация
- ✅ Сортировка новостей
- ✅ Очистка HTML тегов
- ✅ Все компоненты готовы

## Файлы проекта:
$(find . -name "*.tsx" -o -name "*.ts" -o -name "*.json" | head -20)

## Для восстановления:
\`\`\`bash
git checkout backup-before-deployment
\`\`\`
EOF
```

## 🔄 **Процесс развертывания:**

### После создания backup:

1. **Вернуться на main ветку**
```bash
git checkout main
```

2. **Подготовить к развертыванию**
```bash
# Убедиться, что все изменения сохранены
git add .
git commit -m "Ready for deployment"
```

3. **Развернуть на Vercel**
- Импортировать проект
- Настроить Root Directory: `apps/web`
- Добавить переменные окружения
- Деплой

## 🚨 **Если что-то пойдет не так:**

### Быстрое восстановление:
```bash
# Переключиться на backup ветку
git checkout backup-before-deployment

# Принудительно обновить main
git checkout main
git reset --hard backup-before-deployment
git push origin main --force
```

### Восстановление из архива:
```bash
# Извлечь архив
tar -xzf hack2025-backup-YYYYMMDD-HHMMSS.tar.gz

# Восстановить Git состояние
git checkout backup-before-deployment
```

## ✅ **Проверка backup:**

После создания backup проверить:
- [ ] Backup ветка создана
- [ ] Архив создан
- [ ] Тег создан
- [ ] Все файлы сохранены
- [ ] Можно переключиться на backup ветку

**Готовы создать backup?** 🛡️
