# Керівництво по стилізації Graph Editor

## Структура стилів

### 1. CSS Змінні (styles.css)

Всі кольори, відступи та розміри винесені в CSS змінні для легкої зміни теми:

```css
:root {
  /* Кольори */
  --color-bg-primary: #1e1e1e;
  --color-bg-secondary: #252526;
  --color-text: #d4d4d4;
  --color-button-bg: #3c3c3c;
  --color-button-hover: #505050;

  /* Розміри */
  --graph-width: 800px;
  --graph-height: 600px;
  --spacing-md: 20px;

  /* Шрифти */
  --font-family: Consolas, "Courier New", monospace;
  --font-size-md: 14px;
}
```

### 2. Стилі Cytoscape (src/styles/graph-styles.js)

Стилі графа винесені в окремий ES6 модуль:

```javascript
// src/styles/graph-styles.js
export const graphStyles = [
  {
    selector: 'node',
    style: {
      'background-color': '#5F8670',
      'label': 'data(id)',
      'width': 38,
      // ...
    }
  },
  // ...
];
```

## Зміна теми

### Варіант 1: Через CSS змінні

Створіть власний CSS файл:

```css
/* custom-theme.css */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text: #000000;
  --color-button-bg: #e0e0e0;
}
```

Підключіть після основного styles.css:

```html
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="custom-theme.css">
```

### Варіант 2: Через JavaScript для Cytoscape

Створіть власну тему:

```javascript
// src/styles/custom-graph-theme.js
export const customGraphStyles = [
  {
    selector: 'node',
    style: {
      'background-color': '#3498db',  // Синій
      'border-color': '#2980b9',
      // ...
    }
  }
];
```

Використайте в GraphManager:

```javascript
import { customGraphStyles } from '../styles/custom-graph-theme.js';

// У конструкторі або методі
this.cy.style(customGraphStyles);
```

### Варіант 3: Динамічна зміна теми

```javascript
import { createCustomStyles, graphTheme } from './styles/graph-styles.js';

// Створіть кастомну тему
const myTheme = {
  node: {
    default: '#3498db',
    highlighted: '#e74c3c',
  },
  edge: {
    default: '#2ecc71',
  }
};

// Застосуйте
const customStyles = createCustomStyles(myTheme);
cy.style(customStyles);
```

## Структура стилів

### styles.css
- **Глобальні змінні** - кольори, розміри, шрифти
- **Layout** - структура сторінки, контейнери
- **UI елементи** - кнопки, inputs, контроли
- **Responsive** - адаптивність під різні екрани

### src/styles/graph-styles.js
- **Вузли (nodes)** - стилі вершин графа
- **Ребра (edges)** - стилі ребер
- **Стани** - highlighted, active, hover
- **Плагіни** - edgehandles, cxtmenu

## Приклади кастомізації

### Світла тема

```css
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #e9ecef;
  --color-border: #dee2e6;
  --color-text: #212529;
  --color-button-bg: #e9ecef;
  --color-button-hover: #dee2e6;
}
```

### Збільшений розмір графа

```css
:root {
  --graph-width: 1200px;
  --graph-height: 800px;
}
```

### Кастомні кольори вузлів

```javascript
export const blueTheme = [
  {
    selector: 'node',
    style: {
      'background-color': '#3498db',
      'border-color': '#2980b9',
      'color': '#ffffff',
    }
  },
  {
    selector: 'node.highlighted',
    style: {
      'background-color': '#e74c3c',
      'border-color': '#c0392b',
    }
  }
];
```

## CSS Class Naming Convention

Використовуємо **BEM** (Block Element Modifier):

- `.block` - основний блок
- `.block__element` - елемент блоку
- `.block--modifier` - модифікатор блоку

Приклад:
```css
.header { }                  /* Блок */
.header__logo { }            /* Елемент */
.header__button { }          /* Елемент */
.header__button--active { }  /* Модифікатор */
```

## Зворотня сумісність

Для підтримки існуючого коду, старі ID селектори підтримуються:

```css
/* Старий код */
#cy { }
#header { }
#controls { }

/* Використовуйте CSS змінні */
#cy {
  width: var(--graph-width);
  height: var(--graph-height);
}
```

## Performance Tips

1. **Використовуйте CSS змінні** для динамічних змін замість inline styles
2. **Групуйте селектори** для зменшення повторень
3. **Уникайте !important** - використовуйте специфічність
4. **Мінімізуйте animations** на складних графах

## Debugging стилів

### Chrome DevTools

1. Відкрийте DevTools (F12)
2. Знайдіть елемент (Ctrl+Shift+C)
3. Перевірте обчислені стилі (Computed)
4. Змініть CSS змінні в реальному часі

### Cytoscape стилі

```javascript
// У консолі браузера
cy.style().json()  // Переглянути всі стилі
cy.$('node').style()  // Стилі вузлів
cy.$('edge').style()  // Стилі ребер
```

## Приклад: Повна зміна теми

```javascript
// theme-manager.js
export class ThemeManager {
  static applyDarkTheme() {
    document.documentElement.style.setProperty('--color-bg-primary', '#1e1e1e');
    document.documentElement.style.setProperty('--color-text', '#d4d4d4');
  }

  static applyLightTheme() {
    document.documentElement.style.setProperty('--color-bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--color-text', '#000000');
  }

  static applyGraphTheme(cy, theme) {
    cy.style(theme);
  }
}

// Використання
import { ThemeManager } from './theme-manager.js';
import { darkGraphTheme, lightGraphTheme } from './graph-themes.js';

// Перемкнути тему
ThemeManager.applyLightTheme();
ThemeManager.applyGraphTheme(cy, lightGraphTheme);
```

## Додаткові ресурси

- [Cytoscape.js Style Documentation](https://js.cytoscape.org/#style)
- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [BEM Methodology](http://getbem.com/)
