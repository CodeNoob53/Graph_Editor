# Graph Editor - Архітектура проєкту

## Структура проєкту

```
Graph_Editor/
├── index.html              # Головна HTML сторінка
├── styles.css              # Стилі додатку
├── assets/                 # Ресурси (іконки, зображення)
├── src/                    # Вихідний код (модулі)
│   ├── core/               # Основні компоненти
│   │   └── GraphManager.js       # Управління графом Cytoscape
│   ├── algorithms/         # Алгоритми для графів
│   │   └── GraphAlgorithms.js    # MST, Dijkstra, Euler, Hamilton
│   ├── managers/           # Менеджери функціональності
│   │   ├── HistoryManager.js     # Undo/Redo функціональність
│   │   ├── GridManager.js        # Управління сіткою
│   │   ├── ImportExportManager.js # Імпорт/експорт графів
│   │   └── UIManager.js          # Управління UI та взаємодією
│   └── main.js             # Точка входу, ініціалізація
└── cytoscape-*.js          # Бібліотеки Cytoscape

```

## Модулі та класи

### 1. GraphManager (core/GraphManager.js)
**Відповідальність:** Управління графом Cytoscape

**Основні методи:**
- `initializeCytoscape()` - ініціалізація графа
- `addNode(position, snapToGridFn)` - додавання вузла
- `clearGraph()` - очищення графа
- `setMode(mode)` - встановлення режиму роботи
- `setDirected(isDirected)` - встановлення типу графа
- `highlightPath(path)` - підсвічування шляху
- `exportToJSON()` / `importFromJSON()` - експорт/імпорт

**Стан:**
- `cy` - екземпляр Cytoscape
- `nodeCount` - лічильник вузлів
- `isDirected` - тип графа
- `activeMode` - поточний режим роботи

### 2. GraphAlgorithms (algorithms/GraphAlgorithms.js)
**Відповідальність:** Алгоритми для роботи з графами

**Основні методи:**
- `calculatePrimMST()` - алгоритм Пріма для MST
- `findShortestPath(source, target)` - алгоритм Дейкстри
- `findMinWeightedPathForFourVertices()` - мінімальний шлях для 4 вершин
- `generateAllSpanningTrees()` - генерація всіх остовних дерев
- `findEulerTrailAndCircuit()` - пошук Ейлерових шляхів/циклів
- `findHamiltonianCycles()` - пошук Гамільтонових циклів

**Стан:**
- `cy` - посилання на граф
- `isDirected` - тип графа

### 3. HistoryManager (managers/HistoryManager.js)
**Відповідальність:** Управління історією змін (undo/redo)

**Основні методи:**
- `saveState()` - збереження поточного стану
- `undo()` - відміна останньої дії
- `redo()` - повернення скасованої дії
- `canUndo()` / `canRedo()` - перевірка можливості

**Стан:**
- `undoStack` - стек для відміни
- `redoStack` - стек для повернення

### 4. GridManager (managers/GridManager.js)
**Відповідальність:** Управління сіткою та прив'язкою

**Основні методи:**
- `snapToGrid(pos)` - прив'язка координат до сітки
- `drawGrid()` - малювання сітки
- `setGridSize(size)` - встановлення розміру сітки
- `setSnapEnabled(enabled)` - увімкнення/вимкнення прив'язки

**Стан:**
- `gridSize` - розмір клітинки сітки
- `snapEnabled` - стан прив'язки

### 5. ImportExportManager (managers/ImportExportManager.js)
**Відповідальність:** Імпорт та експорт графів

**Основні методи:**
- `exportToFile()` - експорт у JSON файл
- `importFromFile(file, callback)` - імпорт з JSON файлу
- `exportToString()` / `importFromString()` - робота зі строками

### 6. UIManager (managers/UIManager.js)
**Відповідальність:** Управління користувацьким інтерфейсом

**Основні методи:**
- `setupEventListeners()` - налаштування всіх слухачів подій
- `displayGraphInfo()` - відображення інформації про граф
- `calculateMST()` - обчислення та відображення MST
- `findShortestPath()` - пошук та відображення найкоротшого шляху
- `showLoader()` / `hideLoader()` - управління лоадером

**Залежності:**
- GraphManager
- GridManager
- HistoryManager
- GraphAlgorithms
- ImportExportManager

## Потік даних

1. **Ініціалізація (main.js):**
   - Створення екземплярів всіх класів
   - Передача залежностей між класами
   - Збереження початкового стану

2. **Взаємодія користувача:**
   - UIManager обробляє події
   - Викликає методи GraphManager для зміни графа
   - HistoryManager зберігає стан після кожної зміни

3. **Виконання алгоритмів:**
   - UIManager викликає методи GraphAlgorithms
   - Результати відображаються через UIManager
   - GraphManager підсвічує відповідні елементи

## Переваги модульної архітектури

1. **Розділення відповідальності:** Кожен клас має чітко визначену роль
2. **Легкість тестування:** Модулі можна тестувати окремо
3. **Повторне використання:** Класи можна використовувати в інших проєктах
4. **Масштабованість:** Легко додавати нову функціональність
5. **Підтримка:** Зміни в одному модулі не впливають на інші
6. **Читабельність:** Код організований логічно та зрозуміло

## Точки розширення

1. **Нові алгоритми:** Додавайте методи в GraphAlgorithms
2. **Нові режими роботи:** Розширюйте GraphManager та UIManager
3. **Нові формати експорту:** Розширюйте ImportExportManager
4. **Візуалізація:** Додавайте нові стилі в GraphManager.getGraphStyle()

## Глобальний доступ (для debugging)

Всі модулі доступні через `window.GraphEditorApp`:
```javascript
window.GraphEditorApp = {
  graphManager,
  gridManager,
  historyManager,
  algorithms,
  importExportManager,
  uiManager
}
```
