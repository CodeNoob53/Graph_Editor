import { getCombinations } from '../utils/combinatorics.js';

/**
 * Знаходить мінімальний зважений шлях через 4 вершини
 * Шукає комбінацію з 4 вершин (u, v, x, y) таку, що шлях u→v→x→y має мінімальну вагу
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object|string} Результат з шляхом та вагою або повідомлення про помилку
 */
export function findMinWeightedPathForFourVertices(cy, isDirected = false) {
  if (!cy || typeof cy.nodes !== "function") {
    return {
      error: "Граф не ініціалізовано",
      details: "Екземпляр Cytoscape не знайдено або пошкоджено"
    };
  }

  const nodes = cy.nodes().map(node => node.id());

  // Перевірка: чи достатньо вершин
  if (nodes.length < 4) {
    return {
      error: "Недостатньо вершин",
      details: `Для знаходження шляху через 4 вершини потрібно мінімум 4 вершини. Поточна кількість: ${nodes.length}`,
      required: 4,
      current: nodes.length
    };
  }

  const edges = cy.edges().map(edge => ({
    source: edge.data('source'),
    target: edge.data('target'),
    weight: parseFloat(edge.data('weight')) || Infinity,
  }));

  // Перевірка: чи всі ребра мають вагу
  const edgesWithoutWeight = edges.filter(e => e.weight === Infinity);
  if (edgesWithoutWeight.length > 0) {
    return {
      error: "Деякі ребра не мають ваги",
      details: `Знайдено ${edgesWithoutWeight.length} ребер без ваги. Встановіть вагу для всіх ребер (подвійний клік на ребро).`,
      edgesWithoutWeight: edgesWithoutWeight.length,
      totalEdges: edges.length
    };
  }

  const graph = {};
  nodes.forEach(node => graph[node] = []);
  edges.forEach(edge => {
    graph[edge.source].push({ target: edge.target, weight: edge.weight });
    if (!isDirected) {
      graph[edge.target].push({ target: edge.source, weight: edge.weight });
    }
  });

  let minWeight = Infinity;
  let bestPath = null;
  let bestFullPath = null;
  let bestEdges = null;

  const combinations = getCombinations(nodes, 4);

  for (const combination of combinations) {
    const [u, v, x, y] = combination;

    const pathUV = findShortestPath(graph, u, v);
    const pathVX = findShortestPath(graph, v, x);
    const pathXY = findShortestPath(graph, x, y);

    if (pathUV && pathVX && pathXY) {
      const totalWeight = pathUV.weight + pathVX.weight + pathXY.weight;

      if (totalWeight < minWeight) {
        minWeight = totalWeight;
        bestPath = [u, v, x, y];

        // Об'єднуємо всі шляхи, видаляючи дублікати на межах
        bestFullPath = [
          ...pathUV.path,
          ...pathVX.path.slice(1),
          ...pathXY.path.slice(1)
        ];

        // Створюємо список ребер для підсвітки
        bestEdges = [
          ...pathUV.edges,
          ...pathVX.edges,
          ...pathXY.edges
        ];
      }
    }
  }

  function findShortestPath(graph, start, target) {
    const visited = new Set();
    let minWeight = Infinity;
    let bestPath = null;

    function dfs(node, weight, path) {
      if (node === target) {
        if (weight < minWeight) {
          minWeight = weight;
          bestPath = [...path];
        }
        return;
      }
      visited.add(node);
      for (const neighbor of graph[node]) {
        if (!visited.has(neighbor.target)) {
          dfs(neighbor.target, weight + neighbor.weight, [...path, neighbor.target]);
        }
      }
      visited.delete(node);
    }

    dfs(start, 0, [start]);

    if (!bestPath) return null;

    // Створюємо список ребер зі шляху
    const edges = [];
    for (let i = 0; i < bestPath.length - 1; i++) {
      edges.push({ source: bestPath[i], target: bestPath[i + 1] });
    }

    return { weight: minWeight, path: bestPath, edges };
  }

  if (!bestPath) {
    return {
      error: "Шлях не знайдено",
      details: isDirected
        ? "Не існує орієнтованого шляху через 4 вершини з заданими ребрами. Перевірте що всі необхідні вершини з'єднані."
        : "Не існує шляху через 4 вершини. Граф може бути не зв'язним або ребер недостатньо для з'єднання всіх вершин.",
      graphType: isDirected ? 'орієнтований' : 'неорієнтований',
      checkedCombinations: combinations.length
    };
  }

  const formattedPath = bestPath.map((node, i) =>
    i < bestPath.length - 1
      ? `(${node} \\to ${bestPath[i + 1]})`
      : null
  ).filter(Boolean).join(", ");

  return {
    bestPath,
    bestFullPath,
    bestEdges,
    minWeight,
    vertexCount: 4,
    segmentCount: 3,
    checkedCombinations: combinations.length,
    success: true,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    formattedMessage: `
      $\\text{Minimum Weighted Path for 4 Vertices:}$<br>
      $\\text{Path: } \\{ ${formattedPath} \\}$<br>
      $\\text{Total Weight: } ${minWeight}$
    `
  };
}
