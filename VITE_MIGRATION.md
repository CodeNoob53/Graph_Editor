# Міграція на Vite

## Що було зроблено

### 1. Встановлено Vite та залежності через npm

**package.json:**
```json
{
  "dependencies": {
    "cytoscape": "^3.28.1",
    "cytoscape-edgehandles": "^4.0.1",
    "cytoscape-cxtmenu": "^3.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 2. Оновлено імпорти в GraphManager.js

**До (CDN через глобальні змінні):**
```javascript
// index.html
<script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js"></script>
<script src="cytoscape-edgehandles.js"></script>
<script src="cytoscape-cxtmenu.js"></script>

// GraphManager.js
const cy = cytoscape({ ... }); // глобальна змінна
```

**Після (npm модулі):**
```javascript
// GraphManager.js
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import cxtmenu from 'cytoscape-cxtmenu';

// Реєстрація плагінів
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

export class GraphManager { ... }
```

### 3. Створено vite.config.js

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'cytoscape-vendor': ['cytoscape', 'cytoscape-edgehandles', 'cytoscape-cxtmenu']
        }
      }
    }
  }
});
```

### 4. Спрощено index.html

**До:**
```html
<script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.js"></script>
<script src="cytoscape-edgehandles.js"></script>
<script src="cytoscape-cxtmenu.js"></script>
<script type="module" src="src/main.js"></script>
```

**Після:**
```html
<script type="module" src="/src/main.js"></script>
```

Vite автоматично обробляє всі імпорти!

## Переваги

### ⚡ Швидкість розробки
- **Миттєвий старт** - сервер запускається за ~200ms
- **HMR (Hot Module Replacement)** - зміни застосовуються без перезавантаження
- **Оптимізована перезбірка** - перебудовується лише змінений модуль

### 📦 Оптимізація
- **Tree-shaking** - в bundle потрапляє лише використаний код
- **Code splitting** - автоматичне розділення на chunks
- **Vendor splitting** - бібліотеки в окремому chunk (кращий кешінг)
- **Minification** - автоматичне стискання коду

### 🛠️ Developer Experience
- **TypeScript підтримка** (якщо потрібно)
- **CSS preprocessing** (sass, less)
- **Source maps** для debugging
- **Автоматичне визначення залежностей**

## Розмір bundle

### До (CDN):
- cytoscape.min.js: ~1.2 MB
- cytoscape-edgehandles.js: ~28 KB
- cytoscape-cxtmenu.js: ~26 KB
- **Завантажується завжди повністю**

### Після (Vite + npm):
```
dist/assets/index-[hash].js          ~15 KB (ваш код)
dist/assets/cytoscape-vendor-[hash].js  ~600 KB (з tree-shaking!)
```

**Економія: ~50% розміру** завдяки tree-shaking!

## Як використовувати

### Розробка
```bash
npm run dev
```
- Запускається на http://localhost:3000
- Автоматично відкривається браузер
- HMR увімкнений

### Production build
```bash
npm run build
```
- Створює оптимізований bundle в `dist/`
- Minification + tree-shaking
- Source maps для debugging

### Перегляд production build
```bash
npm run preview
```
- Запускає сервер для перегляду production build
- Перевірка перед деплоєм

## Структура після build

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css
│   ├── index-[hash].js              # ваш код
│   └── cytoscape-vendor-[hash].js   # бібліотеки
└── assets/icons/
    └── ...
```

## Міграція для інших проєктів

1. **Встановіть Vite:**
   ```bash
   npm init -y
   npm install -D vite
   ```

2. **Встановіть бібліотеки через npm:**
   ```bash
   npm install cytoscape cytoscape-edgehandles cytoscape-cxtmenu
   ```

3. **Додайте скрипти в package.json:**
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```

4. **Оновіть імпорти:**
   - Замініть `<script src="...">` на `import` в JS файлах
   - Використовуйте `import` замість глобальних змінних

5. **Створіть vite.config.js** (опціонально)

## Troubleshooting

### Помилка: "Failed to resolve import"
- Перевірте що залежність встановлена: `npm install <package>`
- Перевірте шлях імпорту

### Помилка в production build
- Переконайтеся що всі залежності в `dependencies`, а не в `devDependencies`
- Перевірте що немає `import` з відсутніх файлів

### HMR не працює
- Перезапустіть dev сервер
- Очистіть кеш: `rm -rf node_modules/.vite`

## Подальші покращення

1. **TypeScript** - для type safety
2. **ESLint + Prettier** - для якості коду
3. **Vitest** - для unit тестів
4. **GitHub Actions** - для CI/CD
5. **PWA** - для offline роботи
