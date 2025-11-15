/**
 * Graph Generator Utility (Enhanced Version)
 * Генерує різні типи графів з заданими параметрами
 * Використовує Cytoscape.js layout алгоритми для оптимального розміщення
 *
 * Покращення v2.0:
 * - Підтримка необмеженої кількості вершин (v0, v1, v2, ...)
 * - Видалено дублювання коду
 * - Додано валідацію параметрів
 * - Покращена обробка помилок
 * - Виправлено баги в bipartite layout
 */

/**
 * Генерує ID вершини
 * Підтримує необмежену кількість вершин: v0, v1, v2, ..., v999, ...
 */
function generateNodeId(index, state) {
  // Використовуємо state.nodeCount як базу для нових ID
  return `v${state.nodeCount + index}`;
}

/**
 * Генерує випадкову вагу ребра
 */
function generateRandomWeight(minWeight, maxWeight) {
  return Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
}

/**
 * Валідація параметрів генерації
 */
function validateParams(params) {
  const { nodeCount, minWeight, maxWeight } = params;

  if (nodeCount !== undefined) {
    if (!Number.isInteger(nodeCount) || nodeCount < 1) {
      return { error: 'Кількість вершин', details: 'Має бути цілим числом більше 0' };
    }
    if (nodeCount > 1000) {
      return { error: 'Занадто багато вершин', details: 'Максимум 1000 вершин для стабільної роботи' };
    }
  }

  if (minWeight !== undefined && maxWeight !== undefined) {
    if (minWeight > maxWeight) {
      return { error: 'Невірні ваги', details: 'Мінімальна вага не може бути більшою за максимальну' };
    }
    if (minWeight < 0 || maxWeight < 0) {
      return { error: 'Невірні ваги', details: 'Ваги повинні бути невід\'ємними' };
    }
  }

  return null;
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
 * Створює масив вершин
 */
function createNodes(count, state, extraData = () => ({})) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const nodeId = generateNodeId(i, state);
    const extra = typeof extraData === 'function' ? extraData(i, nodeId) : {};
    nodes.push({
      group: 'nodes',
      data: {
        id: nodeId,
        ...extra
      }
    });
  }
  return nodes;
}

/**
 * Створює ребро між двома вершинами
 */
function createEdge(sourceId, targetId, minWeight, maxWeight, customId = null) {
  const weight = generateRandomWeight(minWeight, maxWeight);
  return {
    group: 'edges',
    data: {
      id: customId || `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      weight: weight
    }
  };
}

/**
 * Генерує повний граф (Complete Graph)
 * Кожна вершина з'єднана з усіма іншими
 */
export function generateCompleteGraph(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const validation = validateParams({ nodeCount, minWeight, maxWeight });
  if (validation) return validation;

  const nodes = createNodes(nodeCount, state);
  const edges = [];

  // Створюємо ребра між усіма парами вершин
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const sourceId = nodes[i].data.id;
      const targetId = nodes[j].data.id;

      edges.push(createEdge(sourceId, targetId, minWeight, maxWeight));

      // Для орієнтованого графа додаємо зворотнє ребро
      if (isDirected) {
        edges.push(createEdge(targetId, sourceId, minWeight, maxWeight));
      }
    }
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо circle layout для повного графа
  applyLayout(cy, 'circle', {
    radius: Math.min(300, Math.max(150, nodeCount * 20))
  });

  state.nodeCount += nodeCount;

  return {
    success: true,
    nodes: nodeCount,
    edges: edges.length,
    message: `Створено повний граф з ${nodeCount} вершинами та ${edges.length} ребрами`
  };
}

/**
 * Генерує дерево (Tree)
 * Кожна нова вершина з'єднується з випадковою існуючою
 */
export function generateTree(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const validation = validateParams({ nodeCount, minWeight, maxWeight });
  if (validation) return validation;

  if (nodeCount < 1) {
    return { error: 'Недостатньо вершин', details: 'Для дерева потрібна хоча б 1 вершина' };
  }

  const nodes = createNodes(nodeCount, state);
  const edges = [];

  // Створюємо ребра (дерево має n-1 ребер)
  for (let i = 1; i < nodeCount; i++) {
    // Випадково вибираємо батьківську вершину серед вже створених
    const parentIndex = Math.floor(Math.random() * i);
    const parentId = nodes[parentIndex].data.id;
    const childId = nodes[i].data.id;

    edges.push(createEdge(parentId, childId, minWeight, maxWeight));
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо breadthfirst layout для дерева
  applyLayout(cy, 'breadthfirst', {
    roots: `#${nodes[0].data.id}`,
    directed: true,
    spacingFactor: 1.5
  });

  state.nodeCount += nodeCount;

  return {
    success: true,
    nodes: nodeCount,
    edges: edges.length,
    message: `Створено дерево з ${nodeCount} вершинами та ${edges.length} ребрами`
  };
}

/**
 * Генерує випадковий граф (Random Graph - Erdős–Rényi)
 * Кожне ребро створюється з заданою ймовірністю
 */
export function generateRandomGraph(cy, nodeCount, edgeProbability, isDirected, minWeight, maxWeight, gridSize, state) {
  const validation = validateParams({ nodeCount, minWeight, maxWeight });
  if (validation) return validation;

  if (edgeProbability < 0 || edgeProbability > 1) {
    return { error: 'Невірна ймовірність', details: 'Ймовірність має бути від 0 до 1' };
  }

  const nodes = createNodes(nodeCount, state);
  const edges = [];

  // Створюємо ребра з певною ймовірністю
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < edgeProbability) {
        const sourceId = nodes[i].data.id;
        const targetId = nodes[j].data.id;

        edges.push(createEdge(sourceId, targetId, minWeight, maxWeight));

        // Для орієнтованого графа можливо додаємо зворотнє ребро
        if (isDirected && Math.random() < edgeProbability) {
          edges.push(createEdge(targetId, sourceId, minWeight, maxWeight));
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

  state.nodeCount += nodeCount;

  return {
    success: true,
    nodes: nodeCount,
    edges: edges.length,
    message: `Створено випадковий граф з ${nodeCount} вершинами та ${edges.length} ребрами`
  };
}

/**
 * Генерує цикл (Cycle Graph)
 * Вершини з'єднані по колу: v0 -> v1 -> v2 -> ... -> v0
 */
export function generateCycle(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const validation = validateParams({ nodeCount, minWeight, maxWeight });
  if (validation) return validation;

  if (nodeCount < 3) {
    return { error: 'Недостатньо вершин', details: 'Для циклу потрібно мінімум 3 вершини' };
  }

  const nodes = createNodes(nodeCount, state);
  const edges = [];

  // Створюємо ребра по колу
  for (let i = 0; i < nodeCount; i++) {
    const sourceId = nodes[i].data.id;
    const targetId = nodes[(i + 1) % nodeCount].data.id;

    edges.push(createEdge(sourceId, targetId, minWeight, maxWeight));
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо circle layout
  applyLayout(cy, 'circle', {
    radius: Math.min(300, Math.max(150, nodeCount * 20)),
    startAngle: -Math.PI / 2 // Починаємо з верхньої точки
  });

  state.nodeCount += nodeCount;

  return {
    success: true,
    nodes: nodeCount,
    edges: edges.length,
    message: `Створено цикл з ${nodeCount} вершинами та ${edges.length} ребрами`
  };
}

/**
 * Генерує двочастковий граф (Bipartite Graph)
 * Дві множини вершин, ребра тільки між множинами
 */
export function generateBipartiteGraph(cy, leftCount, rightCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const validation = validateParams({
    nodeCount: leftCount + rightCount,
    minWeight,
    maxWeight
  });
  if (validation) return validation;

  if (leftCount < 1 || rightCount < 1) {
    return {
      error: 'Недостатньо вершин',
      details: 'Обидві частини мають містити хоча б 1 вершину'
    };
  }

  const nodes = [];
  const nodeIdMap = { left: [], right: [] };

  // Створюємо ліву частину
  for (let i = 0; i < leftCount; i++) {
    const nodeId = generateNodeId(i, state);
    nodeIdMap.left.push(nodeId);
    nodes.push({
      group: 'nodes',
      data: {
        id: nodeId,
        bipartiteGroup: 'left'
      }
    });
  }

  // Створюємо праву частину
  for (let i = 0; i < rightCount; i++) {
    const nodeId = generateNodeId(leftCount + i, state);
    nodeIdMap.right.push(nodeId);
    nodes.push({
      group: 'nodes',
      data: {
        id: nodeId,
        bipartiteGroup: 'right'
      }
    });
  }

  cy.add(nodes);

  const edges = [];

  // З'єднуємо кожну вершину з лівої частини з випадковими вершинами з правої
  for (let i = 0; i < leftCount; i++) {
    const edgeCount = Math.floor(Math.random() * rightCount) + 1;
    const targets = new Set();

    // Вибираємо випадкові вершини з правої частини
    while (targets.size < edgeCount) {
      const targetIndex = Math.floor(Math.random() * rightCount);
      targets.add(targetIndex);
    }

    targets.forEach(targetIndex => {
      const sourceId = nodeIdMap.left[i];
      const targetId = nodeIdMap.right[targetIndex];

      edges.push(createEdge(sourceId, targetId, minWeight, maxWeight));

      // Для орієнтованого графа можливо додаємо зворотнє ребро
      if (isDirected && Math.random() < 0.5) {
        edges.push(createEdge(targetId, sourceId, minWeight, maxWeight));
      }
    });
  }

  cy.add(edges);

  // Покращений layout для двочасткового графа
  const maxRows = Math.max(leftCount, rightCount);
  const positions = {};

  // Обчислюємо позиції для лівої частини
  nodeIdMap.left.forEach((nodeId, index) => {
    positions[nodeId] = {
      x: 100,
      y: 100 + (index * (400 / maxRows))
    };
  });

  // Обчислюємо позиції для правої частини
  nodeIdMap.right.forEach((nodeId, index) => {
    positions[nodeId] = {
      x: 400,
      y: 100 + (index * (400 / maxRows))
    };
  });

  // Застосовуємо preset layout з заданими позиціями
  applyLayout(cy, 'preset', {
    positions: function(node) {
      return positions[node.id()];
    },
    fit: true,
    padding: 50
  });

  state.nodeCount += leftCount + rightCount;

  return {
    success: true,
    nodes: leftCount + rightCount,
    edges: edges.length,
    message: `Створено двочастковий граф: ${leftCount} + ${rightCount} вершин, ${edges.length} ребер`
  };
}

/**
 * Генерує граф-зірку (Star Graph)
 * Одна центральна вершина з'єднана з усіма іншими
 */
export function generateStarGraph(cy, nodeCount, isDirected, minWeight, maxWeight, gridSize, state) {
  const validation = validateParams({ nodeCount, minWeight, maxWeight });
  if (validation) return validation;

  if (nodeCount < 2) {
    return { error: 'Недостатньо вершин', details: 'Для зірки потрібно мінімум 2 вершини' };
  }

  const nodes = createNodes(nodeCount, state, (i) => ({
    isCenter: i === 0
  }));

  const edges = [];
  const centerId = nodes[0].data.id;

  // З'єднуємо центр з усіма периферійними вершинами
  for (let i = 1; i < nodeCount; i++) {
    const peripheralId = nodes[i].data.id;
    edges.push(createEdge(centerId, peripheralId, minWeight, maxWeight));

    // Для орієнтованого графа також додаємо ребра від периферії до центру
    if (isDirected) {
      edges.push(createEdge(peripheralId, centerId, minWeight, maxWeight));
    }
  }

  cy.add(nodes);
  cy.add(edges);

  // Використовуємо concentric layout
  applyLayout(cy, 'concentric', {
    concentric: function(node) {
      return node.data('isCenter') ? 2 : 1;
    },
    levelWidth: function() {
      return 1;
    },
    minNodeSpacing: 80
  });

  state.nodeCount += nodeCount;

  return {
    success: true,
    nodes: nodeCount,
    edges: edges.length,
    message: `Створено граф-зірку з ${nodeCount} вершинами та ${edges.length} ребрами`
  };
}
