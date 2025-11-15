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

  const combinations = getCombinations(nodes, 4);

  for (const combination of combinations) {
    const [u, v, x, y] = combination;

    const weightUV = findShortestPathWeight(graph, u, v);
    const weightVX = findShortestPathWeight(graph, v, x);
    const weightXY = findShortestPathWeight(graph, x, y);

    if (weightUV !== Infinity && weightVX !== Infinity && weightXY !== Infinity) {
      const totalWeight = weightUV + weightVX + weightXY;

      if (totalWeight < minWeight) {
        minWeight = totalWeight;
        bestPath = [u, v, x, y];
      }
    }
  }

  function findShortestPathWeight(graph, start, target) {
    const visited = new Set();
    let minWeight = Infinity;

    function dfs(node, weight) {
      if (node === target) {
        minWeight = Math.min(minWeight, weight);
        return;
      }
      visited.add(node);
      for (const neighbor of graph[node]) {
        if (!visited.has(neighbor.target)) {
          dfs(neighbor.target, weight + neighbor.weight);
        }
      }
      visited.delete(node);
    }

    dfs(start, 0);
    return minWeight;
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
