# Аналіз використання Cytoscape.js та рекомендації для покращення

**Дата аналізу**: 2025-11-22
**Версія Cytoscape.js**: 3.33.1 (за package.json)

---

## 📊 Огляд

Проведено аналіз використання бібліотеки Cytoscape.js у проекті Graph_Editor. Виявлено **8 основних проблем** та запропоновано рішення для покращення продуктивності, читабельності коду та користувацького досвіду.

---

## 🔴 Критичні проблеми

### 1. **Відсутність підтримки кратних ребер (Multi-edges)**

**Проблема:**
```javascript
// src/config/cytoscapeStyles.js:27
'curve-style': 'bezier'
```

Коли між двома вершинами існує 2+ ребра, вони накладаються одне на одне, оскільки використовується `bezier` curve-style.

**Рекомендація згідно з документацією:**
```javascript
// Для автоматичного розташування кратних ребер
selector: 'edge',
style: {
  'curve-style': 'unbundled-bezier',  // або 'haystack' для великих графів
  'control-point-distances': [40, -40],
  'control-point-weights': [0.5]
}

// Для петель (self-loops)
selector: 'edge[source = target]',
style: {
  'curve-style': 'bezier',
  'loop-direction': '0deg',
  'loop-sweep': '90deg'
}
```

**Посилання:**
- [Edge curve-style](https://js.cytoscape.org/#style/edge-line)
- [Multi-edges handling](https://js.cytoscape.org/#style/multiple-edges)

---

### 2. **Неефективне використання колекцій**

**Проблема:**
```javascript
// src/modules/eventHandlers.js:62
const isTooClose = this.cy.nodes().some((node) => {
  // перевірка відстані
});

// src/modules/eventHandlers.js:136
const duplicateEdge = this.cy.edges().some(existingEdge => {
  // перевірка дублікату
});
```

Кожен виклик `cy.nodes()` або `cy.edges()` створює нову колекцію, що неефективно при частих викликах.

**Рекомендація:**
```javascript
// Кешувати колекції якщо використовуються в циклах
const nodes = this.cy.nodes();
const isTooClose = nodes.some((node) => {
  // перевірка відстані
});

// АБО використовувати ітератор напряму
let isTooClose = false;
this.cy.nodes().forEach(node => {
  if (checkDistance(node, position) < threshold) {
    isTooClose = true;
    return false; // припинити ітерацію
  }
});
```

**Посилання:**
- [Collections](https://js.cytoscape.org/#collection)
- [Performance tips](https://js.cytoscape.org/#performance)

---

### 3. **Відсутність Batch операцій**

**Проблема:**
```javascript
// src/modules/eventHandlers.js:84-88
clearSelection() {
  this.cy.$('.selected').removeClass('selected');
  this.cy.$('.highlighted').removeClass('highlighted');
  this.state.selectedNodeId = null;
  this.cy.elements().removeClass('active-node');
  this.cy.elements().removeClass('active-edge');
}
```

Кожна операція `addClass`/`removeClass` викликає оновлення рендерингу.

**Рекомендація:**
```javascript
clearSelection() {
  this.cy.startBatch();
  this.cy.$('.selected').removeClass('selected');
  this.cy.$('.highlighted').removeClass('highlighted');
  this.cy.elements().removeClass('active-node active-edge');
  this.cy.endBatch();
  this.state.selectedNodeId = null;
}
```

**Переваги:**
- Рендеринг відбувається лише один раз після `endBatch()`
- Значне покращення продуктивності при багатьох змінах
- Згідно з документацією - обов'язково для масових операцій

**Посилання:**
- [Batch operations](https://js.cytoscape.org/#cy.batch)

---

### 4. **Неефективні селектори**

**Проблема:**
```javascript
// src/utils/highlight.js:8
cy.$(`#${nodeId}`).addClass('highlighted');

// src/modules/eventHandlers.js:130
const isPreview = this.cy.$(`edge[source="${edge.source}"][target="${edge.target}"].eh-preview`).length > 0;
```

`cy.$()` - універсальний селектор, повільніший ніж спеціалізовані методи.

**Рекомендація:**
```javascript
// Для ID - використовувати cy.getElementById()
cy.getElementById(nodeId).addClass('highlighted');

// Для складних селекторів - використовувати cy.filter()
const isPreview = this.cy.edges()
  .filter(e => e.data('source') === edge.source &&
               e.data('target') === edge.target &&
               e.hasClass('eh-preview'))
  .length > 0;
```

**Посилання:**
- [Core methods](https://js.cytoscape.org/#core/graph-manipulation)
- [Selectors performance](https://js.cytoscape.org/#selectors/performance)

---

## ⚠️ Важливі проблеми

### 5. **Множинні виклики cy.elements()**

**Проблема:**
```javascript
// src/utils/history.js:66
this.cy.elements().remove();

// src/modules/uiHandlers.js:75
this.cy.elements().remove();

// src/modules/eventHandlers.js:87-88
this.cy.elements().removeClass('active-node');
this.cy.elements().removeClass('active-edge');
```

**Рекомендація:**
```javascript
// Об'єднати класи в один виклик
this.cy.elements().removeClass('active-node active-edge');

// АБО зберегти колекцію
const elements = this.cy.elements();
elements.removeClass('active-node');
elements.removeClass('active-edge');
```

---

### 6. **Відсутність debounce для частих операцій**

**Проблема:**
```javascript
// src/modules/eventHandlers.js:96-108
this.cy.on('free', 'node', (evt) => {
  // ...
  this.historyManager.saveHistory(); // викликається при кожному переміщенні
});
```

При перетягуванні вершини історія зберігається багато разів.

**Рекомендація:**
```javascript
import _ from 'lodash'; // вже є в package.json

setupDragEvents() {
  const debouncedSave = _.debounce(() => {
    this.historyManager.saveHistory();
  }, 300);

  this.cy.on('free', 'node', (evt) => {
    const node = evt.target;

    if (this.state.snapEnabled) {
      const pos = node.position();
      const snappedPos = snapToGrid(pos, this.state.gridSize);
      node.position(snappedPos);
    }

    debouncedSave();
  });
}
```

**Посилання:**
- [Lodash debounce](https://lodash.com/docs/#debounce)

---

### 7. **Відсутність оптимізацій для великих графів**

**Проблема:**
Немає налаштувань для великих графів (100+ вершин).

**Рекомендація:**
```javascript
// src/config/cytoscapeConfig.js
export function initCytoscape(container) {
  const cy = cytoscape({
    container,

    // Вимкнути текстури для кращої продуктивності
    textureOnViewport: false,

    // Використовувати менш точний, але швидший рендеринг
    hideEdgesOnViewport: true,
    hideLabelsOnViewport: true,

    // Pixel ratio для чіткості
    pixelRatio: 'auto',

    // Motion blur для плавності
    motionBlur: true,

    // Wheelзум чутливість
    wheelSensitivity: 0.1,

    style: cytoscapeStyles
  });

  return cy;
}
```

**Посилання:**
- [Performance optimizations](https://js.cytoscape.org/#init-opts/rendering)

---

### 8. **Відсутність валідації позицій**

**Проблема:**
```javascript
// src/modules/eventHandlers.js:74
this.cy.add({
  group: "nodes",
  data: { id: `v${this.state.nodeCount++}` },
  position: finalPosition, // може бути Infinity або NaN
});
```

**Рекомендація:**
```javascript
handleNodeCreation(position) {
  // Валідація позиції
  if (!position || !isFinite(position.x) || !isFinite(position.y)) {
    console.error('Invalid position:', position);
    return;
  }

  const isTooClose = this.cy.nodes().some((node) => {
    const nodePos = node.position();
    const distance = Math.hypot(nodePos.x - position.x, nodePos.y - position.y);
    return distance < this.state.nodeRadius;
  });

  if (!isTooClose) {
    let finalPosition = position;
    if (this.state.snapEnabled) {
      finalPosition = snapToGrid(position, this.state.gridSize);
    }

    this.cy.add({
      group: "nodes",
      data: { id: `v${this.state.nodeCount++}` },
      position: finalPosition,
    });
    this.historyManager.saveHistory();
  }
}
```

---

## 💡 Додаткові рекомендації

### 9. **Використання Layout для auto-positioning**

```javascript
// Можна додати кнопку "Auto Layout"
autoLayout() {
  this.cy.layout({
    name: 'cose', // або 'breadthfirst', 'circle', 'grid'
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 30
  }).run();
}
```

### 10. **Експорт/Імпорт графів**

```javascript
// Експорт графу в JSON
exportGraph() {
  return this.cy.json();
}

// Імпорт графу з JSON
importGraph(json) {
  this.cy.json(json);
}

// Експорт як PNG
exportPNG() {
  const png = this.cy.png({
    full: true,
    scale: 2
  });
  // Завантажити або показати
  const link = document.createElement('a');
  link.href = png;
  link.download = 'graph.png';
  link.click();
}
```

---

## 📈 Пріоритети впровадження

### Високий пріоритет (критично)
1. ✅ **Кратні ребра** - curve-style для багатьох ребер
2. ✅ **Batch операції** - для покращення продуктивності
3. ✅ **Ефективні селектори** - cy.getElementById() замість cy.$()

### Середній пріоритет (важливо)
4. ✅ **Кешування колекцій** - зменшення викликів cy.nodes()/cy.edges()
5. ✅ **Debounce** - для saveHistory та інших частих операцій
6. ✅ **Валідація** - перевірка позицій та даних

### Низький пріоритет (опціонально)
7. 💡 **Оптимізації для великих графів**
8. 💡 **Auto-layout**
9. 💡 **Експорт/Імпорт**

---

## 🔧 Приклад застосування всіх покращень

### До:
```javascript
clearSelection() {
  this.cy.$('.selected').removeClass('selected');
  this.cy.$('.highlighted').removeClass('highlighted');
  this.state.selectedNodeId = null;
  this.cy.elements().removeClass('active-node');
  this.cy.elements().removeClass('active-edge');
}
```

### Після:
```javascript
clearSelection() {
  this.cy.startBatch();

  // Використовуємо cy.elements() один раз
  const elements = this.cy.elements();

  // Об'єднуємо класи
  elements.removeClass('selected highlighted active-node active-edge');

  this.cy.endBatch();

  this.state.selectedNodeId = null;
}
```

---

## 📚 Корисні посилання

- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [Performance Guide](https://blog.js.cytoscape.org/2020/05/11/performance/)
- [API Reference](https://js.cytoscape.org/#core)
- [Styling Guide](https://js.cytoscape.org/#style)
- [Extensions](https://js.cytoscape.org/#extensions)

---

**Підготовлено**: Claude AI
**Дата**: 2025-11-22
