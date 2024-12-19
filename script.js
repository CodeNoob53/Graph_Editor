document.addEventListener("DOMContentLoaded", () => {
  // Реєструємо плагін edgehandles
  const cy = cytoscape({
    container: document.getElementById('cy'),
    minZoom: 0.1,         // нижній ліміт масштабу
    maxZoom: 4.0,         // верхній ліміт масштабу = 400%
    wheelSensitivity: 0.05, // крок збільшення/зменшення при коліщаті ~5%
    zoom: 1.0,            // початковий зум (100%)
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#5F8670',
          'label': 'data(id)',
          'width': 38,
          'height': 38,
          'color': 'white',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '26px',
          'border-width': 1,
          'border-color': '#005bb5',
          'border-style': 'solid',
          // Параметри для активної зони
          'padding': '5px', // Збільшення хітбокса на 50%

          'events': 'yes', // Дозвіл на події
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#6599ed',
          'target-arrow-color': '#3676ff',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(weight)',
          'font-size': '12px',
          'color': 'black',
          'text-background-color': '#ffffff',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle',
          'text-background-padding': '2px',
          'text-border-color': '#ccc',
          'text-border-width': '1px',
          'text-border-style': 'solid',
          'text-border-opacity': 1
        }
      },
      {
        selector: 'edge[weight]', // Тільки для ребер із полем `weight`
        style: {
          'label': 'data(weight)',
          'font-size': '12px',
          'color': 'black',
          'text-background-color': '#ffffff',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle'
        }
      },
      {
        selector: ".highlighted",
        style: {
          "background-color": "#ff5d00",
          "line-color": "#ff5d00",
          "target-arrow-color": "#f7ba80"
        }
      },
      // some style for the extension

      {
        selector: '.eh-handle',
        style: {
          'background-color': 'red',
          'width': 12,
          'height': 12,
          'shape': 'ellipse',
          'overlay-opacity': 0,
          'border-width': 12, // makes the handle easier to hit
          'border-opacity': 0
        }
      },

      {
        selector: '.eh-hover',
        style: {
          'background-color': 'red'
        }
      },

      {
        selector: '.eh-source',
        style: {
          'border-width': 2,
          'border-color': 'red'
        }
      },

      {
        selector: '.eh-target',
        style: {
          'border-width': 2,
          'border-color': 'red'
        }
      },

      {
        selector: '.eh-preview, .eh-ghost-edge',
        style: {
          'background-color': 'red',
          'line-color': 'red',
          'target-arrow-color': 'red',
          'source-arrow-color': 'red'
        }
      },

      {
        selector: '.eh-ghost-edge.eh-preview-active',
        style: {
          'opacity': 0
        }
      },
      // Новий стиль для активної вершини
      {
        selector: '.active-node',
        style: {
          'background-color': 'black', // Золотий колір
          'border-color': '#FF8C00',     // Темно-помаранчевий колір
          'border-width': '2px',
          'background-opacity': 0.8
        }
      },
      {
        selector: '.active-edge',
        style: {
          'line-color': '#FFD700',
          'width': '4px',
          'target-arrow-color': '#FFD700',
          'source-arrow-color': '#FFD700',
          'opacity': 1
        }
      }
    ],
    layout: { name: 'grid', rows: 1 }
  });

  updateEdgeStyle();

  const eh = cy.edgehandles({
    snap: true, // Вмикає прив'язку
    handleNodes: 'node', // Ноди, на яких працює хендл
    handleSize: 10, // Розмір хендла
    handleColor: 'red', // Колір хендла
    hoverDelay: 150, // Затримка перед показом хендла
    edgeType: (sourceNode, targetNode) => {
      return isDirected ? 'flat' : 'node';
    },
    edgeParams: (sourceNode, targetNode) => {
      return {
        data: {
          source: sourceNode.id(),
          target: targetNode.id(),
        },
        classes: isDirected ? 'directed' : '',
      };
    },
  });


  let nodeCount = 0;
  let gridSize = 50;
  let activeMode = "arrow";
  let selectedNodeId = null;
  let snapEnabled = true;
  let undoStack = [];
  let redoStack = [];
  let isDirected = true; // За замовчуванням граф направлений


  const nodeRadius = 30;

  // Функція для збереження стану графа в стек історії
  function saveHistory() {
    // Зберігаємо глибоку копію поточного стану графа
    const currentState = JSON.parse(JSON.stringify(cy.json()));
    undoStack.push(currentState);
    // Очищаємо стек redo після нової дії
    redoStack = [];
  }

  function setMode(mode) {
    activeMode = mode;
    selectedNodeId = null;
  }

  // Відображення масштабу
  const zoomDisplay = document.createElement("div");
  zoomDisplay.id = "zoomDisplay";

  document.body.appendChild(zoomDisplay);

  function updateZoomDisplay() {
    zoomDisplay.innerText = `Zoom: ${(cy.zoom() * 100).toFixed(0)}%`;
  }
  cy.on("zoom", updateZoomDisplay);
  updateZoomDisplay();

  // ---------------------- Алгоритми ----------------------
  function calculatePrimMST(cy) {
    const nodes = cy.nodes();
    if (nodes.length === 0) return { error: "Graph is empty." };

    const edges = cy.edges().map((edge) => ({
      source: edge.data("source"),
      target: edge.data("target"),
      weight: parseFloat(edge.data("weight")) || Infinity,
    }));

    const graph = {};
    nodes.forEach((node) => { graph[node.id()] = []; });

    edges.forEach((edge) => {
      graph[edge.source].push({ node: edge.target, weight: edge.weight });
      graph[edge.target].push({ node: edge.source, weight: edge.weight });
    });

    const mst = [];
    const visited = new Set();
    const minHeap = [{ node: nodes[0].id(), weight: 0, parent: null }];

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
        });
      }

      graph[current.node].forEach((neighbor) => {
        if (!visited.has(neighbor.node)) {
          minHeap.push({
            node: neighbor.node,
            weight: neighbor.weight,
            parent: current.node,
          });
        }
      });
    }

    if (visited.size !== nodes.length) {
      return { error: "Graph is disconnected." };
    }

    return { mst };
  }

  function findShortestPath(cy, source, target) {
    const nodes = cy.nodes().map(node => node.id());
    const edges = cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
      weight: parseFloat(edge.data('weight')) || Infinity
    }));

    const distances = {};
    const previous = {};
    const unvisited = new Set(nodes);

    nodes.forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    distances[source] = 0;

    while (unvisited.size > 0) {
      let currentNode = null;
      unvisited.forEach(node => {
        if (currentNode === null || distances[node] < distances[currentNode]) {
          currentNode = node;
        }
      });

      if (distances[currentNode] === Infinity) break;
      unvisited.delete(currentNode);

      edges.forEach(edge => {
        if (edge.source === currentNode && unvisited.has(edge.target)) {
          const alt = distances[currentNode] + edge.weight;
          if (alt < distances[edge.target]) {
            distances[edge.target] = alt;
            previous[edge.target] = currentNode;
          }
        } else if (edge.target === currentNode && unvisited.has(edge.source)) {
          const alt = distances[currentNode] + edge.weight;
          if (alt < distances[edge.source]) {
            distances[edge.source] = alt;
            previous[edge.source] = currentNode;
          }
        }
      });
    }

    const path = [];
    let currentNode = target;
    while (currentNode !== null) {
      path.unshift(currentNode);
      currentNode = previous[currentNode];
    }

    if (path[0] !== source) {
      return { path: [], distance: Infinity };
    }

    return { path, distance: distances[target] };
  }

  // Очищаємо підсвітку
  function clearHighlights() {
    cy.elements().removeClass('highlighted');
  }

  // Підсвічує шлях (массив вузлів)
  function highlightPath(path) {
    clearHighlights();
    path.forEach((nodeId, index) => {
      cy.$(`#${nodeId}`).addClass('highlighted');
      if (index < path.length - 1) {
        const edge = cy.edges().filter(edge => {
          const source = edge.data('source');
          const target = edge.data('target');
          return (
            (source === nodeId && target === path[index + 1]) ||
            (target === nodeId && source === path[index + 1])
          );
        });
        edge.addClass('highlighted');
      }
    });
  }

  // Підсвічує набір ребер (наприклад MST)
  function highlightEdges(mstEdges) {
    clearHighlights();
    const nodesToHighlight = new Set();
    mstEdges.forEach(edgeInfo => {
      const edge = cy.edges().filter(e => {
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });
      edge.addClass('highlighted');
      nodesToHighlight.add(edgeInfo.source);
      nodesToHighlight.add(edgeInfo.target);
    });
    nodesToHighlight.forEach(nodeId => cy.$(`#${nodeId}`).addClass('highlighted'));
  }


  // Підсвічує довільний набір вузлів та ребер (наприклад для результатів з 4 вершинами)
  function highlightNodesAndEdges(nodes, edges) {
    clearHighlights();
    nodes.forEach(nodeId => {
      cy.$(`#${nodeId}`).addClass('highlighted');
    });
    edges.forEach(edgeInfo => {
      const edge = cy.edges().filter(e => {
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });
      edge.addClass('highlighted');
    });
  }

  function findMinWeightedPathForFourVertices(cy) {
    if (!cy || typeof cy.nodes !== "function") {
      return "Error: Graph is not initialized properly.";
    }

    const nodes = cy.nodes().map(node => node.id());
    if (nodes.length < 4) return "Not enough vertices (minimum 4 required).";

    const edges = cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
      weight: parseFloat(edge.data('weight')) || Infinity,
    }));

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

    // Отримуємо всі комбінації по 4 вершини
    const combinations = getCombinations(nodes, 4);

    // Для кожної комбінації обчислюємо мінімальний шлях
    for (const combination of combinations) {
      const [u, v, x, y] = combination;

      // Обчислюємо всі шляхи між чотирма вершинами
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
      return "No valid path found.";
    }

    // Підсвітка шляху
    highlightNodesAndEdges(
      bestPath,
      bestPath.slice(1).map((node, i) => ({
        source: bestPath[i],
        target: node
      }))
    );

    // Форматуємо результат
    const formattedPath = bestPath.map((node, i) =>
      i < bestPath.length - 1
        ? `(${node} \\to ${bestPath[i + 1]})`
        : null
    ).filter(Boolean).join(", ");

    return `
        $\\text{Minimum Weighted Path for 4 Vertices:}$<br>
        $\\text{Path: } \\{ ${formattedPath} \\}$<br>
        $\\text{Total Weight: } ${minWeight}$
    `;
  }


  function generateAllSpanningTrees(cy) {
    const nodes = cy.nodes().map(node => node.id());
    const edges = cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
      weight: parseFloat(edge.data('weight')) || 0,
    }));

    const subsets = getCombinations(edges, nodes.length - 1);
    const spanningTrees = subsets.filter(subset => isSpanningTree(nodes, subset));
    return spanningTrees;
  }

  // Допоміжні для MST/комбінацій
  function getCombinations(array, size) {
    const result = [];
    (function helper(start, combo) {
      if (combo.length === size) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < array.length; i++) {
        combo.push(array[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    })(0, []);
    return result;
  }

  function extractSubGraph(nodes, edges) {
    return edges.filter(edge =>
      nodes.includes(edge.source) && nodes.includes(edge.target) && edge.weight !== Infinity
    );
  }

  function calculateMSTSum(subGraph) {
    if (subGraph.length < 3) return Infinity;

    const graph = {};
    subGraph.forEach(edge => {
      if (!graph[edge.source]) graph[edge.source] = [];
      if (!graph[edge.target]) graph[edge.target] = [];
      graph[edge.source].push({ node: edge.target, weight: edge.weight });
      graph[edge.target].push({ node: edge.source, weight: edge.weight });
    });

    const visited = new Set();
    const minHeap = [{ node: Object.keys(graph)[0], weight: 0 }];
    let sum = 0;

    while (minHeap.length > 0) {
      minHeap.sort((a, b) => a.weight - b.weight);
      const current = minHeap.shift();

      if (visited.has(current.node)) continue;
      visited.add(current.node);
      sum += current.weight;

      if (graph[current.node]) {
        graph[current.node].forEach(neighbor => {
          if (!visited.has(neighbor.node)) {
            minHeap.push({ node: neighbor.node, weight: neighbor.weight });
          }
        });
      }
    }

    return visited.size === Object.keys(graph).length ? sum : Infinity;
  }

  function isSpanningTree(nodes, edges) {
    if (edges.length !== nodes.length - 1) return false;

    const graph = {};
    nodes.forEach(node => (graph[node] = []));
    edges.forEach(edge => {
      graph[edge.source].push(edge.target);
      graph[edge.target].push(edge.source);
    });

    const visited = new Set();
    (function dfs(node) {
      if (visited.has(node)) return;
      visited.add(node);
      graph[node].forEach(neighbor => dfs(neighbor));
    })(nodes[0]);

    return visited.size === nodes.length;
  }

  // ------------------ сітка Cytoscape -----------------
  // Функція для прив’язки координат до сітки
  function snapToGrid(pos) {
    const x = Math.round(pos.x / gridSize) * gridSize;
    const y = Math.round(pos.y / gridSize) * gridSize;
    return { x, y };
  }

  // Обробник зміни налаштувань сітки
  document.getElementById('toggleSnap').addEventListener('change', (e) => {
    snapEnabled = e.target.checked;
  });

  document.getElementById('gridSizeInput').addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      gridSize = val;
    }
  });

  // ------------------ Обробники подій Cytoscape -----------------

  cy.on("tap", (event) => {
    // Якщо клік по фону та режим node
    if (activeMode === "node" && event.target === cy) {
      const position = event.position;
      const isTooClose = cy.nodes().some((node) => {
        const nodePos = node.position();
        const distance = Math.hypot(nodePos.x - position.x, nodePos.y - position.y);
        return distance < nodeRadius;
      });

      if (!isTooClose) {
        let finalPosition = position;
        if (snapEnabled) {
          finalPosition = snapToGrid(position);
        }

        cy.add({
          group: "nodes",
          data: { id: `v${nodeCount++}` },
          position: finalPosition,
        });
        saveHistory && saveHistory();
      }
    }

    // Якщо клік по фону в іншому режимі - чистимо підсвітку та активні вузли
    if (event.target === cy) {
      cy.$('.selected').removeClass('selected');
      cy.$('.highlighted').removeClass('highlighted');
      selectedNodeId = null;

      // Знімаємо підсвітку для активних вузлів та ребер
      cy.elements().removeClass('active-node');
      cy.elements().removeClass('active-edge');
    }
  });


  // Створення ребер
  cy.on('tap', 'node', (event) => {
    const node = event.target;
    // Знімаємо попередні підсвітки
    cy.elements().removeClass('active-node');
    // Додаємо клас до поточної вершини
    node.addClass('active-node');
    if (activeMode !== "edge") return; // Створення ребер дозволено лише в режимі "edge"

    const nodeId = event.target.id();
    console.log(`Tapped on node ${nodeId}`);

  });

  cy.on('tap', 'edge', (event) => {
    const edge = event.target;

    // Знімаємо попередні підсвітки
    cy.elements().removeClass('active-edge');

    // Додаємо клас до поточного ребра
    edge.addClass('active-edge');
  });



  // Прив’язка до сітки після перетягування вузла
  cy.on('free', 'node', (evt) => {
    if (!snapEnabled) return;
    const node = evt.target;
    const pos = node.position();
    const snappedPos = snapToGrid(pos);
    node.position(snappedPos);
    saveHistory && saveHistory();
  });


  cy.on("dblclick", "edge", (event) => {
    if (activeMode !== "arrow") return;

    const edge = event.target;
    const edgePosition = event.renderedPosition;
    const input = document.createElement("input");

    input.type = "number";
    input.placeholder = "Enter weight";
    input.value = edge.data("weight") || "";
    Object.assign(input.style, {
      position: "absolute",
      left: `${edgePosition.x}px`,
      top: `${edgePosition.y}px`,
      transform: "translate(-50%, -50%)",
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      zIndex: "1000",
    });

    document.body.appendChild(input);
    input.focus();

    function saveValue() {
      const weight = input.value.trim();
      edge.data("weight", weight || "");
      document.body.removeChild(input);
      saveHistory();
    }

    input.addEventListener("blur", saveValue);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveValue();
    });
  });

  cy.on('mouseover', 'node', (event) => {
    if (activeMode === "edge") {
      event.target.addClass('highlighted');
    }
  });

  cy.on('mouseout', 'node', (event) => {
    if (activeMode === "edge") {
      event.target.removeClass('highlighted');
    }
  });

  eh.edgeParams = (sourceNode, targetNode) => {
    if (sourceNode.id() === targetNode.id()) {
      console.log('Self-loops are not allowed.');
      return null;
    }

    const existingEdge = cy.edges().some(edge =>
      (edge.source().id() === sourceNode.id() && edge.target().id() === targetNode.id()) ||
      (edge.source().id() === targetNode.id() && edge.target().id() === sourceNode.id())
    );

    if (existingEdge) {
      console.log('Duplicate edges are not allowed.');
      return null;
    }

    return { data: { source: sourceNode.id(), target: targetNode.id() } };
  };

  const editor = document.getElementById('editor');
  editor.appendChild(zoomDisplay);
  const gridCanvas = document.getElementById('gridCanvas');
  const ctx = gridCanvas.getContext('2d');

  // Функція для малювання сітки
  function drawGrid() {
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    const pan = cy.pan();
    const zoom = cy.zoom();

    // Розмір вікна у пікселях
    const w = cy.width();
    const h = cy.height();

    // Знаходимо верхню ліву точку в світових координатах (model coordinates)
    // Світові координати: (worldX, worldY)
    // Екранні координати: screenX = worldX * zoom + pan.x
    // Відповідно: worldX = (screenX - pan.x) / zoom
    const topLeft = {
      x: (-pan.x) / zoom,
      y: (-pan.y) / zoom
    };

    // Знаходимо нижню праву точку в світових координатах
    const bottomRight = {
      x: (w - pan.x) / zoom,
      y: (h - pan.y) / zoom
    };

    const gridLineColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--grid-line-color')
      .trim();
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;

    // Знаходимо першу лінію по X, яка потрапляє у видиму область
    const startWorldX = Math.floor(topLeft.x / gridSize) * gridSize;
    const endWorldX = Math.ceil(bottomRight.x / gridSize) * gridSize;

    // Вертикальні лінії
    for (let x = startWorldX; x <= endWorldX; x += gridSize) {
      const screenX = x * zoom + pan.x;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, h);
      ctx.stroke();
    }

    // Горизонтальні лінії
    const startWorldY = Math.floor(topLeft.y / gridSize) * gridSize;
    const endWorldY = Math.ceil(bottomRight.y / gridSize) * gridSize;

    for (let y = startWorldY; y <= endWorldY; y += gridSize) {
      const screenY = y * zoom + pan.y;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(w, screenY);
      ctx.stroke();
    }
  }


  // Перемальовуємо сітку при кожному рендері
  cy.on('render', () => {
    if (snapEnabled) {
      drawGrid();
    } else {
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }
  });

  // При зміні розміру, зуму або ввімкненні/вимкненні сітки, викликаємо оновлення
  document.getElementById('toggleSnap').addEventListener('change', (e) => {
    snapEnabled = e.target.checked;
    cy.emit('render');
  });

  document.getElementById('gridSizeInput').addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      gridSize = val;
      cy.emit('render');
    }
  });

  // ------------------ Кнопки та взаємодія з DOM -----------------
  function setMode(mode) {
    activeMode = mode;
    selectedNodeId = null;

    // Вимикаємо режим edgehandles, якщо це не режим addEdge
    if (mode !== "edge") {
      eh.disableDrawMode(); // Вимикаємо хендли для малювання ребер
    }
  }

  const addNodeButton = document.getElementById("addNode");
  addNodeButton && addNodeButton.addEventListener("click", () => setMode("node"));

  document.getElementById('addEdge').addEventListener('click', () => {
    if (activeMode !== "edge") {
      setMode("edge");
      eh.enableDrawMode(); // Увімкнення візуальних хендлів
    } else {
      setMode("arrow");
      eh.disableDrawMode(); // Вимкнення візуальних хендлів
    }
  });


  const mouseArrowButton = document.getElementById("mouseArrow");
  mouseArrowButton && mouseArrowButton.addEventListener("click", () => setMode("arrow"));

  const clearGraphButton = document.getElementById("clearGraph");
  clearGraphButton && clearGraphButton.addEventListener("click", () => {
    cy.elements().remove();
    nodeCount = 0;
    saveHistory();
  });

  const directedCheckbox = document.getElementById("directedGraph");
  directedCheckbox.addEventListener("change", () => {
    isDirected = directedCheckbox.checked; // Оновлюємо глобальну змінну
    updateEdgeStyle(); // Оновлюємо стиль ребер
    console.log("Graph directed:", isDirected);
  });

  function updateEdgeStyle() {
    cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', isDirected ? 'triangle' : 'none'); // Оновлення стилю стрілок
    });
  }


  const undoButton = document.getElementById('undo');
  undoButton && undoButton.addEventListener('click', () => {
    if (undoStack.length > 1) {
      // Поточний стан
      const currentState = JSON.parse(JSON.stringify(cy.json()));
      // Переносимо поточний стан у redo
      redoStack.push(currentState);
      // Відновлюємо попередній стан з undo
      undoStack.pop();
      const previousState = undoStack[undoStack.length - 1];
      cy.json(previousState);
    }
  });

  const redoButton = document.getElementById('redo');
  redoButton && redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      // Поточний стан у undo
      const currentState = JSON.parse(JSON.stringify(cy.json()));
      undoStack.push(currentState);

      cy.json(nextState);
    }
  });

  const getInfoButton = document.getElementById("getInfo");
  getInfoButton && getInfoButton.addEventListener("click", () => {
    const nodes = cy.nodes().map(node => node.id());
    const edges = cy.edges().map(edge => ({
      source: edge.data("source"),
      target: edge.data("target"),
      weight: edge.data("weight") || "N/A"
    }));

    // Форматування вузлів
    const nodesFormula = `V = \\{ ${nodes.join(", ")} \\}`;

    // Форматування ребер
    const edgesFormula = edges.map(edge => {
      const weight = edge.weight !== "N/A" ? `, w = ${edge.weight}` : "";
      return `(${edge.source}, ${edge.target}${weight})`;
    }).join(", ");

    const edgesFormatted = `E = \\{ ${edgesFormula} \\}`;

    // Додаємо інформацію про тип графа
    const graphType = isDirected ? "Directed" : "Undirected";

    // Форматування виводу
    const infoContent = `
          <strong>Graph Info:</strong><br>
          $${nodesFormula}$<br>
          $${edgesFormatted}$<br>
          Graph Type: <strong>${graphType}</strong>
      `;

    document.getElementById("info").innerHTML = infoContent;

    // Відтворюємо формули MathJax
    MathJax.typeset();
  });


  const calculateMSTButton = document.getElementById("calculateMST");
  calculateMSTButton && calculateMSTButton.addEventListener("click", () => {
    const result = calculatePrimMST(cy);

    if (result.error) {
      document.getElementById("info").innerHTML = `
        <strong>MST:</strong><br>
        ${result.error}
      `;
      // Перевідтворюємо формули
      MathJax.typeset();
      return;
    }

    const mstEdges = result.mst;
    const mstInfo = mstEdges.map(edge =>
      // Наприклад, показуємо вагу у вигляді $w_{(u,v)} = 5$
      `$w_{(${edge.source},${edge.target})} = ${edge.weight}$`
    ).join("<br>");

    document.getElementById("info").innerHTML = `
      <strong>MST:</strong><br>
      ${mstInfo}
    `;

    // Підсвічуємо MST
    highlightEdges(mstEdges);

    // Перевідтворюємо формули MathJax
    MathJax.typeset();
  });

  document.getElementById("eulerCalculation").addEventListener("click", () => {
    if (!cy || typeof cy.nodes !== 'function') {
      document.getElementById("info").innerHTML = "Error: Cytoscape graph not initialized.";
      return;
    }
    const result = findEulerTrailAndCircuit(cy);
    document.getElementById("info").innerHTML = `<strong>Euler Result:</strong><br>${result}`;
  });


  document.getElementById("hamiltonianCalculation").addEventListener("click", () => {
    if (!cy || typeof cy.nodes !== 'function') {
      document.getElementById("info").innerHTML = "Error: Cytoscape graph not initialized.";
      return;
    }
    const result = findHamiltonianCycles(cy);
    document.getElementById("info").innerHTML = `<strong>Hamiltonian Cycles:</strong><br>${result}`;
  });


  function findEulerTrailAndCircuit(cy) {
    const nodes = cy.nodes();
    const edges = cy.edges();

    if (nodes.length === 0 || edges.length === 0) {
      return "Graph is empty.";
    }

    // Перевірка на зв’язність графа
    const connectedComponents = cy.elements().components();
    if (connectedComponents.length > 1) {
      return "Graph is not connected.";
    }

    if (isDirected) {
      // Для орієнтованого графа
      const inDegree = {};
      const outDegree = {};

      // Ініціалізуємо ступені
      nodes.forEach(node => {
        const id = node.id();
        inDegree[id] = 0;
        outDegree[id] = 0;
      });

      // Обчислюємо in-degree та out-degree
      edges.forEach(edge => {
        const source = edge.data('source');
        const target = edge.data('target');
        outDegree[source]++;
        inDegree[target]++;
      });

      let startNodes = 0, endNodes = 0;

      nodes.forEach(node => {
        const id = node.id();
        if (outDegree[id] - inDegree[id] === 1) {
          startNodes++;
        } else if (inDegree[id] - outDegree[id] === 1) {
          endNodes++;
        } else if (Math.abs(inDegree[id] - outDegree[id]) > 1) {
          return "No Euler Trail or Circuit exists.";
        }
      });

      if (startNodes === 0 && endNodes === 0) {
        return "Euler Circuit exists (directed graph).";
      } else if (startNodes === 1 && endNodes === 1) {
        return "Euler Trail exists (directed graph).";
      } else {
        return "No Euler Trail or Circuit exists (directed graph).";
      }
    } else {
      // Для неорієнтованого графа
      const degreeCount = {};

      // Ініціалізуємо ступені
      nodes.forEach(node => {
        degreeCount[node.id()] = 0;
      });

      edges.forEach(edge => {
        const source = edge.data('source');
        const target = edge.data('target');
        degreeCount[source]++;
        degreeCount[target]++;
      });

      const oddVertices = Object.keys(degreeCount).filter(node => degreeCount[node] % 2 !== 0);

      if (oddVertices.length === 0) {
        return "Euler Circuit exists (all degrees are even).";
      } else if (oddVertices.length === 2) {
        return `Euler Trail exists (odd degree vertices: ${oddVertices.join(', ')}).`;
      } else {
        return "No Euler Trail or Circuit exists (more than 2 vertices with odd degree).";
      }
    }
  }


  function findHamiltonianCycles(cy) {
    const nodes = cy.nodes().map(node => node.id());
    const edges = cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
    }));

    const paths = [];
    function hamiltonian(current, visited, path) {
      if (path.length === nodes.length) {
        if (
          isDirected
            ? edges.some(edge => edge.source === current && edge.target === path[0])
            : edges.some(edge =>
              (edge.source === current && edge.target === path[0]) ||
              (edge.target === current && edge.source === path[0])
            )
        ) {
          paths.push([...path, path[0]]);
        }
        return;
      }

      nodes.forEach(next => {
        if (
          !visited.has(next) &&
          (isDirected
            ? edges.some(edge => edge.source === current && edge.target === next)
            : edges.some(edge =>
              (edge.source === current && edge.target === next) ||
              (edge.target === current && edge.source === next))
          )
        ) {
          visited.add(next);
          path.push(next);
          hamiltonian(next, visited, path);
          path.pop();
          visited.delete(next);
        }
      });
    }

    nodes.forEach(start => {
      const visited = new Set([start]);
      hamiltonian(start, visited, [start]);
    });

    return paths.length
      ? `${paths.map(path => path.join(' -> ')).join('<br>')}`
      : "No Hamiltonian Cycles found.";
  }




  const exportGraphButton = document.getElementById('exportGraph');
  exportGraphButton && exportGraphButton.addEventListener('click', () => {
    // Формуємо граф у мінімальному форматі
    const graphData = {
      nodes: cy.nodes().map(node => ({
        data: {
          id: node.id(),
          ...node.data() // Експортуємо всі дані вузлів
        },
        position: node.position() // Додаємо позиції вузлів
      })),
      edges: cy.edges().map(edge => ({
        data: {
          source: edge.data('source'),
          target: edge.data('target'),
          ...edge.data() // Експортуємо всі дані ребер
        }
      }))
    };

    // Зберігаємо в JSON
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'graph.json';
    link.click();
  });


  const importGraphInput = document.getElementById('importGraph');
  importGraphInput && importGraphInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const graphData = JSON.parse(e.target.result);

          // Перевірка і форматування графа
          if (!graphData.nodes || !graphData.edges) {
            throw new Error("Invalid graph format. Must include 'nodes' and 'edges'.");
          }

          // Чистимо старий граф
          cy.elements().remove();

          // Імпортуємо вузли
          graphData.nodes.forEach(node => {
            cy.add({
              group: 'nodes',
              data: { id: node.data.id, ...node.data },
              position: node.position || { x: 0, y: 0 } // Додаємо позицію або дефолтну
            });
          });

          // Імпортуємо ребра
          graphData.edges.forEach(edge => {
            cy.add({
              group: 'edges',
              data: { source: edge.data.source, target: edge.data.target, ...edge.data }
            });
          });

          // Оновлюємо стиль і функціонал після імпорту
          updateEdgeStyle();
          saveHistory();

          console.log("Graph imported successfully.");
        } catch (error) {
          console.error("Error importing graph:", error);
          alert("Failed to import graph. Please check the file format.");
        }
      };
      reader.readAsText(file);
    }
  });


  const findMinPathButton = document.getElementById("findMinPath");
  findMinPathButton && findMinPathButton.addEventListener("click", () => {
    const result = findMinWeightedPathForFourVertices(cy);
    document.getElementById("info").innerHTML = result;
    MathJax.typeset();
  });


  const findPathButton = document.getElementById('findPath');
  findPathButton && findPathButton.addEventListener('click', () => {
    const sourceNode = document.getElementById('sourceNode').value.trim();
    const targetNode = document.getElementById('targetNode').value.trim();

    if (!cy.$('#' + sourceNode).length || !cy.$('#' + targetNode).length) {
      alert("Invalid source or target node!");
      return;
    }

    const shortestPathResult = findShortestPath(cy, sourceNode, targetNode);

    let pathDisplay = shortestPathResult.path.join(' -> ');
    // Наприклад, покажемо дистанцію з формулою:
    const distanceFormula = `$d(${sourceNode},${targetNode}) = ${shortestPathResult.distance}$`;

    document.getElementById('info').innerHTML = `
      <strong>Shortest Path:</strong><br>
      Path: ${pathDisplay}<br>
      Distance: ${distanceFormula}
    `;
    highlightPath(shortestPathResult.path);

    // Оновлюємо MathJax
    MathJax.typeset();
  });


  const listSpanningTreesButton = document.getElementById('listSpanningTrees');
  listSpanningTreesButton && listSpanningTreesButton.addEventListener('click', async () => {
    showLoader(); // Показуємо лоадер перед обчисленнями

    // Використовуємо setTimeout або Promise, щоб дозволити оновленню інтерфейсу (опційно)
    await new Promise(resolve => setTimeout(resolve, 100));

    const spanningTrees = generateAllSpanningTrees(cy);
    const infoElement = document.getElementById('info');

    hideLoader(); // Ховаємо лоадер після завершення розрахунків

    if (spanningTrees.length === 0) {
      infoElement.innerHTML = "No spanning trees found.";
      MathJax.typeset(); // Якщо є формули, оновити
      return;
    }

    // Форматуємо кожне дерево із використанням LaTeX.
    const result = spanningTrees.map((tree, index) => {
      const vertices = new Set();
      tree.forEach(edge => {
        vertices.add(edge.source);
        vertices.add(edge.target);
      });

      const verticesArray = Array.from(vertices).sort();
      const edgesArray = tree.map(edge => `(${edge.source}, ${edge.target})`);

      const V_str = verticesArray.join(', ');
      const E_str = edgesArray.join(', ');

      // Використовуємо LaTeX формат для красивого виводу
      return `$T_{${index + 1}} = (V_{${index + 1}}, E_{${index + 1}}), \quad V_{${index + 1}} = \\{${V_str}\\}, \quad E_{${index + 1}} = \\{${E_str}\\}$`;
    }).join("<br><br>");

    infoElement.innerHTML = `
      <strong>Spanning Trees:</strong><br>
      ${result}
    `;

    // Відтворюємо формули MathJax
    MathJax.typeset();
  });


  // Показати лоадер
  function showLoader() {
    const overlay = document.getElementById('overlay');
    overlay.classList.add('active');
  }

  // Сховати лоадер
  function hideLoader() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('active');
  }

  // Зберігаємо початковий стан (порожній граф) для можливості undo
  saveHistory();
});

