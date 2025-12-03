/**
 * Алгоритм Беллмана-Форда для знаходження найкоротших шляхів
 * На відміну від Дейкстри, може працювати з від'ємними вагами
 * і виявляти від'ємні цикли
 */

/**
 * Знаходить найкоротші шляхи від вихідної вершини до всіх інших
 * за алгоритмом Беллмана-Форда
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID вихідної вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з відстанями та шляхами
 */
export function bellmanFord(cy, sourceId, isDirected = false) {
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

  // Перевірка існування вихідної вершини
  const sourceNode = cy.getElementById(sourceId);
  if (!sourceNode || sourceNode.length === 0) {
    return {
      error: `Вершина "${sourceId}" не знайдена`,
      details: `Доступні вершини: ${nodes.map(n => n.id()).join(', ')}`
    };
  }

  // Створюємо список ребер
  const edgeList = [];
  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    const weight = parseFloat(edge.data('weight')) || 1;

    edgeList.push({
      source: source,
      target: target,
      weight: weight
    });

    // Для неорієнтованого графу додаємо зворотне ребро
    if (!isDirected) {
      edgeList.push({
        source: target,
        target: source,
        weight: weight
      });
    }
  });

  // Ініціалізація відстаней
  const distances = {};
  const predecessors = {};

  nodes.forEach(node => {
    const nodeId = node.id();
    distances[nodeId] = Infinity;
    predecessors[nodeId] = null;
  });
  distances[sourceId] = 0;

  // Релаксація ребер (V-1) разів
  const V = nodes.length;
  for (let i = 0; i < V - 1; i++) {
    let updated = false;

    for (const edge of edgeList) {
      const u = edge.source;
      const v = edge.target;
      const weight = edge.weight;

      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        predecessors[v] = u;
        updated = true;
      }
    }

    // Якщо жодне ребро не було оновлено, можна зупинитися раніше
    if (!updated) {
      break;
    }
  }

  // Перевірка на наявність від'ємних циклів
  const negativeCycle = [];
  for (const edge of edgeList) {
    const u = edge.source;
    const v = edge.target;
    const weight = edge.weight;

    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      // Знайдено від'ємний цикл
      negativeCycle.push({
        source: u,
        target: v,
        weight: weight
      });
    }
  }

  if (negativeCycle.length > 0) {
    return {
      error: "Виявлено від'ємний цикл",
      details: "Граф містить від'ємний цикл, найкоротші шляхи не визначені",
      negativeCycle: negativeCycle,
      negativeCycleCount: negativeCycle.length,
      graphType: isDirected ? 'орієнтований' : 'неорієнтований'
    };
  }

  // Формуємо результат
  const pathsToAllNodes = [];
  nodes.forEach(node => {
    const nodeId = node.id();
    if (nodeId !== sourceId && distances[nodeId] !== Infinity) {
      // Відновлюємо шлях
      const path = [];
      let current = nodeId;
      while (current !== null) {
        path.unshift(current);
        current = predecessors[current];
      }

      pathsToAllNodes.push({
        target: nodeId,
        distance: distances[nodeId],
        path: path
      });
    }
  });

  // Сортуємо за відстанню
  pathsToAllNodes.sort((a, b) => a.distance - b.distance);

  return {
    success: true,
    algorithm: 'Bellman-Ford',
    source: sourceId,
    distances: distances,
    predecessors: predecessors,
    paths: pathsToAllNodes,
    reachableNodes: pathsToAllNodes.length,
    totalNodes: nodes.length - 1, // Мінус вихідна вершина
    hasNegativeCycle: false,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: `Знайдено шляхи до ${pathsToAllNodes.length} вершин`
  };
}

/**
 * Знаходить найкоротший шлях між двома конкретними вершинами
 * використовуючи алгоритм Беллмана-Форда
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID вихідної вершини
 * @param {string} targetId - ID цільової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з шляхом
 */
export function findPathBellmanFord(cy, sourceId, targetId, isDirected = false) {
  const result = bellmanFord(cy, sourceId, isDirected);

  if (result.error) {
    return result;
  }

  // Перевірка чи існує шлях до цільової вершини
  if (result.distances[targetId] === Infinity) {
    return {
      path: [],
      distance: Infinity,
      error: "Шлях не знайдено",
      details: isDirected
        ? `Немає орієнтованого шляху від "${sourceId}" до "${targetId}"`
        : `Вершини "${sourceId}" та "${targetId}" не з'єднані`,
      graphType: isDirected ? 'орієнтований' : 'неорієнтований'
    };
  }

  // Відновлюємо шлях
  const path = [];
  let current = targetId;
  while (current !== null) {
    path.unshift(current);
    current = result.predecessors[current];
  }

  return {
    success: true,
    algorithm: 'Bellman-Ford (Single Path)',
    path: path,
    distance: result.distances[targetId],
    edgeCount: path.length - 1,
    source: sourceId,
    target: targetId,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: `Знайдено шлях довжиною ${result.distances[targetId].toFixed(2)}`
  };
}

/**
 * Виявляє всі від'ємні цикли в графі
 * Запускає Bellman-Ford з кожної вершини
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з від'ємними циклами
 */
export function detectNegativeCycles(cy, isDirected = false) {
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

  // Запускаємо Bellman-Ford з першої вершини (достатньо для виявлення)
  const result = bellmanFord(cy, nodes[0].id(), isDirected);

  if (result.error && result.negativeCycle) {
    return {
      success: true,
      algorithm: 'Negative Cycle Detection',
      hasNegativeCycle: true,
      negativeCycles: result.negativeCycle,
      cycleCount: result.negativeCycleCount,
      graphType: isDirected ? 'орієнтований' : 'неорієнтований',
      message: `Виявлено ${result.negativeCycleCount} ребер від'ємного циклу`
    };
  }

  return {
    success: true,
    algorithm: 'Negative Cycle Detection',
    hasNegativeCycle: false,
    cycleCount: 0,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: "Від'ємних циклів не виявлено"
  };
}

/**
 * Знаходить найдовший шлях в DAG (Directed Acyclic Graph)
 * Використовує модифікований Bellman-Ford з інверсією ваг
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID вихідної вершини
 * @param {string} targetId - ID цільової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути true для DAG)
 * @returns {Object} Результат з найдовшим шляхом
 */
export function findLongestPathInDAG(cy, sourceId, targetId, isDirected = true) {
  if (!isDirected) {
    return {
      error: "Алгоритм не застосовний",
      details: "Найдовший шлях в DAG визначений тільки для орієнтованих графів",
      graphType: 'неорієнтований'
    };
  }

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

  // Інвертуємо ваги для пошуку найдовшого шляху
  const edgeList = [];
  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    const weight = parseFloat(edge.data('weight')) || 1;

    edgeList.push({
      source: source,
      target: target,
      weight: -weight, // Інвертуємо вагу
      originalWeight: weight
    });
  });

  // Ініціалізація
  const distances = {};
  const predecessors = {};

  nodes.forEach(node => {
    const nodeId = node.id();
    distances[nodeId] = Infinity;
    predecessors[nodeId] = null;
  });
  distances[sourceId] = 0;

  // Релаксація
  const V = nodes.length;
  for (let i = 0; i < V - 1; i++) {
    for (const edge of edgeList) {
      const u = edge.source;
      const v = edge.target;
      const weight = edge.weight;

      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        predecessors[v] = u;
      }
    }
  }

  // Відновлюємо шлях
  if (distances[targetId] === Infinity) {
    return {
      path: [],
      distance: -Infinity,
      error: "Шлях не знайдено",
      details: `Немає шляху від "${sourceId}" до "${targetId}"`,
      graphType: 'орієнтований'
    };
  }

  const path = [];
  let current = targetId;
  while (current !== null) {
    path.unshift(current);
    current = predecessors[current];
  }

  // Інвертуємо відстань назад
  const actualDistance = -distances[targetId];

  return {
    success: true,
    algorithm: 'Longest Path in DAG',
    path: path,
    distance: actualDistance,
    edgeCount: path.length - 1,
    source: sourceId,
    target: targetId,
    graphType: 'орієнтований (DAG)',
    message: `Найдовший шлях має довжину ${actualDistance.toFixed(2)}`
  };
}
