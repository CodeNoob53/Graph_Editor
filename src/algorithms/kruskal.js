/**
 * Алгоритм Крускала для знаходження мінімального остовного дерева (MST)
 * Використовує Union-Find (Disjoint Set) структуру даних
 */

/**
 * Union-Find структура даних для ефективного об'єднання множин
 */
class UnionFind {
  constructor(elements) {
    this.parent = {};
    this.rank = {};

    // Ініціалізація - кожен елемент сам собі батько
    elements.forEach(element => {
      this.parent[element] = element;
      this.rank[element] = 0;
    });
  }

  /**
   * Знаходить кореневий елемент множини (з оптимізацією path compression)
   */
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  /**
   * Об'єднує дві множини (з оптимізацією union by rank)
   */
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false; // Вже в одній множині
    }

    // Union by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    return true;
  }

  /**
   * Перевіряє чи знаходяться два елементи в одній множині
   */
  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}

/**
 * Обчислює мінімальне остовне дерево за алгоритмом Крускала
 * Сортує всі ребра за вагою і додає їх до MST, якщо вони не створюють цикл
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (MST для неорієнтованих)
 * @returns {Object} Результат з MST
 */
export function calculateKruskalMST(cy, isDirected = false) {
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

  // MST визначений для неорієнтованих графів
  if (isDirected) {
    return {
      error: "MST не застосовний",
      details: "Мінімальне остовне дерево визначене для неорієнтованих графів",
      graphType: 'орієнтований'
    };
  }

  if (edges.length === 0) {
    return {
      error: "Граф не має ребер",
      details: "Додайте ребра до графу"
    };
  }

  // Перевірка зв'язності графу (простий підхід через DFS)
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
    adjacency[target].push(source);
  });

  // DFS для перевірки зв'язності
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

  dfs(nodes[0].id());

  if (visited.size !== nodes.length) {
    return {
      error: "Граф не зв'язний",
      details: `MST існує тільки для зв'язних графів. Граф має ${nodes.length - visited.size} ізольованих вершин`,
      visitedNodes: visited.size,
      totalNodes: nodes.length
    };
  }

  // Створюємо список всіх ребер з вагами
  const edgeList = [];
  const processedEdges = new Set(); // Щоб не дублювати ребра в неорієнтованому графі

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    const weight = parseFloat(edge.data('weight')) || 1;

    // Для неорієнтованого графу, додаємо ребро тільки один раз
    const edgeKey1 = `${source}-${target}`;
    const edgeKey2 = `${target}-${source}`;

    if (!processedEdges.has(edgeKey1) && !processedEdges.has(edgeKey2)) {
      edgeList.push({
        source: source,
        target: target,
        weight: weight,
        edgeId: edge.id()
      });
      processedEdges.add(edgeKey1);
      processedEdges.add(edgeKey2);
    }
  });

  // Сортуємо ребра за вагою (по зростанню)
  edgeList.sort((a, b) => a.weight - b.weight);

  // Ініціалізуємо Union-Find структуру
  const uf = new UnionFind(nodes.map(n => n.id()));

  // Алгоритм Крускала
  const mst = [];
  let totalWeight = 0;

  for (const edge of edgeList) {
    // Якщо вершини не в одній множині, додаємо ребро
    if (uf.union(edge.source, edge.target)) {
      mst.push({
        source: edge.source,
        target: edge.target,
        weight: edge.weight
      });
      totalWeight += edge.weight;

      // MST має рівно n-1 ребер
      if (mst.length === nodes.length - 1) {
        break;
      }
    }
  }

  // Перевірка чи знайшли повне MST
  if (mst.length !== nodes.length - 1) {
    return {
      error: "Не вдалося побудувати MST",
      details: "Граф може бути не зв'язним",
      foundEdges: mst.length,
      requiredEdges: nodes.length - 1
    };
  }

  return {
    success: true,
    algorithm: 'Kruskal MST',
    mst: mst,
    totalWeight: totalWeight,
    edgeCount: mst.length,
    nodeCount: nodes.length,
    processedEdges: edgeList.length,
    graphType: 'неорієнтований',
    message: `MST знайдено з вагою ${totalWeight.toFixed(2)}`
  };
}

/**
 * Порівняння алгоритмів Крускала та Пріма
 * Обидва знаходять MST, але різними методами
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @returns {Object} Результат порівняння
 */
export function compareMSTAlgorithms(cy) {
  const kruskalResult = calculateKruskalMST(cy, false);

  if (kruskalResult.error) {
    return kruskalResult;
  }

  // Можна також викликати Prim's алгоритм для порівняння
  // import { calculatePrimMST } from './mst.js';
  // const primResult = calculatePrimMST(cy, false);

  return {
    success: true,
    algorithm: 'Kruskal MST',
    mst: kruskalResult.mst,
    totalWeight: kruskalResult.totalWeight,
    edgeCount: kruskalResult.edgeCount,
    nodeCount: kruskalResult.nodeCount,
    method: 'Edge-based (Kruskal)',
    graphType: 'неорієнтований',
    message: `Крускал: обробив ${kruskalResult.processedEdges} ребер, знайшов MST з вагою ${kruskalResult.totalWeight.toFixed(2)}`
  };
}

/**
 * Знаходить максимальне остовне дерево (Maximum Spanning Tree)
 * Використовує модифікований алгоритм Крускала (сортування за спаданням)
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з максимальним остовним деревом
 */
export function calculateMaximumSpanningTree(cy, isDirected = false) {
  if (!cy || typeof cy.nodes !== "function") {
    return {
      error: "Граф не ініціалізовано",
      details: "Екземпляр Cytoscape не знайдено або пошкоджено"
    };
  }

  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length === 0 || edges.length === 0) {
    return {
      error: "Граф порожній або не має ребер",
      details: "Додайте вершини та ребра до графу"
    };
  }

  if (isDirected) {
    return {
      error: "Алгоритм не застосовний",
      details: "Максимальне остовне дерево визначене для неорієнтованих графів",
      graphType: 'орієнтований'
    };
  }

  // Створюємо список ребер
  const edgeList = [];
  const processedEdges = new Set();

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    const weight = parseFloat(edge.data('weight')) || 1;

    const edgeKey1 = `${source}-${target}`;
    const edgeKey2 = `${target}-${source}`;

    if (!processedEdges.has(edgeKey1) && !processedEdges.has(edgeKey2)) {
      edgeList.push({
        source: source,
        target: target,
        weight: weight
      });
      processedEdges.add(edgeKey1);
      processedEdges.add(edgeKey2);
    }
  });

  // Сортуємо ребра за вагою (ПО СПАДАННЮ для максимального дерева)
  edgeList.sort((a, b) => b.weight - a.weight);

  const uf = new UnionFind(nodes.map(n => n.id()));
  const mst = [];
  let totalWeight = 0;

  for (const edge of edgeList) {
    if (uf.union(edge.source, edge.target)) {
      mst.push({
        source: edge.source,
        target: edge.target,
        weight: edge.weight
      });
      totalWeight += edge.weight;

      if (mst.length === nodes.length - 1) {
        break;
      }
    }
  }

  return {
    success: true,
    algorithm: 'Maximum Spanning Tree (Kruskal)',
    mst: mst,
    totalWeight: totalWeight,
    edgeCount: mst.length,
    nodeCount: nodes.length,
    graphType: 'неорієнтований',
    message: `Максимальне остовне дерево з вагою ${totalWeight.toFixed(2)}`
  };
}
