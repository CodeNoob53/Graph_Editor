# Структура класів Graph Editor

## Огляд

Проєкт було переробано з функціонального підходу на об'єктно-орієнтований (ООП) з використанням класів ES6.

## Основні класи

### 1. GraphEditor (src/GraphEditor.js)
**Головний клас** - координує роботу всіх менеджерів та ініціалізує застосунок.

```javascript
const graphEditor = new GraphEditor('cy');
```

**Властивості:**
- `cy` - екземпляр Cytoscape
- `state` - глобальний стан застосунку
- `historyManager` - менеджер історії (undo/redo)
- `edgeManager` - менеджер ребер
- `eventManager` - менеджер подій
- `uiManager` - менеджер UI
- `gridManager` - менеджер сітки
- `zoomManager` - менеджер масштабування
- `keyboardManager` - менеджер клавіатурних скорочень

**Методи:**
- `init()` - ініціалізація всіх менеджерів
- `getCytoscape()` - отримати екземпляр Cytoscape
- `getState()` - отримати стан
- `destroy()` - знищити екземпляр

### 2. HistoryManager (src/utils/history.js)
Управління історією змін графа (undo/redo функціональність).

**Методи:**
- `saveHistory()` - зберегти поточний стан
- `undo()` - скасувати останню дію
- `redo()` - повторити скасовану дію

### 3. EdgeManager (src/modules/edgeHandles.js)
Управління створенням та валідацією ребер.

**Методи:**
- `init()` - ініціалізація edgehandles
- `handleEdgeComplete(addedEles)` - обробка завершення створення ребра
- `validateEdge(sourceNode, targetNode)` - валідація нового ребра
- `enableDrawMode()` - увімкнути режим малювання ребер
- `disableDrawMode()` - вимкнути режим малювання
- `getEdgeHandles()` - отримати екземпляр edgehandles

### 4. EventManager (src/modules/eventHandlers.js)
Управління всіма подіями Cytoscape (кліки, перетягування, hover тощо).

**Методи:**
- `setupEdgeHandleEvents()` - події для ребер
- `setupTapEvents()` - події кліків
- `setupNodeEvents()` - події для вершин
- `setupEdgeEvents()` - додаткові події для ребер
- `setupDragEvents()` - події перетягування
- `setupMouseEvents()` - події миші
- `handleNodeCreation(position)` - створення нової вершини
- `handleEdgeAdd(event)` - додавання ребра
- `handleEdgeWeightEdit(event)` - редагування ваги ребра
- `clearSelection()` - очищення виділення

### 5. UIManager (src/modules/uiHandlers.js)
Управління інтерфейсом користувача, кнопками та алгоритмами.

**Методи:**
- `setupModeButtons()` - кнопки режимів (arrow, node, edge)
- `setupGraphButtons()` - кнопки графа (clear, info, directed)
- `setupHistoryButtons()` - кнопки історії (undo, redo)
- `setupImportExportButtons()` - імпорт/експорт
- `setupAlgorithmButtons()` - кнопки алгоритмів (MST, shortest path, etc.)
- `setupUIToggleButtons()` - перемикачі UI
- `setMode(mode)` - встановити режим роботи
- `updateEdgeStyle()` - оновити стиль ребер

### 6. GridManager (src/modules/gridManager.js)
Управління сіткою та прив'язкою до неї.

**Методи:**
- `setupRenderListener()` - слухач рендерингу сітки
- `setupEventListeners()` - обробники для toggle snap та grid size

### 7. ZoomManager (src/modules/zoomDisplay.js)
Управління відображенням рівня масштабування.

**Методи:**
- `init()` - ініціалізація
- `updateDisplay()` - оновлення відображення zoom

### 8. KeyboardManager (src/modules/keyboardManager.js)
Управління клавіатурними скороченнями та гарячими клавішами.

**Підтримувані шорткати:**
- `Ctrl+Z` - Undo (скасувати останню дію)
- `Ctrl+Y` або `Ctrl+Shift+Z` - Redo (повторити скасовану дію)
- `Delete` або `Backspace` - видалити вибрані елементи
- `Escape` - скасувати виділення
- `Ctrl+A` - вибрати всі елементи

**Методи:**
- `init()` - ініціалізація
- `setupKeyboardShortcuts()` - налаштування обробників клавіатури

**Особливості:**
- Автоматично ігнорує події коли фокус на `<input>` або `<textarea>`
- Зберігає історію після видалення елементів
- Інтегрований з HistoryManager для undo/redo

## Переваги нової архітектури

### 1. **Інкапсуляція**
Кожен клас відповідає за свою конкретну функціональність.

### 2. **Повторне використання**
Класи можна легко переносити між проєктами.

### 3. **Тестування**
Кожен клас можна тестувати окремо.

### 4. **Масштабованість**
Легко додавати нові функції, розширюючи існуючі класи.

### 5. **Читабельність**
Структурований код легше читати та підтримувати.

## Приклади використання

### Доступ до Cytoscape
```javascript
const cy = window.graphEditor.getCytoscape();
```

### Доступ до стану
```javascript
const state = window.graphEditor.getState();
console.log(state.isDirected); // true/false
```

### Програмне керування
```javascript
// Увімкнути режим додавання вершин
window.graphEditor.uiManager.setMode('node');

// Зберегти історію
window.graphEditor.historyManager.saveHistory();

// Увімкнути/вимкнути режим малювання ребер
window.graphEditor.edgeManager.enableDrawMode();
window.graphEditor.edgeManager.disableDrawMode();
```

## Структура файлів

```
src/
├── GraphEditor.js          # Головний клас
├── main.js                 # Точка входу
├── config/
│   ├── cytoscapeConfig.js  # Конфігурація Cytoscape
│   └── cytoscapeStyles.js  # Стилі
├── modules/
│   ├── edgeHandles.js      # EdgeManager
│   ├── eventHandlers.js    # EventManager
│   ├── uiHandlers.js       # UIManager
│   ├── gridManager.js      # GridManager
│   └── zoomDisplay.js      # ZoomManager
├── utils/
│   ├── history.js          # HistoryManager
│   ├── grid.js             # Утиліти сітки
│   └── highlight.js        # Утиліти підсвічування
└── algorithms/
    ├── mst.js              # Мінімальне остовне дерево
    ├── shortestPath.js     # Найкоротший шлях
    ├── minWeightedPath.js  # Мінімальний зважений шлях
    └── spanningTrees.js    # Всі остовні дерева
```

## Міграція з попередньої версії

Якщо у вас є код, що використовував стару структуру:

**Старий код:**
```javascript
setupEventHandlers(cy, state, historyManager);
```

**Новий код:**
```javascript
const eventManager = new EventManager(cy, state, historyManager);
```

## Production build

Всі `console.log` видалено з production коду для кращої продуктивності.

Для збірки production:
```bash
npm run build
```
