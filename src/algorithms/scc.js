/**
 * Strongly Connected Components (SCC) - Сильно зв'язні компоненти
 * Використовує алгоритм Тарьяна (Tarjan's Algorithm)
 */

/**
 * Знаходить сильно зв'язні компоненти за алгоритмом Тарьяна
 * Сильно зв'язна компонента - це максимальна множина вершин,
 * в якій з кожної вершини можна досягти будь-якої іншої вершини
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути true для SCC)
 * @returns {Object} Результат з компонентами
 */
export function findStronglyConnectedComponents(cy, isDirected = true) {
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

  // SCC має сенс тільки для орієнтованих графів
  if (!isDirected) {
    return {
      error: "SCC не застосовний для неорієнтованих графів",
      details: "Сильно зв'язні компоненти визначені тільки для орієнтованих графів",
      graphType: 'неорієнтований'
    };
  }

  // Будуємо список суміжності (тільки прямі ребра для орієнтованого графу)
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
  });

  // Алгоритм Тарьяна
  let index = 0;
  const indices = {};
  const lowLinks = {};
  const onStack = {};
  const stack = [];
  const components = [];

  function strongConnect(nodeId) {
    // Встановлюємо index та lowLink для поточної вершини
    indices[nodeId] = index;
    lowLinks[nodeId] = index;
    index++;
    stack.push(nodeId);
    onStack[nodeId] = true;

    // Розглядаємо всіх сусідів
    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      if (indices[neighbor] === undefined) {
        // Сусід ще не відвіданий - рекурсивно викликаємо DFS
        strongConnect(neighbor);
        lowLinks[nodeId] = Math.min(lowLinks[nodeId], lowLinks[neighbor]);
      } else if (onStack[neighbor]) {
        // Сусід в стеку - частина поточної SCC
        lowLinks[nodeId] = Math.min(lowLinks[nodeId], indices[neighbor]);
      }
    }

    // Якщо nodeId є коренем SCC, виймаємо всі вершини компоненти зі стеку
    if (lowLinks[nodeId] === indices[nodeId]) {
      const component = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        component.push(w);
      } while (w !== nodeId);
      components.push(component);
    }
  }

  // Запускаємо алгоритм для всіх невідвіданих вершин
  nodes.forEach(node => {
    if (indices[node.id()] === undefined) {
      strongConnect(node.id());
    }
  });

  // Сортуємо компоненти за розміром (найбільші перші)
  components.sort((a, b) => b.length - a.length);

  // Формуємо зрозумілий вивід
  const componentDetails = components.map((comp, idx) => ({
    id: idx + 1,
    size: comp.length,
    nodes: comp
  }));

  return {
    success: true,
    algorithm: 'Strongly Connected Components (Tarjan)',
    components: components,
    componentDetails: componentDetails,
    componentCount: components.length,
    largestComponent: components[0] || [],
    nodeCount: nodes.length,
    graphType: 'орієнтований',
    message: `Знайдено ${components.length} сильно зв'язних компонент`
  };
}

/**
 * Перевірка чи є граф сильно зв'язним
 * Граф є сильно зв'язним, якщо він складається з однієї SCC
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути true)
 * @returns {Object} Результат перевірки
 */
export function isStronglyConnected(cy, isDirected = true) {
  const result = findStronglyConnectedComponents(cy, isDirected);

  if (result.error) {
    return result;
  }

  const isStronglyConnected = result.componentCount === 1;

  return {
    success: true,
    algorithm: 'Strong Connectivity Check',
    isStronglyConnected: isStronglyConnected,
    componentCount: result.componentCount,
    components: result.components,
    nodeCount: result.nodeCount,
    graphType: 'орієнтований',
    message: isStronglyConnected
      ? "Граф є сильно зв'язним"
      : `Граф не є сильно зв'язним (${result.componentCount} компонент)`
  };
}

/**
 * Знаходить конденсацію графу
 * Конденсація - це граф, в якому кожна SCC стиснута в одну вершину
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути true)
 * @returns {Object} Результат з конденсацією
 */
export function findCondensation(cy, isDirected = true) {
  const sccResult = findStronglyConnectedComponents(cy, isDirected);

  if (sccResult.error) {
    return sccResult;
  }

  const edges = cy.edges();
  const components = sccResult.components;

  // Створюємо мапу: вершина -> номер компоненти
  const nodeToComponent = {};
  components.forEach((comp, idx) => {
    comp.forEach(nodeId => {
      nodeToComponent[nodeId] = idx;
    });
  });

  // Знаходимо ребра між компонентами
  const condensationEdges = new Set();
  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    const sourceComp = nodeToComponent[source];
    const targetComp = nodeToComponent[target];

    // Додаємо ребро між різними компонентами
    if (sourceComp !== targetComp) {
      condensationEdges.add(`${sourceComp}->${targetComp}`);
    }
  });

  // Форматуємо ребра конденсації
  const condensationEdgesList = Array.from(condensationEdges).map(edge => {
    const [source, target] = edge.split('->').map(Number);
    return {
      source: `SCC${source + 1}`,
      target: `SCC${target + 1}`,
      sourceNodes: components[source],
      targetNodes: components[target]
    };
  });

  return {
    success: true,
    algorithm: 'Graph Condensation',
    components: components,
    componentCount: components.length,
    condensationEdges: condensationEdgesList,
    edgeCount: condensationEdgesList.length,
    nodeCount: cy.nodes().length,
    graphType: 'орієнтований',
    message: `Конденсація містить ${components.length} вершин (SCC) та ${condensationEdgesList.length} ребер`
  };
}
