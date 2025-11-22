#!/usr/bin/env node

/**
 * Тести для перевірки коректної роботи з кратними ребрами
 * (коли між двома вершинами є 2+ ребра з різними вагами)
 */

import { findShortestPath } from './src/algorithms/shortestPath.js';
import { highlightPath, highlightEdges } from './src/utils/highlight.js';

// Мок-класи для Cytoscape
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
  constructor(id, data) {
    this._id = id;
    this._data = data;
    this.classes = new Set();
  }

  id() {
    return this._id;
  }

  data(key) {
    return this._data[key];
  }

  addClass(className) {
    this.classes.add(className);
    return this;
  }

  removeClass(className) {
    this.classes.delete(className);
    return this;
  }

  hasClass(className) {
    return this.classes.has(className);
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

  addClass(className) {
    this._elements.forEach(el => el.addClass && el.addClass(className));
    return this;
  }

  removeClass(className) {
    this._elements.forEach(el => el.removeClass && el.removeClass(className));
    return this;
  }
}

class MockCytoscape {
  constructor(nodes, edges) {
    this._nodes = nodes.map(n => new MockNode(n));
    this._edges = edges.map((e, idx) => new MockEdge(e.id || `edge-${idx}`, e));
  }

  nodes() {
    return new MockCollection(this._nodes);
  }

  edges() {
    return new MockCollection(this._edges);
  }

  getElementById(id) {
    const element = [...this._nodes, ...this._edges].find(el => el.id() === id);
    return new MockCollection(element ? [element] : []);
  }

  $(selector) {
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

// Утиліти для тестування
let passedTests = 0;
let failedTests = 0;

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
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Помилка: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    failedTests++;
  }
}

// Тести
console.log('\n🧪 Тестування роботи з кратними ребрами\n');
console.log('━'.repeat(60));

console.log('\n📍 Граф з кратними ребрами між A та B');
console.log('─'.repeat(60));

test('findShortestPath - вибирає ребро з мінімальною вагою', () => {
  // Граф: A --(1)--> B --(2)--> C
  //       A --(10)--> B  (дубльоване ребро з більшою вагою)
  const cy = new MockCytoscape(
    [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' }
    ],
    [
      { id: 'edge-AB-1', source: 'A', target: 'B', weight: 1 },
      { id: 'edge-AB-10', source: 'A', target: 'B', weight: 10 },
      { id: 'edge-BC', source: 'B', target: 'C', weight: 2 }
    ]
  );

  const result = findShortestPath(cy, 'A', 'C', false);

  // Очікуємо: A -> B -> C з загальною відстанню 3 (1 + 2)
  // edgeIds повинен містити edge-AB-1 (а не edge-AB-10)
  const correctPath = result.path.join(' -> ') === 'A -> B -> C';
  const correctDistance = result.distance === 3;
  const usesCorrectEdge = result.edgeIds && result.edgeIds[0] === 'edge-AB-1';

  return {
    pass: correctPath && correctDistance && usesCorrectEdge,
    message: `Path: ${result.path.join(' -> ')}, Distance: ${result.distance}, EdgeIds: ${result.edgeIds?.join(', ')}`
  };
});

test('findShortestPath - повертає edgeIds для всіх ребер шляху', () => {
  const cy = new MockCytoscape(
    [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' }
    ],
    [
      { id: 'e1', source: 'A', target: 'B', weight: 1 },
      { id: 'e2', source: 'B', target: 'C', weight: 2 }
    ]
  );

  const result = findShortestPath(cy, 'A', 'C', false);

  // Шлях A -> B -> C повинен мати 2 ребра: e1 та e2
  const hasCorrectCount = result.edgeIds && result.edgeIds.length === 2;
  const hasCorrectEdges = result.edgeIds &&
    result.edgeIds[0] === 'e1' &&
    result.edgeIds[1] === 'e2';

  return {
    pass: hasCorrectCount && hasCorrectEdges,
    message: `EdgeIds: ${result.edgeIds?.join(', ')}`
  };
});

test('highlightPath - підсвічує тільки вказане ребро (за edgeId)', () => {
  const cy = new MockCytoscape(
    [
      { id: 'A' },
      { id: 'B' }
    ],
    [
      { id: 'edge1', source: 'A', target: 'B', weight: 1 },
      { id: 'edge2', source: 'A', target: 'B', weight: 10 }
    ]
  );

  const path = ['A', 'B'];
  const edgeIds = ['edge1'];

  highlightPath(cy, path, edgeIds);

  // Перевіряємо що тільки edge1 підсвічене
  const edge1 = cy._edges.find(e => e.id() === 'edge1');
  const edge2 = cy._edges.find(e => e.id() === 'edge2');

  const edge1Highlighted = edge1.hasClass('highlighted');
  const edge2NotHighlighted = !edge2.hasClass('highlighted');

  return {
    pass: edge1Highlighted && edge2NotHighlighted,
    message: `edge1: ${edge1Highlighted}, edge2: ${edge2.hasClass('highlighted')}`
  };
});

test('highlightPath - без edgeIds підсвічує ребро з мінімальною вагою', () => {
  const cy = new MockCytoscape(
    [
      { id: 'A' },
      { id: 'B' }
    ],
    [
      { id: 'edge1', source: 'A', target: 'B', weight: 5 },
      { id: 'edge2', source: 'A', target: 'B', weight: 2 },
      { id: 'edge3', source: 'A', target: 'B', weight: 10 }
    ]
  );

  const path = ['A', 'B'];

  highlightPath(cy, path); // Без edgeIds

  // Повинно підсвітити edge2 (вага 2)
  const edge1 = cy._edges.find(e => e.id() === 'edge1');
  const edge2 = cy._edges.find(e => e.id() === 'edge2');
  const edge3 = cy._edges.find(e => e.id() === 'edge3');

  const edge2Highlighted = edge2.hasClass('highlighted');
  const otherNotHighlighted = !edge1.hasClass('highlighted') && !edge3.hasClass('highlighted');

  return {
    pass: edge2Highlighted && otherNotHighlighted,
    message: `edge1: ${edge1.hasClass('highlighted')}, edge2: ${edge2Highlighted}, edge3: ${edge3.hasClass('highlighted')}`
  };
});

test('highlightEdges - використовує edgeId якщо доступний', () => {
  const cy = new MockCytoscape(
    [
      { id: 'A' },
      { id: 'B' }
    ],
    [
      { id: 'edge-AB-1', source: 'A', target: 'B', weight: 1 },
      { id: 'edge-AB-2', source: 'A', target: 'B', weight: 5 }
    ]
  );

  const edges = [
    { source: 'A', target: 'B', edgeId: 'edge-AB-2' }
  ];

  highlightEdges(cy, edges);

  // Повинно підсвітити тільки edge-AB-2
  const edge1 = cy._edges.find(e => e.id() === 'edge-AB-1');
  const edge2 = cy._edges.find(e => e.id() === 'edge-AB-2');

  const edge1NotHighlighted = !edge1.hasClass('highlighted');
  const edge2Highlighted = edge2.hasClass('highlighted');

  return {
    pass: edge1NotHighlighted && edge2Highlighted,
    message: `edge-AB-1: ${edge1.hasClass('highlighted')}, edge-AB-2: ${edge2Highlighted}`
  };
});

test('Інтеграційний тест: findShortestPath + highlightPath з кратними ребрами', () => {
  const cy = new MockCytoscape(
    [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' }
    ],
    [
      { id: 'e-AB-low', source: 'A', target: 'B', weight: 1 },
      { id: 'e-AB-high', source: 'A', target: 'B', weight: 100 },
      { id: 'e-BC', source: 'B', target: 'C', weight: 2 }
    ]
  );

  // Знаходимо найкоротший шлях
  const result = findShortestPath(cy, 'A', 'C', false);

  // Підсвічуємо шлях з використанням edgeIds
  highlightPath(cy, result.path, result.edgeIds);

  // Перевіряємо що підсвічені правильні ребра
  const eLow = cy._edges.find(e => e.id() === 'e-AB-low');
  const eHigh = cy._edges.find(e => e.id() === 'e-AB-high');
  const eBC = cy._edges.find(e => e.id() === 'e-BC');

  const correctEdgesHighlighted =
    eLow.hasClass('highlighted') &&
    !eHigh.hasClass('highlighted') &&
    eBC.hasClass('highlighted');

  return {
    pass: correctEdgesHighlighted,
    message: `e-AB-low: ${eLow.hasClass('highlighted')}, e-AB-high: ${eHigh.hasClass('highlighted')}, e-BC: ${eBC.hasClass('highlighted')}`
  };
});

// Підсумок
console.log('\n━'.repeat(60));
console.log('\n📊 Підсумок тестування:');
console.log(`   ✅ Пройдено: ${passedTests}`);
console.log(`   ❌ Провалено: ${failedTests}`);
console.log(`   📈 Загалом: ${passedTests + failedTests}`);
console.log('\n' + '━'.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
