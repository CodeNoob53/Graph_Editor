/**
 * Алгоритми обходу графу: DFS (Depth-First Search) та BFS (Breadth-First Search)
 */

/**
 * Пошук у глибину (DFS) - рекурсивна версія
 * Відвідує вершини, йдучи якомога глибше перед поверненням назад
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} startNodeId - ID початкової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з порядком обходу
 */
export function depthFirstSearch(cy, startNodeId, isDirected = false) {
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

  // Перевірка чи існує початкова вершина
  const startNode = cy.getElementById(startNodeId);
  if (!startNode || startNode.length === 0) {
    return {
      error: "Початкова вершина не знайдена",
      details: `Вершина з ID "${startNodeId}" не існує в графі`,
      availableNodes: nodes.map(n => n.id())
    };
  }

  // Будуємо список суміжності
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);

    // Для неорієнтованого графу додаємо обернене ребро
    if (!isDirected) {
      adjacency[target].push(source);
    }
  });

  const visited = new Set();
  const traversalOrder = [];

  /**
   * Рекурсивна функція DFS
   */
  function dfsRecursive(nodeId) {
    visited.add(nodeId);
    traversalOrder.push(nodeId);

    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfsRecursive(neighbor);
      }
    }
  }

  dfsRecursive(startNodeId);

  return {
    success: true,
    algorithm: 'DFS (Depth-First Search)',
    traversalOrder: traversalOrder,
    visitedCount: visited.size,
    totalNodes: nodes.length,
    isComplete: visited.size === nodes.length,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    startNode: startNodeId
  };
}

/**
 * Пошук у глибину (DFS) - ітеративна версія
 * Використовує стек замість рекурсії
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} startNodeId - ID початкової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з порядком обходу
 */
export function depthFirstSearchIterative(cy, startNodeId, isDirected = false) {
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

  const startNode = cy.getElementById(startNodeId);
  if (!startNode || startNode.length === 0) {
    return {
      error: "Початкова вершина не знайдена",
      details: `Вершина з ID "${startNodeId}" не існує в графі`,
      availableNodes: nodes.map(n => n.id())
    };
  }

  // Будуємо список суміжності
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);

    if (!isDirected) {
      adjacency[target].push(source);
    }
  });

  const visited = new Set();
  const traversalOrder = [];
  const stack = [startNodeId];

  while (stack.length > 0) {
    const nodeId = stack.pop();

    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      traversalOrder.push(nodeId);

      // Додаємо сусідів до стеку (в зворотному порядку для коректної послідовності)
      const neighbors = adjacency[nodeId] || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        if (!visited.has(neighbors[i])) {
          stack.push(neighbors[i]);
        }
      }
    }
  }

  return {
    success: true,
    algorithm: 'DFS Iterative (Depth-First Search)',
    traversalOrder: traversalOrder,
    visitedCount: visited.size,
    totalNodes: nodes.length,
    isComplete: visited.size === nodes.length,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    startNode: startNodeId
  };
}

/**
 * Пошук у ширину (BFS) - ітеративна версія
 * Відвідує всі вершини на поточному рівні перед переходом до наступного
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} startNodeId - ID початкової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з порядком обходу та рівнями
 */
export function breadthFirstSearch(cy, startNodeId, isDirected = false) {
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

  const startNode = cy.getElementById(startNodeId);
  if (!startNode || startNode.length === 0) {
    return {
      error: "Початкова вершина не знайдена",
      details: `Вершина з ID "${startNodeId}" не існує в графі`,
      availableNodes: nodes.map(n => n.id())
    };
  }

  // Будуємо список суміжності
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);

    if (!isDirected) {
      adjacency[target].push(source);
    }
  });

  const visited = new Set();
  const traversalOrder = [];
  const queue = [startNodeId];
  const levels = {}; // Зберігає рівень кожної вершини

  visited.add(startNodeId);
  levels[startNodeId] = 0;

  while (queue.length > 0) {
    const nodeId = queue.shift(); // Видаляємо з початку черги
    traversalOrder.push(nodeId);

    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        levels[neighbor] = levels[nodeId] + 1;
      }
    }
  }

  // Групуємо вершини по рівнях
  const levelGroups = {};
  for (const [nodeId, level] of Object.entries(levels)) {
    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(nodeId);
  }

  return {
    success: true,
    algorithm: 'BFS (Breadth-First Search)',
    traversalOrder: traversalOrder,
    visitedCount: visited.size,
    totalNodes: nodes.length,
    isComplete: visited.size === nodes.length,
    levels: levels,
    levelGroups: levelGroups,
    maxLevel: Math.max(...Object.values(levels)),
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    startNode: startNodeId
  };
}

/**
 * Перевірка зв'язності графу за допомогою DFS
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат перевірки зв'язності
 */
export function checkConnectivity(cy, isDirected = false) {
  if (!cy || typeof cy.nodes !== "function") {
    return {
      error: "Граф не ініціалізовано",
      details: "Екземпляр Cytoscape не знайдено або пошкоджено"
    };
  }

  const nodes = cy.nodes();

  if (nodes.length === 0) {
    return {
      error: "Граф порожній",
      details: "Додайте вершини до графу"
    };
  }

  // Для порожнього графу або графу з однією вершиною
  if (nodes.length === 1) {
    return {
      success: true,
      isConnected: true,
      message: "Граф зв'язний (одна вершина)",
      components: 1
    };
  }

  const edges = cy.edges();

  // Будуємо список суміжності
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);

    // Для перевірки зв'язності неорієнтованого графу або слабкої зв'язності орієнтованого
    if (!isDirected) {
      adjacency[target].push(source);
    } else {
      // Для орієнтованого графу додаємо обернені ребра для перевірки слабкої зв'язності
      if (!adjacency[target].includes(source)) {
        adjacency[target].push(source);
      }
    }
  });

  const visited = new Set();

  function dfs(nodeId) {
    visited.add(nodeId);
    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  // Починаємо DFS з першої вершини
  dfs(nodes[0].id());

  const isConnected = visited.size === nodes.length;

  if (isConnected) {
    return {
      success: true,
      isConnected: true,
      message: isDirected ? "Граф слабко зв'язний" : "Граф зв'язний",
      visitedNodes: visited.size,
      totalNodes: nodes.length,
      components: 1
    };
  } else {
    // Знаходимо всі компоненти зв'язності
    const allVisited = new Set();
    const components = [];

    nodes.forEach(node => {
      const nodeId = node.id();
      if (!allVisited.has(nodeId)) {
        const componentVisited = new Set();

        function dfsComponent(id) {
          componentVisited.add(id);
          allVisited.add(id);
          const neighbors = adjacency[id] || [];
          for (const neighbor of neighbors) {
            if (!componentVisited.has(neighbor)) {
              dfsComponent(neighbor);
            }
          }
        }

        dfsComponent(nodeId);
        components.push(Array.from(componentVisited));
      }
    });

    return {
      success: true,
      isConnected: false,
      message: isDirected ? "Граф не є слабко зв'язним" : "Граф не зв'язний",
      visitedNodes: visited.size,
      totalNodes: nodes.length,
      components: components.length,
      componentsList: components
    };
  }
}

/**
 * Виявлення циклів у графі за допомогою DFS
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат перевірки на наявність циклів
 */
export function detectCycle(cy, isDirected = false) {
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

  // Будуємо список суміжності
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);

    if (!isDirected) {
      adjacency[target].push(source);
    }
  });

  if (isDirected) {
    // Для орієнтованого графу використовуємо DFS з відстеженням стану вершин
    const WHITE = 0; // Не відвідана
    const GRAY = 1;  // В процесі обробки
    const BLACK = 2; // Оброблена

    const color = {};
    nodes.forEach(node => {
      color[node.id()] = WHITE;
    });

    let hasCycle = false;
    const cycleEdges = [];

    function dfs(nodeId, parent = null) {
      if (hasCycle) return;

      color[nodeId] = GRAY;

      const neighbors = adjacency[nodeId] || [];
      for (const neighbor of neighbors) {
        if (color[neighbor] === GRAY) {
          // Знайшли цикл
          hasCycle = true;
          cycleEdges.push({ source: nodeId, target: neighbor });
          return;
        }

        if (color[neighbor] === WHITE) {
          dfs(neighbor, nodeId);
        }
      }

      color[nodeId] = BLACK;
    }

    nodes.forEach(node => {
      if (color[node.id()] === WHITE) {
        dfs(node.id());
      }
    });

    return {
      success: true,
      hasCycle: hasCycle,
      message: hasCycle ? "Граф містить цикл" : "Граф ациклічний (DAG)",
      graphType: 'орієнтований',
      cycleEdges: hasCycle ? cycleEdges : []
    };

  } else {
    // Для неорієнтованого графу
    const visited = new Set();
    let hasCycle = false;

    function dfs(nodeId, parent = null) {
      if (hasCycle) return;

      visited.add(nodeId);

      const neighbors = adjacency[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, nodeId);
        } else if (neighbor !== parent) {
          // Знайшли цикл (сусід вже відвіданий і це не батько)
          hasCycle = true;
          return;
        }
      }
    }

    nodes.forEach(node => {
      if (!visited.has(node.id()) && !hasCycle) {
        dfs(node.id());
      }
    });

    return {
      success: true,
      hasCycle: hasCycle,
      message: hasCycle ? "Граф містить цикл" : "Граф ациклічний",
      graphType: 'неорієнтований'
    };
  }
}
