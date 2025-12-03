/**
 * Пошук мостів та точок зчленування (артикуляційних вершин) в графі
 * Використовує алгоритм на основі DFS з low-link значеннями
 */

/**
 * Знаходить мости в графі
 * Міст - це ребро, видалення якого збільшує кількість компонент зв'язності
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (для мостів має бути false)
 * @returns {Object} Результат з мостами
 */
export function findBridges(cy, isDirected = false) {
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

  // Мости визначені для неорієнтованих графів
  if (isDirected) {
    return {
      error: "Алгоритм не застосовний",
      details: "Пошук мостів класично визначений для неорієнтованих графів",
      graphType: 'орієнтований'
    };
  }

  // Будуємо список суміжності (неорієнтований граф)
  const adjacency = {};
  const edgeMap = {}; // Мапа для швидкого пошуку ребер

  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
    adjacency[target].push(source);

    // Зберігаємо ребра в обох напрямках
    const key1 = `${source}-${target}`;
    const key2 = `${target}-${source}`;
    edgeMap[key1] = edge;
    edgeMap[key2] = edge;
  });

  // Алгоритм пошуку мостів
  let time = 0;
  const visited = {};
  const disc = {}; // Час відкриття вершини
  const low = {};  // Найменший час досяжний з піддерева
  const parent = {};
  const bridges = [];

  function dfs(u) {
    visited[u] = true;
    disc[u] = low[u] = time++;

    const neighbors = adjacency[u] || [];
    for (const v of neighbors) {
      if (!visited[v]) {
        parent[v] = u;
        dfs(v);

        // Оновлюємо low[u]
        low[u] = Math.min(low[u], low[v]);

        // Якщо low[v] > disc[u], то (u, v) є мостом
        if (low[v] > disc[u]) {
          bridges.push({
            source: u,
            target: v,
            edge: edgeMap[`${u}-${v}`]
          });
        }
      } else if (v !== parent[u]) {
        // Оновлюємо low[u] для зворотного ребра
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  }

  // Запускаємо DFS для всіх компонент
  nodes.forEach(node => {
    const nodeId = node.id();
    if (!visited[nodeId]) {
      parent[nodeId] = null;
      dfs(nodeId);
    }
  });

  return {
    success: true,
    algorithm: 'Bridges (Tarjan)',
    bridges: bridges.map(b => ({ source: b.source, target: b.target })),
    bridgeCount: bridges.length,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    graphType: 'неорієнтований',
    message: bridges.length > 0
      ? `Знайдено ${bridges.length} мостів`
      : 'Мостів не знайдено - граф є 2-реберно зв\'язним'
  };
}

/**
 * Знаходить точки зчленування (артикуляційні вершини) в графі
 * Точка зчленування - це вершина, видалення якої збільшує кількість компонент зв'язності
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (для точок має бути false)
 * @returns {Object} Результат з точками зчленування
 */
export function findArticulationPoints(cy, isDirected = false) {
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

  if (isDirected) {
    return {
      error: "Алгоритм не застосовний",
      details: "Пошук точок зчленування класично визначений для неорієнтованих графів",
      graphType: 'орієнтований'
    };
  }

  // Будуємо список суміжності
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

  // Алгоритм пошуку точок зчленування
  let time = 0;
  const visited = {};
  const disc = {};
  const low = {};
  const parent = {};
  const articulationPoints = new Set();

  function dfs(u) {
    let children = 0;
    visited[u] = true;
    disc[u] = low[u] = time++;

    const neighbors = adjacency[u] || [];
    for (const v of neighbors) {
      if (!visited[v]) {
        children++;
        parent[v] = u;
        dfs(v);

        low[u] = Math.min(low[u], low[v]);

        // u є точкою зчленування в двох випадках:

        // 1) u - корінь DFS дерева і має більше одного нащадка
        if (parent[u] === null && children > 1) {
          articulationPoints.add(u);
        }

        // 2) u - не корінь і low[v] >= disc[u]
        if (parent[u] !== null && low[v] >= disc[u]) {
          articulationPoints.add(u);
        }
      } else if (v !== parent[u]) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  }

  // Запускаємо DFS для всіх компонент
  nodes.forEach(node => {
    const nodeId = node.id();
    if (!visited[nodeId]) {
      parent[nodeId] = null;
      dfs(nodeId);
    }
  });

  const articulationPointsList = Array.from(articulationPoints);

  return {
    success: true,
    algorithm: 'Articulation Points (Tarjan)',
    articulationPoints: articulationPointsList,
    articulationPointCount: articulationPointsList.length,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    graphType: 'неорієнтований',
    message: articulationPointsList.length > 0
      ? `Знайдено ${articulationPointsList.length} точок зчленування`
      : 'Точок зчленування не знайдено - граф є 2-вершинно зв\'язним'
  };
}

/**
 * Знаходить і мости і точки зчленування одночасно
 * Ефективніше ніж викликати обидва алгоритми окремо
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим (має бути false)
 * @returns {Object} Результат з мостами та точками зчленування
 */
export function findBridgesAndArticulationPoints(cy, isDirected = false) {
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

  if (isDirected) {
    return {
      error: "Алгоритм не застосовний",
      details: "Ці алгоритми класично визначені для неорієнтованих графів",
      graphType: 'орієнтований'
    };
  }

  // Будуємо список суміжності
  const adjacency = {};
  const edgeMap = {};

  nodes.forEach(node => {
    adjacency[node.id()] = [];
  });

  edges.forEach(edge => {
    const source = edge.data('source');
    const target = edge.data('target');
    adjacency[source].push(target);
    adjacency[target].push(source);

    const key1 = `${source}-${target}`;
    const key2 = `${target}-${source}`;
    edgeMap[key1] = edge;
    edgeMap[key2] = edge;
  });

  // Комбінований алгоритм
  let time = 0;
  const visited = {};
  const disc = {};
  const low = {};
  const parent = {};
  const bridges = [];
  const articulationPoints = new Set();

  function dfs(u) {
    let children = 0;
    visited[u] = true;
    disc[u] = low[u] = time++;

    const neighbors = adjacency[u] || [];
    for (const v of neighbors) {
      if (!visited[v]) {
        children++;
        parent[v] = u;
        dfs(v);

        low[u] = Math.min(low[u], low[v]);

        // Перевірка на міст
        if (low[v] > disc[u]) {
          bridges.push({ source: u, target: v });
        }

        // Перевірка на точку зчленування
        if (parent[u] === null && children > 1) {
          articulationPoints.add(u);
        }
        if (parent[u] !== null && low[v] >= disc[u]) {
          articulationPoints.add(u);
        }
      } else if (v !== parent[u]) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  }

  // Запускаємо DFS
  nodes.forEach(node => {
    const nodeId = node.id();
    if (!visited[nodeId]) {
      parent[nodeId] = null;
      dfs(nodeId);
    }
  });

  const articulationPointsList = Array.from(articulationPoints);

  return {
    success: true,
    algorithm: 'Bridges & Articulation Points',
    bridges: bridges,
    bridgeCount: bridges.length,
    articulationPoints: articulationPointsList,
    articulationPointCount: articulationPointsList.length,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    graphType: 'неорієнтований',
    message: `Знайдено ${bridges.length} мостів та ${articulationPointsList.length} точок зчленування`
  };
}
