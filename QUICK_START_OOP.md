# Швидкий старт - Graph Editor v2.0

## 🚀 Початок роботи за 2 хвилини

### 1. Запустіть проєкт

```bash
npm run dev
```

Відкрийте: http://localhost:3001/

### 2. Відкрийте консоль браузера

Натисніть `F12` або `Ctrl+Shift+I`

### 3. Спробуйте базові команди

```javascript
// Отримати екземпляр GraphEditor
window.graphEditor

// Отримати Cytoscape
const cy = window.graphEditor.getCytoscape()

// Подивитись стан
window.graphEditor.getState()
```

## 🎨 Робота з графом

### Створення вершин і ребер (через UI)

1. Натисніть кнопку **"Add Node"**
2. Клікніть на полотні для створення вершини
3. Натисніть кнопку **"Add Edge"**
4. Потягніть від однієї вершини до іншої

### Створення програмно

```javascript
const cy = window.graphEditor.getCytoscape()

// Додати вершину
cy.add({
  data: { id: 'v1' },
  position: { x: 100, y: 100 }
})

// Додати ребро
cy.add({
  data: {
    id: 'e1',
    source: 'v1',
    target: 'v2',
    weight: '5'
  }
})

// Зберегти в історію
window.graphEditor.historyManager.saveHistory()
```

## ⏪ Робота з історією (Undo/Redo)

### ⌨️ Через клавіатуру (РЕКОМЕНДОВАНО):
- **Ctrl+Z** - Undo (скасувати)
- **Ctrl+Y** або **Ctrl+Shift+Z** - Redo (повторити)

### 🖱️ Через UI:
- Кнопки **Undo** / **Redo** на панелі

### 💻 Через консоль:

```javascript
// Скасувати останню дію
window.graphEditor.historyManager.undo()

// Повторити скасовану дію
window.graphEditor.historyManager.redo()

// Скільки можна скасувати
window.graphEditor.historyManager.getUndoCount()

// Скільки можна повторити
window.graphEditor.historyManager.getRedoCount()
```

## ⌨️ Клавіатурні скорочення

| Скорочення | Дія |
|------------|-----|
| **Ctrl+Z** | Undo - скасувати останню дію |
| **Ctrl+Y** | Redo - повторити скасовану дію |
| **Ctrl+Shift+Z** | Redo - альтернативний варіант |
| **Delete** або **Backspace** | Видалити вибрані елементи |
| **Escape** | Скасувати виділення |
| **Ctrl+A** | Вибрати всі елементи |

**Примітка:** Шорткати не працюють коли фокус на полях введення (input/textarea).

## 🎯 Режими роботи

```javascript
const ui = window.graphEditor.uiManager

// Режим стрілки (вибір/переміщення)
ui.setMode('arrow')

// Режим додавання вершин
ui.setMode('node')

// Режим додавання ребер
ui.setMode('edge')
```

## 🧮 Алгоритми

### MST (Мінімальне остовне дерево)

```javascript
// Через UI: кнопка "Calculate MST"

// Через консоль:
import { calculatePrimMST } from './src/algorithms/mst.js'
const result = calculatePrimMST(cy)
console.log(result.mst) // [{source, target, weight}, ...]
```

### Найкоротший шлях

```javascript
// Через UI:
// 1. Введіть source node в input
// 2. Введіть target node в input
// 3. Натисніть "Find Path"

// Через консоль:
import { findShortestPath } from './src/algorithms/shortestPath.js'
const result = findShortestPath(cy, 'v0', 'v3')
console.log(result.path)     // ['v0', 'v1', 'v3']
console.log(result.distance) // 10
```

## 💾 Експорт/Імпорт

### Експорт графа

```javascript
// Через UI: кнопка "Export"

// Через консоль:
const graphData = cy.json()
const json = JSON.stringify(graphData, null, 2)
console.log(json)

// Або експортувати тільки важливі дані
const state = window.graphEditor.historyManager.getMinimalState()
console.log(JSON.stringify(state, null, 2))
```

### Імпорт графа

```javascript
// Через UI: кнопка "Import" → вибрати файл

// Через консоль:
const graphData = { /* ваші дані */ }
cy.json(graphData)
window.graphEditor.historyManager.saveHistory()
```

## 🔧 Налаштування

### Змінити розмір сітки

```javascript
window.graphEditor.getState().gridSize = 100
cy.emit('render') // Оновити відображення
```

### Увімкнути/вимкнути snap-to-grid

```javascript
window.graphEditor.getState().snapEnabled = false
```

### Змінити тип графа

```javascript
// Орієнтований
window.graphEditor.getState().isDirected = true
window.graphEditor.updateEdgeStyle()

// Неорієнтований
window.graphEditor.getState().isDirected = false
window.graphEditor.updateEdgeStyle()
```

## 🧪 Тестування історії

Відкрийте: http://localhost:3001/test-history.html

Натисніть **"Запустити всі тести"** для перевірки роботи HistoryManager.

## 📊 Корисні команди для дебагу

```javascript
// Інформація про граф
console.log({
  nodes: cy.nodes().length,
  edges: cy.edges().length,
  undoCount: window.graphEditor.historyManager.getUndoCount(),
  redoCount: window.graphEditor.historyManager.getRedoCount()
})

// Поточний стан
console.log(window.graphEditor.getState())

// Мінімальний стан (те що зберігається)
console.log(window.graphEditor.historyManager.getMinimalState())

// Вивести всі вершини
cy.nodes().forEach(node => {
  console.log(node.id(), node.position())
})

// Вивести всі ребра
cy.edges().forEach(edge => {
  console.log(
    edge.id(),
    edge.source().id(), '→',
    edge.target().id(),
    edge.data('weight')
  )
})
```

## ⌨️ Додавання власних гарячих клавіш

Базові шорткати вже вбудовані (див. вище). Але ви можете додати свої власні:

```javascript
// Додати власний обробник клавіатури
document.addEventListener('keydown', (e) => {
  // Ігноруємо якщо фокус на input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return
  }

  // Ctrl+S - зберегти граф
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    const graphData = cy.json()
    localStorage.setItem('my-graph', JSON.stringify(graphData))
    console.log('Граф збережено!')
  }

  // Ctrl+O - завантажити граф
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault()
    const saved = localStorage.getItem('my-graph')
    if (saved) {
      cy.json(JSON.parse(saved))
      window.graphEditor.historyManager.saveHistory()
      console.log('Граф завантажено!')
    }
  }
})
```

## 🎓 Приклад повного workflow

```javascript
// 1. Створити граф
const cy = window.graphEditor.getCytoscape()

cy.add([
  { data: { id: 'v0' }, position: { x: 100, y: 100 } },
  { data: { id: 'v1' }, position: { x: 300, y: 100 } },
  { data: { id: 'v2' }, position: { x: 200, y: 300 } }
])

cy.add([
  { data: { id: 'e1', source: 'v0', target: 'v1', weight: '5' } },
  { data: { id: 'e2', source: 'v1', target: 'v2', weight: '3' } },
  { data: { id: 'e3', source: 'v2', target: 'v0', weight: '7' } }
])

window.graphEditor.historyManager.saveHistory()

// 2. Знайти найкоротший шлях
import { findShortestPath } from './src/algorithms/shortestPath.js'
const path = findShortestPath(cy, 'v0', 'v2')
console.log('Шлях:', path.path.join(' → '))
console.log('Відстань:', path.distance)

// 3. Обчислити MST
import { calculatePrimMST } from './src/algorithms/mst.js'
const mst = calculatePrimMST(cy)
console.log('MST:', mst.mst)
console.log('Вага:', mst.mst.reduce((sum, e) => sum + e.weight, 0))

// 4. Експортувати
const state = window.graphEditor.historyManager.getMinimalState()
localStorage.setItem('my-graph', JSON.stringify(state))

// 5. Імпортувати пізніше
const saved = JSON.parse(localStorage.getItem('my-graph'))
window.graphEditor.historyManager.applyState(saved)
window.graphEditor.historyManager.saveHistory()
```

## 📚 Подальше навчання

1. **Основи:** Прочитайте [README.md](./README.md)
2. **Класи:** Вивчіть [CLASS_STRUCTURE.md](./CLASS_STRUCTURE.md)
3. **Історія:** Ознайомтесь з [HISTORY_MANAGER.md](./HISTORY_MANAGER.md)
4. **Зміни:** Перегляньте [CHANGELOG_OOP.md](./CHANGELOG_OOP.md)
5. **Підсумок:** Прочитайте [SUMMARY.md](./SUMMARY.md)

## ❓ Поширені питання

### Як додати свою кнопку?

```javascript
// Додайте в HTML
<button id="myButton">My Action</button>

// Додайте обробник в UIManager або через консоль
document.getElementById('myButton').addEventListener('click', () => {
  // Ваш код
  console.log('Button clicked!')
})
```

### Як змінити стилі вершин?

Редагуйте `src/config/cytoscapeStyles.js`

### Як очистити історію?

```javascript
window.graphEditor.historyManager.clear()
```

### Як збільшити ліміт історії?

```javascript
window.graphEditor.historyManager.maxStackSize = 100
```

## 🆘 Якщо щось не працює

1. Перевірте консоль на помилки
2. Переконайтесь що всі залежності встановлені (`npm install`)
3. Перезапустіть dev server (`npm run dev`)
4. Очистіть кеш браузера (`Ctrl+Shift+R`)

---

**Готово!** Тепер ви готові працювати з Graph Editor v2.0! 🎉

Для детальної інформації дивіться повну документацію в [CLASS_STRUCTURE.md](./CLASS_STRUCTURE.md)
