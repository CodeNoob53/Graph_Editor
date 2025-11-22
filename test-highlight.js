#!/usr/bin/env node

/**
 * Тести для функцій підсвітки
 */

import { clearHighlights, highlightPath, highlightEdges, highlightNodesAndEdges } from './src/utils/highlight.js';

// Мок-клас для Cytoscape
class MockElement {
  constructor() {
    this.classes = new Set();
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
  }

  filter(fn) {
    return new MockCollection(this._elements.filter(fn));
  }

  forEach(fn) {
    this._elements.forEach(fn);
  }

  addClass(className) {
    this._elements.forEach(el => el.addClass(className));
    return this;
  }

  removeClass(className) {
    this._elements.forEach(el => el.removeClass(className));
    return this;
  }

  some(fn) {
    return this._elements.some(fn);
  }
}

class MockNode extends MockElement {
  constructor(id) {
    super();
    this._id = id;
  }

  id() {
    return this._id;
  }

  data() {
    return this._id;
  }
}

class MockEdge extends MockElement {
  constructor(source, target) {
    super();
    this._source = source;
    this._target = target;
  }

  data(key) {
    if (key === 'source') return this._source;
    if (key === 'target') return this._target;
    return null;
  }
}

class MockCytoscape {
  constructor() {
    this._nodes = [
      new MockNode('A'),
      new MockNode('B'),
      new MockNode('C'),
      new MockNode('D')
    ];

    this._edges = [
      new MockEdge('A', 'B'),
      new MockEdge('B', 'C'),
      new MockEdge('C', 'D'),
      new MockEdge('D', 'A')
    ];
  }

  elements() {
    return new MockCollection([...this._nodes, ...this._edges]);
  }

  $(selector) {
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      const node = this._nodes.find(n => n.id() === id);
      return new MockCollection(node ? [node] : []);
    }
    return new MockCollection([]);
  }

  edges() {
    return new MockCollection(this._edges);
  }

  nodes() {
    return new MockCollection(this._nodes);
  }
}

// Утиліти
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
    failedTests++;
  }
}

// Тести
console.log('\n🎨 Тестування функцій підсвітки\n');
console.log('━'.repeat(60));

test('clearHighlights - видаляє підсвітку з усіх елементів', () => {
  const cy = new MockCytoscape();

  // Спочатку додаємо підсвітку
  cy.elements().addClass('highlighted');

  // Перевіряємо що підсвітка додана
  const hasHighlightBefore = cy.elements().some(el => el.hasClass('highlighted'));

  // Очищаємо підсвітку
  clearHighlights(cy);

  // Перевіряємо що підсвітка видалена
  const hasHighlightAfter = cy.elements().some(el => el.hasClass('highlighted'));

  return {
    pass: hasHighlightBefore && !hasHighlightAfter,
    message: hasHighlightAfter ? 'Підсвітка не була видалена' : 'OK'
  };
});

test('highlightPath - підсвічує вершини шляху', () => {
  const cy = new MockCytoscape();
  const path = ['A', 'B', 'C'];

  highlightPath(cy, path);

  // Перевіряємо що вершини шляху підсвічені
  const nodeA = cy.$('#A')._elements[0];
  const nodeB = cy.$('#B')._elements[0];
  const nodeC = cy.$('#C')._elements[0];
  const nodeD = cy.$('#D')._elements[0];

  const aHighlighted = nodeA && nodeA.hasClass('highlighted');
  const bHighlighted = nodeB && nodeB.hasClass('highlighted');
  const cHighlighted = nodeC && nodeC.hasClass('highlighted');
  const dHighlighted = nodeD && nodeD.hasClass('highlighted');

  return {
    pass: aHighlighted && bHighlighted && cHighlighted && !dHighlighted,
    message: `A: ${aHighlighted}, B: ${bHighlighted}, C: ${cHighlighted}, D: ${dHighlighted}`
  };
});

test('highlightPath - підсвічує ребра шляху', () => {
  const cy = new MockCytoscape();
  const path = ['A', 'B', 'C'];

  highlightPath(cy, path);

  // Перевіряємо що ребра шляху підсвічені
  const edgeAB = cy._edges.find(e =>
    (e.data('source') === 'A' && e.data('target') === 'B') ||
    (e.data('source') === 'B' && e.data('target') === 'A')
  );
  const edgeBC = cy._edges.find(e =>
    (e.data('source') === 'B' && e.data('target') === 'C') ||
    (e.data('source') === 'C' && e.data('target') === 'B')
  );

  return {
    pass: edgeAB.hasClass('highlighted') && edgeBC.hasClass('highlighted'),
    message: `AB: ${edgeAB.hasClass('highlighted')}, BC: ${edgeBC.hasClass('highlighted')}`
  };
});

test('highlightEdges - підсвічує вказані ребра', () => {
  const cy = new MockCytoscape();
  const edges = [
    { source: 'A', target: 'B' },
    { source: 'C', target: 'D' }
  ];

  highlightEdges(cy, edges);

  // Перевіряємо що вказані ребра підсвічені
  const edgeAB = cy._edges.find(e =>
    (e.data('source') === 'A' && e.data('target') === 'B') ||
    (e.data('source') === 'B' && e.data('target') === 'A')
  );
  const edgeCD = cy._edges.find(e =>
    (e.data('source') === 'C' && e.data('target') === 'D') ||
    (e.data('source') === 'D' && e.data('target') === 'C')
  );

  return {
    pass: edgeAB.hasClass('highlighted') && edgeCD.hasClass('highlighted'),
    message: `AB: ${edgeAB.hasClass('highlighted')}, CD: ${edgeCD.hasClass('highlighted')}`
  };
});

test('highlightEdges - підсвічує вершини вказаних ребер', () => {
  const cy = new MockCytoscape();
  const edges = [
    { source: 'A', target: 'B' }
  ];

  highlightEdges(cy, edges);

  // Перевіряємо що вершини A та B підсвічені
  const nodeA = cy.$('#A')._elements[0];
  const nodeB = cy.$('#B')._elements[0];
  const nodeC = cy.$('#C')._elements[0];

  return {
    pass: nodeA.hasClass('highlighted') && nodeB.hasClass('highlighted') && !nodeC.hasClass('highlighted'),
    message: `A: ${nodeA.hasClass('highlighted')}, B: ${nodeB.hasClass('highlighted')}, C: ${nodeC.hasClass('highlighted')}`
  };
});

test('highlightNodesAndEdges - підсвічує вказані вершини та ребра', () => {
  const cy = new MockCytoscape();
  const nodes = ['A', 'C'];
  const edges = [{ source: 'A', target: 'B' }]; // Використовуємо ребро що існує

  highlightNodesAndEdges(cy, nodes, edges);

  // Перевіряємо вершини
  const nodeA = cy.$('#A')._elements[0];
  const nodeC = cy.$('#C')._elements[0];
  const nodeD = cy.$('#D')._elements[0];

  // Перевіряємо ребро
  const edgeAB = cy._edges.find(e =>
    (e.data('source') === 'A' && e.data('target') === 'B') ||
    (e.data('source') === 'B' && e.data('target') === 'A')
  );

  const nodesOk = nodeA.hasClass('highlighted') && nodeC.hasClass('highlighted') && !nodeD.hasClass('highlighted');
  const edgesOk = edgeAB && edgeAB.hasClass('highlighted');

  return {
    pass: nodesOk && edgesOk,
    message: `Вершини: A=${nodeA.hasClass('highlighted')}, C=${nodeC.hasClass('highlighted')}, D=${nodeD.hasClass('highlighted')}; Ребро AB=${edgesOk}`
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
