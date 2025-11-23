import { getCombinations } from '../utils/combinatorics.js';

/**
 * Генерує всі перестановки масиву
 */
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = getPermutations(remaining);
    for (const perm of remainingPerms) {
      result.push([current, ...perm]);
    }
  }
  return result;
}

/**
 * Знаходить мінімальний зважений шлях через 4 вершини
 * Шукає перестановку з 4 вершин (p1, p2, p3, p4) таку, що шлях p1→p2→p3→p4 має мінімальну вагу
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
    id: edge.id()
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

  // 1. Ініціалізація Floyd-Warshall
  const dist = {};
  const next = {};
  const nodeIndices = {};

  nodes.forEach((node, i) => {
    nodeIndices[node] = i;
    dist[node] = {};
    next[node] = {};
    nodes.forEach(other => {
      dist[node][other] = node === other ? 0 : Infinity;
      next[node][other] = null;
    });
  });

  edges.forEach(edge => {
    const u = edge.source;
    const v = edge.target;
    const w = edge.weight;

    if (w < dist[u][v]) {
      dist[u][v] = w;
      next[u][v] = v;
    }

    if (!isDirected) {
      if (w < dist[v][u]) {
        dist[v][u] = w;
        next[v][u] = u;
      }
    }
  });

  // 2. Виконання алгоритму Floyd-Warshall
  nodes.forEach(k => {
    nodes.forEach(i => {
      nodes.forEach(j => {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      });
    });
  });

  let minWeight = Infinity;
  let bestPermutation = null;
  let bestFullPath = null;
  let bestEdges = [];

  // 3. Перебір всіх комбінацій по 4 вершини
  const combinations = getCombinations(nodes, 4);
  let checkedCombinations = 0;

  for (const combination of combinations) {
    // Для кожної комбінації перевіряємо всі перестановки (4! = 24 варіанти)
    const permutations = getPermutations(combination);

    for (const perm of permutations) {
      checkedCombinations++;
      const [p1, p2, p3, p4] = perm;

      const w1 = dist[p1][p2];
      const w2 = dist[p2][p3];
      const w3 = dist[p3][p4];

      if (w1 !== Infinity && w2 !== Infinity && w3 !== Infinity) {
        const totalWeight = w1 + w2 + w3;

        if (totalWeight < minWeight) {
          minWeight = totalWeight;
          bestPermutation = perm;
        }
      }
    }
  }

  // 4. Відновлення повного шляху для найкращої перестановки
  if (bestPermutation) {
    bestFullPath = [];
    bestEdges = [];

    const [p1, p2, p3, p4] = bestPermutation;
    const segments = [[p1, p2], [p2, p3], [p3, p4]];

    // Додаємо початкову вершину
    bestFullPath.push(p1);

    for (const [start, end] of segments) {
      let curr = start;
      while (curr !== end) {
        const nxt = next[curr][end];
        bestFullPath.push(nxt);

        // Знаходимо ребро між curr і nxt для підсвітки
        // Шукаємо ребро з мінімальною вагою, якщо їх декілька
        const candidates = edges.filter(e =>
          (e.source === curr && e.target === nxt) ||
          (!isDirected && e.source === nxt && e.target === curr)
        );

        if (candidates.length > 0) {
          // Сортуємо за вагою і беремо найменше
          candidates.sort((a, b) => a.weight - b.weight);
          bestEdges.push({
            source: candidates[0].source,
            target: candidates[0].target,
            id: candidates[0].id
          });
        }

        curr = nxt;
      }
    }
  }

  if (!bestPermutation) {
    return {
      error: "Шлях не знайдено",
      details: isDirected
        ? "Не існує орієнтованого шляху через будь-які 4 вершини."
        : "Не існує шляху через будь-які 4 вершини. Граф може бути не зв'язним.",
      graphType: isDirected ? 'орієнтований' : 'неорієнтований',
      checkedCombinations: checkedCombinations
    };
  }

  const formattedPath = bestPermutation.map((node, i) =>
    i < bestPermutation.length - 1
      ? `(${node} \\to ${bestPermutation[i + 1]})`
      : null
  ).filter(Boolean).join(", ");

  return {
    bestPath: bestPermutation,
    bestFullPath,
    bestEdges,
    minWeight,
    vertexCount: 4,
    segmentCount: 3,
    checkedCombinations: checkedCombinations,
    success: true,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    formattedMessage: `
      $\\text{Minimum Weighted Path for 4 Vertices:}$<br>
      $\\text{Path: } \\{ ${formattedPath} \\}$<br>
      $\\text{Total Weight: } ${minWeight}$
    `
  };
}
