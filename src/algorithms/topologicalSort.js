/**
 * Топологічне сортування графу
 * Працює тільки для орієнтованих ациклічних графів (DAG)
 */

/**
 * Топологічне сортування за допомогою DFS
 * Вершини сортуються так, що для кожного ребра (u, v), вершина u йде перед v
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути true)
 * @returns {Object} Результат з топологічним порядком
 */
export function topologicalSort(cy, isDirected = true) {
  if (!cy || typeof cy.nodes !== "function") {
    return {
      error: "Граф не ініціалізовано",
      details: "Екземпляр Cytoscape не знайдено або пошкоджено"
    };
  }

  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length === 0) {
    return {
      error: "Граф порожній",
      details: "Додайте вершини до графу"
    };
  }

  // Топологічне сортування працює тільки для орієнтованих графів
  if (!isDirected) {
    return {
      error: "Топологічне сортування не застосовне",
      details: "Топологічне сортування працює тільки для орієнтованих графів (DAG)",
      graphType: 'неорієнтований'
    };
  }

  // Використовуємо алгоритм Кана (Kahn's Algorithm) для кращої візуалізації
  const steps = [];

  // 1. Будуємо список суміжності та підраховуємо вхідні степені
  const adjacency = {};
  const inDegree = {};

  nodes.forEach(node => {
    const nodeId = node.id();
    adjacency[nodeId] = [];
    inDegree[nodeId] = 0;
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push({ target, edgeId: edge.id() });
    inDegree[target]++;
  });

  steps.push({
    type: 'init',
    inDegrees: { ...inDegree }
  });

  // 2. Знаходимо всі вершини з вхідним степенем 0
  const queue = [];
  nodes.forEach(node => {
    if (inDegree[node.id()] === 0) {
      queue.push(node.id());
    }
  });

  steps.push({
    type: 'ready-nodes',
    nodes: [...queue]
  });

  const topologicalOrder = [];

  while (queue.length > 0) {
    // Беремо вершину з черги (можна сортувати для детермінованості)
    queue.sort();
    const nodeId = queue.shift();
    topologicalOrder.push(nodeId);

    steps.push({
      type: 'select-node',
      node: nodeId,
      order: [...topologicalOrder]
    });

    // Зменшуємо вхідний степінь для всіх сусідів
    const neighbors = adjacency[nodeId] || [];
    const removedEdges = [];
    const newReadyNodes = [];

    for (const { target, edgeId } of neighbors) {
      inDegree[target]--;
      removedEdges.push(edgeId);

      if (inDegree[target] === 0) {
        queue.push(target);
        newReadyNodes.push(target);
      }
    }

    if (removedEdges.length > 0) {
      steps.push({
        type: 'update-degrees',
        source: nodeId,
        removedEdges: removedEdges,
        inDegrees: { ...inDegree },
        newReadyNodes: newReadyNodes
      });
    }
  }

  // Якщо не всі вершини оброблені, значить є цикл
  if (topologicalOrder.length !== nodes.length) {
    return {
      error: "Граф містить цикл",
      details: "Топологічне сортування можливе тільки для ациклічних графів (DAG)",
      graphType: 'орієнтований',
      steps: steps
    };
  }

  return {
    success: true,
    algorithm: 'Topological Sort (Kahn)',
    topologicalOrder: topologicalOrder,
    nodeCount: nodes.length,
    graphType: 'орієнтований (DAG)',
    message: 'Топологічний порядок вершин',
    steps: steps
  };
}

/**
 * Топологічне сортування за алгоритмом Кана (використовуючи вхідні степені)
 * Альтернативний метод, який працює ітеративно
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути true)
 * @returns {Object} Результат з топологічним порядком
 */
export function topologicalSortKahn(cy, isDirected = true) {
  if (!cy || typeof cy.nodes !== "function") {
    return {
      error: "Граф не ініціалізовано",
      details: "Екземпляр Cytoscape не знайдено або пошкоджено"
    };
  }

  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length === 0) {
    return {
      error: "Граф порожній",
      details: "Додайте вершини до графу"
    };
  }

  if (!isDirected) {
    return {
      error: "Топологічне сортування не застосовне",
      details: "Топологічне сортування працює тільки для орієнтованих графів (DAG)",
      graphType: 'неорієнтований'
    };
  }

  // Будуємо список суміжності та підраховуємо вхідні степені
  const adjacency = {};
  const inDegree = {};

  nodes.forEach(node => {
    const nodeId = node.id();
    adjacency[nodeId] = [];
    inDegree[nodeId] = 0;
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
    inDegree[target]++;
  });

  // Знаходимо всі вершини з вхідним степенем 0
  const queue = [];
  nodes.forEach(node => {
    if (inDegree[node.id()] === 0) {
      queue.push(node.id());
    }
  });

  const topologicalOrder = [];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    topologicalOrder.push(nodeId);

    // Зменшуємо вхідний степінь для всіх сусідів
    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Якщо не всі вершини оброблені, значить є цикл
  if (topologicalOrder.length !== nodes.length) {
    return {
      error: "Граф містить цикл",
      details: "Топологічне сортування можливе тільки для ациклічних графів (DAG)",
      graphType: 'орієнтований',
      processedNodes: topologicalOrder.length,
      totalNodes: nodes.length
    };
  }

  return {
    success: true,
    algorithm: 'Topological Sort (Kahn\'s Algorithm)',
    topologicalOrder: topologicalOrder,
    nodeCount: nodes.length,
    graphType: 'орієнтований (DAG)',
    message: 'Топологічний порядок вершин'
  };
}
