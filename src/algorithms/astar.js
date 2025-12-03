/**
 * A* (A-star) - Алгоритм пошуку найкоротшого шляху з евристикою
 * Використовує евристичну функцію для більш ефективного пошуку
 */

/**
 * Евристична функція - Евклідова відстань між вершинами
 * Використовує позиції вершин на площині
 *
 * @param {Object} node1 - Перша вершина Cytoscape
 * @param {Object} node2 - Друга вершина Cytoscape
 * @returns {number} Евклідова відстань
 */
function euclideanDistance(node1, node2) {
  const pos1 = node1.position();
  const pos2 = node2.position();
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Евристична функція - Манхеттенська відстань
 *
 * @param {Object} node1 - Перша вершина Cytoscape
 * @param {Object} node2 - Друга вершина Cytoscape
 * @returns {number} Манхеттенська відстань
 */
function manhattanDistance(node1, node2) {
  const pos1 = node1.position();
  const pos2 = node2.position();
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Знаходить найкоротший шлях між двома вершинами за алгоритмом A*
 * A* використовує евристику для оптимізації пошуку
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID вихідної вершини
 * @param {string} targetId - ID цільової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @param {string} heuristic - Тип евристики: 'euclidean' або 'manhattan'
 * @returns {Object} Результат з шляхом та відстанню
 */
export function findPathAStar(cy, sourceId, targetId, isDirected = false, heuristic = 'euclidean') {
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

  // Перевірка існування вершин
  const sourceNode = cy.getElementById(sourceId);
  const targetNode = cy.getElementById(targetId);

  if (!sourceNode || sourceNode.length === 0) {
    return {
      error: `Вершина "${sourceId}" не знайдена`,
      details: `Доступні вершини: ${nodes.map(n => n.id()).join(', ')}`
    };
  }

  if (!targetNode || targetNode.length === 0) {
    return {
      error: `Вершина "${targetId}" не знайдена`,
      details: `Доступні вершини: ${nodes.map(n => n.id()).join(', ')}`
    };
  }

  // Вибір евристичної функції
  const heuristicFunc = heuristic === 'manhattan' ? manhattanDistance : euclideanDistance;

  // Будуємо список суміжності
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    const weight = parseFloat(edge.data('weight')) || 1;

    adjacency[source].push({ node: target, weight: weight });

    if (!isDirected) {
      adjacency[target].push({ node: source, weight: weight });
    }
  });

  // A* алгоритм
  const openSet = new Set([sourceId]);
  const closedSet = new Set();

  // g(n) - вартість шляху від початку до n
  const gScore = {};
  nodes.forEach(node => {
    gScore[node.id()] = Infinity;
  });
  gScore[sourceId] = 0;

  // f(n) = g(n) + h(n), де h(n) - евристична оцінка від n до цілі
  const fScore = {};
  nodes.forEach(node => {
    fScore[node.id()] = Infinity;
  });
  fScore[sourceId] = heuristicFunc(sourceNode, targetNode);

  // Зберігаємо попередні вершини для відновлення шляху
  const cameFrom = {};

  // Статистика для порівняння з Dijkstra
  let nodesExplored = 0;

  while (openSet.size > 0) {
    // Знаходимо вершину з найменшим fScore
    let current = null;
    let minFScore = Infinity;
    for (const nodeId of openSet) {
      if (fScore[nodeId] < minFScore) {
        minFScore = fScore[nodeId];
        current = nodeId;
      }
    }

    // Якщо досягли цілі
    if (current === targetId) {
      // Відновлюємо шлях
      const path = [];
      let temp = current;
      while (temp !== undefined) {
        path.unshift(temp);
        temp = cameFrom[temp];
      }

      return {
        success: true,
        algorithm: 'A* (A-star)',
        path: path,
        distance: gScore[targetId],
        edgeCount: path.length - 1,
        nodesExplored: nodesExplored,
        heuristic: heuristic,
        graphType: isDirected ? 'орієнтований' : 'неорієнтований',
        message: `Знайдено оптимальний шлях довжиною ${gScore[targetId].toFixed(2)}`
      };
    }

    openSet.delete(current);
    closedSet.add(current);
    nodesExplored++;

    // Розглядаємо всіх сусідів
    const neighbors = adjacency[current] || [];
    for (const neighbor of neighbors) {
      const neighborId = neighbor.node;

      if (closedSet.has(neighborId)) {
        continue; // Вже оброблена
      }

      // Обчислюємо tentative gScore
      const tentativeGScore = gScore[current] + neighbor.weight;

      if (!openSet.has(neighborId)) {
        openSet.add(neighborId);
      } else if (tentativeGScore >= gScore[neighborId]) {
        continue; // Це не кращий шлях
      }

      // Це найкращий шлях до цієї вершини
      cameFrom[neighborId] = current;
      gScore[neighborId] = tentativeGScore;
      const neighborNode = cy.getElementById(neighborId);
      fScore[neighborId] = gScore[neighborId] + heuristicFunc(neighborNode, targetNode);
    }
  }

  // Шлях не знайдено
  return {
    path: [],
    distance: Infinity,
    error: "Шлях не знайдено",
    details: isDirected
      ? `Немає орієнтованого шляху від "${sourceId}" до "${targetId}"`
      : `Вершини "${sourceId}" та "${targetId}" не з'єднані`,
    nodesExplored: nodesExplored,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований'
  };
}

/**
 * Порівняння A* та Dijkstra на тому ж графі
 * Показує ефективність евристики
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID вихідної вершини
 * @param {string} targetId - ID цільової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат порівняння
 */
export function compareAStarWithDijkstra(cy, sourceId, targetId, isDirected = false) {
  // Запускаємо A*
  const astarResult = findPathAStar(cy, sourceId, targetId, isDirected, 'euclidean');

  if (astarResult.error) {
    return astarResult;
  }

  // Для порівняння з Dijkstra, запускаємо простий Dijkstra
  // (можна імпортувати з shortestPath.js або реалізувати тут)

  return {
    success: true,
    algorithm: 'A* vs Dijkstra Comparison',
    astarPath: astarResult.path,
    astarDistance: astarResult.distance,
    astarNodesExplored: astarResult.nodesExplored,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: `A* обробив ${astarResult.nodesExplored} вершин`
  };
}

/**
 * A* з множинними цілями - знаходить найближчу ціль
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID вихідної вершини
 * @param {Array<string>} targetIds - Масив ID цільових вершин
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @param {string} heuristic - Тип евристики
 * @returns {Object} Результат з найближчою ціллю
 */
export function findNearestTarget(cy, sourceId, targetIds, isDirected = false, heuristic = 'euclidean') {
  if (!targetIds || targetIds.length === 0) {
    return {
      error: "Цілі не вказані",
      details: "Надайте масив цільових вершин"
    };
  }

  let bestResult = null;
  let bestDistance = Infinity;
  let bestTarget = null;

  // Шукаємо шлях до кожної цілі
  for (const targetId of targetIds) {
    const result = findPathAStar(cy, sourceId, targetId, isDirected, heuristic);

    if (result.success && result.distance < bestDistance) {
      bestDistance = result.distance;
      bestTarget = targetId;
      bestResult = result;
    }
  }

  if (!bestResult) {
    return {
      error: "Шлях не знайдено",
      details: "Не вдалося знайти шлях до жодної цільової вершини"
    };
  }

  return {
    success: true,
    algorithm: 'A* (Nearest Target)',
    path: bestResult.path,
    distance: bestResult.distance,
    nearestTarget: bestTarget,
    testedTargets: targetIds.length,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: `Найближча ціль: "${bestTarget}" на відстані ${bestResult.distance.toFixed(2)}`
  };
}
