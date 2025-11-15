/**
 * UIManager - клас для управління користувацьким інтерфейсом та взаємодією
 */
export class UIManager {
  constructor(graphManager, gridManager, historyManager, algorithms, importExportManager) {
    this.graphManager = graphManager;
    this.gridManager = gridManager;
    this.historyManager = historyManager;
    this.algorithms = algorithms;
    this.importExportManager = importExportManager;

    this.setupEventListeners();
    this.setupZoomDisplay();
  }

  /**
   * Налаштування всіх слухачів подій
   */
  setupEventListeners() {
    this.setupGraphEventListeners();
    this.setupButtonEventListeners();
    this.setupGridControls();
  }

  /**
   * Налаштування подій графа
   */
  setupGraphEventListeners() {
    const cy = this.graphManager.cy;

    // Клік по фону
    cy.on("tap", (event) => {
      if (this.graphManager.activeMode === "node" && event.target === cy) {
        const position = event.position;
        if (!this.graphManager.isTooClose(position)) {
          this.graphManager.addNode(
            position,
            this.gridManager.isSnapEnabled() ? this.gridManager.snapToGrid.bind(this.gridManager) : null
          );
          this.historyManager.saveState();
        }
      }

      if (event.target === cy) {
        cy.$('.selected').removeClass('selected');
        cy.$('.highlighted').removeClass('highlighted');
        this.graphManager.selectedNodeId = null;
        cy.elements().removeClass('active-node');
        cy.elements().removeClass('active-edge');
      }
    });

    // Клік по вузлу
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      cy.elements().removeClass('active-node');
      node.addClass('active-node');
    });

    // Клік по ребру
    cy.on('tap', 'edge', (event) => {
      const edge = event.target;
      cy.elements().removeClass('active-edge');
      edge.addClass('active-edge');
    });

    // Подвійний клік по ребру для редагування ваги
    cy.on("dblclick", "edge", (event) => {
      if (this.graphManager.activeMode !== "arrow") return;

      const edge = event.target;
      const edgePosition = event.renderedPosition;
      this.showEdgeWeightInput(edge, edgePosition);
    });

    // Прив'язка до сітки після перетягування
    cy.on('free', 'node', (evt) => {
      if (!this.gridManager.isSnapEnabled()) return;
      const node = evt.target;
      const pos = node.position();
      const snappedPos = this.gridManager.snapToGrid(pos);
      node.position(snappedPos);
      this.historyManager.saveState();
    });

    // Підсвічування при наведенні в режимі додавання ребер
    cy.on('mouseover', 'node', (event) => {
      if (this.graphManager.activeMode === "edge") {
        event.target.addClass('highlighted');
      }
    });

    cy.on('mouseout', 'node', (event) => {
      if (this.graphManager.activeMode === "edge") {
        event.target.removeClass('highlighted');
      }
    });
  }

  /**
   * Показ поля для введення ваги ребра
   */
  showEdgeWeightInput(edge, position) {
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Enter weight";
    input.value = edge.data("weight") || "";
    Object.assign(input.style, {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: "translate(-50%, -50%)",
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      zIndex: "1000",
    });

    document.body.appendChild(input);
    input.focus();

    const saveValue = () => {
      const weight = input.value.trim();
      edge.data("weight", weight || "");
      document.body.removeChild(input);
      this.historyManager.saveState();
    };

    input.addEventListener("blur", saveValue);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveValue();
    });
  }

  /**
   * Налаштування кнопок
   */
  setupButtonEventListeners() {
    // Режими роботи
    const mouseArrowBtn = document.getElementById("mouseArrow");
    if (mouseArrowBtn) {
      mouseArrowBtn.addEventListener("click", () => {
        this.graphManager.setMode("arrow");
      });
    }

    const addNodeBtn = document.getElementById("addNode");
    if (addNodeBtn) {
      addNodeBtn.addEventListener("click", () => {
        this.graphManager.setMode("node");
      });
    }

    const addEdgeBtn = document.getElementById("addEdge");
    if (addEdgeBtn) {
      addEdgeBtn.addEventListener("click", () => {
        if (this.graphManager.activeMode !== "edge") {
          this.graphManager.enableEdgeMode();
        } else {
          this.graphManager.disableEdgeMode();
        }
      });
    }

    // Очищення графа
    const clearGraphBtn = document.getElementById("clearGraph");
    if (clearGraphBtn) {
      clearGraphBtn.addEventListener("click", () => {
        this.graphManager.clearGraph();
        this.historyManager.saveState();
      });
    }

    // Undo/Redo
    const undoBtn = document.getElementById("undo");
    if (undoBtn) {
      undoBtn.addEventListener("click", () => {
        this.historyManager.undo();
      });
    }

    const redoBtn = document.getElementById("redo");
    if (redoBtn) {
      redoBtn.addEventListener("click", () => {
        this.historyManager.redo();
      });
    }

    // Тип графа
    const directedCheckbox = document.getElementById("directedGraph");
    if (directedCheckbox) {
      directedCheckbox.addEventListener("change", () => {
        const isDirected = directedCheckbox.checked;
        this.graphManager.setDirected(isDirected);
        this.algorithms.setDirected(isDirected);
      });
    }

    // Інформація про граф
    const getInfoBtn = document.getElementById("getInfo");
    if (getInfoBtn) {
      getInfoBtn.addEventListener("click", () => {
        this.displayGraphInfo();
      });
    }

    // Алгоритми
    const calculateMSTBtn = document.getElementById("calculateMST");
    if (calculateMSTBtn) {
      calculateMSTBtn.addEventListener("click", () => {
        this.calculateMST();
      });
    }

    const findPathBtn = document.getElementById("findPath");
    if (findPathBtn) {
      findPathBtn.addEventListener("click", () => {
        this.findShortestPath();
      });
    }

    const findMinPathBtn = document.getElementById("findMinPath");
    if (findMinPathBtn) {
      findMinPathBtn.addEventListener("click", () => {
        this.findMinWeightedPath();
      });
    }

    const listSpanningTreesBtn = document.getElementById("listSpanningTrees");
    if (listSpanningTreesBtn) {
      listSpanningTreesBtn.addEventListener("click", async () => {
        await this.listSpanningTrees();
      });
    }

    const eulerBtn = document.getElementById("eulerCalculation");
    if (eulerBtn) {
      eulerBtn.addEventListener("click", () => {
        this.calculateEuler();
      });
    }

    const hamiltonianBtn = document.getElementById("hamiltonianCalculation");
    if (hamiltonianBtn) {
      hamiltonianBtn.addEventListener("click", () => {
        this.calculateHamiltonian();
      });
    }

    // Імпорт/Експорт
    const exportBtn = document.getElementById("exportGraph");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.importExportManager.exportToFile();
      });
    }

    const importInput = document.getElementById("importGraph");
    if (importInput) {
      importInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        this.importExportManager.importFromFile(file, (success, message) => {
          if (success) {
            this.historyManager.saveState();
            console.log(message);
          } else {
            alert(message);
          }
        });
      });
    }
  }

  /**
   * Налаштування контролів сітки
   */
  setupGridControls() {
    const toggleSnapCheckbox = document.getElementById("toggleSnap");
    if (toggleSnapCheckbox) {
      toggleSnapCheckbox.addEventListener("change", (e) => {
        this.gridManager.setSnapEnabled(e.target.checked);
      });
    }

    const gridSizeInput = document.getElementById("gridSizeInput");
    if (gridSizeInput) {
      gridSizeInput.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10);
        this.gridManager.setGridSize(val);
      });
    }
  }

  /**
   * Налаштування відображення зуму
   */
  setupZoomDisplay() {
    const zoomDisplay = document.getElementById("zoomDisplay");
    if (!zoomDisplay) return;

    const updateZoom = () => {
      zoomDisplay.innerText = `Zoom: ${(this.graphManager.cy.zoom() * 100).toFixed(0)}%`;
    };

    this.graphManager.cy.on("zoom", updateZoom);
    updateZoom();
  }

  /**
   * Відображення інформації про граф
   */
  displayGraphInfo() {
    const info = this.graphManager.getGraphInfo();
    const nodesFormula = `V = \\{ ${info.nodes.join(", ")} \\}`;

    const edgesFormula = info.edges.map(edge => {
      const weight = edge.weight !== "N/A" ? `, w = ${edge.weight}` : "";
      return `(${edge.source}, ${edge.target}${weight})`;
    }).join(", ");

    const edgesFormatted = `E = \\{ ${edgesFormula} \\}`;
    const graphType = info.isDirected ? "Directed" : "Undirected";

    const infoContent = `
      <strong>Graph Info:</strong><br>
      $${nodesFormula}$<br>
      $${edgesFormatted}$<br>
      Graph Type: <strong>${graphType}</strong>
    `;

    document.getElementById("info").innerHTML = infoContent;
    MathJax.typeset();
  }

  /**
   * Обчислення MST
   */
  calculateMST() {
    const result = this.algorithms.calculatePrimMST();

    if (result.error) {
      document.getElementById("info").innerHTML = `
        <strong>MST:</strong><br>
        ${result.error}
      `;
      MathJax.typeset();
      return;
    }

    const mstEdges = result.mst;
    const mstInfo = mstEdges.map(edge =>
      `$w_{(${edge.source},${edge.target})} = ${edge.weight}$`
    ).join("<br>");

    document.getElementById("info").innerHTML = `
      <strong>MST:</strong><br>
      ${mstInfo}
    `;

    this.graphManager.highlightEdges(mstEdges);
    MathJax.typeset();
  }

  /**
   * Знаходження найкоротшого шляху
   */
  findShortestPath() {
    const sourceNode = document.getElementById('sourceNode').value.trim();
    const targetNode = document.getElementById('targetNode').value.trim();

    if (!this.graphManager.cy.$('#' + sourceNode).length ||
        !this.graphManager.cy.$('#' + targetNode).length) {
      alert("Invalid source or target node!");
      return;
    }

    const result = this.algorithms.findShortestPath(sourceNode, targetNode);
    const pathDisplay = result.path.join(' -> ');
    const distanceFormula = `$d(${sourceNode},${targetNode}) = ${result.distance}$`;

    document.getElementById('info').innerHTML = `
      <strong>Shortest Path:</strong><br>
      Path: ${pathDisplay}<br>
      Distance: ${distanceFormula}
    `;

    this.graphManager.highlightPath(result.path);
    MathJax.typeset();
  }

  /**
   * Знаходження мінімального зваженого шляху для 4 вершин
   */
  findMinWeightedPath() {
    const result = this.algorithms.findMinWeightedPathForFourVertices();

    if (typeof result === 'string') {
      document.getElementById("info").innerHTML = result;
      MathJax.typeset();
      return;
    }

    if (result.error) {
      document.getElementById("info").innerHTML = result.error;
      MathJax.typeset();
      return;
    }

    this.graphManager.highlightNodesAndEdges(result.nodes, result.edges);

    const formattedPath = result.nodes.map((node, i) =>
      i < result.nodes.length - 1
        ? `(${node} \\to ${result.nodes[i + 1]})`
        : null
    ).filter(Boolean).join(", ");

    const content = `
      $\\text{Minimum Weighted Path for 4 Vertices:}$<br>
      $\\text{Path: } \\{ ${formattedPath} \\}$<br>
      $\\text{Total Weight: } ${result.weight}$
    `;

    document.getElementById("info").innerHTML = content;
    MathJax.typeset();
  }

  /**
   * Список всіх остовних дерев
   */
  async listSpanningTrees() {
    this.showLoader();
    await new Promise(resolve => setTimeout(resolve, 100));

    const spanningTrees = this.algorithms.generateAllSpanningTrees();
    const infoElement = document.getElementById('info');

    this.hideLoader();

    if (spanningTrees.length === 0) {
      infoElement.innerHTML = "No spanning trees found.";
      MathJax.typeset();
      return;
    }

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

      return `$T_{${index + 1}} = (V_{${index + 1}}, E_{${index + 1}}), \quad V_{${index + 1}} = \\{${V_str}\\}, \quad E_{${index + 1}} = \\{${E_str}\\}$`;
    }).join("<br><br>");

    infoElement.innerHTML = `
      <strong>Spanning Trees:</strong><br>
      ${result}
    `;

    MathJax.typeset();
  }

  /**
   * Обчислення Ейлерових шляхів/циклів
   */
  calculateEuler() {
    const result = this.algorithms.findEulerTrailAndCircuit();
    document.getElementById("info").innerHTML = `<strong>Euler Result:</strong><br>${result}`;
  }

  /**
   * Обчислення Гамільтонових циклів
   */
  calculateHamiltonian() {
    const result = this.algorithms.findHamiltonianCycles();
    document.getElementById("info").innerHTML = `<strong>Hamiltonian Cycles:</strong><br>${result}`;
  }

  /**
   * Показати лоадер
   */
  showLoader() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  /**
   * Сховати лоадер
   */
  hideLoader() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
}
