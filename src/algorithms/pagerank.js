/**
 * PageRank - Алгоритм ранжування вершин графу
 * Розроблений Google для ранжування веб-сторінок
 */

/**
 * Обчислює PageRank для всіх вершин графу
 * PageRank показує важливість вершини на основі вхідних зв'язків
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @param {number} dampingFactor - Коефіцієнт затухання (зазвичай 0.85)
 * @param {number} maxIterations - Максимальна кількість ітерацій
 * @param {number} tolerance - Точність збіжності
 * @returns {Object} Результат з PageRank для кожної вершини
 */
export function calculatePageRank(
  cy,
  isDirected = true,
  dampingFactor = 0.85,
  maxIterations = 100,
  tolerance = 0.0001
) {
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

  const n = nodes.length;

  // Валідація параметрів
  if (dampingFactor < 0 || dampingFactor > 1) {
    return {
      error: "Некоректний коефіцієнт затухання",
      details: "Коефіцієнт затухання має бути між 0 та 1"
    };
  }

  // Будуємо список суміжності та вихідних ребер
  const inLinks = {}; // Вхідні зв'язки для кожної вершини
  const outDegree = {}; // Кількість вихідних ребер

  nodes.forEach(node => {
    const nodeId = node.id();
    inLinks[nodeId] = [];
    outDegree[nodeId] = 0;
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');

    // Для орієнтованого графу
    if (isDirected) {
      inLinks[target].push(source);
      outDegree[source]++;
    } else {
      // Для неорієнтованого - двосторонні зв'язки
      inLinks[source].push(target);
      inLinks[target].push(source);
      outDegree[source]++;
      outDegree[target]++;
    }
  });

  // Ініціалізація PageRank (рівномірний розподіл)
  const pageRank = {};
  const newPageRank = {};
  const initialValue = 1.0 / n;

  nodes.forEach(node => {
    pageRank[node.id()] = initialValue;
  });

  // Ітеративне обчислення PageRank
  let iteration = 0;
  let converged = false;
  const steps = [];

  // Початковий стан
  steps.push({
    type: 'init',
    ranks: { ...pageRank },
    iteration: 0
  });

  while (iteration < maxIterations && !converged) {
    let diff = 0;

    // Обчислюємо новий PageRank для кожної вершини
    nodes.forEach(node => {
      const nodeId = node.id();
      let sum = 0;

      // Сумуємо внески від всіх вхідних вершин
      inLinks[nodeId].forEach(inNode => {
        if (outDegree[inNode] > 0) {
          sum += pageRank[inNode] / outDegree[inNode];
        }
      });

      // Формула PageRank з урахуванням коефіцієнта затухання
      newPageRank[nodeId] = (1 - dampingFactor) / n + dampingFactor * sum;

      // Обчислюємо різницю для перевірки збіжності
      diff += Math.abs(newPageRank[nodeId] - pageRank[nodeId]);
    });

    // Оновлюємо значення PageRank
    nodes.forEach(node => {
      pageRank[node.id()] = newPageRank[node.id()];
    });

    iteration++;

    // Зберігаємо крок
    steps.push({
      type: 'iteration',
      ranks: { ...pageRank },
      iteration: iteration,
      diff: diff
    });

    // Перевірка збіжності
    if (diff < tolerance) {
      converged = true;
      steps.push({
        type: 'converged',
        iteration: iteration
      });
    }
  }

  // Нормалізація PageRank (щоб сума = 1)
  let sum = 0;
  nodes.forEach(node => {
    sum += pageRank[node.id()];
  });

  const normalizedPageRank = {};
  nodes.forEach(node => {
    normalizedPageRank[node.id()] = pageRank[node.id()] / sum;
  });

  // Додаємо фінальний нормалізований крок
  steps.push({
    type: 'normalize',
    ranks: { ...normalizedPageRank }
  });

  // Сортуємо вершини за PageRank (від найбільшого до найменшого)
  const rankedNodes = nodes
    .map(node => ({
      id: node.id(),
      pageRank: normalizedPageRank[node.id()],
      percentage: (normalizedPageRank[node.id()] * 100).toFixed(2)
    }))
    .sort((a, b) => b.pageRank - a.pageRank);

  // Знаходимо вершини з найвищим та найнижчим PageRank
  const topNode = rankedNodes[0];
  const bottomNode = rankedNodes[rankedNodes.length - 1];

  return {
    success: true,
    algorithm: 'PageRank',
    pageRank: normalizedPageRank,
    rankedNodes: rankedNodes,
    topNode: topNode,
    bottomNode: bottomNode,
    iterations: iteration,
    converged: converged,
    dampingFactor: dampingFactor,
    nodeCount: n,
    edgeCount: edges.length,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: `PageRank обчислено за ${iteration} ітерацій${converged ? ' (збіглося)' : ' (досягнуто ліміт)'}`,
    steps: steps
  };
}

/**
 * Знаходить топ-N вершин за PageRank
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {number} topN - Кількість топових вершин
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @param {number} dampingFactor - Коефіцієнт затухання
 * @returns {Object} Результат з топ-N вершинами
 */
export function getTopPageRankNodes(cy, topN = 5, isDirected = true, dampingFactor = 0.85) {
  const result = calculatePageRank(cy, isDirected, dampingFactor);

  if (result.error) {
    return result;
  }

  const topNodes = result.rankedNodes.slice(0, topN);

  return {
    success: true,
    algorithm: 'PageRank (Top Nodes)',
    topNodes: topNodes,
    topCount: topN,
    actualCount: Math.min(topN, result.rankedNodes.length),
    iterations: result.iterations,
    converged: result.converged,
    graphType: result.graphType,
    message: `Топ ${Math.min(topN, result.rankedNodes.length)} вершин за PageRank`
  };
}

/**
 * Обчислює персоналізований PageRank з початкової вершини
 * Показує важливість вершин відносно стартової вершини
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} startNodeId - ID початкової вершини
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @param {number} dampingFactor - Коефіцієнт затухання
 * @param {number} maxIterations - Максимальна кількість ітерацій
 * @returns {Object} Результат з персоналізованим PageRank
 */
export function calculatePersonalizedPageRank(
  cy,
  startNodeId,
  isDirected = true,
  dampingFactor = 0.85,
  maxIterations = 100
) {
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

  const startNode = cy.getElementById(startNodeId);
  if (!startNode || startNode.length === 0) {
    return {
      error: "Початкова вершина не знайдена",
      details: `Вершина з ID "${startNodeId}" не існує в графі`
    };
  }

  const edges = cy.edges();
  const n = nodes.length;

  // Будуємо список суміжності
  const inLinks = {};
  const outDegree = {};

  nodes.forEach(node => {
    const nodeId = node.id();
    inLinks[nodeId] = [];
    outDegree[nodeId] = 0;
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');

    if (isDirected) {
      inLinks[target].push(source);
      outDegree[source]++;
    } else {
      inLinks[source].push(target);
      inLinks[target].push(source);
      outDegree[source]++;
      outDegree[target]++;
    }
  });

  // Ініціалізація (вся вага на стартовій вершині)
  const pageRank = {};
  const newPageRank = {};

  nodes.forEach(node => {
    pageRank[node.id()] = node.id() === startNodeId ? 1.0 : 0.0;
  });

  // Ітеративне обчислення
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    nodes.forEach(node => {
      const nodeId = node.id();
      let sum = 0;

      inLinks[nodeId].forEach(inNode => {
        if (outDegree[inNode] > 0) {
          sum += pageRank[inNode] / outDegree[inNode];
        }
      });

      // Персоналізований PageRank - "телепортація" тільки на стартову вершину
      const teleport = nodeId === startNodeId ? (1 - dampingFactor) : 0;
      newPageRank[nodeId] = teleport + dampingFactor * sum;
    });

    nodes.forEach(node => {
      pageRank[node.id()] = newPageRank[node.id()];
    });
  }

  // Сортуємо за важливістю
  const rankedNodes = nodes
    .map(node => ({
      id: node.id(),
      pageRank: pageRank[node.id()],
      percentage: (pageRank[node.id()] * 100).toFixed(2)
    }))
    .sort((a, b) => b.pageRank - a.pageRank);

  return {
    success: true,
    algorithm: 'Personalized PageRank',
    pageRank: pageRank,
    rankedNodes: rankedNodes,
    startNode: startNodeId,
    topNode: rankedNodes[0],
    iterations: maxIterations,
    dampingFactor: dampingFactor,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    message: `Персоналізований PageRank від вершини "${startNodeId}"`
  };
}
