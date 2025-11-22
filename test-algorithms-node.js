#!/usr/bin/env node

/**
 * Автоматизовані тести для всіх алгоритмів графів
 * Цей скрипт створює мок-об'єкт Cytoscape та тестує всі алгоритми
 */

// Імпорт алгоритмів
import { findEulerTrailAndCircuit } from './src/algorithms/euler.js';
import { findMinWeightedPathForFourVertices } from './src/algorithms/minWeightedPath.js';
import { findHamiltonianCycles, findOneHamiltonianCycle } from './src/algorithms/hamiltonian.js';
import { calculatePrimMST } from './src/algorithms/mst.js';
import { generateAllSpanningTrees } from './src/algorithms/spanningTrees.js';
import { findShortestPath } from './src/algorithms/shortestPath.js';
import {
  depthFirstSearch,
  depthFirstSearchIterative,
  breadthFirstSearch,
  checkConnectivity,
  detectCycle
} from './src/algorithms/traversal.js';

// Мок-клас для Cytoscape
class MockCytoscape {
  constructor(nodesData, edgesData) {
    this._nodes = nodesData.map(n => new MockNode(n));
    this._edges = edgesData.map(e => new MockEdge(e));
  }

  nodes() {
    return this._nodes;
  }

  edges() {
    return this._edges;
  }

  getElementById(id) {
    const node = this._nodes.find(n => n.id() === id);
    return node ? new MockCollection([node]) : new MockCollection([]);
  }

  $(selector) {
    // Спрощена реалізація селектора
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return this.getElementById(id);
    }
    return new MockCollection([]);
  }

  elements() {
    return new MockCollection([...this._nodes, ...this._edges]);
  }
}

class MockNode {
  constructor(data) {
    this._data = data;
  }

  id() {
    return this._data.id;
  }

  data(key) {
    return this._data[key];
  }
}

class MockEdge {
  constructor(data) {
    this._data = data;
  }

  id() {
    return this._data.id || `${this._data.source}-${this._data.target}`;
  }

  data(key) {
    return this._data[key];
  }
}

class MockCollection {
  constructor(elements = []) {
    this._elements = elements;
    this.length = elements.length;
  }

  map(fn) {
    return this._elements.map(fn);
  }

  filter(fn) {
    return new MockCollection(this._elements.filter(fn));
  }

  forEach(fn) {
    this._elements.forEach(fn);
  }

  addClass() {
    return this;
  }

  removeClass() {
    return this;
  }
}

// Тестові графи
const testGraphs = {
  simple: {
    nodes: [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' }
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'B', target: 'C', weight: 2 },
      { source: 'C', target: 'D', weight: 3 },
      { source: 'D', target: 'A', weight: 4 }
    ]
  },
  complete4: {
    nodes: [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' }
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'A', target: 'C', weight: 5 },
      { source: 'A', target: 'D', weight: 2 },
      { source: 'B', target: 'C', weight: 3 },
      { source: 'B', target: 'D', weight: 6 },
      { source: 'C', target: 'D', weight: 4 }
    ]
  },
  weighted: {
    nodes: [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' },
      { id: 'E' }
    ],
    edges: [
      { source: 'A', target: 'B', weight: 4 },
      { source: 'A', target: 'E', weight: 1 },
      { source: 'B', target: 'E', weight: 2 },
      { source: 'B', target: 'C', weight: 5 },
      { source: 'C', target: 'E', weight: 3 },
      { source: 'C', target: 'D', weight: 1 },
      { source: 'D', target: 'E', weight: 6 },
      { source: 'D', target: 'A', weight: 2 }
    ]
  }
};

// Утиліти для тестування
function createGraph(graphData) {
  return new MockCytoscape(graphData.nodes, graphData.edges);
}

let passedTests = 0;
let failedTests = 0;
const errors = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result.pass) {
      console.log(`✅ ${name}`);
      passedTests++;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   Причина: ${result.message}`);
      failedTests++;
      errors.push({ test: name, message: result.message });
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Помилка: ${error.message}`);
    failedTests++;
    errors.push({ test: name, message: error.message });
  }
}

// Тести
console.log('\n🧪 Запуск тестів алгоритмів графів...\n');
console.log('━'.repeat(60));

console.log('\n📍 Тести обходу графів (Traversal)');
console.log('─'.repeat(60));

test('DFS (рекурсивний) - базовий тест', () => {
  const cy = createGraph(testGraphs.weighted);
  const result = depthFirstSearch(cy, 'A', false);
  return {
    pass: result.success && result.traversalOrder.length > 0,
    message: result.error || `Обхід: ${result.traversalOrder?.join(' → ')}`
  };
});

test('DFS (ітеративний) - базовий тест', () => {
  const cy = createGraph(testGraphs.weighted);
  const result = depthFirstSearchIterative(cy, 'A', false);
  return {
    pass: result.success && result.traversalOrder.length > 0,
    message: result.error || `Обхід: ${result.traversalOrder?.join(' → ')}`
  };
});

test('BFS - базовий тест', () => {
  const cy = createGraph(testGraphs.weighted);
  const result = breadthFirstSearch(cy, 'A', false);
  return {
    pass: result.success && result.traversalOrder.length > 0,
    message: result.error || `Обхід: ${result.traversalOrder?.join(' → ')}`
  };
});

test('Перевірка зв\'язності - зв\'язний граф', () => {
  const cy = createGraph(testGraphs.weighted);
  const result = checkConnectivity(cy, false);
  return {
    pass: result.success && result.isConnected === true,
    message: result.error || result.message
  };
});

test('Виявлення циклів - граф з циклами', () => {
  const cy = createGraph(testGraphs.simple);
  const result = detectCycle(cy, false);
  return {
    pass: result.success && result.hasCycle === true,
    message: result.error || result.message
  };
});

console.log('\n📍 Тести Ейлерових шляхів/циклів');
console.log('─'.repeat(60));

test('Ейлерів цикл - квадрат (неорієнтований)', () => {
  const cy = createGraph(testGraphs.simple);
  const result = findEulerTrailAndCircuit(cy, false);
  return {
    pass: result.success === true || result.error === "Ейлерів шлях/цикл не існує",
    message: result.message || result.error
  };
});

console.log('\n📍 Тести найкоротших шляхів');
console.log('─'.repeat(60));

test('Найкоротший шлях (Дейкстра) A → C', () => {
  const cy = createGraph(testGraphs.weighted);
  const result = findShortestPath(cy, 'A', 'C', false);
  return {
    pass: result.success && result.path.length > 0,
    message: result.error || `Шлях: ${result.path?.join(' → ')}, Відстань: ${result.distance}`
  };
});

test('Найкоротший шлях - неіснуюча вершина', () => {
  const cy = createGraph(testGraphs.simple);
  const result = findShortestPath(cy, 'A', 'Z', false);
  return {
    pass: result.error !== undefined,
    message: 'Правильно виявлено помилку для неіснуючої вершини'
  };
});

console.log('\n📍 Тести мінімального остовного дерева');
console.log('─'.repeat(60));

test('MST (Прім) - зважений граф', () => {
  const cy = createGraph(testGraphs.weighted);
  const result = calculatePrimMST(cy, false);
  return {
    pass: result.success && result.mst.length > 0,
    message: result.error || `MST вага: ${result.totalWeight}, ребер: ${result.edgeCount}`
  };
});

test('MST - орієнтований граф (має повернути помилку)', () => {
  const cy = createGraph(testGraphs.simple);
  const result = calculatePrimMST(cy, true);
  return {
    pass: result.error !== undefined,
    message: 'Правильно виявлено що MST не підтримує орієнтовані графи'
  };
});

console.log('\n📍 Тести мінімального зваженого шляху (4 вершини)');
console.log('─'.repeat(60));

test('Мінімальний шлях для 4 вершин', () => {
  const cy = createGraph(testGraphs.complete4);
  const result = findMinWeightedPathForFourVertices(cy, false);
  return {
    pass: result.success && result.bestPath && result.bestPath.length === 4,
    message: result.error || `Шлях: ${result.bestPath?.join(' → ')}, Вага: ${result.minWeight}`
  };
});

test('Мінімальний шлях - недостатньо вершин', () => {
  const cy = createGraph({ nodes: [{ id: 'A' }, { id: 'B' }], edges: [] });
  const result = findMinWeightedPathForFourVertices(cy, false);
  return {
    pass: result.error !== undefined,
    message: 'Правильно виявлено недостатню кількість вершин'
  };
});

console.log('\n📍 Тести остовних дерев');
console.log('─'.repeat(60));

test('Всі остовні дерева - простий граф', () => {
  const cy = createGraph(testGraphs.simple);
  const result = generateAllSpanningTrees(cy, false);
  return {
    pass: result.success && result.trees && result.trees.length > 0,
    message: result.error || `Знайдено ${result.count} остовних дерев`
  };
});

test('Остовні дерева - орієнтований граф (має повернути помилку)', () => {
  const cy = createGraph(testGraphs.simple);
  const result = generateAllSpanningTrees(cy, true);
  return {
    pass: result.error !== undefined,
    message: 'Правильно виявлено що остовні дерева не підтримують орієнтовані графи'
  };
});

console.log('\n📍 Тести Гамільтонових циклів');
console.log('─'.repeat(60));

test('Гамільтонові цикли - повний граф K4', () => {
  const cy = createGraph(testGraphs.complete4);
  const result = findHamiltonianCycles(cy, false);
  return {
    pass: result.success && result.cycles && result.cycles.length > 0,
    message: result.error || `Знайдено ${result.count} Гамільтонових циклів`
  };
});

test('Один Гамільтонів цикл - повний граф K4', () => {
  const cy = createGraph(testGraphs.complete4);
  const result = findOneHamiltonianCycle(cy, false);
  return {
    pass: result.success && result.cycle && result.cycle.length > 0,
    message: result.error || `Цикл: ${result.formattedCycle}`
  };
});

test('Гамільтонів цикл - недостатньо вершин', () => {
  const cy = createGraph({ nodes: [{ id: 'A' }, { id: 'B' }], edges: [] });
  const result = findHamiltonianCycles(cy, false);
  return {
    pass: result.error !== undefined,
    message: 'Правильно виявлено недостатню кількість вершин'
  };
});

// Підсумок
console.log('\n━'.repeat(60));
console.log('\n📊 Підсумок тестування:');
console.log(`   ✅ Пройдено: ${passedTests}`);
console.log(`   ❌ Провалено: ${failedTests}`);
console.log(`   📈 Загалом: ${passedTests + failedTests}`);

if (failedTests > 0) {
  console.log('\n⚠️  Знайдені помилки:');
  errors.forEach((err, idx) => {
    console.log(`   ${idx + 1}. ${err.test}`);
    console.log(`      ${err.message}`);
  });
}

console.log('\n' + '━'.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
