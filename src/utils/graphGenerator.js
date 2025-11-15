/**
 * Graph Generator Utility
 * Генерує різні типи графів з заданими параметрами
 * Використовує Cytoscape.js layout алгоритми для оптимального розміщення
 */

/**
 * Генерує випадкову вагу ребра
 */
function generateRandomWeight(minWeight, maxWeight) {
  return Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
}

/**
 * Застосовує layout до графа
 */
function applyLayout(cy, layoutName, layoutOptions = {}) {
  const defaultOptions = {
    name: layoutName,
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 50
  };

  const layout = cy.layout({ ...defaultOptions, ...layoutOptions });
  layout.run();
}

/**
 * Генерує повний граф (Complete Graph)
 * Використовує circular layout для кращого відображення
 */
export function generateCompleteGraph(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const nodes = [];
  const edges = [];

  // Створюємо вершини
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = String.fromCharCode(65 + i); // A, B, C, ...
    nodes.push({
      group: 'nodes',
      data: { id: nodeId }
    });
  }

  // Створюємо ребра (кожна вершина з'єднана з усіма іншими)
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const source = String.fromCharCode(65 + i);
      const target = String.fromCharCode(65 + j);
      const weight = generateRandomWeight(minWeight, maxWeight);

      edges.push({
        group: 'edges',
        data: {
          id: `${source}-${target}`,
          source: source,
          target: target,
          weight: weight
        }
      });

      // Для орієнтованого графа додаємо зворотнє ребро
      if (isDirected) {
        edges.push({
          group: 'edges',
          data: {
            id: `${target}-${source}`,
            source: target,
            target: source,
            weight: generateRandomWeight(minWeight, maxWeight)
          }
        });
      }
    }
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо circle layout для повного графа
  applyLayout(cy, 'circle', {
    radius: Math.min(250, Math.max(150, nodeCount * 25))
  });

  state.nodeCount = nodeCount;
}

/**
 * Генерує дерево (Tree)
 * Використовує breadthfirst layout для ієрархічного відображення
 */
export function generateTree(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  if (nodeCount < 1) return;

  const nodes = [];
  const edges = [];

  // Створюємо кореневу вершину
  const rootId = 'A';
  nodes.push({
    group: 'nodes',
    data: { id: rootId }
  });

  // Створюємо решту вершин та з'єднуємо їх з батьківськими
  for (let i = 1; i < nodeCount; i++) {
    const nodeId = String.fromCharCode(65 + i);
    nodes.push({
      group: 'nodes',
      data: { id: nodeId }
    });

    // Випадково вибираємо батьківську вершину серед вже створених
    const parentIndex = Math.floor(Math.random() * i);
    const parentId = String.fromCharCode(65 + parentIndex);
    const weight = generateRandomWeight(minWeight, maxWeight);

    edges.push({
      group: 'edges',
      data: {
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        weight: weight
      }
    });
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо breadthfirst layout для дерева
  applyLayout(cy, 'breadthfirst', {
    roots: '#A',
    directed: true,
    spacingFactor: 1.5
  });

  state.nodeCount = nodeCount;
}

/**
 * Генерує випадковий граф (Random Graph)
 * Використовує cose layout для природного розміщення
 */
export function generateRandomGraph(cy, nodeCount, edgeProbability, isDirected, minWeight, maxWeight, gridSize, state) {
  const nodes = [];
  const edges = [];

  // Створюємо вершини
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = String.fromCharCode(65 + i);
    nodes.push({
      group: 'nodes',
      data: { id: nodeId }
    });
  }

  // Створюємо ребра з певною ймовірністю
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < edgeProbability) {
        const source = String.fromCharCode(65 + i);
        const target = String.fromCharCode(65 + j);
        const weight = generateRandomWeight(minWeight, maxWeight);

        edges.push({
          group: 'edges',
          data: {
            id: `${source}-${target}`,
            source: source,
            target: target,
            weight: weight
          }
        });

        // Для орієнтованого графа можливо додаємо зворотнє ребро
        if (isDirected && Math.random() < edgeProbability) {
          edges.push({
            group: 'edges',
            data: {
              id: `${target}-${source}`,
              source: target,
              target: source,
              weight: generateRandomWeight(minWeight, maxWeight)
            }
          });
        }
      }
    }
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо cose (force-directed) layout для випадкового графа
  applyLayout(cy, 'cose', {
    idealEdgeLength: 100,
    nodeOverlap: 20,
    refresh: 20,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80
  });

  state.nodeCount = nodeCount;
}

/**
 * Генерує цикл (Cycle)
 * Використовує circle layout для розміщення по колу
 */
export function generateCycle(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  if (nodeCount < 3) {
    alert('Для циклу потрібно мінімум 3 вершини');
    return;
  }

  const nodes = [];
  const edges = [];

  // Створюємо вершини
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = String.fromCharCode(65 + i);
    nodes.push({
      group: 'nodes',
      data: { id: nodeId }
    });
  }

  // Створюємо ребра по колу
  for (let i = 0; i < nodeCount; i++) {
    const source = String.fromCharCode(65 + i);
    const target = String.fromCharCode(65 + ((i + 1) % nodeCount));
    const weight = generateRandomWeight(minWeight, maxWeight);

    edges.push({
      group: 'edges',
      data: {
        id: `${source}-${target}`,
        source: source,
        target: target,
        weight: weight
      }
    });
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо circle layout
  applyLayout(cy, 'circle', {
    radius: Math.min(250, Math.max(150, nodeCount * 25)),
    startAngle: -Math.PI / 2 // Починаємо з верхньої точки
  });

  state.nodeCount = nodeCount;
}

/**
 * Генерує двочастковий граф (Bipartite Graph)
 * Використовує grid layout для розміщення в дві колонки
 */
export function generateBipartiteGraph(cy, leftCount, rightCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const nodes = [];
  const edges = [];
  const totalCount = leftCount + rightCount;

  // Створюємо ліву частину
  for (let i = 0; i < leftCount; i++) {
    const nodeId = String.fromCharCode(65 + i);
    nodes.push({
      group: 'nodes',
      data: {
        id: nodeId,
        bipartiteGroup: 'left' // Додаємо мітку групи
      }
    });
  }

  // Створюємо праву частину
  for (let i = 0; i < rightCount; i++) {
    const nodeId = String.fromCharCode(65 + leftCount + i);
    nodes.push({
      group: 'nodes',
      data: {
        id: nodeId,
        bipartiteGroup: 'right' // Додаємо мітку групи
      }
    });
  }

  cy.add(nodes);

  // З'єднуємо кожну вершину з лівої частини з випадковими вершинами з правої
  for (let i = 0; i < leftCount; i++) {
    const edgeCount = Math.floor(Math.random() * rightCount) + 1;
    const targets = new Set();

    for (let e = 0; e < edgeCount; e++) {
      const targetIndex = Math.floor(Math.random() * rightCount);
      targets.add(targetIndex);
    }

    targets.forEach(targetIndex => {
      const source = String.fromCharCode(65 + i);
      const target = String.fromCharCode(65 + leftCount + targetIndex);
      const weight = generateRandomWeight(minWeight, maxWeight);

      edges.push({
        group: 'edges',
        data: {
          id: `${source}-${target}`,
          source: source,
          target: target,
          weight: weight
        }
      });
    });
  }

  cy.add(edges);

  // Використовуємо grid layout з 2 колонками
  applyLayout(cy, 'grid', {
    rows: Math.max(leftCount, rightCount),
    cols: 2,
    position: function(node) {
      // Розміщуємо ліву групу в першій колонці, праву - в другій
      const isLeft = node.data('bipartiteGroup') === 'left';
      return {
        row: isLeft ? nodes.filter(n => n.data.bipartiteGroup === 'left').indexOf(node.data()) :
                      nodes.filter(n => n.data.bipartiteGroup === 'right').indexOf(node.data()),
        col: isLeft ? 0 : 1
      };
    }
  });

  state.nodeCount = totalCount;
}

/**
 * Генерує граф-зірку (Star Graph)
 * Використовує concentric layout для радіального розміщення
 */
export function generateStarGraph(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  if (nodeCount < 2) {
    alert('Для зірки потрібно мінімум 2 вершини');
    return;
  }

  const nodes = [];
  const edges = [];

  // Центральна вершина
  const centerId = 'A';
  nodes.push({
    group: 'nodes',
    data: {
      id: centerId,
      isCenter: true // Мітка центральної вершини
    }
  });

  // Периферійні вершини
  for (let i = 1; i < nodeCount; i++) {
    const nodeId = String.fromCharCode(65 + i);
    nodes.push({
      group: 'nodes',
      data: {
        id: nodeId,
        isCenter: false
      }
    });

    const weight = generateRandomWeight(minWeight, maxWeight);
    edges.push({
      group: 'edges',
      data: {
        id: `${centerId}-${nodeId}`,
        source: centerId,
        target: nodeId,
        weight: weight
      }
    });
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо concentric layout
  applyLayout(cy, 'concentric', {
    concentric: function(node) {
      // Центральна вершина має найвищий пріоритет
      return node.data('isCenter') ? 2 : 1;
    },
    levelWidth: function() {
      return 1;
    },
    minNodeSpacing: 80
  });

  state.nodeCount = nodeCount;
}
