# HistoryManager - Управління історією змін

## Огляд

`HistoryManager` - це клас для управління історією змін графа з підтримкою операцій undo/redo. Оптимізований для збереження тільки важливих даних.

## Що зберігається в історії

Замість збереження повного JSON графа, зберігаються **тільки важливі дані**:

### Вершини (Nodes)
- `id` - унікальний ідентифікатор
- `position.x` - координата X
- `position.y` - координата Y

### Ребра (Edges)
- `id` - унікальний ідентифікатор
- `source` - id вихідної вершини
- `target` - id цільової вершини
- `weight` - вага ребра (якщо встановлена)

## Що НЕ зберігається

- Тимчасові вершини та ребра (з класами `eh-ghost`, `eh-preview-active`, `eh-preview`)
- Стилі (вони застосовуються автоматично з конфігурації)
- Стан виділення
- Класи елементів
- Інші метадані Cytoscape

## Переваги

### 1. **Ефективність пам'яті**
Мінімальне збереження даних зменшує використання пам'яті в 5-10 разів порівняно зі збереженням повного JSON.

**Приклад:**
```javascript
// Старий підхід (повний JSON ~2KB на стан)
{
  elements: { ... },
  style: [ ... ],
  pan: { ... },
  zoom: 1,
  // багато іншої інформації
}

// Новий підхід (~200 bytes на стан)
{
  nodes: [
    { data: { id: 'v0' }, position: { x: 100, y: 200 } }
  ],
  edges: [
    { data: { id: 'e1', source: 'v0', target: 'v1', weight: '5' } }
  ]
}
```

### 2. **Розумне зберігання**
- Автоматично пропускає дублікати (якщо стан не змінився)
- Обмеження стеку (максимум 50 станів)
- Фільтрація тимчасових елементів

### 3. **Точність**
Зберігає тільки те, що дійсно потрібно для відновлення графа.

## API

### Основні методи

#### `saveHistory()`
Зберігає поточний стан графа в історію.

```javascript
historyManager.saveHistory();
```

**Коли викликається:**
- Після створення вершини
- Після створення ребра
- Після переміщення вершини
- Після зміни ваги ребра
- Після імпорту графа
- Після очищення графа

#### `undo()`
Скасовує останню дію.

```javascript
historyManager.undo();
```

#### `redo()`
Повторює скасовану дію.

```javascript
historyManager.redo();
```

### Допоміжні методи

#### `getMinimalState()`
Отримує мінімальний стан графа.

```javascript
const state = historyManager.getMinimalState();
// { nodes: [...], edges: [...] }
```

#### `applyState(state)`
Застосовує збережений стан до графа.

```javascript
const state = historyManager.getMinimalState();
historyManager.applyState(state);
```

#### `clear()`
Очищує історію (і undo, і redo стеки).

```javascript
historyManager.clear();
```

#### `getUndoCount()`
Отримує кількість доступних undo операцій.

```javascript
const undoCount = historyManager.getUndoCount();
console.log(`Можна скасувати ${undoCount} дій`);
```

#### `getRedoCount()`
Отримує кількість доступних redo операцій.

```javascript
const redoCount = historyManager.getRedoCount();
console.log(`Можна повторити ${redoCount} дій`);
```

#### `statesAreDifferent(state1, state2)`
Перевіряє чи відрізняються два стани.

```javascript
const isDifferent = historyManager.statesAreDifferent(state1, state2);
```

## Налаштування

### Розмір стеку історії

За замовчуванням зберігається максимум 50 станів. Можна змінити:

```javascript
historyManager.maxStackSize = 100; // Зберігати 100 станів
```

## Приклади використання

### Базове використання

```javascript
// Створити вершину
cy.add({ data: { id: 'v0' }, position: { x: 100, y: 100 } });
historyManager.saveHistory();

// Скасувати
historyManager.undo(); // Вершина видалена

// Повторити
historyManager.redo(); // Вершина знову з'явилася
```

### Перевірка можливості undo/redo

```javascript
// Показати/приховати кнопки
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');

function updateButtons() {
  undoButton.disabled = historyManager.getUndoCount() === 0;
  redoButton.disabled = historyManager.getRedoCount() === 0;
}

// Викликати після кожної зміни
historyManager.saveHistory();
updateButtons();
```

### Експорт/імпорт історії

```javascript
// Експорт поточного стану
const currentState = historyManager.getMinimalState();
const json = JSON.stringify(currentState);
localStorage.setItem('graph', json);

// Імпорт збереженого стану
const json = localStorage.getItem('graph');
const state = JSON.parse(json);
historyManager.applyState(state);
historyManager.saveHistory();
```

## Внутрішня структура

### Стеки

```javascript
{
  undoStack: [state1, state2, state3], // Історія (старі стани)
  redoStack: [state4, state5]          // Скасовані дії
}
```

### Життєвий цикл операцій

**Створення вершини:**
```
1. Користувач клікає
2. EventManager створює вершину
3. EventManager викликає saveHistory()
4. HistoryManager зберігає новий стан
5. RedoStack очищується
```

**Undo:**
```
1. Користувач натискає Undo
2. Поточний стан переміщується з undoStack в redoStack
3. Застосовується попередній стан з undoStack
```

**Redo:**
```
1. Користувач натискає Redo
2. Стан переміщується з redoStack в undoStack
3. Застосовується цей стан
```

## Оптимізації

### 1. Уникнення дублікатів
```javascript
// Якщо новий стан ідентичний попередньому - не зберігаємо
if (!this.statesAreDifferent(newState, lastState)) {
  return;
}
```

### 2. Обмеження пам'яті
```javascript
// Видаляємо найстаріший стан якщо досягли ліміту
if (this.undoStack.length >= this.maxStackSize) {
  this.undoStack.shift();
}
```

### 3. Фільтрація тимчасових елементів
```javascript
// Пропускаємо елементи з класами eh-ghost, eh-preview тощо
if (classes.includes('eh-ghost')) {
  return null;
}
```

## Тестування

### Перевірка базових операцій

```javascript
// 1. Порожній граф
console.assert(historyManager.getUndoCount() === 0);

// 2. Додати вершину
cy.add({ data: { id: 'v0' }, position: { x: 100, y: 100 } });
historyManager.saveHistory();
console.assert(historyManager.getUndoCount() === 1);

// 3. Undo
historyManager.undo();
console.assert(cy.nodes().length === 0);
console.assert(historyManager.getRedoCount() === 1);

// 4. Redo
historyManager.redo();
console.assert(cy.nodes().length === 1);
console.assert(historyManager.getRedoCount() === 0);
```

## Порівняння з попередньою версією

| Характеристика | Старий підхід | Новий підхід |
|----------------|---------------|--------------|
| Розмір даних | ~2-5 KB на стан | ~200-500 bytes |
| Швидкість | Повільніше | Швидше |
| Дублікати | Можливі | Фільтруються |
| Тимчасові елементи | Зберігаються | Фільтруються |
| Ліміт історії | Немає | 50 станів |
| Порівняння станів | Немає | Є |

## Рекомендації

1. **Викликайте saveHistory() після кожної значущої зміни**
2. **Не викликайте занадто часто** (наприклад, під час перетягування)
3. **Використовуйте getUndoCount/getRedoCount** для UI
4. **Розгляньте збільшення maxStackSize** для складних графів
5. **Очищайте історію** після імпорту нового графа

## Відомі обмеження

- Не зберігає стан виділення елементів
- Не зберігає положення камери (pan/zoom)
- Не зберігає кастомні класи елементів
- Максимум 50 станів за замовчуванням

## Майбутні покращення

- [ ] Додати debounce для часто викликаних операцій
- [ ] Збереження історії в localStorage
- [ ] Групування операцій (batch undo)
- [ ] Назви для станів історії
- [ ] Візуалізація історії
