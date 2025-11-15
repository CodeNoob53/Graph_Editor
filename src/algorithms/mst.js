/**
 * Обчислює мінімальне остовне дерево (MST) за алгоритмом Пріма
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з MST або помилкою
 */
export function calculatePrimMST(cy, isDirected = false) {
  const nodes = cy.nodes();

  // Перевірка: чи граф не порожній
  if (nodes.length === 0) {
    return {
      error: "Граф порожній",
      details: "Додайте хоча б одну вершину для обчислення MST"
    };
  }

  // Перевірка: чи граф не орієнтований (MST тільки для неорієнтованих)
  if (isDirected) {
    return {
      error: "MST не визначено для орієнтованих графів",
      details: "Мінімальне остовне дерево існує тільки для неорієнтованих графів. Перемкніть граф на неорієнтований."
    };
  }

  const edges = cy.edges().map((edge) => ({
    id: edge.id(),
    source: edge.data("source"),
    target: edge.data("target"),
    weight: parseFloat(edge.data("weight")) || Infinity,
  }));

  // Перевірка: чи всі ребра мають вагу
  const edgesWithoutWeight = edges.filter(e => e.weight === Infinity);
  if (edgesWithoutWeight.length > 0) {
    return {
      error: "Деякі ребра не мають ваги",
      details: `Знайдено ${edgesWithoutWeight.length} ребер без ваги. Встановіть вагу для всіх ребер (подвійний клік на ребро).`
    };
  }

  // Побудова графа (неорієнтований - двосторонні зв'язки)
  const graph = {};
  nodes.forEach((node) => { graph[node.id()] = []; });

  edges.forEach((edge) => {
    graph[edge.source].push({ node: edge.target, weight: edge.weight, edgeId: edge.id });
    graph[edge.target].push({ node: edge.source, weight: edge.weight, edgeId: edge.id });
  });

  // Алгоритм Пріма
  const mst = [];
  const visited = new Set();
  const minHeap = [{ node: nodes[0].id(), weight: 0, parent: null, edgeId: null }];

  while (minHeap.length > 0) {
    minHeap.sort((a, b) => a.weight - b.weight);
    const current = minHeap.shift();

    if (visited.has(current.node)) continue;
    visited.add(current.node);

    if (current.parent !== null) {
      mst.push({
        source: current.parent,
        target: current.node,
        weight: current.weight,
        edgeId: current.edgeId
      });
    }

    graph[current.node].forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        minHeap.push({
          node: neighbor.node,
          weight: neighbor.weight,
          parent: current.node,
          edgeId: neighbor.edgeId
        });
      }
    });
  }

  // Перевірка зв'язності
  if (visited.size !== nodes.length) {
    return {
      error: "Граф не є зв'язним",
      details: `Знайдено ${visited.size} із ${nodes.length} вершин. Граф має ізольовані компоненти. Додайте ребра для з'єднання всіх вершин.`,
      visitedNodes: visited.size,
      totalNodes: nodes.length
    };
  }

  // Обчислення загальної ваги
  const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);

  return {
    mst,
    totalWeight,
    edgeCount: mst.length,
    nodeCount: nodes.length,
    success: true
  };
}
