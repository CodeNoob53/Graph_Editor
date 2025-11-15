/**
 * Знаходить найкоротший шлях між двома вершинами за алгоритмом Дейкстри
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} source - ID вихідної вершини
 * @param {string} target - ID цільової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з шляхом та відстанню
 */
export function findShortestPath(cy, source, target, isDirected = false) {
  // Перевірка вхідних даних
  if (!source || !target) {
    return {
      path: [],
      distance: Infinity,
      error: "Не вказано вершини",
      details: "Введіть вихідну (source) та цільову (target) вершини"
    };
  }

  const nodes = cy.nodes().map(node => node.id());

  // Перевірка існування вершин
  if (!nodes.includes(source)) {
    return {
      path: [],
      distance: Infinity,
      error: `Вершина "${source}" не знайдена`,
      details: `Доступні вершини: ${nodes.join(', ')}`
    };
  }

  if (!nodes.includes(target)) {
    return {
      path: [],
      distance: Infinity,
      error: `Вершина "${target}" не знайдена`,
      details: `Доступні вершини: ${nodes.join(', ')}`
    };
  }

  const edges = cy.edges().map(edge => ({
    source: edge.data('source'),
    target: edge.data('target'),
    weight: parseFloat(edge.data('weight')) || 1 // Вага за замовчуванням = 1
  }));

  // Алгоритм Дейкстри
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes);

  nodes.forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[source] = 0;

  while (unvisited.size > 0) {
    // Знаходимо вершину з мінімальною відстанню
    let currentNode = null;
    unvisited.forEach(node => {
      if (currentNode === null || distances[node] < distances[currentNode]) {
        currentNode = node;
      }
    });

    if (distances[currentNode] === Infinity) break;
    unvisited.delete(currentNode);

    // Якщо досягли цільової вершини, можемо зупинитись
    if (currentNode === target) break;

    // Оновлюємо відстані до сусідів
    edges.forEach(edge => {
      // Для орієнтованого графа: тільки якщо ребро йде від current
      if (isDirected) {
        if (edge.source === currentNode && unvisited.has(edge.target)) {
          const alt = distances[currentNode] + edge.weight;
          if (alt < distances[edge.target]) {
            distances[edge.target] = alt;
            previous[edge.target] = currentNode;
          }
        }
      }
      // Для неорієнтованого: обидва напрямки
      else {
        if (edge.source === currentNode && unvisited.has(edge.target)) {
          const alt = distances[currentNode] + edge.weight;
          if (alt < distances[edge.target]) {
            distances[edge.target] = alt;
            previous[edge.target] = currentNode;
          }
        } else if (edge.target === currentNode && unvisited.has(edge.source)) {
          const alt = distances[currentNode] + edge.weight;
          if (alt < distances[edge.source]) {
            distances[edge.source] = alt;
            previous[edge.source] = currentNode;
          }
        }
      }
    });
  }

  // Відновлення шляху
  const path = [];
  let currentNode = target;
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previous[currentNode];
  }

  // Перевірка чи знайдено шлях
  if (path[0] !== source) {
    return {
      path: [],
      distance: Infinity,
      error: "Шлях не знайдено",
      details: isDirected
        ? `Немає орієнтованого шляху від "${source}" до "${target}"`
        : `Вершини "${source}" та "${target}" не з'єднані`,
      graphType: isDirected ? 'орієнтований' : 'неорієнтований'
    };
  }

  return {
    path,
    distance: distances[target],
    edgeCount: path.length - 1,
    success: true,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований'
  };
}
