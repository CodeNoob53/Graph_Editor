/**
 * Знаходить Ейлерові шляхи та цикли в графі
 * Ейлерів цикл - це цикл, який проходить через кожне ребро графу рівно один раз
 * Ейлерів шлях - це шлях, який проходить через кожне ребро графу рівно один раз
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з інформацією про Ейлерів шлях/цикл
 */
export function findEulerTrailAndCircuit(cy, isDirected = false) {
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

  if (edges.length === 0) {
    return {
      error: "Немає ребер",
      details: "Додайте ребра до графу"
    };
  }

  if (isDirected) {
    return analyzeDirectedGraph(cy, nodes, edges);
  } else {
    return analyzeUndirectedGraph(cy, nodes, edges);
  }
}

/**
 * Аналізує орієнтований граф на наявність Ейлерового шляху/циклу
 */
function analyzeDirectedGraph(cy, nodes, edges) {
  const inDegree = {};
  const outDegree = {};

  // Ініціалізуємо степені
  nodes.forEach(node => {
    const id = node.id();
    inDegree[id] = 0;
    outDegree[id] = 0;
  });

  // Підраховуємо вхідні та вихідні степені
  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    outDegree[source]++;
    inDegree[target]++;
  });

  let startNodes = 0; // вершини з outDegree - inDegree = 1
  let endNodes = 0;   // вершини з inDegree - outDegree = 1
  let balanced = 0;   // вершини з inDegree = outDegree

  nodes.forEach(node => {
    const id = node.id();
    const diff = outDegree[id] - inDegree[id];

    if (diff === 0) {
      balanced++;
    } else if (diff === 1) {
      startNodes++;
    } else if (diff === -1) {
      endNodes++;
    } else {
      // Якщо різниця більше 1, Ейлерового шляху не існує
      return;
    }
  });

  // Перевіряємо зв'язність
  if (!isWeaklyConnected(cy, nodes, edges)) {
    return {
      error: "Граф не зв'язний",
      details: "Орієнтований граф повинен бути слабко зв'язним для існування Ейлерового шляху",
      graphType: 'орієнтований'
    };
  }

  // Ейлерів цикл: всі вершини мають однакові вхідні та вихідні степені
  if (balanced === nodes.length) {
    return {
      success: true,
      type: 'circuit',
      message: 'Ейлерів цикл існує',
      details: 'Всі вершини мають однакові вхідні та вихідні степені',
      graphType: 'орієнтований'
    };
  }

  // Ейлерів шлях: рівно одна вершина з outDegree - inDegree = 1
  // та рівно одна з inDegree - outDegree = 1
  if (startNodes === 1 && endNodes === 1 && balanced === nodes.length - 2) {
    return {
      success: true,
      type: 'trail',
      message: 'Ейлерів шлях існує',
      details: `Є рівно одна вершина початку та одна вершина кінця`,
      graphType: 'орієнтований'
    };
  }

  return {
    error: "Ейлерів шлях/цикл не існує",
    details: "Умови для Ейлерового шляху або циклу не виконуються",
    graphType: 'орієнтований',
    stats: {
      startNodes,
      endNodes,
      balanced,
      totalNodes: nodes.length
    }
  };
}

/**
 * Аналізує неорієнтований граф на наявність Ейлерового шляху/циклу
 */
function analyzeUndirectedGraph(cy, nodes, edges) {
  const degrees = {};

  // Ініціалізуємо степені
  nodes.forEach(node => {
    degrees[node.id()] = 0;
  });

  // Підраховуємо степені вершин
  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    degrees[source]++;
    degrees[target]++;
  });

  // Перевіряємо зв'язність
  if (!isConnected(cy, nodes, edges)) {
    return {
      error: "Граф не зв'язний",
      details: "Неорієнтований граф повинен бути зв'язним для існування Ейлерового шляху",
      graphType: 'неорієнтований'
    };
  }

  // Підраховуємо вершини з непарним степенем
  const oddDegreeNodes = [];
  nodes.forEach(node => {
    const id = node.id();
    if (degrees[id] % 2 !== 0) {
      oddDegreeNodes.push(id);
    }
  });

  // Ейлерів цикл: всі вершини мають парний степінь
  if (oddDegreeNodes.length === 0) {
    return {
      success: true,
      type: 'circuit',
      message: 'Ейлерів цикл існує',
      details: 'Всі вершини мають парний степінь',
      graphType: 'неорієнтований',
      stats: {
        totalNodes: nodes.length,
        oddDegreeNodes: 0
      }
    };
  }

  // Ейлерів шлях: рівно дві вершини з непарним степенем
  if (oddDegreeNodes.length === 2) {
    return {
      success: true,
      type: 'trail',
      message: 'Ейлерів шлях існує',
      details: `Вершини з непарним степенем: ${oddDegreeNodes.join(', ')}`,
      graphType: 'неорієнтований',
      stats: {
        totalNodes: nodes.length,
        oddDegreeNodes: oddDegreeNodes.length,
        oddNodes: oddDegreeNodes
      }
    };
  }

  return {
    error: "Ейлерів шлях/цикл не існує",
    details: `Знайдено ${oddDegreeNodes.length} вершин з непарним степенем (потрібно 0 або 2)`,
    graphType: 'неорієнтований',
    stats: {
      totalNodes: nodes.length,
      oddDegreeNodes: oddDegreeNodes.length,
      oddNodes: oddDegreeNodes
    }
  };
}

/**
 * Перевіряє чи є неорієнтований граф зв'язним
 */
function isConnected(cy, nodes, edges) {
  if (nodes.length === 0) return true;

  const visited = new Set();
  const adjacency = {};

  // Будуємо список суміжності
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
    adjacency[target].push(source);
  });

  // DFS від першої вершини
  function dfs(nodeId) {
    visited.add(nodeId);
    for (const neighbor of adjacency[nodeId]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  dfs(nodes[0].id());
  return visited.size === nodes.length;
}

/**
 * Перевіряє чи є орієнтований граф слабко зв'язним
 * (зв'язний якщо ігнорувати напрямки ребер)
 */
function isWeaklyConnected(cy, nodes, edges) {
  if (nodes.length === 0) return true;

  const visited = new Set();
  const adjacency = {};

  // Будуємо список суміжності (ігноруючи напрямки)
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
    adjacency[target].push(source);
  });

  // DFS від першої вершини
  function dfs(nodeId) {
    visited.add(nodeId);
    for (const neighbor of adjacency[nodeId]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  dfs(nodes[0].id());
  return visited.size === nodes.length;
}
