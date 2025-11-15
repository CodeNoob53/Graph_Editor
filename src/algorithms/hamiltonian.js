/**
 * Знаходить Гамільтонові цикли в графі
 * Гамільтонів цикл - це цикл, який проходить через кожну вершину графу рівно один раз
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з інформацією про Гамільтонові цикли
 */
export function findHamiltonianCycles(cy, isDirected = false) {
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

  if (nodes.length < 3) {
    return {
      error: "Недостатньо вершин",
      details: `Для Гамільтонового циклу потрібно мінімум 3 вершини. Поточна кількість: ${nodes.length}`,
      required: 3,
      current: nodes.length
    };
  }

  if (edges.length === 0) {
    return {
      error: "Немає ребер",
      details: "Додайте ребра до графу"
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

    // Для неорієнтованого графу додаємо обернене ребро
    if (!isDirected) {
      adjacency[target].push(source);
    }
  });

  const cycles = [];
  const maxCycles = 100; // Обмежуємо кількість циклів для великих графів

  /**
   * Рекурсивний пошук Гамільтонових циклів
   * @param {string} current - Поточна вершина
   * @param {Set} visited - Відвідані вершини
   * @param {Array} path - Поточний шлях
   * @param {string} start - Початкова вершина
   */
  function findCycles(current, visited, path, start) {
    // Якщо знайшли достатньо циклів, зупиняємося
    if (cycles.length >= maxCycles) {
      return;
    }

    // Якщо відвідали всі вершини
    if (visited.size === nodes.length) {
      // Перевіряємо чи можна повернутися до початку
      const neighbors = adjacency[current] || [];
      if (neighbors.includes(start)) {
        // Знайшли Гамільтонів цикл!
        cycles.push([...path, start]);
      }
      return;
    }

    // Перебираємо сусідів поточної вершини
    const neighbors = adjacency[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);

        findCycles(neighbor, visited, path, start);

        // Backtrack
        visited.delete(neighbor);
        path.pop();
      }
    }
  }

  // Запускаємо пошук від кожної вершини
  // (для уникнення дублікатів будемо шукати тільки від першої вершини)
  const startNode = nodes[0].id();
  const visited = new Set([startNode]);
  const path = [startNode];

  findCycles(startNode, visited, path, startNode);

  if (cycles.length === 0) {
    return {
      error: "Гамільтонові цикли не знайдено",
      details: isDirected
        ? "У даному орієнтованому графі немає Гамільтонових циклів. Граф може не мати достатньо ребер або не задовольняти умовам існування таких циклів."
        : "У даному неорієнтованому графі немає Гамільтонових циклів. Граф може не мати достатньо ребер або не задовольняти умовам існування таких циклів.",
      graphType: isDirected ? 'орієнтований' : 'неорієнтований',
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        checked: true
      }
    };
  }

  // Форматуємо цикли для відображення
  const formattedCycles = cycles.slice(0, 10).map((cycle, index) => {
    const arrow = isDirected ? '→' : '—';
    return `${index + 1}. ${cycle.join(` ${arrow} `)}`;
  });

  const additionalCycles = cycles.length > 10 ? cycles.length - 10 : 0;

  return {
    success: true,
    cycles: cycles,
    count: cycles.length,
    message: `Знайдено Гамільтонових циклів: ${cycles.length}`,
    formattedCycles: formattedCycles,
    showingFirst: Math.min(10, cycles.length),
    additionalCycles: additionalCycles,
    graphType: isDirected ? 'орієнтований' : 'неорієнтований',
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      cycleLength: nodes.length + 1 // +1 бо повертаємося до початку
    }
  };
}

/**
 * Знаходить один Гамільтонів цикл (швидша версія)
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {boolean} isDirected - Чи є граф орієнтованим
 * @returns {Object} Результат з одним циклом або null
 */
export function findOneHamiltonianCycle(cy, isDirected = false) {
  if (!cy || typeof cy.nodes !== "function") {
    return {
      error: "Граф не ініціалізовано",
      details: "Екземпляр Cytoscape не знайдено або пошкоджено"
    };
  }

  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length < 3) {
    return {
      error: "Недостатньо вершин",
      details: `Для Гамільтонового циклу потрібно мінімум 3 вершини`,
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

    if (!isDirected) {
      adjacency[target].push(source);
    }
  });

  let foundCycle = null;

  function findCycle(current, visited, path, start) {
    if (foundCycle) return; // Вже знайшли цикл

    if (visited.size === nodes.length) {
      const neighbors = adjacency[current] || [];
      if (neighbors.includes(start)) {
        foundCycle = [...path, start];
      }
      return;
    }

    const neighbors = adjacency[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);

        findCycle(neighbor, visited, path, start);

        if (foundCycle) return; // Виходимо якщо знайшли

        visited.delete(neighbor);
        path.pop();
      }
    }
  }

  const startNode = nodes[0].id();
  const visited = new Set([startNode]);
  const path = [startNode];

  findCycle(startNode, visited, path, startNode);

  if (!foundCycle) {
    return {
      error: "Гамільтонів цикл не знайдено",
      details: "У даному графі немає Гамільтонових циклів",
    };
  }

  const arrow = isDirected ? '→' : '—';
  return {
    success: true,
    cycle: foundCycle,
    formattedCycle: foundCycle.join(` ${arrow} `),
    graphType: isDirected ? 'орієнтований' : 'неорієнтований'
  };
}
