import { getCombinations } from '../utils/combinatorics.js';

/**
 * Генерує всі можливі остовні дерева графа
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Array|Object} Масив остовних дерев або об'єкт з помилкою
 */
export function generateAllSpanningTrees(cy, isDirected = false) {
  const nodes = cy.nodes().map(node => node.id());

  // Перевірка: чи граф не порожній
  if (nodes.length === 0) {
    return {
      error: "Граф порожній",
      details: "Додайте вершини для генерації остовних дерев"
    };
  }

  // Перевірка: тільки для неорієнтованих графів
  if (isDirected) {
    return {
      error: "Остовні дерева не визначені для орієнтованих графів",
      details: "Цей алгоритм працює тільки з неорієнтованими графами. Перемкніть граф на неорієнтований."
    };
  }

  const edges = cy.edges().map(edge => ({
    id: edge.id(),
    source: edge.data('source'),
    target: edge.data('target'),
    weight: parseFloat(edge.data('weight')) || 0,
  }));

  // Перевірка: чи достатньо ребер
  const minEdges = nodes.length - 1;
  if (edges.length < minEdges) {
    return {
      error: "Недостатньо ребер",
      details: `Для ${nodes.length} вершин потрібно мінімум ${minEdges} ребер. Поточна кількість: ${edges.length}`,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      minRequired: minEdges
    };
  }

  // Генерація всіх підмножин ребер розміру n-1
  const subsets = getCombinations(edges, nodes.length - 1);

  // Фільтрація: тільки ті, що є остовними деревами
  const spanningTrees = subsets.filter(subset => isSpanningTree(nodes, subset));

  if (spanningTrees.length === 0) {
    return {
      error: "Остовних дерев не знайдено",
      details: "Граф може бути не зв'язним. Перевірте що всі вершини з'єднані.",
      checkedCombinations: subsets.length
    };
  }

  return {
    trees: spanningTrees,
    count: spanningTrees.length,
    nodeCount: nodes.length,
    edgesPerTree: nodes.length - 1,
    totalCombinations: subsets.length,
    success: true
  };
}

/**
 * Перевіряє чи є набір ребер остовним деревом
 *
 * @param {Array} nodes - Масив ID вершин
 * @param {Array} edges - Масив ребер
 * @returns {boolean} true якщо це остовне дерево
 */
export function isSpanningTree(nodes, edges) {
  // Умова 1: кількість ребер має дорівнювати n-1
  if (edges.length !== nodes.length - 1) return false;

  // Побудова графа
  const graph = {};
  nodes.forEach(node => (graph[node] = []));
  edges.forEach(edge => {
    graph[edge.source].push(edge.target);
    graph[edge.target].push(edge.source);
  });

  // Умова 2: граф має бути зв'язним (перевірка DFS)
  const visited = new Set();
  (function dfs(node) {
    if (visited.has(node)) return;
    visited.add(node);
    graph[node].forEach(neighbor => dfs(neighbor));
  })(nodes[0]);

  return visited.size === nodes.length;
}
