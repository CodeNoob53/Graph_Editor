# Graph Editor

Сучасний редактор графів, побудований на **Cytoscape.js 3.33.1** та **Vite**.

## Особливості

- **Модульна архітектура ES6**: Повністю переписаний з використанням ES6 модулів
- **Vite**: Швидка розробка та оптимізована збірка
- **Cytoscape.js 3.33.1**: Найновіша версія бібліотеки візуалізації графів
- **Розширення**: Інтеграція `cytoscape-edgehandles` та `cytoscape-cxtmenu` через npm
- **Алгоритми**: MST (Prim), найкоротший шлях (Dijkstra), spanning trees та інші

## Структура проєкту

```
├── public/               # Статичні ресурси (іконки, зображення)
├── src/
│   ├── algorithms/       # Алгоритми графів
│   │   ├── mst.js
│   │   ├── shortestPath.js
│   │   ├── spanningTrees.js
│   │   └── minWeightedPath.js
│   ├── config/          # Конфігурація Cytoscape
│   │   ├── cytoscapeConfig.js
│   │   └── cytoscapeStyles.js
│   ├── modules/         # Основні модулі додатку
│   │   ├── eventHandlers.js
│   │   ├── edgeHandles.js
│   │   ├── uiHandlers.js
│   │   ├── gridManager.js
│   │   └── zoomDisplay.js
│   ├── utils/           # Допоміжні функції
│   │   ├── combinatorics.js
│   │   ├── grid.js
│   │   ├── highlight.js
│   │   └── history.js
│   ├── main.js          # Точка входу
│   └── styles.css       # Стилі
├── index.html           # HTML шаблон
├── vite.config.js       # Конфігурація Vite
└── package.json         # Залежності та скрипти
```

## Встановлення

```bash
# Клонувати репозиторій
git clone <repository-url>

# Перейти в директорію проєкту
cd Graphs

# Встановити залежності
npm install
```

## Команди

```bash
# Запустити dev сервер
npm run dev

# Зібрати для production
npm run build

# Переглянути production збірку
npm run preview
```

## Використання

1. **Додавання вершин**: Натисніть кнопку "Add Node" та клікніть на полотні
2. **Створення ребер**: Натисніть "Add Edge" та перетягніть від однієї вершини до іншої
3. **Додавання ваг**: Подвійний клік на ребрі для введення ваги
4. **Алгоритми**: Використовуйте праву панель для запуску різних алгоритмів
5. **Експорт/Імпорт**: Зберігайте та завантажуйте графи у форматі JSON

## Оновлення з попередньої версії

### Що змінилось:

- ✅ Cytoscape.js оновлено з CDN версії до **npm v3.33.1**
- ✅ Модульна структура замість монолітного `script.js`
- ✅ Vite замість прямого завантаження скриптів
- ✅ ES6 import/export замість глобальних змінних
- ✅ Оптимізована збірка та tree-shaking

### Міграція:

Старі файли збережено:
- `index.old.html` - оригінальний HTML
- `script.js` - оригінальний монолітний скрипт
- `cytoscape-*.js` - локальні копії розширень (більше не потрібні)

## Залежності

### Production
- `cytoscape@^3.33.1` - Бібліотека візуалізації графів
- `cytoscape-edgehandles@^4.0.1` - Інтерактивне створення ребер
- `cytoscape-cxtmenu@^3.5.0` - Контекстне меню
- `lodash@^4.17.21` - Утилітарні функції

### Development
- `vite@^7.2.2` - Build tool та dev сервер

## Браузерна підтримка

Сучасні браузери з підтримкою ES6 modules:
- Chrome/Edge 61+
- Firefox 60+
- Safari 11+

## Ліцензія

ISC

## Автор

[Ваше ім'я]
